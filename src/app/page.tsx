"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const B = {
  primary: "#3B5FE5", g1: "#3B5FE5", g2: "#5E4FE5",
  dark: "#0F0F0F", muted: "#737373", light: "#F5F5F4", accent: "#059669",
};

function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(end / 40));
        const timer = setInterval(() => { start += step; if (start >= end) { setCount(end); clearInterval(timer); } else setCount(start); }, 30);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>{children}</div>;
}

function PhoneMockup() {
  return (
    <div style={{ width: 280, margin: "0 auto", position: "relative" }}>
      <div style={{ background: "#1A1A1A", borderRadius: 36, padding: "12px 8px", boxShadow: "0 25px 60px rgba(59,95,229,0.25), 0 8px 24px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 100, height: 24, background: "#1A1A1A", borderRadius: "0 0 16px 16px", margin: "0 auto -12px", position: "relative", zIndex: 2 }} />
        <div style={{ background: "#FAFAF9", borderRadius: 28, overflow: "hidden", height: 480, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "linear-gradient(135deg,#1A1A1A,#2D2D2D)", padding: "28px 16px 16px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#mg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="mg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#B4C6FC", textTransform: "uppercase", letterSpacing: "0.14em" }}>Check-in digital</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>Studio Estação Curitiba</div>
            <div style={{ fontSize: 10, color: "#A3A3A3", marginTop: 3 }}>28/02 15:00 → 02/03 12:00 · 2 noites</div>
          </div>
          <div style={{ padding: "12px 12px 0", flex: 1, overflow: "hidden" }}>
            <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Hóspede 1</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}>
                  <div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nome completo</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>João da Silva</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nascimento</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>01/01/1990</div></div>
                  <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>CPF</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>000.000.000-00</div></div>
                </div>
              </div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Hóspede 2</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nome completo</div><div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>Maria Souza</div></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nascimento</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>01/01/1990</div></div>
                  <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>CPF</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>000.000.000-00</div></div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "8px 12px 14px" }}>
            <div style={{ background: "linear-gradient(135deg,#1A1A1A,#333)", color: "#fff", borderRadius: 12, padding: "11px 0", textAlign: "center", fontSize: 12, fontWeight: 700 }}>Enviar dados para check-in</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppMockup() {
  const sep = "--------------------------------------";
  return (
    <div style={{ maxWidth: 320, margin: "0 auto" }}>
      <div style={{ background: "#E7DCCF", borderRadius: 16, padding: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <div style={{ background: "#075E54", borderRadius: "12px 12px 0 0", padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>P</div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Portaria Central</div><div style={{ fontSize: 10, color: "#ffffff90" }}>online</div></div>
        </div>
        <div style={{ background: "#DCF8C6", borderRadius: "0 12px 12px 12px", padding: "10px 12px", fontSize: 11, color: "#303030", lineHeight: 1.65, maxWidth: "90%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", fontFamily: "system-ui, sans-serif", whiteSpace: "pre-wrap" }}>
          <div style={{ fontSize: 9, color: "#667781", letterSpacing: "0.02em" }}>{sep}</div>
          <div>🏠 <strong>CHECK-IN</strong></div>
          <div>📍 <strong>Apartamento Centro</strong></div>
          <div style={{ fontSize: 9, color: "#667781", letterSpacing: "0.02em" }}>{sep}</div>
          <div style={{ height: 4 }} />
          <div>🏢 <strong>Unidade:</strong> 501</div>
          <div>🅿️ <strong>Vaga:</strong> G1-25</div>
          <div>📅 <strong>Entrada:</strong> 28/02/2026 às 15:00</div>
          <div>📅 <strong>Saída:</strong> 02/03/2026 às 12:00</div>
          <div>🌙 <strong>Noites:</strong> 2</div>
          <div>📋 <strong>Código:</strong> HM5T5WBX</div>
          <div>📱 <strong>Contato:</strong> +5541999990000</div>
          <div style={{ height: 4 }} />
          <div style={{ fontSize: 9, color: "#667781", letterSpacing: "0.02em" }}>{sep}</div>
          <div>👥 <strong>HÓSPEDES (2)</strong></div>
          <div style={{ fontSize: 9, color: "#667781", letterSpacing: "0.02em" }}>{sep}</div>
          <div style={{ height: 3 }} />
          <div>👤 <strong>João da Silva</strong></div>
          <div>&nbsp;&nbsp;&nbsp;🎂 12/05/1990</div>
          <div>&nbsp;&nbsp;&nbsp;🪪 CPF: 000.000.000-00</div>
          <div>&nbsp;&nbsp;&nbsp;🪪 RG: 00000000</div>
          <div style={{ height: 3 }} />
          <div>👤 <strong>Maria Souza</strong></div>
          <div>&nbsp;&nbsp;&nbsp;🎂 08/11/1993</div>
          <div>&nbsp;&nbsp;&nbsp;🪪 CPF: 000.000.000-00</div>
          <div style={{ height: 4 }} />
          <div>🚗 <strong>Veículo:</strong> Onix Preto • XYZ0A00</div>
          <div style={{ height: 4 }} />
          <div style={{ fontSize: 9, color: "#667781", letterSpacing: "0.02em" }}>{sep}</div>
          <div style={{ fontStyle: "italic", color: "#667781", fontSize: 10 }}>✅ <em>Enviado via AirCheck</em></div>
          <div style={{ textAlign: "right", fontSize: 10, color: "#667781", marginTop: 4 }}>14:32 ✓✓</div>
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const iStyle: React.CSSProperties = { width: "100%", fontFamily: "Outfit,sans-serif", fontSize: 15, color: "#1A1A1A", padding: "14px 16px", border: "1px solid #E5E5E5", borderRadius: 10, background: "#fff", boxSizing: "border-box" };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch { setStatus("error"); }
  };
  return (
    <section id="contato" style={{ padding: "80px 24px", background: "#FAFAF9" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Contato</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: B.dark, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Tem alguma dúvida?</h2>
            <p style={{ fontSize: 15, color: B.muted, marginTop: 12, lineHeight: 1.6 }}>Manda uma mensagem. Respondemos rápido.</p>
          </div>
          {status === "sent" ? (
            <div style={{ textAlign: "center", background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "40px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontFamily: "Outfit", fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Mensagem enviada!</h3>
              <p style={{ fontSize: 14, color: B.muted }}>Vamos responder o mais breve possível.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {status === "error" && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>Erro ao enviar. Tente novamente.</div>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" required style={iStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" required style={iStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Mensagem</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Sua dúvida ou mensagem..." required rows={4} style={{ ...iStyle, resize: "vertical" }} />
              </div>
              <button type="submit" disabled={status === "sending"} style={{ width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600, background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", boxShadow: `0 4px 14px rgba(59,95,229,0.25)`, opacity: status === "sending" ? 0.6 : 1 }}>
                {status === "sending" ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          )}
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: B.muted }}>Ou envie direto para <a href="mailto:oi@aircheck.com.br" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>oi@aircheck.com.br</a></p>
        </FadeIn>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: B.dark, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .grad-text { background: linear-gradient(135deg, ${B.g1}, ${B.g2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; background: linear-gradient(135deg, ${B.g1}, ${B.g2}); color: #fff; border: none; border-radius: 14px; font-family: 'Outfit'; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.3s; box-shadow: 0 8px 32px rgba(59,95,229,0.3); }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,95,229,0.4); }
        .cta-outline { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; background: transparent; color: ${B.primary}; border: 2px solid ${B.primary}; border-radius: 14px; font-family: 'Outfit'; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s; }
        .cta-outline:hover { background: ${B.primary}10; }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span.faq-icon { transform: rotate(45deg); }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; text-align: center !important; }
          .hero-text h1 { font-size: 36px !important; }
          .hero-ctas { justify-content: center !important; flex-wrap: wrap !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .nav-links { display: none !important; }
          .mobile-toggle { display: flex !important; }
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,249,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#ng)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>Air<span className="grad-text">Check</span></span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <a href="#o-problema" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>O problema</a>
            <a href="#como-funciona" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Como funciona</a>
            <Link href="/blog" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Blog</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
            <Link href="/register" className="cta-btn" style={{ padding: "10px 22px", fontSize: 14 }}>Criar conta grátis</Link>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>{mobileMenu ? "✕" : "☰"}</button>
        </div>
        {mobileMenu && <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <a href="#o-problema" onClick={() => setMobileMenu(false)} style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>O problema</a>
          <a href="#como-funciona" onClick={() => setMobileMenu(false)} style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Como funciona</a>
          <Link href="/blog" style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Blog</Link>
          <Link href="/login" style={{ fontSize: 16, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
          <Link href="/register" className="cta-btn" style={{ justifyContent: "center" }}>Criar conta grátis</Link>
        </div>}
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 100, paddingBottom: 60, background: "radial-gradient(ellipse at 30% 20%, rgba(59,95,229,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(94,79,229,0.04) 0%, transparent 60%)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", width: "100%" }}>
          <div className="hero-grid" style={{ display: "flex", alignItems: "center", gap: 60 }}>
            <div className="hero-text" style={{ flex: 1 }}>
              <FadeIn>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: B.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: B.accent }}>100% gratuito durante o lançamento</span>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 20 }}>
                  Check-in do Airbnb na portaria,<br /><span className="grad-text">no automático.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: B.muted, maxWidth: 500, marginBottom: 36 }}>
                  Coleta os dados dos hóspedes, organiza tudo e envia pra portaria pelo WhatsApp. Sem mensagem manual, sem dado faltando, sem hóspede preso na recepção.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="hero-ctas" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Link href="/register" className="cta-btn">Criar conta grátis →</Link>
                  <a href="#o-problema" className="cta-outline" style={{ padding: "14px 28px" }}>Entenda o problema</a>
                </div>
              </FadeIn>
              <FadeIn delay={0.4}><p style={{ fontSize: 13, color: "#A3A3A3", marginTop: 16 }}>Crie sua conta em 30 segundos. Sem cartão de crédito.</p></FadeIn>
            </div>
            <FadeIn delay={0.3}><PhoneMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* O PROBLEMA */}
      <section id="o-problema" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>O problema</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Você já faz tudo isso<br /><span style={{ color: "#DC2626" }}>na mão, toda reserva.</span></h2>
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.7, textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
              Quem hospeda pelo Airbnb em prédio com portaria sabe: cada reserva exige uma série de mensagens manuais no WhatsApp e no chat — sem processo, sem padronização, sem controle nenhum.
            </p>
          </FadeIn>

          <div className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {[
              { icon: "💬", title: "Pedir dados pelo chat do Airbnb", desc: "\"Me manda o nome completo e CPF de todos?\" — toda reserva a mesma conversa. Cada hóspede responde de um jeito, falta dado, você precisa cobrar de novo." },
              { icon: "📱", title: "Repassar tudo pro porteiro no WhatsApp", desc: "Você copia nome, datas, número de hóspedes e manda pro porteiro. Manualmente. Se esqueceu a placa do carro ou o RG, precisa mandar outra mensagem." },
              { icon: "❓", title: "Sem saber o que já foi feito", desc: "Qual hóspede já mandou os dados? A portaria já foi avisada da reserva de amanhã? Com várias reservas ao mesmo tempo, você perde o controle." },
              { icon: "😰", title: "Hóspede chega e portaria não sabe", desc: "O porteiro trocou de turno, a mensagem se perdeu no WhatsApp, ou você esqueceu de avisar. Resultado: hóspede esperando, e você resolvendo por telefone." },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{ background: "#FEF2F2", borderRadius: 16, padding: "28px 24px", border: "1px solid #FECACA" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#991B1B", letterSpacing: "-0.01em", marginBottom: 8 }}>{p.title}</h4>
                  <p style={{ fontSize: 14, color: "#B91C1C", lineHeight: 1.7, opacity: 0.8 }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div style={{ textAlign: "center", marginTop: 48, padding: "28px 32px", background: B.light, borderRadius: 16, border: "1px solid #E5E5E5" }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: B.dark, lineHeight: 1.5, marginBottom: 4 }}>E se existisse um processo que fizesse tudo isso por você?</p>
              <p style={{ fontSize: 15, color: B.muted }}>Coleta de dados padronizada, envio automático pra portaria, e visibilidade total de cada reserva.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* COMO FUNCIONA (A SOLUÇÃO) */}
      <section id="como-funciona" style={{ padding: "100px 24px", background: "radial-gradient(ellipse at 50% 0%, rgba(59,95,229,0.06) 0%, transparent 50%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>A solução</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>O AirCheck cria o processo<br /><span className="grad-text">que você nunca teve.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 14, maxWidth: 580, margin: "14px auto 0", lineHeight: 1.7 }}>Padroniza a coleta de dados, organiza tudo por reserva e entrega pra portaria. Você configura uma vez — depois, cada reserva segue o fluxo sozinha.</p>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {[
              { step: "01", icon: "📧", title: "Reserva entra no sistema", desc: "O email de confirmação do Airbnb é encaminhado pro AirCheck. O sistema lê e cria a reserva automaticamente — nome do hóspede, datas, número de pessoas, código da reserva." },
              { step: "02", icon: "📱", title: "Hóspede preenche um formulário padrão", desc: "No chat do Airbnb, o hóspede recebe automaticamente um link. Ele preenche nome, CPF, data de nascimento e tira foto do documento. Tudo padronizado, sem vai-e-volta." },
              { step: "03", icon: "✅", title: "Portaria recebe tudo no WhatsApp", desc: "Com um toque, você envia a mensagem completa pro WhatsApp da portaria: nomes, documentos, datas, unidade, vaga. Pronto, a portaria já sabe quem vai chegar." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div style={{ background: B.light, borderRadius: 20, padding: "36px 28px", height: "100%", border: "1px solid #E5E5E5" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: B.primary, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Passo {s.step}</div>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: B.muted, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO WHATSAPP */}
      <section style={{ padding: "80px 24px", background: "radial-gradient(ellipse at 50% 50%, rgba(59,95,229,0.04) 0%, transparent 70%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <FadeIn>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Antes vs depois</div>
                <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>De mensagens soltas<br />pra <span className="grad-text">um envio completo.</span></h2>
                <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.7, marginBottom: 24 }}>Antes, você mandava &ldquo;nome: João, CPF: 123...&rdquo; no WhatsApp, sem padrão, faltando dado, sem foto de documento. Agora, a portaria recebe tudo de uma vez — organizado e completo.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Nomes, CPF e documentos de todos os hóspedes", "Foto do RG, CNH ou passaporte", "Unidade, vaga e datas formatadas", "Pronto pra portaria liberar a entrada"].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: B.accent, fontWeight: 700, flexShrink: 0 }}>✓</div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: B.dark }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}><WhatsAppMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em" }}>Processo, controle e <span className="grad-text">zero retrabalho.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 12 }}>Tudo que você fazia na mão, agora funciona de forma padronizada e automática.</p>
            </div>
          </FadeIn>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "📧", title: "Reserva lida automaticamente", desc: "O email de confirmação do Airbnb vira uma reserva organizada — sem você digitar nada." },
              { icon: "📋", title: "Coleta padronizada de dados", desc: "Formulário padrão com nome, CPF, data de nascimento e foto do documento. Acabou o \"me manda seus dados\" no chat." },
              { icon: "👁️", title: "Visibilidade de cada reserva", desc: "Saiba em tempo real quem já mandou os dados, quem está pendente, e quem já foi enviado pra portaria." },
              { icon: "💬", title: "WhatsApp completo pra portaria", desc: "Mensagem formatada com tudo que o porteiro precisa. Um toque e enviou — sem esquecer nenhum dado." },
              { icon: "👥", title: "Múltiplos hóspedes por reserva", desc: "Famílias e grupos preenchem dados individuais no mesmo formulário. Cada hóspede com seu documento." },
              { icon: "🏠", title: "Vários imóveis organizados", desc: "Cada apartamento com suas portarias cadastradas, unidade e vaga. Escala sem aumentar trabalho." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ background: B.light, borderRadius: 16, padding: "24px 22px", border: "1px solid #EBEBEB" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>{f.title}</h4>
                  <p style={{ fontSize: 13, color: B.muted, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* GRATUITO */}
      <section id="preco" style={{ padding: "80px 24px", background: "radial-gradient(ellipse at 50% 30%, rgba(59,95,229,0.05) 0%, transparent 60%)" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Lançamento</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em" }}>Totalmente <span className="grad-text">gratuito.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 12 }}>Estamos em fase de lançamento. Use tudo sem pagar nada.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", border: "2px solid #E5E5E5", position: "relative", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
              <div style={{ position: "absolute", top: 20, right: -30, background: B.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 40px", transform: "rotate(45deg)", letterSpacing: "0.04em" }}>GRÁTIS</div>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: B.muted }}>R$</span>
                  <span style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>0</span>
                </div>
                <div style={{ fontSize: 15, color: B.muted, fontWeight: 500, marginTop: 4 }}>durante o lançamento</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
                {[
                  { t: "Reservas ilimitadas", bold: true },
                  { t: "Imóveis ilimitados" },
                  { t: "Hóspedes ilimitados" },
                  { t: "WhatsApp para portaria" },
                  { t: "Formulário de check-in" },
                  { t: "Foto de documento" },
                  { t: "Suporte por email" },
                ].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: f.bold ? `linear-gradient(135deg, ${B.g1}, ${B.g2})` : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: f.bold ? "#fff" : B.accent, fontWeight: 700 }}>✓</div>
                    <span style={{ fontSize: 14, fontWeight: f.bold ? 700 : 500, color: f.bold ? B.dark : B.muted }}>{f.t}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" className="cta-btn" style={{ width: "100%", justifyContent: "center", padding: "18px 32px", fontSize: 17 }}>Criar conta grátis →</Link>
              <p style={{ textAlign: "center", fontSize: 12, color: "#A3A3A3", marginTop: 12 }}>Sem cartão de crédito. Sem compromisso.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn><h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 40 }}>Perguntas frequentes</h2></FadeIn>
          {[
            { q: "O que exatamente o AirCheck faz?", a: "O AirCheck automatiza o cadastro de hóspedes do Airbnb na portaria do seu condomínio. Quando uma reserva é confirmada, o sistema lê os dados do email, gera um formulário pro hóspede e entrega tudo formatado no WhatsApp do porteiro. Você não precisa ligar, digitar ou preencher nada." },
            { q: "Preciso ficar encaminhando email a cada reserva?", a: "Não. Você configura o encaminhamento automático uma vez no Outlook/Gmail, e todos os emails de confirmação do Airbnb são processados automaticamente." },
            { q: "Como o hóspede recebe o link do formulário?", a: "Você configura uma mensagem programada no Airbnb (uma vez só). A cada reserva confirmada, o Airbnb envia automaticamente o link personalizado no chat com o hóspede." },
            { q: "Funciona com qualquer condomínio?", a: "Sim. O AirCheck envia os dados via WhatsApp — se o porteiro tem WhatsApp, funciona. Você cadastra o telefone da portaria e pronto." },
            { q: "O AirCheck é gratuito mesmo?", a: "Sim. Estamos em fase de lançamento e a ferramenta é 100% gratuita. No futuro, podemos implementar planos pagos, mas quem entrar agora será avisado com antecedência." },
            { q: "Funciona com Booking.com?", a: "Por enquanto, apenas Airbnb. Estamos trabalhando para integrar outras plataformas em breve." },
          ].map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <details style={{ borderBottom: "1px solid #E5E5E5", padding: "20px 0", cursor: "pointer" }}>
                <summary style={{ fontSize: 16, fontWeight: 700, color: B.dark, listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {f.q}<span className="faq-icon" style={{ fontSize: 20, color: "#A3A3A3", fontWeight: 300, flexShrink: 0, marginLeft: 16, transition: "transform 0.2s" }}>+</span>
                </summary>
                <p style={{ fontSize: 14, color: B.muted, lineHeight: 1.7, marginTop: 12, paddingRight: 40 }}>{f.a}</p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "80px 24px", background: `linear-gradient(135deg, ${B.dark} 0%, #1a1a2e 100%)`, textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>Pare de improvisar o check-in<br />de cada reserva.</h2>
            <p style={{ fontSize: 16, color: "#A3A3A3", lineHeight: 1.7, marginBottom: 32 }}>Crie um processo automático pra coleta de dados e envio pra portaria. Simples, organizado, e gratuito.</p>
            <Link href="/register" className="cta-btn" style={{ fontSize: 18, padding: "18px 40px" }}>Criar conta grátis →</Link>
          </FadeIn>
        </div>
      </section>

      {/* CONTACT */}
      <ContactSection />

      {/* FOOTER */}
      <footer style={{ background: B.dark, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>AirCheck</span>
              </div>
              <p style={{ fontSize: 13, color: "#737373", lineHeight: 1.6, maxWidth: 280 }}>Check-in automatizado para anfitriões do Airbnb que hospedam em prédios com portaria.</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Produto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="#o-problema" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>O problema</a>
                <a href="#como-funciona" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Como funciona</a>
                <Link href="/blog" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Blog</Link>
                <Link href="/register" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Criar conta</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Contato</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="mailto:oi@aircheck.com.br" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>oi@aircheck.com.br</a>
                <a href="#contato" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Formulário de contato</a>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                <a href="https://instagram.com/useaircheck" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: "#737373", transition: "color 0.15s" }} onMouseOver={e=>(e.currentTarget.style.color="#fff")} onMouseOut={e=>(e.currentTarget.style.color="#737373")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="https://tiktok.com/@useaircheck" target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ color: "#737373", transition: "color 0.15s" }} onMouseOver={e=>(e.currentTarget.style.color="#fff")} onMouseOut={e=>(e.currentTarget.style.color="#737373")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.22V9.4a8.16 8.16 0 0 0 3.84.96V7.1a4.85 4.85 0 0 1-1-.41z"/></svg>
                </a>
                <a href="https://x.com/useaircheck" target="_blank" rel="noopener noreferrer" aria-label="X" style={{ color: "#737373", transition: "color 0.15s" }} onMouseOver={e=>(e.currentTarget.style.color="#fff")} onMouseOut={e=>(e.currentTarget.style.color="#737373")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, fontSize: 12, color: "#525252", textAlign: "center" }}>© {new Date().getFullYear()} AirCheck. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
