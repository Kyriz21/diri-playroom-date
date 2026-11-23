# Diri. Playroom Date — Foundation v0.1

Diri. Playroom Date adalah website aktivitas pasangan. Photobooth menjadi fitur pertama; mini-games dan aktivitas lain akan ditambahkan setelah Photobooth stabil.

## Keputusan produk

- **Nama project:** Diri. Playroom Date.
- **Fitur pertama:** Photobooth.
- **Mode awal:** Foto Sendiri, Buat Sesi Berdua, dan Gabung Sesi.
- **Foto Sendiri:** langsung masuk editor Photobooth tanpa room, login, atau Firebase. Foto dan galeri disimpan lokal pada perangkat.
- **Buat Sesi Berdua:** membuat kode enam karakter. Pembuat membagikan kode kepada pasangan.
- **Gabung Sesi:** pasangan memasukkan kode. Setelah berhasil bergabung, sesi Photobooth bersama dibuka otomatis—tanpa memilih game atau menekan tombol Ready di lobi.
- **Mini-games:** delapan modul dari build sebelumnya tetap dipertahankan di source sebagai referensi, tetapi belum ditampilkan di menu utama. Akan dibuka setelah tahap Photobooth selesai.

## Memanfaatkan progres build sebelumnya

Foundation ini menggunakan **LDR Playroom Review Build v1.2** sebagai basis teknis, bukan mengulang semua dari nol. Modul yang dipertahankan meliputi:

- 16 desain frame tematik asli: Koran, Buronan, Komik, Sinema, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Kawaii, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- Editor teks/stiker yang dapat digeser dengan mouse atau layar sentuh.
- Kamera browser dan pemilihan foto dari galeri.
- Empat slot foto pribadi, pratinjau, dan retake per slot.
- Pengaturan frame/filter, ekspor PNG/JPEG, cetak, dan galeri lokal.
- Untuk mode berdua: satu pengaturan bersama, empat foto per orang, transfer langsung WebRTC/STUN dengan fallback pemindahan manual, pratinjau gabungan delapan foto, retake bersama, dan persetujuan sebelum ekspor/cetak.
- Fondasi autentikasi anonim, kode sesi, status kehadiran, dan aturan Realtime Database.

Perubahan utama v0.1 adalah alur masuk yang baru. Firebase dimuat secara dinamis hanya ketika pengguna membuat atau bergabung ke sesi. Karena itu, mode Foto Sendiri tetap dapat digunakan sebelum Firebase project baru dibuat atau dikonfigurasi.

## Teknologi dan batasan biaya

- Hosting statis: GitHub Pages.
- Backend sesi berdua: Firebase Spark, Anonymous Authentication, dan Realtime Database.
- Foto: IndexedDB/local browser untuk mode sendiri; WebRTC/STUN atau pemindahan manual untuk mode berdua.
- Tidak memakai Firebase Cloud Storage, Cloud Functions, server sendiri, database tambahan, atau TURN berbayar.
- Kamera browser memerlukan HTTPS (GitHub Pages memenuhi syarat secure context).

## Mulai secara lokal

Gunakan Node.js untuk pemeriksaan logika:

```bash
npm test
```

Untuk mencoba halaman, jalankan static server dari folder ini, misalnya:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`. Foto Sendiri dapat dicoba secara lokal. Kamera membutuhkan localhost/HTTPS. Buat/Gabung Sesi memerlukan Firebase project baru yang sudah diisi pada `js/firebase.js`.

## Deploy baru

1. Buat repository GitHub baru, misalnya `diri-playroom-date`.
2. Buat Firebase project baru bernama `Diri Playroom Date`; jangan gunakan konfigurasi project lama.
3. Ikuti `FIREBASE-SETUP.md` untuk mengisi Web App config, mengaktifkan Anonymous Authentication, membuat Realtime Database, dan memublikasikan Rules.
4. Upload isi folder ini ke root repository (pastikan `index.html` berada di root, bukan di folder pembungkus).
5. Aktifkan GitHub Pages dari branch `main`, folder `/(root)`.
6. Uji mode Foto Sendiri, lalu mode Berdua pada dua perangkat/browser berbeda.

**Jangan hapus repository atau Firebase lama sampai project baru berhasil diuji.** Simpan backup ZIP build lama untuk rollback. Setelah project baru stabil dan tidak ada data yang masih dibutuhkan, barulah project lama boleh dihapus.

## Pemeriksaan dan batasan yang belum diuji

Build ini sudah melewati pemeriksaan sintaks JavaScript dan unit test lokal. Hal yang tetap memerlukan uji nyata:

- Kamera pada laptop dan HP dengan izin browser yang sebenarnya.
- Interaksi drag dengan mouse dan layar sentuh.
- Firebase Rules pada project baru.
- Auto-start sesi setelah pasangan bergabung dari dua perangkat.
- WebRTC/STUN pada jaringan berbeda dan fallback pemindahan manual.
- Pratinjau gabungan, persetujuan, PNG/JPEG, dan dialog cetak.

Lihat `REVIEW-BUILD-QA.md`, `KNOWN-LIMITATIONS.md`, dan `SECURITY-NOTES.md` sebelum uji dua perangkat.
