import { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, CATEGORIES } from "@/lib/blog-posts";

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

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#FAFAF9", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,249,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#bg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="bg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A" }}>Air<span style={{ color: "#3B5FE5" }}>Check</span></span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#3B5FE5" }}>Blog</span>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: "#3B5FE5", color: "#fff", borderRadius: 8, textDecoration: "none" }}>Criar conta grátis</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header style={{ padding: "64px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 12 }}>
          Blog <span style={{ background: "linear-gradient(135deg, #3B5FE5, #5E4FE5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AirCheck</span>
        </h1>
        <p style={{ fontSize: 17, color: "#737373", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Dicas práticas para anfitriões do Airbnb que hospedam em prédios com portaria.
        </p>
      </header>

      {/* Posts grid */}
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {posts.map((post) => {
            const cat = CATEGORIES[post.category];
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", border: "1px solid #E5E5E5", height: "100%", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                  {/* Category */}
                  {cat && <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 600, color: cat.color, background: cat.bg, padding: "4px 10px", borderRadius: 6, marginBottom: 14 }}>{cat.label}</span>}
                  {/* Title */}
                  <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.35, marginBottom: 10, color: "#1A1A1A", flex: 1 }}>{post.title}</h2>
                  {/* Description */}
                  <p style={{ fontSize: 14, color: "#737373", lineHeight: 1.6, marginBottom: 16 }}>{post.description}</p>
                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#A3A3A3" }}>
                    <span>{new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span>·</span>
                    <span>{post.readingTime} min de leitura</span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </main>

      {/* CTA */}
      <section style={{ padding: "60px 24px", background: "#0F0F0F", textAlign: "center" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>Automatize o check-in na portaria.</h2>
          <p style={{ fontSize: 15, color: "#A3A3A3", marginBottom: 24 }}>Pare de mandar dados manualmente a cada reserva.</p>
          <Link href="/register" style={{ display: "inline-block", padding: "14px 32px", background: "#3B5FE5", color: "#fff", borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Criar conta grátis →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0F0F0F", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#525252" }}>© {new Date().getFullYear()} AirCheck. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
