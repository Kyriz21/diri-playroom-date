import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RELAY_MAX_PHOTO_BYTES,
  RELAY_MAX_DATA_URL_CHARS,
  dataUrlToBlob,
  validateRelayPayload,
  buildRelayPhotoPayload
} from '../js/photobooth/relay-transfer.js';

test('foto relay mengubah JPEG data URL menjadi Blob', () => {
  const encoded = Buffer.from('fake-jpeg-bytes').toString('base64');
  const blob = dataUrlToBlob(`data:image/jpeg;base64,${encoded}`);
  assert.equal(blob.type, 'image/jpeg');
  assert.equal(blob.size, Buffer.from('fake-jpeg-bytes').length);
});

test('foto relay menolak URL non-JPEG dan data rusak', () => {
  assert.throws(() => dataUrlToBlob('data:image/png;base64,AAAA'), /tidak valid/);
  assert.throws(() => dataUrlToBlob('https://example.invalid/photo.jpg'), /tidak valid/);
});

test('payload relay wajib cocok dengan peran, nomor slot, ukuran dan checksum', () => {
  const blob = new Blob([Buffer.from('fake-jpeg')], { type: 'image/jpeg' });
  const dataUrl = `data:image/jpeg;base64,${Buffer.from('fake-jpeg').toString('base64')}`;
  const payload = buildRelayPhotoPayload({
    dataUrl, blob, sha256: 'a'.repeat(64), name: 'foto-1.jpg', index: 0, role: 'host'
  });
  assert.equal(validateRelayPayload(payload, 'host', 0), true);
  assert.equal(validateRelayPayload(payload, 'guest', 0), false);
  assert.equal(validateRelayPayload(payload, 'host', 1), false);
  assert.equal(validateRelayPayload({ ...payload, sha256: 'bad' }, 'host', 0), false);
});

test('payload relay menolak foto melebihi batas ukuran Spark-friendly', () => {
  const largeBlob = new Blob([new Uint8Array(RELAY_MAX_PHOTO_BYTES + 1)], { type: 'image/jpeg' });
  assert.throws(() => buildRelayPhotoPayload({
    dataUrl: 'data:image/jpeg;base64,AAAA', blob: largeBlob,
    sha256: 'a'.repeat(64), name: 'besar.jpg', index: 0, role: 'host'
  }), /melewati batas ukuran/);
  assert.equal(RELAY_MAX_DATA_URL_CHARS, 360000);
});
