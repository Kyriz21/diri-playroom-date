# QA — Diri. Playroom Date foundation v0.1

## Tahap 0 — halaman awal dan mode masuk
- [ ] Identitas halaman menampilkan Diri. Playroom Date.
- [ ] Tombol Buat Sesi Berdua membuka form nama panggilan.
- [ ] Tombol Gabung Sesi membuka form nama dan kode enam karakter.
- [ ] Tombol Foto Sendiri langsung membuka editor Photobooth tanpa Firebase Console/config.
- [ ] Mode Foto Sendiri dapat memilih kamera atau empat foto dari galeri.
- [ ] Kembali dari Foto Sendiri mengembalikan halaman awal.

## Tahap 1 — sesi berdua otomatis
- [ ] Perangkat A membuat sesi dan mendapat kode enam karakter.
- [ ] Perangkat B bergabung menggunakan kode.
- [ ] Setelah pasangan bergabung, kedua perangkat otomatis masuk ke persiapan Photobooth.
- [ ] Tidak ada pemilihan game atau tombol Ready manual pada alur awal ini.
- [ ] Kedua perangkat memakai frame/filter dan pengaturan yang sama secara live.
- [ ] Tamu keluar: Pembuat kembali ke layar undangan dan dapat menerima Tamu baru.
- [ ] Pembuat keluar: sesi ditutup untuk kedua pemain.

---

# Daftar Uji Build Perbaikan — DiRi / LDR Playroom v1.2

Gunakan dua perangkat atau dua profil peramban yang benar-benar berbeda. Tandai setiap langkah hanya setelah berhasil diuji secara nyata. Pemeriksaan otomatis lokal tidak membuktikan bahwa Firebase, kamera, atau jaringan dua perangkat sudah berjalan.

## Pengaturan bersama pada permainan

Enam permainan memiliki tahap pengaturan: **Kuis Cinta, Pilih Salah Satu, Jujur atau Tantangan, Kartu Memori, Gambar dan Tebak, serta Tebak Kata**. Kedua pemain melihat pengaturan yang sama. Perubahan dari salah satu perangkat harus langsung terlihat pada perangkat pasangan. Tidak perlu mengatur dua kali. Setiap perubahan membatalkan persetujuan sebelumnya; permainan baru dapat dimulai setelah keduanya menyetujui pengaturan.

**Tiga Serangkai** dan **Empat Berderet** tidak memiliki tahap pengaturan terpisah. Setelah dipilih di ruang, papan permainan langsung dibuat dan seluruh langkah tersinkron.

## A. Ruang dan sambungan

- [ ] Autentikasi anonim di Firebase aktif.
- [ ] Domain GitHub Pages terdaftar pada domain yang diizinkan di Firebase.
- [ ] Project ID dan URL Realtime Database pada `js/firebase.js` sesuai dengan Firebase Console.
- [ ] Isi `firebase-database.rules.json` berhasil dipublikasikan.
- [ ] Situs dapat dibuka melalui HTTPS di laptop dan HP.
- [ ] Pembuat ruang dapat membuat ruang dan memperoleh kode enam karakter.
- [ ] Tamu dapat bergabung; nama dan status kedua pemain tampil pada kedua perangkat.
- [ ] Pemain ketiga tidak dapat mengambil tempat Tamu.
- [ ] Pilihan permainan harus sama di kedua perangkat.
- [ ] Persetujuan dari satu pemain saja tidak cukup untuk memulai.
- [ ] Setelah kedua pemain menyetujui, Pembuat ruang dapat memulai.
- [ ] Keluar dari Tamu membebaskan tempat Tamu tanpa menutup ruang.
- [ ] Keluar dari Pembuat ruang menutup ruang.
- [ ] Muat ulang halaman dengan identitas yang sama memulihkan ruang.
- [ ] Penyambungan ulang Tamu diuji sebelum dan sesudah masa tunggu lima menit.
- [ ] Ruang kedaluwarsa setelah 24 jam tanpa aktivitas bermakna (gunakan data waktu pada lingkungan uji; tidak perlu menunggu dalam pemakaian biasa).

## B. Tiga Serangkai

- [ ] Simbol kedua pemain berbeda dan papan 3×3 sama pada kedua perangkat.
- [ ] Pemain pertama dipilih secara acak.
- [ ] Pemain yang belum mendapat giliran tidak dapat menaruh simbol.
- [ ] Klik berulang tidak menghasilkan dua langkah sekaligus.
- [ ] Kemenangan mendatar, tegak, dan diagonal terdeteksi.
- [ ] Kondisi seri terdeteksi dan penghitung seri bertambah.
- [ ] Muat ulang halaman memulihkan papan dan giliran.
- [ ] Permainan ulang menunggu persetujuan kedua pemain.

## C. Kuis Cinta

- [ ] Kedua pemain dapat mengubah mode, sumber pertanyaan, jumlah, dan kategori pada satu pengaturan bersama.
- [ ] Perubahan dari salah satu perangkat langsung terlihat pada perangkat pasangan.
- [ ] Perubahan pengaturan membatalkan persetujuan kedua pemain.
- [ ] Mode **Seberapa Kenal Kamu denganku?** dan **Seberapa Cocok Kita?** dapat dipilih.
- [ ] Permainan baru dimulai setelah kedua pemain menyetujui pengaturan.
- [ ] Jumlah pertanyaan dibatasi 1–30 dan nilai awal 10.
- [ ] Setiap pertanyaan menyediakan empat pilihan jawaban.
- [ ] Jawaban pasangan tidak terlihat sebelum keduanya menjawab.
- [ ] Mode saling mengenal menjalankan giliran Pembuat ruang lalu Tamu.
- [ ] Mode kecocokan menampilkan jumlah dan persentase jawaban yang sama.
- [ ] Pertanyaan berikutnya menunggu kedua pemain.
- [ ] Ekspor, impor, dan berbagi koleksi pertanyaan pribadi berfungsi.
- [ ] Permainan ulang memerlukan persetujuan kedua pemain.

## D. Pilih Salah Satu

- [ ] Sumber pertanyaan bawaan DiRi, koleksi pribadi, dan gabungan tersedia.
- [ ] Kategori dapat dipilih dari pengaturan bersama.
- [ ] Jumlah pertanyaan dibatasi 1–30 dan nilai awal 10.
- [ ] Kedua pemain menerima dua pilihan yang sama.
- [ ] Jawaban dibuka bersama setelah keduanya menjawab.
- [ ] Persentase kecocokan dan rentetan jawaban sama dihitung dengan benar.
- [ ] Pertanyaan berikutnya dan permainan ulang menunggu kedua pemain.
- [ ] Ekspor dan impor koleksi pertanyaan pribadi berfungsi.

## E. Jujur atau Tantangan

- [ ] Mode **Pilih sendiri** dan **Tantangan untuk pasangan** tersedia.
- [ ] Pengaturan mode, suasana, sumber kartu, kategori, dan jumlah ronde tersinkron langsung.
- [ ] Pemain yang memilih kartu bergantian.
- [ ] Kartu Jujur dan Tantangan sesuai sumber serta kategori.
- [ ] Setiap pemain memperoleh tiga kesempatan melewati kartu.
- [ ] Melewati kartu hanya mengurangi kesempatan pemain yang dituju.
- [ ] Jawaban Jujur dan penyelesaian Tantangan terlihat pada kedua perangkat.
- [ ] Pemain dapat memilih untuk tidak melanjutkan bila merasa tidak nyaman.
- [ ] Ringkasan sesi dan permainan ulang bekerja.

## F. Kartu Memori

- [ ] Mode **Adu Ingatan** dan **Main Bersama** tersedia.
- [ ] Tingkat Mudah 4×4, Sedang 4×6, dan Sulit 6×6.
- [ ] Tingkat kesulitan dan jenis kartu tersinkron pada kedua perangkat.
- [ ] Kartu dikocok dan setiap gambar/simbol memiliki tepat dua kartu pasangan.
- [ ] Pasangan yang cocok memberi poin pada mode Adu Ingatan dan pemain mempertahankan giliran.
- [ ] Pasangan yang tidak cocok ditutup kembali setelah jeda singkat dan giliran berpindah.
- [ ] Mode Main Bersama menghitung percobaan dan jumlah pasangan yang ditemukan.
- [ ] Untuk Foto Pribadi, kedua perangkat mengimpor file gambar dengan sidik dan urutan yang sama.
- [ ] Jika salah satu pemain belum mengimpor foto, mode bawaan tetap dapat dimainkan; mode Foto Pribadi menolak dimulai sampai kedua daftar cocok.
- [ ] Muat ulang atau sambung ulang memulihkan papan.
- [ ] Permainan ulang menunggu persetujuan kedua pemain.

## G. Empat Berderet

- [ ] Papan terdiri dari tujuh kolom dan enam baris.
- [ ] Keping jatuh ke posisi terbawah yang masih kosong.
- [ ] Pemain pertama dipilih secara acak.
- [ ] Kolom penuh dinonaktifkan dan tidak menerima langkah.
- [ ] Kemenangan mendatar, tegak, serta kedua arah diagonal terdeteksi.
- [ ] Kondisi seri terdeteksi.
- [ ] Muat ulang halaman memulihkan papan dan giliran.
- [ ] Permainan ulang menunggu persetujuan kedua pemain.

## H. Gambar dan Tebak

- [ ] Kesulitan kata dapat diatur bersama dan perubahan langsung tersinkron.
- [ ] Permainan terdiri dari enam ronde, masing-masing 90 detik.
- [ ] Pemain yang menggambar pada ronde pertama dipilih secara acak; peran bergantian pada ronde berikutnya.
- [ ] Kata rahasia hanya terlihat oleh pemain yang menggambar.
- [ ] Kanvas dapat digunakan dengan tetikus dan layar sentuh.
- [ ] Goresan muncul pada perangkat pasangan.
- [ ] Pemain penebak dapat mengirim jawaban.
- [ ] Petunjuk hanya terlihat oleh pemain penebak dan menghilangkan bonus jawaban cepat.
- [ ] Skor diberikan kepada penggambar dan penebak saat jawaban benar; bonus cepat diberikan jika benar dalam 30 detik tanpa petunjuk.
- [ ] Batas waktu, sambungan ulang, pergantian peran, dan permainan ulang diuji.

## I. Tebak Kata

- [ ] Mode **Petunjuk biasa** dan **Kata Terlarang** tersedia.
- [ ] Mode dan tingkat kesulitan tersinkron langsung.
- [ ] Permainan terdiri dari enam ronde, masing-masing 90 detik.
- [ ] Pemberi petunjuk pada ronde pertama dipilih secara acak dan peran bergantian.
- [ ] Kata rahasia dan daftar kata terlarang hanya terlihat oleh pemberi petunjuk.
- [ ] Petunjuk untuk penebak berfungsi dan hanya dapat dipakai sekali per ronde.
- [ ] Setiap pemain memiliki dua kesempatan melewati kata sepanjang permainan.
- [ ] Jawaban harus cocok dengan kata rahasia atau jawaban alternatif yang didaftarkan.
- [ ] Pemeriksaan kata terlarang mengabaikan perbedaan huruf besar/kecil dan tanda baca, tetapi tetap memeriksa batas kata utuh.
- [ ] Lewati kata, menyerah, skor, batas waktu, sambungan ulang, dan permainan ulang diuji.

## J. Fotobooth Sendiri

- [ ] Mode Fotobooth Sendiri dapat dibuka.
- [ ] Kamera hanya aktif setelah izin diberikan.
- [ ] Jika kamera tidak tersedia, empat foto dapat dipilih dari galeri perangkat.
- [ ] Katalog 16 bingkai menampilkan contoh yang berbeda untuk tema Koran, Buronan, Komik, Sinema, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Kawaii, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- [ ] Setiap frame memiliki ornamen, bentuk border, dan tipografi yang terlihat pada hasil akhir, bukan hanya perbedaan warna.
- [ ] Tambahkan teks dan stiker, lalu seret langsung dengan mouse.
- [ ] Ulangi drag menggunakan layar sentuh HP.
- [ ] Pastikan elemen tetap berada dalam kanvas setelah digeser.
- [ ] Pastikan posisi elemen yang tampil pada pratinjau sama dengan hasil PNG/JPEG/cetak.
- [ ] Gunakan cubit dua jari untuk mengubah ukuran dan putar dua jari untuk merotasi elemen; hapus melalui tombol terpisah di panel editor.
- [ ] Filter dan pengaturan kecerahan, kontras, warna, serta temperatur dapat digunakan.
- [ ] Stiker dan teks terlihat pada pratinjau.
- [ ] PNG dan JPEG dapat diunduh.
- [ ] Galeri Pribadi dapat menyimpan dan menghapus hasil pada perangkat lokal.

## K. Fotobooth Berdua

- [ ] Kedua pemain memilih Fotobooth Berdua dari ruang yang sama.
- [ ] Hanya ada satu pilihan bingkai bersama; perubahan dari salah satu perangkat langsung terlihat di perangkat pasangan.
- [ ] Katalog 16 bingkai menampilkan contoh visual berbeda sebelum dipilih.
- [ ] Teks dan stiker dapat diseret langsung di pratinjau pada laptop dan HP; posisi tetap cocok saat diekspor.
- [ ] Filter, kecerahan, kontras, warna, dan temperatur yang diubah dari salah satu perangkat tersinkron pada kedua perangkat.
- [ ] Kedua pemain menyatakan siap sebelum kamera/foto masuk ke tahap pengambilan.
- [ ] Kamera dapat dibuka pada masing-masing perangkat.
- [ ] Tombol Ambil foto mengisi slot kosong pertama, termasuk foto pertama pada slot 1.
- [ ] Empat foto setiap pemain tampil sebagai pratinjau pada perangkatnya.
- [ ] Setiap foto dapat diulang sebelum konfirmasi empat foto.
- [ ] Setelah kedua pemain mengonfirmasi, transfer langsung antarpiranti dicoba.
- [ ] Transfer langsung diuji pada jaringan berbeda; foto diterima utuh jika koneksi berhasil.
- [ ] Jika koneksi langsung gagal atau DataChannel macet, aplikasi otomatis beralih ke Firebase Realtime Database tanpa meminta delapan file secara manual.
- [ ] Foto lokal dikompres menjadi JPEG maksimum 256 KiB sebelum relay.
- [ ] Progress unggah dan unduh diperbarui di kedua perangkat.
- [ ] Foto diterima dengan urutan Pembuat ruang 1–4 dan Tamu 1–4.
- [ ] Tipe, ukuran, peran, nomor slot, dan SHA-256 diperiksa sebelum foto digunakan.
- [ ] Setiap transfer menunggu tanda terima dari kedua perangkat sebelum editor dibuka.
- [ ] Putuskan internet sementara di salah satu perangkat, pulihkan koneksi, lalu pastikan transfer melanjutkan tanpa memilih file lagi.
- [ ] Muat ulang satu perangkat saat fase relay dan pastikan foto lokal dipulihkan dari IndexedDB serta transfer dapat dilanjutkan.
- [ ] Uji Firebase Rules v0.10 yang sudah dipublikasikan; permission denied harus menampilkan instruksi Rules, bukan menggantung tanpa penjelasan.
- [ ] Setelah kedua ACK diterima, node transfer foto sementara di RTDB terhapus.
- [ ] Pratinjau gabungan delapan foto tampil pada kedua perangkat sebelum persetujuan akhir.
- [ ] Foto tertentu dapat diminta untuk diulang dan perlu persetujuan pasangan.
- [ ] Kedua pemain menyetujui pratinjau sebelum unduh, simpan, atau cetak tersedia.
- [ ] PNG/JPEG dapat diunduh dan hasil dapat dicetak melalui dialog cetak peramban.
- [ ] Galeri Pribadi lokal dapat menyimpan hasil pada masing-masing perangkat.
- [ ] Pengambilan ulang seluruh foto memerlukan persetujuan kedua pemain.
- [ ] Pada jalur WebRTC, foto tidak disimpan ke RTDB. Pada fallback, foto hanya muncul sementara di node relay dan dihapus setelah ACK kedua perangkat.

## L. Tampilan dan pemeriksaan akhir

- [ ] Uji lebar layar 320–430 piksel.
- [ ] Tombol mudah disentuh dan papan tidak terpotong.
- [ ] Papan, formulir, dan galeri tidak menyebabkan gulir horizontal.
- [ ] Tombol kembali, keluar, setujui, kirim jawaban, dan lewati berfungsi.
- [ ] Dua mini-game aktif (Gambar Bareng dan Tebak Pasangan) membuka permainan yang benar.
- [ ] Muat ulang tidak menghapus sesi yang seharusnya bisa dipulihkan.
- [ ] Listener, kamera, dan koneksi antarpiranti dibersihkan ketika meninggalkan sesi.

## Catatan hasil pengujian

- Perangkat Pembuat ruang:
- Perangkat Tamu:
- Tanggal pengujian:
- Peramban dan versi:
- Versi Aturan Realtime Database:

Temuan:

- [ ] Tidak ada kendala penghambat utama.
- [ ] Kendala lain dicatat dan diprioritaskan sebelum penggunaan rutin.


## Editor hiasan langsung — v0.3
- [ ] Tidak ada tombol panah atau A+/A− di bawah pratinjau.
- [ ] Seret hiasan di pratinjau untuk memindahkan.
- [ ] Tidak ada pegangan panah atau lingkaran pembesar pada hiasan.
- [ ] Cubit dua jari pada area pratinjau untuk mengubah ukuran hiasan di HP/tablet.
- [ ] Putar dua jari pada area pratinjau untuk merotasi hiasan 0–360 derajat.
- [ ] Putar roda mouse saat kursor di atas hiasan untuk mengubah ukuran di desktop.
- [ ] Tombol hapus hanya berada di panel editor dan menghapus elemen yang dipilih.
- [ ] Hasil PNG/JPEG mempertahankan posisi serta ukuran teks/stiker.
- [ ] Pada mode berdua, perubahan posisi/ukuran tersimpan dan terlihat di perangkat pasangan setelah interaksi selesai.


## v0.11 editor gesture checks
- [ ] Select a sticker/text and drag with one finger to move it.
- [ ] Use two fingers: pinch apart/together to resize.
- [ ] Rotate two fingers around each other to rotate through 0–360 degrees.
- [ ] Confirm no arrow handle or white resize bubble appears on the photo.
- [ ] Delete the selected item only using the separate editor-panel button.
- [ ] Verify exported PNG/JPEG retains the element size and rotation.

## M. Tebak Pasangan (v0.14)

- [ ] Buat sesi Tebak Pasangan dari perangkat host; pastikan catatan ronde pertama berhasil dibuat dan memuat matchKey.
- [ ] Gabung menggunakan kode dari perangkat guest; pastikan game yang terbuka adalah Tebak Pasangan.
- [ ] Kedua perangkat menerima nomor ronde, prompt, peran, dan timer yang sama.
- [ ] Ronde 1: host menjawab, guest menebak.
- [ ] Ronde 2: guest menjawab, host menebak.
- [ ] Jawaban asli tidak terlihat oleh pasangan sebelum kedua pihak mengunci dan fase reveal.
- [ ] Setelah reveal, kedua perangkat melihat jawaban asli dan tebakan yang benar.
- [ ] Hanya pemain yang menjawab dapat memberi penilaian.
- [ ] Uji Tepat (2 poin), Hampir (1 poin), dan Meleset (0 poin); pastikan poin diberikan kepada penebak.
- [ ] Kedua pemain dapat menekan Lanjutkan; status keduanya tersinkron.
- [ ] Uji batas waktu 60 detik dan perpindahan ke reveal.
- [ ] Uji timeout penilaian 20 detik dan lanjut otomatis 12 detik.
- [ ] Selesaikan enam ronde; skor dan rangkuman harus benar pada kedua perangkat.
- [ ] Main lagi hanya dimulai setelah host dan guest sama-sama menyetujui.
- [ ] Muat ulang masing-masing perangkat saat fase playing, reveal, round-result, dan result-game; pastikan status dipulihkan.
- [ ] Pastikan Firebase Rules v0.14 telah dipublikasikan dan tidak ada `PERMISSION_DENIED`.


## L. Bomb Storm

- [ ] Buat sesi Bomb Storm dan gabung dari perangkat kedua; kedua perangkat membuka game yang sama.
- [ ] Ambil selfie/pilih foto pada masing-masing HP; avatar pasangan muncul dan foto yang disimpan merupakan JPEG kecil, bukan foto asli resolusi penuh.
- [ ] Tanpa memilih foto, avatar bawaan tetap dapat digunakan.
- [ ] Kedua pemain menekan siap; hitung mundur mulai dengan waktu start bersama.
- [ ] Kedua perangkat melihat susunan dan gerakan bom/hati yang sama.
- [ ] Slider posisi, tombol kiri/kanan, sentuhan langsung pada arena, serta keyboard panah menggerakkan karakter pemiliknya.
- [ ] Gerakan pemain pertama terlihat pada perangkat kedua dan sebaliknya.
- [ ] Menyentuh hati menambah 10 poin satu kali; terkena bom mengurangi satu nyawa satu kali.
- [ ] Nyawa berhenti di nol; pemain yang kehabisan nyawa tidak lagi bergerak.
- [ ] Ronde berakhir setelah 60 detik dan objek jatuh terakhir selesai diproses, atau kedua pemain telah selesai.
- [ ] Kedua perangkat menampilkan skor dan pemenang/seri yang sama.
- [ ] Rematch hanya berjalan setelah kedua pemain setuju; avatar tetap dipakai, skor/nyawa/posisi direset, seed baru dibuat, dan kedua pemain perlu siap lagi.
- [ ] Muat ulang salah satu perangkat selama lobby/playing/result; status ronde dan skor tersimpan dipulihkan.
- [ ] Rules menolak perangkat menulis profil, avatar, skor, atau posisi role pemain lain.
- [ ] Avatar tidak ikut terkirim ulang pada setiap pembaruan posisi; hanya node avatar yang berubah saat pengguna mengganti foto.


## Bomb Storm v0.19 — regression checks
- [ ] Gerakan karakter sendiri tetap halus saat menggeser slider atau arena.
- [ ] Gerakan karakter pasangan tidak berpindah mendadak saat update Firebase diterima.
- [ ] Mengambil hati menampilkan pantulan karakter, `+10`, ikon hati, dan partikel pada kedua perangkat.
- [ ] Terkena bom menampilkan squash/shake, cincin benturan, dan `-1 NYAWA` pada kedua perangkat.
- [ ] Animasi tidak mengubah posisi gameplay, skor, atau hitbox selain dampak yang sudah dihitung.
- [ ] Rematch menghentikan efek ronde lama dan memulai animasi dari keadaan bersih.


## Balloon Pop — checklist uji dua perangkat
- [ ] Buat sesi Balloon Pop dari HP pertama.
- [ ] Gabung dari HP kedua dan pastikan activity yang terbuka Balloon Pop.
- [ ] Pilih karakter berbeda pada kedua perangkat; avatar tampil di kedua papan.
- [ ] Kedua pemain menekan Siap dan hitung mundur dimulai bersamaan.
- [ ] Ketuk balon biasa dan pastikan +1.
- [ ] Ketuk balon hati dan pastikan +5.
- [ ] Ketuk balon emas dan pastikan +10.
- [ ] Ketuk bom dan pastikan satu nyawa berkurang.
- [ ] Ketuk ID balon yang sama dua kali dengan cepat dan pastikan poin hanya masuk sekali.
- [ ] Pastikan papan pasangan memperbarui skor dan balon yang sudah pecah secara live.
- [ ] Pastikan hasil akhir menampilkan skor yang sama pada kedua perangkat.
- [ ] Uji rematch dan pastikan skor/nyawa reset setelah kedua pemain setuju.

**Pemasangan:** v0.20 menambah path Rules `balloonPop` dan `balloonPopAvatars`. Publikasikan ulang seluruh `firebase-database.rules.json` dari ZIP v0.20 sebelum uji Firebase dua perangkat.


## Balloon Pop v0.20 — regression checks
- Seed ronde menghasilkan balon yang sama pada dua perangkat.
- Setiap perangkat hanya dapat mengetuk papan yang menjadi miliknya.
- Hit ID diproses satu kali melalui transaksi Firebase untuk mencegah skor ganda.
- Balon normal +1, hati +5, emas +10, bom -1 nyawa.
- Stats pemain dibaca live oleh kedua perangkat.
- Timer 60 detik dan grace period memberi waktu bagi balon terakhir untuk keluar dari area permainan.
- Rematch memerlukan permintaan dari kedua pemain dan mereset stats lokal setiap peran.
- Avatar bawaan/kamera/galeri tampil pada header papan dan hasil.
- Rules v0.20 wajib dipublikasikan sebelum pengujian Firebase.
