> Historical English document. Not current instructions; use the README and current guides.

# Reward and loot inspection

Inspected locally on 2026-10-14, using the saved plain game core identified in MATCH_DATA_INSPECTION.md. Selected reconstructed sources are private under `private/loot-inspection/scripts/`. No live account requests or game changes were made. This captured core may predate the current update.

## Confirmed findings

**Dungeon reward previews:** `room.view.bigMapInfoPanel.MissionRoomBigMapInfoPanel.updateDropList` selects comma-separated item template IDs from `ddt.data.map.DungeonInfo`: `SimpleTemplateIds`, `NormalTemplateIds`, `HardTemplateIds`, `TerrorTemplateIds`, or `EpicTemplateIds`, according to difficulty. These are preview lists, not probabilities or a guarantee of a complete loot pool.

**Post-match reward cards:** `game.GameManager` registers `GAME_TAKE_OUT` and `SHOW_CARDS`. `SmallCardsView.__takeOut` and `LargeCardsView.__takeOut` read the card index, reward template ID and quantity from the received event, then display the result through `LuckyCard.play`. LargeCardsView also reads a boolean passed to the card display. `LargeCardsView.__showAllCard` reads index/templateID/count for revealed cards. The inspected path renders supplied outcomes; it does not calculate a drop probability or roll the item locally. This supports server-supplied reward outcomes, but does not reveal the server's algorithm.

**Box and lottery preview data:** `StartupResourceLoader` requests `LoadBoxTemp.xml`, consumed by `BoxTempInfoAnalyzer`, and `LotteryShowTemplate.xml`, consumed by `CaddyAwardDataAnalyzer`. The exported `BoxGoodsTempInfo` contains item ID, quantity, quality, binding, validity, strengthening and composition attributes. `CaddyAwardInfo` contains similar attributes plus box type and sort ID. Neither inspected model declares a probability/weight field. Quality and SortID must not be treated as drop odds. The box analyzer copies XML properties into the models, so these declarations alone do not establish every field in the remote payload.

**Quest rewards:** `QuestItemReward` has item ID, quantity, optional selection, binding, validity and upgrade/composition properties. This is a reward definition, not a random-drop probability.

**A rate-related lead:** `StartupResourceLoader.createAddPublicTipLoader` references `ActivitySystemItemsRate.xml`. `AddPublicTipDataAnalyzer` reads `ActivityType`, `Quality`, `TemplateID` and `Rate`, storing them as `AddPublicInfo.activityType`, `.quality`, `.templateID`, `.rate` (integer). `AddPublicTipManager` stores and looks up these entries by item ID and activity type. This is a real client-side rate field, but its use, scaling, units and authority were not established. It is not evidence of dungeon drop percentages. No matching resource was found in the four saved HAR files inspected. The inspected tooltip classes did not establish its consumer.

## Saved resource limitations

The saved handoff HAR includes HTTP-200 bodies for lowercase `loadboxtemp.xml`, `loadpveitems.xml` and `lotteryshowtemplate.xml`. Direct XML parsing and standard zlib/base64 decoding attempts did not yield parsed tables. The payload schema/contents were therefore not verified. `evidence/loot-resource-schema.json` records only resource basenames, status, body size and parse outcome; no session values or response bodies are exported.

## What a read-only view could display

- Existing dungeon preview items by difficulty, resolved through item templates.
- Final received reward items and quantities after the normal game reveals them.
- Quest and box preview definitions already available in the client.
- Observed reward history, if separately implemented with user-selected context. Frequencies would be estimates, not exact server rates; difficulty, event modifiers, choice of cards and sample size matter.

No reliable dungeon/boss drop percentages were recovered. The activity `Rate` lead needs its consumer and current table checked before displaying a number as a percentage. No loot tracking or additional panel fields were implemented in this inspection.
