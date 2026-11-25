# Elemental Duo — Adventure Map Design (v0.30.0)

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
`ELEMENTAL_MAP_VERSION=3`. Posisi dari map lama tidak dipakai ulang karena geometri berubah; pemain ditempatkan kembali pada spawn level berjalan. Death count, level death count, jumlah serpihan, dan readiness dipertahankan; status `complete` lama dibersihkan agar tidak mengunci gerakan di map baru.

## Batas verifikasi
186 tes otomatis mencakup struktur map, posisi pintu, jalur geometri dari dua spawn ke semua platform, gate vertikal dan minimap. Tes otomatis tidak menggantikan playtest dua HP dengan Firebase aktif maupun pemeriksaan visual fisik di berbagai ukuran layar.
