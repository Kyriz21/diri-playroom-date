export const ARCADE_STAGE_DURATION_MS = 60000;
export const ARCADE_INTERMISSION_MS = 0;

// Arcade is deliberately a single, classic Flappy-style challenge.
export const ARCADE_STAGES = [
  {
    id: 'flappy-face',
    name: 'Flappy Face',
    type: 'flappy',
    icon: '🪽',
    hint: 'Ketuk arena atau tombol LOMPAT untuk mengepak. Lewati celah pipa dan kumpulkan poin.',
    points: 10,
    gapSize: 0.35
  }
];

export const ARCADE_AVATARS = [
  { id: 'cat', emoji: '🐱', name: 'Kucing' }, { id: 'rabbit', emoji: '🐰', name: 'Kelinci' },
  { id: 'panda', emoji: '🐼', name: 'Panda' }, { id: 'fox', emoji: '🦊', name: 'Rubah' },
  { id: 'frog', emoji: '🐸', name: 'Katak' }, { id: 'monkey', emoji: '🐵', name: 'Monyet' },
  { id: 'koala', emoji: '🐨', name: 'Koala' }, { id: 'tiger', emoji: '🐯', name: 'Harimau' },
  { id: 'chick', emoji: '🐥', name: 'Anak ayam' }, { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
  { id: 'alien', emoji: '👾', name: 'Alien' }, { id: 'bear', emoji: '🧸', name: 'Beruang' }
];

const PLAYER_RADIUS = 0.034;
const PIPE_HALF_WIDTH = 0.026;
const TOP_LIMIT = 0.07;
const FLOOR_LIMIT = 0.92;
const GRAVITY = 1.28;
const FLAP_VELOCITY = -0.57;

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
  return role === 'guest'
    ? { min: 0.54, max: 0.95, start: 0.76, direction: 1 }
    : { min: 0.05, max: 0.46, start: 0.24, direction: -1 };
}

export function createArcadePlayer(role, values = {}) {
  const lane = getArcadeLane(role);
  return {
    x: lane.start,
    y: 0.5,
    vy: 0,
    score: 0,
    stageScore: 0,
    lives: 3,
    gatesPassed: 0,
    invulnerableUntil: 0,
    consumed: [],
    passed: [],
    ...values
  };
}

export function createArcadeEntities(seed, stageIndex = 0, role = 'host') {
  const lane = getArcadeLane(role);
  const startX = role === 'guest' ? lane.min - 0.06 : lane.max + 0.06;
  const direction = lane.direction;
  const distance = (lane.max - lane.min) + 0.18;
  return Array.from({ length: 22 }, (_, index) => {
    const vertical = random01(seed, stageIndex, index, 23);
    const gapSize = Math.max(0.29, 0.36 - index * 0.003);
    return {
      id: `flappy-gate-${index + 1}`,
      kind: 'gate',
      x: startX,
      startX,
      direction,
      distance,
      gapY: 0.25 + vertical * 0.46,
      gapSize,
      spawnAt: 1300 + index * 2400,
      lifeMs: Math.max(3700, 4800 - index * 32),
      value: 10
    };
  });
}

export function getArcadeEntityPosition(entity, elapsedMs) {
  const age = elapsedMs - entity.spawnAt;
  if (age < 0 || age > entity.lifeMs) return null;
  const progress = age / entity.lifeMs;
  return {
    x: entity.startX + entity.direction * entity.distance * progress,
    y: entity.gapY,
    gapY: entity.gapY,
    gapSize: entity.gapSize,
    age,
    progress
  };
}

function loseLife(next, now, events, cause) {
  if (now < Number(next.invulnerableUntil || 0) || next.lives <= 0) return false;
  next.lives = Math.max(0, Number(next.lives || 0) - 1);
  next.invulnerableUntil = now + 1000;
  next.y = 0.5;
  next.vy = 0;
  events.push({ kind: 'hit', cause, lives: next.lives });
  return true;
}

export function stepArcadePlayer({ player, role, stage = ARCADE_STAGES[0], input = {}, dt = 1 / 60, elapsedMs = 0, entities = [], now = 0 }) {
  const next = { ...player, consumed: [...(player.consumed || [])], passed: [...(player.passed || [])] };
  const events = [];
  if (next.lives <= 0) return { player: next, events };

  if (input.jumpPressed || input.tap) next.vy = FLAP_VELOCITY;
  next.vy = Math.min(1.15, next.vy + GRAVITY * dt);
  next.y += next.vy * dt;

  if (next.y < TOP_LIMIT || next.y > FLOOR_LIMIT) {
    const boundary = next.y < TOP_LIMIT ? 'ceiling' : 'floor';
    if (loseLife(next, now, events, boundary)) return { player: next, events };
    next.y = Math.max(TOP_LIMIT, Math.min(FLOOR_LIMIT, next.y));
    next.vy = 0;
  }

  const consumed = new Set(next.consumed);
  const passed = new Set(next.passed);
  const lane = getArcadeLane(role);
  for (const entity of entities) {
    if (consumed.has(entity.id) || passed.has(entity.id)) continue;
    const position = getArcadeEntityPosition(entity, elapsedMs);
    if (!position) continue;

    const overlappingPipe = Math.abs(position.x - next.x) <= PIPE_HALF_WIDTH + PLAYER_RADIUS;
    if (overlappingPipe) {
      const gapTop = position.gapY - position.gapSize / 2;
      const gapBottom = position.gapY + position.gapSize / 2;
      const fitsGap = next.y - PLAYER_RADIUS > gapTop && next.y + PLAYER_RADIUS < gapBottom;
      if (!fitsGap) {
        if (now >= Number(next.invulnerableUntil || 0)) loseLife(next, now, events, 'pipe');
        consumed.add(entity.id);
        continue;
      }
    }

    const hasPassed = lane.direction < 0
      ? position.x < next.x - PIPE_HALF_WIDTH - PLAYER_RADIUS
      : position.x > next.x + PIPE_HALF_WIDTH + PLAYER_RADIUS;
    if (hasPassed) {
      passed.add(entity.id);
      next.score += entity.value || stage.points || 10;
      next.stageScore += entity.value || stage.points || 10;
      next.gatesPassed = Number(next.gatesPassed || 0) + 1;
      events.push({ kind: 'passed', score: entity.value || stage.points || 10, gatesPassed: next.gatesPassed });
    }
  }

  next.consumed = [...consumed];
  next.passed = [...passed];
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
    hostGates: Number(players.host?.gatesPassed || 0),
    guestGates: Number(players.guest?.gatesPassed || 0),
    winner: hostScore === guestScore ? 'draw' : hostScore > guestScore ? 'host' : 'guest'
  };
}
