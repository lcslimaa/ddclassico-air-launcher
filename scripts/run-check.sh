#!/bin/bash
set -euo pipefail
source "$(dirname "$0")/project-paths.sh"
: "${DDCLASSICO_AIR_SDK:?Set DDCLASSICO_AIR_SDK}"
mode="${1:-runtime}"
case "$mode" in
 runtime) descriptor=runtime-check.xml;;
 game) descriptor=application.xml;;
 local) descriptor=local-entry.xml;;
 config) descriptor=bootstrap-check.xml;;
 session) descriptor=session-launcher.xml;;
 *) echo 'Usage: run-check.sh [runtime|game|local|config|session]' >&2;exit 2;;
esac
build_dir="$project_root/build/probes"
if [[ "$mode" == session ]]; then build_dir="$(project_path build)"; fi
if [[ ! -f "$build_dir/$descriptor" ]]; then echo 'Build missing: run build-air.sh or build-probes.sh.' >&2;exit 1;fi
log_dir="$(project_path runtime)/diagnostics"
mkdir -p "$log_dir"
"$DDCLASSICO_AIR_SDK/bin/adl" "$build_dir/$descriptor" "$build_dir" 2>&1 | tee -a "$log_dir/$mode.log"
