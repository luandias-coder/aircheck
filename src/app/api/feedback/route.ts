import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const feedbacks = await prisma.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(feedbacks);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { rating, category, message } = await req.json();
  if (!rating || !message?.trim()) {
    return NextResponse.json({ error: "Avaliação e mensagem são obrigatórios" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Avaliação deve ser de 1 a 5" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId,
      rating: Math.round(rating),
      category: category || "sugestao",
      message: message.trim(),
    },
  });

  return NextResponse.json(feedback);
}
