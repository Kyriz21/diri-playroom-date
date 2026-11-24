# Keterbatasan yang diketahui — Diri. Playroom Date v0.9

1. Konfigurasi Web App pada `js/firebase.js` sudah menunjuk ke project `diri-playroom-date` milik pengguna. Create/Gabung Sesi tetap memerlukan Anonymous Authentication, Realtime Database, domain GitHub Pages yang diizinkan, dan Rules terbaru yang sudah dipublikasikan.
2. Foto Sendiri dirancang berjalan tanpa Firebase. Galeri dan media disimpan pada IndexedDB browser lokal dan tidak otomatis berpindah ke perangkat lain.
3. Kamera memerlukan localhost atau HTTPS, izin kamera, serta browser yang mendukung `getUserMedia`.
4. WebRTC/STUN tidak menjamin koneksi langsung pada semua jaringan. v0.9 mencoba dua negosiasi langsung lalu memakai Firebase Realtime Database sebagai relay otomatis. TURN berbayar tidak disertakan.
5. Transfer tetap membutuhkan internet dan Firebase yang dapat diakses. Jika keduanya terputus, tidak ada jalur online yang dapat menyelesaikan transfer sampai koneksi pulih; foto lokal tetap tersimpan agar dapat dicoba ulang.
6. Relay membatasi JPEG maksimum 256 KiB per foto. Foto besar dikompres dan dapat mengalami penurunan kualitas.
7. Firebase Spark Realtime Database memiliki kuota penyimpanan dan data unduhan. Pengiriman foto melewati RTDB hanya pada fallback dan data sementara dibersihkan setelah kedua perangkat memberi ACK. Periksa penggunaan di Firebase Console jika sering melakukan sesi.
8. Sinkronisasi sesi, transfer foto, dan auto-start masih harus diuji dengan Firebase project dan dua perangkat nyata.
9. Gambar Bareng dan Tebak Pasangan sudah menjadi dua mini-game aktif. Modul game lama lainnya tetap ada di source tree, tetapi belum diaktifkan sebagai permainan siap pakai.
10. Menghapus data situs/browser dapat menghapus galeri pribadi dan Anonymous UID lokal. Simpan hasil foto ke perangkat sebelum membersihkan data browser.
11. Firebase Rules membatasi akses berdasarkan sesi/UID, tetapi client-side game logic bukan backend tepercaya untuk hadiah, uang, atau data sensitif.

## Tebak Pasangan v0.14
12. Penilaian otomatis menggunakan kecocokan token/kata kunci setelah reveal. Sistem tidak memahami sinonim atau makna semantik; variasi kata yang tidak sama bisa tidak dihitung cocok.
13. Durasi tiap ronde adalah 60 detik. Host memajukan ke reveal saat kedua status terkunci atau waktu habis. Jika penilaian tidak diberikan dalam 20 detik, ronde berlanjut tanpa poin; jika pemain tidak menekan Lanjutkan, host melanjutkan setelah 12 detik.
14. Jawaban privat hanya dapat dibuka peserta lain pada fase reveal atau hasil menurut Rules v0.14. Rules harus dipublikasikan sebelum game digunakan; JSON valid belum membuktikan aturan diterima Firebase Console.
15. Uji produksi dengan dua akun/perangkat, privasi jawaban, timer, reconnect, dan rematch masih diperlukan.
