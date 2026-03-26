// src/lib/hospitable.ts
// Hospitable Connect API helper (NOT OAuth — uses Bearer token + magic links)

import crypto from "crypto";

const CONNECT_API_BASE = "https://connect.hospitable.com/api/v1";
const CONNECT_TOKEN = process.env.HOSPITABLE_CONNECT_TOKEN || "";
const CONNECT_VERSION = "2024-01-01";

// ─── API calls ───

async function connectApi(path: string, options?: { method?: string; body?: any }) {
  const res = await fetch(`${CONNECT_API_BASE}${path}`, {
    method: options?.method || "GET",
    headers: {
      Authorization: `Bearer ${CONNECT_TOKEN}`,
      "Connect-Version": CONNECT_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hospitable Connect ${path}: ${res.status} ${err}`);
  }

  return res.json();
}

// ─── Customer management ───

export async function createCustomer(data: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timezone?: string;
}) {
  return connectApi("/customers", { method: "POST", body: data });
}

export async function getCustomer(customerId: string) {
  return connectApi(`/customers/${customerId}`);
}

// ─── Auth codes (magic links) ───

export async function createAuthCode(data: {
  customer_id: string;
  redirect_url: string;
}): Promise<{ return_url: string; expires_at: string }> {
  return connectApi("/auth-codes", { method: "POST", body: data });
}

// ─── Listings ───

export async function getListings(customerId?: string) {
  const query = customerId ? `?customer_id=${customerId}` : "";
  return connectApi(`/listings${query}`);
}

// ─── Reservations ───

export async function getReservations(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return connectApi(`/reservations${query}`);
}

export async function getReservation(reservationId: string) {
  return connectApi(`/reservations/${reservationId}`);
}

// ─── Messaging ───

export async function sendMessage(reservationId: string, body: string) {
  return connectApi(`/reservations/${reservationId}/messages`, {
    method: "POST",
    body: { body },
  });
}

// ─── Webhook validation ───

const WEBHOOK_SECRET = process.env.HOSPITABLE_WEBHOOK_SECRET || "";

export function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  try {
    const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Data mapping helpers ───

export function formatDateBR(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function calculateNights(arrival: string | undefined, departure: string | undefined): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival);
  const d = new Date(departure);
  const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}
