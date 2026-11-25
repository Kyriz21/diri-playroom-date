# Elemental Duo — Blueprint Implementasi Dunia 2

Build: v0.26.0  
Dunia: Kedalaman Kristal  
Cakupan: level 11–20

## Rangkaian level

| Level | Nama | Kesulitan | Mekanik yang aktif | Tujuan pemain |
|---:|---|---|---|---|
| 11 | Retakan Pertama | Mudah | Pijakan es, zona es, bahaya elemen | Belajar bahwa karakter mempertahankan momentum lebih lama saat berada di atas es. |
| 12 | Gema Biru | Mudah | Arus horizontal berdenyut, pijakan es | Mengatur arah melawan arus atau memanfaatkan dorongan arus. |
| 13 | Lorong Pecahan | Normal | Pijakan es sempit, dua platform bergerak, arus | Menyeberang melalui pecahan kristal dengan momentum yang terkontrol. |
| 14 | Cermin Es | Normal | Zona es lantai, lantai licin, arus vertikal | Menjaga jarak berhenti saat meluncur dan menggunakan arus untuk membantu lompatan. |
| 15 | Jembatan Prismatik | Normal | Jembatan kristal berkala, platform yang muncul/menghilang, arus rendah | Membaca fase jembatan dan menyeberang ketika pijakan tersedia. |
| 16 | Arus Terbalik | Menengah | Arus yang berbalik arah, hazard yang aktif/nonaktif | Mengamati arus dan bahaya yang berubah fase sebelum melompat. |
| 17 | Menara Kristal | Menengah | Lift vertikal, pijakan kristal, arus ke atas | Menggunakan lift bergerak dan dorongan arus untuk mencapai tingkat lebih tinggi. |
| 18 | Ruang Resonansi | Menengah | Arus ke atas dan ke bawah, platform vertikal | Memilih arus yang tepat untuk membantu kedua pemain melewati ketinggian berbeda. |
| 19 | Badai Serpihan | Sulit | Arus kuat berbalik, platform berkala, hazard bergerak, zona es | Menggabungkan momentum es, waktu lompatan, dan pembacaan arus. |
| 20 | Penjaga Geode | Sulit | Zona es, arus berbalik, lift, platform berkala, hazard bergerak | Menggabungkan kemampuan Dunia 2 sebagai ujian sebelum memasuki Kerajaan Bara. |

## Mekanik yang benar-benar digunakan engine

### Permukaan es
- Platform dengan `kind: 'ice'` dan zona `iceZones` memberi gesekan lebih rendah.
- Setelah pemain melepas tombol arah, momentum berkurang lebih lambat daripada di batu.
- Kontrol arah tetap berfungsi saat pemain bergerak di atas es; tantangannya adalah mengatur jarak berhenti.
- Zona es digambar dengan permukaan biru transparan dan highlight agar mudah dikenali.

### Arus air
- Data `currents` mendefinisikan area, gaya horizontal/vertikal, fase, dan periode.
- Arus mendorong karakter yang memasuki area, tetapi tidak menjadi hazard yang langsung menjatuhkan pemain.
- Arus dapat berdenyut (`pulsePeriodMs`) atau berbalik arah secara bertahap (`reversePeriodMs`).
- Arah partikel panah di arena menggambarkan arah dorongan saat itu.

### Platform dan bahaya berkala
- Platform tetap memakai sistem gerak sinusoidal dan siklus aktif/nonaktif yang deterministik.
- Lift vertikal menggunakan `motion.axis: 'y'`; karakter yang berdiri di atasnya ikut terbawa.
- Hazard kini juga mendukung `cycle` dengan status aktif/nonaktif dan transisi opacity, baik saat digambar maupun saat collision diperiksa.
- Fase arus, platform, dan hazard dihitung dari jam level bersama yang memakai Firebase `/.info/serverTimeOffset`.

## Prinsip desain
- Level 11–12 memperkenalkan es dan arus secara terpisah.
- Level 13–15 menggabungkan momentum dengan platform bergerak/berkala.
- Level 16–18 menguji pembacaan arah arus dan ketinggian.
- Level 19–20 menggabungkan mekanik tanpa membuat satu pemain wajib berdiri pada pijakan yang menghilang atau lift vertikal untuk mengaktifkan sakelar.
- Kedua pressure plate tetap berada sebelum penghalang bersama. Masing-masing plate diletakkan pada platform yang stabil/non-timed; platform bergerak horizontal boleh digunakan bila masih memberi ruang pijakan yang aman.
- Permata adalah bonus, bukan syarat untuk membuka gerbang.

## Batas pengujian
- Unit test memeriksa 10 blueprint unik, arah dan fase arus, gesekan es, hazard berkala, dan jangkauan pressure plate dari spawn.
- Kedua perangkat menghitung fase mekanik dari jam level yang sama; tidak ada penambahan node Firebase atau perubahan Rules.
- Uji gameplay end-to-end pada dua HP dengan Firebase aktif tetap harus dilakukan sebelum Dunia 2 dianggap final.
