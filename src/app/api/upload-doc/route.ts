import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

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

    const blob = await put(
      `docs/${reservationId || "unknown"}/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[upload-doc]", e);
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}
