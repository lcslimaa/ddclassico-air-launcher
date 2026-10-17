# ADR 0003: Adaptar o inicializador e preservar o núcleo

[Other language](../../en/decisions/0003-bootstrap-adapter.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

O startup lê LoaderInfo do stage e pressupõe ambiente browser. Alternativas: carregamento remoto direto ou alterações amplas no núcleo. Escolha: adaptador privado estreito com entradas/hashes verificados. Consequência: atualizações podem exigir revisão; compilação não comprova compatibilidade. O Git contém a ferramenta, não os SWFs.
