import { ROOM_TTL_MS, RECONNECT_GRACE_MS, ROOM_CODE_LENGTH, GAME_CATALOG } from './constants.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ALLOWED_GAMES = new Set(GAME_CATALOG.map(game => game.id));

export function normalizeRoomCode(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);
}

export function generateRoomCode(cryptoObject = globalThis.crypto) {
  if (!cryptoObject?.getRandomValues) {
    throw new Error('Peramban ini tidak menyediakan generator kode acak yang aman. Perbarui peramban lalu coba lagi.');
  }
  let result = '';
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  cryptoObject.getRandomValues(bytes);
  for (const byte of bytes) result += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return result;
}

export function isAllowedGameId(gameId) {
  return ALLOWED_GAMES.has(gameId);
}

export function getPlayerRole(room, uid) {
  if (!room || !uid) return null;
  if (room.host?.uid === uid) return 'host';
  if (room.guest?.uid === uid) return 'guest';
  return null;
}

export function isRoomExpired(room, now = Date.now()) {
  const activityAt = Number(room?.lastMeaningfulActivityAt ?? room?.createdAt ?? 0);
  return !activityAt || now - activityAt >= ROOM_TTL_MS;
}

export function roomExpiryRemaining(room, now = Date.now()) {
  const activityAt = Number(room?.lastMeaningfulActivityAt ?? room?.createdAt ?? 0);
  return Math.max(0, ROOM_TTL_MS - (now - activityAt));
}

export function canStartGame(room) {
  if (!room || room.lobby?.activeSession) return false;
  const selections = room.lobby?.selections ?? {};
  const ready = room.lobby?.ready ?? {};
  const selected = selections.host;
  return Boolean(
    selected &&
    selected === selections.guest &&
    isAllowedGameId(selected) &&
    ready.host === true &&
    ready.guest === true
  );
}

export function canClearGuest(room, now = Date.now()) {
  const guest = room?.guest;
  const presence = room?.presence?.guest;
  if (!guest || presence?.connected !== false) return false;
  const disconnectedAt = Number(presence.lastChangedAt ?? 0);
  return disconnectedAt > 0 && now - disconnectedAt >= RECONNECT_GRACE_MS;
}

export function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function roleLabel(role) {
  return role === 'host' ? 'Pembuat ruang' : role === 'guest' ? 'Tamu' : 'Tidak dikenal';
}
