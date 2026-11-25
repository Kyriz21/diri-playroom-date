# Diri. Playroom Date v0.32.0 — Photobooth, Mini-game & Elemental Duo

Diri. Playroom Date adalah website aktivitas pasangan. Photobooth menjadi fitur pertama; kini lima game aktif tersedia: Gambar Bareng, Tebak Pasangan, Bomb Storm, Balloon Pop, dan Elemental Duo.

## Pembaruan terbaru v0.32.0 — Peta rapi dan kontrol mobile Elemental Duo

- Arena bukan lagi koridor lurus: setiap level adalah ruang 2D bertingkat untuk menjelajah ke kiri, kanan, atas, dan bawah.
- Tiap level berisi 13 pijakan utama, 5 jalur cabang, dan 4 jembatan pintas/loop. Pintu Bara dan Nira dapat ditemukan di sisi atau ketinggian berbeda.
- Lima geometri ruang berulang dengan variasi koordinat: Jalur Zigzag, Menara Kembar, Jalur Berbalik, Persimpangan Awan, dan Lingkaran Kuno.
- Peta mini menampilkan jalur, hazard, sakelar, permata, posisi kedua pemain, pintu elemen, dan area kamera; penunjuk arah membantu ketika pintu tidak terlihat di layar.
- Geometri semua peta dipisahkan dengan jarak visual minimum agar platform utama, cabang, dan shortcut tidak tampak menumpuk.
- Landscape memakai fullscreen native atau fallback aplikasi yang memindahkan panel game langsung ke body; tombol HUD mengambang dan arena mengisi viewport.
- Kontrol analog transparan otomatis dipilih pada landscape, tersedia pilihan untuk kembali ke tombol atau mengaktifkan analog saat Potret.
- Stabilitas layar ditingkatkan dengan viewport `svh/dvh`, resize yang dijadwalkan, serta penghapusan listener `visualViewport.resize` yang sebelumnya dapat memicu canvas berkedip/loncat.
- Kamera follow dan lima dunia/50 level tetap dipertahankan. Firebase Rules tidak berubah.

Lihat `ELEMENTAL-EXPLORATION-MAPS.md` untuk penjelasan pola peta dan `BUILD-VERIFICATION.md` untuk hasil pengujian v0.32.0.

## Keputusan produk

- **Nama project:** Diri. Playroom Date.
- **Fitur pertama:** Photobooth.
- **Mode awal:** Foto Sendiri, Buat Sesi Berdua, dan Gabung Sesi.
- **Foto Sendiri:** langsung masuk editor Photobooth tanpa room, login, atau Firebase. Foto dan galeri disimpan lokal pada perangkat.
- **Buat Sesi Berdua:** membuat kode enam karakter. Pembuat membagikan kode kepada pasangan.
- **Gabung Sesi:** pasangan memasukkan kode. Setelah berhasil bergabung, sesi Photobooth bersama dibuka otomatis—tanpa memilih game atau menekan tombol Ready di lobi.
- **Mini-games aktif:** Gambar Bareng (menggambar secara live), Tebak Pasangan (menjawab/menebak secara bergantian), Bomb Storm (menghindari bom dan mengumpulkan hati), Balloon Pop (mengetuk balon dan menghindari bom), serta Elemental Duo (platform-puzzle kooperatif 50 level dengan Bara dan Nira). Modul game lama lainnya tetap menjadi referensi source dan belum diaktifkan sebagai permainan yang siap dipakai.

## Memanfaatkan progres build sebelumnya

Foundation ini menggunakan **LDR Playroom Review Build v1.2** sebagai basis teknis, bukan mengulang semua dari nol. Modul yang dipertahankan meliputi:

- 18 desain frame tematik asli: Koran, Buronan, Komik, Sinema, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Kawaii, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- Editor teks/stiker yang dapat digeser dengan mouse atau layar sentuh.
- Kamera browser dan pemilihan foto dari galeri.
- Empat slot foto pribadi, pratinjau, dan retake per slot.
- Pengaturan frame/filter, ekspor PNG/JPEG, cetak, dan galeri lokal.
- Untuk mode berdua: satu pengaturan bersama, empat foto per orang, transfer langsung WebRTC/STUN dengan fallback otomatis Firebase Realtime Database, pratinjau gabungan delapan foto, retake bersama, dan persetujuan sebelum ekspor/cetak.
- Fondasi autentikasi anonim, kode sesi, status kehadiran, dan aturan Realtime Database.

Perubahan utama v0.1 adalah alur masuk yang baru. Firebase dimuat secara dinamis hanya ketika pengguna membuat atau bergabung ke sesi. Karena itu, mode Foto Sendiri tetap dapat digunakan sebelum Firebase project baru dibuat atau dikonfigurasi.

## Pembaruan visual Photobooth v0.2

- Hiasan/stiker kini tampil tanpa kotak putih, latar kartu, atau border. Palet menyediakan 16 pilihan yang dapat dipilih satu per satu.
- Hasil ekspor PNG/JPEG mengikuti konsep hiasan transparan; simbol dan teks digambar langsung tanpa latar kotak.
- Ornamen utama setiap tema juga digambar pada hasil ekspor dengan posisi yang diselaraskan dengan pratinjau. Bingkai Koran, Buronan, Komik, dan Kawaii memiliki komposisi visual khusus.
- Frame memiliki komposisi tematik: Koran, Poster Buronan, Komik Pop Art, Kawaii, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- Foto mendapatkan caption dan gaya kartu sesuai tema. Pratinjau browser serta renderer ekspor menggunakan identitas tema yang sama.
- Jarak baris pada hasil ekspor diperlebar untuk memberi ruang bagi label foto.


## Mini-game 01 — Gambar Bareng

- Dua pemain mendapatkan instruksi gambar yang sama dan menggambar secara bersamaan.
- Coretan tersinkron melalui Firebase Realtime Database; tersedia warna, penghapus, undo, slider ukuran kuas, timer, hasil akhir, dan rematch bersama.
- Baca `DRAW-TOGETHER.md` dan checklist di `REVIEW-BUILD-QA.md`.

## Mini-game 02 — Tebak Pasangan

- Permainan enam ronde dengan 40 pertanyaan berbahasa Indonesia dan timer 60 detik per ronde.
- Peran menjawab dan menebak bergantian. Jawaban asli dan tebakan disimpan privat per UID dan baru dibuka ketika fase reveal.
- Penilaian otomatis: jawaban sama persis setelah normalisasi huruf kapital, spasi, dan tanda baca = Tepat (2); minimal satu kata bermakna cocok tetapi keseluruhan jawaban berbeda = Hampir (1); tidak ada kata bermakna yang cocok = Meleset (0). Jadi `mie ayam` dan `mie ayam goreng` hanya mendapat Hampir. Poin diberikan kepada penebak.
- Kedua pemain dapat melanjutkan ronde dan melakukan rematch setelah menyelesaikan enam ronde.
- Baca `TEBAK-PASANGAN.md` untuk struktur data, aturan, dan pengujian.


### Bomb Storm — pilihan karakter v0.18

- Setiap pemain dapat memilih 12 karakter bawaan: Alien, Beruang, Kucing, Kelinci, Panda, Rubah, Katak, Monyet, Koala, Harimau, Anak ayam, dan Unicorn.
- Pemain juga dapat mengambil foto langsung dengan kamera depan atau memilih gambar dari galeri. Kedua pilihan memakai input terpisah agar tombol kamera dan galeri jelas di ponsel.
- Avatar yang terakhir dipilih dipulihkan ketika pemain membuka ulang permainan. Jika belum ada pilihan, host mendapat Alien dan tamu mendapat Beruang sebagai karakter awal.
- Avatar karakter bawaan disimpan sebagai ID teks yang tervalidasi; foto tetap dikompres menjadi JPEG 128 × 128 pada perangkat.
- Aturannya diperbarui pada `firebase-database.rules.json` untuk menerima ID karakter yang diizinkan. Publikasikan Rules v0.18 sebelum memainkan Bomb Storm setelah deployment.

## Mini-game 04 — Balloon Pop

- Permainan ketangkasan dua pemain dengan papan masing-masing. Kedua perangkat menampilkan pola balon yang sama dari seed ronde, tetapi setiap pemain hanya dapat mengetuk papan miliknya sendiri.
- Balon biasa memberi +1 poin, balon hati +5, balon emas +10, sedangkan bom mengurangi satu dari tiga nyawa.
- Balon bergerak naik dengan sedikit ayunan. Ketukan diperiksa berdasarkan koordinat papan dan hanya satu transaksi untuk setiap ID balon agar skor tidak terhitung ganda.
- Skor, jumlah balon pecah, nyawa, dan hasil ronde tersinkron melalui Firebase Realtime Database.
- Durasi ronde 60 detik, dengan hitung mundur bersama, hasil akhir, serta rematch yang memerlukan persetujuan kedua pemain.
- Avatar dapat menggunakan 12 karakter bawaan, kamera, atau galeri. Foto dikompres menjadi avatar kecil dan disimpan terpisah dari pembaruan skor.
- Untuk deployment baru atau pembaruan dari v0.21, publikasikan seluruh `firebase-database.rules.json` v0.22. Rules v0.22 tetap mencakup `balloonPop` dan menambahkan node khusus Elemental Duo.

## Teknologi dan batasan biaya

- Hosting statis: GitHub Pages.
- Backend sesi berdua: Firebase Spark, Anonymous Authentication, dan Realtime Database.
- Foto: IndexedDB/local browser untuk mode sendiri; WebRTC DataChannel sebagai jalur cepat, lalu Firebase Realtime Database sebagai relay sementara otomatis jika koneksi langsung gagal. Foto relay dikompres ke JPEG maksimum 256 KiB per foto, diverifikasi SHA-256, dan dihapus dari database setelah kedua perangkat menyimpan salinan dan mengirim tanda terima.
- Tidak memakai Firebase Cloud Storage, Cloud Functions, server sendiri, database tambahan, atau TURN berbayar.
- Kamera browser memerlukan HTTPS (GitHub Pages memenuhi syarat secure context).

## Mulai secara lokal

Gunakan Node.js untuk pemeriksaan logika:

```bash
npm test
```

Untuk mencoba halaman, jalankan static server dari folder ini, misalnya:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`. Foto Sendiri dapat dicoba secara lokal. Kamera membutuhkan localhost/HTTPS. Buat/Gabung Sesi memerlukan Firebase project baru yang sudah diisi pada `js/firebase.js`.

## Deploy baru

1. Buat repository GitHub baru, misalnya `diri-playroom-date`.
2. Buat Firebase project baru bernama `Diri Playroom Date`; jangan gunakan konfigurasi project lama.
3. Ikuti `FIREBASE-SETUP.md` untuk mengisi Web App config, mengaktifkan Anonymous Authentication, membuat Realtime Database, dan memublikasikan Rules.
4. Upload isi folder ini ke root repository (pastikan `index.html` berada di root, bukan di folder pembungkus).
5. Aktifkan GitHub Pages dari branch `main`, folder `/(root)`.
6. Uji mode Foto Sendiri, lalu mode Berdua pada dua perangkat/browser berbeda.

**Jangan hapus repository atau Firebase lama sampai project baru berhasil diuji.** Simpan backup ZIP build lama untuk rollback. Setelah project baru stabil dan tidak ada data yang masih dibutuhkan, barulah project lama boleh dihapus.

## Transfer foto berdua v0.10

1. Kedua perangkat mengambil empat foto dan menyimpannya di IndexedDB lokal.
2. WebRTC dicoba sebagai jalur langsung. Setiap foto harus mendapat ACK dan checksum SHA-256 yang cocok sebelum pengiriman dianggap berhasil.
3. Jika ICE/DataChannel gagal atau macet, aplikasi beralih otomatis ke RTDB relay; pengguna tidak diminta memilih delapan file secara manual.
4. Setiap perangkat mengompres empat fotonya menjadi JPEG maksimal 256 KiB per foto, mengunggah ke path transfer unik, lalu mengambil empat foto pasangan.
5. Penerima memeriksa tipe, ukuran, nomor slot, peran pengirim, dan SHA-256 sebelum menyimpan file.
6. Kedua perangkat mengirim ACK setelah semua foto pasangan tersimpan secara lokal. Editor dibuka setelah kedua ACK diterima.
7. Data relay dihapus setelah kedua perangkat menyelesaikan penyimpanan. Jika salah satu perangkat terputus, klien menunggu Firebase tersambung lagi dan mencoba ulang.

**Wajib:** setelah mengganti source ke v0.10, publikasikan ulang `firebase-database.rules.json` dari ZIP di Firebase Console → Realtime Database → Rules. Rules baru memvalidasi ukuran, tipe, peran, dan nomor slot foto relay. Tanpa Rules ini transfer dapat ditolak.

## Pemeriksaan dan batasan yang belum diuji

Build ini sudah melewati pemeriksaan sintaks JavaScript dan unit test lokal. Hal yang tetap memerlukan uji nyata:

- Kamera pada laptop dan HP dengan izin browser yang sebenarnya.
- Interaksi drag dengan mouse dan layar sentuh.
- Firebase Rules pada project baru.
- Auto-start sesi setelah pasangan bergabung dari dua perangkat.
- WebRTC/STUN pada jaringan berbeda dan fallback otomatis Firebase RTDB pada skenario WebRTC diblokir.
- Pratinjau gabungan, persetujuan, PNG/JPEG, dan dialog cetak.

Lihat `REVIEW-BUILD-QA.md`, `KNOWN-LIMITATIONS.md`, dan `SECURITY-NOTES.md` sebelum uji dua perangkat.


### Editor hiasan langsung (v0.3)
- Seret teks atau stiker langsung pada pratinjau untuk memindahkan.
- Seret satu jari untuk memindahkan elemen.
- Gunakan dua jari untuk mencubit agar ukuran berubah dan memutar agar sudut berubah.
- Pada desktop, roda mouse tetap dapat mengubah ukuran elemen.
- Pilih elemen lalu gunakan tombol Hapus di panel editor; tidak ada tombol overlay di atas foto.
- Tidak ada lagi toolbar panah atau tombol A+/A−.


### Pembaruan v0.4.0
Memperbaiki interupsi `video.play()` ketika tampilan sesi berdua dirender ulang oleh pembaruan Firebase. Kamera sekarang mencoba kembali pada elemen video terbaru dan menunggu preview aktif sebelum mengaktifkan tombol ambil foto.
## Firebase configuration

The Web App configuration in `js/firebase.js` is already connected to the `diri-playroom-date` Firebase project supplied by the project owner. Do not replace the project configuration. Confirm that Anonymous Authentication, the Realtime Database, the GitHub Pages authorized domain, and the v0.10 Rules are enabled/published. Firebase Web configuration values are client-side identifiers; protect database access with Authentication and Realtime Database Rules.

## Foto Sendiri flow

Foto Sendiri is camera-first: capture four photos one by one, review the four slots, retake any slot if needed, then continue to the editor. It does not offer the four-file gallery shortcut.


### v0.6 — Frame baru
Katalog kini memiliki 18 tema, termasuk Dunia Mainan dan Polaroid Sosial. Dua desain ini memiliki komposisi, ornamen, dan bentuk bingkai berbeda—bukan sekadar variasi warna.

## Frame v0.6
Katalog berisi 18 tema. Dua tambahan baru: **Dunia Mainan** (tema kartun ceria dengan maskot orisinal) dan **Polaroid Sosial** (kartu foto instan miring di atas latar kuning).


## Photobooth flow in v0.8
- Solo: pilih bingkai, ambil empat foto dari kamera, masuk editor, tambahkan emoji/teks tanpa latar, lalu unduh/simpan.
- Berdua: pilih bingkai dan pengaturan bersama, ambil empat foto per pemain, tinjau strip gabungan, tambahkan emoji/teks bersama, setujui hasil, lalu unduh/cetak.
- Export menggambar foto terlebih dahulu dan hanya menggambar garis/ornamen bingkai setelahnya; area foto tidak boleh ditimpa bidang putih.

## Urutan Photobooth

- Sendiri: pilih bingkai, buka kamera dan ambil empat foto, lanjut ke editor hiasan/filter, lalu unduh.
- Berdua: pilih satu bingkai bersama, masing-masing mengambil empat foto dengan kamera, gabungkan hasil, edit hiasan bersama, setujui, lalu unduh/cetak.
- File ekspor memvalidasi bahwa semua foto sudah benar-benar digambar agar tidak lagi menghasilkan frame kosong.

## Mini game pertama: Gambar Bareng

Gambar Bareng adalah game dua pemain dengan satu prompt yang sama. Buat sesi dari kartu Gambar Bareng pada halaman utama, lalu pasangan memilih Gabung sesi dan memasukkan kode. Kedua pemain menekan **Aku siap menggambar**; timer dua menit dimulai setelah keduanya siap.

Setiap perangkat menampilkan kanvas sendiri dan kanvas pasangan. Coretan disinkronkan langsung menggunakan Firebase Realtime Database. Tersedia palet warna, ukuran kuas, penghapus, undo, tombol selesai, dan unduhan hasil gabungan PNG.

**Penting saat memperbarui:** publikasikan `firebase-database.rules.json` yang disertakan pada Firebase Console → Realtime Database → Rules. Rules versi ini menambahkan node `roomGames/{kode}/{sessionId}/drawTogether` dengan izin menulis yang dibatasi per UID. Tanpa Rules baru, game dapat menampilkan `permission_denied` ketika mencoba menyimpan coretan.


## Game pertama: Gambar Bareng v0.13
- Rematch dua pihak: setiap pemain mengirim persetujuan yang terikat pada ronde saat ini.
- Tahap `rematching` menjaga gambar yang sudah selesai tetap utuh sampai kedua pemain menyetujui, lalu setiap perangkat membersihkan goresannya sendiri dan memberi konfirmasi.
- Host hanya membuka ronde baru setelah kedua konfirmasi pembersihan diterima. Prompt baru dipilih, timer direset, dan status Siap dikosongkan.
- Slider ukuran kuas 1–24 px menggantikan tombol ukuran tetap.
- Setelah update source, publikasikan ulang `firebase-database.rules.json` v0.13 karena izin rematch baru ditambahkan.


## Update v0.14 — Rules dan pengujian Tebak Pasangan

Saat memasang v0.14, publikasikan ulang seluruh `firebase-database.rules.json` di Firebase Console. Rules v0.14 menambahkan `guesspartner` dan akses jawaban privat yang baru terbuka saat reveal/hasil. Jangan mengganti Rules dengan akses publik. Konfigurasi Firebase pada `js/firebase.js` tetap dipertahankan.

Pemeriksaan lokal v0.14: 94/94 unit test lulus, seluruh file JavaScript lolos `node --check`, dan Rules valid sebagai JSON. Belum dilakukan uji end-to-end pada project Firebase aktif dengan dua perangkat; selesaikan checklist Tebak Pasangan sebelum pemakaian rutin.


## Mini-game 03 — Bomb Storm

- Arcade dua pemain dengan satu arena bersama. Keduanya melihat pola objek jatuh yang sama berdasarkan seed ronde.
- Setiap pemain memakai karakter dari selfie yang diperkecil ke avatar JPEG 128 × 128; foto asli tidak dikirim. Avatar hanya dapat dibaca oleh anggota sesi dan disimpan pada node terpisah agar pembaruan posisi tidak mengirim ulang gambar setiap saat.
- Kontrol dioptimalkan untuk HP: geser slider kiri/kanan, tahan tombol arah, atau sentuh arena untuk memindahkan karakter. Keyboard panah juga didukung pada desktop.
- Bom mengurangi satu nyawa, hati memberi 10 poin, setiap pemain memiliki tiga nyawa dan ronde berlangsung 60 detik dengan waktu penyelesaian objek terakhir.
- Skor dihitung lokal untuk pemilik karakter lalu disinkronkan ke Firebase; hasil akhir menentukan pemenang atau seri. Rematch memerlukan persetujuan kedua pemain dan memulai seed/ronde baru.
- Baca `BOMB-STORM.md` dan bagian Bomb Storm di `REVIEW-BUILD-QA.md`.


### Bomb Storm v0.19 — animasi karakter
- Pergerakan karakter di layar dihaluskan dengan interpolasi posisi; state kontrol dan hitbox tetap menggunakan koordinat permainan.
- Hati memicu pantulan, efek `+10`, dan partikel. Bom memicu squash/shake, cincin benturan, serta indikator kehilangan nyawa.
- Kedua perangkat memicu animasi berdasarkan perubahan skor dan nyawa yang disinkronkan.
- Tidak ada perubahan Firebase Rules; cukup perbarui file project di GitHub Pages.


## Arcade UX dan kamera v0.21

- Notifikasi Bomb Storm dan Balloon Pop tampil sebagai pesan kecil di alur halaman di bawah header, bukan toast mengambang yang menutupi arena.
- Balloon Pop langsung mengakhiri ronde ketika salah satu pemain mencapai 0 nyawa. Jika hanya satu pemain yang kehabisan nyawa, pemain yang masih memiliki nyawa menjadi pemenang; jika keduanya habis pada saat yang sama, skor menjadi penentu. Panel hasil menyediakan **Main lagi** dengan persetujuan kedua pemain.
- Tombol **Ambil foto** di kedua game arcade membuka webcam melalui `navigator.mediaDevices.getUserMedia` dan menampilkan pratinjau video. Tombol **Pilih dari galeri** tetap membuka pemilih berkas terpisah. Pada PC, kamera membutuhkan browser modern, HTTPS, perangkat kamera, dan izin pengguna.
- Catatan historis: perubahan transisi hasil ini pertama kali diperkenalkan di v0.21. Untuk deployment saat ini, gunakan Rules lengkap v0.22 dari paket terbaru.


## Mini-game 05 — Elemental Duo (v0.25.0)

- Platformer kooperatif dua pemain dengan karakter orisinal Bara (host) dan Nira (guest); visual, cerita, nama, dan level dibuat khusus untuk Diri. Playroom Date.
- Lima dunia berisi 10 level masing-masing. Setiap level menggunakan platform, bahaya lava/air, permata khusus elemen, dua pijakan tekanan, penghalang bersama, serta dua pintu akhir yang berbeda untuk Bara dan Nira.
- Bara aman melewati lava/api tetapi tidak air; Nira aman melewati air tetapi tidak lava/api. Masing-masing menginjak pijakan sesuai elemen dan mengumpulkan permata berwarna sendiri. Kedua pijakan membuka penghalang, lalu setiap pemain harus masuk ke pintu elemennya sendiri.
- Kamera mengikuti karakter yang dikendalikan pada masing-masing perangkat. Mode Potret menyediakan arena vertikal yang lebih tinggi; Mode Layar Penuh meminta orientasi landscape dan kontrol sentuh tetap tersedia.
- Kontrol desktop: A/D atau panah kiri/kanan, Space atau W/↑ untuk melompat, E/Enter untuk interaksi. Pada HP tersedia tombol arah, lompat, dan aksi.
- Posisi serta progres tersinkron melalui Firebase Realtime Database pada node `roomGames/{kode}/{sessionId}/elementalDuo`, dengan akses dibatasi ke anggota sesi aktif.
- Baca `ELEMENTAL-DUO.md`. Firebase Rules v0.22 yang sudah dipublikasikan tetap berlaku; v0.24 tidak mengubah Rules.


## Elemental Duo — implementasi Dunia 1 (v0.25.0)

- Fondasi level berbasis data dipakai untuk memisahkan layout, objektif, kesulitan, fitur, platform, hazard, pijakan, permata, dan checkpoint.
- **Hutan Berbisik (level 01–10)** kini memakai 10 blueprint buatan tangan dengan tujuan berbeda: tutorial gerak, bahaya elemen, permata, rute terpisah, pijakan tinggi, jamur pantul, menara vertikal, platform berkala, jembatan bergerak, dan ujian gabungan.
- Label tingkat kesulitan Dunia 1 meningkat dari Mudah (01–03), Normal (04–06), ke Menengah (07–10). Tantangan meningkat melalui layout dan mekanik, bukan sekadar angka.
- Platform bergerak memakai lintasan waktu deterministik; platform berkala memiliki jendela aktif/nonaktif; jamur pantul memberi impuls lompat; karakter ikut terbawa platform ketika berdiri di atasnya.
- Pijakan dapat ditempatkan di atas platform, bukan hanya di lantai. Seluruh pijakan Dunia 1 berada di sisi sebelum gerbang dan diuji jalur lompatnya.
- **Batas implementasi:** level 11–50 masih menggunakan layout generator versi sebelumnya. Dunia 2–5 belum diubah menjadi blueprint khusus; pengerjaan dilanjutkan setelah Dunia 1 diuji pada dua perangkat.
- Firebase Rules tidak berubah karena gerak platform/hazard dihitung deterministik di tiap perangkat dari `startedAt` bersama dan offset waktu Firebase; tidak ada node sinkronisasi tambahan.
- Baca `ELEMENTAL-WORLD-1.md` untuk rincian 10 level.

## Elemental Duo mobile modes (v0.24.4)
- **Potret:** vertical mobile layout with a taller arena and large touch controls.
- **Layar penuh:** requests fullscreen and locks to landscape where supported. If the browser does not support orientation lock, it prompts the player to rotate the device manually; touch controls float at the lower corners to leave more room for the arena.
- The camera follows the local character and gently biases toward the partner when nearby.


## Elemental Duo — implementasi Dunia 2 (v0.26.0)

- **Kedalaman Kristal (level 11–20)** kini memakai 10 blueprint level buatan tangan: Retakan Pertama, Gema Biru, Lorong Pecahan, Cermin Es, Jembatan Prismatik, Arus Terbalik, Menara Kristal, Ruang Resonansi, Badai Serpihan, dan Penjaga Geode.
- Permukaan es mengurangi gesekan sehingga karakter lebih lama meluncur setelah melepas tombol arah.
- Arus air memberikan dorongan horizontal/vertikal; arus dapat berdenyut atau berbalik arah secara bertahap.
- Lift vertikal, jembatan kristal yang muncul/menghilang, dan hazard berkala berjalan dari jam level yang sama pada kedua perangkat.
- Hazard yang sedang padam tidak menimbulkan collision.
- Pressure plate setiap level tetap dapat dijangkau dan tidak bergantung pada platform yang hilang atau lift vertikal.
- Firebase Rules dan struktur RTDB tidak berubah.
- Baca `ELEMENTAL-WORLD-2.md` dan checklist Dunia 2 di `REVIEW-BUILD-QA.md`.


## Elemental Duo — implementasi Dunia 3 (v0.27.0)

- **Kerajaan Bara (level 21–30)** menggunakan 10 blueprint khusus: Napas Lava, Uap Panas, Gerbang Panas, Jembatan Bara, Sungai Pendingin, Sakelar Berantai, Lorong Uap, Lava Meninggi, Dua Katup, dan Jantung Tungku.
- Lava memiliki fase aktif/nonaktif dan dapat bergerak naik-turun; fase dihitung dari jam level bersama Firebase.
- Semburan uap merupakan hazard yang berbahaya bagi kedua pemain. Ventilasi aktif dan padam secara berkala.
- Katup dioperasikan memakai tombol AKSI saat pemain mendekat. Pemilik elemen yang sesuai harus mengaktifkannya; katup mematikan hazard terhubung dan dapat menjadi syarat pembukaan gerbang.
- Level 26 dan 30 mewajibkan urutan pijakan Nira lalu Bara. Progress urutan ditulis atomik di node `switches` agar kedua perangkat membaca langkah yang sama.
- Pressure plate dan katup berada pada platform stabil dan diperiksa keterjangkauannya.
- Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-3.md` dan checklist terbaru di `REVIEW-BUILD-QA.md`.


## Implementasi Dunia 4 — v0.28.0

Reruntuhan Langit level 31–40 menggunakan 10 blueprint khusus. Mekanik aktif mencakup zona angin yang memberi gaya horizontal/vertikal, gust berdenyut, arah angin yang berubah berkala, tuas interaktif yang membalik medan angin, serta platform awan bergerak dan lift vertikal. Status tuas tersimpan pada `levels/{level}/windLevers/{id}`. Fase angin dan platform memakai jam level bersama Firebase. Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-4.md`.

## Implementasi Dunia 5 — v0.29.0

Jantung Kuno level 41–50 kini memiliki 10 blueprint final khusus. Semua level menggabungkan kemampuan dari dunia sebelumnya secara bertahap: es dan arus, lava dan uap, angin berbalik, platform bergerak, dual-valve, dual-wind-lever, serta urutan pijakan Nira lalu Bara. Level 50 menjadi ujian gabungan seluruh mekanik. Semua kontrol wajib dan checkpoint diuji agar dapat dijangkau serta tidak berada dalam zona bahaya. Fase mekanik tetap memakai jam Firebase bersama dan Firebase Rules tidak berubah. Lihat `ELEMENTAL-WORLD-5.md`.

Pada v0.29.0, seluruh level 01–50 sudah memiliki blueprint khusus.
