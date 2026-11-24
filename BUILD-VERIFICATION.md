# Build verification — Diri. Playroom Date v0.19.0

## Automated checks
- `npm test`: **118/118 tests passed**.
- All JavaScript files under `js/` and `tests/` passed `node --check`.
- `firebase-database.rules.json` parsed successfully as JSON.
- `package.json` parsed successfully as JSON.

## Bomb Storm v0.19 changes
- Player positions are rendered with exponential interpolation so remote Firebase position samples do not snap the avatar between updates.
- The interpolation affects presentation only; collision calculations continue to use the player's game position.
- Heart collection triggers a short bounce, gentle scale-up, `+10` label, heart icon, and particles.
- Bomb hits trigger a short squash/shake, impact ring, particles, and `-1 NYAWA` label.
- Both clients detect score/life changes from the room-game snapshot and animate the corresponding player's avatar.
- Effects expire automatically and do not write additional game coordinates or change game rules.
- Firebase Realtime Database Rules and data paths are unchanged from v0.18.

## Not yet verified in a live environment
- Physical Android/iOS touch performance and device frame rate.
- Animation timing under high network latency on two physical devices.
- Firebase Rules publication and live two-device gameplay remain user-side checks.

Run `npm test` from the project root to repeat the automated checks.
