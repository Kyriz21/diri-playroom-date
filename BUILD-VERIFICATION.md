# Build Verification — Diri. Playroom Date v0.51.0

## v0.51.0 — One Tap Shared Lane
- `npm test`: **254/254 tes lulus**.
- One Tap landing card displays only Buat Room and Join Room actions; title and dialog text use One Tap.
- Explicit room lobby labels the members Player 1 and Player 2 while retaining account display names as secondary text.
- Both player simulation states start at `x = 0.5`; both roles receive identical deterministic gate arrays for the same seed.
- Gate collision/scoring is evaluated at the shared center X; each player's Y, lives, input, and score remain independent.
- Arena render draws the common obstacle stream once; player sprites are visually offset by 25 canvas pixels on either side of the center without changing their collision coordinate.
- `firebase-database.rules.json` unchanged; no Rules republish is required when v0.49.0 Rules are active.
- All JavaScript files checked with `node --check`; Firebase Rules JSON parsed successfully.
- Browser rendering and live two-device Firebase playtest have not yet been performed.


## v0.50.0 — Bomber Arena Map Variety & Spawn Fairness
- `npm test`: **254/254 tes lulus**.
- Stress test 10.000 seed: ketiga profil terdistribusi (Lapangan Terbuka 3.309, Persimpangan 3.336, Benteng Tengah 3.355).
- Seluruh 10.000 arena lolos pemeriksaan konektivitas lantai dari kedua spawn, minimal dua jalur keluar per spawn, dan simetri 180° peti.
- Jumlah peti: 9–26 per arena. Distribusi power-up: 2–4 pasangan peti, selalu dengan tipe item sama pada kedua sisi.
- Perlindungan spawn 1.600 ms dihitung dari waktu mulai bersama setelah countdown; kontrol dinonaktifkan selama countdown dan input arah dihentikan saat window blur.
- Firebase Rules dan struktur data sesi tidak berubah dari v0.49.0. Tidak perlu Publish ulang jika Rules v0.49.0 sudah aktif.
- Pemeriksaan sintaks seluruh JavaScript serta parsing Firebase Rules JSON lulus. Playtest browser dan dua perangkat dengan Firebase aktif tetap diperlukan.

## v0.49.2 — Bomber Arena Fair Connected Maps
- `npm test`: **251/251 tes lulus**.
- Bomber Arena map generation is rotationally symmetric (180°) for both player spawns.
- Candidate crate placements are rejected if they disconnect any walkable floor cell or leave a crate without an accessible adjacent floor tile.
- Hidden power-ups mirror with the same type, so both players have equivalent item opportunities.
- 1,000 deterministic seeds are checked in the regression suite for direct spawn exits and full floor connectivity from both players. A separate 10,000-seed stress run found 0 disconnected arenas; crate counts ranged from 14 to 26.
- 250 additional seeds are checked for mirrored crate and power-up layout.
- Firebase Rules and session data schema are unchanged from v0.49.0.
- `node --check` passed for all JavaScript files under `js/` and `tests/`. Firebase Rules JSON parsed successfully; all 152 `.read`, `.write`, and `.validate` expressions have balanced parentheses.
- Browser and two-device Firebase playtest remains required.

# Build Verification — Diri. Playroom Date v0.49.1

## v0.49.1 — Bomber Arena Gameplay Polish
- `npm test`: **250/250 tes lulus**.
- Seluruh file JavaScript di `js/` lolos `node --check`.
- Firebase Rules JSON valid; semua 152 ekspresi `.read`, `.write`, `.validate` seimbang.
- Prediksi jalur ledakan diuji pada rentang fuse peringatan 850 ms; tile api aktif diverifikasi tetap terdaftar selama masa ledakan.
- Statistik bom dipasang, peti dihancurkan, power-up dikumpulkan, dan hit yang mengurangi nyawa ditambahkan ke state host-authoritative dan kartu rekap.
- D-pad 3×3, legenda power-up, fuse ring, dan peringatan jalur ledakan diperiksa melalui tes integrasi source/CSS.
- Firebase Rules tidak berubah dari v0.49.0.
- Belum dilakukan playtest langsung pada dua perangkat dengan Firebase project aktif.

---


## v0.44.0 — Authored 50-Level Maps & Playability Repair
- `npm test`: **199/199 tes lulus**.
- Seluruh file JavaScript di luar `node_modules` lolos `node --check`.
- `firebase-database.rules.json` dapat diparse sebagai JSON dan tidak berubah pada build ini.
- Semua 50 level menggunakan blueprint per-level (`blueprintId` unik), tanpa generated corridors, wall fragments, partitions, atau ruin walls tambahan.
- Jumlah platform per level: **3–8**. Ada 49 siluet geometri platform yang berbeda; Level 44 dan 47 memiliki geometri platform yang sama tetapi blueprint, tujuan, hazard, dan mekanik level tetap terpisah.
- Tes reachability memeriksa jalur dari spawn tiap karakter ke platform switch, permata, kontrol yang ditugaskan, dan pintu; setiap transisi platform dalam rute diuji dengan model jarak lompatan saat ini.
- Tes memeriksa overlap platform fisik/visual; spawn, switch, permata, dan pintu Bara/Nira harus berada pada sisi elemen yang sesuai serta objek puzzle memiliki platform dukungan stabil.
- ID hazard/katup/tuas dan referensi wajib diperiksa agar tidak ada kontrol yang menunjuk ke objek yang hilang.
- `ELEMENTAL_MAP_VERSION=29`, `ELEMENTAL_CAMPAIGN_VERSION=2`, `jumpSpeed=560`, `gravity=1500`. Firebase Rules tidak berubah.
- Migrasi room lama: kembali ke Level 01, hasil kampanye dan state puzzle lama dibersihkan, Ready/completion direset; room membership dan statistik lifetime dipertahankan.
- **Belum dilakukan playtest langsung** pada browser dan dua HP dengan Firebase aktif. Perhitungan geometri otomatis tidak dapat memastikan semua puzzle terasa alami atau menyenangkan.

## Batas verifikasi v0.44.0
Build ini memperbaiki tumpukan template yang menyebabkan arena v0.43.0 terlalu padat. Semua level lolos validasi struktur dan reachability geometri dari spawn. Sebelum menyatakan seluruh kampanye selesai diuji, lakukan playtest langsung tiap dunia—khususnya lift, es, arus, angin, hazard berkala, katup, tuas, gerbang, serta transisi bersama pada dua perangkat.

---

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


## v0.45.0 — LDR Mini Games

- Syntax checks: `js/app.js`, `js/constants.js`, dan tiga modul game serta logic mini game lulus `node --check`.
- Firebase Rules berhasil diparse sebagai JSON.
- Otomatis: 210 tes lulus, 0 gagal.
- Cakupan mini game: 20 pertanyaan Love Match dan empat dimensi, perhitungan kecocokan, Color Match RGB, 30 soal IQ termasuk dua matriks 3 × 3, deterministic shuffle, 12/20 round selection, entry solo/room, dan pembatasan pembacaan jawaban privat sampai reveal/result pada game serta sesi aktif yang cocok.
- Pengujian jaringan nyata dua perangkat belum dilaksanakan. Firebase Rules versi v0.45.0 wajib dipublikasikan sebelum game baru dipakai melalui room.


## v0.46.0 — Player Lobby & Result Recap Cards
- Automated suite: 214/214 passed.
- Shared explicit lobby tested for Love Match, Color Match, and IQ Duel: player identity, presence checks, per-player Ready, and host-only Start.
- Service-level checks reject Ready/Start when either member is not online; Firebase Rules also gate Ready and activeSession creation on both `presence/*/connected === true` for the three mini-games.
- Love Match uses one final profile/compatibility recap; Color Match stores five round result records and displays one final recap grid; IQ Duel displays one score/review recap.
- Color Match remote summary uses mean accuracy rather than the accumulated five-round sum.
- JavaScript syntax and Firebase Rules JSON validation passed. No live browser or real two-device Firebase playtest was performed.


## v0.47.0 — Arcade
- Automated test suite: **231/231 passed**.
- Added integration checks for active catalog entry, landing routes, explicit lobby, Ready/presence gating, Arcade Firebase data scope, selfie compression cap, and single recap card.
- Arcade logic checks: deterministic 12-stage entities, player side bounds, jump/rocket movement, Bubble Pop vertical movement, collection, hazard lives/invulnerability, rhythm timing, countdown bounds, and winner calculation.
- `node --check` passed for all JavaScript files. Firebase Rules parsed as JSON; all rule expression strings have balanced parentheses.
- Not verified: live browser rendering across devices, webcam capture on target phones, real Firebase permission behavior, and full two-device Arcade playthrough.


# Build Verification — Diri. Playroom Date v0.48.0

## v0.48.0 — Expanded Brain Banks & Flappy Face
- Love Match: 80 soal (20 tiap dimensi), seleksi 32 soal seimbang per sesi, seluruh 16 profil memiliki deskripsi/kekuatan/komunikasi/relasi/pertumbuhan; hasil menyediakan pilihan kedua pemain dan ekspor JSON/CSV.
- Color Match: start remote membaca ulang fase/config terbaru, validasi data privat menerima format RGB khusus Color Match, target diacak per ronde dan menghindari target terlalu mirip sebelumnya.
- IQ Duel: 100 soal dalam lima kategori; seleksi 12/20 seimbang, rekap kategori dan pembahasan per soal.
- Arcade: satu stage Flappy Face 60 detik; tap/klik atau tombol LOMPAT/Space/ArrowUp/W; pipe pairs, gravity, collision, lives, gate scoring, dan kartu hasil.
- Firebase Rules JSON diparse, seluruh ekspresi `.read`, `.write`, `.validate` diperiksa keseimbangan tanda kurung; Arcade result transition dan presence gate diuji statis.
- JavaScript syntax: jalankan `node --check` pada seluruh file di `js/`.
- Automated test suite: 231/231 passed after final cache-version assertion update.
- `node --check` passed untuk seluruh JavaScript di `js/`.
- Firebase Rules berhasil diparse sebagai JSON dan semua ekspresi aturan memiliki tanda kurung seimbang.
- Manual browser + dua perangkat dengan Firebase project aktif belum dilakukan.

## v0.49.0 — Bomber Arena

- `npm test`: **245/245 passed**.
- `node --check` dijalankan untuk seluruh file JavaScript di `js/` dan `tests/`.
- 1.000 seed arena diuji; kedua spawn selalu memiliki sedikitnya dua jalur keluar langsung.
- Unit test memeriksa grid, collision, dinding/peti, blast silang, power-up, shield, nyawa, pemenang, timer, countdown, guest crate rendering, pemulihan setup, integrasi lobby dan Rules.
- `firebase-database.rules.json` berhasil diparse; semua ekspresi `.read`, `.write`, `.validate` pada Rules memiliki tanda kurung seimbang.
- Pemeriksaan seluruh aturan menemukan dan memperbaiki satu tanda kurung tutup berlebih pada `privateRooms/$roomCode/$gameId/$sessionId/$uid/.read`; pemeriksaan kini mencakup semua expression, bukan hanya path Bomber Arena.
- Pengujian Firebase Emulator/Rules Playground dan playtest browser dua perangkat belum dilakukan.
