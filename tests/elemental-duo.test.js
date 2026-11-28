import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ELEMENTAL_LEVELS, ELEMENTAL_LEVEL_COUNT, ELEMENTAL_PROTOTYPE_LEVELS, ELEMENTAL_PROTOTYPE_LEVEL_COUNT, ELEMENTAL_WORLDS, ELEMENTAL_WORLD_WIDTH, ELEMENTAL_WORLD_HEIGHT, ELEMENTAL_FLOOR_Y, ELEMENTAL_MAP_VERSION, ELEMENTAL_CAMPAIGN_VERSION, ELEMENTAL_GRAVITY, ELEMENTAL_MOVE_SPEED, ELEMENTAL_JUMP_SPEED, getElementalLevel,
  createElementalPlayer, clampElementalPlayer, rectsOverlap, getElementalStars,
  getElementalViewport, getElementalCameraTarget, getElementalPrototypeLevel,
  getElementalPlatformState, getElementalHazardState, getElementalDifficultyLabel,
  getElementalCurrentState, getElementalWindState, isElementalPlayerOnIce, getElementalSurfaceFriction
} from '../js/games/elemental-duo-logic.js';


function jumpRangeForRise(rise) {
  const discriminant = ELEMENTAL_JUMP_SPEED ** 2 - 2 * ELEMENTAL_GRAVITY * rise;
  if (discriminant < 0) return -1;
  const time = (ELEMENTAL_JUMP_SPEED + Math.sqrt(discriminant)) / ELEMENTAL_GRAVITY;
  return ELEMENTAL_MOVE_SPEED * time + 28;
}

function platformGapForJump(a, b) {
  return Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w));
}

function reachablePlatformIdsForTest(level, startId) {
  const reached = new Set([startId]);
  const queue = [level.platforms.find(platform => platform.id === startId)].filter(Boolean);
  while (queue.length) {
    const source = queue.shift();
    for (const target of level.platforms) {
      if (reached.has(target.id)) continue;
      if (jumpRangeForRise(source.y - target.y) >= platformGapForJump(source, target)) {
        reached.add(target.id);
        queue.push(target);
      }
    }
  }
  return reached;
}

function supportForObject(level, object, kind = 'platform') {
  if (kind === 'switch') return level.platforms.find(platform =>
    object.platformId === platform.id && Math.abs(object.y + (object.h || 10) / 2 - platform.y) <= 2
  );
  if (kind === 'gem') return level.platforms.find(platform =>
    object.platformId === platform.id && Math.abs(object.y + 28 - platform.y) <= 2
  );
  if (kind === 'door') return level.platforms.find(platform =>
    object.platformId === platform.id && Math.abs(object.y + object.h - platform.y) <= 2
  );
  return level.platforms.find(platform =>
    object.platformId === platform.id && Math.abs(object.y + 13 - platform.y) <= 2
  );
}

test('Elemental Duo memiliki tepat 50 level unik dalam lima dunia', () => {
  assert.equal(ELEMENTAL_LEVELS.length, 50);
  assert.equal(ELEMENTAL_WORLDS.length, 5);
  assert.equal(new Set(ELEMENTAL_LEVELS.map(level => level.name)).size, 50);
  assert.deepEqual(ELEMENTAL_WORLDS.map(world => [world.firstLevel, world.lastLevel]), [[1,10],[11,20],[21,30],[31,40],[41,50]]);
  assert.equal(getElementalLevel(0).id, 1);
  assert.equal(getElementalLevel(51).id, 50);
});

test('Kesulitan 50 level meningkat bertahap di setiap dunia', () => {
  for (const world of ELEMENTAL_WORLDS) {
    const levels = ELEMENTAL_LEVELS.slice(world.firstLevel - 1, world.lastLevel);
    assert.equal(levels.length, 10, `${world.name} has ten levels`);
    for (let index = 1; index < levels.length; index++) {
      assert.ok(levels[index].difficulty >= levels[index - 1].difficulty,
        `${world.name} level ${levels[index].id} must not be easier by difficulty rating than the previous level`);
    }
    assert.ok(new Set(levels.map(level => level.mechanic)).size >= 8,
      `${world.name} introduces varied level mechanics`);
  }
});

test('Lima level percontohan berasal dari lima blueprint dunia yang berbeda', () => {
  assert.equal(ELEMENTAL_PROTOTYPE_LEVEL_COUNT,5);
  assert.equal(ELEMENTAL_PROTOTYPE_LEVELS.length,5);
  assert.deepEqual(ELEMENTAL_PROTOTYPE_LEVELS.map(level => level.worldIndex), [1,2,3,4,5]);
  assert.deepEqual(ELEMENTAL_PROTOTYPE_LEVELS.map(level => level.id), [1,2,3,4,5]);
  assert.equal(new Set(ELEMENTAL_PROTOTYPE_LEVELS.map(level => level.mapTopology.blueprintId)).size,5);
  for (const level of ELEMENTAL_PROTOTYPE_LEVELS) {
    assert.equal(level.mapTopology.route,'authored-blueprint-coop');
    assert.equal(level.mapTopology.handcrafted,true);
    assert.equal(level.mapTopology.repeatedTemplate,false);
    assert.ok(level.platforms.length>=3 && level.platforms.length<=8);
    assert.equal(level.ruinWalls.length,0,'no generated maze partitions are added on top of the authored geometry');
    assert.equal(level.mapTopology.wallFragmentCount,0);
    assert.deepEqual(Object.keys(level.mapTopology.characterRoutes).sort(),['fire','water']);
  }
});

test('Katup wajib pada level akhir memiliki ID konsisten dan mengendalikan hazard yang benar', () => {
  for (const level of [getElementalLevel(29),getElementalLevel(30),getElementalLevel(50)]) {
    for (const id of level.requiredValves) {
      const valve = level.valves.find(item => item.id === id);
      assert.ok(valve,`level ${level.id}: required valve ${id} exists exactly once`);
      assert.ok(level.hazards.some(hazard => hazard.valveId === id),`level ${level.id}: valve ${id} controls a hazard`);
    }
  }
  const finale = getElementalLevel(50);
  assert.equal(new Set(finale.valves.map(item=>item.id)).size,finale.valves.length,'valve IDs must be unique');
  assert.equal(finale.requiredValves.length,2);
});

test('Hazard berkala menyediakan jeda yang dapat dibaca sebelum pemain melintas', () => {
  const timedHazards = ELEMENTAL_LEVELS.flatMap(level => level.hazards
    .filter(hazard => hazard.cycle && Number(hazard.cycle.periodMs)>0)
    .map(hazard => ({level:level.id,hazard})));
  assert.ok(timedHazards.length>0);
  for (const {level,hazard} of timedHazards) {
    assert.ok(hazard.cycle.activeMs>0 && hazard.cycle.activeMs<hazard.cycle.periodMs,`level ${level}: ${hazard.id} must have an inactive interval`);
    assert.ok(hazard.cycle.periodMs-hazard.cycle.activeMs>=900,`level ${level}: ${hazard.id} needs a visible crossing window`);
  }
});

test('Semua kontrol yang dibutuhkan ditempatkan pada pijakan stabil milik rute yang benar', () => {
  for (const level of ELEMENTAL_LEVELS) {
    for (const element of ['fire','water']) {
      const reachable = reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]);
      const plate = level.switches.find(item=>item.element===element);
      assert.ok(reachable.has(plate.platformId),`level ${level.id}: ${element} can reach its switch`);
      for (const item of [...level.valves,...level.windLevers].filter(control => (control.element || control.approachElement) === element)) {
        const platform = supportForObject(level,item,'control');
        assert.ok(platform,`level ${level.id}: ${item.id} is supported`);
        assert.equal(Boolean(platform.motion || platform.cycle),false,`level ${level.id}: ${item.id} is on a stable platform`);
        assert.ok(reachable.has(platform.id),`level ${level.id}: ${element} can reach ${item.id}`);
      }
    }
  }
  const game=readSource('../js/games/elemental-duo.js');
  assert.match(game,/\(!item\.element \|\| item\.element === ownElement\)/,'neutral wind levers and valves can be used by either player');
});

test('Elemental Duo menjalankan kampanye penuh 50 level secara berurutan', () => {
  const game = readSource('../js/games/elemental-duo.js');
  assert.equal(ELEMENTAL_LEVEL_COUNT,50);
  assert.match(game,/ELEMENTAL_LEVEL_COUNT/);
  assert.match(game,/getElementalLevel/);
  assert.match(game,/if \(level >= ELEMENTAL_LEVEL_COUNT\)/);
  assert.match(game,/<small>\/ 50<\/small>/);
  assert.match(game,/campaignVersion:ELEMENTAL_CAMPAIGN_VERSION/);
  assert.match(game,/Number\(data\.meta\.campaignVersion\) !== ELEMENTAL_CAMPAIGN_VERSION/);
  assert.match(game,/const migrationPatch = \{ levels:null \}/);
  assert.match(game,/ready:false, complete:false, levelDeaths:0/);
  assert.doesNotMatch(game,/getElementalPrototypeLevel/);
  assert.doesNotMatch(game,/ELEMENTAL_PROTOTYPE_LEVEL_COUNT/);
  assert.match(game,/setText\('\[data-ed-finish-stars\]', `\$\{totalStars\} \/ 150`\)/);
  assert.match(game,/setText\('\[data-ed-finish-shards\]', `\$\{totalShards\} \/ 100`\)/);
  assert.match(game,/data-ed-finish-final-line/);
  assert.match(game,/previousResult\.stars/,'the completed level score is shown before advancing');
  assert.match(game,/drawVine\(/);
  assert.match(game,/const brickW = 54, brickH = 27/);
  assert.match(game,/function drawRuinWalls\(/);
  assert.match(game,/function drawMazeChambers\(/);
  assert.match(game,/function drawRuinRelief\(/);
  assert.doesNotMatch(game,/drawAncientDecor/);
  assert.match(game,/function drawSpirit\(/);
  assert.match(game,/function drawExit\(/);
});

test('Permata adalah bonus skor opsional, bukan syarat membuka pintu', () => {
  for (const level of ELEMENTAL_LEVELS) {
    assert.deepEqual(level.gems.map(gem=>gem.element).sort(),['fire','water'],`level ${level.id} has one gem per element`);
  }
  assert.equal(getElementalStars({deaths:0,shards:2}),3,'both gems and no falls award three stars');
  assert.equal(getElementalStars({deaths:0,shards:1}),2,'one gem does not block completion');
  assert.equal(getElementalStars({deaths:2,shards:0}),2,'gems are optional and two falls still allow two stars');
  assert.equal(getElementalStars({deaths:3,shards:2}),1,'more than two falls award one star');
  const game = readSource('../js/games/elemental-duo.js');
  assert.match(game,/item\.element === CHARACTER\[role\]\.element/);
  assert.match(game,/data\.levels\[String\(currentLevel\)\]\.gems\[gem\.element\] = true/,'committed gems are reflected locally before finish scoring');
  assert.match(game,/Permata adalah bonus penilaian, bukan kunci pintu/);
  assert.match(game,/maksimal dua jatuh gabungan/);
  assert.match(game,/Permata bonus \$\{claimed\} dari 2/);
  const gateFunction = game.match(/function gateIsOpen\(\) \{[\s\S]*?\n  \}/)?.[0] || '';
  assert.ok(gateFunction.includes("switchIsOn('fire')") && gateFunction.includes("switchIsOn('water')"));
  assert.doesNotMatch(gateFunction,/gems|shards/,'the gate does not require collectibles');
});

test('Setiap level memuat dua simpul, dua serpihan, gerbang, checkpoint, dan arena valid', () => {
  for (const level of ELEMENTAL_LEVELS) {
    assert.equal(level.switches.length, 2, `level ${level.id}`);
    assert.deepEqual(level.switches.map(item => item.element).sort(), ['fire','water']);
    assert.equal(level.gems.length, 2, `level ${level.id}`);
    assert.deepEqual(level.gems.map(item => item.element).sort(), ['fire','water']);
    assert.ok(level.platforms.length >= 2);
    assert.ok(level.hazards.length >= 1);
    assert.ok(level.exit.w > 0 && level.exit.h > 0);
    assert.equal(level.worldWidth, ELEMENTAL_WORLD_WIDTH);
    assert.equal(level.worldHeight, ELEMENTAL_WORLD_HEIGHT);
    assert.equal(level.mapVersion, ELEMENTAL_MAP_VERSION);
    assert.ok(level.platforms.some(platform => platform.y < 600), `level ${level.id} must explore an upper area`);
    assert.ok(level.spawn.host.x < level.spawn.guest.x);
    assert.ok(level.difficulty >= 1 && level.difficulty <= 5);
  }
});

test('Semua 50 level memakai geometri blueprint asli tanpa tumpukan template tambahan', () => {
  assert.equal(ELEMENTAL_MAP_VERSION,29);
  assert.equal(ELEMENTAL_LEVELS.length,50);
  assert.equal(new Set(ELEMENTAL_LEVELS.map(level=>level.mapTopology.blueprintId)).size,50);
  for (const level of ELEMENTAL_LEVELS) {
    assert.equal(level.mapTopology.route,'authored-blueprint-coop');
    assert.equal(level.mapTopology.repeatedTemplate,false);
    assert.equal(level.mapTopology.corridorCount,0);
    assert.equal(level.mapTopology.partitionCount,0);
    assert.equal(level.mapTopology.wallFragmentCount,0);
    assert.equal(level.ruinWalls.length,0);
    assert.equal(level.mapTopology.platformCount,level.platforms.length);
    assert.ok(level.platforms.length>=3 && level.platforms.length<=8,`level ${level.id} should remain visually readable`);
    for (const platform of level.platforms) {
      assert.ok(platform.x>=0 && platform.x+platform.w<=ELEMENTAL_WORLD_WIDTH,`level ${level.id}: ${platform.id} within room`);
      assert.ok(platform.y>=0 && platform.y+platform.h<=ELEMENTAL_FLOOR_Y,`level ${level.id}: ${platform.id} above floor`);
    }
  }
});

test('Platform fisik dan visual pada 50 level tidak saling menumpuk', () => {
  for (const level of ELEMENTAL_LEVELS) {
    for (let i=0;i<level.platforms.length;i++) {
      const a=level.platforms[i];
      for (let j=i+1;j<level.platforms.length;j++) {
        const b=level.platforms[j];
        const horizontalOverlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
        const physicalOverlap=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
        const visualOverlap=Math.min(a.y+a.visualH,b.y+b.visualH)-Math.max(a.y,b.y);
        assert.ok(!(horizontalOverlap>0 && physicalOverlap>0),`level ${level.id}: ${a.id} and ${b.id} physical collision boxes overlap`);
        assert.ok(!(horizontalOverlap>0 && visualOverlap>0),`level ${level.id}: ${a.id} and ${b.id} rendered platforms overlap`);
      }
    }
  }
});

test('Spawn, switch, permata, dan pintu berada di sisi elemen masing-masing', () => {
  const middle=ELEMENTAL_WORLD_WIDTH/2;
  for (const level of ELEMENTAL_LEVELS) {
    assert.ok(level.spawn.host.x<=middle-32,`level ${level.id}: Bara starts on west side`);
    assert.ok(level.spawn.guest.x>=middle+32,`level ${level.id}: Nira starts on east side`);
    assert.ok(level.switches.find(item=>item.element==='fire').x<=middle-32,`level ${level.id}: Bara's plate is west`);
    assert.ok(level.switches.find(item=>item.element==='water').x>=middle+32,`level ${level.id}: Nira's plate is east`);
    assert.ok(level.gems.find(item=>item.element==='fire').x<=middle-32,`level ${level.id}: Bara's bonus gem is west`);
    assert.ok(level.gems.find(item=>item.element==='water').x>=middle+32,`level ${level.id}: Nira's bonus gem is east`);
    assert.ok(level.doors.fire.x+level.doors.fire.w/2<=middle-32,`level ${level.id}: Bara's door is west`);
    assert.ok(level.doors.water.x+level.doors.water.w/2>=middle+32,`level ${level.id}: Nira's door is east`);
    assert.notEqual(level.doors.fire.platformId,undefined);
    assert.notEqual(level.doors.water.platformId,undefined);
  }
});

test('Setiap karakter dapat mencapai switch, permata, kontrol, dan pintu melalui lompatan normal', () => {
  for (const level of ELEMENTAL_LEVELS) {
    for (const element of ['fire','water']) {
      const role=element==='fire'?'host':'guest';
      const route=level.mapTopology.characterRoutes[element];
      const startId=level.mapTopology.startPlatformIds[element];
      const reachable=reachablePlatformIdsForTest(level,startId);
      assert.ok(route.length>=1,`level ${level.id} ${element} route exists`);
      assert.equal(route[0],startId,`level ${level.id} ${element} route starts correctly`);
      assert.equal(route.at(-1),level.doors[element].platformId,`level ${level.id} ${element} route ends at its door`);
      for(const id of route) assert.ok(reachable.has(id),`level ${level.id} ${element} can reach route platform ${id}`);
      const plate=level.switches.find(item=>item.element===element);
      const gem=level.gems.find(item=>item.element===element);
      assert.ok(reachable.has(plate.platformId),`level ${level.id} ${element} switch platform reachable`);
      assert.ok(reachable.has(gem.platformId),`level ${level.id} ${element} gem platform reachable`);
      assert.ok(reachable.has(level.doors[element].platformId),`level ${level.id} ${element} door platform reachable`);
      for(const control of [...level.valves,...level.windLevers].filter(item=>(item.element||item.approachElement)===element)) {
        assert.ok(reachable.has(control.platformId),`level ${level.id} ${element} reaches control ${control.id}`);
      }
      const startPlatform=level.platforms.find(item=>item.id===startId);
      assert.ok(startPlatform && level.spawn[role].x>=startPlatform.x+14 && level.spawn[role].x<=startPlatform.x+startPlatform.w-14);
      for(let i=1;i<route.length;i++){
        const from=level.platforms.find(item=>item.id===route[i-1]);
        const to=level.platforms.find(item=>item.id===route[i]);
        assert.ok(jumpRangeForRise(from.y-to.y)>=platformGapForJump(from,to),`level ${level.id} ${element} can jump ${route[i-1]} -> ${route[i]}`);
      }
    }
  }
});

test('Objek puzzle memiliki pijakan stabil, hazard tidak menutupi titik interaksi, dan gerbang tetap di tengah', () => {
  for(const level of ELEMENTAL_LEVELS){
    for(const element of ['fire','water']){
      const role=element==='fire'?'host':'guest';
      const spawn=level.spawn[role];
      const start=level.platforms.find(item=>item.id===level.mapTopology.startPlatformIds[element]);
      assert.ok(start && !start.motion && !start.cycle,`level ${level.id}: ${element} spawn platform stable`);
      const body={x:spawn.x-14,y:spawn.y-13,w:28,h:26};
      for(const hazard of level.hazards){
        if(hazard.type===element) continue;
        assert.equal(rectsOverlap(body,hazard),false,`level ${level.id}: ${element} does not spawn inside ${hazard.id}`);
      }
      const plate=level.switches.find(item=>item.element===element);
      assert.ok(supportForObject(level,plate,'switch'),`level ${level.id}: ${element} switch has a stable support`);
      const gem=level.gems.find(item=>item.element===element);
      assert.ok(supportForObject(level,gem,'gem'),`level ${level.id}: ${element} gem is positioned above a platform`);
      assert.ok(supportForObject(level,level.doors[element],'door'),`level ${level.id}: ${element} door sits on its route`);
    }
    assert.ok(level.gate && Math.abs(level.gate.x+level.gate.w/2-ELEMENTAL_WORLD_WIDTH/2)<20);
    assert.ok(level.checkpoint.x>40 && level.checkpoint.x<ELEMENTAL_WORLD_WIDTH-40);
    assert.equal(level.mapTopology.randomBranches,0);
  }
});

test('Bara dan Nira memiliki spawn serta state yang terpisah', () => {
  const bara = createElementalPlayer('host');
  const nira = createElementalPlayer('guest');
  assert.ok(bara.x < nira.x);
  assert.equal(bara.ready, false);
  assert.equal(nira.complete, false);
  const restored = createElementalPlayer('guest', { x:123, y:300, mapVersion:ELEMENTAL_MAP_VERSION, deaths:4, levelDeaths:2, shards:8, ready:true }, 10);
  assert.equal(restored.x, 123);
  assert.equal(restored.deaths, 4);
  assert.equal(restored.levelDeaths, 2);
  assert.equal(restored.shards, 8);
  const migrated = createElementalPlayer('host', {x:1200,y:150,mapVersion:5,complete:true,deaths:7,shards:11}, 10);
  assert.equal(migrated.x, getElementalLevel(10).spawn.host.x);
  assert.equal(migrated.complete, false);
  assert.equal(migrated.deaths, 7);
  assert.equal(migrated.shards, 11);
});

test('Collision rectangle dan batas posisi karakter konsisten', () => {
  assert.equal(rectsOverlap({x:0,y:0,w:10,h:10},{x:5,y:5,w:10,h:10}), true);
  assert.equal(rectsOverlap({x:0,y:0,w:10,h:10},{x:11,y:11,w:10,h:10}), false);
  const clamped = clampElementalPlayer({x:2000,y:900,vx:0,vy:0});
  assert.equal(clamped.x, 1142);
  assert.equal(clamped.y, 602);
});

test('Penilaian level memberikan maksimal tiga bintang', () => {
  assert.equal(getElementalStars({ deaths:0, shards:2 }), 3);
  assert.equal(getElementalStars({ deaths:0, shards:1 }), 2);
  assert.equal(getElementalStars({ deaths:2, shards:0 }), 2);
  assert.equal(getElementalStars({ deaths:3, shards:2 }), 1);
});

import fs from 'node:fs';
const readSource = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Elemental Duo diarsipkan dari menu tetapi konsep dan implementasinya tetap tersimpan', () => {
  const constants = readSource('../js/constants.js');
  const app = readSource('../js/app.js');
  const index = readSource('../index.html');
  assert.match(constants, /id: 'elementalduo'.*title: 'Elemental Duo'.*state: 'archived'/);
  assert.doesNotMatch(app, /data-action=\"open-elemental-create\"/);
  assert.doesNotMatch(app, /data-action=\"open-elemental-join\"/);
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
  assert.match(logic, /ELEMENTAL_GRAVITY = 1500/);
  assert.match(logic, /ELEMENTAL_JUMP_SPEED = 560/);
  const gravity = ELEMENTAL_GRAVITY;
  const jumpSpeed = ELEMENTAL_JUMP_SPEED;
  assert.ok((jumpSpeed * jumpSpeed) / (2 * gravity) > 100);
  assert.ok((jumpSpeed * jumpSpeed) / (2 * gravity) < 110, 'normal jump should clear a full separated room tier');
});

test('Setiap simpul dan titik checkpoint dapat didekati tanpa berada di zona elemen yang berbahaya', () => {
  for (const level of ELEMENTAL_LEVELS) {
    for (const node of level.switches) {
      const unsafeType = node.element === 'fire' ? 'water' : 'fire';
      const overlapsUnsafeZone = level.hazards.some(hazard => hazard.type === unsafeType && node.x >= hazard.x - 30 && node.x <= hazard.x + hazard.w + 30);
      assert.equal(overlapsUnsafeZone, false, `level ${level.id} simpul ${node.element}`);
    }
    const overlapsHazard = level.hazards.some(hazard => {
      const nearestX=Math.max(hazard.x,Math.min(level.checkpoint.x,hazard.x+hazard.w));
      const nearestY=Math.max(hazard.y,Math.min(level.checkpoint.y,hazard.y+hazard.h));
      return Math.hypot(level.checkpoint.x-nearestX,level.checkpoint.y-nearestY) <= (level.checkpoint.radius || 52);
    });
    assert.equal(overlapsHazard, false, `level ${level.id} checkpoint`);
  }
});

test('Setiap level memiliki dua pijakan aman, penghalang bersama, dan pintu khusus Bara serta Air', () => {
  for (const level of ELEMENTAL_LEVELS) {
    assert.deepEqual(level.switches.map(item => item.element).sort(), ['fire','water']);
    assert.ok(level.switches.every(item => item.w >= 48 && item.h >= 10));
    for (const plate of level.switches) {
      const supportedByFloor = level.floorSegments.some(segment => Math.abs(plate.y + plate.h / 2 - segment.y) <= 2 && plate.x >= segment.x && plate.x <= segment.x + segment.w);
      const supportedByPlatform = level.platforms.some(platform =>
        plate.x + plate.w / 2 > platform.x && plate.x - plate.w / 2 < platform.x + platform.w &&
        Math.abs((plate.y + plate.h / 2) - platform.y) <= 2
      );
      assert.ok(supportedByFloor || supportedByPlatform, `level ${level.id} plate ${plate.element} harus berada di lantai atau platform`);
    }
    assert.ok(level.gate && level.gate.w > 0 && level.gate.h > 0 && Math.max(level.gate.w,level.gate.h) >= 90);
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
  assert.match(game, /if \(!gateIsOpen\(\) && level\.gate\)/);
  assert.match(game, /rectsOverlap\(bodyNow, gate\)/);
  assert.match(game, /if \(gateIsOpen\(\) && rectsOverlap\(body, ownDoor\)/);
  assert.match(game, /function drawExit\(level, time\)/);
});

test('Landscape menampilkan satu ruang puzzle penuh; portrait mengikuti pemain secara horizontal', () => {
  const portrait = getElementalViewport(390, 844);
  const landscape = getElementalViewport(844, 390);
  assert.ok(portrait.viewWidth < 400, 'portrait shows a narrow horizontal slice');
  assert.equal(portrait.viewHeight, ELEMENTAL_WORLD_HEIGHT, 'portrait keeps the full room height visible');
  assert.ok(landscape.viewWidth >= ELEMENTAL_WORLD_WIDTH, 'landscape fits the whole room on screen');
  assert.ok(landscape.viewHeight >= ELEMENTAL_WORLD_HEIGHT, 'landscape fits the whole room vertically');
  const start = getElementalCameraTarget({x:80,y:533},{x:1080,y:533},landscape.viewWidth,landscape.viewHeight);
  const advanced = getElementalCameraTarget({x:720,y:360},{x:130,y:468},landscape.viewWidth,landscape.viewHeight);
  assert.equal(start.x, 0, 'single-screen landscape does not scroll');
  assert.equal(advanced.x, 0, 'single-screen landscape keeps the complete room visible');
  const portraitStart = getElementalCameraTarget({x:80,y:533},{x:1080,y:533},portrait.viewWidth,portrait.viewHeight);
  const portraitAdvanced = getElementalCameraTarget({x:720,y:360},{x:130,y:468},portrait.viewWidth,portrait.viewHeight);
  assert.ok(portraitAdvanced.x > portraitStart.x + 100, 'portrait camera follows local player horizontally');
  assert.ok(portraitAdvanced.x <= ELEMENTAL_WORLD_WIDTH - portrait.viewWidth);
});

test('Peta mini menampilkan jalur, pintu, posisi pemain, area kamera dan penunjuk pintu', () => {
  const game=readSource('../js/games/elemental-duo.js');
  assert.match(game,/function drawExplorationNavigator\(level, host, guest\)/);
  assert.match(game,/PETA LABIRIN/);
  assert.match(game,/for \(const element of \['fire','water'\]\)/);
  assert.match(game,/const camera = \{x:canvasView\.cameraX,y:canvasView\.cameraY/);
  assert.match(game,/const ownDoor = level\.doors\?\.\[ownElement\] \|\| level\.exit/);
  assert.doesNotMatch(game,/arrowX|arrowY|directional marker/);
  assert.match(game,/drawRuinWalls\(level,time\)/);
});

test('Elemental Duo memiliki mode potret dan layar penuh yang meminta orientasi landscape', () => {
  const game = readSource('../js/games/elemental-duo.js');
  const css = readSource('../css/elemental-duo.css');
  const index = readSource('../index.html');
  const app = readSource('../js/app.js');
  assert.match(game, /function resizeCanvasViewport\(force = false\)/);
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
  assert.match(css, /height:clamp\(340px,52svh,480px\)/);
  assert.match(css, /\.ed-game-panel:fullscreen/);
  assert.match(css, /ed-rotate-prompt/);
  assert.match(css, /ed-touch-controls\{position:absolute/);
  assert.match(css, /ed-game-panel\.ed-fullpage-fallback\{position:fixed;inset:0\}/);
  assert.match(index, /elemental-duo\.css\?v=0\.44\.0/);
  assert.match(app, /elemental-duo\.js\?v=0\.44\.0/);
  assert.match(index, /app\.js\?v=0\.51\.4/);
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
  assert.deepEqual(firstWorld.map(level => level.difficulty), [1,1,1,1,1,1,1,2,2,2]);
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
      assert.ok(level.platforms.some(platform => plate.x >= platform.x && plate.x <= platform.x + platform.w && Math.abs(plate.y + plate.h/2 - platform.y) <= 2), `level ${level.id} ${plate.element} plate harus ditopang platform`);
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

test('Pijakan Dunia 1 terjangkau langsung dari spawn masing-masing karakter', () => {
  for(const level of ELEMENTAL_LEVELS.slice(0,10)){
    for(const element of ['fire','water']){
      const reached=reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]);
      const plate=level.switches.find(item=>item.element===element);
      assert.ok(reached.has(plate.platformId),`level ${level.id}: ${element} plate reachable`);
    }
  }
});


test('Sepuluh level Kedalaman Kristal memakai blueprint unik dan tantangan bertahap', () => {
  const worldTwo = ELEMENTAL_LEVELS.slice(10, 20);
  assert.equal(new Set(worldTwo.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    gems:level.gems, iceZones:level.iceZones, currents:level.currents
  }))).size, 10);
  assert.deepEqual(worldTwo.map(level => level.difficulty), [1,1,1,1,2,2,2,2,2,3]);
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
      assert.ok(level.platforms.some(platform => plate.x >= platform.x && plate.x <= platform.x + platform.w && Math.abs(plate.y + plate.h/2 - platform.y) <= 2), `level ${level.id} ${plate.element} plate must be supported`);
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
  const crystalIceLevel = getElementalLevel(11);
  const icePatch = crystalIceLevel.iceZones[0];
  const floorIce = {x:icePatch.x+20,y:icePatch.y-5,grounded:true,supportPlatformId:null};
  assert.equal(isElementalPlayerOnIce(floorIce, crystalIceLevel), true);
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
  const hazard = level.hazards.find(item=>item.cycle && getElementalHazardState(item,4500).active===false);
  assert.ok(hazard,'level contains a timed hazard with an inactive phase at the test timestamp');
  const active = getElementalHazardState(hazard, 100);
  const inactive = getElementalHazardState(hazard, 4500);
  assert.equal(active.active, true);
  assert.equal(inactive.active, false);
  assert.equal(inactive.opacity, 0);
});

test('Pijakan Dunia 2 berada pada permukaan stabil dan dapat dicapai dari spawn', () => {
  for(const level of ELEMENTAL_LEVELS.slice(10,20)){
    for(const element of ['fire','water']){
      const plate=level.switches.find(item=>item.element===element);
      const platform=supportForObject(level,plate,'switch');
      assert.ok(platform,`level ${level.id}: ${element} plate has support`);
      assert.equal(Boolean(platform.motion||platform.cycle),false,`level ${level.id}: plate surface stable`);
      assert.ok(reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]).has(platform.id));
    }
  }
});


test('Sepuluh level Kerajaan Bara memakai blueprint unik dengan eskalasi tantangan bertahap', () => {
  const worldThree = ELEMENTAL_LEVELS.slice(20, 30);
  assert.equal(new Set(worldThree.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    gems:level.gems, valves:level.valves, sequence:level.switchSequence
  }))).size, 10);
  assert.deepEqual(worldThree.map(level => level.difficulty), [2,2,2,2,2,3,3,3,3,3]);
  assert.deepEqual(worldThree.map(level => level.name), [
    'Napas Lava','Uap Panas','Gerbang Panas','Jembatan Bara','Sungai Pendingin',
    'Sakelar Berantai','Lorong Uap','Lava Meninggi','Dua Katup','Jantung Tungku'
  ]);
  assert.ok(worldThree[0].hazards.some(hazard => hazard.visual === 'lava' && hazard.cycle));
  assert.ok(worldThree[1].hazards.some(hazard => hazard.type === 'steam' && hazard.cycle));
  assert.ok(worldThree[2].requiredValves.some(id=>id.endsWith('north-valve')));
  assert.ok(worldThree[3].platforms.some(platform => platform.motion));
  assert.ok(worldThree[4].hazards.some(hazard => hazard.type === 'water') && worldThree[4].hazards.some(hazard => hazard.type === 'fire'));
  assert.deepEqual(worldThree[5].switchSequence, ['water','fire']);
  assert.ok(worldThree[6].hazards.filter(hazard => hazard.type === 'steam').length >= 3);
  assert.ok(worldThree[7].hazards.some(hazard => hazard.visual === 'lava' && hazard.motion?.axis === 'y'));
  assert.equal(worldThree[8].requiredValves.length, 2);
  assert.equal(worldThree[9].difficulty, 3);
  assert.deepEqual(worldThree[9].switchSequence, ['water','fire']);
  for (const level of worldThree) {
    assert.ok(level.features.length > 0, `level ${level.id} must have authored mechanics`);
    assert.ok(level.platforms.length >= 3, `level ${level.id} must have a specific platform layout`);
    for (const plate of level.switches) {
      assert.ok(level.platforms.some(platform => plate.x >= platform.x && plate.x <= platform.x + platform.w && Math.abs(plate.y + plate.h/2 - platform.y) <= 2), `level ${level.id} ${plate.element} plate must be supported`);
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
  assert.equal(level23.requiredValves.length,1);
  assert.ok(level23.requiredValves[0].endsWith('north-valve'));
  assert.ok(level23.hazards.some(hazard => hazard.valveId === level23.requiredValves[0]));
  assert.deepEqual(level29.requiredValves.map(id=>id.replace(/^level-29-/,'' )).sort(),['bara-valve','nira-valve']);
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

test('Pijakan dan katup Kerajaan Bara berada pada platform stabil yang dapat dicapai pemiliknya', () => {
  for(const level of ELEMENTAL_LEVELS.slice(20,30)){
    for(const element of ['fire','water']){
      const plate=level.switches.find(item=>item.element===element);
      const support=supportForObject(level,plate,'switch');
      assert.ok(support && !support.motion && !support.cycle,`level ${level.id} ${element} plate stable`);
      assert.ok(reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]).has(support.id));
      for(const valve of level.valves.filter(item=>item.element===element)){
        const platform=supportForObject(level,valve,'control');
        assert.ok(platform && !platform.motion && !platform.cycle,`level ${level.id} valve ${valve.id} stable`);
        assert.ok(reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]).has(platform.id));
      }
    }
  }
});


test('Sepuluh level Reruntuhan Langit memakai blueprint unik dengan kesulitan bertahap', () => {
  const worldFour = ELEMENTAL_LEVELS.slice(30, 40);
  assert.equal(new Set(worldFour.map(level => JSON.stringify({
    platforms:level.platforms, hazards:level.hazards, switches:level.switches,
    windZones:level.windZones, windLevers:level.windLevers
  }))).size, 10);
  assert.deepEqual(worldFour.map(level => level.difficulty), [2,2,2,2,3,3,3,3,4,4]);
  assert.deepEqual(worldFour.map(level => level.name), [
    'Tangga Awan','Pulau Melayang','Lorong Angin','Menara Terbalik','Kunci Badai',
    'Jembatan Awan','Kubah Senyap','Portal Kembar','Labirin Langit','Penjaga Angin'
  ]);
  assert.ok(worldFour[0].windZones.some(zone => zone.forceY < 0));
  assert.ok(worldFour[1].platforms.some(platform => platform.motion));
  assert.ok(worldFour[2].windZones.some(zone => zone.forceX > 0) && worldFour[2].windZones.some(zone => zone.forceX < 0));
  assert.ok(worldFour[3].platforms.some(platform => platform.motion?.axis === 'y'));
  assert.equal(worldFour[4].requiredWindLevers.length,1);
  assert.ok(worldFour[4].requiredWindLevers[0].endsWith('storm-turn'));
  assert.ok(worldFour[4].windZones.some(zone => zone.leverId === worldFour[4].requiredWindLevers[0]));
  assert.ok(worldFour[5].platforms.filter(platform => platform.motion).length >= 2);
  assert.ok(worldFour[6].windZones.length >= 3);
  assert.equal(worldFour[7].requiredWindLevers.length, 2);
  assert.ok(worldFour[8].windZones.some(zone => zone.reversePeriodMs));
  assert.equal(worldFour[9].difficulty, 4);
  assert.equal(worldFour[9].requiredWindLevers.length, 2);
  for (const level of worldFour) {
    assert.ok(level.features.length > 0);
    assert.ok(level.windZones.length > 0);
    assert.ok(level.platforms.length >= 4);
    for (const plate of level.switches) {
      assert.ok(level.platforms.some(platform => plate.x >= platform.x && plate.x <= platform.x + platform.w && Math.abs(plate.y + plate.h/2 - platform.y) <= 2));
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

test('Pijakan dan tuas Reruntuhan Langit dapat dicapai dan tidak bergantung pada pijakan bergerak', () => {
  for(const level of ELEMENTAL_LEVELS.slice(30,40)){
    for(const element of ['fire','water']){
      const plate=level.switches.find(item=>item.element===element);
      const support=supportForObject(level,plate,'switch');
      assert.ok(support && !support.motion && !support.cycle,`level ${level.id} ${element} plate stable`);
      const reachable=reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]);
      assert.ok(reachable.has(support.id));
      for(const lever of level.windLevers.filter(item=>(item.element||item.approachElement)===element)){
        const platform=supportForObject(level,lever,'control');
        assert.ok(platform && !platform.motion && !platform.cycle,`level ${level.id} lever ${lever.id} stable`);
        assert.ok(reachable.has(platform.id),`level ${level.id} ${element} reaches lever ${lever.id}`);
      }
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
  assert.deepEqual(worldFive.map(level => level.difficulty), [3,3,3,3,3,4,4,4,4,5]);
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

test('Semua kontrol wajib Jantung Kuno terjangkau oleh karakter yang ditugaskan', () => {
  for(const level of ELEMENTAL_LEVELS.slice(40,50)){
    for(const element of ['fire','water']){
      const reached=reachablePlatformIdsForTest(level,level.mapTopology.startPlatformIds[element]);
      const plate=level.switches.find(item=>item.element===element);
      assert.ok(reached.has(plate.platformId),`level ${level.id}: ${element} switch reachable`);
      for(const control of [...level.valves,...level.windLevers].filter(item=>(item.element||item.approachElement)===element)){
        const support=supportForObject(level,control,'control');
        assert.ok(support && !support.motion && !support.cycle,`level ${level.id}: ${control.id} stable`);
        assert.ok(reached.has(support.id),`level ${level.id}: ${element} reaches ${control.id}`);
      }
    }
    for(const id of level.requiredValves){
      assert.ok(level.valves.some(item=>item.id===id));
      assert.ok(level.hazards.some(item=>item.valveId===id));
    }
    for(const id of level.requiredWindLevers){
      assert.ok(level.windLevers.some(item=>item.id===id));
      assert.ok(level.windZones.some(item=>item.leverId===id));
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
  assert.match(game, /drawRuinRelief\(level,time\)/);
  const relief = game.match(/function drawRuinRelief\(level, time\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.match(relief, /const panels = \[/, 'relief uses broken rectangular aqueduct panels');
  assert.doesNotMatch(relief, /quadraticCurveTo|ellipse\(/, 'old circular/arched rune decoration is removed');
});


test('Room map v29 menggunakan lima puluh blueprint individual dan tidak menambah dinding palsu', () => {
  assert.equal(ELEMENTAL_MAP_VERSION,29);
  for(const level of ELEMENTAL_LEVELS){
    assert.equal(level.mapTopology.blueprintId,level.name);
    assert.equal(level.mapTopology.handcrafted,true);
    assert.equal(level.mapTopology.handcraftedClassic,true);
    assert.equal(level.mapTopology.repeatedTemplate,false);
    assert.equal(level.mapTopology.platformCount,level.platforms.length);
    assert.equal(level.ruinWalls.length,0);
    assert.equal(level.mapTopology.characterRoutes.fire[0],level.mapTopology.startPlatformIds.fire);
    assert.equal(level.mapTopology.characterRoutes.water[0],level.mapTopology.startPlatformIds.water);
    for(const platform of level.platforms){
      assert.ok(platform.visualH<=28,`level ${level.id} ${platform.id} must not visually become a deep shelf`);
      assert.equal(platform.corridor,false);
    }
  }
});

test('Kontrol analog hanya menggerakkan kiri/kanan; lompatan tetap memakai tombol terpisah', () => {
  const game=readSource('../js/games/elemental-duo.js');
  assert.match(game,/moveControls\.style\.setProperty\('display', controlMode === 'analog' \? 'none' : 'flex', 'important'\)/);
  assert.match(game,/analogPad\.style\.setProperty\('display', controlMode === 'analog' \? 'grid' : 'none', 'important'\)/);
  const analogHandler = game.match(/function updateAnalogStick\(event\) \{([\s\S]*?)\n  \}\n\n  function bindAnalogStick/);
  assert.ok(analogHandler, 'analog handler exists');
  assert.match(analogHandler[1],/const x = dx;[\s\S]*?input\.left = x < -\.22;[\s\S]*?input\.right = x > \.22;/);
  assert.doesNotMatch(analogHandler[1],/input\.jump|jumpQueued/,'analog Y axis must never trigger jump');
  assert.match(game,/if \(key === 'jump'\) \{ input\.jump = true; input\.jumpQueued = true; \}/,'jump is queued only by the separate jump control');
});

test('Tombol interaksi hanya muncul dekat katup atau tuas, sedangkan pijakan otomatis', () => {
  const game=readSource('../js/games/elemental-duo.js');
  assert.match(game,/function updateInteractControl\(level\)/);
  assert.match(game,/button\.hidden = !nearby/);
  assert.match(game,/actionLabel:'PUTAR KATUP'/);
  assert.match(game,/actionLabel:'UBAH ANGIN'/);
  assert.match(game,/function checkPressurePlate\(\)/);
});

test('Lompatan mobile lebih toleran dengan coyote time dan jump buffer', () => {
  const game=readSource('../js/games/elemental-duo.js');
  assert.match(game,/let coyoteTimeRemaining = 0/);
  assert.match(game,/let jumpBufferRemaining = 0/);
  assert.match(game,/jumpBufferRemaining = 0\.17/);
  assert.match(game,/coyoteTimeRemaining = 0\.14/);
  assert.match(game,/jumpBufferRemaining > 0 && \(localPlayer\.grounded \|\| coyoteTimeRemaining > 0\)/);
});

test('Fullscreen landscape is portalled to body, uses stable viewport and exposes translucent analog controls', () => {
  const game=readSource('../js/games/elemental-duo.js');
  const css=readSource('../css/elemental-duo.css');
  assert.match(game,/function activateFullPagePortal\(\)/);
  assert.match(game,/document\.body\.appendChild\(gamePanel\)/);
  assert.match(game,/document\.documentElement\.classList\.add\('ed-fullpage-active'\)/);
  assert.match(game,/function restoreFullPagePortal\(\)/);
  assert.match(game,/document\.documentElement\.classList\.remove\('ed-fullpage-active'\)/);
  assert.match(game,/data-ed-analog-pad/);
  assert.match(game,/function bindAnalogStick\(\)/);
  assert.match(game,/pointercancel/);
  assert.match(game,/setControlMode\('analog'\)/);
  assert.match(game,/scheduleViewportMeasure\(force = false\)/);
  assert.doesNotMatch(game,/visualViewport\?\.addEventListener\?\.\('resize'/);
  assert.match(css,/height:100svh/);
  assert.match(css,/ed-game-panel:fullscreen[\s\S]*?height:100dvh/);
  assert.match(css,/body\.ed-game-active #app\.page-content[\s\S]*?position:fixed/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css,/html\.ed-fullpage-active/);
  assert.match(css,/body\.ed-fullpage-active/);
  assert.match(css,/rgba\(255,255,255,\.075\)/);
  assert.match(css,/data-display-mode="portrait"\]\[data-control-mode="analog"\] \.ed-analog-pad/);
  assert.match(css,/ed-analog-knob/);
});
