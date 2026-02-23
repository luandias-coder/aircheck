"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", shadow:"rgba(59,95,229,0.25)" };

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

function maskPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

const fieldLbl:React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "#737373", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
const fieldInput:React.CSSProperties = { width: "100%", fontFamily: "Outfit", fontSize: 16, padding: "12px 14px", border: "1px solid #E5E5E5", borderRadius: 10, background: "#fff", boxSizing: "border-box" };

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("As senhas não coincidem"); return; }
    if (password.length < 6) { setError("A senha deve ter no mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      const rawPhone = phone.replace(/\D/g,"");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone: rawPhone || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF9", fontFamily: "Outfit, sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", marginBottom: 16 }}><HouseLogo size={52} /></div>
          <h1 style={{ fontFamily: "Outfit", fontSize: 26, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
            Air<span style={{ color: B.primary }}>Check</span>
          </h1>
          <p style={{ fontSize: 14, color: "#A3A3A3", margin: 0 }}>Crie sua conta de anfitrião</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, padding: "28px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required enterKeyHint="next"
              style={fieldInput} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>WhatsApp / Telefone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" enterKeyHint="next"
              style={fieldInput} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required enterKeyHint="next"
              style={fieldInput} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={fieldLbl}>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} enterKeyHint="next"
              style={fieldInput} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={fieldLbl}>Confirmar senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required minLength={6} enterKeyHint="done"
              style={{ ...fieldInput, borderColor: confirmPassword && confirmPassword !== password ? "#FCA5A5" : "#E5E5E5" }} />
            {confirmPassword && confirmPassword !== password && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4 }}>As senhas não coincidem</div>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 14, fontFamily: "Outfit", fontSize: 15, fontWeight: 600,
            background: B.primary, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
            boxShadow: `0 4px 14px ${B.shadow}`, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
          Já tem conta? <a href="/login" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>Entrar</a>
        </p>
      </div>
    </div>
  );
}
