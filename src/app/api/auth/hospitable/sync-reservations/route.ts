// src/app/api/auth/hospitable/sync-reservations/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateBR, calculateNights } from "@/lib/hospitable";

const CONNECT_API = "https://connect.hospitable.com/api/v1";
const CONNECT_TOKEN = process.env.HOSPITABLE_CONNECT_TOKEN || "";
const CONNECT_VERSION = "2024-01-01";

async function connectGet(path: string) {
  const res = await fetch(`${CONNECT_API}${path}`, {
    headers: {
      Authorization: `Bearer ${CONNECT_TOKEN}`,
      "Connect-Version": CONNECT_VERSION,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Connect GET ${path}: ${res.status} ${err}`);
  }
  return res.json();
}

/** Extract structured financials from API response */
function extractFinancials(r: any): {
  hostPayment: string | null;
  payoutAmount: number | null;
  payoutCurrency: string | null;
  financialDetails: string | null;
} {
  const financials = r.financials || {};
  let hostPayment: string | null = null;
  let payoutAmount: number | null = null;
  let payoutCurrency: string | null = null;
  let financialDetails: string | null = null;

  if (financials.host || financials.guest) {
    financialDetails = JSON.stringify(financials);
  }

  if (financials.host_payout != null) {
    payoutAmount = Number(financials.host_payout) || null;
    payoutCurrency = financials.currency || "BRL";
    hostPayment = `${payoutCurrency} ${financials.host_payout}`;
  } else if (financials.host?.payout) {
    const payout = financials.host.payout;
    payoutAmount = payout.amount != null ? Number(payout.amount) : null;
    payoutCurrency = payout.currency || "BRL";
    hostPayment = payout.formatted || (payoutAmount ? `${payoutCurrency} ${payoutAmount}` : null);
  }

  return { hostPayment, payoutAmount, payoutCurrency, financialDetails };
}

/** Extract all new fields from a reservation object */
function extractReservationExtras(r: any) {
  const guest = r.guest || {};
  const guests = r.guests || {};

  return {
    guestLocale: guest.locale || null,
    guestAdults: guests.adult_count ?? null,
    guestChildren: guests.child_count ?? null,
    guestInfants: guests.infant_count ?? null,
    guestPets: guests.pet_count ?? null,
    guestEmail: guest.email || null,
    platform: r.platform || "airbnb",
    timezone: r.timezone || null,
    bookedAt: r.booking_date || null,
  };
}

/** Update property with listing details if present in reservation payload */
async function backfillPropertyFromListing(propertyId: string, listing: any) {
  if (!listing?.id) return;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return;

  const addr = listing.address || {};
  const details = listing.details || {};
  const capacity = listing.capacity || {};

  const updates: Record<string, any> = {};

  // Only fill nulls
  if (!property.addressStreet && addr.street) updates.addressStreet = addr.street;
  if (!property.addressApt && addr.apt) updates.addressApt = addr.apt;
  if (!property.addressCity && addr.city) updates.addressCity = addr.city;
  if (!property.addressState && addr.state) updates.addressState = addr.state;
  if (!property.addressZipcode && addr.zipcode) updates.addressZipcode = addr.zipcode;
  if (!property.addressLatitude && addr.latitude) updates.addressLatitude = addr.latitude;
  if (!property.addressLongitude && addr.longitude) updates.addressLongitude = addr.longitude;
  if (!property.wifiName && details.wifi_name) updates.wifiName = details.wifi_name;
  if (!property.wifiPassword && details.wifi_password) updates.wifiPassword = details.wifi_password;
  if (!property.maxCapacity && capacity.max) updates.maxCapacity = capacity.max;
  if (!property.bedrooms && (capacity.bedrooms ?? listing.bedrooms)) updates.bedrooms = capacity.bedrooms ?? listing.bedrooms;
  if (!property.bathrooms && (capacity.bathrooms ?? listing.bathrooms)) updates.bathrooms = capacity.bathrooms ?? listing.bathrooms;
  if (!property.amenities && listing.amenities) updates.amenities = JSON.stringify(listing.amenities);
  if (!property.houseRules && listing.house_rules) updates.houseRules = JSON.stringify(listing.house_rules);
  if (!property.description && (listing.summary || listing.description)) updates.description = listing.summary || listing.description;
  if (!property.roomType && listing.room_type) updates.roomType = listing.room_type;
  if (!property.propertyType && listing.property_type) updates.propertyType = listing.property_type;

  if (Object.keys(updates).length > 0) {
    await prisma.property.update({ where: { id: propertyId }, data: updates });
  }
}

/** Import a single reservation — shared between first page and pagination */
async function importReservation(
  r: any,
  userId: string,
  propertyId: string,
): Promise<"imported" | "skipped" | "error"> {
  try {
    const hospReservationId = r.id;
    const confirmationCode = r.platform_id || null;

    // Skip if already imported
    if (hospReservationId) {
      const existing = await prisma.reservation.findUnique({
        where: { hospitableReservationId: hospReservationId },
      });
      if (existing) return "skipped";
    }

    // Skip cancelled
    const status = (r.status || "").toLowerCase();
    if (status === "cancelled" || status === "denied" || status === "not_accepted") {
      return "skipped";
    }

    // Dedup by confirmation code — DON'T change source, backfill new fields
    if (confirmationCode) {
      const existing = await prisma.reservation.findFirst({
        where: { userId, confirmationCode },
      });
      if (existing) {
        const extras = extractReservationExtras(r);
        const fin = extractFinancials(r);
        await prisma.reservation.update({
          where: { id: existing.id },
          data: {
            hospitableReservationId: hospReservationId,
            platform: existing.platform || extras.platform,
            guestEmail: existing.guestEmail || extras.guestEmail,
            guestLocale: existing.guestLocale || extras.guestLocale,
            bookedAt: existing.bookedAt || extras.bookedAt,
            timezone: existing.timezone || extras.timezone,
            guestAdults: existing.guestAdults ?? extras.guestAdults,
            guestChildren: existing.guestChildren ?? extras.guestChildren,
            guestInfants: existing.guestInfants ?? extras.guestInfants,
            guestPets: existing.guestPets ?? extras.guestPets,
            payoutAmount: existing.payoutAmount ?? fin.payoutAmount,
            payoutCurrency: existing.payoutCurrency || fin.payoutCurrency,
            financialDetails: existing.financialDetails || fin.financialDetails,
          },
        });
        return "skipped";
      }
    }

    // Guest info
    const guest = r.guest || {};
    const guestName = [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
    const guestPhone = guest.phone_numbers?.[0] || guest.phone || null;

    // Dates
    const checkInDate = formatDateBR(r.arrival_date);
    const checkOutDate = formatDateBR(r.departure_date);
    let checkInTime = "15:00";
    let checkOutTime = "12:00";
    if (r.check_in_local) {
      const m = r.check_in_local.match(/T(\d{2}:\d{2})/);
      if (m) checkInTime = m[1];
    }
    if (r.check_out_local) {
      const m = r.check_out_local.match(/T(\d{2}:\d{2})/);
      if (m) checkOutTime = m[1];
    }

    // Status — archive past reservations
    let aircheckStatus = "pending_form";
    if (r.departure_date) {
      const co = new Date(r.departure_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (co < now) aircheckStatus = "archived";
    }

    // All extras
    const extras = extractReservationExtras(r);
    const { hostPayment, payoutAmount, payoutCurrency, financialDetails } = extractFinancials(r);

    await prisma.reservation.create({
      data: {
        userId,
        propertyId,
        guestFullName: guestName,
        guestPhone,
        guestEmail: extras.guestEmail,
        guestLocale: extras.guestLocale,
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        numGuests: r.guests?.total || 1,
        guestAdults: extras.guestAdults,
        guestChildren: extras.guestChildren,
        guestInfants: extras.guestInfants,
        guestPets: extras.guestPets,
        nights: calculateNights(r.arrival_date, r.departure_date),
        confirmationCode,
        bookedAt: extras.bookedAt,
        hostPayment,
        payoutAmount,
        payoutCurrency,
        financialDetails,
        platform: extras.platform,
        timezone: extras.timezone,
        source: "hospitable",
        hospitableReservationId: hospReservationId,
        status: aircheckStatus,
      },
    });

    // Backfill property listing details if present
    if (r.listing) {
      await backfillPropertyFromListing(propertyId, r.listing);
    }

    return "imported";
  } catch (err: any) {
    console.error("[sync-reservations] Error importing reservation:", err.message);
    return "error";
  }
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const connection = await prisma.hospitableConnection.findUnique({ where: { userId } });
  if (!connection || connection.status !== "active") {
    return NextResponse.json({ error: "Hospitable não conectado" }, { status: 400 });
  }

  try {
    const properties = await prisma.property.findMany({
      where: { userId, hospitableListingId: { not: null } },
      select: { id: true, hospitableListingId: true, name: true },
    });

    if (properties.length === 0) {
      return NextResponse.json({ ok: true, total: 0, imported: 0, skipped: 0, errors: 0 });
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalFetched = 0;

    for (const prop of properties) {
      try {
        const res = await connectGet(`/listings/${prop.hospitableListingId}/reservations`);
        const reservations = res?.data || [];
        totalFetched += reservations.length;

        for (const r of reservations) {
          const result = await importReservation(r, userId, prop.id);
          if (result === "imported") totalImported++;
          else if (result === "skipped") totalSkipped++;
          else totalErrors++;
        }

        // Pagination
        let nextUrl = res?.links?.next || res?.meta?.next_page_url;
        while (nextUrl) {
          try {
            const pageRes = await fetch(nextUrl, {
              headers: {
                Authorization: `Bearer ${CONNECT_TOKEN}`,
                "Connect-Version": CONNECT_VERSION,
                Accept: "application/json",
              },
            });
            if (!pageRes.ok) break;
            const pageData = await pageRes.json();
            const pageItems = pageData?.data || [];
            if (pageItems.length === 0) break;
            totalFetched += pageItems.length;

            for (const r of pageItems) {
              const result = await importReservation(r, userId, prop.id);
              if (result === "imported") totalImported++;
              else if (result === "skipped") totalSkipped++;
              else totalErrors++;
            }

            nextUrl = pageData?.links?.next || null;
          } catch { break; }
        }
      } catch (err: any) {
        console.error(`[sync-reservations] Error fetching listing ${prop.hospitableListingId}:`, err.message);
        totalErrors++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: totalFetched,
      imported: totalImported,
      skipped: totalSkipped,
      errors: totalErrors,
    });
  } catch (e: any) {
    console.error("[sync-reservations] Error:", e);
    return NextResponse.json({ error: e.message || "Sync failed" }, { status: 500 });
  }
}
