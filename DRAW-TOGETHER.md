# Gambar Bareng

## Cara bermain

1. Dari halaman utama pilih **Gambar Bareng → Buat sesi**.
2. Bagikan kode enam karakter kepada pasangan.
3. Pasangan memilih **Gabung sesi** pada kartu Gambar Bareng dan memasukkan kode.
4. Keduanya melihat instruksi yang sama.
5. Tekan **Aku siap menggambar** di kedua perangkat.
6. Timer 2 menit dimulai bersama. Kanvas atas/bawah di layar HP (atau berdampingan di layar lebar) memperlihatkan gambar masing-masing.
7. Pilih warna, ukuran kuas, atau penghapus. Coretan yang dibuat akan tampil di perangkat pasangan.
8. Tekan **Selesai menggambar** lebih awal, atau tunggu timer habis.
9. Setelah kedua pemain selesai atau waktu habis, unduh satu gambar PNG yang menampilkan kedua karya.

## Sinkronisasi

- Prompt dan waktu mulai disimpan satu kali pada `roomGames/{roomCode}/{sessionId}/drawTogether/meta`.
- Status siap dan selesai disimpan per peran (`host`/`guest`).
- Goresan disimpan di `strokes/{uid}/{strokeId}`. Hanya pemilik UID yang dapat menulis goresannya.
- Titik kanvas dinormalisasi ke rentang 0–1 agar ukuran layar HP dan laptop tidak mengubah posisi gambar.
- Update goresan dikirim berkala selama pointer bergerak dan dikirim final saat pointer dilepas.
- Timer memakai offset waktu server Firebase agar kedua perangkat menghitung sisa waktu dari patokan yang sama.

## Firebase Rules

Setelah mengunggah source code, buka Firebase Console → Realtime Database → Rules dan publikasikan seluruh isi `firebase-database.rules.json` dari build ini. Rules menambahkan izin khusus untuk `drawTogether`, membatasi goresan berdasarkan UID, membatasi ukuran goresan menjadi maksimal 400 titik, dan membatasi jumlah goresan per pemain.

Jangan mengganti Rules dengan `.read: true` atau `.write: true`.

## Catatan pengujian

Unit test dan pemeriksaan sintaks dapat dijalankan dengan `npm test`. Pengujian dua perangkat nyata tetap diperlukan untuk memastikan Authorized Domains, Firebase Authentication, Rules yang sudah dipublikasikan, dan koneksi internet bekerja pada project Firebase milik pengguna.
