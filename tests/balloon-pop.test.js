import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BALLOON_POP_DURATION_SECONDS, BALLOON_POP_MAX_OBJECTS, BALLOON_POP_FLIGHT_MS,
  BALLOON_POP_SPAWN_INTERVAL_MS, balloonRandom, createBalloon, getBalloonY,
  getBalloonX, findBalloonAtPoint, applyBalloonPop, summarizeBalloonHits,
  getBalloonPopRemaining, determineBalloonPopWinner, nextBalloonPopSeed
} from '../js/games/balloon-pop-logic.js';
const read = path => fs.readFileSync(new URL(path,import.meta.url),'utf8');

test('Balloon Pop is registered as game four with dedicated create/join routes and lazy module loading',()=>{
  const app=read('../js/app.js'), constants=read('../js/constants.js'), index=read('../index.html');
  assert.match(constants,/id: 'balloonpop'.*title: 'Balloon Pop'/);
  assert.match(app,/data-action="open-balloon-create"/);
  assert.match(app,/data-action="open-balloon-join"/);
  assert.match(app,/mountBalloonPop/);
  assert.match(index,/balloon-pop\.css/);
});

test('balloon generation is deterministic and bounded',()=>{
  assert.deepEqual(createBalloon(1234,22),createBalloon(1234,22));
  assert.notDeepEqual(createBalloon(1234,22),createBalloon(9876,22));
  assert.equal(createBalloon(1,-1),null);
  assert.equal(createBalloon(1,BALLOON_POP_MAX_OBJECTS),null);
});

test('balloons rise from below the board and drift only slightly',()=>{
  const item=createBalloon(44,2);
  assert.ok(getBalloonY(item,item.spawnAt)>1);
  assert.ok(getBalloonY(item,item.spawnAt+BALLOON_POP_FLIGHT_MS)<0);
  assert.ok(getBalloonX(item,item.spawnAt)>=0.07);
  assert.ok(getBalloonX(item,item.spawnAt+1500)<=0.93);
});

test('balloon kind score and hazard values are consistent',()=>{
  const found={};
  for(let seed=1;seed<1000&&Object.keys(found).length<4;seed++){
    for(let i=0;i<100;i++){const item=createBalloon(seed,i);found[item.kind]=item;}
  }
  assert.equal(found.normal.points,1);
  assert.equal(found.heart.points,5);
  assert.equal(found.gold.points,10);
  assert.equal(found.bomb.lifeLoss,1);
});

test('tapping balloons finds the nearest visible unclaimed balloon',()=>{
  const seed=42, item=createBalloon(seed,0), elapsed=item.spawnAt+1200;
  const x=getBalloonX(item,elapsed), y=getBalloonY(item,elapsed);
  const found=findBalloonAtPoint({seed,elapsedMs:elapsed,x:x*300,y:y*260,width:300,height:260});
  assert.equal(found.id,0);
  const claimed=findBalloonAtPoint({seed,elapsedMs:elapsed,hitIds:{0:true},x:x*300,y:y*260,width:300,height:260});
  assert.notEqual(claimed?.id,0);
});

test('normal, heart, gold and bomb hits update score and lives correctly',()=>{
  assert.deepEqual(applyBalloonPop({score:0,lives:3,popped:0},{kind:'normal',points:1,lifeLoss:0}),{score:1,lives:3,popped:1,finished:false,points:1,lifeLoss:0});
  assert.equal(applyBalloonPop({score:1,lives:3,popped:1},{kind:'heart',points:5,lifeLoss:0}).score,6);
  assert.equal(applyBalloonPop({score:1,lives:3,popped:1},{kind:'gold',points:10,lifeLoss:0}).score,11);
  assert.equal(applyBalloonPop({score:11,lives:3,popped:1},{kind:'bomb',points:0,lifeLoss:1}).lives,2);
  assert.equal(applyBalloonPop({score:0,lives:1,popped:0},{kind:'bomb',points:0,lifeLoss:1}).finished,true);
});

test('hit summaries count balloon classes and calculate remaining lives',()=>{
  const summary=summarizeBalloonHits({score:16,lives:2,popped:4,events:{a:{kind:'normal'},b:{kind:'heart'},c:{kind:'gold'},d:{kind:'bomb'}}});
  assert.deepEqual(summary,{score:16,lives:2,popped:4,normal:1,hearts:1,gold:1,bombs:1,finished:false});
});

test('timer, winner and rematch seed behave deterministically',()=>{
  assert.equal(BALLOON_POP_DURATION_SECONDS,60);
  assert.equal(getBalloonPopRemaining(10000,60,70000),0);
  assert.equal(determineBalloonPopWinner({host:{stats:{score:15}},guest:{stats:{score:8}}}).winner,'host');
  assert.equal(determineBalloonPopWinner({host:{stats:{score:8}},guest:{stats:{score:15}}}).winner,'guest');
  assert.equal(determineBalloonPopWinner({host:{stats:{score:8}},guest:{stats:{score:8}}}).winner,'draw');
  assert.equal(nextBalloonPopSeed(4,2),nextBalloonPopSeed(4,2));
  assert.notEqual(nextBalloonPopSeed(4,2),nextBalloonPopSeed(4,3));
  assert.equal(BALLOON_POP_FLIGHT_MS,3800);
  assert.equal(BALLOON_POP_SPAWN_INTERVAL_MS,600);
});

test('Firebase Rules allow Balloon Pop selection and scope player stats, hit records, avatars and rematch to each member',()=>{
  const rules=JSON.parse(read('../firebase-database.rules.json')).rules;
  assert.match(rules.rooms.$roomCode.lobby.selections.$role['.validate'],/balloonpop/);
  assert.match(rules.rooms.$roomCode.lobby.activeSession['.validate'],/balloonpop/);
  const roomGame=rules.roomGames.$roomCode.$sessionId;
  const game=roomGame.balloonPop;
  assert.ok(game.meta&&game.players&&game.rematchRequests);
  assert.match(game.meta['.write'],/balloonpop/);
  assert.match(game.players.$role.stats['.write'],/auth\.uid/);
  assert.match(game.players.$role.stats['.validate'],/score/);
  assert.match(game.players.$role.stats.events.$balloonId['.validate'],/normal\|heart\|gold\|bomb/);
  assert.match(game.rematchRequests.$role['.write'],/auth\.uid/);
  assert.match(roomGame.balloonPopAvatars.$role['.validate'],/character:/);
});

test('game UI has touch-ready boards, separate own/opponent lanes and shared readiness',()=>{
  const game=read('../js/games/balloon-pop.js'),css=read('../css/balloon-pop.css');
  assert.match(game,/data-bp-board/);
  assert.match(game,/pointerdown/);
  assert.match(game,/Aku siap bermain/);
  assert.match(game,/runTransaction\(statsRef\(role\)/);
  assert.match(css,/touch-action:none/);
  assert.match(game,/createImageBitmap/);
});

test('Balloon Pop supports player stats bootstrap before host meta initializes without opening unrelated paths',()=>{
  const rules=JSON.parse(read('../firebase-database.rules.json')).rules;
  const write=rules.roomGames.$roomCode.$sessionId.balloonPop.players.$role.stats['.write'];
  assert.match(write,/!root\.child\('roomGames'\).*meta.*exists\(\)/);
  assert.match(write,/gameId/);
  assert.match(write,/auth\.uid/);
});

test('Balloon Pop updates an atomic per-player stats transaction and only the current player board accepts taps',()=>{
  const game=read('../js/games/balloon-pop.js');
  assert.match(game,/runTransaction\(statsRef\(role\)/);
  assert.match(game,/event\.target\.closest\('\[data-bp-board\]'\)/);
  assert.match(game,/canvas\.dataset\.bpBoard!==role/);
  assert.match(game,/hitIds:\{\.\.\./);
});
