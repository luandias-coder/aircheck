import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: { default: "AirCheck — Check-in automatizado para Airbnb em condomínios", template: "%s" },
  description: "Automatize o check-in de hóspedes do Airbnb na portaria do seu condomínio. Coleta de dados padronizada, envio pro WhatsApp da portaria com um clique.",
  metadataBase: new URL("https://aircheck.com.br"),
  icons: { icon: "/icon.svg" },
  openGraph: {
    siteName: "AirCheck",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
