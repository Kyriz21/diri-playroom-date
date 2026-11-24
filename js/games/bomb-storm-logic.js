export const BOMB_STORM_DURATION_SECONDS = 60;
export const BOMB_STORM_FALL_GRACE_MS = 5200;
export const BOMB_STORM_MAX_OBJECTS = 100;

function mix32(value) {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

export function randomForObject(seed, index) {
  const value = mix32((Number(seed) >>> 0) ^ Math.imul(index + 1, 0x9e3779b1));
  return value / 0x100000000;
}

export function createBombStormObject(seed, index) {
  if (!Number.isInteger(index) || index < 0 || index >= BOMB_STORM_MAX_OBJECTS) return null;
  const r1 = randomForObject(seed, index * 3);
  const r2 = randomForObject(seed, index * 3 + 1);
  const r3 = randomForObject(seed, index * 3 + 2);
  const speed = 0.235 + r2 * 0.13;
  const spawnAt = 650 + index * 760;
  const collisionAt = spawnAt + ((0.86 + 0.13) / speed) * 1000;
  return {
    id: index,
    kind: index % 5 === 3 || index % 7 === 5 ? 'heart' : 'bomb',
    x: 0.08 + r1 * 0.84,
    speed,
    spawnAt,
    collisionAt,
    radius: 0.034 + r3 * 0.008
  };
}

export function getBombStormObjectY(object, elapsedMs) {
  if (!object || !Number.isFinite(elapsedMs)) return -1;
  return -0.13 + Math.max(0, elapsedMs - object.spawnAt) / 1000 * object.speed;
}

export function processLandedObjects({ seed, elapsedMs, processedIndex = -1, playerX = 0.5, score = 0, lives = 3 }) {
  const rawIndex = Number(processedIndex);
  let nextIndex = Math.max(-1, Math.floor(Number.isFinite(rawIndex) ? rawIndex : -1));
  let nextScore = Math.max(0, Math.floor(Number(score) || 0));
  let nextLives = Math.max(0, Math.min(3, Math.floor(Number(lives) || 0)));
  const events = [];
  while (nextIndex + 1 < BOMB_STORM_MAX_OBJECTS) {
    const object = createBombStormObject(seed, nextIndex + 1);
    if (!object || object.collisionAt > elapsedMs) break;
    nextIndex += 1;
    const caught = Math.abs(Number(playerX) - object.x) <= 0.13;
    if (!caught) {
      events.push({ id: object.id, kind: object.kind, result: 'dodged' });
      continue;
    }
    if (object.kind === 'heart') {
      nextScore += 10;
      events.push({ id: object.id, kind: 'heart', result: 'collected', points: 10 });
    } else {
      nextLives = Math.max(0, nextLives - 1);
      events.push({ id: object.id, kind: 'bomb', result: 'hit', lives: nextLives });
    }
    if (nextLives === 0) break;
  }
  return { processedIndex: nextIndex, score: nextScore, lives: nextLives, events, finished: nextLives <= 0 };
}

export function getBombStormRemaining(startedAt, durationSeconds = BOMB_STORM_DURATION_SECONDS, now = Date.now()) {
  if (!Number.isFinite(startedAt) || startedAt <= 0) return durationSeconds;
  return Math.min(durationSeconds, Math.max(0, Math.ceil((durationSeconds * 1000 - (now - startedAt)) / 1000)));
}

export function determineBombStormWinner(players = {}) {
  const hostScore = Math.max(0, Number(players.host?.score) || 0);
  const guestScore = Math.max(0, Number(players.guest?.score) || 0);
  if (hostScore === guestScore) return { winner: 'draw', hostScore, guestScore };
  return { winner: hostScore > guestScore ? 'host' : 'guest', hostScore, guestScore };
}

export function nextBombStormSeed(seed, roundNo) {
  const value = mix32((Number(seed) >>> 0) ^ Math.imul(Number(roundNo) + 1, 0x85ebca6b));
  return value || 1;
}


/** Smooth remote/local avatar movement to avoid snapping between Firebase position updates. */
export function smoothPlayerX(current, target, deltaMs = 16, smoothingMs = 72) {
  const from = clampPlayerX(current);
  const to = clampPlayerX(target);
  const elapsed = Math.max(0, Math.min(100, Number(deltaMs) || 0));
  const smoothing = Math.max(1, Number(smoothingMs) || 72);
  const blend = 1 - Math.exp(-elapsed / smoothing);
  const next = from + (to - from) * blend;
  return Math.abs(to - next) < 0.001 ? to : clampPlayerX(next);
}

/** A short visual-only reaction. It never changes the player's game coordinates. */
export function getBombStormEffectFrame(kind, elapsedMs) {
  const duration = kind === 'heart' ? 820 : kind === 'bomb' ? 760 : 0;
  const elapsed = Number(elapsedMs);
  if (!duration || !Number.isFinite(elapsed) || elapsed < 0 || elapsed >= duration) return null;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  const wave = Math.sin(Math.PI * progress);
  if (kind === 'heart') {
    return {
      progress, alpha: 1 - progress, xOffset: 0,
      yOffset: -wave * 20,
      scaleX: 1 + wave * 0.12, scaleY: 1 + wave * 0.17,
      rotation: Math.sin(progress * Math.PI * 2) * 0.035 * (1 - progress),
      flash: 0, shake: 0
    };
  }
  const impact = Math.min(1, progress * 3.2);
  const squash = Math.sin(impact * Math.PI / 2);
  const decay = 1 - progress;
  return {
    progress, alpha: decay, xOffset: Math.sin(elapsed * 0.095) * 7 * decay,
    yOffset: -wave * 5,
    scaleX: 1 + squash * 0.15, scaleY: 1 - squash * 0.2,
    rotation: Math.sin(elapsed * 0.12) * 0.075 * decay,
    flash: (1 - Math.min(1, progress * 2.8)) * 0.48, shake: decay
  };
}

export function clampPlayerX(value) {
  return Math.max(0.06, Math.min(0.94, Number(value) || 0.5));
}
