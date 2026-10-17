#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for script in "$root"/scripts/*.sh "$root"/run-*.sh; do
  bash -n "$script"
done
printf '%s\n' 'Shell syntax checks passed.'
