import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// GET: checks if Gmail forwarding was auto-confirmed for the current user
// Used by onboarding polling
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    // Get all emails registered by this user
    const userEmails = await prisma.userInboundEmail.findMany({
      where: { userId },
      select: { email: true },
    });
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const allEmails = [
      ...userEmails.map(e => e.email.toLowerCase()),
      ...(user ? [user.email.toLowerCase()] : []),
    ];

    if (allEmails.length === 0) {
      return NextResponse.json({ found: false });
    }

    // Look for recent gmail_verification logs (last 30 minutes)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const logs = await prisma.inboundEmailLog.findMany({
      where: {
        status: "gmail_verification",
        createdAt: { gte: thirtyMinAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Find one that matches any of the user's emails
    for (const log of logs) {
      if (!log.parsedData) continue;
      try {
        const data = JSON.parse(log.parsedData);
        const hostEmail = data.hostEmail?.toLowerCase();
        if (hostEmail && allEmails.includes(hostEmail)) {
          return NextResponse.json({
            found: true,
            autoConfirmed: data.autoConfirmed === true,
            hostEmail: data.hostEmail,
            receivedAt: log.createdAt,
          });
        }
      } catch { continue; }
    }

    return NextResponse.json({ found: false });
  } catch (e) {
    console.error("[gmail-verification]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
