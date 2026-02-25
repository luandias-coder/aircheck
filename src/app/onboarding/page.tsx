"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", accent:"#059669", dark:"#0F0F0F" };

function Logo(){return<div style={{display:"flex",alignItems:"center",gap:8}}><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#og)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="og" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg><span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.03em",fontFamily:"Outfit"}}>Air<span style={{background:`linear-gradient(135deg,${B.g1},${B.g2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Check</span></span></div>}

function maskPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

interface Reservation { id:string; guestFullName:string; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; formToken:string; status:string; airbnbThreadUrl:string|null; property:{id:string;name:string;unitNumber:string|null;parkingSpot:string|null;doormanPhones:Array<{id:string;phone:string;name:string|null;label:string|null}>}; guests:any[] }

// Styles reused across steps
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

  // Step 4
  const[unitNumber,setUnitNumber]=useState("");
  const[parkingSpot,setParkingSpot]=useState("");
  const[doormanPhone,setDoormanPhone]=useState("");
  const[doormanName,setDoormanName]=useState("");
  const[propSaving,setPropSaving]=useState(false);

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
  const saveProperty=async()=>{
    if(!reservation)return;
    if(!unitNumber.trim()){alert("Preencha o número da unidade");return}
    if(!doormanPhone){alert("Preencha o WhatsApp da portaria");return}
    setPropSaving(true);
    await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_details",unitNumber:unitNumber.trim(),parkingSpot:parkingSpot.trim()})});
    if(reservation.property.doormanPhones.length===0){
      await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",phone:doormanPhone,name:doormanName||"Portaria",label:""})});
    }
    const rr=await fetch("/api/reservations");
    if(rr.ok){const data=await rr.json();if(data.length>0)setReservation(data[0])}
    setPropSaving(false);setStep(5);
  };

  // ── Step 5: Copy link ──
  const copyLink=()=>{
    if(!reservation)return;
    const url=reservation.confirmationCode?`${window.location.origin}/c/${reservation.confirmationCode}`:`${window.location.origin}/checkin/${reservation.formToken}`;
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
            <div key={s} style={{flex:1,height:4,borderRadius:2,background:s<step?B.accent:s===step?B.primary:"#E5E5E5",transition:"background 0.4s"}}/>
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
        {step===2&&<div style={cardStyle}>
          <StepBadge n={2}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Encaminhe uma reserva</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Abra seu email e encaminhe um email de <strong style={{color:"#1A1A1A"}}>"Reserva confirmada"</strong> do Airbnb para o endereço abaixo. Se possível, escolha uma reserva futura.</p>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Encaminhe para</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:600,color:B.primary,wordBreak:"break-all"}}>reservas@aircheck.com.br</div>
          </div>

          {!polling&&<button onClick={startPolling} style={btnStyle()}>Já encaminhei →</button>}

          {polling&&<div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 20px",marginBottom:16}}>
              <div style={{width:16,height:16,borderRadius:"50%",border:"3px solid #D97706",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>
              <span style={{fontSize:14,fontWeight:600,color:"#D97706"}}>Aguardando sua reserva chegar...</span>
            </div>
            <p style={{fontSize:12,color:"#A3A3A3"}}>Pode levar de 10 a 60 segundos. Não feche esta página.</p>
          </div>}

          <div style={{marginTop:20,borderTop:"1px solid #F0F0F0",paddingTop:16}}>
            <details style={{cursor:"pointer"}}>
              <summary style={{fontSize:13,fontWeight:600,color:B.primary}}>💡 Sabia que dá pra automatizar isso?</summary>
              <div style={{fontSize:12,color:"#737373",lineHeight:1.7,marginTop:10,background:"#FAFAF9",borderRadius:8,padding:12}}>
                No seu provedor de email, crie um filtro para encaminhar automaticamente os emails do Airbnb (<strong>automated@airbnb.com</strong>) para <strong>reservas@aircheck.com.br</strong>. Assim, toda nova reserva aparece no AirCheck sem você precisar fazer nada!
              </div>
            </details>
          </div>
        </div>}

        {/* ═══════════════════ STEP 3 ═══════════════════ */}
        {step===3&&reservation&&<div style={cardStyle}>
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
            <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
              <label style={labelStyle}>WhatsApp da portaria *</label>
              <input value={doormanPhone} onChange={e=>setDoormanPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" style={{...inputStyle,marginBottom:10}}/>
              <label style={labelStyle}>Nome do contato</label>
              <input value={doormanName} onChange={e=>setDoormanName(e.target.value)} placeholder="Ex: Portaria Central" style={inputStyle}/>
            </div>
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
          <StepBadge n={5}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Formulário de check-in</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Este é o link que você envia ao hóspede. Ele preenche nome, CPF, data de nascimento e tira foto do documento.</p>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Link do formulário</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:B.primary,wordBreak:"break-all",marginBottom:12}}>{typeof window!=="undefined"?window.location.origin:""}{reservation.confirmationCode?`/c/${reservation.confirmationCode}`:`/checkin/${reservation.formToken}`}</div>
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
          <StepBadge n={6}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Mensagem automática no Airbnb</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Configure uma mensagem programada no Airbnb para que <strong style={{color:"#1A1A1A"}}>cada novo hóspede receba automaticamente</strong> o link do formulário de check-in. Você faz isso uma única vez.</p>

          {/* Message preview */}
          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Modelo de mensagem</div>
            <div style={{fontSize:13,color:"#1A1A1A",lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-all",fontFamily:"system-ui",background:"#fff",border:"1px solid #E5E5E5",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
              {"Olá "}<span style={{background:"#DBEAFE",color:"#2563EB",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600}}>Nome do hóspede</span>{" ! 😊\n\nSua reserva foi confirmada. Agradecemos a preferência e estamos animados para lhe receber em nosso imóvel.\n\nPara agilizar seu check-in, por favor preencha este formulário com os dados dos hóspedes. É necessário para liberação na portaria do condomínio e leva menos de 1 minuto.\n\nhttps://www.aircheck.com.br/c/"}<span style={{background:"#DBEAFE",color:"#2563EB",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600}}>Código de confirmação</span>{"\n\nEntrarei em contato no dia anterior ao check-in para lhe passar todas as orientações, e até lá, estarei disponível para qualquer dúvida que tenha.\n\nAté breve!"}
            </div>
          </div>

          {/* Step-by-step instructions */}
          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"16px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Como configurar (uma vez só)</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                "Clique no botão abaixo para abrir as configurações de respostas rápidas do Airbnb",
                "Clique em \"Criar\" para criar um novo modelo",
                "Dê o nome \"Confirmação de reserva\" ao modelo",
                "Cole o texto da mensagem acima no campo de mensagem",
                "No local de [Nome do hóspede], clique em \"Adicione informações\" (na parte inferior) e selecione \"Nome do primeiro hóspede\"",
                "No local de [Código de confirmação], clique em \"Adicione informações\" e selecione \"Código de confirmação\"",
                "Em \"Escolha os anúncios\", selecione os imóveis desejados",
                "Configure a programação: \"5 minutos após um hóspede reservar\"",
                "Clique em \"Salvar\"",
              ].map((t,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0,marginTop:1}}>{i+1}</div>
                  <span style={{fontSize:13,color:"#1A1A1A",lineHeight:1.5}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Airbnb button */}
          <a href="https://www.airbnb.com.br/hosting/messages/settings/quick-replies" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#FF5A5F",color:"#fff",borderRadius:12,padding:"14px 24px",textDecoration:"none",fontFamily:"Outfit",fontSize:14,fontWeight:700,marginBottom:12}}>
            ⚙️ Abrir configuração de respostas rápidas do Airbnb ↗
          </a>

          <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:10,padding:"12px 16px",fontSize:13,color:B.accent,lineHeight:1.6,marginBottom:20}}>
            ✅ <strong>Pronto!</strong> A partir de agora, toda nova reserva receberá automaticamente o link do formulário no chat do Airbnb. Você não precisa enviar manualmente.
          </div>

          <button onClick={()=>{loadWhatsapp();setStep(7)}} style={btnStyle()}>Continuar →</button>
        </div>})()}

        {/* ═══════════════════ STEP 7 ═══════════════════ */}
        {step===7&&reservation&&<div style={cardStyle}>
          <StepBadge n={7}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Pronto! Envie para a portaria.</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Quando o hóspede preencher o formulário, você abre a reserva no painel e clica em <strong style={{color:"#1A1A1A"}}>"Enviar para portaria"</strong>. A mensagem formatada vai direto pro WhatsApp.</p>

          {whatsappData?<div style={{marginBottom:20}}>
            <div style={{background:"#E7DCCF",borderRadius:14,padding:14}}>
              <div style={{background:"#DCF8C6",borderRadius:10,padding:"10px 12px",fontSize:11,color:"#303030",lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"system-ui"}}>{whatsappData.message}</div>
            </div>
            {whatsappData.links.map((l:any,i:number)=>(
              <a key={i} href={l.link} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:10,background:"#25D366",color:"#fff",borderRadius:10,padding:"12px 16px",textDecoration:"none",fontFamily:"Outfit",fontSize:14,fontWeight:600}}>
                💬 Enviar para {l.name||"Portaria"} ({l.phone})
              </a>
            ))}
          </div>
          :<div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:13,color:"#A3A3A3",lineHeight:1.6}}>
              {reservation.guests.length===0
                ?"O formulário ainda não foi preenchido pelo hóspede. Quando ele preencher, a mensagem aparecerá aqui e no seu painel."
                :"Carregando preview..."}
            </div>
          </div>}

          <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"20px",marginBottom:24,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>🎉</div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent,marginBottom:6}}>Setup completo!</div>
            <div style={{fontSize:13,color:"#737373",lineHeight:1.6}}>Seu AirCheck está pronto. A partir de agora, basta encaminhar o email de cada reserva (ou configurar o encaminhamento automático) e repetir o processo.</div>
          </div>

          <button onClick={completeOnboarding} style={btnStyle()}>Ir para o painel →</button>
        </div>}
      </div>
    </div>
  );
}
