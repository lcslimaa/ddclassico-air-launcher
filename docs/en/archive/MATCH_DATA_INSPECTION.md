> Historical English document. Not current instructions; use the README and current guides.

# Match data inspection

Inspected locally on 2026-10-13. No connection to the game, live memory capture, packet interception, or gameplay modification was performed.

## Evidence and version limits

The saved `captures/session-handoff.har` contains a plain SWF response for the game core `/2.png`, 5,650,194 bytes, SHA-256 `fedbb036df33ee80d4961f95c8531f33717bbdc2a65d31e5ce91d212410eff75`. A private copy is at `private/swfs/match-core.swf`. Selected classes were exported with JPEXS to `private/match-inspection/scripts/`. The captured version may predate the latest game update. Decompiled source is reconstructed and must be checked against live behavior.

## Confirmed model members

| Information | Model members | Source |
|---|---|---|
| Current and maximum HP | `Living.blood`, `Living.maxBlood` | `game/model/Living.as`, getters at lines 501 and 512 |
| Character label, match identifier, team | `Living.name`, `Living.LivingID`, `Living.team` | `Living.as`, lines 427–445 |
| Alive, frozen, hidden states | `Living.isLiving`, `Living.isFrozen`, `Living.isHidden` | `Living.as` |
| Energy | `Living.energy`, `Living.maxEnergy` | `Living.as`, line 1085 and public field |
| Effect collections | `Living.localBuffs`, `turnBuffs`, `petBuffs`, `outTurnBuffs` | `Living.as` |
| Rage | `Player.dander` | `game/model/Player.as`, line 328 |
| Turn-time value | `Player.turnTime` | `Player.as`, line 502; not yet established as a live countdown |
| Local aim angle and power | `LocalPlayer.gunAngle`, `LocalPlayer.force` | `game/model/LocalPlayer.as`, lines 248 and 293 |
| Match participants and teams | `GameInfo.livings`, `teams`, `roomPlayers` | `game/model/GameInfo.as` |
| Active participant, local player | `GameInfo.currentLiving`, `selfGamePlayer` | `GameInfo.as` |
| Map and wind | `GameInfo.mapIndex`, `wind` | `GameInfo.as` |

These are available model members, not proof that each is populated, visible, or authoritative for every opponent or game mode. Hidden states and positions should not be exposed in a panel merely because the client retains them. A panel can mirror information the normal game UI makes available and the local player's own state. Remote aim values, full combat attributes, cooldown accuracy, and hidden/opponent information were not validated.

## HP update path

`GameManager` registers the `PLAYER_BLOOD` event and forwards it to `GameView.playerBlood`. That handler finds the participant using the event's match identifier and calls `Living.updateBlood`. The model emits `LivingEvent.BLOOD_CHANGED`; updates can represent damage, healing, or other HP adjustments. Some update types apply a damage delta rather than replacing HP directly. A panel should observe the existing model and event instead of duplicating the packet parser.

## Candidate read-only integration

The public entry point is `game.GameManager.Instance.Current`. `NormalLuncher` already resolves dynamically loaded classes through `com.pickgliss.loader.ModuleLoader.getDefinition`, whose implementation references application domains and falls back to normal class lookup. The AIR wrapper loads the startup adapter into a loader domain; visibility of the core's singleton from that wrapper must be verified before implementation. Checking only the AIR wrapper's own application domain may miss the loaded class.

Next runtime check: resolve the manager after core loading, verify `Current` during an actual match, and compare the local player's HP against the displayed game value. Then test damage, healing, death, participant removal, and match exit. Subscribe and unsubscribe to model events with match lifecycle changes; clear the panel outside matches so old values are never presented as current. Render only a small explicit field list, without inspecting or logging account/session objects. No setter calls, gameplay method calls, core patch, or automatic game action is required for this proposed panel.

No match-data display has been added to the launcher by this inspection.
