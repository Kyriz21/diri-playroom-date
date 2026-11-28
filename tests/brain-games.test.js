import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LOVE_QUESTIONS,
  loveProfile,
  calculateLoveMatch,
  colorAccuracy,
  colorHex,
  makeColor,
  makeDistinctColor,
  createRandomSeed,
  selectLoveQuestions,
  IQ_QUESTIONS,
  selectIQQuestions,
  seededShuffle,
  scoreIqAnswers
} from '../js/games/brain-game-logic.js';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Love Match memiliki 80 pertanyaan seimbang dan memilih bank acak 32 soal per sesi', () => {
  assert.equal(LOVE_QUESTIONS.length, 80);
  for (const axis of ['I/E', 'S/N', 'T/F', 'J/P']) {
    assert.equal(LOVE_QUESTIONS.filter(question => question.axis === axis).length, 20, `${axis} harus memiliki 20 pertanyaan`);
  }
  for (const question of LOVE_QUESTIONS) {
    assert.ok(question.prompt && question.a && question.b);
    assert.notEqual(question.a, question.b);
  }
  const first = selectLoveQuestions(1001, 8);
  const second = selectLoveQuestions(2002, 8);
  assert.equal(first.length, 32);
  assert.equal(new Set(first.map(q => q.id)).size, 32);
  for (const axis of ['I/E', 'S/N', 'T/F', 'J/P']) assert.equal(first.filter(q => q.axis === axis).length, 8);
  assert.notDeepEqual(first.map(q => q.id), second.map(q => q.id));
});

test('Love Match memetakan A ke I/S/T/J dan B ke E/N/F/P pada bank soal terpilih', () => {
  const questions = selectLoveQuestions(20261128, 8);
  const introverted = loveProfile(Array(questions.length).fill('A'), questions);
  assert.equal(introverted.code, 'ISTJ');
  const extroverted = loveProfile(Array(questions.length).fill('B'), questions);
  assert.equal(extroverted.code, 'ENFP');
  assert.ok(introverted.description && introverted.strengths && introverted.communication && introverted.relationship && introverted.growth);
});

test('Love Match menghitung kecocokan sempurna dan nol secara konsisten pada 32 soal', () => {
  const questions = selectLoveQuestions(20261128, 8);
  const same = Array(questions.length).fill('A');
  const perfect = calculateLoveMatch(same, [...same], questions);
  assert.equal(perfect.score, 100);
  assert.equal(perfect.matched, questions.length);
  assert.ok(Object.values(perfect.axes).every(value => value === 100));

  const opposite = calculateLoveMatch(same, Array(questions.length).fill('B'), questions);
  assert.equal(opposite.score, 0);
  assert.equal(opposite.matched, 0);
  assert.ok(Object.values(opposite.axes).every(value => value === 0));
});

test('Love Match menerima bentuk objek Firebase dengan indeks jawaban numerik', () => {
  const questions = selectLoveQuestions(77, 8);
  const answers = Object.fromEntries(Array.from({ length: questions.length }, (_, index) => [index, 'A']));
  assert.equal(loveProfile(answers, questions).code, 'ISTJ');
  assert.equal(calculateLoveMatch(answers, answers, questions).score, 100);
});

test('Color Match menghasilkan warna dalam batas aman dan mengubahnya ke hex', () => {
  const color = makeColor(() => 0.5);
  for (const channel of ['r', 'g', 'b']) {
    assert.ok(color[channel] >= 35 && color[channel] <= 220);
  }
  assert.match(colorHex({ r: 255, g: 0, b: 16 }), /^#[0-9a-f]{6}$/);
  assert.equal(colorHex({ r: 255, g: 0, b: 16 }), '#ff0010');
  const previous = [{ r: 100, g: 100, b: 100 }];
  const distinct = makeDistinctColor(previous, () => 0.9);
  assert.ok(['r','g','b'].some(key => Math.abs(distinct[key] - previous[0][key]) >= 24));
});

test('Color Match memberi akurasi 100 untuk warna yang sama dan menurunkan skor sesuai selisih', () => {
  assert.deepEqual(colorAccuracy({ r: 10, g: 20, b: 30 }, { r: 10, g: 20, b: 30 }), { error: 0, score: 100 });
  const imperfect = colorAccuracy({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  assert.equal(imperfect.score, 0);
  assert.equal(imperfect.error, 255);
});


test('Color Match mendeklarasikan mutex transisi agar timer preview dapat masuk ke fase menebak', () => {
  const game = read('../js/games/color-match.js');
  assert.match(game, /let transitioning = false;/);
  assert.doesNotMatch(game, /let advancing = false;/);
  const previewTransition = game.slice(game.indexOf('async function updatePreviewToGuessing'), game.indexOf('function updatePreviewTimer'));
  assert.match(previewTransition, /role !== 'host' \|\| transitioning \|\| pub\.meta\?\.phase !== 'preview'/);
  assert.match(previewTransition, /phase: 'guessing'/);
  assert.match(previewTransition, /if \(result\.committed && result\.snapshot\?\.exists\(\)\)/);
  assert.match(previewTransition, /pub = \{ \.\.\.pub, meta: result\.snapshot\.val\(\) \}/);
  const scoringTransition = game.slice(game.indexOf('async function scoreRemoteIfReady'), game.indexOf('async function buildRemoteRoundResult'));
  assert.match(scoringTransition, /transitioning = true/);
  assert.match(scoringTransition, /finally \{ transitioning = false; \}/);
  assert.match(game, /draftGuess = \{ r: 128, g: 128, b: 128 \};/);
});

test('IQ Duel memiliki bank soal yang cukup dan semua jawaban berada dalam pilihan', () => {
  assert.equal(IQ_QUESTIONS.length, 100);
  assert.ok(new Set(IQ_QUESTIONS.map(question => question.id)).size === IQ_QUESTIONS.length);
  for (const question of IQ_QUESTIONS) {
    assert.equal(question.options.length, 4, `${question.id} harus memiliki empat opsi`);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, `${question.id} punya indeks jawaban valid`);
    assert.ok(question.prompt && question.explanation);
  }
  assert.equal(IQ_QUESTIONS.filter(question => question.visualGrid?.length === 9).length, 5, 'lima soal memakai matriks 3×3');
});

test('IQ Duel seeded shuffle konsisten, tidak menghilangkan soal, dan dapat dipakai memilih 12 atau 20 ronde', () => {
  const first = seededShuffle(IQ_QUESTIONS, 20261127);
  const again = seededShuffle(IQ_QUESTIONS, 20261127);
  assert.deepEqual(first, again);
  assert.equal(new Set(first.map(question => question.id)).size, IQ_QUESTIONS.length);
  assert.equal(first.slice(0, 12).length, 12);
  assert.equal(first.slice(0, 20).length, 20);
  for (const count of [12, 20]) {
    const selected = selectIQQuestions(20261128, count);
    assert.equal(selected.length, count);
    const byFamily = selected.reduce((map, q) => { const key = q.category.split(' · ')[0]; map[key] = (map[key] || 0) + 1; return map; }, {});
    assert.ok(Object.keys(byFamily).length === 5);
    assert.ok(Math.max(...Object.values(byFamily)) - Math.min(...Object.values(byFamily)) <= 1);
  }
  assert.notDeepEqual(selectIQQuestions(11, 20).map(q => q.id), selectIQQuestions(22, 20).map(q => q.id));
});

test('IQ Duel menghitung jawaban benar, salah, dan kosong tanpa membocorkan sebelum hasil', () => {
  const questionSet = IQ_QUESTIONS.slice(0, 4);
  const result = scoreIqAnswers(questionSet, { 0: questionSet[0].answer, 1: -1, 2: questionSet[2].answer });
  assert.equal(result.total, 4);
  assert.equal(result.correct, 2);
  assert.equal(result.percentage, 50);
  assert.equal(result.details[0].isCorrect, true);
  assert.equal(result.details[1].isCorrect, false);
  assert.equal(result.details[3].selected, null);
});

test('Tiga mini game terdaftar dan memiliki mode room serta solo di landing', () => {
  const constants = read('../js/constants.js');
  const app = read('../js/app.js');
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  for (const id of ['lovematch', 'colormatch', 'iqduel']) assert.match(constants, new RegExp(`id: '${id}'.*state: 'active'`));
  for (const action of ['open-love-create', 'open-love-join', 'open-love-solo', 'open-color-create', 'open-color-join', 'open-color-solo', 'open-iq-create', 'open-iq-join', 'open-iq-solo']) assert.ok(app.includes(`data-action="${action}"`), action);
  const selection = rules.rooms.$roomCode.lobby.selections.$role['.validate'];
  const active = rules.rooms.$roomCode.lobby.activeSession['.validate'];
  const readyWrite = rules.rooms.$roomCode.lobby.ready.$role['.write'];
  const activeWrite = rules.rooms.$roomCode.lobby.activeSession['.write'];
  assert.match(readyWrite, /presence.*host.*connected/);
  assert.match(readyWrite, /presence.*guest.*connected/);
  assert.match(activeWrite, /presence.*host.*connected/);
  assert.match(activeWrite, /presence.*guest.*connected/);
  for (const id of ['lovematch', 'colormatch', 'iqduel']) {
    assert.match(selection, new RegExp(id));
    assert.match(active, new RegExp(id));
  }
});

test('Firebase Rules membatasi pembacaan jawaban privat ke sesi aktif dan fase hasil yang sesuai', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  const expression = rules.privateRooms.$roomCode.$gameId.$sessionId.$uid['.read'];
  assert.match(expression, /lovematch/);
  assert.match(expression, /colormatch/);
  assert.match(expression, /iqduel/);
  assert.match(expression, /phase/);
  assert.match(expression, /scoring/);
  const privateRounds = rules.privateRooms.$roomCode.$gameId.$sessionId.$uid.rounds.$roundKey;
  assert.match(privateRounds['.validate'], /\$gameId !== 'guesspartner'/);
  assert.match(privateRounds.target['.validate'], /colormatch/);
  assert.match(privateRounds.guess['.validate'], /colormatch/);
  assert.match(expression, /activeSession.*gameId/);
  assert.match(expression, /activeSession.*sessionId/);
  const privateWrite = rules.privateRooms.$roomCode.$gameId.$sessionId.$uid['.write'];
  assert.match(privateWrite, /activeSession.*gameId/);
  assert.match(privateWrite, /activeSession.*sessionId/);
  for (const source of ['love-match.js', 'color-match.js', 'iq-duel.js']) {
    const game = read(`../js/games/${source}`);
    assert.match(game, /privateRooms/);
    assert.match(game, /onValue/);
  }
});


test('Love Match melompat langsung ke satu kartu rekap setelah kedua pemain menyelesaikan jawaban', () => {
  const game = read('../js/games/love-match.js');
  assert.match(game, /phase: 'result', finishedAt/);
  assert.match(game, /REKAPAN LOVE MATCH/);
  assert.doesNotMatch(game, /function revealView\(/);
  assert.doesNotMatch(game, /function nextReveal\(/);
  assert.doesNotMatch(game, /next-reveal/);
});

test('Color Match mengumpulkan lima hasil ronde dan menampilkannya sebagai satu rekap kartu', () => {
  const game = read('../js/games/color-match.js');
  assert.match(game, /roundResults/);
  assert.match(game, /phase: 'scoring'/);
  assert.match(game, /phase: 'finished'/);
  assert.match(game, /function recapRoundCard/);
  assert.match(game, /cm-recap-grid/);
  assert.match(game, /function startRemoteGame/);
  assert.match(game, /makeDistinctColor/);
  assert.match(game, /Menyiapkan warna acak/);
  assert.match(game, /const average = r => standalone \? Number\(totals\[r\] \|\| 0\) : Math\.round\(Number\(totals\[r\] \|\| 0\) \/ Math\.max\(1, results\.length\)\)/);
  assert.doesNotMatch(game, /function revealPanel\(/);
  assert.doesNotMatch(game, /function localReveal\(/);
  assert.doesNotMatch(game, /data-cm-action="continue"/);
});

test('IQ Duel memakai satu panel hasil akhir dengan skor dan kartu pembahasan, bukan layar hasil per ronde', () => {
  const game = read('../js/games/iq-duel.js');
  assert.match(game, /function resultPanel/);
  assert.match(game, /iq-score-grid/);
  assert.match(game, /iq-review-list/);
  assert.match(game, /Ringkasan per kategori/);
  assert.match(game, /Jawaban benar/);
  assert.match(game, /hostAnswer/);
  assert.match(game, /selectIQQuestions/);
  assert.doesNotMatch(game, /data-iq-action="next-result"/);
});
