import { db, ref, get, set, update, onValue, runTransaction } from '../firebase.js';
import { createAvatarCamera } from '../services/avatar-camera.js';
import { createArcadeFeedback } from '../services/arcade-feedback.js';
import {
  BOMB_STORM_DURATION_SECONDS, BOMB_STORM_FALL_GRACE_MS,
  createBombStormObject, getBombStormObjectY, processLandedObjects,
  getBombStormRemaining, determineBombStormWinner, nextBombStormSeed, clampPlayerX,
  smoothPlayerX, getBombStormEffectFrame
} from './bomb-storm-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const DEFAULT_CHARACTERS = [
  { id: 'alien', emoji: '👾', name: 'Alien' },
  { id: 'bear', emoji: '🧸', name: 'Beruang' },
  { id: 'cat', emoji: '🐱', name: 'Kucing' },
  { id: 'rabbit', emoji: '🐰', name: 'Kelinci' },
  { id: 'panda', emoji: '🐼', name: 'Panda' },
  { id: 'fox', emoji: '🦊', name: 'Rubah' },
  { id: 'frog', emoji: '🐸', name: 'Katak' },
  { id: 'monkey', emoji: '🐵', name: 'Monyet' },
  { id: 'koala', emoji: '🐨', name: 'Koala' },
  { id: 'tiger', emoji: '🐯', name: 'Harimau' },
  { id: 'chick', emoji: '🐥', name: 'Anak ayam' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn' }
];
const CHARACTER_BY_ID = Object.fromEntries(DEFAULT_CHARACTERS.map(item => [item.id, item]));
const DEFAULT_CHARACTER_BY_ROLE = { host: 'alien', guest: 'bear' };
const characterValue = id => `character:${CHARACTER_BY_ID[id] ? id : 'alien'}`;
const avatarCharacter = value => CHARACTER_BY_ID[String(value || '').replace(/^character:/, '')]?.emoji || '';
const isImageAvatar = value => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(value) && value.length <= 22000;
const safeAvatar = value => isImageAvatar(value) || /^character:(alien|bear|cat|rabbit|panda|fox|frog|monkey|koala|tiger|chick|unicorn)$/.test(String(value || '')) ? value : '';

const makeSeed = () => {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] || 1;
};

function imageFromDataUrl(source) {
  if (!source || !/^data:image\/(jpeg|png|webp);base64,/i.test(source)) return null;
  const image = new Image();
  image.src = source;
  return image;
}

async function compressAvatar(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Pilih file gambar untuk avatar.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Ukuran foto maksimal 12 MB.');
  let bitmap = null;
  let fallbackImage = null;
  let objectUrl = '';
  try {
    if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
    else {
      objectUrl = URL.createObjectURL(file);
      fallbackImage = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Foto tidak dapat dibuka. Coba pilih gambar lain.'));
        image.src = objectUrl;
      });
    }
  } catch { throw new Error('Foto tidak dapat dibuka. Coba pilih gambar lain.'); }
  const source = bitmap || fallbackImage;
  const size = 128;
  const side = Math.min(source.width || source.naturalWidth, source.height || source.naturalHeight);
  const sx = ((source.width || source.naturalWidth) - side) / 2;
  const sy = ((source.height || source.naturalHeight) - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  bitmap?.close?.();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  let dataUrl = canvas.toDataURL('image/jpeg', 0.66);
  if (dataUrl.length > 22000) dataUrl = canvas.toDataURL('image/jpeg', 0.48);
  if (dataUrl.length > 22000) throw new Error('Foto masih terlalu besar setelah dikompres. Pilih foto lain.');
  return dataUrl;
}

export function mountBombStorm(root, context) {
  const { code, session, room, role, player, onBack, toast: globalToast = () => {} } = context;
  let arcadeFeedback = null;
  let avatarCamera = null;
  const notify = (message, type = 'default', options) => arcadeFeedback ? arcadeFeedback.show(message, type, options) : globalToast(message, type);
  const opponentRole = role === 'host' ? 'guest' : 'host';
  const names = {
    host: room.host?.name || 'Pembuat ruang',
    guest: room.guest?.name || 'Tamu'
  };
  const basePath = `roomGames/${code}/${session.sessionId}/bombStorm`;
  const baseRef = ref(db, basePath);
  const metaRef = ref(db, `${basePath}/meta`);
  const avatarsRef = ref(db, `roomGames/${code}/${session.sessionId}/bombStormAvatars`);
  const avatarRef = ref(db, `roomGames/${code}/${session.sessionId}/bombStormAvatars/${role}`);
  const playerPath = playerRole => `${basePath}/players/${playerRole}`;
  const playerRef = ref(db, playerPath(role));
  const nowServer = () => Date.now() + serverOffset;

  let data = {};
  let avatarData = {};
  let localPlayer = { name: names[role], avatar: '', ready: false, x: role === 'host' ? 0.32 : 0.68, score: 0, lives: 3, processedIndex: -1, finished: false, updatedAt: 0 };
  let serverOffset = 0;
  let unsubscribeGame = null;
  let unsubscribeAvatars = null;
  let unsubscribeOffset = null;
  let rafId = 0;
  let timerId = 0;
  let destroyed = false;
  let initBusy = false;
  let readyBusy = false;
  let avatarBusy = false;
  let resultBusy = false;
  let rematchBusy = false;
  let positionWriteTimer = 0;
  let lastPositionWrite = 0;
  let lastProgressToast = 0;
  let observedRoundNo = null;
  let lastArenaFrameAt = 0;
  let observedStatsRound = null;
  let observedPlayerStats = null;
  const renderedPlayerX = { host: null, guest: null };
  const characterEffects = { host: null, guest: null };
  let lastStartAttempt = '';
  let dragPointer = null;
  let moveHoldTimer = 0;
  const avatarImages = { host: null, guest: null };
  const avatarSources = { host: '', guest: '' };
  const avatarDomSources = new Map();

  const ownState = () => data.players?.[role] || localPlayer;
  const otherState = () => data.players?.[opponentRole] || {};

  function shell() {
    root.innerHTML = `
      <section class="bs-shell">
        <header class="bs-header">
          <div><span class="bs-kicker">DIRI. · ARCADE 01</span><h1>Bomb Storm <span>☄</span></h1><p>Hindari bom, kumpulkan hati, dan bertahan bersama.</p></div>
          <div class="bs-header-actions"><span class="dt-room-code">${esc(code)}</span><button class="button button-quiet button-small" data-bs-action="back">Kembali</button></div>
        </header>

        <section class="bs-panel" data-bs-panel="lobby">
          <div class="bs-lobby-heading"><span class="bs-kicker">PERSIAPAN ARCADE</span><h2>Siapkan karaktermu!</h2><p>Pilih karakter bawaan, ambil foto langsung, atau pilih foto dari galeri. Kamu bisa menggantinya sebelum siap bermain.</p></div>
          <div class="bs-player-setup">
            <article class="bs-player-setup-card is-mine">
              <div class="bs-avatar-preview" data-bs-avatar="mine">${role === 'host' ? '👾' : '🧸'}</div>
              <strong>${esc(names[role])}</strong><small>Karakter kamu</small>
              <div class="bs-character-heading">Pilih karakter bawaan</div>
              <div class="bs-character-grid" role="group" aria-label="Daftar karakter bawaan">
                ${DEFAULT_CHARACTERS.map(character => `<button type="button" class="bs-character-option" data-bs-character="${character.id}" aria-label="Pilih ${character.name}" title="${character.name}"><span>${character.emoji}</span><small>${character.name}</small></button>`).join('')}
              </div>
              <div class="bs-avatar-actions">
                <button type="button" class="button button-secondary bs-upload-button" data-bs-action="camera">📷 Ambil foto</button>
                <button type="button" class="button button-secondary bs-upload-button" data-bs-action="gallery">🖼️ Pilih dari galeri</button>
              </div>
              <input id="bs-avatar-gallery" class="bs-file-input" type="file" accept="image/*" aria-label="Pilih foto dari galeri">
              <span class="bs-avatar-status" data-bs-avatar-status>Karakter bawaan siap digunakan.</span>
            </article>
            <article class="bs-player-setup-card">
              <div class="bs-avatar-preview" data-bs-avatar="partner">${opponentRole === 'host' ? '👾' : '🧸'}</div>
              <strong>${esc(names[opponentRole])}</strong><small>Karakter pasangan</small>
              <span class="bs-partner-avatar-status" data-bs-partner-avatar-status>Menunggu pasangan memilih karakter…</span>
            </article>
          </div>
          <div class="bs-howto">
            <div><span>💣</span><strong>Hindari bom</strong><small>Bom mengurangi satu nyawa.</small></div>
            <div><span>💗</span><strong>Kumpulkan hati</strong><small>Setiap hati memberi 10 poin.</small></div>
            <div><span>⏱️</span><strong>Bertahan 60 detik</strong><small>Kalian punya 3 nyawa.</small></div>
          </div>
          <div class="bs-ready-row">
            <div class="bs-ready-person"><strong>${esc(names.host)}</strong><span data-bs-ready="host">Belum siap</span></div>
            <div class="bs-ready-person"><strong>${esc(names.guest)}</strong><span data-bs-ready="guest">Belum siap</span></div>
          </div>
          <button class="button button-primary bs-ready-button" data-bs-action="ready">Aku siap bermain</button>
          <p class="bs-note">Permainan dimulai setelah kalian berdua siap. Hitung mundur dilakukan bersamaan.</p>
        </section>

        <section class="bs-panel bs-game-panel" data-bs-panel="playing" hidden>
          <div class="bs-game-hud">
            <div class="bs-hud-player"><div class="bs-hud-avatar" data-bs-hud-avatar="host">👾</div><div><strong>${esc(names.host)}</strong><span><b data-bs-score="host">0</b> poin · <i data-bs-lives="host">♥♥♥</i></span></div></div>
            <div class="bs-timer"><small data-bs-round-label>RONDE 1</small><strong data-bs-timer>60</strong><span>DETIK</span></div>
            <div class="bs-hud-player is-right"><div><strong>${esc(names.guest)}</strong><span><b data-bs-score="guest">0</b> poin · <i data-bs-lives="guest">♥♥♥</i></span></div><div class="bs-hud-avatar" data-bs-hud-avatar="guest">🧸</div></div>
          </div>
          <div class="bs-countdown" data-bs-countdown hidden>3</div>
          <div class="bs-arena-wrap"><canvas class="bs-arena" data-bs-arena aria-label="Arena Bomb Storm"></canvas><div class="bs-arena-banner" data-bs-banner>Hindari bom dan kumpulkan hati!</div></div>
          <div class="bs-controls">
            <div class="bs-control-heading"><strong>Gerakkan karaktermu</strong><span data-bs-control-name>${esc(names[role])}</span></div>
            <div class="bs-control-row"><button class="bs-move-button" data-bs-move="left" aria-label="Gerak ke kiri">←</button><input type="range" min="6" max="94" step="1" value="${Math.round(localPlayer.x * 100)}" data-bs-move-slider aria-label="Posisi karakter"><button class="bs-move-button" data-bs-move="right" aria-label="Gerak ke kanan">→</button></div>
            <p class="bs-note">Geser tombol atau sentuh arena untuk memindahkan karaktermu. Pemain lain bergerak dari perangkatnya sendiri.</p>
          </div>
        </section>

        <section class="bs-panel bs-result-panel" data-bs-panel="result" hidden>
          <span class="bs-kicker">ARCADE SELESAI</span><div class="bs-result-icon">🏆</div><h2 data-bs-result-title>Hasil Bomb Storm</h2><p data-bs-result-subtitle>Siapa yang paling banyak mengumpulkan hati?</p>
          <div class="bs-result-scores">
            <article><div class="bs-result-avatar" data-bs-result-avatar="host">👾</div><strong>${esc(names.host)}</strong><b data-bs-result-score="host">0</b><small>poin</small><span data-bs-result-lives="host">3 nyawa tersisa</span></article>
            <article><div class="bs-result-avatar" data-bs-result-avatar="guest">🧸</div><strong>${esc(names.guest)}</strong><b data-bs-result-score="guest">0</b><small>poin</small><span data-bs-result-lives="guest">3 nyawa tersisa</span></article>
          </div>
          <div class="bs-rematch-status"><span data-bs-rematch="host">Belum memilih main lagi</span><span data-bs-rematch="guest">Belum memilih main lagi</span></div>
          <div class="bs-result-actions"><button class="button button-primary" data-bs-action="rematch">Main lagi</button><button class="button button-secondary" data-bs-action="back">Kembali</button></div>
          <p class="bs-note" data-bs-rematch-note>Kalian berdua perlu memilih Main lagi untuk memulai ronde baru.</p>
        </section>
        <section class="bs-error" data-bs-panel="error" hidden><h2>Bomb Storm belum bisa dibuka</h2><p data-bs-error></p><button class="button button-secondary" data-bs-action="back">Kembali</button></section>
      </section>`;
    root.addEventListener('click', clickHandler);
    root.addEventListener('change', changeHandler);
    root.addEventListener('input', inputHandler);
    root.addEventListener('pointerdown', pointerDownHandler);
    root.addEventListener('pointermove', pointerMoveHandler);
    root.addEventListener('pointerup', pointerUpHandler);
    root.addEventListener('pointercancel', pointerUpHandler);
    window.addEventListener('keydown', keyHandler);
  }

  function showPanel(name) {
    root.querySelectorAll('[data-bs-panel]').forEach(panel => { panel.hidden = panel.dataset.bsPanel !== name; });
  }

  function setAvatarPreview(selector, source, fallback) {
    const target = root.querySelector(selector);
    if (!target || avatarDomSources.get(selector) === (source || '')) return;
    avatarDomSources.set(selector, source || '');
    if (isImageAvatar(source)) target.innerHTML = `<img src="${esc(source)}" alt="Avatar pemain">`;
    else target.textContent = avatarCharacter(source) || fallback;
  }

  function updateAvatarDisplays() {
    const players = data.players || {};
    const mineAvatar = safeAvatar(avatarData[role]);
    const partnerAvatar = safeAvatar(avatarData[opponentRole]);
    setAvatarPreview('[data-bs-avatar="mine"]', mineAvatar, role === 'host' ? '👾' : '🧸');
    setAvatarPreview('[data-bs-avatar="partner"]', partnerAvatar, opponentRole === 'host' ? '👾' : '🧸');
    setAvatarPreview('[data-bs-hud-avatar="host"]', safeAvatar(avatarData.host), '👾');
    setAvatarPreview('[data-bs-hud-avatar="guest"]', safeAvatar(avatarData.guest), '🧸');
    setAvatarPreview('[data-bs-result-avatar="host"]', safeAvatar(avatarData.host), '👾');
    setAvatarPreview('[data-bs-result-avatar="guest"]', safeAvatar(avatarData.guest), '🧸');
    const mineStatus = root.querySelector('[data-bs-avatar-status]');
    const partnerStatus = root.querySelector('[data-bs-partner-avatar-status]');
    if (mineStatus) mineStatus.textContent = isImageAvatar(mineAvatar) ? 'Foto pilihanmu siap menjadi karakter.' : mineAvatar ? `Karakter ${CHARACTER_BY_ID[mineAvatar.replace('character:', '')]?.name || 'bawaan'} dipilih.` : 'Pilih karakter bawaan atau fotomu.';
    if (partnerStatus) partnerStatus.textContent = isImageAvatar(partnerAvatar) ? 'Foto pasangan sudah siap.' : partnerAvatar ? 'Karakter bawaan pasangan sudah dipilih.' : 'Pasangan belum memilih karakter.';
    const selectedId = String(mineAvatar || '').startsWith('character:') ? mineAvatar.slice(10) : '';
    const isReady = Boolean(players[role]?.ready);
    root.querySelectorAll('[data-bs-character]').forEach(button => {
      const selected = button.dataset.bsCharacter === selectedId;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = isReady || avatarBusy || data.meta?.phase !== 'lobby';
    });
    root.querySelectorAll('[data-bs-action="camera"],[data-bs-action="gallery"]').forEach(button => {
      button.disabled = isReady || avatarBusy || data.meta?.phase !== 'lobby';
    });
    for (const playerRole of ['host', 'guest']) {
      const ready = root.querySelector(`[data-bs-ready="${playerRole}"]`);
      if (ready) ready.textContent = players[playerRole]?.ready ? 'Siap bermain ✓' : 'Belum siap';
      const rematch = root.querySelector(`[data-bs-rematch="${playerRole}"]`);
      if (rematch) rematch.textContent = Number(data.rematchRequests?.[playerRole]) === Number(data.meta?.roundNo) ? 'Siap untuk rematch ✓' : 'Belum memilih main lagi';
    }
  }

  function updateHud() {
    const players = data.players || {};
    for (const playerRole of ['host', 'guest']) {
      const score = root.querySelector(`[data-bs-score="${playerRole}"]`);
      const lives = root.querySelector(`[data-bs-lives="${playerRole}"]`);
      if (score) score.textContent = String(Math.max(0, Number(players[playerRole]?.score) || 0));
      if (lives) {
        const count = Math.max(0, Math.min(3, Number(players[playerRole]?.lives ?? 3)));
        lives.textContent = `${'♥'.repeat(count)}${'♡'.repeat(3 - count)}`;
      }
    }
  }

  function drawAvatar(ctx, image, x, y, radius, fallback, outline) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, radius + 3, 0, Math.PI * 2); ctx.fillStyle = outline; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
    const gradient = ctx.createLinearGradient(x-radius, y-radius, x+radius, y+radius);
    gradient.addColorStop(0, '#ffe6f1'); gradient.addColorStop(1, '#ded7ff');
    ctx.fillStyle = gradient; ctx.fillRect(x-radius, y-radius, radius*2, radius*2);
    if (image?.complete && image.naturalWidth) {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - side) / 2; const sy = (image.naturalHeight - side) / 2;
      ctx.drawImage(image, sx, sy, side, side, x-radius, y-radius, radius*2, radius*2);
    } else {
      ctx.font = `${radius * 1.35}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#765a83'; ctx.fillText(fallback, x, y+1);
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius+3, 0, Math.PI*2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  }

  function drawBomb(ctx, x, y, radius, elapsed) {
    ctx.save();
    ctx.shadowColor = 'rgba(41,31,81,.25)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 4;
    const grad = ctx.createRadialGradient(x-radius*.35, y-radius*.4, 1, x, y, radius*1.25);
    grad.addColorStop(0, '#8074a7'); grad.addColorStop(.65, '#383149'); grad.addColorStop(1, '#181625');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#c8bddb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x+radius*.2,y-radius*.8); ctx.quadraticCurveTo(x+radius*.8,y-radius*1.25,x+radius*.86,y-radius*1.5); ctx.stroke();
    ctx.fillStyle = Math.sin(elapsed/110 + x) > 0 ? '#ffd76a' : '#ff8b87'; ctx.beginPath(); ctx.arc(x+radius*.88,y-radius*1.5,Math.max(2,radius*.18),0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawHeart(ctx, x, y, radius, elapsed) {
    ctx.save(); ctx.translate(x,y + Math.sin(elapsed/180 + x)*3); ctx.rotate(-.12);
    ctx.shadowColor = 'rgba(207,71,139,.34)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff6ca6'; ctx.font = `900 ${radius*2.35}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥',0,0);
    ctx.restore();
  }

  function observePlayerEffects(nextData) {
    const roundNo = Number(nextData.meta?.roundNo || 0);
    const players = nextData.players || {};
    const stats = {
      host: { score: Number(players.host?.score) || 0, lives: Number(players.host?.lives ?? 3) },
      guest: { score: Number(players.guest?.score) || 0, lives: Number(players.guest?.lives ?? 3) }
    };
    if (observedStatsRound !== roundNo || !observedPlayerStats) {
      observedStatsRound = roundNo;
      observedPlayerStats = stats;
      return;
    }
    for (const playerRole of ['host', 'guest']) {
      const before = observedPlayerStats[playerRole];
      const after = stats[playerRole];
      if (after.lives < before.lives) triggerCharacterEffect(playerRole, 'bomb');
      else if (after.score > before.score) triggerCharacterEffect(playerRole, 'heart');
    }
    observedPlayerStats = stats;
  }

  function triggerCharacterEffect(playerRole, kind) {
    characterEffects[playerRole] = { kind, startedAt: nowServer(), token: `${playerRole}-${kind}-${Date.now()}-${Math.random()}` };
  }

  function drawCharacterEffect(ctx, kind, x, y, radius, frame) {
    if (!frame) return;
    ctx.save();
    if (kind === 'heart') {
      const lift = frame.progress * 31;
      ctx.globalAlpha = frame.alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 17px system-ui, sans-serif';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.strokeText('+10', x, y - radius - 17 - lift);
      ctx.fillStyle = '#df438d'; ctx.fillText('+10', x, y - radius - 17 - lift);
      ctx.font = '17px system-ui, sans-serif'; ctx.fillText('💗', x + radius + 9, y - radius - 14 - lift * .75);
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
        const distance = radius + 8 + frame.progress * 20;
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance - lift * .3;
        ctx.fillStyle = i % 2 ? '#ffe08b' : '#ff8fc2';
        ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, 3.2 * frame.alpha), 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'bomb') {
      ctx.globalAlpha = frame.alpha;
      ctx.strokeStyle = `rgba(255,75,105,${.72 * frame.alpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(x, y, radius + 8 + frame.progress * 20, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255,70,100,${frame.flash * .3})`;
      ctx.beginPath(); ctx.arc(x, y, radius + 4, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '900 12px system-ui, sans-serif';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeText('-1 NYAWA', x, y - radius - 15 - frame.progress * 18);
      ctx.fillStyle = '#d94b65'; ctx.fillText('-1 NYAWA', x, y - radius - 15 - frame.progress * 18);
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i / 6) + frame.progress * .8;
        const distance = radius + 8 + frame.progress * 23;
        ctx.fillStyle = i % 2 ? '#ff9a83' : '#ffe08b';
        ctx.beginPath(); ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, Math.max(1, 2.8 * frame.alpha), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawArena(now) {
    const canvas = root.querySelector('[data-bs-arena]');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width*dpr), h = Math.round(rect.height*dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const width = rect.width, height = rect.height;
    const deltaMs = lastArenaFrameAt ? Math.max(0, Math.min(80, now - lastArenaFrameAt)) : 16;
    lastArenaFrameAt = now;
    const meta = data.meta || {};
    const elapsed = Math.max(0, now - Number(meta.startedAt || now));
    const seed = Number(meta.seed) || 1;

    const sky = ctx.createLinearGradient(0,0,0,height);
    sky.addColorStop(0,'#8fc9ec'); sky.addColorStop(.45,'#c3b8f2'); sky.addColorStop(.78,'#f6c9e0'); sky.addColorStop(1,'#ffe3bc');
    ctx.fillStyle = sky; ctx.fillRect(0,0,width,height);
    ctx.save();
    for (let i=0;i<8;i++) {
      const x = ((i*137 + 38) % width); const y = ((i*73 + 35) % (height*.66));
      ctx.globalAlpha = .11 + (i%3)*.025; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(x,y,38+(i%3)*12,16+(i%2)*8,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x-22,y+4,23,15,0,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    for (let i=0;i<24;i++) {
      const x = (i*71+19)%width, y = (i*47+17)%(height*.72);
      ctx.globalAlpha = .25 + .2*Math.abs(Math.sin(elapsed/900+i)); ctx.fillStyle = '#fff4c8';
      ctx.beginPath(); ctx.arc(x,y,1.2+(i%3)*.45,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    // Distant cloud puffs.
    for (let i=0;i<5;i++) {
      const x = ((i*width/4.3 - elapsed*.009) % (width+100) + width+100)%(width+100)-35;
      const y = height*(.16 + (i%2)*.12);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let j=0;j<4;j++) { ctx.beginPath(); ctx.arc(x+j*22,y+(j%2)*5,20+(j%2)*5,0,Math.PI*2); ctx.fill(); }
    }
    // Falling objects, deterministic on both devices.
    const objectLimit = Math.min(90, Math.ceil((Math.min(elapsed, BOMB_STORM_DURATION_SECONDS*1000)+5000)/760)+1);
    for (let i=0;i<objectLimit;i++) {
      const object = createBombStormObject(seed, i);
      if (elapsed < object.spawnAt || elapsed > object.collisionAt+250) continue;
      const yNorm = getBombStormObjectY(object, elapsed);
      if (yNorm < -.17 || yNorm > .96) continue;
      const x = object.x*width; const y = yNorm*height; const r = Math.max(11, width*object.radius);
      if (object.kind === 'heart') drawHeart(ctx,x,y,r,elapsed);
      else drawBomb(ctx,x,y,r,elapsed);
    }
    // Sandy ground and a soft finish line.
    const groundY = height*.89;
    const ground = ctx.createLinearGradient(0,groundY,0,height);
    ground.addColorStop(0,'#f5c99a'); ground.addColorStop(1,'#e99c8e');
    ctx.fillStyle = ground; ctx.beginPath(); ctx.moveTo(0,groundY+12); ctx.quadraticCurveTo(width*.5,groundY-20,width,groundY+9); ctx.lineTo(width,height); ctx.lineTo(0,height); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.5)';
    for(let i=0;i<18;i++){ctx.beginPath();ctx.arc((i*53+13)%width,groundY+18+(i%3)*8,1.2+(i%2),0,Math.PI*2);ctx.fill();}

    const players = data.players || {};
    for (const playerRole of ['host','guest']) {
      const profile = playerRole === role ? { ...(players[playerRole] || {}), ...localPlayer } : (players[playerRole] || {});
      const targetX = clampPlayerX(profile.x ?? (playerRole==='host'?.32:.68));
      if (renderedPlayerX[playerRole] === null) renderedPlayerX[playerRole] = targetX;
      else renderedPlayerX[playerRole] = smoothPlayerX(renderedPlayerX[playerRole], targetX, deltaMs, 68);
      const x = renderedPlayerX[playerRole] * width;
      const baseY = groundY-15;
      const radius = Math.max(18,Math.min(27,width*.072));
      const effect = characterEffects[playerRole];
      const frame = effect ? getBombStormEffectFrame(effect.kind, now - effect.startedAt) : null;
      if (effect && !frame) characterEffects[playerRole] = null;
      if (frame) {
        ctx.save();
        ctx.translate(x + frame.xOffset, baseY + frame.yOffset);
        ctx.rotate(frame.rotation);
        ctx.scale(frame.scaleX, frame.scaleY);
        drawAvatar(ctx,avatarImages[playerRole],0,0,radius,avatarCharacter(avatarData[playerRole])||(playerRole==='host'?'👾':'🧸'),playerRole==='host'?'#4ea8f4':'#f18aae');
        ctx.restore();
        // Floating points, particles, and an impact ring are separate from the avatar's coordinates.
        drawCharacterEffect(ctx, effect.kind, x, baseY, radius, frame);
      } else {
        drawAvatar(ctx,avatarImages[playerRole],x,baseY,radius,avatarCharacter(avatarData[playerRole])||(playerRole==='host'?'👾':'🧸'),playerRole==='host'?'#4ea8f4':'#f18aae');
      }
      ctx.save(); ctx.font='700 10px system-ui'; ctx.textAlign='center'; ctx.fillStyle='rgba(71,45,89,.82)';
      const label = String(profile.name || names[playerRole]).slice(0,16);
      ctx.fillText(label,x,baseY+Math.max(32,width*.085)); ctx.restore();
    }
    if (now < Number(meta.startedAt || 0)) {
      const count = Math.max(1,Math.ceil((Number(meta.startedAt)-now)/1000));
      const countdown = root.querySelector('[data-bs-countdown]');
      if (countdown) { countdown.hidden=false; countdown.textContent=String(count); }
    } else {
      const countdown = root.querySelector('[data-bs-countdown]'); if(countdown) countdown.hidden=true;
    }
  }

  function writeOwn(fields) {
    localPlayer = { ...localPlayer, ...fields, updatedAt: nowServer() };
    return update(playerRef, { ...fields, updatedAt: localPlayer.updatedAt }).catch(error => {
      const now = Date.now();
      if (now - lastProgressToast > 5000) { lastProgressToast=now; notify(`Progres belum tersinkron: ${error.message}. Periksa jaringan.`, 'error'); }
      throw error;
    });
  }

  function queuePositionWrite() {
    if (positionWriteTimer) return;
    const delay = Math.max(0, 140 - (Date.now()-lastPositionWrite));
    positionWriteTimer = window.setTimeout(async () => {
      positionWriteTimer=0; lastPositionWrite=Date.now();
      try { await writeOwn({ x: localPlayer.x }); } catch { /* Player position remains local until the next adjustment. */ }
    }, delay);
  }

  function setPosition(value) {
    if (localPlayer.finished || data.meta?.phase !== 'playing') return;
    localPlayer.x = clampPlayerX(value);
    localPlayer.updatedAt = nowServer();
    const slider = root.querySelector('[data-bs-move-slider]'); if (slider) slider.value=String(Math.round(localPlayer.x*100));
    queuePositionWrite();
  }

  function processMyProgress(now) {
    const meta=data.meta;
    if (!meta || meta.phase!=='playing' || localPlayer.finished || now < Number(meta.startedAt)) return;
    const elapsed = now-Number(meta.startedAt);
    const next = processLandedObjects({ seed:meta.seed, elapsedMs:elapsed, processedIndex:localPlayer.processedIndex, playerX:localPlayer.x, score:localPlayer.score, lives:localPlayer.lives });
    const updates = {};
    if (next.processedIndex !== localPlayer.processedIndex) {
      updates.processedIndex=next.processedIndex; updates.score=next.score; updates.lives=next.lives;
    }
    if (next.finished || elapsed >= meta.durationSeconds*1000+BOMB_STORM_FALL_GRACE_MS) updates.finished=true;
    if (Object.keys(updates).length) {
      localPlayer = { ...localPlayer, ...updates, updatedAt:now };
      void update(playerRef,{...updates,updatedAt:now}).catch(error=>{
        const current=Date.now(); if(current-lastProgressToast>5000){lastProgressToast=current;notify(`Skor belum tersinkron: ${error.message}.`, 'error');}
      });
      if(next.events.some(event=>event.result==='collected')) notify('Hati berhasil dikumpulkan! +10 💗','success');
      if(next.events.some(event=>event.result==='hit')) notify('Aduh, terkena bom! Satu nyawa berkurang.','error');
    }
  }

  async function ensureMeta() {
    if (role !== 'host') return;
    await runTransaction(metaRef, current => current || ({
      phase:'lobby', roundNo:1, seed:makeSeed(), durationSeconds:BOMB_STORM_DURATION_SECONDS,
      createdAt:nowServer(), startedAt:0
    }), { applyLocally:false });
  }

  async function ensureOwnPlayer() {
    const snapshot=await get(playerRef);
    if (snapshot.exists()) {
      localPlayer={...localPlayer,...snapshot.val()};
      return;
    }
    const profile={ name:names[role], ready:false, roundNo:Number(data.meta?.roundNo||1), x:role==='host'?.32:.68, score:0, lives:3, processedIndex:-1, finished:false, updatedAt:nowServer() };
    for(const [key,value] of Object.entries(profile)) await set(ref(db,`${playerPath(role)}/${key}`),value);
    localPlayer=profile;
  }

  async function resetOwnForRound(roundNo) {
    const baseX=role==='host'?.32:.68;
    const reset={ ready:false, roundNo:Number(roundNo), x:baseX, score:0, lives:3, processedIndex:-1, finished:false, updatedAt:nowServer() };
    try {
      await update(playerRef,reset);
      localPlayer={...localPlayer,...reset};
      localPlayer._roundNo=roundNo;
    } catch(error) { notify(`Persiapan ronde baru gagal: ${error.message}`,'error'); }
  }

  async function maybeStart() {
    if(role!=='host'||!data.meta||data.meta.phase!=='lobby'||!data.players?.host?.ready||!data.players?.guest?.ready) return;
    if(Number(data.players?.host?.roundNo)!==Number(data.meta.roundNo)||Number(data.players?.guest?.roundNo)!==Number(data.meta.roundNo)) return;
    const key=`${data.meta.roundNo}`;
    if(lastStartAttempt===key) return;
    lastStartAttempt=key;
    try {
      await runTransaction(metaRef,current=>{
        if(!current||current.phase!=='lobby'||Number(current.roundNo)!==Number(key)) return;
        return {...current,phase:'playing',startedAt:nowServer()+3500};
      },{applyLocally:false});
    } catch(error) { lastStartAttempt=''; notify(`Permainan belum bisa dimulai: ${error.message}`,'error'); }
  }

  async function finishGameIfNeeded(now) {
    if(role!=='host'||!data.meta||data.meta.phase!=='playing'||resultBusy) return;
    const elapsed=now-Number(data.meta.startedAt||now);
    const bothFinished=Boolean(data.players?.host?.finished&&data.players?.guest?.finished);
    if(!bothFinished && elapsed < data.meta.durationSeconds*1000+BOMB_STORM_FALL_GRACE_MS+1200) return;
    resultBusy=true;
    try {
      await runTransaction(metaRef,current=>{
        if(!current||current.phase!=='playing') return;
        const both=Boolean(data.players?.host?.finished&&data.players?.guest?.finished);
        const elapsedNow=nowServer()-Number(current.startedAt||nowServer());
        if(!both && elapsedNow < current.durationSeconds*1000+BOMB_STORM_FALL_GRACE_MS+1200) return;
        return {...current,phase:'result',endedAt:nowServer()};
      },{applyLocally:false});
    } catch(error) { notify(`Hasil permainan belum tersimpan: ${error.message}`,'error'); }
    finally { resultBusy=false; }
  }

  async function maybeStartRematch() {
    if(role!=='host'||!data.meta||data.meta.phase!=='result'||rematchBusy) return;
    const roundNo=Number(data.meta.roundNo);
    if(Number(data.rematchRequests?.host)!==roundNo||Number(data.rematchRequests?.guest)!==roundNo) return;
    rematchBusy=true;
    try {
      await runTransaction(metaRef,current=>{
        if(!current||current.phase!=='result'||Number(current.roundNo)!==roundNo) return;
        return {...current,phase:'lobby',roundNo:roundNo+1,seed:nextBombStormSeed(current.seed,roundNo),createdAt:nowServer(),startedAt:0};
      },{applyLocally:false});
    } catch(error) { notify(`Ronde baru belum bisa disiapkan: ${error.message}`,'error'); }
    finally { rematchBusy=false; }
  }

  function renderState() {
    if(destroyed) return;
    updateAvatarDisplays(); updateHud();
    const phase=data.meta?.phase || 'lobby';
    showPanel(phase==='playing'?'playing':phase==='result'?'result':'lobby');
    const readyButton=root.querySelector('[data-bs-action="ready"]');
    const isPreparedForRound=Number(data.players?.[role]?.roundNo)===Number(data.meta?.roundNo);
    if(readyButton){readyButton.disabled=Boolean(data.players?.[role]?.ready)||readyBusy||avatarBusy||!isPreparedForRound;readyButton.textContent=data.players?.[role]?.ready?'Kamu siap ✓':readyBusy?'Menyimpan…':!isPreparedForRound?'Menyiapkan ronde…':'Aku siap bermain';}
    const rematchButton=root.querySelector('[data-bs-action="rematch"]');
    if(rematchButton){const voted=Number(data.rematchRequests?.[role])===Number(data.meta?.roundNo);rematchButton.disabled=voted||rematchBusy;rematchButton.textContent=voted?'Menunggu pasangan…':rematchBusy?'Menyimpan…':'Main lagi';}
    if(phase==='playing'){
      const start=Number(data.meta.startedAt||0); const now=nowServer();
      const remaining=getBombStormRemaining(start,data.meta.durationSeconds,now);
      const timer=root.querySelector('[data-bs-timer]'); if(timer) timer.textContent=String(remaining).padStart(2,'0');
      const label=root.querySelector('[data-bs-round-label]'); if(label) label.textContent=`RONDE ${data.meta.roundNo||1}`;
      const slider=root.querySelector('[data-bs-move-slider]'); if(slider) slider.value=String(Math.round(localPlayer.x*100));
      const banner=root.querySelector('[data-bs-banner]'); if(banner) banner.textContent=now<start?'Siap-siap…':localPlayer.finished?'Kamu sudah selesai. Menunggu ronde berakhir.':'Geser dan kumpulkan hati!';
    }
    if(phase==='result'){
      const result=determineBombStormWinner(data.players||{});
      const title=root.querySelector('[data-bs-result-title]'); const subtitle=root.querySelector('[data-bs-result-subtitle]');
      if(title) title.textContent=result.winner==='draw'?'Seri! Kalian sama kuat.':`${names[result.winner]} memenangkan ronde!`;
      if(subtitle) subtitle.textContent=`${result.hostScore} poin untuk ${names.host}, ${result.guestScore} poin untuk ${names.guest}.`;
      for(const playerRole of ['host','guest']){
        const score=root.querySelector(`[data-bs-result-score="${playerRole}"]`);if(score)score.textContent=String(data.players?.[playerRole]?.score||0);
        const lives=root.querySelector(`[data-bs-result-lives="${playerRole}"]`);if(lives)lives.textContent=`${Math.max(0,Number(data.players?.[playerRole]?.lives??3))} nyawa tersisa`;
      }
    }
    if(phase==='lobby' && data.meta?.roundNo){
      const note=root.querySelector('.bs-lobby-heading p');
      if(note)note.textContent=Number(data.meta.roundNo)>1?'Ronde baru siap! Kamu bisa mengganti karakter, lalu nyatakan siap.':'Pilih karakter bawaan, ambil foto langsung, atau pilih foto dari galeri sebelum siap bermain.';
    }
  }

  async function markReady() {
    if(readyBusy||data.players?.[role]?.ready||Number(data.players?.[role]?.roundNo)!==Number(data.meta?.roundNo))return;
    readyBusy=true;renderState();
    try{await writeOwn({ready:true});notify('Kesiapan tersimpan. Menunggu pasangan…','success');}
    catch(error){notify(`Belum bisa menyimpan kesiapan: ${error.message}`,'error');}
    finally{readyBusy=false;renderState();}
  }

  async function pickAvatar(file) {
    if(avatarBusy)return;
    avatarBusy=true;updateAvatarDisplays();const status=root.querySelector('[data-bs-avatar-status]');if(status)status.textContent='Menyiapkan foto…';
    try{
      const avatar=await compressAvatar(file);
      await set(avatarRef,avatar);
      notify('Selfie berhasil dijadikan avatar!','success');
      updateAvatarDisplays();
      avatarData[role]=avatar;avatarSources[role]=avatar;avatarImages[role]=imageFromDataUrl(avatar);if(avatarImages[role])avatarImages[role].onload=()=>{if(!destroyed&&data.meta?.phase==='playing')drawArena(nowServer());};
      updateAvatarDisplays();
    }catch(error){notify(error.message,'error');if(status)status.textContent='Foto belum berhasil dipasang.';}
    finally{avatarBusy=false;updateAvatarDisplays();}
  }

  async function selectCharacter(characterId) {
    if (avatarBusy || data.meta?.phase !== 'lobby' || data.players?.[role]?.ready || !CHARACTER_BY_ID[characterId]) return;
    avatarBusy = true;
    updateAvatarDisplays();
    try {
      const value = characterValue(characterId);
      await set(avatarRef, value);
      avatarData[role] = value;
      avatarSources[role] = value;
      avatarImages[role] = null;
      updateAvatarDisplays();
      notify(`Karakter ${CHARACTER_BY_ID[characterId].name} dipilih!`, 'success');
    } catch (error) {
      notify(`Karakter belum dapat disimpan: ${error.message}`, 'error');
    } finally {
      avatarBusy = false;
      updateAvatarDisplays();
    }
  }

  async function ensureDefaultAvatar() {
    // Restore a previously selected character/photo before assigning a role default.
    try {
      const snapshot = await get(avatarRef);
      const existing = safeAvatar(snapshot.val());
      if (existing) {
        avatarData[role] = existing;
        avatarSources[role] = existing;
        avatarImages[role] = isImageAvatar(existing) ? imageFromDataUrl(existing) : null;
        if (avatarImages[role]) avatarImages[role].onload = () => { if (!destroyed && data.meta?.phase === 'playing') drawArena(nowServer()); };
        updateAvatarDisplays();
        return;
      }
    } catch (error) {
      notify(`Pilihan karakter sebelumnya belum dapat dimuat: ${error.message}`, 'error');
    }
    const value = characterValue(DEFAULT_CHARACTER_BY_ROLE[role]);
    try {
      await set(avatarRef, value);
      avatarData[role] = value;
      avatarSources[role] = value;
      avatarImages[role] = null;
      updateAvatarDisplays();
    } catch (error) {
      // The local default is still used visually if the initial write is unavailable.
      avatarData[role] = value;
      updateAvatarDisplays();
      notify(`Karakter bawaan dipakai sementara. Sinkronisasi tertunda: ${error.message}`, 'error');
    }
  }

  async function requestRematch() {
    if(rematchBusy||data.meta?.phase!=='result'||Number(data.rematchRequests?.[role])===Number(data.meta.roundNo))return;
    rematchBusy=true;renderState();
    try{await set(ref(db,`${basePath}/rematchRequests/${role}`),Number(data.meta.roundNo));notify('Permintaan main lagi terkirim. Menunggu pasangan…','success');}
    catch(error){notify(`Permintaan main lagi gagal: ${error.message}`,'error');}
    finally{rematchBusy=false;renderState();}
  }

  function clickHandler(event) {
    const action=event.target.closest('[data-bs-action]')?.dataset.bsAction;
    if(action==='back'){onBack?.();return;}
    if(action==='ready')void markReady();
    if(action==='rematch')void requestRematch();
    if(action==='camera')void avatarCamera?.open();
    if(action==='gallery')root.querySelector('#bs-avatar-gallery')?.click();
    const character = event.target.closest('[data-bs-character]')?.dataset.bsCharacter;
    if(character)void selectCharacter(character);
  }

  function changeHandler(event) {
    if(event.target.matches('#bs-avatar-gallery')){
      const file=event.target.files?.[0];if(file)void pickAvatar(file);event.target.value='';
    }
  }

  function inputHandler(event) {
    if(event.target.matches('[data-bs-move-slider]'))setPosition(Number(event.target.value)/100);
  }

  function pointerDownHandler(event) {
    const arena=event.target.closest('[data-bs-arena]');
    if(arena && data.meta?.phase==='playing'){
      event.preventDefault();dragPointer=event.pointerId;arena.setPointerCapture?.(event.pointerId);const rect=arena.getBoundingClientRect();setPosition((event.clientX-rect.left)/rect.width);return;
    }
    const move=event.target.closest('[data-bs-move]');
    if(move && data.meta?.phase==='playing'){
      event.preventDefault();move.setPointerCapture?.(event.pointerId);const direction=move.dataset.bsMove==='left'?-1:1;setPosition(localPlayer.x+direction*.05);
      moveHoldTimer=window.setInterval(()=>setPosition(localPlayer.x+direction*.025),75);
    }
  }

  function pointerMoveHandler(event) {
    if(dragPointer===event.pointerId){const arena=root.querySelector('[data-bs-arena]');if(!arena)return;const rect=arena.getBoundingClientRect();setPosition((event.clientX-rect.left)/rect.width);}
  }

  function pointerUpHandler(event) {
    if(dragPointer===event.pointerId)dragPointer=null;
    if(moveHoldTimer){clearInterval(moveHoldTimer);moveHoldTimer=0;}
  }

  function keyHandler(event) {
    if(data.meta?.phase!=='playing')return;
    if(event.key==='ArrowLeft'){event.preventDefault();setPosition(localPlayer.x-.035);}
    if(event.key==='ArrowRight'){event.preventDefault();setPosition(localPlayer.x+.035);}
  }

  function tick() {
    if(destroyed)return;
    const now=nowServer();
    if(data.meta?.phase==='playing'){
      processMyProgress(now);
      finishGameIfNeeded(now);
      drawArena(now);
      const timer=root.querySelector('[data-bs-timer]');if(timer)timer.textContent=String(getBombStormRemaining(Number(data.meta.startedAt),data.meta.durationSeconds,now)).padStart(2,'0');
      const countdown=root.querySelector('[data-bs-countdown]');if(countdown && now>=Number(data.meta.startedAt||0))countdown.hidden=true;
      updateHud();
    }
    if(role==='host'&&data.meta?.phase==='result')maybeStartRematch();
    rafId=requestAnimationFrame(tick);
  }

  async function init() {
    if(initBusy)return;initBusy=true;
    try{
      await ensureMeta();
      await ensureOwnPlayer();
      await ensureDefaultAvatar();
      unsubscribeOffset=onValue(ref(db,'/.info/serverTimeOffset'),snapshot=>{serverOffset=Number(snapshot.val())||0;});
      unsubscribeGame=onValue(baseRef,snapshot=>{
        if(destroyed)return;
        const nextData=snapshot.val()||{};
        observePlayerEffects(nextData);
        data=nextData;
        const playerSnapshot=data.players?.[role];
        if(playerSnapshot){
          const snapshotAt=Number(playerSnapshot.updatedAt)||0;
          if(snapshotAt>=Number(localPlayer.updatedAt||0))localPlayer={...localPlayer,...playerSnapshot};
        }
        const roundNo=Number(data.meta?.roundNo||0);
        if(observedRoundNo===null){
          observedRoundNo=roundNo;
          if(roundNo>0 && Number(data.players?.[role]?.roundNo)!==roundNo)void resetOwnForRound(roundNo);
        }
        else if(roundNo>observedRoundNo){observedRoundNo=roundNo;void resetOwnForRound(roundNo);}
        renderState();
        void maybeStart();
        if(role==='host'&&data.meta?.phase==='result')void maybeStartRematch();
        if(data.meta?.phase==='playing')drawArena(nowServer());
      },error=>notify(`Koneksi Bomb Storm terganggu: ${error.message}`,'error'));
      unsubscribeAvatars=onValue(avatarsRef,snapshot=>{
        if(destroyed)return;
        avatarData=snapshot.val()||{};
        for(const playerRole of ['host','guest']){
          const source=safeAvatar(avatarData[playerRole]);
          if(source!==avatarSources[playerRole]){
            avatarSources[playerRole]=source;
            avatarImages[playerRole]=source?imageFromDataUrl(source):null;
            if(avatarImages[playerRole])avatarImages[playerRole].onload=()=>{if(!destroyed&&data.meta?.phase==='playing')drawArena(nowServer());};
          }
        }
        updateAvatarDisplays();
      },error=>notify(`Avatar pasangan belum dapat dimuat: ${error.message}`,'error'));
      renderState();
      lastArenaFrameAt=0;
      rafId=requestAnimationFrame(tick);
      timerId=window.setInterval(()=>{if(data.meta?.phase==='playing')renderState();},250);
    }catch(error){
      showPanel('error');const target=root.querySelector('[data-bs-error]');if(target)target.textContent=error.message||'Tidak dapat memuat permainan.';
    }finally{initBusy=false;}
  }

  shell();
  arcadeFeedback = createArcadeFeedback(root, '.bs-shell');
  avatarCamera = createAvatarCamera(root, { onCapture: pickAvatar, onNotice: notify });
  void init();
  return {
    destroy(){
      destroyed=true;
      if(unsubscribeGame)unsubscribeGame();if(unsubscribeAvatars)unsubscribeAvatars();if(unsubscribeOffset)unsubscribeOffset();
      if(rafId)cancelAnimationFrame(rafId);if(timerId)clearInterval(timerId);
      if(positionWriteTimer)clearTimeout(positionWriteTimer);if(moveHoldTimer)clearInterval(moveHoldTimer);
      root.removeEventListener('click',clickHandler);root.removeEventListener('change',changeHandler);root.removeEventListener('input',inputHandler);
      root.removeEventListener('pointerdown',pointerDownHandler);root.removeEventListener('pointermove',pointerMoveHandler);root.removeEventListener('pointerup',pointerUpHandler);root.removeEventListener('pointercancel',pointerUpHandler);
      window.removeEventListener('keydown',keyHandler);
      avatarCamera?.destroy();
      arcadeFeedback?.destroy();
    }
  };
}
