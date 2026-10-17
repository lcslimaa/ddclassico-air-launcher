import struct
import sys
import unittest
import zlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools/investigation'))
from extract_cached_startup import body, validate_swf


class CacheTests(unittest.TestCase):
    def test_cache_stream_boundaries_and_crc(self):
        key, payload, headers = b'https://example.com/a.swf', b'PAYLOAD', b'HEADERS'
        footer = lambda flags, crc, size: struct.pack('<QIIII', 0xf4fa6f45970d41d8, flags, crc, size, 0)
        data = (struct.pack('<QIIII', 0xfcfb6d1ba7725c30, 5, len(key), 0, 0) + key + payload
                + footer(1, zlib.crc32(payload), 0) + headers + bytes(32) + footer(2, 0, len(headers)))
        self.assertEqual(body(data), payload)
        with self.assertRaises(ValueError):
            body(data.replace(payload, b'CHANGED'))

    def test_compressed_swf_and_truncation(self):
        raw = bytes(range(100))
        swf = b'CWS' + bytes([17]) + struct.pack('<I', len(raw)+8) + zlib.compress(raw)
        self.assertEqual(validate_swf(swf), len(raw)+8)
        with self.assertRaises(ValueError):
            validate_swf(swf[:-3])

    def test_unsupported_entry(self):
        with self.assertRaises(ValueError):
            body(bytes(100))


if __name__ == '__main__':
    unittest.main()
