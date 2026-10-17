> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# One-shot numeric power test

The companion now has a power field (whole numbers **1–100**), **Shoot**, **Arm Space override**, and **Cancel override**. The original Space override was confirmed working by the user. The new button path is compiled but not yet live-verified.

1. Restart AIR through the usual helper with a fresh login and enter a standard PvE dungeon.
2. Aim in the game. During your turn, open the companion with F4, enter **30** and click **Shoot**. You do not need to press Space.
3. The game window activates and the original input handler processes a brief Space press/release. Companion status should show **Applied 30 power (600 units)**; shot input check should show **600 internal units · 30.0% · model integer 600**.
4. Confirm one normal shot occurred. Try another value on a later turn. Repeated clicks while the button sequence is processing are ignored.
5. **Arm Space override** retains the earlier manual-Space test; **Cancel override** clears that pending override before a shot begins.

The visible gauge follows the brief charging sequence, so its release position may differ from the entered power. This experiment changes the final request only. Your existing aim is preserved; the companion's angle label remains unresolved.

## Implementation and boundaries

A high-priority listener reads the existing `sendShootAction` event before the default game handler and replaces its `paras[0]` with entered power multiplied by 20. The captured event class returns the same mutable parameter array. The normal game handler performs its existing force assignment and shot submission. The Shoot button uses the original mobile shoot control’s stage KeyboardEvent pattern: key-down, one complete game frame of preparation, then key-up. It leaves EnergyView and the game’s own shot handler to perform preparation/release; no direct shooting call, packet construction or core patch is added. A four-frame completion guard and 1.5-second timeout stop the button sequence and release its synthetic Space state. Failure does not retry or leave an override armed. An already-held Space or active game text input blocks starting a button shot.

It requires the observed match/player to still be current, standard dungeon room type 4, the local player to be active, alive/attacking/shoot-enabled, stationary/unfrozen, and normal shoot type 0. Missing fields fail closed. Power must be within the current model `maxForce`. It clears on one attempt, timeout (30 seconds), invalid turn/state, match/player change, companion close or Cancel. If conditions change at the original request, the original shot request is left unchanged and the panel explains that the override was skipped.

Nothing is persisted. AIR SDK 51.4.1 compilation passed; GUI behavior, event ordering and server acceptance require the live test above. Report the panel status, recorded power and whether the game fired normally; do not share session data.
