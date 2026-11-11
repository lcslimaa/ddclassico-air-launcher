'use strict';
const fs = require('node:fs');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');
const exec = promisify(execFile);

function parseProcess(text) {
  const m = /^(?:(\d+)-)?(?:(\d+):)?(\d+):([0-5]\d)(?:\.(\d{1,6}))?\s+(\d+)$/.exec(text.trim());
  if (!m || (m[2] && Number(m[3]) >= 60)) return null;
  const cpuMs = ((Number(m[1] || 0)*86400 + Number(m[2] || 0)*3600 +
    Number(m[3])*60 + Number(m[4]))*1000) + Number('0.'+(m[5] || '0'))*1000;
  const rssBytes = Number(m[6])*1024;
  if (!Number.isFinite(cpuMs) || cpuMs < 0 || !Number.isSafeInteger(rssBytes)) return null;
  return {cpuMs, rssBytes};
}

function createProcessMonitor(file, pid, options = {}) {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error('Invalid AIR process.');
  fs.writeFileSync(file, 'utc_ms,elapsed_ms,cpu_interval_ms,cpu_percent,rss_bytes\n', {flag: 'wx', mode: 0o600});
  const clock = options.clock || (() => performance.now());
  const read = options.read || (async () => (await exec('/bin/ps',
    ['-p', String(pid), '-o', 'time=', '-o', 'rss='], {timeout: 1500, maxBuffer: 1024})).stdout);
  let previous;
  let busy = false;
  let stopped = false;
  return {
    async sample(elapsedMs) {
      if (stopped || busy || !Number.isSafeInteger(elapsedMs) || elapsedMs < 0) return;
      busy = true;
      try {
        const counters = parseProcess(await read());
        if (stopped) return;
        if (!counters) throw new Error('Process counters unavailable.');
        const now = clock();
        if (previous && now > previous.time && elapsedMs > previous.elapsedMs && counters.cpuMs >= previous.cpuMs) {
          const duration = now-previous.time;
          // 100% means one fully occupied CPU core; multi-threaded AIR may exceed 100%.
          const cpu = (counters.cpuMs-previous.cpuMs)*100/duration;
          fs.appendFileSync(file, [Date.now(), elapsedMs, Math.round(duration), cpu.toFixed(1), counters.rssBytes].join(',')+'\n');
        }
        previous = {...counters, time: now, elapsedMs};
      } catch {
        // A vanished process, unsupported ps or a recording failure must not affect the game.
        stopped = true;
        options.unavailable?.();
      } finally { busy = false; }
    },
    stop() { stopped = true; }
  };
}
module.exports = {parseProcess, createProcessMonitor};
