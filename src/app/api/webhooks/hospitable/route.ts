// src/app/api/webhooks/hospitable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isValidWebhookSource,
  formatDateBR,
  calculateNights,
  type HospitableReservationWebhook,
} from "@/lib/hospitable";

const WEBHOOK_SECRET = process.env.HOSPITABLE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  let logId = "";

  try {
    // ── Validate source ──
    const headerSecret = req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    if (!isValidWebhookSource(forwardedFor, WEBHOOK_SECRET, headerSecret)) {
      // Be lenient during development — log but don't reject
      console.warn("[webhook/hospitable] Unverified source:", { ip: forwardedFor, hasSecret: !!headerSecret });
    }

    // ── Parse payload ──
    const body: HospitableReservationWebhook = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // ── Log webhook ──
    const log = await prisma.webhookLog.create({
      data: {
        source: "hospitable",
        action,
        payload: JSON.stringify(body, null, 2).slice(0, 50000),
        status: "received",
      },
    });
    logId = log.id;

    // ── Route by action ──
    switch (action) {
      case "reservation.created":
        return await handleReservationCreated(data, logId);

      case "reservation.changed":
        return await handleReservationChanged(data, logId);

      case "message.created":
        // Log only for now — future: could forward to host or update conversation
        await prisma.webhookLog.update({
          where: { id: logId },
          data: { status: "processed", error: "message.created — logged only" },
        });
        return NextResponse.json({ ok: true, action: "message.logged", logId });

      default:
        await prisma.webhookLog.update({
          where: { id: logId },
          data: { status: "processed", error: `Unhandled action: ${action}` },
        });
        return NextResponse.json({ ok: true, action: "ignored", logId });
    }
  } catch (e: any) {
    console.error("[webhook/hospitable] Error:", e);

    if (logId) {
      try {
        await prisma.webhookLog.update({
          where: { id: logId },
          data: { status: "error", error: e.message || "Erro interno" },
        });
      } catch {}
    }

    // Always return 200 to prevent Hospitable retries for processing errors
    // Only return non-200 for genuinely bad requests
    return NextResponse.json({ error: "Processing error", logId }, { status: 200 });
  }
}

// ─── Handlers ───

async function handleReservationCreated(
  data: HospitableReservationWebhook["data"],
  logId: string
): Promise<NextResponse> {
  const hospReservationId = data.id;

  // Extract guest info
  const guestName = data.guest?.full_name ||
    [data.guest?.first_name, data.guest?.last_name].filter(Boolean).join(" ") ||
    "Hóspede";
  const guestPhone = data.guest?.phone || null;
  const guestPhotoUrl = data.guest?.picture_url || null;

  // Extract listing info to find the AirCheck property
  const listing = data.listings?.[0];
  const hospitablePropertyId = data.property?.id || null;
  const hospitableListingId = listing?.id || null;
  const airbnbRoomId = listing?.platform_id || null;
  const propertyName = data.property?.name || listing?.name || "Imóvel Hospitable";
  const platform = data.platform || listing?.platform || "airbnb";

  // Extract dates
  const checkInDate = formatDateBR(data.arrival_date);
  const checkOutDate = formatDateBR(data.departure_date);
  const checkInTime = data.checkin_time || "15:00";
  const checkOutTime = data.checkout_time || "12:00";
  const numGuests = data.number_of_guests || 1;
  const nights = data.nights || calculateNights(data.arrival_date, data.departure_date);
  const confirmationCode = data.code || null;
  const conversationId = data.conversation_id || null;

  // Extract financials
  const hostPayment = data.financials?.host_payout
    ? `${data.financials.currency || "BRL"} ${data.financials.host_payout}`
    : null;

  // ── Find user by Hospitable connection ──
  // Strategy: find properties with matching hospitablePropertyId or hospitableListingId or airbnbRoomId
  let userId: string | null = null;
  let property: any = null;

  // Try 1: Match by hospitableListingId
  if (hospitableListingId) {
    property = await prisma.property.findFirst({
      where: { hospitableListingId },
      select: { id: true, userId: true, name: true },
    });
  }

  // Try 2: Match by hospitablePropertyId
  if (!property && hospitablePropertyId) {
    property = await prisma.property.findFirst({
      where: { hospitablePropertyId },
      select: { id: true, userId: true, name: true },
    });
  }

  // Try 3: Match by Airbnb room ID
  if (!property && airbnbRoomId) {
    property = await prisma.property.findFirst({
      where: { airbnbRoomId },
      select: { id: true, userId: true, name: true },
    });
  }

  // Try 4: Find any user with an active Hospitable connection
  // and create/find property for them
  if (!property) {
    const connection = await prisma.hospitableConnection.findFirst({
      where: { status: "active" },
      select: { userId: true },
    });

    if (!connection) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: "error",
          error: "Nenhuma conexão Hospitable ativa encontrada",
        },
      });
      return NextResponse.json({
        ok: false,
        error: "No active Hospitable connection",
        logId,
      });
    }

    userId = connection.userId;

    // Try to find existing property by name for this user
    property = await prisma.property.findFirst({
      where: { userId, name: propertyName },
      select: { id: true, userId: true, name: true },
    });

    // Create property if it doesn't exist
    if (!property) {
      property = await prisma.property.create({
        data: {
          userId,
          name: propertyName,
          airbnbRoomId,
          hospitablePropertyId,
          hospitableListingId,
        },
        select: { id: true, userId: true, name: true },
      });
    }
  }

  userId = property.userId;

  // Update property with Hospitable IDs if missing
  if (hospitablePropertyId || hospitableListingId || airbnbRoomId) {
    const updateData: any = {};
    if (hospitablePropertyId && !property.hospitablePropertyId) updateData.hospitablePropertyId = hospitablePropertyId;
    if (hospitableListingId && !property.hospitableListingId) updateData.hospitableListingId = hospitableListingId;
    if (airbnbRoomId && !property.airbnbRoomId) updateData.airbnbRoomId = airbnbRoomId;

    if (Object.keys(updateData).length > 0) {
      await prisma.property.update({
        where: { id: property.id },
        data: updateData,
      });
    }
  }

  // ── Check duplicate ──
  // By hospitable reservation ID (most reliable)
  if (hospReservationId) {
    const existing = await prisma.reservation.findUnique({
      where: { hospitableReservationId: hospReservationId },
    });
    if (existing) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: "duplicate",
          reservationId: existing.id,
          error: `Duplicata por hospitableReservationId: ${hospReservationId}`,
        },
      });
      return NextResponse.json({ ok: true, action: "duplicate", reservationId: existing.id, logId });
    }
  }

  // By confirmation code
  if (confirmationCode) {
    const existing = await prisma.reservation.findFirst({
      where: { userId, confirmationCode },
    });
    if (existing) {
      // Update with hospitable ID for future dedup
      await prisma.reservation.update({
        where: { id: existing.id },
        data: {
          hospitableReservationId: hospReservationId,
          source: "hospitable",
        },
      });
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: "duplicate",
          reservationId: existing.id,
          error: `Duplicata por confirmationCode: ${confirmationCode} — vinculada ao Hospitable`,
        },
      });
      return NextResponse.json({ ok: true, action: "linked", reservationId: existing.id, logId });
    }
  }

  // ── Create reservation ──
  const reservation = await prisma.reservation.create({
    data: {
      userId,
      propertyId: property.id,
      guestFullName: guestName,
      guestPhone,
      guestPhotoUrl,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      numGuests,
      nights,
      confirmationCode,
      hostPayment,
      airbnbThreadId: conversationId,
      source: "hospitable",
      hospitableReservationId: hospReservationId,
      status: "pending_form",
    },
  });

  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "processed",
      reservationId: reservation.id,
    },
  });

  return NextResponse.json({
    ok: true,
    action: "created",
    reservationId: reservation.id,
    guest: guestName,
    property: propertyName,
    logId,
  });
}

async function handleReservationChanged(
  data: HospitableReservationWebhook["data"],
  logId: string
): Promise<NextResponse> {
  const hospReservationId = data.id;

  // Find existing reservation
  let reservation = hospReservationId
    ? await prisma.reservation.findUnique({
        where: { hospitableReservationId: hospReservationId },
      })
    : null;

  // Fallback: find by confirmation code
  if (!reservation && data.code) {
    reservation = await prisma.reservation.findFirst({
      where: { confirmationCode: data.code },
    });
  }

  if (!reservation) {
    // Reservation not found — might have been created before Hospitable integration
    // Try to create it instead
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: "reservation.changed — reserva não encontrada, tratando como criação" },
    });
    return handleReservationCreated(data, logId);
  }

  // ── Map Hospitable status → AirCheck status ──
  const hospStatus = data.status?.toLowerCase();
  let aircheckStatus = reservation.status;

  if (hospStatus === "cancelled" || hospStatus === "not_accepted") {
    aircheckStatus = "cancelled";
  }
  // Don't change status for other Hospitable statuses — AirCheck has its own flow
  // (pending_form → form_filled → sent_to_doorman → archived)

  // ── Update reservation ──
  const updateData: any = {
    hospitableReservationId: hospReservationId || reservation.hospitableReservationId,
  };

  if (data.arrival_date) updateData.checkInDate = formatDateBR(data.arrival_date);
  if (data.departure_date) updateData.checkOutDate = formatDateBR(data.departure_date);
  if (data.checkin_time) updateData.checkInTime = data.checkin_time;
  if (data.checkout_time) updateData.checkOutTime = data.checkout_time;
  if (data.number_of_guests) updateData.numGuests = data.number_of_guests;
  if (data.nights) updateData.nights = data.nights;
  if (aircheckStatus !== reservation.status) updateData.status = aircheckStatus;

  // Update guest info if provided and reservation is still pending
  if (reservation.status === "pending_form") {
    const guestName = data.guest?.full_name ||
      [data.guest?.first_name, data.guest?.last_name].filter(Boolean).join(" ");
    if (guestName) updateData.guestFullName = guestName;
    if (data.guest?.phone) updateData.guestPhone = data.guest.phone;
    if (data.guest?.picture_url) updateData.guestPhotoUrl = data.guest.picture_url;
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: updateData,
  });

  await prisma.webhookLog.update({
    where: { id: logId },
    data: {
      status: "processed",
      reservationId: reservation.id,
    },
  });

  return NextResponse.json({
    ok: true,
    action: "updated",
    reservationId: reservation.id,
    changes: Object.keys(updateData),
    logId,
  });
}
