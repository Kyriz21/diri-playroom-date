import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('One Tap tercantum aktif di katalog dan masuk ke alur lobby eksplisit', () => {
  const constants = read('../js/constants.js');
  const app = read('../js/app.js');
  const roomService = read('../js/services/room-service.js');
  assert.match(constants, /id: 'arcade',[\s\S]{0,240}state: 'active'/);
  assert.match(app, /EXPLICIT_LOBBY_GAMES = new Set\(\[[^\]]*'arcade'/);
  assert.match(roomService, /EXPLICIT_LOBBY_GAMES = new Set\(\[[^\]]*'arcade'/);
  assert.match(app, /data-action="open-arcade-create"/);
  assert.match(app, /data-action="open-arcade-join"/);
  assert.match(app, /import\('\.\/games\/arcade\.js\?v=0\.51\.0'\)/);
  assert.match(app, /One Tap/);
  const landingStart = app.indexOf('data-game-card="arcade"');
  const landingCard = app.slice(landingStart, app.indexOf('</article>', landingStart));
  assert.equal((landingCard.match(/data-action="open-arcade-/g) || []).length, 2, 'kartu One Tap hanya memiliki Buat sesi dan Gabung sesi');
  assert.match(landingCard, /PLAYER 1/);
  assert.match(landingCard, /PLAYER 2/);
  assert.doesNotMatch(landingCard, /Flappy Face|Insert coin|Join with a code|\\bVS\\b|Buat Room|Join Room/);
  assert.ok(app.includes('Buat sesi ${activityName}'));
  assert.ok(app.includes('Gabung ${activityName}'));
  assert.match(app, /slotLabel = gameId === 'arcade'/);
  assert.doesNotMatch(app, /speedrun dua belas mini-game/);
});

test('One Tap memakai room dua pemain, presence, ready, dan mulai oleh host', () => {
  const game = read('../js/games/arcade.js');
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  const roomRules = rules.rules.rooms.$roomCode;
  assert.match(game, /data-ar-action="ready"/);
  assert.match(game, /data-ar-action="insert-coin"/);
  assert.match(game, /bothReady/);
  assert.match(roomRules.lobby.ready.$role['.write'], /presence/);
  assert.match(roomRules.lobby.activeSession['.write'], /arcade/);
  assert.ok(rules.rules.roomGames.$roomCode.$sessionId.arcade);
});

test('One Tap merender dua pemain pada jalur bersama dengan tap, satu timer, dan satu rekap', () => {
  const logic = read('../js/games/arcade-logic.js');
  const game = read('../js/games/arcade.js');
  assert.match(logic, /ARCADE_STAGE_DURATION_MS = 60000/);
  assert.match(logic, /id: 'one-tap'/);
  assert.match(game, /data-ar-input="jump"/);
  assert.match(game, /canvasTapHandler/);
  assert.match(game, /Space.*ArrowUp|ArrowUp.*Space/);
  assert.match(game, /ONE TAP/);
  assert.match(game, /PLAYER 1/);
  assert.match(game, /PLAYER 2/);
  assert.match(game, /const x = sharedX \+ \(playerRole === 'host' \? -25 : 25\)/);
  assert.match(game, /for \(const entity of entitiesByRole\.host\)/);
  assert.match(game, /arcade-result-card/);
  assert.match(game, /function renderResultOnce\(\) \{\s*if \(data\.meta\?\.phase === 'result'\) renderResult\(\);/);
  assert.doesNotMatch(game, /data-ar-input="up"|data-ar-input="down"/);
  assert.doesNotMatch(game, /ARCADE_STAGES\.map\(\(stage, index\)/);
  assert.doesNotMatch(game, /data-ar-input="left"|data-ar-input="right"|actionPressed/);
});

test('One Tap memiliki lobby avatar foto/emoji dan validasi avatar pada Firebase', () => {
  const game = read('../js/games/arcade.js');
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  assert.match(game, /canvas\.toDataURL\('image\/jpeg'/);
  assert.match(game, /result\.length > 22000/);
  assert.match(game, /Foto karakter berhasil disimpan/);
  assert.match(rules.rules.roomGames.$roomCode.$sessionId.arcade.players.$role.avatar['.validate'], /22000/);
});

test('Firebase mengizinkan hasil One Tap setelah timer selesai atau kedua pemain kehabisan nyawa', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  const arcade = rules.rules.roomGames.$roomCode.$sessionId.arcade;
  const metaWrite = arcade.meta['.write'];
  const metaValidate = arcade.meta['.validate'];
  assert.match(metaWrite, /startedAt/);
  assert.match(metaWrite, /60000/);
  assert.match(metaWrite, /players.*host.*lives/);
  assert.match(metaWrite, /players.*guest.*lives/);
  assert.match(metaWrite, /presence.*host.*connected/);
  assert.match(metaWrite, /presence.*guest.*connected/);
  assert.match(metaValidate, /stageIndex/);
  assert.match(metaValidate, /=== 0/);
  assert.equal(arcade.players.$role.gatesPassed['.validate'], 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 100');
});

test('semua ekspresi Firebase Rules memiliki tanda kurung yang seimbang', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  const issues = [];
  const walk = (value, path = 'rules') => {
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}[${index}]`));
    if (value && typeof value === 'object') return Object.entries(value).forEach(([key, item]) => walk(item, `${path}.${key}`));
    if (typeof value !== 'string' || !['.read', '.write', '.validate'].includes(path.split('.').at(-1))) return;
    let balance = 0;
    let minimum = 0;
    for (const char of value) {
      if (char === '(') balance += 1;
      if (char === ')') balance -= 1;
      minimum = Math.min(minimum, balance);
    }
    if (balance !== 0 || minimum < 0) issues.push({ path, balance, minimum });
  };
  walk(rules.rules);
  assert.deepEqual(issues, []);
});
