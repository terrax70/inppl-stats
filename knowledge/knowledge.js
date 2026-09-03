(()=>{
const D=window.FORGE_KNOWLEDGE;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const NS="http://www.w3.org/2000/svg";
const ascState={pets:0,mounts:0,items:0};
const ascMultiplier=level=>D.ascensionMultipliers.find(x=>x.level===Number(level))?.multiplier||1;
const scaledRows=(rows,level)=>rows.map(r=>({
  ...r,
  baseHealth:r.health,
  baseDamage:r.damage,
  health:r.health*ascMultiplier(level),
  damage:r.damage*ascMultiplier(level)
}));

const fmt=n=>{
  if(n>=1e9)return (n/1e9).toLocaleString("pl-PL",{maximumFractionDigits:2})+" mld";
  if(n>=1e6)return (n/1e6).toLocaleString("pl-PL",{maximumFractionDigits:2})+" mln";
  if(n>=1e3)return (n/1e3).toLocaleString("pl-PL",{maximumFractionDigits:1})+"k";
  return Math.round(n).toLocaleString("pl-PL");
};
const fmtTime=s=>{
  if(s<3600)return `${Math.round(s/60)} min`;
  return `${Math.round(s/3600)} h`;
};
const labelMetric=m=>m==="health"?"HP":m==="damage"?"Damage":"Czas wyklucia";
const valueFormat=(m,v)=>m==="hatchSeconds"?fmtTime(v):fmt(v);
const ratio=(a,b)=>a?b/a:null;

function svgEl(tag, attrs={}, text=null){
 const e=document.createElementNS(NS,tag);
 Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));
 if(text!=null)e.textContent=text;
 return e;
}


function renderProgressViz(containerId, rows, systemName, ascLevel=0){
 const host=$(containerId); host.innerHTML="";
 const W=1400;
 const rowGap = rows.length >= 9 ? 76 : 88;
 const top = 86;
 const bottomPad = 72;
 const H = Math.max(620, top + (rows.length-1)*rowGap + bottomPad);
 const bottom = H-bottomPad;
 const ladderX=38, ladderW=325, chartX=535, chartW=790;
 const plotH=bottom-top;

 // Normalize to Common = 1. HP and Damage have identical rarity multipliers,
 // so one curve is enough and raw HP/DMG remain visible at each point.
 const baseDamage=rows[0].damage;
 const power=rows.map(r=>r.damage/baseDamage);
 const min=1,max=Math.max(...power);
 const logMin=0,logMax=Math.log10(max);
 const y=v=>bottom-((Math.log10(v)-logMin)/(logMax-logMin||1))*plotH;
 const x=i=>chartX+(i/(rows.length-1))*chartW;
 const nodeY=i=>top+(rows.length-1-i)*rowGap;

 const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,class:"viz-svg",role:"img","aria-label":`${systemName}: progresja rarity i mnożniki siły`});
 svg.style.height = H+"px";
 host.style.minHeight = H+"px";
 const defs=svgEl("defs");
 const grad=svgEl("linearGradient",{id:"areaGrad",x1:"0",y1:"0",x2:"0",y2:"1"});
 grad.append(svgEl("stop",{offset:"0%","stop-color":"#6aaef6","stop-opacity":".50"}),
             svgEl("stop",{offset:"100%","stop-color":"#6aaef6","stop-opacity":"0"}));
 const marker=svgEl("marker",{id:"arrow",markerWidth:"8",markerHeight:"8",refX:"7",refY:"3",orient:"auto",markerUnits:"strokeWidth"});
 marker.append(svgEl("path",{d:"M0,0 L0,6 L8,3 z",class:"arrow-head"}));
 defs.append(grad,marker); svg.append(defs);

 // ratio grid
 [1,10,100,1000,10000,100000].filter(v=>v<=max*1.2).forEach(v=>{
   const yy=y(Math.min(v,max));
   svg.append(svgEl("line",{x1:chartX,y1:yy,x2:chartX+chartW,y2:yy,class:"grid-line"}));
 });
 svg.append(svgEl("text",{x:chartX,y:30,class:"chart-title"},`${systemName.toUpperCase()} • A${ascLevel} • COMMON = ×1`));
 svg.append(svgEl("text",{x:chartX,y:48,class:"chart-note"},`Ascension A${ascLevel}: staty bazowe ×${ascMultiplier(ascLevel).toLocaleString("pl-PL")} • złote × = skok rarity`));

 svg.append(svgEl("line",{x1:ladderX+22,y1:top,x2:ladderX+22,y2:bottom,class:"ladder-spine"}));

 const pts=rows.map((r,i)=>[x(i),y(power[i])]);
 const path=pts.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" ");
 const area=path+` L${pts.at(-1)[0]},${bottom} L${pts[0][0]},${bottom} Z`;
 svg.append(svgEl("path",{d:area,class:"plot-area"}));
 svg.append(svgEl("path",{d:path,class:"plot-line"}));

 rows.forEach((r,i)=>{
   const ny=nodeY(i),px=x(i),py=y(power[i]),c=(D.colors[r.rarity]||D.itemTierColors?.[r.rarity]||"#8abcf5");
   const sx=ladderX+ladderW,sy=ny,mx=chartX-50;

   const connector=svgEl("path",{
     d:`M${sx},${sy} C${mx-35},${sy} ${mx-8},${py} ${px-10},${py}`,
     class:"connector","marker-end":"url(#arrow)"
   });
   svg.append(connector);

   const g=svgEl("g",{class:"ladder-node",tabindex:"0","data-i":i});
   g.append(svgEl("rect",{x:ladderX+42,y:ny-30,width:ladderW-42,height:60,rx:8,class:"node-bg"}));
   g.append(svgEl("circle",{cx:ladderX+22,cy:ny,r:8,fill:c,stroke:"#0a1017","stroke-width":"4"}));
   g.append(svgEl("text",{x:ladderX+58,y:ny-10,fill:c,class:"node-rarity"},r.rarity.toUpperCase()));
   g.append(svgEl("text",{x:ladderX+58,y:ny+7,class:"node-value"},`❤️ HP ${fmt(r.health)}   ⚔️ DMG ${fmt(r.damage)}`));
   if(r.hatchSeconds){
     g.append(svgEl("text",{x:ladderX+58,y:ny+22,class:"node-hatch"},`🥚 Wyklucie: ${fmtTime(r.hatchSeconds)}`));
     g.append(svgEl("text",{x:ladderX+205,y:ny+22,class:"node-sub"},`vs Common: ×${power[i].toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
   }else{
     g.append(svgEl("text",{x:ladderX+58,y:ny+24,class:"node-sub"},`Łącznie względem Common: ×${power[i].toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
   }
   svg.append(g);

   const p=svgEl("circle",{cx:px,cy:py,r:8,fill:c,class:"point","data-i":i});
   svg.append(p);
   svg.append(svgEl("text",{x:px,y:bottom+30,"text-anchor":"middle",fill:c,class:"axis-text"},(r.rarity==="Early-Modern"?"E-Mod":r.rarity==="Interstellar"?"Inter":r.rarity==="Multiverse"?"Multi":r.rarity==="Underworld"?"Under":r.rarity.slice(0,5))));

   // MOST IMPORTANT: one self-contained multiplier card between points.
   // Its position is based on the actual segment midpoint and shifted away from the curve.
   if(i>0){
     const step=rows[i].damage/rows[i-1].damage;
     const prev=pts[i-1];
     const mxp=(prev[0]+px)/2;
     const lineMidY=(prev[1]+py)/2;

     const boxW = rows.length >= 9 ? 126 : 136;
     const boxH = 54;
     const desiredY = lineMidY - 48;
     const myp = Math.max(52, Math.min(bottom-92, desiredY));

     const fromLabel = rows[i-1].rarity;
     const toLabel = r.rarity;
     const transition = `${fromLabel} → ${toLabel}`;

     const tag=svgEl("g",{class:"mega-ratio"});
     tag.append(svgEl("rect",{x:mxp-boxW/2,y:myp-boxH/2,width:boxW,height:boxH,rx:10}));
     tag.append(svgEl("text",{x:mxp,y:myp-7,"text-anchor":"middle",class:"ratio-transition"},transition));
     tag.append(svgEl("text",{x:mxp,y:myp+15,"text-anchor":"middle",class:"ratio-number"},`×${step.toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
     svg.append(tag);
   }

   const activate=()=>{
     svg.querySelectorAll(".ladder-node").forEach(x=>x.classList.remove("active"));
     svg.querySelectorAll(".connector").forEach(x=>x.classList.remove("active"));
     g.classList.add("active");connector.classList.add("active");
   };
   g.addEventListener("mouseenter",activate);p.addEventListener("mouseenter",activate);
 });

 host.append(svg);

 const tip=document.createElement("div");tip.className="tooltip";host.append(tip);
 svg.querySelectorAll(".point").forEach(p=>{
   p.addEventListener("mousemove",ev=>{
     const i=Number(p.dataset.i),r=rows[i];
     const step=i?rows[i].damage/rows[i-1].damage:null;
     tip.innerHTML=`<b style="color:${(D.colors[r.rarity]||D.itemTierColors?.[r.rarity]||"#8abcf5")}">${r.rarity}</b>
       <span>Ascension: <strong>A${ascLevel} • ×${ascMultiplier(ascLevel).toLocaleString("pl-PL")}</strong></span>
       <span>❤️ HP: <strong>${fmt(r.health)}</strong></span>
       <span>⚔️ DMG: <strong>${fmt(r.damage)}</strong></span>
       ${ascLevel>0?`<span class="tip-base">A0: ❤️ ${fmt(r.baseHealth)} • ⚔️ ${fmt(r.baseDamage)}</span>`:""}
       ${r.hatchSeconds?`<span>🥚 Wyklucie: <strong>${fmtTime(r.hatchSeconds)}</strong></span>`:""}
       <span>vs Common: <strong>×${power[i].toLocaleString("pl-PL",{maximumFractionDigits:1})}</strong></span>
       ${step?`<span>vs ${rows[i-1].rarity}: <strong>×${step.toLocaleString("pl-PL",{maximumFractionDigits:1})}</strong></span>`:""}`;
     tip.style.display="block";
     const rect=host.getBoundingClientRect();
     tip.style.left=Math.min(ev.clientX-rect.left+14,rect.width-220)+"px";
     tip.style.top=Math.max(10,ev.clientY-rect.top-18)+"px";
   });
   p.addEventListener("mouseleave",()=>tip.style.display="none");
 });
}

function renderProgressInsights(target,rows){
 const steps=rows.slice(1).map((r,i)=>({
   from:rows[i].rarity,to:r.rarity,ratio:r.damage/rows[i].damage
 }));
 const biggest=[...steps].sort((a,b)=>b.ratio-a.ratio)[0];
 const total=rows.at(-1).damage/rows[0].damage;
 const htmlSteps=steps.map(x=>`<span class="mini-step"><b>×${x.ratio.toLocaleString("pl-PL",{maximumFractionDigits:1})}</b><small>${x.from} → ${x.to}</small></span>`).join("");
 $(target).innerHTML=`
   <article class="insight primary-insight"><span>PEŁNA PROGRESJA</span><b>×${total.toLocaleString("pl-PL",{maximumFractionDigits:1})}</b><small>Mythic względem Common.</small></article>
   <article class="insight primary-insight"><span>NAJWIĘKSZY SKOK</span><b>×${biggest.ratio.toLocaleString("pl-PL",{maximumFractionDigits:1})}</b><small>${biggest.from} → ${biggest.to}</small></article>
   <article class="insight step-strip"><span>WSZYSTKIE SKOKI</span><div>${htmlSteps}</div></article>`;
}

function renderPets(){
 const level=ascState.pets;
 const rows=scaledRows(D.pets,level);
 renderProgressViz("#petViz",rows,"Pety",level);
 renderProgressInsights("#petInsights",rows);
 updateAscUI("pets",level);
}
function renderMounts(){
 const level=ascState.mounts;
 const rows=scaledRows(D.mounts,level);
 renderProgressViz("#mountViz",rows,"Mounty",level);
 renderProgressInsights("#mountInsights",rows);
 updateAscUI("mounts",level);
}

function renderItems(){
 const level=ascState.items;
 const itemRows=scaledRows(D.itemTiers,level);
 renderProgressViz("#itemViz",itemRows,"Itemy",level);
 renderProgressInsights("#itemInsights",itemRows);
 updateAscUI("items",level);

 // Override wording for item-specific insight cards.
 const box=$("#itemInsights");
 if(box){
   const total=itemRows.at(-1).damage/itemRows[0].damage;
   const steps=itemRows.slice(1).map((r,i)=>({
     from:itemRows[i].rarity,to:r.rarity,ratio:r.damage/itemRows[i].damage
   }));
   box.innerHTML=`
     <article class="insight primary-insight"><span>PRIMITIVE → DIVINE</span><b>×${total.toLocaleString("pl-PL")}</b><small>Divine ma ${total.toLocaleString("pl-PL")}× większą bazową statystykę niż Primitive.</small></article>
     <article class="insight primary-insight"><span>A${level} • ASCENSION</span><b>×${ascMultiplier(level).toLocaleString("pl-PL")}</b><small>Mnożnik wszystkich ❤️ HP i ⚔️ DMG względem A0. Każdy kolejny tier nadal = ×4.</small></article>
     <article class="insight step-strip"><span>WSZYSTKIE SKOKI</span><div>${steps.map(x=>`<span class="mini-step"><b>×4</b><small>${x.from} → ${x.to}</small></span>`).join("")}</div></article>`;
 }
}


function getRarityRow(section, rarity){
 const rows = section==="items" ? D.itemTiers : section==="pets" ? D.pets : D.mounts;
 return rows.find(r=>r.rarity===rarity);
}



function renderAscensionPath(section, hostId){
 const cfg=D.ascensionPaths[section];
 const baseRows = section==="items" ? D.itemTiers : section==="pets" ? D.pets : D.mounts;
 const host=$(hostId); if(!host)return;
 host.innerHTML="";

 const W=1700;
 const cycleCount=4;
 const cycleW=390;
 const left=70,right=30,top=78,bottom=590,H=680;
 const chartH=bottom-top;

 // Each Ascension cycle uses its own local 0→100% power scale.
 // This preserves the real ordering inside a cycle:
 // Common < ... < Mythic/Divine.
 // A0/A1/A2/A3 differ in their absolute raw values, shown in labels/tooltips.
 const endRow=baseRows.at(-1);
 const recoveryIndex=baseRows.findIndex(r=>r.rarity===cfg.recoveryRarity);
 const recoveryRow=baseRows[recoveryIndex];

 const localPower = r => r.damage/endRow.damage;
 const y = rel => bottom - Math.max(0,Math.min(1,rel))*chartH;

 const svg=svgEl("svg",{
   viewBox:`0 0 ${W} ${H}`,
   class:"asc-path-svg corrected-asc-svg",
   role:"img",
   "aria-label":`${cfg.system}: rarity rośnie do końca cyklu, Ascension dopiero przy ${cfg.eligibilityLabel}`
 });

 const defs=svgEl("defs");
 const markerId=`ascResetArrow-${section}`;
 const marker=svgEl("marker",{id:markerId,markerWidth:"8",markerHeight:"8",refX:"7",refY:"3",orient:"auto"});
 marker.append(svgEl("path",{d:"M0,0 L0,6 L8,3 z",class:"reset-arrow-head"}));
 defs.append(marker);
 svg.append(defs);

 // Reference grid.
 [0,.25,.5,.75,1].forEach(v=>{
   const yy=y(v);
   svg.append(svgEl("line",{x1:left,y1:yy,x2:W-right,y2:yy,class:v===1?"power-ref old":"power-ref"}));
   svg.append(svgEl("text",{x:left-12,y:yy+4,"text-anchor":"end",class:v===1?"power-axis old":"power-axis"},
     v===1?"100% końca cyklu":`${Math.round(v*100)}%`));
 });

 // Render each A cycle with every rarity/tier in correct order.
 for(let a=0;a<cycleCount;a++){
   const ascMul=ascMultiplier(a);
   const cx0=left+a*cycleW;
   const cx1=cx0+cycleW-70;
   const stepX=(cx1-cx0)/(baseRows.length-1);

   svg.append(svgEl("rect",{
     x:cx0-24,y:top-34,width:(cx1-cx0)+48,height:chartH+58,rx:14,class:"cycle-band"
   }));
   svg.append(svgEl("text",{
     x:(cx0+cx1)/2,y:top-12,"text-anchor":"middle",class:"cycle-label"
   },`A${a} • ${cfg.eligibilityLabel}`));

   const pts=baseRows.map((r,i)=>[
     cx0+i*stepX,
     y(localPower(r))
   ]);
   const path=pts.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" ");
   svg.append(svgEl("path",{d:path,class:"cycle-power-line"}));

   baseRows.forEach((r,i)=>{
     const [px,py]=pts[i];
     const isEnd=i===baseRows.length-1;
     const isRecovery=i===recoveryIndex && a>0;
     let cls="cycle-power-point";
     if(isEnd)cls+=" end";
     if(isRecovery)cls+=" recovery";

     const point=svgEl("circle",{cx:px,cy:py,r:isEnd?7:5,class:cls});
     const pointTitle=svgEl("title",{},`${r.rarity} • A${a}\n❤️ HP ${fmt(r.health*ascMul)}\n⚔ DMG ${fmt(r.damage*ascMul)}`);
     point.appendChild(pointTitle);
     svg.append(point);

     // Reduce label clutter for item tiers.
     const showLabel = baseRows.length<=6 || i===0 || isEnd || isRecovery || i%2===0;
     if(showLabel){
       const short=r.rarity
         .replace("Early-Modern","E-Mod")
         .replace("Interstellar","Inter")
         .replace("Multiverse","Multi")
         .replace("Underworld","Under");
       svg.append(svgEl("text",{
         x:px,y:bottom+22,"text-anchor":"middle",class:isRecovery?"cycle-rarity recovery":"cycle-rarity"
       },short));
     }

     if(isRecovery){
       // Compare recovery rarity after Ascension with previous cycle end.
       const previousPeak=endRow.damage*ascMultiplier(a-1);
       const recoveryValue=r.damage*ascMul;
       const pct=recoveryValue/previousPeak*100;

       const gy=py-52;
       const g=svgEl("g",{class:"recovery-marker"});
       g.append(svgEl("rect",{x:px-66,y:gy-19,width:132,height:39,rx:8}));
       g.append(svgEl("text",{x:px,y:gy-3,"text-anchor":"middle",class:"recovery-marker-title"},"ODZYSK STAREJ MOCY"));
       g.append(svgEl("text",{x:px,y:gy+12,"text-anchor":"middle",class:"recovery-marker-sub"},
         `${cfg.recoveryRarity} • ~${pct.toLocaleString("pl-PL",{maximumFractionDigits:0})}%`));
       svg.append(g);

       // Horizontal old-power guide from previous peak to recovery point.
       const prevEndX=left+(a-1)*cycleW+(cycleW-70);
       svg.append(svgEl("line",{x1:prevEndX,y1:y(1),x2:px,y2:py,class:"recovery-guide"}));
     }

     if(isEnd){
       const gateY=py-48;
       const gate=svgEl("g",{class:"eligibility-gate"});
       gate.append(svgEl("rect",{x:px-61,y:gateY-19,width:122,height:39,rx:9}));
       gate.append(svgEl("text",{x:px,y:gateY-3,"text-anchor":"middle",class:"eligibility-title"},
         a<3?"ASCENSION GOTOWA":"KONIEC A3"));
       gate.append(svgEl("text",{x:px,y:gateY+12,"text-anchor":"middle",class:"eligibility-sub"},
         cfg.eligibilityLabel));
       svg.append(g);
     }
   });

   // Between cycles: show reset from previous peak to next Common.
   if(a<cycleCount-1){
     const endX=cx1;
     const endY=y(1);
     const nextCommonX=left+(a+1)*cycleW;
     const nextCommonRel=baseRows[0].damage/endRow.damage;
     const nextCommonY=y(nextCommonRel);

     svg.append(svgEl("path",{
       d:`M${endX},${endY} C${endX+35},${endY+35} ${nextCommonX-35},${nextCommonY-35} ${nextCommonX},${nextCommonY}`,
       class:"asc-reset-arrow",
       "marker-end":`url(#${markerId})`
     }));

     // Real raw drop ratio: peak A -> Common A+1.
     const peakRaw=endRow.damage*ascMultiplier(a);
     const resetRaw=baseRows[0].damage*ascMultiplier(a+1);
     const factor=peakRaw/resetRaw;
     const pctLoss=(1-resetRaw/peakRaw)*100;
     const bx=(endX+nextCommonX)/2;
     const by=(endY+nextCommonY)/2;

     const g=svgEl("g",{class:"reset-badge"});
     g.append(svgEl("rect",{x:bx-78,y:by-28,width:156,height:56,rx:10}));
     g.append(svgEl("text",{x:bx,y:by-10,"text-anchor":"middle",class:"reset-title"},"ASCEND / RESET"));
     g.append(svgEl("text",{x:bx,y:by+8,"text-anchor":"middle",class:"reset-factor"},
       factor>=1?`↓ ×${factor.toLocaleString("pl-PL",{maximumFractionDigits:1})}`:`↑ ×${(1/factor).toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
     g.append(svgEl("text",{x:bx,y:by+21,"text-anchor":"middle",class:"reset-pct"},
       pctLoss>=0?`−${pctLoss.toLocaleString("pl-PL",{maximumFractionDigits:1})}%`:`+${(-pctLoss).toLocaleString("pl-PL",{maximumFractionDigits:1})}%`));
     svg.append(g);
   }
 }

 svg.append(svgEl("text",{x:left,y:H-28,class:"power-path-foot"},
   `Rarity/tier zawsze rośnie w cyklu. Ascension odblokowuje dopiero ${cfg.eligibilityLabel}. ${cfg.recoveryRarity} = próg odzyskania starej mocy z poradnika.`));

 host.append(svg);

 const copy=document.querySelector(`[data-path-copy="${section}"]`);
 if(copy){
   copy.innerHTML=`W każdym cyklu rarity/tier rośnie normalnie aż do <b>${cfg.endRarity}</b>. <b>Ascension nie zależy od rarity</b> — można ją zrobić dopiero przy <b>${cfg.eligibilityLabel}</b>. Po resecie poradnik wskazuje <b>${cfg.recoveryRarity}</b> jako około-próg odzyskania poprzedniej mocy.`;
 }
}

function renderAllAscensionPaths(){
 const jobs=[
   ["pets","#petsAscPath"],
   ["mounts","#mountsAscPath"],
   ["items","#itemsAscPath"]
 ];
 jobs.forEach(([section,host])=>{
   try{
     renderAscensionPath(section,host);
   }catch(err){
     console.error("Ascension path render failed:",section,err);
     const el=$(host);
     if(el){
       el.innerHTML=`<div class="chart-error"><b>Nie udało się wyrenderować wykresu ${section}.</b><span>${err?.message||err}</span></div>`;
     }
   }
 });
}

function renderAscension(){
 const A=D.ascension;
 const labels={gold:"Gold",tickets:"Tickets",eggshells:"Eggshells",clockwinders:"Clockwinders"};
 const order=["gold","tickets","eggshells","clockwinders"];

 $("#costBars").innerHTML=order.map(k=>{
   const b=A.totalCost.base[k],t=A.totalCost.maxTech[k];
   const pct=t/b*100,save=(1-t/b)*100;
   return `<div class="cost-row">
     <div class="cost-label">${labels[k]}<small>${A.discounts[k]}</small></div>
     <div class="bar-track">
       <div class="bar-base" style="width:100%"></div>
       <div class="bar-tech" style="width:${pct}%"></div>
     </div>
     <div class="cost-values">
       <b>${A.rounded.maxTech[k]}</b>
       <small>Base: ${A.rounded.base[k]} • −${save.toLocaleString("pl-PL",{maximumFractionDigits:1})}%</small>
     </div>
   </div>`;
 }).join("");

 $("#costFootnote").innerHTML=`Żółty pasek = koszt z Maxed Tech. Szary = koszt bazowy. Wartości i zaokrąglenia są przepisane z arkusza.`;

 $("#ascChecklist").innerHTML=A.checklist.map((x,i)=>`
   <div class="check-row">
     <div class="check-num">${String(i+1).padStart(2,"0")}</div>
     <div>${x}</div>
   </div>`).join("");

 $("#legendaryRule").textContent=A.legendaryRule;

 $("#legendaryTargets").innerHTML=A.legendaryTargets.map(x=>{
   const save=(1-x.maxTechCost/x.totalCost)*100;
   return `<tr>
     <td><b>${x.level}</b></td>
     <td><strong>${x.legendaryChance.toLocaleString("pl-PL",{maximumFractionDigits:1})}%</strong></td>
     <td>${fmt(x.totalCost)}</td>
     <td class="tech-cost">${fmt(x.maxTechCost)}</td>
     <td class="saving">−${save.toLocaleString("pl-PL",{maximumFractionDigits:1})}%</td>
   </tr>`;
 }).join("");

 $("#ascSourceNotes").innerHTML=A.notes.map(n=>`<div class="source-note">${n}</div>`).join("");
 $("#ascAttribution").textContent=A.attribution;
}


function updateAscUI(section,level){
 $$(`[data-asc-switch="${section}"] .asc-btn`).forEach(b=>b.classList.toggle("active",Number(b.dataset.asc)===level));
 $$(`[data-asc-strip="${section}"] [data-asc-step]`).forEach(x=>x.classList.toggle("active",Number(x.dataset.ascStep)===level));
}

$$("[data-asc-switch]").forEach(sw=>{
 sw.addEventListener("click",e=>{
   const btn=e.target.closest(".asc-btn");
   if(!btn)return;
   const section=sw.dataset.ascSwitch;
   ascState[section]=Number(btn.dataset.asc);
   if(section==="pets")renderPets();
   if(section==="mounts")renderMounts();
   if(section==="items")renderItems();
 });
});

$$(".tab").forEach(b=>b.onclick=()=>{
 $$(".tab").forEach(x=>x.classList.toggle("active",x===b));
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===b.dataset.tab));
});

renderPets();renderMounts();renderItems();renderAllAscensionPaths();renderAscension();
})();