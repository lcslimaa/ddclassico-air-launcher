const { ipcRenderer } = require('electron');
ipcRenderer.on('helper-status', (_event, messages) => {
  const render = () => {
    const status = document.getElementById('status');
    if (status) status.textContent = messages.join('\n\n');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once: true});
  else render();
});
ipcRenderer.on('helper-fps', (_event, value) => {
  const label = document.getElementById('fps-values'); if (!label) return;
  if (value.unavailable) { label.textContent = 'FPS recording unavailable. The in-game counter still works.'; return; }
  const latest = value.latest;
  label.textContent = latest.fps.toFixed(1)+' FPS / target '+latest.targetFps.toFixed(1)+
    ' · Average '+latest.avgFrameMs.toFixed(1)+' ms · P95 '+latest.p95FrameMs.toFixed(1)+
    ' ms · Worst '+latest.maxFrameMs.toFixed(1)+' ms'+(latest.foreground ? '' : ' · Background window');
  const canvas = document.getElementById('fps-chart'); const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  const samples = value.samples, start = samples[0].elapsedMs;
  const span = Math.max(1, latest.elapsedMs-start);
  const maximum = Math.max(1, ...samples.map(s => Math.max(s.fps, s.targetFps)));
  for (const [field, color] of [['targetFps', '#a0a6b0'], ['fps', '#8cdd9a']]) {
    context.strokeStyle = color; context.beginPath(); let connected = false;
    for (const sample of samples) {
      if (field === 'fps' && !sample.foreground) { connected = false; continue; }
      const x = (sample.elapsedMs-start)/span*canvas.width;
      const y = canvas.height-5-sample[field]/maximum*(canvas.height-10);
      if (connected) context.lineTo(x, y); else context.moveTo(x, y);
      connected = true;
    }
    context.stroke();
  }
});
ipcRenderer.on('helper-memory', (_event, value) => {
  const latest = value.latest;
  const mib = bytes => (bytes/1048576).toFixed(1);
  const values = document.getElementById('memory-values');
  if (!values) return;
  values.textContent = 'AIR allocations: '+mib(latest.allocatedBytes)+' MiB · Free: '+
    mib(latest.freeBytes)+' MiB · Process private: '+mib(latest.privateBytes)+' MiB · '+
    (latest.elapsedMs/60000).toFixed(1)+' min';
  document.getElementById('memory-trend').textContent = value.analysis.label;
  const canvas = document.getElementById('memory-chart');
  const context = canvas.getContext('2d'); context.clearRect(0, 0, canvas.width, canvas.height);
  const samples = value.samples;
  const maximum = Math.max(1, ...samples.map(s => Math.max(s.allocatedBytes, s.privateBytes)));
  const start = samples[0].elapsedMs, span = Math.max(1, latest.elapsedMs-start);
  for (const [field, color] of [['allocatedBytes', '#76c9ff'], ['privateBytes', '#f2bc68']]) {
    context.strokeStyle = color; context.beginPath();
    samples.forEach((sample, i) => {
      const x = (sample.elapsedMs-start)/span*canvas.width;
      const y = canvas.height-5-sample[field]/maximum*(canvas.height-10);
      if (i) context.lineTo(x, y); else context.moveTo(x, y);
    });
    context.stroke();
  }
});
