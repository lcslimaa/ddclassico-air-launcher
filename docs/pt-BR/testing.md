# Testes e critérios de validação

[English](../en/testing.md) · [Índice](README.md)

## Verificações automatizadas

```bash
npm test
npm run check:docs
npm run build
npm run check:shell
```

`npm test` executa testes do helper e ferramentas Python/Node. Cobrem origem/frame da captura, tentativa única, transporte por arquivo, limpeza após ACK/timeout, proteção de PID, filtros de registros e métricas. Fixtures usam dados sintéticos. O teste de layout cobre caminhos esperados; não substitui a comparação visual.

O build exige recursos locais, mas os testes não devem depender de sua conta nem de arquivos recuperados do jogo. Testar numa cópia sem `.local/` confirma essa separação. Uma falha por falta do SDK ou adaptador deve ser explícita.

## Validação manual após a migração

1. Feche o jogo e helper antigos e inicie a nova pasta com sessão fresca.
2. Confirme login e entrada em PvE. Anote versão do SDK, sistema e modo, sem registrar tokens.
3. Mova/redimensione a janela. Confira 1000×600, alinhamento de mouse, controles nativos e encerramento.
4. Compare HP, vento, participante atual e limpeza após sair da partida.
5. Teste Space normal e um disparo de potência 30 no shell; confirme um único tiro e potência 600 no pedido do cliente. Não generalize aceitação para todas as instâncias.
6. Abra/feche F4 e confirme que não duplica listeners nem interrompe o shell.
7. Confira CSVs de memória/FPS com o helper aberto e ausência da coleta de instâncias retirada.

Os estados de validação são distintos: compilado, teste automatizado aprovado, observação local relatada pelo usuário e não testado. Não converter download HTTP 200, SWF carregado ou ACK em sucesso de autenticação. Neste ambiente o ADL já falhou no Launch Services antes da execução; essa limitação deve ser relatada, não mascarada com aprovação dos testes de lógica.

## Diagnóstico de FPS no lobby

Reinicie o helper e o AIR para carregar o build atualizado. Mantenha o helper aberto durante a medição. Com a janela do jogo ativa, pressione a tecla correspondente logo após cada ação (no Mac, use Fn se necessário):

| Tecla | Marcador manual |
|---|---|
| F6 | Início da medição, sozinho no lobby |
| F7 | Convite enviado |
| F8 | Pessoa entrou |
| F9 | Pessoa saiu |
| F10 | Você saiu do lobby |

Aguarde aproximadamente 15 segundos entre etapas, quando possível. Os marcadores são anotações do usuário, não detecção automática dos eventos do servidor. Repita o teste com outro lobby para comparação.

O arquivo `.local/runtime/login-helper.log` recebe os marcadores e o estado das janelas (ativação, minimização e fechamento, também amostrado a cada 5 segundos). Os arquivos em `.local/runtime/memory/` compartilham o mesmo prefixo por execução: `.csv` para memória AIR, `.fps.csv` para FPS e `.process.csv` para CPU e memória residente do processo AIR. A coluna `elapsed_ms` alinha as métricas com o relógio AIR; `utc_ms` registra a coleta do processo. CPU é a diferença do tempo acumulado do processo entre leituras: 100% equivale a um núcleo ocupado e o valor pode superar 100%. A primeira leitura estabelece a referência, sem linha de CPU. A coleta usa `ps` no macOS e não inclui argumentos de processos, nomes de jogadores ou parâmetros de sessão.

Esses dados distinguem aumento de CPU, mudanças de janela e quedas de FPS; não atribuem tempo a funções nem medem uso de GPU. Um perfil de execução continua necessário para identificar funções custosas. Falhas da coleta são registradas sem interromper o jogo.
