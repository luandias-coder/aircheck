"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomTabBar from "@/components/BottomTabBar";
import CalendarView from "@/components/CalendarView";
import PullToRefresh from "@/components/PullToRefresh";
import SwipeBack from "@/components/SwipeBack";

// ─── BLUE PALETTE ───────────────────────────────────────────────
const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", shadow:"rgba(59,95,229,0.25)", accent:"#059669", dark:"#0F0F0F" };

// ─── TYPES ──────────────────────────────────────────────────────
interface DoormanPhone { id:string; phone:string; name:string|null; label:string|null }
interface Guest { id:string; fullName:string; birthDate:string; cpf:string|null; rg:string|null; foreign:boolean; passport:string|null; rne:string|null; documentUrl:string|null }
interface Property { id:string; name:string; airbnbRoomId:string|null; unitNumber:string|null; parkingSpot:string|null; photoUrl:string|null; internalCode?:string|null; includeDocLinks:boolean; whatsappEnabled:boolean; doormanPhones:DoormanPhone[]; reservationCount:number; condominium:{id:string;name:string;code:string;address:string|null;contactName:string|null;contactPhone:string|null;reportMode:string;doormanWhatsapp:string|null;photoUrl:string|null}|null }
interface Reservation { id:string; guestFullName:string; guestPhone:string|null; guestPhotoUrl:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; hostPayment:string|null; bookedAt?:string|null; airbnbThreadId:string|null; airbnbThreadUrl:string|null; formToken:string; status:string; source?:string; carPlate:string|null; carModel:string|null; property:{id:string;name:string;photoUrl?:string|null;internalCode?:string|null;doormanPhones:DoormanPhone[];whatsappEnabled?:boolean;condominiumId?:string|null;condominium?:{reportMode:string;doormanWhatsapp:string|null}|null}; guests:Guest[] }
interface User { id:string; email:string; name:string|null; inboundEmails:Array<{id:string;email:string}>; checkinPdfMode?:string }

// ─── LOGO ───────────────────────────────────────────────────────
function Logo(){return<div style={{display:"flex",alignItems:"center",gap:10}}>
  <svg width="34" height="34" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#lg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="lg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
  <div><div style={{fontFamily:"Outfit",fontSize:18,fontWeight:800,lineHeight:1,letterSpacing:"-0.03em"}}><span style={{color:"#1A1A1A"}}>Air</span><span style={{color:B.primary}}>Check</span></div><div style={{fontFamily:"Outfit",fontSize:11,color:"#A3A3A3",marginTop:2}}>Painel do anfitrião</div></div>
</div>}

// ─── BADGE ──────────────────────────────────────────────────────
const STATUS: Record<string,{l:string;c:string;bg:string;dot:string}> = {
  pending_form:{l:"Aguardando formulário",c:"#D97706",bg:"#FFFBEB",dot:"#D97706"},
  form_filled:{l:"Formulário preenchido",c:"#059669",bg:"#ECFDF5",dot:"#059669"},
  sent_to_doorman:{l:"Enviado à portaria",c:"#2563EB",bg:"#EFF6FF",dot:"#2563EB"},
  archived:{l:"Arquivada",c:"#737373",bg:"#F5F5F5",dot:"#A3A3A3"},
  cancelled:{l:"Cancelada",c:"#DC2626",bg:"#FEF2F2",dot:"#DC2626"},
};
function Badge({status}:{status:string}){const s=STATUS[status]||STATUS.pending_form;return<span style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"Outfit",fontSize:11,fontWeight:600,color:s.c,background:s.bg,padding:"4px 10px",borderRadius:20}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{s.l}</span>}
function daysUntil(d:string):number{if(!d)return 999;const[dd,mm,yy]=d.split("/").map(Number);const t=new Date(yy,mm-1,dd);const n=new Date();n.setHours(0,0,0,0);return Math.round((t.getTime()-n.getTime())/86400000)}

// ─── PDF VIEWER / SHARE ─────────────────────────────────────
function PdfDownloadButton({reservationId,guestName,checkInDate}:{reservationId:string;guestName:string;checkInDate:string}){
  const[loading,setLoading]=useState(false);
  const[pdfUrl,setPdfUrl]=useState<string|null>(null);
  const[pdfBlob,setPdfBlob]=useState<Blob|null>(null);
  const[sharing,setSharing]=useState(false);
  const safeName=guestName.replace(/[^a-zA-Z0-9 ]/g,"").replace(/\s+/g,"-");
  const filename=`checkin-${safeName}-${checkInDate.replace(/\//g,"-")}.pdf`;

  const openPdf=async()=>{
    setLoading(true);
    try{
      const res=await fetch(`/api/reservations/${reservationId}/pdf`);
      if(!res.ok)throw new Error("Erro ao gerar PDF");
      const blob=await res.blob();
      setPdfBlob(blob);
      setPdfUrl(URL.createObjectURL(blob));
    }catch(e){console.error("[pdf]",e)}
    finally{setLoading(false)}
  };

  const closePdf=()=>{
    if(pdfUrl)URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);setPdfBlob(null);
  };

  const sharePdf=async()=>{
    if(!pdfBlob)return;
    setSharing(true);
    try{
      const file=new File([pdfBlob],filename,{type:"application/pdf"});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:`Check-in ${guestName}`});
      }else{
        // Fallback: download
        const url=URL.createObjectURL(pdfBlob);
        const a=document.createElement("a");a.href=url;a.download=filename;
        document.body.appendChild(a);a.click();document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }catch(e:any){
      if(e?.name!=="AbortError")console.error("[pdf]",e);
    }finally{setSharing(false)}
  };

  const downloadPdf=()=>{
    if(!pdfBlob)return;
    const url=URL.createObjectURL(pdfBlob);
    const a=document.createElement("a");a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return<>
    <button onClick={openPdf} disabled={loading} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:B.primary,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,opacity:loading?0.6:1}}>{loading?"Gerando...":"📄 PDF"}</button>

    {/* ── Fullscreen PDF Viewer ── */}
    {pdfUrl&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,background:"#fff",display:"flex",flexDirection:"column"}}>
      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #E5E5E5",background:"#fff",flexShrink:0}}>
        <button onClick={closePdf} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,padding:"7px 14px",background:"none",color:"#737373",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer"}}>← Voltar</button>
        <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"40%",textAlign:"center"}}>{guestName.split(" ")[0]} · {checkInDate.slice(0,5)}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={downloadPdf} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"7px 12px",background:"#fff",color:B.primary,border:`1px solid ${B.muted}`,borderRadius:8,cursor:"pointer"}}>⬇ Salvar</button>
          <button onClick={sharePdf} disabled={sharing} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"7px 14px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:sharing?0.6:1}}>Compartilhar</button>
        </div>
      </div>
      {/* PDF iframe */}
      <iframe src={pdfUrl} style={{flex:1,border:"none",width:"100%"}} title="PDF Check-in"/>
    </div>}
  </>;
}

// ─── PDF SEND BUTTON ────────────────────────────────────────────
function PdfSendButton({reservationId}:{reservationId:string}){
  const[sending,setSending]=useState(false);
  const[result,setResult]=useState<{ok:boolean;msg:string}|null>(null);
  const send=async()=>{
    setSending(true);setResult(null);
    try{
      const res=await fetch(`/api/reservations/${reservationId}/send-pdf`,{method:"POST"});
      const data=await res.json();
      if(res.ok)setResult({ok:true,msg:`Enviado para ${data.sentTo}`});
      else setResult({ok:false,msg:data.error||"Erro ao enviar"});
    }catch{setResult({ok:false,msg:"Erro de conexão"})}
    setSending(false);
    setTimeout(()=>setResult(null),4000);
  };
  return<div style={{display:"inline-flex",alignItems:"center",gap:8}}>
    <button onClick={send} disabled={sending} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:result?.ok?"#059669":"#fff",color:result?.ok?"#fff":"#1A1A1A",border:`1px solid ${result?.ok?"#059669":"#E5E5E5"}`,borderRadius:10,cursor:"pointer",opacity:sending?0.5:1}}>{sending?"Enviando...":result?.ok?"✓ Enviado":"📧 Enviar por email"}</button>
    {result&&!result.ok&&<span style={{fontSize:12,color:"#DC2626"}}>{result.msg}</span>}
  </div>;
}

// ─── PDF EMAIL TOGGLE ───────────────────────────────────────────
function PdfEmailToggle({user}:{user:User|null}){
  const[mode,setMode]=useState(user?.checkinPdfMode||"off");
  const[saving,setSaving]=useState(false);
  const[loaded,setLoaded]=useState(false);

  useEffect(()=>{
    fetch("/api/settings/preferences").then(r=>r.json()).then(d=>{
      setMode(d.checkinPdfMode||"off");
      setLoaded(true);
    }).catch(()=>setLoaded(true));
  },[]);

  const changeMode=async(newMode:string)=>{
    setMode(newMode);
    setSaving(true);
    await fetch("/api/settings/preferences",{
      method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({checkinPdfMode:newMode}),
    });
    setSaving(false);
  };

  if(!loaded)return null;

  const options=[
    {id:"off",label:"Desativado",desc:"Não enviar PDF por email automaticamente",icon:"🚫"},
    {id:"immediate",label:"Ao preencher",desc:"Receber o PDF assim que o hóspede preencher o formulário",icon:"⚡"},
    {id:"morning",label:"Manhã do check-in",desc:"Receber o PDF às 7h no dia do check-in",icon:"☀️"},
  ];

  return<div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Receber PDF de check-in por email</div>
    <div style={{fontSize:12,color:"#737373",marginBottom:14}}>Quando ativado, você receberá um PDF com os dados completos do hóspede no email <strong>{user?.email}</strong>.</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {options.map(o=><label key={o.id} onClick={()=>changeMode(o.id)} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:mode===o.id?B.light:"#FAFAF9",border:`1px solid ${mode===o.id?B.primary:"#E5E5E5"}`,borderRadius:10,cursor:"pointer",opacity:saving?0.6:1,transition:"all 0.15s"}}>
        <input type="radio" checked={mode===o.id} onChange={()=>changeMode(o.id)} style={{marginTop:2,accentColor:B.primary}}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>{o.icon}</span>
            <span style={{fontSize:13,fontWeight:600,color:mode===o.id?"#1A1A1A":"#525252"}}>{o.label}</span>
          </div>
          <div style={{fontSize:11,color:"#A3A3A3",marginTop:2}}>{o.desc}</div>
        </div>
      </label>)}
    </div>
  </div>;
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Dashboard(){
  const router=useRouter();
  const[condoFromUrl,setCondoFromUrl]=useState<string|null>(null);
  const[tab,setTab]=useState<"reservations"|"properties"|"settings"|"feedback">("reservations");
  const[reservations,setReservations]=useState<Reservation[]>([]);
  const[properties,setProperties]=useState<Property[]>([]);
  const[user,setUser]=useState<User|null>(null);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState<"list"|"detail">("list");
  const[resView,setResView]=useState<"list"|"calendar">("list");
  const[selectedId,setSelectedId]=useState<string|null>(null);
  const[showUserMenu,setShowUserMenu]=useState(false);
  const[hospToast,setHospToast]=useState<{type:"success"|"error";msg:string}|null>(null);

  const fetchData=useCallback(async()=>{
    try{
      const[rr,pr,ur]=await Promise.all([fetch("/api/reservations"),fetch("/api/properties"),fetch("/api/auth/me")]);
      if(rr.ok){
        const data:Reservation[]=await rr.json();
        // Auto-archive past reservations
        const now=new Date();now.setHours(0,0,0,0);
        const toArchive=data.filter(r=>{
          if(r.status==="archived"||r.status==="cancelled")return false;
          if(!r.checkOutDate)return false;
          const[dd,mm,yy]=r.checkOutDate.split("/").map(Number);
          const co=new Date(yy,mm-1,dd);
          return co<now;
        });
        if(toArchive.length>0){
          await Promise.all(toArchive.map(r=>fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"archived"})})));
          toArchive.forEach(r=>r.status="archived");
        }
        data.sort((a,b)=>{const p=(d:string)=>{const[dd,mm,yy]=d.split("/").map(Number);return new Date(yy,mm-1,dd).getTime()};return p(a.checkInDate)-p(b.checkInDate)});
        setReservations(data);
      }
      if(pr.ok)setProperties(await pr.json());
      if(ur.ok){const ud=await ur.json();setUser(ud);if(!ud.onboardingCompleted)router.push("/onboarding")}
      else router.push("/login");
    }catch(e){console.error(e)}finally{setLoading(false)}
  },[router]);
  useEffect(()=>{fetchData()},[fetchData]);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const p=params.get("condo");
    if(p){setCondoFromUrl(p);setTab("properties")}
    // Hospitable OAuth callback
    const hosp=params.get("hospitable");
    if(hosp==="connected"){
      setHospToast({type:"success",msg:"Airbnb conectado! Importando reservas..."});
      setTab("settings");
      window.history.replaceState({},"","/dashboard");
      // Auto-sync reservations
      fetch("/api/auth/hospitable/sync-reservations",{method:"POST"})
        .then(r=>r.json())
        .then(d=>{
          if(d.ok){
            setHospToast({type:"success",msg:`Airbnb conectado! ${d.imported} reserva(s) importada(s), ${d.skipped} já existente(s).`});
            fetchData(); // Refresh dashboard
          }else{
            setHospToast({type:"success",msg:"Airbnb conectado! Reservas serão sincronizadas em breve."});
          }
          setTimeout(()=>setHospToast(null),8000);
        })
        .catch(()=>{
          setHospToast({type:"success",msg:"Airbnb conectado! Reservas serão sincronizadas em breve."});
          setTimeout(()=>setHospToast(null),6000);
        });
    }else if(hosp==="error"){
      const reason=params.get("reason")||"Erro desconhecido";
      setHospToast({type:"error",msg:`Erro ao conectar: ${reason}`});
      setTab("settings");
      window.history.replaceState({},"","/dashboard");
      setTimeout(()=>setHospToast(null),8000);
    }else if(hosp==="already_connected"){
      setHospToast({type:"success",msg:"Seu Airbnb já está conectado."});
      setTab("settings");
      window.history.replaceState({},"","/dashboard");
      setTimeout(()=>setHospToast(null),4000);
    }
  },[]);

  const logout=async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/login")};

  const selected=reservations.find(r=>r.id===selectedId);
  const active=reservations.filter(r=>r.status!=="archived"&&r.status!=="cancelled");
  const archived=reservations.filter(r=>r.status==="archived"||r.status==="cancelled");
  const pending=active.filter(r=>r.status==="pending_form").length;
  const filled=active.filter(r=>r.status==="form_filled").length;
  const upcoming=active.filter(r=>daysUntil(r.checkInDate)>=0).length;

  return(
    <div style={{minHeight:"100vh",background:"#FAFAF9",fontFamily:"Outfit,sans-serif"}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5"}}>
        <div style={{maxWidth:700,margin:"0 auto",padding:"18px 20px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Logo/>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {view==="list"&&tab==="reservations"&&<div/>}
            {/* User avatar */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowUserMenu(!showUserMenu)} style={{width:34,height:34,borderRadius:"50%",background:B.light,border:`2px solid ${showUserMenu?B.primary:"transparent"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:"Outfit",fontSize:13,fontWeight:700,color:B.primary}}>
                {(user?.name||user?.email||"U")[0].toUpperCase()}
              </button>
              {showUserMenu&&<div style={{position:"absolute",right:0,top:42,background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,boxShadow:"0 4px 20px rgba(0,0,0,0.1)",minWidth:200,zIndex:50,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid #F0F0F0"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{user?.name||"Anfitrião"}</div>
                  <div style={{fontSize:11,color:"#A3A3A3",marginTop:2}}>{user?.email}</div>
                </div>
                <button onClick={()=>{setTab("settings");setView("list");setShowUserMenu(false)}} style={{width:"100%",textAlign:"left",padding:"10px 16px",background:"none",border:"none",fontFamily:"Outfit",fontSize:13,color:"#737373",cursor:"pointer"}}>⚙️ Configurações</button>
                <button onClick={logout} style={{width:"100%",textAlign:"left",padding:"10px 16px",background:"none",border:"none",borderTop:"1px solid #F0F0F0",fontFamily:"Outfit",fontSize:13,color:"#DC2626",cursor:"pointer"}}>Sair</button>
              </div>}
            </div>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={fetchData}>
      <div className="dashboard-content" style={{maxWidth:700,margin:"0 auto",padding:"20px 20px 40px"}} onClick={()=>showUserMenu&&setShowUserMenu(false)}>
        {/* Hospitable toast */}
        {hospToast&&<div className="fade-up" style={{background:hospToast.type==="success"?"#ECFDF5":"#FEF2F2",border:`1px solid ${hospToast.type==="success"?"#A7F3D0":"#FECACA"}`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>{hospToast.type==="success"?"✅":"⚠️"}</span>
            <span style={{fontSize:13,fontWeight:500,color:hospToast.type==="success"?"#065F46":"#991B1B"}}>{hospToast.msg}</span>
          </div>
          <button onClick={()=>setHospToast(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:hospToast.type==="success"?"#065F46":"#991B1B",opacity:0.5,padding:0,lineHeight:1}}>✕</button>
        </div>}

        {loading&&<div style={{textAlign:"center",padding:48,color:"#A3A3A3",fontSize:14}}>Carregando...</div>}

        {!loading&&view==="detail"&&selected&&<SwipeBack onBack={()=>{setView("list");setSelectedId(null);fetchData()}}><DetailView res={selected} onBack={()=>{setView("list");setSelectedId(null);fetchData()}} onRefresh={fetchData}/></SwipeBack>}

        {!loading&&view==="list"&&<>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[{l:"Ativas",v:active.length,s:`${upcoming} próxima${upcoming!==1?"s":""}`,i:"📋"},{l:"Pendentes",v:pending,s:"aguardando form",i:"⏳",a:pending>0?"#D97706":undefined},{l:"Prontas",v:filled,s:"para enviar",i:"✅",a:filled>0?"#059669":undefined}].map((c,i)=>(
              <div key={i} className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"16px 14px",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{c.l}</div><div style={{fontFamily:"Outfit",fontSize:26,fontWeight:800,color:c.a||"#1A1A1A",marginTop:4,lineHeight:1}}>{c.v}</div>{c.s&&<div style={{fontSize:12,color:"#A3A3A3",marginTop:4}}>{c.s}</div>}</div><span style={{fontSize:20,opacity:0.5}}>{c.i}</span></div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,borderBottom:"1px solid #F0F0F0",marginBottom:16}}>
            {([["reservations","Reservas",active.length],["properties","Imóveis",properties.length],["feedback","Feedback",null],["settings","Configurações",null]] as const).map(([id,l,n])=>(
              <button key={id} onClick={()=>setTab(id as any)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?B.primary:"#A3A3A3",padding:"10px 16px",background:"none",border:"none",borderBottom:tab===id?`2px solid ${B.primary}`:"2px solid transparent",cursor:"pointer",marginBottom:-1}}>
                {l} {n!==null&&<span style={{marginLeft:4,fontSize:11,fontWeight:700,color:tab===id?B.primary:"#A3A3A3",background:tab===id?B.light:"#F5F5F5",padding:"2px 6px",borderRadius:10}}>{n}</span>}
              </button>
            ))}
          </div>

          {tab==="reservations"?<>
            {/* View toggle: Lista / Calendário */}
            <div style={{display:"flex",gap:4,marginBottom:14}}>
              {([["list","📋 Lista"],["calendar","📅 Calendário"]] as const).map(([v,l])=>(
                <button key={v} onClick={()=>setResView(v)} style={{
                  fontFamily:"Outfit",fontSize:12,fontWeight:resView===v?600:400,padding:"7px 14px",
                  background:resView===v?B.primary:"#fff",
                  color:resView===v?"#fff":"#737373",
                  border:resView===v?"none":"1px solid #E5E5E5",
                  borderRadius:8,cursor:"pointer",
                }}>{l}</button>
              ))}
            </div>
            {resView==="list"
              ?<ReservationsList active={active} archived={archived} onSelect={(id)=>{setSelectedId(id);setView("detail")}}/>
              :<CalendarView reservations={reservations} properties={properties} onSelect={(id)=>{setSelectedId(id);setView("detail")}}/>
            }
          </>
          :tab==="properties"?<PropertiesTab properties={properties} onRefresh={fetchData} initialCondoCode={condoFromUrl||undefined}/>
          :tab==="feedback"?<FeedbackTab/>
          :<SettingsTab user={user} onRefresh={fetchData}/>}
        </>}
      </div>
      </PullToRefresh>

      <BottomTabBar tab={tab} onTabChange={(t) => { setTab(t); setView("list"); }} />
    </div>
  );
}

// ─── RESERVATIONS LIST ──────────────────────────────────────────
function ReservationsList({active,archived,onSelect}:{active:Reservation[];archived:Reservation[];onSelect:(id:string)=>void}){
  const[showArchived,setShowArchived]=useState(false);
  const fmtBookedAt=(d:string|null|undefined)=>{if(!d)return null;const[y,m,dd]=d.split("-");return dd&&m?`${dd}/${m}`:null};
  const RCard=({r}:{r:Reservation})=>{const du=daysUntil(r.checkInDate);const isArch=r.status==="archived";const isCancelled=r.status==="cancelled";const booked=fmtBookedAt(r.bookedAt);return<button key={r.id} onClick={()=>onSelect(r.id)} className="fade-up" style={{width:"100%",textAlign:"left",background:isArch?"#FAFAF9":"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 2px rgba(0,0,0,0.04)",display:"block",transition:"all 0.15s",opacity:(isArch||isCancelled)?0.7:1}} onMouseOver={e=>{e.currentTarget.style.borderColor=B.primary;e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="#F0F0F0";e.currentTarget.style.transform="none"}}>
    <div style={{display:"flex",gap:12}}>
      {/* Guest photo */}
      <div style={{flexShrink:0,paddingTop:2}}>
        {r.guestPhotoUrl?<img src={r.guestPhotoUrl} alt="" style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",border:"2px solid #F0F0F0"}}/>:<div style={{width:42,height:42,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:B.primary}}>{r.guestFullName[0]}</div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        {/* Row 1: Name + urgency badge */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:15,fontWeight:600,color:isCancelled?"#DC2626":"#1A1A1A",textDecoration:isCancelled?"line-through":"none"}}>{r.guestFullName}</span>
          {!isArch&&du>=0&&du<=3&&<span style={{fontSize:11,fontWeight:600,color:du===0?"#DC2626":"#D97706",background:du===0?"#FEF2F2":"#FFFBEB",padding:"2px 8px",borderRadius:12}}>{du===0?"Hoje!":du===1?"Amanhã":"Em "+du+" dias"}</span>}
        </div>
        {/* Row 2: Property name */}
        <div style={{fontSize:12,color:"#737373",marginTop:3,display:"flex",alignItems:"center",gap:5,textDecoration:isCancelled?"line-through":"none",opacity:isCancelled?0.6:1}}>
          {r.property.photoUrl?<img src={r.property.photoUrl} alt="" style={{width:18,height:18,borderRadius:4,objectFit:"cover",flexShrink:0,border:"1px solid #E5E5E5"}}/>:<span style={{width:18,height:18,borderRadius:4,background:B.light,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:8,fontWeight:700,color:B.primary}}>📍</span>}
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.property.name}</span>
        </div>
        {/* Row 3: Dates + guests */}
        <div style={{fontSize:12,color:"#A3A3A3",marginTop:2,textDecoration:isCancelled?"line-through":"none",opacity:isCancelled?0.6:1}}>
          <span style={{fontWeight:500,color:"#525252"}}>{r.checkInDate.slice(0,5)} → {r.checkOutDate.slice(0,5)}</span>
          <span style={{color:"#D1D5DB"}}> · </span>
          <span>{r.numGuests} hósp.</span>
        </div>
      </div>
      {/* Right column: status + code + booking date */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <Badge status={r.status}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {r.source==="hospitable"&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:8,background:"#F3E8FF",color:"#7C3AED"}}>API</span>}
          {r.confirmationCode&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:"#A3A3A3"}}>{r.confirmationCode}</span>}
        </div>
        {booked&&<span style={{fontSize:10,color:"#D4D4D4"}}>Res. {booked}</span>}
      </div>
    </div>
  </button>};
  return<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {active.length===0&&<div style={{textAlign:"center",padding:48,color:"#A3A3A3",fontSize:14}}>Nenhuma reserva ativa.</div>}
    {active.map(r=><RCard key={r.id} r={r}/>)}
    {archived.length>0&&<>
      <button onClick={()=>setShowArchived(!showArchived)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:"12px 0 4px",display:"flex",alignItems:"center",gap:6}}>
        <span style={{transform:showArchived?"rotate(90deg)":"",transition:"transform 0.2s",fontSize:10}}>▶</span>
        Arquivadas ({archived.length})
      </button>
      {showArchived&&archived.map(r=><RCard key={r.id} r={r}/>)}
    </>}
  </div>
}

// ─── NEW RESERVATION ────────────────────────────────────────────
// ─── DETAIL VIEW ────────────────────────────────────────────────
function DetailView({res:r,onBack,onRefresh}:{res:Reservation;onBack:()=>void;onRefresh:()=>void}){
  const[copied,setCopied]=useState(false);
  const[copiedMsg,setCopiedMsg]=useState(false);
  const[waData,setWaData]=useState<{message:string;links:Array<{phone:string;name:string|null;label:string|null;link:string}>}|null>(null);
  const[showWa,setShowWa]=useState(false);
  const[deleting,setDeleting]=useState(false);

  const shortDomain="https://airchk.in";
  const formUrl=r.confirmationCode?`${shortDomain}/c/${r.confirmationCode}`:`${shortDomain}/checkin/${r.formToken}`;
  const formUrlShort=r.confirmationCode?`airchk.in/c/${r.confirmationCode}`:`airchk.in/checkin/${r.formToken}`;
  const copy=()=>{navigator.clipboard.writeText(formUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)};
  const hasGuests=r.guests.length>0;
  const fetchWa=async()=>{const res=await fetch(`/api/reservations/${r.id}/whatsapp`);if(res.ok){setWaData(await res.json());setShowWa(true)}};
  const markSent=async()=>{await fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"sent_to_doorman"})});onRefresh()};
  const handleDelete=async()=>{if(!confirm("Tem certeza que deseja excluir esta reserva?"))return;setDeleting(true);await fetch(`/api/reservations/${r.id}`,{method:"DELETE"});onBack()};

  const checkinMsg=`Olá ${r.guestFullName.split(" ")[0]}! 😊\n\nPara agilizar seu check-in, por favor preencha este formulário com os dados dos hóspedes. É necessário para liberação na portaria do condomínio e leva menos de 1 minuto.\n\n${formUrl}\n\nQualquer dúvida, estou à disposição!`;
  const copyCheckinMsg=()=>{navigator.clipboard.writeText(checkinMsg);setCopiedMsg(true);setTimeout(()=>setCopiedMsg(false),2500)};

  return<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><button onClick={onBack} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"7px 14px",background:"none",color:"#737373",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer"}}>← Voltar</button><button onClick={handleDelete} disabled={deleting} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"7px 14px",background:"none",color:"#DC2626",border:"1px solid #FEE2E2",borderRadius:8,cursor:"pointer",opacity:deleting?0.5:1}}>{deleting?"...":"🗑 Excluir"}</button></div>

    <div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          {r.guestPhotoUrl?<img src={r.guestPhotoUrl} alt="" style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:"3px solid #F0F0F0"}}/>:<div style={{width:56,height:56,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:B.primary}}>{r.guestFullName[0]}</div>}
          <div><div style={{fontSize:22,fontWeight:800,color:"#1A1A1A"}}>{r.guestFullName}</div><div style={{fontSize:13,color:"#A3A3A3",marginTop:2}}>📍 {r.property.name}{r.property.internalCode&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,marginLeft:6,opacity:0.5}}>{r.property.internalCode}</span>}</div></div>
        </div>
        <Badge status={r.status}/>
      </div>
      <div className="detail-stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:18,paddingTop:14,borderTop:"1px solid #F0F0F0"}}>
        {[{l:"Check-in",v:r.checkInDate,s:r.checkInTime},{l:"Check-out",v:r.checkOutDate,s:r.checkOutTime},{l:"Hóspedes",v:String(r.numGuests)},{l:"Código",v:r.confirmationCode,m:true}].map((x,i)=><div key={i}><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{x.l}</div><div style={{fontFamily:x.m?"'IBM Plex Mono'":"Outfit",fontSize:14,fontWeight:600,color:"#1A1A1A",marginTop:3}}>{x.v||"—"}</div>{x.s&&<div style={{fontSize:12,color:"#A3A3A3"}}>{x.s}</div>}</div>)}
      </div>
      {r.hostPayment&&<div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#A3A3A3"}}>Pagamento do anfitrião</span><span style={{fontSize:16,fontWeight:700,color:"#059669"}}>{r.hostPayment}</span></div>}
      {r.bookedAt&&<div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#A3A3A3"}}>Reservado em</span><span style={{fontSize:13,fontWeight:600,color:"#525252"}}>{(()=>{const[y,m,d]=r.bookedAt.split("-");return d&&m&&y?`${d}/${m}/${y}`:"—"})()}</span></div>}
      {r.guestPhone&&<div style={{marginTop:12,fontSize:13,color:"#737373"}}>📱 Contato: <strong style={{color:"#1A1A1A"}}>{r.guestPhone}</strong></div>}
    </div>

    {/* Send form link to guest via Airbnb chat */}
    <div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Enviar formulário ao hóspede</div>
      {/* Preview of message */}
      <div style={{background:"#FAFAF9",border:"1px solid #F0F0F0",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
        <pre style={{fontFamily:"Outfit",fontSize:12,color:"#374151",whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.6,margin:0}}>{checkinMsg}</pre>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {r.airbnbThreadUrl&&<a href={r.airbnbThreadUrl} target="_blank" rel="noopener noreferrer" style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:"#FF5A5F",color:"#fff",border:"none",borderRadius:10,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer"}}>💬 Enviar link ao hóspede</a>}
        <button onClick={copyCheckinMsg} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:copiedMsg?"#059669":"#fff",color:copiedMsg?"#fff":"#1A1A1A",border:`1px solid ${copiedMsg?"#059669":"#E5E5E5"}`,borderRadius:10,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>{copiedMsg?"✓ Copiado":"📋 Copiar mensagem"}</button>
      </div>
      {!r.airbnbThreadUrl&&<div style={{fontSize:11,color:"#A3A3A3",marginTop:8}}>⚠️ Link do chat Airbnb não disponível — copie a mensagem e envie manualmente.</div>}
    </div>

    {/* Form URL (simple copy) */}
    <div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Link do formulário</div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{flex:1,fontFamily:"'IBM Plex Mono'",fontSize:12,color:B.primary,background:B.light,padding:"10px 14px",borderRadius:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formUrl}</div><button onClick={copy} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 16px",background:copied?"#059669":"#fff",color:copied?"#fff":"#1A1A1A",border:`1px solid ${copied?"#059669":"#E5E5E5"}`,borderRadius:8,cursor:"pointer",minWidth:90,textAlign:"center"}}>{copied?"✓ Copiado":"Copiar"}</button></div>
    </div>

    {hasGuests?<div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Dados dos hóspedes</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {r.guests.map(g=><div key={g.id} style={{background:"#FAFAF9",borderRadius:10,padding:"12px 14px",border:"1px solid #F0F0F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:"#1A1A1A"}}>{g.fullName} {g.foreign&&<span style={{fontSize:11,color:B.primary}}>🌍</span>}</div></div>
          <div style={{fontSize:12,color:"#737373",marginTop:4,display:"flex",gap:14,flexWrap:"wrap"}}>{g.birthDate&&<span>🎂 {g.birthDate}</span>}{g.foreign?<>{g.passport&&<span>🛂 {g.passport}</span>}{g.rne&&<span>RNE: {g.rne}</span>}</>:<>{g.cpf&&<span>CPF: {g.cpf}</span>}{g.rg&&<span>RG: {g.rg}</span>}</>}</div>
        </div>)}
      </div>
      {(r.carPlate||r.carModel)&&<div style={{fontSize:13,color:"#737373",marginTop:10}}>🚗 {[r.carModel,r.carPlate].filter(Boolean).join(" · ")}</div>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
        {(r.status==="form_filled"||r.status==="sent_to_doorman")&&<button onClick={async()=>{if(!confirm("Reabrir o formulário? O hóspede poderá preencher novamente e os dados atuais serão substituídos."))return;await fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"pending_form"})});onRefresh()}} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"8px 14px",background:"none",color:"#D97706",border:"1px solid #FDE68A",borderRadius:8,cursor:"pointer"}}>🔓 Reabrir formulário</button>}
        <button onClick={async()=>{if(!confirm(`Adicionar mais 1 hóspede? (atual: ${r.numGuests}). O formulário será reaberto para o hóspede preencher os dados do novo acompanhante.`))return;await fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({numGuests:r.numGuests+1,status:"pending_form"})});onRefresh()}} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"8px 14px",background:"none",color:B.primary,border:`1px solid ${B.muted}`,borderRadius:8,cursor:"pointer"}}>👤+ Adicionar hóspede</button>
      </div>
    </div>
    :<div className="fade-up" style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:"16px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⏳</div><div><div style={{fontSize:14,fontWeight:600,color:"#D97706"}}>Aguardando preenchimento</div><div style={{fontSize:12,color:"#D97706",marginTop:2}}>O hóspede ainda não preencheu o formulário ({r.numGuests} hóspede{r.numGuests!==1?"s":""}).</div></div></div>
      <button onClick={async()=>{if(!confirm(`Adicionar mais 1 hóspede? (atual: ${r.numGuests})`))return;await fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({numGuests:r.numGuests+1})});onRefresh()}} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"8px 14px",background:"none",color:B.primary,border:`1px solid ${B.muted}`,borderRadius:8,cursor:"pointer",marginTop:12}}>👤+ Adicionar hóspede</button>
    </div>}

    {/* ── PDF Download / Share & Send ── */}
    {hasGuests&&<div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Comprovante PDF</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <PdfDownloadButton reservationId={r.id} guestName={r.guestFullName} checkInDate={r.checkInDate}/>
        <PdfSendButton reservationId={r.id}/>
      </div>
    </div>}

    {hasGuests&&(!(r.property.condominium?.reportMode==="dashboard"&&r.property.condominiumId))&&<div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Enviar para portaria</div>
      {r.property.doormanPhones.length===0&&!(r.property.condominium?.reportMode==="whatsapp")?<div style={{background:"#FFFBEB",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#D97706"}}>⚠️ Configure portaria(s) na aba Imóveis</div>
      :!waData?<button onClick={fetchWa} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"10px 18px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,cursor:"pointer"}}>Gerar mensagem WhatsApp</button>
      :<div>
        {showWa&&<pre style={{fontFamily:"Outfit",fontSize:12,color:"#374151",whiteSpace:"pre-wrap",lineHeight:1.7,background:"#F0FDF4",border:"1px solid #BBF7D0",padding:14,borderRadius:10,marginBottom:10}}>{waData.message}</pre>}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <button onClick={()=>setShowWa(!showWa)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,color:B.primary,background:"none",border:"none",cursor:"pointer",padding:0}}>{showWa?"Esconder":"Ver"} mensagem</button>
          <button onClick={()=>{setWaData(null)}} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,color:"#737373",background:"none",border:"none",cursor:"pointer",padding:0}}>↻ Atualizar</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {waData.links.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF9",borderRadius:10,padding:"10px 14px",border:"1px solid #F0F0F0"}}>
            <div><div style={{fontSize:13,fontWeight:500,color:"#1A1A1A"}}>{d.name||"Portaria"}</div><div style={{fontSize:11,color:"#A3A3A3"}}>{d.label} · {d.phone}</div></div>
            <a href={d.link} target="_blank" rel="noopener noreferrer" onClick={markSent} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"7px 16px",background:"#25D366",color:"#fff",borderRadius:20,textDecoration:"none",boxShadow:"0 2px 8px rgba(37,211,102,0.3)"}}>WhatsApp →</a>
          </div>)}
        </div>
      </div>}
    </div>}
    {hasGuests&&r.property.condominium?.reportMode==="dashboard"&&r.property.condominiumId&&<div className="fade-up" style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:13,color:"#059669",fontWeight:500}}>🏢 Dados enviados pelo painel da portaria</div>
      <div style={{fontSize:12,color:"#737373",marginTop:4}}>O condomínio configurou o recebimento via painel digital. Os dados desta reserva serão acessados diretamente pelo porteiro.</div>
    </div>}
  </div>
}

// ─── SETTINGS TAB ───────────────────────────────────────────────
function SettingsTab({user,onRefresh}:{user:User|null;onRefresh:()=>void}){
  const[newEmail,setNewEmail]=useState("");
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  // Password change
  const[curPw,setCurPw]=useState("");
  const[newPw,setNewPw]=useState("");
  const[confirmPw,setConfirmPw]=useState("");
  const[pwSaving,setPwSaving]=useState(false);
  const[pwMsg,setPwMsg]=useState<{t:"ok"|"err";m:string}|null>(null);

  const addEmail=async()=>{if(!newEmail)return;setSaving(true);setError("");const res=await fetch("/api/settings/inbound-emails",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:newEmail})});if(!res.ok){setError((await res.json()).error||"Erro");setSaving(false);return}setNewEmail("");setSaving(false);onRefresh()};
  const removeEmail=async(id:string)=>{await fetch("/api/settings/inbound-emails",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});onRefresh()};
  const changePw=async()=>{
    setPwMsg(null);
    if(!curPw||!newPw)return setPwMsg({t:"err",m:"Preencha todos os campos"});
    if(newPw.length<6)return setPwMsg({t:"err",m:"Mínimo 6 caracteres"});
    if(newPw!==confirmPw)return setPwMsg({t:"err",m:"As senhas não coincidem"});
    setPwSaving(true);
    const res=await fetch("/api/auth/password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:curPw,newPassword:newPw})});
    if(res.ok){setPwMsg({t:"ok",m:"Senha alterada com sucesso!"});setCurPw("");setNewPw("");setConfirmPw("")}
    else{const d=await res.json().catch(()=>({}));setPwMsg({t:"err",m:d.error||"Erro ao alterar senha"})}
    setPwSaving(false);
  };

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Profile */}
    <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Sua conta</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:B.primary}}>{(user?.name||user?.email||"U")[0].toUpperCase()}</div>
        <div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A"}}>{user?.name||"Anfitrião"}</div><div style={{fontSize:13,color:"#A3A3A3"}}>{user?.email}</div></div>
      </div>
    </div>

    {/* Hospitable Connect */}
    <HospitableConnectSection/>

    {/* PDF por email toggle */}
    <PdfEmailToggle user={user}/>

    {/* Password change */}
    <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Alterar senha</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Senha atual</label><input type="password" value={curPw} onChange={e=>setCurPw(e.target.value)} style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,boxSizing:"border-box"}}/></div>
        <div className="settings-password-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Nova senha</label><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Mín. 6 caracteres" style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:`1px solid ${newPw&&newPw.length<6?"#DC2626":"#E5E5E5"}`,borderRadius:8,boxSizing:"border-box"}}/></div>
          <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Confirmar nova senha</label><input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:`1px solid ${confirmPw&&confirmPw!==newPw?"#DC2626":"#E5E5E5"}`,borderRadius:8,boxSizing:"border-box"}}/></div>
        </div>
        {pwMsg&&<div style={{background:pwMsg.t==="ok"?"#ECFDF5":"#FEF2F2",borderRadius:8,padding:"8px 12px",fontSize:12,color:pwMsg.t==="ok"?"#059669":"#DC2626"}}>{pwMsg.m}</div>}
        <button onClick={changePw} disabled={pwSaving||!curPw||!newPw||!confirmPw} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:pwSaving||!curPw||!newPw||!confirmPw?0.5:1,alignSelf:"flex-start"}}>{pwSaving?"Alterando...":"Alterar senha"}</button>
      </div>
    </div>
  </div>}

// ─── AIRBNB CONNECT SECTION ─────────────────────────────────────
function HospitableConnectSection(){
  const[status,setStatus]=useState<{connected:boolean;connectedAt?:string;linkedProperties?:number;hospReservations?:number}|null>(null);
  const[loading,setLoading]=useState(true);
  const[disconnecting,setDisconnecting]=useState(false);
  const[syncing,setSyncing]=useState(false);
  const[syncMsg,setSyncMsg]=useState<string|null>(null);

  const loadStatus=()=>{
    fetch("/api/auth/hospitable/status").then(r=>r.json()).then(setStatus).catch(()=>setStatus({connected:false})).finally(()=>setLoading(false));
  };
  useEffect(()=>{loadStatus()},[]);

  const disconnect=async()=>{
    if(!confirm("Desconectar Airbnb? Novas reservas não serão mais importadas automaticamente."))return;
    setDisconnecting(true);
    await fetch("/api/auth/hospitable/status",{method:"DELETE"});
    setStatus({connected:false});
    setDisconnecting(false);
  };

  const syncReservations=async()=>{
    setSyncing(true);setSyncMsg(null);
    try{
      const res=await fetch("/api/auth/hospitable/sync-reservations",{method:"POST"});
      const d=await res.json();
      if(d.ok){
        setSyncMsg(`${d.imported} importada(s), ${d.skipped} já existente(s)`);
        loadStatus();
      }else{
        setSyncMsg(d.error||"Erro ao sincronizar");
      }
    }catch{setSyncMsg("Erro de conexão")}
    finally{setSyncing(false);setTimeout(()=>setSyncMsg(null),5000)}
  };

  if(loading)return<div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Conexão com Airbnb</div>
    <div style={{fontSize:13,color:"#A3A3A3"}}>Verificando...</div>
  </div>;

  return<div style={{background:"#fff",border:`1px solid ${status?.connected?"#A7F3D0":"#F0F0F0"}`,borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Conexão com Airbnb</div>
      {status?.connected&&<span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,background:"#ECFDF5",color:"#059669"}}>CONECTADO</span>}
    </div>

    {status?.connected?(
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🔗</div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:"#1A1A1A"}}>Airbnb conectado</div>
            <div style={{fontSize:12,color:"#737373",marginTop:2}}>Reservas são importadas automaticamente</div>
          </div>
        </div>
        <div style={{display:"flex",gap:16,marginBottom:12}}>
          <div style={{fontSize:12,color:"#737373"}}><strong style={{color:"#1A1A1A"}}>{status.linkedProperties||0}</strong> imóveis</div>
          <div style={{fontSize:12,color:"#737373"}}><strong style={{color:"#1A1A1A"}}>{status.hospReservations||0}</strong> reservas importadas</div>
        </div>
        {/* Auto-message indicator */}
        <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>💬</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#059669"}}>Mensagem automática ativada</div>
            <div style={{fontSize:11,color:"#737373",marginTop:1}}>O link do formulário de check-in é enviado automaticamente no chat do Airbnb a cada nova reserva.</div>
          </div>
        </div>
        {syncMsg&&<div style={{background:"#ECFDF5",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#059669",marginBottom:10}}>{syncMsg}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={syncReservations} disabled={syncing} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"6px 14px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:syncing?0.5:1}}>{syncing?"Sincronizando...":"↻ Sincronizar reservas"}</button>
          <button onClick={disconnect} disabled={disconnecting} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"6px 14px",background:"none",color:"#DC2626",border:"1px solid #FEE2E2",borderRadius:8,cursor:"pointer",opacity:disconnecting?0.5:1}}>{disconnecting?"...":"Desconectar"}</button>
        </div>
      </div>
    ):(
      <div>
        <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:14}}>Conecte sua conta do Airbnb para importar seus imóveis e receber reservas automaticamente no AirCheck.</p>
        <a href="/api/auth/hospitable/connect" style={{display:"inline-flex",alignItems:"center",gap:8,fontFamily:"Outfit",fontSize:14,fontWeight:600,padding:"11px 22px",background:B.primary,color:"#fff",border:"none",borderRadius:10,textDecoration:"none",cursor:"pointer",boxShadow:`0 2px 8px ${B.shadow}`}}>
          🔗 Conectar meu Airbnb
        </a>
        <div style={{fontSize:11,color:"#A3A3A3",marginTop:10}}>Gratuito · Não altera seu calendário ou preços</div>
      </div>
    )}
  </div>;
}

// ─── FEEDBACK TAB ───────────────────────────────────────────────
const CATEGORIES=[{id:"sugestao",emoji:"💡",label:"Sugestão"},{id:"bug",emoji:"🐛",label:"Problema"},{id:"elogio",emoji:"🎉",label:"Elogio"}];

function FeedbackTab(){
  const[feedbacks,setFeedbacks]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[rating,setRating]=useState(0);
  const[hoverRating,setHoverRating]=useState(0);
  const[category,setCategory]=useState("sugestao");
  const[message,setMessage]=useState("");
  const[sending,setSending]=useState(false);
  const[sent,setSent]=useState(false);

  useEffect(()=>{fetch("/api/feedback").then(r=>r.json()).then(setFeedbacks).catch(()=>{}).finally(()=>setLoading(false))},[]);

  const submit=async()=>{
    if(!rating||!message.trim())return;
    setSending(true);
    try{
      const res=await fetch("/api/feedback",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rating,category,message})});
      if(!res.ok)throw new Error();
      const fb=await res.json();
      setFeedbacks(p=>[fb,...p]);
      setRating(0);setMessage("");setSent(true);
      setTimeout(()=>setSent(false),3000);
    }catch{alert("Erro ao enviar. Tente novamente.")}
    finally{setSending(false)}
  };

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Submit form */}
    <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <h3 style={{fontFamily:"Outfit",fontSize:16,fontWeight:700,color:"#1A1A1A",margin:"0 0 4px"}}>Envie seu feedback</h3>
      <p style={{fontFamily:"Outfit",fontSize:13,color:"#A3A3A3",margin:"0 0 16px"}}>Sua opinião nos ajuda a melhorar o AirCheck.</p>

      {/* Star rating */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Como está sua experiência?</div>
        <div style={{display:"flex",gap:4}}>
          {[1,2,3,4,5].map(n=><button key={n}
            onMouseEnter={()=>setHoverRating(n)} onMouseLeave={()=>setHoverRating(0)}
            onClick={()=>setRating(n)}
            style={{background:"none",border:"none",cursor:"pointer",fontSize:28,padding:4,transition:"transform 0.15s",transform:(hoverRating||rating)>=n?"scale(1.15)":"scale(1)"}}>
            {(hoverRating||rating)>=n?"⭐":"☆"}
          </button>)}
          {rating>0&&<span style={{fontSize:12,color:"#A3A3A3",alignSelf:"center",marginLeft:8}}>
            {["","Ruim","Regular","Bom","Muito bom","Excelente"][rating]}
          </span>}
        </div>
      </div>

      {/* Category */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Tipo</div>
        <div style={{display:"flex",gap:8}}>
          {CATEGORIES.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} style={{
            fontFamily:"Outfit",fontSize:13,fontWeight:category===c.id?600:400,
            padding:"8px 14px",borderRadius:10,cursor:"pointer",transition:"all 0.2s",
            background:category===c.id?B.light:"#FAFAF9",
            color:category===c.id?B.primary:"#737373",
            border:`1px solid ${category===c.id?B.muted:"#E5E5E5"}`,
          }}>{c.emoji} {c.label}</button>)}
        </div>
      </div>

      {/* Message */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Mensagem</div>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Conte como podemos melhorar, sugira uma funcionalidade, ou nos diga o que está gostando..." rows={4} style={{
          width:"100%",fontFamily:"Outfit",fontSize:14,color:"#1A1A1A",padding:"12px 14px",border:"1px solid #E5E5E5",borderRadius:10,background:"#fff",boxSizing:"border-box",resize:"vertical",lineHeight:1.6,
        }}/>
      </div>

      <button onClick={submit} disabled={!rating||!message.trim()||sending} style={{
        fontFamily:"Outfit",fontSize:14,fontWeight:600,padding:"12px 24px",
        background:sent?B.accent:(!rating||!message.trim())?"#D4D4D4":B.primary,
        color:"#fff",border:"none",borderRadius:10,cursor:(!rating||!message.trim()||sending)?"not-allowed":"pointer",
        opacity:sending?0.6:1,transition:"background 0.2s",
      }}>{sent?"✓ Enviado! Obrigado!":sending?"Enviando...":"Enviar feedback"}</button>
    </div>

    {/* Previous feedbacks */}
    {loading?<div style={{textAlign:"center",padding:24,color:"#A3A3A3",fontSize:13}}>Carregando...</div>
    :feedbacks.length>0&&<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Seus feedbacks anteriores</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {feedbacks.map((f:any)=>{
          const cat=CATEGORIES.find(c=>c.id===f.category);
          const statusInfo:Record<string,{label:string;color:string;bg:string}>={
            new:{label:"Enviado",color:"#D97706",bg:"#FFFBEB"},
            seen:{label:"Visto",color:"#2563EB",bg:"#EFF6FF"},
            planned:{label:"Planejado",color:"#7C3AED",bg:"#F5F3FF"},
            done:{label:"Implementado",color:"#059669",bg:"#ECFDF5"},
          };
          const st=statusInfo[f.status]||statusInfo.new;
          return<div key={f.id} style={{background:"#FAFAF9",borderRadius:10,padding:"12px 14px",border:"1px solid #F0F0F0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14}}>{cat?.emoji||"💡"}</span>
                <span style={{fontSize:12,fontWeight:600,color:"#1A1A1A"}}>{cat?.label||"Sugestão"}</span>
                <span style={{fontSize:12,color:"#D4D4D4"}}>·</span>
                <span style={{fontSize:12}}>{"⭐".repeat(f.rating)}</span>
              </div>
              <span style={{fontSize:10,fontWeight:600,color:st.color,background:st.bg,padding:"3px 8px",borderRadius:6}}>{st.label}</span>
            </div>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.5}}>{f.message}</div>
            {f.adminNote&&<div style={{marginTop:8,padding:"8px 12px",background:B.light,borderRadius:8,fontSize:12,color:B.primary,lineHeight:1.5}}>
              <span style={{fontWeight:600}}>Resposta:</span> {f.adminNote}
            </div>}
            <div style={{fontSize:11,color:"#A3A3A3",marginTop:6}}>{new Date(f.createdAt).toLocaleDateString("pt-BR")}</div>
          </div>
        })}
      </div>
    </div>}
  </div>
}

// ─── PROPERTIES TAB ─────────────────────────────────────────────
function PropertiesTab({properties,onRefresh,initialCondoCode}:{properties:Property[];onRefresh:()=>void;initialCondoCode?:string}){
  const[editingId,setEditingId]=useState<string|null>(null);
  const[form,setForm]=useState({phone:"",name:"",label:""});
  const[details,setDetails]=useState({unitNumber:"",parkingSpot:""});
  const[condoCode,setCondoCode]=useState(initialCondoCode||"");
  const[condoError,setCondoError]=useState("");
  const[condoSaving,setCondoSaving]=useState(false);
  const[saving,setSaving]=useState(false);
  const[savingDetails,setSavingDetails]=useState(false);

  const startEdit=(p:Property)=>{if(editingId===p.id){setEditingId(null)}else{setEditingId(p.id);setDetails({unitNumber:p.unitNumber||"",parkingSpot:p.parkingSpot||""});setCondoCode("");setCondoError("")}};
  const maskPhone=(v:string)=>{const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`};
  const addPhone=async(propId:string)=>{if(!form.phone)return;setSaving(true);await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",...form})});setForm({phone:"",name:"",label:""});setSaving(false);onRefresh()};
  const removePhone=async(propId:string,phoneId:string)=>{await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"remove_phone",phoneId})});onRefresh()};
  const saveDetails=async(propId:string)=>{if(!details.unitNumber.trim()){alert("Nº da Unidade é obrigatório");return}setSavingDetails(true);await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"update_details",unitNumber:details.unitNumber.trim(),parkingSpot:details.parkingSpot.trim()})});setSavingDetails(false);onRefresh()};
  const linkCondo=async(propId:string)=>{if(!condoCode.trim())return;setCondoSaving(true);setCondoError("");const res=await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"link_condominium",code:condoCode.trim()})});if(!res.ok){const d=await res.json();setCondoError(d.error||"Erro")}else{setCondoCode("")}setCondoSaving(false);onRefresh()};
  const unlinkCondo=async(propId:string)=>{if(!confirm("Desvincular este imóvel do condomínio?"))return;await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"unlink_condominium"})});onRefresh()};

  if(properties.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:48,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>🏠</div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>Nenhum imóvel ainda</div><div style={{fontSize:13,color:"#A3A3A3"}}>Crie uma reserva e o imóvel aparece automaticamente.</div></div>;

  return<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:B.light,borderRadius:10,padding:"10px 14px",fontSize:12,color:B.primary}}><span>💡</span>Imóveis são criados automaticamente. Configure aqui o nº da unidade, vaga de garagem, portarias e condomínio parceiro.</div>
    {initialCondoCode&&<div style={{display:"flex",alignItems:"center",gap:8,background:"#F0F4FF",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#3B5FE5",border:"1px solid #D4DEFF"}}><span>🏢</span>Você foi convidado por um condomínio! Edite um imóvel abaixo e vincule usando o código <strong>{initialCondoCode}</strong>.</div>}
    {properties.map(p=><div key={p.id} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:14}}>{p.photoUrl?<img src={p.photoUrl} alt="" style={{width:48,height:48,borderRadius:10,objectFit:"cover",border:"1px solid #E5E5E5",flexShrink:0}}/>:<div style={{width:48,height:48,borderRadius:10,background:"#F5F5F4",border:"1px solid #E5E5E5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,opacity:0.4}}>🏠</div>}<div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16,fontWeight:600,color:"#1A1A1A"}}>{p.name}</span>{p.internalCode&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:10,fontWeight:500,color:"#A3A3A3",opacity:0.6}}>{p.internalCode}</span>}{p.airbnbRoomId&&<a href={`https://www.airbnb.com.br/rooms/${p.airbnbRoomId}`} target="_blank" rel="noopener noreferrer" title="Ver no Airbnb" onClick={e=>e.stopPropagation()} style={{display:"inline-flex",flexShrink:0,opacity:0.85}}><svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M16 2C8.27812 2 2 8.27812 2 16C2 23.7219 8.27812 30 16 30C23.7219 30 30 23.7219 30 16C30 8.27812 23.7219 2 16 2Z" fill="#FF5A5F"/><path d="M16.0003 19.6867C15.0825 18.5322 14.5426 17.5201 14.3626 16.6542C14.1826 15.9506 14.2546 15.3914 14.5605 14.9765C14.8845 14.4894 15.3704 14.2549 16.0003 14.2549C16.6302 14.2549 17.1162 14.4894 17.4401 14.9765C17.7461 15.3914 17.818 15.9506 17.6381 16.6542C17.4401 17.5382 16.9002 18.5484 16.0003 19.6867ZM21.0251 22.3566C19.4954 23.0241 17.9818 21.9597 16.686 20.5165C18.8295 17.8268 19.2254 15.7342 18.3058 14.3794C17.7659 13.6037 16.992 13.2248 16.0003 13.2248C14.0026 13.2248 12.903 14.9206 13.3349 16.8887C13.5869 17.9531 14.2528 19.1636 15.3146 20.5165C14.5182 21.4012 13.4733 22.4047 12.2191 22.519C10.4014 22.7896 8.97781 21.0217 9.62571 19.1978L14.2348 9.63307C14.6282 8.91403 15.1137 8.29812 15.9985 8.29812C16.6464 8.29812 17.1503 8.67696 17.3663 8.98363L22.3713 19.1978C22.8617 20.432 22.2398 21.8308 21.0251 22.3566ZM23.3468 18.837L19.0617 9.90367C18.2518 8.244 17.6759 7.25 16.0003 7.25C14.3446 7.25 13.6409 8.40455 12.921 9.90367L8.65386 18.837C7.73601 21.3644 9.62571 23.5833 11.9132 23.5833C12.0572 23.5833 12.2001 23.5653 12.3451 23.5653C13.5329 23.421 14.7585 22.6633 16.0003 21.3085C17.2421 22.6615 18.4677 23.421 19.6556 23.5653C19.8006 23.5653 19.9435 23.5833 20.0875 23.5833C22.3749 23.5851 24.2646 21.3644 23.3468 18.837Z" fill="white"/></svg></a>}</div><div style={{fontSize:12,color:"#A3A3A3",marginTop:2}}>{p.unitNumber?`Unidade ${p.unitNumber}`:""}{p.unitNumber&&p.parkingSpot?" · ":""}{p.parkingSpot?`Vaga ${p.parkingSpot}`:""}{(p.unitNumber||p.parkingSpot)?" · ":""}{p.reservationCount} reserva(s){!p.condominium?` · ${p.doormanPhones.length} portaria(s)`:""}{p.condominium?<span style={{color:B.primary}}> · 🏢 {p.condominium.name}{p.condominium.reportMode==="dashboard"?" (painel)":""}</span>:""}</div></div></div><button onClick={()=>startEdit(p)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"7px 14px",background:"#fff",color:"#1A1A1A",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer"}}>{editingId===p.id?"Fechar":"Editar"}</button></div>
      <div style={{padding:"0 20px 16px",display:"flex",flexDirection:"column",gap:6}}>
        {editingId===p.id&&<div style={{background:B.light,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8,marginBottom:4}}>
          {/* ── Condomínio Parceiro (PRIMEIRO BLOCO) ── */}
          <div style={{marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>🏢 Condomínio Parceiro</div>
            {p.condominium ? (
              <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      {p.condominium.photoUrl ? (
                        <img src={p.condominium.photoUrl} alt="" style={{width:44,height:44,borderRadius:10,objectFit:"cover",border:"1px solid #E5E5E5",flexShrink:0}} />
                      ) : (
                        <div style={{width:44,height:44,borderRadius:10,background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:B.muted,flexShrink:0}}>🏢</div>
                      )}
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{p.condominium.name}</div>
                        <div style={{fontSize:11,color:"#A3A3A3",marginTop:2}}>Código: {p.condominium.code}</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>unlinkCondo(p.id)} style={{fontFamily:"Outfit",fontSize:11,fontWeight:500,padding:"4px 10px",background:"none",color:"#DC2626",border:"1px solid #FEE2E2",borderRadius:6,cursor:"pointer"}}>Desvincular</button>
                </div>
                {(p.condominium.address||p.condominium.contactName||p.condominium.contactPhone)&&(
                  <div style={{background:"#F9FAFB",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#525252",display:"flex",flexDirection:"column",gap:2}}>
                    {p.condominium.address&&<div>📍 {p.condominium.address} <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.condominium.address)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:B.primary,textDecoration:"none",marginLeft:4}}>Ver no mapa →</a></div>}
                    {p.condominium.contactName&&<div>👤 {p.condominium.contactName}</div>}
                    {p.condominium.contactPhone&&<div>📞 {p.condominium.contactPhone}</div>}
                  </div>
                )}
                {/* Report mode (read-only — defined by condo admin) */}
                <div style={{borderTop:"1px solid #F0F0F0",paddingTop:10,marginTop:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Modo de comunicação</div>
                  {p.condominium.reportMode==="whatsapp"?(
                    <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:13,fontWeight:500,color:"#059669"}}>📱 WhatsApp — definido pelo condomínio</div>
                      <div style={{fontSize:11,color:"#737373",marginTop:2}}>Envie os dados via WhatsApp. O número da portaria será preenchido automaticamente.</div>
                    </div>
                  ):(
                    <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:13,fontWeight:500,color:B.primary}}>🖥️ Painel da portaria — definido pelo condomínio</div>
                      <div style={{fontSize:11,color:"#737373",marginTop:2}}>Os dados fluem automaticamente para o painel da portaria.</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{fontSize:12,color:"#737373",marginBottom:6}}>Se seu prédio é parceiro do AirCheck, insira o código fornecido pela administração.</div>
                <div style={{display:"flex",gap:8}}>
                  <input placeholder="Ex: AK3F7B" value={condoCode} onChange={e=>setCondoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} maxLength={6} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:600,padding:"8px 12px",border:`1px solid ${condoError?"#DC2626":"#E5E5E5"}`,borderRadius:8,background:"#fff",width:160,textAlign:"center",letterSpacing:"0.15em",boxSizing:"border-box"}}/>
                  <button onClick={()=>linkCondo(p.id)} disabled={condoSaving||condoCode.length<4} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"8px 16px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:condoSaving||condoCode.length<4?0.5:1}}>{condoSaving?"Verificando...":"Vincular"}</button>
                </div>
                {condoError&&<div style={{fontSize:12,color:"#DC2626",marginTop:6}}>{condoError}</div>}
              </div>
            )}
          </div>

          <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>Dados do imóvel</div>

          {/* Unit number & parking spot */}
          <div className="property-details-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Nº da Unidade *</label>
              <input value={details.unitNumber} onChange={e=>setDetails({...details,unitNumber:e.target.value})} placeholder="Ex: 501, Bloco A - 102" style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Vaga de garagem</label>
              <input value={details.parkingSpot} onChange={e=>setDetails({...details,parkingSpot:e.target.value})} placeholder="Ex: G1-25" style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",boxSizing:"border-box"}}/>
            </div>
          </div>
          <button onClick={()=>saveDetails(p.id)} disabled={savingDetails} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"8px 16px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",alignSelf:"flex-start",opacity:savingDetails?0.5:1}}>{savingDetails?"Salvando...":"Salvar dados"}</button>

        </div>}
        {/* Doorman phones: only show in standalone mode (no condominium) */}
        {!p.condominium ? <>
          {p.doormanPhones.map(dp=><div key={dp.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF9",borderRadius:8,padding:"10px 14px",border:"1px solid #F0F0F0"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📞</div><div><div style={{fontSize:13,fontWeight:500,color:"#1A1A1A"}}>{dp.name||"Portaria"}</div><div style={{fontSize:11,color:"#A3A3A3"}}>{dp.label&&`${dp.label} · `}{dp.phone}</div></div></div>
            {editingId===p.id&&<button onClick={()=>removePhone(p.id,dp.id)} style={{fontFamily:"Outfit",fontSize:11,fontWeight:500,padding:"4px 10px",background:"none",color:"#DC2626",border:"1px solid #FEE2E2",borderRadius:6,cursor:"pointer"}}>Remover</button>}
          </div>)}
          {editingId===p.id&&<div style={{background:B.light,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>Adicionar portaria</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <input placeholder="(41) 99999-0000" value={form.phone} onChange={e=>setForm({...form,phone:maskPhone(e.target.value)})} inputMode="tel" style={{fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff"}}/>
              <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff"}}/>
              <input placeholder="Rótulo (ex: Remota)" value={form.label} onChange={e=>setForm({...form,label:e.target.value})} style={{fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff"}}/>
            </div>
            <button onClick={()=>addPhone(p.id)} disabled={!form.phone||saving} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"8px 16px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",alignSelf:"flex-start",opacity:!form.phone||saving?0.5:1}}>{saving?"Salvando...":"+ Adicionar"}</button>
          </div>}
          {p.doormanPhones.length===0&&editingId!==p.id&&<div style={{fontSize:12,color:"#D97706",background:"#FFFBEB",borderRadius:8,padding:"8px 12px"}}>⚠️ Nenhuma portaria configurada</div>}
        </> : (
          <div style={{background:"#FAFAF9",borderRadius:10,padding:"14px 16px",border:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:12}}>
            {p.condominium.photoUrl ? (
              <img src={p.condominium.photoUrl} alt="" style={{width:40,height:40,borderRadius:10,objectFit:"cover",border:"1px solid #E5E5E5",flexShrink:0}} />
            ) : (
              <div style={{width:40,height:40,borderRadius:10,background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:B.muted,flexShrink:0}}>🏢</div>
            )}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{p.condominium.name}</div>
              <div style={{fontSize:11,color:"#737373",marginTop:2}}>
                {p.condominium.reportMode==="whatsapp"
                  ? <>📱 WhatsApp: <strong>{p.condominium.doormanWhatsapp}</strong></>
                  : <>🖥️ Dados via painel da portaria</>
                }
              </div>
            </div>
          </div>
        )}
        {!p.unitNumber&&editingId!==p.id&&<div style={{fontSize:12,color:"#D97706",background:"#FFFBEB",borderRadius:8,padding:"8px 12px"}}>⚠️ Nº da Unidade não configurado — clique em Editar</div>}
      </div>
    </div>)}
  </div>
}
