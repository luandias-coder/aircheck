import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });

    const token = await createToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
