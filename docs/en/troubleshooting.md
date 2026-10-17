# Troubleshooting and maintenance

[Português](../pt-BR/troubleshooting.md) · [Índice](README.md)

| Symptom | First check |
|---|---|
| Missing SDK | Set `DDCLASSICO_AIR_SDK`; check `bin/amxmlc` and `bin/adl` |
| Missing/mismatched adapter | Check local inputs and metadata; do not bypass hash checks to run another version |
| Session rejection/disconnect | Restart through official login with fresh parameters; do not copy old tokens |
| Another AIR process active | Close the tracked process; do not delete a valid lease to launch another session |
| Stretched game | Check integrated-mode `NO_SCALE` guard and compiled version |
| Misaligned clicks | Compare content/screen origin after native chrome or monitor changes |
| Unavailable field | Getter/domain can vary by version; do not automatically substitute zero |
| Error 1065 | Missing class/definition; investigate module and context before creating a replacement |
| Helper remains in terminal | Another helper window may still be open; AIR is a separate process |

Error 1065 appeared in different contexts during investigation; no universal fix is established. A specific missing class requires module/resource analysis, not an empty replacement class.

## Historical tools

`tools/investigation` contains HAR analysis, cache inventory, SWF extraction, manual exporters and stability reports. These are investigation tools, not required steps for current login. HARs and exports may contain credentials/responses; keep them under `.local/captures`, not in issues.

Older AIR probes live in `tools/investigation/air-probes`. Build separately with `bash scripts/build-probes.sh`, then run `bash scripts/run-check.sh runtime` for the basic check. Local configuration and logs remain ignored. Historical `game`, `local`, `config` and `session` modes stay explicit; `session` is manual and does not create authentication.

Before updating Electron, SDK or bootstrap, record versions, run tests and repeat live acceptance. This reorganization introduces neither automatic updates nor Windows packaging.
