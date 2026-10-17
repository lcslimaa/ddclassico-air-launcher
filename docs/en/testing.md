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
