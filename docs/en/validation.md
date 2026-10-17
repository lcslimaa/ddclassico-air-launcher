# Reorganization validation

[Português](../pt-BR/validation.md) · [Index](README.md)

Checks performed on October 16, 2026, on macOS with AIR SDK 51.4.1:

- 33 helper Node tests, 12 Python tests and 2 Node tooling test scripts passed.
- Both production launchers and all three probes compiled successfully.
- Relative links and current Portuguese/English document parity checked automatically.
- Each shell script checked individually for syntax errors.
- A copy without `.local/`, `build/` or dependencies passed tests and documentation checks.
- Missing SDK or private adapter produces an explicit failure. With the local adapter and metadata supplied, build passed from another working directory and a path containing spaces.
- Adapter transformation compared against the previous implementation with identical local inputs: equivalent outputs.
- Independent review compared production ActionScript sources and session transport with the previous folder. Sources were preserved; organizational changes adjust paths and entry points.

Gameplay **still requires manual validation from the new folder**, following the [test checklist](testing.md). Earlier gameplay reports concern the previous version and do not establish acceptance of this migration. No login was performed for these checks.

Git is local only, with no remote. The initial commit uses the local technical identity `DDClassico migration <migration@local.invalid>`; configure your own identity before subsequent commits. Minimal private inputs prepared on this machine remain outside Git; another checkout must supply them using the [build guide](build.md).
