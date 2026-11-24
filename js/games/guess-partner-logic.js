export const GUESS_PARTNER_PROMPTS = [
  { category: 'Kebiasaan', prompt: 'Apa kalimat yang paling sering aku ucapkan?' },
  { category: 'Favorit', prompt: 'Makanan apa yang paling ingin aku makan sekarang?' },
  { category: 'Kebiasaan', prompt: 'Apa hal kecil yang paling sering membuatku kesal?' },
  { category: 'Romantis', prompt: 'Apa panggilan sayang favoritku?' },
  { category: 'Favorit', prompt: 'Minuman apa yang hampir selalu kupilih?' },
  { category: 'Tentang Kita', prompt: 'Tempat kencan seperti apa yang paling aku inginkan?' },
  { category: 'Kebiasaan', prompt: 'Apa hal pertama yang biasanya kulakukan setelah bangun tidur?' },
  { category: 'Favorit', prompt: 'Kalau memilih camilan, apa yang paling mungkin kupilih?' },
  { category: 'Romantis', prompt: 'Hal sederhana apa yang paling membuatku merasa disayang?' },
  { category: 'Tentang Kita', prompt: 'Kenangan kita yang paling sering kuingat itu yang mana?' },
  { category: 'Favorit', prompt: 'Warna apa yang paling menggambarkan seleraku?' },
  { category: 'Kebiasaan', prompt: 'Apa kebiasaan unikku saat sedang gugup?' },
  { category: 'Favorit', prompt: 'Kalau liburan, aku lebih memilih pantai atau pegunungan?' },
  { category: 'Tentang Kita', prompt: 'Aktivitas apa yang paling ingin kulakukan saat kita bertemu?' },
  { category: 'Kebiasaan', prompt: 'Apa yang paling sering membuatku tertawa?' },
  { category: 'Favorit', prompt: 'Film atau genre apa yang paling kusukai?' },
  { category: 'Romantis', prompt: 'Hadiah sederhana seperti apa yang paling kusukai?' },
  { category: 'Kebiasaan', prompt: 'Apa yang biasanya kulakukan ketika sedang bad mood?' },
  { category: 'Favorit', prompt: 'Menu apa yang akan kupilih untuk makan malam spesial?' },
  { category: 'Tentang Kita', prompt: 'Siapa yang biasanya lebih dulu mengirim pesan?' },
  { category: 'Kebiasaan', prompt: 'Apa barang yang paling sering kubawa ke mana-mana?' },
  { category: 'Favorit', prompt: 'Kalau punya satu hari bebas, apa yang akan kulakukan?' },
  { category: 'Romantis', prompt: 'Momen seperti apa yang membuatku paling kangen?' },
  { category: 'Tentang Kita', prompt: 'Apa hal pertama yang menarik perhatianku darimu?' },
  { category: 'Kebiasaan', prompt: 'Apa kata yang sering kuucapkan saat terkejut?' },
  { category: 'Favorit', prompt: 'Aku lebih suka suasana ramai atau tenang?' },
  { category: 'Tentang Kita', prompt: 'Kalau kita punya waktu satu jam bersama, apa yang ingin kulakukan?' },
  { category: 'Romantis', prompt: 'Apa bentuk perhatian kecil yang paling kusukai?' },
  { category: 'Favorit', prompt: 'Dessert apa yang paling mungkin kupilih?' },
  { category: 'Kebiasaan', prompt: 'Apa yang paling sering membuatku lupa waktu?' },
  { category: 'Tentang Kita', prompt: 'Lagu apa yang paling mengingatkanku pada kita?' },
  { category: 'Favorit', prompt: 'Kalau memilih hewan peliharaan, apa yang akan kupilih?' },
  { category: 'Romantis', prompt: 'Seperti apa cara favoritku menghabiskan malam bersama?' },
  { category: 'Kebiasaan', prompt: 'Apa yang biasanya kulakukan saat sedang menunggu?' },
  { category: 'Favorit', prompt: 'Kota mana yang paling ingin kukunjungi?' },
  { category: 'Tentang Kita', prompt: 'Apa hal paling lucu yang pernah kita alami bersama?' },
  { category: 'Favorit', prompt: 'Kalau memilih satu makanan untuk seumur hidup, apa pilihanku?' },
  { category: 'Romantis', prompt: 'Apa yang paling ingin kudengar darimu ketika hari sedang berat?' },
  { category: 'Kebiasaan', prompt: 'Apa kebiasaanku yang paling mudah kamu kenali?' },
  { category: 'Tentang Kita', prompt: 'Kalau membuat tradisi berdua, tradisi apa yang kupilih?' }
];

export const ROUND_DURATION_SECONDS = 60;
export const TOTAL_ROUNDS = 6;
export const RATING_POINTS = Object.freeze({ correct: 2, close: 1, miss: 0 });

export function answererRoleForRound(roundNo) {
  return Number(roundNo) % 2 === 1 ? 'host' : 'guest';
}

export function oppositeRole(role) {
  return role === 'host' ? 'guest' : 'host';
}

export function choosePrompt(previousPrompt = '', random = Math.random) {
  if (GUESS_PARTNER_PROMPTS.length === 0) return { category: 'Umum', prompt: 'Apa hal favoritku?' };
  let index = Math.floor(random() * GUESS_PARTNER_PROMPTS.length);
  index = Math.max(0, Math.min(GUESS_PARTNER_PROMPTS.length - 1, index));
  if (GUESS_PARTNER_PROMPTS.length > 1 && GUESS_PARTNER_PROMPTS[index].prompt === previousPrompt) {
    index = (index + 1) % GUESS_PARTNER_PROMPTS.length;
  }
  return { ...GUESS_PARTNER_PROMPTS[index] };
}

export function cleanPlayerText(value, maxLength = 140) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export function scoreForRating(rating) {
  return Object.hasOwn(RATING_POINTS, rating) ? RATING_POINTS[rating] : 0;
}

// Kata pengisi tidak dihitung sebagai kecocokan agar tebakan seperti "aku"
// tidak mendapat poin ketika jawaban aslinya "aku suka mie ayam".
const ANSWER_STOP_WORDS = new Set([
  'aku', 'saya', 'gue', 'gua', 'ku', 'kamu', 'diriku', 'adalah', 'yang', 'paling',
  'sering', 'biasanya', 'apa', 'hal', 'untuk', 'saat', 'ketika', 'kalau', 'lebih',
  'suka', 'sukai', 'ingin', 'mau', 'akan', 'dengan', 'pada', 'dan', 'atau', 'ini',
  'itu', 'nya', 'sebuah', 'si', 'sang', 'banget', 'sangat', 'jadi', 'karena'
]);

export function normalizeAnswerTokens(value) {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const allTokens = normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  const meaningful = [...new Set(allTokens.filter(token => token.length > 1 && !ANSWER_STOP_WORDS.has(token)))];
  return meaningful.length ? meaningful : [...new Set(allTokens)];
}

/**
 * Exact phrase matching with keyword overlap as a fallback:
 * - 2 points only when the complete normalized phrases are identical.
 * - 1 point when at least one meaningful answer keyword overlaps, but the
 *   complete phrase differs (including added/omitted/reordered words).
 * - 0 points when there is no meaningful keyword overlap.
 *
 * Normalization ignores case, repeated whitespace, and punctuation only.
 * It does not ignore extra words or reorder words for an exact match.
 */
export function normalizeAnswerPhrase(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function evaluateAnswerMatch(answer, guess) {
  const answerPhrase = normalizeAnswerPhrase(answer);
  const guessPhrase = normalizeAnswerPhrase(guess);
  const answerTokens = normalizeAnswerTokens(answer);
  const guessTokens = new Set(normalizeAnswerTokens(guess));
  const matchedWords = answerTokens.filter(token => guessTokens.has(token));
  const exactMatch = Boolean(answerPhrase && guessPhrase && answerPhrase === guessPhrase);
  const rating = exactMatch
    ? 'correct'
    : matchedWords.length > 0 ? 'close' : 'miss';
  return {
    rating,
    score: scoreForRating(rating),
    exactMatch,
    matchedWords,
    answerKeywords: answerTokens,
    matchedCount: matchedWords.length,
    totalKeywords: answerTokens.length
  };
}

export function ratingLabel(rating) {
  if (rating === 'correct') return 'Tepat';
  if (rating === 'close') return 'Hampir';
  return 'Meleset';
}

export function calculateGuessScores(rounds = []) {
  const scores = { host: 0, guest: 0 };
  for (const round of rounds) {
    const guesser = oppositeRole(round?.answererRole);
    scores[guesser] += scoreForRating(round?.rating);
  }
  return scores;
}

export function getRemainingSeconds(startedAt, durationSeconds = ROUND_DURATION_SECONDS, now = Date.now()) {
  const start = Number(startedAt);
  if (!Number.isFinite(start) || start <= 0) return Math.max(0, Number(durationSeconds) || ROUND_DURATION_SECONDS);
  return Math.max(0, Math.ceil((start + (Number(durationSeconds) || ROUND_DURATION_SECONDS) * 1000 - now) / 1000));
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function isBothLocked(meta, answerStatus = {}, guessStatus = {}) {
  const key = String(meta?.roundKey || '');
  return Boolean(key && answerStatus?.[key]?.[meta.answererRole]?.locked === true && guessStatus?.[key]?.[oppositeRole(meta.answererRole)]?.locked === true);
}

export function nextRoundMeta(current, promptData, now = Date.now(), randomKey = () => crypto.randomUUID()) {
  const roundNo = Number(current?.roundNo || 0) + 1;
  return {
    phase: 'playing',
    matchNo: Number(current?.matchNo || 1),
    matchKey: String(current?.matchKey || randomKey()),
    roundNo,
    roundKey: randomKey(),
    prompt: String(promptData?.prompt || '').slice(0, 140),
    category: String(promptData?.category || 'Umum').slice(0, 32),
    answererRole: answererRoleForRound(roundNo),
    startedAt: Math.max(1, Number(now) || Date.now()),
    durationSeconds: ROUND_DURATION_SECONDS
  };
}

export function nextMatchMeta(current, promptData, now = Date.now(), randomKey = () => crypto.randomUUID()) {
  return {
    phase: 'playing',
    matchNo: Number(current?.matchNo || 1) + 1,
    matchKey: randomKey(),
    roundNo: 1,
    roundKey: randomKey(),
    prompt: String(promptData?.prompt || '').slice(0, 140),
    category: String(promptData?.category || 'Umum').slice(0, 32),
    answererRole: 'host',
    startedAt: Math.max(1, Number(now) || Date.now()),
    durationSeconds: ROUND_DURATION_SECONDS
  };
}
