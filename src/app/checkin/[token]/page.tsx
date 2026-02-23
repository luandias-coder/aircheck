"use client";
import { useState, useEffect, useRef } from "react";

const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC" };

function maskCPF(v:string){return v.replace(/\D/g,"").slice(0,11).replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")}
function maskDate(v:string){return v.replace(/\D/g,"").slice(0,8).replace(/(\d{2})(\d)/,"$1/$2").replace(/(\d{2})(\d)/,"$1/$2")}
function maskPhone(v:string){return v.replace(/\D/g,"").slice(0,13)}

interface GuestForm { fullName:string; birthDate:string; cpf:string; rg:string; foreign:boolean; passport:string; rne:string; file:File|null; preview:string|null }
const emptyGuest=():GuestForm=>({fullName:"",birthDate:"",cpf:"",rg:"",foreign:false,passport:"",rne:"",file:null,preview:null});

interface ResData { propertyName:string; guestName:string; guestPhone:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; status:string; carPlate:string|null; carModel:string|null; guests:Array<{fullName:string;birthDate:string;cpf:string|null;rg:string|null;foreign:boolean;passport:string|null;rne:string|null;hasDocument:boolean}> }

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
  const[isEdit,setIsEdit]=useState(false);

  useEffect(()=>{
    fetch(`/api/checkin/${params.token}`).then(async res=>{
      if(!res.ok)throw new Error("not_found");
      const d=await res.json();
      setData(d);
      if(d.status==="pending_form"){
        setGuests(Array.from({length:d.numGuests},emptyGuest));
      }else if(d.status==="form_filled"){
        setGuests(d.guests.map((g:any)=>({fullName:g.fullName,birthDate:g.birthDate,cpf:g.cpf||"",rg:g.rg||"",foreign:g.foreign,passport:g.passport||"",rne:g.rne||"",file:null,preview:null})));
        setCarPlate(d.carPlate||"");
        setCarModel(d.carModel||"");
        if(d.guestPhone){const ph=d.guestPhone;if(ph.startsWith("+")){setPhoneCountry(ph.slice(0,3));setGuestPhone(ph.slice(3))}else setGuestPhone(ph)}
        setSubmitted(true);
      }else{setSubmitted(true)}
    }).catch(()=>setError("not_found")).finally(()=>setLoading(false));
  },[params.token]);

  const updateGuest=(i:number,field:keyof GuestForm,val:any)=>{setGuests(p=>{const n=[...p];n[i]={...n[i],[field]:val};return n})};
  const handleFile=(i:number,file:File)=>{updateGuest(i,"file",file);const r=new FileReader();r.onload=e=>updateGuest(i,"preview",e.target?.result as string);r.readAsDataURL(file)};
  const addGuest=()=>setGuests([...guests,emptyGuest()]);
  const removeGuest=(i:number)=>setGuests(guests.filter((_,idx)=>idx!==i));

  const canSubmit=guests.length>0&&guests.every(g=>g.fullName&&g.birthDate&&(g.file||isEdit))&&(guests.every(g=>!g.foreign||(g.passport||g.rne)));

  const handleSubmit=async()=>{
    if(!canSubmit)return;
    setSubmitting(true);
    const fd=new FormData();
    fd.append("guests",JSON.stringify(guests.map(g=>({fullName:g.fullName,birthDate:g.birthDate,cpf:g.cpf,rg:g.rg,foreign:g.foreign,passport:g.passport,rne:g.rne}))));
    if(carPlate)fd.append("carPlate",carPlate);
    if(carModel)fd.append("carModel",carModel);
    const fullPhone=guestPhone?`${phoneCountry}${guestPhone}`:"";
    if(fullPhone)fd.append("guestPhone",fullPhone);
    guests.forEach((g,i)=>{if(g.file)fd.append(`document_${i}`,g.file)});
    try{
      const res=await fetch(`/api/checkin/${params.token}`,{method:"POST",body:fd});
      if(!res.ok)throw new Error();
      setSubmitted(true);setIsEdit(false);
    }catch{alert("Erro ao enviar. Tente novamente.")}finally{setSubmitting(false)}
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF9"}}><div style={{fontFamily:"Outfit",fontSize:14,color:"#A3A3A3"}}>Carregando...</div></div>;
  if(error)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#FAFAF9"}}><div style={{textAlign:"center",maxWidth:360}}><div style={{fontSize:40,marginBottom:8,opacity:0.3}}>🔍</div><h2 style={{fontFamily:"Outfit",fontSize:18,fontWeight:600,color:"#1A1A1A",marginBottom:8}}>Reserva não encontrada</h2><p style={{fontFamily:"Outfit",fontSize:13,color:"#A3A3A3"}}>Este link pode estar expirado ou incorreto.</p></div></div>;

  if(submitted&&!isEdit)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)"}}><div style={{textAlign:"center",maxWidth:380}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",margin:"0 auto 20px",boxShadow:`0 8px 32px ${B.primary}40`}}>✓</div>
    <h2 style={{fontFamily:"Outfit",fontSize:22,fontWeight:800,color:"#1A1A1A",marginBottom:8}}>Tudo certo!</h2>
    <p style={{fontFamily:"Outfit",fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Seus dados foram enviados. A equipe do <strong style={{color:"#1A1A1A"}}>{data?.propertyName}</strong> está preparando tudo.</p>
    <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E5E5E5",marginBottom:16}}>
      <div style={{fontFamily:"Outfit",fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Check-in</div>
      <div style={{fontFamily:"Outfit",fontSize:16,fontWeight:600,color:"#1A1A1A",marginTop:4}}>{data?.checkInDate} a partir das {data?.checkInTime}</div>
    </div>
    <button onClick={()=>setIsEdit(true)} style={{fontFamily:"Outfit",fontSize:13,fontWeight:500,color:B.primary,background:"none",border:`1px solid ${B.muted}`,borderRadius:10,padding:"10px 20px",cursor:"pointer"}}>✏️ Editar informações</button>
  </div></div>;

  return<div style={{minHeight:"100vh",background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)",fontFamily:"Outfit,sans-serif"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1A1A1A,#2D2D2D)",padding:"36px 24px 28px",color:"#fff"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fhg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fhg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
          <span style={{fontSize:11,fontWeight:600,color:B.muted,textTransform:"uppercase",letterSpacing:"0.14em"}}>Check-in digital</span>
        </div>
        <h1 style={{fontFamily:"Outfit",fontSize:24,fontWeight:800,lineHeight:1.2,margin:0}}>{data?.propertyName}</h1>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,marginTop:20,borderRadius:10,overflow:"hidden"}}>
          {[{l:"Check-in",v:data?.checkInDate||""},{l:"Check-out",v:data?.checkOutDate||""},{l:"Noites",v:data?.nights?`${data.nights}`:"-"}].map((x,i)=><div key={i} style={{textAlign:"center",padding:"10px 8px",background:"rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.4)",marginBottom:3}}>{x.l}</div>
            <div style={{fontSize:15,fontWeight:600}}>{x.v}</div>
          </div>)}
        </div>
      </div>
    </div>

    <div style={{maxWidth:440,margin:"0 auto",padding:"24px 16px 100px"}}>
      {isEdit&&<div style={{background:B.light,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:B.primary,display:"flex",alignItems:"center",gap:8}}>✏️ Editando informações. Preencha o que deseja alterar e envie novamente.</div>}

      <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>
        Olá, <strong style={{color:"#1A1A1A"}}>{data?.guestName}</strong>! Preencha os dados {(data?.numGuests||1)>1?"de todos os hóspedes":"de identificação"} para agilizar o check-in.
      </p>

      {/* Phone */}
      <div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,padding:"16px 18px",marginBottom:12}}>
        <label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:8}}>
          Seu telefone (para contato da portaria) <span style={{color:B.primary}}>*</span>
        </label>
        <div style={{display:"flex",gap:8}}>
          <select value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)} style={{fontFamily:"Outfit",fontSize:14,padding:"10px 8px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",color:"#1A1A1A",width:80}}>
            <option value="+55">🇧🇷 +55</option><option value="+1">🇺🇸 +1</option><option value="+54">🇦🇷 +54</option><option value="+595">🇵🇾 +595</option><option value="+598">🇺🇾 +598</option><option value="+56">🇨🇱 +56</option><option value="+57">🇨🇴 +57</option><option value="+351">🇵🇹 +351</option><option value="+34">🇪🇸 +34</option><option value="+33">🇫🇷 +33</option><option value="+49">🇩🇪 +49</option><option value="+44">🇬🇧 +44</option><option value="+39">🇮🇹 +39</option>
          </select>
          <input value={guestPhone} onChange={e=>setGuestPhone(maskPhone(e.target.value))} placeholder="41999990000" inputMode="tel" style={{flex:1,fontFamily:"Outfit",fontSize:14,padding:"10px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",boxSizing:"border-box"}}/>
        </div>
      </div>

      {/* Guest cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {guests.map((g,i)=><GuestCard key={i} index={i} guest={g} onChange={updateGuest} onFile={handleFile} onRemove={removeGuest} canRemove={guests.length>1} isEdit={isEdit}/>)}
      </div>

      {guests.length<10&&<button onClick={addGuest} style={{width:"100%",padding:14,marginTop:10,border:"2px dashed #D4D4D4",borderRadius:14,background:"none",fontFamily:"Outfit",fontSize:13,fontWeight:500,color:"#737373",cursor:"pointer"}}>+ Adicionar hóspede</button>}

      {/* Vehicle */}
      <div style={{marginTop:12,background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,overflow:"hidden"}}>
        <button onClick={()=>setShowCar(!showCar)} style={{width:"100%",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
          <span style={{fontSize:14,fontWeight:500,color:"#1A1A1A"}}>🚗 Veículo <span style={{fontSize:12,fontWeight:400,color:"#A3A3A3"}}>(opcional)</span></span>
          <span style={{fontSize:12,color:"#A3A3A3",transform:showCar?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
        </button>
        {showCar&&<div style={{padding:"0 18px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5}}>Placa</label><input value={carPlate} onChange={e=>setCarPlate(e.target.value.toUpperCase())} placeholder="ABC-1D23" style={{width:"100%",fontFamily:"Outfit",fontSize:14,padding:"10px 12px",border:"1px solid #E5E5E5",borderRadius:8,textTransform:"uppercase",boxSizing:"border-box"}}/></div>
          <div><label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5}}>Modelo / Cor</label><input value={carModel} onChange={e=>setCarModel(e.target.value)} placeholder="HB20 Prata" style={{width:"100%",fontFamily:"Outfit",fontSize:14,padding:"10px 12px",border:"1px solid #E5E5E5",borderRadius:8,boxSizing:"border-box"}}/></div>
        </div>}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!canSubmit||submitting} style={{
        width:"100%",marginTop:20,padding:16,fontFamily:"Outfit",fontSize:15,fontWeight:600,
        background:canSubmit?"linear-gradient(135deg,#1A1A1A,#333)":"#D4D4D4",
        color:canSubmit?"#fff":"#A3A3A3",border:"none",borderRadius:14,cursor:canSubmit?"pointer":"not-allowed",
        boxShadow:canSubmit?"0 4px 20px rgba(0,0,0,0.15)":"none",
      }}>
        {submitting?"Enviando...":(isEdit?"Atualizar dados":"Enviar dados para check-in")}
      </button>
      <p style={{textAlign:"center",fontSize:11,color:"#A3A3A3",marginTop:14,lineHeight:1.5}}>Seus dados são utilizados exclusivamente para registro na portaria.</p>
    </div>
  </div>
}

// ─── GUEST CARD ─────────────────────────────────────────────────
function GuestCard({index:i,guest:g,onChange,onFile,onRemove,canRemove,isEdit}:{index:number;guest:GuestForm;onChange:(i:number,f:keyof GuestForm,v:any)=>void;onFile:(i:number,f:File)=>void;onRemove:(i:number)=>void;canRemove:boolean;isEdit:boolean}){
  const fileRef=useRef<HTMLInputElement>(null);
  return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <span style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hóspede {i+1}</span>
      {canRemove&&<button onClick={()=>onRemove(i)} style={{fontSize:16,color:"#A3A3A3",background:"none",border:"none",cursor:"pointer",padding:"2px 6px"}}>✕</button>}
    </div>

    {/* Foreign toggle */}
    <div onClick={()=>onChange(i,"foreign",!g.foreign)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:g.foreign?B.light:"#FAFAF9",border:`1px solid ${g.foreign?B.muted:"#E5E5E5"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,cursor:"pointer",transition:"all 0.2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{g.foreign?"🌍":"🇧🇷"}</span>
        <span style={{fontSize:13,fontWeight:500,color:g.foreign?B.primary:"#1A1A1A"}}>{g.foreign?"Estrangeiro":"Brasileiro"}</span>
      </div>
      <div style={{width:36,height:20,borderRadius:10,padding:2,background:g.foreign?B.primary:"#D4D4D4",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:g.foreign?"flex-end":"flex-start"}}>
        <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="Nome completo" placeholder="Como consta no documento" required value={g.fullName} onChange={v=>onChange(i,"fullName",v)}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Field label="Data de nascimento" placeholder="DD/MM/AAAA" required value={g.birthDate} onChange={v=>onChange(i,"birthDate",maskDate(v))} inputMode="numeric"/>
        {g.foreign
          ?<Field label="Passaporte" placeholder="Nº do passaporte" required value={g.passport} onChange={v=>onChange(i,"passport",v)}/>
          :<Field label="CPF" placeholder="000.000.000-00" value={g.cpf} onChange={v=>onChange(i,"cpf",maskCPF(v))} inputMode="numeric"/>
        }
      </div>
      {g.foreign
        ?<Field label="RNE (se houver)" placeholder="Nº do RNE" value={g.rne} onChange={v=>onChange(i,"rne",v)}/>
        :<Field label="RG" placeholder="Número do RG" value={g.rg} onChange={v=>onChange(i,"rg",v)}/>
      }

      <div>
        <label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>
          Documento com foto <span style={{color:B.primary}}>*</span>
        </label>
        <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${g.preview?"transparent":"#D4D4D4"}`,borderRadius:12,cursor:"pointer",overflow:"hidden",background:g.preview?"transparent":"#FAFAF9"}}>
          {g.preview
            ?<img src={g.preview} alt="Doc" style={{width:"100%",display:"block",borderRadius:10}}/>
            :<div style={{padding:"24px 16px",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4,opacity:0.4}}>📄</div>
              <div style={{fontSize:13,fontWeight:500,color:"#737373"}}>Toque para enviar foto do {g.foreign?"passaporte":"RG ou CNH"}</div>
              <div style={{fontSize:11,color:"#A3A3A3",marginTop:4}}>JPG, PNG ou PDF · máx. 10MB</div>
            </div>
          }
        </div>
        {isEdit&&!g.file&&<div style={{fontSize:11,color:B.primary,marginTop:4}}>ℹ️ Documento anterior mantido. Envie novo apenas se quiser substituir.</div>}
        <input ref={fileRef} type="file" accept="image/*,.pdf" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)onFile(i,f)}}/>
      </div>
    </div>
  </div>
}

function Field({label,placeholder,required,value,onChange,inputMode}:{label:string;placeholder:string;required?:boolean;value:string;onChange:(v:string)=>void;inputMode?:string}){
  return<div>
    <label style={{fontSize:10,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5}}>{label} {required&&<span style={{color:B.primary}}>*</span>}</label>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode as any} style={{width:"100%",fontFamily:"Outfit",fontSize:14,color:"#1A1A1A",padding:"10px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",boxSizing:"border-box"}}/>
  </div>
}
