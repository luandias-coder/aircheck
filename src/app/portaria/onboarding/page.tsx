"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", accent:"#059669" };

function Logo(){return<div style={{display:"flex",alignItems:"center",gap:8}}><svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#pog)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="pog" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg><span style={{fontSize:18,fontWeight:800,letterSpacing:"-0.03em",fontFamily:"Outfit"}}>Air<span style={{color:B.primary}}>Check</span></span></div>}

const cardStyle:React.CSSProperties = {background:"#fff",border:"1px solid #E5E5E5",borderRadius:20,padding:"36px 32px",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",maxWidth:520,width:"100%"};
const inputStyle:React.CSSProperties = {width:"100%",fontFamily:"Outfit",fontSize:15,padding:"12px 16px",border:"1px solid #E5E5E5",borderRadius:10,boxSizing:"border-box" as const,outline:"none",color:"#1A1A1A"};
const labelStyle:React.CSSProperties = {fontSize:12,fontWeight:600,color:"#737373",display:"block",marginBottom:6};
const btnStyle=(secondary?:boolean):React.CSSProperties=>({fontFamily:"Outfit",fontSize:15,fontWeight:700,padding:"14px 32px",background:secondary?"transparent":`linear-gradient(135deg,${B.g1},${B.g2})`,color:secondary?B.primary:"#fff",border:secondary?`2px solid ${B.primary}`:"none",borderRadius:12,cursor:"pointer",boxShadow:secondary?"none":"0 4px 16px rgba(59,95,229,0.3)"});

export default function PortariaOnboarding(){
  const router=useRouter();
  const[step,setStep]=useState(1);
  const[loading,setLoading]=useState(true);
  const[condo,setCondo]=useState<{name:string;code:string;address:string|null}|null>(null);
  const[codeCopied,setCodeCopied]=useState(false);

  // Step 2: add doorman
  const[dmName,setDmName]=useState("");
  const[dmEmail,setDmEmail]=useState("");
  const[dmPassword,setDmPassword]=useState("");
  const[addingDm,setAddingDm]=useState(false);
  const[addedDoormen,setAddedDoormen]=useState<Array<{name:string;email:string}>>([]);
  const[dmError,setDmError]=useState("");

  useEffect(()=>{
    fetch("/api/portaria/auth/me").then(async r=>{
      if(!r.ok){router.push("/portaria/login");return}
      const data=await r.json();
      setCondo(data.condominium);
      setLoading(false);
    }).catch(()=>router.push("/portaria/login"));
  },[router]);

  const addDoorman=async()=>{
    if(!dmName.trim()||!dmEmail.trim()||!dmPassword)return;
    if(dmPassword.length<6){setDmError("Senha deve ter pelo menos 6 caracteres");return}
    setAddingDm(true);setDmError("");
    try{
      const res=await fetch("/api/portaria/settings/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:dmName.trim(),email:dmEmail.trim(),password:dmPassword,role:"porteiro"})});
      if(!res.ok){const d=await res.json();throw new Error(d.error||"Erro")}
      setAddedDoormen(p=>[...p,{name:dmName.trim(),email:dmEmail.trim()}]);
      setDmName("");setDmEmail("");setDmPassword("");
    }catch(e:any){setDmError(e.message)}
    finally{setAddingDm(false)}
  };

  const copyCode=()=>{
    if(!condo)return;
    navigator.clipboard.writeText(condo.code);
    setCodeCopied(true);setTimeout(()=>setCodeCopied(false),2500);
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit",color:"#A3A3A3"}}>Carregando...</div>;

  return(
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"Outfit,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"14px 24px"}}>
        <div style={{maxWidth:560,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Logo/>
          <button onClick={()=>router.push("/portaria")} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer"}}>Pular →</button>
        </div>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:"32px 20px 60px"}}>
        {/* Progress */}
        <div style={{display:"flex",gap:4,marginBottom:32}}>
          {[1,2,3].map(s=>(
            <div key={s} style={{flex:1,height:4,borderRadius:2,background:s<step?B.accent:s===step?B.primary:"#E5E5E5",transition:"background 0.4s"}}/>
          ))}
        </div>

        {/* ═══════════════════ STEP 1 ═══════════════════ */}
        {step===1&&condo&&<div style={cardStyle}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px"}}>🏢</div>
            <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Condomínio cadastrado!</h2>
            <p style={{fontSize:14,color:"#737373",lineHeight:1.6}}>
              <strong style={{color:"#1A1A1A"}}>{condo.name}</strong> está ativo no AirCheck.
            </p>
          </div>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:14,padding:"20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Código de vinculação</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:32,fontWeight:800,color:B.primary,letterSpacing:"0.2em"}}>{condo.code}</div>
            <div style={{fontSize:12,color:"#737373",marginTop:8,lineHeight:1.5}}>Passe esse código para os anfitriões do Airbnb que operam no seu prédio. Eles usam o código para conectar os imóveis ao condomínio.</div>
            <button onClick={copyCode} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,marginTop:12,padding:"8px 20px",background:codeCopied?B.accent:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",transition:"background 0.2s"}}>{codeCopied?"Copiado! ✓":"Copiar código"}</button>
          </div>

          {condo.address&&(
            <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#737373"}}>
              📍 {condo.address} <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(condo.address)}`} target="_blank" rel="noopener noreferrer" style={{color:B.primary,textDecoration:"none",marginLeft:4,fontSize:12,fontWeight:600}}>Ver no mapa →</a>
            </div>
          )}

          <button onClick={()=>setStep(2)} style={btnStyle()}>Continuar →</button>
        </div>}

        {/* ═══════════════════ STEP 2 ═══════════════════ */}
        {step===2&&<div style={cardStyle}>
          <button onClick={()=>setStep(1)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>← Voltar</button>

          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>2</div>
            <span style={{fontSize:12,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.08em"}}>Passo 2 de 3</span>
          </div>

          <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Adicione porteiros</h2>
          <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Cadastre os porteiros que vão acessar o painel de check-ins. Cada um recebe email e senha pra fazer login.</p>

          {/* Added doormen */}
          {addedDoormen.length>0&&(
            <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:6}}>
              {addedDoormen.map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#ECFDF5",border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px"}}>
                  <span style={{fontSize:16}}>✅</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>{d.name}</div>
                    <div style={{fontSize:12,color:"#737373"}}>{d.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div style={{background:"#FAFAF9",border:"1px solid #E5E5E5",borderRadius:14,padding:16,marginBottom:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <label style={labelStyle}>Nome do porteiro</label>
                <input value={dmName} onChange={e=>setDmName(e.target.value)} placeholder="Nome completo" style={inputStyle}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input value={dmEmail} onChange={e=>setDmEmail(e.target.value)} placeholder="porteiro@email.com" type="email" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Senha inicial</label>
                  <input value={dmPassword} onChange={e=>setDmPassword(e.target.value)} placeholder="Mín. 6 caracteres" type="text" style={inputStyle}/>
                </div>
              </div>
              {dmError&&<div style={{fontSize:12,color:"#DC2626"}}>{dmError}</div>}
              <button onClick={addDoorman} disabled={addingDm||!dmName.trim()||!dmEmail.trim()||dmPassword.length<6} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"10px 20px",background:"#fff",color:B.primary,border:`1px solid ${B.muted}`,borderRadius:8,cursor:"pointer",opacity:addingDm||!dmName.trim()||!dmEmail.trim()||dmPassword.length<6?0.5:1,alignSelf:"flex-start"}}>
                {addingDm?"Adicionando...":"+ Adicionar porteiro"}
              </button>
            </div>
          </div>

          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setStep(3)} style={btnStyle()}>
              {addedDoormen.length>0?"Continuar →":"Pular por agora →"}
            </button>
          </div>
        </div>}

        {/* ═══════════════════ STEP 3 ═══════════════════ */}
        {step===3&&condo&&<div style={cardStyle}>
          <button onClick={()=>setStep(2)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:16,display:"flex",alignItems:"center",gap:4}}>← Voltar</button>

          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",margin:"0 auto 16px",boxShadow:`0 8px 32px ${B.primary}40`}}>✓</div>
            <h2 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",marginBottom:8}}>Tudo pronto!</h2>
            <p style={{fontSize:14,color:"#737373",lineHeight:1.6}}>Seu painel da portaria está ativo. Quando anfitriões vincularem imóveis usando o código <strong style={{color:B.primary}}>{condo.code}</strong>, os check-ins aparecerão automaticamente.</p>
          </div>

          <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:14,padding:"20px",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:B.primary,marginBottom:10}}>📋 Próximos passos:</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>1</div>
                <div style={{fontSize:13,color:"#525252",lineHeight:1.5}}>Passe o código <strong style={{color:B.primary}}>{condo.code}</strong> para os anfitriões de Airbnb do prédio</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>2</div>
                <div style={{fontSize:13,color:"#525252",lineHeight:1.5}}>Eles criam conta no AirCheck e vinculam os imóveis usando o código</div>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>3</div>
                <div style={{fontSize:13,color:"#525252",lineHeight:1.5}}>Cada reserva gera um check-in que aparece automaticamente no painel da portaria</div>
              </div>
            </div>
          </div>

          <button onClick={()=>router.push("/portaria")} style={btnStyle()}>Ir para o painel →</button>
        </div>}
      </div>
    </div>
  );
}
