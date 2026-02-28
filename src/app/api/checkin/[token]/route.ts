import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    if (r.status !== "pending_form") {
      return NextResponse.json({ error: "Este formulário já foi preenchido. Para alterações, solicite ao anfitrião." }, { status: 400 });
    }

    const formData = await req.formData();
    const guestsRaw = formData.get("guests") as string;
    if (!guestsRaw) return NextResponse.json({ error: "Dados dos hóspedes ausentes" }, { status: 400 });
    
    let guests: Array<{
      fullName: string; birthDate: string; cpf?: string; rg?: string;
      foreign?: boolean; passport?: string; rne?: string; documentUrl?: string;
    }>;
    try { guests = JSON.parse(guestsRaw); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

    const carPlate = formData.get("carPlate") as string | null;
    const carModel = formData.get("carModel") as string | null;
    const guestPhone = formData.get("guestPhone") as string | null;

    // Fetch existing guests to preserve document URLs
    const existingGuests = await prisma.guest.findMany({ where: { reservationId: r.id }, orderBy: { createdAt: "asc" } });

    // Delete existing guests for re-creation
    await prisma.guest.deleteMany({ where: { reservationId: r.id } });

    // Create guests with document URLs (already uploaded individually)
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const documentUrl = g.documentUrl || existingGuests[i]?.documentUrl || null;
      await prisma.guest.create({
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
    }

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
  } catch (e: any) {
    console.error("Checkin POST error:", e);
    return NextResponse.json({ error: e?.message || "Erro ao salvar" }, { status: 500 });
  }
}
