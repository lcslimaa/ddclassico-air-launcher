'use strict';
const fs = require('node:fs');
function parseFPS(line) {
  const pattern = /^\[AIR fps\] elapsedMs=(\d{1,13}) windowMs=(\d{1,10}) frames=(\d{1,10}) fps=(\d{1,6}\.\d) targetFps=(\d{1,6}\.\d) avgFrameMs=(\d{1,10}\.\d) p95FrameMs=(\d{1,10}\.\d) maxFrameMs=(\d{1,10}\.\d) foreground=([01])$/;
  const match = pattern.exec(line); if (!match) return null;
  const values = match.slice(1).map(Number);
  if (!values.every(Number.isFinite) || values[1] < 1000 || values[4] <= 0) return null;
  const [elapsedMs, windowMs, frames, fps, targetFps, avgFrameMs, p95FrameMs, maxFrameMs, foreground] = values;
  if (Math.abs(fps-frames*1000/windowMs) > 0.11 || p95FrameMs > maxFrameMs || avgFrameMs > maxFrameMs) return null;
  return {elapsedMs, windowMs, frames, fps, targetFps, avgFrameMs, p95FrameMs, maxFrameMs, foreground};
}
function createFPSMonitor(file, update = () => {}) {
  fs.writeFileSync(file, 'elapsed_ms,window_ms,frames,fps,target_fps,avg_frame_ms,p95_frame_ms,max_frame_ms,foreground\n', {flag: 'wx', mode: 0o600});
  const samples = [];
  let stopped = false;
  return {
    receive(line) {
      if (stopped) return false;
      const sample = parseFPS(line); if (!sample) return false;
      if (samples.length && sample.elapsedMs <= samples[samples.length-1].elapsedMs) return true;
      samples.push(sample); if (samples.length > 360) samples.shift();
      try { fs.appendFileSync(file, Object.values(sample).join(',')+'\n'); }
      catch { stopped = true; update({unavailable: true}); return true; }
      update({latest: sample, samples: samples.slice()});
      return true;
    },
    stop() { stopped = true; }
  };
}
module.exports = {parseFPS, createFPSMonitor};
