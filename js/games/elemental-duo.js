import { db, ref, set, update, onValue, runTransaction } from '../firebase.js';
import {
  ELEMENTAL_WORLD_WIDTH, ELEMENTAL_WORLD_HEIGHT,
  ELEMENTAL_GRAVITY, ELEMENTAL_MOVE_SPEED, ELEMENTAL_JUMP_SPEED,
  createElementalPlayer, getElementalLevel, getElementalStars, rectsOverlap
} from './elemental-duo-logic.js?v=0.24.0';

const ESCAPE = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const CHARACTER = {
  host: { name:'Bara', element:'fire', label:'Roh Bara', symbol:'✦', color:'#ff985b', other:'Nira' },
  guest: { name:'Nira', element:'water', label:'Roh Air', symbol:'✧', color:'#59cbe0', other:'Bara' }
};
const now = () => Date.now();

export function mountElementalDuo(root, context) {
  const { code, session, room, role, onBack, toast = () => {} } = context;
  const otherRole = role === 'host' ? 'guest' : 'host';
  const names = { host: room.host?.name || 'Pemain 1', guest: room.guest?.name || 'Pemain 2' };
  const basePath = `roomGames/${code}/${session.sessionId}/elementalDuo`;
  const baseRef = ref(db, basePath);
  const metaRef = ref(db, `${basePath}/meta`);
  const ownPlayerRef = ref(db, `${basePath}/players/${role}`);
  let data = {};
  let localPlayer = createElementalPlayer(role);
  let remoteRender = { x: 112, y: 468, dir: -1 };
  let remoteTarget = { ...remoteRender };
  let currentLevel = 1;
  let currentView = '';
  let unsubscribe = null;
  let rafId = 0;
  let lastFrame = 0;
  let lastWriteAt = 0;
  let writingPlayer = false;
  let playerInitStarted = false;
  let localHydrated = false;
  let metaInitStarted = false;
  let readyBusy = false;
  let switchBusy = false;
  let gemBusy = false;
  let advanceBusy = false;
  let destroyed = false;
  let canvas = null;
  let ctx = null;
  let localCheckpoint = null;
  const canvasView = { zoom:1, cameraX:0, cameraY:0, viewWidth:ELEMENTAL_WORLD_WIDTH, viewHeight:ELEMENTAL_WORLD_HEIGHT };
  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;
  let canvasNotice = '';
  let noticeUntil = 0;
  let starsEarned = 0;
  const input = { left:false, right:false, jump:false, interact:false, jumpQueued:false, interactQueued:false };
  const keyMap = new Map([
    ['ArrowLeft','left'],['KeyA','left'],['ArrowRight','right'],['KeyD','right'],
    ['ArrowUp','jump'],['KeyW','jump'],['Space','jump'],['KeyE','interact'],['Enter','interact']
  ]);

  function notify(message, type = 'default') {
    canvasNotice = message;
    noticeUntil = now() + 2400;
    const status = root.querySelector('[data-ed-notice]');
    if (status) status.textContent = message;
    if (type === 'error') toast(message, 'error');
  }

  function path(...parts) { return `${basePath}/${parts.join('/')}`; }
  function rolePlayer(roleKey) { return data.players?.[roleKey] || null; }
  function levelData() { return getElementalLevel(Number(data.meta?.level) || 1); }
  function levelState() { return data.levels?.[String(Number(data.meta?.level) || 1)] || {}; }
  function switchIsOn(element) { return Boolean(levelState().switches?.[element]); }
  function gateIsOpen() { return switchIsOn('fire') && switchIsOn('water'); }

  function shell() {
    root.innerHTML = `
      <section class="ed-shell">
        <header class="ed-header">
          <div class="ed-brandline"><span class="ed-brand-dot"></span> DIRI. PLAYROOM DATE <span class="ed-brand-sep">/</span> PETUALANGAN BERDUA</div>
          <div class="ed-title-row"><div><h1>Elemental <em>Duo</em></h1><p>Dua roh kecil, satu perjalanan besar.</p></div><div class="ed-header-side"><span class="ed-room-code">${ESCAPE(code)}</span><button class="ed-back-button" type="button" data-ed-action="back">Kembali</button></div></div>
        </header>
        <section class="ed-panel ed-lobby" data-ed-view="lobby">
          <div class="ed-lobby-art" aria-hidden="true"><div class="ed-orbit ed-orbit-one"></div><div class="ed-orbit ed-orbit-two"></div><div class="ed-lobby-spirit ed-bara">✦</div><div class="ed-lobby-spirit ed-nira">✧</div><span class="ed-art-star star-one">✧</span><span class="ed-art-star star-two">✦</span></div>
          <div class="ed-section-kicker">MISI KALIAN DIMULAI DI SINI</div>
          <h2>Bangunkan kembali<br><em>Jantung Lima Dunia</em></h2>
          <p class="ed-lobby-copy">Bara dan Nira punya kekuatan berbeda. Lewati lava dan air, injak pijakan elemen masing-masing, ambil permata, lalu temukan pintu kalian.</p>
          <div class="ed-player-pair">
            <article class="ed-player-card ed-player-fire"><div class="ed-player-orb">✦</div><div><span>PEMAIN 1 · PEMBUAT SESI</span><strong>${ESCAPE(names.host)}</strong><small>Bara · Roh Bara</small></div><b data-ed-ready="host">Menunggu siap</b></article>
            <article class="ed-player-card ed-player-water"><div class="ed-player-orb">✧</div><div><span>PEMAIN 2 · PASANGAN</span><strong>${ESCAPE(names.guest)}</strong><small>Nira · Roh Air</small><b data-ed-ready="guest">Menunggu siap</b></div></article>
          </div>
          <div class="ed-howto-grid">
            <div><span class="ed-how-icon ed-fire-icon">✦</span><strong>Bara</strong><small>Aman di lava, hindari air, ambil permata bara.</small></div>
            <div><span class="ed-how-icon ed-water-icon">✧</span><strong>Nira</strong><small>Aman di air, hindari lava, ambil permata air.</small></div>
            <div><span class="ed-how-icon ed-gem-icon">◇</span><strong>Kerja sama</strong><small>Tekan kedua pijakan untuk membuka penghalang dan pintu.</small></div>
          </div>
          <button class="ed-primary-button" type="button" data-ed-action="ready">Aku siap bertualang <span>↗</span></button>
          <p class="ed-lobby-note">Petualangan memiliki 50 level dalam 5 dunia. Level berikutnya terbuka otomatis setelah kalian berdua mencapai gerbang.</p>
        </section>
        <section class="ed-panel ed-game-panel" data-ed-view="game" hidden>
          <div class="ed-game-topline"><div><span class="ed-world-label" data-ed-world>HUTAN BERBISIK</span><h2 data-ed-level-title>01 · Jejak Cahaya</h2><p data-ed-level-note>Tekan pijakan elemen dan temukan pintu.</p></div><div class="ed-game-tools"><div class="ed-level-count"><strong data-ed-level-number>01</strong><small>/ 50</small></div><button class="ed-fullscreen-button" type="button" data-ed-action="fullscreen" aria-label="Perbesar arena" title="Perbesar arena">⛶</button></div></div>
          <div class="ed-progress-track"><span data-ed-progress></span></div>
          <div class="ed-hud-row">
            <div class="ed-hud-player"><span class="ed-hud-orb ed-fire-icon">✦</span><span><b>${ESCAPE(names.host)}</b><small data-ed-status="host">Bara · belum tiba</small></span></div>
            <div class="ed-hud-center"><span data-ed-gates>2 simpul belum aktif</span><strong data-ed-shards>◇ 0 / 2</strong></div>
            <div class="ed-hud-player ed-hud-right"><span><b>${ESCAPE(names.guest)}</b><small data-ed-status="guest">Nira · belum tiba</small></span><span class="ed-hud-orb ed-water-icon">✧</span></div>
          </div>
          <div class="ed-canvas-wrap"><canvas class="ed-canvas" width="960" height="560" aria-label="Arena platformer Elemental Duo"></canvas><div class="ed-canvas-notice" data-ed-notice aria-live="polite">Injak pijakan Bara dan Air untuk membuka penghalang.</div></div>
          <div class="ed-touch-controls" aria-label="Kontrol permainan">
            <div class="ed-move-controls"><button type="button" data-ed-control="left" aria-label="Bergerak ke kiri">←</button><button type="button" data-ed-control="right" aria-label="Bergerak ke kanan">→</button></div>
            <div class="ed-action-controls"><button type="button" data-ed-control="interact" class="ed-interact-control">AKSI <small>E</small></button><button type="button" data-ed-control="jump" class="ed-jump-control">LOMPAT <small>SPACE</small></button></div>
          </div>
          <div class="ed-instruction-row"><span>Gerak: A/D atau ←/→ · Lompat: Space · Tekan pijakan sesuai elemen</span><span data-ed-deaths>Jatuh: 0</span></div>
          <div class="ed-bottom-tip"><b>Petunjuk level</b><span data-ed-mechanic>Perhatikan kemampuan masing-masing karakter.</span></div>
        </section>
        <section class="ed-panel ed-finish-panel" data-ed-view="finish" hidden>
          <div class="ed-finish-emblem">✧</div><span class="ed-section-kicker">PETUALANGAN SELESAI</span><h2>Kalian menyatukan<br><em>lima kekuatan dunia.</em></h2><p>Jantung Lima Dunia kembali bercahaya berkat kerja sama Bara dan Nira.</p><div class="ed-finish-stats"><div><strong data-ed-finish-stars>0</strong><small>BINTANG TERKUMPUL</small></div><div><strong data-ed-finish-shards>0</strong><small>SERPihan ENERGI</small></div><div><strong>50</strong><small>LEVEL DITUNTASKAN</small></div></div><button class="ed-primary-button" type="button" data-ed-action="back">Kembali ke ruang <span>♡</span></button></section>
        <footer class="ed-footer"><span>ELEMENTAL DUO · PETUALANGAN ORISINAL DIRI</span><span>50 LEVEL · 5 DUNIA · 2 PEMAIN</span></footer>
      </section>`;
    canvas = root.querySelector('.ed-canvas');
    ctx = canvas.getContext('2d');
    bindControls();
  }

  function showView(view) {
    if (currentView === view) return;
    currentView = view;
    root.querySelectorAll('[data-ed-view]').forEach(element => { element.hidden = element.dataset.edView !== view; });
    if (view === 'game') {
      canvas = root.querySelector('.ed-canvas');
      ctx = canvas?.getContext('2d') || null;
      requestAnimationFrame(resizeCanvasViewport);
      updateHud();
    }
    if (view === 'finish') updateFinish();
  }

  function resizeCanvasViewport() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const aspect = rect.width / rect.height;
    // Keep the world scale uniform. Narrow screens see a closer, camera-followed slice;
    // wide screens retain the complete 960-unit arena.
    const desiredHeight = Math.min(ELEMENTAL_WORLD_HEIGHT, Math.max(400, ELEMENTAL_WORLD_HEIGHT * Math.min(1, aspect / (ELEMENTAL_WORLD_WIDTH / ELEMENTAL_WORLD_HEIGHT))));
    const desiredWidth = desiredHeight * aspect;
    const viewWidth = Math.min(ELEMENTAL_WORLD_WIDTH, Math.max(582, desiredWidth));
    const viewHeight = viewWidth / aspect;
    const backingHeight = Math.max(260, Math.round(canvas.width / aspect));
    if (Math.abs(rect.width - lastCanvasWidth) < 1 && Math.abs(rect.height - lastCanvasHeight) < 1 && canvas.height === backingHeight) return;
    lastCanvasWidth = rect.width;
    lastCanvasHeight = rect.height;
    canvas.width = ELEMENTAL_WORLD_WIDTH;
    canvas.height = backingHeight;
    ctx = canvas.getContext('2d');
    canvasView.zoom = ELEMENTAL_WORLD_WIDTH / viewWidth;
    canvasView.viewWidth = viewWidth;
    canvasView.viewHeight = viewHeight;
  }

  function updateCamera() {
    const host = role === 'host' ? localPlayer : remoteRender;
    const guest = role === 'guest' ? localPlayer : remoteRender;
    const centerX = (Number(host?.x) + Number(guest?.x)) / 2 || 480;
    const centerY = (Number(host?.y) + Number(guest?.y)) / 2 || 468;
    canvasView.cameraX = Math.max(0, Math.min(ELEMENTAL_WORLD_WIDTH - canvasView.viewWidth, centerX - canvasView.viewWidth / 2));
    const maxY = Math.max(0, ELEMENTAL_WORLD_HEIGHT - canvasView.viewHeight);
    canvasView.cameraY = Math.max(0, Math.min(maxY, centerY - canvasView.viewHeight * .62));
  }

  function bindControls() {
    root.addEventListener('click', handleClick);
    root.querySelectorAll('[data-ed-control]').forEach(button => {
      const key = button.dataset.edControl;
      const start = event => {
        event.preventDefault();
        if (key === 'jump') { input.jump = true; input.jumpQueued = true; }
        else if (key === 'interact') { input.interact = true; input.interactQueued = true; }
        else input[key] = true;
        try { button.setPointerCapture?.(event.pointerId); } catch {}
      };
      const stop = event => {
        event.preventDefault();
        if (key === 'jump') input.jump = false;
        else if (key === 'interact') input.interact = false;
        else input[key] = false;
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', stop);
      button.addEventListener('pointercancel', stop);
      button.addEventListener('lostpointercapture', stop);
    });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInput);
    window.addEventListener('resize', resizeCanvasViewport, { passive:true });
    document.addEventListener('fullscreenchange', resizeCanvasViewport);
  }

  function clearInput() {
    input.left = input.right = input.jump = input.interact = false;
  }
  function handleKeyDown(event) {
    if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const key = keyMap.get(event.code);
    if (!key || currentView !== 'game') return;
    event.preventDefault();
    if (key === 'jump' && !input.jump) input.jumpQueued = true;
    if (key === 'interact' && !input.interact) input.interactQueued = true;
    input[key] = true;
  }
  function handleKeyUp(event) {
    const key = keyMap.get(event.code);
    if (key) input[key] = false;
  }

  async function handleClick(event) {
    const action = event.target.closest('[data-ed-action]')?.dataset.edAction;
    if (!action) return;
    if (action === 'fullscreen') {
      const panel = root.querySelector('.ed-game-panel');
      try {
        if (document.fullscreenElement) {
          if (document.exitFullscreen) await document.exitFullscreen();
        } else if (panel?.requestFullscreen) {
          await panel.requestFullscreen();
        } else {
          notify('Mode layar penuh tidak didukung browser ini.');
          return;
        }
        requestAnimationFrame(resizeCanvasViewport);
      } catch { notify('Browser tidak mengizinkan mode layar penuh.'); }
      return;
    }
    if (action === 'ready') {
      if (readyBusy || localPlayer.ready) return;
      readyBusy = true;
      try {
        await update(ownPlayerRef, { ready:true, updatedAt:now() });
        localPlayer.ready = true;
        notify('Kamu siap! Menunggu pasangan…');
      } catch (error) { notify(`Tidak dapat menyimpan status siap: ${error.message}`, 'error'); }
      finally {
        readyBusy = false;
        if (role === 'host' && data.players?.guest?.ready && data.meta?.phase === 'lobby') void startAdventure();
      }
    }
    if (action === 'back') onBack?.();
  }

  function updateHud() {
    const meta = data.meta || {};
    const level = getElementalLevel(meta.level || 1);
    const players = data.players || {};
    const mine = players[role] || localPlayer;
    const host = players.host || {};
    const guest = players.guest || {};
    const switchesLeft = Number(!switchIsOn('fire')) + Number(!switchIsOn('water'));
    const claimed = Number(Boolean(levelState().gems?.fire)) + Number(Boolean(levelState().gems?.water));
    const setText = (selector, value) => { const el = root.querySelector(selector); if (el) el.textContent = value; };
    setText('[data-ed-world]', level.worldName.toUpperCase());
    setText('[data-ed-level-title]', `${String(level.id).padStart(2,'0')} · ${level.name}`);
    setText('[data-ed-level-note]', level.note);
    setText('[data-ed-level-number]', String(level.id).padStart(2,'0'));
    setText('[data-ed-gates]', switchesLeft ? `Pijakan ${switchIsOn('fire') ? '✓' : '✕'} Bara · ${switchIsOn('water') ? '✓' : '✕'} Air` : 'Penghalang terbuka · cari pintu!');
    setText('[data-ed-shards]', `◇ ${claimed} / 2`);
    setText('[data-ed-status="host"]', host.complete ? 'Bara · tiba di gerbang' : host.ready ? 'Bara · menjelajah' : 'Bara · menunggu');
    setText('[data-ed-status="guest"]', guest.complete ? 'Nira · tiba di gerbang' : guest.ready ? 'Nira · menjelajah' : 'Nira · menunggu');
    setText('[data-ed-deaths]', `Jatuh: ${Number(mine.deaths)||0}`);
    setText('[data-ed-mechanic]', `${level.mechanic}. ${level.tagline}`);
    const progress = root.querySelector('[data-ed-progress]');
    if (progress) progress.style.width = `${(level.id / 50) * 100}%`;
    const readyHost = root.querySelector('[data-ed-ready="host"]');
    const readyGuest = root.querySelector('[data-ed-ready="guest"]');
    if (readyHost) readyHost.textContent = host.ready ? 'Siap ✓' : 'Menunggu siap';
    if (readyGuest) readyGuest.textContent = guest.ready ? 'Siap ✓' : 'Menunggu siap';
    const readyButton = root.querySelector('[data-ed-action="ready"]');
    if (readyButton) {
      readyButton.disabled = Boolean(mine.ready);
      readyButton.innerHTML = mine.ready ? 'Kamu sudah siap ✓ <span>♡</span>' : 'Aku siap bertualang <span>↗</span>';
    }
    const notice = root.querySelector('[data-ed-notice]');
    if (notice && canvasNotice && now() < noticeUntil) notice.textContent = canvasNotice;
  }

  function updateFinish() {
    const results = data.meta?.results || {};
    const totalStars = Object.values(results).reduce((sum, item) => sum + Math.min(3, Number(item?.stars)||0), 0);
    const levels = data.levels || {};
    const totalShards = Object.values(levels).reduce((sum, item) => sum + Number(Boolean(item?.gems?.fire)) + Number(Boolean(item?.gems?.water)), 0);
    const setText = (selector, value) => { const el = root.querySelector(selector); if (el) el.textContent = value; };
    setText('[data-ed-finish-stars]', `${totalStars} / 150`);
    setText('[data-ed-finish-shards]', `${totalShards} / 100`);
  }

  async function initialiseMeta() {
    if (metaInitStarted || role !== 'host') return;
    metaInitStarted = true;
    try {
      await runTransaction(metaRef, current => current || {
        phase:'lobby', level:1, startedAt:now(), createdAt:now(), transitioning:false, results:{}
      });
    } catch (error) { notify(`Gagal menyiapkan petualangan: ${error.message}`, 'error'); }
  }

  async function initialisePlayer() {
    if (playerInitStarted || data.players?.[role]) return;
    playerInitStarted = true;
    try { await set(ownPlayerRef, createElementalPlayer(role)); }
    catch (error) { playerInitStarted = false; notify(`Gagal menyiapkan karakter: ${error.message}`, 'error'); }
  }

  function updateViewFromData() {
    const meta = data.meta;
    if (!meta) { showView('lobby'); return; }
    const nextLevel = Math.max(1, Math.min(50, Number(meta.level) || 1));
    if (nextLevel !== currentLevel) {
      currentLevel = nextLevel;
      localPlayer = createElementalPlayer(role, data.players?.[role], currentLevel);
      localHydrated = true;
      localCheckpoint = null;
      notify(`Level ${String(currentLevel).padStart(2,'0')} terbuka: ${getElementalLevel(currentLevel).name}`);
    } else if (data.players?.[role] && !localHydrated) {
      localPlayer = createElementalPlayer(role, data.players[role], currentLevel);
      localHydrated = true;
    }
    if (meta.phase === 'complete') {
      showView('finish');
      return;
    }
    if (meta.phase === 'playing') {
      showView('game');
      updateHud();
      if (role === 'host') void coordinateProgress();
      return;
    }
    showView('lobby');
    updateHud();
    if (role === 'host' && data.players?.host?.ready && data.players?.guest?.ready && !readyBusy) {
      void startAdventure();
    }
  }

  async function startAdventure() {
    if (readyBusy || data.meta?.phase !== 'lobby') return;
    readyBusy = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'lobby') return;
        return { ...current, phase:'playing', startedAt:now(), transitioning:false };
      });
    } catch (error) { notify(`Tidak dapat memulai petualangan: ${error.message}`, 'error'); }
    finally { readyBusy = false; }
  }

  async function coordinateProgress() {
    if (advanceBusy || data.meta?.transitioning) return;
    const level = Number(data.meta?.level) || 1;
    const host = data.players?.host;
    const guest = data.players?.guest;
    if (!host?.complete || !guest?.complete) return;
    advanceBusy = true;
    try {
      const lock = await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing' || Number(current.level) !== level || current.transitioning) return;
        return { ...current, transitioning:true };
      });
      if (!lock.committed) return;
      const gemState = data.levels?.[String(level)]?.gems || {};
      const shards = Number(Boolean(gemState.fire)) + Number(Boolean(gemState.water));
      const deaths = (Number(host.levelDeaths)||0) + (Number(guest.levelDeaths)||0);
      const stars = getElementalStars({ deaths, shards });
      const result = { stars, shards, deaths, completedAt:now() };
      const patch = { [`meta/results/${level}`]:result };
      if (level >= 50) {
        patch['meta/phase'] = 'complete';
        patch['meta/transitioning'] = false;
        patch['meta/completedAt'] = now();
      } else {
        const nextLevel = level + 1;
        patch['meta/level'] = nextLevel;
        patch['meta/phase'] = 'playing';
        patch['meta/startedAt'] = now();
        patch['meta/transitioning'] = false;
        patch['players/host'] = createElementalPlayer('host', { ready:true, deaths:Number(host.deaths)||0, levelDeaths:0, shards:Number(host.shards)||0 }, nextLevel);
        patch['players/guest'] = createElementalPlayer('guest', { ready:true, deaths:Number(guest.deaths)||0, levelDeaths:0, shards:Number(guest.shards)||0 }, nextLevel);
      }
      await update(baseRef, patch);
    } catch (error) {
      notify(`Tidak dapat membuka level berikutnya: ${error.message}`, 'error');
      try { await update(metaRef, { transitioning:false }); } catch {}
    } finally { advanceBusy = false; }
  }

  function saveLocalPlayer(force = false) {
    if (writingPlayer || !data.meta || data.meta.phase !== 'playing') return;
    if (!force && now() - lastWriteAt < 115) return;
    lastWriteAt = now();
    writingPlayer = true;
    const payload = {
      x:Math.round(localPlayer.x*10)/10, y:Math.round(localPlayer.y*10)/10,
      vx:Math.round(localPlayer.vx*10)/10, vy:Math.round(localPlayer.vy*10)/10,
      dir:localPlayer.dir, grounded:Boolean(localPlayer.grounded), ready:true,
      complete:Boolean(localPlayer.complete), deaths:Number(localPlayer.deaths)||0,
      levelDeaths:Number(localPlayer.levelDeaths)||0, shards:Number(localPlayer.shards)||0, updatedAt:now()
    };
    set(ownPlayerRef, payload).catch(error => notify(`Sinkronisasi karakter gagal: ${error.message}`, 'error')).finally(() => { writingPlayer = false; });
  }

  function resetAfterHit() {
    const level = levelData();
    const spawn = localCheckpoint || level.spawn[role];
    localPlayer.x = spawn.x;
    localPlayer.y = spawn.y;
    localPlayer.vx = localPlayer.vy = 0;
    localPlayer.grounded = false;
    localPlayer.deaths = (Number(localPlayer.deaths)||0) + 1;
    localPlayer.levelDeaths = (Number(localPlayer.levelDeaths)||0) + 1;
    localPlayer.complete = false;
    notify('Ups! Coba jalur yang lain. Kamu kembali ke titik aman.');
    saveLocalPlayer(true);
  }

  function attemptSwitch(forcedPlate = null) {
    if (switchBusy || localPlayer.complete || data.meta?.phase !== 'playing') return;
    const level = levelData();
    const nearby = forcedPlate || level.switches.find(item => Math.hypot(localPlayer.x-item.x, (localPlayer.y-3)-item.y) < 62);
    if (!nearby) { notify('Dekati pijakan elemen untuk mengaktifkannya.'); return; }
    if (nearby.element !== CHARACTER[role].element) {
      if (!forcedPlate) notify(nearby.element === 'fire' ? 'Pijakan ini hanya untuk Bara.' : 'Pijakan ini hanya untuk Nira.');
      return;
    }
    if (switchIsOn(nearby.element)) return;
    switchBusy = true;
    runTransaction(ref(db, path('levels', String(currentLevel), 'switches', nearby.element)), value => value === true ? undefined : true)
      .then(result => { if (result.committed) notify(`Pijakan ${nearby.element === 'fire' ? 'Bara' : 'Air'} aktif! Penghalang terbuka sebagian.`); })
      .catch(error => notify(`Pijakan gagal diaktifkan: ${error.message}`, 'error'))
      .finally(() => { switchBusy = false; });
  }

  function checkPressurePlate() {
    if (switchBusy || !localPlayer.grounded || localPlayer.complete) return;
    const element = CHARACTER[role].element;
    if (switchIsOn(element)) return;
    const plate = levelData().switches.find(item => item.element === element && Math.abs(localPlayer.x - item.x) < 27 && localPlayer.y + 17 >= 512);
    if (plate) attemptSwitch(plate);
  }

  function collectNearbyGem() {
    if (gemBusy || localPlayer.complete) return;
    const gem = levelData().gems.find(item => item.element === CHARACTER[role].element && Math.hypot(localPlayer.x-item.x, localPlayer.y-item.y) < 30);
    if (!gem || levelState().gems?.[gem.element]) return;
    gemBusy = true;
    runTransaction(ref(db, path('levels', String(currentLevel), 'gems', gem.element)), value => value === true ? undefined : true)
      .then(result => {
        if (result.committed) {
          localPlayer.shards = (Number(localPlayer.shards)||0) + 1;
          notify('Serpihan energi terkumpul! ◇');
          saveLocalPlayer(true);
        }
      })
      .catch(error => notify(`Serpihan gagal disimpan: ${error.message}`, 'error'))
      .finally(() => { gemBusy = false; });
  }

  function physics(dt) {
    if (!data.meta || data.meta.phase !== 'playing' || localPlayer.complete) return;
    const level = levelData();
    const direction = Number(input.right) - Number(input.left);
    const maxSpeed = ELEMENTAL_MOVE_SPEED + (level.modifier === 'wind' ? 28 : 0);
    if (direction) {
      localPlayer.vx = direction * maxSpeed;
      localPlayer.dir = direction;
    } else {
      const friction = level.modifier === 'slippery' ? 0.94 : 0.78;
      localPlayer.vx *= Math.pow(friction, dt * 60);
      if (Math.abs(localPlayer.vx) < 3) localPlayer.vx = 0;
    }

    if (input.jumpQueued && localPlayer.grounded) {
      localPlayer.vy = -(level.modifier === 'bouncy' ? ELEMENTAL_JUMP_SPEED * 1.08 : ELEMENTAL_JUMP_SPEED);
      localPlayer.grounded = false;
    }
    input.jumpQueued = false;
    if (input.interactQueued) attemptSwitch();
    input.interactQueued = false;

    const halfW = 14;
    const halfH = 17;
    localPlayer.x += localPlayer.vx * dt;
    localPlayer.x = Math.max(halfW + 3, Math.min(ELEMENTAL_WORLD_WIDTH - halfW - 3, localPlayer.x));
    for (const platform of level.platforms) {
      const body = { x:localPlayer.x-halfW, y:localPlayer.y-halfH+3, w:halfW*2, h:halfH*2-3 };
      if (!rectsOverlap(body, platform)) continue;
      const previousX = localPlayer.x - localPlayer.vx * dt;
      if (localPlayer.vx > 0 && previousX + halfW <= platform.x + 4) localPlayer.x = platform.x - halfW;
      else if (localPlayer.vx < 0 && previousX - halfW >= platform.x + platform.w - 4) localPlayer.x = platform.x + platform.w + halfW;
      localPlayer.vx = 0;
    }
    if (!gateIsOpen() && level.gate) {
      const gateLaneOverlap = localPlayer.x + halfW > level.gate.x && localPlayer.x - halfW < level.gate.x + level.gate.w;
      if (gateLaneOverlap) {
        const previousX = localPlayer.x - localPlayer.vx * dt;
        const cameFromLeft = previousX <= level.gate.x + level.gate.w / 2;
        localPlayer.x = cameFromLeft ? level.gate.x - halfW : level.gate.x + level.gate.w + halfW;
        localPlayer.vx = 0;
      }
    }

    const previousBottom = localPlayer.y + halfH;
    localPlayer.vy += ELEMENTAL_GRAVITY * dt * (level.modifier === 'wind' ? 0.98 : 1);
    localPlayer.y += localPlayer.vy * dt;
    localPlayer.grounded = false;
    for (const platform of [...level.platforms, { x:0, y:520, w:ELEMENTAL_WORLD_WIDTH, h:50 }]) {
      const horizontal = localPlayer.x + halfW > platform.x && localPlayer.x - halfW < platform.x + platform.w;
      const bottom = localPlayer.y + halfH;
      if (horizontal && localPlayer.vy >= 0 && previousBottom <= platform.y + 5 && bottom >= platform.y) {
        localPlayer.y = platform.y - halfH;
        localPlayer.vy = 0;
        localPlayer.grounded = true;
      } else if (horizontal && localPlayer.vy < 0 && localPlayer.y - halfH < platform.y + platform.h && localPlayer.y - halfH > platform.y) {
        localPlayer.y = platform.y + platform.h + halfH;
        localPlayer.vy = 0;
      }
    }

    if (localPlayer.y > 620) resetAfterHit();
    const body = { x:localPlayer.x-halfW, y:localPlayer.y-halfH, w:halfW*2, h:halfH*2 };
    for (const hazard of level.hazards) {
      if (!rectsOverlap(body, hazard)) continue;
      const safeType = CHARACTER[role].element === 'fire' ? 'fire' : 'water';
      if (hazard.type !== safeType) { resetAfterHit(); break; }
    }

    if (localPlayer.x > level.checkpoint.x && !localCheckpoint) {
      localCheckpoint = { x:level.checkpoint.x, y:level.checkpoint.y };
      notify('Titik aman tercapai. Teruskan!');
    }
    checkPressurePlate();
    collectNearbyGem();
    const ownDoor = level.doors?.[CHARACTER[role].element] || level.exit;
    if (gateIsOpen() && rectsOverlap(body, ownDoor) && !localPlayer.complete) {
      localPlayer.complete = true;
      localPlayer.vx = localPlayer.vy = 0;
      notify('Kamu tiba! Tunggu pasangan di gerbang.');
      saveLocalPlayer(true);
    }
    saveLocalPlayer();
  }

  function roundedRect(context, x, y, w, h, radius) {
    const r = Math.min(radius, w/2, h/2);
    context.beginPath();
    context.moveTo(x+r,y); context.arcTo(x+w,y,x+w,y+h,r); context.arcTo(x+w,y+h,x,y+h,r);
    context.arcTo(x,y+h,x,y,r); context.arcTo(x,y,x+w,y,r); context.closePath();
  }

  function drawBackground(level, time) {
    const c = level.colors;
    const gradient = ctx.createLinearGradient(0,0,0,ELEMENTAL_WORLD_HEIGHT);
    gradient.addColorStop(0,c.sky); gradient.addColorStop(1,c.sky2);
    ctx.fillStyle = gradient; ctx.fillRect(0,0,ELEMENTAL_WORLD_WIDTH,ELEMENTAL_WORLD_HEIGHT);
    ctx.save();
    ctx.globalAlpha = .18;
    for (let i=0;i<7;i++) {
      const x = ((i*177 + (time*.008*(i%2?1:-1))) % 1120) - 80;
      const y = 95 + (i%3)*70;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x,y,28+(i%3)*8,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = c.far;
    ctx.beginPath(); ctx.moveTo(0,360);
    for (let x=0;x<=ELEMENTAL_WORLD_WIDTH;x+=80) ctx.quadraticCurveTo(x+40,285+(x%160)*.12,x+80,360);
    ctx.lineTo(ELEMENTAL_WORLD_WIDTH,520); ctx.lineTo(0,520); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.near;
    ctx.beginPath(); ctx.moveTo(0,430);
    for (let x=0;x<=ELEMENTAL_WORLD_WIDTH;x+=90) ctx.quadraticCurveTo(x+45,390+(x%180)*.08,x+90,430);
    ctx.lineTo(ELEMENTAL_WORLD_WIDTH,520); ctx.lineTo(0,520); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.ground; ctx.fillRect(0,520,ELEMENTAL_WORLD_WIDTH,40);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0,520,ELEMENTAL_WORLD_WIDTH,4);
    ctx.save(); ctx.globalAlpha=.22;
    for(let i=0;i<34;i++){
      const x=(i*83+23)%960, y=80+(i*47)%360;
      ctx.fillStyle=i%2?'#fff':'#ffe7b6'; ctx.beginPath(); ctx.arc(x,y,1.2+(i%3),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function drawPlatforms(level) {
    const c = level.colors;
    for (const p of level.platforms) {
      ctx.fillStyle = p.kind === 'crystal' ? 'rgba(230,250,255,.88)' : c.ground;
      roundedRect(ctx,p.x,p.y,p.w,p.h,8); ctx.fill();
      ctx.fillStyle = p.kind === 'crystal' ? '#fff' : 'rgba(255,255,255,.28)';
      roundedRect(ctx,p.x+4,p.y+3,p.w-8,3,2); ctx.fill();
      if (p.kind === 'crystal') {
        ctx.fillStyle='rgba(105,203,220,.25)';
        ctx.beginPath(); ctx.moveTo(p.x+16,p.y+2);ctx.lineTo(p.x+26,p.y-10);ctx.lineTo(p.x+36,p.y+2);ctx.fill();
      }
    }
  }

  function drawHazards(level, time) {
    for (const h of level.hazards) {
      const fire = h.type === 'fire';
      const base = fire ? '#dc7959' : '#3e9db8';
      ctx.fillStyle = base; roundedRect(ctx,h.x,h.y,h.w,h.h,7); ctx.fill();
      ctx.save();
      ctx.strokeStyle = fire ? '#ffd08f' : '#c6f7ff'; ctx.lineWidth=3;
      ctx.beginPath();
      for(let x=0;x<=h.w;x+=5){const y=h.y+6+Math.sin((x+time*.09)/12)*3; if(x===0)ctx.moveTo(h.x+x,y);else ctx.lineTo(h.x+x,y);}
      ctx.stroke(); ctx.restore();
      ctx.globalAlpha=.38;
      ctx.fillStyle = fire ? '#ffdf9d' : '#d5fbff';
      for(let i=0;i<3;i++) { const x=h.x+12+i*(h.w-24)/2; const y=h.y+17+Math.sin(time*.003+i)*3; ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill(); }
      ctx.globalAlpha=1;
    }
  }

  function drawSwitches(level, time) {
    for (const item of level.switches) {
      const active = switchIsOn(item.element);
      const fire = item.element === 'fire';
      const color = fire ? '#ff995c' : '#54c9df';
      const w = item.w || 52;
      ctx.save(); ctx.translate(item.x, item.y);
      ctx.shadowColor=color; ctx.shadowBlur=active?20:8;
      ctx.fillStyle=active ? color : (fire ? '#854b43' : '#376d83');
      roundedRect(ctx,-w/2,-5,w,10,5); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle=active ? '#fff' : 'rgba(255,255,255,.78)';
      ctx.fillRect(-w/2+7,-2,w-14,2);
      ctx.strokeStyle=color; ctx.lineWidth=2;
      roundedRect(ctx,-w/2-3,-8,w+6,16,6); ctx.stroke();
      ctx.fillStyle=color; ctx.font='bold 11px system-ui'; ctx.textAlign='center';
      ctx.fillText(fire?'BARA':'AIR',0,-15);
      if (!active) { ctx.globalAlpha=.6; ctx.beginPath(); ctx.arc(0,-2,15+Math.sin(time*.005)*2,Math.PI,Math.PI*2); ctx.stroke(); }
      ctx.restore();
    }
  }

  function drawGems(level, time) {
    const gems = levelState().gems || {};
    for (const gem of level.gems) {
      if (gems[gem.element]) continue;
      const fire = gem.element === 'fire';
      const color = fire ? '#ffb05f' : '#8ce9f3';
      const pulse = 1 + Math.sin(time*.006+(fire?0:1))*0.12;
      ctx.save();ctx.translate(gem.x,gem.y);ctx.scale(pulse,pulse);
      ctx.shadowColor=color;ctx.shadowBlur=20;ctx.fillStyle=color;
      ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(10,0);ctx.lineTo(0,13);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.78)';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(4,0);ctx.lineTo(0,7);ctx.lineTo(-3,0);ctx.fill();ctx.restore();
    }
  }

  function drawExit(level, time) {
    const open = gateIsOpen();
    if (level.gate && !open) {
      const gate = level.gate;
      ctx.save();
      ctx.shadowColor='rgba(88,69,111,.32)'; ctx.shadowBlur=12;
      const g = ctx.createLinearGradient(gate.x,0,gate.x+gate.w,0);
      g.addColorStop(0,'#6e617f'); g.addColorStop(.5,'#d9c9e8'); g.addColorStop(1,'#6e617f');
      ctx.fillStyle=g; roundedRect(ctx,gate.x,gate.y,gate.w,gate.h,8); ctx.fill();
      ctx.shadowBlur=0; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3;
      for(let y=gate.y+12;y<gate.y+gate.h-8;y+=25){ctx.beginPath();ctx.moveTo(gate.x+3,y);ctx.lineTo(gate.x+gate.w-3,y);ctx.stroke();}
      ctx.fillStyle='#fff4c8'; ctx.font='bold 17px system-ui'; ctx.textAlign='center'; ctx.fillText('✦',gate.x+gate.w/2,gate.y-12);
      ctx.restore();
    }
    const doors = level.doors || { fire:level.exit, water:level.exit };
    for (const element of ['fire','water']) {
      const door = doors[element];
      const fire = element === 'fire';
      const color = fire ? '#ff9b5d' : '#58cde2';
      const player = data.players?.[fire?'host':'guest'];
      ctx.save(); ctx.translate(door.x+door.w/2,door.y+door.h/2);
      ctx.shadowColor=open?color:'rgba(45,49,74,.18)'; ctx.shadowBlur=open?24:4;
      ctx.fillStyle=open?(fire?'rgba(255,187,125,.32)':'rgba(116,228,240,.32)'):'rgba(48,44,71,.22)';
      roundedRect(ctx,-door.w/2,-door.h/2,door.w,door.h,15); ctx.fill();
      ctx.shadowBlur=0; ctx.strokeStyle=open?color:'rgba(255,255,255,.55)'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(-door.w/2+3,door.h/2); ctx.lineTo(-door.w/2+3,0); ctx.arc(0,0,door.w/2-3,Math.PI,0); ctx.lineTo(door.w/2-3,door.h/2); ctx.stroke();
      ctx.fillStyle=open?color:'rgba(255,255,255,.65)'; ctx.font='bold 19px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(fire?'✦':'✧',0,3);
      ctx.fillStyle='#fff'; ctx.font='800 9px system-ui'; ctx.fillText(fire?'BARA':'AIR',0,door.h/2+13);
      if (player?.complete) { ctx.fillStyle='#fff4b3'; ctx.font='bold 15px system-ui'; ctx.fillText('✓',0,-door.h/2-10); }
      ctx.restore();
    }
  }

  function drawCheckpoint(level) {
    ctx.save();ctx.translate(level.checkpoint.x, level.checkpoint.y);
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(0,18);ctx.stroke();
    ctx.fillStyle='#fff4be';ctx.beginPath();ctx.moveTo(1,-26);ctx.lineTo(21,-18);ctx.lineTo(1,-9);ctx.closePath();ctx.fill();ctx.restore();
  }

  function drawSpirit(player, element, isRemote = false, time = 0) {
    if (!player) return;
    const fire = element === 'fire';
    const x = player.x, y = player.y + Math.sin(time*.008+(fire?0:1))*1.8;
    ctx.save();ctx.translate(x,y);ctx.scale(player.dir || 1,1);
    ctx.globalAlpha = isRemote ? .92 : 1;
    ctx.shadowColor = fire ? '#ff9860' : '#5bd1e5';ctx.shadowBlur=14;
    if (fire) {
      const grad=ctx.createLinearGradient(0,-22,0,20);grad.addColorStop(0,'#fff1af');grad.addColorStop(.48,'#ffae67');grad.addColorStop(1,'#f16c57');
      ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(-14,8);ctx.quadraticCurveTo(-19,-5,-8,-16);ctx.quadraticCurveTo(-7,-28,1,-34);ctx.quadraticCurveTo(3,-23,10,-19);ctx.quadraticCurveTo(20,-8,13,8);ctx.quadraticCurveTo(10,19,0,19);ctx.quadraticCurveTo(-12,19,-14,8);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.moveTo(-3,-2);ctx.quadraticCurveTo(-4,-12,3,-19);ctx.quadraticCurveTo(3,-7,8,-2);ctx.quadraticCurveTo(7,8,0,10);ctx.quadraticCurveTo(-6,8,-3,-2);ctx.fill();
    } else {
      const grad=ctx.createLinearGradient(-10,-22,10,22);grad.addColorStop(0,'#e8ffff');grad.addColorStop(.45,'#8de5ef');grad.addColorStop(1,'#3aa9ca');
      ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(0,-31);ctx.quadraticCurveTo(7,-17,16,-4);ctx.quadraticCurveTo(21,11,8,19);ctx.quadraticCurveTo(-1,24,-11,16);ctx.quadraticCurveTo(-21,6,-12,-7);ctx.quadraticCurveTo(-5,-18,0,-31);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.56)';ctx.beginPath();ctx.ellipse(-5,-3,3,8,-.4,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    ctx.fillStyle='#55465a';ctx.beginPath();ctx.ellipse(-5,1,2,3.4,0,0,Math.PI*2);ctx.ellipse(5,1,2,3.4,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(87,55,75,.65)';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,6,3,0.15,Math.PI-.15);ctx.stroke();
    ctx.fillStyle=fire?'#ffd6ae':'#d4fbff';ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(-12,-17,3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    if (player.complete) { ctx.fillStyle='#fff4b3';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText('✓',0,-43); }
    ctx.restore();
  }

  function drawScene(time) {
    if (!ctx || currentView !== 'game') return;
    resizeCanvasViewport();
    updateCamera();
    const level = levelData();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    const z = canvasView.zoom;
    ctx.setTransform(z,0,0,z,-canvasView.cameraX*z,-canvasView.cameraY*z);
    drawBackground(level,time);
    drawPlatforms(level);
    drawHazards(level,time);
    drawCheckpoint(level);
    drawGems(level,time);
    drawSwitches(level,time);
    drawExit(level,time);
    const host = role === 'host' ? localPlayer : remoteRender;
    const guest = role === 'guest' ? localPlayer : remoteRender;
    drawSpirit(host,'fire',role!=='host',time);
    drawSpirit(guest,'water',role!=='guest',time);
    if (!gateIsOpen()) {
      ctx.fillStyle='rgba(45,46,65,.76)';ctx.font='800 15px system-ui';ctx.textAlign='center';ctx.fillText('INJAK KEDUA PIJAKAN ELEMEN',canvasView.cameraX+canvasView.viewWidth/2,canvasView.cameraY+28);
    } else if (!localPlayer.complete) {
      ctx.fillStyle='rgba(45,46,65,.72)';ctx.font='800 14px system-ui';ctx.textAlign='center';ctx.fillText(`MENUJU PINTU ${CHARACTER[role].element==='fire'?'BARA':'AIR'}`,canvasView.cameraX+canvasView.viewWidth/2,canvasView.cameraY+28);
    }
    if (canvasNotice && now() < noticeUntil) {
      const noticeY = canvasView.cameraY + canvasView.viewHeight - 38;
      roundedRect(ctx,canvasView.cameraX+canvasView.viewWidth/2-180,noticeY,360,30,12);
      ctx.fillStyle='rgba(48,40,60,.72)';ctx.fill();
      ctx.fillStyle='#fff';ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.fillText(canvasNotice.slice(0,52),canvasView.cameraX+canvasView.viewWidth/2,noticeY+19);
    }
    ctx.restore();
  }

  function frame(timestamp) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min(.05, (timestamp-lastFrame)/1000) : 0;
    lastFrame = timestamp;
    if (data.meta?.phase === 'playing' && currentView === 'game') {
      physics(dt);
      const target = data.players?.[otherRole];
      if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
        remoteTarget = { x:target.x, y:target.y, dir:target.dir || (otherRole==='guest'?-1:1), complete:Boolean(target.complete) };
      }
      remoteRender.x += (remoteTarget.x-remoteRender.x)*.24;
      remoteRender.y += (remoteTarget.y-remoteRender.y)*.24;
      remoteRender.dir = remoteTarget.dir;
      remoteRender.complete = remoteTarget.complete;
      updateHud();
    }
    drawScene(timestamp);
    rafId = requestAnimationFrame(frame);
  }

  function handleSnapshot(snapshot) {
    data = snapshot.val() || {};
    if (!data.meta) void initialiseMeta();
    if (!data.players?.[role]) void initialisePlayer();
    const other = data.players?.[otherRole];
    if (other && Number.isFinite(other.x) && Number.isFinite(other.y)) {
      remoteTarget = { x:other.x, y:other.y, dir:other.dir || (otherRole==='guest'?-1:1), complete:Boolean(other.complete) };
      if (!lastFrame) remoteRender = { ...remoteTarget };
    }
    updateViewFromData();
  }

  shell();
  unsubscribe = onValue(baseRef, handleSnapshot, error => notify(`Koneksi permainan terputus: ${error.message}`, 'error'));
  rafId = requestAnimationFrame(frame);

  return {
    destroy() {
      destroyed = true;
      if (unsubscribe) unsubscribe();
      if (rafId) cancelAnimationFrame(rafId);
      root.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInput);
      window.removeEventListener('resize', resizeCanvasViewport);
      document.removeEventListener('fullscreenchange', resizeCanvasViewport);
      clearInput();
    }
  };
}
