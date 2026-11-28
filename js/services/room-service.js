import {
  db, ref, get, set, update, remove, onValue,
  runTransaction, serverTimestamp
} from '../firebase.js';
import { ROOM_TTL_MS, RECONNECT_GRACE_MS } from '../constants.js';
import {
  generateRoomCode, normalizeRoomCode, getPlayerRole,
  isRoomExpired, canStartGame, canClearGuest, isAllowedGameId
} from '../room-utils.js';

const roomRef = (code) => ref(db, `rooms/${normalizeRoomCode(code)}`);
const roomPath = (code) => `rooms/${normalizeRoomCode(code)}`;
const EXPLICIT_LOBBY_GAMES = new Set(['lovematch', 'colormatch', 'iqduel', 'arcade', 'bomberarena']);
const needsExplicitLobby = (gameId) => EXPLICIT_LOBBY_GAMES.has(gameId);

function cleanName(name) {
  const value = String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
  if (value.length < 1) throw new Error('Nama pemain wajib diisi (1–24 karakter).');
  return value;
}

function assertRoomCode(code) {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== 6) throw new Error('Kode ruang harus terdiri dari 6 karakter.');
  return normalized;
}

export async function createRoom({ uid, name, gameId = 'photobooth' }) {
  if (!uid) throw new Error('Identitas pemain belum siap.');
  const playerName = cleanName(name);
  if (!isAllowedGameId(gameId)) throw new Error('Aktivitas yang dipilih tidak dikenal.');

  // Random code + create-only database rule prevents overwriting an existing room.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();
    const room = {
      host: { uid, name: playerName, joinedAt: serverTimestamp() },
      createdAt: serverTimestamp(),
      lastMeaningfulActivityAt: serverTimestamp(),
      lobby: {
        selections: { host: gameId, guest: '' },
        ready: { host: !needsExplicitLobby(gameId), guest: false },
        activeSession: null
      }
    };
    try {
      await set(roomRef(code), room);
      return { code, role: 'host' };
    } catch (error) {
      if (error?.code === 'PERMISSION_DENIED' || error?.code === 'database/permission-denied') {
        // A collision and a Rules/configuration failure both reject create-only writes.
        // Retry a few random codes; if all fail, return a setup-oriented error below.
        continue;
      }
      throw error;
    }
  }
  throw new Error('Ruang tidak berhasil dibuat. Periksa apakah Aturan Realtime Database sudah dipublikasikan dan URL Firebase sesuai.');
}

export async function joinRoom({ code, uid, name, expectedGameId = null }) {
  if (!uid) throw new Error('Identitas pemain belum siap.');
  const normalized = assertRoomCode(code);
  const playerName = cleanName(name);
  let snapshot;
  try {
    snapshot = await get(roomRef(normalized));
  } catch (error) {
    if (error?.code === 'PERMISSION_DENIED' || error?.code === 'database/permission-denied') {
      throw new Error('Ruang tidak ditemukan, kode tidak valid, atau tempat Tamu sudah terisi.');
    }
    throw error;
  }
  const room = snapshot.val();
  if (!room) throw new Error('Ruang tidak ditemukan atau tidak tersedia. Periksa kembali kode undangan.');
  if (expectedGameId && room.lobby?.selections?.host !== expectedGameId) throw new Error('Kode ini bukan sesi untuk aktivitas yang dipilih. Minta pasangan mengirim kode sesi yang sesuai.');

  const existingRole = getPlayerRole(room, uid);
  if (existingRole) return { code: normalized, role: existingRole, rejoined: true };
  if (isRoomExpired(room)) throw new Error('Ruang sudah kedaluwarsa karena tidak ada aktivitas selama 24 jam.');
  if (room.lobby?.activeSession) throw new Error('Ruang sedang menjalankan permainan. Pembuat ruang perlu kembali ke lobi sebelum pemain baru bergabung.');
  if (room.guest?.uid) throw new Error('Ruang sudah berisi dua pemain. Minta Pembuat ruang membuka tempat Tamu setelah masa penyambungan ulang lima menit.');

  const guestRef = ref(db, `${roomPath(normalized)}/guest`);
  let result;
  try {
    result = await runTransaction(guestRef, (current) => {
      if (current === null) {
        return { uid, name: playerName, joinedAt: Date.now() };
      }
      if (current?.uid === uid) return current;
      return; // Abort if another player claimed the slot first.
    }, { applyLocally: false });
  } catch (error) {
    if (error?.code === 'PERMISSION_DENIED' || error?.code === 'database/permission-denied') {
      throw new Error('Tempat Tamu baru saja diisi atau ruang sudah tidak menerima pemain baru.');
    }
    throw error;
  }

  const claimedGuest = result.snapshot.val();
  if (!result.committed || claimedGuest?.uid !== uid) {
    throw new Error('Tempat Tamu baru saja diisi pemain lain. Gunakan ruang lain atau minta Pembuat ruang membuka tempat tersebut.');
  }

  await update(roomRef(normalized), {
    'lobby/selections/guest': room.lobby?.selections?.host || 'photobooth',
    'lobby/ready/guest': !needsExplicitLobby(room.lobby?.selections?.host || 'photobooth'),
    lastMeaningfulActivityAt: serverTimestamp()
  });
  return { code: normalized, role: 'guest', rejoined: false };
}

export async function readRoom(code) {
  const normalized = assertRoomCode(code);
  const snapshot = await get(roomRef(normalized));
  return snapshot.exists() ? snapshot.val() : null;
}

export function subscribeRoom(code, onRoom, onError = console.error) {
  const unsubscribe = onValue(roomRef(code), (snapshot) => {
    onRoom(snapshot.exists() ? snapshot.val() : null);
  }, onError);
  return unsubscribe;
}

export async function touchRoom(code) {
  await set(ref(db, `${roomPath(code)}/lastMeaningfulActivityAt`), serverTimestamp());
}

export async function setGameSelection({ code, role, gameId }) {
  if (!isAllowedGameId(gameId)) throw new Error('Pilihan permainan tidak dikenal.');
  const updates = {
    [`lobby/selections/${role}`]: gameId,
    'lobby/ready/host': false,
    'lobby/ready/guest': false,
    lastMeaningfulActivityAt: serverTimestamp()
  };
  await update(roomRef(code), updates);
}

export async function setReady({ code, role, ready }) {
  const room = await readRoom(code);
  if (!room || isRoomExpired(room)) throw new Error('Ruang tidak tersedia atau sudah kedaluwarsa.');
  if (ready) {
    const hostSelection = room.lobby?.selections?.host;
    const guestSelection = room.lobby?.selections?.guest;
    if (!hostSelection || hostSelection !== guestSelection) {
      throw new Error('Kedua pemain harus memilih permainan yang sama sebelum menyatakan siap.');
    }
    if (needsExplicitLobby(hostSelection) && (room.presence?.host?.connected !== true || room.presence?.guest?.connected !== true)) {
      throw new Error('Kedua perangkat harus online di lobi sebelum menyatakan siap.');
    }
  }
  await update(roomRef(code), {
    [`lobby/ready/${role}`]: Boolean(ready),
    lastMeaningfulActivityAt: serverTimestamp()
  });
}

export async function startSelectedGame({ code, uid }) {
  const room = await readRoom(code);
  if (!room) throw new Error('Ruang sudah tidak tersedia.');
  if (getPlayerRole(room, uid) !== 'host') throw new Error('Hanya Pembuat ruang yang dapat memulai permainan.');
  if (!canStartGame(room)) throw new Error('Kedua pemain harus memilih permainan yang sama dan menyatakan siap.');
  const gameId = room.lobby.selections.host;
  if (needsExplicitLobby(gameId) && (room.presence?.host?.connected !== true || room.presence?.guest?.connected !== true)) {
    throw new Error('Kedua perangkat harus tetap online sebelum permainan dimulai.');
  }
  const session = {
    gameId,
    sessionId: crypto.randomUUID(),
    startedAt: serverTimestamp()
  };
  await update(roomRef(code), {
    'lobby/activeSession': session,
    'lobby/ready/host': false,
    'lobby/ready/guest': false,
    lastMeaningfulActivityAt: serverTimestamp()
  });
  return session;
}

export async function returnToLobby({ code, uid }) {
  const room = await readRoom(code);
  if (!room) throw new Error('Ruang sudah tidak tersedia.');
  if (getPlayerRole(room, uid) !== 'host') throw new Error('Hanya Pembuat ruang yang dapat mengembalikan ruang ke lobi.');
  await remove(ref(db, `roomGames/${normalizeRoomCode(code)}`));
  await remove(ref(db, `privateRooms/${normalizeRoomCode(code)}`));
  const explicitLobby = needsExplicitLobby(room.lobby?.selections?.host);
  await update(roomRef(code), {
    'lobby/activeSession': null,
    'lobby/ready/host': !explicitLobby,
    'lobby/ready/guest': false,
    lastMeaningfulActivityAt: serverTimestamp()
  });
}

export async function leaveRoom({ code, uid }) {
  const room = await readRoom(code);
  if (!room) return { closed: false, alreadyGone: true };
  const role = getPlayerRole(room, uid);
  if (!role) return { closed: false, alreadyGone: true };

  if (role === 'host') {
    // Clear game media metadata/signaling before removing membership. No image blobs are stored in RTDB.
    await remove(ref(db, `roomGames/${normalizeRoomCode(code)}`));
    await remove(ref(db, `privateRooms/${normalizeRoomCode(code)}`));
    await remove(roomRef(code));
    return { closed: true };
  }

  await update(roomRef(code), {
    guest: null,
    'lobby/selections/guest': '',
    'lobby/ready/guest': false,
    'presence/guest': null,
    lastMeaningfulActivityAt: serverTimestamp()
  });
  return { closed: false };
}

export async function clearDisconnectedGuest({ code, uid }) {
  const room = await readRoom(code);
  if (!room) throw new Error('Ruang sudah tidak tersedia.');
  if (getPlayerRole(room, uid) !== 'host') throw new Error('Hanya Pembuat ruang yang dapat membuka kembali tempat Tamu.');
  if (!canClearGuest(room)) {
    const presence = room.presence?.guest;
    const disconnectedAt = Number(presence?.lastChangedAt ?? 0);
    const remaining = disconnectedAt ? Math.max(0, RECONNECT_GRACE_MS - (Date.now() - disconnectedAt)) : RECONNECT_GRACE_MS;
    throw new Error(`Slot guest baru dapat dibuka setelah offline selama 5 menit. Sisa waktu sekitar ${Math.ceil(remaining / 1000)} detik.`);
  }
  // A UID reset abandons the active session; clear its private payload before freeing the slot.
  await remove(ref(db, `roomGames/${normalizeRoomCode(code)}`));
  await remove(ref(db, `privateRooms/${normalizeRoomCode(code)}`));
  await update(roomRef(code), {
    guest: null,
    'lobby/selections/host': 'photobooth',
    'lobby/selections/guest': '',
    'lobby/ready/host': true,
    'lobby/ready/guest': false,
    'presence/guest': null,
    'lobby/activeSession': null,
    lastMeaningfulActivityAt: serverTimestamp()
  });
}

export async function removeExpiredRoom({ code, uid }) {
  const room = await readRoom(code);
  if (!room) return false;
  if (room.host?.uid !== uid) return false;
  if (!isRoomExpired(room)) return false;
  await remove(ref(db, `roomGames/${normalizeRoomCode(code)}`));
  await remove(ref(db, `privateRooms/${normalizeRoomCode(code)}`));
  await remove(roomRef(code));
  return true;
}

export function getRoomExpiryInfo(room, now = Date.now()) {
  const activityAt = Number(room?.lastMeaningfulActivityAt ?? room?.createdAt ?? 0);
  return {
    expired: isRoomExpired(room, now),
    expiresAt: activityAt + ROOM_TTL_MS,
    remainingMs: Math.max(0, activityAt + ROOM_TTL_MS - now)
  };
}
