import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (exists) return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });

    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), passwordHash: await hashPassword(password), name: name?.trim() || null },
    });

    const token = await createToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
