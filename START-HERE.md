# Mulai di sini — Diri. Playroom Date v0.22

## Memasang v0.22
1. Backup repository GitHub dan Realtime Database Rules yang sedang aktif.
2. Ekstrak ZIP `Diri_Playroom_Date_v0.22_Elemental_Duo.zip`.
3. Unggah seluruh isi folder hasil ekstrak ke root repository yang sama; jangan unggah folder pembungkusnya. Pastikan `index.html` ada di root.
4. Pertahankan konfigurasi Firebase yang sudah ada di `js/firebase.js`.
5. Buka Firebase Console → Realtime Database → Rules. Ganti seluruh Rules dengan file `firebase-database.rules.json` v0.22 dari ZIP, lalu klik Publish. Rules ini menambahkan ID `elementalduo` ke validasi sesi dan tetap membatasi data permainan ke anggota ruang aktif.
6. Tunggu GitHub Pages selesai deploy, kemudian muat ulang kedua perangkat.

## Menguji Elemental Duo
1. Dari halaman utama pilih Elemental Duo → Buat sesi.
2. Di perangkat pasangan pilih Elemental Duo → Gabung sesi dan masukkan kode undangan.
3. Host memainkan Bara; pemain yang bergabung memainkan Nira. Keduanya menekan **Aku siap bertualang**.
4. Gunakan A/D atau panah kiri/kanan untuk bergerak, Space untuk melompat, dan E untuk mengaktifkan simpul. Pada HP gunakan tombol di bawah arena.
5. Bara mengaktifkan simpul bara dan aman dari zona api; Nira mengaktifkan simpul air dan aman dari zona air. Keduanya harus mengaktifkan simpul masing-masing.
6. Setelah gerbang terbuka, kedua pemain harus menyentuh gerbang untuk melanjutkan. Kumpulkan serpihan masing-masing untuk mengejar tiga bintang.

## Menguji Balloon Pop
1. Dari halaman utama pilih Balloon Pop → Buat sesi.
2. Pada HP pasangan pilih Balloon Pop → Gabung sesi, lalu masukkan kode.
3. Keduanya dapat memilih karakter bawaan, mengambil selfie, atau memilih foto dari galeri.
4. Tekan Aku siap bermain pada kedua perangkat.
5. Ketuk balon pada papan milik masing-masing. Balon biasa +1, hati +5, emas +10, bom -1 nyawa.
6. Setelah ronde selesai, periksa skor pada kedua perangkat dan uji Main lagi.

## Catatan Firebase
Firebase project dan konfigurasi Web App tidak perlu dibuat ulang. Untuk memasang v0.22, publikasikan Rules terbaru dari ZIP karena daftar game yang diizinkan kini mencakup `elementalduo`. Node game tetap memakai jalur `roomGames/{kode}/{sessionId}/elementalDuo` yang dibatasi untuk anggota sesi aktif. Jangan menurunkan Rules ke versi lebih lama. Jangan menghapus konfigurasi Firebase yang sudah ada.

Lihat `BOMB-STORM.md`, `TEBAK-PASANGAN.md`, dan `DRAW-TOGETHER.md` untuk catatan game yang sudah ada. Baca `ELEMENTAL-DUO.md` untuk aturan permainan dan `REVIEW-BUILD-QA.md` untuk checklist pengujian dua perangkat.


## Perbaikan arcade v0.21
- Notifikasi singkat muncul dalam baris kecil di bawah judul game, bukan menutupi papan.
- Balloon Pop segera masuk ke hasil ketika salah satu pemain kehilangan semua nyawa; pemain yang masih bertahan menang. Tombol **Main lagi** tersedia pada panel hasil dan tetap menunggu persetujuan kedua pihak.
- Di Bomb Storm dan Balloon Pop, **Ambil foto** membuka webcam PC/HP melalui izin browser; **Pilih dari galeri** membuka pemilih berkas. Di PC, pastikan situs dibuka melalui HTTPS, kamera tersambung, dan izin kamera untuk `kyriz21.github.io` diberikan.


## v0.22 — Elemental Duo
- Game petualangan co-op dua pemain dengan karakter orisinal Bara dan Nira.
- Lima dunia dengan 10 level per dunia; total 50 level.
- Sinkronisasi posisi pemain dan status level melalui Firebase Realtime Database.
- Dua sakelar elemen, dua serpihan energi opsional, zona api/air, checkpoint, gerbang bersama, dan penilaian hingga tiga bintang.
- Kontrol keyboard dan tombol sentuh.
- Tidak menambahkan Cloud Storage, Cloud Functions, server permainan khusus, atau layanan berbayar.
