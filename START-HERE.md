# Mulai di sini — Diri. Playroom Date v0.43.0

## Yang berubah pada Elemental Duo
- Kampanye penuh **50 level aktif** dan dimainkan berurutan dari 01 hingga 50; tidak lagi berhenti di lima prototype.
- Lima dunia masing-masing berisi 10 level: Hutan Berbisik (01–10), Kedalaman Kristal (11–20), Kerajaan Bara (21–30), Reruntuhan Langit (31–40), dan Jantung Kuno (41–50).
- Setiap level memiliki dua permata bonus opsional: merah untuk Bara dan biru untuk Nira. Permata tidak membuka gerbang atau pintu.
- Penilaian per level: 3 bintang untuk dua permata dan tanpa jatuh; 2 bintang jika maksimal dua kali jatuh gabungan; 1 bintang jika lebih dari dua kali jatuh. Maksimum kampanye 150 bintang dan 100 permata.
- HUD menampilkan hitungan `BONUS 0/2`, sedangkan petunjuk lobby menjelaskan fungsi permata dan cara memperoleh bintang.
- Progress berpindah otomatis ke level berikutnya sampai level 50. Hasil akhir menghitung semua bintang dan permata dari 50 level.
- Fisika lompatan dipertahankan; analog tetap hanya menggerakkan kiri/kanan.
- Sesi prototype lama dimigrasikan ke level 01 kampanye baru.
- Verifikasi: `npm test` 201/201 lulus; seluruh file JavaScript lolos `node --check`; Firebase Rules JSON valid. `ELEMENTAL_MAP_VERSION=27`, `campaignVersion=1`; state puzzle lama dibersihkan dan status ready direset.

## Memasang v0.43.0
1. Ekstrak ZIP `Diri_Playroom_Date_v0.43.0_Full_50_Level_Campaign.zip`.
2. Backup repository GitHub Pages, lalu unggah seluruh isi proyek ke root repository dan timpa file lama.
3. Pastikan `index.html`, `js/`, `css/`, `assets/`, `firebase-database.rules.json`, serta dokumentasi ikut terunggah.
4. Buat sesi Elemental Duo baru untuk playtest. Sesi lama otomatis dimigrasikan ke awal kampanye 50 level; state puzzle per-level dibersihkan.
5. Posisi pemain kembali ke spawn karena `ELEMENTAL_MAP_VERSION=27`. Firebase Rules tidak perlu dipublikasikan ulang karena file Rules tidak berubah.

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


Catatan historis v0.42.2: build tersebut memperbaiki akses lift Level 2 dan posisi katup Level 5. Build terbaru v0.43.0 memakai migrasi kampanye penuh.
