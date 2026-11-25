# Elemental Duo — Panduan Game (build v0.30.0)

**Elemental Duo** adalah platform-puzzle kooperatif untuk dua pemain. Pola permainan menekankan kerja sama dua karakter elemen: melewati jalur platform, menghindari bahaya yang berlawanan, mengumpulkan permata milik karakter sendiri, mengaktifkan pijakan, lalu mencapai pintu masing-masing.

## Peta eksplorasi multi-arah — v0.30.0

Tidak semua level berakhir di ujung kanan. Setiap arena memakai ruang 1440×960 dan jaringan platform bertingkat yang mendorong gerak horizontal serta vertikal.

- **Jalur utama:** 13 platform stabil untuk memastikan pemain selalu punya rute dasar.
- **Jalur samping:** 5 platform cabang di atas atau di sisi rute utama untuk memancing eksplorasi dan pencarian permata.
- **Jembatan pintas:** 4 platform yang menghubungkan titik non-berurutan dan membentuk loop/shortcut.
- **Lantai terputus:** empat pulau lantai membuat pemain harus melompat dan memilih jalur, bukan sekadar berjalan lurus.
- **Pintu terpisah:** pintu Bara dan Air berada pada node berbeda; koordinatnya bervariasi di sisi kiri, tengah, kanan, dan lantai atas.
- **Peta mini:** menunjukkan platform, shortcut, hazard, sakelar, permata, pintu, dua pemain, dan area kamera yang sedang terlihat.
- **Penunjuk arah:** indikator di tepi viewport memberi arah menuju pintu karakter lokal saat pintu belum terlihat.

Lima bentuk ruang adalah Jalur Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, dan Lingkaran Kuno. Pola dipakai berulang untuk 50 level, tetapi koordinat pintu, switch, gem, hazard, dan platform tetap dipetakan menurut level serta mekanik dunia masing-masing.

`ELEMENTAL_MAP_VERSION` dinaikkan ke 3. Saat build baru dibuka, koordinat pemain dari layout lama dipindahkan ke spawn yang valid; progres jumlah jatuh dan serpihan tetap dibawa, sedangkan status selesai lama dibersihkan agar pemain tidak terkunci.

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
| Interaksi alternatif | E atau Enter | Tombol AKSI |
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

Catatan historis v0.25.0: pada build pertama Dunia 1, level 11–50 masih memakai generator lama. Status terkini telah berubah; seluruh level 01–50 kini mempunyai blueprint khusus hingga Dunia 5 pada v0.29.0; v0.30.0 menambahkan peta eksplorasi multi-arah.

Lihat `ELEMENTAL-WORLD-1.md` untuk tabel level dan `REVIEW-BUILD-QA.md` untuk checklist pengujian.


## Implementasi Dunia 2 — v0.26.0

Kedalaman Kristal level 11–20 telah menerima blueprint khusus. Mekanik aktif mencakup permukaan es yang mengurangi gesekan, zona arus yang memberi dorongan, arus berdenyut/berbalik arah, lift vertikal, jembatan kristal berkala, dan hazard aktif/nonaktif. Semua fase mekanik memakai jam Firebase bersama dari `/.info/serverTimeOffset`. Hazard yang padam diabaikan oleh renderer dan collision. Tiap pressure plate tetap ditempatkan sebelum gerbang dan tidak bergantung pada platform timed atau lift vertikal. Lihat `ELEMENTAL-WORLD-2.md` untuk blueprint 10 level.

Catatan historis v0.26.0: pada saat Dunia 2 diterbitkan, level 21–50 belum mendapat blueprint khusus. Implementasi terbaru kini mencakup seluruh level 01–50 pada v0.29.0; v0.30.0 menambahkan peta eksplorasi multi-arah.


## Implementasi Dunia 3 — v0.27.0

Kerajaan Bara level 21–30 telah menerima blueprint khusus. Mekanik aktif mencakup lava berdenyut/bergerak, semburan uap yang berbahaya bagi kedua pemain, katup interaktif yang mematikan hazard terkait, syarat katup untuk gerbang, dan urutan pijakan Nira lalu Bara pada level 26 serta 30. Katup dan urutan disimpan di bawah `levels/{level}` pada node Elemental Duo yang sama. Fase lava, uap, dan platform memakai jam level bersama. Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-3.md` untuk blueprint rinci.


## Implementasi Dunia 4 — v0.28.0

Reruntuhan Langit (level 31–40) memiliki zona angin dengan gaya horizontal/vertikal, updraft, crosswind, fase hembusan berdenyut, dan pembalikan arah berkala. Tuas angin dapat diaktifkan melalui tombol AKSI saat pemain berada di dekatnya; tuas elemen hanya dapat diaktifkan oleh karakter yang sesuai. Aktivasi tuas disinkronkan melalui Firebase dan dapat menjadi syarat pembukaan gerbang. Platform `cloud` menggunakan collision platform normal dan dapat bergerak seperti platform lainnya. Lihat `ELEMENTAL-WORLD-4.md` untuk rincian setiap level.


## Implementasi Dunia 5 — v0.29.0

Jantung Kuno (level 41–50) kini memakai 10 blueprint khusus. Dunia final menyatukan mekanik elemen dari Hutan Berbisik, Kedalaman Kristal, Kerajaan Bara, dan Reruntuhan Langit: permukaan es, arus berbalik, angin, lava, air, uap, platform bergerak, katup dan tuas khusus elemen.

Level 42, 46, 49, dan 50 memiliki katup wajib; level 43, 48, 49, dan 50 memiliki tuas angin wajib. Level 44, 49, dan 50 meminta Nira mengaktifkan pijakan lebih dahulu, lalu Bara. Level 50, Penyatuan Elemen, menggabungkan seluruh mekanik dan menjadi final petualangan.

Semua state interaksi disimpan di bawah `levels/{level}` dan memakai jam level bersama Firebase untuk fase hazard/platform/arus/angin. Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-5.md` dan checklist bagian K di `REVIEW-BUILD-QA.md`.
