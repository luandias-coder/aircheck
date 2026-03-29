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
      case "listing.changed":
        return await handleListingEvent(data, logId);

      case "reservation.created":
        return await handleReservationCreated(data, logId);

      case "reservation.updated":
      case "reservation.changed":
        return await handleReservationChanged(data, logId);

      case "message.created":
        return await handleMessageCreated(data, logId);

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

    // Always return 200 to prevent Hospitable retries for processing errors
    return NextResponse.json({ error: "Processing error", logId }, { status: 200 });
  }
}

// ─── Helpers ───

function extractCustomerId(data: any): string | null {
  // Connect puts customer ID in various places
  const raw =
    data.channel?.customer?.id ||
    data.customer?.id ||
    data.customer_id ||
    null;
  return raw ? String(raw).replace(/[^a-zA-Z0-9_-]/g, "") : null;
}

async function findUserByCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;

  // Direct match by hospitableAccountId
  const direct = await prisma.hospitableConnection.findFirst({
    where: { hospitableAccountId: customerId, status: "active" },
    select: { userId: true },
  });
  if (direct) return direct.userId;

  // Fuzzy match (strip non-alphanumeric)
  const allConnections = await prisma.hospitableConnection.findMany({
    where: { status: "active" },
    select: { userId: true, hospitableAccountId: true },
  });
  for (const conn of allConnections) {
    if (conn.hospitableAccountId?.replace(/[^a-zA-Z0-9]/g, "") === customerId) {
      return conn.userId;
    }
  }

  return null;
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

async function handleListingEvent(data: any, logId: string): Promise<NextResponse> {
  const customerId = extractCustomerId(data);
  const listingId = data.id;
  const listingName = data.public_name || data.name || data.nickname || "Imóvel";
  const platformId = data.platform_id || null;
  const photoUrl = data.picture || null;

  // ── Extract address (NEW) ──
  const addr = data.address || {};
  const addressStreet = addr.street || null;
  const addressApt = addr.apt || null;
  const addressCity = addr.city || null;
  const addressState = addr.state || null;
  const addressZipcode = addr.zipcode || addr.zip || addr.postal_code || null;

  // Find user
  const userId = await findUserByCustomerId(customerId);
  if (!userId) {
    // Fallback: any active connection
    const anyConn = await prisma.hospitableConnection.findFirst({
      where: { status: "active" },
      select: { userId: true },
    });
    if (!anyConn) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: "No active connection found" },
      });
      return NextResponse.json({ ok: false, error: "No connection", logId });
    }

    // Use fallback userId
    const fallbackUserId = anyConn.userId;
    const property = await prisma.property.findFirst({
      where: { userId: fallbackUserId, hospitableListingId: listingId },
    });

    if (property) {
      await prisma.property.update({
        where: { id: property.id },
        data: {
          airbnbRoomId: platformId || property.airbnbRoomId,
          name: listingName,
          photoUrl: photoUrl || property.photoUrl,
          addressStreet: addressStreet || property.addressStreet,
          addressApt: addressApt || property.addressApt,
          addressCity: addressCity || property.addressCity,
          addressState: addressState || property.addressState,
          addressZipcode: addressZipcode || property.addressZipcode,
        },
      });
    } else {
      await prisma.property.create({
        data: {
          userId: fallbackUserId,
          name: listingName,
          airbnbRoomId: platformId,
          hospitableListingId: listingId,
          photoUrl,
          addressStreet,
          addressApt,
          addressCity,
          addressState,
          addressZipcode,
        },
      });
    }

    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed" },
    });
    return NextResponse.json({ ok: true, action: "listing.synced", listingName, logId });
  }

  // Found userId — find or create property
  let property = listingId
    ? await prisma.property.findFirst({ where: { hospitableListingId: listingId } })
    : null;

  if (!property && platformId) {
    property = await prisma.property.findFirst({ where: { userId, airbnbRoomId: platformId } });
  }

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
        name: listingName,
        photoUrl: photoUrl || property.photoUrl,
        addressStreet: addressStreet || property.addressStreet,
        addressApt: addressApt || property.addressApt,
        addressCity: addressCity || property.addressCity,
        addressState: addressState || property.addressState,
        addressZipcode: addressZipcode || property.addressZipcode,
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
        addressStreet,
        addressApt,
        addressCity,
        addressState,
        addressZipcode,
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
  const guestEmail = guest.email || null; // NEW: capture guest email if available

  // Platform (NEW)
  const platform = data.platform || data.listing?.platform || data.channel?.platform || "airbnb";

  // Dates — Connect sends ISO format or date strings
  const arrivalRaw = data.check_in || data.arrival_date || data.check_in_date || data.checkin_date;
  const departureRaw = data.check_out || data.departure_date || data.check_out_date || data.checkout_date;
  const checkInDate = formatDateBR(arrivalRaw?.split("T")[0]);
  const checkOutDate = formatDateBR(departureRaw?.split("T")[0]);
  const checkInTime = data.check_in_time || data.checkin_time || "15:00";
  const checkOutTime = data.check_out_time || data.checkout_time || "12:00";
  const numGuests = data.guests?.total || data.number_of_guests || data.guests || 1;
  const nights = data.nights || calculateNights(arrivalRaw?.split("T")[0], departureRaw?.split("T")[0]);
  const confirmationCode = data.platform_id || data.code || data.confirmation_code || null;
  const conversationId = data.conversation_id || data.conversation?.id || null;

  // Financials — structured (NEW) + legacy string
  const financials = data.financials || {};
  let payoutAmount: number | null = null;
  let payoutCurrency: string | null = null;
  let hostPayment: string | null = null;

  // Try Connect format: financials.host_payout + currency
  if (financials.host_payout != null) {
    payoutAmount = Number(financials.host_payout) || null;
    payoutCurrency = financials.currency || "BRL";
    hostPayment = `${payoutCurrency} ${financials.host_payout}`;
  }
  // Try sync format: financials.host.payout
  else if (financials.host?.payout) {
    const payout = financials.host.payout;
    payoutAmount = payout.amount != null ? Number(payout.amount) : null;
    payoutCurrency = payout.currency || "BRL";
    hostPayment = payout.formatted || (payoutAmount ? `${payoutCurrency} ${payoutAmount}` : null);
  }

  // ── Find property ──
  let userId: string | null = null;
  let property: any = null;

  // Try by hospitableListingId
  if (listingId) {
    property = await prisma.property.findFirst({
      where: { hospitableListingId: listingId },
      select: { id: true, userId: true, name: true },
    });
  }

  // Try by airbnbRoomId from listing
  const airbnbRoomId = data.listing?.platform_id || null;
  if (!property && airbnbRoomId) {
    property = await prisma.property.findFirst({
      where: { airbnbRoomId },
      select: { id: true, userId: true, name: true },
    });
  }

  // Try by customerId → user → any property
  if (!property) {
    userId = await findUserByCustomerId(customerId);
    if (!userId) {
      const anyConn = await prisma.hospitableConnection.findFirst({
        where: { status: "active" },
        select: { userId: true },
      });
      userId = anyConn?.userId || null;
    }

    if (!userId) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: "No active connection found" },
      });
      return NextResponse.json({ ok: false, error: "No connection", logId });
    }

    // Try to find by property name
    const propertyName = data.property?.name || data.listing?.name || "Imóvel Hospitable";
    property = await prisma.property.findFirst({
      where: { userId, name: propertyName },
      select: { id: true, userId: true, name: true },
    });

    if (!property) {
      // Create new property
      property = await prisma.property.create({
        data: {
          userId,
          name: propertyName,
          airbnbRoomId,
          hospitableListingId: listingId,
        },
        select: { id: true, userId: true, name: true },
      });
    }
  }

  userId = property.userId;

  if (!userId) {
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "error", error: "userId not resolved after property match" },
    });
    return NextResponse.json({ ok: false, error: "No user", logId });
  }

  // ── Dedup by hospitableReservationId ──
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

  // ── Dedup by confirmation code — DON'T change source ──
  if (confirmationCode && userId) {
    const existing = await prisma.reservation.findFirst({
      where: { userId, confirmationCode },
    });
    if (existing) {
      // Link but DON'T change source — preserve original
      await prisma.reservation.update({
        where: { id: existing.id },
        data: {
          hospitableReservationId: hospReservationId,
          // Backfill new fields if missing
          platform: existing.platform || platform,
          guestEmail: existing.guestEmail || guestEmail,
          payoutAmount: existing.payoutAmount ?? payoutAmount,
          payoutCurrency: existing.payoutCurrency || payoutCurrency,
        },
      });
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "duplicate", reservationId: existing.id, error: "Linked existing" },
      });
      return NextResponse.json({ ok: true, action: "linked", logId });
    }
  }

  // ── Create reservation ──
  const reservation = await prisma.reservation.create({
    data: {
      userId,
      propertyId: property.id,
      guestFullName: guestName,
      guestPhone,
      guestEmail,
      guestPhotoUrl,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      numGuests: typeof numGuests === "number" ? numGuests : 1,
      nights,
      confirmationCode,
      hostPayment,
      payoutAmount,
      payoutCurrency,
      platform,
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
    property: property.name,
    logId,
  });
}

// ─── Reservation changed ───

async function handleReservationChanged(data: any, logId: string): Promise<NextResponse> {
  const hospReservationId = data.id;
  const confirmationCode = data.platform_id || data.code || data.confirmation_code;

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

  // Dates
  const arrival = data.check_in || data.arrival_date;
  const departure = data.check_out || data.departure_date;
  if (arrival) updateData.checkInDate = formatDateBR(arrival.split("T")[0]);
  if (departure) updateData.checkOutDate = formatDateBR(departure.split("T")[0]);
  if (data.check_in_time || data.checkin_time) updateData.checkInTime = data.check_in_time || data.checkin_time;
  if (data.check_out_time || data.checkout_time) updateData.checkOutTime = data.check_out_time || data.checkout_time;
  if (data.guests?.total || data.number_of_guests) updateData.numGuests = data.guests?.total || data.number_of_guests;
  if (aircheckStatus !== reservation.status) updateData.status = aircheckStatus;

  // Platform (NEW — backfill if missing)
  const platform = data.platform || data.listing?.platform || data.channel?.platform;
  if (platform && !reservation.platform) updateData.platform = platform;

  // Financials (NEW — update if provided)
  const financials = data.financials || {};
  if (financials.host_payout != null) {
    updateData.payoutAmount = Number(financials.host_payout) || null;
    updateData.payoutCurrency = financials.currency || "BRL";
    updateData.hostPayment = `${updateData.payoutCurrency} ${financials.host_payout}`;
  } else if (financials.host?.payout) {
    const payout = financials.host.payout;
    if (payout.amount != null) updateData.payoutAmount = Number(payout.amount);
    if (payout.currency) updateData.payoutCurrency = payout.currency;
    if (payout.formatted) updateData.hostPayment = payout.formatted;
  }

  // Guest info — only update if reservation is still pending
  if (reservation.status === "pending_form") {
    const guest = data.guest || {};
    const guestName = guest.full_name || guest.name || [guest.first_name, guest.last_name].filter(Boolean).join(" ");
    if (guestName) updateData.guestFullName = guestName;
    if (guest.phone) updateData.guestPhone = guest.phone;
    if (guest.picture_url || guest.picture) updateData.guestPhotoUrl = guest.picture_url || guest.picture;
    // Guest email (NEW)
    if (guest.email && !reservation.guestEmail) updateData.guestEmail = guest.email;
  }

  await prisma.reservation.update({ where: { id: reservation.id }, data: updateData });
  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed", reservationId: reservation.id },
  });
  return NextResponse.json({ ok: true, action: "updated", reservationId: reservation.id, logId });
}

// ─── Message created (NEW — structured storage) ───

async function handleMessageCreated(data: any, logId: string): Promise<NextResponse> {
  try {
    const hospReservationId = data.reservation_id || data.reservation?.id || null;
    const conversationId = data.conversation_id || data.conversation?.id || null;
    const platform = data.platform || data.channel?.platform || "airbnb";

    // Extract message content
    const messageBody = data.body || data.message || data.text || data.content || "";
    const sender = data.sender || data.from || data.direction || "guest"; // guest, host, system
    const senderName = data.sender_name || data.from_name || null;
    const sentAt = data.sent_at || data.created_at || data.timestamp || new Date().toISOString();

    // Try to match to an AirCheck reservation
    let reservationId: string | null = null;
    if (hospReservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { hospitableReservationId: hospReservationId },
        select: { id: true },
      });
      reservationId = reservation?.id || null;
    }

    // If no match by hospReservationId, try by conversationId (airbnbThreadId)
    if (!reservationId && conversationId) {
      const reservation = await prisma.reservation.findFirst({
        where: { airbnbThreadId: conversationId },
        select: { id: true },
      });
      reservationId = reservation?.id || null;
    }

    // Store structured message
    if (messageBody) {
      await prisma.hospitableMessage.create({
        data: {
          reservationId,
          hospitableReservationId: hospReservationId,
          sender: typeof sender === "string" ? sender.toLowerCase() : "guest",
          senderName,
          body: messageBody,
          sentAt: new Date(sentAt),
          platform,
        },
      });
    }

    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: `message.created — stored${reservationId ? ` (linked to ${reservationId})` : " (unlinked)"}` },
    });
    return NextResponse.json({ ok: true, action: "message.stored", reservationId, logId });
  } catch (err: any) {
    console.error("[webhook/hospitable] message.created error:", err);
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: `message.created — error: ${err.message}` },
    });
    // Still return 200 — don't lose the raw payload in WebhookLog
    return NextResponse.json({ ok: true, action: "message.error", logId });
  }
}
