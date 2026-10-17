# ADR 0002: Temporary handoff with fresh parameters

[Other language](../../pt-BR/decisions/0002-fresh-session.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Observed values change per launch. Alternatives were credential-bearing arguments, shared cookies or replay. Decision: exclusive private file, local validation, ACK and deletion. Consequence: cleanup/lifecycle need testing; ACK does not establish server acceptance.
