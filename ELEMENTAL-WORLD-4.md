# Elemental Duo — Blueprint Implementasi Dunia 4

Build: v0.28.0  
Dunia: Reruntuhan Langit  
Cakupan: level 31–40

## Rangkaian level

| Level | Nama | Kesulitan | Mekanik aktif | Tujuan kerja sama |
|---:|---|---|---|---|
| 31 | Tangga Awan | Sulit | Updraft vertikal dan hembusan berdenyut | Menggunakan arus naik untuk menjangkau pijakan tinggi |
| 32 | Pulau Melayang | Sulit | Pulau bergerak dan hembusan diagonal | Menunggu platform mendekat dan menjaga posisi ketika terkena gust |
| 33 | Lorong Angin | Sulit | Dua lorong angin berlawanan | Menggunakan hembusan pertama dan mengatur waktu saat melawan hembusan kedua |
| 34 | Menara Terbalik | Sulit | Lift vertikal dan dua updraft kuat | Memanjat menara melalui pijakan yang bergerak dan arus naik |
| 35 | Kunci Badai | Sulit | Tuas pembalik arah angin | Mengaktifkan tuas badai untuk membalik arah hembusan sebelum gerbang terbuka |
| 36 | Jembatan Awan | Sulit | Dua platform awan bergerak dan crosswind | Menyeberang melalui platform yang saling mendekat/menjauh |
| 37 | Kubah Senyap | Expert | Lorong angin dan zona tenang | Menggunakan area tenang untuk menyiapkan lompatan presisi |
| 38 | Portal Kembar | Expert | Dua tuas angin khusus elemen | Bara mengaktifkan tuas Bara dan Nira mengaktifkan tuas Air |
| 39 | Labirin Langit | Expert | Lorong angin yang membalik arah dan hazard bergerak | Membaca arah hembusan yang berubah pada fase berbeda |
| 40 | Penjaga Angin | Expert | Dua tuas, lift vertikal, gust berbalik, dan platform bergerak | Menggabungkan seluruh mekanik Dunia 4 untuk membuka gerbang final |

## Mekanik yang benar-benar digunakan engine

### Zona angin
- Setiap zona memiliki koordinat, lebar/tinggi, gaya horizontal (`forceX`) dan vertikal (`forceY`).
- Angin mendorong karakter ketika badan karakter masuk ke area zona. Gaya memengaruhi kecepatan gerak dan tinggi/jatuh lompatan.
- `pulsePeriodMs` membuat kekuatan hembusan berdenyut.
- `reversePeriodMs` membalik arah angin secara berkala.
- Panah dan aliran partikel dirender berdasarkan arah dan fase yang sama dengan fisika.

### Tuas pengubah arah angin
- Tuas memiliki `id`, posisi, label, radius interaksi, dan elemen pemilik opsional.
- Pemain mendekati tuas dan menggunakan **AKSI** (E/Enter pada desktop, tombol AKSI pada HP).
- Jika tuas memiliki `element`, hanya karakter dengan elemen tersebut yang dapat mengaktifkannya.
- Status tuas disimpan pada `levels/{level}/windLevers/{id}` melalui transaksi Firebase RTDB.
- Zona angin dengan `leverId` membalik gaya horizontal dan vertikal setelah tuas terkait aktif.
- `requiredWindLevers` menjadi syarat tambahan pembukaan gerbang, selain dua pijakan dan katup jika ada.

### Platform awan
- Platform `kind: cloud` memiliki tampilan awan tersendiri tetapi menggunakan collision platform normal.
- Platform dapat bergerak horizontal/vertikal dengan `motion`; karakter yang berdiri di atas platform ikut terbawa sesuai delta posisi.
- Lift vertikal tidak digunakan sebagai tempat tuas atau pressure plate wajib.

## Prinsip desain dan pengamanan
- Kedua pressure plate tetap berada sebelum gerbang dan di atas platform stabil.
- Tuas yang diwajibkan gerbang ditempatkan di platform stabil yang bisa dijangkau dari spawn.
- Tidak ada tuas wajib yang bergantung pada lift vertikal atau platform berkala.
- Angin adalah gaya lingkungan, bukan hazard yang menyebabkan kematian langsung; pemain dapat mengoreksi posisi melalui kontrol.
- Fase angin, platform, dan hazard memakai `startedAt` bersama dan `/.info/serverTimeOffset` Firebase.
- State tuas berada di bawah `levels/{level}` yang sudah ada; Firebase Rules tidak berubah.

## Batas pengujian
- Unit test memeriksa 10 blueprint unik, eskalasi kesulitan, arah/denyut angin deterministik, pembalikan tuas, integrasi fisika dan renderer, status tuas di RTDB, jangkauan pressure plate, serta lokasi tuas pada platform stabil.
- Pemeriksaan sintaks dilakukan untuk seluruh JavaScript.
- Uji end-to-end dengan Firebase aktif pada dua perangkat tetap perlu dilakukan sebelum Dunia 4 dianggap final.
