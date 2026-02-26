import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { guestId: string } }) {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: params.guestId },
      select: { documentUrl: true },
    });

    if (!guest?.documentUrl) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Documento não encontrado</title></head>
        <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#FAFAF9">
        <div style="text-align:center"><h1 style="font-size:20px;color:#1A1A1A">Documento não encontrado</h1><p style="color:#737373;font-size:14px">Este link pode ter expirado ou o documento ainda não foi enviado.</p></div>
        </body></html>`,
        { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    return NextResponse.redirect(guest.documentUrl, 302);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
