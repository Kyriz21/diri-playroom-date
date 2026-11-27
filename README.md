# Diri. Playroom Date v0.47.0

Diri. Playroom Date adalah ruang aktivitas pasangan LDR berbasis web, menggunakan GitHub Pages untuk frontend dan Firebase Realtime Database untuk room serta sinkronisasi dua perangkat.

## Aktivitas utama
- Photobooth: foto sendiri atau bersama, editor, bingkai, dan ekspor.
- Gambar Bareng, Tebak Pasangan, Bomb Storm, dan Balloon Pop.
- Love Match, Color Match, dan IQ Duel: mini-game dengan lobby bersama dan satu kartu rekap akhir.
- Arcade: dua pemain dalam satu arena, memakai avatar emoji atau foto wajah, dengan 12 ronde singkat.
- Elemental Duo tetap tersimpan sebagai konsep arsip dan tidak ditampilkan di menu utama.

## Arcade v0.47.0
12 ronde: Flappy Face, Heart Catcher, Neon Dodge, Noodle Runner, Coin Rush, Bubble Pop, Sky Hop, Laser Lanes, Rocket Flight, Meteor Dodge, Rhythm Tap, dan Final Sprint.

Kedua pemain harus online dan Ready di lobby room. Setelah masuk Arcade, masing-masing memilih karakter atau mengunggah foto, lalu menyatakan siap. Host menekan Insert Coin. Permainan berlangsung 12 × 12 detik dan ditutup satu kartu rekap skor.

Kontrol: kiri/kanan untuk bergerak, naik/lompat untuk manuver vertikal, turun untuk Bubble Pop, dan aksi untuk Pop/Rhythm. Desktop menggunakan A/D, panah, Spasi, Enter; HP menggunakan tombol sentuh.

## Instalasi
1. Backup repository GitHub Pages.
2. Ekstrak ZIP build dan unggah seluruh isinya ke root repository.
3. Untuk v0.47.0, publikasikan ulang seluruh `firebase-database.rules.json` melalui Firebase Console → Realtime Database → Rules → Publish.
4. Uji alur buat room, join, presence, Ready, pemilihan avatar, Insert Coin, dan hasil dengan dua perangkat.

## Pengujian lokal
- `npm test`
- `node --check` untuk file JavaScript di `js/`
- Firebase Rules JSON dan ekspresi `.read`, `.write`, `.validate` divalidasi secara lokal.

Tes otomatis tidak menggantikan playtest browser dan pengujian dua perangkat dengan Firebase project aktif.
