// src/lib/generate-checkin-pdf.ts
// Professional branded PDF with Roboto font (Portuguese accents), real logo, property photo
// Dependencies: jspdf, ./pdf-fonts

import { jsPDF } from "jspdf";
import { ROBOTO_REGULAR, ROBOTO_BOLD, AIRCHECK_LOGO_PNG } from "./pdf-fonts";

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
    photoUrl: string | null;
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
const WHITE: [number, number, number] = [255, 255, 255];
const BLUE_LIGHT: [number, number, number] = [235, 240, 255];

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", ROBOTO_BOLD);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
}

export async function generateCheckinPdf(reservation: PdfReservation): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // ─── Fetch property photo ──────────────────────────────
  let propertyImageData: string | null = null;
  if (reservation.property.photoUrl) {
    try {
      const res = await fetch(reservation.property.photoUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || "image/jpeg";
        propertyImageData = `data:${contentType};base64,${buf.toString("base64")}`;
      }
    } catch (e) {
      console.warn("[pdf] Failed to fetch property photo:", e);
    }
  }

  // ─── HEADER ────────────────────────────────────────────
  // AirCheck logo (white bg, 1467×440 → ratio 3.33:1)
  const logoH = 8;
  const logoW = logoH * 3.33;
  try {
    doc.addImage(AIRCHECK_LOGO_PNG, "PNG", margin, y - 1, logoW, logoH);
  } catch (e) {
    // Fallback: text logo
    doc.setFont("Roboto", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...DARK);
    doc.text("Air", margin, y + 4);
    const airW = doc.getTextWidth("Air");
    doc.setTextColor(...BLUE);
    doc.text("Check", margin + airW, y + 4);
  }

  // Date generated (right aligned) — always BRT (UTC-3)
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dateStr = `Gerado em ${pad(now.getUTCDate())}/${pad(now.getUTCMonth() + 1)}/${now.getUTCFullYear()} às ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(dateStr, pageWidth - margin, y + 3, { align: "right" });

  y += 14;

  // Separator
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ─── TITLE ─────────────────────────────────────────────
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...DARK);
  doc.text("Comprovante de Check-in", margin, y);
  y += 9;

  // ─── PROPERTY INFO ─────────────────────────────────────
  y = drawSectionHeader(doc, "Imóvel", margin, y);

  // Property photo + info side by side
  const photoSize = 22;
  const hasPhoto = !!propertyImageData;
  const textX = hasPhoto ? margin + photoSize + 5 : margin;
  const textWidth = hasPhoto ? contentWidth - photoSize - 5 : contentWidth;

  if (hasPhoto && propertyImageData) {
    try {
      doc.addImage(propertyImageData, "JPEG", margin, y, photoSize, photoSize);
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, photoSize, photoSize, 2, 2, "S");
    } catch (e) {
      console.warn("[pdf] Failed to add property image:", e);
    }
  }

  doc.setFont("Roboto", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text(reservation.property.name, textX, y + 4);

  let infoY = y + 8;

  if (reservation.property.internalCode) {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text(`Código: ${reservation.property.internalCode}`, textX, infoY);
    infoY += 4;
  }

  const address = buildAddress(reservation);
  if (address) {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    const lines = doc.splitTextToSize(address, textWidth);
    doc.text(lines, textX, infoY);
    infoY += lines.length * 3.5;
  }

  const propDetails: string[] = [];
  if (reservation.property.unitNumber) propDetails.push(`Unidade: ${reservation.property.unitNumber}`);
  if (reservation.property.parkingSpot) propDetails.push(`Vaga: ${reservation.property.parkingSpot}`);
  if (propDetails.length > 0) {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(propDetails.join("   ·   "), textX, infoY);
    infoY += 4;
  }

  if (reservation.property.condominium) {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLUE);
    doc.text(`Condomínio: ${reservation.property.condominium.name}`, textX, infoY);
    infoY += 4;
  }

  y = Math.max(infoY, hasPhoto ? y + photoSize : infoY) + 4;

  // ─── RESERVATION INFO ──────────────────────────────────
  y = drawSectionHeader(doc, "Reserva", margin, y);

  const hasExtra = !!(reservation.confirmationCode || reservation.guestPhone);
  const gridH = hasExtra ? 32 : 22;
  doc.setFillColor(...BLUE_LIGHT);
  doc.roundedRect(margin, y, contentWidth, gridH, 2, 2, "F");

  const col1 = margin + 5;
  const col2 = margin + contentWidth * 0.28;
  const col3 = margin + contentWidth * 0.56;
  const col4 = margin + contentWidth * 0.78;

  const gridY = y + 5;
  drawGridField(doc, col1, gridY, "Check-in", `${reservation.checkInDate} às ${reservation.checkInTime}`);
  drawGridField(doc, col2, gridY, "Check-out", `${reservation.checkOutDate} às ${reservation.checkOutTime}`);
  drawGridField(doc, col3, gridY, "Hóspedes", String(reservation.numGuests));
  drawGridField(doc, col4, gridY, "Noites", reservation.nights ? String(reservation.nights) : "—");

  if (hasExtra) {
    const gridY2 = gridY + 13;
    if (reservation.confirmationCode) drawGridField(doc, col1, gridY2, "Código", reservation.confirmationCode);
    if (reservation.guestPhone) drawGridField(doc, col2, gridY2, "Contato", reservation.guestPhone);
  }

  y += gridH + 4;

  // Vehicle
  if (reservation.carPlate || reservation.carModel) {
    doc.setFillColor(245, 250, 245);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const model = reservation.carModel ? toTitleCase(reservation.carModel) : "";
    const plate = reservation.carPlate ? reservation.carPlate.toUpperCase() : "";
    const vehicle = [model, plate].filter(Boolean).join("  ·  ");
    doc.text(`Veículo: ${vehicle}`, margin + 5, y + 6.5);
    y += 13;
  }

  y += 2;

  // ─── GUESTS ────────────────────────────────────────────
  y = drawSectionHeader(doc, `Hóspedes (${reservation.guests.length})`, margin, y);

  for (let i = 0; i < reservation.guests.length; i++) {
    const g = reservation.guests[i];

    if (y > 255) { doc.addPage(); y = 18; }

    const cardH = calculateGuestCardHeight(g);

    // Card background
    doc.setFillColor(...BG_GRAY);
    doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, "F");

    // Left accent bar
    doc.setFillColor(...BLUE);
    doc.roundedRect(margin, y, 1.2, cardH, 0.6, 0.6, "F");

    const cx = margin + 5;
    const cy = y + 5.5;

    // Guest number badge
    doc.setFillColor(...BLUE);
    doc.circle(cx + 2.5, cy - 1, 2.5, "F");
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(String(i + 1), cx + 2.5, cy - 0.3, { align: "center" });

    // Guest name (Title Case)
    doc.setFont("Roboto", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(toTitleCase(g.fullName), cx + 7, cy);

    if (g.foreign) {
      const nameW = doc.getTextWidth(toTitleCase(g.fullName));
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLUE);
      doc.text("Estrangeiro", cx + 7 + nameW + 3, cy);
    }

    // Document info
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
      doc.setFont("Roboto", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      doc.text(docItems.join("     ·     "), cx + 7, cy + 5.5);
    }

    y += cardH + 2.5;
  }

  y += 5;

  // ─── FOOTER ────────────────────────────────────────────
  if (y > 268) { doc.addPage(); y = 18; }

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("Este documento foi gerado automaticamente pelo AirCheck.", pageWidth / 2, y, { align: "center" });
  y += 3.2;
  doc.text("Os dados são de uso exclusivo para registro na portaria do condomínio.", pageWidth / 2, y, { align: "center" });
  y += 3.2;
  doc.setTextColor(...BLUE);
  doc.setFont("Roboto", "bold");
  doc.text("aircheck.com.br", pageWidth / 2, y, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// ─── DRAWING HELPERS ─────────────────────────────────────

function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number): number {
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, y - 3.2, 1.5, 5.5, 0.7, 0.7, "F");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(title, x + 5, y);
  return y + 7;
}

function drawGridField(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text(label, x, y);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(value, x, y + 4.5);
}

function calculateGuestCardHeight(g: PdfGuest): number {
  let h = 12;
  if (g.cpf || g.rg || g.passport || g.rne || g.birthDate) h += 6;
  return h;
}

function buildAddress(r: PdfReservation): string | null {
  if (r.property.condominium?.address) return cleanAddress(r.property.condominium.address);
  const parts = [r.property.addressStreet, r.property.addressCity, r.property.addressState].filter(Boolean);
  return parts.length > 0 ? cleanAddress(parts.join(", ")) : null;
}

// Remove English prefixes from Hospitable address data
function cleanAddress(addr: string): string {
  return addr
    .replace(/State of /gi, "")
    .replace(/City of /gi, "")
    .replace(/Province of /gi, "");
}

function toTitleCase(str: string): string {
  const lowercase = ["de", "da", "do", "das", "dos", "e", "em", "com"];
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i > 0 && lowercase.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
