import { db, ref, get, set, remove, onValue, runTransaction } from '../firebase.js';
import { chooseDrawPrompt, getRemainingSeconds, formatDrawTime, sortStrokesByTime, sanitizeStroke, canStartRematch, canFinishRematch, createNextDrawRound, normalizeBrushWidth, chooseDifferentDrawPrompt } from './draw-together-logic.js?v=0.13.0';

const PALETTE = ['#25232b', '#3778d8', '#ed5b9d', '#9867d5', '#35a77b', '#f49a35', '#f1c433', '#e54f4f'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const uidPath = value => String(value).replace(/[.#$\[\]/]/g, '_');
const makeId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function mountDrawTogether(root, context) {
  const { code, session, room, role, player, onBack, toast = () => {} } = context;
  const { host, guest } = room;
  const myUid = player.uid;
  const opponentRole = role === 'host' ? 'guest' : 'host';
  const opponent = room[opponentRole];
  const basePath = `roomGames/${code}/${session.sessionId}/drawTogether`;
  const myStrokesPath = `${basePath}/strokes/${uidPath(myUid)}`;
  const metaRef = ref(db, `${basePath}/meta`);
  const drawRef = ref(db, basePath);
  let data = null;
  let serverOffset = 0;
  let readyBusy = false;
  let finishedBusy = false;
  let rematchBusy = false;
  let rematchResetBusy = false;
  let rematchClearBusy = false;
  let localRematchRound = null;
  let localClearedRound = null;
  let timerHandle = 0;
  let unsubscribe = null;
  let resizeObserver = null;
  let activeStroke = null;
  let activeCanvas = null;
  let selectedColor = PALETTE[0];
  let brushWidth = 6;
  let activeTool = 'pen';
  let writeQueue = Promise.resolve();
  let lastWriteAt = 0;
  let lastRenderedPhase = '';
  let destroyed = false;
  let canvasSizes = new WeakMap();

  const myName = room[role]?.name || 'Kamu';
  const opponentName = opponent?.name || (role === 'host' ? 'Pasangan' : 'Pembuat ruang');

  function buildShell() {
    root.innerHTML = `
      <section class="draw-together-shell">
        <header class="dt-header">
          <div><span class="dt-kicker">DIRI. · MINI GAME</span><h1>Gambar Bareng</h1><p>Satu instruksi, dua gambar, satu keseruan.</p></div>
          <div class="dt-header-actions"><span class="dt-room-code">${esc(code)}</span><button class="button button-quiet button-small" data-dt-action="back">Kembali</button></div>
        </header>
        <section class="dt-waiting-card" data-dt-panel="waiting">
          <div class="dt-game-icon">✎</div>
          <span class="dt-kicker">TANTANGAN HARI INI</span>
          <h2 data-dt-prompt>Menyiapkan instruksi…</h2>
          <p>Kalian akan mendapat instruksi yang sama. Gambar di kanvas masing-masing dan lihat coretan pasangan secara langsung.</p>
          <div class="dt-ready-people">
            <div class="dt-ready-person"><span class="dt-avatar">♡</span><strong>${esc(host.name || 'Pembuat ruang')}</strong><small data-dt-ready="host">Belum siap</small></div>
            <div class="dt-ready-divider">✦</div>
            <div class="dt-ready-person"><span class="dt-avatar">✿</span><strong>${esc(guest.name || 'Tamu')}</strong><small data-dt-ready="guest">Belum siap</small></div>
          </div>
          <button class="button button-primary dt-ready-button" data-dt-action="ready">Aku siap menggambar</button>
          <p class="dt-small-note">Waktu mulai setelah kalian berdua menekan tombol siap. Durasi 2 menit.</p>
        </section>
        <section class="dt-rematching-card" data-dt-panel="rematching" hidden>
          <div class="dt-game-icon">✦</div>
          <span class="dt-kicker">RONDE BARU</span>
          <h2>Menyiapkan kanvas lagi…</h2>
          <p data-dt-rematching-status>Kalian berdua sudah setuju bermain lagi. Kami sedang membersihkan kanvas ronde sebelumnya.</p>
          <div class="dt-ready-people">
            <div class="dt-ready-person"><span class="dt-avatar">♡</span><strong>${esc(host.name || 'Pembuat ruang')}</strong><small data-dt-cleared="host">Menyiapkan…</small></div>
            <div class="dt-ready-divider">✦</div>
            <div class="dt-ready-person"><span class="dt-avatar">✿</span><strong>${esc(guest.name || 'Tamu')}</strong><small data-dt-cleared="guest">Menyiapkan…</small></div>
          </div>
        </section>
        <section class="dt-play-area" data-dt-panel="playing" hidden>
          <div class="dt-prompt-bar"><div><span class="dt-kicker">GAMBAR INI</span><strong data-dt-live-prompt></strong></div><div class="dt-timer" data-dt-timer>2:00</div></div>
          <div class="dt-canvases">
            <article class="dt-canvas-card is-mine"><div class="dt-canvas-heading"><div><strong>${esc(myName)}</strong><small>Gambarmu</small></div><span class="dt-live-pill">Kamu</span></div><canvas class="dt-canvas" data-dt-canvas="mine" aria-label="Kanvas menggambar milikmu"></canvas></article>
            <article class="dt-canvas-card"><div class="dt-canvas-heading"><div><strong>${esc(opponentName)}</strong><small>Terlihat langsung</small></div><span class="dt-live-pill is-partner" data-dt-opponent-status>Menyiapkan</span></div><canvas class="dt-canvas" data-dt-canvas="partner" aria-label="Kanvas gambar pasangan" aria-readonly="true"></canvas></article>
          </div>
          <section class="dt-tools">
            <div class="dt-tool-row"><strong>Warna</strong><div class="dt-palette">${PALETTE.map((color,index)=>`<button class="dt-color ${index===0?'selected':''}" data-dt-color="${color}" style="--swatch:${color}" aria-label="Warna ${index+1}" title="Warna ${index+1}"></button>`).join('')}</div></div>
            <div class="dt-tool-row dt-brush-row"><strong>Ukuran kuas</strong><div class="dt-brush-control"><input class="dt-brush-slider" data-dt-brush-slider type="range" min="1" max="24" step="1" value="6" aria-label="Ukuran kuas"><output data-dt-brush-value>6 px</output></div><button class="dt-brush" data-dt-tool="eraser">Penghapus</button></div>
            <div class="dt-tool-actions"><button class="button button-quiet" data-dt-action="undo">↶ Urungkan goresan</button><span class="dt-my-status" data-dt-my-status>Silakan mulai menggambar.</span><button class="button button-primary" data-dt-action="finish">Selesai menggambar</button></div>
          </section>
          <p class="dt-small-note">Coretanmu akan muncul di perangkat pasangan. Kalau kamu selesai lebih dulu, pasangan tetap bisa melanjutkan gambar.</p>
        </section>
        <section class="dt-result-card" data-dt-panel="result" hidden>
          <span class="dt-kicker">HASIL KARYA KALIAN</span><h2>Waktunya melihat hasilnya! ♡</h2>
          <p data-dt-result-prompt></p>
          <div class="dt-result-grid"><div><strong>${esc(host.name || 'Pembuat ruang')}</strong><canvas class="dt-result-canvas" data-dt-result="host"></canvas></div><div><strong>${esc(guest.name || 'Tamu')}</strong><canvas class="dt-result-canvas" data-dt-result="guest"></canvas></div></div>
          <div class="dt-rematch-status" role="status" aria-live="polite">
            <div><strong>${esc(host.name || 'Pembuat ruang')}</strong><span data-dt-rematch="host">Belum memilih</span></div>
            <div><strong>${esc(guest.name || 'Tamu')}</strong><span data-dt-rematch="guest">Belum memilih</span></div>
          </div>
          <div class="dt-result-actions">
            <button class="button button-primary dt-rematch-button" data-dt-action="rematch">Main lagi</button>
            <button class="button button-quiet" data-dt-action="download">Unduh gambar berdua</button>
          </div>
          <p class="dt-small-note" data-dt-rematch-note>Kalian berdua perlu memilih Main lagi untuk memulai ronde baru.</p>
        </section>
      </section>`;
    attachCanvasEvents();
    root.addEventListener('click', clickHandler);
    root.addEventListener('input', inputHandler);
    window.addEventListener('resize', onResize, { passive: true });
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => resizeCanvases());
      root.querySelectorAll('.dt-canvas').forEach(canvas => resizeObserver.observe(canvas));
    }
  }

  function canvasContext(canvas) {
    return canvas?.getContext('2d', { alpha: false }) || null;
  }

  function prepareCanvas(canvas) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    const old = canvasSizes.get(canvas);
    if (old?.width === width && old?.height === height) return;
    canvas.width = width;
    canvas.height = height;
    canvasSizes.set(canvas, { width, height, dpr });
    renderCanvas(canvas, canvas.dataset.dtCanvas === 'mine' ? myUid : opponent.uid);
  }

  function drawStroke(ctx, stroke, width, height) {
    const clean = sanitizeStroke(stroke);
    if (!clean) return;
    const points = clean.points;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = clean.width;
    ctx.strokeStyle = clean.tool === 'eraser' ? '#ffffff' : clean.color;
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    if (points.length === 1) {
      ctx.lineTo(points[0].x * width + 0.01, points[0].y * height + 0.01);
    } else {
      for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x * width, points[index].y * height);
    }
    ctx.stroke();
    ctx.restore();
  }

  function renderCanvas(canvas, uid) {
    if (!canvas) return;
    const ctx = canvasContext(canvas);
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    const strokes = sortStrokesByTime(data?.strokes || {}).filter(stroke => stroke.uid === uid);
    for (const stroke of strokes) drawStroke(ctx, stroke, width, height);
    if (activeStroke && uid === myUid && activeCanvas === canvas) drawStroke(ctx, activeStroke, width, height);
  }

  function redrawCanvases() {
    root.querySelectorAll('.dt-canvas').forEach(canvas => {
      prepareCanvas(canvas);
      renderCanvas(canvas, canvas.dataset.dtCanvas === 'mine' ? myUid : opponent.uid);
    });
    root.querySelectorAll('.dt-result-canvas').forEach(canvas => {
      const uid = canvas.dataset.dtResult === 'host' ? host.uid : guest.uid;
      const ctx = canvasContext(canvas);
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(rect.width * dpr), height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
      sortStrokesByTime(data?.strokes || {}).filter(stroke => stroke.uid === uid).forEach(stroke => drawStroke(ctx, stroke, width, height));
    });
  }

  function resizeCanvases() {
    if (destroyed) return;
    redrawCanvases();
  }
  function onResize() { resizeCanvases(); }

  function pointFromEvent(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    };
  }

  function enqueueStrokeWrite(stroke, ended = false) {
    const payload = { color: stroke.color, width: stroke.width, tool: stroke.tool, points: stroke.points.slice(-400), createdAt: stroke.createdAt, ended };
    const path = `${myStrokesPath}/${stroke.id}`;
    writeQueue = writeQueue.then(() => set(ref(db, path), payload)).catch(error => {
      toast(`Goresan belum tersinkron: ${error.message}. Periksa koneksi lalu lanjutkan.`, 'error');
    });
    return writeQueue;
  }

  function attachCanvasEvents() {
    const canvas = root.querySelector('[data-dt-canvas="mine"]');
    if (!canvas) return;
    canvas.addEventListener('pointerdown', event => {
      if (!data?.meta || data.meta.phase !== 'playing' || data.finished?.[role] || getRemainingSeconds(data.meta.startedAt, data.meta.durationSeconds, Date.now() + serverOffset) <= 0 || activeStroke) return;
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      activeCanvas = canvas;
      activeStroke = {
        id: makeId(), color: selectedColor, width: brushWidth,
        tool: activeTool, points: [pointFromEvent(event, canvas)], createdAt: Date.now()
      };
      renderCanvas(canvas, myUid);
      lastWriteAt = 0;
      enqueueStrokeWrite(activeStroke, false);
    }, { passive: false });
    canvas.addEventListener('pointermove', event => {
      if (!activeStroke || activeCanvas !== canvas) return;
      event.preventDefault();
      const point = pointFromEvent(event, canvas);
      const prev = activeStroke.points.at(-1);
      if (!prev || Math.hypot(point.x-prev.x, point.y-prev.y) > 0.0015) activeStroke.points.push(point);
      renderCanvas(canvas, myUid);
      if (activeStroke.points.length >= 400) activeStroke.points = activeStroke.points.filter((_,index)=>index%2===0);
      const now = Date.now();
      if (now - lastWriteAt >= 90) { lastWriteAt = now; enqueueStrokeWrite(activeStroke, false); }
    }, { passive: false });
    const finishStroke = () => {
      if (!activeStroke || activeCanvas !== canvas) return;
      const finalStroke = activeStroke;
      activeStroke = null;
      activeCanvas = null;
      enqueueStrokeWrite(finalStroke, true);
      renderCanvas(canvas, myUid);
    };
    canvas.addEventListener('pointerup', finishStroke);
    canvas.addEventListener('pointercancel', finishStroke);
    canvas.addEventListener('lostpointercapture', finishStroke);
  }

  function updateButtons() {
    const readyButton = root.querySelector('[data-dt-action="ready"]');
    if (readyButton) {
      readyButton.disabled = Boolean(data?.ready?.[role] || readyBusy || !data?.meta);
      readyButton.textContent = data?.ready?.[role] ? 'Kamu sudah siap ✓' : readyBusy ? 'Menyimpan…' : 'Aku siap menggambar';
    }
    const finished = Boolean(data?.finished?.[role]);
    const finishButton = root.querySelector('[data-dt-action="finish"]');
    if (finishButton) { finishButton.disabled = finished || !data?.meta || data.meta.phase !== 'playing'; finishButton.textContent = finished ? 'Gambar selesai ✓' : 'Selesai menggambar'; }
    const undo = root.querySelector('[data-dt-action="undo"]');
    if (undo) undo.disabled = finished || !Object.keys(data?.strokes?.[myUid] || {}).length;
    const rematchButton = root.querySelector('[data-dt-action="rematch"]');
    if (rematchButton) {
      const roundKey = Number(data?.meta?.createdAt);
      const requested = Number(data?.rematchRequests?.[role]) === roundKey || localRematchRound === roundKey;
      rematchButton.disabled = requested || rematchBusy || data?.meta?.phase !== 'result';
      rematchButton.textContent = requested ? 'Menunggu pasangan…' : rematchBusy ? 'Mengirim permintaan…' : 'Main lagi';
    }
    const canvas = root.querySelector('[data-dt-canvas="mine"]');
    if (canvas) canvas.classList.toggle('is-locked', finished || data?.meta?.phase !== 'playing');
  }

  function render() {
    if (destroyed || !data) return;
    const meta = data.meta;
    if (!meta) {
      const prompt = root.querySelector('[data-dt-prompt]');
      if (prompt) prompt.textContent = 'Menyiapkan instruksi…';
      return;
    }
    root.querySelector('[data-dt-prompt]').textContent = meta.prompt;
    root.querySelector('[data-dt-live-prompt]').textContent = meta.prompt;
    root.querySelector('[data-dt-result-prompt]').textContent = `Instruksi: ${meta.prompt}`;
    const phase = meta.phase || 'ready';
    root.querySelector('[data-dt-panel="waiting"]').hidden = phase !== 'ready';
    root.querySelector('[data-dt-panel="playing"]').hidden = phase !== 'playing';
    root.querySelector('[data-dt-panel="result"]').hidden = phase !== 'result';
    root.querySelector('[data-dt-panel="rematching"]').hidden = phase !== 'rematching';
    for (const playerRole of ['host', 'guest']) {
      const cleared = root.querySelector(`[data-dt-cleared="${playerRole}"]`);
      const locallyCleared = playerRole === role && localClearedRound === Number(meta.createdAt);
      if (cleared) cleared.textContent = (Number(data.rematchCleared?.[playerRole]) === Number(meta.createdAt) || locallyCleared) ? 'Siap ✓' : 'Menyiapkan…';
    }
    const rematchingStatus = root.querySelector('[data-dt-rematching-status]');
    if (rematchingStatus) rematchingStatus.textContent = 'Kalian berdua sudah setuju. Menyiapkan ulang kanvas dan instruksi…';
    root.querySelector('[data-dt-ready="host"]').textContent = data.ready?.host ? 'Siap menggambar ✓' : 'Belum siap';
    root.querySelector('[data-dt-ready="guest"]').textContent = data.ready?.guest ? 'Siap menggambar ✓' : 'Belum siap';
    const opponentStatus = root.querySelector('[data-dt-opponent-status]');
    if (opponentStatus) opponentStatus.textContent = data.finished?.[opponentRole] ? 'Selesai ✓' : 'Menggambar';
    const currentRoundKey = Number(meta.createdAt);
    for (const playerRole of ['host', 'guest']) {
      const status = root.querySelector(`[data-dt-rematch="${playerRole}"]`);
      const locallyRequested = playerRole === role && localRematchRound === currentRoundKey;
      if (status) status.textContent = (Number(data.rematchRequests?.[playerRole]) === currentRoundKey || locallyRequested) ? 'Siap main lagi ✓' : 'Belum memilih';
    }
    const rematchNote = root.querySelector('[data-dt-rematch-note]');
    if (rematchNote) {
      const mineAsked = Number(data.rematchRequests?.[role]) === currentRoundKey || localRematchRound === currentRoundKey;
      const partnerAsked = Number(data.rematchRequests?.[opponentRole]) === currentRoundKey;
      rematchNote.textContent = mineAsked && partnerAsked ? 'Menyiapkan ronde baru…' : mineAsked ? 'Permintaan terkirim. Menunggu pasangan memilih Main lagi.' : partnerAsked ? 'Pasangan ingin bermain lagi. Pilih Main lagi untuk melanjutkan.' : 'Kalian berdua perlu memilih Main lagi untuk memulai ronde baru.';
    }
    const myStatus = root.querySelector('[data-dt-my-status]');
    if (myStatus) myStatus.textContent = data.finished?.[role] ? 'Kamu sudah selesai. Menunggu pasangan…' : 'Coretan tersinkron langsung.';
    const time = getRemainingSeconds(meta.startedAt, meta.durationSeconds, Date.now() + serverOffset);
    const timerEl = root.querySelector('[data-dt-timer]');
    if (timerEl) timerEl.textContent = formatDrawTime(time);
    if (phase === 'result') redrawCanvases();
    else if (phase === 'playing') redrawCanvases();
    updateButtons();
  }

  async function ensureMeta() {
    if (role !== 'host') return;
    await runTransaction(metaRef, current => current || ({
      prompt: chooseDrawPrompt(),
      durationSeconds: 120,
      createdAt: Date.now(),
      startedAt: 0,
      phase: 'ready'
    }), { applyLocally: false });
  }

  async function requestRematch() {
    const roundKey = Number(data?.meta?.createdAt);
    if (rematchBusy || data?.meta?.phase !== 'result' || !Number.isFinite(roundKey)) return;
    if (Number(data?.rematchRequests?.[role]) === roundKey || localRematchRound === roundKey) return;
    rematchBusy = true;
    updateButtons();
    try {
      // Keep the completed drawings intact until both players agree to rematch.
      await set(ref(db, `${basePath}/rematchRequests/${role}`), roundKey);
      localRematchRound = roundKey;
      toast('Permintaan main lagi terkirim. Menunggu pasangan…', 'success');
      updateButtons();
    } catch (error) {
      toast(`Belum bisa meminta main lagi: ${error.message}`, 'error');
    } finally {
      rematchBusy = false;
      updateButtons();
    }
  }

  async function beginRematchReset() {
    if (role !== 'host' || rematchResetBusy || data?.meta?.phase !== 'result') return;
    const roundKey = Number(data.meta.createdAt);
    if (!canStartRematch(data.meta, data.rematchRequests)) return;
    rematchResetBusy = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'result' || Number(current.createdAt) !== roundKey) return;
        return { ...current, phase: 'rematching' };
      }, { applyLocally: false });
    } catch (error) {
      toast(`Persiapan main lagi gagal: ${error.message}`, 'error');
    } finally {
      rematchResetBusy = false;
    }
  }

  async function clearOwnStrokesForRematch() {
    if (rematchClearBusy || data?.meta?.phase !== 'rematching') return;
    const roundKey = Number(data.meta.createdAt);
    if (Number(data?.rematchCleared?.[role]) === roundKey || localClearedRound === roundKey) return;
    rematchClearBusy = true;
    try {
      await writeQueue;
      const mineSnapshot = await get(ref(db, myStrokesPath));
      const mine = mineSnapshot.val() || {};
      await Promise.all(Object.keys(mine).map(strokeId => remove(ref(db, `${myStrokesPath}/${strokeId}`))));
      await set(ref(db, `${basePath}/ready/${role}`), false);
      await set(ref(db, `${basePath}/finished/${role}`), false);
      await set(ref(db, `${basePath}/rematchCleared/${role}`), roundKey);
      localClearedRound = roundKey;
    } catch (error) {
      toast(`Kanvas belum berhasil disiapkan ulang: ${error.message}`, 'error');
    } finally {
      rematchClearBusy = false;
    }
  }

  async function finishRematchReset() {
    if (role !== 'host' || rematchResetBusy || data?.meta?.phase !== 'rematching') return;
    const roundKey = Number(data.meta.createdAt);
    if (!canFinishRematch(data.meta, data.rematchCleared)) return;
    rematchResetBusy = true;
    try {
      const nextMeta = createNextDrawRound(data.meta, chooseDifferentDrawPrompt(data.meta.prompt), Date.now() + serverOffset);
      const result = await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'rematching' || Number(current.createdAt) !== roundKey) return;
        return nextMeta;
      }, { applyLocally: false });
      if (result.committed) toast('Ronde baru siap! Pilih “Aku siap menggambar” untuk mulai.', 'success');
    } catch (error) {
      toast(`Ronde baru belum bisa dimulai: ${error.message}`, 'error');
    } finally {
      rematchResetBusy = false;
    }
  }

  async function markReady() {
    if (readyBusy || data?.ready?.[role]) return;
    readyBusy = true; updateButtons();
    try { await set(ref(db, `${basePath}/ready/${role}`), true); }
    catch (error) { toast(`Belum bisa menyimpan kesiapan: ${error.message}`, 'error'); }
    finally { readyBusy = false; updateButtons(); }
  }

  async function tryStart() {
    if (role !== 'host' || !data?.meta || data.meta.phase !== 'ready' || !data.ready?.host || !data.ready?.guest) return;
    await runTransaction(metaRef, current => {
      if (!current || current.phase !== 'ready') return;
      return { ...current, phase: 'playing', startedAt: Date.now() + serverOffset };
    }, { applyLocally: false });
  }

  async function finishDrawing() {
    if (finishedBusy || data?.finished?.[role]) return;
    finishedBusy = true; updateButtons();
    try { await writeQueue; await set(ref(db, `${basePath}/finished/${role}`), true); }
    catch (error) { toast(`Status selesai belum tersimpan: ${error.message}`, 'error'); }
    finally { finishedBusy = false; updateButtons(); }
  }

  async function undoStroke() {
    await writeQueue;
    const mine = data?.strokes?.[myUid] || {};
    const last = Object.entries(mine).sort((a,b)=>(Number(a[1]?.createdAt)||0)-(Number(b[1]?.createdAt)||0)).at(-1);
    if (!last) return;
    try { await remove(ref(db, `${myStrokesPath}/${last[0]}`)); }
    catch (error) { toast(`Goresan belum bisa diurungkan: ${error.message}`, 'error'); }
  }

  async function completeRound() {
    if (data?.meta?.phase !== 'playing') return;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing') return;
        return { ...current, phase: 'result', endedAt: Date.now() + serverOffset };
      }, { applyLocally: false });
    } catch (error) { toast(`Belum bisa menyelesaikan ronde: ${error.message}`, 'error'); }
  }

  function updateTimer() {
    if (!data?.meta || data.meta.phase !== 'playing') return;
    const remaining = getRemainingSeconds(data.meta.startedAt, data.meta.durationSeconds, Date.now() + serverOffset);
    const timer = root.querySelector('[data-dt-timer]');
    if (timer) timer.textContent = formatDrawTime(remaining);
    if (remaining <= 0) {
      if (!data.finished?.[role]) void finishDrawing();
      void completeRound();
    }
    if (data.finished?.host && data.finished?.guest) void completeRound();
  }

  function clickHandler(event) {
    const action = event.target.closest('[data-dt-action]');
    const colorButton = event.target.closest('[data-dt-color]');
    const toolButton = event.target.closest('[data-dt-tool]');
    if (colorButton) {
      selectedColor = colorButton.dataset.dtColor;
      activeTool = 'pen';
      root.querySelectorAll('[data-dt-color]').forEach(button=>button.classList.toggle('selected',button===colorButton));
      root.querySelectorAll('[data-dt-tool]').forEach(button=>button.classList.remove('selected'));
      return;
    }
    if (toolButton) {
      activeTool = 'eraser';
      root.querySelectorAll('[data-dt-tool]').forEach(button=>button.classList.toggle('selected',button===toolButton));
      root.querySelectorAll('[data-dt-color]').forEach(button=>button.classList.remove('selected'));
      return;
    }
    if (!action) return;
    event.preventDefault();
    const name = action.dataset.dtAction;
    if (name === 'ready') void markReady();
    if (name === 'finish') void finishDrawing();
    if (name === 'undo') void undoStroke();
    if (name === 'back') onBack?.();
    if (name === 'download') downloadResult();
    if (name === 'rematch') void requestRematch();
  }

  function inputHandler(event) {
    const slider = event.target.closest('[data-dt-brush-slider]');
    if (!slider) return;
    brushWidth = normalizeBrushWidth(slider.value);
    const output = root.querySelector('[data-dt-brush-value]');
    if (output) output.textContent = `${brushWidth} px`;
    slider.style.setProperty('--brush-progress', `${((brushWidth - 1) / 23) * 100}%`);
  }

  function drawResultPanel(ctx, uid, x, y, width, height) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, width, height);
    ctx.save();
    ctx.translate(x, y);
    const strokes = sortStrokesByTime(data?.strokes || {}).filter(stroke => stroke.uid === uid);
    strokes.forEach(stroke => drawStroke(ctx, stroke, width, height));
    ctx.restore();
  }

  function downloadResult() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600; canvas.height = 1120;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff4fa'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#282331'; ctx.textAlign = 'center'; ctx.font = 'bold 52px system-ui'; ctx.fillText('Gambar Bareng · Diri.',800,92);
      ctx.fillStyle = '#716778'; ctx.font = '28px system-ui'; ctx.fillText(data.meta.prompt,800,145);
      ctx.fillStyle = '#fff'; ctx.fillRect(70,205,710,820); ctx.fillRect(820,205,710,820);
      ctx.fillStyle = '#282331'; ctx.textAlign = 'left'; ctx.font = 'bold 28px system-ui'; ctx.fillText(host.name || 'Pembuat ruang',95,190); ctx.fillText(guest.name || 'Tamu',845,190);
      drawResultPanel(ctx,host.uid,90,225,670,760);
      drawResultPanel(ctx,guest.uid,840,225,670,760);
      ctx.textAlign = 'center'; ctx.fillStyle = '#8e7185'; ctx.font = '22px system-ui'; ctx.fillText('Dua tempat · Satu keseruan',800,1080);
      canvas.toBlob(blob => {
        if (!blob) { toast('Gambar belum berhasil disiapkan. Coba unduh sekali lagi.', 'error'); return; }
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `diri-gambar-bareng-${code}.png`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1500);
      }, 'image/png');
    } catch (error) { toast(`Hasil gambar belum bisa diunduh: ${error.message}`, 'error'); }
  }

  async function init() {
    try {
      const offset = await get(ref(db, '.info/serverTimeOffset'));
      serverOffset = Number(offset.val()) || 0;
    } catch { serverOffset = 0; }
    if (role === 'host') await ensureMeta();
    unsubscribe = onValue(drawRef, snapshot => {
      data = snapshot.val() || {};
      if (data.meta?.phase === 'ready') void tryStart();
      if (data.meta?.phase === 'result' && canStartRematch(data.meta, data.rematchRequests)) void beginRematchReset();
      if (data.meta?.phase === 'rematching') {
        void clearOwnStrokesForRematch();
        if (canFinishRematch(data.meta, data.rematchCleared)) void finishRematchReset();
      }
      if (data.meta?.phase === 'playing' && data.finished?.host && data.finished?.guest) void completeRound();
      const phase = data.meta?.phase || 'loading';
      if (phase !== lastRenderedPhase) {
        lastRenderedPhase = phase;
        if (phase === 'playing' || phase === 'result') redrawCanvases();
      }
      render();
    }, error => toast(`Koneksi Gambar Bareng terputus: ${error.message}`, 'error'));
    timerHandle = window.setInterval(updateTimer, 250);
  }

  buildShell();
  void init().catch(error => toast(`Gambar Bareng gagal disiapkan: ${error.message}`, 'error'));

  return {
    destroy() {
      destroyed = true;
      if (unsubscribe) unsubscribe();
      if (timerHandle) clearInterval(timerHandle);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('input', inputHandler);
    }
  };
}
