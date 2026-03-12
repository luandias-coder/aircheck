import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

async function getCondominiumId(req: NextRequest): Promise<string | null> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload.condominiumId as string;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const condominiumId = await getCondominiumId(req);
  if (!condominiumId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date"); // optional: YYYY-MM-DD
    const range = searchParams.get("range") || "week"; // today, week, all

    // Get all properties linked to this condominium
    const properties = await prisma.property.findMany({
      where: { condominiumId },
      select: { id: true, name: true, unitNumber: true, parkingSpot: true },
    });

    if (properties.length === 0) {
      return NextResponse.json({ checkins: [], properties: [], stats: { today: 0, upcoming: 0, pending: 0 } });
    }

    const propertyIds = properties.map(p => p.id);

    // Build date filter
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    // Fetch reservations for these properties (exclude archived)
    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { not: "archived" },
      },
      include: {
        property: { select: { id: true, name: true, unitNumber: true, parkingSpot: true } },
        guests: {
          select: { id: true, fullName: true, birthDate: true, cpf: true, rg: true, foreign: true, passport: true, rne: true, documentUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse dates and filter
    const parseDate = (d: string) => {
      const [dd, mm, yy] = d.split("/").map(Number);
      return new Date(yy, mm - 1, dd);
    };

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today); weekFromNow.setDate(weekFromNow.getDate() + 7);

    const filtered = reservations.filter(r => {
      if (!r.checkInDate) return false;
      const checkin = parseDate(r.checkInDate);
      if (dateFilter) {
        const [y, m, d] = dateFilter.split("-").map(Number);
        const target = new Date(y, m - 1, d);
        return checkin.getTime() === target.getTime();
      }
      if (range === "today") return checkin.getTime() === today.getTime();
      if (range === "week") return checkin >= today && checkin <= weekFromNow;
      return checkin >= today; // all future
    });

    // Sort by check-in date ascending
    filtered.sort((a, b) => parseDate(a.checkInDate).getTime() - parseDate(b.checkInDate).getTime());

    // Stats
    const todayCheckins = reservations.filter(r => r.checkInDate && parseDate(r.checkInDate).getTime() === today.getTime());
    const upcomingCheckins = reservations.filter(r => r.checkInDate && parseDate(r.checkInDate) > today);
    const pendingForms = reservations.filter(r => r.status === "pending_form");

    // Format response (clean, portaria-friendly)
    const checkins = filtered.map(r => ({
      id: r.id,
      guestName: r.guestFullName,
      guestPhone: r.guestPhone,
      checkInDate: r.checkInDate,
      checkInTime: r.checkInTime,
      checkOutDate: r.checkOutDate,
      checkOutTime: r.checkOutTime,
      numGuests: r.numGuests,
      nights: r.nights,
      status: r.status,
      confirmationCode: r.confirmationCode,
      carPlate: r.carPlate,
      carModel: r.carModel,
      property: r.property,
      guests: r.guests,
    }));

    return NextResponse.json({
      checkins,
      properties,
      stats: {
        today: todayCheckins.length,
        upcoming: upcomingCheckins.length,
        pending: pendingForms.length,
        totalProperties: properties.length,
      },
    });
  } catch (e) {
    console.error("[portaria/checkins]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
