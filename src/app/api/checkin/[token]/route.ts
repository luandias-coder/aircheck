import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const r = await prisma.reservation.findUnique({
      where: { formToken: params.token },
      include: { property: true, guests: true },
    });
    if (!r) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

    return NextResponse.json({
      propertyName: r.property.name,
      guestName: r.guestFullName,
      guestPhone: r.guestPhone,
      checkInDate: r.checkInDate,
      checkInTime: r.checkInTime,
      checkOutDate: r.checkOutDate,
      checkOutTime: r.checkOutTime,
      numGuests: r.numGuests,
      nights: r.nights,
      status: r.status,
      carPlate: r.carPlate,
      carModel: r.carModel,
      guests: r.guests.map((g) => ({
        fullName: g.fullName,
        birthDate: g.birthDate,
        cpf: g.cpf,
        rg: g.rg,
        foreign: g.foreign,
        passport: g.passport,
        rne: g.rne,
        hasDocument: !!g.documentUrl,
      })),
    });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const r = await prisma.reservation.findUnique({ where: { formToken: params.token } });
    if (!r) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

    // Allow re-editing: accept POST if pending_form OR form_filled
    if (r.status !== "pending_form" && r.status !== "form_filled") {
      return NextResponse.json({ error: "Formulário não pode mais ser editado" }, { status: 400 });
    }

    const formData = await req.formData();
    const guestsRaw = formData.get("guests") as string;
    const guests: Array<{
      fullName: string; birthDate: string; cpf?: string; rg?: string;
      foreign?: boolean; passport?: string; rne?: string;
    }> = JSON.parse(guestsRaw);

    const carPlate = formData.get("carPlate") as string | null;
    const carModel = formData.get("carModel") as string | null;
    const guestPhone = formData.get("guestPhone") as string | null;

    // Delete existing guests if re-editing
    await prisma.guest.deleteMany({ where: { reservationId: r.id } });

    // Create guests with documents
    await Promise.all(guests.map(async (g, i) => {
      let documentUrl: string | null = null;
      const file = formData.get(`document_${i}`) as File | null;
      if (file && file.size > 0) {
        try {
          const blob = await put(`docs/${r.id}/${i}-${Date.now()}-${file.name}`, file, { access: "public" });
          documentUrl = blob.url;
        } catch (err) { console.error(`Upload error ${i}:`, err); }
      }
      return prisma.guest.create({
        data: {
          reservationId: r.id,
          fullName: g.fullName,
          birthDate: g.birthDate,
          cpf: g.cpf || null,
          rg: g.rg || null,
          foreign: g.foreign || false,
          passport: g.passport || null,
          rne: g.rne || null,
          documentUrl,
        },
      });
    }));

    await prisma.reservation.update({
      where: { id: r.id },
      data: {
        status: "form_filled",
        carPlate: carPlate || null,
        carModel: carModel || null,
        guestPhone: guestPhone || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 }); }
}
