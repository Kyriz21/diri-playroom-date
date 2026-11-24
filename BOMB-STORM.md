# Bomb Storm — Mini-game 03

## Tujuan
Dua pemain mengendalikan karakter masing-masing dalam arena yang sama. Hindari bom yang jatuh, kumpulkan hati, dan raih skor tertinggi.

## Persiapan
1. Pembuat ruang memilih Bomb Storm lalu membagikan kode undangan.
2. Tamu bergabung melalui menu Bomb Storm.
3. Masing-masing dapat mengambil selfie atau memilih foto. Browser mengubah foto menjadi avatar JPEG 128 × 128; avatar dipisahkan pada node `bombStormAvatars` sehingga perubahan posisi tidak memuat ulang avatar.
4. Kedua pemain menekan `Aku siap bermain`. Host memulai ronde setelah keduanya siap dan telah siap pada nomor ronde yang sama.

## Aturan
- Durasi: 60 detik, ditambah waktu singkat untuk menyelesaikan objek yang telah muncul menjelang akhir.
- Nyawa awal: 3 per pemain.
- Bom yang tertangkap/mengenai karakter: -1 nyawa.
- Hati yang tertangkap: +10 poin.
- Pemain yang mencapai 0 nyawa selesai lebih awal; pemain lain dapat terus bermain.
- Jika skor sama, hasilnya seri.

## Kontrol
- HP: gerakkan slider, tahan tombol kiri/kanan, atau sentuh/seret pada arena.
- Komputer: slider, tombol arah, atau tombol panah keyboard.

## Sinkronisasi
- Kedua perangkat memakai seed ronde yang sama untuk membangkitkan posisi, jenis, dan waktu jatuh objek secara deterministik.
- Setiap pemain hanya menulis posisi, skor, nyawa, dan status karakternya sendiri.
- Host mengubah fase ke hasil setelah waktu berakhir/dua pemain selesai.
- Rematch memerlukan persetujuan keduanya. Ronde baru menunggu kedua pemain mereset profil ronde masing-masing sebelum dapat dimulai.

## Firebase
Game menggunakan `roomGames/{roomCode}/{sessionId}/bombStorm` untuk state dan `roomGames/{roomCode}/{sessionId}/bombStormAvatars/{role}` untuk avatar. Rules v0.17 membatasi seluruh tulis berdasarkan UID dan role, ukuran avatar maksimal 22.000 karakter, dan status active session.

## Batasan
Simulasi tabrakan dilakukan di perangkat pemilik karakter berdasarkan seed dan posisi terbaru yang tersinkron. Firebase bukan server fisika authoritative; gerakan lawan dapat sedikit tertinggal ketika jaringan lambat. Gunakan untuk permainan santai dua pemain, bukan kompetisi berhadiah.
