// src/app/api/reservations/[id]/pdf/route.ts
// GET — Download check-in PDF for a reservation
// Requires auth (host must own the reservation)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { generateCheckinPdf } from "@/lib/generate-checkin-pdf";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

async function getUser(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUser(req);
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
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    }

    if (reservation.guests.length === 0) {
      return NextResponse.json({ error: "Formulário ainda não foi preenchido" }, { status: 400 });
    }

    const pdfBuffer = await generateCheckinPdf(reservation);

    // Filename: checkin-GuestName-PropertyName-Date.pdf
    const safeName = reservation.guestFullName.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, "").replace(/\s+/g, "-");
    const safeProperty = reservation.property.name.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, "").replace(/\s+/g, "-");
    const filename = `checkin-${safeName}-${safeProperty}-${reservation.checkInDate.replace(/\//g, "-")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error("[pdf] Error generating PDF:", e);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
