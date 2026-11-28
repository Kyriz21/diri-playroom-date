import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BOMBER_GRID_WIDTH, BOMBER_GRID_HEIGHT, BOMBER_DURATION_MS, BOMBER_SPAWNS,
  BOMBER_POWERUPS, BOMBER_WARNING_MS, BOMBER_SPAWN_PROTECTION_MS, BOMBER_MIN_POWERUP_PAIRS, BOMBER_MAX_POWERUP_PAIRS,
  BOMBER_ARENA_PROFILES, getBomberArenaProfile, createBomberArena, bomberCellKey, isBomberWall,
  isBomberBlock, canBomberMove, getBomberBlastCells, createBomberPlayer,
  applyBomberPowerup, damageBomberPlayer, getBomberWinner, formatBomberTime,
  getBomberWarningPreviews, getActiveBomberExplosionCells, getBomberReachableCells
} from '../js/games/bomber-arena-logic.js';

test('Bomber Arena memakai grid 13x11 dan arena acak yang tetap deterministik untuk satu seed', () => {
  assert.equal(BOMBER_GRID_WIDTH, 13);
  assert.equal(BOMBER_GRID_HEIGHT, 11);
  assert.equal(BOMBER_DURATION_MS, 180000);
  const a = createBomberArena(12345);
  const b = createBomberArena(12345);
  assert.deepEqual(a, b);
  assert.ok(a.walls.includes('0_0'));
  assert.ok(a.walls.includes('2_2'));
  assert.ok(a.blocks.length >= 14);
  assert.ok(a.blocks.length <= 30);
  for (const role of ['host', 'guest']) {
    const spawn = BOMBER_SPAWNS[role];
    const key = bomberCellKey(spawn.x, spawn.y);
    assert.equal(a.walls.includes(key), false);
    assert.equal(a.blocks.includes(key), false);
  }
});

test('variasi arena deterministik menyediakan tiga layout dengan tingkat keterbukaan berbeda', () => {
  const profileCounts = { open: 0, crossroads: 0, fortress: 0 };
  for (let seed = 1; seed <= 900; seed += 1) {
    const profile = getBomberArenaProfile(seed);
    const arena = createBomberArena(seed);
    assert.ok(BOMBER_ARENA_PROFILES[profile.key]);
    assert.equal(arena.profile, profile.key);
    assert.equal(arena.profileLabel, profile.label);
    profileCounts[profile.key] += 1;
    if (profile.key === 'crossroads') {
      for (const key of arena.blocks) {
        const [x, y] = key.split('_').map(Number);
        assert.notEqual(x, 6, `seed ${seed}: kolom tengah harus terbuka`);
        assert.notEqual(y, 5, `seed ${seed}: baris tengah harus terbuka`);
      }
    }
  }
  for (const count of Object.values(profileCounts)) assert.ok(count >= 200);
  assert.ok(createBomberArena(123).blocks.length >= 9);
  assert.ok(createBomberArena(123).blocks.length <= 30);
});

test('setiap layout memberi minimal dua dan maksimal empat pasangan peti power-up yang simetris', () => {
  for (let seed = 1; seed <= 1000; seed += 1) {
    const arena = createBomberArena(seed);
    const blockSet = new Set(arena.blocks);
    const pairs = new Set();
    for (const [key, type] of Object.entries(arena.hiddenPowerups)) {
      assert.ok(blockSet.has(key), `seed ${seed}: power-up ${key} tidak berada di peti`);
      const [x, y] = key.split('_').map(Number);
      const mirror = bomberCellKey(BOMBER_GRID_WIDTH - 1 - x, BOMBER_GRID_HEIGHT - 1 - y);
      assert.equal(arena.hiddenPowerups[mirror], type, `seed ${seed}: pasangan item berbeda`);
      pairs.add(key < mirror ? key : mirror);
    }
    assert.ok(pairs.size >= BOMBER_MIN_POWERUP_PAIRS, `seed ${seed}: power-up kurang dari batas minimum`);
    assert.ok(pairs.size <= BOMBER_MAX_POWERUP_PAIRS, `seed ${seed}: power-up melebihi batas maksimum`);
  }
});

test('arena dan peluang power-up simetris untuk kedua pemain', () => {
  for (let seed = 1; seed <= 250; seed += 1) {
    const arena = createBomberArena(seed);
    const blocks = new Set(arena.blocks);
    for (const key of arena.blocks) {
      const [x, y] = key.split('_').map(Number);
      const mirror = bomberCellKey(BOMBER_GRID_WIDTH - 1 - x, BOMBER_GRID_HEIGHT - 1 - y);
      assert.ok(blocks.has(mirror), `seed ${seed}: peti ${key} tidak punya pasangan simetris`);
      const adjacentFloor = [
        bomberCellKey(x + 1, y), bomberCellKey(x - 1, y),
        bomberCellKey(x, y + 1), bomberCellKey(x, y - 1)
      ].some(cell => !arena.walls.includes(cell) && !blocks.has(cell));
      assert.ok(adjacentFloor, `seed ${seed}: peti ${key} tidak dapat dijangkau untuk dihancurkan`);
    }
    for (const [key, type] of Object.entries(arena.hiddenPowerups)) {
      assert.ok(blocks.has(key), `seed ${seed}: power-up ${key} tidak berada di dalam peti`);
      const [x, y] = key.split('_').map(Number);
      const mirror = bomberCellKey(BOMBER_GRID_WIDTH - 1 - x, BOMBER_GRID_HEIGHT - 1 - y);
      assert.equal(arena.hiddenPowerups[mirror], type, `seed ${seed}: item ${key} berbeda dari pasangan simetrisnya`);
    }
  }
});

test('Dinding dan peti menghalangi gerak, sedangkan tile terbuka dapat dilewati', () => {
  const arena = { width: 7, height: 7, walls: ['0_0', '1_0', '2_0', '3_0', '4_0', '5_0', '6_0', '0_1', '6_1', '0_2', '6_2', '0_3', '6_3', '0_4', '6_4', '0_5', '6_5', '0_6', '1_6', '2_6', '3_6', '4_6', '5_6', '6_6', '3_2'], blocks: ['2_3'] };
  const player = { x: 1, y: 3 };
  assert.equal(canBomberMove({ arena, player, direction: { dx: 1, dy: 0 } }), false);
  assert.equal(canBomberMove({ arena, player, direction: { dx: 0, dy: -1 } }), true);
  assert.equal(canBomberMove({ arena, player, direction: { dx: -1, dy: 0 } }), false);
  assert.equal(canBomberMove({ arena, player, direction: { dx: 1, dy: 1 } }), false);
  assert.equal(canBomberMove({ arena, player, direction: { dx: 1, dy: 0 }, destroyedBlocks: { '2_3': true } }), true);
  assert.equal(canBomberMove({ arena, player, direction: { dx: 0, dy: 1 }, bombs: { b1: { x: 1, y: 4 } } }), false);
  assert.equal(canBomberMove({ arena, player: { x: 2, y: 3 }, direction: { dx: 1, dy: 0 }, otherPlayers: { guest: { x: 3, y: 3, alive: true } } }), false);
});

test('Ledakan menyebar silang, berhenti pada dinding dan menghancurkan peti tanpa menembusnya', () => {
  const arena = {
    width: 7, height: 7,
    walls: ['0_0','1_0','2_0','3_0','4_0','5_0','6_0','0_1','6_1','0_2','6_2','0_3','4_3','6_3','0_4','6_4','0_5','6_5','0_6','1_6','2_6','3_6','4_6','5_6','6_6'],
    blocks: ['2_3', '3_2']
  };
  const blast = getBomberBlastCells({ arena, bomb: { x: 3, y: 3, range: 4 } });
  assert.ok(blast.cells.includes('3_3'));
  assert.ok(blast.cells.includes('2_3'));
  assert.ok(!blast.cells.includes('1_3'));
  assert.ok(!blast.cells.includes('5_3'));
  assert.ok(blast.cells.includes('3_2'));
  assert.deepEqual(new Set(blast.hitBlocks), new Set(['2_3', '3_2']));
});

test('Power-up menaikkan kemampuan sesuai batas dan menambah skor', () => {
  const base = createBomberPlayer('host', 'Mia');
  const bomb = applyBomberPowerup(base, 'bombup');
  const fire = applyBomberPowerup(base, 'fireup');
  const speed = applyBomberPowerup(base, 'speedup');
  const shield = applyBomberPowerup(base, 'shield');
  assert.equal(bomb.bombMax, 2);
  assert.equal(fire.fireRange, 3);
  assert.equal(speed.moveDelay, 140);
  assert.equal(shield.shield, 1);
  for (let i = 0; i < 6; i += 1) {
    base.bombMax = applyBomberPowerup(base, 'bombup').bombMax;
    base.fireRange = applyBomberPowerup(base, 'fireup').fireRange;
    base.moveDelay = applyBomberPowerup(base, 'speedup').moveDelay;
    base.shield = applyBomberPowerup(base, 'shield').shield;
  }
  assert.equal(base.bombMax, 3);
  assert.equal(base.fireRange, 5);
  assert.equal(base.moveDelay, 90);
  assert.equal(base.shield, 2);
  assert.equal(BOMBER_POWERUPS.shield.label, 'Shield');
});

test('Damage mengurangi nyawa; shield menyerap satu serangan', () => {
  const player = createBomberPlayer('guest');
  const first = damageBomberPlayer(player, 1000);
  assert.equal(first.damaged, true);
  assert.equal(first.player.lives, 2);
  assert.equal(first.player.alive, true);
  const shieldedPlayer = { ...player, shield: 1 };
  const protectedHit = damageBomberPlayer(shieldedPlayer, 1000);
  assert.equal(protectedHit.shielded, true);
  assert.equal(protectedHit.player.shield, 0);
  assert.equal(protectedHit.player.lives, 3);
  const invulnerable = damageBomberPlayer(first.player, 1500);
  assert.equal(invulnerable.damaged, false);
  assert.equal(invulnerable.player.lives, 2);
  const eliminated = damageBomberPlayer({ ...first.player, invulnerableUntil: 0, lives: 1 }, 3000);
  assert.equal(eliminated.player.lives, 0);
  assert.equal(eliminated.player.alive, false);
});

test('Pemenang ditentukan dari eliminasi atau sisa nyawa lalu skor saat waktu habis', () => {
  assert.deepEqual(getBomberWinner({ host: { lives: 2, alive: true }, guest: { lives: 0, alive: false } }), { winner: 'host', reason: 'elimination' });
  assert.deepEqual(getBomberWinner({ host: { lives: 0, alive: false }, guest: { lives: 0, alive: false } }), { winner: 'draw', reason: 'both-eliminated' });
  assert.deepEqual(getBomberWinner({ host: { lives: 2, score: 10 }, guest: { lives: 1, score: 90 } }, true), { winner: 'host', reason: 'time' });
  assert.deepEqual(getBomberWinner({ host: { lives: 1, score: 20 }, guest: { lives: 1, score: 10 } }, true), { winner: 'host', reason: 'time' });
  assert.deepEqual(getBomberWinner({ host: { lives: 1, score: 20 }, guest: { lives: 1, score: 20 } }, true), { winner: 'draw', reason: 'time' });
  assert.equal(getBomberWinner({ host: { lives: 2 }, guest: { lives: 2 } }, false), null);
});

test('Format timer Bomber Arena menjadi menit dan detik', () => {
  assert.equal(formatBomberTime(180000), '3:00');
  assert.equal(formatBomberTime(59999), '1:00');
  assert.equal(formatBomberTime(0), '0:00');
});

test('Bomber Arena terintegrasi dengan katalog, landing page, room lobby, dan loader', () => {
  const constants = fs.readFileSync(new URL('../js/constants.js', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const roomService = fs.readFileSync(new URL('../js/services/room-service.js', import.meta.url), 'utf8');
  assert.match(constants, /id: 'bomberarena',[\s\S]{0,260}state: 'active'/);
  assert.match(app, /EXPLICIT_LOBBY_GAMES = new Set\([^\]]*'bomberarena'/);
  assert.match(roomService, /EXPLICIT_LOBBY_GAMES = new Set\([^\]]*'bomberarena'/);
  assert.match(app, /data-action="open-bomber-create"/);
  assert.match(app, /data-action="open-bomber-join"/);
  assert.match(app, /import\('\.\/games\/bomber-arena\.js\?v=0\.50\.0'\)/);
  const game = fs.readFileSync(new URL('../js/games/bomber-arena.js', import.meta.url), 'utf8');
  assert.match(game, /bomber-arena-logic\.js\?v=0\.50\.0/);
});

test('Firebase Rules mengunci input pada pemain sendiri dan simulasi pada host', () => {
  const rules = JSON.parse(fs.readFileSync(new URL('../firebase-database.rules.json', import.meta.url), 'utf8')).rules;
  const roomRules = rules.rooms.$roomCode;
  const gameRules = rules.roomGames.$roomCode.$sessionId.bomberArena;
  assert.match(roomRules.lobby.selections.$role['.validate'], /bomberarena/);
  assert.match(roomRules.lobby.ready.$role['.write'], /bomberarena/);
  assert.match(roomRules.lobby.activeSession['.write'], /bomberarena/);
  assert.match(roomRules.lobby.activeSession['.validate'], /bomberarena/);
  assert.match(gameRules['.read'], /bomberarena/);
  assert.match(gameRules.meta['.write'], /presence.*host.*connected/);
  assert.match(gameRules.meta['.write'], /players.*guest.*state.*lives/);
  assert.match(gameRules.players.$role.input['.write'], /\$role/);
  assert.match(gameRules.players.$role.state['.write'], /host.*uid.*auth.uid/);
  assert.match(gameRules.bombs.$bombId['.write'], /host.*uid.*auth.uid/);
  assert.match(gameRules.destroyedBlocks.$cellKey['.write'], /host.*uid.*auth.uid/);
  assert.match(gameRules.powerups.$cellKey['.validate'], /bombup\|fireup\|speedup\|shield/);
});

test('1.000 seed arena menjaga dua jalur keluar dan seluruh lantai tetap saling terhubung', () => {
  for (let seed = 1; seed <= 1000; seed += 1) {
    const arena = createBomberArena(seed);
    const openFloorCount = (BOMBER_GRID_WIDTH - 2) * (BOMBER_GRID_HEIGHT - 2)
      - arena.walls.filter(key => { const [x, y] = key.split('_').map(Number); return x > 0 && y > 0 && x < BOMBER_GRID_WIDTH - 1 && y < BOMBER_GRID_HEIGHT - 1; }).length
      - arena.blocks.length;
    for (const role of ['host', 'guest']) {
      const reachable = getBomberReachableCells(arena, BOMBER_SPAWNS[role]);
      assert.equal(reachable.size, openFloorCount, `seed ${seed}, ${role}: ada lantai yang terisolasi`);
      const spawn = BOMBER_SPAWNS[role];
      const player = createBomberPlayer(role);
      const otherRole = role === 'host' ? 'guest' : 'host';
      const options = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
      ].filter(direction => canBomberMove({
        arena,
        player: { ...player, x: spawn.x, y: spawn.y },
        direction,
        otherPlayers: { [otherRole]: { alive: true, ...BOMBER_SPAWNS[otherRole] } }
      }));
      assert.ok(options.length >= 2, `seed ${seed}, ${role}: hanya ${options.length} jalan keluar`);
    }
  }
});

test('host menunggu countdown, snapshot peti hancur dipakai oleh guest, dan hasil host punya fallback state', () => {
  const game = fs.readFileSync(new URL('../js/games/bomber-arena.js', import.meta.url), 'utf8');
  assert.match(game, /if \(nowAt < Number\(data\.meta\?\.startedAt \|\| 0\)\) return/);
  assert.match(game, /const visibleDestroyed = role === 'host' \? simDestroyed : \(data\.destroyedBlocks \|\| \{\}\)/);
  assert.match(game, /simPlayers\.host \|\| data\.players\?\.host\?\.state/);
  assert.match(game, /simPlayers\.guest \|\| data\.players\?\.guest\?\.state/);
});

test('setup Bomber Arena dapat dilanjutkan host bila proses setup sebelumnya terputus', () => {
  const game = fs.readFileSync(new URL('../js/games/bomber-arena.js', import.meta.url), 'utf8');
  assert.match(game, /if \(currentMeta\.phase !== 'setup'\) return/);
  assert.match(game, /snapshots\[0\]\.exists\(\) \? \(snapshots\[0\]\.val\(\) \|\| \{\}\) : createBomberPlayer/);
  assert.match(game, /snapshots\[1\]\.exists\(\) \? \(snapshots\[1\]\.val\(\) \|\| \{\}\) : createBomberPlayer/);
  assert.match(game, /if \(!snapshots\[2\]\.exists\(\)\)/);
  assert.match(game, /set\(ref\(db, paths\[0\]\), hostState\)/);
  assert.match(game, /set\(ref\(db, paths\[1\]\), guestState\)/);
  assert.match(game, /data\.meta\.phase === 'setup'/);
  assert.match(game, /isOnline\('host'\) && isOnline\('guest'\).*initializeGame/);
});

test('semua Firebase Rules, termasuk privateRooms dan Bomber Arena, memiliki tanda kurung seimbang', () => {
  const rules = JSON.parse(fs.readFileSync(new URL('../firebase-database.rules.json', import.meta.url), 'utf8')).rules;
  const arena = rules.roomGames.$roomCode.$sessionId.bomberArena;
  const expressions = [];
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (['.read', '.write', '.validate'].includes(key) && typeof value === 'string') expressions.push(value);
      else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(rules);
  for (const expression of expressions) {
    let depth = 0;
    for (const char of expression) {
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      assert.ok(depth >= 0, `kurung tutup berlebih pada: ${expression.slice(0, 80)}`);
    }
    assert.equal(depth, 0, `kurung buka tidak tertutup pada: ${expression.slice(0, 80)}`);
  }
  assert.match(rules.privateRooms.$roomCode.$gameId.$sessionId.$uid['.read'], /lovematch.*colormatch.*iqduel/);
  assert.match(arena['.read'], /activeSession.*bomberarena/);
  assert.match(arena.meta['.write'], /presence.*guest.*connected/);
  assert.match(arena.players.$role.input['.write'], /auth.uid/);
  assert.match(arena.players.$role.state['.write'], /host.*auth.uid/);
});


test('perintah gerak memakai waktu penerimaan host agar jam perangkat yang berbeda tidak menyebabkan input macet', () => {
  const game = fs.readFileSync(new URL('../js/games/bomber-arena.js', import.meta.url), 'utf8');
  assert.match(game, /const receivedAt = changed \|\| !previous\.receivedAt \? now\(\) : previous\.receivedAt/);
  assert.match(game, /nowAt - Number\(input\.receivedAt \|\| 0\) <= 650/);
  assert.doesNotMatch(game, /nowAt - Number\(input\.updatedAt \|\| 0\) <= 650/);
});


test('Bomber bomb telegraph menampilkan jalur silang hanya menjelang ledakan', () => {
  const arena = { width: 7, height: 7, walls: ['0_0','1_0','2_0','3_0','4_0','5_0','6_0','0_1','6_1','0_2','6_2','0_3','6_3','0_4','6_4','0_5','6_5','0_6','1_6','2_6','3_6','4_6','5_6','6_6'], blocks: ['4_3'] };
  const bombs = { b1: { id: 'b1', x: 3, y: 3, range: 3, placedAt: 1000, explodeAt: 1800 } };
  const preview = getBomberWarningPreviews({ arena, bombs, now: 1200 });
  assert.equal(preview.length, 1);
  assert.equal(preview[0].id, 'b1');
  assert.ok(preview[0].cells.includes('3_3'));
  assert.ok(preview[0].cells.includes('4_3'));
  assert.ok(!preview[0].cells.includes('5_3'));
  assert.equal(getBomberWarningPreviews({ arena, bombs, now: 900 }).length, 0);
  assert.equal(getBomberWarningPreviews({ arena, bombs, now: 1800 }).length, 0);
  assert.equal(BOMBER_WARNING_MS, 850);
});

test('api sel ledakan aktif tetap berbahaya bagi pemain yang baru masuk ke kobaran', () => {
  const explosions = {
    active: { cells: '2_2|2_3|2_4', endsAt: 2000 },
    expired: { cells: '5_5|5_6', endsAt: 900 }
  };
  const cells = getActiveBomberExplosionCells(explosions, 1200);
  assert.deepEqual([...cells].sort(), ['2_2', '2_3', '2_4']);
  assert.equal(cells.has('5_5'), false);
  assert.equal(getActiveBomberExplosionCells(explosions, 2200).size, 0);
});

test('perlindungan awal berlangsung setelah countdown dan lebih pendek daripada fuse bom', () => {
  assert.equal(BOMBER_SPAWN_PROTECTION_MS, 1600);
  assert.ok(BOMBER_SPAWN_PROTECTION_MS < 2200);
  const player = createBomberPlayer('host');
  assert.equal(player.invulnerableUntil, 0);
  const protectedHit = damageBomberPlayer({ ...player, invulnerableUntil: 2600 }, 2000);
  assert.equal(protectedHit.damaged, false);
  assert.equal(protectedHit.player.lives, 3);
  const afterProtection = damageBomberPlayer({ ...player, invulnerableUntil: 2600 }, 2601);
  assert.equal(afterProtection.damaged, true);
  assert.equal(afterProtection.player.lives, 2);
});

test('state pemain memiliki statistik duel untuk kartu rekap', () => {
  const player = createBomberPlayer('host', 'Mia');
  assert.equal(player.bombsPlaced, 0);
  assert.equal(player.blocksDestroyed, 0);
  assert.equal(player.hitsTaken, 0);
  assert.equal(player.powerupsCollected, 0);
});

test('Bomber Arena memberi telegraph bahaya, kontrol D-pad 3x3, statistik hasil, dan mencegah keluar saat duel', () => {
  const game = fs.readFileSync(new URL('../js/games/bomber-arena.js', import.meta.url), 'utf8');
  const styles = fs.readFileSync(new URL('../css/bomber-arena.css', import.meta.url), 'utf8');
  assert.match(game, /getBomberWarningPreviews/);
  assert.match(game, /drawBlastWarning/);
  assert.match(game, /getActiveBomberExplosionCells/);
  assert.match(game, /applyActiveExplosionDamage\(nowAt, stateDirty\)/);
  assert.match(game, /bombsPlaced/);
  assert.match(game, /blocksDestroyed/);
  assert.match(game, /powerupsCollected/);
  assert.match(game, /hitsTaken/);
  assert.match(game, /bomber-dpad-center/);
  assert.match(game, /invulnerableUntil: startedAt \+ BOMBER_SPAWN_PROTECTION_MS/);
  assert.match(game, /button\.disabled = !matchStarted/);
  assert.match(game, /Tunggu hitung mundur selesai sebelum memasang bom/);
  assert.match(game, /window\.addEventListener\('blur', onWindowBlur\)/);
  assert.match(game, /data\.meta\?\.phase === 'playing'[\s\S]{0,150}Pertandingan sedang berlangsung/);
  assert.match(styles, /grid-template-rows:repeat\(3,39px\)/);
  assert.match(styles, /bomber-powerup-legend/);
  assert.match(styles, /bomber-result-stats/);
});

test('cache Bomber Arena dan versi proyek diperbarui untuk build polish', () => {
  const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.version, '0.50.0');
  assert.match(index, /bomber-arena\.css\?v=0\.50\.0/);
  assert.match(index, /app\.js\?v=0\.50\.0/);
  assert.match(app, /bomber-arena\.js\?v=0\.50\.0/);
});
