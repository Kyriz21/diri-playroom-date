import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canStartGame } from '../js/room-utils.js';

const root = new URL('../', import.meta.url);

function photoboothRoom() {
  return {
    host: { uid: 'host', name: 'Pembuat' },
    guest: null,
    lobby: {
      selections: { host: 'photobooth', guest: '' },
      ready: { host: true, guest: false },
      activeSession: null
    }
  };
}

test('Diri. Playroom Date waits until the invited player has joined before auto-start', () => {
  const room = photoboothRoom();
  assert.equal(canStartGame(room), false);
  room.guest = { uid: 'guest', name: 'Tamu' };
  room.lobby.selections.guest = 'photobooth';
  room.lobby.ready.guest = true;
  assert.equal(canStartGame(room), true);
  room.lobby.activeSession = { gameId: 'photobooth' };
  assert.equal(canStartGame(room), false);
});

test('Foto Sendiri entry does not statically load Firebase', async () => {
  const app = await readFile(new URL('js/app.js', root), 'utf8');
  const photobooth = await readFile(new URL('js/photobooth/photobooth.js', root), 'utf8');
  assert.doesNotMatch(app, /^import\s+.*from\s+['"]\.\/firebase\.js['"]/m);
  assert.match(app, /import\('\.\/firebase\.js'\)/);
  assert.doesNotMatch(photobooth, /^import\s+.*from\s+['"]\.\.\/firebase\.js['"]/m);
  assert.match(photobooth, /if \(standalone\)/);
  assert.match(photobooth, /await import\('\.\.\/firebase\.js'\)/);
});

test('new landing has three distinct Photobooth entry actions', async () => {
  const app = await readFile(new URL('js/app.js', root), 'utf8');
  assert.match(app, /data-action="open-create"/);
  assert.match(app, /data-action="open-join"/);
  assert.match(app, /data-action="open-solo"/);
});

test('Firebase Web App config is connected to the new Diri Playroom Date project', async () => {
  const firebase = await readFile(new URL('js/firebase.js', root), 'utf8');
  assert.match(firebase, /apiKey: 'AIzaSyBC-hBpMcJCN1BsIe6oo2LZ72QKh2YzIU4'/);
  assert.match(firebase, /authDomain: 'diri-playroom-date\.firebaseapp\.com'/);
  assert.match(firebase, /projectId: 'diri-playroom-date'/);
  assert.match(firebase, /databaseURL: 'https:\/\/diri-playroom-date-default-rtdb\.asia-southeast1\.firebasedatabase\.app'/);
  assert.match(firebase, /appId: '1:667695982695:web:acd2dae896fc75049eccc2'/);
  assert.match(firebase, /isFirebaseConfigured/);
});

test('Foto Sendiri requires four camera captures before opening the editor', async () => {
  const photobooth = await readFile(new URL('js/photobooth/photobooth.js', root), 'utf8');
  assert.match(photobooth, /let soloPhase = 'frame'/);
  assert.match(photobooth, /Pilih bingkai fotomu/);
  assert.match(photobooth, /Ambil empat foto terlebih dahulu|Ambil foto satu per satu/);
  assert.match(photobooth, /data-pb="capture"/);
  assert.match(photobooth, /data-pb="solo-continue"/);
  assert.match(photobooth, /if \(soloPhase === 'frame'\)/);
  assert.match(photobooth, /if \(soloPhase === 'capture'\)/);
  assert.match(photobooth, /data-pb=\"solo-start-capture\"/);
  assert.doesNotMatch(photobooth, /id="pb-solo-files"/);
  const soloCaptureView = photobooth.slice(photobooth.indexOf('function renderSolo()'), photobooth.indexOf('async function openKamera()'));
  assert.doesNotMatch(soloCaptureView, /Pilih empat foto|pb-solo-files/);
  assert.match(photobooth, /Ambil foto berikutnya/);
  assert.match(photobooth, /Kembali ke editor|Edit strip fotomu/);
});


test('Love Match, Color Match, IQ Duel, and Arcade use an explicit player lobby; Bomber Arena is archived', async () => {
  const app = await readFile(new URL('js/app.js', root), 'utf8');
  const rooms = await readFile(new URL('js/services/room-service.js', root), 'utf8');
  const utils = await readFile(new URL('js/room-utils.js', root), 'utf8');
  assert.match(app, /EXPLICIT_LOBBY_GAMES = new Set\(\['lovematch', 'colormatch', 'iqduel', 'arcade'\]\)/);
  assert.match(app, /data-action="toggle-room-ready"/);
  assert.match(app, /data-action="start-room-game"/);
  assert.match(app, /room\.presence\?\.host\?\.connected === true/);
  assert.match(app, /room\.presence\?\.guest\?\.connected === true/);
  assert.match(app, /!needsExplicitLobby\(room\.lobby\?\.selections\?\.host\)/);
  assert.match(rooms, /ready: \{ host: !needsExplicitLobby\(gameId\), guest: false \}/);
  assert.match(rooms, /'lobby\/ready\/guest': !needsExplicitLobby/);
  assert.match(rooms, /Kedua perangkat harus online di lobi/);
  assert.match(rooms, /Kedua perangkat harus tetap online/);
  assert.match(rooms, /const explicitLobby = needsExplicitLobby/);
  assert.match(utils, /export function isSelectableGameId/);
  assert.match(utils, /isSelectableGameId\(selected\)/);
});

test('home menyediakan preview visual untuk seluruh mini-game unggulan yang sebelumnya hanya berupa copy', async () => {
  const app = await readFile(new URL('js/app.js', root), 'utf8');
  for (const preview of ['draw-home-preview', 'guess-home-preview', 'bomb-home-preview', 'balloon-home-preview']) {
    assert.ok(app.includes(preview), `preview ${preview} harus tersedia di home`);
  }
  assert.match(app, /arcade-preview-screen/);
  assert.match(app, /love-preview-question/);
  assert.match(app, /color-preview-swatch/);
  assert.match(app, /iq-preview-grid/);
  assert.match(app, /date-film-strip/);
  assert.doesNotMatch(app, /<section class="bomber-landing-card">/);
  assert.doesNotMatch(app, /data-action="open-bomber-(?:create|join)"/);
});
