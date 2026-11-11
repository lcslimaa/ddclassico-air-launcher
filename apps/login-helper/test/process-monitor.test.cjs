const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseProcess, createProcessMonitor} = require('../src/process-monitor');

test('process counters accept only CPU time and resident memory, never command text', () => {
  assert.deepEqual(parseProcess(' 1:02.50 2048\n'), {cpuMs: 62500, rssBytes: 2097152});
  assert.deepEqual(parseProcess(' 2-01:02:03.25 10'), {cpuMs: 176523250, rssBytes: 10240});
  assert.equal(parseProcess('user=PRIVATE 2048'), null);
  assert.equal(parseProcess('0:60.00 10'), null);
});

test('CPU uses differences between counters, aligns with AIR time and stops cleanly', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'air-process-metrics-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const file = path.join(dir, 'process.csv');
  const counters = ['0:01.00 2048', '0:03.50 3072'];
  let clock = 1000;
  const monitor = createProcessMonitor(file, 123, {clock: () => clock,
    read: async () => counters.shift()});
  await monitor.sample(5000);
  clock = 6000;
  await monitor.sample(10000);
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[1].split(',').slice(1).join(','), '10000,5000,50.0,3145728');
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  monitor.stop();
  await monitor.sample(15000);
  assert.equal(fs.readFileSync(file, 'utf8').trim().split('\n').length, 2);
});

test('missing process, write failure and late readings never interrupt game monitoring', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'air-process-metrics-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const file = path.join(dir, 'process.csv');
  let resolve;
  const monitor = createProcessMonitor(file, 123, {read: () => new Promise(r => { resolve = r; })});
  const pending = monitor.sample(5000);
  monitor.stop(); resolve('0:01.00 2048'); await pending;
  assert.equal(fs.readFileSync(file, 'utf8').trim().split('\n').length, 1);
  const failed = createProcessMonitor(path.join(dir, 'failed.csv'), 123,
    {read: async () => { throw new Error('process exited'); }});
  await assert.doesNotReject(failed.sample(5000)); failed.stop();
  const broken = path.join(dir, 'broken.csv');
  let now = 0;
  const writer = createProcessMonitor(broken, 123, {clock: () => now,
    read: async () => '0:01.00 2048'});
  await writer.sample(5000); now = 5000;
  fs.unlinkSync(broken); fs.mkdirSync(broken);
  await assert.doesNotReject(writer.sample(10000)); writer.stop();
});
