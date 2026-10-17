> Documento histórico em inglês. Não usar como instrução vigente. Consulte o README e os guias atuais.

# AIR stability checks

One authenticated interactive session is confirmed: you reached the logged-in lobby and interacted for five minutes without disconnecting after the second automatic startup. Two automatic startups completed. Error 1065 appeared once, did not recur in that confirmed session, and remains unresolved; no speculative SWF fix has been applied.

The value-free results live in [evidence/stability-status.json](evidence/stability-status.json). The helper now keeps a private process marker for its AIR child, including when AIR outlives the helper. A tracked open AIR process blocks a new official login window before more session values are issued. Dead process markers are recovered when the next handoff starts. A malformed marker stops launch for local review. Do not delete a marker while AIR is open.

## 1. Two more fresh interactive sessions

Close any older AIR/helper windows, then run:

```bash
bash "<LOCAL_PATH>"
```

Use your existing account and character. Leave the official login window and helper open. In AIR, reach the lobby, interact normally and remain connected for five minutes. Record whether error 1065 or another problem appeared. A startup screen, HTTP 200 or an open process alone is insufficient.

After the five-minute check, record the result for the second verified session:

```bash
cd "<LOCAL_PATH>"
python3 tools/stability_report.py --record fresh_login_2 --result passed
```

Close AIR and both helper windows. Repeat through the official website in a new helper run, then record `fresh_login_3` in the same way. Use `--result failed` if a check fails. The report refuses to count one launch as multiple passed interactive sessions. It does not replay session values.

You can instead report the outcomes in the conversation; the agent will update the report from your explicit confirmation. No session values or full Chromium output are needed.

## 2. Gameplay, controls and storage

During an ordinary session, check these behaviors and report each as passed, failed or not tested:

| Report check | Manual test | Pass condition |
| --- | --- | --- |
| `room_entry_exit` | Enter and leave a normal room | Navigation works without a hang or disconnect |
| `match_completion` | Complete one ordinary match using your usual mode | Controls, turns and return to the lobby work |
| `keyboard_controls` | Exercise the usual game shortcuts/controls | Correct actions without stuck keys |
| `mouse_input` | Click, drag and scroll where normally supported | Correct targets and no coordinate offset |
| `portuguese_chat` | Type accented Portuguese text in a text field, then remove it | Characters and editing display correctly; sending chat is unnecessary |
| `focus_restore` | Switch to another app and back | Keyboard and mouse input resume correctly |
| `window_resize` | Resize smaller/larger | Game stays usable and input aligns with the display |
| `fullscreen` | Test fullscreen through the available window/game control | Entry/exit and input work; record unavailable support as a failure |
| `settings_persistence` | Change one ordinary preference and restart AIR | Its expected saved value survives; restore your preferred value afterward |

Record checks with the same command, for example:

```bash
python3 tools/stability_report.py --record keyboard_controls --result passed
```

Keep CPU rendering during this phase. Do not clear or modify the official client's cache. New-character registration and performance comparisons are outside this phase.

## 3. Connection and process recovery

Do these after a baseline five-minute session, while idle in the lobby rather than during a match:

| Report check | Manual test | What to verify |
| --- | --- | --- |
| `network_drop_lobby` | Briefly interrupt networking using your normal macOS controls, then restore it | Game reports a connection loss or handles recovery without a silent crash/hang |
| `fresh_login_recovery` | Close AIR/helper, then enter through the official website again | A newly issued session reconnects and the lobby is interactive |
| `air_close_helper_open` | Close AIR while leaving the helper open | Helper reports AIR closed and removes its process marker; it does not relaunch automatically |
| `login_window_close_during_play` | Close just the official website window | Helper reports it closed; report whether AIR continues or disconnects so we can establish the browser dependency |
| `helper_exit_during_play` | Close both helper windows while AIR is open | Report whether AIR remains open, disconnects or closes; pending files are cleaned and a surviving AIR process remains tracked |
| `launch_while_air_open` | If AIR survived helper exit, start the helper again | Only a status window opens, explaining that AIR is still running; no new website login or AIR launch occurs |

Record the observed behavior in the conversation as well as pass/fail. Closing the browser may legitimately end a website-held session; we have not established this dependency. A disconnect during this deliberate test is not proof that ordinary gameplay is unstable. Keep the browser open for normal sessions until the result is understood.

Recovery currently requires closing the previous AIR game and returning through the official website for fresh values. Automatic reconnect/session replay is not being added. If restarting the helper reports that AIR is still open, close the surviving AIR window first and restart the helper again.

Normal window exit and SIGINT/SIGTERM clean unaccepted handoff files and stop an unacknowledged child. Accepted AIR is not intentionally killed by the helper. Terminal Ctrl+C can also signal other processes in the terminal group; use window close for the deliberate lifecycle test, and report signal-related exits separately. A forced kill or machine crash can still leave a transient private file; it is never used for recovery.

## 4. Review and acceptance

Collect the latest safe startup summary or show all results:

```bash
python3 tools/stability_report.py --collect-latest
python3 tools/stability_report.py
```

The report collects only timestamps, known stage timings, HTTP status and numeric/unknown error IDs. It never infers successful gameplay from logs. Fixed diagnostics and stack function names remain in `private/login-helper.log`; error messages, arguments, source paths and credentials are omitted by the helper.

If 1065 recurs, stop to review the `[Session frame]` entries and the last completed stage locally before adapting more code. Fix only a reproducible, identified cause. Repeat the affected scenario and a fresh-login smoke test after each fix. AIR changes require compilation; SWF changes require hash, asset and re-export verification.

This phase is accepted after three documented interactive fresh-login sessions, one completed match, the control/window/storage checks, and a deliberate disconnect followed by successful fresh-login recovery. Process/window outcomes must be explained and blocking failures resolved. Packaging and performance work follow that acceptance.

Automated checks currently pass: 20 helper tests, 10 Python investigation/report tests, and the original embedding/exporter Node checks. The existing compiled AIR diagnostic build is unchanged in this phase; the transient process marker and shutdown handling are helper-only changes. Live tests above remain manual.
