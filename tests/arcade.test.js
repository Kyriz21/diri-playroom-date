import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCADE_STAGES, ARCADE_STAGE_DURATION_MS, ARCADE_AVATARS,
  arcadeHash, createArcadeEntities, createArcadePlayer, getArcadeLane,
  getArcadeEntityPosition, arcadeBeatAt, stepArcadePlayer, getArcadeRemaining, getArcadeWinner
} from '../js/games/arcade-logic.js';

test('Arcade campaign exposes twelve uniquely named mini-games', () => {
  assert.equal(ARCADE_STAGES.length, 12);
  assert.equal(new Set(ARCADE_STAGES.map(stage => stage.id)).size, 12);
  assert.equal(new Set(ARCADE_STAGES.map(stage => stage.name)).size, 12);
  assert.equal(ARCADE_STAGE_DURATION_MS, 12000);
  assert.ok(ARCADE_STAGES.every(stage => stage.name && stage.hint && stage.type));
});

test('Arcade character catalog provides twelve safe fallback characters', () => {
  assert.equal(ARCADE_AVATARS.length, 12);
  assert.equal(new Set(ARCADE_AVATARS.map(item => item.id)).size, 12);
  assert.ok(ARCADE_AVATARS.every(item => item.emoji && item.name));
});

test('seeded arcade entities are deterministic and remain in their player half', () => {
  for (let index = 0; index < ARCADE_STAGES.length; index += 1) {
    const hostA = createArcadeEntities(12345, index, 'host');
    const hostB = createArcadeEntities(12345, index, 'host');
    const guest = createArcadeEntities(12345, index, 'guest');
    assert.deepEqual(hostA, hostB);
    if (ARCADE_STAGES[index].type === 'rhythm') {
      assert.deepEqual(hostA, []);
      continue;
    }
    assert.ok(hostA.length > 0);
    assert.ok(hostA.every(entity => entity.x >= 0.05 && entity.x <= 0.46));
    assert.ok(guest.every(entity => entity.x >= 0.54 && entity.x <= 0.95));
  }
});

test('arcade hash is stable and changes across stages and objects', () => {
  assert.equal(arcadeHash(9, 2, 4), arcadeHash(9, 2, 4));
  assert.notEqual(arcadeHash(9, 2, 4), arcadeHash(9, 3, 4));
  assert.notEqual(arcadeHash(9, 2, 4), arcadeHash(9, 2, 5));
});

test('host and guest start in opposite halves and movement is clamped to lane', () => {
  const host = createArcadePlayer('host');
  const guest = createArcadePlayer('guest');
  assert.equal(host.x, 0.24);
  assert.equal(guest.x, 0.76);
  assert.ok(host.x < 0.5 && guest.x > 0.5);
  const hostLane = getArcadeLane('host');
  const stage = ARCADE_STAGES[1];
  const moved = stepArcadePlayer({ player: host, role: 'host', stage, input: { left: true }, dt: 1, now: 1000 }).player;
  assert.ok(moved.x >= hostLane.min + 0.025);
  assert.ok(moved.x <= hostLane.max - 0.025);
});

test('jump and rocket controls change vertical position in their respective games', () => {
  const player = createArcadePlayer('host');
  const hopped = stepArcadePlayer({ player, role: 'host', stage: ARCADE_STAGES[0], input: { jumpPressed: true }, dt: 1 / 60, now: 1000 }).player;
  assert.ok(hopped.y < player.y);
  const rocket = stepArcadePlayer({ player, role: 'host', stage: ARCADE_STAGES[8], input: { jump: true }, dt: 0.2, now: 1000 }).player;
  assert.ok(rocket.y < player.y);
});

test('moving arcade objects have predictable active positions', () => {
  const entity = { id: 'test', kind: 'heart', x: 0.2, baseY: 0.3, spawnAt: 500, lifeMs: 2000, phase: 0, value: 10 };
  assert.equal(getArcadeEntityPosition(entity, 200, ARCADE_STAGES[1]), null);
  const first = getArcadeEntityPosition(entity, 700, ARCADE_STAGES[1]);
  const later = getArcadeEntityPosition(entity, 1200, ARCADE_STAGES[1]);
  assert.ok(first && later);
  assert.ok(later.y > first.y);
  assert.equal(getArcadeEntityPosition(entity, 2600, ARCADE_STAGES[1]), null);
});

test('catch games collect bonuses and hazards consume one life with temporary invulnerability', () => {
  const stage = ARCADE_STAGES[1];
  const player = createArcadePlayer('host');
  const heart = { id: 'heart-1', kind: 'heart', x: player.x, baseY: player.y, spawnAt: 0, lifeMs: 1000, phase: 0, value: 10 };
  const collected = stepArcadePlayer({ player, role: 'host', stage, entities: [heart], elapsedMs: 820, dt: 0, now: 1000 });
  assert.equal(collected.player.score, 10);
  assert.equal(collected.player.stageScore, 10);
  assert.ok(collected.player.consumed.includes('heart-1'));

  const bomb = { ...heart, id: 'bomb-1', kind: 'bomb', value: 0 };
  const hit = stepArcadePlayer({ player, role: 'host', stage, entities: [bomb], elapsedMs: 820, dt: 0, now: 1000 });
  assert.equal(hit.player.lives, 2);
  const protectedHit = stepArcadePlayer({ player: hit.player, role: 'host', stage, entities: [{ ...bomb, id: 'bomb-2', spawnAt: 80 }], elapsedMs: 900, dt: 0, now: 1200 });
  assert.equal(protectedHit.player.lives, 2);
});

test('Bubble Pop requires an action press instead of automatic contact', () => {
  const stage = ARCADE_STAGES[5];
  const player = createArcadePlayer('host', { x: 0.2, y: 0.4 });
  const bubble = { id: 'bubble-1', kind: 'bubble', x: 0.2, baseY: 0.4, spawnAt: 0, lifeMs: 3000, phase: 0, value: 12 };
  const waiting = stepArcadePlayer({ player, role: 'host', stage, entities: [bubble], elapsedMs: 820, dt: 0, now: 1000 });
  assert.equal(waiting.player.score, 0);
  const popped = stepArcadePlayer({ player, role: 'host', stage, entities: [bubble], input: { actionPressed: true }, elapsedMs: 820, dt: 0, now: 1000 });
  assert.equal(popped.player.score, 12);
});

test('Bubble Pop supports vertical navigation with up and down controls', () => {
  const stage = ARCADE_STAGES[5];
  const player = createArcadePlayer('host', { y: 0.5 });
  const raised = stepArcadePlayer({ player, role: 'host', stage, input: { up: true }, dt: 0.2, now: 1000 }).player;
  assert.ok(raised.y < player.y);
  const lowered = stepArcadePlayer({ player: raised, role: 'host', stage, input: { down: true }, dt: 0.2, now: 1200 }).player;
  assert.ok(lowered.y > raised.y);
});

test('Rhythm Tap awards perfect and good timing only once per beat', () => {
  const stage = ARCADE_STAGES[10];
  const player = createArcadePlayer('host');
  assert.equal(arcadeBeatAt(650).delta, 0);
  const perfect = stepArcadePlayer({ player, role: 'host', stage, input: { actionPressed: true }, elapsedMs: 650, dt: 0, now: 1000 });
  assert.equal(perfect.player.score, 15);
  const repeated = stepArcadePlayer({ player: perfect.player, role: 'host', stage, input: { actionPressed: true }, elapsedMs: 660, dt: 0, now: 1010 });
  assert.equal(repeated.player.score, 15);
  const good = stepArcadePlayer({ player, role: 'host', stage, input: { actionPressed: true }, elapsedMs: 900, dt: 0, now: 1300 });
  assert.equal(good.player.score, 7);
});

test('Arcade stage timer clamps and score recap finds the winner', () => {
  assert.equal(getArcadeRemaining(1000, 12000, 500), 12000);
  assert.equal(getArcadeRemaining(1000, 12000, 1000), 12000);
  assert.equal(getArcadeRemaining(1000, 12000, 13500), 0);
  assert.deepEqual(getArcadeWinner({ host: { score: 90 }, guest: { score: 80 } }), { hostScore: 90, guestScore: 80, winner: 'host' });
  assert.equal(getArcadeWinner({ host: { score: 50 }, guest: { score: 50 } }).winner, 'draw');
});
