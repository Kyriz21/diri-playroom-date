# Mulai di sini — Diri. Playroom Date v0.39.1

## Yang berubah pada Elemental Duo
- Prototype hanya membuka 5 level aktif, satu dari setiap tema dunia.
- Lima tema memakai tata letak arena yang berbeda dengan ruang vertikal lebih lega, cabang platform bertingkat, dan permukaan batu yang lebih tebal.
- Lompatan dinaikkan menjadi sekitar 104,5 unit agar pemain bisa mencapai pijakan berikutnya dengan kontrol udara yang sama.
- Engine tetap menyimpan 45 blueprint lanjutan untuk ekspansi setelah lima prototype diuji.
- Firebase Rules dan mini-game lain tidak berubah.

## Memasang v0.39.1
1. Ekstrak ZIP `Diri_Playroom_Date_v0.39.1_Classic_Temple_Prototype.zip`.
2. Unggah seluruh isi folder proyek ke root repository GitHub Pages dan timpa file lama.
3. Pastikan `index.html`, `js/`, `css/`, `assets/`, `firebase-database.rules.json`, serta dokumentasi ikut terunggah.
4. Buat sesi Elemental Duo baru untuk playtest pertama. Sesi lama otomatis dimigrasikan ke prototype level 01 oleh `prototypeVersion=2`; state puzzle lama dibersihkan.
5. Posisi pemain lama kembali ke spawn karena `ELEMENTAL_MAP_VERSION=16`. Firebase Rules tidak perlu dipublikasikan ulang.

## Urutan 5 prototype
1. Hutan Berbisik — Jejak Cahaya.
2. Kedalaman Kristal — Retakan Pertama.
3. Kerajaan Bara — Napas Lava.
4. Reruntuhan Langit — Tangga Awan.
5. Jantung Kuno — Simpul Pertama.

## Verifikasi lokal
- `npm test`: **194/194 lulus**.
- JavaScript lolos `node --check`.
- Uji dua HP dengan Firebase aktif dan pemeriksaan visual browser tetap diperlukan.

---

---

# Mulai di sini — Diri. Playroom Date v0.33.0

## Perubahan terbaru v0.33.0 — Mobile, kontrol dan kesulitan
- Seluruh 50 level kini memakai peta eksplorasi 2D bertingkat dengan perjalanan kiri/kanan dan naik/turun.
- Setiap level memiliki 13 platform utama, 5 platform cabang, dan 4 jembatan pintas; tidak lagi satu koridor menuju ujung kanan.
- Lima pola peta berulang dengan variasi geometri dan posisi pintu: Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, serta Lingkaran Kuno.
- Peta mini menandai platform, hazard, sakelar, permata, kedua pintu, kedua pemain, dan area kamera. Penunjuk arah muncul saat pintu karakter di luar layar.
- Posisi dari peta versi lama dimigrasikan ke spawn peta baru (mapVersion 9); jumlah jatuh dan serpihan tetap disimpan.
- Platform utama, cabang, dan shortcut diberi jarak visual minimum agar tidak saling menyatu.
- Mode landscape memakai fullscreen native/fallback portal, HUD melayang dan kontrol analog transparan; analog juga bisa dipilih saat mode Potret. Tombol kontrol tetap tersedia sebagai pilihan.
- Stabilitas layar ditingkatkan dengan ukuran viewport stabil dan pengukuran ulang canvas yang dibatasi.

## Memasang v0.33.0
1. Ekstrak ZIP `Diri_Playroom_Date_v0.33.0_Elemental_Mobile_Repair.zip`.
2. Unggah seluruh isi folder proyek ke root repository GitHub Pages dan timpa file lama.
3. Pastikan `index.html`, `js/`, `css/`, `assets/`, `firebase-database.rules.json`, serta dokumentasi ikut terunggah.
4. Tunggu deployment selesai lalu refresh kedua perangkat. Karena `ELEMENTAL_MAP_VERSION` sekarang 9, posisi pemain dari layout sebelumnya akan kembali ke spawn pada level aktif; progres level dan perolehan tetap disimpan.
5. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.

## Cakupan petualangan
- Level 01–10: Hutan Berbisik.
- Level 11–20: Kedalaman Kristal.
- Level 21–30: Kerajaan Bara.
- Level 31–40: Reruntuhan Langit.
- Level 41–50: Jantung Kuno.

Blueprint tema, hazard, sakelar, katup, tuas angin, dan urutan puzzle dari lima dunia tetap dipertahankan. Layout ruang kini disusun sebagai jaringan jalur cabang dan loop.

## Verifikasi build
- `npm test`: **191/191 tes lulus**.
- Seluruh file JavaScript lolos `node --check`.
- `firebase-database.rules.json` valid dan tidak berubah.
- Pengujian otomatis reachability geometri telah mencakup 50 level dan kedua peran pemain. Pengujian dua HP dengan Firebase aktif tetap diperlukan setelah deployment.

## Hal yang dipertahankan
- Photobooth tetap menggunakan renderer Canvas yang sama untuk pratinjau dan ekspor.
- Kamera Elemental Duo tetap mengikuti pemain lokal; Mode Potret dan Layar Penuh tetap tersedia.
- Lima mini-game, sistem room, serta progres 50 level tetap disertakan.
- Tidak ada dependensi npm baru.


## Perbaikan v0.33.0
- Potret kini edge-to-edge dan tidak memaksa halaman melebar.
- Landscape memakai arena penuh, analog transparan di kiri dan LOMPAT di kanan.
- Analog menggantikan tombol arah; joystick ke atas juga memicu lompatan.
- INTERAKSI hanya muncul dekat katup/tuas. Pijakan elemen aktif otomatis saat diinjak.
- Fisika lebih toleran dengan jump buffer dan coyote time; kurva kesulitan 50 level diturunkan.
