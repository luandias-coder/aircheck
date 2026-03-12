"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5" };

export default function PortariaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/portaria/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao entrar"); setLoading(false); return; }
      router.push("/portaria");
    } catch { setError("Erro de conexão"); setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit,sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", marginBottom: 16 }}>
            <svg width="64" height="64" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#plg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="plg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
            Air<span style={{ color: B.primary }}>Check</span>
          </div>
          <div style={{ fontSize: 13, color: "#737373", marginTop: 4 }}>Painel da Portaria</div>
        </div>

        {/* Card */}
        <form onSubmit={handleLogin} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 20, padding: "32px 28px" }}>
          {error && <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#EF4444" }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="portaria@condominio.com" required
              style={{ width: "100%", fontFamily: "Outfit", fontSize: 15, color: "#fff", padding: "12px 16px", border: "1px solid #333", borderRadius: 10, background: "#111", boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = B.primary} onBlur={e => e.target.style.borderColor = "#333"} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
              style={{ width: "100%", fontFamily: "Outfit", fontSize: 15, color: "#fff", padding: "12px 16px", border: "1px solid #333", borderRadius: 10, background: "#111", boxSizing: "border-box", outline: "none" }}
              onFocus={e => e.target.style.borderColor = B.primary} onBlur={e => e.target.style.borderColor = "#333"} />
          </div>

          <button type="submit" disabled={loading || !email || !password}
            style={{ width: "100%", fontFamily: "Outfit", fontSize: 15, fontWeight: 700, padding: 14, background: `linear-gradient(135deg, ${B.g1}, ${B.g2})`, color: "#fff", border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 16px rgba(59,95,229,0.3)" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#525252" }}>
          Acesso exclusivo para portarias de condomínios parceiros.
        </div>
      </div>
    </div>
  );
}
