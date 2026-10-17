> Historical English document. Not current instructions; use the README and current guides.

# DDClassico capture review — 2026-10-12

## Result

All three HAR captures are usable. They establish the current startup SWFs and configuration path, and confirm **network downloads of the startup SWFs alongside disk-cache reuse of the larger game-core resource**. The downloaded startup SWFs match the cached versions previously decompiled byte for byte, so the earlier AIR-branch findings apply to the versions in these sessions.

This is a review of your recorded sessions, not an AIR runtime test. No captured credentials were replayed or copied into probe configuration.

## Loading and cache behavior

| Resource | Body size | First observed | Repeat | Relaunch |
|---|---:|---|---|---|
| `/flash/Loading.swf` | 294,060 bytes | Network | Network | Network |
| `/flash/ddt_loading.swf` | 1,540,067 bytes | Network | Network | Network |
| `/flash_091020261845/2.png` | 5,650,194 bytes | Disk cache | Disk cache | Disk cache |

The two SWFs have HTTP 200 responses, roughly **1.84 MB combined network transfer per recorded launch**, and identical SHA-256 hashes across all three captures. The core resource has explicit `_fromCache: disk` and zero transferred bytes in every capture; its body hash also remains identical.

The SWFs advertise `Cache-Control: max-age=14400`. However, their query strings vary between captures, including `rand`, `key` and `token`. Different full URLs are a plausible explanation for the repeat downloads, not proof that cache settings are otherwise ignored. The core resource's `lv` query value stays constant across these captures. No HTTP 304 revalidation responses were observed.

There were 124 / 150 / 151 recorded requests and 8 / 28 / 28 explicit disk-cache entries respectively. No HTTP status >=400 appears. Those counts do not measure FPS, memory or successful gameplay; request durations and content sizes also do not establish user-perceived startup time.

## Current startup contract

The entrypoint is `https://resource.ddclassico.com/flash/Loading.swf`. Startup input is supplied through its **URL query**, with these names:

`config`, `isGuest`, `key`, `locale`, `rand`, `request`, `token`, `ua`, `user`, `v`.

The next SWF receives the same set of names. The captures confirm requests to `https://s1.ddclassico.com/portugal/config.xml`. Configuration identifies:

- `FLASHSITE` and `BACKUP_FLASHSITE`: `https://resource.ddclassico.com/flash_091020261845/`
- `REQUEST_PATH`: `https://s1.ddclassico.com/`
- A login return URL and language setting also exist; account/session values are omitted from the report.

Character-selection and login handler requests are present. HTTP 200 alone does not establish that authentication was accepted. `key` and `token` change across captures, so fixed captured values cannot be assumed reusable or suitable as a persistent launcher configuration. Their meanings and expiration remain unverified.

## Embedding summary correction

The supplied `embedding-summary.json` contains RTF formatting from TextEdit. It was successfully converted into `evidence/embedding-summary.normalized.json`; the original was preserved.

Both OBJECT and EMBED point at `Loading.swf`, with `allowScriptAccess: always`. The empty `parameterNames` arrays were caused by the original helper inspecting only FlashVars, while this game uses URL parameters. The helper now inventories both sources and still omits values. **No recapture is needed to establish the parameter names above.**

## Effect on AIR feasibility

1. **Confirmed:** the current startup code matches the code containing explicit AIR branches. It is not merely an obsolete cached candidate.
2. **Confirmed:** startup parameters originate in URL queries, and config/core resource locations are now known.
3. **Still unresolved:** startup code reads root-stage `LoaderInfo` parameters and URLs. Passing parameters to a child loader does not reproduce those root-stage assumptions.
4. **Still unresolved:** normal authenticated handoff from the website to an AIR process. The captures contain session-related values but do not establish a supported handoff mechanism or their lifetime.
5. **Still unresolved:** availability and execution of `air_register.swf`, full game-module compatibility and JavaScript callback replacements. No request for the AIR-only registration resource was expected from browser sessions; absence in these captures is not evidence that the server lacks it.

The next milestone is compiling and running the diagnostic AIR probe, initially to observe the root-stage/configuration failure and determine the smallest startup adaptation. A local macOS AIR SDK is still needed. The probe is not yet a functional replacement launcher.

## Evidence

- `evidence/first-observed.json`, `repeat.json`, `relaunch.json`: summaries with query values, cookies and bodies omitted.
- `evidence/live-capture-comparison.json`: body hashes, query parameter names, cache indicators and cross-capture variation names.
- `evidence/captured-config-contract.json`: selected configuration field names and resource origins.
- `evidence/embedding-summary.normalized.json`: recovered plain JSON from the user-supplied RTF.
