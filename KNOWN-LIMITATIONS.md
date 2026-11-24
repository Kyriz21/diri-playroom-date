# Keterbatasan yang diketahui — Diri. Playroom Date v0.19

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

## Tebak Pasangan v0.16
12. Penilaian otomatis membandingkan jawaban yang dinormalisasi: jawaban sama persis setelah normalisasi kapital, spasi, dan tanda baca = Tepat (2); minimal satu kata bermakna cocok tetapi keseluruhan frasa berbeda = Hampir (1); tidak ada kata bermakna yang cocok = Meleset (0). Sistem tidak memahami sinonim atau makna semantik.
13. Durasi tiap ronde adalah 60 detik. Host memajukan ke reveal saat kedua status terkunci atau waktu habis. Jika penilaian tidak diberikan dalam 20 detik, ronde berlanjut tanpa poin; jika pemain tidak menekan Lanjutkan, host melanjutkan setelah 12 detik.
14. Jawaban privat hanya dapat dibuka peserta lain pada fase reveal atau hasil menurut Rules v0.14. Rules harus dipublikasikan sebelum game digunakan; JSON valid belum membuktikan aturan diterima Firebase Console.
15. Uji produksi dengan dua akun/perangkat, privasi jawaban, timer, reconnect, dan rematch masih diperlukan.


## Bomb Storm v0.18
- Arena menggunakan simulasi objek deterministik dari seed bersama; setiap pemain menghitung tabrakan untuk karakternya sendiri dan mengirim progres ke Firebase. Keterlambatan jaringan dapat membuat posisi lawan terlihat sedikit tertinggal.
- Skor disinkronkan dari perangkat pemilik karakter, bukan dihitung oleh server tepercaya; game ini untuk permainan santai dua orang, bukan kompetisi berhadiah.
- Foto selfie dikompres ke avatar kecil dan hanya dibagikan ke anggota room; aplikasi tidak mengirim foto resolusi penuh.
- Belum dilakukan uji dua perangkat fisik, jaringan seluler yang berbeda, atau evaluasi kuota Firebase aktual.

- Avatar dari galeri/kamera tetap memerlukan izin browser dan file gambar yang dapat dibaca. Jika perangkat menolak akses kamera, opsi karakter bawaan dan galeri tetap dapat digunakan.


## Bomb Storm v0.19
- Interpolasi posisi memperhalus pembaruan remote, tetapi kualitas gerakan tetap bergantung pada jaringan dan frekuensi update posisi.
- Animasi hati/bom dipicu setelah perubahan skor/nyawa diterima melalui Firebase; pada latensi tinggi, efek dapat muncul sedikit setelah objek menyentuh karakter.
- Simulasi tabrakan tetap dihitung pada perangkat pemilik karakter, bukan server authoritative.


## Balloon Pop v0.20
- Kedua papan memakai seed dan jadwal balon yang sama, tetapi setiap pemain mengetuk papan miliknya sendiri.
- Pergerakan visual dihitung lokal dari waktu mulai server dan seed bersama; ketukan/skor dicatat ke Firebase Realtime Database.
- Seperti game kasual lainnya pada build ini, klien tetap menghitung input dan skor; ini bukan sistem anti-cheat untuk kompetisi berhadiah.
- Perlu uji nyata pada dua HP untuk memeriksa sensitivitas sentuhan, izin kamera/galeri avatar, latensi Firebase, countdown, dan rematch.
