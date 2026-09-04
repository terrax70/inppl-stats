(()=>{
const D=window.FORGE_KNOWLEDGE;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const NS="http://www.w3.org/2000/svg";
const ascState={pets:0,mounts:0,items:0};
const ascMultiplier=level=>D.ascensionMultipliers.find(x=>x.level===Number(level))?.multiplier||1;

const FM_HELPER_CSS="https://cdn.jsdelivr.net/gh/1vcian/ForgeMasterCalculator@main/styles.css";
const FM_ASSET_ROOT="https://cdn.jsdelivr.net/gh/1vcian/ForgeMasterCalculator@main/Texture2D/";

const visualAssets={
 pets:[
   {rarity:"Common",name:"Snail",kind:"pet",cls:"snail"},
   {rarity:"Rare",name:"Hedgehog",kind:"pet",cls:"hedgehog"},
   {rarity:"Epic",name:"Panda",kind:"pet",cls:"panda"},
   {rarity:"Legendary",name:"Cerberus",kind:"pet",cls:"cerberus"},
   {rarity:"Ultimate",name:"Treant",kind:"pet",cls:"treant"},
   {rarity:"Mythic",name:"Genie",kind:"pet",cls:"genie"}
 ],
 mounts:[
   {rarity:"Common",name:"Lily Pad",kind:"mount",cls:"lily-pad"},
   {rarity:"Rare",name:"Brown Horse",kind:"mount",cls:"horse"},
   {rarity:"Epic",name:"Pig",kind:"mount",cls:"pig"},
   {rarity:"Legendary",name:"Giant Bee",kind:"mount",cls:"bee"},
   {rarity:"Ultimate",name:"Mini Dragon",kind:"mount",cls:"mini-dragon"},
   {rarity:"Mythic",name:"Hover Board",kind:"mount",cls:"hover-board"}
 ],
 items:[
   ["Primitive","PrimitiveAgeItems.png"],
   ["Medieval","MedievalAgeItems.png"],
   ["Early-Modern","EarlyModernAgeItems.png"],
   ["Modern","ModernAgeItems.png"],
   ["Space","SpaceAgeItems.png"],
   ["Interstellar","InterstellarAgeItems.png"],
   ["Multiverse","MultiverseAgeItems.png"],
   ["Quantum","QuantumAgeItems.png"],
   ["Underworld","UnderworldAgeItems.png"],
   ["Divine","DivineAgeItems.png"]
 ].map(([rarity,file])=>({rarity,name:rarity,kind:"item",file}))
};

class FmSprite extends HTMLElement{
 connectedCallback(){
   if(this.shadowRoot)return;
   const shadow=this.attachShadow({mode:"open"});
   const kind=this.dataset.kind;
   const cls=this.dataset.cls;
   const style=document.createElement("style");
   style.textContent=`
    @import url("${FM_HELPER_CSS}");
    :host{display:grid;place-items:center;width:76px;height:76px;overflow:visible}
    .sprite-scale{width:30px;height:30px;display:grid;place-items:center;transform:scale(2.15);transform-origin:center}
    .pet-icon,.mount-icon{margin:0!important;vertical-align:middle!important}
   `;
   const box=document.createElement("span");
   box.className="sprite-scale";
   const sprite=document.createElement("span");
   sprite.className=`${kind}-icon small ${cls}`;
   box.append(sprite);
   shadow.append(style,box);
 }
}
if(!customElements.get("fm-sprite"))customElements.define("fm-sprite",FmSprite);

function renderAssetStrip(section){
 const map={pets:"#petViz",mounts:"#mountViz",items:"#itemViz"};
 const viz=$(map[section]); if(!viz)return;
 let strip=document.querySelector(`.asset-strip[data-section="${section}"]`);
 if(!strip){
   strip=document.createElement("div");
   strip.className="asset-strip";
   strip.dataset.section=section;
   viz.parentElement.insertBefore(strip,viz);
 }
 const assets=visualAssets[section];
 strip.innerHTML=`<div class="asset-strip-head"><span>WYGLĄD W GRZE</span><small>autentyczne assety ForgeMaster Helper</small></div><div class="asset-strip-row"></div>`;
 const row=strip.querySelector(".asset-strip-row");

 assets.forEach(a=>{
   const c=document.createElement("article");
   c.className="asset-card";
   c.style.setProperty("--rarity-color",(D.colors?.[a.rarity]||D.itemTierColors?.[a.rarity]||"#8abcf5"));
   let visual="";
   if(a.kind==="item"){
     visual=`<div class="asset-picture item-picture"><img src="${FM_ASSET_ROOT}${a.file}" alt="${a.rarity} items" loading="lazy" onerror="this.closest('.asset-picture').classList.add('asset-error')"></div>`;
   }else{
     visual=`<div class="asset-picture sprite-picture"><fm-sprite data-kind="${a.kind}" data-cls="${a.cls}"></fm-sprite></div>`;
   }
   c.innerHTML=`${visual}<div class="asset-copy"><b>${a.rarity}</b><span>${a.name}</span></div>`;
   row.append(c);
 });
}
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
 renderAssetStrip("pets");
 const level=ascState.pets;
 const rows=scaledRows(D.pets,level);
 renderProgressViz("#petViz",rows,"Pety",level);
 renderProgressInsights("#petInsights",rows);
 updateAscUI("pets",level);
}
function renderMounts(){
 renderAssetStrip("mounts");
 const level=ascState.mounts;
 const rows=scaledRows(D.mounts,level);
 renderProgressViz("#mountViz",rows,"Mounty",level);
 renderProgressInsights("#mountInsights",rows);
 updateAscUI("mounts",level);
}

function renderItems(){
 renderAssetStrip("items");
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
 const rows=section==="items" ? D.itemTiers : section==="pets" ? D.pets : D.mounts;
 const host=$(hostId); if(!host)return;
 host.innerHTML="";

 const endRow=rows.at(-1);
 const recoveryRow=rows.find(r=>r.rarity===cfg.recoveryRarity);
 if(!recoveryRow)return;

 /*
   GUIDE-CALIBRATED PATH
   The Discord guide explicitly says the old power is recovered at:
   - Pets: Legendary
   - Mounts: Epic
   - Gear: Multiverse

   Therefore the path scale is derived from that statement:
   nextAscensionScale = previousEnd / nextRecoveryBase

   This guarantees mathematically:
   recovery A1 == end A0
   recovery A2 == end A1
   recovery A3 == end A2

   It also guarantees Common A1 > Common A0 and end A1 > end A0.
 */
 const guideStep=endRow.damage/recoveryRow.damage;
 const guideAscMultiplier=a=>guideStep**a;

 const series=[];
 for(let a=0;a<=3;a++){
   const mult=guideAscMultiplier(a);
   rows.forEach((r,i)=>{
     series.push({
       asc:a,
       rarity:r.rarity,
       rawDamage:r.damage*mult,
       rawHealth:r.health*mult,
       isStart:i===0,
       isEnd:i===rows.length-1,
       isRecovery:a>0 && r.rarity===cfg.recoveryRarity
     });
   });
 }

 const W=1760,H=735,left=96,right=36,top=70,bottom=420;
 const innerW=W-left-right;
 const values=series.map(p=>p.rawDamage);
 const min=Math.min(...values),max=Math.max(...values);
 const logMin=Math.log10(min),logMax=Math.log10(max);
 const x=i=>left+(i/(series.length-1))*innerW;
 const y=v=>bottom-((Math.log10(v)-logMin)/(logMax-logMin||1))*(bottom-top);

 const svg=svgEl("svg",{
   viewBox:`0 0 ${W} ${H}`,
   class:"asc-path-svg guide-asc-svg",
   role:"img",
   "aria-label":`${cfg.system}: ścieżka Ascension skalowana według progów odzyskania mocy z poradnika`
 });

 const defs=svgEl("defs");
 const markerId=`guideResetArrow-${section}`;
 const marker=svgEl("marker",{id:markerId,markerWidth:"8",markerHeight:"8",refX:"7",refY:"3",orient:"auto"});
 marker.append(svgEl("path",{d:"M0,0 L0,6 L8,3 z",class:"abs-reset-head"}));
 defs.append(marker);
 svg.append(defs);

 // Common A0 = ×1 reference axis.
 const base=rows[0].damage;
 const totalRatio=max/base;
 for(let p=0;p<=Math.ceil(Math.log10(totalRatio));p++){
   const m=10**p;
   if(base*m>max*1.001)continue;
   const yy=y(base*m);
   svg.append(svgEl("line",{x1:left,y1:yy,x2:W-right,y2:yy,class:"abs-grid"}));
   svg.append(svgEl("text",{x:left-14,y:yy+4,"text-anchor":"end",class:"abs-axis"},`×${fmt(m)}`));
 }

 svg.append(svgEl("text",{x:left,y:28,class:"abs-title"},"ŚCIEŻKA MOCY WG PORADNIKA • A0 → A3"));
 svg.append(svgEl("text",{x:left,y:47,class:"abs-subtitle"},
   `Skala wspólna i logarytmiczna. ${cfg.recoveryRarity} następnej Ascension jest ustawione dokładnie na mocy końca poprzedniego cyklu.`));

 const n=rows.length;

 // cycle backgrounds
 for(let a=0;a<=3;a++){
   const first=a*n,last=first+n-1;
   const sx=x(first),ex=x(last);
   svg.append(svgEl("rect",{x:sx-15,y:top-12,width:(ex-sx)+30,height:bottom-top+28,rx:12,class:"abs-cycle-band"}));
   svg.append(svgEl("text",{x:(sx+ex)/2,y:top+13,"text-anchor":"middle",class:"abs-cycle-label"},
     `A${a} • ${cfg.eligibilityLabel}`));
 }

 // lines + resets
 for(let a=0;a<=3;a++){
   const first=a*n,last=first+n-1;
   const pts=series.slice(first,last+1).map((p,j)=>[x(first+j),y(p.rawDamage)]);
   svg.append(svgEl("path",{d:pts.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" "),class:"abs-cycle-line"}));

   if(a<3){
     const peak=series[last], next=series[last+1];
     const x1=x(last),y1=y(peak.rawDamage),x2=x(last+1),y2=y(next.rawDamage);

     svg.append(svgEl("path",{
       d:`M${x1},${y1} C${x1+18},${y1+22} ${x2-18},${y2-22} ${x2},${y2}`,
       class:"abs-reset-line",
       "marker-end":`url(#${markerId})`
     }));

     const factor=peak.rawDamage/next.rawDamage;
     const loss=(1-next.rawDamage/peak.rawDamage)*100;
     const bx=(x1+x2)/2,by=(y1+y2)/2;

     const badge=svgEl("g",{class:"abs-reset-badge"});
     badge.append(svgEl("rect",{x:bx-65,y:by-23,width:130,height:46,rx:8}));
     badge.append(svgEl("text",{x:bx,y:by-7,"text-anchor":"middle",class:"abs-reset-title"},"ASCEND / RESET"));
     badge.append(svgEl("text",{x:bx,y:by+10,"text-anchor":"middle",class:"abs-reset-value"},
       `↓ ×${factor.toLocaleString("pl-PL",{maximumFractionDigits:1})}`));
     badge.append(svgEl("text",{x:bx,y:by+21,"text-anchor":"middle",class:"abs-reset-loss"},
       `−${loss.toLocaleString("pl-PL",{maximumFractionDigits:1})}%`));
     svg.append(badge);
   }
 }

 // points + recovery
 series.forEach((p,i)=>{
   const px=x(i),py=y(p.rawDamage);
   const rowIndex=i%n;
   let cls="abs-point";
   if(p.isStart)cls+=" start";
   if(p.isEnd)cls+=" end";
   if(p.isRecovery)cls+=" recovery";

   const point=svgEl("circle",{cx:px,cy:py,r:p.isEnd?6.5:4.3,class:cls});
   point.append(svgEl("title",{},`${p.rarity} • A${p.asc}\n❤️ HP ${fmt(p.rawHealth)}\n⚔ DMG ${fmt(p.rawDamage)}`));
   svg.append(point);

   const showLabel=rows.length<=6 || p.isStart || p.isEnd || p.isRecovery || rowIndex%2===0;
   if(showLabel){
     const short=p.rarity
       .replace("Early-Modern","E-Mod")
       .replace("Interstellar","Inter")
       .replace("Multiverse","Multi")
       .replace("Underworld","Under");
     svg.append(svgEl("text",{x:px,y:bottom+20,"text-anchor":"middle",class:p.isRecovery?"abs-rarity recovery":"abs-rarity"},short));
   }

   if(p.isEnd){
     const gate=svgEl("g",{class:"abs-end-badge"});
     const gy=py-31;
     gate.append(svgEl("rect",{x:px-55,y:gy-16,width:110,height:32,rx:7}));
     gate.append(svgEl("text",{x:px,y:gy-2,"text-anchor":"middle",class:"abs-end-title"},
       p.asc<3?"ASCENSION GOTOWA":"KONIEC A3"));
     gate.append(svgEl("text",{x:px,y:gy+10,"text-anchor":"middle",class:"abs-end-sub"},cfg.eligibilityLabel));
     svg.append(gate);
   }

   if(p.isRecovery){
     const prevPeakIndex=(p.asc-1)*n+(n-1);
     const prevPeak=series[prevPeakIndex];
     const prevY=y(prevPeak.rawDamage);

     // Mathematical invariant of this guide-calibrated scale.
     const ratio=p.rawDamage/prevPeak.rawDamage;
     const delta=Math.abs(ratio-1);

     // Exact horizontal line between equal-power points.
     svg.append(svgEl("line",{
       x1:x(prevPeakIndex),y1:prevY,
       x2:px,y2:py,
       class:"guide-equal-line"
     }));

     const rb=svgEl("g",{class:"abs-recovery-badge"});
     const ry=py-32;
     rb.append(svgEl("rect",{x:px-64,y:ry-16,width:128,height:32,rx:7}));
     rb.append(svgEl("text",{x:px,y:ry-2,"text-anchor":"middle",class:"abs-recovery-title"},"ODZYSK STAREJ MOCY"));
     rb.append(svgEl("text",{x:px,y:ry+10,"text-anchor":"middle",class:"abs-recovery-sub"},
       `${cfg.recoveryRarity} • 100%`));
     svg.append(rb);
   }
 });


 // Dedicated resource lane: cards are never placed over the plotted data.
 const rr=D.recoveryResources?.[section];
 if(rr){
   const laneTop=468;
   svg.append(svgEl("line",{x1:left,y1:laneTop-18,x2:W-right,y2:laneTop-18,class:"resource-lane-line"}));
   svg.append(svgEl("text",{x:left,y:laneTop-26,class:"resource-lane-title"},"ZAPAS PRZED ASCENSION"));

   for(let a=0;a<3;a++){
     const peakIndex=a*n+(n-1);
     const nextCommonIndex=(a+1)*n;
     const centerX=(x(peakIndex)+x(nextCommonIndex))/2;
     const cardW=292, cardH=126;
     const cardY=laneTop+10;

     const card=svgEl("g",{class:a===0?"resource-lane-card primary":"resource-lane-card baseline"});
     card.append(svgEl("rect",{x:centerX-cardW/2,y:cardY,width:cardW,height:cardH,rx:12}));

     card.append(svgEl("text",{x:centerX,y:cardY+19,"text-anchor":"middle",class:"resource-lane-kicker"},
       a===0?`${rr.icon} ZAPAS PRZED ASCENSION`:`${rr.icon} BASELINE A0→A1`));

     card.append(svgEl("text",{x:centerX,y:cardY+44,"text-anchor":"middle",class:"resource-lane-value"},
       `${rr.baseLabel} ${rr.resource}`));

     card.append(svgEl("text",{x:centerX,y:cardY+62,"text-anchor":"middle",class:"resource-lane-tech"},
       `Po bonusach: ${rr.discountLabel}`));

     card.append(svgEl("text",{x:centerX,y:cardY+81,"text-anchor":"middle",class:"resource-lane-target"},
       `${rr.targetLevel} • cel: ${rr.target}`));

     if(rr.chance){
       card.append(svgEl("text",{x:centerX,y:cardY+97,"text-anchor":"middle",class:"resource-lane-extra"},
         `${rr.chance}`));
     }

     if(rr.cumulativeSummons){
       card.append(svgEl("text",{x:centerX,y:cardY+113,"text-anchor":"middle",class:"resource-lane-extra strong"},
         `${rr.cumulativeSummons.toLocaleString("pl-PL")} cumulative summons`));
     }else if(rr.ascensionCost){
       card.append(svgEl("text",{x:centerX,y:cardY+113,"text-anchor":"middle",class:"resource-lane-extra strong"},
         `+ ${rr.ascensionCostLabel} Gold • Ascension`));
     }

     svg.append(card);

     // A subtle connector from the reset midpoint down to its resource card.
     const px1=x(peakIndex), py1=y(series[peakIndex].rawDamage);
     const px2=x(nextCommonIndex), py2=y(series[nextCommonIndex].rawDamage);
     const resetMidX=(px1+px2)/2;
     const resetMidY=(py1+py2)/2;
     svg.append(svgEl("line",{
       x1:resetMidX,y1:resetMidY+28,x2:centerX,y2:cardY-8,class:"resource-lane-connector"
     }));
   }
 }

 svg.append(svgEl("text",{x:left,y:H-14,class:"abs-foot"},
   `Kalibracja poradnika: ${cfg.recoveryRarity} A1 = ${cfg.endRarity} A0 • każdy kolejny cykl zachowuje tę samą relację. Krok Ascension tej ścieżki: ×${guideStep.toLocaleString("pl-PL",{maximumFractionDigits:2})}.`));

 host.append(svg);

 const copy=document.querySelector(`[data-path-copy="${section}"]`);
 if(copy){
   const rr=D.recoveryResources?.[section];
   copy.innerHTML=`Wizualizacja jest skalowana <b>dokładnie według poradnika</b>: <b>${cfg.recoveryRarity} A1 = ${cfg.endRarity} A0</b>, ${cfg.recoveryRarity} A2 = ${cfg.endRarity} A1 itd. Ascension jest dostępna przy <b>${cfg.eligibilityLabel}</b>. ${rr?`Oficjalny poradnik podaje dla Base→A1 <b>${rr.baseLabel} ${rr.resource}</b> albo <b>${rr.discountLabel}</b> (${rr.discountText}), aby dojść do <b>${rr.targetLevel}</b> / ${rr.target}.${rr.ascensionCost?` Samo Ascension kosztuje dodatkowo <b>${rr.ascensionCostLabel} Gold</b>.`:""}`:""}`;
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




function officialPriorityClass(p){return (p||"").toLowerCase().replace(/\s+/g,"-");}
function renderOfficialAscensionGuide(pillar="Forge"){
 const G=D.officialAscensionGuide;
 const stats=$("#officialBaseStats"),rules=$("#officialGlobalRules"),host=$("#officialPillarDetail");
 if(stats)stats.innerHTML=`<div class="official-section-title">BAZOWE STATY PRZED ASCENSION</div>`+G.baseStats.map(([n,v])=>`<article><span>${n}</span><b>${v}</b></article>`).join("");
 if(rules)rules.innerHTML=`<div class="official-section-title">PRZED PIERWSZYM ASCENSION</div>`+G.global.map((x,i)=>`<div class="official-rule"><b>${i+1}</b><span>${x}</span></div>`).join("");
 if(!host)return;
 const key=pillar==="Forge"?"items":pillar.toLowerCase();
 const P=G.pillars[pillar],R=D.recoveryResources[key]; if(!P||!R)return;
 const alt=R.alternative?`
   <div class="official-alt-card">
    <div class="official-alt-kicker">ALTERNATYWNY CEL</div>
    <h4>${R.alternative.target} • ${R.alternative.targetLevel}</h4>
    <div class="official-cost-grid">
      <div><span>Base</span><b>${R.alternative.baseLabel} ${R.resource}</b></div>
      <div><span>${R.discountText}</span><b>${R.alternative.discountLabel} ${R.resource}</b></div>
    </div>
    <p>${R.alternative.chance||""}${R.alternative.unlock?` • ${R.alternative.unlock}`:""}</p>
    ${R.alternative.note?`<small>${R.alternative.note}</small>`:""}
   </div>`:"";
 host.innerHTML=`
  <div class="official-detail-top">
    <div><div class="official-priority ${officialPriorityClass(P.priority)}">PRIORYTET • ${P.priority}</div><h4>${pillar==="Forge"?"🔨":pillar==="Skills"?"🌀":pillar==="Pets"?"🐾":"🐎"} ${pillar}</h4></div>
    <div class="official-recovery">${R.target}<span>${R.targetLevel}</span></div>
  </div>
  <div class="official-reset-grid">
    <article><span>RESET</span><p>${P.reset}</p></article>
    <article><span>ZOSTAJE</span><p>${P.keep}</p></article>
    <article><span>ODZYSKANIE MOCY</span><p>${P.recovery}</p></article>
  </div>
  <div class="official-main-cost">
    <div class="official-main-cost-head">
      <div><span>GŁÓWNY CEL PO A1</span><b>${R.target} • ${R.targetLevel}</b></div>
      <div><span>DROP</span><b>${R.chance||"—"}</b></div>
    </div>
    ${R.unlock?`<p>${R.unlock}</p>`:""}
    <div class="official-cost-grid">
      <div><span>Base</span><b>${R.baseLabel} ${R.resource}</b></div>
      <div><span>${R.discountText}</span><b>${R.discountLabel} ${R.resource}</b></div>
      ${R.ascensionCost?`<div class="asc-cost"><span>Samo Ascension</span><b>+ ${R.ascensionCostLabel} Gold</b></div>`:""}
    </div>
    ${R.note?`<small>${R.note}</small>`:""}
  </div>
  ${alt}
  <div class="official-advice"><b>CO ROBIĆ?</b><p>${P.advice}</p>${P.alternative?`<p>${P.alternative}</p>`:""}</div>`;
}
function bindOfficialAscensionGuide(){
 document.querySelectorAll(".official-pillar-tab").forEach(btn=>{
  btn.addEventListener("click",()=>{
   document.querySelectorAll(".official-pillar-tab").forEach(x=>x.classList.remove("active"));
   btn.classList.add("active");
   renderOfficialAscensionGuide(btn.dataset.officialPillar);
  });
 });
 renderOfficialAscensionGuide("Forge");
}
function techFmtTime(sec){
 if(sec<3600)return `${Math.round(sec/60)} min`;
 if(sec<86400)return `${(sec/3600).toLocaleString("pl-PL",{maximumFractionDigits:1})} h`;
 return `${(sec/86400).toLocaleString("pl-PL",{maximumFractionDigits:1})} d`;
}
function techPriorityMeta(p){
 const map={
   rush:{label:"RUSH • MAX",cls:"rush"},
   max:{label:"MAX WCZEŚNIE",cls:"rush"},
   high:{label:"WYSOKI",cls:"high"},
   medium:{label:"ŚREDNI",cls:"medium"},
   low:{label:"BACKFILL",cls:"backfill"},
   one:{label:"1 RANK",cls:"one"}
 };
 return map[p]||map.medium;
}
function tierNodeBase(tier,maxLevel=5){
 const U=D.techRoadmap.tierUpgrade[tier];
 const lv=Math.min(maxLevel,U.durations.length);
 return {
   sec:U.durations.slice(0,lv).reduce((a,b)=>a+b,0),
   cost:U.costs.slice(0,lv).reduce((a,b)=>a+b,0)
 };
}
function renderTierTimeStrip(){
 const host=$("#tierTimeStrip");if(!host)return;
 const speed=Number($("#roadmapResearchSpeed")?.value||0);
 const div=1+speed;
 host.innerHTML=Object.entries(D.techRoadmap.tierUpgrade).map(([k,t])=>{
   const full=t.durations.reduce((a,b)=>a+b,0);
   const first=t.durations[0];
   return `<article>
     <span>${t.name}</span>
     <b>${techFmtTime(full/div)}</b>
     <small>1 node 1→5 • pierwszy rank: ${techFmtTime(first/div)} • koszt 1→5: ${fmt(t.costs.reduce((a,b)=>a+b,0))}</small>
   </article>`;
 }).join("");
}
function renderTechRoadmap(treeKey="SkillsPetTech"){
 const cfg=D.techRoadmap.trees[treeKey];
 const host=$("#roadmapTiers"),sum=$("#roadmapSummary");
 if(!cfg||!host)return;
 const speed=Number($("#roadmapResearchSpeed")?.value||0);
 const div=1+speed;
 const maxDefault=5;

 // Base total to max the whole tree, source structure + MaxLevel.
 let totalSec=0,totalCost=0;
 for(let tier=0;tier<5;tier++){
   cfg.nodes.forEach(n=>{
     const max=n.type==="AutoForge"?1:maxDefault;
     const x=tierNodeBase(tier,max);
     totalSec+=x.sec/div; totalCost+=x.cost;
   });
 }

 // Rush-through time: 1 rank every node, but selected compounding nodes maxed.
 const rushTypes=treeKey==="SkillsPetTech"
   ? new Set(["TechResearchTimer","TechNodeUpgradeCost"])
   : treeKey==="Forge"
     ? new Set(["ForgeTimerSpeed","ForgeUpgradeCost"])
     : new Set(["MountSummonCost","ExtraMountChance"]);
 let rushSec=0,rushCost=0;
 for(let tier=0;tier<5;tier++){
   cfg.nodes.forEach(n=>{
     const max=n.type==="AutoForge"?1:(rushTypes.has(n.type)?5:1);
     const x=tierNodeBase(tier,max);
     rushSec+=x.sec/div; rushCost+=x.cost;
   });
 }

 if(sum){
   sum.innerHTML=`<div><span>${cfg.icon} DRZEWKO</span><b>${cfg.label}</b></div>
     <div><span>MAX CAŁEGO DRZEWA</span><b>${techFmtTime(totalSec)}</b><small>bez przerw • przy Research Speed ${Math.round(speed*100)}%</small></div>
     <div><span>MODEL RUSH</span><b>${techFmtTime(rushSec)}</b><small>max kluczowe node'y + 1 rank przez resztę</small></div>
     <div><span>TECH POTIONS • MAX</span><b>${fmt(totalCost)}</b><small>przed redukcją TechNodeUpgradeCost</small></div>
     <p>${cfg.recommendation}</p>`;
 }

 host.innerHTML=[0,1,2,3,4].map(tier=>{
   const U=D.techRoadmap.tierUpgrade[tier];
   const firstSec=U.durations[0]/div;
   const fullSec=U.durations.reduce((a,b)=>a+b,0)/div;
   const cards=cfg.nodes.map((n,i)=>{
     const pm=techPriorityMeta(n.priority);
     const max=n.type==="AutoForge"?1:5;
     const rank1=U.costs[0];
     const full=U.costs.slice(0,max).reduce((a,b)=>a+b,0);
     const nodeId=tier*cfg.nodes.length+i;
     return `<article class="roadmap-node ${pm.cls}">
       <div class="roadmap-node-top">
         <span class="node-order">#${nodeId}</span>
         <span class="node-priority">${pm.label}</span>
       </div>
       <h5>${n.type}</h5>
       <strong>${n.effect||""}</strong>
       <div class="node-cost-row"><span>Rank 1</span><b>${fmt(rank1)} 🧪</b><span>${techFmtTime(firstSec)}</span></div>
       <div class="node-cost-row muted"><span>Do max</span><b>${fmt(full)} 🧪</b><span>${techFmtTime(max===1?firstSec:fullSec)}</span></div>
       ${n.why?`<p>${n.why}</p>`:""}
     </article>`;
   }).join("");
   return `<section class="roadmap-tier">
      <div class="roadmap-tier-head">
        <div><span>${U.name}</span><b>${cfg.label}</b></div>
        <div><span>1 rank node'a</span><b>${techFmtTime(firstSec)}</b></div>
        <div><span>1→5 node'a</span><b>${techFmtTime(fullSec)}</b></div>
        <div><span>koszt 1→5</span><b>${fmt(U.costs.reduce((a,b)=>a+b,0))} 🧪</b></div>
      </div>
      <div class="roadmap-node-grid">${cards}</div>
    </section>`;
 }).join("");
 renderTierTimeStrip();
}
function bindTechRoadmap(){
 document.querySelectorAll(".roadmap-tab").forEach(btn=>{
   btn.addEventListener("click",()=>{
     document.querySelectorAll(".roadmap-tab").forEach(x=>x.classList.remove("active"));
     btn.classList.add("active");
     renderTechRoadmap(btn.dataset.roadmapTree);
   });
 });
 $("#roadmapResearchSpeed")?.addEventListener("change",()=>{
   const active=document.querySelector(".roadmap-tab.active")?.dataset.roadmapTree||"SkillsPetTech";
   renderTechRoadmap(active);
 });
 renderTechRoadmap("SkillsPetTech");
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

bindTechRoadmap();
bindOfficialAscensionGuide();
})();