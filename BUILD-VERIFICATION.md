# Build Verification — Diri. Playroom Date v0.20

- Balloon Pop terdaftar sebagai game keempat dan memiliki aksi Buat/Gabung khusus.
- Mesin Balloon Pop menggunakan seed bersama agar kedua perangkat menampilkan jadwal balon yang sama.
- Papan pemain dipisahkan; tiap perangkat hanya menerima ketukan pada papan dengan role miliknya.
- Skor dan nyawa diperbarui melalui transaksi atomik pada node stats pemain.
- Ada balon biasa (+1), hati (+5), emas (+10), dan bom (-1 nyawa).
- Timer 60 detik, tiga nyawa, hasil akhir, dan rematch dua pihak tersedia.
- Avatar mendukung karakter bawaan, kamera, dan galeri; gambar dikompres lokal ke avatar kecil dan disimpan pada node terpisah.
- Firebase Rules mencakup pemilihan game, meta, player stats, hit records, rematch, dan avatar Balloon Pop.

## Pemeriksaan lokal

- 130/130 unit test lulus.
- Semua file JavaScript lolos `node --check`.
- `firebase-database.rules.json` berhasil diparse sebagai JSON.
- Arsip ZIP diverifikasi setelah dibuat.

## Belum dibuktikan

- Pengujian langsung Firebase project aktif dengan dua perangkat.
- Respons sentuh kamera/galeri pada perangkat fisik.
- Latensi skor/animasi pada jaringan berbeda.
