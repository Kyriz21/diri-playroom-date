import { db, ref, get, set, onValue, runTransaction } from '../firebase.js';
import { IQ_QUESTIONS, seededShuffle, scoreIqAnswers } from './brain-game-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const ROUND_SECONDS = 30;

export function mountIQDuel(root, context) {
  const { code, session, room, role, player, standalone = false, onBack, toast = () => {} } = context;
  const base = standalone ? '' : `roomGames/${code}/${session.sessionId}/public`;
  const privateRoot = standalone ? '' : `privateRooms/${code}/iqduel/${session.sessionId}`;
  const baseRef = base ? ref(db, base) : null;
  const myUid = player?.uid || 'local';
  const names = standalone ? { host: 'Kamu', guest: 'Pasangan' } : { host: room.host?.name || 'Host', guest: room.guest?.name || 'Guest' };
  let pub = {};
  let local = { phase: 'setup', rounds: 12, index: 0, questionSet: [], answers: {}, startedAt: 0, selected: null, results: null };
  let myAnswers = {};
  let partnerAnswers = {};
  let unsubscribePublic = null;
  let unsubscribeMine = null;
  let timer = null;
  let busy = false;
  let advancing = false;
  let resultBusy = false;
  let destroyed = false;
  let resultLoaded = false;
  let remaining = ROUND_SECONDS;

  function currentQuestion() {
    if (standalone) return local.questionSet[local.index];
    const id = pub.questionIds?.[pub.meta?.questionIndex ?? 0];
    return IQ_QUESTIONS.find(q => q.id === id) || null;
  }

  function setupPanel() {
    if (standalone) return `<section class="bm-panel iq-setup"><span class="bm-tag">BRAIN DUEL · SOLO PRACTICE</span><h2>Uji logika dan kecepatanmu</h2><p>Pilih jumlah soal. Setiap soal punya batas waktu 30 detik. Jawaban benar dan pembahasan baru dibuka di hasil akhir.</p><label>Jumlah ronde<select data-iq-local-rounds><option value="12">12 ronde · cepat</option><option value="20">20 ronde · lengkap</option></select></label><button class="button button-primary" data-iq-action="local-start">Mulai IQ Duel →</button></section>`;
    const rounds = Number(pub.settings?.rounds || 12);
    return `<section class="bm-panel iq-setup"><span class="bm-tag">HEAD-TO-HEAD</span><h2>Siapa yang paling cepat berpikir?</h2><p>Kalian mendapat soal yang sama. Kunci jawaban sebelum waktu habis. Tidak ada jawaban benar yang dibuka sampai semua ronde selesai.</p><label>Jumlah ronde<select data-iq-setting="rounds" ${role !== 'host' ? 'disabled' : ''}><option value="12" ${rounds === 12 ? 'selected' : ''}>12 ronde · cepat</option><option value="20" ${rounds === 20 ? 'selected' : ''}>20 ronde · lengkap</option></select></label><div class="bm-ready-grid"><span>${esc(names.host)} <b>${pub.ready?.host ? 'Siap ✓' : 'Belum siap'}</b></span><span>${esc(names.guest)} <b>${pub.ready?.guest ? 'Siap ✓' : 'Belum siap'}</b></span></div><div class="bm-result-actions"><button class="button button-secondary" data-iq-action="ready">${pub.ready?.[role] ? 'Batalkan siap' : 'Aku siap'}</button>${role === 'host' ? `<button class="button button-primary" data-iq-action="start" ${pub.ready?.host && pub.ready?.guest ? '' : 'disabled'}>Mulai ${rounds} ronde →</button>` : '<span class="bm-muted">Menunggu pembuat sesi.</span>'}</div></section>`;
  }

  function questionPanel(question, index, rounds, selected, locked, timeLeft) {
    if (!question) return `<section class="bm-panel"><h2>Menyiapkan soal…</h2></section>`;
    const submissionStatus = standalone ? {} : (pub.submissions?.[index] || {});
    const matrix = question.visualGrid?.length ? `<div class="iq-matrix-grid">${question.visualGrid.map(item => `<span class="${item === '?' ? 'is-missing' : ''}">${esc(item)}</span>`).join('')}</div>` : question.visual?.length ? `<div class="iq-visual-row">${question.visual.map(item => `<span>${esc(item)}</span>`).join('')}</div>` : '';
    return `<section class="bm-panel iq-question-panel"><div class="bm-topline"><div><span class="bm-tag">${esc(question.category)}</span><strong>PERTANYAAN ${index + 1} DARI ${rounds}</strong></div><span class="iq-timer">${timeLeft}s</span></div><div class="bm-progress"><i style="width:${((index + 1) / rounds) * 100}%"></i></div><h2>${esc(question.prompt)}</h2>${matrix}<div class="iq-options">${question.options.map((option, optionIndex) => `<button class="iq-option ${selected === optionIndex ? 'is-selected' : ''}" data-iq-option="${optionIndex}" ${locked ? 'disabled' : ''}><span>${String.fromCharCode(65 + optionIndex)}</span>${esc(option)}</button>`).join('')}</div><div class="bm-question-footer"><span>${locked ? 'Jawaban terkunci · menunggu pasangan' : 'Pilih satu jawaban'}</span><button class="button button-primary" data-iq-action="${standalone ? 'local-submit' : 'submit'}" ${selected === null || selected === undefined || locked ? 'disabled' : ''}>Kunci jawaban</button></div><div class="iq-lock-row"><span>${esc(names.host)} · ${standalone ? 'Kamu' : submissionStatus.host ? 'Terkunci ✓' : 'Berpikir…'}</span><span>${esc(names.guest)} · ${standalone ? 'Latihan' : submissionStatus.guest ? 'Terkunci ✓' : 'Berpikir…'}</span></div></section>`;
  }

  function resultPanel(result) {
    if (!result) return `<section class="bm-panel bm-center-panel"><h2>Menghitung hasil…</h2><p>Menyiapkan jawaban dan pembahasan kalian.</p></section>`;
    const localResult = standalone;
    const rows = localResult ? ['host'] : ['host', 'guest'];
    const winner = localResult ? 'Latihan selesai!' : result.scores.host.correct === result.scores.guest.correct ? 'Hasil seri!' : result.scores.host.correct > result.scores.guest.correct ? `${names.host} menang!` : `${names.guest} menang!`;
    return `<section class="bm-panel iq-result-panel"><span class="bm-tag">HASIL AKHIR</span><h2>${localResult ? 'Latihan selesai!' : winner}</h2><p>${localResult ? 'Ini hasil latihanmu. Coba ulangi untuk meningkatkan skor.' : 'Semua jawaban sekarang dibuka, lengkap dengan pembahasannya.'}</p><div class="iq-score-grid">${rows.map(r => `<article class="${r === 'host' ? 'is-pink' : 'is-blue'}"><small>${esc(names[r])}</small><strong>${result.scores[r].correct}/${result.scores[r].total}</strong><span>${result.scores[r].percentage}% benar</span></article>`).join('')}</div><div class="iq-review-list">${result.questions.map((item, i) => `<article><header><strong>${i + 1}. ${esc(item.prompt)}</strong><span class="${item.hostCorrect ? 'is-correct' : 'is-wrong'}">${localResult ? (item.hostCorrect ? 'Benar' : 'Belum tepat') : `${item.hostCorrect ? '✓' : '×'} ${esc(names.host)} · ${item.guestCorrect ? '✓' : '×'} ${esc(names.guest)}`}</span></header><p>Jawaban: <b>${esc(item.options[item.answer])}</b></p><small>${esc(item.explanation)}</small></article>`).join('')}</div><div class="bm-result-actions"><button class="button button-primary" data-iq-action="replay">${localResult ? 'Latihan lagi' : 'Kembali ke lobi'}</button><button class="button button-quiet" data-iq-action="back">Kembali</button></div></section>`;
  }

  function render() {
    if (destroyed) return;
    let content;
    if (standalone) {
      if (local.phase === 'setup') content = setupPanel();
      else if (local.phase === 'question') content = questionPanel(local.questionSet[local.index], local.index, local.rounds, local.selected, false, remaining);
      else content = resultPanel(local.results);
    } else {
      const meta = pub.meta || {};
      if (!meta.phase || meta.phase === 'setup') content = setupPanel();
      else if (meta.phase === 'playing') content = questionPanel(currentQuestion(), Number(meta.questionIndex || 0), Number(pub.settings?.rounds || 12), myAnswers[meta.questionIndex] ?? null, pub.submissions?.[Number(meta.questionIndex || 0)]?.[role] === true, remaining);
      else if (meta.phase === 'result') content = resultPanel(pub.result);
      else content = `<section class="bm-panel bm-center-panel"><h2>Menyiapkan IQ Duel…</h2></section>`;
    }
    root.innerHTML = `<section class="bm-shell iq-shell"><header class="bm-header"><div><span class="bm-kicker">DIRI. · LOGIC CHALLENGE</span><h1>IQ Duel <span>✦</span></h1><p>Matrix, pola, deret, logika, dan hitung cepat. Skor dibuka di akhir.</p></div><div class="bm-header-actions">${standalone ? '<span class="bm-mode-pill">SOLO</span>' : `<span class="bm-room-code">${esc(code)}</span>`}<button class="button button-quiet button-small" data-iq-action="back">Kembali</button></div></header>${content}</section>`;
  }

  async function seedRemote() {
    if (role !== 'host') return;
    const snap = await get(baseRef);
    if (snap.exists()) return;
    await set(baseRef, { settings: { rounds: 12 }, ready: { host: false, guest: false }, meta: { phase: 'setup' }, submissions: {} });
  }

  async function startRemote() {
    if (role !== 'host' || !pub.ready?.host || !pub.ready?.guest) return;
    const rounds = Number(pub.settings?.rounds) === 20 ? 20 : 12;
    const selected = seededShuffle(IQ_QUESTIONS, Number(session.startedAt || Date.now())).slice(0, rounds);
    await set(baseRef, { settings: { rounds }, ready: { host: true, guest: true }, questionIds: selected.map(q => q.id), meta: { phase: 'playing', questionIndex: 0, startedAt: Date.now(), durationSeconds: ROUND_SECONDS }, submissions: {} });
  }

  async function submitRemote() {
    const index = Number(pub.meta?.questionIndex || 0);
    const selected = myAnswers[index];
    if (busy || !Number.isInteger(selected) || pub.submissions?.[index]?.[role]) return;
    busy = true;
    try {
      await set(ref(db, `${privateRoot}/${myUid}/answers/${index}`), selected);
      await set(ref(db, `${base}/submissions/${index}/${role}`), true);
      toast('Jawaban dikunci. Skor belum dibuka.', 'success');
    } catch (error) { toast(`Jawaban belum tersimpan: ${error.message}`, 'error'); }
    finally { busy = false; }
  }

  async function advanceRemote(force = false) {
    if (role !== 'host' || advancing || pub.meta?.phase !== 'playing') return;
    const index = Number(pub.meta.questionIndex || 0);
    const both = pub.submissions?.[index]?.host === true && pub.submissions?.[index]?.guest === true;
    const expired = Date.now() >= Number(pub.meta.startedAt || 0) + Number(pub.meta.durationSeconds || ROUND_SECONDS) * 1000;
    if (!both && !expired && !force) return;
    advancing = true;
    try {
      const total = Number(pub.settings?.rounds || 12);
      await runTransaction(ref(db, `${base}/meta`), current => {
        if (!current || current.phase !== 'playing' || current.questionIndex !== index) return;
        const ready = pub.submissions?.[index]?.host === true && pub.submissions?.[index]?.guest === true;
        const timeout = Date.now() >= Number(current.startedAt || 0) + Number(current.durationSeconds || ROUND_SECONDS) * 1000;
        if (!ready && !timeout && !force) return;
        if (index + 1 >= total) return { ...current, phase: 'result', finishedAt: Date.now() };
        return { ...current, questionIndex: index + 1, startedAt: Date.now() };
      }, { applyLocally: false });
      // Submission flags are keyed by round, so an old round cannot auto-advance the next one.
    } catch (error) { toast(`Belum bisa lanjut ke soal berikutnya: ${error.message}`, 'error'); }
    finally { advancing = false; }
  }

  async function publishRemoteResult() {
    if (role !== 'host' || pub.meta?.phase !== 'result' || pub.result || resultBusy || resultLoaded) return;
    resultBusy = true;
    try {
      const [hostSnap, guestSnap] = await Promise.all([
        get(ref(db, `${privateRoot}/${room.host.uid}/answers`)),
        get(ref(db, `${privateRoot}/${room.guest.uid}/answers`))
      ]);
      const hostAnswers = hostSnap.val() || {};
      const guestAnswers = guestSnap.val() || {};
      const qSet = (pub.questionIds || []).map(id => IQ_QUESTIONS.find(q => q.id === id)).filter(Boolean);
      const hostScore = scoreIqAnswers(qSet, hostAnswers);
      const guestScore = scoreIqAnswers(qSet, guestAnswers);
      const questions = qSet.map((q, i) => ({
        ...q,
        hostCorrect: hostScore.details[i]?.isCorrect === true,
        guestCorrect: guestScore.details[i]?.isCorrect === true
      }));
      const result = { scores: { host: hostScore, guest: guestScore }, questions, publishedAt: Date.now() };
      await set(ref(db, `${base}/result`), result);
      resultLoaded = true;
    } catch (error) { toast(`Hasil IQ Duel belum dapat dihitung: ${error.message}`, 'error'); }
    finally { resultBusy = false; }
  }

  function updateTimer() {
    if (standalone) {
      if (local.phase !== 'question') return;
      remaining = Math.max(0, Math.ceil((local.startedAt + ROUND_SECONDS * 1000 - Date.now()) / 1000));
      const el = root.querySelector('.iq-timer');
      if (el) el.textContent = `${remaining}s`;
      if (remaining <= 0) localSubmit(true);
      return;
    }
    if (pub.meta?.phase !== 'playing') return;
    remaining = Math.max(0, Math.ceil((Number(pub.meta.startedAt || Date.now()) + ROUND_SECONDS * 1000 - Date.now()) / 1000));
    const el = root.querySelector('.iq-timer');
    if (el) el.textContent = `${remaining}s`;
    if (remaining <= 0 && role === 'host') void advanceRemote();
  }

  function localStart() {
    local.rounds = Number(root.querySelector('[data-iq-local-rounds]').value) === 20 ? 20 : 12;
    local.questionSet = seededShuffle(IQ_QUESTIONS, Date.now()).slice(0, local.rounds);
    local.answers = {};
    local.index = 0;
    local.selected = null;
    local.startedAt = Date.now();
    local.phase = 'question';
    remaining = ROUND_SECONDS;
    render();
  }

  function localSubmit(timeout = false) {
    if (local.phase !== 'question') return;
    if (local.selected !== null && local.selected !== undefined) local.answers[local.index] = local.selected;
    if (!timeout && local.selected === null) return;
    if (local.index >= local.rounds - 1) {
      const score = scoreIqAnswers(local.questionSet, local.answers);
      local.results = { scores: { host: score, guest: { correct: 0, total: score.total, percentage: 0 } }, questions: local.questionSet.map((q, i) => ({ ...q, hostCorrect: score.details[i]?.isCorrect === true, guestCorrect: false })) };
      local.phase = 'result';
    } else {
      local.index += 1;
      local.selected = null;
      local.startedAt = Date.now();
      remaining = ROUND_SECONDS;
    }
    render();
  }

  function clickHandler(event) {
    const button = event.target.closest('[data-iq-action], [data-iq-option]');
    if (!button) return;
    event.preventDefault();
    if (button.dataset.iqOption !== undefined) {
      const value = Number(button.dataset.iqOption);
      if (standalone) local.selected = value;
      else myAnswers[Number(pub.meta?.questionIndex || 0)] = value;
      render();
      return;
    }
    const action = button.dataset.iqAction;
    if (action === 'back') onBack?.();
    if (action === 'local-start') localStart();
    if (action === 'local-submit') localSubmit(false);
    if (action === 'ready') void toggleReady();
    if (action === 'start') void startRemote();
    if (action === 'submit') void submitRemote();
    if (action === 'replay') { if (standalone) { local.phase = 'setup'; render(); } else onBack?.(); }
  }

  function changeHandler(event) {
    if (event.target.matches('[data-iq-setting]') && role === 'host') {
      void set(ref(db, `${base}/settings/rounds`), Number(event.target.value));
    }
  }

  async function toggleReady() {
    if (busy) return;
    busy = true;
    try { await set(ref(db, `${base}/ready/${role}`), !pub.ready?.[role]); }
    catch (error) { toast(`Status siap belum tersimpan: ${error.message}`, 'error'); }
    finally { busy = false; }
  }

  root.addEventListener('click', clickHandler);
  root.addEventListener('change', changeHandler);
  if (!standalone) {
    unsubscribeMine = onValue(ref(db, `${privateRoot}/${myUid}/answers`), snap => { myAnswers = snap.val() || {}; render(); });
    unsubscribePublic = onValue(baseRef, snap => {
      pub = snap.val() || {};
      if (pub.meta?.phase === 'playing') {
        updateTimer();
        const roundIndex = Number(pub.meta?.questionIndex || 0);
        if (pub.submissions?.[roundIndex]?.host && pub.submissions?.[roundIndex]?.guest && role === 'host') void advanceRemote();
      }
      if (pub.meta?.phase === 'result') void publishRemoteResult();
      render();
    });
    void seedRemote().catch(error => toast(`IQ Duel belum siap: ${error.message}`, 'error'));
  } else render();
  timer = window.setInterval(updateTimer, 200);

  return { destroy() { destroyed = true; window.clearInterval(timer); root.removeEventListener('click', clickHandler); root.removeEventListener('change', changeHandler); unsubscribePublic?.(); unsubscribeMine?.(); } };
}
