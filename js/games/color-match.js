import { db, ref, get, set, update, onValue, runTransaction } from '../firebase.js';
import { makeColor, colorAccuracy, colorHex } from './brain-game-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const SHOW_MS = { easy: 5200, normal: 3600, hard: 2300 };
const DIFFICULTY_LABELS = { easy: 'Santai', normal: 'Sedang', hard: 'Sulit' };

export function mountColorMatch(root, context) {
  const { code, session, room, role, player, standalone = false, onBack, toast = () => {} } = context;
  const base = standalone ? '' : `roomGames/${code}/${session.sessionId}/public`;
  const privateRoot = standalone ? '' : `privateRooms/${code}/colormatch/${session.sessionId}`;
  const baseRef = base ? ref(db, base) : null;
  const myUid = player?.uid || 'local';
  const names = standalone ? { host: 'Kamu', guest: 'Pasangan' } : { host: room.host?.name || 'Host', guest: room.guest?.name || 'Guest' };
  let pub = {};
  let phase = standalone ? 'setup' : 'waiting';
  let local = { mode: 'versus', difficulty: 'normal', round: 1, target: null, guess: { r: 128, g: 128, b: 128 }, scores: [], roundResults: [], previewStartedAt: 0 };
  let draftGuess = { r: 128, g: 128, b: 128 };
  let timer = null;
  let remainingMs = 0;
  let unsubscribePublic = null;
  let unsubscribePrivate = null;
  let busy = false;
  let advancing = false;
  let processingRound = ''; 
  let destroyed = false;
  let partnerPrivate = null;
  let minePrivate = null;

  const minePath = round => `${privateRoot}/${myUid}/rounds/${round}`;
  const setLocalColor = (channel, value) => { draftGuess = { ...draftGuess, [channel]: Number(value) }; render(); };

  function setupPanel() {
    if (standalone) return `<section class="bm-panel cm-setup"><span class="bm-tag">5 RONDE · LATIH INGATAN</span><h2>Seberapa akurat ingatan warnamu?</h2><p>Lihat warna selama beberapa detik, lalu susun kembali dengan tiga slider RGB.</p><label>Tingkat kesulitan<select data-cm-local-difficulty><option value="easy">Santai · 5 detik</option><option value="normal" selected>Sedang · 3,6 detik</option><option value="hard">Sulit · 2,3 detik</option></select></label><button class="button button-primary" data-cm-action="local-start">Mulai Color Match →</button></section>`;
    const settings = pub.settings || { mode: 'versus', difficulty: 'normal' };
    return `<section class="bm-panel cm-setup"><span class="bm-tag">PENGATURAN PERMAINAN</span><h2>Color Match</h2><p>Lihat warna, ingat komposisinya, lalu bangun kembali dengan slider merah, hijau, dan biru. Setelah lima ronde, semua hasil muncul dalam satu rekap.</p><div class="cm-setting-grid"><label>Mode permainan<select data-cm-setting="mode" ${role !== 'host' ? 'disabled' : ''}><option value="versus" ${settings.mode === 'versus' ? 'selected' : ''}>Versus · Adu akurasi</option><option value="duet" ${settings.mode === 'duet' ? 'selected' : ''}>Duet · Beri petunjuk</option></select></label><label>Kesulitan<select data-cm-setting="difficulty" ${role !== 'host' ? 'disabled' : ''}><option value="easy" ${settings.difficulty === 'easy' ? 'selected' : ''}>Santai · 5 detik</option><option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Sedang · 3,6 detik</option><option value="hard" ${settings.difficulty === 'hard' ? 'selected' : ''}>Sulit · 2,3 detik</option></select></label></div><div class="bm-result-actions">${role === 'host' ? '<button class="button button-primary" data-cm-action="start">Mulai 5 ronde →</button>' : '<span class="bm-muted">Menunggu pembuat sesi memulai Color Match.</span>'}</div></section>`;
  }

  function colorPreview(color, visible = true) {
    return `<div class="cm-color-swatch ${visible ? '' : 'is-hidden'}" style="--target-color:${visible ? colorHex(color) : '#d9d9e4'}"><span>${visible ? 'INGAT WARNA INI' : 'WARNA DISIMPAN'}</span></div>`;
  }

  function sliders(guess, disabled = false) {
    return `<div class="cm-sliders"><label class="cm-slider-row cm-red"><span>R</span><input type="range" min="0" max="255" value="${guess.r}" data-cm-slider="r" ${disabled ? 'disabled' : ''}><output>${guess.r}</output></label><label class="cm-slider-row cm-green"><span>G</span><input type="range" min="0" max="255" value="${guess.g}" data-cm-slider="g" ${disabled ? 'disabled' : ''}><output>${guess.g}</output></label><label class="cm-slider-row cm-blue"><span>B</span><input type="range" min="0" max="255" value="${guess.b}" data-cm-slider="b" ${disabled ? 'disabled' : ''}><output>${guess.b}</output></label></div><div class="cm-guess-preview" style="--guess-color:${colorHex(guess)}"></div>`;
  }

  function previewPanel() {
    const meta = pub.meta || {};
    const isDuetClue = !standalone && pub.settings?.mode === 'duet' && role === 'host';
    const target = standalone ? local.target : isDuetClue ? minePrivate?.rounds?.[meta.round]?.target : pub.previewColor;
    const show = standalone || pub.settings?.mode === 'versus' || isDuetClue;
    return `<section class="bm-panel cm-play-panel"><div class="bm-topline"><span class="bm-tag">RONDE ${standalone ? local.round : meta.round || 1} / 5</span><strong data-cm-countdown></strong></div><h2>Perhatikan warnanya</h2><p>${isDuetClue ? 'Jadilah navigator: warna ini akan tetap terlihat olehmu. Bantu pasangan melalui petunjuk suara.' : 'Ingat warna yang muncul. Setelah menghilang, susun kembali menggunakan slider.'}</p>${colorPreview(target, show)}<div class="cm-preview-progress"><i data-cm-preview-bar></i></div><p class="bm-muted">${DIFFICULTY_LABELS[standalone ? local.difficulty : pub.settings?.difficulty || 'normal']} · ${standalone ? SHOW_MS[local.difficulty] / 1000 : SHOW_MS[pub.settings?.difficulty || 'normal'] / 1000} detik</p></section>`;
  }

  function guessingPanel() {
    const meta = pub.meta || {};
    const mode = standalone ? 'versus' : pub.settings?.mode || 'versus';
    const clueRole = pub.settings?.clueRole || 'host';
    const isClue = !standalone && mode === 'duet' && role === clueRole;
    const submitted = standalone ? false : pub.submissions?.[role] === true;
    const count = standalone ? local.round : Number(meta.round || 1);
    const color = draftGuess;
    return `<section class="bm-panel cm-play-panel"><div class="bm-topline"><span class="bm-tag">RONDE ${count} / 5</span><strong>${mode === 'duet' ? 'DUET' : 'VERSUS'}</strong></div><h2>${isClue ? 'Bantu pasangan menebak' : 'Susun kembali warna'}</h2><p>${isClue ? 'Warna tetap terlihat di perangkatmu. Beri petunjuk lewat panggilan atau chat. Jangan menyebut angka RGB.' : 'Atur nilai merah, hijau, dan biru sampai warna perkiraanmu mendekati warna target.'}</p>${isClue ? colorPreview(minePrivate?.rounds?.[count]?.target, true) : sliders(color, submitted)}${isClue ? '<div class="bm-muted">Menunggu pasangan mengunci tebakan…</div>' : `<button class="button button-primary" data-cm-action="submit" ${submitted ? 'disabled' : ''}>${submitted ? 'Tebakan terkunci ✓' : 'Kunci tebakan'}</button>`}</section>`;
  }

  function recapRoundCard(item, mode, index) {
    const rows = mode === 'duet' ? ['guest'] : standalone ? ['host'] : ['host', 'guest'];
    return `<article class="cm-round-card"><div class="cm-round-card-head"><span>RONDE ${index + 1}</span><b>${Math.round(rows.reduce((sum, r) => sum + Number(item.scores?.[r] || 0), 0) / rows.length)}% rata-rata</b></div><div class="cm-round-color-pair"><div><small>WARNA ASLI</small><i style="--guess-color:${colorHex(item.target)}"></i></div>${rows.map(r => `<div><small>${esc(names[r])}</small><i style="--guess-color:${colorHex(item.guesses?.[r] || item.target)}"></i><b>${Math.round(item.scores?.[r] || 0)}%</b></div>`).join('')}</div></article>`;
  }

  function finishedPanel() {
    const mode = standalone ? 'solo' : pub.settings?.mode || 'versus';
    const results = standalone ? local.roundResults : Object.values(pub.roundResults || {}).sort((a, b) => Number(a.round) - Number(b.round));
    const rows = standalone ? ['host'] : mode === 'duet' ? ['guest'] : ['host', 'guest'];
    const totals = standalone
      ? { host: local.scores.length ? Math.round(local.scores.reduce((a,b) => a + b, 0) / local.scores.length) : 0, guest: 0 }
      : (pub.totals || {});
    const average = r => standalone ? Number(totals[r] || 0) : Math.round(Number(totals[r] || 0) / Math.max(1, results.length));
    const winner = standalone ? 'Latihan selesai!' : mode === 'duet' ? 'Duet selesai!' : (Number(totals.host || 0) === Number(totals.guest || 0) ? 'Seri!' : Number(totals.host || 0) > Number(totals.guest || 0) ? `${names.host} menang!` : `${names.guest} menang!`);
    return `<section class="bm-panel cm-finish-panel"><span class="bm-tag">REKAPAN COLOR MATCH</span><h2>${winner}</h2><p>Lima ronde selesai. Semua hasil dirangkum di sini, tanpa perlu membuka hasil ronde satu per satu.</p><div class="cm-total-grid">${rows.map(r => `<article><small>${esc(names[r])}</small><strong>${average(r)}%</strong><span>rata-rata akurasi</span></article>`).join('')}</div><div class="cm-recap-grid">${results.map((item, index) => recapRoundCard(item, mode, index)).join('')}</div><div class="bm-result-actions"><button class="button button-primary" data-cm-action="replay">${standalone ? 'Latihan lagi' : 'Kembali ke lobi'}</button><button class="button button-quiet" data-cm-action="back">Kembali</button></div></section>`;
  }

  function render() {
    if (destroyed) return;
    const meta = pub.meta || {};
    let content = '';
    if (standalone) {
      if (phase === 'setup') content = setupPanel();
      else if (phase === 'preview') content = previewPanel();
      else if (phase === 'guessing') content = guessingPanel();
      else if (phase === 'finished') content = finishedPanel();
    } else if (!meta.phase || meta.phase === 'setup') content = setupPanel();
    else if (meta.phase === 'preview') content = previewPanel();
    else if (meta.phase === 'guessing') content = guessingPanel();
    else if (meta.phase === 'scoring') content = '<section class="bm-panel bm-center-panel"><h2>Menyusun rekap ronde…</h2><p>Menyiapkan hasil sementara sebelum ronde berikutnya.</p></section>';
    else if (meta.phase === 'finished') content = finishedPanel();
    root.innerHTML = `<section class="bm-shell cm-shell"><header class="bm-header"><div><span class="bm-kicker">DIRI. · MEMORY CHALLENGE</span><h1>Color Match <span>◉</span></h1><p>Amati, ingat, lalu bangun kembali warna dari memorimu.</p></div><div class="bm-header-actions">${standalone ? '<span class="bm-mode-pill">LATIHAN</span>' : `<span class="bm-room-code">${esc(code)}</span>`}<button class="button button-quiet button-small" data-cm-action="back">Kembali</button></div></header>${content}</section>`;
    if (!standalone && meta.phase === 'preview') updatePreviewTimer();
    if (standalone && phase === 'preview') updateLocalTimer();
  }

  async function seedRemote() {
    if (role !== 'host') return;
    const snap = await get(baseRef);
    if (snap.exists()) return;
    await set(baseRef, { settings: { mode: 'versus', difficulty: 'normal', clueRole: 'host' }, meta: { phase: 'setup', round: 0 }, submissions: { host: false, guest: false }, totals: { host: 0, guest: 0 }, roundResults: {} });
  }

  async function startRound(round) {
    if (standalone) {
      local.round = round;
      local.target = makeColor();
      draftGuess = { r: 128, g: 128, b: 128 };
      local.previewStartedAt = Date.now();
      phase = 'preview';
      render();
      return;
    }
    if (role !== 'host') return;
    const settings = pub.settings || { mode: 'versus', difficulty: 'normal', clueRole: 'host' };
    const target = makeColor();
    await set(ref(db, `${privateRoot}/${room.host.uid}/rounds/${round}/target`), target);
    await update(baseRef, {
      settings,
      meta: { phase: 'preview', round, startedAt: Date.now(), previewMs: SHOW_MS[settings.difficulty] || SHOW_MS.normal },
      previewColor: settings.mode === 'versus' ? target : null,
      submissions: { host: false, guest: false },
      totals: pub.totals || { host: 0, guest: 0 }
    });
  }

  async function updatePreviewToGuessing() {
    if (role !== 'host' || transitioning || pub.meta?.phase !== 'preview') return;
    const elapsed = Date.now() - Number(pub.meta.startedAt || 0);
    if (elapsed < Number(pub.meta.previewMs || SHOW_MS.normal)) return;
    transitioning = true;
    try { await runTransaction(ref(db, `${base}/meta`), current => current?.phase === 'preview' && current.round === pub.meta.round ? { ...current, phase: 'guessing', guessStartedAt: Date.now() } : undefined, { applyLocally: false }); }
    catch (error) { toast(`Ronde belum bisa dilanjutkan: ${error.message}`, 'error'); }
    finally { transitioning = false; }
  }

  function updatePreviewTimer() {
    const elapsed = Date.now() - Number(pub.meta?.startedAt || 0);
    const duration = Number(pub.meta?.previewMs || SHOW_MS.normal);
    remainingMs = Math.max(0, duration - elapsed);
    const label = root.querySelector('[data-cm-countdown]');
    if (label) label.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
    const bar = root.querySelector('[data-cm-preview-bar]');
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, remainingMs / duration * 100))}%`;
    void updatePreviewToGuessing();
  }

  function updateLocalTimer() {
    const duration = SHOW_MS[local.difficulty];
    remainingMs = Math.max(0, duration - (Date.now() - local.previewStartedAt));
    const label = root.querySelector('[data-cm-countdown]');
    if (label) label.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
    const bar = root.querySelector('[data-cm-preview-bar]');
    if (bar) bar.style.width = `${remainingMs / duration * 100}%`;
    if (remainingMs <= 0) { phase = 'guessing'; render(); }
  }

  async function scoreRemoteIfReady() {
    if (role !== 'host' || transitioning || pub.meta?.phase !== 'guessing') return;
    const mode = pub.settings?.mode || 'versus';
    const ready = mode === 'duet' ? pub.submissions?.guest === true : pub.submissions?.host === true && pub.submissions?.guest === true;
    if (!ready) return;
    transitioning = true;
    try { await runTransaction(ref(db, `${base}/meta`), current => current?.phase === 'guessing' ? { ...current, phase: 'scoring' } : undefined, { applyLocally: false }); }
    catch (error) { toast(`Rekap ronde belum bisa dihitung: ${error.message}`, 'error'); }
    finally { transitioning = false; }
  }

  async function buildRemoteRoundResult() {
    if (role !== 'host' || pub.meta?.phase !== 'scoring') return;
    const round = Number(pub.meta.round || 1);
    const roundKey = String(round);
    if (processingRound === roundKey) return;
    processingRound = roundKey;
    try {
      // If the host reconnects after the recap record was stored but before the
      // phase advanced, reuse it instead of counting the same round twice.
      let record = pub.roundResults?.[roundKey] || null;
      if (!record) {
        const [targetSnap, hostGuessSnap, guestGuessSnap] = await Promise.all([
          get(ref(db, `${privateRoot}/${room.host.uid}/rounds/${round}/target`)),
          get(ref(db, `${privateRoot}/${room.host.uid}/rounds/${round}/guess`)),
          get(ref(db, `${privateRoot}/${room.guest.uid}/rounds/${round}/guess`))
        ]);
        const target = targetSnap.val();
        const guesses = { host: hostGuessSnap.val(), guest: guestGuessSnap.val() };
        if (!target) throw new Error('Warna target ronde ini tidak ditemukan.');
        const scores = { host: guesses.host ? colorAccuracy(target, guesses.host).score : 0, guest: guesses.guest ? colorAccuracy(target, guesses.guest).score : 0 };
        const mode = pub.settings?.mode || 'versus';
        const nextTotals = { ...(pub.totals || { host: 0, guest: 0 }) };
        if (mode === 'duet') nextTotals.guest += scores.guest;
        else { nextTotals.host += scores.host; nextTotals.guest += scores.guest; }
        record = { target, guesses, scores, round };
        await update(baseRef, { [`roundResults/${round}`]: record, totals: nextTotals });
        pub.totals = nextTotals;
        pub.roundResults = { ...(pub.roundResults || {}), [roundKey]: record };
      }
      if (round >= 5) {
        await set(ref(db, `${base}/meta`), { ...pub.meta, phase: 'finished', finishedAt: Date.now() });
      } else {
        await startRound(round + 1);
      }
    } catch (error) {
      processingRound = '';
      toast(`Rekap warna belum dapat diselesaikan: ${error.message}`, 'error');
    }
  }

  async function submitRemoteGuess() {
    if (busy || pub.submissions?.[role]) return;
    busy = true;
    try {
      await set(ref(db, `${minePath(pub.meta.round)}/guess`), draftGuess);
      await set(ref(db, `${base}/submissions/${role}`), true);
      toast('Tebakan dikunci.', 'success');
    } catch (error) { toast(`Tebakan belum tersimpan: ${error.message}`, 'error'); }
    finally { busy = false; render(); }
  }

  function localSubmit() {
    const score = colorAccuracy(local.target, draftGuess).score;
    const record = { target: local.target, guesses: { host: { ...draftGuess } }, scores: { host: score }, round: local.round };
    local.scores.push(score);
    local.roundResults.push(record);
    if (local.round >= 5) phase = 'finished';
    else { local.round += 1; startRound(local.round); return; }
    render();
  }

  function clickHandler(event) {
    const button = event.target.closest('[data-cm-action]');
    if (!button) return;
    event.preventDefault();
    const action = button.dataset.cmAction;
    if (action === 'back') onBack?.();
    if (action === 'local-start') { local.difficulty = root.querySelector('[data-cm-local-difficulty]').value; local.round = 1; local.scores = []; local.roundResults = []; startRound(1); }
    if (action === 'start' && role === 'host') void startRound(1);
    if (action === 'submit') standalone ? localSubmit() : void submitRemoteGuess();
    if (action === 'replay') { if (standalone) { phase = 'setup'; local.scores = []; local.roundResults = []; local.round = 1; render(); } else onBack?.(); }
  }

  function changeHandler(event) {
    if (event.target.matches('[data-cm-slider]')) {
      const channel = event.target.dataset.cmSlider;
      draftGuess[channel] = Number(event.target.value);
      const output = event.target.parentElement.querySelector('output');
      if (output) output.textContent = event.target.value;
      const preview = root.querySelector('.cm-guess-preview');
      if (preview) preview.style.setProperty('--guess-color', colorHex(draftGuess));
      return;
    }
    if (event.target.matches('[data-cm-setting]') && role === 'host') {
      void set(ref(db, `${base}/settings/${event.target.dataset.cmSetting}`), event.target.value).catch(error => toast(error.message, 'error'));
    }
  }

  root.addEventListener('click', clickHandler);
  root.addEventListener('change', changeHandler);
  root.addEventListener('input', changeHandler);
  if (!standalone) {
    unsubscribePrivate = onValue(ref(db, `${privateRoot}/${myUid}`), snap => { minePrivate = snap.val() || {}; render(); });
    unsubscribePublic = onValue(baseRef, snap => {
      pub = snap.val() || {};
      if (pub.meta?.phase === 'preview') updatePreviewTimer();
      if (pub.meta?.phase === 'guessing') void scoreRemoteIfReady();
      if (pub.meta?.phase === 'scoring') void buildRemoteRoundResult();
      render();
    });
    void seedRemote().catch(error => toast(`Color Match belum siap: ${error.message}`, 'error'));
  } else render();
  timer = window.setInterval(() => {
    if (destroyed) return;
    if (standalone && phase === 'preview') updateLocalTimer();
    else if (!standalone && pub.meta?.phase === 'preview') updatePreviewTimer();
  }, 100);


  return { destroy() { destroyed = true; window.clearInterval(timer); root.removeEventListener('click', clickHandler); root.removeEventListener('change', changeHandler); root.removeEventListener('input', changeHandler); unsubscribePublic?.(); unsubscribePrivate?.(); } };
}
