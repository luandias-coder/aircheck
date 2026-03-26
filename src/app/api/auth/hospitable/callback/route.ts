// src/app/api/auth/hospitable/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getListings } from "@/lib/hospitable";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br";

export async function GET(req: NextRequest) {
  // The user_id param helps us identify who's returning
  const userIdParam = req.nextUrl.searchParams.get("user_id");
  const currentUserId = await getCurrentUserId();
  const userId = currentUserId || userIdParam;

  if (!userId) {
    return NextResponse.redirect(new URL("/login?redirect=/dashboard", BASE_URL));
  }

  try {
    // Mark connection as active
    const connection = await prisma.hospitableConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return NextResponse.redirect(
        new URL("/dashboard?hospitable=error&reason=no_connection_found", BASE_URL)
      );
    }

    await prisma.hospitableConnection.update({
      where: { userId },
      data: { status: "active" },
    });

    // Try to sync listings
    // Note: listings might not be available yet (webhooks arrive async)
    // The webhook handler will also create properties when they arrive
    let syncedCount = 0;
    try {
      const customerId = connection.hospitableAccountId;
      if (customerId) {
        const listingsRes = await getListings(customerId);
        const listings = listingsRes?.data || listingsRes || [];

        if (Array.isArray(listings)) {
          for (const listing of listings) {
            const listingId = listing.id;
            const listingName = listing.name || listing.nickname || listing.platform_name || "Imóvel Hospitable";
            const platformId = listing.platform_listing_id || listing.platform_id || null;

            // Try to match existing property
            let existingProp = null;
            if (platformId) {
              existingProp = await prisma.property.findFirst({
                where: { userId, airbnbRoomId: platformId },
              });
            }
            if (!existingProp) {
              existingProp = await prisma.property.findFirst({
                where: { userId, name: listingName },
              });
            }

            if (existingProp) {
              await prisma.property.update({
                where: { id: existingProp.id },
                data: {
                  hospitableListingId: listingId,
                  airbnbRoomId: platformId || existingProp.airbnbRoomId,
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
            syncedCount++;
          }
        }
      }
    } catch (syncErr: any) {
      // Sync might fail if listings aren't ready yet — that's OK
      // Webhooks will handle it
      console.error("[hospitable/callback] Listing sync:", syncErr.message);
    }

    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=connected&synced=${syncedCount}`, BASE_URL)
    );
  } catch (e: any) {
    console.error("[hospitable/callback] Error:", e);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(e.message || "callback_failed")}`, BASE_URL)
    );
  }
}
