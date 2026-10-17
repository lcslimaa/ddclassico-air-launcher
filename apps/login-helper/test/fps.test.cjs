const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseFPS, createFPSMonitor} = require('../src/fps-monitor');
const {createMemoryMonitor} = require('../src/memory-monitor');
function line(elapsed = 5000, foreground = 1) {
  return `[AIR fps] elapsedMs=${elapsed} windowMs=5000 frames=300 fps=60.0 targetFps=60.0 avgFrameMs=16.7 p95FrameMs=17.0 maxFrameMs=35.0 foreground=${foreground}`;
}
function directory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'air-fps-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true})); return root;
}
test('FPS parser checks numerical timing consistency and preserves foreground status', () => {
  const value = parseFPS(line());
  assert.equal(value.fps, 60); assert.equal(value.p95FrameMs, 17);
  assert.equal(parseFPS(line(10000, 0)).foreground, 0);
  assert.equal(parseFPS(line().replace('fps=60.0', 'fps=90.0')), null);
  assert.equal(parseFPS(line().replace('maxFrameMs=35.0', 'maxFrameMs=10.0')), null);
  assert.equal(parseFPS('[AIR fps] key=SYNTHETIC_SECRET'), null);
});
test('FPS CSV is numeric-only, private, monotonic and has bounded in-memory history', t => {
  const root = directory(t), file = path.join(root, 'fps.csv'); let latest;
  const monitor = createFPSMonitor(file, value => latest = value);
  for (let i=1; i<=400; i++) monitor.receive(line(i*5000, i%2));
  const size = fs.statSync(file).size;
  monitor.receive(line(5000)); monitor.receive('user=SYNTHETIC_SECRET');
  assert.equal(fs.statSync(file).size, size);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.equal(latest.samples.length, 360);
  const rows = fs.readFileSync(file, 'utf8').trim().split('\n').slice(1);
  assert.equal(rows.length, 400);
  assert.ok(rows.every(row => row.split(',').length === 9 && row.split(',').every(value => Number.isFinite(Number(value)))));
  monitor.stop(); monitor.receive(line(3000000)); assert.equal(fs.statSync(file).size, size);
});
test('paired memory/FPS recorder keeps old memory CSV schema and aligns by elapsed time', t => {
  const root = directory(t); let fps;
  const monitor = createMemoryMonitor(root, () => {}, value => fps = value);
  assert.ok(monitor.receive(line()));
  assert.equal(fps.latest.elapsedMs, 5000);
  monitor.receive('[AIR memory] elapsedMs=5000 allocatedBytes=100 freeBytes=10 privateBytes=200');
  assert.equal(fs.readFileSync(monitor.file, 'utf8').split('\n')[0], 'elapsed_ms,allocated_bytes,free_bytes,private_bytes');
  assert.match(fs.readFileSync(monitor.fpsFile, 'utf8'), /5000,5000,300,60,60,16.7,17,35,1/);
  monitor.stop(); assert.equal(monitor.receive(line(10000)), false);
});
test('FPS recording errors do not propagate into game telemetry processing', t => {
  const root = directory(t), file = path.join(root, 'fps.csv'); let unavailable;
  const monitor = createFPSMonitor(file, value => unavailable = value.unavailable);
  fs.unlinkSync(file); fs.mkdirSync(file);
  assert.doesNotThrow(() => monitor.receive(line())); assert.equal(unavailable, true);
});
