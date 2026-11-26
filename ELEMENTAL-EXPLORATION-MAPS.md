# Elemental Duo — Classic Temple Prototype (v0.39.0)

## Prototype 5 level lintas tema

Level aktif 01–05 masing-masing memakai satu blueprint pembuka dari lima dunia. Lima level ini ditujukan sebagai sampel kualitas visual dan mekanik sebelum pengembangan 45 blueprint lainnya diteruskan.

## Tata letak ruang puzzle yang terarah
Peta dirancang sebagai ruang puzzle layar-tetap, bukan maze acak atau koridor satu arah. Setiap pola mempertahankan tata bahasa yang mudah dibaca: dua jalur elemen dari area bawah, pijakan dan permata berbeda, area pertemuan di tengah, lalu jalur atas atau sisi menuju dua pintu karakter.

- **Jalur Bara dan Nira:** Bara dan Nira memulai dari sisi berbeda dan melewati hazard yang aman untuk elemennya sendiri.
- **Pijakan dan gerbang:** dua pijakan karakter mengaktifkan penghalang bersama. Katup/tuas tambahan hanya menjadi syarat pada level yang memang memperkenalkannya.
- **Permata:** permata merah dan biru berada pada jalur karakter masing-masing. Mengambil permata mendorong eksplorasi, tetapi tidak membuat pintu mustahil dicapai bila tertinggal.
- **Rute bertingkat:** tier utama berada pada y `[522, 498, 474, 450, 426, 402]`, selisih 24 unit.
- **Pintu keluar:** dapat berada di sisi kiri/kanan, galeri atas, atau ruang tengah; pemain tetap harus mencapai pintu elemen sendiri.
- **Platform khusus:** platform bergerak/berkala dialokasikan ke slot samping yang tidak dipakai spawn, pintu, pijakan, permata, atau kontrol wajib.

10 pola ruang dasar digunakan sebagai kerangka bagi 50 level. Variasi tantangan berasal dari hazard dan perangkat dunia: es/arus, lava/uap/katup, angin/tuas, dan kombinasi dunia final. Prinsip puzzle diadaptasi dari Fireboy and Watergirl, tetapi aset, bentuk, posisi, dan desain level tetap orisinal.

## Fisika peta v0.38.0
- `jumpSpeed = 280`, `gravity = 1300`, tinggi puncak teoretis sekitar 30,2 unit.
- Jarak vertikal tier utama 24 unit. Celah horizontal platform diperiksa menggunakan waktu lintasan dan kecepatan gerak.
- Collision platform setinggi 8 unit; renderer menampilkan tinggi visual 16 unit.
- Pijakan, pintu, permata, kontrol, dan checkpoint ditempatkan pada platform stabil; checkpoint menghindari hazard.
- Moving/timed platform tetap deterministik dari jam Firebase bersama.

## Kontrol v0.38.0
Analog hanya mengatur gerakan kiri/kanan. Sumbu vertikal analog diabaikan dan tidak mengantrekan lompatan. Tombol LOMPAT/Space tetap terpisah. Tampilan landscape/fullscreen tidak dirombak.

---

---

# Elemental Duo — Adventure Map Design (v0.33.0)

## Sasaran desain
Mengubah pengalaman dari koridor kiri-ke-kanan menjadi platform-puzzle eksplorasi dua dimensi, dengan pemain harus naik, turun, berbalik, memilih cabang, dan menemukan pintu Bara/Nira yang tersebar pada arena.

## Ukuran dan struktur
- World size: 1440 × 960.
- Floor height: y=900 dengan empat bagian lantai terpisah.
- Spawn: dua pemain muncul pada pulau lantai barat.
- Setiap level: 13 platform rute utama, 5 platform cabang, 4 shortcut/loop, serta platform mekanik khusus (moving, timed, bounce) dari blueprint dunia.
- Semua 50 level memakai data layout dengan world mechanics masing-masing; layout dasar berulang dalam lima arketipe ruang.

## Lima arketipe
1. **Jalur Zigzag:** bergerak dari lantai bawah ke pulau kanan atas lalu kembali ke sisi kiri.
2. **Menara Kembar:** jalur naik-turun membentuk dua menara dan jembatan lintas.
3. **Jalur Berbalik:** jalur maju menuju area kanan, lalu berputar untuk menemukan rute dan pintu sisi kiri.
4. **Persimpangan Awan:** beberapa persimpangan horizontal dan vertikal dengan pintu di tingkat berbeda.
5. **Lingkaran Kuno:** jalur mengitari ruang dan kembali ke platform tengah/atas.

## Bantuan navigasi
- Peta mini menampilkan floor segments, platform utama, cabang, shortcut, gate, hazard aktif, switch, gem, pintu, kedua pemain, dan viewport kamera.
- Pemain lokal mendapat panah tepi layar menuju pintu elemennya saat pintu berada di luar kamera.
- Kamera per perangkat tetap memprioritaskan pemain lokal dengan bias kecil ke arah pasangan.

## Prinsip puzzle
- Kedua switch wajib harus dapat dicapai sebelum gate vertikal tertutup; level dengan gate vertikal menempatkan switch pada sisi yang sama.
- Gate horizontal memiliki rute bypass di tingkat/ujung yang dapat dijangkau sebelum dua switch aktif.
- Pintu Bara/Air diletakkan pada platform stabil dengan `platformId` agar penyelesaian tiap pemain jelas.
- Permata dapat berada pada jalur utama atau cabang samping untuk mendorong eksplorasi opsional.
- Hazard dan mekanik khas tiap dunia tetap dipertahankan.

## Migrasi
`ELEMENTAL_MAP_VERSION=6`. Posisi dari map lama tidak dipakai ulang karena geometri berubah; pemain ditempatkan kembali pada spawn level berjalan. Death count, level death count, jumlah serpihan, dan readiness dipertahankan; status `complete` lama dibersihkan agar tidak mengunci gerakan di map baru.

## Batas verifikasi
188 tes otomatis mencakup struktur map, posisi pintu, jalur geometri dari dua spawn ke semua platform, gate vertikal dan minimap. Tes otomatis tidak menggantikan playtest dua HP dengan Firebase aktif maupun pemeriksaan visual fisik di berbagai ukuran layar.

## Kerapian geometri peta — v0.33.0
- Lima arketipe disetel ulang pada koordinat vertikal agar lintasan zigzag/loop tidak menghasilkan dua platform yang hampir menempel.
- Penempatan cabang dan shortcut menilai jarak terhadap platform yang sudah dibuat, bukan hanya menghindari rectangle overlap.
- Seluruh pasangan platform pada 50 level diuji dengan clearance minimum 18 unit; tes geometri tetap memeriksa batas dunia dan reachability dari kedua spawn.
- `ELEMENTAL_MAP_VERSION=6`; posisi dari mapVersion sebelumnya dipindahkan ke spawn saat level aktif dimuat.


## Keseimbangan dan mobile v0.33.0
- Main path platforms diperlebar menjadi 128 px.
- Jump speed 690 dan gravity 1100; jump buffer 170 ms dan coyote time 140 ms menambah toleransi kontrol sentuh.
- Kurva kesulitan: Dunia 1 mudah hingga level 8; Dunia 2 maksimal Menengah; Dunia 3 maksimal Menengah; Dunia 4 dan 5 meningkat bertahap hingga Sulit. Tidak ada label Expert.
- Pola Menara Kembar diperbaiki untuk menghilangkan tumpang tindih platform utama.


## Visual v0.39.0
Renderer menggambar latar batu bata gelap, sambungan batu, aksen lumut, tanaman rambat, relief kuil, dan partikel. Warna dasar tiap tema dibedakan namun seluruh level mempertahankan bahasa visual dungeon klasik. Platform batu, hazard air/lava, permata, pintu dan karakter menggunakan gambar Canvas prosedural sehingga tidak memerlukan aset eksternal tambahan.
