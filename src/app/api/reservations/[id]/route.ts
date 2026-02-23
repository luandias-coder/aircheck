import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const r = await prisma.reservation.findFirst({
      where: { id: params.id, userId },
      include: { property: { include: { doormanPhones: true } }, guests: true },
    });
    if (!r) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    return NextResponse.json(r);
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const exists = await prisma.reservation.findFirst({ where: { id: params.id, userId } });
    if (!exists) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    const body = await req.json();
    const r = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.status === "sent_to_doorman" ? { sentToDoormanAt: new Date() } : {}),
      },
      include: { property: { include: { doormanPhones: true } }, guests: true },
    });
    return NextResponse.json(r);
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const exists = await prisma.reservation.findFirst({ where: { id: params.id, userId } });
    if (!exists) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    await prisma.reservation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
