import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

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

// GET: retorna dados do condomínio (qualquer role)
export async function GET(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const condo = await prisma.condominium.findUnique({
      where: { id: auth.condominiumId },
      select: {
        id: true, name: true, address: true, code: true,
        contactName: true, contactEmail: true, contactPhone: true,
        plan: true, active: true,
        users: {
          select: { id: true, name: true, email: true, role: true, active: true },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { properties: true } },
      },
    });

    if (!condo) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });

    return NextResponse.json({
      ...condo,
      totalProperties: condo._count.properties,
      _count: undefined,
    });
  } catch (e) {
    console.error("[portaria/settings GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PATCH: atualiza dados do condomínio (apenas admin ou sindico)
export async function PATCH(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Apenas admin e síndico podem editar
  if (!["admin", "sindico"].includes(auth.role)) {
    return NextResponse.json({ error: "Sem permissão. Apenas administradores e síndicos podem alterar configurações." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, address, contactName, contactEmail, contactPhone } = body;

    // Validação mínima
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return NextResponse.json({ error: "Nome do condomínio é obrigatório" }, { status: 400 });
    }

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (contactName !== undefined) updateData.contactName = contactName?.trim() || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail?.trim() || null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
    }

    const updated = await prisma.condominium.update({
      where: { id: auth.condominiumId },
      data: updateData,
      select: {
        id: true, name: true, address: true, code: true,
        contactName: true, contactEmail: true, contactPhone: true,
        plan: true, active: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[portaria/settings PATCH]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
