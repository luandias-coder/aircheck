import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const props = await prisma.property.findMany({
      where: { userId },
      include: {
        doormanPhones: true,
        condominium: {
          select: { id: true, name: true, code: true, address: true, contactName: true, contactPhone: true, reportMode: true, doormanWhatsapp: true },
        },
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      props.map((p) => ({
        ...p,
        reservationCount: p._count.reservations,
        _count: undefined,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
