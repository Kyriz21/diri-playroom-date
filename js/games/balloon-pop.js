import { db, ref, get, set, update, onValue, runTransaction } from '../firebase.js';
import {
  BALLOON_POP_DURATION_SECONDS, BALLOON_POP_MAX_OBJECTS, BALLOON_POP_FLIGHT_MS,
  BALLOON_POP_SPAWN_INTERVAL_MS, createBalloon, getBalloonY, getBalloonX,
  findBalloonAtPoint, applyBalloonPop, summarizeBalloonHits,
  getBalloonPopRemaining, determineBalloonPopWinner, nextBalloonPopSeed
} from './balloon-pop-logic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const CHARACTERS = [
  { id:'alien',emoji:'👾',name:'Alien' }, { id:'bear',emoji:'🧸',name:'Beruang' },
  { id:'cat',emoji:'🐱',name:'Kucing' }, { id:'rabbit',emoji:'🐰',name:'Kelinci' },
  { id:'panda',emoji:'🐼',name:'Panda' }, { id:'fox',emoji:'🦊',name:'Rubah' },
  { id:'frog',emoji:'🐸',name:'Katak' }, { id:'monkey',emoji:'🐵',name:'Monyet' },
  { id:'koala',emoji:'🐨',name:'Koala' }, { id:'tiger',emoji:'🐯',name:'Harimau' },
  { id:'chick',emoji:'🐥',name:'Anak ayam' }, { id:'unicorn',emoji:'🦄',name:'Unicorn' }
];
const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map(item => [item.id,item]));
const DEFAULTS = { host:'alien', guest:'bear' };
const characterValue = id => `character:${CHARACTER_MAP[id] ? id : 'alien'}`;
const isImageAvatar = value => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,/i.test(value) && value.length <= 22000;
const safeAvatar = value => isImageAvatar(value) || /^character:(alien|bear|cat|rabbit|panda|fox|frog|monkey|koala|tiger|chick|unicorn)$/.test(String(value || '')) ? value : '';

const makeSeed = () => { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] || 1; };
function imageFromDataUrl(source) {
  if (!isImageAvatar(source)) return null;
  const image = new Image(); image.src = source; return image;
}
async function compressAvatar(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Pilih file gambar untuk avatar.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Ukuran foto maksimal 12 MB.');
  let bitmap = null, image = null, url = '';
  try {
    if (typeof createImageBitmap === 'function') bitmap = await createImageBitmap(file);
    else {
      url = URL.createObjectURL(file);
      image = await new Promise((resolve,reject) => { const el = new Image(); el.onload=()=>resolve(el); el.onerror=()=>reject(new Error('Foto tidak dapat dibuka.')); el.src=url; });
    }
  } catch { if (url) URL.revokeObjectURL(url); throw new Error('Foto tidak dapat dibuka. Coba pilih gambar lain.'); }
  const source = bitmap || image, side = Math.min(source.width || source.naturalWidth, source.height || source.naturalHeight);
  const sx = ((source.width || source.naturalWidth)-side)/2, sy = ((source.height || source.naturalHeight)-side)/2;
  const canvas = document.createElement('canvas'); canvas.width=128; canvas.height=128;
  canvas.getContext('2d').drawImage(source,sx,sy,side,side,0,0,128,128);
  bitmap?.close?.(); if (url) URL.revokeObjectURL(url);
  let result = canvas.toDataURL('image/jpeg',.66);
  if (result.length > 22000) result = canvas.toDataURL('image/jpeg',.48);
  if (result.length > 22000) throw new Error('Foto terlalu besar setelah dikompres. Pilih foto lain.');
  return result;
}

const freshStats = () => ({ score:0, lives:3, popped:0, finished:false, hitIds:{}, events:{} });

export function mountBalloonPop(root, context) {
  const { code, session, room, role, player, onBack, toast=()=>{} } = context;
  const opponentRole = role === 'host' ? 'guest' : 'host';
  const names = { host:room.host?.name || 'Pembuat ruang', guest:room.guest?.name || 'Tamu' };
  const basePath = `roomGames/${code}/${session.sessionId}/balloonPop`;
  const baseRef = ref(db,basePath);
  const metaRef = ref(db,`${basePath}/meta`);
  const playerRef = playerRole => ref(db,`${basePath}/players/${playerRole}`);
  const statsRef = playerRole => ref(db,`${basePath}/players/${playerRole}/stats`);
  const avatarRef = playerRole => ref(db,`roomGames/${code}/${session.sessionId}/balloonPopAvatars/${playerRole}`);
  const nowServer = () => Date.now() + serverOffset;

  let data = {};
  let avatarData = { host:'',guest:'' };
  let avatarImages = { host:null,guest:null };
  let avatarSources = { host:'',guest:'' };
  let avatarBusy = false, readyBusy = false, rematchBusy = false, resultBusy = false;
  let serverOffset = 0, destroyed = false, initBusy = false;
  let unsubscribeGame = null, unsubscribeAvatars = null, unsubscribeOffset = null;
  let rafId = 0, intervalId = 0, observedRound = null, lastStartAttempt = '', lastStats = null;
  let pendingHits = new Set(), avatarDomSources = new Map(), lastToastAt = 0;

  const statsFor = playerRole => summarizeBalloonHits(data.players?.[playerRole]?.stats || freshStats());
  const ownStats = () => data.players?.[role]?.stats || freshStats();
  const otherStats = () => data.players?.[opponentRole]?.stats || freshStats();
  const roundNo = () => Number(data.meta?.roundNo || 1);

  function shell() {
    root.innerHTML = `
      <section class="bp-shell">
        <header class="bp-header">
          <div><span class="bp-kicker">DIRI. · ARCADE 04</span><h1>Balloon Pop <span>🎈</span></h1><p>Pecahkan balon, kumpulkan bonus, dan hindari bom!</p></div>
          <div class="bp-header-actions"><span class="dt-room-code">${esc(code)}</span><button class="button button-quiet button-small" data-bp-action="back">Kembali</button></div>
        </header>

        <section class="bp-panel" data-bp-panel="lobby">
          <div class="bp-heading"><span class="bp-kicker">PERSIAPAN ARCADE</span><h2>Siap memecahkan balon?</h2><p>Pilih karakter, ambil selfie, atau gunakan foto dari galeri. Kalian mulai bersamaan setelah keduanya siap.</p></div>
          <div class="bp-player-setup">
            <article class="bp-setup-card is-mine">
              <div class="bp-avatar" data-bp-avatar="mine">${role==='host'?'👾':'🧸'}</div><strong>${esc(names[role])}</strong><small>Karakter kamu</small>
              <div class="bp-character-grid">${CHARACTERS.map(item=>`<button type="button" class="bp-character" data-bp-character="${item.id}" aria-label="Pilih ${item.name}"><span>${item.emoji}</span><small>${item.name}</small></button>`).join('')}</div>
              <div class="bp-avatar-actions"><button class="button button-secondary" data-bp-action="camera">📷 Ambil foto</button><button class="button button-secondary" data-bp-action="gallery">🖼️ Pilih dari galeri</button></div>
              <input id="bp-camera" class="bp-file-input" type="file" accept="image/*" capture="user" aria-label="Ambil foto dengan kamera">
              <input id="bp-gallery" class="bp-file-input" type="file" accept="image/*" aria-label="Pilih foto dari galeri">
              <span class="bp-avatar-status" data-bp-avatar-status>Pilih karakter untuk mulai.</span>
            </article>
            <article class="bp-setup-card"><div class="bp-avatar" data-bp-avatar="partner">${opponentRole==='host'?'👾':'🧸'}</div><strong>${esc(names[opponentRole])}</strong><small>Karakter pasangan</small><span class="bp-avatar-status" data-bp-partner-status>Menunggu pasangan memilih karakter.</span></article>
          </div>
          <div class="bp-howto">
            <div><span>🎈</span><strong>Balon biasa +1</strong><small>Ketuk sebelum terbang.</small></div>
            <div><span>💗 ✨</span><strong>Bonus +5 / +10</strong><small>Balon hati dan emas.</small></div>
            <div><span>💣</span><strong>Hindari bom</strong><small>Bom mengurangi satu nyawa.</small></div>
          </div>
          <div class="bp-ready-grid"><div><strong>${esc(names.host)}</strong><span data-bp-ready="host">Belum siap</span></div><div><strong>${esc(names.guest)}</strong><span data-bp-ready="guest">Belum siap</span></div></div>
          <button class="button button-primary bp-ready-button" data-bp-action="ready">Aku siap bermain</button>
          <p class="bp-note">Durasi 60 detik · 3 nyawa · Skor tertinggi menang.</p>
        </section>

        <section class="bp-panel bp-play-panel" data-bp-panel="playing" hidden>
          <div class="bp-game-top"><div><span class="bp-kicker">BALLOON POP</span><strong>Ketuk balonnya!</strong></div><div class="bp-timer"><small>WAKTU</small><b data-bp-timer>60</b><small>DETIK</small></div><div class="bp-round">RONDE <b data-bp-round>1</b></div></div>
          <div class="bp-countdown" data-bp-countdown hidden>3</div>
          <div class="bp-lanes" data-bp-lanes>
            ${[role,opponentRole].map(playerRole=>`<article class="bp-lane ${playerRole===role?'is-mine':''}" data-bp-lane="${playerRole}">
              <header><div class="bp-lane-player"><div class="bp-mini-avatar" data-bp-avatar-lane="${playerRole}">${playerRole==='host'?'👾':'🧸'}</div><div><strong>${esc(names[playerRole])}${playerRole===role?' · Kamu':''}</strong><small>${playerRole===role?'Ketuk balon di area ini':'Sedang bermain'}</small></div></div><div class="bp-lane-stats"><b data-bp-score="${playerRole}">0</b><small>poin</small><span data-bp-lives="${playerRole}">♥♥♥</span></div></header>
              <canvas class="bp-canvas" data-bp-board="${playerRole}" aria-label="Area Balloon Pop ${esc(names[playerRole])}" ${playerRole===role?'':'aria-disabled="true"'}></canvas>
              <footer><span data-bp-popped="${playerRole}">0 balon pecah</span><span data-bp-bomb="${playerRole}">0 bom</span></footer>
            </article>`).join('')}
          </div>
          <p class="bp-note" data-bp-game-note>Ketuk balon secepatnya. Balon emas bernilai paling tinggi!</p>
        </section>

        <section class="bp-panel bp-result-panel" data-bp-panel="result" hidden>
          <span class="bp-kicker">ARCADE SELESAI</span><div class="bp-result-icon">🎈</div><h2 data-bp-result-title>Hasil Balloon Pop</h2><p data-bp-result-subtitle>Siapa yang paling banyak memecahkan balon?</p>
          <div class="bp-result-grid">${['host','guest'].map(playerRole=>`<article><div class="bp-result-avatar" data-bp-result-avatar="${playerRole}">${playerRole==='host'?'👾':'🧸'}</div><strong>${esc(names[playerRole])}</strong><b data-bp-result-score="${playerRole}">0</b><small>poin</small><span data-bp-result-stats="${playerRole}">0 balon · 0 bom</span></article>`).join('')}</div>
          <div class="bp-rematch-grid"><span data-bp-rematch="host">${esc(names.host)} · Belum memilih</span><span data-bp-rematch="guest">${esc(names.guest)} · Belum memilih</span></div>
          <div class="bp-result-actions"><button class="button button-primary" data-bp-action="rematch">Main lagi</button><button class="button button-secondary" data-bp-action="back">Kembali</button></div>
          <p class="bp-note">Kalian berdua perlu memilih Main lagi untuk memulai ronde baru.</p>
        </section>
        <section class="bp-error" data-bp-panel="error" hidden><h2>Balloon Pop belum bisa dibuka</h2><p data-bp-error></p><button class="button button-secondary" data-bp-action="back">Kembali</button></section>
      </section>`;
    root.addEventListener('click',clickHandler);
    root.addEventListener('change',changeHandler);
    root.addEventListener('pointerdown',pointerDownHandler);
  }

  function showPanel(panel) { root.querySelectorAll('[data-bp-panel]').forEach(item=>{item.hidden=item.dataset.bpPanel!==panel;}); }
  function setAvatar(selector,source,fallback) {
    const node=root.querySelector(selector); if(!node || avatarDomSources.get(selector)===(source||'')) return;
    avatarDomSources.set(selector,source||'');
    if(isImageAvatar(source)) node.innerHTML=`<img src="${esc(source)}" alt="Avatar pemain">`;
    else node.textContent=CHARACTER_MAP[String(source||'').replace(/^character:/,'')]?.emoji||fallback;
  }
  function updateAvatars() {
    const mine=safeAvatar(avatarData[role]), partner=safeAvatar(avatarData[opponentRole]);
    setAvatar('[data-bp-avatar="mine"]',mine,role==='host'?'👾':'🧸');
    setAvatar('[data-bp-avatar="partner"]',partner,opponentRole==='host'?'👾':'🧸');
    setAvatar(`[data-bp-avatar-lane="${role}"]`,mine,role==='host'?'👾':'🧸');
    setAvatar(`[data-bp-avatar-lane="${opponentRole}"]`,partner,opponentRole==='host'?'👾':'🧸');
    setAvatar('[data-bp-result-avatar="host"]',safeAvatar(avatarData.host),'👾');
    setAvatar('[data-bp-result-avatar="guest"]',safeAvatar(avatarData.guest),'🧸');
    const status=root.querySelector('[data-bp-avatar-status]');
    const other=root.querySelector('[data-bp-partner-status]');
    if(status) status.textContent=isImageAvatar(mine)?'Foto kamu siap digunakan.':mine?`Karakter ${CHARACTER_MAP[mine.replace('character:','')]?.name||'bawaan'} dipilih.`:'Pilih karakter bawaan atau foto.';
    if(other) other.textContent=isImageAvatar(partner)?'Foto pasangan sudah siap.':partner?'Karakter bawaan pasangan sudah dipilih.':'Pasangan belum memilih karakter.';
    const selected=String(mine||'').startsWith('character:')?mine.slice(10):'';
    const ready=Boolean(data.players?.[role]?.ready) || data.meta?.phase!=='lobby';
    root.querySelectorAll('[data-bp-character]').forEach(button=>{const active=button.dataset.bpCharacter===selected;button.classList.toggle('is-selected',active);button.setAttribute('aria-pressed',String(active));button.disabled=ready||avatarBusy;});
    root.querySelectorAll('[data-bp-action="camera"],[data-bp-action="gallery"]').forEach(button=>{button.disabled=ready||avatarBusy;});
  }

  function getStats(playerRole) { return summarizeBalloonHits(data.players?.[playerRole]?.stats || freshStats()); }
  function updateHud() {
    for(const playerRole of ['host','guest']) {
      const stats=getStats(playerRole);
      const score=root.querySelector(`[data-bp-score="${playerRole}"]`); if(score)score.textContent=String(stats.score);
      const lives=root.querySelector(`[data-bp-lives="${playerRole}"]`); if(lives)lives.textContent=`${'♥'.repeat(stats.lives)}${'♡'.repeat(3-stats.lives)}`;
      const popped=root.querySelector(`[data-bp-popped="${playerRole}"]`);if(popped)popped.textContent=`${stats.popped} balon pecah`;
      const bombs=root.querySelector(`[data-bp-bomb="${playerRole}"]`);if(bombs)bombs.textContent=`${stats.bombs} bom`;
    }
  }

  function drawCloud(ctx,x,y,s=1,alpha=.42) {
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(x,y,17*s,0,Math.PI*2);ctx.arc(x+18*s,y-7*s,22*s,0,Math.PI*2);ctx.arc(x+42*s,y,16*s,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawBalloon(ctx,x,y,r,kind,elapsed,id) {
    const palettes={normal:['#ff9fca','#e65d9d'],heart:['#ffb5d1','#ec669e'],gold:['#ffe78a','#eeaa3a']};
    const [light,dark]=palettes[kind]||palettes.normal;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(elapsed/360+id)*.07);
    ctx.strokeStyle='rgba(113,102,151,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,r*.9);ctx.bezierCurveTo(r*.28,r*1.55,-r*.25,r*1.82,r*.08,r*2.18);ctx.stroke();
    const gradient=ctx.createRadialGradient(-r*.35,-r*.4,2,0,0,r*1.2);gradient.addColorStop(0,light);gradient.addColorStop(1,dark);
    ctx.shadowColor=kind==='gold'?'rgba(229,174,54,.36)':'rgba(199,83,151,.28)';ctx.shadowBlur=12;ctx.shadowOffsetY=4;
    ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(0,0,r*.78,r,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-r*.27,-r*.36,r*.13,r*.25,-.45,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=kind==='gold'?'#a96c13':'#fff';ctx.font=`900 ${r*(kind==='gold'?1.0:1.12)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(kind==='heart'?'♥':kind==='gold'?'★':'•',0,r*.04);
    ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-r*.12,r*.91);ctx.lineTo(r*.12,r*.91);ctx.lineTo(0,r*1.16);ctx.closePath();ctx.fill();ctx.restore();
  }
  function drawBomb(ctx,x,y,r,elapsed,id) {
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(elapsed/100+id)*.09);
    ctx.strokeStyle='#75647f';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(r*.15,-r*.75);ctx.quadraticCurveTo(r*.55,-r*1.2,r*.78,-r*1.08);ctx.stroke();
    ctx.fillStyle=Math.sin(elapsed/75+id)>0?'#ffd66e':'#ff8d82';ctx.beginPath();ctx.arc(r*.8,-r*1.1,Math.max(2,r*.13),0,Math.PI*2);ctx.fill();
    const gradient=ctx.createRadialGradient(-r*.3,-r*.35,1,0,0,r);gradient.addColorStop(0,'#777084');gradient.addColorStop(.65,'#393244');gradient.addColorStop(1,'#171520');
    ctx.shadowColor='rgba(36,27,52,.28)';ctx.shadowBlur=8;ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-r*.27,-r*.28,r*.13,r*.19,-.4,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawPopBurst(ctx,x,y,r,kind,age) {
    if(age<0||age>620)return;
    const p=age/620,alpha=1-p;
    ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=kind==='bomb'?'#8c718f':kind==='gold'?'#f0b83c':'#ef76ad';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,r*(.8+p*1.8),0,Math.PI*2);ctx.stroke();
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7+p*.7,d=r*(.7+p*1.7);ctx.fillStyle=i%2?'#fff0a4':'#ff9dc7';ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,Math.max(1.2,3*(1-p)),0,Math.PI*2);ctx.fill();}
    ctx.font='900 13px system-ui';ctx.textAlign='center';ctx.fillStyle=kind==='bomb'?'#db6075':kind==='gold'?'#d59b20':'#d95b9a';ctx.fillText(kind==='bomb'?'💥':kind==='gold'?'+10':kind==='heart'?'+5':'+1',x,y-r-12-p*22);ctx.restore();
  }

  function drawBoard(playerRole,now) {
    const canvas=root.querySelector(`[data-bp-board="${playerRole}"]`);if(!canvas)return;
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);
    const width=rect.width,height=rect.height,elapsed=Math.max(0,now-Number(data.meta?.startedAt||now));
    const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#a7dff5');bg.addColorStop(.52,'#d9cbf7');bg.addColorStop(1,'#ffe3ef');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
    for(let i=0;i<5;i++){const drift=((i*width/4.4-elapsed*.006)%(width+100)+width+100)%(width+100)-35;drawCloud(ctx,drift,height*(.12+(i%2)*.14),.58+(i%3)*.12,.36);}
    for(let i=0;i<20;i++){const x=(i*67+23)%width,y=(i*43+15)%(height*.74);ctx.globalAlpha=.18+.2*Math.abs(Math.sin(elapsed/500+i));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,1.1+(i%3)*.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    const stats=data.players?.[playerRole]?.stats||freshStats(),hitIds=stats.hitIds||{},events=stats.events||{};
    const limit=Math.min(BALLOON_POP_MAX_OBJECTS,Math.max(0,Math.floor((elapsed-480)/BALLOON_POP_SPAWN_INTERVAL_MS)+1));
    for(let i=0;i<limit;i++){
      const balloon=createBalloon(Number(data.meta?.seed)||1,i);if(!balloon)continue;
      const yNorm=getBalloonY(balloon,elapsed);if(yNorm<-.22||yNorm>1.15)continue;
      const x=getBalloonX(balloon,elapsed)*width,y=yNorm*height,r=Math.max(12,width*balloon.radius);
      if(hitIds[i]){const event=events[i];if(event)drawPopBurst(ctx,x,y,r,event.kind,now-Number(event.hitAt||0));continue;}
      if(balloon.kind==='bomb')drawBomb(ctx,x,y,r,elapsed,i);else drawBalloon(ctx,x,y,r,balloon.kind,elapsed,i);
    }
    // Soft basket/ground at the bottom.
    const groundY=height*.94,ground=ctx.createLinearGradient(0,groundY,0,height);ground.addColorStop(0,'rgba(255,220,186,.48)');ground.addColorStop(1,'rgba(239,163,179,.72)');ctx.fillStyle=ground;ctx.beginPath();ctx.moveTo(0,groundY+4);ctx.quadraticCurveTo(width*.5,groundY-10,width,groundY+5);ctx.lineTo(width,height);ctx.lineTo(0,height);ctx.closePath();ctx.fill();
    if(playerRole===role&&data.meta?.phase==='playing'&&!stats.finished&&now>=Number(data.meta.startedAt||0)){ctx.fillStyle='rgba(255,255,255,.6)';ctx.font='800 10px system-ui';ctx.textAlign='center';ctx.fillText('KETUK BALON!',width/2,height-12);}
    if(stats.finished){ctx.fillStyle='rgba(255,255,255,.58)';ctx.fillRect(0,0,width,height);ctx.fillStyle='#76577e';ctx.font='900 16px system-ui';ctx.textAlign='center';ctx.fillText('SELESAI!',width/2,height/2);}
  }

  function drawAll(now) {
    if(data.meta?.phase!=='playing')return;
    drawBoard(role,now);drawBoard(opponentRole,now);
  }
  function updateState() {
    if(destroyed)return;
    const phase=data.meta?.phase||'lobby';showPanel(phase);
    updateAvatars();
    for(const playerRole of ['host','guest']){
      const ready=root.querySelector(`[data-bp-ready="${playerRole}"]`);if(ready)ready.textContent=data.players?.[playerRole]?.ready?'Siap bermain ✓':'Belum siap';
      const rematch=root.querySelector(`[data-bp-rematch="${playerRole}"]`);if(rematch)rematch.textContent=Number(data.rematchRequests?.[playerRole])===roundNo()?'Siap main lagi ✓':`${names[playerRole]} · Belum memilih`;
    }
    const readyButton=root.querySelector('[data-bp-action="ready"]');
    if(readyButton){const done=Boolean(data.players?.[role]?.ready);const prepared=Number(data.players?.[role]?.roundNo)===roundNo();readyButton.disabled=done||readyBusy||!prepared||avatarBusy;readyButton.textContent=done?'Kamu siap ✓':!prepared?'Menyiapkan ronde…':readyBusy?'Menyimpan…':'Aku siap bermain';}
    const rematchButton=root.querySelector('[data-bp-action="rematch"]');
    if(rematchButton){const voted=Number(data.rematchRequests?.[role])===roundNo();rematchButton.disabled=voted||rematchBusy;rematchButton.textContent=voted?'Menunggu pasangan…':rematchBusy?'Menyimpan…':'Main lagi';}
    updateHud();
    if(phase==='playing'){
      const remaining=getBalloonPopRemaining(Number(data.meta?.startedAt),Number(data.meta?.durationSeconds)||60,nowServer());
      const timer=root.querySelector('[data-bp-timer]');if(timer)timer.textContent=String(remaining).padStart(2,'0');
      const round=root.querySelector('[data-bp-round]');if(round)round.textContent=String(roundNo());
      const countdown=root.querySelector('[data-bp-countdown]');if(countdown)countdown.hidden=nowServer()>=Number(data.meta?.startedAt||0);
      const note=root.querySelector('[data-bp-game-note]');if(note)note.textContent=getStats(role).finished?'Nyawamu habis. Menunggu ronde selesai.':'Balon emas +10 · Hati +5 · Balon biasa +1 · Bom -1 nyawa';
    }
    if(phase==='result'){
      const result=determineBalloonPopWinner(data.players||{});
      const title=root.querySelector('[data-bp-result-title]'),subtitle=root.querySelector('[data-bp-result-subtitle]');
      if(title)title.textContent=result.winner==='draw'?'Seri! Sama-sama jago!':`${names[result.winner]} menang!`;
      if(subtitle)subtitle.textContent=`${result.host.score} poin untuk ${names.host}, ${result.guest.score} poin untuk ${names.guest}.`;
      for(const playerRole of ['host','guest']){
        const stats=summarizeBalloonHits(data.players?.[playerRole]?.stats||freshStats());
        const score=root.querySelector(`[data-bp-result-score="${playerRole}"]`);if(score)score.textContent=String(stats.score);
        const info=root.querySelector(`[data-bp-result-stats="${playerRole}"]`);if(info)info.textContent=`${stats.popped} balon · ${stats.bombs} bom`;
      }
    }
  }

  async function ensureMeta() {
    if(role!=='host')return;
    await runTransaction(metaRef,current=>current||({phase:'lobby',roundNo:1,seed:makeSeed(),durationSeconds:BALLOON_POP_DURATION_SECONDS,createdAt:nowServer(),startedAt:0}),{applyLocally:false});
  }
  async function ensureOwnPlayer() {
    const snapshot=await get(playerRef(role));
    if(!snapshot.exists()){
      const profile={name:names[role],ready:false,roundNo:roundNo(),finished:false,updatedAt:nowServer()};
      await update(playerRef(role),profile);
    }
    const statSnapshot=await get(statsRef(role));
    if(!statSnapshot.exists())await set(statsRef(role),freshStats());
  }
  async function resetOwnForRound(nextRound) {
    const reset={ready:false,roundNo:Number(nextRound),finished:false,updatedAt:nowServer()};
    try{await update(playerRef(role),reset);await set(statsRef(role),freshStats());}
    catch(error){toast(`Persiapan ronde baru gagal: ${error.message}`,'error');}
  }
  async function markReady() {
    if(readyBusy||data.players?.[role]?.ready||Number(data.players?.[role]?.roundNo)!==roundNo())return;
    readyBusy=true;updateState();
    try{await update(playerRef(role),{ready:true,updatedAt:nowServer()});toast('Kesiapan tersimpan. Menunggu pasangan…','success');}
    catch(error){toast(`Belum bisa menyimpan kesiapan: ${error.message}`,'error');}
    finally{readyBusy=false;updateState();}
  }
  async function maybeStart() {
    if(role!=='host'||data.meta?.phase!=='lobby'||!data.players?.host?.ready||!data.players?.guest?.ready)return;
    if(Number(data.players.host.roundNo)!==roundNo()||Number(data.players.guest.roundNo)!==roundNo())return;
    const key=String(roundNo());if(lastStartAttempt===key)return;lastStartAttempt=key;
    try{await runTransaction(metaRef,current=>{if(!current||current.phase!=='lobby'||Number(current.roundNo)!==Number(key))return;return {...current,phase:'playing',startedAt:nowServer()+3000};},{applyLocally:false});}
    catch(error){lastStartAttempt='';toast(`Permainan belum bisa dimulai: ${error.message}`,'error');}
  }
  async function finishIfNeeded(now) {
    if(role!=='host'||data.meta?.phase!=='playing'||resultBusy)return;
    const elapsed=now-Number(data.meta.startedAt||now);
    const bothFinished=Boolean(data.players?.host?.finished&&data.players?.guest?.finished);
    if(!bothFinished&&elapsed<BALLOON_POP_DURATION_SECONDS*1000+6400)return;
    resultBusy=true;
    try{await runTransaction(metaRef,current=>{if(!current||current.phase!=='playing')return;const both=Boolean(data.players?.host?.finished&&data.players?.guest?.finished);const elapsedNow=nowServer()-Number(current.startedAt||nowServer());if(!both&&elapsedNow<current.durationSeconds*1000+6400)return;return {...current,phase:'result',endedAt:nowServer()};},{applyLocally:false});}
    catch(error){toast(`Hasil belum tersimpan: ${error.message}`,'error');}finally{resultBusy=false;}
  }
  async function maybeStartRematch() {
    if(role!=='host'||data.meta?.phase!=='result'||rematchBusy)return;
    const currentRound=roundNo();
    if(Number(data.rematchRequests?.host)!==currentRound||Number(data.rematchRequests?.guest)!==currentRound)return;
    rematchBusy=true;
    try{await runTransaction(metaRef,current=>{if(!current||current.phase!=='result'||Number(current.roundNo)!==currentRound)return;return {...current,phase:'lobby',roundNo:currentRound+1,seed:nextBalloonPopSeed(current.seed,currentRound),createdAt:nowServer(),startedAt:0};},{applyLocally:false});}
    catch(error){toast(`Ronde baru belum dapat disiapkan: ${error.message}`,'error');}finally{rematchBusy=false;}
  }

  async function tapBalloon(event) {
    if(data.meta?.phase!=='playing'||getStats(role).finished||nowServer()<Number(data.meta.startedAt||0))return;
    const canvas=event.target.closest('[data-bp-board]'),rect=canvas?.getBoundingClientRect();
    if(!canvas||!rect?.width||!rect?.height)return;
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    const stats=ownStats(),balloon=findBalloonAtPoint({seed:Number(data.meta.seed)||1,elapsedMs:nowServer()-Number(data.meta.startedAt),hitIds:stats.hitIds||{},x,y,width:rect.width,height:rect.height});
    if(!balloon||pendingHits.has(balloon.id))return;
    pendingHits.add(balloon.id);
    try{
      const outcome=applyBalloonPop(stats,balloon),id=String(balloon.id);
      const result=await runTransaction(statsRef(role),current=>{
        const latest=current||freshStats();
        if(latest.finished||latest.hitIds?.[id])return;
        const next=applyBalloonPop(latest,balloon);
        return {...latest,score:next.score,lives:next.lives,popped:next.popped,finished:next.finished,hitIds:{...(latest.hitIds||{}),[id]:true},events:{...(latest.events||{}),[id]:{kind:balloon.kind,points:outcome.points,lifeLoss:outcome.lifeLoss,hitAt:nowServer()}}};
      },{applyLocally:false});
      if(result.committed){
        const latestStats=result.snapshot.val()||{};
        if(latestStats.finished) await update(playerRef(role),{finished:true,updatedAt:nowServer()});
        if(outcome.lifeLoss)toast('Ups! Terkena bom. Satu nyawa berkurang.','error');
        else toast(balloon.kind==='gold'?'Balon emas! +10 ✨':balloon.kind==='heart'?'Balon hati! +5 💗':'+1 poin 🎈','success');
      }
    }catch(error){const now=Date.now();if(now-lastToastAt>3500){lastToastAt=now;toast(`Balon belum tercatat: ${error.message}`,'error');}}
    finally{pendingHits.delete(balloon.id);}
  }

  async function selectCharacter(id) {
    if(avatarBusy||data.meta?.phase!=='lobby'||data.players?.[role]?.ready||!CHARACTER_MAP[id])return;
    avatarBusy=true;updateAvatars();
    try{const value=characterValue(id);await set(avatarRef(role),value);avatarData[role]=value;avatarSources[role]=value;avatarImages[role]=null;updateAvatars();toast(`Karakter ${CHARACTER_MAP[id].name} dipilih!`,'success');}
    catch(error){toast(`Karakter belum tersimpan: ${error.message}`,'error');}finally{avatarBusy=false;updateAvatars();}
  }
  async function pickAvatar(file) {
    if(avatarBusy)return;avatarBusy=true;updateAvatars();
    try{const value=await compressAvatar(file);await set(avatarRef(role),value);avatarData[role]=value;avatarSources[role]=value;avatarImages[role]=imageFromDataUrl(value);if(avatarImages[role])avatarImages[role].onload=()=>{if(!destroyed)drawAll(nowServer());};updateAvatars();toast('Foto berhasil dijadikan karakter!','success');}
    catch(error){toast(error.message,'error');}finally{avatarBusy=false;updateAvatars();}
  }
  async function ensureAvatar() {
    try{const snapshot=await get(avatarRef(role));const value=safeAvatar(snapshot.val());if(value){avatarData[role]=value;avatarSources[role]=value;avatarImages[role]=imageFromDataUrl(value);updateAvatars();return;}}
    catch(error){toast(`Avatar belum dapat dimuat: ${error.message}`,'error');}
    const value=characterValue(DEFAULTS[role]);
    try{await set(avatarRef(role),value);}catch(error){toast(`Karakter bawaan dipakai sementara: ${error.message}`,'error');}
    avatarData[role]=value;avatarSources[role]=value;updateAvatars();
  }
  async function requestRematch() {
    if(rematchBusy||data.meta?.phase!=='result'||Number(data.rematchRequests?.[role])===roundNo())return;
    rematchBusy=true;updateState();
    try{await set(ref(db,`${basePath}/rematchRequests/${role}`),roundNo());toast('Permintaan main lagi dikirim. Menunggu pasangan…','success');}
    catch(error){toast(`Rematch belum tersimpan: ${error.message}`,'error');}finally{rematchBusy=false;updateState();}
  }

  function clickHandler(event) {
    const action=event.target.closest('[data-bp-action]')?.dataset.bpAction;
    if(action==='back'){onBack?.();return;}
    if(action==='ready')void markReady();
    if(action==='rematch')void requestRematch();
    if(action==='camera')root.querySelector('#bp-camera')?.click();
    if(action==='gallery')root.querySelector('#bp-gallery')?.click();
    const character=event.target.closest('[data-bp-character]')?.dataset.bpCharacter;if(character)void selectCharacter(character);
  }
  function changeHandler(event) {
    if(event.target.matches('#bp-camera,#bp-gallery')){const file=event.target.files?.[0];if(file)void pickAvatar(file);event.target.value='';}
  }
  function pointerDownHandler(event) {
    const canvas=event.target.closest('[data-bp-board]');if(!canvas||canvas.dataset.bpBoard!==role)return;
    if(data.meta?.phase!=='playing')return;
    event.preventDefault();void tapBalloon(event);
  }
  function tick() {
    if(destroyed)return;
    const now=nowServer();
    if(data.meta?.phase==='playing'){
      drawAll(now);
      const remaining=getBalloonPopRemaining(Number(data.meta.startedAt),Number(data.meta.durationSeconds)||60,now);
      const timer=root.querySelector('[data-bp-timer]');if(timer)timer.textContent=String(remaining).padStart(2,'0');
      const countdown=root.querySelector('[data-bp-countdown]');if(countdown)countdown.hidden=now>=Number(data.meta.startedAt||0);
      void finishIfNeeded(now);
    }
    if(role==='host'&&data.meta?.phase==='result')void maybeStartRematch();
    rafId=requestAnimationFrame(tick);
  }

  async function init() {
    if(initBusy)return;initBusy=true;
    try{
      await ensureMeta();
      const snapshot=await get(baseRef);data=snapshot.val()||{};
      await ensureOwnPlayer();
      await ensureAvatar();
      unsubscribeOffset=onValue(ref(db,'/.info/serverTimeOffset'),snap=>{serverOffset=Number(snap.val())||0;});
      unsubscribeGame=onValue(baseRef,snap=>{
        if(destroyed)return;
        const next=snap.val()||{};data=next;
        const currentRound=roundNo();
        if(observedRound===null)observedRound=currentRound;
        else if(currentRound>observedRound){observedRound=currentRound;void resetOwnForRound(currentRound);}
        updateState();void maybeStart();
        if(data.meta?.phase==='playing')drawAll(nowServer());
        if(role==='host'&&data.meta?.phase==='result')void maybeStartRematch();
      },error=>toast(`Koneksi Balloon Pop terganggu: ${error.message}`,'error'));
      unsubscribeAvatars=onValue(ref(db,`roomGames/${code}/${session.sessionId}/balloonPopAvatars`),snap=>{
        if(destroyed)return;avatarData=snap.val()||{};
        for(const playerRole of ['host','guest']){const value=safeAvatar(avatarData[playerRole]);if(value!==avatarSources[playerRole]){avatarSources[playerRole]=value;avatarImages[playerRole]=imageFromDataUrl(value);}}
        updateAvatars();
      },error=>toast(`Avatar pasangan belum dapat dimuat: ${error.message}`,'error'));
      updateState();rafId=requestAnimationFrame(tick);
    }catch(error){showPanel('error');const node=root.querySelector('[data-bp-error]');if(node)node.textContent=error.message||'Tidak dapat membuka permainan.';}
    finally{initBusy=false;}
  }

  shell();void init();
  return { destroy(){
    destroyed=true;if(unsubscribeGame)unsubscribeGame();if(unsubscribeAvatars)unsubscribeAvatars();if(unsubscribeOffset)unsubscribeOffset();
    if(rafId)cancelAnimationFrame(rafId);if(intervalId)clearInterval(intervalId);
    root.removeEventListener('click',clickHandler);root.removeEventListener('change',changeHandler);root.removeEventListener('pointerdown',pointerDownHandler);
  }};
}
