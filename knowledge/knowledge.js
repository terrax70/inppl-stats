
(()=>{
"use strict";
const D=window.FM_SOURCE_DATA;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ascState={pets:0,mounts:0,skills:0,items:0};
const chartSelection={pets:null,mounts:null,skills:null,items:null};

function safeRarityKey(name){
 return String(name).replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();
}
function getSystemRoot(id){
 return document.querySelector(`.system-root[data-system="${id}"]`);
}
function clearChartHover(root){
 root?.querySelectorAll(".chart-point.hovered,.rarity-assets article.hovered").forEach(x=>x.classList.remove("hovered"));
}
function syncRarityHighlight(id,rarity,{sticky=true,scrollCard=false}={}){
 const root=getSystemRoot(id); if(!root)return;
 if(sticky)chartSelection[id]=rarity;
 root.querySelectorAll("[data-rarity]").forEach(el=>{
   el.classList.toggle("selected-rarity",el.dataset.rarity===rarity);
 });
 const card=root.querySelector(`.rarity-assets article[data-rarity="${CSS.escape(rarity)}"]`);
 if(card&&scrollCard)card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
}
function showChartTooltip(host,evt,html){
 let tip=host.querySelector(".chart-hover-tip");
 if(!tip){
   tip=document.createElement("div");
   tip.className="chart-hover-tip";
   host.appendChild(tip);
 }
 tip.innerHTML=html;
 tip.classList.add("show");
 const rect=host.getBoundingClientRect();
 const x=Math.max(8,Math.min(rect.width-tip.offsetWidth-8,evt.clientX-rect.left+12));
 const y=Math.max(8,Math.min(rect.height-tip.offsetHeight-8,evt.clientY-rect.top+12));
 tip.style.left=x+"px"; tip.style.top=y+"px";
}
function hideChartTooltip(host){
 host.querySelector(".chart-hover-tip")?.classList.remove("show");
}
function bindChartInteractions(host,id){
 const root=getSystemRoot(id); if(!host||!root)return;
 host.querySelectorAll(".chart-point").forEach(point=>{
   const rarity=point.dataset.rarity;
   point.addEventListener("mouseenter",e=>{
     clearChartHover(root);
     point.classList.add("hovered");
     root.querySelector(`.rarity-assets article[data-rarity="${CSS.escape(rarity)}"]`)?.classList.add("hovered");
     showChartTooltip(host,e,point.dataset.tip||`<b>${rarity}</b>`);
   });
   point.addEventListener("mousemove",e=>{
     if(point.dataset.tip)showChartTooltip(host,e,point.dataset.tip);
   });
   point.addEventListener("mouseleave",()=>{
     clearChartHover(root);
     hideChartTooltip(host);
     if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
   });
   point.addEventListener("click",()=>{
     const targetAsc=point.dataset.asc!==undefined&&point.dataset.asc!==""?Number(point.dataset.asc):ascState[id];
     if(Number.isFinite(targetAsc)&&targetAsc!==ascState[id]){
       ascState[id]=targetAsc;
       chartSelection[id]=rarity;
       renderSystem(id);
       requestAnimationFrame(()=>syncRarityHighlight(id,rarity,{sticky:false,scrollCard:true}));
     }else{
       syncRarityHighlight(id,rarity,{sticky:true,scrollCard:true});
     }
   });
 });
}
function bindAssetInteractions(id){
 const root=getSystemRoot(id); if(!root)return;
 root.querySelectorAll(".rarity-assets article[data-rarity]").forEach(card=>{
   const rarity=card.dataset.rarity;
   card.tabIndex=0;
   card.setAttribute("role","button");
   card.setAttribute("aria-label",`Podświetl ${rarity} na wykresach`);
   const choose=()=>syncRarityHighlight(id,rarity,{sticky:true});
   card.addEventListener("click",choose);
   card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
   card.addEventListener("mouseenter",()=>{
     clearChartHover(root);
     card.classList.add("hovered");
     root.querySelectorAll(`.chart-point[data-rarity="${CSS.escape(rarity)}"]`).forEach(p=>p.classList.add("hovered"));
   });
   card.addEventListener("mouseleave",()=>{
     clearChartHover(root);
     if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
   });
 });
}


function labelTextWidth(text,fontSize,padX){
 const special={"Early-Modern":1.05,"Interstellar":1.02,"Multiverse":1.02};
 return Math.max(42,Math.min(112,String(text).length*fontSize*0.59*(special[text]||1)+padX*2));
}
function rectOverlapArea(a,b,pad=0){
 const x=Math.max(0,Math.min(a.x+a.w+pad,b.x+b.w+pad)-Math.max(a.x-pad,b.x-pad));
 const y=Math.max(0,Math.min(a.y+a.h+pad,b.y+b.h+pad)-Math.max(a.y-pad,b.y-pad));
 return x*y;
}
function pointInsideRect(p,r,pad=0){
 return p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function smartLabelLayout(points,bounds,{fontSize=9,height=22,gap=8,padX=7,obstacles=[]}={}){
 const placed=[];
 const allPointObstacles=points.map(p=>({x:p.px-10,y:p.py-10,w:20,h:20}));
 return points.map((p,index)=>{
   const w=labelTextWidth(p.name,fontSize,padX);
   const h=height;
   const above={x:p.px-w/2,y:p.py-gap-h,w,h,side:"above"};
   const below={x:p.px-w/2,y:p.py+gap,w,h,side:"below"};
   const upRight={x:p.px+gap,y:p.py-gap-h,w,h,side:"up-right"};
   const upLeft={x:p.px-gap-w,y:p.py-gap-h,w,h,side:"up-left"};
   const downRight={x:p.px+gap,y:p.py+gap,w,h,side:"down-right"};
   const downLeft={x:p.px-gap-w,y:p.py+gap,w,h,side:"down-left"};
   const farAbove={x:p.px-w/2,y:p.py-gap-h-20,w,h,side:"far-above"};
   const farBelow={x:p.px-w/2,y:p.py+gap+20,w,h,side:"far-below"};
   const right={x:p.px+gap+4,y:p.py-h/2,w,h,side:"right"};
   const left={x:p.px-gap-4-w,y:p.py-h/2,w,h,side:"left"};

   const preferred=index%2===0
     ? [above,below,upRight,upLeft,downRight,downLeft,farAbove,farBelow,right,left]
     : [below,above,downLeft,downRight,upLeft,upRight,farBelow,farAbove,left,right];

   let best=null,bestScore=Infinity;
   for(const raw of preferred){
     const c={...raw};
     c.x=clamp(c.x,bounds.x,bounds.x+bounds.w-c.w);
     c.y=clamp(c.y,bounds.y,bounds.y+bounds.h-c.h);

     let score=0;
     for(const r of placed)score+=rectOverlapArea(c,r,5)*180;
     for(const r of obstacles)score+=rectOverlapArea(c,r,4)*260;
     for(const r of allPointObstacles)score+=rectOverlapArea(c,r,2)*80;

     // Keep leader lines short whenever possible.
     const cx=c.x+c.w/2,cy=c.y+c.h/2;
     score+=Math.hypot(cx-p.px,cy-p.py)*0.16;
     // Prefer the first candidates in the list.
     score+=preferred.indexOf(raw)*3;

     if(score<bestScore){bestScore=score;best=c}
     if(score===0)break;
   }
   placed.push(best);
   return {...p,box:best,fontSize};
 });
}
function labelLeaderTarget(p){
 const b=p.box,cx=b.x+b.w/2,cy=b.y+b.h/2;
 const dx=p.px-cx,dy=p.py-cy;
 if(Math.abs(dx)>Math.abs(dy)){
   return {x:dx>0?b.x+b.w:b.x,y:cy};
 }
 return {x:cx,y:dy>0?b.y+b.h:b.y};
}
function chartProfile(host,rowCount,cycles=1){
 const viewport=Math.max(320,Math.round(host?.getBoundingClientRect?.().width||1200));
 const dense=rowCount>6;
 const narrow=viewport<900;
 const medium=viewport>=900&&viewport<1250;

 // Dense item charts deliberately become wider instead of crushing text.
 const intrinsic=cycles===4
   ? (dense?Math.max(1700,Math.min(1940,Math.round(viewport*1.18))):Math.max(1480,viewport))
   : (dense?Math.max(1460,Math.min(1740,Math.round(viewport*1.08))):Math.max(1240,viewport));

 return {
   viewport,dense,narrow,medium,intrinsic,
   labelFont:dense?(narrow?7.5:8.3):(narrow?8.7:9.7),
   labelHeight:dense?20:23,
   labelPadX:dense?5.5:7.5,
   labelGap:dense?7:9
 };
}
let responsiveRenderTimer=0;
window.addEventListener("resize",()=>{
 clearTimeout(responsiveRenderTimer);
 responsiveRenderTimer=setTimeout(()=>{
   const active=document.querySelector(".view.active")?.id;
   if(D.systems[active])renderSystem(active);
 },180);
},{passive:true});
const COLORS={Common:"#95a4b7",Rare:"#56a7e8",Epic:"#61d291",Legendary:"#e6c24c",Ultimate:"#ed923d",Mythic:"#c95be8",
Primitive:"#95a4b7",Medieval:"#72a7d8","Early-Modern":"#59bf9a",Modern:"#89c76a",Space:"#d8bd4e",Interstellar:"#e29147",Multiverse:"#ca6bce",Quantum:"#9a77ed",Underworld:"#e46067",Divine:"#f1cb58"};
const fmt=n=>{
 if(!Number.isFinite(Number(n)))return "—";n=Number(n);const a=Math.abs(n);
 if(a>=1e12)return (n/1e12).toLocaleString("pl-PL",{maximumFractionDigits:2})+"T";
 if(a>=1e9)return (n/1e9).toLocaleString("pl-PL",{maximumFractionDigits:2})+"B";
 if(a>=1e6)return (n/1e6).toLocaleString("pl-PL",{maximumFractionDigits:2})+"M";
 if(a>=1e3)return (n/1e3).toLocaleString("pl-PL",{maximumFractionDigits:2})+"K";
 return n.toLocaleString("pl-PL",{maximumFractionDigits:1});
};
const fmtTime=s=>{s=Number(s);if(s>=86400)return (s/86400).toLocaleString("pl-PL",{maximumFractionDigits:1})+" d";if(s>=3600)return (s/3600).toLocaleString("pl-PL",{maximumFractionDigits:1})+" h";return Math.round(s/60)+" min"};
const fmtMultExact=n=>{
 n=Number(n);
 if(n===1)return "×1";
 return "×"+Math.round(n).toLocaleString("pl-PL");
};
const fmtAxis=n=>{
 n=Number(n);
 if(n>=1e12)return "×"+(n/1e12).toLocaleString("pl-PL",{maximumFractionDigits:0})+"T";
 if(n>=1e9)return "×"+(n/1e9).toLocaleString("pl-PL",{maximumFractionDigits:0})+"B";
 if(n>=1e6)return "×"+(n/1e6).toLocaleString("pl-PL",{maximumFractionDigits:0})+"M";
 if(n>=1e3)return "×"+(n/1e3).toLocaleString("pl-PL",{maximumFractionDigits:0})+"K";
 return "×"+n.toLocaleString("pl-PL",{maximumFractionDigits:0});
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function activateTab(id){
 $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 if(D.systems[id]) renderSystem(id);
 if(id==="ascension") renderAscensionGuide();
 if(id==="tech") renderTech();
 window.scrollTo({top:0,behavior:"smooth"});
}
$$(".tab").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.tab)));
$$("[data-jump]").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.jump)));

function spriteTexture(system,asc){
 const base=D.systems[system].spriteSheet;
 if(!base)return "";
 const prefix=asc===0?"":asc===1?"Mega":asc===2?"Ultra":"Apex";
 return `assets/${prefix}${base}.png`;
}
function spriteHTML(system,rarity,asc,size=76){
 const info=D.spriteIndices[system]?.[rarity];
 if(!info)return "";
 const cfg=system==="mounts"?{cols:4,rows:4}:{cols:8,rows:8};
 const x=info.index%cfg.cols,y=Math.floor(info.index/cfg.cols);
 return `<div class="game-sprite" title="${esc(info.name)}" style="--sprite-url:url('${spriteTexture(system,asc)}');--cols:${cfg.cols};--rows:${cfg.rows};--x:${x};--y:${y};--size:${size}px"></div>`;
}
function itemImage(name){const f=D.itemAssets[name];return f?`<img class="item-atlas" src="assets/${f}" alt="${esc(name)}" loading="lazy">`:""}

function calcRatios(rows){
 return rows.slice(1).map((r,i)=>({from:rows[i].name,to:r.name,value:r.damage/rows[i].damage}));
}
function renderSystem(id){
 const root=$(`.system-root[data-system="${id}"]`); if(!root)return;
 const S=D.systems[id],asc=ascState[id],m=D.ascMultipliers[asc],rows=S.rows.map(r=>({...r,damage:r.damage*m,health:r.health*m}));
 const ratios=calcRatios(S.rows),full=S.rows.at(-1).damage/S.rows[0].damage,big=ratios.reduce((a,b)=>b.value>a.value?b:a,ratios[0]);
 const isItems=id==="items";
 root.innerHTML=`
 <div class="system-head">
   <div><div class="eyebrow">${S.icon} ${S.label.toUpperCase()} • AKTUALNY CONFIG</div><h2>${isItems?"Jak rośnie każdy tier?":"Jak rośnie każda rarity?"}</h2>
   <p>${isItems?"Bazowe HP/DMG reprezentują dominującą wartość danego Age z ItemBalancingLibrary.":"HP i DMG są prawdziwymi bazowymi statami z configu gry."}</p></div>
   <div class="asc-select"><span>ASCENSION</span><div>${D.ascMultipliers.map((x,i)=>`<button data-sys="${id}" data-a="${i}" class="${i===asc?"active":""}">A${i}<small>×${fmt(x)}</small></button>`).join("")}</div></div>
 </div>
 <div class="quick-stats">
   <article><span>PEŁNA PROGRESJA</span><b>×${fmt(full)}</b><small>${S.rows.at(-1).name} vs ${S.rows[0].name}</small></article>
   <article><span>NAJWIĘKSZY SKOK</span><b>×${fmt(big.value)}</b><small>${big.from} → ${big.to}</small></article>
   <article><span>ASCENSION A${asc}</span><b>×${fmt(m)}</b><small>mnożnik względem A0</small></article>
   <article><span>PRÓG ASCENSION</span><b>${S.eligibility}</b><small>z oficjalnego poradnika</small></article>
 </div>
 <section class="visual-card">
   <div class="card-headline"><div><span>1 • WYGLĄD + STATY</span><h3>${isItems?"Tier po tierze":"Rarity po rarity"}</h3></div><small>autentyczne assety z repo</small></div>
   <div class="rarity-assets">${rows.map(r=>`<article data-rarity="${r.name}" style="--c:${COLORS[r.name]||"#889"}">${isItems?itemImage(r.name):spriteHTML(id,r.name,asc)}<b>${r.name}</b><div><span>⚔️ ${fmt(r.damage)}</span><span>❤️ ${fmt(r.health)}</span>${r.hatch?`<span>🥚 ${fmtTime(r.hatch)}</span>`:""}</div></article>`).join("")}</div>
 </section>
 <section class="visual-card">
   <div class="card-headline"><div><span>2 • WYKRES PROGRESJI</span><h3>Jedna wspólna skala mocy</h3></div><small>oś Y jest logarytmiczna</small></div>
   <div class="svg-host" data-chart="rarity"></div>
 </section>
 ${id==="skills"?`<section class="visual-card"><div class="card-headline"><div><span>SKILLE • AKTYWNE EFEKTY</span><h3>Przykłady z SkillLibrary</h3></div><small>Level 1 aktywnego skilla</small></div><div class="skill-grid">${D.skillExamples.map(s=>`<article style="--c:${COLORS[s.rarity]}">${spriteHTML("skills",s.rarity,asc,66).replace(/--x:\d+;--y:\d+;/,(()=>{const i=s.spriteIndex,x=i%8,y=Math.floor(i/8);return `--x:${x};--y:${y};`})())}<div class="skill-title"><b>${s.name}</b><span>${s.rarity}</span></div><div class="skill-meta"><span>CD <b>${s.cooldown}s</b></span><span>Duration <b>${s.duration}s</b></span></div><div class="skill-values"><span>Passive ⚔️ <b>${fmt(s.passiveDamage*m)}</b></span><span>Passive ❤️ <b>${fmt(s.passiveHealth*m)}</b></span>${s.activeDamage?`<span>Active ⚔️ <b>${fmt(s.activeDamage*m)}</b></span>`:""}${s.activeHealth?`<span>Active ❤️ <b>${fmt(s.activeHealth*m)}</b></span>`:""}</div></article>`).join("")}</div></section>`:""}
 <section class="visual-card asc-full">
   <div class="card-headline"><div><span>3 • PEŁNA ŚCIEŻKA ASCENSION</span><h3>A0 → A1 → A2 → A3 na tej samej skali</h3></div><small>Common A1 ≠ Common A0</small></div>
   <div class="recovery-note"><b>Według oficjalnego poradnika:</b> stara moc jest odzyskiwana mniej więcej przy <strong>${S.recovery}</strong> po Ascension. Wykres pokazuje jednak prawdziwe surowe staty — nie wymusza sztucznej równości.</div>
   <div class="svg-host wide" data-chart="asc"></div>
 </section>
 <section class="source-mini"><b>Źródła tej zakładki:</b> ${sourceText(id)}</section>`;
 $$(`button[data-sys="${id}"]`,root).forEach(b=>b.addEventListener("click",()=>{ascState[id]=Number(b.dataset.a);renderSystem(id)}));
 renderRarityChart($('[data-chart="rarity"]',root),rows,id);
 renderAscChart($('[data-chart="asc"]',root),S,id);
 bindAssetInteractions(id);
 if(chartSelection[id])syncRarityHighlight(id,chartSelection[id],{sticky:false});
}
function sourceText(id){
 return id==="pets"?"PetUpgradeLibrary.json + EggLibrary.json + AscensionConfigsLibrary.json":
 id==="mounts"?"MountUpgradeLibrary.json + AscensionConfigsLibrary.json":
 id==="skills"?"SkillPassiveLibrary.json + SkillLibrary.json + AscensionConfigsLibrary.json":
 "ItemBalancingLibrary.json + AscensionConfigsLibrary.json";
}

function renderRarityChart(host,rows,id){
 const profile=chartProfile(host,rows.length,1);
 const W=profile.intrinsic,H=500,L=108,R=48,T=78,B=42;
 const base=rows[0].damage;
 const mults=rows.map(r=>r.damage/base);
 const hi=Math.log10(Math.max(...mults)),lo=0;
 const x=i=>L+i*(W-L-R)/(rows.length-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo||1)*(H-T-B);
 const pts=rows.map((r,i)=>({name:r.name,row:r,i,px:x(i),py:y(r.damage/base),color:COLORS[r.name]||"#88a"}));
 const ratios=calcRatios(rows);

 host.style.setProperty("--chart-intrinsic-width",W+"px");

 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg rarity-svg">`;
 svg+=`<text x="${L}" y="31" class="chart-kicker">PROGRESJA MOCY • NAZWA PRZY KROPCE • KLIK = PODŚWIETLENIE</text>`;

 const expMax=Math.ceil(hi);
 const exps=[];
 for(let p=0;p<=expMax;p+=Math.max(1,Math.ceil(expMax/5)))exps.push(p);
 if(exps.at(-1)!==expMax)exps.push(expMax);
 [...new Set(exps)].forEach(p=>{
   const v=10**p,yy=y(v);
   if(yy>=T-1&&yy<=H-B+1){
     svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid"/>
           <text x="${L-17}" y="${yy+5}" text-anchor="end" class="axis">${fmtAxis(v)}</text>`;
   }
 });

 svg+=`<polyline points="${pts.map(p=>`${p.px},${p.py}`).join(" ")}" class="power-line"/>`;

 // Reserve multiplier cards so labels never sit on top of ×N transitions.
 const ratioObstacles=[];
 for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],mx=(a.px+b.px)/2,my=Math.max(T+24,(a.py+b.py)/2-3);
   ratioObstacles.push({x:mx-40,y:my-20,w:80,h:38});
 }
 const labels=smartLabelLayout(
   pts,
   {x:L+2,y:T+8,w:W-L-R-4,h:H-T-B-18},
   {fontSize:profile.labelFont,height:profile.labelHeight,gap:profile.labelGap,padX:profile.labelPadX,obstacles:ratioObstacles}
 );

 labels.forEach(p=>{
   const r=p.row,c=p.color,b=p.box,t=labelLeaderTarget(p);
   const tip=`<b>${r.name} • A${ascState[id]}</b><span>⚔️ DMG: ${fmt(r.damage)}</span><span>❤️ HP: ${fmt(r.health)}</span>${r.hatch?`<span>🥚 Hatch: ${fmtTime(r.hatch)}</span>`:""}<small>Moc vs ${rows[0].name}: ${fmtAxis(r.damage/base)}</small>`;

   svg+=`<g class="chart-point" tabindex="0" data-rarity="${r.name}" data-tip="${esc(tip)}" style="--rarity:${c}">
           <circle cx="${p.px}" cy="${p.py}" r="9" fill="${c}" class="dot hit-dot"/>
           <circle cx="${p.px}" cy="${p.py}" r="19" class="dot-hit-area"/>
           <line x1="${p.px}" y1="${p.py}" x2="${t.x}" y2="${t.y}" class="point-label-link" stroke="${c}"/>
           <g class="point-rarity-label" transform="translate(${b.x+b.w/2},${b.y+b.h/2})">
             <rect x="${-b.w/2}" y="${-b.h/2}" width="${b.w}" height="${b.h}" rx="${Math.min(9,b.h/2)}"
                   fill="${c}" fill-opacity=".14" stroke="${c}"/>
             <text x="0" y="${profile.labelFont*.35}" text-anchor="middle" fill="${c}" style="font-size:${profile.labelFont}px">${r.name}</text>
           </g>
         </g>`;
 });

 // The multiplier belongs to the transition, not to either point.
 for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i],mx=(a.px+b.px)/2,my=Math.max(T+24,(a.py+b.py)/2-3);
   svg+=`<g class="ratio transition-ratio"><rect x="${mx-38}" y="${my-18}" width="76" height="34" rx="9"/>
         <text x="${mx}" y="${my+5}" text-anchor="middle">×${fmt(ratios[i-1].value)}</text></g>`;
 }

 svg+=`<text x="${L}" y="${H-15}" class="caption">Kolor fasolki = rarity • etykiety same szukają wolnego miejsca • przy węższym ekranie wykres rozszerza się zamiast ściskać tekst</text></svg>`;
 host.innerHTML=svg;
 bindChartInteractions(host,id);
}
function renderAscChart(host,S,id){
 const cycles=[0,1,2,3],rows=S.rows,n=rows.length;
 const profile=chartProfile(host,rows.length,4);
 const baseValue=rows[0].damage;
 const maxMultiple=(rows.at(-1).damage*D.ascMultipliers.at(-1))/baseValue;
 const hi=Math.log10(maxMultiple),lo=0;

 const W=profile.intrinsic,H=650,L=114,R=44,T=84,B=42;
 const usable=W-L-R;
 const cycleGap=profile.dense?94:84;
 const cycleW=(usable-cycleGap*3)/4;
 const cycleStart=a=>L+a*(cycleW+cycleGap);
 const xInCycle=(a,j)=>cycleStart(a)+j*cycleW/(n-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo)*(H-T-B);

 host.style.setProperty("--chart-intrinsic-width",W+"px");

 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg asc-svg continuous-asc">`;
 svg+=`<text x="${L}" y="32" class="chart-kicker">A0 → A3 • KOLOR + NAZWA PRZY KROPCE • SMART LAYOUT</text>`;
 svg+=`<text x="${W-R}" y="32" text-anchor="end" class="chart-subtitle">Common A1 = ×50 Common A0</text>`;

 const expMax=Math.ceil(hi),step=Math.max(1,Math.ceil(expMax/6));
 const exps=[];
 for(let p=0;p<=expMax;p+=step)exps.push(p);
 if(exps.at(-1)!==expMax)exps.push(expMax);
 [...new Set(exps)].forEach(p=>{
   const v=10**p,yy=y(v);
   if(yy<T-1||yy>H-B+1)return;
   svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid"/>
         <text x="${L-18}" y="${yy+5}" text-anchor="end" class="axis">${fmtAxis(v)}</text>`;
 });

 cycles.forEach(a=>{
   const x0=cycleStart(a);
   svg+=`<rect x="${x0-14}" y="${T-24}" width="${cycleW+28}" height="${H-T-B+12}" rx="15" class="cycle-band-soft"/>
         <text x="${x0+cycleW/2}" y="${T+1}" text-anchor="middle" class="cycle-title">A${a} • ${fmtMultExact(D.ascMultipliers[a])}</text>`;
 });
 cycles.slice(1).forEach(a=>{
   const sep=cycleStart(a)-cycleGap/2;
   svg+=`<line x1="${sep}" y1="${T-6}" x2="${sep}" y2="${H-B-2}" class="cycle-separator"/>`;
 });

 const recoveryIndex=rows.findIndex(r=>r.name===S.recovery);
 const cycleMeta=cycles.map(a=>{
   const local=rows.map((r,j)=>({
     name:r.name,j,row:r,color:COLORS[r.name]||"#88a",
     multiple:(r.damage*D.ascMultipliers[a])/baseValue,
     damage:r.damage*D.ascMultipliers[a],
     health:r.health*D.ascMultipliers[a],
     px:xInCycle(a,j),
     py:y((r.damage*D.ascMultipliers[a])/baseValue)
   }));
   const peak=local.at(-1);
   let incomingRecoveryBadge=null;
   if(a>0 && recoveryIndex>=0){
     const rp=local[recoveryIndex];
     const badgeY=Math.max(T+15,Math.min(H-B-45,rp.py-48));
     incomingRecoveryBadge={x:rp.px-68,y:badgeY,w:136,h:30};
   }
   return {a,local,peak,incomingRecoveryBadge};
 });

 cycles.forEach(a=>{
   const meta=cycleMeta[a];
   const local=meta.local;
   const peak=meta.peak;

   svg+=`<polyline points="${local.map(p=>`${p.px},${p.py}`).join(" ")}" class="power-line"/>`;

   const peakObstacle={x:peak.px-54,y:peak.py-54,w:108,h:38};
   const obstacles=[peakObstacle];
   if(meta.incomingRecoveryBadge)obstacles.push(meta.incomingRecoveryBadge);

   const labels=smartLabelLayout(
      local,
      {x:cycleStart(a)+3,y:T+16,w:cycleW-6,h:H-T-B-26},
      {
        fontSize:profile.labelFont,
        height:profile.labelHeight,
        gap:profile.labelGap,
        padX:profile.labelPadX,
        obstacles
      }
   );

   labels.forEach(p=>{
     const b=p.box,t=labelLeaderTarget(p),c=p.color;
     const tip=`<b>${p.name} • A${a}</b><span>⚔️ DMG: ${fmt(p.damage)}</span><span>❤️ HP: ${fmt(p.health)}</span><small>Moc vs A0 Common: ${fmtAxis(p.multiple)}</small>`;
     svg+=`<g class="chart-point asc-chart-point" tabindex="0" data-rarity="${p.name}" data-asc="${a}" data-tip="${esc(tip)}" style="--rarity:${c};color:${c}">
             <circle cx="${p.px}" cy="${p.py}" r="${p.j===n-1?9:7}" fill="${c}" class="dot hit-dot"/>
             <circle cx="${p.px}" cy="${p.py}" r="17" class="dot-hit-area"/>
             <line x1="${p.px}" y1="${p.py}" x2="${t.x}" y2="${t.y}" class="point-label-link" stroke="${c}"/>
             <g class="point-rarity-label compact" transform="translate(${b.x+b.w/2},${b.y+b.h/2})">
               <rect x="${-b.w/2}" y="${-b.h/2}" width="${b.w}" height="${b.h}" rx="${Math.min(8,b.h/2)}"/>
               <text x="0" y="${profile.labelFont*.34}" text-anchor="middle" style="font-size:${profile.labelFont}px">${p.name}</text>
             </g>
           </g>`;
   });

   const px=peak.px,py=peak.py;
   svg+=`<circle cx="${px}" cy="${py}" r="12" class="asc-peak-ring pointer-events-none"/>
         <g class="peak-label pointer-events-none">
           <rect x="${px-50}" y="${py-49}" width="100" height="27" rx="8"/>
           <text x="${px}" y="${py-31}" text-anchor="middle">${a<3?"ASCENSION":"KONIEC A3"}</text>
         </g>`;

   if(a<3){
     const nx=xInCycle(a+1,0);
     const nextCommon=(rows[0].damage*D.ascMultipliers[a+1])/baseValue;
     const ny=y(nextCommon);
     const gapCenter=(px+nx)/2;
     svg+=`<path d="M${px+8},${py+5} C${px+30},${py+30} ${nx-30},${ny-30} ${nx-8},${ny-5}" class="reset-curve pointer-events-none"/>
           <g class="reset-badge-clean pointer-events-none">
             <rect x="${gapCenter-35}" y="${(py+ny)/2-16}" width="70" height="32" rx="9"/>
             <text x="${gapCenter}" y="${(py+ny)/2+4}" text-anchor="middle">RESET</text>
           </g>`;

     if(recoveryIndex>=0){
       const rm=(rows[recoveryIndex].damage*D.ascMultipliers[a+1])/baseValue;
       const rx=xInCycle(a+1,recoveryIndex),ry=y(rm);
       const lineEndX=W-R-16;
       svg+=`<line x1="${px}" y1="${py}" x2="${lineEndX}" y2="${py}" class="recovery-guide-clean pointer-events-none"/>
             <circle cx="${rx}" cy="${ry}" r="8" class="recover-dot pointer-events-none"/>`;

       const badgeY=Math.max(T+15,Math.min(H-B-45,ry-48));
       const recoveryColor=COLORS[S.recovery]||"#63d09a";
       svg+=`<g class="recovery-badge-clean pointer-events-none" style="--recovery:${recoveryColor};color:${recoveryColor}">
               <rect x="${rx-68}" y="${badgeY}" width="136" height="30" rx="9"/>
               <text x="${rx}" y="${badgeY+20}" text-anchor="middle">${S.recovery} • recovery</text>
             </g>`;
     }
   }
 });

 svg+=`<text x="${L}" y="${H-15}" class="caption">Smart layout: etykiety wykrywają kolizje, zmieniają stronę/odległość i zachowują kolor rarity • na małym ekranie wykres dostaje własną szerokość i scroll</text></svg>`;
 host.innerHTML=svg;
 bindChartInteractions(host,id);
}
function renderAscensionGuide(){
 const host=$("#ascGuideCards"); if(!host)return;
 host.innerHTML=`<div class="guide-cards">${["pets","mounts","skills","items"].map(k=>{const g=D.guide.pillars[k];return `<article><div class="guide-top"><span>${g.label}</span><b>${g.eligibility}</b></div><div class="guide-three"><div><small>RESET</small><b>${g.reset}</b></div><div><small>ZOSTAJE</small><b>${g.keep}</b></div><div><small>ODZYSKANIE MOCY</small><b>${g.recovery}</b></div></div><div class="guide-target"><span>${g.targetLevel}</span><b>${g.base}</b><small>${g.discount}</small><small>${g.chance}</small>${g.alternative?`<p>${g.alternative}</p>`:""}</div></article>`}).join("")}</div>`;
 const adv=$("#officialGuide");
 adv.innerHTML=`<div class="base-stats">${D.guide.baseStats.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join("")}</div><div class="global-rules">${D.guide.global.map((x,i)=>`<div><b>${i+1}</b><span>${x}</span></div>`).join("")}</div>`;
}

function renderTech(){
 renderTechRecommendations();
 $("#techTierStrip").innerHTML=D.tech.tiers.map(t=>`<article><span>Tier ${roman(t.tier)}</span><b>${fmtTime(t.rank1Duration)}</b><small>1/5 • ${fmt(t.rank1Cost)} potions</small><small>1→5: ${fmtTime(t.fullDuration)} • ${fmt(t.fullCost)}</small></article>`).join("");
 renderTechBranch($(".tech-tabs button.active")?.dataset.tech||"Forge");
}
function roman(n){return ["I","II","III","IV","V"][n-1]||n}
function renderTechRecommendations(){
 const r=D.tech.recommendations,host=$("#techRecommendations");
 host.innerHTML=`<section class="tech-start"><span>START • NAJWAŻNIEJSZE</span><h3>Najpierw zrób to</h3><div>${r.start.map((x,i)=>`<article><b>${i+1}</b><span>${x}</span></article>`).join("")}</div><small>${r.note}</small></section>
 <div class="phase-grid"><article><span>🌱 EARLY</span>${r.early.map(x=>`<b>${x}</b>`).join("")}</article><article><span>⚙️ MID</span>${r.mid.map(x=>`<b>${x}</b>`).join("")}</article><article><span>🔥 LATE</span>${r.late.map(x=>`<b>${x}</b>`).join("")}</article></div>`;
}
function renderTechBranch(branch){
 $$(".tech-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tech===branch));
 const nodes=D.tech.branches[branch],host=$("#techBranch");
 host.innerHTML=`<div class="branch-head"><h3>${branch==="Forge"?"🔨 Forge":branch==="Power"?"⚔️ Power / Mounts":"🧬 Skills / Pets / Tech"}</h3><p>Układ i prerequisites pochodzą z PlayerTechTreePositionLibrary. Efekty poniżej są z aktualnego PlayerTechTreeNodeValuesLibrary.</p></div>
 <div class="node-grid">${nodes.map((n,i)=>`<article class="${priorityClass(n.type)}"><div class="node-order">#${i+1}</div><h4>${n.label}</h4><b>${n.effect}</b><div class="levels">${n.values.length?n.values.map((v,j)=>`<span>${j+1}/5 <strong>${formatTechValue(n.type,v)}</strong></span>`).join(""):"<span>1 poziom</span>"}</div><small>${n.requirements.length?`Wymaga node ID: ${n.requirements.join(", ")}`:"Start ścieżki"}</small></article>`).join("")}</div>`;
}
function priorityClass(type){
 if(["TechResearchTimer","TechNodeUpgradeCost","ForgeTimerSpeed","ForgeUpgradeCost"].includes(type))return "priority-top";
 if(["ExtraMountChance","MountSummonCost","FreeForgeChance","MaxOfflineReward","PetBonusDamage","PetBonusHealth"].includes(type))return "priority-high";
 return "";
}
function formatTechValue(type,v){
 if(type==="AutoForge")return "+1";
 if(type.endsWith("LevelUp"))return `+${v}`;
 const neg=["ForgeUpgradeCost","MountSummonCost","SkillSummonCost","TechNodeUpgradeCost"].includes(type);
 return `${neg?"-":"+"}${(v*100).toLocaleString("pl-PL",{maximumFractionDigits:0})}%`;
}
$$(".tech-tabs button").forEach(b=>b.addEventListener("click",()=>renderTechBranch(b.dataset.tech)));

renderSystem("pets");
})();
