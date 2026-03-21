import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const condoUserId = payload.condoUserId as string;

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const user = await prisma.condominiumUser.findUnique({ where: { id: condoUserId } });
    if (!user || !user.active) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.condominiumUser.update({
      where: { id: condoUserId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[portaria/auth/password]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
