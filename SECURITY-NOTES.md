# Security and privacy notes — Diri. Playroom Date

## Firebase client configuration

Firebase Web App configuration berada di browser dan tidak setara dengan Admin SDK credential. Akses data dilindungi oleh Realtime Database Security Rules. Jangan menyimpan service-account JSON, private key, password, atau token administrator di repository.

## Room code

Kode room enam karakter berfungsi sebagai kode undangan. Siapa pun yang memperoleh kode dan berhasil autentikasi dapat mencoba bergabung selama slot Guest tersedia. Jangan gunakan room untuk menyimpan password, PIN, informasi finansial, alamat rumah, atau dokumen pribadi.

## Data storage split

- `/rooms`: data keanggotaan, lobby, readiness, presence, dan metadata sesi.
- `/roomGames`: state publik game yang memang perlu dilihat kedua pemain, WebRTC signaling, serta relay foto sementara terbatas untuk sesi Photobooth.
- `/privateRooms`: konten privat per UID, seperti jawaban atau secret word yang dibutuhkan game.
- IndexedDB: koleksi custom lokal, gambar Memory Card, foto sementara, dan Private Gallery.
- Foto mode pribadi disimpan di IndexedDB lokal.
- Pada sesi berdua, WebRTC DataChannel menjadi jalur utama. Jika gagal, foto JPEG terkompresi (maksimum 256 KiB per foto) dikirim sementara sebagai Data URL melalui RTDB relay.
- Payload relay memuat peran, nomor slot, ukuran byte, tipe MIME, dan SHA-256. Penerima memverifikasi semua bidang dan menyimpan Blob ke IndexedDB sebelum memberi ACK.
- Relay dihapus setelah kedua perangkat menyimpan foto dan mengirim ACK. Jika kedua perangkat menutup browser sebelum ACK, data relay mungkin tertinggal; sesi berikutnya/cleanup host dapat menghapusnya.

## Client-only trust limitation

Paket ini sengaja tidak memakai Cloud Functions atau backend berbayar. Karena itu, beberapa game melakukan validasi atau resolusi di browser pemain yang memegang peran terkait. Security Rules membatasi siapa yang dapat menulis path tertentu, tetapi tidak dapat sepenuhnya mencegah pemain yang memodifikasi browser/devtools untuk memanipulasi perilaku client atau hasil pertandingan. Ini adalah proyek casual dua orang, bukan sistem kompetisi berhadiah atau tempat menyimpan data sensitif.

## TTL and cleanup

Room secara logis kedaluwarsa setelah 24 jam tanpa aktivitas bermakna. Rules menolak operasi setelah batas tersebut. Tidak ada scheduled Cloud Function pada Spark; penghapusan fisik room/media dilakukan opportunistically ketika host kembali atau menjalankan tindakan cleanup. Foto sementara memiliki kebijakan retensi logis 24 jam, tetapi file lokal tidak dapat dihapus dari perangkat yang sedang offline/tidak membuka aplikasi. Private Gallery tidak ikut TTL dan hanya dihapus oleh pengguna di perangkatnya.

## Photobooth

- Kamera hanya diminta setelah pengguna memilih aksi Open camera dan memberikan izin browser.
- Couple Photobooth mencoba WebRTC DataChannel terlebih dahulu. Setiap file menunggu ACK penerima dengan checksum SHA-256 yang cocok.
- STUN-only tidak menjamin koneksi pada semua NAT, firewall, atau jaringan; TURN relay berbayar tidak disertakan.
- Jika koneksi langsung gagal atau macet, kedua klien otomatis menggunakan Firebase Realtime Database sebagai relay sementara. Pengguna tidak diminta memilih delapan file secara manual.
- Foto relay adalah JPEG maksimum 256 KiB per file. Penerima memvalidasi peran, nomor slot, tipe, ukuran, dan SHA-256 sebelum menyimpan file ke IndexedDB.
- Kedua perangkat harus mengirim ACK setelah menyimpan empat foto pasangan. Editor baru dibuka setelah kedua ACK diterima. Data relay dihapus setelahnya.
- Relay memerlukan Firebase Rules v0.9 yang dipublikasikan. Jika Rules belum diperbarui, Firebase dapat menolak penulisan.
- Jika seluruh akses internet/Firebase terputus, transfer tidak dapat diselesaikan saat offline. Foto tetap tersimpan lokal dan transfer dapat dicoba ulang setelah koneksi kembali.
- Shared Editor menyinkronkan elemen teks/stiker/posisi; foto tersedia di lokal kedua perangkat setelah transfer dan ACK berhasil.

## Operational safeguards

- Jangan menambahkan public read/write Rules.
- Gunakan domain HTTPS.
- Periksa room path dan permission errors sebelum mengubah Rules.
- Uji Rules pada project pengembangan sebelum menggunakan data/foto pribadi.
- Berhenti menggunakan room jika UID berubah atau room bukan milik pemain yang sedang login; lakukan recovery melalui Host sesuai kebijakan strict UID.
