#!/bin/bash
set -euo pipefail
export DDCLASSICO_LAYOUT_PILOT=1
exec bash "$(dirname "$0")/run-login-helper.sh"
