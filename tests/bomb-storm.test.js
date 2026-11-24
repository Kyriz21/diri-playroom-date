import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BOMB_STORM_DURATION_SECONDS, BOMB_STORM_FALL_GRACE_MS,
  createBombStormObject, getBombStormObjectY, processLandedObjects,
  getBombStormRemaining, determineBombStormWinner, nextBombStormSeed, clampPlayerX,
  smoothPlayerX, getBombStormEffectFrame
} from '../js/games/bomb-storm-logic.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Bomb Storm is registered as the third game and has dedicated create/join routes', () => {
  const constants = read('../js/constants.js');
  const app = read('../js/app.js');
  const index = read('../index.html');
  assert.match(constants, /id: 'bombstorm'.*title: 'Bomb Storm'/);
  assert.match(app, /data-action="open-bomb-create"/);
  assert.match(app, /data-action="open-bomb-join"/);
  assert.match(app, /mountBombStorm/);
  assert.match(index, /bomb-storm\.css/);
});

test('each falling object is deterministic for both devices with a shared seed', () => {
  assert.deepEqual(createBombStormObject(123456, 11), createBombStormObject(123456, 11));
  assert.notDeepEqual(createBombStormObject(123456, 11), createBombStormObject(987654, 11));
  assert.equal(createBombStormObject(1, -1), null);
});

test('falling object positions stay deterministic and move down over time', () => {
  const object = createBombStormObject(42, 3);
  assert.ok(object);
  assert.ok(getBombStormObjectY(object, object.spawnAt + 1000) > getBombStormObjectY(object, object.spawnAt + 200));
});

test('caught hearts add ten points while caught bombs remove one life', () => {
  const heart = createBombStormObject(42, 3);
  assert.equal(heart.kind, 'heart');
  const beforeHeart = processLandedObjects({ seed:42, elapsedMs:heart.collisionAt, processedIndex:2, playerX:heart.x, score:0, lives:3 });
  assert.equal(beforeHeart.score, 10);
  assert.equal(beforeHeart.lives, 3);
  assert.equal(beforeHeart.events[0].result, 'collected');

  const bomb = createBombStormObject(42, 0);
  const afterBomb = processLandedObjects({ seed:42, elapsedMs:bomb.collisionAt, processedIndex:-1, playerX:bomb.x, score:0, lives:3 });
  assert.equal(afterBomb.lives, 2);
  assert.equal(afterBomb.events[0].result, 'hit');
});

test('processed object index prevents duplicate score or repeated collisions', () => {
  const first = createBombStormObject(42, 0);
  const processed = processLandedObjects({ seed:42, elapsedMs:first.collisionAt, processedIndex:-1, playerX:first.x, score:0, lives:3 });
  const repeat = processLandedObjects({ seed:42, elapsedMs:first.collisionAt + 2000, processedIndex:processed.processedIndex, playerX:first.x, score:processed.score, lives:processed.lives });
  assert.ok(repeat.processedIndex >= processed.processedIndex);
  assert.equal(repeat.score, processed.score);
  assert.equal(repeat.events.some(item => item.id === 0), false);
});

test('timer is clamped between zero and the configured duration', () => {
  assert.equal(BOMB_STORM_DURATION_SECONDS, 60);
  assert.equal(getBombStormRemaining(10000, 60, 1000), 60);
  assert.equal(getBombStormRemaining(10000, 60, 70000), 0);
  assert.equal(BOMB_STORM_FALL_GRACE_MS, 5200);
});

test('winner calculation supports host, guest and draw outcomes', () => {
  assert.equal(determineBombStormWinner({host:{score:40},guest:{score:20}}).winner,'host');
  assert.equal(determineBombStormWinner({host:{score:10},guest:{score:20}}).winner,'guest');
  assert.equal(determineBombStormWinner({host:{score:20},guest:{score:20}}).winner,'draw');
});

test('rematch seed changes deterministically and player position is clamped', () => {
  assert.equal(nextBombStormSeed(12, 2), nextBombStormSeed(12, 2));
  assert.notEqual(nextBombStormSeed(12, 2), nextBombStormSeed(12, 3));
  assert.equal(clampPlayerX(-5), .06);
  assert.equal(clampPlayerX(5), .94);
});

test('Firebase Rules register Bomb Storm and restrict each player to their own profile fields', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  assert.match(rules.rooms.$roomCode.lobby.selections.$role['.validate'], /bombstorm/);
  assert.match(rules.rooms.$roomCode.lobby.activeSession['.validate'], /bombstorm/);
  const sessionRules = rules.roomGames.$roomCode.$sessionId;
  const bomb = sessionRules.bombStorm;
  assert.ok(bomb.meta && bomb.players && bomb.rematchRequests);
  assert.ok(sessionRules.bombStormAvatars);
  assert.equal(bomb.players.$role.avatar, undefined);
  assert.match(sessionRules.bombStormAvatars.$role['.write'], /auth\.uid/);
  assert.match(sessionRules.bombStormAvatars.$role['.validate'], /22000/);
  assert.match(bomb.meta['.write'], /players/);
  assert.match(bomb.meta['.write'], /rematchRequests/);
  assert.match(bomb.players.$role.score['.write'], /auth\.uid/);
  assert.match(bomb.rematchRequests.$role['.write'], /auth\.uid/);
});

test('Bomb Storm keeps avatar data compressed and the game input mobile-friendly', () => {
  const game = read('../js/games/bomb-storm.js');
  const css = read('../css/bomb-storm.css');
  assert.match(game, /createImageBitmap/);
  assert.match(game, /data-bs-arena/);
  assert.match(game, /data-bs-move-slider/);
  assert.match(game, /pointerdown/);
  assert.match(css, /touch-action:none/);
  assert.match(game, /createAvatarCamera\(root/);
  assert.match(read('../js/services/avatar-camera.js'), /navigator\.mediaDevices\.getUserMedia/);
});

test('selfie avatars stay loaded in setup, HUD and results while frequent game snapshots update', () => {
  const game = read('../js/games/bomb-storm.js');
  assert.match(game, /let avatarData = \{\}/);
  assert.match(game, /avatarData=snapshot\.val\(\)\|\|\{\}/);
  assert.match(game, /safeAvatar\(avatarData\.host\)/);
  assert.match(game, /safeAvatar\(avatarData\.guest\)/);
  assert.doesNotMatch(game, /safeAvatar\(data\.avatars/);
});

test('avatar previews read from the separate avatar node and remain independent of frequent game-state snapshots', () => {
  const game = read('../js/games/bomb-storm.js');
  assert.match(game, /let avatarData = \{\}/);
  assert.match(game, /avatarData=snapshot\.val\(\)\|\|\{\}/);
  assert.match(game, /safeAvatar\(avatarData\.host\)/);
  assert.doesNotMatch(game, /safeAvatar\(data\.avatars/);
});

test('Bomb Storm lobby offers default characters, camera capture, and a separate gallery picker', () => {
  const game = read('../js/games/bomb-storm.js');
  assert.match(game, /Pilih karakter bawaan/);
  assert.match(game, /DEFAULT_CHARACTERS = \[/);
  assert.match(game, /id: 'alien'.*emoji: '👾'/);
  assert.match(game, /id: 'unicorn'.*emoji: '🦄'/);
  assert.doesNotMatch(game, /id="bs-avatar-camera"/);
  assert.match(game, /id="bs-avatar-gallery"[^>]*accept="image\/\*"/);
  assert.match(game, /if\(action==='camera'\)void avatarCamera\?\.open\(\)/);
  assert.match(game, /if\(action==='gallery'\)root\.querySelector\('#bs-avatar-gallery'\)/);
  assert.match(game, /data-bs-action="camera"/);
  assert.match(game, /data-bs-action="gallery"/);
  assert.match(game, /async function selectCharacter/);
  assert.match(game, /await get\(avatarRef\)/);
});

test('Firebase Rules only accept the defined Bomb Storm character IDs or compressed image avatars', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  const avatarRule = rules.roomGames.$roomCode.$sessionId.bombStormAvatars.$role['.validate'];
  assert.match(avatarRule, /character:\(alien\|bear\|cat\|rabbit\|panda\|fox\|frog\|monkey\|koala\|tiger\|chick\|unicorn\)/);
  assert.match(avatarRule, /data:image/);
  assert.match(avatarRule, /22000/);
});


test('remote player position interpolates smoothly instead of snapping to Firebase samples', () => {
  let x = 0.3;
  const first = smoothPlayerX(x, 0.8, 16, 68);
  const second = smoothPlayerX(first, 0.8, 16, 68);
  assert.ok(first > x && first < 0.8);
  assert.ok(second > first && second < 0.8);
  let settled = second;
  for (let i = 0; i < 60; i++) settled = smoothPlayerX(settled, 0.8, 16, 68);
  assert.equal(settled, 0.8);
  assert.equal(smoothPlayerX(0.8, 0.8, 16, 68), 0.8);
});

test('heart reward effect animates with a gentle bounce and expires without changing player coordinates', () => {
  const start = getBombStormEffectFrame('heart', 0);
  const middle = getBombStormEffectFrame('heart', 410);
  const end = getBombStormEffectFrame('heart', 820);
  assert.ok(Math.abs(start.yOffset) < 1e-9);
  assert.ok(middle.yOffset < 0);
  assert.ok(middle.scaleY > 1);
  assert.equal(end, null);
});

test('bomb hit effect animates a short shake and squash, then expires', () => {
  const start = getBombStormEffectFrame('bomb', 0);
  const impact = getBombStormEffectFrame('bomb', 120);
  assert.ok(start);
  assert.ok(impact);
  assert.ok(impact.scaleX > 1);
  assert.ok(impact.scaleY < 1);
  assert.ok(impact.flash > 0);
  assert.equal(getBombStormEffectFrame('bomb', 760), null);
});

test('collision effects are triggered from player score/life changes and position is interpolated in the renderer', () => {
  const game = read('../js/games/bomb-storm.js');
  assert.match(game, /function observePlayerEffects\(/);
  assert.match(game, /after\.lives < before\.lives/);
  assert.match(game, /after\.score > before\.score/);
  assert.match(game, /smoothPlayerX\(renderedPlayerX/);
  assert.match(game, /getBombStormEffectFrame\(effect\.kind/);
});
