> Historical English document. Not current instructions; use the README and current guides.

# Dependência de animações e liberação do turno

Inspeção estática do core capturado (`fedbb036df33ee80d4961f95c8531f33717bbdc2a65d31e5ce91d212410eff75`), após a segunda coleta do Formigueiro Normal. Não houve alteração do jogo nem envio de comandos de teste.

## Caminho identificado

`SocketManager` transforma o comando recebido `TURN` em `PLAYER_CHANGE`. `GameView.__playerChange` atualiza o participante atual e agenda `ChangePlayerAction`.

`ChangePlayerAction.execute` aguarda `map.hasSomethingMoving() == false` e ausência de ações pendentes do participante anterior. Executa a sincronização do estado recebido e uma pequena contagem local antes de marcar o novo participante como `isAttacking=true` e atualizar os controles. O valor padrão da contagem é `200/40 = 5` execuções, não 200 ms medidos em relógio. A resolução da coleta do estado local é de 500 ms, e a comparação observada de 135–473 ms entre despacho e ativação é compatível com uma transição local curta. Isso não demonstra a origem das pausas anteriores ao comando.

No caminho de fala inspecionado, `Living.say` dispara um evento e `GameLiving.__say` apresenta o balão. O temporizador do balão apenas o oculta/remove. Não foi localizada confirmação ao servidor nesse caminho.

No caminho de animação inspecionado, `GameLiving.__playMovie` chama `ActionMovie.doAction`. O fim executa callbacks locais registrados, se houver, e emite `actionEnd`. Não existe confirmação de rede genérica embutida nesse término; callbacks específicos e módulos externos podem ter outros efeitos. O evento também é emitido quando outra ação interrompe a anterior.

## Comandos encontrados e seus limites

`GameInSocketOut` define `sendPassStory`, `sendClientScriptStart` e `sendClientScriptEnd`. O levantamento de referências nomeadas em P-code do core completo encontrou chamadas aos comandos de roteiro em classes de `fightLib`, relacionadas a treinamento e exercícios. Não foi localizada chamada direta a `sendPassStory` no core exportado. A simples existência de um comando não estabelece que ele seja válido ou eficaz para uma instância normal. Nenhum desses comandos foi invocado.

O resumo de referências foi removido junto dos registros da análise, a pedido do usuário. A pesquisa cobre referências diretas nomeadas, não chamadas construídas dinamicamente, módulos carregados à parte ou implementação do servidor. O core capturado pode ser anterior à versão atual.

## Conclusão prática

Não foi identificado um mecanismo genérico de “animação terminou, liberar o próximo turno no servidor” aplicável ao Formigueiro Normal. As medições mostram que o comando de turno é seguido rapidamente da ativação local; reduzir apenas os balões ou os limites de animação não garante antecipar a chegada desse comando.

Não há base para implementar um 2× universal que prometa reduzir a espera preservando física, comandos e temporização de combate. Aceleração apenas visual é um objetivo diferente e não deve ser apresentada como solução comprovada para a demora. Para reduzir a espera de forma confiável, o caminho preferível é suporte explícito do jogo/servidor a pular ou acelerar a introdução. Outra possibilidade exigiria identificar um mecanismo específico da instância nos módulos realmente usados, sem assumir que os comandos do treinamento se apliquem.
