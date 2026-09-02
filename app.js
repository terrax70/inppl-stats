
const D = window.INPPL_DATA;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>n==null?'—':Math.round(n).toLocaleString('pl-PL');
const compact=n=>{
  if(n==null)return'—'; const a=Math.abs(n);
  if(a>=1e12)return (n/1e12).toFixed(2).replace('.',',')+'t';
  if(a>=1e9)return (n/1e9).toFixed(2).replace('.',',')+'b';
  if(a>=1e6)return (n/1e6).toFixed(2).replace('.',',')+'m';
  if(a>=1e3)return (n/1e3).toFixed(1).replace('.',',')+'k';
  return fmt(n);
};
const power=n=>{
  if(n==null)return'—';
  // source unit = millions; convert to absolute notation k/m/b/t
  const absolute=n*1e6, a=Math.abs(absolute);
  if(a>=1e12)return (absolute/1e12).toFixed(2).replace('.',',')+'t';
  if(a>=1e9)return (absolute/1e9).toFixed(2).replace('.',',')+'b';
  if(a>=1e6)return (absolute/1e6).toFixed(2).replace('.',',')+'m';
  if(a>=1e3)return (absolute/1e3).toFixed(1).replace('.',',')+'k';
  return fmt(absolute);
};
const pct=n=>n==null?'—':`${n>=0?'+':''}${n.toFixed(1).replace('.',',')}%`;
const sign=n=>n>=0?'+':'';
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

let charts={};
function killChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function baseOptions(formatter=compact){
  return {
    responsive:true, maintainAspectRatio:false, animation:{duration:650,easing:'easeOutQuart'},
    interaction:{mode:'index',intersect:false},
    plugins:{
      legend:{display:false},
      tooltip:{
        backgroundColor:'#121820',borderColor:'#2b3544',borderWidth:1,titleColor:'#f5f7fb',bodyColor:'#b9c4d2',
        padding:10,displayColors:true,callbacks:{label:c=>`${c.dataset.label}: ${formatter(c.parsed.y)}`}
      }
    },
    scales:{
      x:{grid:{display:false},border:{display:false},ticks:{color:'#657286',font:{size:9}}},
      y:{grid:{color:'rgba(255,255,255,.045)'},border:{display:false},ticks:{color:'#657286',font:{size:9},callback:v=>formatter(v)}}
    }
  };
}
function lineChart(id, labels, datasets, formatter=compact, extra={}){
  killChart(id); const el=$('#'+id); if(!el || typeof Chart==='undefined')return;
  const opts=baseOptions(formatter);
  opts.interaction={mode:'nearest',axis:'xy',intersect:false};
  opts.plugins.tooltip={
    backgroundColor:'#121820',borderColor:'#2b3544',borderWidth:1,titleColor:'#f5f7fb',bodyColor:'#b9c4d2',
    padding:10,displayColors:true,
    callbacks:{label:c=>`${c.dataset.label}: ${formatter(c.parsed.y)}`}
  };
  charts[id]=new Chart(el,{
    type:'line',
    data:{labels,datasets:datasets.map((d,i)=>({
      label:d.label,data:d.data,
      borderColor:d.color||['#f4b651','#6ea8ff','#ad88ff'][i%3],
      backgroundColor:d.fill?`${d.color||'#f4b651'}22`:'transparent',
      fill:!!d.fill,tension:d.tension??.28,
      borderWidth:d.borderWidth??(i===0?2.5:2),
      pointRadius:d.pointRadius??2.5,
      pointHoverRadius:d.pointHoverRadius??5,
      pointBackgroundColor:d.color||['#f4b651','#6ea8ff','#ad88ff'][i%3],
      pointBorderColor:d.pointBorderColor??'#0b1016',
      pointBorderWidth:d.pointBorderWidth??1.5,
      spanGaps:d.spanGaps??true,
      order:d.order??0
    }))},
    options:{...opts,...extra}
  });
}
function barChart(id, labels, values, formatter=compact, horizontal=false){
  killChart(id); const el=$('#'+id); if(!el || typeof Chart==='undefined')return;
  const opt=baseOptions(formatter); opt.indexAxis=horizontal?'y':'x'; opt.interaction={mode:'nearest',intersect:true}; opt.hover={mode:'nearest',intersect:true}; opt.plugins.tooltip.callbacks.label=c=>formatter(horizontal?c.parsed.x:c.parsed.y);
  if(horizontal){opt.scales.x.ticks.callback=v=>formatter(v);opt.scales.y.grid.display=false}
  charts[id]=new Chart(el,{type:'bar',data:{labels,datasets:[{
    label:'Punkty',data:values,backgroundColor:values.map((_,i)=>i<3?['rgba(244,182,81,.92)','rgba(209,164,89,.78)','rgba(176,141,85,.72)'][i]:'rgba(110,168,255,.28)'),
    borderColor:values.map((_,i)=>i<3?['#f4b651','#d8ad69','#af8c58'][i]:'rgba(110,168,255,.65)'),borderWidth:1,borderRadius:5,borderSkipped:false
  }]},options:opt});
}

function setView(id, push=true){
 scrollPageTop();
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  if(push && id!=='profile') history.replaceState(null,'','#'+id);
  if(id==='overview') requestAnimationFrame(renderOverviewCharts);
  if(id==='power') requestAnimationFrame(renderPowerCharts);
  if(id==='compare') requestAnimationFrame(renderCompare);
}
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

function metric(label,value,sub,delta=null){
  return `<div class="metric"><div class="metric-label">${label}</div><div class="metric-val">${value}${delta!=null?`<span class="delta ${delta>=0?'positive':'negative'}">${pct(delta)}</span>`:''}</div><div class="metric-bottom">${sub}</div></div>`;
}
function formatDelta(v,formatter=compact){ return v==null?'—':`${sign(v)}${formatter(v)}`; }
function powerPct(deltaM,currentM){
  if(deltaM==null||currentM==null)return null;
  const prev=currentM-deltaM;
  return prev?deltaM/prev*100:null;
}
function fmtPct1(v){return v==null?'—':`${v>=0?'+':''}${v.toFixed(1).replace('.',',')}%`;}
function placeClass(place){
 if(place===1)return'place-1'; if(place===2)return'place-2'; if(place===3)return'place-3';
 if(place<=10)return'place-top10'; if(place<=20)return'place-top20'; if(place<=35)return'place-mid'; return'place-low';
}
function placeBadge(place){return `<span class="place-badge ${placeClass(place)}">#${place}</span>`;}
function playerButton(nick,extra=''){return `<button class="player-inline ${extra}" onclick="openProfile('${escapeHtml(nick).replace(/'/g,"\\'")}')">${escapeHtml(nick)}</button>`;}
const expandedLists={topFive:false,jumps:false,growth:false,powerGrowth:false,powerDrop:false,powerAnalytics:false};
function moreButton(id,key,total,shown){
 const b=$('#'+id);if(!b)return;
 const expanded=!!expandedLists[key];
 b.textContent=expanded?'Pokaż mniej':(total>shown?`Pokaż więcej (${total})`:'');
 b.style.display=b.textContent?'inline-flex':'none';
 b.onclick=()=>{expandedLists[key]=!expandedLists[key];if(['topFive','jumps','growth'].includes(key))renderOverview();else if(key==='powerAnalytics')renderPowerAnalytics();else renderPower();};
}



function renderOverview(){
  const l=D.latest,pw=D.powerWeeks.at(-1);
  $('#heroWeek').textContent=l.week; $('#heroTier').textContent=l.tier||'—'; $('#heroDate').textContent=l.date||'';
  $('#heroScore').textContent=compact(l.total);
  $('#heroTrend').textContent=`${D.warDeltaPct>=0?'▲':'▼'} ${Math.abs(D.warDeltaPct||0).toFixed(1).replace('.',',')}% vs poprzedni tydzień`;
  $('#heroTrend').className='trend '+(D.warDeltaPct>=0?'up':'down');

  const leader=playerButton(l.winner);
  const growthTop=D.topGrowth[0];
  const growthName=growthTop?playerButton(growthTop.nick):'—';
  $('#overviewMetrics').innerHTML =
    metric('Średnia na gracza',compact(l.avg),`${l.count} punktujących`)+
    metric('Moc klanu',power(pw.totalM),`${pw.count} graczy`,D.powerDeltaPct)+
    metric('Lider tygodnia',leader,`${compact(l.winnerPoints)} pkt`)+
    metric('Największy wzrost mocy',growthName,growthTop?`${fmtPct1(growthTop.pct)} • ${formatDelta(growthTop.deltaM,power)}`:'—');

  const topLim=expandedLists.topFive?l.entries.length:5;
  $('#topFive').innerHTML=l.entries.slice(0,topLim).map((e,i)=>`<button class="top-card ${placeClass(i+1)}" onclick="openProfile('${escapeHtml(e.nick).replace(/'/g,"\\'")}')"><div class="place">${placeBadge(i+1)}</div><div class="name">${escapeHtml(e.nick)}</div><div class="score">${compact(e.points)}</div><div class="rank">${escapeHtml(e.rank)}</div></button>`).join('');
  moreButton('topFiveMore','topFive',l.entries.length,topLim);

  const jumpLim=expandedLists.jumps?D.topJumps.length:6;
  $('#jumpList').innerHTML=D.topJumps.slice(0,jumpLim).map((x,i)=>listRow(i,x.nick,compact(x.points),x.delta,compact)).join('');
  moreButton('jumpMore','jumps',D.topJumps.length,jumpLim);
  const growthLim=expandedLists.growth?D.topGrowth.length:6;
  $('#growthList').innerHTML=D.topGrowth.slice(0,growthLim).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.pct,fmtPct1,`${formatDelta(x.deltaM,power)}`)).join('');
  moreButton('growthMore','growth',D.topGrowth.length,growthLim);

  const bestAvgWeek=[...D.weeks].sort((a,b)=>b.avg-a.avg)[0];
  const bestTotalWeek=[...D.weeks].sort((a,b)=>b.total-a.total)[0];
  const mostActive=[...D.weeks].sort((a,b)=>b.count-a.count)[0];
  $('#insights').innerHTML=[
    ['Najmocniejszy tydzień',bestTotalWeek.week,`${compact(bestTotalWeek.total)} pkt łącznie`],
    ['Najwyższa średnia',bestAvgWeek.week,`${compact(bestAvgWeek.avg)} na gracza`],
    ['Największa frekwencja',mostActive.week,`${mostActive.count} punktujących graczy`]
  ].map(x=>`<div class="insight"><div class="insight-title">${x[0]}</div><div class="insight-main">${x[1]}</div><div class="insight-sub">${x[2]}</div></div>`).join('');
}
function listRow(i,nick,meta,delta,formatter,secondary=''){
 const place=i+1;
 return `<div class="list-row ${placeClass(place)}"><div class="list-index">${placeBadge(place)}</div><div><div class="list-name">${playerButton(nick)}</div><div class="list-meta">${meta}${secondary?` • ${secondary}`:''}</div></div><div class="list-value ${delta>=0?'positive':'negative'}">${delta>=0?'▲':'▼'} ${formatter(Math.abs(delta))}</div></div>`;
}


let selectedOverviewPlayer = D.players.find(p=>p.nick==='Wosiu'&&p.active!==false)?.nick || D.players.find(p=>p.active!==false)?.nick || '';
let selectedPowerPlayer = selectedOverviewPlayer;

function allPlayerWarDatasets(selectedNick){
  const labels=D.weeks.map(w=>w.week);
  const muted=D.players.map(p=>({
    label:p.nick,
    data:labels.map(w=>p.history.find(h=>h.week===w)?.points??null),
    color:'rgba(139,151,167,.18)', borderWidth:1, pointRadius:0, pointHoverRadius:3, tension:.18, order:3
  }));
  const avg={
    label:'Średnia klanu',data:D.weeks.map(w=>w.avg),
    color:'#f4b651',borderWidth:3.6,pointRadius:3.2,pointHoverRadius:5.5,tension:.22,order:1
  };
  const p=D.players.find(x=>x.nick===selectedNick);
  const selected=p?{
    label:p.nick,data:labels.map(w=>p.history.find(h=>h.week===w)?.points??null),
    color:'#55b7ff',borderWidth:3.2,pointRadius:3,pointHoverRadius:6,tension:.22,order:0
  }:null;
  return [...muted,avg,...(selected?[selected]:[])];
}
function allPlayerPowerDatasets(selectedNick){
  const labels=D.powerWeeks.map(w=>w.week);
  const muted=D.players.map(p=>({
    label:p.nick,
    data:labels.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),
    color:'rgba(139,151,167,.18)',borderWidth:1,pointRadius:0,pointHoverRadius:3,tension:.18,order:3
  }));
  const avg={
    label:'Średnia klanu',data:D.powerWeeks.map(w=>w.avgM),
    color:'#f4b651',borderWidth:3.6,pointRadius:3.2,pointHoverRadius:5.5,tension:.22,order:1
  };
  const p=D.players.find(x=>x.nick===selectedNick);
  const selected=p?{
    label:p.nick,data:labels.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),
    color:'#55b7ff',borderWidth:3.2,pointRadius:3,pointHoverRadius:6,tension:.22,order:0
  }:null;
  return [...muted,avg,...(selected?[selected]:[])];
}
function renderOverviewCharts(){
  const warLabels=D.weeks.map(w=>w.week);
  lineChart('overviewWarChart',warLabels,allPlayerWarDatasets(selectedOverviewPlayer),compact);
  const powerLabels=D.powerWeeks.map(w=>w.week);
  lineChart('overviewPowerChart',powerLabels,allPlayerPowerDatasets(selectedPowerPlayer),power);
}
$('#overviewPlayerSelect').onchange=()=>{
  selectedOverviewPlayer=$('#overviewPlayerSelect').value;
  // keep power selection synced if player has power history
  selectedPowerPlayer=selectedOverviewPlayer;
  $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
  $('#powerPagePlayerSelect').value=selectedPowerPlayer;
  renderOverviewCharts();
  if($('#power').classList.contains('active'))renderPowerCharts();
};
$('#overviewPowerPlayerSelect').onchange=()=>{
  selectedPowerPlayer=$('#overviewPowerPlayerSelect').value;
  $('#powerPagePlayerSelect').value=selectedPowerPlayer;
  renderOverviewCharts();
};
$('#powerPagePlayerSelect').onchange=()=>{
  selectedPowerPlayer=$('#powerPagePlayerSelect').value;
  $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
  renderPowerCharts();
};


let selectedPowerSnapshot=D.powerWeeks.at(-1)?.week || '';
let powerAnalyticsMode='spikePct';

let selectedWeek=D.latest.week;
function renderWeekBar(){
 $('#weekbar').innerHTML=D.weeks.map(w=>`<button class="week-btn ${w.week===selectedWeek?'active':''}" data-week="${w.week}"><b>${w.week}</b><span>${w.date||''}</span></button>`).join('');
 $$('.week-btn').forEach(b=>b.onclick=()=>{selectedWeek=b.dataset.week;renderWeekBar();renderWarView()});
}
function getWarDeltas(w){
 const idx=D.weeks.findIndex(x=>x.week===w.week); if(idx<=0)return [];
 const prev=D.weeks[idx-1]; const pm=Object.fromEntries(prev.entries.map(e=>[e.nick,e.points]));
 return w.entries.filter(e=>pm[e.nick]!=null).map(e=>({...e,delta:e.points-pm[e.nick]}));
}
function renderWarView(){
 const w=D.weeks.find(x=>x.week===selectedWeek); const deltas=getWarDeltas(w);
 const best=[...deltas].sort((a,b)=>b.delta-a.delta)[0], worst=[...deltas].sort((a,b)=>a.delta-b.delta)[0];
 $('#warTitle').textContent=`${w.week} • ${w.tier||'—'}`;
 const warSummary=$('#warSummary');
 warSummary.classList.remove('war-win','war-loss','war-unknown');
 warSummary.classList.add(w.result==='win'?'war-win':w.result==='loss'?'war-loss':'war-unknown');
 const resultText=w.resultLabel||'BRAK WYNIKU';
 const typeText=w.resultType&&w.resultType.toUpperCase()!==resultText?escapeHtml(w.resultType):'';
 warSummary.innerHTML=[
   ['Wynik wojny',`<span class="war-result-badge ${w.result==='win'?'win':w.result==='loss'?'loss':'unknown'}">${escapeHtml(resultText)}</span>${typeText?`<span class="war-result-type">${typeText}</span>`:''}`],
   ['Suma punktów',compact(w.total)],['Średnia',compact(w.avg)],['Gracze',w.count],['Lider punktów',escapeHtml(w.winner)]
 ].map((x,i)=>`<div class="mini-stat ${i===0?'war-result-stat':''}"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 $('#warDeltaNote').innerHTML=best?`Największy wzrost: <b class="positive">${escapeHtml(best.nick)} +${compact(best.delta)}</b> &nbsp;•&nbsp; Największy spadek: <b class="negative">${escapeHtml(worst.nick)} ${compact(worst.delta)}</b>`:'Brak poprzedniego tygodnia do porównania.';
 $('#warTable').innerHTML=w.entries.map(e=>`<tr class="${placeClass(e.place)}"><td>${placeBadge(e.place)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(e.nick).replace(/'/g,"\\'")}')">${escapeHtml(e.nick)}</button></td><td><span class="rank-tag">${escapeHtml(e.rank)}</span></td><td class="num"><b>${fmt(e.points)}</b></td><td class="num">${e.position??'—'}</td></tr>`).join('');
 requestAnimationFrame(()=>barChart('warDistribution',w.entries.slice(0,15).map(e=>e.nick),w.entries.slice(0,15).map(e=>e.points),compact,true));
}

let playerSort={key:'latestPlace',dir:1};
function formTag(v){
 if(v==null)return'<span class="form-pill flat">brak</span>';
 if(v>30000)return`<span class="form-pill up">▲ ${compact(v)}</span>`;
 if(v<-30000)return`<span class="form-pill down">▼ ${compact(Math.abs(v))}</span>`;
 return'<span class="form-pill flat">● stabilnie</span>';
}
function renderPlayers(){
 const q=($('#playerSearch').value||'').toLowerCase().trim();
 const rk=$('#rankFilter').value;
 let arr=D.players.filter(p=>p.active!==false&&(!q||p.nick.toLowerCase().includes(q))&&(!rk||p.rank===rk));
 arr.sort((a,b)=>{
   let av=a[playerSort.key], bv=b[playerSort.key];
   if(av==null)av=playerSort.dir>0?Infinity:-Infinity;if(bv==null)bv=playerSort.dir>0?Infinity:-Infinity;
   if(typeof av==='string')return av.localeCompare(bv)*playerSort.dir;
   return (av-bv)*playerSort.dir;
 });
 $('#playersCount').textContent=`${arr.length} graczy`;
 $('#playersTable').innerHTML=arr.map(p=>`<tr class="${p.latestPlace?placeClass(p.latestPlace):''}">
 <td>${p.latestPlace?placeBadge(p.latestPlace):'—'}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(p.nick).replace(/'/g,"\\'")}')">${escapeHtml(p.nick)}</button></td>
 <td><span class="rank-tag">${escapeHtml(p.rank)}</span></td><td class="num">${fmt(p.latestPoints)}</td><td class="num">${fmt(p.avg)}</td><td class="num">${fmt(p.best)}</td>
 <td class="num">${power(p.powerM)}</td><td class="num ${p.powerChangeM>0?'positive':p.powerChangeM<0?'negative':''}">${formatDelta(p.powerChangeM,power)}</td><td>${formTag(p.formDelta)}</td></tr>`).join('');
}
$('#playerSearch').oninput=renderPlayers;$('#rankFilter').onchange=renderPlayers;
$$('#playersView th.sortable').forEach(th=>th.onclick=()=>{let k=th.dataset.sort; if(playerSort.key===k)playerSort.dir*=-1;else{playerSort.key=k;playerSort.dir=1}renderPlayers()});

function renderPower(){
 const pw=D.powerWeeks.at(-1), prevPw=D.powerWeeks.at(-2);
 $('#powerTotal').textContent=power(pw.totalM);$('#powerTotalSub').textContent=`${pw.count} graczy • snapshot ${pw.week}`;
 $('#powerDelta').textContent=pct(D.powerDeltaPct);$('#powerDelta').className=D.powerDeltaPct>=0?'positive':'negative';
 $('#powerDeltaSub').textContent=prevPw?`${pw.week} vs ${prevPw.week}`:'brak poprzedniego snapshotu';

 const growthLim=expandedLists.powerGrowth?D.topGrowth.length:7;
 $('#powerGrowthList').innerHTML=D.topGrowth.slice(0,growthLim).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.pct,fmtPct1,formatDelta(x.deltaM,power))).join('');
 moreButton('powerGrowthMore','powerGrowth',D.topGrowth.length,growthLim);
 const drops=D.topDrops.filter(x=>x.pct<0);
 const dropLim=expandedLists.powerDrop?drops.length:7;
 $('#powerDropList').innerHTML=drops.slice(0,dropLim).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.pct,fmtPct1,formatDelta(x.deltaM,power))).join('') || '<div class="empty">Brak spadków w ostatnim snapshotcie</div>';
 moreButton('powerDropMore','powerDrop',drops.length,dropLim);

 const arr=[...D.players].filter(p=>p.active!==false&&p.powerM!=null).sort((a,b)=>b.powerM-a.powerM);
 $('#powerTable').innerHTML=arr.map((p,i)=>{
   const pc=p.powerChangePct??powerPct(p.powerChangeM,p.powerM); const place=i+1;
   return `<tr class="${placeClass(place)}"><td>${placeBadge(place)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(p.nick).replace(/'/g,"\\'")}')">${escapeHtml(p.nick)}</button></td><td><span class="rank-tag">${escapeHtml(p.rank)}</span></td><td class="num"><b>${power(p.powerM)}</b></td><td class="num ${p.powerChangeM>0?'positive':p.powerChangeM<0?'negative':''}">${formatDelta(p.powerChangeM,power)}</td><td class="num ${pc>0?'positive':pc<0?'negative':''}"><b>${fmtPct1(pc)}</b></td><td class="num">${(p.powerM/pw.totalM*100).toFixed(2).replace('.',',')}%</td></tr>`;
 }).join('');

 renderPowerSnapshotBar();
 renderPowerAnalytics();
}
function renderPowerSnapshotBar(){
 $('#powerSnapshotBar').innerHTML=D.powerWeeks.map(w=>`<button class="snapshot-btn ${w.week===selectedPowerSnapshot?'active':''}" data-snap="${w.week}"><b>${w.week}</b><span>${power(w.totalM)}</span></button>`).join('');
 $$('.snapshot-btn').forEach(b=>b.onclick=()=>{selectedPowerSnapshot=b.dataset.snap;renderPowerSnapshotBar();renderPowerSnapshot();});
 renderPowerSnapshot();
}
function renderPowerSnapshot(){
 const snap=D.powerWeeks.find(w=>w.week===selectedPowerSnapshot); if(!snap)return;
 const idx=D.powerWeeks.findIndex(w=>w.week===selectedPowerSnapshot);
 const prev=idx>0?D.powerWeeks[idx-1]:null;
 $('#powerSnapshotSummary').innerHTML=[
   ['Łączna moc',power(snap.totalM)],['Średnia',power(snap.avgM)],['Gracze',snap.count],['Zmiana klanu',prev?fmtPct1((snap.totalM/prev.totalM-1)*100):'—']
 ].map(x=>`<div class="mini-stat"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');

 const arr=D.players.map(p=>{
   const cur=p.powers.find(x=>x.week===selectedPowerSnapshot);
   if(!cur)return null;
   const pi=p.powers.findIndex(x=>x.week===selectedPowerSnapshot);
   const prv=pi>0?p.powers[pi-1]:null;
   const delta=prv?cur.powerM-prv.powerM:null;
   const pc=cur.growthPct??(prv&&prv.powerM?delta/prv.powerM*100:null);
   return {nick:p.nick,powerM:cur.powerM,deltaM:delta,pct:pc};
 }).filter(Boolean).sort((a,b)=>b.powerM-a.powerM);

 $('#powerSnapshotTable').innerHTML=arr.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td><b>${power(x.powerM)}</b></td><td class="num ${x.deltaM>0?'positive':x.deltaM<0?'negative':''}">${x.deltaM==null?'—':formatDelta(x.deltaM,power)}</td><td class="num ${x.pct>0?'positive':x.pct<0?'negative':''}">${fmtPct1(x.pct)}</td></tr>`).join('');
}

function renderPowerAnalytics(){
 const head=$('#powerAnalyticsHead'), body=$('#powerAnalyticsBody');
 let source=[], mode=powerAnalyticsMode;
 if(mode==='spikePct')source=D.powerSpikesTopPct;
 else if(mode==='spikeAbs')source=D.powerSpikesTopAbs;
 else if(mode==='growthPct')source=D.fastestGrowthPct;
 else source=D.fastestGrowthAbs;
 const lim=expandedLists.powerAnalytics?source.length:15;
 const shown=source.slice(0,lim); let rows=[];
 if(mode==='spikePct'||mode==='spikeAbs'){
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th>Okres</th><th class="num">Przed</th><th class="num">Po</th><th class="num">Spike</th><th class="num">Spike %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td>${x.fromWeek} → ${x.toWeek}</td><td class="num">${power(x.fromM)}</td><td class="num">${power(x.toM)}</td><td class="num positive">+${power(x.deltaM)}</td><td class="num positive"><b>${fmtPct1(x.pct)}</b></td></tr>`);
 }else if(mode==='growthPct'){
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th class="num">Śr. wzrost / snapshot</th><th class="num">Łączny wzrost</th><th class="num">Łącznie %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>${fmtPct1(x.avgPct)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }else{
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th class="num">Śr. wzrost / snapshot</th><th class="num">Łączny wzrost</th><th class="num">Łącznie %</th></tr>';
   rows=shown.map((x,i)=>`<tr class="${placeClass(i+1)}"><td>${placeBadge(i+1)}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>+${power(x.avgM)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }
 body.innerHTML=rows.join(''); moreButton('powerAnalyticsMore','powerAnalytics',source.length,lim);
}
$$('[data-power-analytics]').forEach(b=>b.onclick=()=>{
 powerAnalyticsMode=b.dataset.powerAnalytics;
 $$('[data-power-analytics]').forEach(x=>x.classList.toggle('active',x===b));
 renderPowerAnalytics();
});

function renderPowerCharts(){
  const labels=D.powerWeeks.map(x=>x.week);
  lineChart('powerHistoryChart',labels,allPlayerPowerDatasets(selectedPowerPlayer),power);
  barChart('growthChart',D.topGrowth.slice(0,10).map(x=>x.nick),D.topGrowth.slice(0,10).map(x=>x.pct),v=>fmtPct1(v),true);
}

function fillCompareSelectors(){
 const activePlayers=D.players.filter(p=>p.active!==false);
 const opts='<option value="">— wybierz —</option>'+activePlayers.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
 ['compare1','compare2','compare3'].forEach(id=>{$('#'+id).innerHTML=opts;});
 $('#compare1').value=activePlayers[0]?.nick||'';
 $('#compare2').value=activePlayers[1]?.nick||'';
}
function renderCompare(){
 const picks=['compare1','compare2','compare3']
   .map(id=>$('#'+id)?.value)
   .filter(Boolean)
   .filter(n=>D.players.some(p=>p.nick===n&&p.active!==false));
 if(!picks.length){killChart('compareScoreChart');killChart('comparePowerChart');return;}
 const labels=D.weeks.map(w=>w.week);
 const colors=['#f4b651','#6ea8ff','#ad88ff'];
 const scoreDs=picks.map((n,i)=>{
   const p=D.players.find(x=>x.nick===n&&x.active!==false);
   return{label:n,data:labels.map(w=>p?.history.find(h=>h.week===w)?.points??null),color:colors[i],spanGaps:false};
 });
 scoreDs.push({label:'Średnia klanu',data:D.weeks.map(w=>w.avg),color:'#6e7b8e',spanGaps:false});
 lineChart('compareScoreChart',labels,scoreDs,compact);
 const plabels=D.powerWeeks.map(x=>x.week);
 const powerDs=picks.map((n,i)=>{
   const p=D.players.find(x=>x.nick===n&&x.active!==false);
   return{label:n,data:plabels.map(w=>p?.powers.find(h=>h.week===w)?.powerM??null),color:colors[i],spanGaps:false};
 });
 lineChart('comparePowerChart',plabels,powerDs,power);
}
['compare1','compare2','compare3'].forEach(id=>$('#'+id).onchange=renderCompare);

let lastView='playersView';
window.openProfile=function(nick){
 const p=D.players.find(x=>x.nick===nick); if(!p)return;
 lastView=$('.view.active')?.id||'playersView';
 $('#profileName').textContent=p.nick;$('#profileRank').textContent=p.rank;
 $('#profilePower').textContent=power(p.powerM);
 const profPct=p.powerChangePct??powerPct(p.powerChangeM,p.powerM);
 $('#profilePowerDelta').textContent=p.powerChangeM==null?'brak poprzedniego snapshotu':`${sign(p.powerChangeM)}${power(p.powerChangeM)} (${fmtPct1(profPct)}) vs poprzedni`;
 $('#profilePowerDelta').className=p.powerChangeM>=0?'positive':'negative';
 $('#profileKpis').innerHTML=[
   ['Ostatni wynik',fmt(p.latestPoints)],['Średnia',fmt(p.avg)],['Rekord',fmt(p.best)],['Najlepszy tydzień',p.bestWeek||'—'],['Wojny',p.warCount]
 ].map(x=>`<div class="mini-stat"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 $('#profileHistory').innerHTML=p.history.slice().reverse().map(h=>`<tr><td>${h.week}</td><td>${escapeHtml(h.tier)}</td><td>${h.date}</td><td class="num">${fmt(h.points)}</td><td class="num">${h.position??'—'}</td></tr>`).join('');
 setView('profile',false);
 requestAnimationFrame(()=>{
   const labs=D.weeks.map(w=>w.week);
   lineChart('profileScoreChart',labs,[{label:p.nick,data:labs.map(w=>p.history.find(h=>h.week===w)?.points??null),fill:true},{label:'Średnia klanu',data:D.weeks.map(w=>w.avg),color:'#6ea8ff'}],compact);
   const powerLabs=p.powers.map(h=>h.week);
   const powerVals=p.powers.map(h=>h.powerM);
   lineChart('profilePowerChart',powerLabs,[{label:p.nick,data:powerVals,color:'#6ea8ff',fill:true,spanGaps:false}],power);
   const powerRows=p.powers.map((h,i)=>{
     const prev=i>0?p.powers[i-1]:null;
     const delta=prev?h.powerM-prev.powerM:null;
     const pc=h.growthPct??(prev&&prev.powerM?delta/prev.powerM*100:null);
     return `<div class="list-row">
       <div class="list-index">${escapeHtml(h.week)}</div>
       <div><div class="list-name">${power(h.powerM)}</div><div class="list-meta">${prev?`poprzednio ${power(prev.powerM)}`:'pierwszy dostępny snapshot'}</div></div>
       <div class="list-value ${delta>0?'positive':delta<0?'negative':''}">${delta==null?'—':`${sign(delta)}${power(delta)}<small style="display:block">${fmtPct1(pc)}</small>`}</div>
     </div>`;
   }).join('');
   const histEl=$('#profilePowerHistory');
   if(histEl) histEl.innerHTML=powerRows || '<div class="empty">Brak historii Power dla tego gracza</div>';
   const posLabs=p.history.filter(h=>h.position!=null).map(h=>h.week), posVals=p.history.filter(h=>h.position!=null).map(h=>h.position);
   killChart('profilePositionChart');
   if(typeof Chart!=='undefined')charts.profilePositionChart=new Chart($('#profilePositionChart'),{type:'line',data:{labels:posLabs,datasets:[{label:'Pozycja',data:posVals,borderColor:'#ad88ff',backgroundColor:'rgba(173,136,255,.12)',fill:true,tension:.3,borderWidth:2.3,pointRadius:3}]},options:{...baseOptions(v=>'#'+Math.round(v)),scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#657286',font:{size:9}}},y:{reverse:true,grid:{color:'rgba(255,255,255,.045)'},border:{display:false},ticks:{color:'#657286',font:{size:9},callback:v=>'#'+v}}}}});
 });
};
$('#profileBack').onclick=()=>setView(lastView,false);
$('#profileCompare').onclick=()=>{
 const n=$('#profileName').textContent; setView('compare',false); $('#compare1').value=n; renderCompare();
};

function scrollPageTop(){
  window.scrollTo({top:0,left:0,behavior:'auto'});
  const main=document.querySelector('.main, main, .content, .page-content');
  if(main && typeof main.scrollTo==='function') main.scrollTo({top:0,left:0,behavior:'auto'});
}

function init(){
 renderOverview(); renderWeekBar(); renderWarView();
 const ranks=[...new Set(D.players.filter(p=>p.active!==false).map(p=>p.rank))].sort();
 $('#rankFilter').innerHTML='<option value="">Wszystkie rangi</option>'+ranks.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
 const activePlayers=D.players.filter(p=>p.active!==false);
 const playerOptions=activePlayers.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
 if(!activePlayers.some(p=>p.nick===selectedOverviewPlayer))selectedOverviewPlayer=activePlayers[0]?.nick||'';
 if(!activePlayers.some(p=>p.nick===selectedPowerPlayer))selectedPowerPlayer=selectedOverviewPlayer;
 $('#heroPlayerCount').textContent=`${D.activeCount??D.players.filter(p=>p.active!==false).length} graczy w składzie`;
 $('#overviewPlayerSelect').innerHTML=playerOptions;
 $('#overviewPowerPlayerSelect').innerHTML=playerOptions;
 $('#powerPagePlayerSelect').innerHTML=playerOptions;
 $('#overviewPlayerSelect').value=selectedOverviewPlayer;
 $('#overviewPowerPlayerSelect').value=selectedPowerPlayer;
 $('#powerPagePlayerSelect').value=selectedPowerPlayer;
 renderPlayers(); renderPower(); fillCompareSelectors();
 const hash=location.hash.replace('#',''); const allowed=['overview','warsView','playersView','power','compare'];
 setView(allowed.includes(hash)?hash:'overview',false);
 requestAnimationFrame(()=>{renderOverviewCharts();renderPowerCharts();});
}
init();

window.addEventListener('hashchange',()=>{
  requestAnimationFrame(()=>scrollPageTop());
});

document.addEventListener('click',(e)=>{
  const a=e.target.closest('a[href^="#"], [data-view], .nav-item, .nav-link');
  if(!a) return;
  requestAnimationFrame(()=>scrollPageTop());
});
