const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
process.env.TZ = 'Europe/Warsaw';
const root = path.resolve(__dirname, '..');
const context = vm.createContext({window: {}, Date, console,
  localStorage: {getItem: () => null, setItem: () => {throw Error('Storage blocked');}}});
vm.runInContext(fs.readFileSync(path.join(root, 'planner/game-data.js'), 'utf8'), context);
const source = fs.readFileSync(path.join(root, 'planner/planner.js'), 'utf8')
  .replace('init();\n})();', 'window.test={state,nextTechSlot,nextBoundary,isQuiet,isTechDay,save,calcTech};\n})();');
vm.runInContext(source, context);
const api = context.window.test;
assert.ok(api, 'Planner test harness initialized');
const day = 86400000;
for (const [sleepStart, sleepEnd] of [['23:00','08:00'], ['17:00','01:00'], ['08:00','16:00']]) {
  Object.assign(api.state, {sleepStart, sleepEnd});
  for (const start of [new Date(2026, 8, 24, 23, 30), new Date(2026, 9, 24, 23, 30), new Date(2026, 2, 28, 23, 30)]) {
    for (const duration of [day / 10, day * 2, day * 20]) {
      const slot = api.nextTechSlot(start, duration);
      assert.ok(slot.start >= start);
      assert.ok(slot.finish <= slot.collect);
      assert.ok(!api.isQuiet(slot.start), 'No manual start during sleep');
      assert.ok(!api.isQuiet(slot.collect), 'No collection during sleep');
      assert.ok(api.isTechDay(slot.collect), 'Collection in scoring game day');
    }
  }
}
assert.doesNotThrow(() => api.save());
Object.assign(api.state, {sleepStart:'23:00', sleepEnd:'08:00', reactionMinutes:60, techQueue:Array(10).fill('V 1/5')});
const screenshotStart=new Date(2026,8,24,22,29);
let previousQueue=null;
for(const researchSpeed of [91,92,93]){
  api.state.researchSpeed=researchSpeed;
  const queue=api.calcTech(screenshotStart,new Date(2026,10,19));
  assert.equal(queue.length,10);
  assert.equal(queue[0].collect.getDate(),26, `${researchSpeed}% collects on Saturday`);
  assert.equal(queue[0].collect.getMonth(),8);
  assert.equal(+queue[0].collect,+queue[0].finish,'Collect as soon as ready while awake on scoring day');
  if(previousQueue)queue.forEach((slot,i)=>assert.ok(slot.collect<=previousQueue[i].collect,'Faster research cannot postpone the queue'));
  previousQueue=queue;
}
// Check every technology across consecutive speeds, including sleep/reset boundaries.
let checked=0;
for(const sleep of [['23:00','08:00'],['17:00','01:00'],['08:00','16:00']]){
  [api.state.sleepStart,api.state.sleepEnd]=sleep;
  for(const start of [screenshotStart,new Date(2026,8,26,22,59),new Date(2026,9,24,22,30)]){
    for(const tech of context.window.FM_PLANNER_DATA.tech){
      let previous=Infinity;
      for(let speed=0;speed<=200;speed++){
        const slot=api.nextTechSlot(start,tech.baseDays*day/(1+speed/100));
        assert.ok(+slot.collect<=previous,`${tech.name}, ${speed}%: collection must not get later`);
        assert.ok(slot.finish<=slot.collect && !api.isQuiet(slot.start) && !api.isQuiet(slot.collect) && api.isTechDay(slot.collect));
        previous=+slot.collect;checked++;
      }
    }
  }
}
console.log(`Screenshot regression and ${checked} speed comparisons passed.`);
console.log('Planner: sleep, early wake-up, DST boundaries and blocked storage passed.');
