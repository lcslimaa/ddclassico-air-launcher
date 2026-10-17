"""Inventory static game cache URLs without exporting query values or cookies."""
import argparse
import json
import struct
from pathlib import Path
from urllib.parse import urlsplit
from analyze_har import resource_url


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('cache', type=Path)
    p.add_argument('--out', type=Path, required=True)
    a = p.parse_args()
    rows = []
    for f in a.cache.glob('*_0'):
        try:
            with f.open('rb') as h:
                header = h.read(24)
                if len(header) != 24 or struct.unpack_from('<Q', header)[0] != 0xfcfb6d1ba7725c30:
                    continue
                n = struct.unpack_from('<I', header, 12)[0]
                if n > 65536:
                    continue
                key = h.read(n).decode(errors='replace')
            pos = key.find('http')
            if pos < 0:
                continue
            u = urlsplit(key[pos:])
            if u.hostname != 'resource.ddclassico.com':
                continue
            if not u.path.lower().endswith(('.swf', '.png', '.xml', '.js')):
                continue
            rows.append({'file': f.name, 'url': resource_url(key[pos:]), 'cacheBytes': f.stat().st_size})
        except (OSError, ValueError, struct.error):
            continue
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(rows, indent=2)+'\n')
    print(f'Inventoried {len(rows)} static resource cache entries')
    for suffix in ['/2.png', '/air_register.swf', '/config.xml']:
        matches = [r['url'] for r in rows if '/flash' in r['url'] and r['url'].endswith(suffix)]
        print(suffix, 'entries:', len(matches), 'distinct resources:', sorted(set(matches)))


if __name__ == '__main__':
    main()
