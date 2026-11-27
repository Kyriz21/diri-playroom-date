export const ARCADE_STAGE_DURATION_MS = 12000;
export const ARCADE_INTERMISSION_MS = 1200;

export const ARCADE_STAGES = [
  { id: 'flappy-face', name: 'Flappy Face', type: 'flappy', icon: '🪽', hint: 'Ketuk LOMPAT untuk melewati gerbang neon dan ambil bintang.', entities: ['gate', 'star', 'gate', 'heart', 'gate', 'star'], points: 10 },
  { id: 'heart-catcher', name: 'Heart Catcher', type: 'catch', icon: '💗', hint: 'Geser kiri dan kanan untuk menangkap hati. Hindari bom.', entities: ['heart', 'coin', 'bomb', 'heart', 'heart', 'bomb', 'coin', 'heart'], points: 10 },
  { id: 'neon-dodge', name: 'Neon Dodge', type: 'dodge', icon: '⚡', hint: 'Pindah posisi untuk menghindari balok yang jatuh.', entities: ['block', 'block', 'star', 'block', 'bomb', 'block', 'heart', 'block'], points: 8 },
  { id: 'noodle-runner', name: 'Noodle Runner', type: 'runner', icon: '🏃', hint: 'Lari otomatis. LOMPAT melewati rintangan dan ambil koin.', entities: ['crate', 'coin', 'crate', 'crate', 'star', 'crate', 'heart'], points: 10 },
  { id: 'coin-rush', name: 'Coin Rush', type: 'catch', icon: '🪙', hint: 'Kumpulkan koin sebanyak mungkin sebelum waktu habis.', entities: ['coin', 'coin', 'bomb', 'coin', 'heart', 'coin', 'coin', 'bomb'], points: 12 },
  { id: 'bubble-pop', name: 'Bubble Pop', type: 'pop', icon: '🫧', hint: 'Dekati gelembung lalu tekan AKSI untuk memecahkannya.', entities: ['bubble', 'bubble', 'star', 'bubble', 'bubble', 'heart', 'bubble'], points: 12 },
  { id: 'sky-hop', name: 'Sky Hop', type: 'hop', icon: '☁️', hint: 'Lompat untuk mengambil bintang yang melayang tinggi.', entities: ['star', 'star', 'cloud', 'heart', 'star', 'cloud', 'star'], points: 12 },
  { id: 'laser-lanes', name: 'Laser Lanes', type: 'lane', icon: '🔦', hint: 'Geser jalur untuk menghindari sinar laser dan ambil bonus.', entities: ['laser', 'laser', 'coin', 'laser', 'laser', 'heart', 'laser', 'laser'], points: 10 },
  { id: 'rocket-flight', name: 'Rocket Flight', type: 'rocket', icon: '🚀', hint: 'Tahan LOMPAT untuk terbang. Lepas untuk turun dan hindari meteor.', entities: ['star', 'meteor', 'star', 'meteor', 'heart', 'meteor', 'star'], points: 12 },
  { id: 'meteor-dodge', name: 'Meteor Dodge', type: 'dodge', icon: '☄️', hint: 'Hindari hujan meteor dan kumpulkan hati di sela-selanya.', entities: ['meteor', 'meteor', 'heart', 'meteor', 'coin', 'meteor', 'meteor', 'heart'], points: 10 },
  { id: 'rhythm-tap', name: 'Rhythm Tap', type: 'rhythm', icon: '🎵', hint: 'Tekan AKSI tepat saat lingkaran menyentuh garis cahaya.', entities: [], points: 15 },
  { id: 'final-sprint', name: 'Final Sprint', type: 'boss', icon: '👾', hint: 'Gabungan akhir: bergerak, lompat, kumpulkan hati, hindari bom.', entities: ['heart', 'meteor', 'coin', 'bomb', 'star', 'block', 'heart', 'meteor', 'coin'], points: 15 }
];

export const ARCADE_AVATARS = [
  { id: 'cat', emoji: '🐱', name: 'Kucing' }, { id: 'rabbit', emoji: '🐰', name: 'Kelinci' },
  { id: 'panda', emoji: '🐼', name: 'Panda' }, { id: 'fox', emoji: '🦊', name: 'Rubah' },
  { id: 'frog', emoji: '🐸', name: 'Katak' }, { id: 'monkey', emoji: '🐵', name: 'Monyet' },
  { id: 'koala', emoji: '🐨', name: 'Koala' }, { id: 'tiger', emoji: '🐯', name: 'Harimau' },
  { id: 'chick', emoji: '🐥', name: 'Anak ayam' }, { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'alien', emoji: '👾', name: 'Alien' }, { id: 'bear', emoji: '🧸', name: 'Beruang' }
];

export function arcadeHash(seed, stageIndex, itemIndex, salt = 0) {
  let value = (Number(seed) ^ Math.imul(stageIndex + 1, 0x9e3779b1) ^ Math.imul(itemIndex + 1, 0x85ebca6b) ^ salt) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}

function random01(seed, stageIndex, itemIndex, salt = 0) {
  return arcadeHash(seed, stageIndex, itemIndex, salt) / 0xffffffff;
}

export function getArcadeLane(role) {
  return role === 'guest' ? { min: 0.54, max: 0.95, start: 0.76, direction: -1 } : { min: 0.05, max: 0.46, start: 0.24, direction: 1 };
}

export function createArcadePlayer(role, values = {}) {
  const lane = getArcadeLane(role);
  return {
    x: lane.start,
    y: 0.82,
    vy: 0,
    score: 0,
    stageScore: 0,
    lives: 3,
    invulnerableUntil: 0,
    consumed: [],
    lastBeat: -1,
    ...values
  };
}

export function createArcadeEntities(seed, stageIndex, role) {
  const stage = ARCADE_STAGES[stageIndex];
  if (!stage || stage.type === 'rhythm') return [];
  const lane = getArcadeLane(role);
  const width = lane.max - lane.min;
  return stage.entities.map((kind, index) => {
    const r1 = random01(seed, stageIndex, index, 11);
    const r2 = random01(seed, stageIndex, index, 23);
    const mirror = role === 'guest';
    const offset = 0.06 + r1 * 0.78;
    const x = mirror
      ? lane.max - width * offset
      : lane.min + width * offset;
    return {
      id: `${stage.id}-${index}`,
      kind,
      x,
      baseY: 0.2 + r2 * 0.52,
      spawnAt: 450 + index * (stage.type === 'pop' ? 1050 : 880),
      lifeMs: stage.type === 'pop' ? 2900 : stage.type === 'runner' || stage.type === 'flappy' ? 2200 : 3200,
      phase: random01(seed, stageIndex, index, 37) * Math.PI * 2,
      value: kind === 'coin' ? 12 : kind === 'star' ? 15 : kind === 'heart' ? 10 : stage.points
    };
  });
}

export function getArcadeEntityPosition(entity, elapsedMs, stage) {
  const age = elapsedMs - entity.spawnAt;
  if (age < 0 || age > entity.lifeMs) return null;
  const t = age / entity.lifeMs;
  if (stage.type === 'runner' || stage.type === 'flappy') {
    const lane = entity.x < 0.5 ? { min: 0.05, max: 0.46 } : { min: 0.54, max: 0.95 };
    const direction = entity.x < 0.5 ? 1 : -1;
    return { x: entity.x + direction * t * (lane.max - lane.min) * 0.72, y: entity.baseY > 0.5 ? 0.82 : entity.baseY, age, progress: t };
  }
  if (stage.type === 'pop') {
    return { x: entity.x + Math.sin(age / 330 + entity.phase) * 0.025, y: entity.baseY + Math.cos(age / 430 + entity.phase) * 0.035, age, progress: t };
  }
  if (stage.type === 'hop') {
    return { x: entity.x, y: entity.baseY + Math.sin(age / 270 + entity.phase) * 0.035, age, progress: t };
  }
  return { x: entity.x, y: -0.1 + t * 1.12, age, progress: t };
}

export function arcadeBeatAt(elapsedMs, beatMs = 900, offsetMs = 650) {
  if (elapsedMs < offsetMs) return { beat: -1, delta: Infinity };
  const beat = Math.round((elapsedMs - offsetMs) / beatMs);
  const target = offsetMs + beat * beatMs;
  return { beat, target, delta: elapsedMs - target };
}

export function stepArcadePlayer({ player, role, stage, input = {}, dt = 1 / 60, elapsedMs = 0, entities = [], now = 0 }) {
  const lane = getArcadeLane(role);
  const next = { ...player, consumed: [...(player.consumed || [])] };
  const moveSpeed = stage.type === 'lane' ? 0.86 : 0.68;
  if (input.left) next.x -= moveSpeed * dt;
  if (input.right) next.x += moveSpeed * dt;
  next.x = Math.max(lane.min + 0.025, Math.min(lane.max - 0.025, next.x));

  const jumpable = ['flappy', 'runner', 'hop', 'boss'].includes(stage.type);
  if (jumpable) {
    if ((input.jumpPressed || input.up) && next.y >= 0.78) next.vy = -1.45;
    next.vy += 3.4 * dt;
    next.y += next.vy * dt;
    if (next.y >= 0.82) { next.y = 0.82; next.vy = 0; }
    if (next.y < 0.12) { next.y = 0.12; next.vy = Math.max(0, next.vy); }
  } else if (stage.type === 'rocket') {
    next.vy += ((input.jump || input.up) ? -2.1 : 1.35) * dt;
    next.vy = Math.max(-0.78, Math.min(0.78, next.vy));
    next.y += next.vy * dt;
    next.y = Math.max(0.16, Math.min(0.82, next.y));
    if (next.y === 0.16 || next.y === 0.82) next.vy *= -0.15;
  } else if (stage.type === 'pop') {
    if (input.up) next.y -= 0.56 * dt;
    if (input.down) next.y += 0.56 * dt;
    next.y = Math.max(0.12, Math.min(0.82, next.y));
  } else {
    next.y = 0.82;
    next.vy = 0;
  }

  const events = [];
  const consumed = new Set(next.consumed);
  if (stage.type === 'rhythm' && input.actionPressed) {
    const beat = arcadeBeatAt(elapsedMs);
    if (beat.beat >= 0 && beat.beat !== next.lastBeat) {
      next.lastBeat = beat.beat;
      if (Math.abs(beat.delta) <= 190) {
        next.score += 15;
        next.stageScore += 15;
        events.push({ kind: 'perfect', score: 15 });
      } else if (Math.abs(beat.delta) <= 320) {
        next.score += 7;
        next.stageScore += 7;
        events.push({ kind: 'good', score: 7 });
      } else {
        events.push({ kind: 'miss', score: 0 });
      }
    }
  }

  for (const entity of entities) {
    if (consumed.has(entity.id)) continue;
    const position = getArcadeEntityPosition(entity, elapsedMs, stage);
    if (!position) continue;
    const dx = position.x - next.x;
    const dy = position.y - next.y;
    const near = Math.hypot(dx * 1.05, dy * 0.9) <= (stage.type === 'pop' ? 0.085 : 0.075);
    if (!near) continue;
    let activated = false;
    if (stage.type === 'pop') activated = Boolean(input.actionPressed);
    else activated = true;
    if (!activated) continue;
    consumed.add(entity.id);
    if (['bomb', 'block', 'crate', 'laser', 'meteor', 'gate'].includes(entity.kind)) {
      if (now >= Number(next.invulnerableUntil || 0)) {
        next.lives = Math.max(0, next.lives - 1);
        next.invulnerableUntil = now + 850;
        events.push({ kind: 'hit', entity: entity.kind, lives: next.lives });
      }
    } else {
      const points = entity.value || stage.points;
      next.score += points;
      next.stageScore += points;
      events.push({ kind: 'collect', entity: entity.kind, score: points });
    }
  }
  next.consumed = [...consumed];
  return { player: next, events };
}

export function getArcadeRemaining(startedAt, durationMs, now) {
  if (!startedAt) return durationMs;
  return Math.min(durationMs, Math.max(0, durationMs - (now - startedAt)));
}

export function getArcadeWinner(players = {}) {
  const hostScore = Number(players.host?.score || 0);
  const guestScore = Number(players.guest?.score || 0);
  return {
    hostScore,
    guestScore,
    winner: hostScore === guestScore ? 'draw' : hostScore > guestScore ? 'host' : 'guest'
  };
}
