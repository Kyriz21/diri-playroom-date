# Bomber Arena — v0.50.0

Bomber Arena adalah mini-game duel grid real-time untuk dua pemain. Kedua pemain bergerak di satu arena 13 × 11, memasang bom, menghancurkan peti, mengambil power-up, dan berusaha menghabiskan tiga nyawa lawan.

## Alur sesi

1. Host membuat room Bomber Arena.
2. Guest bergabung memakai kode room.
3. Keduanya masuk ke lobby bersama; game baru dimulai ketika kedua pemain online dan menekan Ready.
4. Host menyiapkan arena deterministik dari satu seed, lalu memulai hitung mundur tiga detik.
5. Pertandingan berjalan maksimal tiga menit.
6. Hasil ditampilkan sebagai satu kartu rekap berisi skor, nyawa, bom yang dipasang, peti dihancurkan, power-up yang diambil, dan hit yang mengurangi nyawa. Host dapat kembali ke lobby untuk memilih aktivitas lain atau memulai sesi baru.

## Aturan permainan

- Grid: 13 kolom × 11 baris, dengan dinding permanen dan peti yang dapat dihancurkan.
- Spawn: Host di kiri atas dan Guest di kanan bawah. Setiap seed memilih salah satu dari tiga profil: Lapangan Terbuka, Persimpangan, atau Benteng Tengah. Semua profil memakai peti yang dicerminkan 180° sehingga kedua sisi setara. Jalur awal kedua spawn selalu terbuka; seluruh lantai kosong dijaga tetap terhubung.
- Gerak: satu tile per input, hanya empat arah.
- Bom: kapasitas awal satu bom per pemain; sumbu ledakan berbentuk silang; fuse 2,2 detik; jangkauan awal dua tile.
- Ledakan berhenti pada dinding. Ledakan menghancurkan peti pertama yang terkena dan tidak menembus peti itu. Ledakan juga dapat memicu bom lain.
- Bom dan ledakan dapat melukai pemain yang memasangnya. Dalam 850 ms terakhir sebelum meledak, jalur silang diberi peringatan merah berkedip. Api tetap berbahaya selama masih terlihat, termasuk jika pemain baru masuk ke tile api setelah ledakan dimulai.
- Setiap pemain memiliki tiga nyawa. Pada awal pertandingan, kedua pemain mendapat perlindungan spawn selama 1.600 ms setelah countdown. Setelah terkena ledakan, pemain juga mendapat masa invulnerability singkat agar satu ledakan panjang tidak mengurangi banyak nyawa sekaligus.
- Pertandingan berakhir ketika salah satu atau kedua pemain kehabisan nyawa, atau timer tiga menit habis. Saat waktu habis, pemenang ditentukan dari sisa nyawa, lalu skor. Jika sama, hasil seri.

## Power-up

| Item | Efek | Batas |
|---|---|---|
| Bomb Up | Menambah kapasitas bom aktif | Maksimal 3 bom |
| Fire Up | Menambah jangkauan ledakan | Maksimal 5 tile |
| Speed Up | Mempercepat gerakan grid | Waktu langkah minimum 90 ms |
| Shield | Menahan satu serangan ledakan | Maksimal 2 shield tersimpan |

Power-up tersembunyi di 2–4 pasangan peti per arena. Kedua sisi pasangan menyimpan jenis item yang sama. Mengambil power-up juga menambah 10 poin.

## Kontrol

- HP: D-pad 3 × 3 untuk bergerak; tombol BOM untuk memasang bom. Tahan tombol arah untuk berjalan berulang. Panduan power-up tersedia di bawah arena.
- Desktop: WASD atau tombol panah untuk bergerak; Space atau Enter untuk memasang bom.
- Lepaskan tombol arah untuk berhenti. Gerak dan tombol bom terkunci selama countdown; input tidak dapat mengantre bom sebelum pertandingan dimulai. Gerakan otomatis dihentikan saat jendela browser kehilangan fokus.

## Sinkronisasi dan otoritas

- Lobby, status Ready, dan presence mengikuti room service utama.
- Host menjadi otoritas simulasi: posisi, collision, bom, ledakan, kerusakan peti, power-up, nyawa, skor, dan hasil akhir dihitung oleh host lalu disinkronkan ke Realtime Database.
- Guest hanya menulis input untuk UID/perannya sendiri. Guest tidak dapat mengubah posisi, nyawa, skor, bom, atau hasil pertandingan secara langsung.
- Batas kesegaran input dihitung dari waktu penerimaan di host, bukan membandingkan jam lokal dua perangkat, sehingga perbedaan jam HP tidak membuat gerakan macet.
- Seed arena sama untuk kedua perangkat. Peti yang sudah hancur, power-up, bom, ledakan, dan status pemain dibaca dari sesi yang sama.
- Setup dapat dilanjutkan host bila proses inisialisasi terputus sebelum berpindah ke fase bermain.

## Firebase Rules

Bomber Arena menambahkan allowlist `bomberarena`, validasi presence/Ready pada lobby, serta jalur `roomGames/{roomCode}/{sessionId}/bomberArena`. Input hanya dapat ditulis oleh pemain yang sesuai; state pemain, bom, peti hancur, power-up, ledakan, dan transisi fase hanya dapat ditulis host. Tidak ada perubahan Firebase Rules pada v0.49.1, v0.49.2, maupun v0.50.0; aturan dari v0.49.0 tetap berlaku.

## Batas pengujian

Tes otomatis memeriksa aturan gerak, ledakan silang, penghentian oleh dinding/peti, chain reaction, power-up, damage/shield, penentuan pemenang, peta dari 1.000 seed, integrasi lobby, dan ekspresi Firebase Rules. Tes tersebut tidak menggantikan uji browser langsung atau playtest dua perangkat dengan Firebase project aktif.

## Penyempurnaan v0.49.1

- Jalur ledakan ditandai sebelum bom meledak sehingga pemain memiliki waktu untuk menghindar.
- Tile api tetap memberi damage bila pemain masuk setelah ledakan dimulai.
- Rekap menyimpan statistik bom, peti, power-up, dan hit per pemain.
- D-pad mobile memakai tata letak 3 × 3.
- Tombol Kembali tidak meninggalkan pertandingan yang sedang berjalan. Firebase Rules tidak berubah dari v0.49.0.


## Penyempurnaan v0.50.0 — variasi peta, distribusi item, dan keamanan spawn

- Tiga profil arena berbasis seed dengan pola peti berbeda: Lapangan Terbuka, Persimpangan (koridor silang tengah), dan Benteng Tengah (kepadatan peti lebih tinggi di area tengah).
- Penempatan peti tetap ditolak bila memutus konektivitas lantai; peta tetap simetris 180° untuk kedua pemain.
- Power-up tersebar pada 2–4 pasangan peti, maksimal empat pasangan dan minimal dua pasangan saat tersedia.
- Perlindungan spawn 1.600 ms dimulai setelah countdown dan ditampilkan dengan cincin visual terpisah dari shield.
- Kontrol dinonaktifkan selama countdown, penempatan bom sebelum mulai ditolak, dan input arah dilepas saat jendela kehilangan fokus.
- Tidak ada perubahan Firebase Rules atau struktur data sesi.

## Penyempurnaan v0.49.2 — arena adil dan terhubung

- Generator arena menempatkan peti secara simetris 180° untuk menyamakan peluang kedua spawn.
- Setiap kandidat peti diuji sebelum ditempatkan; penempatan ditolak jika memutus konektivitas lantai atau membuat peti tidak memiliki sisi yang dapat didekati.
- Power-up tersembunyi pada pasangan peti memakai tipe yang sama di kedua sisi arena.
- Fungsi pemeriksaan jangkauan lantai digunakan untuk memvalidasi konektivitas dari kedua spawn.
- Uji regresi: 1.000 seed memeriksa konektivitas dari kedua spawn dan 250 seed memeriksa simetri peti/power-up. Stress run 10.000 seed menemukan 0 arena terputus (jumlah peti 14–26).
- Tidak ada perubahan Firebase Rules atau struktur data sesi.
