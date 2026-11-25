# Mulai di sini — Diri. Playroom Date v0.30.0

## Perubahan terbaru v0.30.0 — Adventure Map Elemental Duo
- Seluruh 50 level kini memakai peta eksplorasi 2D bertingkat dengan perjalanan kiri/kanan dan naik/turun.
- Setiap level memiliki 13 platform utama, 5 platform cabang, dan 4 jembatan pintas; tidak lagi satu koridor menuju ujung kanan.
- Lima pola peta berulang dengan variasi geometri dan posisi pintu: Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, serta Lingkaran Kuno.
- Peta mini menandai platform, hazard, sakelar, permata, kedua pintu, kedua pemain, dan area kamera. Penunjuk arah muncul saat pintu karakter di luar layar.
- Posisi dari peta versi lama dimigrasikan ke spawn peta baru; jumlah jatuh dan serpihan tetap disimpan.

## Memasang v0.30.0
1. Ekstrak ZIP `Diri_Playroom_Date_v0.30.0_Elemental_Adventure_Maps.zip`.
2. Unggah seluruh isi folder proyek ke root repository GitHub Pages dan timpa file lama.
3. Pastikan `index.html`, `js/`, `css/`, `assets/`, `firebase-database.rules.json`, serta dokumentasi ikut terunggah.
4. Tunggu deployment selesai lalu refresh kedua perangkat. Karena `ELEMENTAL_MAP_VERSION` berubah ke 3, posisi pemain yang berasal dari peta lama akan kembali ke spawn pada level aktif; progres level dan perolehan tetap disimpan.
5. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.

## Cakupan petualangan
- Level 01–10: Hutan Berbisik.
- Level 11–20: Kedalaman Kristal.
- Level 21–30: Kerajaan Bara.
- Level 31–40: Reruntuhan Langit.
- Level 41–50: Jantung Kuno.

Blueprint tema, hazard, sakelar, katup, tuas angin, dan urutan puzzle dari lima dunia tetap dipertahankan. Layout ruang kini disusun sebagai jaringan jalur cabang dan loop.

## Verifikasi build
- `npm test`: **186/186 tes lulus**.
- Seluruh file JavaScript lolos `node --check`.
- `firebase-database.rules.json` valid dan tidak berubah.
- Pengujian otomatis reachability geometri telah mencakup 50 level dan kedua peran pemain. Pengujian dua HP dengan Firebase aktif tetap diperlukan setelah deployment.

## Hal yang dipertahankan
- Photobooth tetap menggunakan renderer Canvas yang sama untuk pratinjau dan ekspor.
- Kamera Elemental Duo tetap mengikuti pemain lokal; Mode Potret dan Layar Penuh tetap tersedia.
- Lima mini-game, sistem room, serta progres 50 level tetap disertakan.
- Tidak ada dependensi npm baru.
