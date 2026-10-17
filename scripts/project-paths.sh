#!/bin/bash
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_path() {
  python3 - "$project_root" "$1" <<'PYPATH'
import sys,json
from pathlib import Path
root=Path(sys.argv[1]);print(root/json.loads((root/'config/paths.json').read_text())[sys.argv[2]])
PYPATH
}
