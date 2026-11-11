# DDClassico AIR Launcher

[Português](README.md) · [English](README.en.md)

Launcher comunitário experimental: login pelo site oficial em Electron e jogo executado no Adobe AIR. O modo integrado mantém o canvas em 1000×600, com informações e controles ao redor e janelas nativas no macOS. Este repositório contém nosso código e documentação; não contém o jogo ou um servidor próprio.

- [Start / Início](docs/pt-BR/quickstart.md)
- [Architecture / Arquitetura](docs/pt-BR/architecture.md)
- [Technical decisions / Decisões técnicas](docs/pt-BR/decisions/README.md)
- [Current status / Estado atual](docs/pt-BR/status.md)
- [Complete documentation / Documentação completa](docs/pt-BR/README.md)
- [Migration / Migração](docs/pt-BR/migration.md)
- [Contributing](CONTRIBUTING.md)

```bash
export DDCLASSICO_AIR_SDK='/path/to/AIRSDK'
npm test
npm run build
npm run start:pilot
```

O build depende de recursos privados locais. Consulte o guia de build antes de executar em um clone limpo. Windows ainda não é suportado/testado. O novo checkout exige validação manual; compilar não comprova login nem jogabilidade.

Repositório privado no GitHub; ainda sem licença definida. O build depende de recursos privados locais.
