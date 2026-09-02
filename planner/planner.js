(()=>{
const D=window.FM_PLANNER_DATA,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const DAY=86400000,HOUR=3600000,MIN=60000;
const defaults={researchSpeed:60,forgeSpeed:26,forgeLevel:27,waitLimit:30,horizon:56,forgeMode:'hybrid',forgeOngoing:false,remainingDays:0,remainingHours:0,remainingMinutes:0,techQueue:[]};
let state=load(),results={tech:[],forge:[]};

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem('fmPlannerV2')||'{}')}}catch{return {...defaults}}}
function save(){localStorage.setItem('fmPlannerV2',JSON.stringify(state))}
function pad(n){return String(n).padStart(2,'0')}
function fmtDate(d){return d?`${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`:'—'}
function fmtDur(ms){if(!isFinite(ms))return'—';let m=Math.max(0,Math.round(ms/MIN)),d=Math.floor(m/1440);m-=d*1440;let h=Math.floor(m/60);m-=h*60;return `${d?d+'d ':''}${h?h+'h ':''}${m}m`}
function speed(v){return 1+Math.max(0,Number(v)||0)/100}
function gameStart(t){let d=new Date(t),g=new Date(d.getFullYear(),d.getMonth(),d.getDate(),D.resetHour);if(d<g)g.setDate(g.getDate()-1);return g}
function weekday(t){let x=gameStart(t).getDay();return x===0?7:x}
function nextBoundary(after,days){let g=gameStart(after);for(let i=0;i<18;i++){let c=new Date(g.getTime()+i*DAY);if(days.includes(weekday(c))&&c>=after)return c}return new Date(after.getTime()+14*DAY)}
function techDef(n){return D.tech.find(x=>x.name===n)}
function forgeDef(l){return D.forge.find(x=>x.level===Number(l))}
function techDur(x){return x.baseDays*DAY/speed(state.researchSpeed)}
function forgeDur(x){return x.baseDays*DAY/speed(state.forgeSpeed)}
function isTechDay(t){return D.techScoringWeekdays.includes(weekday(t))}
function isForgeDay(t){return D.forgeScoringWeekdays.includes(weekday(t))}
function nextTechSlot(avail,dur){let end=nextBoundary(avail,D.techScoringWeekdays);for(let i=0;i<24;i++){let start=new Date(end-dur);if(start>=avail)return{start,end};end=nextBoundary(new Date(end.getTime()+MIN),D.techScoringWeekdays)}return{start:avail,end:new Date(avail.getTime()+dur)}}
function nextForgeSlot(avail){return isForgeDay(avail)?new Date(avail):nextBoundary(avail,D.forgeScoringWeekdays)}

function read(){
  state.researchSpeed=+$('#researchSpeed').value||0;state.forgeSpeed=+$('#forgeSpeed').value||0;state.forgeLevel=+$('#forgeLevel').value||1;
  state.forgeMode=$('#forgeMode').value;state.forgeOngoing=$('#forgeOngoing').checked;state.remainingDays=+$('#remainingDays').value||0;
  state.remainingHours=+$('#remainingHours').value||0;state.remainingMinutes=+$('#remainingMinutes').value||0;state.waitLimit=+$('#waitLimit').value||0;state.horizon=+$('#horizon').value||56;
}
function sync(){
  ['researchSpeed','forgeSpeed','forgeLevel','forgeMode','remainingDays','remainingHours','remainingMinutes','waitLimit','horizon'].forEach(id=>$('#'+id).value=state[id]);
  $('#forgeOngoing').checked=state.forgeOngoing;toggleRemaining();
}
function toggleRemaining(){$('#remainingInputs').style.opacity=$('#forgeOngoing').checked?'1':'.32';$('#remainingInputs').querySelectorAll('input').forEach(x=>x.disabled=!$('#forgeOngoing').checked)}

function calcTech(start,endLimit){
  let avail=new Date(start),out=[];
  for(let i=0;i<state.techQueue.length;i++){
    const def=techDef(state.techQueue[i]);if(!def)continue;const dur=techDur(def),slot=nextTechSlot(avail,dur);if(slot.end>endLimit)break;
    out.push({type:'tech',i:i+1,def,start:slot.start,end:slot.end,dur,gap:slot.start-avail,scored:isTechDay(slot.end)});avail=new Date(slot.end)
  }return out
}
function calcForge(start,endLimit){
  let avail=new Date(start),out=[];
  if(state.forgeOngoing)avail=new Date(start.getTime()+state.remainingDays*DAY+state.remainingHours*HOUR+state.remainingMinutes*MIN);
  let lvl=state.forgeLevel;
  for(let i=0;i<80;i++){
    let def=forgeDef(lvl+1);if(!def)break;let earliest=new Date(avail),point=nextForgeSlot(earliest),wait=Math.max(0,point-earliest),s=earliest,decision='ODPAL OD RAZU';
    if(state.forgeMode==='points'&&!isForgeDay(earliest)){s=point;decision='CZEKAJ NA PUNKTY'}
    if(state.forgeMode==='hybrid'&&!isForgeDay(earliest)&&wait<=state.waitLimit*HOUR){s=point;decision='CZEKAJ'}
    if(state.forgeMode==='progress')decision='ODPAL OD RAZU';
    let e=new Date(s.getTime()+forgeDur(def));if(s>endLimit)break;
    out.push({type:'forge',level:lvl+1,def,start:s,end:e,dur:forgeDur(def),wait:s-earliest,scored:isForgeDay(s),decision});avail=e;lvl++
  }return out
}
function calculate(show=true){
  read();save();let start=new Date(),limit=new Date(start.getTime()+state.horizon*DAY);results.tech=calcTech(start,limit);results.forge=calcForge(start,limit);
  renderAll();
  if(show){$('#results').classList.remove('hidden');setTimeout(()=>$('#results').scrollIntoView({behavior:'smooth',block:'start'}),50)}
}

function renderQueue(){
  $('#queueEmpty').style.display=state.techQueue.length?'none':'block';
  $('#techQueue').innerHTML=state.techQueue.map((n,i)=>`<span class="chip">${i+1}. ${n}<button type="button" data-del="${i}" aria-label="Usuń ${n}">×</button></span>`).join('');
  $$('[data-del]').forEach(b=>b.addEventListener('click',()=>{state.techQueue.splice(+b.dataset.del,1);save();renderQueue()}))
}
function renderSummary(){
  let t=results.tech[0],f=results.forge[0],now=new Date();
  $('#nextTechAction').textContent=t?(t.gap>5*MIN?'POCZEKAJ, POTEM START':'STARTUJ TERAZ'):'BRAK BADANIA';
  $('#nextTechName').textContent=t?.def.name||'Dodaj Tech do kolejki';
  $('#nextTechTime').textContent=t?`Start ${fmtDate(t.start)}  →  odbiór ${fmtDate(t.end)}`:'—';
  $('#nextTechNote').textContent=t?`${t.scored?'✓ Punktowany odbiór':'Niepunktowany odbiór'}${t.gap>5*MIN?' • czekanie '+fmtDur(t.gap):''}`:'';
  $('#nextForgeAction').textContent=f?(f.wait>5*MIN?'CZEKAJ':'ODPAL TERAZ'):'BRAK KOLEJNEGO POZIOMU';
  $('#nextForgeName').textContent=f?`Kuźnia ${state.forgeLevel} → ${f.level}`:'—';
  $('#nextForgeTime').textContent=f?`Start ${fmtDate(f.start)}  →  koniec ${fmtDate(f.end)}`:'—';
  $('#nextForgeNote').textContent=f?`${f.scored?'✓ Punktowany start':'Start poza punktami'}${f.wait>5*MIN?' • czekanie '+fmtDur(f.wait):''}`:'';
  $('#techHits').textContent=results.tech.filter(x=>x.scored).length;$('#forgeHits').textContent=results.forge.filter(x=>x.scored).length;
  let tw=results.tech.reduce((a,x)=>a+x.gap,0),fw=results.forge.reduce((a,x)=>a+x.wait,0);$('#waitSummary').textContent=`Łączne czekanie: Tech ${fmtDur(tw)} • Kuźnia ${fmtDur(fw)}`;
}
function renderTimeline(){
  const start=gameStart(new Date()),days=state.horizon,dayW=116,labelW=96,total=labelW+days*dayW;
  let h=`<div class="tl-header" style="width:${total}px"><div class="tl-label-corner"></div>`;
  for(let i=0;i<days;i++){let d=new Date(start.getTime()+i*DAY),cfg=D.days[weekday(d)-1];h+=`<div class="tl-day ${cfg.tech?'tech-score':''} ${cfg.forge?'forge-score':''}" style="left:${labelW+i*dayW}px;width:${dayW}px"><b>${cfg.short} ${pad(d.getDate())}.${pad(d.getMonth()+1)}</b>${cfg.tech?'TECH ':''}${cfg.forge?'KUŹNIA':''}</div>`}
  h+='</div>';
  function row(name,arr,type){
    let events=arr.map(x=>{let s=Math.max(start.getTime(),x.start),e=Math.min(start.getTime()+days*DAY,x.end);if(e<=s)return'';let left=labelW+(s-start)/DAY*dayW,w=Math.max(5,(e-s)/DAY*dayW);let title=type==='tech'?x.def.name:`Kuźnia ${x.level}`;return `<div class="tl-event ${type} ${x.scored?'scored':''}" style="left:${left}px;width:${w}px" title="${title} | ${fmtDate(x.start)} → ${fmtDate(x.end)}"><b>${title}</b><span>${fmtDate(x.start)} → ${fmtDate(x.end)}</span></div>`}).join('');
    return `<div class="tl-row" style="width:${total}px"><div class="tl-row-label">${name}</div>${events}</div>`
  }
  let nowPos=labelW+(new Date()-start)/DAY*dayW;
  $('#timeline').style.width=total+'px';$('#timeline').innerHTML=h+row('TECH',results.tech,'tech')+row('KUŹNIA',results.forge,'forge')+`<div class="tl-now" style="left:${nowPos}px"></div>`;
}
function renderActions(){
  let all=[...results.tech.map(x=>({when:x.start,type:'tech',title:`Start Tech ${x.def.name}`,sub:`Odbiór ${fmtDate(x.end)}${x.scored?' • punktowany':''}`})),
           ...results.tech.map(x=>({when:x.end,type:'tech',title:`Odbierz Tech ${x.def.name}`,sub:x.scored?'Punktowany odbiór':'Odbiór poza punktami'})),
           ...results.forge.map(x=>({when:x.start,type:'forge',title:`Start Kuźni ${x.level}`,sub:`Koniec ${fmtDate(x.end)}${x.scored?' • punktowany start':''}`}))]
    .sort((a,b)=>a.when-b.when).slice(0,24);
  $('#actionList').innerHTML=all.length?all.map((x,i)=>`<div class="action-item"><div class="action-num">${i+1}</div><div class="action-when">${fmtDate(x.when)}</div><div class="action-main"><b>${x.title}</b><span>${x.sub}</span></div><span class="badge ${x.type}">${x.type==='tech'?'TECH':'KUŹNIA'}</span></div>`).join(''):'<div class="empty-state">Dodaj badania Tech lub sprawdź ustawienia Kuźni.</div>';
}
function renderTables(){
  $('#techTable').innerHTML=results.tech.map(x=>`<tr><td>${x.i}</td><td>${x.def.name}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td>${fmtDur(x.gap)}</td></tr>`).join('')||'<tr><td colspan="5">Brak Tech</td></tr>';
  $('#forgeTable').innerHTML=results.forge.map(x=>`<tr><td>${x.level}</td><td>${fmtDate(x.start)}</td><td>${fmtDate(x.end)}</td><td>${fmtDur(x.wait)}</td></tr>`).join('')||'<tr><td colspan="4">Brak Kuźni</td></tr>';
  let gaps=results.tech.filter(x=>x.gap>5*MIN).map(x=>{let fits=D.tech.map(t=>({t,d:techDur(t)})).filter(y=>y.d<=x.gap).sort((a,b)=>b.d-a.d).slice(0,3);return `<div class="gap-item"><b>${fmtDur(x.gap)} przed ${x.def.name}</b><p>${fits.length?fits.map(y=>`${y.t.name} (${fmtDur(y.d)})`).join(' • '):'Brak badania z tabeli, które się mieści.'}</p><small>Sugestia tylko czasowa — bez sprawdzania wymagań drzewka.</small></div>`}).join('');
  $('#gapSuggestions').innerHTML=gaps||'<div class="gap-item"><b>Brak większych wolnych okien</b><p>Plan Tech wykorzystuje czas dość ciasno.</p></div>';
}
function renderAll(){renderQueue();renderSummary();renderTimeline();renderActions();renderTables()}
function clock(){let n=new Date(),cfg=D.days[weekday(n)-1];$('#nowText').textContent=fmtDate(n);$('#gameDayText').textContent=`Dzień gry: ${cfg.name}`}
function hint(){let m=$('#forgeMode').value;$('#strategyHint').textContent=m==='hybrid'?'Czeka tylko, gdy strata progresu jest mała.':m==='progress'?'Każdy poziom startuje natychmiast.':'Zawsze czeka na środę lub piątek.'}

function init(){
  sync();clock();setInterval(clock,30000);
  $('#techSelect').innerHTML=D.tech.map(x=>`<option value="${x.name}">${x.name} • ${fmtDur(techDur(x))}</option>`).join('');
  renderQueue();hint();
  $('#forgeOngoing').addEventListener('change',toggleRemaining);
  $('#forgeMode').addEventListener('change',hint);
  $('#addTech').addEventListener('click',()=>{state.techQueue.push($('#techSelect').value);renderQueue();save()});
  $('#repeatTech').addEventListener('click',()=>{for(let i=0;i<5;i++)state.techQueue.push($('#techSelect').value);renderQueue();save()});
  $('#clearTech').addEventListener('click',()=>{state.techQueue=[];renderQueue();save()});
  $('#advancedBtn').addEventListener('click',()=>{$('#advanced').classList.toggle('open')});
  $('#recalculate').addEventListener('click',()=>calculate(true));
  $('#editSetup').addEventListener('click',()=>$('#setup').scrollIntoView({behavior:'smooth',block:'start'}));
}
init();
})();