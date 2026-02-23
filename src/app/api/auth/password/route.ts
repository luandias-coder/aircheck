import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
