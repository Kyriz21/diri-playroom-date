# Elemental Duo — Blueprint Implementasi Dunia 1

Build: v0.25.0  
Dunia: Hutan Berbisik  
Cakupan: level 01–10

## Rangkaian level

| Level | Nama | Kesulitan | Mekanik yang benar-benar aktif | Tujuan pemain |
|---:|---|---|---|---|
| 01 | Jejak Cahaya | Mudah | Kontrol dasar, hazard air/api, pijakan, permata | Belajar bergerak dan melompat melewati bahaya elemen |
| 02 | Batu Bertunas | Mudah | Dua zona bahaya elemen, platform bertingkat, pijakan di platform | Memilih jalur aman berdasarkan karakter |
| 03 | Akar Berliku | Mudah | Platform pijakan, permata di atas platform | Mengumpulkan permata Bara dan Air masing-masing |
| 04 | Jembatan Pucuk | Normal | Susunan platform berantai dan jalur terpisah | Menempuh rute yang berbeda dan bertemu di gerbang |
| 05 | Dua Lentera | Normal | Pijakan elemen di platform tinggi | Melompat ke dua pijakan untuk membuka gerbang bersama |
| 06 | Lompatan Lumut | Normal | Platform jamur pantul (`kind: bounce`) | Memakai pantulan untuk berpindah platform dan mengontrol arah di udara |
| 07 | Gerbang Embun | Menengah | Menara platform vertikal dan pijakan elevated | Naik bertahap melalui rangkaian lompatan |
| 08 | Akar Berayun | Menengah | Platform bergerak, platform berkala | Membaca ritme dan menggunakan pijakan yang bergerak/aktif |
| 09 | Ruang Kunang-kunang | Menengah | Dua platform jembatan bergerak | Menyeberang sambil menunggu posisi jembatan yang tepat |
| 10 | Jantung Hutan | Menengah | Hazard bergerak, jamur pantul, platform bergerak/berkala, pijakan elevated | Menggabungkan mekanik yang dipelajari di Dunia 1 |

## Aturan mekanik

- Bara (`fire`) aman pada hazard api dan harus menghindari air.
- Nira (`water`) aman pada hazard air dan harus menghindari api.
- Masing-masing karakter hanya dapat mengaktifkan pijakan elemennya sendiri.
- Pijakan kedua karakter berada sebelum gerbang; gerbang tidak boleh menutup akses ke sakelar yang dibutuhkan untuk membukanya.
- Permata karakter masing-masing bersifat bonus dan bukan prasyarat membuka gerbang.
- Platform bergerak memakai lintasan sinusoidal dengan periode, amplitudo, sumbu, dan fase yang didefinisikan pada data level. Jam level diselaraskan dengan `/.info/serverTimeOffset` Firebase sebelum permainan dimulai agar kedua perangkat menghitung fase yang sama.
- Platform berkala aktif/nonaktif sesuai periode. Saat platform menghilang di bawah pemain, pemain jatuh secara normal.
- Karakter yang berdiri pada platform bergerak dibawa sejauh perubahan koordinat platform.
- Jamur pantul memberikan impuls lompat saat karakter mendarat.
- Pijakan dapat ditempatkan di lantai maupun di atas platform dan diaktifkan otomatis saat karakter berdiri di atasnya.

## Penilaian kesulitan

- Level 01–03: Mudah — pengenalan kontrol, bahaya elemen, dan permata.
- Level 04–06: Normal — rute lebih rumit, pijakan tinggi, dan mekanik pantul.
- Level 07–10: Menengah — gerak vertikal, platform bergerak/berkala, dan gabungan tantangan.

Kesulitan meningkat melalui desain ruang dan mekanik, bukan sekadar menaikkan kecepatan karakter.

## Batas cakupan build

Level 11–50 masih memakai generator layout sebelumnya. Dunia 2–5 belum mendapatkan blueprint khusus dalam v0.25.0. Lanjutkan setelah 10 level Hutan Berbisik diuji pada dua perangkat, terutama collision, pergerakan platform, sinkronisasi fase, dan transisi pintu.
