import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOB_TOKEN = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    if (!BLOB_TOKEN) {
      return NextResponse.json({ error: "Token do Blob Store não configurado" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reservationId = formData.get("reservationId") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 5MB)" }, { status: 400 });
    }

    const safeName = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-50);

    const blob = await put(
      `docs/${reservationId || "unknown"}/${Date.now()}-${safeName}`,
      file,
      { access: "public", token: BLOB_TOKEN }
    );

    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error("[upload-doc]", e?.message);
    return NextResponse.json({ error: `Erro no upload: ${e?.message}` }, { status: 500 });
  }
}
