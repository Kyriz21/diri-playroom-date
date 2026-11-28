export const BRAND = 'Diri. Playroom Date';
export const ROOM_CODE_LENGTH = 6;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const RECONNECT_GRACE_MS = 5 * 60 * 1000;
export const ROOM_STORAGE_KEY = 'diri-ldr-playroom-room-code';
export const DISPLAY_NAME_STORAGE_KEY = 'diri-ldr-playroom-display-name';

export const GAME_CATALOG = [
  { id: 'drawtogether', number: '01', title: 'Gambar Bareng', subtitle: 'Satu instruksi, dua gambar', description: 'Gambar secara bersamaan dan lihat coretan pasangan secara langsung.', icon: '✎', state: 'active' },
  { id: 'guesspartner', number: '02', title: 'Tebak Pasangan', subtitle: 'Seberapa kenal kalian?', description: 'Jawab pertanyaan tentang dirimu dan tebak jawaban pasangan.', icon: '♡', state: 'active' },
  { id: 'bombstorm', number: '03', title: 'Bomb Storm', subtitle: 'Hindari bom, kumpulkan hati', description: 'Gerakkan karakter dari selfie, hindari bom, dan kumpulkan hati bersama.', icon: '☄', state: 'active' },
  { id: 'balloonpop', number: '04', title: 'Balloon Pop', subtitle: 'Pecahkan balon, hindari bom', description: 'Ketuk balon warna-warni, incar balon bonus, dan hindari bom.', icon: '🎈', state: 'active' },
  { id: 'elementalduo', number: '05', title: 'Elemental Duo', subtitle: 'Konsep co-op elemental', description: 'Konsep petualangan kerja sama disimpan untuk pengembangan berikutnya.', icon: '✧', state: 'archived' },
  { id: 'tictactoe', number: '01', title: 'Tiga Serangkai', subtitle: 'Tiga simbol berurutan', description: 'Susun tiga simbol dan rebut kemenangan.', icon: '✿', state: 'active' },
  { id: 'lovequiz', number: '02', title: 'Kuis Cinta', subtitle: 'Seberapa kenal kita?', description: 'Uji seberapa baik kalian saling mengenal.', icon: '♡', state: 'active' },
  { id: 'thisorthat', number: '03', title: 'Pilih Salah Satu', subtitle: 'Dua pilihan, satu kecocokan', description: 'Pilih jawaban secara terpisah, lalu lihat hasilnya bersama.', icon: '↔', state: 'active' },
  { id: 'truthordare', number: '04', title: 'Jujur atau Tantangan', subtitle: 'Cerita dan keberanian kecil', description: 'Jawab pertanyaan atau selesaikan tantangan bersama.', icon: '✧', state: 'active' },
  { id: 'memorycard', number: '05', title: 'Kartu Memori', subtitle: 'Asah ingatan kalian', description: 'Temukan pasangan kartu dalam mode duel atau bersama.', icon: '▦', state: 'active' },
  { id: 'connectfour', number: '06', title: 'Empat Berderet', subtitle: 'Empat keping berurutan', description: 'Susun empat keping dan halangi langkah pasangan.', icon: '●', state: 'active' },
  { id: 'drawguess', number: '07', title: 'Gambar dan Tebak', subtitle: 'Gambar lalu tebak', description: 'Satu pemain menggambar, yang lain menebak kata.', icon: '✎', state: 'active' },
  { id: 'tebakkata', number: '08', title: 'Tebak Kata', subtitle: 'Berikan petunjuk', description: 'Bantu pasangan menemukan kata tanpa menyebut kata terlarang.', icon: 'Aa', state: 'active' },
  { id: 'photobooth', number: 'PB', title: 'Photobooth', subtitle: 'Simpan momen bersama', description: 'Buat strip foto sendiri atau bersama dengan bingkai dan filter.', icon: '▧', state: 'active' },
  { id: 'lovematch', number: '09', title: 'Love Match', subtitle: 'Seberapa selaras kalian?', description: 'Jawab tes kepribadian singkat secara privat, lalu buka kecocokan bersama.', icon: '♡', state: 'active' },
  { id: 'colormatch', number: '10', title: 'Color Match', subtitle: 'Uji ingatan warna', description: 'Ingat warna dan bangun kembali dengan slider RGB dalam mode Versus atau Duet.', icon: '◉', state: 'active' },
  { id: 'iqduel', number: '11', title: 'IQ Duel', subtitle: 'Adu cepat berpikir', description: 'Pola, logika, deret, analogi, dan hitung cepat. Skor dibuka di akhir.', icon: '✦', state: 'active' },
  { id: 'arcade', number: '12', title: 'Arcade', subtitle: 'Flappy Face · dua pemain', description: 'Jadikan wajahmu karakter terbang. Ketuk untuk mengepak, lewati pipa, dan adu skor.', icon: '🕹', state: 'active' },
  { id: 'bomberarena', number: '13', title: 'Bomber Arena', subtitle: 'Pasang bom, jebak lawan', description: 'Duel di arena grid. Hancurkan peti, ambil power-up, dan bertahan dari ledakan.', icon: '💣', state: 'active' }
];

export const GAME_LABELS = Object.fromEntries(GAME_CATALOG.map(game => [game.id, game.title]));
