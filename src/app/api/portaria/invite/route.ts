import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { sendEmail, inviteHostEmail } from "@/lib/email";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

export async function POST(req: NextRequest) {
  try {
    // Auth: only admin can invite
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);
    const condoUserId = payload.condoUserId as string;
    const role = payload.role as string;

    if (role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem enviar convites" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Get condominium info
    const condoUser = await prisma.condominiumUser.findUnique({
      where: { id: condoUserId },
      include: { condominium: true },
    });

    if (!condoUser || !condoUser.condominium) {
      return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });
    }

    const condo = condoUser.condominium;

    // Check if host already has a property linked to this condominium
    const alreadyLinked = await prisma.property.findFirst({
      where: {
        condominiumId: condo.id,
        user: { email: cleanEmail },
      },
    });

    if (alreadyLinked) {
      return NextResponse.json({ error: "Este anfitrião já tem um imóvel vinculado ao condomínio" }, { status: 409 });
    }

    // Check if host already has an account
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Send invite email
    const invite = inviteHostEmail({
      condoName: condo.name,
      condoCode: condo.code,
      condoAddress: condo.address,
      invitedBy: condoUser.name,
      hasAccount: !!existingUser,
    });

    const sent = await sendEmail({ to: cleanEmail, subject: invite.subject, html: invite.html });

    if (!sent) {
      return NextResponse.json({ error: "Erro ao enviar email. Tente novamente." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hasAccount: !!existingUser,
      message: existingUser
        ? "Convite enviado! O anfitrião já tem conta e receberá instruções para vincular o imóvel."
        : "Convite enviado! O anfitrião receberá instruções para criar conta e vincular o imóvel.",
    });
  } catch (e) {
    console.error("[portaria/invite]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
