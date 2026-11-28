export const BOMBER_GRID_WIDTH = 13;
export const BOMBER_GRID_HEIGHT = 11;
export const BOMBER_DURATION_MS = 180000;
export const BOMBER_BOMB_FUSE_MS = 2200;
export const BOMBER_EXPLOSION_MS = 520;
export const BOMBER_WARNING_MS = 850;
export const BOMBER_BASE_FIRE_RANGE = 2;
export const BOMBER_MAX_LIVES = 3;
export const BOMBER_TICK_MS = 70;
export const BOMBER_MOVE_DELAY_MS = 155;
export const BOMBER_SPAWN_PROTECTION_MS = 1600;
export const BOMBER_MIN_POWERUP_PAIRS = 2;
export const BOMBER_MAX_POWERUP_PAIRS = 4;

export const BOMBER_SPAWNS = Object.freeze({
  host: Object.freeze({ x: 1, y: 1 }),
  guest: Object.freeze({ x: BOMBER_GRID_WIDTH - 2, y: BOMBER_GRID_HEIGHT - 2 })
});

export const BOMBER_POWERUPS = Object.freeze({
  bombup: { label: 'Bomb Up', icon: '💣', description: 'Kapasitas bom bertambah satu.' },
  fireup: { label: 'Fire Up', icon: '🔥', description: 'Jangkauan ledakan bertambah satu tile.' },
  speedup: { label: 'Speed Up', icon: '⚡', description: 'Gerakan menjadi lebih cepat.' },
  shield: { label: 'Shield', icon: '🛡️', description: 'Menahan satu ledakan.' }
});

export function bomberCellKey(x, y) { return `${Math.trunc(x)}_${Math.trunc(y)}`; }

export function parseBomberCellKey(key) {
  const [x, y] = String(key).split('_').map(Number);
  return { x, y };
}

export function bomberHash(seed, x, y, salt = 0) {
  let value = (Number(seed) ^ Math.imul(x + 17, 0x9e3779b1) ^ Math.imul(y + 31, 0x85ebca6b) ^ salt) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}

export const BOMBER_ARENA_PROFILES = Object.freeze({
  open: Object.freeze({ key: 'open', label: 'Lapangan Terbuka', density: 0.53 }),
  crossroads: Object.freeze({ key: 'crossroads', label: 'Persimpangan', density: 0.68 }),
  fortress: Object.freeze({ key: 'fortress', label: 'Benteng Tengah', density: 0.68 })
});

export function getBomberArenaProfile(seed = 1) {
  const profileKeys = Object.keys(BOMBER_ARENA_PROFILES);
  const index = bomberHash(seed, 0, 0, 0x4a71e9) % profileKeys.length;
  return BOMBER_ARENA_PROFILES[profileKeys[index]];
}

function inSpawnSafeZone(x, y, role) {
  const spawn = BOMBER_SPAWNS[role];
  return Math.abs(x - spawn.x) + Math.abs(y - spawn.y) <= 3;
}

function inGuaranteedEscapeLane(x, y, role) {
  if (role === 'host') return (y === 1 && x <= 4) || (x === 1 && y <= 4);
  return (y === BOMBER_GRID_HEIGHT - 2 && x >= BOMBER_GRID_WIDTH - 5) || (x === BOMBER_GRID_WIDTH - 2 && y >= BOMBER_GRID_HEIGHT - 5);
}

function getOpenFloorKeys(wallSet, blockSet) {
  const cells = [];
  for (let y = 1; y < BOMBER_GRID_HEIGHT - 1; y += 1) {
    for (let x = 1; x < BOMBER_GRID_WIDTH - 1; x += 1) {
      const key = bomberCellKey(x, y);
      if (!wallSet.has(key) && !blockSet.has(key)) cells.push(key);
    }
  }
  return cells;
}

function getReachableFloorKeys(wallSet, blockSet, start = BOMBER_SPAWNS.host) {
  const startKey = bomberCellKey(start.x, start.y);
  if (wallSet.has(startKey) || blockSet.has(startKey)) return new Set();
  const queue = [{ x: start.x, y: start.y }];
  const visited = new Set([startKey]);
  const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
  for (let index = 0; index < queue.length; index += 1) {
    const point = queue[index];
    for (const direction of directions) {
      const x = point.x + direction.dx;
      const y = point.y + direction.dy;
      const key = bomberCellKey(x, y);
      if (x <= 0 || y <= 0 || x >= BOMBER_GRID_WIDTH - 1 || y >= BOMBER_GRID_HEIGHT - 1) continue;
      if (wallSet.has(key) || blockSet.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ x, y });
    }
  }
  return visited;
}

function hasAccessibleNeighbor(key, wallSet, blockSet) {
  const { x, y } = parseBomberCellKey(key);
  return [
    { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
  ].some(point => {
    const neighborKey = bomberCellKey(point.x, point.y);
    return point.x > 0 && point.y > 0 && point.x < BOMBER_GRID_WIDTH - 1 && point.y < BOMBER_GRID_HEIGHT - 1
      && !wallSet.has(neighborKey) && !blockSet.has(neighborKey);
  });
}

function preservesPlayableConnectivity(wallSet, proposedBlocks) {
  const openCells = getOpenFloorKeys(wallSet, proposedBlocks);
  if (!openCells.length) return false;
  const hostReachable = getReachableFloorKeys(wallSet, proposedBlocks, BOMBER_SPAWNS.host);
  if (hostReachable.size !== openCells.length) return false;
  const guestKey = bomberCellKey(BOMBER_SPAWNS.guest.x, BOMBER_SPAWNS.guest.y);
  return hostReachable.has(guestKey) && [...proposedBlocks].every(key => hasAccessibleNeighbor(key, wallSet, proposedBlocks));
}

export function getBomberReachableCells(arena, start = BOMBER_SPAWNS.host, destroyedBlocks = {}) {
  const wallSet = new Set(arena?.walls || []);
  const blockSet = new Set((arena?.blocks || []).filter(key => destroyedBlocks[key] !== true));
  return getReachableFloorKeys(wallSet, blockSet, start);
}

export function createBomberArena(seed = 1) {
  const walls = [];
  const wallSet = new Set();
  const blocks = [];
  const blockSet = new Set();
  const hiddenPowerups = {};
  const profile = getBomberArenaProfile(seed);
  const placedPairs = [];

  for (let y = 0; y < BOMBER_GRID_HEIGHT; y += 1) {
    for (let x = 0; x < BOMBER_GRID_WIDTH; x += 1) {
      const key = bomberCellKey(x, y);
      const border = x === 0 || y === 0 || x === BOMBER_GRID_WIDTH - 1 || y === BOMBER_GRID_HEIGHT - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      if (border || pillar) {
        walls.push(key);
        wallSet.add(key);
      }
    }
  }

  // Create rotationally mirrored crate pairs so both spawn sides receive
  // equivalent routes, cover, and hidden item opportunities.
  const candidates = [];
  for (let y = 1; y < BOMBER_GRID_HEIGHT - 1; y += 1) {
    for (let x = 1; x < BOMBER_GRID_WIDTH - 1; x += 1) {
      const key = bomberCellKey(x, y);
      const mirrorX = BOMBER_GRID_WIDTH - 1 - x;
      const mirrorY = BOMBER_GRID_HEIGHT - 1 - y;
      const mirrorKey = bomberCellKey(mirrorX, mirrorY);
      if (key > mirrorKey || wallSet.has(key) || wallSet.has(mirrorKey)) continue;
      if (['host', 'guest'].some(role =>
        inSpawnSafeZone(x, y, role) || inGuaranteedEscapeLane(x, y, role)
        || inSpawnSafeZone(mirrorX, mirrorY, role) || inGuaranteedEscapeLane(mirrorX, mirrorY, role)
      )) continue;
      candidates.push({ key, mirrorKey, x, y });
    }
  }

  for (const candidate of candidates) {
    // Each seed selects a distinct macro layout while retaining 180-degree
    // symmetry. The crossroads profile reserves a continuous central cross;
    // the fortress profile concentrates more cover around the arena center.
    if (profile.key === 'crossroads' && (candidate.x === 6 || candidate.y === 5)) continue;
    let density = profile.density;
    if (profile.key === 'fortress' && candidate.x >= 3 && candidate.x <= 9 && candidate.y >= 3 && candidate.y <= 7) density = 0.82;
    const roll = bomberHash(seed, candidate.x, candidate.y, 0x51f15e) / 0xffffffff;
    if (roll >= density) continue;
    const pair = candidate.key === candidate.mirrorKey
      ? [candidate.key]
      : [candidate.key, candidate.mirrorKey];
    const proposedBlocks = new Set([...blockSet, ...pair]);
    if (!preservesPlayableConnectivity(wallSet, proposedBlocks)) continue;
    for (const key of pair) {
      blockSet.add(key);
      blocks.push(key);
    }
    placedPairs.push({ keys: pair, x: candidate.x, y: candidate.y });
  }

  // Keep item opportunities fair and predictable: random distribution is
  // capped, but every valid map receives at least two paired item crates.
  const types = ['bombup', 'fireup', 'speedup', 'shield'];
  const rankedPairs = placedPairs.filter(pair => pair.keys.length === 2).sort((a, b) =>
    bomberHash(seed, a.x, a.y, 0x1a2b3c) - bomberHash(seed, b.x, b.y, 0x1a2b3c)
  );
  const selectedPairs = rankedPairs.filter(pair =>
    bomberHash(seed, pair.x, pair.y, 0x1a2b3c) % 100 < 27
  ).slice(0, BOMBER_MAX_POWERUP_PAIRS);
  for (const pair of rankedPairs) {
    if (selectedPairs.length >= Math.min(BOMBER_MIN_POWERUP_PAIRS, rankedPairs.length)) break;
    if (!selectedPairs.includes(pair)) selectedPairs.push(pair);
  }
  for (const pair of selectedPairs) {
    const type = types[bomberHash(seed, pair.x, pair.y, 0x7f4a7c) % types.length];
    for (const key of pair.keys) hiddenPowerups[key] = type;
  }

  return { width: BOMBER_GRID_WIDTH, height: BOMBER_GRID_HEIGHT, walls, blocks, hiddenPowerups, profile: profile.key, profileLabel: profile.label };
}

export function isBomberWall(arena, x, y) {
  if (x < 0 || y < 0 || x >= arena.width || y >= arena.height) return true;
  return (arena.walls || []).includes(bomberCellKey(x, y));
}

export function isBomberBlock(arena, x, y, destroyedBlocks = {}) {
  const key = bomberCellKey(x, y);
  return (arena.blocks || []).includes(key) && destroyedBlocks[key] !== true;
}

export function canBomberMove({ arena, player, direction, destroyedBlocks = {}, bombs = {}, otherPlayers = {} }) {
  const dx = Number(direction?.dx || 0);
  const dy = Number(direction?.dy || 0);
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
  const x = Number(player?.x || 0) + dx;
  const y = Number(player?.y || 0) + dy;
  if (isBomberWall(arena, x, y) || isBomberBlock(arena, x, y, destroyedBlocks)) return false;
  const targetKey = bomberCellKey(x, y);
  if (Object.values(bombs).some(bomb => bomberCellKey(bomb.x, bomb.y) === targetKey)) return false;
  if (Object.values(otherPlayers).some(other => other?.alive !== false && Number(other.x) === x && Number(other.y) === y)) return false;
  return true;
}

export function getBomberBlastCells({ arena, bomb, destroyedBlocks = {} }) {
  const cells = [bomberCellKey(bomb.x, bomb.y)];
  const hitBlocks = [];
  const range = Math.max(1, Math.min(6, Math.trunc(Number(bomb.range || BOMBER_BASE_FIRE_RANGE))));
  const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
  for (const direction of dirs) {
    for (let step = 1; step <= range; step += 1) {
      const x = Number(bomb.x) + direction.dx * step;
      const y = Number(bomb.y) + direction.dy * step;
      if (isBomberWall(arena, x, y)) break;
      const key = bomberCellKey(x, y);
      cells.push(key);
      if (isBomberBlock(arena, x, y, destroyedBlocks)) {
        hitBlocks.push(key);
        break;
      }
    }
  }
  return { cells: [...new Set(cells)], hitBlocks };
}

export function getBomberWarningPreviews({ arena, bombs = {}, destroyedBlocks = {}, now = Date.now(), warningMs = BOMBER_WARNING_MS }) {
  return Object.values(bombs).flatMap(bomb => {
    const remainingMs = Number(bomb?.explodeAt || 0) - Number(now);
    if (remainingMs <= 0 || remainingMs > warningMs) return [];
    const blast = getBomberBlastCells({ arena, bomb, destroyedBlocks });
    return [{ id: bomb.id, cells: blast.cells, remainingMs, intensity: 1 - remainingMs / warningMs }];
  });
}

export function getActiveBomberExplosionCells(explosions = {}, now = Date.now()) {
  const cells = new Set();
  for (const explosion of Object.values(explosions || {})) {
    if (Number(explosion?.endsAt || 0) <= Number(now)) continue;
    for (const cell of String(explosion?.cells || '').split('|').filter(Boolean)) cells.add(cell);
  }
  return cells;
}

export function createBomberPlayer(role, name = '') {
  const spawn = BOMBER_SPAWNS[role] || BOMBER_SPAWNS.host;
  return {
    x: spawn.x, y: spawn.y, lives: BOMBER_MAX_LIVES, score: 0,
    bombMax: 1, fireRange: BOMBER_BASE_FIRE_RANGE, moveDelay: BOMBER_MOVE_DELAY_MS,
    shield: 0, alive: true, invulnerableUntil: 0, name: String(name || '').slice(0, 24),
    bombsPlaced: 0, blocksDestroyed: 0, hitsTaken: 0, powerupsCollected: 0
  };
}

export function applyBomberPowerup(player, type) {
  const next = { ...player, score: Number(player.score || 0) + 10 };
  if (type === 'bombup') next.bombMax = Math.min(3, Number(next.bombMax || 1) + 1);
  if (type === 'fireup') next.fireRange = Math.min(5, Number(next.fireRange || 2) + 1);
  if (type === 'speedup') next.moveDelay = Math.max(90, Number(next.moveDelay || BOMBER_MOVE_DELAY_MS) - 15);
  if (type === 'shield') next.shield = Math.min(2, Number(next.shield || 0) + 1);
  return next;
}

export function damageBomberPlayer(player, now) {
  const next = { ...player };
  if (next.alive === false || now < Number(next.invulnerableUntil || 0)) return { player: next, damaged: false, shielded: false };
  if (Number(next.shield || 0) > 0) {
    next.shield -= 1;
    next.invulnerableUntil = now + 700;
    return { player: next, damaged: false, shielded: true };
  }
  next.lives = Math.max(0, Number(next.lives || 0) - 1);
  next.alive = next.lives > 0;
  next.invulnerableUntil = now + 1200;
  return { player: next, damaged: true, shielded: false };
}

export function getBomberWinner(players = {}, timedOut = false) {
  const host = players.host || {};
  const guest = players.guest || {};
  const hostAlive = host.alive !== false && Number(host.lives ?? BOMBER_MAX_LIVES) > 0;
  const guestAlive = guest.alive !== false && Number(guest.lives ?? BOMBER_MAX_LIVES) > 0;
  if (!hostAlive && !guestAlive) return { winner: 'draw', reason: 'both-eliminated' };
  if (!hostAlive) return { winner: 'guest', reason: 'elimination' };
  if (!guestAlive) return { winner: 'host', reason: 'elimination' };
  if (!timedOut) return null;
  const hostLives = Number(host.lives || 0);
  const guestLives = Number(guest.lives || 0);
  if (hostLives !== guestLives) return { winner: hostLives > guestLives ? 'host' : 'guest', reason: 'time' };
  const hostScore = Number(host.score || 0);
  const guestScore = Number(guest.score || 0);
  if (hostScore !== guestScore) return { winner: hostScore > guestScore ? 'host' : 'guest', reason: 'time' };
  return { winner: 'draw', reason: 'time' };
}

export function formatBomberTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
