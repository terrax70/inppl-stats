
(()=>{
"use strict";
const D=window.FM_SOURCE_DATA;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const ascState={pets:0,mounts:0,skills:0,items:0};
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
   <div class="rarity-assets">${rows.map(r=>`<article style="--c:${COLORS[r.name]||"#889"}">${isItems?itemImage(r.name):spriteHTML(id,r.name,asc)}<b>${r.name}</b><div><span>⚔️ ${fmt(r.damage)}</span><span>❤️ ${fmt(r.health)}</span>${r.hatch?`<span>🥚 ${fmtTime(r.hatch)}</span>`:""}</div></article>`).join("")}</div>
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
 renderAscChart($('[data-chart="asc"]',root),S);
}
function sourceText(id){
 return id==="pets"?"PetUpgradeLibrary.json + EggLibrary.json + AscensionConfigsLibrary.json":
 id==="mounts"?"MountUpgradeLibrary.json + AscensionConfigsLibrary.json":
 id==="skills"?"SkillPassiveLibrary.json + SkillLibrary.json + AscensionConfigsLibrary.json":
 "ItemBalancingLibrary.json + AscensionConfigsLibrary.json";
}

function renderRarityChart(host,rows,id){
 const W=1180,H=430,L=88,R=30,T=38,B=82;
 const vals=rows.map(r=>r.damage),min=Math.min(...vals),max=Math.max(...vals),lo=Math.log10(min),hi=Math.log10(max);
 const x=i=>L+i*(W-L-R)/(rows.length-1), y=v=>T+(hi-Math.log10(v))/(hi-lo||1)*(H-T-B);
 const pts=rows.map((r,i)=>[x(i),y(r.damage)]);
 const ratios=calcRatios(rows);
 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg">`;
 for(let i=0;i<5;i++){const yy=T+i*(H-T-B)/4;const val=10**(hi-i*(hi-lo)/4);svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid"/><text x="${L-12}" y="${yy+4}" text-anchor="end" class="axis">${fmt(val)}</text>`}
 svg+=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" class="power-line"/>`;
 rows.forEach((r,i)=>{
   const [px,py]=pts[i],c=COLORS[r.name]||"#88a";
   svg+=`<circle cx="${px}" cy="${py}" r="7" fill="${c}" class="dot"/><text x="${px}" y="${H-B+28}" text-anchor="middle" class="label">${r.name}</text><text x="${px}" y="${py-14}" text-anchor="middle" class="value">${fmt(r.damage)}</text>`;
   if(i>0){const prev=pts[i-1],mx=(prev[0]+px)/2,my=(prev[1]+py)/2-10;svg+=`<g class="ratio"><rect x="${mx-31}" y="${my-15}" width="62" height="28" rx="8"/><text x="${mx}" y="${my+4}" text-anchor="middle">×${fmt(ratios[i-1].value)}</text></g>`}
 });
 svg+=`<text x="${L}" y="${H-20}" class="caption">⚔️ Damage • ❤️ Health ma identyczny mnożnik rarity w tym systemie</text></svg>`;
 host.innerHTML=svg;
}

function renderAscChart(host,S){
 const cycles=[0,1,2,3],base=S.rows,n=base.length;
 const pts=[];
 cycles.forEach(a=>base.forEach(r=>pts.push({a,name:r.name,value:r.damage*D.ascMultipliers[a]})));
 const logs=pts.map(p=>Math.log10(p.value)),lo=Math.min(...logs),hi=Math.max(...logs);
 const W=1640,H=610,L=90,R=35,T=55,B=105;
 const x=i=>L+i*(W-L-R)/(pts.length-1),y=v=>T+(hi-Math.log10(v))/(hi-lo)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" class="chart-svg asc-svg">`;
 for(let i=0;i<6;i++){const yy=T+i*(H-T-B)/5;const val=10**(hi-i*(hi-lo)/5);svg+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="grid"/><text x="${L-12}" y="${yy+4}" text-anchor="end" class="axis">${fmt(val)}</text>`}
 cycles.forEach(a=>{
   const start=a*n,end=start+n-1;
   const x1=x(start)-22,x2=x(end)+22;
   svg+=`<rect x="${x1}" y="${T-20}" width="${x2-x1}" height="${H-T-B+50}" rx="14" class="cycle-bg"/><text x="${(x1+x2)/2}" y="${T-2}" text-anchor="middle" class="cycle-title">A${a} • ×${fmt(D.ascMultipliers[a])}</text>`;
   const local=pts.slice(start,end+1);
   svg+=`<polyline points="${local.map((p,j)=>`${x(start+j)},${y(p.value)}`).join(" ")}" class="power-line"/>`;
   local.forEach((p,j)=>{
      const ix=start+j,px=x(ix),py=y(p.value),c=COLORS[p.name]||"#88a";
      svg+=`<circle cx="${px}" cy="${py}" r="5.5" fill="${c}" class="dot"/><text x="${px}" y="${H-B+25}" text-anchor="middle" class="small-label">${p.name}</text>`;
   });
   const peak=pts[end],px=x(end),py=y(peak.value);
   svg+=`<g class="peak"><circle cx="${px}" cy="${py}" r="9"/><text x="${px}" y="${py-18}" text-anchor="middle">ASCENSION</text></g>`;
   if(a<3){
      const nx=x(end+1),ny=y(pts[end+1].value);
      svg+=`<line x1="${px}" y1="${py}" x2="${nx}" y2="${ny}" class="reset-line"/><text x="${(px+nx)/2}" y="${(py+ny)/2-8}" text-anchor="middle" class="reset-text">RESET</text>`;
      const nextRows=base.map(r=>({name:r.name,value:r.damage*D.ascMultipliers[a+1]}));
      const recoveryIdx=nextRows.findIndex(r=>r.name===S.recovery);
      if(recoveryIdx>=0){
        const rx=x((a+1)*n+recoveryIdx),ry=y(nextRows[recoveryIdx].value);
        svg+=`<line x1="${px}" y1="${py}" x2="${rx}" y2="${py}" class="recovery-line"/><circle cx="${rx}" cy="${ry}" r="7" class="recover-dot"/><text x="${rx}" y="${ry-16}" text-anchor="middle" class="recover-text">${S.recovery} • próg z poradnika</text>`;
      }
   }
 });
 svg+=`<text x="${L}" y="${H-22}" class="caption">Ta sama absolutna skala statów dla A0–A3. Po Ascension A1 Common jest ×50 mocniejszy od A0 Common.</text></svg>`;
 host.innerHTML=svg;
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
