import { db, ref, get, set, update, remove, onValue } from '../firebase.js';
import {
  BOMBER_DURATION_MS, BOMBER_BOMB_FUSE_MS, BOMBER_EXPLOSION_MS,
  BOMBER_GRID_WIDTH, BOMBER_GRID_HEIGHT, BOMBER_SPAWNS, BOMBER_SPAWN_PROTECTION_MS,
  BOMBER_POWERUPS, BOMBER_TICK_MS, BOMBER_WARNING_MS, createBomberArena,
  createBomberPlayer, bomberCellKey, parseBomberCellKey,
  canBomberMove, getBomberBlastCells, getBomberWarningPreviews, getActiveBomberExplosionCells, applyBomberPowerup,
  damageBomberPlayer, getBomberWinner, formatBomberTime
} from './bomber-arena-logic.js?v=0.51.3';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const ROLES = ['host', 'guest'];
const ROLE_TONES = { host: 'pink', guest: 'blue' };
const DEFAULT_AVATARS = { host: '🧨', guest: '💣' };
const randomSeed = () => { const value = new Uint32Array(1); crypto.getRandomValues(value); return value[0] || 1; };
const isParticipant = role => role === 'host' || role === 'guest';

export function mountBomberArena(root, context) {
  const { code, session, room, role, onBack, toast = () => {} } = context;
  const opponentRole = role === 'host' ? 'guest' : 'host';
  const names = { host: room.host?.name || 'Pemain 1', guest: room.guest?.name || 'Pemain 2' };
  const basePath = `roomGames/${code}/${session.sessionId}/bomberArena`;
  const baseRef = ref(db, basePath);
  const metaRef = ref(db, `${basePath}/meta`);
  const inputRefs = {
    host: ref(db, `${basePath}/players/host/input`),
    guest: ref(db, `${basePath}/players/guest/input`)
  };
  const presenceRef = ref(db, `rooms/${code}/presence`);

  let data = {};
  let arena = null;
  let simPlayers = { host: null, guest: null };
  let simBombs = {};
  let simDestroyed = {};
  let simPowerups = {};
  let simExplosions = {};
  let inputCache = {
    host: { dx: 0, dy: 0, bombSeq: 0, updatedAt: 0, receivedAt: 0 },
    guest: { dx: 0, dy: 0, bombSeq: 0, updatedAt: 0, receivedAt: 0 }
  };
  let processedBombSeq = { host: 0, guest: 0 };
  let lastMoveAt = { host: 0, guest: 0 };
  let initialized = false;
  let initializing = false;
  let hostTickBusy = false;
  let destroyed = false;
  let lastPhase = '';
  let currentDirection = { dx: 0, dy: 0 };
  let activeDirectionPointerId = null;
  let localBombSeq = 0;
  let rafId = 0;
  let hostTickId = 0;
  let inputKeepaliveId = 0;
  let lastPaint = 0;
  let canvas = null;
  let ctx = null;
  let timerNode = null;
  let hudNodes = {};
  let bannerNode = null;
  let lastNoticeAt = 0;
  let startupError = '';
  let startupRecoveryRequired = false;
  let inputWriteChain = Promise.resolve();
  let ownInputInitialized = false;
  let ownInputInitializing = false;
  let unsubscribeGame = null;
  let unsubscribePresence = null;
  let latestPresence = room.presence || {};

  const now = () => Date.now();
  const notify = (message, type = 'default') => toast(message, type);
  const ownState = () => (role === 'host' ? simPlayers[role] : data.players?.[role]?.state) || {}; 
  const otherState = () => (role === 'host' ? simPlayers[opponentRole] : data.players?.[opponentRole]?.state) || {}; 
  const isOnline = playerRole => latestPresence?.[playerRole]?.connected === true;

  function buildShell() {
    root.innerHTML = `
      <section class="bomber-shell">
        <header class="bomber-header">
          <div><span class="bomber-kicker">DIRI. · CLASSIC ARENA DUEL</span><h1>Bomber Arena <i>✦</i></h1><p>Pasang bom, buka jalan, ambil power-up, dan kalahkan pasanganmu.</p></div>
          <div class="bomber-header-actions"><span class="bomber-room-code">${esc(code)}</span><button type="button" class="button button-quiet button-small" data-ba-action="back">Kembali</button></div>
        </header>
        <div data-ba-screen><section class="bomber-loading"><span>💣</span><strong>Menyusun arena…</strong><small>Menunggu sinkronisasi dua pemain.</small></section></div>
      </section>`;
  }

  function renderPlaying() {
    const screen = root.querySelector('[data-ba-screen]');
    screen.innerHTML = `
      <section class="bomber-game-card">
        <div class="bomber-hud">
          ${renderPlayerHud('host')}
          <div class="bomber-timer"><small>TIME LEFT</small><strong data-ba-timer>03:00</strong><span>DUEL · 1 VS 1</span></div>
          ${renderPlayerHud('guest')}
        </div>
        <div class="bomber-arena-wrap">
          <canvas class="bomber-canvas" data-ba-canvas aria-label="Arena Bomber Arena dua pemain"></canvas>
          <div class="bomber-countdown" data-ba-countdown hidden>3</div>
          <div class="bomber-arena-label" data-ba-banner>${esc(arena?.profileLabel || 'Arena Seimbang')} · Hancurkan blok dan jebak lawan!</div>
        </div>
        <div class="bomber-controls">
          <div class="bomber-dpad" aria-label="Kontrol arah">
            <span></span><button type="button" data-ba-dir="up" aria-label="Ke atas">↑</button><span></span>
            <button type="button" data-ba-dir="left" aria-label="Ke kiri">←</button><span class="bomber-dpad-center" aria-hidden="true">✦</span><button type="button" data-ba-dir="right" aria-label="Ke kanan">→</button>
            <span></span><button type="button" data-ba-dir="down" aria-label="Ke bawah">↓</button><span></span>
          </div>
          <div class="bomber-control-help"><strong>GERAKKAN KARAKTER</strong><span>WASD / tombol panah / D-pad</span><small>Tahan arah untuk berjalan. Perhatikan kotak peringatan sebelum bom meledak.</small></div>
          <button type="button" class="bomber-bomb-button" data-ba-action="bomb"><span>💣</span><strong>BOM</strong><small>Space / Enter</small></button>
        </div>
        <div class="bomber-powerup-legend" aria-label="Panduan power-up">
          <span><b>💣</b> Bomb Up <small>kapasitas</small></span><span><b>🔥</b> Fire Up <small>jangkauan</small></span><span><b>⚡</b> Speed Up <small>kecepatan</small></span><span><b>🛡️</b> Shield <small>tahan serangan</small></span>
        </div>
        <p class="bomber-footnote">Arena diacak secara simetris untuk kedua pemain dan semua jalur lantai tetap terhubung. Kotak merah menandai jalur ledakan; peti dapat menyimpan power-up.</p>
      </section>`;
    canvas = root.querySelector('[data-ba-canvas]');
    ctx = canvas?.getContext('2d');
    if (canvas) {
      canvas.width = 780;
      canvas.height = 660;
    }
    timerNode = root.querySelector('[data-ba-timer]');
    hudNodes = {
      host: { score: root.querySelector('[data-ba-score="host"]'), lives: root.querySelector('[data-ba-lives="host"]'), stats: root.querySelector('[data-ba-stats="host"]') },
      guest: { score: root.querySelector('[data-ba-score="guest"]'), lives: root.querySelector('[data-ba-lives="guest"]'), stats: root.querySelector('[data-ba-stats="guest"]') }
    };
    bannerNode = root.querySelector('[data-ba-banner]');
    drawArena();
    updateHud();
  }

  function renderPlayerHud(playerRole) {
    const tone = ROLE_TONES[playerRole];
    const player = (role === 'host' ? simPlayers[playerRole] : data.players?.[playerRole]?.state) || simPlayers[playerRole] || {};
    return `<article class="bomber-player-hud is-${tone}"><span class="bomber-player-avatar">${DEFAULT_AVATARS[playerRole]}</span><div><strong>${esc(names[playerRole])}</strong><span><b data-ba-score="${playerRole}">${Number(player.score || 0)}</b> poin</span><small data-ba-lives="${playerRole}">♥♥♥</small><i data-ba-stats="${playerRole}">💣 1 · 🔥 2</i></div></article>`;
  }

  function renderResult() {
    const screen = root.querySelector('[data-ba-screen]');
    const result = data.meta || {};
    const host = (role === 'host' ? (simPlayers.host || data.players?.host?.state) : data.players?.host?.state) || {};
    const guest = (role === 'host' ? (simPlayers.guest || data.players?.guest?.state) : data.players?.guest?.state) || {};
    const winner = result.winner || 'draw';
    const title = winner === 'draw' ? 'Pertandingan seri!' : `${esc(names[winner])} menang!`;
    const reason = result.reason === 'elimination'
      ? 'Lawan kehabisan nyawa.'
      : result.reason === 'both-eliminated'
        ? 'Kedua pemain terkena ledakan terakhir.'
        : 'Waktu habis. Pemenang ditentukan dari sisa nyawa, lalu skor.';
    screen.innerHTML = `
      <section class="bomber-result-card">
        <div class="bomber-result-trophy">${winner === 'draw' ? '🤝' : '🏆'}</div>
        <span class="bomber-kicker">BOMBER ARENA · MATCH RESULT</span>
        <h2>${title}</h2><p>${reason}</p>
        <div class="bomber-result-pair">
          ${resultPlayerCard('host', host)}<div class="bomber-result-vs">VS</div>${resultPlayerCard('guest', guest)}
        </div>
        <div class="bomber-result-summary"><span>Durasi pertandingan</span><strong>${formatBomberTime(Math.max(0, Number(result.endedAt || now()) - Number(result.startedAt || now())))}</strong></div>
        <div class="bomber-result-actions">${role === 'host' ? '<button type="button" class="button button-primary" data-ba-action="back">Kembali ke lobi</button>' : '<span>Menunggu pembuat ruang kembali ke lobi…</span>'}</div>
      </section>`;
  }

  function resultPlayerCard(playerRole, state) {
    const tone = ROLE_TONES[playerRole];
    return `<article class="bomber-result-player is-${tone}"><span>${DEFAULT_AVATARS[playerRole]}</span><strong>${esc(names[playerRole])}</strong><b>${Number(state.score || 0)}</b><small>POIN</small><div>${'♥'.repeat(Math.max(0, Number(state.lives || 0)))}${'♡'.repeat(Math.max(0, 3 - Number(state.lives || 0)))}</div><small>${Number(state.lives || 0)} nyawa tersisa</small><div class="bomber-result-stats"><span>💣 <b>${Number(state.bombsPlaced || 0)}</b><small>Bom</small></span><span>📦 <b>${Number(state.blocksDestroyed || 0)}</b><small>Peti</small></span><span>✨ <b>${Number(state.powerupsCollected || 0)}</b><small>Item</small></span><span>💥 <b>${Number(state.hitsTaken || 0)}</b><small>Kena</small></span></div></article>`;
  }

  function renderWaiting() {
    const screen = root.querySelector('[data-ba-screen]');
    if (!screen) return;
    const bothOnline = isOnline('host') && isOnline('guest');
    const headline = startupError
      ? (startupRecoveryRequired ? 'Sesi perlu dimulai ulang' : 'Arena gagal disiapkan')
      : data.meta?.phase === 'setup'
        ? 'Menyiapkan arena…'
        : bothOnline ? 'Menghubungkan arena…' : 'Menunggu pemain…';
    const detail = startupError || (bothOnline
      ? 'Kedua pemain sudah terhubung. Menyiapkan arena 13 × 11…'
      : 'Arena akan dimulai setelah kedua perangkat terhubung.');
    const actions = startupError
      ? `<div class="bomber-loading-actions">${role === 'host' && startupRecoveryRequired ? '<button type="button" class="button button-primary" data-ba-action="back">Kembali ke lobi</button>' : ''}${role === 'host' && !startupRecoveryRequired ? '<button type="button" class="button button-primary" data-ba-action="retry">Coba lagi</button>' : ''}</div>`
      : '';
    screen.innerHTML = `<section class="bomber-loading ${startupError ? 'has-error' : ''}"><span>${startupError ? '⚠️' : '💣'}</span><strong>${headline}</strong><small>${esc(detail)}</small><div class="bomber-loading-players"><span>${isOnline('host') ? '●' : '○'} ${esc(names.host)}</span><span>${isOnline('guest') ? '●' : '○'} ${esc(names.guest)}</span></div>${actions}</section>`;
  }

  function updateHud() {
    const meta = data.meta || {};
    const startedAt = Number(meta.startedAt || 0);
    const elapsed = Math.max(0, now() - startedAt);
    const remaining = Math.max(0, Number(meta.durationMs || BOMBER_DURATION_MS) - elapsed);
    if (timerNode) timerNode.textContent = formatBomberTime(remaining);
    for (const playerRole of ROLES) {
      const state = (role === 'host' ? simPlayers[playerRole] : data.players?.[playerRole]?.state) || simPlayers[playerRole] || {}; 
      const nodes = hudNodes[playerRole];
      if (!nodes) continue;
      if (nodes.score) nodes.score.textContent = String(Number(state.score || 0));
      if (nodes.lives) nodes.lives.textContent = `${'♥'.repeat(Math.max(0, Number(state.lives ?? 3)))}${'♡'.repeat(Math.max(0, 3 - Number(state.lives ?? 3)))}`;
      if (nodes.stats) {
        const visibleBombs = role === 'host' ? simBombs : (data.bombs || {});
        const active = Object.values(visibleBombs).filter(bomb => bomb.owner === playerRole).length;
        nodes.stats.textContent = `💣 ${active}/${Number(state.bombMax || 1)} · 🔥 ${Number(state.fireRange || 2)}${Number(state.shield || 0) ? ` · 🛡 ${Number(state.shield)}` : ''}`;
      }
    }
    const matchStarted = meta.phase === 'playing' && now() >= startedAt;
    root.querySelectorAll('[data-ba-dir], [data-ba-action="bomb"]').forEach(button => { button.disabled = !matchStarted; });
    const countdown = root.querySelector('[data-ba-countdown]');
    if (countdown && meta.phase === 'playing' && now() < startedAt) {
      countdown.hidden = false;
      countdown.textContent = String(Math.max(1, Math.ceil((startedAt - now()) / 1000)));
    } else if (countdown) countdown.hidden = true;
  }

  function drawArena(timestamp = 0) {
    if (!ctx || !canvas || destroyed) return;
    const width = canvas.width;
    const height = canvas.height;
    const visibleDestroyed = role === 'host' ? simDestroyed : (data.destroyedBlocks || {});
    const cellW = width / BOMBER_GRID_WIDTH;
    const cellH = height / BOMBER_GRID_HEIGHT;
    ctx.clearRect(0, 0, width, height);
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#20263d'); bg.addColorStop(1, '#30314a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < BOMBER_GRID_HEIGHT; y += 1) {
      for (let x = 0; x < BOMBER_GRID_WIDTH; x += 1) {
        const key = bomberCellKey(x, y);
        const px = x * cellW; const py = y * cellH;
        ctx.fillStyle = (x + y) % 2 ? '#35394d' : '#3c4054';
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.strokeRect(px + 2, py + 2, cellW - 4, cellH - 4);
        if (arena?.walls?.includes(key)) drawWall(px, py, cellW, cellH);
        else if (arena?.blocks?.includes(key) && visibleDestroyed[key] !== true) drawCrate(px, py, cellW, cellH);
      }
    }

    const visibleBombs = role === 'host' ? simBombs : (data.bombs || {});
    const warningPreviews = getBomberWarningPreviews({
      arena, bombs: visibleBombs, destroyedBlocks: visibleDestroyed, now: now(), warningMs: BOMBER_WARNING_MS
    });
    for (const preview of warningPreviews) drawBlastWarning(preview, cellW, cellH, timestamp);

    const visiblePowerups = role === 'host' ? simPowerups : (data.powerups || {});
    for (const [key, type] of Object.entries(visiblePowerups)) {
      const { x, y } = parseBomberCellKey(key);
      const item = BOMBER_POWERUPS[type];
      if (!item) continue;
      const itemColors = { bombup: '#ffca73', fireup: '#ff987b', speedup: '#7bdcf2', shield: '#b6a0ff' };
      const itemColor = itemColors[type] || '#ffe9a8';
      ctx.save();
      ctx.shadowColor = itemColor; ctx.shadowBlur = 16;
      ctx.fillStyle = itemColor; ctx.beginPath(); ctx.arc((x + .5) * cellW, (y + .5) * cellH, cellW * .31, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = `${cellH * .43}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.icon, (x + .5) * cellW, (y + .51) * cellH);
      ctx.restore();
    }

    const bombs = role === 'host' ? simBombs : (data.bombs || {});
    for (const bomb of Object.values(bombs)) drawBomb(bomb, cellW, cellH, timestamp);
    const explosions = role === 'host' ? simExplosions : (data.explosions || {});
    for (const explosion of Object.values(explosions)) {
      if (Number(explosion.endsAt || 0) <= now()) continue;
      for (const key of String(explosion.cells || '').split('|').filter(Boolean)) {
        const { x, y } = parseBomberCellKey(key);
        drawFlame(x * cellW, y * cellH, cellW, cellH, timestamp);
      }
    }

    for (const playerRole of ROLES) {
      const player = (role === 'host' ? simPlayers[playerRole] : data.players?.[playerRole]?.state) || simPlayers[playerRole];
      if (player) drawPlayer(playerRole, player, cellW, cellH, timestamp);
    }
  }

  function drawBlastWarning(preview, cellW, cellH, timestamp) {
    const pulse = .16 + (Math.sin(timestamp / 48) + 1) * .08 + preview.intensity * .18;
    for (const key of preview.cells) {
      const { x, y } = parseBomberCellKey(key);
      const px = x * cellW; const py = y * cellH;
      ctx.save();
      ctx.fillStyle = `rgba(255, 74, 73, ${Math.min(.58, pulse)})`;
      ctx.fillRect(px + 3, py + 3, cellW - 6, cellH - 6);
      ctx.strokeStyle = `rgba(255, 225, 173, ${Math.min(.95, .42 + preview.intensity * .5)})`;
      ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.strokeRect(px + 4, py + 4, cellW - 8, cellH - 8);
      ctx.restore();
    }
  }

  function drawWall(x, y, w, h) {
    ctx.fillStyle = '#59647a'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#77849b'; ctx.fillRect(x + 3, y + 3, w - 6, 7);
    ctx.strokeStyle = 'rgba(13,20,38,.6)'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.beginPath(); ctx.moveTo(x + 7, y + h * .52); ctx.lineTo(x + w - 7, y + h * .52); ctx.stroke();
  }

  function drawCrate(x, y, w, h) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#bd885a'); grad.addColorStop(1, '#81583e');
    ctx.fillStyle = grad; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.strokeStyle = '#e0b27c'; ctx.lineWidth = 2; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.strokeStyle = 'rgba(60,35,30,.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 9, y + 10); ctx.lineTo(x + w - 10, y + h - 10); ctx.moveTo(x + w - 10, y + 10); ctx.lineTo(x + 10, y + h - 10); ctx.stroke();
    ctx.fillStyle = 'rgba(255,224,171,.28)'; ctx.fillRect(x + 8, y + 8, w - 16, 4);
  }

  function drawBomb(bomb, cellW, cellH, timestamp) {
    const cx = (Number(bomb.x) + .5) * cellW; const cy = (Number(bomb.y) + .5) * cellH;
    const remaining = Math.max(0, Number(bomb.explodeAt || 0) - now());
    const totalFuse = Math.max(1, Number(bomb.explodeAt || 0) - Number(bomb.placedAt || 0));
    const fuseProgress = Math.max(0, Math.min(1, 1 - remaining / totalFuse));
    const pulse = 1 + Math.sin(timestamp / Math.max(30, 90 - fuseProgress * 45)) * (.07 + fuseProgress * .035);
    ctx.save(); ctx.shadowColor = remaining <= BOMBER_WARNING_MS ? '#ff5b53' : '#ff8a70'; ctx.shadowBlur = 13 + fuseProgress * 8;
    ctx.fillStyle = remaining <= BOMBER_WARNING_MS ? '#30202d' : '#171b2b'; ctx.beginPath(); ctx.arc(cx, cy + 3, cellW * .31 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#65718b'; ctx.beginPath(); ctx.arc(cx - 4, cy - 4, cellW * .09, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb35c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 4, cy - cellH * .23); ctx.quadraticCurveTo(cx + 11, cy - cellH * .4, cx + 17, cy - cellH * .29); ctx.stroke();
    ctx.fillStyle = '#fff2a3'; ctx.beginPath(); ctx.arc(cx + 17, cy - cellH * .29, 3 + Math.sin(timestamp / 60) * 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = remaining <= BOMBER_WARNING_MS ? '#ff6b62' : '#ffe0a3'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy + 3, cellW * .39, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuseProgress); ctx.stroke();
    ctx.restore();
  }

  function drawFlame(x, y, w, h, timestamp) {
    const flicker = Math.sin(timestamp / 42 + x + y) * 2;
    ctx.save(); ctx.shadowColor = '#ff9b54'; ctx.shadowBlur = 19;
    const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w * .6);
    grad.addColorStop(0, '#fff5ae'); grad.addColorStop(.45, '#ffb14c'); grad.addColorStop(1, 'rgba(255,75,75,.3)');
    ctx.fillStyle = grad; ctx.fillRect(x + 4, y + 4 + flicker, w - 8, h - 8);
    ctx.restore();
  }

  function drawPlayer(playerRole, player, cellW, cellH, timestamp) {
    if (player.alive === false || Number(player.lives) <= 0) return;
    if (Number(player.invulnerableUntil || 0) > now() && Math.floor(timestamp / 100) % 2) return;
    const cx = (Number(player.x) + .5) * cellW; const cy = (Number(player.y) + .5) * cellH;
    const radius = Math.min(cellW, cellH) * .34;
    const tone = playerRole === 'host' ? '#f278ad' : '#62c2eb';
    const edge = playerRole === 'host' ? '#ffd4e6' : '#d7f4ff';
    ctx.save(); ctx.shadowColor = tone; ctx.shadowBlur = 17;
    ctx.fillStyle = tone; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - radius * .25, cy - radius * .16, radius * .12, 0, Math.PI * 2); ctx.arc(cx + radius * .25, cy - radius * .16, radius * .12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#24263b'; ctx.beginPath(); ctx.arc(cx - radius * .25, cy - radius * .16, radius * .055, 0, Math.PI * 2); ctx.arc(cx + radius * .25, cy - radius * .16, radius * .055, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#34283c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy + radius * .12, radius * .2, .15, Math.PI - .15); ctx.stroke();
    if (Number(player.invulnerableUntil || 0) > now()) {
      ctx.strokeStyle = 'rgba(255,244,170,.92)'; ctx.lineWidth = 3; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    if (Number(player.shield || 0) > 0) { ctx.strokeStyle = 'rgba(157,220,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, radius + 13, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  function updateInputCache(nextData) {
    for (const playerRole of ROLES) {
      const input = nextData.players?.[playerRole]?.input;
      if (input) {
        const incoming = { dx: Number(input.dx || 0), dy: Number(input.dy || 0), bombSeq: Number(input.bombSeq || 0), updatedAt: Number(input.updatedAt || 0) };
        const previous = inputCache[playerRole] || {};
        const changed = incoming.dx !== Number(previous.dx || 0) || incoming.dy !== Number(previous.dy || 0) || incoming.bombSeq !== Number(previous.bombSeq || 0) || incoming.updatedAt !== Number(previous.updatedAt || 0);
        const receivedAt = changed || !previous.receivedAt ? now() : previous.receivedAt;
        if (playerRole === role) {
          localBombSeq = Math.max(localBombSeq, incoming.bombSeq);
          inputCache[playerRole] = { ...incoming, dx: currentDirection.dx, dy: currentDirection.dy, bombSeq: localBombSeq, receivedAt };
        } else inputCache[playerRole] = { ...incoming, receivedAt };
      }
    }
  }

  async function initializeGame() {
    if (role !== 'host' || initializing || destroyed) return;
    if (!isOnline('host') || !isOnline('guest')) {
      renderWaiting();
      return;
    }
    if (room?.lobby?.ready?.host !== true || room?.lobby?.ready?.guest !== true) {
      startupError = 'Status Siap kedua pemain tidak tersimpan untuk sesi ini. Host perlu kembali ke lobi, lalu kedua pemain menekan Siap dan memulai ulang.';
      startupRecoveryRequired = true;
      renderWaiting();
      return;
    }
    startupError = '';
    startupRecoveryRequired = false;
    initializing = true;
    let stage = 'membaca status arena';
    try {
      const existing = await get(metaRef);
      let seed;
      let createdAt;
      if (existing.exists()) {
        const currentMeta = existing.val() || {};
        if (currentMeta.phase !== 'setup') return;
        seed = Number(currentMeta.seed) || randomSeed();
        createdAt = Number(currentMeta.createdAt) || now();
      } else {
        seed = randomSeed();
        createdAt = now();
        stage = 'membuat metadata awal (bomberArena/meta)';
        await set(metaRef, { phase: 'setup', seed, startedAt: 0, durationMs: BOMBER_DURATION_MS, createdAt, endedAt: 0, winner: '', reason: '' });
      }

      const hostStatePath = `${basePath}/players/host/state`;
      const guestStatePath = `${basePath}/players/guest/state`;
      const hostInputPath = `${basePath}/players/host/input`;
      stage = 'membaca status pemain';
      const snapshots = await Promise.all([
        get(ref(db, hostStatePath)),
        get(ref(db, guestStatePath)),
        get(ref(db, hostInputPath))
      ]);
      const startedAt = now() + 3000;
      const hostState = {
        ...(snapshots[0].exists() ? (snapshots[0].val() || {}) : createBomberPlayer('host', names.host)),
        invulnerableUntil: startedAt + BOMBER_SPAWN_PROTECTION_MS
      };
      const guestState = {
        ...(snapshots[1].exists() ? (snapshots[1].val() || {}) : createBomberPlayer('guest', names.guest)),
        invulnerableUntil: startedAt + BOMBER_SPAWN_PROTECTION_MS
      };
      // Sequential writes intentionally identify the exact denied path. A Promise.all
      // obscures which child write failed and may leave a partially initialized room.
      if (!snapshots[0].exists()) {
        stage = 'menulis state Player 1 (bomberArena/players/host/state)';
        await set(ref(db, hostStatePath), hostState);
      }
      if (!snapshots[1].exists()) {
        stage = 'menulis state Player 2 (bomberArena/players/guest/state)';
        await set(ref(db, guestStatePath), guestState);
      }
      if (!snapshots[2].exists()) {
        stage = 'menulis input awal Player 1 (bomberArena/players/host/input)';
        await set(ref(db, hostInputPath), { dx: 0, dy: 0, bombSeq: 0, updatedAt: now() });
      }
      stage = 'memverifikasi state kedua pemain';
      const verified = await Promise.all([get(ref(db, hostStatePath)), get(ref(db, guestStatePath))]);
      if (!verified[0].exists() || !verified[1].exists()) {
        throw new Error('State salah satu pemain belum tersimpan setelah penulisan.');
      }
      stage = 'mengubah fase arena menjadi playing (bomberArena/meta)';
      await set(metaRef, { phase: 'playing', seed, startedAt, durationMs: BOMBER_DURATION_MS, createdAt, endedAt: 0, winner: '', reason: '' });
    } catch (error) {
      const code = error?.code || error?.message || 'UNKNOWN_ERROR';
      startupError = `Gagal pada tahap: ${stage}. Firebase: ${code}. Periksa Rules untuk path tersebut; kirim screenshot pesan ini agar path yang ditolak dapat diperbaiki secara spesifik.`;
      startupRecoveryRequired = false;
      renderWaiting();
      notify(`Arena gagal pada tahap ${stage}: ${code}`, 'error');
    } finally {
      initializing = false;
    }
  }

  function hydrateHostSimulation() {
    if (initialized || role !== 'host' || !data.meta || !data.players?.host?.state || !data.players?.guest?.state) return;
    arena = createBomberArena(Number(data.meta.seed || 1));
    simPlayers = {
      host: { bombsPlaced: 0, blocksDestroyed: 0, hitsTaken: 0, powerupsCollected: 0, ...data.players.host.state },
      guest: { bombsPlaced: 0, blocksDestroyed: 0, hitsTaken: 0, powerupsCollected: 0, ...data.players.guest.state }
    };
    simBombs = { ...(data.bombs || {}) };
    simDestroyed = { ...(data.destroyedBlocks || {}) };
    simPowerups = { ...(data.powerups || {}) };
    simExplosions = { ...(data.explosions || {}) };
    processedBombSeq = {
      host: Number(data.players.host.input?.bombSeq || 0),
      guest: Number(data.players.guest.input?.bombSeq || 0)
    };
    lastMoveAt = { host: now(), guest: now() };
    initialized = true;
    startHostTicker();
  }

  async function ensureOwnInput() {
    if (!isParticipant(role) || !data.meta || ownInputInitialized || ownInputInitializing) return;
    if (data.players?.[role]?.input) { ownInputInitialized = true; return; }
    ownInputInitializing = true;
    try {
      await set(inputRefs[role], { dx: 0, dy: 0, bombSeq: 0, updatedAt: now() });
      ownInputInitialized = true;
    } catch (error) { notify(`Kontrol belum tersambung: ${error.message}`, 'error'); }
    finally { ownInputInitializing = false; }
  }

  async function sendInput(patch) {
    if (destroyed || !data.meta || data.meta.phase !== 'playing') return;
    inputCache[role] = { ...inputCache[role], ...patch, bombSeq: Math.max(Number(inputCache[role].bombSeq || 0), localBombSeq), updatedAt: now(), receivedAt: now() };
    const payload = { dx: inputCache[role].dx, dy: inputCache[role].dy, bombSeq: inputCache[role].bombSeq, updatedAt: inputCache[role].updatedAt };
    inputWriteChain = inputWriteChain.then(() => set(inputRefs[role], payload)).catch(error => {
      notify(`Input tidak tersinkron: ${error.message}`, 'error');
    });
    await inputWriteChain;
  }

  function setDirection(dx, dy) {
    dx = Math.max(-1, Math.min(1, Number(dx) || 0));
    dy = Math.max(-1, Math.min(1, Number(dy) || 0));
    if (dx !== 0 && dy !== 0) dy = 0;
    const startsAt = Number(data.meta?.startedAt || 0);
    if ((dx !== 0 || dy !== 0) && (data.meta?.phase !== 'playing' || now() < startsAt)) return;
    if (currentDirection.dx === dx && currentDirection.dy === dy) return;
    currentDirection = { dx, dy };
    void sendInput(currentDirection);
  }

  function placeBomb() {
    if (destroyed || data.meta?.phase !== 'playing') return;
    if (now() < Number(data.meta?.startedAt || 0)) { notify('Tunggu hitung mundur selesai sebelum memasang bom.'); return; }
    localBombSeq = Math.max(localBombSeq, Number(inputCache[role].bombSeq || 0)) + 1;
    void sendInput({ bombSeq: localBombSeq });
  }

  function onPointerDown(event) {
    const directionButton = event.target.closest('[data-ba-dir]');
    if (directionButton) {
      event.preventDefault();
      directionButton.setPointerCapture?.(event.pointerId);
      activeDirectionPointerId = event.pointerId;
      directionButton.classList.add('is-pressed');
      const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const [dx, dy] = dirs[directionButton.dataset.baDir] || [0, 0];
      setDirection(dx, dy);
      return;
    }
    const bombButton = event.target.closest('[data-ba-action="bomb"]');
    if (bombButton) { event.preventDefault(); bombButton.classList.add('is-pressed'); }
  }

  function onPointerUp(event) {
    root.querySelectorAll('[data-ba-dir].is-pressed,[data-ba-action="bomb"].is-pressed').forEach(node => node.classList.remove('is-pressed'));
    if (activeDirectionPointerId !== null && event?.pointerId === activeDirectionPointerId) {
      activeDirectionPointerId = null;
      setDirection(0, 0);
    }
  }

  function keyDirection(event) {
    const key = event.key.toLowerCase();
    if (['w', 'arrowup'].includes(key)) return [0, -1];
    if (['s', 'arrowdown'].includes(key)) return [0, 1];
    if (['a', 'arrowleft'].includes(key)) return [-1, 0];
    if (['d', 'arrowright'].includes(key)) return [1, 0];
    return null;
  }

  function onKeyDown(event) {
    if ([' ', 'enter'].includes(event.key.toLowerCase())) { event.preventDefault(); if (!event.repeat) placeBomb(); return; }
    const direction = keyDirection(event);
    if (direction) { event.preventDefault(); setDirection(direction[0], direction[1]); }
  }

  function onKeyUp(event) {
    if (keyDirection(event)) { event.preventDefault(); setDirection(0, 0); }
  }

  function onClick(event) {
    const action = event.target.closest('[data-ba-action]')?.dataset.baAction;
    if (action === 'retry') {
      startupError = '';
      void initializeGame();
      return;
    }
    if (action === 'back') {
      if (data.meta?.phase === 'playing') {
        notify('Pertandingan sedang berlangsung. Selesaikan duel sebelum kembali ke lobi.', 'error');
        return;
      }
      onBack?.();
    }
    if (action === 'bomb') placeBomb();
  }

  function activeBombCount(playerRole) {
    return Object.values(simBombs).filter(bomb => bomb.owner === playerRole).length;
  }

  function hostPlaceBomb(playerRole, bombSeq, nowAt) {
    const player = simPlayers[playerRole];
    if (!player || player.alive === false || Number(player.lives) <= 0) return null;
    if (activeBombCount(playerRole) >= Number(player.bombMax || 1)) return null;
    const x = Number(player.x); const y = Number(player.y);
    const cell = bomberCellKey(x, y);
    if (Object.values(simBombs).some(bomb => bomberCellKey(bomb.x, bomb.y) === cell)) return null;
    const id = `${playerRole}_${bombSeq}`;
    const bomb = { id, owner: playerRole, x, y, placedAt: nowAt, explodeAt: nowAt + BOMBER_BOMB_FUSE_MS, range: Number(player.fireRange || 2) };
    simBombs[id] = bomb;
    return bomb;
  }

  function processDueExplosions(nowAt, updates, stateDirty) {
    const processed = new Set();
    const queue = Object.values(simBombs).filter(bomb => Number(bomb.explodeAt) <= nowAt).map(bomb => bomb.id);
    while (queue.length) {
      const bombId = queue.shift();
      if (processed.has(bombId)) continue;
      const bomb = simBombs[bombId];
      if (!bomb) continue;
      processed.add(bombId);
      const blast = getBomberBlastCells({ arena, bomb, destroyedBlocks: simDestroyed });
      const blastSet = new Set(blast.cells);
      for (const blockKey of blast.hitBlocks) {
        if (simDestroyed[blockKey]) continue;
        simDestroyed[blockKey] = true;
        updates[`destroyedBlocks/${blockKey}`] = true;
        const powerup = arena.hiddenPowerups[blockKey];
        if (powerup) {
          simPowerups[blockKey] = powerup;
          updates[`powerups/${blockKey}`] = powerup;
        }
        simPlayers[bomb.owner].score = Number(simPlayers[bomb.owner].score || 0) + 5;
        simPlayers[bomb.owner].blocksDestroyed = Number(simPlayers[bomb.owner].blocksDestroyed || 0) + 1;
        stateDirty[bomb.owner] = true;
      }
      for (const playerRole of ROLES) {
        const player = simPlayers[playerRole];
        if (!player || player.alive === false) continue;
        if (blastSet.has(bomberCellKey(player.x, player.y))) {
          const hit = damageBomberPlayer(player, nowAt);
          simPlayers[playerRole] = hit.player;
          if (hit.damaged || hit.shielded) stateDirty[playerRole] = true;
          if (hit.damaged) {
            hit.player.hitsTaken = Number(hit.player.hitsTaken || 0) + 1;
            stateDirty[playerRole] = true;
            notify(`${names[playerRole]} terkena ledakan! Nyawa tersisa ${hit.player.lives}.`, 'error');
          }
          else if (hit.shielded) notify(`${names[playerRole]} terlindungi oleh shield.`, 'success');
        }
      }
      for (const [otherId, otherBomb] of Object.entries(simBombs)) {
        if (otherId !== bombId && blastSet.has(bomberCellKey(otherBomb.x, otherBomb.y))) otherBomb.explodeAt = Math.min(Number(otherBomb.explodeAt), nowAt);
      }
      const explosionId = `${bomb.owner}_${bombId}_${nowAt}`;
      const explosion = { cells: blast.cells.join('|'), endsAt: nowAt + BOMBER_EXPLOSION_MS };
      simExplosions[explosionId] = explosion;
      updates[`explosions/${explosionId}`] = explosion;
      delete simBombs[bombId];
      updates[`bombs/${bombId}`] = null;
      for (const [otherId, otherBomb] of Object.entries(simBombs)) {
        if (Number(otherBomb.explodeAt) <= nowAt && !processed.has(otherId) && !queue.includes(otherId)) queue.push(otherId);
      }
    }
  }

  function collectPowerups(nowAt, updates, stateDirty) {
    for (const playerRole of ROLES) {
      const player = simPlayers[playerRole];
      if (!player || player.alive === false) continue;
      const cell = bomberCellKey(player.x, player.y);
      const type = simPowerups[cell];
      if (!type) continue;
      simPlayers[playerRole] = applyBomberPowerup(player, type);
      simPlayers[playerRole].powerupsCollected = Number(player.powerupsCollected || 0) + 1;
      stateDirty[playerRole] = true;
      delete simPowerups[cell];
      updates[`powerups/${cell}`] = null;
      notify(`${names[playerRole]} mendapatkan ${BOMBER_POWERUPS[type]?.label || 'power-up'}!`, 'success');
    }
  }

  function applyActiveExplosionDamage(nowAt, stateDirty) {
    const activeCells = getActiveBomberExplosionCells(simExplosions, nowAt);
    if (!activeCells.size) return;
    for (const playerRole of ROLES) {
      const player = simPlayers[playerRole];
      if (!player || player.alive === false || !activeCells.has(bomberCellKey(player.x, player.y))) continue;
      const hit = damageBomberPlayer(player, nowAt);
      if (!hit.damaged && !hit.shielded) continue;
      simPlayers[playerRole] = hit.player;
      if (hit.damaged) {
        simPlayers[playerRole].hitsTaken = Number(simPlayers[playerRole].hitsTaken || 0) + 1;
        notify(`${names[playerRole]} masuk ke kobaran api! Nyawa tersisa ${hit.player.lives}.`, 'error');
      } else notify(`${names[playerRole]} terlindungi oleh shield.`, 'success');
      stateDirty[playerRole] = true;
    }
  }

  async function hostTick() {
    if (role !== 'host' || !initialized || hostTickBusy || destroyed || data.meta?.phase !== 'playing') return;
    hostTickBusy = true;
    try {
      const nowAt = now();
      if (nowAt < Number(data.meta?.startedAt || 0)) return;
      const updates = {};
      const stateDirty = { host: false, guest: false };
      for (const playerRole of ROLES) {
        const input = inputCache[playerRole] || {};
        const player = simPlayers[playerRole];
        if (!player || player.alive === false) continue;
        const bombSeq = Number(input.bombSeq || 0);
        if (bombSeq > processedBombSeq[playerRole]) {
          processedBombSeq[playerRole] = bombSeq;
          const bomb = hostPlaceBomb(playerRole, bombSeq, nowAt);
          if (bomb) {
            updates[`bombs/${bomb.id}`] = bomb;
            simPlayers[playerRole].bombsPlaced = Number(simPlayers[playerRole].bombsPlaced || 0) + 1;
            stateDirty[playerRole] = true;
          }
        }
        // Use the host's local receipt clock instead of comparing client clocks
        // from two devices, which may be skewed by several seconds or minutes.
        const inputFresh = nowAt - Number(input.receivedAt || 0) <= 650;
        const dx = inputFresh ? Number(input.dx || 0) : 0;
        const dy = inputFresh ? Number(input.dy || 0) : 0;
        const due = nowAt - Number(lastMoveAt[playerRole] || 0) >= Number(player.moveDelay || 155);
        if (due && (Math.abs(dx) + Math.abs(dy) === 1)) {
          const otherRole = playerRole === 'host' ? 'guest' : 'host';
          if (canBomberMove({ arena, player, direction: { dx, dy }, destroyedBlocks: simDestroyed, bombs: simBombs, otherPlayers: { [otherRole]: simPlayers[otherRole] } })) {
            player.x += dx; player.y += dy;
            stateDirty[playerRole] = true;
            lastMoveAt[playerRole] = nowAt;
          } else {
            lastMoveAt[playerRole] = nowAt - Math.max(0, Number(player.moveDelay || 155) - 80);
          }
        }
      }

      processDueExplosions(nowAt, updates, stateDirty);
      applyActiveExplosionDamage(nowAt, stateDirty);
      collectPowerups(nowAt, updates, stateDirty);
      for (const playerRole of ROLES) {
        if (stateDirty[playerRole]) updates[`players/${playerRole}/state`] = { ...simPlayers[playerRole] };
      }
      for (const [id, explosion] of Object.entries(simExplosions)) {
        if (Number(explosion.endsAt) <= nowAt) {
          delete simExplosions[id];
          updates[`explosions/${id}`] = null;
        }
      }
      const timedOut = nowAt >= Number(data.meta.startedAt || 0) + Number(data.meta.durationMs || BOMBER_DURATION_MS);
      const result = getBomberWinner(simPlayers, timedOut);
      if (result) {
        if (Object.keys(updates).length) await update(baseRef, updates);
        const finalMeta = { ...data.meta, phase: 'result', endedAt: nowAt, winner: result.winner, reason: result.reason };
        await set(metaRef, finalMeta);
        return;
      }
      if (Object.keys(updates).length) await update(baseRef, updates);
    } catch (error) {
      const time = now();
      if (time - lastNoticeAt > 5000) { lastNoticeAt = time; notify(`Sinkronisasi Bomber Arena terputus: ${error.message}`, 'error'); }
    } finally {
      hostTickBusy = false;
    }
  }

  function startHostTicker() {
    if (hostTickId || role !== 'host') return;
    hostTickId = window.setInterval(() => { void hostTick(); }, BOMBER_TICK_MS);
  }

  function startRenderLoop() {
    if (rafId) return;
    const paint = timestamp => {
      if (destroyed) return;
      if (data.meta?.phase === 'playing') {
        updateHud();
        drawArena(timestamp);
      }
      rafId = requestAnimationFrame(paint);
    };
    rafId = requestAnimationFrame(paint);
  }

  function renderFromData() {
    if (destroyed) return;
    const phase = data.meta?.phase || 'waiting';
    if (phase !== lastPhase) {
      lastPhase = phase;
      if (phase === 'playing') {
        arena = createBomberArena(Number(data.meta.seed || 1));
        renderPlaying();
        startRenderLoop();
      } else if (phase === 'result') {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        renderResult();
      } else renderWaiting();
    } else if (phase === 'playing') {
      updateHud();
    }
  }

  async function handleSnapshot(snapshot) {
    data = snapshot.val() || {};
    updateInputCache(data);
    if (data.players?.[role]?.input) ownInputInitialized = true;
    if (data.players?.[role]?.input) localBombSeq = Math.max(localBombSeq, Number(data.players[role].input.bombSeq || 0));
    if (data.meta?.phase === 'setup') {
      await ensureOwnInput();
    }
    if (data.meta?.phase === 'playing') {
      await ensureOwnInput();
      if (role === 'host') hydrateHostSimulation();
    }
    if (role === 'host' && (!data.meta || data.meta.phase === 'setup') && !initializing) void initializeGame();
    renderFromData();
  }

  function startInputKeepalive() {
    if (inputKeepaliveId) return;
    inputKeepaliveId = window.setInterval(() => {
      if (destroyed || data.meta?.phase !== 'playing' || (currentDirection.dx === 0 && currentDirection.dy === 0)) return;
      void sendInput(currentDirection);
    }, 220);
  }

  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    if (unsubscribeGame) unsubscribeGame();
    if (unsubscribePresence) unsubscribePresence();
    if (rafId) cancelAnimationFrame(rafId);
    if (hostTickId) clearInterval(hostTickId);
    if (inputKeepaliveId) clearInterval(inputKeepaliveId);
    root.removeEventListener('click', onClick);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointerup', onPointerUp);
    root.removeEventListener('pointercancel', onPointerUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function onVisibilityChange() {
    if (document.hidden) setDirection(0, 0);
  }

  function onWindowBlur() {
    setDirection(0, 0);
  }

  buildShell();
  renderWaiting();
  root.addEventListener('click', onClick);
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onWindowBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);
  startInputKeepalive();
  unsubscribeGame = onValue(baseRef, snapshot => { void handleSnapshot(snapshot); }, error => notify(error.message, 'error'));
  unsubscribePresence = onValue(presenceRef, snapshot => {
    latestPresence = snapshot.val() || {};
    if (role === 'host' && (!data.meta || data.meta.phase === 'setup') && isOnline('host') && isOnline('guest')) void initializeGame();
  }, error => console.warn('Bomber Arena presence:', error));
  return { destroy: cleanup };
}
