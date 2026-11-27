export const LOVE_QUESTIONS = [
  { axis: 'I/E', prompt: 'Setelah minggu yang melelahkan, cara terbaik mengisi ulang energi adalah…', a: 'Menikmati waktu tenang sendiri', b: 'Bertemu atau menelepon orang terdekat' },
  { axis: 'I/E', prompt: 'Saat datang ke acara dengan banyak orang yang belum dikenal, kamu biasanya…', a: 'Mengamati dulu sebelum bergabung', b: 'Mudah memulai obrolan' },
  { axis: 'I/E', prompt: 'Ide kencan yang paling membuatmu nyaman adalah…', a: 'Makan malam tenang berdua', b: 'Mencoba tempat ramai yang baru' },
  { axis: 'I/E', prompt: 'Ketika punya kabar menyenangkan, kamu cenderung…', a: 'Menceritakannya ke satu-dua orang dekat', b: 'Langsung membagikannya ke banyak orang' },
  { axis: 'I/E', prompt: 'Dalam perjalanan panjang, kamu lebih suka…', a: 'Menikmati pemandangan dan obrolan seperlunya', b: 'Mengobrol, bernyanyi, dan membuat suasana ramai' },
  { axis: 'S/N', prompt: 'Saat merencanakan liburan, hal pertama yang kamu pikirkan adalah…', a: 'Tempat, jadwal, dan kebutuhan praktis', b: 'Pengalaman unik yang mungkin terjadi' },
  { axis: 'S/N', prompt: 'Kamu lebih mudah tertarik pada cerita yang…', a: 'Dekat dengan kehidupan nyata', b: 'Penuh kemungkinan dan imajinasi' },
  { axis: 'S/N', prompt: 'Saat mempelajari sesuatu yang baru, kamu lebih suka…', a: 'Contoh nyata langkah demi langkah', b: 'Memahami gambaran besarnya lebih dulu' },
  { axis: 'S/N', prompt: 'Ketika mengingat kenangan, yang paling melekat biasanya…', a: 'Detail tempat, kata, dan kejadian', b: 'Suasana dan makna di baliknya' },
  { axis: 'S/N', prompt: 'Obrolan yang paling kamu nikmati biasanya tentang…', a: 'Hal konkret yang sedang terjadi', b: 'Ide, teori, atau kemungkinan masa depan' },
  { axis: 'T/F', prompt: 'Saat pasangan menghadapi masalah, bantuan pertamamu adalah…', a: 'Mencari solusi yang paling masuk akal', b: 'Mendengarkan perasaannya terlebih dahulu' },
  { axis: 'T/F', prompt: 'Dalam mengambil keputusan sulit, kamu lebih mengutamakan…', a: 'Konsistensi dan alasan yang objektif', b: 'Dampaknya terhadap orang-orang yang terlibat' },
  { axis: 'T/F', prompt: 'Ketika memberi masukan, kamu cenderung…', a: 'Terus terang agar masalah cepat selesai', b: 'Memilih kata-kata agar tetap terasa hangat' },
  { axis: 'T/F', prompt: 'Saat berbeda pendapat, hal yang paling penting bagimu adalah…', a: 'Menemukan argumen yang paling kuat', b: 'Memastikan semua orang merasa didengar' },
  { axis: 'T/F', prompt: 'Pujian yang paling berarti bagimu adalah…', a: '“Kamu hebat dalam memecahkan masalah.”', b: '“Kamu membuat orang merasa dimengerti.”' },
  { axis: 'J/P', prompt: 'Untuk perjalanan bersama, kamu lebih nyaman jika…', a: 'Rencana utama sudah disusun', b: 'Ada ruang untuk keputusan spontan' },
  { axis: 'J/P', prompt: 'Ketika mendapat tugas, kamu biasanya…', a: 'Mengerjakannya jauh sebelum tenggat', b: 'Mengikuti ritme dan menyelesaikannya mendekati tenggat' },
  { axis: 'J/P', prompt: 'Hari libur yang ideal terasa seperti…', a: 'Agenda santai yang sudah terpikirkan', b: 'Hari bebas tanpa jadwal ketat' },
  { axis: 'J/P', prompt: 'Jika rencana mendadak berubah, reaksimu biasanya…', a: 'Perlu waktu untuk menata ulang rencana', b: 'Mudah menyesuaikan diri' },
  { axis: 'J/P', prompt: 'Dalam mengatur barang pribadi, kamu cenderung…', a: 'Menyukai tempat yang tetap dan teratur', b: 'Menaruhnya sesuai kebutuhan saat itu' }
];

const PROFILE_NAMES = {
  ISTJ: ['The Steady Planner', 'Tenang, konsisten, dan menyukai kejelasan.'],
  ISFJ: ['The Gentle Keeper', 'Penuh perhatian dan menjaga hal-hal kecil.'],
  INFJ: ['The Quiet Dreamer', 'Reflektif, intuitif, dan mencari makna.'],
  INTJ: ['The Thoughtful Strategist', 'Mandiri, analitis, dan berpikir jauh ke depan.'],
  ISTP: ['The Calm Problem-Solver', 'Praktis, tenang, dan suka mencoba langsung.'],
  ISFP: ['The Soft Explorer', 'Peka, fleksibel, dan menghargai pengalaman.'],
  INFP: ['The Heartful Idealist', 'Imajinatif, hangat, dan berpegang pada nilai.'],
  INTP: ['The Curious Thinker', 'Penasaran, logis, dan senang mengeksplorasi ide.'],
  ESTP: ['The Bold Doer', 'Spontan, aktif, dan cepat mengambil tindakan.'],
  ESFP: ['The Joyful Connector', 'Ekspresif, hangat, dan membawa keceriaan.'],
  ENFP: ['The Bright Explorer', 'Antusias, kreatif, dan penuh kemungkinan.'],
  ENTP: ['The Playful Inventor', 'Cepat berpikir, suka tantangan, dan bereksperimen.'],
  ESTJ: ['The Clear Organizer', 'Tegas, terstruktur, dan berorientasi hasil.'],
  ESFJ: ['The Warm Host', 'Ramah, suportif, dan memperhatikan kebersamaan.'],
  ENFJ: ['The Heartful Guide', 'Menguatkan orang lain dan melihat potensi mereka.'],
  ENTJ: ['The Decisive Builder', 'Strategis, berani, dan suka menggerakkan ide.']
};

export function loveProfile(answers = []) {
  const normalizedAnswers = Array.isArray(answers) ? answers : Array.from({ length: LOVE_QUESTIONS.length }, (_, i) => answers?.[i] || answers?.[String(i)] || null);
  const axes = ['I/E', 'S/N', 'T/F', 'J/P'];
  const letters = axes.map((axis, index) => {
    const group = LOVE_QUESTIONS.map((q, qIndex) => q.axis === axis ? normalizedAnswers[qIndex] : null).filter(Boolean);
    const aCount = group.filter(value => value === 'A').length;
    const bCount = group.filter(value => value === 'B').length;
    const pair = axis.split('/');
    return aCount >= bCount ? pair[0] : pair[1];
  });
  const code = letters.join('');
  const [name, description] = PROFILE_NAMES[code] || PROFILE_NAMES.INFP;
  return { code, name, description };
}

export function calculateLoveMatch(hostAnswers = [], guestAnswers = []) {
  const host = Array.isArray(hostAnswers) ? hostAnswers : Array.from({ length: LOVE_QUESTIONS.length }, (_, i) => hostAnswers?.[i] || hostAnswers?.[String(i)] || null);
  const guest = Array.isArray(guestAnswers) ? guestAnswers : Array.from({ length: LOVE_QUESTIONS.length }, (_, i) => guestAnswers?.[i] || guestAnswers?.[String(i)] || null);
  const valid = LOVE_QUESTIONS.length;
  const matched = Array.from({ length: valid }, (_, index) => host[index] && guest[index] && host[index] === guest[index]).filter(Boolean).length;
  const axes = {};
  for (const axis of ['I/E', 'S/N', 'T/F', 'J/P']) {
    const indices = LOVE_QUESTIONS.map((q, i) => q.axis === axis ? i : -1).filter(i => i >= 0);
    const same = indices.filter(i => host[i] && host[i] === guest[i]).length;
    axes[axis] = Math.round((same / indices.length) * 100);
  }
  return { score: Math.round((matched / LOVE_QUESTIONS.length) * 100), matched, total: LOVE_QUESTIONS.length, axes, hostProfile: loveProfile(host), guestProfile: loveProfile(guest) };
}

export function colorAccuracy(target, guess) {
  const channels = ['r', 'g', 'b'];
  const error = channels.reduce((sum, key) => sum + Math.abs(Number(target?.[key] || 0) - Number(guess?.[key] || 0)), 0) / 3;
  return { error: Math.round(error), score: Math.max(0, Math.round(100 - error / 2.55)) };
}

export function colorHex(color) {
  return `#${['r', 'g', 'b'].map(key => Math.max(0, Math.min(255, Math.round(Number(color?.[key]) || 0))).toString(16).padStart(2, '0')).join('')}`;
}

export function makeColor(random = Math.random) {
  const channel = () => Math.floor(35 + random() * 186);
  return { r: channel(), g: channel(), b: channel() };
}

export const IQ_QUESTIONS = [
  { id: 'p01', category: 'POLA · MATRIKS', prompt: 'Berapa titik yang harus mengisi kotak kosong?', visualGrid: ['●', '●●', '●●●', '●●', '●●●', '●●●●', '●●●', '●●●●', '?'], options: ['●●', '●●●●●●', '●●●●●', '●●●'], answer: 2, explanation: 'Jumlah titik bertambah satu dari kiri ke kanan dan dari atas ke bawah.' },
  { id: 'p02', category: 'POLA', prompt: 'Pilih simbol berikutnya.', visual: ['▲', '■', '▲', '■', '▲', '?'], options: ['▲', '■', '●', '◆'], answer: 1, explanation: 'Dua simbol bergantian: segitiga, persegi.' },
  { id: 'p03', category: 'POLA', prompt: 'Lengkapi urutan bentuk.', visual: ['○', '○○', '○○○', '○○○○', '?'], options: ['○○', '○○○○○', '○○○', '○'], answer: 1, explanation: 'Setiap langkah menambah satu lingkaran.' },
  { id: 'p04', category: 'POLA', prompt: 'Arah panah berputar seperempat putaran searah jarum jam. Berikutnya?', visual: ['↑', '→', '↓', '?'], options: ['←', '↑', '↗', '↓'], answer: 0, explanation: 'Panah berputar 90° searah jarum jam.' },
  { id: 'p05', category: 'POLA', prompt: 'Pilih pasangan yang melanjutkan pola.', visual: ['A1', 'B2', 'C3', 'D4', '?'], options: ['E4', 'D5', 'E5', 'F5'], answer: 2, explanation: 'Huruf dan angka sama-sama naik satu.' },
  { id: 's01', category: 'DERET', prompt: 'Angka berikutnya: 3, 6, 12, 24, …', options: ['30', '36', '42', '48'], answer: 3, explanation: 'Setiap angka dikalikan dua.' },
  { id: 's02', category: 'DERET', prompt: 'Angka berikutnya: 2, 5, 9, 14, 20, …', options: ['25', '26', '27', '28'], answer: 2, explanation: 'Selisihnya +3, +4, +5, +6, lalu +7.' },
  { id: 's03', category: 'DERET', prompt: 'Angka berikutnya: 81, 27, 9, 3, …', options: ['0', '1', '2', '6'], answer: 1, explanation: 'Setiap angka dibagi tiga.' },
  { id: 's04', category: 'DERET', prompt: 'Angka berikutnya: 1, 4, 9, 16, 25, …', options: ['30', '32', '36', '49'], answer: 2, explanation: 'Ini adalah kuadrat 1, 2, 3, 4, 5, lalu 6.' },
  { id: 's05', category: 'DERET', prompt: 'Angka berikutnya:  Fibonacci 1, 1, 2, 3, 5, 8, …', options: ['11', '12', '13', '15'], answer: 2, explanation: 'Setiap angka adalah jumlah dua angka sebelumnya.' },
  { id: 'l01', category: 'LOGIKA', prompt: 'Semua mawar adalah bunga. Sebagian bunga cepat layu. Kesimpulan yang pasti benar?', options: ['Semua mawar cepat layu', 'Sebagian mawar pasti cepat layu', 'Mawar termasuk bunga', 'Tidak ada bunga yang tahan lama'], answer: 2, explanation: 'Hanya pernyataan bahwa mawar termasuk bunga yang dijamin.' },
  { id: 'l02', category: 'LOGIKA', prompt: 'Jika hari hujan, jalan basah. Hari ini jalan tidak basah. Apa kesimpulan paling kuat?', options: ['Hari ini pasti hujan', 'Hari ini tidak hujan', 'Jalan sedang ditutup', 'Tidak dapat disimpulkan apa pun'], answer: 1, explanation: 'Dengan aturan yang diberikan, tidak basah berarti kondisi hujan tidak terjadi.' },
  { id: 'l03', category: 'LOGIKA', prompt: 'Rani lebih tinggi dari Dita. Dita lebih tinggi dari Sari. Siapa paling pendek?', options: ['Rani', 'Dita', 'Sari', 'Tidak dapat diketahui'], answer: 2, explanation: 'Urutannya Rani > Dita > Sari.' },
  { id: 'l04', category: 'LOGIKA', prompt: 'Ada 5 kotak. Setiap kotak berisi 2 bola. Berapa bola minimal yang perlu diambil tanpa melihat untuk memastikan mendapat 2 bola dengan warna sama, jika hanya ada 2 warna?', options: ['2', '3', '4', '5'], answer: 1, explanation: 'Dengan 2 warna, tiga pengambilan pasti memuat dua bola berwarna sama.' },
  { id: 'l05', category: 'LOGIKA', prompt: 'Jika semua A adalah B dan tidak ada B yang C, maka…', options: ['Semua A adalah C', 'Sebagian A adalah C', 'Tidak ada A yang C', 'Semua C adalah A'], answer: 2, explanation: 'A berada di kelompok B, sedangkan B tidak beririsan dengan C.' },
  { id: 'm01', category: 'HITUNG CEPAT', prompt: '18 × 7 = …', options: ['116', '126', '136', '146'], answer: 1, explanation: '18 × 7 = 126.' },
  { id: 'm02', category: 'HITUNG CEPAT', prompt: 'Harga Rp80.000 mendapat diskon 25%. Harga akhirnya?', options: ['Rp55.000', 'Rp60.000', 'Rp62.500', 'Rp65.000'], answer: 1, explanation: 'Diskon Rp20.000, jadi harga akhir Rp60.000.' },
  { id: 'm03', category: 'HITUNG CEPAT', prompt: 'Jika 4 orang menyelesaikan pekerjaan dalam 6 hari, berapa hari untuk 8 orang dengan kecepatan sama?', options: ['2', '3', '4', '12'], answer: 1, explanation: 'Jumlah pekerja dua kali lipat, waktu menjadi setengahnya.' },
  { id: 'm04', category: 'HITUNG CEPAT', prompt: 'Setengah dari 3/4 adalah…', options: ['1/4', '3/8', '2/3', '1/2'], answer: 1, explanation: '3/4 dibagi 2 = 3/8.' },
  { id: 'm05', category: 'HITUNG CEPAT', prompt: 'Sebuah kereta menempuh 150 km dalam 2,5 jam. Kecepatan rata-ratanya?', options: ['50 km/jam', '55 km/jam', '60 km/jam', '65 km/jam'], answer: 2, explanation: '150 ÷ 2,5 = 60 km/jam.' },
  { id: 'a01', category: 'ANALOGI', prompt: 'Buku : membaca = garpu : …', options: ['menulis', 'memotong', 'makan', 'memasak'], answer: 2, explanation: 'Buku digunakan untuk membaca, garpu digunakan untuk makan.' },
  { id: 'a02', category: 'ANALOGI', prompt: 'Dokter : rumah sakit = guru : …', options: ['perpustakaan', 'sekolah', 'pasar', 'stasiun'], answer: 1, explanation: 'Tempat kerja yang paling sesuai adalah sekolah.' },
  { id: 'a03', category: 'ANALOGI', prompt: 'Panas : dingin = terang : …', options: ['lampu', 'gelap', 'siang', 'matahari'], answer: 1, explanation: 'Hubungannya adalah pasangan berlawanan.' },
  { id: 'a04', category: 'ANALOGI', prompt: 'Benih : pohon = telur : …', options: ['sarang', 'ayam', 'bulu', 'cangkang'], answer: 1, explanation: 'Benih dapat tumbuh menjadi pohon, telur dapat menetas menjadi ayam.' },
  { id: 'a05', category: 'ANALOGI', prompt: 'Menit : waktu = meter : …', options: ['jarak', 'berat', 'kecepatan', 'suhu'], answer: 0, explanation: 'Menit mengukur waktu, meter mengukur jarak.' },
  { id: 'p06', category: 'POLA · MATRIKS', prompt: 'Simbol apa yang melengkapi pola kotak 3 × 3?', visualGrid: ['▲', '■', '●', '■', '●', '▲', '●', '▲', '?'], options: ['▲', '■', '●', '◆'], answer: 1, explanation: 'Setiap baris dan kolom memutar urutan segitiga, persegi, dan lingkaran.' },
  { id: 's06', category: 'DERET', prompt: 'Angka berikutnya: 5, 10, 8, 16, 14, 28, …', options: ['24', '26', '30', '56'], answer: 1, explanation: 'Polanya dikali 2, lalu dikurangi 2 secara bergantian.' },
  { id: 'l06', category: 'LOGIKA', prompt: 'Andi tiba sebelum Bima. Citra tiba setelah Bima. Siapa yang tiba paling awal?', options: ['Andi', 'Bima', 'Citra', 'Tidak diketahui'], answer: 0, explanation: 'Urutan kedatangan Andi, Bima, lalu Citra.' },
  { id: 'm06', category: 'HITUNG CEPAT', prompt: '15% dari 240 adalah…', options: ['24', '30', '36', '42'], answer: 2, explanation: '10% = 24 dan 5% = 12, total 36.' },
  { id: 'a06', category: 'ANALOGI', prompt: 'Kunci : pintu = kata sandi : …', options: ['akun', 'layar', 'keyboard', 'internet'], answer: 0, explanation: 'Kunci membuka pintu, kata sandi membuka akses akun.' }
];

export function seededShuffle(items, seed = 1) {
  const result = [...items];
  let value = (Number(seed) || 1) >>> 0;
  const random = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function scoreIqAnswers(questionSet = [], answers = {}) {
  let correct = 0;
  const details = questionSet.map((question, index) => {
    const value = answers?.[index];
    const selected = Number.isInteger(value) ? value : null;
    const isCorrect = selected === question.answer;
    if (isCorrect) correct += 1;
    return { id: question.id, selected, answer: question.answer, isCorrect, explanation: question.explanation };
  });
  return { correct, total: questionSet.length, percentage: questionSet.length ? Math.round(correct / questionSet.length * 100) : 0, details };
}
