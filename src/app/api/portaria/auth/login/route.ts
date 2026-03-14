import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });

    const user = await prisma.condominiumUser.findFirst({
      where: { email: email.toLowerCase().trim(), active: true },
      include: { condominium: { select: { id: true, name: true, code: true, active: true } } },
    });

    if (!user) return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
    if (!user.condominium.active) return NextResponse.json({ error: "Condomínio inativo" }, { status: 403 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });

    const token = await new SignJWT({ condoUserId: user.id, condominiumId: user.condominiumId, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      condominium: user.condominium,
    });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 3600 });
    return res;
  } catch (e) {
    console.error("[portaria/auth/login]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
