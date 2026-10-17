from pathlib import Path
import subprocess
import tempfile
import unittest

CHECK = Path(__file__).resolve().parents[2] / 'scripts/check-docs.py'
class DocsCheckTests(unittest.TestCase):
    def test_relative_link_validation_and_translation_parity(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            for lang in ['pt-BR','en']:
                d=root/'docs'/lang;d.mkdir(parents=True)
                (d/'README.md').write_text('[Guide](guide.md)\n')
                (d/'guide.md').write_text('# Guide\n')
            def run(): return subprocess.run(['python3',str(CHECK),str(root)],capture_output=True,text=True)
            self.assertEqual(run().returncode,0)
            (root/'docs/en/guide.md').unlink()
            result=run();self.assertEqual(result.returncode,1)
            self.assertIn('guide.md',result.stdout)
