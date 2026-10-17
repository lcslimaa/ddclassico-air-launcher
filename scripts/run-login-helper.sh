#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/project-paths.sh"
: "${DDCLASSICO_AIR_SDK:?Set DDCLASSICO_AIR_SDK to your AIR SDK directory}"
build_dir="$(project_path build)"
if [[ ! -x "$DDCLASSICO_AIR_SDK/bin/adl" || ! -f "$build_dir/SessionLauncher.swf" || ! -f "$build_dir/DDT_Loading.session.swf" ]]; then
 echo 'AIR SDK or build missing. Run npm run build first.' >&2; exit 1
fi
if [[ "${DDCLASSICO_LAYOUT_PILOT:-0}" == 1 && (! -f "$build_dir/layout-pilot.xml" || ! -f "$build_dir/LayoutPilotLauncher.swf") ]]; then
 echo 'Layout pilot build missing.' >&2; exit 1
fi
cache_dir="$(project_path cache)"
mkdir -p "$cache_dir/npm" "$cache_dir/electron"
export npm_config_cache="$cache_dir/npm" ELECTRON_CACHE="$cache_dir/electron"
unset ELECTRON_RUN_AS_NODE
cd "$project_root/apps/login-helper"
expected="$(node -p "require('./package.json').devDependencies.electron")"
installed="$(node -e "try { process.stdout.write(require('./node_modules/electron/package.json').version); } catch {}")"
if [[ ! -f node_modules/electron/path.txt || "$installed" != "$expected" ]]; then npm ci --no-audit --no-fund; fi
npm start
