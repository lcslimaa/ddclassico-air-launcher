'use strict';

// Shared by the sandboxed DOM observer, the main process and synthetic tests.
function isOfficialPage(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && /(^|\.)ddclassico\.com$/i.test(url.hostname) &&
      !url.username && !url.password && (!url.port || url.port === '443');
  } catch { return false; }
}

function isStartupURL(raw) {
  try {
    const url = new URL(raw);
    return url.origin === 'https://resource.ddclassico.com' &&
      !url.username && !url.password && !url.hash &&
      /^\/flash\/(Loading|ddt_loading)\.swf$/i.test(url.pathname);
  } catch { return false; }
}

function validateSession(value, now = Date.now()) {
  if (!value || value.format !== 'ddclassico-air-session-v1' ||
      !Number.isFinite(value.exportedAt) || now - value.exportedAt > 600000 ||
      now - value.exportedAt < -60000) throw new Error('Invalid session format or local age.');
  if (!isStartupURL(value.entryUrl) || new URL(value.entryUrl).search) throw new Error('Invalid entry resource.');
  if (!value.parameters || typeof value.parameters !== 'object' || Array.isArray(value.parameters)) {
    throw new Error('Invalid parameter object.');
  }
  const parameters = Object.create(null);
  for (const [name, parameter] of Object.entries(value.parameters)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || typeof parameter !== 'string' || parameter.length > 8192) {
      throw new Error('Invalid launch parameter.');
    }
    parameters[name] = parameter;
  }
  if (['user', 'key', 'config', 'token', 'rand'].some(name => !parameters[name])) {
    throw new Error('Incomplete launch parameters.');
  }
  const config = new URL(parameters.config);
  if (!isOfficialPage(config.href) || config.hash || !config.pathname.endsWith('/config.xml')) {
    throw new Error('Invalid configuration resource.');
  }
  const result = {format: value.format, exportedAt: value.exportedAt, entryUrl: value.entryUrl, parameters};
  if (new TextEncoder().encode(JSON.stringify(result)).length > 65536) throw new Error('Session exceeds 64 KB.');
  return result;
}

function sessionFromStartupRequest(raw, now = Date.now()) {
  if (!isStartupURL(raw)) return null;
  const url = new URL(raw);
  const parameters = Object.create(null);
  for (const [name, parameter] of url.searchParams) parameters[name] = parameter;
  if (['user', 'key', 'config', 'token', 'rand'].some(name => !parameters[name])) return null;
  return validateSession({format: 'ddclassico-air-session-v1', exportedAt: now,
    entryUrl: url.origin + url.pathname, parameters}, now);
}

function trustedStartupRequest(details, contents) {
  if (!contents || contents.isDestroyed?.() || !isOfficialPage(contents.mainFrame?.url)) return false;
  const owned = details.webContents === contents ||
    (Number.isInteger(contents.id) && details.webContentsId === contents.id);
  if (!owned) return false;
  // Prefer Chromium's initiating origin. An external iframe must not initiate AIR.
  if (details.initiatorOrigin !== undefined) return isOfficialPage(details.initiatorOrigin);
  return isOfficialPage(details.frame?.url);
}

function missingStartupFields(raw) {
  const url = new URL(raw);
  return ['user', 'key', 'config', 'token', 'rand'].filter(name => !url.searchParams.get(name));
}

function sessionFromEmbedding(element, baseURL, now = Date.now()) {
  if (!isOfficialPage(baseURL)) return null;
  const params = Object.create(null);
  for (const item of element.querySelectorAll('param')) {
    const name = item.getAttribute('name');
    if (name) params[name.toLowerCase()] = item.getAttribute('value') || '';
  }
  const raw = element.getAttribute('src') || element.getAttribute('data') || params.movie;
  if (!raw) return null;
  let url;
  try { url = new URL(raw, baseURL); } catch { return null; }
  if (!isStartupURL(url.href)) return null;
  const merged = new URLSearchParams(element.getAttribute('flashvars') || params.flashvars || '');
  for (const [name, parameter] of url.searchParams) merged.set(name, parameter);
  const parameters = Object.create(null);
  for (const [name, parameter] of merged) parameters[name] = parameter;
  // An inserted object can receive its parameters over multiple DOM updates.
  if (['user', 'key', 'config', 'token', 'rand'].some(name => !parameters[name])) return null;
  return validateSession({format: 'ddclassico-air-session-v1', exportedAt: now,
    entryUrl: url.origin + url.pathname, parameters}, now);
}

function observeEmbeddings(document, baseURL, Observer, receive, problem, schedule = queueMicrotask) {
  let captured = false;
  let pending = false;
  const scan = () => {
    pending = false;
    if (captured) return;
    for (const element of document.querySelectorAll('object, embed, iframe')) {
      try {
        const value = sessionFromEmbedding(element, baseURL());
        if (!value) continue;
        captured = true;
        observer.disconnect();
        receive(value);
        return;
      } catch { problem(); }
    }
  };
  const observer = new Observer(() => {
    if (!pending && !captured) { pending = true; schedule(scan); }
  });
  observer.observe(document, {subtree: true, childList: true, attributes: true,
    attributeFilter: ['src', 'data', 'flashvars', 'name', 'value']});
  scan();
  return () => { captured = true; observer.disconnect(); };
}

if (typeof module !== 'undefined') module.exports = {
  isOfficialPage, isStartupURL, validateSession, sessionFromEmbedding, observeEmbeddings,
  sessionFromStartupRequest, trustedStartupRequest, missingStartupFields
};
