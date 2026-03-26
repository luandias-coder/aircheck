// src/app/api/auth/hospitable/connect/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aircheck.com.br";
const CONNECT_API = "https://connect.hospitable.com/api/v1";
const CONNECT_TOKEN = process.env.HOSPITABLE_CONNECT_TOKEN || "";
const CONNECT_VERSION = "2024-01-01";

async function connectPost(path: string, body: any) {
  console.log(`[hospitable/connect] POST ${path}`, JSON.stringify(body));
  const res = await fetch(`${CONNECT_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONNECT_TOKEN}`,
      "Connect-Version": CONNECT_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`[hospitable/connect] ${path} → ${res.status}:`, text);
  if (!res.ok && res.status !== 422 && res.status !== 409) {
    throw new Error(`Connect API ${path}: ${res.status} ${text}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  const existing = await prisma.hospitableConnection.findUnique({ where: { userId } });
  if (existing?.status === "active") {
    return NextResponse.redirect(new URL("/dashboard?hospitable=already_connected", BASE_URL));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, phone: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/login", BASE_URL));
  }

  try {
    const customerId = user.id.replace(/[^a-zA-Z0-9]/g, "");

    // Step 1: Create customer (ignore if already exists)
    await connectPost("/customers", {
      id: customerId,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      phone: user.phone || undefined,
      timezone: "America/Sao_Paulo",
    });

    // Step 2: Create auth code
    const redirectUrl = `${BASE_URL}/api/auth/hospitable/callback?user_id=${userId}`;
    const authCodeRes = await connectPost("/auth-codes", {
      customer_id: customerId,
      redirect_url: redirectUrl,
    });

    // Parse return_url — could be at top level or nested in .data
    const returnUrl = authCodeRes?.return_url || authCodeRes?.data?.return_url || authCodeRes?.data?.attributes?.return_url;
    console.log("[hospitable/connect] Parsed return_url:", returnUrl, "Full response:", JSON.stringify(authCodeRes));

    if (!returnUrl) {
      throw new Error(`No return_url in response: ${JSON.stringify(authCodeRes).slice(0, 500)}`);
    }

    // Save connection as pending
    await prisma.hospitableConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: "connect",
        refreshToken: "connect",
        hospitableAccountId: customerId,
        status: "pending",
      },
      update: {
        hospitableAccountId: customerId,
        status: "pending",
      },
    });

    return NextResponse.redirect(returnUrl);
  } catch (e: any) {
    console.error("[hospitable/connect] Error:", e);
    return NextResponse.redirect(
      new URL(`/dashboard?hospitable=error&reason=${encodeURIComponent(e.message || "connection_failed")}`, BASE_URL)
    );
  }
}
