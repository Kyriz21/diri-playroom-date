export const BRAND = 'Diri. Playroom Date';
export const ROOM_CODE_LENGTH = 6;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const RECONNECT_GRACE_MS = 5 * 60 * 1000;
export const ROOM_STORAGE_KEY = 'diri-ldr-playroom-room-code';
export const DISPLAY_NAME_STORAGE_KEY = 'diri-ldr-playroom-display-name';

export const GAME_CATALOG = [
  { id: 'drawtogether', number: '01', title: 'Gambar Bareng', subtitle: 'Satu instruksi, dua gambar', description: 'Gambar secara bersamaan dan lihat coretan pasangan secara langsung.', icon: '✎', state: 'active' },
  { id: 'tictactoe', number: '01', title: 'Tiga Serangkai', subtitle: 'Tiga simbol berurutan', description: 'Susun tiga simbol dan rebut kemenangan.', icon: '✿', state: 'active' },
  { id: 'lovequiz', number: '02', title: 'Kuis Cinta', subtitle: 'Seberapa kenal kita?', description: 'Uji seberapa baik kalian saling mengenal.', icon: '♡', state: 'active' },
  { id: 'thisorthat', number: '03', title: 'Pilih Salah Satu', subtitle: 'Dua pilihan, satu kecocokan', description: 'Pilih jawaban secara terpisah, lalu lihat hasilnya bersama.', icon: '↔', state: 'active' },
  { id: 'truthordare', number: '04', title: 'Jujur atau Tantangan', subtitle: 'Cerita dan keberanian kecil', description: 'Jawab pertanyaan atau selesaikan tantangan bersama.', icon: '✧', state: 'active' },
  { id: 'memorycard', number: '05', title: 'Kartu Memori', subtitle: 'Asah ingatan kalian', description: 'Temukan pasangan kartu dalam mode duel atau bersama.', icon: '▦', state: 'active' },
  { id: 'connectfour', number: '06', title: 'Empat Berderet', subtitle: 'Empat keping berurutan', description: 'Susun empat keping dan halangi langkah pasangan.', icon: '●', state: 'active' },
  { id: 'drawguess', number: '07', title: 'Gambar dan Tebak', subtitle: 'Gambar lalu tebak', description: 'Satu pemain menggambar, yang lain menebak kata.', icon: '✎', state: 'active' },
  { id: 'tebakkata', number: '08', title: 'Tebak Kata', subtitle: 'Berikan petunjuk', description: 'Bantu pasangan menemukan kata tanpa menyebut kata terlarang.', icon: 'Aa', state: 'active' },
  { id: 'photobooth', number: 'PB', title: 'Photobooth', subtitle: 'Simpan momen bersama', description: 'Buat strip foto sendiri atau bersama dengan bingkai dan filter.', icon: '▧', state: 'active' }
];

export const GAME_LABELS = Object.fromEntries(GAME_CATALOG.map(game => [game.id, game.title]));
