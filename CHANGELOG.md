## v0.43.0 — Full 50-Level Campaign & Gem Scoring

- Membuka seluruh 50 level Elemental Duo sebagai kampanye aktif berurutan; tidak lagi berhenti setelah lima level prototype.
- Menyusun urutan lima dunia, masing-masing 10 level: Hutan Berbisik (01–10), Kedalaman Kristal (11–20), Kerajaan Bara (21–30), Reruntuhan Langit (31–40), dan Jantung Kuno (41–50).
- Mengaktifkan semua blueprint `ELEMENTAL_LEVELS` melalui `getElementalLevel()` dan transisi otomatis hingga Level 50. Lima layout handcrafted tetap menjadi level pembuka untuk setiap dunia.
- Menjelaskan permata sebagai bonus opsional: merah hanya untuk Bara, biru hanya untuk Nira; permata bukan syarat switch, gerbang, atau pintu.
- Menegaskan scoring tiap level: 3 bintang (dua permata + nol jatuh), 2 bintang (maksimal dua jatuh gabungan), 1 bintang (lebih dari dua jatuh). Maksimum kampanye 150 bintang dan 100 permata.
- Lobby, HUD, progress bar, counter level, serta layar akhir diperbarui untuk kampanye 50 level dan fungsi permata.
- Migrasi `campaignVersion=1` memindahkan sesi prototype lama ke level 01, membersihkan state puzzle/hasil lama, dan mereset status ready/completion. Statistik lifetime dan keanggotaan room tetap dipertahankan.
- `ELEMENTAL_MAP_VERSION=27`; fisika lompatan dan Firebase Rules tidak berubah.
- Tes mencakup kelima dunia, semua 50 level, dua permata per level, aturan scoring, gate independen dari gem, progres sampai Level 50, dan migrasi kampanye.

## v0.42.0 — Fireboy & Watergirl Classic-style Co-op

- Menyusun ulang lima level sebagai puzzle side-view klasik: spawn kiri/kanan di bawah, kolam air/lava, galeri utama, dua pintu pada tingkat yang sama, cabang permata di atas, dan gerbang bersama di tengah.
- Setiap sisi memiliki hazard yang aman bagi karakternya serta hazard elemen lawan. Rute tiga tahap dibuat dari entry ledge, inner step, lalu galeri switch/pintu.
- Lima komposisi manual berisi 11–12 pijakan/ledge, dinding penghalang di titik lintasan, dan dua pintu yang ditempatkan lebih ke bagian tengah galeri.
- Level 2–5 memperkenalkan lift bergerak, es, uap, lava berdenyut, tuas angin, katup, dan urutan switch.
- Fisika lompatan dipertahankan (`ELEMENTAL_JUMP_SPEED=560`, `ELEMENTAL_GRAVITY=1500`, puncak teoretis ±104,5 unit). Analog tetap hanya menggerakkan kiri/kanan.
- `ELEMENTAL_MAP_VERSION=22`, `prototypeVersion=8`; Firebase Rules tidak berubah. Verifikasi: 194/194 tes otomatis lulus.
- Playtest browser dan dua perangkat fisik dengan Firebase aktif masih diperlukan.

## v0.40.0 — Classic Co-op Level Rebuild

- Mengubah komposisi lima level prototype agar terbaca sebagai **labirin dungeon tampak samping**, bukan deretan rak/platform panjang: koridor lebih pendek, kamar ber-offset, jalur kiri/kanan yang berbelok, ruang penghubung dan gerbang elemen.
- Lantai bawah menyatu dengan lantai utama. Tiga jangkar koridor bawah tetap dipakai untuk spawn/checkpoint/hazard, tetapi tidak lagi digambar sebagai platform terpisah.
- Menghapus tiang penyangga di bawah lantai koridor dan mempertegas fasia batu serta tekstur balok agar lantai terasa menjadi bagian dari arsitektur dungeon.
- Mempertegas dinding partisi dan menambahkan frame lorong persegi yang menandai pintu masuk ke kamar berikutnya. Tidak menambahkan panah dekoratif atau rune melingkar.
- Lima layout prototype memiliki geometri jalur yang berbeda. 45 blueprint level lanjutan tetap tersedia di engine.
- Fisika lompatan dipertahankan (`ELEMENTAL_JUMP_SPEED=560`, `ELEMENTAL_GRAVITY=1500`, puncak teoretis ±104,5 unit); kontrol analog tetap hanya menggerakkan kiri/kanan.
- Menaikkan `ELEMENTAL_MAP_VERSION` ke 19 dan `prototypeVersion` ke 5 agar sesi dengan geometri v0.39.2 dimigrasikan ke spawn/layout baru. Statistik pemain dan membership room dipertahankan; Firebase Rules tidak berubah.
- Cache key/package version menjadi v0.40.0. Verifikasi: 194/194 tes otomatis lulus; seluruh JavaScript lolos `node --check`; Firebase Rules JSON valid.

## v0.39.2 — Ruins Water & Fire Maze

- Mengganti grammar arena berulang menjadi 10 pola reruntuhan akuaduk/labirin dengan lorong bertingkat, jalur kiri-kanan, platform penghubung, dan komposisi berbeda.
- Menambahkan balok runtuhan batu yang memiliki collision dan dapat dilompati. Tinggi setiap fragmen dijaga di bawah tinggi lompatan normal.
- Menata ulang saluran air dan lava pada tiap layout agar menjadi bagian dari navigasi arena, bukan dua kolam identik di bagian bawah.
- Mengganti relief rune melingkar yang membingungkan dengan relief gerbang akuaduk retak; penunjuk panah di tepi kamera dihapus karena tidak jelas dan tidak diperlukan pada layout prototype satu layar landscape.
- Checkpoint kini menghindari hazard dengan margin aman yang lebih lebar, termasuk semburan uap.
- Mempertahankan fisika lompatan v0.39.1 (`jumpSpeed=560`, `gravity=1500`).
- Menaikkan `ELEMENTAL_MAP_VERSION` ke 17 dan `prototypeVersion` ke 3 agar posisi karakter dan state puzzle lama dimigrasikan. Statistik pemain, room, dan Firebase Rules tidak diubah.
- Cache key dan package version menjadi v0.39.2. Verifikasi: 194/194 tes otomatis lulus dan seluruh JavaScript lolos `node --check`.

## v0.39.1 — Classic Temple Layout & Jump Repair

- Memperbaiki arena yang sebelumnya terlalu rapat: lima level prototype kini memilih lima pola ruang berbeda, dengan jarak vertikal lebih lega dan jalur bertingkat yang terbaca.
- Seluruh 10 pola ruang disusun ulang sebagai rute dua sisi yang naik menuju galeri atas dan pintu Bara/Nira. Ketebalan visual platform dinaikkan menjadi 22 unit, sementara collision tetap 8 unit.
- Menaikkan lompatan dari `280 / 1300` (puncak ±30,2 unit) menjadi `560 / 1500` (puncak ±104,5 unit), sehingga kenaikan platform 80–95 unit dapat dicapai.
- Menaikkan `ELEMENTAL_MAP_VERSION` menjadi 16 dan `prototypeVersion` menjadi 2 agar posisi dan state puzzle dari layout sebelumnya dimigrasikan dengan aman. Statistik pemain, keanggotaan room, dan Firebase Rules tidak berubah.
- Cache key diperbarui ke v0.39.1. Verifikasi: 193/193 tes otomatis lulus dan seluruh JavaScript lolos `node --check`.

## v0.39.0 — Classic Temple Prototype (5 tema)

- Mengubah cakupan permainan aktif menjadi **5 level prototype**; masing-masing memakai satu blueprint pembuka dari Hutan Berbisik, Kedalaman Kristal, Kerajaan Bara, Reruntuhan Langit, dan Jantung Kuno.
- 45 blueprint lanjutan tetap disimpan di engine untuk ekspansi setelah prototype diuji; progres prototype berhenti pada level 5.
- Renderer Canvas diperbarui dengan dinding bata gelap, pola batu kuil, lumut, tanaman rambat, relief, partikel, dan aksen visual yang berbeda untuk kelima tema.
- Platform batu mendapat tekstur balok, tepi batu, lumut, sambungan, serta retakan; air dan lava mendapat permukaan cairan yang lebih hidup.
- Permata dibuat lebih faceted, pintu menjadi portal batu persegi dengan simbol elemen, dan Bara/Nira mendapat siluet karakter platformer yang lebih terbaca.
- Level counter, progress bar, dan hasil akhir disesuaikan untuk 5 level (15 bintang, 10 permata).
- Menambahkan `prototypeVersion` pada metadata sesi untuk memindahkan sesi lama kembali ke level 1 dan membersihkan state puzzle lama. Firebase Rules tidak berubah.
- `ELEMENTAL_MAP_VERSION` naik menjadi 15 agar posisi karakter lama kembali ke spawn baru; statistik dasar pemain tetap dibawa.
- Cache key menjadi v0.39.0. Verifikasi lokal: 193/193 tes otomatis lulus; pemeriksaan sintaks JS lulus.

## v0.38.0 — Elemental Duo Classic Room Rework
- Mengganti pola eksplorasi yang terlalu acak menjadi 10 pola ruang puzzle kooperatif yang terarah, dengan dua jalur elemen, platform bertingkat, area pertemuan tengah, permata warna, pijakan, dan pintu karakter.
- Tier vertikal utama disusun pada y `[522, 498, 474, 450, 426, 402]` (selisih 24 unit) dan tiap lompatan rute utama diuji dengan envelope fisika.
- Fisika lompatan menjadi `jumpSpeed 280` dan `gravity 1300`, tinggi puncak teoretis sekitar 30,2 unit; jump buffer 170 ms dan coyote time 140 ms tetap tersedia.
- Analog virtual hanya mengatur gerak kiri/kanan; input vertikal analog diabaikan dan tidak mengantrekan jump. Tombol LOMPAT/Space tetap menjadi input lompat.
- Checkpoint dipilih dari platform stabil yang tidak berimpit dengan hazard, pintu, pijakan, atau kontrol.
- Platform khusus bergerak/berkala diprioritaskan pada slot samping yang tersedia; landscape UI tidak diubah.
- Cache key menjadi v0.38.0 dan `ELEMENTAL_MAP_VERSION` menjadi 14. Posisi level aktif kembali ke spawn saat migrasi; progres dan statistik tetap dipertahankan. Firebase Rules tidak berubah.
- Verifikasi: 191/191 tes otomatis lulus, JavaScript lolos pemeriksaan sintaks, Firebase Rules JSON valid.

## v0.37.0 — Elemental Duo Classic Co-op Puzzle Repair
- Mengganti 10 pola ruang peta menjadi struktur puzzle yang konsisten: dua jalur bawah untuk Bara/Nira, pijakan elemen, jalur permata, platform kontrol, jembatan tengah, dan pintu yang bervariasi di kiri/tengah/atas.
- Mengatur jarak tier vertikal menjadi 34 unit dan memvalidasi konektivitas seluruh 13 platform dari kedua spawn pada semua 50 level.
- Mengurangi tinggi lompatan ke sekitar 38,8 unit (`jumpSpeed 305`, `gravity 1200`), tanpa menghilangkan jump buffer 170 ms dan coyote time 140 ms.
- Analog virtual hanya menggerakkan kiri/kanan; sumbu vertikal analog tidak mengantrekan lompatan. LOMPAT tetap tombol terpisah.
- Collision platform menggunakan tinggi 8 unit sementara renderer menampilkan tinggi 16 unit agar visual rapi tanpa mengubah pijakan fisik.
- Kontrol/tuas dibagi ke platform stabil; vent uap tersebar pada jembatan tengah dan checkpoint berada di area aman.
- Mode landscape dipertahankan; cache key dinaikkan ke v0.37.0. `ELEMENTAL_MAP_VERSION` menjadi 13.
- Firebase Rules tidak berubah. Verifikasi: 191/191 tes otomatis lulus; seluruh JavaScript lolos `node --check`.

## v0.33.0 — Mobile Repair, Analog Input & Difficulty Balance

- Mode Potret sekarang memakai panel game edge-to-edge setinggi viewport dengan title satu baris, HUD terkompresi, canvas fleksibel, dan kontrol yang tetap berada di dalam lebar layar.
- Mode landscape/fullscreen memakai canvas sebagai latar penuh, HUD melayang, analog transparan di kiri, dan tombol lompat/interaksi di kanan. Fallback aplikasi memakai fixed viewport ketika Fullscreen API tidak tersedia.
- Kontrol analog sekarang benar-benar menggantikan tombol arah. Sumbu horizontal bergerak kiri/kanan; dorongan ke atas memicu lompatan. Pointer Event diproses melalui window untuk menjaga input saat pointer capture berubah.
- Tombol INTERAKSI bersifat kontekstual: hanya muncul dekat katup atau tuas. Pijakan otomatis diaktifkan saat karakter menginjaknya.
- Fisika dipermudah: gravity 1100, jump speed 690, platform utama 128 px, jump buffer 170 ms, dan coyote time 140 ms.
- Kurva kesulitan diseimbangkan ulang di kelima dunia. Dunia 1 tetap tutorial mudah hingga level 8; level akhir berada pada Sulit (4/5), tanpa tingkat Expert.
- Menara Kembar diperbaiki agar platform utama tidak bertumpuk; seluruh geometri 50 level dan jangkauan platform diuji.
- MapVersion dinaikkan ke 9. Posisi pada level aktif kembali ke spawn saat migrasi; progres dan statistik pemain dipertahankan.
- Firebase Rules tidak berubah.
- Verifikasi: 191/191 tes otomatis lulus; semua file JavaScript lolos `node --check`.

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


## v0.42.2 — Challenge Accessibility Repair
- Level 2 paired lifts dipindahkan ke sisi jalur utama agar tidak menangkap karakter saat naik ke galeri pintu.
- Amplitudo lift dikurangi menjadi 18 unit; jarak vertikal ke jalur atas tetap aman pada seluruh fase gerak.
- Katup Level 5 dipindahkan ke posisi berdiri yang sejajar dengan platform masuk dan berada dalam radius interaksi.
- Level 3 mempertahankan hazard berwaktu dengan jendela aman; semua lintasan karakter diuji ulang.
- Map version dinaikkan ke 26 dan prototype version ke 11 untuk membersihkan state posisi/puzzle dari build sebelumnya.
- 199 tes otomatis lulus; ini bukan pengganti uji langsung dua perangkat.
