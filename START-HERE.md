# Mulai di sini — Diri. Playroom Date v0.51.3

## Fokus rilis
- Memperbaiki izin penulisan metadata awal Bomber Arena pada `roomGames/{roomCode}/{sessionId}/bomberArena/meta`.
- Penulisan setup hanya diizinkan bagi host terautentikasi pada sesi Bomber Arena aktif dan room yang memiliki guest.
- Transisi ke `playing` tetap memerlukan state kedua pemain dan presence online keduanya.
- Firebase Rules pada versi ini berubah dan wajib dipublikasikan.

## Instalasi
1. Backup file website dan Rules lama.
2. Ekstrak ZIP dan upload seluruh isi ke root repository GitHub Pages.
3. Buka `firebase-database.rules.json`, salin seluruh JSON, tempel di Firebase Console → Realtime Database → Rules, lalu Publish.
4. Reload kedua perangkat.
5. Buat room baru, join dari HP kedua, pastikan keduanya Ready, kemudian mulai Bomber Arena.

Tidak perlu mengubah Firebase config. Jangan gunakan room yang gagal sebelumnya karena menyimpan activeSession lama.
