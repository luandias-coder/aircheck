// src/app/api/auth/hospitable/status/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — check connection status
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const connection = await prisma.hospitableConnection.findUnique({
    where: { userId },
    select: { id: true, status: true, hospitableAccountId: true, createdAt: true },
  });

  if (!connection || connection.status !== "active") {
    return NextResponse.json({ connected: false });
  }

  const linkedProperties = await prisma.property.count({
    where: { userId, hospitableListingId: { not: null } },
  });

  const hospReservations = await prisma.reservation.count({
    where: { userId, source: "hospitable" },
  });

  return NextResponse.json({
    connected: true,
    connectedAt: connection.createdAt,
    linkedProperties,
    hospReservations,
  });
}

// DELETE — disconnect
export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const connection = await prisma.hospitableConnection.findUnique({ where: { userId } });
  if (!connection) return NextResponse.json({ error: "Não conectado" }, { status: 404 });

  await prisma.hospitableConnection.update({
    where: { userId },
    data: { status: "revoked" },
  });

  return NextResponse.json({ ok: true, message: "Hospitable desconectado" });
}
