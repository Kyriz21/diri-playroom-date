# Mulai di sini — Diri. Playroom Date v0.20

## Memasang v0.20
1. Backup repository GitHub dan Realtime Database Rules yang sedang aktif.
2. Ekstrak ZIP `Diri_Playroom_Date_v0.20_Balloon_Pop.zip`.
3. Unggah seluruh isi folder hasil ekstrak ke root repository yang sama; jangan unggah folder pembungkusnya. Pastikan `index.html` ada di root.
4. Pertahankan konfigurasi Firebase yang sudah ada di `js/firebase.js`.
5. Buka Firebase Console → Realtime Database → Rules. Ganti seluruh Rules dengan file `firebase-database.rules.json` dari v0.20, lalu klik Publish.
6. Tunggu GitHub Pages selesai deploy, kemudian muat ulang kedua perangkat.

## Menguji Balloon Pop
1. Dari halaman utama pilih Balloon Pop → Buat sesi.
2. Pada HP pasangan pilih Balloon Pop → Gabung sesi, lalu masukkan kode.
3. Keduanya dapat memilih karakter bawaan, mengambil selfie, atau memilih foto dari galeri.
4. Tekan Aku siap bermain pada kedua perangkat.
5. Ketuk balon pada papan milik masing-masing. Balon biasa +1, hati +5, emas +10, bom -1 nyawa.
6. Setelah ronde selesai, periksa skor pada kedua perangkat dan uji Main lagi.

## Catatan Firebase
Firebase project dan konfigurasi Web App tidak perlu dibuat ulang. Namun, Rules v0.20 wajib dipublikasikan karena menambahkan path `balloonPop` dan `balloonPopAvatars`. Jangan menghapus Rules lama sebelum menyimpan salinannya.

Lihat `BOMB-STORM.md`, `TEBAK-PASANGAN.md`, dan `DRAW-TOGETHER.md` untuk catatan game yang sudah ada. Gunakan `REVIEW-BUILD-QA.md` untuk checklist pengujian dua perangkat.
