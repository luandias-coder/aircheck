// src/lib/generate-checkin-pdf.ts
// Generates a professional branded PDF with check-in data using jsPDF
// Install: npm install jspdf

import { jsPDF } from "jspdf";

interface PdfGuest {
  fullName: string;
  birthDate: string;
  cpf: string | null;
  rg: string | null;
  foreign: boolean;
  passport: string | null;
  rne: string | null;
}

interface PdfReservation {
  guestFullName: string;
  guestPhone: string | null;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  numGuests: number;
  nights: number | null;
  confirmationCode: string | null;
  carPlate: string | null;
  carModel: string | null;
  property: {
    name: string;
    unitNumber: string | null;
    parkingSpot: string | null;
    addressStreet: string | null;
    addressCity: string | null;
    addressState: string | null;
    internalCode: string | null;
    condominium: {
      name: string;
      address: string | null;
    } | null;
  };
  guests: PdfGuest[];
}

// Brand colors (RGB)
const BLUE: [number, number, number] = [59, 95, 229];
const DARK: [number, number, number] = [26, 26, 26];
const GRAY: [number, number, number] = [82, 82, 82];
const LIGHT_GRAY: [number, number, number] = [163, 163, 163];
const BG_GRAY: [number, number, number] = [245, 245, 244];
const BORDER: [number, number, number] = [229, 229, 229];

export async function generateCheckinPdf(reservation: PdfReservation): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ─── HEADER ───────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Air", margin, y);
  const airWidth = doc.getTextWidth("Air");
  doc.setTextColor(...BLUE);
  doc.text("Check", margin + airWidth, y);

  // Tagline
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("Check-in automatizado para anfitrioes", margin, y + 5);

  // Date generated
  const now = new Date();
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  doc.setFontSize(7);
  doc.text(`Gerado em ${dateStr}`, pageWidth - margin, y + 1, { align: "right" });

  y += 12;

  // Separator
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─── TITLE ────────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Comprovante de Check-in", margin, y);
  y += 10;

  // ─── PROPERTY INFO ────────────────────────────────────
  y = drawSectionHeader(doc, "IMOVEL", margin, y);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(sanitize(reservation.property.name), margin, y);
  y += 6;

  if (reservation.property.internalCode) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Codigo interno: ${reservation.property.internalCode}`, margin, y);
    y += 5;
  }

  const address = buildAddress(reservation);
  if (address) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(sanitize(address), contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  const details: string[] = [];
  if (reservation.property.unitNumber) details.push(`Unidade: ${reservation.property.unitNumber}`);
  if (reservation.property.parkingSpot) details.push(`Vaga: ${reservation.property.parkingSpot}`);
  if (details.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(details.join("   |   "), margin, y);
    y += 5;
  }

  if (reservation.property.condominium) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(`Condominio: ${sanitize(reservation.property.condominium.name)}`, margin, y);
    y += 5;
  }

  y += 4;

  // ─── RESERVATION INFO ─────────────────────────────────
  y = drawSectionHeader(doc, "RESERVA", margin, y);

  const colW = contentWidth / 2;
  const leftX = margin;
  const rightX = margin + colW;

  y = drawFieldPair(doc, leftX, rightX, y,
    "Check-in", `${reservation.checkInDate}  as  ${reservation.checkInTime}`,
    "Check-out", `${reservation.checkOutDate}  as  ${reservation.checkOutTime}`
  );

  y = drawFieldPair(doc, leftX, rightX, y,
    "Hospedes", String(reservation.numGuests),
    "Noites", reservation.nights ? String(reservation.nights) : "--"
  );

  if (reservation.confirmationCode || reservation.guestPhone) {
    y = drawFieldPair(doc, leftX, rightX, y,
      "Codigo de confirmacao", reservation.confirmationCode || "--",
      "Contato do hospede", reservation.guestPhone || "--"
    );
  }

  if (reservation.carPlate || reservation.carModel) {
    const vehicleInfo = [reservation.carModel, reservation.carPlate].filter(Boolean).join("  |  ");
    drawField(doc, leftX, y, "Veiculo", vehicleInfo);
    y += 10;
  }

  y += 4;

  // ─── GUESTS ───────────────────────────────────────────
  y = drawSectionHeader(doc, `HOSPEDES (${reservation.guests.length})`, margin, y);

  for (let i = 0; i < reservation.guests.length; i++) {
    const g = reservation.guests[i];

    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const cardHeight = calculateGuestCardHeight(g);

    // Guest card background
    doc.setFillColor(...BG_GRAY);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, "F");

    const cardY = y + 5;

    // Guest number + name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(`${i + 1}. ${sanitize(g.fullName)}`, margin + 4, cardY);

    if (g.foreign) {
      const nameWidth = doc.getTextWidth(`${i + 1}. ${sanitize(g.fullName)}`);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BLUE);
      doc.text("Estrangeiro", margin + 4 + nameWidth + 3, cardY);
    }

    let gy = cardY + 6;

    // Documents row
    const docItems: string[] = [];
    if (g.foreign) {
      if (g.passport) docItems.push(`Passaporte: ${g.passport}`);
      if (g.rne) docItems.push(`RNE: ${g.rne}`);
    } else {
      if (g.cpf) docItems.push(`CPF: ${g.cpf}`);
      if (g.rg) docItems.push(`RG: ${g.rg}`);
    }
    if (g.birthDate) docItems.push(`Nascimento: ${g.birthDate}`);

    if (docItems.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(docItems.join("     |     "), margin + 4, gy);
    }

    y += cardHeight + 3;
  }

  y += 6;

  // ─── FOOTER ───────────────────────────────────────────
  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("Este documento foi gerado automaticamente pelo AirCheck.", pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text("Os dados sao de uso exclusivo para registro na portaria do condominio.", pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.setTextColor(...BLUE);
  doc.text("aircheck.com.br", pageWidth / 2, y, { align: "center" });

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// ─── HELPERS ──────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// jsPDF's default Helvetica font doesn't support accented chars well.
// Strip common Portuguese accents to avoid broken glyphs.
function sanitize(text: string): string {
  return text
    .replace(/[áàâã]/g, "a")
    .replace(/[ÁÀÂÃ]/g, "A")
    .replace(/[éèê]/g, "e")
    .replace(/[ÉÈÊ]/g, "E")
    .replace(/[íìî]/g, "i")
    .replace(/[ÍÌÎ]/g, "I")
    .replace(/[óòôõ]/g, "o")
    .replace(/[ÓÒÔÕ]/g, "O")
    .replace(/[úùû]/g, "u")
    .replace(/[ÚÙÛ]/g, "U")
    .replace(/[ç]/g, "c")
    .replace(/[Ç]/g, "C")
    .replace(/[ñ]/g, "n")
    .replace(/[Ñ]/g, "N");
}

function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number): number {
  // Blue accent bar
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, y - 3, 1.2, 5, 0.6, 0.6, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(title, x + 4, y);
  return y + 7;
}

function drawField(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(label, x, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(sanitize(value), x, y + 4.5);
}

function drawFieldPair(
  doc: jsPDF,
  leftX: number, rightX: number, y: number,
  label1: string, value1: string,
  label2: string, value2: string
): number {
  drawField(doc, leftX, y, label1, value1);
  drawField(doc, rightX, y, label2, value2);
  return y + 11;
}

function calculateGuestCardHeight(g: PdfGuest): number {
  let h = 13; // name + padding
  const hasDocLine = g.cpf || g.rg || g.passport || g.rne || g.birthDate;
  if (hasDocLine) h += 6;
  return h;
}

function buildAddress(r: PdfReservation): string | null {
  if (r.property.condominium?.address) return r.property.condominium.address;
  const parts = [
    r.property.addressStreet,
    r.property.addressCity,
    r.property.addressState,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
