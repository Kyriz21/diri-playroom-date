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
