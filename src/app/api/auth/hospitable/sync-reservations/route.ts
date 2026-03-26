// src/app/api/auth/hospitable/sync-reservations/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getReservations } from "@/lib/hospitable";
import { prisma } from "@/lib/prisma";
import { formatDateBR, calculateNights } from "@/lib/hospitable";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Verify active connection
  const connection = await prisma.hospitableConnection.findUnique({ where: { userId } });
  if (!connection || connection.status !== "active") {
    return NextResponse.json({ error: "Hospitable não conectado" }, { status: 400 });
  }

  try {
    // Fetch reservations from Connect API
    const customerId = connection.hospitableAccountId;
    let allReservations: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params: Record<string, string> = { page: String(page), per_page: "50" };
      if (customerId) params.customer_id = customerId;

      const res = await getReservations(params);
      console.log(`[sync-reservations] Page ${page}:`, JSON.stringify(res).slice(0, 500));

      const items = res?.data || res || [];
      if (Array.isArray(items) && items.length > 0) {
        allReservations.push(...items);
        page++;
        // Stop at 10 pages or if fewer results than requested
        if (items.length < 50 || page > 10) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const r of allReservations) {
      try {
        const hospReservationId = r.id;

        // Skip if already imported
        if (hospReservationId) {
          const existing = await prisma.reservation.findUnique({
            where: { hospitableReservationId: hospReservationId },
          });
          if (existing) { skipped++; continue; }
        }

        // Extract fields — adapt to whatever format Connect sends
        const guest = r.guest || {};
        const guestName = guest.full_name || guest.name ||
          [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
        const guestPhone = guest.phone || null;
        const guestPhotoUrl = guest.picture_url || guest.picture || guest.photo || null;

        // Dates
        const arrivalRaw = r.check_in || r.arrival_date || r.check_in_date || "";
        const departureRaw = r.check_out || r.departure_date || r.check_out_date || "";
        const checkInDate = formatDateBR(arrivalRaw.split("T")[0]);
        const checkOutDate = formatDateBR(departureRaw.split("T")[0]);
        const checkInTime = r.check_in_time || r.checkin_time || "15:00";
        const checkOutTime = r.check_out_time || r.checkout_time || "12:00";
        const numGuests = r.guests || r.number_of_guests || r.guests_count || 1;
        const nights = r.nights || calculateNights(arrivalRaw.split("T")[0], departureRaw.split("T")[0]);
        const confirmationCode = r.confirmation_code || r.platform_id || r.code || null;
        const conversationId = r.conversation_id || null;
        const status = (r.status || "").toLowerCase();

        // Skip cancelled/denied
        if (status === "cancelled" || status === "denied" || status === "not_accepted") {
          skipped++;
          continue;
        }

        // Check duplicate by confirmation code
        if (confirmationCode) {
          const existing = await prisma.reservation.findFirst({
            where: { userId, confirmationCode },
          });
          if (existing) {
            // Link but don't change source
            await prisma.reservation.update({
              where: { id: existing.id },
              data: { hospitableReservationId: hospReservationId },
            });
            skipped++;
            continue;
          }
        }

        // Find property
        const listingId = r.listing_id || r.listing?.id;
        let property = null;
        if (listingId) {
          property = await prisma.property.findFirst({
            where: { userId, hospitableListingId: listingId },
          });
        }
        if (!property) {
          // Use first property as fallback
          property = await prisma.property.findFirst({
            where: { userId },
            orderBy: { createdAt: "asc" },
          });
        }
        if (!property) {
          errors++;
          continue;
        }

        // Determine AirCheck status
        let aircheckStatus = "pending_form";
        // If checkout is in the past, archive it
        const checkOutIso = departureRaw.split("T")[0];
        if (checkOutIso) {
          const co = new Date(checkOutIso);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          if (co < now) aircheckStatus = "archived";
        }

        await prisma.reservation.create({
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
            status: aircheckStatus,
          },
        });
        imported++;
      } catch (err: any) {
        console.error("[sync-reservations] Error importing:", err.message);
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: allReservations.length,
      imported,
      skipped,
      errors,
    });
  } catch (e: any) {
    console.error("[sync-reservations] Error:", e);
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 500 });
  }
}
