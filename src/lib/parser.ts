// ═══════════════════════════════════════════════════════════════
// AirCheck Parser v5
// Handles: encoding corruption (Outlook forwarding), abbreviated
// months (fev.), corrupted accents (ã→��, ç→�), flexible patterns
// ═══════════════════════════════════════════════════════════════

// Month lookup - supports abbreviated (3 chars) and full names
const MONTH_MAP: Record<string, number> = {
  jan:0, fev:1, mar:2, abr:3, mai:4, jun:5, jul:6, ago:7, set:8, out:9, nov:10, dez:11,
  janeiro:0, fevereiro:1, marco:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11,
  // English (from forwarded email headers)
  january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11,
};

function matchMonth(raw: string): number | null {
  // Normalize: lowercase, strip accents and replacement chars, strip trailing period
  const clean = raw.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "")   // Unicode replacement char
    .replace(/\?/g, "")        // Sometimes ? appears
    .replace(/\.+$/, "")       // trailing period
    .trim();
  
  // Try exact match first
  if (MONTH_MAP[clean] !== undefined) return MONTH_MAP[clean];
  
  // Try prefix match (3+ chars)
  if (clean.length >= 3) {
    for (const [k, v] of Object.entries(MONTH_MAP)) {
      if (k.startsWith(clean.slice(0, 3))) return v;
    }
  }
  return null;
}

export interface ParsedReservation {
  guestFullName?: string;
  propertyName?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  numGuests: number;
  nights?: number;
  confirmationCode?: string;
  hostPayment?: string;
  guestMessage?: string;
  confidence: "high" | "medium" | "low";
}

export interface ParseResult {
  results: ParsedReservation;
  errors: string[];
}

export function parseAirbnbEmail(rawText: string): ParseResult {
  const r: Record<string, any> = {};
  const errors: string[] = [];

  // ── Email year from forwarded header ────────────────────────
  let emailYear = new Date().getFullYear();
  let emailMonth: number | null = null;

  // Outlook forward: "Enviado: Sunday, February 22, 2026 6:51:30 PM"
  const hdr = rawText.match(/Enviado:\s*\w+,\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/i);
  if (hdr) {
    emailYear = parseInt(hdr[3]);
    emailMonth = matchMonth(hdr[1]);
  }
  // Also try: "Date: Wed, 22 Feb 2026"
  if (emailMonth === null) {
    const hdr2 = rawText.match(/Date:\s*\w+,\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (hdr2) {
      emailYear = parseInt(hdr2[3]);
      emailMonth = matchMonth(hdr2[2]);
    }
  }

  // ── Guest name ──────────────────────────────────────────────
  // From subject: "Reserva confirmada - Caroline Silveira chega em 27 de fev."
  const fromSubject = rawText.match(/Reserva confirmada\s*[-–—]\s*(.+?)\s+chega\s+em/i);
  if (fromSubject) {
    r.guestFullName = fromSubject[1].trim();
  }
  // From body: "Nova reserva confirmada! Caroline chega em ..."
  // Then full name appears later as "Caroline Silveira" before identity verification
  if (!r.guestFullName) {
    const fromNova = rawText.match(/Nova reserva confirmada!\s+(\w[\w\s]*?)\s+chega\s+em/i);
    if (fromNova) r.guestFullName = fromNova[1].trim();
  }
  // From body: full name followed by "Identifica" (handles corrupted ção)
  if (!r.guestFullName) {
    const fromId = rawText.match(/\n\s*([A-ZÀ-Ú\u00C0-\u024F][a-zà-ÿ\u00E0-\u024F]+(?:\s+[A-ZÀ-Ú\u00C0-\u024F][a-zà-ÿ\u00E0-\u024F]+)+)\s*\n[^\n]*?Identifica/m);
    if (fromId) r.guestFullName = fromId[1].trim();
  }
  if (!r.guestFullName) errors.push("Nome do hóspede não encontrado");

  // ── Property name ──────────────────────────────────────────
  // Pattern 1: text before "Casa/apto inteiro" (most reliable)
  const propPreCasa = rawText.match(/\n\s*(.{5,80}?)\s*\n\s*Casa[\/\w\s]*inteiro/i);
  if (propPreCasa) {
    const name = propPreCasa[1].trim();
    if (!name.match(/^(Envie|Nova|Ident|Check|Imagem|http|\[)/i) && name.length > 3) {
      r.propertyName = name;
    }
  }
  // Pattern 2: inline "PropertyName Casa/apto inteiro" (no linebreak)
  if (!r.propertyName) {
    const propInline = rawText.match(/(?:\]|^)\s*([^[\]\n]{5,80}?)\s+Casa[\/\w\s]*inteiro/im);
    if (propInline) {
      const name = propInline[1].trim();
      if (name.length > 3 && !name.match(/^(http|Envie|Nova|<)/i)) {
        r.propertyName = name;
      }
    }
  }
  // Pattern 3: [Property Name] in square brackets — skip known non-property values
  if (!r.propertyName) {
    const bracketRe = /\[([^\]]{5,80}?)\]/g;
    let bm;
    while ((bm = bracketRe.exec(rawText)) !== null) {
      const name = bm[1].trim();
      if (name.match(/^(Airbnb|AirCover|App Store|Google Play|http|Airbnb Ireland|image)/i)) continue;
      if (name.length > 3) { r.propertyName = name; break; }
    }
  }
  if (!r.propertyName) errors.push("Imóvel não encontrado");

  // ── Check-in date ──────────────────────────────────────────
  // Format: "Check-in\nsex., 27 de fev.\n15:00" or "Check-in sex., 27 de fev. 15:00"
  // Day abbrev can be corrupted (s�b. → any chars), so we use very flexible pattern:
  // Match: "Check-in" then optional stuff, then day number "de" month, then time
  const ciMatch = rawText.match(
    /Check[\s-]?in[\s\n]+(?:[^\d\n]{0,12}[.,]\s*)?(\d{1,2})\s+de\s+(\w{3,9})\.?[\s\n]+(\d{1,2}:\d{2})/i
  );
  if (ciMatch) {
    const mo = matchMonth(ciMatch[2]);
    if (mo !== null) {
      let y = emailYear;
      if (emailMonth !== null && mo < emailMonth) y++;
      r.checkInDate = `${ciMatch[1].padStart(2, "0")}/${String(mo + 1).padStart(2, "0")}/${y}`;
      r.checkInTime = ciMatch[3];
      r._ciMonth = mo;
      r._ciYear = y;
    } else {
      errors.push(`Mês de check-in não reconhecido: "${ciMatch[2]}"`);
    }
  } else {
    errors.push("Data de check-in não encontrada");
  }

  // ── Check-out date ─────────────────────────────────────────
  // "Checkout" or "Check-out" or "Check out"
  const coMatch = rawText.match(
    /Check[\s-]?out[\s\n]+(?:[^\d\n]{0,12}[.,]\s*)?(\d{1,2})\s+de\s+(\w{3,9})\.?[\s\n]+(\d{1,2}:\d{2})/i
  );
  if (coMatch) {
    const mo = matchMonth(coMatch[2]);
    if (mo !== null) {
      let y = r._ciYear || emailYear;
      if (r._ciMonth !== undefined && mo < r._ciMonth) y++;
      r.checkOutDate = `${coMatch[1].padStart(2, "0")}/${String(mo + 1).padStart(2, "0")}/${y}`;
      r.checkOutTime = coMatch[3];
    } else {
      errors.push(`Mês de check-out não reconhecido: "${coMatch[2]}"`);
    }
  } else {
    errors.push("Data de check-out não encontrada");
  }

  // ── Number of guests ───────────────────────────────────────
  // "Hóspedes\n2 adultos" — but ó can be corrupted: H.spedes or H\ufffdspedes
  // Use flexible pattern: H + any char + spedes, or just look for "N adultos"
  let guestFound = false;
  const guestPats = [
    /H.spedes[\s\n]+(\d+)\s+(?:adultos?|h.spedes?|pessoas?|viajantes?)/i,
    /H\S*spedes[\s\n]+(\d+)\s+(?:adultos?|h\S*spedes?|pessoas?|viajantes?)/i,
    /(\d+)\s+adultos?/i,
    /(\d+)\s+h.spedes?/i,
  ];
  for (const pat of guestPats) {
    const m = rawText.match(pat);
    if (m) { r.numGuests = parseInt(m[1]); guestFound = true; break; }
  }
  if (!guestFound) {
    r.numGuests = 1;
    errors.push("Nº de hóspedes não encontrado (assumindo 1)");
  }

  // ── Confirmation code ──────────────────────────────────────
  // "Código de confirmação\nHM5T5WBXET" — ó and ç can be corrupted
  // Use: C + any + digo de confirma + any + o, then code
  const codePats = [
    /C.digo\s+de\s+confirma..o[\s\n]+([A-Z0-9]{8,12})/i,
    /C\S*digo\s+de\s+confirma\S*\S*o[\s\n]+([A-Z0-9]{8,12})/i,
    /confirma(?:ção|..o|cao)[\s\n]+([A-Z0-9]{8,12})/i,
    // Fallback: look for standalone 10-char alphanumeric code after certain keywords
    /(?:confirma|c.digo)[\s\S]{0,30}?([A-Z0-9]{10})/i,
  ];
  for (const pat of codePats) {
    const m = rawText.match(pat);
    if (m) { r.confirmationCode = m[1]; break; }
  }
  if (!r.confirmationCode) errors.push("Código não encontrado");

  // ── Host payment ───────────────────────────────────────────
  // "Você recebe\nR$222,46" — ê can be corrupted
  const payPats = [
    /Voc.\s+recebe[\s\n]+R\$\s*([\d.,]+)/i,
    /Voc\S*\s+recebe[\s\n]+R\$\s*([\d.,]+)/i,
    /recebe[\s\n]+R\$\s*([\d.,]+)/i,
  ];
  for (const pat of payPats) {
    const m = rawText.match(pat);
    if (m) { r.hostPayment = `R$ ${m[1]}`; break; }
  }

  // ── Nights ─────────────────────────────────────────────────
  const nm = rawText.match(/(\d+)\s+noites?/i);
  if (nm) {
    r.nights = parseInt(nm[1]);
  } else if (r.checkInDate && r.checkOutDate) {
    const [d1, m1, y1] = r.checkInDate.split("/").map(Number);
    const [d2, m2, y2] = r.checkOutDate.split("/").map(Number);
    const diff = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000);
    if (diff > 0) r.nights = diff;
  }

  // ── Guest message (optional) ───────────────────────────────
  const msgPats = [
    /(?:Brasil|Brazil|BR)\s*\n\s*([\s\S]+?)\s*\n\s*Envie uma\s+[Mm]ensagem/im,
    /Identifica[^\n]*\n+(?:[^\n]*(?:Brasil|BR|Joinville|Curitiba|Paulo|Rio)[^\n]*\n+)?\s*([\s\S]+?)\s*\n\s*Envie uma\s+[Mm]ensagem/im,
  ];
  for (const p of msgPats) {
    const m = rawText.match(p);
    if (m?.[1] && m[1].trim().length > 5 && !m[1].match(/^(Envie|Nova|Imagem)/i)) {
      r.guestMessage = m[1].trim();
      break;
    }
  }

  // ── Guest profile photo URL (bonus) ────────────────────────
  const photoMatch = rawText.match(/\[?(https:\/\/a0\.muscache\.com\/im\/pictures\/user\/[^\s\]]+)/);
  if (photoMatch) r.guestPhotoUrl = photoMatch[1];

  // ── Property photo URL (bonus) ─────────────────────────────
  const propPhotoMatch = rawText.match(/\[?(https:\/\/a0\.muscache\.com\/im\/pictures\/(?!user\/)[^\s\]]+)/);
  if (propPhotoMatch) r.propertyPhotoUrl = propPhotoMatch[1];

  // ── Confidence ─────────────────────────────────────────────
  const has = (k: string) => !!r[k];
  r.confidence =
    has("guestFullName") && has("propertyName") && has("checkInDate") && has("checkOutDate") && has("confirmationCode")
      ? "high"
      : has("guestFullName") && has("checkInDate")
        ? "medium"
        : "low";

  delete r._ciMonth;
  delete r._ciYear;
  return { results: r as ParsedReservation, errors };
}
