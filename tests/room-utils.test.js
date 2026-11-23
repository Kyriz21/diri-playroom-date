import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRoomCode, generateRoomCode, getPlayerRole, isRoomExpired,
  canStartGame, canClearGuest, formatRemaining
} from '../js/room-utils.js';
import { ROOM_TTL_MS, RECONNECT_GRACE_MS } from '../js/constants.js';

const sampleRoom = () => ({
  host: { uid: 'host-uid', name: 'Host' },
  guest: { uid: 'guest-uid', name: 'Guest' },
  lastMeaningfulActivityAt: 1_000_000,
  lobby: {
    selections: { host: 'thisorthat', guest: 'thisorthat' },
    ready: { host: true, guest: true },
    activeSession: null
  }
});

test('normalizes room codes to uppercase alphanumeric six characters', () => {
  assert.equal(normalizeRoomCode(' ab-23cd99 '), 'AB23CD');
  assert.equal(normalizeRoomCode('abc'), 'ABC');
});

test('generates a six-character code from the ambiguity-safe alphabet', () => {
  const fakeCrypto = { getRandomValues: (bytes) => bytes.fill(0) };
  const code = generateRoomCode(fakeCrypto);
  assert.equal(code, 'AAAAAA');
  assert.equal(code.length, 6);
  assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
});

test('resolves host and guest roles by UID only', () => {
  const room = sampleRoom();
  assert.equal(getPlayerRole(room, 'host-uid'), 'host');
  assert.equal(getPlayerRole(room, 'guest-uid'), 'guest');
  assert.equal(getPlayerRole(room, 'new-uid'), null);
});

test('expires a room at the 24-hour inactivity boundary', () => {
  const room = sampleRoom();
  assert.equal(isRoomExpired(room, 1_000_000 + ROOM_TTL_MS - 1), false);
  assert.equal(isRoomExpired(room, 1_000_000 + ROOM_TTL_MS), true);
});

test('requires matching selections and both Ready flags before Start', () => {
  const room = sampleRoom();
  assert.equal(canStartGame(room), true);
  room.lobby.ready.guest = false;
  assert.equal(canStartGame(room), false);
  room.lobby.ready.guest = true;
  room.lobby.selections.guest = 'connectfour';
  assert.equal(canStartGame(room), false);
  room.lobby.selections.guest = 'thisorthat';
  room.lobby.activeSession = { gameId: 'thisorthat' };
  assert.equal(canStartGame(room), false);
});

test('host can clear guest only after the offline grace period', () => {
  const room = sampleRoom();
  room.presence = { guest: { connected: false, lastChangedAt: 2_000_000 } };
  assert.equal(canClearGuest(room, 2_000_000 + RECONNECT_GRACE_MS - 1), false);
  assert.equal(canClearGuest(room, 2_000_000 + RECONNECT_GRACE_MS), true);
  room.presence.guest.connected = true;
  assert.equal(canClearGuest(room, 2_000_000 + RECONNECT_GRACE_MS + 1), false);
});

test('formats a remaining duration as minutes and seconds', () => {
  assert.equal(formatRemaining(61_000), '1:01');
  assert.equal(formatRemaining(1), '0:01');
  assert.equal(formatRemaining(0), '0:00');
});
