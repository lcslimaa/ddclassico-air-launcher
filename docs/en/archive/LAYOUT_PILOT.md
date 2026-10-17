> Historical English document. Not current instructions; use the README and current guides.

# Launcher layout pilot

The layout pilot recreates the supplied dark windowed/fullscreen designs using native AIR display objects. It preserves an independent, borderless 1000×600 game stage, visually attached to an owned shell window. The default launcher is still selected by `run-login-helper.sh` unless `DDCLASSICO_LAYOUT_PILOT=1` is set.

## Start

Close the previous AIR game and helper. Run:

```sh
bash <LOCAL_PATH>
```

Log in normally. No extra capture or session export is needed. The existing helper still checks for a running AIR session, captures fresh official parameters and removes its temporary session file after acknowledgement.

The main window now uses standard macOS native chrome for dragging, minimize, zoom/fullscreen as provided by AIR/macOS, and close. Custom minimize/fullscreen/close controls have been removed. Settings exposes the legacy companion, manual import and Start. F2 toggles diagnostics; F4 opens the existing companion. The companion does not open automatically. The shell now has a live power input and Shoot button using the same controller as the companion.

## Layout

- Compact content: 1366×780, toolbar height 46, game at (0,46), sidebar x=1016, performance y=658.
- Expanded content: at 1920×1080, game at (64,130), sidebar x=1128, performance y=742, diagnostics y=868.
- Expanded mode requires at least 1600×1000 logical coordinates. Sidebar and diagnostic widths/heights adapt. The game remains exactly 1000×600.
- Window size changes use the native macOS controls. The attached game follows the shell content origin using `globalToScreen`, accounting for native title-bar offsets. Native zoom/fullscreen grouping still needs live verification.
- The shell uses system sans-serif fonts and the design's dark colors. Desktop design files are unchanged. Project copies of the SVG references are in `assets/layout-reference/`.

## Live versus pending panels

Live: game-stage FPS/target, mean frame interval, AIR allocated memory, bounded 60-sample FPS/memory graphs and sanitized startup/error messages. The green graph is scaled to its retained memory peak, not a leak assessment. The pilot labels connection status unverified; it does not invent server/latency data or a “Stable” verdict.

Live sidebar: map/mission, wind, active participant, visible participant names/team/HP/state, numeric PvE Shoot control and last five normal-shot powers. The participant list includes your character and scrolls for additional entries. Room ID and launcher elapsed time are shown in the expanded session card when available; latency remains unavailable. Existing telemetry recording continues through the helper. No game core or startup adapter patch is introduced.

## Validation status and next check

Both launcher builds compiled with AIR SDK 51.4.1. All 32 helper tests passed, including fixed pilot/default selection, missing-build rejection before session-file creation, acknowledgement cleanup and lifecycle protection. The packaged adapter hash is unchanged.

ADL GUI verification in the agent environment failed at macOS Launch Services initialization (exit 133, `scheduleApplicationNotification / _LSModifyNotification`), before the launcher ran. Window rendering and live gameplay therefore remain unverified.

First live check:

1. Verify the windowed layout and that the game has no overlays and remains 1000×600.
2. Drag, minimize/restore, and toggle fullscreen/restore. Check that the game follows the shell without changing size or input alignment.
3. Enter PvE; open inventory/menus, aim, and make normal Space shots. Compare mouse targeting with the old launcher.
4. Open the existing companion with F4 and verify its numeric Shoot behavior still works.
5. Switch focus between shell/game and another application. Check FPS/background recording, then close using the native title bar and verify both windows and the AIR process close.

If grouping, alignment or input fails, use the default launcher. The user confirmed the corrected viewport works; live sidebar integration is now implemented and needs its own local gameplay check.

## Scaling correction after the first user test

The user reported severe stretching and unusable input. The original startup sets `stage.scaleMode = "exactFit"`, overriding the pilot’s initial setting. The pilot now restores `NO_SCALE` and top-left alignment on entry initialization/completion and each game frame. This avoids secondary-window document scaling; the original startup adapter and core remain unchanged. The user-requested native macOS chrome replaces custom window controls. Compilation passes, but the corrected viewport needs a fresh local run.

## Live sidebar acceptance check

Restart using the same pilot script. Enter a normal PvE match and compare wind, active player and participant HP with the game. Scroll participant rows when needed. Enter 30 and click Shoot during your active turn: compare the resulting request/history with 600 internal units / 30 power and verify one normal shot. The button is disabled outside the existing normal-dungeon eligibility checks; execution rechecks the original controller conditions. Leaving a match clears participant and shot-history data. Open and close F4: shell updates and shooting must continue without a second controller or duplicated requests. Resize the shell and verify input text is preserved and the game remains 1000×600.

The companion now exposes a selected-field snapshot and a launcher Shoot entry point; the shell renders those snapshots. Both views share one polling timer and one set of shot listeners. No match information is written to logs. The legacy launcher still uses its existing companion-only behavior. The full debug companion remains optional; no energy/rage/angle panels or dungeon rewards were added to the designed sidebar.
