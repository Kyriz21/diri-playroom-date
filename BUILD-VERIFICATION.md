# Build Verification — Diri. Playroom Date v0.21

- Notifikasi Bomb Storm dan Balloon Pop memakai feedback kecil dalam alur halaman, tidak memakai toast fixed yang menutupi arena.
- Balloon Pop mengakhiri fase `playing` segera ketika host atau guest memiliki 0 nyawa; pemain yang masih bertahan menang. Bila keduanya habis, skor menentukan hasil.
- Panel hasil Balloon Pop menampilkan aksi Rematch yang meminta persetujuan kedua pemain.
- Kedua game arcade menggunakan helper webcam bersama berbasis `navigator.mediaDevices.getUserMedia`; kamera dan galeri merupakan tombol serta jalur terpisah.
- Kamera menggunakan dialog pratinjau video, tombol Ambil foto, dan kompresi canvas JPEG. Galeri tetap memakai input file biasa.
- Firebase Rules memperbolehkan transisi Balloon Pop `playing` → `result` ketika salah satu pemain memiliki `lives <= 0`.

## Pemeriksaan lokal

- 134/134 unit test lulus (`npm test`).
- Semua file JavaScript lolos `node --check`.
- `firebase-database.rules.json` berhasil diparse sebagai JSON.
- Arsip ZIP diverifikasi setelah dibuat.

## Belum dibuktikan

- Webcam PC dan kamera HP fisik dengan izin browser pada perangkat pengguna.
- Sinkronisasi eliminasi, hasil, dan rematch pada Firebase project aktif dengan dua perangkat nyata.
- Sensasi notifikasi dan layout responsif pada berbagai ukuran layar fisik.
