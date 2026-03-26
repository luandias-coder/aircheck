// src/app/api/auth/hospitable/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { exchangeCodeForTokens, getProperties } from "@/lib/hospitable";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("[hospitable/callback] OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(error)}`, BASE_URL)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?hospitable=error&reason=missing_params", BASE_URL)
    );
  }

  // ── Validate state ──
  let stateData: { userId: string; nonce: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?hospitable=error&reason=invalid_state", BASE_URL)
    );
  }

  // Verify user is still logged in and matches state
  const currentUserId = await getCurrentUserId();
  if (!currentUserId || currentUserId !== stateData.userId) {
    return NextResponse.redirect(
      new URL("/login?redirect=/dashboard&hospitable=session_expired", BASE_URL)
    );
  }

  try {
    // ── Exchange code for tokens ──
    const tokens = await exchangeCodeForTokens(code);

    // Calculate expiry
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // ── Save or update connection ──
    await prisma.hospitableConnection.upsert({
      where: { userId: currentUserId },
      create: {
        userId: currentUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        status: "active",
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        status: "active",
      },
    });

    // ── Sync properties ──
    let syncedCount = 0;
    try {
      const propertiesRes = await getProperties(tokens.access_token);
      const properties = propertiesRes?.data || propertiesRes || [];

      if (Array.isArray(properties)) {
        for (const hospProp of properties) {
          const hospPropertyId = hospProp.id;
          const propName = hospProp.attributes?.name || hospProp.name || "Imóvel Hospitable";

          // Get listings for this property
          const listings = hospProp.relationships?.listings?.data ||
            hospProp.listings || [];
          const firstListing = Array.isArray(listings) ? listings[0] : null;
          const hospListingId = firstListing?.id || null;
          const airbnbRoomId = firstListing?.platform_id ||
            firstListing?.attributes?.platform_id || null;

          // Try to match existing property
          let existingProp = null;

          // Match by airbnbRoomId
          if (airbnbRoomId) {
            existingProp = await prisma.property.findFirst({
              where: { userId: currentUserId, airbnbRoomId },
            });
          }

          // Match by name
          if (!existingProp) {
            existingProp = await prisma.property.findFirst({
              where: { userId: currentUserId, name: propName },
            });
          }

          if (existingProp) {
            // Update with Hospitable IDs
            await prisma.property.update({
              where: { id: existingProp.id },
              data: {
                hospitablePropertyId: hospPropertyId,
                hospitableListingId: hospListingId,
                airbnbRoomId: airbnbRoomId || existingProp.airbnbRoomId,
              },
            });
            syncedCount++;
          } else {
            // Create new property
            await prisma.property.create({
              data: {
                userId: currentUserId,
                name: propName,
                airbnbRoomId,
                hospitablePropertyId: hospPropertyId,
                hospitableListingId: hospListingId,
              },
            });
            syncedCount++;
          }
        }
      }
    } catch (syncErr: any) {
      // Property sync failed but connection is saved — that's OK
      console.error("[hospitable/callback] Property sync error:", syncErr.message);
    }

    // ── Redirect to dashboard ──
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=connected&synced=${syncedCount}`, BASE_URL)
    );
  } catch (e: any) {
    console.error("[hospitable/callback] Token exchange error:", e);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(e.message || "token_exchange_failed")}`, BASE_URL)
    );
  }
}
