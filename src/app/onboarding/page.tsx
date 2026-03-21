"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", accent:"#059669", dark:"#0F0F0F" };

function Logo(){return<div style={{display:"flex",alignItems:"center",gap:8}}><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#og)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="og" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg><span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.03em",fontFamily:"Outfit"}}>Air<span style={{background:`linear-gradient(135deg,${B.g1},${B.g2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Check</span></span></div>}

function maskPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

interface Reservation { id:string; guestFullName:string; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; formToken:string; status:string; airbnbThreadUrl:string|null; property:{id:string;name:string;unitNumber:string|null;parkingSpot:string|null;doormanPhones:Array<{id:string;phone:string;name:string|null;label:string|null}>}; guests:any[] }

const cardStyle:React.CSSProperties = {background:"#fff",border:"1px solid #E5E5E5",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",maxWidth:520,width:"100%"};
const inputStyle:React.CSSProperties = {width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box" as const,outline:"none"};
const labelStyle:React.CSSProperties = {fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6};
const btnStyle=(secondary?:boolean):React.CSSProperties=>({fontFamily:"Outfit",fontSize:15,fontWeight:700,padding:"14px 32px",background:secondary?"transparent":`linear-gradient(135deg,${B.g1},${B.g2})`,color:secondary?B.primary:"#fff",border:secondary?`2px solid ${B.primary}`:"none",borderRadius:12,cursor:"pointer",boxShadow:secondary?"none":"0 4px 16px rgba(59,95,229,0.3)"});

function StepBadge({n}:{n:number}){return(
  <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
    <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{n}</div>
    <span style={{fontSize:12,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.08em"}}>Passo {n} de 7</span>
  </div>
)}

function BackBtn({onClick}:{onClick:()=>void}){return(
  <button onClick={onClick} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>
    ← Voltar
  </button>
)}

// ─── EMAIL PROVIDER DETECTION ───────────────────────────
type EmailProvider = {
  id: string;
  name: string;
  icon: string;
  color: string;
  deeplink: string | null;
  steps: { text: string; highlight?: boolean }[];
  note?: string;
  xmlDownload?: boolean;
  manualFallbackSteps?: { text: string }[];
};

function getEmailProvider(email: string, mxOverride?: string | null): EmailProvider {
  const domain = email.split("@")[1]?.toLowerCase() || "";

  // Check MX-detected provider first (catches Google Workspace, Microsoft 365, etc.)
  const effectiveProvider = mxOverride || (
    (domain === "gmail.com" || domain === "googlemail.com") ? "gmail" :
    ["outlook.com","hotmail.com","live.com","msn.com","hotmail.com.br","outlook.com.br"].includes(domain) ? "outlook" :
    ["yahoo.com","yahoo.com.br","ymail.com"].includes(domain) ? "yahoo" :
    ["zoho.com","zohomail.com","zohomail.eu"].includes(domain) ? "zoho" : null
  );

  if (effectiveProvider === "gmail") {
    return {
      id: "gmail", name: "Gmail", icon: "📧", color: "#EA4335",
      deeplink: "https://mail.google.com/mail/u/0/#settings/fwdandpop",
      steps: [
        { text: 'No computador, abra o Gmail → ⚙️ engrenagem → "Ver todas as configurações" → aba "Encaminhamento e POP/IMAP"' },
        { text: 'Clique em "Adicionar um endereço de encaminhamento" → digite: reservas@aircheck.com.br → "Avançar" → "Continuar" → "OK"' },
        { text: 'Aguarde até 2 minutos e recarregue a página (nós confirmamos o endereço nos bastidores). O endereço deve aparecer como verificado' },
        { text: 'Vá na aba "Filtros e endereços bloqueados" → clique "Importar filtros" → faça upload do arquivo XML (baixe abaixo) → marque "Aplicar filtro às conversas correspondentes" → "Criar filtros"' },
        { text: "Pronto! Toda reserva nova (e cancelamento) chega automaticamente no AirCheck.", highlight: true },
      ],
      note: 'No passo 2, o Gmail pede confirmação do endereço. Nós cuidamos disso nos bastidores — basta aguardar e recarregar. Precisa de ajuda? Veja nosso <a href="/blog/como-configurar-encaminhamento-email-airbnb-gmail" target="_blank" style="color:#3B5FE5;text-decoration:underline">guia completo com prints</a> ou entre em contato: oi@aircheck.com.br',
      xmlDownload: true,
      manualFallbackSteps: [
        { text: 'Na caixa de entrada, clique na barra de pesquisa e depois em "Mostrar opções de pesquisa" (ícone de filtro)' },
        { text: 'No campo "De", digite: automated@airbnb.com — clique em "Criar filtro"' },
        { text: 'Marque "Encaminhar para reservas@aircheck.com.br" e "Aplicar filtro às conversas correspondentes". Clique em "Criar filtro"' },
      ],
    };
  }

  if (effectiveProvider === "outlook") {
    return {
      id: "outlook", name: "Outlook", icon: "📬", color: "#0078D4",
      deeplink: "https://outlook.live.com/mail/0/options/mail/rules",
      steps: [
        { text: 'No computador, acesse outlook.live.com e faça login' },
        { text: 'Clique na ⚙️ engrenagem → "Exibir todas as configurações do Outlook"' },
        { text: 'Navegue: Email → Regras' },
        { text: 'Clique em "+ Adicionar nova regra"' },
        { text: 'Nome: "AirCheck Airbnb" — Condição: "De" → automated@airbnb.com — Ação: "Encaminhar para" → reservas@aircheck.com.br' },
        { text: 'Clique em "Salvar". Pronto!', highlight: true },
      ],
    };
  }

  if (effectiveProvider === "yahoo") {
    return {
      id: "yahoo", name: "Yahoo Mail", icon: "📪", color: "#6001D2",
      deeplink: null,
      steps: [
        { text: 'No computador, acesse mail.yahoo.com e faça login' },
        { text: 'Clique na ⚙️ engrenagem → "Mais configurações"' },
        { text: 'No menu lateral, clique em "Filtros"' },
        { text: 'Clique em "+ Adicionar novos filtros"' },
        { text: 'Nome: "AirCheck Airbnb" — De contém: automated@airbnb.com — Então: "Encaminhar para" → reservas@aircheck.com.br' },
        { text: 'Clique em "Salvar". Pronto!', highlight: true },
      ],
    };
  }

  if (effectiveProvider === "zoho") {
    return {
      id: "zoho", name: "Zoho Mail", icon: "📧", color: "#D14836",
      deeplink: "https://mail.zoho.com/zm/#settings/filters",
      steps: [
        { text: 'No computador, acesse mail.zoho.com e faça login' },
        { text: 'Clique na ⚙️ engrenagem → "Configurações" → "Filtros de email"' },
        { text: 'Clique em "Adicionar filtro"' },
        { text: 'Nome: "AirCheck Airbnb" — Condição: "De" contém automated@airbnb.com' },
        { text: 'Em ação, selecione "Encaminhar para" e digite: reservas@aircheck.com.br' },
        { text: 'Clique em "Salvar". Pronto!', highlight: true },
      ],
    };
  }

  return {
    id: "other", name: "seu provedor", icon: "📩", color: "#737373",
    deeplink: null,
    steps: [
      { text: 'Acesse as configurações do seu email e procure "Filtros" ou "Regras"' },
      { text: "Crie uma nova regra/filtro" },
      { text: 'No campo "De" (remetente), digite: automated@airbnb.com' },
      { text: 'Na ação, selecione "Encaminhar para" e digite: reservas@aircheck.com.br' },
      { text: "Salve a regra — toda reserva nova chega automaticamente!", highlight: true },
    ],
  };
}

export default function OnboardingPage(){
  const router=useRouter();
  const[step,setStep]=useState(1);
  const[user,setUser]=useState<any>(null);
  const[loading,setLoading]=useState(true);

  // Step 1
  const[airbnbEmail,setAirbnbEmail]=useState("");
  const[emailSaving,setEmailSaving]=useState(false);
  const[emailError,setEmailError]=useState("");

  // Step 2
  const[polling,setPolling]=useState(false);
  const[reservation,setReservation]=useState<Reservation|null>(null);
  const pollRef=useRef<NodeJS.Timeout|null>(null);
  const[showAutoGuide,setShowAutoGuide]=useState(true);
  const[detectedProvider,setDetectedProvider]=useState<string|null>(null); // MX-based override

  // Step 4
  const[unitNumber,setUnitNumber]=useState("");
  const[parkingSpot,setParkingSpot]=useState("");
  const[doormanPhone,setDoormanPhone]=useState("");
  const[doormanName,setDoormanName]=useState("");
  const[propSaving,setPropSaving]=useState(false);
  const[condoCode,setCondoCode]=useState("");
  const[condoLinked,setCondoLinked]=useState(false);
  const[condoError,setCondoError]=useState("");
  const[condoSaving,setCondoSaving]=useState(false);
  const[condoData,setCondoData]=useState<{name:string;address:string|null}|null>(null);

  // Step 5
  const[copied,setCopied]=useState(false);

  // Step 6
  const[copiedMsg,setCopiedMsg]=useState(false);

  // Step 7
  const[whatsappData,setWhatsappData]=useState<{message:string;links:any[]}|null>(null);

  useEffect(()=>{
    fetch("/api/auth/me").then(async r=>{
      if(!r.ok){router.push("/login");return}
      const u=await r.json();
      setUser(u);
      if(u.onboardingCompleted){router.push("/dashboard");return}
      if(u.inboundEmails?.length>0)setStep(2);
      setLoading(false);
    }).catch(()=>router.push("/login"));
    return()=>{if(pollRef.current)clearInterval(pollRef.current)};
  },[router]);

  // ── Step 1: Save email ──
  const saveEmail=async()=>{
    if(!airbnbEmail||!airbnbEmail.includes("@"))return setEmailError("Digite um email válido");
    setEmailSaving(true);setEmailError("");
    const res=await fetch("/api/settings/inbound-emails",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:airbnbEmail})});
    if(!res.ok){setEmailError((await res.json()).error||"Erro ao salvar");setEmailSaving(false);return}
    
    // Detect provider via MX lookup (non-blocking — runs in background)
    const domain=airbnbEmail.split("@")[1]?.toLowerCase()||"";
    if(!["gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com","hotmail.com.br","outlook.com.br","yahoo.com","yahoo.com.br","ymail.com","zoho.com","zohomail.com","zohomail.eu"].includes(domain)){
      fetch(`/api/detect-provider?domain=${encodeURIComponent(domain)}`).then(r=>r.json()).then(d=>{
        if(d.provider&&d.provider!=="other")setDetectedProvider(d.provider);
      }).catch(()=>{});
    }
    
    setEmailSaving(false);setStep(2);
  };

  // ── Step 2: Poll for reservation ──
  const startPolling=()=>{
    setPolling(true);
    const check=async()=>{
      const res=await fetch("/api/reservations");
      if(res.ok){
        const data=await res.json();
        if(data.length>0){
          setReservation(data[0]);
          setPolling(false);
          if(pollRef.current)clearInterval(pollRef.current);
          setStep(3);
        }
      }
    };
    check();
    pollRef.current=setInterval(check,5000);
  };

  // ── Step 4: Save property details ──
  const linkCondo=async()=>{
    if(!reservation||!condoCode.trim())return;
    setCondoSaving(true);setCondoError("");
    const res=await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"link_condominium",code:condoCode.trim()})});
    if(!res.ok){const d=await res.json();setCondoError(d.error||"Código inválido");setCondoSaving(false);return}
    const data=await res.json().catch(()=>null);
    if(data?.condominium){setCondoData({name:data.condominium.name,address:data.condominium.address})}
    setCondoLinked(true);setCondoSaving(false);setCondoError("");
  };

  const saveProperty=async()=>{
    if(!reservation)return;
    if(!unitNumber.trim()){alert("Preencha o número da unidade");return}
    if(!condoLinked&&!doormanPhone){alert("Preencha o WhatsApp da portaria ou vincule ao condomínio");return}
    setPropSaving(true);
    await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_details",unitNumber:unitNumber.trim(),parkingSpot:parkingSpot.trim()})});
    if(!condoLinked&&reservation.property.doormanPhones.length===0&&doormanPhone){
      await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",phone:doormanPhone,name:doormanName||"Portaria",label:""})});
    }
    const rr=await fetch("/api/reservations");
    if(rr.ok){const data=await rr.json();if(data.length>0)setReservation(data[0])}
    setPropSaving(false);setStep(5);
  };

  // ── Step 5: Copy link ──
  const copyLink=()=>{
    if(!reservation)return;
    const url=reservation.confirmationCode?`https://airchk.in/c/${reservation.confirmationCode}`:`https://airchk.in/checkin/${reservation.formToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  // ── Step 7: Load WhatsApp data + complete onboarding ──
  const loadWhatsapp=async()=>{
    if(!reservation)return;
    const res=await fetch(`/api/reservations/${reservation.id}/whatsapp`);
    if(res.ok)setWhatsappData(await res.json());
  };
  const completeOnboarding=async()=>{
    await fetch("/api/onboarding/complete",{method:"POST"});
    router.push("/dashboard");
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit",color:"#A3A3A3"}}>Carregando...</div>;

  return(
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"Outfit,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"14px 24px"}}>
        <div style={{maxWidth:560,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Logo/>
          <button onClick={()=>{fetch("/api/onboarding/complete",{method:"POST"});router.push("/dashboard")}} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer"}}>Pular setup →</button>
        </div>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"32px 20px 60px"}}>
        {/* Progress bar */}
        <div style={{display:"flex",gap:4,marginBottom:32}}>
          {[1,2,3,4,5,6,7].map(s=>(
            <div key={s} onClick={()=>{if(s<step)setStep(s)}} style={{flex:1,height:4,borderRadius:2,background:s<step?B.accent:s===step?B.primary:"#E5E5E5",transition:"background 0.4s",cursor:s<step?"pointer":"default"}}/>
          ))}
        </div>

        {/* ═══════════════════ STEP 1 ═══════════════════ */}
        {step===1&&<div style={cardStyle}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:32,marginBottom:12}}>👋</div>
            <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Bem-vindo ao AirCheck!</h2>
            <p style={{fontSize:14,color:"#737373",lineHeight:1.6}}>Vamos guiar você em poucos passos até sua primeira experiência com a ferramenta. Depois de configurado, o dia a dia é ainda mais simples.</p>
          </div>
          <div style={{borderTop:"1px solid #F0F0F0",paddingTop:20}}>
            <StepBadge n={1}/>
            <h3 style={{fontSize:18,fontWeight:800,letterSpacing:"-0.02em",marginBottom:6}}>Qual email você usa no Airbnb?</h3>
            <p style={{fontSize:13,color:"#A3A3A3",lineHeight:1.5,marginBottom:16}}>Precisamos saber para identificar que os emails encaminhados são seus.</p>
            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Email da sua conta Airbnb</label>
              <input value={airbnbEmail} onChange={e=>setAirbnbEmail(e.target.value)} placeholder="seuemail@gmail.com" type="email" onKeyDown={e=>e.key==="Enter"&&saveEmail()} style={{...inputStyle,borderColor:emailError?"#DC2626":"#E5E5E5"}}/>
              {emailError&&<div style={{fontSize:12,color:"#DC2626",marginTop:6}}>{emailError}</div>}
            </div>
            <button onClick={saveEmail} disabled={emailSaving||!airbnbEmail} style={{...btnStyle(),opacity:emailSaving||!airbnbEmail?0.5:1,cursor:emailSaving||!airbnbEmail?"not-allowed":"pointer"}}>
              {emailSaving?"Salvando...":"Começar →"}
            </button>
          </div>
        </div>}

        {/* ═══════════════════ STEP 2 ═══════════════════ */}
        {step===2&&(()=>{
          const provider=getEmailProvider(airbnbEmail||user?.inboundEmails?.[0]?.email||"",detectedProvider);
          return <div style={cardStyle}>
          <BackBtn onClick={()=>setStep(1)}/>
          <StepBadge n={2}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Conecte suas reservas</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Para o AirCheck receber suas reservas automaticamente, crie um filtro no seu email que encaminhe os emails do Airbnb. <strong style={{color:"#1A1A1A"}}>Configure uma vez e nunca mais precise fazer manualmente.</strong></p>

          {/* Forwarding address box */}
          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Encaminhe para</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:600,color:B.primary,wordBreak:"break-all"}}>reservas@aircheck.com.br</div>
          </div>

          {/* Provider detection badge */}
          {provider.id!=="other"&&<div style={{display:"flex",alignItems:"center",gap:10,background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 16px",marginBottom:16}}>
            <span style={{fontSize:20}}>{provider.icon}</span>
            <span style={{fontSize:13,fontWeight:600,color:"#059669"}}>Detectamos que você usa {provider.name}! Siga o guia abaixo.</span>
          </div>}

          {/* Manual provider selector — shown when provider is not auto-detected */}
          {provider.id==="other"&&<div style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A",marginBottom:8}}>Qual provedor de email você usa?</div>
            <div style={{display:"flex",gap:8}}>
              {([
                {id:"gmail",name:"Gmail",icon:"📧",color:"#EA4335",bg:"#FEE2E2"},
                {id:"outlook",name:"Outlook",icon:"📬",color:"#0078D4",bg:"#DBEAFE"},
                {id:"yahoo",name:"Yahoo",icon:"📪",color:"#6001D2",bg:"#F5F3FF"},
                {id:"zoho",name:"Zoho",icon:"📧",color:"#D14836",bg:"#FEE2E2"},
              ] as const).map(p=>(
                <button key={p.id} onClick={()=>setDetectedProvider(detectedProvider===p.id?null:p.id)} style={{
                  flex:1,fontFamily:"Outfit",fontSize:12,fontWeight:detectedProvider===p.id?700:500,
                  padding:"10px 8px",borderRadius:10,cursor:"pointer",transition:"all 0.2s",textAlign:"center",
                  background:detectedProvider===p.id?p.bg:"#FAFAF9",
                  color:detectedProvider===p.id?p.color:"#737373",
                  border:`1.5px solid ${detectedProvider===p.id?p.color:"#E5E5E5"}`,
                }}>
                  <div style={{fontSize:18,marginBottom:4}}>{p.icon}</div>
                  {p.name}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:"#A3A3A3",marginTop:8,lineHeight:1.5}}>
              Se seu email é hospedado no Google (ex: Google Workspace), selecione Gmail. Se usa Microsoft 365, selecione Outlook. Se usa Zoho Mail, selecione Zoho.
            </div>
          </div>}

          {/* Auto-forwarding guide (main path) */}
          <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,overflow:"hidden",marginBottom:16}}>
            <button onClick={()=>setShowAutoGuide(!showAutoGuide)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:11,fontWeight:700,color:"#fff",background:`linear-gradient(135deg,${B.g1},${B.g2})`,borderRadius:6,padding:"2px 8px",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>RECOMENDADO</span>
                <span style={{fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{provider.id!=="other"?`${provider.name} — Passo a passo`:"Configurar encaminhamento automático"}</span>
              </div>
              <span style={{fontSize:18,color:"#A3A3A3",transform:showAutoGuide?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}>▾</span>
            </button>

            {showAutoGuide&&<div style={{padding:"0 18px 18px",borderTop:"1px solid #F0F0F0"}}>
              <p style={{fontSize:12,color:"#737373",lineHeight:1.6,margin:"12px 0 16px"}}>
                Crie um filtro no {provider.name} para encaminhar automaticamente os emails de reserva do Airbnb. Leva menos de 2 minutos:
              </p>

              {/* Deeplink button — before steps */}
              {provider.deeplink&&<a href={provider.deeplink} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,fontFamily:"Outfit",fontSize:13,fontWeight:600,color:B.primary,background:B.light,border:`1px solid ${B.muted}`,borderRadius:8,padding:"10px 16px",textDecoration:"none",cursor:"pointer",marginBottom:provider.xmlDownload?8:16}}>
                Abrir configurações do {provider.name} ↗
              </a>}

              {/* XML filter download — Gmail only */}
              {provider.xmlDownload&&<div style={{marginBottom:16}}>
                <a href="/aircheck-gmail-filter.xml" download="aircheck-gmail-filter.xml" style={{display:"inline-flex",alignItems:"center",gap:8,fontFamily:"Outfit",fontSize:13,fontWeight:600,color:"#059669",background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 16px",textDecoration:"none",cursor:"pointer"}}>
                  ⬇ Baixar arquivo de filtro (XML)
                </a>
                <div style={{fontSize:11,color:"#A3A3A3",marginTop:6}}>Você vai usar este arquivo no passo 4</div>
              </div>}

              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {provider.steps.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 0",borderBottom:i<provider.steps.length-1?"1px solid #F0F0F0":"none"}}>
                    <div style={{minWidth:24,height:24,borderRadius:"50%",background:s.highlight?B.accent:B.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0,marginTop:2}}>
                      {s.highlight?"✓":i+1}
                    </div>
                    <span style={{fontSize:13,color:s.highlight?"#059669":"#525252",fontWeight:s.highlight?600:400,lineHeight:1.6}} dangerouslySetInnerHTML={{__html:(()=>{
                      let html=s.text.replace(/"([^"]+)"/g,'<strong style="color:#1A1A1A">"$1"</strong>');
                      html=html.replace(/reservas@aircheck\.com\.br/g,`<code style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:${B.primary};background:${B.light};padding:3px 8px;border-radius:4px">reservas@aircheck.com.br</code>`);
                      html=html.replace(/automated@airbnb\.com/g,`<code style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:${B.primary};background:${B.light};padding:3px 8px;border-radius:4px">automated@airbnb.com</code>`);
                      return html;
                    })()}}/>
                  </div>
                ))}
              </div>

              {/* Manual fallback — collapsed */}
              {provider.manualFallbackSteps&&<details style={{marginTop:12}}>
                <summary style={{fontSize:12,fontWeight:600,color:"#737373",cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>🔧</span> Não conseguiu importar o filtro? Crie manualmente
                </summary>
                <div style={{marginTop:10,background:"#FAFAF9",borderRadius:10,padding:14}}>
                  <div style={{fontSize:12,color:"#737373",marginBottom:10,lineHeight:1.5}}>Após completar os passos 1-3 acima (endereço verificado), faça:</div>
                  <div style={{display:"flex",flexDirection:"column",gap:0}}>
                    {provider.manualFallbackSteps.map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:i<(provider.manualFallbackSteps?.length||0)-1?"1px solid #E5E5E5":"none"}}>
                        <div style={{minWidth:20,height:20,borderRadius:"50%",background:"#D4D4D4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0,marginTop:2}}>{i+1}</div>
                        <span style={{fontSize:12,color:"#525252",lineHeight:1.5}} dangerouslySetInnerHTML={{__html:(()=>{
                          let html=s.text.replace(/"([^"]+)"/g,'<strong style="color:#1A1A1A">"$1"</strong>');
                          html=html.replace(/reservas@aircheck\.com\.br/g,`<code style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:${B.primary};background:${B.light};padding:2px 6px;border-radius:3px">reservas@aircheck.com.br</code>`);
                          html=html.replace(/automated@airbnb\.com/g,`<code style="font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:${B.primary};background:${B.light};padding:2px 6px;border-radius:3px">automated@airbnb.com</code>`);
                          return html;
                        })()}}/>
                      </div>
                    ))}
                  </div>
                </div>
              </details>}

              {/* Provider-specific note */}
              {provider.note&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#D97706",lineHeight:1.6,marginTop:12}}>
                <span dangerouslySetInnerHTML={{__html:`💡 <strong>Importante:</strong> ${provider.note}`}}/>
              </div>}

              {/* Info about confirmations + cancellations */}
              <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#2563EB",lineHeight:1.5,marginTop:12}}>
                💡 <strong>Confirmações e cancelamentos</strong> do Airbnb vêm do mesmo remetente (<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>automated@airbnb.com</span>). Com essa regra, ambos serão processados automaticamente.
              </div>
            </div>}
          </div>

          {/* Test section — after guide */}
          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1A1A1A",marginBottom:8}}>📨 Agora teste: encaminhe uma reserva</div>
            <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:12}}>
              {showAutoGuide
                ?"Após configurar o filtro acima, encaminhe manualmente um email de \"Reserva confirmada\" do Airbnb para verificar que tudo funciona:"
                :"Abra seu email e encaminhe um email de \"Reserva confirmada\" do Airbnb para o endereço abaixo:"}
            </p>
            <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:10,padding:"12px 16px",textAlign:"center",marginBottom:12}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:15,fontWeight:600,color:B.primary,wordBreak:"break-all"}}>reservas@aircheck.com.br</div>
            </div>
            <p style={{fontSize:12,color:"#A3A3A3",lineHeight:1.5}}>
              Se possível, escolha uma reserva futura. O AirCheck processa confirmações e cancelamentos automaticamente.
            </p>
          </div>

          {/* CTA + Polling */}
          {!polling&&<button onClick={startPolling} style={btnStyle()}>Já encaminhei — aguardar reserva →</button>}

          {polling&&<div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 20px",marginBottom:16}}>
              <div style={{width:16,height:16,borderRadius:"50%",border:"3px solid #D97706",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>
              <span style={{fontSize:14,fontWeight:600,color:"#D97706"}}>Aguardando sua reserva chegar...</span>
            </div>
            <p style={{fontSize:12,color:"#A3A3A3"}}>Pode levar de 10 a 60 segundos. Não feche esta página.</p>
          </div>}
        </div>})()}

        {/* ═══════════════════ STEP 3 ═══════════════════ */}
        {step===3&&reservation&&<div style={cardStyle}>
          <BackBtn onClick={()=>setStep(2)}/>
          <StepBadge n={3}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:100,padding:"6px 14px",marginBottom:16}}>
            <span>✅</span>
            <span style={{fontSize:13,fontWeight:600,color:B.accent}}>Reserva recebida com sucesso!</span>
          </div>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:16}}>Olha só, já está aqui.</h2>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:"#1A1A1A",marginBottom:4}}>{reservation.guestFullName}</div>
            <div style={{fontSize:13,color:"#737373",lineHeight:1.6}}>
              📍 {reservation.property.name}<br/>
              📅 {reservation.checkInDate} → {reservation.checkOutDate}<br/>
              👥 {reservation.numGuests} hóspede{reservation.numGuests!==1?"s":""} · {reservation.nights||"?"} noite{reservation.nights!==1?"s":""}
              {reservation.confirmationCode&&<><br/>📋 Código: {reservation.confirmationCode}</>}
            </div>
          </div>

          <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:20}}>Essa reserva já aparece no seu painel. Agora vamos configurar o imóvel para que a mensagem da portaria saia completa.</p>
          <button onClick={()=>setStep(4)} style={btnStyle()}>Configurar imóvel →</button>
        </div>}

        {/* ═══════════════════ STEP 4 ═══════════════════ */}
        {step===4&&reservation&&<div style={cardStyle}>
          <BackBtn onClick={()=>setStep(3)}/>
          <StepBadge n={4}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:4}}>{reservation.property.name}</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:24}}>Preencha os dados do imóvel. A portaria vai receber essas informações junto com os dados do hóspede.</p>

          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:16}}>
            <div>
              <label style={labelStyle}>Número da unidade (apartamento/casa) *</label>
              <input value={unitNumber} onChange={e=>setUnitNumber(e.target.value)} placeholder="Ex: 501, Casa 3, Bloco A - 102" style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Vaga de garagem <span style={{fontWeight:400,color:"#A3A3A3"}}>(opcional)</span></label>
              <input value={parkingSpot} onChange={e=>setParkingSpot(e.target.value)} placeholder="Ex: G1-25, Livre" style={inputStyle}/>
            </div>

            {/* Condominium code */}
            <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
              <div style={{fontSize:12,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>🏢 Condomínio Parceiro</div>
              {condoLinked?(
                <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:condoData?8:0}}>
                    <span style={{fontSize:18}}>✅</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>Condomínio vinculado com sucesso!</div>
                      <div style={{fontSize:12,color:"#737373",marginTop:2}}>A portaria será gerenciada pelo condomínio. Você não precisa preencher o WhatsApp da portaria.</div>
                    </div>
                  </div>
                  {condoData&&<div style={{background:"#fff",border:"1px solid #D1FAE5",borderRadius:8,padding:"10px 14px",marginTop:8}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{condoData.name}</div>
                    {condoData.address&&<div style={{fontSize:12,color:"#737373",marginTop:2}}>📍 {condoData.address}</div>}
                  </div>}
                </div>
              ):(
                <div>
                  <div style={{fontSize:13,color:"#737373",lineHeight:1.5,marginBottom:8}}>Se seu condomínio é parceiro do AirCheck e te enviou um código de vinculação, insira abaixo.</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input placeholder="Ex: AK3F7B" value={condoCode} onChange={e=>setCondoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} maxLength={6} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:15,fontWeight:600,padding:"10px 14px",border:`1px solid ${condoError?"#DC2626":"#E5E5E5"}`,borderRadius:10,background:"#fff",width:130,textAlign:"center",letterSpacing:"0.15em",boxSizing:"border-box"}}/>
                    <button onClick={linkCondo} disabled={condoSaving||condoCode.length<4} style={{...btnStyle(true),fontSize:13,padding:"10px 18px",opacity:condoSaving||condoCode.length<4?0.5:1,cursor:condoSaving||condoCode.length<4?"not-allowed":"pointer"}}>{condoSaving?"Verificando...":"Vincular"}</button>
                  </div>
                  {condoError&&<div style={{fontSize:12,color:"#DC2626",marginTop:6}}>{condoError}</div>}
                  <div style={{fontSize:11,color:"#A3A3A3",marginTop:8}}>Não tem código? Sem problema — pule esta etapa e configure o WhatsApp da portaria abaixo.</div>
                </div>
              )}
            </div>

            {/* Doorman WhatsApp - only if not linked to condo */}
            {!condoLinked&&<div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
              <label style={labelStyle}>WhatsApp da portaria *</label>
              <input value={doormanPhone} onChange={e=>setDoormanPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" style={{...inputStyle,marginBottom:10}}/>
              <label style={labelStyle}>Rótulo da portaria</label>
              <input value={doormanName} onChange={e=>setDoormanName(e.target.value)} placeholder="Ex: Portaria Principal, Portaria Remota" style={inputStyle}/>
            </div>}
          </div>

          <div style={{background:"#F5F5F4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#737373",lineHeight:1.6,marginBottom:20}}>
            💡 Não se preocupe — você pode alterar todos esses dados depois na aba <strong style={{color:"#1A1A1A"}}>Imóveis</strong> do painel.
          </div>

          <button onClick={saveProperty} disabled={propSaving} style={{...btnStyle(),opacity:propSaving?0.5:1,cursor:propSaving?"not-allowed":"pointer"}}>
            {propSaving?"Salvando...":"Continuar →"}
          </button>
        </div>}

        {/* ═══════════════════ STEP 5 ═══════════════════ */}
        {step===5&&reservation&&<div style={cardStyle}>
          <BackBtn onClick={()=>setStep(4)}/>
          <StepBadge n={5}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Formulário de check-in</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Este é o link que você envia ao hóspede. Ele preenche nome, CPF e data de nascimento para registro na portaria.</p>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Link do formulário</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:B.primary,wordBreak:"break-all",marginBottom:12}}>airchk.in{reservation.confirmationCode?`/c/${reservation.confirmationCode}`:`/checkin/${reservation.formToken}`}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={copyLink} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:copied?B.accent:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",transition:"background 0.2s"}}>{copied?"Copiado! ✓":"Copiar link"}</button>
              <a href={reservation.confirmationCode?`/c/${reservation.confirmationCode}`:`/checkin/${reservation.formToken}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:"#fff",color:B.primary,border:`1px solid ${B.primary}`,borderRadius:8,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Abrir formulário ↗</a>
            </div>
          </div>

          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#D97706",lineHeight:1.6,marginBottom:20}}>
            💡 <strong>Experimente agora:</strong> clique em "Abrir formulário" — ele abrirá em uma nova janela. Preencha com dados fictícios para ver como funciona. Depois, <strong>feche a janela</strong> e volte aqui para continuar.
          </div>

          <button onClick={()=>setStep(6)} style={btnStyle()}>Já vi o formulário, continuar →</button>
        </div>}

        {/* ═══════════════════ STEP 6 ═══════════════════ */}
        {step===6&&reservation&&(()=>{
          return<div style={cardStyle}>
          <BackBtn onClick={()=>setStep(5)}/>
          <StepBadge n={6}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Mensagem automática no Airbnb</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:16}}>Configure uma mensagem programada no Airbnb para que <strong style={{color:"#1A1A1A"}}>cada novo hóspede receba automaticamente</strong> o link do formulário de check-in. Você faz isso uma única vez.</p>

          <a href="https://www.airbnb.com.br/hosting/messages/settings/quick-replies?product=STAYS" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px 20px",background:"#FF385C",color:"#fff",borderRadius:12,textDecoration:"none",fontFamily:"Outfit",fontSize:14,fontWeight:600,marginBottom:16,boxShadow:"0 2px 8px rgba(255,56,92,0.3)"}}>
            <span style={{fontSize:18}}>🏠</span> Abrir configuração de mensagens no Airbnb ↗
          </a>
          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#D97706",lineHeight:1.5,marginBottom:16}}>
            ⚠️ Certifique-se de estar logado no Airbnb com a <strong>mesma conta</strong> vinculada ao email que você configurou no passo 1.
          </div>

          {/* Message preview */}
          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Modelo de mensagem</div>
            <div style={{fontSize:13,color:"#1A1A1A",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-all",fontFamily:"system-ui",background:"#fff",border:"1px solid #E5E5E5",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
              {"Olá "}<span style={{background:"#DBEAFE",color:"#2563EB",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600}}>Nome do hóspede</span>{" ! 😊\n\nSua reserva foi confirmada. Agradecemos a preferência e estamos animados para lhe receber em nosso imóvel.\n\nPara agilizar seu check-in, por favor preencha este formulário com os dados dos hóspedes. É necessário para liberação na portaria do condomínio e leva menos de 1 minuto.\n\nhttps://airchk.in/c/"}<span style={{background:"#DBEAFE",color:"#2563EB",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600}}>Código de confirmação</span>{"\n\nEntrarei em contato no dia anterior ao check-in para lhe passar todas as orientações, e até lá, estarei disponível para qualquer dúvida que tenha.\n\nAté breve!"}
            </div>
            <button onClick={()=>{
              const msg=`Olá {nome do hóspede}! 😊\n\nSua reserva foi confirmada. Agradecemos a preferência e estamos animados para lhe receber em nosso imóvel.\n\nPara agilizar seu check-in, por favor preencha este formulário com os dados dos hóspedes. É necessário para liberação na portaria do condomínio e leva menos de 1 minuto.\n\nhttps://airchk.in/c/{código de confirmação}\n\nEntrarei em contato no dia anterior ao check-in para lhe passar todas as orientações, e até lá, estarei disponível para qualquer dúvida que tenha.\n\nAté breve!`;
              navigator.clipboard.writeText(msg);setCopiedMsg(true);setTimeout(()=>setCopiedMsg(false),2500);
            }} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:copiedMsg?B.accent:"#fff",color:copiedMsg?"#fff":"#1A1A1A",border:`1px solid ${copiedMsg?B.accent:"#E5E5E5"}`,borderRadius:8,cursor:"pointer",transition:"all 0.2s"}}>{copiedMsg?"Copiado! ✓":"📋 Copiar mensagem"}</button>
          </div>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:600,color:B.primary,marginBottom:8}}>📱 Como configurar:</div>
            <ol style={{margin:0,paddingLeft:20,fontSize:13,color:B.primary,lineHeight:1.8}}>
              <li>Clique no botão acima (ou acesse pelo app: <strong>Anúncios</strong> → seu imóvel → <strong>Mensagens programadas</strong>)</li>
              <li>Crie uma nova resposta rápida com gatilho <strong>"Reserva confirmada"</strong></li>
              <li>Cole a mensagem acima (troque os campos em azul pelos atalhos do Airbnb)</li>
              <li>Salve. A partir de agora, cada hóspede recebe o link automaticamente.</li>
            </ol>
          </div>

          <button onClick={()=>{loadWhatsapp();setStep(7)}} style={btnStyle()}>Continuar →</button>
        </div>})()}

        {/* ═══════════════════ STEP 7 ═══════════════════ */}
        {step===7&&reservation&&<div style={cardStyle}>
          <BackBtn onClick={()=>setStep(6)}/>
          <StepBadge n={7}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>{condoLinked?"Pronto! A portaria já recebe tudo.":"Pronto! Envie para a portaria."}</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>{condoLinked
            ?"Como seu imóvel está vinculado a um condomínio parceiro, os dados dos hóspedes são enviados automaticamente para o painel da portaria. Você não precisa fazer mais nada."
            :<>Quando o hóspede preencher o formulário, você abre a reserva no painel e clica em <strong style={{color:"#1A1A1A"}}>"Enviar para portaria"</strong>. A mensagem formatada vai direto pro WhatsApp.</>}</p>

          {!condoLinked&&whatsappData?<div style={{marginBottom:20}}>
            <div style={{background:"#E7DCCF",borderRadius:14,padding:14}}>
              <div style={{background:"#DCF8C6",borderRadius:10,padding:"10px 12px",fontSize:11,color:"#303030",lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"system-ui"}}>{whatsappData.message}</div>
            </div>
            {whatsappData.links.map((l:any,i:number)=>(
              <a key={i} href={l.link} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:10,background:"#25D366",color:"#fff",borderRadius:10,padding:"12px 16px",textDecoration:"none",fontFamily:"Outfit",fontSize:14,fontWeight:600}}>
                💬 Enviar para {l.name||"Portaria"} ({l.phone})
              </a>
            ))}
          </div>
          :!condoLinked?<div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:13,color:"#A3A3A3",lineHeight:1.6}}>
              {reservation.guests.length===0
                ?"O formulário ainda não foi preenchido pelo hóspede. Quando ele preencher, a mensagem aparecerá aqui e no seu painel."
                :"Carregando preview..."}
            </div>
          </div>:null}

          <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"20px",marginBottom:24,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>🎉</div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent,marginBottom:6}}>Setup completo!</div>
            <div style={{fontSize:13,color:"#737373",lineHeight:1.6}}>{condoLinked
              ?"Seu AirCheck está pronto. Cada reserva gera automaticamente um check-in no painel da portaria do condomínio. Cancelamentos também são processados automaticamente."
              :"Seu AirCheck está pronto. A partir de agora, basta encaminhar o email de cada reserva (ou configurar o encaminhamento automático) e repetir o processo. Cancelamentos também são processados automaticamente."}</div>
          </div>

          <button onClick={completeOnboarding} style={btnStyle()}>Ir para o painel →</button>
        </div>}
      </div>
    </div>
  );
}
