# Diri. Playroom Date v0.51.4

## Fokus rilis

- **Bomber Arena diarsipkan sementara.** Tidak muncul sebagai pilihan untuk room baru dan tidak dapat dimulai dari lobi. Source game dipertahankan untuk kompatibilitas sesi Bomber Arena lama yang sudah aktif. Firebase Rules tidak diubah pada rilis ini.
- **Preview home dilengkapi** untuk Gambar Bareng, Tebak Pasangan, Bomb Storm, dan Balloon Pop. Preview game unggulan lainnya tetap tersedia.
- **Color Match diperbaiki:** transisi otomatis dari fase mengingat (`preview`) ke fase menebak (`guessing`) sebelumnya gagal karena mutex `transitioning` tidak dideklarasikan. Sekarang transisi menggunakan mutex yang benar, memeriksa hasil transaksi Firebase, dan memperbarui state host setelah commit.
- Draft RGB direset saat ronde baru dimulai.

## Instalasi

1. Backup repository GitHub Pages.
2. Ekstrak ZIP v0.51.4 dan upload seluruh isinya ke root repository, timpa file lama.
3. Tidak perlu mengganti atau memublikasikan ulang Firebase Rules untuk rilis ini.
4. Tunggu deployment selesai, lalu lakukan hard refresh pada browser kedua perangkat.
5. Uji Color Match dengan room baru dan pastikan layar berpindah dari preview ke guessing setelah durasi mengingat warna habis.

## Catatan pengujian

`npm test`: **261/261 tes lulus**. Pemeriksaan sintaks JavaScript dilakukan pada file yang diubah. Automated tests tidak menggantikan uji browser dan uji dua perangkat dengan Firebase project aktif.
