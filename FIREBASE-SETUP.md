# Firebase setup — Diri. Playroom Date v0.14

Project Firebase `diri-playroom-date` dan Web App sudah dibuat oleh pemilik project. Konfigurasi lengkap sudah disimpan di `js/firebase.js`; jangan menggantinya dengan konfigurasi project lama.

## 1. Periksa konfigurasi Web App

Buka Firebase Console → Project settings → General → Your apps. Pastikan Web App berada di project `diri-playroom-date`. File `js/firebase.js` sudah memakai konfigurasi yang diberikan pemilik project, termasuk database di region `asia-southeast1`.

Jangan menaruh Admin SDK service-account JSON, private key, atau token administrator di repository. Firebase Web config adalah konfigurasi client-side; akses data tetap dilindungi Authentication dan Realtime Database Rules.

## 2. Pastikan Anonymous Authentication aktif

1. Firebase Console → Build → Authentication.
2. Buka Sign-in method.
3. Pilih Anonymous dan pastikan statusnya Enabled.

## 3. Pastikan Realtime Database tersedia

1. Firebase Console → Build → Realtime Database.
2. Pastikan database yang URL-nya sama dengan `databaseURL` pada `js/firebase.js` sudah ada.
3. Database project ini menggunakan region `asia-southeast1`.

## 4. Riwayat Rules transfer foto (v0.13)

Build v0.13 memperkenalkan jalur relay foto sementara di Realtime Database ketika WebRTC gagal. Catatan ini merupakan riwayat; untuk pemasangan baru gunakan Rules lengkap dari build terbaru, bukan file v0.13.

Urutan tersebut dipertahankan sebagai referensi historis. Build v0.17 menambah Bomb Storm; v0.18 menambahkan pilihan avatar karakter, kamera, dan galeri. Untuk pemasangan v0.18, publikasikan seluruh `firebase-database.rules.json` dari ZIP v0.18 melalui Firebase Console → Build → Realtime Database → Rules. Cadangkan Rules aktif sebelum mengganti seluruh isinya. Jangan membuka akses dengan `.read: true` atau `.write: true`.

Rules v0.9 membatasi node relay ke anggota sesi, membatasi foto ke JPEG maksimum 256 KiB, dan memvalidasi peran, nomor slot, tipe, ukuran, serta struktur tanda terima. Jika Firebase menampilkan `PERMISSION_DENIED`, periksa bahwa Rules v0.9 benar-benar sudah dipublikasikan.

## 5. Authorized domain

Setelah GitHub Pages aktif, buka Authentication → Settings → Authorized domains. Pastikan domain GitHub Pages terdaftar, misalnya `username.github.io` tanpa `https://` dan tanpa path repository.

## 6. Alur transfer foto bersama

- Kedua perangkat mengambil empat foto dan menyimpan salinan lokal terlebih dahulu.
- WebRTC DataChannel dicoba sebagai jalur langsung. Setiap foto harus memperoleh ACK dan checksum yang cocok.
- Jika koneksi langsung gagal atau macet, kedua perangkat otomatis berpindah ke Firebase Realtime Database sebagai relay sementara. Tidak perlu memilih delapan file secara manual.
- Foto dikompres menjadi JPEG maksimum 256 KiB per file, diverifikasi SHA-256, dan disimpan ke IndexedDB pada kedua perangkat.
- Editor bersama baru dibuka setelah kedua perangkat mengirim ACK untuk empat foto yang diterima.
- Node relay dihapus setelah kedua ACK diterima. Jika seluruh internet atau Firebase tidak tersedia, transfer menunggu koneksi pulih; foto lokal tidak dihapus.

## 7. Uji dua perangkat

- Perangkat A: laptop atau HP sebagai Pembuat ruang.
- Perangkat B: HP pasangan sebagai Tamu.
- Gunakan browser/profile berbeda agar Anonymous UID tidak sama.
- Uji kamera, empat foto per perangkat, WebRTC, lalu fallback RTDB ketika koneksi peer diblokir, progres 4/4, ACK dua pihak, editor bersama, retake, unduh, dan cetak.
- Uji putus internet sementara pada salah satu perangkat lalu pulihkan; transfer harus melanjutkan tanpa meminta pemilihan file manual.

## 8. Batasan penting

- Foto Sendiri tetap lokal dan tidak memakai Firebase.
- Tidak menggunakan Firebase Storage, Cloud Functions, server sendiri, atau TURN berbayar.
- Firebase Realtime Database relay hanya dipakai saat WebRTC gagal. Foto relay sementara memakai kuota penyimpanan dan unduhan RTDB.
- Tidak ada sistem transfer online yang dapat menjamin penyelesaian ketika kedua jalur internet dan Firebase benar-benar tidak tersedia. Aplikasi mempertahankan foto lokal dan mencoba lagi setelah koneksi pulih.
- Baca `SECURITY-NOTES.md` dan `KNOWN-LIMITATIONS.md` sebelum digunakan rutin.


## 9. Rules Gambar Bareng v0.13

Build v0.13 menambahkan dua node baru pada `drawTogether`: `rematchRequests` (persetujuan kedua pemain) dan `rematchCleared` (konfirmasi bahwa masing-masing perangkat telah menghapus goresan ronde sebelumnya). Karena itu, publikasikan ulang **seluruh** `firebase-database.rules.json` dari ZIP v0.13. Jangan hanya menambahkan potongan rules dan jangan mengganti aturan dengan akses publik.

## 10. Firebase Rules v0.14 — Tebak Pasangan

Build v0.14 menambahkan game `guesspartner`. Publikasikan ulang **seluruh** `firebase-database.rules.json` dari ZIP v0.14 melalui Firebase Console → Realtime Database → Rules. Rules ini:

- Mengizinkan game ID `guesspartner` pada pilihan game dan sesi aktif.
- Menyimpan jawaban asli serta tebakan di `privateRooms/{roomCode}/guesspartner/{sessionId}/{uid}/rounds/{roundKey}`.
- Membatasi baca privat ke UID pemilik sebelum reveal; peserta lain baru dapat membaca setelah fase `reveal`, `round-result`, atau `result-game`.
- Membatasi tulis jawaban/tebakan sesuai peran yang ditetapkan pada ronde aktif.
- Memvalidasi teks maksimum 140 karakter, status kunci, rating, lanjut ronde, dan permintaan rematch.

Jangan menempel hanya potongan Rules game ini. Ganti keseluruhan Rules dengan file lengkap dari ZIP supaya Rules Photobooth, transfer relay, dan Gambar Bareng tetap ikut terdaftar. Jangan membuka akses dengan `.read: true` atau `.write: true`.

Rules sudah divalidasi sebagai JSON dan diperiksa statis dalam build, tetapi belum dikompilasi/dipublikasikan pada Firebase Console project aktif. Setelah Publish, uji jawaban privat dengan dua UID nyata sebelum penggunaan rutin.


## Catatan v0.15 — Tebak Pasangan
Pembaruan penilaian otomatis tidak mengubah struktur Firebase Rules. Rules v0.14 yang sudah dipublikasikan tetap digunakan; node `ratings/{roundKey}` tetap ditulis satu kali oleh pemain yang menjadi penjawab setelah reveal.


## Bomb Storm v0.18

Untuk mengaktifkan Bomb Storm, publikasikan Rules dari `firebase-database.rules.json` pada build v0.18. Rules tersebut mencakup seluruh fitur sebelumnya ditambah jalur `roomGames/{roomCode}/{sessionId}/bombStorm` dan `bombStormAvatars`. Avatar JPEG kecil hanya dapat ditulis oleh pemilik role host/guest dan dibaca anggota sesi yang sama. Jangan hanya menambahkan potongan rules Bomb Storm; gunakan file rules lengkap dari build v0.18 agar seluruh permainan tetap berjalan.

Bomb Storm menyimpan posisi, skor, nyawa, kesiapan, dan indeks objek yang telah diproses secara terpisah dari gambar avatar. Foto sumber yang dipilih pengguna diperkecil pada perangkat menjadi JPEG 128 × 128 dan tidak dikirim sebagai foto resolusi penuh.


## 11. Rules Bomb Storm v0.18

Build v0.18 mempertahankan ID game `bombstorm` dan menambahkan validasi pilihan avatar karakter bawaan. Build v0.17 sebelumnya menambahkan ID game `bombstorm`, jalur state `roomGames/{roomCode}/{sessionId}/bombStorm`, serta jalur avatar terpisah `bombStormAvatars/{role}`. Setiap pemain hanya dapat menulis field profil dan avatar miliknya sendiri. Avatar foto dibatasi maksimal 22.000 karakter; avatar bawaan hanya menerima ID yang tercantum (alien, bear, cat, rabbit, panda, fox, frog, monkey, koala, tiger, chick, unicorn). Avatar hanya dapat dibaca anggota sesi aktif. Host mengelola fase lobby/playing/result/rematch berdasarkan kesiapan serta persetujuan kedua pemain.

Untuk mengaktifkan build v0.18, ganti seluruh isi Realtime Database Rules dengan file `firebase-database.rules.json` pada ZIP v0.18, setelah mencadangkan Rules aktif. Jangan hanya menambahkan potongan Bomb Storm karena file lengkap juga memuat Photobooth, relay foto, Gambar Bareng, dan Tebak Pasangan.

Rules telah divalidasi sebagai JSON dan diuji secara statis. Rules belum dipublikasikan pada Firebase Console maupun diuji dengan Firebase Emulator atau dua perangkat fisik. Uji pembuatan sesi, kesiapan kedua pemain, gerakan, skor, nyawa, hasil, avatar, dan rematch setelah Publish.

## 12. Pilihan avatar Bomb Storm v0.18

Rules perlu diperbarui karena nilai avatar kini dapat berupa ID karakter `character:<id>` selain data gambar. Gunakan seluruh file `firebase-database.rules.json` v0.18; jangan mengubah hanya satu ekspresi secara manual. Kamera dan galeri tetap memerlukan browser permission/HTTPS.


## Bomb Storm v0.19

Build v0.19 hanya memperbaiki rendering posisi dan menambahkan animasi visual untuk hati/bom. Tidak ada perubahan pada struktur data atau Firebase Realtime Database Rules. Rules v0.18 yang sudah dipublikasikan tetap digunakan.
