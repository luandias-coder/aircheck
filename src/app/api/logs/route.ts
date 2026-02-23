import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    // Get user's inbound emails to scope logs
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { inboundEmails: true } });
    const emails = user?.inboundEmails.map(e => e.email) || [];

    const logs = await prisma.inboundEmailLog.findMany({
      where: emails.length > 0 ? { fromEmail: { in: emails } } : { fromEmail: "___none___" },
      select: {
        id: true,
        fromEmail: true,
        subject: true,
        htmlBody: true,
        status: true,
        error: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
