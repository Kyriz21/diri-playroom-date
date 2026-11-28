# Diri. Playroom Date v0.51.2

Diri. Playroom Date adalah ruang aktivitas pasangan LDR berbasis web, menggunakan GitHub Pages untuk frontend dan Firebase Realtime Database untuk room serta sinkronisasi dua perangkat.

## Aktivitas utama
- Photobooth: foto sendiri atau bersama, editor, bingkai, dan ekspor.
- Gambar Bareng, Tebak Pasangan, Bomb Storm, dan Balloon Pop.
- Love Match, Color Match, dan IQ Duel: mini-game dengan lobby bersama dan satu kartu rekap akhir.
- One Tap: dua pemain terbang pada satu jalur tengah dengan rintangan yang sama. Lobby luar hanya menyediakan Buat Room dan Join Room; skor dan nyawa tetap dicatat per pemain.
- Bomber Arena: duel Bomberman-style pada grid 13 × 11, tiga profil arena deterministik, peti simetris, 2–4 pasangan power-up, perlindungan spawn, bom bersumbu silang, chain reaction, tiga nyawa, dan rekap hasil.
- Elemental Duo tetap tersimpan sebagai konsep arsip dan tidak ditampilkan di menu utama.

## Mini-game otak
- Love Match memiliki bank 80 pertanyaan; 32 pertanyaan (8 tiap dimensi) dipilih acak untuk setiap sesi. Rekap menampilkan tipe kepribadian, penjelasan, jawaban kedua pemain, kecocokan, dan ekspor JSON/CSV.
- Color Match menjalankan lima ronde dengan target RGB acak. Target tidak diulang terlalu mirip dalam satu sesi; hasil seluruh ronde tampil sebagai satu rekap.
- IQ Duel memiliki 100 soal dari lima kategori. Setiap sesi memilih 12 atau 20 soal secara seimbang dan acak, lalu menampilkan skor per kategori serta pembahasan seluruh soal.

## One Tap v0.51.0
One Tap adalah tantangan terbang satu sentuhan selama 60 detik. Player 1 dan Player 2 memakai satu koordinat lintasan X di tengah arena dan menerima satu urutan pipa yang sama. Avatar ditampilkan berdampingan dekat titik tengah agar keduanya tetap terlihat, tetapi collision dan perhitungan skor menggunakan jalur bersama. Setiap pemain tetap memiliki tiga nyawa dan skor masing-masing; hasil menentukan pemain dengan pipa terlewati terbanyak, atau seri jika sama.

Tampilan luar memakai nama **One Tap** dan hanya memiliki dua tindakan: **Buat Room** dan **Join Room**. Sesudah room dibuat/diikuti, kedua pemain memilih avatar atau foto, menekan status Siap, lalu host memulai permainan. Kontrol: tap arena atau tombol **TAP**; desktop juga mendukung Spasi, panah atas, atau W. Gravitasi menarik karakter turun ketika tidak mengepak.

Kamera hanya diminta ketika pemain memilih Ambil Foto. Foto avatar dikompres ke JPEG 128×128 dengan batas 22 KB; avatar emoji tetap tersedia.

## Bomber Arena v0.51.2 — room-start repair

Memperbaiki kegagalan bootstrap yang sebelumnya menyebabkan layar “Menunggu pemain…” tidak pernah masuk arena. Status Ready host dan guest dipertahankan saat sesi Bomber Arena dibuat karena Firebase Rules memakai kedua nilai tersebut untuk mengizinkan meta awal. Kedua perangkat harus tetap online. Bila sesi lama telanjur macet dengan status Ready terhapus, host perlu kembali ke lobi, meminta kedua pemain menekan Siap, lalu memulai sesi baru. Kegagalan bootstrap kini ditampilkan dengan pesan dan tindakan pemulihan, bukan loading tanpa batas. Firebase Rules tidak berubah.

## Instalasi
1. Backup repository GitHub Pages.
2. Ekstrak ZIP build dan unggah seluruh isinya ke root repository.
3. Firebase Rules tidak berubah pada v0.51.2. Jika masih PERMISSION_DENIED, layar sekarang menunjukkan tahap/path yang ditolak; kirim pesan lengkap tersebut untuk diagnosis Rules yang tepat.
4. Uji alur Buat Room, Join Room, presence, Ready, pemilihan avatar, permainan One Tap, serta hasil dengan dua perangkat.

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
