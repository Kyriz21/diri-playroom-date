# Build verification — Diri. Playroom Date v0.9

- Source baseline: Diri. Playroom Date v0.8, supplied by the project owner.
- Project version: `0.9.0`.
- Firebase project: `diri-playroom-date` (Web App config preserved).
- Automated tests: **58 passed, 0 failed**.
- JavaScript syntax checks: **14 files passed**.
- Firebase Rules: valid JSON; runtime behavior still requires publishing and testing in the owner's Firebase project.
- Camera, WebRTC, RTDB relay, and two-device hardware test: **not performed in this build environment**.

## Changes
- WebRTC remains the first/direct path, with per-photo ACK and SHA-256 comparison.
- When direct negotiation or DataChannel transfer fails, both clients automatically transition to a temporary Firebase Realtime Database relay.
- Each relay JPEG is limited to 256 KiB, and each photo is validated for role, slot, MIME type, byte size, and SHA-256 before being accepted.
- Both devices persist all eight images locally and send acknowledgements before the editor opens.
- Transfer IDs prevent old uploads from mixing with retakes or retries.
- Firebase and browser online connection monitors retry the transfer after connectivity returns.
- Temporary relay data is deleted after both clients acknowledge completion.
- No Cloud Storage, Cloud Functions, custom server, or paid TURN relay is introduced.

## Required deployment action
Publish the included `firebase-database.rules.json` in Firebase Console → Realtime Database → Rules. The new relay validation rules are required for the fallback transfer.

## Manual verification still required
Test two physical devices on different mobile/Wi-Fi networks. First verify direct WebRTC if possible; then block/directly disrupt peer connection and confirm the automatic RTDB fallback completes with 4/4 uploads and 4/4 downloads on both devices. Simulate temporary internet loss and reconnection. Confirm both devices open the editor only after both acknowledgements, then verify the temporary relay node is deleted.
