## v0.32.0 — Elemental Duo Mobile, Map Clarity & Stability
- Merapikan geometri peta untuk seluruh 50 level: jarak visual minimum antarplatform kini diperiksa, termasuk cabang dan shortcut, agar platform tidak terlihat menyatu/bertumpuk.
- Menata ulang koordinat vertikal lima arketipe peta; variasi eksplorasi kiri/kanan/atas/bawah dan pintu di lokasi berbeda tetap dipertahankan.
- Mengubah `ELEMENTAL_MAP_VERSION` menjadi 6 agar posisi sesi dari layout sebelumnya dipindahkan ke spawn aman; progres level, shards, dan jumlah jatuh tetap dipertahankan.
- Mode landscape menggunakan Fullscreen API dengan fallback portal ke `document.body`; panel benar-benar mengisi viewport dan memakai `100dvh` pada fullscreen native serta `100svh` pada fallback stabil.
- Menambahkan kontrol analog transparan yang otomatis aktif pada landscape, dapat diganti ke tombol dari HUD; tombol aksi/lompat tetap tersedia di sisi kanan.
- Mengurangi kedipan/lonjakan dengan tidak mendengarkan `visualViewport.resize`, mengukur ulang via `requestAnimationFrame`, dan hanya mengubah backing canvas saat ukuran CSS berubah nyata.
- Firebase Rules tidak berubah dan tidak ada dependensi npm baru.
- Tes otomatis: 188/188 lulus; seluruh JavaScript lolos pemeriksaan sintaks.

## v0.31.0 — Elemental Duo Adventure Maps & Multi-directional Exploration
- Mengubah arena menjadi peta eksplorasi 2D 1440×960 dengan perjalanan horizontal dan vertikal, bukan koridor lurus menuju pintu di ujung kanan.
- Setiap level kini memiliki 13 pijakan jalur utama, 5 jalur samping, 4 jembatan pintas yang membentuk loop, serta lantai terputus untuk mendorong lompatan dan eksplorasi.
- Menambahkan lima pola peta yang bervariasi: Jalur Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, dan Lingkaran Kuno. Posisi pintu Bara dan Nira tersebar di sisi kiri, tengah, kanan, serta lantai atas/bawah.
- Menambahkan peta mini yang memperlihatkan jalur, platform cabang, hazard, sakelar, permata, dua pintu, posisi kedua pemain, dan viewport kamera masing-masing perangkat.
- Menambahkan penunjuk arah pada tepi layar menuju pintu elemen milik pemain ketika pintunya berada di luar kamera.
- HUD menampilkan nama pola peta; renderer tetap memakai kamera lokal dan dua mode mobile Potret/Layar Penuh.
- Menaikkan `ELEMENTAL_MAP_VERSION` ke 3: posisi lama di-reset ke spawn peta baru, tetapi progres skor/jumlah jatuh tetap dipertahankan dan status `complete` lama tidak mengunci pemain.
- Tidak ada dependensi baru. Firebase Rules dan struktur node RTDB tidak berubah.
- Tes otomatis: 186/186 lulus, termasuk jangkauan semua platform dari kedua spawn, variasi pintu, gerbang vertikal, peta mini, dan migrasi posisi versi lama.

## v0.29.0 — Elemental Duo World 5: Jantung Kuno
- Level 41–50 kini memakai 10 blueprint final khusus, sehingga seluruh 50 level sudah memiliki layout dan mekanik yang ditulis khusus.
- Dunia final menggabungkan es, arus, angin, lava, air, uap, hazard berkala/bergerak, dan platform bergerak.
- Menambahkan puzzle dual-valve, dual-wind-lever, serta urutan pijakan Nira lalu Bara pada level 44, 49, dan 50.
- Menambahkan dekorasi runik dan serpihan kristal khusus Jantung Kuno.
- Pressure plate, katup, tuas, dan checkpoint diperiksa agar aman, stabil, berada sebelum gerbang, serta bisa dijangkau dari kedua spawn.
- Memperbarui cache key menjadi v0.29.0; tidak ada dependensi baru. Firebase Rules tidak berubah.
- Tes otomatis: 181/181 lulus; seluruh JavaScript lolos pemeriksaan sintaks.

# Changelog — Diri. Playroom Date

## v0.28.0 — Elemental Duo World 4: Reruntuhan Langit
- Level 31–40 kini memakai 10 blueprint khusus, dengan tingkat kesulitan Sulit hingga Expert.
- Zona angin memengaruhi fisika karakter secara lokal melalui gaya horizontal/vertikal.
- Hembusan dapat berdenyut dan membalik arah mengikuti jam level Firebase bersama.
- Tuas pengubah arah angin tersinkron di RTDB; beberapa level mensyaratkannya untuk membuka gerbang.
- Platform awan memiliki renderer khusus dan tetap mendukung gerakan serta membawa karakter.
- Kamera, mode Potret/Layar Penuh, Photobooth, dan mini-game lain dipertahankan. Firebase Rules tidak berubah.
- Tes otomatis: 178/178 lulus; seluruh JavaScript lolos pemeriksaan sintaks.

## v0.27.0 — Elemental Duo: implementasi Kerajaan Bara (Dunia 3)
- Menambahkan 10 blueprint khusus level 21–30: Napas Lava hingga Jantung Tungku.
- Menambahkan lava berdenyut dan magma yang bergerak vertikal, dihitung dari jam level bersama.
- Menambahkan hazard uap yang aktif/nonaktif dan berbahaya bagi Bara maupun Nira.
- Menambahkan katup yang dapat dioperasikan dengan AKSI; katup tersimpan pada RTDB dan menonaktifkan hazard yang terhubung.
- Menambahkan syarat katup untuk gerbang serta katup khusus elemen untuk level kerja sama.
- Menambahkan urutan aktivasi pijakan Nira lalu Bara pada level 26 dan 30 melalui transaksi RTDB atomik.
- Memperbarui renderer lava/uap, HUD progres katup/urutan, cache asset, dokumentasi, dan tes regresi.
- Firebase Rules tidak berubah.

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
- Blueprint khusus mencakup level 01–20. Level 21–50 masih memakai generator sebelumnya.

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
