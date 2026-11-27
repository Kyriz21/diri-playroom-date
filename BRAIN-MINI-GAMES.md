# LDR Mini Games — v0.46.0

Tiga aktivitas baru memakai room dua perangkat dan menyediakan mode main di satu perangkat. Elemental Duo disembunyikan dari landing page dan status katalog menjadi `archived`; source, CSS, Firebase rules, dan dokumentasinya tetap disimpan sebagai konsep/arsip untuk pengembangan berikutnya.


## Lobi pemain dan rekap hasil — v0.46.0

- Room Love Match, Color Match, dan IQ Duel tidak langsung masuk permainan setelah guest bergabung. Kedua perangkat masuk ke lobi bersama terlebih dahulu.
- Kartu pemain memperlihatkan nama, status online, dan status siap. Tombol mulai milik host tetap terkunci sampai host dan guest online serta sama-sama Ready.
- Jika perangkat terputus, status online pada lobi berubah dan permainan tidak dapat dimulai sampai keduanya tersambung kembali.
- Love Match mengungkap satu rekap akhir setelah kedua pemain menyelesaikan seluruh pertanyaan; tidak ada slide reveal per pertanyaan.
- Color Match otomatis berpindah antar lima ronde dan baru menampilkan satu halaman rekap dengan lima kartu warna pada akhir permainan. Skor total ditampilkan sebagai rata-rata akurasi.
- IQ Duel tetap memakai satu rekap akhir dengan kartu skor pemain dan daftar jawaban/pembahasan seluruh soal.
- Firebase Rules v0.46.0 membatasi Ready/Start berdasarkan presence online untuk tiga game ini dan mengizinkan pembacaan silang tebakan Color Match hanya pada fase scoring/finished.


## Love Match

- 20 pertanyaan orisinal pada empat dimensi: I/E, S/N, T/F, J/P.
- Mode dua perangkat: masing-masing menjawab secara privat. Jawaban pasangan baru dapat dibaca setelah keduanya menyelesaikan tes dan fase publik berubah ke `reveal` atau `result`.
- Mode satu perangkat: Pemain 1 menjawab lebih dulu, lalu layar serah-terima menyembunyikan jawabannya sebelum Pemain 2 menjawab.
- Skor merupakan persentase jawaban yang sama, bukan ukuran ilmiah hubungan atau diagnosis psikologis. Profil hanya refleksi ringan untuk memulai percakapan.

## Color Match

- Lima ronde. Target warna ditampilkan beberapa detik berdasarkan tingkat kesulitan: Santai 5,2 detik, Sedang 3,6 detik, Sulit 2,3 detik.
- Mode Versus: kedua pemain melihat target yang sama lalu mengatur slider RGB masing-masing.
- Mode Duet: host menjadi pemberi petunjuk dan tetap melihat warna; guest menyusun warna dari petunjuk suara/chat. Angka RGB tidak ditampilkan kepada guest sebelum hasil dibuka.
- Mode satu perangkat adalah latihan solo dengan lima ronde. Skor merupakan rata-rata akurasi RGB.

## IQ Duel

- Bank 30 soal orisinal: matriks pola 3 × 3, pola, deret, logika, hitung cepat, dan analogi.
- Pilihan kampanye 12 atau 20 ronde, 30 detik per soal. Keduanya menerima urutan soal acak deterministik yang sama di dua perangkat.
- Jawaban disimpan per pemain di `privateRooms`. Kunci jawaban dan pembahasan baru dipublikasikan pada fase `result`.
- Mode satu perangkat adalah latihan solo 12 atau 20 ronde.

## Privasi dan Firebase

Mini game memakai Firebase Anonymous Auth dan room/session ID yang sudah digunakan Diri. Playroom Date. Jawaban Love Match dan IQ Duel tetap di jalur privat per UID sampai fase pengungkapan. Tebakan Color Match disimpan privat; target Duet hanya berada di private path host, sedangkan target Versus ditampilkan pada fase preview sesuai aturan game.

**Penting untuk deployment:** terbitkan ulang `firebase-database.rules.json` dari build ini di Firebase Console → Realtime Database → Rules. Rules baru mengizinkan ID game `lovematch`, `colormatch`, `iqduel` dan memberi akses baca silang ke jawaban privat hanya setelah fase hasil yang sesuai. Jangan mengubah database menjadi public read/write.

## Mode Elemental Duo

Elemental Duo tidak tampil di menu utama sejak v0.45.0. Implementasi dan dokumen terdahulu tetap disimpan; sesi lama masih dapat dikenali oleh loader, tetapi opsi untuk membuat sesi baru tidak ditampilkan di landing page.


## Arcade — v0.47.0
- Arcade menambahkan 12 mini-game singkat dalam satu arena Canvas bersama.
- Daftar ronde: Flappy Face, Heart Catcher, Neon Dodge, Noodle Runner, Coin Rush, Bubble Pop, Sky Hop, Laser Lanes, Rocket Flight, Meteor Dodge, Rhythm Tap, Final Sprint.
- Karakter menggunakan foto kamera/galeri terkompresi atau avatar emoji. Foto dipakai pada sesi aktif dan tidak menjadi syarat bermain.
- Lobby memiliki presence/Ready kedua pemain. Di setup game, kedua pemain juga mengonfirmasi avatar; host memulai dengan Insert Coin.
- Kontrol sentuh dan keyboard: kiri, kanan, naik/lompat, turun, aksi. Bubble Pop menggunakan gerak vertikal; Rocket Flight memakai tahan-naik; Rhythm Tap memakai aksi sesuai ketukan.
- Satu kartu rekap menampilkan pemenang/seri, total skor, dan rincian 12 ronde.
