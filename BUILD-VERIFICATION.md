# Build verification — v0.10

Automated local checks:
- `npm test`: 62 tests passed.
- JavaScript syntax checks: all JS files passed `node --check`.
- `firebase-database.rules.json`: valid JSON.
- `package.json`: valid JSON.

Scope of this build:
- Camera stream is only reattached while the Photobooth is in capture phase; it is stopped when the shared session leaves capture, preventing stale camera retries/toasts in the editor.
- Shared editor now exposes the same filter presets and image adjustments as the solo editor (brightness, contrast, saturation, temperature).
- Text and sticker elements support 0–360° rotation in preview and Canvas export.
- Delete action is a separate button for the selected element; no × badge is attached to the sticker itself.

Not verified in this local environment:
- Physical camera behavior on Android Chrome.
- Live Firebase synchronization between two real devices.
- Actual browser PNG/JPEG downloads and print output after deployment.
