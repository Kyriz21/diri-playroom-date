import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GUESS_PARTNER_PROMPTS, TOTAL_ROUNDS, ROUND_DURATION_SECONDS,
  answererRoleForRound, oppositeRole, choosePrompt, cleanPlayerText,
  scoreForRating, evaluateAnswerMatch, normalizeAnswerTokens, normalizeAnswerPhrase, ratingLabel, calculateGuessScores, getRemainingSeconds, formatTime,
  isBothLocked, nextRoundMeta, nextMatchMeta
} from '../js/games/guess-partner-logic.js';

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

 test('bank contains varied and unique Indonesian prompts', () => {
  assert.ok(GUESS_PARTNER_PROMPTS.length >= 30);
  assert.equal(new Set(GUESS_PARTNER_PROMPTS.map(item => item.prompt)).size, GUESS_PARTNER_PROMPTS.length);
  assert.ok(GUESS_PARTNER_PROMPTS.every(item => item.category && item.prompt.length > 10));
});

test('answerer role alternates for all six rounds', () => {
  assert.deepEqual(Array.from({ length: TOTAL_ROUNDS }, (_, i) => answererRoleForRound(i + 1)), ['host','guest','host','guest','host','guest']);
  assert.equal(oppositeRole('host'), 'guest');
  assert.equal(oppositeRole('guest'), 'host');
});

test('prompt selection avoids repeating the previous prompt when possible', () => {
  const first = GUESS_PARTNER_PROMPTS[0];
  const next = choosePrompt(first.prompt, () => 0);
  assert.notEqual(next.prompt, first.prompt);
});

test('player text is trimmed, whitespace-normalized and length-limited', () => {
  assert.equal(cleanPlayerText('  hai   kamu\n apa kabar  '), 'hai kamu apa kabar');
  assert.equal(cleanPlayerText('x'.repeat(200)).length, 140);
  assert.equal(cleanPlayerText('  \n  '), '');
});

test('automatic matching awards full points only for the exact normalized phrase', () => {
  const exact = evaluateAnswerMatch('mie ayam', 'MIE AYAM!');
  assert.equal(exact.rating, 'correct');
  assert.equal(exact.score, 2);
  assert.equal(exact.exactMatch, true);
  assert.equal(evaluateAnswerMatch('mie ayam', 'mie   ayam').rating, 'correct');
  assert.equal(evaluateAnswerMatch('Nasi Goreng!', 'nasi, goreng.').rating, 'correct');
  assert.equal(normalizeAnswerPhrase(' Mie   Ayam! '), 'mie ayam');
  assert.equal(evaluateAnswerMatch('pelukan', 'berpelukan').rating, 'correct');
  assert.equal(evaluateAnswerMatch('pelukan', 'berpelukan').score, 2);
  assert.equal(evaluateAnswerMatch('shopping', 'belanja').rating, 'correct');
  assert.equal(evaluateAnswerMatch('aku suka shopping', 'aku suka berbelanja').rating, 'correct');
  assert.deepEqual(normalizeAnswerTokens('berpelukan'), ['peluk']);
  assert.equal(normalizeAnswerPhrase('shopping'), 'belanja');
});

test('extra, missing, or reordered words are never rated as an exact answer', () => {
  for (const guess of ['mie ayam goreng', 'mie ayam rebus', 'mie ayam bakar', 'ayam mie', 'aku mau mie ayam']) {
    const result = evaluateAnswerMatch('mie ayam', guess);
    assert.equal(result.rating, 'close', `${guess} should be close, not exact`);
    assert.equal(result.score, 1);
    assert.equal(result.exactMatch, false);
  }
  assert.equal(evaluateAnswerMatch('mie ayam', 'mie').rating, 'close');
  assert.equal(evaluateAnswerMatch('mie ayam', 'ayam').rating, 'close');
  assert.equal(evaluateAnswerMatch('mie ayam', 'bakso').rating, 'miss');
  assert.equal(evaluateAnswerMatch('mie ayam', 'bakso').score, 0);
});

test('partial keyword overlap ignores capitalization and punctuation but not extra words for exactness', () => {
  assert.equal(evaluateAnswerMatch('Aku suka mie ayam', 'aku suka mie').rating, 'close');
  const longer = evaluateAnswerMatch('mie ayam', 'mie ayam goreng');
  assert.deepEqual(longer.matchedWords, ['mie', 'ayam']);
  assert.equal(longer.matchedCount, 2);
  assert.equal(longer.totalKeywords, 2);
  assert.equal(longer.exactMatch, false);
  assert.deepEqual(normalizeAnswerTokens('Aku sangat suka mie ayam'), ['mie', 'ayam']);
  assert.equal(ratingLabel('correct'), 'Tepat');
  assert.equal(ratingLabel('close'), 'Hampir');
  assert.equal(ratingLabel('miss'), 'Meleset');
});

test('empty or punctuation-only answers never award points', () => {
  assert.equal(evaluateAnswerMatch('', 'mie ayam').score, 0);
  assert.equal(evaluateAnswerMatch('!!!', '???').score, 0);
  assert.equal(evaluateAnswerMatch('es teh manis', '').rating, 'miss');
});

test('rating points and score totals are assigned to the guesser', () => {
  assert.equal(scoreForRating('correct'), 2);
  assert.equal(scoreForRating('close'), 1);
  assert.equal(scoreForRating('miss'), 0);
  assert.deepEqual(calculateGuessScores([
    { answererRole: 'host', rating: 'correct' },
    { answererRole: 'guest', rating: 'close' },
    { answererRole: 'host', rating: 'miss' }
  ]), { host: 1, guest: 2 });
});

test('timer formatting is deterministic and never negative', () => {
  assert.equal(getRemainingSeconds(1000, 60, 1000), 60);
  assert.equal(getRemainingSeconds(1000, 60, 62000), 0);
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(-3), '0:00');
});

test('both lock condition requires answerer and guesser for the active round key', () => {
  const meta = { roundKey: 'round-a', answererRole: 'host' };
  assert.equal(isBothLocked(meta, { 'round-a': { host: { locked: true } } }, { 'round-a': { guest: { locked: true } } }), true);
  assert.equal(isBothLocked(meta, { 'round-a': { host: { locked: true } } }, { 'round-b': { guest: { locked: true } } }), false);
});

test('next round flips answerer and preserves match identity', () => {
  const current = { matchNo: 1, matchKey: 'match-a', roundNo: 1, roundKey: 'round-a', prompt: 'Kucing' };
  const next = nextRoundMeta(current, { category: 'Favorit', prompt: 'Makanan favorit?' }, 5000, () => 'round-b');
  assert.equal(next.roundNo, 2);
  assert.equal(next.answererRole, 'guest');
  assert.equal(next.matchNo, 1);
  assert.equal(next.matchKey, 'match-a');
  assert.equal(next.roundKey, 'round-b');
  assert.equal(next.durationSeconds, ROUND_DURATION_SECONDS);
});

test('rematch starts a new match and resets the round roles', () => {
  const next = nextMatchMeta({ matchNo: 3, matchKey: 'old' }, { category: 'Romantis', prompt: 'Apa yang kusukai?' }, 9000, (() => { let n = 0; return () => `key-${++n}`; })());
  assert.equal(next.matchNo, 4);
  assert.equal(next.matchKey, 'key-1');
  assert.equal(next.roundNo, 1);
  assert.equal(next.roundKey, 'key-2');
  assert.equal(next.answererRole, 'host');
});

test('game is registered, exposed on the landing page and routed to its module', () => {
  const constants = read('../js/constants.js');
  const app = read('../js/app.js');
  assert.match(constants, /id: 'guesspartner'.*Tebak Pasangan/);
  assert.match(app, /data-action="open-guess-create"/);
  assert.match(app, /data-action="open-guess-join"/);
  assert.match(app, /guess-partner\.js\?v=0\.23\.0/);
});

test('guess partner answers are written to privateRooms, not public game data', () => {
  const game = read('../js/games/guess-partner.js');
  assert.match(game, /privateRooms\/\$\{code\}\/guesspartner/);
  assert.match(game, /answerStatus/);
  assert.match(game, /guessStatus/);
  assert.match(game, /data\.ratings/);
  assert.match(game, /submitAutomaticRating/);
  assert.match(game, /evaluateAnswerMatch/);
  assert.doesNotMatch(game, /data-gp-rate=/);
  assert.doesNotMatch(game, /Nilai tebakan pasanganmu/);
  assert.doesNotMatch(game, /set\(ref\(db, `\$\{basePath\}\/answers/);
});

test('answerer automatically stores keyword scoring after private responses load, without manual score controls', () => {
  const game = read('../js/games/guess-partner.js');
  assert.match(game, /privateLoadedKey = cacheKey/);
  assert.match(game, /role === meta\.answererRole && !data\.ratings/);
  assert.match(game, /submitAutomaticRating\(meta, evaluateAnswerMatch\(answer, guess\)\)/);
  assert.match(game, /matchedWords: evaluation\.matchedWords/);
  assert.doesNotMatch(game, /data-gp-rate=/);
});

test('Firebase rules register guesspartner and keep private answers hidden until reveal', () => {
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  assert.match(rules.rooms.$roomCode.lobby.selections.$role['.validate'], /guesspartner/);
  assert.match(rules.rooms.$roomCode.lobby.activeSession['.validate'], /guesspartner/);
  const privateRead = rules.privateRooms.$roomCode.$gameId.$sessionId.$uid['.read'];
  assert.match(privateRead, /guesspartner/);
  assert.match(privateRead, /activeSession/);
  assert.match(privateRead, /'reveal'/);
  assert.match(privateRead, /'result-game'/);
  const gp = rules.roomGames.$roomCode.$sessionId.guessPartner;
  assert.ok(gp.meta && gp.rounds && gp.answerStatus && gp.guessStatus && gp.ratings && gp.continueStatus && gp.rematchRequests);
  assert.match(gp.answerStatus.$roundKey.$role['.write'], /auth\.uid/);
  assert.match(gp.guessStatus.$roundKey.$role['.write'], /auth\.uid/);
  assert.match(gp.ratings.$roundKey['.write'], /answererRole/);
  assert.match(gp.ratings.$roundKey['.write'], /!data\.exists\(\)/);
  assert.match(gp.continueStatus.$roundKey.$role['.write'], /activeSession/);
  assert.match(gp.rematchRequests.$matchKey.$role['.write'], /activeSession/);
});

test('initial round history includes the matchKey required by Firebase Rules and final scoring', () => {
  const game = read('../js/games/guess-partner.js');
  const rules = JSON.parse(read('../firebase-database.rules.json')).rules;
  assert.match(game, /matchNo: meta\.matchNo, matchKey: meta\.matchKey, roundNo: meta\.roundNo, roundKey: meta\.roundKey/);
  assert.match(rules.roomGames.$roomCode.$sessionId.guessPartner.rounds.$roundKey['.validate'], /matchKey/);
});
