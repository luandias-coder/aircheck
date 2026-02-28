"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", shadow:"rgba(59,95,229,0.25)" };

function HouseLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="url(#rlg)" />
      <path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="rlg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={B.g1} /><stop offset="1" stopColor={B.g2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirm) { setError("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao redefinir");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "Outfit", fontSize: 14, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, background: "#fff", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF9", fontFamily: "Outfit, sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", marginBottom: 16 }}><HouseLogo size={52} /></div>
          <h1 style={{ fontFamily: "Outfit", fontSize: 26, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            Air<span style={{ color: B.primary }}>Check</span>
          </h1>
          <p style={{ fontSize: 14, color: "#A3A3A3", margin: 0 }}>Criar nova senha</p>
        </div>

        {done ? (
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 8px" }}>Senha redefinida!</h2>
            <p style={{ fontSize: 14, color: "#737373", margin: "0 0 20px", lineHeight: 1.6 }}>Sua nova senha foi salva. Agora é só entrar.</p>
            <button onClick={() => router.push("/login")} style={{
              width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600,
              background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
              boxShadow: `0 4px 14px ${B.shadow}`,
            }}>Ir para o login →</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{error}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nova senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirmar senha</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Digite novamente" required minLength={6} style={inputStyle} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600,
              background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
              boxShadow: `0 4px 14px ${B.shadow}`, opacity: loading ? 0.6 : 1,
            }}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
          <a href="/login" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>← Voltar para o login</a>
        </p>
      </div>
    </div>
  );
}
