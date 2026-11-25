# Elemental Duo — Panduan Game

**Elemental Duo** adalah platform-puzzle kooperatif untuk dua pemain. Pola permainan menekankan kerja sama dua karakter elemen: melewati jalur platform, menghindari bahaya yang berlawanan, mengumpulkan permata milik karakter sendiri, mengaktifkan pijakan, lalu mencapai pintu masing-masing.

## Karakter dan aturan elemen

- **Bara** dimainkan oleh host/pembuat sesi. Bara aman melewati lava/api, tetapi akan jatuh jika menyentuh air. Bara mengumpulkan permata bara dan mengaktifkan pijakan Bara.
- **Nira** dimainkan oleh guest/pemain yang bergabung. Nira aman melewati air, tetapi akan jatuh jika menyentuh lava/api. Nira mengumpulkan permata air dan mengaktifkan pijakan Air.
- Permata karakter lain tidak dapat dikumpulkan. Permata bersifat opsional untuk meningkatkan penilaian bintang.
- Menyentuh bahaya yang tidak sesuai akan mengembalikan karakter ke titik aman dan menambah jumlah jatuh.

## Tujuan setiap level

1. Jelajahi arena platform dan gunakan tombol kiri/kanan serta lompat untuk berpindah antarpijakan.
2. Hindari bahaya yang tidak cocok dengan elemen karakter. Bara boleh melewati lava tetapi tidak air; Nira boleh melewati air tetapi tidak lava.
3. Kumpulkan permata sesuai elemen masing-masing untuk memperoleh bintang tambahan.
4. Injak pijakan Bara dan pijakan Air. Kedua pijakan harus aktif agar penghalang bersama terbuka. Pijakan tetap aktif setelah diinjak.
5. Setelah penghalang terbuka, Bara masuk ke pintu Bara dan Nira masuk ke pintu Air.
6. Pemain yang lebih dahulu mencapai pintunya akan menunggu pasangannya. Level berikutnya terbuka otomatis setelah keduanya tiba.

## Struktur petualangan

| Dunia | Level | Tema |
|---|---:|---|
| Hutan Berbisik | 1–10 | Hutan dan tanaman lentur |
| Kedalaman Kristal | 11–20 | Gua kristal dan lantai licin |
| Kerajaan Bara | 21–30 | Tungku, arang, dan panas berdenyut |
| Reruntuhan Langit | 31–40 | Pulau melayang dan arus angin |
| Jantung Kuno | 41–50 | Ujian gabungan seluruh kemampuan |

Setiap level memiliki konfigurasi platform, bahaya elemen, pijakan, permata, titik aman, penghalang, dan sepasang pintu. Satu engine menangani seluruh level agar mudah dirawat.

## Kontrol

| Aksi | Desktop | HP/tablet |
|---|---|---|
| Bergerak kiri | A atau ← | Tombol ← |
| Bergerak kanan | D atau → | Tombol → |
| Melompat | Space atau W/↑ | Tombol LOMPAT |
| Interaksi alternatif | E atau Enter | Tombol AKSI |
| Perbesar arena | Tombol layar penuh | Tombol ⛶ |

Pada HP, arena menggunakan kamera yang mengikuti area pemain dan memperbesar bagian level yang relevan. Putar perangkat ke mode landscape untuk area pandang yang lebih lebar. Tombol arah dan lompat dibuat lebih besar untuk layar sentuh.

## Penilaian

- **3 bintang:** dua permata terkumpul dan kedua pemain menyelesaikan level tanpa jatuh.
- **2 bintang:** jumlah jatuh gabungan pada level tidak lebih dari dua.
- **1 bintang:** level selesai dengan jumlah jatuh yang lebih banyak.

Hasil bintang dan permata direkap setelah menyelesaikan level 50.

## Sinkronisasi dan batasan

Game menyimpan status pemain, posisi, kesiapan, status pijakan, permata, dan hasil level pada Firebase Realtime Database di `roomGames/{kode}/{sessionId}/elementalDuo`. Data berada pada node khusus dan hanya dapat dibaca/ditulis oleh anggota ruang ketika sesi aktif bertipe `elementalduo`.

- Tidak menggunakan Cloud Storage, Cloud Functions, server khusus, atau TURN berbayar.
- Firebase Rules tidak berubah pada revisi v0.24.1; Rules v0.22 yang sudah dipasang tetap berlaku.
- Gerak pemain dikirim berkala melalui RTDB; kualitas gerak jarak jauh dipengaruhi koneksi masing-masing perangkat.
- Status tiba pemain dikirim melalui antrean tulis agar pembaruan selesai tidak terlewat ketika sinkronisasi posisi masih berlangsung. Kunci transisi yang tertinggal juga memiliki pemulihan otomatis.
- Progres permainan mengikuti sesi aktif. Ketika host mengakhiri sesi dan kembali ke lobi, data game sesi tersebut dibersihkan sesuai mekanisme proyek.
- Belum ada uji end-to-end pada Firebase aktif dengan dua perangkat pengguna; gunakan checklist terbaru di `REVIEW-BUILD-QA.md`.


## HUD v0.24.2
Teks objektif dan notifikasi tidak ditampilkan di atas kanvas permainan. Objektif dibaca melalui HUD pijakan/status pemain dan deskripsi level; pesan sementara muncul di strip status di luar arena. Firebase Rules tidak berubah.
