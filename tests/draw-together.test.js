import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAW_PROMPTS,
  chooseDrawPrompt,
  normalizePoint,
  sanitizeStroke,
  getRemainingSeconds,
  formatDrawTime,
  sortStrokesByTime
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
