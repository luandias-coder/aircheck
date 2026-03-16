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
        reportMode: true, doormanWhatsapp: true, photoUrl: true,
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

// PATCH: atualiza dados do condomínio (apenas admin)
export async function PATCH(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Apenas admin pode editar
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem alterar configurações." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, address, contactName, contactEmail, contactPhone, reportMode, doormanWhatsapp } = body;

    // Validação mínima
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return NextResponse.json({ error: "Nome do condomínio é obrigatório" }, { status: 400 });
    }

    // Validação reportMode
    if (reportMode !== undefined && !["dashboard", "whatsapp"].includes(reportMode)) {
      return NextResponse.json({ error: "Modo de reporte inválido" }, { status: 400 });
    }

    // Se reportMode = whatsapp, doormanWhatsapp é obrigatório
    if (reportMode === "whatsapp" && !doormanWhatsapp?.trim()) {
      return NextResponse.json({ error: "Informe o número de WhatsApp da portaria para usar o modo WhatsApp" }, { status: 400 });
    }

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (contactName !== undefined) updateData.contactName = contactName?.trim() || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail?.trim() || null;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone?.trim() || null;
    if (reportMode !== undefined) updateData.reportMode = reportMode;
    if (doormanWhatsapp !== undefined) updateData.doormanWhatsapp = doormanWhatsapp?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
    }

    const updated = await prisma.condominium.update({
      where: { id: auth.condominiumId },
      data: updateData,
      select: {
        id: true, name: true, address: true, code: true,
        contactName: true, contactEmail: true, contactPhone: true,
        reportMode: true, doormanWhatsapp: true, photoUrl: true,
        plan: true, active: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[portaria/settings PATCH]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
