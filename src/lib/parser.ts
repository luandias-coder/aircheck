const PT_MONTHS: Record<string, number> = { jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11 };
const ALL_MONTHS: Record<string, number> = { ...PT_MONTHS, january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
const DAY_ABBR = `[a-zA-ZÀ-ÿ]{3,5}`;

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

  let emailYear = new Date().getFullYear();
  let emailMonth: number | null = null;

  const hdr = rawText.match(/Enviado:\s*\w+,\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/i);
  if (hdr) {
    emailYear = parseInt(hdr[3]);
    const mk = hdr[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [k, v] of Object.entries(ALL_MONTHS)) {
      if (mk.startsWith(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3))) { emailMonth = v; break; }
    }
  }

  // Guest name: subject line first, then body
  const fromSubject = rawText.match(/Reserva confirmada\s*[-–—]\s*(.+?)\s+chega\s+em/i);
  if (fromSubject) {
    r.guestFullName = fromSubject[1].trim();
  } else {
    const fromBody = rawText.match(/\n\s*([A-ZÀ-Ú][a-zà-ÿ]+(?:\s+[A-ZÀ-Ú][a-zà-ÿ]+)+)\s*\n[^\n]*?Identifica[çc][ãa]o\s+verificada/m);
    if (fromBody) r.guestFullName = fromBody[1].trim();
    else {
      const fromNova = rawText.match(/Nova reserva confirmada!\s+(\w[\w\s]*?)\s+chega\s+em/i);
      if (fromNova) r.guestFullName = fromNova[1].trim();
    }
  }
  if (!r.guestFullName) errors.push("Nome do hóspede não encontrado");

  // Property
  const propPats = [
    /(?:Envie uma\s+[Mm]ensagem\s+para\s+[\w\s]+?)(?:Envie uma\s+[Mm]ensagem\s+para\s+[\w\s]+?)?\s*\n\s*(.+?)\s*\n\s*(?:Casa|Quarto|Espaço|Lugar)[\/\w\s]*inteiro/i,
    /(?:Envie uma\s+[Mm]ensagem\s+para\s+[\w\s]+?)\s*\n\s*(.+?)\s*\n\s*(?:Casa|Quarto|Espaço|Lugar)[\/\w\s]*inteiro/i,
    /\n\s*(.{5,80}?)\s*\n\s*(?:Casa|Quarto|Espaço|Lugar)[\/\w\s]*inteiro/i,
  ];
  for (const pat of propPats) {
    const m = rawText.match(pat);
    if (m?.[1] && !m[1].match(/^(Envie|Nova|Ident|Check|Hósp|Cód|Imagem)/i) && m[1].trim().length > 3) { r.propertyName = m[1].trim(); break; }
  }
  if (!r.propertyName) errors.push("Imóvel não encontrado");

  // Check-in (handles accented day abbreviations like sáb.)
  const ciRegex = new RegExp(`Check[\\s-]?in\\s*\\n+\\s*(?:${DAY_ABBR}\\.,?\\s*)?(\\d{1,2})\\s+de\\s+(\\w{3,9})\\.?\\s*\\n+\\s*(\\d{1,2}:\\d{2})`, "i");
  const ci = rawText.match(ciRegex);
  if (ci) {
    const mo = PT_MONTHS[ci[2].toLowerCase().replace(".", "")];
    if (mo !== undefined) { let y = emailYear; if (emailMonth !== null && mo < emailMonth) y++; r.checkInDate = `${ci[1].padStart(2,"0")}/${String(mo+1).padStart(2,"0")}/${y}`; r.checkInTime = ci[3]; r._ciMonth = mo; r._ciYear = y; }
  } else errors.push("Data de check-in não encontrada");

  // Check-out
  const coRegex = new RegExp(`Check[\\s-]?out\\s*\\n+\\s*(?:${DAY_ABBR}\\.,?\\s*)?(\\d{1,2})\\s+de\\s+(\\w{3,9})\\.?\\s*\\n+\\s*(\\d{1,2}:\\d{2})`, "i");
  const co = rawText.match(coRegex);
  if (co) {
    const mo = PT_MONTHS[co[2].toLowerCase().replace(".", "")];
    if (mo !== undefined) { let y = r._ciYear || emailYear; if (r._ciMonth !== undefined && mo < r._ciMonth) y++; r.checkOutDate = `${co[1].padStart(2,"0")}/${String(mo+1).padStart(2,"0")}/${y}`; r.checkOutTime = co[3]; }
  } else errors.push("Data de check-out não encontrada");

  // Guests
  const gPats = [/[Hh]óspedes?\s*\n+\s*(\d+)\s+(?:adultos?|hóspedes?|pessoas?|viajantes?)/i, /(\d+)\s+adultos?/i];
  let gF = false;
  for (const p of gPats) { const m = rawText.match(p); if (m) { r.numGuests = parseInt(m[1]); gF = true; break; } }
  if (!gF) { r.numGuests = 1; errors.push("Nº de hóspedes não encontrado (assumindo 1)"); }

  // Code
  const code = rawText.match(/[Cc]ódigo\s+de\s+confirma[çc][ãa]o\s*\n+\s*([A-Z0-9]{8,12})/);
  if (code) r.confirmationCode = code[1]; else errors.push("Código não encontrado");

  // Payment
  const pay = rawText.match(/Você\s+recebe\s*\n+\s*R\$\s*([\d.,]+)/i);
  if (pay) r.hostPayment = `R$ ${pay[1]}`;

  // Nights
  const nm = rawText.match(/(\d+)\s+noites?/i);
  if (nm) r.nights = parseInt(nm[1]);
  else if (r.checkInDate && r.checkOutDate) {
    const [d1,m1,y1] = r.checkInDate.split("/").map(Number);
    const [d2,m2,y2] = r.checkOutDate.split("/").map(Number);
    r.nights = Math.round((new Date(y2,m2-1,d2).getTime()-new Date(y1,m1-1,d1).getTime())/86400000);
  }

  // Guest message
  const msgPats = [
    /(?:^|\n)\s*(?:BR|Brazil|Brasil)\s*\n\s*([\s\S]+?)\s*\n\s*Envie uma\s+[Mm]ensagem/im,
    /Identifica[çc][ãa]o\s+verificada[^\n]*\n+(?:[^\n]*(?:Brasil|BR|Joinville|São Paulo|Rio|Curitiba)[^\n]*\n+)?\s*([\s\S]+?)\s*\n\s*Envie uma\s+[Mm]ensagem/im,
  ];
  for (const p of msgPats) { const m = rawText.match(p); if (m?.[1] && m[1].trim().length > 5 && !m[1].match(/^(Envie|Nova|Imagem)/i)) { r.guestMessage = m[1].trim(); break; } }

  const has = (k: string) => !!r[k];
  r.confidence = has("guestFullName") && has("propertyName") && has("checkInDate") && has("checkOutDate") && has("confirmationCode") ? "high" : has("guestFullName") && has("checkInDate") ? "medium" : "low";

  delete r._ciMonth; delete r._ciYear;
  return { results: r as ParsedReservation, errors };
}
