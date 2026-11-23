# Firebase setup — Diri. Playroom Date

Mode **Foto Sendiri tidak memakai Firebase**. Firebase hanya dibutuhkan untuk Buat Sesi Berdua dan Gabung Sesi.

Konfigurasi ini dirancang untuk Firebase **Spark (gratis)**. Jangan aktifkan billing/Blaze untuk fondasi awal.

## 1. Buat project Firebase baru

1. Buka https://console.firebase.google.com/.
2. Pilih **Add project**.
3. Nama project: `Diri Playroom Date`.
4. Selesaikan proses pembuatan project.
5. Pada Project Overview, pilih ikon Web `</>` untuk menambahkan Web App.
6. Nama app: `Diri. Playroom Date`.
7. Salin konfigurasi Web App yang diberikan Firebase.

Jangan menyalin konfigurasi project LDR Playroom lama. File `js/firebase.js` pada project baru sengaja memakai placeholder.

## 2. Isi konfigurasi Web App

Buka `js/firebase.js`, lalu ganti nilai pada `firebaseConfig` menggunakan nilai persis dari Firebase Console:

```js
export const firebaseConfig = {
  apiKey: '...',
  authDomain: '...firebaseapp.com',
  databaseURL: 'https://...firebasedatabase.app',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...'
};
```

Pastikan `databaseURL` disalin dari halaman Realtime Database, bukan ditebak dari Project ID. Jangan menaruh Admin SDK service-account JSON atau private key dalam repository.

## 3. Aktifkan Anonymous Authentication

1. Firebase Console → Build → Authentication.
2. Pilih Get started jika diminta.
3. Buka Sign-in method.
4. Pilih Anonymous → Enable → Save.

Setelah GitHub Pages aktif, buka Authentication → Settings → Authorized domains. Tambahkan domain GitHub Pages, misalnya `username.github.io` (tanpa `https://` dan tanpa nama repository/path).

## 4. Buat Realtime Database

1. Firebase Console → Build → Realtime Database.
2. Pilih Create Database.
3. Pilih lokasi dekat pengguna; `asia-southeast1` (Singapore) cocok untuk deployment awal di Indonesia.
4. Setelah database dibuat, salin URL database ke `databaseURL` di `js/firebase.js`.
5. Buka tab Rules.
6. Salin seluruh isi `firebase-database.rules.json` ke editor Rules.
7. Klik Publish.

Jangan mengubah Rules menjadi `.read: true` atau `.write: true`. Jika terjadi `permission_denied`, periksa project ID, database URL, Authentication, dan Rules—jangan membuka database untuk publik.

## 5. Alur sesi dalam versi awal

- Pembuat sesi membuat kode enam karakter dan menunggu pasangan.
- Saat Tamu bergabung dengan kode, klien menandai pilihan Photobooth dan kesiapan kedua pihak.
- Pembuat sesi memulai sesi Photobooth secara otomatis.
- Tidak ada lobi pemilihan game atau tombol Ready manual pada tahap ini.
- Jika Tamu keluar, klien Pembuat akan mengembalikan room ke layar undangan sehingga kode dapat dipakai lagi.

## 6. GitHub Pages

1. Upload isi project ke root repository baru.
2. GitHub → Settings → Pages.
3. Source: Deploy from a branch.
4. Branch: `main`.
5. Folder: `/(root)`.
6. Save dan periksa tab Actions sampai deployment berhasil.
7. Tambahkan domain Pages ke Firebase Authorized domains seperti langkah 3.

## 7. Uji dua perangkat

- Perangkat A: laptop sebagai Pembuat.
- Perangkat B: HP sebagai Tamu.
- Gunakan browser/profile berbeda agar Anonymous UID tidak sama.
- Uji Buat Sesi, Salin Kode, Gabung Sesi, kamera, empat foto per perangkat, pratinjau delapan foto, retake, persetujuan, unduh, dan cetak.

## 8. Batasan penting

- Tidak ada Cloud Storage atau Cloud Functions.
- Foto tidak ditulis ke Realtime Database.
- Transfer langsung bergantung pada dukungan browser dan jaringan WebRTC/STUN; fallback manual tetap disediakan.
- Foto Sendiri menggunakan IndexedDB lokal. Menghapus data situs/browser dapat menghapus galeri lokal.
- Firebase Rules bukan pengganti backend tepercaya. Baca `SECURITY-NOTES.md`.
