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
    select: {
      id: true,
      status: true,
      hospitableAccountId: true,
      scopes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!connection || connection.status !== "active") {
    return NextResponse.json({ connected: false });
  }

  // Count properties linked via Hospitable
  const linkedProperties = await prisma.property.count({
    where: {
      userId,
      hospitablePropertyId: { not: null },
    },
  });

  // Count reservations from Hospitable
  const hospReservations = await prisma.reservation.count({
    where: {
      userId,
      source: "hospitable",
    },
  });

  return NextResponse.json({
    connected: true,
    connectedAt: connection.createdAt,
    linkedProperties,
    hospReservations,
  });
}

// DELETE — disconnect Hospitable
export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const connection = await prisma.hospitableConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    return NextResponse.json({ error: "Não conectado" }, { status: 404 });
  }

  // Revoke connection (don't delete — keep for audit trail)
  await prisma.hospitableConnection.update({
    where: { userId },
    data: { status: "revoked" },
  });

  return NextResponse.json({ ok: true, message: "Hospitable desconectado" });
}
