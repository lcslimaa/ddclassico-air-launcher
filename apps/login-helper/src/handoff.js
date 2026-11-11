'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { validateSession } = require('./capture');
const { acquireAIRLease } = require('./air-lease');

const ACK = '[Session launcher] Bridge session accepted.';
const LAUNCHER_MESSAGES = new Set([
  'Import a session exported from your normal DDClassico login. Close the original game before Start.',
  'Bridge session accepted.', 'Bridge session rejected.', 'Bridge invocation rejected.',
  'Bridge start deferred until the launcher is ready.',
  'Stack function names unavailable.',
  'Starting locally packaged adapter with fresh parameters. Server acceptance remains to be tested.',
  'Startup adapter loaded. This alone does not establish login or gameplay success.',
  'Private startup adapter is missing; rebuild the prototype.'
]);
const STAGES = new Set(['config-request', 'config-parsed', 'character-list-request',
  'character-list-complete', 'character-list-failed', 'registration-route',
  'existing-character-route', 'game-module-request', 'game-module-loaded',
  'game-bootstrap-started', 'startup-resources-complete']);

function safeDiagnostic(line) {
  if (/^\[Test marker\] (?:baseline|invite-sent|player-joined|player-left|lobby-left) at \d{1,13}ms$/.test(line)) return line;
  if (/^\[AIR window\] elapsedMs=\d{1,13} mainActive=[01] mainMinimized=[01] mainClosed=[01] gameActive=[01] gameMinimized=[01] gameClosed=[01]$/.test(line)) return line;
  if (line.startsWith('[Session launcher] ')) {
    const message = line.slice(19);
    if (LAUNCHER_MESSAGES.has(message) ||
        /^(?:Entry load error ID:|Startup rejected\. Error ID:) \d+$/.test(message) ||
        /^Uncaught (?:I\/O|sandbox|runtime) error ID: (?:\d+|unknown)\. Raw details omitted\.$/.test(message)) return line;
  }
  const stage = /^\[Startup stage\] ([a-z-]+) at (\d+)ms$/.exec(line);
  if (stage && STAGES.has(stage[1])) return line;
  if (/^\[Startup status\] character-list HTTP \d{1,3}$/.test(line)) return line;
  if (/^\[Session frame\] [A-Za-z_$][A-Za-z0-9_$.:\/<>-]{0,159}\(\)$/.test(line) && !line.includes('://')) return line;
  return null;
}

function consumeLines(stream, receive) {
  // Drop oversized game trace lines instead of retaining credential-bearing output.
  let buffer = '';
  let dropping = false;
  stream.on('data', chunk => {
    for (const part of String(chunk).split(/(\n)/)) {
      if (part === '\n') {
        if (!dropping) receive(buffer.replace(/\r$/, ''));
        buffer = ''; dropping = false;
      } else if (!dropping) {
        if (buffer.length + part.length > 2048) { buffer = ''; dropping = true; }
        else buffer += part;
      }
    }
  });
  stream.on('end', () => { if (buffer && !dropping) receive(buffer.replace(/\r$/, '')); });
}

function startHandoff(value, options) {
  const session = validateSession(value);
  const spawnProcess = options.spawnProcess || spawn;
  const timeoutMs = options.timeoutMs ?? 60000;
  fs.accessSync(options.adl, fs.constants.X_OK);
  const descriptor = options.layoutPilot === true ? 'layout-pilot.xml' : 'session-launcher.xml';
  const launcher = options.layoutPilot === true ? 'LayoutPilotLauncher.swf' : 'SessionLauncher.swf';
  for (const name of [descriptor, launcher, 'DDT_Loading.session.swf']) {
    fs.accessSync(path.join(options.build, name), fs.constants.R_OK);
  }
  const lease = acquireAIRLease(options.privateRoot, options.isProcessAlive);
  fs.mkdirSync(options.privateRoot, {recursive: true, mode: 0o700});
  let directory;
  try {
    directory = fs.mkdtempSync(path.join(options.privateRoot, 'air-handoff-'));
    fs.chmodSync(directory, 0o700);
  } catch { lease.release(); throw new Error('Private handoff directory could not be created.'); }
  const file = path.join(directory, 'session.json');
  let child;
  let accepted = false;
  let finished = false;
  let exited = false;
  let timer;
  const cleanup = () => fs.rmSync(directory, {recursive: true, force: true});
  const note = options.note || (() => {});
  const fail = reason => {
    if (finished) return;
    finished = true; clearTimeout(timer); cleanup(); note(reason);
    if (child && !accepted) child.kill();
  };
  try {
    fs.writeFileSync(file, JSON.stringify(session), {flag: 'wx', mode: 0o600});
    child = spawnProcess(options.adl, [path.join(options.build, descriptor),
      options.build, '--', '--bridge-session', file], {shell: false, stdio: ['ignore', 'pipe', 'pipe']});
    // Real subprocesses expose pid synchronously; synthetic tests may omit it.
    if (child.pid) lease.update(child.pid);
  } catch { child?.kill(); cleanup(); lease.release(); throw new Error('Local AIR handoff could not start.'); }
  note('AIR starting.');
  timer = setTimeout(() => fail('AIR did not acknowledge the handoff within 60 seconds.'), timeoutMs);
  const receive = line => {
    if (finished) return;
    if (options.memory?.(line)) return;
    const safe = safeDiagnostic(line);
    if (safe) note(safe);
    if (line === ACK && !finished && !accepted) {
      accepted = true; clearTimeout(timer); cleanup(); note('Handoff accepted; server authentication remains unverified.');
    } else if (!accepted && /^\[Session launcher\] Bridge (session|invocation) rejected\.$/.test(line)) {
      fail('AIR rejected the handoff. Obtain another launch through the website.');
    }
  };
  consumeLines(child.stdout, receive); consumeLines(child.stderr, receive);
  child.once('error', () => {
    if (!child.pid) { exited = true; lease.release(); }
    fail('AIR process failed to start.');
  });
  child.once('close', (code, signal) => {
    exited = true; lease.release();
    if (finished) return;
    finished = true; clearTimeout(timer); cleanup();
    note(accepted ? 'AIR closed. Start the helper again for a fresh attempt.' : 'AIR exited before accepting the session.');
    if (signal) note('AIR process ended by an operating-system signal.');
    else if (Number.isInteger(code) && code !== 0) note('AIR process exited with a nonzero status.');
    options.closed?.(code);
  });
  return {
    child,
    get accepted() { return accepted; },
    get active() { return !exited; },
    dispose() {
      clearTimeout(timer); cleanup();
      const shouldStop = !accepted && !finished;
      finished = true;
      if (shouldStop) child.kill();
      // An accepted child can outlive Electron; retain its PID until exit or next stale-marker check.
      if (exited) lease.release();
    }
  };
}

module.exports = {startHandoff, safeDiagnostic, consumeLines};
