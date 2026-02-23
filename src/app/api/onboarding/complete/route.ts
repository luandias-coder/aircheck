import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await prisma.user.update({ where: { id: userId }, data: { onboardingCompleted: true } });
  return NextResponse.json({ ok: true });
}
