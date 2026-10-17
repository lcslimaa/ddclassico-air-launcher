# ADR 0003: Adapt the initializer and preserve the core

[Other language](../../pt-BR/decisions/0003-bootstrap-adapter.md) · [ADRs](README.md)

Status: adopted in the current implementation; retrospective record. Migrated-checkout validation remains separate.

Startup reads stage LoaderInfo and assumes browser context. Alternatives were direct remote loading or broad core changes. Decision: narrow private adapter with checked inputs/hashes. Consequence: updates may require review; compilation does not prove compatibility. Git contains tooling, not SWFs.
