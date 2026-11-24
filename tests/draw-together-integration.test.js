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
  assert.match(app, /import\('\.\/games\/draw-together\.js\?v=0\.13\.0'\)/);
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
  assert.ok(drawRules.meta && drawRules.ready && drawRules.finished && drawRules.strokes && drawRules.rematchRequests && drawRules.rematchCleared);
  assert.match(drawRules.strokes.$uid.$strokeId['.write'], /auth\.uid === \$uid/);
  assert.match(drawRules.meta['.write'], /rematchRequests/);
  assert.match(drawRules.rematchRequests.$role['.validate'], /createdAt/);
  assert.doesNotMatch(JSON.stringify(drawRules), /numChildren\(\)/);
});


test('Gambar Bareng includes a rematch action and continuous brush-size slider', () => {
  const game = read('../js/games/draw-together.js');
  assert.match(game, /data-dt-action="rematch"/);
  assert.match(game, /data-dt-brush-slider/);
  assert.match(game, /type="range" min="1" max="24"/);
  assert.match(game, /requestRematch/);
  assert.match(game, /beginRematchReset/);
});


test('brush slider listens to input and displays the selected pixel width', () => {
  const game = read('../js/games/draw-together.js');
  assert.match(game, /root\.addEventListener\('input', inputHandler\)/);
  assert.match(game, /root\.removeEventListener\('input', inputHandler\)/);
  assert.match(game, /\$\{brushWidth\} px/);
});

test('rematch clears local player strokes and requires a round-scoped vote from both roles', () => {
  const game = read('../js/games/draw-together.js');
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules.roomGames.$roomCode.$sessionId.drawTogether;
  assert.match(game, /remove\(ref\(db, `\$\{myStrokesPath\}\/\$\{strokeId\}`\)\)/);
  assert.match(game, /rematchRequests\/\$\{role\}/);
  assert.match(rules.meta['.write'], /rematchRequests/);
  assert.match(rules.meta['.write'], /rematchCleared/);
  assert.match(rules.meta['.validate'], /rematching/);
  assert.match(rules.rematchRequests.$role['.write'], /auth\.uid/);
  assert.match(rules.rematchRequests.$role['.validate'], /meta.*createdAt/);
  assert.match(rules.rematchCleared.$role['.validate'], /meta.*createdAt/);
  assert.match(game, /phase === 'rematching'/);
  assert.match(game, /clearOwnStrokesForRematch/);
});


test('rematch uses a visible reset phase so finished drawings are not deleted before both players accept', () => {
  const game = read('../js/games/draw-together.js');
  assert.match(game, /data-dt-panel="rematching"/);
  assert.match(game, /phase === 'rematching'/);
  assert.match(game, /Keep the completed drawings intact until both players agree/);
  assert.match(game, /rematchCleared/);
});
