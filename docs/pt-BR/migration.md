# Migração e mapa de arquivos

[English](../en/migration.md) · [Índice](README.md)

A origem é a pasta irmã `DDClassico_AIR_investigation`. Ela foi preservada e não deve ser executada simultaneamente com esta cópia. A nova raiz é um repositório independente; não é worktree nem substituição automática da antiga.

| Origem | Destino |
|---|---|
| `login-helper/*.js` | `apps/login-helper/src/` (preload de status em `ui/`) |
| `login-helper/status.html` | `apps/login-helper/ui/` |
| `probe/src` produtivo | `apps/air-launcher/src/` |
| Probes diagnósticos | `tools/investigation/air-probes/` |
| Descritores do launcher | `apps/air-launcher/descriptors/` |
| Build comum | `scripts/build-air.sh` → `build/air/` |
| Ferramentas de adaptador | `tools/adapter/` |
| Outras ferramentas | `tools/investigation/` |
| Testes Python/Node de ferramentas | `tests/tools/` |
| Documentos antigos | `docs/pt-BR/archive/` e `docs/en/archive/` |
| Recursos privados mínimos | `.local/assets/` e `.local/evidence/` |
| Novos perfis/logs/locks | `.local/runtime/` |
| Novos caches | `.local/cache/` |

Não foram copiados perfis autenticados, exports de sessão, marcadores de processo, HARs, caches ou logs antigos. Os fontes/SWFs necessários ao build/adaptador foram copiados somente para a área ignorada. A pasta antiga conserva o restante do material local.

Imports, testes, entrypoint do helper e scripts foram ajustados para os novos caminhos. As versões do Electron e descritores de runtime foram preservadas; o SDK sai do caminho pessoal fixo e passa a ser configuração explícita. O build normal deixa de exigir as configurações dos probes históricos.

A inicialização do Git e o primeiro commit não publicam nada. As exclusões devem ser auditadas com `git status`, `git ls-files` e `git check-ignore`. O commit inclui somente a base selecionada; não inclui `.local`, outputs ou dependências.

Para voltar ao ambiente anterior, feche os processos novos e execute os scripts da pasta antiga. Não apagar a pasta antiga durante esta etapa. Sucesso do build/testes no novo diretório não substitui a validação manual em jogo.
