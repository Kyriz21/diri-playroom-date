# Diri. Playroom Date — Reliable Photo Transfer v0.9

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

- 18 desain frame tematik asli: Koran, Buronan, Komik, Sinema, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Kawaii, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- Editor teks/stiker yang dapat digeser dengan mouse atau layar sentuh.
- Kamera browser dan pemilihan foto dari galeri.
- Empat slot foto pribadi, pratinjau, dan retake per slot.
- Pengaturan frame/filter, ekspor PNG/JPEG, cetak, dan galeri lokal.
- Untuk mode berdua: satu pengaturan bersama, empat foto per orang, transfer langsung WebRTC/STUN dengan fallback otomatis Firebase Realtime Database, pratinjau gabungan delapan foto, retake bersama, dan persetujuan sebelum ekspor/cetak.
- Fondasi autentikasi anonim, kode sesi, status kehadiran, dan aturan Realtime Database.

Perubahan utama v0.1 adalah alur masuk yang baru. Firebase dimuat secara dinamis hanya ketika pengguna membuat atau bergabung ke sesi. Karena itu, mode Foto Sendiri tetap dapat digunakan sebelum Firebase project baru dibuat atau dikonfigurasi.

## Pembaruan visual Photobooth v0.2

- Hiasan/stiker kini tampil tanpa kotak putih, latar kartu, atau border. Palet menyediakan 16 pilihan yang dapat dipilih satu per satu.
- Hasil ekspor PNG/JPEG mengikuti konsep hiasan transparan; simbol dan teks digambar langsung tanpa latar kotak.
- Ornamen utama setiap tema juga digambar pada hasil ekspor dengan posisi yang diselaraskan dengan pratinjau. Bingkai Koran, Buronan, Komik, dan Kawaii memiliki komposisi visual khusus.
- Frame memiliki komposisi tematik: Koran, Poster Buronan, Komik Pop Art, Kawaii, Korean Four-Cut, Film Analog, Polaroid, Kartu Pos, Botani, Majalah, Y2K, Arkade, Surat Cinta, Ulang Tahun, dan Doodle.
- Foto mendapatkan caption dan gaya kartu sesuai tema. Pratinjau browser serta renderer ekspor menggunakan identitas tema yang sama.
- Jarak baris pada hasil ekspor diperlebar untuk memberi ruang bagi label foto.

## Teknologi dan batasan biaya

- Hosting statis: GitHub Pages.
- Backend sesi berdua: Firebase Spark, Anonymous Authentication, dan Realtime Database.
- Foto: IndexedDB/local browser untuk mode sendiri; WebRTC DataChannel sebagai jalur cepat, lalu Firebase Realtime Database sebagai relay sementara otomatis jika koneksi langsung gagal. Foto relay dikompres ke JPEG maksimum 256 KiB per foto, diverifikasi SHA-256, dan dihapus dari database setelah kedua perangkat menyimpan salinan dan mengirim tanda terima.
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

## Transfer foto berdua v0.9

1. Kedua perangkat mengambil empat foto dan menyimpannya di IndexedDB lokal.
2. WebRTC dicoba sebagai jalur langsung. Setiap foto harus mendapat ACK dan checksum SHA-256 yang cocok sebelum pengiriman dianggap berhasil.
3. Jika ICE/DataChannel gagal atau macet, aplikasi beralih otomatis ke RTDB relay; pengguna tidak diminta memilih delapan file secara manual.
4. Setiap perangkat mengompres empat fotonya menjadi JPEG maksimal 256 KiB per foto, mengunggah ke path transfer unik, lalu mengambil empat foto pasangan.
5. Penerima memeriksa tipe, ukuran, nomor slot, peran pengirim, dan SHA-256 sebelum menyimpan file.
6. Kedua perangkat mengirim ACK setelah semua foto pasangan tersimpan secara lokal. Editor dibuka setelah kedua ACK diterima.
7. Data relay dihapus setelah kedua perangkat menyelesaikan penyimpanan. Jika salah satu perangkat terputus, klien menunggu Firebase tersambung lagi dan mencoba ulang.

**Wajib:** setelah mengganti source ke v0.9, publikasikan ulang `firebase-database.rules.json` dari ZIP di Firebase Console → Realtime Database → Rules. Rules baru memvalidasi ukuran, tipe, peran, dan nomor slot foto relay. Tanpa Rules ini transfer dapat ditolak.

## Pemeriksaan dan batasan yang belum diuji

Build ini sudah melewati pemeriksaan sintaks JavaScript dan unit test lokal. Hal yang tetap memerlukan uji nyata:

- Kamera pada laptop dan HP dengan izin browser yang sebenarnya.
- Interaksi drag dengan mouse dan layar sentuh.
- Firebase Rules pada project baru.
- Auto-start sesi setelah pasangan bergabung dari dua perangkat.
- WebRTC/STUN pada jaringan berbeda dan fallback otomatis Firebase RTDB pada skenario WebRTC diblokir.
- Pratinjau gabungan, persetujuan, PNG/JPEG, dan dialog cetak.

Lihat `REVIEW-BUILD-QA.md`, `KNOWN-LIMITATIONS.md`, dan `SECURITY-NOTES.md` sebelum uji dua perangkat.


### Editor hiasan langsung (v0.3)
- Seret teks atau stiker langsung pada pratinjau untuk memindahkan.
- Tarik pegangan ↘ pada sudut elemen untuk mengubah ukurannya langsung.
- Pada HP/tablet, gunakan dua jari untuk mencubit elemen dan mengubah ukurannya.
- Pada desktop, arahkan kursor ke elemen dan putar roda mouse untuk mengubah ukurannya.
- Pilih elemen lalu tekan tanda × kecil untuk menghapusnya.
- Tidak ada lagi toolbar panah atau tombol A+/A−.


### Pembaruan v0.4.0
Memperbaiki interupsi `video.play()` ketika tampilan sesi berdua dirender ulang oleh pembaruan Firebase. Kamera sekarang mencoba kembali pada elemen video terbaru dan menunggu preview aktif sebelum mengaktifkan tombol ambil foto.
## Firebase configuration

The Web App configuration in `js/firebase.js` is already connected to the `diri-playroom-date` Firebase project supplied by the project owner. Do not replace the project configuration. Confirm that Anonymous Authentication, the Realtime Database, the GitHub Pages authorized domain, and the v0.9 Rules are enabled/published. Firebase Web configuration values are client-side identifiers; protect database access with Authentication and Realtime Database Rules.

## Foto Sendiri flow

Foto Sendiri is camera-first: capture four photos one by one, review the four slots, retake any slot if needed, then continue to the editor. It does not offer the four-file gallery shortcut.


### v0.6 — Frame baru
Katalog kini memiliki 18 tema, termasuk Dunia Mainan dan Polaroid Sosial. Dua desain ini memiliki komposisi, ornamen, dan bentuk bingkai berbeda—bukan sekadar variasi warna.

## Frame v0.6
Katalog berisi 18 tema. Dua tambahan baru: **Dunia Mainan** (tema kartun ceria dengan maskot orisinal) dan **Polaroid Sosial** (kartu foto instan miring di atas latar kuning).


## Photobooth flow in v0.8
- Solo: pilih bingkai, ambil empat foto dari kamera, masuk editor, tambahkan emoji/teks tanpa latar, lalu unduh/simpan.
- Berdua: pilih bingkai dan pengaturan bersama, ambil empat foto per pemain, tinjau strip gabungan, tambahkan emoji/teks bersama, setujui hasil, lalu unduh/cetak.
- Export menggambar foto terlebih dahulu dan hanya menggambar garis/ornamen bingkai setelahnya; area foto tidak boleh ditimpa bidang putih.

## Urutan Photobooth

- Sendiri: pilih bingkai, buka kamera dan ambil empat foto, lanjut ke editor hiasan/filter, lalu unduh.
- Berdua: pilih satu bingkai bersama, masing-masing mengambil empat foto dengan kamera, gabungkan hasil, edit hiasan bersama, setujui, lalu unduh/cetak.
- File ekspor memvalidasi bahwa semua foto sudah benar-benar digambar agar tidak lagi menghasilkan frame kosong.
