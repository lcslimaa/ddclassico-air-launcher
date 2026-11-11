const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {EventEmitter} = require('node:events');
const {PassThrough} = require('node:stream');
const {startHandoff, safeDiagnostic} = require('../src/handoff');
const secret = 'SYNTHETIC_ONLY_NOT_A_CREDENTIAL';
function setup() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-handoff-test-'));
  const build = path.join(directory, 'build'); fs.mkdirSync(build);
  for (const name of ['session-launcher.xml', 'SessionLauncher.swf', 'DDT_Loading.session.swf']) {
    fs.writeFileSync(path.join(build, name), 'test fixture');
  }
  const adl = path.join(directory, 'fake-adl'); fs.writeFileSync(adl, '', {mode: 0o700});
  const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.kill = () => { child.killed = true; };
  const notes = [];
  let invocation;
  const options = {adl, build, privateRoot: path.join(directory, 'private'), timeoutMs: 1000,
    note: value => notes.push(value), spawnProcess: (...args) => { invocation = args; return child; }};
  const value = {format: 'ddclassico-air-session-v1', exportedAt: Date.now(),
    entryUrl: 'https://resource.ddclassico.com/flash/Loading.swf',
    parameters: {user: 'fake', key: secret, token: secret, rand: secret,
      config: 'https://s1.ddclassico.com/portugal/config.xml'}};
  return {directory, child, notes, options, value, get invocation() { return invocation; }};
}

test('writes a private file, passes only its path, acknowledges split output and cleans up', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, fixture.options); t.after(() => handoff.dispose());
  const [command, args, spawnOptions] = fixture.invocation;
  assert.equal(command, fixture.options.adl);
  assert.equal(args[2], '--'); assert.equal(args[3], '--bridge-session');
  assert.equal(spawnOptions.shell, false);
  assert.ok(!JSON.stringify(args).includes(secret));
  const file = args[4];
  assert.equal(fs.statSync(path.dirname(file)).mode & 0o777, 0o700);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.equal(JSON.parse(fs.readFileSync(file)).parameters.key, secret);
  fixture.child.stdout.write(secret+'\n');
  fixture.child.stdout.write('[Session launcher] Bridge session ');
  fixture.child.stdout.write('accepted.\r\n');
  assert.ok(handoff.accepted);
  assert.equal(fs.existsSync(file), false);
  assert.ok(!JSON.stringify(fixture.notes).includes(secret));
  fixture.child.stdout.write('[Startup stage] config-parsed at 123ms\n');
  assert.ok(fixture.notes.includes('[Startup stage] config-parsed at 123ms'));
  handoff.dispose(); assert.ok(!fixture.child.killed);
});

test('layout pilot uses only the fixed pilot descriptor and requires its build before creating a session', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const options = {...fixture.options, layoutPilot: true};
  assert.throws(() => startHandoff(fixture.value, options));
  assert.equal(fixture.invocation, undefined);
  assert.equal(fs.existsSync(options.privateRoot), false);
  for (const name of ['layout-pilot.xml', 'LayoutPilotLauncher.swf']) {
    fs.writeFileSync(path.join(options.build, name), 'pilot fixture');
  }
  const handoff = startHandoff(fixture.value, options); t.after(() => handoff.dispose());
  assert.equal(path.basename(fixture.invocation[1][0]), 'layout-pilot.xml');
  assert.equal(fixture.invocation[1][3], '--bridge-session');
  assert.ok(!JSON.stringify(fixture.invocation[1]).includes(secret));
  fixture.child.stdout.write('[Session launcher] Bridge session accepted.\n');
  assert.ok(handoff.accepted);
});

test('truthy strings cannot change the default descriptor', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, {...fixture.options, layoutPilot: '../other.xml'});
  t.after(() => handoff.dispose());
  assert.equal(path.basename(fixture.invocation[1][0]), 'session-launcher.xml');
});

test('cleans up on spawn exception and asynchronous process failure', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  assert.throws(() => startHandoff(fixture.value, {...fixture.options,
    spawnProcess: () => { throw new Error(secret); }}), /Local AIR handoff/);
  assert.equal(fs.readdirSync(fixture.options.privateRoot).length, 0);
  startHandoff(fixture.value, fixture.options);
  fixture.child.emit('error', new Error(secret));
  assert.equal(fs.readdirSync(fixture.options.privateRoot).length, 0);
  assert.ok(!JSON.stringify(fixture.notes).includes(secret));
});

test('cleans up on rejection or process exit before acknowledgement', t => {
  for (const outcome of ['reject', 'exit']) {
    const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
    startHandoff(fixture.value, fixture.options);
    if (outcome === 'reject') fixture.child.stdout.write('[Session launcher] Bridge session rejected.\n');
    else fixture.child.emit('close', 1);
    assert.equal(fs.readdirSync(fixture.options.privateRoot).filter(name => name.startsWith('air-handoff-')).length, 0);
    fixture.child.emit('close', 1);
    assert.equal(fs.readdirSync(fixture.options.privateRoot).length, 0);
  }
});

test('timeout deletes the session and stops an unacknowledged process', async t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, {...fixture.options, timeoutMs: 10});
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.ok(fixture.child.killed);
  assert.equal(fs.readdirSync(fixture.options.privateRoot).filter(name => name.startsWith('air-handoff-')).length, 0);
  fixture.child.stdout.write('[Session launcher] Bridge session accepted.\n');
  assert.equal(handoff.accepted, false);
  fixture.child.emit('close', null, 'SIGTERM');
  assert.equal(fs.readdirSync(fixture.options.privateRoot).length, 0);
});

test('accepted AIR retains ownership after helper disposal and blocks a second launch until exit', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, fixture.options);
  fixture.child.stdout.write('[Session launcher] Bridge session accepted.\n');
  handoff.dispose();
  assert.ok(!fixture.child.killed);
  assert.ok(handoff.active);
  assert.throws(() => startHandoff(fixture.value, fixture.options), error => error.code === 'AIR_BUSY');
  fixture.child.emit('close', 0);
  assert.equal(handoff.active, false);
  assert.equal(fs.existsSync(path.join(fixture.options.privateRoot, 'active-air.json')), false);
});

test('helper disposal stops an unacknowledged child and ignores a late acknowledgement', t => {
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, fixture.options);
  const file = fixture.invocation[1][4];
  handoff.dispose();
  assert.ok(fixture.child.killed);
  assert.equal(fs.existsSync(file), false);
  fixture.child.stdout.write('[Session launcher] Bridge session accepted.\n');
  assert.equal(handoff.accepted, false);
  fixture.child.emit('close', null, 'SIGTERM');
  assert.equal(fs.existsSync(path.join(fixture.options.privateRoot, 'active-air.json')), false);
});

test('safe diagnostic filter drops raw game output and oversized traces', t => {
  assert.equal(safeDiagnostic('[Test marker] invite-sent at 12345ms'), '[Test marker] invite-sent at 12345ms');
  assert.equal(safeDiagnostic('[Test marker] user=PRIVATE at 12345ms'), null);
  const window = '[AIR window] elapsedMs=12345 mainActive=0 mainMinimized=0 mainClosed=0 gameActive=1 gameMinimized=0 gameClosed=0';
  assert.equal(safeDiagnostic(window), window);
  assert.equal(safeDiagnostic(window+' key=PRIVATE'), null);
  assert.equal(safeDiagnostic('[Session launcher] user='+secret), null);
  assert.equal(safeDiagnostic('[Startup stage] key-'+secret+' at 1ms'), null);
  assert.equal(safeDiagnostic('[Startup status] character-list HTTP 200'), '[Startup status] character-list HTTP 200');
  assert.equal(safeDiagnostic('[Session frame] global/flash.utils::getDefinitionByName()'), '[Session frame] global/flash.utils::getDefinitionByName()');
  assert.equal(safeDiagnostic('[Session frame] https://resource.ddclassico.com/file()'), null);
  assert.equal(safeDiagnostic('[Session frame] Game/login(key='+secret+')'), null);
  assert.equal(safeDiagnostic('[Session frame] Game/login()[/private/account/path:1]'), null);
  const fixture = setup(); t.after(() => fs.rmSync(fixture.directory, {recursive: true, force: true}));
  const handoff = startHandoff(fixture.value, fixture.options); t.after(() => handoff.dispose());
  fixture.child.stdout.write('x'.repeat(5000));
  fixture.child.stdout.write(secret+'\n[Session launcher] Bridge session accepted.\n');
  assert.ok(handoff.accepted);
  assert.ok(!JSON.stringify(fixture.notes).includes(secret));
});
