# Elemental Duo — Blueprint Implementasi Dunia 3

Build: v0.27.0  
Dunia: Kerajaan Bara  
Cakupan: level 21–30

## Rangkaian level

| Level | Nama | Kesulitan | Mekanik aktif | Tujuan kerja sama |
|---:|---|---|---|---|
| 21 | Napas Lava | Menengah | Lava/api yang menyala dan padam secara berkala | Membaca ritme magma sebelum Nira menyeberang dan Bara memilih jalur aman |
| 22 | Uap Panas | Menengah | Ventilasi uap berdenyut dan berbahaya bagi kedua elemen | Menunggu fase uap padam sebelum melanjutkan |
| 23 | Gerbang Panas | Menengah | Katup Bara yang menutup aliran magma | Bara membuka katup; keduanya mengaktifkan pijakan dan melanjutkan |
| 24 | Jembatan Bara | Menengah | Platform bergerak di atas lava | Menyeberang dengan mengatur waktu lompatan dan posisi platform |
| 25 | Sungai Pendingin | Menengah | Jalur air/lava, arus pendingin, uap | Memilih rute sesuai elemen dan membaca arus |
| 26 | Sakelar Berantai | Sulit | Urutan pijakan Nira lalu Bara dan uap berwaktu | Mengaktifkan kedua pijakan sesuai urutan wajib |
| 27 | Lorong Uap | Sulit | Ventilasi uap aktif bergantian dan platform bergerak | Menunggu jeda aman pada beberapa vent yang berbeda fase |
| 28 | Lava Meninggi | Sulit | Magma bergerak vertikal dan vent uap | Tidak berdiam di pijakan rendah dan terus naik menuju jalur aman |
| 29 | Dua Katup | Sulit | Katup khusus Bara dan Nira yang mematikan vent masing-masing | Setiap pemain mengaktifkan katup elemennya sendiri |
| 30 | Jantung Tungku | Expert | Lava berdenyut/bergerak, uap, dua katup, platform bergerak, urutan pijakan | Menggabungkan mekanik Dunia 3; urutan pijakan Nira lalu Bara tetap wajib |

## Mekanik yang benar-benar digunakan engine

### Lava berdenyut dan bergerak
- Hazard lava memakai `type: 'fire'` agar aturan elemen tetap konsisten: Bara aman, Nira harus menghindar.
- `visual: 'lava'` menggambar permukaan magma dengan gradien, gelembung, dan riak panas.
- Properti `cycle` membuat lava menyala/padam memakai jam level bersama.
- Properti `motion` menggerakkan hazard, termasuk magma yang naik-turun pada level 28 dan 30.

### Semburan uap
- Hazard `type: 'steam'` berbahaya bagi Bara dan Nira.
- `cycle` menentukan kapan uap aktif. Saat padam, hazard tidak digambar dan tidak memicu collision.
- Renderer menggambar kolom uap agar zona bahaya berbeda jelas dari air/lava.

### Katup yang tersinkron
- Tiap katup punya `id`, posisi, label, dan elemen pemilik.
- Pemain mendekati katup lalu menggunakan **INTERAKSI** (E/Enter) untuk mengaktifkannya.
- Hanya karakter dengan elemen yang cocok yang dapat memutar katup.
- Status katup disimpan pada `levels/{level}/valves/{id}` melalui Firebase RTDB.
- Hazard dengan `valveId` dinonaktifkan dari renderer dan collision setelah katup terkait terbuka.
- `requiredValves` menjadi syarat tambahan untuk membuka gerbang, selain dua pijakan.

### Sakelar berurutan
- Level 26 dan 30 memakai `switchSequence: ['water','fire']`.
- Status urutan disimpan bersama status pijakan pada `levels/{level}/switches/sequenceIndex`.
- Transaksi dilakukan pada node `switches` induk agar increment urutan dan aktivasi pijakan terjadi atomik.
- Pijakan yang salah urutan tidak aktif; HUD dan notifikasi memberi tahu pemain siapa yang harus mengaktifkan berikutnya.

## Prinsip desain dan pengamanan
- Kedua pressure plate berada sebelum gerbang dan pada platform stabil.
- Tidak ada pressure plate yang bergantung pada platform berkala atau lift vertikal.
- Katup ditempatkan dekat platform dan hanya dapat dioperasikan oleh elemen yang sesuai.
- Checkpoint tidak diletakkan di area hazard aktif.
- Permata tetap bonus, bukan syarat pembukaan gerbang.
- Fase lava, uap, platform, dan animasi mekanik berbasis `startedAt` bersama dengan `/.info/serverTimeOffset` Firebase.
- Tidak menambahkan node game baru di luar `levels/{level}` yang sudah ada; Firebase Rules tidak berubah.

## Batas pengujian
- Unit test memeriksa 10 blueprint unik, eskalasi kesulitan, lava/uap berkala, kontrol katup, urutan pijakan atomik, dan jangkauan kedua pressure plate.
- Pemeriksaan sintaks dilakukan untuk seluruh JavaScript.
- Uji end-to-end pada Firebase aktif dengan dua perangkat tetap perlu dilakukan sebelum Dunia 3 dianggap final.
