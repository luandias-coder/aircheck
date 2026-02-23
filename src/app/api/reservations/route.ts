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
    let property = await prisma.property.findUnique({ where: { userId_name: { userId, name: propName } } });
    if (!property) property = await prisma.property.create({ data: { userId, name: propName } });

    const reservation = await prisma.reservation.create({
      data: {
        userId, propertyId: property.id,
        guestFullName: results.guestFullName || "Hóspede",
        checkInDate: results.checkInDate || "", checkInTime: results.checkInTime || "15:00",
        checkOutDate: results.checkOutDate || "", checkOutTime: results.checkOutTime || "12:00",
        numGuests: results.numGuests || 1, nights: results.nights,
        confirmationCode: results.confirmationCode, hostPayment: results.hostPayment,
        guestMessage: results.guestMessage, status: "pending_form",
      },
      include: { property: { include: { doormanPhones: true } } },
    });

    return NextResponse.json({ reservation, parsed: results, errors });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
