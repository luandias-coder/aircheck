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
  return (
    <div style={{ maxWidth: 320, margin: "0 auto" }}>
      <div style={{ background: "#E7DCCF", borderRadius: 16, padding: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <div style={{ background: "#075E54", borderRadius: "12px 12px 0 0", padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700 }}>P</div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Portaria Central</div><div style={{ fontSize: 10, color: "#ffffff90" }}>online</div></div>
        </div>
        <div style={{ background: "#DCF8C6", borderRadius: "0 12px 12px 12px", padding: "10px 12px", fontSize: 12, color: "#303030", lineHeight: 1.7, maxWidth: "90%", boxShadow: "0 1px 2px rgba(0,0,0,0.08)", fontFamily: "system-ui, sans-serif" }}>
          <div>🏠 <strong>CHECK-IN</strong></div>
          <div>📍 <strong>Studio Estação Curitiba</strong></div>
          <div style={{ height: 6 }} />
          <div>📅 Entrada: 28/02/2026 às 15:00</div>
          <div>📅 Saída: 02/03/2026 às 12:00</div>
          <div>🌙 Noites: 2</div>
          <div style={{ height: 6 }} />
          <div>👥 <strong>HÓSPEDES (2)</strong></div>
          <div style={{ height: 4 }} />
          <div>👤 <strong>João da Silva</strong></div>
          <div>&nbsp;&nbsp;&nbsp;🎂 01/01/1990</div>
          <div>&nbsp;&nbsp;&nbsp;📄 CPF: 000.000.000-00</div>
          <div style={{ height: 4 }} />
          <div>👤 <strong>Maria Souza</strong></div>
          <div>&nbsp;&nbsp;&nbsp;🎂 01/01/1990</div>
          <div>&nbsp;&nbsp;&nbsp;📄 CPF: 000.000.000-00</div>
          <div style={{ height: 6 }} />
          <div>🚗 Veículo: Onix Preto - XYZ0A00</div>
          <div style={{ height: 4 }} />
          <div style={{ fontStyle: "italic", color: "#667781", fontSize: 11 }}>✅ Enviado via AirCheck</div>
          <div style={{ textAlign: "right", fontSize: 10, color: "#667781", marginTop: 4 }}>14:32 ✓✓</div>
        </div>
      </div>
    </div>
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
            <a href="#como-funciona" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Como funciona</a>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
            <Link href="/login" className="cta-btn" style={{ padding: "10px 22px", fontSize: 14 }}>Criar conta grátis</Link>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "none", border: "none", cursor: "pointer", fontSize: 22 }}>{mobileMenu ? "✕" : "☰"}</button>
        </div>
        {mobileMenu && <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <a href="#como-funciona" onClick={() => setMobileMenu(false)} style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Como funciona</a>
          <Link href="/login" style={{ fontSize: 16, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
          <Link href="/login" className="cta-btn" style={{ justifyContent: "center" }}>Criar conta grátis</Link>
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
                <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 20 }}>
                  Check-in do Airbnb<br /><span className="grad-text">direto na portaria.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: B.muted, maxWidth: 480, marginBottom: 36 }}>
                  Encaminhe o email de confirmação. O hóspede preenche os dados. A portaria recebe tudo pronto no WhatsApp. Sem planilha, sem ligação, sem estresse.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="hero-ctas" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Link href="/login" className="cta-btn">Criar conta grátis →</Link>
                  <a href="#como-funciona" className="cta-outline" style={{ padding: "14px 28px" }}>Ver como funciona</a>
                </div>
              </FadeIn>
              <FadeIn delay={0.4}><p style={{ fontSize: 13, color: "#A3A3A3", marginTop: 16 }}>Crie sua conta em 30 segundos. Gratuito enquanto estivermos em lançamento.</p></FadeIn>
            </div>
            <FadeIn delay={0.3}><PhoneMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ background: B.dark, padding: "28px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
          {[{ n: 3, s: " etapas", d: "Do email à portaria" }, { n: 30, s: "seg", d: "Tempo do hóspede" }, { n: 0, s: " planilhas", d: "Zero trabalho manual" }].map((x, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}><Counter end={x.n} suffix={x.s} /></div>
              <div style={{ fontSize: 12, color: "#A3A3A3", marginTop: 4, fontWeight: 500 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Como funciona</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Três passos. <span className="grad-text">Zero trabalho.</span></h2>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {[
              { step: "01", icon: "📧", title: "Encaminhe o email", desc: "Recebeu a confirmação do Airbnb? Encaminhe para o seu email exclusivo AirCheck — ou configure o encaminhamento automático e nunca mais pense nisso." },
              { step: "02", icon: "📱", title: "Hóspede preenche o formulário", desc: "Envie o link ao hóspede pelo chat do Airbnb. Ele preenche um formulário com nome, CPF, data de nascimento e foto do documento." },
              { step: "03", icon: "✅", title: "Portaria recebe", desc: "Com um clique, envie todos os dados formatados direto no WhatsApp da portaria. Pronto, check-in resolvido." },
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
                <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Resultado final</div>
                <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>A portaria recebe<br /><span className="grad-text">tudo organizado.</span></h2>
                <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.7, marginBottom: 24 }}>Mensagem formatada, com todos os dados dos hóspedes, documentos, veículo. Direto no WhatsApp da portaria, pronto para liberar a entrada.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Dados de todos os hóspedes", "Documentos e CPF inclusos", "Informações do veículo", "Um clique para enviar"].map((t, i) => (
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
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em" }}>Tudo que você precisa.</h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 12 }}>Sem complicação. Sem funcionalidade que ninguém usa.</p>
            </div>
          </FadeIn>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "📧", title: "Email automático", desc: "Encaminhe e pronto. Nome, datas, código — tudo extraído." },
              { icon: "📋", title: "Formulário inteligente", desc: "O hóspede preenche o número exato de cards. CPF, RG, passaporte, foto do documento." },
              { icon: "💬", title: "WhatsApp direto", desc: "Mensagem formatada pronta pro porteiro. Um toque e enviou." },
              { icon: "🏠", title: "Multi-imóveis", desc: "Gerencie vários apartamentos, cada um com sua portaria." },
              { icon: "📸", title: "Foto do documento", desc: "Hóspede tira foto do RG ou CNH direto no celular." },
              { icon: "🔒", title: "Controle total", desc: "Formulário travado após envio. Só você pode reabrir." },
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
              <Link href="/login" className="cta-btn" style={{ width: "100%", justifyContent: "center", padding: "18px 32px", fontSize: 17 }}>Criar conta grátis →</Link>
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
            { q: "O AirCheck é gratuito mesmo?", a: "Sim. Estamos em fase de lançamento e a ferramenta é 100% gratuita. No futuro, podemos implementar planos pagos, mas quem entrar agora será avisado com antecedência de qualquer mudança." },
            { q: "Preciso instalar algum app?", a: "Não. O AirCheck é 100% web. Você acessa pelo navegador, e o hóspede também." },
            { q: "Funciona com quantos imóveis?", a: "Ilimitados. Cadastre quantos apartamentos quiser, cada um com sua portaria." },
            { q: "E se o hóspede errar os dados?", a: "Após o envio, só você (anfitrião) pode reabrir o formulário. Isso garante que os dados enviados à portaria estejam corretos." },
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
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>Chega de digitar dados<br />de hóspede na mão.</h2>
            <p style={{ fontSize: 16, color: "#A3A3A3", lineHeight: 1.7, marginBottom: 32 }}>Crie sua conta em 30 segundos. 100% gratuito durante o lançamento.</p>
            <Link href="/login" className="cta-btn" style={{ fontSize: 18, padding: "18px 40px" }}>Criar conta grátis →</Link>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: B.dark, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 24px 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>AirCheck</span>
              </div>
              <p style={{ fontSize: 13, color: "#737373", lineHeight: 1.6, maxWidth: 280 }}>Check-in digital para anfitriões do Airbnb. Do email de confirmação ao WhatsApp da portaria.</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Produto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="#como-funciona" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Como funciona</a>
                <Link href="/login" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Criar conta</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Contato</div>
              <span style={{ fontSize: 13, color: "#737373" }}>contato@aircheck.com.br</span>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, fontSize: 12, color: "#525252", textAlign: "center" }}>© {new Date().getFullYear()} AirCheck. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
