import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCheckinPdf } from "@/lib/generate-checkin-pdf";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const r = await prisma.reservation.findUnique({
      where: { formToken: params.token },
      include: {
        property: {
          include: {
            condominium: { select: { name: true, address: true, photoUrl: true } },
          },
        },
        guests: true,
      },
    });
    if (!r) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

    return NextResponse.json({
      propertyName: r.property.name,
      propertyPhotoUrl: r.property.photoUrl || null,
      guestName: r.guestFullName,
      guestPhone: r.guestPhone,
      guestPhotoUrl: r.guestPhotoUrl || null,
      checkInDate: r.checkInDate,
      checkInTime: r.checkInTime,
      checkOutDate: r.checkOutDate,
      checkOutTime: r.checkOutTime,
      numGuests: r.numGuests,
      nights: r.nights,
      status: r.status,
      carPlate: r.carPlate,
      carModel: r.carModel,
      condominiumName: r.property.condominium?.name || null,
      condominiumAddress: r.property.condominium?.address || null,
      guests: r.guests.map((g) => ({
        fullName: g.fullName,
        birthDate: g.birthDate,
        cpf: g.cpf,
        rg: g.rg,
        foreign: g.foreign,
        passport: g.passport,
        rne: g.rne,
        hasDocument: !!g.documentUrl,
      })),
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const r = await prisma.reservation.findUnique({ where: { formToken: params.token } });
    if (!r) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

    if (r.status === "cancelled") {
      return NextResponse.json({ error: "Esta reserva foi cancelada." }, { status: 400 });
    }
    if (r.status !== "pending_form") {
      return NextResponse.json({ error: "Este formulário já foi preenchido. Para alterações, solicite ao anfitrião." }, { status: 400 });
    }

    const formData = await req.formData();
    const guestsRaw = formData.get("guests") as string;
    if (!guestsRaw) return NextResponse.json({ error: "Dados dos hóspedes ausentes" }, { status: 400 });
    
    let guests: Array<{
      fullName: string; birthDate: string; cpf?: string; rg?: string;
      foreign?: boolean; passport?: string; rne?: string;
    }>;
    try { guests = JSON.parse(guestsRaw); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

    const carPlate = formData.get("carPlate") as string | null;
    const carModel = formData.get("carModel") as string | null;
    const guestPhone = formData.get("guestPhone") as string | null;

    // Delete existing guests for re-creation
    await prisma.guest.deleteMany({ where: { reservationId: r.id } });

    // Create guests (document upload disabled for LGPD compliance)
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      await prisma.guest.create({
        data: {
          reservationId: r.id,
          fullName: g.fullName,
          birthDate: g.birthDate,
          cpf: g.cpf || null,
          rg: g.rg || null,
          foreign: g.foreign || false,
          passport: g.passport || null,
          rne: g.rne || null,
          documentUrl: null,
        },
      });
    }

    await prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: "form_filled",
        carPlate: carPlate || null,
        carModel: carModel || null,
        guestPhone: guestPhone || null,
      },
    });

    // ─── AUTO-SEND PDF EMAIL ────────────────────────────────
    // Fire-and-forget: don't block form submission response
    sendPdfIfEnabled(r.id, r.userId).catch((err) => {
      console.error("[checkin] Auto-send PDF failed:", err);
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Checkin POST error:", e);
    return NextResponse.json({ error: e?.message || "Erro ao salvar" }, { status: 500 });
  }
}

// ─── Helper: check if host wants PDF and send it ──────────
async function sendPdfIfEnabled(reservationId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sendCheckinPdf: true, email: true },
    });

    if (!user?.sendCheckinPdf) return; // Host doesn't want PDF emails

    // Fetch full reservation data for PDF generation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        property: {
          include: {
            condominium: { select: { name: true, address: true } },
          },
        },
        guests: true,
      },
    });

    if (!reservation || reservation.guests.length === 0) return;

    // Generate PDF
    const pdfBuffer = await generateCheckinPdf(reservation);

    // Send via SendGrid
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
    if (!SENDGRID_API_KEY) {
      console.warn("[checkin] SENDGRID_API_KEY not set, skipping PDF email");
      return;
    }

    const guestName = reservation.guestFullName;
    const firstName = guestName.split(" ")[0];
    const safeName = guestName.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, "").replace(/\s+/g, "-");
    const filename = `checkin-${safeName}-${reservation.checkInDate.replace(/\//g, "-")}.pdf`;

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: user.email }] }],
        from: { email: "oi@aircheck.com.br", name: "AirCheck" },
        subject: `Check-in de ${firstName} — ${reservation.property.name} (${reservation.checkInDate})`,
        content: [{
          type: "text/html",
          value: buildPdfEmailHtml(guestName, reservation.property.name, reservation.checkInDate),
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
      console.log(`[checkin] Auto-sent PDF to ${user.email} for ${guestName}`);
    } else {
      const body = await res.text();
      console.error(`[checkin] SendGrid error ${res.status}:`, body);
    }
  } catch (err) {
    console.error("[checkin] sendPdfIfEnabled error:", err);
  }
}

// ─── Email template for auto-send PDF ─────────────────────
function buildPdfEmailHtml(guestName: string, propertyName: string, checkInDate: string): string {
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
