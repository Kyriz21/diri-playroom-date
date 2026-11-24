# Tebak Pasangan — Mini Game 02

## Konsep

Tebak Pasangan adalah permainan dua orang selama enam ronde. Pada setiap ronde, satu pemain menjawab pertanyaan tentang dirinya secara privat, sedangkan pemain lain menebak. Peran bergantian: Pembuat ruang menjawab pada ronde ganjil dan Tamu menjawab pada ronde genap.

## Alur satu ronde

1. Pertanyaan yang sama muncul pada kedua perangkat.
2. Pemain yang bertugas menjawab mengisi jawaban asli. Pemain lain mengisi tebakan.
3. Kedua isian disimpan di jalur privat masing-masing UID. Hanya status terkunci yang terlihat sebelum reveal.
4. Setelah kedua pemain mengunci, atau timer 60 detik habis, host memindahkan fase ke `reveal`.
5. Kedua jawaban dibuka. Sistem otomatis mencocokkan kata kunci: seluruh kata kunci cocok = Tepat (2 poin), sebagian cocok = Hampir (1 poin), tidak ada yang cocok = Meleset (0 poin).
6. Kedua pemain menekan Lanjutkan. Jika salah satu tidak merespons, host melanjutkan setelah 12 detik. Jika penilaian tidak diberikan, ronde melewati penilaian setelah 20 detik dengan 0 poin.

## Format permainan

- 6 ronde per pertandingan.
- 60 detik per ronde.
- 40 pertanyaan bawaan berbahasa Indonesia.
- Pertanyaan yang sama tidak dipilih dua kali berturut-turut bila tersedia pertanyaan lain.
- Peran menjawab/menebak bergantian setiap ronde.
- Jawaban dan tebakan maksimal 140 karakter.
- Penilaian berjalan otomatis berdasarkan kecocokan kata kunci setelah jawaban dibuka. Kata pengisi umum seperti aku, yang, dan, mau, serta ingin diabaikan agar tidak menghasilkan kecocokan palsu.
- Skor diberikan kepada pemain yang menebak.
- Rematch memerlukan persetujuan kedua pemain dan membuat matchKey serta roundKey baru.

## Struktur data Firebase

Data status permainan berada di:

`roomGames/{roomCode}/{sessionId}/guessPartner`

Jawaban privat berada di:

`privateRooms/{roomCode}/guesspartner/{sessionId}/{uid}/rounds/{roundKey}`

Isi privat berupa teks jawaban/tebakan, waktu kirim, dan jenis (`answer` atau `guess`). Aturan Realtime Database hanya memperbolehkan pemilik UID membaca datanya sebelum reveal. Kedua peserta dapat membacanya setelah fase `reveal`, `round-result`, atau `result-game`.

## Firebase Rules

Rules versi v0.14 pada `firebase-database.rules.json` wajib dipublikasikan ke Firebase Console → Realtime Database → Rules sebelum permainan digunakan. Rules ini menambahkan ID game `guesspartner`, validasi jawaban privat, validasi status, rating, lanjut ronde, dan rematch. Jangan mengganti Rules dengan akses publik.

## Pengujian dua perangkat

- Buat sesi Tebak Pasangan dari satu perangkat dan gabung dari perangkat kedua.
- Pastikan keduanya mendapat prompt serta nomor ronde yang sama.
- Pastikan teks jawaban yang diketik tidak terlihat di perangkat lawan sebelum kedua jawaban terkunci.
- Uji submit jawaban dan tebakan; pastikan reveal menampilkan teks yang benar.
- Uji penilaian otomatis: semua kata kunci, sebagian kata kunci, tanpa kecocokan, huruf kapital, tanda baca, dan kata pengisi.
- Uji pergantian peran di ronde berikutnya.
- Uji timer habis, lanjutkan bersama, dan kondisi salah satu pemain terlambat.
- Uji hasil enam ronde dan rematch.
- Muat ulang salah satu perangkat di tiap fase dan pastikan fase permainan dapat dipulihkan dari Firebase.

## Batasan yang diketahui

- Penilaian kecocokan dihitung otomatis dari kata kunci jawaban setelah reveal; pemain tidak perlu menekan tombol nilai.
- Sinkronisasi dan privasi jawaban sudah diuji secara lokal melalui unit test dan pemeriksaan source, tetapi belum diuji pada Firebase project aktif dengan dua perangkat nyata.
- Jika salah satu pemain offline, timer dan transisi fase tetap dikelola host. Pengujian reconnect nyata masih diperlukan.

### Contoh penilaian otomatis
- Jawaban asli `mie ayam`, tebakan `mie` → Hampir (1 poin), kata cocok: `mie`.
- Jawaban asli `mie ayam`, tebakan `aku mau mie ayam` → Tepat (2 poin), karena kedua kata kunci cocok.
- Jawaban asli `mie ayam`, tebakan `bakso` → Meleset (0 poin).
- Perbandingan mengabaikan kapitalisasi dan tanda baca serta kata pengisi umum. Ini pencocokan kata, bukan pemahaman sinonim; misalnya `mie ayam` dan `bakso` tidak dianggap setara.

## Aturan penilaian jawaban v0.16
- **Tepat (2 poin):** seluruh frasa sama setelah normalisasi huruf besar/kecil, tanda baca, dan spasi. Urutan kata harus sama; tidak boleh ada kata tambahan atau hilang.
- **Hampir (1 poin):** frasa tidak sama persis, tetapi memiliki setidaknya satu kata kunci bermakna yang sama.
- **Meleset (0 poin):** tidak ada kata kunci bermakna yang cocok.
- Contoh: jawaban asli `mie ayam`; tebakan `mie ayam` = Tepat, sedangkan `mie ayam goreng`, `mie ayam rebus`, `mie ayam bakar`, `mie`, `ayam`, dan `ayam mie` = Hampir. Tebakan `bakso` = Meleset.
