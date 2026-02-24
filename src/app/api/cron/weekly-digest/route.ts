import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, weeklyDigestEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekAhead = new Date(now.getTime() + 7 * 86400000);

  // Format date range for email
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const period = `${fmt(weekAgo)} a ${fmt(now)}`;

  // Get all active users (have at least 1 reservation ever)
  const users = await prisma.user.findMany({
    where: { reservations: { some: {} } },
    select: {
      id: true, email: true, name: true,
      reservations: {
        select: {
          id: true, guestFullName: true, checkInDate: true, status: true, createdAt: true,
          property: { select: { name: true } },
          guests: { select: { id: true } },
        },
      },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const allRes = user.reservations;

      // Stats for last 7 days
      const newReservations = allRes.filter(r => r.createdAt >= weekAgo).length;
      const formsFilled = allRes.filter(r =>
        r.createdAt >= weekAgo && ["form_filled", "sent_to_doorman", "archived"].includes(r.status)
      ).length;
      const sentToDoorman = allRes.filter(r =>
        r.createdAt >= weekAgo && ["sent_to_doorman", "archived"].includes(r.status)
      ).length;
      const pendingForms = allRes.filter(r => r.status === "pending_form").length;

      // Upcoming check-ins (next 7 days)
      const todayStr = now.toISOString().slice(0, 10);
      const weekAheadStr = weekAhead.toISOString().slice(0, 10);

      const upcoming = allRes
        .filter(r => {
          // Parse DD/MM/YYYY to YYYY-MM-DD for comparison
          const parts = r.checkInDate.split("/");
          if (parts.length !== 3) return false;
          const iso = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          return iso >= todayStr && iso <= weekAheadStr;
        })
        .sort((a, b) => {
          const toIso = (d: string) => { const p = d.split("/"); return `${p[2]}-${p[1]}-${p[0]}`; };
          return toIso(a.checkInDate).localeCompare(toIso(b.checkInDate));
        })
        .slice(0, 8)
        .map(r => ({
          guest: r.guestFullName.split(" ").slice(0, 2).join(" "),
          property: r.property.name,
          date: r.checkInDate,
          hasForm: r.guests.length > 0 && r.status !== "pending_form",
        }));

      // Skip if nothing happened and no upcoming
      if (newReservations === 0 && pendingForms === 0 && upcoming.length === 0) continue;

      const digest = weeklyDigestEmail({
        name: user.name,
        period,
        newReservations,
        formsFilled,
        sentToDoorman,
        pendingForms,
        upcomingCheckins: upcoming,
      });

      const ok = await sendEmail({ to: user.email, subject: digest.subject, html: digest.html });
      if (ok) sent++; else errors++;
    } catch (err) {
      console.error(`[digest] Error for ${user.email}:`, err);
      errors++;
    }
  }

  console.log(`[digest] Done: ${sent} sent, ${errors} errors, ${users.length} users checked`);
  return NextResponse.json({ sent, errors, usersChecked: users.length });
}
