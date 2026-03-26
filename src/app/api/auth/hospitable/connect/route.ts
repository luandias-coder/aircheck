// src/app/api/auth/hospitable/connect/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/hospitable";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br"));
  }

  // Check if already connected
  const existing = await prisma.hospitableConnection.findUnique({
    where: { userId },
  });
  if (existing?.status === "active") {
    // Already connected — redirect to dashboard with message
    return NextResponse.redirect(
      new URL("/dashboard?hospitable=already_connected", process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br")
    );
  }

  // Generate state token (userId + random for CSRF protection)
  const randomBytes = crypto.randomUUID();
  const state = Buffer.from(JSON.stringify({ userId, nonce: randomBytes })).toString("base64url");

  // Redirect to Hospitable OAuth
  const authUrl = getAuthorizationUrl(state);
  return NextResponse.redirect(authUrl);
}
