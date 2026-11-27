# Mulai di sini — Diri. Playroom Date v0.47.0

## Yang baru
- Arcade menjadi aktivitas baru dengan 12 ronde singkat dalam satu arena bersama.
- Pemain dapat memilih avatar emoji atau foto kamera/galeri. Foto dikompres menjadi JPEG 128×128 dengan batas 22 KB dan hanya digunakan pada sesi room.
- Arcade menggunakan lobby bersama: kedua pemain harus online dan Ready. Di dalam setup Arcade, kedua pemain memilih karakter dan mengonfirmasi kesiapan; host menekan Insert Coin.
- Kontrol sentuh dan keyboard: kiri, kanan, naik/lompat, turun, aksi. Bubble Pop memakai gerak vertikal; Rocket Flight memakai tahan-naik; Rhythm Tap memakai aksi sesuai ketukan.
- Setelah 12 ronde, satu kartu rekap menampilkan pemenang/seri, total skor, dan rincian tiap mini-game.
- Perbaikan countdown: timer tidak melebihi durasi ronde ketika waktu mulai masih berada di masa depan.

## Memasang v0.47.0
1. Backup repository GitHub Pages.
2. Ekstrak `Diri_Playroom_Date_v0.47.0_Arcade_12_Mini_Games.zip`.
3. Unggah seluruh isi ZIP ke root repository dan timpa file lama.
4. Buka Firebase Console → Realtime Database → Rules.
5. Ganti seluruh isi Rules dengan `firebase-database.rules.json` dari ZIP v0.47.0, lalu klik Publish.
6. Tunggu deployment GitHub Pages selesai.
7. Uji dengan dua perangkat: buat room, join dengan kode, pastikan keduanya online, Ready, pilih avatar, Insert Coin, mainkan beberapa ronde, lalu periksa kartu rekap.

## Kontrol permainan
- Desktop: A/D atau ←/→ bergerak; ↑/W naik atau lompat; ↓/S turun; Spasi lompat; Enter/E aksi.
- HP: tahan tombol kiri, kanan, naik, turun, atau aksi.
- Kamera hanya diminta setelah pemain menekan tombol Ambil foto. Pemain dapat melewati kamera dan memilih avatar emoji.

## Hasil pemeriksaan
- `npm test`: 231/231 lulus.
- Sintaks JavaScript dan struktur Firebase Rules JSON lolos pemeriksaan lokal.
- Belum dilakukan playtest browser, kamera, atau multiplayer dua HP dengan Firebase project aktif.
