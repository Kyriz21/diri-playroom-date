import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/review-build.css', import.meta.url), 'utf8');
test('shared editor exposes filter presets and adjustment sliders', () => {
  assert.match(source, /renderFilterControls\(sharedFilter\(\),sharedAdjustments\(\),'couple'\)/);
  assert.match(source, /prefix==='couple'.*\['setup','editor'\]/s);
});
test('solo and shared decorations preserve rotation in preview and export', () => {
  assert.match(source, /rotate\(\$\{Number\(element\.rotate\|\|0\)\}deg\)/);
  assert.match(source, /ctx\.rotate\(\(Number\(element\.rotate \|\| 0\) \* Math\.PI\) \/ 180\)/);
});
test('delete control is separate from the sticker surface', () => {
  assert.match(source, /data-pb=\\?"delete-selected-element/);
  assert.doesNotMatch(source, /class=\\?"pb-element-remove\\?" data-pb=\\?"delete-element/);
  assert.match(css, /\.pb-deco \.pb-element-remove,\.pb-shared-element \.pb-element-remove\{display:none!important\}/);
});
test('camera stream is only reattached while capture screen is active', () => {
  assert.match(source, /if \(stream && pState\.phase === 'capture'\)/);
  assert.match(source, /cameraErrorNotifiedToken === token/);
});
