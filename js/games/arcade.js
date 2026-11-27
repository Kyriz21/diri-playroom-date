import { db, ref, get, set, update, onValue, runTransaction } from '../firebase.js';
import { createAvatarCamera } from '../services/avatar-camera.js';
import { createArcadeFeedback } from '../services/arcade-feedback.js';
import {
  ARCADE_STAGES, ARCADE_AVATARS, ARCADE_STAGE_DURATION_MS, ARCADE_INTERMISSION_MS,
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
  const playersRef = ref(db, `${basePath}/players`);
  const playerRef = ref(db, `${basePath}/players/${role}`);
  let feedback = null;
  let avatarCamera = null;
  let unsubscribeGame = null;
  let unsubscribeOffset = null;
  let serverOffset = 0;
  let data = {};
  let destroyed = false;
  let initializing = false;
  let avatarBusy = false;
  let readyBusy = false;
  let starting = false;
  let transitionBusy = false;
  let lastAdvancedIndex = -1;
  let lastCommittedStage = -1;
  let lastPhase = '';
  let lastRenderedStage = -1;
  let rafId = 0;
  let lastFrame = 0;
  let lastWriteAt = 0;
  let lastNotifyAt = 0;
  let input = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, actionPressed: false };
  let localSim = null;
  let localStageIndex = -1;
  let entitiesByRole = { host: [], guest: [] };
  let avatarImages = { host: null, guest: null };
  let avatarSources = { host: '', guest: '' };
  let canvas = null;
  let ctx = null;
  let stageNode = null;
  let timerNode = null;
  let scoreNodes = {};
  let livesNodes = {};
  let bannerNode = null;
  let summaryNode = null;
  let destroyedReason = '';

  const nowServer = () => Date.now() + serverOffset;
  const notify = (message, type = 'default', options) => feedback ? feedback.show(message, type, options) : globalToast(message, type);
  const ownPlayer = () => data.players?.[role] || {};
  const partnerPlayer = () => data.players?.[opponentRole] || {};

  function buildShell() {
    root.innerHTML = `
      <section class="arcade-shell">
        <header class="arcade-header">
          <div><span class="arcade-kicker">DIRI. · TWO PLAYERS, ONE CLOCK</span><h1>Arcade <span>✦</span></h1><p>Dua karakter, satu arena, dua belas tantangan singkat.</p></div>
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
    const bothReady = data.players?.host?.ready === true && data.players?.guest?.ready === true;
    const screen = root.querySelector('[data-ar-screen]');
    screen.innerHTML = `
      <section class="arcade-setup-card">
        <div class="arcade-setup-intro"><span class="arcade-eyebrow">INSERT COIN · 12 MINI GAMES</span><h2>Siapkan wajah jagoanmu</h2><p>Pakai foto kamera, pilih dari galeri, atau gunakan karakter lucu. Foto dikompres dan hanya dibagikan di sesi ini.</p></div>
        <div class="arcade-avatar-pair">
          <article class="arcade-avatar-card is-pink"><div data-ar-avatar="mine">${avatarMarkup(mineAvatar, names[role], true)}</div><strong>${esc(names[role])}</strong><small>Karakter kamu</small><span class="arcade-player-status ${mine.ready ? 'is-ready' : ''}" data-ar-ready="${role}">${mine.ready ? 'Siap bermain ✓' : 'Belum siap'}</span></article>
          <div class="arcade-versus">VS</div>
          <article class="arcade-avatar-card is-blue"><div data-ar-avatar="partner">${avatarMarkup(partnerAvatar, names[opponentRole])}</div><strong>${esc(names[opponentRole])}</strong><small>Karakter pasangan</small><span class="arcade-player-status ${partner.ready ? 'is-ready' : ''}" data-ar-ready="${opponentRole}">${partner.ready ? 'Siap bermain ✓' : 'Menyiapkan karakter…'}</span></article>
        </div>
        <div class="arcade-avatar-picker"><div class="arcade-picker-heading"><strong>Pilih karakter</strong><span>Atau ganti dengan foto wajahmu</span></div><div class="arcade-avatar-options">${ARCADE_AVATARS.map(item => `<button type="button" class="arcade-avatar-option ${mineAvatar === `character:${item.id}` ? 'is-selected' : ''}" data-ar-avatar-choice="${item.id}" aria-label="Pilih ${item.name}" title="${item.name}">${item.emoji}</button>`).join('')}</div><div class="arcade-photo-actions"><button class="button button-secondary button-small" data-ar-action="camera">📷 Ambil foto</button><button class="button button-secondary button-small" data-ar-action="gallery">🖼 Pilih dari galeri</button><input type="file" accept="image/*" data-ar-gallery hidden></div></div>
        <div class="arcade-howto-grid"><div><b>← →</b><span>Gerakkan karakter</span></div><div><b>SPACE / ↑</b><span>Lompat atau terbang</span></div><div><b>ENTER / TAP</b><span>Aksi, pop, dan ritme</span></div></div>
        <div class="arcade-coin-row"><div><span class="arcade-coin-icon">🕹️</span><div><strong>${bothReady ? 'Dua pemain siap!' : 'Menunggu dua koin…'}</strong><small>${bothReady ? 'Pembuat sesi dapat memasukkan koin untuk memulai.' : 'Kalian berdua harus memilih karakter dan menyatakan siap.'}</small></div></div><div class="arcade-coin-actions"><button class="button button-secondary" data-ar-action="ready" ${mine.ready || avatarBusy || readyBusy ? 'disabled' : ''}>${mine.ready ? 'Kamu siap ✓' : readyBusy ? 'Menyimpan…' : 'Saya siap'}</button>${role === 'host' ? `<button class="button button-primary arcade-insert-button" data-ar-action="insert-coin" ${bothReady && !starting ? '' : 'disabled'}>${starting ? 'Menyiapkan…' : 'Insert coin →'}</button>` : `<span class="arcade-waiting-note">${bothReady ? 'Menunggu host memasukkan koin…' : 'Tunggu pasangan siap.'}</span>`}</div></div>
        <p class="arcade-privacy-note">Kamera hanya aktif setelah kamu menekan Ambil foto. Kamu juga bisa bermain tanpa foto.</p>
      </section>`;
  }

  function renderPlaying() {
    const screen = root.querySelector('[data-ar-screen]');
    screen.innerHTML = `
      <section class="arcade-game-card">
        <div class="arcade-game-hud">
          <div class="arcade-hud-player is-pink"><span class="arcade-hud-avatar" data-ar-mini-avatar="host">${avatarEmoji(data.players?.host?.avatar)}</span><div><strong>${esc(names.host)}</strong><small><b data-ar-score="host">0</b> PTS · <span data-ar-lives="host">♥♥♥</span></small></div></div>
          <div class="arcade-stage-hud"><span data-ar-stage-count>GAME 01 / 12</span><strong data-ar-stage-name>FLAPPY FACE</strong><div class="arcade-stage-progress"><i data-ar-stage-progress></i></div><b data-ar-timer>12.0</b></div>
          <div class="arcade-hud-player is-blue"><div><strong>${esc(names.guest)}</strong><small><b data-ar-score="guest">0</b> PTS · <span data-ar-lives="guest">♥♥♥</span></small></div><span class="arcade-hud-avatar" data-ar-mini-avatar="guest">${avatarEmoji(data.players?.guest?.avatar)}</span></div>
        </div>
        <div class="arcade-arena-wrap"><canvas class="arcade-arena" data-ar-canvas width="960" height="540" aria-label="Arena arcade dua pemain"></canvas><div class="arcade-arena-banner" data-ar-banner hidden></div></div>
        <div class="arcade-round-strip" data-ar-round-strip>${ARCADE_STAGES.map((stage, index) => `<span class="${index === 0 ? 'is-current' : ''}" data-ar-round-dot="${index}" title="${esc(stage.name)}">${String(index + 1).padStart(2, '0')}</span>`).join('')}</div>
        <div class="arcade-controls"><div class="arcade-control-label"><strong>Kontrol ${esc(names[role])}</strong><span>Keyboard atau sentuh</span></div><div class="arcade-control-pad"><button data-ar-input="left" aria-label="Kiri">←<small>KIRI</small></button><button data-ar-input="right" aria-label="Kanan">→<small>KANAN</small></button><button class="is-jump" data-ar-input="up" aria-label="Lompat atau naik">↟<small>NAIK</small></button><button data-ar-input="down" aria-label="Turun">↓<small>TURUN</small></button><button class="is-action" data-ar-input="action" aria-label="Aksi">✦<small>AKSI</small></button></div></div>
        <p class="arcade-control-note">Desktop: A/D atau ←/→ bergerak, ↑/W naik atau lompat, ↓/S turun, Spasi lompat, Enter aksi. HP: tahan tombol kontrol.</p>
      </section>`;
    canvas = root.querySelector('[data-ar-canvas]');
    ctx = canvas?.getContext('2d');
    stageNode = root.querySelector('[data-ar-stage-name]');
    timerNode = root.querySelector('[data-ar-timer]');
    bannerNode = root.querySelector('[data-ar-banner]');
    for (const playerRole of ['host', 'guest']) { scoreNodes[playerRole] = root.querySelector(`[data-ar-score="${playerRole}"]`); livesNodes[playerRole] = root.querySelector(`[data-ar-lives="${playerRole}"]`); }
    resizeCanvas();
    updateAvatarCache();
    updateStageHud();
  }

  function renderResult() {
    const screen = root.querySelector('[data-ar-screen]');
    const players = data.players || {};
    const winner = getArcadeWinner(players);
    const scoresFor = playerRole => players[playerRole]?.scores || {};
    const stageRows = ARCADE_STAGES.map((stage, index) => {
      const hostScore = Number(scoresFor('host')[index] ?? (index === 11 ? players.host?.stageScore : 0) ?? 0);
      const guestScore = Number(scoresFor('guest')[index] ?? (index === 11 ? players.guest?.stageScore : 0) ?? 0);
      const high = Math.max(1, hostScore, guestScore);
      return `<div class="arcade-result-stage"><span>${String(index + 1).padStart(2, '0')}</span><b>${stage.icon} ${esc(stage.name)}</b><i><em style="width:${Math.round(hostScore / high * 100)}%"></em></i><strong>${hostScore} : ${guestScore}</strong></div>`;
    }).join('');
    screen.innerHTML = `
      <section class="arcade-result-card"><div class="arcade-result-top"><span class="arcade-eyebrow">12 GAMES · ONE SHARED ARENA</span><div class="arcade-result-trophy">${winner.winner === 'draw' ? '🤝' : '🏆'}</div><h2>${winner.winner === 'draw' ? 'Skor imbang!' : `${esc(names[winner.winner])} menang!`}</h2><p>${winner.hostScore.toLocaleString('id-ID')} poin untuk ${esc(names.host)} · ${winner.guestScore.toLocaleString('id-ID')} poin untuk ${esc(names.guest)}</p></div>
        <div class="arcade-result-score-pair"><article class="is-pink"><span>PEMAIN 1 · ${esc(names.host)}</span><strong>${winner.hostScore.toLocaleString('id-ID')}</strong><small>POIN</small></article><article class="is-blue"><span>PEMAIN 2 · ${esc(names.guest)}</span><strong>${winner.guestScore.toLocaleString('id-ID')}</strong><small>POIN</small></article></div>
        <div class="arcade-result-list"><div class="arcade-result-list-head"><strong>Rekap setiap mini-game</strong><span>Skor masing-masing pemain</span></div>${stageRows}</div>
        <div class="arcade-result-actions"><button class="button button-primary" data-ar-action="back-to-lobby" ${role === 'host' ? '' : 'disabled'}>Kembali ke lobi</button><span>${role === 'host' ? 'Kamu bisa memilih Arcade lagi atau permainan lain.' : 'Menunggu pembuat sesi kembali ke lobi…'}</span></div>
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
    if (readyButton) { readyButton.disabled = Boolean(mine.ready || avatarBusy || readyBusy); readyButton.textContent = mine.ready ? 'Kamu siap ✓' : readyBusy ? 'Menyimpan…' : 'Saya siap'; }
    const bothReady = data.players?.host?.ready === true && data.players?.guest?.ready === true;
    const insertButton = root.querySelector('[data-ar-action="insert-coin"]');
    if (insertButton) insertButton.disabled = !bothReady || starting;
    const coinText = root.querySelector('.arcade-coin-row strong');
    const coinNote = root.querySelector('.arcade-coin-row small');
    if (coinText) coinText.textContent = bothReady ? 'Dua pemain siap!' : 'Menunggu dua koin…';
    if (coinNote) coinNote.textContent = bothReady ? 'Pembuat sesi dapat memasukkan koin untuk memulai.' : 'Kalian berdua harus memilih karakter dan menyatakan siap.';
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
    const index = Math.max(0, Math.min(ARCADE_STAGES.length - 1, Number(data.meta.stageIndex || 0)));
    const stage = ARCADE_STAGES[index];
    stageNode.textContent = `${stage.icon} ${stage.name.toUpperCase()}`;
    const count = root.querySelector('[data-ar-stage-count]');
    if (count) count.textContent = `GAME ${String(index + 1).padStart(2, '0')} / 12`;
    root.querySelectorAll('[data-ar-round-dot]').forEach(node => {
      const dot = Number(node.dataset.arRoundDot);
      node.classList.toggle('is-done', dot < index);
      node.classList.toggle('is-current', dot === index);
    });
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
    context.fillStyle = 'rgba(9,10,24,.54)'; context.fillRect(0, 438, width, 102);
    context.fillStyle = 'rgba(95,222,238,.38)'; context.fillRect(0, 436, width / 2, 2);
    context.fillStyle = 'rgba(244,126,188,.38)'; context.fillRect(width / 2, 436, width / 2, 2);
    context.setLineDash([7, 9]); context.strokeStyle = 'rgba(255,255,255,.12)'; context.beginPath(); context.moveTo(width / 2, 0); context.lineTo(width / 2, height); context.stroke(); context.setLineDash([]);
    for (const [x, tint] of [[12, '#9b85ef'], [936, '#f3c28e']]) {
      context.save(); context.shadowColor = tint; context.shadowBlur = 18; context.strokeStyle = tint; context.lineWidth = 5;
      context.strokeRect(x, 195, 12, 220); context.strokeRect(x + (x < 100 ? 16 : -16), 218, 8, 175); context.restore();
    }
  }

  function drawEntity(context, entity, position, stage) {
    if (!position) return;
    const x = position.x * 960; const y = position.y * 540;
    context.save();
    if (['gate', 'block', 'crate', 'laser'].includes(entity.kind)) {
      context.shadowColor = entity.kind === 'laser' ? '#ff62bf' : '#77f0cb'; context.shadowBlur = 17;
      context.fillStyle = entity.kind === 'laser' ? '#ff69bc' : entity.kind === 'crate' ? '#e7a66e' : '#61d9b9';
      const w = entity.kind === 'gate' ? 35 : entity.kind === 'laser' ? 72 : 38;
      const h = entity.kind === 'gate' ? 78 : entity.kind === 'laser' ? 12 : 32;
      context.beginPath(); context.roundRect(x - w / 2, y - h / 2, w, h, 8); context.fill();
      context.strokeStyle = 'rgba(255,255,255,.72)'; context.lineWidth = 2; context.stroke();
    } else {
      const glyphs = { heart: '♥', coin: '●', star: '✦', bubble: '○', bomb: '✹', meteor: '☄', cloud: '☁' };
      const colors = { heart: '#ff8ac2', coin: '#ffd66e', star: '#fff0a8', bubble: '#86e8fb', bomb: '#ff7c7c', meteor: '#ff9c79', cloud: '#b9c9f7' };
      context.shadowColor = colors[entity.kind] || '#fff'; context.shadowBlur = 17;
      context.fillStyle = colors[entity.kind] || '#fff'; context.font = `${entity.kind === 'bubble' ? 42 : 32}px system-ui`; context.textAlign = 'center'; context.textBaseline = 'middle';
      context.fillText(glyphs[entity.kind] || '✦', x, y);
    }
    context.restore();
  }

  function drawPlayer(context, playerRole, playerState, now) {
    if (!playerState) return;
    const x = Number(playerState.x ?? (playerRole === 'host' ? .24 : .76)) * 960;
    const y = Number(playerState.y ?? .82) * 540;
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
    const stageIndex = Math.max(0, Math.min(11, Number(data.meta.stageIndex || 0)));
    const stage = ARCADE_STAGES[stageIndex];
    const elapsed = Math.max(0, nowServer() - Number(data.meta.stageStartedAt || nowServer()));
    for (const playerRole of ['host', 'guest']) {
      const playerEntities = entitiesByRole[playerRole];
      for (const entity of playerEntities) drawEntity(ctx, entity, getArcadeEntityPosition(entity, elapsed, stage), stage);
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
    const index = Number(data.meta.stageIndex || 0);
    const stageStartedAt = Number(data.meta.stageStartedAt || now);
    const remaining = getArcadeRemaining(stageStartedAt, ARCADE_STAGE_DURATION_MS, now);
    if (timerNode) timerNode.textContent = (remaining / 1000).toFixed(1);
    const progress = root.querySelector('[data-ar-stage-progress]');
    if (progress) progress.style.width = `${Math.max(0, Math.min(100, (1 - remaining / ARCADE_STAGE_DURATION_MS) * 100))}%`;
    for (const playerRole of ['host', 'guest']) {
      const node = scoreNodes[playerRole];
      if (node) node.textContent = String(playerRole === role && localSim ? localSim.score : Number(data.players?.[playerRole]?.score || 0));
      const lives = livesNodes[playerRole];
      const lifeCount = Math.max(0, Math.min(3, Number(playerRole === role && localSim ? localSim.lives : data.players?.[playerRole]?.lives ?? 3)));
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
      x: role === 'host' ? 0.24 : 0.76, y: 0.82, score: 0, stageScore: 0, lives: 3,
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
    readyBusy = true; updateSetupUI();
    try { await writeOwn({ ready: true }); notify('Kamu siap. Menunggu pasangan…', 'success'); }
    catch (error) { notify(`Status siap belum tersimpan: ${error.message}`, 'error'); }
    finally { readyBusy = false; updateSetupUI(); }
  }

  async function startArcade() {
    if (role !== 'host' || starting || data.meta?.phase !== 'setup' || data.players?.host?.ready !== true || data.players?.guest?.ready !== true) return;
    starting = true; updateSetupUI();
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'setup' || data.players?.host?.ready !== true || data.players?.guest?.ready !== true) return;
        return { ...current, phase: 'playing', stageIndex: 0, stageStartedAt: nowServer() + 2500, startedAt: nowServer() };
      }, { applyLocally: false });
    } catch (error) { notify(`Arcade belum bisa dimulai: ${error.message}`, 'error'); }
    finally { starting = false; updateSetupUI(); }
  }

  function resetStage(index) {
    localStageIndex = index;
    const stored = ownPlayer();
    localSim = createArcadePlayer(role, {
      score: Number(stored.score || 0), stageScore: 0, lives: Number(stored.lives ?? 3),
      x: role === 'host' ? 0.24 : 0.76, y: 0.82,
      avatar: safeAvatar(stored.avatar), consumed: [], invulnerableUntil: 0, lastBeat: -1
    });
    entitiesByRole = {
      host: createArcadeEntities(Number(data.meta?.seed || 1), index, 'host'),
      guest: createArcadeEntities(Number(data.meta?.seed || 1), index, 'guest')
    };
    lastCommittedStage = index - 1;
    updateStageHud();
  }

  async function commitStage(index) {
    if (index < 0 || index >= ARCADE_STAGES.length || lastCommittedStage >= index) return;
    lastCommittedStage = index;
    if (!localSim) return;
    const score = Number(localSim.stageScore || 0);
    try { await update(playerRef, { [`scores/${index}`]: score, score: Number(localSim.score || 0), stageScore: score, updatedAt: nowServer() }); }
    catch (error) { notify(`Skor game ${index + 1} belum tersimpan: ${error.message}`, 'error'); }
  }

  async function advanceStageIfNeeded(now) {
    if (role !== 'host' || transitionBusy || data.meta?.phase !== 'playing') return;
    const index = Number(data.meta.stageIndex || 0);
    const startedAt = Number(data.meta.stageStartedAt || 0);
    if (!startedAt || now < startedAt + ARCADE_STAGE_DURATION_MS) return;
    transitionBusy = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing' || Number(current.stageIndex) !== index || nowServer() < Number(current.stageStartedAt) + ARCADE_STAGE_DURATION_MS + 650) return;
        if (index >= ARCADE_STAGES.length - 1) return { ...current, phase: 'result', endedAt: nowServer() };
        return { ...current, stageIndex: index + 1, stageStartedAt: nowServer() + ARCADE_INTERMISSION_MS };
      }, { applyLocally: false });
    } catch (error) { const t = Date.now(); if (t - lastNotifyAt > 5000) { lastNotifyAt = t; notify(`Ronde berikutnya belum bisa dimulai: ${error.message}`, 'error'); } }
    finally { transitionBusy = false; }
  }

  function handleStageChange() {
    const index = Number(data.meta?.stageIndex ?? 0);
    if (index !== localStageIndex) {
      if (localStageIndex >= 0) void commitStage(localStageIndex);
      resetStage(index);
    }
  }

  function tick(timestamp) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min(0.05, Math.max(0, (timestamp - lastFrame) / 1000)) : 1 / 60;
    lastFrame = timestamp;
    const now = nowServer();
    if (data.meta?.phase === 'playing') {
      handleStageChange();
      const index = Number(data.meta.stageIndex || 0);
      const startedAt = Number(data.meta.stageStartedAt || now);
      const elapsed = now - startedAt;
      if (elapsed >= 0 && elapsed < ARCADE_STAGE_DURATION_MS && localSim) {
        const stage = ARCADE_STAGES[index];
        const result = stepArcadePlayer({ player: localSim, role, stage, input, dt, elapsedMs: elapsed, entities: entitiesByRole[role], now });
        localSim = result.player;
        if (result.events.some(event => event.kind === 'hit')) notify('Awas! Karaktermu terkena rintangan.', 'error', { duration: 1000 });
        if (result.events.some(event => event.kind === 'collect')) notify('Bonus didapat! ✦', 'success', { duration: 800 });
        if (result.events.some(event => event.kind === 'perfect')) notify('Perfect timing! +15', 'success', { duration: 900 });
        if (result.events.some(event => event.kind === 'good')) notify('Good timing! +7', 'success', { duration: 900 });
        if (result.events.length || timestamp - lastWriteAt > 130) {
          lastWriteAt = timestamp;
          void writeOwn({ x: localSim.x, y: localSim.y, score: localSim.score, stageScore: localSim.stageScore, lives: localSim.lives }).catch(error => {
            if (Date.now() - lastNotifyAt > 5000) { lastNotifyAt = Date.now(); notify(`Sinkronisasi terputus: ${error.message}`, 'error'); }
          });
        }
        if (elapsed >= ARCADE_STAGE_DURATION_MS - 80) void commitStage(index);
      }
      void advanceStageIfNeeded(now);
      updateHud(now);
      drawArena(timestamp);
      input.jumpPressed = false;
      input.actionPressed = false;
    }
    rafId = requestAnimationFrame(tick);
  }

  function renderResultOnce() {
    if (data.meta?.phase !== 'result') return;
    if (localStageIndex >= 0 && lastCommittedStage < ARCADE_STAGES.length - 1) void commitStage(ARCADE_STAGES.length - 1);
    if (lastPhase !== 'result') renderResult();
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
      if (Number(data.meta?.stageIndex ?? 0) !== lastRenderedStage) {
        lastRenderedStage = Number(data.meta.stageIndex ?? 0);
        updateStageHud();
        if (bannerNode) {
          const stage = ARCADE_STAGES[lastRenderedStage];
          bannerNode.textContent = `${stage.name} — ${stage.hint}`;
          bannerNode.hidden = false;
          window.setTimeout(() => { if (bannerNode) bannerNode.hidden = true; }, 2400);
        }
      }
      updateAvatarCache();
    }
  }

  function setControl(key, active) {
    if (key === 'jump' || key === 'up') {
      if (active && !input[key]) input.jumpPressed = true;
      input[key] = active;
    } else if (key === 'action') {
      if (active) input.actionPressed = true;
    } else if (key in input) input[key] = active;
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
    const button = event.target.closest('[data-ar-input]');
    if (!button) return;
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    setControl(button.dataset.arInput, true);
    button.classList.add('is-pressed');
  }
  function pointerUp(event) {
    const button = event.target.closest('[data-ar-input]');
    if (!button) return;
    setControl(button.dataset.arInput, false);
    button.classList.remove('is-pressed');
  }
  function keyDown(event) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', Space: 'jump', Enter: 'action', KeyE: 'action', ArrowDown: 'down', KeyS: 'down' };
    const control = map[event.code];
    if (!control) return;
    event.preventDefault();
    setControl(control, true);
  }
  function keyUp(event) {
    const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', Space: 'jump', Enter: 'action', KeyE: 'action', ArrowDown: 'down', KeyS: 'down' };
    const control = map[event.code]; if (control) setControl(control, false);
  }

  async function initialize() {
    if (role === 'host') await seedMeta();
    await ensureOwnPlayer();
    unsubscribeOffset = onValue(ref(db, '.info/serverTimeOffset'), snapshot => { serverOffset = Number(snapshot.val() || 0); });
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
      unsubscribeGame?.(); unsubscribeOffset?.();
      avatarCamera?.destroy(); feedback?.destroy();
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('pointerdown', pointerDown);
      root.removeEventListener('pointerup', pointerUp);
      root.removeEventListener('pointercancel', pointerUp);
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
      window.removeEventListener('resize', resizeCanvas);
      input = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, actionPressed: false };
    }
  };
}
