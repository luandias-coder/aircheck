import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// Shared select for condominium data in response
const CONDO_SELECT = {
  id: true, name: true, code: true, address: true, contactName: true, contactPhone: true,
  reportMode: true, doormanWhatsapp: true,
} as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const prop = await prisma.property.findFirst({ where: { id: params.id, userId } });
    if (!prop) return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });

    const body = await req.json();
    const { action } = body;

    // ── Phone actions ──
    if (action === "add_phone") {
      const { phone, name, label } = body;
      if (!phone) return NextResponse.json({ error: "Telefone obrigatório" }, { status: 400 });
      await prisma.doormanPhone.create({
        data: { propertyId: params.id, phone, name: name || null, label: label || null },
      });
    } else if (action === "remove_phone") {
      await prisma.doormanPhone.delete({ where: { id: body.phoneId } });
    } else if (action === "update_phone") {
      const { phoneId, phone, name, label } = body;
      await prisma.doormanPhone.update({
        where: { id: phoneId },
        data: { phone, name: name || null, label: label || null },
      });

    // ── Property details ──
    } else if (action === "update_details") {
      const { unitNumber, parkingSpot } = body;
      await prisma.property.update({
        where: { id: params.id },
        data: { unitNumber: unitNumber || null, parkingSpot: parkingSpot || null },
      });

    // ── Toggle doc links ──
    } else if (action === "toggle_doc_links") {
      await prisma.property.update({
        where: { id: params.id },
        data: { includeDocLinks: !prop.includeDocLinks },
      });

    // ── Link condominium ──
    } else if (action === "link_condominium") {
      const { code } = body;
      if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
      const condo = await prisma.condominium.findUnique({ where: { code: code.toUpperCase().trim() } });
      if (!condo) return NextResponse.json({ error: "Código não encontrado. Verifique com a administração do condomínio." }, { status: 404 });
      if (!condo.active) return NextResponse.json({ error: "Este condomínio não está ativo no momento." }, { status: 400 });
      await prisma.property.update({
        where: { id: params.id },
        data: { condominiumId: condo.id },
      });

    // ── Unlink condominium ──
    } else if (action === "unlink_condominium") {
      await prisma.property.update({
        where: { id: params.id },
        data: { condominiumId: null },
      });

    } else {
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }

    // ── Return updated property ──
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        doormanPhones: true,
        condominium: { select: CONDO_SELECT },
        _count: { select: { reservations: true } },
      },
    });

    return NextResponse.json({
      ...property,
      reservationCount: property?._count.reservations,
      _count: undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
