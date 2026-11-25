# Build Verification — Diri. Playroom Date v0.24.2

## Elemental Duo
- 50 level dalam lima dunia masih menggunakan satu engine platformer.
- Setiap level memiliki dua pijakan elemen, dua permata khusus, platform, zona lava/air, checkpoint, penghalang, dan dua pintu elemen.
- Bara hanya mengaktifkan pijakan dan pintu Bara; Nira hanya mengaktifkan pijakan dan pintu Air.
- Penghalang hanya terbuka setelah kedua pijakan aktif. Kedua pemain harus masuk ke pintu masing-masing untuk membuka level selanjutnya.
- Kamera mengikuti posisi rata-rata kedua pemain dan memperbesar area pandang di layar sempit tanpa mengubah skala dunia secara tidak proporsional.
- Kontrol sentuh lebih besar, layout landscape lebih ringkas, dan tombol layar penuh tersedia.
- Sinkronisasi status tiba diantrekan agar pembaruan `complete=true` tidak hilang ketika sinkronisasi posisi masih berlangsung.
- Kunci transisi level yang tertinggal dipulihkan setelah 12 detik bila host terputus.
- Teks objektif dan notifikasi tidak lagi digambar di dalam kanvas. Notifikasi sementara dipindahkan ke strip HUD di luar arena; kartu petunjuk panjang disembunyikan di layar HP.
- Lazy-loaded Elemental Duo menggunakan cache key v0.24.2. Firebase Rules tidak berubah.

## Pemeriksaan lokal
- 153/153 unit test lulus (`npm test`).
- Seluruh file JavaScript lolos `node --check`.
- `firebase-database.rules.json` tidak diubah.
- Tidak ada dependensi npm baru.

## Belum dibuktikan pada perangkat nyata
- Sinkronisasi tekanan pijakan, pintu khusus, dan pergantian level pada Firebase aktif dengan dua HP.
- Kenyamanan kamera/zoom pada berbagai rasio layar fisik dan orientasi portrait/landscape.
- Fullscreen API dapat berbeda dukungannya antar browser dan perangkat.


## v0.24.2 — Elemental Duo HUD cleanup
- Objective labels are no longer drawn inside the canvas.
- Temporary messages are rendered in an accessible status strip outside the canvas.
- Added regression coverage that checks the arena contains no text/toast overlays.
- Cache keys use v0.24.2. Firebase Rules are unchanged.
