(()=>{
const D=window.FORGE_KNOWLEDGE;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const NS="http://www.w3.org/2000/svg";

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

function renderViz(containerId, rows, metric){
 const host=$(containerId); host.innerHTML="";
 const W=1400,H=620, ladderX=40, ladderW=300, chartX=510, chartW=810, top=68, bottom=555;
 const plotH=bottom-top;
 const vals=rows.map(r=>r[metric]);
 const positive=vals.filter(v=>v>0);
 const min=Math.min(...positive), max=Math.max(...positive);
 const logMin=Math.log10(min), logMax=Math.log10(max);
 const y=v=> bottom - ((Math.log10(v)-logMin)/(logMax-logMin||1))*plotH;
 const x=i=>chartX + (i/(rows.length-1))*chartW;
 const nodeY=i=>top + (rows.length-1-i)*((bottom-top)/(rows.length-1));

 const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,class:"viz-svg",role:"img","aria-label":"Drabinka progresji połączona z wykresem"});
 const defs=svgEl("defs");
 const grad=svgEl("linearGradient",{id:"areaGrad",x1:"0",y1:"0",x2:"0",y2:"1"});
 grad.append(svgEl("stop",{offset:"0%","stop-color":"#6aaef6","stop-opacity":".55"}),svgEl("stop",{offset:"100%","stop-color":"#6aaef6","stop-opacity":"0"}));
 const marker=svgEl("marker",{id:"arrow",markerWidth:"8",markerHeight:"8",refX:"7",refY:"3",orient:"auto",markerUnits:"strokeWidth"});
 marker.append(svgEl("path",{d:"M0,0 L0,6 L8,3 z",class:"arrow-head"}));
 defs.append(grad,marker); svg.append(defs);

 // chart grid: logarithmic decades
 const decades=[];
 for(let p=Math.floor(logMin);p<=Math.ceil(logMax);p++)decades.push(10**p);
 decades.filter(v=>v>=min*.8&&v<=max*1.2).forEach(v=>{
   const yy=y(Math.max(min,Math.min(max,v)));
   svg.append(svgEl("line",{x1:chartX,y1:yy,x2:chartX+chartW,y2:yy,class:"grid-line"}));
   svg.append(svgEl("text",{x:chartX-16,y:yy+4,"text-anchor":"end",class:"axis-text"},valueFormat(metric,v)));
 });
 svg.append(svgEl("text",{x:chartX,y:30,class:"chart-title"},`${labelMetric(metric).toUpperCase()} • SKALA LOGARYTMICZNA`));
 svg.append(svgEl("text",{x:chartX,y:48,class:"chart-note"},"Punkty są liczone z dokładnych wartości dla każdego rarity"));

 // ladder spine
 svg.append(svgEl("line",{x1:ladderX+22,y1:top,x2:ladderX+22,y2:bottom,class:"ladder-spine"}));

 // chart area/line
 const points=rows.map((r,i)=>[x(i),y(r[metric])]);
 const path=points.map((p,i)=>(i?"L":"M")+p[0]+","+p[1]).join(" ");
 const area=path+` L${points.at(-1)[0]},${bottom} L${points[0][0]},${bottom} Z`;
 svg.append(svgEl("path",{d:area,class:"plot-area"}));
 svg.append(svgEl("path",{d:path,class:"plot-line"}));

 rows.forEach((r,i)=>{
   const ny=nodeY(i), px=x(i), py=y(r[metric]), c=D.colors[r.rarity];
   // connector: visually proves arrow lands on exact plotted point
   const sx=ladderX+ladderW, sy=ny;
   const mx=chartX-52;
   const connector=svgEl("path",{d:`M${sx},${sy} C${mx-40},${sy} ${mx-5},${py} ${px-10},${py}`,class:"connector","marker-end":"url(#arrow)"});
   svg.append(connector);

   // node card
   const g=svgEl("g",{class:"ladder-node",tabindex:"0","data-i":i});
   g.append(svgEl("rect",{x:ladderX+42,y:ny-28,width:ladderW-42,height:56,rx:8,class:"node-bg"}));
   g.append(svgEl("circle",{cx:ladderX+22,cy:ny,r:8,fill:c,stroke:"#0a1017","stroke-width":"4"}));
   g.append(svgEl("text",{x:ladderX+58,y:ny-7,fill:c,class:"node-rarity"},r.rarity.toUpperCase()));
   g.append(svgEl("text",{x:ladderX+58,y:ny+14,class:"node-value"},valueFormat(metric,r[metric])));
   g.append(svgEl("text",{x:ladderX+210,y:ny+13,class:"node-sub"},i===0?"BAZA":`×${ratio(rows[i-1][metric],r[metric]).toLocaleString("pl-PL",{maximumFractionDigits:1})} od poprzedniego`));
   svg.append(g);

   // point on graph
   const p=svgEl("circle",{cx:px,cy:py,r:7,fill:c,class:"point","data-i":i});
   svg.append(p);
   svg.append(svgEl("text",{x:px,y:bottom+28,"text-anchor":"middle",fill:c,class:"axis-text"},r.rarity.slice(0,4)));

   const activate=()=>{
     svg.querySelectorAll(".ladder-node").forEach(x=>x.classList.remove("active"));
     svg.querySelectorAll(".connector").forEach(x=>x.classList.remove("active"));
     g.classList.add("active"); connector.classList.add("active");
   };
   g.addEventListener("mouseenter",activate); p.addEventListener("mouseenter",activate);
 });

 host.append(svg);
 const tip=document.createElement("div");tip.className="tooltip";host.append(tip);
 svg.querySelectorAll(".point").forEach(p=>{
   p.addEventListener("mousemove",ev=>{
     const r=rows[Number(p.dataset.i)];
     tip.innerHTML=`<b style="color:${D.colors[r.rarity]}">${r.rarity}</b><span>${labelMetric(metric)}: <strong>${valueFormat(metric,r[metric])}</strong></span>${metric!=="hatchSeconds"?`<span>HP: ${fmt(r.health)} • DMG: ${fmt(r.damage)}</span>`:""}`;
     tip.style.display="block";
     const rect=host.getBoundingClientRect();
     tip.style.left=Math.min(ev.clientX-rect.left+14,rect.width-215)+"px";
     tip.style.top=Math.max(10,ev.clientY-rect.top-18)+"px";
   });
   p.addEventListener("mouseleave",()=>tip.style.display="none");
 });

 return {min,max};
}

function renderInsights(target,rows,metric){
 const first=rows[0][metric],last=rows.at(-1)[metric];
 const jumps=rows.slice(1).map((r,i)=>({from:rows[i],to:r,ratio:r[metric]/rows[i][metric]})).sort((a,b)=>b.ratio-a.ratio);
 const biggest=jumps[0];
 const mid=rows.find(x=>x.rarity==="Legendary");
 $(target).innerHTML=`
   <article class="insight"><span>Common → Mythic</span><b>×${(last/first).toLocaleString("pl-PL",{maximumFractionDigits:1})}</b><small>${labelMetric(metric)} między skrajnymi rarity.</small></article>
   <article class="insight"><span>Największy pojedynczy skok</span><b>${biggest.from.rarity} → ${biggest.to.rarity}</b><small>×${biggest.ratio.toLocaleString("pl-PL",{maximumFractionDigits:1})} dla ${labelMetric(metric)}.</small></article>
   <article class="insight"><span>Próg Legendary</span><b>${valueFormat(metric,mid[metric])}</b><small>Wartość dokładnie z punktu oznaczonego Legendary na wykresie.</small></article>`;
}

function renderPets(){
 const m=$("#petMetric").value;
 renderViz("#petViz",D.pets,m);renderInsights("#petInsights",D.pets,m);
}
function renderMounts(){
 const m=$("#mountMetric").value;
 renderViz("#mountViz",D.mounts,m);renderInsights("#mountInsights",D.mounts,m);
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

$$(".tab").forEach(b=>b.onclick=()=>{
 $$(".tab").forEach(x=>x.classList.toggle("active",x===b));
 $$(".view").forEach(v=>v.classList.toggle("active",v.id===b.dataset.tab));
});
$("#petMetric").addEventListener("change",renderPets);
$("#mountMetric").addEventListener("change",renderMounts);

renderPets();renderMounts();renderAscension();
})();