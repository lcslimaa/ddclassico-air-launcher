# ADR 0001: Login oficial em Electron, execução em AIR

[Other language](../../en/decisions/0001-official-login.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

O login usa o fluxo oficial já existente. Alternativas: reimplementar autenticação ou importar uma sessão manualmente. Escolha: Electron para login e captura, AIR para o jogo. Consequência: duas tecnologias/processos e dependência do fluxo do site; evita inventar uma API de autenticação.
