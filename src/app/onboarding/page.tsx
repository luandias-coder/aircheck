"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", accent:"#059669", dark:"#0F0F0F" };

function Logo(){return<div style={{display:"flex",alignItems:"center",gap:8}}><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#og)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="og" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg><span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.03em",fontFamily:"Outfit"}}>Air<span style={{background:`linear-gradient(135deg,${B.g1},${B.g2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Check</span></span></div>}

function maskPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

interface Property { id:string; name:string; unitNumber:string|null; parkingSpot:string|null; doormanPhones:Array<{id:string;phone:string;name:string|null}>; condominium:{name:string;address:string|null}|null; hospitableListingId:string|null }
interface Reservation { id:string; guestFullName:string; checkInDate:string; confirmationCode:string|null; formToken:string; status:string; property:{id:string;name:string} }

const TOTAL_STEPS = 4;
const cardStyle:React.CSSProperties = {background:"#fff",border:"1px solid #E5E5E5",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",maxWidth:520,width:"100%"};
const inputStyle:React.CSSProperties = {width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box" as const,outline:"none"};
const labelStyle:React.CSSProperties = {fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6};
const btnStyle=(secondary?:boolean):React.CSSProperties=>({fontFamily:"Outfit",fontSize:15,fontWeight:700,padding:"14px 32px",background:secondary?"transparent":`linear-gradient(135deg,${B.g1},${B.g2})`,color:secondary?B.primary:"#fff",border:secondary?`2px solid ${B.primary}`:"none",borderRadius:12,cursor:"pointer",boxShadow:secondary?"none":"0 4px 16px rgba(59,95,229,0.3)"});

function StepBadge({n}:{n:number}){return(
  <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
    <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{n}</div>
    <span style={{fontSize:12,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.08em"}}>Passo {n} de {TOTAL_STEPS}</span>
  </div>
)}

function BackBtn({onClick}:{onClick:()=>void}){return(
  <button onClick={onClick} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>
    ← Voltar
  </button>
)}

export default function OnboardingPage(){
  const router=useRouter();
  const[step,setStep]=useState(1);
  const[user,setUser]=useState<any>(null);
  const[loading,setLoading]=useState(true);

  // Step 1 — Connect
  const[connecting,setConnecting]=useState(false);
  const[connected,setConnected]=useState(false);
  const[syncing,setSyncing]=useState(false);
  const[syncResult,setSyncResult]=useState<{imported:number;skipped:number}|null>(null);
  const[properties,setProperties]=useState<Property[]>([]);
  const[reservations,setReservations]=useState<Reservation[]>([]);

  // Step 2 — Property config
  const[selectedPropId,setSelectedPropId]=useState<string|null>(null);
  const[unitNumber,setUnitNumber]=useState("");
  const[parkingSpot,setParkingSpot]=useState("");
  const[doormanPhone,setDoormanPhone]=useState("");
  const[doormanName,setDoormanName]=useState("");
  const[propSaving,setPropSaving]=useState(false);
  const[condoCode,setCondoCode]=useState("");
  const[condoLinked,setCondoLinked]=useState(false);
  const[condoError,setCondoError]=useState("");
  const[condoSaving,setCondoSaving]=useState(false);

  // Step 3 — Demo
  const[copied,setCopied]=useState(false);

  useEffect(()=>{
    fetch("/api/auth/me").then(async r=>{
      if(!r.ok){router.push("/login");return}
      const u=await r.json();
      setUser(u);
      if(u.onboardingCompleted){router.push("/dashboard");return}
      // Check if already connected
      const statusRes=await fetch("/api/auth/hospitable/status");
      if(statusRes.ok){
        const st=await statusRes.json();
        if(st.connected){
          setConnected(true);
          await loadData();
          setStep(2);
        }
      }
      setLoading(false);
    }).catch(()=>router.push("/login"));
  },[router]);

  const loadData=async()=>{
    const[pr,rr]=await Promise.all([fetch("/api/properties"),fetch("/api/reservations")]);
    if(pr.ok){const d=await pr.json();setProperties(d);if(d.length>0&&!selectedPropId)setSelectedPropId(d[0].id)}
    if(rr.ok)setReservations(await rr.json());
  };

  // ── Step 1: Connect Airbnb ──
  const handleConnect=()=>{
    setConnecting(true);
    window.location.href="/api/auth/hospitable/connect";
  };

  // Check URL params on return from Hospitable
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const hosp=params.get("hospitable");
    if(hosp==="connected"){
      window.history.replaceState({},"","/onboarding");
      setConnected(true);
      // Auto-sync reservations
      setSyncing(true);
      fetch("/api/auth/hospitable/sync-reservations",{method:"POST"})
        .then(r=>r.json())
        .then(d=>{
          if(d.ok)setSyncResult({imported:d.imported,skipped:d.skipped});
        })
        .catch(()=>{})
        .finally(()=>{
          setSyncing(false);
          loadData().then(()=>setStep(2));
        });
    }else if(hosp==="error"){
      window.history.replaceState({},"","/onboarding");
      setConnecting(false);
    }
  },[]);

  // ── Step 2: Save property ──
  const selectedProp=properties.find(p=>p.id===selectedPropId);

  const linkCondo=async()=>{
    if(!selectedPropId||!condoCode.trim())return;
    setCondoSaving(true);setCondoError("");
    const res=await fetch(`/api/properties/${selectedPropId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"link_condominium",code:condoCode.trim()})});
    if(!res.ok){const d=await res.json();setCondoError(d.error||"Código inválido");setCondoSaving(false);return}
    setCondoLinked(true);setCondoSaving(false);setCondoError("");
    await loadData();
  };

  const saveProperty=async()=>{
    if(!selectedPropId)return;
    if(!unitNumber.trim()){alert("Preencha o número da unidade");return}
    if(!condoLinked&&!selectedProp?.condominium&&!doormanPhone&&(selectedProp?.doormanPhones?.length||0)===0){alert("Preencha o WhatsApp da portaria ou vincule ao condomínio");return}
    setPropSaving(true);
    await fetch(`/api/properties/${selectedPropId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_details",unitNumber:unitNumber.trim(),parkingSpot:parkingSpot.trim()})});
    if(!condoLinked&&!selectedProp?.condominium&&(selectedProp?.doormanPhones?.length||0)===0&&doormanPhone){
      await fetch(`/api/properties/${selectedPropId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",phone:doormanPhone,name:doormanName||"Portaria",label:""})});
    }
    await loadData();
    setPropSaving(false);
    setStep(3);
  };

  // ── Step 4: Complete ──
  const completeOnboarding=async()=>{
    await fetch("/api/onboarding/complete",{method:"POST"});
    router.push("/dashboard");
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF9",fontFamily:"Outfit"}}><div style={{textAlign:"center",color:"#A3A3A3"}}><Logo/><div style={{marginTop:16,fontSize:14}}>Carregando...</div></div></div>;

  const firstReservation=reservations.find(r=>r.status!=="archived"&&r.status!=="cancelled")||reservations[0];

  return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%, rgba(59,95,229,0.05) 0%, transparent 60%), #FAFAF9",fontFamily:"Outfit,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}.onboarding-card{animation:fadeUp 0.5s ease-out both}`}</style>

      {/* Header */}
      <div style={{maxWidth:560,margin:"0 auto",padding:"48px 24px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo/>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {[1,2,3,4].map(i=><div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i<=step?`linear-gradient(135deg,${B.g1},${B.g2})`:"#E5E5E5",transition:"all 0.3s"}}/>)}
        </div>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"0 24px 60px",display:"flex",flexDirection:"column",alignItems:"center"}}>

        {/* ═══════════════════ STEP 1: Conectar Airbnb ═══════════════════ */}
        {step===1&&<div className="onboarding-card" style={cardStyle}>
          <StepBadge n={1}/>
          <h2 style={{fontSize:28,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Conecte seu Airbnb</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:24}}>
            Em poucos cliques, suas reservas do Airbnb serão importadas automaticamente para o AirCheck. Você faz isso uma vez só.
          </p>

          {!connected?(
            <div>
              <button onClick={handleConnect} disabled={connecting} style={{...btnStyle(),width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:connecting?0.6:1}}>
                {connecting?"Redirecionando...":"🔗 Conectar meu Airbnb"}
              </button>
              <div style={{textAlign:"center",marginTop:14}}>
                <p style={{fontSize:12,color:"#A3A3A3",lineHeight:1.6}}>Gratuito · Não altera seu calendário ou preços · Seguro</p>
              </div>
            </div>
          ):(
            <div>
              <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"20px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:28,marginBottom:6}}>✅</div>
                <div style={{fontSize:16,fontWeight:700,color:B.accent,marginBottom:4}}>Airbnb conectado!</div>
                {syncing&&<div style={{fontSize:13,color:"#737373"}}>Importando reservas...</div>}
                {syncResult&&<div style={{fontSize:13,color:"#737373"}}>{syncResult.imported} reserva(s) importada(s)</div>}
              </div>
              {properties.length>0&&<div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:10,padding:"12px 16px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Imóveis encontrados</div>
                {properties.map(p=><div key={p.id} style={{fontSize:14,fontWeight:500,color:"#1A1A1A",padding:"4px 0"}}>📍 {p.name}</div>)}
              </div>}
              <button onClick={()=>setStep(2)} disabled={syncing} style={{...btnStyle(),width:"100%",opacity:syncing?0.5:1}}>
                {syncing?"Aguarde...":"Configurar imóveis →"}
              </button>
            </div>
          )}
        </div>}

        {/* ═══════════════════ STEP 2: Configurar imóvel ═══════════════════ */}
        {step===2&&<div className="onboarding-card" style={cardStyle}>
          <BackBtn onClick={()=>setStep(1)}/>
          <StepBadge n={2}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Configure seu imóvel</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>
            Informe os dados do apartamento e como a portaria será avisada — via WhatsApp ou pelo painel digital.
          </p>

          {/* Property selector (if multiple) */}
          {properties.length>1&&<div style={{marginBottom:16}}>
            <label style={labelStyle}>Selecione o imóvel</label>
            <select value={selectedPropId||""} onChange={e=>{setSelectedPropId(e.target.value);setUnitNumber("");setParkingSpot("")}} style={{...inputStyle,cursor:"pointer"}}>
              {properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>}

          {selectedProp&&<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Property name display */}
            {properties.length===1&&<div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:10,padding:"12px 16px"}}>
              <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Imóvel</div>
              <div style={{fontSize:16,fontWeight:700,color:"#1A1A1A"}}>{selectedProp.name}</div>
            </div>}

            {/* Unit + Parking */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <label style={labelStyle}>Nº da Unidade *</label>
                <input value={unitNumber} onChange={e=>setUnitNumber(e.target.value)} placeholder="Ex: 501" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Vaga de garagem</label>
                <input value={parkingSpot} onChange={e=>setParkingSpot(e.target.value)} placeholder="Ex: G1-25" style={inputStyle}/>
              </div>
            </div>

            {/* Condominium or WhatsApp */}
            <div style={{borderTop:"1px solid #E5E5E5",paddingTop:16}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1A1A1A",marginBottom:6}}>Como a portaria será avisada?</div>
              <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:12}}>Se o condomínio é parceiro do AirCheck, use o código dele. Senão, informe o WhatsApp da portaria.</p>

              {condoLinked||selectedProp.condominium?(
                <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:10,padding:"14px 16px"}}>
                  <div style={{fontSize:14,fontWeight:600,color:B.accent}}>🏢 {selectedProp.condominium?.name||"Condomínio vinculado"}</div>
                  <div style={{fontSize:12,color:"#737373",marginTop:4}}>Os dados dos hóspedes serão enviados automaticamente para o painel digital da portaria.</div>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {/* Condo code */}
                  <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                    <div style={{flex:1}}>
                      <label style={labelStyle}>Código do condomínio (se tiver)</label>
                      <input value={condoCode} onChange={e=>setCondoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} maxLength={6} placeholder="Ex: AK3F7B" style={{...inputStyle,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.12em",textAlign:"center"}}/>
                    </div>
                    <button onClick={linkCondo} disabled={condoSaving||condoCode.length<4} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"12px 20px",background:B.primary,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",opacity:condoSaving||condoCode.length<4?0.5:1}}>{condoSaving?"...":"Vincular"}</button>
                  </div>
                  {condoError&&<div style={{fontSize:12,color:"#DC2626"}}>{condoError}</div>}

                  {/* Or WhatsApp */}
                  <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
                    <div style={{flex:1,height:1,background:"#E5E5E5"}}/><span style={{fontSize:12,color:"#A3A3A3",fontWeight:500}}>ou</span><div style={{flex:1,height:1,background:"#E5E5E5"}}/>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={labelStyle}>WhatsApp da portaria *</label>
                      <input value={doormanPhone} onChange={e=>setDoormanPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Nome do porteiro</label>
                      <input value={doormanName} onChange={e=>setDoormanName(e.target.value)} placeholder="Ex: Portaria Central" style={inputStyle}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={saveProperty} disabled={propSaving} style={{...btnStyle(),width:"100%",marginTop:8,opacity:propSaving?0.5:1}}>{propSaving?"Salvando...":"Continuar →"}</button>
          </div>}

          {properties.length===0&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:14,padding:"20px",textAlign:"center"}}>
            <div style={{fontSize:13,color:"#D97706",lineHeight:1.6}}>Nenhum imóvel encontrado. Pode levar alguns segundos após a conexão. <button onClick={loadData} style={{background:"none",border:"none",color:B.primary,fontWeight:600,cursor:"pointer",fontFamily:"Outfit"}}>Tentar novamente</button></div>
          </div>}
        </div>}

        {/* ═══════════════════ STEP 3: Demo do formulário ═══════════════════ */}
        {step===3&&<div className="onboarding-card" style={cardStyle}>
          <BackBtn onClick={()=>setStep(2)}/>
          <StepBadge n={3}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Formulário de check-in</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>
            Cada hóspede recebe um link para preencher seus dados — nome, CPF, RG e placa do veículo. É rápido e feito pelo celular.
          </p>

          {firstReservation&&<div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Link do formulário</div>
            <div style={{fontFamily:"'IBM Plex Mono'",fontSize:12,color:B.primary,background:"#fff",padding:"10px 14px",borderRadius:8,marginBottom:10,wordBreak:"break-all"}}>
              {firstReservation.confirmationCode?`https://airchk.in/c/${firstReservation.confirmationCode}`:`https://airchk.in/checkin/${firstReservation.formToken}`}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{
                const url=firstReservation.confirmationCode?`https://airchk.in/c/${firstReservation.confirmationCode}`:`https://airchk.in/checkin/${firstReservation.formToken}`;
                navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000);
              }} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:copied?B.accent:"#fff",color:copied?"#fff":"#1A1A1A",border:`1px solid ${copied?B.accent:"#E5E5E5"}`,borderRadius:8,cursor:"pointer",transition:"all 0.2s"}}>{copied?"Copiado! ✓":"📋 Copiar link"}</button>
              <a href={firstReservation.confirmationCode?`/c/${firstReservation.confirmationCode}`:`/checkin/${firstReservation.formToken}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:"#fff",color:B.primary,border:`1px solid ${B.primary}`,borderRadius:8,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Abrir formulário ↗</a>
            </div>
          </div>}

          {!firstReservation&&<div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"20px",textAlign:"center",marginBottom:16}}>
            <p style={{fontSize:13,color:"#A3A3A3",lineHeight:1.6}}>Ainda não há reservas importadas. Quando uma reserva for confirmada no Airbnb, o formulário será gerado automaticamente.</p>
          </div>}

          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#D97706",lineHeight:1.6,marginBottom:20}}>
            💡 <strong>Experimente:</strong> abra o formulário e preencha com dados fictícios para ver como funciona. Depois, volte aqui.
          </div>

          <button onClick={()=>setStep(4)} style={{...btnStyle(),width:"100%"}}>Continuar →</button>
        </div>}

        {/* ═══════════════════ STEP 4: Pronto! ═══════════════════ */}
        {step===4&&<div className="onboarding-card" style={cardStyle}>
          <BackBtn onClick={()=>setStep(3)}/>
          <StepBadge n={4}/>

          <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"28px",textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:10}}>🎉</div>
            <h2 style={{fontSize:24,fontWeight:900,color:B.accent,letterSpacing:"-0.03em",marginBottom:8}}>Tudo pronto!</h2>
            <p style={{fontSize:14,color:"#737373",lineHeight:1.7}}>
              Seu AirCheck está configurado. A cada nova reserva no Airbnb, ela aparece automaticamente no seu painel. O hóspede preenche os dados pelo formulário, e a portaria recebe tudo pronto{selectedProp?.condominium?" — direto no painel digital.":" — via WhatsApp com um clique."}
            </p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:B.accent}}>✓</div>
              <span style={{fontSize:14,color:"#1A1A1A"}}>Airbnb conectado — reservas importam automaticamente</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:B.accent}}>✓</div>
              <span style={{fontSize:14,color:"#1A1A1A"}}>{properties.length} imóvel(is) configurado(s)</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:B.accent}}>✓</div>
              <span style={{fontSize:14,color:"#1A1A1A"}}>{reservations.length} reserva(s) no painel</span>
            </div>
          </div>

          <button onClick={completeOnboarding} style={{...btnStyle(),width:"100%"}}>Ir para o painel →</button>
        </div>}

      </div>
    </div>
  );
}
