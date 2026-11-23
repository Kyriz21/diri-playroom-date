# Build verification — Diri. Playroom Date foundation v0.1

## Source-based checks
- [x] Project metadata and page title use `Diri. Playroom Date`.
- [x] Landing page exposes Buat Sesi Berdua, Gabung Sesi, and Foto Sendiri.
- [x] Entry point does not statically import Firebase.
- [x] Photobooth module dynamically imports Firebase only for a shared session.
- [x] Standalone Photobooth uses local IndexedDB and skips room/session setup.
- [x] New room defaults to Photobooth; the guest join flow marks the guest ready.
- [x] The host auto-starts Photobooth once both players are present and ready.
- [x] The guest leaving clears their slot; the host returns the session to the invite screen.
- [x] Old Firebase project credentials are removed and replaced with setup placeholders.
- [x] `index.html` remains at the repository root for GitHub Pages.

## Automated checks
- `npm test`: **26 passed, 0 failed**.
- `node --check`: all JavaScript files under `js/` pass syntax validation.
- `firebase-database.rules.json`: valid JSON.
- Old Firebase project ID `ldr-playroom-diri` does not appear in the new source tree.

## Not yet verified on live services/devices
- Firebase project for Diri. Playroom Date has not yet been created/configured.
- Create/Join auto-start has not yet been tested against deployed Firebase Rules on two devices.
- Camera and drag interactions have not been tested with physical devices.
- WebRTC/STUN, manual transfer, final preview, download, and print still require browser-level testing.

Unit tests and syntax checks do not prove live Firebase, camera, or cross-device behavior. Follow `REVIEW-BUILD-QA.md` after deployment.
