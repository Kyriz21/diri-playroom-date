# Mulai di sini — Diri. Playroom Date v0.29.0

## Perubahan terbaru v0.29.0 — Dunia 5: Jantung Kuno
- Level 41–50 kini memakai 10 blueprint khusus; seluruh 50 level telah memiliki desain level tersendiri.
- Dunia final menggabungkan es, arus, angin, lava, air, uap, katup, tuas, platform bergerak, dan puzzle dua pemain.
- Level 42, 46, 49, dan 50 mewajibkan katup elemen; level 43, 48, 49, dan 50 mewajibkan tuas angin.
- Level 44, 49, dan 50 meminta Nira mengaktifkan pijakan lebih dahulu, kemudian Bara.
- Level 50 — Penyatuan Elemen — menjadi ujian gabungan seluruh mekanik.

## Memasang v0.29.0
1. Ekstrak ZIP `Diri_Playroom_Date_v0.29.0_Elemental_Final_World_Implementation.zip`.
2. Unggah seluruh isi folder proyek ke root repository GitHub Pages dan timpa file lama.
3. Pastikan `index.html`, `js/`, `css/`, `assets/`, `firebase-database.rules.json`, dan dokumentasi ikut terunggah.
4. Tunggu deployment selesai lalu refresh kedua perangkat.
5. Firebase Rules tidak berubah; Rules yang sudah terpasang tetap berlaku.

## Cakupan level v0.29.0
- Level 01–10: Hutan Berbisik — blueprint khusus.
- Level 11–20: Kedalaman Kristal — blueprint khusus.
- Level 21–30: Kerajaan Bara — blueprint khusus.
- Level 31–40: Reruntuhan Langit — blueprint khusus.
- Level 41–50: Jantung Kuno — blueprint khusus; dunia final.

## Verifikasi build
- `npm test`: **181/181 tes lulus**.
- Seluruh file JavaScript lolos `node --check`.
- `firebase-database.rules.json` valid dan tidak berubah dari versi sebelumnya.
- Pengujian otomatis belum menggantikan uji end-to-end dua HP dengan Firebase aktif.
- Baca `ELEMENTAL-WORLD-5.md` untuk blueprint final dan `REVIEW-BUILD-QA.md` bagian K untuk checklist perangkat.

## Hal yang dipertahankan
- Photobooth tetap menggunakan renderer Canvas yang sama untuk pratinjau dan ekspor.
- Elemental Duo mempertahankan kamera yang mengikuti karakter lokal serta pilihan Mode Potret dan Layar Penuh.
- Mini-game lain dan sistem room Firebase tetap disertakan.
- Tidak ada dependensi npm baru dan Firebase Rules tidak perlu dipublikasikan ulang.
