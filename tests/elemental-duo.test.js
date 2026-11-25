import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ELEMENTAL_LEVELS, ELEMENTAL_WORLDS, getElementalLevel,
  createElementalPlayer, clampElementalPlayer, rectsOverlap, getElementalStars,
  getElementalViewport, getElementalCameraTarget,
  getElementalPlatformState, getElementalHazardState, getElementalDifficultyLabel,
  getElementalCurrentState, getElementalWindState, isElementalPlayerOnIce, getElementalSurfaceFriction
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

test('Setiap level memiliki dua pijakan aman, penghalang bersama, dan pintu khusus Bara serta Air', () => {
  for (const level of ELEMENTAL_LEVELS) {
    assert.deepEqual(level.switches.map(item => item.element).sort(), ['fire','water']);
    assert.ok(level.switches.every(item => item.w >= 48 && item.h >= 10));
    for (const plate of level.switches) {
      const supportedByFloor = plate.y >= 500;
      const supportedByPlatform = level.platforms.some(platform =>
        plate.x + plate.w / 2 > platform.x && plate.x - plate.w / 2 < platform.x + platform.w &&
        Math.abs((plate.y + plate.h / 2) - platform.y) <= 2
      );
      assert.ok(supportedByFloor || supportedByPlatform, `level ${level.id} plate ${plate.element} harus berada di lantai atau platform`);
    }
    assert.ok(level.gate && level.gate.w > 0 && level.gate.h >= 100);
    assert.ok(level.doors.fire && level.doors.water);
    assert.notEqual(level.doors.fire.x, level.doors.water.x);
    assert.equal(level.doors.fire.element, 'fire');
    assert.equal(level.doors.water.element, 'water');
  }
});

test('Elemental Duo mengaktifkan pijakan otomatis dan mewajibkan pintu yang sesuai elemen pemain', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /function checkPressurePlate\(\)/);
  assert.match(game, /attemptSwitch\(plate\)/);
  assert.match(game, /const ownDoor = level\.doors\?\.\[CHARACTER\[role\]\.element\]/);
  assert.match(game, /const gateLaneOverlap = localPlayer\.x \+ halfW > level\.gate\.x/);
  assert.match(game, /if \(gateIsOpen\(\) && rectsOverlap\(body, ownDoor\)/);
  assert.match(game, /function drawExit\(level, time\)/);
});

test('Kamera mengikuti pemain aktif dan tetap memperbesar area di potret maupun landscape', () => {
  const portrait = getElementalViewport(390, 430);
  const landscape = getElementalViewport(844, 390);
  assert.ok(portrait.viewWidth < 600);
  assert.ok(landscape.viewWidth > portrait.viewWidth);
  assert.ok(landscape.viewWidth < 960, 'landscape tetap menggunakan kamera follow, bukan seluruh stage');
  const start = getElementalCameraTarget({x:80,y:468},{x:120,y:468},landscape.viewWidth,landscape.viewHeight);
  const advanced = getElementalCameraTarget({x:720,y:360},{x:130,y:468},landscape.viewWidth,landscape.viewHeight);
  assert.ok(advanced.x > start.x + 180, 'kamera harus bergeser ketika pemain lokal maju');
  assert.ok(advanced.x <= 960 - landscape.viewWidth);
  assert.ok(advanced.y >= 0);
});

test('Elemental Duo memiliki mode potret dan layar penuh yang meminta orientasi landscape', () => {
  const game = readSource('../js/games/elemental-duo.js');
  const css = readSource('../css/elemental-duo.css');
  const index = readSource('../index.html');
  const app = readSource('../js/app.js');
  assert.match(game, /function resizeCanvasViewport\(\)/);
  assert.match(game, /function updateCamera\(dt = 1 \/ 60\)/);
  assert.match(game, /getElementalCameraTarget\(localPlayer, remoteRender/);
  assert.match(game, /ctx\.setTransform\(z,0,0,z/);
  assert.match(game, /data-ed-action="portrait"/);
  assert.match(game, /data-ed-action="fullscreen"/);
  assert.match(game, /screen\.orientation\.lock\('landscape'\)/);
  assert.match(game, /screen\.orientation\?\.unlock/);
  assert.match(game, /ed-fullpage-fallback/);
  assert.match(game, /if \(action === 'back'\) \{ await enterPortraitMode\(\); onBack\?\.\(\); \}/);
  assert.match(css, /data-display-mode="portrait"/);
  assert.match(css, /height:clamp\(340px,52dvh,480px\)/);
  assert.match(css, /\.ed-game-panel:fullscreen/);
  assert.match(css, /ed-rotate-prompt/);
  assert.match(css, /ed-touch-controls\{position:absolute/);
  assert.match(css, /ed-game-panel\.ed-fullpage-fallback\{position:fixed;inset:0\}/);
  assert.match(index, /elemental-duo\.css\?v=0\.29\.0/);
  assert.match(app, /elemental-duo\.js\?v=0\.29\.0/);
  assert.match(index, /app\.js\?v=0\.29\.0/);
});


test('Status tiba selalu diantrekan setelah sinkronisasi posisi yang sedang berlangsung', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /let pendingPlayerPayload = null/);
  assert.match(game, /async function flushPlayerWrites\(\)/);
  assert.match(game, /while \(pendingPlayerPayload && !destroyed\)/);
  assert.match(game, /pendingPlayerPayload = playerPayload\(\)/);
  assert.match(game, /void flushPlayerWrites\(\)/);
  assert.doesNotMatch(game, /function saveLocalPlayer\(force = false\) \{\s*if \(writingPlayer \|\|/);
});

test('Progres level pulih jika kunci transisi tertinggal setelah koneksi terputus', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /transitionStartedAt:now\(\)/);
  assert.match(game, /now\(\) - lockStartedAt < 12000/);
  assert.match(game, /transitioning:false, transitionStartedAt:null/);
  assert.match(game, /if \(!host\?\.complete \|\| !guest\?\.complete\) return/);
});


test('Objektif dan notifikasi tidak lagi menutupi arena permainan', () => {
  const game = readSource('../js/games/elemental-duo.js');
  const css = readSource('../css/elemental-duo.css');
  assert.match(game, /<div class=\"ed-live-notice\" data-ed-notice[^>]*hidden/);
  assert.match(game, /const noticeActive = Boolean\(canvasNotice && now\(\) < noticeUntil\)/);
  assert.match(game, /Objective and transient feedback are shown in the HUD outside the arena/);
  assert.doesNotMatch(game, /fillText\('INJAK KEDUA PIJAKAN ELEMEN'/);
  assert.doesNotMatch(game, /fillText\(`MENUJU PINTU/);
  assert.doesNotMatch(game, /class=\"ed-canvas-notice\"/);
  assert.match(css, /\.ed-live-notice\[hidden\]\{display:none!important\}/);
  assert.match(css, /@media\(max-width:640px\)\{\.ed-bottom-tip\{display:none\}\}/);
});


test('Sepuluh level Hutan Berbisik memakai blueprint dengan tujuan dan layout berbeda', () => {
  const firstWorld = ELEMENTAL_LEVELS.slice(0, 10);
  assert.equal(new Set(firstWorld.map(level => JSON.stringify({ platforms:level.platforms, hazards:level.hazards, switches:level.switches, gems:level.gems }))).size, 10);
  assert.deepEqual(firstWorld.map(level => level.difficulty), [1,1,1,2,2,2,3,3,3,3]);
  assert.deepEqual(firstWorld.map(level => level.name), [
    'Jejak Cahaya','Batu Bertunas','Akar Berliku','Jembatan Pucuk','Dua Lentera',
    'Lompatan Lumut','Gerbang Embun','Akar Berayun','Ruang Kunang-kunang','Jantung Hutan'
  ]);
  assert.ok(firstWorld[0].features.includes('tutorial-move'));
  assert.ok(firstWorld[4].features.includes('elevated-switches'));
  assert.ok(firstWorld[5].platforms.some(platform => platform.kind === 'bounce'));
  assert.ok(firstWorld[7].platforms.some(platform => platform.motion));
  assert.ok(firstWorld[7].platforms.some(platform => platform.cycle));
  assert.ok(firstWorld[8].platforms.filter(platform => platform.motion).length >= 2);
  assert.ok(firstWorld[9].features.includes('co-op-gate'));
  for (const level of firstWorld) {
    for (const plate of level.switches) {
      assert.ok(plate.x + (plate.w || 52) / 2 < level.gate.x, `level ${level.id} ${plate.element} plate tidak boleh berada di balik gerbang`);
    }
  }
});

test('Platform bergerak dan platform berkala memiliki posisi/status deterministik dari jam level', () => {
  const moving = getElementalLevel(8).platforms.find(platform => platform.motion);
  const first = getElementalPlatformState(moving, 1200);
  const same = getElementalPlatformState(moving, 1200);
  const later = getElementalPlatformState(moving, 2600);
  assert.equal(first.x, same.x);
  assert.notEqual(first.x, later.x);
  const timed = getElementalLevel(8).platforms.find(platform => platform.cycle);
  assert.equal(getElementalPlatformState(timed, 100).active, true);
  assert.equal(getElementalPlatformState(timed, 5000).active, false);
});



test('Platform bergerak dan jebakan berkala memakai jam Firebase yang sama di kedua perangkat', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /ref\(db, '\.info\/serverTimeOffset'\)/);
  assert.match(game, /elementalServerTimeOffset = Number\(snapshot\.val\(\)\) \|\| 0/);
  assert.match(game, /await serverClockReadyPromise/);
  assert.match(game, /if \(serverClockReady\) physics\(dt\)/);
  assert.match(game, /let unsubscribeServerClock = null/);
  assert.match(game, /if \(unsubscribeServerClock\) unsubscribeServerClock\(\)/);
});

test('Jalur level pertama memiliki hazard sesuai elemen dan hazard bergerak tetap deterministik', () => {
  const levelOne = getElementalLevel(1);
  assert.ok(levelOne.hazards.some(hazard => hazard.type === 'water'));
  assert.ok(levelOne.hazards.some(hazard => hazard.type === 'fire'));
  const movingHazard = getElementalLevel(10).hazards.find(hazard => hazard.motion);
  const a = getElementalHazardState(movingHazard, 900);
  const b = getElementalHazardState(movingHazard, 900);
  const c = getElementalHazardState(movingHazard, 3000);
  assert.equal(a.x, b.x);
  assert.notEqual(a.x, c.x);
});

test('Label kesulitan dipetakan ke lima tingkat yang benar', () => {
  assert.deepEqual([1,2,3,4,5].map(getElementalDifficultyLabel), ['Mudah','Normal','Menengah','Sulit','Expert']);
});

test('Mesin game menjalankan platform bergerak, siklus platform, pantulan, dan pijakan bertingkat', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /getElementalPlatformState\(platform, elapsedMs\)/);
  assert.match(game, /getElementalHazardState\(hazard, elapsedMs\)/);
  assert.match(game, /supportPlatformId/);
  assert.match(game, /platform\.kind === 'bounce'/);
  assert.match(game, /function checkPressurePlate\(\)[\s\S]*?const plateRect = \{ x:item\.x-/);
  assert.match(game, /levelElapsedMs\(\)/);
  assert.match(game, /level\.difficultyLabel/);
});

test('Pijakan khusus Bara dan Nira di Dunia 1 dapat dicapai melalui rangkaian lompatan yang masuk akal', () => {
  const jumpSpeed = 590;
  const gravity = 1480;
  const horizontalSpeed = 250;
  const maximumRise = jumpSpeed * jumpSpeed / (2 * gravity);
  const horizontalRange = rise => {
    if (rise > maximumRise) return -1;
    const landingTime = (jumpSpeed + Math.sqrt(jumpSpeed * jumpSpeed - 2 * gravity * Math.max(0, rise))) / gravity;
    return horizontalSpeed * landingTime;
  };
  const firstWorld = ELEMENTAL_LEVELS.slice(0, 10);
  for (const level of firstWorld) {
    for (const role of ['host','guest']) {
      const element = role === 'host' ? 'fire' : 'water';
      const plate = level.switches.find(item => item.element === element);
      const target = level.platforms.find(platform =>
        plate.x >= platform.x && plate.x <= platform.x + platform.w &&
        Math.abs(plate.y + (plate.h || 10) / 2 - platform.y) <= 2
      );
      if (!target) continue; // A floor-mounted plate is reachable without a jump.
      const reachable = new Set();
      const queue = [{ id:'floor', x:0, y:520, w:960, startX:level.spawn[role].x }];
      while (queue.length) {
        const source = queue.shift();
        for (const platform of level.platforms) {
          if (reachable.has(platform.id)) continue;
          const gap = source.id === 'floor'
            ? Math.max(0, platform.x - source.startX, source.startX - platform.x - platform.w)
            : Math.max(0, platform.x - (source.x + source.w), source.x - (platform.x + platform.w));
          const rise = source.y - platform.y;
          if (horizontalRange(rise) >= gap) {
            reachable.add(platform.id);
            queue.push(platform);
          }
        }
      }
      assert.ok(reachable.has(target.id), `level ${level.id} ${element} plate should be reachable from ${role} spawn`);
    }
  }
});


test('Sepuluh level Kedalaman Kristal memakai blueprint unik dan tantangan bertahap', () => {
  const worldTwo = ELEMENTAL_LEVELS.slice(10, 20);
  assert.equal(new Set(worldTwo.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    gems:level.gems, iceZones:level.iceZones, currents:level.currents
  }))).size, 10);
  assert.deepEqual(worldTwo.map(level => level.difficulty), [1,1,2,2,2,3,3,3,4,4]);
  assert.deepEqual(worldTwo.map(level => level.name), [
    'Retakan Pertama','Gema Biru','Lorong Pecahan','Cermin Es','Jembatan Prismatik',
    'Arus Terbalik','Menara Kristal','Ruang Resonansi','Badai Serpihan','Penjaga Geode'
  ]);
  assert.ok(worldTwo[0].platforms.some(platform => platform.kind === 'ice'));
  assert.ok(worldTwo[1].currents.length > 0);
  assert.ok(worldTwo[4].platforms.some(platform => platform.cycle));
  assert.ok(worldTwo[5].currents.some(current => current.reversePeriodMs));
  assert.ok(worldTwo[6].platforms.some(platform => platform.motion?.axis === 'y'));
  assert.ok(worldTwo[7].currents.some(current => current.forceY < 0));
  assert.ok(worldTwo[8].hazards.some(hazard => hazard.motion));
  assert.ok(worldTwo[9].iceZones.length && worldTwo[9].currents.length);
  for (const level of worldTwo) {
    assert.ok(level.features.length > 0, `level ${level.id} must have authored mechanics`);
    assert.ok(level.platforms.length >= 3, `level ${level.id} must have unique platforms`);
    for (const plate of level.switches) {
      assert.ok(plate.x + (plate.w || 52) / 2 < level.gate.x, `level ${level.id} ${plate.element} plate must remain before gate`);
    }
  }
});

test('Arus kristal memiliki dorongan yang deterministik, berdenyut, dan dapat berbalik arah', () => {
  const pulse = getElementalCurrentState({x:0,y:0,w:100,h:50,forceX:160,forceY:0,pulsePeriodMs:5200}, 900);
  const pulseAgain = getElementalCurrentState({x:0,y:0,w:100,h:50,forceX:160,forceY:0,pulsePeriodMs:5200}, 900);
  const laterPulse = getElementalCurrentState({x:0,y:0,w:100,h:50,forceX:160,forceY:0,pulsePeriodMs:5200}, 3500);
  assert.equal(pulse.forceX, pulseAgain.forceX);
  assert.notEqual(pulse.forceX, laterPulse.forceX);
  const reversing = {x:0,y:0,w:100,h:50,forceX:180,forceY:0,reversePeriodMs:6000};
  const forward = getElementalCurrentState(reversing, 900).forceX;
  const backward = getElementalCurrentState(reversing, 3900).forceX;
  assert.ok(forward > 0);
  assert.ok(backward < 0);
});

test('Permukaan es meningkatkan momentum sedangkan batu tetap memakai gesekan normal', () => {
  const iceLevel = getElementalLevel(11);
  const icePlatform = iceLevel.platforms.find(platform => platform.kind === 'ice');
  const stoneLevel = getElementalLevel(11);
  const stonePlatform = stoneLevel.platforms.find(platform => platform.kind === 'stone');
  const onIce = {x:icePlatform.x+icePlatform.w/2,y:icePlatform.y-17,grounded:true,supportPlatformId:icePlatform.id};
  const onStone = {x:stonePlatform.x+stonePlatform.w/2,y:stonePlatform.y-17,grounded:true,supportPlatformId:stonePlatform.id};
  assert.equal(isElementalPlayerOnIce(onIce, iceLevel), true);
  assert.equal(isElementalPlayerOnIce(onStone, stoneLevel), false);
  assert.ok(getElementalSurfaceFriction(onIce, iceLevel) > getElementalSurfaceFriction(onStone, stoneLevel));
  const floorIce = {x:220,y:503,grounded:true,supportPlatformId:null};
  assert.equal(isElementalPlayerOnIce(floorIce, getElementalLevel(11)), true);
});

test('Physics dan renderer benar-benar menggunakan arus serta permukaan es Dunia 2', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /getElementalCurrentState\(source, elapsedMs\)/);
  assert.match(game, /localPlayer\.vx \+= \(Number\(flow\.forceX\) \|\| 0\) \* dt/);
  assert.match(game, /localPlayer\.vy \+= \(Number\(flow\.forceY\) \|\| 0\) \* dt/);
  assert.match(game, /getElementalSurfaceFriction\(localPlayer, level\)/);
  assert.match(game, /function drawIceZones\(level, time\)/);
  assert.match(game, /function drawCurrentZones\(level, time, elapsedMs = 0\)/);
  assert.match(game, /drawIceZones\(level,time\)/);
  assert.match(game, /drawCurrentZones\(level,time,elapsedMs\)/);
});


test('Hazard kristal dapat menyala dan padam mengikuti siklus bersama', () => {
  const level = getElementalLevel(16);
  const hazard = level.hazards[0];
  const active = getElementalHazardState(hazard, 100);
  const inactive = getElementalHazardState(hazard, 4500);
  assert.equal(active.active, true);
  assert.equal(inactive.active, false);
  assert.equal(inactive.opacity, 0);
});

test('Kedua pijakan Dunia 2 berada pada platform aman yang dapat dijangkau dari spawn', () => {
  const jumpSpeed = 590;
  const gravity = 1480;
  const horizontalSpeed = 250;
  const maximumRise = jumpSpeed * jumpSpeed / (2 * gravity);
  const horizontalRange = rise => {
    if (rise > maximumRise) return -1;
    const landingTime = (jumpSpeed + Math.sqrt(jumpSpeed * jumpSpeed - 2 * gravity * Math.max(0, rise))) / gravity;
    return horizontalSpeed * landingTime;
  };
  for (const level of ELEMENTAL_LEVELS.slice(10, 20)) {
    for (const role of ['host','guest']) {
      const element = role === 'host' ? 'fire' : 'water';
      const plate = level.switches.find(item => item.element === element);
      const target = level.platforms.find(platform =>
        plate.x >= platform.x && plate.x <= platform.x + platform.w &&
        Math.abs(plate.y + (plate.h || 10) / 2 - platform.y) <= 2
      );
      assert.ok(target, `level ${level.id} ${element} plate must sit on a platform`);
      assert.equal(Boolean(target.cycle), false, `level ${level.id} ${element} plate must not depend on a timed platform`);
      assert.notEqual(target.motion?.axis, 'y', `level ${level.id} ${element} plate must not ride a vertical lift`);
      const reachable = new Set();
      const queue = [{ id:'floor', x:0, y:520, w:960, startX:level.spawn[role].x }];
      while (queue.length) {
        const source = queue.shift();
        for (const platform of level.platforms) {
          if (reachable.has(platform.id)) continue;
          const gap = source.id === 'floor'
            ? Math.max(0, platform.x - source.startX, source.startX - platform.x - platform.w)
            : Math.max(0, platform.x - (source.x + source.w), source.x - (platform.x + platform.w));
          const rise = source.y - platform.y;
          if (horizontalRange(rise) >= gap) {
            reachable.add(platform.id);
            queue.push(platform);
          }
        }
      }
      assert.ok(reachable.has(target.id), `level ${level.id} ${element} plate platform must be reachable`);
    }
  }
});


test('Sepuluh level Kerajaan Bara memakai blueprint unik dengan eskalasi tantangan bertahap', () => {
  const worldThree = ELEMENTAL_LEVELS.slice(20, 30);
  assert.equal(new Set(worldThree.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    gems:level.gems, valves:level.valves, sequence:level.switchSequence
  }))).size, 10);
  assert.deepEqual(worldThree.map(level => level.difficulty), [3,3,3,3,3,4,4,4,4,5]);
  assert.deepEqual(worldThree.map(level => level.name), [
    'Napas Lava','Uap Panas','Gerbang Panas','Jembatan Bara','Sungai Pendingin',
    'Sakelar Berantai','Lorong Uap','Lava Meninggi','Dua Katup','Jantung Tungku'
  ]);
  assert.ok(worldThree[0].hazards.some(hazard => hazard.visual === 'lava' && hazard.cycle));
  assert.ok(worldThree[1].hazards.some(hazard => hazard.type === 'steam' && hazard.cycle));
  assert.ok(worldThree[2].requiredValves.includes('north-valve'));
  assert.ok(worldThree[3].platforms.some(platform => platform.motion));
  assert.ok(worldThree[4].hazards.some(hazard => hazard.type === 'water') && worldThree[4].hazards.some(hazard => hazard.type === 'fire'));
  assert.deepEqual(worldThree[5].switchSequence, ['water','fire']);
  assert.ok(worldThree[6].hazards.filter(hazard => hazard.type === 'steam').length >= 3);
  assert.ok(worldThree[7].hazards.some(hazard => hazard.visual === 'lava' && hazard.motion?.axis === 'y'));
  assert.equal(worldThree[8].requiredValves.length, 2);
  assert.equal(worldThree[9].difficulty, 5);
  assert.deepEqual(worldThree[9].switchSequence, ['water','fire']);
  for (const level of worldThree) {
    assert.ok(level.features.length > 0, `level ${level.id} must have authored mechanics`);
    assert.ok(level.platforms.length >= 3, `level ${level.id} must have a specific platform layout`);
    for (const plate of level.switches) {
      assert.ok(plate.x + (plate.w || 52) / 2 < level.gate.x, `level ${level.id} ${plate.element} plate must remain before gate`);
    }
  }
});

test('Lava berdenyut dan ventilasi uap memakai fase deterministik serta uap berbahaya bagi kedua elemen', () => {
  const level21 = getElementalLevel(21);
  const lava = level21.hazards.find(hazard => hazard.visual === 'lava');
  const lavaOn = getElementalHazardState(lava, 100);
  const lavaOff = getElementalHazardState(lava, 4500);
  assert.equal(lavaOn.active, true);
  assert.equal(lavaOff.active, false);
  const steam = getElementalLevel(22).hazards.find(hazard => hazard.type === 'steam');
  assert.equal(getElementalHazardState(steam, 100).active, true);
  assert.equal(getElementalHazardState(steam, 4000).active, false);
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /hazard\.type === 'steam' \|\| hazard\.type !== safeType/);
  assert.match(game, /h\.visual === 'steam' \|\| h\.type === 'steam'/);
  assert.match(game, /h\.visual === 'lava'/);
});

test('Katup tersinkron dapat memadamkan hazard dan menjadi syarat pembukaan gerbang', () => {
  const worldThree = ELEMENTAL_LEVELS.slice(20, 30);
  const level23 = worldThree[2];
  const level29 = worldThree[8];
  assert.deepEqual(level23.requiredValves, ['north-valve']);
  assert.ok(level23.hazards.some(hazard => hazard.valveId === 'north-valve'));
  assert.deepEqual(level29.requiredValves, ['bara-valve','nira-valve']);
  for (const level of [level23, level29, worldThree[9]]) {
    for (const id of level.requiredValves) {
      const valve = level.valves.find(item => item.id === id);
      assert.ok(valve, `level ${level.id} valve ${id} must exist`);
      assert.ok(['fire','water'].includes(valve.element));
      assert.ok(level.hazards.some(hazard => hazard.valveId === id), `valve ${id} must control at least one hazard`);
    }
  }
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /function attemptValve\(valve\)/);
  assert.match(game, /levels', String\(currentLevel\), 'valves', valve\.id/);
  assert.match(game, /\(level\.requiredValves \|\| \[\]\)\.every\(valveIsOpen\)/);
  assert.match(game, /!hazard\.valveId \|\| !valveIsOpen\(hazard\.valveId\)/);
  assert.match(game, /drawValves\(level,time\)/);
});

test('Sakelar berurutan disimpan atomik pada satu simpul state dan diperiksa saat pemain menginjak plate', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /const sequence = level\.switchSequence \|\| \[\]/);
  assert.match(game, /state\.sequenceIndex = index \+ 1/);
  assert.match(game, /sequence\[sequenceIndex\] !== element/);
  assert.match(game, /ref\(db, path\('levels', String\(currentLevel\), 'switches'\)\)/);
  assert.match(game, /Urutan belum tepat/);
  assert.match(game, /function attemptSwitch\(forcedPlate = null\)/);
});

test('Kedua pijakan dan katup dunia Bara berada pada platform stabil yang dapat dijangkau dari spawn', () => {
  const jumpSpeed = 590;
  const gravity = 1480;
  const horizontalSpeed = 250;
  const maximumRise = jumpSpeed * jumpSpeed / (2 * gravity);
  const horizontalRange = rise => {
    if (rise > maximumRise) return -1;
    const landingTime = (jumpSpeed + Math.sqrt(jumpSpeed * jumpSpeed - 2 * gravity * Math.max(0, rise))) / gravity;
    return horizontalSpeed * landingTime;
  };
  for (const level of ELEMENTAL_LEVELS.slice(20, 30)) {
    for (const role of ['host','guest']) {
      const element = role === 'host' ? 'fire' : 'water';
      const plate = level.switches.find(item => item.element === element);
      const target = level.platforms.find(platform =>
        plate.x >= platform.x && plate.x <= platform.x + platform.w &&
        Math.abs(plate.y + (plate.h || 10) / 2 - platform.y) <= 2
      );
      assert.ok(target, `level ${level.id} ${element} plate must sit on a platform`);
      assert.equal(Boolean(target.cycle), false, `level ${level.id} plate must not depend on a timed platform`);
      assert.notEqual(target.motion?.axis, 'y', `level ${level.id} plate must not ride a vertical lift`);
      const reachable = new Set();
      const queue = [{ id:'floor', x:0, y:520, w:960, startX:level.spawn[role].x }];
      while (queue.length) {
        const source = queue.shift();
        for (const platform of level.platforms) {
          if (reachable.has(platform.id)) continue;
          const gap = source.id === 'floor'
            ? Math.max(0, platform.x - source.startX, source.startX - platform.x - platform.w)
            : Math.max(0, platform.x - (source.x + source.w), source.x - (platform.x + platform.w));
          const rise = source.y - platform.y;
          if (horizontalRange(rise) >= gap) {
            reachable.add(platform.id);
            queue.push(platform);
          }
        }
      }
      assert.ok(reachable.has(target.id), `level ${level.id} ${element} plate platform must be reachable`);
    }
    for (const valve of level.valves) {
      const platform = level.platforms.find(item => valve.x >= item.x && valve.x <= item.x + item.w && Math.abs(valve.y + 28 - item.y) <= 10);
      assert.ok(platform, `level ${level.id} valve ${valve.id} should be positioned next to a platform`);
    }
  }
});


test('Sepuluh level Reruntuhan Langit memakai blueprint unik dengan kesulitan bertahap', () => {
  const worldFour = ELEMENTAL_LEVELS.slice(30, 40);
  assert.equal(new Set(worldFour.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    windZones:level.windZones, windLevers:level.windLevers
  }))).size, 10);
  assert.deepEqual(worldFour.map(level => level.difficulty), [4,4,4,4,4,4,5,5,5,5]);
  assert.deepEqual(worldFour.map(level => level.name), [
    'Tangga Awan','Pulau Melayang','Lorong Angin','Menara Terbalik','Kunci Badai',
    'Jembatan Awan','Kubah Senyap','Portal Kembar','Labirin Langit','Penjaga Angin'
  ]);
  assert.ok(worldFour[0].windZones.some(zone => zone.forceY < 0));
  assert.ok(worldFour[1].platforms.some(platform => platform.motion));
  assert.ok(worldFour[2].windZones.some(zone => zone.forceX > 0) && worldFour[2].windZones.some(zone => zone.forceX < 0));
  assert.ok(worldFour[3].platforms.some(platform => platform.motion?.axis === 'y'));
  assert.deepEqual(worldFour[4].requiredWindLevers, ['storm-turn']);
  assert.ok(worldFour[4].windZones.some(zone => zone.leverId === 'storm-turn'));
  assert.ok(worldFour[5].platforms.filter(platform => platform.motion).length >= 2);
  assert.ok(worldFour[6].windZones.length >= 3);
  assert.equal(worldFour[7].requiredWindLevers.length, 2);
  assert.ok(worldFour[8].windZones.some(zone => zone.reversePeriodMs));
  assert.equal(worldFour[9].difficulty, 5);
  assert.equal(worldFour[9].requiredWindLevers.length, 2);
  for (const level of worldFour) {
    assert.ok(level.features.length > 0);
    assert.ok(level.windZones.length > 0);
    assert.ok(level.platforms.length >= 4);
    for (const plate of level.switches) {
      assert.ok(plate.x + (plate.w || 52) / 2 < level.gate.x);
    }
  }
});

test('Angin memiliki gaya deterministik, denyut bersama, pembalikan berkala, dan pembalikan tuas', () => {
  const pulseZone = {x:0,y:0,w:100,h:100,forceX:150,forceY:-80,pulsePeriodMs:6000,phaseMs:300};
  const a = getElementalWindState(pulseZone, 1200);
  const b = getElementalWindState(pulseZone, 1200);
  const later = getElementalWindState(pulseZone, 3900);
  assert.equal(a.forceX, b.forceX);
  assert.equal(a.forceY, b.forceY);
  assert.notEqual(a.forceX, later.forceX);
  const reverseZone = {x:0,y:0,w:100,h:100,forceX:170,forceY:-40,reversePeriodMs:6000};
  const east = getElementalWindState(reverseZone, 500);
  const west = getElementalWindState(reverseZone, 3500);
  assert.ok(east.forceX > 0);
  assert.ok(west.forceX < 0);
  const lever = getElementalWindState(reverseZone, 500, true);
  assert.ok(lever.forceX < 0);
  assert.ok(lever.forceY > 0);
});

test('Wind engine memakai gaya angin lokal dan jam Firebase, bukan hanya modifier visual', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /getElementalWindState\(source, elapsedMs, source\.leverId \? windLeverIsOn\(source\.leverId\) : false\)/);
  assert.match(game, /localPlayer\.vx \+= \(Number\(wind\.forceX\) \|\| 0\) \* dt \* 3\.4/);
  assert.match(game, /localPlayer\.vy \+= \(Number\(wind\.forceY\) \|\| 0\) \* dt \* 3\.4/);
  assert.match(game, /function drawWindZones\(level, time, elapsedMs = 0\)/);
  assert.match(game, /drawWindZones\(level,time,elapsedMs\)/);
  assert.match(game, /function drawSkyDecor\(level, time\)/);
  assert.match(game, /p\.kind === 'cloud'/);
});

test('Tuas angin tersinkron, hanya elemen pemilik dapat mengaktifkannya, dan menjadi syarat gerbang', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game, /function windLeverIsOn\(id\)/);
  assert.match(game, /\(level\.requiredWindLevers \|\| \[\]\)\.every\(windLeverIsOn\)/);
  assert.match(game, /function attemptWindLever\(lever\)/);
  assert.match(game, /'windLevers', lever\.id/);
  assert.match(game, /Tuas ini hanya dapat diaktifkan/);
  assert.match(game, /const nearbyWindLever = \(level\.windLevers \|\| \[\]\)\.find/);
  assert.match(game, /function drawWindLevers\(level, time\)/);
  for (const level of ELEMENTAL_LEVELS.slice(30,40)) {
    for (const id of level.requiredWindLevers) {
      const lever = level.windLevers.find(item => item.id === id);
      assert.ok(lever, `level ${level.id} wind lever ${id} must exist`);
      assert.ok(level.windZones.some(zone => zone.leverId === id), `wind lever ${id} must control a wind zone`);
    }
  }
});

test('Pijakan Dunia 4 berada di platform stabil yang terjangkau dari spawn dan tuas tidak berada di balik gerbang', () => {
  const jumpSpeed = 590;
  const gravity = 1480;
  const horizontalSpeed = 250;
  const maximumRise = jumpSpeed * jumpSpeed / (2 * gravity);
  const horizontalRange = rise => {
    if (rise > maximumRise) return -1;
    const landingTime = (jumpSpeed + Math.sqrt(jumpSpeed * jumpSpeed - 2 * gravity * Math.max(0, rise))) / gravity;
    return horizontalSpeed * landingTime;
  };
  for (const level of ELEMENTAL_LEVELS.slice(30,40)) {
    for (const role of ['host','guest']) {
      const element = role === 'host' ? 'fire' : 'water';
      const plate = level.switches.find(item => item.element === element);
      const target = level.platforms.find(platform => plate.x >= platform.x && plate.x <= platform.x + platform.w && Math.abs(plate.y + (plate.h || 10)/2 - platform.y) <= 2);
      assert.ok(target, `level ${level.id} ${element} plate must sit on a platform`);
      assert.equal(Boolean(target.cycle), false);
      assert.notEqual(target.motion?.axis, 'y');
      const reachable = new Set();
      const queue = [{id:'floor',x:0,y:520,w:960,startX:level.spawn[role].x}];
      while (queue.length) {
        const source = queue.shift();
        for (const platform of level.platforms) {
          if (reachable.has(platform.id)) continue;
          const gap = source.id === 'floor'
            ? Math.max(0,platform.x-source.startX,source.startX-platform.x-platform.w)
            : Math.max(0,platform.x-(source.x+source.w),source.x-(platform.x+platform.w));
          const rise = source.y-platform.y;
          if (horizontalRange(rise) >= gap) { reachable.add(platform.id); queue.push(platform); }
        }
      }
      assert.ok(reachable.has(target.id), `level ${level.id} ${element} plate must be reachable from ${role} spawn`);
    }
    for (const lever of level.windLevers) {
      assert.ok(lever.x + 18 < level.gate.x, `level ${level.id} lever ${lever.id} must remain before gate`);
      const platform = level.platforms.find(item => lever.x >= item.x && lever.x <= item.x + item.w && Math.abs(lever.y + 28 - item.y) <= 10);
      assert.ok(platform, `level ${level.id} lever ${lever.id} should sit next to a stable platform`);
      assert.equal(Boolean(platform.motion?.axis === 'y' || platform.cycle), false, `level ${level.id} lever ${lever.id} must not depend on a vertical/timed platform`);
    }
  }
});

test('Sepuluh level Jantung Kuno memakai blueprint khusus dan tantangan final bertahap', () => {
  const worldFive = ELEMENTAL_LEVELS.slice(40, 50);
  assert.equal(new Set(worldFive.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    iceZones:level.iceZones, currents:level.currents, windZones:level.windZones,
    valves:level.valves, windLevers:level.windLevers, sequence:level.switchSequence
  }))).size, 10);
  assert.deepEqual(worldFive.map(level => level.difficulty), [4,4,5,5,5,5,5,5,5,5]);
  assert.deepEqual(worldFive.map(level => level.name), [
    'Simpul Pertama','Gerbang Lima','Kristal Kembar','Ruang Sinkron','Jalur Terpilih',
    'Pilar Harmoni','Ujian Bara','Ujian Arus','Pintu Purba','Penyatuan Elemen'
  ]);
  assert.ok(worldFive[0].iceZones.length && worldFive[0].currents.length && worldFive[0].windZones.length);
  assert.equal(worldFive[1].requiredValves.length, 2);
  assert.equal(worldFive[2].requiredWindLevers.length, 2);
  assert.deepEqual(worldFive[3].switchSequence, ['water','fire']);
  assert.ok(worldFive[4].features.includes('split-element-routes'));
  assert.equal(worldFive[5].requiredValves.length, 2);
  assert.ok(worldFive[5].platforms.some(platform => platform.motion?.axis === 'y'));
  assert.ok(worldFive[6].hazards.some(hazard => hazard.visual === 'lava' && hazard.motion));
  assert.ok(worldFive[6].hazards.some(hazard => hazard.type === 'steam'));
  assert.ok(worldFive[7].iceZones.length && worldFive[7].currents.some(flow => flow.reversePeriodMs));
  assert.equal(worldFive[8].requiredValves.length, 2);
  assert.equal(worldFive[8].requiredWindLevers.length, 2);
  assert.deepEqual(worldFive[8].switchSequence, ['water','fire']);
  const finale = worldFive[9];
  assert.equal(finale.difficulty, 5);
  assert.equal(finale.requiredValves.length, 2);
  assert.equal(finale.requiredWindLevers.length, 2);
  assert.deepEqual(finale.switchSequence, ['water','fire']);
  assert.ok(finale.iceZones.length && finale.currents.length >= 2 && finale.windZones.length >= 2);
  assert.ok(finale.hazards.some(hazard => hazard.visual === 'lava'));
  assert.ok(finale.hazards.some(hazard => hazard.type === 'steam'));
  assert.ok(finale.hazards.some(hazard => hazard.type === 'water'));
});

test('Semua kontrol wajib Jantung Kuno berada pada pijakan stabil dan terjangkau dari kedua spawn', () => {
  const jumpSpeed = 590;
  const gravity = 1480;
  const horizontalSpeed = 250;
  const maximumRise = jumpSpeed * jumpSpeed / (2 * gravity);
  const horizontalRange = rise => {
    if (rise > maximumRise) return -1;
    const landingTime = (jumpSpeed + Math.sqrt(jumpSpeed * jumpSpeed - 2 * gravity * Math.max(0, rise))) / gravity;
    return horizontalSpeed * landingTime;
  };
  for (const level of ELEMENTAL_LEVELS.slice(40,50)) {
    const controls = [
      ...level.switches.map(item => ({kind:'switch',id:item.element,x:item.x,y:item.y,platformY:item.y+(item.h||10)/2,platformX:item.x})),
      ...(level.valves||[]).map(item => ({kind:'valve',id:item.id,x:item.x,y:item.y,platformY:item.y+28,platformX:item.x})),
      ...(level.windLevers||[]).map(item => ({kind:'lever',id:item.id,x:item.x,y:item.y,platformY:item.y+28,platformX:item.x}))
    ];
    for (const control of controls) {
      const platform = level.platforms.find(item =>
        control.platformX >= item.x && control.platformX <= item.x+item.w &&
        Math.abs(control.platformY-item.y) <= 3 && !item.motion && !item.cycle
      );
      assert.ok(platform, `level ${level.id} ${control.kind} ${control.id} must sit on a stable platform`);
      assert.ok(control.x < level.gate.x, `level ${level.id} ${control.kind} ${control.id} must stay before the gate`);
      for (const role of ['host','guest']) {
        const reached = new Set();
        const queue = [{id:'floor',x:0,y:520,w:960,startX:level.spawn[role].x}];
        while (queue.length) {
          const source = queue.shift();
          for (const candidate of level.platforms) {
            if (reached.has(candidate.id) || candidate.motion || candidate.cycle) continue;
            const gap = source.id === 'floor'
              ? Math.max(0,candidate.x-source.startX,source.startX-candidate.x-candidate.w)
              : Math.max(0,candidate.x-(source.x+source.w),source.x-(candidate.x+candidate.w));
            const rise = source.y-candidate.y;
            if (horizontalRange(rise) >= gap) {
              reached.add(candidate.id);
              queue.push(candidate);
            }
          }
        }
        assert.ok(reached.has(platform.id), `level ${level.id} ${role} must reach ${control.kind} ${control.id}`);
      }
    }
    for (const id of level.requiredValves) {
      const valve = level.valves.find(item => item.id === id);
      assert.ok(valve, `level ${level.id} required valve ${id} exists`);
      assert.ok(level.hazards.some(item => item.valveId === id), `level ${level.id} valve ${id} controls a hazard`);
    }
    for (const id of level.requiredWindLevers) {
      const lever = level.windLevers.find(item => item.id === id);
      assert.ok(lever, `level ${level.id} required lever ${id} exists`);
      assert.ok(level.windZones.some(item => item.leverId === id), `level ${level.id} lever ${id} controls a wind field`);
    }
    if (level.switchSequence) {
      assert.deepEqual([...level.switchSequence].sort(), ['fire','water']);
    }
  }
});

test('Finale Jantung Kuno memakai seluruh mekanik yang sudah dikenalkan dan tetap tersambung ke engine', () => {
  const finale = getElementalLevel(50);
  const game = readSource('../js/games/elemental-duo.js');
  assert.ok(finale.platforms.some(platform => platform.motion));
  assert.ok(finale.hazards.some(hazard => hazard.cycle));
  assert.ok(finale.hazards.some(hazard => hazard.motion));
  assert.ok(finale.iceZones.length);
  assert.ok(finale.currents.length);
  assert.ok(finale.windZones.length);
  assert.ok(finale.valves.length);
  assert.ok(finale.windLevers.length);
  assert.match(game, /getElementalCurrentState\(source, elapsedMs\)/);
  assert.match(game, /getElementalWindState\(source, elapsedMs/);
  assert.match(game, /getElementalSurfaceFriction\(localPlayer, level\)/);
  assert.match(game, /function attemptValve\(valve\)/);
  assert.match(game, /function attemptWindLever\(lever\)/);
  assert.match(game, /drawAncientDecor\(level,time\)/);
});
