# Sessions and processes

[Português](../pt-BR/sessions.md) · [Índice](README.md)

## Normal flow

```mermaid
sequenceDiagram
  participant Site as Official website
  participant Helper
  participant File as Private file
  participant AIR
  Site->>Helper: Initializer request with fresh parameters
  Helper->>Helper: Cancel original SWF; validate origin and parameters
  Helper->>File: Create temporary session
  Helper->>AIR: ADL and file path
  AIR->>File: Read and validate
  AIR-->>Helper: Fixed ACK
  Helper->>File: Delete temporary file
  AIR->>Site: Normal game/server flow
```

Login belongs to the official website. Browser cookies are not copied into AIR. Observed `key`, `token` and `rand` values change between launches; server meaning and lifetime are not assumed. The importer’s ten-minute age guard is local, not an official token lifetime.

The remote browser has no Node integration and uses sandboxing and context isolation. Its preload observes launch without exposing a session API to the page. The main process validates origin, owning window/frame and single-attempt state before starting AIR.

## Lifecycle

The helper creates an exclusive private file and spawns ADL without a shell. Before ACK, failure, timeout or helper disposal cleans the file and may terminate the pending child. After ACK, closing the helper deliberately leaves the game running as a separate process. Metric recording requires the helper to remain open.

A PID lease blocks a second attempt within the same runtime directory while the tracked AIR process is alive. Stale markers can be recovered; malformed markers are not indiscriminately removed. Each project copy has its own runtime: this is not a global cross-copy lock.

Private POSIX permissions are not encryption. `.local/runtime` may contain an authenticated browser profile, handoffs and logs. Do not share it. Close processes before clearing profiles or investigating markers; never replay a session to diagnose a failure.
