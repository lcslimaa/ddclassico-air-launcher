#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/project-paths.sh"
: "${DDCLASSICO_AIR_SDK:?Set DDCLASSICO_AIR_SDK}"
probe_dir="$project_root/tools/investigation/air-probes"
build_dir="$project_root/build/probes"
mkdir -p "$build_dir"
for name in RuntimeCheck CompatibilityProbe BootstrapCheck; do
 "$DDCLASSICO_AIR_SDK/bin/amxmlc" -debug=true -compress=false -source-path="$probe_dir/src" -output="$build_dir/$name.swf" "$probe_dir/src/$name.as"
done
cp "$probe_dir/descriptors/"*.xml "$build_dir/"
cp "$project_root/config/examples/config.local-entry.json" "$build_dir/"
if [[ -f "$project_root/.local/config/probe.local.json" ]]; then cp "$project_root/.local/config/probe.local.json" "$build_dir/config.local.json"; fi
python3 - "$project_root" <<'CHECK'
from pathlib import Path
import json,hashlib,sys,shutil
root=Path(sys.argv[1]);paths=json.loads((root/'config/paths.json').read_text());source=root/paths['assets']/'swfs/368652e893fe.swf'
if source.exists():
 if hashlib.sha256(source.read_bytes()).hexdigest()!='368652e893fe5e08db22acbc94470fabe8a2034ff1a474f49b9ad83bb55ce10d':raise SystemExit('Local probe SWF hash mismatch')
 shutil.copyfile(source,root/'build/probes/Loading.local.swf')
CHECK
