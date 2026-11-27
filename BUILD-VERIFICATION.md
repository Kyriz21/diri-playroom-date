# Build Verification — Diri. Playroom Date v0.43.0

## v0.43.0 — Full 50-Level Campaign & Gem Scoring
- Kampanye Elemental Duo membuka 50 level aktif secara berurutan dalam lima dunia; alur tidak lagi dibatasi pada lima prototype.
- `npm test`: **201/201 tes lulus**.
- `ELEMENTAL_LEVEL_COUNT=50`, `ELEMENTAL_MAP_VERSION=27`, `campaignVersion=1`, `jumpSpeed=560`, `gravity=1500`; Firebase Rules tidak berubah.
- Tes otomatis menguji rentang level 01–50, kelima rentang dunia, kurva kesulitan tiap dunia, jangkauan platform dari spawn kedua role, level akhir, tampilan counter 50, dan aturan transisi kampanye.
- Semua 50 level diverifikasi memiliki dua permata, satu untuk Bara dan satu untuk Nira. Permata bersifat opsional dan gate tidak membaca `gems` atau `shards`.
- Scoring per level diverifikasi: 3 bintang untuk dua permata dan tanpa jatuh; 2 bintang untuk maksimal dua jatuh gabungan; 1 bintang untuk lebih dari dua jatuh. Maksimum agregat 150 bintang dan 100 permata.
- Migrasi sesi prototype lama mengembalikan kedua pemain ke spawn level 01, mereset status ready/completion, hasil kampanye dan state puzzle level; room membership dan statistik lifetime tetap dipertahankan.
- Semua file JavaScript diperiksa dengan `node --check`; `firebase-database.rules.json` valid dan tidak berubah.
- Belum dilakukan playtest langsung di browser dan dua perangkat fisik dengan Firebase aktif.

## Batas verifikasi v0.43.0
Tes otomatis memvalidasi blueprint, scoring, progres 50 level, migrasi, geometri, dan integrasi source. Tes belum menggantikan playtest visual di browser serta dua perangkat fisik dengan Firebase aktif; semua 50 level tetap perlu dijalankan untuk menilai pacing dan kenyamanan puzzle.

## Riwayat build terdahulu
### v0.40.0 — Classic Co-op Level Rebuild

- Lima level prototype dirancang sebagai kamar dungeon dan koridor yang berbelok; tidak lagi menggunakan platform panjang bertingkat dengan tiang penyangga.
- Tiga jangkar lantai bawah menyatu dengan lantai dungeon, sedangkan rute atas berpindah di antara kamar pendek kiri/kanan.
- Renderer menambah recess ruang, kusen lintasan persegi dan tekstur balok; ornamen panah dan rune melingkar tetap tidak digunakan.
- `ELEMENTAL_MAP_VERSION=19`, `prototypeVersion=5`, `jumpSpeed=560`, `gravity=1500`; Firebase Rules tidak berubah.
- `npm test`: 194/194 lulus. Seluruh file JavaScript lolos `node --check`. Firebase Rules JSON valid.
- Uji visual browser dan uji dua perangkat dengan Firebase aktif tetap diperlukan.

## v0.39.2 — Ruins Water & Fire Maze (historis)
- `npm test`: **194/194 tes lulus**.
- Seluruh file JavaScript lolos `node --check`; Firebase Rules JSON valid dan tidak berubah.
- 10 layout ruang menggunakan grammar reruntuhan labirin dengan platform 13 per level, pecahan dinding solid yang bisa dilompati, gerbang bersama, serta dua pintu elemen.
- Kelima prototype memilih lima komposisi berbeda. Kedua jalur pemain dan seluruh platform tetap terjangkau dalam pengujian geometri lompatan.
- Saluran air dan lava dibuat berbeda per layout; checkpoint diuji dengan margin aman yang menghindari hazard termasuk uap.
- Ornamen rune melingkar dan penunjuk panah tepi kamera dihapus; diganti relief gerbang akuaduk.
- Tinggi lompatan dipertahankan pada `560² / (2 × 1500) ≈ 104,5` unit.
- `ELEMENTAL_MAP_VERSION=17` dan `prototypeVersion=3` memigrasikan posisi pemain serta state puzzle. Firebase Rules tidak berubah.
- Cache key `index.html`, `js/app.js`, modul Elemental Duo, dan logic engine memakai v0.39.2.

## Batas verifikasi
Tes otomatis memeriksa struktur blueprint, geometri lompatan, collision reruntuhan, objek puzzle, dan integrasi source. Belum dilakukan playtest visual di browser dan dua HP fisik dengan Firebase aktif; kenyamanan jalur, sentuhan, dan sinkronisasi tetap perlu dinilai setelah deployment.

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


## v0.42.2 — Challenge Accessibility Repair
- Automated test suite: 199/199 passed.
- Level 2 lift clearance checked against both direct player ascent corridors and upper route clearance at maximum lift height.
- Required Level 4 wind levers checked on stable ledges and within interaction radius.
- Required Level 5 valves checked on stable entry ledges and within interaction radius.
- All prototype jump routes and hazard clearance simulations passed.
- JavaScript syntax and Firebase Rules JSON validation passed.
- Manual browser and two-device multiplayer playtest remains required.
