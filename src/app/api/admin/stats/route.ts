import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const ADMIN_EMAILS = ["luanbdias@hotmail.com"];

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
  const monthAgo = new Date(todayStart.getTime() - 30 * 86400000);

  // ── Users ──
  const allUsers = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, phone: true, onboardingCompleted: true, createdAt: true,
      _count: { select: { properties: true, reservations: true } },
      reservations: { select: { numGuests: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const usersTotal = allUsers.length;
  const usersThisWeek = allUsers.filter(u => u.createdAt >= weekAgo).length;
  const usersThisMonth = allUsers.filter(u => u.createdAt >= monthAgo).length;
  const usersOnboarded = allUsers.filter(u => u.onboardingCompleted).length;

  // ── Reservations ──
  const allReservations = await prisma.reservation.findMany({
    select: {
      id: true, userId: true, guestFullName: true, numGuests: true, status: true, checkInDate: true, checkOutDate: true,
      nights: true, confirmationCode: true, createdAt: true, sentToDoormanAt: true,
      property: { select: { name: true } },
      user: { select: { email: true, name: true } },
      _count: { select: { guests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const resTotal = allReservations.length;
  const resToday = allReservations.filter(r => r.createdAt >= todayStart).length;
  const resThisWeek = allReservations.filter(r => r.createdAt >= weekAgo).length;
  const resThisMonth = allReservations.filter(r => r.createdAt >= monthAgo).length;

  const statusCounts: Record<string, number> = {};
  allReservations.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  // ── Guests ──
  const guestStats = await prisma.guest.aggregate({ _count: { id: true } });
  const totalGuestsExpected = allReservations.reduce((sum, r) => sum + r.numGuests, 0);
  const totalGuestsRegistered = guestStats._count.id;
  const guestsThisMonth = await prisma.guest.count({ where: { createdAt: { gte: monthAgo } } });
  const guestsThisWeek = await prisma.guest.count({ where: { createdAt: { gte: weekAgo } } });

  // Guest distribution by reservation
  const guestDistribution: Record<number, number> = {};
  allReservations.forEach(r => { guestDistribution[r.numGuests] = (guestDistribution[r.numGuests] || 0) + 1; });

  // ── Properties ──
  const allProperties = await prisma.property.findMany({
    select: {
      id: true, name: true, unitNumber: true, parkingSpot: true, createdAt: true,
      user: { select: { email: true, name: true } },
      doormanPhones: { select: { phone: true, name: true } },
      _count: { select: { reservations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const propsTotal = allProperties.length;
  const propsWithDoorman = allProperties.filter(p => p.doormanPhones.length > 0).length;
  const propsWithUnit = allProperties.filter(p => !!p.unitNumber).length;

  // ── Emails ──
  const emailLogs = await prisma.inboundEmailLog.findMany({
    select: { id: true, fromEmail: true, subject: true, status: true, error: true, createdAt: true, reservationId: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const emailStatusCounts: Record<string, number> = {};
  emailLogs.forEach(e => { emailStatusCounts[e.status] = (emailStatusCounts[e.status] || 0) + 1; });

  const emailsTotal = await prisma.inboundEmailLog.count();
  const emailsToday = emailLogs.filter(e => e.createdAt >= todayStart).length;

  // ── Funnel ──
  const funnel = {
    emailsReceived: emailsTotal,
    reservationsCreated: resTotal,
    formsFilled: (statusCounts["form_filled"] || 0) + (statusCounts["sent_to_doorman"] || 0) + (statusCounts["archived"] || 0),
    sentToDoorman: (statusCounts["sent_to_doorman"] || 0) + (statusCounts["archived"] || 0),
  };

  return NextResponse.json({
    overview: {
      users: { total: usersTotal, thisWeek: usersThisWeek, thisMonth: usersThisMonth, onboarded: usersOnboarded },
      reservations: { total: resTotal, today: resToday, thisWeek: resThisWeek, thisMonth: resThisMonth, byStatus: statusCounts },
      guests: { totalExpected: totalGuestsExpected, totalRegistered: totalGuestsRegistered, thisWeek: guestsThisWeek, thisMonth: guestsThisMonth, distribution: guestDistribution },
      properties: { total: propsTotal, withDoorman: propsWithDoorman, withUnit: propsWithUnit },
      emails: { total: emailsTotal, today: emailsToday, byStatus: emailStatusCounts },
      funnel,
    },
    users: allUsers.map(u => ({
      id: u.id, email: u.email, name: u.name, phone: u.phone,
      onboarded: u.onboardingCompleted, createdAt: u.createdAt,
      properties: u._count.properties, reservations: u._count.reservations,
      lastActivity: u.reservations[0]?.createdAt || null,
    })),
    reservations: allReservations.slice(0, 50).map(r => ({
      id: r.id, guest: r.guestFullName, numGuests: r.numGuests, guestsRegistered: r._count.guests,
      status: r.status, checkIn: r.checkInDate, checkOut: r.checkOutDate, nights: r.nights,
      code: r.confirmationCode, property: r.property.name,
      host: r.user.name || r.user.email, createdAt: r.createdAt, sentAt: r.sentToDoormanAt,
    })),
    properties: allProperties.map(p => ({
      id: p.id, name: p.name, unit: p.unitNumber, parking: p.parkingSpot,
      host: p.user.name || p.user.email, doormanPhones: p.doormanPhones.length,
      reservations: p._count.reservations, createdAt: p.createdAt,
    })),
    emailLogs: emailLogs.map(e => ({
      id: e.id, from: e.fromEmail, subject: e.subject, status: e.status,
      error: e.error, hasReservation: !!e.reservationId, createdAt: e.createdAt,
    })),
  });
}
