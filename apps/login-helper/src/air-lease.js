'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');

function isProcessAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== 'ESRCH'; }
}
function AIRLeaseState(privateRoot, alive = isProcessAlive) {
  const file = path.join(privateRoot, 'active-air.json');
  if (!fs.existsSync(file)) return 'absent';
  try {
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Number.isInteger(current.pid) || current.pid < 1 || typeof current.id !== 'string') return 'invalid';
    return alive(current.pid) ? 'active' : 'stale';
  } catch { return 'invalid'; }
}
function acquireAIRLease(privateRoot, alive = isProcessAlive) {
  fs.mkdirSync(privateRoot, {recursive: true, mode: 0o700});
  const file = path.join(privateRoot, 'active-air.json');
  if (fs.existsSync(file)) {
    let current;
    try { current = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { throw new Error('AIR lifecycle marker could not be verified.'); }
    if (!Number.isInteger(current.pid) || current.pid < 1 || typeof current.id !== 'string') {
      throw new Error('AIR lifecycle marker could not be verified.');
    }
    if (alive(current.pid)) {
      const error = new Error('An AIR attempt is already running.'); error.code = 'AIR_BUSY'; throw error;
    }
    // Electron's single-instance lock serializes real helpers using this profile.
    fs.unlinkSync(file);
  }
  const id = randomUUID();
  fs.writeFileSync(file, JSON.stringify({id, pid: process.pid}), {flag: 'wx', mode: 0o600});
  const owns = () => {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')).id === id; }
    catch { return false; }
  };
  return {
    update(pid) {
      if (!Number.isInteger(pid) || pid < 1 || !owns()) throw new Error('AIR process ownership could not be recorded.');
      fs.writeFileSync(file, JSON.stringify({id, pid}), {mode: 0o600});
    },
    release() { if (owns()) fs.unlinkSync(file); }
  };
}

module.exports = {acquireAIRLease, isProcessAlive, AIRLeaseState};
