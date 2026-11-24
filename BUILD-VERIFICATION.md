# Build verification — Diri. Playroom Date v0.17.0

## Automated checks
- `npm test`: **112/112 tests passed**.
- All JavaScript files under `js/` and `tests/` passed `node --check`.
- `firebase-database.rules.json` parsed successfully as JSON.
- Static assertions confirmed `bombstorm` is accepted in room selection and active-session validation, and the `bombStorm` plus `bombStormAvatars` paths are present.
- Regression test confirms avatars are read from the separate avatar node so frequent game-state snapshots do not erase them from setup/HUD/result displays.

## Bomb Storm implementation
- Two players share a deterministic 60-second arena seed.
- Each player controls their own character position, score, lives, processed-object index, and finished state.
- Bombs reduce one life; hearts award 10 points; each player begins with three lives.
- Optional selfie is compressed locally to a 128×128 JPEG avatar and stored separately per room role (maximum 22,000 data-URL characters).
- Lobby start waits for both players to be ready on the same round.
- Rematch waits for both requests; host advances the round, and the new round does not start until both player profiles have reset and both are ready again.

## Not yet verified in a live environment
- Firebase Rules have not been published to the user's Firebase project from this build.
- No Firebase Emulator compilation or two-physical-device test was run in this environment.
- Camera/selfie permissions, touch feel, real network latency, reconnect, and quota use still require testing after deployment.
- Score/collision decisions are client-computed and synchronized; this is a casual game, not a tamper-proof competitive or prize game.

Run `npm test` from the project root to repeat the automated checks.
