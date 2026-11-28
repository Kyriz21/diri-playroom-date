import { db, ref, get, set, update, onValue, runTransaction } from '../firebase.js';
import { createAvatarCamera } from '../services/avatar-camera.js';
import { createArcadeFeedback } from '../services/arcade-feedback.js';
import {
  ARCADE_STAGES, ARCADE_AVATARS, ARCADE_STAGE_DURATION_MS,
  createArcadePlayer, createArcadeEntities, getArcadeEntityPosition,
  stepArcadePlayer, getArcadeRemaining, getArcadeWinner, getArcadeLane
} from './arcade-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const isImageAvatar = value => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(value) && value.length <= 22000;
const safeAvatar = value => isImageAvatar(value) || /^character:(cat|rabbit|panda|fox|frog|monkey|koala|tiger|chick|unicorn|alien|bear)$/.test(String(value || '')) ? value : 'character:cat';
const avatarEmoji = value => ARCADE_AVATARS.find(item => item.id === String(value || '').replace(/^character:/, ''))?.emoji || '🐱';
const randomSeed = () => { const n = new Uint32Array(1); crypto.getRandomValues(n); return n[0] || 1; };

async function compressAvatar(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Pilih file gambar untuk karakter.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Ukuran foto maksimal 12 MB.');
  let bitmap = null; let image = null; let url = '';
  try {
    if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
    else {
      url = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error('Foto tidak dapat dibuka.')); img.src = url; });
    }
    const source = bitmap || image;
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;
    const side = Math.min(width, height);
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tidak dapat menyiapkan foto karakter.');
    ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 128, 128);
    let result = canvas.toDataURL('image/jpeg', 0.62);
    if (result.length > 22000) result = canvas.toDataURL('image/jpeg', 0.45);
    if (result.length > 22000) throw new Error('Foto masih terlalu besar. Pilih foto lain.');
    return result;
  } finally { bitmap?.close?.(); if (url) URL.revokeObjectURL(url); }
}

function imageFromAvatar(value) {
  if (!isImageAvatar(value)) return null;
  const image = new Image(); image.src = value; return image;
}

export function mountArcade(root, context) {
  const { code, session, room, role, player, onBack, toast: globalToast = () => {} } = context;
  const opponentRole = role === 'host' ? 'guest' : 'host';
  const names = { host: room.host?.name || 'Pemain 1', guest: room.guest?.name || 'Pemain 2' };
  const basePath = `roomGames/${code}/${session.sessionId}/arcade`;
  const baseRef = ref(db, basePath);
  const metaRef = ref(db, `${basePath}/meta`);
  const playerRef = ref(db, `${basePath}/players/${role}`);
  const presenceRef = ref(db, `rooms/${code}/presence`);
  let feedback = null;
  let avatarCamera = null;
  let unsubscribeGame = null;
  let unsubscribePresence = null;
  let unsubscribeOffset = null;
  let serverOffset = 0;
  let data = {};
  let presence = room.presence || {};
  let destroyed = false;
  let initializing = false;
  let avatarBusy = false;
  let readyBusy = false;
  let starting = false;
  let transitionBusy = false;
  let lastPhase = '';
  let rafId = 0;
  let lastFrame = 0;
  let lastWriteAt = 0;
  let lastNotifyAt = 0;
  let input = { jump: false, jumpPressed: false };
  let localSim = null;
  let localStageIndex = -1;
  let entitiesByRole = { host: [], guest: [] };
  let avatarImages = { host: null, guest: null };
  let avatarSources = { host: '', guest: '' };
  let canvas = null;
  let canvasTapHandler = null;
  let ctx = null;
  let stageNode = null;
  let timerNode = null;
  let scoreNodes = {};
  let livesNodes = {};
  let bannerNode = null;

  const nowServer = () => Date.now() + serverOffset;
  const notify = (message, type = 'default', options) => feedback ? feedback.show(message, type, options) : globalToast(message, type);
  const ownPlayer = () => data.players?.[role] || {};
  const partnerPlayer = () => data.players?.[opponentRole] || {};
  const bothOnline = () => presence?.host?.connected === true && presence?.guest?.connected === true;

  function buildShell() {
    root.innerHTML = `
      <section class="arcade-shell">
        <header class="arcade-header">
          <div><span class="arcade-kicker">DIRI. · TWO PLAYERS, ONE CLOCK</span><h1>Arcade <span>✦</span></h1><p>Dua karakter, satu tantangan Flappy Face. Ketuk untuk mengepak dan lewati pipa.</p></div>
          <div class="arcade-header-actions"><span class="arcade-room-code">${esc(code)}</span><button class="button button-quiet button-small" data-ar-action="back">Kembali</button></div>
        </header>
        <div data-ar-screen></div>
      </section>`;
    feedback = createArcadeFeedback(root, '.arcade-shell');
    avatarCamera = createAvatarCamera(root, { onCapture: saveAvatarFile, onNotice: notify });
  }

  function avatarMarkup(value, roleName, isMine = false) {
    const avatar = safeAvatar(value);
    const content = isImageAvatar(avatar) ? `<img src="${avatar}" alt="Karakter ${esc(roleName)}">` : `<span>${avatarEmoji(avatar)}</span>`;
    return `<div class="arcade-avatar-preview ${isMine ? 'is-mine' : ''}">${content}</div>`;
  }

  function renderSetup() {
    const mine = ownPlayer();
    const partner = partnerPlayer();
    const mineAvatar = safeAvatar(mine.avatar || 'character:cat');
    const partnerAvatar = safeAvatar(partner.avatar || (opponentRole === 'host' ? 'character:alien' : 'character:bear'));
    const bothReady = bothOnline() && data.players?.host?.ready === true && data.players?.guest?.ready === true;
    const screen = root.querySelector('[data-ar-screen]');
    screen.innerHTML = `
      <section class="arcade-setup-card">
        <div class="arcade-setup-intro"><span class="arcade-eyebrow">INSERT COIN · FLAPPY FACE</span><h2>Siapkan wajah jagoanmu</h2><p>Pakai foto kamera, pilih dari galeri, atau gunakan karakter lucu. Lalu tap layar atau tombol LOMPAT untuk mengepak melewati pipa.</p></div>
        <div class="arcade-avatar-pair">
          <article class="arcade-avatar-card is-pink"><div data-ar-avatar="mine">${avatarMarkup(mineAvatar, names[role], true)}</div><strong>${esc(names[role])}</strong><small>Karakter kamu</small><span class="arcade-player-status ${mine.ready ? 'is-ready' : ''}" data-ar-ready="${role}">${mine.ready ? 'Siap bermain ✓' : 'Belum siap'}</span></article>
          <div class="arcade-versus">VS</div>
          <article class="arcade-avatar-card is-blue"><div data-ar-avatar="partner">${avatarMarkup(partnerAvatar, names[opponentRole])}</div><strong>${esc(names[opponentRole])}</strong><small>Karakter pasangan</small><span class="arcade-player-status ${partner.ready ? 'is-ready' : ''}" data-ar-ready="${opponentRole}">${partner.ready ? 'Siap bermain ✓' : 'Menyiapkan karakter…'}</span></article>
        </div>
        <div class="arcade-avatar-picker"><div class="arcade-picker-heading"><strong>Pilih karakter</strong><span>Atau ganti dengan foto wajahmu</span></div><div class="arcade-avatar-options">${ARCADE_AVATARS.map(item => `<button type="button" class="arcade-avatar-option ${mineAvatar === `character:${item.id}` ? 'is-selected' : ''}" data-ar-avatar-choice="${item.id}" aria-label="Pilih ${item.name}" title="${item.name}">${item.emoji}</button>`).join('')}</div><div class="arcade-photo-actions"><button class="button button-secondary button-small" data-ar-action="camera">📷 Ambil foto</button><button class="button button-secondary button-small" data-ar-action="gallery">🖼 Pilih dari galeri</button><input type="file" accept="image/*" data-ar-gallery hidden></div></div>
        <div class="arcade-howto-grid"><div><b>TAP / KLIK</b><span>Kepakkan sayap</span></div><div><b>SPACE / ↑</b><span>Flap di keyboard</span></div><div><b>♥ × 3</b><span>Tiga kesempatan</span></div></div>
        <div class="arcade-coin-row"><div><span class="arcade-coin-icon">🕹️</span><div><strong>${bothReady ? 'Dua pemain siap!' : 'Menunggu dua pemain…'}</strong><small>${bothReady ? 'Host dapat memasukkan koin untuk memulai satu tantangan 60 detik.' : 'Kalian berdua harus memilih karakter dan menyatakan siap.'}</small></div></div><div class="arcade-coin-actions"><button class="button button-secondary" data-ar-action="ready" ${mine.ready || avatarBusy || readyBusy || !bothOnline() ? 'disabled' : ''}>${mine.ready ? 'Kamu siap ✓' : readyBusy ? 'Menyimpan…' : 'Saya siap'}</button>${role === 'host' ? `<button class="button button-primary arcade-insert-button" data-ar-action="insert-coin" ${bothReady && !starting ? '' : 'disabled'}>${starting ? 'Menyiapkan…' : 'Insert coin →'}</button>` : `<span class="arcade-waiting-note">${bothReady ? 'Menunggu host memasukkan koin…' : 'Tunggu pasangan siap.'}</span>`}</div></div>
        <p class="arcade-privacy-note">Kamera hanya aktif setelah kamu menekan Ambil foto. Kamu juga bisa bermain tanpa foto.</p>
      </section>`;
  }

  function renderPlaying() {
    const screen = root.querySelector('[data-ar-screen]');
    screen.innerHTML = `
      <section class="arcade-game-card">
        <div class="arcade-game-hud">
          <div class="arcade-hud-player is-pink"><span class="arcade-hud-avatar" data-ar-mini-avatar="host">${avatarEmoji(data.players?.host?.avatar)}</span><div><strong>${esc(names.host)}</strong><small><b data-ar-score="host">0</b> GATE · <span data-ar-lives="host">♥♥♥</span></small></div></div>
          <div class="arcade-stage-hud"><span data-ar-stage-count>DUEL · 60 DETIK</span><strong data-ar-stage-name>FLAPPY FACE</strong><div class="arcade-stage-progress"><i data-ar-stage-progress></i></div><b data-ar-timer>60.0</b></div>
          <div class="arcade-hud-player is-blue"><div><strong>${esc(names.guest)}</strong><small><b data-ar-score="guest">0</b> GATE · <span data-ar-lives="guest">♥♥♥</span></small></div><span class="arcade-hud-avatar" data-ar-mini-avatar="guest">${avatarEmoji(data.players?.guest?.avatar)}</span></div>
        </div>
        <div class="arcade-arena-wrap"><canvas class="arcade-arena" data-ar-canvas width="960" height="540" aria-label="Arena Flappy Face dua pemain. Ketuk untuk mengepak."></canvas><div class="arcade-arena-banner" data-ar-banner hidden></div></div>
        <div class="arcade-controls"><div class="arcade-control-label"><strong>Kontrol ${esc(names[role])}</strong><span>Tap arena atau tekan tombol</span></div><div class="arcade-control-pad"><button class="is-jump arcade-flap-button" data-ar-input="jump" aria-label="Lompat atau kepak">↟<small>LOMPAT</small></button></div></div>
        <p class="arcade-control-note">HP: tap di arena atau tombol LOMPAT. Desktop: klik arena, Spasi, atau tombol ↑. Lepas tombol untuk turun kembali.</p>
      </section>`;
    canvas = root.querySelector('[data-ar-canvas]');
    ctx = canvas?.getContext('2d');
    stageNode = root.querySelector('[data-ar-stage-name]');
    timerNode = root.querySelector('[data-ar-timer]');
    bannerNode = root.querySelector('[data-ar-banner]');
    for (const playerRole of ['host', 'guest']) { scoreNodes[playerRole] = root.querySelector(`[data-ar-score="${playerRole}"]`); livesNodes[playerRole] = root.querySelector(`[data-ar-lives="${playerRole}"]`); }
    canvasTapHandler = event => {
      if (data.meta?.phase !== 'playing' || event.target.closest('[data-ar-input]')) return;
      event.preventDefault();
      input.jumpPressed = true;
    };
    canvas?.addEventListener('pointerdown', canvasTapHandler);
    resizeCanvas();
    updateAvatarCache();
    updateStageHud();
  }

  function renderResult() {
    const screen = root.querySelector('[data-ar-screen]');
    const players = data.players || {};
    const winner = getArcadeWinner(players);
    const winnerLabel = winner.winner === 'draw' ? 'Skor imbang!' : `${esc(names[winner.winner])} menang!`;
    const playerCard = playerRole => {
      const score = Number(players[playerRole]?.score || 0);
      const gates = Number(players[playerRole]?.gatesPassed || 0);
      const lives = Math.max(0, Number(players[playerRole]?.lives ?? 0));
      return `<article class="${playerRole === 'host' ? 'is-pink' : 'is-blue'}"><span>${esc(names[playerRole])}</span><strong>${score}</strong><small>${gates} pipa terlewati · ${lives}/3 nyawa tersisa</small></article>`;
    };
    screen.innerHTML = `
      <section class="arcade-result-card"><div class="arcade-result-top"><span class="arcade-eyebrow">FLAPPY FACE · HASIL AKHIR</span><div class="arcade-result-trophy">${winner.winner === 'draw' ? '🤝' : '🏆'}</div><h2>${winnerLabel}</h2><p>Satu ronde Flappy Face selesai. Skor dihitung dari jumlah pipa yang berhasil dilewati.</p></div>
        <div class="arcade-result-score-pair">${playerCard('host')}${playerCard('guest')}</div>
        <div class="arcade-result-actions"><button class="button button-primary" data-ar-action="back-to-lobby" ${role === 'host' ? '' : 'disabled'}>Kembali ke lobi</button><span>${role === 'host' ? 'Kamu bisa memilih tantangan lagi atau permainan lain.' : 'Menunggu pembuat sesi kembali ke lobi…'}</span></div>
      </section>`;
  }

  function updateSetupUI() {
    if (data.meta?.phase !== 'setup' || !root.querySelector('.arcade-setup-card')) return;
    const mine = ownPlayer();
    const partner = partnerPlayer();
    const mineAvatar = safeAvatar(mine.avatar || 'character:cat');
    const partnerAvatar = safeAvatar(partner.avatar || (opponentRole === 'host' ? 'character:alien' : 'character:bear'));
    const mineNode = root.querySelector('[data-ar-avatar="mine"]');
    const partnerNode = root.querySelector('[data-ar-avatar="partner"]');
    if (mineNode) mineNode.innerHTML = avatarMarkup(mineAvatar, names[role], true);
    if (partnerNode) partnerNode.innerHTML = avatarMarkup(partnerAvatar, names[opponentRole]);
    const ownReady = root.querySelector(`[data-ar-ready="${role}"]`);
    const partnerReady = root.querySelector(`[data-ar-ready="${opponentRole}"]`);
    if (ownReady) { ownReady.textContent = mine.ready ? 'Siap bermain ✓' : 'Belum siap'; ownReady.classList.toggle('is-ready', mine.ready === true); }
    if (partnerReady) { partnerReady.textContent = partner.ready ? 'Siap bermain ✓' : 'Belum siap'; partnerReady.classList.toggle('is-ready', partner.ready === true); }
    root.querySelectorAll('[data-ar-avatar-choice]').forEach(button => button.classList.toggle('is-selected', mineAvatar === `character:${button.dataset.arAvatarChoice}`));
    const readyButton = root.querySelector('[data-ar-action="ready"]');
    if (readyButton) { readyButton.disabled = Boolean(mine.ready || avatarBusy || readyBusy || !bothOnline()); readyButton.textContent = mine.ready ? 'Kamu siap ✓' : readyBusy ? 'Menyimpan…' : 'Saya siap'; }
    const bothReady = bothOnline() && data.players?.host?.ready === true && data.players?.guest?.ready === true;
    const insertButton = root.querySelector('[data-ar-action="insert-coin"]');
    if (insertButton) insertButton.disabled = !bothReady || starting;
    const coinText = root.querySelector('.arcade-coin-row strong');
    const coinNote = root.querySelector('.arcade-coin-row small');
    if (coinText) coinText.textContent = bothReady ? 'Dua pemain online dan siap!' : bothOnline() ? 'Menunggu kedua pemain siap…' : 'Menunggu dua perangkat online…';
    if (coinNote) coinNote.textContent = bothReady ? 'Pembuat sesi dapat memasukkan koin untuk memulai.' : 'Pastikan kedua perangkat online, lalu pilih karakter dan nyatakan siap.';
  }

  function updateAvatarCache() {
    for (const playerRole of ['host', 'guest']) {
      const value = safeAvatar(data.players?.[playerRole]?.avatar || (playerRole === 'host' ? 'character:alien' : 'character:bear'));
      if (avatarSources[playerRole] === value) continue;
      avatarSources[playerRole] = value;
      avatarImages[playerRole] = imageFromAvatar(value);
    }
    for (const playerRole of ['host', 'guest']) {
      const node = root.querySelector(`[data-ar-mini-avatar="${playerRole}"]`);
      if (node) node.textContent = isImageAvatar(avatarSources[playerRole]) ? '☺' : avatarEmoji(avatarSources[playerRole]);
    }
  }

  function updateStageHud() {
    if (!stageNode || !data.meta || data.meta.phase !== 'playing') return;
    stageNode.textContent = 'FLAPPY FACE';
    const count = root.querySelector('[data-ar-stage-count]');
    if (count) count.textContent = 'DUEL · 60 DETIK';
  }

  function drawBackground(context) {
    const width = 960; const height = 540;
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#17182f'); gradient.addColorStop(0.68, '#191a35'); gradient.addColorStop(1, '#232342');
    context.fillStyle = gradient; context.fillRect(0, 0, width, height);
    context.save();
    for (let index = 0; index < 58; index += 1) {
      const x = (index * 173 + 37) % width; const y = (index * 97 + 19) % 365;
      context.fillStyle = index % 4 === 0 ? 'rgba(255,229,166,.85)' : 'rgba(218,230,255,.58)';
      context.fillRect(x, y, index % 5 === 0 ? 3 : 2, index % 5 === 0 ? 3 : 2);
    }
    context.strokeStyle = 'rgba(140,180,255,.15)'; context.lineWidth = 1;
    for (let i = 0; i <= 10; i += 1) {
      const y = 360 + i * i * 1.55;
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
    for (let i = -12; i <= 12; i += 1) {
      context.beginPath(); context.moveTo(width / 2 + i * 23, 350); context.lineTo(width / 2 + i * 78, height); context.stroke();
    }
    context.restore();
    context.fillStyle = 'rgba(9,10,24,.68)'; context.fillRect(0, 500, width, 40);
    context.fillStyle = 'rgba(95,222,238,.55)'; context.fillRect(0, 497, width / 2, 3);
    context.fillStyle = 'rgba(244,126,188,.55)'; context.fillRect(width / 2, 497, width / 2, 3);
    context.setLineDash([7, 9]); context.strokeStyle = 'rgba(255,255,255,.12)'; context.beginPath(); context.moveTo(width / 2, 0); context.lineTo(width / 2, height); context.stroke(); context.setLineDash([]);
    for (const [x, tint] of [[12, '#9b85ef'], [936, '#f3c28e']]) {
      context.save(); context.shadowColor = tint; context.shadowBlur = 18; context.strokeStyle = tint; context.lineWidth = 5;
      context.strokeRect(x, 195, 12, 220); context.strokeRect(x + (x < 100 ? 16 : -16), 218, 8, 175); context.restore();
    }
  }

  function drawEntity(context, entity, position, stage) {
    if (!position || entity.kind !== 'gate') return;
    const x = position.x * 960;
    const gapTop = (position.gapY - position.gapSize / 2) * 540;
    const gapBottom = (position.gapY + position.gapSize / 2) * 540;
    const pipeWidth = 48;
    const floorY = 500;
    const drawPipe = (top, bottom, isTop) => {
      const height = Math.max(0, bottom - top);
      if (height <= 0) return;
      const gradient = context.createLinearGradient(x - pipeWidth / 2, 0, x + pipeWidth / 2, 0);
      gradient.addColorStop(0, '#2d9d83');
      gradient.addColorStop(0.42, '#8bf4cf');
      gradient.addColorStop(1, '#267d71');
      context.save();
      context.shadowColor = '#64f4ca'; context.shadowBlur = 16;
      context.fillStyle = gradient;
      context.fillRect(x - pipeWidth / 2, top, pipeWidth, height);
      context.strokeStyle = 'rgba(225,255,245,.85)'; context.lineWidth = 2;
      context.strokeRect(x - pipeWidth / 2, top, pipeWidth, height);
      const lipHeight = 13;
      const lipY = isTop ? bottom - lipHeight : top;
      context.fillStyle = '#a4ffdf';
      context.fillRect(x - pipeWidth / 2 - 6, lipY, pipeWidth + 12, lipHeight);
      context.strokeStyle = '#d9fff2'; context.strokeRect(x - pipeWidth / 2 - 6, lipY, pipeWidth + 12, lipHeight);
      context.restore();
    };
    context.save();
    drawPipe(0, gapTop, true);
    drawPipe(gapBottom, floorY, false);
    context.restore();
  }

  function drawPlayer(context, playerRole, playerState, now) {
    if (!playerState) return;
    const x = Number(playerState.x ?? (playerRole === 'host' ? .24 : .76)) * 960;
    const y = Number(playerState.y ?? .5) * 540;
    const image = avatarImages[playerRole];
    const tint = playerRole === 'host' ? '#ff82bd' : '#72d7ff';
    const bob = Math.sin(now / 120 + (playerRole === 'host' ? 0 : 1)) * 2;
    context.save();
    context.strokeStyle = tint; context.lineWidth = 5; context.lineCap = 'round'; context.shadowColor = tint; context.shadowBlur = 9;
    const legSwing = Math.sin(now / 80 + (playerRole === 'guest' ? 2 : 0)) * 8;
    context.beginPath(); context.moveTo(x - 8, y + 15 + bob); context.lineTo(x - 10 + legSwing, y + 37 + bob); context.moveTo(x + 8, y + 15 + bob); context.lineTo(x + 10 - legSwing, y + 37 + bob); context.stroke();
    context.fillStyle = tint; context.globalAlpha = .22; context.beginPath(); context.ellipse(x, y + 42, 23, 5, 0, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1;
    context.shadowBlur = 17; context.fillStyle = tint; context.beginPath(); context.arc(x, y + bob, 22, 0, Math.PI * 2); context.fill();
    context.save(); context.beginPath(); context.arc(x, y + bob, 18, 0, Math.PI * 2); context.clip();
    if (image?.complete && image.naturalWidth) context.drawImage(image, x - 18, y - 18 + bob, 36, 36);
    else { context.fillStyle = '#22253e'; context.font = '24px system-ui'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(avatarEmoji(playerState.avatar), x, y + bob + 1); }
    context.restore();
    context.fillStyle = '#fff'; context.font = '700 12px system-ui'; context.textAlign = 'center'; context.shadowBlur = 4; context.fillText(names[playerRole], x, y - 31 + bob);
    context.restore();
  }

  function drawArena(now) {
    if (!ctx || !canvas || destroyed || data.meta?.phase !== 'playing') return;
    const width = canvas.width; const height = canvas.height;
    ctx.setTransform(width / 960, 0, 0, height / 540, 0, 0);
    drawBackground(ctx);
    const stage = ARCADE_STAGES[0];
    const elapsed = Math.max(0, nowServer() - Number(data.meta.startedAt || nowServer()));
    for (const playerRole of ['host', 'guest']) {
      for (const entity of entitiesByRole[playerRole]) {
        drawEntity(ctx, entity, getArcadeEntityPosition(entity, elapsed), stage);
      }
    }
    drawPlayer(ctx, 'host', role === 'host' && localSim ? localSim : data.players?.host, now);
    drawPlayer(ctx, 'guest', role === 'guest' && localSim ? localSim : data.players?.guest, now);
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round((rect.width || 960) * ratio));
    canvas.height = Math.max(1, Math.round((rect.width || 960) * 0.5625 * ratio));
  }

  function updateHud(now) {
    if (data.meta?.phase !== 'playing') return;
    const startedAt = Number(data.meta.startedAt || now);
    const remaining = getArcadeRemaining(startedAt, ARCADE_STAGE_DURATION_MS, now);
    if (timerNode) timerNode.textContent = (remaining / 1000).toFixed(1);
    const progress = root.querySelector('[data-ar-stage-progress]');
    if (progress) progress.style.width = `${Math.max(0, Math.min(100, (1 - remaining / ARCADE_STAGE_DURATION_MS) * 100))}%`;
    for (const playerRole of ['host', 'guest']) {
      const playerState = playerRole === role && localSim ? localSim : data.players?.[playerRole];
      const node = scoreNodes[playerRole];
      if (node) node.textContent = String(Number(playerState?.gatesPassed ?? playerState?.score ?? 0));
      const lives = livesNodes[playerRole];
      const lifeCount = Math.max(0, Math.min(3, Number(playerState?.lives ?? 3)));
      if (lives) { lives.textContent = '♥'.repeat(lifeCount) + '♡'.repeat(3 - lifeCount); lives.setAttribute('aria-label', `${lifeCount} nyawa tersisa`); }
    }
  }

  async function writeOwn(fields) {
    if (destroyed) return;
    await update(playerRef, { ...fields, updatedAt: nowServer() });
  }

  async function seedMeta() {
    if (role !== 'host' || initializing || destroyed) return;
    initializing = true;
    try {
      await runTransaction(metaRef, current => current || ({ phase: 'setup', seed: randomSeed(), stageIndex: 0, stageStartedAt: 0, createdAt: nowServer(), endedAt: 0 }));
    } finally { initializing = false; }
  }

  async function ensureOwnPlayer() {
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const current = snapshot.val() || {};
      if (current.name !== names[role]) await writeOwn({ name: names[role] });
      return;
    }
    const initial = {
      name: names[role], avatar: `character:${role === 'host' ? 'cat' : 'rabbit'}`, ready: false,
      x: role === 'host' ? 0.24 : 0.76, y: 0.5, score: 0, stageScore: 0, lives: 3, gatesPassed: 0,
      scores: {}, updatedAt: nowServer()
    };
    await set(playerRef, initial);
  }

  async function saveAvatar(value) {
    if (avatarBusy || ownPlayer().ready || data.meta?.phase !== 'setup') return;
    avatarBusy = true;
    try { await writeOwn({ avatar: safeAvatar(value), ready: false }); notify('Karakter berhasil diperbarui.', 'success'); }
    catch (error) { notify(`Karakter belum tersimpan: ${error.message}`, 'error'); }
    finally { avatarBusy = false; updateSetupUI(); }
  }

  async function saveAvatarFile(file) {
    if (avatarBusy || ownPlayer().ready || data.meta?.phase !== 'setup') return;
    avatarBusy = true; updateSetupUI();
    try {
      const value = await compressAvatar(file);
      await writeOwn({ avatar: value, ready: false });
      notify('Foto karakter berhasil disimpan untuk sesi ini.', 'success');
    } catch (error) { notify(error.message, 'error'); }
    finally { avatarBusy = false; updateSetupUI(); updateAvatarCache(); }
  }

  async function setReady() {
    if (readyBusy || ownPlayer().ready || data.meta?.phase !== 'setup') return;
    if (!bothOnline()) { notify('Kedua perangkat harus online sebelum menyatakan siap.', 'error'); return; }
    readyBusy = true; updateSetupUI();
    try { await writeOwn({ ready: true }); notify('Kamu siap. Menunggu pasangan…', 'success'); }
    catch (error) { notify(`Status siap belum tersimpan: ${error.message}`, 'error'); }
    finally { readyBusy = false; updateSetupUI(); }
  }

  async function startArcade() {
    if (role !== 'host' || starting || data.meta?.phase !== 'setup' || !bothOnline() || data.players?.host?.ready !== true || data.players?.guest?.ready !== true) {
      if (role === 'host' && data.meta?.phase === 'setup' && !bothOnline()) notify('Kedua perangkat harus tetap online untuk memulai.', 'error');
      return;
    }
    starting = true; updateSetupUI();
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'setup' || data.players?.host?.ready !== true || data.players?.guest?.ready !== true) return;
        const startAt = nowServer() + 2500;
        return { ...current, phase: 'playing', stageIndex: 0, stageStartedAt: startAt, startedAt: startAt, endedAt: 0 };
      }, { applyLocally: false });
    } catch (error) { notify(`Arcade belum bisa dimulai: ${error.message}`, 'error'); }
    finally { starting = false; updateSetupUI(); }
  }

  function resetStage(index = 0) {
    localStageIndex = index;
    const stored = ownPlayer();
    localSim = createArcadePlayer(role, {
      score: 0,
      stageScore: 0,
      lives: 3,
      gatesPassed: 0,
      x: role === 'host' ? 0.24 : 0.76,
      y: 0.5,
      avatar: safeAvatar(stored.avatar),
      consumed: [],
      passed: [],
      invulnerableUntil: 0
    });
    entitiesByRole = {
      host: createArcadeEntities(Number(data.meta?.seed || 1), 0, 'host'),
      guest: createArcadeEntities(Number(data.meta?.seed || 1), 0, 'guest')
    };
    void writeOwn({ x: localSim.x, y: localSim.y, score: 0, stageScore: 0, lives: 3, gatesPassed: 0 });
    updateStageHud();
  }

  async function finishArcadeIfNeeded(now) {
    if (role !== 'host' || transitionBusy || data.meta?.phase !== 'playing') return;
    const startedAt = Number(data.meta.startedAt || 0);
    const timedOut = startedAt > 0 && now >= startedAt + ARCADE_STAGE_DURATION_MS;
    const bothOut = Number(data.players?.host?.lives ?? 3) <= 0 && Number(data.players?.guest?.lives ?? 3) <= 0;
    if (!timedOut && !bothOut) return;
    transitionBusy = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing') return;
        const expired = nowServer() >= Number(current.startedAt || 0) + ARCADE_STAGE_DURATION_MS;
        const noLives = Number(data.players?.host?.lives ?? 3) <= 0 && Number(data.players?.guest?.lives ?? 3) <= 0;
        if (!expired && !noLives) return;
        return { ...current, phase: 'result', endedAt: nowServer() };
      }, { applyLocally: false });
    } catch (error) {
      const t = Date.now();
      if (t - lastNotifyAt > 5000) { lastNotifyAt = t; notify(`Hasil Flappy Face belum bisa disimpan: ${error.message}`, 'error'); }
    } finally { transitionBusy = false; }
  }

  function handleStageChange() {
    if (localStageIndex !== 0) resetStage(0);
  }

  function tick(timestamp) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min(0.05, Math.max(0, (timestamp - lastFrame) / 1000)) : 1 / 60;
    lastFrame = timestamp;
    const now = nowServer();
    if (data.meta?.phase === 'playing') {
      handleStageChange();
      const startedAt = Number(data.meta.startedAt || now);
      const elapsed = now - startedAt;
      if (elapsed >= 0 && elapsed < ARCADE_STAGE_DURATION_MS && localSim && localSim.lives > 0) {
        const result = stepArcadePlayer({ player: localSim, role, stage: ARCADE_STAGES[0], input, dt, elapsedMs: elapsed, entities: entitiesByRole[role], now });
        localSim = result.player;
        if (result.events.some(event => event.kind === 'hit')) notify('Ups! Kena pipa atau batas arena. Satu nyawa berkurang.', 'error', { duration: 1100 });
        if (result.events.some(event => event.kind === 'passed')) notify('Pipa terlewati! +10', 'success', { duration: 650 });
        if (result.events.length || timestamp - lastWriteAt > 120) {
          lastWriteAt = timestamp;
          void writeOwn({ x: localSim.x, y: localSim.y, score: localSim.score, stageScore: localSim.stageScore, lives: localSim.lives, gatesPassed: localSim.gatesPassed }).catch(error => {
            if (Date.now() - lastNotifyAt > 5000) { lastNotifyAt = Date.now(); notify(`Sinkronisasi terputus: ${error.message}`, 'error'); }
          });
        }
      }
      void finishArcadeIfNeeded(now);
      updateHud(now);
      drawArena(timestamp);
      input.jumpPressed = false;
    }
    rafId = requestAnimationFrame(tick);
  }

  function renderResultOnce() {
    if (data.meta?.phase === 'result') renderResult();
  }

  function renderFromData() {
    if (destroyed) return;
    updateAvatarCache();
    const phase = data.meta?.phase || 'setup';
    if (phase !== lastPhase) {
      lastPhase = phase;
      if (phase === 'setup') renderSetup();
      else if (phase === 'playing') {
        renderPlaying();
        localStageIndex = -1;
        handleStageChange();
      } else if (phase === 'result') renderResultOnce();
    } else if (phase === 'setup') updateSetupUI();
    else if (phase === 'playing') {
      updateStageHud();
      if (localStageIndex !== 0 && Number(data.meta.startedAt || 0) > 0) handleStageChange();
      updateAvatarCache();
    }
  }

  function setControl(key, active) {
    if (key !== 'jump') return;
    if (active && !input.jump) input.jumpPressed = true;
    input.jump = active;
  }

  function clickHandler(event) {
    const avatarChoice = event.target.closest('[data-ar-avatar-choice]');
    if (avatarChoice) { void saveAvatar(`character:${avatarChoice.dataset.arAvatarChoice}`); return; }
    const action = event.target.closest('[data-ar-action]')?.dataset.arAction;
    if (!action) return;
    event.preventDefault();
    if (action === 'back') { onBack?.(); return; }
    if (action === 'camera') { if (!ownPlayer().ready) avatarCamera?.open(); return; }
    if (action === 'gallery') { if (!ownPlayer().ready) root.querySelector('[data-ar-gallery]')?.click(); return; }
    if (action === 'ready') { void setReady(); return; }
    if (action === 'insert-coin') { void startArcade(); return; }
    if (action === 'back-to-lobby') { if (role === 'host') onBack?.(); return; }
  }

  function pointerDown(event) {
    const button = event.target.closest('[data-ar-input="jump"]');
    if (!button) return;
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    setControl('jump', true);
    button.classList.add('is-pressed');
  }
  function pointerUp(event) {
    const button = event.target.closest('[data-ar-input="jump"]');
    if (!button) return;
    setControl('jump', false);
    button.classList.remove('is-pressed');
  }
  function keyDown(event) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.repeat) return;
    if (!['ArrowUp', 'KeyW', 'Space'].includes(event.code)) return;
    event.preventDefault();
    setControl('jump', true);
  }
  function keyUp(event) {
    if (!['ArrowUp', 'KeyW', 'Space'].includes(event.code)) return;
    setControl('jump', false);
  }

  async function initialize() {
    if (role === 'host') await seedMeta();
    await ensureOwnPlayer();
    unsubscribeOffset = onValue(ref(db, '.info/serverTimeOffset'), snapshot => { serverOffset = Number(snapshot.val() || 0); });
    unsubscribePresence = onValue(presenceRef, snapshot => {
      presence = snapshot.val() || {};
      if (data.meta?.phase === 'setup') updateSetupUI();
    }, error => notify(`Status koneksi pemain tidak dapat dibaca: ${error.message}`, 'error'));
    unsubscribeGame = onValue(baseRef, snapshot => {
      data = snapshot.val() || {};
      if (!data.meta && role === 'host') void seedMeta().catch(error => notify(`Sesi Arcade belum siap: ${error.message}`, 'error'));
      renderFromData();
    }, error => notify(`Koneksi Arcade terputus: ${error.message}`, 'error'));
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  buildShell();
  root.addEventListener('click', clickHandler);
  root.addEventListener('pointerdown', pointerDown);
  root.addEventListener('pointerup', pointerUp);
  root.addEventListener('pointercancel', pointerUp);
  root.addEventListener('change', async event => {
    if (event.target.matches('[data-ar-gallery]')) {
      const file = event.target.files?.[0];
      if (file) await saveAvatarFile(file);
      event.target.value = '';
    }
  });
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);
  window.addEventListener('resize', resizeCanvas);
  void initialize().catch(error => notify(`Arcade gagal disiapkan: ${error.message}`, 'error'));

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      unsubscribeGame?.(); unsubscribePresence?.(); unsubscribeOffset?.();
      avatarCamera?.destroy(); feedback?.destroy();
      if (canvas && canvasTapHandler) canvas.removeEventListener('pointerdown', canvasTapHandler);
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('pointerdown', pointerDown);
      root.removeEventListener('pointerup', pointerUp);
      root.removeEventListener('pointercancel', pointerUp);
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
      window.removeEventListener('resize', resizeCanvas);
      input = { jump: false, jumpPressed: false };
    }
  };
}
