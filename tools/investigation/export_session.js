// Run in the signed-in GAME WEBVIEW's DevTools console.
// Writes a private local JSON download. No network requests and no values logged.
(() => {
  const candidates = [...document.querySelectorAll('object, embed')];
  for (const element of candidates) {
    const params = Object.fromEntries([...element.querySelectorAll('param')].map(p => [p.name.toLowerCase(), p.value]));
    const raw = element.getAttribute('src') || element.getAttribute('data') || params.movie;
    if (!raw) continue;
    let url;
    try { url = new URL(raw, location.href); } catch { continue; }
    if (url.origin !== 'https://resource.ddclassico.com' || !/^\/flash\/(?:Loading|ddt_loading)\.swf$/i.test(url.pathname)) continue;
    const values = new URLSearchParams(element.getAttribute('flashvars') || params.flashvars || '');
    for (const [name, value] of url.searchParams) values.set(name, value);
    const parameters = Object.create(null);
    for (const [name, value] of values) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name)) throw new Error('Unexpected parameter name; export cancelled.');
      parameters[name] = value;
    }
    if (!parameters.user || !parameters.key || !parameters.config) throw new Error('Startup session is incomplete. Open the normal game page first.');
    const config = new URL(parameters.config);
    if (config.protocol !== 'https:' || !/(^|\.)ddclassico\.com$/i.test(config.hostname) || config.username || config.password || config.hash || (config.port && config.port !== '443') || !config.pathname.endsWith('/config.xml')) {
      throw new Error('Unexpected configuration origin/path; export cancelled.');
    }
    const session = {format: 'ddclassico-air-session-v1', exportedAt: Date.now(),
      entryUrl: url.origin + url.pathname, parameters};
    const text = JSON.stringify(session, null, 2);
    if (new TextEncoder().encode(text).length > 65536) throw new Error('Session file is unexpectedly large; export cancelled.');
    const blob = new Blob([text], {type: 'application/json'});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'ddclassico-air-session.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60000);
    return {result: 'Local session download requested', filename: link.download,
      parameterCount: Object.keys(parameters).length,
      next: 'Keep the file private. Close the original game, then import it in AIR promptly.'};
  }
  throw new Error('No supported game embedding found. Use the game webview console on the opened game page.');
})();
