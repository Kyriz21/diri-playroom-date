# Mulai di sini — Diri. Playroom Date v0.51.0

## Yang berubah
- Bomber Arena: tiga variasi layout, peti simetris, 2–4 pasangan power-up, perlindungan spawn 1.600 ms, countdown lockout, dan rekap akhir.
- Love Match: 80 pertanyaan tersedia; sistem memilih 32 secara acak dan seimbang tiap sesi. Rekap menjelaskan tipe kepribadian, memperlihatkan pilihan jawaban kedua pemain, dan dapat diunduh sebagai JSON atau CSV.
- Color Match: alur mulai dari lobby diperbaiki; target RGB diacak per ronde dan hasil akhir tetap berupa satu kartu rekap.
- IQ Duel: bank soal menjadi 100 butir dalam lima kategori, dipilih seimbang untuk 12 atau 20 ronde. Rekap berisi skor kategori, jawaban, kunci, dan ulasan.
- One Tap: Player 1 dan Player 2 berbagi satu jalur tengah dan urutan pipa yang sama selama 60 detik. Tampilan luar hanya menyediakan Buat Room dan Join Room.

## Memasang v0.51.0
1. Backup repository GitHub Pages.
2. Ekstrak `Diri_Playroom_Date_v0.51.0_One_Tap_Shared_Lane.zip`.
3. Unggah seluruh isi ZIP ke root repository dan timpa file lama.
4. Buka Firebase Console → Realtime Database → Rules.
5. Firebase Rules tidak berubah pada v0.51.0. Tidak perlu dipublikasikan ulang jika Rules v0.49.0 sudah aktif.
6. Tunggu deployment GitHub Pages selesai.
7. Uji dengan dua perangkat: buat room, gabung dengan kode, pastikan keduanya online, Ready, lalu uji satu sesi Love Match, Color Match, IQ Duel, One Tap, dan Bomber Arena.

## Kontrol One Tap
- HP: tap area arena atau tombol **TAP**.
- Desktop: klik arena, Spasi, panah atas, atau W.
- Lepaskan tombol untuk membiarkan karakter turun karena gravitasi. Kedua pemain berada pada satu koordinat lintasan tengah dan menghadapi urutan pipa yang sama; skor dan nyawa tetap terpisah.

## Hasil pemeriksaan
Tes otomatis, pemeriksaan sintaks JavaScript, parsing JSON Firebase Rules, dan keseimbangan tanda kurung Rules dijalankan pada build. Playtest browser dan multiplayer dua HP dengan Firebase project aktif tetap harus dilakukan setelah Publish.

## Bomber Arena
Baca `BOMBER-ARENA.md` untuk aturan lengkap dan kontrol. Bomber Arena membutuhkan dua pemain online dan Ready di lobby sebelum dimulai.

### Catatan v0.51.0
Build ini memperbarui tampilan dan logika One Tap menjadi satu jalur bersama. Perbaikan Bomber Arena dari v0.50.0 tetap disertakan. Tidak ada perubahan pada Firebase Rules; gunakan Rules v0.49.0 yang sudah dipublikasikan.
