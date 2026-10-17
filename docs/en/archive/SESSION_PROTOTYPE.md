> Historical English document. Not current instructions; use the README and current guides.

# Fresh-session AIR prototype

The exporter, importer and adapted startup SWF have been built. **Authenticated gameplay is not yet verified.** The existing game installation was not modified.

The preferred next test is now the [automatic official-login handoff](AUTOMATIC_LOGIN.md). The manual workflow below remains available for troubleshooting. AIR also accepts the helper's `--bridge-session <absolute-path>` invocation and starts automatically after validation.

## 1. Export from a normal fresh login

Open the game normally through the official DDClassico launcher/website, selecting your usual server and existing character. Reopen or reload through the normal website flow immediately before exporting; the export timestamp cannot establish when an older server session was issued.

Copy the exporter script to your clipboard from Terminal:

```bash
pbcopy < "<LOCAL_PATH>"
```

Paste it into the **game webview's DevTools console**, the same console used for the embedding summary, and run it. It reads the website-generated OBJECT/EMBED SWF parameters, checks the expected resource/configuration origins and requests a local download called `ddclassico-air-session.json`. It makes no network requests and prints only a filename, parameter count and status—not session values.

Find the downloaded file, normally in Downloads. Keep it private; it contains account/session values, including keys/tokens supplied by the official website. Do not paste its contents into chat or commit it. The AIR importer reads the selected file and does not save another copy. Delete the export yourself after testing.

If the script reports no embedding, you are in the wrong console/frame or have not opened the game page. If it reports incomplete parameters, stop and report that message. If a download is requested but no file appears, report that result rather than copying raw values manually.

### If the launcher does not save the download

Use the DevTools clipboard alternative:

```bash
pbcopy < "<LOCAL_PATH>"
```

Paste and execute in the same game console. After it reports `Local session copied to clipboard`, save it from Terminal without displaying its contents:

```bash
(umask 077; pbpaste > "<LOCAL_PATH>")
```

Import that file into AIR promptly. This uses the DevTools `copy()` helper and requires no download support from the Electron launcher.

## 2. Launch AIR and import

Close the original game before the AIR startup attempt, to avoid concurrent game connections. This is not a request to log out of the official website. Then run:

```bash
bash "<LOCAL_PATH>" session
```

In the AIR window:

1. Click **Import fresh session** and select `ddclassico-air-session.json`.
2. Wait for **Session imported and validated**.
3. Click **Start game**.
4. Use **F2** to hide/show the diagnostics panel if it covers the game.

No authenticated startup is attempted before Start. Import and Start both enforce the prototype's ten-minute export-age limit (with one minute of future-clock tolerance). This is a local guard, **not a claim about server-side validity or expiration**. The file must have the expected format, a known entry resource, string parameters, nonempty `user`/`key`/`config`, and an HTTPS DDClassico configuration URL. Files larger than 64 KB are rejected.

Report what appears: loading screen, character selection, login rejection, game scene, or an error. Then close the AIR window and say the test is done. The agent can inspect `probe/build/session-terminal.log` locally. Avoid pasting the full game log: although the new launcher omits session values, original game code may print additional details.

## What was adapted

The larger startup SWF (`ddt_loading.swf`) is the document class `DDT_Loading`, already used in the recorded normal game flow. The prototype packages a **private copy** with that startup class adapted:

- It reads `loaderInfo.parameters`, receiving the imported values through `LoaderContext.parameters`, instead of reading empty host-stage parameters.
- HTTPS configuration handling follows the supplied configuration URL rather than the local application URL.
- Embedded fallback login values are removed, and missing launch values fail before account requests.

No game-core decoding, integrity check, server authentication rule or gameplay behavior was changed. The automatic-handoff update also adds fixed diagnostics to `DDT_Loading` and `NormalLuncher`, including numeric character-list HTTP status. All non-ABC SWF tags/assets were compared and remained identical. Both modified classes were re-exported and verified. Compiler replacement uses JPEXS's experimental script-replacement facility; runtime validation is essential.

The native shell does not generate signatures, replay historical HAR values, copy browser cookies, or invent a login API. The server decides whether the fresh website-issued values are accepted. Character registration, reconnect, session expiration, GPU rendering and full game compatibility are still unverified. Further startup assumptions inside dynamically loaded modules may require additional adaptation.

## Build and checks

AIR SDK 51.4.1.2 compiled `SessionLauncher.swf` successfully. Export tests use synthetic values and verify query decoding, origin restrictions and omission of values from console metadata. Existing investigation tests also pass. No real session file has been imported or executed by the agent.

Private adapter preparation is reproducible with:

```bash
cd "<LOCAL_PATH>"
python3 tools/prepare_session_adapter.py --ffdec "<LOCAL_PATH>"
DDCLASSICO_AIR_SDK="<LOCAL_PATH>" bash probe/build.sh
```

Keep `private/`, captured HARs, session exports and the build containing the proprietary startup file local. A community distribution would require a separate packaging/distribution design; this prototype does not establish redistribution rights.
