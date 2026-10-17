# Metrics and records

[Português](../pt-BR/observability.md) · [Índice](README.md)

## Metrics

FPS counts the game stage’s `ENTER_FRAME` updates, not GPU presentations. Target is `gameStage.frameRate`, which the game may change. Lower FPS naturally means a larger interval: 60 FPS ≈ 16.7 ms; 30 FPS ≈ 33.3 ms. This is neither network latency nor CPU work per frame.

The HUD refreshes about once per second. Detailed telemetry uses roughly five-second windows with mean, P95, maximum and foreground status. Compare the same scene, cap and focus. The shell’s visual average and CSV windows may cover different periods.

Memory records `System.totalMemoryNumber`, `freeMemory` and `privateMemory`. These describe AIR, not Electron. Trend detection uses warm-up and minute minima; sustained growth warrants investigation but does not prove a leak. No warning does not rule out leaks.

## Files

Runtime contains the helper’s allowed log and `memory/air-<run>.csv`, with a paired `.fps.csv`. In-memory history is bounded; CSV retains the full run. Keep the helper open to record. Shell graphs retain 60 samples; the memory graph is relative to their peak, without a stability verdict.

The parser accepts only known numeric telemetry formats. Normal diagnostics filter messages and, when available, lexical function names; raw error text is omitted. Write failures stop the affected recorder rather than throwing into the game path.

## Inactive instrumentation

Instance/dialog/animation-boundary instrumentation was removed at the user’s request. Do not recreate `.pve.csv` or `.pve-detail.csv` recorders or observers from that investigation. Neither 2× speed nor automatic farming is implemented. Manual investigation output may contain private information and must remain under `.local`, even though the normal logger is filtered.
