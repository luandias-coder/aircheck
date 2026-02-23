"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── BLUE PALETTE ───────────────────────────────────────────────
const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC", shadow:"rgba(59,95,229,0.25)" };

// ─── CLIENT-SIDE PARSER v5.1 ────────────────────────────────────
const MONTHS: Record<string,number> = {jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11,janeiro:0,fevereiro:1,marco:2,abril:3,maio:4,junho:5,julho:6,agosto:7,setembro:8,outubro:9,novembro:10,dezembro:11,january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
function mm(raw:string):number|null{const c=raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\uFFFD/g,"").replace(/\?/g,"").replace(/\.+$/,"").trim();if(MONTHS[c]!==undefined)return MONTHS[c];if(c.length>=3){for(const[k,v]of Object.entries(MONTHS)){if(k.startsWith(c.slice(0,3)))return v}}return null}
function fixEnc(t:string):string{return t.replace(/\uFFFD\uFFFDes\b/g,"ções").replace(/\uFFFD\uFFFDo\b/g,"ção").replace(/\uFFFD\uFFFD/g,"çã").replace(/\bEsta\uFFFDo/g,"Estação").replace(/\uFFFD(?=spede)/gi,"ó").replace(/\uFFFD(?=digo)/gi,"ó").replace(/\uFFFD(?=rio)/gi,"á").replace(/\uFFFD(?=vel)/gi,"ó").replace(/anfitri\uFFFDo/gi,"anfitrião").replace(/pre\uFFFDo/gi,"preço").replace(/servi\uFFFDo/gi,"serviço").replace(/informa\uFFFDes/gi,"informações").replace(/\uFFFD/g,"")}
function parsePreview(raw:string){const r:Record<string,any>={};let ey=new Date().getFullYear(),em:number|null=null;const h=raw.match(/Enviado:\s*\w+,\s*(\w+)\s+(\d{1,2}),\s*(\d{4})/i);if(h){ey=parseInt(h[3]);em=mm(h[1])}
// Room ID, Thread
const rm=raw.match(/airbnb\.com(?:\.br)?\/rooms\/(\d+)/);if(rm)r.airbnbRoomId=rm[1];
const tm=raw.match(/(https:\/\/www\.airbnb\.com(?:\.br)?\/hosting\/thread\/(\d+))/);if(tm){r.airbnbThreadUrl=tm[1];r.airbnbThreadId=tm[2]}
// Guest photo
const ph=raw.match(/https:\/\/a0\.muscache\.com\/im\/pictures\/user\/[^\s\]\[>]+/);if(ph)r.guestPhotoUrl=ph[0].replace(/\]$/,"");
// Guest name
const s=raw.match(/Reserva confirmada\s*[-–—]\s*(.+?)\s+chega\s+em/i);if(s)r.guestFullName=s[1].trim();else{const n=raw.match(/Nova reserva confirmada!\s+(\w[\w\s]*?)\s+chega\s+em/i);if(n)r.guestFullName=n[1].trim();else{const b=raw.match(/\n\s*([A-ZÀ-Ú\u00C0-\u024F][a-zà-ÿ\u00E0-\u024F]+(?:\s+[A-ZÀ-Ú\u00C0-\u024F][a-zà-ÿ\u00E0-\u024F]+)+)\s*\n[^\n]*?Identifica/m);if(b)r.guestFullName=b[1].trim()}}
// Property (with encoding cleanup)
const pc=raw.match(/\n\s*(.{5,80}?)\s*\n\s*Casa[\/\w\s]*inteiro/i);if(pc){const n=fixEnc(pc[1].trim());if(!n.match(/^(Envie|Nova|Ident|Check|Imagem|http|\[)/i)&&n.length>3)r.propertyName=n}
if(!r.propertyName){const pi=raw.match(/(?:\]|^)\s*([^[\]\n]{5,80}?)\s+Casa[\/\w\s]*inteiro/im);if(pi){const n=fixEnc(pi[1].trim());if(n.length>3&&!n.match(/^(http|Envie|Nova|<)/i))r.propertyName=n}}
if(!r.propertyName){const br=/\[([^\]]{5,80}?)\]/g;let bm;while((bm=br.exec(raw))!==null){const n=fixEnc(bm[1].trim());if(!n.match(/^(Airbnb$|AirCover|App Store|Google Play|http|image)/i)&&n.length>3){r.propertyName=n;break}}}
// Check-in
const ci=raw.match(/Check[\s-]?in[\s\n]+(?:[^\d\n]{0,12}[.,]\s*)?(\d{1,2})\s+de\s+(\w{3,9})\.?[\s\n]+(\d{1,2}:\d{2})/i);if(ci){const mo=mm(ci[2]);if(mo!==null){let y=ey;if(em!==null&&mo<em)y++;r.checkInDate=`${ci[1].padStart(2,"0")}/${String(mo+1).padStart(2,"0")}/${y}`;r.checkInTime=ci[3];r._cm=mo;r._cy=y}}
// Check-out
const co=raw.match(/Check[\s-]?out[\s\n]+(?:[^\d\n]{0,12}[.,]\s*)?(\d{1,2})\s+de\s+(\w{3,9})\.?[\s\n]+(\d{1,2}:\d{2})/i);if(co){const mo=mm(co[2]);if(mo!==null){let y=r._cy||ey;if(r._cm!==undefined&&mo<r._cm)y++;r.checkOutDate=`${co[1].padStart(2,"0")}/${String(mo+1).padStart(2,"0")}/${y}`;r.checkOutTime=co[3]}}
// Guests
const gp=[/H.spedes[\s\n]+(\d+)\s+(?:adultos?|h.spedes?|pessoas?)/i,/(\d+)\s+adultos?/i];for(const p of gp){const m=raw.match(p);if(m){r.numGuests=parseInt(m[1]);break}}if(!r.numGuests)r.numGuests=1;
// Code
const cp=[/C.digo\s+de\s+confirma..o[\s\n]+([A-Z0-9]{8,12})/i,/confirma(?:ção|..o|cao)[\s\S]{0,30}?([A-Z0-9]{10})/i];for(const p of cp){const m=raw.match(p);if(m){r.confirmationCode=m[1];break}}
// Payment
const pm=raw.match(/Voc.\s+recebe[\s\n]+R\$\s*([\d.,]+)/i)||raw.match(/recebe[\s\n]+R\$\s*([\d.,]+)/i);if(pm)r.hostPayment=`R$ ${pm[1]}`;
// Nights
const nm=raw.match(/(\d+)\s+noites?/i);if(nm)r.nights=parseInt(nm[1]);
// Confidence
const has=(k:string)=>!!r[k];r.confidence=has("guestFullName")&&has("propertyName")&&has("checkInDate")&&has("checkOutDate")&&has("confirmationCode")?"high":has("guestFullName")&&has("checkInDate")?"medium":"low";delete r._cm;delete r._cy;return r}

// ─── TYPES ──────────────────────────────────────────────────────
interface DoormanPhone { id:string; phone:string; name:string|null; label:string|null }
interface Guest { id:string; fullName:string; birthDate:string; cpf:string|null; rg:string|null; foreign:boolean; passport:string|null; rne:string|null; documentUrl:string|null }
interface Property { id:string; name:string; doormanPhones:DoormanPhone[]; reservationCount:number }
interface Reservation { id:string; guestFullName:string; guestPhone:string|null; guestPhotoUrl:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; confirmationCode:string|null; hostPayment:string|null; airbnbThreadId:string|null; airbnbThreadUrl:string|null; formToken:string; status:string; carPlate:string|null; carModel:string|null; property:{id:string;name:string;doormanPhones:DoormanPhone[]}; guests:Guest[] }
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
};
function Badge({status}:{status:string}){const s=STATUS[status]||STATUS.pending_form;return<span style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"Outfit",fontSize:11,fontWeight:600,color:s.c,background:s.bg,padding:"4px 10px",borderRadius:20}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0}}/>{s.l}</span>}
function daysUntil(d:string):number{if(!d)return 999;const[dd,mm,yy]=d.split("/").map(Number);const t=new Date(yy,mm-1,dd);const n=new Date();n.setHours(0,0,0,0);return Math.round((t.getTime()-n.getTime())/86400000)}

// ─── MAIN ───────────────────────────────────────────────────────
export default function Dashboard(){
  const router=useRouter();
  const[tab,setTab]=useState<"reservations"|"properties"|"settings"|"logs">("reservations");
  const[reservations,setReservations]=useState<Reservation[]>([]);
  const[properties,setProperties]=useState<Property[]>([]);
  const[user,setUser]=useState<User|null>(null);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState<"list"|"new"|"detail">("list");
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
          if(r.status==="archived")return false;
          if(!r.checkOutDate)return false;
          const[dd,mm,yy]=r.checkOutDate.split("/").map(Number);
          const co=new Date(yy,mm-1,dd);
          return co<now;
        });
        if(toArchive.length>0){
          await Promise.all(toArchive.map(r=>fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"archived"})})));
          toArchive.forEach(r=>r.status="archived");
        }
        setReservations(data);
      }
      if(pr.ok)setProperties(await pr.json());
      if(ur.ok)setUser(await ur.json());
      else router.push("/login");
    }catch(e){console.error(e)}finally{setLoading(false)}
  },[router]);
  useEffect(()=>{fetchData()},[fetchData]);

  const logout=async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/login")};

  const selected=reservations.find(r=>r.id===selectedId);
  const active=reservations.filter(r=>r.status!=="archived");
  const archived=reservations.filter(r=>r.status==="archived");
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
            {view==="list"&&tab==="reservations"&&<button onClick={()=>setView("new")} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"9px 18px",background:B.primary,color:"#fff",border:"none",borderRadius:20,cursor:"pointer",boxShadow:`0 4px 14px ${B.shadow}`}}>+ Nova reserva</button>}
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

        {!loading&&view==="new"&&<NewFlow onDone={()=>{setView("list");fetchData()}} onCancel={()=>setView("list")}/>}
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
            {([["reservations","Reservas",active.length],["properties","Imóveis",properties.length],["logs","Logs",null],["settings","Configurações",null]] as const).map(([id,l,n])=>(
              <button key={id} onClick={()=>setTab(id as any)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?B.primary:"#A3A3A3",padding:"10px 16px",background:"none",border:"none",borderBottom:tab===id?`2px solid ${B.primary}`:"2px solid transparent",cursor:"pointer",marginBottom:-1}}>
                {l} {n!==null&&<span style={{marginLeft:4,fontSize:11,fontWeight:700,color:tab===id?B.primary:"#A3A3A3",background:tab===id?B.light:"#F5F5F5",padding:"2px 6px",borderRadius:10}}>{n}</span>}
              </button>
            ))}
          </div>

          {tab==="reservations"?<ReservationsList active={active} archived={archived} onNew={()=>setView("new")} onSelect={(id)=>{setSelectedId(id);setView("detail")}}/>
          :tab==="properties"?<PropertiesTab properties={properties} onRefresh={fetchData}/>
          :tab==="logs"?<LogsTab/>
          :<SettingsTab user={user} onRefresh={fetchData}/>}
        </>}
      </div>
    </div>
  );
}

// ─── RESERVATIONS LIST ──────────────────────────────────────────
function ReservationsList({active,archived,onNew,onSelect}:{active:Reservation[];archived:Reservation[];onNew:()=>void;onSelect:(id:string)=>void}){
  const[showArchived,setShowArchived]=useState(false);
  const RCard=({r}:{r:Reservation})=>{const du=daysUntil(r.checkInDate);const isArch=r.status==="archived";return<button key={r.id} onClick={()=>onSelect(r.id)} className="fade-up" style={{width:"100%",textAlign:"left",background:isArch?"#FAFAF9":"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 2px rgba(0,0,0,0.04)",display:"block",transition:"all 0.15s",opacity:isArch?0.7:1}} onMouseOver={e=>{e.currentTarget.style.borderColor=B.primary;e.currentTarget.style.transform="translateY(-1px)"}} onMouseOut={e=>{e.currentTarget.style.borderColor="#F0F0F0";e.currentTarget.style.transform="none"}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      {/* Guest photo */}
      {r.guestPhotoUrl?<img src={r.guestPhotoUrl} alt="" style={{width:42,height:42,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #F0F0F0"}}/>:<div style={{width:42,height:42,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,fontWeight:700,color:B.primary}}>{r.guestFullName[0]}</div>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:15,fontWeight:600,color:"#1A1A1A"}}>{r.guestFullName}</span>
          {!isArch&&du>=0&&du<=3&&<span style={{fontSize:11,fontWeight:600,color:du<=1?"#DC2626":"#D97706",background:du<=1?"#FEF2F2":"#FFFBEB",padding:"2px 8px",borderRadius:12}}>{du<=1?"Hoje!":"Em "+du+" dias"}</span>}
        </div>
        <div style={{fontSize:12,color:"#A3A3A3",marginTop:3}}>📍 {r.property.name} · {r.checkInDate} → {r.checkOutDate} · {r.numGuests} hósp.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        <Badge status={r.status}/>
        {r.confirmationCode&&<span style={{fontFamily:"'IBM Plex Mono'",fontSize:11,color:"#A3A3A3"}}>{r.confirmationCode}</span>}
      </div>
    </div>
  </button>};
  if(active.length===0&&archived.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📋</div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A",marginBottom:4}}>Nenhuma reserva ainda</div><div style={{fontSize:13,color:"#A3A3A3",marginBottom:16}}>Cole o email do Airbnb para criar a primeira</div><button onClick={onNew} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"10px 20px",background:B.primary,color:"#fff",border:"none",borderRadius:20,cursor:"pointer"}}>+ Nova reserva</button></div>;
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
function NewFlow({onDone,onCancel}:{onDone:()=>void;onCancel:()=>void}){
  const[step,setStep]=useState<"paste"|"preview">("paste");
  const[email,setEmail]=useState("");
  const[preview,setPreview]=useState<any>(null);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");

  const parse=()=>{if(!email.trim())return;setPreview(parsePreview(email));setStep("preview")};
  const confirm=async()=>{setSaving(true);setError("");try{const res=await fetch("/api/reservations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({emailText:email})});if(!res.ok){setError((await res.json()).error||"Erro");setSaving(false);return}onDone()}catch{setError("Erro de conexão");setSaving(false)}};

  if(step==="preview"&&preview){
    const cf=preview.confidence;
    return<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{fontSize:16,fontWeight:700,color:"#1A1A1A",margin:0}}>Confirmar dados</h3><span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:6,color:cf==="high"?"#059669":cf==="medium"?"#D97706":"#DC2626",background:cf==="high"?"#ECFDF5":cf==="medium"?"#FFFBEB":"#FEF2F2"}}>{cf==="high"?"✓ Tudo certo":cf==="medium"?"⚠ Parcial":"✗ Revisar"}</span></div>
      <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
        <div style={{fontSize:20,fontWeight:800,color:"#1A1A1A"}}>{preview.guestFullName||"—"}</div>
        <div style={{fontSize:13,color:"#737373",marginTop:4}}>📍 {preview.propertyName||"—"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:16,paddingTop:14,borderTop:"1px solid #F0F0F0"}}>
          {[{l:"Check-in",v:preview.checkInDate,s:preview.checkInTime},{l:"Check-out",v:preview.checkOutDate,s:preview.checkOutTime},{l:"Hóspedes",v:preview.numGuests}].map((x,i)=><div key={i}><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{x.l}</div><div style={{fontSize:14,fontWeight:600,color:"#1A1A1A",marginTop:3}}>{x.v||"—"}</div>{x.s&&<div style={{fontSize:11,color:"#A3A3A3"}}>{x.s}</div>}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          <div><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Código</div><div style={{fontFamily:"'IBM Plex Mono'",fontSize:14,fontWeight:600,color:"#1A1A1A",marginTop:3}}>{preview.confirmationCode||"—"}</div></div>
          <div><div style={{fontSize:10,fontWeight:500,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Pagamento</div><div style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:3}}>{preview.hostPayment||"—"}</div></div>
        </div>
      </div>
      {error&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#DC2626"}}>{error}</div>}
      <div style={{display:"flex",gap:8}}>
        <button onClick={confirm} disabled={saving} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"10px 20px",background:B.primary,color:"#fff",border:"none",borderRadius:10,cursor:"pointer",opacity:saving?0.5:1}}>{saving?"Criando...":"✓ Criar reserva"}</button>
        <button onClick={()=>setStep("paste")} style={{fontFamily:"Outfit",fontSize:13,padding:"10px 16px",background:"#fff",color:"#737373",border:"1px solid #E5E5E5",borderRadius:10,cursor:"pointer"}}>← Voltar</button>
        <button onClick={onCancel} style={{fontFamily:"Outfit",fontSize:13,padding:"10px 16px",background:"none",color:"#A3A3A3",border:"none",cursor:"pointer",marginLeft:"auto"}}>Cancelar</button>
      </div>
    </div>
  }
  return<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{fontSize:16,fontWeight:700,color:"#1A1A1A",margin:0}}>Nova reserva</h3><button onClick={onCancel} style={{fontSize:18,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>✕</button></div>
    <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}><label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em"}}>Cole o email de confirmação do Airbnb</label><textarea value={email} onChange={e=>setEmail(e.target.value)} placeholder="Abra o email do Airbnb → Selecione tudo (Ctrl+A) → Copie → Cole aqui" style={{width:"100%",marginTop:8,padding:12,border:"1px solid #E5E5E5",borderRadius:10,fontSize:12,fontFamily:"'IBM Plex Mono'",minHeight:150,resize:"vertical",lineHeight:1.6,boxSizing:"border-box",background:"#FAFAF9"}} autoFocus/></div>
    <button onClick={parse} disabled={!email.trim()} style={{width:"100%",padding:13,fontFamily:"Outfit",fontSize:14,fontWeight:600,background:email.trim()?B.primary:"#D4D4D4",color:email.trim()?"#fff":"#A3A3A3",border:"none",borderRadius:12,cursor:email.trim()?"pointer":"not-allowed"}}>Extrair dados do email →</button>
  </div>
}

// ─── DETAIL VIEW ────────────────────────────────────────────────
function DetailView({res:r,onBack,onRefresh}:{res:Reservation;onBack:()=>void;onRefresh:()=>void}){
  const[copied,setCopied]=useState(false);
  const[copiedMsg,setCopiedMsg]=useState(false);
  const[waData,setWaData]=useState<{message:string;links:Array<{phone:string;name:string|null;label:string|null;link:string}>}|null>(null);
  const[showWa,setShowWa]=useState(false);
  const[deleting,setDeleting]=useState(false);

  const baseUrl=typeof window!=="undefined"?window.location.origin:"";
  const formUrl=`${baseUrl}/checkin/${r.formToken}`;
  const copy=()=>{navigator.clipboard.writeText(formUrl);setCopied(true);setTimeout(()=>setCopied(false),2000)};
  const hasGuests=r.guests.length>0;
  const fetchWa=async()=>{const res=await fetch(`/api/reservations/${r.id}/whatsapp`);if(res.ok){setWaData(await res.json());setShowWa(true)}};
  const markSent=async()=>{await fetch(`/api/reservations/${r.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"sent_to_doorman"})});onRefresh()};
  const handleDelete=async()=>{if(!confirm("Tem certeza que deseja excluir esta reserva?"))return;setDeleting(true);await fetch(`/api/reservations/${r.id}`,{method:"DELETE"});onBack()};

  const checkinMsg=`Olá ${r.guestFullName.split(" ")[0]}! 😊\n\nPara agilizar seu check-in, por favor preencha este formulário com os dados dos hóspedes. É obrigatório para liberação na portaria do prédio.\n\n${formUrl}\n\nQualquer dúvida, estou à disposição!`;
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
        <pre style={{fontFamily:"Outfit",fontSize:12,color:"#374151",whiteSpace:"pre-wrap",lineHeight:1.6,margin:0}}>{checkinMsg}</pre>
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
    </div>
    :<div className="fade-up" style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:"50%",background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>⏳</div><div><div style={{fontSize:14,fontWeight:600,color:"#D97706"}}>Aguardando preenchimento</div><div style={{fontSize:12,color:"#D97706",marginTop:2}}>O hóspede ainda não preencheu o formulário.</div></div></div>}

    {hasGuests&&<div className="fade-up" style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"16px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Enviar para portaria</div>
      {r.property.doormanPhones.length===0?<div style={{background:"#FFFBEB",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#D97706"}}>⚠️ Configure portaria(s) na aba Imóveis</div>
      :!waData?<button onClick={fetchWa} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,padding:"10px 18px",background:"#25D366",color:"#fff",border:"none",borderRadius:10,cursor:"pointer"}}>Gerar mensagem WhatsApp</button>
      :<div>
        {showWa&&<pre style={{fontFamily:"Outfit",fontSize:12,color:"#374151",whiteSpace:"pre-wrap",lineHeight:1.7,background:"#F0FDF4",border:"1px solid #BBF7D0",padding:14,borderRadius:10,marginBottom:10}}>{waData.message}</pre>}
        <button onClick={()=>setShowWa(!showWa)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,color:B.primary,background:"none",border:"none",cursor:"pointer",marginBottom:10}}>{showWa?"Esconder":"Ver"} mensagem</button>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {waData.links.map((d,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#FAFAF9",borderRadius:10,padding:"10px 14px",border:"1px solid #F0F0F0"}}>
            <div><div style={{fontSize:13,fontWeight:500,color:"#1A1A1A"}}>{d.name||"Portaria"}</div><div style={{fontSize:11,color:"#A3A3A3"}}>{d.label} · {d.phone}</div></div>
            <a href={d.link} target="_blank" rel="noopener noreferrer" onClick={markSent} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"7px 16px",background:"#25D366",color:"#fff",borderRadius:20,textDecoration:"none",boxShadow:"0 2px 8px rgba(37,211,102,0.3)"}}>WhatsApp →</a>
          </div>)}
        </div>
      </div>}
    </div>}
  </div>
}

// ─── SETTINGS TAB ───────────────────────────────────────────────
function SettingsTab({user,onRefresh}:{user:User|null;onRefresh:()=>void}){
  const[newEmail,setNewEmail]=useState("");
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");

  const addEmail=async()=>{if(!newEmail)return;setSaving(true);setError("");const res=await fetch("/api/settings/inbound-emails",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:newEmail})});if(!res.ok){setError((await res.json()).error||"Erro");setSaving(false);return}setNewEmail("");setSaving(false);onRefresh()};
  const removeEmail=async(id:string)=>{await fetch("/api/settings/inbound-emails",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});onRefresh()};

  const webhookUrl=typeof window!=="undefined"?`${window.location.origin}/api/inbound-email`:"";

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Profile */}
    <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Sua conta</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:B.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:B.primary}}>{(user?.name||user?.email||"U")[0].toUpperCase()}</div>
        <div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A"}}>{user?.name||"Anfitrião"}</div><div style={{fontSize:13,color:"#A3A3A3"}}>{user?.email}</div></div>
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

    {/* Email logs */}
    <EmailLogs />
  </div>}

// ─── EMAIL LOGS ─────────────────────────────────────────────────
function EmailLogs(){
  const[logs,setLogs]=useState<any[]>([]);
  const[loading,setLoading]=useState(false);
  const[expanded,setExpanded]=useState<string|null>(null);
  const[detail,setDetail]=useState<any>(null);

  const fetchLogs=async()=>{setLoading(true);const res=await fetch("/api/settings/email-logs");if(res.ok)setLogs(await res.json());setLoading(false)};
  const fetchDetail=async(id:string)=>{if(expanded===id){setExpanded(null);setDetail(null);return}setExpanded(id);const res=await fetch(`/api/settings/email-logs?id=${id}`);if(res.ok)setDetail(await res.json())};

  const statusMap:Record<string,{l:string;c:string;bg:string}>={
    received:{l:"Recebido",c:"#D97706",bg:"#FFFBEB"},
    success:{l:"Reserva criada",c:"#059669",bg:"#ECFDF5"},
    parse_failed:{l:"Parse falhou",c:"#DC2626",bg:"#FEF2F2"},
    duplicate:{l:"Duplicata",c:"#6B7280",bg:"#F5F5F5"},
    error:{l:"Erro",c:"#DC2626",bg:"#FEF2F2"},
  };

  return<div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Log de emails recebidos</div>
      <button onClick={fetchLogs} style={{fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"6px 14px",background:B.light,color:B.primary,border:"none",borderRadius:6,cursor:"pointer"}}>{loading?"...":"Carregar logs"}</button>
    </div>

    {logs.length===0&&!loading&&<div style={{fontSize:13,color:"#A3A3A3",textAlign:"center",padding:"20px 0"}}>Clique em "Carregar logs" para ver os emails recebidos</div>}

    {logs.map(log=>{
      const s=statusMap[log.status]||statusMap.error;
      const date=new Date(log.createdAt);
      const isOpen=expanded===log.id;
      let parsed:any=null;
      try{parsed=log.parsedData?JSON.parse(log.parsedData):null}catch{}

      return<div key={log.id} style={{border:"1px solid #F0F0F0",borderRadius:10,marginBottom:6,overflow:"hidden"}}>
        <button onClick={()=>fetchDetail(log.id)} style={{width:"100%",padding:"10px 14px",background:isOpen?"#FAFAF9":"#fff",border:"none",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <span style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{log.subject||"(sem assunto)"}</span>
              <span style={{fontSize:10,fontWeight:600,color:s.c,background:s.bg,padding:"2px 8px",borderRadius:10}}>{s.l}</span>
            </div>
            <div style={{fontSize:11,color:"#A3A3A3",marginTop:3}}>
              De: {log.fromEmail} · {date.toLocaleDateString("pt-BR")} {date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
            </div>
          </div>
          <span style={{fontSize:12,color:"#A3A3A3",transform:isOpen?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
        </button>

        {isOpen&&detail&&<div style={{padding:"0 14px 14px",borderTop:"1px solid #F0F0F0"}}>
          {/* Parsed data */}
          {parsed?.results&&<div style={{marginTop:10}}>
            <div style={{fontSize:10,fontWeight:600,color:B.primary,textTransform:"uppercase",marginBottom:6}}>Dados parseados</div>
            <div style={{background:B.light,borderRadius:8,padding:"10px 12px",fontSize:12,fontFamily:"'IBM Plex Mono'",lineHeight:1.8,color:B.primary}}>
              {Object.entries(parsed.results).filter(([k])=>k!=="confidence").map(([k,v])=>
                <div key={k}><span style={{color:"rgba(59,95,229,0.5)"}}>{k}:</span> <strong>{String(v)||"—"}</strong></div>
              )}
              {parsed.errors?.length>0&&<div style={{color:"#DC2626",marginTop:4}}>Erros: {parsed.errors.join(", ")}</div>}
            </div>
          </div>}

          {/* Error */}
          {detail.error&&<div style={{marginTop:10,background:"#FEF2F2",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#DC2626"}}>{detail.error}</div>}

          {/* Text body */}
          {detail.textBody&&<div style={{marginTop:10}}>
            <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",marginBottom:6}}>Corpo do email (texto)</div>
            <pre style={{fontFamily:"'IBM Plex Mono'",fontSize:11,background:"#1A1A1A",color:"#E8E0D4",padding:"12px",borderRadius:8,maxHeight:300,overflowY:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all",lineHeight:1.6}}>{detail.textBody}</pre>
          </div>}

          {/* HTML body */}
          {detail.htmlBody&&<div style={{marginTop:10}}>
            <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",marginBottom:6}}>Corpo do email (HTML) · {detail.htmlBody.length.toLocaleString()} chars</div>
            <div style={{maxHeight:300,overflowY:"auto",border:"1px solid #E5E5E5",borderRadius:8,padding:"10px",background:"#fff",fontSize:12}} dangerouslySetInnerHTML={{__html:detail.htmlBody.slice(0,20000)}}/>
          </div>}

          {/* Raw payload keys */}
          {detail.rawPayload&&<div style={{marginTop:10}}>
            <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",marginBottom:6}}>Payload bruto (campos)</div>
            <pre style={{fontFamily:"'IBM Plex Mono'",fontSize:10,background:"#FAFAF9",color:"#737373",padding:"10px",borderRadius:8,maxHeight:200,overflowY:"auto",whiteSpace:"pre-wrap",lineHeight:1.5}}>{(() => {try{const p=JSON.parse(detail.rawPayload);return Object.keys(p).map(k=>`${k}: ${String(p[k]).slice(0,200)}${String(p[k]).length>200?"...":""}`).join("\n")}catch{return detail.rawPayload.slice(0,2000)}})()}</pre>
          </div>}
        </div>}
      </div>
    })}
  </div>
}

// ─── LOGS TAB ───────────────────────────────────────────────────
interface EmailLog { id:string; fromEmail:string; toEmail:string|null; subject:string|null; textBody:string|null; htmlBody:string|null; rawPayload:string|null; parsedData:string|null; reservationId:string|null; status:string; error:string|null; createdAt:string }

function LogsTab(){
  const[logs,setLogs]=useState<EmailLog[]>([]);
  const[loading,setLoading]=useState(true);
  const[expandedId,setExpandedId]=useState<string|null>(null);
  const[viewMode,setViewMode]=useState<Record<string,string>>({});

  useEffect(()=>{fetch("/api/logs").then(r=>r.json()).then(setLogs).finally(()=>setLoading(false))},[]);

  const statusColors:Record<string,{c:string;bg:string;l:string}>={
    received:{c:"#D97706",bg:"#FFFBEB",l:"Recebido"},
    success:{c:"#059669",bg:"#ECFDF5",l:"Sucesso"},
    error:{c:"#DC2626",bg:"#FEF2F2",l:"Erro"},
    parse_failed:{c:"#DC2626",bg:"#FEF2F2",l:"Parse falhou"},
    duplicate:{c:"#737373",bg:"#F5F5F5",l:"Duplicata"},
  };

  const toggleView=(id:string,mode:string)=>setViewMode(v=>({...v,[id]:v[id]===mode?"":mode}));

  if(loading)return<div style={{textAlign:"center",padding:48,color:"#A3A3A3",fontSize:14}}>Carregando logs...</div>;
  if(logs.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>📧</div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A",marginBottom:4}}>Nenhum email recebido</div><div style={{fontSize:13,color:"#A3A3A3"}}>Quando um email chegar via webhook, aparecerá aqui.</div></div>;

  return<div style={{display:"flex",flexDirection:"column",gap:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:B.light,borderRadius:10,padding:"10px 14px",fontSize:12,color:B.primary}}><span>📧</span>Últimos {logs.length} emails recebidos via webhook. Clique para expandir.</div>
    {logs.map(log=>{
      const st=statusColors[log.status]||statusColors.received;
      const expanded=expandedId===log.id;
      const mode=viewMode[log.id]||"";
      const date=new Date(log.createdAt);
      const timeStr=`${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}`;
      let parsed:any=null;
      try{if(log.parsedData)parsed=JSON.parse(log.parsedData)}catch{}

      return<div key={log.id} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
        <button onClick={()=>setExpandedId(expanded?null:log.id)} style={{width:"100%",textAlign:"left",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:600,color:"#1A1A1A"}}>{log.subject||"(sem assunto)"}</span>
                <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:10,color:st.c,background:st.bg}}>{st.l}</span>
              </div>
              <div style={{fontSize:12,color:"#A3A3A3",marginTop:4}}>
                De: {log.fromEmail} · {timeStr}
              </div>
            </div>
            <span style={{fontSize:12,color:"#A3A3A3",transform:expanded?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
          </div>
        </button>

        {expanded&&<div style={{padding:"0 16px 16px",borderTop:"1px solid #F0F0F0"}}>
          {log.error&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"8px 12px",marginTop:10,fontSize:12,color:"#DC2626"}}>{log.error}</div>}

          {/* Parsed data summary */}
          {parsed?.results&&<div style={{background:"#FAFAF9",borderRadius:10,padding:"12px 14px",marginTop:10,border:"1px solid #F0F0F0"}}>
            <div style={{fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Dados extraídos pelo parser</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {Object.entries(parsed.results).filter(([k])=>k!=="confidence").map(([k,v])=><div key={k}>
                <span style={{fontSize:10,fontWeight:600,color:"#A3A3A3"}}>{k}: </span>
                <span style={{fontSize:12,fontWeight:500,color:v?"#1A1A1A":"#DC2626"}}>{String(v)||"✗ não encontrado"}</span>
              </div>)}
            </div>
            {parsed.errors?.length>0&&<div style={{marginTop:8,fontSize:11,color:"#D97706"}}>⚠️ Erros: {parsed.errors.join(", ")}</div>}
          </div>}

          {/* Action buttons */}
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            {[{id:"text",l:"📄 Texto",d:!!log.textBody},{id:"html",l:"🌐 HTML",d:!!log.htmlBody},{id:"raw",l:"📦 Payload",d:!!log.rawPayload},{id:"parsed",l:"🔍 Parsed",d:!!log.parsedData}].map(b=>
              <button key={b.id} onClick={()=>toggleView(log.id,b.id)} disabled={!b.d} style={{fontFamily:"Outfit",fontSize:11,fontWeight:600,padding:"6px 12px",background:mode===b.id?B.primary:b.d?"#fff":"#F5F5F5",color:mode===b.id?"#fff":b.d?"#1A1A1A":"#A3A3A3",border:`1px solid ${mode===b.id?B.primary:"#E5E5E5"}`,borderRadius:8,cursor:b.d?"pointer":"not-allowed"}}>{b.l}</button>
            )}
          </div>

          {/* Content viewer */}
          {mode&&<div style={{marginTop:10}}>
            {mode==="text"&&log.textBody&&<pre style={{fontFamily:"'IBM Plex Mono'",fontSize:11,background:"#1A1A1A",color:"#E8E0D4",padding:14,borderRadius:10,maxHeight:400,overflow:"auto",whiteSpace:"pre-wrap",lineHeight:1.6}}>{log.textBody}</pre>}
            {mode==="html"&&log.htmlBody&&<div style={{border:"1px solid #E5E5E5",borderRadius:10,overflow:"hidden"}}><div style={{background:"#FAFAF9",padding:"6px 12px",fontSize:10,fontWeight:600,color:"#A3A3A3",borderBottom:"1px solid #E5E5E5"}}>HTML Preview</div><div style={{maxHeight:500,overflow:"auto",padding:12}} dangerouslySetInnerHTML={{__html:log.htmlBody}}/></div>}
            {mode==="raw"&&log.rawPayload&&<pre style={{fontFamily:"'IBM Plex Mono'",fontSize:11,background:"#1A1A1A",color:"#E8E0D4",padding:14,borderRadius:10,maxHeight:400,overflow:"auto",whiteSpace:"pre-wrap",lineHeight:1.6}}>{log.rawPayload}</pre>}
            {mode==="parsed"&&log.parsedData&&<pre style={{fontFamily:"'IBM Plex Mono'",fontSize:11,background:"#1A1A1A",color:"#E8E0D4",padding:14,borderRadius:10,maxHeight:400,overflow:"auto",whiteSpace:"pre-wrap",lineHeight:1.6}}>{log.parsedData}</pre>}
          </div>}
        </div>}
      </div>
    })}
  </div>
}

// ─── PROPERTIES TAB ─────────────────────────────────────────────
function PropertiesTab({properties,onRefresh}:{properties:Property[];onRefresh:()=>void}){
  const[editingId,setEditingId]=useState<string|null>(null);
  const[form,setForm]=useState({phone:"",name:"",label:""});
  const[saving,setSaving]=useState(false);

  const maskPhone=(v:string)=>{const d=v.replace(/\D/g,"").slice(0,11);if(d.length<=2)return d;if(d.length<=7)return`(${d.slice(0,2)}) ${d.slice(2)}`;return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`};
  const addPhone=async(propId:string)=>{if(!form.phone)return;setSaving(true);await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"add_phone",...form})});setForm({phone:"",name:"",label:""});setSaving(false);onRefresh()};
  const removePhone=async(propId:string,phoneId:string)=>{await fetch(`/api/properties/${propId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"remove_phone",phoneId})});onRefresh()};

  if(properties.length===0)return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:16,padding:48,textAlign:"center"}}><div style={{fontSize:36,marginBottom:8,opacity:0.3}}>🏠</div><div style={{fontSize:16,fontWeight:600,marginBottom:4}}>Nenhum imóvel ainda</div><div style={{fontSize:13,color:"#A3A3A3"}}>Crie uma reserva e o imóvel aparece automaticamente.</div></div>;

  return<div style={{display:"flex",flexDirection:"column",gap:10}}>
    <div style={{display:"flex",alignItems:"center",gap:8,background:B.light,borderRadius:10,padding:"10px 14px",fontSize:12,color:B.primary}}><span>💡</span>Imóveis são criados automaticamente. Configure aqui os telefones das portarias.</div>
    {properties.map(p=><div key={p.id} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:16,fontWeight:600,color:"#1A1A1A"}}>{p.name}</div><div style={{fontSize:12,color:"#A3A3A3",marginTop:2}}>{p.reservationCount} reserva(s) · {p.doormanPhones.length} portaria(s)</div></div><button onClick={()=>setEditingId(editingId===p.id?null:p.id)} style={{fontFamily:"Outfit",fontSize:12,fontWeight:500,padding:"7px 14px",background:"#fff",color:"#1A1A1A",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer"}}>{editingId===p.id?"Fechar":"Editar"}</button></div>
      <div style={{padding:"0 20px 16px",display:"flex",flexDirection:"column",gap:6}}>
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
      </div>
    </div>)}
  </div>
}
