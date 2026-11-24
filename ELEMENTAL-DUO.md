# Elemental Duo — Panduan Game

**Elemental Duo** adalah petualangan platformer kooperatif untuk dua pemain. Pemain tidak saling berlomba; keduanya harus bekerja sama untuk membuka jalan dan mencapai gerbang pada setiap level.

## Karakter

- **Bara** dimainkan oleh host/pembuat sesi. Bara mengaktifkan simpul bara dan aman melewati zona api.
- **Nira** dimainkan oleh guest/pemain yang bergabung. Nira mengaktifkan simpul air dan aman melewati zona air.

Zona elemen yang tidak sesuai akan mengembalikan karakter ke titik aman dan menambah jumlah jatuh.

## Tujuan level

1. Jelajahi arena dan temukan simpul Bara serta simpul Nira.
2. Tekan aksi saat karakter berada dekat simpul yang sesuai.
3. Kumpulkan serpihan energi sesuai karakter (opsional, untuk meningkatkan bintang).
4. Setelah kedua simpul aktif, gerbang terbuka.
5. Kedua pemain harus menyentuh gerbang. Jika salah satu sudah tiba lebih dulu, ia menunggu pasangannya.
6. Setelah keduanya tiba, level berikutnya terbuka otomatis.

## Struktur petualangan

| Dunia | Level | Tema |
|---|---:|---|
| Hutan Berbisik | 1–10 | Hutan dan tanaman lentur |
| Kedalaman Kristal | 11–20 | Gua kristal dan lantai licin |
| Kerajaan Bara | 21–30 | Tungku, arang, dan panas berdenyut |
| Reruntuhan Langit | 31–40 | Pulau melayang dan arus angin |
| Jantung Kuno | 41–50 | Ujian gabungan seluruh kemampuan |

Setiap level memiliki konfigurasi platform, zona bahaya, simpul, dan dua serpihan yang berbeda. Satu engine menangani seluruh level agar mudah dirawat.

## Kontrol

| Aksi | Desktop | HP/tablet |
|---|---|---|
| Bergerak kiri | A atau ← | Tombol ← |
| Bergerak kanan | D atau → | Tombol → |
| Melompat | Space atau W/↑ | Tombol LOMPAT |
| Berinteraksi | E atau Enter | Tombol AKSI |

## Penilaian

- **3 bintang:** dua serpihan terkumpul dan kedua pemain menyelesaikan level tanpa jatuh.
- **2 bintang:** jumlah jatuh gabungan pada level tidak lebih dari dua.
- **1 bintang:** level selesai dengan jumlah jatuh yang lebih banyak.

Hasil bintang dan serpihan direkap setelah menyelesaikan level 50.

## Sinkronisasi dan batasan

Game menyimpan status pemain, posisi, tombol siap, status simpul, serpihan, dan hasil level pada Firebase Realtime Database di `roomGames/{kode}/{sessionId}/elementalDuo`. Data berada pada node khusus dan hanya dapat dibaca/ditulis oleh anggota ruang ketika sesi aktif bertipe `elementalduo`.

- Tidak menggunakan Cloud Storage, Cloud Functions, server khusus, atau TURN berbayar.
- Memerlukan Rules v0.22 dipublikasikan satu kali untuk memasukkan `elementalduo` ke daftar ID game yang diizinkan.
- Gerak pemain dikirim berkala melalui RTDB; kualitas gerak jarak jauh dipengaruhi koneksi masing-masing perangkat.
- Progres permainan mengikuti sesi aktif. Ketika host mengakhiri sesi dan kembali ke lobi, data game sesi tersebut dibersihkan sesuai mekanisme proyek.
- Belum ada uji end-to-end pada Firebase aktif dengan dua perangkat pengguna; gunakan checklist di `REVIEW-BUILD-QA.md`.
