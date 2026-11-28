# LDR Mini Games — v0.48.0

Tiga aktivitas menggunakan room dua perangkat dan menyediakan latihan di satu perangkat. Setiap permainan memakai lobby bersama: host membuat room, guest bergabung, keduanya melihat nama/presence dan menekan Ready, lalu host memulai setelah keduanya online.

## Lobby dan rekap
- Love Match, Color Match, dan IQ Duel menunggu dua perangkat hadir dan siap sebelum game dimulai.
- Tidak ada reveal per soal atau slide hasil. Setiap permainan menampilkan satu kartu/halaman rekap akhir.
- Jawaban tetap privat sampai fase hasil yang sesuai; Firebase Rules membatasi akses silang berdasarkan gameId, sessionId, membership, dan phase.

## Love Match
- Bank berisi **80 pertanyaan orisinal**, 20 untuk masing-masing dimensi I/E, S/N, T/F, dan J/P.
- Setiap sesi memilih **32 pertanyaan** (8 dari tiap dimensi) secara acak dan urutannya diacak.
- Kedua pemain menjawab secara privat. Hasil hanya dibuka setelah keduanya selesai.
- Rekap menampilkan skor kesamaan, kode dan nama tipe, penjelasan kecenderungan, kekuatan, gaya komunikasi, pola hubungan, area pertumbuhan, serta pilihan jawaban masing-masing pasangan untuk setiap pertanyaan.
- Rekap dapat diunduh sebagai JSON (data terstruktur) atau CSV (lembar jawaban dan ringkasan).
- Mode satu perangkat menggunakan alur bergantian dengan layar serah-terima yang menyembunyikan jawaban pemain pertama.
- Interpretasi 16 tipe adalah refleksi ringan untuk percakapan, bukan diagnosis psikologis atau penilaian ilmiah kepribadian.

## Color Match
- Lima ronde. Target RGB baru dibuat secara acak pada awal sesi dan untuk setiap ronde; generator menghindari target yang terlalu mirip dalam satu sesi.
- Mode Versus: kedua pemain melihat target yang sama lalu menyusun kembali warna dengan slider RGB.
- Mode Duet: satu pemain melihat target dan memberi petunjuk, pasangan merekonstruksi warna.
- Kesulitan mengatur durasi preview: Santai 5,2 detik, Sedang 3,6 detik, Sulit 2,3 detik.
- Alur mulai remote memeriksa fase setup, konfigurasi terbaru, dan keberadaan dua pemain sebelum host memulai ronde pertama.
- Hasil lima ronde digabung dalam satu rekap dengan akurasi rata-rata dan kartu perbandingan target/tebakan.

## IQ Duel
- Bank berisi **100 soal orisinal**, seimbang pada lima kategori: pola/matriks, deret, logika, hitung cepat, dan analogi.
- Sesi memilih 12 atau 20 soal secara acak namun seimbang antarkategori; kedua perangkat menerima susunan soal yang sama.
- Setiap soal memiliki empat opsi, batas waktu 30 detik, jawaban benar, dan penjelasan.
- Jawaban pemain disimpan privat. Kunci jawaban dan pembahasan baru dipublikasikan setelah seluruh ronde selesai.
- Rekap menampilkan skor pemain, persentase benar, ringkasan tiap kategori, jawaban kedua pemain, kunci, serta ulasan seluruh soal.
- Mode satu perangkat tersedia untuk latihan solo 12 atau 20 soal.
- Skor IQ bersifat hiburan dan tidak setara dengan tes IQ terstandar/klinis.

## One Tap v0.51.0
- One Tap adalah satu tantangan terbang selama 60 detik.
- Player 1 dan Player 2 memiliki koordinat X yang sama di tengah arena dan memakai satu urutan pipa deterministik yang sama; karakter digambar sedikit berdampingan agar tidak saling menutupi.
- Setiap pemain memiliki gravitasi, posisi vertikal, tiga nyawa, dan skor sendiri. Setiap pipa yang berhasil dilewati memberi 10 poin.
- Tap/klik arena atau tombol TAP untuk mengepak; desktop mendukung Spasi, panah atas, atau W.
- Hasil membandingkan skor/gerbang kedua pemain. Rekap satu kartu muncul saat timer selesai atau kedua pemain kehabisan nyawa.
- Landing One Tap hanya menampilkan Buat Room dan Join Room. Firebase Rules tidak berubah pada v0.51.0.
- Foto avatar dikompres menjadi JPEG 128×128 dengan batas 22 KB; avatar emoji juga tersedia.

## Privasi dan Firebase

Jawaban Love Match dan IQ Duel disimpan per UID pada `privateRooms`. Tebakan Color Match juga disimpan privat; target disimpan pada jalur privat host, dengan aturan tampilan sesuai mode dan fase. Firebase Rules memerlukan keanggotaan room, sessionId aktif, status online saat mulai, dan fase hasil untuk membuka data privat.

**Deployment:** publikasikan ulang seluruh `firebase-database.rules.json` dari build v0.48.0. Jangan mengganti aturan dengan public read/write. Uji dengan dua UID/perangkat nyata setelah Publish.

## Elemental Duo

Elemental Duo tidak tampil di menu utama. Source dan dokumentasi terdahulu tetap disimpan sebagai arsip.
