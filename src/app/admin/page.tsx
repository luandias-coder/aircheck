"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const C = {
  bg:"#0F0F0F", card:"#1A1A1A", cardBorder:"#2A2A2A", text:"#E5E5E5", muted:"#737373",
  accent:"#3B82F6", green:"#22C55E", yellow:"#EAB308", red:"#EF4444", purple:"#A855F7",
  orange:"#F97316", cyan:"#06B6D4",
};

type Tab = "overview"|"users"|"reservations"|"properties"|"condominiums"|"emails"|"guests"|"feedback";

const STATUS_LABELS:Record<string,{label:string;color:string}> = {
  pending_form:{label:"Aguardando form",color:C.yellow},
  form_filled:{label:"Form preenchido",color:C.accent},
  sent_to_doorman:{label:"Enviado portaria",color:C.green},
  archived:{label:"Arquivado",color:C.muted},
  cancelled:{label:"Cancelado",color:C.red},
};

const EMAIL_STATUS_LABELS:Record<string,{label:string;color:string}> = {
  received:{label:"Recebido",color:C.muted},
  parsed:{label:"Parseado",color:C.green},
  error:{label:"Erro",color:C.red},
  ignored:{label:"Ignorado",color:C.yellow},
  duplicate:{label:"Duplicado",color:C.orange},
  cancellation:{label:"Cancelamento",color:C.red},
  cancellation_orphan:{label:"Cancel. órfão",color:C.orange},
};

function formatDate(d:string|null){
  if(!d)return "—";
  const dt=new Date(d);
  return dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"})+" "+dt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
}
function shortDate(d:string|null){
  if(!d)return "—";
  return new Date(d).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
}
function timeAgo(d:string|null){
  if(!d)return "—";
  const diff=Date.now()-new Date(d).getTime();
  const mins=Math.floor(diff/60000);
  if(mins<60)return `${mins}min`;
  const hrs=Math.floor(mins/60);
  if(hrs<24)return `${hrs}h`;
  const days=Math.floor(hrs/24);
  if(days<30)return `${days}d`;
  return `${Math.floor(days/30)}m`;
}

export default function AdminPage(){
  const router=useRouter();
  const[data,setData]=useState<any>(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[tab,setTab]=useState<Tab>("overview");

  useEffect(()=>{
    fetch("/api/admin/stats").then(async res=>{
      if(res.status===401){router.push("/login");return}
      if(res.status===403){setError("Acesso negado");setLoading(false);return}
      if(!res.ok)throw new Error("Erro");
      setData(await res.json());
    }).catch(()=>setError("Erro ao carregar")).finally(()=>setLoading(false));
  },[router]);

  if(loading)return<Shell><div style={{textAlign:"center",padding:80,color:C.muted}}>Carregando...</div></Shell>;
  if(error)return<Shell><div style={{textAlign:"center",padding:80,color:C.red}}>{error}</div></Shell>;
  if(!data)return null;

  const o=data.overview;
  const tabs:Array<{id:Tab;label:string;count?:number}>=[
    {id:"overview",label:"Visão Geral"},
    {id:"users",label:"Hosts",count:o.users.total},
    {id:"reservations",label:"Reservas",count:o.reservations.total},
    {id:"guests",label:"Hóspedes",count:o.guests.totalRegistered},
    {id:"properties",label:"Imóveis",count:o.properties.total},
    {id:"condominiums",label:"Portarias",count:o.condominiums?.total||0},
    {id:"emails",label:"Emails",count:o.emails.total},
    {id:"feedback",label:"Feedback",count:o.feedback?.new||0},
  ];

  return<Shell>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2,marginBottom:28,borderBottom:`1px solid ${C.cardBorder}`}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{
        fontFamily:"Outfit",fontSize:13,fontWeight:tab===t.id?600:400,padding:"10px 16px",
        background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`,
        color:tab===t.id?C.accent:C.muted,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s",
      }}>
        {t.label}{t.count!==undefined&&<span style={{marginLeft:6,fontSize:11,background:tab===t.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.06)",padding:"2px 7px",borderRadius:10}}>{t.count}</span>}
      </button>)}
    </div>

    {tab==="overview"&&<OverviewTab o={o}/>}
    {tab==="users"&&<UsersTab users={data.users}/>}
    {tab==="reservations"&&<ReservationsTab reservations={data.reservations}/>}
    {tab==="guests"&&<GuestsTab o={o}/>}
    {tab==="properties"&&<PropertiesTab properties={data.properties}/>}
    {tab==="condominiums"&&<CondominiumsTab condominiums={data.condominiums||[]} stats={o.condominiums}/>}
    {tab==="emails"&&<EmailsTab logs={data.emailLogs} stats={o.emails}/>}
    {tab==="feedback"&&<FeedbackAdminTab feedbacks={data.feedbacks} stats={o.feedback}/>}
  </Shell>
}

function Shell({children}:{children:React.ReactNode}){
  return<div style={{minHeight:"100vh",background:C.bg,fontFamily:"Outfit,sans-serif",color:C.text}}>
    <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px 60px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Admin</div>
          <h1 style={{fontSize:24,fontWeight:900,letterSpacing:"-0.03em",margin:0}}>AirCheck Dashboard</h1>
        </div>
        <a href="/dashboard" style={{fontSize:12,color:C.muted,textDecoration:"none"}}>← Voltar ao painel</a>
      </div>
      {children}
    </div>
  </div>
}

// ─── METRIC CARD ────────────────────────────────────────────────
function Metric({label,value,sub,color}:{label:string;value:string|number;sub?:string;color?:string}){
  return<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:"16px 18px",flex:"1 1 150px",minWidth:140}}>
    <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{label}</div>
    <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.03em",color:color||C.text}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
  </div>
}

function StatusDot({color}:{color:string}){
  return<span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:color,marginRight:6}}/>
}

// ─── TABLE ──────────────────────────────────────────────────────
function Table({columns,rows}:{columns:Array<{key:string;label:string;width?:number}>;rows:any[]}){
  return<div style={{overflowX:"auto",borderRadius:12,border:`1px solid ${C.cardBorder}`}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Outfit",fontSize:13}}>
      <thead>
        <tr style={{background:"rgba(255,255,255,0.03)"}}>
          {columns.map(c=><th key={c.key} style={{textAlign:"left",padding:"10px 14px",fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`1px solid ${C.cardBorder}`,whiteSpace:"nowrap",width:c.width}}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${C.cardBorder}`}}>
          {columns.map(c=><td key={c.key} style={{padding:"10px 14px",color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:c.width||200}}>{r[c.key]}</td>)}
        </tr>)}
        {rows.length===0&&<tr><td colSpan={columns.length} style={{padding:24,textAlign:"center",color:C.muted}}>Nenhum dado</td></tr>}
      </tbody>
    </table>
  </div>
}

// ─── OVERVIEW TAB ───────────────────────────────────────────────
function OverviewTab({o}:{o:any}){
  const funnelSteps=[
    {label:"Emails recebidos",value:o.funnel.emailsReceived,color:C.cyan},
    {label:"Reservas criadas",value:o.funnel.reservationsCreated,color:C.accent},
    {label:"Forms preenchidos",value:o.funnel.formsFilled,color:C.purple},
    {label:"Enviados portaria",value:o.funnel.sentToDoorman,color:C.green},
  ];

  return<div style={{display:"flex",flexDirection:"column",gap:24}}>
    {/* Top metrics */}
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <Metric label="Hosts" value={o.users.total} sub={`${o.users.thisWeek} esta semana`} color={C.accent}/>
      <Metric label="Reservas" value={o.reservations.total} sub={`${o.reservations.today} hoje · ${o.reservations.thisMonth} mês`}/>
      <Metric label="Hóspedes (registrados)" value={o.guests.totalRegistered} sub={`${o.guests.totalExpected} esperados`} color={C.purple}/>
      <Metric label="Imóveis" value={o.properties.total} sub={`${o.properties.linkedToCondo||0} vinculados · ${o.properties.whatsappOnly||0} WhatsApp`}/>
      <Metric label="Portarias" value={o.condominiums?.total||0} sub={`${o.condominiums?.porteiros||0} porteiros · ${o.condominiums?.admins||0} admins`} color={C.orange}/>
      <Metric label="Emails" value={o.emails.total} sub={`${o.emails.today} hoje`} color={C.cyan}/>
      <Metric label="Satisfação" value={o.feedback?.avgRating?`${o.feedback.avgRating} ⭐`:"—"} sub={`NPS ${o.feedback?.nps||0} · ${o.feedback?.total||0} avaliações`} color={o.feedback?.nps>=50?C.green:o.feedback?.nps>=0?C.yellow:C.red}/>
    </div>

    {/* Funnel */}
    <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Funil de conversão</div>
      <div style={{display:"flex",gap:4,alignItems:"end"}}>
        {funnelSteps.map((s,i)=>{
          const maxVal=Math.max(...funnelSteps.map(x=>x.value),1);
          const pct=Math.max((s.value/maxVal)*120,20);
          const convRate=i>0&&funnelSteps[i-1].value>0?Math.round((s.value/funnelSteps[i-1].value)*100):null;
          return<div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:s.color,marginBottom:4}}>{s.value}</div>
            <div style={{height:pct,background:s.color,borderRadius:"6px 6px 0 0",opacity:0.25,marginBottom:8,transition:"height 0.5s"}}/>
            <div style={{fontSize:11,fontWeight:500,color:C.text,marginBottom:2}}>{s.label}</div>
            {convRate!==null&&<div style={{fontSize:10,color:convRate>=50?C.green:convRate>=20?C.yellow:C.red}}>{convRate}%</div>}
          </div>
        })}
      </div>
    </div>

    {/* Status breakdown + Onboarding */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
      <div style={{flex:"1 1 300px",background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Reservas por status</div>
        {Object.entries(o.reservations.byStatus).map(([s,count])=>{
          const info=STATUS_LABELS[s]||{label:s,color:C.muted};
          const pct=o.reservations.total>0?Math.round(((count as number)/o.reservations.total)*100):0;
          return<div key={s} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <StatusDot color={info.color}/>
            <div style={{flex:1,fontSize:13}}>{info.label}</div>
            <div style={{fontSize:13,fontWeight:600,fontFamily:"'IBM Plex Mono'",minWidth:30,textAlign:"right"}}>{count as number}</div>
            <div style={{width:60,height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",background:info.color,borderRadius:3}}/>
            </div>
            <div style={{fontSize:11,color:C.muted,minWidth:32,textAlign:"right"}}>{pct}%</div>
          </div>
        })}
      </div>
      <div style={{flex:"1 1 250px",background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Onboarding</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
          <div style={{position:"relative",width:64,height:64}}>
            <svg width={64} height={64} viewBox="0 0 64 64">
              <circle cx={32} cy={32} r={28} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}/>
              <circle cx={32} cy={32} r={28} fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round"
                strokeDasharray={`${(o.users.onboarded/Math.max(o.users.total,1))*176} 176`} transform="rotate(-90 32 32)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>
              {o.users.total>0?Math.round((o.users.onboarded/o.users.total)*100):0}%
            </div>
          </div>
          <div>
            <div style={{fontSize:13}}><span style={{fontWeight:700,color:C.green}}>{o.users.onboarded}</span> completaram</div>
            <div style={{fontSize:13,marginTop:2}}><span style={{fontWeight:700,color:C.yellow}}>{o.users.total-o.users.onboarded}</span> pendentes</div>
          </div>
        </div>
        <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,marginTop:8}}>Emails</div>
        {Object.entries(o.emails.byStatus).map(([s,count])=>{
          const info=EMAIL_STATUS_LABELS[s]||{label:s,color:C.muted};
          return<div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <StatusDot color={info.color}/><span style={{flex:1,fontSize:12}}>{info.label}</span>
            <span style={{fontSize:12,fontWeight:600,fontFamily:"'IBM Plex Mono'"}}>{count as number}</span>
          </div>
        })}
      </div>
    </div>
  </div>
}

// ─── USERS TAB ──────────────────────────────────────────────────
function UsersTab({users}:{users:any[]}){
  const[search,setSearch]=useState("");
  const filtered=users.filter(u=>
    (u.email||"").toLowerCase().includes(search.toLowerCase())||
    (u.name||"").toLowerCase().includes(search.toLowerCase())||
    (u.phone||"").includes(search)
  );

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por email, nome ou telefone..." style={{
      fontFamily:"Outfit",fontSize:14,padding:"10px 16px",background:C.card,border:`1px solid ${C.cardBorder}`,
      borderRadius:10,color:C.text,width:"100%",boxSizing:"border-box",
    }}/>
    <Table columns={[
      {key:"name",label:"Nome",width:140},
      {key:"email",label:"Email",width:200},
      {key:"phone",label:"Telefone",width:130},
      {key:"onboarded",label:"Onboard",width:70},
      {key:"properties",label:"Imóveis",width:65},
      {key:"reservations",label:"Reservas",width:70},
      {key:"lastActivity",label:"Última ativ.",width:90},
      {key:"createdAt",label:"Cadastro",width:90},
    ]} rows={filtered.map(u=>({
      name:u.name||<span style={{color:C.muted}}>—</span>,
      email:u.email,
      phone:u.phone||<span style={{color:C.muted}}>—</span>,
      onboarded:u.onboarded?<span style={{color:C.green}}>✓</span>:<span style={{color:C.yellow}}>✗</span>,
      properties:u.properties,
      reservations:u.reservations,
      lastActivity:timeAgo(u.lastActivity),
      createdAt:shortDate(u.createdAt),
    }))}/>
  </div>
}

// ─── RESERVATIONS TAB ───────────────────────────────────────────
function ReservationsTab({reservations}:{reservations:any[]}){
  const[filter,setFilter]=useState("all");
  const filtered=filter==="all"?reservations:reservations.filter(r=>r.status===filter);

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {[{id:"all",label:"Todas"},{id:"pending_form",label:"Aguardando"},{id:"form_filled",label:"Preenchido"},{id:"sent_to_doorman",label:"Portaria"},{id:"cancelled",label:"Cancelada"},{id:"archived",label:"Arquivo"}].map(f=>
        <button key={f.id} onClick={()=>setFilter(f.id)} style={{
          fontFamily:"Outfit",fontSize:12,fontWeight:filter===f.id?600:400,padding:"6px 14px",
          background:filter===f.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)",
          color:filter===f.id?C.accent:C.muted,border:`1px solid ${filter===f.id?C.accent:C.cardBorder}`,
          borderRadius:20,cursor:"pointer",
        }}>{f.label}</button>
      )}
    </div>
    <Table columns={[
      {key:"guest",label:"Hóspede",width:150},
      {key:"host",label:"Host",width:130},
      {key:"property",label:"Imóvel",width:130},
      {key:"numGuests",label:"Hósp.",width:50},
      {key:"status",label:"Status",width:130},
      {key:"checkIn",label:"Check-in",width:80},
      {key:"nights",label:"Noites",width:55},
      {key:"createdAt",label:"Criada",width:80},
    ]} rows={filtered.map(r=>{
      const st=STATUS_LABELS[r.status]||{label:r.status,color:C.muted};
      return{
        guest:r.guest,
        host:r.host,
        property:r.property,
        numGuests:<span style={{fontFamily:"'IBM Plex Mono'"}}>{r.guestsRegistered}/{r.numGuests}</span>,
        status:<span><StatusDot color={st.color}/>{st.label}</span>,
        checkIn:r.checkIn,
        nights:r.nights||"—",
        createdAt:shortDate(r.createdAt),
      }
    })}/>
  </div>
}

// ─── GUESTS TAB ─────────────────────────────────────────────────
function GuestsTab({o}:{o:any}){
  const dist=o.guests.distribution as Record<string,number>;
  const entries=Object.entries(dist).sort(([a],[b])=>Number(a)-Number(b));
  const maxCount=Math.max(...entries.map(([,v])=>v as number),1);
  const totalRes=entries.reduce((s,[,v])=>s+(v as number),0);

  // Revenue simulation
  const pricePerGuest=3;
  const pricePerReservation=5;
  const revenueByGuest=o.guests.totalExpected*pricePerGuest;
  const revenueByReservation=o.reservations.total*pricePerReservation;

  return<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {/* Guest metrics */}
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <Metric label="Hóspedes esperados" value={o.guests.totalExpected} sub="Soma de numGuests" color={C.purple}/>
      <Metric label="Hóspedes registrados" value={o.guests.totalRegistered} sub={`${o.guests.thisWeek} esta semana`} color={C.green}/>
      <Metric label="Esta semana" value={o.guests.thisWeek} color={C.cyan}/>
      <Metric label="Este mês" value={o.guests.thisMonth} color={C.accent}/>
    </div>

    {/* Distribution chart */}
    <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Distribuição: hóspedes por reserva</div>
      <div style={{display:"flex",gap:8,alignItems:"end",minHeight:140}}>
        {entries.map(([n,count])=>{
          const pct=Math.max(((count as number)/maxCount)*120,16);
          const resPct=totalRes>0?Math.round(((count as number)/totalRes)*100):0;
          return<div key={n} style={{flex:1,textAlign:"center",maxWidth:80}}>
            <div style={{fontSize:14,fontWeight:700,color:C.purple,marginBottom:4}}>{count as number}</div>
            <div style={{height:pct,background:`linear-gradient(180deg,${C.purple},${C.accent})`,borderRadius:"6px 6px 0 0",opacity:0.4,marginBottom:6}}/>
            <div style={{fontSize:13,fontWeight:600,color:C.text}}>{n}</div>
            <div style={{fontSize:10,color:C.muted}}>{n==="1"?"hóspede":"hóspedes"}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{resPct}%</div>
          </div>
        })}
      </div>
    </div>

    {/* Revenue simulation */}
    <div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Simulação de receita (R$ 3,00 por unidade)</div>
      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:10,padding:16}}>
          <div style={{fontSize:11,color:C.purple,fontWeight:600,marginBottom:6}}>Cobrando por hóspede</div>
          <div style={{fontSize:28,fontWeight:800,color:C.purple}}>R$ {revenueByGuest.toFixed(2)}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{o.guests.totalExpected} hóspedes × R$ {pricePerGuest}</div>
        </div>
        <div style={{flex:"1 1 200px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:16}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:600,marginBottom:6}}>Cobrando por reserva</div>
          <div style={{fontSize:28,fontWeight:800,color:C.accent}}>R$ {revenueByReservation.toFixed(2)}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{o.reservations.total} reservas × R$ {pricePerReservation}</div>
        </div>
        <div style={{flex:"1 1 200px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:16}}>
          <div style={{fontSize:11,color:C.green,fontWeight:600,marginBottom:6}}>Diferença</div>
          <div style={{fontSize:28,fontWeight:800,color:revenueByGuest>revenueByReservation?C.green:C.red}}>
            {revenueByGuest>revenueByReservation?"+":""}R$ {(revenueByGuest-revenueByReservation).toFixed(2)}
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>
            Média {o.reservations.total>0?(o.guests.totalExpected/o.reservations.total).toFixed(1):"—"} hóspedes/reserva
          </div>
        </div>
      </div>
    </div>
  </div>
}

// ─── PROPERTIES TAB ─────────────────────────────────────────────
function PropertiesTab({properties}:{properties:any[]}){
  return<Table columns={[
    {key:"name",label:"Imóvel",width:160},
    {key:"host",label:"Host",width:150},
    {key:"unit",label:"Unidade",width:80},
    {key:"parking",label:"Vaga",width:80},
    {key:"doormanPhones",label:"Portarias",width:75},
    {key:"reservations",label:"Reservas",width:70},
    {key:"createdAt",label:"Criado",width:80},
  ]} rows={properties.map(p=>({
    name:<div style={{display:"flex",alignItems:"center",gap:5}}><span>{p.name}</span>{p.airbnbRoomId&&<a href={`https://www.airbnb.com.br/rooms/${p.airbnbRoomId}`} target="_blank" rel="noopener noreferrer" title="Ver no Airbnb" onClick={e=>e.stopPropagation()} style={{display:"inline-flex",flexShrink:0,opacity:0.85}}><svg width="14" height="14" viewBox="0 0 32 32" fill="none"><path d="M16 2C8.27812 2 2 8.27812 2 16C2 23.7219 8.27812 30 16 30C23.7219 30 30 23.7219 30 16C30 8.27812 23.7219 2 16 2Z" fill="#FF5A5F"/><path d="M16.0003 19.6867C15.0825 18.5322 14.5426 17.5201 14.3626 16.6542C14.1826 15.9506 14.2546 15.3914 14.5605 14.9765C14.8845 14.4894 15.3704 14.2549 16.0003 14.2549C16.6302 14.2549 17.1162 14.4894 17.4401 14.9765C17.7461 15.3914 17.818 15.9506 17.6381 16.6542C17.4401 17.5382 16.9002 18.5484 16.0003 19.6867ZM21.0251 22.3566C19.4954 23.0241 17.9818 21.9597 16.686 20.5165C18.8295 17.8268 19.2254 15.7342 18.3058 14.3794C17.7659 13.6037 16.992 13.2248 16.0003 13.2248C14.0026 13.2248 12.903 14.9206 13.3349 16.8887C13.5869 17.9531 14.2528 19.1636 15.3146 20.5165C14.5182 21.4012 13.4733 22.4047 12.2191 22.519C10.4014 22.7896 8.97781 21.0217 9.62571 19.1978L14.2348 9.63307C14.6282 8.91403 15.1137 8.29812 15.9985 8.29812C16.6464 8.29812 17.1503 8.67696 17.3663 8.98363L22.3713 19.1978C22.8617 20.432 22.2398 21.8308 21.0251 22.3566ZM23.3468 18.837L19.0617 9.90367C18.2518 8.244 17.6759 7.25 16.0003 7.25C14.3446 7.25 13.6409 8.40455 12.921 9.90367L8.65386 18.837C7.73601 21.3644 9.62571 23.5833 11.9132 23.5833C12.0572 23.5833 12.2001 23.5653 12.3451 23.5653C13.5329 23.421 14.7585 22.6633 16.0003 21.3085C17.2421 22.6615 18.4677 23.421 19.6556 23.5653C19.8006 23.5653 19.9435 23.5833 20.0875 23.5833C22.3749 23.5851 24.2646 21.3644 23.3468 18.837Z" fill="white"/></svg></a>}</div>,
    host:p.host,
    unit:p.unit||<span style={{color:C.muted}}>—</span>,
    parking:p.parking||<span style={{color:C.muted}}>—</span>,
    doormanPhones:p.doormanPhones>0?<span style={{color:C.green}}>{p.doormanPhones}</span>:<span style={{color:C.red}}>0</span>,
    reservations:p.reservations,
    createdAt:shortDate(p.createdAt),
  }))}/>
}

// ─── CONDOMINIUMS TAB ────────────────────────────────────────────
function CondominiumsTab({condominiums,stats}:{condominiums:any[];stats:any}){
  return<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {/* Stats */}
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <Metric label="Condomínios" value={stats?.total||0} color={C.orange}/>
      <Metric label="Ativos" value={stats?.active||0} color={C.green}/>
      <Metric label="Porteiros" value={stats?.porteiros||0} color={C.cyan}/>
      <Metric label="Admins" value={stats?.admins||0} color={C.accent}/>
      <Metric label="Imóveis vinculados" value={stats?.propertiesLinked||0} color={C.purple}/>
    </div>

    {/* Condo cards */}
    {condominiums.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Nenhum condomínio cadastrado</div>}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {condominiums.map((c:any)=>(
        <div key={c.id} style={{background:C.card,border:`1px solid ${c.active?C.cardBorder:C.red}`,borderRadius:12,padding:"18px 20px"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🏢</span>
                <span style={{fontSize:16,fontWeight:700,color:"#fff"}}>{c.name}</span>
                <span style={{fontSize:11,fontWeight:600,fontFamily:"'IBM Plex Mono'",color:C.accent,background:"rgba(59,130,246,0.15)",padding:"2px 8px",borderRadius:6}}>{c.code}</span>
                {!c.active&&<span style={{fontSize:10,fontWeight:600,color:C.red,background:"rgba(239,68,68,0.15)",padding:"2px 8px",borderRadius:6}}>INATIVO</span>}
              </div>
              {c.address&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>📍 {c.address}</div>}
              {(c.contactName||c.contactPhone)&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{c.contactName}{c.contactName&&c.contactPhone?" · ":""}{c.contactPhone}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase"}}>{c.plan}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{shortDate(c.createdAt)}</div>
            </div>
          </div>

          {/* Metrics row */}
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[
              {l:"Imóveis",v:c.properties,color:C.purple},
              {l:"Anfitriões",v:c.uniqueHosts,color:C.accent},
              {l:"Reservas",v:c.reservations,color:C.cyan},
              {l:"Admins",v:c.admins,color:C.green},
              {l:"Porteiros",v:c.porteiros,color:C.orange},
              {l:"Modo",v:c.reportMode==="dashboard"?"Painel":"WhatsApp",color:c.reportMode==="dashboard"?C.accent:C.green},
            ].map((m,i)=>(
              <div key={i} style={{textAlign:"center",minWidth:60}}>
                <div style={{fontSize:20,fontWeight:800,color:m.color}}>{m.v}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
}

// ─── EMAILS TAB ─────────────────────────────────────────────────
function EmailsTab({logs,stats}:{logs:any[];stats:any}){
  const[filter,setFilter]=useState("all");
  const filtered=filter==="all"?logs:logs.filter(e=>e.status===filter);

  return<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {[{id:"all",label:"Todos"},...Object.entries(EMAIL_STATUS_LABELS).map(([id,v])=>({id,label:v.label}))].map(f=>
        <button key={f.id} onClick={()=>setFilter(f.id)} style={{
          fontFamily:"Outfit",fontSize:12,fontWeight:filter===f.id?600:400,padding:"6px 14px",
          background:filter===f.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)",
          color:filter===f.id?C.accent:C.muted,border:`1px solid ${filter===f.id?C.accent:C.cardBorder}`,
          borderRadius:20,cursor:"pointer",
        }}>{f.label}{stats.byStatus[f.id]?` (${stats.byStatus[f.id]})`:""}</button>
      )}
    </div>
    <Table columns={[
      {key:"from",label:"De",width:200},
      {key:"subject",label:"Assunto",width:250},
      {key:"status",label:"Status",width:100},
      {key:"hasRes",label:"Reserva",width:65},
      {key:"error",label:"Erro",width:200},
      {key:"time",label:"Quando",width:80},
    ]} rows={filtered.map(e=>{
      const st=EMAIL_STATUS_LABELS[e.status]||{label:e.status,color:C.muted};
      return{
        from:e.from,
        subject:e.subject||<span style={{color:C.muted}}>—</span>,
        status:<span><StatusDot color={st.color}/>{st.label}</span>,
        hasRes:e.hasReservation?<span style={{color:C.green}}>✓</span>:<span style={{color:C.muted}}>—</span>,
        error:e.error?<span style={{color:C.red,fontSize:11}} title={e.error}>{e.error.substring(0,40)}{e.error.length>40?"...":""}</span>:<span style={{color:C.muted}}>—</span>,
        time:formatDate(e.createdAt),
      }
    })}/>
  </div>
}

// ─── FEEDBACK ADMIN TAB ─────────────────────────────────────────
const FB_STATUS:Record<string,{label:string;color:string}>={
  new:{label:"Novo",color:C.yellow},
  seen:{label:"Visto",color:C.accent},
  planned:{label:"Planejado",color:C.purple},
  done:{label:"Implementado",color:C.green},
};
const FB_CATS:Record<string,{emoji:string;label:string}>={
  sugestao:{emoji:"💡",label:"Sugestão"},
  bug:{emoji:"🐛",label:"Problema"},
  elogio:{emoji:"🎉",label:"Elogio"},
};

function FeedbackAdminTab({feedbacks:initialFeedbacks,stats}:{feedbacks:any[];stats:any}){
  const[feedbacks,setFeedbacks]=useState(initialFeedbacks);
  const[filter,setFilter]=useState("all");
  const[replyId,setReplyId]=useState<string|null>(null);
  const[replyText,setReplyText]=useState("");
  const[saving,setSaving]=useState(false);

  const filtered=filter==="all"?feedbacks:feedbacks.filter((f:any)=>f.status===filter||f.category===filter);

  const updateFeedback=async(id:string,upd:any)=>{
    setSaving(true);
    try{
      const res=await fetch("/api/admin/feedback",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,...upd})});
      if(!res.ok)throw new Error();
      setFeedbacks((prev:any[])=>prev.map(f=>f.id===id?{...f,...upd}:f));
    }catch{alert("Erro ao salvar")}
    finally{setSaving(false)}
  };

  return<div style={{display:"flex",flexDirection:"column",gap:20}}>
    {/* Stats row */}
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <Metric label="Total" value={stats?.total||0}/>
      <Metric label="Novos" value={stats?.new||0} color={C.yellow}/>
      <Metric label="Nota média" value={stats?.avgRating||"—"} color={C.accent}/>
      <Metric label="NPS" value={stats?.nps||0} sub={stats?.nps>=50?"Excelente":stats?.nps>=0?"Bom":"Crítico"} color={stats?.nps>=50?C.green:stats?.nps>=0?C.yellow:C.red}/>
    </div>

    {/* Rating distribution */}
    {stats?.ratingDist&&<div style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Distribuição de notas</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[5,4,3,2,1].map(n=>{
          const count=stats.ratingDist[n]||0;
          const pct=stats.total>0?Math.round((count/stats.total)*100):0;
          return<div key={n} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:13,minWidth:24,textAlign:"right"}}>{n} ⭐</span>
            <div style={{flex:1,height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",background:n>=4?C.green:n===3?C.yellow:C.red,borderRadius:4,transition:"width 0.5s"}}/>
            </div>
            <span style={{fontSize:12,color:C.muted,minWidth:50,fontFamily:"'IBM Plex Mono'"}}>{count} ({pct}%)</span>
          </div>
        })}
      </div>
    </div>}

    {/* Filters */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {[{id:"all",label:"Todos"},...Object.entries(FB_STATUS).map(([id,v])=>({id,label:v.label})),...Object.entries(FB_CATS).map(([id,v])=>({id,label:`${v.emoji} ${v.label}`}))].map(f=>
        <button key={f.id} onClick={()=>setFilter(f.id)} style={{
          fontFamily:"Outfit",fontSize:12,fontWeight:filter===f.id?600:400,padding:"6px 14px",
          background:filter===f.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)",
          color:filter===f.id?C.accent:C.muted,border:`1px solid ${filter===f.id?C.accent:C.cardBorder}`,
          borderRadius:20,cursor:"pointer",
        }}>{f.label}</button>
      )}
    </div>

    {/* Feedback cards */}
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Nenhum feedback</div>}
      {filtered.map((f:any)=>{
        const cat=FB_CATS[f.category]||FB_CATS.sugestao;
        const st=FB_STATUS[f.status]||FB_STATUS.new;
        return<div key={f.id} style={{background:C.card,border:`1px solid ${f.status==="new"?C.yellow:C.cardBorder}`,borderRadius:12,padding:"16px 18px"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>{cat.emoji}</span>
              <span style={{fontSize:13,fontWeight:600}}>{f.user}</span>
              <span style={{fontSize:12,color:C.muted}}>·</span>
              <span style={{fontSize:12}}>{"⭐".repeat(f.rating)}</span>
            </div>
            <span style={{fontSize:10,color:C.muted}}>{formatDate(f.createdAt)}</span>
          </div>

          {/* Message */}
          <div style={{fontSize:13,color:C.text,lineHeight:1.6,marginBottom:12,whiteSpace:"pre-wrap"}}>{f.message}</div>

          {/* Admin note */}
          {f.adminNote&&<div style={{padding:"10px 14px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,fontSize:12,color:C.accent,lineHeight:1.5,marginBottom:12}}>
            <span style={{fontWeight:600}}>Sua resposta:</span> {f.adminNote}
          </div>}

          {/* Actions */}
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {Object.entries(FB_STATUS).map(([id,v])=>
              <button key={id} onClick={()=>updateFeedback(f.id,{status:id})} disabled={saving} style={{
                fontFamily:"Outfit",fontSize:11,fontWeight:f.status===id?600:400,padding:"5px 12px",
                background:f.status===id?`${v.color}22`:"transparent",
                color:f.status===id?v.color:C.muted,
                border:`1px solid ${f.status===id?v.color:C.cardBorder}`,borderRadius:6,cursor:"pointer",
              }}>{v.label}</button>
            )}
            <div style={{flex:1}}/>
            <button onClick={()=>{setReplyId(replyId===f.id?null:f.id);setReplyText(f.adminNote||"")}} style={{
              fontFamily:"Outfit",fontSize:11,fontWeight:500,padding:"5px 12px",
              background:"transparent",color:C.accent,border:`1px solid ${C.accent}`,borderRadius:6,cursor:"pointer",
            }}>{replyId===f.id?"Cancelar":"Responder"}</button>
          </div>

          {/* Reply form */}
          {replyId===f.id&&<div style={{marginTop:10,display:"flex",gap:8}}>
            <input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Resposta para o host..." onKeyDown={e=>{if(e.key==="Enter"&&replyText.trim()){updateFeedback(f.id,{adminNote:replyText.trim()});setReplyId(null)}}} style={{
              flex:1,fontFamily:"Outfit",fontSize:13,padding:"8px 12px",background:"rgba(255,255,255,0.06)",
              border:`1px solid ${C.cardBorder}`,borderRadius:8,color:C.text,
            }}/>
            <button onClick={()=>{if(replyText.trim()){updateFeedback(f.id,{adminNote:replyText.trim()});setReplyId(null)}}} disabled={!replyText.trim()||saving} style={{
              fontFamily:"Outfit",fontSize:12,fontWeight:600,padding:"8px 16px",background:C.accent,color:"#fff",
              border:"none",borderRadius:8,cursor:"pointer",opacity:!replyText.trim()?0.5:1,
            }}>Enviar</button>
          </div>}
        </div>
      })}
    </div>
  </div>
}
