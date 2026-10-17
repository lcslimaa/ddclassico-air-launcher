> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# FPS and frame timing

The AIR window now shows a small FPS counter, refreshed about once a second. It displays measured FPS, the current configured target and the worst observed frame interval in that second. It is independent of the large diagnostics panel: **F2** toggles diagnostics and **F3** toggles the FPS counter. Use Fn+F3 if your keyboard uses the macOS function key for a system shortcut.

Close older AIR/helper windows and relaunch normally to load the new build:

```bash
bash "<LOCAL_PATH>"
```

The helper also displays an FPS history graph and average, P95 and worst frame intervals over five-second windows. P95 is the interval at or below which 95% of the observed frame gaps fall; larger frame times indicate slower updates or stalls. All figures are numeric-only.

For each new run, `private/memory/air-<run>.csv` keeps the existing memory schema and a matching `air-<run>.fps.csv` records:

`elapsed_ms,window_ms,frames,fps,target_fps,avg_frame_ms,p95_frame_ms,max_frame_ms,foreground`

The two files align by milliseconds since AIR runtime startup. In-memory FPS history is capped at 360 windows, about 30 minutes; the CSV keeps the whole run. Frame-gap collection is capped at 8,192 intervals per sampling window. No game frame-rate limit is changed.

The FPS measurement counts [AIR ENTER_FRAME updates](https://airsdk.dev/reference/actionscript/3.0/flash/events/Event.html#ENTER_FRAME), not GPU presentation events or a separate in-game simulation tick. The target is the live [Stage.frameRate](https://airsdk.dev/reference/actionscript/3.0/flash/display/Stage.html#frameRate), which game code can change. A lower target should not be mistaken for a performance regression.

Windows that lose focus or are minimized are tagged `foreground=0`; even a partial focus loss marks that full five-second window as background. The helper skips those points in the measured FPS graph. Focus is tracked on the [native AIR window](https://airsdk.dev/reference/actionscript/3.0/flash/display/NativeWindow.html). Keep the game focused when comparing performance; the helper can remain open behind it.

To check degradation over time, compare the same lobby or PvE scene early and late in a 20–30-minute session. Watch for lower measured FPS relative to the same target and rising P95/worst frame times. Different scenes, loading and background windows can explain lower FPS, so compare similar activity. Keep the helper open to record timing alongside memory.

AIR compilation and 30 helper tests pass, including FPS parsing/timing consistency, background flags, bounded history, file permissions, recording failure and memory/FPS pairing. The in-game display still needs the next local user run for live verification.
