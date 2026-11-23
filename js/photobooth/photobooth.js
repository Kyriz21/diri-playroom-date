import { putLocalMedia, getLocalMedia, deleteLocalMedia, setLocalValue, getLocalValue, cleanupExpiredMedia } from '../services/local-store.js';
import { nextPhotoSlot, hasCompletePhotoSet } from '../games/logic.js';
import { FRAMES, frameById, clampPosition, drawFrameBackground, drawPhotoSlotBorder } from './frame-art.js';

// Firebase is loaded only for a shared session. Standalone Photobooth stays local and
// can be used even before a Firebase project is configured.
let db, ref, get, set, update, remove, onValue, runTransaction, serverTimestamp;

const FILTERS = ['Asli','Merah Muda','Film Hangat','Vintage','Hitam Putih','Lavender','Cerah','Nuansa Dingin'];
const STICKERS = ['♡','✿','☾','☆','🌷','🦋','🎀','✨','💌','🌼'];
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
  let rtc = null;
  let channel = null;
  let destroyed = false;
  let p2pAttemptSeen = 0;
  let p2pStarted = false;
  let p2pTimer = null;
  let candidateUnsubscribe = null;
  let lastSeenRetakeToken = null;
  let sendStarted = false;
  let localSent = false;
  let remoteDone = false;
  let incomingFile = null;
  let localPhotos = [];
  let remotePhotos = [];
  let manualPhotos = [];
  let editorData = null;
  let editorLoadKey = '';
  let selectedElementId = null;
  let selectedSoloElementId = null;
  let activeDrag = null;
  let soloPhotos = [];
  let soloElements = [];
  let soloFrame = 'korean';
  let soloFilter = 'Asli';
  let soloAdjust = { brightness:100, contrast:100, saturation:100, temperature:0 };
  let lastTouch = 0;
  let restoringCapture = false;
  let manualCompletionRunning = false;
  let appliedSlotRetakeKey = '';

  function showToast(message, type = 'default') { toast(message, type); }
  function stopCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    const video = root.querySelector('#pb-video');
    if (video) video.srcObject = null;
  }
  function disposePeer() {
    if (p2pTimer) clearTimeout(p2pTimer);
    p2pTimer = null;
    if (candidateUnsubscribe) { try { candidateUnsubscribe(); } catch {} }
    candidateUnsubscribe = null;
    if (rtc) { try { rtc.close(); } catch {} }
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
          if (pState.phase === 'manual') { void restoreCaptureMedia(); void restoreManualFotos().then(()=>tryCompleteManual()); void tryCompleteManual(); }
          if (pState.phase === 'editor' || pState.phase === 'finalized') void ensureEditorData();
          renderCouple();
          if (role === 'guest' && pState.phase === 'capture' && pState.p2p?.status === 'connecting' && pState.p2p.attempt > p2pAttemptSeen) {
            p2pAttemptSeen = pState.p2p.attempt;
            void connectPeer('guest', p2pAttemptSeen);
          }
          if (role === 'host' && pState.phase === 'capture' && pState.photosDone?.host && pState.photosDone?.guest && pState.p2p?.status === 'idle' && !p2pStarted) {
            p2pStarted = true;
            void beginP2P();
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
    root.innerHTML = `<div class="photo-app">${gameTop('Photobooth ♡','Abadikan momen bersama meski berjauhan.')}<section class="panel photo-mode-panel"><h2>Pilih mode Fotobooth</h2><p>Ambil foto sendiri atau buat satu strip foto bersama pasangan.</p><div class="photo-mode-grid"><button class="photo-mode-card" data-pb="solo"><span>♡</span><strong>Fotobooth Sendiri</strong><small>Empat foto, 16 desain bingkai tematik, filter, dan galeri pribadi di perangkat ini.</small></button><button class="photo-mode-card" data-pb="couple"><span>✿</span><strong>Fotobooth Berdua</strong><small>Empat foto per orang, pengaturan bersama, pratinjau gabungan, dan persetujuan akhir.</small></button></div><p class="small-note">Foto tidak diunggah ke Firebase. Transfer langsung antarpiranti dicoba terlebih dahulu; jika jaringan tidak mendukungnya, tersedia pemindahan manual dengan pemeriksaan file.</p></section></div>`;
  }
  function frameCatalog(active, attribute = 'solo-frame') {
    const miniCopy = {
      newspaper:['KABAR KITA','EDISI KHUSUS','BERITA UTAMA'], wanted:['DICARI','HADIAH BESAR','MENCURI HATI'],
      comic:['POW!','KISAH KITA','DUA TOKOH'], cinema:['OUR MOVIE','STARRING US','TAKE 01'], korean:['FOUR CUTS','오늘도 우리','♡ together'],
      film:['ANALOG 1990','36 EXP · ISO 400','MEMORY FILM'], polaroid:['little moments','photo diary','♡'], postcard:['SALAM DARI KITA','POST CARD','WISH YOU HERE'],
      botanical:['BLOOMING','GROW TOGETHER','little garden'], kawaii:['CUTE LITTLE US','kawaii day','ʕ•ᴥ•ʔ'], magazine:['TOGETHER','THE COUPLE ISSUE','COVER STORY'],
      y2k:['★ US 4EVER ★','DIGITAL LOVE','2000s ENERGY'], arcade:['PLAYER 1 + 2','LOVE LEVEL','MAX SCORE'], loveletter:['UNTUKMU,','a little letter','dengan sayang'],
      birthday:['HARI SPESIAL','MAKE A WISH','PARTY TIME'], doodle:['OUR DOODLES','HAPPY SCRIBBLES','tiny memories']
    };
    return `<div class="pb-frame-catalog">${FRAMES.map(([id, name]) => {
      const [top, sub, foot] = miniCopy[id] || ['Diri.', 'Momen kita', '♡'];
      return `<button type="button" class="pb-frame-card ${active===id?'active':''}" data-pb="${attribute}" data-frame="${id}" aria-pressed="${active===id}"><span class="pb-frame-mini ${id}"><span class="pb-mini-masthead">${esc(top)}</span><span class="pb-mini-sub">${esc(sub)}</span><span class="pb-mini-photos"><i>01</i><i>02</i><i>03</i><i>04</i></span><span class="pb-mini-footer">${esc(foot)}</span><span class="pb-mini-mark" aria-hidden="true">${id==='wanted'?'★':id==='newspaper'?'✦':id==='comic'?'!':id==='cinema'?'▶':id==='kawaii'?'♡':id==='film'?'▣':id==='postcard'?'✉':id==='botanical'?'❀':id==='arcade'?'✧':id==='birthday'?'✷':'✦'}</span></span><strong>${name}</strong>${active===id?'<small>Terpilih</small>':'<small>Lihat contoh</small>'}</button>`;
    }).join('')}</div>`;
  }
  function renderFilterControls(filter, values, prefix = 'solo') {
    return `<div class="filter-chip-grid">${FILTERS.map(item => `<button type="button" class="filter-chip ${filter===item?'active':''}" data-pb="${prefix}-filter" data-filter="${item}">${item}</button>`).join('')}</div><div class="adjust-grid"><label>Kecerahan <input type="range" min="60" max="140" value="${values.brightness}" data-adjust="${prefix}-brightness"></label><label>Kontras <input type="range" min="60" max="140" value="${values.contrast}" data-adjust="${prefix}-contrast"></label><label>Warna <input type="range" min="0" max="180" value="${values.saturation}" data-adjust="${prefix}-saturation"></label><label>Temperatur <input type="range" min="-60" max="60" value="${values.temperature}" data-adjust="${prefix}-temperature"></label></div>`;
  }

  // ----------------------------- Fotobooth Sendiri -----------------------------
  function renderSoloPreview() {
    const selected = frameById(soloFrame);
    const cssFilter = imageFilter(soloFilter, soloAdjust);
    const elements = soloElements.map((element,index) => `<button type="button" class="pb-deco ${selectedSoloElementId===element.id?'selected':''}" style="left:${clampPosition(element.x)*100}%;top:${clampPosition(element.y)*100}%;transform:translate(-50%,-50%) scale(${Number(element.scale||1)})" data-pb="select-solo-element" data-element-id="${esc(element.id)}" data-drag-element="solo">${esc(element.text)}</button>`).join('');
    const photoCards = [0,1,2,3].map(index => soloPhotos[index]
      ? `<div class="pb-solo-photo"><img src="${soloPhotos[index]}" style="filter:${cssFilter}" alt="Foto ${index+1}"><small>SHOT ${String(index+1).padStart(2,'0')}</small></div>`
      : `<div class="pb-solo-photo empty"><span>FOTO ${String(index+1).padStart(2,'0')}</span></div>`).join('');
    return `<div class="pb-strip-header"><span>${esc(selected[1])}</span><b>Diri. ♡</b></div><div class="pb-solo-photos">${photoCards}</div><div class="pb-strip-footer"><span>momen kecil kita</span><b>♡</b></div>${elements}`;
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
  function attachCameraToCurrentVideo() {
    const video = root.querySelector('#pb-video');
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
      root.querySelector('#pb-camera-placeholder')?.classList.add('hidden');
    }
  }
  function renderSolo() {
    mode = 'solo';
    root.innerHTML = `<div class="photo-app">${gameTop('Fotobooth Sendiri','Empat jepretan menjadi satu kenangan.','SESI PRIBADI · TERSIMPAN DI PERANGKAT')}<div class="photo-layout"><section class="panel photo-camera-card"><div class="camera-stage"><video id="pb-video" autoplay muted playsinline></video><div id="pb-camera-placeholder" class="camera-placeholder"><span>♡</span><b>Siap mengabadikan momen?</b><small>Buka kamera atau pilih empat foto dari galeri.</small><strong id="pb-countdown"></strong></div></div><div class="photo-controls"><button class="button button-secondary" data-pb="camera">Buka kamera</button><button class="button button-primary" data-pb="capture" ${stream && nextPhotoSlot(soloPhotos)>=0?'':'disabled'}>Ambil foto</button><label class="button button-quiet" for="pb-solo-files">Pilih empat foto</label><input id="pb-solo-files" type="file" accept="image/*" multiple hidden></div><div class="photo-slot-grid">${[0,1,2,3].map(index=>`<div class="photo-slot">${soloPhotos[index]?`<img src="${soloPhotos[index]}" alt="Foto ${index+1}"><button type="button" class="pb-slot-retake" data-pb="solo-retake-slot" data-index="${index}">Ulangi</button>`:`<span>${index+1}</span>`}<small>${index+1}</small></div>`).join('')}</div><p class="small-note">${soloPhotos.filter(Boolean).length}/4 foto siap. File tersimpan di peramban ini.</p></section><section class="panel photo-editor-card"><h2>Pilih bingkai</h2>${frameCatalog(soloFrame)}<h2>Tampilan foto</h2>${renderFilterControls(soloFilter,soloAdjust)}<div class="photo-controls"><button class="button button-secondary" data-pb="solo-sticker">Tambah stiker</button><form data-pb-form="solo-text"><input name="text" maxlength="50" placeholder="Tulis keterangan"><button class="button button-quiet" type="submit">Tambah teks</button></form></div><p class="small-note">Pilih teks atau stiker, lalu seret langsung pada pratinjau. Tombol panah tetap tersedia untuk penyesuaian kecil.</p><div class="element-tools"><button class="button button-small" data-pb="move-left" ${selectedSoloElementId?'':'disabled'}>←</button><button class="button button-small" data-pb="move-right" ${selectedSoloElementId?'':'disabled'}>→</button><button class="button button-small" data-pb="move-up" ${selectedSoloElementId?'':'disabled'}>↑</button><button class="button button-small" data-pb="move-down" ${selectedSoloElementId?'':'disabled'}>↓</button><button class="button button-small" data-pb="size-up" ${selectedSoloElementId?'':'disabled'}>A+</button><button class="button button-small" data-pb="size-down" ${selectedSoloElementId?'':'disabled'}>A−</button><button class="button button-small button-quiet" data-pb="delete-element" ${selectedSoloElementId?'':'disabled'}>Hapus pilihan</button></div><div class="photo-controls"><button class="button button-primary" data-pb="solo-png" ${hasCompletePhotoSet(soloPhotos,4)?'':'disabled'}>Unduh PNG</button><button class="button button-secondary" data-pb="solo-jpeg" ${hasCompletePhotoSet(soloPhotos,4)?'':'disabled'}>Unduh JPEG</button><button class="button button-quiet" data-pb="solo-save" ${hasCompletePhotoSet(soloPhotos,4)?'':'disabled'}>Simpan ke Galeri Pribadi</button><button class="button button-quiet" data-pb="solo-reset">Ulangi semua foto</button></div><div class="pb-strip ${soloFrame}" id="solo-strip">${renderSoloPreview()}</div></section></div><section class="panel private-gallery-panel"><h3>Galeri Pribadi · Perangkat ini</h3><p class="small-note">Galeri tersimpan di peramban/perangkat ini dan tidak dibagikan otomatis ke pasangan.</p><div id="pb-gallery-list">Memuat galeri…</div></section></div>`;
    attachCameraToCurrentVideo();
    void renderGallery();
  }
  async function openKamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Peramban tidak mendukung akses kamera. Silakan pilih foto dari galeri.');
    stopCamera();
    stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user'}, audio:false });
    const video = root.querySelector('#pb-video');
    if (!video) return;
    video.srcObject = stream;
    await video.play();
    const startedAt=Date.now();
    while(!video.videoWidth && Date.now()-startedAt<4000) await wait(100);
    if(!video.videoWidth || !video.videoHeight) throw new Error('Kamera aktif, tetapi ukuran video belum tersedia. Periksa izin kamera lalu coba lagi.');
    const placeholder = root.querySelector('#pb-camera-placeholder');
    if (placeholder) placeholder.classList.add('hidden');
    const capture = root.querySelector('[data-pb="capture"]');
    if (capture) capture.disabled = nextPhotoSlot(soloPhotos) < 0;
    const coupleCapture = root.querySelector('[data-pb="capture-couple"]');
    if (coupleCapture) coupleCapture.disabled = nextPhotoSlot(localPhotos) < 0;
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
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1600, video.videoWidth);
    canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width,0); ctx.scale(-1,1); ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/jpeg',0.88));
    if (!blob) throw new Error('Foto tidak berhasil dibuat.');
    const data = await readDataUrl(blob);
    const nextIndex = Number.isInteger(index) && index >= 0 ? index : (targetMode === 'solo' ? nextPhotoSlot(soloPhotos) : nextPhotoSlot(localPhotos));
    if (nextIndex < 0 || nextIndex >= 4) throw new Error('Keempat slot foto sudah terisi. Pilih foto yang ingin diulangi.');
    if (targetMode === 'solo') {
      soloPhotos[nextIndex] = data;
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
    const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function renderStripBlob(photos, frameId, filter, values, elements, couple=false, mime='image/png') {
    const selected = frameById(frameId);
    const canvas = document.createElement('canvas');
    canvas.width = couple ? 1400 : 1000;
    canvas.height = couple ? 2600 : 2800;
    const ctx = canvas.getContext('2d');
    drawFrameBackground(ctx, selected, canvas.width, canvas.height, couple);
    const css = imageFilter(filter, values);
    const header = couple ? 205 : 190;
    const footer = couple ? 145 : 130;
    const marginX = couple ? 72 : 76;
    const gapY = couple ? 22 : 22;
    const slotH = (canvas.height - header - footer - gapY * 3) / 4;
    const gapX = couple ? 24 : 0;
    const slotW = couple ? (canvas.width - marginX * 2 - gapX) / 2 : canvas.width - marginX * 2;
    const drawCover = (image, x, y, width, height) => {
      const scale = Math.max(width / image.width, height / image.height);
      const cropW = width / scale, cropH = height / scale;
      const sourceX = (image.width - cropW) / 2, sourceY = (image.height - cropH) / 2;
      ctx.drawImage(image, sourceX, sourceY, cropW, cropH, x, y, width, height);
    };
    if (couple) {
      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 2; column++) {
          const photo = photos[column]?.[row];
          if (!photo?.url) continue;
          const image = await loadImage(photo.url);
          const x = marginX + column * (slotW + gapX);
          const y = header + row * (slotH + gapY);
          ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y - 10, slotW + 20, slotH + 20);
          ctx.beginPath(); ctx.rect(x, y, slotW, slotH); ctx.clip(); ctx.filter = css; drawCover(image, x, y, slotW, slotH); ctx.restore();
          drawPhotoSlotBorder(ctx, selected, x, y, slotW, slotH, row + column * 4);
        }
      }
    } else {
      for (let index = 0; index < 4; index++) {
        const source = photos[index];
        if (!source) continue;
        const image = await loadImage(source);
        const x = marginX, y = header + index * (slotH + gapY);
        ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 10, y - 10, slotW + 20, slotH + 20);
        ctx.beginPath(); ctx.rect(x, y, slotW, slotH); ctx.clip(); ctx.filter = css; drawCover(image, x, y, slotW, slotH); ctx.restore();
        drawPhotoSlotBorder(ctx, selected, x, y, slotW, slotH, index);
      }
    }
    // Decorations use normalized coordinates in both the preview and exported image.
    (elements || []).forEach(element => {
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const fontSize = canvas.width * 0.062 * Math.max(0.5, Math.min(2, Number(element.scale || 1)));
      ctx.font = `700 ${fontSize}px Georgia`;
      const text = String(element.text || '');
      const textWidth = Math.min(canvas.width * 0.78, ctx.measureText(text).width);
      const padX = canvas.width * 0.025, padY = canvas.width * 0.014;
      const x = canvas.width * clampPosition(element.x), y = canvas.height * clampPosition(element.y);
      const boxWidth = textWidth + padX * 2, boxHeight = fontSize * 1.2 + padY * 2;
      ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.strokeStyle = 'rgba(95,70,95,.28)'; ctx.lineWidth = Math.max(1, canvas.width * .001);
      ctx.shadowColor = 'rgba(30,20,30,.12)'; ctx.shadowBlur = canvas.width * .008;
      ctx.beginPath(); ctx.roundRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight, canvas.width * .022); ctx.fill(); ctx.stroke();
      ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = canvas.width * .005;
      ctx.fillStyle = element.color || selected[3]; ctx.fillText(text, x, y, canvas.width * .78); ctx.restore();
    });
    const type = mime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return await new Promise(resolve => canvas.toBlob(resolve, type, 0.92));
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
    return `${gameTop('Ambil empat foto','Foto yang kamu ambil akan dipratinjau sebelum digabung dengan foto pasangan.','JEPRETAN MASING-MASING · HASIL BERSAMA')}<div class="photo-layout"><section class="panel photo-camera-card"><div class="camera-stage"><video id="pb-video" autoplay muted playsinline></video><div id="pb-camera-placeholder" class="camera-placeholder"><span>♡</span><b>Empat momen untuk strip bersama</b><small>Gunakan kamera atau pilih empat foto dari galeri.</small><strong id="pb-countdown"></strong></div></div><div class="photo-controls"><button class="button button-secondary" data-pb="camera">Buka kamera</button><button class="button button-primary" data-pb="capture-couple" ${!done[role] && stream && nextPhotoSlot(localPhotos)>=0?'':'disabled'}>Ambil foto berikutnya</button><label class="button button-quiet ${done[role]?'disabled':''}" for="pb-couple-files">Pilih empat foto</label><input id="pb-couple-files" type="file" accept="image/*" multiple hidden ${done[role]?'disabled':''}></div><div class="photo-slot-grid">${[0,1,2,3].map(index=>`<div class="photo-slot">${localPhotos[index]?`<img src="${localPhotos[index].url}" alt="Foto ${index+1}"><button type="button" class="pb-slot-retake" data-pb="couple-retake-slot" data-index="${index}" ${done[role]?'disabled':''}>Ulangi</button>`:`<span>${index+1}</span>`}<small>${index+1}</small></div>`).join('')}</div><p class="small-note">${localPhotos.filter(Boolean).length}/4 foto siap di perangkat ini. Bingkai bersama: ${esc(selectedFrame[1])}.</p><div class="pb-own-preview"><strong>Pratinjau empat foto milikmu</strong><div class="pb-mini-strip">${[0,1,2,3].map(index=>localPhotos[index]?`<img src="${localPhotos[index].url}" alt="Pratinjau foto ${index+1}" style="filter:${imageFilter(sharedFilter(),sharedAdjustments())}">`:'<span>Foto belum ada</span>').join('')}</div></div><button class="button button-primary" data-pb="couple-photos-ready" ${ready?'':'disabled'}>${done[role]?'Batalkan konfirmasi foto':'Konfirmasi empat foto'}</button><p class="small-note">Status pasangan — Pembuat ruang: ${done.host?'4 foto siap':'sedang menyiapkan'} · Tamu: ${done.guest?'4 foto siap':'sedang menyiapkan'}.</p>${pState?.retakeSlot?.role===role?`<p class="room-alert">Ambil ulang foto nomor ${Number(pState.retakeSlot.index)+1}. Tiga foto lainnya tetap digunakan.</p>`:''}</section></div>`;
  }
  function renderManualTransfer() {
    const hashes=pState?.manualHashes||{};
    const mismatch=hashes.host&&hashes.guest&&JSON.stringify(hashes.host)!==JSON.stringify(hashes.guest);
    return `${gameTop('Pemindahan foto manual','Koneksi langsung tidak berhasil setelah satu percobaan ulang.','ALTERNATIF TANPA UNGGAH FOTO')}<section class="panel photo-editor-card"><div class="room-alert">Foto tidak diunggah ke server. Kirim delapan file melalui aplikasi lain. Kedua perangkat harus memilih file yang identik dengan urutan: Pembuat ruang 1–4, lalu Tamu 1–4.</div><label class="button button-secondary file-button">Pilih delapan foto yang sama<input type="file" accept="image/*" multiple data-pb-manual hidden></label><p class="small-note">Dipilih: ${manualPhotos.filter(Boolean).length}/8. Pembuat ruang: ${hashes.host?'sudah diperiksa':'menunggu'} · Tamu: ${hashes.guest?'sudah diperiksa':'menunggu'}.</p>${mismatch?'<p class="room-alert">Urutan atau file yang dipilih tidak sama. Pilih ulang delapan file yang persis sama pada kedua perangkat.</p>':''}<div class="pb-manual-preview">${manualPhotos.map((photo,index)=>photo?`<figure><img src="${photo.url}" alt="Foto ${index+1}"><figcaption>${index<4?'Pembuat ruang':'Tamu'} ${index%4+1}</figcaption></figure>`:'').join('')}</div><div class="photo-controls"><button class="button button-primary" data-pb="verify-manual" ${hasCompletePhotoSet(manualPhotos,8)?'':'disabled'}>Periksa kecocokan foto</button><button class="button button-quiet" data-pb="solo-fallback">Lanjutkan sendiri</button><button class="button button-quiet" data-pb="abort-couple">Batalkan sesi</button></div></section>`;
  }
  function renderSharedStrip() {
    if(!editorData) return '<div class="photo-editor-card"><p>Memulihkan foto lokal untuk editor bersama…</p></div>';
    const selected = frameById(pState.frameId || 'korean');
    const css = imageFilter(sharedFilter(), sharedAdjustments());
    const rows = [0,1,2,3].map(index => `<div class="pb-couple-row"><img src="${editorData.host[index]?.url || ''}" alt="Foto Pembuat ruang ${index+1}" style="filter:${css}"><img src="${editorData.guest[index]?.url || ''}" alt="Foto Tamu ${index+1}" style="filter:${css}"></div>`).join('');
    const elements = (pState.elements || []).map(element => `<button type="button" class="pb-shared-element ${selectedElementId===element.id?'selected':''}" style="left:${clampPosition(element.x)*100}%;top:${clampPosition(element.y)*100}%;transform:translate(-50%,-50%) scale(${Number(element.scale||1)});color:${esc(element.color||selected[3])}" data-pb="select-element" data-element-id="${esc(element.id)}" data-drag-element="couple">${esc(element.text)}</button>`).join('');
    return `<div class="pb-couple-strip ${selected[0]}"><div class="pb-strip-header"><span>${esc(selected[1])}</span><b>Diri. ♡</b></div><div class="pb-couple-rows">${rows}</div><div class="pb-strip-footer"><span>dua tempat, satu kenangan</span><b>♡</b></div>${elements}</div>`;
  }
  function renderSharedEditor() {
    const approvals=pState?.approvals||{};
    const selected=(pState.elements||[]).find(element=>element.id===selectedElementId);
    const slotRequest=pState?.slotRetake;
    const ownFotos=editorData?.[role]||[];
    const slotGrid=ownFotos.length===4?`<div class="pb-retake-grid">${ownFotos.map((photo,index)=>`<figure><img src="${photo?.url||''}" alt="Foto ${index+1} milikmu"><figcaption>Foto ${index+1}</figcaption><button class="button button-small button-quiet" data-pb="request-slot-retake" data-index="${index}" ${slotRequest?'disabled':''}>Ulangi foto ini</button></figure>`).join('')}</div>`:'<p class="small-note">Memuat foto untuk opsi pengambilan ulang…</p>';
    const retakeNotice=slotRequest?`<div class="room-alert"><strong>Permintaan ulang foto</strong><p>${slotRequest.role==='host'?'Pembuat ruang':'Tamu'} meminta mengulang foto nomor ${Number(slotRequest.index)+1}.</p><p>Pembuat ruang: ${slotRequest.approvals?.host?'setuju':'menunggu'} · Tamu: ${slotRequest.approvals?.guest?'setuju':'menunggu'}</p>${slotRequest.role===role?`<button class="button button-quiet" data-pb="cancel-slot-retake">Batalkan permintaan</button>`:`<button class="button button-primary" data-pb="approve-slot-retake">Setuju, ulangi foto</button>`}</div>`:'';
    return `${gameTop('Pratinjau gabungan berdua','Periksa hasil delapan foto pada satu strip. Kalian dapat meminta pengambilan ulang sebelum menyetujui hasil akhir.','PRATINJAU SEBELUM CETAK')}<div class="photo-layout"><section class="panel shared-editor-panel"><h2>Pratinjau hasil gabungan</h2><div class="pb-shared-preview">${renderSharedStrip()}</div><p class="small-note">Kolom kiri adalah Pembuat ruang, kolom kanan adalah Tamu. Inilah susunan yang akan diunduh atau dicetak.</p>${retakeNotice}<h2>Ulangi foto tertentu</h2><p class="small-note">Pilih salah satu foto milikmu. Pasangan perlu menyetujui sebelum kamera dibuka kembali untuk satu foto tersebut.</p>${slotGrid}<div class="photo-controls"><button class="button button-secondary" data-pb="add-sticker">Tambah stiker</button><form data-pb-form="couple-text"><input name="text" maxlength="50" placeholder="Tulis keterangan"><button class="button button-quiet" type="submit">Tambah teks</button></form></div><p class="small-note">Pilih stiker atau teks, lalu seret langsung pada pratinjau. Setelah dilepas, posisinya tersinkron ke pasangan. Tombol panah tetap tersedia sebagai alternatif.</p><div class="element-tools"><button class="button button-small" data-pb="move-left" ${selected?'':'disabled'}>←</button><button class="button button-small" data-pb="move-right" ${selected?'':'disabled'}>→</button><button class="button button-small" data-pb="move-up" ${selected?'':'disabled'}>↑</button><button class="button button-small" data-pb="move-down" ${selected?'':'disabled'}>↓</button><button class="button button-small" data-pb="size-up" ${selected?'':'disabled'}>A+</button><button class="button button-small" data-pb="size-down" ${selected?'':'disabled'}>A−</button><button class="button button-small button-quiet" data-pb="delete-element" ${selected?'':'disabled'}>Hapus pilihan</button><button class="button button-small button-quiet" data-pb="undo-own">Batalkan hiasanku</button></div><div class="approval-grid"><span class="ready-chip ${approvals.host?'done':''}">Pembuat ruang · ${approvals.host?'Setuju':'Menunggu'}</span><span class="ready-chip ${approvals.guest?'done':''}">Tamu · ${approvals.guest?'Setuju':'Menunggu'}</span></div><div class="photo-controls"><button class="button button-primary" data-pb="final-approve">${approvals[role]?'Batalkan persetujuan':'Setujui hasil akhir'}</button><button class="button button-quiet" data-pb="retake-all">Minta ulang seluruh foto</button></div><p class="small-note">Tombol unduh/cetak tersedia setelah kalian berdua menyetujui pratinjau ini.</p></section></div>`;
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
    if (pState.phase === 'setup') root.innerHTML = `<div class="photo-app">${renderCoupleSetup()}</div>`;
    else if (pState.phase === 'capture') root.innerHTML = `<div class="photo-app">${renderCapture()}</div>`;
    else if (pState.phase === 'manual') root.innerHTML = `<div class="photo-app">${renderManualTransfer()}</div>`;
    else if (pState.phase === 'editor') root.innerHTML = `<div class="photo-app">${renderSharedEditor()}</div>`;
    else if (pState.phase === 'finalized') root.innerHTML = `<div class="photo-app">${renderFinalized()}</div>`;
    else root.innerHTML = `<div class="photo-app"><section class="panel game-panel"><h2>Sesi Fotobooth berakhir</h2><button class="button button-quiet" data-pb="back">Kembali ke lobi</button></section></div>`;
    attachCameraToCurrentVideo();
  }
  async function addCouplePhoto(blob, index, name) {
    const data = await readDataUrl(blob);
    localPhotos[index] = { blob, url:data, name };
    if (pState?.retakeToken === undefined) return;
    await putLocalMedia('photobooth', localKey(session.sessionId,pState.retakeToken,role,index), blob);
  }
  async function restoreCaptureMedia() {
    if (restoringCapture || !pState) return;
    restoringCapture=true;
    try {
      const restored=[];
      for (let index=0;index<4;index++) {
        if (localPhotos[index]) { restored[index]=localPhotos[index]; continue; }
        const blob=await getLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,role,index));
        if (blob) restored[index]={blob,url:await readDataUrl(blob),name:`foto-${index+1}.jpg`};
      }
      if (restored.some(Boolean)) {
        localPhotos=restored;
        if (mode==='couple' && pState?.phase==='capture') renderCouple();
      }
    } catch (error) { console.warn('Local photo restore:',error); }
    finally { restoringCapture=false; }
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
    disposePeer();localSent=false;remoteDone=false;sendStarted=false;incomingFile=null;
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
          const answer=await waitForValue(`${path}/answer`,18000);
          await rtc.setRemoteDescription(new RTCSessionDescription(answer));await flushCandidates();
        } else {
          const channelReady=new Promise(resolve=>{
            rtc.addEventListener('datachannel',event=>{channel=event.channel;wireDataChannel(channel);resolve(channel);},{once:true});
          });
          const offer=await waitForValue(`${path}/offer`,18000);
          await rtc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer=await rtc.createAnswer();await rtc.setLocalDescription(answer);
          await set(ref(db,`${path}/answer`),{type:answer.type,sdp:answer.sdp});await flushCandidates();
          await Promise.race([channelReady,wait(18000).then(()=>{throw new Error('DataChannel did not arrive.');})]);
        }
        await waitChannelOpen(18000);
        return true;
      } catch (error) {
        console.warn('WebRTC connection attempt failed:',error);
        return false;
      }
    })();
    const timedOut = new Promise(resolve => {
      timeoutId=setTimeout(()=>{disposePeer();resolve(false);},20000);
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
    dataChannel.onmessage=async event=>{
      if (typeof event.data==='string') {
        let message;try{message=JSON.parse(event.data);}catch{return;}
        if (message.type==='file-start') incomingFile={index:message.index,mime:message.mime,name:message.name,chunks:[]};
        else if (message.type==='file-end' && incomingFile) {
          const completed=incomingFile;
          incomingFile=null;
          const blob=new Blob(completed.chunks,{type:completed.mime});
          const key=localKey(session.sessionId,pState?.retakeToken||0,partnerRole,completed.index);
          await putLocalMedia('photobooth',key,blob);
          remotePhotos[completed.index]={blob,url:await readDataUrl(blob),name:completed.name};
          await finishP2PIfReady();
        } else if (message.type==='all-done') {
          remoteDone=true;
          await finishP2PIfReady();
        }
      } else if (incomingFile) incomingFile.chunks.push(event.data);
    };
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
        channel.send(JSON.stringify({type:'file-end',index}));
      }
      channel.send(JSON.stringify({type:'all-done',role}));localSent=true;
      await finishP2PIfReady();
    } catch (error) { showToast(`Transfer foto gagal: ${error.message}`,'error'); }
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
        // Allow a separate transfer window after the ~20-second connection attempt.
        await new Promise(resolve=>{p2pTimer=setTimeout(resolve,30000);const check=setInterval(()=>{if(pState?.phase==='editor'||destroyed){clearInterval(check);clearTimeout(p2pTimer);resolve();}},250);});
        if (pState?.phase==='editor') return;
      }
      disposePeer();
      if (attempt===1) { showToast('Koneksi langsung belum berhasil. Mencoba sekali lagi…','error');await wait(800); }
    }
    await mutate(state=>{if(state.phase==='capture'){state.phase='manual';state.p2p.status='manual-fallback';}});
    showToast('Koneksi langsung tidak tersedia di jaringan ini. Gunakan pemindahan manual.','error');
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
  async function addEditorElement(text) {
    const clean=String(text||'').trim().slice(0,50);if(!clean)return;
    const id=randomId();selectedElementId=id;
    await mutate(state=>{if(state.phase!=='editor')return false;state.elements=state.elements||[];state.elements.push({id,text:clean,x:.5+(Math.random()-.5)*.16,y:.48+(Math.random()-.5)*.16,scale:1,color:'#a45f82',createdBy:myUid,createdAt:Date.now()});state.approvals={host:false,guest:false};});
  }
  async function updateSelectedElement(action) {
    if (mode === 'solo') {
      if (!selectedSoloElementId) return;
      const element = soloElements.find(item => item.id === selectedSoloElementId); if (!element) return;
      const step = .025;
      if (action === 'move-left') element.x = clampPosition(element.x - step);
      if (action === 'move-right') element.x = clampPosition(element.x + step);
      if (action === 'move-up') element.y = clampPosition(element.y - step);
      if (action === 'move-down') element.y = clampPosition(element.y + step);
      if (action === 'size-up') element.scale = Math.min(2, Number(element.scale || 1) + .15);
      if (action === 'size-down') element.scale = Math.max(.5, Number(element.scale || 1) - .15);
      if (action === 'delete-element') { soloElements = soloElements.filter(item => item.id !== selectedSoloElementId); selectedSoloElementId = null; }
      renderSolo(); return;
    }
    if(!selectedElementId)return;
    await mutate(state=>{
      if(state.phase!=='editor')return false;
      const element=(state.elements||[]).find(item=>item.id===selectedElementId);if(!element)return false;
      const step=.025;
      if(action==='move-left')element.x=clampPosition(element.x-step);
      if(action==='move-right')element.x=clampPosition(element.x+step);
      if(action==='move-up')element.y=clampPosition(element.y-step);
      if(action==='move-down')element.y=clampPosition(element.y+step);
      if(action==='size-up')element.scale=Math.min(2,Number(element.scale||1)+.15);
      if(action==='size-down')element.scale=Math.max(.5,Number(element.scale||1)-.15);
      if(action==='delete-element')state.elements=state.elements.filter(item=>item.id!==selectedElementId);
      state.approvals={host:false,guest:false};
    });
    if(action==='delete-element') selectedElementId=null;
  }
  async function undoOwnElement() {
    if (mode === 'solo') { if (soloElements.length) { soloElements.pop(); selectedSoloElementId = null; renderSolo(); } return; }
    await mutate(state=>{if(state.phase!=='editor')return false;const index=(state.elements||[]).map(item=>item.createdBy).lastIndexOf(myUid);if(index<0)return false;state.elements.splice(index,1);state.approvals={host:false,guest:false};});
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

  // Drag hiasan/teks langsung pada pratinjau. Posisi disimpan ternormalisasi (0–1).
  function onPointerDown(event) {
    const node = event.target.closest('[data-drag-element]');
    if (!node || event.button > 0) return;
    const type = node.dataset.dragElement;
    const stage = node.closest(type === 'solo' ? '#solo-strip' : '.pb-couple-strip');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const box = {left:rect.left + stage.clientLeft,top:rect.top + stage.clientTop,width:stage.clientWidth,height:stage.clientHeight};
    if (!box.width || !box.height) return;
    const startX = clampPosition(Number.parseFloat(node.style.left) / 100);
    const startY = clampPosition(Number.parseFloat(node.style.top) / 100);
    const offsetX = startX * box.width - (event.clientX - box.left);
    const offsetY = startY * box.height - (event.clientY - box.top);
    activeDrag = { type, id: node.dataset.elementId, node, stage, pointerId: event.pointerId, startX, startY, offsetX, offsetY, x: startX, y: startY, moved: false };
    if (type === 'solo') selectedSoloElementId = activeDrag.id;
    else selectedElementId = activeDrag.id;
    node.classList.add('dragging');
    try { node.setPointerCapture(event.pointerId); } catch {}
    event.preventDefault();
  }
  function onPointerMove(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    const rect = activeDrag.stage.getBoundingClientRect();
    const box = {left:rect.left + activeDrag.stage.clientLeft,top:rect.top + activeDrag.stage.clientTop,width:activeDrag.stage.clientWidth,height:activeDrag.stage.clientHeight};
    if (!box.width || !box.height) return;
    const x = clampPosition((event.clientX - box.left + activeDrag.offsetX) / box.width);
    const y = clampPosition((event.clientY - box.top + activeDrag.offsetY) / box.height);
    if (Math.abs(x - activeDrag.startX) + Math.abs(y - activeDrag.startY) > .003) activeDrag.moved = true;
    activeDrag.x = x; activeDrag.y = y;
    activeDrag.node.style.left = `${x * 100}%`; activeDrag.node.style.top = `${y * 100}%`;
    if (activeDrag.type === 'solo') {
      const element = soloElements.find(item => item.id === activeDrag.id);
      if (element) { element.x = x; element.y = y; }
    }
    event.preventDefault();
  }
  async function onPointerUp(event) {
    if (!activeDrag || (event.pointerId !== undefined && activeDrag.pointerId !== event.pointerId)) return;
    const drag = activeDrag; activeDrag = null; drag.node.classList.remove('dragging');
    if (!drag.moved || drag.x === null || drag.y === null) {
      if (drag.type === 'solo') renderSolo();
      else renderCouple();
      return;
    }
    if (drag.type === 'solo') { renderSolo(); return; }
    try {
      await mutate(state => {
        if (state.phase !== 'editor') return false;
        const element = (state.elements || []).find(item => item.id === drag.id); if (!element) return false;
        element.x = drag.x; element.y = drag.y; state.approvals = {host:false,guest:false};
      });
    } catch (error) { showToast(`Posisi hiasan tidak tersimpan: ${error.message}`, 'error'); }
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
      if(action==='solo-reset'){soloPhotos=[];soloElements=[];selectedSoloElementId=null;renderSolo();return;}
      if(action==='solo-retake-slot'){const index=Number(button.dataset.index);if(index>=0&&index<4){soloPhotos[index]=null;renderSolo();}return;}
      if(action==='couple-retake-slot'){const index=Number(button.dataset.index);if(index>=0&&index<4&&pState?.photosDone?.[role]!==true){localPhotos[index]=null;await deleteLocalMedia('photobooth',localKey(session.sessionId,pState.retakeToken||0,role,index));renderCouple();}return;}
      if(action==='solo-sticker'){const id=randomId();soloElements.push({id,text:STICKERS[Math.floor(Math.random()*STICKERS.length)],x:.5,y:.5,scale:1,color:'#a45f82'});selectedSoloElementId=id;renderSolo();return;}
      if(action==='solo-frame'){soloFrame=button.dataset.frame;renderSolo();return;}
      if(action==='solo-filter'){soloFilter=button.dataset.filter;renderSolo();return;}
      if(action==='select-solo-element'){selectedSoloElementId=button.dataset.elementId;renderSolo();return;}
      if(action==='solo-png'){const blob=await renderStripBlob(soloPhotos,soloFrame,soloFilter,soloAdjust,soloElements,false,'image/png');await downloadBlob(blob,'diri-playroom-date-solo-photostrip.png');return;}
      if(action==='solo-jpeg'){const blob=await renderStripBlob(soloPhotos,soloFrame,soloFilter,soloAdjust,soloElements,false,'image/jpeg');await downloadBlob(blob,'diri-playroom-date-solo-photostrip.jpg');return;}
      if(action==='solo-save'){await saveSoloGaleri();return;}
      if(action==='gallery-delete'){const items=await getLocalValue('photobooth-gallery')||[];items.splice(Number(button.dataset.index),1);await setLocalValue('photobooth-gallery',items);void renderGallery();return;}
      if(action==='couple-frame'){await mutate(state=>{if(state.phase!=='setup')return false;state.frameId=button.dataset.frame;state.ready={host:false,guest:false};});return;}
      if(action==='couple-filter'){
        await mutate(state=>{if(state.phase!=='setup')return false;state.filter=state.filter||{};state.filter.preset=button.dataset.filter;state.ready={host:false,guest:false};});return;
      }
      if(action==='couple-ready'){await beginCaptureReady();return;}
      if(action==='couple-photos-ready'){await confirmPhotosReady();return;}
      if(action==='verify-manual'){await verifyManual();return;}
      if(action==='solo-fallback'){await mutate(state=>{state.phase='aborted';});disposePeer();mode='solo';renderSolo();showToast('Sesi berdua dihentikan. Kamu dapat melanjutkan Fotobooth Sendiri.');return;}
      if(action==='abort-couple'){await mutate(state=>{state.phase='aborted';});return;}
      if(action==='select-element'){selectedElementId=button.dataset.elementId;renderCouple();return;}
      if(['move-left','move-right','move-up','move-down','size-up','size-down','delete-element'].includes(action)){await updateSelectedElement(action);return;}
      if(action==='undo-own'){await undoOwnElement();return;}
      if(action==='add-sticker'){await addEditorElement(STICKERS[Math.floor(Math.random()*STICKERS.length)]);return;}
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
      if(element.matches('#pb-solo-files')) {
        const photos=await processImages(element.files,4);if(photos.length!==4)throw new Error('Pilih tepat empat foto.');soloPhotos=photos.map(photo=>photo.url);renderSolo();
      }
      if(element.matches('#pb-couple-files')) {
        const photos=await processImages(element.files,4);if(photos.length!==4)throw new Error('Pilih tepat empat foto.');
        localPhotos=[];for(let index=0;index<4;index++)await addCouplePhoto(photos[index].blob,index,photos[index].name);
        await mutate(state=>{state.photosDone=state.photosDone||{host:false,guest:false};state.photosDone[role]=false;});renderCouple();
      }
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
      if(element.matches('[data-adjust]')) {
        const [prefix,key]=element.dataset.adjust.split('-');
        if(prefix==='solo'){soloAdjust[key]=Number(element.value);const strip=root.querySelector('#solo-strip');if(strip)strip.innerHTML=renderSoloPreview();}
        else if(prefix==='couple'){await mutate(state=>{if(state.phase!=='setup')return false;state.filter=state.filter||{};state.filter[key]=Number(element.value);state.ready={host:false,guest:false};});}
      }
    } catch(error) { showToast(error.message,'error'); }
  }
  async function onSubmit(event) {
    const form=event.target.closest('[data-pb-form]');if(!form)return;event.preventDefault();
    try {
      const text=form.elements.text.value;
      if(form.dataset.pbForm==='solo-text'){const clean=String(text||'').trim().slice(0,50);if(clean){const id=randomId();soloElements.push({id,text:clean,x:.5,y:.5,scale:1,color:'#a45f82'});selectedSoloElementId=id;renderSolo();}}
      if(form.dataset.pbForm==='couple-text'){await addEditorElement(text);}
    } catch(error) { showToast(error.message,'error'); }
  }
  root.addEventListener('click',onClick);
  root.addEventListener('change',onChange);
  root.addEventListener('submit',onSubmit);
  root.addEventListener('pointerdown',onPointerDown);
  root.addEventListener('pointermove',onPointerMove);
  root.addEventListener('pointerup',onPointerUp);
  root.addEventListener('pointercancel',onPointerUp);
  void init();
  return { destroy:cleanup };
}
