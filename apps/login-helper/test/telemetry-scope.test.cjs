const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createMemoryMonitor} = require('../src/memory-monitor');

test('ignores retired instance traces while keeping memory recording active', t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'telemetry-scope-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const monitor=createMemoryMonitor(root); t.after(()=>monitor.stop());
  assert.equal(monitor.receive('[PvE timing] elapsedMs=1000 kind=1 phase=0 lifeTicks=60 pending=4 dueTicks=20'),false);
  assert.equal(monitor.receive('[PvE detail] elapsedMs=1000 kind=7 phase=0 actor=1 sequence=1'),false);
  assert.equal(monitor.receive('[AIR memory] elapsedMs=2000 allocatedBytes=100 freeBytes=50 privateBytes=200'),true);
  assert.ok(fs.readFileSync(monitor.file,'utf8').includes('2000,100,50,200'));
  assert.ok(!fs.readdirSync(path.dirname(monitor.file)).some(name=>name.includes('.pve')));
});
