import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AirCheck — Painel da Portaria",
  description: "Painel de check-ins para portarias de condomínios parceiros.",
  manifest: "/manifest-portaria.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Portaria",
  },
};

export default function PortariaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
