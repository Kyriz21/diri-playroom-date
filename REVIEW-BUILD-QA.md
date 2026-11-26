# QA — Diri. Playroom Date v0.39.0

## Hasil verifikasi otomatis v0.39.0
- 193/193 tes lulus.
- JavaScript syntax check lulus pada seluruh folder `js/`.
- 5 level prototype memakai 10 pola ruang terstruktur; platform, spawn, pijakan, permata, pintu, dan checkpoint diperiksa.
- Jump speed 280/gravity 1300 dan tier gap24 diperiksa menggunakan jump envelope.
- Analog diuji hanya mengubah kiri/kanan; input vertikal tidak memicu jump buffer; tombol LOMPAT tetap menjadi jalur lompat.
- MapVersion 14; Firebase Rules tidak berubah.
- Landscape CSS/UI dipertahankan.

## Playtest manual yang tetap diperlukan
- Coba level 1 dan 2 pada dua HP; pastikan kedua karakter bisa melompat antarplatform dengan tinggi yang terasa wajar.
- Coba analog: gerakkan kiri/kanan, geser jari ke atas/bawah dan pastikan karakter tidak melompat; tekan tombol LOMPAT untuk lompat.
- Uji pijakan, katup/tuas, permata, pintu pasangan, checkpoint, dan transisi level.
- Uji mode landscape/fullscreen pada perangkat aktual dan periksa kontrol tidak tertutup UI sistem.

---

---

# QA — Diri. Playroom Date v0.33.0

## Elemental Duo — full exploration map regression
- [ ] Level 01–50 dibuka dari room Firebase dengan kedua pemain siap.
- [ ] Gerakkan kedua karakter ke kiri/kanan dan jelajahi platform atas/bawah; pastikan kamera masing-masing mengikuti karakter lokal.
- [ ] Buka peta mini: posisi Bara/Nira, pintu dua elemen, sakelar, permata, hazard, dan kamera harus terlihat.
- [ ] Saat pintu di luar layar, penunjuk arah mengarah ke pintu karakter yang benar.
- [ ] Uji jalur cabang dan empat shortcut loop; pastikan karakter dapat jatuh/naik tanpa terjebak.
- [ ] Pastikan pintu tidak selalu berada di kanan dan kedua pemain tetap masuk pintu elemennya sendiri.
- [ ] Uji Mode Potret dan Layar Penuh pada HP; cek minimap tidak menutupi kontrol atau objek penting.
- [ ] Uji sakelar, katup, tuas angin, hazard, dan progres dunia lama tetap berfungsi.
- [ ] Refresh salah satu HP saat bermain; verifikasi versi map 6 memindahkan posisi lama ke spawn tanpa menghapus progres level.
- [ ] Mainkan beberapa level sampai transisi dan penyelesaian bersama terkonfirmasi pada kedua perangkat.
- [ ] Uji jarak antarpijakan pada semua bentuk peta; pastikan platform tidak bersentuhan atau terlihat menyatu.
- [ ] Uji mode landscape pada browser HP: panel mengisi layar, kontrol analog transparan dapat digeser, tombol INTERAKSI/LOMPAT berfungsi.
- [ ] Ganti Analog ↔ Tombol dari kontrol mode dan pastikan input kiri/kanan tidak tertahan.
- [ ] Gulir/biarkan browser menyembunyikan bilah alamat; canvas tidak berkedip atau mengubah framing berulang.

## Hasil verifikasi otomatis v0.33.0
- 191/191 tests passed.
- Semua file JavaScript lolos `node --check`.
- Semua platform pada 50 map lolos uji reachability geometri dari kedua spawn.
- Firebase Rules tidak berubah.

---

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


## v0.21 — Arcade notifikasi, hasil eliminasi, Rematch, dan webcam
- [ ] Pada HP, notifikasi Bomb Storm muncul ringkas di bawah header dan tidak menutupi arena atau kontrol.
- [ ] Pada HP, notifikasi Balloon Pop muncul ringkas di bawah header dan tidak menutupi papan balon.
- [ ] Di PC, klik **Ambil foto** pada Bomb Storm membuka dialog webcam dan browser meminta izin kamera; tidak membuka file picker.
- [ ] Di PC, klik **Pilih dari galeri** tetap membuka file picker.
- [ ] Ulangi uji kamera dan galeri pada Balloon Pop.
- [ ] Pada Balloon Pop, ketika host kehilangan nyawa terakhir sementara guest masih memiliki nyawa, fase hasil segera muncul dan guest dinyatakan menang.
- [ ] Ulangi dengan guest kehabisan nyawa; host harus menang.
- [ ] Jika kedua pemain kehilangan nyawa pada saat sama, skor menjadi penentu hasil.
- [ ] Panel hasil Balloon Pop menampilkan tombol **Main lagi** di kedua perangkat. Ronde baru dimulai hanya setelah kedua pemain menyetujui rematch.
- [ ] Pastikan hasil dan rematch tetap sinkron ketika satu perangkat melakukan refresh.

**Pemasangan v0.21:** publikasikan seluruh `firebase-database.rules.json` v0.21 karena aturan transisi hasil Balloon Pop berubah untuk mendukung eliminasi dini. Konfigurasi Firebase Web App tidak berubah.


## Elemental Duo — checklist dua perangkat v0.22

- [ ] Buat sesi Elemental Duo pada perangkat host dan gabung dengan kode pada perangkat kedua.
- [ ] Pastikan host menjadi Bara dan guest menjadi Nira.
- [ ] Tekan siap pada kedua perangkat; pastikan kedua perangkat masuk level 1.
- [ ] Uji gerak kiri/kanan dan lompat dengan keyboard desktop.
- [ ] Uji tombol kiri/kanan, lompat, dan aksi pada HP.
- [ ] Pastikan posisi karakter pasangan bergerak halus dan tidak tertinggal jauh.
- [ ] Pastikan Bara hanya mengaktifkan simpul bara dan Nira hanya mengaktifkan simpul air.
- [ ] Pastikan gerbang tetap terkunci sampai dua simpul aktif.
- [ ] Pastikan zona elemen yang tidak cocok mengembalikan pemain ke checkpoint dan menambah jumlah jatuh.
- [ ] Kumpulkan kedua serpihan dan periksa jumlahnya di HUD.
- [ ] Pastikan pemain pertama yang sampai menunggu di gerbang, lalu kedua pemain lanjut ke level berikutnya.
- [ ] Uji pergantian dunia pada level 11, 21, 31, 41 dan penyelesaian level 50.
- [ ] Pastikan layar akhir menampilkan rekap bintang dan serpihan.
- [ ] Pastikan kembali ke ruang hanya dapat dilakukan oleh host sesuai alur sesi proyek.

**Catatan:** unit test memverifikasi struktur 50 level, helper gerak/collision, routing, serta integrasi jalur RTDB. Checklist di atas belum diganti oleh uji Firebase aktif atau pengujian perangkat pengguna.


## v0.23.0 regression fixes
- Photobooth preview and export share `drawStripCanvas`; solo and couple canvas previews use transparent hitboxes only for interaction.
- Camera controls request ideal 1080p/30fps, attempt supported continuous exposure controls, and match the brightness adjustment between preview and capture. Actual exposure remains device/browser dependent.
- Balloon Pop uses pixel-based hit-testing and prevents the active touch board from becoming a scroll gesture. Re-test with two physical phones because Firebase connectivity and touch hardware are not available in this local test run.
- Bomb Storm local collisions trigger the local character effect immediately and synchronize the observed baseline to avoid duplicate animation.
- Guess Partner synonym/inflection canonicalization covers the requested pelukan/berpelukan and shopping/belanja examples.


## Elemental Duo v0.24 — platform puzzle dan tampilan HP
- [ ] Host menjadi Bara dan guest menjadi Nira.
- [ ] Bara aman melewati lava/api tetapi kembali ke checkpoint ketika menyentuh air.
- [ ] Nira aman melewati air tetapi kembali ke checkpoint ketika menyentuh lava/api.
- [ ] Bara hanya mengaktifkan pijakan Bara dan mengumpulkan permata Bara.
- [ ] Nira hanya mengaktifkan pijakan Air dan mengumpulkan permata Air.
- [ ] Penghalang tetap tertutup sampai kedua pijakan diinjak.
- [ ] Setelah penghalang terbuka, Bara harus masuk ke pintu Bara dan Nira ke pintu Air.
- [ ] Pemain pertama yang mencapai pintu menunggu pemain kedua; level baru terbuka setelah keduanya tiba.
- [ ] Pada HP portrait, kamera mengikuti karakter dan menampilkan area level yang lebih dekat tanpa mengecilkan keseluruhan arena.
- [ ] Pada HP landscape, area permainan lebih lebar dan kontrol sentuh tetap dapat dijangkau.
- [ ] Tombol ⛶ membuka layar penuh ketika browser mendukung Fullscreen API; tombol keluar browser mengembalikan tampilan normal.
- [ ] Ulangi pada dua perangkat yang terhubung ke Firebase aktif.

**Pemasangan v0.24:** unggah seluruh isi folder proyek. Firebase Rules tidak berubah dari versi sebelumnya sehingga tidak perlu dipublikasikan ulang. Pastikan file `js/app.js` terbaru terunggah karena versi lazy-load Elemental Duo diperbarui dari v0.22.0 ke v0.24.0.


## Elemental Duo v0.24.1 — regression test transisi level
- [ ] Saat salah satu pemain sudah masuk pintu, statusnya tampil `tiba di gerbang` pada kedua perangkat.
- [ ] Ketika pemain kedua masuk pintu, level berikutnya terbuka otomatis pada kedua perangkat.
- [ ] Uji ketika satu perangkat memiliki koneksi lambat saat mencapai pintu; status `complete` harus tetap terkirim sesudah sinkronisasi posisi sebelumnya selesai.
- [ ] Jika tab host ditutup tepat setelah kedua pemain tiba, buka kembali sesi dan pastikan kunci transisi yang tertinggal dapat dipulihkan.

**Pemasangan v0.24.1:** unggah seluruh isi folder proyek dan timpa berkas lama. Pastikan `index.html`, `js/app.js`, `js/games/elemental-duo.js`, dan `js/games/elemental-duo-logic.js` terbaru ikut terunggah agar cache key v0.24.1 digunakan. Firebase Rules tidak berubah.


## G. Elemental Duo — Hutan Berbisik (level 01–10, v0.25.0)

- [ ] Dua perangkat masuk ke room yang sama dan memilih Elemental Duo.
- [ ] Level 01: Bara dan Nira dapat bergerak, melompat, menghindari hazard elemen, mengaktifkan pijakan, lalu masuk ke pintu masing-masing.
- [ ] Level 02–04: platform bertingkat, dua jalur, serta pijakan tinggi dapat dicapai oleh karakter yang sesuai.
- [ ] Level 05: kedua pemain dapat menginjak pijakan elevated dari platform; gerbang terbuka setelah keduanya aktif.
- [ ] Level 06: jamur pantul memberi lompatan otomatis dan pemain tetap dapat mengarahkan karakter saat di udara.
- [ ] Level 07: rangkaian menara dapat dinaiki tanpa lompatan mustahil.
- [ ] Level 08: platform bergerak mengikuti lintasan dan platform berkala menghilang/muncul; kedua perangkat melihat fase gerak yang konsisten meskipun jam HP sengaja dibuat berbeda.
- [ ] Level 09: jembatan bergerak membawa karakter yang sedang berdiri di atasnya; uji dari kedua perangkat.
- [ ] Level 10: kombinasi hazard bergerak, jamur, platform bergerak/berkala, dan dua pijakan dapat diselesaikan.
- [ ] Jatuh/hazard mengembalikan karakter ke spawn/checkpoint dan tidak menghapus progres pasangan.
- [ ] Setelah kedua pemain mencapai pintu, transisi ke level berikutnya tetap berjalan.
- [ ] Mode Potret dan Layar Penuh tetap bekerja pada HP.

Tes otomatis tidak menggantikan checklist dua perangkat di atas.


## H. Elemental Duo — Kedalaman Kristal (level 11–20, v0.26.0)

- [ ] Selesaikan level 10 Hutan Berbisik bersama pasangan dan pastikan level 11 terbuka sebagai Retakan Pertama.
- [ ] Level 11: berdiri di atas platform/zona es, lepaskan tombol arah, dan pastikan karakter meluncur lebih lama daripada di batu.
- [ ] Level 12: masuk ke arus biru dan pastikan dorongan terasa; lawan arus dengan tombol arah.
- [ ] Level 13: seberangi pecahan kristal dan platform bergerak dari kedua sisi.
- [ ] Level 14: uji lantai licin dan arus vertikal; pastikan tidak ada switch yang tertutup hazard yang salah bagi karakter.
- [ ] Level 15: tunggu jembatan kristal berkala muncul; pijakan yang padam tidak dapat diinjak dan tidak membuat karakter tetap berdiri di udara.
- [ ] Level 16: amati arah arus berubah secara bertahap dan hazard air/api menyala-padam sesuai fase.
- [ ] Level 17: naiki lift vertikal; karakter harus ikut terbawa ketika berdiri di atas lift.
- [ ] Level 18: uji arus ke atas dan ke bawah serta kedua jalur karakter.
- [ ] Level 19: uji arus kuat yang berbalik, platform berkala, hazard bergerak, dan permukaan es.
- [ ] Level 20: selesaikan gabungan arus, lift, platform berkala, hazard bergerak, dan dua pressure plate.
- [ ] Pastikan kedua perangkat menampilkan fase arus/platform/hazard yang sama; untuk menguji, ubah jam lokal salah satu HP beberapa menit.
- [ ] Pastikan kedua switch dapat dijangkau dari spawn dan sebelum gerbang; switch tidak boleh bergantung pada platform berkala atau lift vertikal.
- [ ] Pastikan transisi level 20 ke 21 tidak menghapus bintang, shard, atau jumlah jatuh yang telah direkap.

**Pemasangan v0.26.0:** unggah seluruh isi ZIP ke root repository GitHub Pages dan timpa file lama. Pastikan `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, serta `css/elemental-duo.css` terbaru ikut terunggah agar cache v0.26.0 terpakai. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.


## I. Elemental Duo — Kerajaan Bara (level 21–30, v0.27.0)

- [ ] Level 21: pastikan lava berdenyut terlihat; Nira terkena saat aktif, Bara aman.
- [ ] Level 22: pastikan semburan uap aktif/padam dan berbahaya bagi kedua karakter.
- [ ] Level 23: Bara mendekati Katup Bara, menekan INTERAKSI, lalu pastikan aliran lava terkait mati dan gerbang baru bisa dibuka setelah dua pijakan aktif.
- [ ] Level 24: pastikan karakter terbawa platform horizontal bergerak saat berdiri di atasnya.
- [ ] Level 25: pastikan jalur air/lava dan arus pendingin berjalan; kedua pemain memilih jalur elemen masing-masing.
- [ ] Level 26: coba aktifkan pijakan Bara lebih dahulu; harus ditolak. Aktifkan Nira dahulu, lalu pastikan pijakan Bara dapat aktif.
- [ ] Level 27: amati beberapa ventilasi uap yang memiliki fase berbeda; cari jeda aman untuk melintasi lorong.
- [ ] Level 28: pastikan magma bergerak naik/turun dari fase waktu yang sama pada kedua HP.
- [ ] Level 29: Bara mengaktifkan Katup Bara dan Nira mengaktifkan Katup Air; masing-masing ventilasi harus padam setelah katupnya terbuka.
- [ ] Level 30: uji dua katup, dua urutan pijakan (Nira lalu Bara), lava, uap, dan platform bergerak sampai kedua pemain masuk pintu.
- [ ] Putus-sambungkan jaringan sebentar lalu pastikan status katup/urutan tetap tersimpan dan kedua HP menunjukkan state yang sama.

**Pemasangan v0.27.0:** unggah seluruh isi ZIP ke root repository GitHub Pages dan timpa file lama. Pastikan `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, dan `css/elemental-duo.css` ikut terganti untuk mengaktifkan cache v0.27.0. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.

## J. Elemental Duo — Reruntuhan Langit (level 31–40, v0.28.0)

- [ ] Selesaikan level 30 dan pastikan level 31 terbuka dengan tema Reruntuhan Langit.
- [ ] Level 31: masuk ke updraft; pastikan hembusan ke atas membantu lompatan dan kekuatannya berdenyut.
- [ ] Level 32: tunggu pulau bergerak mendekat; pastikan karakter yang berdiri ikut terbawa.
- [ ] Level 33: masuk ke dua lorong angin dan pastikan dorongan berlawanan terasa.
- [ ] Level 34: naiki menara melalui lift vertikal dan updraft; pastikan kedua switch tetap berada di pijakan stabil.
- [ ] Level 35: dekati Tuas Badai dan tekan INTERAKSI; pastikan arah hembusan berubah pada kedua perangkat dan gerbang tetap terkunci sebelum tuas serta dua pijakan aktif.
- [ ] Level 36: seberangi dua platform awan bergerak; pastikan keduanya membawa karakter ketika diinjak.
- [ ] Level 37: manfaatkan zona tenang untuk mengatur lompatan di antara dua gust.
- [ ] Level 38: Bara mengaktifkan Tuas Bara dan Nira mengaktifkan Tuas Air; tuas milik elemen lain harus menolak interaksi.
- [ ] Level 39: amati lorong angin yang membalik arah pada fase berbeda dan hazard elemen yang bergerak.
- [ ] Level 40: aktifkan kedua tuas sesuai elemen, lewati gust berbalik dan lift awan, lalu selesaikan dua pijakan dan pintu masing-masing.
- [ ] Ubah jam lokal salah satu HP beberapa menit; fase angin/platform harus tetap sama karena memakai jam Firebase bersama.
- [ ] Putus-sambungkan jaringan sebentar; status tuas yang sudah aktif harus tetap tersimpan di kedua perangkat.
- [ ] Pastikan INTERAKSI pada desktop (E/Enter) dan tombol INTERAKSI pada mode Potret/Layar Penuh dapat mengoperasikan tuas.

**Pemasangan v0.28.0:** unggah seluruh isi ZIP ke root repository GitHub Pages dan timpa file lama. Pastikan `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, dan folder `css/` ikut terganti agar cache v0.28.0 terpakai. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.


## K. Elemental Duo — Jantung Kuno (level 41–50, v0.29.0)

- [ ] Selesaikan level 40 dan pastikan level 41 terbuka dengan tema Jantung Kuno serta latar runik.
- [ ] Level 41: uji gabungan es, arus, angin, lava, air, dan uap. Pastikan tiap karakter hanya terkena hazard yang tidak sesuai elemennya; uap berbahaya bagi keduanya.
- [ ] Level 42: Bara membuka Segel Bara dan Nira membuka Segel Air. Pastikan hazard terkait padam dan gerbang tetap terkunci hingga kedua katup serta dua pijakan aktif.
- [ ] Level 43: Bara mengaktifkan Kristal Bara dan Nira mengaktifkan Kristal Air. Tuas yang bukan milik elemen pemain harus menolak interaksi.
- [ ] Level 44: coba Bara lebih dahulu; urutan harus ditolak. Nira mengaktifkan pijakan terlebih dahulu, kemudian Bara.
- [ ] Level 45: pilih cabang masing-masing, uji platform pulau bergerak, lantai es, arus dan crosswind. Pastikan jalur kontrol wajib tetap bisa dilewati tanpa harus berdiri di platform bergerak.
- [ ] Level 46: aktifkan dua katup dan uji lift vertikal; karakter yang berdiri di lift harus ikut terbawa.
- [ ] Level 47: aktifkan Katup Tungku, pastikan aliran lava utama berhenti dan semburan uap masih mengikuti fase waktu bersama.
- [ ] Level 48: aktifkan Kristal Bara dan Kristal Air; perhatikan arus berbalik serta updraft. Kedua tuas harus memengaruhi zona angin yang berbeda.
- [ ] Level 49: aktifkan dua katup dan dua tuas dengan pemilik elemen yang sesuai; kemudian Nira harus menginjak pijakan sebelum Bara.
- [ ] Level 50: selesaikan Segel Api Purba, Segel Air Purba, kedua kristal angin, hazard gabungan, dan urutan pijakan Nira → Bara sebelum kedua pemain masuk pintu masing-masing.
- [ ] Ubah jam lokal salah satu HP beberapa menit; fase es/arus/angin/hazard/platform harus tetap konsisten karena memakai jam Firebase bersama.
- [ ] Putus-sambungkan jaringan sebentar setelah mengaktifkan katup/tuas; state harus tetap sama pada kedua perangkat.
- [ ] Uji mode Potret dan Layar Penuh pada level dengan platform bergerak; pastikan kamera lokal tetap mengikuti karakter dan kontrol tidak menutupi pijakan.

**Pemasangan v0.29.0:** unggah seluruh isi ZIP ke root repository GitHub Pages dan timpa file lama. Pastikan `index.html`, `js/app.js`, `js/games/elemental-duo.js`, `js/games/elemental-duo-logic.js`, `css/elemental-duo.css`, serta `ELEMENTAL-WORLD-5.md` ikut terganti agar cache v0.29.0 terpakai. Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.


## QA tambahan v0.33.0
- Periksa Potret di viewport 360×800, 390×844, dan perangkat lebih pendek; tidak boleh ada scroll horizontal.
- Periksa Layar Penuh landscape: analog kiri, tombol lompat kanan, INTERAKSI hanya saat dekat katup/tuas.
- Pastikan joystick kiri/kanan menggerakkan karakter dan joystick ke atas melompat.
- Pastikan menekan pijakan elemen tidak membutuhkan tombol INTERAKSI.
- Mainkan level 1–10 untuk memverifikasi lompatan tutorial dan kurva kesulitan sebelum mencoba dunia berikutnya.


## Checklist prototype v0.39.0
- [ ] Hutan Berbisik: tekstur batu, lumut, akar, dan jalur dasar jelas.
- [ ] Kedalaman Kristal: es/kristal dan arus terbaca jelas serta tidak menutupi platform.
- [ ] Kerajaan Bara: lava/uap terbaca dan collision sesuai elemen.
- [ ] Reruntuhan Langit: hembusan angin terlihat tetapi tidak menutupi pemain.
- [ ] Jantung Kuno: kombinasi mekanik dan rune tidak mengganggu jalur puzzle.
- [ ] Dua HP: kedua karakter dapat bergerak, menginjak pijakan, mengumpulkan permata, dan mencapai portal masing-masing.
- [ ] Selesaikan level 05: game menampilkan hasil prototype dan tidak mencoba membuka level 06.
