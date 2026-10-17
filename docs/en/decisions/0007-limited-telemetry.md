# ADR 0007: Limited telemetry and retired PvE logs

[Other language](../../pt-BR/decisions/0007-limited-telemetry.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Metrics help compare runs; account logs and dumps are unnecessary. Decision: numeric metrics and allowed diagnostics with bounded history; remove instance observers/CSVs after abandoning 2×. Consequence: some causes need targeted investigation; growth warnings do not establish leaks.
