## v0.24.2 — Elemental Duo clean arena HUD

- Removed objective text and toast bubbles from the playable canvas so they no longer cover characters, platforms, or hazards.
- Moved temporary gameplay feedback to a compact status strip above the arena, outside the canvas.
- Kept the current objective discoverable through the existing gate/player HUD and level description.
- Bumped cache keys to v0.24.2. Firebase Rules are unchanged.

## v0.24.1 — Elemental Duo progression sync fix
- Fixed a race condition that could drop a player's `complete` state when the final door was reached while a position write was still in flight. Player snapshots are now queued and flushed in order, so the final arrival update is not discarded.
- Added a retry for queued player-state writes after transient connection failures.
- Added recovery for a stale level-transition lock if the host disconnects after acquiring it but before publishing the next level.
- Added regression tests for queued arrival-state persistence and stale transition recovery. Cache keys are bumped to v0.24.1. Firebase Rules are unchanged.

# Changelog

## v0.24.0 — Elemental Duo platform-puzzle and mobile camera
- Reworked Elemental Duo objectives into a two-player element platform puzzle: Bara is safe in lava and uses the Bara pressure plate; Nira is safe in water and uses the Air pressure plate. Each character collects only their matching gem.
- Added a locked shared barrier that opens only after both pressure plates are activated, followed by separate Bara and Air exit doors. Both players must reach their matching door before the next level starts.
- Added camera-follow and responsive world cropping so narrow phone screens can focus on the players and nearby platforms instead of shrinking the entire 960×560 map.
- Enlarged mobile playfield and touch controls, added a fullscreen arena button, and compacted the HUD for landscape phones.
- Updated the Elemental Duo lazy-load cache key and app asset versions to prevent stale v0.22/v0.23 game files from being served after deployment. No Firebase Rules changes.
- Re-ran the complete Node test suite; all existing and new tests pass. Physical two-device gameplay and orientation checks remain to be completed by the user.

## v0.23.0 — Photobooth, mobile touch, and game feedback fixes
- Photobooth solo/couple editor previews now use the exact same canvas renderer as PNG/JPEG export, including the frame artwork, photo filters, and decorations. Invisible interaction hitboxes preserve selecting and dragging decorations without introducing a second visual layout.
- Solo and couple decoration placement is kept in the same normalized canvas coordinate system from editor preview to final output.
- Front camera requests a higher ideal resolution, prefers continuous exposure controls when supported, and applies the same modest brightness lift to live preview and captured frames. Device support varies; the browser camera still cannot promise identical processing to the native camera app.
- Balloon Pop hit testing now uses actual pixel distances and a finger-friendly target radius; pointer capture and scroll containment reduce missed taps and accidental page movement.
- Bomb Storm triggers the local player's hit/heart animation immediately; partner animations continue to arrive from synchronized player updates.
- Tebak Pasangan recognizes a curated set of equivalent forms such as pelukan/berpelukan and shopping/belanja while preserving partial-match scoring for extra or reordered words.
- Updated cache-busting versions to prevent mobile browsers and GitHub Pages from keeping older game modules or styles.

## v0.22.0 — Elemental Duo
- Menambahkan game co-op orisinal **Elemental Duo** dengan Bara (host) dan Nira (guest).
- Menambahkan lima dunia dan 50 konfigurasi level berbasis satu engine platformer Canvas.
- Menambahkan kontrol keyboard dan tombol sentuh, lompatan yang disesuaikan untuk menjangkau platform, platform, zona bahaya elemen, checkpoint, simpul elemen, serpihan energi, dan gerbang yang membutuhkan kedua pemain.
- Menyinkronkan posisi, kesiapan, status tiba, sakelar, serpihan, hasil level, dan progres melalui Firebase Realtime Database pada node khusus sesi aktif `elementalDuo`.
- Menambahkan penghargaan hingga tiga bintang per level; level berikutnya terbuka otomatis ketika kedua pemain tiba. Jumlah jatuh per level ikut disimpan agar penilaian akurat.
- Memperbarui Firebase Rules untuk mengizinkan ID `elementalduo` pada pemilihan game dan activeSession; data game berada pada node khusus `roomGames/{kode}/{sessionId}/elementalDuo` yang dibatasi ke anggota sesi aktif.
- Tidak menggunakan layanan berbayar tambahan.
- Menambahkan lima kelompok tes regresi Elemental Duo; 145/145 unit test suite lulus.

## v0.21.0 — Arcade UX, Balloon Pop elimination, and desktop webcam
- Replaced floating arcade toasts in Bomb Storm and Balloon Pop with compact in-flow feedback under the game header so notifications do not cover the play area.
- Balloon Pop now transitions to results immediately when either player's lives reach zero. The surviving player wins; if both are out, the score breaks the tie. The existing result panel displays the two-player rematch action.
- Added a shared webcam capture modal using `navigator.mediaDevices.getUserMedia` for both arcade games. The camera button opens webcam preview and capture on desktop/mobile; gallery selection remains a separate file picker.
- Updated Firebase Rules to authorize the early Balloon Pop `playing` → `result` transition on zero lives. Publish the full v0.21 rules file.

# Changelog

## v0.20.0 — Balloon Pop
- Menambahkan game arcade Balloon Pop sebagai game keempat di halaman utama.
- Dua papan pribadi menampilkan pola balon deterministik yang sama; tiap pemain mengetuk papan miliknya sendiri.
- Balon biasa +1, hati +5, emas +10, bom mengurangi satu nyawa.
- Avatar karakter bawaan, selfie kamera, dan galeri; avatar disimpan di node terpisah.
- Timer 60 detik, skor/nyawa live, hasil akhir, dan rematch bersama.
- Menambahkan Firebase Rules scoped untuk `balloonPop` dan `balloonPopAvatars`.

# Changelog — Diri. Playroom Date

## v0.18.0 — Pilihan karakter Bomb Storm

- Menambahkan katalog 12 karakter bawaan untuk avatar pemain.
- Memisahkan tombol **Ambil foto** (kamera depan) dan **Pilih dari galeri**.
- Memulihkan avatar yang terakhir dipilih saat game dibuka kembali.
- Menggunakan avatar default Alien untuk host dan Beruang untuk tamu jika belum ada pilihan.
- Memperbarui Firebase Rules agar hanya ID karakter terdaftar atau data foto terkompresi yang diterima.
- Menambahkan tes regresi untuk katalog, pemilih kamera/galeri, pemulihan avatar, dan validasi Rules.

## v0.17.0 — Bomb Storm (mini-game 03)
- Menambahkan game arcade Bomb Storm ke katalog halaman utama dengan jalur Buat/Gabung sesi khusus.
- Menambahkan avatar selfie JPEG 128 × 128 yang dibagikan hanya kepada dua anggota sesi; avatar berada di node terpisah dari state yang sering berubah dan tetap dipertahankan di HUD/hasil ketika snapshot posisi diperbarui.
- Menambahkan arena Canvas dengan pola bom/hati deterministik dari seed ronde, tiga nyawa, timer 60 detik, skor hati, serta hasil akhir.
- Menambahkan kontrol sentuh/drag arena, slider posisi, tombol arah tahan, dan tombol panah keyboard.
- Menambahkan rematch dua pihak dengan reset ronde yang menunggu persiapan kedua pemain.
- Memperbarui Firebase Rules untuk game ID `bombstorm`, field pemain berdasarkan role, avatar privat per sesi, start/result/rematch, serta pembatasan ukuran avatar.
- Menambahkan tes logika deterministik, skor/nyawa, timer, pemenang, routing, avatar terpisah, dan aturan akses.

# Changelog

## v0.11.0 — Gesture-only decoration controls
- Removed the visible resize arrow/white circular handle from sticker and text overlays in solo and couple editors.
- Two-finger gesture now changes scale and rotation together; one-finger drag still moves the selected item.
- Kept the separate delete button in the editor panel and the precise rotation slider.
- Updated editor instructions to describe direct manipulation without a corner handle.
- Preserved Firebase configuration, solo/couple camera flow, filters, photo transfer, frames, and export.

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

## v0.12.0 — Gambar Bareng (24 November 2026)

- Menambahkan game pertama Diri. Playroom Date: **Gambar Bareng**.
- Menambahkan pilihan Buat sesi dan Gabung sesi khusus Gambar Bareng pada halaman utama.
- Ruang baru menyimpan game yang dipilih; pemain yang bergabung harus memakai kode untuk aktivitas yang sama.
- Kedua pemain menerima satu instruksi gambar yang sama dan memulai timer dua menit setelah keduanya menekan tombol siap.
- Menambahkan dua kanvas yang terlihat dari kedua perangkat; coretan dikirim berkala melalui Firebase Realtime Database.
- Menambahkan palet warna, tiga ukuran kuas, penghapus, urungkan goresan, status selesai, dan hasil akhir PNG berdampingan.
- Menambahkan aturan Realtime Database khusus `drawTogether`, termasuk pembatasan tulis berdasarkan UID pemilik goresan dan batas jumlah goresan.
- Menambahkan tes logika, timer, prompt, dan integrasi room game.


## v0.13.0 — Rematch dan slider kuas
- Menambahkan tombol **Main lagi** pada layar hasil. Kedua pemain harus menyetujui rematch untuk membuat ronde baru.
- Prompt ronde baru dipilih ulang, timer direset menjadi 2 menit, status siap/selesai direset, dan setiap pemain menghapus goresannya sendiri sebelum memberi suara.
- Suara rematch diikat ke `createdAt` ronde saat ini agar persetujuan lama tidak bisa memicu ronde berikutnya.
- Mengganti tiga tombol ukuran kuas tetap dengan slider 1–24 px dan label ukuran saat ini.
- Memperbarui Firebase Rules untuk mengizinkan transisi hasil → persiapan baru hanya setelah dua suara rematch cocok.

## v0.14.0 — Tebak Pasangan (Mini Game 02)
- Menambahkan **Tebak Pasangan** ke halaman utama dengan jalur Buat Sesi dan Gabung Sesi khusus agar kode game tidak tercampur dengan Photobooth atau Gambar Bareng.
- Menambahkan enam ronde, timer 60 detik, 40 pertanyaan berbahasa Indonesia, dan kategori Kebiasaan, Favorit, Romantis, serta Tentang Kita.
- Peran menjawab dan menebak bergantian: host menjawab pada ronde ganjil, guest menjawab pada ronde genap.
- Jawaban asli dan tebakan disimpan di `privateRooms` per UID. Data privat tidak dapat dibaca pasangan sebelum fase reveal/hasil.
- Menambahkan reveal setelah kedua pemain mengunci jawaban atau timer habis.
- Pemain yang menjawab menilai tebakan sebagai Tepat (2), Hampir (1), atau Meleset (0); poin diberikan kepada penebak.
- Menambahkan status mengunci, lanjut bersama, skor, rangkuman enam ronde, dan rematch dengan persetujuan dua pemain.
- Menambahkan Firebase Rules khusus untuk game ID, jawaban privat, status jawaban/tebakan, rating, perpindahan ronde, dan rematch.
- Menambahkan dokumentasi `TEBAK-PASANGAN.md` dan checklist QA.
- Memastikan catatan ronde pertama menyimpan `matchKey`, agar lolos validasi Rules dan masuk ke rangkuman serta hitungan skor akhir.
- Memperketat baca jawaban privat ke sesi Tebak Pasangan yang sedang aktif dan membatasi rating agar hanya dapat ditulis sekali.
- Pengujian lokal: 95/95 unit test lulus dan seluruh file JavaScript lolos `node --check`. Uji Firebase produksi dua perangkat masih diperlukan.


## v0.15.0 — Penilaian otomatis Tebak Pasangan
- Menghapus tombol penilaian manual dari layar reveal.
- Menilai jawaban berdasarkan kecocokan kata kunci setelah kedua jawaban dibuka.
- Semua kata kunci cocok: Tepat (2 poin); sebagian cocok: Hampir (1 poin); tidak ada yang cocok: Meleset (0 poin).
- Normalisasi huruf besar-kecil, tanda baca, spasi, dan pengabaian kata pengisi umum Bahasa Indonesia.
- Menampilkan kata kunci yang cocok agar hasil penilaian transparan.

## v0.15.0 — Penilaian kata otomatis untuk Tebak Pasangan
- Mengganti pilihan penilaian manual dengan pencocokan kata otomatis setelah kedua jawaban dibuka.
- Semua kata kunci bermakna cocok memberi 2 poin; sebagian cocok memberi 1 poin; tidak ada yang cocok memberi 0 poin.
- Menampilkan kata yang cocok pada kartu reveal, hasil ronde, dan rangkuman akhir.
- Tidak membutuhkan perubahan Firebase Rules dari v0.14.

## v0.16.0 — Exact phrase scoring for Tebak Pasangan
- Full score (2) is awarded only when the complete normalized answer phrases are identical; normalization ignores letter case, punctuation, and repeated whitespace, but preserves word order and all extra/missing words.
- Partial score (1) is awarded only when at least one meaningful answer keyword overlaps but the complete phrase is not identical. Added words such as "goreng", "rebus", or "bakar" therefore cannot turn "mie ayam" into an exact answer.
- Zero score is awarded when no meaningful keyword overlaps.
- Reveal text explicitly explains that an overlapping phrase is still only "Hampir" when the complete answer differs.
- Added regression coverage for exact, extra-word, omitted-word, reordered-word, punctuation, casing, and no-overlap cases.


## v0.19.0 — Bomb Storm: gerakan mulus dan animasi item
- Menambahkan interpolasi posisi karakter agar pembaruan posisi berkala dari Firebase tidak tampak meloncat.
- Menambahkan animasi hati: karakter memantul, sedikit membesar, efek `+10`, ikon hati, dan partikel.
- Menambahkan animasi bom: karakter melakukan squash dan getaran singkat, disertai cincin benturan dan label `-1 NYAWA`.
- Efek dipicu dari perubahan skor/nyawa yang diterima kedua perangkat; animasi tidak mengubah koordinat atau aturan tabrakan.
- Tidak ada perubahan Firebase Rules atau struktur data.
