# Diri. Playroom Date v0.51.5

## Fokus rilis

- Delapan mini-game aktif di homepage sekarang memakai pola kartu dan preview yang konsisten: Gambar Bareng, Tebak Pasangan, Bomb Storm, Balloon Pop, One Tap, Love Match, Color Match, dan IQ Duel.
- Semua mini-game hanya menyediakan dua tindakan: **Buat sesi** dan **Gabung sesi**. Opsi **Main di HP ini** untuk Love Match, Color Match, dan IQ Duel dihapus.
- One Tap memakai label dan dialog sesi yang sama seperti game lain.
- Photobooth tetap menyediakan **Foto sendiri** sebagai mode foto mandiri, terpisah dari mini-game.
- Firebase Rules tidak berubah dan tidak perlu dipublikasikan ulang.

## Instalasi

1. Backup repository GitHub Pages.
2. Ekstrak ZIP v0.51.5 dan upload seluruh isinya ke root repository, timpa file lama.
3. Tidak perlu mengganti atau memublikasikan ulang Firebase Rules untuk rilis ini.
4. Tunggu deployment selesai, lalu lakukan hard refresh pada browser kedua perangkat.
5. Periksa homepage pada desktop dan HP: semua delapan kartu mini-game harus tampil dengan pola yang sama dan masing-masing hanya memiliki tombol Buat sesi serta Gabung sesi.

## Catatan pengujian

`npm test`: **262/262 tes lulus**. Pemeriksaan sintaks JavaScript dilakukan pada file yang diubah. Automated tests tidak menggantikan uji browser dan uji dua perangkat dengan Firebase project aktif.
