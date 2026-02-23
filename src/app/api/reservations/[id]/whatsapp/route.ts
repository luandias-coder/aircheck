import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const r = await prisma.reservation.findFirst({
      where: { id: params.id, userId },
      include: { property: { include: { doormanPhones: true } }, guests: true },
    });
    if (!r) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    if (r.property.doormanPhones.length === 0) return NextResponse.json({ error: "Nenhuma portaria configurada" }, { status: 400 });
    if (r.guests.length === 0) return NextResponse.json({ error: "Aguardando formulário" }, { status: 400 });

    const l: string[] = [];
    l.push(`🏠 *CHECK-IN*`);
    l.push(`📍 *${r.property.name}*`);
    l.push(``);
    l.push(`📅 Entrada: ${r.checkInDate} às ${r.checkInTime}`);
    l.push(`📅 Saída: ${r.checkOutDate} às ${r.checkOutTime}`);
    l.push(`🌙 Noites: ${r.nights || "?"}`);
    l.push(`📋 Código: ${r.confirmationCode || "?"}`);
    if (r.guestPhone) l.push(`📱 Contato hóspede: ${r.guestPhone}`);
    l.push(``);
    l.push(`👥 *HÓSPEDES (${r.guests.length})*`);
    r.guests.forEach((g) => {
      l.push(``);
      l.push(`👤 *${g.fullName}*`);
      if (g.birthDate) l.push(`   🎂 ${g.birthDate}`);
      if (g.foreign) {
        if (g.passport) l.push(`   📄 Passaporte: ${g.passport}`);
        if (g.rne) l.push(`   📄 RNE: ${g.rne}`);
        l.push(`   🌍 Estrangeiro`);
      } else {
        if (g.cpf) l.push(`   📄 CPF: ${g.cpf}`);
        if (g.rg) l.push(`   📄 RG: ${g.rg}`);
      }
    });
    if (r.carPlate || r.carModel) {
      l.push(``);
      l.push(`🚗 Veículo: ${[r.carModel, r.carPlate].filter(Boolean).join(" - ")}`);
    }
    l.push(``);
    l.push(`✅ _Enviado via AirCheck_`);

    const message = l.join("\n");
    const links = r.property.doormanPhones.map((dp) => {
      const phone = dp.phone.replace(/\D/g, "");
      const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
      return { phone: dp.phone, name: dp.name, label: dp.label, link: `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}` };
    });

    return NextResponse.json({ message, links });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Erro interno" }, { status: 500 }); }
}
