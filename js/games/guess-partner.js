import { db, ref, get, set, onValue, runTransaction } from '../firebase.js';
import {
  choosePrompt, nextRoundMeta, nextMatchMeta, cleanPlayerText, scoreForRating,
  evaluateAnswerMatch, ratingLabel, calculateGuessScores, answererRoleForRound, oppositeRole, getRemainingSeconds,
  formatTime, isBothLocked, TOTAL_ROUNDS, ROUND_DURATION_SECONDS
} from './guess-partner-logic.js?v=0.23.0';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const makeKey = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function mountGuessPartner(root, context) {
  const { code, session, room, role, player, onBack, toast = () => {} } = context;
  const { host, guest } = room;
  const myUid = player.uid;
  const basePath = `roomGames/${code}/${session.sessionId}/guessPartner`;
  const privateBasePath = `privateRooms/${code}/guesspartner/${session.sessionId}`;
  const opponentRole = oppositeRole(role);
  const opponentUid = room[opponentRole]?.uid;
  const names = { host: host?.name || 'Pembuat ruang', guest: guest?.name || 'Tamu' };
  const baseRef = ref(db, basePath);
  const metaRef = ref(db, `${basePath}/meta`);
  let data = {};
  let serverOffset = 0;
  let unsubscribe = null;
  let timer = 0;
  let destroyed = false;
  let submitting = false;
  let ratingBusy = false;
  let continueBusy = false;
  let rematchBusy = false;
  let advancing = false;
  let revealLoadKey = '';
  let privateLoadedKey = '';
  let resultLoadKey = '';
  let privateRound = {};
  let resultPrivate = {};
  let localDraft = '';
  let lastToastKey = '';

  const currentMeta = () => data.meta || null;
  const roundPath = (roundKey, uid) => `${privateBasePath}/${uid}/rounds/${roundKey}`;
  const answerStatus = meta => data.answerStatus?.[meta?.roundKey] || {};
  const guessStatus = meta => data.guessStatus?.[meta?.roundKey] || {};
  const isAnswerer = meta => meta?.answererRole === role;
  const myLocked = meta => isAnswerer(meta)
    ? answerStatus(meta)?.[role]?.locked === true
    : guessStatus(meta)?.[role]?.locked === true;
  const partnerLocked = meta => isAnswerer(meta)
    ? guessStatus(meta)?.[opponentRole]?.locked === true
    : answerStatus(meta)?.[opponentRole]?.locked === true;

  function renderShell() {
    root.innerHTML = `
      <section class="gp-shell">
        <header class="gp-header">
          <div><span class="dt-kicker">DIRI. · MINI GAME 02</span><h1>Tebak Pasangan <span>♡</span></h1><p>Seberapa baik kamu mengenal isi kepala pasangan?</p></div>
          <div class="dt-header-actions"><span class="dt-room-code">${esc(code)}</span><button class="button button-quiet button-small" data-gp-action="back">Kembali</button></div>
        </header>

        <section class="gp-stage" data-gp-panel="playing" hidden>
          <div class="gp-topline"><div><span class="dt-kicker">RONDE <b data-gp-round>1</b> DARI ${TOTAL_ROUNDS}</span><div class="gp-progress" data-gp-progress></div></div><div class="gp-timer" data-gp-timer>1:00</div></div>
          <div class="gp-player-row">
            <div class="gp-player-pill is-answerer" data-gp-player="answerer"><span class="gp-avatar">♡</span><div><strong data-gp-answerer-name></strong><small>Menjawab</small></div></div>
            <div class="gp-player-pill" data-gp-player="guesser"><span class="gp-avatar">✿</span><div><strong data-gp-guesser-name></strong><small>Menebak</small></div></div>
          </div>
          <article class="gp-prompt-card"><span data-gp-category>PERTANYAAN</span><h2 data-gp-prompt>Menyiapkan pertanyaan…</h2><p>Satu orang menjawab jujur, satu orang menebak. Jawaban asli tetap rahasia sampai keduanya mengunci.</p></article>
          <div class="gp-task-card">
            <span class="gp-task-label" data-gp-task-label>TUGASMU</span>
            <h3 data-gp-task-title>Siapkan jawabanmu</h3>
            <form data-gp-form>
              <label for="gp-response" data-gp-input-label>Jawabanmu</label>
              <textarea id="gp-response" name="response" maxlength="140" rows="3" placeholder="Tulis jawaban singkatmu…" required></textarea>
              <div class="gp-form-foot"><small>Maksimal 140 karakter. Jawaban tidak terlihat oleh pasangan sebelum reveal.</small><button class="button button-primary" type="submit" data-gp-submit>Kunci jawaban</button></div>
            </form>
            <div class="gp-locked-note" data-gp-locked hidden>Jawabanmu sudah terkunci. Menunggu pasangan… ✓</div>
          </div>
          <div class="gp-lock-status"><div><strong>${esc(names.host)}</strong><span data-gp-player-lock="host">Belum mengunci</span></div><div><strong>${esc(names.guest)}</strong><span data-gp-player-lock="guest">Belum mengunci</span></div></div>
          <p class="gp-small-note">Ronde bergantian: kamu menjawab di ronde ganjil, pasangan menjawab di ronde genap.</p>
        </section>

        <section class="gp-stage gp-reveal-stage" data-gp-panel="reveal" hidden>
          <span class="dt-kicker">SAATNYA REVEAL · RONDE <b data-gp-reveal-round>1</b></span>
          <h2>Apakah tebakanmu benar? 👀</h2>
          <p data-gp-reveal-prompt></p>
          <div class="gp-reveal-grid">
            <article><small>JAWABAN ASLI</small><strong data-gp-answer>Memuat jawaban…</strong></article>
            <article><small>TEBAKAN PASANGAN</small><strong data-gp-guess>Memuat tebakan…</strong></article>
          </div>
          <div class="gp-auto-score" data-gp-auto-score hidden>
            <strong data-gp-auto-title>Menilai kecocokan kata…</strong>
            <p data-gp-auto-detail>Skor dihitung otomatis dari kata kunci jawaban.</p>
          </div>
        </section>

        <section class="gp-stage gp-round-result" data-gp-panel="round-result" hidden>
          <span class="dt-kicker">HASIL RONDE <b data-gp-result-round>1</b></span>
          <h2 data-gp-result-title>Jawaban terungkap! ♡</h2>
          <p data-gp-result-description></p>
          <div class="gp-score-strip"><div><small>${esc(names.host)}</small><strong data-gp-score-host>0</strong></div><span>SKOR</span><div><small>${esc(names.guest)}</small><strong data-gp-score-guest>0</strong></div></div>
          <div class="gp-round-result-status"><span data-gp-continue="host">Belum lanjut</span><span data-gp-continue="guest">Belum lanjut</span></div>
          <button class="button button-primary" data-gp-action="continue">Lanjutkan</button>
          <p class="gp-small-note" data-gp-continue-note>Kedua pemain perlu menekan Lanjutkan.</p>
        </section>

        <section class="gp-stage gp-final-result" data-gp-panel="result-game" hidden>
          <span class="dt-kicker">PERMAINAN SELESAI</span><div class="gp-final-heart">♡</div>
          <h2>Kalian saling mengenal sejauh apa?</h2>
          <p>Enam ronde selesai. Lihat hasil tebak-tebakan kalian.</p>
          <div class="gp-final-scores"><div><span>✿</span><small>${esc(names.host)}</small><strong data-gp-final-host>0</strong><em>poin</em></div><div><span>♡</span><small>${esc(names.guest)}</small><strong data-gp-final-guest>0</strong><em>poin</em></div></div>
          <div class="gp-history" data-gp-history></div>
          <div class="gp-rematch-row"><button class="button button-primary" data-gp-action="rematch">Main lagi</button><button class="button button-secondary" data-gp-action="back">Kembali</button></div>
          <div class="gp-round-result-status"><span data-gp-rematch="host">Belum memilih</span><span data-gp-rematch="guest">Belum memilih</span></div>
          <p class="gp-small-note" data-gp-rematch-note>Kalian berdua perlu memilih Main lagi untuk mengulang permainan.</p>
        </section>

        <section class="gp-error-card" data-gp-panel="error" hidden><h2>Permainan belum bisa dibuka</h2><p data-gp-error></p><button class="button button-secondary" data-gp-action="back">Kembali</button></section>
      </section>`;
    root.addEventListener('click', clickHandler);
    root.addEventListener('submit', submitHandler);
  }

  function initialRoundMeta() {
    const promptData = choosePrompt();
    return {
      phase: 'playing', matchNo: 1, matchKey: makeKey(), roundNo: 1, roundKey: makeKey(),
      prompt: promptData.prompt, category: promptData.category, answererRole: 'host',
      startedAt: Date.now() + serverOffset, durationSeconds: ROUND_DURATION_SECONDS
    };
  }

  async function ensureInitialRound() {
    if (role !== 'host') return;
    const snapshot = await get(metaRef);
    if (snapshot.exists()) return;
    const meta = initialRoundMeta();
    await set(ref(db, `${basePath}/rounds/${meta.roundKey}`), {
      matchNo: meta.matchNo, matchKey: meta.matchKey, roundNo: meta.roundNo, roundKey: meta.roundKey,
      prompt: meta.prompt, category: meta.category, answererRole: meta.answererRole
    });
    await set(metaRef, meta);
  }

  async function loadPrivateRound(meta) {
    if (!meta?.roundKey || !['reveal', 'round-result', 'result-game'].includes(meta.phase)) return;
    const cacheKey = meta.roundKey;
    if (revealLoadKey === cacheKey) return;
    revealLoadKey = cacheKey;
    try {
      const [hostSnap, guestSnap] = await Promise.all([
        get(ref(db, roundPath(meta.roundKey, host.uid))),
        get(ref(db, roundPath(meta.roundKey, guest.uid)))
      ]);
      if (destroyed || currentMeta()?.roundKey !== cacheKey) return;
      privateRound = { host: hostSnap.val() || {}, guest: guestSnap.val() || {} };
      privateLoadedKey = cacheKey;
      render();
      if (role === meta.answererRole && !data.ratings?.[cacheKey]) {
        const answer = privateRound[meta.answererRole]?.text || '';
        const guess = privateRound[oppositeRole(meta.answererRole)]?.text || '';
        void submitAutomaticRating(meta, evaluateAnswerMatch(answer, guess));
      }
    } catch (error) {
      revealLoadKey = '';
      notifyOnce(`private-${cacheKey}`, `Jawaban belum bisa dibuka: ${error.message}`, 'error');
    }
  }

  async function loadFinalPrivate(meta) {
    const matchKey = meta?.matchKey;
    if (!matchKey || resultLoadKey === matchKey) return;
    resultLoadKey = matchKey;
    try {
      const rounds = Object.values(data.rounds || {}).filter(item => item.matchKey === matchKey).sort((a,b) => a.roundNo - b.roundNo);
      const docs = await Promise.all(rounds.flatMap(round => [
        get(ref(db, roundPath(round.roundKey, host.uid))),
        get(ref(db, roundPath(round.roundKey, guest.uid)))
      ]));
      if (destroyed || currentMeta()?.matchKey !== matchKey) return;
      resultPrivate = {};
      rounds.forEach((round, index) => {
        resultPrivate[round.roundKey] = { host: docs[index*2].val() || {}, guest: docs[index*2+1].val() || {} };
      });
      render();
    } catch (error) {
      resultLoadKey = '';
      notifyOnce(`final-${matchKey}`, `Rangkuman jawaban belum bisa dimuat: ${error.message}`, 'error');
    }
  }

  function notifyOnce(key, message, type='default') {
    if (lastToastKey === key) return;
    lastToastKey = key;
    toast(message, type);
  }

  function renderStatusLocks(meta) {
    for (const playerRole of ['host', 'guest']) {
      const playerIsAnswerer = meta.answererRole === playerRole;
      const locked = playerIsAnswerer
        ? data.answerStatus?.[meta.roundKey]?.[playerRole]?.locked === true
        : data.guessStatus?.[meta.roundKey]?.[playerRole]?.locked === true;
      const status = root.querySelector(`[data-gp-player-lock="${playerRole}"]`);
      if (status) status.textContent = locked
        ? (playerIsAnswerer ? 'Jawaban terkunci ✓' : 'Tebakan terkunci ✓')
        : (playerIsAnswerer ? 'Sedang menjawab…' : 'Sedang menebak…');
    }
  }

  function renderPlaying(meta) {
    root.querySelector('[data-gp-round]').textContent = meta.roundNo;
    root.querySelector('[data-gp-progress]').innerHTML = Array.from({ length: TOTAL_ROUNDS }, (_, i) => `<i class="${i < meta.roundNo ? 'done' : ''}"></i>`).join('');
    root.querySelector('[data-gp-answerer-name]').textContent = names[meta.answererRole];
    root.querySelector('[data-gp-guesser-name]').textContent = names[oppositeRole(meta.answererRole)];
    root.querySelector('[data-gp-category]').textContent = String(meta.category || 'PERTANYAAN').toUpperCase();
    root.querySelector('[data-gp-prompt]').textContent = meta.prompt;
    const answerer = isAnswerer(meta);
    root.querySelector('[data-gp-task-label]').textContent = answerer ? 'JAWABAN RAHASIA' : 'TEBAK JAWABAN PASANGAN';
    root.querySelector('[data-gp-task-title]').textContent = answerer ? 'Jawab dengan jujur' : 'Menurutmu apa jawabannya?';
    root.querySelector('[data-gp-input-label]').textContent = answerer ? 'Jawaban aslimu' : 'Tebakanmu';
    root.querySelector('#gp-response').placeholder = answerer ? 'Tulis jawaban yang paling menggambarkan dirimu…' : 'Tulis tebakanmu tentang pasangan…';
    const locked = myLocked(meta);
    root.querySelector('[data-gp-form]').hidden = locked;
    root.querySelector('[data-gp-locked]').hidden = !locked;
    root.querySelector('[data-gp-submit]').textContent = submitting ? 'Menyimpan…' : answerer ? 'Kunci jawaban' : 'Kunci tebakan';
    root.querySelector('[data-gp-submit]').disabled = submitting;
    renderStatusLocks(meta);
    updateTimer();
  }

  function renderReveal(meta) {
    root.querySelector('[data-gp-reveal-round]').textContent = meta.roundNo;
    root.querySelector('[data-gp-reveal-prompt]').textContent = meta.prompt;
    const answerer = meta.answererRole;
    const guesser = oppositeRole(answerer);
    const answer = privateRound[answerer]?.text || 'Belum mengirim jawaban';
    const guess = privateRound[guesser]?.text || 'Belum mengirim tebakan';
    root.querySelector('[data-gp-answer]').textContent = answer;
    root.querySelector('[data-gp-guess]').textContent = guess;
    const result = evaluateAnswerMatch(privateRound[answerer]?.text || '', privateRound[guesser]?.text || '');
    const ready = privateLoadedKey === meta.roundKey;
    const scoreBox = root.querySelector('[data-gp-auto-score]');
    scoreBox.hidden = !ready;
    root.querySelector('[data-gp-auto-title]').textContent = `${ratingLabel(result.rating)} · ${result.score} poin`;
    root.querySelector('[data-gp-auto-detail]').textContent = result.exactMatch
      ? 'Jawaban sama persis setelah mengabaikan kapitalisasi dan tanda baca.'
      : result.matchedWords.length
        ? `Kata yang cocok: ${result.matchedWords.join(', ')}. Frasa belum sama persis, jadi mendapat 1 poin.`
        : 'Tidak ada kata kunci jawaban yang cocok. Tebakan mendapat 0 poin.';
    if (ready && role === answerer && !data.ratings?.[meta.roundKey]) void submitAutomaticRating(meta, result);
  }

  function scoreTotals(matchKey) {
    const rounds = Object.values(data.rounds || {}).filter(round => round.matchKey === matchKey);
    const scored = rounds.map(round => ({ answererRole: round.answererRole, rating: data.ratings?.[round.roundKey]?.rating }));
    return calculateGuessScores(scored);
  }

  function renderRoundResult(meta) {
    const rating = data.ratings?.[meta.roundKey];
    const score = scoreTotals(meta.matchKey);
    root.querySelector('[data-gp-result-round]').textContent = meta.roundNo;
    root.querySelector('[data-gp-result-title]').textContent = rating?.rating === 'correct' ? 'Tebakan tepat! ✨' : rating?.rating === 'close' ? 'Hampir benar! ♡' : 'Belum cocok, tapi seru!';
    const matched = Array.isArray(rating?.matchedWords) && rating.matchedWords.length ? ` Kata yang cocok: ${rating.matchedWords.join(', ')}.` : '';
    root.querySelector('[data-gp-result-description]').textContent = rating ? `${names[oppositeRole(meta.answererRole)]} mendapat ${rating.score} poin pada ronde ini.${matched}` : 'Penilaian otomatis belum tersedia untuk ronde ini.';
    root.querySelector('[data-gp-score-host]').textContent = score.host;
    root.querySelector('[data-gp-score-guest]').textContent = score.guest;
    for (const playerRole of ['host','guest']) {
      const el = root.querySelector(`[data-gp-continue="${playerRole}"]`);
      if (el) el.textContent = data.continueStatus?.[meta.roundKey]?.[playerRole] === true ? 'Siap lanjut ✓' : 'Belum lanjut';
    }
    const mineContinued = data.continueStatus?.[meta.roundKey]?.[role] === true;
    const button = root.querySelector('[data-gp-action="continue"]');
    button.disabled = mineContinued || continueBusy;
    button.textContent = mineContinued ? 'Menunggu pasangan…' : continueBusy ? 'Menyimpan…' : meta.roundNo === TOTAL_ROUNDS ? 'Lihat hasil akhir' : 'Lanjutkan';
    const partnerContinued = data.continueStatus?.[meta.roundKey]?.[opponentRole] === true;
    root.querySelector('[data-gp-continue-note]').textContent = mineContinued && partnerContinued ? 'Membuka ronde berikutnya…' : mineContinued ? 'Permintaan tersimpan. Menunggu pasangan.' : partnerContinued ? 'Pasangan siap. Tekan Lanjutkan untuk meneruskan.' : 'Kalian berdua perlu menekan Lanjutkan.';
  }

  function renderFinalResult(meta) {
    const rounds = Object.values(data.rounds || {}).filter(round => round.matchKey === meta.matchKey).sort((a,b) => a.roundNo - b.roundNo);
    const scoredRounds = rounds.map(round => ({ answererRole: round.answererRole, rating: data.ratings?.[round.roundKey]?.rating }));
    const scores = calculateGuessScores(scoredRounds);
    root.querySelector('[data-gp-final-host]').textContent = scores.host;
    root.querySelector('[data-gp-final-guest]').textContent = scores.guest;
    const history = root.querySelector('[data-gp-history]');
    history.innerHTML = rounds.map(round => {
      const answerer = round.answererRole;
      const guesser = oppositeRole(answerer);
      const saved = resultPrivate[round.roundKey] || {};
      const answer = saved[answerer]?.text || 'Tidak dijawab';
      const guess = saved[guesser]?.text || 'Tidak ditebak';
      const ratingData = data.ratings?.[round.roundKey];
      const rating = ratingData?.rating;
      const label = rating === 'correct' ? 'Tepat · 2 poin' : rating === 'close' ? 'Hampir · 1 poin' : 'Meleset · 0 poin';
      const matched = Array.isArray(ratingData?.matchedWords) && ratingData.matchedWords.length
        ? `<small>Kata cocok: ${esc(ratingData.matchedWords.join(', '))}</small>` : '';
      return `<article class="gp-history-item"><small>RONDE ${round.roundNo} · ${esc(round.category || 'Umum')}</small><strong>${esc(round.prompt)}</strong><p><b>${esc(names[answerer])}:</b> ${esc(answer)}</p><p><b>${esc(names[guesser])} menebak:</b> ${esc(guess)}</p><em>${label}</em>${matched}</article>`;
    }).join('') || '<p>Rangkuman belum tersedia.</p>';
    for (const playerRole of ['host','guest']) {
      const el = root.querySelector(`[data-gp-rematch="${playerRole}"]`);
      if (el) el.textContent = data.rematchRequests?.[meta.matchKey]?.[playerRole] === true ? 'Ingin main lagi ✓' : 'Belum memilih';
    }
    const asked = data.rematchRequests?.[meta.matchKey]?.[role] === true;
    const button = root.querySelector('[data-gp-action="rematch"]');
    button.disabled = asked || rematchBusy;
    button.textContent = asked ? 'Menunggu pasangan…' : rematchBusy ? 'Mengirim…' : 'Main lagi';
    const otherAsked = data.rematchRequests?.[meta.matchKey]?.[opponentRole] === true;
    root.querySelector('[data-gp-rematch-note]').textContent = asked && otherAsked ? 'Menyiapkan permainan berikutnya…' : asked ? 'Permintaan terkirim. Menunggu pasangan.' : otherAsked ? 'Pasangan ingin bermain lagi. Kamu mau ikut?' : 'Kalian berdua perlu memilih Main lagi untuk mengulang permainan.';
  }

  function render() {
    if (destroyed) return;
    const meta = currentMeta();
    const phases = ['playing','reveal','round-result','result-game'];
    for (const phase of phases) root.querySelector(`[data-gp-panel="${phase}"]`).hidden = meta?.phase !== phase;
    root.querySelector('[data-gp-panel="error"]').hidden = true;
    if (!meta) return;
    if (meta.phase === 'playing') renderPlaying(meta);
    if (meta.phase === 'reveal') renderReveal(meta);
    if (meta.phase === 'round-result') renderRoundResult(meta);
    if (meta.phase === 'result-game') renderFinalResult(meta);
  }

  async function submitResponse(form) {
    const meta = currentMeta();
    if (!meta || meta.phase !== 'playing' || submitting || myLocked(meta)) return;
    const input = form.elements.response;
    const text = cleanPlayerText(input.value, 140);
    if (!text) { input.focus(); return; }
    submitting = true;
    root.querySelector('[data-gp-submit]').disabled = true;
    try {
      const privatePayload = { text, submittedAt: Date.now() + serverOffset, kind: isAnswerer(meta) ? 'answer' : 'guess' };
      await set(ref(db, roundPath(meta.roundKey, myUid)), privatePayload);
      const statusPath = isAnswerer(meta)
        ? `${basePath}/answerStatus/${meta.roundKey}/${role}`
        : `${basePath}/guessStatus/${meta.roundKey}/${role}`;
      await set(ref(db, statusPath), { locked: true, at: Date.now() + serverOffset });
      localDraft = '';
      toast(isAnswerer(meta) ? 'Jawaban asli terkunci. Pasangan sedang menebak.' : 'Tebakan terkunci. Menunggu jawaban dibuka.', 'success');
    } catch (error) {
      toast(`Jawaban belum tersimpan: ${error.message}`, 'error');
    } finally {
      submitting = false;
      render();
    }
  }

  async function revealRound() {
    const meta = currentMeta();
    if (role !== 'host' || !meta || meta.phase !== 'playing' || advancing) return;
    const bothLocked = isBothLocked(meta, data.answerStatus, data.guessStatus);
    const expired = getRemainingSeconds(meta.startedAt, meta.durationSeconds, Date.now() + serverOffset) <= 0;
    if (!bothLocked && !expired) return;
    advancing = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'playing' || current.roundKey !== meta.roundKey) return;
        const currentBothLocked = isBothLocked(current, data.answerStatus, data.guessStatus);
        const currentExpired = getRemainingSeconds(current.startedAt, current.durationSeconds, Date.now() + serverOffset) <= 0;
        if (!currentBothLocked && !currentExpired) return;
        return { ...current, phase: 'reveal', revealedAt: Date.now() + serverOffset };
      }, { applyLocally: false });
    } catch (error) { notifyOnce(`reveal-${meta.roundKey}`, `Belum bisa membuka jawaban: ${error.message}`, 'error'); }
    finally { advancing = false; }
  }

  async function submitAutomaticRating(meta, evaluation) {
    if (!meta || meta.phase !== 'reveal' || role !== meta.answererRole || ratingBusy || data.ratings?.[meta.roundKey]) return;
    ratingBusy = true;
    try {
      await set(ref(db, `${basePath}/ratings/${meta.roundKey}`), {
        rating: evaluation.rating, score: scoreForRating(evaluation.rating),
        matchedWords: evaluation.matchedWords.slice(0, 20),
        matchedCount: evaluation.matchedCount, totalKeywords: evaluation.totalKeywords,
        byRole: role, createdAt: Date.now() + serverOffset, method: 'keyword-auto'
      });
    } catch (error) {
      notifyOnce(`auto-rating-${meta.roundKey}`, `Penilaian otomatis belum tersimpan: ${error.message}`, 'error');
    } finally { ratingBusy = false; }
  }

  async function showRoundResult() {
    const meta = currentMeta();
    if (role !== 'host' || advancing || meta?.phase !== 'reveal') return;
    const ratingReady = Boolean(data.ratings?.[meta.roundKey]);
    const ratingExpired = Date.now() + serverOffset >= Number(meta.revealedAt || 0) + 20000;
    if (!ratingReady && !ratingExpired) return;
    advancing = true;
    try {
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'reveal' || current.roundKey !== meta.roundKey) return;
        const hasRating = Boolean(data.ratings?.[meta.roundKey]);
        const timeoutPassed = Date.now() + serverOffset >= Number(current.revealedAt || 0) + 20000;
        if (!hasRating && !timeoutPassed) return;
        return { ...current, phase: 'round-result', resultAt: Date.now() + serverOffset };
      }, { applyLocally: false });
    } catch (error) { notifyOnce(`rating-${meta.roundKey}`, `Hasil ronde belum bisa dibuka: ${error.message}`, 'error'); }
    finally { advancing = false; }
  }

  async function continueRound() {
    const meta = currentMeta();
    if (!meta || meta.phase !== 'round-result' || continueBusy || data.continueStatus?.[meta.roundKey]?.[role] === true) return;
    continueBusy = true; render();
    try {
      await set(ref(db, `${basePath}/continueStatus/${meta.roundKey}/${role}`), true);
    } catch (error) { toast(`Belum bisa melanjutkan: ${error.message}`, 'error'); }
    finally { continueBusy = false; render(); }
  }

  async function advanceAfterResult() {
    const meta = currentMeta();
    if (role !== 'host' || !meta || meta.phase !== 'round-result' || advancing) return;
    const both = data.continueStatus?.[meta.roundKey]?.host === true && data.continueStatus?.[meta.roundKey]?.guest === true;
    const auto = Date.now() + serverOffset >= Number(meta.resultAt || 0) + 12000;
    if (!both && !auto) return;
    advancing = true;
    try {
      if (Number(meta.roundNo) >= TOTAL_ROUNDS) {
        await runTransaction(metaRef, current => {
          if (!current || current.phase !== 'round-result' || current.roundKey !== meta.roundKey) return;
          const agreed = data.continueStatus?.[meta.roundKey]?.host === true && data.continueStatus?.[meta.roundKey]?.guest === true;
          const timedOut = Date.now() + serverOffset >= Number(current.resultAt || 0) + 12000;
          if (!agreed && !timedOut) return;
          return { ...current, phase: 'result-game', endedAt: Date.now() + serverOffset };
        }, { applyLocally: false });
      } else {
        const promptData = choosePrompt(meta.prompt);
        const next = nextRoundMeta(meta, promptData, Date.now() + serverOffset, makeKey);
        await set(ref(db, `${basePath}/rounds/${next.roundKey}`), {
          matchNo: next.matchNo, matchKey: next.matchKey, roundNo: next.roundNo,
          roundKey: next.roundKey, prompt: next.prompt, category: next.category,
          answererRole: next.answererRole
        });
        await runTransaction(metaRef, current => {
          if (!current || current.phase !== 'round-result' || current.roundKey !== meta.roundKey) return;
          const agreed = data.continueStatus?.[meta.roundKey]?.host === true && data.continueStatus?.[meta.roundKey]?.guest === true;
          const timedOut = Date.now() + serverOffset >= Number(current.resultAt || 0) + 12000;
          if (!agreed && !timedOut) return;
          return next;
        }, { applyLocally: false });
      }
    } catch (error) { notifyOnce(`advance-${meta.roundKey}`, `Ronde berikutnya belum bisa dimulai: ${error.message}`, 'error'); }
    finally { advancing = false; }
  }

  async function requestRematch() {
    const meta = currentMeta();
    if (!meta || meta.phase !== 'result-game' || rematchBusy || data.rematchRequests?.[meta.matchKey]?.[role] === true) return;
    rematchBusy = true; render();
    try { await set(ref(db, `${basePath}/rematchRequests/${meta.matchKey}/${role}`), true); }
    catch (error) { toast(`Permintaan main lagi belum tersimpan: ${error.message}`, 'error'); }
    finally { rematchBusy = false; render(); }
  }

  async function beginRematch() {
    const meta = currentMeta();
    if (role !== 'host' || advancing || meta?.phase !== 'result-game') return;
    const votes = data.rematchRequests?.[meta.matchKey] || {};
    if (votes.host !== true || votes.guest !== true) return;
    advancing = true;
    try {
      const promptData = choosePrompt(meta.prompt);
      const next = nextMatchMeta(meta, promptData, Date.now() + serverOffset, makeKey);
      await set(ref(db, `${basePath}/rounds/${next.roundKey}`), {
        matchNo: next.matchNo, matchKey: next.matchKey, roundNo: next.roundNo,
        roundKey: next.roundKey, prompt: next.prompt, category: next.category,
        answererRole: next.answererRole
      });
      await runTransaction(metaRef, current => {
        if (!current || current.phase !== 'result-game' || current.matchKey !== meta.matchKey) return;
        const currentVotes = data.rematchRequests?.[current.matchKey] || {};
        if (currentVotes.host !== true || currentVotes.guest !== true) return;
        return next;
      }, { applyLocally: false });
      privateRound = {}; resultPrivate = {}; revealLoadKey = ''; privateLoadedKey = ''; resultLoadKey = '';
      toast('Permainan baru siap! ♡', 'success');
    } catch (error) { toast(`Rematch belum bisa dimulai: ${error.message}`, 'error'); }
    finally { advancing = false; }
  }

  function updateTimer() {
    const meta = currentMeta();
    if (!meta || meta.phase !== 'playing') return;
    const remaining = getRemainingSeconds(meta.startedAt, meta.durationSeconds, Date.now() + serverOffset);
    const timerEl = root.querySelector('[data-gp-timer]');
    if (timerEl) timerEl.textContent = formatTime(remaining);
    if (remaining <= 0 && role === 'host') void revealRound();
    if (role === 'host' && isBothLocked(meta, data.answerStatus, data.guessStatus)) void revealRound();
  }

  function clickHandler(event) {
    const action = event.target.closest('[data-gp-action]');
    if (!action) return;
    event.preventDefault();
    const name = action.dataset.gpAction;
    if (name === 'back') onBack?.();
    if (name === 'continue') void continueRound();
    if (name === 'rematch') void requestRematch();
  }

  function submitHandler(event) {
    if (!event.target.matches('[data-gp-form]')) return;
    event.preventDefault();
    void submitResponse(event.target);
  }

  async function init() {
    try {
      const offset = await get(ref(db, '.info/serverTimeOffset'));
      serverOffset = Number(offset.val()) || 0;
    } catch { serverOffset = 0; }
    if (role === 'host') await ensureInitialRound();
    unsubscribe = onValue(baseRef, snapshot => {
      data = snapshot.val() || {};
      const meta = currentMeta();
      if (meta?.roundKey && privateLoadedKey !== meta.roundKey && revealLoadKey !== meta.roundKey) { privateRound = {}; }
      render();
      if (meta?.phase === 'reveal' || meta?.phase === 'round-result') void loadPrivateRound(meta);
      if (meta?.phase === 'result-game') void loadFinalPrivate(meta);
      if (role === 'host' && meta?.phase === 'playing') void revealRound();
      if (role === 'host' && meta?.phase === 'reveal') void showRoundResult();
      if (role === 'host' && meta?.phase === 'round-result') void advanceAfterResult();
      if (role === 'host' && meta?.phase === 'result-game') void beginRematch();
    }, error => notifyOnce('subscription-error', `Koneksi permainan terputus: ${error.message}`, 'error'));
    timer = window.setInterval(() => {
      updateTimer();
      const meta = currentMeta();
      if (role === 'host' && meta?.phase === 'reveal') void showRoundResult();
      if (role === 'host' && meta?.phase === 'round-result') void advanceAfterResult();
      if (meta?.phase === 'reveal' && revealLoadKey !== meta.roundKey) void loadPrivateRound(meta);
      if (meta?.phase === 'result-game' && resultLoadKey !== meta.matchKey) void loadFinalPrivate(meta);
    }, 800);
  }

  renderShell();
  void init().catch(error => {
    const errorPanel = root.querySelector('[data-gp-panel="error"]');
    root.querySelectorAll('[data-gp-panel]').forEach(panel => { panel.hidden = panel !== errorPanel; });
    errorPanel.querySelector('[data-gp-error]').textContent = error.message || 'Terjadi kesalahan saat menyiapkan permainan.';
  });

  return {
    destroy() {
      destroyed = true;
      if (unsubscribe) unsubscribe();
      if (timer) clearInterval(timer);
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('submit', submitHandler);
    }
  };
}
