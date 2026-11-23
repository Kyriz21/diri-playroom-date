# Build verification — v0.7

- Node test suite: 41/41 passed.
- JavaScript syntax checks: passed for all JavaScript modules.
- Frame catalog: 18 unique frame IDs.
- Regression coverage: post-photo frame borders are checked not to draw opaque rectangular fills over the photo area.
- A browser canvas regression fixture (`canvas-regression.html`) draws synthetic photos and checks pixels after every frame border/overlay. The fixture is included for browser verification; this session's Chromium headless runner did not complete, so that browser pixel test is not claimed as executed.
- Export accepts solo photo data URLs and couple photo URL/Blob objects, validates loaded image dimensions, and requires 4 actually rendered solo photos or 8 actually rendered couple photos before producing a download.
- Solo flow: choose frame → camera capture four photos → editor/decorations → download/save.
- Couple flow: shared frame/setup → both capture four photos with camera → combined preview → shared decorations/editor → mutual approval → download/print.
- Standard couple capture no longer offers choosing four files from gallery; manual file selection remains only as a fallback for photo transfer if direct connection fails.
- Firebase configuration for `diri-playroom-date` is retained.
- Physical camera, live Firebase sync, mobile browser download behavior, and printer output still require testing on deployed site and real devices.
