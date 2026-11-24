# Mulai di sini — Diri. Playroom Date v0.14

Build ini mempertahankan Photobooth dan menambahkan penyempurnaan pada game pertama **Gambar Bareng**.

## Perubahan v0.13
1. Tombol **Main lagi** muncul pada layar hasil. Kedua pemain harus menyetujuinya.
2. Setelah kedua setuju, aplikasi masuk ke tahap persiapan ulang. Masing-masing perangkat menghapus goresannya sendiri dan memberi konfirmasi. Hasil ronde lama tidak dihapus ketika baru satu pemain meminta rematch.
3. Setelah kedua konfirmasi diterima, prompt baru dibuat, timer kembali ke 2 menit, dan kedua pemain kembali ke layar Siap.
4. Ukuran kuas menggunakan slider 1–24 px, termasuk untuk penghapus.

## Pemasangan
1. Backup repository GitHub.
2. Ekstrak ZIP dan timpa seluruh isi repository dengan file dalam ZIP ini. Pastikan `index.html` tetap di root.
3. Pertahankan konfigurasi Web App pada `js/firebase.js`.
4. **Wajib:** publikasikan ulang `firebase-database.rules.json` dari build ini di Firebase Console → Realtime Database → Rules. Rules terbaru menambahkan `rematchRequests` dan `rematchCleared`.
5. Commit dan tunggu GitHub Pages selesai deploy.

## Uji cepat
- Mainkan satu ronde di dua perangkat.
- Pastikan hasil dua gambar bisa diunduh.
- Tekan **Main lagi** di perangkat pertama saja: hasil lama harus tetap tersedia dan tombol berubah menjadi menunggu pasangan.
- Tekan **Main lagi** di perangkat kedua: tampil tahap persiapan ulang, lalu layar instruksi baru muncul.
- Atur slider kuas dari 1 ke 24 px dan pastikan goresan terlihat semakin tebal.

Lihat `DRAW-TOGETHER.md`, `FIREBASE-SETUP.md`, dan `REVIEW-BUILD-QA.md` untuk detail.

## v0.14 — Mini Game Kedua: Tebak Pasangan

Build ini mempertahankan Photobooth dan Gambar Bareng, lalu menambahkan **Tebak Pasangan**.

### Cara bermain
1. Dari halaman utama, pilih Buat Sesi atau Gabung Sesi pada kartu Tebak Pasangan.
2. Host dan Tamu masuk ke game yang sama menggunakan kode sesi.
3. Ada enam ronde. Setiap ronde memiliki batas waktu 60 detik.
4. Ronde ganjil: host menjawab, guest menebak. Ronde genap: peran bertukar.
5. Masing-masing mengunci jawaban/tebakan. Teks tetap privat sampai reveal.
6. Setelah reveal, sistem otomatis menilai kata kunci: Tepat (2), Hampir (1), atau Meleset (0).
7. Kedua pemain melanjutkan ke ronde berikutnya. Setelah enam ronde, skor dan rangkuman ditampilkan.
8. Main lagi memerlukan persetujuan kedua pemain.

### Pemasangan penting
1. Backup repository GitHub dan Rules Firebase saat ini.
2. Ekstrak ZIP v0.14 dan timpa isi repository dengan seluruh isi ZIP. Pastikan `index.html` berada di root.
3. Pertahankan konfigurasi Web App pada `js/firebase.js`.
4. **Wajib:** publikasikan ulang seluruh `firebase-database.rules.json` dari build v0.14 di Firebase Console → Realtime Database → Rules. Jangan hanya menambahkan potongan dan jangan mengubah akses menjadi publik.
5. Commit dan tunggu GitHub Pages selesai deploy.

### Uji dua perangkat
- Pastikan kode sesi Tebak Pasangan hanya membuka game yang benar.
- Pastikan prompt dan timer sama pada kedua perangkat.
- Ketik jawaban asli di perangkat satu; pastikan tidak terlihat di perangkat dua sebelum reveal.
- Kunci tebakan dan jawaban dari kedua perangkat; pastikan reveal memperlihatkan keduanya.
- Uji semua jenis penilaian dan skor.
- Pastikan peran bertukar di ronde genap.
- Selesaikan enam ronde dan uji Main lagi dari kedua perangkat.

Baca `TEBAK-PASANGAN.md`, `FIREBASE-SETUP.md`, dan `REVIEW-BUILD-QA.md` untuk penjelasan dan daftar uji lebih lengkap.
