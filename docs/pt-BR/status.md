# Estado atual e roadmap

[English](../en/status.md) · [Índice](README.md)

## Base conhecida

O usuário confirmou anteriormente login pelo site oficial, execução em AIR e partidas PvE; relatou cerca de 26 minutos com inventário, melhorias e combate funcionando. Também confirmou o funcionamento do viewport corrigido e da substituição de potência. Isso é evidência local relatada, não uma matriz completa de compatibilidade.

A interface integrada inclui dados de partida e controle Shoot. Não generalizar as confirmações anteriores para todo recurso adicionado depois. O novo diretório precisa repetir os testes manuais da migração. O agente consegue compilar e testar lógica, mas o ADL neste ambiente pode falhar antes de abrir a interface.

## Limitações

- Dependência de inicializador privado adaptado; novas versões podem exigir revisão.
- Modelos do cliente podem mudar; nomes/valores e estados devem ser verificados em jogo.
- Shoot limitado ao PvE normal elegível; rótulo de ângulo do companion continua sem validação.
- Windows, instaladores e distribuição não estão implementados.
- Não existe servidor comunitário próprio nem implementação independente do jogo.
- Aceleração universal, logs de instâncias e farm automático não fazem parte do produto atual.

## Próximos marcos

Primeiro: validar o novo checkout em macOS com login fresco e a lista manual. Depois: separar controller/view do companion, revisar comportamento após atualizações e planejar portabilidade Windows como trabalho separado. Não incluir essas funcionalidades silenciosamente na migração.

O Git é local, sem remoto. Licença do nosso código ainda não foi escolhida; não há concessão automática de redistribuição. Recursos e código de terceiros não passam a pertencer ao projeto por estarem na pasta local.
