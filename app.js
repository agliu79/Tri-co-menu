/* ================= reference lists ================= */
const COLLEGES={B:{name:"Bryn Mawr",mono:"BMC",domain:"brynmawr.edu",color:"#4a2c82"},H:{name:"Haverford",mono:"HC",domain:"haverford.edu",color:"#8b1a1a"},S:{name:"Swarthmore",mono:"SC",domain:"swarthmore.edu",color:"#7a1f3d"}};
const DIETS=[{k:"vegetarian",label:"Vegetarian"},{k:"vegan",label:"Vegan"},{k:"halal",label:"Halal"},{k:"kosher",label:"Kosher"},{k:"keto",label:"Keto",unpub:true},{k:"gluten-free",label:"Gluten-free"},{k:"low-carb",label:"Low-carb",unpub:true},{k:"low-sugar",label:"Low-sugar",unpub:true}];
const ALLERGENS=[{k:"milk",label:"Milk"},{k:"egg",label:"Egg"},{k:"wheat",label:"Wheat"},{k:"soy",label:"Soy"},{k:"peanut",label:"Peanuts"},{k:"treenut",label:"Tree nuts"},{k:"fish",label:"Fish"},{k:"shellfish",label:"Shellfish"},{k:"sesame",label:"Sesame"}];
const CUISINES=[["mediterranean","Mediterranean"],["italian","Italian"],["chinese","Chinese"],["korean","Korean"],["japanese","Japanese"],["thai","Thai"],["vietnamese","Vietnamese"],["american","American"],["plant-based","Plant-based"],["mexican","Mexican"],["indian","Indian"],["middle-eastern","Middle Eastern"]].map(([k,label])=>({k,label}));
const GOALS=[{k:"weight",label:"Weight loss",hint:"Lighter option"},{k:"muscle",label:"Muscle building",hint:"Protein-forward"},{k:"recomp",label:"Body recomposition",hint:"Lean protein"},{k:"cardio",label:"Cardiovascular health",hint:"Heart-friendly"},{k:"micro",label:"Micronutrient sufficiency",hint:"Veg-packed"},{k:"fibre",label:"More fibre",hint:"Fibre-rich"}];
const CATS=["Breakfast","Entrées","Grill & Deli","Pizza & Pasta","Soups & Chili","Salads","Sides","Desserts & Bakery"];
const MEALS={breakfast:"Breakfast",brunch:"Brunch",lunch:"Lunch",midday:"Mid-Day Munches",dinner:"Dinner",fifth:"5th Meal"};
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const HALL=Object.fromEntries(DATA.halls.map(h=>[h.id,h]));
const D=DATA.dishes;
const HEART=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.1 4.5 5.8 4c2.2-.3 4 .8 6.2 3.1C14.2 4.8 16 3.7 18.2 4c3.7.5 5.5 4.4 3.8 7.7C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>`;
const HEART_O=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.4 2.1 4.5 5.8 4c2.2-.3 4 .8 6.2 3.1C14.2 4.8 16 3.7 18.2 4c3.7.5 5.5 4.4 3.8 7.7C19.5 16.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

/* ================= local storage (safe) ================= */
const mem={};
const local={get(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):(mem[k]??null)}catch(e){return mem[k]??null}},
 set(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){delete mem[k];try{localStorage.removeItem(k)}catch(e){}}};

/* ================= moderation ================= */
// Blocked words. "!" = match the exact word only (no plurals or -ing forms), because the inflected form is an innocent word (spicing, cumin).
const BAD_BASE=["fuck","fucker","motherfucker","shit","bullshit","shithead","bitch","bastard","asshole","ass","arse","cunt","dick","dickhead","cock","pussy","twat","wank","wanker","whore","slut","skank","piss","jizz","dildo","porn","nude","boobs","penis","vagina","blowjob","handjob","cumshot","milf","rape","rapist","retard","nigger","nigga","faggot","fag","dyke","tranny","kike","chink","gook","coon","beaner","wetback","raghead","towelhead","nazi","kys","cuck","douche","bollocks","!spic","!cum","!tits"];
const BAD_SUB=["fuck","nigger","nigga","faggot","cunt","whore","bitch","slut","dildo","porn","rapist","retard","blowjob","motherf"];
const BAD_SET=(()=>{const set=new Set();const suf=["","s","es","ed","er","ers","ing","in","y","ty","head","face","hole"];
 for(const w of BAD_BASE){if(w[0]==="!"){set.add(w.slice(1));continue;}suf.forEach(x=>set.add(w+x));}return set;})();
const LEET={"0":"o","1":"i","!":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b","9":"g","|":"i","(":"c","¢":"c","€":"e"};
function normTok(t){t=t.normalize("NFKD").replace(/[̀-ͯ​-‏⁠﻿]/g,"").toLowerCase();return t.split("").map(c=>LEET[c]||c).join("").replace(/[^a-z]/g,"");}
function tokBad(raw){const t=normTok(raw);if(!t)return false;const t2=t.replace(/(.)\1{2,}/g,"$1$1"),t1=t.replace(/(.)\1+/g,"$1");
 if(BAD_SET.has(t)||BAD_SET.has(t2)||BAD_SET.has(t1))return true;return BAD_SUB.some(w=>t2.includes(w));}
// Returns true if the text contains a blocked word, including s p a c e d or d.o.t.t.e.d out spellings.
function hasBad(text){const s=String(text||"");const toks=s.split(/[\s_\-.,;:/\\*'"`~^()[\]{}<>]+/).filter(Boolean);
 if(toks.some(tokBad))return true;
 let run="";for(const t of [...toks,"  "]){const n=normTok(t);if(n.length===1)run+=n;else{if(run.length>=3&&tokBad(run))return true;run="";}}
 return false;}
// Masks blocked words in other people's text when it is shown (in case something got around the check).
function clean(text){return String(text??"").replace(/\S+/g,w=>tokBad(w)?w[0]+"*".repeat(Math.max(2,w.length-1)):w);}
const MOD_MSG="Please keep it friendly. That contains a word that isn't allowed here.";
const REPORT_HIDE=2;// hidden for everyone once this many different people report it

/* ================= Supabase backend (GitHub Pages / any host) =================
   Turned on by config.js: window.EATMAXXING_CONFIG={supabaseUrl,supabaseKey,guestEmails}.
   It plugs into Shared with the same small interface the Claude artifact database uses. */
const CFG=(typeof window!=="undefined"&&window.EATMAXXING_CONFIG)||{};
const SUPA_ON=!!(CFG.supabaseUrl&&CFG.supabaseKey);
let sbClient=null;
function loadSupabase(){if(sbClient)return Promise.resolve(sbClient);
 return new Promise((res,rej)=>{const go=()=>{try{sbClient=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true}});res(sbClient);}catch(e){rej(e);}};
  if(window.supabase?.createClient)return go();
  const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";s.onload=go;s.onerror=()=>rej(new Error("Couldn't load Supabase"));document.head.appendChild(s);});}
function supaDb(sb,uid){
 const docs={};let listener=null;const emit=()=>listener&&listener({docs:Object.entries(docs).map(([id,d])=>({id,exists:true,data:()=>d}))});
 return{
  collection(){return{
   doc(id){return{async set(body){
     const q=id===uid?sb.from("contrib").upsert({uid:id,doc:body,updated_at:new Date().toISOString()}):sb.from("contrib").update({doc:body,updated_at:new Date().toISOString()}).eq("uid",id);
     const {error}=await q;if(error)throw Object.assign(new Error(error.message),{code:id===uid?"save_failed":"invalid_argument"});
     docs[id]=JSON.parse(JSON.stringify(body));emit();}};},
   onSnapshot(cb,onErr){listener=cb;
    sb.from("contrib").select("uid,doc").then(({data,error})=>{if(error){onErr&&onErr(error);return;}(data||[]).forEach(r=>docs[r.uid]=r.doc);emit();});
    sb.channel("contrib-live").on("postgres_changes",{event:"*",schema:"public",table:"contrib"},p=>{if(p.eventType==="DELETE")delete docs[p.old.uid];else if(p.new?.uid)docs[p.new.uid]=p.new.doc;emit();}).subscribe();
    return()=>{};}};},
  doc(path){const key=path.split("/").pop();return{
   async set(v){const {error}=await sb.from("private_docs").upsert({uid,key,doc:v,updated_at:new Date().toISOString()});if(error)throw error;},
   async get(){const {data}=await sb.from("private_docs").select("doc").eq("uid",uid).eq("key",key).maybeSingle();return data?.doc??null;},
   onSnapshot(cb,onErr){sb.from("private_docs").select("doc").eq("uid",uid).eq("key",key).maybeSingle().then(({data,error})=>{if(error){onErr&&onErr(error);return;}cb({exists:!!data,data:()=>data?.doc});});return()=>{};}};}
 };}
const PHOTO_URL=()=>CFG.supabaseUrl?CFG.supabaseUrl.replace(/\/$/,"")+"/storage/v1/object/public/photos/":"\u0000";
function supaAssets(sb,uid){return{
 async upload(file){const path=`${uid}/${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}.jpg`;
  const {error}=await sb.storage.from("photos").upload(path,file,{contentType:"image/jpeg",upsert:false});if(error)throw error;
  return{url:PHOTO_URL()+path,path};},
 async delete(path){await sb.storage.from("photos").remove([path]);}};}
async function sendCode(email,opts={}){const sb=await loadSupabase();const create=opts.create!==false;
 const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:create}});
 if(error){const m=error.message||"";
  if(!create&&/signups? not allowed|not found|no user|user does not exist/i.test(m))throw Object.assign(new Error("No account"),{noAccount:true});
  if(/database error|saving new user/i.test(m))throw new Error("Only Bryn Mawr, Haverford and Swarthmore students can join.");
  if(/not authorized/i.test(m))throw new Error("The site can't email this address yet. The site owner needs to set up email sending (custom SMTP) in Supabase.");
  if(/rate limit|security purposes|only request this/i.test(m))throw new Error("Too many codes requested. Wait a minute and try again.");
  throw new Error(m||"Couldn't send the code.");}}
async function verifyCode(email,token){const sb=await loadSupabase();
 const {data,error}=await sb.auth.verifyOtp({email,token,type:"email"});
 if(error)throw new Error(/expired|invalid/i.test(error.message)?"That code is wrong or has expired. Check it, or send a new one.":error.message);return data.session;}
async function saveProfile(){if(!S.user)return;rememberAccount();if(Shared.mode!=="shared"||!Shared.db)return;try{await Shared.db.doc("data/users/"+Shared.uid+"/profile").set(S.user);}catch(e){}}
function renderVerify(){const d=S.draft;
 $("#app").innerHTML=`<div class="shell"><div class="panel" id="reg"><div class="wordmark">${WORDMARK}</div>
  <div class="kicker">Check your email</div><h1 style="font-size:28px;margin-top:6px">Enter your code</h1>
  <p class="sub">We sent a sign-in code to <b>${esc(d.email)}</b>. It can take a minute, so check spam too.</p>
  <label class="f" for="code">8-digit code</label><input class="inp" id="code" type="text" inputmode="numeric" pattern="[0-9]{8}" autocomplete="one-time-code" maxlength="8" placeholder="12345678" aria-describedby="err" style="font-size:22px;letter-spacing:.2em">
  <div class="err" id="err"></div><button class="btn full" id="vgo">Verify</button>
  <p class="verify"><button class="linkbtn" id="resend">Send a new code</button> · <button class="linkbtn" id="chg">Use a different email</button></p></div></div>`;
 const inp=$("#code");inp.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")go();});setTimeout(()=>inp.focus(),50);
 inp.oninput=()=>{inp.value=inp.value.replace(/\D/g,"").slice(0,8);$("#err").textContent="";if(inp.value.length===8)go();};
 $("#vgo").onclick=go;
 $("#resend").onclick=async()=>{try{await sendCode(d.email,{create:d.mode!=="login"});toast("New code sent");}catch(e){$("#err").textContent=e.message;}};
 $("#chg").onclick=()=>{S.view=null;S.authMode=d.mode||"signup";render();};
 async function go(){if($("#vgo").disabled)return;const t=inp.value.trim();if(!/^\d{8}$/.test(t)){$("#err").textContent="Enter the 8-digit code from the email.";return;}
  $("#vgo").disabled=true;$("#err").textContent="";
  try{await verifyCode(d.email,t);await Shared.init();
   const prof=await getProfileDoc();
   const pend=S.pendingUser&&S.pendingUser.email===d.email?S.pendingUser:null;
   const back=prof&&prof.email===d.email?prof:pend;
   if(back){const was=d.mode==="signup";finishLogin({...back,email:d.email},was?`You already had an account, so we logged you in as ${back.name}.`:null);await saveProfile();await Shared.saveMine(Shared.mine());}
   else if(d.mode==="login"||!d.name){S.authMode="complete";S.view=null;S.draft={...d,name:""};render();}
   else{S.view="survey";S.step=0;render();}}
  catch(e){$("#err").textContent=e.message;$("#vgo").disabled=false;}}
}

/* ================= shared data =================
   contrib/<uid> = {name, college,
     reviews:{dishId:{stars,text,ts,photos:[{id|data,ts}]}},
     posts:{postId:{photo:{id|data},title,caption,college,ts}},
     likes:{"<uid>~<postId>":true}, comments:{"<uid>~<postId>":[{text,ts}]}}
   Everyone reads all docs; each person writes only their own (the site owner can edit any).
   Favorites live privately at data/users/<uid>/prefs. */
const Shared={mode:"local",uid:"local",db:null,assets:null,docs:{},canWrite:true,isOwner:false,favs:new Set(local.get("tce_favs")||[]),
 mine(){const m=this.docs[this.uid]||{};return JSON.parse(JSON.stringify({reviews:{},posts:{},likes:{},comments:{},reports:{},...m}));},
 async init(){
   this.docs={local:local.get("tce_contrib")||{}};
   try{
     let db,assets,id;
     if(SUPA_ON){
       const sb=await loadSupabase();const {data}=await sb.auth.getSession();const sess=data?.session;
       if(!sess){this.mode="signedout";if(S.user){S.pendingUser=S.user;S.draft={name:S.user.name,email:S.user.email};S.user=null;S.view=null;S.authMode="login";S.signinNote="Log in again with your school email to continue.";render();}return;}
       id=sess.user.id;db=supaDb(sb,id);assets=supaAssets(sb,id);this.backend="supabase";
       try{const r=await sb.rpc("is_admin");this.isOwner=!!r.data;}catch(e){}
       if(S.user&&sess.user.email&&S.user.email!==sess.user.email){S.user={...S.user,email:sess.user.email};local.set("tce_user",S.user);}
       this.db=db;this.assets=assets;this.uid=id;this.mode="shared";this.docs={};
     }else{
     if(!window.claude||!claude.use)return;
     const [cdb,user,cassets]=await Promise.all([claude.use("db"),claude.use("user"),claude.use("assets")]);
     id=user?await user.id():null;db=cdb;assets=cassets;
     if(!db||!id)return;
     this.db=db;this.assets=assets;this.uid=id;this.mode="shared";this.docs={};this.backend="claude";
     try{if(await user.can("data.write")===false)this.canWrite=false;}catch(e){}
     try{this.isOwner=!!(await user.isOwner());}catch(e){}
     }
     let timer=setTimeout(()=>{S.sharedNote="Reviews are still loading…";rerender();},10000);
     db.collection("contrib").onSnapshot(snap=>{clearTimeout(timer);S.sharedNote="";const docs={};snap.docs.forEach(d=>{if(d.exists)docs[d.id]=d.data();});this.docs=docs;
       if(!this._synced&&S.user&&this.canWrite){this._synced=true;const m=docs[this.uid];if(m&&(m.avatar!==(S.user.avatar||null)||m.name!==S.user.name.split(" ")[0]||m.college!==S.user.college))this.saveMine(this.mine());}
       rerender();},
       ()=>{clearTimeout(timer);S.sharedNote="Shared reviews are unavailable right now.";rerender();});
     const fref=db.doc("data/users/"+id+"/prefs");
     db.doc("data/users/"+id+"/fuel").onSnapshot(s=>{try{if(!s.exists){if(Fuel.data.profile)Fuel.save();return;}const d=s.data();if(d&&typeof d.days==="object"&&(d.profile===null||typeof d.profile==="object")){Fuel.data={profile:d.profile||null,days:d.days||{}};local.set("tce_fuel",Fuel.data);if(S.view==="fuel")rerender();}}catch(e){}},()=>{});
     fref.onSnapshot(s=>{if(!s.exists)return;const d=s.data();if(Array.isArray(d.favs))this.favs=new Set(d.favs);if(Array.isArray(d.classes))local.set("tce_classes",d.classes);if(Array.isArray(d.reminders)){Rem.set=new Set(d.reminders);local.set("tce_rem",d.reminders);}rerender();},()=>{});
     rerender();
   }catch(e){}
 },
 async write(uid,next){
   if(this.mode!=="shared"){this.docs.local=next;local.set("tce_contrib",next);rerender();return true;}
   if(!this.canWrite){toast("You have view-only access, so you can't post here.");return false;}
   const body=uid===this.uid?{...next,name:S.user.name.split(" ")[0],college:S.user.college,avatar:S.user.avatar||null}:next;
   try{await this.db.collection("contrib").doc(uid).set(body);return true;}
   catch(e){if(e&&e.code==="invalid_argument")toast(uid===this.uid?"You have view-only access, so you can't post here.":"Only the site owner can remove other people's posts.");
     else if(e&&e.code==="quota_exceeded")toast("Storage is full. Delete some old photos first.");else toast("Couldn't save. Try again in a moment.");return false;}
 },
 saveMine(next){return this.write(this.uid,next);},
 canDelete(uid){return uid===this.uid||(this.mode==="shared"&&this.isOwner);},
 async toggleFav(id){
   this.favs.has(id)?this.favs.delete(id):this.favs.add(id);
   const arr=[...this.favs];local.set("tce_favs",arr);
   await savePrefs();
 },
 src(p){if(!p)return null;if(typeof p.url==="string"&&p.url.startsWith(PHOTO_URL())&&!/["'()\\\s]/.test(p.url))return p.url;if(p.id)return "/_blob/"+encodeURIComponent(p.id);if(typeof p.data==="string"&&p.data.startsWith("data:image/"))return p.data;return null;},
 who(uid){const d=this.docs[uid]||{};const nm=String(d.name||(uid===this.uid?S.user?.name?.split(" ")[0]:"")||"Student").slice(0,40);return{avatar:typeof d.avatar==="string"&&d.avatar.length<60000&&!this.hidden('avatar:'+uid,uid)?d.avatar:(uid===this.uid?S.user?.avatar:null),name:hasBad(nm)?"Student":nm,college:COLLEGES[d.college]?d.college:(uid===this.uid?S.user?.college:"B")||"B"};},
 reviewsFor(id){const out=[];for(const [uid,doc] of Object.entries(this.docs)){const r=doc?.reviews?.[id];if(r&&typeof r.stars==="number"&&!this.hidden('review:'+uid+'|'+id,uid))out.push({...r,text:clean(r.text),uid,...this.who(uid),mine:uid===this.uid,photos:(r.photos||[]).map((p,i)=>({...p,i,src:this.src(p),rkey:'photo:'+uid+'|'+id+'|'+(p.id||p.ts)})).filter(p=>p.src&&!this.hidden(p.rkey,uid))});}
   return out.sort((a,b)=>(b.ts||0)-(a.ts||0));},
 rating(id){const r=this.reviewsFor(id);if(!r.length)return null;return{avg:r.reduce((a,x)=>a+Math.min(5,Math.max(1,x.stars)),0)/r.length,n:r.length};},
 posts(){const out=[];for(const [uid,doc] of Object.entries(this.docs)){for(const [pid,p] of Object.entries(doc?.posts||{})){const key=uid+"~"+pid;
    let likes=0,liked=false;const comments=[];
    for(const [u2,d2] of Object.entries(this.docs)){if(d2?.likes?.[key]){likes++;if(u2===this.uid)liked=true;}(d2?.comments?.[key]||[]).forEach((c,i)=>{const rk='cmt:'+key+'|'+u2+'|'+(c.ts||i);if(!this.hidden(rk,u2))comments.push({...c,text:clean(c.text),rk,uid:u2,i,...this.who(u2)});});}
    const rk='post:'+key;out.push({key,uid,pid,...p,title:clean(p.title),where:clean(p.where),caption:clean(p.caption),rk,reports:this.reportCount(rk),src:this.src(p.photo),...this.who(uid),likes,liked,comments:comments.sort((a,b)=>a.ts-b.ts)});}}
   return out.filter(p=>p.src&&!this.hidden(p.rk,p.uid));},
 reportCount(rk){let n=0;for(const d of Object.values(this.docs))if(d?.reports?.[rk])n++;return n;},
 reportedByMe(rk){return !!this.docs[this.uid]?.reports?.[rk];},
 // hidden for me if I reported it, hidden for everyone once enough people do; the owner still sees it so they can delete it
 hidden(rk,authorUid){if(authorUid===this.uid)return false;if(this.reportedByMe(rk))return true;return this.reportCount(rk)>=REPORT_HIDE&&!this.isOwner;},
 async report(rk){const m=this.mine();m.reports=m.reports||{};m.reports[rk]=Date.now();if(await this.saveMine(m))toast("Reported. It's hidden for you, and for everyone once another person reports it.");}
};

/* ================= state + helpers ================= */
const now=new Date();
const TODAY=`${DAYS[now.getDay()]} ${now.toLocaleString("en-US",{month:"short"})} ${now.getDate()}`;
const ord=s=>Date.parse(s.split(" ").slice(1).join(" ")+" 2026");
function defaultDay(h){const i=h.dates.indexOf(TODAY);if(i>=0)return i;const t=ord(TODAY);const later=h.dates.map((d,i)=>[ord(d),i]).filter(x=>x[0]>=t).sort((a,b)=>a[0]-b[0]);return later.length?later[0][1]:0;}
const S={user:local.get("tce_user"),view:null,step:0,draft:null,tab:null,day:null,meal:"now",hide:true,favOnly:false,sort:"rec",item:null,menuOpen:false,newStars:0,pending:[],sharedNote:"",showFilters:false,theme:local.get("tce_theme")||"classic",feedSort:"new",feedCollege:"all",postDraft:null};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cz=k=>CUISINES.find(c=>c.k===k)||CUISINES[7];
function stars(r){let s="";for(let i=1;i<=5;i++)s+=r>=i-.25?"★":"☆";return s;}
function fmtH(x){const h=Math.floor(x),m=Math.round((x-h)*60);const ap=h>=12?"pm":"am";const hh=((h+11)%12)+1;return `${hh}${m?":"+String(m).padStart(2,"0"):""}${ap}`;}
function ago(ts){const m=Math.round((Date.now()-ts)/60000);if(m<1)return "just now";if(m<60)return m+"m ago";const h=Math.round(m/60);if(h<24)return h+"h ago";return new Date(ts).toLocaleDateString(undefined,{month:"short",day:"numeric"});}
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function rerender(){if(!S.user||S.view==="survey")return;const ae=document.activeElement;if(ae&&ae.matches&&ae.matches("textarea,input[type=text],#q,.cmtform input"))return;render();}
function stockSrc(it){return it.img?`site/img/dishes/${it.id}.jpg`:it.photo&&STOCK[it.photo]?`site/img/${it.photo}.jpg`:null;}
function pic(it){const s=stockSrc(it);return s?`<div class="pic" style="background-image:url('${s}')"></div>`:`<div class="pic blank"><span>${esc(it.category)}</span></div>`;}
function heartBtn(id,big){const on=Shared.favs.has(id);return `<button class="heart ${on?"on":""} ${big?"big":""}" data-fav="${id}" aria-label="${on?"Remove from":"Add to"} favorites" aria-pressed="${on}">${on?HEART:HEART_O}</button>`;}
function wireHearts(){document.querySelectorAll("[data-fav]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=b.dataset.fav;await Shared.toggleFav(id);toast(Shared.favs.has(id)?"Added to favorites":"Removed from favorites");render();});}
function nextServing(it){const t=ord(TODAY);const list=it.served.map(s=>({...s,date:HALL[s.hall].dates[s.day]})).sort((a,b)=>ord(a.date)-ord(b.date));return list.find(s=>ord(s.date)>=t)||list[list.length-1];}
function showImage(src){const m=document.createElement("div");m.className="modal";m.innerHTML=`<button class="close">Close</button><img src="${esc(src)}" alt="">`;m.onclick=()=>m.remove();document.body.appendChild(m);}

function check(it,hallId){
 const p=S.user?.prefs||{diets:[],allergens:[],cuisines:{},goals:[]};
 const lab=it.labels[hallId]||Object.values(it.labels)[0];
 const reasons=[],unknown=[];
 p.diets.forEach(k=>{const d=DIETS.find(x=>x.k===k);if(d.unpub||lab.diets.includes(k))return;
   const marked=(k==="vegetarian"||k==="vegan")?HALL[hallId].marksVeg:hallId==="swatdc";
   if(marked)reasons.push(`Not labeled ${d.label.toLowerCase()}`);else unknown.push(`${d.label} not labeled here`);});
 const hits=lab.allergens.filter(a=>p.allergens.includes(a));
 hits.forEach(a=>reasons.push(`Contains ${ALLERGENS.find(x=>x.k===a).label.toLowerCase()}`));
 if(p.allergens.length&&!lab.allergensListed)unknown.push("Allergens not listed");
 const goalHits=GOALS.filter(g=>p.goals.includes(g.k)&&it.goals.includes(g.k)).map(g=>g.hint);
 const c=p.cuisines[it.cuisine];const r=Shared.rating(it.id);
 const score=goalHits.length+(c==="like"?2:0)+(c==="dislike"?-3:0)+(r?(r.avg-3)/2:0)+(Shared.favs.has(it.id)?3:0);
 return{ok:!reasons.length,reasons,unknown,hits,goalHits,lab,disliked:c==="dislike",score,rec:!reasons.length&&!unknown.length&&score>=2};
}
function hoursFor(h,day){return h.hours[day]||[];}
function openMeal(h){const d=now.getDay(),t=now.getHours()+now.getMinutes()/60;return hoursFor(h,d).find(([m,a,b])=>t>=a&&t<b)||null;}

/* ================= fun themes ================= */
// each sprite: [viewBox width, height, svg body, face position [x,y,scale] or null]
const SPRITES={
 garden:{
  carrot:[80,120,`<path d="M30 18 Q22 2 30 0 Q36 8 40 16 Q44 2 52 2 Q54 14 46 20" fill="#6cbf4a"/><path d="M22 26 Q40 14 58 26 Q56 70 40 116 Q24 70 22 26Z" fill="#ff8c3a"/><path d="M28 50h8M42 72h7M32 92h6" stroke="#e06d1f" stroke-width="3" stroke-linecap="round"/>`,[40,46,1]],
  tomato:[100,96,`<circle cx="50" cy="54" r="40" fill="#ff5a4e"/><path d="M50 16 l6 -12 M34 20 Q50 30 66 20 Q60 12 50 18 Q40 12 34 20Z" stroke="#4e9a3a" stroke-width="5" fill="#5fae45" stroke-linecap="round"/><ellipse cx="34" cy="40" rx="8" ry="5" fill="#fff" opacity=".45"/>`,[50,58,1.2]],
  broccoli:[100,110,`<rect x="40" y="58" width="20" height="48" rx="9" fill="#a8d672"/><circle cx="30" cy="44" r="20" fill="#3f9a3c"/><circle cx="70" cy="44" r="20" fill="#3f9a3c"/><circle cx="50" cy="28" r="22" fill="#4fae47"/><circle cx="50" cy="52" r="18" fill="#45a342"/>`,[50,48,1.1]],
  strawberry:[90,100,`<path d="M45 96 Q8 60 12 36 Q20 18 45 22 Q70 18 78 36 Q82 60 45 96Z" fill="#ff4f6d"/><path d="M28 20 L45 30 L62 20 L55 12 L45 18 L35 12Z" fill="#5fae45"/><g fill="#ffe08a"><circle cx="30" cy="48" r="2"/><circle cx="58" cy="46" r="2"/><circle cx="44" cy="70" r="2"/><circle cx="62" cy="64" r="2"/><circle cx="28" cy="66" r="2"/></g>`,[45,52,1]],
  pea:[120,70,`<path d="M8 40 Q60 -6 112 30 Q60 74 8 40Z" fill="#7cc95a"/><circle cx="36" cy="36" r="10" fill="#a6e27a"/><circle cx="60" cy="34" r="10" fill="#a6e27a"/><circle cx="84" cy="34" r="10" fill="#a6e27a"/>`,[60,52,.6]],
  lemon:[110,90,`<ellipse cx="55" cy="46" rx="44" ry="34" fill="#ffd84a"/><path d="M8 46 l-6 0 M102 46 l6 0" stroke="#f2c12e" stroke-width="8" stroke-linecap="round"/><path d="M60 12 Q74 0 84 10 Q70 16 60 12Z" fill="#6cbf4a"/>`,[55,48,1.1]],
  avocado:[90,120,`<path d="M45 4 Q78 30 82 74 Q82 114 45 116 Q8 114 8 74 Q12 30 45 4Z" fill="#4d8b31"/><path d="M45 14 Q72 38 74 74 Q72 106 45 108 Q18 106 16 74 Q18 38 45 14Z" fill="#d9ef8b"/><circle cx="45" cy="78" r="17" fill="#9b5b2c"/>`,[45,48,.9]],
  mushroom:[100,100,`<path d="M10 50 Q14 10 50 8 Q86 10 90 50Z" fill="#e8564a"/><circle cx="34" cy="28" r="6" fill="#fff"/><circle cx="62" cy="22" r="5" fill="#fff"/><circle cx="72" cy="38" r="4" fill="#fff"/><path d="M34 50 h32 v30 q0 14 -16 14 q-16 0 -16 -14Z" fill="#fbecd5"/>`,[50,70,.9]]},
 ocean:{
  fish:[120,80,`<path d="M90 40 L118 16 L114 40 L118 64Z" fill="#ff7f11"/><ellipse cx="55" cy="40" rx="42" ry="27" fill="#ff9f43"/><path d="M46 15 Q60 0 76 16Z" fill="#ff7f11"/><path d="M70 30 q8 10 0 20" stroke="#ff7f11" stroke-width="4" fill="none" stroke-linecap="round"/>`,[38,38,.9]],
  clown:[120,80,`<path d="M94 40 L118 20 L116 40 L118 60Z" fill="#ff6b1a"/><ellipse cx="58" cy="40" rx="42" ry="25" fill="#ff6b1a"/><ellipse cx="46" cy="40" rx="6" ry="23" fill="#fff"/><ellipse cx="74" cy="40" rx="5" ry="20" fill="#fff"/>`,[30,40,.75]],
  whale:[132,90,`<path d="M104 48 Q118 30 130 22 Q122 44 130 62 Q116 58 104 54Z" fill="#4a95d6"/><path d="M8 50 Q12 16 60 16 Q106 16 108 50 Q104 80 60 80 Q14 80 8 50Z" fill="#5aa9e6"/><ellipse cx="58" cy="68" rx="38" ry="9" fill="#cfe8fb"/><path d="M58 16 Q54 6 46 3 M58 16 Q62 6 70 3" stroke="#8ccaf5" stroke-width="4" fill="none" stroke-linecap="round"/>`,[42,44,1]],
  crab:[120,92,`<path d="M30 52 L18 36 M90 52 L102 36 M34 70 L16 84 M44 74 L34 90 M86 70 L104 84 M76 74 L86 90 M52 38 L48 22 M68 38 L72 22" stroke="#e84a4a" stroke-width="5" stroke-linecap="round"/><circle cx="16" cy="28" r="13" fill="#ff5d5d"/><circle cx="104" cy="28" r="13" fill="#ff5d5d"/><path d="M10 22 L18 28 M110 22 L102 28" stroke="#fff3" stroke-width="4"/><ellipse cx="60" cy="58" rx="36" ry="22" fill="#ff5d5d"/>`,[60,58,1]],
  octopus:[100,112,`<g stroke="#a57be0" stroke-width="11" fill="none" stroke-linecap="round"><path d="M28 54 Q18 80 28 104"/><path d="M42 56 Q36 84 44 108"/><path d="M58 56 Q64 84 56 108"/><path d="M72 54 Q82 80 72 104"/></g><path d="M18 56 Q16 8 50 8 Q84 8 82 56Z" fill="#b388eb"/>`,[50,38,1.05]],
  star:[100,100,`<polygon points="50,6 62,36 95,38 69,58 79,92 50,73 21,92 31,58 5,38 38,36" fill="#ffcf56" stroke="#ffb72b" stroke-width="5" stroke-linejoin="round"/>`,[50,54,.85]],
  shell:[100,90,`<path d="M50 84 Q8 80 8 42 Q10 8 50 6 Q90 8 92 42 Q92 80 50 84Z" fill="#ffc2d1"/><path d="M50 84 L26 16 M50 84 L42 8 M50 84 L58 8 M50 84 L74 16" stroke="#f497b0" stroke-width="3"/><path d="M40 84 h20 v6 h-20z" fill="#f497b0"/>`,[50,56,.8]],
  turtle:[130,90,`<ellipse cx="112" cy="50" rx="16" ry="13" fill="#9bd36a"/><path d="M28 70 l-10 14 M88 70 l10 14 M30 34 l-12 -10 M88 34 l12 -10" stroke="#9bd36a" stroke-width="10" stroke-linecap="round"/><ellipse cx="58" cy="52" rx="44" ry="30" fill="#3fa36b"/><path d="M58 24 L42 40 L48 64 L68 64 L74 40Z" fill="#59c085"/>`,[112,48,.6]]},
 asian:{
  dumpling:[110,80,`<path d="M8 60 Q10 18 55 16 Q100 18 102 60 Q55 74 8 60Z" fill="#fff6e6" stroke="#e9d2ad" stroke-width="3"/><path d="M38 22 q5 8 0 14 M55 18 q5 8 0 14 M72 22 q5 8 0 14" stroke="#e9d2ad" stroke-width="3" fill="none" stroke-linecap="round"/>`,[55,48,1]],
  lantern:[80,122,`<rect x="28" y="4" width="24" height="12" fill="#f4b400"/><ellipse cx="40" cy="58" rx="34" ry="42" fill="#e63946"/><ellipse cx="40" cy="58" rx="16" ry="42" fill="none" stroke="#c1121f" stroke-width="3"/><rect x="30" y="96" width="20" height="9" fill="#f4b400"/><path d="M40 105 v15" stroke="#f4b400" stroke-width="4" stroke-linecap="round"/>`,[40,62,1]],
  nigiri:[120,82,`<rect x="12" y="38" width="96" height="34" rx="16" fill="#fffdf7" stroke="#ece6da" stroke-width="3"/><path d="M8 44 Q12 16 60 18 Q108 16 112 44 Q60 54 8 44Z" fill="#ff8c69"/><path d="M34 24 l-8 18 M56 20 l-6 24 M80 22 l-6 22" stroke="#ffd0bf" stroke-width="4" stroke-linecap="round"/>`,[60,60,.85]],
  boba:[80,124,`<path d="M48 0 L56 32" stroke="#ff7aa2" stroke-width="8" stroke-linecap="round"/><path d="M12 26 L68 26 L60 114 Q40 120 20 114Z" fill="#e8c39e"/><ellipse cx="40" cy="26" rx="30" ry="7" fill="#fff"/><g fill="#3b2a20"><circle cx="28" cy="104" r="6"/><circle cx="42" cy="108" r="6"/><circle cx="54" cy="102" r="6"/><circle cx="36" cy="96" r="6"/><circle cx="50" cy="92" r="5"/></g>`,[40,58,1]],
  onigiri:[100,100,`<path d="M50 8 Q58 8 92 76 Q96 92 78 92 L22 92 Q4 92 8 76 Q42 8 50 8Z" fill="#fff" stroke="#e6e6e6" stroke-width="3"/><rect x="32" y="64" width="36" height="28" fill="#23303a"/>`,[50,48,1]],
  bowl:[112,100,`<path d="M66 4 L104 42 M76 2 L108 36" stroke="#c68b59" stroke-width="5" stroke-linecap="round"/><path d="M18 50 Q20 22 56 20 Q92 22 94 50Z" fill="#fff"/><path d="M10 50 L102 50 Q98 94 56 96 Q14 94 10 50Z" fill="#4a7fd4"/><path d="M18 62 h76" stroke="#7aa6ec" stroke-width="4"/>`,[56,74,1]],
  bao:[100,80,`<path d="M8 50 Q10 14 50 12 Q90 14 92 50 Q92 72 50 72 Q8 72 8 50Z" fill="#fff3e3" stroke="#ecd5b8" stroke-width="3"/><path d="M44 18 q6 -6 12 0" stroke="#ecd5b8" stroke-width="3" fill="none" stroke-linecap="round"/>`,[50,44,1]],
  fortune:[110,80,`<path d="M8 50 Q20 10 55 12 Q90 10 102 50 Q80 40 55 70 Q30 40 8 50Z" fill="#f2b65a"/><path d="M55 70 Q46 46 55 22" stroke="#d99a3a" stroke-width="3" fill="none"/><rect x="58" y="44" width="34" height="9" fill="#fff" transform="rotate(-12 58 44)"/>`,[30,36,.7]]},
 fastfood:{
  burger:[110,100,`<path d="M10 46 Q12 8 55 8 Q98 8 100 46Z" fill="#f4a340"/><g fill="#fff3d6"><ellipse cx="40" cy="18" rx="3" ry="2"/><ellipse cx="62" cy="14" rx="3" ry="2"/><ellipse cx="76" cy="24" rx="3" ry="2"/></g><path d="M6 50 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 16 0 q8 -8 18 0 v6 h-98z" fill="#7bc950"/><path d="M14 56 h82 l-10 12 l-10 -8 l-10 8 l-10 -8 l-10 8 l-10 -8 l-12 8z" fill="#ffd23f"/><rect x="10" y="60" width="90" height="16" rx="8" fill="#7a3e1d"/><rect x="10" y="76" width="90" height="18" rx="9" fill="#f4a340"/>`,[55,32,1]],
  fries:[90,120,`<g fill="#ffd23f"><rect x="18" y="14" width="9" height="50" rx="2" transform="rotate(-8 22 40)"/><rect x="30" y="6" width="9" height="56" rx="2"/><rect x="42" y="2" width="9" height="60" rx="2"/><rect x="54" y="8" width="9" height="54" rx="2" transform="rotate(6 58 34)"/><rect x="64" y="16" width="9" height="46" rx="2" transform="rotate(12 68 40)"/></g><path d="M10 50 L80 50 L70 116 L20 116Z" fill="#e63946"/><path d="M10 50 Q45 66 80 50" fill="#c92a37"/>`,[45,84,1]],
  soda:[80,122,`<path d="M44 0 L50 26" stroke="#e63946" stroke-width="7" stroke-linecap="round"/><path d="M12 30 L68 30 L60 118 L20 118Z" fill="#4ea8de"/><rect x="8" y="22" width="64" height="11" rx="4" fill="#fff"/><path d="M15 54 L65 54 L63 72 L17 72Z" fill="#fff" opacity=".85"/>`,[40,92,.9]],
  hotdog:[132,72,`<ellipse cx="66" cy="46" rx="58" ry="20" fill="#f4a340"/><rect x="4" y="22" width="124" height="20" rx="10" fill="#c0392b"/><path d="M14 32 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l10 6 l10 -6 l10 6 l10 -6" stroke="#ffd23f" stroke-width="4" fill="none" stroke-linecap="round"/>`,[66,54,.8]],
  donut:[100,100,`<circle cx="50" cy="50" r="44" fill="#f2b36d"/><path d="M12 48 Q14 14 50 12 Q86 14 88 48 Q84 58 78 52 Q72 64 64 56 Q56 66 48 58 Q38 66 32 56 Q24 62 20 54 Q14 60 12 48Z" fill="#ff8fc8"/><circle cx="50" cy="38" r="11" fill="#fffbef"/><g stroke-width="4" stroke-linecap="round"><path d="M28 30 l4 -3" stroke="#4ea8de"/><path d="M70 28 l3 4" stroke="#ffd23f"/><path d="M36 50 l5 1" stroke="#7bc950"/><path d="M66 46 l-2 5" stroke="#fff"/><path d="M50 20 l4 2" stroke="#7bc950"/></g>`,[50,72,.8]],
  pizza:[100,110,`<path d="M10 12 Q50 0 90 12 L50 106Z" fill="#ffd166"/><path d="M8 10 Q50 -4 92 10 L88 22 Q50 10 12 22Z" fill="#d98e3a"/><g fill="#d62828"><circle cx="36" cy="34" r="7"/><circle cx="64" cy="36" r="7"/><circle cx="50" cy="70" r="6"/></g>`,[50,52,.85]],
  shake:[80,124,`<path d="M50 0 L46 34" stroke="#4ea8de" stroke-width="6" stroke-linecap="round"/><path d="M16 42 L64 42 L56 118 L24 118Z" fill="#ffb3c7"/><g fill="#fff"><circle cx="24" cy="38" r="10"/><circle cx="40" cy="32" r="12"/><circle cx="56" cy="38" r="10"/></g><circle cx="40" cy="18" r="6" fill="#d62828"/>`,[40,78,1]]},
 christmas:{
  ginger:[100,112,`<g fill="#c7834a"><circle cx="50" cy="24" r="19"/><rect x="30" y="38" width="40" height="42" rx="14"/><rect x="8" y="44" width="30" height="14" rx="7"/><rect x="62" y="44" width="30" height="14" rx="7"/><rect x="28" y="70" width="16" height="38" rx="8"/><rect x="56" y="70" width="16" height="38" rx="8"/></g><g fill="#fff"><circle cx="50" cy="52" r="3"/><circle cx="50" cy="64" r="3"/></g><path d="M12 50 l4 3 l4 -3 M80 50 l4 3 l4 -3" stroke="#fff" stroke-width="2" fill="none"/>`,[50,24,.85]],
  cane:[70,120,`<path d="M22 116 L22 36 Q22 8 44 8 Q64 8 64 30" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M22 116 L22 36 Q22 8 44 8 Q64 8 64 30" stroke="#e63946" stroke-width="14" fill="none" stroke-dasharray="9 9"/>`,null],
  ornament:[90,110,`<circle cx="45" cy="9" r="6" fill="none" stroke="#c9a227" stroke-width="3"/><rect x="35" y="14" width="20" height="13" fill="#d4af37"/><circle cx="45" cy="66" r="38" fill="#e63946"/><path d="M8 58 Q26 48 45 58 Q64 68 82 58" stroke="#fff" stroke-width="5" fill="none"/>`,[45,74,1]],
  tree:[100,122,`<rect x="42" y="96" width="16" height="22" fill="#8b5a2b"/><path d="M50 14 L82 52 L18 52Z M50 34 L88 78 L12 78Z M50 56 L94 100 L6 100Z" fill="#2e8b57"/><polygon points="50,0 54,10 64,10 56,16 59,26 50,20 41,26 44,16 36,10 46,10" fill="#ffd23f"/><g fill="#e63946"><circle cx="30" cy="94" r="4"/><circle cx="72" cy="70" r="4"/><circle cx="38" cy="48" r="3"/></g>`,[50,80,1]],
  gift:[100,104,`<rect x="12" y="42" width="76" height="58" fill="#2e8b57"/><rect x="8" y="30" width="84" height="16" fill="#3aa66a"/><rect x="44" y="30" width="12" height="70" fill="#e63946"/><path d="M50 30 Q30 4 22 18 Q18 30 50 30 Q82 30 78 18 Q70 4 50 30Z" fill="#e63946"/>`,[50,72,1]],
  snowman:[90,122,`<circle cx="45" cy="86" r="32" fill="#fff" stroke="#d7e6f2" stroke-width="3"/><circle cx="45" cy="42" r="22" fill="#fff" stroke="#d7e6f2" stroke-width="3"/><rect x="31" y="6" width="28" height="18" fill="#2b2b2b"/><rect x="23" y="21" width="44" height="5" fill="#2b2b2b"/><path d="M28 62 h34" stroke="#e63946" stroke-width="7" stroke-linecap="round"/><path d="M45 46 l12 3 l-12 3z" fill="#ff8c3a"/><g fill="#2b2b2b"><circle cx="45" cy="80" r="3"/><circle cx="45" cy="94" r="3"/></g>`,[45,40,.85]],
  cocoa:[100,100,`<path d="M36 22 q-6 -10 0 -18 M50 22 q-6 -10 0 -18" stroke="#d9c6b5" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 46 a14 14 0 1 1 0 28" stroke="#e63946" stroke-width="8" fill="none"/><rect x="14" y="28" width="62" height="62" rx="12" fill="#e63946"/><ellipse cx="45" cy="31" rx="29" ry="6" fill="#6b3e26"/><g fill="#fff"><rect x="32" y="26" width="9" height="7" rx="2"/><rect x="48" y="27" width="9" height="7" rx="2"/></g>`,[45,62,1]]}
};
const THEMES=[
 ["classic","Classic","Navy and gold, clean and simple."],
 ["garden","Garden party","Soft colours and friendly fruit and veg everywhere."],
 ["ocean","Under the sea","Fish, crabs, whales and a sea turtle drifting by."],
 ["asian","Asian market","Dumplings, lanterns, boba and onigiri, in sunny yellow."],
 ["fastfood","Drive-thru","Burgers, fries, shakes and a very happy hot dog."],
 ["christmas","Holiday","Evergreen, with gingerbread, candy canes and a snowman."]];
function face(cx,cy,s=1){return `<g transform="translate(${cx} ${cy}) scale(${s})"><circle cx="-8" cy="0" r="3.2" fill="#3a2a1f"/><circle cx="8" cy="0" r="3.2" fill="#3a2a1f"/><circle cx="-7" cy="-1" r="1" fill="#fff"/><circle cx="9" cy="-1" r="1" fill="#fff"/><path d="M-5 6 Q0 11 5 6" stroke="#3a2a1f" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="-14" cy="6" r="3" fill="#ff8fa3" opacity=".7"/><circle cx="14" cy="6" r="3" fill="#ff8fa3" opacity=".7"/></g>`;}
function spriteSvg(theme,k,w){const [vw,vh,body,f]=SPRITES[theme][k];return `<svg viewBox="0 0 ${vw} ${vh}" width="${w}">${body}${f?face(...f):""}</svg>`;}
function applyTheme(burst){
 if(!THEMES.some(t=>t[0]===S.theme))S.theme="classic";
 THEMES.forEach(([k])=>document.body.classList.remove("th-"+k));
 document.body.classList.remove("garden");
 const fun=S.theme!=="classic";document.body.classList.toggle("fun",fun);if(fun)document.body.classList.add("th-"+S.theme);
 document.querySelector(".veglayer")?.remove();
 if(!fun)return;
 const L=document.createElement("div");L.className="veglayer";const keys=Object.keys(SPRITES[S.theme]);
 const spots=[[2,12],[93,10],[1,42],[95,36],[3,72],[92,66],[6,92],[88,90],[48,96],[20,4],[72,3],[96,82],[0,58],[90,52]];
 L.innerHTML=spots.map(([x,y],i)=>`<div class="veg" style="left:${x}%;top:${y}%;--r:${(i%5-2)*8}deg;animation-delay:${(i*.37)%3}s">${spriteSvg(S.theme,keys[i%keys.length],48+(i%3)*14)}</div>`).join("");
 document.body.prepend(L);
 if(burst){for(let i=0;i<22;i++){const d=document.createElement("div");d.className="rain";d.style.left=Math.random()*96+"vw";d.style.animationDelay=Math.random()*.9+"s";d.innerHTML=spriteSvg(S.theme,keys[i%keys.length],34+Math.random()*24);document.body.appendChild(d);setTimeout(()=>d.remove(),4000);}}
}
function openSettings(){
 const m=document.createElement("div");m.className="modal";
 const k0=t=>Object.keys(SPRITES[t]||{})[0];
 m.innerHTML=`<div class="card" role="dialog" aria-label="Settings"><h2 style="margin-bottom:6px">Settings</h2><p class="legend">Theme</p>
  <div class="themes">${THEMES.map(([k,l,d])=>`<label class="opt ${S.theme===k?"on":""}"><input type="radio" name="th" value="${k}" ${S.theme===k?"checked":""}><span class="thico">${k==="classic"?`<i class="classic-sw"></i>`:spriteSvg(k,k0(k),34)}</span><span><b>${l}</b><br><small>${d}</small></span></label>`).join("")}</div>
  <div class="nav-row"><span></span><button class="btn" id="setdone">Done</button></div></div>`;
 m.onclick=e=>{if(e.target===m)m.remove();};
 document.body.appendChild(m);
 m.querySelectorAll("input[name=th]").forEach(r=>r.onchange=()=>{S.theme=r.value;local.set("tce_theme",S.theme);applyTheme(S.theme!=="classic");render();m.querySelectorAll(".opt").forEach(o=>o.classList.toggle("on",o.contains(r)));});
 m.querySelector("#setdone").onclick=()=>m.remove();
}


/* ================= nutrition ================= */
function nutOf(it,hallId){const n=it.nutrition;if(!n)return null;return n[hallId]||Object.values(n)[0];}
function nutritionBox(it,hallId){const n=nutOf(it,hallId);
 const src=n?Object.keys(it.nutrition).find(k=>it.nutrition[k]===n):null;const h=HALL[src||hallId];
 if(!n)return `<div class="box"><h3>Nutrition</h3><p class="legend" style="margin:0">Not collected for this dish yet. The college publishes it: <a href="${h.sourceUrl}" target="_blank" rel="noopener">${esc(h.source)}</a>${hallId==="swatdc"?` (Swarthmore: <a href="https://netnutrition.cbord.com/nn-prod/swarthmore" target="_blank" rel="noopener">NetNutrition</a>)`:""}.</p></div>`;
 const row=(l,k,u)=>n[k]!=null?`<div class="nf"><span>${l}</span><b>${n[k]}${u}</b></div>`:"";
 const macros=n.protein!=null&&n.carbs!=null&&n.fat!=null;
 const kc=macros?{p:n.protein*4,c:n.carbs*4,f:n.fat*9}:null;const tot=kc?kc.p+kc.c+kc.f:0;
 return `<div class="box"><h3>Nutrition <small style="font-weight:500;color:var(--muted);font-size:13px">per serving</small></h3>
  <div class="nfbig"><b>${n.cal??"?"}</b><span>calories</span></div>
  ${macros?`<div class="mbar" aria-label="Calories from protein, carbs and fat"><i class="p" style="width:${kc.p/tot*100}%"></i><i class="c" style="width:${kc.c/tot*100}%"></i><i class="f" style="width:${kc.f/tot*100}%"></i></div>
   <div class="mleg"><span><i class="p"></i>Protein ${n.protein}g</span><span><i class="c"></i>Carbs ${n.carbs}g</span><span><i class="f"></i>Fat ${n.fat}g</span></div>`:`<p class="legend" style="margin:6px 0 0">Only calories were collected for this dish so far.</p>`}
  <div class="nfgrid">${row("Saturated fat","satfat","g")}${row("Fiber","fiber","g")}${row("Sugars","sugar","g")}${row("Sodium","sodium","mg")}${row("Cholesterol","chol","mg")}</div>
  <p class="note2">From ${esc(h.source)}, ${esc(h.name)}. Portions vary at the station.</p></div>`;
}

/* ================= class schedule (real dates) ================= */
// Each saved entry is one dated block: {date:"2026-11-10", start:10, end:10.83, name:"CHEM 103", src:"ics"|"gcal"|"manual"}
const DAYCODE={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
const MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
const pad=n=>String(n).padStart(2,"0");
function isoOf(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function dateFromIso(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
function isoFromLabel(label){const [,mon,day]=label.split(" ");let y=now.getFullYear();const m=MON[mon];if(m-now.getMonth()>6)y--;if(now.getMonth()-m>6)y++;return isoOf(new Date(y,m,+day));}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function niceDate(iso){const d=dateFromIso(iso);return iso===isoOf(now)?"Today":`${DAYS[d.getDay()]} ${d.toLocaleString("en-US",{month:"short"})} ${d.getDate()}`;}
// keep only what the site can use: from the menu week's first day to four weeks ahead
function windowRange(){const firsts=DATA.halls.flatMap(h=>h.dates.map(isoFromLabel)).sort();const a=dateFromIso(firsts[0]<isoOf(addDays(now,-7))?firsts[0]:isoOf(addDays(now,-7)));return[a,addDays(now,28)];}
function getClasses(){const v=local.get("tce_classes")||[];return v.filter(c=>c&&typeof c.date==="string");}
async function setClasses(list){local.set("tce_classes",list);await savePrefs();}
function hrs(d){return d.getHours()+d.getMinutes()/60;}
function block(s,e,name,src){if(!(e>s))return null;if(isoOf(s)!==isoOf(e))e=new Date(s.getFullYear(),s.getMonth(),s.getDate(),23,59);return{date:isoOf(s),start:hrs(s),end:hrs(e),name:(name||"Busy").slice(0,60),src};}

function parseICS(text){
 const lines=text.replace(/\r\n[ \t]/g,"").replace(/\n[ \t]/g,"").split(/\r?\n/);
 const evs=[];let ev=null;
 const dt=(key,val)=>{const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(val.trim());if(!m)return null;
  if(!m[4])return{allDay:true,d:new Date(+m[1],+m[2]-1,+m[3])};
  return{d:m[7]?new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5])):new Date(+m[1],+m[2]-1,+m[3],+m[4],+m[5])};};
 for(const raw of lines){const i=raw.indexOf(":");if(i<0)continue;const key=raw.slice(0,i),val=raw.slice(i+1);const name=key.split(";")[0].toUpperCase();
  if(name==="BEGIN"&&val.trim()==="VEVENT")ev={ex:[]};
  else if(name==="END"&&val.trim()==="VEVENT"&&ev){evs.push(ev);ev=null;}
  else if(ev){
   if(name==="SUMMARY")ev.name=val.replace(/\\,/g,",").replace(/\;/g,";").replace(/\\n/gi," ");
   else if(name==="UID")ev.uid=val.trim();
   else if(name==="DTSTART")ev.start=dt(key,val);
   else if(name==="DTEND")ev.end=dt(key,val);
   else if(name==="DURATION"){const m=/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(val);if(m)ev.dur=((+m[1]||0)*24*60+(+m[2]||0)*60+(+m[3]||0))*60000;}
   else if(name==="RRULE")ev.rrule=Object.fromEntries(val.trim().split(";").map(p=>p.split("=")));
   else if(name==="EXDATE")val.split(",").forEach(v=>{const x=dt(key,v);if(x)ev.ex.push(x.d.getTime());});
   else if(name==="RECURRENCE-ID"){const x=dt(key,val);if(x)ev.recur=x.d.getTime();}
   else if(name==="STATUS"&&/CANCELLED/i.test(val))ev.cancelled=true;
   else if(name==="TRANSP"&&/TRANSPARENT/i.test(val))ev.free=true;}}
 // moved or cancelled single meetings replace that one occurrence of the series
 const moved=new Set(evs.filter(e=>e.recur!=null&&e.uid).map(e=>e.uid+"|"+e.recur));
 const [w0,w1]=windowRange();const out=[];
 for(const e of evs){
  if(!e.start||e.start.allDay||e.free)continue;
  const s0=e.start.d,dur=e.end&&!e.end.allDay?e.end.d-s0:(e.dur||3600000);
  const push=s=>{if(e.cancelled)return;if(s<w0||s>w1)return;if(e.ex.includes(s.getTime()))return;if(e.recur==null&&e.uid&&moved.has(e.uid+"|"+s.getTime()))return;const b=block(s,new Date(s.getTime()+dur),e.name,"ics");if(b)out.push(b);};
  const r=e.rrule;
  if(!r||e.recur!=null){push(s0);continue;}
  const freq=(r.FREQ||"").toUpperCase(),iv=Math.max(1,+r.INTERVAL||1),count=r.COUNT?+r.COUNT:Infinity;
  let until=w1;if(r.UNTIL){const u=dt("",r.UNTIL);if(u)until=new Date(Math.min(w1,u.allDay?addDays(u.d,1)-1:u.d));}
  let n=0;
  if(freq==="WEEKLY"||freq==="DAILY"){
   const by=freq==="WEEKLY"?(r.BYDAY?r.BYDAY.split(",").map(x=>DAYCODE[x.replace(/^[-+\d]+/,"")]).filter(x=>x!=null):[s0.getDay()]):null;
   const wk0=addDays(new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()),-s0.getDay());
   for(let d=new Date(s0.getFullYear(),s0.getMonth(),s0.getDate());d<=until&&n<count;d=addDays(d,1)){
    const s=new Date(d.getFullYear(),d.getMonth(),d.getDate(),s0.getHours(),s0.getMinutes());
    if(s<s0||s>until)continue;
    if(freq==="DAILY"){if(Math.round((d-new Date(s0.getFullYear(),s0.getMonth(),s0.getDate()))/864e5)%iv)continue;}
    else{if(!by.includes(d.getDay()))continue;if(Math.floor(Math.round((d-wk0)/864e5)/7)%iv)continue;}
    n++;push(s);}
  }else push(s0);
 }
 return out;
}
function parseTime(s){const m=/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/i.exec((s||"").trim());if(!m)return null;let h=+m[1];const mm=+(m[2]||0);const ap=(m[3]||"").toLowerCase();if(ap.startsWith("p")&&h<12)h+=12;if(ap.startsWith("a")&&h===12)h=0;return h+mm/60;}
// CSV with real dates: 2026-11-16, 10:00, 10:50, CHEM 103   (also 11/16/2026)
function parseCSV(text){
 const out=[];text.split(/\r?\n/).forEach(line=>{const c=line.split(/,|\t/).map(s=>s.trim().replace(/^"|"$/g,""));if(c.length<3)return;
  let d=null;let m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(c[0]);if(m)d=new Date(+m[1],+m[2]-1,+m[3]);
  else if((m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(c[0])))d=new Date(+m[3]<100?2000+ +m[3]:+m[3],+m[1]-1,+m[2]);
  const a=parseTime(c[1]),b=parseTime(c[2]);if(!d||a==null||b==null||!(b>a))return;
  out.push({date:isoOf(d),start:a,end:b,name:(c.slice(3).join(" ")||"Busy").slice(0,60),src:"csv"});});
 return out;
}
function dedupe(list){const seen=new Set();return list.filter(c=>{const k=[c.date,c.start.toFixed(2),c.end.toFixed(2),c.name].join("|");if(seen.has(k)||!(c.end>c.start))return false;seen.add(k);return true;}).sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);}
const MIN_EAT=25/60;
function mealFit(date,a,b){
 const busy=getClasses().filter(c=>c.date===date&&c.end>a&&c.start<b).sort((x,y)=>x.start-y.start);
 if(!busy.length)return{state:"free",text:"Nothing on your calendar",busy};
 let t=a,best=null;for(const c of busy){if(c.start-t>=MIN_EAT&&(!best||c.start-t>best[1]-best[0]))best=[t,c.start];t=Math.max(t,c.end);}if(b-t>=MIN_EAT&&(!best||b-t>best[1]-best[0]))best=[t,b];
 const names=[...new Set(busy.map(c=>c.name))].join(", ");
 if(best)return{state:"partial",text:`Free ${fmtH(best[0])}–${fmtH(best[1])} (around ${names})`,busy};
 return{state:"busy",text:`Conflicts with ${names}`,busy};
}
function fitPill(dateLabel,a,b){if(!getClasses().length)return"";const f=mealFit(isoFromLabel(dateLabel),a,b);return `<span class="fit ${f.state}" title="${esc(f.text)}">${f.state==="free"?"You're free":f.state==="partial"?"Partly free":"Calendar conflict"}</span>`;}

/* Google Calendar through the viewer's own claude.ai connector */
const GCAL="Google Calendar";
let mcpP=null;function mcpNs(){if(!mcpP)mcpP=(window.claude?.use?window.claude.use("mcp"):Promise.resolve(null)).catch(()=>null);return mcpP;}
function findEvents(x,depth=0){if(!x||depth>5)return null;if(Array.isArray(x)){if(x.some(o=>o&&typeof o==="object"&&("start" in o||"startTime" in o||"start_time" in o)))return x;for(const y of x){const r=findEvents(y,depth+1);if(r)return r;}return null;}
 if(typeof x==="object"){for(const k of["events","items","data","results"])if(x[k]){const r=findEvents(x[k],depth+1);if(r)return r;}for(const v of Object.values(x)){const r=findEvents(v,depth+1);if(r)return r;}}return null;}
function gTime(v){if(!v)return null;if(typeof v==="string")return{s:v};if(v.dateTime)return{s:v.dateTime};if(v.date_time)return{s:v.date_time};if(v.date)return{s:v.date,allDay:true};return null;}
function eventsToBlocks(list){const out=[];const [w0,w1]=windowRange();
 for(const e of list){const s=gTime(e.start||e.startTime||e.start_time),t=gTime(e.end||e.endTime||e.end_time);if(!s||!t||s.allDay||t.allDay||/^\d{4}-\d{2}-\d{2}$/.test(s.s))continue;
  if((e.status||"").toLowerCase()==="cancelled"||(e.transparency||"").toLowerCase()==="transparent")continue;
  const a=new Date(s.s),b=new Date(t.s);if(isNaN(a)||isNaN(b)||a<w0||a>w1)continue;const bl=block(a,b,e.summary||e.title||e.name,"gcal");if(bl)out.push(bl);}
 return out;}
async function syncGoogle(){
 const mcp=await mcpNs();
 if(!mcp){toast("Google Calendar sync works when the site is open in Claude. Use Import calendar file instead.");return;}
 const btn=$("#gcal");if(btn){btn.disabled=true;btn.textContent="Syncing…";}
 try{
  const [w0,w1]=windowRange();let input={};
  try{const d=await mcp.describeTool(GCAL,"list_events");const props=Object.keys(d?.inputSchema?.properties||{});
   for(const p of props){const l=p.toLowerCase();
    if(/time_?min|start_?(time|date)?$|^from|after/.test(l))input[p]=w0.toISOString();
    else if(/time_?max|end_?(time|date)?$|^to$|before|until/.test(l))input[p]=w1.toISOString();
    else if(/calendar_?id/.test(l))input[p]="primary";
    else if(/max_?results|limit|page_?size/.test(l))input[p]=250;
    else if(/single_?events|expand/.test(l))input[p]=true;
    else if(/order_?by/.test(l))input[p]="startTime";}}
  catch(e){input={timeMin:w0.toISOString(),timeMax:w1.toISOString(),calendarId:"primary",maxResults:250,singleEvents:true};}
  let res;try{res=await mcp.callTool(GCAL,"list_events",input);}
  catch(e){if(e?.code==="not_in_manifest"||e?.code==="tool_error"){const d=await mcp.describeTool(GCAL,"list_events").catch(()=>null);if(d){/* schema readable now that it is allowed: try once more with it */return syncGoogleRetry(mcp,d,w0,w1);}}throw e;}
  await finishGoogle(res);
 }catch(e){gcalError(e);}finally{if(btn){btn.disabled=false;btn.textContent="Sync Google Calendar";}}
}
async function syncGoogleRetry(mcp,d,w0,w1){const input={};for(const p of Object.keys(d?.inputSchema?.properties||{})){const l=p.toLowerCase();if(/time_?min|start/.test(l))input[p]=w0.toISOString();else if(/time_?max|end/.test(l))input[p]=w1.toISOString();else if(/calendar_?id/.test(l))input[p]="primary";else if(/max_?results|limit/.test(l))input[p]=250;}
 try{await finishGoogle(await mcp.callTool(GCAL,"list_events",input));}catch(e){gcalError(e);}}
async function finishGoogle(res){
 const list=findEvents(res?.payload??res)||[];const blocks=eventsToBlocks(list);
 const keep=getClasses().filter(c=>c.src!=="gcal");await setClasses(dedupe([...keep,...blocks]));
 local.set("tce_gcal_sync",Date.now());toast(blocks.length?`Synced ${blocks.length} event${blocks.length>1?"s":""} from Google Calendar`:"Google Calendar has no timed events in the next four weeks");render();}
function gcalError(e){const c=e?.code;
 const msg={server_not_connected:"Add Google Calendar in claude.ai Settings → Connectors, then sync again.",needs_reauth:"Reconnect Google Calendar in claude.ai Settings → Connectors.",selection_required:"Pick which Google Calendar connector to use in the prompt Claude shows, then sync again.",approval_required:"Allow this site to read your Google Calendar when Claude asks, then sync again.",not_in_manifest:"Calendar access was turned off for this site. Allow it and sync again.",blocked_by_policy:"Your organization blocks Google Calendar here. Use Import calendar file instead.",server_unavailable:"Google Calendar didn't answer. Try again in a moment.",not_granted:"Google Calendar sync works when the site is open in Claude.",capability_disabled:"Google Calendar sync works when the site is open in Claude."}[c];
 toast(msg||("Couldn't read Google Calendar"+(e?.message?": "+String(e.message).slice(0,120):".")));}

// Google Calendar's export is a .zip of .ics files: read it right in the browser
async function unzipTexts(buf){
 const v=new DataView(buf),u8=new Uint8Array(buf);let e=-1;
 for(let i=buf.byteLength-22;i>=Math.max(0,buf.byteLength-66000);i--)if(v.getUint32(i,true)===0x06054b50){e=i;break;}
 if(e<0)return[];const n=v.getUint16(e+10,true);let p=v.getUint32(e+16,true);const out=[];
 for(let k=0;k<n;k++){if(v.getUint32(p,true)!==0x02014b50)break;
  const method=v.getUint16(p+10,true),csize=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),off=v.getUint32(p+42,true);
  const name=new TextDecoder().decode(u8.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
  if(!/\.(ics|ical|csv)$/i.test(name))continue;
  const start=off+30+v.getUint16(off+26,true)+v.getUint16(off+28,true);const data=u8.subarray(start,start+csize);
  try{let text;if(method===0)text=new TextDecoder().decode(data);
   else if(method===8&&typeof DecompressionStream!=="undefined")text=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
   else continue;out.push(text);}catch(err){}}
 return out;
}
function scheduleSection(){
 const cl=getClasses();const halls=DATA.halls.filter(h=>h.college===S.user.college);
 const days=[0,1,2,3,4,5,6].map(i=>isoOf(addDays(now,i)));
 const rows=days.map(iso=>{const wd=dateFromIso(iso).getDay();
   const cells=halls.flatMap(h=>hoursFor(h,wd).map(([m,a,b])=>{const f=mealFit(iso,a,b);return `<div class="mf ${f.state}"><b>${esc(h.name.replace(" Dining Hall",""))} · ${MEALS[m]}</b><span>${fmtH(a)}–${fmtH(b)}</span><small>${esc(f.text)}</small></div>`;}));
   const mine=cl.filter(c=>c.date===iso);
   return `<div class="sday"><div class="sdname">${niceDate(iso).replace(" ","<br>")}</div><div class="sdclasses">${mine.length?mine.map(c=>`<span>${esc(c.name)} ${fmtH(c.start)}–${fmtH(c.end)}</span>`).join(""):`<span class="none">Nothing scheduled</span>`}</div><div class="sdmeals">${cells.join("")}</div></div>`;}).join("");
 const synced=local.get("tce_gcal_sync");const srcs=new Set(cl.map(c=>c.src));
 return `<section class="box"><h3>Your calendar</h3>
  <p class="legend">Bring in your calendar and we'll check each dining hall meal against what you actually have on that date. We read each event's real date, so a Monday seminar only affects the Mondays it meets. You need at least 25 free minutes during a meal for it to count.</p>
  <div class="calbtns"><button class="btn sm" id="impcal">Import calendar file</button><button class="btn sm ghost hidden" id="gcal">Sync Google Calendar</button>
   ${cl.length?`<button class="linkbtn red" id="clrcal">Remove all ${cl.length} event${cl.length>1?"s":""}</button>`:""}</div>
  ${synced&&srcs.has("gcal")?`<p class="note2">Google Calendar last synced ${new Date(synced).toLocaleString("en-US",{weekday:"short",hour:"numeric",minute:"2-digit"})}.</p>`:""}
  <details class="calhow"><summary>How to get your calendar file</summary>
   <p><b>Google Calendar:</b> on a computer, open Google Calendar, click the gear, then <i>Settings</i> → <i>Import &amp; export</i> → <i>Export</i>. You'll get a .zip. Import that .zip here as it is, no need to unzip it.</p>
   <p><b>Apple Calendar (Mac):</b> select your calendar in the sidebar, then <i>File</i> → <i>Export</i> → <i>Export…</i> to save an .ics.</p>
   <p><b>Outlook:</b> <i>File</i> → <i>Save Calendar</i> (Windows), or share your calendar and download the .ics link.</p>
   <p>Importing again replaces what you imported before, so re-import whenever your calendar changes. Everything is read on your device; only the dated busy times are saved.</p></details>
  <details><summary style="cursor:pointer;font-weight:600;color:var(--navy)">Add one event by hand</summary>
   <form id="addcls" class="addcls"><input name="n" placeholder="What is it? e.g. CHEM 103" maxlength="40" required><input name="d" type="date" required value="${isoOf(now)}"><input name="a" type="time" required value="11:00"><input name="b" type="time" required value="12:00"><label class="rep"><input type="checkbox" name="w"> Same time every week</label><button class="btn sm" type="submit">Add</button></form></details>
  <h4 class="schedh">Next 7 days at ${COLLEGES[S.user.college].name}</h4>
  <div class="sched">${rows}</div></section>`;
}
function wireSchedule(){
 const inp=$("#calInput");
 $("#gcal").onclick=()=>syncGoogle();
 mcpNs().then(m=>{if(m&&$("#gcal"))$("#gcal").classList.remove("hidden");});
 $("#impcal").onclick=()=>{inp.value="";inp.onchange=async()=>{const f=inp.files[0];if(!f)return;const text=await f.text();
   let texts=[text];if(/\.zip$/i.test(f.name)||text.startsWith("PK"))texts=await unzipTexts(await f.arrayBuffer());
   const list=dedupe(texts.flatMap(t=>/BEGIN:VCALENDAR/i.test(t)?parseICS(t):parseCSV(t)));
   if(!list.length){toast("No timed events in that file for the next few weeks.");return;}
   await setClasses(dedupe([...getClasses().filter(c=>c.src!=="ics"&&c.src!=="csv"),...list]));toast(`Imported ${list.length} event${list.length>1?"s":""} with their real dates`);render();};inp.click();};
 $("#clrcal")&&($("#clrcal").onclick=async()=>{await setClasses([]);local.set("tce_gcal_sync",null);render();});
 $("#addcls").onsubmit=async e=>{e.preventDefault();const f=e.target;const a=parseTime(f.a.value),b=parseTime(f.b.value);
   if(!f.d.value||a==null||b==null||!(b>a)){toast("Pick a date, and an end time after the start time.");return;}
   const [,w1]=windowRange();const list=[];for(let d=dateFromIso(f.d.value);d<=w1;d=addDays(d,7)){list.push({date:isoOf(d),start:a,end:b,name:f.n.value.trim()||"Busy",src:"manual"});if(!f.w.checked)break;}
   await setClasses(dedupe([...getClasses(),...list]));toast(list.length>1?`Added ${list.length} weekly meetings`:"Added");render();};
 document.querySelectorAll("#addcls input").forEach(i=>i.addEventListener("keydown",e=>e.stopPropagation()));
}

/* ================= dish reminders ================= */
// Saved privately with favorites. The page can't send email itself, so each upcoming serving gets
// one-click "add to calendar" links: Google Calendar / Outlook then email or notify you before it.
const Rem={set:new Set(local.get("tce_rem")||[]),has(id){return this.set.has(id);},
 async toggle(id){this.has(id)?this.set.delete(id):this.set.add(id);local.set("tce_rem",[...this.set]);await savePrefs();}};
async function savePrefs(){if(Shared.mode!=="shared")return;try{await Shared.db.doc("data/users/"+Shared.uid+"/prefs").set({favs:[...Shared.favs],classes:getClasses(),reminders:[...Rem.set]});}catch(e){}}
function upcoming(it){const t=ord(TODAY);return it.served.map(s=>{const h=HALL[s.hall];const hr=hoursFor(h,s.day).find(x=>x[0]===s.meal);return{...s,date:h.dates[s.day],hr};})
 .filter(s=>ord(s.date)>=t&&s.hr).filter(s=>!(s.date===TODAY&&s.hr[2]<=now.getHours()+now.getMinutes()/60)).sort((a,b)=>ord(a.date)-ord(b.date)||a.hr[1]-b.hr[1]);}
function stamp(iso,h){const [y,m,d]=iso.split("-");const hh=Math.floor(h),mm=Math.round((h-hh)*60);return `${y}${m}${d}T${pad(hh)}${pad(mm)}00`;}
function calLinks(it,s){const iso=isoFromLabel(s.date),h=HALL[s.hall];const title=`${it.name} at ${h.name}`;const det=`${it.name} is on the ${MEALS[s.meal].toLowerCase()} menu (${fmtH(s.hr[1])}–${fmtH(s.hr[2])}). Reminder from Tri-Co Eatmaxxing.`;
 const g=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(iso,s.hr[1])}/${stamp(iso,s.hr[2])}&ctz=America/New_York&details=${encodeURIComponent(det)}&location=${encodeURIComponent(h.name)}`;
 const off=-new Date(iso+"T12:00:00").getTimezoneOffset();const tz=(off>=0?"+":"-")+pad(Math.floor(Math.abs(off)/60))+":"+pad(Math.abs(off)%60);
 const t=x=>`${iso}T${pad(Math.floor(x))}:${pad(Math.round((x-Math.floor(x))*60))}:00${tz}`;
 const o=`https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${encodeURIComponent(t(s.hr[1]))}&enddt=${encodeURIComponent(t(s.hr[2]))}&body=${encodeURIComponent(det)}&location=${encodeURIComponent(h.name)}`;
 return `<a href="${g}" target="_blank" rel="noopener">Google Calendar</a><a href="${o}" target="_blank" rel="noopener">Outlook</a>`;}
const BELL=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>`;
function reminderBox(it){const up=upcoming(it);const on=Rem.has(it.id);
 return `<div class="box"><h3>Reminders</h3>
  <button class="btn sm ${on?"":"ghost"} remind" id="remtog" aria-pressed="${on}">${BELL}${on?"Reminding you":"Remind me when it's served"}</button>
  <p class="note2">${on?"You'll see a reminder at the top of the menus whenever this dish is on today or tomorrow. ":""}To get an email or phone alert, add a serving to your calendar. Google Calendar and Outlook then notify you before it (set the alert to email in the event if you prefer).</p>
  ${up.length?`<div class="rlist">${up.map(s=>`<div class="rr"><b>${s.date===TODAY?"Today":s.date} · ${MEALS[s.meal]} ${fmtH(s.hr[1])}–${fmtH(s.hr[2])}<br><small style="font-weight:500;color:var(--muted)">${esc(HALL[s.hall].name)}</small></b><span class="cal-links">${calLinks(it,s)}</span></div>`).join("")}</div>`
   :`<p class="legend" style="margin:8px 0 0">Not on any menu for the rest of the week we collected. Menus are collected once, so a reminder can only catch servings in that week.</p>`}</div>`;}
function reminderBanner(){if(!Rem.set.size)return"";const tom=isoOf(addDays(now,1));const rows=[];
 for(const id of Rem.set){const it=D[id];if(!it)continue;const byDay={};
  for(const s of upcoming(it)){const iso=isoFromLabel(s.date);if(iso!==isoOf(now)&&iso!==tom)continue;(byDay[iso]=byDay[iso]||[]).push(s);}
  for(const [iso,list] of Object.entries(byDay)){list.sort((x,y)=>(HALL[y.hall].college===S.user.college)-(HALL[x.hall].college===S.user.college)||x.hr[1]-y.hr[1]);
   rows.push(`<div><button data-open="${it.id}">${esc(it.name)}</button> is on ${iso===isoOf(now)?"today":"tomorrow"}: ${list.map(s=>`${esc(HALL[s.hall].name)} ${MEALS[s.meal].toLowerCase()} ${fmtH(s.hr[1])}–${fmtH(s.hr[2])}`).join("; ")}</div>`);}}
 if(!rows.length)return"";
 return `<div class="rbanner" role="status"><b style="display:flex;align-items:center;gap:6px;margin-bottom:4px">${BELL.replace("<svg",'<svg style="width:16px;height:16px"')}Your reminders</b>${rows.slice(0,5).join("")}${rows.length>5?`<div>and ${rows.length-5} more</div>`:""}</div>`;}
const GEAR=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

/* ================= Fuel: simple daily calorie + protein tracker for athletes ================= */
// Targets: protein 1.6–2.0 g per kg of body weight; calories scale with the day (rest / training / game).
const CAT_EST={"Breakfast":[300,14,30,14],"Entrées":[450,28,40,18],"Grill & Deli":[500,25,42,24],"Pizza & Pasta":[450,18,58,15],"Soups & Chili":[220,11,24,8],"Salads":[180,6,14,11],"Sides":[200,5,30,7],"Desserts & Bakery":[300,4,42,13]};
const DAYTYPES=[["rest","Rest day",30],["training","Training day",38],["game","Game day",44]];// kcal per kg
const GOALS_F=[["maintain","Maintain"],["build","Build muscle"],["cut","Lean out"]];
const Fuel={data:(()=>{const d=local.get("tce_fuel");return d&&typeof d==="object"&&d.days?d:{profile:null,days:{}};})(),
 day(iso){const d=this.data.days[iso];return d&&Array.isArray(d.items)?d:{items:[],type:"training"};},
 async save(){const keep=isoOf(addDays(now,-14));for(const k of Object.keys(this.data.days))if(k<keep)delete this.data.days[k];
  local.set("tce_fuel",this.data);if(Shared.mode==="shared"){try{await Shared.db.doc("data/users/"+Shared.uid+"/fuel").set(this.data);}catch(e){}}},
 async edit(f){const iso=isoOf(now);const d=JSON.parse(JSON.stringify(this.day(iso)));f(d);this.data.days[iso]=d;await this.save();}};
function dishMacros(it,hallId){const n=nutOf(it,hallId);const e=CAT_EST[it.category]||[350,15,40,14];
 if(n&&n.cal!=null&&n.protein!=null)return{cal:n.cal,p:n.protein,est:false};
 if(n&&n.cal!=null)return{cal:n.cal,p:Math.round(e[1]*n.cal/e[0]),est:true};
 return{cal:e[0],p:e[1],est:true};}
function fuelTargets(type){const P=Fuel.data.profile;if(!P||!P.weight)return null;const kg=P.weight/2.2046;
 const base=kg*((DAYTYPES.find(d=>d[0]===type)||DAYTYPES[1])[2]);
 const cal=Math.round(base*({maintain:1,build:1.1,cut:0.85}[P.goal]||1)/50)*50;
 const p=Math.round(kg*({maintain:1.6,build:1.8,cut:2.0}[P.goal]||1.6));return{cal,p};}
async function logDish(it,hallId){const m=dishMacros(it,hallId);await Fuel.edit(d=>d.items.push({id:"i"+Date.now().toString(36),dish:it.id,name:it.name,...m}));toast(`Added ${it.name} to today's Fuel`);}
function ring(label,val,target,unit){const pct=target?Math.min(1,val/target):0;const r=46,c=2*Math.PI*r;
 return `<div class="ring"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="${r}" class="rbg"/><circle cx="55" cy="55" r="${r}" class="rfg" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}" transform="rotate(-90 55 55)"/></svg>
  <div class="rtxt"><b>${Math.round(val)}<small>${unit}</small></b><span>of ${target}${unit}</span></div><div class="rlab">${label}</div></div>`;}
function renderFuel(){
 try{renderFuelInner();}catch(e){console.error(e);
  $("#app").innerHTML=header()+`<main><div class="hero"><h1>Fuel</h1></div><div class="alert warn">Fuel couldn't load your saved data. <button class="btn sm" id="freset">Start fresh</button></div>${footer()}</main>`;
  wireHeader();$("#freset").onclick=async()=>{Fuel.data={profile:null,days:{}};await Fuel.save();renderFuel();};}
}
function renderFuelInner(){
 const P=Fuel.data.profile;const iso=isoOf(now);const d=Fuel.day(iso);
 const setupForm=(btn)=>`<div class="fgrid"><label>Weight (lb)<input class="inp" id="fw" type="number" inputmode="decimal" min="70" max="400" value="${P?.weight||""}" placeholder="165"></label>
   <label>Goal<select class="sel" id="fgoal">${GOALS_F.map(([v,l])=>`<option value="${v}" ${P?.goal===v?"selected":""}>${l}</option>`).join("")}</select></label></div>
  <div class="err" id="ferr"></div><button class="btn" id="fsave" style="margin-top:12px">${btn}</button>`;
 if(!P){
  $("#app").innerHTML=header()+`<main><div class="hero"><h1>Fuel</h1></div>
   <section class="box fstart"><h3>Track calories and protein</h3><p class="legend">Two quick questions and you're set. Your targets go up on training and game days.</p>${setupForm("Start")}</section>${footer()}</main>`;
  wireHeader();wireSetup();return;}
 const T=fuelTargets(d.type);const k=x=>+x.servings||1;const tot=d.items.reduce((a,x)=>({cal:a.cal+(+x.cal||0)*k(x),p:a.p+(+x.p||0)*k(x)}),{cal:0,p:0});
 $("#app").innerHTML=header()+`<main><div class="hero"><h1>Fuel</h1></div>
  <div class="seg days" role="radiogroup" aria-label="Today is a">${DAYTYPES.map(([k,l])=>`<button data-dt="${k}" class="${d.type===k?"on":""}" role="radio" aria-checked="${d.type===k}">${l}</button>`).join("")}</div>
  <section class="box fsum">${ring("Calories",tot.cal,T.cal,"")}${ring("Protein",tot.p,T.p,"g")}
   <p class="note2" style="grid-column:1/-1;text-align:center;margin:0">${tot.cal>=T.cal&&tot.p>=T.p?"You've hit both targets today. Nice work.":`${Math.max(0,T.cal-Math.round(tot.cal))} calories and ${Math.max(0,T.p-Math.round(tot.p))}g protein to go.`}</p></section>
  <section class="box"><h3>Add food</h3>
   <div class="search fsearch"><input class="inp" id="fq" type="text" placeholder="Search dining hall dishes" autocomplete="off"><div class="sresults hidden" id="fres"></div></div>
   <form id="fcustom" class="frow"><input class="inp" name="n" maxlength="50" placeholder="Something else" aria-label="Food"><input class="inp" name="cal" type="number" min="0" placeholder="Cal" aria-label="Calories"><input class="inp" name="p" type="number" min="0" placeholder="Protein g" aria-label="Protein grams"><button class="btn sm" type="submit">Add</button></form></section>
  <section class="box"><h3>Today</h3>${d.items.length?d.items.map(x=>`<div class="fitem"><span>${x.dish&&D[x.dish]?`<button class="linkbtn" data-open="${x.dish}">${esc(x.name)}</button>`:esc(x.name)}${x.est?' <span class="est" title="Estimated from a typical serving">est.</span>':""}</span><span class="fnum">${Math.round((+x.cal||0)*k(x))} cal · ${Math.round((+x.p||0)*k(x))}g</span><button class="fx" data-del="${x.id}" aria-label="Remove ${esc(x.name)}">✕</button></div>`).join(""):`<p class="legend" style="margin:0">Nothing yet. Search a dish above, or tap "Add to Fuel" on any dish page.</p>`}
   ${d.items.some(x=>x.est)?`<p class="note2">"est." means the dining hall hasn't published that dish's nutrition, so it's a typical serving.</p>`:""}</section>
  <details class="box fset"><summary class="sumlink">Settings: ${P.weight} lb · ${GOALS_F.find(g=>g[0]===P.goal)?.[1]||"Maintain"}</summary><div style="margin-top:12px">${setupForm("Save")}
   <p class="note2">Targets are a starting point, not medical advice. On hard days, eating too little hurts performance more than eating a bit over. Your team's athletic trainer or a sports dietitian can set targets for you.</p></div></details>
  ${footer()}</main>`;
 wireHeader();wireSetup();
 document.querySelectorAll("[data-dt]").forEach(b=>b.onclick=async()=>{await Fuel.edit(x=>x.type=b.dataset.dt);renderFuel();});
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{await Fuel.edit(x=>x.items=x.items.filter(i=>i.id!==b.dataset.del));renderFuel();});
 document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openDish(b.dataset.open));
 $("#fcustom").onsubmit=async e=>{e.preventDefault();const f=e.target;const n=f.n.value.trim(),cal=+f.cal.value,p=+f.p.value||0;
  if(!n||!(cal>0)){toast("Add a name and calories.");return;}if(hasBad(n)){toast(MOD_MSG);return;}
  await Fuel.edit(x=>x.items.push({id:"i"+Date.now().toString(36),name:n,cal,p,est:false}));renderFuel();};
 document.querySelectorAll("#fcustom input,#fq").forEach(i=>i.addEventListener("keydown",e=>e.stopPropagation()));
 const q=$("#fq"),box=$("#fres");
 q.oninput=()=>{const res=searchDishes(q.value);if(!q.value.trim()){box.classList.add("hidden");return;}
  box.innerHTML=res.length?res.map(it=>{const n=nextServing(it);const m=dishMacros(it,n.hall);return `<div class="sres" data-add="${it.id}|${n.hall}"><div class="t" style="${stockSrc(it)?`background-image:url('${stockSrc(it)}')`:""}"></div><div><b>${esc(it.name)}</b><small>${m.cal} cal · ${m.p}g protein${m.est?" (est.)":""}</small></div></div>`;}).join(""):`<div class="sempty">No dishes match.</div>`;
  box.classList.remove("hidden");
  box.querySelectorAll("[data-add]").forEach(r=>r.onmousedown=async e=>{e.preventDefault();const [id,h]=r.dataset.add.split("|");await logDish(D[id],h);renderFuel();});};
 q.onblur=()=>setTimeout(()=>box.classList.add("hidden"),150);
}
function wireSetup(){$("#fw").addEventListener("keydown",e=>e.stopPropagation());
 $("#fsave").onclick=async()=>{const w=parseFloat($("#fw").value);if(!(w>=70&&w<=400)){$("#ferr").textContent="Enter your weight in pounds.";return;}
  Fuel.data.profile={weight:w,goal:$("#fgoal").value};await Fuel.save();toast("Saved");renderFuel();};}
function logBox(it,hallId){const m=dishMacros(it,hallId);
 return `<div class="box flog"><div><b>${m.cal} cal · ${m.p}g protein</b>${m.est?` <span class="est">est.</span>`:""}<div class="legend" style="margin:2px 0 0">per serving</div></div><button class="btn sm" id="logit">Add to Fuel</button></div>`;}

/* ================= profile picture + name ================= */
function avatarHTML(name,src,cls=""){const ok=typeof src==="string"&&/^data:image\/(jpeg|png|webp);base64,/.test(src);
 return ok?`<span class="av ${cls}" style="background-image:url('${src}')" role="img" aria-label="${esc(name)}"></span>`:`<span class="av ${cls}" aria-hidden="true">${esc((name||"?").trim()[0]?.toUpperCase()||"?")}</span>`;}
function squareAvatar(file,size=160){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);
 img.onload=()=>{const s=Math.min(img.width,img.height);const c=document.createElement("canvas");c.width=c.height=size;
  c.getContext("2d").drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,size,size);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",.8));};
 img.onerror=()=>{URL.revokeObjectURL(url);rej();};img.src=url;});}
function openProfileEditor(){
 let pic=S.user.avatar||null;
 const m=document.createElement("div");m.className="modal";
 const draw=()=>{m.innerHTML=`<div class="card" role="dialog" aria-label="Change profile photo"><h2 style="margin-bottom:14px">Profile photo</h2>
  <div class="pedit">${avatarHTML(S.user.name,pic,"xl")}<div><button class="btn sm ghost" id="ppick">${pic?"Change photo":"Upload photo"}</button>${pic?` <button class="linkbtn red" id="prm" style="margin-left:8px">Remove</button>`:""}<p class="note2">Square crop from the middle. Everyone at the Tri-Co can see it on your posts, reviews and the leaderboard.</p></div></div>
  <div class="f">Name</div><div class="lockname">${esc(S.user.name)}</div><p class="note2">Names can't be changed after signing up.</p>
  <div class="nav-row"><button class="btn ghost" id="pcancel">Cancel</button><button class="btn" id="psave">Save</button></div></div>`;
  m.querySelector("#ppick").onclick=()=>{const inp=$("#photoInput");inp.multiple=false;inp.value="";inp.onchange=async()=>{const f=inp.files[0];if(!f||!f.type.startsWith("image/"))return;try{pic=await squareAvatar(f);draw();}catch(e){toast("Couldn't read that image.");}};inp.click();};
  m.querySelector("#prm")&&(m.querySelector("#prm").onclick=()=>{pic=null;draw();});
  m.querySelector("#pcancel").onclick=()=>m.remove();
  m.querySelector("#psave").onclick=async()=>{S.user={...S.user,avatar:pic||null};local.set("tce_user",S.user);saveProfile();
   if(Shared.mode==="shared"||Shared.docs[Shared.uid])await Shared.saveMine(Shared.mine());
   m.remove();toast("Photo updated");render();};};
 m.onclick=e=>{if(e.target===m)m.remove();};draw();document.body.appendChild(m);
}

/* ================= karma ================= */
function karmaTable(){
 const users={};const u=uid=>users[uid]=users[uid]||{uid,...Shared.who(uid),posts:0,likes:0,comments:0,reviews:0,photos:0};
 for(const [uid,doc] of Object.entries(Shared.docs)){const me=u(uid);
  Object.values(doc?.reviews||{}).forEach(r=>{me.reviews++;me.photos+=(r.photos||[]).length;});
  for(const [k,v] of Object.entries(doc?.likes||{})){if(v){const owner=k.split("~")[0];if(owner!==uid&&Shared.docs[owner]?.posts?.[k.split("~")[1]])u(owner).likes++;}}
  for(const [k,arr] of Object.entries(doc?.comments||{})){const owner=k.split("~")[0];if(owner!==uid&&Shared.docs[owner]?.posts?.[k.split("~")[1]])u(owner).comments+=(arr||[]).length;}
  me.posts=Object.keys(doc?.posts||{}).length;}
 return Object.values(users).map(x=>({...x,karma:x.likes*10+x.comments*3+x.posts*5+x.reviews*2+x.photos*3})).sort((a,b)=>b.karma-a.karma);
}
const KARMA_RULES="Each like on your plate is 10, each comment from someone else 3, each plate you post 5, each dish review 2 and each review photo 3. Likes on your own plates don't count.";

/* ================= profile ================= */
function renderProfile(){
 const kt=karmaTable();const me=kt.find(x=>x.uid===Shared.uid)||{karma:0,likes:0,comments:0,posts:0,reviews:0,photos:0};
 const rank=kt.findIndex(x=>x.uid===Shared.uid)+1;
 const favs=[...Shared.favs].map(id=>D[id]).filter(Boolean);const t=ord(TODAY);
 const favRows=favs.map(it=>{const sv=it.served.map(s=>({...s,date:HALL[s.hall].dates[s.day]})).sort((a,b)=>ord(a.date)-ord(b.date));const up=sv.filter(s=>ord(s.date)>=t);return{it,sv,up};})
   .sort((a,b)=>(b.up.length>0)-(a.up.length>0)||(a.up[0]?ord(a.up[0].date):0)-(b.up[0]?ord(b.up[0].date):0));
 $("#app").innerHTML=header()+`<main>
  <div class="profhead"><button class="bigavbtn" id="pav" aria-label="Change profile photo">${avatarHTML(S.user.name,S.user.avatar,"big")}<span>Edit</span></button>
   <div><h1>${esc(S.user.name)}</h1><div class="legend" style="margin:2px 0 0">${esc(S.user.email)} · ${COLLEGES[S.user.college].name}</div></div>
   <div class="karma"><b>${me.karma}</b><span>karma${rank?` · #${rank}`:""}</span></div></div>
  <div class="pbtns"><button class="btn sm ghost" id="pprof">Change photo</button><button class="btn sm ghost" id="pedit">Edit dining preferences</button><button class="btn sm ghost" id="pfuel">Fuel tracker</button><button class="btn sm ghost" id="pout">Sign out</button></div>
  <section class="box"><h3>Karma</h3><div class="kgrid"><div><b>${me.likes}</b>likes on your plates</div><div><b>${me.comments}</b>comments received</div><div><b>${me.posts}</b>plates posted</div><div><b>${me.reviews}</b>dish reviews</div><div><b>${me.photos}</b>review photos</div></div>
   <p class="note2">${KARMA_RULES} <button class="linkbtn" id="goleaders">See the leaderboard</button></p></section>
  <section class="box"><h3>Favorites (${favs.length})</h3>
   ${favRows.length?favRows.map(({it,sv,up})=>`<div class="fav-row">${pic(it)}<div><div class="nm" style="font-weight:700;font-size:16px;color:var(--navy);cursor:pointer" data-open="${it.id}">${esc(it.name)}</div>
    <div class="when">${(up.length?up:sv).map(s=>`<span class="${s.date===TODAY?"today":""}">${s.date===TODAY?"Today":s.date} · ${MEALS[s.meal]} · ${esc(HALL[s.hall].name)}</span>`).join("")}${up.length?"":`<div style="color:var(--muted);margin-top:4px">Not on any menu for the rest of this week.</div>`}</div></div>${heartBtn(it.id,true)}</div>`).join("")
    :`<p class="legend">No favorites yet. Tap the heart next to any dish to save it here and see when it's served.</p>`}</section>
  ${scheduleSection()}
  ${footer()}</main>`;
 wireHeader();wireHearts();wireSchedule();
 document.querySelectorAll("[data-open]").forEach(e=>e.onclick=()=>openDish(e.dataset.open));
 $("#pedit").onclick=()=>{S.view="survey";S.step=0;S.draft=null;render();};
 $("#pprof").onclick=openProfileEditor;$("#pav").onclick=openProfileEditor;$("#pfuel").onclick=()=>go("fuel");
 $("#pout").onclick=()=>signOut();
 $("#goleaders").onclick=()=>go("leaders");
}

/* ================= leaderboard ================= */
/* ================= people: public profiles ================= */
function rankOf(uid,kt=karmaTable()){const i=kt.findIndex(x=>x.uid===uid);return i<0?0:kt.filter(x=>x.karma>kt[i].karma).length+1;}
function userLink(uid,name,cls=""){return `<button class="ulink ${cls}" data-user="${esc(uid)}">${esc(name)}</button>`;}
function openUser(uid){if(!uid)return;if(S.view!=="user")S.prevView=S.view==="detail"?"home":S.view;if(uid===Shared.uid){go("profile");return;}S.viewUid=uid;S.view="user";render();scrollTo(0,0);}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-user]");if(b){e.preventDefault();e.stopPropagation();openUser(b.dataset.user);}},true);
function karmaGrid(x,you){return `<div class="kgrid"><div><b>${x.likes}</b>likes on ${you?"your":"their"} plates</div><div><b>${x.comments}</b>comments received</div><div><b>${x.posts}</b>plates posted</div><div><b>${x.reviews}</b>dish reviews</div><div><b>${x.photos}</b>review photos</div></div>`;}
function renderUser(){
 const uid=S.viewUid;const kt=karmaTable();const who=Shared.who(uid);
 const x=kt.find(k=>k.uid===uid)||{uid,...who,karma:0,likes:0,comments:0,posts:0,reviews:0,photos:0};
 const rank=rankOf(uid,kt);const total=kt.length;
 const plates=Shared.posts().filter(p=>p.uid===uid).sort((a,b)=>b.ts-a.ts);
 const doc=Shared.docs[uid]||{};
 const reviews=Object.entries(doc.reviews||{}).filter(([id,r])=>D[id]&&r&&typeof r.stars==="number"&&!Shared.hidden('review:'+uid+'|'+id,uid)).map(([id,r])=>({id,...r,text:clean(r.text)})).sort((a,b)=>(b.ts||0)-(a.ts||0));
 const known=!!Shared.docs[uid];
 const cmts=[];for(const [key,arr] of Object.entries(doc.comments||{})){const [owner,pid]=key.split("~");const post=Shared.docs[owner]?.posts?.[pid];if(!post)continue;
  (arr||[]).forEach((c,i)=>{const rk='cmt:'+key+'|'+uid+'|'+(c.ts||i);if(!Shared.hidden(rk,uid))cmts.push({text:clean(c.text),ts:c.ts||0,owner,title:clean(post.title||"a plate"),ownerName:Shared.who(owner).name});});}
 cmts.sort((a,b)=>b.ts-a.ts);
 $("#app").innerHTML=header()+`<main>
  <button class="linkbtn" id="uback" style="margin-bottom:12px">← Back</button>
  ${known?`<div class="profhead">${avatarHTML(x.name,who.avatar,"big")}
   <div><h1>${esc(x.name)}</h1><div class="legend" style="margin:2px 0 0">${COLLEGES[who.college]?.name||""}</div></div>
   <div class="karma"><b>${x.karma}</b><span>karma${rank?` · #${rank} of ${total}`:""}</span></div></div>
  <section class="box"><h3>Karma</h3>${karmaGrid(x,false)}<p class="note2">${KARMA_RULES}</p></section>
  <section class="box"><h3>Plates (${plates.length})</h3>${plates.length?`<div class="ugrid">${plates.map(p=>`<button class="uplate" data-zoom="${esc(p.src)}" aria-label="${esc(p.title||"Plate")}"><span class="ph" style="background-image:url('${esc(p.src)}')"></span><b>${esc(p.title||"Plate")}</b><small>${HEART} ${p.likes} · ${p.comments.length} comment${p.comments.length===1?"":"s"}</small></button>`).join("")}</div>`:`<p class="legend" style="margin:0">No plates posted yet.</p>`}</section>
  <section class="box"><h3>Comments (${cmts.length})</h3>${cmts.length?cmts.slice(0,30).map(c=>`<div class="urev">“${esc(c.text)}”<div class="legend" style="margin:2px 0 0">on ${c.owner===uid?"their own":`${userLink(c.owner,c.ownerName)}'s`} plate <b>${esc(c.title)}</b> · ${ago(c.ts)}</div></div>`).join(""):`<p class="legend" style="margin:0">No comments yet.</p>`}</section>
  <section class="box"><h3>Reviews (${reviews.length})</h3>${reviews.length?reviews.map(r=>`<div class="urev"><button class="linkbtn" data-open="${r.id}" style="font-weight:700">${esc(D[r.id].name)}</button> <span class="stars" style="font-size:13px">${stars(r.stars)}</span>${r.text?`<p>${esc(r.text)}</p>`:""}</div>`).join(""):`<p class="legend" style="margin:0">No reviews yet.</p>`}</section>`
  :`<div class="empty">This student's profile isn't available.</div>`}
  ${footer()}</main>`;
 wireHeader();
 $("#uback").onclick=()=>{history.length>1&&S.prevView?go(S.prevView):go("leaders");};
 document.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>showImage(b.dataset.zoom));
 document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openDish(b.dataset.open));
}
function signOut(){return(async()=>{rememberAccount();if(Shared.backend==="supabase"){try{await sbClient.auth.signOut();}catch(e){}Shared.mode="signedout";Shared.backend=null;Shared.uid="local";Shared.docs={};}local.del("tce_user");S.user=null;S.menuOpen=false;S.view=null;S.draft=null;S.tab=null;S.authMode="login";render();})();}

function renderLeaders(){
 const all=karmaTable();const kt=all.filter(x=>x.karma>0);const plates=Shared.posts().sort((a,b)=>b.likes-a.likes||b.ts-a.ts).slice(0,5);
 const me=all.find(x=>x.uid===Shared.uid)||{karma:0,likes:0,comments:0,posts:0,reviews:0,photos:0};const myRank=me.karma>0?rankOf(Shared.uid,kt):0;
 const row=(x,i)=>`<button class="lbrow ${x.uid===Shared.uid?"me":""}" data-user="${esc(x.uid)}"><span class="rk">${rankOf(x.uid,kt)}</span>${avatarHTML(x.name,x.avatar,"lb")}<div><b>${esc(x.name)}${x.uid===Shared.uid?" (you)":""}</b><small>${COLLEGES[x.college]?.name||""} · ${x.posts} plate${x.posts===1?"":"s"}, ${x.likes} like${x.likes===1?"":"s"}</small></div><span class="lbscore">${x.karma}</span></button>`;
 $("#app").innerHTML=header()+`<main><div class="hero"><h1>Leaderboard</h1></div>
  <button class="mycard" data-user="${esc(Shared.uid)}">${avatarHTML(S.user.name,S.user.avatar,"big")}
   <div><span class="kicker">You</span><b>${esc(S.user.name)}</b><small>${myRank?`#${myRank} of ${kt.length} on the leaderboard`:"Not on the board yet. Post a plate or review a dish to start earning karma."}</small></div>
   <div class="karma"><b>${me.karma}</b><span>karma</span></div></button>
  <div class="lbwrap"><section class="box"><h3>Top 5 plates</h3>
   ${plates.length?plates.map((p,i)=>`<div class="lbrow"><span class="rk">${i+1}</span><button class="lbimg" data-zoom="${esc(p.src)}" style="background-image:url('${esc(p.src)}')" aria-label="View photo"></button><div><b>${esc(p.title||"Plate")}</b><small class="lbwho">${avatarHTML(p.name,p.avatar,"xs")}${userLink(p.uid,p.name)} · ${COLLEGES[p.college].name}</small></div><span class="lbscore">${p.likes} like${p.likes===1?"":"s"}</span></div>`).join("")
    :`<p class="legend">No plates yet. Post one on Rate My Plate.</p>`}</section>
  <section class="box"><h3>Top 5 students</h3>
   ${kt.slice(0,5).map(row).join("")}${myRank>0&&myRank<=5?"":`${kt.length>5?`<div class="lbgap">⋯</div>`:""}<div class="lbrow me" aria-label="Your standing"><span class="rk">${myRank||"–"}</span>${avatarHTML(S.user.name,S.user.avatar,"lb")}<div><b>${esc(S.user.name.split(" ")[0])} (you)</b><small>${myRank?`Your rank out of ${kt.length}`:"Not ranked yet. Post a plate or review a dish."}</small></div><span class="lbscore">${me.karma}</span></div>`}${kt.length?"":`<p class="legend">Nobody has karma yet.</p>`}
   <p class="note2">${KARMA_RULES} Tap anyone to see their profile.</p></section></div>
  ${Shared.mode==="local"?`<div class="note">You're seeing only this browser's activity.</div>`:""}
  ${footer()}</main>`;
 wireHeader();document.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>showImage(b.dataset.zoom));
}

/* ================= router ================= */
function render(){applyThemeOnce();if(!S.user){S.view==="survey"?renderSurvey():S.view==="verify"&&S.draft?renderVerify():renderRegister();}else if(S.view==="survey")renderSurvey();else if(S.view==="detail")renderDetail();else if(S.view==="favs"||S.view==="profile")renderProfile();else if(S.view==="feed")renderFeed();else if(S.view==="leaders")renderLeaders();else if(S.view==="fuel")renderFuel();else if(S.view==="user")renderUser();else renderHome();bottomNav();if(typeof onScroll==="function")onScroll();}
function go(v){S.view=v;S.menuOpen=false;render();scrollTo(0,0);}
function bottomNav(){let n=$("#bnav");if(!S.user||S.view==="survey"){n&&n.remove();return;}if(!n){n=document.createElement("nav");n.id="bnav";n.className="bnav";n.setAttribute("aria-label","Main");document.body.appendChild(n);}
 const cur=S.view==="detail"?"home":S.view;n.innerHTML=[["home","Menus"],["feed","Rate My Plate"],["leaders","Leaders"],["profile","Profile"],["fuel","Fuel"]].map(([v,l])=>`<button data-go="${v}" class="${cur===v?"on":""}" aria-current="${cur===v?"page":"false"}">${l}</button>`).join("");
 n.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{if(b.dataset.go==="home"){S.tab=S.tab||S.user.college;}go(b.dataset.go);});}
let themed=false;function applyThemeOnce(){if(!themed){themed=true;applyTheme(false);}}
const WORDMARK=`<img src="site/img/logo-dark.png" alt="Tri-Co Eatmaxxing">`;
const WORDMARK_H=()=>`<img class="lg-dark" src="site/img/logo-dark.png" alt="Tri-Co Eatmaxxing"><img class="lg-light" src="site/img/logo-light.png" alt="" aria-hidden="true">`;
const onScroll=()=>document.body.classList.toggle("scrolled",window.scrollY>8);
window.addEventListener("scroll",onScroll,{passive:true});
const collegeOf=raw=>{const email=String(raw||"").replace(/[\s\u00a0\u200b-\u200d\u2060\ufeff]/g,"").toLowerCase();const g=CFG.guestEmails&&CFG.guestEmails[email.trim().toLowerCase()];if(g&&COLLEGES[g])return g;const m=/^[^@\s]+@([a-z0-9.-]+)$/i.exec(email.trim());if(!m)return null;const dom=m[1].toLowerCase();return Object.keys(COLLEGES).find(k=>dom===COLLEGES[k].domain)||null;};

/* ================= registration ================= */
function renderRegister(){
 const mode=S.authMode||"signup";const d=S.draft||{name:"",email:""};
 const complete=mode==="complete";
 const heads={signup:["Create your account","This week's dining halls, filtered for you."],login:["Welcome back","Log in to Eatmaxxing."],complete:["Almost done","What should we call you?"]};
 $("#app").innerHTML=`<div class="shell"><div class="panel" id="reg">
  <div class="wordmark">${WORDMARK}</div>
  ${complete?"":`<div class="authtabs" role="tablist">${[["signup","Sign up"],["login","Log in"]].map(([k,l])=>`<button role="tab" aria-selected="${mode===k}" class="${mode===k?"on":""}" data-am="${k}">${l}</button>`).join("")}</div>`}
  <div class="kicker">${heads[mode][0]}</div>
  <h1 style="font-size:30px;margin-top:6px">${heads[mode][1]}</h1>
  <p class="sub">${mode==="login"?"Enter the school email you signed up with.":complete?`Signed in as <b>${esc(d.email)}</b>. Your name can't be changed later.`:"Bryn Mawr, Haverford and Swarthmore menus in one place."}</p>
  ${mode==="login"?"":`<label class="f" for="nm">Name</label><input class="inp" id="nm" type="text" value="${esc(d.name||"")}" placeholder="Jordan Lee" autocomplete="off" spellcheck="false">${complete?"":`<p class="note2" style="margin:-4px 0 6px">You can't change your name after signing up.</p>`}`}
  ${complete?"":`<label class="f" for="em">School email</label><input class="inp" id="em" type="text" inputmode="email" autocapitalize="off" value="${esc(d.email||"")}" placeholder="jlee@haverford.edu" autocomplete="off" spellcheck="false">
  <div class="logos" aria-live="polite">${Object.entries(COLLEGES).map(([k,c])=>`<div class="logo-badge" data-c="${k}" style="--c:${c.color}"><span class="mono">${c.mono}</span><span class="nm">${c.name}</span></div>`).join("")}</div>`}
  <div class="okmsg" id="ok"></div><div class="err" id="err"></div>
  ${S.signinNote?`<div class="okmsg" style="margin-bottom:10px">${esc(S.signinNote)}</div>`:""}
  <button class="btn full" type="button" id="go">${complete?"Continue to dining survey":SUPA_ON?"Email me a code":mode==="login"?"Log in":"Continue to dining survey"}</button>
  ${complete?"":`<p class="verify">${mode==="login"?`New here? <button class="linkbtn" data-am="signup">Create an account</button>`:`Already have an account? <button class="linkbtn" data-am="login">Log in</button>`}<br>Only @brynmawr.edu, @haverford.edu and @swarthmore.edu addresses can join.${SUPA_ON?" We email you a code to prove the address is yours.":""}</p>`}</div></div>`;
 document.querySelectorAll("[data-am]").forEach(b=>b.onclick=()=>{const em=$("#em")?.value||d.email||"",nm=$("#nm")?.value||d.name||"";S.draft={...(S.draft||{}),email:em,name:nm};S.authMode=b.dataset.am;S.signinNote="";render();});
 const upd=()=>{if(!$("#em"))return;const k=collegeOf($("#em").value);document.querySelectorAll(".logo-badge").forEach(b=>{b.classList.toggle("on",b.dataset.c===k);b.classList.toggle("dim",!!k&&b.dataset.c!==k);});$("#ok").textContent=k?`${COLLEGES[k].name} email recognised.`:"";if(k)$("#err").textContent="";};
 $("#em")&&$("#em").addEventListener("input",upd);upd();
 document.querySelectorAll("#reg .inp").forEach(i=>{i.addEventListener("pointerdown",()=>setTimeout(()=>i.focus(),0));i.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter"){e.preventDefault();submit();}});});
 setTimeout(()=>{try{($("#nm")||$("#em")).focus()}catch(e){}},50);
 $("#go").onclick=submit;
 function checkName(name){if(!name)return"Please enter your name.";if(name.length<2||name.length>40||!/^[\p{L}][\p{L}\p{M}\p{N} .'’-]*$/u.test(name))return"Use your name: letters, numbers, spaces, hyphens and apostrophes.";if(hasBad(name))return MOD_MSG;return"";}
 function busy(on,label){const b=$("#go");b.disabled=on;if(label)b.textContent=label;}
 async function submit(){const err=m=>{$("#err").textContent=m;};
  if(complete){const name=$("#nm").value.trim().replace(/\s+/g," ");const m=checkName(name);if(m)return err(m);
   S.draft={...d,name,college:d.college||collegeOf(d.email),prefs:d.prefs||{diets:[],allergens:[],cuisines:{},goals:[]}};S.authMode="signup";S.view="survey";S.step=0;render();return;}
  const email=$("#em").value.replace(/[\s ​-‍⁠﻿]/g,"").toLowerCase();const k=collegeOf(email);
  const name=mode==="signup"?$("#nm").value.trim().replace(/\s+/g," "):"";
  if(mode==="signup"){const m=checkName(name);if(m)return err(m);}
  if(!/^[a-z0-9._%+'-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(email))return err("That doesn't look like a valid email address.");
  if(!k)return err("Only Bryn Mawr, Haverford and Swarthmore students can join. Use your @brynmawr.edu, @haverford.edu or @swarthmore.edu address.");
  S.draft={name,email,college:k,mode,prefs:{diets:[],allergens:[],cuisines:{},goals:[]}};
  if(SUPA_ON){busy(true,"Sending code…");
   try{await sendCode(email,{create:mode==="signup"});S.view="verify";render();}
   catch(e){err(e.noAccount?"There's no account with that email yet. Sign up instead.":e.message);busy(false,"Email me a code");}
   return;}
  // without the database: accounts are remembered per device (and per Claude user inside Claude)
  busy(true);const found=await findAccount(email);busy(false);
  if(mode==="login"){if(!found)return err("There's no account with that email on this device yet. Sign up instead.");finishLogin(found);return;}
  if(found)return err("You already have an account with that email. Log in instead.");
  S.view="survey";S.step=0;render();}
}
function localAccounts(){return local.get("tce_accounts")||{};}
function rememberAccount(){if(!S.user?.email)return;const a=localAccounts();a[S.user.email]=S.user;local.set("tce_accounts",a);}
function getProfileDoc(){return new Promise(res=>{if(Shared.mode!=="shared"||!Shared.db)return res(null);const ref=Shared.db.doc("data/users/"+Shared.uid+"/profile");
 if(ref.get){ref.get().then(res,()=>res(null));return;}let done=false;const t=setTimeout(()=>{if(!done){done=true;res(null);}},4000);
 try{ref.onSnapshot(s=>{if(done)return;done=true;clearTimeout(t);res(s&&s.exists?s.data():null);},()=>{if(!done){done=true;clearTimeout(t);res(null);}});}catch(e){done=true;clearTimeout(t);res(null);}});}
async function findAccount(email){const a=localAccounts()[email];if(a)return a;const p=await getProfileDoc();if(p&&p.email===email)return p;
 const mine=Shared.docs?.[Shared.uid];if(mine&&mine.email===email)return null;return null;}
function finishLogin(u,note){S.user=u;local.set("tce_user",S.user);rememberAccount();S.pendingUser=null;S.draft=null;S.authMode="signup";S.signinNote="";S.view="home";S.tab=S.user.college;S.day=null;render();toast(note||`Welcome back, ${S.user.name.split(" ")[0]}!`);}

/* ================= survey ================= */
const STEPS=[{key:"diets",kick:"Restrictions",title:"Any dietary restrictions?",hint:"Select all that apply.",list:DIETS},
 {key:"allergens",kick:"Allergens",title:"Anything you're allergic to?",hint:"Dishes the colleges say contain these will be hidden. Dishes without allergen labels are flagged.",list:ALLERGENS,warn:true},
 {key:"cuisines",kick:"Cuisines",title:"Cuisines you like or dislike",hint:"Click once to like, twice to dislike, three times to clear.",list:CUISINES,tri:true},
 {key:"goals",kick:"Health goals",title:"What are your health goals?",hint:"We'll point out dishes that look like a good fit.",list:GOALS}];
function renderSurvey(){
 if(S.user&&!S.draft)S.draft={...S.user,prefs:JSON.parse(JSON.stringify(S.user.prefs))};
 const st=STEPS[S.step],p=S.draft.prefs;
 $("#app").innerHTML=`<div class="shell"><div class="panel wide">
  <div class="wordmark">${WORDMARK}</div>
  <div class="progress"><i style="width:${(S.step+1)/STEPS.length*100}%"></i></div>
  <div class="kicker">Step ${S.step+1} of ${STEPS.length} · ${st.kick}</div>
  <h1 style="font-size:28px;margin-top:6px">${st.title}</h1><p class="legend">${st.hint}</p>
  <div class="tiles">${st.list.map(o=>{let cls="",t="";
    if(st.tri){const v=p.cuisines[o.k];if(v==="like"){cls="on";t="Like"}if(v==="dislike"){cls="dis";t="Dislike"}}
    else if(p[st.key].includes(o.k)){cls="on";t=st.warn?"Avoid":"Selected"}
    return `<button type="button" class="tile ${cls}" data-k="${o.k}"><span class="lb">${o.label}</span><span class="st">${t}</span></button>`}).join("")}</div>
  ${S.step===0?`<p class="legend" style="margin-top:14px">Keto, low-carb and low-sugar aren't labeled by the dining halls, so they're saved but can't filter yet.</p>`:""}
  <div class="nav-row"><button class="btn ghost" id="bk">${S.step===0&&S.user?"Cancel":"Back"}</button><button class="btn" id="nx">${S.step===STEPS.length-1?(S.user?"Save preferences":"See menus"):"Next"}</button></div></div></div>`;
 document.querySelectorAll(".tile").forEach(c=>c.onclick=()=>{const k=c.dataset.k;
  if(st.tri){const v=p.cuisines[k];if(!v)p.cuisines[k]="like";else if(v==="like")p.cuisines[k]="dislike";else delete p.cuisines[k];}
  else{const a=p[st.key];const i=a.indexOf(k);i>=0?a.splice(i,1):a.push(k);if(k==="vegan"&&a.includes("vegan")&&!a.includes("vegetarian"))a.push("vegetarian");}
  renderSurvey();});
 $("#bk").onclick=()=>{if(S.step>0){S.step--;renderSurvey();return;}if(S.user){S.draft=null;S.view="home";render();}else{S.view=null;render();}};
 $("#nx").onclick=()=>{if(S.step<STEPS.length-1){S.step++;renderSurvey();return;}const first=!S.user;
  S.user={...(S.user||{}),name:S.draft.name,email:S.draft.email,college:S.draft.college,prefs:S.draft.prefs};local.set("tce_user",S.user);S.draft=null;S.signinNote="";saveProfile();if(first&&Shared.mode==="shared")Shared.saveMine(Shared.mine());S.view="home";if(first){S.tab=S.user.college;S.day=null;}render();scrollTo(0,0);toast(first?`Welcome! Here's ${COLLEGES[S.user.college].name} today.`:"Preferences saved");};
}

/* ================= header + search ================= */
const XTABS=[["feed","Rate My Plate"],["leaders","Leaderboard"],["fuel","Fuel"]];
const MIC=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/></svg>`;
const MAG=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function header(){
 const u=S.user,tab=S.tab||u.college,order=[u.college,...Object.keys(COLLEGES).filter(k=>k!==u.college)];
 return `<header class="top"><div class="top-in">
 <div class="wordmark" id="home" role="link" aria-label="Home">${WORDMARK_H()}</div>
 <nav class="tabs">${order.map(k=>`<button class="tab ${S.view==="home"&&tab===k?"on":""}" data-t="${k}">${COLLEGES[k].name}</button>`).join("")}
  ${XTABS.map(([v,l])=>`<button class="tab xtab ${S.view===v?"on":""}" data-go="${v}">${v==="feed"?`<img src="site/img/ratemyplate.png" alt="" class="tabico">`:""}${l}</button>`).join("")}
  <div class="more"><button class="tab moretab ${XTABS.some(x=>x[0]===S.view)?"on":""}" id="morebtn" aria-haspopup="true" aria-expanded="false">${XTABS.find(x=>x[0]===S.view)?.[1]||"More"} <span aria-hidden="true">▾</span></button>
   <div class="moremenu hidden" id="moremenu">${XTABS.map(([v,l])=>`<button class="mitem" data-go="${v}">${v==="feed"?`<img src="site/img/ratemyplate.png" alt="" class="tabico">`:""}${l}</button>`).join("")}</div></div></nav>
 <div class="search"><span class="mag">${MAG}</span><input id="q" type="text" placeholder="Search dishes" autocomplete="off" aria-label="Search dishes" aria-controls="sres">${SR?`<button class="mic" id="mic" type="button" aria-label="Search by voice" title="Search by voice">${MIC}</button>`:""}<div class="sresults hidden" id="sres" role="listbox"></div></div>
 <div class="me"><button class="gear" id="gear" aria-label="Settings" title="Settings">${GEAR}</button><button class="avatar" id="av" aria-label="Account menu">${avatarHTML(u.name,u.avatar,"hdr")}</button>
  <div class="menu ${S.menuOpen?"":"hidden"}"><div class="who"><b>${esc(u.name)}</b>${esc(u.email)} · ${COLLEGES[u.college].name}</div>
  <button class="mitem" id="prof">Profile, favorites & schedule</button><button class="mitem" id="mfuel">Fuel tracker</button><button class="mitem" id="edit">Edit dining preferences</button><button class="mitem" id="out">Sign out</button></div></div></div></header>`;
}
function searchDishes(q){q=q.trim().toLowerCase();if(!q)return[];const words=q.split(/\s+/);
 return Object.values(D).map(it=>{const n=it.name.toLowerCase();if(!words.every(w=>n.includes(w)))return null;return{it,score:(n.startsWith(q)?0:1)+n.length/100};}).filter(Boolean).sort((a,b)=>a.score-b.score).slice(0,8).map(x=>x.it);}
function wireHeader(){
 $("#home").onclick=()=>{S.view="home";S.tab=S.user.college;S.day=null;S.meal="now";render();};
 document.querySelectorAll(".tab[data-t]").forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.day=null;S.meal="now";S.view="home";render();scrollTo(0,0);});
 document.querySelectorAll("header [data-go]").forEach(b=>b.onclick=e=>{e.stopPropagation();go(b.dataset.go);});
 $("#morebtn").onclick=e=>{e.stopPropagation();const m=$("#moremenu");m.classList.toggle("hidden");$("#morebtn").setAttribute("aria-expanded",!m.classList.contains("hidden"));};
 $("#mic")&&($("#mic").onclick=e=>{e.stopPropagation();voiceSearch();});
 $("#prof").onclick=e=>{e.stopPropagation();go("profile");};$("#mfuel").onclick=e=>{e.stopPropagation();go("fuel");};
 $("#av").onclick=e=>{e.stopPropagation();S.menuOpen=!S.menuOpen;$(".menu").classList.toggle("hidden",!S.menuOpen);};
 $("#edit").onclick=()=>{S.menuOpen=false;S.view="survey";S.step=0;S.draft=null;render();};
 $("#gear").onclick=e=>{e.stopPropagation();S.menuOpen=false;$(".menu").classList.add("hidden");openSettings();};
 $("#out").onclick=()=>signOut();
 const q=$("#q"),box=$("#sres");let sel=-1,res=[];
 const draw=()=>{res=searchDishes(q.value);if(!q.value.trim()){box.classList.add("hidden");return;}
  box.innerHTML=res.length?res.map((it,i)=>{const n=nextServing(it),h=HALL[n.hall];const s=stockSrc(it);
    return `<div class="sres ${i===sel?"on":""}" data-id="${it.id}" role="option"><div class="t" style="${s?`background-image:url('${s}')`:""}"></div><div><b>${esc(it.name)}</b><small>${esc(h.name)} · ${n.date===TODAY?"Today":n.date} · ${MEALS[n.meal]}</small></div></div>`}).join(""):`<div class="sempty">No dishes match “${esc(q.value)}” this week.</div>`;
  box.classList.remove("hidden");box.querySelectorAll(".sres").forEach(r=>r.onmousedown=e=>{e.preventDefault();openDish(r.dataset.id);});};
 q.oninput=()=>{sel=-1;draw();};
 q.onkeydown=e=>{if(e.key==="ArrowDown"){sel=Math.min(res.length-1,sel+1);draw();e.preventDefault();}else if(e.key==="ArrowUp"){sel=Math.max(0,sel-1);draw();e.preventDefault();}else if(e.key==="Enter"&&res.length){openDish(res[Math.max(0,sel)].id);}else if(e.key==="Escape"){q.value="";box.classList.add("hidden");}};
 q.onblur=()=>setTimeout(()=>box.classList.add("hidden"),120);
 q.onfocus=()=>{if(q.value.trim())draw();};
}
let rec=null;
function voiceSearch(){const btn=$("#mic"),q=$("#q");if(!SR||!btn)return;
 if(rec){rec.stop();return;}
 try{rec=new SR();}catch(e){toast("Voice search isn't available in this browser.");return;}
 rec.lang="en-US";rec.interimResults=true;rec.maxAlternatives=1;
 btn.classList.add("on");q.placeholder="Listening…";
 rec.onresult=ev=>{const t=[...ev.results].map(r=>r[0].transcript).join("");q.value=t;q.dispatchEvent(new Event("input"));};
 rec.onerror=ev=>{toast(ev.error==="not-allowed"||ev.error==="service-not-allowed"?"Microphone access is blocked. Allow the microphone for this page, or open it in Chrome or Safari directly.":ev.error==="no-speech"?"Didn't catch that. Try again.":"Voice search stopped.");};
 rec.onend=()=>{rec=null;btn.classList.remove("on");q.placeholder="Search dishes";if(q.value.trim())q.focus();};
 try{rec.start();}catch(e){rec=null;btn.classList.remove("on");}}
function openDish(id){S.item=id;S.view="detail";S.newStars=0;S.pending=[];render();scrollTo(0,0);}
document.addEventListener("click",()=>{$("#moremenu")?.classList.add("hidden");if(S.menuOpen){S.menuOpen=false;$(".menu")?.classList.add("hidden");}});

/* ================= home ================= */
function filterCount(){const p=S.user.prefs;return p.diets.length+p.allergens.length+p.goals.length+Object.keys(p.cuisines).length+(S.favOnly?1:0);}
function filterPanel(){
 const p=S.user.prefs;
 const pills=[...p.diets.map(k=>{const d=DIETS.find(x=>x.k===k);return `<span class="pill ${d.unpub?"muted":""}">${d.label}${d.unpub?" (not labeled)":""}</span>`}),
  ...p.allergens.map(k=>`<span class="pill red">No ${ALLERGENS.find(x=>x.k===k).label.toLowerCase()}</span>`),
  ...p.goals.map(k=>`<span class="pill">${GOALS.find(x=>x.k===k).label}</span>`),
  ...Object.entries(p.cuisines).map(([k,v])=>`<span class="pill ${v==="dislike"?"muted":""}">${v==="like"?"Likes":"Dislikes"} ${cz(k).label}</span>`)];
 return `<div class="filterpanel">
  <div class="row1"><span class="lbl">Your profile</span>${pills.length?pills.join(""):`<span class="pill muted">Nothing set</span>`}<button class="btn sm ghost" id="editp" style="margin-left:auto">Edit</button></div>
  <div class="row1"><span class="lbl">Sort</span><select class="sel" id="sort">${[["rec","Recommended for me"],["rating","Top rated"],["az","A–Z"]].map(([v,l])=>`<option value="${v}" ${S.sort===v?"selected":""}>${l}</option>`).join("")}</select>
   <label class="chk" style="margin-left:16px"><input type="checkbox" id="hide" ${S.hide?"checked":""}> Hide dishes that don't fit my restrictions</label>
   <label class="chk" style="margin-left:16px"><input type="checkbox" id="favonly" ${S.favOnly?"checked":""}> Favorites only</label></div></div>`;
}
function itemRow(it,hallId,station){
 const c=check(it,hallId),r=Shared.rating(it.id),lab=c.lab;
 const dietB=DIETS.filter(d=>lab.diets.includes(d.k)).map(d=>`<span class="b">${d.label}</span>`).join("");
 const other=(lab.other||[]).map(o=>`<span class="b gray">${o==="pork"?"Pork":o==="pww"?"Prepared w/o wheat":"Alcohol"}</span>`).join("");
 const al=lab.allergensListed?(lab.allergens.length?`Contains: ${lab.allergens.map(a=>{const l=ALLERGENS.find(x=>x.k===a).label;return c.hits.includes(a)?`<b>${l}</b>`:l}).join(", ")}`:"No major allergens listed"):"Allergens not listed";
 let tag="";if(!c.ok)tag=`<span class="tag no">${esc(c.reasons[0])}</span>`;else if(c.unknown.length)tag=`<span class="tag unk">${esc(c.unknown[0])}</span>`;else if(c.rec)tag=`<span class="tag rec">Recommended</span>`;
 return `<div class="item ${c.ok?"":"blocked"}" data-id="${it.id}" tabindex="0" role="link">${pic(it)}
  <div><div class="nm">${esc(it.name)}</div>
   ${r?`<div class="stars">${stars(r.avg)}<em>${r.avg.toFixed(1)} (${r.n})</em></div>`:`<div class="stars none">☆☆☆☆☆<em>No ratings yet</em></div>`}
   <div class="sub2">${cz(it.cuisine).label}${station?" · "+esc(station):""}${nutOf(it,hallId)?.cal!=null?` · <b class="cal">${nutOf(it,hallId).cal} cal</b>`:""}</div>
   <div class="badges">${dietB}${other}</div><div class="contains">${al}</div></div>
  <div class="side">${heartBtn(it.id)}${tag}${c.ok&&c.goalHits.length?`<span class="goal">${esc(c.goalHits.join(" · "))}</span>`:""}</div></div>`;
}
function sortItems(list,hallId){
 const f={rec:(a,b)=>check(b,hallId).score-check(a,hallId).score,rating:(a,b)=>(Shared.rating(b.id)?.avg||0)-(Shared.rating(a.id)?.avg||0),az:(a,b)=>a.name.localeCompare(b.name)}[S.sort];
 return list.sort((a,b)=>(check(b,hallId).ok-check(a,hallId).ok)||f(a,b));
}
function renderHome(){
 S.view="home";
 const tab=S.tab||S.user.college,C=COLLEGES[tab],halls=DATA.halls.filter(h=>h.college===tab);
 const halll=halls[0];if(S.day==null)S.day=defaultDay(halll);
 const isToday=halll.dates[S.day]===TODAY;if(!isToday&&S.meal==="now")S.meal=null;
 const blocks=halls.map(h=>{
  const hrs=hoursFor(h,S.day),menu=h.menus[String(S.day)]||{};
  let meal;
  if(S.meal==="now"){const o=isToday?openMeal(h):null;meal=o?o[0]:null;
   if(!meal){const t=isToday?now.getHours()+now.getMinutes()/60:0;const nx=hrs.find(([m,a])=>a>t&&menu[m]);meal=nx?nx[0]:null;}}
  else meal=S.meal||(hrs.find(([m])=>menu[m])||hrs[0]||[null])[0];
  const hr=hrs.find(x=>x[0]===meal);
  return {h,meal,hr,ids:meal?(menu[meal]||[]):[],openNow:isToday&&hr&&openMeal(h)?.[0]===meal};
 });
 const mealsToday=[...new Set(halls.flatMap(h=>hoursFor(h,S.day).map(x=>x[0])))].sort((a,b)=>Object.keys(MEALS).indexOf(a)-Object.keys(MEALS).indexOf(b));
 const body=blocks.map(({h,meal,hr,ids,openNow})=>{
  if(!meal||!ids.length){
   const why=!hr&&meal?`${esc(h.name)} doesn't serve ${MEALS[meal].toLowerCase()} on ${DAYS[S.day]}`:(meal?`No menu was published for ${MEALS[meal].toLowerCase()} on ${h.dates[S.day]}`:`Nothing else on the menu for ${h.dates[S.day]}`);
   return `<section class="hall"><div class="hall-h"><h2>${esc(h.name)}</h2><span class="closed">No menu</span></div><div class="empty">${why}.</div></section>`;}
  let items=ids.map(id=>D[id]);
  if(S.favOnly)items=items.filter(it=>Shared.favs.has(it.id));
  const hidden=S.hide?items.filter(it=>!check(it,h.id).ok).length:0;
  if(S.hide)items=items.filter(it=>check(it,h.id).ok);
  const stationOf=id=>(D[id].served.find(s=>s.hall===h.id&&s.day===S.day&&s.meal===meal)||{}).station||"";
  const cats=CATS.filter(c=>items.some(it=>it.category===c));
  return `<section class="hall">
   <div class="hall-h"><h2>${esc(h.name)}</h2>
   <div class="hmeta"><span>${MEALS[meal]}${hr?" "+fmtH(hr[1])+"–"+fmtH(hr[2]):""}</span>${hr?fitPill(h.dates[S.day],hr[1],hr[2]):""}${hidden?`<span>${hidden} hidden</span>`:""}${openNow?`<span class="open">Open now</span>`:(S.meal==="now"&&isToday?`<span class="closed">Up next</span>`:"")}</div></div>
   ${cats.length>1?`<div class="cat-tabs">${cats.map(c=>`<a href="#" data-jump="${h.id}-${CATS.indexOf(c)}">${c}</a>`).join("")}</div>`:""}
   ${cats.length?cats.map(c=>`<div class="cat" id="${h.id}-${CATS.indexOf(c)}"><h3>${c}</h3>${sortItems(items.filter(it=>it.category===c),h.id).map(it=>itemRow(it,h.id,stationOf(it.id))).join("")}</div>`).join("")
    :`<div class="empty">${S.favOnly?"None of your favorites are on this menu.":"Nothing here fits your restrictions. Open Filters and untick “Hide dishes that don't fit” to see everything."}</div>`}
  </section>`;
 }).join("");
 const order=[0,1,2,3,4,5,6].sort((a,b)=>ord(halll.dates[a])-ord(halll.dates[b]));
 const curMeal=blocks.find(b=>b.meal)?.meal,n=filterCount();
 $("#app").innerHTML=header()+`<main>
  <div class="hero"><h1>${C.name}</h1></div>
  <div class="seg days">${order.map(i=>`<button data-day="${i}" class="${S.day===i?"on":""}">${halll.dates[i]===TODAY?"Today":DAYS[i]}<small>${halll.dates[i].split(" ").slice(1).join(" ")}</small></button>`).join("")}</div>
  <div class="toolbar">
   <div class="seg" style="margin:0">${(isToday?[["now","Open now"]]:[]).concat(mealsToday.map(m=>[m,MEALS[m]])).map(([v,l])=>`<button data-meal="${v}" class="${(S.meal||curMeal)===v?"on":""}">${l}</button>`).join("")}</div>
   <button class="filterbtn ${S.showFilters?"on":""}" id="ftog" aria-expanded="${!!S.showFilters}">Filters${n?`<b>${n}</b>`:""}</button>
  </div>
  ${S.showFilters?filterPanel():""}
  ${reminderBanner()}
  ${Shared.mode==="local"?`<div class="note">Reviews and photos are saved in this browser only${SUPA_ON||!window.claude?"":". Open the shared link while signed in to Claude to see everyone's"}.</div>`:(S.sharedNote?`<div class="note">${esc(S.sharedNote)}</div>`:"")}
  ${body}${footer()}</main>`;
 wireHeader();wireHearts();
 document.querySelectorAll(".rbanner [data-open]").forEach(b=>b.onclick=()=>openDish(b.dataset.open));
 document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{S.day=+b.dataset.day;S.meal=halll.dates[S.day]===TODAY?"now":null;renderHome();});
 document.querySelectorAll("[data-meal]").forEach(b=>b.onclick=()=>{S.meal=b.dataset.meal;renderHome();});
 $("#ftog").onclick=()=>{S.showFilters=!S.showFilters;renderHome();};
 if(S.showFilters){$("#hide").onchange=e=>{S.hide=e.target.checked;renderHome();};$("#favonly").onchange=e=>{S.favOnly=e.target.checked;renderHome();};$("#sort").onchange=e=>{S.sort=e.target.value;renderHome();};$("#editp").onclick=()=>{S.view="survey";S.step=0;S.draft=null;render();};}
 document.querySelectorAll("[data-jump]").forEach(a=>a.onclick=e=>{e.preventDefault();document.getElementById(a.dataset.jump)?.scrollIntoView({behavior:"smooth",block:"start"});});
 document.querySelectorAll(".item").forEach(el=>{el.onclick=()=>openDish(el.dataset.id);el.onkeydown=e=>{if(e.key==="Enter")openDish(el.dataset.id);};});
}
function footer(){
 const cr=Object.entries(STOCK);
 return `<div class="foot">Menus collected once: Bryn Mawr from its dining menu (updated Nov 14, 2026), Haverford from <a href="https://mcc-brynmawr.computrition.online/" target="_blank" rel="noopener">Meal Choice Connect</a> (Nov 13) and <a href="https://dash.swarthmore.edu/menu/dining-center/" target="_blank" rel="noopener">The Dash</a> (Swarthmore); hours from each college's dining site. Dietary and allergen labels are the colleges' own. Cuisine, category and goal hints are guesses from the dish name. Always confirm allergens with dining staff.
  ${cr.length?`<details><summary>Stock photo credits (Wikimedia Commons)</summary>${cr.map(([k,c])=>`<div>${esc(k)}: <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a> by ${esc(c.artist)}, ${esc(c.license)}, cropped</div>`).join("")}</details>`:""}</div>`;
}

/* ================= favorites page ================= */
function renderFavs(){
 const favs=[...Shared.favs].map(id=>D[id]).filter(Boolean);const t=ord(TODAY);
 const rows=favs.map(it=>{const sv=it.served.map(s=>({...s,date:HALL[s.hall].dates[s.day]})).sort((a,b)=>ord(a.date)-ord(b.date));
   const up=sv.filter(s=>ord(s.date)>=t);return{it,sv,up};}).sort((a,b)=>(b.up.length>0)-(a.up.length>0)||(a.up[0]?ord(a.up[0].date):0)-(b.up[0]?ord(b.up[0].date):0));
 $("#app").innerHTML=header()+`<main><div class="hero"><h1>Favorites</h1></div>
  <p class="legend" style="margin:-6px 0 18px">Tap the heart on any dish to save it here and see when it's on the menu this week. You can also show only favorites from the Filters button on a college page.</p>
  ${rows.length?rows.map(({it,sv,up})=>`<div class="fav-row">${pic(it)}<div><div class="nm" style="font-weight:700;font-size:17px;color:var(--navy);cursor:pointer" data-open="${it.id}">${esc(it.name)}</div>
    <div class="when">${(up.length?up:sv).map(s=>`<span class="${s.date===TODAY?"today":""}">${s.date===TODAY?"Today":s.date} · ${MEALS[s.meal]} · ${esc(HALL[s.hall].name)}</span>`).join("")}${up.length?"":`<div style="color:var(--muted);margin-top:4px">Not on any menu for the rest of this week.</div>`}</div></div>${heartBtn(it.id,true)}</div>`).join("")
   :`<div class="empty" style="border:1.5px dashed var(--line)">No favorites yet. Tap the heart next to a dish to add it.</div>`}
  ${footer()}</main>`;
 wireHeader();wireHearts();document.querySelectorAll("[data-open]").forEach(e=>e.onclick=()=>openDish(e.dataset.open));
}

/* ================= dish page ================= */
function renderDetail(){
 const it=D[S.item];if(!it){S.view="home";return renderHome();}
 const r=Shared.rating(it.id),reviews=Shared.reviewsFor(it.id);
 const allPhotos=reviews.flatMap(rv=>rv.photos.map(p=>p.src));
 const hallIds=Object.keys(it.labels);
 const tabHall=hallIds.find(id=>HALL[id].college===(S.tab||S.user.college))||hallIds[0];
 const c=check(it,tabHall),cu=cz(it.cuisine);
 const mineRaw=Shared.mine().reviews[it.id];
 if(!S.newStars&&mineRaw)S.newStars=mineRaw.stars;
 const stock=it.photo&&STOCK[it.photo];
 $("#app").innerHTML=header()+`<main>
  <button class="back" id="back">Back</button>
  <div class="detail"><div>${pic(it)}
   ${stock?`<div class="credit">Stock photo of ${esc(it.photo)}, not this exact dish. <a href="${esc(stock.url)}" target="_blank" rel="noopener">${esc(stock.artist)}, ${esc(stock.license)}</a></div>`:""}
   ${allPhotos.length?`<div class="box"><h3>Student photos (${allPhotos.length})</h3><div class="custphotos">${allPhotos.map(s=>`<button data-zoom="${esc(s)}" style="background-image:url('${esc(s)}')" aria-label="View photo"></button>`).join("")}</div></div>`:""}
  </div>
  <div>
   <div class="crumb">${it.category} · ${cu.label} (guessed)</div>
   <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><h1>${esc(it.name)}</h1>${heartBtn(it.id,true)}</div>
   ${r?`<div class="stars" style="font-size:18px">${stars(r.avg)}<em>${r.avg.toFixed(1)} out of 5 · ${r.n} rating${r.n>1?"s":""}</em></div>`:`<div class="stars none" style="font-size:18px">☆☆☆☆☆<em>No ratings yet</em></div>`}
   ${!c.ok?`<div class="alert bad"><b>Doesn't fit your profile:</b> ${c.reasons.map(esc).join(" · ")}</div>`
     :c.unknown.length?`<div class="alert unk"><b>Can't confirm:</b> ${c.unknown.map(esc).join(" · ")}. Ask dining staff before eating it.</div>`
     :`<div class="alert good"><b>Fits the restrictions you set</b>, based on ${esc(HALL[tabHall].name)}'s labels.${c.goalHits.length?" Possible fit for your goals: "+esc(c.goalHits.join(", ").toLowerCase())+" (guessed from the name).":""}</div>`}
   ${c.disliked?`<div class="alert unk">${cu.label} is on your dislike list.</div>`:""}
   ${nutritionBox(it,tabHall)}
   ${logBox(it,tabHall)}
   ${reminderBox(it)}
   <div class="box"><h3>Served this week</h3><table class="served">${it.served.map(s=>`<tr><td>${esc(HALL[s.hall].name)} <span style="color:var(--muted)">(${COLLEGES[HALL[s.hall].college].name})</span></td><td>${HALL[s.hall].dates[s.day]===TODAY?"Today":HALL[s.hall].dates[s.day]}</td><td>${MEALS[s.meal]}</td><td style="color:var(--muted)">${esc(s.station)}</td></tr>`).join("")}</table></div>
   ${hallIds.map(hid=>{const L=it.labels[hid],h=HALL[hid],sw=hid==="swatdc";return `<div class="box"><h3>Labels from ${esc(h.name)}</h3>
    <div class="grid2">${DIETS.map(d=>{const y=L.diets.includes(d.k);const known=!d.unpub&&(((d.k==="vegetarian"||d.k==="vegan")&&h.marksVeg)||sw||y);
      return `<div class="row ${y?"yes":known?"no":"unk"}">${d.label}<span class="st">${y?"Yes":known?"No":"Not labeled"}</span></div>`}).join("")}</div>
    <div class="grid2" style="margin-top:12px">${ALLERGENS.map(a=>{const has=L.allergens.includes(a.k),hit=has&&S.user.prefs.allergens.includes(a.k);
      return `<div class="row ${hit?"hit":has?"contains":L.allergensListed?"yes":"unk"}">${a.label}<span class="st">${hit?"Contains — you avoid this":has?"Contains":L.allergensListed?"Not listed":"Unknown"}</span></div>`}).join("")}</div>
    ${(L.other||[]).length?`<p class="note2">Also labeled: ${L.other.map(o=>o==="pww"?"prepared without wheat (Bryn Mawr can't guarantee no cross-contact, so this isn't the same as gluten-free)":esc(o)).join(", ")}.</p>`:""}
    <p class="note2">${L.allergensListed?`Allergen labels as posted on <a href="${h.sourceUrl}" target="_blank" rel="noopener">${esc(h.source)}</a>.`:`This menu only marks vegetarian (*) and vegan (V). Check full allergens on <a href="${h.sourceUrl}" target="_blank" rel="noopener">${esc(h.source)}</a>.`} Kitchens are shared; cross-contact is possible.</p></div>`}).join("")}
  </div></div>
  <div class="detail" style="margin-top:8px">
   <div class="box"><h3>${mineRaw?"Edit your review":"Write a review"}</h3>
    <div class="star-in" id="si">${[1,2,3,4,5].map(n=>`<button data-n="${n}" class="${S.newStars>=n?"on":""}" aria-label="${n} stars">★</button>`).join("")}</div>
    <textarea class="inp" id="rt" rows="3" maxlength="600" placeholder="How was it? Seasoning, portion, temperature…">${esc(mineRaw?.text||"")}</textarea>
    ${mineRaw?.photos?.length?`<div class="legend" style="margin-top:8px">Your photos on this review: ${mineRaw.photos.length}</div>`:""}
    <div class="pending">${S.pending.map((p,i)=>`<div style="background-image:url('${p.dataUrl}')"><button data-unpend="${i}" aria-label="Remove photo">✕</button></div>`).join("")}</div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn sm ghost" id="addPhoto">Add photos</button><span class="legend" style="margin:0">Up to 4 per review</span></div>
    <div class="err" id="rerr"></div><button class="btn" id="post">${mineRaw?"Update review":"Post review"}</button>
    ${mineRaw?` <button class="linkbtn red" id="delrev" style="margin-left:10px">Delete my review</button>`:""}</div>
   <div class="box"><h3>Reviews (${reviews.length})</h3>
    ${reviews.length?reviews.map(rv=>`<div class="rv"><div class="who">${avatarHTML(rv.name,rv.avatar,"xs")}${userLink(rv.uid,rv.name)}${rv.mine?" (you)":""} <small>· ${COLLEGES[rv.college].name}${rv.ts?" · "+ago(rv.ts):""}</small></div><div class="stars" style="font-size:13px;margin-top:4px">${stars(rv.stars)}</div>${rv.text?`<p>${esc(rv.text)}</p>`:""}${!rv.mine?`<button class="linkbtn" data-report="${esc('review:'+rv.uid+'|'+it.id)}" style="font-size:12px;color:var(--muted)">Report review</button>`:""}
      ${rv.photos.length?`<div class="rvphotos">${rv.photos.map(p=>`<div class="ph-wrap"><button class="img" data-zoom="${esc(p.src)}" style="background-image:url('${esc(p.src)}')" aria-label="View photo"></button>${Shared.canDelete(rv.uid)?`<button class="ph-del" data-delph="${esc(rv.uid)}|${p.i}">Delete</button>`:`<button class="ph-del" data-report="${esc(p.rkey)}" title="Report this photo">Report</button>`}</div>`).join("")}</div>`:""}</div>`).join("")
     :`<p style="color:var(--muted)">No reviews yet. Be the first, photos welcome.</p>`}</div>
  </div>${footer()}</main>`;
 wireHeader();wireHearts();
 $("#logit").onclick=()=>logDish(it,tabHall);
 $("#remtog").onclick=async()=>{await Rem.toggle(it.id);toast(Rem.has(it.id)?"Reminder on":"Reminder off");renderDetail();};
 $("#back").onclick=()=>{S.view="home";render();};
 document.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>showImage(b.dataset.zoom));
 document.querySelectorAll("#si button").forEach(b=>b.onclick=()=>{S.newStars=+b.dataset.n;document.querySelectorAll("#si button").forEach(x=>x.classList.toggle("on",+x.dataset.n<=S.newStars));});
 $("#rt").addEventListener("keydown",e=>e.stopPropagation());
 document.querySelectorAll("[data-unpend]").forEach(b=>b.onclick=()=>{S.pending.splice(+b.dataset.unpend,1);keepDraft();renderDetail();});
 const inp=$("#photoInput");inp.multiple=true;
 inp.onchange=async()=>{const files=[...inp.files].filter(f=>f.type.startsWith("image/"));for(const f of files){if(S.pending.length+(mineRaw?.photos?.length||0)>=4){toast("Up to 4 photos per review");break;}try{S.pending.push(await shrink(f));}catch(e){toast("Couldn't read that image.");}}keepDraft();renderDetail();};
 $("#addPhoto").onclick=()=>{inp.value="";inp.click();};
 if(S.draftText!=null&&S.draftFor===it.id){$("#rt").value=S.draftText;}
 function keepDraft(){S.draftText=$("#rt")?.value;S.draftFor=it.id;}
 $("#post").onclick=async()=>{
  if(!S.newStars){$("#rerr").textContent="Choose a star rating first.";return;}
  if(hasBad($("#rt").value)){$("#rerr").textContent=MOD_MSG;return;}
  $("#post").disabled=true;
  const m=Shared.mine();const prev=m.reviews[it.id]||{};const photos=[...(prev.photos||[])];
  try{for(const p of S.pending)photos.push(await storePhoto(p));}catch(e){toast("A photo couldn't be uploaded.");$("#post").disabled=false;return;}
  m.reviews[it.id]={stars:S.newStars,text:$("#rt").value.trim().slice(0,600),ts:Date.now(),photos};
  if(await Shared.saveMine(m)){S.pending=[];S.draftText=null;toast("Review posted");}
  renderDetail();};
 $("#delrev")&&($("#delrev").onclick=async()=>{const m=Shared.mine();await deleteBlobs(m.reviews[it.id]?.photos);delete m.reviews[it.id];if(await Shared.saveMine(m)){S.newStars=0;toast("Review deleted");}renderDetail();});
 wireReports(renderDetail);
 document.querySelectorAll("[data-delph]").forEach(b=>b.onclick=async()=>{const [uid,i]=b.dataset.delph.split("|");
  const doc=uid===Shared.uid?Shared.mine():JSON.parse(JSON.stringify(Shared.docs[uid]||{}));const rv=doc.reviews?.[it.id];if(!rv)return;
  const [gone]=rv.photos.splice(+i,1);if(await Shared.write(uid,doc)){deleteBlobs([gone]);toast("Photo deleted");}renderDetail();});
}

function wireReports(again){document.querySelectorAll("[data-report]").forEach(b=>b.onclick=async e=>{e.stopPropagation();
 if(!confirmBox("Report this?","It will be hidden for you right away, and for everyone once another student reports it. The site owner can delete it."))return;await Shared.report(b.dataset.report);again();});}
function confirmBox(){return true;}

/* ================= photos ================= */
function shrink(file,max=1200){return new Promise((res,rej)=>{const img=new Image();const url=URL.createObjectURL(file);
 img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  const small=document.createElement("canvas");const s2=Math.min(1,560/Math.max(c.width,c.height));small.width=Math.round(c.width*s2);small.height=Math.round(c.height*s2);small.getContext("2d").drawImage(c,0,0,small.width,small.height);
  c.toBlob(b=>b?res({blob:b,dataUrl:small.toDataURL("image/jpeg",.7)}):rej(),"image/jpeg",.82);};
 img.onerror=()=>{URL.revokeObjectURL(url);rej();};img.src=url;});}
async function storePhoto(p){
 if(Shared.mode==="shared"){if(!Shared.assets)throw new Error("no assets");const up=await Shared.assets.upload(new File([p.blob],"photo.jpg",{type:"image/jpeg"}));return Shared.backend==="supabase"?{url:up.url,path:up.path,ts:Date.now()}:{id:up.id,ts:Date.now()};}
 return{data:p.dataUrl,ts:Date.now()};
}
async function deleteBlobs(list){if(Shared.mode!=="shared"||!Shared.assets||!list)return;for(const p of list){const k=Shared.backend==="supabase"?p?.path:p?.id;if(k&&(Shared.backend!=="supabase"||k.startsWith(Shared.uid+"/")||Shared.isOwner)){try{await Shared.assets.delete(k);}catch(e){}}}}

/* ================= Rate My Plate ================= */
function renderFeed(){
 let posts=Shared.posts();
 if(S.feedCollege!=="all")posts=posts.filter(p=>p.college===S.feedCollege);
 posts.sort(S.feedSort==="top"?(a,b)=>b.likes-a.likes||b.ts-a.ts:(a,b)=>b.ts-a.ts);
 const d=S.postDraft||{};
 $("#app").innerHTML=header()+`<main><div class="hero rmp-hero"><img src="site/img/ratemyplate.png" alt="" class="rmp-logo"><h1>Rate My Plate</h1></div>
  <p class="legend" style="margin:-6px 0 16px">Show off your bowls, builds and coffee orders. Like the best plates, comment, and climb the leaderboard.</p>
  
  <div class="feedwrap"><div>${`
   <div class="toolbar" style="margin-top:0">
    <div class="seg" style="margin:0">${[["new","Newest"],["top","Most liked"]].map(([v,l])=>`<button data-fs="${v}" class="${S.feedSort===v?"on":""}">${l}</button>`).join("")}</div>
    <div class="seg" style="margin:0">${[["all","All"],...Object.entries(COLLEGES).map(([k,c])=>[k,c.name])].map(([v,l])=>`<button data-fc="${v}" class="${S.feedCollege===v?"on":""}">${l}</button>`).join("")}</div>
   </div>
   ${posts.length?posts.map(p=>`<article class="post">
    <div class="ptop"><div class="pwho"><button class="ulink" data-user="${esc(p.uid)}" aria-label="${esc(p.name)}'s profile">${avatarHTML(p.name,p.avatar,"sm")}</button><b>${userLink(p.uid,p.name)}</b> <small>· ${COLLEGES[p.college].name}${p.where?" · "+esc(p.where):""}</small></div><small>${ago(p.ts)}</small></div>
    <button class="ph" data-zoom="${esc(p.src)}" style="background-image:url('${esc(p.src)}')" aria-label="View photo"></button>
    <div class="pb"><h3>${esc(p.title||"")}</h3>${p.caption?`<div>${esc(p.caption)}</div>`:""}
     <div class="acts"><button class="likebtn ${p.liked?"on":""}" data-like="${esc(p.key)}" aria-pressed="${p.liked}">${p.liked?HEART:HEART_O}<span>${p.likes}</span></button>
      <span class="legend" style="margin:0">${p.comments.length} comment${p.comments.length===1?"":"s"}</span>
      ${Shared.canDelete(p.uid)?`<button class="linkbtn red" data-delpost="${esc(p.key)}" style="margin-left:auto">Delete post</button>`:`<button class="linkbtn" data-report="${esc(p.rk)}" style="margin-left:auto;color:var(--muted)">Report</button>`}${Shared.isOwner&&p.reports?`<span class="pill red">Reported ${p.reports}×</span>`:""}</div>
     <div class="cmts">${p.comments.map(c=>`<div class="cmt">${avatarHTML(c.name,c.avatar,"xs")}<b>${userLink(c.uid,c.name)}</b> ${esc(c.text)} <small style="color:var(--muted)">${ago(c.ts)}</small>${Shared.canDelete(c.uid)?` <button class="linkbtn" data-delcmt="${esc(p.key)}|${esc(c.uid)}|${c.i}">delete</button>`:` <button class="linkbtn" style="color:var(--muted);font-size:12px" data-report="${esc(c.rk)}">report</button>`}</div>`).join("")}
      <form class="cmtform" data-cmt="${esc(p.key)}"><input type="text" maxlength="300" placeholder="Add a comment" aria-label="Add a comment"><button class="btn sm" type="submit">Post</button></form></div></div></article>`).join("")
    :`<div class="empty" style="border:1.5px dashed var(--line)">No plates yet. Post the first one.</div>`}`}
  </div>
  <aside class="compose"><h3>Share your plate</h3>
   <div class="drop" id="pdrop" style="${d.photo?`background-image:url('${d.photo.dataUrl}');color:transparent`:""}">${d.photo?"Change photo":"Click to add a photo"}</div>
   <input type="text" id="ptitle" maxlength="80" placeholder="What is it? e.g. Tofu poke bowl" value="${esc(d.title||"")}">
   <input type="text" id="pwhere" maxlength="60" placeholder="Where? e.g. Erdman, Coop, Sharples" value="${esc(d.where||"")}">
   <textarea id="pcap" rows="3" maxlength="400" placeholder="How did you build it? Would you rate it?">${esc(d.caption||"")}</textarea>
   <div class="err" id="perr"></div><button class="btn full" id="ppost" style="margin-top:6px">Post</button></aside></div>
  ${footer()}</main>`;
 wireHeader();
 const keep=()=>{S.postDraft={...(S.postDraft||{}),title:$("#ptitle").value,where:$("#pwhere").value,caption:$("#pcap").value};};
 ["#ptitle","#pwhere","#pcap"].forEach(s=>$(s).addEventListener("input",keep));
 document.querySelectorAll("[data-fs]").forEach(b=>b.onclick=()=>{S.feedSort=b.dataset.fs;renderFeed();});
 document.querySelectorAll("[data-fc]").forEach(b=>b.onclick=()=>{S.feedCollege=b.dataset.fc;renderFeed();});
 document.querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>showImage(b.dataset.zoom));
 const inp=$("#photoInput");inp.multiple=false;
 $("#pdrop").onclick=()=>{inp.value="";inp.onchange=async()=>{const f=inp.files[0];if(!f||!f.type.startsWith("image/"))return;try{keep();S.postDraft.photo=await shrink(f);renderFeed();}catch(e){toast("Couldn't read that image.");}};inp.click();};
 $("#ppost").onclick=async()=>{keep();const dd=S.postDraft;
  if(!dd.photo){$("#perr").textContent="Add a photo of your plate first.";return;}
  if(!dd.title.trim()){$("#perr").textContent="Give it a name.";return;}
  if(hasBad(dd.title)||hasBad(dd.where)||hasBad(dd.caption)){$("#perr").textContent=MOD_MSG;return;}
  $("#ppost").disabled=true;
  try{const photo=await storePhoto(dd.photo);const m=Shared.mine();const pid="p"+Date.now().toString(36);
   m.posts[pid]={photo,title:dd.title.trim(),where:dd.where.trim(),caption:dd.caption.trim(),ts:Date.now()};
   if(await Shared.saveMine(m)){S.postDraft=null;toast("Posted");}}catch(e){toast("The photo couldn't be uploaded.");}
  renderFeed();};
 document.querySelectorAll("[data-like]").forEach(b=>b.onclick=async()=>{const m=Shared.mine();const k=b.dataset.like;if(m.likes[k])delete m.likes[k];else m.likes[k]=true;await Shared.saveMine(m);renderFeed();});
 document.querySelectorAll("[data-cmt]").forEach(f=>f.onsubmit=async e=>{e.preventDefault();const t=f.querySelector("input").value.trim();if(!t)return;if(hasBad(t)){toast(MOD_MSG);return;}const m=Shared.mine();const k=f.dataset.cmt;(m.comments[k]=m.comments[k]||[]).push({text:t.slice(0,300),ts:Date.now()});f.querySelector("input").blur();await Shared.saveMine(m);renderFeed();});
 document.querySelectorAll(".cmtform input").forEach(i=>i.addEventListener("keydown",e=>e.stopPropagation()));
 wireReports(renderFeed);
 document.querySelectorAll("[data-delpost]").forEach(b=>b.onclick=async()=>{const [uid,pid]=b.dataset.delpost.split("~");
  const doc=uid===Shared.uid?Shared.mine():JSON.parse(JSON.stringify(Shared.docs[uid]||{}));const gone=doc.posts?.[pid];if(!gone)return;delete doc.posts[pid];
  if(await Shared.write(uid,doc)){deleteBlobs([gone.photo]);toast("Post deleted");}renderFeed();});
 document.querySelectorAll("[data-delcmt]").forEach(b=>b.onclick=async()=>{const [key,uid,i]=b.dataset.delcmt.split("|");
  const doc=uid===Shared.uid?Shared.mine():JSON.parse(JSON.stringify(Shared.docs[uid]||{}));if(!doc.comments?.[key])return;doc.comments[key].splice(+i,1);await Shared.write(uid,doc);renderFeed();});
}

/* ================= boot ================= */
if(S.user){S.view="home";S.tab=S.user.college;}
render();
Shared.init();
