# ADR 0005: Chrome nativo e correção de escala

[Other language](../../en/decisions/0005-native-chrome-scaling.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

O primeiro pilot esticava o jogo; o bootstrap redefinia exactFit. A pedido do usuário, controles customizados de janela foram removidos. Escolha: chrome nativo macOS, coordenadas globalToScreen e guard NO_SCALE somente no integrado. Consequência: offsets e movimentação precisam de teste; não assumir equivalência no Windows.
