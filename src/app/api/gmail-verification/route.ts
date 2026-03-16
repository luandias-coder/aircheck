import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/gmail-verification
 * 
 * Polls for Gmail forwarding confirmation status.
 * Onboarding Step 2 calls this every 4s after host adds the forwarding address in Gmail.
 * 
 * Flow:
 * 1. Host adds reservas@aircheck.com.br in Gmail forwarding settings
 * 2. Gmail sends confirmation email to reservas@aircheck.com.br
 * 3. Email arrives at our inbound-email webhook via SendGrid
 * 4. Webhook detects forwarding-noreply@google.com, auto-clicks confirm link
 * 5. Webhook logs with status "gmail_confirmation"
 * 6. This endpoint finds that log and returns { found: true }
 * 7. Frontend shows ✅ and host proceeds to create the filter
 */
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Look for a Gmail confirmation log in the last 15 minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const confirmation = await prisma.inboundEmailLog.findFirst({
    where: {
      status: "gmail_confirmation",
      createdAt: { gte: fifteenMinAgo },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ found: !!confirmation });
}
