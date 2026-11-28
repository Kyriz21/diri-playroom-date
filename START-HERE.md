# Mulai di sini — Diri. Playroom Date v0.51.5

## Fokus rilis
- Delapan mini-game aktif menggunakan kartu katalog dengan layout dan preview yang seragam.
- Mini-game hanya dapat dimulai melalui **Buat sesi** atau **Gabung sesi**; opsi solo mini-game sudah dihapus.
- One Tap memakai terminologi sesi yang sama dengan game lain.
- Photobooth tetap memiliki **Foto sendiri** sebagai alur foto mandiri.
- Firebase Rules tidak berubah.

## Instalasi
1. Backup repository GitHub Pages.
2. Ekstrak ZIP dan upload seluruh isi ke root repository.
3. Tidak perlu Publish ulang Firebase Rules.
4. Hard refresh kedua perangkat setelah deployment.
5. Periksa homepage pada desktop dan HP: seluruh mini-game memiliki preview dan hanya tombol Buat sesi serta Gabung sesi.

## Pengujian
`npm test`: **262/262 tes lulus**. Uji perangkat nyata tetap diperlukan.
