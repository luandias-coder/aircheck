"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", accent:"#059669", dark:"#0F0F0F" };

function Logo(){return<div style={{display:"flex",alignItems:"center",gap:8}}><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#og)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="og" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg><span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.03em",fontFamily:"Outfit"}}>Air<span style={{background:`linear-gradient(135deg,${B.g1},${B.g2})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Check</span></span></div>}

function maskPhone(v:string){const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`}

interface Reservation { id:string; guestFullName:string; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; formToken:string; status:string; property:{id:string;name:string;unitNumber:string|null;parkingSpot:string|null;doormanPhones:Array<{id:string;phone:string;name:string|null;label:string|null}>}; guests:any[] }

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

  // Step 7
  const[whatsappData,setWhatsappData]=useState<{message:string;links:any[]}|null>(null);

  useEffect(()=>{
    fetch("/api/auth/me").then(async r=>{
      if(!r.ok){router.push("/login");return}
      const u=await r.json();
      setUser(u);
      // If user already has inbound emails, skip step 1
      if(u.inboundEmails?.length>0)setStep(2);
      setLoading(false);
    }).catch(()=>router.push("/login"));
    return()=>{if(pollRef.current)clearInterval(pollRef.current)};
  },[router]);

  // ── Step 1: Save email ──
  const saveEmail=async()=>{
    if(!airbnbEmail||!airbnbEmail.includes("@"))return setEmailError("Digite um email valido");
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
    if(!unitNumber.trim()){alert("Preencha o numero da unidade");return}
    if(!doormanPhone){alert("Preencha o WhatsApp da portaria");return}
    setPropSaving(true);
    // Save unit + parking
    await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_details",unitNumber:unitNumber.trim(),parkingSpot:parkingSpot.trim()})});
    // Add doorman phone if none exist
    if(reservation.property.doormanPhones.length===0){
      await fetch(`/api/properties/${reservation.property.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",phone:doormanPhone,name:doormanName||"Portaria",label:""})});
    }
    // Refresh reservation data
    const rr=await fetch("/api/reservations");
    if(rr.ok){const data=await rr.json();if(data.length>0)setReservation(data[0])}
    setPropSaving(false);setStep(5);
  };

  // ── Step 7: Load WhatsApp data ──
  const loadWhatsapp=async()=>{
    if(!reservation)return;
    const res=await fetch(`/api/reservations/${reservation.id}/whatsapp`);
    if(res.ok)setWhatsappData(await res.json());
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit",color:"#A3A3A3"}}>Carregando...</div>;

  const StepIndicator=()=>(
    <div style={{display:"flex",gap:4,marginBottom:32}}>
      {[1,2,3,4,5,6,7].map(s=>(
        <div key={s} style={{flex:1,height:4,borderRadius:2,background:s<step?B.accent:s===step?B.primary:"#E5E5E5",transition:"background 0.4s"}}/>
      ))}
    </div>
  );

  const Card=({children}:{children:React.ReactNode})=>(
    <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",maxWidth:520,width:"100%"}}>{children}</div>
  );

  const StepLabel=({n}:{n:number})=>(
    <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
      <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{n}</div>
      <span style={{fontSize:12,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.08em"}}>Passo {n} de 7</span>
    </div>
  );

  const Btn=({onClick,disabled,children,secondary}:{onClick:()=>void;disabled?:boolean;children:React.ReactNode;secondary?:boolean})=>(
    <button onClick={onClick} disabled={disabled} style={{fontFamily:"Outfit",fontSize:15,fontWeight:700,padding:"14px 32px",background:secondary?"transparent":`linear-gradient(135deg,${B.g1},${B.g2})`,color:secondary?B.primary:"#fff",border:secondary?`2px solid ${B.primary}`:"none",borderRadius:12,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,boxShadow:secondary?"none":"0 4px 16px rgba(59,95,229,0.3)"}}>{children}</button>
  );

  return(
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"Outfit,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"14px 24px"}}>
        <div style={{maxWidth:560,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Logo/>
          <button onClick={()=>router.push("/dashboard")} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer"}}>Pular setup →</button>
        </div>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"32px 20px 60px"}}>
        <StepIndicator/>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 1: Email do Airbnb                                    */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===1&&<Card>
          <StepLabel n={1}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Qual email voce usa no Airbnb?</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:24}}>Precisamos saber para identificar que os emails encaminhados sao seus.</p>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6}}>Email da sua conta Airbnb</label>
            <input value={airbnbEmail} onChange={e=>setAirbnbEmail(e.target.value)} placeholder="seuemail@gmail.com" type="email" onKeyDown={e=>e.key==="Enter"&&saveEmail()} style={{width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:`1px solid ${emailError?"#DC2626":"#E5E5E5"}`,borderRadius:10,boxSizing:"border-box",outline:"none"}}/>
            {emailError&&<div style={{fontSize:12,color:"#DC2626",marginTop:6}}>{emailError}</div>}
          </div>
          <Btn onClick={saveEmail} disabled={emailSaving||!airbnbEmail}>
            {emailSaving?"Salvando...":"Continuar →"}
          </Btn>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 2: Encaminhar email                                   */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===2&&<Card>
          <StepLabel n={2}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Encaminhe uma reserva</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Abra seu email e encaminhe um email de <strong style={{color:"#1A1A1A"}}>"Reserva confirmada"</strong> do Airbnb para o endereco abaixo. Se possivel, escolha uma reserva futura.</p>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Encaminhe para</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,fontWeight:600,color:B.primary,wordBreak:"break-all"}}>reservas@aircheck.com.br</div>
          </div>

          {!polling&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Btn onClick={startPolling}>Ja encaminhei →</Btn>
          </div>}

          {polling&&<div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 20px",marginBottom:16}}>
              <div style={{width:16,height:16,borderRadius:"50%",border:"3px solid #D97706",borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/>
              <span style={{fontSize:14,fontWeight:600,color:"#D97706"}}>Aguardando sua reserva chegar...</span>
            </div>
            <p style={{fontSize:12,color:"#A3A3A3"}}>Pode levar de 10 a 60 segundos. Nao feche esta pagina.</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>}

          <div style={{marginTop:20,borderTop:"1px solid #F0F0F0",paddingTop:16}}>
            <details style={{cursor:"pointer"}}>
              <summary style={{fontSize:13,fontWeight:600,color:B.primary,listStyle:"none"}}>💡 Sabia que da pra automatizar isso?</summary>
              <div style={{fontSize:12,color:"#737373",lineHeight:1.7,marginTop:10,background:"#FAFAF9",borderRadius:8,padding:12}}>
                No seu provedor de email, crie um filtro/regra para encaminhar automaticamente os emails do Airbnb (<strong>automated@airbnb.com</strong>) para <strong>reservas@aircheck.com.br</strong>. Assim, toda nova reserva aparece no AirCheck sem voce precisar fazer nada!
              </div>
            </details>
          </div>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 3: Reserva chegou!                                    */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===3&&reservation&&<Card>
          <StepLabel n={3}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:100,padding:"6px 14px",marginBottom:16}}>
            <span>✅</span>
            <span style={{fontSize:13,fontWeight:600,color:B.accent}}>Reserva recebida com sucesso!</span>
          </div>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:16}}>Olha so, ja esta aqui.</h2>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:20}}>
            <div style={{fontSize:16,fontWeight:700,color:"#1A1A1A",marginBottom:4}}>{reservation.guestFullName}</div>
            <div style={{fontSize:13,color:"#737373",lineHeight:1.6}}>
              📍 {reservation.property.name}<br/>
              📅 {reservation.checkInDate} → {reservation.checkOutDate}<br/>
              👥 {reservation.numGuests} hospede{reservation.numGuests!==1?"s":""} · {reservation.nights||"?"} noite{reservation.nights!==1?"s":""}
              {reservation.confirmationCode&&<><br/>📋 Codigo: {reservation.confirmationCode}</>}
            </div>
          </div>

          <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:20}}>Essa reserva ja aparece no seu painel. Agora vamos configurar o imovel para que a mensagem da portaria saia completa.</p>
          <Btn onClick={()=>setStep(4)}>Configurar imovel →</Btn>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 4: Configurar imovel                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===4&&reservation&&<Card>
          <StepLabel n={4}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:4}}>{reservation.property.name}</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:24}}>Preencha os dados do imovel. A portaria vai receber essas informacoes junto com os dados do hospede.</p>

          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6}}>Numero da unidade (apartamento/casa) *</label>
              <input value={unitNumber} onChange={e=>setUnitNumber(e.target.value)} placeholder="Ex: 501, Casa 3, Bloco A - 102" style={{width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6}}>Vaga de garagem <span style={{fontWeight:400,color:"#A3A3A3"}}>(opcional)</span></label>
              <input value={parkingSpot} onChange={e=>setParkingSpot(e.target.value)} placeholder="Ex: G1-25, Livre, Nao tem" style={{width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box"}}/>
            </div>
            <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14}}>
              <label style={{fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6}}>WhatsApp da portaria *</label>
              <input value={doormanPhone} onChange={e=>setDoormanPhone(maskPhone(e.target.value))} placeholder="(41) 99999-0000" inputMode="tel" style={{width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box",marginBottom:10}}/>
              <label style={{fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6}}>Nome do contato</label>
              <input value={doormanName} onChange={e=>setDoormanName(e.target.value)} placeholder="Ex: Portaria Central, Joao (porteiro)" style={{width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box"}}/>
            </div>
          </div>

          <Btn onClick={saveProperty} disabled={propSaving}>
            {propSaving?"Salvando...":"Continuar →"}
          </Btn>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 5: Formulario do hospede                              */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===5&&reservation&&<Card>
          <StepLabel n={5}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Formulario de check-in</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Este e o link que voce envia ao hospede. Ele preenche nome, CPF, data de nascimento e tira foto do documento. Veja como fica:</p>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 20px",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Link do formulario</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:B.primary,wordBreak:"break-all",marginBottom:10}}>{typeof window!=="undefined"?window.location.origin:""}/checkin/{reservation.formToken}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/checkin/${reservation.formToken}`);}} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Copiar link</button>
              <a href={`/checkin/${reservation.formToken}`} target="_blank" rel="noopener noreferrer" style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 14px",background:"#fff",color:B.primary,border:`1px solid ${B.primary}`,borderRadius:8,cursor:"pointer",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Abrir formulario ↗</a>
            </div>
          </div>

          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#D97706",lineHeight:1.6,marginBottom:20}}>
            💡 <strong>Dica:</strong> Abra o link acima e preencha com dados ficticios para ver como funciona. Depois, voce pode reabrir o formulario na tela de detalhes da reserva.
          </div>

          <Btn onClick={()=>setStep(6)}>Entendi, continuar →</Btn>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 6: Enviar ao hospede                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===6&&reservation&&<Card>
          <StepLabel n={6}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Envie o link ao hospede</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Copie o link do formulario e envie ao hospede pela <strong style={{color:"#1A1A1A"}}>conversa do Airbnb</strong>.</p>

          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"20px",marginBottom:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>1</div>
                <div style={{fontSize:13,color:"#1A1A1A",lineHeight:1.6}}>Acesse <a href="https://www.airbnb.com.br/hosting/messages" target="_blank" rel="noopener noreferrer" style={{color:B.primary,fontWeight:600}}>airbnb.com.br/hosting/messages</a><br/><span style={{fontSize:12,color:"#737373"}}>(voce precisa estar logado na sua conta de <strong>anfitriao</strong>)</span></div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>2</div>
                <div style={{fontSize:13,color:"#1A1A1A",lineHeight:1.6}}>Abra a conversa com <strong>{reservation.guestFullName}</strong></div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>3</div>
                <div style={{fontSize:13,color:"#1A1A1A",lineHeight:1.6}}>Cole o link do formulario e envie</div>
              </div>
            </div>
          </div>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:10,padding:"12px 16px",fontSize:12,color:B.primary,lineHeight:1.6,marginBottom:20}}>
            📱 O hospede recebe o link, abre no celular, e preenche os dados em menos de 1 minuto. Voce recebe uma notificacao quando ele terminar.
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn onClick={()=>{loadWhatsapp();setStep(7)}}>Continuar →</Btn>
          </div>
        </Card>}

        {/* ════════════════════════════════════════════════════════════ */}
        {/* STEP 7: WhatsApp                                           */}
        {/* ════════════════════════════════════════════════════════════ */}
        {step===7&&reservation&&<Card>
          <StepLabel n={7}/>
          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Pronto! Envie para a portaria.</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Quando o hospede preencher o formulario, voce volta ao painel, abre a reserva e clica em <strong style={{color:"#1A1A1A"}}>"Enviar para portaria"</strong>. A mensagem formatada vai direto pro WhatsApp.</p>

          {whatsappData?<div style={{marginBottom:20}}>
            <div style={{background:"#E7DCCF",borderRadius:14,padding:14}}>
              <div style={{background:"#DCF8C6",borderRadius:10,padding:"10px 12px",fontSize:11,color:"#303030",lineHeight:1.6,whiteSpace:"pre-wrap",fontFamily:"system-ui"}}>{whatsappData.message}</div>
            </div>
            {whatsappData.links.map((l:any,i:number)=>(
              <a key={i} href={l.link} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,marginTop:10,background:"#25D366",color:"#fff",borderRadius:10,padding:"12px 16px",textDecoration:"none",fontFamily:"Outfit",fontSize:14,fontWeight:600}}>
                <span style={{fontSize:20}}>💬</span>
                Enviar para {l.name||"Portaria"} ({l.phone})
              </a>
            ))}
          </div>
          :<div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:"20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:13,color:"#A3A3A3",lineHeight:1.6}}>
              {reservation.guests.length===0
                ?"O formulario ainda nao foi preenchido. Quando o hospede preencher, a mensagem aparecera aqui."
                :"Carregando preview..."}
            </div>
          </div>}

          <div style={{background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:14,padding:"20px",marginBottom:24,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:8}}>🎉</div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent,marginBottom:6}}>Setup completo!</div>
            <div style={{fontSize:13,color:"#737373",lineHeight:1.6}}>Seu AirCheck esta pronto. A partir de agora, a cada nova reserva do Airbnb, basta encaminhar o email (ou configurar o encaminhamento automatico) e repetir o processo.</div>
          </div>

          <Btn onClick={()=>router.push("/dashboard")}>Ir para o painel →</Btn>
        </Card>}
      </div>
    </div>
  );
}
