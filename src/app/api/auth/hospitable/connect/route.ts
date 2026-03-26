// src/app/api/auth/hospitable/connect/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { createCustomer, createAuthCode } from "@/lib/hospitable";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  // Check if already connected
  const existing = await prisma.hospitableConnection.findUnique({
    where: { userId },
  });
  if (existing?.status === "active") {
    return NextResponse.redirect(new URL("/dashboard?hospitable=already_connected", BASE_URL));
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  try {
    // Step 1: Create customer in Hospitable Connect
    // Use a clean alphanumeric ID (cuid can have chars Connect doesn't like)
    const customerId = user.id.replace(/[^a-zA-Z0-9]/g, "");

    try {
      await createCustomer({
        id: customerId,
        name: user.name || user.email.split("@")[0],
        email: user.email,
        phone: user.phone || undefined,
        timezone: "America/Sao_Paulo",
      });
    } catch (err: any) {
      // Customer might already exist from a previous attempt — that's OK
      if (!err.message?.includes("422") && !err.message?.includes("409") && !err.message?.includes("already")) {
        throw err;
      }
    }

    // Step 2: Create auth code (magic link)
    const redirectUrl = `${BASE_URL}/api/auth/hospitable/callback?user_id=${userId}`;
    const authCode = await createAuthCode({
      customer_id: customerId,
      redirect_url: redirectUrl,
    });

    // Save connection as pending
    await prisma.hospitableConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: "connect", // Connect uses vendor bearer token, not per-user tokens
        refreshToken: "connect",
        hospitableAccountId: customerId,
        status: "pending",
      },
      update: {
        hospitableAccountId: customerId,
        status: "pending",
      },
    });

    // Step 3: Redirect host to Hospitable Connect magic link
    return NextResponse.redirect(authCode.return_url);
  } catch (e: any) {
    console.error("[hospitable/connect] Error:", e);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(e.message || "connection_failed")}`, BASE_URL)
    );
  }
}
