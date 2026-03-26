// src/app/api/webhooks/hospitable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, formatDateBR, calculateNights } from "@/lib/hospitable";

export async function POST(req: NextRequest) {
  let logId = "";

  try {
    // ── Read raw body for signature verification ──
    const rawBody = await req.text();
    const signature = req.headers.get("signature") || req.headers.get("x-webhook-signature") || null;

    // Verify webhook signature (HMAC SHA256)
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.warn("[webhook/hospitable] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ── Parse payload ──
    const body = JSON.parse(rawBody);
    const event = body.event || body.action || "";
    const data = body.data || body;

    if (!event) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    // ── Log webhook ──
    const log = await prisma.webhookLog.create({
      data: {
        source: "hospitable",
        action: event,
        payload: rawBody.slice(0, 50000),
        status: "received",
      },
    });
    logId = log.id;

    // ── Route by event ──
    switch (event) {
      case "channel.activated":
        return await handleChannelActivated(data, logId);

      case "listing.created":
      case "listing.updated":
        return await handleListingEvent(data, logId);

      case "reservation.created":
        return await handleReservationCreated(data, logId);

      case "reservation.updated":
      case "reservation.changed":
        return await handleReservationChanged(data, logId);

      case "message.created":
        await prisma.webhookLog.update({
          where: { id: logId },
          data: { status: "processed", error: "message — logged only" },
        });
        return NextResponse.json({ ok: true, action: "message.logged", logId });

      default:
        await prisma.webhookLog.update({
          where: { id: logId },
          data: { status: "processed", error: `Unhandled: ${event}` },
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
    // Return 200 to prevent retries for processing errors
    return NextResponse.json({ error: "Processing error", logId }, { status: 200 });
  }
}

// ─── Find user by Connect customer ID ───

async function findUserByCustomerId(customerId: string): Promise<string | null> {
  if (!customerId) return null;
  // Customer ID is the user's sanitized cuid
  const connection = await prisma.hospitableConnection.findFirst({
    where: { hospitableAccountId: customerId, status: "active" },
    select: { userId: true },
  });
  return connection?.userId || null;
}

async function findUserByListingId(listingId: string): Promise<string | null> {
  if (!listingId) return null;
  const prop = await prisma.property.findFirst({
    where: { hospitableListingId: listingId },
    select: { userId: true },
  });
  return prop?.userId || null;
}

// ─── Channel activated (Airbnb connected) ───

async function handleChannelActivated(data: any, logId: string): Promise<NextResponse> {
  const customerId = data.customer_id || data.customer?.id;

  if (customerId) {
    // Ensure connection is marked active
    const connection = await prisma.hospitableConnection.findFirst({
      where: { hospitableAccountId: customerId },
    });
    if (connection && connection.status !== "active") {
      await prisma.hospitableConnection.update({
        where: { id: connection.id },
        data: { status: "active" },
      });
    }
  }

  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed" },
  });

  return NextResponse.json({ ok: true, action: "channel.activated", logId });
}

// ─── Listing created/updated ───

async function handleListingEvent(data: any, logId: string): Promise<NextResponse> {
  const customerId = data.customer_id || data.customer?.id;
  const listingId = data.id;
  const listingName = data.name || data.nickname || data.platform_name || "Imóvel";
  const platformId = data.platform_listing_id || data.platform_id || null;

  const userId = await findUserByCustomerId(customerId);
  if (!userId) {
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "error", error: `User not found for customer: ${customerId}` },
    });
    return NextResponse.json({ ok: false, error: "User not found", logId });
  }

  // Find or create property
  let property = null;

  if (listingId) {
    property = await prisma.property.findFirst({
      where: { userId, hospitableListingId: listingId },
    });
  }
  if (!property && platformId) {
    property = await prisma.property.findFirst({
      where: { userId, airbnbRoomId: platformId },
    });
  }

  if (property) {
    await prisma.property.update({
      where: { id: property.id },
      data: {
        hospitableListingId: listingId || property.hospitableListingId,
        airbnbRoomId: platformId || property.airbnbRoomId,
        name: listingName, // Update to real Airbnb name
      },
    });
  } else {
    await prisma.property.create({
      data: {
        userId,
        name: listingName,
        airbnbRoomId: platformId,
        hospitableListingId: listingId,
      },
    });
  }

  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed" },
  });

  return NextResponse.json({ ok: true, action: "listing.synced", logId });
}

// ─── Reservation created ───

async function handleReservationCreated(data: any, logId: string): Promise<NextResponse> {
  const hospReservationId = data.id;
  const customerId = data.customer_id || data.customer?.id;
  const listingId = data.listing_id || data.listing?.id;

  // Extract guest info
  const guest = data.guest || {};
  const guestName = guest.full_name || guest.name ||
    [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
  const guestPhone = guest.phone || null;
  const guestPhotoUrl = guest.picture_url || guest.photo || null;

  // Extract dates
  const checkInDate = formatDateBR(data.arrival_date || data.check_in_date || data.checkin_date);
  const checkOutDate = formatDateBR(data.departure_date || data.check_out_date || data.checkout_date);
  const checkInTime = data.checkin_time || data.check_in_time || "15:00";
  const checkOutTime = data.checkout_time || data.check_out_time || "12:00";
  const numGuests = data.number_of_guests || data.guests_count || 1;
  const nights = data.nights || calculateNights(data.arrival_date || data.check_in_date, data.departure_date || data.check_out_date);
  const confirmationCode = data.confirmation_code || data.code || null;
  const conversationId = data.conversation_id || null;
  const platform = data.platform || "airbnb";

  // Find user
  let userId = await findUserByCustomerId(customerId) || await findUserByListingId(listingId);

  if (!userId) {
    // Fallback: find any active connection
    const conn = await prisma.hospitableConnection.findFirst({
      where: { status: "active" },
      select: { userId: true },
    });
    if (!conn) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: "No active Hospitable connection found" },
      });
      return NextResponse.json({ ok: false, error: "No user found", logId });
    }
    userId = conn.userId;
  }

  // Find property
  let property = null;
  if (listingId) {
    property = await prisma.property.findFirst({
      where: { userId, hospitableListingId: listingId },
    });
  }
  if (!property) {
    // Create a placeholder property
    const listingName = data.listing?.name || data.listing_name || "Imóvel Hospitable";
    property = await prisma.property.create({
      data: {
        userId,
        name: listingName,
        hospitableListingId: listingId,
      },
    });
  }

  // Check duplicate by hospitable reservation ID
  if (hospReservationId) {
    const existing = await prisma.reservation.findUnique({
      where: { hospitableReservationId: hospReservationId },
    });
    if (existing) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "duplicate", reservationId: existing.id },
      });
      return NextResponse.json({ ok: true, action: "duplicate", reservationId: existing.id, logId });
    }
  }

  // Check duplicate by confirmation code
  if (confirmationCode) {
    const existing = await prisma.reservation.findFirst({
      where: { userId, confirmationCode },
    });
    if (existing) {
      await prisma.reservation.update({
        where: { id: existing.id },
        data: { hospitableReservationId: hospReservationId, source: "hospitable" },
      });
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "duplicate", reservationId: existing.id, error: "Linked existing reservation" },
      });
      return NextResponse.json({ ok: true, action: "linked", reservationId: existing.id, logId });
    }
  }

  // Create reservation
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
      airbnbThreadId: conversationId,
      source: "hospitable",
      hospitableReservationId: hospReservationId,
      status: "pending_form",
    },
  });

  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed", reservationId: reservation.id },
  });

  return NextResponse.json({
    ok: true,
    action: "created",
    reservationId: reservation.id,
    guest: guestName,
    logId,
  });
}

// ─── Reservation changed ───

async function handleReservationChanged(data: any, logId: string): Promise<NextResponse> {
  const hospReservationId = data.id;
  const confirmationCode = data.confirmation_code || data.code;

  // Find existing reservation
  let reservation = hospReservationId
    ? await prisma.reservation.findUnique({ where: { hospitableReservationId: hospReservationId } })
    : null;

  if (!reservation && confirmationCode) {
    reservation = await prisma.reservation.findFirst({ where: { confirmationCode } });
  }

  if (!reservation) {
    // Not found — treat as creation
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: "reservation.changed — not found, treating as creation" },
    });
    return handleReservationCreated(data, logId);
  }

  // Map status
  const hospStatus = (data.status || "").toLowerCase();
  let aircheckStatus = reservation.status;
  if (hospStatus === "cancelled" || hospStatus === "not_accepted" || hospStatus === "denied") {
    aircheckStatus = "cancelled";
  }

  // Build update
  const updateData: any = {
    hospitableReservationId: hospReservationId || reservation.hospitableReservationId,
  };

  const arrival = data.arrival_date || data.check_in_date;
  const departure = data.departure_date || data.check_out_date;
  if (arrival) updateData.checkInDate = formatDateBR(arrival);
  if (departure) updateData.checkOutDate = formatDateBR(departure);
  if (data.checkin_time || data.check_in_time) updateData.checkInTime = data.checkin_time || data.check_in_time;
  if (data.checkout_time || data.check_out_time) updateData.checkOutTime = data.checkout_time || data.check_out_time;
  if (data.number_of_guests || data.guests_count) updateData.numGuests = data.number_of_guests || data.guests_count;
  if (aircheckStatus !== reservation.status) updateData.status = aircheckStatus;

  // Update guest info only if form not yet filled
  if (reservation.status === "pending_form") {
    const guest = data.guest || {};
    const guestName = guest.full_name || guest.name || [guest.first_name, guest.last_name].filter(Boolean).join(" ");
    if (guestName) updateData.guestFullName = guestName;
    if (guest.phone) updateData.guestPhone = guest.phone;
  }

  await prisma.reservation.update({ where: { id: reservation.id }, data: updateData });

  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed", reservationId: reservation.id },
  });

  return NextResponse.json({ ok: true, action: "updated", reservationId: reservation.id, logId });
}
