import { putLocalMedia, getLocalMedia, deleteLocalMedia, setLocalValue, getLocalValue, cleanupExpiredMedia } from '../services/local-store.js';
import { nextPhotoSlot, hasCompletePhotoSet } from '../games/logic.js';
import { FRAMES, frameById, clampPosition, drawFrameBackground, drawPhotoSlotBorder, drawFrameOverlay } from './frame-art.js';
import { RELAY_MAX_PHOTO_BYTES, dataUrlToBlob, validateRelayPayload, buildRelayPhotoPayload } from './relay-transfer.js';
import { normalizeElementRotation, signedAngleDelta } from './gesture-utils.js';

// Firebase is loaded only for a shared session. Standalone Photobooth stays local and
// can be used even before a Firebase project is configured.
let db, ref, get, set, update, remove, onValue, runTransaction, serverTimestamp;

const FILTERS = ['Asli','Merah Muda','Film Hangat','Vintage','Hitam Putih','Lavender','Cerah','Nuansa Dingin'];
const STICKERS = ['♡','✿','☾','☆','🌷','🦋','🎀','✨','💌','🌼','🧸','🐻','☁️','⭐','💗','🍒'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const randomId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const roomPublic = (code, sessionId) => ref(db, `roomGames/${code}/${sessionId}/public`);
const signalPath = (code, sessionId, attempt) => `roomGames/${code}/${sessionId}/signal/${attempt}`;
const localKey = (sessionId, token, role, index) => `${sessionId}:${token}:${role}:${index}`;

function readDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('File foto tidak dapat dibaca.'));
    reader.readAsDataURL(blob);
  });
}
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gambar tidak dapat diproses pada perangkat ini.'));
    image.src = source;
  });
}
function photoPreviewSource(photo) {
  if (typeof photo === 'string') return photo;
  if (photo && typeof photo === 'object') {
    if (typeof photo.dataUrl === 'string') return photo.dataUrl;
    if (typeof photo.url === 'string') return photo.url;
    if (typeof photo.src === 'string') return photo.src;
    if (typeof photo.data === 'string') return photo.data;
  }
  return '';
}
async function loadPhotoForExport(photo, label) {
  let source = typeof photo === 'string' ? photo : (photo?.url || photo?.dataUrl || photo?.src || '');
  let temporaryUrl = '';
  if (!source && photo instanceof Blob) {
    temporaryUrl = URL.createObjectURL(photo);
    source = temporaryUrl;
  } else if (!source && photo?.blob instanceof Blob) {
    temporaryUrl = URL.createObjectURL(photo.blob);
    source = temporaryUrl;
  }
  if (typeof source !== 'string' || !source) {
    throw new Error(`${label} tidak memiliki sumber gambar yang dapat diekspor. Ambil ulang foto tersebut.`);
  }
  try {
    const image = await loadImage(source);
    if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) {
      throw new Error(`${label} berhasil dipilih tetapi tidak memiliki ukuran gambar yang valid.`);
    }
    return image;
  } finally {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
  }
}
async function hashBlob(blob) {
  const bytes = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function imageFilter(filter, values) {
  const preset = {
    'Asli':'', 'Merah Muda':'sepia(.08) saturate(1.12) hue-rotate(315deg)',
    'Film Hangat':'sepia(.22) saturate(1.13)', 'Vintage':'sepia(.35) contrast(.92)',
    'Hitam Putih':'grayscale(1)', 'Lavender':'hue-rotate(12deg) saturate(.88)',
    'Cerah':'brightness(1.12)', 'Nuansa Dingin':'hue-rotate(12deg) saturate(.9)'
  }[filter] ?? '';
  const temp = values.temperature > 0 ? ` sepia(${values.temperature / 300})` : values.temperature < 0 ? ` hue-rotate(${values.temperature / 5}deg)` : '';
  return `${preset} brightness(${values.brightness / 100}) contrast(${values.contrast / 100}) saturate(${values.saturation / 100})${temp}`;
}

export function mountPhotobooth(root, context) {
  const { code, session, room, role, player, onBack, toast = () => {} } = context;
  const standalone = context.standalone === true;
  const myUid = player?.uid ?? '';
  const partnerRole = role === 'host' ? 'guest' : 'host';
  let publicRef = null;

  let mode = 'choose';
  let pState = null;
  let unsubscribers = [];
  let stream = null;
  let cameraRequestToken = 0;
  let cameraAttachPromise = null;
  let cameraErrorNotifiedToken = -1;
  let rtc = null;
  let channel = null;
  let destroyed = false;
  let p2pAttemptSeen = 0;
  let p2pStarted = false;
  let p2pTimer = null;
  let candidateUnsubscribe = null;
  let lastSeenRetakeToken = null;
  let sendStarted = false;
  let p2pTransferError = null;
  let localSent = false;
  let remoteDone = false;
  let localPhotos = [];
  let remotePhotos = [];
  let manualPhotos = [];
  let editorData = null;
  let editorLoadKey = '';
  let selectedElementId = null;
  let selectedSoloElementId = null;
  let activeGesture = null;
  let wheelSaveTimer = null;
  let pendingWheelScale = null;
  let soloPhotos = [];
  let soloPhase = 'frame'; // Choose a frame first, then capture four photos, then edit.
  let soloElements = [];
  let soloFrame = 'korean';
  let soloFilter = 'Asli';
  let soloAdjust = { brightness:100, contrast:100, saturation:100, temperature:0 };
  let lastTouch = 0;
  let restoringCapture = false;
  let manualCompletionRunning = false;
  let appliedSlotRetakeKey = '';
  let relayStarted = false;
  let relayUploadCount = 0;
  let relayDownloadCount = 0;
  let relayStatusText = 'Menyiapkan pengiriman foto…';
  let relayErrorText = '';
  let restoreCapturePromise = null;
  let onlineHandler = null;
  let firebaseConnectionUnsubscribe = null;
  const fileAckWaiters = new Map();

  function showToast(message, type = 'default') { toast(message, type); }
  function stopCamera() {
    cameraRequestToken += 1;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    const video = root.querySelector('#pb-video');
    if (video) {
      try { video.pause(); } catch {}
      video.srcObject = null;
    }
  }
  function disposePeer() {
    if (p2pTimer) clearTimeout(p2pTimer);
    p2pTimer = null;
    if (candidateUnsubscribe) { try { candidateUnsubscribe(); } catch {} }
    candidateUnsubscribe = null;
    if (rtc) { try { rtc.close(); } catch {} }
    for (const waiter of fileAckWaiters.values()) { try { waiter.resolve({aborted:true}); } catch {} }
    fileAckWaiters.clear();
    rtc = null;
    channel = null;
  }
  function cleanup() {
    destroyed = true;
    stopCamera();
    disposePeer();
    unsubscribers.forEach(unsub => { try { unsub(); } catch {} });
    root.removeEventListener('click', onClick);
    root.removeEventListener('change', onChange);
    root.removeEventListener('submit', onSubmit);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerup', onPointerUp);
    root.removeEventListener('pointercancel', onPointerUp);
    root.removeEventListener('wheel', onElementWheel);
    if (onlineHandler) window.removeEventListener('online', onlineHandler);
    if (firebaseConnectionUnsubscribe) { try { firebaseConnectionUnsubscribe(); } catch {} firebaseConnectionUnsubscribe = null; }
    if (wheelSaveTimer) clearTimeout(wheelSaveTimer);
  }

  async function touchRoom() {
    if (Date.now() - lastTouch < 45000) return;
    lastTouch = Date.now();
    try { await set(ref(db, `rooms/${code}/lastMeaningfulActivityAt`), serverTimestamp()); } catch {}
  }
  async function mutate(mutator) {
    const result = await runTransaction(publicRef, current => {
      if (!current) return;
      const next = structuredClone(current);
      if (mutator(next) === false) return;
      next.updatedAt = Date.now();
      return next;
    }, { applyLocally:false });
    void touchRoom();
    return result;
  }
  async function ensureSessionState() {
    if (role !== 'host') return;
    const snapshot = await get(publicRef);
    if (!snapshot.exists()) {
      await set(publicRef, {
        gameId:'photobooth', sessionId:session.sessionId, phase:'setup',
        frameId:'korean', filter:{preset:'Asli',brightness:100,contrast:100,saturation:100,temperature:0},
        ready:{host:false,guest:false}, photosDone:{host:false,guest:false},
        p2p:{attempt:0,status:'idle'}, manualHashes:{}, elements:[], approvals:{host:false,guest:false},
        retakeRequests:{host:false,guest:false}, retakeToken:0, photoRevision:0, updatedAt:Date.now()
      });
      return;
    }
    // Upgrade earlier review builds from two separate frame choices to one shared frame.
    await runTransaction(publicRef, current => {
      if (!current) return;
      const next = structuredClone(current);
      if (!next.frameId) next.frameId = next.frameByUid?.host || next.frameByUid?.guest || 'korean';
      if (!FRAMES.some(frame => frame[0] === next.frameId)) next.frameId = 'korean';
      delete next.frameByUid;
      next.photoRevision = Number(next.photoRevision || 0);
      next.filter = {preset:'Asli',brightness:100,contrast:100,saturation:100,temperature:0,...(next.filter||{})};
      if(next.filter.preset==='Asli')next.filter.preset='Asli';
      next.slotRetake = next.slotRetake || null;
      next.retakeSlot = next.retakeSlot || null;
      return next;
    }, {applyLocally:false});
  }
  async function init() {
    try {
      // Private Galeri and Solo photos are local. Do not initialize Firebase for this route.
      await cleanupExpiredMedia('photobooth', 24 * 60 * 60 * 1000).catch(error => console.debug('Temporary photo cleanup skipped:', error));
      if (standalone) {
        mode = 'solo';
        renderSolo();
        return;
      }
      const firebase = await import('../firebase.js');
      ({ db, ref, get, set, update, remove, onValue, runTransaction, serverTimestamp } = firebase);
      publicRef = roomPublic(code, session.sessionId);
      mode = context.mode === 'couple' ? 'couple' : 'choose';
      onlineHandler = () => {
        if (mode === 'couple' && pState?.phase === 'relay' && pState?.p2p?.status === 'relay-error' && !relayStarted) {
          relayErrorText = '';
          void mutate(state => { if (state.phase === 'relay') state.p2p = {...(state.p2p || {}), status:'relay', method:'firebase', updatedAt:Date.now()}; });
        }
      };
      window.addEventListener('online', onlineHandler);
      // Firebase can reconnect even when the browser does not emit another
      // window 'online' event. Watch the SDK connection state as a second wake-up.
      firebaseConnectionUnsubscribe = onValue(ref(db, '.info/connected'), snapshot => {
        if (snapshot.val() === true && mode === 'couple' && pState?.phase === 'relay' && pState?.p2p?.status === 'relay-error' && !relayStarted && !destroyed) {
          relayErrorText = '';
          void mutate(state => {
            if (state.phase === 'relay' && state.p2p?.status === 'relay-error') {
              state.p2p = { ...(state.p2p || {}), status:'relay', method:'firebase', updatedAt:Date.now() };
            }
          }).then(() => { if (!relayStarted && !destroyed) void startFirebaseRelay(); }).catch(error => console.warn('Automatic relay resume:', error));
        }
      }, error => console.warn('Firebase connection monitor:', error));
      await ensureSessionState();
      unsubscribers.push(onValue(publicRef, snapshot => {
        pState = snapshot.val();
        if (!pState || destroyed) return;
        const currentRetakeToken = Number(pState.retakeToken || 0);
        if (lastSeenRetakeToken === null) lastSeenRetakeToken = currentRetakeToken;
        else if (currentRetakeToken !== lastSeenRetakeToken) {
          lastSeenRetakeToken = currentRetakeToken;
          localPhotos = []; remotePhotos = []; manualPhotos = []; editorData = null; editorLoadKey = '';
          p2pStarted = false; p2pAttemptSeen = 0; localSent = false; remoteDone = false; sendStarted = false;
          disposePeer();
        }
        if (mode === 'couple') {
          if (pState.phase === 'capture' && pState.retakeSlot) void applyPendingSlotRetake();
          else if (pState.phase === 'capture') void restoreCaptureMedia();
          if (pState.phase === 'manual') {
            // Migrate a legacy manual-fallback session from either participant.
            // The transaction ensures only the first client creates the new relay ID.
            if (pState.photosDone?.host && pState.photosDone?.guest) {
              void mutate(state => {
                if (state.phase === 'manual') {
                  state.phase='relay';
                  state.p2p={...(state.p2p||{}),status:'relay',method:'firebase',transferId:state.p2p?.transferId||randomId()};
                }
              });
            }
            void restoreCaptureMedia();
          }
          if (pState.phase === 'relay' && pState.p2p?.status === 'relay' && !relayStarted) {
            void restoreCaptureMedia();
            void startFirebaseRelay();
          }
          if (pState.phase === 'editor' || pState.phase === 'finalized') void ensureEditorData();
          if (pState.phase === 'aborted' && pState.p2p?.method === 'firebase') void cleanupRelayRole().catch(error => console.warn('Relay cleanup after abort:',error));
          renderCouple();
          if (role === 'guest' && pState.phase === 'capture' && pState.p2p?.status === 'connecting' && pState.p2p.attempt > p2pAttemptSeen) {
            p2pAttemptSeen = pState.p2p.attempt;
            void connectPeer('guest', p2pAttemptSeen);
          }
          if (role === 'host' && pState.phase === 'capture' && pState.photosDone?.host && pState.photosDone?.guest && ['idle','connecting'].includes(pState.p2p?.status || 'idle') && !p2pStarted) {
            p2pStarted = true;
            void (async () => {
              if (pState.p2p?.status === 'connecting') {
                await mutate(state => { if (state.phase === 'capture') state.p2p = {attempt:0,status:'idle'}; });
              }
              await beginP2P();
            })();
          }
        }
      }, error => showToast(`Kesalahan sinkronisasi Fotobooth: ${error.message}`, 'error')));
      if (mode === 'couple') renderCouple();
      else renderChoose();
    } catch (error) {
      root.innerHTML = `<section class="panel game-panel"><h1>Fotobooth belum siap</h1><p>${esc(error.message)}</p><button class="button button-quiet" data-pb="back">Kembali ke lobi</button></section>`;
    }
  }

  function gameTop(title, subtitle, eyebrow = 'DIRI. PLAYROOM DATE') {
    const backLabel = standalone ? 'Kembali ke halaman utama' : 'Tutup sesi';
    return `<div class="game-topbar"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div><button class="button button-quiet" data-pb="back">${backLabel}</button></div>`;
  }
  function renderChoose() {
    mode = 'choose';
    root.innerHTML = `<div class="photo-app">${gameTop('Photobooth ♡','Abadikan momen bersama meski berjauhan.')}<section class="panel photo-mode-panel"><h2>Pilih mode Fotobooth</h2><p>Ambil foto sendiri atau buat satu strip foto bersama pasangan.</p><div class="photo-mode-grid"><button class="photo-mode-card" data-pb="solo"><span>♡</span><strong>Fotobooth Sendiri</strong><small>Empat foto, 16 desain bingkai tematik, filter, dan galeri pribadi di perangkat ini.</small></button><button class="photo-mode-card" data-pb="couple"><span>✿</span><strong>Fotobooth Berdua</strong><small>Empat foto per orang, pengaturan bersama, pratinjau gabungan, dan persetujuan akhir.</small></button></div><p class="small-note">Foto pribadi tetap tersimpan di perangkat. Untuk sesi berdua, transfer langsung dicoba terlebih dahulu dan Firebase menjadi jalur cadangan otomatis jika koneksi langsung gagal. Foto sementara dihapus setelah kedua perangkat mengonfirmasi penerimaan.</p></section></div>`;
  }
  function frameCatalog(active, attribute = 'solo-frame') {
    const miniCopy = {
      newspaper:['KABAR KITA','EDISI KHUSUS','BERITA UTAMA'], wanted:['DICARI','HADIAH BESAR','MENCURI HATI'],
      comic:['POW!','KISAH KITA','DUA TOKOH'], cinema:['OUR MOVIE','STARRING US','TAKE 01'], korean:['FOUR CUTS','오늘도 우리','♡ together'],
      film:['ANALOG 1990','36 EXP · ISO 400','MEMORY FILM'], polaroid:['little moments','photo diary','♡'], postcard:['SALAM DARI KITA','POST CARD','WISH YOU HERE'],
      botanical:['BLOOMING','GROW TOGETHER','little garden'], kawaii:['CUTE LITTLE US','kawaii day','ʕ•ᴥ•ʔ'], magazine:['TOGETHER','THE COUPLE ISSUE','COVER STORY'],
      y2k:['★ US 4EVER ★','DIGITAL LOVE','2000s ENERGY'], arcade:['PLAYER 1 + 2','LOVE LEVEL','MAX SCORE'], loveletter:['UNTUKMU,','a little letter','dengan sayang'],
      birthday:['HARI SPESIAL','MAKE A WISH','PARTY TIME'], doodle:['OUR DOODLES','HAPPY SCRIBBLES','tiny memories'],
      toybox:['PETUALANGAN','PLAY · SMILE','DUNIA MAINAN'], social:['YOUR MOMENTS','LIKE · SAVE','LITTLE MEMORIES']
    };
    return `<div class="pb-frame-catalog">${FRAMES.map(([id, name]) => {
      const [top, sub, foot] = miniCopy[id] || ['Diri.', 'Momen kita', '♡'];
      return `<button type="button" class="pb-frame-card ${active===id?'active':''}" data-pb="${attribute}" data-frame="${id}" aria-pressed="${active===id}"><span class="pb-frame-mini ${id}"><span class="pb-mini-masthead">${esc(top)}</span><span class="pb-mini-sub">${esc(sub)}</span><span class="pb-mini-photos"><i>01</i><i>02</i><i>03</i><i>04</i></span><span class="pb-mini-footer">${esc(foot)}</span><span class="pb-mini-mark" aria-hidden="true">${id==='wanted'?'★':id==='newspaper'?'✦':id==='comic'?'!':id==='cinema'?'▶':id==='kawaii'?'♡':id==='film'?'▣':id==='postcard'?'✉':id==='botanical'?'❀':id==='arcade'?'✧':id==='birthday'?'✷':id==='toybox'?'🚀':id==='social'?'♡':'✦'}</span></span><strong>${name}</strong>${active===id?'<small>Terpilih</small>':'<small>Lihat contoh</small>'}</button>`;
    }).join('')}</div>`;
  }

  const frameCopy = {
    newspaper: {kicker:'THE DAILY D I R I',title:'THE LOVE TIMES',sub:'EDISI SPESIAL · KISAH DUA HATI · VOL. 01',foot:'EXTRA! EXTRA! KABAR BAIK: KITA BERTEMU DI SINI',mark:'✦'},
    wanted: {kicker:'WANTED · REWARD POSTER',title:'DICARI',sub:'HILANG KARENA MENCURI HATI',foot:'HADIAH: SATU PELUKAN TANPA BATAS',mark:'★'},
    comic: {kicker:'ISSUE #01 · CERITA KITA',title:'BOOM! OUR STORY',sub:'DUA TOKOH · SATU CERITA · BANYAK TAWA',foot:'TO BE CONTINUED… ♡',mark:'💥'},
    cinema: {kicker:'A DIRI. ORIGINAL',title:'OUR MOVIE NIGHT',sub:'STARRING: YOU & ME · TAKE 01',foot:'THE BEST SCENE IS WITH YOU',mark:'▶'},
    korean: {kicker:'오늘도, 우리 둘',title:'FOUR CUTS',sub:'ONE DAY · FOUR LITTLE MOMENTS',foot:'오늘도 함께라서 좋아 ♡',mark:'♡'},
    film: {kicker:'36 EXP · ISO 400',title:'ANALOG MOMENTS',sub:'NO FILTER NEEDED · JUST US',foot:'DIRI. FILM LAB · DEVELOPED WITH LOVE',mark:'▣'},
    polaroid: {kicker:'PHOTO DIARY · NO. 01',title:'little moments',sub:'THE ONES WE WANT TO KEEP',foot:'yang ingin diulang lagi ♡',mark:'✧'},
    postcard: {kicker:'POST CARD · FROM US',title:'SALAM DARI KITA',sub:'WISH YOU WERE HERE · ALWAYS',foot:'DI MANA PUN, TETAP DEKAT',mark:'✉'},
    botanical: {kicker:'A LITTLE GARDEN',title:'BLOOMING TOGETHER',sub:'GROW SLOW · LOVE DEEP',foot:'TUMBUH BERSAMA, PELAN-PELAN',mark:'❀'},
    kawaii: {kicker:'CUTIE ALERT · 100%',title:'CUTE LITTLE US',sub:'YOU + ME = HAPPY',foot:'PELUK JAUH, DEKAT DI HATI ♡',mark:'ʕ•ᴥ•ʔ'},
    magazine: {kicker:'SPECIAL COUPLE ISSUE',title:'TOGETHER',sub:'THE COVER STORY · NO. 01',foot:'COVER STARS: YOU & ME',mark:'✦'},
    y2k: {kicker:'DIGITAL LOVE · 2000s',title:'★ US 4EVER ★',sub:'PIXEL HEARTS · REAL FEELINGS',foot:'LOVE LEVEL: 1000%',mark:'✧'},
    arcade: {kicker:'PLAYER 1 + PLAYER 2',title:'LOVE LEVEL: MAX',sub:'INSERT COIN · START THE MEMORY',foot:'HIGH SCORE: US TWO',mark:'▣'},
    loveletter: {kicker:'UNTUK ORANG FAVORITKU',title:'A LITTLE LOVE NOTE',sub:'SOME MOMENTS FEEL LIKE HOME',foot:'DENGAN SAYANG, AKU ♡',mark:'💌'},
    birthday: {kicker:'TODAY IS A LITTLE MAGIC',title:'HARI SPESIAL KITA!',sub:'MAKE A WISH · MAKE A MEMORY',foot:'MORE LAUGHTER, MORE US!',mark:'✷'},
    doodle: {kicker:'HAPPY SCRIBBLES · VOL. 01',title:'OUR HAPPY DOODLES',sub:'TINY CHAOS · BIG MEMORIES',foot:'CORETAN KECIL, KENANGAN BESAR',mark:'✿'},
    toybox: {kicker:'PLAYROOM ADVENTURE · NO. 01',title:'DUNIA MAINAN',sub:'EMPAT FOTO · SERIBU CERITA',foot:'PETUALANGAN KECIL, KENANGAN BESAR',mark:'🚀'},
    social: {kicker:'PHOTO DIARY · YOUR EDITION',title:'YOUR MOMENTS',sub:'LIKE IT · SAVE IT · LOVE IT',foot:'A LITTLE MOMENT WORTH KEEPING',mark:'♡'}
  };

  function renderFrameHeader(frame) {
    const id = frame[0], copy = frameCopy[id] || frameCopy.korean;
    return `<header class="pb-strip-header pb-themed-header ${id}"><span class="pb-theme-kicker">${copy.kicker}</span><strong class="pb-theme-title">${copy.title}</strong><span class="pb-theme-subtitle">${copy.sub}</span><span class="pb-theme-mark" aria-hidden="true">${copy.mark}</span></header>`;
  }
  function renderFrameFooter(frame) {
    const copy = frameCopy[frame[0]] || frameCopy.korean;
    return `<footer class="pb-strip-footer pb-themed-footer ${frame[0]}"><span>${copy.foot}</span><b>Diri. ♡</b></footer>`;
  }
  function renderStickerPicker(action) {
    return `<div class="pb-sticker-picker" aria-label="Pilih hiasan transparan">${STICKERS.map(sticker=>`<button type="button" data-pb="${action}" data-sticker="${esc(sticker)}" aria-label="Tambah hiasan ${esc(sticker)}">${esc(sticker)}</button>`).join('')}</div>`;
  }
  function photoCaption(frame, index, roleLabel = '') {
    const number = String(index + 1).padStart(2, '0');
    const id = frame[0];
    const captions = {
      newspaper:`FOTO UTAMA · ${number}`, wanted:`TERSANGKA #${number}`, comic:['POW!','WOW!','LOVE!','YAY!'][index % 4],
      kawaii:['CUTIE 01','HAPPY FACE','SWEET MOMENT','BESTIES'][index % 4], film:`FRAME ${number} · 36 EXP`,
      magazine:`COVER SHOT ${number}`, postcard:`POSTMARK ${number}`, doodle:`DOODLE SHOT ${number}`,
      toybox:['PLAY TIME','BIG SMILE','FUN DAY','BEST ADVENTURE'][index % 4], social:`MEMORY ${number}`
    };
    return `${roleLabel ? `${roleLabel} · ` : ''}${captions[id] || `SHOT ${number}`}`;
  }
  function renderFilterControls(filter, values, prefix = 'solo') {
    return `<div class="filter-chip-grid">${FILTERS.map(item => `<button type="button" class="filter-chip ${filter===item?'active':''}" data-pb="${prefix}-filter" data-filter="${item}">${item}</button>`).join('')}</div><div class="adjust-grid"><label>Kecerahan <input type="range" min="60" max="140" value="${values.brightness}" data-adjust="${prefix}-brightness"></label><label>Kontras <input type="range" min="60" max="140" value="${values.contrast}" data-adjust="${prefix}-contrast"></label><label>Warna <input type="range" min="0" max="180" value="${values.saturation}" data-adjust="${prefix}-saturation"></label><label>Temperatur <input type="range" min="-60" max="60" value="${values.temperature}" data-adjust="${prefix}-temperature"></label></div>`;
  }

  // ----------------------------- Fotobooth Sendiri -----------------------------
  function renderSoloPreview() {
    const selected = frameById(soloFrame);
    const cssFilter = imageFilter(soloFilter, soloAdjust);
    const elements = soloElements.map(element => `<button type="button" class="pb-deco ${element.kind==='sticker'?'sticker':''} ${selectedSoloElementId===element.id?'selected':''}" style="left:${clampPosition(element.x)*100}%;top:${clampPosition(element.y)*100}%;transform:translate(-50%,-50%) rotate(${Number(element.rotate||0)}deg) scale(${clampElementScale(element.scale)})" data-pb="select-solo-element" data-element-id="${esc(element.id)}" data-drag-element="solo" aria-label="Pilih dan geser ${esc(element.text)}">${esc(element.text)}</button>`).join('');
    const photoCards = [0,1,2,3].map(index => {
      const source = photoPreviewSource(soloPhotos[index]);
      return source
        ? `<figure class="pb-solo-photo pb-photo-card ${soloFrame}"><img src="${esc(source)}" style="filter:${cssFilter}" alt="Foto ${index+1}" loading="eager" decoding="sync"><figcaption>${photoCaption(selected,index)}</figcaption></figure>`
        : `<figure class="pb-solo-photo pb-photo-card empty ${soloFrame}"><span>Foto ${index+1} belum tersedia</span><figcaption>${photoCaption(selected,index)}</figcaption></figure>`;
    }).join('');
    return `${renderFrameHeader(selected)}<div class="pb-frame-ornaments ${soloFrame}" aria-hidden="true"><span class="ornament-a">${selected[0]==='comic'?'POW!':selected[0]==='kawaii'?'♡':selected[0]==='wanted'?'★':'✦'}</span><span class="ornament-b">${selected[0]==='comic'?'WOW!':selected[0]==='kawaii'?'✿':selected[0]==='wanted'?'REWARD':'♡'}</span></div><div class="pb-solo-photos">${photoCards}</div>${renderFrameFooter(selected)}${elements}`;
  }
  async function renderGallery() {
    const holder = root.querySelector('#pb-gallery-list');
    if (!holder) return;
    try {
      const items = await getLocalValue('photobooth-gallery') || [];
      if (!root.querySelector('#pb-gallery-list')) return;
      holder.innerHTML = items.length ? `<div class="gallery-grid">${items.map((item,index)=>`<article class="gallery-item"><img src="${item.data}" alt="Strip foto pribadi ${index+1}"><small>${new Date(item.date).toLocaleString()}</small><button class="button button-small button-quiet" data-pb="gallery-delete" data-index="${index}">Hapus</button></article>`).join('')}</div>` : '<p class="small-note">Belum ada foto tersimpan di galeri perangkat ini.</p>';
    } catch (error) { holder.textContent = `Galeri lokal tidak dapat dibuka: ${error.message}`; }
  }
  async function attachCameraToCurrentVideo(requestToken = cameraRequestToken) {
    if (!stream || destroyed || requestToken !== cameraRequestToken) return;
    if (cameraAttachPromise) return cameraAttachPromise;
    cameraAttachPromise = (async () => {
      const startedAt = Date.now();
      let lastPlayError = null;
      while (Date.now() - startedAt < 6000 && stream && !destroyed && requestToken === cameraRequestToken) {
        const video = root.querySelector('#pb-video');
        if (!video) { await wait(80); continue; }
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        if (video.srcObject !== stream) video.srcObject = stream;
        try {
          if (video.paused || video.readyState < 2) await video.play();
        } catch (error) {
          // A Firebase snapshot can replace the capture markup while play() is pending.
          // AbortError/new-load interruptions are transient: retry against the current video node.
          lastPlayError = error;
          const interrupted = error?.name === 'AbortError' || /interrupted|new load request/i.test(error?.message || '');
          if (!interrupted) throw error;
          await wait(100);
          continue;
        }
        await wait(100);
        if (root.querySelector('#pb-video') !== video) continue;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          root.querySelector('#pb-camera-placeholder')?.classList.add('hidden');
          const soloCapture = root.querySelector('[data-pb="capture"]');
          if (soloCapture) soloCapture.disabled = nextPhotoSlot(soloPhotos) < 0;
          const coupleCapture = root.querySelector('[data-pb="capture-couple"]');
          if (coupleCapture) coupleCapture.disabled = !!pState?.photosDone?.[role] || nextPhotoSlot(localPhotos) < 0;
          return;
        }
      }
      if (stream && requestToken === cameraRequestToken) {
        if (lastPlayError && lastPlayError.name !== 'AbortError') throw lastPlayError;
        throw new Error('Kamera belum menampilkan gambar. Coba tekan Buka kamera sekali lagi atau periksa izin kamera browser.');
      }
    })().finally(() => { cameraAttachPromise = null; });
    return cameraAttachPromise;
  }
  function renderSolo() {
    mode = 'solo';
    if (soloPhase === 'frame') {
      root.innerHTML = `<div class="photo-app">${gameTop('Pilih bingkai fotomu','Pilih desain strip terlebih dahulu. Setelah itu buka kamera dan ambil empat foto.','SESI PRIBADI · LANGKAH 1 DARI 3')}<section class="panel photo-editor-card"><h2>Katalog bingkai</h2>${frameCatalog(soloFrame)}<div class="photo-controls"><button class="button button-primary" data-pb="solo-start-capture">${hasCompletePhotoSet(soloPhotos,4)?'Lanjut ke editor':'Lanjut ke pengambilan foto'}</button></div></section></div>`;
      return;
    }
    if (soloPhase === 'capture') {
      const count = soloPhotos.filter(Boolean).length;
      const selectedFrame = frameById(soloFrame);
      root.innerHTML = `<div class="photo-app">${gameTop('Ambil empat foto','Bingkai sudah dipilih. Ambil foto satu per satu, lalu periksa hasilnya sebelum masuk editor.','SESI PRIBADI · LANGKAH 2 DARI 3')}<div class="photo-layout"><section class="panel photo-camera-card"><p class="small-note">Bingkai pilihan: <strong>${esc(selectedFrame[1])}</strong> <button class="button button-small button-quiet" data-pb="solo-change-frame">Ganti bingkai</button></p><div class="camera-stage"><video id="pb-video" autoplay muted playsinline></video><div id="pb-camera-placeholder" class="camera-placeholder"><span>♡</span><b>Empat momen untuk strip fotomu</b><small>Buka kamera, lalu ambil foto satu per satu.</small><strong id="pb-countdown"></strong></div></div><div class="photo-controls"><button class="button button-secondary" data-pb="camera">Buka kamera</button><button class="button button-primary" data-pb="capture" ${stream && nextPhotoSlot(soloPhotos)>=0?'':'disabled'}>Ambil foto berikutnya</button></div><div class="photo-slot-grid">${[0,1,2,3].map(index=>`<div class="photo-slot">${soloPhotos[index]?`<img src="${soloPhotos[index]}" alt="Foto ${index+1}"><button type="button" class="pb-slot-retake" data-pb="solo-retake-slot" data-index="${index}">Ulangi</button>`:`<span>${index+1}</span>`}<small>${index+1}</small></div>`).join('')}</div><p class="small-note">${count}/4 foto sudah diambil. Kamu bisa mengulang foto mana pun sebelum lanjut.</p><div class="photo-controls"><button class="button button-primary" data-pb="solo-continue" ${hasCompletePhotoSet(soloPhotos,4)?'':'disabled'}>Lanjut ke editor</button><button class="button button-quiet" data-pb="solo-reset">Ulangi semua foto</button></div></section></div></div>`;
      if (stream && soloPhase === 'capture') void attachCameraToCurrentVideo().catch(error => handleCameraAttachError(error));
      return;
    }
    const complete = hasCompletePhotoSet(soloPhotos,4);
    root.innerHTML = `<div class="photo-app">${gameTop('Edit strip fotomu','Tambahkan emoji, teks, dan sesuaikan tampilan sebelum mengunduh.','SESI PRIBADI · LANGKAH 3 DARI 3')}<div class="photo-layout"><section class="panel photo-editor-card"><h2>Empat foto milikmu</h2><div class="pb-mini-strip">${[0,1,2,3].map(index=>{const source=photoPreviewSource(soloPhotos[index]);return `<figure class="pb-mini-photo">${source?`<img src="${esc(source)}" alt="Foto ${index+1}" loading="eager" decoding="sync">`:`<span class="pb-mini-missing">Foto ${index+1} belum tersedia</span>`}<figcaption>Foto ${index+1}</figcaption></figure>`;}).join('')}</div><div class="photo-controls"><button class="button button-quiet" data-pb="solo-retake-all">Kembali dan ulangi foto</button><button class="button button-quiet" data-pb="solo-change-frame">Ganti bingkai</button></div><h2>Tampilan foto</h2>${renderFilterControls(soloFilter,soloAdjust)}<div class="photo-controls"><h3>Hiasan emoji tanpa latar</h3>${renderStickerPicker('solo-sticker')}<form data-pb-form="solo-text"><input name="text" maxlength="50" placeholder="Tulis keterangan"><button class="button button-quiet" type="submit">Tambah teks</button></form></div><p class="small-note">Ketuk hiasan untuk memilih, lalu seret dengan satu jari untuk memindahkan. Gunakan dua jari untuk mencubit agar ukuran berubah atau putar kedua jari untuk memutar hiasan. Pengatur sudut tetap tersedia untuk penyesuaian presisi. Tombol hapus berada di panel bawah, tidak menempel pada hiasan.</p><div class="photo-controls"><button class="button button-primary" data-pb="solo-png" ${complete?'':'disabled'}>Unduh PNG</button><button class="button button-secondary" data-pb="solo-jpeg" ${complete?'':'disabled'}>Unduh JPEG</button><button class="button button-quiet" data-pb="solo-save" ${complete?'':'disabled'}>Simpan ke Galeri Pribadi</button></div><div class="pb-strip ${soloFrame}" id="solo-strip">${renderSoloPreview()}</div>${renderElementTools('solo',soloElements.find(item=>item.id===selectedSoloElementId))}</section></div><section class="panel private-gallery-panel"><h3>Galeri Pribadi · Perangkat ini</h3><p class="small-note">Galeri tersimpan di peramban/perangkat ini dan tidak dibagikan otomatis ke pasangan.</p><div id="pb-gallery-list">Memuat galeri…</div></section></div>`;
    void renderGallery();
  }

  function handleCameraAttachError(error) {
    if (error?.name === 'AbortError' || destroyed) return;
    const token = cameraRequestToken;
    if (cameraErrorNotifiedToken === token) return;
    cameraErrorNotifiedToken = token;
    stopCamera();
    showToast(error.message, 'error');
  }

  async function openKamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Peramban ini tidak mendukung akses kamera. Buka halaman melalui HTTPS dan izinkan akses kamera.');
    stopCamera();
    cameraErrorNotifiedToken = -1;
    const requestToken = cameraRequestToken;
    const newStream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user'}, audio:false });
    if (destroyed || requestToken !== cameraRequestToken) {
      newStream.getTracks().forEach(track => track.stop());
      return;
    }
    stream = newStream;
    await attachCameraToCurrentVideo(requestToken);
  }
  async function captureFromKamera(targetMode, index = null) {
    const video = root.querySelector('#pb-video');
    if (!video || !stream || !video.videoWidth) throw new Error('Kamera belum siap. Pilih Buka kamera terlebih dahulu.');
    const countdown = root.querySelector('#pb-countdown');
    for (let number=3; number>0; number--) {
      if (countdown) countdown.textContent = String(number);
      await wait(1000);
    }
    if (countdown) countdown.textContent = '';
    // Wait for a fresh decoded camera frame; videoWidth alone can be non-zero
    // while the first frame is still blank on some mobile browsers.
    const activeVideo = root.querySelector('#pb-video');
    if (!activeVideo || activeVideo !== video || !stream || !stream.getVideoTracks().some(track => track.readyState === 'live')) {
      throw new Error('Koneksi kamera berubah. Buka kamera kembali sebelum mengambil foto.');
    }
    if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Kamera belum mengirim gambar. Tunggu sebentar lalu coba lagi.')), 4000);
        activeVideo.addEventListener('loadeddata', () => { clearTimeout(timeout); resolve(); }, { once:true });
      });
    }
    if (typeof activeVideo.requestVideoFrameCallback === 'function') {
      await new Promise(resolve => activeVideo.requestVideoFrameCallback(() => resolve()));
    } else {
      await wait(180);
    }
    if (!activeVideo.videoWidth || !activeVideo.videoHeight || activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      throw new Error('Pratinjau kamera belum siap. Coba buka kamera kembali.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1600, activeVideo.videoWidth);
    canvas.height = Math.round(canvas.width * activeVideo.videoHeight / activeVideo.videoWidth);
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width,0); ctx.scale(-1,1); ctx.drawImage(activeVideo,0,0,canvas.width,canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',0.88));
    if (!blob) throw new Error('Foto tidak berhasil dibuat.');
    const data = await readDataUrl(blob);
    if (typeof data !== 'string' || !data.startsWith('data:image/')) throw new Error('Hasil foto tidak terbaca. Silakan ambil ulang.');
    const capturedImage = await loadImage(data);
    if (!capturedImage.naturalWidth || !capturedImage.naturalHeight) throw new Error('Foto berhasil diambil tetapi gambarnya kosong. Silakan ulangi.');
    const nextIndex = Number.isInteger(index) && index >= 0 ? index : (targetMode === 'solo' ? nextPhotoSlot(soloPhotos) : nextPhotoSlot(localPhotos));
    if (nextIndex < 0 || nextIndex >= 4) throw new Error('Keempat slot foto sudah terisi. Pilih foto yang ingin diulangi.');
    if (targetMode === 'solo') {
      soloPhotos[nextIndex] = data;
      if (hasCompletePhotoSet(soloPhotos,4)) stopCamera();
      renderSolo();
    } else {
      await addCouplePhoto(blob, nextIndex, `camera-${nextIndex+1}.jpg`);
      renderCouple();
    }
  }
  async function processImages(files, max = 4) {
    if (!files?.length) return [];
    const list = [...files].filter(file => file.type.startsWith('image/')).slice(0,max);
    if (!list.length) throw new Error('Pilih file gambar yang valid.');
    const result=[];
    for (const file of list) {
      const image=await loadImage(await readDataUrl(file));
      const scale=Math.min(1,1600/Math.max(image.width,image.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84));
      if (!blob) throw new Error('Salah satu gambar tidak dapat dikompres.');
      result.push({blob,url:await readDataUrl(blob),name:file.name||'photo.jpg'});
    }
    return result;
  }
  async function downloadBlob(blob, filename) {
    if (!blob) throw new Error('Hasil export tidak dapat dibuat.');
    if (!(blob instanceof Blob) || blob.size === 0) throw new Error('File hasil unduhan kosong. Periksa foto lalu coba unduh kembali.');
    const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.style.display='none';document.body.append(anchor);anchor.click();
    setTimeout(()=>{anchor.remove();URL.revokeObjectURL(url);},10000);
  }
  async function renderStripBlob(photos, frameId, filter, values, elements, couple=false, mime='image/png') {
    if (!Array.isArray(photos) || (couple ? !(photos[0]?.length === 4 && photos[1]?.length === 4 && [...photos[0], ...photos[1]].every(Boolean)) : !hasCompletePhotoSet(photos, 4))) {
      throw new Error('Empat foto belum lengkap. Ambil atau pulihkan semua foto sebelum mengunduh.');
    }
    const selected = frameById(frameId);
    const canvas = document.createElement('canvas');
    canvas.width = couple ? 1400 : 1000;
    canvas.height = couple ? 2600 : 2800;
    const ctx = canvas.getContext('2d');
    drawFrameBackground(ctx, selected, canvas.width, canvas.height, couple);
    const css = imageFilter(filter, values);
    const header = couple ? 270 : 245;
    const footer = couple ? 155 : 145;
    const marginX = couple ? 72 : 76;
    const gapY = couple ? 54 : 42;
    const slotH = (canvas.height - header - footer - gapY * 3) / 4;
    const gapX = couple ? 24 : 0;
    const slotW = couple ? (canvas.width - marginX * 2 - gapX) / 2 : canvas.width - marginX * 2;
    const drawCover = (image, x, y, width, height) => {
      const scale = Math.max(width / image.width, height / image.height);
      const cropW = width / scale, cropH = height / scale;
      const sourceX = (image.width - cropW) / 2, sourceY = (image.height - cropH) / 2;
      ctx.drawImage(image, sourceX, sourceY, cropW, cropH, x, y, width, height);
    };
    let drawnPhotoCount = 0;
    const drawPhotoSlot = (image, x, y, width, height, index) => {
      if (selected[4] === 'social') {
        // Tilt each white instant-photo card just like the browser preview.
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((index % 2 ? 1.8 : -1.7) * Math.PI / 180);
        ctx.shadowColor = 'rgba(80,53,17,.23)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
        ctx.fillStyle = '#fff'; ctx.fillRect(-width / 2 - 18, -height / 2 - 18, width + 36, height + 68);
        ctx.shadowColor = 'transparent';
        ctx.save(); ctx.beginPath(); ctx.rect(-width / 2, -height / 2, width, height); ctx.clip();
        ctx.filter = css; drawCover(image, -width / 2, -height / 2, width, height); ctx.restore();
        drawPhotoSlotBorder(ctx, selected, -width / 2, -height / 2, width, height, index);
        ctx.restore();
        drawnPhotoCount += 1;
        return;
      }
      ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
      ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip(); ctx.filter = css; drawCover(image, x, y, width, height); ctx.restore();
      drawPhotoSlotBorder(ctx, selected, x, y, width, height, index);
      drawnPhotoCount += 1;
    };
    if (couple) {
      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 2; column++) {
          const photo = photos[column]?.[row];
          const image = await loadPhotoForExport(photo, `Foto ${row + 1} ${column === 0 ? 'Pembuat ruang' : 'Tamu'}`);
          const x = marginX + column * (slotW + gapX);
          const y = header + row * (slotH + gapY);
          drawPhotoSlot(image, x, y, slotW, slotH, row + column * 4);
        }
      }
    } else {
      for (let index = 0; index < 4; index++) {
        const source = photos[index];
        const image = await loadPhotoForExport(source, `Foto ${index + 1}`);
        const x = marginX, y = header + index * (slotH + gapY);
        drawPhotoSlot(image, x, y, slotW, slotH, index);
      }
    }
    const expectedPhotoCount = couple ? 8 : 4;
    if (drawnPhotoCount !== expectedPhotoCount) {
      throw new Error(`Ekspor dibatalkan: hanya ${drawnPhotoCount} dari ${expectedPhotoCount} foto berhasil digambar. Jangan unduh frame kosong; ambil ulang foto yang bermasalah.`);
    }
    // The same floating theme ornaments shown in the browser preview are painted
    // over the photos in the exported image, keeping preview and print consistent.
    drawFrameOverlay(ctx, selected, canvas.width, canvas.height, couple);
    // Decorations use normalized coordinates in both the preview and exported image.
    (elements || []).forEach(element => {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const baseSize = element.kind === 'sticker' ? 0.1 : 0.07;
      const fontSize = canvas.width * baseSize * clampElementScale(element.scale);
      ctx.font = `700 ${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", Georgia, sans-serif`;
      const text = String(element.text || '');
      const x = canvas.width * clampPosition(element.x), y = canvas.height * clampPosition(element.y);
      ctx.translate(x, y); ctx.rotate((Number(element.rotate || 0) * Math.PI) / 180);
      // Stickers and user text are floating elements: no opaque card or white backing.
      ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = canvas.width * .009;
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, fontSize * .075); ctx.strokeStyle = 'rgba(255,255,255,.82)';
      ctx.strokeText(text, 0, 0, canvas.width * .78);
      ctx.shadowColor = 'rgba(25,15,25,.22)'; ctx.shadowBlur = canvas.width * .006;
      ctx.fillStyle = element.color || selected[3]; ctx.fillText(text, 0, 0, canvas.width * .78); ctx.restore();
    });
    const type = mime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.92));
    if (!blob || blob.size === 0) throw new Error('Gambar hasil tidak berhasil dibuat. Coba ulangi proses unduh.');
    return blob;
  }
  async function saveSoloGaleri() {
    const blob=await renderStripBlob(soloPhotos,soloFrame,soloFilter,soloAdjust,soloElements,false,'image/jpeg');
    const data=await readDataUrl(blob);const items=await getLocalValue('photobooth-gallery')||[];
    items.unshift({id:randomId(),data,date:Date.now()});await setLocalValue('photobooth-gallery',items.slice(0,15));
    showToast('Strip foto disimpan ke Galeri Pribadi perangkat ini.','success');void renderGallery();
  }

  // ----------------------------- Fotobooth Berdua ---------------------------
  function sharedFilter() { return pState?.filter?.preset || 'Asli'; }
  function sharedAdjustments() { return {brightness:pState?.filter?.brightness??100,contrast:pState?.filter?.contrast??100,saturation:pState?.filter?.saturation??100,temperature:pState?.filter?.temperature??0}; }
  function renderCoupleSetup() {
    const approved=pState?.ready||{};
    const filter=pState?.filter||{preset:'Asli',brightness:100,contrast:100,saturation:100,temperature:0};
    const selectedFrame=pState?.frameId||'korean';
    return `${gameTop('Fotobooth Berdua ♡','Atur satu bingkai dan tampilan foto bersama. Perubahan langsung terlihat di kedua perangkat.','SESI BERSAMA · PENGATURAN LANGSUNG')}<section class="panel photo-editor-card"><div class="pb-shared-setting-note"><strong>Satu pengaturan untuk berdua</strong><span>Kamu atau pasangan dapat mengubah bingkai dan filter. Tidak perlu mengatur dua kali.</span></div><h2>1. Pilih bingkai bersama</h2>${frameCatalog(selectedFrame,'couple-frame')}<h2>2. Atur tampilan foto bersama</h2>${renderFilterControls(filter.preset,filter,'couple')}<p class="small-note">Bingkai, filter, kecerahan, kontras, warna, dan temperatur akan tersinkron otomatis.</p><div class="approval-grid"><span class="ready-chip ${approved.host?'done':''}">Pembuat ruang · ${approved.host?'Siap':'Belum siap'}</span><span class="ready-chip ${approved.guest?'done':''}">Tamu · ${approved.guest?'Siap':'Belum siap'}</span></div><div class="photo-controls"><button class="button button-primary" data-pb="couple-ready">${approved[role]?'Batalkan kesiapan':'Saya siap'}</button><span class="small-note">Kamera dibuka setelah kalian berdua menyatakan siap.</span></div></section>`;
  }
  function renderCapture() {
    const done=pState?.photosDone||{};const ready=hasCompletePhotoSet(localPhotos,4);
    const selectedFrame=frameById(pState?.frameId||'korean');
    return `${gameTop('Ambil empat foto','Foto yang kamu ambil akan dipratinjau sebelum digabung dengan foto pasangan.','JEPRETAN MASING-MASING · HASIL BERSAMA')}<div class="photo-layout"><section class="panel photo-camera-card"><div class="camera-stage"><video id="pb-video" autoplay muted playsinline></video><div id="pb-camera-placeholder" class="camera-placeholder"><span>♡</span><b>Empat momen untuk strip bersama</b><small>Buka kamera dan ambil empat foto satu per satu, seperti mode sendiri.</small><strong id="pb-countdown"></strong></div></div><div class="photo-controls"><button class="button button-secondary" data-pb="camera">Buka kamera</button><button class="button button-primary" data-pb="capture-couple" ${!done[role] && stream && nextPhotoSlot(localPhotos)>=0?'':'disabled'}>Ambil foto berikutnya</button></div><div class="photo-slot-grid">${[0,1,2,3].map(index=>`<div class="photo-slot">${localPhotos[index]?`<img src="${localPhotos[index].url}" alt="Foto ${index+1}"><button type="button" class="pb-slot-retake" data-pb="couple-retake-slot" data-index="${index}" ${done[role]?'disabled':''}>Ulangi</button>`:`<span>${index+1}</span>`}<small>${index+1}</small></div>`).join('')}</div><p class="small-note">${localPhotos.filter(Boolean).length}/4 foto siap di perangkat ini. Bingkai bersama: ${esc(selectedFrame[1])}.</p><div class="pb-own-preview"><strong>Pratinjau empat foto milikmu</strong><div class="pb-mini-strip">${[0,1,2,3].map(index=>localPhotos[index]?`<img src="${localPhotos[index].url}" alt="Pratinjau foto ${index+1}" style="filter:${imageFilter(sharedFilter(),sharedAdjustments())}">`:'<span>Foto belum ada</span>').join('')}</div></div><button class="button button-primary" data-pb="couple-photos-ready" ${ready?'':'disabled'}>${done[role]?'Batalkan konfirmasi foto':'Konfirmasi empat foto'}</button><p class="small-note">Status pasangan — Pembuat ruang: ${done.host?'4 foto siap':'sedang menyiapkan'} · Tamu: ${done.guest?'4 foto siap':'sedang menyiapkan'}.</p>${pState?.retakeSlot?.role===role?`<p class="room-alert">Ambil ulang foto nomor ${Number(pState.retakeSlot.index)+1}. Tiga foto lainnya tetap digunakan.</p>`:''}</section></div>`;
  }
  function renderManualTransfer() {
    const hashes=pState?.manualHashes||{};
    const mismatch=hashes.host&&hashes.guest&&JSON.stringify(hashes.host)!==JSON.stringify(hashes.guest);
    return `${gameTop('Pemindahan foto manual','Koneksi langsung tidak berhasil setelah satu percobaan ulang.','ALTERNATIF TANPA UNGGAH FOTO')}<section class="panel photo-editor-card"><div class="room-alert">Foto tidak diunggah ke server. Kirim delapan file melalui aplikasi lain. Kedua perangkat harus memilih file yang identik dengan urutan: Pembuat ruang 1–4, lalu Tamu 1–4.</div><label class="button button-secondary file-button">Pilih delapan foto yang sama<input type="file" accept="image/*" multiple data-pb-manual hidden></label><p class="small-note">Dipilih: ${manualPhotos.filter(Boolean).length}/8. Pembuat ruang: ${hashes.host?'sudah diperiksa':'menunggu'} · Tamu: ${hashes.guest?'sudah diperiksa':'menunggu'}.</p>${mismatch?'<p class="room-alert">Urutan atau file yang dipilih tidak sama. Pilih ulang delapan file yang persis sama pada kedua perangkat.</p>':''}<div class="pb-manual-preview">${manualPhotos.map((photo,index)=>photo?`<figure><img src="${photo.url}" alt="Foto ${index+1}"><figcaption>${index<4?'Pembuat ruang':'Tamu'} ${index%4+1}</figcaption></figure>`:'').join('')}</div><div class="photo-controls"><button class="button button-primary" data-pb="verify-manual" ${hasCompletePhotoSet(manualPhotos,8)?'':'disabled'}>Periksa kecocokan foto</button><button class="button button-quiet" data-pb="solo-fallback">Lanjutkan sendiri</button><button class="button button-quiet" data-pb="abort-couple">Batalkan sesi</button></div></section>`;
  }
  function renderRelayTransfer() {
    const failed = pState?.p2p?.status === 'relay-error' || Boolean(relayErrorText);
    const uploadPct = Math.round((relayUploadCount / 4) * 100);
    const downloadPct = Math.round((relayDownloadCount / 4) * 100);
    return `${gameTop('Mengirim foto pasangan','Jangan tutup halaman. Foto dikirim otomatis dan diperiksa sebelum editor dibuka.','TRANSFER OTOMATIS · PEMULIHAN KONEKSI')}<section class="panel photo-editor-card"><div class="pb-shared-setting-note"><strong>${failed ? 'Koneksi perlu dicoba ulang' : 'Foto kalian sedang diamankan'}</strong><span>${esc(relayErrorText || relayStatusText || 'WebRTC tidak tersedia. Sistem sedang memakai jalur cadangan Firebase secara otomatis.')}</span></div><div class="pb-relay-progress"><strong>Foto milikmu · ${relayUploadCount}/4 terkirim</strong><div class="pb-progress-track"><span style="width:${uploadPct}%"></span></div><strong>Foto pasangan · ${relayDownloadCount}/4 diterima</strong><div class="pb-progress-track"><span style="width:${downloadPct}%"></span></div></div><p class="small-note">Transfer memakai Firebase Realtime Database sebagai jalur cadangan. Foto dikompres, diperiksa dengan checksum, dan disimpan di kedua perangkat sebelum editor dibuka.</p>${failed ? `<div class="photo-controls"><button class="button button-primary" data-pb="retry-relay">Coba kirim kembali</button><button class="button button-quiet" data-pb="abort-couple">Batalkan sesi</button></div>` : `<p class="small-note">Pastikan kedua perangkat tetap membuka halaman ini dan memiliki koneksi internet.</p>`}</section>`;
  }

  function renderSharedStrip() {
    if(!editorData) return '<div class="photo-editor-card"><p>Memulihkan foto lokal untuk editor bersama…</p></div>';
    const selected = frameById(pState.frameId || 'korean');
    const css = imageFilter(sharedFilter(), sharedAdjustments());
    const rows = [0,1,2,3].map(index => `<div class="pb-couple-row"><figure class="pb-couple-photo pb-photo-card ${selected[0]}"><img src="${editorData.host[index]?.url || ''}" alt="Foto Pembuat ruang ${index+1}" style="filter:${css}"><figcaption>${photoCaption(selected,index,'PEMBUAT')}</figcaption></figure><figure class="pb-couple-photo pb-photo-card ${selected[0]}"><img src="${editorData.guest[index]?.url || ''}" alt="Foto Tamu ${index+1}" style="filter:${css}"><figcaption>${photoCaption(selected,index,'TAMU')}</figcaption></figure></div>`).join('');
    const elements = (pState.elements || []).map(element => `<button type="button" class="pb-shared-element ${element.kind==='sticker'?'sticker':''} ${selectedElementId===element.id?'selected':''}" style="left:${clampPosition(element.x)*100}%;top:${clampPosition(element.y)*100}%;transform:translate(-50%,-50%) rotate(${Number(element.rotate||0)}deg) scale(${clampElementScale(element.scale)});color:${esc(element.color||selected[3])}" data-pb="select-element" data-element-id="${esc(element.id)}" data-drag-element="couple" aria-label="Pilih dan geser ${esc(element.text)}">${esc(element.text)}</button>`).join('');
    return `<div class="pb-couple-strip ${selected[0]}">${renderFrameHeader(selected)}<div class="pb-frame-ornaments ${selected[0]}" aria-hidden="true"><span class="ornament-a">${selected[0]==='comic'?'POW!':selected[0]==='kawaii'?'♡':selected[0]==='wanted'?'★':'✦'}</span><span class="ornament-b">${selected[0]==='comic'?'WOW!':selected[0]==='kawaii'?'✿':selected[0]==='wanted'?'REWARD':'♡'}</span></div><div class="pb-couple-rows">${rows}</div>${renderFrameFooter(selected)}${elements}</div>`;
  }
  function renderElementTools(type, selected) {
    if (!selected) return '<div class="pb-element-tools muted"><span>Pilih emoji atau teks pada pratinjau untuk mengatur rotasi atau menghapusnya.</span></div>';
    const rotation = ((Number(selected.rotate || 0) % 360) + 360) % 360;
    return `<div class="pb-element-tools"><label class="pb-rotation-control"><span>Putar hiasan <strong data-rotation-label>${Math.round(rotation)}°</strong></span><input type="range" min="0" max="360" step="1" value="${rotation}" data-element-rotation="${type}"></label><button type="button" class="button button-quiet pb-delete-selected" data-pb="delete-selected-element">Hapus hiasan terpilih</button></div>`;
  }

  function renderSharedEditor() {
    const approvals=pState?.approvals||{};
    const selected=(pState.elements||[]).find(element=>element.id===selectedElementId);
    const slotRequest=pState?.slotRetake;
    const ownFotos=editorData?.[role]||[];
    const slotGrid=ownFotos.length===4?`<div class="pb-retake-grid">${ownFotos.map((photo,index)=>`<figure><img src="${photo?.url||''}" alt="Foto ${index+1} milikmu"><figcaption>Foto ${index+1}</figcaption><button class="button button-small button-quiet" data-pb="request-slot-retake" data-index="${index}" ${slotRequest?'disabled':''}>Ulangi foto ini</button></figure>`).join('')}</div>`:'<p class="small-note">Memuat foto untuk opsi pengambilan ulang…</p>';
    const retakeNotice=slotRequest?`<div class="room-alert"><strong>Permintaan ulang foto</strong><p>${slotRequest.role==='host'?'Pembuat ruang':'Tamu'} meminta mengulang foto nomor ${Number(slotRequest.index)+1}.</p><p>Pembuat ruang: ${slotRequest.approvals?.host?'setuju':'menunggu'} · Tamu: ${slotRequest.approvals?.guest?'setuju':'menunggu'}</p>${slotRequest.role===role?`<button class="button button-quiet" data-pb="cancel-slot-retake">Batalkan permintaan</button>`:`<button class="button button-primary" data-pb="approve-slot-retake">Setuju, ulangi foto</button>`}</div>`:'';
    return `${gameTop('Pratinjau gabungan berdua','Periksa hasil delapan foto pada satu strip. Kalian dapat meminta pengambilan ulang sebelum menyetujui hasil akhir.','PRATINJAU SEBELUM CETAK')}<div class="photo-layout"><section class="panel shared-editor-panel"><h2>Pratinjau hasil gabungan</h2><div class="pb-shared-preview">${renderSharedStrip()}</div>${renderElementTools('couple',selected)}<h2>Tampilan foto</h2>${renderFilterControls(sharedFilter(),sharedAdjustments(),'couple')}<p class="small-note">Filter, kecerahan, kontras, saturasi, dan temperatur diterapkan pada hasil unduhan dan tersinkron ke pasangan. Kolom kiri adalah Pembuat ruang, kolom kanan adalah Tamu. Inilah susunan yang akan diunduh atau dicetak.</p>${retakeNotice}<h2>Ulangi foto tertentu</h2><p class="small-note">Pilih salah satu foto milikmu. Pasangan perlu menyetujui sebelum kamera dibuka kembali untuk satu foto tersebut.</p>${slotGrid}<div class="photo-controls"><h3>Hiasan tanpa latar</h3>${renderStickerPicker('add-sticker')}<form data-pb-form="couple-text"><input name="text" maxlength="50" placeholder="Tulis keterangan"><button class="button button-quiet" type="submit">Tambah teks</button></form></div><p class="small-note">Ketuk hiasan untuk memilih, lalu seret dengan satu jari untuk memindahkan. Gunakan dua jari untuk mencubit agar ukuran berubah atau putar kedua jari untuk memutar hiasan. Pengatur sudut tetap tersedia untuk penyesuaian presisi. Tombol hapus berada di panel bawah, tidak menempel pada hiasan. Perubahan tersinkron ke pasangan.</p><div class="approval-grid"><span class="ready-chip ${approvals.host?'done':''}">Pembuat ruang · ${approvals.host?'Setuju':'Menunggu'}</span><span class="ready-chip ${approvals.guest?'done':''}">Tamu · ${approvals.guest?'Setuju':'Menunggu'}</span></div><div class="photo-controls"><button class="button button-primary" data-pb="final-approve">${approvals[role]?'Batalkan persetujuan':'Setujui hasil akhir'}</button><button class="button button-quiet" data-pb="retake-all">Minta ulang seluruh foto</button></div><p class="small-note">Tombol unduh/cetak tersedia setelah kalian berdua menyetujui pratinjau ini.</p></section></div>`;
  }

  async function requestSlotRetake(index) {
    if (!Number.isInteger(index) || index < 0 || index > 3) throw new Error('Slot foto tidak valid.');
    await mutate(state => {
      if (state.phase !== 'editor' || state.slotRetake) return false;
      state.slotRetake = { role, index, approvals: {host:role==='host', guest:role==='guest'}, requestedAt:Date.now() };
      state.approvals = {host:false,guest:false};
    });
    showToast(`Permintaan mengulang foto ${index+1} dikirim. Pasangan perlu menyetujui.`);
  }
  async function approveSlotRetake() {
    await mutate(state => {
      const request=state.slotRetake;
      if (state.phase!=='editor' || !request || request.role===role) return false;
      request.approvals=request.approvals||{host:false,guest:false};
      request.approvals[role]=true;
      if (request.approvals.host && request.approvals.guest) {
        state.phase='capture';
        state.retakeSlot={role:request.role,index:request.index,requestedAt:request.requestedAt};
        state.slotRetake=null;
        state.photosDone=state.photosDone||{host:false,guest:false};
        state.photosDone[request.role]=false;
        state.photosDone[request.role==='host'?'guest':'host']=true;
        state.p2p={attempt:0,status:'idle'};
        state.approvals={host:false,guest:false};
      }
    });
  }
  async function applyPendingSlotRetake() {
    const retake=pState?.retakeSlot;
    if (!retake || pState.phase!=='capture') return;
    const key=`${retake.role}:${retake.index}:${retake.requestedAt||0}`;
    if (key===appliedSlotRetakeKey) return;
    appliedSlotRetakeKey=key;
    editorData=null;editorLoadKey='';remotePhotos=[];localSent=false;remoteDone=false;sendStarted=false;p2pStarted=false;
    disposePeer();
    if (retake.role===role) {
      localPhotos=[...localPhotos];
      localPhotos[retake.index]=null;
      await deleteLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,role,retake.index));
    }
    await restoreCaptureMedia();
    renderCouple();
  }

  function renderFinalized() {
    const approvals=pState?.approvals||{};
    const requests=pState?.retakeRequests||{};
    const retakeStatus=requests.host||requests.guest
      ? `<p class="room-alert">Permintaan pengambilan ulang seluruh foto: Pembuat ruang ${requests.host?'sudah meminta':'belum meminta'} · Tamu ${requests.guest?'sudah meminta':'belum meminta'}. Kedua pemain harus meminta agar pengambilan ulang dimulai.</p>`
      : '';
    return `${gameTop('Kenangan kecil kita ♡','Kalian berdua sudah menyetujui hasil akhir. Simpan salinan pada perangkat masing-masing.','HASIL AKHIR DISETUJUI')}<section class="panel photo-editor-card"><div class="pb-shared-preview">${renderSharedStrip()}</div><p class="small-note">Pembuat ruang ${approvals.host?'menyetujui':'menunggu'} · Tamu ${approvals.guest?'menyetujui':'menunggu'}</p>${retakeStatus}<div class="photo-controls"><button class="button button-primary" data-pb="couple-png">Unduh PNG</button><button class="button button-secondary" data-pb="couple-jpeg">Unduh JPEG</button><button class="button button-secondary" data-pb="couple-print">Cetak hasil</button><button class="button button-quiet" data-pb="save-couple-gallery">Simpan ke Galeri Pribadi</button><button class="button button-quiet" data-pb="retake-all">${requests[role]?'Batalkan permintaan pengambilan ulang':'Minta ulang seluruh foto'}</button></div><p class="small-note">Galeri Pribadi tersimpan hanya di peramban/perangkat ini dan tidak tersinkron ke pasangan.</p></section>`;
  }
  function renderCouple() {
    mode = 'couple';
    if (!pState) { root.innerHTML = '<section class="panel game-panel"><p>Menyiapkan Fotobooth Berdua…</p></section>'; return; }
    if (pState.phase !== 'capture' && stream) stopCamera();
    if (pState.phase === 'setup') root.innerHTML = `<div class="photo-app">${renderCoupleSetup()}</div>`;
    else if (pState.phase === 'capture') root.innerHTML = `<div class="photo-app">${renderCapture()}</div>`;
    else if (pState.phase === 'relay' || pState.phase === 'manual') root.innerHTML = `<div class="photo-app">${renderRelayTransfer()}</div>`;
    else if (pState.phase === 'editor') root.innerHTML = `<div class="photo-app">${renderSharedEditor()}</div>`;
    else if (pState.phase === 'finalized') root.innerHTML = `<div class="photo-app">${renderFinalized()}</div>`;
    else root.innerHTML = `<div class="photo-app"><section class="panel game-panel"><h2>Sesi Fotobooth berakhir</h2><button class="button button-quiet" data-pb="back">Kembali ke lobi</button></section></div>`;
    if (stream && pState.phase === 'capture') void attachCameraToCurrentVideo().catch(error => handleCameraAttachError(error));
  }
  async function addCouplePhoto(blob, index, name) {
    const data = await readDataUrl(blob);
    localPhotos[index] = { blob, url:data, name };
    if (pState?.retakeToken === undefined) return;
    await putLocalMedia('photobooth', localKey(session.sessionId,pState.retakeToken,role,index), blob);
  }
  async function restoreCaptureMedia() {
    if (!pState) return;
    if (restoringCapture) return restoreCapturePromise;
    restoringCapture = true;
    restoreCapturePromise = (async () => {
      try {
        const restored=[];
        for (let index=0;index<4;index++) {
          if (localPhotos[index]?.blob instanceof Blob) { restored[index]=localPhotos[index]; continue; }
          const blob=await getLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,role,index));
          if (blob) restored[index]={blob,url:await readDataUrl(blob),name:`foto-${index+1}.jpg`};
        }
        if (restored.some(Boolean)) {
          localPhotos=restored;
          if (mode==='couple' && ['capture','relay','manual'].includes(pState?.phase)) renderCouple();
        }
      } catch (error) { console.warn('Local photo restore:',error); }
    })();
    try { await restoreCapturePromise; }
    finally { restoringCapture=false; restoreCapturePromise=null; }
  }
  async function ensureEditorData() {
    const key=`${pState?.retakeToken||0}:${pState?.photoRevision||0}:${pState?.p2p?.status||''}`;
    if (editorData && editorLoadKey===key) return;
    if (editorLoadKey===`loading:${key}`) return;
    editorLoadKey=`loading:${key}`;
    const host=[],guest=[];
    try {
      for (let index=0;index<4;index++) {
        const hostBlob=await getLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,'host',index));
        const guestBlob=await getLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,'guest',index));
        if (hostBlob) host[index]={blob:hostBlob,url:await readDataUrl(hostBlob)};
        if (guestBlob) guest[index]={blob:guestBlob,url:await readDataUrl(guestBlob)};
      }
      if(host.length===4 && guest.length===4 && host.every(Boolean) && guest.every(Boolean)) editorData={host,guest};
      else editorData=null;
      editorLoadKey=editorData?key:'';
    } catch (error) { editorData=null;editorLoadKey='';showToast(`Foto lokal tidak dapat dipulihkan: ${error.message}`,'error'); }
    if (mode==='couple' && ['editor','finalized'].includes(pState?.phase)) renderCouple();
  }
  async function beginCaptureReady() {
    await mutate(state => {
      if (state.phase !== 'setup') return false;
      state.ready=state.ready||{host:false,guest:false};
      state.ready[role]=!state.ready[role];
      if (state.ready.host && state.ready.guest) {
        state.phase='capture';
        state.photosDone={host:false,guest:false};
        state.p2p={attempt:0,status:'idle'};
        state.manualHashes={};
        state.retakeToken=state.retakeToken||0;
        state.retakeSlot=null;
      }
    });
  }
  async function confirmPhotosReady() {
    if (!hasCompletePhotoSet(localPhotos, 4)) throw new Error('Lengkapi keempat foto terlebih dahulu.');
    if (pState?.p2p?.status && pState.p2p.status!=='idle') throw new Error('Transfer sudah dimulai. Gunakan pratinjau akhir untuk meminta pengambilan ulang.');
    await mutate(state => { state.photosDone=state.photosDone||{host:false,guest:false};state.photosDone[role]=!state.photosDone[role]; });
    const latest=(await get(publicRef)).val();
    if (!latest?.photosDone?.[role]) showToast('Konfirmasi foto dibatalkan. Kamu dapat mengubah foto.');
    else showToast('Empat foto siap. Menunggu pasangan…','success');
    if (role==='host' && latest?.photosDone?.host && latest?.photosDone?.guest && latest.p2p?.status==='idle' && !p2pStarted) { p2pStarted=true;void beginP2P(); }
  }
  function waitForValue(path, timeoutMs) {
    return new Promise((resolve,reject) => {
      let done=false;const target=ref(db,path);
      const unsubscribe=onValue(target,snapshot=>{if(snapshot.exists()&&!done){done=true;unsubscribe();clearTimeout(timer);resolve(snapshot.val());}},error=>{if(!done){done=true;unsubscribe();clearTimeout(timer);reject(error);}});
      const timer=setTimeout(()=>{if(!done){done=true;unsubscribe();reject(new Error('P2P negotiation timeout'));}},timeoutMs);
      unsubscribers.push(unsubscribe);
    });
  }
  async function connectPeer(side, attempt) {
    disposePeer();localSent=false;remoteDone=false;sendStarted=false;p2pTransferError=null;
    remotePhotos=[];
    let timeoutId;
    const negotiation = (async () => {
      try {
        rtc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
        const path=signalPath(code,session.sessionId,attempt);
        const seenCandidates=new Set();let candidateQueue=[];
        const remoteCandidateRole=side==='host'?'guest':'host';
        candidateUnsubscribe=onValue(ref(db,`${path}/${remoteCandidateRole}Candidates`),snapshot=>{
          snapshot.forEach(child=>{if(seenCandidates.has(child.key))return;seenCandidates.add(child.key);const candidate=child.val();if(!rtc?.remoteDescription)candidateQueue.push(candidate);else void rtc.addIceCandidate(new RTCIceCandidate(candidate)).catch(error=>console.debug('ICE candidate skipped',error));});
        });
        rtc.onicecandidate=event=>{if(event.candidate)void set(ref(db,`${path}/${side}Candidates/${randomId()}`),event.candidate.toJSON()).catch(error=>console.warn('ICE signal write failed',error));};
        const flushCandidates=async()=>{for(const candidate of candidateQueue){try{await rtc.addIceCandidate(new RTCIceCandidate(candidate));}catch{}}candidateQueue=[];};
        if(side==='host') {
          channel=rtc.createDataChannel('diri-photo-transfer',{ordered:true});wireDataChannel(channel);
          const offer=await rtc.createOffer();await rtc.setLocalDescription(offer);
          await set(ref(db,`${path}/offer`),{type:offer.type,sdp:offer.sdp});
          const answer=await waitForValue(`${path}/answer`,12000);
          await rtc.setRemoteDescription(new RTCSessionDescription(answer));await flushCandidates();
        } else {
          const channelReady=new Promise(resolve=>{
            rtc.addEventListener('datachannel',event=>{channel=event.channel;wireDataChannel(channel);resolve(channel);},{once:true});
          });
          const offer=await waitForValue(`${path}/offer`,18000);
          await rtc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer=await rtc.createAnswer();await rtc.setLocalDescription(answer);
          await set(ref(db,`${path}/answer`),{type:answer.type,sdp:answer.sdp});await flushCandidates();
          await Promise.race([channelReady,wait(12000).then(()=>{throw new Error('DataChannel did not arrive.');})]);
        }
        await waitChannelOpen(12000);
        return true;
      } catch (error) {
        console.warn('WebRTC connection attempt failed:',error);
        return false;
      }
    })();
    const timedOut = new Promise(resolve => {
      timeoutId=setTimeout(()=>{disposePeer();resolve(false);},15000);
    });
    const connected=await Promise.race([negotiation,timedOut]);
    clearTimeout(timeoutId);
    if(!connected) disposePeer();
    return connected;
  }
  function waitChannelOpen(timeoutMs) {
    return new Promise((resolve,reject)=>{
      if (!channel) return reject(new Error('DataChannel is not available.'));
      if (channel.readyState==='open') { void sendLocalFiles();resolve(true);return; }
      const timer=setTimeout(()=>reject(new Error('DataChannel open timeout.')),timeoutMs);
      channel.addEventListener('open',()=>{clearTimeout(timer);void sendLocalFiles();resolve(true);},{once:true});
      channel.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('DataChannel error.'));},{once:true});
    });
  }
  function wireDataChannel(dataChannel) {
    dataChannel.binaryType='arraybuffer';
    let incomingFile = null;
    let messageQueue = Promise.resolve();
    // Serialize asynchronous IndexedDB writes so file-start cannot overtake file-end.
    dataChannel.onmessage=event=>{
      messageQueue=messageQueue.then(async()=>{
        if(typeof event.data==='string'){
          let message;try{message=JSON.parse(event.data);}catch{return;}
          if(message.type==='file-start'){
            const index=Number(message.index);
            if(!Number.isInteger(index)||index<0||index>3||!String(message.mime||'').startsWith('image/'))throw new Error('Informasi foto dari pasangan tidak valid.');
            incomingFile={index,mime:message.mime,name:message.name,chunks:[],bytes:0};
          }
          else if(message.type==='file-end'&&incomingFile){
            const completed=incomingFile;incomingFile=null;const blob=new Blob(completed.chunks,{type:completed.mime});
            if(!blob.size||!blob.type.startsWith('image/'))throw new Error('Foto yang diterima tidak valid.');
            const hash=await hashBlob(blob),key=localKey(session.sessionId,pState?.retakeToken||0,partnerRole,completed.index);
            await putLocalMedia('photobooth',key,blob);remotePhotos[completed.index]={blob,url:await readDataUrl(blob),name:completed.name,hash};
            if(dataChannel.readyState!=='open')throw new Error('Koneksi langsung terputus sebelum tanda terima dikirim.');
            dataChannel.send(JSON.stringify({type:'file-ack',index:completed.index,sha256:hash}));await finishP2PIfReady();
          }else if(message.type==='file-ack'){
            const waiter=fileAckWaiters.get(Number(message.index));if(waiter){fileAckWaiters.delete(Number(message.index));waiter.resolve(message);}
          }else if(message.type==='all-done'){remoteDone=true;await finishP2PIfReady();}
        }else if(incomingFile){
          const chunkBytes=event.data.byteLength||event.data.size||0;
          incomingFile.bytes+=chunkBytes;
          if(incomingFile.bytes>12*1024*1024)throw new Error('Ukuran satu foto melebihi batas transfer langsung 12 MB.');
          incomingFile.chunks.push(event.data);
        }
      }).catch(error=>{p2pTransferError=error;console.error('DataChannel receive error:',error);showToast(`Penerimaan foto langsung gagal: ${error.message}`,'error');try{dataChannel.close();}catch{}});
    };
  }
  function waitForFileAck(index,timeoutMs=45000){
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{fileAckWaiters.delete(index);reject(new Error(`Konfirmasi penerimaan foto ${index+1} tidak diterima.`));},timeoutMs);fileAckWaiters.set(index,{resolve:value=>{clearTimeout(timer);resolve(value);}});});
  }
  async function sendLocalFiles() {
    if (sendStarted || !channel || channel.readyState!=='open' || !hasCompletePhotoSet(localPhotos, 4)) return;
    sendStarted=true;
    try {
      for (let index=0;index<4;index++) {
        const photo=localPhotos[index];const blob=photo.blob;
        channel.send(JSON.stringify({type:'file-start',index,mime:blob.type||'image/jpeg',name:photo.name||`foto-${index+1}.jpg`}));
        const buffer=await blob.arrayBuffer();const chunkSize=16*1024;
        for (let offset=0;offset<buffer.byteLength;offset+=chunkSize) {
          while(channel.bufferedAmount>512*1024) await wait(30);
          channel.send(buffer.slice(offset,Math.min(offset+chunkSize,buffer.byteLength)));
        }
        const ack=waitForFileAck(index);
        channel.send(JSON.stringify({type:'file-end',index}));
        const receipt=await ack;
        const expectedHash=await hashBlob(blob);
        if(!receipt?.sha256||receipt.sha256!==expectedHash)throw new Error(`Pemeriksaan integritas foto ${index+1} dari pasangan gagal.`);
      }
      channel.send(JSON.stringify({type:'all-done',role}));localSent=true;
      await finishP2PIfReady();
    } catch (error) { p2pTransferError=error;showToast(`Transfer langsung belum berhasil: ${error.message}. Sistem akan beralih ke jalur cadangan.`,'error');try{channel?.close();}catch{} }
  }
  const RELAY_TIMEOUT_MS = 10 * 60 * 1000;
  function relayBasePath() {
    const token=Number(pState?.retakeToken||0);
    const transferId=String(pState?.p2p?.transferId||'legacy');
    return `roomGames/${code}/${session.sessionId}/photoRelay/${token}_${transferId}`;
  }
  async function makeRelayBlob(photo,index) {
    const source=photo?.blob instanceof Blob?photo.blob:(photo instanceof Blob?photo:null);
    if(!source||!source.type.startsWith('image/'))throw new Error(`Foto ${index+1} tidak tersedia untuk dikirim.`);
    if(source.type==='image/jpeg'&&source.size<=RELAY_MAX_PHOTO_BYTES)return source;
    const objectUrl=URL.createObjectURL(source);
    try {
      const image=await loadImage(objectUrl);
      let scale=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));
      for(let pass=0;pass<6;pass++){
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('Kanvas kompresi foto tidak tersedia.');
        context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
        for(const quality of [.82,.74,.66,.58]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=RELAY_MAX_PHOTO_BYTES)return blob;}
        scale*=.78;
      }
      throw new Error(`Foto ${index+1} terlalu besar setelah dikompres. Ambil ulang dengan resolusi lebih rendah.`);
    } finally { URL.revokeObjectURL(objectUrl); }
  }
  async function waitForFirebaseOnline(timeoutMs=RELAY_TIMEOUT_MS){
    return new Promise((resolve,reject)=>{
      let settled=false,unsubscribe=()=>{},hasShownOffline=false;
      const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);try{unsubscribe();}catch{}if(error)reject(error);else resolve(value);};
      const timer=setTimeout(()=>finish(new Error('Firebase belum tersambung selama 10 menit. Foto tetap tersimpan di perangkat; transfer akan dilanjutkan saat koneksi tersedia.')),timeoutMs);
      unsubscribe=onValue(ref(db,'.info/connected'),snapshot=>{
        if(snapshot.val()===true)finish(null,true);
        else if(!hasShownOffline){hasShownOffline=true;relayStatusText='Menunggu koneksi internet dan Firebase pulih. Foto tetap tersimpan di perangkat…';renderCouple();}
      },error=>finish(error));
      unsubscribers.push(unsubscribe);
    });
  }
  async function retryRelayWrite(path,value,attempts=8){
    let lastError;
    for(let attempt=0;attempt<attempts;attempt++){
      if(destroyed)throw new Error('Sesi ditutup sebelum transfer selesai.');
      let timer;
      try{
        await waitForFirebaseOnline();
        relayStatusText=`Mengirim data foto (${attempt+1}/${attempts})…`;renderCouple();
        await Promise.race([set(ref(db,path),value),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Waktu tunggu penulisan Firebase habis.')),25000);})]);
        clearTimeout(timer);return true;
      }catch(error){
        clearTimeout(timer);lastError=error;
        const message=`${error?.code||''} ${error?.message||''}`;
        const permissionDenied=/permission|denied|invalid|unauthorized/i.test(message);
        const offlineTimeout=/belum tersambung selama 10 menit/i.test(message);
        if(permissionDenied)throw new Error('Firebase menolak transfer foto. Buka Firebase Console → Realtime Database → Rules, lalu publikasikan ulang firebase-database.rules.json dari ZIP versi terbaru.');
        // The connection watcher and browser-online watcher will resume this
        // transfer when connectivity returns; do not make the user wait through
        // eight repeated ten-minute offline waits.
        if(offlineTimeout||attempt===attempts-1)break;
        relayStatusText=`Pengiriman belum dikonfirmasi. Mencoba ulang (${attempt+2}/${attempts})…`;renderCouple();
        await wait(Math.min(12000,700*(2**attempt)));
      }
    }
    throw lastError||new Error('Foto belum berhasil dikirim ke Firebase.');
  }
  function waitForRelayPath(path,timeoutMs=RELAY_TIMEOUT_MS){
    return new Promise((resolve,reject)=>{
      let settled=false,unsubscribe=()=>{};
      const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);try{unsubscribe();}catch{}if(error)reject(error);else resolve(value);};
      const timer=setTimeout(()=>finish(new Error('Menunggu foto pasangan terlalu lama. Tekan Coba kirim kembali saat koneksi stabil.')),timeoutMs);
      unsubscribe=onValue(ref(db,path),snapshot=>{if(snapshot.exists())finish(null,snapshot.val());},error=>finish(error));
      unsubscribers.push(unsubscribe);
    });
  }
  function waitForBothRelayAcks(path,timeoutMs=RELAY_TIMEOUT_MS){
    return new Promise((resolve,reject)=>{
      let settled=false,unsubscribe=()=>{};
      const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);try{unsubscribe();}catch{}if(error)reject(error);else resolve(value);};
      const timer=setTimeout(()=>finish(new Error('Belum menerima tanda terima dari kedua perangkat. Tekan Coba kirim kembali.')),timeoutMs);
      unsubscribe=onValue(ref(db,path),snapshot=>{const value=snapshot.val()||{};if(value.host?.count===4&&value.guest?.count===4)finish(null,value);},error=>finish(error));
      unsubscribers.push(unsubscribe);
    });
  }
  async function cleanupRelayRole(base=relayBasePath()){
    if(!db||!base)return;
    const removals=[];
    for(let index=0;index<4;index++)removals.push(remove(ref(db,`${base}/photos/${role}/${index}`)));
    removals.push(remove(ref(db,`${base}/status/${role}`)),remove(ref(db,`${base}/acks/${role}`)));
    await Promise.allSettled(removals);
  }

  async function startFirebaseRelay(){
    if(relayStarted||destroyed||!db||!pState||!['relay','manual'].includes(pState.phase))return;
    relayStarted=true;relayErrorText='';relayUploadCount=0;relayDownloadCount=0;relayStatusText='Menyiapkan empat foto untuk dikirim…';renderCouple();
    const token=Number(pState.retakeToken||0),base=relayBasePath();
    try{
      await restoreCaptureMedia();
      if(!hasCompletePhotoSet(localPhotos,4))throw new Error('Empat foto lokal belum lengkap. Pastikan semua foto tersimpan sebelum transfer.');
      const prepared=[];
      for(let index=0;index<4;index++){
        const blob=await makeRelayBlob(localPhotos[index],index),dataUrl=await readDataUrl(blob),hash=await hashBlob(blob);
        const photo={blob,url:dataUrl,dataUrl,name:`foto-${index+1}.jpg`,hash};prepared.push(photo);
        await putLocalMedia('photobooth',localKey(session.sessionId,token,role,index),blob);
      }
      localPhotos=prepared;relayStatusText='Mengirim empat foto milikmu…';renderCouple();
      for(let index=0;index<4;index++){
        const payload=buildRelayPhotoPayload({dataUrl:prepared[index].dataUrl,blob:prepared[index].blob,sha256:prepared[index].hash,name:prepared[index].name,index,role});
        await retryRelayWrite(`${base}/photos/${role}/${index}`,payload);
        relayUploadCount=index+1;renderCouple();
      }
      await retryRelayWrite(`${base}/status/${role}`,{uploaded:true,count:4,retakeToken:token,updatedAt:Date.now()});
      relayStatusText='Foto milikmu aman. Mengambil empat foto pasangan…';renderCouple();
      const received=await Promise.all([0,1,2,3].map(async index=>{
        const payload=await waitForRelayPath(`${base}/photos/${partnerRole}/${index}`);
        if(!validateRelayPayload(payload,partnerRole,index))throw new Error(`Foto pasangan nomor ${index+1} tidak lolos validasi.`);
        const blob=dataUrlToBlob(payload.dataUrl);
        if(blob.size!==payload.bytes||blob.size>RELAY_MAX_PHOTO_BYTES)throw new Error(`Ukuran foto pasangan nomor ${index+1} tidak cocok.`);
        const hash=await hashBlob(blob);if(hash!==payload.sha256)throw new Error(`Pemeriksaan integritas foto pasangan nomor ${index+1} gagal.`);
        await putLocalMedia('photobooth',localKey(session.sessionId,token,partnerRole,index),blob);
        const item={blob,url:await readDataUrl(blob),name:payload.name||`foto-${index+1}.jpg`,hash};remotePhotos[index]=item;relayDownloadCount=remotePhotos.filter(Boolean).length;renderCouple();return item;
      }));
      if(!hasCompletePhotoSet(received,4))throw new Error('Belum semua foto pasangan diterima.');
      await retryRelayWrite(`${base}/acks/${role}`,{count:4,receivedFrom:partnerRole,hashes:received.map(item=>item.hash),ownHashes:prepared.map(item=>item.hash),completedAt:Date.now()});
      relayStatusText='Foto sudah diterima. Memastikan kedua perangkat menyimpan salinan…';renderCouple();
      await waitForBothRelayAcks(`${base}/acks`);
      if(destroyed||token!==Number(pState?.retakeToken||0))return;
      const host=role==='host'?prepared:received,guest=role==='guest'?prepared:received;
      for(let index=0;index<4;index++){
        await putLocalMedia('photobooth',localKey(session.sessionId,token,'host',index),host[index].blob);
        await putLocalMedia('photobooth',localKey(session.sessionId,token,'guest',index),guest[index].blob);
      }
      editorData={host,guest};editorLoadKey=`${token}:${pState?.photoRevision||0}:relay`;
      await mutate(state=>{
        if(!['relay','manual'].includes(state.phase)||Number(state.retakeToken||0)!==token)return false;
        state.phase='editor';state.p2p={...(state.p2p||{}),status:'relay-complete',method:'firebase',completedAt:Date.now()};
        state.photoRevision=Number(state.photoRevision||0)+1;state.slotRetake=null;state.retakeSlot=null;state.elements=state.elements||[];state.approvals={host:false,guest:false};
      });
      showToast('Delapan foto berhasil dikirim dan diverifikasi di kedua perangkat.','success');
      setTimeout(()=>{if(!destroyed)void remove(ref(db,base)).catch(()=>{});},15000);
    }catch(error){
      console.error('Firebase photo relay failed:',error);relayErrorText=error.message||'Transfer foto belum selesai.';relayStatusText='Foto lokal tetap tersimpan. Periksa koneksi lalu coba ulang.';
      try{await mutate(state=>{if(['relay','manual'].includes(state.phase))state.p2p={...(state.p2p||{}),status:'relay-error',method:'firebase',errorCode:error?.code||'TRANSFER_FAILED',updatedAt:Date.now()};});}catch{}
      renderCouple();showToast(`Transfer otomatis belum selesai: ${relayErrorText}`,'error');
    }finally{relayStarted=false;}
  }

  async function finishP2PIfReady() {
    if (!localSent || !remoteDone || !hasCompletePhotoSet(remotePhotos,4) || !hasCompletePhotoSet(localPhotos,4)) return;
    for (let index=0;index<4;index++) await putLocalMedia('photobooth',localKey(session.sessionId,pState?.retakeToken||0,role,index),localPhotos[index].blob);
    const host=role==='host'?localPhotos:remotePhotos;const guest=role==='guest'?localPhotos:remotePhotos;
    editorData={host,guest};editorLoadKey=`${pState?.retakeToken||0}:${pState?.photoRevision||0}:complete`;
    await mutate(state=>{if(state.phase!=='capture')return false;state.phase='editor';state.p2p.status='complete';state.photoRevision=Number(state.photoRevision||0)+1;state.slotRetake=null;state.retakeSlot=null;state.elements=state.elements||[];state.approvals={host:false,guest:false};});
  }
  async function beginP2P() {
    if (role!=='host' || !pState?.photosDone?.host || !pState?.photosDone?.guest) return;
    for (let attempt=1;attempt<=2;attempt++) {
      remotePhotos=[];localSent=false;remoteDone=false;sendStarted=false;p2pStarted=true;
      await mutate(state=>{state.p2p={attempt,status:'connecting',startedAt:Date.now()};});
      p2pAttemptSeen=attempt;
      const connected=await connectPeer('host',attempt);
      if (connected) {
        // Keep the data channel alive long enough for mobile uploads; fall back
        // only after the direct route has had a real transfer window.
        await new Promise(resolve=>{p2pTimer=setTimeout(resolve,90000);const check=setInterval(()=>{if(pState?.phase==='editor'||destroyed||channel?.readyState==='closed'||p2pTransferError){clearInterval(check);clearTimeout(p2pTimer);resolve();}},200);});
        if (pState?.phase==='editor') return;
      }
      disposePeer();
      if (attempt===1) { showToast('Koneksi langsung belum berhasil. Mencoba sekali lagi…','error');await wait(800); }
    }
    await mutate(state=>{if(state.phase==='capture'){state.phase='relay';state.p2p={attempt:2,status:'relay',method:'firebase',transferId:randomId(),startedAt:Date.now()};}});
    relayStatusText='Koneksi langsung tidak tersedia. Beralih otomatis ke transfer cadangan…';
    showToast('Koneksi langsung tidak tersedia. Foto akan dikirim otomatis melalui jalur cadangan.');
    void startFirebaseRelay();
  }
  async function restoreManualFotos() {
    if (hasCompletePhotoSet(manualPhotos,8) || !pState) return;
    const restored=[];
    const token=pState.retakeToken||0;
    const savedHashes=await getLocalValue(`photobooth-manual-hashes:${session.sessionId}:${token}`)||[];
    for (let index=0;index<8;index++) {
      const blob=await getLocalMedia('photobooth',`${session.sessionId}:manual:${token}:${index}`);
      if(blob)restored[index]={blob,url:await readDataUrl(blob),hash:savedHashes[index]||await hashBlob(blob)};
    }
    manualPhotos=restored;
    if (mode==='couple' && pState?.phase==='manual') renderCouple();
  }
  async function tryCompleteManual() {
    if (manualCompletionRunning || !hasCompletePhotoSet(manualPhotos,8) || !pState) return;
    const latest=(await get(publicRef)).val();
    if (!latest?.manualHashes?.host || !latest?.manualHashes?.guest) return;
    if (JSON.stringify(latest.manualHashes.host)!==JSON.stringify(latest.manualHashes.guest)) {
      showToast('File atau urutan foto belum sama. Periksa kembali delapan file yang dipilih.','error');
      return;
    }
    manualCompletionRunning=true;
    try {
      for(let index=0;index<4;index++) {
        await putLocalMedia('photobooth',localKey(session.sessionId,latest.retakeToken||0,'host',index),manualPhotos[index].blob);
        await putLocalMedia('photobooth',localKey(session.sessionId,latest.retakeToken||0,'guest',index),manualPhotos[index+4].blob);
      }
      editorData={host:manualPhotos.slice(0,4),guest:manualPhotos.slice(4,8)};
      editorLoadKey=`${latest.retakeToken||0}:${latest.photoRevision||0}:manual`;
      await mutate(state=>{if(state.phase!=='manual')return false;state.phase='editor';state.p2p.status='manual-complete';state.photoRevision=Number(state.photoRevision||0)+1;state.elements=state.elements||[];state.approvals={host:false,guest:false};});
      showToast('Delapan foto cocok. Pratinjau gabungan siap diperiksa.','success');
    } finally { manualCompletionRunning=false; }
  }
  async function verifyManual() {
    if (!hasCompletePhotoSet(manualPhotos,8)) throw new Error('Pilih tepat delapan foto terlebih dahulu.');
    const hashes=manualPhotos.map(photo=>photo.hash);
    await mutate(state=>{state.manualHashes=state.manualHashes||{};state.manualHashes[role]=hashes;});
    await tryCompleteManual();
    const latest=(await get(publicRef)).val();
    if (!(latest?.manualHashes?.host && latest?.manualHashes?.guest)) showToast('Pemeriksaan tersimpan. Menunggu pasangan memilih delapan file yang sama.');
  }
  async function addEditorElement(text, kind = 'text') {
    const clean=String(text||'').trim().slice(0,50);if(!clean)return;
    const id=randomId();selectedElementId=id;
    await mutate(state=>{if(state.phase!=='editor')return false;state.elements=state.elements||[];state.elements.push({id,kind,text:clean,x:.5+(Math.random()-.5)*.16,y:.48+(Math.random()-.5)*.16,scale:1,rotate:0,color:'#a45f82',createdBy:myUid,createdAt:Date.now()});state.approvals={host:false,guest:false};});
  }
  async function updateSelectedElement(action) {
    if (action !== 'delete-element') return;
    if (mode === 'solo') {
      if (!selectedSoloElementId) return;
      soloElements = soloElements.filter(item => item.id !== selectedSoloElementId);
      selectedSoloElementId = null;
      return;
    }
    if (!selectedElementId) return;
    await mutate(state => {
      if (state.phase !== 'editor') return false;
      state.elements = (state.elements || []).filter(item => item.id !== selectedElementId);
      state.approvals = {host:false,guest:false};
    });
    selectedElementId = null;
  }

  async function approveFinal() {
    await mutate(state=>{if(state.phase!=='editor')return false;state.approvals=state.approvals||{host:false,guest:false};state.approvals[role]=!state.approvals[role];if(state.approvals.host&&state.approvals.guest)state.phase='finalized';});
  }
  async function requestFullRetake() {
    let requested=null, restarted=false;
    const result=await mutate(state=>{
      requested=null;restarted=false;
      if(!['editor','finalized'].includes(state.phase))return false;
      state.retakeRequests=state.retakeRequests||{host:false,guest:false};
      state.retakeRequests[role]=!state.retakeRequests[role];
      requested=state.retakeRequests[role];
      if(state.retakeRequests.host&&state.retakeRequests.guest){
        restarted=true;
        state.retakeToken=(state.retakeToken||0)+1;state.phase='capture';state.slotRetake=null;state.retakeSlot=null;state.photosDone={host:false,guest:false};state.ready={host:false,guest:false};state.p2p={attempt:0,status:'idle'};state.manualHashes={};state.retakeRequests={host:false,guest:false};state.elements=[];state.approvals={host:false,guest:false};
      }
    });
    if(!result?.committed)return;
    if(restarted)showToast('Kalian berdua menyetujui pengambilan ulang. Silakan ambil empat foto baru.','success');
    else showToast(requested?'Permintaan mengulang seluruh foto dikirim. Menunggu persetujuan pasangan.':'Permintaan pengambilan ulang dibatalkan.');
  }
  async function downloadCouple(mime) {
    if (!editorData) await ensureEditorData();
    if (!editorData || !editorData.host.every(Boolean) || !editorData.guest.every(Boolean)) throw new Error('Foto belum lengkap pada perangkat ini.');
    const blob=await renderStripBlob([editorData.host,editorData.guest],pState.frameId||'korean',sharedFilter(),sharedAdjustments(),pState.elements||[],true,mime);
    await downloadBlob(blob,`diri-couple-photostrip.${mime==='image/jpeg'?'jpg':'png'}`);
  }
  async function saveCoupleGaleri() {
    if (!editorData) await ensureEditorData();
    if (!editorData || !editorData.host?.every(Boolean) || !editorData.guest?.every(Boolean)) throw new Error('Pratinjau foto belum lengkap pada perangkat ini. Muat ulang halaman lalu coba lagi.');
    const blob=await renderStripBlob([editorData.host,editorData.guest],pState.frameId||'korean',sharedFilter(),sharedAdjustments(),pState.elements||[],true,'image/jpeg');
    const data=await readDataUrl(blob);const items=await getLocalValue('photobooth-gallery')||[];
    items.unshift({id:randomId(),data,date:Date.now()});await setLocalValue('photobooth-gallery',items.slice(0,15));
    showToast('Strip foto berdua disimpan ke Galeri Pribadi perangkat ini.','success');
  }
  async function printCouple() {
    // Open the print window synchronously from the user's click to avoid popup blockers.
    const printWindow=window.open('', '_blank');
    if(!printWindow) throw new Error('Peramban memblokir jendela cetak. Izinkan pop-up atau unduh PNG sebagai gantinya.');
    let url='';
    try {
      if (!editorData) await ensureEditorData();
      if (!editorData || !editorData.host?.every(Boolean) || !editorData.guest?.every(Boolean)) throw new Error('Pratinjau foto belum lengkap pada perangkat ini. Muat ulang halaman lalu coba lagi.');
      const blob=await renderStripBlob([editorData.host,editorData.guest],pState.frameId||'korean',sharedFilter(),sharedAdjustments(),pState.elements||[],true,'image/png');
      url=URL.createObjectURL(blob);
      const doc=printWindow.document;
      doc.open();
      doc.write(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Cetak Photobooth · Diri.</title><style>@page{margin:8mm}html,body{margin:0;padding:0;text-align:center}img{display:block;width:auto;height:auto;max-width:100%;max-height:calc(100vh - 16mm);margin:0 auto;object-fit:contain}@media print{img{max-height:calc(100vh - 16mm)}}</style></head><body><img alt="Hasil Photobooth · Diri." src="${url}"></body></html>`);
      doc.close();
      const image=doc.querySelector('img');
      let printed=false;
      const beginPrint=()=>{
        if(printed)return;
        printed=true;
        printWindow.focus();
        printWindow.addEventListener('afterprint',()=>{try{printWindow.close();}catch{}if(url)URL.revokeObjectURL(url);},{once:true});
        printWindow.print();
        window.setTimeout(()=>{if(url)URL.revokeObjectURL(url);},60000);
      };
      image.addEventListener('load',beginPrint,{once:true});
      image.addEventListener('error',()=>{if(url)URL.revokeObjectURL(url);printWindow.close();showToast('Pratinjau cetak tidak dapat dibuka. Unduh PNG sebagai gantinya.','error');},{once:true});
      if(image.complete && image.naturalWidth) beginPrint();
    } catch(error) {
      if(url)URL.revokeObjectURL(url);
      try{printWindow.close();}catch{}
      throw error;
    }
  }

  // Manipulasi langsung pada pratinjau: seret untuk memindahkan, cubit untuk mengubah ukuran.
  // Koordinat posisi dan skala disimpan dalam nilai ternormalisasi agar konsisten di HP/laptop.
  function clampElementScale(value) {
    const number = Number(value);
    return Math.min(3, Math.max(.35, Number.isFinite(number) ? number : 1));
  }
  function gestureElement(type, id) {
    return type === 'solo'
      ? soloElements.find(item => item.id === id)
      : (pState?.elements || []).find(item => item.id === id);
  }
  function stageBox(stage) {
    const rect = stage.getBoundingClientRect();
    return { left:rect.left + stage.clientLeft, top:rect.top + stage.clientTop, width:stage.clientWidth, height:stage.clientHeight };
  }
  function applyGestureTransform(gesture) {
    if (!gesture?.node) return;
    gesture.node.style.left = `${gesture.x * 100}%`;
    gesture.node.style.top = `${gesture.y * 100}%`;
    gesture.node.style.transform = `translate(-50%,-50%) rotate(${normalizeElementRotation(gesture.rotate)}deg) scale(${clampElementScale(gesture.scale)})`;
  }
  function onPointerDown(event) {
    // Jari kedua pada area foto mengaktifkan gestur gabungan: cubit untuk ukuran,
    // putar dua jari untuk rotasi. Tidak ada pegangan visual yang menutupi foto.
    if (activeGesture && activeGesture.stage.contains(event.target) && !activeGesture.pointers.has(event.pointerId)) {
      activeGesture.pointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
      if (activeGesture.pointers.size >= 2) {
        const points = [...activeGesture.pointers.values()].slice(0,2);
        activeGesture.mode = 'pinch-rotate';
        activeGesture.startDistance = Math.max(1, Math.hypot(points[1].x-points[0].x, points[1].y-points[0].y));
        activeGesture.startScale = clampElementScale(activeGesture.scale);
        activeGesture.startAngle = Math.atan2(points[1].y-points[0].y, points[1].x-points[0].x) * 180 / Math.PI;
        activeGesture.startRotate = normalizeElementRotation(activeGesture.rotate);
        activeGesture.changed = false;
        try { activeGesture.stage.setPointerCapture(event.pointerId); } catch {}
        event.preventDefault();
      }
      return;
    }

    const node = event.target.closest('[data-drag-element]');
    if (!node || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const type = node.dataset.dragElement;
    const stage = node.closest(type === 'solo' ? '#solo-strip' : '.pb-couple-strip');
    if (!stage) return;
    const box = stageBox(stage);
    if (!box.width || !box.height) return;
    const element = gestureElement(type, node.dataset.elementId);
    if (!element) return;
    const startX = clampPosition(Number.parseFloat(node.style.left) / 100);
    const startY = clampPosition(Number.parseFloat(node.style.top) / 100);
    const offsetX = startX * box.width - (event.clientX - box.left);
    const offsetY = startY * box.height - (event.clientY - box.top);
    activeGesture = {
      type, id:node.dataset.elementId, node, stage, mode:'drag',
      pointers:new Map([[event.pointerId, {x:event.clientX,y:event.clientY}]]),
      startX, startY, x:startX, y:startY,
      offsetX, offsetY,
      scale:clampElementScale(element.scale), startScale:clampElementScale(element.scale),
      rotate:normalizeElementRotation(element.rotate), startRotate:normalizeElementRotation(element.rotate),
      startDistance:1, startAngle:0, changed:false, ended:false
    };
    if (type === 'solo') selectedSoloElementId = activeGesture.id;
    else selectedElementId = activeGesture.id;
    node.classList.add('dragging');
    try { node.setPointerCapture(event.pointerId); } catch {}
    event.preventDefault();
  }
  function onPointerMove(event) {
    const gesture = activeGesture;
    if (!gesture || !gesture.pointers.has(event.pointerId) || gesture.ended) return;
    gesture.pointers.set(event.pointerId, {x:event.clientX,y:event.clientY});

    if (gesture.mode === 'pinch-rotate') {
      if (gesture.pointers.size < 2) return;
      const points = [...gesture.pointers.values()].slice(0,2);
      const distance = Math.max(1, Math.hypot(points[1].x-points[0].x, points[1].y-points[0].y));
      const angle = Math.atan2(points[1].y-points[0].y, points[1].x-points[0].x) * 180 / Math.PI;
      const angleDelta = signedAngleDelta(angle, gesture.startAngle);
      gesture.scale = clampElementScale(gesture.startScale * distance / gesture.startDistance);
      gesture.rotate = normalizeElementRotation(gesture.startRotate + angleDelta);
      if (Math.abs(gesture.scale-gesture.startScale) > .008 || Math.abs(angleDelta) > .5) gesture.changed = true;
      const element = gestureElement(gesture.type, gesture.id);
      if (element) { element.scale = gesture.scale; element.rotate = gesture.rotate; }
      applyGestureTransform(gesture);
      event.preventDefault();
      return;
    }

    const pointer = gesture.pointers.get(event.pointerId);
    const box = stageBox(gesture.stage);
    if (!box.width || !box.height) return;
    const x = clampPosition((pointer.x - box.left + gesture.offsetX) / box.width);
    const y = clampPosition((pointer.y - box.top + gesture.offsetY) / box.height);
    if (Math.abs(x-gesture.startX)+Math.abs(y-gesture.startY) > .003) gesture.changed = true;
    gesture.x = x; gesture.y = y;
    const element = gestureElement(gesture.type, gesture.id);
    if (element) { element.x = x; element.y = y; }
    applyGestureTransform(gesture);
    event.preventDefault();
  }
  async function onPointerUp(event) {
    const gesture = activeGesture;
    if (!gesture || !gesture.pointers.has(event.pointerId)) return;
    gesture.pointers.delete(event.pointerId);
    // Setelah salah satu jari dari gestur dua jari dilepas, tunggu sampai semua jari terangkat.
    if (gesture.mode === 'pinch-rotate' && gesture.pointers.size > 0) {
      gesture.ended = true;
      return;
    }
    if (gesture.pointers.size > 0) return;
    activeGesture = null;
    gesture.node.classList.remove('dragging');
    if (!gesture.changed) {
      if (gesture.type === 'solo') renderSolo();
      else renderCouple();
      return;
    }
    if (gesture.type === 'solo') {
      renderSolo();
      return;
    }
    try {
      await mutate(state => {
        if (state.phase !== 'editor') return false;
        const element = (state.elements || []).find(item => item.id === gesture.id);
        if (!element) return false;
        element.x = gesture.x;
        element.y = gesture.y;
        element.scale = clampElementScale(gesture.scale);
        element.rotate = normalizeElementRotation(gesture.rotate);
        state.approvals = {host:false,guest:false};
      });
    } catch (error) { showToast(`Perubahan hiasan tidak tersimpan: ${error.message}`, 'error'); }
  }
  function onElementWheel(event) {
    const node = event.target.closest('[data-drag-element]');
    if (!node) return;
    event.preventDefault();
    const type = node.dataset.dragElement;
    const id = node.dataset.elementId;
    const element = gestureElement(type, id);
    if (!element) return;
    if (type === 'solo') selectedSoloElementId = id;
    else selectedElementId = id;
    root.querySelectorAll('[data-drag-element].selected').forEach(item => { if (item !== node) item.classList.remove('selected'); });
    const scale = clampElementScale(Number(element.scale || 1) * (event.deltaY < 0 ? 1.08 : .92));
    element.scale = scale;
    node.classList.add('selected');
    node.style.transform = `translate(-50%,-50%) rotate(${normalizeElementRotation(element.rotate)}deg) scale(${scale})`;
    if (type === 'solo') return;
    pendingWheelScale = {id, scale};
    if (wheelSaveTimer) clearTimeout(wheelSaveTimer);
    wheelSaveTimer = setTimeout(async () => {
      const pending = pendingWheelScale; pendingWheelScale = null; wheelSaveTimer = null;
      if (!pending || destroyed) return;
      try {
        await mutate(state => {
          if (state.phase !== 'editor') return false;
          const target = (state.elements || []).find(item => item.id === pending.id);
          if (!target) return false;
          target.scale = clampElementScale(pending.scale);
          state.approvals = {host:false,guest:false};
        });
      } catch (error) { showToast(`Ukuran hiasan tidak tersimpan: ${error.message}`, 'error'); }
    }, 220);
  }

  // ----------------------------- Event handling ------------------------------
  async function onClick(event) {
    const button=event.target.closest('[data-pb]');if(!button||button.disabled)return;
    const action=button.dataset.pb;event.preventDefault();
    try {
      if(action==='back'){stopCamera();await onBack();return;}
      if(action==='solo'){stopCamera();renderSolo();return;}
      if(action==='couple'){mode='couple';renderCouple();if(['editor','finalized'].includes(pState?.phase))void ensureEditorData();return;}
      if(action==='camera'){await openKamera();return;}
      if(action==='capture'){await captureFromKamera('solo',nextPhotoSlot(soloPhotos));return;}
      if(action==='capture-couple'){await captureFromKamera('couple',nextPhotoSlot(localPhotos));return;}
      if(action==='solo-start-capture'){soloPhase=hasCompletePhotoSet(soloPhotos,4)?'editor':'capture';renderSolo();return;}
      if(action==='solo-change-frame'){stopCamera();soloPhase='frame';renderSolo();return;}
      if(action==='solo-reset'){stopCamera();soloPhotos=[];soloElements=[];selectedSoloElementId=null;soloPhase='capture';renderSolo();return;}
      if(action==='solo-retake-slot'){const index=Number(button.dataset.index);if(index>=0&&index<4){soloPhotos[index]=null;soloPhase='capture';renderSolo();}return;}
      if(action==='solo-retake-all'){soloPhase='capture';renderSolo();return;}
      if(action==='solo-continue'){if(!hasCompletePhotoSet(soloPhotos,4))throw new Error('Ambil empat foto terlebih dahulu.');stopCamera();soloPhase='editor';renderSolo();return;}
      if(action==='couple-retake-slot'){const index=Number(button.dataset.index);if(index>=0&&index<4&&pState?.photosDone?.[role]!==true){localPhotos[index]=null;await deleteLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,role,index));renderCouple();}return;}
      if(action==='solo-sticker'){const id=randomId();soloElements.push({id,kind:'sticker',text:button.dataset.sticker||STICKERS[Math.floor(Math.random()*STICKERS.length)],x:.5,y:.5,scale:1,rotate:0,color:'#a45f82'});selectedSoloElementId=id;renderSolo();return;}
      if(action==='solo-frame'){soloFrame=button.dataset.frame;renderSolo();return;}
      if(action==='solo-filter'){soloFilter=button.dataset.filter;renderSolo();return;}
      if(action==='select-solo-element'){selectedSoloElementId=button.dataset.elementId;renderSolo();return;}
      if(action==='solo-png'){const blob=await renderStripBlob(soloPhotos,soloFrame,soloFilter,soloAdjust,soloElements,false,'image/png');await downloadBlob(blob,'diri-playroom-date-solo-photostrip.png');return;}
      if(action==='solo-jpeg'){const blob=await renderStripBlob(soloPhotos,soloFrame,soloFilter,soloAdjust,soloElements,false,'image/jpeg');await downloadBlob(blob,'diri-playroom-date-solo-photostrip.jpg');return;}
      if(action==='solo-save'){await saveSoloGaleri();return;}
      if(action==='gallery-delete'){const items=await getLocalValue('photobooth-gallery')||[];items.splice(Number(button.dataset.index),1);await setLocalValue('photobooth-gallery',items);void renderGallery();return;}
      if(action==='couple-frame'){await mutate(state=>{if(state.phase!=='setup')return false;state.frameId=button.dataset.frame;state.ready={host:false,guest:false};});return;}
      if(action==='couple-filter'){
        await mutate(state=>{if(!['setup','editor'].includes(state.phase))return false;state.filter=state.filter||{};state.filter.preset=button.dataset.filter;if(state.phase==='setup')state.ready={host:false,guest:false};else state.approvals={host:false,guest:false};});return;
      }
      if(action==='couple-ready'){await beginCaptureReady();return;}
      if(action==='couple-photos-ready'){await confirmPhotosReady();return;}
      if(action==='verify-manual'){await verifyManual();return;}
      if(action==='retry-relay'){relayErrorText='';await mutate(state=>{if(state.phase==='relay')state.p2p={...(state.p2p||{}),status:'relay',method:'firebase',transferId:state.p2p?.transferId||randomId(),updatedAt:Date.now()};});void startFirebaseRelay();return;}
      if(action==='solo-fallback'){await mutate(state=>{state.phase='aborted';});disposePeer();mode='solo';renderSolo();showToast('Sesi berdua dihentikan. Kamu dapat melanjutkan Fotobooth Sendiri.');return;}
      if(action==='abort-couple'){await mutate(state=>{state.phase='aborted';});await cleanupRelayRole().catch(()=>{});disposePeer();return;}
      if(action==='select-element'){selectedElementId=button.dataset.elementId;renderCouple();return;}
      if(action==='delete-element'||action==='delete-selected-element'){await updateSelectedElement('delete-element');if(mode==='solo')renderSolo();else renderCouple();return;}
      if(action==='add-sticker'){const sticker=button.dataset.sticker||STICKERS[Math.floor(Math.random()*STICKERS.length)];await addEditorElement(sticker,'sticker');return;}
      if(action==='final-approve'){await approveFinal();return;}
      if(action==='request-slot-retake'){await requestSlotRetake(Number(button.dataset.index));return;}
      if(action==='approve-slot-retake'){await approveSlotRetake();return;}
      if(action==='cancel-slot-retake'){await mutate(state=>{if(state.slotRetake?.role!==role)return false;state.slotRetake=null;});return;}
      if(action==='retake-all'){await requestFullRetake();return;}
      if(action==='couple-png'){if(pState.phase!=='finalized')throw new Error('Kedua pemain harus menyetujui hasil akhir terlebih dahulu.');await downloadCouple('image/png');return;}
      if(action==='couple-jpeg'){if(pState.phase!=='finalized')throw new Error('Kedua pemain harus menyetujui hasil akhir terlebih dahulu.');await downloadCouple('image/jpeg');return;}
      if(action==='couple-print'){if(pState.phase!=='finalized')throw new Error('Kedua pemain harus menyetujui hasil akhir terlebih dahulu.');await printCouple();return;}
      if(action==='save-couple-gallery'){if(pState.phase!=='finalized')throw new Error('Hasil belum disetujui kedua pemain.');await saveCoupleGaleri();return;}
    } catch(error) { showToast(error.message,'error'); }
  }
  async function onChange(event) {
    const element=event.target;
    try {
      if(element.matches('[data-pb-manual]')) {
        const files=[...element.files].filter(file=>file.type.startsWith('image/')).slice(0,8);if(files.length!==8)throw new Error('Pemindahan Manual membutuhkan tepat delapan foto.');
        manualPhotos=await processImages(files,8);if(manualPhotos.length!==8)throw new Error('Pastikan kedelapan file merupakan gambar yang valid.');
        // Hash original file bytes, not re-encoded canvas JPEG bytes: different browsers can encode the same image differently.
        const sourceHashes=await Promise.all(files.map(file=>hashBlob(file)));
        for(let index=0;index<8;index++){manualPhotos[index].hash=sourceHashes[index];await putLocalMedia('photobooth',`${session.sessionId}:manual:${pState.retakeToken||0}:${index}`,manualPhotos[index].blob);}
        await setLocalValue(`photobooth-manual-hashes:${session.sessionId}:${pState.retakeToken||0}`,sourceHashes);
        await mutate(state=>{state.manualHashes=state.manualHashes||{};state.manualHashes[role]=null;});
        renderCouple();
      }
      if(element.matches('[data-element-rotation]')) {
        const type=element.dataset.elementRotation;const angle=Number(element.value);
        if(type==='solo') { const target=soloElements.find(item=>item.id===selectedSoloElementId);if(target)target.rotate=angle;renderSolo(); }
        else { await mutate(state=>{if(state.phase!=='editor')return false;const target=(state.elements||[]).find(item=>item.id===selectedElementId);if(!target)return false;target.rotate=angle;state.approvals={host:false,guest:false};}); }
      }
      if(element.matches('[data-adjust]')) {
        const [prefix,key]=element.dataset.adjust.split('-');
        if(prefix==='solo'){soloAdjust[key]=Number(element.value);const strip=root.querySelector('#solo-strip');if(strip)strip.innerHTML=renderSoloPreview();}
        else if(prefix==='couple'){await mutate(state=>{if(!['setup','editor'].includes(state.phase))return false;state.filter=state.filter||{};state.filter[key]=Number(element.value);if(state.phase==='setup')state.ready={host:false,guest:false};else state.approvals={host:false,guest:false};});}
      }
    } catch(error) { showToast(error.message,'error'); }
  }
  async function onSubmit(event) {
    const form=event.target.closest('[data-pb-form]');if(!form)return;event.preventDefault();
    try {
      const text=form.elements.text.value;
      if(form.dataset.pbForm==='solo-text'){const clean=String(text||'').trim().slice(0,50);if(clean){const id=randomId();soloElements.push({id,kind:'text',text:clean,x:.5,y:.5,scale:1,rotate:0,color:'#a45f82'});selectedSoloElementId=id;renderSolo();}}
      if(form.dataset.pbForm==='couple-text'){await addEditorElement(text);}
    } catch(error) { showToast(error.message,'error'); }
  }
  root.addEventListener('click',onClick);
  root.addEventListener('change',onChange);
  root.addEventListener('input',event=>{const slider=event.target.closest('[data-element-rotation]');if(slider){const label=root.querySelector('[data-rotation-label]');if(label)label.textContent=`${Math.round(Number(slider.value))}°`;}});
  root.addEventListener('submit',onSubmit);
  root.addEventListener('pointerdown',onPointerDown);
  root.addEventListener('pointermove',onPointerMove);
  root.addEventListener('pointerup',onPointerUp);
  root.addEventListener('pointercancel',onPointerUp);
  root.addEventListener('wheel',onElementWheel,{passive:false});
  void init();
  return { destroy:cleanup };
}
