import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeElementRotation, signedAngleDelta } from '../js/photobooth/gesture-utils.js';

test('rotation normalizes negative and overflow angles into 0–359 degrees', () => {
  assert.equal(normalizeElementRotation(-1), 359);
  assert.equal(normalizeElementRotation(361), 1);
  assert.equal(normalizeElementRotation(720), 0);
  assert.equal(normalizeElementRotation('not-a-number'), 0);
});

test('two-finger rotation uses the shortest direction across 0/360 degrees', () => {
  assert.equal(signedAngleDelta(1, 359), 2);
  assert.equal(signedAngleDelta(359, 1), -2);
  assert.equal(signedAngleDelta(180, 0), -180);
});
