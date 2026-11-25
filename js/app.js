import { GAME_CATALOG } from './constants.js';
import { canStartGame, getPlayerRole, isRoomExpired, normalizeRoomCode, roleLabel } from './room-utils.js';
import { saveRoomCode, loadRoomCode, clearRoomCode, saveDisplayName, loadDisplayName } from './services/room-session.js';

const appRoot = document.querySelector('#app');
const dialog = document.querySelector('#room-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const createForm = document.querySelector('#create-form');
const joinForm = document.querySelector('#join-form');
const dialogError = document.querySelector('#dialog-error');
const toastRegion = document.querySelector('#toast-region');

const state = {
  player: null,
  currentRoom: null,
  isBusy: false,
  startingSession: false,
  expiring: false,
  recoveringRoom: false,
  mountedGame: null,
  loadingGameKey: null,
  pendingGameId: 'photobooth'
};

let backendPromise = null;
let backend = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function friendlyError(error) {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? 'Terjadi kesalahan yang tidak diketahui.');
  if (code.includes('unauthorized-domain')) return 'Domain GitHub Pages belum didaftarkan di Firebase Authentication → Authorized domains.';
  if (code.includes('operation-not-allowed')) return 'Anonymous Authentication belum diaktifkan di Firebase Console.';
  if (code.toLowerCase().includes('permission') || message.toLowerCase().includes('permission_denied')) {
    return 'Akses Firebase ditolak. Periksa konfigurasi project dan Realtime Database Rules.';
  }
  if (code.includes('network') || message.toLowerCase().includes('network')) return 'Koneksi internet bermasalah. Periksa jaringan lalu coba lagi.';
  if (message.includes('FIREBASE_NOT_CONFIGURED') || message.includes('PASTE_') || message.includes('REPLACE_')) return 'Firebase project baru belum dihubungkan. Isi konfigurasi Web App pada js/firebase.js terlebih dahulu.';
  return message;
}

async function ensureBackend() {
  if (!backendPromise) {
    backendPromise = Promise.all([
      import('./firebase.js'),
      import('./services/auth-service.js'),
      import('./services/presence-service.js'),
      import('./services/room-service.js')
    ]).then(([firebase, auth, presence, rooms]) => {
      if (!firebase.isFirebaseConfigured) {
        throw new Error('FIREBASE_NOT_CONFIGURED: Isi konfigurasi Web App project baru pada js/firebase.js sebelum membuat atau bergabung ke sesi.');
      }
      backend = { firebase, auth, presence, rooms };
      return backend;
    }).catch((error) => {
      backendPromise = null;
      throw error;
    });
  }
  return backendPromise;
}

function showToast(message, type = 'default') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4800);
}

function setDialogError(message = '') {
  dialogError.textContent = message;
  dialogError.hidden = !message;
}

function setFormBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (busy) {
    button.dataset.originalText ??= button.textContent;
    button.disabled = true;
    button.textContent = 'Mohon tunggu…';
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.textContent = button.dataset.originalText;
  }
}

function openDialog(mode, gameId = 'photobooth') {
  setDialogError('');
  state.pendingGameId = gameId;
  const createMode = mode === 'create';
  const activityName = ({ drawtogether: 'Gambar Bareng', guesspartner: 'Tebak Pasangan', bombstorm: 'Bomb Storm', balloonpop: 'Balloon Pop', elementalduo: 'Elemental Duo', photobooth: 'Photobooth' })[gameId] || 'Photobooth';
  dialog.querySelector('.eyebrow').textContent = `${activityName.toUpperCase()} BERDUA`;
  dialogTitle.textContent = createMode ? `Buat sesi ${activityName}` : `Gabung ${activityName}`;
  createForm.querySelector('button[type="submit"]').innerHTML = `Buat sesi ${activityName} <span>♡</span>`;
  joinForm.querySelector('button[type="submit"]').innerHTML = `Gabung ${activityName} <span>→</span>`;
  createForm.hidden = !createMode;
  joinForm.hidden = createMode;
  const savedName = loadDisplayName();
  document.querySelector('#create-name').value = savedName;
  document.querySelector('#join-name').value = savedName;
  document.querySelector('#join-code').value = '';
  if (!dialog.open) dialog.showModal();
  window.setTimeout(() => (createMode ? document.querySelector('#create-name') : document.querySelector('#join-code')).focus(), 30);
}

function closeDialog() {
  if (dialog.open) dialog.close();
  setDialogError('');
}

function disposeMountedGame() {
  if (state.mountedGame?.destroy) state.mountedGame.destroy();
  state.mountedGame = null;
  state.loadingGameKey = null;
}

function clearCurrentRoom({ clearStorage = true } = {}) {
  disposeMountedGame();
  const current = state.currentRoom;
  if (current?.unsubscribe) current.unsubscribe();
  if (current?.presenceCleanup) void current.presenceCleanup();
  state.currentRoom = null;
  state.startingSession = false;
  state.expiring = false;
  state.recoveringRoom = false;
  if (clearStorage) clearRoomCode();
}

async function enterRoom({ code, role }) {
  closeDialog();
  clearCurrentRoom({ clearStorage: false });
  saveRoomCode(code);
  state.currentRoom = { code, role, room: null, unsubscribe: null, presenceCleanup: null };
  render();
  state.currentRoom.unsubscribe = backend.rooms.subscribeRoom(code, (room) => {
    void handleRoomSnapshot(code, room);
  }, (error) => {
    console.error(error);
    showToast(friendlyError(error), 'error');
  });
  state.currentRoom.presenceCleanup = backend.presence.attachPresence(code, role);
}

async function handleRoomSnapshot(sourceCode, room) {
  const current = state.currentRoom;
  if (!current || current.code !== sourceCode) return;
  if (!room) {
    clearCurrentRoom();
    renderLanding();
    showToast('Sesi sudah ditutup atau tidak lagi tersedia.', 'error');
    return;
  }
  const role = getPlayerRole(room, state.player?.uid);
  if (!role) {
    clearCurrentRoom();
    renderLanding();
    showToast('Identitas perangkat ini tidak lagi terdaftar di sesi. Gabung kembali menggunakan kode terbaru.', 'error');
    return;
  }
  current.role = role;
  current.room = room;
  if (!room.lobby?.activeSession) state.recoveringRoom = false;
  render();

  if (isRoomExpired(room) && role === 'host' && !state.expiring) {
    state.expiring = true;
    try {
      await backend.rooms.removeExpiredRoom({ code: current.code, uid: state.player.uid });
      if (state.currentRoom?.code === sourceCode) {
        clearCurrentRoom();
        renderLanding();
        showToast('Sesi lama telah kedaluwarsa dan dibersihkan.', 'error');
      }
    } catch (error) {
      state.expiring = false;
      showToast(friendlyError(error), 'error');
    }
    return;
  }

  // If the guest leaves during an active session, only the host may clear the
  // host-owned activeSession path. Return to the invite screen before accepting
  // another guest.
  if (role === 'host' && !room.guest && room.lobby?.activeSession && !state.recoveringRoom) {
    state.recoveringRoom = true;
    try {
      await backend.rooms.returnToLobby({ code: current.code, uid: state.player.uid });
    } catch (error) {
      state.recoveringRoom = false;
      showToast(friendlyError(error), 'error');
    }
    return;
  }

  // Photobooth is the first activity in this fresh project. Once the invited player
  // joins, the host starts the shared Photobooth session automatically.
  if (role === 'host' && canStartGame(room) && !state.startingSession) {
    state.startingSession = true;
    try {
      await backend.rooms.startSelectedGame({ code: current.code, uid: state.player.uid });
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      state.startingSession = false;
    }
  }
}

function renderLanding() {
  const hasSavedRoom = normalizeRoomCode(loadRoomCode()).length === 6;
  appRoot.innerHTML = `
    <section class="date-hero">
      <div class="date-copy">
        <span class="date-kicker"><i></i> RUANG KECIL UNTUK KITA</span>
        <p class="date-label">Diri. Playroom Date</p>
        <h1>Jarak boleh jauh.<br><em>Momen tetap dekat.</em></h1>
        <p class="date-description">Tempat kecil untuk menyimpan momen, berfoto, dan bermain bersama—dari dua tempat yang berbeda.</p>
        <div class="date-primary-actions">
          <button class="date-action date-action-dark" data-action="open-create"><span><b>Buat sesi berdua</b><small>Mulai Photobooth dengan pasangan</small></span><i>↗</i></button>
          <button class="date-action date-action-light" data-action="open-join"><span><b>Gabung sesi</b><small>Masukkan kode dari pasangan</small></span><i>→</i></button>
        </div>
        <div class="date-divider"><span>ATAU MULAI SENDIRI</span></div>
        <button class="date-solo-card" data-action="open-solo">
          <span class="date-solo-icon" aria-hidden="true">📸</span>
          <span><b>Foto sendiri</b><small>Langsung masuk Photobooth. Tidak perlu membuat ruang.</small></span>
          <i>→</i>
        </button>
        ${hasSavedRoom ? '<button class="date-resume" data-action="resume-room">Ada sesi sebelumnya? <u>Lanjutkan sesi</u></button>' : ''}
        <p class="date-footnote"><span>♡</span> Dibuat untuk dua orang, bisa dimulai dari satu.</p>
      </div>
      <div class="date-visual" aria-label="Ilustrasi strip foto empat bingkai">
        <div class="date-sparkle sparkle-a">✦</div><div class="date-sparkle sparkle-b">♡</div>
        <div class="date-camera-top"></div>
        <div class="date-film-strip">
          <div class="date-film-cell scene-one"><span>01</span><i>♡</i></div>
          <div class="date-film-cell scene-two"><span>02</span><i>✦</i></div>
          <div class="date-film-cell scene-three"><span>03</span><i>♡</i></div>
          <div class="date-film-cell scene-four"><span>04</span><i>✿</i></div>
          <div class="date-film-caption">TWO PLACES · ONE MEMORY</div>
        </div>
        <div class="date-visual-note"><span>✧</span> simpan yang sederhana</div>
      </div>
    </section>
    <section class="date-next-preview date-game-preview">
      <span class="date-kicker">MINI GAME PERTAMA</span>
      <div><h2>Gambar Bareng ✎</h2><p>Dapatkan instruksi yang sama, gambar dari dua tempat, dan lihat coretan satu sama lain secara langsung.</p></div>
      <div class="date-game-actions"><button class="button button-primary button-small" data-action="open-draw-create">Buat sesi</button><button class="button button-secondary button-small" data-action="open-draw-join">Gabung sesi</button></div>
    </section>
    <section class="date-next-preview date-game-preview gp-landing-preview">
      <span class="date-kicker">MINI GAME KEDUA · BARU</span>
      <div><h2>Tebak Pasangan ♡</h2><p>Satu orang menjawab pertanyaan tentang dirinya, pasangannya menebak. Buka jawaban bersama dan lihat seberapa cocok tebakan kalian.</p></div>
      <div class="date-game-actions"><button class="button button-primary button-small" data-action="open-guess-create">Buat sesi</button><button class="button button-secondary button-small" data-action="open-guess-join">Gabung sesi</button></div>
    </section>
    <section class="date-next-preview date-game-preview bs-landing-preview">
      <span class="date-kicker">MINI GAME KETIGA · BARU</span>
      <div><h2>Bomb Storm ☄</h2><p>Jadikan selfie sebagai karakter, hindari bom yang berjatuhan, dan kumpulkan hati untuk meraih skor tertinggi.</p></div>
      <div class="date-game-actions"><button class="button button-primary button-small" data-action="open-bomb-create">Buat sesi</button><button class="button button-secondary button-small" data-action="open-bomb-join">Gabung sesi</button></div>
    </section>
    <section class="date-next-preview date-game-preview bp-landing-preview">
      <span class="date-kicker">MINI GAME KEEMPAT · BARU</span>
      <div><h2>Balloon Pop 🎈</h2><p>Pecahkan balon sebanyak mungkin, kumpulkan balon hati dan emas, tetapi jangan sampai menyentuh bom!</p></div>
      <div class="date-game-actions"><button class="button button-primary button-small" data-action="open-balloon-create">Buat sesi</button><button class="button button-secondary button-small" data-action="open-balloon-join">Gabung sesi</button></div>
    </section>
    <section class="date-next-preview date-game-preview ed-landing-preview">
      <span class="date-kicker">MINI GAME KELIMA · PETUALANGAN BARU</span>
      <div><h2>Elemental Duo ✧</h2><p>Dua roh kecil dengan kekuatan berbeda. Saling bantu membuka jalan, kumpulkan serpihan energi, dan tuntaskan 50 level di lima dunia.</p><div class="ed-landing-tags"><span>50 LEVEL</span><span>5 DUNIA</span><span>CO-OP</span></div></div>
      <div class="date-game-actions"><button class="button button-primary button-small" data-action="open-elemental-create">Buat sesi</button><button class="button button-secondary button-small" data-action="open-elemental-join">Gabung sesi</button></div>
    </section>`;
}

function renderWaitingRoom(room, current) {
  const roleText = roleLabel(current.role);
  const guestJoined = Boolean(room.guest?.uid);
  const activityName = ({ drawtogether: 'Gambar Bareng', guesspartner: 'Tebak Pasangan', bombstorm: 'Bomb Storm', balloonpop: 'Balloon Pop', elementalduo: 'Elemental Duo', photobooth: 'Photobooth' })[room.lobby?.selections?.host] || 'Photobooth';
  appRoot.innerHTML = `
    <section class="date-waiting panel">
      <button class="button button-quiet" data-action="leave-room">← Kembali</button>
      <span class="date-kicker">SESI ${activityName.toUpperCase()}</span>
      <div class="date-waiting-icon">♡</div>
      <h1>${guestJoined ? 'Menghubungkan kalian…' : 'Sesi berhasil dibuat.'}</h1>
      <p>${guestJoined ? `Pasanganmu sudah bergabung. ${activityName} akan terbuka otomatis.` : `Bagikan kode ini kepada pasanganmu. Begitu ia bergabung, ${activityName} akan langsung dimulai.`}</p>
      <div class="date-invite-code"><span>KODE UNDANGAN · ${roleText.toUpperCase()}</span><strong>${escapeHtml(current.code)}</strong><button class="button button-secondary" data-action="copy-code">Salin kode</button></div>
      <div class="date-waiting-people"><span class="date-person"><i>♡</i><b>${escapeHtml(room.host?.name || 'Pembuat sesi')}</b><small>Pembuat sesi</small></span><span class="date-connection-line"></span><span class="date-person ${guestJoined ? 'is-here' : ''}"><i>✿</i><b>${escapeHtml(room.guest?.name || 'Menunggu pasangan')}</b><small>${guestJoined ? 'Sudah bergabung' : 'Belum bergabung'}</small></span></div>
      <p class="date-small-note">Sesi dibatasi untuk dua orang. Jangan bagikan kode kepada orang lain.</p>
    </section>`;
}

function renderActiveSession(room, current) {
  const session = room.lobby.activeSession;
  if (!room.guest) {
    disposeMountedGame();
    renderWaitingRoom(room, current);
    return;
  }
  const key = `${current.code}:${session.sessionId}:${session.gameId}`;
  if (state.mountedGame?.key === key || state.loadingGameKey === key) return;
  disposeMountedGame();
  state.loadingGameKey = key;
  const isDrawTogether = session.gameId === 'drawtogether';
  const isGuessPartner = session.gameId === 'guesspartner';
  const isBombStorm = session.gameId === 'bombstorm';
  const isBalloonPop = session.gameId === 'balloonpop';
  const isElementalDuo = session.gameId === 'elementalduo';
  const activityName = isDrawTogether ? 'Gambar Bareng' : isGuessPartner ? 'Tebak Pasangan' : isBombStorm ? 'Bomb Storm' : isBalloonPop ? 'Balloon Pop' : isElementalDuo ? 'Elemental Duo' : 'Photobooth';
  appRoot.innerHTML = `<section class="loading-state"><span class="loading-heart">♡</span><p>Membuka ${activityName}…</p></section>`;
  const modulePromise = isElementalDuo
    ? import('./games/elemental-duo.js?v=0.33.0').then(module => ({ mount: module.mountElementalDuo }))
    : isBalloonPop
    ? import('./games/balloon-pop.js?v=0.23.0').then(module => ({ mount: module.mountBalloonPop }))
    : isDrawTogether
    ? import('./games/draw-together.js?v=0.13.0').then(module => ({ mount: module.mountDrawTogether }))
    : isGuessPartner
      ? import('./games/guess-partner.js?v=0.23.0').then(module => ({ mount: module.mountGuessPartner }))
      : isBombStorm
        ? import('./games/bomb-storm.js?v=0.23.0').then(module => ({ mount: module.mountBombStorm }))
        : import('./photobooth/photobooth.js?v=0.24.3').then(module => ({ mount: module.mountPhotobooth }));
  void modulePromise.then(({ mount }) => {
    if (state.currentRoom?.code !== current.code || state.currentRoom?.room?.lobby?.activeSession?.sessionId !== session.sessionId) return null;
    const instance = mount(appRoot, {
      code: current.code,
      session,
      room,
      role: current.role,
      player: state.player,
      mode: 'couple',
      toast: showToast,
      onBack: async () => {
        if (current.role !== 'host') { showToast('Pembuat ruang yang dapat mengembalikan sesi ke lobi.'); return; }
        const accepted = window.confirm(`Kembali ke lobi dan mengakhiri ${activityName}?`);
        if (!accepted) return;
        await backend.rooms.returnToLobby({ code: current.code, uid: state.player.uid });
      }
    });
    state.mountedGame = { key, destroy: instance?.destroy };
    state.loadingGameKey = null;
    return instance;
  }).catch((error) => {
    state.loadingGameKey = null;
    appRoot.innerHTML = `<section class="panel date-waiting"><h1>Aktivitas belum bisa dibuka</h1><p>${escapeHtml(friendlyError(error))}</p><button class="button button-secondary" data-action="leave-room">Kembali</button></section>`;
  });
}

function render() {
  const current = state.currentRoom;
  if (!current) {
    renderLanding();
    return;
  }
  if (!current.room) {
    appRoot.innerHTML = '<section class="loading-state"><span class="loading-heart">♡</span><p>Membuka sesi…</p></section>';
    return;
  }
  if (isRoomExpired(current.room)) {
    renderWaitingRoom(current.room, current);
    return;
  }
  if (current.room.lobby?.activeSession) {
    renderActiveSession(current.room, current);
    return;
  }
  renderWaitingRoom(current.room, current);
}

async function openSoloPhotobooth() {
  closeDialog();
  disposeMountedGame();
  appRoot.innerHTML = '<section class="loading-state"><span class="loading-heart">♡</span><p>Menyiapkan Photobooth pribadi…</p></section>';
  try {
    const { mountPhotobooth } = await import('./photobooth/photobooth.js?v=0.24.3');
    const instance = mountPhotobooth(appRoot, {
      standalone: true,
      toast: showToast,
      onBack: async () => {
        disposeMountedGame();
        renderLanding();
      }
    });
    state.mountedGame = { key: 'standalone-photobooth', destroy: instance?.destroy };
  } catch (error) {
    appRoot.innerHTML = `<section class="panel date-waiting"><h1>Aktivitas belum bisa dibuka</h1><p>${escapeHtml(error.message)}</p><button class="button button-secondary" data-action="go-home">Kembali</button></section>`;
  }
}

async function handleCreateSubmit(event) {
  event.preventDefault();
  if (state.isBusy) return;
  const form = event.currentTarget;
  const name = form.elements.name.value;
  state.isBusy = true;
  setFormBusy(form, true);
  setDialogError('');
  try {
    await ensureBackend();
    state.player = await backend.auth.getCurrentPlayer();
    saveDisplayName(name.trim());
    const room = await backend.rooms.createRoom({ uid: state.player.uid, name, gameId: state.pendingGameId });
    await enterRoom(room);
    showToast(`Sesi dibuat. Bagikan kode ${room.code} kepada pasangan.`, 'success');
  } catch (error) {
    console.error(error);
    setDialogError(friendlyError(error));
  } finally {
    state.isBusy = false;
    setFormBusy(form, false);
  }
}

async function handleJoinSubmit(event) {
  event.preventDefault();
  if (state.isBusy) return;
  const form = event.currentTarget;
  const name = form.elements.name.value;
  const code = normalizeRoomCode(form.elements.code.value);
  state.isBusy = true;
  setFormBusy(form, true);
  setDialogError('');
  try {
    await ensureBackend();
    state.player = await backend.auth.getCurrentPlayer();
    saveDisplayName(name.trim());
    const room = await backend.rooms.joinRoom({ code, uid: state.player.uid, name, expectedGameId: state.pendingGameId });
    await enterRoom(room);
    showToast(room.rejoined ? 'Kembali ke sesi sebelumnya.' : 'Berhasil bergabung ke sesi.', 'success');
  } catch (error) {
    console.error(error);
    setDialogError(friendlyError(error));
  } finally {
    state.isBusy = false;
    setFormBusy(form, false);
  }
}

async function resumeRoom() {
  const code = normalizeRoomCode(loadRoomCode());
  if (code.length !== 6) throw new Error('Tidak ada sesi tersimpan pada perangkat ini.');
  await ensureBackend();
  state.player = await backend.auth.getCurrentPlayer();
  const room = await backend.rooms.readRoom(code);
  if (!room) {
    clearRoomCode();
    throw new Error('Sesi sebelumnya sudah ditutup atau tidak ditemukan.');
  }
  const role = getPlayerRole(room, state.player.uid);
  if (!role) {
    clearRoomCode();
    throw new Error('Identitas perangkat berubah. Minta pasangan mengirim kode undangan baru.');
  }
  if (isRoomExpired(room) && role === 'host') {
    await backend.rooms.removeExpiredRoom({ code, uid: state.player.uid });
    clearRoomCode();
    throw new Error('Sesi sebelumnya sudah kedaluwarsa. Buat sesi baru.');
  }
  await enterRoom({ code, role });
}

async function runAction(action, element) {
  if (action === 'open-create') return openDialog('create', 'photobooth');
  if (action === 'open-join') return openDialog('join', 'photobooth');
  if (action === 'open-draw-create') return openDialog('create', 'drawtogether');
  if (action === 'open-draw-join') return openDialog('join', 'drawtogether');
  if (action === 'open-guess-create') return openDialog('create', 'guesspartner');
  if (action === 'open-guess-join') return openDialog('join', 'guesspartner');
  if (action === 'open-bomb-create') return openDialog('create', 'bombstorm');
  if (action === 'open-bomb-join') return openDialog('join', 'bombstorm');
  if (action === 'open-balloon-create') return openDialog('create', 'balloonpop');
  if (action === 'open-balloon-join') return openDialog('join', 'balloonpop');
  if (action === 'open-elemental-create') return openDialog('create', 'elementalduo');
  if (action === 'open-elemental-join') return openDialog('join', 'elementalduo');
  if (action === 'open-solo') return openSoloPhotobooth();
  if (action === 'close-dialog') return closeDialog();
  if (action === 'go-home') {
    disposeMountedGame();
    renderLanding();
    return;
  }
  if (action === 'resume-room') {
    try { await resumeRoom(); }
    catch (error) { showToast(friendlyError(error), 'error'); }
    return;
  }
  const current = state.currentRoom;
  if (!current) return;
  if (action === 'copy-code') {
    try { await navigator.clipboard.writeText(current.code); showToast('Kode sesi berhasil disalin.', 'success'); }
    catch { window.prompt('Salin kode sesi ini:', current.code); }
    return;
  }
  if (action === 'leave-room') {
    const accepted = window.confirm(current.role === 'host'
      ? 'Tutup sesi untuk kedua pemain?'
      : 'Keluar dari sesi ini?');
    if (!accepted) return;
    await backend.rooms.leaveRoom({ code: current.code, uid: state.player.uid });
    clearCurrentRoom();
    renderLanding();
    showToast('Kamu kembali ke halaman utama.');
  }
}

document.addEventListener('click', async (event) => {
  const element = event.target.closest('[data-action]');
  if (!element || element.disabled) return;
  event.preventDefault();
  try { await runAction(element.dataset.action, element); }
  catch (error) { console.error(error); showToast(friendlyError(error), 'error'); }
});

createForm.addEventListener('submit', handleCreateSubmit);
joinForm.addEventListener('submit', handleJoinSubmit);
document.querySelector('#join-code').addEventListener('input', (event) => {
  event.target.value = normalizeRoomCode(event.target.value);
});

// No Firebase initialization on page load. "Foto sendiri" stays fully local;
// Firebase is loaded only when someone creates or joins a shared session.
renderLanding();
