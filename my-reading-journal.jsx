import { useState, useEffect, useRef } from "react";

// ─── STORAGE ─────────────────────────────────────────────────────────
async function load(key){try{const r=await window.storage.get(key);return r?JSON.parse(r.value):null;}catch{return null;}}
async function save(key,val){try{await window.storage.set(key,JSON.stringify(val));}catch{}}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────
// Bright, warm, editorial — ivory paper, ink, terracotta, sage, antique gold
const T = {
  bg:        "#FBF8F1",
  bgWarm:    "#F5EFE3",
  surface:   "#FFFFFF",
  panel:     "#FFFDF8",
  cream:     "#F3ECDD",
  border:    "#E6DDC9",
  borderHi:  "#D4C8AC",
  ink:       "#2A2420",
  inkSoft:   "#5A5048",
  inkMuted:  "#928775",
  gold:      "#B08D3C",
  goldDeep:  "#8A6D26",
  goldLt:    "#D4B468",
  terra:     "#C26B4A",
  terraDeep: "#A8512F",
  sage:      "#6E8B5E",
  sageDeep:  "#52704A",
  plum:      "#8A5A7A",
  plumDeep:  "#6E4060",
  blue:      "#5A7FB0",
  blueDeep:  "#3E6090",
  amber:     "#C89A3C",
  rose:      "#C2607A",
};

const STATUS_META = {
  "Reading":      { color:T.blueDeep,  bg:"#E8F0FA", dot:T.blue,  ring:"#C8DCF0" },
  "Finished":     { color:T.sageDeep,  bg:"#EAF2E5", dot:T.sage,  ring:"#D0E4C5" },
  "Want to Read": { color:T.terraDeep, bg:"#FBEAE2", dot:T.terra, ring:"#F2D2C2" },
  "Abandoned":    { color:"#8A6660",   bg:"#F2E8E5", dot:"#A88078",ring:"#E4D0CA" },
};

const GENRES=["Fiction","Non-Fiction","Fantasy","Sci-Fi","Mystery","Romance","Historical","Biography","Self-Help","Poetry","Horror","Thriller","Graphic Novel","Classic","Other"];
const STATUSES=["Reading","Finished","Want to Read","Abandoned"];
const MOODS=["😍","🥹","🤯","😊","😢","😤","😌","🤔","😰","😴","🔥","💔"];
// 10-point scale labels (rating stored as 0-10 in half-star units, i.e. 1 unit = half a star)
function ratingLabel(r){ // r is 0..10
  if(r<=0) return "";
  if(r<=2) return "Did not enjoy it";
  if(r<=4) return "It was okay";
  if(r<=6) return "Liked it";
  if(r<=8) return "Really liked it";
  return "An absolute favorite ✨";
}

// ─── FONT LOADER (elegant typography) ─────────────────────────────────
function useFonts(){
  useEffect(()=>{
    const id="rlj-fonts";
    if(document.getElementById(id)) return;
    const link=document.createElement("link");
    link.id=id; link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  },[]);
}
const SERIF="'Fraunces','Georgia',serif";
const SANS="'Inter','-apple-system',system-ui,sans-serif";

// ─── COVER API ────────────────────────────────────────────────────────
async function fetchBookCover(title,author){
  try{
    const q=encodeURIComponent(`${title} ${author}`);
    const r=await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i,isbn`);
    if(!r.ok) return null;
    const d=await r.json();
    const doc=d.docs?.[0];
    if(doc?.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    if(doc?.isbn?.[0]) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
    return null;
  }catch{return null;}
}

// ─── COVER COMPONENT ──────────────────────────────────────────────────
function Cover({book,size="md"}){
  const [src,setSrc]=useState(book.coverUrl||null);
  const [failed,setFailed]=useState(false);
  const [loading,setLoading]=useState(!book.coverUrl);
  useEffect(()=>{
    if(book.coverUrl){setSrc(book.coverUrl);setLoading(false);return;}
    setLoading(true);
    fetchBookCover(book.title,book.author).then(u=>{setLoading(false);if(u)setSrc(u);else setFailed(true);});
  },[book.id,book.coverUrl]);
  const dims={sm:{w:46,h:68},md:{w:74,h:108},lg:{w:118,h:172}};
  const {w,h}=dims[size]||dims.md;
  const pal=[["#C26B4A","#E0987A"],["#6E8B5E","#9CB88A"],["#5A7FB0","#8AAAD0"],["#8A5A7A","#B488A4"],["#B08D3C","#D4B468"],["#A8512F","#D08060"]];
  const [d,l]=pal[(book.title.charCodeAt(0)||65)%pal.length];
  const initials=book.title.split(" ").filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("");
  const base={width:w,height:h,borderRadius:size==="lg"?7:5,flexShrink:0,overflow:"hidden",position:"relative",boxShadow:size==="lg"?"0 12px 32px rgba(60,40,20,.22), 0 2px 6px rgba(60,40,20,.12)":"0 4px 14px rgba(60,40,20,.16)"};
  if(src&&!failed) return <div style={base}><img src={src} alt={book.title} onError={()=>setFailed(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/></div>;
  return (
    <div style={{...base,background:`linear-gradient(150deg,${d},${l})`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      {loading?<div style={{color:"rgba(255,255,255,.6)",fontSize:11,letterSpacing:1}}>···</div>:(
        <>
          <div style={{fontSize:size==="lg"?32:size==="md"?22:15,fontWeight:600,color:"rgba(255,255,255,.95)",fontFamily:SERIF}}>{initials}</div>
          {size!=="sm"&&<div style={{fontSize:size==="lg"?9.5:8,color:"rgba(255,255,255,.7)",textAlign:"center",padding:"5px 7px",lineHeight:1.35,fontFamily:SANS}}>{book.title.slice(0,26)}{book.title.length>26?"…":""}</div>}
        </>
      )}
    </div>
  );
}

// ─── 10-STAR HALF-STAR RATING ─────────────────────────────────────────
// value is 0..10 (each unit = half a star). 5 stars displayed.
function StarRating({value=0,onChange,size=22,readonly=false}){
  const [hover,setHover]=useState(0); // 0..10
  const display=hover||value;
  const handle=(e,starIdx)=>{
    if(readonly) return;
    const rect=e.currentTarget.getBoundingClientRect();
    const isLeft=(e.clientX-rect.left)<rect.width/2;
    const units=starIdx*2 + (isLeft?1:2); // 1..10
    onChange(units===value?0:units);
  };
  const move=(e,starIdx)=>{
    if(readonly) return;
    const rect=e.currentTarget.getBoundingClientRect();
    const isLeft=(e.clientX-rect.left)<rect.width/2;
    setHover(starIdx*2+(isLeft?1:2));
  };
  return (
    <div style={{display:"inline-flex",gap:3}} onMouseLeave={()=>!readonly&&setHover(0)}>
      {[0,1,2,3,4].map(i=>{
        const fillUnits=Math.max(0,Math.min(2,display-i*2)); // 0,1,2 for this star
        const pct=fillUnits*50; // 0,50,100
        return (
          <span key={i}
            onClick={e=>handle(e,i)}
            onMouseMove={e=>move(e,i)}
            style={{position:"relative",cursor:readonly?"default":"pointer",fontSize:size,lineHeight:1,width:size,height:size,display:"inline-block",userSelect:"none"}}>
            <span style={{position:"absolute",inset:0,color:"#E2D8C2"}}>★</span>
            <span style={{position:"absolute",inset:0,color:T.gold,overflow:"hidden",width:`${pct}%`}}>★</span>
          </span>
        );
      })}
    </div>
  );
}
// Display rating as e.g. "8.5 / 10"
function ratingText(units){ return `${(units/2).toFixed(1).replace(/\.0$/,"")} / 5`; }
function ratingTextTen(units){ return `${units} / 10`; }

// ─── INPUT STYLE ──────────────────────────────────────────────────────
const inp={width:"100%",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.ink,padding:"11px 14px",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:SANS,transition:"border-color .18s, box-shadow .18s"};
const focusable=(e,on)=>{e.currentTarget.style.borderColor=on?T.gold:T.border;e.currentTarget.style.boxShadow=on?`0 0 0 3px ${T.gold}22`:"none";};

// ─── FIELD ────────────────────────────────────────────────────────────
function Field({label,children,col=1}){
  return (
    <div style={{gridColumn:`span ${col}`}}>
      <label style={{display:"block",fontSize:11,color:T.inkMuted,marginBottom:6,fontWeight:600,letterSpacing:.6,textTransform:"uppercase",fontFamily:SANS}}>{label}</label>
      {children}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────
function Modal({onClose,children,width=580}){
  const [show,setShow]=useState(false);
  useEffect(()=>{const t=requestAnimationFrame(()=>setShow(true));return()=>cancelAnimationFrame(t);},[]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(40,30,20,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(6px)",opacity:show?1:0,transition:"opacity .25s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.panel,border:`1px solid ${T.border}`,borderRadius:22,padding:32,width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 40px 120px rgba(60,40,20,.3), 0 8px 24px rgba(60,40,20,.15)",transform:show?"translateY(0) scale(1)":"translateY(16px) scale(.97)",transition:"transform .3s cubic-bezier(.2,.8,.2,1)"}}>
        {children}
      </div>
    </div>
  );
}
function ModalHead({title,sub,onClose}){
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <h2 style={{margin:0,fontSize:23,color:T.ink,fontFamily:SERIF,fontWeight:600,letterSpacing:-.3}}>{title}</h2>
        {sub&&<p style={{margin:"5px 0 0",fontSize:13.5,color:T.inkSoft,fontFamily:SANS,fontStyle:"italic"}}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{background:T.cream,border:"none",color:T.inkMuted,fontSize:18,cursor:"pointer",lineHeight:1,padding:"6px 10px",borderRadius:8,fontFamily:SANS}}>✕</button>
    </div>
  );
}

// ─── BUTTONS ──────────────────────────────────────────────────────────
function Btn({children,onClick,variant="ghost",full=false}){
  const v={
    primary:{background:`linear-gradient(135deg,${T.goldDeep},${T.gold})`,color:"#FFFDF6",border:"none",fontWeight:600,boxShadow:`0 4px 14px ${T.gold}40`},
    sage:{background:`linear-gradient(135deg,${T.sageDeep},${T.sage})`,color:"#FFFDF6",border:"none",fontWeight:600,boxShadow:`0 4px 14px ${T.sage}40`},
    plum:{background:`linear-gradient(135deg,${T.plumDeep},${T.plum})`,color:"#FFFDF6",border:"none",fontWeight:600,boxShadow:`0 4px 14px ${T.plum}40`},
    ghost:{background:T.surface,border:`1.5px solid ${T.border}`,color:T.inkSoft},
    danger:{background:T.surface,border:`1.5px solid #E4CCC4`,color:T.terraDeep},
  };
  return (
    <button onClick={onClick} style={{...v[variant],borderRadius:10,padding:"9px 20px",cursor:"pointer",fontSize:13,fontFamily:SANS,letterSpacing:.2,transition:"transform .12s, box-shadow .18s, opacity .15s",width:full?"100%":"auto"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";}}>
      {children}
    </button>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────
function Empty({icon,title,sub,action}){
  return (
    <div style={{textAlign:"center",padding:"56px 24px"}}>
      <div style={{fontSize:46,marginBottom:14,opacity:.7}}>{icon}</div>
      <div style={{fontWeight:600,fontSize:17,color:T.ink,marginBottom:7,fontFamily:SERIF}}>{title}</div>
      <div style={{fontSize:13.5,lineHeight:1.7,color:T.inkSoft,fontFamily:SANS,marginBottom:action?20:0,maxWidth:380,marginLeft:"auto",marginRight:"auto"}}>{sub}</div>
      {action}
    </div>
  );
}

// ─── BOOK FORM ────────────────────────────────────────────────────────
function BookForm({initial,onSave,onClose}){
  const blank={title:"",author:"",genre:"Fiction",status:"Want to Read",rating:0,pages:"",dateStarted:"",dateFinished:"",coverUrl:""};
  const [form,setForm]=useState(initial||blank);
  const [busy,setBusy]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const valid=form.title.trim()&&form.author.trim();
  const submit=()=>{
    if(!valid) return;
    if(!form.coverUrl){setBusy(true);fetchBookCover(form.title,form.author).then(u=>{setBusy(false);onSave({...form,coverUrl:u||""});});}
    else onSave(form);
  };
  return (
    <>
      <ModalHead title={initial?"Edit book":"Add a book"} onClose={onClose}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Field label="Title" col={2}><input value={form.title} onChange={e=>set("title",e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="e.g. A Little Life" style={inp}/></Field>
        <Field label="Author" col={2}><input value={form.author} onChange={e=>set("author",e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="e.g. Hanya Yanagihara" style={inp}/></Field>
        <Field label="Genre"><select value={form.genre} onChange={e=>set("genre",e.target.value)} style={{...inp,cursor:"pointer"}}>{GENRES.map(g=><option key={g}>{g}</option>)}</select></Field>
        <Field label="Status"><select value={form.status} onChange={e=>set("status",e.target.value)} style={{...inp,cursor:"pointer"}}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
        <Field label="Pages"><input type="number" value={form.pages} onChange={e=>set("pages",e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="0" style={inp}/></Field>
        <Field label="Your rating">
          <div style={{paddingTop:7}}>
            <StarRating value={form.rating} onChange={v=>set("rating",v)} size={26}/>
            {form.rating>0&&<div style={{fontSize:11.5,color:T.goldDeep,marginTop:6,fontFamily:SANS}}>{ratingTextTen(form.rating)} · {ratingLabel(form.rating)}</div>}
          </div>
        </Field>
        <Field label="Date started"><input type="date" value={form.dateStarted} onChange={e=>set("dateStarted",e.target.value)} style={inp}/></Field>
        <Field label="Date finished"><input type="date" value={form.dateFinished} onChange={e=>set("dateFinished",e.target.value)} style={inp}/></Field>
      </div>
      <div style={{display:"flex",gap:10,marginTop:26,justifyContent:"flex-end"}}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <button onClick={submit} disabled={!valid||busy} style={{background:valid?`linear-gradient(135deg,${T.goldDeep},${T.gold})`:T.cream,border:"none",borderRadius:10,color:valid?"#FFFDF6":T.inkMuted,padding:"9px 24px",cursor:valid?"pointer":"default",fontSize:13,fontWeight:600,fontFamily:SANS,boxShadow:valid?`0 4px 14px ${T.gold}40`:"none"}}>{busy?"Finding cover…":"Save book"}</button>
      </div>
    </>
  );
}

// ─── REVIEW FORM ──────────────────────────────────────────────────────
function ReviewForm({book,initial,onSave,onClose}){
  const [text,setText]=useState(initial?.text||"");
  const [rating,setRating]=useState(initial?.rating||book.rating||0);
  const [spoiler,setSpoiler]=useState(initial?.spoiler||false);
  return (
    <>
      <ModalHead title={initial?"Edit review":"Write a review"} sub={`${book.title} · ${book.author}`} onClose={onClose}/>
      <Field label="Your rating">
        <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:4}}>
          <StarRating value={rating} onChange={setRating} size={28}/>
          {rating>0&&<span style={{fontSize:12.5,color:T.goldDeep,fontStyle:"italic",fontFamily:SANS}}>{ratingTextTen(rating)} · {ratingLabel(rating)}</span>}
        </div>
      </Field>
      <div style={{height:18}}/>
      <Field label="Review">
        <textarea value={text} onChange={e=>setText(e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="What moved you? What rang false? Would you press it into someone's hands?" style={{...inp,height:200,resize:"vertical",lineHeight:1.75}}/>
        <div style={{fontSize:11,color:T.inkMuted,marginTop:5,textAlign:"right",fontFamily:SANS}}>{text.length} characters</div>
      </Field>
      <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginTop:14}}>
        <div onClick={()=>setSpoiler(s=>!s)} style={{width:38,height:22,borderRadius:11,background:spoiler?T.terra:T.borderHi,position:"relative",transition:"background .2s",flexShrink:0}}>
          <div style={{position:"absolute",top:2,left:spoiler?18:2,width:18,height:18,borderRadius:9,background:"#FFF",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
        </div>
        <span style={{fontSize:13.5,color:T.inkSoft,fontFamily:SANS}}>Contains spoilers</span>
      </label>
      <div style={{display:"flex",gap:10,marginTop:22,justifyContent:"flex-end"}}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <button onClick={()=>text.trim()&&onSave({text,rating,spoiler,date:new Date().toISOString()})} disabled={!text.trim()} style={{background:text.trim()?`linear-gradient(135deg,${T.sageDeep},${T.sage})`:T.cream,border:"none",borderRadius:10,color:text.trim()?"#FFFDF6":T.inkMuted,padding:"9px 24px",cursor:text.trim()?"pointer":"default",fontSize:13,fontWeight:600,fontFamily:SANS,boxShadow:text.trim()?`0 4px 14px ${T.sage}40`:"none"}}>Save review</button>
      </div>
    </>
  );
}

// ─── JOURNAL FORM ─────────────────────────────────────────────────────
function JournalForm({book,initial,onSave,onClose}){
  const [title,setTitle]=useState(initial?.title||"");
  const [text,setText]=useState(initial?.text||"");
  const [mood,setMood]=useState(initial?.mood||"");
  return (
    <>
      <ModalHead title={initial?"Edit entry":"New journal entry"} sub={book.title} onClose={onClose}/>
      <Field label="Entry title (optional)"><input value={title} onChange={e=>setTitle(e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="e.g. The ending I didn't see coming" style={inp}/></Field>
      <div style={{height:16}}/>
      <Field label="Your thoughts">
        <textarea value={text} onChange={e=>setText(e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="Write freely — a line that broke you open, a character you'll carry with you, the feeling the last page left behind…" style={{...inp,height:220,resize:"vertical",lineHeight:1.85}}/>
      </Field>
      <div style={{marginTop:18}}>
        <label style={{display:"block",fontSize:11,color:T.inkMuted,marginBottom:10,fontWeight:600,letterSpacing:.6,textTransform:"uppercase",fontFamily:SANS}}>Mood while reading</label>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {MOODS.map(m=>(
            <button key={m} onClick={()=>setMood(mood===m?"":m)} style={{background:mood===m?T.cream:T.surface,border:`1.5px solid ${mood===m?T.gold:T.border}`,borderRadius:10,padding:"7px 11px",cursor:"pointer",fontSize:19,transition:"all .12s",boxShadow:mood===m?`0 0 0 3px ${T.gold}22`:"none"}}>{m}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:26,justifyContent:"flex-end"}}>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
        <button onClick={()=>text.trim()&&onSave({title,text,mood,date:new Date().toISOString()})} disabled={!text.trim()} style={{background:text.trim()?`linear-gradient(135deg,${T.plumDeep},${T.plum})`:T.cream,border:"none",borderRadius:10,color:text.trim()?"#FFFDF6":T.inkMuted,padding:"9px 24px",cursor:text.trim()?"pointer":"default",fontSize:13,fontWeight:600,fontFamily:SANS,boxShadow:text.trim()?`0 4px 14px ${T.plum}40`:"none"}}>Save entry</button>
      </div>
    </>
  );
}

// ─── PWA GUIDE ────────────────────────────────────────────────────────
function PWAGuide({onClose}){
  return (
    <>
      <ModalHead title="Use as an app" sub="Add to your home screen or desktop — no app store needed" onClose={onClose}/>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[
          {d:"📱 iPhone / iPad (Safari)",s:["Tap the Share button (box with an upward arrow)","Scroll down and tap \"Add to Home Screen\"","Tap \"Add\" — it now lives on your home screen"]},
          {d:"🤖 Android (Chrome)",s:["Tap the three-dot menu, top-right","Tap \"Add to Home screen\" or \"Install app\"","Confirm — done"]},
          {d:"💻 Desktop (Chrome / Edge)",s:["Look for the install icon (⊕) in the address bar","Or open the browser menu → \"Install\"","It opens in its own clean window"]},
        ].map(({d,s})=>(
          <div key={d} style={{background:T.cream,border:`1px solid ${T.border}`,borderRadius:14,padding:18}}>
            <div style={{fontWeight:600,color:T.ink,fontSize:14,marginBottom:12,fontFamily:SANS}}>{d}</div>
            <ol style={{margin:0,paddingLeft:18,display:"flex",flexDirection:"column",gap:7}}>
              {s.map((x,i)=><li key={i} style={{fontSize:13,color:T.inkSoft,lineHeight:1.6,fontFamily:SANS}}>{x}</li>)}
            </ol>
          </div>
        ))}
        <div style={{background:"#EAF2E5",border:`1px solid ${T.sage}40`,borderRadius:12,padding:14,fontSize:13,color:T.sageDeep,lineHeight:1.6,fontFamily:SANS}}>
          ✓ Your library is saved privately on your device and stays here between visits. Nothing is sent to a server.
        </div>
      </div>
    </>
  );
}

// ─── BOOK DETAIL ──────────────────────────────────────────────────────
function BookDetail({book,onEdit,onDelete,onAddReview,onEditReview,onDeleteReview,onAddJournal,onEditJournal,onDeleteJournal,onBack}){
  const [tab,setTab]=useState("overview");
  const [reveal,setReveal]=useState({});
  const m=STATUS_META[book.status]||STATUS_META["Want to Read"];
  const days=book.dateStarted&&book.dateFinished?Math.round((new Date(book.dateFinished)-new Date(book.dateStarted))/864e5):null;
  const fmt=d=>d?new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—";

  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:T.inkSoft,cursor:"pointer",fontSize:13.5,padding:"0 0 22px",display:"flex",alignItems:"center",gap:7,fontFamily:SANS}}>
        <span style={{fontSize:17}}>←</span> Back to shelf
      </button>

      {/* Hero */}
      <div style={{display:"flex",gap:26,marginBottom:34,alignItems:"flex-start"}}>
        <Cover book={book} size="lg"/>
        <div style={{flex:1}}>
          <h1 style={{margin:"0 0 7px",fontSize:28,color:T.ink,fontFamily:SERIF,fontWeight:600,lineHeight:1.2,letterSpacing:-.5}}>{book.title}</h1>
          <div style={{fontSize:15.5,color:T.inkSoft,marginBottom:16,fontStyle:"italic",fontFamily:SERIF}}>by {book.author}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
            <span style={{background:m.bg,color:m.color,borderRadius:20,padding:"5px 15px",fontSize:12.5,fontWeight:600,display:"flex",alignItems:"center",gap:6,fontFamily:SANS}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:m.dot,display:"inline-block"}}/>{book.status}
            </span>
            <span style={{background:T.surface,border:`1px solid ${T.border}`,color:T.inkSoft,borderRadius:20,padding:"5px 13px",fontSize:12.5,fontFamily:SANS}}>{book.genre}</span>
            {book.pages&&<span style={{background:T.surface,border:`1px solid ${T.border}`,color:T.inkSoft,borderRadius:20,padding:"5px 13px",fontSize:12.5,fontFamily:SANS}}>{Number(book.pages).toLocaleString()} pages</span>}
          </div>
          {book.rating>0&&(
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:14}}>
              <StarRating value={book.rating} readonly size={22}/>
              <span style={{fontSize:13,color:T.goldDeep,fontStyle:"italic",fontFamily:SANS}}>{ratingTextTen(book.rating)} · {ratingLabel(book.rating)}</span>
            </div>
          )}
          <div style={{display:"flex",gap:16,fontSize:12.5,color:T.inkMuted,flexWrap:"wrap",marginBottom:20,fontFamily:SANS}}>
            <span>Started {fmt(book.dateStarted)}</span>
            {book.dateFinished&&<span>· Finished {fmt(book.dateFinished)}</span>}
            {days!==null&&<span>· {days} day{days!==1?"s":""}</span>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={onEdit} variant="ghost">Edit details</Btn>
            <Btn onClick={onDelete} variant="danger">Remove</Btn>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,borderBottom:`2px solid ${T.border}`,marginBottom:26,position:"relative"}}>
        {["overview","reviews","journal"].map(t=>{
          const active=tab===t;
          const count=t==="reviews"?book.reviews?.length:t==="journal"?book.journal?.length:0;
          return (
            <button key={t} onClick={()=>setTab(t)} style={{background:"none",border:"none",color:active?T.gold:T.inkMuted,padding:"11px 22px",cursor:"pointer",fontSize:13.5,fontWeight:active?600:500,textTransform:"capitalize",fontFamily:SANS,letterSpacing:.2,position:"relative",transition:"color .2s"}}>
              {t}{count?` · ${count}`:""}
              <span style={{position:"absolute",left:0,right:0,bottom:-2,height:2,background:T.gold,transform:active?"scaleX(1)":"scaleX(0)",transition:"transform .25s cubic-bezier(.2,.8,.2,1)"}}/>
            </button>
          );
        })}
      </div>

      <div key={tab} style={{animation:"fadeIn .3s ease"}}>
        {/* Overview */}
        {tab==="overview"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:11,marginBottom:26}}>
              {[
                {icon:"📖",label:"Status",value:book.status,color:m.color},
                {icon:"★",label:"Rating",value:book.rating?ratingTextTen(book.rating):"Not rated",color:T.gold},
                {icon:"✍",label:"Reviews",value:book.reviews?.length||0,color:T.sageDeep},
                {icon:"📓",label:"Journal entries",value:book.journal?.length||0,color:T.plumDeep},
                {icon:"📄",label:"Pages",value:book.pages?Number(book.pages).toLocaleString():"—",color:T.inkSoft},
                {icon:"⏱",label:"Days reading",value:days!==null?days:"—",color:T.inkSoft},
              ].map(({icon,label,value,color})=>(
                <div key={label} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"17px 19px",boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
                  <div style={{fontSize:19,marginBottom:7,color}}>{icon}</div>
                  <div style={{fontSize:18,fontWeight:600,color:T.ink,marginBottom:3,fontFamily:SERIF}}>{value}</div>
                  <div style={{fontSize:11.5,color:T.inkMuted,fontFamily:SANS}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <button onClick={onAddReview} style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"18px",cursor:"pointer",fontFamily:SANS,textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"border-color .18s, transform .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.sage;e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
                <span style={{fontSize:26}}>✍️</span>
                <div><div style={{fontWeight:600,color:T.ink,fontSize:14}}>Write a review</div><div style={{fontSize:12,color:T.inkMuted,marginTop:2}}>Share what you thought</div></div>
              </button>
              <button onClick={onAddJournal} style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"18px",cursor:"pointer",fontFamily:SANS,textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"border-color .18s, transform .12s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.plum;e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
                <span style={{fontSize:26}}>📓</span>
                <div><div style={{fontWeight:600,color:T.ink,fontSize:14}}>Add a journal entry</div><div style={{fontSize:12,color:T.inkMuted,marginTop:2}}>Thoughts, feelings, passages</div></div>
              </button>
            </div>
          </div>
        )}

        {/* Reviews */}
        {tab==="reviews"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <span style={{fontSize:13.5,color:T.inkSoft,fontFamily:SANS}}>{book.reviews?.length||0} review{(book.reviews?.length||0)!==1?"s":""}</span>
              <Btn onClick={onAddReview} variant="sage">+ Write review</Btn>
            </div>
            {!book.reviews?.length&&<Empty icon="✍️" title="No reviews yet" sub="Your thoughts on this book deserve a home."/>}
            {book.reviews?.map((r,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:22,marginBottom:13,boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:13}}>
                  <div>
                    <StarRating value={r.rating} readonly size={17}/>
                    <div style={{fontSize:11.5,color:T.inkMuted,marginTop:6,fontFamily:SANS}}>{ratingTextTen(r.rating)} · {new Date(r.date).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    {r.spoiler&&<span style={{background:"#FBEAE2",border:`1px solid ${T.terra}60`,borderRadius:7,color:T.terraDeep,padding:"3px 9px",fontSize:10,fontWeight:600,fontFamily:SANS}}>SPOILERS</span>}
                    <button onClick={()=>onEditReview(i)} style={{background:"none",border:"none",color:T.inkMuted,cursor:"pointer",fontSize:12.5,fontFamily:SANS}}>Edit</button>
                    <button onClick={()=>onDeleteReview(i)} style={{background:"none",border:"none",color:T.terra,cursor:"pointer",fontSize:12.5,fontFamily:SANS}}>Delete</button>
                  </div>
                </div>
                {r.spoiler&&!reveal[i]?(
                  <div style={{background:T.cream,border:`1px solid ${T.border}`,borderRadius:10,padding:16,textAlign:"center"}}>
                    <div style={{color:T.inkSoft,fontSize:12.5,marginBottom:9,fontFamily:SANS}}>This review contains spoilers</div>
                    <button onClick={()=>setReveal(s=>({...s,[i]:true}))} style={{background:T.surface,border:`1px solid ${T.borderHi}`,borderRadius:8,color:T.terraDeep,padding:"6px 16px",cursor:"pointer",fontSize:12,fontFamily:SANS}}>Show anyway</button>
                  </div>
                ):(
                  <p style={{margin:0,color:T.ink,fontSize:14.5,lineHeight:1.85,whiteSpace:"pre-wrap",fontFamily:SERIF}}>{r.text}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Journal */}
        {tab==="journal"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <span style={{fontSize:13.5,color:T.inkSoft,fontFamily:SANS}}>{book.journal?.length||0} entr{(book.journal?.length||0)!==1?"ies":"y"}</span>
              <Btn onClick={onAddJournal} variant="plum">+ Add entry</Btn>
            </div>
            {!book.journal?.length&&<Empty icon="📓" title="Your journal is empty" sub="Capture a passage, a feeling, a question the book left open."/>}
            {book.journal?.map((j,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderLeft:`3px solid ${T.plum}`,borderRadius:16,padding:22,marginBottom:13,boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                  <div>
                    {j.title&&<div style={{fontWeight:600,color:T.ink,fontSize:15,marginBottom:4,fontFamily:SERIF}}>{j.title}</div>}
                    <div style={{fontSize:11.5,color:T.inkMuted,display:"flex",alignItems:"center",gap:8,fontFamily:SANS}}>
                      {j.mood&&<span style={{fontSize:18}}>{j.mood}</span>}
                      {new Date(j.date).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:9}}>
                    <button onClick={()=>onEditJournal(i)} style={{background:"none",border:"none",color:T.inkMuted,cursor:"pointer",fontSize:12.5,fontFamily:SANS}}>Edit</button>
                    <button onClick={()=>onDeleteJournal(i)} style={{background:"none",border:"none",color:T.terra,cursor:"pointer",fontSize:12.5,fontFamily:SANS}}>Delete</button>
                  </div>
                </div>
                <p style={{margin:0,color:T.ink,fontSize:14.5,lineHeight:1.9,whiteSpace:"pre-wrap",fontFamily:SERIF}}>{j.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────
function StatsView({books}){
  const finished=books.filter(b=>b.status==="Finished");
  const rated=books.filter(b=>b.rating>0);
  const avg=rated.length?(rated.reduce((s,b)=>s+b.rating,0)/rated.length).toFixed(1):"—";
  const pages=books.reduce((s,b)=>s+(parseInt(b.pages)||0),0);
  const byGenre={};books.forEach(b=>{byGenre[b.genre]=(byGenre[b.genre]||0)+1;});
  const topGenres=Object.entries(byGenre).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxG=topGenres[0]?.[1]||1;
  // group rating into 5 buckets (1-2,3-4,5-6,7-8,9-10)
  const buckets=[{l:"9–10 ★",lo:9,hi:10},{l:"7–8 ★",lo:7,hi:8},{l:"5–6 ★",lo:5,hi:6},{l:"3–4 ★",lo:3,hi:4},{l:"1–2 ★",lo:1,hi:2}];
  const byBucket=buckets.map(b=>({...b,n:rated.filter(x=>x.rating>=b.lo&&x.rating<=b.hi).length}));
  const recent=[...finished].sort((a,b)=>new Date(b.dateFinished||0)-new Date(a.dateFinished||0)).slice(0,4);
  if(!books.length) return <div style={{animation:"fadeUp .4s ease"}}><Empty icon="📊" title="No stats yet" sub="Add some books to see your reading life take shape."/></div>;
  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <h2 style={{margin:"0 0 24px",fontSize:26,color:T.ink,fontFamily:SERIF,fontWeight:600,letterSpacing:-.4}}>Your reading life</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24}}>
        {[
          {label:"Books finished",value:finished.length,icon:"✓",color:T.sageDeep},
          {label:"Currently reading",value:books.filter(b=>b.status==="Reading").length,icon:"📖",color:T.blueDeep},
          {label:"Want to read",value:books.filter(b=>b.status==="Want to Read").length,icon:"🔖",color:T.terraDeep},
          {label:"Average rating",value:rated.length?`${avg}/10`:"—",icon:"★",color:T.goldDeep},
          {label:"Pages read",value:pages.toLocaleString(),icon:"📄",color:T.inkSoft},
          {label:"Reviews written",value:books.reduce((s,b)=>s+(b.reviews?.length||0),0),icon:"✍",color:T.plumDeep},
        ].map(({label,value,icon,color})=>(
          <div key={label} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"22px 24px",boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
            <div style={{fontSize:21,color,marginBottom:9}}>{icon}</div>
            <div style={{fontSize:30,fontWeight:600,color:T.ink,lineHeight:1,marginBottom:6,fontFamily:SERIF}}>{value}</div>
            <div style={{fontSize:12,color:T.inkMuted,fontFamily:SANS}}>{label}</div>
          </div>
        ))}
      </div>
      {rated.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24,marginBottom:12,boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
          <h3 style={{margin:"0 0 18px",fontSize:13,color:T.inkSoft,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",fontFamily:SANS}}>Ratings breakdown</h3>
          {byBucket.map(({l,n})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
              <span style={{fontSize:12,color:T.inkSoft,width:64,flexShrink:0,fontFamily:SANS}}>{l}</span>
              <div style={{flex:1,background:T.cream,borderRadius:5,height:9,overflow:"hidden"}}>
                <div style={{background:`linear-gradient(90deg,${T.goldLt},${T.gold})`,height:"100%",width:rated.length?`${(n/rated.length)*100}%`:"0%",borderRadius:5,transition:"width .6s cubic-bezier(.2,.8,.2,1)"}}/>
              </div>
              <span style={{fontSize:12,color:T.inkMuted,minWidth:18,textAlign:"right",fontFamily:SANS}}>{n}</span>
            </div>
          ))}
        </div>
      )}
      {topGenres.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24,marginBottom:12,boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
          <h3 style={{margin:"0 0 18px",fontSize:13,color:T.inkSoft,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",fontFamily:SANS}}>Top genres</h3>
          {topGenres.map(([g,n])=>(
            <div key={g} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
              <span style={{fontSize:12,color:T.ink,width:96,flexShrink:0,fontFamily:SANS}}>{g}</span>
              <div style={{flex:1,background:T.cream,borderRadius:5,height:9,overflow:"hidden"}}>
                <div style={{background:`linear-gradient(90deg,${T.plum},${T.plumDeep})`,height:"100%",width:`${(n/maxG)*100}%`,borderRadius:5,transition:"width .6s cubic-bezier(.2,.8,.2,1)"}}/>
              </div>
              <span style={{fontSize:12,color:T.inkMuted,minWidth:18,textAlign:"right",fontFamily:SANS}}>{n}</span>
            </div>
          ))}
        </div>
      )}
      {recent.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:24,boxShadow:"0 1px 3px rgba(60,40,20,.04)"}}>
          <h3 style={{margin:"0 0 16px",fontSize:13,color:T.inkSoft,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",fontFamily:SANS}}>Recently finished</h3>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
            {recent.map(b=>(
              <div key={b.id} style={{display:"flex",gap:13,alignItems:"center"}}>
                <Cover book={b} size="sm"/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,color:T.ink,fontWeight:600,lineHeight:1.3,fontFamily:SERIF}}>{b.title}</div>
                  <div style={{fontSize:11.5,color:T.inkSoft,marginTop:2,marginBottom:5,fontFamily:SANS,fontStyle:"italic"}}>{b.author}</div>
                  {b.rating>0&&<StarRating value={b.rating} readonly size={12}/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────
export default function App(){
  useFonts();
  const [books,setBooks]=useState([]);
  const [ready,setReady]=useState(false);
  const [page,setPage]=useState("shelf");
  const [selId,setSelId]=useState(null);
  const [modal,setModal]=useState(null);
  const [editIdx,setEditIdx]=useState(null);
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("recent");
  const [toast,setToast]=useState(null);

  useEffect(()=>{load("rlj_books_v3").then(d=>{if(d)setBooks(d);setReady(true);});},[]);
  useEffect(()=>{if(ready)save("rlj_books_v3",books);},[books,ready]);

  const notify=msg=>{setToast(msg);setTimeout(()=>setToast(null),2200);};
  const sel=books.find(b=>b.id===selId);

  const addBook=f=>{setBooks(p=>[{...f,id:Date.now()+"",reviews:[],journal:[],addedAt:new Date().toISOString()},...p]);setModal(null);notify(`"${f.title}" added`);};
  const editBook=f=>{setBooks(p=>p.map(b=>b.id===selId?{...b,...f}:b));setModal(null);notify("Book updated");};
  const delBook=()=>{if(!confirm("Remove this book?"))return;setBooks(p=>p.filter(b=>b.id!==selId));setSelId(null);setPage("shelf");notify("Book removed");};
  const addReview=r=>{setBooks(p=>p.map(b=>b.id===selId?{...b,rating:r.rating||b.rating,reviews:[...(b.reviews||[]),r]}:b));setModal(null);notify("Review saved");};
  const editReview=(i,r)=>{setBooks(p=>p.map(b=>b.id===selId?{...b,reviews:b.reviews.map((x,j)=>j===i?r:x)}:b));setModal(null);notify("Review updated");};
  const delReview=i=>{setBooks(p=>p.map(b=>b.id===selId?{...b,reviews:b.reviews.filter((_,j)=>j!==i)}:b));notify("Review deleted");};
  const addJournal=e=>{setBooks(p=>p.map(b=>b.id===selId?{...b,journal:[...(b.journal||[]),e]}:b));setModal(null);notify("Entry saved");};
  const editJournal=(i,e)=>{setBooks(p=>p.map(b=>b.id===selId?{...b,journal:b.journal.map((x,j)=>j===i?e:x)}:b));setModal(null);notify("Entry updated");};
  const delJournal=i=>{setBooks(p=>p.map(b=>b.id===selId?{...b,journal:b.journal.filter((_,j)=>j!==i)}:b));notify("Entry deleted");};

  const visible=books
    .filter(b=>filter==="All"||b.status===filter)
    .filter(b=>!search||b.title.toLowerCase().includes(search.toLowerCase())||b.author.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sort==="recent")return new Date(b.addedAt)-new Date(a.addedAt);
      if(sort==="title")return a.title.localeCompare(b.title);
      if(sort==="author")return a.author.localeCompare(b.author);
      if(sort==="rating")return (b.rating||0)-(a.rating||0);
      return 0;
    });

  if(!ready) return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:T.inkMuted,fontFamily:SERIF,fontSize:16,letterSpacing:.5}}>Opening your library…</div>;

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(180deg,${T.bgWarm},${T.bg})`,color:T.ink,fontFamily:SANS}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        ::selection{background:${T.gold}40}
        *{scrollbar-width:thin;scrollbar-color:${T.borderHi} transparent}
        input::placeholder,textarea::placeholder{color:${T.inkMuted};opacity:.7}
      `}</style>

      {/* HEADER */}
      <header style={{background:`${T.bg}E0`,borderBottom:`1px solid ${T.border}`,padding:"0 24px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
        <div style={{maxWidth:920,margin:"0 auto",display:"flex",alignItems:"center",height:64,gap:8}}>
          <span style={{fontFamily:SERIF,fontSize:21,fontWeight:600,color:T.goldDeep,letterSpacing:-.2,flexShrink:0}}>My Reading Journal</span>
          <div style={{flex:1}}/>
          <nav style={{display:"flex",gap:2,marginRight:4}}>
            {[{id:"shelf",label:"Shelf"},{id:"stats",label:"Stats"}].map(({id,label})=>{
              const active=page===id&&!selId;
              return (
                <button key={id} onClick={()=>{setPage(id);setSelId(null);}} style={{background:active?T.cream:"none",border:"none",color:active?T.goldDeep:T.inkSoft,padding:"7px 17px",cursor:"pointer",fontSize:13.5,fontFamily:SANS,fontWeight:active?600:500,borderRadius:9,transition:"all .18s",letterSpacing:.2}}>{label}</button>
              );
            })}
          </nav>
          <button onClick={()=>setModal("pwa")} style={{background:"none",border:`1.5px solid ${T.border}`,borderRadius:9,color:T.inkSoft,padding:"7px 14px",cursor:"pointer",fontSize:12.5,fontFamily:SANS}} title="Install as app">⊕ Install</button>
          <button onClick={()=>setModal("addBook")} style={{background:`linear-gradient(135deg,${T.goldDeep},${T.gold})`,border:"none",borderRadius:10,color:"#FFFDF6",padding:"8px 18px",cursor:"pointer",fontSize:13.5,fontWeight:600,fontFamily:SANS,letterSpacing:.2,flexShrink:0,boxShadow:`0 4px 14px ${T.gold}40`}}>+ Add book</button>
        </div>
      </header>

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:76,left:"50%",transform:"translateX(-50%)",background:T.ink,color:T.bg,borderRadius:10,padding:"11px 22px",fontSize:13,fontWeight:500,zIndex:9999,boxShadow:"0 8px 32px rgba(40,30,20,.3)",whiteSpace:"nowrap",fontFamily:SANS,animation:"fadeUp .25s ease"}}>{toast}</div>}

      {/* BODY */}
      <main style={{maxWidth:920,margin:"0 auto",padding:"32px 24px"}}>
        {selId&&sel&&(
          <BookDetail book={sel} onEdit={()=>setModal("editBook")} onDelete={delBook}
            onAddReview={()=>setModal("addReview")} onEditReview={i=>{setEditIdx(i);setModal("editReview");}} onDeleteReview={delReview}
            onAddJournal={()=>setModal("addJournal")} onEditJournal={i=>{setEditIdx(i);setModal("editJournal");}} onDeleteJournal={delJournal}
            onBack={()=>{setSelId(null);setPage("shelf");}}/>
        )}
        {!selId&&page==="stats"&&<StatsView books={books}/>}
        {!selId&&page==="shelf"&&(
          <div style={{animation:"fadeUp .4s ease"}}>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:200}}>
                <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.inkMuted,fontSize:15,pointerEvents:"none"}}>⌕</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} onFocus={e=>focusable(e,1)} onBlur={e=>focusable(e,0)} placeholder="Search by title or author…" style={{...inp,paddingLeft:36,background:T.surface}}/>
              </div>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{...inp,width:"auto",background:T.surface,cursor:"pointer"}}>
                <option value="recent">Recently added</option>
                <option value="title">Title A–Z</option>
                <option value="author">Author A–Z</option>
                <option value="rating">Highest rated</option>
              </select>
            </div>
            <div style={{display:"flex",gap:7,marginBottom:26,flexWrap:"wrap"}}>
              {["All",...STATUSES].map(s=>{
                const me=STATUS_META[s];
                const n=s==="All"?books.length:books.filter(b=>b.status===s).length;
                const active=filter===s;
                return (
                  <button key={s} onClick={()=>setFilter(s)} style={{background:active?(me?me.bg:T.cream):T.surface,border:`1.5px solid ${active?(me?me.dot:T.gold):T.border}`,borderRadius:20,color:active?(me?me.color:T.goldDeep):T.inkSoft,padding:"6px 16px",cursor:"pointer",fontSize:12.5,fontFamily:SANS,fontWeight:active?600:500,transition:"all .18s"}}>{s} <span style={{opacity:.6}}>·{n}</span></button>
                );
              })}
            </div>
            {books.length===0&&(
              <Empty icon="📚" title="Your shelf awaits" sub="Add the book you're reading now, the one you just finished, or the one that's been on your list for years."
                action={<Btn onClick={()=>setModal("addBook")} variant="primary">Add your first book</Btn>}/>
            )}
            {books.length>0&&visible.length===0&&<Empty icon="⌕" title="No matches" sub="Try a different search term or filter."/>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:13}}>
              {visible.map((book,idx)=>{
                const me=STATUS_META[book.status]||STATUS_META["Want to Read"];
                return (
                  <div key={book.id} onClick={()=>{setSelId(book.id);setPage("detail");}}
                    style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:17,cursor:"pointer",display:"flex",gap:17,alignItems:"flex-start",transition:"border-color .18s, box-shadow .2s, transform .12s",boxShadow:"0 1px 3px rgba(60,40,20,.04)",animation:`fadeUp .4s ease ${Math.min(idx*0.04,0.4)}s both`}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.boxShadow="0 8px 28px rgba(60,40,20,.12)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow="0 1px 3px rgba(60,40,20,.04)";e.currentTarget.style.transform="";}}>
                    <Cover book={book} size="md"/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:15,color:T.ink,lineHeight:1.3,marginBottom:3,fontFamily:SERIF}}>{book.title}</div>
                      <div style={{fontSize:12.5,color:T.inkSoft,marginBottom:11,fontStyle:"italic",fontFamily:SERIF}}>{book.author}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:11}}>
                        <span style={{background:me.bg,color:me.color,borderRadius:12,padding:"3px 11px",fontSize:11,fontWeight:600,fontFamily:SANS}}>{book.status}</span>
                        <span style={{background:T.cream,border:`1px solid ${T.border}`,color:T.inkMuted,borderRadius:12,padding:"3px 10px",fontSize:11,fontFamily:SANS}}>{book.genre}</span>
                      </div>
                      {book.rating>0&&<StarRating value={book.rating} readonly size={14}/>}
                      <div style={{display:"flex",gap:13,marginTop:9,fontSize:11.5,color:T.inkMuted,fontFamily:SANS}}>
                        {book.reviews?.length>0&&<span>✍ {book.reviews.length}</span>}
                        {book.journal?.length>0&&<span>📓 {book.journal.length}</span>}
                        {book.pages&&<span>{Number(book.pages).toLocaleString()}p</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {modal==="addBook"    &&<Modal onClose={()=>setModal(null)}><BookForm onSave={addBook} onClose={()=>setModal(null)}/></Modal>}
      {modal==="editBook"   &&sel&&<Modal onClose={()=>setModal(null)}><BookForm initial={sel} onSave={editBook} onClose={()=>setModal(null)}/></Modal>}
      {modal==="addReview"  &&sel&&<Modal onClose={()=>setModal(null)}><ReviewForm book={sel} onSave={addReview} onClose={()=>setModal(null)}/></Modal>}
      {modal==="editReview" &&sel&&editIdx!==null&&<Modal onClose={()=>setModal(null)}><ReviewForm book={sel} initial={sel.reviews[editIdx]} onSave={r=>editReview(editIdx,r)} onClose={()=>setModal(null)}/></Modal>}
      {modal==="addJournal" &&sel&&<Modal onClose={()=>setModal(null)}><JournalForm book={sel} onSave={addJournal} onClose={()=>setModal(null)}/></Modal>}
      {modal==="editJournal"&&sel&&editIdx!==null&&<Modal onClose={()=>setModal(null)}><JournalForm book={sel} initial={sel.journal[editIdx]} onSave={e=>editJournal(editIdx,e)} onClose={()=>setModal(null)}/></Modal>}
      {modal==="pwa"        &&<Modal onClose={()=>setModal(null)} width={520}><PWAGuide onClose={()=>setModal(null)}/></Modal>}
    </div>
  );
}
