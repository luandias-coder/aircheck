import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { put } from "@vercel/blob";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "aircheck-secret-change-in-production-2026");
const COOKIE_NAME = "aircheck_portaria";

async function getPortariaAuth(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return {
      condoUserId: payload.condoUserId as string,
      condominiumId: payload.condominiumId as string,
      role: payload.role as string,
    };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (auth.role !== "admin") return NextResponse.json({ error: "Apenas administradores podem alterar a foto" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são aceitas" }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 2MB." }, { status: 400 });
    }

    // Upload to Vercel Blob
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `condo/${auth.condominiumId}/photo.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      token: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    });

    // Update condominium with photo URL
    await prisma.condominium.update({
      where: { id: auth.condominiumId },
      data: { photoUrl: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[portaria/settings/photo]", e);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}

// DELETE: remove photo
export async function DELETE(req: NextRequest) {
  const auth = await getPortariaAuth(req);
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (auth.role !== "admin") return NextResponse.json({ error: "Apenas administradores podem remover a foto" }, { status: 403 });

  try {
    await prisma.condominium.update({
      where: { id: auth.condominiumId },
      data: { photoUrl: null },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[portaria/settings/photo DELETE]", e);
    return NextResponse.json({ error: "Erro ao remover foto" }, { status: 500 });
  }
}
