import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]

class ProjectLayoutTests(unittest.TestCase):
    def test_shared_paths_and_runtime_entrypoints_exist(self):
        config = ROOT / 'config/paths.json'
        self.assertTrue(config.is_file(), 'Shared path configuration missing')
        paths = json.loads(config.read_text())
        for name in ['assets', 'evidence', 'runtime', 'cache', 'captures', 'build']:
            self.assertFalse(Path(paths[name]).is_absolute())
            self.assertNotIn('..', Path(paths[name]).parts)
        for name in ['build-air.sh','run-login-helper.sh','run-layout-pilot.sh']:
            self.assertTrue((ROOT/'scripts'/name).is_file())
        self.assertTrue((ROOT/'apps/login-helper/src/main.js').is_file())
        self.assertTrue((ROOT/'apps/air-launcher/src/SessionLauncher.as').is_file())

if __name__ == '__main__': unittest.main()
