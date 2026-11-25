# Elemental Duo — Blueprint Implementasi Dunia 5

Build: v0.29.0  
Dunia: Jantung Kuno  
Cakupan: level 41–50  

## Rangkaian level

| Level | Nama | Kesulitan | Mekanik aktif | Tujuan kerja sama |
|---:|---|---|---|---|
| 41 | Simpul Pertama | Sulit | Es, arus, angin, lava dan uap berkala | Menggabungkan kembali kemampuan dari empat dunia sebelumnya |
| 42 | Gerbang Lima | Sulit | Dua katup elemen dan hazard terhubung | Bara membuka Segel Bara; Nira membuka Segel Air |
| 43 | Kristal Kembar | Expert | Dua tuas angin khusus elemen, es dan gust berbalik | Masing-masing pemain mengubah arah medan angin yang berbeda |
| 44 | Ruang Sinkron | Expert | Pijakan berurutan Nira lalu Bara, arus dan hazard berkala | Menyamakan waktu kedatangan pada kedua pressure plate |
| 45 | Jalur Terpilih | Expert | Cabang elemen, pulau bergerak, es, arus dan angin | Memilih jalur yang sesuai dan bertemu kembali di ujung arena |
| 46 | Pilar Harmoni | Expert | Dua katup, lift vertikal, arus naik dan uap | Membuka dua pilar sambil memakai lift sebagai rute tambahan |
| 47 | Ujian Bara | Expert | Magma naik, uap, katup tungku dan crosswind | Bara menghentikan aliran utama; keduanya menyeberangi ventilasi bergantian |
| 48 | Ujian Arus | Expert | Lantai es, arus berbalik, dua tuas dan updraft | Mengaktifkan dua kristal pengarah untuk menata jalur angin |
| 49 | Pintu Purba | Expert | Dua katup, dua tuas angin, pijakan berurutan | Membuka empat segel dengan pemilik elemen lalu Nira mengaktifkan pijakan lebih dahulu |
| 50 | Penyatuan Elemen | Expert · Final | Semua mekanik: lava, air, uap, es, arus, angin, katup, tuas, platform bergerak dan urutan pijakan | Menuntaskan seluruh segel, mengatur medan angin, lalu menyelesaikan urutan Nira → Bara dan masuk ke pintu masing-masing |

## Mekanik yang digunakan engine

### Kombinasi elemen
- `iceZones` dan platform `kind: ice` mempertahankan momentum ketika pemain melepas arah.
- `currents` memberi dorongan horizontal/vertikal, berdenyut, atau berbalik arah berdasarkan jam level bersama.
- `windZones` menerapkan gaya angin pada karakter dan dapat dikendalikan melalui tuas terkait (`leverId`).
- Hazard `fire`, `water`, `steam`, lava, serta gerakan/siklus tetap memakai collision dan renderer yang sama dengan dunia sebelumnya. Uap berbahaya bagi kedua karakter; air berbahaya bagi Bara; lava/api berbahaya bagi Nira.
- Platform dapat bergerak dan membawa karakter yang berdiri di atasnya.

### Katup dan tuas wajib
- `requiredValves` menjadi syarat tambahan pembukaan gerbang. Setiap katup diwajibkan memiliki hazard yang dikendalikan melalui `valveId`.
- `requiredWindLevers` menjadi syarat tambahan pembukaan gerbang. Setiap tuas diwajibkan mengendalikan minimal satu zona angin melalui `leverId`.
- Katup dan tuas yang terikat elemen hanya dapat diaktifkan karakter pemiliknya melalui tombol AKSI.
- Status katup dan tuas tersimpan di bawah `levels/{level}` pada Firebase RTDB; Firebase Rules tidak berubah.

### Urutan pijakan
- Level 44, 49, dan 50 memakai `switchSequence: ['water','fire']`. Nira harus mengaktifkan pijakan lebih dahulu, lalu Bara.
- Urutan ditulis atomik melalui transaksi Firebase pada node `switches`, sehingga kedua perangkat membaca indeks urutan yang sama.

## Pengamanan desain level
- Kedua pressure plate harus berada pada platform stabil, berada sebelum gerbang, dan dapat dijangkau dari spawn host maupun guest.
- Katup serta tuas wajib harus berada pada platform stabil dan dapat dijangkau dari kedua spawn; tidak ada kontrol wajib di atas lift vertikal atau platform berkala.
- Checkpoint tidak ditempatkan di dalam jangkauan horizontal hazard.
- Moving platform dan hazard periodik menggunakan `startedAt` serta offset `/.info/serverTimeOffset`, agar kedua perangkat menghitung fase yang sama walaupun jam HP berbeda.
- Platform bergerak tambahan di level 45, 46, 48, dan 50 memberi jalur alternatif; rute pijakan/kontrol wajib tetap memiliki pijakan stabil.

## Pengujian
- Tes otomatis memeriksa 10 blueprint unik, eskalasi kesulitan, cakupan seluruh mekanik, kontrol wajib, keterjangkauan dari kedua spawn, urutan pijakan, dan integrasi renderer.
- Pemeriksaan sintaks dijalankan untuk seluruh file JavaScript.
- Pengujian end-to-end menggunakan Firebase aktif pada dua HP tetap harus dilakukan setelah deployment; unit test tidak menggantikannya.
