import test from 'node:test';
import assert from 'node:assert/strict';
import { FRAMES, frameById, clampPosition, drawFrameBackground, drawPhotoSlotBorder, drawFrameOverlay } from '../js/photobooth/frame-art.js';

function mockContext() {
  const gradient = { addColorStop() {} };
  const methods = ['save','restore','fillRect','strokeRect','beginPath','arc','ellipse','fill','stroke','moveTo','lineTo','closePath','translate','rotate','scale','bezierCurveTo','quadraticCurveTo','fillText','strokeText','setLineDash','roundRect','rect','clip','drawImage'];
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
    assert.doesNotThrow(() => drawFrameOverlay(ctx, frame, 1400, 2600, true), `${frame[0]} overlay`);
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
  assert.match(source, /offsetX, offsetY/);
  assert.match(source, /stage\.clientWidth/);
  assert.match(source, /stage\.clientHeight/);
  assert.match(source, /Math\.abs\(x-gesture\.startX\)/);
  assert.match(source, /element\.kind === 'sticker' \? 0\.1 : 0\.07/);
  assert.match(source, /ctx\.strokeText\(text, x, y/);
  assert.doesNotMatch(source, /ctx\.fillStyle = 'rgba\(255,255,255,\.72\)'/);
  const css = await readFile(new URL('../css/review-build.css', import.meta.url), 'utf8');
  assert.match(css, /\.pb-deco,\.pb-shared-element\{[^}]*background:transparent!important/s);
  assert.match(source, /pb-themed-header/);
  assert.match(source, /pb-photo-card/);
});


test('hasil ekspor memakai ornamen tema yang sama dengan pratinjau', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /import \{[^}]*drawFrameOverlay[^}]*\} from '\.\/frame-art\.js'/);
  assert.match(source, /drawFrameOverlay\(ctx, selected, canvas\.width, canvas\.height, couple\)/);
});


test('editor tidak lagi merender toolbar panah atau A+/A− untuk manipulasi elemen', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /class="element-tools"/);
  assert.doesNotMatch(source, />A\+<|>A−</);
  assert.match(source, /cubit dengan dua jari/);
  assert.match(source, /onElementWheel/);
  assert.match(source, /pb-element-remove/);
  assert.match(source, /pb-element-resize/);
});

test('editor mendukung pinch-to-resize dan roda mouse pada hiasan', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /activeGesture\.mode = 'pinch'/);
  assert.match(source, /resizeHandle \? 'resize' : 'drag'/);
  assert.match(source, /gesture\.mode === 'resize'/);
  assert.match(source, /gesture\.startScale \* distance \/ gesture\.startDistance/);
  assert.match(source, /root\.addEventListener\('wheel',onElementWheel,\{passive:false\}\)/);
  assert.match(source, /function clampElementScale\(value\)/);
  assert.match(source, /target\.scale = clampElementScale\(pending\.scale\)/);
});
