import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Arcade tercantum aktif di katalog dan masuk ke alur lobby eksplisit', () => {
  const constants = read('../js/constants.js');
  const app = read('../js/app.js');
  const roomService = read('../js/services/room-service.js');
  assert.match(constants, /id: 'arcade',[\s\S]{0,240}state: 'active'/);
  assert.match(app, /EXPLICIT_LOBBY_GAMES = new Set\(\[[^\]]*'arcade'/);
  assert.match(roomService, /EXPLICIT_LOBBY_GAMES = new Set\(\[[^\]]*'arcade'/);
  assert.match(app, /data-action="open-arcade-create"/);
  assert.match(app, /data-action="open-arcade-join"/);
  assert.match(app, /import\('\.\/games\/arcade\.js\?v=0\.47\.0'\)/);
});

test('Arcade memakai lobby dua pemain, presence, ready, dan Insert Coin oleh host', () => {
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

test('Arcade menghadirkan dua belas ronde pada satu arena dan satu kartu rekap akhir', () => {
  const logic = read('../js/games/arcade-logic.js');
  const game = read('../js/games/arcade.js');
  assert.match(logic, /export const ARCADE_STAGES = \[/);
  assert.match(game, /ARCADE_STAGES\.map\(\(stage, index\)/);
  assert.match(game, /Rekap setiap mini-game/);
  assert.match(game, /data-ar-input=\"up\"/);
  assert.match(game, /data-ar-input=\"down\"/);
  assert.match(game, /arcade-result-card/);
  assert.doesNotMatch(game, /slide-result|next-result-slide/);
});

test('Foto karakter dikompres dan dibatasi sebelum disimpan ke sesi', () => {
  const game = read('../js/games/arcade.js');
  const rules = JSON.parse(read('../firebase-database.rules.json'));
  assert.match(game, /canvas\.toDataURL\('image\/jpeg'/);
  assert.match(game, /result\.length > 22000/);
  assert.match(game, /Foto dikompres dan hanya dibagikan di sesi ini/);
  assert.match(rules.rules.roomGames.$roomCode.$sessionId.arcade.players.$role.avatar['.validate'], /22000/);
});

test('all Firebase Rules expressions have balanced parentheses', () => {
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
