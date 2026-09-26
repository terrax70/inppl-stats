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
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
 for(const route of ['/','/planner/','/share/','/knowledge/','/charts/']){
  await page.goto(base+route+'?lang=en');await page.waitForTimeout(800);
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('.language-switch [aria-current]').innerText(),'EN');
 }
 await page.goto(base+'/knowledge/?lang=en#items');await page.waitForTimeout(600);
 await page.locator('[data-forge="discount"]').fill('25');
 await page.locator('[data-forge="speed"]').fill('50');
 await page.locator('[data-forge="speed"]').blur();await page.waitForTimeout(250);
 await page.screenshot({path:path.join(root,'outputs/english-mobile.png'),fullPage:true});
 await page.locator('.language-switch a[lang="pl"]').click();await page.waitForTimeout(500);
 assert.equal(await page.locator('html').getAttribute('lang'),'pl');assert.equal(new URL(page.url()).hash,'#items');
 assert.equal(await page.locator('[data-forge="discount"]').inputValue(),'25');
 assert.equal(await page.locator('[data-forge="speed"]').inputValue(),'50');
 await page.locator('.language-switch a[lang="en"]').click();await page.waitForTimeout(500);
 assert.equal(await page.locator('[data-forge="discount"]').inputValue(),'25');
 const translations=await page.evaluate(()=>[INPPL_I18N.t('Łączny koszt:'),INPPL_I18N.t('data.js'),INPPL_I18N.locale]);
 assert.notEqual(translations[0],'Łączny koszt:');assert.equal(translations[1],'data.js');assert.equal(translations[2],'en-GB');
 await page.goto(base+'/planner/');await page.waitForTimeout(500);assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await page.locator('#forgeMode').selectOption('points');assert.equal(await page.locator('#forgeMode').inputValue(),'points');
 await page.goto(base+'/?lang=pl');assert.equal(await page.locator('html').getAttribute('lang'),'pl');
 assert.deepEqual(errors,[]);console.log('English: all pages, mobile, switching, persistence, hash links and option values OK');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

