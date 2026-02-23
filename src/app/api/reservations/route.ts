import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAirbnbEmail } from "@/lib/parser";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: { property: { include: { doormanPhones: true } }, guests: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reservations);
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const { emailText } = await req.json();
    if (!emailText) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

    const { results, errors } = parseAirbnbEmail(emailText);
    if (results.confidence === "low") {
      return NextResponse.json({ error: "Não foi possível extrair dados", parsed: results, errors }, { status: 422 });
    }

    const propName = results.propertyName || "Imóvel não identificado";
    let property = null;
    if (results.airbnbRoomId) {
      property = await prisma.property.findFirst({ where: { userId, airbnbRoomId: results.airbnbRoomId } });
    }
    if (!property) property = await prisma.property.findUnique({ where: { userId_name: { userId, name: propName } } });
    if (!property) property = await prisma.property.create({ data: { userId, name: propName, airbnbRoomId: results.airbnbRoomId || null } });
    else if (results.airbnbRoomId && !property.airbnbRoomId) {
      property = await prisma.property.update({ where: { id: property.id }, data: { airbnbRoomId: results.airbnbRoomId } });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId, propertyId: property.id,
        guestFullName: results.guestFullName || "Hóspede",
        guestPhotoUrl: results.guestPhotoUrl || null,
        checkInDate: results.checkInDate || "", checkInTime: results.checkInTime || "15:00",
        checkOutDate: results.checkOutDate || "", checkOutTime: results.checkOutTime || "12:00",
        numGuests: results.numGuests || 1, nights: results.nights,
        confirmationCode: results.confirmationCode, hostPayment: results.hostPayment,
        airbnbThreadId: results.airbnbThreadId || null,
        airbnbThreadUrl: results.airbnbThreadUrl || null,
        status: "pending_form",
      },
      include: { property: { include: { doormanPhones: true } } },
    });

    return NextResponse.json({ reservation, parsed: results, errors });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
