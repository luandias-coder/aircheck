import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getRelatedPosts, getAllPosts, CATEGORIES } from "@/lib/blog-posts";

// Generate static params for all posts
export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }));
}

// Dynamic metadata for each post
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Post não encontrado — AirCheck" };

  return {
    title: `${post.title} — AirCheck`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://aircheck.com.br/blog/${post.slug}`,
      siteName: "AirCheck",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: { canonical: `https://aircheck.com.br/blog/${post.slug}` },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(params.slug);
  const cat = CATEGORIES[post.category];

  // JSON-LD structured data for AEO/GEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: "AirCheck", url: "https://aircheck.com.br" },
    publisher: { "@type": "Organization", name: "AirCheck", url: "https://aircheck.com.br", logo: { "@type": "ImageObject", url: "https://aircheck.com.br/favicon.ico" } },
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://aircheck.com.br/blog/${post.slug}` },
    keywords: post.tags.join(", "),
    wordCount: post.content.replace(/<[^>]+>/g, "").split(/\s+/).length,
    articleSection: cat?.label || post.category,
  };

  // FAQ structured data if content has h2+p pattern (helps AEO)
  const faqItems: Array<{ q: string; a: string }> = [];
  const h2Regex = /<h2>(.*?)<\/h2>\s*<p>(.*?)<\/p>/g;
  let match;
  while ((match = h2Regex.exec(post.content)) !== null) {
    if (match[1].includes("?") || match[1].toLowerCase().startsWith("como") || match[1].toLowerCase().startsWith("o que") || match[1].toLowerCase().startsWith("por que") || match[1].toLowerCase().startsWith("quando") || match[1].toLowerCase().startsWith("qual")) {
      faqItems.push({ q: match[1].replace(/<[^>]+>/g, ""), a: match[2].replace(/<[^>]+>/g, "").substring(0, 300) });
    }
  }

  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#FAFAF9", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,249,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#bg2)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="bg2" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#1A1A1A" }}>Air<span style={{ color: "#3B5FE5" }}>Check</span></span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/blog" style={{ fontSize: 14, fontWeight: 600, color: "#3B5FE5", textDecoration: "none" }}>Blog</Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 600, padding: "8px 18px", background: "#3B5FE5", color: "#fff", borderRadius: 8, textDecoration: "none" }}>Criar conta grátis</Link>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px" }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: "#A3A3A3", marginBottom: 24 }}>
          <Link href="/" style={{ color: "#A3A3A3", textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link href="/blog" style={{ color: "#A3A3A3", textDecoration: "none" }}>Blog</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "#737373" }}>{cat?.label || post.category}</span>
        </nav>

        {/* Category + Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          {cat && <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, background: cat.bg, padding: "4px 12px", borderRadius: 6 }}>{cat.label}</span>}
          <span style={{ fontSize: 13, color: "#A3A3A3" }}>{new Date(post.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span style={{ fontSize: 13, color: "#A3A3A3" }}>· {post.readingTime} min</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 20, color: "#1A1A1A" }}>{post.title}</h1>

        {/* Description */}
        <p style={{ fontSize: 18, color: "#737373", lineHeight: 1.7, marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid #E5E5E5" }}>{post.description}</p>

        {/* Content */}
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ fontSize: 16, color: "#374151", lineHeight: 1.8 }}
        />

        <style>{`
          article h2 { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 40px 0 16px; color: #1A1A1A; }
          article h3 { font-size: 20px; font-weight: 700; margin: 32px 0 12px; color: #1A1A1A; }
          article p { margin-bottom: 16px; }
          article ul, article ol { margin: 0 0 20px 20px; }
          article li { margin-bottom: 8px; line-height: 1.7; }
          article blockquote { margin: 20px 0; padding: 20px 24px; background: #F5F5F4; border-left: 4px solid #3B5FE5; border-radius: 0 8px 8px 0; font-style: italic; }
          article blockquote p { margin-bottom: 4px; }
          article a { color: #3B5FE5; text-decoration: underline; text-underline-offset: 2px; }
          article a:hover { color: #5E4FE5; }
          article strong { color: #1A1A1A; }
          article em { font-style: italic; color: #737373; }
        `}</style>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 48, paddingTop: 32, borderTop: "1px solid #E5E5E5" }}>
          {post.tags.map(tag => (
            <span key={tag} style={{ fontSize: 12, fontWeight: 500, color: "#737373", background: "#F5F5F4", padding: "4px 12px", borderRadius: 6 }}>#{tag}</span>
          ))}
        </div>

        {/* CTA inline */}
        <div style={{ margin: "48px 0", padding: "32px 28px", background: "linear-gradient(135deg, #3B5FE5, #5E4FE5)", borderRadius: 16, textAlign: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Automatize o check-in na portaria do seu Airbnb</h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>Coleta de dados padronizada, envio pro WhatsApp da portaria. Gratuito.</p>
          <Link href="/register" style={{ display: "inline-block", padding: "14px 32px", background: "#fff", color: "#3B5FE5", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Criar conta grátis →</Link>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 24, color: "#1A1A1A" }}>Leia também</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {related.map(r => {
              const rc = CATEGORIES[r.category];
              return (
                <Link key={r.slug} href={`/blog/${r.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: "22px 20px", border: "1px solid #E5E5E5", height: "100%" }}>
                    {rc && <span style={{ fontSize: 10, fontWeight: 600, color: rc.color, background: rc.bg, padding: "3px 8px", borderRadius: 4 }}>{rc.label}</span>}
                    <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, marginTop: 10, color: "#1A1A1A" }}>{r.title}</h3>
                    <p style={{ fontSize: 13, color: "#A3A3A3", marginTop: 8 }}>{r.readingTime} min · {new Date(r.publishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: "#0F0F0F", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#525252" }}>© {new Date().getFullYear()} AirCheck. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
