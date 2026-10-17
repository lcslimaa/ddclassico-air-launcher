> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# AIR runtime findings

The offline CPU check passed. The remote game check also executes the probe, downloads the current startup SWF with HTTP 200 and exits normally when closed. It records two **2070** errors before the entry-load complete event.

AIR documents 2070 as a security violation when a caller cannot access a Stage owned by another sandbox: https://airsdk.dev/reference/actionscript/3.0/runtimeErrors.html. The remote startup SWF runs in its domain sandbox, whereas the probe owns an AIR application Stage. Its `Loading.init` immediately sets `stage.align` and `stage.scaleMode`. These are likely failing operations; the log does not identify exact stack frames.

The remote-wrapper approach therefore cannot run this unchanged startup code as-is. This is a distinct issue from authentication: both child and host stage parameters are also currently empty. Successful download is not successful initialization.

## Next isolation test: locally packaged entry

The build includes a **private**, SHA-256-verified copy of the startup SWF recovered from the local cache and confirmed byte-identical in the current HAR captures. It is loaded from the application package using the standard AIR loader. Its bytes are unchanged. Locally packaged code has the application's AIR privileges, rather than the remote sandbox's privileges; this is a different execution model, not a cross-domain policy change.

Run:

```bash
bash "<LOCAL_PATH>" local
```

This test supplies no captured login parameters and does not bundle server `config.xml`. A guard refuses the test if a local `config.xml` is present. Its purpose is to determine whether stage-access error 2070 disappears. A missing configuration error or blank game area may follow, and must not be treated as a login/gameplay test. The shell captures output in `probe/build/local-terminal.log`.

Root-stage parameter/URL assumptions, normal session handoff and full module loading still require adaptation and validation. Do not distribute the locally packaged game file with a community launcher based on this diagnostic build.

## Local-entry result

The user's local-entry run completed loading the packaged startup SWF with no recorded 2070 errors and exited with code 0. HTTP status 0 is expected for a local `app:` resource; it is not an HTTP failure. This supports locally packaged startup as a viable way to resolve the Stage ownership boundary.

Two uncaught errors were recorded as `unknown`. The old handler only classified `Error` objects, while AIR can also deliver `ErrorEvent` objects for unhandled asynchronous failures. The root and child listeners could also report the same underlying error twice. The revised handler classifies ErrorEvent/IOErrorEvent/SecurityErrorEvent, extracts numeric IDs and reports whether the failed resource category is `config.xml`, without exporting raw text or URL values. It now uses only the root uncaught-error listener.

Missing configuration is the leading explanation: the original startup calls `URLLoader.load` for `config.xml`, the isolation test intentionally omits that file, and this config loader has no I/O-error listener. The existing log does not prove this was the exact error. A final isolation rerun will classify it before preparing a bootstrap adaptation.

**Confirmed by the next local run:** the handler reports `IOErrorEvent` 2032 and identifies the failed resource category as startup `config.xml`. No 2070 appears. The missing configuration explanation is now supported by runtime evidence.

## Native configuration bootstrap check

The next compiled check is independent of the game SWFs: `BootstrapCheck` fetches the observed public `https://s1.ddclassico.com/portugal/config.xml`, parses its XML, checks `FLASHSITE`, `REQUEST_PATH` and `LANGUAGE`, and stops. It disables cookie management for this request, never copies captured session values and does not call character-selection or login endpoints.

Run `bash probe/run-check.sh config`; output is captured in `probe/build/config-terminal.log`. Compilation is verified, but live execution is pending. This tests AIR networking/configuration handling before replacing the browser-dependent startup context. Adding actual configuration to the unchanged old entry loader was intentionally avoided: its normal next step includes account requests, and its embedded fallback values must not be used as a new client's login behavior.

**Configuration result:** the user run reports HTTP 200, successful XML parsing, and validated `FLASHSITE`, `REQUEST_PATH` and `LANGUAGE` with HTTPS asset/service paths. The native bootstrap stopped before account requests. AIR execution, local-entry Stage access and native configuration fetching are now supported by runtime evidence. This still does not establish full game compatibility.

## Remaining session dependency

The supplied captures contain startup SWF URLs with session-related query values, but do not identify the website response or interaction that creates them. The website's top-level launcher/game documents were not present as document response bodies in the reviewed sequence. Old HAR query values have not been replayed, and their expiration is unknown.

Next evidence should capture **normal navigation from the already-signed-in launcher through server selection into the game**, starting before the Play action. In the game webview's DevTools Network panel, select All resource types, enable Preserve log, leave Disable cache unchecked and save the resulting HAR locally to `captures/session-handoff.har`. Retain the raw capture privately. If this does not contain the normal handoff response, inspect the game embedding/page logic next instead of inventing a login API.

This is a different capture boundary from the prior cache tests; the known SWF parameter names do not need to be recaptured for their own sake. No password entry or account change is needed for this already-signed-in observation.

## File logging correction

The first runtime log error was caused by writes to AIR's read-only application-directory URI. The revised code uses `File.applicationStorageDirectory`. The shell captures logs independently in the workspace. This corrects the probe's diagnostic code and does not address the remote game sandbox error.
