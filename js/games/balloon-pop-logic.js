export const BALLOON_POP_DURATION_SECONDS = 60;
export const BALLOON_POP_MAX_OBJECTS = 100;
export const BALLOON_POP_FLIGHT_MS = 3800;
export const BALLOON_POP_SPAWN_INTERVAL_MS = 600;

function mix32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

export function balloonRandom(seed, index) {
  return mix32((Number(seed) >>> 0) ^ Math.imul(index + 1, 0x9e3779b1)) / 0x100000000;
}

export function createBalloon(seed, index) {
  if (!Number.isInteger(index) || index < 0 || index >= BALLOON_POP_MAX_OBJECTS) return null;
  const xRandom = balloonRandom(seed, index * 4);
  const typeRandom = balloonRandom(seed, index * 4 + 1);
  const sizeRandom = balloonRandom(seed, index * 4 + 2);
  const driftRandom = balloonRandom(seed, index * 4 + 3);
  let kind = 'normal';
  if (typeRandom < 0.11) kind = 'bomb';
  else if (typeRandom < 0.22) kind = 'heart';
  else if (typeRandom < 0.29) kind = 'gold';
  return {
    id: index,
    kind,
    x: 0.09 + xRandom * 0.82,
    drift: (driftRandom - 0.5) * 0.045,
    radius: 0.047 + sizeRandom * 0.012,
    spawnAt: 480 + index * BALLOON_POP_SPAWN_INTERVAL_MS,
    points: kind === 'heart' ? 5 : kind === 'gold' ? 10 : kind === 'normal' ? 1 : 0,
    lifeLoss: kind === 'bomb' ? 1 : 0
  };
}

export function getBalloonY(balloon, elapsedMs) {
  if (!balloon || !Number.isFinite(elapsedMs)) return 2;
  const progress = Math.max(0, elapsedMs - balloon.spawnAt) / BALLOON_POP_FLIGHT_MS;
  return 1.08 - progress * 1.25;
}

export function getBalloonX(balloon, elapsedMs) {
  if (!balloon) return 0.5;
  const progress = Math.max(0, elapsedMs - balloon.spawnAt) / 1000;
  return Math.max(0.07, Math.min(0.93, balloon.x + Math.sin(progress * 2.2 + balloon.id) * balloon.drift));
}

export function findBalloonAtPoint({ seed, elapsedMs, hitIds = {}, x, y, width = 1, height = 1 }) {
  if (![elapsedMs, x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const limit = Math.min(BALLOON_POP_MAX_OBJECTS, Math.floor((elapsedMs - 480) / BALLOON_POP_SPAWN_INTERVAL_MS) + 1);
  let nearest = null;
  let nearestDistance = Infinity;
  for (let index = 0; index < limit; index++) {
    if (hitIds[index]) continue;
    const balloon = createBalloon(seed, index);
    const bx = getBalloonX(balloon, elapsedMs) * width;
    const by = getBalloonY(balloon, elapsedMs) * height;
    if (by < -balloon.radius * height || by > height + balloon.radius * height) continue;
    const dx = (x - bx) / Math.max(1, width);
    const dy = (y - by) / Math.max(1, height);
    const distance = Math.hypot(dx, dy);
    const radius = balloon.radius * 1.75;
    if (distance <= radius && distance < nearestDistance) {
      nearest = balloon;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function applyBalloonPop(stats = {}, balloon) {
  const score = Math.max(0, Math.floor(Number(stats.score) || 0));
  const lives = Math.max(0, Math.min(3, Math.floor(Number(stats.lives ?? 3))));
  if (!balloon || lives <= 0) return { score, lives, popped: Math.max(0, Number(stats.popped) || 0), finished: lives <= 0, points: 0, lifeLoss: 0 };
  const points = Math.max(0, Math.floor(Number(balloon.points) || 0));
  const lifeLoss = Math.max(0, Math.min(1, Math.floor(Number(balloon.lifeLoss) || 0)));
  const nextLives = Math.max(0, lives - lifeLoss);
  return {
    score: score + points,
    lives: nextLives,
    popped: Math.max(0, Math.floor(Number(stats.popped) || 0)) + 1,
    finished: nextLives <= 0,
    points,
    lifeLoss
  };
}

export function summarizeBalloonHits(stats = {}) {
  const events = stats.events && typeof stats.events === 'object' ? Object.values(stats.events) : [];
  const score = Math.max(0, Math.floor(Number(stats.score) || 0));
  const lives = Math.max(0, Math.min(3, Math.floor(Number(stats.lives ?? 3))));
  return {
    score,
    lives,
    popped: Math.max(0, Math.floor(Number(stats.popped) || events.length)),
    normal: events.filter(event => event?.kind === 'normal').length,
    hearts: events.filter(event => event?.kind === 'heart').length,
    gold: events.filter(event => event?.kind === 'gold').length,
    bombs: events.filter(event => event?.kind === 'bomb').length,
    finished: Boolean(stats.finished || lives <= 0)
  };
}

export function getBalloonPopRemaining(startedAt, durationSeconds = BALLOON_POP_DURATION_SECONDS, now = Date.now()) {
  if (!Number.isFinite(startedAt) || startedAt <= 0) return durationSeconds;
  return Math.min(durationSeconds, Math.max(0, Math.ceil((durationSeconds * 1000 - (now - startedAt)) / 1000)));
}

export function hasBalloonPopElimination(players = {}) {
  const host = summarizeBalloonHits(players.host?.stats || {});
  const guest = summarizeBalloonHits(players.guest?.stats || {});
  return host.lives <= 0 || guest.lives <= 0;
}

export function determineBalloonPopWinner(players = {}) {
  const host = summarizeBalloonHits(players.host?.stats || {});
  const guest = summarizeBalloonHits(players.guest?.stats || {});
  // If exactly one player runs out of lives, survival wins immediately,
  // regardless of the opponent's score. If both are eliminated, use score.
  if (host.lives <= 0 && guest.lives > 0) return { winner: 'guest', reason: 'elimination', host, guest };
  if (guest.lives <= 0 && host.lives > 0) return { winner: 'host', reason: 'elimination', host, guest };
  if (host.score === guest.score) return { winner: 'draw', reason: 'score', host, guest };
  return { winner: host.score > guest.score ? 'host' : 'guest', reason: host.lives <= 0 || guest.lives <= 0 ? 'score-after-elimination' : 'score', host, guest };
}

export function nextBalloonPopSeed(seed, roundNo) {
  return mix32((Number(seed) >>> 0) ^ Math.imul(Number(roundNo) + 1, 0x85ebca6b)) || 1;
}
