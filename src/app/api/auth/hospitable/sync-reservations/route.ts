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

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const connection = await prisma.hospitableConnection.findUnique({ where: { userId } });
  if (!connection || connection.status !== "active") {
    return NextResponse.json({ error: "Hospitable não conectado" }, { status: 400 });
  }

  try {
    // Get all properties with hospitableListingId
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
        // Fetch reservations per listing — Connect API path: /listings/{id}/reservations
        const res = await connectGet(`/listings/${prop.hospitableListingId}/reservations`);
        const reservations = res?.data || [];
        totalFetched += reservations.length;

        for (const r of reservations) {
          try {
            const hospReservationId = r.id;

            // Skip if already imported by hospitable ID
            if (hospReservationId) {
              const existing = await prisma.reservation.findUnique({
                where: { hospitableReservationId: hospReservationId },
              });
              if (existing) { totalSkipped++; continue; }
            }

            // Confirmation code = platform_id (e.g. "HMWXAYAADY")
            const confirmationCode = r.platform_id || null;

            // Skip cancelled
            const status = (r.status || "").toLowerCase();
            if (status === "cancelled" || status === "denied" || status === "not_accepted") {
              totalSkipped++;
              continue;
            }

            // Check duplicate by confirmation code
            if (confirmationCode) {
              const existing = await prisma.reservation.findFirst({
                where: { userId, confirmationCode },
              });
              if (existing) {
                // Link but DON'T change source
                await prisma.reservation.update({
                  where: { id: existing.id },
                  data: { hospitableReservationId: hospReservationId },
                });
                totalSkipped++;
                continue;
              }
            }

            // Guest info
            const guest = r.guest || {};
            const guestName = [guest.first_name, guest.last_name].filter(Boolean).join(" ") || "Hóspede";
            const guestPhone = guest.phone_numbers?.[0] || null;

            // Dates — arrival_date/departure_date are "YYYY-MM-DD"
            const checkInDate = formatDateBR(r.arrival_date);
            const checkOutDate = formatDateBR(r.departure_date);

            // Times — extract from check_in_local ("2025-06-13T15:00:00-03:00") or listing
            let checkInTime = "15:00";
            let checkOutTime = "12:00";
            if (r.check_in_local) {
              const match = r.check_in_local.match(/T(\d{2}:\d{2})/);
              if (match) checkInTime = match[1];
            }
            if (r.check_out_local) {
              const match = r.check_out_local.match(/T(\d{2}:\d{2})/);
              if (match) checkOutTime = match[1];
            }

            // Guests count
            const numGuests = r.guests?.total || 1;
            const nights = calculateNights(r.arrival_date, r.departure_date);

            // Host payout
            const hostPayment = r.financials?.host?.payout?.formatted || null;

            // Determine AirCheck status — archive past reservations
            let aircheckStatus = "pending_form";
            if (r.departure_date) {
              const co = new Date(r.departure_date);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              if (co < now) aircheckStatus = "archived";
            }

            await prisma.reservation.create({
              data: {
                userId,
                propertyId: prop.id,
                guestFullName: guestName,
                guestPhone,
                checkInDate,
                checkInTime,
                checkOutDate,
                checkOutTime,
                numGuests,
                nights,
                confirmationCode,
                hostPayment,
                source: "hospitable",
                hospitableReservationId: hospReservationId,
                status: aircheckStatus,
              },
            });
            totalImported++;
          } catch (err: any) {
            console.error("[sync-reservations] Error importing reservation:", err.message);
            totalErrors++;
          }
        }

        // Check for pagination
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
            totalFetched += pageItems.length;

            for (const r of pageItems) {
              // Same logic as above (simplified — skip duplicates)
              const hospId = r.id;
              const code = r.platform_id;
              if (hospId) {
                const ex = await prisma.reservation.findUnique({ where: { hospitableReservationId: hospId } });
                if (ex) { totalSkipped++; continue; }
              }
              if (code) {
                const ex = await prisma.reservation.findFirst({ where: { userId, confirmationCode: code } });
                if (ex) {
                  await prisma.reservation.update({ where: { id: ex.id }, data: { hospitableReservationId: hospId } });
                  totalSkipped++;
                  continue;
                }
              }
              const st = (r.status || "").toLowerCase();
              if (st === "cancelled" || st === "denied") { totalSkipped++; continue; }

              const g = r.guest || {};
              const checkInDate = formatDateBR(r.arrival_date);
              const checkOutDate = formatDateBR(r.departure_date);
              let cit = "15:00", cot = "12:00";
              if (r.check_in_local) { const m = r.check_in_local.match(/T(\d{2}:\d{2})/); if (m) cit = m[1]; }
              if (r.check_out_local) { const m = r.check_out_local.match(/T(\d{2}:\d{2})/); if (m) cot = m[1]; }

              let aircheckStatus = "pending_form";
              if (r.departure_date && new Date(r.departure_date) < new Date(new Date().toDateString())) aircheckStatus = "archived";

              try {
                await prisma.reservation.create({
                  data: {
                    userId, propertyId: prop.id,
                    guestFullName: [g.first_name, g.last_name].filter(Boolean).join(" ") || "Hóspede",
                    guestPhone: g.phone_numbers?.[0] || null,
                    checkInDate, checkInTime: cit, checkOutDate, checkOutTime: cot,
                    numGuests: r.guests?.total || 1,
                    nights: calculateNights(r.arrival_date, r.departure_date),
                    confirmationCode: r.platform_id, hostPayment: r.financials?.host?.payout?.formatted || null,
                    source: "hospitable", hospitableReservationId: hospId, status: aircheckStatus,
                  },
                });
                totalImported++;
              } catch { totalErrors++; }
            }

            nextUrl = pageData?.links?.next || null;
            if (pageItems.length === 0) nextUrl = null;
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
