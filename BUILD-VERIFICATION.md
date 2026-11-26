# Build Verification — Diri. Playroom Date v0.39.1

## v0.39.1 — Classic Temple Layout & Jump Repair
- `npm test`: **194/194 tes lulus**.
- Seluruh file JavaScript lolos `node --check`; Firebase Rules JSON valid dan tidak berubah.
- Lima level prototype sekarang memakai lima pola ruang berbeda (dipilih dari 10 layout hand-authored). Platform disusun dengan jarak vertikal sekitar 80–95 unit, jalur dua sisi, dan pintu pasangan di galeri atas.
- Tinggi lompatan teoretis `560² / (2 × 1500) ≈ 104,5` unit; jangkauan horizontal sekitar 139 unit pada kenaikan 85 unit.
- Ketebalan visual platform menjadi 22 unit (collision tetap 8 unit).
- `ELEMENTAL_MAP_VERSION=16` dan `prototypeVersion=2` memindahkan pemain/sesi lama ke posisi dan puzzle layout baru; statistik pemain dipertahankan.
- Cache key `index.html`, `js/app.js`, modul Elemental Duo, dan logic engine memakai v0.39.1. Firebase Rules tidak berubah.

## v0.39.0 — Classic Temple Prototype
- `npm test`: **194/194 tes lulus**.
- Pemeriksaan sintaks seluruh file JavaScript menggunakan `node --check` lulus.
- 5 level aktif memakai lima tema berbeda; 45 blueprint lain tetap tersimpan tetapi tidak masuk jalur permainan prototype.
- Renderer Canvas menggunakan dinding bata gelap, relief, vine, platform batu bertekstur, hazard cairan, permata faceted, portal batu dan karakter yang diperbarui.
- Progress prototype berhenti setelah level 05; hasil maksimal 15 bintang dan 10 permata.
- `ELEMENTAL_MAP_VERSION=15`; sesi lama bermigrasi ke prototype level 01 dan state puzzle lama dibersihkan melalui metadata versi sesi.
- Cache key `index.html`, `js/app.js`, dan modul Elemental Duo menggunakan v0.39.0. Firebase Rules tidak berubah.

## Batas verifikasi
Tes otomatis memeriksa struktur blueprint, tema, geometri, logika dan integrasi source. Belum dilakukan playtest visual di browser dan dua HP fisik dengan Firebase aktif; kemiripan visual dan feel kontrol masih perlu dinilai setelah build dipasang.

---

## v0.38.0 — Classic puzzle-room and movement tuning
- `npm test`: **191/191 tes lulus**.
- Seluruh file JavaScript diperiksa menggunakan `node --check`.
- Semua 50 level memakai 13 platform pada 10 pola ruang terstruktur; semua platform diperiksa keterjangkauannya dari spawn kedua peran.
- Tinggi lompatan teoretis: `280² / (2 × 1300) ≈ 30,2` unit; selisih tier utama 24 unit.
- Analog mengubah input kiri/kanan saja dan tidak menyentuh `input.jump` atau `jumpQueued`; lompatan hanya diantrekan tombol LOMPAT/Space.
- Checkpoint diuji agar tidak berimpit dengan hazard; objek kontrol wajib berada pada platform stabil.
- Landscape CSS/UI tidak diubah pada revisi ini. Cache key memakai v0.38.0.
- `ELEMENTAL_MAP_VERSION=14`; Firebase Rules JSON valid dan tidak diubah.

## Catatan pengujian
Tes otomatis memvalidasi logika, geometri, jangkauan, dan input berdasarkan source. Tes tersebut bukan pengganti playtest pada dua HP fisik; fullscreen, sentuhan analog, lompatan, dan sinkronisasi Firebase aktif tetap perlu dikonfirmasi setelah deployment.

---

---

# Build Verification — Diri. Playroom Date v0.33.0

## v0.33.0 — Mobile repair, control input and difficulty balance
- `npm test`: 191/191 tes lulus.
- Seluruh file JavaScript diperiksa menggunakan `node --check`.
- Semua 50 level lolos pemeriksaan geometri tanpa overlap atau jarak visual di bawah ambang tes; jalur platform/cabang/shortcut diuji jangkauannya dari spawn kedua peran.
- Kontrol analog menggantikan tombol arah melalui state DOM dan inline display penting; sumbu atas memicu jump buffer.
- Tombol INTERAKSI hanya muncul di dekat katup/tuas; pressure plate tetap otomatis.
- Kurva kesulitan diturunkan di seluruh dunia; Dunia 1 mudah hingga level 8, level final maksimum 4 (Sulit).
- Mode Potret memakai root fixed viewport dan canvas fleksibel; mode Layar Penuh memakai native fullscreen atau portal fallback dengan overlay controls.
- Cache key `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, dan CSS Elemental Duo menggunakan v0.33.0.
- `firebase-database.rules.json` identik dengan build sebelumnya; tidak ada perubahan Rules.

## Catatan pengujian
- Tes otomatis tidak membuktikan UX dan perilaku input di semua model perangkat. Perlu playtest dua HP, analog, fullscreen/orientation, dan transisi level setelah deployment.
- Android dapat tetap menampilkan status bar/notifikasi sistem dan toast keluar fullscreen; halaman tidak dapat menyembunyikan UI sistem yang dikendalikan OS.
