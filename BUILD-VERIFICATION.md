# Build Verification — Diri. Playroom Date v0.3.0

## Automated checks
- `node --check js/photobooth/photobooth.js` — pass
- `npm test` — 29 tests pass
- ZIP integrity (`unzip -t`) — pass after packaging

## Editor interaction changes
- Toolbar panah dan A+/A− dihapus dari editor.
- Seret bagian utama stiker/teks untuk memindahkan.
- Pegangan ↘ pada elemen terpilih dapat diseret untuk mengubah ukuran.
- Pinch dua jari pada area pratinjau dapat mengubah ukuran elemen yang sedang digerakkan.
- Roda mouse di atas elemen mengubah ukuran pada desktop.
- Tanda × pada elemen terpilih menghapus elemen tersebut.
- Skala ekspor PNG/JPEG memakai rentang yang sama dengan editor (0.35–3.0) serta ukuran dasar sesuai jenis elemen.

## Still requires physical device testing
- Pinch gesture pada Safari iOS dan Chrome Android.
- Drag dan pegangan resize pada layar sentuh/mouse dengan browser dan zoom berbeda.
- Roda mouse dan trackpad pada desktop.
- Sinkronisasi skala ke pasangan pada sesi Firebase nyata.
- Perbandingan ukuran elemen pratinjau dengan PNG/JPEG hasil unduhan.
