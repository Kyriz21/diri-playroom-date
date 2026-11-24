export const DRAW_PROMPTS = [
  'Seekor kucing yang sedang mengantuk',
  'Rumah impian di tepi pantai',
  'Dua gelas minuman untuk kencan virtual',
  'Bunga favorit untuk pasangan',
  'Roket menuju bulan',
  'Kelinci memakai mahkota',
  'Makanan yang ingin kita makan bersama',
  'Pemandangan saat matahari terbenam',
  'Monster kecil yang baik hati',
  'Taman penuh bunga dan kupu-kupu',
  'Kucing dan anjing menjadi sahabat',
  'Kamera untuk menyimpan kenangan',
  'Kastil di atas awan',
  'Es krim dengan tiga rasa',
  'Ikan lucu di dalam akuarium',
  'Planet tempat tinggal alien ramah',
  'Payung saat hujan bersama',
  'Sepasang kaus kaki yang serasi',
  'Kue ulang tahun paling meriah',
  'Burung kecil di atas pohon',
  'Mobil untuk perjalanan jauh',
  'Boneka beruang membawa surat',
  'Pemandangan gunung dan danau',
  'Robot yang sedang menari',
  'Bintang dan bulan tersenyum',
  'Kapal kecil di tengah laut',
  'Pizza dengan topping favorit',
  'Kebun mini di dalam cangkir',
  'Hewan khayalan gabungan dua hewan',
  'Tempat kencan impian kita'
];

export function chooseDrawPrompt(random = Math.random) {
  const value = Math.floor(random() * DRAW_PROMPTS.length);
  return DRAW_PROMPTS[Math.min(DRAW_PROMPTS.length - 1, Math.max(0, value))];
}

export function normalizePoint(point) {
  if (!point || !Number.isFinite(Number(point.x)) || !Number.isFinite(Number(point.y))) return null;
  return {
    x: Math.max(0, Math.min(1, Number(point.x))),
    y: Math.max(0, Math.min(1, Number(point.y)))
  };
}

export function sanitizeStroke(stroke) {
  if (!stroke || typeof stroke !== 'object') return null;
  const points = (Array.isArray(stroke.points) ? stroke.points : [])
    .slice(0, 400)
    .map(normalizePoint)
    .filter(Boolean);
  if (!points.length) return null;
  const color = typeof stroke.color === 'string' && /^#[0-9a-f]{6}$/i.test(stroke.color) ? stroke.color : '#34303c';
  const width = Math.max(1, Math.min(24, Number(stroke.width) || 4));
  const tool = stroke.tool === 'eraser' ? 'eraser' : 'pen';
  return {
    color,
    width,
    tool,
    points,
    createdAt: Math.max(0, Number(stroke.createdAt) || 0)
  };
}

export function getRemainingSeconds(startedAt, durationSeconds, now = Date.now()) {
  if (!Number.isFinite(Number(startedAt)) || Number(startedAt) <= 0) return Math.max(0, Number(durationSeconds) || 0);
  return Math.max(0, Math.ceil((Number(startedAt) + (Number(durationSeconds) || 120) * 1000 - now) / 1000));
}

export function formatDrawTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function sortStrokesByTime(strokesByUid = {}) {
  return Object.entries(strokesByUid).flatMap(([uid, strokes]) =>
    Object.entries(strokes || {}).map(([id, value]) => ({ uid, id, ...sanitizeStroke(value) }))
      .filter(stroke => stroke.points?.length)
  ).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
