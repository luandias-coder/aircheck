import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

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
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AirCheck",
  },
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
        <meta name="theme-color" content="#3B5FE5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        {GA_ID && <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
        </>}
        <ServiceWorkerRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
