// src/app/api/reservations/[id]/send-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateCheckinPdf } from "@/lib/generate-checkin-pdf";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = "oi@aircheck.com.br";
const FROM_NAME = "AirCheck";

// ─── Send PDF email via SendGrid with attachment ──────────
async function sendPdfEmail({
  to,
  guestName,
  propertyName,
  checkInDate,
  pdfBuffer,
}: {
  to: string;
  guestName: string;
  propertyName: string;
  checkInDate: string;
  pdfBuffer: Buffer;
}): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("[send-pdf] SENDGRID_API_KEY not set, skipping");
    return false;
  }

  const firstName = guestName.split(" ")[0];
  const safeName = guestName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-");
  const filename = `checkin-${safeName}-${checkInDate.replace(/\//g, "-")}.pdf`;

  const subject = `Check-in de ${firstName} — ${propertyName} (${checkInDate})`;
  const htmlContent = buildEmailHtml(guestName, propertyName, checkInDate);

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: htmlContent }],
        attachments: [
          {
            content: pdfBuffer.toString("base64"),
            filename,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      }),
    });

    if (res.status >= 200 && res.status < 300) {
      console.log(`[send-pdf] Sent PDF to ${to} for reservation ${guestName}`);
      return true;
    }

    const body = await res.text();
    console.error(`[send-pdf] SendGrid error ${res.status}:`, body);
    return false;
  } catch (err) {
    console.error("[send-pdf] Failed:", err);
    return false;
  }
}

// ─── Email HTML template ──────────────────────────────────
function buildEmailHtml(guestName: string, propertyName: string, checkInDate: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .container{max-width:560px;margin:0 auto;padding:32px 20px}
  .card{background:#fff;border-radius:16px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
  .logo{text-align:center;margin-bottom:24px}
  .logo-text{font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#1A1A1A}
  .logo-text span{color:#3B5FE5}
  h1{font-size:20px;font-weight:700;color:#1A1A1A;margin:0 0 8px;line-height:1.3}
  p{font-size:15px;color:#525252;line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;padding:14px 28px;background:#3B5FE5;color:#fff!important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;text-align:center}
  .divider{height:1px;background:#E5E5E5;margin:24px 0}
  .footer{text-align:center;padding:20px;font-size:12px;color:#A3A3A3;line-height:1.6}
</style></head><body>
<div class="container">
  <div class="card">
    <div class="logo"><div class="logo-text">Air<span>Check</span></div></div>
    <h1>Dados de check-in recebidos ✓</h1>
    <p>O hóspede <strong style="color:#1A1A1A">${guestName}</strong> preencheu o formulário de check-in para <strong style="color:#1A1A1A">${propertyName}</strong> (${checkInDate}).</p>
    <p style="font-size:13px;color:#737373">📎 O comprovante em PDF está anexo a este email. Você pode encaminhar diretamente para a portaria se necessário.</p>
    <div class="divider"></div>
    <p style="text-align:center;margin-bottom:0"><a href="https://aircheck.com.br/dashboard" class="btn">Ver no painel →</a></p>
  </div>
  <div class="footer">AirCheck — Check-in automatizado para anfitriões<br><a href="https://aircheck.com.br" style="color:#3B5FE5;text-decoration:none">aircheck.com.br</a></div>
</div>
</body></html>`;
}

// ─── POST handler ─────────────────────────────────────────
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const reservation = await prisma.reservation.findFirst({
      where: { id: params.id, userId },
      include: {
        property: {
          include: {
            condominium: { select: { name: true, address: true } },
          },
        },
        guests: true,
        user: { select: { email: true, name: true, sendCheckinPdf: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    }

    if (reservation.guests.length === 0) {
      return NextResponse.json({ error: "Formulário ainda não foi preenchido" }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generateCheckinPdf(reservation);

    // Send email
    const sent = await sendPdfEmail({
      to: reservation.user.email,
      guestName: reservation.guestFullName,
      propertyName: reservation.property.name,
      checkInDate: reservation.checkInDate,
      pdfBuffer,
    });

    if (!sent) {
      return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentTo: reservation.user.email });
  } catch (e) {
    console.error("[send-pdf] Error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
