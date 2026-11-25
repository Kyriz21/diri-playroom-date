# Build Verification — Diri. Playroom Date v0.32.0

## Pemeriksaan terbaru v0.32.0
- Unit tests: **188/188 passed** (`npm test`).
- JavaScript syntax checks: passed untuk seluruh file di `js/`.
- Firebase Rules JSON: valid; dibandingkan dengan paket v0.29.0 dan tidak berubah.
- Seluruh 50 level memakai arena eksplorasi 2D dengan 13 platform jalur utama, 5 cabang, 4 jembatan pintas, dan pintu yang bervariasi posisinya.
- Tes jangkauan geometri mencakup seluruh platform pada 50 level dari spawn host maupun guest.
- Tes regresi mencakup pintu sisi kiri/tengah/atas, sakelar sebelum gerbang vertikal, minimap, penunjuk arah, dan migrasi state mapVersion.
- Tidak ada dependensi npm baru.
- Cache key `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, dan CSS Elemental Duo menggunakan v0.32.0.


## v0.32.0 — Mobile layout, analog and map spacing
- Platform utama, cabang, dan shortcut seluruh 50 level tidak saling tumpang tindih dan memiliki jarak visual minimal 18 unit.
- Lima pola geometri disetel ulang pada koordinat vertikal untuk menghindari platform yang terlalu rapat/sejajar hingga tampak menyatu.
- Native fullscreen menggunakan `100dvh`; fallback portal ke body menggunakan `100svh` stabil.
- Kontrol analog transparan aktif otomatis pada landscape dan dapat diganti ke tombol; pointer capture/cancel ditangani.
- Tidak ada listener `visualViewport.resize`; pengukuran canvas dijadwalkan dan backing store hanya diubah jika ukuran berubah nyata.
- HTML root dan body dikunci ketika fallback fullscreen aktif; portal dipulihkan saat keluar dari game.
- Cache key runtime menggunakan v0.32.0. Firebase Rules tidak berubah.
- Tes otomatis 188/188 lulus dan semua JavaScript lolos `node --check`.

## v0.31.0 — Adventure Maps
- Lima pola ruang: Jalur Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, dan Lingkaran Kuno.
- Tiap peta membuat rute utama, platform cabang, shortcut loop, floor gap, pintu Bara/Air yang ditempatkan terpisah, dan gate yang sesuai pola ruang.
- Navigator mini digambar pada screen-space setelah kamera arena; menampilkan pemain, kamera, platform, hazard, switch, gem, gate dan pintu.
- Penunjuk arah layar menunjukkan arah menuju pintu karakter sendiri bila target berada di luar viewport.
- `ELEMENTAL_MAP_VERSION=6` memindahkan koordinat lama ke spawn baru sambil menjaga data progres yang masih relevan.
- Firebase Rules dan struktur node RTDB tidak berubah.

## Belum dibuktikan pada perangkat nyata
- Gerakan platform, kamera, kontrol sentuh, tampilan navigator di berbagai rasio HP, dan sinkronisasi dua perangkat Firebase perlu diuji langsung.
- Reachability otomatis adalah validasi geometri lompatan, bukan simulasi end-to-end terhadap semua hazard, timing, dan interaksi dua pemain.

---

# Build Verification — Diri. Playroom Date v0.29.0

## Pemeriksaan terbaru v0.29.0
- Unit tests: **181/181 passed** (`npm test`).
- JavaScript syntax checks: passed untuk seluruh file di `js/`.
- Firebase Rules JSON: valid; file Rules dan struktur node RTDB tidak berubah.
- Blueprint khusus mencakup seluruh level **01–50** dalam lima dunia.
- Tidak ada dependensi npm baru.
- Cache key untuk `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, dan `css/elemental-duo.css` menggunakan v0.29.0.

## v0.29.0 — Jantung Kuno (level 41–50)
- Sepuluh level memakai blueprint khusus, bukan generator lama.
- Dunia final menggabungkan mekanik es, arus, angin, lava, air, uap, hazard berkala/bergerak, dan platform bergerak.
- Dual-valve dan dual-wind-lever dapat menjadi persyaratan gerbang; semua node state tetap berada di bawah `levels/{level}`.
- Level 44, 49, dan 50 menjalankan urutan pijakan Nira lalu Bara melalui transaksi RTDB atomik.
- Dekorasi runik Jantung Kuno digambar di latar arena; dekorasi tidak memengaruhi collision.
- Semua pressure plate, katup, tuas, dan checkpoint diperiksa terhadap hazard, gerbang, kestabilan platform, dan keterjangkauan kedua pemain.
- Pengujian dua HP dengan Firebase aktif tetap harus dilakukan setelah deployment.


# Build Verification — Diri. Playroom Date v0.27.0

## Pemeriksaan terbaru v0.27.0
- Unit tests: **173/173 passed** (`npm test`).
- JavaScript syntax checks: **passed** untuk seluruh file di `js/`.
- Blueprint khusus kini mencakup level **01–30**: Hutan Berbisik, Kedalaman Kristal, dan Kerajaan Bara.
- Level 31–50 masih menggunakan generator/layout sebelumnya; Dunia 4–5 belum diimplementasikan.
- Tidak ada dependensi npm baru.
- Firebase Rules dan struktur node utama RTDB tidak berubah.

## v0.27.0 — Kerajaan Bara (level 21–30)
- Sepuluh level memakai blueprint khusus, bukan generator lama.
- Lava berdenyut/bergerak, uap berkala, katup interaktif, syarat katup untuk gerbang, dan urutan pijakan Nira lalu Bara pada level 26 dan 30.
- State katup dan urutan pijakan disimpan di bawah `levels/{level}`; fase mekanik memakai jam level bersama Firebase.
- Checklist uji dua perangkat tersedia di `REVIEW-BUILD-QA.md` bagian I.

---

## v0.27.0 — Elemental Duo World 3
- Level 21–30 memakai 10 blueprint khusus Kerajaan Bara.
- Lava/api visual berdenyut dan hazard bergerak mengikuti jam level bersama.
- Ventilasi uap (`type: steam`) berbahaya untuk kedua pemain, dengan fase aktif/nonaktif deterministik.
- Interaksi katup memakai AKSI dan menyimpan state per katup pada RTDB; katup mematikan hazard terkait.
- `requiredValves` menjadi syarat tambahan gerbang; level 29–30 membutuhkan dua katup dari pemain yang sesuai elemen.
- Level 26 dan 30 menerapkan urutan pijakan Nira lalu Bara melalui transaksi atomik pada node `switches`.
- Pressure plate dan katup divalidasi berada pada platform stabil/terjangkau dan sebelum gerbang.
- Firebase Rules tidak berubah; semua state baru berada di bawah node `levels` yang sudah diizinkan.

# Build Verification — Diri. Playroom Date v0.27.0

## v0.26.0 — Elemental Duo World 2
- Level 11–20 memakai 10 blueprint Kedalaman Kristal, bukan layout generator lama.
- Permukaan `ice` dan `iceZones` memakai gesekan rendah; karakter mempertahankan momentum ketika melepas tombol arah.
- `currents` memberi gaya horizontal/vertikal, dapat berdenyut atau berbalik arah, dan ditampilkan dengan panah visual.
- Lift vertikal menggunakan gerak platform yang sudah deterministik dan membawa karakter ketika ia berdiri di atasnya.
- Hazard mendukung cycle aktif/nonaktif; collision dan rendering memakai status yang sama.
- Kedua pressure plate berada sebelum gerbang dan tidak bergantung pada platform timed atau lift vertikal.
- Jam level bersama Firebase menjaga fase arus, platform, dan hazard konsisten di kedua perangkat.
- Firebase Rules dan struktur data RTDB tidak berubah.

## v0.25.0 — Elemental Duo World 1
- 10 level Hutan Berbisik menggunakan blueprint buatan tangan, bukan kombinasi layout generik.
- Difficulty Dunia 1: 1–3 Mudah, 4–6 Normal, 7–10 Menengah.
- Platform moving/cycle dan hazard bergerak dihitung lewat helper deterministik yang diuji pada waktu level yang sama.
- Fisika membawa karakter mengikuti perubahan posisi platform saat ia sedang berdiri di atasnya.
- Jamur pantul memberikan impuls otomatis; pressure plate dapat berada di platform dan diperiksa lewat collision rectangle.
- Tes jalur memeriksa bahwa sakelar tiap karakter dapat dijangkau melalui rangkaian lompatan dari spawn dan tidak berada di balik gerbang.
- Firebase Rules tidak berubah.

## Pemeriksaan lokal
- Unit tests: 168/168 passed (`npm test`).
- JavaScript syntax checks: passed for all files under `js/`.
- No new npm dependencies.
- Level clock reads Firebase `/.info/serverTimeOffset`; both devices derive moving-platform and hazard phases from the same shared `startedAt`.

## Belum dibuktikan pada perangkat nyata
- Gerakan platform, sentuhan, orientasi layar, kamera, dan sinkronisasi dua perangkat Firebase perlu diuji langsung.
- Pada saat build v0.26.0, blueprint khusus mencakup level 01–20; level 21–50 masih memakai generator sebelumnya. Status terbaru lihat pemeriksaan v0.27.0 di bagian atas.

---


## v0.24.4 — Elemental Duo camera follow and mobile modes
- Camera viewport is always narrower than the full world on standard portrait and landscape screens.
- Each device follows its locally controlled character, with a capped partner framing bias. The view window remains narrower than the full stage even on wide displays.
- Portrait mode uses a taller mobile arena; full-page mode requests fullscreen and attempts `screen.orientation.lock('landscape')`.
- When orientation lock is not supported, an in-game prompt asks the player to rotate the device manually. Landscape touch controls float at the lower corners so the arena keeps more vertical space.
- Added app-level fixed full-page fallback for browsers that block the Fullscreen API.
- Firebase Rules unchanged.

## Elemental Duo
- 50 levels in five worlds; two elemental switches, two gems, elemental hazards, checkpoints, shared gate, and individual elemental doors.
- Arrival state writes remain queued and level transition locks recover after a host disconnect.
- Arena objective labels and transient status messages remain outside the playable canvas.

## Pemeriksaan lokal
- Unit tests: 155/155 passed (`npm test`).
- JavaScript syntax checks: passed for all files under `js/`.
- No new npm dependencies.

## Belum dibuktikan pada perangkat nyata
- Actual orientation lock support varies by mobile browser and operating system.
- Two-device Firebase play, touch feel, and visual camera framing still require real-device verification.
