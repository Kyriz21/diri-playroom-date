# Reset dan deploy — Diri. Playroom Date

## Prinsip aman

Jangan langsung menghapus repository atau Firebase project lama. Buat project baru berdampingan, uji sampai stabil, lalu hapus yang lama jika memang tidak dibutuhkan. Ini mencegah kehilangan kode, foto lokal yang belum disimpan, dan konfigurasi yang masih diperlukan.

## A. Repository GitHub baru

1. Unduh/arsipkan source lama sebagai backup ZIP.
2. Buka GitHub dan pilih New repository.
3. Nama repository yang disarankan: `diri-playroom-date`.
4. Set Public jika ingin menggunakan GitHub Pages pada konfigurasi gratis yang umum; jangan masukkan secret ke source.
5. Buat repository kosong.
6. Upload semua isi paket ini ke root repository. Pastikan `index.html` berada tepat di root.
7. Commit ke branch `main`.
8. Settings → Pages → Deploy from a branch → `main` → `/(root)`.

## B. Firebase project baru

1. Buat Firebase project bernama `Diri Playroom Date`.
2. Tambahkan Web App bernama `Diri. Playroom Date`.
3. Aktifkan Anonymous Authentication.
4. Buat Realtime Database pada Spark plan.
5. Isi Web App configuration dan Database URL pada `js/firebase.js`.
6. Publish `firebase-database.rules.json` ke Realtime Database Rules.
7. Tambahkan domain Pages (`username.github.io`) ke Authorized domains.

Lihat `FIREBASE-SETUP.md` untuk detail per langkah.

## C. Menghapus project lama (setelah project baru stabil)

### GitHub
1. Buka repository lama → Settings → General.
2. Gulir ke Danger Zone.
3. Pilih Delete this repository.
4. Baca konfirmasi dan ketik nama repository persis seperti yang diminta GitHub.
5. Konfirmasi hanya setelah yakin backup sudah dapat dibuka.

### Firebase
1. Buka Firebase Console dan pilih project lama.
2. Project settings → General.
3. Cari bagian Delete project.
4. Periksa lagi Project ID agar tidak salah memilih project baru.
5. Hapus hanya jika sudah tidak diperlukan dan backup konfigurasi/data sudah disimpan.

Penghapusan Firebase project juga berdampak pada layanan Google Cloud yang terkait. Jangan menghapus project lama saat project baru belum diuji.
