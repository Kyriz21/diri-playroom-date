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
