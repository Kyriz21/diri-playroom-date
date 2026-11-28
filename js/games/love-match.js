import { db, ref, get, set, onValue, runTransaction } from '../firebase.js';
import { LOVE_QUESTIONS, calculateLoveMatch, selectLoveQuestions, createRandomSeed } from './brain-game-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const roleName = role => role === 'host' ? 'Pemain 1' : 'Pemain 2';
const AXIS_INFO = {
  'I/E': { title:'Sumber energi', detail:'Introversi (I) biasanya mengisi energi lewat ruang pribadi dan interaksi yang lebih terpilih. Ekstraversi (E) cenderung mendapat energi dari interaksi dan aktivitas bersama.' },
  'S/N': { title:'Cara menerima informasi', detail:'Sensing (S) lebih memperhatikan fakta, detail, dan pengalaman konkret. Intuition (N) lebih tertarik pada pola, makna, dan kemungkinan yang belum terlihat.' },
  'T/F': { title:'Cara mengambil keputusan', detail:'Thinking (T) cenderung menimbang konsistensi dan alasan logis. Feeling (F) lebih menimbang nilai, dampak bagi orang, dan harmoni hubungan.' },
  'J/P': { title:'Cara mengatur kehidupan', detail:'Judging (J) nyaman dengan struktur, rencana, dan keputusan yang jelas. Perceiving (P) lebih menyukai fleksibilitas dan pilihan yang tetap terbuka.' }
};

function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function formatDate() {
  return new Date().toISOString().slice(0, 10);
}

export function mountLoveMatch(root, context) {
  const { code, session, room, role, player, standalone = false, onBack, toast = () => {} } = context;
  let questions = LOVE_QUESTIONS;
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
  let busy = false;
  let transitioning = false;
  let destroyed = false;

  function setQuestionSet(ids) {
    if (!Array.isArray(ids) || !ids.length) return;
    const selected = ids.map(id => LOVE_QUESTIONS.find(question => question.id === id)).filter(Boolean);
    if (selected.length) questions = selected;
  }

  function render() {
    if (destroyed) return;
    const meta = pub.meta || {};
    const index = standalone ? localIndex : Number(meta.questionIndex || 0);
    const answers = standalone ? localAnswers[localTurn] : myAnswers;
    let view = '';
    if (standalone && phase === 'setup') view = setupLocal();
    else if (standalone && phase === 'handover') view = handoverLocal();
    else if (standalone && phase === 'answering') view = questionView(index, localTurn, answers[index], true);
    else if (standalone && phase === 'result') view = resultView(calculateLoveMatch(localAnswers.host, localAnswers.guest, questions), localNames, localAnswers, true);
    else if (!standalone && !pub.meta) view = waitingRemote();
    else if (!standalone && meta.phase === 'answering') view = questionView(index, role, answers[index], false);
    else if (!standalone && meta.phase === 'result') view = resultView(calculateLoveMatch(partnerAnswers.host || {}, partnerAnswers.guest || {}, questions), names, { host: partnerAnswers.host || {}, guest: partnerAnswers.guest || {} }, false);
    root.innerHTML = `<section class="bm-shell lm-shell"><header class="bm-header"><div><span class="bm-kicker">DIRI. · PERSONALITY MATCH</span><h1>Love Match <span>♡</span></h1><p>Kenali pola kepribadian, lalu lihat seberapa selaras jawaban kalian.</p></div><div class="bm-header-actions">${standalone ? '<span class="bm-mode-pill">SATU PERANGKAT</span>' : `<span class="bm-room-code">${esc(code)}</span>`}<button class="button button-quiet button-small" data-bm-action="back">Kembali</button></div></header>${view}</section>`;
  }

  function setupLocal() {
    return `<section class="bm-panel lm-setup"><div class="bm-intro-copy"><span class="bm-tag">32 PERTANYAAN · BANK VARIATIF</span><h2>Main berdua di satu perangkat</h2><p>Setiap sesi memilih kombinasi pertanyaan secara acak dan seimbang dari empat dimensi. Jawaban pemain pertama disembunyikan sebelum giliran pemain kedua.</p></div><div class="bm-name-grid"><label>Nama pemain 1<input data-lm-name="host" maxlength="20" value="${esc(localNames.host)}"></label><label>Nama pemain 2<input data-lm-name="guest" maxlength="20" value="${esc(localNames.guest)}"></label></div><button class="button button-primary" data-bm-action="local-start">Mulai tes acak <span>→</span></button></section>`;
  }

  function handoverLocal() {
    return `<section class="bm-panel bm-center-panel"><div class="bm-big-icon">♡</div><span class="bm-tag">GILIRAN BERGANTI</span><h2>Serahkan perangkat ke ${esc(localNames.guest)}</h2><p>Jawaban ${esc(localNames.host)} sudah tersimpan dan disembunyikan. Pastikan pemain berikutnya tidak melihat jawaban sebelumnya.</p><button class="button button-primary" data-bm-action="local-handover">Lanjut sebagai ${esc(localNames.guest)} <span>→</span></button></section>`;
  }

  function waitingRemote() {
    return `<section class="bm-panel bm-center-panel"><div class="bm-big-icon">♡</div><span class="bm-tag">MENYIAPKAN TES</span><h2>Love Match siap dimainkan</h2><p>Kalian akan menjawab ${questions.length > 20 ? 32 : 20} pertanyaan pilihan acak yang seimbang. Jawaban pribadi tidak terlihat sampai kalian berdua selesai.</p><div class="bm-player-pair"><span>${esc(names.host)}</span><b>×</b><span>${esc(names.guest)}</span></div><p class="bm-muted">${role === 'host' ? 'Menyiapkan bank soal…' : 'Menunggu pembuat sesi menyiapkan tes…'}</p></section>`;
  }

  function questionView(index, playerRole, selected, local) {
    const q = questions[index];
    if (!q) return '<section class="bm-panel"><h2>Menyiapkan hasil…</h2></section>';
    const currentName = local ? localNames[playerRole] : names[playerRole];
    const progress = Math.round(((index + 1) / questions.length) * 100);
    const locked = !local && pub.questionStatus?.[index]?.[role] === true;
    const choice = selected || '';
    return `<section class="bm-panel lm-question-panel"><div class="bm-topline"><div><span class="bm-tag">DIMENSI ${esc(q.axis)}</span><strong>Pertanyaan ${index + 1} / ${questions.length}</strong></div><span class="bm-progress-label">${progress}%</span></div><div class="bm-progress"><i style="width:${progress}%"></i></div><div class="lm-question-card"><h2>${esc(q.prompt)}</h2><div class="lm-option-grid"><button class="lm-option ${choice === 'A' ? 'is-selected' : ''}" data-lm-answer="A" ${locked ? 'disabled' : ''}><span>A</span>${esc(q.a)}</button><button class="lm-option ${choice === 'B' ? 'is-selected' : ''}" data-lm-answer="B" ${locked ? 'disabled' : ''}><span>B</span>${esc(q.b)}</button></div></div><div class="bm-question-footer"><span>${local ? `Giliran ${esc(currentName)}` : `Kamu menjawab sebagai ${esc(currentName)}`}</span><button class="button button-primary" data-bm-action="${local ? 'local-next' : 'submit-answer'}" ${!choice || locked ? 'disabled' : ''}>${local ? (index === questions.length - 1 ? 'Selesaikan jawaban' : 'Pertanyaan berikutnya') : 'Kunci jawaban' } <span>→</span></button></div>${locked ? '<p class="bm-muted">Jawaban terkunci. Menunggu pasangan menjawab pertanyaan yang sama…</p>' : ''}</section>`;
  }

  function answerText(question, answer) {
    return answer === 'A' ? question.a : answer === 'B' ? question.b : 'Tidak menjawab';
  }

  function profileCard(playerRole, tone, profile) {
    const details = [
      ['Gambaran umum', profile.description],
      ['Kekuatan yang sering terlihat', profile.strengths],
      ['Gaya komunikasi', profile.communication],
      ['Dalam hubungan', profile.relationship],
      ['Hal yang bisa dikembangkan', profile.growth]
    ];
    return `<article class="lm-profile-card ${tone}"><span>${esc(playerRole)}</span><strong>${esc(profile.code)}</strong><h3>${esc(profile.name)}</h3>${details.map(([label, text]) => `<div class="lm-profile-detail"><b>${esc(label)}</b><p>${esc(text)}</p></div>`).join('')}</article>`;
  }

  function answerReview(questionsForReview, answerSets, reviewNames = names) {
    return `<section class="lm-answer-review"><div class="lm-section-heading"><div><span class="bm-tag">JAWABAN KALIAN</span><h3>Bandingkan setiap pilihan</h3></div><small>${questionsForReview.length} pertanyaan</small></div><div class="lm-answer-table-wrap"><table class="lm-answer-table"><thead><tr><th># / Pertanyaan</th><th>${esc(reviewNames.host)}</th><th>${esc(reviewNames.guest)}</th><th>Kesamaan</th></tr></thead><tbody>${questionsForReview.map((question, index) => {
      const hostAnswer = answerSets.host?.[index];
      const guestAnswer = answerSets.guest?.[index];
      const same = hostAnswer && guestAnswer && hostAnswer === guestAnswer;
      return `<tr><td><span class="lm-answer-axis">${esc(question.axis)}</span><b>${index + 1}. ${esc(question.prompt)}</b></td><td><span class="lm-answer-letter">${esc(hostAnswer || '—')}</span>${esc(answerText(question, hostAnswer))}</td><td><span class="lm-answer-letter">${esc(guestAnswer || '—')}</span>${esc(answerText(question, guestAnswer))}</td><td><span class="lm-match-pill ${same ? 'is-match' : 'is-different'}">${same ? 'Sama' : 'Berbeda'}</span></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  }

  function resultView(result, resultNames, answerSets, local) {
    if (!result || !result.hostProfile || !result.guestProfile) return `<section class="bm-panel bm-center-panel"><h2>Menghitung kecocokan…</h2><p>Menyiapkan ringkasan jawaban kalian.</p></section>`;
    const cards = `${profileCard(resultNames.host, 'is-pink', result.hostProfile)}${profileCard(resultNames.guest, 'is-blue', result.guestProfile)}`;
    const axes = Object.entries(result.axes).map(([axis, value]) => `<article class="lm-axis-explain"><div><strong>${esc(axis)}</strong><b>${value}% jawaban sama</b></div><h4>${esc(AXIS_INFO[axis].title)}</h4><p>${esc(AXIS_INFO[axis].detail)}</p><i><b style="width:${value}%"></b></i></article>`).join('');
    return `<section class="bm-panel lm-result-panel"><span class="bm-tag">REKAPAN LOVE MATCH</span><div class="lm-score-wrap"><strong>${result.score}%</strong><span>KECOCOKAN JAWABAN</span><small>${result.matched} dari ${result.total} jawaban sama</small></div><div class="lm-profile-grid">${cards}</div><div class="lm-result-stat-grid"><article><small>JAWABAN SAMA</small><strong>${result.matched}</strong><span>kesamaan pilihan</span></article><article><small>JAWABAN BERBEDA</small><strong>${result.total - result.matched}</strong><span>bahan untuk saling mengenal</span></article></div><section class="lm-axis-review"><div class="lm-section-heading"><div><span class="bm-tag">EMPAT DIMENSI</span><h3>Bagaimana membaca hasilnya?</h3></div></div><div class="lm-axis-grid">${axes}</div></section>${answerReview(questions, answerSets, resultNames)}<p class="bm-muted">Love Match adalah kuis refleksi ringan yang terinspirasi dari preferensi kepribadian. Hasil bukan diagnosis psikologis, bukan label tetap, dan tidak menentukan kualitas hubungan.</p><div class="bm-result-actions lm-export-actions"><button class="button button-primary" data-bm-action="download-json">Unduh laporan lengkap (.json)</button><button class="button button-secondary" data-bm-action="download-csv">Unduh jawaban (.csv)</button><button class="button button-quiet" data-bm-action="${local ? 'replay' : 'back'}">${local ? 'Tes lagi' : 'Kembali ke lobi'}</button></div></section>`;
  }

  function resultPayload() {
    const answerSets = standalone ? localAnswers : { host: partnerAnswers.host || {}, guest: partnerAnswers.guest || {} };
    const result = calculateLoveMatch(answerSets.host, answerSets.guest, questions);
    const reportNames = standalone ? localNames : names;
    const answerRows = questions.map((question, index) => ({
      number: index + 1,
      dimension: question.axis,
      question: question.prompt,
      player1: { choice: answerSets.host?.[index] || null, answer: answerText(question, answerSets.host?.[index]) },
      player2: { choice: answerSets.guest?.[index] || null, answer: answerText(question, answerSets.guest?.[index]) },
      same: Boolean(answerSets.host?.[index] && answerSets.host?.[index] === answerSets.guest?.[index])
    }));
    return {
      title: 'Love Match — Laporan Hasil',
      generatedAt: new Date().toISOString(),
      note: 'Kuis refleksi ringan, bukan alat diagnosis psikologis.',
      players: { host: reportNames.host, guest: reportNames.guest },
      match: { score: result.score, matched: result.matched, total: result.total, axes: result.axes },
      personalityProfiles: { host: result.hostProfile, guest: result.guestProfile },
      answers: answerRows
    };
  }

  function downloadResult(format) {
    const report = resultPayload();
    const stamp = formatDate();
    if (format === 'json') {
      downloadText(`love-match-${stamp}.json`, JSON.stringify(report, null, 2), 'application/json');
      toast('Laporan Love Match berhasil diunduh.', 'success');
      return;
    }
    const rows = [
      ['No', 'Dimensi', 'Pertanyaan', report.players.host, `Pilihan ${report.players.host}`, report.players.guest, `Pilihan ${report.players.guest}`, 'Kesamaan'],
      ...report.answers.map(answer => [answer.number, answer.dimension, answer.question, answer.player1.answer, answer.player1.choice || '', answer.player2.answer, answer.player2.choice || '', answer.same ? 'Sama' : 'Berbeda'])
    ];
    const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
    downloadText(`love-match-jawaban-${stamp}.csv`, csv, 'text/csv');
    toast('Daftar jawaban berhasil diunduh.', 'success');
  }

  async function seedRemote() {
    if (role !== 'host') return;
    const snap = await get(baseRef);
    if (snap.exists()) {
      const current = snap.val() || {};
      setQuestionSet(current.questionIds);
      return;
    }
    questions = selectLoveQuestions(createRandomSeed(), 8);
    await set(baseRef, {
      questionIds: questions.map(question => question.id),
      meta: { phase: 'answering', questionIndex: 0, total: questions.length, startedAt: Date.now() },
      submissions: { host: false, guest: false },
      questionStatus: {}
    });
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
    if (standalone || pub.meta?.phase !== 'result' || partnerAnswersLoaded || !room.guest?.uid) return;
    try {
      const [mine, theirs] = await Promise.all([
        get(ref(db, `${privateRoot}/${room.host.uid}/answers`)),
        get(ref(db, `${privateRoot}/${room.guest.uid}/answers`))
      ]);
      partnerAnswers.host = mine.val() || {};
      partnerAnswers.guest = theirs.val() || {};
      partnerAnswersLoaded = true;
      render();
    } catch (error) { toast(`Jawaban belum dapat dibuka: ${error.message}`, 'error'); }
  }

  async function submitAnswer() {
    const index = Number(pub.meta?.questionIndex || 0);
    if (busy || (myAnswers[index] !== 'A' && myAnswers[index] !== 'B')) return;
    busy = true;
    try {
      await storeMyAnswers();
      toast('Jawaban tersimpan secara pribadi.', 'success');
    } catch (error) { toast(`Jawaban belum tersimpan: ${error.message}`, 'error'); }
    finally { busy = false; }
  }

  function handleLocalAnswer(value) {
    localAnswers[localTurn][localIndex] = value;
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
    if (action === 'local-start') {
      localNames.host = root.querySelector('[data-lm-name="host"]').value.trim() || 'Pemain 1';
      localNames.guest = root.querySelector('[data-lm-name="guest"]').value.trim() || 'Pemain 2';
      questions = selectLoveQuestions(createRandomSeed(), 8);
      localAnswers = { host: {}, guest: {} }; localTurn = 'host'; localIndex = 0; phase = 'answering'; render();
    }
    if (action === 'local-handover') { phase = 'answering'; render(); }
    if (action === 'local-next') localNext();
    if (action === 'submit-answer') void submitAnswer();
    if (action === 'download-json') downloadResult('json');
    if (action === 'download-csv') downloadResult('csv');
    if (action === 'replay') {
      if (standalone) { phase = 'setup'; questions = LOVE_QUESTIONS; localAnswers = { host: {}, guest: {} }; localTurn = 'host'; localIndex = 0; }
      else onBack?.();
      render();
    }
  }

  root.addEventListener('click', clickHandler);
  if (!standalone) {
    const myPath = ref(db, `${privateRoot}/${myUid}/answers`);
    unsubscribeMine = onValue(myPath, snap => { myAnswers = snap.val() || {}; render(); });
    unsubscribePublic = onValue(baseRef, snap => {
      pub = snap.val() || {};
      setQuestionSet(pub.questionIds);
      if (pub.meta?.phase === 'answering') void maybeAdvanceQuestion();
      if (pub.meta?.phase === 'result') void loadPartnerAnswers();
      render();
    });
    void seedRemote().catch(error => toast(`Sesi belum dapat disiapkan: ${error.message}`, 'error'));
  } else render();

  return { destroy() { destroyed = true; root.removeEventListener('click', clickHandler); unsubscribePublic?.(); unsubscribeMine?.(); } };
}
