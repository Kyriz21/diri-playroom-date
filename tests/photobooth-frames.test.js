import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAMES, frameById, clampPosition, drawFrameBackground, drawPhotoSlotBorder } from '../js/photobooth/frame-art.js';

function mockContext() {
  const gradient = { addColorStop() {} };
  const methods = ['save','restore','fillRect','strokeRect','beginPath','arc','fill','stroke','moveTo','lineTo','closePath','translate','scale','bezierCurveTo','fillText','setLineDash','roundRect','rect','clip','drawImage'];
  const ctx = { createLinearGradient: () => gradient, measureText: value => ({ width: String(value).length * 20 }) };
  for (const name of methods) ctx[name] = () => {};
  return ctx;
}

test('katalog Photobooth memuat 16 desain tematik dengan ID unik', () => {
  assert.equal(FRAMES.length, 16);
  const ids = FRAMES.map(frame => frame[0]);
  assert.equal(new Set(ids).size, ids.length);
  for (const frame of FRAMES) {
    assert.ok(frame[0] && frame[1] && frame[2] && frame[3] && frame[4] && frame[5]);
    assert.equal(frameById(frame[0])[0], frame[0]);
  }
});

test('frameById memiliki bingkai cadangan untuk ID yang tidak dikenal', () => {
  assert.equal(frameById('tidak-ada')[0], FRAMES[0][0]);
});

test('posisi hiasan dibatasi dalam rentang aman ternormalisasi', () => {
  assert.equal(clampPosition(-10), 0.04);
  assert.equal(clampPosition(10), 0.96);
  assert.equal(clampPosition(0.5), 0.5);
  assert.equal(clampPosition('bukan-angka'), 0.5);
});

test('semua desain dapat menggambar latar dan bingkai foto tanpa melempar galat', () => {
  for (const frame of FRAMES) {
    const ctx = mockContext();
    assert.doesNotThrow(() => drawFrameBackground(ctx, frame, 1400, 2600, true), frame[0]);
    assert.doesNotThrow(() => drawPhotoSlotBorder(ctx, frame, 80, 220, 600, 520, 0), `${frame[0]} border`);
  }
});

test('setiap bingkai mempunyai pratinjau mini dan gaya hasil yang berbeda', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../css/review-build.css', import.meta.url), 'utf8');
  for (const frame of FRAMES) {
    assert.ok(css.includes(`.pb-frame-mini.${frame[0]}`), `missing catalogue style: ${frame[0]}`);
    assert.ok(css.includes(`.pb-strip.${frame[0]}`), `missing solo frame style: ${frame[0]}`);
    assert.ok(css.includes(`.pb-couple-strip.${frame[0]}`), `missing couple frame style: ${frame[0]}`);
  }
});

test('Photobooth memasang penanganan Pointer Event untuk mouse dan layar sentuh', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\('pointerdown',\s*onPointerDown\)/);
  assert.match(source, /addEventListener\('pointermove',\s*onPointerMove\)/);
  assert.match(source, /addEventListener\('pointerup',\s*onPointerUp\)/);
  assert.match(source, /data-drag-element="solo"/);
  assert.match(source, /data-drag-element="couple"/);
  assert.match(source, /startX, startY, offsetX, offsetY/);
  assert.match(source, /stage\.clientWidth/);
  assert.match(source, /stage\.clientHeight/);
  assert.match(source, /Math\.abs\(x - activeDrag\.startX\)/);
  assert.match(source, /canvas\.width \* 0\.062/);
  assert.match(source, /ctx\.roundRect\(x - boxWidth\/2/);
});
