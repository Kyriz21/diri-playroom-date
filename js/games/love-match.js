import { db, ref, get, set, onValue, runTransaction } from '../firebase.js';
import { LOVE_QUESTIONS, calculateLoveMatch } from './brain-game-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const key = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const roleName = role => role === 'host' ? 'Pembuat sesi' : 'Tamu';

export function mountLoveMatch(root, context) {
  const { code, session, room, role, player, standalone = false, onBack, toast = () => {} } = context;
  const questions = LOVE_QUESTIONS;
  const names = standalone ? { host: 'Pemain 1', guest: 'Pemain 2' } : { host: room.host?.name || 'Pemain 1', guest: room.guest?.name || 'Pemain 2' };
  const myUid = player?.uid || 'local';
  const base = standalone ? '' : `roomGames/${code}/${session.sessionId}/public`;
  const privateRoot = standalone ? '' : `privateRooms/${code}/lovematch/${session.sessionId}`;
  const baseRef = base ? ref(db, base) : null;
  let pub = {};
  let myAnswers = {};
  let partnerAnswers = {};
  let partnerAnswersLoaded = false;
  let phase = standalone ? 'setup' : 'waiting';
  let localNames = { ...names };
  let localAnswers = { host: {}, guest: {} };
  let localTurn = 'host';
  let localIndex = 0;
  let unsubscribePublic = null;
  let unsubscribeMine = null;
  let unsubscribePartner = null;
  let busy = false;
  let transitioning = false;
  let destroyed = false;
  let lastRendered = '';
  let draft = '';

  function render() {
    if (destroyed) return;
    const meta = pub.meta || {};
    const index = standalone ? localIndex : Number(meta.questionIndex || 0);
    const answers = standalone ? localAnswers[localTurn] : myAnswers;
    let view = '';
    if (standalone && phase === 'setup') view = setupLocal();
    else if (standalone && phase === 'handover') view = handoverLocal();
    else if (standalone && phase === 'answering') view = questionView(index, localTurn, answers[index], true);
    else if (standalone && phase === 'result') view = resultView(calculateLoveMatch(localAnswers.host, localAnswers.guest), localNames, localAnswers, true);
    else if (!standalone && !pub.meta) view = waitingRemote();
    else if (!standalone && meta.phase === 'answering') view = questionView(index, role, answers[index], false);
    else if (!standalone && meta.phase === 'result') view = resultView(calculateLoveMatch(partnerAnswers.host || {}, partnerAnswers.guest || {}), names, { host: partnerAnswers.host || {}, guest: partnerAnswers.guest || {} }, false);
    root.innerHTML = `<section class="bm-shell lm-shell"><header class="bm-header"><div><span class="bm-kicker">DIRI. · PERSONALITY MATCH</span><h1>Love Match <span>♡</span></h1><p>Kenali pola kepribadian, lalu lihat seberapa selaras jawaban kalian.</p></div><div class="bm-header-actions">${standalone ? '<span class="bm-mode-pill">SATU PERANGKAT</span>' : `<span class="bm-room-code">${esc(code)}</span>`}<button class="button button-quiet button-small" data-bm-action="back">Kembali</button></div></header>${view}</section>`;
    lastRendered = `${standalone ? phase : meta.phase}:${index}:${JSON.stringify(pub.questionStatus || {})}`;
  }

  function setupLocal() {
    return `<section class="bm-panel lm-setup"><div class="bm-intro-copy"><span class="bm-tag">20 PERTANYAAN</span><h2>Main berdua di satu perangkat</h2><p>Jawaban pemain pertama akan disembunyikan. Setelah selesai, serahkan perangkat ke pemain kedua.</p></div><div class="bm-name-grid"><label>Nama pemain 1<input data-lm-name="host" maxlength="20" value="${esc(localNames.host)}"></label><label>Nama pemain 2<input data-lm-name="guest" maxlength="20" value="${esc(localNames.guest)}"></label></div><button class="button button-primary" data-bm-action="local-start">Mulai tes <span>→</span></button></section>`;
  }

  function handoverLocal() {
    return `<section class="bm-panel bm-center-panel"><div class="bm-big-icon">♡</div><span class="bm-tag">GILIRAN BERGANTI</span><h2>Serahkan perangkat ke ${esc(localNames.guest)}</h2><p>Jawaban ${esc(localNames.host)} sudah tersimpan dan disembunyikan. Pastikan pemain berikutnya tidak melihat jawaban sebelumnya.</p><button class="button button-primary" data-bm-action="local-handover">Lanjut sebagai ${esc(localNames.guest)} <span>→</span></button></section>`;
  }

  function waitingRemote() {
    return `<section class="bm-panel bm-center-panel"><div class="bm-big-icon">♡</div><span class="bm-tag">MENYIAPKAN TES</span><h2>Love Match siap dimainkan</h2><p>Berdua, jawab 20 pertanyaan yang sama. Jawaban pribadi tidak terlihat sampai kalian berdua selesai.</p><div class="bm-player-pair"><span>${esc(names.host)}</span><b>×</b><span>${esc(names.guest)}</span></div><p class="bm-muted">${role === 'host' ? 'Memulai sesi…' : 'Menunggu sesi dimulai…'}</p></section>`;
  }

  function questionView(index, playerRole, selected, local) {
    const q = questions[index];
    if (!q) return '<section class="bm-panel"><h2>Menyiapkan hasil…</h2></section>';
    const currentName = local ? localNames[playerRole] : names[playerRole];
    const progress = Math.round(((index + 1) / questions.length) * 100);
    const locked = !local && pub.questionStatus?.[index]?.[role] === true;
    const choice = selected || '';
    return `<section class="bm-panel lm-question-panel"><div class="bm-topline"><div><span class="bm-tag">TES KEPRIBADIAN</span><strong>Pertanyaan ${index + 1} / ${questions.length}</strong></div><span class="bm-progress-label">${progress}%</span></div><div class="bm-progress"><i style="width:${progress}%"></i></div><div class="lm-question-card"><span class="bm-category">DIMENSI ${esc(q.axis)}</span><h2>${esc(q.prompt)}</h2><div class="lm-option-grid"><button class="lm-option ${choice === 'A' ? 'is-selected' : ''}" data-lm-answer="A" ${locked ? 'disabled' : ''}><span>A</span>${esc(q.a)}</button><button class="lm-option ${choice === 'B' ? 'is-selected' : ''}" data-lm-answer="B" ${locked ? 'disabled' : ''}><span>B</span>${esc(q.b)}</button></div></div><div class="bm-question-footer"><span>${local ? `Giliran ${esc(currentName)}` : `Kamu menjawab sebagai ${esc(currentName)}`}</span><button class="button button-primary" data-bm-action="${local ? 'local-next' : 'submit-answer'}" ${!choice || locked ? 'disabled' : ''}>${local ? (index === 19 ? 'Selesaikan jawaban' : 'Pertanyaan berikutnya') : 'Kunci jawaban' } <span>→</span></button></div>${locked ? '<p class="bm-muted">Jawaban terkunci. Menunggu pasangan menjawab pertanyaan yang sama…</p>' : ''}</section>`;
  }

  function resultView(result, resultNames, answerSets, local) {
    if (!result || !result.hostProfile || !result.guestProfile) return `<section class="bm-panel bm-center-panel"><h2>Menghitung kecocokan…</h2><p>Menyiapkan ringkasan jawaban kalian.</p></section>`;
    const profileCard = (playerRole, tone) => {
      const profile = result[`${playerRole}Profile`];
      return `<article class="lm-profile-card ${tone}"><span>${esc(resultNames[playerRole])}</span><strong>${esc(profile.code)}</strong><h3>${esc(profile.name)}</h3><p>${esc(profile.description)}</p></article>`;
    };
    return `<section class="bm-panel lm-result-panel"><span class="bm-tag">REKAPAN LOVE MATCH</span><div class="lm-score-wrap"><strong>${result.score}%</strong><span>KECOCOKAN JAWABAN</span><small>${result.matched} dari ${result.total} jawaban sama</small></div><div class="lm-profile-grid">${profileCard('host','is-pink')}${profileCard('guest','is-blue')}</div><div class="lm-result-stat-grid"><article><small>JAWABAN SAMA</small><strong>${result.matched}</strong><span>dari ${result.total} pertanyaan</span></article><article><small>JAWABAN BERBEDA</small><strong>${result.total - result.matched}</strong><span>bisa jadi bahan obrolan</span></article></div><div class="lm-axis-grid">${Object.entries(result.axes).map(([axis, value]) => `<div><span>${axis}</span><strong>${value}%</strong><i><b style="width:${value}%"></b></i></div>`).join('')}</div><p class="bm-muted">Ini kuis refleksi ringan untuk bahan obrolan, bukan tes psikologi atau diagnosis kepribadian.</p><div class="bm-result-actions"><button class="button button-primary" data-bm-action="replay">${local ? 'Tes lagi' : 'Kembali ke lobi'}</button><button class="button button-quiet" data-bm-action="back">Kembali</button></div></section>`;
  }

  async function seedRemote() {
    if (role !== 'host') return;
    const snap = await get(baseRef);
    if (snap.exists()) return;
    await set(baseRef, { meta: { phase: 'answering', questionIndex: 0, total: questions.length, startedAt: Date.now() }, submissions: { host: false, guest: false }, questionStatus: {} });
  }

  async function storeMyAnswers() {
    await set(ref(db, `${privateRoot}/${myUid}/answers`), myAnswers);
    await set(ref(db, `${base}/questionStatus/${pub.meta.questionIndex}/${role}`), true);
  }

  async function maybeAdvanceQuestion() {
    if (role !== 'host' || transitioning || pub.meta?.phase !== 'answering') return;
    const index = Number(pub.meta.questionIndex || 0);
    const status = pub.questionStatus?.[index] || {};
    if (status.host !== true || status.guest !== true) return;
    transitioning = true;
    try {
      await runTransaction(ref(db, `${base}/meta`), current => {
        if (!current || current.phase !== 'answering' || current.questionIndex !== index) return;
        if (index >= questions.length - 1) return { ...current, phase: 'result', finishedAt: Date.now() };
        return { ...current, questionIndex: index + 1 };
      }, { applyLocally: false });
    } catch (error) { toast(`Belum bisa lanjut: ${error.message}`, 'error'); }
    finally { transitioning = false; }
  }

  async function loadPartnerAnswers() {
    if (standalone || pub.meta?.phase !== 'result' || partnerAnswersLoaded) return;
    try {
      const [mine, theirs] = await Promise.all([
        get(ref(db, `${privateRoot}/${room.host.uid}/answers`)),
        get(ref(db, `${privateRoot}/${room.guest.uid}/answers`))
      ]);
      partnerAnswers.host = mine.val() || {};
      partnerAnswers.guest = theirs.val() || {};
      partnerAnswersLoaded = true;
      // The room may have been rejoined with the guest role; the fetched paths are absolute roles.
      render();
    } catch (error) { toast(`Jawaban belum dapat dibuka: ${error.message}`, 'error'); }
  }

  async function submitAnswer() {
    const index = Number(pub.meta?.questionIndex || 0);
    if (busy || myAnswers[index] !== 'A' && myAnswers[index] !== 'B') return;
    busy = true;
    try {
      await storeMyAnswers();
      toast('Jawaban tersimpan secara pribadi.', 'success');
    } catch (error) { toast(`Jawaban belum tersimpan: ${error.message}`, 'error'); }
    finally { busy = false; }
  }

  function handleLocalAnswer(value) {
    localAnswers[localTurn][localIndex] = value;
    draft = value;
    render();
  }

  function localNext() {
    if (!localAnswers[localTurn][localIndex]) return;
    if (localIndex < questions.length - 1) localIndex += 1;
    else if (localTurn === 'host') { localTurn = 'guest'; localIndex = 0; phase = 'handover'; }
    else phase = 'result';
    render();
  }

  function clickHandler(event) {
    const button = event.target.closest('[data-bm-action], [data-lm-answer]');
    if (!button) return;
    if (button.dataset.lmAnswer) {
      event.preventDefault();
      if (standalone) handleLocalAnswer(button.dataset.lmAnswer);
      else { myAnswers[Number(pub.meta?.questionIndex || 0)] = button.dataset.lmAnswer; render(); }
      return;
    }
    const action = button.dataset.bmAction;
    if (action === 'back') onBack?.();
    if (action === 'local-start') { localNames.host = root.querySelector('[data-lm-name="host"]').value.trim() || 'Pemain 1'; localNames.guest = root.querySelector('[data-lm-name="guest"]').value.trim() || 'Pemain 2'; phase = 'answering'; render(); }
    if (action === 'local-handover') { phase = 'answering'; render(); }
    if (action === 'local-next') localNext();
    if (action === 'submit-answer') void submitAnswer();
    if (action === 'replay') { if (standalone) { phase = 'setup'; localAnswers = { host: {}, guest: {} }; localTurn = 'host'; localIndex = 0; } else onBack?.(); render(); }
  }

  root.addEventListener('click', clickHandler);
  if (!standalone) {
    const myPath = ref(db, `${privateRoot}/${myUid}/answers`);
    unsubscribeMine = onValue(myPath, snap => { myAnswers = snap.val() || {}; render(); });
    unsubscribePublic = onValue(baseRef, snap => {
      pub = snap.val() || {};
      if (pub.meta?.phase === 'answering') void maybeAdvanceQuestion();
      if (pub.meta?.phase === 'result') void loadPartnerAnswers();
      render();
    });
    void seedRemote().catch(error => toast(`Sesi belum dapat disiapkan: ${error.message}`, 'error'));
  } else render();

  return { destroy() { destroyed = true; root.removeEventListener('click', clickHandler); unsubscribePublic?.(); unsubscribeMine?.(); unsubscribePartner?.(); } };
}
