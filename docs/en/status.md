# Current status and roadmap

[Português](../pt-BR/status.md) · [Índice](README.md)

## Known baseline

The user previously confirmed official-site login, AIR execution and PvE gameplay, reporting roughly 26 minutes of inventory, upgrades and combat working. They also confirmed the corrected viewport and power override. These are user-reported local observations, not a complete compatibility matrix.

The integrated UI includes match data and Shoot controls. Do not extend earlier confirmations to features added afterward. The migrated folder needs its manual acceptance checks repeated. The agent can compile and test logic, but ADL may fail before GUI startup in this environment.

## Limitations

- Dependency on a private adapted initializer; newer versions may need review.
- Client models can change; names/values and state need live verification.
- Shoot restricted to eligible normal PvE; the companion angle label remains unverified.
- Windows, installers and distribution are not implemented.
- No community server or independent game implementation exists.
- Universal acceleration, instance logs and automated farming are not current product features.

## Next milestones

First validate the new macOS checkout with fresh login and the manual checklist. Later work may extract companion controller/view, review update behavior and plan Windows portability separately. Do not silently include those features in this migration.

Git is local with no remote. A license for our code has not been selected; there is no automatic redistribution grant. Local third-party resources/code do not become project-owned by being in the directory.
