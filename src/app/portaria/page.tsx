"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const B = { primary:"#3B5FE5", g1:"#3B5FE5", g2:"#5E4FE5", accent:"#059669", dark:"#0F0F0F" };

interface Guest { id:string; fullName:string; birthDate:string; cpf:string|null; rg:string|null; foreign:boolean; passport:string|null; rne:string|null; documentUrl:string|null }
interface CheckIn { id:string; guestName:string; guestPhone:string|null; guestPhotoUrl:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; status:string; confirmationCode:string|null; carPlate:string|null; carModel:string|null; property:{ id:string; name:string; unitNumber:string|null; parkingSpot:string|null }; guests:Guest[] }
interface PropertyInfo { id:string; name:string; unitNumber:string|null; parkingSpot:string|null }
interface Stats { today:number; upcoming:number; pending:number; totalProperties:number }
interface CondoUser { id:string; name:string; email:string; role:string }
interface Condo { id:string; name:string; code:string; address:string|null }
interface CondoSettings { id:string; name:string; address:string|null; code:string; contactName:string|null; contactEmail:string|null; contactPhone:string|null; plan:string; active:boolean; users:Array<{id:string;name:string;email:string;role:string;active:boolean}>; totalProperties:number }

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
  const [properties, setProperties] = useState<PropertyInfo[]>([]);
  const [stats, setStats] = useState<Stats>({ today:0, upcoming:0, pending:0, totalProperties:0 });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today"|"week"|"all">("week");
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [tab, setTab] = useState<"checkins"|"settings">("checkins");

  // Filters
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
        setProperties(data.properties || []);
        setStats(data.stats);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [router, range]);

  useEffect(() => { fetchData() }, [fetchData]);

  const logout = async () => { await fetch("/api/portaria/auth/logout", { method: "POST" }); router.push("/portaria/login") };

  // Apply filters
  const filtered = checkins.filter(c => {
    if (filterUnit !== "all" && c.property.unitNumber !== filterUnit) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  // Group check-ins by date
  const grouped: Record<string, CheckIn[]> = {};
  filtered.forEach(c => {
    const label = dayLabel(c.checkInDate);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c);
  });

  // Unique units for filter
  const units = Array.from(new Set(properties.map(p => p.unitNumber).filter(Boolean))) as string[];

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
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#phg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="phg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor="#3B5FE5"/><stop offset="1" stopColor="#5E4FE5"/></linearGradient></defs></svg>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{condo?.name}</div>
              <div style={{ fontSize:11, color:"#525252" }}>Painel da Portaria · {condo?.code}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:12, color:"#525252", textAlign:"right" }}>
              <div style={{ color:"#A3A3A3" }}>{user?.name}</div>
              <div>{user?.role === "admin" ? "Administrador" : "Porteiro"}</div>
            </div>
            <button onClick={logout} style={{ fontFamily:"Outfit", fontSize:11, fontWeight:500, padding:"6px 12px", background:"none", color:"#525252", border:"1px solid #333", borderRadius:8, cursor:"pointer" }}>Sair</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:"20px 20px 40px" }}>

        {/* Tabs: Check-ins / Configurações */}
        <div style={{ display:"flex", gap:0, borderBottom:"1px solid #2A2A2A", marginBottom:20 }}>
          {([["checkins","📋 Check-ins"],["settings","⚙️ Configurações"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              fontFamily:"Outfit", fontSize:13, fontWeight:tab===id?600:400, padding:"10px 20px",
              background:"none", border:"none", borderBottom:`2px solid ${tab===id?B.primary:"transparent"}`,
              color:tab===id?B.primary:"#525252", cursor:"pointer", marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>

        {tab === "checkins" && <>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10, marginBottom:20 }}>
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

          {/* Range filter */}
          <div style={{ display:"flex", gap:4, marginBottom:12 }}>
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

          {/* Unit + Status filters */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {/* Unit filter */}
            <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} style={{
              fontFamily:"Outfit", fontSize:12, padding:"6px 12px", background:"#1A1A1A", color:"#A3A3A3",
              border:"1px solid #333", borderRadius:8, cursor:"pointer",
            }}>
              <option value="all">Todas unidades</option>
              {units.sort().map(u => <option key={u} value={u}>Unid. {u}</option>)}
            </select>

            {/* Status filter */}
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
              fontFamily:"Outfit", fontSize:12, padding:"6px 12px", background:"#1A1A1A", color:"#A3A3A3",
              border:"1px solid #333", borderRadius:8, cursor:"pointer",
            }}>
              <option value="all">Todos status</option>
              <option value="pending_form">⏳ Aguardando dados</option>
              <option value="form_filled">✅ Dados recebidos</option>
              <option value="sent_to_doorman">📨 Confirmado</option>
            </select>

            {(filterUnit !== "all" || filterStatus !== "all") && (
              <button onClick={() => { setFilterUnit("all"); setFilterStatus("all") }} style={{
                fontFamily:"Outfit", fontSize:11, padding:"6px 12px", background:"none",
                color:"#DC2626", border:"1px solid #333", borderRadius:8, cursor:"pointer",
              }}>✕ Limpar filtros</button>
            )}
          </div>

          {/* Check-ins */}
          {filtered.length === 0 ? (
            <div style={{ background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:16, padding:"48px 24px", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8, opacity:0.2 }}>📋</div>
              <div style={{ fontSize:16, fontWeight:600, color:"#A3A3A3", marginBottom:4 }}>
                {filterUnit !== "all" || filterStatus !== "all" ? "Nenhum check-in com esses filtros" : `Nenhum check-in ${range==="today"?"para hoje":"no período"}`}
              </div>
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
                          {/* Guest photo or unit badge */}
                          {c.guestPhotoUrl ? (
                            <img src={c.guestPhotoUrl} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:"cover", flexShrink:0, border:"2px solid #2A2A2A" }} />
                          ) : (
                            <div style={{ width:48, height:48, borderRadius:12, background:"#111", border:"1px solid #2A2A2A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, flexDirection:"column" }}>
                              <div style={{ fontSize:8, fontWeight:600, color:"#525252", textTransform:"uppercase" }}>Unid.</div>
                              <div style={{ fontSize:16, fontWeight:800, color:"#fff", lineHeight:1 }}>{c.property.unitNumber || "?"}</div>
                            </div>
                          )}

                          {/* Info */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ fontSize:15, fontWeight:600, color:"#fff" }}>{c.guestName}</span>
                              <span style={{ fontSize:11, fontWeight:600, color:st.c, background:st.bg, padding:"2px 8px", borderRadius:10 }}>{st.icon} {st.l}</span>
                            </div>
                            <div style={{ fontSize:12, color:"#525252", marginTop:4 }}>
                              Unid. {c.property.unitNumber || "?"} · {c.checkInTime} → {c.checkOutDate} · {c.numGuests} hóspede{c.numGuests!==1?"s":""}{c.nights ? ` · ${c.nights} noite${c.nights!==1?"s":""}` : ""}
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
        </>}

        {tab === "settings" && <SettingsTab user={user} condominiumId={condo?.id || ""} />}
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ───────────────────────────────────────────────
function SettingsTab({ user, condominiumId }: { user: CondoUser | null; condominiumId: string }) {
  const [settings, setSettings] = useState<CondoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const canEdit = user?.role === "admin";

  // Google Maps Autocomplete
  useEffect(() => {
    if (!editing || !addressRef.current) return;
    const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!MAPS_KEY) return;
    const initAutocomplete = () => {
      if (!addressRef.current || autocompleteRef.current) return;
      const ac = new (window as any).google.maps.places.Autocomplete(addressRef.current, {
        types: ["address"], componentRestrictions: { country: "br" },
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place?.formatted_address) setAddress(place.formatted_address);
      });
      autocompleteRef.current = ac;
    };
    if ((window as any).google?.maps?.places) { initAutocomplete(); return; }
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=pt-BR`;
      s.async = true;
      s.onload = initAutocomplete;
      document.head.appendChild(s);
    }
    return () => { autocompleteRef.current = null; };
  }, [editing]);

  // Team management
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("porteiro");
  const [addingUser, setAddingUser] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  const addUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) return;
    setAddingUser(true); setTeamMsg(null);
    try {
      const res = await fetch("/api/portaria/settings/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName.trim(), email: newUserEmail.trim(), password: newUserPassword, role: newUserRole }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro"); }
      const created = await res.json();
      setSettings(s => s ? { ...s, users: [...s.users, created] } : s);
      setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("porteiro"); setShowAddUser(false);
      setTeamMsg({ t: "ok", m: `${created.name} adicionado com sucesso!` });
    } catch (e: any) { setTeamMsg({ t: "err", m: e.message }); }
    finally { setAddingUser(false); }
  };

  const toggleUserActive = async (userId: string, currentlyActive: boolean) => {
    const action = currentlyActive ? "deactivate" : "reactivate";
    const label = currentlyActive ? "desativar" : "reativar";
    if (!confirm(`Tem certeza que deseja ${label} este usuário?`)) return;
    try {
      const res = await fetch("/api/portaria/settings/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Erro"); return; }
      const updated = await res.json();
      setSettings(s => s ? { ...s, users: s.users.map(u => u.id === userId ? updated : u) } : s);
    } catch { alert("Erro de conexão"); }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/portaria/settings/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "change_role", role: newRole }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Erro"); return; }
      const updated = await res.json();
      setSettings(s => s ? { ...s, users: s.users.map(u => u.id === userId ? updated : u) } : s);
    } catch { alert("Erro de conexão"); }
  };

  useEffect(() => {
    fetch("/api/portaria/settings").then(async r => {
      if (r.ok) {
        const data = await r.json();
        setSettings(data);
        setName(data.name || "");
        setAddress(data.address || "");
        setContactName(data.contactName || "");
        setContactEmail(data.contactEmail || "");
        setContactPhone(data.contactPhone || "");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!name.trim()) { setMsg({ t: "err", m: "Nome é obrigatório" }); return; }
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/portaria/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim(), contactName: contactName.trim(), contactEmail: contactEmail.trim(), contactPhone: contactPhone.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erro"); }
      const updated = await res.json();
      setSettings(s => s ? { ...s, ...updated } : s);
      setMsg({ t: "ok", m: "Configurações salvas!" });
      setEditing(false);
    } catch (e: any) { setMsg({ t: "err", m: e.message || "Erro ao salvar" }); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#525252" }}>Carregando...</div>;
  if (!settings) return <div style={{ textAlign: "center", padding: 40, color: "#DC2626" }}>Erro ao carregar configurações.</div>;

  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 };
  const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "Outfit", fontSize: 14, color: "#fff", padding: "10px 14px", border: "1px solid #333", borderRadius: 8, background: "#111", boxSizing: "border-box" };
  const readStyle: React.CSSProperties = { fontSize: 14, color: "#E5E5E5", padding: "10px 0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Condominium info */}
      <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dados do condomínio</div>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} style={{ fontFamily: "Outfit", fontSize: 12, fontWeight: 500, padding: "6px 14px", background: "none", color: B.primary, border: `1px solid ${B.primary}40`, borderRadius: 8, cursor: "pointer" }}>Editar</button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={labelStyle}>Nome do condomínio</div>
              <div style={readStyle}>{settings.name}</div>
            </div>
            <div>
              <div style={labelStyle}>Código de vinculação</div>
              <div style={{ ...readStyle, fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: B.primary, letterSpacing: "0.15em" }}>{settings.code}</div>
              <div style={{ fontSize: 11, color: "#525252", marginTop: 2 }}>Hosts usam este código para vincular imóveis ao condomínio</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={labelStyle}>Endereço</div>
                <div style={readStyle}>
                  {settings.address ? (<><span>{settings.address}</span> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: B.primary, marginLeft: 8, textDecoration: "none" }}>📍 Ver no mapa</a></>) : <span style={{ color: "#525252" }}>Não informado</span>}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Contato principal</div>
                <div style={readStyle}>{settings.contactName || <span style={{ color: "#525252" }}>Não informado</span>}</div>
              </div>
              <div>
                <div style={labelStyle}>Email</div>
                <div style={readStyle}>{settings.contactEmail || <span style={{ color: "#525252" }}>Não informado</span>}</div>
              </div>
              <div>
                <div style={labelStyle}>WhatsApp / Telefone</div>
                <div style={readStyle}>{settings.contactPhone || <span style={{ color: "#525252" }}>Não informado</span>}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome do condomínio *</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Endereço</label>
              <input ref={addressRef} value={address} onChange={e => setAddress(e.target.value)} placeholder="Comece a digitar o endereço..." style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Contato principal</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nome do síndico ou responsável" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp / Telefone</label>
                <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="(41) 99999-0000" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email para comunicação</label>
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contato@condominio.com" type="email" style={inputStyle} />
            </div>
            {msg && <div style={{ background: msg.t === "ok" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", border: `1px solid ${msg.t === "ok" ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: msg.t === "ok" ? "#059669" : "#DC2626" }}>{msg.m}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save} disabled={saving} style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 600, padding: "10px 20px", background: B.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>{saving ? "Salvando..." : "Salvar"}</button>
              <button onClick={() => { setEditing(false); setMsg(null); setName(settings.name || ""); setAddress(settings.address || ""); setContactName(settings.contactName || ""); setContactEmail(settings.contactEmail || ""); setContactPhone(settings.contactPhone || ""); }} style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 500, padding: "10px 20px", background: "none", color: "#525252", border: "1px solid #333", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Team */}
      <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: B.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Equipe da portaria</div>
          {canEdit && !showAddUser && (
            <button onClick={() => { setShowAddUser(true); setTeamMsg(null); }} style={{ fontFamily: "Outfit", fontSize: 12, fontWeight: 600, padding: "6px 14px", background: B.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>+ Adicionar</button>
          )}
        </div>

        {teamMsg && <div style={{ background: teamMsg.t === "ok" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.1)", border: `1px solid ${teamMsg.t === "ok" ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)"}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: teamMsg.t === "ok" ? "#059669" : "#DC2626", marginBottom: 10 }}>{teamMsg.m}</div>}

        {/* Add user form */}
        {showAddUser && (
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: B.primary, textTransform: "uppercase", marginBottom: 10 }}>Novo membro</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Nome *</label>
                  <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Nome completo" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email *</label>
                  <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="email@exemplo.com" type="email" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Senha inicial *</label>
                  <input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mín. 6 caracteres" type="text" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Função</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="porteiro">Porteiro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={addUser} disabled={addingUser || !newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 6} style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: 600, padding: "8px 18px", background: B.primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: addingUser || !newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 6 ? 0.5 : 1 }}>{addingUser ? "Adicionando..." : "Adicionar"}</button>
                <button onClick={() => { setShowAddUser(false); setNewUserName(""); setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("porteiro"); setTeamMsg(null); }} style={{ fontFamily: "Outfit", fontSize: 13, padding: "8px 18px", background: "none", color: "#525252", border: "1px solid #333", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Users list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {settings.users.map(u => (
            <div key={u.id} style={{ background: u.active ? "#111" : "#0A0A0A", border: `1px solid ${u.active ? "#2A2A2A" : "#1A1A1A"}`, borderRadius: 10, padding: "10px 14px", opacity: u.active ? 1 : 0.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: u.active ? "#fff" : "#525252" }}>{u.name} {!u.active && <span style={{ fontSize: 11, color: "#DC2626" }}>(Inativo)</span>}</div>
                  <div style={{ fontSize: 12, color: "#525252", marginTop: 2 }}>{u.email}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {canEdit ? (
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ fontFamily: "Outfit", fontSize: 11, padding: "4px 8px", background: "#1A1A1A", color: u.role === "admin" ? B.primary : "#A3A3A3", border: "1px solid #333", borderRadius: 6, cursor: "pointer" }}>
                      <option value="porteiro">Porteiro</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 600, color: u.role === "admin" ? B.primary : "#A3A3A3", background: u.role === "admin" ? "rgba(59,95,229,0.1)" : "rgba(163,163,163,0.1)", padding: "2px 8px", borderRadius: 8 }}>
                      {u.role === "admin" ? "Admin" : "Porteiro"}
                    </span>
                  )}
                  {canEdit && (
                    <button onClick={() => toggleUserActive(u.id, u.active)} style={{ fontFamily: "Outfit", fontSize: 11, fontWeight: 500, padding: "4px 10px", background: "none", color: u.active ? "#DC2626" : "#059669", border: `1px solid ${u.active ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)"}`, borderRadius: 6, cursor: "pointer" }}>
                      {u.active ? "Desativar" : "Reativar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#525252", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Informações</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Plano</div>
            <div style={{ fontSize: 14, color: "#E5E5E5" }}>{settings.plan === "pilot" ? "Piloto (gratuito)" : settings.plan}</div>
          </div>
          <div>
            <div style={labelStyle}>Imóveis conectados</div>
            <div style={{ fontSize: 14, color: "#E5E5E5" }}>{settings.totalProperties}</div>
          </div>
          <div>
            <div style={labelStyle}>Status</div>
            <div style={{ fontSize: 14, color: settings.active ? "#059669" : "#DC2626" }}>{settings.active ? "✅ Ativo" : "❌ Inativo"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
