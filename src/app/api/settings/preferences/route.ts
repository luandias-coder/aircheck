// src/app/api/settings/preferences/route.ts
// GET + PATCH — Manage user preferences (sendCheckinPdf toggle, etc.)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

async function getUser() {
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

export async function GET() {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sendCheckinPdf: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({ sendCheckinPdf: user.sendCheckinPdf });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();

  const data: Record<string, boolean> = {};
  if (typeof body.sendCheckinPdf === "boolean") {
    data.sendCheckinPdf = body.sendCheckinPdf;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { sendCheckinPdf: true },
  });

  return NextResponse.json(updated);
}
