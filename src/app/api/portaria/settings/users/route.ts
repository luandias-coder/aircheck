import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

async function getPortariaAuth(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return {
      condoUserId: payload.condoUserId as string,
      condominiumId: payload.condominiumId as string,
      role: payload.role as string,
    };
  } catch { return null; }
}

// POST: add new user
export async function POST(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["admin", "sindico"].includes(auth.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const validRoles = ["porteiro", "sindico", "admin"];
    const userRole = validRoles.includes(role) ? role : "porteiro";

    const existing = await prisma.condominiumUser.findFirst({
      where: { condominiumId: auth.condominiumId, email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "Já existe um usuário com este email neste condomínio" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.condominiumUser.create({
      data: {
        condominiumId: auth.condominiumId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: userRole,
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("[portaria/settings/users POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH: update user (deactivate, reactivate, change role)
export async function PATCH(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["admin", "sindico"].includes(auth.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const { userId, action, role } = await req.json();

    if (!userId) return NextResponse.json({ error: "ID do usuário obrigatório" }, { status: 400 });

    const target = await prisma.condominiumUser.findFirst({
      where: { id: userId, condominiumId: auth.condominiumId },
    });
    if (!target) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    if (userId === auth.condoUserId && action === "deactivate") {
      return NextResponse.json({ error: "Você não pode desativar sua própria conta" }, { status: 400 });
    }

    if (action === "deactivate") {
      await prisma.condominiumUser.update({ where: { id: userId }, data: { active: false } });
    } else if (action === "reactivate") {
      await prisma.condominiumUser.update({ where: { id: userId }, data: { active: true } });
    } else if (action === "change_role") {
      const validRoles = ["porteiro", "sindico", "admin"];
      if (!validRoles.includes(role)) return NextResponse.json({ error: "Role inválido" }, { status: 400 });
      await prisma.condominiumUser.update({ where: { id: userId }, data: { role } });
    } else {
      return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }

    const updated = await prisma.condominiumUser.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[portaria/settings/users PATCH]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
