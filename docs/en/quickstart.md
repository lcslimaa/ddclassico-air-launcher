# Quick start

[Português](../pt-BR/quickstart.md) · [Índice](README.md)

The project contains an Electron helper and an AIR application. Use macOS to reproduce the validated environment. Requirements are Node.js/npm compatible with Electron 44.4.5, Python 3, Bash, and the HARMAN AIR SDK containing `amxmlc` and `adl`. Java/JPEXS is needed only to prepare the adapter again, not to run an already prepared build. Windows has no package or validation yet.

Set the SDK location in your terminal without committing it:

```bash
export DDCLASSICO_AIR_SDK='/path/to/AIRSDK'
npm test
npm run build
npm run start:pilot
```

First launch installs pinned helper dependencies using its lockfile. Explicit installation: `npm ci --prefix apps/login-helper`. Logic tests do not require installed Electron or an account. Building requires the private inputs described in [build](build.md); a clean clone does not contain the game.

Integrated mode is `npm run start:pilot`. `npm start` preserves classic mode. The `run-layout-pilot.sh` and `run-login-helper.sh` compatibility wrappers remain available. Close previous helper/game attempts before starting again. Do not run the old and migrated folders together: leases belong to each copy’s runtime directory.

Log in to the official website inside the helper and select your server. AIR opens once fresh parameters are captured. Normal use does not require HAR capture or manual session export. Each attempt needs fresh parameters; do not replay old session files.

Complete the [testing](testing.md) checklist before treating the migrated checkout as validated. Compilation does not establish login or gameplay.
