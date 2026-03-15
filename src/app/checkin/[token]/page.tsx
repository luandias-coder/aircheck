"use client";
import { useState, useEffect, useRef } from "react";

const B = { primary:"#3B5FE5", primaryDark:"#5B7FFF", g1:"#3B5FE5", g2:"#5E4FE5", light:"#EBF0FF", muted:"#B4C6FC" };

function maskCPF(v:string){return v.replace(/\D/g,"").slice(0,11).replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d)/,"$1.$2").replace(/(\d{3})(\d{1,2})$/,"$1-$2")}
function maskDate(v:string){return v.replace(/\D/g,"").slice(0,8).replace(/(\d{2})(\d)/,"$1/$2").replace(/(\d{2})(\d)/,"$1/$2")}
function maskPhone(v:string){return v.replace(/\D/g,"").slice(0,13)}

// Compress image to max 800KB JPEG using canvas with iterative quality reduction
function compressImage(file:File,maxSizeKB=800):Promise<File>{
  return new Promise((resolve)=>{
    // PDFs: can't compress, check size
    if(file.type==="application/pdf"){
      if(file.size>3*1024*1024){
        // Too large PDF - reject
        resolve(new File([],"too-large.pdf",{type:"application/pdf"}));
      }else{resolve(file)}
      return;
    }
    if(!file.type.startsWith("image/")){resolve(file);return}
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      let w=img.width,h=img.height;
      const maxDim=1200;
      if(w>maxDim||h>maxDim){
        if(w>h){h=Math.round(h*(maxDim/w));w=maxDim}
        else{w=Math.round(w*(maxDim/h));h=maxDim}
      }
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d")!;
      ctx.drawImage(img,0,0,w,h);
      // Iterative quality reduction
      const tryQuality=(q:number)=>{
        canvas.toBlob(blob=>{
          if(!blob){resolve(file);return}
          if(blob.size>maxSizeKB*1024&&q>0.3){
            tryQuality(q-0.1);
          }else{
            resolve(new File([blob],file.name.replace(/\.\w+$/,".jpg"),{type:"image/jpeg"}));
          }
        },"image/jpeg",q);
      };
      tryQuality(0.7);
    };
    img.onerror=()=>resolve(file);
    img.src=URL.createObjectURL(file);
  });
}

interface GuestForm { fullName:string; birthDate:string; cpf:string; rg:string; foreign:boolean; passport:string; rne:string; file:File|null; preview:string|null; fileName:string|null }
const emptyGuest=():GuestForm=>({fullName:"",birthDate:"",cpf:"",rg:"",foreign:false,passport:"",rne:"",file:null,preview:null,fileName:null});

interface ResData { propertyName:string; guestName:string; guestPhone:string|null; checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string; numGuests:number; nights:number|null; status:string; carPlate:string|null; carModel:string|null; condominiumName:string|null; condominiumAddress:string|null; guests:Array<{fullName:string;birthDate:string;cpf:string|null;rg:string|null;foreign:boolean;passport:string|null;rne:string|null;hasDocument:boolean}> }

// 16px font prevents iOS auto-zoom on input focus
const iStyle:React.CSSProperties = {width:"100%",fontFamily:"Outfit,sans-serif",fontSize:16,color:"#1A1A1A",padding:"12px 14px",border:"1px solid #E5E5E5",borderRadius:10,background:"#fff",boxSizing:"border-box",WebkitAppearance:"none" as any};
const lblStyle:React.CSSProperties = {fontSize:11,fontWeight:600,color:"#737373",textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:5};

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

  useEffect(()=>{
    fetch(`/api/checkin/${params.token}`).then(async res=>{
      if(!res.ok)throw new Error("not_found");
      const d=await res.json();
      setData(d);
      if(d.status==="pending_form"){
        // Pre-fill existing guests (e.g. when host reopened form to add more)
        const prefilled=d.guests.map((g:any):GuestForm=>({
          fullName:g.fullName||"",birthDate:g.birthDate||"",cpf:g.cpf||"",rg:g.rg||"",
          foreign:g.foreign||false,passport:g.passport||"",rne:g.rne||"",
          file:null,preview:null,fileName:g.hasDocument?"documento_anterior":null
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

  const handleFile=async(i:number,rawFile:File)=>{
    if(rawFile.size>15*1024*1024){alert("Arquivo muito grande. Máximo 15MB.");return}
    if(rawFile.type==="application/pdf"&&rawFile.size>3*1024*1024){alert("PDF muito grande (máx 3MB). Tire uma foto do documento com a câmera.");return}
    const file=await compressImage(rawFile);
    if(file.size>4*1024*1024){alert("Não foi possível comprimir o suficiente. Tire uma foto do documento com a câmera.");return}
    updateGuest(i,"file",file);
    updateGuest(i,"fileName",rawFile.name);
    if(file.type.startsWith("image/")){
      const r=new FileReader();
      r.onload=e=>updateGuest(i,"preview",e.target?.result as string);
      r.readAsDataURL(file);
    }else{
      updateGuest(i,"preview",null);
    }
  };

  const canSubmit=!!guestPhone&&guests.length>0&&guests.every((g,i)=>{
    const hasName=!!g.fullName&&!!g.birthDate;
    const hasDoc=!!g.file||(data?.guests[i]?.hasDocument===true);
    const hasIdDoc=g.foreign?!!g.passport:!!g.cpf;
    return hasName&&hasDoc&&hasIdDoc;
  });

  const[uploadStatus,setUploadStatus]=useState("");

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!canSubmit)return;
    setSubmitting(true);
    try{
      // Upload documents individually first
      const documentUrls:Record<number,string>={};
      const toUpload=guests.map((g,i)=>({index:i,file:g.file})).filter(x=>x.file);
      for(let j=0;j<toUpload.length;j++){
        const{index,file}=toUpload[j];
        setUploadStatus(`Enviando documento ${j+1} de ${toUpload.length}...`);
        const uf=new FormData();
        uf.append("file",file!);
        uf.append("reservationId",params.token);
        const res=await fetch("/api/upload-doc",{method:"POST",body:uf});
        const d=await res.json().catch(()=>({error:`HTTP ${res.status}`}));
        if(!res.ok)throw new Error(d.error||"Erro no upload do documento");
        documentUrls[index]=d.url;
      }
      setUploadStatus("Salvando dados...");
      // Submit form data with document URLs (no files)
      const fd=new FormData();
      fd.append("guests",JSON.stringify(guests.map((g,i)=>({fullName:g.fullName,birthDate:g.birthDate,cpf:g.cpf,rg:g.rg,foreign:g.foreign,passport:g.passport,rne:g.rne,documentUrl:documentUrls[i]||undefined}))));
      if(carPlate)fd.append("carPlate",carPlate);
      if(carModel)fd.append("carModel",carModel);
      const fullPhone=`${phoneCountry}${guestPhone}`;
      fd.append("guestPhone",fullPhone);
      const res=await fetch(`/api/checkin/${params.token}`,{method:"POST",body:fd});
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||`Erro ${res.status}`)}
      setSubmitted(true);
    }catch(e:any){alert(e?.message||"Erro ao enviar. Tente novamente.")}finally{setSubmitting(false);setUploadStatus("")}
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FAFAF9"}}><div style={{fontFamily:"Outfit",fontSize:14,color:"#A3A3A3"}}>Carregando...</div></div>;
  if(error)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#FAFAF9"}}><div style={{textAlign:"center",maxWidth:360}}><div style={{fontSize:40,marginBottom:8,opacity:0.3}}>🔍</div><h2 style={{fontFamily:"Outfit",fontSize:18,fontWeight:600,color:"#1A1A1A",marginBottom:8}}>Reserva não encontrada</h2><p style={{fontFamily:"Outfit",fontSize:13,color:"#A3A3A3"}}>Este link pode estar expirado ou incorreto.</p></div></div>;

  if(submitted)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)"}}><div style={{textAlign:"center",maxWidth:380}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${B.g1},${B.g2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",margin:"0 auto 20px",boxShadow:`0 8px 32px ${B.primary}40`}}>✓</div>
    <h2 style={{fontFamily:"Outfit",fontSize:22,fontWeight:800,color:"#1A1A1A",marginBottom:8}}>Tudo certo!</h2>
    <p style={{fontFamily:"Outfit",fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>Seus dados foram enviados. A equipe do <strong style={{color:"#1A1A1A"}}>{data?.propertyName}</strong> está preparando tudo.</p>
    <div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E5E5E5",marginBottom:16}}>
      <div style={{fontFamily:"Outfit",fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Check-in</div>
      <div style={{fontFamily:"Outfit",fontSize:16,fontWeight:600,color:"#1A1A1A",marginTop:4}}>{data?.checkInDate} a partir das {data?.checkInTime}</div>
    </div>
    {data?.condominiumAddress&&<div style={{background:"#fff",borderRadius:12,padding:16,border:"1px solid #E5E5E5",marginBottom:16}}>
      <div style={{fontFamily:"Outfit",fontSize:10,fontWeight:600,color:"#A3A3A3",textTransform:"uppercase",letterSpacing:"0.06em"}}>Endereço</div>
      <div style={{fontFamily:"Outfit",fontSize:14,fontWeight:500,color:"#1A1A1A",marginTop:4}}>{data.condominiumAddress}</div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.condominiumAddress)}`} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",fontFamily:"Outfit",fontSize:13,fontWeight:600,marginTop:8,padding:"8px 16px",background:"#3B5FE5",color:"#fff",borderRadius:8,textDecoration:"none"}}>📍 Como chegar</a>
    </div>}
    <p style={{fontFamily:"Outfit",fontSize:12,color:"#A3A3A3",lineHeight:1.5}}>Precisa corrigir alguma informação? Entre em contato com o anfitrião para solicitar a reabertura do formulário.</p>
  </div></div>;

  return<div style={{minHeight:"100vh",background:"linear-gradient(170deg,#FAFAF9,#F0F0EE)",fontFamily:"Outfit,sans-serif",overflowX:"hidden",width:"100%"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg,#1A1A1A,#2D2D2D)",padding:"36px 20px 28px",color:"#fff"}}>
      <div style={{maxWidth:440,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="11" fill="url(#fhg)"/><path d="M10 19L20 11L30 19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 18V28H27V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 22.5L19 25.5L25 19.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><defs><linearGradient id="fhg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop stopColor={B.g1}/><stop offset="1" stopColor={B.g2}/></linearGradient></defs></svg>
          <span style={{fontSize:11,fontWeight:600,color:B.muted,textTransform:"uppercase",letterSpacing:"0.14em"}}>Check-in digital</span>
        </div>
        <h1 style={{fontFamily:"Outfit",fontSize:22,fontWeight:800,lineHeight:1.2,margin:0}}>{data?.propertyName}</h1>
        {data?.condominiumAddress&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}><span style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>📍 {data.condominiumAddress}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.condominiumAddress)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#B4C6FC",textDecoration:"none",fontWeight:600}}>Como chegar →</a></div>}
        <div style={{display:"flex",gap:1,marginTop:20,borderRadius:10,overflow:"hidden"}}>
          {[{l:"Check-in",v:data?.checkInDate||""},{l:"Check-out",v:data?.checkOutDate||""},{l:"Noites",v:data?.nights?`${data.nights}`:"-"}].map((x,i)=><div key={i} style={{flex:1,textAlign:"center",padding:"10px 6px",background:"rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.4)",marginBottom:3}}>{x.l}</div>
            <div style={{fontSize:14,fontWeight:600}}>{x.v}</div>
          </div>)}
        </div>
      </div>
    </div>

    {/* form wrapper enables iOS prev/next keyboard arrows */}
    <form onSubmit={handleSubmit} style={{maxWidth:440,margin:"0 auto",padding:"24px 16px 120px"}}>
      <p style={{fontSize:14,color:"#737373",lineHeight:1.6,marginBottom:20}}>
        Olá, <strong style={{color:"#1A1A1A"}}>{data?.guestName}</strong>! Preencha os dados {(data?.numGuests||1)>1?"de todos os hóspedes":"de identificação"} para agilizar o check-in.
      </p>

      {/* Phone */}
      <div style={{marginBottom:16}}>
        <label style={lblStyle}>Seu telefone <span style={{color:"#DC2626"}}>*</span></label>
        <div style={{display:"flex",gap:8}}>
          <select value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)} style={{fontFamily:"Outfit",fontSize:16,padding:"12px 6px",border:"1px solid #E5E5E5",borderRadius:10,background:"#fff",minWidth:80,color:"#1A1A1A"}}>
            <option value="+55">🇧🇷 +55</option><option value="+1">🇺🇸 +1</option><option value="+54">🇦🇷 +54</option><option value="+595">🇵🇾 +595</option><option value="+598">🇺🇾 +598</option><option value="+56">🇨🇱 +56</option><option value="+57">🇨🇴 +57</option><option value="+351">🇵🇹 +351</option><option value="+34">🇪🇸 +34</option><option value="+33">🇫🇷 +33</option><option value="+49">🇩🇪 +49</option><option value="+44">🇬🇧 +44</option><option value="+39">🇮🇹 +39</option>
          </select>
          <input value={guestPhone} onChange={e=>setGuestPhone(maskPhone(e.target.value))} placeholder="41999990000" inputMode="tel" enterKeyHint="next" required style={{...iStyle,flex:1}}/>
        </div>
      </div>

      {/* Guest cards */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {guests.map((g,i)=><GuestCard key={i} index={i} guest={g} total={guests.length} hasExistingDoc={data?.guests[i]?.hasDocument===true&&!g.file} onChange={updateGuest} onFile={handleFile}/>)}
      </div>

      {/* Vehicle */}
      <div style={{marginTop:12,background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,overflow:"hidden"}}>
        <button type="button" onClick={()=>setShowCar(!showCar)} style={{width:"100%",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:"none",border:"none",cursor:"pointer",fontFamily:"Outfit"}}>
          <span style={{fontSize:14,fontWeight:500,color:"#1A1A1A"}}>🚗 Veículo <span style={{fontSize:12,fontWeight:400,color:"#A3A3A3"}}>(opcional)</span></span>
          <span style={{fontSize:12,color:"#A3A3A3",transform:showCar?"rotate(180deg)":"",transition:"transform 0.2s"}}>▼</span>
        </button>
        {showCar&&<div style={{padding:"0 18px 18px",display:"flex",flexDirection:"column",gap:10}}>
          <div><label style={lblStyle}>Placa</label><input value={carPlate} onChange={e=>setCarPlate(e.target.value.toUpperCase())} placeholder="ABC-1D23" enterKeyHint="next" style={{...iStyle,textTransform:"uppercase"}}/></div>
          <div><label style={lblStyle}>Modelo / Cor</label><input value={carModel} onChange={e=>setCarModel(e.target.value)} placeholder="HB20 Prata" enterKeyHint="done" style={iStyle}/></div>
        </div>}
      </div>

      {/* Submit */}
      <button type="submit" disabled={!canSubmit||submitting} style={{
        width:"100%",marginTop:20,padding:18,fontFamily:"Outfit",fontSize:16,fontWeight:600,
        background:canSubmit?"linear-gradient(135deg,#1A1A1A,#333)":"#D4D4D4",
        color:canSubmit?"#fff":"#A3A3A3",border:"none",borderRadius:14,cursor:canSubmit?"pointer":"not-allowed",
        boxShadow:canSubmit?"0 4px 20px rgba(0,0,0,0.15)":"none",
      }}>
        {submitting?(uploadStatus||"Enviando..."):"Enviar dados para check-in"}
      </button>
      <p style={{textAlign:"center",fontSize:11,color:"#A3A3A3",marginTop:14,lineHeight:1.5}}>Seus dados são utilizados exclusivamente para registro na portaria.</p>
    </form>
  </div>
}

// ─── GUEST CARD ─────────────────────────────────────────────────
function GuestCard({index:i,guest:g,total,hasExistingDoc,onChange,onFile}:{index:number;guest:GuestForm;total:number;hasExistingDoc:boolean;onChange:(i:number,f:keyof GuestForm,v:any)=>void;onFile:(i:number,f:File)=>void}){
  const fileRef=useRef<HTMLInputElement>(null);
  const[uploading,setUploading]=useState(false);

  const handleFileChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    setUploading(true);
    try{await onFile(i,f)}catch{}
    setUploading(false);
    // Reset input so same file can be re-selected
    e.target.value="";
  };

  return<div style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:14,padding:"18px 16px"}}>
    <div style={{marginBottom:14}}>
      <span style={{fontSize:11,fontWeight:600,color:B.primary,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hóspede {i+1}{total>1?` de ${total}`:""}</span>
    </div>

    {/* Foreign toggle */}
    <div onClick={()=>onChange(i,"foreign",!g.foreign)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:g.foreign?B.light:"#FAFAF9",border:`1px solid ${g.foreign?B.muted:"#E5E5E5"}`,borderRadius:10,padding:"12px 14px",marginBottom:14,cursor:"pointer",transition:"all 0.2s",WebkitTapHighlightColor:"transparent"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{g.foreign?"🌍":"🇧🇷"}</span>
        <span style={{fontSize:14,fontWeight:500,color:g.foreign?B.primary:"#1A1A1A"}}>{g.foreign?"Estrangeiro":"Brasileiro"}</span>
      </div>
      <div style={{width:40,height:22,borderRadius:11,padding:2,background:g.foreign?B.primary:"#D4D4D4",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:g.foreign?"flex-end":"flex-start"}}>
        <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </div>
    </div>

    {/* Name */}
    <div style={{marginBottom:12}}>
      <label style={lblStyle}>Nome completo <span style={{color:B.primary}}>*</span></label>
      <input value={g.fullName} onChange={e=>onChange(i,"fullName",e.target.value)} placeholder="Como consta no documento" autoComplete="name" enterKeyHint="next" style={iStyle}/>
    </div>

    {/* Birth date */}
    <div style={{marginBottom:12}}>
      <label style={lblStyle}>Data de nascimento <span style={{color:B.primary}}>*</span></label>
      <input value={g.birthDate} onChange={e=>onChange(i,"birthDate",maskDate(e.target.value))} placeholder="DD/MM/AAAA" inputMode="numeric" enterKeyHint="next" style={iStyle}/>
    </div>

    {/* CPF or Passport */}
    <div style={{marginBottom:12}}>
      {g.foreign?<>
        <label style={lblStyle}>Passaporte <span style={{color:B.primary}}>*</span></label>
        <input value={g.passport} onChange={e=>onChange(i,"passport",e.target.value)} placeholder="Número do passaporte" enterKeyHint="next" style={iStyle}/>
      </>:<>
        <label style={lblStyle}>CPF <span style={{color:B.primary}}>*</span></label>
        <input value={g.cpf} onChange={e=>onChange(i,"cpf",maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" enterKeyHint="next" style={iStyle}/>
      </>}
    </div>

    {/* RG or RNE */}
    <div style={{marginBottom:12}}>
      {g.foreign?<>
        <label style={lblStyle}>RNE <span style={{fontWeight:400,color:"#A3A3A3"}}>(se houver)</span></label>
        <input value={g.rne} onChange={e=>onChange(i,"rne",e.target.value)} placeholder="Número do RNE" enterKeyHint="next" style={iStyle}/>
      </>:<>
        <label style={lblStyle}>RG</label>
        <input value={g.rg} onChange={e=>onChange(i,"rg",e.target.value)} placeholder="Número do RG" enterKeyHint="next" style={iStyle}/>
      </>}
    </div>

    {/* Document upload */}
    <div>
      <label style={lblStyle}>Documento com foto <span style={{color:B.primary}}>*</span></label>
      <div onClick={()=>!uploading&&fileRef.current?.click()} style={{border:`2px dashed ${(g.file||hasExistingDoc)?"transparent":"#D4D4D4"}`,borderRadius:12,cursor:uploading?"wait":"pointer",overflow:"hidden",background:(g.file||hasExistingDoc)?"transparent":"#FAFAF9",WebkitTapHighlightColor:"transparent"}}>
        {uploading
          ?<div style={{padding:"28px 16px",textAlign:"center"}}>
            <div style={{fontSize:14,fontWeight:500,color:"#737373"}}>Comprimindo imagem...</div>
          </div>
          :g.preview
          ?<div style={{position:"relative"}}>
            <img src={g.preview} alt="Doc" style={{width:"100%",maxHeight:280,objectFit:"contain",display:"block",borderRadius:10,background:"#F5F5F5"}}/>
            <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:12,fontWeight:600,padding:"6px 12px",borderRadius:8}}>Trocar</div>
          </div>
          :g.file&&g.fileName
          ?<div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,background:"#ECFDF5",borderRadius:10,border:"1px solid #BBF7D0"}}>
            <span style={{fontSize:24}}>📄</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#059669",marginBottom:2}}>Arquivo anexado</div>
              <div style={{fontSize:12,color:"#737373",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.fileName}</div>
            </div>
            <span style={{fontSize:14,color:"#059669",fontWeight:700}}>✓</span>
          </div>
          :hasExistingDoc
          ?<div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,background:"#ECFDF5",borderRadius:10,border:"1px solid #BBF7D0"}}>
            <span style={{fontSize:24}}>✅</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#059669",marginBottom:2}}>Documento já enviado</div>
              <div style={{fontSize:12,color:"#737373"}}>Toque para substituir (opcional)</div>
            </div>
          </div>
          :<div style={{padding:"28px 16px",textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:6,opacity:0.4}}>📄</div>
            <div style={{fontSize:14,fontWeight:500,color:"#737373"}}>Toque para enviar</div>
            <div style={{fontSize:14,fontWeight:500,color:"#737373"}}>foto do {g.foreign?"passaporte":"RG ou CNH"}</div>
            <div style={{fontSize:12,color:"#A3A3A3",marginTop:8}}>Câmera, galeria ou arquivo PDF</div>
          </div>
        }
      </div>
      {/* accept order: specific types first, then wildcard - helps iOS show all options */}
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*,application/pdf" style={{display:"none"}} onChange={handleFileChange}/>
    </div>
  </div>
}
