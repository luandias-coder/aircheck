import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const prop = await prisma.property.findFirst({ where: { id: params.id, userId } });
    if (!prop) return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });

    const body = await req.json();
    const { action } = body;

    if (action === "add_phone") {
      const { phone, name, label } = body;
      if (!phone) return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
      await prisma.doormanPhone.create({ data: { propertyId: params.id, phone, name: name || null, label: label || null } });
    } else if (action === "remove_phone") {
      await prisma.doormanPhone.delete({ where: { id: body.phoneId } });
    } else if (action === "update_phone") {
      const { phoneId, phone, name, label } = body;
      await prisma.doormanPhone.update({ where: { id: phoneId }, data: { phone, name: name || null, label: label || null } });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { doormanPhones: true, _count: { select: { reservations: true } } },
    });

    return NextResponse.json({ ...property, reservationCount: property?._count.reservations, _count: undefined });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
