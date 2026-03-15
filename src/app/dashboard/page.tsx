"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── BLUE PALETTE ───────────────────────────────────────────────
const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", shadow:"rgba(59,95,229,0.25)", accent:"#059669", dark:"#0F0F0F" };

// ─── TYPES ──────────────────────────────────────────────────────
interface DoormanPhone { id:string; phone:string; name:string|null; label:string|null }
interface Guest { id:string; fullName:string; birthDate:string; cpf:string|null; rg:string|null; foreign:boolean; passport:string|null; rne:string|null; documentUrl:string|null }
interface Property { id:string; name:string; unitNumber:string|null; parkingSpot:string|null; includeDocLinks:boolean; whatsappEnabled:boolean; doormanPhones:DoormanPhone[]; reservationCount:number; condominium:{id:string;name:string;code:string;address:string|null;contactName:string|null;contactPhone:string|null;reportMode:string;doormanWhatsapp:string|null}|null }
interface Reservation { id:string; guestFullName:string; guestPhone:string|null; guestPhotoUrl:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; hostPayment:string|null; airbnbThreadId:string|null; airbnbThreadUrl:string|null; formToken:string; status:string; carPlate:string|null; carModel:string|null; property:{id:string;name:string;doormanPhones:DoormanPhone[];whatsappEnabled?:boolean;condominiumId?:string|null;condominium?:{reportMode:string;doormanWhatsapp:string|null}|null}; guests:Guest[] }
interface User { id:string; email:string; name:string|null; inboundEmails:Array<{id:string;email:string}> }

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

// ─── MAIN ───────────────────────────────────────────────────────
export default function Dashboard(){
  const router=useRouter();
  const[tab,setTab]=useState<"reservations"|"properties"|"settings"|"logs"|"feedback">("reservations");
  const[reservations,setReservations]=useState<Reservation[]>([]);
  const[properties,setProperties]=useState<Property[]>([]);
  const[user,setUser]=useState<User|null>(null);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState<"list"|"detail">("list");
  const[selectedId,setSelectedId]=useState<string|null>(null);
  const[showUserMenu,setShowUserMenu]=useState(false);

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

      <div style={{maxWidth:700,margin:"0 auto",padding:"20px 20px 40px"}} onClick={()=>showUserMenu&&setShowUserMenu(false)}>
        {loading&&<div style={{textAlign:"center",padding:48,color:"#A3A3A3",fontSize:14}}>Carregando...</div>}

        {!loading&&view==="detail"&&selected&&<DetailView res={selected} onBack={()=>{setView("list");setSelectedId(null);fetchData()}} onRefresh={fetchData}/>}

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
            {([["reservations","Reservas",active.length],["properties","Imóveis",properties.length],["feedback","Feedback",null],["logs","Logs",null],["settings","Configurações",null]] as const).map(([id,l,n])=>(
              <button key={id} onClick={()=>setTab(id as any)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?B.primary:"#A3A3A3",padding:"10px 16px",background:"none",border:"none",borderBottom:tab===id?`2px solid ${B.primary}`:"2px solid transparent",cursor:"pointer",marginBottom:-1}}>
                {l} {n!==null&&<span style={{marginLeft:4,fontSize:11,fontWeight:700,color:tab===id?B.primary:"#A3A3A3",background:tab===id?B.light:"#F5F5F5",padding:"2px 6px",borderRadius:10}}>{n}</span>}
              </button>
            ))}
          </div>

          {tab==="reservations"?<ReservationsList active={active} archived={archived} onSelect={(id)=>{setSelectedId(id);setView("detail")}}/>
          :tab==="properties"?<PropertiesTab properties={properties} onRefresh={fetchData}/>
          :tab==="feedback"?<FeedbackTab/>
          :tab==="logs"?<LogsTab/>
          :<SettingsTab user={user} onRefresh={fetchData}/>}
        </>}
      </div>
    </div>
  );
}

// ─── RESERVATIONS LIST ──────────────────────────────────────────
function ReservationsList({active,archived,onSelect}:{active:Reservation[];archived:Reservation[];onSelect:(id:string)=>void}){
  const[showArchived,setShowArchived]=useState(false);
  const RCard=({r}:{r:Reservation})=>{const du=daysUntil(r.checkInDate);const isArch=r.status==="archived";const isCancelled=r.status==="cancelled";return<button key={r.id} onClick={()=>onSelect(r.id)} className="fade-up" style={{width:"100%",textAlign:"left",background:isArch?"#FAFAF9":"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 2px rgba(0,0,0,0.04)",display:"block",transition:"all 0.15s",opacity:(isArch||isCancelled)?0.7:1}} onMouseOver={e=>{e.currentTarget.style.borderColor=B.primary;e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="#F0F0F0";e.currentTarget.style.transform="none"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {/* Guest photo */}
      {r.guestPhotoUrl?<img src={r.guestPhotoUrl} alt="" style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #F0F0F0"}}/>:<div style={{width:42,height:42,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,fontWeight:700,color:B.primary}}>{r.guestFullName[0]}</div>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:15,fontWeight:600,color:isCancelled?"#DC2626":"#1A1A1A",textDecoration:isCancelled?"line-through":"none"}}>{r.guestFullName}</span>
          {!isArch&&du>=0&&du<=3&&<span style={{fontSize:11,fontWeight:600,color:du<=1?"#DC2626":"#D97706",background:du<=1?"#FEF2F2":"#FFFBEB",padding:"2px 8px",borderRadius:12}}>{du<=1?"Hoje!":"Em "+du+" dias"}</span>}
        </div>
        <div style={{fontSize:12,color:"#A3A3A3",marginTop:3,textDecoration:isCancelled?"line-through":"none",opacity:isCancelled?0.6:1}}>📍 {r.property.name} · {r.checkInDate} → {r.checkOutDate} · {r.numGuests} hósp.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <Badge status={r.status}/>
        {r.confirmationCode&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:"#A3A3A3"}}>{r.confirmationCode}</span>}
      </div>
    </div>
  </button>};
  if(active.length===0&&archived.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📋</div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A",marginBottom:4}}>Nenhuma reserva ainda</div><div style={{fontSize:13,color:"#A3A3A3"}}>Encaminhe um email de confirmação do Airbnb para <strong style={{color:"#1A1A1A"}}>reservas@aircheck.com.br</strong> e a reserva aparecerá aqui automaticamente.</div></div>;
  return<div style={{display:"flex",flexDirection:"column",gap:8}}>
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
          <div><div style={{fontSize:22,fontWeight:800,color:"#1A1A1A"}}>{r.guestFullName}</div><div style={{fontSize:13,color:"#A3A3A3",marginTop:2}}>📍 {r.property.name}</div></div>
        </div>
        <Badge status={r.status}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginTop:18,paddingTop:14,borderTop:"1px solid #F0F0F0"}}>
        {[{l:"Check-in",v:r.checkInDate,s:r.checkInTime},{l:"Check-out",v:r.checkOutDate,s:r.checkOutTime},{l:"Hóspedes",v:String(r.numGuests)},{l:"Código",v:r.confirmationCode,m:true}].map((x,i)=><div key={i}><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{x.l}</div><div style={{fontFamily:x.m?"'IBM Plex Mono'":"Outfit",fontSize:14,fontWeight:600,color:"#1A1A1A",marginTop:3}}>{x.v||"—"}</div>{x.s&&<div style={{fontSize:12,color:"#A3A3A3"}}>{x.s}</div>}</div>)}
      </div>
      {r.hostPayment&&<div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #F0F0F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:"#A3A3A3"}}>Pagamento do anfitrião</span><span style={{fontSize:16,fontWeight:700,color:"#059669"}}>{r.hostPayment}</span></div>}
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:14,fontWeight:600,color:"#1A1A1A"}}>{g.fullName} {g.foreign&&<span style={{fontSize:11,color:B.primary}}>🌍</span>}</div>{g.documentUrl&&<a href={g.documentUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,fontWeight:500,color:"#059669",textDecoration:"none"}}>✓ Doc</a>}</div>
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

    {/* Password change */}
    <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Alterar senha</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Senha atual</label><input type="password" value={curPw} onChange={e=>setCurPw(e.target.value)} style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,boxSizing:"border-box"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Nova senha</label><input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Mín. 6 caracteres" style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:`1px solid ${newPw&&newPw.length<6?"#DC2626":"#E5E5E5"}`,borderRadius:8,boxSizing:"border-box"}}/></div>
          <div><label style={{fontSize:11,fontWeight:500,color:"#737373",display:"block",marginBottom:4}}>Confirmar nova senha</label><input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} style={{width:"100%",fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:`1px solid ${confirmPw&&confirmPw!==newPw?"#DC2626":"#E5E5E5"}`,borderRadius:8,boxSizing:"border-box"}}/></div>
        </div>
        {pwMsg&&<div style={{background:pwMsg.t==="ok"?"#ECFDF5":"#FEF2F2",borderRadius:8,padding:"8px 12px",fontSize:12,color:pwMsg.t==="ok"?"#059669":"#DC2626"}}>{pwMsg.m}</div>}
        <button onClick={changePw} disabled={pwSaving||!curPw||!newPw||!confirmPw} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:pwSaving||!curPw||!newPw||!confirmPw?0.5:1,alignSelf:"flex-start"}}>{pwSaving?"Alterando...":"Alterar senha"}</button>
      </div>
    </div>

    {/* Recebimento automático */}
    <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Recebimento automático de reservas</div>
      <p style={{fontSize:13,color:"#737373",lineHeight:1.6,marginBottom:14}}>Cadastre abaixo o email onde você recebe as confirmações de reserva do Airbnb. Ele será usado para identificar que os encaminhamentos são seus.</p>

      {(user?.inboundEmails||[]).map(ie=><div key={ie.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF9",borderRadius:8,padding:"10px 14px",border:"1px solid #F0F0F0",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>📧</span><span style={{fontSize:13,color:"#1A1A1A"}}>{ie.email}</span></div>
        <button onClick={()=>removeEmail(ie.id)} style={{fontFamily:"Outfit",fontSize:11,fontWeight:500,padding:"4px 10px",background:"none",color:"#DC2626",border:"1px solid #FEE2E2",borderRadius:6,cursor:"pointer"}}>Remover</button>
      </div>)}

      {error&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#DC2626",marginBottom:8}}>{error}</div>}
      <div style={{marginTop:8}}>
        <label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Email onde você recebe reservas do Airbnb</label>
        <div style={{display:"flex",gap:8}}>
          <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="seuemail@gmail.com" type="email" style={{flex:1,fontFamily:"Outfit",fontSize:13,padding:"8px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",boxSizing:"border-box"}}/>
          <button onClick={addEmail} disabled={!newEmail||saving} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"8px 16px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:!newEmail||saving?0.5:1}}>{saving?"...":"+ Adicionar"}</button>
        </div>
      </div>
    </div>

    {/* Instruções de encaminhamento */}
    <div style={{background:B.light,border:`1px solid ${B.muted}`,borderRadius:16,padding:"20px"}}>
      <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Como ativar o recebimento automático</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>1</div>
          <div style={{fontSize:13,color:B.primary,lineHeight:1.5}}>Cadastre acima o email onde você recebe as confirmações do Airbnb <span style={{fontSize:12,color:"rgba(59,95,229,0.6)"}}>(ex: seuemail@gmail.com)</span></div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>2</div>
          <div style={{fontSize:13,color:B.primary,lineHeight:1.5}}>No seu provedor de email (Gmail, Outlook, etc.), configure o <strong>encaminhamento automático</strong> de emails do Airbnb para:<br/><span style={{fontFamily:"'IBM Plex Mono'",fontSize:13,fontWeight:500,background:"#fff",padding:"4px 10px",borderRadius:6,display:"inline-block",marginTop:6}}>reservas@aircheck.com.br</span></div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:B.primary,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>3</div>
          <div style={{fontSize:13,color:B.primary,lineHeight:1.5}}>Pronto! As reservas serão criadas automaticamente no seu painel assim que o Airbnb enviar a confirmação.</div>
        </div>
      </div>
    </div>
  </div>}

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

// ─── LOGS TAB ───────────────────────────────────────────────────
interface EmailLog { id:string; fromEmail:string; toEmail:string|null; subject:string|null; htmlBody:string|null; status:string; error:string|null; createdAt:string }

function LogsTab(){
  const[logs,setLogs]=useState<EmailLog[]>([]);
  const[loading,setLoading]=useState(true);
  const[expandedId,setExpandedId]=useState<string|null>(null);

  useEffect(()=>{fetch("/api/logs").then(r=>r.json()).then(setLogs).finally(()=>setLoading(false))},[]);

  const statusColors:Record<string,{c:string;bg:string;l:string}>={
    received:{c:"#D97706",bg:"#FFFBEB",l:"Recebido"},
    success:{c:"#059669",bg:"#ECFDF5",l:"Sucesso"},
    error:{c:"#DC2626",bg:"#FEF2F2",l:"Erro"},
    parse_failed:{c:"#DC2626",bg:"#FEF2F2",l:"Parse falhou"},
    duplicate:{c:"#737373",bg:"#F5F5F5",l:"Duplicata"},
    cancellation:{c:"#DC2626",bg:"#FEF2F2",l:"Cancelamento"},
    cancellation_orphan:{c:"#D97706",bg:"#FFFBEB",l:"Cancel. órfão"},
  };

  if(loading)return<div style={{textAlign:"center",padding:48,color:"#A3A3A3",fontSize:14}}>Carregando logs...</div>;
  if(logs.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📧</div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A",marginBottom:4}}>Nenhum email recebido</div><div style={{fontSize:13,color:"#A3A3A3"}}>Quando um email chegar via webhook, aparecerá aqui.</div></div>;

  return<div style={{display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:B.light,borderRadius:10,padding:"10px 14px",fontSize:12,color:B.primary}}><span>📧</span>Últimos {logs.length} emails recebidos. Clique para ver o email original.</div>
    {logs.map(log=>{
      const st=statusColors[log.status]||statusColors.received;
      const expanded=expandedId===log.id;
      const date=new Date(log.createdAt);
      const timeStr=`${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;

      return<div key={log.id} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>setExpandedId(expanded?null:log.id)} style={{width:"100%",textAlign:"left",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{log.subject||"(sem assunto)"}</span>
                <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:10,color:st.c,background:st.bg}}>{st.l}</span>
              </div>
              <div style={{fontSize:12,color:"#A3A3A3",marginTop:4}}>De: {log.fromEmail} · {timeStr}</div>
            </div>
            <span style={{fontSize:12,color:"#A3A3A3",transform:expanded?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
          </div>
        </button>

        {expanded&&<div style={{padding:"0 16px 16px",borderTop:"1px solid #F0F0F0"}}>
          {log.error&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"8px 12px",marginTop:10,fontSize:12,color:"#DC2626"}}>{log.error}</div>}
          {log.htmlBody?<div style={{border:"1px solid #E5E5E5",borderRadius:10,overflow:"hidden",marginTop:10}}><div style={{maxHeight:500,overflow:"auto",padding:12}} dangerouslySetInnerHTML={{__html:log.htmlBody}}/></div>
          :<div style={{marginTop:10,fontSize:13,color:"#A3A3A3",fontStyle:"italic"}}>Email sem conteúdo HTML.</div>}
        </div>}
      </div>
    })}
  </div>
}

// ─── PROPERTIES TAB ─────────────────────────────────────────────
function PropertiesTab({properties,onRefresh}:{properties:Property[];onRefresh:()=>void}){
  const[editingId,setEditingId]=useState<string|null>(null);
  const[form,setForm]=useState({phone:"",name:"",label:""});
  const[details,setDetails]=useState({unitNumber:"",parkingSpot:""});
  const[condoCode,setCondoCode]=useState("");
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
    {properties.map(p=><div key={p.id} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A"}}>{p.name}</div><div style={{fontSize:12,color:"#A3A3A3",marginTop:2}}>{p.unitNumber?`Unidade ${p.unitNumber}`:""}{p.unitNumber&&p.parkingSpot?" · ":""}{p.parkingSpot?`Vaga ${p.parkingSpot}`:""}{(p.unitNumber||p.parkingSpot)?" · ":""}{p.reservationCount} reserva(s) · {p.doormanPhones.length} portaria(s){p.includeDocLinks?<span style={{color:"#059669"}}> · 📎 Docs ativado</span>:""}{p.condominium?<span style={{color:B.primary}}> · 🏢 {p.condominium.name}{p.condominium.reportMode==="dashboard"?" (painel)":""}</span>:""}</div></div><button onClick={()=>startEdit(p)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"7px 14px",background:"#fff",color:"#1A1A1A",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer"}}>{editingId===p.id?"Fechar":"Editar"}</button></div>
      <div style={{padding:"0 20px 16px",display:"flex",flexDirection:"column",gap:6}}>
        {editingId===p.id&&<div style={{background:B.light,borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:8,marginBottom:4}}>
          {/* ── Condomínio Parceiro (PRIMEIRO BLOCO) ── */}
          <div style={{marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>🏢 Condomínio Parceiro</div>
            {p.condominium ? (
              <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"#1A1A1A"}}>{p.condominium.name}</div>
                    <div style={{fontSize:11,color:"#A3A3A3",marginTop:2}}>Código: {p.condominium.code}</div>
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
                  <input placeholder="Ex: AK3F7B" value={condoCode} onChange={e=>setCondoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))} maxLength={6} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:600,padding:"8px 12px",border:`1px solid ${condoError?"#DC2626":"#E5E5E5"}`,borderRadius:8,background:"#fff",width:120,textAlign:"center",letterSpacing:"0.15em",boxSizing:"border-box"}}/>
                  <button onClick={()=>linkCondo(p.id)} disabled={condoSaving||condoCode.length<4} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"8px 16px",background:B.primary,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",opacity:condoSaving||condoCode.length<4?0.5:1}}>{condoSaving?"Verificando...":"Vincular"}</button>
                </div>
                {condoError&&<div style={{fontSize:12,color:"#DC2626",marginTop:6}}>{condoError}</div>}
              </div>
            )}
          </div>

          <div style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>Dados do imóvel</div>

          <div style={{borderTop:"1px solid #E5E5E5",paddingTop:12,marginTop:4,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:13,fontWeight:500,color:"#1A1A1A"}}>Incluir documento na mensagem</div><div style={{fontSize:11,color:"#A3A3A3",marginTop:2}}>Envia link da foto do documento de cada hóspede junto com a mensagem do WhatsApp</div></div>
            <button onClick={async()=>{await fetch(`/api/properties/${p.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_doc_links"})});onRefresh()}} style={{fontFamily:"Outfit",width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",position:"relative",background:p.includeDocLinks?"#3B5FE5":"#D4D4D4",transition:"background 0.2s"}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:p.includeDocLinks?23:3,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/></button>
          </div>
        </div>}
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
        {!p.unitNumber&&editingId!==p.id&&<div style={{fontSize:12,color:"#D97706",background:"#FFFBEB",borderRadius:8,padding:"8px 12px"}}>⚠️ Nº da Unidade não configurado — clique em Editar</div>}
      </div>
    </div>)}
  </div>
}
