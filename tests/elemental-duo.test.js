import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ELEMENTAL_LEVELS, ELEMENTAL_WORLDS, getElementalLevel,
  createElementalPlayer, clampElementalPlayer, rectsOverlap, getElementalStars
} from '../js/games/elemental-duo-logic.js';

test('Elemental Duo memiliki tepat 50 level unik dalam lima dunia', () => {
  assert.equal(ELEMENTAL_LEVELS.length, 50);
  assert.equal(ELEMENTAL_WORLDS.length, 5);
  assert.equal(new Set(ELEMENTAL_LEVELS.map(level => level.name)).size, 50);
  assert.deepEqual(ELEMENTAL_WORLDS.map(world => [world.firstLevel, world.lastLevel]), [[1,10],[11,20],[21,30],[31,40],[41,50]]);
  assert.equal(getElementalLevel(0).id, 1);
  assert.equal(getElementalLevel(51).id, 50);
});

test('Setiap level memuat dua simpul, dua serpihan, gerbang, checkpoint, dan arena valid', () => {
  for (const level of ELEMENTAL_LEVELS) {
    assert.equal(level.switches.length, 2, `level ${level.id}`);
    assert.deepEqual(level.switches.map(item => item.element).sort(), ['fire','water']);
    assert.equal(level.gems.length, 2, `level ${level.id}`);
    assert.deepEqual(level.gems.map(item => item.element).sort(), ['fire','water']);
    assert.ok(level.platforms.length >= 2);
    assert.ok(level.hazards.length >= 1);
    assert.ok(level.exit.x > 800 && level.exit.w > 0);
    assert.ok(level.spawn.host.x < level.spawn.guest.x);
    assert.ok(level.difficulty >= 1 && level.difficulty <= 5);
  }
});

test('Bara dan Nira memiliki spawn serta state yang terpisah', () => {
  const bara = createElementalPlayer('host');
  const nira = createElementalPlayer('guest');
  assert.ok(bara.x < nira.x);
  assert.equal(bara.ready, false);
  assert.equal(nira.complete, false);
  const restored = createElementalPlayer('guest', { x:123, y:300, deaths:4, levelDeaths:2, shards:8, ready:true }, 10);
  assert.equal(restored.x, 123);
  assert.equal(restored.deaths, 4);
  assert.equal(restored.levelDeaths, 2);
  assert.equal(restored.shards, 8);
});

test('Collision rectangle dan batas posisi karakter konsisten', () => {
  assert.equal(rectsOverlap({x:0,y:0,w:10,h:10},{x:5,y:5,w:10,h:10}), true);
  assert.equal(rectsOverlap({x:0,y:0,w:10,h:10},{x:11,y:11,w:10,h:10}), false);
  const clamped = clampElementalPlayer({x:2000,y:900,vx:0,vy:0});
  assert.equal(clamped.x, 942);
  assert.equal(clamped.y, 520);
});

test('Penilaian level memberikan maksimal tiga bintang', () => {
  assert.equal(getElementalStars({ deaths:0, shards:2 }), 3);
  assert.equal(getElementalStars({ deaths:0, shards:1 }), 2);
  assert.equal(getElementalStars({ deaths:2, shards:0 }), 2);
  assert.equal(getElementalStars({ deaths:3, shards:2 }), 1);
});

import fs from 'node:fs';
const readSource = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Elemental Duo terdaftar di katalog dan memiliki rute buat/gabung tersendiri', () => {
  const constants = readSource('../js/constants.js');
  const app = readSource('../js/app.js');
  const index = readSource('../index.html');
  assert.match(constants, /id: 'elementalduo'.*title: 'Elemental Duo'/);
  assert.match(app, /data-action="open-elemental-create"/);
  assert.match(app, /data-action="open-elemental-join"/);
  assert.match(app, /mountElementalDuo/);
  assert.match(app, /elementalduo: 'Elemental Duo'/);
  assert.match(index, /elemental-duo\.css/);
});

test('Elemental Duo menyinkronkan state melalui node khusus untuk anggota dan sesi aktif', () => {
  const rules = JSON.parse(readSource('../firebase-database.rules.json')).rules;
  assert.match(rules.rooms.$roomCode.lobby.selections.$role['.validate'], /elementalduo/);
  assert.match(rules.rooms.$roomCode.lobby.activeSession['.validate'], /elementalduo/);
  const gameRules = rules.roomGames.$roomCode.$sessionId.elementalDuo;
  assert.match(gameRules['.read'], /gameId.*elementalduo/);
  assert.match(gameRules['.read'], /auth\.uid/);
  assert.match(gameRules['.write'], /activeSession/);
  assert.match(gameRules['.write'], /lastMeaningfulActivityAt/);
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /roomGames.*elementalDuo/);
  assert.match(game, /runTransaction\(metaRef/);
  assert.match(game, /players\/\$\{role\}/);
  assert.match(game, /levels/);
});

test('Kontrol Elemental Duo mendukung keyboard dan tombol pointer untuk layar sentuh', () => {
  const game = readSource('../js/games/elemental-duo.js');
  const css = readSource('../css/elemental-duo.css');
  assert.match(game, /ArrowLeft/);
  assert.match(game, /Space/);
  assert.match(game, /KeyE/);
  assert.match(game, /pointerdown/);
  assert.match(game, /pointerup/);
  assert.match(css, /touch-action:none/);
  assert.match(game, /requestAnimationFrame/);
});

test('State pemain menyimpan jumlah jatuh total dan jumlah jatuh pada level berjalan', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /deaths:Number\(localPlayer\.deaths\)\|\|0,[\s\S]*levelDeaths:Number\(localPlayer\.levelDeaths\)\|\|0/);
  assert.match(game, /const deaths = \(Number\(host\.levelDeaths\)\|\|0\) \+ \(Number\(guest\.levelDeaths\)\|\|0\)/);
});

test('Lompatan cukup tinggi untuk mencapai platform dasar dari lantai utama', () => {
  const logic = readSource('../js/games/elemental-duo-logic.js');
  assert.match(logic, /ELEMENTAL_GRAVITY = 1480/);
  assert.match(logic, /ELEMENTAL_JUMP_SPEED = 590/);
  const gravity = 1480;
  const jumpSpeed = 590;
  assert.ok((jumpSpeed * jumpSpeed) / (2 * gravity) > 100);
});

test('Setiap simpul dan titik checkpoint dapat didekati tanpa berada di zona elemen yang berbahaya', () => {
  for (const level of ELEMENTAL_LEVELS) {
    for (const node of level.switches) {
      const unsafeType = node.element === 'fire' ? 'water' : 'fire';
      const overlapsUnsafeZone = level.hazards.some(hazard => hazard.type === unsafeType && node.x >= hazard.x - 30 && node.x <= hazard.x + hazard.w + 30);
      assert.equal(overlapsUnsafeZone, false, `level ${level.id} simpul ${node.element}`);
    }
    const overlapsHazard = level.hazards.some(hazard => level.checkpoint.x >= hazard.x - 22 && level.checkpoint.x <= hazard.x + hazard.w + 22);
    assert.equal(overlapsHazard, false, `level ${level.id} checkpoint`);
  }
});
