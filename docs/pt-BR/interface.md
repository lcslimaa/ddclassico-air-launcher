# Interface e controles

[English](../en/interface.md) · [Índice](README.md)

## Área do jogo

O game stage permanece 1000×600 em coordenadas lógicas do AIR. O shell adapta os painéis ao redor; não aumenta o jogo em monitores maiores. A janela principal usa chrome nativo do macOS. A janela anexada do jogo é sem borda e acompanha a origem do conteúdo, inclusive após mover ou redimensionar o shell.

O bootstrap original redefine `scaleMode` para `exactFit`. No modo integrado, o launcher restaura `NO_SCALE` e alinhamento superior esquerdo na inicialização/conclusão do load e em frames. Isso corrige o esticamento observado na primeira versão. Não aplicar essa regra indiscriminadamente ao modo clássico.

## Informações exibidas

O shell mostra missão/mapa, vento e participante atual; lista participantes visíveis, incluindo o jogador local, com equipe, HP e estado. A lista permite rolagem. A disponibilidade depende do modelo da versão carregada; `—` não significa zero. A ausência de partida limpa dados e histórico de disparos. Nomes ausentes de mapa podem aparecer como ID. Não declarar conexão confirmada apenas porque o SWF terminou de carregar.

F2 alterna diagnóstico e F4 abre o companion opcional. No modo integrado, fechar o companion não interrompe o controlador usado pelo shell. No clássico, ele mantém seu comportamento anterior. Não foram acrescentados painéis de recompensas, atributos separados ou edição de ângulo ao layout escolhido.

## Potência e Shoot

A entrada aceita inteiros de 1 a 100. A conversão observada é potência × 20 em unidades internas. A função permanece limitada aos estados elegíveis do PvE normal: turno local, vivo, parado, não congelado, modo de tiro normal e limite atual de força. A validação é repetida no controlador, não depende apenas da aparência habilitada do botão.

O botão usa o caminho de teclado do controle original: breve Space pressionado/solto, preparação normal e substituição explícita do parâmetro do pedido de tiro. Não cria pacote de rede diretamente. Há bloqueio de repetição e timeout para liberar Space. O ângulo é o já escolhido no jogo; a escala de ângulo do painel de diagnóstico não foi corrigida. O medidor visual segue a carga breve, enquanto o pedido usa o número escolhido. Confirmar um pedido no cliente não comprova aceitação ou dano no servidor.
