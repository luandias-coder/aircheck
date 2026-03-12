import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const condoUserId = payload.condoUserId as string;

    const user = await prisma.condominiumUser.findUnique({
      where: { id: condoUserId },
      include: { condominium: { select: { id: true, name: true, code: true, address: true } } },
    });

    if (!user || !user.active) return NextResponse.json({ error: "Usuário inativo" }, { status: 401 });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      condominium: user.condominium,
    });
  } catch {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }
}
