import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_CATALOG } from '../js/constants.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Gambar Bareng is registered as a first-class activity in the room catalogue', () => {
  const game = GAME_CATALOG.find(item => item.id === 'drawtogether');
  assert.ok(game);
  assert.equal(game.title, 'Gambar Bareng');
});

test('the landing page has dedicated create and join actions for Gambar Bareng', () => {
  const app = read('../js/app.js');
  assert.match(app, /data-action="open-draw-create"/);
  assert.match(app, /data-action="open-draw-join"/);
  assert.match(app, /import\('\.\/games\/draw-together\.js'\)/);
});

test('room service creates the selected game and makes the guest adopt the host activity', () => {
  const service = read('../js/services/room-service.js');
  assert.match(service, /createRoom\(\{ uid, name, gameId = 'photobooth' \}\)/);
  assert.match(service, /selections: \{ host: gameId, guest: '' \}/);
  assert.match(service, /expectedGameId = null/);
  assert.match(service, /lobby\/selections\/guest': room\.lobby\?\.selections\?\.host/);
});

test('Firebase rules allow the game ID and isolate drawing writes by the signed-in player UID', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  const roomRules = rules.rules.rooms.$roomCode.lobby;
  assert.match(roomRules.selections.$role['.validate'], /drawtogether/);
  assert.match(roomRules.activeSession['.validate'], /drawtogether/);
  const drawRules = rules.rules.roomGames.$roomCode.$sessionId.drawTogether;
  assert.ok(drawRules.meta && drawRules.ready && drawRules.finished && drawRules.strokes);
  assert.match(drawRules.strokes.$uid.$strokeId['.write'], /auth\.uid === \$uid/);
  assert.match(drawRules.strokes.$uid.$strokeId['.validate'], /numChildren\(\) <= 400/);
});
