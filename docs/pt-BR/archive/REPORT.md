> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# DDClassico → AIR: initial compatibility report

**Update:** authenticated session captures have now been supplied and reviewed. See [LIVE_CAPTURE_REVIEW.md](LIVE_CAPTURE_REVIEW.md) for current entrypoints, confirmed cache behavior and remaining AIR blockers. The initial investigation below describes the earlier offline stage.
**Build update:** AIR SDK 51.4.1.2 has been located and probe compilation passes. ADL crashes during Launch Services initialization in the agent environment; see [SDK_BUILD_STATUS.md](SDK_BUILD_STATUS.md). Runtime compatibility remains unverified.
**Runtime update:** user-run checks now confirm AIR execution, locally packaged startup Stage access and native configuration fetching/parsing. The remote Stage error 2070 and local missing-config error 2032 have been identified. Authentication handoff, full gameplay and performance remain unverified; see [RUNTIME_FINDINGS.md](RUNTIME_FINDINGS.md) for the current results and next evidence.

## Result

**The cached startup code explicitly anticipates AIR, but a working standalone AIR client is not established.** There is stronger evidence of feasibility than the Electron launcher alone provided. The principal issues are root-stage startup parameters/URLs, session handoff, availability of AIR-specific resources and full game-module behavior.

Analyzed the installed macOS DDClassico **1.0.5** and its existing Chromium cache on 2026-10-12. No game was run, no live server requests succeeded, and no login credentials/cookies were read. Cache history may contain older resource versions; it does not identify the currently served version.

## Confirmed findings

| Finding | Evidence | Consequence |
|---|---|---|
| Launcher opens the online site | `evidence/launcher/index.html`, `/classic/launcher` | Website supplies the game embedding/startup context. |
| No game SWFs in the ASAR | `evidence/asar-files.txt`, `baseline.json` | Replacing the launcher alone does not provide the game. |
| Existing cache contains 546 SWF URL entries | `evidence/cached-swfs.json` | Game content is retained locally; not all assets necessarily download on every launch. Entries are not unique files or proof of reuse. |
| Two complete startup SWFs recovered | `evidence/extracted-swfs.json` | 11 startup entries resolve to two unique validated SWFs; one truncated entry was skipped. |
| Startup ActionScript reconstructed | 11 scripts from `Loading.swf`, 94 from `ddt_loading.swf` | 105 scripts examined; original source not recovered. Some complex loader methods contain decompiler artifacts. |
| AIR-aware registration path | `RegisterLuncher.as`: player type `desktop` selects `air_register.swf` | AIR support was anticipated in this cached version; current asset availability is unknown. |
| AIR-aware module loading | `RegisterLuncher.as` and `ModuleLoader.as` contain AIR/code-import handling | Additional evidence of AIR considerations; no sandbox change performed by the investigation. |
| Startup contract | `evidence/startup-contract.json`: `user`, `key`, `rid`, `config`, `enterCode`, `ua`, `site` | Values must come from the normal website startup. `key` is not established to be an account password. |
| Root-stage assumptions | `Loading.as`, `DDT_Loading.as`, `NormalLuncher.as` use stage LoaderInfo | Passing `LoaderContext.parameters` to a child is insufficient to establish equivalence. |
| URL-dependent behavior | Loaders inspect the root-stage HTTPS URL; `Loading` derives the next SWF URL from stage LoaderInfo | A local AIR host changes the inputs to those assumptions. Original child resource URL alone does not fix this. |
| Dynamic core is not simply a `.swf` URL | `NormalLuncher.CorePath` is config `FLASHSITE` + `2.png` | Inventory must include configuration and code-module requests, not only `.swf` extensions. Core payload was not decoded or decompiled. |
| Versioned core resource appears in cache | `evidence/static-resources.json` includes `/flash_091020261845/2.png` among 12,559 static-resource entries | A cached core URL exists, but active version and runtime compatibility remain unknown. No `air_register.swf` entry was found in this inventory; this does not prove it is absent on the server. |
| Browser callbacks exist | `isSafeFlash`, `alert`, `alterBackgroundImg`, `toLocation`, external loader callbacks | Some calls are guarded, but not all functionality is proven optional. Replacing callbacks requires behavioral inspection. |
| Game has its own persistent cache | `LoaderSavingManager` uses `SharedObject` | Browser HTTP caching and game-managed storage must be tested separately. AIR storage should not be assumed to reuse existing browser data. |

## Compatibility matrix

| Area | Status | Next validation |
|---|---|---|
| ActionScript/AIR awareness | Supported by static evidence | Compile probe and observe runtime. |
| Current entrypoint and FlashVars | Unverified | Inspect current authenticated game embedding. |
| Root-stage parameters and URLs | Identified migration obstacle | Demonstrate host behavior; choose an evidence-supported startup adaptation. |
| Authentication handoff | Unverified | Establish how the normal service supplies and validates startup/session values. |
| AIR-only registration module | Referenced, availability unknown | Verify ordinary service delivery of `air_register.swf`; do not assume browser files substitute. |
| Full gameplay core and dependent modules | Unverified | Observe normal module requests and execution. |
| JavaScript callbacks | Identified, requirements uncertain | Classify each callback as required, optional or replaceable. |
| Cache reuse between launches | Existing cache confirmed; reuse unmeasured | Compare three normal-launch HAR captures. |
| Performance and reliability | Not measured | Same-scene baseline and AIR runtime comparison. |

## Completed implementation and checks

- Extracted launcher source and SHA-256 baseline; inventoried cached SWFs without query values.
- Recovered startup SWFs using Chromium simple-cache stream boundaries, CRC checks where present and decompressed-length validation. Kept recovered proprietary files under `private/`.
- Decompiled both startup SWFs with JPEXS FFDec 26.3.0; indexed parameter names and callback references.
- Added a HAR analyzer that omits cookies, credentials, query values and response bodies, plus a static ActionScript dependency scanner and a parameter-name-only embedding inspector.
- Added diagnostic AIR probe source and build instructions. Source is **uncompiled**, not a ready-to-run client.
- Six Python tests pass, covering redaction, cache interpretation, stream boundaries/CRC and incomplete SWFs. Shell, JavaScript, descriptor XML and example JSON syntax checks pass. AIR compilation and runtime checks are outstanding.

## Concrete blockers

1. Computer-use initialization failed (`Sky Computer Use native pipe startup failed`), preventing observation of the authenticated client.
2. Shell networking could not resolve `ddclassico.com`; the web-fetch tool also could not access the launcher page. This is an environment limitation, not proof that the service is down.
3. No AIR compiler/debug launcher was found in the searched local directories. The installed BattleTank AIR runtime is not a development SDK.
4. The recovered root-stage assumptions make a generic child-SWF wrapper incomplete even if credentials are supplied.

Next input: perform the local capture instructions in `README.md`, retaining raw HAR files privately, and provide the reviewed summary files or their workspace paths. Supply the local AIR SDK path when installed. No compatibility-success claim should be made before normal authenticated gameplay passes.

## Documentation used

- [Chromium simple-cache format](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/disk_cache/simple/simple_entry_format.h): structure of cache streams and footer checks.
- [AIR LoaderContext](https://airsdk.dev/reference/actionscript/3.0/flash/system/LoaderContext.html): child parameters, remote loading and code-import distinctions.
- [AIR Loader](https://airsdk.dev/reference/actionscript/3.0/flash/display/Loader.html): loading behavior and uncaught-error observation.
