const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const c=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../google-sheets/Importer.gs'),'utf8'),c);
const roster=[{nick:'GR3LU',row:6,value:'',formula:''},{nick:'ArKenZo',row:41,value:'',formula:''},
 {nick:'ByłyGracz',row:65,value:'',formula:''},{nick:'Zero',row:8,value:0,formula:''},
 {nick:'Formuła',row:9,value:5,formula:'=SUM(A1:A3)'}];
let rows=c.inpplMatch([{nick:' ArkenZo ',value:617},{nick:'GR3LU',value:0},{nick:'ByłyGracz',value:3},{nick:'Nowy',value:4}],roster,[]);
assert.deepEqual(Array.from(rows,r=>r.status),['Do zapisu','Do zapisu','Do zapisu','Brak dopasowania']);
assert.equal(rows[0].target.row,41);assert.equal(rows[2].target.row,65);
assert.equal(c.inpplMatch([{nick:'OldName',value:3}],roster,[['OldName','GR3LU']])[0].target.row,6);
assert.equal(c.inpplMatch([{nick:'Zero',value:0}],roster,[])[0].status,'Już zapisane');
assert.match(c.inpplMatch([{nick:'Zero',value:2}],roster,[])[0].status,/Konflikt/);
assert.match(c.inpplMatch([{nick:'Formuła',value:2}],roster,[])[0].status,/formułę/);
rows=c.inpplMatch([{nick:'GR3LU',value:2},{nick:'gr3lu',value:''}],roster,[]);
assert.ok(rows.every(r=>r.status==='Powtórzony gracz w imporcie'));
assert.match(c.inpplMatch([{nick:'GR3LU',value:2}],[...roster,roster[0]],[])[0].status,/Powtórzony/);
assert.throws(()=>c.inpplMatch([],roster,[['GR3LU','Zero']]));
assert.equal(c.inpplNumber('1 234,5'),1234.5);assert.equal(c.inpplNumber(''),null);
assert.equal(c.inpplNumber('=123'),null);assert.equal(c.inpplNumber(-2),null);
console.log('Google importer: matching, aliases, former members, duplicates, blanks, zeros, conflicts and formulas passed.');
