> Historical English document. Not current instructions; use the README and current guides.

# Read-only shot input check

The companion's **Shot input check** section now keeps the last five local `sendShootAction` events while the window is open. It shows the event's power parameter, normal-shot power as a percentage of the captured client's 2000-unit reference, the integer of the model's force after the normal handlers, and the local aim angle. Special shot modes are labeled separately and are not given a normal-shot percentage. These are client requests, not proof of server acceptance or damage. No keyboard events, model setters or gameplay actions are generated. Nothing is saved or logged.

## Static input path, captured core

Selected reconstructed source is at `private/input-inspection/scripts/`.

1. `game.view.EnergyView.__attackingChanged` installs its frame handler while the player is attacking and alive. It resets its private charge to zero.
2. `__enterFrame` polls the existing keyboard manager for Space. When charging begins and the player is not moving, it starts the normal shoot preparation. Charging is kept in **EnergyView's private `_force`**, not continuously in `LocalPlayer.force`.
3. `calcForce` adjusts charge using elapsed time with a 100 ms per-update cap. The captured default step is 20, multiplied by 30 per second (600 internal units/sec). Charge is capped by `_maxForce`; it reverses direction after reaching that limit. Returning to zero follows the normal skip path. The gauge's width uses the 2000-unit reference, with a 498-pixel strip.
4. On the first frame where Space is no longer down, normal shot mode calls `LocalPlayer.sendShootAction(_force)`. Special mode passes `_force - _hitX` instead.
5. `LocalPlayer.sendShootAction` dispatches `sendShootAction`, carrying the number in `paras[0]`.
6. `GameLocalPlayer.__sendShoot` handles the existing request. For normal shots it sets `LocalPlayer.force` and starts its normal shot timer. The force setter caps at `Player.FORCE_MAX = 2000`. `__shootTimer` reads this force into an integer and passes it, calculated bomb angle and shot origin to `GameInSocketOut.sendGameCMDShoot`, conditional on the player being alive and the shot count.

The power getter on `EnergyView` itself reads slider position; it is not the private charging value. The 2000 reference does not establish that the game's current visual gauge labels are exactly 0–100. Angle sent through `calcBombAngle()` may differ from the displayed gun angle. Frozen, focus, text-input and other restrictions need live confirmation; the traced methods do not prove every guard.

## Run now

Restart the usual helper with a fresh login. Enter PvE, open the companion with F4, keep it open, then click back into the game so Space goes to the game window. Scroll to **Shot input check** afterward. Take normal short, medium and near-full-power shots on separate turns and compare the displayed gauge at release with the recorded request. Avoid holding through the power reversal for the initial comparison. Confirm the model integer matches the normal request's truncated/capped value and that the server displays a normal shot.

Then check an ordinary Space press outside your turn: it should not add a request if the original controls prevent shooting. Observe frozen/disabled cases only when encountered normally. Change matches and confirm the five-entry list clears. Closing the companion pauses observation and clears entries; reopen before further shots. Key release can occur before the next game frame processes the shot, so the display captures the semantic shot event rather than a keyboard-up timestamp.

Compilation passed with AIR SDK 51.4.1. Native runtime/model event visibility remains pending a live user test. A one-shot PvE numeric power control is now implemented separately; see [POWER_INPUT_TEST.md](POWER_INPUT_TEST.md). The shot check observes its resulting request after normal handlers. A Shoot button now starts the original Space-key path without a manual key press. Passive checking is unchanged when the control is not armed.
