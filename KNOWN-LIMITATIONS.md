## v0.39.3 — batasan prototype labirin yang masih perlu diuji
- Labirin masih memakai perspektif side-view agar kompatibel dengan kontrol kiri/kanan dan tombol lompat yang sudah ada; ini bukan maze top-down dengan gerakan bebas atas/bawah.
- Partisi dinding dekoratif membentuk ruang dan koridor secara visual; hanya fragmen runtuhan yang ditandai solid yang menjadi penghalang collision. Perlu playtest untuk menilai apakah belokan dan pintu terbaca jelas saat dimainkan.
- Lima level prototype sudah berbeda secara geometri, tetapi belum menjalani uji navigasi dua pemain secara langsung di browser/HP.
- Lompatan dipertahankan pada `560 / 1500`; perlu divalidasi dengan ukuran layar, frame rate dan kontrol aktual di perangkat pengguna.
- `ELEMENTAL_MAP_VERSION=19` dan `prototypeVersion=5` mengatur migrasi posisi serta state puzzle ke map baru. Statistik pemain dan keanggotaan room dipertahankan.

## v0.39.2 — batasan prototype yang masih perlu diuji
- Lima level aktif memakai lima tema, dengan 10 pola ruang reruntuhan akuaduk tersimpan di engine. Variasi dan ritme setiap level tetap perlu dinilai melalui playtest manusia.
- Dinding partisi non-solid memberi bentuk visual koridor/ruang; hanya balok runtuhan tertentu yang memiliki collision. Ini menjaga rute tetap terbuka, tetapi pembacaan lorong dan bukaan perlu diperiksa di browser pada layar desktop dan HP.
- Sistem kotak dorong dan tombol yang harus ditahan seperti beberapa puzzle klasik belum diimplementasikan. Mekanik aktif masih berfokus pada platform, katup/tuas, pijakan, permata, hazard, gerbang bersama, dan pintu elemen.
- Tinggi lompatan teoretis sekitar 104,5 unit (`560² / (2 × 1500)`). Kenyamanan kontrol, jarak lompatan aktual, dan kemungkinan pemain tersangkut di balok reruntuhan tetap perlu diuji langsung.
- Analog hanya mengatur gerak horizontal; tombol LOMPAT tetap terpisah.
- Mode landscape dipertahankan, tetapi fullscreen, safe-area, dan orientasi bergantung dukungan browser/OS.
- `ELEMENTAL_MAP_VERSION=17` dan `prototypeVersion=3` memindahkan posisi pemain dan state puzzle lama ke spawn/layout baru. Statistik pemain dan keanggotaan room dipertahankan.
- Firebase Rules tidak berubah. Pengujian dua perangkat dengan Firebase aktif tetap diperlukan.

---

---

## Diri Playroom Date v0.33.0 — batasan yang masih perlu diuji
- Tes otomatis memeriksa geometri dan jangkauan lompat, tetapi tidak menggantikan playtest manusia untuk ritme puzzle, rasa kontrol, dan tingkat kesulitan.
- Fullscreen native, orientation lock, safe-area dan bilah sistem Android bergantung dukungan browser/OS. Fallback mengisi viewport web, tetapi tidak dapat menyembunyikan status bar Android atau notifikasi sistem.
- Analog dan tombol diuji melalui tes kode, belum divalidasi langsung pada layar sentuh HP pengguna.
- Sinkronisasi dua HP dengan Firebase aktif dan seluruh urutan 50 level tetap perlu diuji setelah deployment.
- MapVersion 9 memindahkan posisi karakter di level aktif ke spawn saat migrasi; progres level, serpihan, dan jumlah jatuh dipertahankan.

## Elemental Duo build v0.32.0 — catatan historis map spacing
- Tes otomatis memverifikasi jarak geometris antarpijakan, tetapi tidak menjamin setiap layout terasa seimbang setelah hazard bergerak dan fase puzzle berjalan; playtest tetap diperlukan.
- Fullscreen native dan orientation lock tetap bergantung dukungan browser/OS. Fallback portal mengisi viewport web yang tersedia, tetapi tidak dapat menyembunyikan chrome browser jika browser tidak memberikan Fullscreen API.
- Perbaikan viewport menghindari listener `visualViewport.resize` dan memakai ukuran stabil; perilaku browser tertentu serta keyboard sistem dapat tetap memicu perubahan viewport. Perlu validasi pada HP yang digunakan.
- Analog virtual, sensitivitas, fullscreen, frame rate, dan sinkronisasi dua HP dengan Firebase aktif belum diuji secara fisik.
- MapVersion 9 memindahkan koordinat sesi aktif ke spawn level saat migrasi; progres level dan statistik tetap dipertahankan.

# Keterbatasan yang diketahui — Diri. Playroom Date v0.19

1. Konfigurasi Web App pada `js/firebase.js` sudah menunjuk ke project `diri-playroom-date` milik pengguna. Create/Gabung Sesi tetap memerlukan Anonymous Authentication, Realtime Database, domain GitHub Pages yang diizinkan, dan Rules terbaru yang sudah dipublikasikan.
2. Foto Sendiri dirancang berjalan tanpa Firebase. Galeri dan media disimpan pada IndexedDB browser lokal dan tidak otomatis berpindah ke perangkat lain.
3. Kamera memerlukan localhost atau HTTPS, izin kamera, serta browser yang mendukung `getUserMedia`.
4. WebRTC/STUN tidak menjamin koneksi langsung pada semua jaringan. v0.9 mencoba dua negosiasi langsung lalu memakai Firebase Realtime Database sebagai relay otomatis. TURN berbayar tidak disertakan.
5. Transfer tetap membutuhkan internet dan Firebase yang dapat diakses. Jika keduanya terputus, tidak ada jalur online yang dapat menyelesaikan transfer sampai koneksi pulih; foto lokal tetap tersimpan agar dapat dicoba ulang.
6. Relay membatasi JPEG maksimum 256 KiB per foto. Foto besar dikompres dan dapat mengalami penurunan kualitas.
7. Firebase Spark Realtime Database memiliki kuota penyimpanan dan data unduhan. Pengiriman foto melewati RTDB hanya pada fallback dan data sementara dibersihkan setelah kedua perangkat memberi ACK. Periksa penggunaan di Firebase Console jika sering melakukan sesi.
8. Sinkronisasi sesi, transfer foto, dan auto-start masih harus diuji dengan Firebase project dan dua perangkat nyata.
9. Gambar Bareng dan Tebak Pasangan sudah menjadi dua mini-game aktif. Modul game lama lainnya tetap ada di source tree, tetapi belum diaktifkan sebagai permainan siap pakai.
10. Menghapus data situs/browser dapat menghapus galeri pribadi dan Anonymous UID lokal. Simpan hasil foto ke perangkat sebelum membersihkan data browser.
11. Firebase Rules membatasi akses berdasarkan sesi/UID, tetapi client-side game logic bukan backend tepercaya untuk hadiah, uang, atau data sensitif.

## Tebak Pasangan v0.16
12. Penilaian otomatis membandingkan jawaban yang dinormalisasi: jawaban sama persis setelah normalisasi kapital, spasi, dan tanda baca = Tepat (2); minimal satu kata bermakna cocok tetapi keseluruhan frasa berbeda = Hampir (1); tidak ada kata bermakna yang cocok = Meleset (0). Sistem tidak memahami sinonim atau makna semantik.
13. Durasi tiap ronde adalah 60 detik. Host memajukan ke reveal saat kedua status terkunci atau waktu habis. Jika penilaian tidak diberikan dalam 20 detik, ronde berlanjut tanpa poin; jika pemain tidak menekan Lanjutkan, host melanjutkan setelah 12 detik.
14. Jawaban privat hanya dapat dibuka peserta lain pada fase reveal atau hasil menurut Rules v0.14. Rules harus dipublikasikan sebelum game digunakan; JSON valid belum membuktikan aturan diterima Firebase Console.
15. Uji produksi dengan dua akun/perangkat, privasi jawaban, timer, reconnect, dan rematch masih diperlukan.


## Bomb Storm v0.18
- Arena menggunakan simulasi objek deterministik dari seed bersama; setiap pemain menghitung tabrakan untuk karakternya sendiri dan mengirim progres ke Firebase. Keterlambatan jaringan dapat membuat posisi lawan terlihat sedikit tertinggal.
- Skor disinkronkan dari perangkat pemilik karakter, bukan dihitung oleh server tepercaya; game ini untuk permainan santai dua orang, bukan kompetisi berhadiah.
- Foto selfie dikompres ke avatar kecil dan hanya dibagikan ke anggota room; aplikasi tidak mengirim foto resolusi penuh.
- Belum dilakukan uji dua perangkat fisik, jaringan seluler yang berbeda, atau evaluasi kuota Firebase aktual.

- Avatar dari galeri/kamera tetap memerlukan izin browser dan file gambar yang dapat dibaca. Jika perangkat menolak akses kamera, opsi karakter bawaan dan galeri tetap dapat digunakan.


## Bomb Storm v0.19
- Interpolasi posisi memperhalus pembaruan remote, tetapi kualitas gerakan tetap bergantung pada jaringan dan frekuensi update posisi.
- Animasi hati/bom dipicu setelah perubahan skor/nyawa diterima melalui Firebase; pada latensi tinggi, efek dapat muncul sedikit setelah objek menyentuh karakter.
- Simulasi tabrakan tetap dihitung pada perangkat pemilik karakter, bukan server authoritative.


## Balloon Pop v0.20
- Kedua papan memakai seed dan jadwal balon yang sama, tetapi setiap pemain mengetuk papan miliknya sendiri.
- Pergerakan visual dihitung lokal dari waktu mulai server dan seed bersama; ketukan/skor dicatat ke Firebase Realtime Database.
- Seperti game kasual lainnya pada build ini, klien tetap menghitung input dan skor; ini bukan sistem anti-cheat untuk kompetisi berhadiah.
- Perlu uji nyata pada dua HP untuk memeriksa sensitivitas sentuhan, izin kamera/galeri avatar, latensi Firebase, countdown, dan rematch.


## Arcade UX dan kamera v0.21
- Webcam di PC memerlukan browser yang mendukung `navigator.mediaDevices.getUserMedia`, halaman HTTPS, kamera yang tidak sedang dipakai aplikasi lain, serta izin kamera. Tombol galeri tetap tersedia sebagai pilihan terpisah. Webcam perangkat fisik belum diuji dari lingkungan build.
- Notifikasi arcade kini berada di alur halaman dan tidak menutupi area permainan; pesan dapat mendorong konten halaman sedikit ke bawah saat tampil.
- Balloon Pop mengakhiri ronde saat snapshot statistik menunjukkan salah satu pemain memiliki 0 nyawa. Waktu hasil yang muncul pada perangkat kedua tetap bergantung pada sinkronisasi Firebase.


## Elemental Duo build v0.31.0 — peta eksplorasi
- Peta kini mempunyai jalur utama, cabang dan shortcut untuk 50 level; pengujian reachability geometri memastikan platform bisa dijangkau dengan parameter lompatan saat ini. Ini belum membuktikan semua kemungkinan jalur saat hazard aktif, fase platform bergerak, atau koordinasi dua pemain.
- Peta mini dan penunjuk pintu adalah bantuan navigasi, bukan fog-of-war; keseluruhan struktur ruangan terlihat pada minimap.
- Karena versi map naik ke 6, koordinat pemain dari build lama akan di-reset ke spawn pada level berjalan ketika build baru pertama kali dimuat. Progres level/serpihan/jumlah jatuh tetap dijaga.
- Sinkronisasi gerakan dan pengalaman kamera/mini-map pada dua HP perlu diuji langsung setelah deployment.

## Elemental Duo build v0.29.0
- Blueprint khusus sekarang mencakup seluruh level 01–50 pada lima dunia. Ini belum membuktikan semua rute terasa seimbang atau menyenangkan; playtest dua perangkat tetap diperlukan.
- Gameplay end-to-end dengan Firebase aktif pada dua HP belum dilakukan dari lingkungan build ini, termasuk transisi level 40–41, interaksi empat segel level 49–50, reconnect, dan sinkronisasi fase mekanik.
- Kontrol katup dan tuas menggunakan tombol INTERAKSI/E/Enter ketika karakter berada dekat objek. Ketepatan jangkauan dan kenyamanan sentuh perlu diuji pada perangkat fisik.
- Tes unit dan pemeriksaan sintaks tidak membuktikan frame rate, respons kamera, orientasi fullscreen, atau collision terasa benar di semua browser/perangkat.
- Fase hazard/platform/arus/angin memakai jam level bersama Firebase; bila inisialisasi koneksi/time offset gagal, permainan menunggu kesiapan jam bersama sebelum menjalankan simulasi lokal.

- Prototype hanya membuka lima level, satu per tema. Visual Canvas prosedural sudah diperbarui, tetapi belum diverifikasi melalui tangkapan layar/browser dan playtest dua HP; kesamaan visual dengan referensi masih membutuhkan inspeksi manusia.
- Gerakan kotak dorong dan tombol tahan dari game referensi belum diimplementasikan pada lima prototype ini.
