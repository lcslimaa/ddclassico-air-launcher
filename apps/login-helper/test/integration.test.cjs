const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');
const capture = require('../src/capture');
const {startHandoff} = require('../src/handoff');
const secret = 'SYNTHETIC_ONLY_NOT_A_CREDENTIAL';

test('generated sandbox preload captures without exposing a page API or session values', () => {
  const sent = [];
  const element = {
    getAttribute: name => name === 'data' ? 'https://resource.ddclassico.com/flash/Loading.swf?user=fake&key='+secret+
      '&token='+secret+'&rand=fake-random&config='+encodeURIComponent('https://s1.ddclassico.com/portugal/config.xml') : null,
    querySelectorAll: () => []
  };
  const source = ['capture.js', 'preload-body.js'].map(name => fs.readFileSync(path.join(__dirname, '../src', name), 'utf8')).join('\n');
  const context = {URL, URLSearchParams, TextEncoder, Date, queueMicrotask,
    location: {href: 'https://ddclassico.com/playgame/1'},
    document: {querySelectorAll: () => [element]},
    MutationObserver: class {observe() {} disconnect() {}},
    require: name => { assert.equal(name, 'electron'); return {ipcRenderer: {send: (...args) => sent.push(args)}}; }
  };
  vm.runInNewContext(source, context);
  assert.equal(sent[0][0], 'ddclassico-launch-session');
  assert.equal(sent[0][1].parameters.key, secret);
  assert.equal(sent[1][0], 'ddclassico-observer-ready');
  assert.equal(context.electronAPI, undefined);
});

test('main process blocks SWFs, rejects foreign IPC frames and launches only once', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-main-test-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const app = new EventEmitter(); Object.assign(app, {
    setPath(_name, directory) { assert.ok(fs.statSync(directory).isDirectory()); },
    setName() {}, enableSandbox() {}, requestSingleInstanceLock: () => true,
    whenReady: () => Promise.resolve(), quit() {}
  });
  const windows = [];
  class Contents extends EventEmitter {
    constructor() { super(); this.mainFrame = {url: 'about:blank'}; }
    setWindowOpenHandler(handler) { this.popupHandler = handler; }
    send() {}
    loadURL(url) { this.mainFrame.url = url; return Promise.resolve(); }
  }
  class Window extends EventEmitter {
    constructor(options) { super(); this.options = options; this.webContents = new Contents(); windows.push(this); }
    isDestroyed() { return false; }
    loadFile() { return Promise.resolve(); }
    loadURL(url) { return this.webContents.loadURL(url); }
  }
  const ipcMain = new EventEmitter();
  let requestHandler;
  const browserSession = new EventEmitter(); Object.assign(browserSession, {
    setPermissionRequestHandler() {}, setPermissionCheckHandler() {},
    webRequest: {onBeforeRequest(_filter, handler) { requestHandler = handler; }}
  });
  const launched = [];
  let handoffOptions;
  const processSamples = [];
  let processStops = 0;
  let disposals = 0;
  let quitting = 0;
  app.quit = () => quitting++;
  const output = [];
  const helperProcess = new EventEmitter(); helperProcess.env = {};
  const electron = {app, BrowserWindow: Window, ipcMain,
    session: {fromPartition: () => browserSession}, Menu: {setApplicationMenu() {}, buildFromTemplate: value => value}};
  const code = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  vm.runInNewContext(code, {__dirname: path.join(directory, 'login-helper'), process: helperProcess,
    console: {log: line => output.push(line)}, require: name => {
      if (name === 'electron') return electron;
      if (name === './project-paths') return {root:directory,runtime:path.join(directory,'private'),build:path.join(directory,'build')};
      if (name === './capture') return capture;
      if (name === './air-lease') return require('../src/air-lease');
      if (name === './memory-monitor') return require('../src/memory-monitor');
      if (name === './process-monitor') return {createProcessMonitor: (_file, pid) => {
        assert.equal(pid, 123);
        return {sample: elapsed => processSamples.push(elapsed), stop: () => processStops++};
      }};
      if (name === './handoff') return {startHandoff: (value, options) => {
        handoffOptions = options; launched.push(value);
        return {child: {pid: 123}, dispose() { disposals++; }};
      }};
      return require(name);
    }});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(windows.length, 1);
  const browser = windows[0];
  assert.equal(browser.options.webPreferences.nodeIntegration, false);
  assert.equal(browser.options.webPreferences.contextIsolation, true);
  assert.equal(browser.options.webPreferences.sandbox, true);
  let ignoredUnload = 0;
  browser.webContents.emit('will-prevent-unload', {preventDefault: () => ignoredUnload++});
  assert.equal(ignoredUnload, 0); // Do not change ordinary navigation before the user closes.
  browser.emit('close');
  browser.webContents.emit('will-prevent-unload', {preventDefault: () => ignoredUnload++});
  assert.equal(ignoredUnload, 1);
  let cancelled;
  requestHandler({url: 'https://resource.ddclassico.com/flash/Loading.swf?key='+secret}, result => cancelled = result.cancel);
  assert.equal(cancelled, true);
  requestHandler({url: 'https://resource.ddclassico.com/flash/assets.png'}, result => cancelled = result.cancel);
  assert.equal(cancelled, false);
  const value = {format: 'ddclassico-air-session-v1', exportedAt: Date.now(),
    entryUrl: 'https://resource.ddclassico.com/flash/Loading.swf',
    parameters: {user: 'fake', key: secret, token: secret, rand: 'fake-random',
      config: 'https://s1.ddclassico.com/portugal/config.xml'}};
  ipcMain.emit('ddclassico-launch-session', {sender: new Contents(), senderFrame: browser.webContents.mainFrame}, value);
  ipcMain.emit('ddclassico-launch-session', {sender: browser.webContents, senderFrame: {url: 'https://ddclassico.com'}}, value);
  assert.equal(launched.length, 0);
  const query = new URLSearchParams(value.parameters);
  requestHandler({url: value.entryUrl+'?'+query, webContents: browser.webContents,
    initiatorOrigin: 'https://unrelated.example'}, result => cancelled = result.cancel);
  assert.equal(cancelled, true);
  assert.equal(launched.length, 0);
  requestHandler({url: value.entryUrl+'?'+query, webContents: browser.webContents,
    initiatorOrigin: 'https://ddclassico.com'}, result => cancelled = result.cancel);
  assert.equal(cancelled, true);
  assert.equal(launched.length, 1);
  assert.ok(output.includes('Session captured from blocked startup request.'));
  handoffOptions.memory('[AIR memory] elapsedMs=5000 allocatedBytes=100 freeBytes=10 privateBytes=200');
  assert.deepEqual(processSamples, [5000]);
  const event = {sender: browser.webContents, senderFrame: browser.webContents.mainFrame};
  ipcMain.emit('ddclassico-launch-session', event, value);
  ipcMain.emit('ddclassico-launch-session', event, value);
  assert.equal(launched.length, 1);
  assert.ok(!JSON.stringify(output).includes(secret));
  assert.ok(!fs.readFileSync(path.join(directory, 'private/login-helper.log'), 'utf8').includes(secret));
  helperProcess.emit('SIGINT');
  assert.equal(disposals, 1);
  assert.equal(processStops, 1);
  assert.equal(quitting, 1);

  // Simulate a helper restarted while its accepted AIR process remains alive.
  fs.writeFileSync(path.join(directory, 'private/active-air.json'), JSON.stringify({id: 'existing', pid: process.pid}));
  const before = windows.length;
  vm.runInNewContext(code, {__dirname: path.join(directory, 'login-helper'), process: helperProcess,
    console: {log: line => output.push(line)}, require: name => {
      if (name === 'electron') return electron;
      if (name === './project-paths') return {root:directory,runtime:path.join(directory,'private'),build:path.join(directory,'build')};
      if (name === './capture') return capture;
      if (name === './air-lease') return require('../src/air-lease');
      if (name === './memory-monitor') return require('../src/memory-monitor');
      if (name === './process-monitor') return require('../src/process-monitor');
      if (name === './handoff') return {startHandoff: () => assert.fail('Active AIR must block launch.')};
      return require(name);
    }});
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(windows.length-before, 0); // No auxiliary panel or duplicate login window.
  assert.ok(output.includes('An AIR game is still running. Close it, then restart the helper. Official login was not opened.'));
});

test('real subprocess fixture reads the private session and acknowledges the handoff', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'air-process-test-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const build = path.join(directory, 'build'); fs.mkdirSync(build);
  fs.writeFileSync(path.join(build, 'session-launcher.xml'), `
    const fs = require('node:fs');
    const args = process.argv.slice(2);
    if (args[1] !== '--' || args[2] !== '--bridge-session') process.exit(2);
    const value = JSON.parse(fs.readFileSync(args[3]));
    if (value.parameters.key !== '${secret}') process.exit(3);
    console.log('[Session launcher] Bridge session accepted.');
  `);
  for (const name of ['SessionLauncher.swf', 'DDT_Loading.session.swf']) fs.writeFileSync(path.join(build, name), 'fixture');
  const notes = [];
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Fixture process timed out.')), 3000);
    const handoff = startHandoff({format: 'ddclassico-air-session-v1', exportedAt: Date.now(),
      entryUrl: 'https://resource.ddclassico.com/flash/Loading.swf',
      parameters: {user: 'fake', key: secret, token: secret, rand: 'fake-random',
        config: 'https://s1.ddclassico.com/portugal/config.xml'}},
    {adl: process.execPath, build, privateRoot: path.join(directory, 'private'),
      note: message => notes.push(message), closed: code => {
        clearTimeout(timer);
        try { assert.equal(code, 0); assert.ok(handoff.accepted); resolve(); }
        catch (error) { reject(error); }
      }});
    t.after(() => handoff.dispose());
  });
  assert.equal(fs.readdirSync(path.join(directory, 'private')).length, 0);
  assert.ok(!JSON.stringify(notes).includes(secret));
});
