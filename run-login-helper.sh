#!/bin/bash
set -euo pipefail
exec bash "$(dirname "$0")/scripts/run-login-helper.sh" "$@"
