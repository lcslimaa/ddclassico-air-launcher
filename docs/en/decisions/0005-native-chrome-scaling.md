# ADR 0005: Native chrome and scale correction

[Other language](../../pt-BR/decisions/0005-native-chrome-scaling.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

The first pilot stretched the game because bootstrap reset exactFit. Custom window controls were removed at user request. Decision: native macOS chrome, globalToScreen coordinates and an integrated-only NO_SCALE guard. Consequence: test offsets/movement; do not assume Windows equivalence.
