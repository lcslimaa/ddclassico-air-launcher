# Métricas e registros

[English](../en/observability.md) · [Índice](README.md)

## Métricas

FPS conta atualizações `ENTER_FRAME` do stage do jogo, não apresentações da GPU. O alvo é `gameStage.frameRate`, que o próprio jogo pode mudar. Um FPS menor aumenta naturalmente o intervalo: 60 FPS ≈ 16,7 ms; 30 FPS ≈ 33,3 ms. Esse intervalo não é latência de rede nem tempo de CPU por frame.

O HUD atualiza aproximadamente a cada segundo; a telemetria detalhada usa janelas de cerca de cinco segundos com média, P95, máximo e indicador de primeiro plano. Compare períodos com a mesma cena, limite e foco. A média visual do shell e a janela do CSV podem ter períodos diferentes.

A memória registra `System.totalMemoryNumber`, `freeMemory` e `privateMemory`. São métricas do processo AIR, não do Electron. A tendência usa aquecimento e mínimos por minuto; crescimento sustentado pede investigação, mas não comprova vazamento. A ausência de alerta não descarta vazamento.

## Arquivos

O diretório de runtime contém o log permitido do helper e `memory/air-<execução>.csv`, acompanhado de `.fps.csv`. Há histórico limitado em memória; o CSV retém a execução completa. Manter o helper aberto é necessário para registrar. Os gráficos do shell guardam 60 amostras; o gráfico de memória é relativo ao pico dessas amostras, sem um veredito de estabilidade.

O parser aceita somente telemetria numérica em formatos conhecidos. Diagnóstico normal filtra mensagens e, quando disponível, nomes lexicais de funções; não grava o texto bruto do erro. Uma falha de escrita interrompe o gravador afetado em vez de lançar erro no caminho do jogo.

## O que não está ativo

A instrumentação de instâncias, diálogos e limites de animação foi removida a pedido do usuário. Não recriar CSVs `.pve.csv` ou `.pve-detail.csv` nem observadores dessa investigação. O botão 2× e farm automático não foram implementados. Saídas manuais de ferramentas de investigação podem conter dados privados e devem permanecer em `.local`, mesmo quando o logger normal é filtrado.
