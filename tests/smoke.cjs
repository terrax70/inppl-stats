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
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({timezoneId:'Europe/Warsaw'});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/', '/share/', '/planner/', '/knowledge/', '/charts/']) {
      await page.goto(base + route);
      await page.waitForTimeout(1500);
      assert.deepEqual(errors.splice(0), [], route);
      console.log(route, 'OK');
    }
    await page.goto(base);
    await page.waitForSelector('#topFive button');
    for (const view of ['warsView','playersView','outcastsView','power','compare','overview']) {
      await page.locator(`[data-view="${view}"]`).click();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('.view.active').getAttribute('id'), view);
    }
    assert.deepEqual(errors, []);
    console.log('All main views rendered.');
    await page.locator('[data-view="playersView"]').click();
    await page.locator('#playersTable [data-profile]').first().click();
    await page.locator('#profile th[data-sort="points"]').click();
    await page.locator('#profileBack').click();
    assert.equal(await page.locator('.view.active').getAttribute('id'), 'playersView');
    await page.evaluate(() => {
      const p = window.INPPL_DATA.players.find(p => p.active !== false);
      p.nick = `O'Brien "<test>" \\`;
      renderPlayers();
    });
    await page.locator('#playersTable [data-profile]').filter({hasText: "O'Brien"}).click();
    assert.equal(await page.locator('#profileName').textContent(), `O'Brien "<test>" \\`);
    await page.locator('[data-view="power"]').click();
    await page.locator('[data-view="compare"]').click();
    await page.goBack();
    await page.waitForSelector('#power.active');
    await page.evaluate(() => { location.hash = '#warsView'; });
    await page.waitForSelector('#warsView.active');
    assert.deepEqual(errors.splice(0), []);
    for (const route of ['/', '/share/', '/planner/']) {
      await page.setViewportSize({width: 390, height: 844});
      await page.goto(base + route);
      await page.waitForFunction(() => Boolean(window.INPPL_DATA));
      await page.waitForTimeout(300);
      assert.deepEqual(errors.splice(0), [], 'Mobile ' + route);
    }
    await page.goto(base + '/share/');
    await page.waitForFunction(() => document.querySelector('#warSub').textContent.includes('PRZEGRANA'));
    assert.match(await page.locator('#warSub').textContent(), /W13/);
    await page.clock.setFixedTime(new Date('2026-09-24T22:29:00+02:00'));
    await page.goto(base + '/planner/');
    await page.waitForSelector('#techTable tr', {state:'attached'});
    await page.locator('#techSelect').selectOption('V 1/5');
    await page.locator('#reactionMinutesQuick').fill('60');
    const collections=[];
    for(const speed of ['91','92','93']){
      await page.locator('#researchSpeed').fill(speed);
      await page.waitForTimeout(250);
      const value=await page.locator('#techTable tr').first().locator('td').nth(3).textContent();
      assert.match(value,/26\.09/);
      collections.push(`${speed}%: ${value}`);
    }
    console.log('Browser screenshot settings:',collections.join(', '));
    assert.deepEqual(errors.splice(0), []);
    await page.route('**/data.js?*', route => route.abort());
    await page.goto(base + '/share/');
    await page.waitForSelector('[role="alert"]');
    console.log('Profile, navigation, mobile and data failure regressions passed.');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
