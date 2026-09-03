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
 const rows = section==="items" ? D.itemTiers : section==="pets" ? D.pets : D.mounts;
 const common=rows[0];
 const endRow=getRarityRow(section,cfg.endRarity);
 const recoveryRow=getRarityRow(section,cfg.recoveryRarity);
 const host=$(hostId); if(!host)return;
 host.innerHTML="";

 // Build the real sequence from actual config values.
 // For every Ascension cycle we show:
 // peak -> next Common -> guide recovery rarity -> next peak.
 const nodes=[{
   kind:"start", asc:0, rarity:common.rarity,
   value:common.damage*ascMultiplier(0),
   label:`A0 ${common.rarity}`
 }];
 for(let a=0;a<=2;a++){
   const peak=endRow.damage*ascMultiplier(a);
   nodes.push({kind:"peak",asc:a,rarity:cfg.endRarity,value:peak,label:`A${a} ${cfg.endRarity}`});

   const next=a+1;
   const reset=common.damage*ascMultiplier(next);
   nodes.push({
     kind:"reset",asc:next,rarity:common.rarity,value:reset,
     oldPeak:peak,label:`A${next} ${common.rarity}`
   });

   const recovery=recoveryRow.damage*ascMultiplier(next);
   nodes.push({
     kind:"recover",asc:next,rarity:cfg.recoveryRarity,value:recovery,
     oldPeak:peak,label:`A${next} ${cfg.recoveryRarity}`
   });
 }
 nodes.push({
   kind:"peak",asc:3,rarity:cfg.endRarity,
   value:endRow.damage*ascMultiplier(3),
   label:`A3 ${cfg.endRarity}`
 });

 /*
   A single absolute A0→A3 y-axis makes early cycles look flat because A3 is 125,000× A0.
   To show the real rises/drops without lying about them, each Ascension cycle gets its own
   vertical "power lane", normalized to that cycle's previous peak = 100%.
   Labels still display the true raw stat values and true ratios.
   This makes a 99.9% Ascension drop visually a 99.9% drop instead of a compressed wiggle.
 */
 const W=1460,H=620,left=72,right=38,top=78,bottom=520;
 const innerW=W-left-right;
 const x=i=>left+(i/(nodes.length-1))*innerW;

 const cyclePeak=a=>endRow.damage*ascMultiplier(a);
 const relativePower=n=>{
   if(n.kind==="start") return n.value/cyclePeak(0);
   if(n.kind==="peak") return 1;
   if(n.kind==="reset" || n.kind==="recover") return n.value/n.oldPeak;
   return 1;
 };
 // Allow values above old power (recovery rarity can overshoot) while preserving strong drops.
 const relVals=nodes.map(relativePower);
 const relMax=Math.max(1.35,...relVals);
 const chartTop=top+32;
 const chartBottom=bottom;
 const chartH=chartBottom-chartTop;
 const yRel=r=>{
   const clipped=Math.max(0,Math.min(relMax,r));
   return chartBottom-(clipped/relMax)*chartH;
 };

 const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,class:"asc-path-svg power-drop-svg",role:"img",
   "aria-label":`${cfg.system}: realne spadki i odbudowa mocy po Ascension`});

 // horizontal reference levels
 [0,.25,.5,.75,1,1.25].filter(v=>v<=relMax+.01).forEach(v=>{
   const yy=yRel(v);
   svg.append(svgEl("line",{x1:left,y1:yy,x2:W-right,y2:yy,class:v===1?"power-ref old":"power-ref"}));
   svg.append(svgEl("text",{x:left-12,y:yy+4,"text-anchor":"end",class:v===1?"power-axis old":"power-axis"},
     v===1?"100% starej mocy":`${Math.round(v*100)}%`));
 });

 // Ascension cycle background bands.
 for(let a=0;a<4;a++){
   const first = a===0 ? 0 : (a*3-1);
   const last = Math.min(nodes.length-1, a===3 ? nodes.length-1 : (a*3+1));
   const sx=x(first), ex=x(last);
   svg.append(svgEl("rect",{x:sx-14,y:top-24,width:Math.max(30,ex-sx+28),height:chartBottom-top+40,rx:12,class:"cycle-band"}));
   svg.append(svgEl("text",{x:(sx+ex)/2,y:top-5,"text-anchor":"middle",class:"cycle-label"},`ASCENSION A${a}`));
 }

 const pts=nodes.map((n,i)=>[x(i),yRel(relativePower(n))]);
 const path=pts.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" ");
 svg.append(svgEl("path",{d:path,class:"power-zigzag"}));

 nodes.forEach((n,i)=>{
   const px=x(i), py=yRel(relativePower(n));
   const rel=relativePower(n);

   let cls="power-point";
   if(n.kind==="peak")cls+=" peak";
   if(n.kind==="reset")cls+=" reset";
   if(n.kind==="recover")cls+=" recover";
   svg.append(svgEl("circle",{cx:px,cy:py,r:n.kind==="peak"?8:7,class:cls}));

   // label + true raw stat
   let anchorY = n.kind==="reset" ? py+28 : py-17;
   svg.append(svgEl("text",{x:px,y:anchorY,"text-anchor":"middle",class:`power-node-label ${n.kind}`},n.label));
   const rawY = n.kind==="reset" ? py+42 : py-4;
   svg.append(svgEl("text",{x:px,y:rawY,"text-anchor":"middle",class:"power-raw-label"},`⚔ ${fmt(n.value)}`));

   if(n.kind==="peak" && n.asc<3){
     const resetNode=nodes[i+1];
     const dropFactor=n.value/resetNode.value;
     const dropPct=(1-resetNode.value/n.value)*100;
     const bx=(px+x(i+1))/2;
     const by=(py+yRel(relativePower(resetNode)))/2;

     const g=svgEl("g",{class:"drop-badge"});
     g.append(svgEl("rect",{x:bx-70,y:by-29,width:140,height:58,rx:10}));
     g.append(svgEl("text",{x:bx,y:by-9,"text-anchor":"middle",class:"drop-title"},"ASCEND"));
     g.append(svgEl("text",{x:bx,y:by+9,"text-anchor":"middle",class:"drop-factor"},`↓ ×${dropFactor.toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
     g.append(svgEl("text",{x:bx,y:by+22,"text-anchor":"middle",class:"drop-pct"},`−${dropPct.toLocaleString("pl-PL",{maximumFractionDigits:1})}% mocy`));
     svg.append(g);
   }

   if(n.kind==="recover"){
     const pct=n.value/n.oldPeak*100;
     const g=svgEl("g",{class:"recover-power-badge"});
     const bx=px, by=Math.min(chartBottom-40,py+54);
     g.append(svgEl("rect",{x:bx-74,y:by-20,width:148,height:42,rx:9}));
     g.append(svgEl("text",{x:bx,y:by-4,"text-anchor":"middle",class:"recover-power-title"},`${cfg.recoveryRarity}`));
     g.append(svgEl("text",{x:bx,y:by+12,"text-anchor":"middle",class:"recover-power-pct"},`${pct.toLocaleString("pl-PL",{maximumFractionDigits:0})}% starej mocy`));
     svg.append(g);
   }
 });

 svg.append(svgEl("text",{x:left,y:H-30,class:"power-path-foot"},
   `Wysokość = moc względem szczytu przed danym Ascension. 100% = poprzednia moc. Surowe ⚔ DMG pod każdym punktem.`));

 host.append(svg);

 const copy=document.querySelector(`[data-path-copy="${section}"]`);
 if(copy){
   const firstPeak=endRow.damage;
   const firstReset=common.damage*ascMultiplier(1);
   const firstRecovery=recoveryRow.damage*ascMultiplier(1);
   const drop=(1-firstReset/firstPeak)*100;
   const recoveryPct=firstRecovery/firstPeak*100;
   copy.innerHTML=`Ascend na <b>${cfg.endRarity}</b> → po resecie spadasz w tym modelu do około <b>${(100-drop).toLocaleString("pl-PL",{maximumFractionDigits:2})}%</b> poprzedniej mocy. Poradnik wskazuje <b>${cfg.recoveryRarity}</b> jako próg odbudowy; z bazowych statów daje tu około <b>${recoveryPct.toLocaleString("pl-PL",{maximumFractionDigits:0})}%</b> starego szczytu.`;
 }
}

function renderAllAscensionPaths(){
 renderAscensionPath("pets","#petsAscPath");
 renderAscensionPath("mounts","#mountsAscPath");
 renderAscensionPath("items","#itemsAscPath");
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

renderPets();renderMounts();renderItems();renderAscension();renderAllAscensionPaths();
})();