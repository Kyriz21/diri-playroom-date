# Firebase setup — Diri. Playroom Date v0.14

Project Firebase `diri-playroom-date` dan Web App sudah dibuat oleh pemilik project. Konfigurasi lengkap sudah disimpan di `js/firebase.js`; jangan menggantinya dengan konfigurasi project lama.

## 1. Periksa konfigurasi Web App

Buka Firebase Console → Project settings → General → Your apps. Pastikan Web App berada di project `diri-playroom-date`. File `js/firebase.js` sudah memakai konfigurasi yang diberikan pemilik project, termasuk database di region `asia-southeast1`.

Jangan menaruh Admin SDK service-account JSON, private key, atau token administrator di repository. Firebase Web config adalah konfigurasi client-side; akses data tetap dilindungi Authentication dan Realtime Database Rules.

## 2. Pastikan Anonymous Authentication aktif

1. Firebase Console → Build → Authentication.
2. Buka Sign-in method.
3. Pilih Anonymous dan pastikan statusnya Enabled.

## 3. Pastikan Realtime Database tersedia

1. Firebase Console → Build → Realtime Database.
2. Pastikan database yang URL-nya sama dengan `databaseURL` pada `js/firebase.js` sudah ada.
3. Database project ini menggunakan region `asia-southeast1`.

## 4. Riwayat Rules transfer foto (v0.13)

Build v0.13 memperkenalkan jalur relay foto sementara di Realtime Database ketika WebRTC gagal. Catatan ini merupakan riwayat; untuk pemasangan baru gunakan Rules lengkap dari build terbaru, bukan file v0.13.

Urutan tersebut dipertahankan sebagai referensi historis. Build v0.17 menambah Bomb Storm; v0.18 menambahkan pilihan avatar karakter, kamera, dan galeri. Untuk pemasangan v0.18, publikasikan seluruh `firebase-database.rules.json` dari ZIP v0.18 melalui Firebase Console → Build → Realtime Database → Rules. Cadangkan Rules aktif sebelum mengganti seluruh isinya. Jangan membuka akses dengan `.read: true` atau `.write: true`.

Rules v0.9 membatasi node relay ke anggota sesi, membatasi foto ke JPEG maksimum 256 KiB, dan memvalidasi peran, nomor slot, tipe, ukuran, serta struktur tanda terima. Jika Firebase menampilkan `PERMISSION_DENIED`, periksa bahwa Rules v0.9 benar-benar sudah dipublikasikan.

## 5. Authorized domain

Setelah GitHub Pages aktif, buka Authentication → Settings → Authorized domains. Pastikan domain GitHub Pages terdaftar, misalnya `username.github.io` tanpa `https://` dan tanpa path repository.

## 6. Alur transfer foto bersama

- Kedua perangkat mengambil empat foto dan menyimpan salinan lokal terlebih dahulu.
- WebRTC DataChannel dicoba sebagai jalur langsung. Setiap foto harus memperoleh ACK dan checksum yang cocok.
- Jika koneksi langsung gagal atau macet, kedua perangkat otomatis berpindah ke Firebase Realtime Database sebagai relay sementara. Tidak perlu memilih delapan file secara manual.
- Foto dikompres menjadi JPEG maksimum 256 KiB per file, diverifikasi SHA-256, dan disimpan ke IndexedDB pada kedua perangkat.
- Editor bersama baru dibuka setelah kedua perangkat mengirim ACK untuk empat foto yang diterima.
- Node relay dihapus setelah kedua ACK diterima. Jika seluruh internet atau Firebase tidak tersedia, transfer menunggu koneksi pulih; foto lokal tidak dihapus.

## 7. Uji dua perangkat

- Perangkat A: laptop atau HP sebagai Pembuat ruang.
- Perangkat B: HP pasangan sebagai Tamu.
- Gunakan browser/profile berbeda agar Anonymous UID tidak sama.
- Uji kamera, empat foto per perangkat, WebRTC, lalu fallback RTDB ketika koneksi peer diblokir, progres 4/4, ACK dua pihak, editor bersama, retake, unduh, dan cetak.
- Uji putus internet sementara pada salah satu perangkat lalu pulihkan; transfer harus melanjutkan tanpa meminta pemilihan file manual.

## 8. Batasan penting

- Foto Sendiri tetap lokal dan tidak memakai Firebase.
- Tidak menggunakan Firebase Storage, Cloud Functions, server sendiri, atau TURN berbayar.
- Firebase Realtime Database relay hanya dipakai saat WebRTC gagal. Foto relay sementara memakai kuota penyimpanan dan unduhan RTDB.
- Tidak ada sistem transfer online yang dapat menjamin penyelesaian ketika kedua jalur internet dan Firebase benar-benar tidak tersedia. Aplikasi mempertahankan foto lokal dan mencoba lagi setelah koneksi pulih.
- Baca `SECURITY-NOTES.md` dan `KNOWN-LIMITATIONS.md` sebelum digunakan rutin.


## 9. Rules Gambar Bareng v0.13

Build v0.13 menambahkan dua node baru pada `drawTogether`: `rematchRequests` (persetujuan kedua pemain) dan `rematchCleared` (konfirmasi bahwa masing-masing perangkat telah menghapus goresan ronde sebelumnya). Karena itu, publikasikan ulang **seluruh** `firebase-database.rules.json` dari ZIP v0.13. Jangan hanya menambahkan potongan rules dan jangan mengganti aturan dengan akses publik.

## 10. Firebase Rules v0.14 — Tebak Pasangan

Build v0.14 menambahkan game `guesspartner`. Publikasikan ulang **seluruh** `firebase-database.rules.json` dari ZIP v0.14 melalui Firebase Console → Realtime Database → Rules. Rules ini:

- Mengizinkan game ID `guesspartner` pada pilihan game dan sesi aktif.
- Menyimpan jawaban asli serta tebakan di `privateRooms/{roomCode}/guesspartner/{sessionId}/{uid}/rounds/{roundKey}`.
- Membatasi baca privat ke UID pemilik sebelum reveal; peserta lain baru dapat membaca setelah fase `reveal`, `round-result`, atau `result-game`.
- Membatasi tulis jawaban/tebakan sesuai peran yang ditetapkan pada ronde aktif.
- Memvalidasi teks maksimum 140 karakter, status kunci, rating, lanjut ronde, dan permintaan rematch.

Jangan menempel hanya potongan Rules game ini. Ganti keseluruhan Rules dengan file lengkap dari ZIP supaya Rules Photobooth, transfer relay, dan Gambar Bareng tetap ikut terdaftar. Jangan membuka akses dengan `.read: true` atau `.write: true`.

Rules sudah divalidasi sebagai JSON dan diperiksa statis dalam build, tetapi belum dikompilasi/dipublikasikan pada Firebase Console project aktif. Setelah Publish, uji jawaban privat dengan dua UID nyata sebelum penggunaan rutin.


## Catatan v0.15 — Tebak Pasangan
Pembaruan penilaian otomatis tidak mengubah struktur Firebase Rules. Rules v0.14 yang sudah dipublikasikan tetap digunakan; node `ratings/{roundKey}` tetap ditulis satu kali oleh pemain yang menjadi penjawab setelah reveal.


## Bomb Storm v0.18

Untuk mengaktifkan Bomb Storm, publikasikan Rules dari `firebase-database.rules.json` pada build v0.18. Rules tersebut mencakup seluruh fitur sebelumnya ditambah jalur `roomGames/{roomCode}/{sessionId}/bombStorm` dan `bombStormAvatars`. Avatar JPEG kecil hanya dapat ditulis oleh pemilik role host/guest dan dibaca anggota sesi yang sama. Jangan hanya menambahkan potongan rules Bomb Storm; gunakan file rules lengkap dari build v0.18 agar seluruh permainan tetap berjalan.

Bomb Storm menyimpan posisi, skor, nyawa, kesiapan, dan indeks objek yang telah diproses secara terpisah dari gambar avatar. Foto sumber yang dipilih pengguna diperkecil pada perangkat menjadi JPEG 128 × 128 dan tidak dikirim sebagai foto resolusi penuh.


## 11. Rules Bomb Storm v0.18

Build v0.18 mempertahankan ID game `bombstorm` dan menambahkan validasi pilihan avatar karakter bawaan. Build v0.17 sebelumnya menambahkan ID game `bombstorm`, jalur state `roomGames/{roomCode}/{sessionId}/bombStorm`, serta jalur avatar terpisah `bombStormAvatars/{role}`. Setiap pemain hanya dapat menulis field profil dan avatar miliknya sendiri. Avatar foto dibatasi maksimal 22.000 karakter; avatar bawaan hanya menerima ID yang tercantum (alien, bear, cat, rabbit, panda, fox, frog, monkey, koala, tiger, chick, unicorn). Avatar hanya dapat dibaca anggota sesi aktif. Host mengelola fase lobby/playing/result/rematch berdasarkan kesiapan serta persetujuan kedua pemain.

Untuk mengaktifkan build v0.18, ganti seluruh isi Realtime Database Rules dengan file `firebase-database.rules.json` pada ZIP v0.18, setelah mencadangkan Rules aktif. Jangan hanya menambahkan potongan Bomb Storm karena file lengkap juga memuat Photobooth, relay foto, Gambar Bareng, dan Tebak Pasangan.

Rules telah divalidasi sebagai JSON dan diuji secara statis. Rules belum dipublikasikan pada Firebase Console maupun diuji dengan Firebase Emulator atau dua perangkat fisik. Uji pembuatan sesi, kesiapan kedua pemain, gerakan, skor, nyawa, hasil, avatar, dan rematch setelah Publish.

## 12. Pilihan avatar Bomb Storm v0.18

Rules perlu diperbarui karena nilai avatar kini dapat berupa ID karakter `character:<id>` selain data gambar. Gunakan seluruh file `firebase-database.rules.json` v0.18; jangan mengubah hanya satu ekspresi secara manual. Kamera dan galeri tetap memerlukan browser permission/HTTPS.


## Bomb Storm v0.19

Build v0.19 hanya memperbaiki rendering posisi dan menambahkan animasi visual untuk hati/bom. Tidak ada perubahan pada struktur data atau Firebase Realtime Database Rules. Rules v0.18 yang sudah dipublikasikan tetap digunakan.


## v0.20 — Balloon Pop
- Pilih game Balloon Pop dari halaman utama untuk membuat atau bergabung ke sesi.
- Publikasikan `firebase-database.rules.json` dari v0.20 ke Realtime Database → Rules.
- Rules menambahkan `roomGames/{roomCode}/{sessionId}/balloonPop` dan `balloonPopAvatars`. Penulisan statistik dibatasi pada UID pemilik peran dan sesi aktif.
- Jangan gabungkan Rules v0.20 dengan potongan Rules lama secara manual; ganti seluruh dokumen dengan file lengkap dari build.


## v0.20 — Balloon Pop
Rules v0.20 menambahkan path `roomGames/{roomCode}/{sessionId}/balloonPop` dan `balloonPopAvatars`. Statistik, hit ID, dan event balon dibatasi pada UID pemilik peran serta sesi aktif. Rules mengizinkan inisialisasi stats ketika node meta belum selesai dibuat oleh host, tetapi tetap mewajibkan membership dan activeSession Balloon Pop. Publikasikan seluruh file Rules v0.20 sebelum menguji game ini.


## v0.21 — Perbaikan hasil Balloon Pop
Rules v0.21 mempertahankan seluruh path sebelumnya. Perubahan aturan Balloon Pop mengizinkan host mengubah fase dari `playing` ke `result` segera ketika statistik `lives` milik host atau guest mencapai 0, selain jalur selesai karena timer atau kedua pemain selesai. Ini diperlukan agar pemain yang masih memiliki nyawa dapat langsung dinyatakan menang. Publikasikan seluruh `firebase-database.rules.json` v0.21 melalui Realtime Database → Rules. Tidak perlu mengganti Firebase Web App config.

Notifikasi kecil, pemanggilan webcam `getUserMedia`, dan pemisahan tombol kamera/galeri tidak mengubah struktur database. Namun, Rules v0.21 tetap wajib karena transisi hasil saat eliminasi berubah.


## v0.46.0 — Lobby presence and recap access

Publikasikan ulang seluruh `firebase-database.rules.json` dari ZIP v0.46.0. Rules ini menambahkan dua pengaman untuk Love Match, Color Match, dan IQ Duel: pemain hanya dapat menyatakan Ready ketika presence host dan guest sama-sama online; host hanya dapat membuat `activeSession` jika kedua perangkat masih online dan keduanya Ready. Rules juga mengizinkan pembacaan silang tebakan privat Color Match pada fase `scoring` agar host dapat membangun kartu rekap ronde, lalu `finished` untuk hasil akhir. Aturan ini belum diuji dengan project Firebase aktif; lakukan tes dua UID nyata setelah Publish.


## v0.47.0 — Arcade Rules
Publikasikan ulang seluruh `firebase-database.rules.json` dari ZIP v0.47.0. Rules ini menambahkan `arcade` ke pilihan game dan activeSession, mewajibkan kedua pemain terhubung sebelum Ready/Start, serta membatasi read/write node Arcade berdasarkan anggota room, gameId, sessionId, UID role, dan TTL room. Validasi karakter/foto dan skor per ronde juga ditambahkan. Jangan menempelkan potongan aturan saja. Setelah Publish, uji dua UID nyata untuk membuat room, bergabung, Ready, menyimpan avatar, memulai 12 ronde, dan membaca rekap. Rules JSON telah divalidasi secara lokal; belum dipublikasikan ke Firebase project.


## Firebase Rules v0.48.0 — Brain Games & Flappy Face
Publikasikan ulang seluruh `firebase-database.rules.json` dari ZIP v0.48.0. Perubahan mencakup validasi path privat RGB Color Match, akses hasil Love Match/Color Match/IQ Duel berdasarkan session dan phase, allowlist Arcade, validasi `gatesPassed`, transisi Arcade setup→playing yang memerlukan kedua player Ready dan online, serta transisi playing→result setelah 60 detik atau kedua pemain kehabisan nyawa. File JSON dan tanda kurung ekspresi Rules diperiksa secara lokal; Rules belum dipublikasikan atau diuji pada Firebase project aktif.

## Firebase Rules v0.49.0 — Bomber Arena

Publikasikan seluruh `firebase-database.rules.json` dari ZIP v0.49.0. Rules menambahkan allowlist `bomberarena`, syarat kedua pemain online dan Ready, serta path `roomGames/{roomCode}/{sessionId}/bomberArena`. Input ditulis hanya oleh UID peran yang sesuai; host menjadi satu-satunya penulis state simulasi, bom, ledakan, peti hancur, power-up, dan fase hasil. JSON diparse dan seluruh ekspresi `.read`, `.write`, `.validate` di seluruh file diperiksa keseimbangan tanda kurung secara lokal. Build ini juga menghapus satu tanda kurung tutup berlebih yang sebelumnya masih ada pada aturan `privateRooms/$roomCode/$gameId/$sessionId/$uid/.read`. Rules belum dipublikasikan atau diuji di Firebase Emulator/project aktif.


## Firebase Rules v0.49.1 — tidak ada perubahan

Bomber Arena v0.49.1 hanya memperbarui frontend, feedback gameplay, statistik rekap, dan CSS kontrol. Tidak ada perubahan pada `firebase-database.rules.json`; Rules v0.49.0 tetap kompatibel. Jangan mengganti atau memublikasikan Rules ulang bila versi v0.49.0 sudah aktif.


## Bomber Arena v0.50.0
Tidak ada perubahan Firebase Rules pada build v0.50.0. Jika Rules v0.49.0 sudah dipublikasikan, tidak perlu Publish ulang; variasi arena, power-up, perlindungan spawn, dan lockout input berjalan di frontend dengan jalur state yang sama.


## Bomber Arena v0.51.3 — perbaikan izin metadata awal

v0.51.3 mengubah ekspresi `.write` untuk `roomGames/{roomCode}/{sessionId}/bomberArena/meta`. Pembuatan fase `setup` kini mengandalkan bukti `lobby/activeSession` yang telah lolos pemeriksaan host, pilihan game, dua Ready, serta dua presence online pada saat sesi dibuat. Pemeriksaan Ready dan Presence yang sama tidak diulang pada penulisan metadata berikutnya. Host tetap menjadi satu-satunya penulis metadata; room harus masih aktif, session ID dan game ID harus cocok, serta guest harus terdaftar. Transisi `setup` → `playing` tetap mensyaratkan state host dan guest sudah ada serta kedua presence online.

**Rules v0.51.3 wajib dipublikasikan** dari file `firebase-database.rules.json` di ZIP v0.51.3. Perubahan ini tidak dapat diperoleh hanya dengan mengunggah file website ke GitHub Pages. Backup Rules aktif terlebih dahulu. Jangan membuka akses `.read` atau `.write` secara global.
