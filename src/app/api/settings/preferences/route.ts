// src/app/api/settings/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const VALID_PDF_MODES = ["off", "immediate", "morning"];

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { checkinPdfMode: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({ checkinPdfMode: user.checkinPdfMode });
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const data: Record<string, string> = {};
  if (typeof body.checkinPdfMode === "string" && VALID_PDF_MODES.includes(body.checkinPdfMode)) {
    data.checkinPdfMode = body.checkinPdfMode;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para atualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { checkinPdfMode: true },
  });

  return NextResponse.json(updated);
}
