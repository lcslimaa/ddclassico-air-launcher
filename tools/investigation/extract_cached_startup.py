"""Extract validated startup SWFs from Chromium simple cache; never modify cache."""
import argparse
import hashlib
import json
import struct
import zlib
from pathlib import Path


def body(data):
    if len(data) < 72:
        raise ValueError('short cache entry')
    magic, version, key_size = struct.unpack_from('<QII', data)
    if magic != 0xfcfb6d1ba7725c30 or version != 5:
        raise ValueError('unsupported cache header')
    magic, flags, _, header_size, _ = struct.unpack_from('<QIIII', data, len(data)-24)
    if magic != 0xf4fa6f45970d41d8:
        raise ValueError('invalid cache footer')
    end = len(data)-24-(32 if flags & 2 else 0)-header_size-24
    start = 24+key_size
    if end < start:
        raise ValueError('invalid stream bounds')
    footer = struct.unpack_from('<QIIII', data, end)
    if footer[0] != 0xf4fa6f45970d41d8:
        raise ValueError('invalid body footer')
    payload = data[start:end]
    if footer[1] & 1 and zlib.crc32(payload) != footer[2]:
        raise ValueError('body CRC mismatch')
    return payload


def validate_swf(payload):
    if len(payload) < 8 or payload[:3] not in (b'FWS', b'CWS'):
        raise ValueError('not an FWS/CWS file')
    declared = struct.unpack_from('<I', payload, 4)[0]
    if declared > 64*1024*1024:
        raise ValueError('startup SWF exceeds size limit')
    if payload[:3] == b'CWS':
        dec = zlib.decompressobj()
        raw = dec.decompress(payload[8:], declared + 1)
        if not dec.eof or len(raw)+8 != declared:
            raise ValueError('incomplete or invalid compressed SWF')
    elif len(payload) != declared:
        raise ValueError('invalid SWF length')
    return declared


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('cache', type=Path)
    p.add_argument('--inventory', type=Path, default=Path('.local/evidence/cached-swfs.json'))
    p.add_argument('--out', type=Path, default=Path('.local/assets/swfs'))
    p.add_argument('--report', type=Path, default=Path('.local/evidence/extracted-swfs.json'))
    a = p.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    rows = []
    for entry in json.loads(a.inventory.read_text()):
        if not entry['url'].endswith(('/flash/Loading.swf', '/flash/ddt_loading.swf')):
            continue
        try:
            payload = body((a.cache / entry['file']).read_bytes())
            size = validate_swf(payload)
            digest = hashlib.sha256(payload).hexdigest()
            dest = a.out / (digest[:12]+'.swf')
            dest.write_bytes(payload)
            rows.append({'cacheFile': entry['file'], 'resource': entry['url'],
                         'extractedFile': str(dest), 'sha256': digest,
                         'swfVersion': payload[3], 'uncompressedBytes': size})
        except (OSError, ValueError, struct.error, zlib.error) as error:
            rows.append({'cacheFile': entry['file'], 'result': type(error).__name__,
                         'note': 'Invalid, incomplete or unsupported entry; not extracted.'})
    a.report.parent.mkdir(parents=True, exist_ok=True)
    a.report.write_text(json.dumps(rows, indent=2)+'\n')
    print(f"Validated {sum('sha256' in r for r in rows)} startup cache entries; unique files: {len({r['sha256'] for r in rows if 'sha256' in r})}")


if __name__ == '__main__':
    main()
