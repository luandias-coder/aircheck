// src/app/api/cron/checkin-pdf-morning/route.ts
// Cron: runs daily at 10:00 UTC (7:00 BRT)
// Finds reservations with check-in today + form filled + host has checkinPdfMode "morning"
// Generates PDF and sends via email

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCheckinPdf } from "@/lib/generate-checkin-pdf";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SENDGRID_API_KEY) {
    console.warn("[cron-pdf-morning] SENDGRID_API_KEY not set");
    return NextResponse.json({ error: "SendGrid not configured" }, { status: 500 });
  }

  try {
    // Today's date in DD/MM/YYYY format (matching AirCheck's date format)
    const now = new Date();
    // Use BRT (UTC-3) for date calculation
    const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = `${pad(brt.getUTCDate())}/${pad(brt.getUTCMonth() + 1)}/${brt.getUTCFullYear()}`;

    console.log(`[cron-pdf-morning] Running for date: ${today}`);

    // Find all reservations:
    // - check-in today
    // - form already filled (has guests)
    // - not cancelled
    // - host has checkinPdfMode = "morning"
    const reservations = await prisma.reservation.findMany({
      where: {
        checkInDate: today,
        status: { in: ["form_filled", "sent_to_doorman"] },
        user: { checkinPdfMode: "morning" },
      },
      include: {
        property: {
          include: {
            condominium: { select: { name: true, address: true } },
          },
        },
        guests: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    console.log(`[cron-pdf-morning] Found ${reservations.length} reservation(s) to send`);

    let sent = 0;
    let failed = 0;

    for (const reservation of reservations) {
      if (reservation.guests.length === 0) continue;

      try {
        const pdfBuffer = await generateCheckinPdf(reservation);

        const guestName = reservation.guestFullName;
        const firstName = guestName.split(" ")[0];
        const safeName = guestName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-");
        const filename = `checkin-${safeName}-${reservation.checkInDate.replace(/\//g, "-")}.pdf`;

        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: reservation.user.email }] }],
            from: { email: "oi@aircheck.com.br", name: "AirCheck" },
            subject: `☀️ Check-in hoje: ${firstName} — ${reservation.property.name}`,
            content: [{
              type: "text/html",
              value: buildMorningEmailHtml(
                reservation.user.name?.split(" ")[0] || "Anfitrião",
                guestName,
                reservation.property.name,
                reservation.checkInDate,
                reservation.checkInTime,
                reservation.numGuests,
              ),
            }],
            attachments: [{
              content: pdfBuffer.toString("base64"),
              filename,
              type: "application/pdf",
              disposition: "attachment",
            }],
          }),
        });

        if (res.status >= 200 && res.status < 300) {
          console.log(`[cron-pdf-morning] Sent to ${reservation.user.email} for ${guestName}`);
          sent++;
        } else {
          const body = await res.text();
          console.error(`[cron-pdf-morning] SendGrid error ${res.status}:`, body);
          failed++;
        }
      } catch (err) {
        console.error(`[cron-pdf-morning] Error for reservation ${reservation.id}:`, err);
        failed++;
      }
    }

    console.log(`[cron-pdf-morning] Done: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      ok: true,
      date: today,
      found: reservations.length,
      sent,
      failed,
    });
  } catch (e) {
    console.error("[cron-pdf-morning] Error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildMorningEmailHtml(
  hostFirstName: string,
  guestName: string,
  propertyName: string,
  checkInDate: string,
  checkInTime: string,
  numGuests: number,
): string {
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
    <div class="logo"><div class="logo-text">Air<span>Check</span></div></div>
    <h1>Check-in hoje! ☀️</h1>
    <p>Bom dia, ${hostFirstName}! Você tem um check-in hoje. Os dados do hóspede estão no PDF em anexo.</p>
    
    <div class="info-box">
      <div style="display:flex;justify-content:space-between">
        <div>
          <div class="info-label">Hóspede</div>
          <div class="info-value">${guestName}</div>
        </div>
        <div>
          <div class="info-label">Imóvel</div>
          <div class="info-value">${propertyName}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:12px">
        <div>
          <div class="info-label">Horário</div>
          <div class="info-value">${checkInTime}</div>
        </div>
        <div>
          <div class="info-label">Hóspedes</div>
          <div class="info-value">${numGuests}</div>
        </div>
      </div>
    </div>
    
    <p style="font-size:13px;color:#737373">📎 O comprovante completo está em anexo. Você pode encaminhar para a portaria se necessário.</p>
    
    <div class="divider"></div>
    
    <p style="text-align:center;margin-bottom:0">
      <a href="https://aircheck.com.br/dashboard" class="btn">Ver no painel →</a>
    </p>
  </div>
  <div class="footer">
    AirCheck — Check-in automatizado para anfitriões<br>
    <a href="https://aircheck.com.br" style="color:#3B5FE5;text-decoration:none">aircheck.com.br</a><br>
    <span style="font-size:11px;color:#D4D4D4">Você recebe este email porque ativou "Manhã do check-in" nas configurações.</span>
  </div>
</div>
</body></html>`;
}
