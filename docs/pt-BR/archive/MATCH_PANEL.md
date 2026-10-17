> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# Read-only match window

Match data and shot history remain read-only. A separate numeric power test is now present at the top; see [POWER_INPUT_TEST.md](POWER_INPUT_TEST.md). The Shoot button performs the original Space preparation/release with the selected power in a standard PvE dungeon; the manual Space override remains available.

The session launcher now opens a separate native AIR companion window automatically. Start the usual login helper with a fresh login. **F4** (or Fn+F4) in the game window reopens the companion after you close it; the diagnostics panel also has a **Match window (F4)** button. Closing the companion hides it and pauses its polling. Closing the main AIR window closes its owned companion. It does not create a second game session or Electron process.

The window refreshes twice per second. It displays map, wind, active participant, your HP/max HP, energy/max energy, rage, aim angle, shot power, alive/frozen state and effect names/counts. Other non-hidden participants show name, team, HP, energy, rage, alive/frozen state, turn-time value and effects where the model provides them. Buff names fall back to numeric IDs when unavailable; no localization lookup is performed. Hidden participants are omitted. No positions or opponent aiming values are displayed.

`—` means the getter is unavailable in the loaded version. Turn-time is the model's value, **not a verified countdown**. Remote participant values may be absent or incomplete. The view mirrors selected client-model fields; it does not query the server or establish that every field is authoritative. Scroll the text with the mouse wheel and resize the companion as needed.

The implementation resolves `game.GameManager` through the startup application domain and registered module domains. It accesses `Instance.Current` and explicitly selected public getters. No game setters, packet hooks, gameplay actions, session exports, or match-data logs are added. Polling retains no match history or participant references between refreshes. Missing game models, match exit or read failures replace the displayed snapshot rather than keeping stale numbers.

## Validation

The **Shot input check** section observes the last five local shot-request events while this window is open. See [SHOT_INPUT_CHECK.md](SHOT_INPUT_CHECK.md) for the traced Space-key path and live comparison steps. It records final request power rather than private live charging power; no shots or input are generated.

Compiled with AIR SDK 51.4.1. The startup adapter and game core were not modified. Native window behavior and live model visibility remain unverified in the agent environment, where ADL cannot initialize macOS Launch Services.

For the first live check, enter a normal PvE match and compare your HP against the game display. Verify damage and healing, energy use, turn changes and wind. Check that leaving the match clears the window, closing/reopening the companion works, and closing AIR closes both windows. If the window stays at “Waiting for the game core” after entering a match, class-domain discovery needs adjustment; do not treat this as an authentication failure. If specific values show `—`, report the field names rather than sharing session data.

## Integrated launcher view

The pilot shell now reads selected snapshots from this same controller and calls its existing Shoot entry point. It keeps polling while the optional companion is hidden; closing that companion does not stop the integrated shell. The legacy launcher retains its previous show/hide behavior. Live integration verification is pending.
