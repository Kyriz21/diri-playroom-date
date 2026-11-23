/**
 * Temporary photo-transfer helpers for Diri. Playroom Date.
 * Firebase Realtime Database is a relay fallback only; photos are bounded,
 * verified with SHA-256 and removed after both browsers acknowledge receipt.
 */
export const RELAY_MAX_PHOTO_BYTES = 256 * 1024;
export const RELAY_MAX_DATA_URL_CHARS = 360_000;

export function dataUrlToBlob(dataUrl) {
  if (typeof dataUrl !== 'string' || !/^data:image\/jpeg;base64,/i.test(dataUrl)) {
    throw new Error('Data foto dari pasangan tidak valid.');
  }
  const comma = dataUrl.indexOf(',');
  const mime = /^data:([^;]+);base64,/i.exec(dataUrl)?.[1] || 'image/jpeg';
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

export function validateRelayPayload(payload, expectedRole, expectedIndex) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.role !== expectedRole || Number(payload.index) !== expectedIndex) return false;
  if (payload.mime !== 'image/jpeg') return false;
  if (typeof payload.dataUrl !== 'string' || payload.dataUrl.length > RELAY_MAX_DATA_URL_CHARS) return false;
  if (!/^data:image\/jpeg;base64,/i.test(payload.dataUrl)) return false;
  if (!Number.isInteger(payload.bytes) || payload.bytes < 1 || payload.bytes > RELAY_MAX_PHOTO_BYTES) return false;
  if (typeof payload.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(payload.sha256)) return false;
  return true;
}

export function buildRelayPhotoPayload({ dataUrl, blob, sha256, name, index, role }) {
  if (!(blob instanceof Blob) || blob.size < 1 || blob.size > RELAY_MAX_PHOTO_BYTES) {
    throw new Error(`Foto ${index + 1} melewati batas ukuran transfer.`);
  }
  if (blob.type !== 'image/jpeg' || typeof dataUrl !== 'string' || dataUrl.length > RELAY_MAX_DATA_URL_CHARS) {
    throw new Error(`Format foto ${index + 1} tidak sesuai untuk transfer.`);
  }
  if (!/^[a-f0-9]{64}$/i.test(String(sha256 || ''))) throw new Error(`Checksum foto ${index + 1} tidak valid.`);
  return { dataUrl, mime: 'image/jpeg', bytes: blob.size, sha256, name: name || `foto-${index + 1}.jpg`, index, role, uploadedAt: Date.now() };
}
