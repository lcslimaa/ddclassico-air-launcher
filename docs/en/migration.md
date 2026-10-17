# Migration and file map

[Português](../pt-BR/migration.md) · [Índice](README.md)

The source is sibling folder `DDClassico_AIR_investigation`. It is preserved and must not run simultaneously with this copy. The new root is an independent repository, not a worktree or automatic replacement.

| Source | Destination |
|---|---|
| `login-helper/*.js` | `apps/login-helper/src/` (status preload under `ui/`) |
| `login-helper/status.html` | `apps/login-helper/ui/` |
| Productive `probe/src` | `apps/air-launcher/src/` |
| Diagnostic probes | `tools/investigation/air-probes/` |
| Launcher descriptors | `apps/air-launcher/descriptors/` |
| Common build | `scripts/build-air.sh` → `build/air/` |
| Adapter tools | `tools/adapter/` |
| Other tools | `tools/investigation/` |
| Python/Node tool tests | `tests/tools/` |
| Old documents | `docs/pt-BR/archive/` and `docs/en/archive/` |
| Minimum private resources | `.local/assets/` and `.local/evidence/` |
| New profiles/logs/leases | `.local/runtime/` |
| New caches | `.local/cache/` |

Authenticated profiles, session exports, process markers, HARs, caches and old logs were not copied. Required source/SWF build and adapter inputs were copied only into ignored local storage. The old folder retains other local material.

Imports, tests, helper entrypoint and scripts were updated. Electron versions and runtime descriptors were retained; SDK location is explicit configuration rather than a personal hardcoded path. Normal build no longer requires old probes’ configuration.

Git initialization and the initial commit publish nothing. Audit exclusions with `git status`, `git ls-files` and `git check-ignore`. The commit contains only selected project material, not `.local`, outputs or dependencies.

To roll back, close new processes and use the old folder’s scripts. Do not delete it in this phase. New-directory build/test success does not replace manual gameplay validation.
