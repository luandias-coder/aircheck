// src/app/api/webhooks/hospitable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, formatDateBR, calculateNights } from "@/lib/hospitable";

export async function POST(req: NextRequest) {
  let logId = "";

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("signature") || req.headers.get("x-webhook-signature") || null;

    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.warn("[webhook/hospitable] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    // Connect webhooks: action is inside body.data.action or body.action
    const event = body.data?.action || body.action || body.event || "";
    const data = body.data || body;

    if (!event) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    const log = await prisma.webhookLog.create({
      data: {
        source: "hospitable",
        action: event,
        payload: rawBody.slice(0, 50000),
        status: "received",
      },
    });
    logId = log.id;

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
    return NextResponse.json({ error: "Processing error", logId }, { status: 200 });
  }
}

// ─── Extract customer ID from various payload locations ───

function extractCustomerId(data: any): string | null {
  return data.channel?.customer?.id
    || data.customer_id
    || data.customer?.id
    || null;
}

// ─── Find user by Connect customer ID ───

async function findUserByCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  // The customerId is the user's cuid (possibly sanitized — alphanumeric only)
  // Try exact match first
  const connection = await prisma.hospitableConnection.findFirst({
    where: { hospitableAccountId: customerId, status: "active" },
    select: { userId: true },
  });
  if (connection) return connection.userId;

  // Try matching by userId directly (customerId = sanitized userId)
  const user = await prisma.user.findFirst({
    where: { id: customerId },
    select: { id: true },
  });
  if (user) return user.id;

  // Try partial match (cuid without special chars)
  const allConnections = await prisma.hospitableConnection.findMany({
    where: { status: "active" },
    select: { userId: true, hospitableAccountId: true },
  });
  for (const conn of allConnections) {
    if (conn.hospitableAccountId?.replace(/[^a-zA-Z0-9]/g, "") === customerId ||
        conn.userId?.replace(/[^a-zA-Z0-9]/g, "") === customerId) {
      return conn.userId;
    }
  }

  return null;
}

async function findUserByListingId(listingId: string | null): Promise<string | null> {
  if (!listingId) return null;
  const prop = await prisma.property.findFirst({
    where: { hospitableListingId: listingId },
    select: { userId: true },
  });
  return prop?.userId || null;
}

// ─── Channel activated ───

async function handleChannelActivated(data: any, logId: string): Promise<NextResponse> {
  const customerId = extractCustomerId(data);
  if (customerId) {
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
// Actual payload path: data.public_name (Airbnb name), data.private_name (Hospitable internal)
// data.platform_id (Airbnb room ID), data.id (Hospitable listing UUID)
// data.channel.customer.id (our user's sanitized cuid)

async function handleListingEvent(data: any, logId: string): Promise<NextResponse> {
  const customerId = extractCustomerId(data);
  const listingId = data.id;
  const listingName = data.public_name || data.name || data.nickname || "Imóvel";
  const platformId = data.platform_id || null;
  const photoUrl = data.picture || null;
  const address = data.address ? [data.address.street, data.address.apt, data.address.city].filter(Boolean).join(", ") : null;

  const userId = await findUserByCustomerId(customerId);
  if (!userId) {
    // Fallback: find any active connection
    const anyConn = await prisma.hospitableConnection.findFirst({
      where: { status: "active" },
      select: { userId: true },
    });
    if (!anyConn) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: `User not found for customer: ${customerId}` },
      });
      return NextResponse.json({ ok: false, error: "User not found", logId });
    }
    // Use fallback
    return await syncListing(anyConn.userId, data, logId);
  }

  return await syncListing(userId, data, logId);
}

async function syncListing(userId: string, data: any, logId: string): Promise<NextResponse> {
  const listingId = data.id;
  const listingName = data.public_name || data.name || data.nickname || "Imóvel";
  const platformId = data.platform_id || null;
  const photoUrl = data.picture || null;

  let property = null;

  // Match by hospitableListingId
  if (listingId) {
    property = await prisma.property.findFirst({
      where: { userId, hospitableListingId: listingId },
    });
  }
  // Match by airbnbRoomId
  if (!property && platformId) {
    property = await prisma.property.findFirst({
      where: { userId, airbnbRoomId: platformId },
    });
  }
  // Match by name (use real Airbnb name)
  if (!property) {
    property = await prisma.property.findFirst({
      where: { userId, name: listingName },
    });
  }

  if (property) {
    await prisma.property.update({
      where: { id: property.id },
      data: {
        hospitableListingId: listingId || property.hospitableListingId,
        airbnbRoomId: platformId || property.airbnbRoomId,
        name: listingName, // Always update to real Airbnb name
        photoUrl: photoUrl || property.photoUrl,
      },
    });
  } else {
    await prisma.property.create({
      data: {
        userId,
        name: listingName,
        airbnbRoomId: platformId,
        hospitableListingId: listingId,
        photoUrl,
      },
    });
  }

  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed" },
  });
  return NextResponse.json({ ok: true, action: "listing.synced", listingName, logId });
}

// ─── Reservation created ───
// Connect payload: data.guest.first_name/last_name, data.check_in/check_out (ISO dates),
// data.platform_id (confirmation code), data.listing.id, data.channel.customer.id

async function handleReservationCreated(data: any, logId: string): Promise<NextResponse> {
  const hospReservationId = data.id;
  const customerId = extractCustomerId(data);
  const listingId = data.listing_id || data.listing?.id;

  // Guest info
  const guest = data.guest || {};
  const guestName = guest.full_name || guest.name ||
    [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
  const guestPhone = guest.phone || null;
  const guestPhotoUrl = guest.picture_url || guest.picture || guest.photo || null;

  // Dates — Connect sends ISO format or date strings
  const arrivalRaw = data.check_in || data.arrival_date || data.check_in_date || data.checkin_date;
  const departureRaw = data.check_out || data.departure_date || data.check_out_date || data.checkout_date;
  const checkInDate = formatDateBR(arrivalRaw?.split("T")[0]);
  const checkOutDate = formatDateBR(departureRaw?.split("T")[0]);
  const checkInTime = data.check_in_time || data.checkin_time || "15:00";
  const checkOutTime = data.check_out_time || data.checkout_time || "12:00";
  const numGuests = data.guests || data.number_of_guests || data.guests_count || 1;
  const nights = data.nights || calculateNights(arrivalRaw?.split("T")[0], departureRaw?.split("T")[0]);
  const confirmationCode = data.confirmation_code || data.platform_id || data.code || null;
  const conversationId = data.conversation_id || null;

  // Find user
  let userId = await findUserByCustomerId(customerId) || await findUserByListingId(listingId);
  if (!userId) {
    const conn = await prisma.hospitableConnection.findFirst({
      where: { status: "active" },
      select: { userId: true },
    });
    if (!conn) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: "No active connection found" },
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
    const listingName = data.listing?.public_name || data.listing?.name || data.listing_name || "Imóvel Hospitable";
    property = await prisma.property.create({
      data: { userId, name: listingName, hospitableListingId: listingId },
    });
  }

  // Dedup by hospitable reservation ID
  if (hospReservationId) {
    const existing = await prisma.reservation.findUnique({
      where: { hospitableReservationId: hospReservationId },
    });
    if (existing) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "duplicate", reservationId: existing.id },
      });
      return NextResponse.json({ ok: true, action: "duplicate", logId });
    }
  }

  // Dedup by confirmation code
  if (confirmationCode) {
    const existing = await prisma.reservation.findFirst({
      where: { userId, confirmationCode },
    });
    if (existing) {
      // Link but DON'T change source — preserve original
      await prisma.reservation.update({
        where: { id: existing.id },
        data: { hospitableReservationId: hospReservationId },
      });
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "duplicate", reservationId: existing.id, error: "Linked existing" },
      });
      return NextResponse.json({ ok: true, action: "linked", logId });
    }
  }

  // Create
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
  return NextResponse.json({ ok: true, action: "created", reservationId: reservation.id, logId });
}

// ─── Reservation changed ───

async function handleReservationChanged(data: any, logId: string): Promise<NextResponse> {
  const hospReservationId = data.id;
  const confirmationCode = data.confirmation_code || data.platform_id || data.code;

  let reservation = hospReservationId
    ? await prisma.reservation.findUnique({ where: { hospitableReservationId: hospReservationId } })
    : null;

  if (!reservation && confirmationCode) {
    reservation = await prisma.reservation.findFirst({ where: { confirmationCode } });
  }

  if (!reservation) {
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: "Not found, treating as creation" },
    });
    return handleReservationCreated(data, logId);
  }

  const hospStatus = (data.status || "").toLowerCase();
  let aircheckStatus = reservation.status;
  if (hospStatus === "cancelled" || hospStatus === "not_accepted" || hospStatus === "denied") {
    aircheckStatus = "cancelled";
  }

  const updateData: any = {
    hospitableReservationId: hospReservationId || reservation.hospitableReservationId,
  };

  const arrival = data.check_in || data.arrival_date;
  const departure = data.check_out || data.departure_date;
  if (arrival) updateData.checkInDate = formatDateBR(arrival.split("T")[0]);
  if (departure) updateData.checkOutDate = formatDateBR(departure.split("T")[0]);
  if (data.check_in_time || data.checkin_time) updateData.checkInTime = data.check_in_time || data.checkin_time;
  if (data.check_out_time || data.checkout_time) updateData.checkOutTime = data.check_out_time || data.checkout_time;
  if (data.guests || data.number_of_guests) updateData.numGuests = data.guests || data.number_of_guests;
  if (aircheckStatus !== reservation.status) updateData.status = aircheckStatus;

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
