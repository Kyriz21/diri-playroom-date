# Mulai di sini — Diri. Playroom Date v0.12

Mini game pertama yang sudah ditambahkan adalah **Gambar Bareng**. Ikuti `DRAW-TOGETHER.md` untuk cara bermain dan `FIREBASE-SETUP.md` untuk konfigurasi. Saat update ke v0.12, publikasikan ulang Rules dari `firebase-database.rules.json` agar node sinkronisasi gambar mendapat izin yang benar.

# Mulai di sini — Diri. Playroom Date v0.1

Project baru ini menggunakan build Photobooth v1.2 sebagai basis agar pekerjaan sebelumnya tidak diulang. Ikuti urutan ini:

1. **Backup** repository dan Firebase lama. Jangan hapus keduanya dulu.
2. Buat repository GitHub baru bernama `diri-playroom-date`.
3. Buat Firebase project baru bernama `Diri Playroom Date` dan Web App bernama `Diri. Playroom Date`.
4. Aktifkan Anonymous Authentication, buat Realtime Database, lalu isi `js/firebase.js` dengan konfigurasi Web App baru.
5. Publish `firebase-database.rules.json` ke Realtime Database Rules.
6. Upload isi folder project ke root repository dan aktifkan GitHub Pages.
7. Uji **Foto Sendiri** terlebih dahulu. Ini tidak memerlukan Firebase.
8. Setelah Firebase tersambung, uji **Buat Sesi Berdua** dari laptop dan **Gabung Sesi** dari HP.
9. Ikuti checklist pada `REVIEW-BUILD-QA.md`.

Panduan rinci: `RESET-AND-DEPLOY.md` dan `FIREBASE-SETUP.md`.

**Catatan penting:** konfigurasi Firebase di paket ini masih placeholder. Itu disengaja agar project baru tidak diam-diam terhubung ke Firebase lama.
