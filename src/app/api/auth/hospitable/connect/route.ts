// src/app/api/auth/hospitable/connect/route.ts
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { ok: res.ok, status: res.status, data: parsed };
}

// Generate a short, safe customer ID from the user's cuid
// Connect API might reject long or certain ID formats
function makeCustomerId(userId: string): string {
  // Use first 20 chars of a hex hash — guaranteed alphanumeric, fixed length
  return "ac_" + crypto.createHash("md5").update(userId).digest("hex").slice(0, 16);
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
    // Always generate a clean customer ID (don't reuse stale ones from failed attempts)
    const customerId = makeCustomerId(user.id);

    // Format phone to E.164 (Connect requires +55XXXXXXXXXXX)
    let phone: string | undefined = undefined;
    if (user.phone) {
      const digits = user.phone.replace(/\D/g, "");
      if (digits.length === 11) phone = `+55${digits}`;
      else if (digits.length === 13 && digits.startsWith("55")) phone = `+${digits}`;
      else if (digits.startsWith("+")) phone = user.phone;
      // If format is unclear, just skip phone — it's optional
    }

    // Step 1: Create customer
    const customerRes = await connectPost("/customers", {
      id: customerId,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      ...(phone ? { phone } : {}),
      timezone: "America/Sao_Paulo",
    });

    // If phone validation fails, retry without phone
    if (!customerRes.ok && customerRes.status === 422) {
      const errors = customerRes.data?.errors || {};
      const hasPhoneError = errors.phone?.length > 0;
      const idErrors = errors.customer_id || errors.id || [];
      const isAlreadyTaken = idErrors.some((e: string) =>
        e.toLowerCase().includes("taken") || e.toLowerCase().includes("already")
      );

      if (isAlreadyTaken) {
        // Customer already exists — that's fine, continue
      } else if (hasPhoneError) {
        // Phone validation failed — retry without phone
        console.log("[hospitable/connect] Phone rejected, retrying without phone");
        const retryRes = await connectPost("/customers", {
          id: customerId,
          name: user.name || user.email.split("@")[0],
          email: user.email,
          timezone: "America/Sao_Paulo",
        });
        if (!retryRes.ok && retryRes.status !== 422 && retryRes.status !== 409) {
          throw new Error(`Customer creation failed: ${retryRes.status} ${JSON.stringify(retryRes.data)}`);
        }
      } else {
        throw new Error(`Customer creation failed: ${JSON.stringify(customerRes.data)}`);
      }
    } else if (!customerRes.ok && customerRes.status !== 409) {
      throw new Error(`Customer creation failed: ${customerRes.status} ${JSON.stringify(customerRes.data)}`);
    }

    // Save connection as pending
    await prisma.hospitableConnection.upsert({
      where: { userId },
      create: { userId, accessToken: "connect", refreshToken: "connect", hospitableAccountId: customerId, status: "pending" },
      update: { hospitableAccountId: customerId, status: "pending" },
    });

    // Step 2: Create auth code
    const redirectUrl = `${BASE_URL}/api/auth/hospitable/callback?user_id=${userId}`;
    const authCodeRes = await connectPost("/auth-codes", {
      customer_id: customerId,
      redirect_url: redirectUrl,
      locale: "pt",
    });

    const returnUrl = authCodeRes.data?.return_url || authCodeRes.data?.data?.return_url;
    console.log("[hospitable/connect] return_url:", returnUrl);

    if (!returnUrl) {
      throw new Error(`No return_url in response: ${JSON.stringify(authCodeRes.data).slice(0, 500)}`);
    }

    return NextResponse.redirect(returnUrl);
  } catch (e: any) {
    console.error("[hospitable/connect] Error:", e);
    // Check if user is in onboarding to redirect to the right place
    let dest = "/dashboard";
    try {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { onboardingCompleted: true } });
      if (u && !u.onboardingCompleted) dest = "/onboarding";
    } catch {}
    return NextResponse.redirect(
      new URL(`${dest}?hospitable=error&reason=${encodeURIComponent(e.message || "connection_failed")}`, BASE_URL)
    );
  }
}
