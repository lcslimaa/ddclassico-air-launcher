# ADR 0002: Handoff temporário com parâmetros frescos

[Other language](../../en/decisions/0002-fresh-session.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

Os valores mudam a cada lançamento observado. Alternativas: argumentos com credenciais, cookies compartilhados ou replay. Escolha: arquivo privado exclusivo, validação local, ACK e remoção. Consequência: limpeza e lifecycle precisam de testes; o ACK não prova aceitação pelo servidor.
