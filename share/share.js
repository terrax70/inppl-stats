(()=>{
const D=window.INPPL_DATA,$=s=>document.querySelector(s);
let showWarAll=false,showPowerAll=false;
const fmtK=n=>`${Math.round((Number(n)||0)/1000)}k`;
const fmtPct=n=>`${n>=0?'+':''}${Math.round(n)}%`;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const medal=i=>i===0?'👑':i===1?'🥈':i===2?'🥉':i<9?'⭐':'🔥';
const weekNo=w=>{const m=String(w||'').match(/\d+/);return m?Number(m[0]):w};
const resultText=w=>w?.result==='win'?'WYGRANA':w?.result==='loss'?'PRZEGRANA':(w?.resultLabel||'BRAK WYNIKU');
function selectedWeek(){return D.weeks.find(w=>w.week===$('#weekSelect').value)||D.weeks.at(-1)}
function limit(){return Number($('#limitSelect').value)||15}
function warRows(){
 const w=selectedWeek(),threshold=(Number($('#warThreshold').value)||0)*1000;
 let rows=(w?.entries||[]).slice().sort((a,b)=>b.points-a.points);
 if(!showWarAll)rows=rows.filter(x=>x.points>=threshold);
 return rows.slice(0,limit());
}
function powerRows(){
 const w=selectedWeek(),threshold=Number($('#powerThreshold').value)||0;
 let rows=D.players.map(p=>{
   const i=p.powers?.findIndex(x=>x.week===w.week)??-1;if(i<0)return null;
   const cur=p.powers[i],prev=i>0?p.powers[i-1]:null;
   if(!prev||!prev.powerM)return null;
   const pct=cur.growthPct??((cur.powerM-prev.powerM)/prev.powerM*100);
   return{nick:p.nick,pct,powerM:cur.powerM};
 }).filter(Boolean).sort((a,b)=>b.pct-a.pct);
 if(!showPowerAll)rows=rows.filter(x=>x.pct>=threshold);
 return rows.slice(0,limit());
}
function warText(){
 const w=selectedWeek(),rows=warRows(),threshold=Number($('#warThreshold').value)||0;
 return [`🏆 WOJNA NR ${weekNo(w.week)} — ${resultText(w)}`,showWarAll?'Topka graczy:':`Topka graczy (powyżej ${threshold}k punktów):`,'',...rows.map((x,i)=>`${medal(i)} ${i+1}. ${x.nick} — ${fmtK(x.points)}`)].join('\n');
}
function powerText(){
 const w=selectedWeek(),rows=powerRows(),threshold=Number($('#powerThreshold').value)||0;
 return [`🏆 WOJNA NR ${weekNo(w.week)} — ${resultText(w)}`,showPowerAll?'Zaktualizowana moc graczy — Topka wzrostu:':`Zaktualizowana moc graczy — Topka wzrostu (powyżej +${threshold}%):`,'',...rows.map((x,i)=>`${medal(i)} ${i+1}. ${x.nick} — ${fmtPct(x.pct)}`)].join('\n');
}
function rankHtml(rows,type){return rows.map((x,i)=>`<div class="rank-row"><div class="rank-place">${medal(i)}</div><div class="rank-name">${i+1}. ${esc(x.nick)}</div><div class="rank-value ${type}-value">${type==='war'?fmtK(x.points):fmtPct(x.pct)}</div></div>`).join('')||'<div class="rank-row"><div></div><div class="rank-name">Brak graczy spełniających próg.</div><div></div></div>'}
function render(){
 const w=selectedWeek();
 $('#warSub').textContent=`${w.week} • ${resultText(w)} • ${w.date||''}`;
 $('#powerSub').textContent=`Snapshot ${w.week} • wzrost vs poprzedni dostępny snapshot`;
 const wr=warRows(),pr=powerRows();
 $('#warRank').innerHTML=rankHtml(wr,'war');$('#powerRank').innerHTML=rankHtml(pr,'power');
 $('#warPreview').textContent=warText();$('#powerPreview').textContent=powerText();
 $('#toggleWarAll').textContent=showWarAll?'Użyj progu':'Pokaż wszystkich';
 $('#togglePowerAll').textContent=showPowerAll?'Użyj progu':'Pokaż wszystkich';
}
async function copy(text){
 try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
 const t=$('#toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1300);
}
function init(){
 $('#weekSelect').innerHTML=D.weeks.slice().reverse().map(w=>`<option value="${esc(w.week)}">Wojna ${weekNo(w.week)} • ${esc(w.week)} • ${resultText(w)}</option>`).join('');
 $('#weekSelect').value=D.weeks.at(-1)?.week||'';
 ['weekSelect','limitSelect','warThreshold','powerThreshold'].forEach(id=>{$('#'+id).addEventListener('input',render);$('#'+id).addEventListener('change',render)});
 $('#toggleWarAll').onclick=()=>{showWarAll=!showWarAll;render()};$('#togglePowerAll').onclick=()=>{showPowerAll=!showPowerAll;render()};
 $('#copyWar').onclick=()=>copy(warText());$('#copyPower').onclick=()=>copy(powerText());
 render();
}
init();
})();
