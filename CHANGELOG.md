## v0.51.0 — One Tap shared lane
- Mengganti nama tampilan game dari Arcade/Flappy Face menjadi **One Tap** pada katalog, landing page, form room, lobby, arena, HUD, dan hasil.
- Landing One Tap hanya menampilkan dua tindakan: **Buat Room** dan **Join Room**. Pratinjau menggunakan label Player 1 dan Player 2.
- Menghapus pembagian arena kiri/kanan dan garis pemisah. Kedua pemain memulai di koordinat X yang sama (0,5) pada titik tengah lintasan.
- Mengganti dua rangkaian pipa berlawanan menjadi satu urutan pipa deterministik yang sama untuk kedua pemain, melintas melalui jalur tengah.
- Avatar digambar berdekatan di sekitar titik tengah agar Player 1 dan Player 2 terlihat terpisah; offset ini hanya visual, sedangkan hitbox X dan tabrakan tetap menggunakan koordinat tengah yang sama.
- Skor, nyawa, posisi vertikal, dan input tap tetap terpisah per pemain. Kedua pemain tetap memiliki tiga nyawa dan memperoleh 10 poin per pipa yang dilewati.
- Firebase Rules dan struktur node room tidak berubah. Tidak perlu Publish ulang jika Rules v0.49.0 sudah aktif.
- `npm test`: **254/254 tes lulus**. Seluruh JavaScript diperiksa dengan `node --check`; Firebase Rules JSON diparse. Pengujian browser dan dua perangkat nyata tetap diperlukan.

## v0.50.0 — Bomber Arena map variety, fair items & spawn safety
- Menambahkan tiga profil arena deterministik: Lapangan Terbuka, Persimpangan, dan Benteng Tengah. Semua profil mempertahankan simetri rotasi 180° serta pemeriksaan konektivitas sebelum peti ditempatkan.
- Distribusi power-up dibatasi 2–4 pasangan peti per arena; kedua sisi pasangan selalu menyimpan tipe item yang sama.
- Kedua pemain mendapat perlindungan awal selama 1.600 ms setelah countdown. Indikator cincin perlindungan dibedakan dari shield yang dimiliki.
- Kontrol arah dan tombol bom terkunci selama countdown; input tidak dapat mengantre bom sebelum pertandingan aktif.
- Gerakan berhenti saat jendela browser kehilangan fokus untuk mencegah karakter terus berjalan setelah pemain berpindah tab/aplikasi.
- Firebase Rules, struktur sesi, dan otoritas simulasi host tidak berubah.
- Automated test, stress test generator, pemeriksaan sintaks JavaScript, dan parsing Firebase Rules dijalankan; playtest browser/two-device tetap diperlukan.

## v0.49.2 — Bomber Arena fair-map repair
- Arena crate placement is mirrored 180° for equivalent player routes and power-up opportunities.
- Generator rejects crate placements that isolate walkable floors or hide a crate without an approachable adjacent tile.
- 1,000 seeds are checked for full connectivity from both spawns; 250 seeds are checked for exact mirrored block and item placement.
- Firebase Rules unchanged.

# Changelog — Diri. Playroom Date

## v0.49.1 — Bomber Arena Gameplay Polish
- Menambahkan telegraph kotak merah berkedip pada jalur ledakan ketika fuse memasuki 850 ms terakhir, serta ring fuse pada bom.
- Memperbaiki damage ketika pemain baru masuk ke tile api yang masih aktif; api aktif kini tetap berbahaya sampai durasinya berakhir.
- Memperjelas tampilan power-up dengan warna berdasarkan efek dan menambahkan legenda di bawah arena.
- Mengubah D-pad mobile menjadi susunan 3×3 klasik yang lebih mudah dikenali dan disentuh.
- HUD menampilkan kapasitas bom aktif; kartu hasil menampilkan jumlah bom dipasang, peti dihancurkan, power-up dikumpulkan, dan hit yang mengurangi nyawa.
- Mencegah tombol Kembali keluar dari duel yang sedang berjalan tanpa menyelesaikan pertandingan.
- Firebase Rules tidak berubah dari v0.49.0; tidak perlu Publish ulang bila Rules v0.49.0 sudah aktif.
- `npm test`: **250/250 tes lulus**. Seluruh file JavaScript lolos `node --check`; Firebase Rules JSON valid dan 152 ekspresi `.read`, `.write`, `.validate` seimbang.
- Playtest browser dan dua perangkat dengan Firebase project aktif masih diperlukan.

## v0.49.0 — Bomber Arena 1 vs 1

- Menambahkan Bomber Arena sebagai mini-game kelima: duel dua pemain pada grid 13 × 11, maksimum tiga menit, tiga nyawa per pemain.
- Menambahkan gerak grid empat arah, kontrol D-pad/touch dan keyboard, tombol pemasangan bom, fuse 2,2 detik, ledakan silang, penghentian ledakan oleh dinding/peti, dan chain reaction.
- Menambahkan peti yang dapat dihancurkan serta empat power-up: Bomb Up, Fire Up, Speed Up, dan Shield.
- Menambahkan perhitungan damage, invulnerability singkat, skor, eliminasi, tie-break sisa nyawa/skor saat waktu habis, serta kartu rekap.
- Mengintegrasikan Bomber Arena ke katalog, landing page, create/join, explicit player lobby, presence, Ready, session loader, dan Firebase Rules.
- Simulasi dibuat host-authoritative: guest hanya mengirim input miliknya; host menghitung gerakan, collision, bom, ledakan, power-up, nyawa, skor, dan hasil.
- Batas kesegaran input memakai waktu penerimaan lokal di host agar perbedaan jam HP tidak membuat gerakan berhenti.
- Memperbaiki satu tanda kurung tutup berlebih yang masih terbawa pada `privateRooms/$roomCode/$gameId/$sessionId/$uid/.read`; tes kini memeriksa semua ekspresi Firebase Rules di seluruh file.
- Memperbaiki render peti hancur pada perangkat guest, menahan simulasi selama countdown, menggunakan state Firebase sebagai fallback untuk kartu hasil host, dan memulihkan setup bila proses host terputus.
- Menambahkan `BOMBER-ARENA.md` dan tes logika, peta 1.000 seed, integrasi room, Firebase Rules, serta regresi countdown/state.
- `npm test`: **245/245 tes lulus**. Seluruh JavaScript lolos `node --check`; Firebase Rules JSON valid dan ekspresi `.read`, `.write`, `.validate` diperiksa keseimbangan tanda kurung.
- Tidak ada dependensi npm baru. Playtest langsung dua perangkat dengan Firebase project aktif tetap diperlukan.

## v0.45.0 — LDR Mini Games

- Mengarsipkan opsi Elemental Duo dari landing page; konsep dan source lama tetap tersimpan.
- Menambahkan Love Match, Color Match, dan IQ Duel pada landing page, alur create/join room, serta mode satu perangkat.
- Love Match: 20 pertanyaan orisinal, jawaban privat lintas perangkat, reveal bersama, skor kecocokan dan empat dimensi profil.
- Color Match: lima ronde, Versus/Duet, tiga durasi kesulitan, slider RGB, dan skor akurasi.
- IQ Duel: 30 soal orisinal termasuk matriks 3 × 3, 12/20 ronde, timer 30 detik, jawaban privat, dan pembahasan setelah hasil.
- Memperluas Firebase Realtime Database Rules untuk ID mini game baru serta pembacaan silang jawaban hanya setelah fase reveal/hasil pada game dan sesi yang sedang aktif.
- Menambahkan dokumentasi `BRAIN-MINI-GAMES.md` dan 11 tes logika/integrasi mini game.
- Catatan pengujian: tes otomatis lulus; pengujian langsung dua perangkat dengan Firebase aktif masih diperlukan.


- Menelusuri sumber arena tidak terbaca pada v0.43.0: `makeLevel()` mengalihkan blueprint 50 level ke generator peta maze yang menambahkan platform, koridor dan partisi berulang. Level pembuka juga ikut tertimpa oleh template tersebut.
- Mengubah `makeLevel()` agar menggunakan 50 blueprint per-level secara langsung. Tidak ada lagi platform maze sintetis, koridor atau dinding partisi tambahan yang ditumpuk di atas data desain level.
- Memetakan spawn, switch, permata, katup/tuas, dan pintu ke platform yang stabil dan dapat dijangkau. Posisi Bara/Nira, switch, permata dan pintu mempertahankan sisi elemen masing-masing.
- Menyelaraskan ID platform, hazard, katup, dan tuas agar referensi puzzle sesuai setelah blueprint dipakai langsung. Interaksi tuas netral dapat dilakukan oleh karakter yang mendekat.
- Mematikan relief/ornamen generik yang menutupi ruang pada peta authored. Tampilan latar batu, platform tematik, hazard, dan objek puzzle inti dipertahankan.
- `ELEMENTAL_MAP_VERSION=29`, `ELEMENTAL_CAMPAIGN_VERSION=2`; `jumpSpeed=560`, `gravity=1500`. Firebase Rules tidak berubah.
- `npm test`: **199/199 tes lulus**; seluruh JavaScript lolos `node --check`; Firebase Rules JSON valid.
- Tes otomatis memeriksa 50 blueprint, 3–8 platform per level, jangkauan dari spawn ke switch/permata/kontrol/pintu, sisi elemen, dukungan objek, ID katup/tuas/hazard, dan transisi kampanye.
- Playtest langsung di browser dan dua perangkat dengan Firebase aktif masih diperlukan; tes geometri tidak menggantikan uji rasa permainan.

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


## v0.46.0 — Player Lobby & Result Recap Cards
- Menambahkan lobi pemain khusus Love Match, Color Match, dan IQ Duel dengan identitas host/guest, status koneksi Firebase Presence, status Ready, serta Start host setelah keduanya online dan siap.
- Memperketat `setReady`, `startSelectedGame`, dan Firebase Rules agar Ready/Start mini-game memerlukan kedua perangkat terhubung.
- Love Match kini langsung menyajikan satu rekap akhir setelah kedua jawaban lengkap; menghapus reveal slide per pertanyaan.
- Color Match mengakumulasi hasil lima ronde dan menampilkan satu rekap kartu; ronde berikutnya dimulai otomatis. Skor rata-rata remote dihitung sebagai total skor dibagi jumlah ronde.
- IQ Duel tetap memakai satu halaman rekap final, dengan kartu skor dan daftar review soal.
- Firebase Rules perlu dipublikasikan ulang untuk fase `scoring` Color Match serta presence gate lobi.
- Automated tests: 214/214 passed; live browser/two-device Firebase playtest remains outstanding.


## v0.47.0 — Arcade · 12 Mini Games dalam Satu Arena
- Menambahkan Arcade sebagai mini-game baru ke katalog aktivitas dan menu utama; Elemental Duo tetap diarsipkan dan tidak dihapus dari source.
- Arcade memiliki 12 ronde singkat: Flappy Face, Heart Catcher, Neon Dodge, Noodle Runner, Coin Rush, Bubble Pop, Sky Hop, Laser Lanes, Rocket Flight, Meteor Dodge, Rhythm Tap, dan Final Sprint.
- Mendukung foto kamera/galeri yang dikompres menjadi JPEG 128×128 dan dibatasi maksimal 22 KB, atau memilih karakter emoji. Foto karakter disimpan pada node sesi Arcade di Firebase Realtime Database.
- Menggunakan lobby bersama, kode undangan, presence online, Ready kedua pemain, serta Insert Coin oleh host. Setelah masuk sesi terdapat pemilihan karakter dan konfirmasi siap sebelum permainan dimulai.
- Arena Canvas bersama menampilkan dua karakter berkepala foto/emoji dengan kaki noodle, skor, tiga nyawa, objek bonus, hazard, hitung mundur, dan progres 12 ronde.
- Menambahkan kontrol sentuh/keyboard kiri, kanan, naik/lompat, turun, dan aksi; Bubble Pop kini dapat bergerak vertikal, Rocket Flight bisa naik/turun, dan Rhythm Tap memakai tombol aksi.
- Setelah 12 ronde, hasil dirangkum dalam satu kartu skor akhir dengan pemenang/seri dan rincian skor tiap mini-game.
- Firebase Rules menambahkan allowlist Arcade, syarat presence untuk Ready/Start, akses node Arcade berdasarkan membership dan sessionId, serta validasi role untuk profil dan skor pemain. Firebase Rules harus dipublikasikan ulang dari build ini.
- Perbaikan tambahan: timer dibatasi maksimal durasi ronde saat countdown belum dimulai; HUD menampilkan sisa nyawa setiap pemain.
- `npm test`: **231/231 lulus**. Pemeriksaan sintaks seluruh JavaScript, parsing JSON Firebase Rules, dan keseimbangan tanda kurung ekspresi Rules lulus. Playtest browser serta dua perangkat dengan Firebase aktif belum dilakukan.


## v0.48.0 — Expanded Brain Banks & Flappy Face
- Love Match bank ditambah menjadi 80 pertanyaan (20 per dimensi); tiap sesi memilih 32 soal secara acak dan seimbang. Rekap menampilkan deskripsi lengkap seluruh 16 profil tipe, jawaban kedua pemain, ringkasan kecocokan, dan ekspor JSON/CSV.
- IQ Duel bank ditambah menjadi 100 soal dengan lima kategori seimbang; tiap sesi memilih 12 atau 20 soal. Kartu akhir kini memuat ringkasan per kategori, pilihan jawaban kedua pemain, kunci jawaban, dan pembahasan.
- Color Match memperbaiki penulisan target/tebakan RGB pada Firebase Rules agar tidak lagi dipaksa memakai bentuk data Guess Partner; target warna diacak dan dijaga agar tidak terlalu mirip dalam satu sesi. Alur mulai host memeriksa pengaturan terbaru dan kedua peserta.
- Arcade dirombak menjadi satu permainan Flappy Face selama 60 detik. Kontrol hanya tap/klik atau tombol LOMPAT (desktop: Space/↑/W), gravitasi, pipa berpasangan, tiga nyawa, skor gerbang, dan satu kartu rekap; 11 mini-game tambahan dan kontrol arah/aksi dihapus.
- Firebase Rules memperketat validasi `gatesPassed`, transisi hasil Flappy setelah 60 detik atau kedua pemain kehabisan nyawa, serta memastikan host dan guest online saat host memulai.
- Cache import mini-game diperbarui ke v0.48.0; tidak ada dependensi npm baru.
- Tes otomatis, pemeriksaan sintaks JS, parsing Rules JSON, dan keseimbangan ekspresi Rules dijalankan; live playtest dua perangkat dengan Firebase aktif masih diperlukan.
