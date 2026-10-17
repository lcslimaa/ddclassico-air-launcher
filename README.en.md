# DDClassico AIR Launcher

[Português](README.md) · [English](README.en.md)

Experimental community launcher: official-site login in Electron and game execution in Adobe AIR. Integrated mode keeps a 1000×600 canvas with surrounding information/controls and native macOS windows. This repository contains our code and documentation, not the game or a server implementation.

- [Start / Início](docs/en/quickstart.md)
- [Architecture / Arquitetura](docs/en/architecture.md)
- [Technical decisions / Decisões técnicas](docs/en/decisions/README.md)
- [Current status / Estado atual](docs/en/status.md)
- [Complete documentation / Documentação completa](docs/en/README.md)
- [Migration / Migração](docs/en/migration.md)
- [Contributing](CONTRIBUTING.en.md)

```bash
export DDCLASSICO_AIR_SDK='/path/to/AIRSDK'
npm test
npm run build
npm run start:pilot
```

Build requires private local inputs; read the build guide before using a clean clone. Windows is not supported/tested yet. The new checkout needs manual validation; compilation does not establish login or gameplay.

No remote or license is selected in this phase. Nothing is published.
