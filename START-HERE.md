# Mulai di sini — Diri. Playroom Date v0.50.0

## Yang berubah
- Bomber Arena: tiga variasi layout, peti simetris, 2–4 pasangan power-up, perlindungan spawn 1.600 ms, countdown lockout, dan rekap akhir.
- Love Match: 80 pertanyaan tersedia; sistem memilih 32 secara acak dan seimbang tiap sesi. Rekap menjelaskan tipe kepribadian, memperlihatkan pilihan jawaban kedua pemain, dan dapat diunduh sebagai JSON atau CSV.
- Color Match: alur mulai dari lobby diperbaiki; target RGB diacak per ronde dan hasil akhir tetap berupa satu kartu rekap.
- IQ Duel: bank soal menjadi 100 butir dalam lima kategori, dipilih seimbang untuk 12 atau 20 ronde. Rekap berisi skor kategori, jawaban, kunci, dan ulasan.
- Arcade disederhanakan menjadi satu permainan Flappy Face selama 60 detik. Tap/klik arena atau tombol LOMPAT untuk mengepak melewati pipa.

## Memasang v0.50.0
1. Backup repository GitHub Pages.
2. Ekstrak `Diri_Playroom_Date_v0.50.0_Bomber_Arena_Enhanced.zip`.
3. Unggah seluruh isi ZIP ke root repository dan timpa file lama.
4. Buka Firebase Console → Realtime Database → Rules.
5. Firebase Rules tidak berubah pada v0.50.0. Tidak perlu dipublikasikan ulang jika Rules v0.49.0 sudah aktif.
6. Tunggu deployment GitHub Pages selesai.
7. Uji dengan dua perangkat: buat room, gabung dengan kode, pastikan keduanya online, Ready, lalu uji satu sesi Love Match, Color Match, IQ Duel, Flappy Face, dan Bomber Arena.

## Kontrol Arcade
- HP: tap area arena atau tombol **LOMPAT**.
- Desktop: klik arena, Spasi, panah atas, atau W.
- Lepaskan tombol untuk membiarkan karakter turun karena gravitasi. Lewati celah pipa dan hindari tabrakan; setiap pemain memiliki tiga nyawa.

## Hasil pemeriksaan
Tes otomatis, pemeriksaan sintaks JavaScript, parsing JSON Firebase Rules, dan keseimbangan tanda kurung Rules dijalankan pada build. Playtest browser dan multiplayer dua HP dengan Firebase project aktif tetap harus dilakukan setelah Publish.

## Bomber Arena
Baca `BOMBER-ARENA.md` untuk aturan lengkap dan kontrol. Bomber Arena membutuhkan dua pemain online dan Ready di lobby sebelum dimulai.

### Catatan v0.50.0
Build ini memperbarui generator arena, distribusi power-up, perlindungan spawn, dan pengamanan kontrol Bomber Arena. Tidak ada perubahan pada Firebase Rules; gunakan Rules v0.49.0 yang sudah dipublikasikan.
