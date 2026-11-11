'use strict';

const OFFICIAL_URLS = [
  'https://ddclassico.com/*',
  'https://*.ddclassico.com/*',
  'wss://ddclassico.com/*',
  'wss://*.ddclassico.com/*'
];
const MAX_EVENTS = 400;
const SAFE_QUERY_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,31}$/;
const SAFE_MIME = /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i;
const ID_ROUTE_SEGMENTS = new Set([
  'user', 'users', 'account', 'accounts', 'player', 'players', 'profile',
  'session', 'token', 'key', 'character', 'order', 'invite'
]);
const ROUTE_WORDS = new Set([
  'login', 'logout', 'list', 'status', 'info', 'validate', 'refresh',
  'select', 'create', 'start', 'check', 'current', 'all'
]);

function officialURL(raw) {
  try {
    const url = new URL(raw);
    return (url.protocol === 'https:' || url.protocol === 'wss:') &&
      (url.hostname === 'ddclassico.com' || url.hostname.endsWith('.ddclassico.com'))
      ? url
      : null;
  } catch {
    return null;
  }
}

function safePathname(pathname) {
  let previous = '';
  return pathname.split('/').map(segment => {
    if (!segment) return '';
    let decoded;
    try { decoded = decodeURIComponent(segment); }
    catch { return ':redacted'; }
    const parentExpectsId = ID_ROUTE_SEGMENTS.has(previous.toLowerCase()) &&
      !ROUTE_WORDS.has(decoded.toLowerCase());
    if (parentExpectsId || /\p{Cc}/u.test(decoded) || decoded.includes('@') ||
        /^\d{4,}$/.test(decoded) ||
        /\d{6,}/.test(decoded) ||
        /^[0-9a-f]{12,}$/i.test(decoded) ||
        /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(decoded) ||
        (decoded.length > 40 && /^[A-Za-z0-9._~-]+$/.test(decoded))) {
      previous = segment;
      return ':redacted';
    }
    previous = decoded;
    return encodeURIComponent(decoded).replace(/%3A/gi, ':').replace(/%40/gi, '@');
  }).join('/').slice(0, 180) || '/';
}

function safeQueryKeys(raw) {
  const url = officialURL(raw);
  if (!url) return '';
  const keys = [...new Set([...url.searchParams.keys()]
    .filter(key => SAFE_QUERY_NAME.test(key)))].sort();
  const shown = keys.slice(0, 12);
  if (keys.length > shown.length) shown.push('+' + (keys.length - shown.length) + 'more');
  return shown.length ? ' queryKeys=' + shown.join(',') : '';
}

function safeContentType(headers) {
  if (!headers || typeof headers !== 'object') return 'unknown';
  const name = Object.keys(headers).find(key => key.toLowerCase() === 'content-type');
  if (!name) return 'unknown';
  const entry = Array.isArray(headers[name]) ? headers[name][0] : headers[name];
  const raw = entry && typeof entry === 'object' ? entry.value : entry;
  const mime = String(raw || '').split(';', 1)[0].trim().toLowerCase();
  return SAFE_MIME.test(mime) ? mime : 'unknown';
}

function safeRequest(details) {
  const url = officialURL(details?.url);
  if (!url) return null;
  const method = /^[A-Za-z]{1,12}$/.test(details.method || '')
    ? details.method.toUpperCase() : 'OTHER';
  const type = /^[A-Za-z]{1,24}$/.test(details.resourceType || '')
    ? details.resourceType : 'other';
  return {
    method,
    route: url.hostname + safePathname(url.pathname),
    type,
    query: safeQueryKeys(details.url)
  };
}

function installRequestLog(webRequest, note) {
  let logged = 0;
  let capped = false;
  let userAgentLogged = false;
  const record = (details, outcome) => {
    const request = safeRequest(details);
    if (!request) return;
    if (logged >= MAX_EVENTS) {
      if (!capped) {
        capped = true;
        note('[Network] event log limit reached; later events omitted.');
      }
      return;
    }
    logged += 1;
    const common = `[Network] ${request.method} ${request.route} type=${request.type}${request.query}`;
    if (outcome.kind === 'error') {
      const error = /^[A-Z0-9_:-]{1,64}$/.test(details.error || '') ? details.error : 'other';
      note(`${common} error=${error}`);
      return;
    }
    const status = Number.isInteger(details.statusCode) ? details.statusCode : 0;
    if (outcome.kind === 'redirect') {
      const target = safeRequest({url: details.redirectURL, method: details.method,
        resourceType: details.resourceType});
      const destination = target ? target.route + target.query : 'external';
      note(`[Network] redirect ${request.method} ${request.route}${request.query} status=${status} to=${destination}`);
      return;
    }
    const cache = details.fromCache ? 'yes' : 'no';
    note(`${common} status=${status} contentType=${safeContentType(details.responseHeaders)} cache=${cache}`);
  };

  // Keep request interception/cancellation in main.js; these passive hooks only
  // observe response, redirect and WebSocket-handshake metadata only.
  webRequest.onBeforeRedirect({urls: OFFICIAL_URLS}, details => record(details, {kind: 'redirect'}));
  webRequest.onSendHeaders({urls: ['https://ddclassico.com/*']}, details => {
    if (userAgentLogged || details.resourceType !== 'mainFrame') return;
    userAgentLogged = true;
    const name = Object.keys(details.requestHeaders || {}).find(key => key.toLowerCase() === 'user-agent');
    const userAgent = name ? String(details.requestHeaders[name]) : '';
    const electron = /\bElectron\/\d/i.test(userAgent);
    const ddclassicoProductToken = /\b(?:DDTankClassico|DDClassico)\/\d/i.test(userAgent);
    note(`[Network] mainFrame clientContext electron=${electron} ddclassicoProductToken=${ddclassicoProductToken}`);
  });
  webRequest.onCompleted({urls: OFFICIAL_URLS}, details => record(details, {kind: 'completed'}));
  webRequest.onErrorOccurred({urls: OFFICIAL_URLS}, details => record(details, {kind: 'error'}));
}

module.exports = {installRequestLog, safePathname, safeQueryKeys, safeRequest};
