import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — AirCheck | Dicas para anfitriões do Airbnb em condomínios",
  description: "Artigos sobre check-in em prédios com portaria, legislação de Airbnb em condomínios, automação para anfitriões e dicas para ganhar mais com aluguel por temporada.",
  openGraph: {
    title: "Blog — AirCheck",
    description: "Dicas para anfitriões do Airbnb que hospedam em prédios com portaria.",
    url: "https://aircheck.com.br/blog",
    siteName: "AirCheck",
    type: "website",
  },
  alternates: { canonical: "https://aircheck.com.br/blog" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
