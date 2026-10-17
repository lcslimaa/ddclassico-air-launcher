> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# AIR SDK build verification

The SDK was located at `<LOCAL_PATH>`. Its descriptor identifies **51.4.1, build 2**.

`probe/build.sh` compiled `CompatibilityProbe.as` successfully without compiler errors. Both the game probe and a separate offline `RuntimeCheck` are now debug builds with uncompressed SWFs. Build metadata and hash are recorded in `evidence/sdk-build.json`.

The first local user run opened a black window. A probe bug hid diagnostics when the entry SWF finished loading, without checking game readiness. This behavior was corrected: diagnostics now stay visible, record HTTP status and parameter counts, and write `probe/build/probe-diagnostics.log`. A 15-second observation reports whether the entry load completed. The cause of the game's blank output remains unverified until the new log is reviewed.

After the next user run, no diagnostic log was found. This does not establish whether ActionScript executed or file writing failed. The next check isolates the runtime: `bash probe/run-check.sh` opens an offline, CPU-rendered green window with a text message, captures Terminal output in `probe/build/runtime-terminal.log`, and attempts `probe/build/runtime-check.log`. It uses a separate application ID and makes no network requests. Close existing probe windows before starting it. For the game diagnostic with Terminal capture, use `bash probe/run-check.sh game`.

**Current update:** the offline CPU check passed and exited with code 0. The user saw the text and the captured Terminal log confirms constructor execution. File writing failed because the code used AIR's read-only `app:` application directory. Both checks now write through `File.applicationStorageDirectory`, with normal macOS logs under `~/Library/Application Support/community.ddclassico.runtimecheck/Local Store/runtime-check.log` and `~/Library/Application Support/community.ddclassico.compatibilityprobe/Local Store/probe-diagnostics.log`. The shell-captured logs remain in `probe/build/`. The game diagnostic has been changed to CPU rendering to isolate startup from the original direct-rendering path; this is not a final choice for gameplay.

The local probe configuration uses the observed `Loading.swf` resource URL and **empty startup parameters**. No captured credentials, session tokens or cookies were copied into it. This is an unauthenticated diagnostic build, not a functional game client.

## Run locally

From Terminal on your Mac:

```bash
"<LOCAL_PATH>" \
  "<LOCAL_PATH>"
```

Keep the Terminal output and note whether a window opens, whether any loading screen appears, and the numeric error IDs shown. Root-stage/configuration errors are possible and are useful investigation results; reaching a loading screen is not proof of authenticated gameplay. No new login attempt is configured.

To rebuild after changes:

```bash
cd "<LOCAL_PATH>"
DDCLASSICO_AIR_SDK="<LOCAL_PATH>" bash probe/build.sh
```

## Runtime limitation in the agent environment

Even the command `adl -help` crashed with exit 133 during macOS Launch Services initialization, reporting `scheduleApplicationNotification` / `_LSModifyNotification`. This occurred before an application descriptor or remote SWF was loaded. It does not establish a game incompatibility. Desktop automation also failed previously, so window behavior could not be observed here.

Compilation is verified. ADL execution, root-stage adaptation, website authentication handoff and gameplay remain unverified.
