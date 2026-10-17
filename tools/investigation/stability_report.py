"""Collect value-free startup evidence and explicitly record manual stability checks."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PATHS = json.loads((ROOT / 'config/paths.json').read_text())
ASSETS = ROOT / PATHS['assets']
EVIDENCE = ROOT / PATHS['evidence']
RUNTIME = ROOT / PATHS['runtime']
CHECKS = {
    'fresh_login_1': 'Fresh login 1: five minutes of interactive lobby play',
    'fresh_login_2': 'Fresh login 2: five minutes of interactive lobby play',
    'fresh_login_3': 'Fresh login 3: five minutes of interactive lobby play',
    'room_entry_exit': 'Enter and leave a room',
    'match_completion': 'Complete one ordinary match',
    'keyboard_controls': 'Keyboard controls',
    'mouse_input': 'Mouse input',
    'portuguese_chat': 'Portuguese text/chat',
    'focus_restore': 'Focus after switching applications',
    'window_resize': 'Resize window',
    'fullscreen': 'Fullscreen',
    'settings_persistence': 'Settings persist after restart',
    'network_drop_lobby': 'Interrupt and restore network while idle in lobby',
    'fresh_login_recovery': 'Recover through a fresh official login',
    'air_close_helper_open': 'Close AIR with helper open',
    'login_window_close_during_play': 'Close official login window during play',
    'helper_exit_during_play': 'Exit helper during play',
    'launch_while_air_open': 'Helper refuses a new login while tracked AIR is open',
}
STAGES = {'config-request', 'config-parsed', 'character-list-request', 'character-list-complete',
          'character-list-failed', 'registration-route', 'existing-character-route',
          'game-module-request', 'game-module-loaded', 'game-bootstrap-started', 'startup-resources-complete'}
RESULTS = ('passed', 'failed', 'not-tested')
STAMP = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z ')


def collect_latest(text):
    lines = text.splitlines()
    starts = [i for i, line in enumerate(lines) if STAMP.match(line) and '[Helper lifecycle] Attempt started.' in line]
    if not starts:
        starts = [i for i, line in enumerate(lines) if STAMP.match(line) and line.endswith('Login required. Close any already-running original game or AIR prototype.')]
    if not starts:
        raise ValueError('No helper attempt was found.')
    lines = lines[starts[-1]:]
    run = {'runId': lines[0].split(' ', 1)[0], 'sessionCaptured': False, 'bridgeAcknowledged': False,
           'resourcesLoaded': False, 'startupStagesMs': {}, 'runtimeErrorIDs': [], 'characterListHTTP': None}
    for line in lines:
        if not STAMP.match(line):
            continue
        message = line.split(' ', 1)[1]
        if message in ('Session captured from blocked startup request.', 'Session captured from website embedding.'):
            run['sessionCaptured'] = True
        elif message == '[Session launcher] Bridge session accepted.':
            run['bridgeAcknowledged'] = True
        stage = re.fullmatch(r'\[Startup stage\] ([a-z-]+) at (\d+)ms', message)
        if stage and stage[1] in STAGES:
            run['startupStagesMs'][stage[1]] = int(stage[2])
        status = re.fullmatch(r'\[Startup status\] character-list HTTP (\d{1,3})', message)
        if status:
            run['characterListHTTP'] = int(status[1])
        error = re.fullmatch(r'\[Session launcher\] Uncaught (?:I/O|sandbox|runtime) error ID: (\d+|unknown)\. Raw details omitted\.', message)
        if error:
            run['runtimeErrorIDs'].append(error[1])
    run['resourcesLoaded'] = 'startup-resources-complete' in run['startupStagesMs']
    return run


def record_check(state, case, result, run):
    if case not in CHECKS or result not in RESULTS:
        raise ValueError('Unknown stability check or result.')
    if case.startswith('fresh_login_') and result == 'passed':
        if not run or not run['bridgeAcknowledged'] or not run['resourcesLoaded']:
            raise ValueError('A completed automatic startup is required before recording interactive play.')
        for name, item in state['checks'].items():
            if name != case and name.startswith('fresh_login_') and item.get('result') == 'passed' and item.get('runId') == run['runId']:
                raise ValueError('Each interactive fresh-login check needs a different launch.')
    state['checks'][case] = {'result': result, 'source': 'Explicit manual test result',
                             'runId': run['runId'] if run else None}


def save(state, destination):
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps(state, indent=2) + '\n')
    temporary.replace(destination)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--collect-latest', action='store_true')
    parser.add_argument('--record', choices=CHECKS)
    parser.add_argument('--result', choices=RESULTS)
    args = parser.parse_args()
    if bool(args.record) != bool(args.result):
        parser.error('--record and --result must be used together')
    destination = EVIDENCE / 'stability-status.json'
    state = json.loads(destination.read_text())
    try:
        if args.collect_latest or args.record:
            run = collect_latest((RUNTIME / 'login-helper.log').read_text())
            state['runs'][run['runId']] = run
            if args.record:
                record_check(state, args.record, args.result, run)
            save(state, destination)
            print('Latest startup evidence collected. Gameplay results are recorded only by explicit manual confirmation.')
        for name, label in CHECKS.items():
            result = state['checks'].get(name, {}).get('result', 'not-tested')
            print(f'{result if result in RESULTS else "not-tested":10} {name}: {label}')
        print('Error 1065: observed once; cause unresolved. Absence in a later run is not a confirmed fix.')
    except (ValueError, OSError):
        print('Report could not be updated. A separate completed launch is required for each passed fresh-login check; inspect local diagnostics.')
        raise SystemExit(1)


if __name__ == '__main__':
    main()
