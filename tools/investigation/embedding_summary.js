// Paste into the GAME WEBVIEW's DevTools console, not the launcher console.
// Reports parameter NAMES only. Does not transmit data or print FlashVars values.
(() => {
  const safeURL = value => {
    try {
      const u = new URL(value, location.href);
      return ['http:', 'https:'].includes(u.protocol) ? u.origin + u.pathname.replace(/\/\d+(?=\/|$)/g, '/[id]') : '[non-http-url]';
    } catch { return '[invalid-url]'; }
  };
  return [...document.querySelectorAll('object, embed')].map(element => {
    const params = Object.fromEntries([...element.querySelectorAll('param')].map(p => [p.name.toLowerCase(), p.value]));
    const vars = element.getAttribute('flashvars') || params.flashvars || '';
    const resource = element.getAttribute('src') || element.getAttribute('data') || params.movie || '';
    let urlNames = [];
    try { urlNames = [...new URL(resource, location.href).searchParams.keys()]; } catch {}
    const flashVarsNames = [...new Set(new URLSearchParams(vars).keys())];
    return {
      tag: element.tagName,
      resource: safeURL(resource),
      parameterNames: [...new Set([...flashVarsNames, ...urlNames])],
      flashVarsParameterNames: flashVarsNames,
      urlParameterNames: [...new Set(urlNames)],
      allowScriptAccess: element.getAttribute('allowscriptaccess') || params.allowscriptaccess || '[unset]'
    };
  });
})();
