// src/app/api/auth/hospitable/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br";

export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get("user_id");
  const currentUserId = await getCurrentUserId();
  const userId = currentUserId || userIdParam;

  if (!userId) {
    return NextResponse.redirect(new URL("/login?redirect=/dashboard", BASE_URL));
  }

  try {
    const connection = await prisma.hospitableConnection.findUnique({ where: { userId } });
    if (!connection) {
      return NextResponse.redirect(new URL("/dashboard?hospitable=error&reason=no_connection_found", BASE_URL));
    }

    // Mark as active
    await prisma.hospitableConnection.update({
      where: { userId },
      data: { status: "active" },
    });

    // Redirect to dashboard — sync will be triggered by the frontend
    return NextResponse.redirect(
      new URL("/dashboard?hospitable=connected&sync=true", BASE_URL)
    );
  } catch (e: any) {
    console.error("[hospitable/callback] Error:", e);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(e.message || "callback_failed")}`, BASE_URL)
    );
  }
}
