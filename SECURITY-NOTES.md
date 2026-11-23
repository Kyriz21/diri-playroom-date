# Security and privacy notes — Diri. Playroom Date

## Firebase client configuration

Firebase Web App configuration berada di browser dan tidak setara dengan Admin SDK credential. Akses data dilindungi oleh Realtime Database Security Rules. Jangan menyimpan service-account JSON, private key, password, atau token administrator di repository.

## Room code

Kode room enam karakter berfungsi sebagai kode undangan. Siapa pun yang memperoleh kode dan berhasil autentikasi dapat mencoba bergabung selama slot Guest tersedia. Jangan gunakan room untuk menyimpan password, PIN, informasi finansial, alamat rumah, atau dokumen pribadi.

## Data storage split

- `/rooms`: data keanggotaan, lobby, readiness, presence, dan metadata sesi.
- `/roomGames`: state publik game yang memang perlu dilihat kedua pemain serta WebRTC signaling.
- `/privateRooms`: konten privat per UID, seperti jawaban atau secret word yang dibutuhkan game.
- IndexedDB: koleksi custom lokal, gambar Memory Card, foto sementara, dan Private Gallery.
- Binary gambar/foto tidak dikirim sebagai blob/base64 ke Realtime Database.

## Client-only trust limitation

Paket ini sengaja tidak memakai Cloud Functions atau backend berbayar. Karena itu, beberapa game melakukan validasi atau resolusi di browser pemain yang memegang peran terkait. Security Rules membatasi siapa yang dapat menulis path tertentu, tetapi tidak dapat sepenuhnya mencegah pemain yang memodifikasi browser/devtools untuk memanipulasi perilaku client atau hasil pertandingan. Ini adalah proyek casual dua orang, bukan sistem kompetisi berhadiah atau tempat menyimpan data sensitif.

## TTL and cleanup

Room secara logis kedaluwarsa setelah 24 jam tanpa aktivitas bermakna. Rules menolak operasi setelah batas tersebut. Tidak ada scheduled Cloud Function pada Spark; penghapusan fisik room/media dilakukan opportunistically ketika host kembali atau menjalankan tindakan cleanup. Foto sementara memiliki kebijakan retensi logis 24 jam, tetapi file lokal tidak dapat dihapus dari perangkat yang sedang offline/tidak membuka aplikasi. Private Gallery tidak ikut TTL dan hanya dihapus oleh pengguna di perangkatnya.

## Photobooth

- Kamera hanya diminta setelah pengguna memilih aksi Open camera dan memberikan izin browser.
- Couple Photobooth mengirim file foto langsung melalui WebRTC DataChannel apabila koneksi P2P berhasil.
- Signaling/metadata berada di RTDB; foto tidak disimpan di RTDB.
- STUN-only tidak menjamin koneksi pada semua NAT, firewall, atau jaringan. Paket tidak memakai TURN relay berbayar.
- Jika P2P gagal setelah satu retry, gunakan Manual Transfer di luar website: kedua pemain mengimpor delapan file yang sama dalam urutan Host 1–4 lalu Guest 1–4. SHA-256 digunakan untuk memeriksa file/order yang sama.
- Shared Editor menyinkronkan elemen teks/stiker/posisi, bukan file fotonya. Kedua perangkat harus mempunyai file gambar lokal yang sama agar dapat merender komposisi yang serupa.

## Operational safeguards

- Jangan menambahkan public read/write Rules.
- Gunakan domain HTTPS.
- Periksa room path dan permission errors sebelum mengubah Rules.
- Uji Rules pada project pengembangan sebelum menggunakan data/foto pribadi.
- Berhenti menggunakan room jika UID berubah atau room bukan milik pemain yang sedang login; lakukan recovery melalui Host sesuai kebijakan strict UID.
