import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const here=new URL('.',import.meta.url);
const meta=JSON.parse(await fs.readFile(new URL('source.json',here),'utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load('C:/Users/Terra/Downloads/InPost [INPPL] Ranking (1).xlsx'));
const ranking=wb.worksheets.getItem('Ranking');
const input=wb.worksheets.add('Wpisy'), aliases=wb.worksheets.add('Nicki'), summary=wb.worksheets.add('Podgląd tygodnia');
const first=8,last=2007,aliasLast=307;
const letters=['D','E','F','G','H'],keys=['M','N','O','P','Q'];
const q=s=>'"'+String(s).replaceAll('"','""')+'"';
const escape=x=>`SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(${x},"~","~~"),"*","~*"),"?","~?")`;
const range=(col)=>`'Wpisy'!$${col}$${first}:$${col}$${last}`;
const headerColor='#232323';
function base(sheet,end,widths){
  sheet.showGridLines=false;
  sheet.getRange(`A1:${end}`).format.font={name:'Arial',size:10,color:'#202020'};
  widths.forEach((w,i)=>sheet.getRangeByIndexes(0,i,1,1).format.columnWidth=w);
  sheet.freezePanes.freezeRows(7);
}
function title(sheet,text){sheet.getRange('A2').values=[[text]];sheet.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#202020'};}
function header(sheet,address,values){sheet.getRange(address).values=[values];sheet.getRange(address).format={fill:headerColor,font:{name:'Arial',size:10,bold:true,color:'#ffffff'},rowHeight:32,wrapText:true};}
function note(sheet,cell,text){sheet.getRange(cell).values=[[text]];sheet.getRange(cell).format.font={name:'Arial',size:10,color:'#595959'};}
base(input,`Q${last}`,[12,15,24,16,14,16,19,17,36,24,30,28,25,25,25,25,25]);
title(input,'Wpisy graczy');
note(input,'A3','Dopisuj nowe dane pod historią. Kolejność graczy nie ma znaczenia. Nie kasuj wcześniejszych wpisów.');
note(input,'A4',`Żółte A:H: wpisujesz. Szare J:Q: formuły. Przygotowano ${last-first+1} wierszy; dalej kopiuj formuły J:Q.`);
note(input,'A5','Jeden wynik danego rodzaju na nick i tydzień. Puste = brak danych; 0 = rzeczywisty wynik zero.');
note(input,'A6','Historia: InPost [INPPL] Ranking (1).xlsx. Dotacje: Tech_Tree_Donations_AllTime_2026-09-13.xlsx.');
header(input,'A7:Q7',['Tydzień','Data (opcjonalna)','Nick z listy','Punkty wojenne','Pozycja wojny','Moc (mln)','Dotacje All Time','Pozycja dotacji','Źródło / uwagi','Nick dopasowany','Status','Gracz i tydzień','Klucz punktów','Klucz pozycji','Klucz mocy','Klucz dotacji','Klucz poz. dotacji']);
const rows=meta.entries.map(r=>r.map((v,i)=>i===1&&v?new Date(v+'T12:00:00Z'):v));
input.getRange(`A8:I${7+rows.length}`).values=rows;
input.getRange(`A8:H${last}`).format.fill='#FFF7D6';
input.getRange(`J8:Q${last}`).format.fill='#F1F1F1';
input.getRange(`B8:B${last}`).setNumberFormat('yyyy-mm-dd');
input.getRange(`D8:E${last}`).setNumberFormat('#,##0');
input.getRange(`F8:F${last}`).setNumberFormat('#,##0.00');
input.getRange(`G8:H${last}`).setNumberFormat('#,##0');
input.getRange(`A8:A${last}`).dataValidation={rule:{type:'list',values:Array.from({length:104},(_,i)=>`W${i+1}`)}};
for(const col of letters)input.dataValidations.add({range:`${col}8:${col}${last}`,rule:{type:'decimal',operator:'greaterThanOrEqual',formula1:0}});
base(aliases,`C${aliasLast}`,[27,28,30]);title(aliases,'Nicki i zmiany nazw');
note(aliases,'A3','Kolumna A: nick ze źródła. Kolumna B: stała nazwa gracza, używana w Rankingu.');
note(aliases,'A4','Przy zmianie nicku dopisz nowy alias pod listą i wskaż tę samą nazwę w B.');
note(aliases,'A5','DAFTHELM99 i Iamuk wymagają potwierdzenia. Nie przypisano ich do podobnych nazw.');
note(aliases,'A6','Nowy gracz: dopisz A/B i dodaj jego wiersz w Rankingu lub w Podglądzie tygodnia.');
header(aliases,'A7:C7',['Nick ze źródła','Stała nazwa gracza','Klucz nicku']);
aliases.getRange(`A8:B${7+meta.roster.length}`).values=meta.roster.map(p=>[p.nick,p.nick]);
aliases.getRange(`A8:B${aliasLast}`).format.fill='#FFF7D6';
aliases.getRange(`C8:C${aliasLast}`).format.fill='#F1F1F1';
aliases.getRange(`C8:C${aliasLast}`).formulas=Array.from({length:aliasLast-7},(_,i)=>[`=IF(A${i+8}="","",UPPER(TRIM(A${i+8})))`]);
const forms=[];
for(let r=first;r<=last;r++){
  const nickKey=escape(`UPPER(TRIM(C${r}))`);
  const match=`COUNTIFS('Nicki'!$C$8:$C$${aliasLast},${nickKey})`;
  const resolved=`IF(C${r}="","",IF(${match}<>1,"",INDEX('Nicki'!$B$8:$B$${aliasLast},MATCH(${nickKey},'Nicki'!$C$8:$C$${aliasLast},0))))`;
  const duplicate=keys.map(k=>`AND(${k}${r}<>"",COUNTIFS($${k}$8:$${k}$${last},${escape(k+r)})>1)`).join(',');
  const invalid=letters.map(c=>`AND(${c}${r}<>"",OR(NOT(ISNUMBER(${c}${r})),IF(ISNUMBER(${c}${r}),${c}${r}<0,FALSE)))`).join(',');
  const status=`IF(COUNTA(A${r}:I${r})=0,"",IF(C${r}="","Brak nicku",IF(J${r}="","Sprawdź nick w Nicki",IF(A${r}="","Brak tygodnia",IF(OR(${invalid}),"Nieprawidłowa liczba",IF(OR(${duplicate}),"Powtórzony wynik",IF(COUNT(D${r}:H${r})=0,"Brak wartości","OK")))))))`;
  const key=`IF(OR(J${r}="",A${r}=""),"",UPPER(TRIM(J${r}))&"|"&UPPER(TRIM(A${r})))`;
  forms.push(['='+resolved,'='+status,'='+key,...letters.map(c=>`=IF(AND(L${r}<>"",${c}${r}<>""),L${r},"")`)]);
}
input.getRange(`J8:Q${last}`).formulas=forms;
input.getRange(`K8:K${last}`).conditionalFormats.add('expression',{formula:'AND(K8<>"",K8<>"OK")',format:{fill:'#FCE4D6',font:{color:'#9C0006',bold:true}}});
function lookup(nick,week,metric,fallback='""'){
  const key=escape(`UPPER(TRIM(${nick}))&"|"&${week}`),i=metric-3;
  const count=`COUNTIFS(${range(keys[i])},${key})`;
  const found=`MATCH(${key},${range(keys[i])},0)`;
  const val=`INDEX(${range(letters[i])},${found})`;
  // Missing stays blank/text; duplicate or nonnumeric input stays visibly unavailable.
  return `=IF(${nick}="","",IF(${count}=0,${fallback},IF(${count}>1,NA(),IF(ISNUMBER(${val}),IF(${val}>=0,${val},NA()),NA()))))`;
}
const edited=new Set();
for(const cell of meta.original){
  const fallback=typeof cell.value==='string'?q(cell.value):'""';
  ranking.getRange(cell.cell).formulas=[[lookup(`$P${cell.row}`,q(cell.week),cell.metric,fallback)]];edited.add(cell.cell);
}
// Complete the already prepared power columns W14-W16 without shifting the layout.
for(const [week,pct,power] of [['W14','AJ','AK'],['W15','AL','AM'],['W16','AN','AO']]){
  ranking.getRange(pct+'5').values=[['%']];ranking.getRange(power+'5').values=[['Moc']];
  for(const p of meta.roster){ranking.getRange(power+p.row).formulas=[[lookup('$P'+p.row,q(week),5)]];edited.add(power+p.row);}
}
// Growth is available only when both snapshots exist and the denominator is positive.
const powerCols=['Q','S','U','W','Y','AA','AC','AE','AG','AI','AK','AM','AO'];
const pctCols=['R','T','V','X','Z','AB','AD','AF','AH','AJ','AL','AN'];
for(const p of meta.roster){
  for(let i=0;i<pctCols.length;i++){
    const a=powerCols[i]+p.row,b=powerCols[i+1]+p.row;
    ranking.getRange(pctCols[i]+p.row).formulas=[[`=IF(AND(ISNUMBER(${a}),ISNUMBER(${b})),IF(${a}>0,(${b}-${a})/${a},""),"")`]];
    ranking.getRange(pctCols[i]+p.row).setNumberFormat('0.0%');edited.add(pctCols[i]+p.row);
  }
}
const pointCols=meta.columns.filter(c=>c.metric===3).map(c=>c.letter);
for(const p of meta.roster){
  if(p.row>55)continue;
  const refs=pointCols.map(c=>c+p.row).join(',');
  ranking.getRange('A'+p.row).formulas=[[`=IF(COUNT(${refs})=0,"",AVERAGE(${refs}))`]];
  ranking.getRange('B'+p.row).formulas=[[`=IF(COUNT(${refs})=0,"",SUM(${refs}))`]];
  ranking.getRange('C'+p.row).formulas=[[`=IF(B${p.row}="","",COUNTIFS($B$6:$B$55,">"&B${p.row})+1)`]];
  for(const c of ['A','B','C'])edited.add(c+p.row);
}
base(summary,'I307',[25,18,18,16,18,20,18,18,24]);
title(summary,'Podgląd tygodnia');
summary.getRange('A4:B4').values=[['Wybrany tydzień','W13']];summary.getRange('B4').format.fill='#FFF7D6';
summary.getRange('B4').dataValidation={rule:{type:'list',values:Array.from({length:104},(_,i)=>`W${i+1}`)}};
note(summary,'A3','Zmień B4. Wyniki pochodzą z Wpisów; kolejność wpisanych list nie wpływa na dopasowanie.');
note(summary,'A5','Dotacje to stan All Time, nie wynik tygodniowy. #N/A oznacza duplikat albo błędną wartość we Wpisach.');
note(summary,'A6','Ranking zachowuje W1–W17. Ten podgląd obsługuje również kolejne tygodnie. Nowe nicki dopisuj w A.');
header(summary,'A7:H7',['Stała nazwa gracza','Status w składzie','Punkty wojenne','Pozycja wojny','Moc (mln)','Dotacje All Time','Pozycja dotacji','Wyników w tygodniu']);
summary.getRange(`A8:B${7+meta.roster.length}`).values=meta.roster.map(p=>[p.nick,p.row<=55?'W klanie':'Poza klanem']);
summary.getRange('A8:B307').format.fill='#FFF7D6';
summary.getRange('C8:H307').formulas=Array.from({length:300},(_,i)=>{
  const r=i+8;return [...[3,4,5,6,7].map(m=>lookup('$A'+r,'$B$4',m)),`=IF(A${r}="","",COUNT(C${r}:G${r}))`];
});
summary.getRange('C8:D307').setNumberFormat('#,##0');summary.getRange('E8:E307').setNumberFormat('#,##0.00');summary.getRange('F8:G307').setNumberFormat('#,##0');
console.log('Authored; calculating');wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Wpisy!A8:K11',include:'values,formulas',tableMaxRows:4,tableMaxCols:11,maxChars:1800})).ndjson);
// Historical numeric data must survive the conversion to keyed formulas exactly.
let checked=0;
for(const c of meta.original){if(typeof c.value==='number'){const got=ranking.getRange(c.cell).values[0][0];assert.ok(typeof got==='number'&&Math.abs(got-c.value)<1e-7,`${c.cell}: ${got} != ${c.value}`);checked++;}}
console.log('Preserved numeric historical cells:',checked);
// Controlled edits verify the actual formula engine, then restore.
const testRow=7+rows.length+1;
input.getRange(`A${testRow}:H${testRow}`).values=[['W14',null,' gr3lu ',123456,1,1500,null,null]];
assert.equal(ranking.getRange('BP6').values[0][0],123456);
assert.equal(ranking.getRange('AK6').values[0][0],1500);
input.getRange(`D${testRow}`).values=[[0]];assert.equal(ranking.getRange('BP6').values[0][0],0);
input.getRange(`D${testRow}`).values=[[null]];assert.equal(ranking.getRange('BP6').values[0][0],'');
input.getRange(`D${testRow}`).values=[[123456]];
input.getRange(`A${testRow+1}:D${testRow+1}`).values=[['W14',null,'GR3LU',7]];
assert.equal(input.getRange(`K${testRow}`).values[0][0],'Powtórzony wynik');
input.getRange(`A${testRow}:I${testRow+1}`).clear({applyTo:'contents'});
aliases.getRange('A100:B100').values=[['NowyNickTest','GR3LU']];
input.getRange(`A${testRow}:D${testRow}`).values=[['W14',null,'NowyNickTest',765432]];
assert.equal(ranking.getRange('BP6').values[0][0],765432);
aliases.getRange('A100:B100').clear({applyTo:'contents'});input.getRange(`A${testRow}:I${testRow}`).clear({applyTo:'contents'});
summary.getRange('B4').values=[['W12']];assert.equal(summary.getRange('F8').values[0][0],meta.entries.find(r=>r[2].toLowerCase()==='gr3lu'&&r[6]!=null)?.[6]);
summary.getRange('B4').values=[['W13']];wb.recalculate();
console.log('Input changes, zero, missing values, duplicate, alias and selector verified.');
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!',options:{useRegex:true,maxResults:15},maxChars:1800,summary:'Formula errors after restoring test data'})).ndjson);
for(const [sheetName,range,name] of [['Wpisy','A2:H13','wpisy'],['Nicki','A2:C14','nicki'],['Podgląd tygodnia','A2:H16','podglad'],['Ranking','N1:W12','ranking'],['TEST','K1:P10','test'],['Przydzial rang','A1:F10','rangi'],['Moc','A1:G10','moc']]){
  const blob=await wb.render({sheetName,range,scale:1,format:'png'});await fs.writeFile(new URL(name+'.png',here),new Uint8Array(await blob.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(fileURLToPath(new URL('INPPL_Ranking_automatyczny.xlsx',here)));
await fs.writeFile(new URL('edited.json',here),JSON.stringify([...edited]));
console.log('Workbook exported.');
