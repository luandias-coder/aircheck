"use client";
import { useState, useEffect } from "react";

const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC" };

// ─── i18n ───────────────────────────────────────────────────────
type Lang = "pt" | "en";

const T = {
  pt: {
    digitalCheckin: "Check-in digital",
    checkin: "Check-in", checkout: "Check-out", nights: "Noites",
    greeting: (name:string, multi:boolean) => `Olá, **${name}**! Preencha os dados ${multi?"de todos os hóspedes":"de identificação"} para agilizar o check-in.`,
    phone: "Seu telefone",
    phonePlaceholder: "41999990000",
    guestN: (i:number, total:number) => `Hóspede ${i}${total>1?` de ${total}`:""}`,
    foreign: "Estrangeiro", brazilian: "Brasileiro",
    fullName: "Nome completo", fullNamePh: "Como consta no documento",
    birthDate: "Data de nascimento", birthDatePh: "DD/MM/AAAA",
    cpf: "CPF", cpfPh: "000.000.000-00",
    passport: "Passaporte", passportPh: "Número do passaporte",
    rg: "RG", rgPh: "Número do RG",
    rne: "RNE", rneNote: "(se houver)", rnePh: "Número do RNE",
    vehicle: "Veículo", vehicleOpt: "(opcional)",
    plate: "Placa", platePh: "ABC-1D23",
    model: "Modelo / Cor", modelPh: "HB20 Prata",
    submit: "Enviar dados para check-in",
    submitting: "Enviando...",
    disclaimer: "Seus dados são utilizados exclusivamente para registro na portaria.",
    successTitle: "Tudo certo!",
    successMsg: (name:string) => `Seus dados foram enviados. A equipe do **${name}** está preparando tudo.`,
    checkinLabel: "Check-in",
    addressLabel: "Endereço",
    directions: "Como chegar",
    successFooter: "Precisa corrigir alguma informação? Entre em contato com o anfitrião para solicitar a reabertura do formulário.",
    notFound: "Reserva não encontrada",
    notFoundSub: "Este link pode estar expirado ou incorreto.",
    alreadyFilled: "Este formulário já foi preenchido.",
    alreadyFilledSub: "Entre em contato com o anfitrião para solicitar a reabertura do formulário.",
    loading: "Carregando...",
    required: "*",
  },
  en: {
    digitalCheckin: "Digital check-in",
    checkin: "Check-in", checkout: "Check-out", nights: "Nights",
    greeting: (name:string, multi:boolean) => `Hi, **${name}**! Please fill in ${multi?"all guests' details":"your details"} to speed up check-in.`,
    phone: "Your phone number",
    phonePlaceholder: "41999990000",
    guestN: (i:number, total:number) => `Guest ${i}${total>1?` of ${total}`:""}`,
    foreign: "Foreign", brazilian: "Brazilian",
    fullName: "Full name", fullNamePh: "As shown on your ID",
    birthDate: "Date of birth", birthDatePh: "DD/MM/YYYY",
    cpf: "CPF (Brazilian ID)", cpfPh: "000.000.000-00",
    passport: "Passport", passportPh: "Passport number",
    rg: "RG (Brazilian ID)", rgPh: "RG number",
    rne: "RNE", rneNote: "(if applicable)", rnePh: "RNE number",
    vehicle: "Vehicle", vehicleOpt: "(optional)",
    plate: "License plate", platePh: "ABC-1D23",
    model: "Model / Color", modelPh: "Civic Silver",
    submit: "Submit check-in data",
    submitting: "Submitting...",
    disclaimer: "Your data is used exclusively for building lobby registration.",
    successTitle: "All set!",
    successMsg: (name:string) => `Your data has been submitted. The **${name}** team is getting everything ready.`,
    checkinLabel: "Check-in",
    addressLabel: "Address",
    directions: "Get directions",
    successFooter: "Need to correct something? Contact your host to request the form to be reopened.",
    notFound: "Reservation not found",
    notFoundSub: "This link may be expired or incorrect.",
    alreadyFilled: "This form has already been submitted.",
    alreadyFilledSub: "Contact your host to request the form to be reopened.",
    loading: "Loading...",
    required: "*",
  },
};

// Parse **bold** markers in greeting text
function renderBold(text:string, color:string){
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p,i) => i%2===1 ? <strong key={i} style={{color}}>{p}</strong> : p);
}

// ─── END i18n ───────────────────────────────────────────────────

function maskCPF(v:string){return v.replace(/\D/g,"").slice(0,11).replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")}
function maskDate(v:string){return v.replace(/\D/g,"").slice(0,8).replace(/(\d{2})(\d)/,"$1/$2").replace(/(\d{2})(\d)/,"$1/$2")}
function maskPhone(v:string){return v.replace(/\D/g,"").slice(0,13)}

interface GuestForm { fullName:string; birthDate:string; cpf:string; rg:string; foreign:boolean; passport:string; rne:string }
const emptyGuest=():GuestForm=>({fullName:"",birthDate:"",cpf:"",rg:"",foreign:false,passport:"",rne:""});

interface ResData { propertyName:string; propertyPhotoUrl:string|null; guestName:string; guestPhone:string|null; guestPhotoUrl:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; status:string; carPlate:string|null; carModel:string|null; condominiumName:string|null; condominiumAddress:string|null; guests:Array<{fullName:string;birthDate:string;cpf:string|null;rg:string|null;foreign:boolean;passport:string|null;rne:string|null;hasDocument:boolean}> }

// 16px font prevents iOS auto-zoom on input focus
const iStyle:React.CSSProperties = {width:"100%",fontFamily:"Outfit,sans-serif",fontSize:16,color:"#1A1A1A",padding:"12px 14px",border:"1px solid #E5E5E5",borderRadius:10,background:"#fff",boxSizing:"border-box",WebkitAppearance:"none" as any};
const lblStyle:React.CSSProperties = {fontSize:11,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5};

// ─── LANGUAGE TOGGLE ────────────────────────────────────────────
function LangToggle({lang,setLang}:{lang:Lang;setLang:(l:Lang)=>void}){
  return(
    <button
      onClick={()=>setLang(lang==="pt"?"en":"pt")}
      aria-label={lang==="pt"?"Switch to English":"Mudar para Português"}
      style={{
        display:"flex",alignItems:"center",gap:6,
        padding:"5px 10px",borderRadius:8,
        background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",
        cursor:"pointer",fontFamily:"Outfit",fontSize:12,fontWeight:600,
        color:"rgba(255,255,255,0.8)",transition:"all 0.2s",
      }}
    >
      <span style={{fontSize:16}}>{lang==="pt"?"🇬🇧":"🇧🇷"}</span>
      {lang==="pt"?"EN":"PT"}
    </button>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function CheckInPage({params}:{params:{token:string}}){
  const[data,setData]=useState<ResData|null>(null);
  const[error,setError]=useState("");
  const[loading,setLoading]=useState(true);
  const[guests,setGuests]=useState<GuestForm[]>([]);
  const[carPlate,setCarPlate]=useState("");
  const[carModel,setCarModel]=useState("");
  const[showCar,setShowCar]=useState(false);
  const[guestPhone,setGuestPhone]=useState("");
  const[phoneCountry,setPhoneCountry]=useState("+55");
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  const[lang,setLang]=useState<Lang>("pt");

  const t = T[lang];

  useEffect(()=>{
    fetch(`/api/checkin/${params.token}`).then(async res=>{
      if(!res.ok)throw new Error("not_found");
      const d=await res.json();
      setData(d);
      if(d.status==="pending_form"){
        const prefilled=d.guests.map((g:any):GuestForm=>({
          fullName:g.fullName||"",birthDate:g.birthDate||"",cpf:g.cpf||"",rg:g.rg||"",
          foreign:g.foreign||false,passport:g.passport||"",rne:g.rne||""
        }));
        const extra=Math.max(0,d.numGuests-prefilled.length);
        setGuests([...prefilled,...Array.from({length:extra},emptyGuest)]);
        if(d.carPlate)setCarPlate(d.carPlate);
        if(d.carModel)setCarModel(d.carModel);
        if(d.carPlate||d.carModel)setShowCar(true);
        if(d.guestPhone){
          const raw=d.guestPhone.replace(/\D/g,"");
          if(raw.startsWith("55")&&raw.length>2){setGuestPhone(raw.slice(2))}
          else{setGuestPhone(raw)}
        }
      }else{setSubmitted(true)}
    }).catch(()=>setError("not_found")).finally(()=>setLoading(false));
  },[params.token]);

  const updateGuest=(i:number,field:keyof GuestForm,val:any)=>{setGuests(p=>{const n=[...p];n[i]={...n[i],[field]:val};return n})};

  const canSubmit=!!guestPhone&&guests.length>0&&guests.every((g)=>{
    const hasName=!!g.fullName&&!!g.birthDate;
    const hasIdDoc=g.foreign?!!g.passport:!!g.cpf;
    return hasName&&hasIdDoc;
  });

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!canSubmit)return;
    setSubmitting(true);
    try{
      const fd=new FormData();
      fd.append("guests",JSON.stringify(guests.map((g)=>({fullName:g.fullName,birthDate:g.birthDate,cpf:g.cpf,rg:g.rg,foreign:g.foreign,passport:g.passport,rne:g.rne}))));
      if(carPlate)fd.append("carPlate",carPlate);
      if(carModel)fd.append("carModel",carModel);
      const fullPhone=`${phoneCountry}${guestPhone}`;
      fd.append("guestPhone",fullPhone);
      const res=await fetch(`/api/checkin/${params.token}`,{method:"POST",body:fd});
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||`Erro ${res.status}`)}
      setSubmitted(true);
    }catch(e:any){alert(e?.message||"Erro ao enviar. Tente novamente.")}finally{setSubmitting(false)}
  };

  // ─── LOADING ──────────────────────────────────────────────────
  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF9"}}><div style={{fontFamily:"Outfit",fontSize:14,color:"#A3A3A3"}}>{t.loading}</div></div>;

  // ─── ERROR ────────────────────────────────────────────────────
  if(error)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#FAFAF9"}}><div style={{textAlign:"center",maxWidth:360}}>
    <div style={{fontSize:40,marginBottom:8,opacity:0.3}}>🔍</div>
    <h2 style={{fontFamily:"Outfit",fontSize:18,fontWeight:600,color:"#1A1A1A",marginBottom:8}}>{t.notFound}</h2>
    <p style={{fontFamily:"Outfit",fontSize:13,color:"#A3A3A3"}}>{t.notFoundSub}</p>
    {/* Lang toggle even on error */}
    <div style={{marginTop:20,display:"flex",justifyContent:"center"}}>
      <button onClick={()=>setLang(lang==="pt"?"en":"pt")} style={{fontFamily:"Outfit",fontSize:13,fontWeight:600,color:B.primary,background:B.light,border:`1px solid ${B.muted}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:16}}>{lang==="pt"?"🇬🇧":"🇧🇷"}</span>{lang==="pt"?"English":"Português"}
      </button>
    </div>
  </div></div>;

  // ─── SUCCESS ──────────────────────────────────────────────────
  if(submitted)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)"}}>
    <div style={{textAlign:"center",maxWidth:380}}>
      <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",margin:"0 auto 20px",boxShadow:`0 8px 32px ${B.primary}40`}}>✓</div>
      <h2 style={{fontFamily:"Outfit",fontSize:22,fontWeight:800,color:"#1A1A1A",marginBottom:8}}>{t.successTitle}</h2>
      <p style={{fontFamily:"Outfit",fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>{renderBold(t.successMsg(data?.propertyName||""),"#1A1A1A")}</p>
      <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E5E5E5",marginBottom:16}}>
        <div style={{fontFamily:"Outfit",fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.checkinLabel}</div>
        <div style={{fontFamily:"Outfit",fontSize:16,fontWeight:600,color:"#1A1A1A",marginTop:4}}>{data?.checkInDate} {lang==="pt"?"a partir das":"from"} {data?.checkInTime}</div>
      </div>
      {data?.condominiumAddress&&<div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E5E5E5",marginBottom:16}}>
        <div style={{fontFamily:"Outfit",fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.addressLabel}</div>
        <div style={{fontFamily:"Outfit",fontSize:14,fontWeight:500,color:"#1A1A1A",marginTop:4}}>{data.condominiumAddress}</div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.condominiumAddress)}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",fontFamily:"Outfit",fontSize:13,fontWeight:600,marginTop:8,padding:"8px 16px",background:"#3B5FE5",color:"#fff",borderRadius:8,textDecoration:"none"}}>📍 {t.directions}</a>
      </div>}
      <p style={{fontFamily:"Outfit",fontSize:12,color:"#A3A3A3",lineHeight:1.5}}>{t.successFooter}</p>
    </div>
  </div>;

  // ─── FORM ─────────────────────────────────────────────────────
  return<div style={{minHeight:"100vh",background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)",fontFamily:"Outfit,sans-serif",overflowX:"hidden",width:"100%"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1A1A1A,#2D2D2D)",padding:"36px 20px 28px",color:"#fff"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        {/* Top row: logo + lang toggle */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fhg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fhg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
            <span style={{fontSize:11,fontWeight:600,color:B.muted,textTransform:"uppercase",letterSpacing:"0.14em"}}>{t.digitalCheckin}</span>
          </div>
          <LangToggle lang={lang} setLang={setLang}/>
        </div>

        {/* Property name + photo placeholder */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {/* Property photo — placeholder for Fase 15 */}
          {data?.propertyPhotoUrl ? (
            <img src={data.propertyPhotoUrl} alt="" style={{width:56,height:56,borderRadius:12,objectFit:"cover",border:"2px solid rgba(255,255,255,0.15)",flexShrink:0}}/>
          ) : (
            <div style={{width:56,height:56,borderRadius:12,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,opacity:0.5}}>🏠</div>
          )}
          <div style={{minWidth:0}}>
            <h1 style={{fontFamily:"Outfit",fontSize:20,fontWeight:800,lineHeight:1.2,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{data?.propertyName}</h1>
            {data?.condominiumAddress&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,flexWrap:"wrap"}}><span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>📍 {data.condominiumAddress}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.condominiumAddress)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#B4C6FC",textDecoration:"none",fontWeight:600}}>{t.directions} →</a></div>}
          </div>
        </div>

        {/* Date stats */}
        <div style={{display:"flex",gap:1,marginTop:20,borderRadius:10,overflow:"hidden"}}>
          {[{l:t.checkin,v:data?.checkInDate||""},{l:t.checkout,v:data?.checkOutDate||""},{l:t.nights,v:data?.nights?`${data.nights}`:"-"}].map((x,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"10px 6px",background:"rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.4)",marginBottom:3}}>{x.l}</div>
            <div style={{fontSize:14,fontWeight:600}}>{x.v}</div>
          </div>)}
        </div>
      </div>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} style={{maxWidth:440,margin:"0 auto",padding:"24px 16px 120px"}}>
      {/* Greeting + guest photo */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        {data?.guestPhotoUrl && (
          <img src={data.guestPhotoUrl} alt="" style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:"2px solid #E5E5E5",flexShrink:0}}/>
        )}
        <p style={{fontSize:14,color:"#737373",lineHeight:1.6,margin:0}}>
          {renderBold(t.greeting(data?.guestName||"", (data?.numGuests||1)>1),"#1A1A1A")}
        </p>
      </div>

      {/* Phone */}
      <div style={{marginBottom:16}}>
        <label style={lblStyle}>{t.phone} <span style={{color:"#DC2626"}}>{t.required}</span></label>
        <div style={{display:"flex",gap:8}}>
          <select value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)} style={{fontFamily:"Outfit",fontSize:16,padding:"12px 6px",border:"1px solid #E5E5E5",borderRadius:10,background:"#fff",minWidth:80,color:"#1A1A1A"}}>
            <option value="+55">🇧🇷 +55</option><option value="+1">🇺🇸 +1</option><option value="+54">🇦🇷 +54</option><option value="+595">🇵🇾 +595</option><option value="+598">🇺🇾 +598</option><option value="+56">🇨🇱 +56</option><option value="+57">🇨🇴 +57</option><option value="+351">🇵🇹 +351</option><option value="+34">🇪🇸 +34</option><option value="+33">🇫🇷 +33</option><option value="+49">🇩🇪 +49</option><option value="+44">🇬🇧 +44</option><option value="+39">🇮🇹 +39</option>
          </select>
          <input value={guestPhone} onChange={e=>setGuestPhone(maskPhone(e.target.value))} placeholder={t.phonePlaceholder} inputMode="tel" enterKeyHint="next" required style={{...iStyle,flex:1}}/>
        </div>
      </div>

      {/* Guest cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {guests.map((g,i)=><GuestCard key={i} index={i} guest={g} total={guests.length} onChange={updateGuest} t={t}/>)}
      </div>

      {/* Vehicle */}
      <div style={{marginTop:12,background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,overflow:"hidden"}}>
        <button type="button" onClick={()=>setShowCar(!showCar)} style={{width:"100%",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
          <span style={{fontSize:14,fontWeight:500,color:"#1A1A1A"}}>🚗 {t.vehicle} <span style={{fontSize:12,fontWeight:400,color:"#A3A3A3"}}>{t.vehicleOpt}</span></span>
          <span style={{fontSize:12,color:"#A3A3A3",transform:showCar?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
        </button>
        {showCar&&<div style={{padding:"0 18px 18px",display:"flex",flexDirection:"column",gap:10}}>
          <div><label style={lblStyle}>{t.plate}</label><input value={carPlate} onChange={e=>setCarPlate(e.target.value.toUpperCase())} placeholder={t.platePh} enterKeyHint="next" style={{...iStyle,textTransform:"uppercase"}}/></div>
          <div><label style={lblStyle}>{t.model}</label><input value={carModel} onChange={e=>setCarModel(e.target.value)} placeholder={t.modelPh} enterKeyHint="done" style={iStyle}/></div>
        </div>}
      </div>

      {/* Submit */}
      <button type="submit" disabled={!canSubmit||submitting} style={{
        width:"100%",marginTop:20,padding:18,fontFamily:"Outfit",fontSize:16,fontWeight:600,
        background:canSubmit?"linear-gradient(135deg,#1A1A1A,#333)":"#D4D4D4",
        color:canSubmit?"#fff":"#A3A3A3",border:"none",borderRadius:14,cursor:canSubmit?"pointer":"not-allowed",
        boxShadow:canSubmit?"0 4px 20px rgba(0,0,0,0.15)":"none",
      }}>
        {submitting?t.submitting:t.submit}
      </button>
      <p style={{textAlign:"center",fontSize:11,color:"#A3A3A3",marginTop:14,lineHeight:1.5}}>{t.disclaimer}</p>
    </form>
  </div>
}

// ─── GUEST CARD ─────────────────────────────────────────────────
function GuestCard({index:i,guest:g,total,onChange,t}:{index:number;guest:GuestForm;total:number;onChange:(i:number,f:keyof GuestForm,v:any)=>void;t:typeof T["pt"]}){
  return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 16px"}}>
    <div style={{marginBottom:14}}>
      <span style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>{t.guestN(i+1, total)}</span>
    </div>

    {/* Foreign toggle */}
    <div onClick={()=>onChange(i,"foreign",!g.foreign)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:g.foreign?B.light:"#FAFAF9",border:`1px solid ${g.foreign?B.muted:"#E5E5E5"}`,borderRadius:10,padding:"12px 14px",marginBottom:14,cursor:"pointer",transition:"all 0.2s",WebkitTapHighlightColor:"transparent"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{g.foreign?"🌍":"🇧🇷"}</span>
        <span style={{fontSize:14,fontWeight:500,color:g.foreign?B.primary:"#1A1A1A"}}>{g.foreign?t.foreign:t.brazilian}</span>
      </div>
      <div style={{width:40,height:22,borderRadius:11,padding:2,background:g.foreign?B.primary:"#D4D4D4",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:g.foreign?"flex-end":"flex-start"}}>
        <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </div>
    </div>

    {/* Name */}
    <div style={{marginBottom:12}}>
      <label style={lblStyle}>{t.fullName} <span style={{color:B.primary}}>{t.required}</span></label>
      <input value={g.fullName} onChange={e=>onChange(i,"fullName",e.target.value)} placeholder={t.fullNamePh} autoComplete="name" enterKeyHint="next" style={iStyle}/>
    </div>

    {/* Birth date */}
    <div style={{marginBottom:12}}>
      <label style={lblStyle}>{t.birthDate} <span style={{color:B.primary}}>{t.required}</span></label>
      <input value={g.birthDate} onChange={e=>onChange(i,"birthDate",maskDate(e.target.value))} placeholder={t.birthDatePh} inputMode="numeric" enterKeyHint="next" style={iStyle}/>
    </div>

    {/* CPF or Passport */}
    <div style={{marginBottom:12}}>
      {g.foreign?<>
        <label style={lblStyle}>{t.passport} <span style={{color:B.primary}}>{t.required}</span></label>
        <input value={g.passport} onChange={e=>onChange(i,"passport",e.target.value)} placeholder={t.passportPh} enterKeyHint="next" style={iStyle}/>
      </>:<>
        <label style={lblStyle}>{t.cpf} <span style={{color:B.primary}}>{t.required}</span></label>
        <input value={g.cpf} onChange={e=>onChange(i,"cpf",maskCPF(e.target.value))} placeholder={t.cpfPh} inputMode="numeric" enterKeyHint="next" style={iStyle}/>
      </>}
    </div>

    {/* RG or RNE */}
    <div>
      {g.foreign?<>
        <label style={lblStyle}>{t.rne} <span style={{fontWeight:400,color:"#A3A3A3"}}>{t.rneNote}</span></label>
        <input value={g.rne} onChange={e=>onChange(i,"rne",e.target.value)} placeholder={t.rnePh} enterKeyHint="next" style={iStyle}/>
      </>:<>
        <label style={lblStyle}>{t.rg}</label>
        <input value={g.rg} onChange={e=>onChange(i,"rg",e.target.value)} placeholder={t.rgPh} enterKeyHint="next" style={iStyle}/>
      </>}
    </div>
  </div>
}
