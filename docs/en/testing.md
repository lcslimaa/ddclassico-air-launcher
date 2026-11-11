# Testing and acceptance

[Português](../pt-BR/testing.md) · [Índice](README.md)

## Automated checks

```bash
npm test
npm run check:docs
npm run build
npm run check:shell
```

`npm test` runs helper and Python/Node tooling tests. Coverage includes capture origin/frame ownership, single attempt, file handoff, ACK/timeout cleanup, PID leases, filtered logging and metrics. Fixtures are synthetic. Layout tests cover expected paths, not visual equivalence.

Build requires local resources; tests must not require an account or recovered game files. Running a copy without `.local/` verifies the separation. Missing SDK/adapter failures must be explicit.

## Manual acceptance after migration

1. Close old game/helper processes and start the new folder with a fresh session.
2. Confirm login and PvE entry. Record SDK/system/mode, never tokens.
3. Move/resize the window. Check 1000×600, mouse alignment, native controls and shutdown.
4. Compare HP, wind, active participant and clearing on match exit.
5. Test normal Space and a shell power-30 shot; confirm one shot and a 600-unit client request. Do not generalize acceptance to every dungeon.
6. Open/close F4 and verify no duplicate listeners or interrupted shell updates.
7. Verify memory/FPS CSVs with helper open and absence of retired instance recording.

Keep validation states separate: compiled, automated pass, user-reported local observation, and not tested. HTTP 200, completed SWF loading and ACK do not establish authentication. ADL has failed in this agent environment during Launch Services initialization before application startup; report this limitation rather than replacing it with logic-test success.

## Lobby FPS diagnostics

Restart both the helper and AIR to load the updated build. Keep the helper open while recording. With the game window focused, press the corresponding key just after each action (use Fn on Mac if needed):

| Key | Manual marker |
|---|---|
| F6 | Baseline, alone in the lobby |
| F7 | Invitation sent |
| F8 | Player joined |
| F9 | Player left |
| F10 | You left the lobby |

Allow approximately 15 seconds between steps when possible. Markers are user annotations, not automatic detection of server events. Repeat with another lobby for comparison.

`.local/runtime/login-helper.log` records markers and window state (activation, minimization and closing, also sampled every 5 seconds). Files in `.local/runtime/memory/` share a per-run prefix: `.csv` for AIR memory, `.fps.csv` for FPS and `.process.csv` for AIR process CPU and resident memory. `elapsed_ms` aligns metrics with the AIR clock; `utc_ms` timestamps process collection. CPU is calculated from differences in cumulative process CPU time between readings: 100% means one fully occupied core and values can exceed 100%. The first reading establishes the baseline without a CPU row. Collection uses `ps` on macOS and excludes process arguments, player names and session parameters.

These metrics distinguish CPU increases, window changes and FPS drops; they do not attribute time to functions or measure GPU usage. An execution profile is still needed to identify expensive functions. Collection failures are logged without interrupting the game.
