# Diri. Playroom Date v0.51.3

## Bomber Arena — Firebase metadata permission repair

v0.51.3 memperbaiki Rules khusus pada `roomGames/{roomCode}/{sessionId}/bomberArena/meta`.

Akar masalah yang ditargetkan: pembuatan metadata `setup` mengulang pemeriksaan Ready dan Presence, padahal `lobby/activeSession` hanya dapat dibuat oleh host ketika kedua pemain sudah Ready dan keduanya online. Pemeriksaan berulang ini dapat menolak bootstrap saat presence berubah sesaat atau cache status antarperangkat belum seragam.

Perbaikan: metadata awal hanya dapat dibuat oleh host yang terautentikasi untuk room dan session Bomber Arena aktif, selama room masih valid dan ada guest. Transisi `setup` ke `playing` tetap mensyaratkan kedua state pemain tersedia dan kedua presence online. Simulasi, input, bom, power-up, dan hasil tetap dibatasi sebagaimana sebelumnya.

## Instalasi penting

1. Backup repository GitHub Pages dan Firebase Rules yang sedang aktif.
2. Upload seluruh isi ZIP ini ke root repository GitHub Pages.
3. Buka Firebase Console → Realtime Database → Rules.
4. Ganti Rules dengan file `firebase-database.rules.json` dari build ini, lalu Publish. Rules pada versi ini **berubah**; tidak cukup hanya mengunggah file website.
5. Buat room baru dan uji dengan dua perangkat. Jangan gunakan room lama.

Jangan membuka akses umum (`.read: true` / `.write: true`). Rules tetap membatasi penulisan metadata setup ke host aktif, session yang cocok, dan room dengan guest.

Automated test memeriksa struktur dan kontrak Rules. Pengujian terhadap Firebase project aktif tetap harus dilakukan setelah Rules dipublikasikan.
