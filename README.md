# Diri. Playroom Date v0.50.0

Diri. Playroom Date adalah ruang aktivitas pasangan LDR berbasis web, menggunakan GitHub Pages untuk frontend dan Firebase Realtime Database untuk room serta sinkronisasi dua perangkat.

## Aktivitas utama
- Photobooth: foto sendiri atau bersama, editor, bingkai, dan ekspor.
- Gambar Bareng, Tebak Pasangan, Bomb Storm, dan Balloon Pop.
- Love Match, Color Match, dan IQ Duel: mini-game dengan lobby bersama dan satu kartu rekap akhir.
- Arcade: satu tantangan Flappy Face dalam arena bersama. Ketuk layar atau tekan LOMPAT untuk mengepak dan melewati pipa.
- Bomber Arena: duel Bomberman-style pada grid 13 × 11, tiga profil arena deterministik, peti simetris, 2–4 pasangan power-up, perlindungan spawn, bom bersumbu silang, chain reaction, tiga nyawa, dan rekap hasil.
- Elemental Duo tetap tersimpan sebagai konsep arsip dan tidak ditampilkan di menu utama.

## Mini-game otak
- Love Match memiliki bank 80 pertanyaan; 32 pertanyaan (8 tiap dimensi) dipilih acak untuk setiap sesi. Rekap menampilkan tipe kepribadian, penjelasan, jawaban kedua pemain, kecocokan, dan ekspor JSON/CSV.
- Color Match menjalankan lima ronde dengan target RGB acak. Target tidak diulang terlalu mirip dalam satu sesi; hasil seluruh ronde tampil sebagai satu rekap.
- IQ Duel memiliki 100 soal dari lima kategori. Setiap sesi memilih 12 atau 20 soal secara seimbang dan acak, lalu menampilkan skor per kategori serta pembahasan seluruh soal.

## Arcade v0.48.0 — Flappy Face
Arcade sekarang hanya memiliki satu permainan bergaya Flappy Bird. Dua karakter bermain di arena yang sama selama 60 detik. Setiap pemain memiliki tiga nyawa dan mengumpulkan 10 poin untuk setiap celah pipa yang berhasil dilewati. Pemenang ditentukan dari skor/gerbang terlewati; hasil seri jika skornya sama.

Kontrol: tap/klik area arena atau tekan tombol **LOMPAT**. Desktop juga mendukung Spasi, panah atas, atau W. Saat tidak mengepak, gravitasi menarik karakter turun. Tidak ada kontrol arah, tombol aksi tambahan, atau pergantian mini-game.

Kamera hanya diminta ketika pemain memilih Ambil Foto. Foto dipotong dan dikompres ke JPEG 128×128 dengan batas 22 KB untuk avatar sesi; avatar emoji tetap tersedia.

## Instalasi
1. Backup repository GitHub Pages.
2. Ekstrak ZIP build dan unggah seluruh isinya ke root repository.
3. Firebase Rules tidak berubah pada v0.50.0. Tidak perlu Publish ulang jika Rules v0.49.0 sudah aktif; jika belum, publikasikan file Rules dari build v0.49.0.
4. Uji alur buat room, join, presence, Ready, pemilihan avatar, Insert Coin, permainan Flappy Face, dan hasil dengan dua perangkat.

## Pengujian lokal
- `npm test`
- `node --check` untuk seluruh file JavaScript di `js/`
- Firebase Rules JSON dan ekspresi `.read`, `.write`, `.validate` divalidasi secara lokal.

Tes otomatis tidak menggantikan playtest browser dan pengujian dua perangkat dengan Firebase project aktif.

## Bomber Arena v0.50.0

Lihat [BOMBER-ARENA.md](./BOMBER-ARENA.md) untuk kontrol, fuse bom, jangkauan ledakan, power-up, kondisi menang, dan detail sinkronisasi host-authoritative.

### Bomber Arena v0.50.0
Penyempurnaan mencakup tiga profil layout arena, distribusi 2–4 pasangan power-up, perlindungan spawn 1.600 ms, lockout kontrol selama countdown, dan pelepasan input saat jendela kehilangan fokus. Fitur v0.49.2 seperti telegraph ledakan, D-pad 3×3, statistik rekap, serta Firebase Rules v0.49.0 tetap dipertahankan.


### v0.50.0 — Arena variety and spawn fairness

Generator kini memilih Lapangan Terbuka, Persimpangan, atau Benteng Tengah berdasarkan seed. Peti tetap simetris 180° dan seluruh lantai terbuka tetap saling terhubung. Setiap arena menyediakan 2–4 pasangan peti power-up dengan item yang sama di kedua sisi. Perlindungan spawn 1.600 ms, countdown lockout, dan blur input safety mengurangi unfair hit dan input tertinggal. Firebase Rules tidak berubah.
