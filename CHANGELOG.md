# Changelog — Diri. Playroom Date

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
