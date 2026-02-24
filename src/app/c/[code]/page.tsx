import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CodeRedirectPage({ params }: { params: { code: string } }) {
  const code = params.code.trim().toUpperCase();

  // Find most recent reservation with this confirmation code (case-insensitive)
  const reservation = await prisma.reservation.findFirst({
    where: { confirmationCode: { equals: code, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { formToken: true },
  });

  if (reservation) {
    redirect(`/checkin/${reservation.formToken}`);
  }

  // Not found - show friendly error
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#FAFAF9", fontFamily: "Outfit, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🔍</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Reserva não encontrada</h2>
        <p style={{ fontSize: 14, color: "#737373", lineHeight: 1.6, marginBottom: 24 }}>
          Não encontramos uma reserva com o código <strong style={{ color: "#1A1A1A", fontFamily: "'IBM Plex Mono', monospace" }}>{code}</strong>.
        </p>
        <p style={{ fontSize: 13, color: "#A3A3A3", lineHeight: 1.5 }}>
          Verifique o código na sua confirmação de reserva do Airbnb e tente novamente, ou entre em contato com seu anfitrião.
        </p>
      </div>
    </div>
  );
}
