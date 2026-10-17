# Interface and controls

[Português](../pt-BR/interface.md) · [Índice](README.md)

## Game area

The game stage remains 1000×600 in AIR logical coordinates. Surrounding shell panels adapt without enlarging the game on larger displays. The main window uses native macOS chrome. Its owned borderless game window follows the content origin, including after shell movement or resizing.

The original bootstrap resets `scaleMode` to `exactFit`. Integrated mode restores `NO_SCALE` and top-left alignment on load initialization/completion and frames. This corrects stretching observed in the first pilot. Do not apply this indiscriminately to classic mode.

## Displayed information

The shell shows mission/map, wind and active participant, plus visible participants including the local player, with team, HP and state. The list scrolls. Availability depends on the loaded model version; `—` is not zero. Leaving a match clears participant data and shot history. Unresolved map names may fall back to an ID. A completed SWF load must not be labeled authenticated connection.

F2 toggles diagnostics and F4 opens the optional companion. In integrated mode, closing the companion does not stop the shell’s controller. Classic mode retains its earlier behavior. The chosen layout adds no dungeon rewards, separate attribute panels or angle editing.

## Power and Shoot

Input accepts whole numbers 1–100. The observed conversion is power × 20 internal units. Eligibility stays restricted to normal PvE conditions: local active turn, alive, stationary, unfrozen, normal shot mode, and the current force limit. The controller checks again; a visually enabled button is not the only guard.

The button follows the original keyboard control path: brief Space down/up, normal preparation and explicit replacement of the shot request’s power parameter. It does not construct network packets. Duplicate-request and timeout guards release synthetic Space. Aim stays as selected in the game; the diagnostic angle scale remains unresolved. The visible gauge follows the brief charge while the request uses entered power. A client request does not establish server acceptance or damage.
