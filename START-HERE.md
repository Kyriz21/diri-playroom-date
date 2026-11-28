# Mulai di sini — Diri. Playroom Date v0.51.4

## Fokus rilis
- Bomber Arena diarsipkan untuk sesi baru; source lama tetap disimpan agar sesi aktif terdahulu masih dapat dimuat.
- Preview home ditambahkan untuk Gambar Bareng, Tebak Pasangan, Bomb Storm, dan Balloon Pop.
- Color Match: memperbaiki transisi timer dari fase mengingat warna ke fase menebak yang terhenti akibat variabel mutex `transitioning` tidak dideklarasikan.
- Draft RGB direset pada setiap ronde baru.
- Firebase Rules tidak berubah.

## Instalasi
1. Backup repository GitHub Pages.
2. Ekstrak ZIP dan upload seluruh isi ke root repository.
3. Tidak perlu Publish ulang Firebase Rules.
4. Hard refresh kedua perangkat setelah deployment.
5. Buat room Color Match baru, lalu pastikan kedua pemain masuk ke fase menebak setelah preview warna berakhir.

## Pengujian
`npm test`: **261/261 tes lulus**. Uji perangkat nyata tetap diperlukan.
