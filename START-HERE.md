# Mulai di sini — Diri. Playroom Date v0.44.0

## Yang berubah pada build ini
- Semua 50 level kini memakai blueprint per-level secara langsung; generator maze yang menumpuk platform dan dinding tambahan sudah dilepas dari jalur kampanye.
- Peta berisi 3–8 platform sesuai blueprint, sehingga arena tidak lagi dipenuhi 11–13 platform/partisi sintetis.
- Spawn, switch, permata, katup/tuas, dan pintu dipetakan ke pijakan yang stabil; jangkauan rute kedua karakter diverifikasi secara otomatis.
- ID hazard, katup dan tuas diperiksa agar kontrol tetap mengarah ke objek yang benar.
- Fungsi permata tidak berubah: merah untuk Bara dan biru untuk Nira; keduanya bonus opsional, bukan kunci pintu. Aturan bintang 3/2/1 tetap berlaku.
- Kampanye tetap berisi 50 level dalam lima dunia; urutan dan scoring kampanye dipertahankan.
- Fisika lompatan dipertahankan (`jumpSpeed=560`, `gravity=1500`); analog tetap hanya menggerakkan kiri/kanan.
- Verifikasi: `npm test` **199/199 lulus**; semua JavaScript lolos `node --check`; Firebase Rules JSON valid dan tidak berubah.

## Memasang v0.44.0
1. Unduh dan ekstrak ZIP `Diri_Playroom_Date_v0.44.0_Authored_50_Playable_Maps.zip`.
2. Backup repository GitHub Pages terlebih dahulu.
3. Unggah seluruh isi ZIP ke root repository dan timpa file proyek lama.
4. Tunggu GitHub Pages selesai melakukan deployment, lalu refresh website.
5. Buat room baru atau buka room lama. Karena `campaignVersion=2`, host akan memigrasikan kampanye ke Level 01 dan menghapus hasil/state puzzle lama. Keanggotaan room dan statistik lifetime tetap dipertahankan.
6. `ELEMENTAL_MAP_VERSION=29`; posisi karakter lama kembali ke spawn yang sesuai. Firebase Rules tidak perlu dipublikasikan ulang karena Rules tidak berubah.

## Batas pengujian
Tes otomatis memeriksa blueprint, reachability geometri, dukungan objek puzzle, ID kontrol, dan transisi kampanye. **Belum ada klaim bahwa playtest manual seluruh 50 level sudah selesai.** Uji mekanik khusus pada dua HP dengan Firebase aktif tetap diperlukan.

---

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
