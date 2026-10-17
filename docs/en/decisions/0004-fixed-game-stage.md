# ADR 0004: Separate fixed game stage

[Other language](../../pt-BR/decisions/0004-fixed-game-stage.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Older code uses stage dimensions and children. Alternative: one enlarged stage with game adaptation. Decision: owned 1000×600 game window surrounded by a shell. Consequence: synchronize origin, focus, grouping and lifecycle; validate each operating system.
