import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCADE_STAGES, ARCADE_STAGE_DURATION_MS, ARCADE_AVATARS,
  arcadeHash, createArcadeEntities, createArcadePlayer, getArcadeLane,
  getArcadeEntityPosition, stepArcadePlayer, getArcadeRemaining, getArcadeWinner
} from '../js/games/arcade-logic.js';

test('Arcade hanya memiliki satu permainan Flappy Face selama 60 detik', () => {
  assert.equal(ARCADE_STAGES.length, 1);
  assert.equal(ARCADE_STAGES[0].id, 'flappy-face');
  assert.equal(ARCADE_STAGES[0].type, 'flappy');
  assert.equal(ARCADE_STAGE_DURATION_MS, 60000);
  assert.match(ARCADE_STAGES[0].hint, /Ketuk arena atau tombol LOMPAT/);
});

test('Arcade menyediakan dua belas avatar cadangan yang aman', () => {
  assert.equal(ARCADE_AVATARS.length, 12);
  assert.equal(new Set(ARCADE_AVATARS.map(item => item.id)).size, 12);
  assert.ok(ARCADE_AVATARS.every(item => item.emoji && item.name));
});

test('gerbang pipa dibuat deterministik, berpasangan, dan berada pada setengah arena masing-masing', () => {
  const hostA = createArcadeEntities(12345, 0, 'host');
  const hostB = createArcadeEntities(12345, 0, 'host');
  const guest = createArcadeEntities(12345, 0, 'guest');
  assert.deepEqual(hostA, hostB);
  assert.equal(hostA.length, 22);
  assert.equal(guest.length, 22);
  assert.ok(hostA.every(entity => entity.kind === 'gate' && entity.gapSize >= 0.29));
  assert.ok(guest.every(entity => entity.kind === 'gate'));
  for (let index = 0; index < hostA.length; index += 1) {
    assert.equal(hostA[index].gapY, guest[index].gapY, 'pasangan pipa harus punya celah vertikal yang sama');
    assert.ok(hostA[index].startX > 0.5);
    assert.ok(guest[index].startX < 0.5);
  }
});

test('hash arena stabil dan berubah jika seed atau nomor pipa berbeda', () => {
  assert.equal(arcadeHash(9, 0, 4), arcadeHash(9, 0, 4));
  assert.notEqual(arcadeHash(9, 0, 4), arcadeHash(10, 0, 4));
  assert.notEqual(arcadeHash(9, 0, 4), arcadeHash(9, 0, 5));
});

test('kedua pemain mulai di sisi arena yang berlawanan dengan posisi tetap', () => {
  const host = createArcadePlayer('host');
  const guest = createArcadePlayer('guest');
  assert.equal(host.x, 0.24);
  assert.equal(guest.x, 0.76);
  assert.equal(host.y, 0.5);
  assert.equal(guest.y, 0.5);
  assert.equal(host.lives, 3);
  assert.equal(guest.lives, 3);
  assert.ok(getArcadeLane('host').direction < 0);
  assert.ok(getArcadeLane('guest').direction > 0);
});

test('tap atau tombol lompat memberi flap ke atas, gravitasi menarik karakter ke bawah', () => {
  const player = createArcadePlayer('host');
  const hopped = stepArcadePlayer({ player, role: 'host', input: { jumpPressed: true }, dt: 1 / 60, now: 1000 }).player;
  assert.ok(hopped.y < player.y);
  const falling = stepArcadePlayer({ player: hopped, role: 'host', input: {}, dt: 0.6, now: 1600 }).player;
  assert.ok(falling.y > hopped.y);
});

test('posisi pipa bergerak melintasi jalur dan berhenti di luar arena setelah masa aktif', () => {
  const entity = createArcadeEntities(99, 0, 'host')[0];
  assert.equal(getArcadeEntityPosition(entity, entity.spawnAt - 1), null);
  const first = getArcadeEntityPosition(entity, entity.spawnAt + 500);
  const later = getArcadeEntityPosition(entity, entity.spawnAt + 1500);
  assert.ok(first && later);
  assert.ok(later.x < first.x);
  assert.equal(later.gapY, entity.gapY);
  assert.equal(getArcadeEntityPosition(entity, entity.spawnAt + entity.lifeMs + 1), null);
});

test('berhasil melewati celah pipa menambah skor sepuluh poin satu kali', () => {
  const player = createArcadePlayer('host');
  const gate = {
    id: 'safe-gate', kind: 'gate', startX: 0.24, direction: -1, distance: 0.1,
    gapY: 0.5, gapSize: 0.6, spawnAt: 0, lifeMs: 1000, value: 10
  };
  const crossed = stepArcadePlayer({ player, role: 'host', entities: [gate], elapsedMs: 900, dt: 0, now: 1000 });
  assert.equal(crossed.player.score, 10);
  assert.equal(crossed.player.gatesPassed, 1);
  const again = stepArcadePlayer({ player: crossed.player, role: 'host', entities: [gate], elapsedMs: 950, dt: 0, now: 1050 });
  assert.equal(again.player.score, 10);
  assert.equal(again.player.gatesPassed, 1);
});

test('menabrak pipa di luar celah mengurangi satu nyawa dan memberi invulnerability singkat', () => {
  const player = createArcadePlayer('host', { y: 0.2 });
  const gate = {
    id: 'hit-gate', kind: 'gate', startX: 0.24, direction: -1, distance: 0.01,
    gapY: 0.5, gapSize: 0.2, spawnAt: 0, lifeMs: 1000, value: 10
  };
  const hit = stepArcadePlayer({ player, role: 'host', entities: [gate], elapsedMs: 10, dt: 0, now: 1000 });
  assert.equal(hit.player.lives, 2);
  assert.ok(hit.player.invulnerableUntil > 1000);
  const protectedHit = stepArcadePlayer({ player: hit.player, role: 'host', entities: [{ ...gate, id: 'second-hit' }], elapsedMs: 20, dt: 0, now: 1200 });
  assert.equal(protectedHit.player.lives, 2);
});

test('menyentuh batas atas atau lantai mengurangi nyawa, tanpa menurunkan nyawa di bawah nol', () => {
  const player = createArcadePlayer('guest', { y: 0.99 });
  const hit = stepArcadePlayer({ player, role: 'guest', dt: 0, now: 1000 });
  assert.equal(hit.player.lives, 2);
  assert.equal(hit.player.y, 0.5);
  const dead = stepArcadePlayer({ player: createArcadePlayer('guest', { lives: 0 }), role: 'guest', input: { jumpPressed: true }, dt: 1, now: 3000 });
  assert.equal(dead.player.lives, 0);
});

test('timer 60 detik dibatasi dan rekap memilih pemenang berdasarkan jumlah gerbang', () => {
  assert.equal(getArcadeRemaining(1000, 60000, 500), 60000);
  assert.equal(getArcadeRemaining(1000, 60000, 1000), 60000);
  assert.equal(getArcadeRemaining(1000, 60000, 61500), 0);
  assert.deepEqual(getArcadeWinner({ host: { score: 90, gatesPassed: 9 }, guest: { score: 80, gatesPassed: 8 } }), {
    hostScore: 90, guestScore: 80, hostGates: 9, guestGates: 8, winner: 'host'
  });
  assert.equal(getArcadeWinner({ host: { score: 50 }, guest: { score: 50 } }).winner, 'draw');
});
