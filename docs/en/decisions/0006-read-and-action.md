# ADR 0006: Separate observation from gameplay action

[Other language](../../pt-BR/decisions/0006-read-and-action.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Panels read models; Shoot changes a player action. Alternatives were duplicate per-window controllers or direct packets. Decision: selected snapshots and one shared controller, preserving normal shot flow and eligibility. Consequence: missing state must block actions; client observation is not proof of server authority.
