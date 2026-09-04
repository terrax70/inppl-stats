
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
 const W=1360,H=470,L=105,R=45,T=72,B=70;
 const base=rows[0].damage;
 const mults=rows.map(r=>r.damage/base);
 const hi=Math.log10(Math.max(...mults)),lo=0;
 const x=i=>L+i*(W-L-R)/(rows.length-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo||1)*(H-T-B);
 const pts=rows.map((r,i)=>[x(i),y(r.damage/base)]);
 const ratios=calcRatios(rows);

 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg rarity-svg">`;
 svg+=`<text x="${L}" y="30" class="chart-kicker">PROGRESJA MOCY • KLIKNIJ RARITY, ŻEBY JE PODŚWIETLIĆ</text>`;

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

 svg+=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" class="power-line"/>`;

 rows.forEach((r,i)=>{
   const [px,py]=pts[i],c=COLORS[r.name]||"#88a";
   // Labels alternate above/below the point. This avoids collisions and makes the dot self-describing.
   let dy=(i%2===0?-31:34);
   if(py+dy<T+18)dy=34;
   if(py+dy>H-B-8)dy=-31;
   const labelY=py+dy;
   const width=Math.max(58,Math.min(92,r.name.length*7.4+22));
   const labelX=Math.max(L+width/2,Math.min(W-R-width/2,px));

   const tip=`<b>${r.name} • A${ascState[id]}</b><span>⚔️ DMG: ${fmt(r.damage)}</span><span>❤️ HP: ${fmt(r.health)}</span>${r.hatch?`<span>🥚 Hatch: ${fmtTime(r.hatch)}</span>`:""}<small>Moc vs ${rows[0].name}: ${fmtAxis(r.damage/base)}</small>`;

   svg+=`<g class="chart-point" tabindex="0" data-rarity="${r.name}" data-tip="${esc(tip)}">
           <circle cx="${px}" cy="${py}" r="9" fill="${c}" class="dot hit-dot"/>
           <circle cx="${px}" cy="${py}" r="18" class="dot-hit-area"/>
           <line x1="${px}" y1="${py+(dy<0?-10:10)}" x2="${labelX}" y2="${labelY+(dy<0?10:-10)}" class="point-label-link"/>
           <g class="point-rarity-label" transform="translate(${labelX},${labelY})">
             <rect x="${-width/2}" y="-13" width="${width}" height="26" rx="8"/>
             <text x="0" y="4" text-anchor="middle">${r.name}</text>
           </g>
         </g>`;

   // The multiplier belongs to the transition, not to the dot.
   if(i>0){
      const a=pts[i-1],mx=(a[0]+px)/2,my=Math.max(T+20,(a[1]+py)/2-4);
      svg+=`<g class="ratio transition-ratio"><rect x="${mx-38}" y="${my-18}" width="76" height="34" rx="9"/>
            <text x="${mx}" y="${my+5}" text-anchor="middle">×${fmt(ratios[i-1].value)}</text></g>`;
   }
 });
 svg+=`<text x="${L}" y="${H-20}" class="caption">Nazwa jest przy kropce • mnożnik pomiędzy kropkami pokazuje skok do następnego rarity • klik = podświetlenie</text></svg>`;
 host.innerHTML=svg;
 bindChartInteractions(host,id);
}
function renderAscChart(host,S,id){
 const cycles=[0,1,2,3],rows=S.rows,n=rows.length;
 const baseValue=rows[0].damage;
 const maxMultiple=(rows.at(-1).damage*D.ascMultipliers.at(-1))/baseValue;
 const hi=Math.log10(maxMultiple),lo=0;

 const W=1480,H=620,L=112,R=42,T=82,B=70;
 const usable=W-L-R;
 const cycleGap=82;
 const cycleW=(usable-cycleGap*3)/4;
 const cycleStart=a=>L+a*(cycleW+cycleGap);
 const xInCycle=(a,j)=>cycleStart(a)+j*cycleW/(n-1);
 const y=v=>T+(hi-Math.log10(v))/(hi-lo)*(H-T-B);

 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg asc-svg continuous-asc">`;
 svg+=`<text x="${L}" y="32" class="chart-kicker">A0 → A3 • KAŻDA KROPKA MA SWÓJ RARITY • KLIKNIJ, ABY ZOBACZYĆ GO NA KARTACH</text>`;
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
   svg+=`<rect x="${x0-14}" y="${T-24}" width="${cycleW+28}" height="${H-T-B+35}" rx="15" class="cycle-band-soft"/>
         <text x="${x0+cycleW/2}" y="${T+1}" text-anchor="middle" class="cycle-title">A${a} • ${fmtMultExact(D.ascMultipliers[a])}</text>`;
 });
 cycles.slice(1).forEach(a=>{
   const sep=cycleStart(a)-cycleGap/2;
   svg+=`<line x1="${sep}" y1="${T-6}" x2="${sep}" y2="${H-B+12}" class="cycle-separator"/>`;
 });

 cycles.forEach(a=>{
   const local=rows.map((r,j)=>({
      name:r.name,j,
      multiple:(r.damage*D.ascMultipliers[a])/baseValue,
      damage:r.damage*D.ascMultipliers[a],
      health:r.health*D.ascMultipliers[a]
   }));

   svg+=`<polyline points="${local.map(p=>`${xInCycle(a,p.j)},${y(p.multiple)}`).join(" ")}" class="power-line"/>`;

   local.forEach(p=>{
     const px=xInCycle(a,p.j),py=y(p.multiple),c=COLORS[p.name]||"#88a";

     // Stagger labels around points. Edge labels point inward.
     let dx=0,dy=(p.j%2===0?-27:29);
     if(p.j===0)dx=18;
     if(p.j===n-1)dx=-18;
     if(py+dy<T+18)dy=29;
     if(py+dy>H-B-8)dy=-27;
     const width=Math.max(48,Math.min(74,p.name.length*5.9+16));
     const lx=Math.max(cycleStart(a)+width/2-2,Math.min(cycleStart(a)+cycleW-width/2+2,px+dx));
     const ly=py+dy;

     const tip=`<b>${p.name} • A${a}</b><span>⚔️ DMG: ${fmt(p.damage)}</span><span>❤️ HP: ${fmt(p.health)}</span><small>Moc vs A0 Common: ${fmtAxis(p.multiple)}</small>`;

     svg+=`<g class="chart-point asc-chart-point" tabindex="0" data-rarity="${p.name}" data-asc="${a}" data-tip="${esc(tip)}">
             <circle cx="${px}" cy="${py}" r="${p.j===n-1?9:7}" fill="${c}" class="dot hit-dot"/>
             <circle cx="${px}" cy="${py}" r="16" class="dot-hit-area"/>
             <line x1="${px}" y1="${py+(dy<0?-8:8)}" x2="${lx}" y2="${ly+(dy<0?9:-9)}" class="point-label-link"/>
             <g class="point-rarity-label compact" transform="translate(${lx},${ly})">
               <rect x="${-width/2}" y="-11" width="${width}" height="22" rx="7"/>
               <text x="0" y="3.5" text-anchor="middle">${p.name}</text>
             </g>
           </g>`;
   });

   const peak=local.at(-1);
   const px=xInCycle(a,n-1),py=y(peak.multiple);
   svg+=`<circle cx="${px}" cy="${py}" r="12" class="asc-peak-ring pointer-events-none"/>
         <g class="peak-label pointer-events-none">
           <rect x="${px-50}" y="${py-48}" width="100" height="27" rx="8"/>
           <text x="${px}" y="${py-30}" text-anchor="middle">${a<3?"ASCENSION":"KONIEC A3"}</text>
         </g>`;

   if(a<3){
     const nx=xInCycle(a+1,0);
     const nextCommon=(rows[0].damage*D.ascMultipliers[a+1])/baseValue;
     const ny=y(nextCommon);
     const gapCenter=(px+nx)/2;
     svg+=`<path d="M${px+8},${py+5} C${px+28},${py+30} ${nx-28},${ny-30} ${nx-8},${ny-5}" class="reset-curve pointer-events-none"/>
           <g class="reset-badge-clean pointer-events-none">
             <rect x="${gapCenter-35}" y="${(py+ny)/2-16}" width="70" height="32" rx="9"/>
             <text x="${gapCenter}" y="${(py+ny)/2+4}" text-anchor="middle">RESET</text>
           </g>`;

     const recoveryIndex=rows.findIndex(r=>r.name===S.recovery);
     if(recoveryIndex>=0){
       const rm=(rows[recoveryIndex].damage*D.ascMultipliers[a+1])/baseValue;
       const rx=xInCycle(a+1,recoveryIndex),ry=y(rm);
       const lineEndX=W-R-16;
       svg+=`<line x1="${px}" y1="${py}" x2="${lineEndX}" y2="${py}" class="recovery-guide-clean pointer-events-none"/>
             <circle cx="${rx}" cy="${ry}" r="8" class="recover-dot pointer-events-none"/>`;

       const badgeY=Math.max(T+15,Math.min(H-B-45,ry-45));
       svg+=`<g class="recovery-badge-clean pointer-events-none">
               <rect x="${rx-68}" y="${badgeY}" width="136" height="30" rx="9"/>
               <text x="${rx}" y="${badgeY+20}" text-anchor="middle">${S.recovery} • recovery</text>
             </g>`;
     }
   }
 });

 svg+=`<text x="${L}" y="${H-19}" class="caption">Kliknięcie punktu A1/A2/A3 przełącza karty na tę Ascension i podświetla wybrane rarity</text></svg>`;
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
