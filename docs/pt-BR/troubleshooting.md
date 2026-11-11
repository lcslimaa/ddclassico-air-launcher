# Diagnóstico e manutenção

[English](../en/troubleshooting.md) · [Índice](README.md)

| Sintoma | Verificação inicial |
|---|---|
| SDK ausente | Configure `DDCLASSICO_AIR_SDK`; confirme `bin/amxmlc` e `bin/adl` |
| Adaptador ausente/hash diferente | Confira entradas locais e metadados; não ignore o hash para executar outra versão |
| Sessão rejeitada/desconexão | Reinicie pelo site oficial com parâmetros novos; não copie tokens antigos |
| Outro AIR ativo | Feche o processo acompanhado; não apague um lock válido para lançar outra sessão |
| Jogo esticado | Verifique o guard `NO_SCALE` do modo integrado e a versão compilada |
| Clique desalinhado | Compare origem de conteúdo/tela após chrome nativo e mudança de monitor |
| Campo indisponível | O getter ou domínio pode variar com a versão; não substituir automaticamente por zero |
| Error 1065 | Classe/definição ausente; investigar módulo e contexto do erro antes de criar substituto |
| Helper continua no terminal | Pode haver outra janela do helper aberta; jogo AIR é um processo separado |

## Log de rede do site oficial

O helper registra respostas, falhas, redirecionamentos HTTPS e o handshake WSS para `ddclassico.com` e subdomínios em `.local/runtime/login-helper.log`. Linhas `[Network]` incluem método, rota sanitizada, tipo de recurso e status/erro; redirecionamentos mostram o status e o destino sanitizado. Para o primeiro documento, uma linha registra apenas se o User-Agent contém o identificador padrão Electron e se contém um marcador de produto DDClássico; o valor completo não é gravado nem alterado. Segmentos de rota que parecem identificadores são ocultados; nomes de parâmetros podem aparecer, mas seus valores não são gravados. Corpos, frames WebSocket, cookies e cabeçalhos de autenticação não são coletados. O registro para após 400 eventos por execução.

Para diagnosticar uma recusa no site, feche e reabra o helper, reproduza a mensagem e examine as linhas `[Network]` próximas ao horário. Compartilhe somente essas linhas após conferir que a rota não contém dados pessoais. Não compartilhe o perfil do navegador nem a pasta `.local/runtime` inteira.

O erro 1065 apareceu em situações diferentes durante a investigação; não há uma correção universal comprovada. Um erro de classe específica deve ser analisado com seus módulos/recursos, sem substituir a classe por uma implementação vazia.

## Ferramentas históricas

`tools/investigation` reúne análise de HAR, inventário de cache, extração de SWF, exportadores manuais e relatório de estabilidade. São instrumentos de investigação, não passos obrigatórios do login atual. HAR e exports podem conter credenciais e respostas; mantenha-os sob `.local/captures` e não os adicione a issues.

Os probes AIR antigos estão em `tools/investigation/air-probes`. Use `bash scripts/build-probes.sh` para compilar separadamente e `bash scripts/run-check.sh runtime` para o teste básico. Configurações locais e logs permanecem fora do Git. Os antigos modos `game`, `local`, `config` e `session` continuam explícitos; o teste `session` é manual e não cria autenticação.

Antes de atualizar Electron, SDK ou bootstrap, registre versão, rode os testes e repita a validação em jogo. Esta reorganização não introduz atualização automática nem empacotamento Windows.
