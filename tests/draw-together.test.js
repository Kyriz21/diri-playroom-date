import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAW_PROMPTS,
  chooseDrawPrompt,
  normalizePoint,
  sanitizeStroke,
  getRemainingSeconds,
  formatDrawTime,
  sortStrokesByTime,
  canStartRematch,
  canFinishRematch,
  createNextDrawRound,
  normalizeBrushWidth,
  chooseDifferentDrawPrompt
} from '../js/games/draw-together-logic.js';

test('prompt bank contains varied prompts and seeded selection is stable', () => {
  assert.ok(DRAW_PROMPTS.length >= 25);
  assert.equal(chooseDrawPrompt(() => 0), DRAW_PROMPTS[0]);
  assert.equal(chooseDrawPrompt(() => 0.999999), DRAW_PROMPTS.at(-1));
});

test('drawing coordinates are normalized and clamped', () => {
  assert.deepEqual(normalizePoint({ x: 0.25, y: 0.75 }), { x: 0.25, y: 0.75 });
  assert.deepEqual(normalizePoint({ x: -3, y: 2 }), { x: 0, y: 1 });
  assert.equal(normalizePoint({ x: 'bad', y: 0.5 }), null);
});

test('stroke input is sanitized and bounded', () => {
  const clean = sanitizeStroke({ color: '#aabbcc', width: 99, tool: 'eraser', points: [{ x: 0.2, y: 0.3 }, { x: 3, y: -1 }] });
  assert.equal(clean.color, '#aabbcc');
  assert.equal(clean.width, 24);
  assert.equal(clean.tool, 'eraser');
  assert.deepEqual(clean.points, [{ x: 0.2, y: 0.3 }, { x: 1, y: 0 }]);
  assert.equal(sanitizeStroke({ points: [] }), null);
});

test('shared timer calculates remaining time without going negative', () => {
  assert.equal(getRemainingSeconds(1000, 120, 1000), 120);
  assert.equal(getRemainingSeconds(1000, 120, 61500), 60);
  assert.equal(getRemainingSeconds(1000, 120, 999999), 0);
  assert.equal(formatDrawTime(125), '2:05');
  assert.equal(formatDrawTime(-1), '0:00');
});

test('strokes are sorted chronologically and retain player ownership', () => {
  const sorted = sortStrokesByTime({
    uidA: { later: { color: '#000000', width: 4, points: [{ x: 0, y: 0 }], createdAt: 20 }, first: { color: '#ff0000', width: 4, points: [{ x: 1, y: 1 }], createdAt: 10 } },
    uidB: { other: { color: '#00ff00', width: 6, points: [{ x: 0.5, y: 0.5 }], createdAt: 15 } }
  });
  assert.deepEqual(sorted.map(stroke => `${stroke.uid}:${stroke.id}`), ['uidA:first', 'uidB:other', 'uidA:later']);
});


test('rematch requires both players to vote for the current round only', () => {
  const meta = { phase: 'result', createdAt: 12345 };
  assert.equal(canStartRematch(meta, { host: 12345, guest: 12345 }), true);
  assert.equal(canStartRematch(meta, { host: 12345 }), false);
  assert.equal(canStartRematch(meta, { host: 12345, guest: 12344 }), false);
  assert.equal(canStartRematch({ ...meta, phase: 'playing' }, { host: 12345, guest: 12345 }), false);
});

test('next rematch round gets a fresh prompt, timer, and round timestamp', () => {
  const next = createNextDrawRound({ phase: 'result', createdAt: 1000 }, 'Kucing lucu', 2000);
  assert.deepEqual(next, { prompt: 'Kucing lucu', durationSeconds: 120, createdAt: 2000, startedAt: 0, phase: 'ready' });
  assert.ok(createNextDrawRound({ createdAt: 2000 }, 'Bunga', 1500).createdAt > 2000);
});

test('brush slider is clamped to supported widths 1 through 24', () => {
  assert.equal(normalizeBrushWidth(1), 1);
  assert.equal(normalizeBrushWidth(16.6), 17);
  assert.equal(normalizeBrushWidth(99), 24);
  assert.equal(normalizeBrushWidth(-3), 1);
  assert.equal(normalizeBrushWidth('bad'), 6);
});


test('rematch prompt picker avoids repeating the previous prompt', () => {
  const previous = DRAW_PROMPTS[0];
  assert.notEqual(chooseDifferentDrawPrompt(previous, () => 0), previous);
});


test('rematch cleanup requires both players to confirm their own canvas is cleared', () => {
  const meta = { phase: 'rematching', createdAt: 4321 };
  assert.equal(canFinishRematch(meta, { host: 4321, guest: 4321 }), true);
  assert.equal(canFinishRematch(meta, { host: 4321 }), false);
  assert.equal(canFinishRematch({ ...meta, phase: 'result' }, { host: 4321, guest: 4321 }), false);
});
