"""Check current-document links and mirrored PT/EN filenames without network access."""
from pathlib import Path
import re
import sys
from urllib.parse import unquote

root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
errors=[]
files=[p for p in root.glob('*.md')]+[p for p in (root/'docs').rglob('*.md') if 'archive' not in p.relative_to(root/'docs').parts]
for p in files:
    text=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
    for destination in re.findall(r'\]\(([^)]+)\)',text):
        target=destination.strip().strip('<>').split('#',1)[0]
        if not target or re.match(r'[A-Za-z][A-Za-z0-9+.-]*:',target):continue
        if not (p.parent/unquote(target)).exists():errors.append(f'{p.relative_to(root)}: missing {target}')
sets=[]
for lang in ['pt-BR','en']:
    base=root/'docs'/lang
    sets.append({str(p.relative_to(base)) for p in base.rglob('*.md') if 'archive' not in p.relative_to(base).parts})
for missing in sorted(sets[0]^sets[1]): errors.append('Translation filename mismatch: '+missing)
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'Document links and PT/EN parity passed ({len(files)} current files; historical archive excluded).')
