"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", accent:"#059669", dark:"#0F0F0F" };

interface Guest { id:string; fullName:string; birthDate:string; cpf:string|null; rg:string|null; foreign:boolean; passport:string|null; rne:string|null; documentUrl:string|null }
interface CheckIn { id:string; guestName:string; guestPhone:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; status:string; confirmationCode:string|null; carPlate:string|null; carModel:string|null; property:{ id:string; name:string; unitNumber:string|null; parkingSpot:string|null }; guests:Guest[] }
interface Stats { today:number; upcoming:number; pending:number; totalProperties:number }
interface CondoUser { id:string; name:string; email:string; role:string }
interface Condo { id:string; name:string; code:string; address:string|null }

const STATUS: Record<string,{l:string;c:string;bg:string;icon:string}> = {
  pending_form: { l:"Aguardando dados", c:"#D97706", bg:"#FFFBEB", icon:"⏳" },
  form_filled:  { l:"Dados recebidos",  c:"#059669", bg:"#ECFDF5", icon:"✅" },
  sent_to_doorman:{ l:"Confirmado",     c:"#2563EB", bg:"#EFF6FF", icon:"📨" },
};

function parseDate(d:string):Date { const[dd,mm,yy]=d.split("/").map(Number); return new Date(yy,mm-1,dd) }
function isToday(d:string):boolean { const p=parseDate(d); const n=new Date(); n.setHours(0,0,0,0); return p.getTime()===n.getTime() }
function isTomorrow(d:string):boolean { const p=parseDate(d); const n=new Date(); n.setHours(0,0,0,0); n.setDate(n.getDate()+1); return p.getTime()===n.getTime() }
function dayLabel(d:string):string { if(isToday(d))return"Hoje"; if(isTomorrow(d))return"Amanhã"; return d }

export default function PortariaDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CondoUser|null>(null);
  const [condo, setCondo] = useState<Condo|null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<Stats>({ today:0, upcoming:0, pending:0, totalProperties:0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today"|"week"|"all">("week");
  const [expandedId, setExpandedId] = useState<string|null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, checkinRes] = await Promise.all([
        fetch("/api/portaria/auth/me"),
        fetch(`/api/portaria/checkins?range=${range}`),
      ]);
      if (!meRes.ok) { router.push("/portaria/login"); return; }
      const meData = await meRes.json();
      setUser(meData.user);
      setCondo(meData.condominium);

      if (checkinRes.ok) {
        const data = await checkinRes.json();
        setCheckins(data.checkins);
        setStats(data.stats);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [router, range]);

  useEffect(() => { fetchData() }, [fetchData]);

  const logout = async () => { await fetch("/api/portaria/auth/logout", { method: "POST" }); router.push("/portaria/login") };

  // Group check-ins by date
  const grouped: Record<string, CheckIn[]> = {};
  checkins.forEach(c => {
    const label = dayLabel(c.checkInDate);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c);
  });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0F0F0F", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Outfit", color:"#525252" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      Carregando...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0F0F0F", fontFamily:"Outfit,sans-serif", color:"#E5E5E5" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:"#1A1A1A", borderBottom:"1px solid #2A2A2A" }}>
        <div style={{ maxWidth:800, margin:"0 auto", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${B.g1}, ${B.g2})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none"><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{condo?.name}</div>
              <div style={{ fontSize:11, color:"#525252" }}>Painel da Portaria · {condo?.code}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:12, color:"#525252", textAlign:"right" }}>
              <div style={{ color:"#A3A3A3" }}>{user?.name}</div>
              <div>{user?.role === "admin" ? "Administrador" : user?.role === "sindico" ? "Síndico" : "Porteiro"}</div>
            </div>
            <button onClick={logout} style={{ fontFamily:"Outfit", fontSize:11, fontWeight:500, padding:"6px 12px", background:"none", color:"#525252", border:"1px solid #333", borderRadius:8, cursor:"pointer" }}>Sair</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"20px 20px 40px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:24 }}>
          {[
            { l:"Hoje", v:stats.today, icon:"📋", color: stats.today > 0 ? "#3B5FE5" : undefined },
            { l:"Próximos", v:stats.upcoming, icon:"📅" },
            { l:"Pendentes", v:stats.pending, icon:"⏳", color: stats.pending > 0 ? "#D97706" : undefined },
            { l:"Unidades", v:stats.totalProperties, icon:"🏢" },
          ].map((s, i) => (
            <div key={i} style={{ background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:14, padding:"16px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:500, color:"#525252", textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.l}</div>
                  <div style={{ fontSize:28, fontWeight:800, color: s.color || "#E5E5E5", marginTop:4, lineHeight:1 }}>{s.v}</div>
                </div>
                <span style={{ fontSize:18, opacity:0.4 }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:4, marginBottom:20 }}>
          {([["today","Hoje"],["week","Próximos 7 dias"],["all","Todos"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} style={{
              fontFamily:"Outfit", fontSize:12, fontWeight:range===v?600:400, padding:"8px 16px",
              background: range===v ? B.primary : "transparent",
              color: range===v ? "#fff" : "#737373",
              border: range===v ? "none" : "1px solid #333",
              borderRadius:8, cursor:"pointer"
            }}>{l}</button>
          ))}
        </div>

        {/* Check-ins */}
        {checkins.length === 0 ? (
          <div style={{ background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:16, padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:8, opacity:0.2 }}>📋</div>
            <div style={{ fontSize:16, fontWeight:600, color:"#A3A3A3", marginBottom:4 }}>Nenhum check-in {range==="today"?"para hoje":"no período"}</div>
            <div style={{ fontSize:13, color:"#525252" }}>Quando houver reservas, elas aparecerão aqui automaticamente.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} style={{ marginBottom:20 }}>
              {/* Date header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:700, color: dateLabel==="Hoje" ? B.primary : "#A3A3A3" }}>{dateLabel}</div>
                <div style={{ flex:1, height:1, background:"#2A2A2A" }} />
                <div style={{ fontSize:12, fontWeight:600, color:"#525252" }}>{items.length} check-in{items.length!==1?"s":""}</div>
              </div>

              {/* Cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {items.map(c => {
                  const st = STATUS[c.status] || STATUS.pending_form;
                  const expanded = expandedId === c.id;
                  const hasGuests = c.guests.length > 0;

                  return (
                    <div key={c.id} style={{ background:"#1A1A1A", border:`1px solid ${expanded?"#333":"#2A2A2A"}`, borderRadius:14, overflow:"hidden", transition:"border-color 0.2s" }}>
                      {/* Summary row */}
                      <button onClick={() => setExpandedId(expanded ? null : c.id)} style={{
                        width:"100%", textAlign:"left", background:"none", border:"none", padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, color:"#E5E5E5", fontFamily:"Outfit"
                      }}>
                        {/* Unit number badge */}
                        <div style={{ width:48, height:48, borderRadius:12, background:"#111", border:"1px solid #2A2A2A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, flexDirection:"column" }}>
                          <div style={{ fontSize:8, fontWeight:600, color:"#525252", textTransform:"uppercase" }}>Unid.</div>
                          <div style={{ fontSize:16, fontWeight:800, color:"#fff", lineHeight:1 }}>{c.property.unitNumber || "?"}</div>
                        </div>

                        {/* Info */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            <span style={{ fontSize:15, fontWeight:600, color:"#fff" }}>{c.guestName}</span>
                            <span style={{ fontSize:11, fontWeight:600, color:st.c, background:st.bg, padding:"2px 8px", borderRadius:10 }}>{st.icon} {st.l}</span>
                          </div>
                          <div style={{ fontSize:12, color:"#525252", marginTop:4 }}>
                            {c.checkInTime} → {c.checkOutDate} · {c.numGuests} hóspede{c.numGuests!==1?"s":""}{c.nights ? ` · ${c.nights} noite${c.nights!==1?"s":""}` : ""}
                            {c.property.parkingSpot && <span> · Vaga {c.property.parkingSpot}</span>}
                          </div>
                        </div>

                        {/* Expand arrow */}
                        <span style={{ fontSize:12, color:"#525252", transform: expanded ? "rotate(180deg)" : "", transition:"transform 0.2s" }}>▼</span>
                      </button>

                      {/* Expanded details */}
                      {expanded && (
                        <div style={{ borderTop:"1px solid #2A2A2A", padding:"16px 18px" }}>
                          {/* Property info */}
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                            <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#525252", textTransform:"uppercase", marginBottom:4 }}>Imóvel</div>
                              <div style={{ fontSize:13, color:"#A3A3A3" }}>{c.property.name}</div>
                            </div>
                            {c.carPlate && <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#525252", textTransform:"uppercase", marginBottom:4 }}>Veículo</div>
                              <div style={{ fontSize:13, color:"#A3A3A3" }}>{c.carModel && `${c.carModel} · `}{c.carPlate}</div>
                            </div>}
                            {c.guestPhone && <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#525252", textTransform:"uppercase", marginBottom:4 }}>Contato hóspede</div>
                              <div style={{ fontSize:13, color:"#A3A3A3" }}>{c.guestPhone}</div>
                            </div>}
                            {c.confirmationCode && <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#525252", textTransform:"uppercase", marginBottom:4 }}>Código</div>
                              <div style={{ fontSize:13, color:"#A3A3A3", fontFamily:"monospace" }}>{c.confirmationCode}</div>
                            </div>}
                          </div>

                          {/* Guests */}
                          {hasGuests ? (
                            <div>
                              <div style={{ fontSize:10, fontWeight:600, color:"#525252", textTransform:"uppercase", marginBottom:8 }}>Hóspedes ({c.guests.length})</div>
                              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                {c.guests.map(g => (
                                  <div key={g.id} style={{ background:"#111", border:"1px solid #2A2A2A", borderRadius:10, padding:"12px 14px" }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                      <div>
                                        <div style={{ fontSize:14, fontWeight:600, color:"#fff" }}>{g.fullName}</div>
                                        <div style={{ fontSize:12, color:"#525252", marginTop:4 }}>
                                          {g.birthDate && <span>Nasc: {g.birthDate}</span>}
                                          {g.cpf && <span> · CPF: {g.cpf}</span>}
                                          {g.rg && <span> · RG: {g.rg}</span>}
                                          {g.foreign && g.passport && <span> · Passaporte: {g.passport}</span>}
                                          {g.foreign && g.rne && <span> · RNE: {g.rne}</span>}
                                        </div>
                                      </div>
                                      {g.documentUrl && (
                                        <a href={g.documentUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ fontSize:11, fontWeight:600, padding:"4px 10px", background:"rgba(59,95,229,0.1)", color:B.primary, border:"1px solid rgba(59,95,229,0.2)", borderRadius:6, textDecoration:"none", flexShrink:0 }}>
                                          📄 Doc
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ background:"rgba(217,119,6,0.1)", border:"1px solid rgba(217,119,6,0.2)", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#D97706" }}>
                              ⏳ Aguardando hóspede preencher o formulário de check-in.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
