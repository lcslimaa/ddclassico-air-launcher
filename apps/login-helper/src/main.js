'use strict';
const { app, BrowserWindow, ipcMain, session, Menu } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { isOfficialPage, isStartupURL, validateSession, sessionFromStartupRequest,
  trustedStartupRequest, missingStartupFields } = require('./capture');
const { startHandoff } = require('./handoff');
const { AIRLeaseState } = require('./air-lease');
const { createMemoryMonitor } = require('./memory-monitor');

const project = require('./project-paths');
const root = project.root;
const profile = path.join(project.runtime, 'login-helper-profile');
fs.mkdirSync(profile, {recursive: true, mode: 0o700});
fs.chmodSync(profile, 0o700);
for (const directory of ['browser', 'crashes']) {
  fs.mkdirSync(path.join(profile, directory), {recursive: true, mode: 0o700});
}
app.setPath('userData', profile);
app.setPath('sessionData', path.join(profile, 'browser'));
app.setPath('crashDumps', path.join(profile, 'crashes'));
app.setName('DDClassico AIR Login Helper');
app.enableSandbox();

let browser;
let panel;
let handoff;
let captured = false;
let memoryMonitor;
let quitting = false;
const logPath = path.join(project.runtime, 'login-helper.log');
const messages = [];
function note(message) {
  // All callers supply fixed labels or handoff.js-whitelisted diagnostics.
  const line = new Date().toISOString() + ' ' + message;
  try { fs.appendFileSync(logPath, line + '\n', {mode: 0o600}); } catch {}
  console.log(message);
  messages.push(message); if (messages.length > 12) messages.shift();
  if (panel && !panel.isDestroyed()) panel.webContents.send('helper-status', messages.slice());
}
function trusted(event) {
  return browser && !browser.isDestroyed() && event.sender === browser.webContents &&
    event.senderFrame === browser.webContents.mainFrame && isOfficialPage(event.senderFrame.url);
}
function captureSession(value, source) {
  if (captured) return;
  let validated;
  try { validated = validateSession(value); }
  catch { note('Launch parameters rejected. No AIR launch was attempted.'); return; }
  captured = true;
  note(source === 'request' ? 'Session captured from blocked startup request.' :
    'Session captured from website embedding.');
  try {
    const sdk = process.env.DDCLASSICO_AIR_SDK || '';
    try {
      memoryMonitor = createMemoryMonitor(project.runtime, value => {
        if (panel && !panel.isDestroyed()) panel.webContents.send('helper-memory', value);
      }, value => {
        if (panel && !panel.isDestroyed()) panel.webContents.send('helper-fps', value);
      });
    } catch { note('Memory monitor unavailable; game launch will continue.'); }
    handoff = startHandoff(validated, {adl: path.join(sdk, 'bin', 'adl'),
      layoutPilot: process.env.DDCLASSICO_LAYOUT_PILOT === '1',
      build: project.build, privateRoot: project.runtime, note,
      memory: line => memoryMonitor?.receive(line), closed: () => memoryMonitor?.stop()});
  } catch (error) {
    memoryMonitor?.stop();
    if (error.code === 'AIR_BUSY') note('An AIR game is still running. Close it, then restart the helper for a fresh launch.');
    else note('AIR handoff failed. Check the SDK, build and lifecycle marker, then restart the helper for a fresh launch.');
  }
}
function officialNavigation(event, url) {
  if (!isOfficialPage(url)) { event.preventDefault(); note('Navigation outside the official website was blocked.'); }
}
function protect(contents, owner) {
  let closing = false;
  owner.on('close', () => { closing = true; });
  contents.on('will-prevent-unload', event => {
    if (closing || quitting) {
      // The user requested close/quit; the remote page must not veto it.
      event.preventDefault();
      note('Website close blocker ignored for requested window close.');
    }
  });
  contents.setWindowOpenHandler(({url}) => {
    if (isOfficialPage(url)) contents.loadURL(url).catch(() => note('Website navigation failed.'));
    else note('External popup was blocked.');
    return {action: 'deny'};
  });
  contents.on('will-navigate', officialNavigation);
  contents.on('will-redirect', officialNavigation);
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('render-process-gone', () => note('Login browser stopped. Restart the helper.'));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { browser?.show(); browser?.focus(); });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label: 'DDClassico AIR Login Helper', submenu: [
        {label: 'Quit Login Helper', accelerator: 'CommandOrControl+Q', click: () => app.quit()}
      ]},
      {label: 'Edit', submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'},
        {role: 'cut'}, {role: 'copy'}, {role: 'paste'}, {role: 'selectAll'}]},
      {label: 'Window', submenu: [{role: 'minimize'}, {role: 'close'}]}
    ]));
    const loginSession = session.fromPartition('persist:official-login');
    loginSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    loginSession.setPermissionCheckHandler(() => false);
    loginSession.on('will-download', event => { event.preventDefault(); note('Browser download blocked; sessions are handed directly to AIR.'); });
    loginSession.webRequest.onBeforeRequest({urls: ['https://resource.ddclassico.com/*']}, (details, callback) => {
      const blocked = isStartupURL(details.url);
      // Read provenance before cancellation can detach the requesting frame.
      const owned = blocked && browser && !browser.isDestroyed() &&
        trustedStartupRequest(details, browser.webContents);
      callback({cancel: blocked});
      if (!blocked) return;
      note('Original startup SWF request blocked.');
      if (captured) return;
      if (!owned) { note('Startup request capture refused: official browser origin/frame not established.'); return; }
      try {
        const value = sessionFromStartupRequest(details.url);
        if (value) captureSession(value, 'request');
        else note('Startup request is incomplete; waiting for embedding. Missing fields: ' + missingStartupFields(details.url).join(', ') + '.');
      } catch { note('Startup request parameters failed validation. Values omitted.'); }
    });
    panel = new BrowserWindow({width: 620, height: 450, title: 'AIR login handoff',
      webPreferences: {preload: path.join(__dirname, '../ui/status-preload.js'),
        nodeIntegration: false, contextIsolation: true, sandbox: true}});
    panel.loadFile(path.join(__dirname, '../ui/status.html'));
    panel.webContents.on('did-finish-load', () => panel.webContents.send('helper-status', messages.slice()));
    panel.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    panel.webContents.on('will-navigate', event => event.preventDefault());
    panel.on('closed', () => { panel = null; });
    note('[Helper lifecycle] Attempt started.');
    const existingAIR = AIRLeaseState(project.runtime);
    if (existingAIR === 'active') {
      note('An AIR game is still running. Close it, then restart the helper. Official login was not opened.');
      return;
    }
    if (existingAIR === 'invalid') {
      note('AIR lifecycle marker could not be verified. Official login was not opened; local diagnostics need review.');
      return;
    }
    browser = new BrowserWindow({width: 1200, height: 800, title: 'DDClassico official login',
      webPreferences: {session: loginSession, preload: path.join(__dirname, '../.generated', 'preload.js'),
        nodeIntegration: false, contextIsolation: true, sandbox: true, webviewTag: false}});
    protect(browser.webContents, browser);
    browser.webContents.on('did-fail-load', (_event, code, _description, _url, mainFrame) => {
      if (mainFrame && code !== -3) note('Official website failed to load. Check your connection.');
    });
    browser.webContents.on('did-finish-load', () => note('Official website loaded. Log in and choose your usual server.'));
    browser.on('closed', () => { browser = null; note('Login window closed. Keep it open during the next test.'); });
    ipcMain.on('ddclassico-observer-ready', event => {
      if (trusted(event)) note('Capture ready; waiting for official game launch parameters.');
    });
    ipcMain.on('ddclassico-capture-problem', event => {
      if (trusted(event)) note('Unsupported game embedding detected. No AIR launch was attempted.');
    });
    ipcMain.on('ddclassico-launch-session', (event, value) => {
      if (!trusted(event) || captured) return;
      captureSession(value, 'embedding');
    });
    note('Login required. Close any already-running original game or AIR prototype.');
    note('Keep this login browser open while testing AIR. Restart the helper for each new attempt.');
    browser.loadURL('https://ddclassico.com/classic/launcher').catch(() => note('Official website navigation failed.'));
  }).catch(() => { note('Login helper failed to initialize.'); app.quit(); });
  app.on('before-quit', () => { quitting = true; memoryMonitor?.stop(); handoff?.dispose(); });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => { memoryMonitor?.stop(); handoff?.dispose(); app.quit(); });
  }
  app.on('window-all-closed', () => app.quit());
}
