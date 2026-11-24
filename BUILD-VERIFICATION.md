# Build Verification — Diri. Playroom Date v0.22

## Elemental Duo
- 50 level terdaftar dalam tepat lima dunia, dengan nama level unik.
- Setiap level memiliki dua simpul elemen, dua serpihan, platform, zona bahaya, checkpoint, titik spawn, dan gerbang.
- Game didaftarkan pada katalog dan memiliki rute Buat/Gabung sesi tersendiri.
- Kontrol keyboard dan pointer sentuh tersedia; posisi karakter dikirim berkala ke Firebase RTDB.
- Progres level dikoordinasikan oleh host setelah kedua pemain menyentuh gerbang.
- Jumlah jatuh per level disimpan bersama state pemain agar penilaian bintang menggunakan data level berjalan.
- Firebase Rules menambahkan `elementalduo` pada validasi pilihan game dan activeSession; data Elemental Duo berada di `roomGames/{kode}/{sessionId}/elementalDuo`. Rules v0.22 harus dipublikasikan.

## Pemeriksaan lokal
- 145/145 unit test lulus (`npm test`).
- `node --check` lulus untuk seluruh file JavaScript proyek.
- `firebase-database.rules.json` berhasil diparse sebagai JSON.
- Tidak ada penambahan dependensi npm.

## Belum dibuktikan pada perangkat nyata
- Sinkronisasi gerak, tombol, sakelar, pergantian level, dan penyelesaian game melalui Firebase aktif dengan dua perangkat fisik.
- Kenyamanan tingkat kesulitan dan keterjangkauan semua lompatan pada layar sentuh.
- Uji browser otomatis visual tidak diselesaikan di lingkungan build ini; verifikasi akhir tetap memerlukan checklist manual dua perangkat.

---

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
