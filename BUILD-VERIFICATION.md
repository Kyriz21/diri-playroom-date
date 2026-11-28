# Build Verification — Diri. Playroom Date v0.51.1

## Bomber Arena room-start repair
- Root cause: `startSelectedGame()` cleared both lobby Ready flags at the same time it created `activeSession`; the Bomber Arena initial `meta` write rule then rejected setup because it requires both Ready flags to remain true.
- Fix: preserve Ready flags for Bomber Arena until its setup starts; all other games retain the existing reset behavior. `returnToLobby()` still resets Ready as before.
- Bootstrap waits for both presence records and confirms both Ready flags. Failed setup is shown in the waiting panel with retry/recovery actions.
- Firebase Rules JSON remains unchanged.

## Verification
- `npm test`: **256/256 passed**.
- `node --check`: **35 JavaScript files passed**.
- `firebase-database.rules.json`: valid JSON; **152 rule expressions** have balanced parentheses.
- SHA-256 of Firebase Rules matches the v0.50.0 source: no Rules changes.
- This does not replace a live Firebase test with two devices.

