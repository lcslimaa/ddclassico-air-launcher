# Mapa dos componentes

[English](../en/components.md) · [Índice](README.md)

| Componente | Responsabilidade e dependências |
|---|---|
| `main.js` | Janelas do login, navegação oficial, IPC, inicialização de telemetria e handoff |
| `capture.js` | Detecção do lançamento e validação dos parâmetros/origem |
| `handoff.js` | Arquivo temporário, subprocesso ADL, ACK, timeout e diagnóstico permitido |
| `air-lease.js` | Exclusão de tentativas simultâneas por PID e identificação do proprietário |
| `memory-monitor.js` / `fps-monitor.js` | CSVs numéricos privados e históricos limitados |
| `SessionLauncher.as` | Recebe a sessão, carrega o bootstrap e coordena telemetria e janelas |
| `SessionFile.as` | Validação do contrato local `ddclassico-air-session-v1` |
| `LayoutPilotLauncher.as` | Entrada do shell integrado, mantendo a entrada clássica |
| `LauncherShell.as` | Layout, gráficos, participantes e entrada explícita de potência |
| `MatchPanel.as` | Descoberta dos modelos, snapshots, companion opcional e controlador compartilhado de disparo |

## Contratos

O subprocesso recebe `--bridge-session` e o caminho de um arquivo, nunca as credenciais nos argumentos. O ACK é uma mensagem fixa; indica apenas que o AIR aceitou a sessão local. Não comprova autenticação do servidor.

O shell recebe um snapshot de campos selecionados por callback a cada aproximadamente 500 ms. Ambos os painéis usam um único controlador para evitar ouvintes duplicados e disparos repetidos. Valores ausentes e transições de partida precisam limpar o estado visível.

O mapa compartilhado `config/paths.json` define assets, evidências, runtime, caches, capturas e build em relação à raiz. O helper o carrega por `project-paths.js`; scripts shell e ferramentas de adaptador/estabilidade também o usam. Ferramentas de análise com argumentos de arquivo explícitos mantêm esses argumentos; seus padrões usam os diretórios locais documentados.

## Dívida técnica

`MatchPanel` ainda mistura leitura de modelos, visualização e controle de potência. `SessionLauncher` ainda coordena várias responsabilidades. Esta migração preserva esses contratos; uma futura separação em controlador/modelo/view deve ser feita como refatoração própria, com comparação de comportamento em jogo.
