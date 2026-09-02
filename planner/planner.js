(()=>{
const D=window.FM_PLANNER_DATA;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DAY=86400000,HOUR=3600000,MIN=60000;
const defaults={researchSpeed:60,forgeSpeed:26,forgeLevel:27,waitLimit:30,horizon:56,forgeMode:'hybrid',forgeOngoing:true,remainingDays:2,remainingHours:5,remainingMinutes:0,techQueue:['V 1/5','V 1/5','V 1/5','V 1/5']};
let state=load();
let results={tech:[],forge:[],strategies:{}};

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem('fmPlanner')||'{}')}}catch{return {...defaults}}}
function save(){localStorage.setItem('fmPlanner',JSON.stringify(state))}
function pad(n){return String(n).padStart(2,'0')}
function fmtDate(d,withTime=true){if(!d)return'—';return `${pad(d.getDate())}.${pad(d.getMonth()+1)}${withTime?` ${pad(d.getHours())}:${pad(d.getMinutes())}`:''}`}
function fmtDuration(ms){if(ms==null||!isFinite(ms))return'—';ms=Math.max(0,ms);let m=Math.round(ms/MIN),d=Math.floor(m/1440);m-=d*1440;let h=Math.floor(m/60);m-=h*60;return `${d?d+'d ':''}${h?h+'h ':''}${m+'m'}`}
function pct(v){return Number(v||0)/100}
function gameDayStart(t){let d=new Date(t);let x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),D.resetHour,0,0,0);if(d<x)x.setDate(x.getDate()-1);return x}
function gameWeekday(t){let g=gameDayStart(t);let js=g.getDay();return js===0?7:js}
function isTechScoring(t){return D.techScoringWeekdays.includes(gameWeekday(t))}
function isForgeScoring(t){return D.forgeScoringWeekdays.includes(gameWeekday(t))}
function nextBoundaryForWeekdays(after,weekdays){
  let g=gameDayStart(after);
  for(let i=0;i<16;i++){
    let c=new Date(g.getTime()+i*DAY);
    let wd=gameWeekday(c);
    if(weekdays.includes(wd) && c>=after)return c;
  }
  return new Date(after.getTime()+14*DAY);
}
function nextTechTargetForDuration(available,duration){
  let target=nextBoundaryForWeekdays(available,D.techScoringWeekdays);
  for(let i=0;i<20;i++){
    let start=new Date(target-duration);
    if(start>=available)return {start,target};
    target=nextBoundaryForWeekdays(new Date(target.getTime()+MIN),D.techScoringWeekdays);
  }
  return {start:available,target:new Date(available.getTime()+duration)};
}
function nextForgePointStart(available){
  if(isForgeScoring(available))return new Date(available);
  return nextBoundaryForWeekdays(available,D.forgeScoringWeekdays);
}
function techByName(n){return D.tech.find(x=>x.name===n)}
function forgeByLevel(l){return D.forge.find(x=>x.level===Number(l))}
function techDuration(x){return x.baseDays*DAY/(1+pct(state.researchSpeed))}
function forgeDuration(x){return x.baseDays*DAY/(1+pct(state.forgeSpeed))}
function now(){return new Date()}

function computeTech(start,horizonEnd){
  let avail=new Date(start),out=[];
  for(let i=0;i<state.techQueue.length;i++){
    let def=techByName(state.techQueue[i]);if(!def)continue;
    let dur=techDuration(def);
    let {start:s,target:e}=nextTechTargetForDuration(avail,dur);
    if(e>horizonEnd)break;
    let gap=s-avail;
    out.push({i:i+1,def,start:s,end:e,dur,gap,points:isTechScoring(e)});
    avail=new Date(e);
  }
  return out;
}
function computeForge(mode,start,horizonEnd){
  let out=[],waitTotal=0,avail=new Date(start);
  if(state.forgeOngoing){
    let rem=(Number(state.remainingDays)||0)*DAY+(Number(state.remainingHours)||0)*HOUR+(Number(state.remainingMinutes)||0)*MIN;
    avail=new Date(start.getTime()+rem);
  }
  let level=Number(state.forgeLevel)||1;
  for(let guard=0;guard<80;guard++){
    let nextLevel=level+1,def=forgeByLevel(nextLevel);if(!def)break;
    let earliest=new Date(avail),point=nextForgePointStart(earliest),wait=Math.max(0,point-earliest),s=earliest,decision='ODPAL OD RAZU';
    if(mode==='points' && !isForgeScoring(earliest)){s=point;decision='CZEKAJ NA PUNKTY'}
    if(mode==='hybrid' && !isForgeScoring(earliest) && wait<=Number(state.waitLimit||0)*HOUR){s=point;decision='CZEKAJ NA PUNKTY'}
    if(mode==='progress')decision='MAX PROGRES';
    let e=new Date(s.getTime()+forgeDuration(def));
    if(s>horizonEnd)break;
    waitTotal+=s-earliest;
    out.push({level:nextLevel,def,start:s,end:e,dur:forgeDuration(def),wait:s-earliest,points:isForgeScoring(s),decision});
    avail=e;level=nextLevel;
  }
  out.waitTotal=waitTotal;
  return out;
}
function calculate(){
  readInputs();
  let start=now(),horizonEnd=new Date(start.getTime()+Number(state.horizon)*DAY);
  results.tech=computeTech(start,horizonEnd);
  results.strategies.progress=computeForge('progress',start,horizonEnd);
  results.strategies.points=computeForge('points',start,horizonEnd);
  results.strategies.hybrid=computeForge('hybrid',start,horizonEnd);
  results.forge=results.strategies[state.forgeMode];
  renderAll();
  save();
}
function readInputs(){
  state.researchSpeed=Number($('#researchSpeed').value)||0;state.forgeSpeed=Number($('#forgeSpeed').value)||0;state.forgeLevel=Number($('#forgeLevel').value)||1;
  state.waitLimit=Number($('#waitLimit').value)||0;state.horizon=Number($('#horizon').value)||56;state.forgeMode=$('#forgeMode').value;state.forgeOngoing=$('#forgeOngoing').checked;
  state.remainingDays=Number($('#remainingDays').value)||0;state.remainingHours=Number($('#remainingHours').value)||0;state.remainingMinutes=Number($('#remainingMinutes').value)||0;
}
function syncInputs(){
  for(const id of ['researchSpeed','forgeSpeed','forgeLevel','waitLimit','horizon','forgeMode','remainingDays','remainingHours','remainingMinutes'])$('#'+id).value=state[id];
  $('#forgeOngoing').checked=!!state.forgeOngoing;$('#remainingInputs').style.opacity=state.forgeOngoing?'1':'.35';
}
function renderQueue(){
  let q=$('#techQueue'),empty=$('#queueEmpty');empty.style.display=state.techQueue.length?'none':'block';
  q.innerHTML=state.techQueue.map((n,i)=>{let x=techByName(n),dur=x?techDuration(x):0;return `<div class="queue-item"><span class="num">${i+1}</span><div><b>${n}</b><span>${fmtDuration(dur)} • ${x?.potions??0} potions</span></div><button class="icon-btn" data-up="${i}">↑</button><button class="icon-btn" data-down="${i}">↓</button><button class="icon-btn" data-del="${i}">×</button></div>`}).join('');
  $$('[data-del]').forEach(b=>b.onclick=()=>{state.techQueue.splice(+b.dataset.del,1);calculate()});
  $$('[data-up]').forEach(b=>b.onclick=()=>move(+b.dataset.up,-1));
  $$('[data-down]').forEach(b=>b.onclick=()=>move(+b.dataset.down,1));
}
function move(i,d){let j=i+d;if(j<0||j>=state.techQueue.length)return;[state.techQueue[i],state.techQueue[j]]=[state.techQueue[j],state.techQueue[i]];calculate()}
function renderTech(){
  $('#techTable').innerHTML=results.tech.length?results.tech.map(x=>`<tr><td>${x.i}</td><td><b>${x.def.name}</b></td><td>${fmtDuration(x.dur)}</td><td class="${x.gap>0?'wait':''}">${fmtDuration(x.gap)}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td class="${x.points?'yes':'no'}">${x.points?'TAK':'NIE'}</td></tr>`).join(''):`<tr><td colspan="7">Brak badań w kolejce lub poza horyzontem.</td></tr>`;
}
function renderForge(){
  let modeText={hybrid:`HYBRYDA: czekaj na punktowany start maksymalnie ${state.waitLimit}h.`,progress:'PROGRES: startuj każdy poziom natychmiast.',points:'PUNKTY: zawsze czekaj na najbliższy punktowany start.'};
  $('#forgeModeDesc').textContent=modeText[state.forgeMode];
  $('#forgeTable').innerHTML=results.forge.length?results.forge.map(x=>`<tr><td><b>${x.level}</b></td><td>${fmtDuration(x.dur)}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td class="${x.wait>0?'wait':''}">${fmtDuration(x.wait)}</td><td class="${x.points?'yes':''}">${x.decision}</td></tr>`).join(''):`<tr><td colspan="6">Brak kolejnych poziomów w horyzoncie.</td></tr>`;
}
function renderSummary(){
  let t=results.tech[0],f=results.forge[0];
  $('#nextTechName').textContent=t?.def.name||'—';$('#nextTechTime').textContent=t?`${fmtDate(t.start)} → ${fmtDate(t.end)}`:'—';$('#nextTechNote').textContent=t?`Wolne przed startem: ${fmtDuration(t.gap)}`:'Dodaj badanie';
  $('#nextForgeName').textContent=f?`Poziom ${f.level}`:'—';$('#nextForgeTime').textContent=f?`${fmtDate(f.start)} → ${fmtDate(f.end)}`:'—';$('#nextForgeNote').textContent=f?`${f.decision} • czekanie ${fmtDuration(f.wait)}`:'—';
  $('#techHits').textContent=results.tech.filter(x=>x.points).length;$('#forgeHits').textContent=results.forge.filter(x=>x.points).length;
  $('#techWaitTotal').textContent=`Łączne wolne okna: ${fmtDuration(results.tech.reduce((a,x)=>a+x.gap,0))}`;
  $('#forgeWaitTotal').textContent=`Łączne czekanie: ${fmtDuration(results.forge.waitTotal||0)}`;
}
function renderGaps(){
  let html=results.tech.filter(x=>x.gap>=5*MIN).map(x=>{
    let fits=D.tech.map(t=>({t,d:techDuration(t)})).filter(y=>y.d<=x.gap).sort((a,b)=>b.d-a.d).slice(0,3);
    return `<div class="gap-item"><strong>${fmtDuration(x.gap)} przed ${x.def.name}</strong><div>${fits.length?fits.map(y=>`${y.t.name} (${fmtDuration(y.d)})`).join(' • '):'Brak badania z tabeli, które się mieści.'}</div><small>${fmtDate(new Date(x.start-x.gap))} → ${fmtDate(x.start)}</small></div>`;
  }).join('');
  $('#gapSuggestions').innerHTML=html||'<div class="gap-item"><strong>Brak większych wolnych okien</strong><div>Kolejka wykorzystuje czas dość ciasno.</div></div>';
}
function renderLibraries(){
  let q=($('#techSearch')?.value||'').toLowerCase();
  $('#techLibrary').innerHTML=D.tech.filter(x=>x.name.toLowerCase().includes(q)).map(x=>`<div class="lib-card"><div class="tier">TIER ${x.tier}</div><h3>${x.name}</h3><div class="lib-stats"><div class="lib-stat"><span>BAZOWO</span><b>${fmtDuration(x.baseDays*DAY)}</b></div><div class="lib-stat"><span>TWÓJ CZAS</span><b>${fmtDuration(techDuration(x))}</b></div><div class="lib-stat"><span>RED POTIONS</span><b>${x.potions}</b></div><div class="lib-stat"><span>SKIP</span><b>${x.gems} gems</b></div></div></div>`).join('');
  $('#forgeLibrary').innerHTML=D.forge.map(x=>`<div class="lib-card"><div class="tier">FORGE</div><h3>Poziom ${x.level}</h3><div class="lib-stats"><div class="lib-stat"><span>BAZOWO</span><b>${fmtDuration(x.baseDays*DAY)}</b></div><div class="lib-stat"><span>TWÓJ CZAS</span><b>${fmtDuration(forgeDuration(x))}</b></div><div class="lib-stat"><span>KOSZT</span><b>${x.totalCost}</b></div><div class="lib-stat"><span>SKIP</span><b>${x.gems}</b></div></div></div>`).join('');
}
function renderStrategies(){
  $('#strategyCompare').innerHTML=['progress','points','hybrid'].map(m=>{let a=results.strategies[m],last=a.at(-1);return `<div class="strategy-card ${state.forgeMode===m?'active':''}"><span>${m.toUpperCase()}</span><b>${a.length} poziomów</b><small>Czekanie ${fmtDuration(a.waitTotal||0)} • koniec ${last?fmtDate(last.end):'—'}</small></div>`}).join('');
}
function renderTimeline(){
  let start=gameDayStart(now()),days=Number(state.horizon),dayW=104,labelW=92,total=labelW+days*dayW;
  let header=`<div class="timeline-header" style="width:${total}px;margin-left:0"><div style="width:${labelW}px;height:100%;position:absolute;left:0;background:#0b1017;border-right:1px solid #1d2632"></div>`;
  for(let i=0;i<days;i++){let d=new Date(start.getTime()+i*DAY),wd=gameWeekday(d),cfg=D.days[wd-1];header+=`<div class="day-cell ${cfg.tech?'scoring-tech':''} ${cfg.forge?'scoring-forge':''}" style="left:${labelW+i*dayW}px;width:${dayW}px"><b>${cfg.short} ${fmtDate(d,false)}</b>${cfg.tech?'TECH ':''}${cfg.forge?'KUŹNIA':''}</div>`}
  header+='</div>';
  const row=(name,events,type)=>{
    let ev=events.map(x=>{let s=Math.max(start.getTime(),x.start.getTime()),e=Math.min(start.getTime()+days*DAY,x.end.getTime());if(e<=s)return'';let left=labelW+(s-start)/DAY*dayW,w=Math.max(4,(e-s)/DAY*dayW);return `<div class="event ${type}" style="left:${left}px;width:${w}px" title="${type==='tech'?x.def.name:'Poziom '+x.level}: ${fmtDate(x.start)} → ${fmtDate(x.end)}"><b>${type==='tech'?x.def.name:'Lvl '+x.level}</b><span>${fmtDate(x.start)} → ${fmtDate(x.end)}</span></div>`}).join('');
    return `<div class="timeline-row" style="width:${total}px"><div class="row-label">${name}</div><div class="track-content" style="width:${days*dayW}px">${ev}</div></div>`
  };
  let acts='<div class="timeline-activities">'+D.days.map(d=>`<span><b>${d.short}</b> ${d.activities.join(' / ')||'—'}</span>`).join('')+'</div>';
  $('#timeline').className='timeline';$('#timeline').style.width=total+'px';$('#timeline').innerHTML=header+row('TECH',results.tech,'tech')+row('KUŹNIA',results.forge,'forge')+acts;
}
function renderClock(){let n=now(),g=gameDayStart(n),wd=gameWeekday(n),cfg=D.days[wd-1];$('#nowText').textContent=fmtDate(n);$('#gameDayText').textContent=`Dzień gry: ${cfg.name} • reset ${pad(D.resetHour)}:00`}
function renderAll(){renderQueue();renderTech();renderForge();renderSummary();renderGaps();renderLibraries();renderStrategies();renderTimeline();renderClock()}

function init(){
  syncInputs();
  $('#techSelect').innerHTML=D.tech.map(x=>`<option value="${x.name}">${x.name} • ${fmtDuration(techDuration(x))}</option>`).join('');
  $$('.nav-btn').forEach(b=>b.onclick=()=>{$$('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view).classList.add('active');window.scrollTo(0,0);if(b.dataset.view==='timelineView')renderTimeline()});
  $('#addTech').onclick=()=>{state.techQueue.push($('#techSelect').value);calculate()};
  $('#repeatTech').onclick=()=>{for(let i=0;i<8;i++)state.techQueue.push($('#techSelect').value);calculate()};
  $('#recalculate').onclick=calculate;
  ['researchSpeed','forgeSpeed'].forEach(id=>$('#'+id).oninput=()=>{readInputs();renderLibraries()});
  $('#forgeOngoing').onchange=()=>{$('#remainingInputs').style.opacity=$('#forgeOngoing').checked?'1':'.35'};
  $('#techSearch').oninput=renderLibraries;
  $('#resetPlan').onclick=()=>{if(confirm('Przywrócić domyślne ustawienia plannera?')){state={...defaults,techQueue:[...defaults.techQueue]};syncInputs();calculate()}};
  $('#exportPlan').onclick=async()=>{readInputs();let text=JSON.stringify(state,null,2);try{await navigator.clipboard.writeText(text);alert('Plan skopiowany do schowka.')}catch{prompt('Skopiuj JSON:',text)}};
  $('#importPlan').onclick=()=>{$('#importModal').classList.add('open');$('#importText').value=''};
  $('#cancelImport').onclick=()=>$('#importModal').classList.remove('open');
  $('#doImport').onclick=()=>{try{let x=JSON.parse($('#importText').value);state={...defaults,...x,techQueue:Array.isArray(x.techQueue)?x.techQueue:[...defaults.techQueue]};syncInputs();$('#importModal').classList.remove('open');calculate()}catch{alert('Niepoprawny JSON.')}};
  $('#importModal').onclick=e=>{if(e.target===$('#importModal'))$('#importModal').classList.remove('open')};
  calculate();setInterval(renderClock,30000);
}
init();
})();