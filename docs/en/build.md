# Build and private resources

[Português](../pt-BR/build.md) · [Índice](README.md)

## Inputs and outputs

Normal build compiles only `SessionLauncher` and `LayoutPilotLauncher`, then copies descriptors and the verified adapter into the `build` directory from `config/paths.json`. It does not require old compatibility probes’ `config.local.json`.

Required local build inputs:

- `.local/assets/session-adapter/DDT_Loading.air.swf`.
- `.local/evidence/session-adapter.json`, with the matching `adaptedSHA256`.
- HARMAN AIR SDK selected through `DDCLASSICO_AIR_SDK`.

Do not obtain game files from collaborators through authenticated sessions. Private resources are not committed. Contributors must prepare their own local inputs; a clean clone can run logic tests but cannot build a playable client without them.

## Rebuild the adapter

`tools/adapter/prepare_session_adapter.py` uses the hash-validated original SWF, reconstructed `DDT_Loading.as` and `NormalLuncher.as`, and JPEXS. Inputs live under `.local/assets/swfs/756678cfdd94.swf` and `.local/assets/decompiled/756678cfdd94/scripts/`. Supply JPEXS explicitly through `--ffdec`; Java is required.

```bash
python3 tools/adapter/prepare_session_adapter.py --ffdec '/path/to/ffdec.jar'
npm run build
```

The transformation requires expected structure and rejects unexpected changes rather than generically patching a newer version. It removes login defaults, adjusts bootstrap LoaderInfo access and preserves unchanged assets. JPEXS script replacement is experimental; rebuilding requires new static and live verification. An expected hash is not proof of correctness.

## Reproduction

Helper dependencies are pinned by the lockfile in its own directory; there is no shared npm workspace. SDKs, installed dependencies and outputs are excluded from commits. Descriptors and source are versioned; profiles, sessions and private-resource metadata stay local. Old AIR diagnostics have a separate build described in [troubleshooting](troubleshooting.md).
