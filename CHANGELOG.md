# Changelog

## v0.10 — editor dan kamera
- Menghilangkan toast kamera berulang setelah fase pengambilan foto selesai; stream kamera dihentikan saat masuk ke transfer/editor.
- Menambahkan filter, kecerahan, kontras, saturasi, dan temperatur pada editor gabungan.
- Menambahkan rotasi 0–360 derajat untuk teks dan stiker pada mode sendiri maupun berdua; rotasi ikut tersimpan di hasil PNG/JPEG.
- Menghapus tombol × yang menempel pada stiker; penghapusan dilakukan melalui tombol terpisah untuk elemen yang dipilih.

# Changelog

## v0.5.0 — Firebase config + camera-first Solo

- Connected `js/firebase.js` to the user's `diri-playroom-date` Firebase Web App configuration.
- Foto Sendiri now follows a camera-first, four-shot workflow: open camera, capture four photos one by one, review the four slots, retake individual shots, then continue to the editor.
- Removed the Solo multi-file gallery upload shortcut so Solo uses the same take-photo-first flow requested by the user.
- The Solo editor opens only after all four camera photos are present; exports and personal gallery actions remain in the editor.
- Updated the unsupported-camera message to explain HTTPS and camera permission requirements.
- Added regression tests for Firebase project configuration and the Solo capture-first flow.

# Changelog — Diri. Playroom Date

## Visual update v0.2.0
- Mengubah elemen hiasan/stiker pada editor menjadi transparan tanpa kartu putih, border, atau bayangan kotak; hasil ekspor PNG/JPEG juga tidak lagi menggambar kotak latar.
- Menambahkan pilihan 16 hiasan langsung dari palet sehingga tidak lagi hanya menambahkan stiker acak.
- Mendesain ulang identitas frame pada pratinjau dan hasil ekspor: Koran dengan masthead/kolom berita, Buronan dengan judul DICARI/stempel merah/kertas usang, Komik dengan efek POW/WOW/halftone, dan Kawaii dengan maskot serta dekorasi mengambang.
- Memperkuat tema lain (Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle) dengan header, material, dan gaya kartu foto yang lebih spesifik.
- Mengubah kartu foto menjadi elemen tematik dengan caption per foto, bukan hanya foto dalam kotak berwarna.
- Menyamakan ornamen tematik yang mengambang pada pratinjau dengan hasil ekspor PNG/JPEG, termasuk posisi khusus untuk tema Buronan, Komik, dan Kawaii.
- Memperluas jarak antar foto pada hasil ekspor agar caption dan ornamen tidak saling bertumpuk.
- Mempertahankan alur mode sendiri/berdua, Firebase Spark, WebRTC/STUN, dan delapan modul game yang sudah ada.

## Foundation v0.1.0
- Menetapkan identitas project baru: **Diri. Playroom Date**.
- Mengubah halaman utama menjadi tiga jalur: Buat Sesi Berdua, Gabung Sesi, dan Foto Sendiri.
- Foto Sendiri membuka Photobooth langsung tanpa room, autentikasi, atau inisialisasi Firebase.
- Firebase baru dimuat saat pengguna memilih Buat/Gabung Sesi.
- Sesi berdua memakai kode enam karakter; setelah Tamu bergabung, Photobooth langsung dimulai tanpa lobi pemilihan game atau tombol Ready manual.
- Membuat konfigurasi Firebase placeholder agar project baru tidak tersambung tanpa sengaja ke project LDR lama.
- Menyimpan resume sesi untuk perangkat yang sama dan memperbaiki jalur keluar Tamu agar Pembuat kembali ke layar undangan.
- Mengganti merek/metadata menjadi Diri. Playroom Date.
- Menggunakan kembali modul Photobooth dan 16 desain frame dari review build v1.2.
- Mempertahankan source delapan mini-game dari build v1.2 sebagai basis tahap berikutnya; menu game belum dibuka pada fondasi ini.

## Baseline reused — LDR Playroom Review Build v1.2
- 16 frame Photobooth tematik dengan ornamen lokal.
- Editor teks/stiker drag-and-drop untuk mouse dan layar sentuh.
- Kamera, impor galeri, empat foto pribadi, retake, dan pratinjau.
- Ekspor PNG/JPEG, cetak, dan galeri pribadi lokal.
- Fotobooth Berdua dengan satu pengaturan bersama, transfer WebRTC/STUN dan fallback manual, pratinjau gabungan delapan foto, retake bersama, dan persetujuan akhir.
- Fondasi Firebase room, autentikasi anonim, dan Rules.
- Delapan modul mini-game dan unit test logikanya.


## v0.3.0 — Editor langsung pada foto
- Menghapus toolbar panah dan kontrol A+/A− dari editor hiasan.
- Drag langsung pada pratinjau untuk memindahkan teks/stiker.
- Tarik pegangan ↘ pada elemen terpilih untuk mengubah ukuran langsung di pratinjau.
- Cubit dua jari (pinch) pada pratinjau untuk mengubah ukuran di HP/tablet.
- Roda mouse di atas teks/stiker mengubah ukuran pada desktop.
- Tanda × muncul pada elemen terpilih untuk menghapusnya tanpa toolbar.
- Skala ekspor PNG/JPEG diselaraskan dengan ukuran teks dan stiker pada pratinjau.
- Menambahkan tes regresi untuk memastikan toolbar lama tidak muncul dan gesture resize tetap tersedia.

## v0.4.0 — Stabilitas kamera HP dan sesi bersama
- Memperbaiki race condition saat Firebase memperbarui sesi dan mengganti elemen video ketika permintaan `play()` kamera masih berjalan.
- Menambahkan mekanisme retry untuk `AbortError` / pesan `play() request was interrupted by a new load request`, dengan mencoba kembali pada elemen video terbaru di DOM.
- Menggunakan token permintaan kamera agar stream yang terlambat datang setelah pengguna keluar tidak dipasang ke sesi yang sudah ditutup.
- Menyatukan proses pemasangan stream kamera dan menghindari pemanggilan `play()` ganda yang saling mengganggu.
- Mengaktifkan tombol ambil foto hanya setelah video terbaru benar-benar memiliki dimensi gambar.
- Menambahkan tes regresi untuk jalur interupsi `play()` akibat pembaruan DOM.

## v0.6 — Frame lebih unik
- Menambahkan Dunia Mainan: latar langit, ubin warna-warni, maskot alien orisinal, awan, bintang, dan bingkai foto berlapis bentuk organik.
- Menambahkan Polaroid Sosial: latar kuning hangat, kartu foto putih miring, ruang caption, dan aksen ikon hati/simpan.
- Pratinjau katalog, strip pribadi, strip berdua, dan ekspor Canvas memakai identitas tema yang sama.
- Semua ilustrasi karakter dibuat orisinal; tidak menggunakan karakter, logo, atau aset Toy Story/Instagram.

## v0.6 — Frame lebih unik dan ekspresif
- Menambahkan **Dunia Mainan** dengan langit, papan ubin, pita warna, awan, bintang, dan maskot alien orisinal.
- Menambahkan **Polaroid Sosial** dengan latar kuning, kartu foto putih bergaya instan yang miring bergantian, caption, serta ikon hati/simpan.
- Pratinjau pribadi, berdua, katalog, dan hasil Canvas memakai identitas desain yang konsisten.
- Tidak menggunakan karakter Toy Story, logo Instagram, atau aset pihak ketiga.


## v0.7.0 — Perbaikan hasil unduhan dan alur Photobooth
- Memperbaiki bug ekspor: beberapa fungsi bingkai (terutama Dunia Mainan dan Polaroid Sosial, juga Koran/Buronan/Komik/Film/Botani/Kawaii) sebelumnya menggambar bidang putih setelah foto, sehingga foto tertutup dan file hasil unduhan tampak kosong. Bingkai kini hanya menggambar tepi/ornamen di atas foto, bukan menutup area foto.
- Menambahkan validasi empat foto sebelum ekspor; hasil Blob kosong sekarang ditolak dengan pesan yang jelas, bukan disimpan sebagai file kosong.
- Memperkuat unduhan di browser mobile dengan menambahkan tautan unduh ke dokumen dan memberi waktu lebih lama sebelum URL sementara dilepas.
- Menyamakan alur Foto Sendiri menjadi: pilih bingkai → ambil empat foto → editor emoji/teks → unduh atau simpan.
- Fotobooth Berdua tetap mengikuti alur: pilih bingkai/pengaturan bersama → masing-masing mengambil empat foto → pratinjau gabungan → editor emoji/teks bersama → persetujuan → unduh/cetak.
- Emoji/stiker tetap tanpa kotak latar; dapat dipindah dan diubah ukurannya langsung pada pratinjau.
- Menambahkan tes regresi untuk mencegah bingkai menutupi foto dan memastikan urutan alur pada mode pribadi maupun berdua.

## v0.7 — Perbaikan foto ekspor dan penyamaan alur

- Memperbaiki akar masalah file unduhan kosong: bingkai foto bertema sebelumnya menggambar bidang putih/krem setelah foto sehingga foto tertutup. Seluruh dekorasi post-photo kini hanya menggambar garis, bayangan, dan ornamen tanpa menimpa bidang gambar.
- Ekspor sekarang memuat foto dari data URL, object URL, atau Blob pada mode pribadi dan berpasangan.
- Ekspor memvalidasi bahwa 4 foto pribadi atau 8 foto pasangan benar-benar berhasil digambar; jika tidak, proses unduh dibatalkan dengan pesan yang jelas, bukan menghasilkan frame kosong.
- Alur mode pribadi: pilih bingkai → ambil empat foto → editor/hiasan → unduh.
- Alur berpasangan: pilih bingkai bersama → masing-masing ambil empat foto → transfer dan pratinjau gabungan → editor bersama → persetujuan → unduh/cetak.
- Pengambilan foto standar mode berpasangan menggunakan kamera, bukan unggah empat foto dari galeri. Pemindahan manual tetap tersedia hanya sebagai fallback transfer ketika koneksi langsung gagal.


## v0.8.0 — Perbaikan pratinjau empat foto
- Normalisasi sumber foto untuk thumbnail editor Foto Sendiri (data URL, url, dataUrl, src, data).
- Setiap slot editor menampilkan thumbnail atau pesan slot yang jelas; tidak lagi hanya menampilkan angka tanpa konteks.
- Menambahkan gaya thumbnail khusus agar gambar tidak runtuh/tersembunyi pada layar kecil.
- Pengambilan kamera menunggu frame video terdekode sebelum menyimpan hasil.
- Memvalidasi hasil foto sebagai gambar yang benar sebelum slot diisi.


## v0.9.0 — Transfer foto berdua yang lebih tangguh
- Mempertahankan WebRTC DataChannel sebagai jalur transfer langsung, tetapi menambahkan Firebase Realtime Database sebagai jalur relay otomatis jika koneksi langsung gagal atau macet.
- Menghapus pemindahan manual delapan file dari alur normal; sesi lama berfase `manual` dimigrasikan ke relay otomatis saat kedua pemain sudah mengonfirmasi empat foto.
- Foto relay dikompres menjadi JPEG maksimum 256 KiB per foto, diunggah per slot dengan ID transfer unik, lalu diterima kembali secara otomatis oleh pasangan.
- Setiap payload divalidasi berdasarkan peran, nomor slot, tipe MIME, ukuran, dan SHA-256. Foto hanya digunakan setelah checksum cocok.
- Kedua perangkat menyimpan foto ke IndexedDB lokal dan mengirim ACK; editor dibuka hanya setelah kedua ACK berisi empat foto diterima.
- Data relay dihapus setelah kedua perangkat mengonfirmasi penyimpanan.
- Penulisan RTDB mencoba ulang saat koneksi terputus, menunggu `.info/connected`, dan memantau pemulihan Firebase meskipun browser tidak mengirim event `online`.
- Transfer WebRTC kini meminta ACK untuk setiap foto dan membandingkan SHA-256 penerima dengan file pengirim. Kegagalan kanal menutup DataChannel sehingga fallback dapat berjalan lebih cepat.
- Firebase Rules menambahkan validasi ukuran, tipe, peran, nomor slot, dan struktur ACK. Rules v0.9 wajib dipublikasikan di Firebase Console.
- Tidak menambahkan Cloud Storage, Cloud Functions, server sendiri, atau TURN berbayar.
