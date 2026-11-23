import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/photobooth/photobooth.js', import.meta.url), 'utf8');
const rules = JSON.parse(await readFile(new URL('../firebase-database.rules.json', import.meta.url), 'utf8'));

test('kegagalan WebRTC otomatis berpindah ke Firebase relay, bukan layar pilih delapan file', () => {
  assert.match(source, /state\.phase='relay'/);
  assert.match(source, /void startFirebaseRelay\(\)/);
  assert.match(source, /else if \(pState\.phase === 'relay' \|\| pState\.phase === 'manual'\).*renderRelayTransfer/s);
  assert.doesNotMatch(source, /state\.phase='manual';state\.p2p\.status='manual-fallback'/);
});

test('transfer Firebase mengirim empat foto, menerima empat foto dan menunggu dua tanda terima', () => {
  assert.match(source, /for\(let index=0;index<4;index\+\+\)/);
  assert.match(source, /waitForRelayPath\(`\$\{base\}\/photos\/\$\{partnerRole\}\/\$\{index\}`\)/);
  assert.match(source, /waitForBothRelayAcks\(`\$\{base\}\/acks`\)/);
  assert.match(source, /state\.phase='editor'/);
});

test('relay memverifikasi ukuran dan SHA-256 sebelum foto dipakai', () => {
  assert.match(source, /validateRelayPayload\(payload,partnerRole,index\)/);
  assert.match(source, /const hash=await hashBlob\(blob\);if\(hash!==payload\.sha256\)/);
  assert.match(source, /await putLocalMedia\('photobooth',localKey\(session\.sessionId,token,partnerRole,index\),blob\)/);
});

test('transfer langsung WebRTC meminta tanda terima per foto', () => {
  assert.match(source, /waitForFileAck\(index\)/);
  assert.match(source, /type:'file-ack'/);
  assert.match(source, /incomingMessageQueue|messageQueue/);
});

test('jalur Firebase relay dibatasi untuk sesi dan memakai validasi ukuran foto', () => {
  const sessionRules = rules.rules.roomGames.$roomCode.$sessionId;
  const signal = sessionRules.signal;
  const relay = sessionRules.photoRelay;
  assert.ok(signal['.read'].includes('auth != null'));
  assert.ok(signal['.write'].includes('auth != null'));
  assert.ok(relay['.read'].includes('auth != null'));
  assert.ok(relay.$transferKey.photos.$role.$index['.validate'].includes('360000'));
  assert.ok(relay.$transferKey.photos.$role.$index['.validate'].includes('262144'));
  assert.ok(relay.$transferKey.photos.$role.$index['.write'].includes("host"));
  assert.ok(relay.$transferKey.acks.$role['.validate'].includes("count"));
});

test('transfer memiliki ID unik per percobaan untuk mencegah foto lama tercampur', () => {
  assert.match(source, /transferId:randomId\(\)/);
  assert.match(source, /photoRelay\/\$\{token\}_\$\{transferId\}/);
});

test('client dapat mencoba ulang otomatis setelah koneksi internet pulih', () => {
  assert.match(source, /window\.addEventListener\('online', onlineHandler\)/);
  assert.match(source, /waitForFirebaseOnline\(\)/);
  assert.match(source, /data-pb="retry-relay"/);
});

test('relay memantau koneksi Firebase dan otomatis melanjutkan saat SDK tersambung kembali', () => {
  assert.match(source, /ref\(db, '\.info\/connected'\)/);
  assert.match(source, /firebaseConnectionUnsubscribe/);
  assert.match(source, /pState\?.p2p\?.status === 'relay-error'/);
});

test('transfer langsung mencocokkan checksum ACK dengan hash foto pengirim', () => {
  assert.match(source, /receipt\.sha256!==expectedHash/);
  assert.match(source, /p2pTransferError=error/);
});

test('kesalahan permission Firebase memberi instruksi memperbarui Rules', () => {
  assert.match(source, /Firebase menolak transfer foto/);
  assert.match(source, /firebase-database\.rules\.json/);
});


test('relay photo path has role-scoped writes and permits whole-node deletion only after both ACKs', () => {
  const relay = rules.rules.roomGames.$roomCode.$sessionId.photoRelay;
  const transfer = relay.$transferKey;
  assert.ok(transfer['.write'].includes('!newData.exists()'));
  assert.ok(transfer['.write'].includes("child('acks').child('host').child('count').val() === 4"));
  assert.ok(transfer.photos.$role.$index['.write'].includes("child('guest').child('uid').val() === auth.uid"));
});
