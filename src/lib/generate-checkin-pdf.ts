// src/lib/generate-checkin-pdf.ts
// Generates a professional branded PDF with check-in data using PDFKit
// Install: npm install pdfkit @types/pdfkit

import PDFDocument from "pdfkit";

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

// Brand colors
const BLUE = "#3B5FE5";
const DARK = "#1A1A1A";
const GRAY = "#525252";
const LIGHT_GRAY = "#A3A3A3";
const LIGHTER_GRAY = "#F5F5F4";
const GREEN = "#059669";
const BORDER = "#E5E5E5";

export async function generateCheckinPdf(reservation: PdfReservation): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Check-in - ${reservation.guestFullName}`,
          Author: "AirCheck",
          Subject: `Dados de check-in para ${reservation.property.name}`,
          Creator: "AirCheck - aircheck.com.br",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // 50 margin each side
      let y = 50;

      // ─── HEADER ───────────────────────────────────────────
      // Logo text
      doc.fontSize(22).font("Helvetica-Bold");
      doc.fillColor(DARK).text("Air", 50, y, { continued: true });
      doc.fillColor(BLUE).text("Check", { continued: false });

      // Tagline
      doc.fontSize(9).fillColor(LIGHT_GRAY).font("Helvetica")
        .text("Check-in automatizado para anfitriões", 50, y + 26);

      // Date generated
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      doc.fontSize(8).fillColor(LIGHT_GRAY).font("Helvetica")
        .text(`Gerado em ${dateStr}`, 50, y + 4, { align: "right" });

      y += 50;

      // Separator
      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(BORDER).lineWidth(1).stroke();
      y += 20;

      // ─── TITLE ────────────────────────────────────────────
      doc.fontSize(18).font("Helvetica-Bold").fillColor(DARK)
        .text("Comprovante de Check-in", 50, y);
      y += 30;

      // ─── PROPERTY INFO ────────────────────────────────────
      drawSectionHeader(doc, "Imóvel", 50, y);
      y += 22;

      const propName = reservation.property.name;
      doc.fontSize(14).font("Helvetica-Bold").fillColor(DARK)
        .text(propName, 50, y);
      y += 20;

      if (reservation.property.internalCode) {
        doc.fontSize(9).font("Helvetica").fillColor(LIGHT_GRAY)
          .text(`Código interno: ${reservation.property.internalCode}`, 50, y);
        y += 14;
      }

      // Address
      const address = buildAddress(reservation);
      if (address) {
        doc.fontSize(10).font("Helvetica").fillColor(GRAY)
          .text(address, 50, y, { width: pageWidth });
        y += doc.heightOfString(address, { width: pageWidth }) + 6;
      }

      // Unit + Parking
      const details: string[] = [];
      if (reservation.property.unitNumber) details.push(`Unidade: ${reservation.property.unitNumber}`);
      if (reservation.property.parkingSpot) details.push(`Vaga: ${reservation.property.parkingSpot}`);
      if (details.length > 0) {
        doc.fontSize(10).font("Helvetica").fillColor(GRAY)
          .text(details.join("  •  "), 50, y);
        y += 16;
      }

      // Condominium
      if (reservation.property.condominium) {
        doc.fontSize(10).font("Helvetica").fillColor(GRAY)
          .text(`Condomínio: ${reservation.property.condominium.name}`, 50, y);
        y += 16;
      }

      y += 10;

      // ─── RESERVATION INFO ─────────────────────────────────
      drawSectionHeader(doc, "Reserva", 50, y);
      y += 22;

      // Grid: 2 columns
      const colW = pageWidth / 2;
      const leftX = 50;
      const rightX = 50 + colW;

      y = drawFieldPair(doc, leftX, rightX, y, colW,
        "Check-in", `${reservation.checkInDate}  às  ${reservation.checkInTime}`,
        "Check-out", `${reservation.checkOutDate}  às  ${reservation.checkOutTime}`
      );

      y = drawFieldPair(doc, leftX, rightX, y, colW,
        "Hóspedes", String(reservation.numGuests),
        "Noites", reservation.nights ? String(reservation.nights) : "—"
      );

      if (reservation.confirmationCode) {
        y = drawFieldPair(doc, leftX, rightX, y, colW,
          "Código de confirmação", reservation.confirmationCode,
          "Contato do hóspede", reservation.guestPhone || "—"
        );
      } else if (reservation.guestPhone) {
        drawField(doc, leftX, y, "Contato do hóspede", reservation.guestPhone);
        y += 30;
      }

      // Vehicle
      if (reservation.carPlate || reservation.carModel) {
        const vehicleInfo = [reservation.carModel, reservation.carPlate].filter(Boolean).join("  •  ");
        drawField(doc, leftX, y, "Veículo", vehicleInfo);
        y += 30;
      }

      y += 10;

      // ─── GUESTS ───────────────────────────────────────────
      drawSectionHeader(doc, `Hóspedes (${reservation.guests.length})`, 50, y);
      y += 22;

      for (let i = 0; i < reservation.guests.length; i++) {
        const g = reservation.guests[i];

        // Check if we need a new page
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        // Guest card background
        const cardHeight = calculateGuestCardHeight(g);
        doc.roundedRect(50, y, pageWidth, cardHeight, 6)
          .fillColor(LIGHTER_GRAY).fill();

        const cardY = y + 10;

        // Guest number + name
        doc.fontSize(12).font("Helvetica-Bold").fillColor(DARK)
          .text(`${i + 1}. ${g.fullName}`, 62, cardY);

        if (g.foreign) {
          const nameWidth = doc.widthOfString(`${i + 1}. ${g.fullName}`);
          doc.fontSize(9).font("Helvetica").fillColor(BLUE)
            .text("Estrangeiro", 62 + nameWidth + 8, cardY + 2);
        }

        let gy = cardY + 20;

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
          doc.fontSize(10).font("Helvetica").fillColor(GRAY)
            .text(docItems.join("     •     "), 62, gy, { width: pageWidth - 24 });
          gy += 16;
        }

        y += cardHeight + 8;
      }

      y += 10;

      // ─── FOOTER ───────────────────────────────────────────
      // Check if footer fits
      if (y > 740) {
        doc.addPage();
        y = 50;
      }

      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(BORDER).lineWidth(0.5).stroke();
      y += 12;

      doc.fontSize(8).font("Helvetica").fillColor(LIGHT_GRAY)
        .text("Este documento foi gerado automaticamente pelo AirCheck.", 50, y, { align: "center", width: pageWidth });
      y += 12;
      doc.fontSize(8).font("Helvetica").fillColor(LIGHT_GRAY)
        .text("Os dados são de uso exclusivo para registro na portaria do condomínio.", 50, y, { align: "center", width: pageWidth });
      y += 12;
      doc.fontSize(8).font("Helvetica").fillColor(BLUE)
        .text("aircheck.com.br", 50, y, { align: "center", width: pageWidth, link: "https://aircheck.com.br" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── HELPERS ──────────────────────────────────────────────────

function drawSectionHeader(doc: PDFKit.PDFDocument, title: string, x: number, y: number) {
  // Blue left accent bar
  doc.roundedRect(x, y, 3, 16, 1.5).fillColor(BLUE).fill();
  doc.fontSize(11).font("Helvetica-Bold").fillColor(DARK)
    .text(title.toUpperCase(), x + 12, y + 2);
}

function drawField(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value: string) {
  doc.fontSize(9).font("Helvetica").fillColor(LIGHT_GRAY).text(label, x, y);
  doc.fontSize(11).font("Helvetica-Bold").fillColor(DARK).text(value, x, y + 12);
}

function drawFieldPair(
  doc: PDFKit.PDFDocument,
  leftX: number, rightX: number, y: number, colW: number,
  label1: string, value1: string,
  label2: string, value2: string
): number {
  drawField(doc, leftX, y, label1, value1);
  drawField(doc, rightX, y, label2, value2);
  return y + 34;
}

function calculateGuestCardHeight(g: PdfGuest): number {
  let h = 38; // name + padding
  const hasDocLine = g.cpf || g.rg || g.passport || g.rne || g.birthDate;
  if (hasDocLine) h += 18;
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
