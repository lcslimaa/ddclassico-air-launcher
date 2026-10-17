> Historical English document. Not current instructions; use the README and current guides.

# AIR memory monitoring

The launcher now samples memory every five seconds. The helper displays current readings and a graph; numeric samples are written to one private CSV per launch under `private/memory/`. Monitoring stops when AIR or the helper closes. Keep the helper open for the whole test.
The [FPS counter](FPS_MONITOR.md) also records a matching `.fps.csv` file so memory growth can be compared with frame timing. The memory CSV's four-column schema is unchanged.

Close older AIR/helper windows and launch normally:

```bash
bash "<LOCAL_PATH>"
```

After the game has loaded, leave it idle in the lobby for five minutes, then repeat the same room-entry/exit or match/menu actions for 20–30 minutes, returning to the same lobby state between cycles. Finish with another five-minute idle period. Report the repeated action and when you finished; the agent can inspect the CSV locally without receiving session values.

## Readings

- **AIR allocations**: `System.totalMemoryNumber`, memory directly allocated by the runtime.
- **Free**: `System.freeMemory`, unused memory available to the runtime; it varies with collection.
- **Process private**: `System.privateMemory`, private resident memory for the AIR process, including more than direct runtime allocations.

These meanings are documented by the [AIR System reference](https://airsdk.dev/reference/actionscript/3.0/flash/system/System.html). The readings concern AIR/game memory, not the separate Electron login browser. No object dump, password/session inspection or forced garbage collection is used.

The graph keeps the most recent 360 samples (about 30 minutes) in memory. Blue is AIR allocations and amber is process private memory; the CSV retains the whole run. The monitor's own in-memory history is bounded.

## What the trend message means

The heuristic ignores the first five minutes, then compares minima from completed one-minute windows with at least six samples each. It needs ten such windows, normally at least 15 minutes of total runtime. It separately checks AIR allocations and process private memory.

“Sustained memory growth” means the last three minute minima average more than 32 MiB and 20% above the first three, with increases over 1 MiB in at least four of the latest six minute-to-minute transitions. These are investigation thresholds, not proof of a leak. Smaller or slower leaks can be missed.

Asset loading, caches and allocator retention can all increase memory. A leak becomes more plausible if memory lows keep rising across identical cycles, including after returning to the same scene and allowing idle time. Stable readings also cannot rule out every leak. Identifying retained objects or a leaking native allocation would require a separate profiling investigation.

Only numeric telemetry is recorded. File recording failures disable monitoring without intentionally blocking game launch. AIR compilation and 26 helper tests pass, including steady/noisy memory, persistent growth, private-only growth, bounded history, numeric-only CSV and recording failure. The live display and real memory trend still need the next local game run.
