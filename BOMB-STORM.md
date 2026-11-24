# Bomb Storm — Mini-game 03

## Tujuan
Dua pemain mengendalikan karakter masing-masing dalam arena yang sama. Hindari bom yang jatuh, kumpulkan hati, dan raih skor tertinggi.

## Persiapan
1. Pembuat ruang memilih Bomb Storm lalu membagikan kode undangan.
2. Tamu bergabung melalui menu Bomb Storm.
3. Masing-masing memilih satu dari 12 karakter bawaan, mengambil foto langsung dengan kamera depan, atau memilih foto dari galeri. Foto dikompres menjadi avatar JPEG 128 × 128; avatar dipisahkan pada node `bombStormAvatars` sehingga perubahan posisi tidak memuat ulang avatar. Pilihan terakhir dipulihkan saat game dibuka kembali.
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
Game menggunakan `roomGames/{roomCode}/{sessionId}/bombStorm` untuk state dan `roomGames/{roomCode}/{sessionId}/bombStormAvatars/{role}` untuk avatar. Rules v0.18 membatasi seluruh tulis berdasarkan UID dan role, menerima hanya ID karakter bawaan yang terdaftar atau data foto JPEG/PNG/WebP maksimal 22.000 karakter, serta memeriksa status active session.

## Batasan
Simulasi tabrakan dilakukan di perangkat pemilik karakter berdasarkan seed dan posisi terbaru yang tersinkron. Firebase bukan server fisika authoritative; gerakan lawan dapat sedikit tertinggal ketika jaringan lambat. Gunakan untuk permainan santai dua pemain, bukan kompetisi berhadiah.

## Pilihan karakter v0.18

- Karakter bawaan: Alien, Beruang, Kucing, Kelinci, Panda, Rubah, Katak, Monyet, Koala, Harimau, Anak ayam, dan Unicorn.
- **Ambil foto** membuka kamera depan melalui `capture="user"`.
- **Pilih dari galeri** membuka pemilih gambar tanpa atribut capture.
- Host dan tamu memilih avatarnya sendiri; pilihan avatar tersinkron ke perangkat pasangan.
- Rules v0.18 mengizinkan ID teks `character:<id>` dari daftar yang disediakan dan tetap membatasi foto ke format/ukuran yang ditentukan.


## Gerakan mulus dan animasi tabrakan v0.19

- Posisi karakter dirender dengan interpolasi eksponensial agar sampel posisi Firebase tidak membuat karakter berpindah mendadak. Posisi simulasi dan hitbox tidak diubah oleh interpolasi visual.
- Saat pemain mengambil hati, karakter melakukan pantulan ringan, membesar sebentar, lalu muncul efek `+10`, hati, dan partikel kecil.
- Saat pemain terkena bom, karakter melakukan squash, getaran singkat, kilatan cincin merah, dan label `-1 NYAWA`.
- Efek dipicu dari perubahan skor/nyawa pada snapshot Firebase, sehingga kedua perangkat menampilkan reaksi untuk karakter pemiliknya. Efek tidak menulis koordinat baru ke Firebase dan tidak mengubah hasil tabrakan.
- Animasi bersifat sementara dan berhenti sendiri; posisi karakter tetap mengikuti kontrol pemain.
