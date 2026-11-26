# Elemental Duo — Panduan Game (build v0.39.1)

## Pembaruan v0.39.1 — layout dan lompatan
- Lima level prototype sekarang memakai lima tata letak ruang berbeda, satu untuk setiap tema. Sepuluh layout tersusun dalam jalur dua sisi yang naik ke galeri atas.
- Platform tidak lagi rapat dengan selisih 24 unit; ruang antartingkat kini sekitar 80–95 unit.
- Lompatan memakai `ELEMENTAL_JUMP_SPEED=560` dan `ELEMENTAL_GRAVITY=1500`, dengan puncak sekitar 104,5 unit.
- Tebal visual platform menjadi 22 unit, tetapi collision fisik tetap 8 unit.
- `ELEMENTAL_MAP_VERSION=16` dan `prototypeVersion=2` memulai ulang posisi serta state puzzle lama agar sesuai geometri baru. Statistik pemain dan keanggotaan room dipertahankan.

## Prinsip gameplay puzzle klasik
Elemental Duo menggunakan ruang puzzle dua karakter yang dirancang untuk kolaborasi. Bara melewati jalur lava tetapi menghindari air; Nira melewati air tetapi menghindari lava; keduanya menghindari rawa beracun. Setiap pemain mencari permata elemennya, mengaktifkan pijakan/sakelar, membantu membuka rute, dan mencapai pintu yang sesuai warna karakter.

Riset gameplay Fireboy and Watergirl menunjukkan prinsip utama berupa jalur aman berbeda untuk setiap karakter, permata merah/biru, dua pintu tujuan, tuas yang mengubah lift/gerbang, tombol yang perlu ditahan, serta kotak yang dapat dipakai sebagai pijakan. v0.38.0 mengadaptasi tata ruang, hazard elemen, permata, pijakan/gerbang, dan pintu pasangan dengan geometri dan aset orisinal Diri Playroom. Mekanik kotak dorong dan tombol tahan lama belum termasuk pada revisi ini.

## Peta ruang v0.38.0
- 10 pola ruang dasar diterapkan pada 50 level dengan variasi pintu, platform khusus, hazard, katup, dan tuas sesuai dunia.
- Dua jalur elemen dimulai dari sisi bawah kiri/kanan; keduanya bertemu di platform tengah, lalu bercabang ke galeri atas atau pintu sisi.
- Pijakan Bara dan Nira serta permata ditempatkan pada platform terpisah; jembatan tengah menjadi area penghubung dan checkpoint dipilih dari platform stabil yang aman.
- Pintu dapat berada di sisi bawah, galeri atas, atau platform tengah. Tujuan bukan selalu di ujung kanan.
- Tier utama pada y `[522, 498, 474, 450, 426, 402]`; perbedaan 24 unit agar lompatan tetap terkendali.

## Fisika dan kontrol v0.38.0
- `ELEMENTAL_JUMP_SPEED = 280`, `ELEMENTAL_GRAVITY = 1300`; tinggi lompatan teoretis sekitar 30,2 unit.
- Jump buffer 170 ms dan coyote time 140 ms membantu input lompat lebih konsisten.
- Analog virtual hanya mengatur kiri/kanan. Gerakan jari ke atas/bawah di analog tidak memicu lompat; LOMPAT/Space adalah tombol terpisah.
- Tombol INTERAKSI hanya muncul dekat objek yang dapat diaktifkan; pijakan biasa aktif otomatis saat diinjak.
- Tampilan landscape/fullscreen dipertahankan dari build yang disukai.
- `ELEMENTAL_MAP_VERSION = 14`; posisi pemain pada level aktif kembali ke spawn saat migrasi, sedangkan progres level, serpihan, dan statistik jatuh dipertahankan.

## Verifikasi v0.38.0
- `npm test`: 191/191 tes lulus.
- Seluruh file JavaScript lolos `node --check`; Firebase Rules JSON valid dan tidak berubah.
- Geometri, jalur platform, checkpoint, variasi pintu, dan input analog/lompat diperiksa otomatis untuk seluruh 50 level.
- Tes otomatis tidak menggantikan playtest dua HP dengan Firebase aktif.

---

# Elemental Duo — Panduan Game (build v0.33.0)

**Elemental Duo** adalah platform-puzzle kooperatif untuk dua pemain. Pola permainan menekankan kerja sama dua karakter elemen: melewati jalur platform, menghindari bahaya yang berlawanan, mengumpulkan permata milik karakter sendiri, mengaktifkan pijakan, lalu mencapai pintu masing-masing.

## Peta eksplorasi multi-arah — v0.33.0

Tidak semua level berakhir di ujung kanan. Setiap arena memakai ruang 1440×960 dan jaringan platform bertingkat yang mendorong gerak horizontal serta vertikal.

- **Jalur utama:** 13 platform stabil untuk memastikan pemain selalu punya rute dasar.
- **Jalur samping:** 5 platform cabang di atas atau di sisi rute utama untuk memancing eksplorasi dan pencarian permata.
- **Jembatan pintas:** 4 platform yang menghubungkan titik non-berurutan dan membentuk loop/shortcut.
- **Lantai terputus:** empat pulau lantai membuat pemain harus melompat dan memilih jalur, bukan sekadar berjalan lurus.
- **Pintu terpisah:** pintu Bara dan Air berada pada node berbeda; koordinatnya bervariasi di sisi kiri, tengah, kanan, dan lantai atas.
- **Peta mini:** menunjukkan platform, shortcut, hazard, sakelar, permata, pintu, dua pemain, dan area kamera yang sedang terlihat.
- **Penunjuk arah:** indikator di tepi viewport memberi arah menuju pintu karakter lokal saat pintu belum terlihat.

Lima bentuk ruang adalah Jalur Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, dan Lingkaran Kuno. Pola dipakai berulang untuk 50 level, tetapi koordinat pintu, switch, gem, hazard, dan platform tetap dipetakan menurut level serta mekanik dunia masing-masing.

`ELEMENTAL_MAP_VERSION` saat ini adalah 6. Saat build baru dibuka, koordinat pemain dari layout lama dipindahkan ke spawn yang valid; progres jumlah jatuh dan serpihan tetap dibawa, sedangkan status selesai lama dibersihkan agar pemain tidak terkunci.


## Kontrol dan tampilan mobile — v0.33.0
- Mode Potret mempertahankan tata letak vertikal dan tombol arah seperti sebelumnya.
- Mode Layar Penuh meminta fullscreen dan orientasi landscape; bila browser menolak Fullscreen API, panel dipindahkan sementara ke `document.body` sebagai fallback aplikasi.
- Landscape memakai kontrol analog virtual transparan di kiri bawah, dengan tombol INTERAKSI/LOMPAT di kanan bawah. Tombol pada HUD dapat mengganti Analog ↔ Tombol; analog juga dapat dipilih pada Mode Potret.
- Mode fullscreen native memakai viewport dinamis `100dvh`; fallback memakai `100svh` agar perubahan address bar tidak terus mengubah ukuran arena. Listener `visualViewport.resize` tidak digunakan agar browser chrome tidak memicu canvas berkedip/loncat.
- Build mapVersion 9 memindahkan posisi aktif ke spawn baru, sambil mempertahankan progres level, shards, dan jumlah jatuh.

## Karakter dan aturan elemen

- **Bara** dimainkan oleh host/pembuat sesi. Bara aman melewati lava/api, tetapi akan jatuh jika menyentuh air. Bara mengumpulkan permata bara dan mengaktifkan pijakan Bara.
- **Nira** dimainkan oleh guest/pemain yang bergabung. Nira aman melewati air, tetapi akan jatuh jika menyentuh lava/api. Nira mengumpulkan permata air dan mengaktifkan pijakan Air.
- Permata karakter lain tidak dapat dikumpulkan. Permata bersifat opsional untuk meningkatkan penilaian bintang.
- Menyentuh bahaya yang tidak sesuai akan mengembalikan karakter ke titik aman dan menambah jumlah jatuh.

## Tujuan setiap level

1. Jelajahi arena platform dan gunakan tombol kiri/kanan serta lompat untuk berpindah antarpijakan.
2. Hindari bahaya yang tidak cocok dengan elemen karakter. Bara boleh melewati lava tetapi tidak air; Nira boleh melewati air tetapi tidak lava.
3. Kumpulkan permata sesuai elemen masing-masing untuk memperoleh bintang tambahan.
4. Injak pijakan Bara dan pijakan Air. Kedua pijakan harus aktif agar penghalang bersama terbuka. Pijakan tetap aktif setelah diinjak.
5. Setelah penghalang terbuka, Bara masuk ke pintu Bara dan Nira masuk ke pintu Air.
6. Pemain yang lebih dahulu mencapai pintunya akan menunggu pasangannya. Level berikutnya terbuka otomatis setelah keduanya tiba.

## Struktur petualangan

| Dunia | Level | Tema |
|---|---:|---|
| Hutan Berbisik | 1–10 | Hutan dan tanaman lentur |
| Kedalaman Kristal | 11–20 | Gua kristal dan lantai licin |
| Kerajaan Bara | 21–30 | Tungku, arang, dan panas berdenyut |
| Reruntuhan Langit | 31–40 | Pulau melayang dan arus angin |
| Jantung Kuno | 41–50 | Ujian gabungan seluruh kemampuan |

Setiap level memiliki konfigurasi platform, bahaya elemen, pijakan, permata, titik aman, penghalang, dan sepasang pintu. Satu engine menangani seluruh level agar mudah dirawat.

## Kontrol

| Aksi | Desktop | HP/tablet |
|---|---|---|
| Bergerak kiri | A atau ← | Tombol ← |
| Bergerak kanan | D atau → | Tombol → |
| Melompat | Space atau W/↑ | Tombol LOMPAT |
| Interaksi alternatif | E atau Enter | Tombol INTERAKSI |
| Perbesar arena | Tombol layar penuh | Tombol ⛶ |

Pada HP, arena menggunakan kamera yang mengikuti area pemain dan memperbesar bagian level yang relevan. Putar perangkat ke mode landscape untuk area pandang yang lebih lebar. Tombol arah dan lompat dibuat lebih besar untuk layar sentuh.

## Penilaian

- **3 bintang:** dua permata terkumpul dan kedua pemain menyelesaikan level tanpa jatuh.
- **2 bintang:** jumlah jatuh gabungan pada level tidak lebih dari dua.
- **1 bintang:** level selesai dengan jumlah jatuh yang lebih banyak.

Hasil bintang dan permata direkap setelah menyelesaikan level 50.

## Sinkronisasi dan batasan

Game menyimpan status pemain, posisi, kesiapan, status pijakan, permata, dan hasil level pada Firebase Realtime Database di `roomGames/{kode}/{sessionId}/elementalDuo`. Data berada pada node khusus dan hanya dapat dibaca/ditulis oleh anggota ruang ketika sesi aktif bertipe `elementalduo`.

- Tidak menggunakan Cloud Storage, Cloud Functions, server khusus, atau TURN berbayar.
- Firebase Rules tidak berubah pada revisi v0.24.1; Rules v0.22 yang sudah dipasang tetap berlaku.
- Gerak pemain dikirim berkala melalui RTDB; kualitas gerak jarak jauh dipengaruhi koneksi masing-masing perangkat.
- Status tiba pemain dikirim melalui antrean tulis agar pembaruan selesai tidak terlewat ketika sinkronisasi posisi masih berlangsung. Kunci transisi yang tertinggal juga memiliki pemulihan otomatis.
- Progres permainan mengikuti sesi aktif. Ketika host mengakhiri sesi dan kembali ke lobi, data game sesi tersebut dibersihkan sesuai mekanisme proyek.
- Belum ada uji end-to-end pada Firebase aktif dengan dua perangkat pengguna; gunakan checklist terbaru di `REVIEW-BUILD-QA.md`.


## HUD v0.24.2
Teks objektif dan notifikasi tidak ditampilkan di atas kanvas permainan. Objektif dibaca melalui HUD pijakan/status pemain dan deskripsi level; pesan sementara muncul di strip status di luar arena. Firebase Rules tidak berubah.


## Mode tampilan mobile v0.24.4
- **Potret:** mode halaman biasa dengan arena lebih tinggi dan kontrol sentuh besar.
- **Layar penuh:** meminta fullscreen serta penguncian orientasi landscape. Bila browser tidak mendukung orientation lock, pemain diminta memutar perangkat secara manual. Kontrol sentuh mengambang pada kedua sudut bawah agar arena lebih tinggi.
- Kamera mengikuti karakter lokal pada masing-masing perangkat. Jika kedua roh berdekatan, framing memberi sedikit ruang untuk melihat pasangan; jika berjauhan, fokus tetap pada karakter yang dikendalikan.


## Implementasi Dunia 1 — v0.25.0

Hutan Berbisik level 01–10 telah diganti dari layout generik menjadi 10 blueprint khusus. Setiap blueprint menyimpan nama, tujuan, tingkat kesulitan, fitur, platform, bahaya, pijakan, permata, dan checkpoint.

- Level 01–03: Mudah — kontrol dasar, perbedaan bahaya elemen, dan permata.
- Level 04–06: Normal — rute terpisah, pijakan tinggi, dan jamur pantul.
- Level 07–10: Menengah — menara vertikal, platform bergerak/berkala, jembatan bergerak, dan ujian gabungan.
- Platform bergerak dan bahaya bergerak dihitung dari waktu mulai level yang disejajarkan dengan offset waktu Firebase (`/.info/serverTimeOffset`), sehingga kedua perangkat memakai fase yang sama meskipun jam HP berbeda. Platform berkala punya periode aktif dan jeda.
- Karakter yang mendarat di platform bergerak ikut terbawa sesuai perubahan posisi platform.
- Pijakan otomatis mendeteksi karakter ketika berdiri di lantai maupun platform. Pijakan tidak diletakkan di balik gerbang atau pada zona bahaya yang mematikan karakter pemiliknya.
- Permukaan jamur (`kind: bounce`) memberikan impuls pantulan saat karakter mendarat.

Catatan historis v0.25.0: pada build pertama Dunia 1, level 11–50 masih memakai generator lama. Status terkini telah berubah; seluruh level 01–50 kini mempunyai blueprint khusus hingga Dunia 5 pada v0.29.0; v0.31.0 menambahkan peta eksplorasi multi-arah.

Lihat `ELEMENTAL-WORLD-1.md` untuk tabel level dan `REVIEW-BUILD-QA.md` untuk checklist pengujian.


## Implementasi Dunia 2 — v0.26.0

Kedalaman Kristal level 11–20 telah menerima blueprint khusus. Mekanik aktif mencakup permukaan es yang mengurangi gesekan, zona arus yang memberi dorongan, arus berdenyut/berbalik arah, lift vertikal, jembatan kristal berkala, dan hazard aktif/nonaktif. Semua fase mekanik memakai jam Firebase bersama dari `/.info/serverTimeOffset`. Hazard yang padam diabaikan oleh renderer dan collision. Tiap pressure plate tetap ditempatkan sebelum gerbang dan tidak bergantung pada platform timed atau lift vertikal. Lihat `ELEMENTAL-WORLD-2.md` untuk blueprint 10 level.

Catatan historis v0.26.0: pada saat Dunia 2 diterbitkan, level 21–50 belum mendapat blueprint khusus. Implementasi terbaru kini mencakup seluruh level 01–50 pada v0.29.0; v0.31.0 menambahkan peta eksplorasi multi-arah.


## Implementasi Dunia 3 — v0.27.0

Kerajaan Bara level 21–30 telah menerima blueprint khusus. Mekanik aktif mencakup lava berdenyut/bergerak, semburan uap yang berbahaya bagi kedua pemain, katup interaktif yang mematikan hazard terkait, syarat katup untuk gerbang, dan urutan pijakan Nira lalu Bara pada level 26 serta 30. Katup dan urutan disimpan di bawah `levels/{level}` pada node Elemental Duo yang sama. Fase lava, uap, dan platform memakai jam level bersama. Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-3.md` untuk blueprint rinci.


## Implementasi Dunia 4 — v0.28.0

Reruntuhan Langit (level 31–40) memiliki zona angin dengan gaya horizontal/vertikal, updraft, crosswind, fase hembusan berdenyut, dan pembalikan arah berkala. Tuas angin dapat diaktifkan melalui tombol INTERAKSI saat pemain berada di dekatnya; tuas elemen hanya dapat diaktifkan oleh karakter yang sesuai. Aktivasi tuas disinkronkan melalui Firebase dan dapat menjadi syarat pembukaan gerbang. Platform `cloud` menggunakan collision platform normal dan dapat bergerak seperti platform lainnya. Lihat `ELEMENTAL-WORLD-4.md` untuk rincian setiap level.


## Implementasi Dunia 5 — v0.29.0

Jantung Kuno (level 41–50) kini memakai 10 blueprint khusus. Dunia final menyatukan mekanik elemen dari Hutan Berbisik, Kedalaman Kristal, Kerajaan Bara, dan Reruntuhan Langit: permukaan es, arus berbalik, angin, lava, air, uap, platform bergerak, katup dan tuas khusus elemen.

Level 42, 46, 49, dan 50 memiliki katup wajib; level 43, 48, 49, dan 50 memiliki tuas angin wajib. Level 44, 49, dan 50 meminta Nira mengaktifkan pijakan lebih dahulu, lalu Bara. Level 50, Penyatuan Elemen, menggabungkan seluruh mekanik dan menjadi final petualangan.

Semua state interaksi disimpan di bawah `levels/{level}` dan memakai jam level bersama Firebase untuk fase hazard/platform/arus/angin. Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-5.md` dan checklist bagian K di `REVIEW-BUILD-QA.md`.


## Perbaikan mobile v0.33.0

- Potret mengisi viewport HP dan mengatur ulang header, HUD, arena, serta kontrol agar tidak terpotong horizontal.
- Layar Penuh memakai arena penuh sebagai latar; analog di kiri, LOMPAT di kanan, dan INTERAKSI hanya tampil dekat katup/tuas. Pijakan elemen aktif otomatis.
- Fisika lebih toleran: gravity 1100, jump speed 690, jump buffer 170 ms, coyote time 140 ms. Platform utama diperlebar menjadi 128 px.
- Tingkat kesulitan diturunkan dan diatur ulang pada seluruh dunia; Dunia 1 adalah tutorial mudah dan tidak ada level Expert.
- MapVersion 9 memindahkan posisi pada level aktif ke spawn saat pembaruan, tanpa menghapus progres, serpihan, atau statistik jatuh.


# Prototype v0.39.1 — lima dunia, lima level aktif

Build ini sengaja membatasi jalur permainan menjadi lima level percontohan. Urutannya memakai blueprint level pertama dari setiap dunia, bukan lima level pertama dari Dunia 1:

| Level aktif | Dunia / tema | Nama blueprint | Fokus tema |
|---:|---|---|---|
| 01 | Hutan Berbisik | Jejak Cahaya | Hutan, akar, lumut, jalur dasar dua elemen |
| 02 | Kedalaman Kristal | Retakan Pertama | Gua kristal, es dan arus |
| 03 | Kerajaan Bara | Napas Lava | Lava dan panas tungku |
| 04 | Reruntuhan Langit | Tangga Awan | Angin dan area vertikal |
| 05 | Jantung Kuno | Simpul Pertama | Kombinasi mekanik lima dunia |

45 blueprint yang lain tetap tersedia dalam `ELEMENTAL_LEVELS` sebagai materi ekspansi, tetapi engine permainan prototype memakai `ELEMENTAL_PROTOTYPE_LEVELS` dan berhenti setelah level 05. Hasil maksimal prototype adalah 15 bintang dan 10 permata.

## Visual klasik
- Dinding arena memakai pola bata gelap berulang dengan palet khusus setiap dunia.
- Batu platform dan lantai mendapat gradasi, sambungan balok, lumut, dan retakan.
- Hutan memakai akar dan tanaman rambat; dunia kristal mendapat serpihan dingin; Kerajaan Bara memakai aksen bara; Reruntuhan Langit memakai aksen angin/awan; Jantung Kuno memakai rune dan relief.
- Permata berbentuk berlian bersegi; portal keluar berupa pintu batu persegi dengan simbol Bara/Nira.
- Karakter mendapat siluet kepala, badan, tangan, kaki, wajah, dan animasi langkah sederhana.

`ELEMENTAL_MAP_VERSION=16` memaksa posisi pemain dari peta lama kembali ke spawn. `prototypeVersion=2` pada metadata sesi memulai ulang sesi lama ke level 1 dan membersihkan state puzzle per-level yang dibuat dengan urutan sebelumnya. Firebase Rules tidak berubah.
