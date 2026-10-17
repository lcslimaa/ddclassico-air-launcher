import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'tools/investigation'))
from analyze_har import summarize, resource_url


class CaptureTests(unittest.TestCase):
    def test_secrets_are_not_exported(self):
        secret = 'NEVER_EXPORT_THIS'
        e = {'request': {'url': 'https://user:pass@example.com/playgame/123?token=' + secret + '#' + secret,
                         'headers': [{'name': 'Cookie', 'value': secret}], 'postData': {'text': secret}},
             'response': {'status': 200, 'headers': [{'name': 'Set-Cookie', 'value': secret},
                            {'name': 'Cache-Control', 'value': 'private, max-age=60'}],
                          'content': {'text': secret, 'mimeType': 'text/html'}}}
        import json
        result = summarize({'log': {'entries': [e]}})
        text = json.dumps(result)
        self.assertNotIn(secret, text)
        self.assertNotIn('user:pass', text)
        self.assertEqual(result['entries'][0]['url'], 'https://example.com/playgame/[id]')
        self.assertTrue(result['entries'][0]['hasCookieHeader'])
        self.assertEqual(result['entries'][0]['cacheControlDirectives'], ['private', 'max-age=60'])

    def test_cache_and_swf_detection(self):
        rows = summarize({'log': {'entries': [
            {'request': {'url': 'https://example.com/a.swf?v=2'}, 'response': {'status': 304}},
            {'request': {'url': 'https://example.com/download'}, 'response': {'status': 200, '_transferSize': 0,
                'content': {'mimeType': 'application/x-shockwave-flash'}}}
        ]}})
        self.assertEqual(rows['swfRequests'], 2)
        self.assertEqual(rows['entries'][0]['cacheSignal'], 'revalidated')
        self.assertEqual(rows['entries'][1]['cacheSignal'], 'zero-transfer-ambiguous')

    def test_invalid_urls(self):
        self.assertEqual(resource_url('data:secret'), '[non-http-url]')
        self.assertEqual(resource_url('https://['), '[invalid-url]')


if __name__ == '__main__':
    unittest.main()
