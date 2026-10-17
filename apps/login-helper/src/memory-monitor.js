'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {createFPSMonitor} = require('./fps-monitor');
const MiB = 1024 * 1024;
function parseMemory(line) {
  const match = /^\[AIR memory\] elapsedMs=(\d{1,13}) allocatedBytes=(\d{1,16}) freeBytes=(\d{1,16}) privateBytes=(\d{1,16})$/.exec(line);
  if (!match) return null;
  const values = match.slice(1).map(Number);
  if (!values.every(Number.isSafeInteger)) return null;
  return {elapsedMs: values[0], allocatedBytes: values[1], freeBytes: values[2], privateBytes: values[3]};
}
function metricTrend(samples, field) {
  // Compare minute minima, rather than temporary allocation peaks, after warm-up.
  const bins = new Map();
  for (const sample of samples) {
    if (sample.elapsedMs < 300000 || !Number.isFinite(sample[field])) continue;
    const minute = Math.floor(sample.elapsedMs / 60000);
    const prior = bins.get(minute);
    bins.set(minute, {floor: prior ? Math.min(prior.floor, sample[field]) : sample[field],
      count: prior ? prior.count+1 : 1});
  }
  const currentMinute = samples.length ? Math.floor(samples[samples.length-1].elapsedMs/60000) : 0;
  const floors = [...bins.entries()].filter(([minute, value]) => minute < currentMinute && value.count >= 6).map(([, value]) => value.floor);
  if (floors.length < 10) return {state: 'warming-up'};
  const first = floors.slice(0, 3).reduce((a, b) => a+b, 0)/3;
  const last = floors.slice(-3).reduce((a, b) => a+b, 0)/3;
  const growth = last-first;
  let rises = 0;
  const tail = floors.slice(-7);
  for (let i=1; i<tail.length; i++) if (tail[i]-tail[i-1] > MiB) rises++;
  const suspicious = growth > 32*MiB && growth > first*0.2 && rises >= 4;
  return {state: suspicious ? 'growth' : 'no-sustained-growth', growthMiB: growth/MiB};
}
function analyze(samples) {
  const allocated = metricTrend(samples, 'allocatedBytes');
  const privateMemory = metricTrend(samples, 'privateBytes');
  const growth = allocated.state === 'growth' || privateMemory.state === 'growth';
  const warming = allocated.state === 'warming-up' && privateMemory.state === 'warming-up';
  return {allocated, privateMemory, state: growth ? 'growth' : warming ? 'warming-up' : 'no-sustained-growth',
    label: growth ? 'Sustained memory growth: investigate; not proof of a leak.' : warming ?
      'Collecting baseline (needs ≥15 minutes).' : 'No sustained growth detected in sampled metrics; leaks are not ruled out.'};
}
function createMemoryMonitor(privateRoot, update = () => {}, updateFPS = () => {}) {
  const directory = path.join(privateRoot, 'memory'); fs.mkdirSync(directory, {recursive: true, mode: 0o700});
  const file = path.join(directory, 'air-'+Date.now()+'-'+randomUUID()+'.csv');
  fs.writeFileSync(file, 'elapsed_ms,allocated_bytes,free_bytes,private_bytes\n', {flag: 'wx', mode: 0o600});
  let fpsMonitor;
  const fpsFile = file.replace(/\.csv$/, '.fps.csv');
  try { fpsMonitor = createFPSMonitor(fpsFile, updateFPS); }
  catch { updateFPS({unavailable: true}); }
  const samples = [];
  let stopped = false;
  return {
    file,
    fpsFile,
    receive(line) {
      if (fpsMonitor?.receive(line)) return true;
      if (stopped) return false;
      const sample = parseMemory(line); if (!sample) return false;
      if (samples.length && sample.elapsedMs <= samples[samples.length-1].elapsedMs) return true;
      samples.push(sample); if (samples.length > 360) samples.shift();
      try { fs.appendFileSync(file, [sample.elapsedMs, sample.allocatedBytes, sample.freeBytes, sample.privateBytes].join(',')+'\n'); }
      catch { stopped = true; update({latest: sample, samples: samples.slice(),
        analysis: {state: 'unavailable', label: 'Memory recording stopped: local file could not be written.'}}); return true; }
      update({latest: sample, samples: samples.slice(), analysis: analyze(samples)});
      return true;
    },
    stop() { stopped = true; fpsMonitor?.stop(); }
  };
}
module.exports = {parseMemory, analyze, createMemoryMonitor};
