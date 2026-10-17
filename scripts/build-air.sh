#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/project-paths.sh"
: "${DDCLASSICO_AIR_SDK:?Set DDCLASSICO_AIR_SDK to your AIR SDK directory}"
build_dir="$(project_path build)"
assets_dir="$(project_path assets)"
evidence_dir="$(project_path evidence)"
python3 - "$assets_dir" "$evidence_dir" <<'CHECK'
import sys,json,hashlib
from pathlib import Path
assets,evidence=map(Path,sys.argv[1:]);adapter=assets/'session-adapter/DDT_Loading.air.swf';meta=evidence/'session-adapter.json'
if not adapter.is_file() or not meta.is_file():raise SystemExit('Private adapter missing. See docs/en/build.md or docs/pt-BR/build.md.')
if hashlib.sha256(adapter.read_bytes()).hexdigest()!=json.loads(meta.read_text())['adaptedSHA256']:raise SystemExit('Private adapter hash mismatch; build stopped.')
CHECK
mkdir -p "$build_dir"
for name in SessionLauncher LayoutPilotLauncher; do
 "$DDCLASSICO_AIR_SDK/bin/amxmlc" -debug=true -compress=false -source-path="$project_root/apps/air-launcher/src" -output="$build_dir/$name.swf" "$project_root/apps/air-launcher/src/$name.as"
done
cp "$project_root/apps/air-launcher/descriptors/"*.xml "$build_dir/"
cp "$assets_dir/session-adapter/DDT_Loading.air.swf" "$build_dir/DDT_Loading.session.swf"
echo 'AIR launchers built; runtime/gameplay verification is separate.'
