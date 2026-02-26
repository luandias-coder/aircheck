import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// Emojis via codepoint to survive file-encoding issues during Vercel build
const E = {
  house:    String.fromCodePoint(0x1F3E0),
  pin:      String.fromCodePoint(0x1F4CD),
  building: String.fromCodePoint(0x1F3E2),
  parking:  String.fromCodePoint(0x1F17F, 0xFE0F),
  cal:      String.fromCodePoint(0x1F4C5),
  moon:     String.fromCodePoint(0x1F319),
  clip:     String.fromCodePoint(0x1F4CB),
  phone:    String.fromCodePoint(0x1F4F1),
  people:   String.fromCodePoint(0x1F465),
  person:   String.fromCodePoint(0x1F464),
  cake:     String.fromCodePoint(0x1F382),
  id:       String.fromCodePoint(0x1FAAA),
  globe:    String.fromCodePoint(0x1F30D),
  car:      String.fromCodePoint(0x1F697),
  check:    String.fromCodePoint(0x2705),
  doc:      String.fromCodePoint(0x1F4CE),
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "N\u00e3o autenticado" }, { status: 401 });
  try {
    const r = await prisma.reservation.findFirst({
      where: { id: params.id, userId },
      include: { property: { include: { doormanPhones: true } }, guests: true },
    });
    if (!r) return NextResponse.json({ error: "Reserva n\u00e3o encontrada" }, { status: 404 });
    if (r.property.doormanPhones.length === 0) return NextResponse.json({ error: "Nenhuma portaria configurada" }, { status: 400 });
    if (r.guests.length === 0) return NextResponse.json({ error: "Aguardando formul\u00e1rio" }, { status: 400 });

    const sep = "--------------------------------------";
    const l: string[] = [];
    l.push(sep);
    l.push(`${E.house} *CHECK-IN*`);
    l.push(`${E.pin} *${r.property.name}*`);
    l.push(sep);
    l.push(``);
    if (r.property.unitNumber) l.push(`${E.building} *Unidade:* ${r.property.unitNumber}`);
    if (r.property.parkingSpot) l.push(`${E.parking} *Vaga:* ${r.property.parkingSpot}`);
    l.push(`${E.cal} *Entrada:* ${r.checkInDate} \u00e0s ${r.checkInTime}`);
    l.push(`${E.cal} *Sa\u00edda:* ${r.checkOutDate} \u00e0s ${r.checkOutTime}`);
    l.push(`${E.moon} *Noites:* ${r.nights || "?"}`);
    l.push(`${E.clip} *C\u00f3digo:* ${r.confirmationCode || "?"}`);
    if (r.guestPhone) l.push(`${E.phone} *Contato h\u00f3spede:* ${r.guestPhone}`);
    l.push(``);
    l.push(sep);
    l.push(`${E.people} *H\u00d3SPEDES (${r.guests.length})*`);
    l.push(sep);
    r.guests.forEach((g) => {
      l.push(``);
      l.push(`${E.person} *${g.fullName}*`);
      if (g.birthDate) l.push(`   ${E.cake} ${g.birthDate}`);
      if (g.foreign) {
        if (g.passport) l.push(`   ${E.id} Passaporte: ${g.passport}`);
        if (g.rne) l.push(`   ${E.id} RNE: ${g.rne}`);
        l.push(`   ${E.globe} Estrangeiro`);
      } else {
        if (g.cpf) l.push(`   ${E.id} CPF: ${g.cpf}`);
        if (g.rg) l.push(`   ${E.id} RG: ${g.rg}`);
      }
      if (r.property.includeDocLinks && g.documentUrl) {
        l.push(`   ${E.doc} Doc: https://airchk.in/d/${g.id}`);
      }
    });
    if (r.carPlate || r.carModel) {
      l.push(``);
      l.push(`${E.car} *Ve\u00edculo:* ${[r.carModel, r.carPlate].filter(Boolean).join(" \u2022 ")}`);
    }
    l.push(``);
    l.push(sep);
    l.push(`${E.check} _Enviado via AirCheck_`);

    const message = l.join("\n");
    const links = r.property.doormanPhones.map((dp) => {
      const phone = dp.phone.replace(/\D/g, "");
      const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
      return { phone: dp.phone, name: dp.name, label: dp.label, link: `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}` };
    });

    return NextResponse.json({ message, links });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
