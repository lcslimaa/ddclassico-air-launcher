> Historical English document. Not current instructions; use the README and current guides.

# Session handoff capture review

## What the new capture establishes

`captures/session-handoff.har` contains 140 requests. Both startup SWF response bodies match the earlier decompiled versions by SHA-256. The entry SWF uses the known session/configuration query parameter names; no values were exported to the findings report.

The entry request's initiator stack passes through the website's `/_framework/blazor.web.js` functions `insertElement`, `applyEdits`, `updateComponent` and `processBatch`, reached from `_invokeClientMethod`, `connection.onreceive` and `i.onmessage`. This supports the interpretation that a live Blazor component update inserted the game embedding.

The capture contains **zero document requests, zero page records, zero WebSocket handshakes and zero fetch/XHR requests to the website origin**. These are capture contents, not proof that those operations never occur. The live connection's messages and the server-side operation that creates startup session values are not present as inspectable response bodies here.

The captured public `KempDec.StarterDotNet.Blazor/js/interop.js` provides generic clipboard, button and focus utilities. It does not establish a standalone authentication interface.

Microsoft documents server-interactive Blazor UI updates over SignalR: [Blazor hosting models](https://github.com/dotnet/AspNetCore.Docs/blob/main/aspnetcore/blazor/hosting-models.md). This supports the interpretation of the stack, but does not establish DDClassico's exact server implementation or a reusable login API.

## Consequence for the community AIR client

A client cannot derive a working independent login implementation from these captures alone. The official website already supplies fresh startup session values through its normal signed-in flow; using that flow for a first prototype is a separate approach from reproducing session issuance.

Two meaningful next directions are:

1. **Manual official-site handoff for a first playable prototype:** keep login on the existing site, transfer a fresh session locally and adapt the AIR bootstrap to receive it. This still needs runtime validation of parameter semantics, lifetime and server acceptance. It does not imply the captured historical values should be replayed.
2. **Investigate independent login first:** identify a supported authentication/session interface or obtain operator documentation before building gameplay around it. No such interface has been established yet.

The first direction was selected and a manual prototype was built. The user tested importing a fresh export and loading the AIR adapter, but reported that it did not establish a game connection. An automatic capture before the original SWF executes is now implemented; see [AUTOMATIC_LOGIN.md](AUTOMATIC_LOGIN.md). No server acceptance has been established, and token consumption/expiry remains a hypothesis.

## Current compatibility status

- AIR runtime/CPU rendering: verified.
- Locally packaged startup SWF Stage access: verified in isolation.
- Native configuration download and parse: verified.
- Remote-wrapper startup: fails with Stage sandbox error 2070.
- Original local startup without config: expected I/O error 2032 confirmed.
- Fresh authenticated handoff, full game module execution, registration, reconnect and performance: unverified.

Do not repeat the same HAR capture to resolve the absent live-connection payload. The next work should follow the selected login approach. Evidence is in `evidence/session-handoff-findings.json` and the query/body-omitting summary `evidence/session-handoff.json`.
