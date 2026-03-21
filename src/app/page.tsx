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
  return <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>{children}</div>;
}

// ─── FORM MOCKUP ────────────────────────────────────────────────
function FormMockup() {
  return (
    <div style={{ maxWidth: 260, margin: "0 auto" }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #E5E5E5" }}>
        <div style={{ background: "linear-gradient(135deg,#1A1A1A,#2D2D2D)", padding: "18px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fm)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fm" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
            <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Check-in digital</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Studio Aurora Centro</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>15/03 → 18/03 · 3 noites</div>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nome completo</div><div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>Maria Souza</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>Nascimento</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>01/01/1990</div></div>
              <div style={{ background: "#FAFAF9", borderRadius: 6, padding: "7px 10px", border: "1px solid #E5E5E5" }}><div style={{ fontSize: 7, color: "#A3A3A3", fontWeight: 600, textTransform: "uppercase" }}>CPF</div><div style={{ fontSize: 10, fontWeight: 600, color: "#1A1A1A", marginTop: 1 }}>000.000.000-00</div></div>
            </div>
          </div>
        </div>
        <div style={{ padding: "8px 12px 14px" }}>
          <div style={{ background: "linear-gradient(135deg,#1A1A1A,#333)", color: "#fff", borderRadius: 12, padding: "11px 0", textAlign: "center", fontSize: 12, fontWeight: 700 }}>Enviar dados para check-in</div>
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
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>P</div>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Portaria Central</div><div style={{ fontSize: 10, color: "#93C5B5" }}>online</div></div>
        </div>
        <div style={{ background: "#DCF8C6", borderRadius: "0 10px 10px 10px", padding: "10px 12px", fontSize: 11, color: "#303030", lineHeight: 1.6, fontFamily: "system-ui" }}>
          🏠 <strong>Studio Aurora Centro</strong><br/>
          📍 Unid. 501 · Vaga G1-25<br/>
          <span style={{color:"#999"}}>--------------------------------------</span><br/>
          📅 <strong>Check-in:</strong> 15/03 às 15:00<br/>
          📅 <strong>Check-out:</strong> 18/03 às 12:00<br/>
          🌙 3 noites · 2 hóspedes<br/>
          <span style={{color:"#999"}}>--------------------------------------</span><br/>
          <br/>
          👤 <strong>Maria Souza</strong><br/>
          📅 Nasc: 01/01/1990<br/>
          🪪 CPF: 000.000.000-00<br/>
          🪪 RG: 12.345.678-9<br/>
          <br/>
          👤 <strong>João Souza</strong><br/>
          📅 Nasc: 15/06/1988<br/>
          🪪 CPF: 111.222.333-44<br/>
          <span style={{color:"#999"}}>--------------------------------------</span><br/>
          🚗 <strong>Veículo:</strong> HB20 Prata · ABC-1D23<br/>
          <br/>
          ✅ Enviado via AirCheck
        </div>
        <div style={{ textAlign: "right", fontSize: 10, color: "#999", marginTop: 4 }}>14:32 ✓✓</div>
      </div>
    </div>
  );
}

// ─── PORTARIA PANEL MOCKUP ──────────────────────────────────────
function PortariaMockup() {
  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #E5E5E5" }}>
        <div style={{ background: "#FAFAF9", borderBottom: "1px solid #E5E5E5", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#pm)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="pm" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>Aurora Residence</span>
          </div>
          <span style={{ fontSize: 10, color: "#A3A3A3" }}>Painel da Portaria</span>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[{ l: "Hoje", v: "3", c: B.primary }, { l: "Pendentes", v: "1", c: "#D97706" }, { l: "Unidades", v: "5" }].map((s, i) => (
              <div key={i} style={{ background: "#FAFAF9", border: "1px solid #E5E5E5", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 8, color: "#A3A3A3", textTransform: "uppercase", fontWeight: 600 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c || "#1A1A1A" }}>{s.v}</div>
              </div>
            ))}
          </div>
          {[
            { name: "Maria Souza", unit: "501", status: "Pronto", sc: "#059669", sb: "#ECFDF5", icon: "✅" },
            { name: "André Rocha", unit: "304", status: "Pronto", sc: "#059669", sb: "#ECFDF5", icon: "✅" },
            { name: "Carlos Lima", unit: "802", status: "Aguardando", sc: "#D97706", sb: "#FFFBEB", icon: "⏳" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 2 ? "1px solid #F0F0F0" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EBF0FF", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontSize: 6, color: "#A3A3A3", fontWeight: 600 }}>UNID</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: B.primary, lineHeight: 1 }}>{c.unit}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{c.name}</div>
                <div style={{ fontSize: 10, color: "#A3A3A3" }}>Hoje · 15:00</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: c.sc, background: c.sb, padding: "2px 6px", borderRadius: 6 }}>{c.icon} {c.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT SECTION ────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).catch(() => {});
    setSending(false); setSent(true);
  };
  return (
    <section id="contato" style={{ padding: "80px 24px", background: "#FAFAF9" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <FadeIn>
          <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 8 }}>Fale conosco</h2>
          <p style={{ fontSize: 15, color: B.muted, textAlign: "center", marginBottom: 32 }}>Dúvida, sugestão ou parceria? Manda pra gente.</p>
        </FadeIn>
        <FadeIn delay={0.1}>
          {sent ? (
            <div style={{ background: "#ECFDF5", border: "1px solid #BBF7D0", borderRadius: 16, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: B.accent }}>Mensagem enviada! Respondemos em até 24h.</p>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Seu nome" style={{ fontFamily: "Outfit", fontSize: 14, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, outline: "none" }} />
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" type="email" style={{ fontFamily: "Outfit", fontSize: 14, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, outline: "none" }} />
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Sua mensagem" rows={4} style={{ fontFamily: "Outfit", fontSize: 14, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, outline: "none", resize: "vertical" }} />
              <button onClick={submit} disabled={sending || !form.name || !form.email || !form.message} style={{ fontFamily: "Outfit", fontSize: 15, fontWeight: 700, padding: "14px 24px", background: `linear-gradient(135deg, ${B.g1}, ${B.g2})`, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
                {sending ? "Enviando..." : "Enviar mensagem"}
              </button>
            </div>
          )}
        </FadeIn>
      </div>
    </section>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <div style={{ fontFamily: "Outfit, sans-serif", color: B.dark, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .grad-text { background: linear-gradient(135deg, ${B.g1}, ${B.g2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; background: linear-gradient(135deg, ${B.g1}, ${B.g2}); color: #fff; border-radius: 14px; font-family: 'Outfit'; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.3s; box-shadow: 0 4px 16px rgba(59,95,229,0.3); border: none; }
        .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,95,229,0.4); }
        .cta-outline { display: inline-flex; align-items: center; gap: 8px; padding: 16px 32px; background: transparent; color: ${B.primary}; border: 2px solid ${B.primary}; border-radius: 14px; font-family: 'Outfit'; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s; }
        .cta-outline:hover { background: ${B.primary}10; }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span.faq-icon { transform: rotate(45deg); }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; text-align: center !important; }
          .hero-text h1 { font-size: 34px !important; }
          .hero-ctas { justify-content: center !important; flex-wrap: wrap !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .nav-links { display: none !important; }
          .mobile-toggle { display: flex !important; }
          .demo-grid { grid-template-columns: 1fr !important; }
          .duo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,250,249,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#ng)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="ng" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>Air<span style={{ color: B.primary }}>Check</span></span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#anfitrioes" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Anfitriões</a>
            <a href="#condominios" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Condomínios</a>
            <Link href="/blog" style={{ fontSize: 14, fontWeight: 500, color: B.muted, textDecoration: "none" }}>Blog</Link>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
            <a href="#preco" className="cta-btn" style={{ padding: "10px 22px", fontSize: 13 }}>Criar conta</a>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} style={{ display: "none", background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>{mobileMenu ? "✕" : "☰"}</button>
        </div>
        {mobileMenu && <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <a href="#anfitrioes" onClick={() => setMobileMenu(false)} style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Anfitriões</a>
          <a href="#condominios" onClick={() => setMobileMenu(false)} style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Condomínios</a>
          <Link href="/blog" style={{ fontSize: 16, fontWeight: 500, color: B.dark, textDecoration: "none" }}>Blog</Link>
          <Link href="/login" style={{ fontSize: 16, fontWeight: 600, color: B.primary, textDecoration: "none" }}>Entrar</Link>
          <a href="#preco" onClick={() => setMobileMenu(false)} className="cta-btn" style={{ justifyContent: "center" }}>Criar conta</a>
        </div>}
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════════════════ */}
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
                <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 20 }}>
                  Check-in de hóspedes resolvido —<br />do Airbnb à portaria,<br /><span className="grad-text">sem dor de cabeça.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p style={{ fontSize: 18, lineHeight: 1.7, color: B.muted, maxWidth: 520, marginBottom: 36 }}>
                  Pra anfitriões que não querem mais ligar pra portaria. E pra condomínios que querem saber quem entra.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="hero-ctas" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Link href="/register" className="cta-btn" style={{ fontSize: 17 }}>Sou anfitrião →</Link>
                  <Link href="/register/condominio" className="cta-outline" style={{ fontSize: 17 }}>Sou condomínio</Link>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.4}><FormMockup /></FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DOR DO HOST */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="anfitrioes" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Para anfitriões</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Cansou de improvisar o check-in<br /><span className="grad-text">a cada nova reserva?</span></h2>
            </div>
          </FadeIn>
          <div className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "📲", title: "Mensagem manual pra portaria", desc: "A cada reserva, você monta a mensagem no WhatsApp. Nome, CPF, data, unidade... Manualmente. Se esqueceu algo, manda outra mensagem." },
              { icon: "❓", title: "Sem saber o que já foi feito", desc: "Qual hóspede já mandou os dados? A portaria já foi avisada? Com várias reservas ao mesmo tempo, você perde o controle." },
              { icon: "😰", title: "Hóspede chega e ninguém sabe", desc: "O porteiro trocou de turno, a mensagem se perdeu, ou você esqueceu de avisar. Resultado: hóspede esperando e você resolvendo por telefone." },
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COMO FUNCIONA - HOST */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "radial-gradient(ellipse at 50% 0%, rgba(59,95,229,0.06) 0%, transparent 50%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>A solução para anfitriões</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>O AirCheck cria o processo<br /><span className="grad-text">que você nunca teve.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 14, maxWidth: 580, margin: "14px auto 0", lineHeight: 1.7 }}>Você configura uma vez — depois, cada reserva segue o fluxo sozinha.</p>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {[
              { step: "01", icon: "📧", title: "Reserva entra no sistema", desc: "O email de confirmação do Airbnb é encaminhado pro AirCheck. O sistema lê e cria a reserva automaticamente — nome do hóspede, datas, código da reserva." },
              { step: "02", icon: "📱", title: "Hóspede preenche um formulário", desc: "No chat do Airbnb, o hóspede recebe automaticamente um link. Ele preenche nome, CPF e data de nascimento — tudo pelo celular em menos de 1 minuto." },
              { step: "03", icon: "✅", title: "Portaria recebe tudo pronto", desc: "Com um toque, você envia a mensagem completa pro WhatsApp da portaria. Ou, se o prédio usa o AirCheck, os dados chegam automaticamente no painel." },
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
          <FadeIn delay={0.5}>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/register" className="cta-btn" style={{ fontSize: 16 }}>Criar conta de anfitrião →</Link>
            </div>
          </FadeIn>
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
                <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.7, marginBottom: 24 }}>Agora, a portaria recebe tudo de uma vez — organizado e completo.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Nome, CPF e dados de cada hóspede", "Unidade, vaga de garagem e datas", "Placa e modelo do veículo", "Pronto pra portaria liberar a entrada"].map((t, i) => (
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DOR DO CONDOMÍNIO */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section id="condominios" style={{ padding: "100px 24px", background: `linear-gradient(135deg, ${B.dark} 0%, #1a1a2e 100%)` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12, opacity: 0.6 }}>Para condomínios</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fff" }}>A portaria merece<br /><span className="grad-text">mais que um papel e caneta.</span></h2>
              <p style={{ fontSize: 16, color: "#737373", marginTop: 14, maxWidth: 580, margin: "14px auto 0" }}>Cada anfitrião manda dados de um jeito diferente. Na troca de turno, a informação se perde. Se der problema, não tem registro.</p>
            </div>
          </FadeIn>
          <div className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {[
              { icon: "📝", title: "Dados incompletos e sem padrão", desc: "Um host manda nome pelo WhatsApp, outro manda foto de RG, outro não manda nada. Cada um tem seu jeitinho — e o porteiro que se vire." },
              { icon: "🔄", title: "Troca de turno = informação perdida", desc: "O porteiro da manhã avisou quem chega hoje, mas o da noite não sabe. Caderninho, papel solto, mensagem perdida." },
              { icon: "⚠️", title: "Sem registro digital", desc: "Se acontece algum incidente, quem entrou quando? Que documento apresentou? Sem sistema, não tem como saber." },
              { icon: "📱", title: "Depende do anfitrião avisar", desc: "Se o host esquece de mandar os dados, a portaria descobre na hora que o hóspede chega. Sem tempo pra verificar nada." },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "28px 24px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#E5E5E5", letterSpacing: "-0.01em", marginBottom: 8 }}>{p.title}</h4>
                  <p style={{ fontSize: 14, color: "#737373", lineHeight: 1.7 }}>{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COMO FUNCIONA - CONDOMÍNIO */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>A solução para condomínios</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Um painel digital de check-in<br /><span className="grad-text">pra cada portaria.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 14, maxWidth: 580, margin: "14px auto 0", lineHeight: 1.7 }}>Cadastro em 2 minutos. Os anfitriões conectam os imóveis e os dados chegam automaticamente.</p>
            </div>
          </FadeIn>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }}>
            {[
              { step: "01", icon: "🏢", title: "Cadastre o condomínio", desc: "Preencha os dados do prédio e receba um código único. Esse código conecta os anfitriões ao condomínio." },
              { step: "02", icon: "🔗", title: "Anfitriões conectam imóveis", desc: "Cada host digita o código no AirCheck e vincula o apartamento. Os dados passam a fluir automaticamente pro painel." },
              { step: "03", icon: "📋", title: "Porteiro vê tudo num painel", desc: "Check-ins do dia, dados dos hóspedes, documentos e veículos. Organizado, filtrado por unidade e sempre atualizado." },
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
          <FadeIn delay={0.5}>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/register/condominio" className="cta-btn" style={{ fontSize: 16 }}>Cadastrar condomínio →</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* DEMO PAINEL PORTARIA */}
      <section style={{ padding: "80px 24px", background: "radial-gradient(ellipse at 50% 50%, rgba(59,95,229,0.04) 0%, transparent 70%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <FadeIn delay={0.1}><PortariaMockup /></FadeIn>
            <FadeIn>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Painel da portaria</div>
                <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>Tudo que o porteiro precisa,<br /><span className="grad-text">numa tela só.</span></h2>
                <p style={{ fontSize: 16, color: B.muted, lineHeight: 1.7, marginBottom: 24 }}>Sem depender do WhatsApp do anfitrião. Dados padronizados, organizados e acessíveis a qualquer turno.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {["Check-ins do dia com todos os dados", "Nome, CPF e RG de cada hóspede", "Placa do veículo e vaga de garagem", "Filtros por unidade e por status", "Registro digital permanente"].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: B.accent, fontWeight: 700, flexShrink: 0 }}>✓</div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: B.dark }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em" }}>Processo, controle e <span className="grad-text">zero retrabalho.</span></h2>
            </div>
          </FadeIn>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              { icon: "📧", title: "Reserva lida automaticamente", desc: "O email de confirmação do Airbnb vira uma reserva organizada — sem você digitar nada." },
              { icon: "📋", title: "Coleta padronizada de dados", desc: "Formulário padrão com nome, CPF e data de nascimento. Acabou o vai-e-volta." },
              { icon: "👁️", title: "Visibilidade total", desc: "Saiba em tempo real quem já mandou os dados, quem está pendente, e o que já foi pra portaria." },
              { icon: "💬", title: "WhatsApp ou painel digital", desc: "Envie via WhatsApp com um toque. Ou, em prédios parceiros, os dados chegam automaticamente no painel." },
              { icon: "👥", title: "Múltiplos hóspedes", desc: "Famílias e grupos preenchem dados individuais. Cada hóspede com seu documento e CPF." },
              { icon: "🏢", title: "Painel pra portaria", desc: "Condomínios parceiros têm dashboard próprio com check-ins, filtros e gestão de equipe." },
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
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>Lançamento</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em" }}>Totalmente <span className="grad-text">gratuito.</span></h2>
              <p style={{ fontSize: 16, color: B.muted, marginTop: 12 }}>Estamos em fase de lançamento. Use tudo sem pagar nada.</p>
            </div>
          </FadeIn>
          <div className="duo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <FadeIn delay={0.1}>
              <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", border: "2px solid #E5E5E5", height: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FFF7ED", border: "1px solid #FDBA74", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏠</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Anfitrião</div>
                    <div style={{ fontSize: 12, color: B.muted }}>Para quem aluga pelo Airbnb</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: B.muted }}>R$</span>
                  <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>0</span>
                </div>
                <div style={{ fontSize: 14, color: B.muted, marginBottom: 24 }}>durante o lançamento</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {["Reservas ilimitadas", "Imóveis ilimitados", "Formulário + foto de documento", "WhatsApp pra portaria", "Suporte por email"].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: B.accent, fontWeight: 700 }}>✓</div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: B.muted }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className="cta-btn" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15 }}>Criar conta de anfitrião →</Link>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div style={{ background: "#fff", borderRadius: 24, padding: "36px 28px", border: `2px solid ${B.primary}`, height: "100%", boxShadow: `0 8px 40px rgba(59,95,229,0.12)`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 20, right: -30, background: B.primary, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 36px", transform: "rotate(45deg)" }}>NOVO</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: B.light, border: `1px solid ${B.muted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏢</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Condomínio</div>
                    <div style={{ fontSize: 12, color: B.muted }}>Para síndicos e administradoras</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: B.muted }}>R$</span>
                  <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>0</span>
                </div>
                <div style={{ fontSize: 14, color: B.muted, marginBottom: 24 }}>piloto gratuito</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                  {["Painel digital pra portaria", "Gestão de equipe (porteiros)", "Dados padronizados", "Filtros por unidade e status", "Registro digital permanente"].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: B.primary, fontWeight: 700 }}>✓</div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: B.muted }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register/condominio" className="cta-btn" style={{ width: "100%", justifyContent: "center", padding: "14px 24px", fontSize: 15 }}>Cadastrar condomínio →</Link>
              </div>
            </FadeIn>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "#A3A3A3", marginTop: 16 }}>Sem cartão de crédito. Sem compromisso.</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <FadeIn><h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 40 }}>Perguntas frequentes</h2></FadeIn>
          {[
            { q: "O que exatamente o AirCheck faz?", a: "O AirCheck automatiza o cadastro de hóspedes do Airbnb na portaria do seu condomínio. Quando uma reserva é confirmada, o sistema lê os dados do email, gera um formulário pro hóspede e entrega tudo formatado — via WhatsApp ou pelo painel digital da portaria." },
            { q: "Preciso ficar encaminhando email a cada reserva?", a: "Não. Você configura o encaminhamento automático uma vez no Outlook/Gmail, e todos os emails de confirmação do Airbnb são processados automaticamente." },
            { q: "Como o hóspede recebe o link do formulário?", a: "Você configura uma mensagem programada no Airbnb (uma vez só). A cada reserva confirmada, o Airbnb envia automaticamente o link personalizado no chat com o hóspede." },
            { q: "Sou síndico. Como funciona pra condomínios?", a: "Você cadastra o condomínio em 2 minutos e recebe um código. Passa esse código pros anfitriões que hospedam no prédio — eles conectam os imóveis e os dados passam a chegar automaticamente no painel da portaria, sem depender de WhatsApp." },
            { q: "O porteiro precisa ser bom com tecnologia?", a: "Não. O painel da portaria é simples e direto: lista de check-ins do dia, dados de cada hóspede e botão pra ver o documento. Qualquer pessoa consegue usar." },
            { q: "Funciona com qualquer condomínio?", a: "Sim. Se o prédio tiver portaria, funciona. O anfitrião pode usar sozinho (enviando via WhatsApp) ou conectado a um condomínio parceiro (dados no painel)." },
            { q: "É gratuito mesmo?", a: "Sim. Estamos em fase de lançamento e tudo é 100% gratuito — tanto pra anfitriões quanto pra condomínios. Quem entrar agora será avisado com antecedência de qualquer mudança." },
            { q: "Funciona com Booking.com?", a: "Por enquanto, apenas Airbnb. Estamos trabalhando para integrar outras plataformas em breve." },
          ].map((f, i) => (
            <FadeIn key={i} delay={i * 0.06}>
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
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>O check-in na portaria<br />não precisa ser um problema.</h2>
            <p style={{ fontSize: 16, color: "#A3A3A3", lineHeight: 1.7, marginBottom: 32 }}>Automatize a coleta de dados e o envio pra portaria. Simples, organizado e gratuito.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" className="cta-btn" style={{ fontSize: 17 }}>Sou anfitrião →</Link>
              <Link href="/register/condominio" className="cta-outline" style={{ fontSize: 17, borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}>Sou condomínio</Link>
            </div>
          </FadeIn>
        </div>
      </section>

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
              <p style={{ fontSize: 13, color: "#737373", lineHeight: 1.6, maxWidth: 280 }}>Check-in automatizado para anfitriões do Airbnb e portarias de condomínios.</p>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <a href="https://instagram.com/useaircheck" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#737373", fontSize: 14, textDecoration: "none" }}>📷</a>
                <a href="https://tiktok.com/@aircheck.br" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#737373", fontSize: 14, textDecoration: "none" }}>🎵</a>
                <a href="https://x.com/aircheckbr" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#737373", fontSize: 14, textDecoration: "none" }}>𝕏</a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Produto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/register" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Criar conta (anfitrião)</Link>
                <Link href="/register/condominio" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Cadastrar condomínio</Link>
                <Link href="/login" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Entrar</Link>
                <Link href="/blog" style={{ fontSize: 13, color: "#737373", textDecoration: "none" }}>Blog</Link>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Contato</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#737373" }}>oi@aircheck.com.br</span>
                <span style={{ fontSize: 13, color: "#737373" }}>Curitiba, PR</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#525252" }}>© {new Date().getFullYear()} AirCheck. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
