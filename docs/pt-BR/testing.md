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
