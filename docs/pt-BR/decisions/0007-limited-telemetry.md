# ADR 0007: Telemetria limitada e remoção dos logs PvE

[Other language](../../en/decisions/0007-limited-telemetry.md) · [ADRs](README.md)

Estado: adotado na implementação atual; registro retrospectivo. A validação do checkout migrado continua separada.

Métricas ajudam a comparar execuções, mas logs de conta e dumps não são necessários. Escolha: números e diagnóstico permitido, com histórico limitado; retirar observadores e CSVs de instâncias após abandonar 2×. Consequência: algumas causas exigem investigação específica; não confundir alerta de crescimento com vazamento comprovado.
