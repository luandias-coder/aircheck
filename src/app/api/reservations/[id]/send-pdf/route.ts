// src/app/api/reservations/[id]/send-pdf/route.ts
// POST — Generate PDF and send via email to the host
// Can be called manually (from dashboard) or automatically (on form submit)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const safeName = guestName.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, "").replace(/\s+/g, "-");
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
  const firstName = guestName.split(" ")[0];
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
  .info-box{background:#F5F5F4;border-radius:10px;padding:16px 20px;margin:16px 0}
  .info-label{font-size:10px;font-weight:600;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em}
  .info-value{font-size:14px;font-weight:600;color:#1A1A1A;margin-top:4px}
  .btn{display:inline-block;padding:14px 28px;background:#3B5FE5;color:#fff!important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;text-align:center}
  .divider{height:1px;background:#E5E5E5;margin:24px 0}
  .footer{text-align:center;padding:20px;font-size:12px;color:#A3A3A3;line-height:1.6}
</style></head><body>
<div class="container">
  <div class="card">
    <div class="logo">
      <div class="logo-text">Air<span>Check</span></div>
    </div>
    <h1>Dados de check-in recebidos ✓</h1>
    <p>O hóspede <strong style="color:#1A1A1A">${guestName}</strong> preencheu o formulário de check-in. O PDF com todos os dados está anexo a este email.</p>
    
    <div class="info-box">
      <div style="display:flex;justify-content:space-between">
        <div>
          <div class="info-label">Hóspede</div>
          <div class="info-value">${firstName}</div>
        </div>
        <div>
          <div class="info-label">Imóvel</div>
          <div class="info-value">${propertyName}</div>
        </div>
        <div>
          <div class="info-label">Check-in</div>
          <div class="info-value">${checkInDate}</div>
        </div>
      </div>
    </div>
    
    <p style="font-size:13px;color:#737373">📎 O comprovante em PDF está anexo a este email. Você pode encaminhar diretamente para a portaria se necessário.</p>
    
    <div class="divider"></div>
    
    <p style="text-align:center;margin-bottom:0">
      <a href="https://aircheck.com.br/dashboard" class="btn">Ver no painel →</a>
    </p>
  </div>
  <div class="footer">
    AirCheck — Check-in automatizado para anfitriões<br>
    <a href="https://aircheck.com.br" style="color:#3B5FE5;text-decoration:none">aircheck.com.br</a>
  </div>
</div>
</body></html>`;
}

// ─── POST handler (manual trigger from dashboard) ─────────
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // This endpoint can be called:
    // 1. By authenticated host from dashboard (with cookie)
    // 2. Internally from the checkin form submit (with x-internal-key header)
    const internalKey = req.headers.get("x-internal-key");
    const isInternal = internalKey === process.env.INTERNAL_API_KEY;

    let userId: string | null = null;

    if (isInternal) {
      // Internal call — get userId from body
      const body = await req.json().catch(() => ({}));
      userId = body.userId || null;
    } else {
      // External call — verify JWT
      const { cookies: getCookies } = await import("next/headers");
      const cookieStore = await getCookies();
      const token = cookieStore.get("token")?.value;
      if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

      const { jwtVerify } = await import("jose");
      const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId as string;
      } catch {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }

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
