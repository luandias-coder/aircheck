import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const emails = await prisma.userInboundEmail.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(emails);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  try {
    const entry = await prisma.userInboundEmail.create({
      data: { userId, email: email.toLowerCase().trim() },
    });
    return NextResponse.json(entry);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await req.json();
  await prisma.userInboundEmail.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
