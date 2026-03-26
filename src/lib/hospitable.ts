// src/lib/hospitable.ts
// Hospitable Connect API helper

const HOSPITABLE_API_BASE = "https://public.api.hospitable.com/v2";
const HOSPITABLE_AUTH_URL = "https://my.hospitable.com/oauth/authorize";
const HOSPITABLE_TOKEN_URL = "https://my.hospitable.com/oauth/token";

const CLIENT_ID = process.env.HOSPITABLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.HOSPITABLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.HOSPITABLE_REDIRECT_URI || "";

// ─── OAuth helpers ───

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    state,
    // Scopes may be pre-configured by Hospitable for our client
    // If needed, add: scope: "reservations:read properties:read listings:read"
  });
  return `${HOSPITABLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const res = await fetch(HOSPITABLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hospitable token exchange failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(HOSPITABLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hospitable token refresh failed: ${res.status} ${err}`);
  }

  return res.json();
}

// ─── API calls ───

async function apiCall(accessToken: string, path: string, options?: RequestInit) {
  const res = await fetch(`${HOSPITABLE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hospitable API ${path}: ${res.status} ${err}`);
  }

  return res.json();
}

export async function getProperties(accessToken: string) {
  return apiCall(accessToken, "/properties");
}

export async function getReservations(accessToken: string, params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiCall(accessToken, `/reservations${query}`);
}

export async function getReservation(accessToken: string, reservationId: string) {
  return apiCall(accessToken, `/reservations/${reservationId}?include=guest,properties`);
}

export async function getReservationMessages(accessToken: string, reservationId: string) {
  return apiCall(accessToken, `/reservations/${reservationId}/messages`);
}

// Send message using a pre-approved template
export async function sendMessage(
  accessToken: string,
  conversationId: string,
  templateId: string,
  replacements: Record<string, string>
) {
  return apiCall(accessToken, `/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      template_id: templateId,
      replacements,
    }),
  });
}

// ─── Webhook validation ───

const WEBHOOK_IP_RANGE = "38.80.170."; // 38.80.170.0/24

export function isValidWebhookSource(ip: string | null, webhookSecret?: string, headerSecret?: string): boolean {
  // Method 1: Validate webhook secret (preferred)
  if (webhookSecret && headerSecret) {
    return webhookSecret === headerSecret;
  }

  // Method 2: Validate IP range
  if (ip) {
    // Handle forwarded IPs (x-forwarded-for can be comma-separated)
    const realIp = ip.split(",")[0].trim();
    return realIp.startsWith(WEBHOOK_IP_RANGE);
  }

  return false;
}

// ─── Data mapping helpers ───

export interface HospitableReservationWebhook {
  action: string;
  data: {
    id: string;
    code?: string;
    platform?: string;
    status?: string;
    arrival_date?: string; // YYYY-MM-DD
    departure_date?: string; // YYYY-MM-DD
    checkin_time?: string; // HH:MM
    checkout_time?: string; // HH:MM
    number_of_guests?: number;
    nights?: number;
    conversation_id?: string;
    guest?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      phone?: string;
      picture_url?: string;
    };
    property?: {
      id?: string;
      name?: string;
    };
    listings?: Array<{
      id?: string;
      platform_id?: string; // airbnb room ID
      platform?: string;
      name?: string;
    }>;
    financials?: {
      host_payout?: number;
      currency?: string;
    };
  };
}

// Convert YYYY-MM-DD to DD/MM/YYYY (AirCheck format)
export function formatDateBR(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Calculate nights between two dates
export function calculateNights(arrival: string | undefined, departure: string | undefined): number | null {
  if (!arrival || !departure) return null;
  const a = new Date(arrival);
  const d = new Date(departure);
  const diff = Math.round((d.getTime() - a.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}
