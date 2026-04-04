import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

async function getPortariaUser(req: NextRequest): Promise<{ condominiumId: string; condoUserId: string } | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return {
      condominiumId: payload.condominiumId as string,
      condoUserId: payload.condoUserId as string,
    };
  } catch { return null; }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ guestId: string }> }) {
  const portariaUser = await getPortariaUser(req);
  if (!portariaUser) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { guestId } = await params;

  try {
    const body = await req.json();
    const checked = body.checked === true;

    // Fetch the CondominiumUser to get the name (JWT doesn't include it)
    const condoUser = await prisma.condominiumUser.findUnique({
      where: { id: portariaUser.condoUserId },
      select: { name: true, active: true },
    });

    if (!condoUser || !condoUser.active) {
      return NextResponse.json({ error: "Usuário inativo" }, { status: 403 });
    }

    // Find the guest with reservation → property → condominium
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        reservation: {
          include: {
            property: { select: { condominiumId: true } },
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Hóspede não encontrado" }, { status: 404 });
    }

    // Validate: property must belong to the portaria user's condominium
    if (guest.reservation.property.condominiumId !== portariaUser.condominiumId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Validate: reservation must have form filled (not pending_form)
    if (guest.reservation.status === "pending_form") {
      return NextResponse.json({ error: "Reserva ainda aguardando dados do hóspede" }, { status: 400 });
    }

    if (checked) {
      // Mark check-in
      const updated = await prisma.guest.update({
        where: { id: guestId },
        data: {
          checkedInAt: new Date(),
          checkedInById: portariaUser.condoUserId,
          checkedInByName: condoUser.name,
        },
        select: {
          id: true,
          checkedInAt: true,
          checkedInById: true,
          checkedInByName: true,
        },
      });

      return NextResponse.json({ ok: true, guest: updated });
    } else {
      // Undo check-in — log for admin audit
      const previousData = {
        guestId: guest.id,
        guestName: guest.fullName,
        previousCheckedInAt: guest.checkedInAt?.toISOString() || null,
        previousCheckedInById: guest.checkedInById,
        previousCheckedInByName: guest.checkedInByName,
        undoneById: portariaUser.condoUserId,
        undoneByName: condoUser.name,
      };

      await prisma.$transaction([
        prisma.guest.update({
          where: { id: guestId },
          data: {
            checkedInAt: null,
            checkedInById: null,
            checkedInByName: null,
          },
        }),
        prisma.webhookLog.create({
          data: {
            source: "portaria",
            action: "doorman_checkin_undo",
            payload: JSON.stringify(previousData),
            reservationId: guest.reservationId,
            status: "processed",
          },
        }),
      ]);

      return NextResponse.json({ ok: true, guest: { id: guestId, checkedInAt: null, checkedInById: null, checkedInByName: null } });
    }
  } catch (e) {
    console.error("[portaria/checkins/guestId/checkin]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
