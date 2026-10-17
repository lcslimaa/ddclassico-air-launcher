# Component map

[Português](../pt-BR/components.md) · [Índice](README.md)

| Component | Responsibility and dependencies |
|---|---|
| `main.js` | Login windows, official navigation, IPC, telemetry setup and handoff |
| `capture.js` | Launch detection and parameter/origin validation |
| `handoff.js` | Temporary file, ADL subprocess, ACK, timeout and allowed diagnostics |
| `air-lease.js` | PID-based exclusion and lease-owner identity |
| `memory-monitor.js` / `fps-monitor.js` | Private numeric CSVs and bounded history |
| `SessionLauncher.as` | Session intake, bootstrap loading, telemetry and window coordination |
| `SessionFile.as` | Local `ddclassico-air-session-v1` contract validation |
| `LayoutPilotLauncher.as` | Integrated-shell entry while retaining classic entry |
| `LauncherShell.as` | Layout, graphs, participants and explicit power input |
| `MatchPanel.as` | Model discovery, snapshots, optional companion and shared shot controller |

## Contracts

The subprocess receives `--bridge-session` and a file path, never credentials as command arguments. A fixed ACK means AIR accepted the local session, not that the server authenticated it.

The shell receives selected-field snapshots through a callback about every 500 ms. Both views use one controller to avoid duplicate listeners and requests. Missing values and match transitions must clear visible state.

`config/paths.json` defines assets, evidence, runtime, caches, captures and build relative to the root. The helper reads it through `project-paths.js`; shell scripts and adapter/stability tools consume it too. Investigation tools retain explicit input/output arguments; documented defaults use local directories.

## Technical debt

`MatchPanel` still combines model observation, visualization and power controls. `SessionLauncher` still coordinates several responsibilities. This migration preserves these contracts. Future controller/model/view extraction should be a separate refactor with live behavior comparisons.
