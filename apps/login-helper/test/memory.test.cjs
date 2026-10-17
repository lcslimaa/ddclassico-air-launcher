const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseMemory, analyze, createMemoryMonitor} = require('../src/memory-monitor');
const MiB = 1048576;
function samples(fn, minutes = 20) {
  const result = [];
  for (let elapsedMs=0; elapsedMs<=minutes*60000; elapsedMs+=5000) result.push({elapsedMs, allocatedBytes: fn(elapsedMs)*MiB});
  return result;
}
test('numeric telemetry parsing rejects arbitrary messages and unsafe numbers', () => {
  assert.equal(parseMemory('[AIR memory] elapsedMs=5000 allocatedBytes=104857600 freeBytes=1024 privateBytes=209715200').allocatedBytes, 104857600);
  assert.equal(parseMemory('[AIR memory] key=SYNTHETIC_SECRET'), null);
  assert.equal(parseMemory('[AIR memory] elapsedMs=5000 allocatedBytes=9999999999999999 freeBytes=0 privateBytes=0'), null);
});
test('startup allocations, garbage-collection peaks and stable memory do not flag growth', () => {
  assert.equal(analyze(samples(t => t<300000 ? 100+t/1000 : 150+(t%60000)/1000)).state, 'no-sustained-growth');
  assert.equal(analyze(samples(() => 150, 10)).state, 'warming-up');
});
test('persistent growth flags investigation, not a confirmed leak', () => {
  const result = analyze(samples(t => 100+t/60000*6));
  assert.equal(result.state, 'growth');
  assert.match(result.label, /not proof/);
});
test('private process growth is flagged even with flat AIR allocations', () => {
  const data = samples(() => 100).map(sample => ({...sample, privateBytes: (200+sample.elapsedMs/60000*8)*MiB}));
  const result = analyze(data);
  assert.equal(result.allocated.state, 'no-sustained-growth');
  assert.equal(result.privateMemory.state, 'growth');
  assert.equal(result.state, 'growth');
});
test('CSV contains only numeric samples and in-memory history is bounded', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-memory-test-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  let latest;
  const monitor = createMemoryMonitor(directory, value => latest = value);
  assert.equal(monitor.receive('user=SYNTHETIC_SECRET'), false);
  for (let i=1; i<=400; i++) monitor.receive(`[AIR memory] elapsedMs=${i*5000} allocatedBytes=100 freeBytes=10 privateBytes=200`);
  assert.equal(latest.samples.length, 360);
  assert.equal(fs.statSync(monitor.file).mode & 0o777, 0o600);
  assert.ok(!fs.readFileSync(monitor.file, 'utf8').includes('SYNTHETIC_SECRET'));
  const before = fs.statSync(monitor.file).size;
  monitor.stop(); monitor.receive('[AIR memory] elapsedMs=3000000 allocatedBytes=100 freeBytes=10 privateBytes=200');
  assert.equal(fs.statSync(monitor.file).size, before);
});
test('recording failure disables monitoring without throwing into the game handoff', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-memory-failure-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  let latest;
  const monitor = createMemoryMonitor(directory, value => latest = value);
  fs.unlinkSync(monitor.file); fs.mkdirSync(monitor.file);
  assert.doesNotThrow(() => monitor.receive('[AIR memory] elapsedMs=5000 allocatedBytes=100 freeBytes=10 privateBytes=200'));
  assert.equal(latest.analysis.state, 'unavailable');
});
