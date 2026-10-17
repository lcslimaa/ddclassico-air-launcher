> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# Official login → AIR prototype

The automatic handoff is implemented and was observed working in live tests: fresh parameters were captured, AIR acknowledged them, character selection returned HTTP 200, and game/startup resources loaded. **The user explicitly confirmed logged-in lobby interaction for five minutes without disconnect in the second run.** See [STABILITY_TESTS.md](STABILITY_TESTS.md) for the next phase and remaining repeatability/gameplay/recovery checks. The installed DDClassico launcher is unchanged.

The first completed startup reported runtime error 1065 (an undefined reference) about seven seconds after resource completion. AIR remained open for about thirteen minutes afterward; this does not establish continuous server connectivity. The precise source is unknown. The rebuilt launcher now emits only lexical stack function names, omitting error messages, arguments and source paths. Those frames will appear in the helper's private diagnostic log on the next run. See `evidence/automatic-login-first-run.json` for value-free observations.

## Run the next test

Close the original game and any already-running AIR prototype. Run:

```bash
bash "<LOCAL_PATH>"
```

The first run installs Electron 44.4.5 using npm. Node/npm are available on this machine. Installation could not be completed by the agent because its network cannot resolve the npm registry; the script performs installation when you run it locally. The pinned version is a stable release documented by [Electron](https://releases.electronjs.org/release/v44.4.5). The startup script also prepares the sandboxed preload automatically.

Two windows open: the official website and a handoff status window. Log in on the official page and select your usual server. The helper detects the site's game embedding, captures fresh launch values, and starts AIR automatically. No JSON download, console paste, or manual import is needed.

The helper now has a native **Quit Login Helper** menu command (Cmd+Q on macOS) and normal Window → Close behavior. Explicit close/quit requests override website unload blockers; ordinary navigation is not overridden. This addresses the reported login window that could not be closed. Restart the running older helper to load the fix. Keep the browser open during a normal memory/gameplay test; use close/quit when intentionally ending the helper.

**Keep the official login window and helper open while testing AIR.** They preserve the website connection while we test whether the native game accepts its session. The modern browser has no Flash runtime; matching original startup SWF requests are also cancelled before they are sent. If the site requires Flash before producing game markup, the helper will remain waiting. Report that screen; do not open the original game as a workaround during this test.

Watch for `Session captured`, `Bridge session accepted`, startup stages, and the actual game screen. The acknowledgement means AIR read the session, not that the game server accepted it. Use F2 in AIR to toggle its diagnostics panel. Tell the agent the last stage and what appeared. The fixed diagnostics are also saved locally in `private/login-helper.log` for review.

For another attempt, close AIR and both helper windows, then run the same command again and use the official website to enter the game anew. The helper captures once per run and never automatically replays the previous launch. Its own browser profile may remember your website login; it does not use the installed launcher's cookies.

The acceptance test is an authenticated game scene, five minutes without a disconnect, and three successful launches with fresh website-issued values. If it fails, first locate the last startup stage; changing fields alone do not establish the cause.

## How the handoff works

- A sandboxed, isolated preload observes initial and dynamically inserted OBJECT/EMBED/IFRAME markup, including FlashVars and later attribute updates. It reads game parameters, not login/password inputs, and exposes no Node API to the page.
- A second capture path reads complete parameters directly from a blocked startup request, validating the owning browser and official initiating origin before launching. Incomplete requests report only missing field names.
- Only the official HTTPS website's main frame can submit a DOM capture. Startup/config origins, string parameter formats, size and local age are checked. Capture waits for nonempty `user`, `config`, `key`, `token` and `rand`, and retains the other supplied parameters.
- The helper creates a random transient directory under `private/` with `0700` permissions and a `0600` session file. ADL receives its path using `-- --bridge-session <path>`; secrets are not passed as command-line arguments.
- AIR reads and validates the file using the existing session validator, emits a fixed acknowledgement, and starts the packaged startup adapter. The helper deletes the transient file after acknowledgement, failure, or a 60-second timeout. On timeout it stops an unacknowledged child process.
- Closing the helper after acknowledgement deletes any remaining handoff file but does not intentionally terminate an accepted AIR process. Keep the helper open for the live test. Forced process termination or a machine crash can leave a transient file in `private/`; that directory remains local and ignored.
- A private process marker survives helper exit while its accepted AIR process is still open. A subsequent helper refuses to open another official login until that process exits; dead markers are recovered on the next launch. Invalid markers refuse launch for review. Unaccepted children are stopped and transient files removed on normal exit or SIGINT/SIGTERM.
- Browser profile, caches and fixed diagnostic logs remain under `private/`. The helper does not transfer browser cookies, invent token values, or implement another authentication API. It does not record raw AIR/game stdout; only a whitelist of fixed diagnostics is retained.

Electron's [request interception API](https://www.electronjs.org/docs/latest/api/web-request) supplies the startup-request cancellation. [ADL application arguments](https://airsdk.dev/docs/building/air-debug-launcher) and [AIR InvokeEvent](https://airsdk.dev/reference/actionscript/3.0/flash/events/InvokeEvent.html) supply the native handoff.

## Diagnostics and verification

The startup adapter reports configuration request/parse, character-list request/status/completion, registration or existing-character routing, game-module request/load, game-bootstrap invocation, and startup-resource completion. Timings are milliseconds since AIR runtime startup. None of these individual events proves authenticated gameplay.

`DDT_Loading` retains the previous LoaderInfo parameter and HTTPS adaptations. `DDT_Loading` and `NormalLuncher` additionally contain fixed diagnostics. The original cached SWF is preserved; all non-ABC tags/assets were verified identical. Dynamic game-core code and server validation were not changed.

Checks completed:

- 20 helper tests covering dynamic capture, partial parameters, validation, sender/frame isolation, request cancellation, duplicate capture, sandboxed preload execution, private file permissions, subprocess arguments, acknowledgement, cleanup, rejection, timeout, process ownership across helper exit, startup refusal while AIR is open, shutdown signals, and omission of synthetic secrets from logs.
- A real Node subprocess fixture reads a synthetic session and acknowledges through the same stream handler used for ADL.
- All AIR probe sources compile, including the automatic invocation path; both modified startup classes were re-exported and verified.
- Ten Python investigation/report tests and both original exporter/embedding Node checks pass.

The user installed Electron and loaded the official website. The blocked-request path captured fresh parameters and launched AIR successfully. Game/startup resources completed in two live attempts; authenticated lobby interaction was explicitly confirmed in the second. Error 1065, broader gameplay and repeat-launch acceptance remain to be investigated. The agent environment cannot launch the AIR GUI reliably. Build verification is recorded in `evidence/login-helper-build.json`.

To rerun helper tests without Electron installed:

```bash
cd "<LOCAL_PATH>"
node --test login-helper/test/*.test.cjs
```

To rebuild the private adapter and AIR client, use the commands in [SESSION_PROTOTYPE.md](SESSION_PROTOTYPE.md). Keep the build containing the proprietary SWF and all private session/profile data local.
