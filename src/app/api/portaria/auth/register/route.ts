import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

// Generate unique 6-char code (A-Z, 2-9, no ambiguous chars)
async function generateCode(): Promise<string> {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no O,0,I,1,L
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const existing = await prisma.condominium.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Não foi possível gerar código único");
}

export async function POST(req: NextRequest) {
  try {
    const { condoName, address, contactName, email, phone, password } = await req.json();

    // Validate
    if (!condoName?.trim() || !address?.trim() || !contactName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already used as condo user
    const existingUser = await prisma.condominiumUser.findFirst({ where: { email: emailLower } });
    if (existingUser) {
      return NextResponse.json({ error: "Este email já está em uso. Faça login ou use outro email." }, { status: 409 });
    }

    // Generate unique code
    const code = await generateCode();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create condominium + admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const condo = await tx.condominium.create({
        data: {
          name: condoName.trim(),
          address: address.trim(),
          code,
          contactName: contactName.trim(),
          contactEmail: emailLower,
          contactPhone: phone || null,
          plan: "pilot",
          active: true,
        },
      });

      const user = await tx.condominiumUser.create({
        data: {
          condominiumId: condo.id,
          name: contactName.trim(),
          email: emailLower,
          passwordHash,
          role: "admin",
          active: true,
        },
      });

      return { condo, user };
    });

    // Create JWT and set cookie
    const token = await new SignJWT({
      condoUserId: result.user.id,
      condominiumId: result.condo.id,
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const res = NextResponse.json({
      success: true,
      condominiumId: result.condo.id,
      code: result.condo.code,
    }, { status: 201 });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (e: any) {
    console.error("[portaria/auth/register]", e);
    return NextResponse.json({ error: e?.message || "Erro interno" }, { status: 500 });
  }
}
