
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
      spanGaps:true,
      order:d.order??0
    }))},
    options:{...opts,...extra}
  });
}
function barChart(id, labels, values, formatter=compact, horizontal=false){
  killChart(id); const el=$('#'+id); if(!el || typeof Chart==='undefined')return;
  const opt=baseOptions(formatter); opt.indexAxis=horizontal?'y':'x'; opt.plugins.tooltip.callbacks.label=c=>formatter(horizontal?c.parsed.x:c.parsed.y);
  if(horizontal){opt.scales.x.ticks.callback=v=>formatter(v);opt.scales.y.grid.display=false}
  charts[id]=new Chart(el,{type:'bar',data:{labels,datasets:[{
    label:'Punkty',data:values,backgroundColor:values.map((_,i)=>i<3?['rgba(244,182,81,.92)','rgba(209,164,89,.78)','rgba(176,141,85,.72)'][i]:'rgba(110,168,255,.28)'),
    borderColor:values.map((_,i)=>i<3?['#f4b651','#d8ad69','#af8c58'][i]:'rgba(110,168,255,.65)'),borderWidth:1,borderRadius:5,borderSkipped:false
  }]},options:opt});
}

function setView(id, push=true){
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


function renderOverview(){
  const l=D.latest,pw=D.powerWeeks.at(-1);
  $('#heroWeek').textContent=l.week; $('#heroTier').textContent=l.tier||'—'; $('#heroDate').textContent=l.date||'';
  $('#heroScore').textContent=compact(l.total);
  $('#heroTrend').textContent=`${D.warDeltaPct>=0?'▲':'▼'} ${Math.abs(D.warDeltaPct||0).toFixed(1).replace('.',',')}% vs poprzedni tydzień`;
  $('#heroTrend').className='trend '+(D.warDeltaPct>=0?'up':'down');

  $('#overviewMetrics').innerHTML =
    metric('Średnia na gracza',compact(l.avg),`${l.count} punktujących`)+
    metric('Moc klanu',power(pw.totalM),`${pw.count} graczy`,D.powerDeltaPct)+
    metric('Lider tygodnia',escapeHtml(l.winner),`${compact(l.winnerPoints)} pkt`)+
    metric('Największy wzrost mocy',escapeHtml(D.topGrowth[0]?.nick||'—'),D.topGrowth[0]?`+${power(D.topGrowth[0].deltaM)}`:'—');

  $('#topFive').innerHTML=l.entries.slice(0,5).map((e,i)=>`<button class="top-card" onclick="openProfile('${escapeHtml(e.nick).replace(/'/g,"\\'")}')"><div class="place">#${i+1}</div><div class="name">${escapeHtml(e.nick)}</div><div class="score">${compact(e.points)}</div><div class="rank">${escapeHtml(e.rank)}</div></button>`).join('');

  $('#jumpList').innerHTML=D.topJumps.slice(0,6).map((x,i)=>listRow(i,x.nick,compact(x.points),x.delta,compact)).join('');
  $('#growthList').innerHTML=D.topGrowth.slice(0,6).map((x,i)=>listRow(i,x.nick,power(x.powerM),x.deltaM,power)).join('');

  const bestAvgWeek=[...D.weeks].sort((a,b)=>b.avg-a.avg)[0];
  const bestTotalWeek=[...D.weeks].sort((a,b)=>b.total-a.total)[0];
  const mostActive=[...D.weeks].sort((a,b)=>b.count-a.count)[0];
  $('#insights').innerHTML=[
    ['Najmocniejszy tydzień',bestTotalWeek.week,`${compact(bestTotalWeek.total)} pkt łącznie`],
    ['Najwyższa średnia',bestAvgWeek.week,`${compact(bestAvgWeek.avg)} na gracza`],
    ['Największa frekwencja',mostActive.week,`${mostActive.count} punktujących graczy`]
  ].map(x=>`<div class="insight"><div class="insight-title">${x[0]}</div><div class="insight-main">${x[1]}</div><div class="insight-sub">${x[2]}</div></div>`).join('');
}
function listRow(i,nick,meta,delta,formatter){
 return `<div class="list-row"><div class="list-index">${i+1}</div><div><div class="list-name">${escapeHtml(nick)}</div><div class="list-meta">${meta}</div></div><div class="list-value ${delta>=0?'positive':'negative'}">${delta>=0?'▲':'▼'} ${formatter(Math.abs(delta))}</div></div>`;
}


let selectedOverviewPlayer = D.players.find(p=>p.nick==='Wosiu')?.nick || D.players[0]?.nick || '';
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
 $('#warSummary').innerHTML=[
   ['Suma punktów',compact(w.total)],['Średnia',compact(w.avg)],['Gracze',w.count],['Zwycięzca',escapeHtml(w.winner)]
 ].map(x=>`<div class="mini-stat"><div class="l">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 $('#warDeltaNote').innerHTML=best?`Największy wzrost: <b class="positive">${escapeHtml(best.nick)} +${compact(best.delta)}</b> &nbsp;•&nbsp; Największy spadek: <b class="negative">${escapeHtml(worst.nick)} ${compact(worst.delta)}</b>`:'Brak poprzedniego tygodnia do porównania.';
 $('#warTable').innerHTML=w.entries.map(e=>`<tr><td>#${e.place}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(e.nick).replace(/'/g,"\\'")}')">${escapeHtml(e.nick)}</button></td><td><span class="rank-tag">${escapeHtml(e.rank)}</span></td><td class="num"><b>${fmt(e.points)}</b></td><td class="num">${e.position??'—'}</td></tr>`).join('');
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
 $('#playersTable').innerHTML=arr.map(p=>`<tr>
 <td>${p.latestPlace?'#'+p.latestPlace:'—'}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(p.nick).replace(/'/g,"\\'")}')">${escapeHtml(p.nick)}</button></td>
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

 $('#powerGrowthList').innerHTML=D.topGrowth.slice(0,7).map((x,i)=>{
   const pc=powerPct(x.deltaM,x.powerM);
   return `<div class="list-row"><div class="list-index">${i+1}</div><div><div class="list-name">${escapeHtml(x.nick)}</div><div class="list-meta">${power(x.powerM)}</div></div><div class="list-value positive">+${power(x.deltaM)} <small style="display:block;color:#55d98a">${fmtPct1(pc)}</small></div></div>`;
 }).join('');

 $('#powerDropList').innerHTML=D.topDrops.filter(x=>x.deltaM<0).slice(0,7).map((x,i)=>{
   const pc=powerPct(x.deltaM,x.powerM);
   return `<div class="list-row"><div class="list-index">${i+1}</div><div><div class="list-name">${escapeHtml(x.nick)}</div><div class="list-meta">${power(x.powerM)}</div></div><div class="list-value negative">${power(x.deltaM)} <small style="display:block;color:#ff6d7d">${fmtPct1(pc)}</small></div></div>`;
 }).join('') || '<div class="empty">Brak spadków w ostatnim snapshotcie</div>';

 const arr=[...D.players].filter(p=>p.active!==false&&p.powerM!=null).sort((a,b)=>b.powerM-a.powerM);
 $('#powerTable').innerHTML=arr.map((p,i)=>{
   const pc=powerPct(p.powerChangeM,p.powerM);
   return `<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(p.nick).replace(/'/g,"\'")}')">${escapeHtml(p.nick)}</button></td><td><span class="rank-tag">${escapeHtml(p.rank)}</span></td><td class="num"><b>${power(p.powerM)}</b></td><td class="num ${p.powerChangeM>0?'positive':p.powerChangeM<0?'negative':''}">${formatDelta(p.powerChangeM,power)}</td><td class="num ${pc>0?'positive':pc<0?'negative':''}">${fmtPct1(pc)}</td><td class="num">${(p.powerM/pw.totalM*100).toFixed(2).replace('.',',')}%</td></tr>`;
 }).join('');

 renderPowerSnapshotBar();
 renderPowerAnalytics();
}

let selectedPowerSnapshot=D.powerWeeks.at(-1)?.week || 'W10';
let powerAnalyticsMode='spikePct';

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
   const pc=prv&&prv.powerM?delta/prv.powerM*100:null;
   return {nick:p.nick,powerM:cur.powerM,deltaM:delta,pct:pc};
 }).filter(Boolean).sort((a,b)=>b.powerM-a.powerM);

 $('#powerSnapshotTable').innerHTML=arr.map((x,i)=>`<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td><b>${power(x.powerM)}</b></td><td class="num ${x.deltaM>0?'positive':x.deltaM<0?'negative':''}">${x.deltaM==null?'—':formatDelta(x.deltaM,power)}</td><td class="num ${x.pct>0?'positive':x.pct<0?'negative':''}">${fmtPct1(x.pct)}</td></tr>`).join('');
}

function renderPowerAnalytics(){
 const head=$('#powerAnalyticsHead'), body=$('#powerAnalyticsBody');
 let rows=[];
 if(powerAnalyticsMode==='spikePct'){
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th>Okres</th><th class="num">Przed</th><th class="num">Po</th><th class="num">Spike</th><th class="num">Spike %</th></tr>';
   rows=D.powerSpikesTopPct.slice(0,15).map((x,i)=>`<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td>${x.fromWeek} → ${x.toWeek}</td><td class="num">${power(x.fromM)}</td><td class="num">${power(x.toM)}</td><td class="num positive">+${power(x.deltaM)}</td><td class="num positive"><b>${fmtPct1(x.pct)}</b></td></tr>`);
 }else if(powerAnalyticsMode==='spikeAbs'){
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th>Okres</th><th class="num">Przed</th><th class="num">Po</th><th class="num">Spike</th><th class="num">Spike %</th></tr>';
   rows=D.powerSpikesTopAbs.slice(0,15).map((x,i)=>`<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td>${x.fromWeek} → ${x.toWeek}</td><td class="num">${power(x.fromM)}</td><td class="num">${power(x.toM)}</td><td class="num positive"><b>+${power(x.deltaM)}</b></td><td class="num positive">${fmtPct1(x.pct)}</td></tr>`);
 }else if(powerAnalyticsMode==='growthPct'){
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th class="num">Śr. wzrost / snapshot</th><th class="num">Łączny wzrost</th><th class="num">Łącznie %</th></tr>';
   rows=D.fastestGrowthPct.slice(0,15).map((x,i)=>`<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>${fmtPct1(x.avgPct)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }else{
   head.innerHTML='<tr><th>#</th><th>Gracz</th><th class="num">Śr. wzrost / snapshot</th><th class="num">Łączny wzrost</th><th class="num">Łącznie %</th></tr>';
   rows=D.fastestGrowthAbs.slice(0,15).map((x,i)=>`<tr><td>#${i+1}</td><td><button class="player-link" onclick="openProfile('${escapeHtml(x.nick).replace(/'/g,"\\'")}')">${escapeHtml(x.nick)}</button></td><td class="num positive"><b>+${power(x.avgM)}</b></td><td class="num positive">+${power(x.totalM)}</td><td class="num positive">${fmtPct1(x.totalPct)}</td></tr>`);
 }
 body.innerHTML=rows.join('');
}
$$('[data-power-analytics]').forEach(b=>b.onclick=()=>{
 powerAnalyticsMode=b.dataset.powerAnalytics;
 $$('[data-power-analytics]').forEach(x=>x.classList.toggle('active',x===b));
 renderPowerAnalytics();
});

function renderPowerCharts(){
  const labels=D.powerWeeks.map(x=>x.week);
  lineChart('powerHistoryChart',labels,allPlayerPowerDatasets(selectedPowerPlayer),power);
  barChart('growthChart',D.topGrowth.slice(0,10).map(x=>x.nick),D.topGrowth.slice(0,10).map(x=>x.deltaM),power,true);
}

function fillCompareSelectors(){
 const opts='<option value="">— wybierz —</option>'+D.players.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
 ['compare1','compare2','compare3'].forEach((id,i)=>{$('#'+id).innerHTML=opts;});
 $('#compare1').value=D.players[0]?.nick||'';$('#compare2').value=D.players[1]?.nick||'';
}
function renderCompare(){
 const picks=['compare1','compare2','compare3'].map(id=>$('#'+id).value).filter(Boolean);
 if(!picks.length)return;
 const labels=D.weeks.map(w=>w.week);
 const colors=['#f4b651','#6ea8ff','#ad88ff'];
 const scoreDs=picks.map((n,i)=>{let p=D.players.find(x=>x.nick===n);return{label:n,data:labels.map(w=>p.history.find(h=>h.week===w)?.points??null),color:colors[i]}});
 scoreDs.push({label:'Średnia klanu',data:D.weeks.map(w=>w.avg),color:'#6e7b8e'});
 lineChart('compareScoreChart',labels,scoreDs,compact);
 const plabels=D.powerWeeks.map(x=>x.week);
 const powerDs=picks.map((n,i)=>{let p=D.players.find(x=>x.nick===n);return{label:n,data:plabels.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),color:colors[i]}});
 lineChart('comparePowerChart',plabels,powerDs,power);
}
['compare1','compare2','compare3'].forEach(id=>$('#'+id).onchange=renderCompare);

let lastView='playersView';
window.openProfile=function(nick){
 const p=D.players.find(x=>x.nick===nick); if(!p)return;
 lastView=$('.view.active')?.id||'playersView';
 $('#profileName').textContent=p.nick;$('#profileRank').textContent=p.rank;
 $('#profilePower').textContent=power(p.powerM);
 const profPct=powerPct(p.powerChangeM,p.powerM);
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
   lineChart('profilePowerChart',D.powerWeeks.map(w=>w.week),[{label:'Moc',data:D.powerWeeks.map(w=>p.powers.find(h=>h.week===w)?.powerM??null),color:'#6ea8ff',fill:true}],power);
   const posLabs=p.history.filter(h=>h.position!=null).map(h=>h.week), posVals=p.history.filter(h=>h.position!=null).map(h=>h.position);
   killChart('profilePositionChart');
   if(typeof Chart!=='undefined')charts.profilePositionChart=new Chart($('#profilePositionChart'),{type:'line',data:{labels:posLabs,datasets:[{label:'Pozycja',data:posVals,borderColor:'#ad88ff',backgroundColor:'rgba(173,136,255,.12)',fill:true,tension:.3,borderWidth:2.3,pointRadius:3}]},options:{...baseOptions(v=>'#'+Math.round(v)),scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#657286',font:{size:9}}},y:{reverse:true,grid:{color:'rgba(255,255,255,.045)'},border:{display:false},ticks:{color:'#657286',font:{size:9},callback:v=>'#'+v}}}}});
 });
};
$('#profileBack').onclick=()=>setView(lastView,false);
$('#profileCompare').onclick=()=>{
 const n=$('#profileName').textContent; setView('compare',false); $('#compare1').value=n; renderCompare();
};

function init(){
 renderOverview(); renderWeekBar(); renderWarView();
 const ranks=[...new Set(D.players.filter(p=>p.active!==false).map(p=>p.rank))].sort();
 $('#rankFilter').innerHTML='<option value="">Wszystkie rangi</option>'+ranks.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
 const playerOptions=D.players.map(p=>`<option value="${escapeHtml(p.nick)}">${escapeHtml(p.nick)}</option>`).join('');
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
