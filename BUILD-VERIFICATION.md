# Build verification — v0.12.0

- Node.js syntax check: seluruh file JavaScript berhasil diperiksa dengan `node --check`.
- Unit tests: 73 lulus, 0 gagal (`npm test`).
- Firebase Realtime Database Rules: berhasil diparsing sebagai JSON.
- Gambar Bareng: pemeriksaan statis mencakup katalog, rute buat/gabung, validasi kode aktivitas, rules per-UID, prompt, koordinat, sanitasi stroke, dan timer.
- Tidak dilakukan uji perangkat nyata atau koneksi Firebase live dari lingkungan build ini. Harus diuji dengan dua akun anonim pada dua perangkat setelah Rules v0.12 dipublikasikan.
