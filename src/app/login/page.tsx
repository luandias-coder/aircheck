"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", shadow:"rgba(59,95,229,0.25)" };

function HouseLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="11" fill="url(#llg)" />
      <path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="llg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={B.g1} /><stop offset="1" stopColor={B.g2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"login" | "forgot" | "sent">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao entrar");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail || !forgotEmail.includes("@")) { setForgotError("Digite um email válido"); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) { setForgotError("Erro ao enviar. Tente novamente."); setForgotLoading(false); return; }
      setMode("sent");
    } catch {
      setForgotError("Erro de conexão");
      setForgotLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "Outfit", fontSize: 14, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, background: "#fff", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF9", fontFamily: "Outfit, sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", marginBottom: 16 }}><HouseLogo size={52} /></div>
          <h1 style={{ fontFamily: "Outfit", fontSize: 26, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            Air<span style={{ color: B.primary }}>Check</span>
          </h1>
          <p style={{ fontSize: 14, color: "#A3A3A3", margin: 0 }}>
            {mode === "login" && "Entre na sua conta"}
            {mode === "forgot" && "Recuperar senha"}
            {mode === "sent" && "Email enviado"}
          </p>
        </div>

        {mode === "login" && (
          <>
            <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{error}</div>}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={labelStyle}>Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required minLength={6} style={inputStyle} />
              </div>

              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <button type="button" onClick={() => { setMode("forgot"); setForgotEmail(email); setForgotError(""); }} style={{ fontFamily: "Outfit", fontSize: 12, fontWeight: 500, color: B.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Esqueceu a senha?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600,
                background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                boxShadow: `0 4px 14px ${B.shadow}`, opacity: loading ? 0.6 : 1,
              }}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
              Não tem conta? <a href="/register" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>Criar conta</a>
            </p>
          </>
        )}

        {mode === "forgot" && (
          <>
            <form onSubmit={handleForgot} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              {forgotError && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{forgotError}</div>}

              <p style={{ fontSize: 14, color: "#737373", lineHeight: 1.6, margin: "0 0 20px" }}>
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
              </div>

              <button type="submit" disabled={forgotLoading} style={{
                width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600,
                background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
                boxShadow: `0 4px 14px ${B.shadow}`, opacity: forgotLoading ? 0.6 : 1,
              }}>
                {forgotLoading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
              <button type="button" onClick={() => setMode("login")} style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 600, color: B.primary, background: "none", border: "none", cursor: "pointer" }}>
                ← Voltar para o login
              </button>
            </p>
          </>
        )}

        {mode === "sent" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <h2 style={{ fontFamily: "Outfit", fontSize: 18, fontWeight: 700, color: "#1A1A1A", margin: "0 0 8px" }}>Verifique seu email</h2>
              <p style={{ fontSize: 14, color: "#737373", margin: "0 0 4px", lineHeight: 1.6 }}>
                Se existe uma conta com o email <strong style={{ color: "#1A1A1A" }}>{forgotEmail}</strong>, enviamos um link para redefinir sua senha.
              </p>
              <p style={{ fontSize: 13, color: "#A3A3A3", margin: "12px 0 0" }}>
                Não recebeu? Verifique a pasta de spam.
              </p>
            </div>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
              <button type="button" onClick={() => setMode("login")} style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 600, color: B.primary, background: "none", border: "none", cursor: "pointer" }}>
                ← Voltar para o login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
