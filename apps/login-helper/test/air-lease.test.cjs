const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {acquireAIRLease} = require('../src/air-lease');
function root(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-lease-test-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true})); return directory;
}
test('live process ownership blocks another attempt and marker permissions are private', t => {
  const directory = root(t);
  const lease = acquireAIRLease(directory);
  const file = path.join(directory, 'active-air.json');
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.throws(() => acquireAIRLease(directory), error => error.code === 'AIR_BUSY');
  lease.update(process.pid); lease.release();
  assert.equal(fs.existsSync(file), false);
});
test('stale process marker is recovered without deleting other private files', t => {
  const directory = root(t);
  fs.writeFileSync(path.join(directory, 'active-air.json'), JSON.stringify({id: 'old', pid: 123}));
  fs.writeFileSync(path.join(directory, 'manual-session.json'), 'private fixture');
  const lease = acquireAIRLease(directory, () => false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'active-air.json'))).pid, process.pid);
  assert.equal(fs.readFileSync(path.join(directory, 'manual-session.json'), 'utf8'), 'private fixture');
  lease.release();
});
test('invalid marker refuses launch and an older owner cannot delete a newer marker', t => {
  const directory = root(t);
  const file = path.join(directory, 'active-air.json');
  fs.writeFileSync(file, 'invalid');
  assert.throws(() => acquireAIRLease(directory), /could not be verified/);
  fs.unlinkSync(file);
  const lease = acquireAIRLease(directory);
  fs.writeFileSync(file, JSON.stringify({id: 'another-owner', pid: process.pid}));
  lease.release();
  assert.ok(fs.existsSync(file));
});
