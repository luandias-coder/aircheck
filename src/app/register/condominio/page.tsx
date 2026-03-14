"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC" };

export default function RegisterCondominio() {
  const router = useRouter();
  const [condoName, setCondoName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addressRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Google Maps Autocomplete
  useEffect(() => {
    const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!MAPS_KEY || !addressRef.current) return;
    const init = () => {
      if (!addressRef.current || autocompleteRef.current) return;
      const ac = new (window as any).google.maps.places.Autocomplete(addressRef.current, {
        types: ["address"], componentRestrictions: { country: "br" },
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place?.formatted_address) setAddress(place.formatted_address);
      });
      autocompleteRef.current = ac;
    };
    if ((window as any).google?.maps?.places) { init(); return; }
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=pt-BR`;
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }
  }, []);

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!condoName.trim() || !address.trim() || !contactName.trim() || !email || !phone || !password) {
      setError("Preencha todos os campos obrigatórios"); return;
    }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/portaria/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condoName: condoName.trim(),
          address: address.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.replace(/\D/g, ""),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao cadastrar"); setLoading(false); return; }
      router.push("/portaria/onboarding");
    } catch { setError("Erro de conexão"); setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "Outfit", fontSize: 15, color: "#1A1A1A", padding: "12px 16px", border: "1px solid #E5E5E5", borderRadius: 10, background: "#fff", boxSizing: "border-box", outline: "none" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF9", fontFamily: "Outfit,sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 40 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", marginBottom: 12 }}>
            <svg width="52" height="52" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#rcg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="rcg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1A1A1A", letterSpacing: "-0.03em", margin: "0 0 4px" }}>
            Cadastre seu condomínio
          </h1>
          <p style={{ fontSize: 14, color: "#A3A3A3", margin: 0 }}>Tenha um painel digital de check-in para a portaria</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>{error}</div>}

          {/* Condo section */}
          <div style={{ fontSize: 10, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>🏢 Dados do condomínio</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome do condomínio *</label>
            <input value={condoName} onChange={e => setCondoName(e.target.value)} placeholder="Ex: Edifício Aurora Residence" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Endereço *</label>
            <input ref={addressRef} value={address} onChange={e => setAddress(e.target.value)} placeholder="Comece a digitar o endereço..." required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Telefone / WhatsApp do condomínio *</label>
            <input value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" required style={inputStyle} />
          </div>

          {/* Admin section */}
          <div style={{ borderTop: "1px solid #F0F0F0", paddingTop: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>👤 Seus dados (administrador)</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Seu nome completo *</label>
            <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nome do síndico ou responsável" required style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Seu email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" required style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Senha *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 6 caracteres" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirmar senha *</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? "#DC2626" : "#E5E5E5" }} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", fontFamily: "Outfit", fontSize: 15, fontWeight: 700, padding: 14,
            background: `linear-gradient(135deg, ${B.g1}, ${B.g2})`, color: "#fff", border: "none",
            borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
            boxShadow: "0 4px 16px rgba(59,95,229,0.3)",
          }}>
            {loading ? "Cadastrando..." : "Cadastrar condomínio"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A3A3A3" }}>
          Já tem cadastro? <Link href="/portaria/login" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>Entrar no painel</Link>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: "#A3A3A3" }}>
          É anfitrião? <Link href="/register" style={{ color: B.primary, fontWeight: 600, textDecoration: "none" }}>Criar conta de anfitrião</Link>
        </div>
      </div>
    </div>
  );
}
