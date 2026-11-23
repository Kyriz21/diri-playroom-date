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

test('katalog Photobooth memuat 18 desain tematik dengan ID unik', () => {
  assert.equal(FRAMES.length, 18);
  const ids = FRAMES.map(frame => frame[0]);
  assert.equal(new Set(ids).size, ids.length);
  for (const frame of FRAMES) {
    assert.ok(frame[0] && frame[1] && frame[2] && frame[3] && frame[4] && frame[5]);
    assert.equal(frameById(frame[0])[0], frame[0]);
  }
});

test('katalog menyertakan Dunia Mainan dan Polaroid Sosial sebagai konsep desain baru', async () => {
  assert.equal(frameById('toybox')[0], 'toybox');
  assert.equal(frameById('social')[0], 'social');
  const css = await import('node:fs/promises').then(({readFile}) => readFile(new URL('../css/review-build.css', import.meta.url), 'utf8'));
  for (const id of ['toybox','social']) {
    assert.ok(css.includes(`.pb-frame-mini.${id}`));
    assert.ok(css.includes(`.pb-strip.${id}`));
    assert.ok(css.includes(`.pb-couple-strip.${id}`));
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


test('tema Polaroid Sosial mengekspor kartu foto miring seperti pratinjau', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /selected\[4\] === 'social'/);
  assert.match(source, /ctx\.rotate\(\(index % 2 \? 1\.8 : -1\.7\)/);
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


test('kamera mencoba ulang elemen video terbaru saat play terinterupsi oleh pembaruan DOM', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /cameraRequestToken/);
  assert.match(source, /cameraAttachPromise/);
  assert.match(source, /error\?\.name === 'AbortError'/);
  assert.match(source, /new load request/);
  assert.match(source, /root\.querySelector\('#pb-video'\) !== video/);
  assert.match(source, /attachCameraToCurrentVideo\(requestToken\)/);
  assert.doesNotMatch(source, /const video = root\.querySelector\('#pb-video'\);\s*if \(!video\) return;\s*video\.srcObject = stream;\s*await video\.play\(\);/);
});

test('bingkai foto tidak boleh mengecat bidang foto setelah gambar ditempatkan', () => {
  // Photo-slot borders are painted after the photo. Opaque fills here used to
  // cover the photo completely in Toybox, Social, Newspaper, Wanted, Film, etc.
  const frameArt = requireFrameArtForTest();
  for (const frame of FRAMES) {
    let opaqueRectCount = 0;
    const ctx = mockContext();
    ctx.fillRect = () => { opaqueRectCount++; };
    frameArt.drawPhotoSlotBorder(ctx, frame, 80, 220, 600, 520, 0);
    assert.equal(opaqueRectCount, 0, `${frame[0]} border must not paint over the photo`);
  }
});

function requireFrameArtForTest() {
  return { drawPhotoSlotBorder };
}

test('mode pribadi mengikuti urutan pilih bingkai, ambil foto, lalu editor', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.ok(source.indexOf("if (soloPhase === 'frame')") < source.indexOf("if (soloPhase === 'capture')"));
  assert.match(source, /data-pb="solo-start-capture"/);
  assert.match(source, /data-pb="solo-continue"/);
  assert.match(source, /Hiasan emoji tanpa latar/);
  assert.match(source, /data-pb="solo-png"/);
});

test('mode berdua menyediakan bingkai sebelum pengambilan foto dan editor emoji setelahnya', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.ok(source.indexOf('function renderCoupleSetup()') < source.indexOf('function renderCapture()'));
  assert.match(source, /function renderSharedEditor\(\)/);
  assert.match(source, /renderStickerPicker\('add-sticker'\)/);
  assert.match(source, /data-pb="couple-png"/);
});

test('ekspor harus memuat sumber foto pribadi dan pasangan sebelum menggambar ke kanvas', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /async function loadPhotoForExport\(photo, label\)/);
  assert.match(source, /typeof photo === 'string' \? photo/);
  assert.match(source, /photo\?\.url \|\| photo\?\.dataUrl \|\| photo\?\.src/);
  assert.match(source, /photo instanceof Blob/);
  assert.match(source, /photo\?\.blob instanceof Blob/);
  assert.match(source, /image\.naturalWidth > 0 && image\.naturalHeight > 0/);
  assert.match(source, /loadPhotoForExport\(source, `Foto \$\{index \+ 1\}`\)/);
  assert.match(source, /loadPhotoForExport\(photo, `Foto \$\{row \+ 1\}/);
});

test('ekspor menolak file frame kosong jika jumlah foto yang benar-benar digambar tidak lengkap', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  assert.match(source, /let drawnPhotoCount = 0/);
  assert.match(source, /drawnPhotoCount \+= 1/g);
  assert.match(source, /const expectedPhotoCount = couple \? 8 : 4/);
  assert.match(source, /drawnPhotoCount !== expectedPhotoCount/);
  assert.match(source, /Jangan unduh frame kosong/);
});

test('mode berdua menggunakan kamera untuk pengambilan foto standar, bukan unggah empat foto', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
  const captureStart = source.indexOf('function renderCapture()');
  const captureEnd = source.indexOf('function renderManualTransfer()', captureStart);
  const captureMarkup = source.slice(captureStart, captureEnd);
  assert.match(captureMarkup, /data-pb="camera"/);
  assert.match(captureMarkup, /data-pb="capture-couple"/);
  assert.doesNotMatch(captureMarkup, /pb-couple-files|Pilih empat foto/);
});

test('canvas regression test memeriksa foto sintetis sebelum dan sesudah bingkai', async () => {
  const { readFile } = await import('node:fs/promises');
  const fixture = await readFile(new URL('../canvas-regression.html', import.meta.url), 'utf8');
  assert.match(fixture, /photo\.getContext\('2d'\)/);
  assert.match(fixture, /x\.drawImage\(photo/);
  assert.match(fixture, /drawPhotoSlotBorder\(x,frame/);
  assert.match(fixture, /getImageData\(slot\.x\+slot\.w\*\.25/);
  assert.match(fixture, /getImageData\(slot\.x\+slot\.w\*\.75/);
  assert.match(fixture, /document\.body\.dataset\.done/);
});
