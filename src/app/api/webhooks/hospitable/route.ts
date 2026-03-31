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

    return NextResponse.json({ error: "Processing error", logId }, { status: 200 });
  }
}

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════

function extractCustomerId(data: any): string | null {
  const raw =
    data.channel?.customer?.id ||
    data.listing?.channel?.customer?.id ||
    data.customer?.id ||
    data.customer_id ||
    null;
  return raw ? String(raw).replace(/[^a-zA-Z0-9_-]/g, "") : null;
}

async function findUserByCustomerId(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;

  const direct = await prisma.hospitableConnection.findFirst({
    where: { hospitableAccountId: customerId, status: "active" },
    select: { userId: true },
  });
  if (direct) return direct.userId;

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

async function findFallbackUserId(): Promise<string | null> {
  const conn = await prisma.hospitableConnection.findFirst({
    where: { status: "active" },
    select: { userId: true },
  });
  return conn?.userId || null;
}

/** Extract listing details for Property update/create */
function extractListingData(listing: any): Record<string, any> {
  if (!listing) return {};

  const addr = listing.address || {};
  const details = listing.details || {};
  const capacity = listing.capacity || {};
  const rules = listing.house_rules;

  return {
    // Address
    addressStreet: addr.street || null,
    addressApt: addr.apt || null,
    addressCity: addr.city || null,
    addressState: addr.state || null,
    addressZipcode: addr.zipcode || null,
    addressLatitude: addr.latitude || null,
    addressLongitude: addr.longitude || null,
    // WiFi
    wifiName: details.wifi_name || null,
    wifiPassword: details.wifi_password || null,
    // Capacity
    maxCapacity: capacity.max || null,
    bedrooms: capacity.bedrooms ?? listing.bedrooms ?? null,
    bathrooms: capacity.bathrooms ?? listing.bathrooms ?? null,
    // Amenities & rules
    amenities: listing.amenities ? JSON.stringify(listing.amenities) : null,
    houseRules: rules ? JSON.stringify(rules) : null,
    // Description
    description: listing.summary || listing.description || null,
    roomType: listing.room_type || null,
    propertyType: listing.property_type || null,
    // Photo & IDs
    photoUrl: listing.picture || null,
    airbnbRoomId: listing.platform_id || null,
    hospitableListingId: listing.id || null,
  };
}

/** Merge listing data into property — only fill nulls, don't overwrite existing */
function mergeListingData(existing: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value != null) {
      // Always update these (they may change)
      if (["name", "photoUrl", "airbnbRoomId", "hospitableListingId"].includes(key)) {
        result[key] = value;
      }
      // Only fill if currently empty
      else if (existing[key] == null) {
        result[key] = value;
      }
    }
  }
  return result;
}

/** Extract structured financials from webhook/API payload */
function extractFinancials(data: any): {
  hostPayment: string | null;
  payoutAmount: number | null;
  payoutCurrency: string | null;
  financialDetails: string | null;
} {
  const financials = data.financials || {};

  let hostPayment: string | null = null;
  let payoutAmount: number | null = null;
  let payoutCurrency: string | null = null;
  let financialDetails: string | null = null;

  // Full financials object → store as JSON
  if (financials.host || financials.guest) {
    financialDetails = JSON.stringify(financials);
  }

  // Connect webhook format: financials.host_payout + currency
  if (financials.host_payout != null) {
    payoutAmount = Number(financials.host_payout) || null;
    payoutCurrency = financials.currency || "BRL";
    hostPayment = `${payoutCurrency} ${financials.host_payout}`;
  }
  // Full API format: financials.host.payout
  else if (financials.host?.payout) {
    const payout = financials.host.payout;
    payoutAmount = payout.amount != null ? Number(payout.amount) : null;
    payoutCurrency = payout.currency || "BRL";
    hostPayment = payout.formatted || (payoutAmount ? `${payoutCurrency} ${payoutAmount}` : null);
  }

  return { hostPayment, payoutAmount, payoutCurrency, financialDetails };
}

// ════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════

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

  // Extract all listing data
  const listingData = extractListingData(data);

  // Find user
  let userId = await findUserByCustomerId(customerId);
  if (!userId) userId = await findFallbackUserId();

  if (!userId) {
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "error", error: "No active connection found" },
    });
    return NextResponse.json({ ok: false, error: "No connection", logId });
  }

  // Find existing property
  let property = listingId
    ? await prisma.property.findFirst({ where: { hospitableListingId: listingId } })
    : null;

  if (!property && listingData.airbnbRoomId) {
    property = await prisma.property.findFirst({ where: { userId, airbnbRoomId: listingData.airbnbRoomId } });
  }

  if (!property) {
    property = await prisma.property.findFirst({ where: { userId, name: listingName } });
  }

  if (property) {
    const updates = mergeListingData(property, listingData);
    updates.name = listingName; // Always sync name
    await prisma.property.update({ where: { id: property.id }, data: updates });
  } else {
    await prisma.property.create({
      data: {
        userId,
        name: listingName,
        ...listingData,
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
  const listing = data.listing || {};
  const listingId = data.listing_id || listing.id;

  // ── Guest info ──
  const guest = data.guest || {};
  const guestName = guest.full_name || guest.name ||
    [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
  const guestPhone = guest.phone || guest.phone_numbers?.[0] || null;
  const guestPhotoUrl = guest.picture_url || guest.picture || guest.photo || null;
  const guestEmail = guest.email || null;
  const guestLocale = guest.locale || null;

  // ── Guest breakdown ──
  const guests = data.guests || {};
  const numGuests = guests.total || data.number_of_guests || 1;
  const guestAdults = guests.adult_count ?? null;
  const guestChildren = guests.child_count ?? null;
  const guestInfants = guests.infant_count ?? null;
  const guestPets = guests.pet_count ?? null;

  // ── Platform & timezone ──
  const platform = data.platform || listing.platform || listing.channel?.platform || "airbnb";
  const timezone = data.timezone || null;

  // ── Dates ──
  const arrivalRaw = data.check_in || data.arrival_date || data.check_in_date;
  const departureRaw = data.check_out || data.departure_date || data.check_out_date;
  const checkInDate = formatDateBR(arrivalRaw?.split("T")[0]);
  const checkOutDate = formatDateBR(departureRaw?.split("T")[0]);
  const checkInTime = data.check_in_time || data.checkin_time ||
    (data.check_in_local?.match(/T(\d{2}:\d{2})/)?.[1]) || listing.check_in || "15:00";
  const checkOutTime = data.check_out_time || data.checkout_time ||
    (data.check_out_local?.match(/T(\d{2}:\d{2})/)?.[1]) || listing.check_out || "12:00";
  const nights = data.nights || calculateNights(arrivalRaw?.split("T")[0], departureRaw?.split("T")[0]);
  const confirmationCode = data.platform_id || data.code || data.confirmation_code || null;
  const conversationId = data.conversation_id || data.conversation?.id || null;
  const bookedAt = data.booking_date || null;

  // ── Financials ──
  const { hostPayment, payoutAmount, payoutCurrency, financialDetails } = extractFinancials(data);

  // ── Find property ──
  let userId: string | null = null;
  let property: any = null;

  if (listingId) {
    property = await prisma.property.findFirst({
      where: { hospitableListingId: listingId },
    });
  }

  const airbnbRoomId = listing.platform_id || null;
  if (!property && airbnbRoomId) {
    property = await prisma.property.findFirst({
      where: { airbnbRoomId },
    });
  }

  if (!property) {
    userId = await findUserByCustomerId(customerId);
    if (!userId) userId = await findFallbackUserId();

    if (!userId) {
      await prisma.webhookLog.update({
        where: { id: logId },
        data: { status: "error", error: "No active connection found" },
      });
      return NextResponse.json({ ok: false, error: "No connection", logId });
    }

    const propertyName = listing.public_name || data.property?.name || listing.name || "Imóvel Hospitable";
    property = await prisma.property.findFirst({
      where: { userId, name: propertyName },
    });

    if (!property) {
      const listingData = extractListingData(listing);
      property = await prisma.property.create({
        data: { userId, name: propertyName, ...listingData },
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

  // ── Update property with listing details from reservation payload ──
  if (listing.id) {
    const listingData = extractListingData(listing);
    const updates = mergeListingData(property, listingData);
    if (Object.keys(updates).length > 0) {
      await prisma.property.update({ where: { id: property.id }, data: updates });
    }
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
      await prisma.reservation.update({
        where: { id: existing.id },
        data: {
          hospitableReservationId: hospReservationId,
          platform: existing.platform || platform,
          guestEmail: existing.guestEmail || guestEmail,
          guestLocale: existing.guestLocale || guestLocale,
          bookedAt: existing.bookedAt || bookedAt,
          timezone: existing.timezone || timezone,
          payoutAmount: existing.payoutAmount ?? payoutAmount,
          payoutCurrency: existing.payoutCurrency || payoutCurrency,
          financialDetails: existing.financialDetails || financialDetails,
          guestAdults: existing.guestAdults ?? guestAdults,
          guestChildren: existing.guestChildren ?? guestChildren,
          guestInfants: existing.guestInfants ?? guestInfants,
          guestPets: existing.guestPets ?? guestPets,
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
      guestLocale,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      numGuests: typeof numGuests === "number" ? numGuests : 1,
      guestAdults,
      guestChildren,
      guestInfants,
      guestPets,
      nights,
      confirmationCode,
      bookedAt,
      hostPayment,
      payoutAmount,
      payoutCurrency,
      financialDetails,
      platform,
      timezone,
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

  // ── Update property listing details if they come in the reservation payload ──
  const listing = data.listing || {};
  if (listing.id) {
    const property = await prisma.property.findUnique({ where: { id: reservation.propertyId } });
    if (property) {
      const listingData = extractListingData(listing);
      const updates = mergeListingData(property, listingData);
      if (Object.keys(updates).length > 0) {
        await prisma.property.update({ where: { id: property.id }, data: updates });
      }
    }
  }

  // ── Map status ──
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
  if (aircheckStatus !== reservation.status) updateData.status = aircheckStatus;

  // Guest breakdown
  const guests = data.guests || {};
  if (guests.total) updateData.numGuests = guests.total;
  if (guests.adult_count != null) updateData.guestAdults = guests.adult_count;
  if (guests.child_count != null) updateData.guestChildren = guests.child_count;
  if (guests.infant_count != null) updateData.guestInfants = guests.infant_count;
  if (guests.pet_count != null) updateData.guestPets = guests.pet_count;

  // Backfill new fields
  const platform = data.platform || listing.platform;
  if (platform && !reservation.platform) updateData.platform = platform;
  if (data.timezone && !reservation.timezone) updateData.timezone = data.timezone;
  if (data.booking_date && !reservation.bookedAt) updateData.bookedAt = data.booking_date;

  // Financials
  const { hostPayment, payoutAmount, payoutCurrency, financialDetails } = extractFinancials(data);
  if (payoutAmount != null) {
    updateData.payoutAmount = payoutAmount;
    updateData.payoutCurrency = payoutCurrency;
    updateData.hostPayment = hostPayment;
  }
  if (financialDetails && !reservation.financialDetails) {
    updateData.financialDetails = financialDetails;
  }

  // Guest info — only update if reservation is still pending
  if (reservation.status === "pending_form") {
    const guest = data.guest || {};
    const guestName = guest.full_name || guest.name || [guest.first_name, guest.last_name].filter(Boolean).join(" ");
    if (guestName) updateData.guestFullName = guestName;
    if (guest.phone || guest.phone_numbers?.[0]) updateData.guestPhone = guest.phone || guest.phone_numbers[0];
    if (guest.email && !reservation.guestEmail) updateData.guestEmail = guest.email;
    if (guest.locale && !reservation.guestLocale) updateData.guestLocale = guest.locale;
  }

  await prisma.reservation.update({ where: { id: reservation.id }, data: updateData });
  await prisma.webhookLog.update({
    where: { id: logId },
    data: { status: "processed", reservationId: reservation.id },
  });
  return NextResponse.json({ ok: true, action: "updated", reservationId: reservation.id, logId });
}

// ─── Message created (structured storage) ───

async function handleMessageCreated(data: any, logId: string): Promise<NextResponse> {
  try {
    const hospReservationId = data.reservation_id || data.reservation?.id || null;
    const conversationId = data.conversation_id || data.conversation?.id || null;
    const platform = data.platform || data.channel?.platform || "airbnb";

    const messageBody = data.body || data.message || data.text || data.content || "";
    const sender = data.sender || data.from || data.direction || "guest";
    const senderName = data.sender_name || data.from_name || null;
    const sentAt = data.sent_at || data.created_at || data.timestamp || new Date().toISOString();

    // Match to AirCheck reservation
    let reservationId: string | null = null;
    if (hospReservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { hospitableReservationId: hospReservationId },
        select: { id: true },
      });
      reservationId = reservation?.id || null;
    }

    if (!reservationId && conversationId) {
      const reservation = await prisma.reservation.findFirst({
        where: { airbnbThreadId: conversationId },
        select: { id: true },
      });
      reservationId = reservation?.id || null;
    }

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
      data: { status: "processed", error: `message.created — stored${reservationId ? ` (linked)` : " (unlinked)"}` },
    });
    return NextResponse.json({ ok: true, action: "message.stored", reservationId, logId });
  } catch (err: any) {
    console.error("[webhook/hospitable] message.created error:", err);
    await prisma.webhookLog.update({
      where: { id: logId },
      data: { status: "processed", error: `message.created — error: ${err.message}` },
    });
    return NextResponse.json({ ok: true, action: "message.error", logId });
  }
}
