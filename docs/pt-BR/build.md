# Build e recursos privados

[English](../en/build.md) · [Índice](README.md)

## Entradas e saídas

O build normal compila apenas `SessionLauncher` e `LayoutPilotLauncher`, copia seus descritores e o adaptador verificado para o diretório definido por `build` em `config/paths.json`. Não exige o `config.local.json` dos antigos testes de compatibilidade.

Entradas locais necessárias para o build:

- `.local/assets/session-adapter/DDT_Loading.air.swf`.
- `.local/evidence/session-adapter.json`, contendo `adaptedSHA256` correspondente.
- AIR SDK HARMAN apontado por `DDCLASSICO_AIR_SDK`.

Não obtenha arquivos de jogo de colaboradores por sessão autenticada. Os recursos privados não estão no Git. Um colaborador precisa preparar suas próprias entradas locais; um clone limpo executa os testes de lógica, mas não gera um cliente jogável sem essas entradas.

## Recriar o adaptador

A ferramenta `tools/adapter/prepare_session_adapter.py` usa o SWF original validado por hash, os fontes reconstruídos `DDT_Loading.as` e `NormalLuncher.as` e JPEXS. As entradas ficam em `.local/assets/swfs/756678cfdd94.swf` e `.local/assets/decompiled/756678cfdd94/scripts/`. A versão/caminhos do JPEXS são fornecidos explicitamente por `--ffdec`; Java é necessário.

```bash
python3 tools/adapter/prepare_session_adapter.py --ffdec '/caminho/ffdec.jar'
npm run build
```

A transformação exige a estrutura esperada e rejeita mudanças inesperadas, em vez de aplicar uma correção genérica a uma versão nova. Remove defaults de login, muda as leituras de LoaderInfo necessárias ao bootstrap e preserva recursos não alterados. A substituição de scripts do JPEXS é experimental; reconstruir exige nova verificação estática e em jogo. O hash esperado não comprova ausência de bugs.

## Reprodução

As dependências do helper são fixadas pelo lockfile em sua própria pasta. Não existe workspace npm compartilhado. SDK, dependências instaladas e outputs ficam fora do commit. Os descritores e código-fonte são versionados; perfis, sessões e metadata de recursos privados ficam locais. Os testes de diagnóstico AIR antigos usam um build separado, descrito em [diagnóstico](troubleshooting.md).
