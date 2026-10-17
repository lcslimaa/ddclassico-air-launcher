"""Locate browser/runtime dependencies without printing string literals."""
import argparse
import json
import re
from pathlib import Path

PATTERNS = {
    'javascript_bridge': r'\bExternalInterface\s*\.\s*(?:call|addCallback|available)',
    'startup_parameters': r'\b(?:loaderInfo|LoaderInfo)\b.*?\bparameters\b',
    'network': r'\b(?:URLRequest|URLLoader|Socket|XMLSocket|NetConnection)\b',
    'navigation': r'\b(?:navigateToURL|fscommand)\s*\(',
    'persistence': r'\bSharedObject\b',
    'runtime_assumption': r'\bCapabilities\s*\.\s*(?:playerType|version|os)',
    'dynamic_loading': r'\b(?:loadBytes|ApplicationDomain|LoaderContext)\b',
}


def scan(root):
    rows = []
    for f in sorted(root.rglob('*.as')):
        for line, text in enumerate(f.read_text(errors='replace').splitlines(), 1):
            for category, pattern in PATTERNS.items():
                if re.search(pattern, text):
                    rows.append({'file': str(f.relative_to(root)), 'line': line, 'category': category})
    return {'findings': rows, 'note': 'Heuristic candidates only; inspect referenced code to confirm behavior. No literal values exported.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('scripts', type=Path)
    p.add_argument('--out', type=Path, required=True)
    a = p.parse_args()
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(scan(a.scripts), indent=2) + '\n')
