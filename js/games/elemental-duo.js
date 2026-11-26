import { db, ref, set, update, onValue, runTransaction } from '../firebase.js';
import {
  ELEMENTAL_WORLD_WIDTH, ELEMENTAL_WORLD_HEIGHT, ELEMENTAL_FLOOR_Y, ELEMENTAL_MAP_VERSION,
  ELEMENTAL_GRAVITY, ELEMENTAL_MOVE_SPEED, ELEMENTAL_JUMP_SPEED,
  createElementalPlayer, getElementalLevel, getElementalStars, rectsOverlap,
  getElementalViewport, getElementalCameraTarget,
  getElementalPlatformState, getElementalHazardState,
  getElementalCurrentState, getElementalWindState, getElementalSurfaceFriction
} from './elemental-duo-logic.js?v=0.38.0';

const ESCAPE = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const CHARACTER = {
  host: { name:'Bara', element:'fire', label:'Roh Bara', symbol:'✦', color:'#ff985b', other:'Nira' },
  guest: { name:'Nira', element:'water', label:'Roh Air', symbol:'✧', color:'#59cbe0', other:'Bara' }
};
let elementalServerTimeOffset = 0;
const now = () => Date.now() + elementalServerTimeOffset;

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
  let remoteRender = createElementalPlayer(otherRole);
  let remoteTarget = { ...remoteRender };
  let currentLevel = 1;
  let currentView = '';
  let unsubscribe = null;
  let unsubscribeServerClock = null;
  let serverClockReady = false;
  let resolveServerClockReady = () => {};
  const serverClockReadyPromise = new Promise(resolve => { resolveServerClockReady = resolve; });
  let rafId = 0;
  let lastFrame = 0;
  let lastHudFrameAt = 0;
  let lastWriteAt = 0;
  let writingPlayer = false;
  let pendingPlayerPayload = null;
  let playerWriteRetryTimer = 0;
  let playerInitStarted = false;
  let localHydrated = false;
  let metaInitStarted = false;
  let readyBusy = false;
  let switchBusy = false;
  let valveBusy = false;
  let windLeverBusy = false;
  let gemBusy = false;
  let advanceBusy = false;
  let destroyed = false;
  let canvas = null;
  let ctx = null;
  let localCheckpoint = null;
  const canvasView = { zoom:1, cameraX:0, cameraY:0, viewWidth:ELEMENTAL_WORLD_WIDTH, viewHeight:ELEMENTAL_WORLD_HEIGHT, offsetX:0, offsetY:0 };
  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;
  let canvasNotice = '';
  let analogHandlers = null;
  let lastHudRefreshAt = 0;
  let viewportMeasureForce = false;
  let viewportResizeFrame = 0;
  let gamePanel = null;
  let gamePanelPlaceholder = null;
  let displayMode = 'portrait';
  let controlMode = 'buttons';
  let analogPointerId = null;
  let coyoteTimeRemaining = 0;
  let jumpBufferRemaining = 0;
  let noticeUntil = 0;
  let starsEarned = 0;
  const input = { left:false, right:false, jump:false, interact:false, jumpQueued:false, interactQueued:false };
  const keyMap = new Map([
    ['ArrowLeft','left'],['KeyA','left'],['ArrowRight','right'],['KeyD','right'],
    ['ArrowUp','jump'],['KeyW','jump'],['Space','jump'],['KeyE','interact'],['Enter','interact']
  ]);

  function queryUI(selector) {
    return root.querySelector(selector) || gamePanel?.querySelector(selector) || null;
  }

  function queryUIAll(selector) {
    const matches = Array.from(root.querySelectorAll(selector));
    if (gamePanel && !root.contains(gamePanel)) {
      if (gamePanel.matches(selector)) matches.push(gamePanel);
      matches.push(...gamePanel.querySelectorAll(selector));
    }
    return matches;
  }

  function activateFullPagePortal() {
    if (!gamePanel || gamePanel.parentElement === document.body) return;
    const parent = gamePanel.parentNode;
    if (parent) {
      gamePanelPlaceholder = document.createComment('elemental-duo-panel-placeholder');
      parent.insertBefore(gamePanelPlaceholder, gamePanel);
    }
    document.body.appendChild(gamePanel);
    document.documentElement.classList.add('ed-fullpage-active');
    document.body.classList.add('ed-fullpage-active');
    gamePanel.classList.add('ed-fullpage-fallback');
  }

  function restoreFullPagePortal() {
    if (gamePanelPlaceholder?.parentNode && gamePanel) {
      gamePanelPlaceholder.parentNode.insertBefore(gamePanel, gamePanelPlaceholder);
      gamePanelPlaceholder.remove();
    }
    gamePanelPlaceholder = null;
    gamePanel?.classList.remove('ed-fullpage-fallback');
    document.body.classList.remove('ed-fullpage-active');
    document.documentElement.classList.remove('ed-fullpage-active');
  }

  function setControlMode(mode) {
    controlMode = mode === 'analog' ? 'analog' : 'buttons';
    if (gamePanel) gamePanel.dataset.controlMode = controlMode;
    const button = queryUI('[data-ed-action="toggle-controls"]');
    if (button) {
      button.setAttribute('aria-pressed', String(controlMode === 'analog'));
      button.setAttribute('aria-label', controlMode === 'analog' ? 'Ganti ke kontrol tombol' : 'Ganti ke kontrol analog');
      button.title = controlMode === 'analog' ? 'Ganti ke kontrol tombol' : 'Ganti ke kontrol analog';
      const label = button.querySelector('[data-ed-control-mode-label]');
      if (label) label.textContent = controlMode === 'analog' ? 'Analog' : 'Tombol';
    }
    // Use the actual hidden state as well as CSS so one control system can
    // never remain on top of the other after entering native fullscreen.
    const moveControls = queryUI('.ed-move-controls');
    const analogPad = queryUI('[data-ed-analog-pad]');
    if (moveControls) {
      moveControls.hidden = controlMode === 'analog';
      moveControls.style.setProperty('display', controlMode === 'analog' ? 'none' : 'flex', 'important');
    }
    if (analogPad) {
      analogPad.hidden = controlMode !== 'analog';
      analogPad.style.setProperty('display', controlMode === 'analog' ? 'grid' : 'none', 'important');
    }
    resetAnalogStick();
  }

  function resetAnalogStick() {
    input.left = false;
    input.right = false;
    analogPointerId = null;
    const knob = queryUI('[data-ed-analog-knob]');
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
  }

  function updateAnalogStick(event) {
    const pad = queryUI('[data-ed-analog-pad]');
    const knob = queryUI('[data-ed-analog-knob]');
    if (!pad || analogPointerId !== event.pointerId) return;
    const rect = pad.getBoundingClientRect();
    const radius = Math.max(24, Math.min(rect.width, rect.height) * .34);
    const dx = Math.max(-1, Math.min(1, (event.clientX - (rect.left + rect.width/2)) / radius));
    // The virtual stick is movement-only, matching a conventional platformer:
    // horizontal input walks left/right; jumping remains a separate jump button.
    // Vertical finger movement is intentionally ignored and never queues a jump.
    const x = dx;
    input.left = x < -.22;
    input.right = x > .22;
    if (knob) knob.style.transform = `translate(calc(-50% + ${x*radius*.72}px), -50%)`;
  }

  function bindAnalogStick() {
    const pad = queryUI('[data-ed-analog-pad]');
    if (!pad) return;
    const onDown = event => {
      if (controlMode !== 'analog' || pad.hidden) return;
      if (analogPointerId !== null) return;
      event.preventDefault();
      analogPointerId = event.pointerId;
      try { pad.setPointerCapture(event.pointerId); } catch {}
      updateAnalogStick(event);
    };
    const onMove = event => {
      if (analogPointerId !== event.pointerId) return;
      event.preventDefault();
      updateAnalogStick(event);
    };
    const onUp = event => {
      if (analogPointerId !== event.pointerId) return;
      event.preventDefault();
      resetAnalogStick();
    };
    pad.addEventListener('pointerdown', onDown, { passive:false });
    // Listen on window as a fallback for mobile browsers that retarget or
    // cancel pointer capture when their fullscreen chrome changes.
    window.addEventListener('pointermove', onMove, { passive:false });
    window.addEventListener('pointerup', onUp, { passive:false });
    window.addEventListener('pointercancel', onUp, { passive:false });
    analogHandlers = { pad, onDown, onMove, onUp };
  }

  function notify(message, type = 'default') {
    canvasNotice = message;
    noticeUntil = now() + 2400;
    const status = queryUI('[data-ed-notice]');
    if (status) status.textContent = message;
    if (type === 'error') toast(message, 'error');
  }

  function path(...parts) { return `${basePath}/${parts.join('/')}`; }
  function rolePlayer(roleKey) { return data.players?.[roleKey] || null; }
  function levelData() { return getElementalLevel(Number(data.meta?.level) || 1); }
  function levelState() { return data.levels?.[String(Number(data.meta?.level) || 1)] || {}; }
  function switchIsOn(element) { return Boolean(levelState().switches?.[element]); }
  function valveIsOpen(id) { return Boolean(levelState().valves?.[id]); }
  function windLeverIsOn(id) { return Boolean(levelState().windLevers?.[id]); }
  function gateIsOpen() {
    const level = levelData();
    return switchIsOn('fire') && switchIsOn('water') && (level.requiredValves || []).every(valveIsOpen) && (level.requiredWindLevers || []).every(windLeverIsOn);
  }
  function levelElapsedMs() { return Math.max(0, now() - (Number(data.meta?.startedAt) || now())); }

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
          <div class="ed-game-topline"><div><span class="ed-world-label" data-ed-world>HUTAN BERBISIK</span><h2 data-ed-level-title>01 · Jejak Cahaya</h2><p data-ed-level-note>Tekan pijakan elemen dan temukan pintu.</p></div><div class="ed-game-tools"><div class="ed-level-count"><strong data-ed-level-number>01</strong><small>/ 50</small></div><div class="ed-display-modes" role="group" aria-label="Mode tampilan permainan"><button class="ed-mode-button is-active" type="button" data-ed-action="portrait" aria-pressed="true"><span>▯</span><b>Potret</b></button><button class="ed-mode-button" type="button" data-ed-action="fullscreen" aria-label="Layar penuh landscape" title="Layar penuh landscape" aria-pressed="false"><span>⛶</span><b>Layar penuh</b></button><button class="ed-mode-button ed-control-mode-button" type="button" data-ed-action="toggle-controls" aria-label="Ganti ke kontrol analog" aria-pressed="false"><span>◎</span><b data-ed-control-mode-label>Tombol</b></button></div></div></div>
          <div class="ed-progress-track"><span data-ed-progress></span></div>
          <div class="ed-hud-row">
            <div class="ed-hud-player"><span class="ed-hud-orb ed-fire-icon">✦</span><span><b>${ESCAPE(names.host)}</b><small data-ed-status="host">Bara · belum tiba</small></span></div>
            <div class="ed-hud-center"><span data-ed-gates>2 simpul belum aktif</span><strong data-ed-shards>◇ 0 / 2</strong></div>
            <div class="ed-hud-player ed-hud-right"><span><b>${ESCAPE(names.guest)}</b><small data-ed-status="guest">Nira · belum tiba</small></span><span class="ed-hud-orb ed-water-icon">✧</span></div>
          </div>
          <div class="ed-live-notice" data-ed-notice aria-live="polite" hidden></div>
          <div class="ed-rotate-prompt" data-ed-rotate-prompt hidden><div class="ed-rotate-icon">↻</div><strong>Putar perangkat ke samping</strong><span>Mode layar penuh menggunakan posisi landscape agar arena lebih luas.</span><button type="button" data-ed-action="portrait">Kembali ke mode potret</button></div>
          <div class="ed-canvas-wrap"><canvas class="ed-canvas" width="${ELEMENTAL_WORLD_WIDTH}" height="${ELEMENTAL_WORLD_HEIGHT}" aria-label="Arena platformer eksplorasi dua dimensi Elemental Duo"></canvas></div>
          <div class="ed-touch-controls" aria-label="Kontrol permainan">
            <div class="ed-move-controls"><button type="button" data-ed-control="left" aria-label="Bergerak ke kiri">←</button><button type="button" data-ed-control="right" aria-label="Bergerak ke kanan">→</button></div>
            <div class="ed-analog-pad" data-ed-analog-pad role="application" aria-label="Analog virtual untuk bergerak"><div class="ed-analog-ring"><div class="ed-analog-knob" data-ed-analog-knob></div></div><span>GERAK</span></div>
            <div class="ed-action-controls"><button type="button" data-ed-control="interact" class="ed-interact-control" hidden>INTERAKSI <small>E</small></button><button type="button" data-ed-control="jump" class="ed-jump-control">LOMPAT <small>SPACE</small></button></div>
          </div>
          <div class="ed-instruction-row"><span>Gerak: A/D atau ←/→ · Lompat: Space · Tekan pijakan sesuai elemen</span><span data-ed-deaths>Jatuh: 0</span></div>
          <div class="ed-bottom-tip"><b>Petunjuk level</b><span data-ed-mechanic>Perhatikan kemampuan masing-masing karakter.</span></div>
        </section>
        <section class="ed-panel ed-finish-panel" data-ed-view="finish" hidden>
          <div class="ed-finish-emblem">✧</div><span class="ed-section-kicker">PETUALANGAN SELESAI</span><h2>Kalian menyatukan<br><em>lima kekuatan dunia.</em></h2><p>Jantung Lima Dunia kembali bercahaya berkat kerja sama Bara dan Nira.</p><div class="ed-finish-stats"><div><strong data-ed-finish-stars>0</strong><small>BINTANG TERKUMPUL</small></div><div><strong data-ed-finish-shards>0</strong><small>SERPihan ENERGI</small></div><div><strong>50</strong><small>LEVEL DITUNTASKAN</small></div></div><button class="ed-primary-button" type="button" data-ed-action="back">Kembali ke ruang <span>♡</span></button></section>
        <footer class="ed-footer"><span>ELEMENTAL DUO · PETUALANGAN ORISINAL DIRI</span><span>50 LEVEL · 5 DUNIA · 2 PEMAIN</span></footer>
      </section>`;
    gamePanel = root.querySelector('.ed-game-panel');
    canvas = root.querySelector('.ed-canvas');
    ctx = canvas.getContext('2d');
    gamePanel.dataset.controlMode = controlMode;
    bindControls();
    bindAnalogStick();
  }

  function showView(view) {
    if (currentView === view) return;
    if (view !== 'game') restoreFullPagePortal();
    currentView = view;
    document.documentElement.classList.toggle('ed-game-active', view === 'game');
    document.body.classList.toggle('ed-game-active', view === 'game');
    queryUIAll('[data-ed-view]').forEach(element => { element.hidden = element.dataset.edView !== view; });
    if (view === 'game') {
      canvas = queryUI('.ed-canvas');
      ctx = canvas?.getContext('2d') || null;
      scheduleViewportMeasure(true);
      updateHud();
    }
    if (view === 'finish') updateFinish();
  }

  function resizeCanvasViewport(force = false) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const roundedWidth = Math.round(rect.width);
    const roundedHeight = Math.round(rect.height);
    // Ignore small viewport-height oscillations caused by Android browser bars.
    if (!force && lastCanvasWidth && Math.abs(roundedWidth-lastCanvasWidth) < 9 && Math.abs(roundedHeight-lastCanvasHeight) < 22) return;
    const hadViewport = lastCanvasWidth > 0 && lastCanvasHeight > 0;
    const previousCenterX = canvasView.cameraX + canvasView.viewWidth / 2;
    const previousCenterY = canvasView.cameraY + canvasView.viewHeight / 2;
    const viewport = getElementalViewport(rect.width,rect.height);
    const backingHeight = Math.max(260,Math.round(ELEMENTAL_WORLD_WIDTH / viewport.aspect));
    if (canvas.width !== ELEMENTAL_WORLD_WIDTH) canvas.width = ELEMENTAL_WORLD_WIDTH;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    lastCanvasWidth = roundedWidth;
    lastCanvasHeight = roundedHeight;
    ctx = canvas.getContext('2d');
    canvasView.zoom = viewport.zoom;
    canvasView.viewWidth = viewport.viewWidth;
    canvasView.viewHeight = viewport.viewHeight;
    canvasView.offsetX = viewport.offsetX || 0;
    canvasView.offsetY = viewport.offsetY || 0;
    if (hadViewport) {
      // Preserve the viewed world center so resizing cannot snap the camera.
      canvasView.cameraX = Math.max(0,Math.min(ELEMENTAL_WORLD_WIDTH-canvasView.viewWidth,previousCenterX-canvasView.viewWidth/2));
      canvasView.cameraY = Math.max(0,Math.min(ELEMENTAL_WORLD_HEIGHT-canvasView.viewHeight,previousCenterY-canvasView.viewHeight/2));
    } else {
      const target = getElementalCameraTarget(localPlayer,remoteRender,canvasView.viewWidth,canvasView.viewHeight);
      canvasView.cameraX = Math.max(0,Math.min(ELEMENTAL_WORLD_WIDTH-canvasView.viewWidth,target.x));
      canvasView.cameraY = Math.max(0,Math.min(ELEMENTAL_WORLD_HEIGHT-canvasView.viewHeight,target.y));
    }
  }

  function scheduleViewportMeasure(force = false) {
    if (force) viewportMeasureForce = true;
    if (viewportResizeFrame || destroyed) return;
    viewportResizeFrame = requestAnimationFrame(() => {
      viewportResizeFrame = 0;
      updateDisplayModeUI();
      const shouldForce = viewportMeasureForce;
      viewportMeasureForce = false;
      resizeCanvasViewport(shouldForce);
    });
  }

  function updateCamera(dt = 1 / 60) {
    // Every device follows the character it controls. The partner gets a small
    // framing bias, but cannot pull the camera away when the players separate.
    const target = getElementalCameraTarget(localPlayer, remoteRender, canvasView.viewWidth, canvasView.viewHeight);
    const easing = 1 - Math.exp(-12 * Math.max(0, Math.min(0.1, dt)));
    canvasView.cameraX += (target.x - canvasView.cameraX) * easing;
    canvasView.cameraY += (target.y - canvasView.cameraY) * easing;
  }

  function updateDisplayModeUI() {
    const panel = gamePanel || root.querySelector('.ed-game-panel');
    if (!panel) return;
    panel.dataset.displayMode = displayMode;
    queryUIAll('.ed-display-modes [data-ed-action="portrait"], .ed-display-modes [data-ed-action="fullscreen"]').forEach(button => {
      const active = button.dataset.edAction === displayMode;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
    const prompt = panel.querySelector('[data-ed-rotate-prompt]');
    const isLandscape = Boolean(window.matchMedia?.('(orientation: landscape)').matches);
    if (prompt) prompt.hidden = displayMode !== 'fullscreen' || isLandscape;
  }

  async function enterPortraitMode() {
    const panel = gamePanel || root.querySelector('.ed-game-panel');
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch { /* Browser may leave native fullscreen through its own UI. */ }
    try { screen.orientation?.unlock?.(); } catch {}
    restoreFullPagePortal();
    displayMode = 'portrait';
    setControlMode('buttons');
    if (panel) panel.dataset.displayMode = 'portrait';
    updateDisplayModeUI();
    scheduleViewportMeasure(true);
  }

  async function enterLandscapeMode() {
    const panel = gamePanel || root.querySelector('.ed-game-panel');
    if (!panel) return;
    displayMode = 'fullscreen';
    panel.dataset.displayMode = 'fullscreen';
    setControlMode('analog');
    updateDisplayModeUI();
    try {
      if (document.fullscreenElement !== panel) {
        if (typeof panel.requestFullscreen !== 'function') throw new Error('Fullscreen API tidak tersedia');
        await panel.requestFullscreen({ navigationUI:'hide' });
      }
    } catch {
      activateFullPagePortal();
      notify('Mode layar penuh aplikasi aktif. Putar perangkat ke posisi mendatar bila belum otomatis.');
    }
    // Some mobile browsers resolve the request without granting fullscreen.
    if (document.fullscreenElement !== panel) activateFullPagePortal();
    try {
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch {
      notify('Putar HP ke posisi landscape untuk menggunakan arena penuh.');
    }
    updateDisplayModeUI();
    if (!window.matchMedia?.('(orientation: landscape)').matches) {
      notify('Layar penuh aktif. Putar HP ke posisi mendatar jika belum berputar otomatis.');
    }
    scheduleViewportMeasure(true);
  }

  function handleFullscreenChange() {
    const panel = gamePanel || root.querySelector('.ed-game-panel');
    if (document.fullscreenElement === panel) {
      displayMode = 'fullscreen';
      setControlMode('analog');
    } else if (!panel?.classList.contains('ed-fullpage-fallback')) {
      displayMode = 'portrait';
      setControlMode('buttons');
      try { screen.orientation?.unlock?.(); } catch {}
    }
    updateDisplayModeUI();
    scheduleViewportMeasure(true);
  }

  function bindControls() {
    document.addEventListener('click',handleClick);
    queryUIAll('[data-ed-control]').forEach(button => {
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
      button.addEventListener('pointerdown',start);
      button.addEventListener('pointerup',stop);
      button.addEventListener('pointercancel',stop);
      button.addEventListener('lostpointercapture',stop);
    });
    window.addEventListener('keydown',handleKeyDown);
    window.addEventListener('keyup',handleKeyUp);
    window.addEventListener('blur',clearInput);
    window.addEventListener('resize',handleViewportChange,{passive:true});
    window.addEventListener('orientationchange',handleOrientationChange,{passive:true});
    // Deliberately do not observe visualViewport resize: mobile browser chrome
    // expands/collapses it while scrolling, which used to reset the canvas each time.
    screen.orientation?.addEventListener?.('change',handleOrientationChange);
    document.addEventListener('fullscreenchange',handleFullscreenChange);
    // No ResizeObserver on the playfield: mobile viewport chrome can otherwise
    // create a resize feedback loop and make the camera jump while playing.
  }

  function handleViewportChange() { scheduleViewportMeasure(false); }
  function handleOrientationChange() { scheduleViewportMeasure(true); }

  function clearInput() {
    input.left = input.right = input.jump = input.interact = false;
    input.jumpQueued = input.interactQueued = false;
    resetAnalogStick();
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
    const actionButton = event.target.closest('[data-ed-action]');
    if (!actionButton || (!root.contains(actionButton) && !gamePanel?.contains(actionButton))) return;
    const action = actionButton.dataset.edAction;
    if (action === 'portrait') { await enterPortraitMode(); return; }
    if (action === 'toggle-controls') { setControlMode(controlMode === 'analog' ? 'buttons' : 'analog'); return; }
    if (action === 'fullscreen') {
      if (displayMode === 'fullscreen') await enterPortraitMode();
      else await enterLandscapeMode();
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
    if (action === 'back') { await enterPortraitMode(); onBack?.(); }
  }

  function updateInteractControl(level) {
    const button = queryUI('[data-ed-control="interact"]');
    if (!button) return;
    const element = CHARACTER[role].element;
    const candidates = [
      ...(level.valves || []).filter(item => !valveIsOpen(item.id)).map(item => ({ ...item, actionType:'valve', actionLabel:'PUTAR KATUP' })),
      ...(level.windLevers || []).filter(item => !windLeverIsOn(item.id)).map(item => ({ ...item, actionType:'lever', actionLabel:'UBAH ANGIN' }))
    ];
    const nearby = candidates
      .map(item => ({ ...item, distance:Math.hypot(localPlayer.x-item.x, localPlayer.y-item.y) }))
      .filter(item => item.distance <= (item.radius || 58))
      .sort((a,b) => a.distance-b.distance)[0];
    button.hidden = !nearby;
    button.disabled = Boolean(nearby && nearby.element && nearby.element !== element);
    if (nearby) {
      button.innerHTML = `${nearby.actionLabel} <small>E</small>`;
      button.setAttribute('aria-label', `${nearby.actionLabel.toLowerCase()} dengan tombol E`);
      button.title = nearby.element && nearby.element !== element
        ? `Hanya ${nearby.element === 'fire' ? 'Bara' : 'Nira'} yang dapat menggunakan ini`
        : nearby.actionLabel;
    }
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
    const setText = (selector, value) => { const el = queryUI(selector); if (el) el.textContent = value; };
    setText('[data-ed-world]', level.worldName.toUpperCase());
    setText('[data-ed-level-title]', `${String(level.id).padStart(2,'0')} · ${level.name}`);
    setText('[data-ed-level-note]', `${level.mapName || 'Jelajah arena'} · ${level.difficultyLabel || 'Petualangan'} · ${level.note}`);
    setText('[data-ed-level-number]', String(level.id).padStart(2,'0'));
    updateInteractControl(level);
    const sequence = level.switchSequence || [];
    const sequenceIndex = Math.max(0, Number(levelState().switches?.sequenceIndex) || 0);
    const nextSequenceElement = sequence[sequenceIndex];
    const sequenceLabel = sequence.length && nextSequenceElement ? ` · Urutan: ${nextSequenceElement === 'fire' ? 'Bara' : 'Nira'}` : '';
    const requiredValves = level.requiredValves || [];
    const openedValves = requiredValves.filter(valveIsOpen).length;
    const valveLabel = requiredValves.length ? ` · Katup ${openedValves}/${requiredValves.length}` : '';
    const requiredWindLevers = level.requiredWindLevers || [];
    const activeWindLevers = requiredWindLevers.filter(windLeverIsOn).length;
    const windLeverLabel = requiredWindLevers.length ? ` · Tuas angin ${activeWindLevers}/${requiredWindLevers.length}` : '';
    setText('[data-ed-gates]', gateIsOpen() ? 'Penghalang terbuka · cari pintu!' : `Bara ${switchIsOn('fire') ? '✓' : '✕'} · Nira ${switchIsOn('water') ? '✓' : '✕'}${sequenceLabel}${valveLabel}${windLeverLabel}`);
    setText('[data-ed-shards]', `◇ ${claimed} / 2`);
    setText('[data-ed-status="host"]', host.complete ? 'Bara · tiba di gerbang' : host.ready ? 'Bara · menjelajah' : 'Bara · menunggu');
    setText('[data-ed-status="guest"]', guest.complete ? 'Nira · tiba di gerbang' : guest.ready ? 'Nira · menjelajah' : 'Nira · menunggu');
    setText('[data-ed-deaths]', `Jatuh: ${Number(mine.deaths)||0}`);
    setText('[data-ed-mechanic]', `${level.mechanic}. ${level.tagline}`);
    const progress = queryUI('[data-ed-progress]');
    if (progress) progress.style.width = `${(level.id / 50) * 100}%`;
    const readyHost = queryUI('[data-ed-ready="host"]');
    const readyGuest = queryUI('[data-ed-ready="guest"]');
    if (readyHost) readyHost.textContent = host.ready ? 'Siap ✓' : 'Menunggu siap';
    if (readyGuest) readyGuest.textContent = guest.ready ? 'Siap ✓' : 'Menunggu siap';
    const readyButton = queryUI('[data-ed-action="ready"]');
    if (readyButton) {
      readyButton.disabled = Boolean(mine.ready);
      readyButton.innerHTML = mine.ready ? 'Kamu sudah siap ✓ <span>♡</span>' : 'Aku siap bertualang <span>↗</span>';
    }
    // Keep temporary feedback in the HUD, never over the playable canvas.
    const notice = queryUI('[data-ed-notice]');
    const noticeActive = Boolean(canvasNotice && now() < noticeUntil);
    if (notice) {
      notice.hidden = !noticeActive;
      if (noticeActive) notice.textContent = canvasNotice;
      else if (canvasNotice) canvasNotice = '';
    }
  }

  function updateFinish() {
    const results = data.meta?.results || {};
    const totalStars = Object.values(results).reduce((sum, item) => sum + Math.min(3, Number(item?.stars)||0), 0);
    const levels = data.levels || {};
    const totalShards = Object.values(levels).reduce((sum, item) => sum + Number(Boolean(item?.gems?.fire)) + Number(Boolean(item?.gems?.water)), 0);
    const setText = (selector, value) => { const el = queryUI(selector); if (el) el.textContent = value; };
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
      // Align moving platforms and timed hazards to Firebase's shared clock,
      // so both devices simulate the same world phase even when phone clocks drift.
      if (!serverClockReady) await serverClockReadyPromise;
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'lobby') return;
        return { ...current, phase:'playing', startedAt:now(), transitioning:false };
      });
    } catch (error) { notify(`Tidak dapat memulai petualangan: ${error.message}`, 'error'); }
    finally { readyBusy = false; }
  }

  async function coordinateProgress() {
    if (advanceBusy) return;
    if (data.meta?.transitioning) {
      // Recover a transition lock left behind by a tab closing or losing connection
      // after it acquired the lock but before it published the next level.
      const lockStartedAt = Number(data.meta.transitionStartedAt) || Number(data.meta.startedAt) || now();
      if (now() - lockStartedAt < 12000) return;
      try {
        const recovered = await runTransaction(metaRef, current => {
          if (!current || current.phase !== 'playing' || !current.transitioning) return;
          const currentLockAt = Number(current.transitionStartedAt) || Number(current.startedAt) || now();
          if (now() - currentLockAt < 12000) return;
          return { ...current, transitioning:false, transitionStartedAt:null };
        });
        if (recovered.committed) notify('Memulihkan progres level…');
      } catch (error) {
        notify(`Tidak dapat memulihkan progres: ${error.message}`, 'error');
      }
      return;
    }
    const level = Number(data.meta?.level) || 1;
    const host = data.players?.host;
    const guest = data.players?.guest;
    if (!host?.complete || !guest?.complete) return;
    advanceBusy = true;
    try {
      const lock = await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing' || Number(current.level) !== level || current.transitioning) return;
        return { ...current, transitioning:true, transitionStartedAt:now() };
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
        patch['meta/transitionStartedAt'] = null;
        patch['meta/completedAt'] = now();
      } else {
        const nextLevel = level + 1;
        patch['meta/level'] = nextLevel;
        patch['meta/phase'] = 'playing';
        patch['meta/startedAt'] = now();
        patch['meta/transitioning'] = false;
        patch['meta/transitionStartedAt'] = null;
        patch['players/host'] = createElementalPlayer('host', { ready:true, deaths:Number(host.deaths)||0, levelDeaths:0, shards:Number(host.shards)||0 }, nextLevel);
        patch['players/guest'] = createElementalPlayer('guest', { ready:true, deaths:Number(guest.deaths)||0, levelDeaths:0, shards:Number(guest.shards)||0 }, nextLevel);
      }
      await update(baseRef, patch);
    } catch (error) {
      notify(`Tidak dapat membuka level berikutnya: ${error.message}`, 'error');
      try { await update(metaRef, { transitioning:false, transitionStartedAt:null }); } catch {}
    } finally { advanceBusy = false; }
  }

  function playerPayload() {
    return {
      x:Math.round(localPlayer.x*10)/10, y:Math.round(localPlayer.y*10)/10,
      vx:Math.round(localPlayer.vx*10)/10, vy:Math.round(localPlayer.vy*10)/10,
      dir:localPlayer.dir, grounded:Boolean(localPlayer.grounded), ready:true,
      complete:Boolean(localPlayer.complete), mapVersion:ELEMENTAL_MAP_VERSION, deaths:Number(localPlayer.deaths)||0,
      levelDeaths:Number(localPlayer.levelDeaths)||0, shards:Number(localPlayer.shards)||0, updatedAt:now()
    };
  }

  async function flushPlayerWrites() {
    if (writingPlayer || destroyed || !pendingPlayerPayload) return;
    writingPlayer = true;
    try {
      while (pendingPlayerPayload && !destroyed) {
        // Always send the newest snapshot after any in-flight write. In particular,
        // a completion update must never be dropped behind a position update.
        const payload = pendingPlayerPayload;
        pendingPlayerPayload = null;
        try {
          await set(ownPlayerRef, payload);
        } catch (error) {
          if (!pendingPlayerPayload || Number(payload.updatedAt) > Number(pendingPlayerPayload.updatedAt)) {
            pendingPlayerPayload = payload;
          }
          notify(`Sinkronisasi karakter gagal: ${error.message}`, 'error');
          break;
        }
      }
    } finally {
      writingPlayer = false;
      if (pendingPlayerPayload && !destroyed && !playerWriteRetryTimer) {
        playerWriteRetryTimer = window.setTimeout(() => {
          playerWriteRetryTimer = 0;
          void flushPlayerWrites();
        }, 900);
      }
    }
  }

  function saveLocalPlayer(force = false) {
    if (!data.meta || data.meta.phase !== 'playing') return;
    if (!force && now() - lastWriteAt < 115) return;
    lastWriteAt = now();
    pendingPlayerPayload = playerPayload();
    // Queue writes instead of returning when one is already in progress. This is
    // critical when the player reaches a door while a position sync is in flight.
    void flushPlayerWrites();
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
    localPlayer.supportPlatformId = null;
    coyoteTimeRemaining = 0;
    jumpBufferRemaining = 0;
    notify('Ups! Coba jalur yang lain. Kamu kembali ke titik aman.');
    saveLocalPlayer(true);
  }

  function attemptValve(valve) {
    if (valveBusy || localPlayer.complete || data.meta?.phase !== 'playing') return;
    if (valve.element && valve.element !== CHARACTER[role].element) {
      notify(valve.element === 'fire' ? 'Katup ini hanya dapat diputar Bara.' : 'Katup ini hanya dapat diputar Nira.');
      return;
    }
    if (valveIsOpen(valve.id)) { notify(`${valve.label || 'Katup'} sudah aktif.`); return; }
    valveBusy = true;
    runTransaction(ref(db, path('levels', String(currentLevel), 'valves', valve.id)), value => value === true ? undefined : true)
      .then(result => {
        if (result.committed) notify(`${valve.label || 'Katup'} terbuka. Aliran yang terhubung berhenti!`);
        else notify(`${valve.label || 'Katup'} sudah diaktifkan pasangan.`);
      })
      .catch(error => notify(`Katup gagal diaktifkan: ${error.message}`, 'error'))
      .finally(() => { valveBusy = false; });
  }

  function attemptWindLever(lever) {
    if (windLeverBusy || localPlayer.complete || data.meta?.phase !== 'playing') return;
    if (lever.element && lever.element !== CHARACTER[role].element) {
      notify(lever.element === 'fire' ? 'Tuas ini hanya dapat diaktifkan Bara.' : 'Tuas ini hanya dapat diaktifkan Nira.');
      return;
    }
    if (windLeverIsOn(lever.id)) { notify(`${lever.label || 'Tuas angin'} sudah aktif.`); return; }
    windLeverBusy = true;
    runTransaction(ref(db, path('levels', String(currentLevel), 'windLevers', lever.id)), value => value === true ? undefined : true)
      .then(result => {
        if (result.committed) notify(`${lever.label || 'Tuas angin'} aktif. Arah hembusan berubah!`);
        else notify(`${lever.label || 'Tuas angin'} sudah diaktifkan pasangan.`);
      })
      .catch(error => notify(`Tuas angin gagal diaktifkan: ${error.message}`, 'error'))
      .finally(() => { windLeverBusy = false; });
  }

  function attemptSwitch(forcedPlate = null) {
    if (switchBusy || localPlayer.complete || data.meta?.phase !== 'playing') return;
    const level = levelData();
    if (!forcedPlate) {
      const nearbyValve = (level.valves || []).find(item => Math.hypot(localPlayer.x-item.x, localPlayer.y-item.y) < (item.radius || 58));
      if (nearbyValve) { attemptValve(nearbyValve); return; }
      const nearbyWindLever = (level.windLevers || []).find(item => Math.hypot(localPlayer.x-item.x, localPlayer.y-item.y) < (item.radius || 58));
      if (nearbyWindLever) { attemptWindLever(nearbyWindLever); return; }
    }
    const nearby = forcedPlate || level.switches.find(item => Math.hypot(localPlayer.x-item.x, (localPlayer.y-3)-item.y) < 62);
    if (!nearby) { notify('Dekati pijakan, katup, atau tuas angin untuk berinteraksi.'); return; }
    if (nearby.element !== CHARACTER[role].element) {
      if (!forcedPlate) notify(nearby.element === 'fire' ? 'Pijakan ini hanya untuk Bara.' : 'Pijakan ini hanya untuk Nira.');
      return;
    }
    if (switchIsOn(nearby.element)) return;
    const sequence = level.switchSequence || [];
    const sequenceIndex = Math.max(0, Number(levelState().switches?.sequenceIndex) || 0);
    if (sequence.length && sequence[sequenceIndex] !== nearby.element) {
      const expected = sequence[sequenceIndex] === 'fire' ? 'Bara' : 'Nira';
      notify(`Urutan belum tepat. Aktifkan pijakan ${expected} terlebih dahulu.`);
      return;
    }
    switchBusy = true;
    const switchRef = sequence.length
      ? ref(db, path('levels', String(currentLevel), 'switches'))
      : ref(db, path('levels', String(currentLevel), 'switches', nearby.element));
    runTransaction(switchRef, value => {
      if (!sequence.length) return value === true ? undefined : true;
      const state = value && typeof value === 'object' ? { ...value } : {};
      const index = Math.max(0, Number(state.sequenceIndex) || 0);
      if (sequence[index] !== nearby.element || state[nearby.element]) return;
      state[nearby.element] = true;
      state.sequenceIndex = index + 1;
      return state;
    })
      .then(result => {
        if (result.committed) {
          const nextIndex = Math.max(0, Number(result.snapshot.val()?.sequenceIndex) || 0);
          if (sequence.length && nextIndex < sequence.length) {
            notify(`Pijakan ${nearby.element === 'fire' ? 'Bara' : 'Nira'} aktif! Berikutnya ${sequence[nextIndex] === 'fire' ? 'Bara' : 'Nira'}.`);
          } else {
            notify(`Pijakan ${nearby.element === 'fire' ? 'Bara' : 'Nira'} aktif!`);
          }
        }
      })
      .catch(error => notify(`Pijakan gagal diaktifkan: ${error.message}`, 'error'))
      .finally(() => { switchBusy = false; });
  }

  function checkPressurePlate() {
    if (switchBusy || !localPlayer.grounded || localPlayer.complete) return;
    const level = levelData();
    const element = CHARACTER[role].element;
    if (switchIsOn(element)) return;
    const sequence = level.switchSequence || [];
    const sequenceIndex = Math.max(0, Number(levelState().switches?.sequenceIndex) || 0);
    if (sequence.length && sequence[sequenceIndex] !== element) return;
    const body = { x:localPlayer.x-14, y:localPlayer.y-13, w:28, h:26 };
    const plate = level.switches.find(item => {
      if (item.element !== element) return false;
      const plateRect = { x:item.x-(item.w||52)/2, y:item.y-(item.h||10)/2, w:item.w||52, h:item.h||10 };
      return rectsOverlap(body, plateRect);
    });
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
    const previousPlayerX = localPlayer.x;
    const previousPlayerY = localPlayer.y;
    const elapsedMs = levelElapsedMs();
    const previousElapsedMs = Math.max(0, elapsedMs - dt * 1000);
    const platforms = level.platforms.map(platform => ({
      current:getElementalPlatformState(platform, elapsedMs),
      previous:getElementalPlatformState(platform, previousElapsedMs)
    }));
    const hazards = level.hazards
      .filter(hazard => !hazard.valveId || !valveIsOpen(hazard.valveId))
      .map(hazard => getElementalHazardState(hazard, elapsedMs));

    // Carry a player standing on a moving platform by the exact platform delta.
    if (localPlayer.grounded && localPlayer.supportPlatformId) {
      const support = platforms.find(item => item.current.id === localPlayer.supportPlatformId);
      if (support?.current.active && support.previous.active) {
        localPlayer.x += support.current.x - support.previous.x;
        localPlayer.y += support.current.y - support.previous.y;
      } else if (support && !support.current.active) {
        localPlayer.supportPlatformId = null;
        localPlayer.grounded = false;
      }
    }

    const direction = Number(input.right) - Number(input.left);
    const maxSpeed = ELEMENTAL_MOVE_SPEED + (level.modifier === 'wind' ? 28 : 0);
    if (direction) {
      localPlayer.vx = direction * maxSpeed;
      localPlayer.dir = direction;
    } else {
      const friction = getElementalSurfaceFriction(localPlayer, level);
      localPlayer.vx *= Math.pow(friction, dt * 60);
      if (Math.abs(localPlayer.vx) < 3) localPlayer.vx = 0;
    }

    // Forgiving platform controls: a small input buffer and coyote window make
    // narrow mobile touch presses register even a fraction before/after landing.
    if (input.jumpQueued) jumpBufferRemaining = 0.17;
    else jumpBufferRemaining = Math.max(0, jumpBufferRemaining - dt);
    if (localPlayer.grounded) coyoteTimeRemaining = 0.14;
    else coyoteTimeRemaining = Math.max(0, coyoteTimeRemaining - dt);
    if (jumpBufferRemaining > 0 && (localPlayer.grounded || coyoteTimeRemaining > 0)) {
      localPlayer.vy = -(level.modifier === 'bouncy' ? ELEMENTAL_JUMP_SPEED * 1.04 : ELEMENTAL_JUMP_SPEED);
      localPlayer.grounded = false;
      localPlayer.supportPlatformId = null;
      coyoteTimeRemaining = 0;
      jumpBufferRemaining = 0;
    }
    input.jumpQueued = false;
    if (input.interactQueued) attemptSwitch();
    input.interactQueued = false;

    const halfW = 14;
    const halfH = 13;
    const flowBody = { x:localPlayer.x-halfW, y:localPlayer.y-halfH, w:halfW*2, h:halfH*2 };
    for (const source of (level.currents || [])) {
      const flow = getElementalCurrentState(source, elapsedMs);
      if (!rectsOverlap(flowBody, flow)) continue;
      localPlayer.vx += (Number(flow.forceX) || 0) * dt;
      localPlayer.vy += (Number(flow.forceY) || 0) * dt;
    }
    for (const source of (level.windZones || [])) {
      const wind = getElementalWindState(source, elapsedMs, source.leverId ? windLeverIsOn(source.leverId) : false);
      if (!rectsOverlap(flowBody, wind)) continue;
      localPlayer.vx += (Number(wind.forceX) || 0) * dt * 3.4;
      localPlayer.vy += (Number(wind.forceY) || 0) * dt * 3.4;
    }
    localPlayer.vx = Math.max(-390, Math.min(390, localPlayer.vx));
    localPlayer.vy = Math.max(-760, Math.min(760, localPlayer.vy));
    localPlayer.x += localPlayer.vx * dt;
    localPlayer.x = Math.max(halfW + 3, Math.min((level.worldWidth || ELEMENTAL_WORLD_WIDTH) - halfW - 3, localPlayer.x));
    for (const entry of platforms) {
      const platform = entry.current;
      if (!platform.active) continue;
      const body = { x:localPlayer.x-halfW, y:localPlayer.y-halfH+3, w:halfW*2, h:halfH*2-3 };
      if (!rectsOverlap(body, platform)) continue;
      const previousX = localPlayer.x - localPlayer.vx * dt;
      if (localPlayer.vx > 0 && previousX + halfW <= platform.x + 4) localPlayer.x = platform.x - halfW;
      else if (localPlayer.vx < 0 && previousX - halfW >= platform.x + platform.w - 4) localPlayer.x = platform.x + platform.w + halfW;
      localPlayer.vx = 0;
    }
    const previousBottom = localPlayer.y + halfH;
    localPlayer.vy += ELEMENTAL_GRAVITY * dt * (level.modifier === 'wind' ? 0.98 : 1);
    localPlayer.y += localPlayer.vy * dt;
    localPlayer.grounded = false;
    localPlayer.supportPlatformId = null;
    const floorPlatforms = (level.floorSegments || [{ id:'main-floor', x:0, y:ELEMENTAL_FLOOR_Y, w:ELEMENTAL_WORLD_WIDTH, h:60 }]).map(segment => ({ ...segment, kind:'floor' }));
    const collisionPlatforms = [...platforms.filter(item => item.current.active).map(item => item.current), ...floorPlatforms];
    for (const platform of collisionPlatforms) {
      const horizontal = localPlayer.x + halfW > platform.x && localPlayer.x - halfW < platform.x + platform.w;
      const bottom = localPlayer.y + halfH;
      if (horizontal && localPlayer.vy >= 0 && previousBottom <= platform.y + 5 && bottom >= platform.y) {
        localPlayer.y = platform.y - halfH;
        if (platform.kind === 'bounce') {
          localPlayer.vy = -ELEMENTAL_JUMP_SPEED * 1.08;
          localPlayer.grounded = false;
          localPlayer.supportPlatformId = null;
        } else {
          localPlayer.vy = 0;
          localPlayer.grounded = true;
          localPlayer.supportPlatformId = platform.id === 'main-floor' ? null : platform.id;
        }
      } else if (horizontal && localPlayer.vy < 0 && localPlayer.y - halfH < platform.y + platform.h && localPlayer.y - halfH > platform.y) {
        localPlayer.y = platform.y + platform.h + halfH;
        localPlayer.vy = 0;
      }
    }

    if (localPlayer.y > (level.worldHeight || ELEMENTAL_WORLD_HEIGHT) + 55) {
      resetAfterHit();
      return;
    }

    // Closed seals are solid 2D rectangles. Depending on their shape, the
    // player is stopped horizontally or vertically; a high route can bypass
    // a tall seal, which makes exploration and alternate routes meaningful.
    if (!gateIsOpen() && level.gate) {
      const gate = level.gate;
      const bodyNow = { x:localPlayer.x-halfW, y:localPlayer.y-halfH, w:halfW*2, h:halfH*2 };
      if (rectsOverlap(bodyNow, gate)) {
        const overlapX = Math.min(bodyNow.x+bodyNow.w,gate.x+gate.w)-Math.max(bodyNow.x,gate.x);
        const overlapY = Math.min(bodyNow.y+bodyNow.h,gate.y+gate.h)-Math.max(bodyNow.y,gate.y);
        if (overlapX <= overlapY) {
          if (previousPlayerX+halfW <= gate.x+4) localPlayer.x = gate.x-halfW-1;
          else if (previousPlayerX-halfW >= gate.x+gate.w-4) localPlayer.x = gate.x+gate.w+halfW+1;
          else localPlayer.x += (localPlayer.x < gate.x+gate.w/2 ? -1 : 1) * (overlapX+1);
          localPlayer.vx = 0;
        } else {
          if (previousPlayerY+halfH <= gate.y+4) {
            localPlayer.y = gate.y-halfH-1;
            localPlayer.grounded = true;
          } else if (previousPlayerY-halfH >= gate.y+gate.h-4) {
            localPlayer.y = gate.y+gate.h+halfH+1;
          } else {
            localPlayer.y += (localPlayer.y < gate.y+gate.h/2 ? -1 : 1) * (overlapY+1);
          }
          localPlayer.vy = 0;
        }
      }
    }

    const body = { x:localPlayer.x-halfW, y:localPlayer.y-halfH, w:halfW*2, h:halfH*2 };
    for (const hazard of hazards) {
      if (hazard.active === false || !rectsOverlap(body, hazard)) continue;
      const safeType = CHARACTER[role].element === 'fire' ? 'fire' : 'water';
      if (hazard.type === 'steam' || hazard.type !== safeType) { resetAfterHit(); break; }
    }

    if (!localCheckpoint && Math.hypot(localPlayer.x-level.checkpoint.x, localPlayer.y-level.checkpoint.y) <= (level.checkpoint.radius || 52)) {
      localCheckpoint = { x:level.checkpoint.x, y:level.checkpoint.y };
      notify('Titik aman tercapai. Kalian bisa menjelajah lebih jauh!');
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
    const floorY = level.floorY || ELEMENTAL_FLOOR_Y;
    const width = level.worldWidth || ELEMENTAL_WORLD_WIDTH;
    const height = level.worldHeight || ELEMENTAL_WORLD_HEIGHT;
    const gradient = ctx.createLinearGradient(0,0,0,height);
    gradient.addColorStop(0,c.sky); gradient.addColorStop(.58,c.sky2); gradient.addColorStop(1,c.sky2);
    ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
    // Distant layered silhouettes give the tall rooms depth while the camera scrolls.
    ctx.save();
    ctx.globalAlpha = .22;
    for (let i=0;i<9;i++) {
      const drift = ((i*191 + time*.006*(i%2 ? 1 : -1)) % (width+240) + width+240) % (width+240) - 120;
      const y = 115 + (i%4)*108;
      const r = 28 + (i%3)*9;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(drift,y,r*1.6,r*.55,0,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    for (const [baseY,color,alpha,step] of [[floorY-190,c.far,.54,115],[floorY-105,c.near,.72,92]]) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0,baseY);
      for (let x=0;x<=width+step;x+=step) {
        const ridge = baseY - 48 - ((Math.floor(x/step)%3)*19);
        ctx.quadraticCurveTo(x+step/2,ridge,x+step,baseY+10);
      }
      ctx.lineTo(width,height); ctx.lineTo(0,height); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha=.22;
    for(let i=0;i<66;i++){
      const x=(i*83+23)%width, y=45+(i*67)%(floorY-95);
      ctx.fillStyle=i%2?'#fff':'#ffe7b6'; ctx.beginPath(); ctx.arc(x,y,1.2+(i%3),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFloorSegments(level) {
    const segments = level.floorSegments || [{x:0,y:ELEMENTAL_FLOOR_Y,w:ELEMENTAL_WORLD_WIDTH,h:60}];
    for (const segment of segments) {
      const ground = ctx.createLinearGradient(0,segment.y,0,segment.y+segment.h);
      ground.addColorStop(0,level.colors.ground); ground.addColorStop(1,'rgba(36,35,58,.94)');
      ctx.fillStyle = ground; roundedRect(ctx,segment.x,segment.y,segment.w,segment.h,7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.24)'; roundedRect(ctx,segment.x+4,segment.y+3,segment.w-8,4,2); ctx.fill();
      ctx.save(); ctx.globalAlpha=.18; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
      for(let x=segment.x+18;x<segment.x+segment.w-8;x+=34){
        ctx.beginPath(); ctx.moveTo(x,segment.y+14); ctx.lineTo(x+8,segment.y+25+(x%3)*3); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawSkyDecor(level, time) {
    if (level.worldIndex !== 4) return;
    ctx.save();
    // Soft, layered cloud banks distinguish the sky world from earlier biomes.
    for (let i=0;i<8;i++) {
      const drift = (time * (.006 + i*.0007) * (i%2 ? 1 : -1));
      const x = ((i*151 + drift) % 1120 + 1120) % 1120 - 80;
      const y = 105 + (i%4)*62;
      const r = 24 + (i%3)*9;
      ctx.globalAlpha = .2 + (i%2)*.08;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(x,y,r*1.8,r*.48,0,0,Math.PI*2);
      ctx.ellipse(x-r*.65,y+2,r*.78,r*.54,0,0,Math.PI*2);
      ctx.ellipse(x+r*.55,y-3,r*.92,r*.62,0,0,Math.PI*2);
      ctx.fill();
    }
    // Distant floating islands are decorative only; collision remains on authored platforms.
    for (let i=0;i<4;i++) {
      const x = 105 + i*245 + Math.sin(time*.0005+i)*8;
      const y = 270 + (i%2)*64;
      ctx.globalAlpha = .28;
      ctx.fillStyle = level.colors.far;
      ctx.beginPath(); ctx.moveTo(x-48,y); ctx.lineTo(x+48,y); ctx.lineTo(x+27,y+15); ctx.lineTo(x+8,y+34); ctx.lineTo(x-18,y+22); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = .48; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(x,y-2,51,7,0,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }


  function drawAncientDecor(level, time) {
    if (level.worldIndex !== 5) return;
    ctx.save();
    // Ancient runic halos and floating shards are decorative only; collisions
    // remain entirely data-driven by the authored platforms and hazards.
    const centers = [[245,205,74],[505,170,96],[760,225,68]];
    for (let i=0;i<centers.length;i++) {
      const [x,y,r] = centers[i];
      const rotation = time * (i%2 ? -.00012 : .00009) + i*.8;
      ctx.save(); ctx.translate(x,y); ctx.rotate(rotation);
      ctx.globalAlpha = .12 + .035*Math.sin(time*.001+i);
      ctx.strokeStyle = i===1 ? '#fff0c9' : '#c9c0ef';
      ctx.lineWidth = 3; ctx.setLineDash([7,9]);
      ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0,0,r*.72,0,Math.PI*2); ctx.stroke();
      for (let n=0;n<8;n++) {
        const a = n*Math.PI/4;
        ctx.save(); ctx.rotate(a); ctx.translate(r,0);
        ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(5,0); ctx.lineTo(0,7); ctx.lineTo(-5,0); ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    for (let i=0;i<18;i++) {
      const drift = time*.009 + i*53;
      const width = level.worldWidth || ELEMENTAL_WORLD_WIDTH;
      const x = (i*67 + Math.sin(drift*.012)*17 + width) % width;
      const y = 90 + (i*61)%315 + Math.sin(drift*.02)*7;
      const size = 3 + (i%3)*1.5;
      ctx.globalAlpha = .16 + .1*Math.sin(drift*.018+i);
      ctx.fillStyle = i%2 ? '#fff0c9' : '#c9e9f3';
      ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x+size*.7,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size*.7,y); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawIceZones(level, time) {
    for (const zone of (level.iceZones || [])) {
      ctx.save();
      const gradient = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
      gradient.addColorStop(0, 'rgba(211,249,255,.82)');
      gradient.addColorStop(1, 'rgba(91,185,216,.25)');
      ctx.fillStyle = gradient;
      roundedRect(ctx, zone.x, zone.y, zone.w, zone.h, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(237,255,255,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(zone.x+7,zone.y+3); ctx.lineTo(zone.x+zone.w-7,zone.y+3); ctx.stroke();
      for (let i=0;i<Math.max(2,Math.floor(zone.w/46));i++) {
        const x = zone.x + 14 + i*42;
        const shimmer = .35 + .25*Math.sin(time*.004+i);
        ctx.globalAlpha = shimmer; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(x,zone.y+5); ctx.lineTo(x+5,zone.y+10); ctx.lineTo(x,zone.y+14); ctx.lineTo(x-5,zone.y+10); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawCurrentZones(level, time, elapsedMs = 0) {
    for (const source of (level.currents || [])) {
      const flow = getElementalCurrentState(source, elapsedMs);
      ctx.save();
      ctx.fillStyle = 'rgba(105,211,235,.12)';
      roundedRect(ctx,flow.x,flow.y,flow.w,flow.h,16); ctx.fill();
      ctx.strokeStyle = 'rgba(161,239,250,.55)'; ctx.lineWidth = 2; ctx.setLineDash([7,7]);
      ctx.strokeRect(flow.x+3,flow.y+3,flow.w-6,flow.h-6); ctx.setLineDash([]);
      const fx = Number(flow.forceX) || 0; const fy = Number(flow.forceY) || 0;
      const angle = Math.atan2(fy,fx);
      const horizontalCount = Math.max(2,Math.floor(flow.w/62));
      const verticalCount = Math.max(1,Math.floor(flow.h/45));
      for (let row=0;row<verticalCount;row++) for (let col=0;col<horizontalCount;col++) {
        const drift = (time*.035 + row*17 + col*31) % 34;
        const x = flow.x + 18 + col*((flow.w-36)/Math.max(1,horizontalCount-1)) + (fx>=0 ? drift : -drift);
        const y = flow.y + 18 + row*((flow.h-36)/Math.max(1,verticalCount-1)) + (fy>=0 ? drift*.24 : -drift*.24);
        ctx.save(); ctx.translate(x,y); ctx.rotate(Math.abs(fx)+Math.abs(fy)<1 ? angle : angle);
        ctx.globalAlpha = .5 + .22*Math.sin(time*.006+row+col);
        ctx.strokeStyle = '#d7fbff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.moveTo(3,-5); ctx.lineTo(8,0); ctx.lineTo(3,5); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }


  function drawWindZones(level, time, elapsedMs = 0) {
    for (const source of (level.windZones || [])) {
      const wind = getElementalWindState(source, elapsedMs, source.leverId ? windLeverIsOn(source.leverId) : false);
      const fx = Number(wind.forceX) || 0;
      const fy = Number(wind.forceY) || 0;
      const angle = Math.atan2(fy, fx);
      ctx.save();
      ctx.globalAlpha = .08 + .08 * Math.max(0, wind.strength || 0);
      ctx.fillStyle = '#f6fbff';
      roundedRect(ctx, wind.x, wind.y, wind.w, wind.h, 18); ctx.fill();
      ctx.globalAlpha = .35 + .2 * Math.max(0, wind.strength || 0);
      ctx.strokeStyle = '#f8fdff'; ctx.lineWidth = 1.8; ctx.setLineDash([8,9]);
      ctx.strokeRect(wind.x+3, wind.y+3, Math.max(0,wind.w-6), Math.max(0,wind.h-6)); ctx.setLineDash([]);
      const horizontalCount = Math.max(2, Math.floor(wind.w/72));
      const verticalCount = Math.max(1, Math.floor(wind.h/58));
      for (let row=0;row<verticalCount;row++) for (let col=0;col<horizontalCount;col++) {
        const baseX = wind.x + 22 + col*((wind.w-44)/Math.max(1,horizontalCount-1));
        const baseY = wind.y + 22 + row*((wind.h-44)/Math.max(1,verticalCount-1));
        const drift = (time*.028 + row*19 + col*27) % 25;
        const px = baseX + (Math.abs(fx)>Math.abs(fy) ? Math.sign(fx || 1)*drift : Math.sin(time*.002+row+col)*3);
        const py = baseY + (Math.abs(fy)>=Math.abs(fx) ? Math.sign(fy || -1)*drift : Math.cos(time*.002+row+col)*3);
        ctx.save(); ctx.translate(px,py); ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.4; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(9,0); ctx.moveTo(3,-5); ctx.lineTo(9,0); ctx.lineTo(3,5); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  function drawPlatforms(level, elapsedMs = 0) {
    const c = level.colors;
    for (const source of level.platforms) {
      const p = getElementalPlatformState(source, elapsedMs);
      if (!p.active) continue;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      const visualH = p.visualH || p.h;
      if (p.kind === 'bounce') {
        ctx.fillStyle = '#6e9870';
        ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+8,p.w/2,13,0,Math.PI,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#b7db91';
        ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+3,p.w/2,10,0,Math.PI,Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+1,p.w*.3,3,0,Math.PI,Math.PI*2); ctx.fill();
      } else if (p.kind === 'cloud') {
        ctx.fillStyle = 'rgba(255,255,255,.94)';
        roundedRect(ctx,p.x,p.y+5,p.w,visualH-5,9); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.98)';
        ctx.beginPath(); ctx.ellipse(p.x+p.w*.25,p.y+5,p.w*.22,7,0,Math.PI,Math.PI*2); ctx.ellipse(p.x+p.w*.52,p.y+3,p.w*.25,9,0,Math.PI,Math.PI*2); ctx.ellipse(p.x+p.w*.78,p.y+6,p.w*.19,6,0,Math.PI,Math.PI*2); ctx.fill();
        ctx.strokeStyle='rgba(139,163,218,.48)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(p.x+7,p.y+visualH-2); ctx.lineTo(p.x+p.w-7,p.y+visualH-2); ctx.stroke();
      } else if (p.kind === 'ice') {
        const iceGradient = ctx.createLinearGradient(0,p.y,0,p.y+visualH);
        iceGradient.addColorStop(0,'#f1fdff'); iceGradient.addColorStop(.42,'#b6edf6'); iceGradient.addColorStop(1,'#6fb8d4');
        ctx.fillStyle = iceGradient; roundedRect(ctx,p.x,p.y,p.w,visualH,8); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.92)'; roundedRect(ctx,p.x+5,p.y+3,p.w-10,3,2); ctx.fill();
        ctx.strokeStyle='rgba(80,167,197,.48)'; ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.moveTo(p.x+p.w*.32,p.y+5); ctx.lineTo(p.x+p.w*.42,p.y+11); ctx.lineTo(p.x+p.w*.51,p.y+5); ctx.stroke();
      } else {
        ctx.fillStyle = p.kind === 'crystal' ? 'rgba(230,250,255,.88)' : c.ground;
        roundedRect(ctx,p.x,p.y,p.w,visualH,8); ctx.fill();
        ctx.fillStyle = p.kind === 'crystal' ? '#fff' : 'rgba(255,255,255,.28)';
        roundedRect(ctx,p.x+4,p.y+3,p.w-8,3,2); ctx.fill();
        if (p.kind === 'crystal') {
          ctx.fillStyle='rgba(105,203,220,.25)';
          ctx.beginPath(); ctx.moveTo(p.x+16,p.y+2); ctx.lineTo(p.x+26,p.y-10); ctx.lineTo(p.x+36,p.y+2); ctx.fill();
        }
      }
      if (source.motion) {
        ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2; ctx.setLineDash([5,5]);
        ctx.beginPath();
        if (source.motion.axis === 'y') {
          ctx.moveTo(source.x+source.w/2,source.y-source.motion.amplitude); ctx.lineTo(source.x+source.w/2,source.y+source.motion.amplitude+source.h);
        } else {
          ctx.moveTo(source.x-source.motion.amplitude,source.y+20); ctx.lineTo(source.x+source.w+source.motion.amplitude,source.y+20);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawHazards(level, time, elapsedMs = 0) {
    for (const source of level.hazards) {
      if (source.valveId && valveIsOpen(source.valveId)) continue;
      const h = getElementalHazardState(source, elapsedMs);
      if (h.active === false) continue;
      ctx.save(); ctx.globalAlpha = h.opacity ?? 1;
      if (h.visual === 'lava') {
        const magma = ctx.createLinearGradient(0,h.y,0,h.y+h.h);
        magma.addColorStop(0,'#ffe08a'); magma.addColorStop(.28,'#ff9a45'); magma.addColorStop(1,'#b93635');
        ctx.shadowColor='#ff713e'; ctx.shadowBlur=16; ctx.fillStyle=magma;
        roundedRect(ctx,h.x,h.y,h.w,h.h,Math.min(9,h.h/2)); ctx.fill(); ctx.shadowBlur=0;
        ctx.strokeStyle='rgba(255,239,173,.9)'; ctx.lineWidth=3; ctx.beginPath();
        for(let x=0;x<=h.w;x+=5){const y=h.y+5+Math.sin((x+time*.075)/14)*3; if(x===0)ctx.moveTo(h.x+x,y);else ctx.lineTo(h.x+x,y);}
        ctx.stroke();
        for(let i=0;i<Math.max(2,Math.floor(h.w/34));i++){
          const bx=h.x+12+((i*31+time*.018)%(Math.max(16,h.w-20)));
          const by=h.y+8+Math.sin(time*.004+i*1.7)*Math.max(2,h.h*.18);
          ctx.fillStyle='rgba(255,230,150,.82)';ctx.beginPath();ctx.arc(bx,by,2.2+(i%2),0,Math.PI*2);ctx.fill();
        }
      } else if (h.visual === 'steam' || h.type === 'steam') {
        const steam = ctx.createLinearGradient(0,h.y+h.h,0,h.y);
        steam.addColorStop(0,'rgba(255,224,190,.12)'); steam.addColorStop(.5,'rgba(255,245,224,.64)'); steam.addColorStop(1,'rgba(255,255,255,.12)');
        ctx.fillStyle=steam; roundedRect(ctx,h.x,h.y,h.w,h.h,Math.min(12,h.w/2)); ctx.fill();
        ctx.strokeStyle='rgba(255,247,231,.78)';ctx.lineWidth=2;
        for(let i=0;i<3;i++){
          const x=h.x+h.w*(.25+i*.25)+Math.sin(time*.006+i)*4;
          ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.bezierCurveTo(x-7,h.y+h.h*.68,x+8,h.y+h.h*.35,x+Math.sin(time*.004+i)*5,h.y+3);ctx.stroke();
        }
        ctx.fillStyle='rgba(255,205,157,.75)';ctx.fillRect(h.x,h.y+h.h-4,h.w,4);
      } else if (h.type === 'toxic' || h.visual === 'toxic') {
        const swamp = ctx.createLinearGradient(0,h.y,0,h.y+h.h);
        swamp.addColorStop(0,'#c7ef8c'); swamp.addColorStop(.38,'#75b85b'); swamp.addColorStop(1,'#365e43');
        ctx.shadowColor='#95dc68'; ctx.shadowBlur=12; ctx.fillStyle=swamp;
        roundedRect(ctx,h.x,h.y,h.w,h.h,7); ctx.fill(); ctx.shadowBlur=0;
        ctx.strokeStyle='rgba(226,255,169,.9)'; ctx.lineWidth=2;
        ctx.beginPath();
        for(let x=0;x<=h.w;x+=5){const y=h.y+6+Math.sin((x+time*.07)/13)*3; if(x===0)ctx.moveTo(h.x+x,y);else ctx.lineTo(h.x+x,y);}
        ctx.stroke();
        for(let i=0;i<3;i++){const bx=h.x+16+i*31+Math.sin(time*.003+i)*4;ctx.fillStyle='rgba(220,255,167,.8)';ctx.beginPath();ctx.arc(bx,h.y+11+(i%2)*4,2.5,0,Math.PI*2);ctx.fill();}
      } else {
        const fire = h.type === 'fire';
        const base = fire ? '#dc7959' : '#3e9db8';
        ctx.fillStyle = base; roundedRect(ctx,h.x,h.y,h.w,h.h,7); ctx.fill();
        ctx.strokeStyle = fire ? '#ffd08f' : '#c6f7ff'; ctx.lineWidth=3;
        ctx.beginPath();
        for(let x=0;x<=h.w;x+=5){const y=h.y+6+Math.sin((x+time*.09)/12)*3; if(x===0)ctx.moveTo(h.x+x,y);else ctx.lineTo(h.x+x,y);}
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawValves(level, time) {
    for (const valve of (level.valves || [])) {
      const open = valveIsOpen(valve.id);
      const fire = valve.element === 'fire';
      const color = fire ? '#ffad63' : '#75dce8';
      ctx.save(); ctx.translate(valve.x,valve.y);
      ctx.shadowColor=color; ctx.shadowBlur=open?18:8;
      ctx.fillStyle=open?'#6fc59b':'#65515a';
      ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle=color;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.moveTo(0,-10);ctx.lineTo(0,10);ctx.stroke();
      ctx.fillStyle='#fff6e8';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=color;ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText(valve.label || (fire?'KATUP BARA':'KATUP AIR'),0,-18);
      if(open){ctx.fillStyle='#c9ffe1';ctx.font='bold 12px system-ui';ctx.textBaseline='top';ctx.fillText('✓',0,13);}
      else {ctx.globalAlpha=.65+.25*Math.sin(time*.006);ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }
  }


  function drawWindLevers(level, time) {
    for (const lever of (level.windLevers || [])) {
      const active = windLeverIsOn(lever.id);
      const color = lever.element === 'fire' ? '#ffb16d' : lever.element === 'water' ? '#8de7f2' : '#e8efff';
      ctx.save(); ctx.translate(lever.x,lever.y);
      ctx.shadowColor = color; ctx.shadowBlur = active ? 18 : 9;
      ctx.fillStyle = active ? '#78bd9c' : '#59628d';
      ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.strokeStyle = color; ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(active ? 9 : -8, active ? -15 : -12); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(active ? 9 : -8,active ? -15 : -12,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=color; ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillText(lever.label || 'TUAS ANGIN',0,-23);
      if (active) { ctx.fillStyle='#d8ffe8'; ctx.font='bold 12px system-ui'; ctx.textBaseline='top'; ctx.fillText('↔',0,14); }
      else { ctx.globalAlpha=.6+.25*Math.sin(time*.006); ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(0,0,19,0,Math.PI*2); ctx.stroke(); }
      ctx.restore();
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
      if (gate.w >= gate.h) {
        for(let x=gate.x+12;x<gate.x+gate.w-8;x+=25){ctx.beginPath();ctx.moveTo(x,gate.y+3);ctx.lineTo(x,gate.y+gate.h-3);ctx.stroke();}
        ctx.fillStyle='#fff4c8'; ctx.font='bold 17px system-ui'; ctx.textAlign='center'; ctx.fillText('✦',gate.x+gate.w/2,gate.y-12);
      } else {
        for(let y=gate.y+12;y<gate.y+gate.h-8;y+=25){ctx.beginPath();ctx.moveTo(gate.x+3,y);ctx.lineTo(gate.x+gate.w-3,y);ctx.stroke();}
        ctx.fillStyle='#fff4c8'; ctx.font='bold 17px system-ui'; ctx.textAlign='center'; ctx.fillText('✦',gate.x+gate.w/2,gate.y-12);
      }
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

  function drawExplorationNavigator(level, host, guest) {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const pixelScale = canvas.width / Math.max(1, rect.width);
    const margin = 8 * pixelScale;
    const panelW = 116 * pixelScale;
    const panelH = 88 * pixelScale;
    const panelX = canvas.width - panelW - margin;
    const panelY = displayMode === 'fullscreen' ? 72 * pixelScale : margin;
    const mapX = panelX + 7 * pixelScale;
    const mapY = panelY + 18 * pixelScale;
    const mapW = panelW - 14 * pixelScale;
    const mapH = panelH - 25 * pixelScale;
    const toMapX = worldX => mapX + (worldX / (level.worldWidth || ELEMENTAL_WORLD_WIDTH)) * mapW;
    const toMapY = worldY => mapY + (worldY / (level.worldHeight || ELEMENTAL_WORLD_HEIGHT)) * mapH;
    const ownElement = CHARACTER[role].element;
    const ownDoor = level.doors?.[ownElement] || level.exit;
    const ownColor = ownElement === 'fire' ? '#ffab65' : '#76e1ef';

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha = .94;
    ctx.fillStyle = 'rgba(22,27,47,.80)';
    roundedRect(ctx,panelX,panelY,panelW,panelH,9*pixelScale); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.36)'; ctx.lineWidth = Math.max(1,pixelScale); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = `800 ${7.5*pixelScale}px system-ui`; ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText('PETA EKSPLORASI',panelX+8*pixelScale,panelY+9*pixelScale);

    // Floor, platforms and shortcut bridges show the room's multiple routes.
    ctx.lineCap='round';
    for (const floor of level.floorSegments || []) {
      ctx.strokeStyle='rgba(255,255,255,.34)'; ctx.lineWidth=3*pixelScale;
      ctx.beginPath(); ctx.moveTo(toMapX(floor.x),toMapY(floor.y)); ctx.lineTo(toMapX(floor.x+floor.w),toMapY(floor.y)); ctx.stroke();
    }
    const elapsedMs=levelElapsedMs();
    for (const platform of level.platforms || []) {
      const state = getElementalPlatformState(platform,elapsedMs);
      if (!state.active) continue;
      ctx.strokeStyle = platform.id?.includes('-shortcut-') ? 'rgba(255,233,164,.95)' : platform.id?.includes('-side-') ? 'rgba(184,224,255,.92)' : 'rgba(255,255,255,.74)';
      ctx.lineWidth = (platform.id?.includes('-shortcut-') ? 2.4 : 1.8)*pixelScale;
      ctx.beginPath(); ctx.moveTo(toMapX(state.x),toMapY(state.y)); ctx.lineTo(toMapX(state.x+state.w),toMapY(state.y)); ctx.stroke();
    }
    if (level.gate && !gateIsOpen()) {
      ctx.strokeStyle='rgba(255,178,131,.95)'; ctx.lineWidth=3*pixelScale;
      ctx.beginPath();
      ctx.moveTo(toMapX(level.gate.x),toMapY(level.gate.y));
      ctx.lineTo(toMapX(level.gate.x+level.gate.w),toMapY(level.gate.y+level.gate.h));
      ctx.stroke();
    }
    for (const hazardSource of level.hazards || []) {
      if (hazardSource.valveId && valveIsOpen(hazardSource.valveId)) continue;
      const hazard=getElementalHazardState(hazardSource,elapsedMs);
      if (hazard.active===false) continue;
      ctx.fillStyle=hazard.type==='toxic' ? '#a6e56c' : (hazard.type==='fire' || hazard.type==='steam' ? '#ff9074' : '#63cbe1');
      ctx.beginPath(); ctx.arc(toMapX(hazard.x+hazard.w/2),toMapY(hazard.y+hazard.h/2),1.7*pixelScale,0,Math.PI*2); ctx.fill();
    }
    for (const element of ['fire','water']) {
      const door = level.doors?.[element];
      if (!door) continue;
      ctx.fillStyle = element === 'fire' ? '#ff9c58' : '#64d6e7';
      ctx.beginPath(); ctx.arc(toMapX(door.x+door.w/2),toMapY(door.y+door.h/2),2.7*pixelScale,0,Math.PI*2); ctx.fill();
      const plate=level.switches.find(item=>item.element===element);
      if (plate) {
        ctx.fillStyle=switchIsOn(element)?'#9dffc3':(element==='fire'?'#ffd1a4':'#c3f9ff');
        ctx.beginPath(); ctx.arc(toMapX(plate.x),toMapY(plate.y),2.2*pixelScale,0,Math.PI*2); ctx.fill();
      }
      const gem=level.gems.find(item=>item.element===element);
      if (gem && !levelState().gems?.[element]) {
        ctx.fillStyle='#ffe69b'; ctx.beginPath(); ctx.arc(toMapX(gem.x),toMapY(gem.y),1.9*pixelScale,0,Math.PI*2); ctx.fill();
      }
    }
    const camera = {x:canvasView.cameraX,y:canvasView.cameraY,w:canvasView.viewWidth,h:canvasView.viewHeight};
    ctx.strokeStyle='rgba(255,255,255,.78)'; ctx.lineWidth=1.25*pixelScale;
    ctx.strokeRect(toMapX(camera.x),toMapY(camera.y),(camera.w/(level.worldWidth||ELEMENTAL_WORLD_WIDTH))*mapW,(camera.h/(level.worldHeight||ELEMENTAL_WORLD_HEIGHT))*mapH);
    const playerDot = (player,color) => {
      if (!player) return;
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=5*pixelScale;
      ctx.beginPath(); ctx.arc(toMapX(player.x),toMapY(player.y),3.1*pixelScale,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    };
    playerDot(host,'#ff9e5e'); playerDot(guest,'#65d8e8');
    ctx.fillStyle='rgba(255,255,255,.78)';
    ctx.font=`600 ${5.5*pixelScale}px system-ui`; ctx.textAlign='right'; ctx.textBaseline='bottom';
    ctx.fillText('✦ Bara  ✧ Air',panelX+panelW-7*pixelScale,panelY+panelH-3*pixelScale);

    // When a player's own door is outside the camera, place a directional
    // marker at the edge of the visible screen so exploration never feels lost.
    if (ownDoor && !localPlayer.complete) {
      const targetX=(ownDoor.x+ownDoor.w/2-canvasView.cameraX)*canvasView.zoom;
      const targetY=(ownDoor.y+ownDoor.h/2-canvasView.cameraY)*canvasView.zoom;
      const inside=targetX>=0 && targetX<=canvas.width && targetY>=0 && targetY<=canvas.height;
      if (!inside) {
        const centerX=canvas.width/2, centerY=canvas.height/2;
        const angle=Math.atan2(targetY-centerY,targetX-centerX);
        const inset=17*pixelScale;
        const candidates=[];
        const dx=Math.cos(angle), dy=Math.sin(angle);
        if (dx>0) candidates.push((canvas.width-inset-centerX)/dx);
        if (dx<0) candidates.push((inset-centerX)/dx);
        if (dy>0) candidates.push((canvas.height-inset-centerY)/dy);
        if (dy<0) candidates.push((inset-centerY)/dy);
        const distance=Math.min(...candidates.filter(value=>value>0));
        let arrowX=centerX+dx*distance, arrowY=centerY+dy*distance;
        if (arrowX>panelX-7*pixelScale && arrowY<panelY+panelH+7*pixelScale) {
          arrowX=Math.max(inset,Math.min(canvas.width-panelW-18*pixelScale,arrowX));
          arrowY=Math.max(panelY+panelH+9*pixelScale,arrowY);
        }
        ctx.save(); ctx.translate(arrowX,arrowY); ctx.rotate(angle);
        ctx.fillStyle=ownColor; ctx.shadowColor=ownColor; ctx.shadowBlur=9*pixelScale;
        ctx.beginPath(); ctx.moveTo(10*pixelScale,0); ctx.lineTo(-7*pixelScale,-6*pixelScale); ctx.lineTo(-4*pixelScale,0); ctx.lineTo(-7*pixelScale,6*pixelScale); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawScene(time, dt = 1 / 60) {
    if (!ctx || currentView !== 'game') return;
    updateCamera(dt);
    const level = levelData();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    const z = canvasView.zoom;
    ctx.setTransform(z,0,0,z,canvasView.offsetX-canvasView.cameraX*z,canvasView.offsetY-canvasView.cameraY*z);
    drawBackground(level,time);
    drawFloorSegments(level);
    drawSkyDecor(level,time);
    drawAncientDecor(level,time);
    const elapsedMs = levelElapsedMs();
    drawIceZones(level,time);
    drawCurrentZones(level,time,elapsedMs);
    drawWindZones(level,time,elapsedMs);
    drawPlatforms(level, elapsedMs);
    drawHazards(level,time,elapsedMs);
    drawValves(level,time);
    drawWindLevers(level,time);
    drawCheckpoint(level);
    drawGems(level,time);
    drawSwitches(level,time);
    drawExit(level,time);
    const host = role === 'host' ? localPlayer : remoteRender;
    const guest = role === 'guest' ? localPlayer : remoteRender;
    drawSpirit(host,'fire',role!=='host',time);
    drawSpirit(guest,'water',role!=='guest',time);
    // Objective and transient feedback are shown in the HUD outside the arena.
    // Keep the world canvas clear, then draw a compact navigation overlay in screen space.
    ctx.restore();
    drawExplorationNavigator(level,host,guest);
  }

  function frame(timestamp) {
    if (destroyed) return;
    const dt = lastFrame ? Math.min(.05, (timestamp-lastFrame)/1000) : 0;
    lastFrame = timestamp;
    if (data.meta?.phase === 'playing' && currentView === 'game') {
      // Do not advance local physics until the shared Firebase clock has initialized.
      if (serverClockReady) physics(dt);
      const target = data.players?.[otherRole];
      if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
        remoteTarget = { x:target.x, y:target.y, dir:target.dir || (otherRole==='guest'?-1:1), complete:Boolean(target.complete) };
      }
      remoteRender.x += (remoteTarget.x-remoteRender.x)*.24;
      remoteRender.y += (remoteTarget.y-remoteRender.y)*.24;
      remoteRender.dir = remoteTarget.dir;
      remoteRender.complete = remoteTarget.complete;
      if (timestamp-lastHudFrameAt >= 180) { updateHud(); lastHudFrameAt = timestamp; }
    }
    drawScene(timestamp, dt);
    rafId = requestAnimationFrame(frame);
  }

  function handleSnapshot(snapshot) {
    data = snapshot.val() || {};
    if (!data.meta) void initialiseMeta();
    if (!data.players?.[role]) void initialisePlayer();
    const other = data.players?.[otherRole];
    if (other && Number(other.mapVersion) === ELEMENTAL_MAP_VERSION && Number.isFinite(other.x) && Number.isFinite(other.y)) {
      remoteTarget = { x:other.x, y:other.y, dir:other.dir || (otherRole==='guest'?-1:1), complete:Boolean(other.complete) };
      if (!lastFrame) remoteRender = { ...remoteTarget };
    } else {
      const safePartnerSpawn = createElementalPlayer(otherRole);
      remoteTarget = { x:safePartnerSpawn.x, y:safePartnerSpawn.y, dir:safePartnerSpawn.dir, complete:false };
      if (!lastFrame) remoteRender = { ...remoteTarget };
    }
    updateViewFromData();
  }

  shell();
  setControlMode('buttons');
  updateDisplayModeUI();
  unsubscribeServerClock = onValue(ref(db, '.info/serverTimeOffset'), snapshot => {
    elementalServerTimeOffset = Number(snapshot.val()) || 0;
    if (!serverClockReady) { serverClockReady = true; resolveServerClockReady(); }
  }, () => {
    // A failed offset read should not deadlock the lobby; use the local clock fallback.
    if (!serverClockReady) { serverClockReady = true; resolveServerClockReady(); }
  });
  unsubscribe = onValue(baseRef, handleSnapshot, error => notify(`Koneksi permainan terputus: ${error.message}`, 'error'));
  rafId = requestAnimationFrame(frame);

  return {
    destroy() {
      if (document.fullscreenElement === gamePanel && document.exitFullscreen) {
        try { const exitRequest = document.exitFullscreen(); exitRequest?.catch?.(() => {}); } catch {}
      }
      restoreFullPagePortal();
      document.documentElement.classList.remove('ed-game-active');
      document.body.classList.remove('ed-game-active');
      try { screen.orientation?.unlock?.(); } catch {}
      destroyed = true;
      if (unsubscribe) unsubscribe();
      if (unsubscribeServerClock) unsubscribeServerClock();
      if (rafId) cancelAnimationFrame(rafId);
      if (viewportResizeFrame) cancelAnimationFrame(viewportResizeFrame);
      if (playerWriteRetryTimer) window.clearTimeout(playerWriteRetryTimer);
      pendingPlayerPayload = null;
      document.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInput);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);

      screen.orientation?.removeEventListener?.('change', handleViewportChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (analogHandlers) {
        analogHandlers.pad.removeEventListener('pointerdown', analogHandlers.onDown);
        window.removeEventListener('pointermove', analogHandlers.onMove);
        window.removeEventListener('pointerup', analogHandlers.onUp);
        window.removeEventListener('pointercancel', analogHandlers.onUp);
      }
      clearInput();
    }
  };
}
