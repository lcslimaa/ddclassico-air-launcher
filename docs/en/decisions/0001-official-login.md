# ADR 0001: Official login in Electron, execution in AIR

[Other language](../../pt-BR/decisions/0001-official-login.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Login uses the existing official flow. Alternatives were implementing authentication or manually importing sessions. Decision: Electron for login/capture and AIR for gameplay. Consequence: two technologies/processes and dependency on website flow, without inventing an authentication API.
