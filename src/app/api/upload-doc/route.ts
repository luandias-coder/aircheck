import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reservationId = formData.get("reservationId") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 5MB)" }, { status: 400 });
    }

    // Sanitize filename: remove accents, special chars
    const safeName = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-50);

    const path = `docs/${reservationId || "unknown"}/${Date.now()}-${safeName}`;
    
    const blob = await put(path, file, { access: "public" });

    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error("[upload-doc] Error:", e?.message, e);
    const msg = e?.message || "Erro desconhecido";
    if (msg.includes("token") || msg.includes("BLOB") || msg.includes("not allowed")) {
      return NextResponse.json({ error: "Configuração do Blob Store incompleta. Verifique BLOB_READ_WRITE_TOKEN." }, { status: 500 });
    }
    return NextResponse.json({ error: `Erro no upload: ${msg}` }, { status: 500 });
  }
}
