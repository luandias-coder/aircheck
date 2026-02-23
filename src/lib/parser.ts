// ═══════════════════════════════════════════════════════════════
// AirCheck Parser v5.1
// - Fixes corrupted encoding from Outlook forwarding
// - Extracts Airbnb room ID, thread ID/URL, guest photo
// - Removed guestMessage
// ═══════════════════════════════════════════════════════════════

const MONTH_MAP: Record<string, number> = {
  jan:0, fev:1, mar:2, abr:3, mai:4, jun:5, jul:6, ago:7, set:8, out:9, nov:10, dez:11,
  janeiro:0, fevereiro:1, marco:2, abril:3, maio:4, junho:5, julho:6, agosto:7, setembro:8, outubro:9, novembro:10, dezembro:11,
  january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11,
};

function matchMonth(raw: string): number | null {
  const clean = raw.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "").replace(/\?/g, "").replace(/\.+$/, "").trim();
  if (MONTH_MAP[clean] !== undefined) return MONTH_MAP[clean];
  if (clean.length >= 3) {
    for (const [k, v] of Object.entries(MONTH_MAP)) {
      if (k.startsWith(clean.slice(0, 3))) return v;
    }
  }
  return null;
}

// Fix corrupted encoding from Outlook forwarding (UTF-8 → Latin-1 → UTF-8 mangling)
function cleanEncoding(text: string): string {
  return text
    // Double replacement char patterns (2-byte chars like ç+ã → ção)
    .replace(/\uFFFD\uFFFDes\b/g, "ções")
    .replace(/\uFFFD\uFFFDo\b/g, "ção")
    .replace(/\uFFFD\uFFFD/g, "çã")
    // Specific words/property terms
    .replace(/\bEsta\uFFFDo/g, "Estação")
    .replace(/anfitri\uFFFDo/gi, "anfitrião")
    .replace(/pre\uFFFDo/gi, "preço")
    .replace(/servi\uFFFDo/gi, "serviço")
    .replace(/informa\uFFFDes/gi, "informações")
    .replace(/\uFFFD(?=spede)/gi, "ó")
    .replace(/\uFFFD(?=digo)/gi, "ó")
    .replace(/\uFFFD(?=vel\b)/gi, "ó")
    // Specific name prefixes (before generic suffix rules)
    .replace(/L\uFFFD(?=cia\b)/g, "Lú")
    .replace(/l\uFFFD(?=cia\b)/g, "lú")
    .replace(/M\uFFFD(?=rci)/g, "Má")
    .replace(/m\uFFFD(?=rci)/g, "má")
    .replace(/S\uFFFD(?=rgio)/g, "Sé")
    .replace(/s\uFFFD(?=rgio)/g, "sé")
    .replace(/R\uFFFD(?=gis\b)/g, "Ré")
    // Generic suffix patterns (names)
    .replace(/\uFFFD(?=cio\b)/gi, "í")    // Fabrício, Maurício
    .replace(/\uFFFD(?=cia\b)/gi, "í")    // Letícia, Patrícia
    .replace(/\uFFFD(?=nior\b)/gi, "ú")   // Júnior
    .replace(/\uFFFD(?=lio\b)/gi, "ú")    // Júlio
    .replace(/\uFFFD(?=lia\b)/gi, "ú")    // Júlia
    .replace(/\uFFFD(?=nio\b)/gi, "ô")    // Antônio
    .replace(/\uFFFD(?=nia\b)/gi, "ô")    // Sônia
    .replace(/\uFFFD(?=rio\b)/gi, "á")    // Mário, itinerário
    .replace(/\uFFFD(?=ria\b)/gi, "á")    // Mária
    .replace(/\uFFFD(?=rica?\b)/gi, "é")   // América
    .replace(/\uFFFD(?=der\b)/gi, "é")     // Cléder
    // Fallback: drop replacement char keeping surrounding letters
    .replace(/([A-Za-z])\uFFFD/g, (_, p) => p)
    .replace(/\uFFFD([A-Za-z])/g, (_, n) => n)
    .replace(/\uFFFD/g, "");
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
  guestPhotoUrl?: string;
  airbnbRoomId?: string;
  airbnbThreadId?: string;
  airbnbThreadUrl?: string;
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

  const hdr = rawText.match(/Enviado:\s*\w+,\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/i);
  if (hdr) {
    emailYear = parseInt(hdr[3]);
    emailMonth = matchMonth(hdr[1]);
  }
  if (emailMonth === null) {
    const hdr2 = rawText.match(/Date:\s*\w+,\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (hdr2) { emailYear = parseInt(hdr2[3]); emailMonth = matchMonth(hdr2[2]); }
  }

  // ── Airbnb Room ID ─────────────────────────────────────────
  const roomMatch = rawText.match(/airbnb\.com(?:\.br)?\/rooms\/(\d+)/);
  if (roomMatch) r.airbnbRoomId = roomMatch[1];

  // ── Airbnb Thread ID & URL ─────────────────────────────────
  const threadMatch = rawText.match(/(https:\/\/www\.airbnb\.com(?:\.br)?\/hosting\/thread\/(\d+))/);
  if (threadMatch) {
    r.airbnbThreadUrl = threadMatch[1];
    r.airbnbThreadId = threadMatch[2];
  }

  // ── Guest photo URL ────────────────────────────────────────
  const photoMatch = rawText.match(/https:\/\/a0\.muscache\.com\/im\/pictures\/user\/[^\s\]\[>]+/);
  if (photoMatch) r.guestPhotoUrl = photoMatch[0].replace(/\]$/, "");

  // ── Guest name ─────────────────────────────────────────────
  const fromSubject = rawText.match(/Reserva confirmada\s*[-–—]\s*(.+?)\s+chega\s+em/i);
  if (fromSubject) {
    r.guestFullName = fromSubject[1].trim();
  }
  if (!r.guestFullName) {
    const fromNova = rawText.match(/Nova reserva confirmada!\s+(\w[\w\s]*?)\s+chega\s+em/i);
    if (fromNova) r.guestFullName = fromNova[1].trim();
  }
  if (!r.guestFullName) {
    const fromId = rawText.match(/\n\s*([A-ZÀ-Ú\u00C0-\u024F\uFFFD][a-zà-ÿ\u00E0-\u024F\uFFFD]+(?:\s+[A-ZÀ-Ú\u00C0-\u024F\uFFFD][a-zà-ÿ\u00E0-\u024F\uFFFD]+)+)\s*\n[^\n]*?Identifica/m);
    if (fromId) r.guestFullName = fromId[1].trim();
  }
  if (!r.guestFullName) errors.push("Nome do hóspede não encontrado");
  else r.guestFullName = cleanEncoding(r.guestFullName);

  // ── Property name (with encoding cleanup) ──────────────────
  // Pattern 1: text before "Casa/apto inteiro"
  const propPreCasa = rawText.match(/\n\s*(.{5,80}?)\s*\n\s*Casa[\/\w\s]*inteiro/i);
  if (propPreCasa) {
    const name = cleanEncoding(propPreCasa[1].trim());
    if (!name.match(/^(Envie|Nova|Ident|Check|Imagem|http|\[)/i) && name.length > 3) {
      r.propertyName = name;
    }
  }
  // Pattern 2: inline
  if (!r.propertyName) {
    const propInline = rawText.match(/(?:\]|^)\s*([^[\]\n]{5,80}?)\s+Casa[\/\w\s]*inteiro/im);
    if (propInline) {
      const name = cleanEncoding(propInline[1].trim());
      if (name.length > 3 && !name.match(/^(http|Envie|Nova|<)/i)) r.propertyName = name;
    }
  }
  // Pattern 3: brackets (skip known non-property values)
  if (!r.propertyName) {
    const bracketRe = /\[([^\]]{5,80}?)\]/g;
    let bm;
    while ((bm = bracketRe.exec(rawText)) !== null) {
      const name = cleanEncoding(bm[1].trim());
      if (name.match(/^(Airbnb|AirCover|App Store|Google Play|http|image|Studio|Casa)/i) && !name.match(/^(Airbnb$|AirCover|App Store|Google Play|http|image)/i)) {
        r.propertyName = name; break;
      }
      if (!name.match(/^(Airbnb|AirCover|App Store|Google Play|http|image)/i) && name.length > 3) {
        r.propertyName = name; break;
      }
    }
  }
  if (!r.propertyName) errors.push("Imóvel não encontrado");

  // ── Check-in ───────────────────────────────────────────────
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
      r._ciMonth = mo; r._ciYear = y;
    } else errors.push(`Mês de check-in não reconhecido: "${ciMatch[2]}"`);
  } else errors.push("Data de check-in não encontrada");

  // ── Check-out ──────────────────────────────────────────────
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
    } else errors.push(`Mês de check-out não reconhecido: "${coMatch[2]}"`);
  } else errors.push("Data de check-out não encontrada");

  // ── Guests ─────────────────────────────────────────────────
  let guestFound = false;
  const guestPats = [
    /H.spedes[\s\n]+(\d+)\s+(?:adultos?|h.spedes?|pessoas?)/i,
    /(\d+)\s+adultos?/i,
  ];
  for (const pat of guestPats) {
    const m = rawText.match(pat);
    if (m) { r.numGuests = parseInt(m[1]); guestFound = true; break; }
  }
  if (!guestFound) { r.numGuests = 1; errors.push("Nº de hóspedes não encontrado (assumindo 1)"); }

  // ── Confirmation code ──────────────────────────────────────
  const codePats = [
    /C.digo\s+de\s+confirma..o[\s\n]+([A-Z0-9]{8,12})/i,
    /confirma(?:ção|..o|cao)[\s\S]{0,30}?([A-Z0-9]{10})/i,
  ];
  for (const pat of codePats) {
    const m = rawText.match(pat);
    if (m) { r.confirmationCode = m[1]; break; }
  }
  if (!r.confirmationCode) errors.push("Código não encontrado");

  // ── Host payment ───────────────────────────────────────────
  const payPats = [
    /Voc.\s+recebe[\s\n]+R\$\s*([\d.,]+)/i,
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

  // ── Confidence ─────────────────────────────────────────────
  const has = (k: string) => !!r[k];
  r.confidence =
    has("guestFullName") && has("propertyName") && has("checkInDate") && has("checkOutDate") && has("confirmationCode")
      ? "high"
      : has("guestFullName") && has("checkInDate")
        ? "medium"
        : "low";

  delete r._ciMonth; delete r._ciYear;
  return { results: r as ParsedReservation, errors };
}
