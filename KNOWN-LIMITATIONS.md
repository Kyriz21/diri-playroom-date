# Keterbatasan yang diketahui — Diri. Playroom Date v0.1

1. Firebase config sengaja masih berupa placeholder. Create/Gabung Sesi belum dapat dipakai sampai pengguna membuat Firebase project baru, mengisi `js/firebase.js`, mengaktifkan Anonymous Authentication, membuat Realtime Database, dan memublikasikan Rules.
2. Foto Sendiri dirancang berjalan tanpa Firebase. Galeri dan media disimpan pada IndexedDB browser lokal dan tidak otomatis berpindah ke perangkat lain.
3. Kamera memerlukan localhost atau HTTPS, izin kamera, serta browser yang mendukung `getUserMedia`.
4. WebRTC/STUN tidak menjamin koneksi langsung pada semua jaringan. Transfer manual tetap menjadi fallback; TURN berbayar tidak disertakan.
5. Sinkronisasi sesi, transfer foto, dan auto-start belum diuji dengan Firebase project baru atau dua perangkat nyata pada build fondasi ini.
6. Delapan game lama tetap berada pada source tree, tetapi belum menjadi menu/route pengguna pada foundation v0.1. Kita akan mengintegrasikannya kembali setelah Photobooth lolos uji end-to-end.
7. Menghapus data situs/browser dapat menghapus galeri pribadi dan Anonymous UID lokal. Simpan hasil foto ke perangkat sebelum membersihkan data browser.
8. Firebase Rules membatasi akses berdasarkan sesi/UID, tetapi client-side game logic bukan backend tepercaya untuk hadiah, uang, atau data sensitif.
