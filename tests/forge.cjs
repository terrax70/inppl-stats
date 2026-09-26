// Run with Node.js and Playwright installed: node tests/smoke.cjs
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json'})[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const context=await browser.newContext();
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/knowledge/`);
 await page.locator('[data-tab="items"]').click();
 await page.locator('[data-forge="discount"]').fill('25');
 await page.locator('[data-forge="speed"]').fill('50');
 await page.getByText('Koszty i czasy wszystkich 35 poziomów',{exact:true}).click();
 assert.equal(await page.locator('[data-forge-rows] tr').count(),35);
 assert.match(await page.locator('[data-forge-rows] tr').nth(1).innerText(),/300/);
 assert.match(await page.locator('[data-forge-rows] tr').nth(1).innerText(),/3 min 20 s/);
 await page.locator('[data-forge="discount"]').fill('0');
 await page.locator('[data-forge="discount"]').fill('100');
 assert.equal(await page.locator('[data-forge-summary]').count(),0);
 assert.equal(await page.locator('[data-forge-rows] tr').nth(1).locator('td').first().innerText(),'0');
 await page.locator('[data-forge="discount"]').fill('25');
 for(const width of [360,390,760,1280]){
 await page.setViewportSize({width,height:850});
 await page.waitForTimeout(350);
 await page.locator('.forge-calculator').scrollIntoViewIfNeeded();
 const progression=page.locator('[data-system="items"] .rarity-svg');
 const natural=await progression.evaluate(svg=>svg.viewBox.baseVal.width);
 await page.locator('[data-system="items"] [data-rarity-zoom="auto"]').click();
 assert.ok(Math.abs((await progression.boundingBox()).width-Math.round(natural*(width<=760?.6:1)))<2);
 await page.locator('[data-system="items"] [data-rarity-zoom="0.3"]').click();
 assert.ok(Math.abs((await progression.boundingBox()).width-Math.round(natural*.3))<2);

 assert.equal(await page.locator('.forge-mobile-chart').count(),0);
 await page.locator('[data-system="items"] [data-chart-zoom="0.1"]').click();
 const chart=page.locator('.item-asc-chart svg');
 assert.ok((await chart.boundingBox()).width<width);
 const point=page.locator('.asc-chart-point[data-rarity="Medieval"]').first();
 await point.focus();
 const tip=page.locator('.item-asc-chart .chart-hover-tip');
 assert.match(await tip.innerText(),/300 Gold/);
 assert.match(await tip.innerText(),/3 min 20 s/);
 await page.locator('[data-forge="discount"]').fill('0');
 await page.locator('[data-forge="speed"]').fill('0');
 await point.focus();
 assert.match(await tip.innerText(),/400 Gold/);
 assert.match(await tip.innerText(),/5 min/);
 await page.locator('[data-forge="discount"]').fill('25');
 await page.locator('[data-forge="speed"]').fill('50');
 await page.locator('[data-system="items"] [data-chart-zoom="0.2"]').click();
 await chart.scrollIntoViewIfNeeded();
 await point.focus();
 await page.screenshot({path:`outputs/forge-zoom-${width}.png`});
 }
 await page.reload();
 assert.equal(await page.locator('.view.active').getAttribute('id'),'items');
 assert.equal(await page.locator('[data-forge="discount"]').inputValue(),'25');
 assert.equal(await page.locator('[data-forge="speed"]').inputValue(),'50');
 const reopened=await page.context().newPage();
 await reopened.goto(page.url());
 assert.equal(await reopened.locator('.view.active').getAttribute('id'),'items');
 assert.equal(await reopened.locator('[data-forge="speed"]').inputValue(),'50');
 await reopened.close();
 await page.evaluate(()=>{
   localStorage.setItem('inppl.knowledge.tab','"invalid"');
   localStorage.setItem('inppl.knowledge.forge','{"discount":200,"speed":-1}');
 });
 await page.goto(page.url().split('#')[0]);
 assert.equal(await page.locator('.view.active').getAttribute('id'),'start');
 await page.locator('[data-tab="items"]').click();
 assert.equal(await page.locator('[data-forge="discount"]').inputValue(),'0');
 assert.equal(await page.locator('[data-forge="speed"]').inputValue(),'0');
 await page.goto(page.url().split('#')[0]+'#pets');
 assert.equal(await page.locator('.view.active').getAttribute('id'),'pets');
 await page.goto(page.url().split('#')[0]+'#items');
 assert.equal(await page.locator('.view.active').getAttribute('id'),'items');
 // Opening/closing a mobile keyboard must not replace or blur either input.
 await page.setViewportSize({width:390,height:850});
 await page.waitForTimeout(350);
 for(const field of ['discount','speed']){
   const input=page.locator(`[data-forge="${field}"]`);
   await input.fill('2');
   const original=await input.elementHandle();
   await page.setViewportSize({width:390,height:480});
   await page.waitForTimeout(350);
   assert.ok(await original.evaluate(el=>el.isConnected&&document.activeElement===el));
   await page.keyboard.type('5');
   assert.equal(await input.inputValue(),'25');
   await page.setViewportSize({width:390,height:850});
   await page.waitForTimeout(350);
   assert.ok(await original.evaluate(el=>el.isConnected&&document.activeElement===el));
 }
 await page.reload();
 assert.equal(await page.locator('[data-forge="discount"]').inputValue(),'25');
 assert.equal(await page.locator('[data-forge="speed"]').inputValue(),'25');
 await page.locator('[data-tab="tech"]').click();
 assert.equal(new URL(page.url()).hash,'#tech');
 await page.reload();
 assert.equal(await page.locator('.view.active').getAttribute('id'),'tech');
 await page.goBack();
 assert.equal(await page.locator('.view.active').getAttribute('id'),'items');
 await page.goForward();
 assert.equal(await page.locator('.view.active').getAttribute('id'),'tech');
 for(const tab of ['pets','mounts','skills','items','ascension','tech','start']){
   await page.locator(`[data-tab="${tab}"]`).click();
   assert.equal(await page.locator('.view.active').getAttribute('id'),tab);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),tab+' overflows page');
 }
 await page.locator('[data-tab="items"]').click();
 await page.locator('[data-system="items"] [data-rarity-zoom="0.1"]').click();
 const smallPoint=page.locator('[data-system="items"] .rarity-svg .chart-point').first();
 await smallPoint.scrollIntoViewIfNeeded();
 await smallPoint.focus();
 const smallTip=page.locator('[data-system="items"] [data-chart="rarity"] .chart-hover-tip');
 assert.equal(await smallTip.evaluate(el=>getComputedStyle(el).position),'fixed');
 await page.keyboard.press('Escape');
 assert.equal(await smallTip.isVisible(),false);
 await smallPoint.blur();
 await smallPoint.focus();
 await page.locator('[data-system="items"] .system-head h2').click();
 assert.equal(await smallTip.isVisible(),false);
 const itemRoot=page.locator('.system-root[data-system="items"]');
 const card=itemRoot.locator('.rarity-assets article').first();
 await card.click();
 assert.ok(await card.evaluate(el=>el.classList.contains('selected-rarity')));
 await card.click();
 assert.equal(await itemRoot.locator('.selected-rarity').count(),0);
 await card.focus();
 await page.keyboard.press('Enter');
 assert.ok(await card.evaluate(el=>el.classList.contains('selected-rarity')));
 await page.keyboard.press('Enter');
 assert.equal(await itemRoot.locator('.selected-rarity').count(),0);
 await smallPoint.dispatchEvent('click');
 assert.ok(await smallPoint.evaluate(el=>el.classList.contains('selected-rarity')));
 await smallPoint.dispatchEvent('click');
 assert.equal(await itemRoot.locator('.selected-rarity').count(),0);
 await page.locator('[data-tab="skills"]').click();
 const skillRoot=page.locator('[data-system="skills"]');
 const discount=page.locator('[data-skill-discount]');
 for(const [value,expected] of [['0',[0,1200,9200,49600,142000,269600]],['25',[0,900,6900,37200,106500,202200]],['100',[0,0,0,0,0,0]]]){
   await discount.fill(value);
   for(const [index,rarity] of ['Common','Rare','Epic','Legendary','Ultimate','Mythic'].entries()){
     const points=skillRoot.locator(`.chart-point[data-rarity="${rarity}"]`);
     assert.equal(await points.count(),5);
     for(const point of await points.all()){
       const tip=(await point.getAttribute('data-tip')).replace(/\s/g,'');
       assert.ok(tip.includes(`${expected[index]}SkillTickets`),tip);
     }
   }
 }
 await discount.fill('25');
 await page.reload();
 assert.equal(await discount.inputValue(),'25');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('inppl.knowledge.forge')).discount),25);
 await discount.focus();
 const skillInput=await discount.elementHandle();
 await page.setViewportSize({width:390,height:480});
 await page.waitForTimeout(350);
 assert.ok(await skillInput.evaluate(el=>el.isConnected&&document.activeElement===el));
 const skillPoint=skillRoot.locator('.asc-chart-point[data-rarity="Legendary"]').first();
 await skillPoint.dispatchEvent('click');
 assert.match((await skillRoot.locator('[data-chart="asc"] .chart-hover-tip').innerText()).replace(/\s/g,''),/37200SkillTickets/);
 await page.locator('[data-tab="pets"]').click();
 const petRoot=page.locator('[data-system="pets"]');
 const extraDrop=page.locator('[data-pet-extra-drop]');
 for(const [value,expected] of [['0',[0,1400,5400,48600,90000,147500]],['2',[0,1373,5294,47647,88235,144608]],['50',[0,933,3600,32400,60000,98333]]]){
   await extraDrop.fill(value);
   for(const [index,rarity] of ['Common','Rare','Epic','Legendary','Ultimate','Mythic'].entries()){
     const points=petRoot.locator(`.chart-point[data-rarity="${rarity}"]`);
     assert.equal(await points.count(),5);
     for(const point of await points.all())assert.ok((await point.getAttribute('data-tip')).replace(/\s/g,'').includes(`${expected[index]}Eggshells`));
   }
 }
 await extraDrop.fill('-1');
 assert.equal(await extraDrop.evaluate(el=>el.validity.valid),false);
 await page.reload();
 assert.equal(await extraDrop.inputValue(),'50');
 await extraDrop.focus();
 const petInput=await extraDrop.elementHandle();
 await page.setViewportSize({width:390,height:350});
 await page.waitForTimeout(350);
 assert.ok(await petInput.evaluate(el=>el.isConnected&&document.activeElement===el));
 const petPoint=petRoot.locator('.asc-chart-point[data-rarity="Legendary"]').first();
 await petPoint.dispatchEvent('click');
 assert.match((await petRoot.locator('[data-chart="asc"] .chart-hover-tip').innerText()).replace(/\s/g,''),/32400Eggshells/);
 await page.locator('[data-tab="mounts"]').click();
 const mountRoot=page.locator('[data-system="mounts"]');
 const mountDiscount=page.locator('[data-mount="discount"]');
 const mountExtra=page.locator('[data-mount="extraDrop"]');
 for(const [discountValue,extraValue,expected] of [['0','0',[0,14000,30000,46000,63000,79000]],['1','2',[0,13588,29118,44647,61147,76676]],['25','50',[0,7000,15000,23000,31500,39500]],['25','0',[0,10500,22500,34500,47250,59250]],['0','50',[0,9333,20000,30667,42000,52667]],['100','50',[0,0,0,0,0,0]]]){
   await mountDiscount.fill(discountValue);await mountExtra.fill(extraValue);
   for(const [index,rarity] of ['Common','Rare','Epic','Legendary','Ultimate','Mythic'].entries()){
     const points=mountRoot.locator(`.chart-point[data-rarity="${rarity}"]`);
     assert.equal(await points.count(),5);
     for(const point of await points.all())assert.ok((await point.getAttribute('data-tip')).replace(/\s/g,'').includes(`${expected[index]}Clockwinders`));
   }
 }
 await mountDiscount.fill('25');
 await mountExtra.fill('-1');
 assert.equal(await mountExtra.evaluate(el=>el.validity.valid),false);
 await page.reload();
 assert.equal(await mountDiscount.inputValue(),'25');assert.equal(await mountExtra.inputValue(),'50');
 for(const [input,height] of [[mountDiscount,450],[mountExtra,350]]){
   await input.focus();const handle=await input.elementHandle();
   await page.setViewportSize({width:390,height});await page.waitForTimeout(350);
   assert.ok(await handle.evaluate(el=>el.isConnected&&document.activeElement===el));
 }
 await mountRoot.locator('.asc-chart-point[data-rarity="Epic"]').first().dispatchEvent('click');
 assert.match((await mountRoot.locator('[data-chart="asc"] .chart-hover-tip').innerText()).replace(/\s/g,''),/15000Clockwinders/);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);
 for(const tab of ['items','pets','skills','mounts']){
   await page.locator(`[data-tab="${tab}"]`).click();
   const root=page.locator(`[data-system="${tab}"]`);
   const svg=root.locator('[data-chart="asc"] svg');
   await root.locator('[data-chart-zoom="auto"]').click();
   const autoWidth=(await svg.boundingBox()).width;
   await root.locator('[data-chart-zoom="0.6"]').click();
   assert.equal((await svg.boundingBox()).width,autoWidth,tab+' mobile AUTO equals 60%');
   await root.locator('[data-chart-zoom="auto"]').click();
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.screenshot({path:`outputs/development-${tab}-mobile.png`,fullPage:true});
 }
 await page.locator('[data-tab="skills"]').click();
 assert.equal(await page.locator('.skill-grid').isVisible(),false);
 await page.locator('.skill-examples summary').click();
 assert.equal(await page.locator('.skill-grid').isVisible(),true);
 await page.locator('.skill-examples summary').click();
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(350);
 await page.locator('[data-tab="items"]').click();
 await page.locator('[data-system="items"] .system-head').scrollIntoViewIfNeeded();
 await page.screenshot({path:'outputs/development-desktop.png'});
 assert.equal(await page.locator('.item-sprite').count(),30);
 await page.setViewportSize({width:1800,height:1000});await page.waitForTimeout(350);
 await page.locator('[data-system="items"] .rarity-assets').screenshot({path:'outputs/item-sprites.png'});

 for(const system of ['items','pets','skills','mounts']){
   await page.locator(`[data-tab="${system}"]`).click();
   const systemRoot=page.locator(`[data-system="${system}"]`);
   const point=systemRoot.locator('.asc-chart-point[data-asc="1"]').last();
   const rarity=await point.getAttribute('data-rarity');
   // Start with no selection, including any persisted in-memory selection.
   if(await point.evaluate(el=>el.classList.contains('selected-rarity')))await point.dispatchEvent('click');
   await point.dispatchEvent('click');
   assert.ok(await point.evaluate(el=>el.classList.contains('selected-rarity')),system);
   assert.ok(await systemRoot.locator(`.rarity-assets article[data-rarity="${rarity}"]`).evaluate(el=>el.classList.contains('selected-rarity')));
   assert.ok(await systemRoot.locator('[data-chart="asc"] .chart-hover-tip').isVisible());
   await point.dispatchEvent('click');
   assert.equal(await systemRoot.locator('.selected-rarity').count(),0,system);
 }
 await page.locator('[data-tab="items"]').click();
 const rotating=page.locator('[data-system="items"] .artwork-rotation').first();
 await rotating.scrollIntoViewIfNeeded();
 await page.waitForTimeout(250);
 assert.ok(await rotating.evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running')));
 await page.locator('[data-system="items"] [data-artwork-toggle]').click();
 assert.ok(await rotating.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
 await page.reload();
 assert.equal(await page.locator('[data-system="items"] [data-artwork-toggle]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-system="items"] [data-artwork-toggle]').click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.querySelector('[data-system="items"] [data-artwork-toggle]').disabled);
 assert.equal(await page.locator('[data-system="items"] [data-artwork-toggle]').isDisabled(),true);
 assert.equal(await rotating.locator('.artwork-frame').first().evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>!document.querySelector('[data-system="items"] [data-artwork-toggle]').disabled);
 // Inspect all item variants without changing production artwork or animation timing.
 await page.addStyleTag({content:'.artwork-frame{position:relative!important;opacity:1!important}.rarity-assets .artwork-rotation{height:270px!important}.artwork-frame{height:90px!important}'});
 await page.locator('[data-system="items"] .rarity-assets').screenshot({path:'outputs/item-rotation-variants.png'});
 assert.deepEqual(errors,[]);console.log('Forge calculator: 35 rows, reference costs, speed, boundaries, responsive layouts OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

