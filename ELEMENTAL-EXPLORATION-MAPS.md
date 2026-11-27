# Elemental Duo — Ruins Water & Fire Maze (v0.39.2)

## Prototype 5 level lintas tema
Level aktif 01–05 tetap mewakili Hutan Berbisik, Kedalaman Kristal, Kerajaan Bara, Reruntuhan Langit, dan Jantung Kuno. Masing-masing memakai komposisi reruntuhan akuaduk yang berbeda. 45 blueprint lanjutan tetap tersimpan untuk ekspansi berikutnya.

## Tata letak reruntuhan labirin
- Platform disusun sebagai lorong bertingkat dan cabang kiri/kanan, bukan tangga yang berulang.
- Balok runtuhan batu menjadi penghalang fisik yang dapat dilompati; fragmen dibuat lebih rendah dari tinggi lompatan normal.
- Pijakan Bara dan Nira tetap berada pada rute bawah sebelum gerbang bersama.
- Permata, checkpoint, katup/tuas, dan dua pintu ditempatkan pada platform stabil.
- Setiap layout memiliki saluran air dan lava sendiri, sehingga hazard membentuk jalur yang perlu dipahami dan diseberangi.
- Relief dinding menggunakan bentuk gerbang akuaduk retak. Ornamen rune melingkar dan panah di tepi kamera dihapus agar tidak mengganggu pembacaan arena.

## Fisika dan migrasi
- `ELEMENTAL_JUMP_SPEED=560`, `ELEMENTAL_GRAVITY=1500`; tinggi puncak teoretis sekitar 104,5 unit.
- Collision platform tetap 8 unit dengan visual batu tebal; fragmen reruntuhan memakai collision 2D dan dapat dipijak/dilompati.
- `ELEMENTAL_MAP_VERSION=17` dan `prototypeVersion=3` memindahkan posisi serta state puzzle dari layout sebelumnya ke spawn baru. Statistik pemain dan keanggotaan room dipertahankan.
- Firebase Rules tidak berubah.

## Verifikasi
- `npm test`: 194/194 tes lulus.
- Seluruh file JavaScript lolos `node --check`.
- Geometri, keterjangkauan platform, hazard, checkpoint, gate, dan collision reruntuhan diperiksa otomatis.
- Playtest visual browser dan dua HP dengan Firebase aktif tetap diperlukan.

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


## Visual v0.39.1
Renderer menggambar latar batu bata gelap, sambungan batu, aksen lumut, tanaman rambat, relief kuil, dan partikel. Warna dasar tiap tema dibedakan namun seluruh level mempertahankan bahasa visual dungeon klasik. Platform batu, hazard air/lava, permata, pintu dan karakter menggunakan gambar Canvas prosedural sehingga tidak memerlukan aset eksternal tambahan.

## Revisi v0.39.1 — ruang dan fisika lompatan
- Lima prototype memakai lima layout ruang berbeda; sepuluh template tetap tersedia untuk variasi fase pengembangan berikutnya.
- Platform diberi jarak vertikal yang cukup untuk lompatan penuh dan tidak lagi tersusun rapat dalam barisan 24 unit.
- Lompatan menggunakan `jumpSpeed=560` dan `gravity=1500`, dengan tinggi puncak sekitar 104,5 unit.
- `ELEMENTAL_MAP_VERSION=16`; `prototypeVersion=2` memulai ulang puzzle lama untuk menghindari posisi karakter tersangkut pada layout baru.
