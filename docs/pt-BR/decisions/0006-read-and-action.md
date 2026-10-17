# ADR 0006: Separar observação de ação de gameplay

[Other language](../../en/decisions/0006-read-and-action.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

Painéis leem modelos; Shoot altera uma ação do jogador. Alternativas: duplicar controladores por janela ou construir pacotes diretamente. Escolha: snapshot selecionado e um controlador compartilhado, preservando o caminho normal de tiro e condições de elegibilidade. Consequência: estado ausente deve bloquear ações; ler o modelo não comprova autoridade do servidor.
