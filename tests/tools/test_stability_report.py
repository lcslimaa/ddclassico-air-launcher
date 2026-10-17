import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('stability_report', Path(__file__).resolve().parents[2] / 'tools/investigation/stability_report.py')
report = importlib.util.module_from_spec(spec)
spec.loader.exec_module(report)


class StabilityReportTests(unittest.TestCase):
    def log(self):
        prefix = '2026-10-12T23:40:00.000Z '
        return '\n'.join(prefix + line for line in [
            '[Helper lifecycle] Attempt started.',
            'Session captured from blocked startup request.',
            '[Session launcher] Bridge session accepted.',
            '[Startup stage] startup-resources-complete at 31403ms',
            '[Startup status] character-list HTTP 200',
            'user=SYNTHETIC_SECRET_NOT_A_CREDENTIAL&key=SYNTHETIC_SECRET_NOT_A_CREDENTIAL',
        ])

    def test_collect_omits_values_and_never_marks_gameplay_passed(self):
        run = report.collect_latest(self.log())
        self.assertTrue(run['resourcesLoaded'])
        self.assertTrue(run['bridgeAcknowledged'])
        self.assertNotIn('SYNTHETIC_SECRET', str(run))
        self.assertNotIn('authenticatedGameplay', run)
        self.assertNotIn('checks', run)

    def test_fresh_login_requires_manual_result_and_separate_completed_run(self):
        run = report.collect_latest(self.log())
        state = {'checks': {}}
        report.record_check(state, 'fresh_login_1', 'passed', run)
        with self.assertRaises(ValueError):
            report.record_check(state, 'fresh_login_2', 'passed', run)
        with self.assertRaises(ValueError):
            report.record_check(state, 'fresh_login_2', 'passed', {**run, 'resourcesLoaded': False})
        report.record_check(state, 'fresh_login_2', 'passed', {**run, 'runId': '2026-10-12T23:50:00.000Z'})
        self.assertEqual(state['checks']['fresh_login_2']['result'], 'passed')

    def test_latest_blocked_attempt_does_not_inherit_previous_startup_success(self):
        text = self.log() + '\n2026-10-12T23:50:00.000Z [Helper lifecycle] Attempt started.\n'
        run = report.collect_latest(text)
        self.assertFalse(run['bridgeAcknowledged'])
        self.assertFalse(run['resourcesLoaded'])

    def test_legacy_log_support_and_error_recording(self):
        text = self.log().replace('[Helper lifecycle] Attempt started.', 'Login required. Close any already-running original game or AIR prototype.')
        text += '\n2026-10-12T23:40:35.000Z [Session launcher] Uncaught runtime error ID: 1065. Raw details omitted.'
        run = report.collect_latest(text)
        self.assertEqual(run['runtimeErrorIDs'], ['1065'])


if __name__ == '__main__':
    unittest.main()
