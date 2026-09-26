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
 const page=await browser.newPage();const texts=new Set();
 async function collect(){for(const text of await page.evaluate(()=>{
 const names=new Set((window.INPPL_DATA?.players||[]).map(p=>p.nick));
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const out=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('script,style,option')&&!names.has(node.textContent.trim())){const t=node.textContent.replace(/\s+/g,' ').trim();if(/[a-zA-Ząćęłńóśźż]/.test(t))out.push(t);}
 for(const el of document.querySelectorAll('[title],[placeholder],[aria-label],option'))for(const attr of ['title','placeholder','aria-label'])if(el.getAttribute(attr))out.push(el.getAttribute(attr));
 for(const el of document.querySelectorAll('option'))if(!names.has(el.textContent))out.push(el.textContent);
 return out;
 }))texts.add(text);}
 try{
 for(const route of ['/','/planner/','/share/','/knowledge/','/charts/']){
 await page.goto(`http://127.0.0.1:${server.address().port}${route}?lang=en`);await page.waitForTimeout(route==='/charts/'?4000:700);await collect();
 if(route==='/')for(const id of ['warsView','playersView','outcastsView','power','compare']){await page.locator(`[data-view="${id}"]`).click();await collect();}
 if(route==='/charts/'){for(const button of await page.locator('.node').all()){await button.click();await collect();await page.locator('#closeBtn').click();}}
 if(route==='/planner/'){for(const mode of ['progress','hybrid','points']){await page.locator('#forgeMode').selectOption(mode);await collect();}await page.locator('#forgeOngoing').check({force:true});await collect();}
 if(route==='/'){await page.locator('[data-view="playersView"]').click();await page.locator('#playersTable [data-profile]').first().click();await collect();}

 if(route==='/knowledge/')for(const id of ['pets','mounts','skills','items','ascension','tech']){await page.locator(`[data-tab="${id}"]`).click();await collect();}
 }
 fs.writeFileSync(path.join(root,'outputs/i18n-english.json'),JSON.stringify([...texts].sort(),null,2));console.log(texts.size+' strings');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});

