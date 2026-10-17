"""Summarize a local HAR without exporting credentials or response bodies."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit


def resource_url(value):
    try:
        u = urlsplit(value)
        if u.scheme not in ('http', 'https') or not u.hostname:
            return '[non-http-url]'
        # Keep stable resource names; suppress likely identifiers in route segments.
        path = '/'.join('[id]' if re.fullmatch(r'\d+|[a-fA-F0-9]{24,}|[A-Za-z0-9_-]{40,}', p) else p
                        for p in u.path.split('/'))
        return u.scheme + '://' + u.hostname + path
    except ValueError:
        return '[invalid-url]'


def summarize(har):
    rows = []
    for e in har.get('log', {}).get('entries', []):
        req, res = e.get('request', {}), e.get('response', {})
        content = res.get('content', {})
        url = resource_url(req.get('url', ''))
        mime = content.get('mimeType', '').split(';')[0]
        kind = ('swf' if url.lower().endswith('.swf') or mime == 'application/x-shockwave-flash'
                else 'page' if mime == 'text/html'
                else 'config' if mime in ('application/json', 'text/xml', 'application/xml')
                else 'other')
        headers = {h.get('name', '').lower(): h.get('value', '') for h in res.get('headers', [])}
        cc = headers.get('cache-control', '')
        directives = re.findall(r'(?:^|,)\s*(no-store|no-cache|private|public|must-revalidate|max-age=\d+|s-maxage=\d+)(?=\s*(?:,|$))', cc)
        cache = e.get('cache', {})
        size = res.get('_transferSize')
        signal = ('revalidated' if res.get('status') == 304 else
                  'reported-cache-hit' if e.get('_fromCache') or res.get('_fromDiskCache') or res.get('_fromMemoryCache') else
                  'zero-transfer-ambiguous' if size == 0 else 'unknown')
        rows.append({'url': url, 'kind': kind, 'status': res.get('status'),
                     'durationMs': e.get('time'), 'bodyBytes': res.get('bodySize'),
                     'transferBytes': size, 'cacheSignal': signal,
                     'cacheControlDirectives': directives,
                     'hasETag': 'etag' in headers, 'hasLastModified': 'last-modified' in headers,
                     'hasCookieHeader': any(h.get('name', '').lower() == 'cookie' for h in req.get('headers', [])),
                     'hasAuthorizationHeader': any(h.get('name', '').lower() == 'authorization' for h in req.get('headers', [])),
                     'hasSetCookieHeader': 'set-cookie' in headers,
                     'hasHARCacheMetadata': bool(cache)})
    return {'entries': rows, 'swfRequests': sum(r['kind'] == 'swf' for r in rows),
            'note': 'Queries, fragments, credentials, headers values and response bodies are omitted. Cache signals require interpretation. Review URLs before sharing.'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('har', type=Path)
    p.add_argument('--out', type=Path, required=True)
    a = p.parse_args()
    result = summarize(json.loads(a.har.read_text()))
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(result, indent=2) + '\n')
    print(f"Analyzed {len(result['entries'])} requests; {result['swfRequests']} SWF requests. Saved summary to {a.out}")


if __name__ == '__main__':
    main()
