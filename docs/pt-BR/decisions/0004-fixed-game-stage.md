# ADR 0004: Stage do jogo separado e fixo

[Other language](../../en/decisions/0004-fixed-game-stage.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

O código antigo usa dimensões e filhos do stage. Alternativa: colocar tudo em um stage maior e adaptar o jogo. Escolha: janela anexada 1000×600 com shell ao redor. Consequência: sincronizar origem, foco, agrupamento e lifecycle; validar por sistema operacional.
