import { db, ref, get, set, update, remove, onValue, runTransaction, serverTimestamp } from '../firebase.js';
import { getLocalCollection, saveLocalItem, putLocalMedia, getLocalMedia } from '../services/local-store.js';
import { isTicTacToeWin, getConnectFourWin, getConnectFourDropIndex, nextMemoryTurn, isExactAnswerGuess, findForbiddenWord, hasMatchingImageDeck } from './logic.js';

const $ = (selector, root=document) => root.querySelector(selector);
const esc = (v='') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const rand = (arr) => arr[Math.floor(Math.random()*arr.length)];
const shuffle = (arr) => [...arr].map(v => [Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const opposite = role => role === 'host' ? 'guest' : 'host';
const CATEGORIES = ['Makanan & Minuman','Ide Kencan','Gaya Hidup','Perjalanan','Hiburan','Kebiasaan Harian','Hubungan','Acak & Lucu'];
const TD_CATEGORIES = ['Romantis','Lucu','Kenangan','Hubungan','Pribadi','Kreatif','LDR','Acak'];

const LOVE_BANK = [
  ['Apa yang membuatku merasa paling dihargai?',['Kata-kata yang menenangkan','Waktu berkualitas bersama','Hadiah kecil','Bantuan dan perhatian'],'Hubungan'],
  ['Kencan malam ideal versiku adalah…',['Makan malam dan jalan santai','Menonton film di rumah','Bermain game bersama','Petualangan spontan'],'Ide Kencan'],
  ['Minuman apa yang biasanya kupilih?',['Kopi','Teh','Cokelat','Jus segar'],'Makanan & Minuman'],
  ['Kapan aku paling aktif?',['Pagi sekali','Siang hari','Sore atau malam','Larut malam'],'Kebiasaan Harian'],
  ['Tempat liburan impianku adalah…',['Pantai','Pegunungan','Kota besar','Pedesaan yang tenang'],'Perjalanan'],
  ['Genre film yang paling kusukai?',['Romantis','Komedi','Misteri atau laga','Fiksi ilmiah'],'Hiburan'],
  ['Apa yang membantuku setelah hari yang melelahkan?',['Mengobrol','Beristirahat dengan tenang','Makan sesuatu yang enak','Mendengarkan musik'],'Gaya Hidup'],
  ['Perhatian kecil apa yang paling berarti bagiku?',['Pesan yang tulus','Telepon kejutan','Mengingat hal-hal kecil','Pelukan hangat'],'Hubungan'],
  ['Apa yang kupilih saat akhir pekan luang?',['Bersantai di rumah','Menjelajahi tempat baru','Bertemu teman','Mempelajari hal baru'],'Gaya Hidup'],
  ['Makanan favorit yang membuatku nyaman lebih dekat dengan…',['Mi','Nasi dan lauk','Roti atau pastry','Camilan manis'],'Makanan & Minuman'],
  ['Cuaca seperti apa yang paling kusukai?',['Hujan','Cerah','Berawan','Sejuk dan berangin'],'Gaya Hidup'],
  ['Aktivitas mana yang lebih kunikmati?',['Mengambil foto','Membuat daftar putar musik','Menonton serial','Membaca'],'Hiburan'],
  ['Cara komunikasi yang paling kusukai?',['Pesan teks','Panggilan suara','Panggilan video','Pesan suara'],'Kebiasaan Harian'],
  ['Saat bepergian, aku lebih suka…',['Rencana yang terperinci','Jadwal yang fleksibel','Pergi tanpa rencana','Menyerahkan rencana kepada orang lain'],'Perjalanan'],
  ['Hadiah apa yang paling membuatku tersenyum?',['Surat tulisan tangan','Barang yang berguna','Kencan kejutan','Kenangan dalam bentuk foto'],'Hubungan'],
  ['Apa yang kulakukan pertama kali setelah bangun tidur?',['Memeriksa ponsel','Minum air','Peregangan','Tidur lagi'],'Kebiasaan Harian'],
  ['Kencan virtual yang sempurna menurutku adalah…',['Menonton film bersama','Memasak lewat panggilan video','Bermain game','Berbagi cerita'],'Ide Kencan'],
  ['Camilan mana yang paling kusukai?',['Keripik','Cokelat','Buah','Biskuit'],'Makanan & Minuman'],
  ['Musik seperti apa yang cocok dengan suasana hatiku?',['Pop','Akustik','Indie','Lo-fi'],'Hiburan'],
  ['Jika punya satu hari luang bersama, aku akan memilih…',['Perjalanan darat','Menginap di hotel','Berburu kuliner','Menjelajahi tempat baru'],'Ide Kencan'],
  ['Apa yang paling kuhargai dalam percakapan?',['Kejujuran','Humor','Kesabaran','Rasa ingin tahu'],'Hubungan'],
  ['Kebiasaan kecil apa yang ingin terus kulakukan?',['Pesan selamat pagi','Telepon malam','Kencan mingguan','Daftar putar bersama'],'Kebiasaan Harian'],
  ['Suasana rumah ideal bagiku adalah…',['Nyaman dan tenang','Terang dan terbuka','Ramai dan penuh warna','Minimalis dan damai'],'Gaya Hidup'],
  ['Musim apa yang kupilih untuk berlibur?',['Musim semi','Musim panas','Musim gugur','Musim dingin'],'Perjalanan'],
  ['Apa yang kucari saat membutuhkan inspirasi?',['Musik','Alam','Buku','Orang-orang'],'Gaya Hidup'],
  ['Kejutan seperti apa yang kusukai?',['Direncanakan dengan penuh perhatian','Benar-benar tidak terduga','Sesuatu buatan tangan','Pengalaman bersama'],'Hubungan'],
  ['Aktivitas apa yang paling membuatku rileks?',['Jalan santai','Mandi air hangat','Membaca','Menonton tayangan favorit'],'Gaya Hidup'],
  ['Apa yang ingin kukumpulkan dari perjalanan kita?',['Foto','Kartu pos','Tiket perjalanan','Suvenir kecil'],'Perjalanan'],
  ['Apa yang membuat kencan virtual terasa istimewa?',['Berdandan rapi','Melakukan aktivitas bersama','Daftar putar musik','Percakapan panjang'],'Ide Kencan'],
  ['Hidangan penutup apa yang kupilih?',['Es krim','Kue keju','Puding','Tart buah'],'Makanan & Minuman'],
  ['Jenis cerita apa yang paling membuatku tertarik?',['Misteri','Romansa','Komedi','Petualangan'],'Hiburan']
];
const THIS_OR_THAT_BANK = [
  ['Matahari terbit atau terbenam?','Terbit','Terbenam','Gaya Hidup'],['Kencan di pantai atau pegunungan?','Pantai','Pegunungan','Ide Kencan'],
  ['Kopi atau teh?','Kopi','Teh','Makanan & Minuman'],['Malam film atau malam bermain game?','Film','Game','Hiburan'],
  ['Telepon suara atau video?','Suara','Video','Kebiasaan Harian'],['Camilan manis atau asin?','Manis','Asin','Makanan & Minuman'],
  ['Liburan ke kota atau alam?','Kota','Alam','Perjalanan'],['Di rumah atau jalan-jalan?','Di rumah','Jalan-jalan','Gaya Hidup'],
  ['Kirim pesan dulu atau menelepon dulu?','Pesan','Telepon','Hubungan'],['Rencanakan semuanya atau spontan?','Terencana','Spontan','Gaya Hidup'],
  ['Bunga atau surat tulisan tangan?','Bunga','Surat','Hubungan'],['Kencan sarapan atau makan malam?','Sarapan','Makan malam','Ide Kencan'],
  ['Kucing atau anjing?','Kucing','Anjing','Acak & Lucu'],['Hari hujan atau cerah?','Hujan','Cerah','Gaya Hidup'],
  ['Komedi atau romantis?','Komedi','Romantis','Hiburan'],['Perjalanan darat atau pesawat?','Mobil','Pesawat','Perjalanan'],
  ['Memasak bersama atau pesan makanan?','Memasak','Pesan makanan','Ide Kencan'],['Museum atau taman hiburan?','Museum','Taman hiburan','Ide Kencan'],
  ['Pelukan lama atau kecupan di kening?','Pelukan','Kecupan','Hubungan'],['Pakaian serasi atau daftar putar serasi?','Pakaian','Musik','Acak & Lucu'],
  ['Panekuk atau wafel?','Panekuk','Wafel','Makanan & Minuman'],['Aktif pagi atau suka begadang?','Pagi','Begadang','Kebiasaan Harian'],
  ['Kencan di toko buku atau galeri seni?','Toko buku','Galeri seni','Ide Kencan'],['Hadiah kejutan atau kencan terencana?','Hadiah kejutan','Kencan terencana','Hubungan'],
  ['Perjalanan kereta atau mobil?','Kereta','Mobil','Perjalanan'],['Permainan papan atau gim video?','Permainan papan','Gim video','Hiburan'],
  ['Bunga segar atau tanaman kecil?','Bunga','Tanaman','Hubungan'],['Hidangan penutup rumahan atau kafe?','Rumahan','Kafe','Makanan & Minuman'],
  ['Kirim meme atau lagu?','Meme','Lagu','Kebiasaan Harian'],['Melihat bintang atau awan?','Bintang','Awan','Ide Kencan']
];
const TRUTH_BANK = [
  'Apa kesan pertamamu saat mengenal pasangan?', 'Hal kecil apa dari pasangan yang selalu membuatmu tersenyum?', 'Kenangan apa yang ingin kamu ulangi bersama?',
  'Apa yang paling kamu rindukan saat berjauhan?', 'Hal apa yang selalu ingin kamu coba bersama?', 'Apa kenangan favoritmu tentang kalian berdua?',
  'Kapan kamu merasa paling dekat dengan pasangan?', 'Lagu apa yang mengingatkanmu pada hubungan kalian?', 'Hal apa yang kamu hargai tetapi jarang kamu ungkapkan?',
  'Seperti apa hari pertama kalian bertemu kembali yang sempurna?', 'Kebiasaan lucu apa yang dimiliki pasanganmu?', 'Tempat mana yang ingin kamu kunjungi bersama?',
  'Apa camilan favoritmu saat kecil?', 'Keterampilan apa yang ingin kamu pelajari?', 'Apa yang membuatmu merasa diperhatikan?',
  'Apa satu hal yang kamu banggakan tahun ini?', 'Apa yang akan kamu masukkan ke dalam kapsul waktu hubungan kalian?', 'Seperti apa hari Minggu santai yang ideal bagimu?'
];
const DARE_BANK = [
  'Kirim pesan suara 10 detik dan sebutkan tiga hal yang kamu hargai dari pasangan.', 'Gambar potret kecil pasangan dalam 30 detik.', 'Buat cuplikan film dramatis 15 detik tentang kencan kalian berikutnya.',
  'Buat puisi cinta dua baris dengan kata bulan dan rumah.', 'Tunjukkan tarian kemenangan terbaikmu selama 10 detik.', 'Buat satu nama panggilan lucu dan jelaskan alasannya.',
  'Nyanyikan satu bagian lagu yang mengingatkanmu pada pasangan.', 'Gambarkan pasanganmu seolah-olah ia sebuah destinasi wisata.', 'Tirukan gaya pasanganmu dengan cara yang baik.',
  'Sebutkan lima barang yang akan kamu bawa untuk liburan kejutan akhir pekan.', 'Kirim foto benda di dekatmu yang mengingatkanmu pada pasangan (boleh dilewati).', 'Gunakan logat lucu untuk dua kalimat berikutnya.',
  'Ciptakan gerakan tos yang akan kalian coba saat bertemu.', 'Buat judul daftar putar mini untuk hubungan kalian.', 'Berikan tepuk tangan meriah secara virtual untuk pasangan.',
  'Ceritakan kisah 20 detik saat kalian berdua menjadi pahlawan super.', 'Pilih emoji yang menggambarkan harimu dan jelaskan alasannya.', 'Buat hati dari kertas dan tunjukkan ke kamera.'
];
const MEMORY_SYMBOLS = ['♡','✿','☾','☆','🌷','🧸','🍓','🌙','🎀','🦋','🍒','🪻','🐱','🐻','🍰','☁️','💌','🌼'];

const DEFAULTS = {
  lovequiz: { mode:'know', source:'both', categories:CATEGORIES, count:10 },
  thisorthat: { source:'both', categories:CATEGORIES, count:10 },
  truthordare: { mode:'self', source:'diri', categories:TD_CATEGORIES, intensity:'Manis', rounds:10 },
  memorycard: { mode:'duel', difficulty:'easy', deck:'diri' },
  drawguess: { difficulty:'mixed', rounds:6, seconds:90 },
  tebakkata: { mode:'classic', difficulty:'mixed', rounds:6, seconds:90 }
};

function publicPath(code, sessionId){ return `roomGames/${code}/${sessionId}/public`; }
function privatePath(code, gameId, sessionId, uid){ return `privateRooms/${code}/${gameId}/${sessionId}/${uid}`; }
function baseSetup(gameId, sessionId, players){
  return { gameId, sessionId, phase:'setup', settings:structuredClone(DEFAULTS[gameId]), approvals:{host:false,guest:false}, ready:{host:false,guest:false}, players, createdAt:Date.now(), matchNumber:1 };
}
function makeTttState(sessionId, players){
  const pair=rand([['♡','✿'],['☾','☆'],['🌷','🦋'],['🍓','🍒']]); return {gameId:'tictactoe',sessionId,phase:'playing',board:Array(9).fill(null),turnUid:rand([players.host.uid,players.guest.uid]),symbols:{[players.host.uid]:pair[0],[players.guest.uid]:pair[1]},scores:{[players.host.uid]:0,[players.guest.uid]:0,draw:0},round:1,matchNumber:1,moves:[],rematch:{host:false,guest:false}};
}
function makeConnectState(sessionId, players){
  return {gameId:'connectfour',sessionId,phase:'playing',board:Array(42).fill(null),turnUid:rand([players.host.uid,players.guest.uid]),theme:'pastel',scores:{[players.host.uid]:0,[players.guest.uid]:0,draw:0},moves:[],round:1,matchNumber:1,rematch:{host:false,guest:false}};
}
const isWinTtt = isTicTacToeWin;
const cfWinner = getConnectFourWin;
function quizDeck(settings, custom=[]){
  const cats=new Set(settings.categories?.length?settings.categories:CATEGORIES);
  let list=LOVE_BANK.filter(q=>cats.has(q[2])).map((q,i)=>({id:`love-${i}`,text:q[0],options:q[1],category:q[2]}));
  if(settings.source!=='custom') list=[...list]; else list=[];
  if(settings.source!=='diri') list.push(...custom.filter(x=>x.kind==='lovequiz'));
  const uniq=[...new Map(list.map(q=>[`${q.text}|${(q.options||[]).join('|')}`,q])).values()];
  return shuffle(uniq).slice(0,Math.max(1,Math.min(30,Number(settings.count)||10)));
}
function thisDeck(settings, custom=[]){
  const cats=new Set(settings.categories?.length?settings.categories:CATEGORIES);
  let list=THIS_OR_THAT_BANK.filter(q=>cats.has(q[3])).map((q,i)=>({id:`tot-${i}`,text:q[0],a:q[1],b:q[2],category:q[3]}));
  if(settings.source==='custom') list=[];
  if(settings.source!=='diri') list.push(...custom.filter(x=>x.kind==='thisorthat'));
  const uniq=[...new Map(list.map(q=>[`${q.text}|${q.a}|${q.b}`,q])).values()];
  return shuffle(uniq).slice(0,Math.max(1,Math.min(30,Number(settings.count)||10)));
}
function buildWordLevels(difficulty='mixed'){
  if(difficulty==='mixed') return shuffle(['easy','easy','medium','medium','hard','hard']);
  return Array(6).fill(['easy','medium','hard'].includes(difficulty)?difficulty:'easy');
}
function truthCards(settings, custom=[]){
  const cards=[]; if(settings.source!=='custom'){
    TRUTH_BANK.forEach((text,i)=>cards.push({id:`truth-${i}`,type:'truth',text,category:TD_CATEGORIES[i%TD_CATEGORIES.length],intensity:settings.intensity}));
    DARE_BANK.forEach((text,i)=>cards.push({id:`dare-${i}`,type:'dare',text,category:TD_CATEGORIES[i%TD_CATEGORIES.length],intensity:settings.intensity}));
  }
  if(settings.source!=='diri') cards.push(...custom.filter(x=>x.kind==='truthordare'));
  return shuffle(cards.filter(c=>settings.categories.includes(c.category)));
}
function createStartedState(old, players, custom=[]){
  const gameId=old.gameId, s=old.settings;
  if(gameId==='lovequiz') return {...old,phase:'question',questions:quizDeck(s,custom),questionIndex:0,turnIndex:0,submissions:{host:false,guest:false},nextReady:{host:false,guest:false},results:[],scores:{[players.host.uid]:0,[players.guest.uid]:0},matchPoints:0};
  if(gameId==='thisorthat') return {...old,phase:'question',questions:thisDeck(s,custom),questionIndex:0,submissions:{host:false,guest:false},nextReady:{host:false,guest:false},results:[],matchPoints:0,streak:0,bestStreak:0};
  if(gameId==='truthordare') return {...old,phase:'choose',round:1,initiatorUid:rand([players.host.uid,players.guest.uid]),cards:truthCards(s,custom),usedCardIds:[],skips:{[players.host.uid]:3,[players.guest.uid]:3},stats:{truth:{[players.host.uid]:0,[players.guest.uid]:0},dare:{[players.host.uid]:0,[players.guest.uid]:0},skips:{[players.host.uid]:0,[players.guest.uid]:0}},nextReady:{host:false,guest:false},currentCard:null,answerText:''};
  if(gameId==='memorycard'){
    const count={easy:8,medium:12,hard:18}[s.difficulty]||8; const by=s.imageHashesByUid||{}; const requestedCustom=s.deck==='custom'?count:Math.max(1,Math.floor(count/2)); const same=hasMatchingImageDeck(by[players.host.uid],by[players.guest.uid],requestedCustom);
    const customCount=s.deck==='custom'?count:(s.deck==='mixed'&&same?Math.min(requestedCustom,by[players.host.uid].length):0); const useImages=customCount>0; const customEntries=useImages?(by[players.host.uid]||[]).slice(0,customCount).map(hash=>({symbol:'',imageHash:hash})):[]; const presetEntries=shuffle(MEMORY_SYMBOLS).slice(0,count-customCount).map(symbol=>({symbol,imageHash:null})); const syms=[...customEntries,...presetEntries];
    const cards=shuffle(syms.flatMap((entry,i)=>[{id:`${i}a`,pairId:i,...entry},{id:`${i}b`,pairId:i,...entry}])).map(x=>({...x,faceUp:false,matched:false}));
    return {...old,phase:'playing',board:cards,customImagesUsed:useImages,turnUid:rand([players.host.uid,players.guest.uid]),openIds:[],scores:{[players.host.uid]:0,[players.guest.uid]:0},pairsFound:0,attempts:0,moves:0,mismatchAt:0,rematch:{host:false,guest:false}};
  }
  if(gameId==='drawguess'){
    const wordLevels=buildWordLevels(s.difficulty); const first=rand([players.host.uid,players.guest.uid]);
    return {...old,phase:'waiting-word',round:1,rounds:6,seconds:90,wordLevels,drawerUid:first,guesserUid:first===players.host.uid?players.guest.uid:players.host.uid,startedAt:null,deadline:null,strokes:[],guesses:[],hintUsed:false,hintRequests:{},hintDelivered:{},hintTextByUid:{},result:null,scores:{[players.host.uid]:0,[players.guest.uid]:0},roundResults:[]};
  }
  if(gameId==='tebakkata'){
    const wordLevels=buildWordLevels(s.difficulty); const first=rand([players.host.uid,players.guest.uid]);
    return {...old,phase:'waiting-word',round:1,rounds:6,seconds:90,wordLevels,clueUid:first,guesserUid:first===players.host.uid?players.guest.uid:players.host.uid,deadline:null,startedAt:null,clues:[],guesses:[],hintUsed:false,hintRequests:{},hintDelivered:{},hintTextByUid:{},skips:{[players.host.uid]:2,[players.guest.uid]:2},scores:{[players.host.uid]:0,[players.guest.uid]:0},roundResults:[]};
  }
  return old;
}

export function mountGame(root, context){
  const {code,session,room,role,player,onBack,toast=()=>{}}=context;
  const gameId=session.gameId, sessionId=session.sessionId, myUid=player.uid;
  const players={host:room.host,guest:room.guest};
  const stateRef=ref(db,publicPath(code,sessionId));
  let state=null, localSecret='', localSecretData=null, localHint='', localItems=[], busy=false, timer=0, unsubscribe=null, drawCanvasCleanup=null, memoryMismatchTimer=0, lastRoomTouch=0, memoryUrls={}, serverOffset=0, preparingSecret=false, lastRoundSeen=0, drawColor='#34303c';
  const cleanup=()=>{ if(unsubscribe)unsubscribe(); if(timer)clearInterval(timer); if(memoryMismatchTimer)clearTimeout(memoryMismatchTimer); if(drawCanvasCleanup)drawCanvasCleanup(); Object.values(memoryUrls).forEach(URL.revokeObjectURL); root.removeEventListener('click',clickHandler);root.removeEventListener('submit',submitHandler);root.removeEventListener('change',changeHandler); };
  root.addEventListener('click',clickHandler); root.addEventListener('submit',submitHandler); root.addEventListener('change',changeHandler);

  async function init(){
    try{
      try {
        localItems=await getLocalCollection(`custom-${gameId}`);
      } catch (storageError) {
        // Built-in games do not depend on local collections. Keep the session playable
        // when browser storage is disabled; custom libraries remain unavailable.
        localItems=[];
        toast('Penyimpanan lokal tidak tersedia. Permainan bawaan tetap dapat dimainkan, tetapi koleksi pribadi tidak dapat digunakan pada peramban ini.','error');
      }
      try { const offsetSnap=await get(ref(db,'.info/serverTimeOffset')); serverOffset=Number(offsetSnap.val())||0; } catch {}
      const snap=await get(stateRef);
      if(!snap.exists() && role==='host'){
        const initial=gameId==='tictactoe'?makeTttState(sessionId,players):gameId==='connectfour'?makeConnectState(sessionId,players):baseSetup(gameId,sessionId,players);
        await set(stateRef,initial);
      }
      unsubscribe=onValue(stateRef,s=>{
        const incoming=s.val(); if(!incoming){state=null;renderMissing();return;}
        if(incoming.round && incoming.round!==lastRoundSeen){lastRoundSeen=incoming.round;localHint='';localSecret='';localSecretData=null;}
        state=incoming;
        if(state.gameId==='memorycard') void hydrateMemoryMedia();
        if(state.gameId==='memorycard' && state.mismatchAt && state.openIds?.length===2) scheduleMemoryMismatch();
        render();
        if(state.gameId==='drawguess'||state.gameId==='tebakkata') void onSecretGameUpdate();
        if((state.gameId==='drawguess'||state.gameId==='tebakkata')&&state.hintDelivered?.[myUid]) void loadLocalHint();
        if(state.gameId==='lovequiz' && state.submissions?.host && state.submissions?.guest && state.phase==='question') void resolveLoveQuestion();
        if(state.gameId==='thisorthat' && state.submissions?.host && state.submissions?.guest && state.phase==='question') void resolveThisQuestion();
      },e=>toast('Koneksi permainan bermasalah: '+e.message,'error'));
    }catch(e){toast('Permainan gagal disiapkan: '+e.message,'error');}
  }
  function missingHtml(){return `<section class="panel game-panel"><h1>Sesi permainan belum siap</h1><p>Pembuat ruang belum membuat sesi permainan. Minta pembuat ruang kembali ke lobi lalu mulai ulang.</p><button class="button" data-action="back-room">Kembali ke lobi</button></section>`;}
  function renderMissing(){root.innerHTML=missingHtml();}
  async function updateState(mutator){
    const result = await runTransaction(stateRef,current=>{ if(!current)return; const next=structuredClone(current); const outcome=mutator(next,current); if(outcome===false)return; return next; },{applyLocally:false});
    if(Date.now()-lastRoomTouch>60000){lastRoomTouch=Date.now();void update(ref(db,`rooms/${code}/lastMeaningfulActivityAt`),serverTimestamp()).catch(()=>{});}
    return result;
  }
  async function setPrivate(key,value,uid=myUid){ await set(ref(db,`${privatePath(code,gameId,sessionId,uid)}/${key}`),value); }
  async function getPrivate(key,uid=myUid){ const s=await get(ref(db,`${privatePath(code,gameId,sessionId,uid)}/${key}`)); return s.val(); }
  async function getAllPrivate(uid){ const s=await get(ref(db,privatePath(code,gameId,sessionId,uid))); return s.val()||{}; }
  const myRole=role;
  function render(){
    if(!state)return;
    if(state.phase==='setup'){root.innerHTML=renderSetup();return;}
    if(gameId==='tictactoe')root.innerHTML=renderTtt();
    else if(gameId==='connectfour')root.innerHTML=renderConnect();
    else if(gameId==='lovequiz')root.innerHTML=renderLove();
    else if(gameId==='thisorthat')root.innerHTML=renderThis();
    else if(gameId==='truthordare')root.innerHTML=renderTruthDare();
    else if(gameId==='memorycard')root.innerHTML=renderMemory();
    else if(gameId==='drawguess') {if(drawCanvasCleanup){drawCanvasCleanup();drawCanvasCleanup=null;}root.innerHTML=renderDrawGuess(); attachDrawCanvas();}
    else if(gameId==='tebakkata')root.innerHTML=renderTebakKata();
    else root.innerHTML=`<section class="panel game-panel"><h1>Permainan tidak dikenal</h1></section>`;
    if((gameId==='drawguess'||gameId==='tebakkata')&&state.phase==='playing')startClock();
  }
  function playerName(uid){return Object.values(players).find(p=>p?.uid===uid)?.name||'Pemain';}
  function playerPill(uid){return `<span class="player-pill">${esc(playerName(uid))}</span>`;}
  function topBar(sub='Permainan kecil untuk berdua'){const gameLabels={tictactoe:'TIGA SERANGKAI',lovequiz:'KUIS CINTA',thisorthat:'PILIH SALAH SATU',truthordare:'JUJUR ATAU TANTANGAN',memorycard:'KARTU MEMORI',connectfour:'EMPAT BERDERET',drawguess:'GAMBAR DAN TEBAK',tebakkata:'TEBAK KATA'};return `<div class="game-topbar"><div><span class="eyebrow">Diri. · ${gameLabels[gameId]||'PERMAINAN'}</span><h1>${esc(({tictactoe:'Tiga Serangkai',lovequiz:'Kuis Cinta',thisorthat:'Pilih Salah Satu',truthordare:'Jujur atau Tantangan',memorycard:'Kartu Memori',connectfour:'Empat Berderet',drawguess:'Gambar dan Tebak',tebakkata:'Tebak Kata'})[gameId])}</h1><p>${esc(sub)}</p></div><div class="game-top-actions"><span class="room-code-mini">${esc(code)}</span>${role==='host'?'<button class="button button-quiet" data-action="back-room">Kembali ke lobi</button>':'<span class="ready-chip">Menunggu pembuat ruang</span>'}</div></div>`;}
  function renderSetup(){
    const s=state.settings||DEFAULTS[gameId], approved=state.approvals||{};
    let controls='';
    const select=(label,key,options)=>`<label>${label}<select data-setting="${key}">${options.map(([value,text])=>`<option value="${value}" ${s[key]===value?'selected':''}>${text}</option>`).join('')}</select></label>`;
    const number=(label,key,min,max)=>`<label>${label}<input data-setting="${key}" type="number" min="${min}" max="${max}" value="${Number(s[key]??min)}"></label>`;
    if(gameId==='lovequiz') controls=select('Mode permainan','mode',[['know','Seberapa Kenal Kamu denganku?'],['compat','Seberapa Cocok Kita?']])+select('Sumber pertanyaan','source',[['diri','Koleksi DiRi'],['custom','Pertanyaan buatan sendiri'],['both','Gabungan']])+number('Jumlah pertanyaan','count',1,30);
    if(gameId==='thisorthat') controls=select('Sumber pertanyaan','source',[['diri','Koleksi DiRi'],['custom','Pertanyaan buatan sendiri'],['both','Gabungan']])+number('Jumlah pertanyaan','count',1,30);
    if(gameId==='truthordare') controls=select('Mode permainan','mode',[['self','Pilih sendiri'],['partner','Tantangan untuk pasangan']])+select('Suasana permainan','intensity',[['Manis','Manis'],['Lucu','Lucu'],['Mendalam','Mendalam'],['Tantangan','Penuh tantangan']])+select('Sumber kartu','source',[['diri','Koleksi DiRi'],['custom','Kartu buatan sendiri'],['mixed','Gabungan']])+number('Jumlah ronde','rounds',1,20);
    if(gameId==='memorycard') controls=select('Mode permainan','mode',[['duel','Adu ingatan'],['together','Main bersama']])+select('Kesulitan','difficulty',[['easy','Mudah · 4×4'],['medium','Sedang · 4×6'],['hard','Sulit · 6×6']])+select('Jenis kartu','deck',[['diri','Kartu bawaan DiRi'],['custom','Foto pribadi'],['mixed','Gabungan foto dan kartu']]);
    if(gameId==='drawguess') controls=select('Kesulitan kata','difficulty',[['easy','Mudah'],['medium','Sedang'],['hard','Sulit'],['mixed','Campuran']])+`<div class="field-note">6 ronde · 90 detik setiap ronde · 1 petunjuk per ronde.</div>`;
    if(gameId==='tebakkata') controls=select('Mode permainan','mode',[['classic','Petunjuk biasa'],['forbidden','Kata terlarang']])+select('Kesulitan kata','difficulty',[['easy','Mudah'],['medium','Sedang'],['hard','Sulit'],['mixed','Campuran']])+`<div class="field-note">6 ronde · 90 detik setiap ronde · masing-masing pemain memiliki 2 kesempatan lewati kata.</div>`;
    const categoryOptions=(gameId==='truthordare'?TD_CATEGORIES:CATEGORIES).map(c=>`<label class="check-option"><input type="checkbox" data-category="${esc(c)}" ${s.categories?.includes(c)?'checked':''}>${esc(c)}</label>`).join('');
    const categoryBlock=['lovequiz','thisorthat','truthordare'].includes(gameId)?`<div class="field-group"><span class="field-label">Pilih kategori</span><div class="category-checks">${categoryOptions}</div></div>`:'';
    const customLabel=gameId==='lovequiz'?'Pertanyaan|Opsi A|Opsi B|Opsi C|Opsi D':gameId==='thisorthat'?'Pertanyaan|Opsi A|Opsi B':gameId==='truthordare'?'tantangan atau jujur|Teks tantangan atau pertanyaan':gameId==='drawguess'?'Kata|mudah/sedang/sulit':gameId==='tebakkata'?'Kata|mudah/sedang/sulit|kata-terlarang1,kata-terlarang2|jawaban-alternatif1,jawaban-alternatif2':'Kata rahasia';
    const memoryUpload=gameId==='memorycard'?`<div class="custom-library-box"><strong>Album Kenangan · Foto pribadi</strong><p>Untuk memakai foto sendiri, kedua perangkat perlu memilih file gambar yang sama dengan urutan yang sama. File disimpan lokal di perangkat; database hanya menyimpan sidik file.</p><input type="file" accept="image/*" multiple data-memory-files><small>Maksimal 18 gambar. Jumlah minimum mengikuti tingkat kesulitan dan kedua pemain harus memiliki daftar gambar yang identik.</small></div>`:'';
    const addCustom=['lovequiz','thisorthat','truthordare','drawguess','tebakkata'].includes(gameId)?`<div class="custom-library-box"><strong>Koleksi Pribadi</strong><p>Tambahkan pertanyaan, tantangan, atau kata ke koleksi peramban ini. Bagikan ke ruang sebelum permainan dimulai.</p><form data-form="custom-item"><input name="customText" placeholder="${esc(customLabel)}" required><button class="button button-small button-secondary" type="submit">Simpan ke koleksi</button></form><button class="button button-small button-quiet" data-action="share-custom">Bagikan koleksi (${localItems.length})</button><button class="button button-small button-quiet" data-action="export-custom">Ekspor JSON</button><label class="button button-small button-quiet file-button">Impor JSON<input type="file" accept="application/json,.json" data-import-custom hidden></label><small>${localItems.length} item tersimpan di perangkat ini. ${['drawguess','tebakkata'].includes(gameId)?'Daftar kata setiap pemain tetap privat.':''}</small></div>`:'';
    return `${topBar('Atur permainan bersama sebelum ronde pertama dimulai.')}<section class="panel game-panel setup-panel"><div class="setup-heading"><span class="game-symbol">♡</span><div><h2>Pengaturan permainan</h2><p>Kalian berdua dapat mengubah pengaturan yang sama. Setiap perubahan langsung tersinkron ke perangkat pasangan.</p></div></div><div class="setup-grid">${controls}</div>${categoryBlock}${memoryUpload}${addCustom}<div class="approval-grid"><div><strong>Pembuat</strong><span class="ready-chip ${approved.host?'done':''}">${approved.host?'Sudah menyetujui':'Belum menyetujui'}</span></div><div><strong>Tamu</strong><span class="ready-chip ${approved.guest?'done':''}">${approved.guest?'Sudah menyetujui':'Belum menyetujui'}</span></div></div><div class="ready-panel"><div class="ready-copy"><strong>${approved.host&&approved.guest?'Keduanya sudah setuju':'Menunggu persetujuan bersama'}</strong><span>${role==='host'?'Pembuat ruang dapat memulai setelah kalian berdua menyetujui.':'Periksa pengaturan, lalu berikan persetujuan.'}</span></div><div class="ready-actions"><button class="button button-secondary" data-action="approve-setup">${approved[role]?'Batalkan persetujuan':'Setujui pengaturan'}</button>${role==='host'?`<button class="button button-primary" data-action="start-session" ${approved.host&&approved.guest?'':'disabled'}>Mulai permainan</button>`:''}</div></div></section>`;
  }
  function renderTtt(){
    const board=state.board||Array(9).fill(null), winner=state.winnerUid, finished=state.phase==='result';
    const cells=board.map((v,i)=>`<button class="ttt-cell ${v?'filled':''}" data-action="ttt-move" data-index="${i}" ${v||finished||state.turnUid!==myUid?'disabled':''}>${v||''}</button>`).join('');
    const status=finished?(winner?`${esc(playerName(winner))} menang di ronde ini`:'Permainan berakhir seri'):`Giliran ${esc(playerName(state.turnUid))}`;
    return `${topBar('Susun tiga simbol dalam satu baris untuk memenangkan ronde.')}<section class="panel game-panel"><div class="game-status-line">${status}</div><div class="ttt-board">${cells}</div><div class="score-line">${Object.entries(state.scores||{}).filter(([uid])=>uid!=='draw').map(([uid,n])=>`<span>${esc(playerName(uid))}: <b>${n}</b></span>`).join('')}<span>Seri: <b>${state.scores?.draw||0}</b></span></div>${finished?renderRematch():`<p class="hint">Simbolmu adalah ${state.symbols?.[myUid]||'?'} . Tunggu giliran jika pasangan sedang bermain.</p>`}</section>`;
  }
  function renderConnect(){
    const finished=state.phase==='result'; const board=state.board||Array(42).fill(null);
    const columns=Array.from({length:7},(_,column)=>`<button class="cf-column" data-action="cf-drop" data-col="${column}" ${finished||state.turnUid!==myUid||Boolean(board[column])?'disabled':''} aria-label="Jatuhkan keping ke kolom ${column+1}">${Array.from({length:6},(_,row)=>{const value=board[row*7+column];return `<span class="cf-slot ${value?'filled '+(value===players.host.uid?'host-token':'guest-token'):''}">${value?(state.theme==='heart'?'♥':'●'):''}</span>`;}).join('')}</button>`).join('');
    const status=finished?(state.winnerUid?`${esc(playerName(state.winnerUid))} menang!`:'Permainan berakhir seri'):`Giliran ${esc(playerName(state.turnUid))}`;
    return `${topBar('Susun empat keping secara berurutan, mendatar, tegak, atau diagonal.')}<section class="panel game-panel"><div class="game-status-line">${status}</div><div class="cf-board">${columns}</div><div class="score-line">${Object.entries(state.scores||{}).filter(([uid])=>uid!=='draw').map(([uid,n])=>`<span>${esc(playerName(uid))}: <b>${n}</b></span>`).join('')}<span>Seri: <b>${state.scores?.draw||0}</b></span></div><button class="button button-small button-quiet" data-action="toggle-cf-theme">${state.theme==='heart'?'Gunakan keping pastel':'Gunakan tema hati'}</button>${finished?renderRematch():''}</section>`;
  }
  function renderRematch(){return `<div class="rematch-box"><p>Permainan ulang hanya dimulai setelah kalian berdua menyetujuinya.</p><div class="approval-grid"><span>Pembuat ${state.rematch?.host?'✓':'menunggu'}</span><span>Tamu ${state.rematch?.guest?'✓':'menunggu'}</span></div><button class="button button-primary" data-action="request-rematch">${state.rematch?.[role]?'Batalkan permainan ulang':'Setujui permainan ulang'}</button></div>`;}
  function renderLove(){
    if(state.phase==='result') return `${topBar('Lihat seberapa baik kalian saling mengenal.')}<section class="panel game-panel"><h2>Kuis Cinta selesai ♡</h2>${state.settings.mode==='compat'?`<div class="big-score">${Math.round((state.matchPoints||0)/(state.results?.length||1)*100)}%</div><p>Persentase kecocokan: ${state.matchPoints||0} jawaban sama dari ${state.results?.length||0} pertanyaan.</p>`:`<p>Tebakan yang benar: ${state.matchPoints||0}</p><p>${state.results?.length||0} jawaban telah dibuka dalam dua giliran.</p>`}${(state.results||[]).map((result,index)=>`<div class="result-row"><strong>${index+1}. ${esc(result.question)}</strong><span>${esc(result.label||'Jawaban dibuka')}</span></div>`).join('')}${renderRematch()}</section>`;
    const question=state.questions?.[state.questionIndex]; if(!question)return `<section class="panel game-panel"><p>Menyiapkan pertanyaan…</p></section>`;
    const targetUid=state.settings.mode==='know'?(state.turnIndex===0?players.host.uid:players.guest.uid):null;
    const isTarget=targetUid===myUid, submitted=state.submissions?.[role], reveal=state.currentResult;
    const revealHtml=reveal?`<div class="result-card"><span class="eyebrow">JAWABAN DIBUKA</span><h3>${esc(reveal.question)}</h3><p>Pembuat: <b>${esc(reveal.hostAnswer)}</b></p><p>Tamu: <b>${esc(reveal.guestAnswer)}</b></p><strong>${reveal.match?'Jawaban sama! +1 poin kecocokan':'Jawaban berbeda. Ceritakan alasan pilihan kalian!'}</strong></div>`:'';
    const subtitle=state.settings.mode==='know'?(isTarget?'Giliranmu menjawab tentang dirimu.':`Tebak pilihan ${playerName(targetUid)}.`):'Kalian menjawab secara terpisah. Jawaban dibuka setelah keduanya mengirim.';
    return `${topBar(subtitle)}<section class="panel game-panel"><div class="progress-label">Pertanyaan ${state.questionIndex+1} dari ${state.questions.length} · Sesi ${state.settings.mode==='know'?state.turnIndex+1:1}</div><h2 class="question-title">${esc(question.text)}</h2><div class="answer-options">${(question.options||[]).map((option,index)=>`<button class="answer-option" data-action="quiz-answer" data-answer="${index}" ${submitted||reveal?'disabled':''}>${String.fromCharCode(65+index)}. ${esc(option)}</button>`).join('')}</div>${submitted&&!reveal?'<p class="waiting-note">Jawabanmu sudah terkunci. Menunggu pasangan…</p>':''}${revealHtml}${reveal?`<button class="button button-primary" data-action="next-question">${state.questionIndex===state.questions.length-1&&!(state.settings.mode==='know'&&state.turnIndex===0)?'Selesaikan kuis':'Pertanyaan berikutnya'}</button>`:''}<p class="hint">Jawaban tetap tersembunyi sampai kalian berdua mengirim pilihan.</p></section>`;
  }
  function renderThis(){
    if(state.phase==='result') return `${topBar('Lihat kesamaan pilihan kalian.')}<section class="panel game-panel"><h2>Skor kecocokan kalian ♡</h2><div class="big-score">${Math.round((state.matchPoints||0)/(state.questions?.length||1)*100)}%</div><p>${state.matchPoints||0} dari ${state.questions?.length||0} pilihan sama · Rentetan terpanjang ${state.bestStreak||0}</p>${(state.results||[]).map((result,index)=>`<div class="result-row"><strong>${index+1}. ${esc(result.question)}</strong><span>${result.match?'♡ Cocok':'Pilihan berbeda'}</span></div>`).join('')}${renderRematch()}</section>`;
    const question=state.questions?.[state.questionIndex]; if(!question)return `${topBar()}<section class="panel game-panel">Menyiapkan…</section>`;
    const submitted=state.submissions?.[role], reveal=state.currentResult;
    return `${topBar('Satu pertanyaan, dua pilihan. Buka jawabannya bersama.')}<section class="panel game-panel"><div class="progress-label">Pertanyaan ${state.questionIndex+1} dari ${state.questions.length}</div><h2 class="question-title">${esc(question.text)}</h2><div class="two-choice-grid"><button class="choice-card" data-action="this-answer" data-answer="0" ${submitted||reveal?'disabled':''}><span>A</span><strong>${esc(question.a)}</strong></button><button class="choice-card lavender" data-action="this-answer" data-answer="1" ${submitted||reveal?'disabled':''}><span>B</span><strong>${esc(question.b)}</strong></button></div>${submitted&&!reveal?'<p class="waiting-note">Pilihanmu sudah terkunci. Menunggu pasangan…</p>':''}${reveal?`<div class="result-card"><strong>${reveal.match?'Pilihan kalian sama! +1 poin kecocokan.':'Pilihan berbeda. Ceritakan alasan kalian!'}</strong><p>Pembuat: ${reveal.hostAnswer==='0'?esc(question.a):esc(question.b)}</p><p>Tamu: ${reveal.guestAnswer==='0'?esc(question.a):esc(question.b)}</p><p>Rentetan kecocokan saat ini: ${reveal.streak}</p></div><button class="button button-primary" data-action="next-question">${state.questionIndex===state.questions.length-1?'Selesaikan permainan':'Pertanyaan berikutnya'}</button>`:''}</section>`;
  }
  function renderTruthDare(){
    if(state.phase==='result') return `${topBar('Cerita, kejutan, dan tantangan seru.')}<section class="panel game-panel"><h2>Jujur atau Tantangan selesai ✨</h2><p>Pertanyaan jujur dijawab: ${Object.values(state.stats.truth).reduce((a,b)=>a+b,0)}</p><p>Tantangan diselesaikan: ${Object.values(state.stats.dare).reduce((a,b)=>a+b,0)}</p><p>Dilewati: ${Object.values(state.stats.skips).reduce((a,b)=>a+b,0)}</p>${renderRematch()}</section>`;
    const initiator=state.initiatorUid===myUid, card=state.currentCard, targetUid=card?.targetUid||state.initiatorUid;
    const isTarget=targetUid===myUid;
    const skipButton=isTarget&&state.phase==='response'?`<button class="button button-quiet" data-action="td-skip" ${state.skips?.[myUid]===0?'disabled':''}>Lewati kartu (${state.skips?.[myUid]||0} tersisa)</button>`:'';
    const nextStatus=`<p class="small-note">Giliran berikutnya · Pembuat ${state.nextReady?.host?'siap':'menunggu'} · Tamu ${state.nextReady?.guest?'siap':'menunggu'}</p>`;
    return `${topBar(`Ronde ${state.round} dari ${state.settings.rounds} · ${state.settings.mode==='self'?'Pilih sendiri':'Tantangan untuk pasangan'}`)}<section class="panel game-panel"><div class="game-status-line">${initiator?'Giliranmu memilih kartu.':`${esc(playerName(state.initiatorUid))} sedang memilih kartu.`}</div><div class="skip-line">Kesempatanmu: ${state.skips?.[myUid]??0} · Pasangan: ${state.skips?.[players[opposite(role)]?.uid]??0}</div>${state.phase==='choose'?`<div class="answer-options"><button class="answer-option" data-action="td-type" data-type="truth" ${!initiator||!state.cards?.some(item=>item.type==='truth')?'disabled':''}>♡ Jujur</button><button class="answer-option" data-action="td-type" data-type="dare" ${!initiator||!state.cards?.some(item=>item.type==='dare')?'disabled':''}>✧ Tantangan</button></div><p class="small-note">Kartu akan diacak kembali setelah habis, selama masih tersedia dari jenis yang dipilih.</p>`:`<div class="result-card"><span class="eyebrow">${card.type==='truth'?'JUJUR':'TANTANGAN'} · ${esc(card.category)}</span><h2>${esc(card.text)}</h2><p>Untuk: ${esc(playerName(targetUid))}</p>${state.phase==='response'&&isTarget?(card.type==='truth'?`<form data-form="td-response"><textarea name="response" placeholder="Tulis jawabanmu…" required></textarea><button class="button button-primary" type="submit">Kirim jawaban</button></form>`:`<button class="button button-primary" data-action="td-done">Saya sudah melakukannya!</button>`):state.phase==='response'?'<p class="waiting-note">Menunggu pasangan menyelesaikan kartu…</p>':`<p>${esc(state.lastResponse||'Ronde selesai.')}</p>${nextStatus}<button class="button button-primary" data-action="td-next" ${state.nextReady?.[role]?'disabled':''}>${state.nextReady?.[role]?'Menunggu pasangan…':'Lanjutkan'}</button>`}${skipButton}</div>`}</section>`;
  }
  function renderMemory(){
    const total=state.board?.length||0, done=state.pairsFound||0, finished=state.phase==='result';
    return `${topBar(`${state.settings.mode==='duel'?'Adu Ingatan':'Mode Bersama'} · ${({easy:'MUDAH',medium:'SEDANG',hard:'SULIT'})[state.settings.difficulty]||'MUDAH'}`)}<section class="panel game-panel"><div class="game-status-line">${finished?'Semua pasangan kartu ditemukan!':`Giliran ${esc(playerName(state.turnUid))} · Pasangan ${done} dari ${total/2}`}</div><div class="memory-board diff-${state.settings.difficulty}">${(state.board||[]).map((card,index)=>{const face=card.matched||card.faceUp;const media=face&&card.imageHash?memoryUrls[card.imageHash]:null;return `<button class="memory-card ${card.matched?'matched':''} ${card.faceUp?'face-up':''}" data-action="memory-flip" data-index="${index}" ${card.matched||card.faceUp||state.phase!=='playing'||state.turnUid!==myUid||state.openIds?.length>=2?'disabled':''}>${face?(media?`<img src="${media}" alt="Kartu memori">`:esc(card.symbol||'♡')):'♡'}</button>`;}).join('')}</div><p class="hint">${state.customImagesUsed?'Album Kenangan aktif.':'Kartu bawaan DiRi aktif. Untuk memakai foto pribadi, kedua pemain harus mengimpor file yang sama sebelum memulai.'}</p><div class="score-line">${state.settings.mode==='duel'?Object.entries(state.scores||{}).map(([uid,n])=>`<span>${esc(playerName(uid))}: <b>${n}</b></span>`).join(''):`Jumlah percobaan: ${state.attempts||0}`}</div>${finished?renderRematch():''}</section>`;
  }
  function renderDrawGuess(){
    if(state.phase==='result-game') return `${topBar('Setiap gambar menyimpan cerita kecil.')}<section class="panel game-panel"><h2>Gambar dan Tebak selesai</h2><p>${esc(playerName(players.host.uid))}: ${state.scores?.[players.host.uid]||0} · ${esc(playerName(players.guest.uid))}: ${state.scores?.[players.guest.uid]||0}</p>${renderRematch()}</section>`;
    const drawer=state.drawerUid===myUid, remaining=Math.max(0,Math.ceil(((state.deadline||Date.now()+serverOffset)-(Date.now()+serverOffset))/1000));
    const secret=drawer?localSecret:'Kata rahasia disembunyikan';
    const resultBlock=state.phase==='round-result'?`<div class="result-card"><strong>${esc(state.result?.word||'Ronde selesai')}</strong><p>${esc(state.result?.message||'')}</p><p class="small-note">Ronde berikutnya · Pembuat ${state.nextReady?.host?'siap':'menunggu'} · Tamu ${state.nextReady?.guest?'siap':'menunggu'}</p><button class="button button-primary" data-action="round-next" ${state.nextReady?.[role]?'disabled':''}>${state.nextReady?.[role]?'Menunggu pasangan…':'Siap ke ronde berikutnya'}</button></div>`:'';
    const controls=state.phase==='playing'?(drawer?`<div class="draw-tools"><button class="button button-small" data-color="#34303c">Hitam</button><button class="button button-small" data-color="#e28db4">Merah muda</button><button class="button button-small" data-color="#9b8bd0">Lavender</button><button class="button button-small" data-action="draw-undo">Urungkan</button><button class="button button-small" data-action="draw-clear">Bersihkan</button></div>`:`<form data-form="draw-guess"><input name="guess" placeholder="Tebak kata…" required><button class="button button-primary" type="submit">Kirim tebakan</button></form><button class="button button-small button-quiet" data-action="draw-hint" ${state.hintUsed?'disabled':''}>Petunjuk (${state.hintUsed?'sudah dipakai':'1 tersedia'})</button>${localHint?`<p class="hint">Petunjuk: ${esc(localHint)}</p>`:''}`):'';
    return `${topBar(`Ronde ${state.round} dari 6 · ${drawer?'Giliranmu menggambar':'Giliranmu menebak'}`)}<section class="panel game-panel"><div class="game-status-line">${drawer?`Gambarkan: ${esc(secret||'Menyiapkan kata rahasia…')}`:`Kategori: ${esc(state.category||'Acak')}`} · <b data-timer>${remaining} detik</b></div><canvas id="draw-canvas" width="900" height="500" class="draw-canvas"></canvas>${controls}<div class="score-line">${Object.entries(state.scores||{}).map(([uid,n])=>`<span>${esc(playerName(uid))}: <b>${n}</b></span>`).join('')}</div>${resultBlock}</section>`;
  }
  function renderTebakKata(){
    if(state.phase==='result-game')return `${topBar('Temukan kata melalui petunjuk.')}<section class="panel game-panel"><h2>Permainan Tebak Kata selesai</h2><p>${esc(playerName(players.host.uid))}: ${state.scores?.[players.host.uid]||0} · ${esc(playerName(players.guest.uid))}: ${state.scores?.[players.guest.uid]||0}</p>${renderRematch()}</section>`;
    const clue=state.clueUid===myUid, remaining=Math.max(0,Math.ceil(((state.deadline||Date.now()+serverOffset)-(Date.now()+serverOffset))/1000));
    const resultBlock=state.phase==='round-result'?`<div class="result-card"><strong>${esc(state.result?.word||'Ronde selesai')}</strong><p>${esc(state.result?.message||'')}</p><p class="small-note">Ronde berikutnya · Pembuat ${state.nextReady?.host?'siap':'menunggu'} · Tamu ${state.nextReady?.guest?'siap':'menunggu'}</p><button class="button button-primary" data-action="round-next" ${state.nextReady?.[role]?'disabled':''}>${state.nextReady?.[role]?'Menunggu pasangan…':'Siap ke ronde berikutnya'}</button></div>`:'';
    const forbidden=(localSecretData?.forbidden?.length?localSecretData.forbidden:FORBIDDEN_WORDS[localSecret]||[]);
    const active=state.phase==='playing'?(clue?`<div class="result-card"><span class="eyebrow">KATA RAHASIA</span><h2>${esc(localSecret||'Menyiapkan…')}</h2>${state.settings.mode==='forbidden'?`<p>Kata yang tidak boleh disebut: ${esc([localSecret,...forbidden].filter(Boolean).join(', '))}</p>`:''}</div><form data-form="tebak-clue"><input name="clue" placeholder="Tulis petunjuk untuk pasangan…" required><button class="button button-primary" type="submit">Kirim petunjuk</button></form><button class="button button-small button-quiet" data-action="tebak-skip" ${!state.skips?.[myUid]?'disabled':''}>Lewati kata (${state.skips?.[myUid]||0} tersisa)</button>`:`<div class="clue-list">${(state.clues||[]).map(item=>`<p>${esc(item.text)}</p>`).join('')}</div><form data-form="tebak-guess"><input name="guess" placeholder="Tebak kata…" required><button class="button button-primary" type="submit">Kirim tebakan</button></form><button class="button button-small button-quiet" data-action="tebak-hint" ${state.hintUsed?'disabled':''}>Petunjuk (${state.hintUsed?'sudah dipakai':'1 tersedia'})</button>${localHint?`<p class="hint">Petunjuk: ${esc(localHint)}</p>`:''}<button class="button button-small button-quiet" data-action="tebak-giveup" ${!state.skips?.[myUid]?'disabled':''}>Menyerah (${state.skips?.[myUid]||0} tersisa)</button>`):'';
    return `${topBar(`Ronde ${state.round} dari 6 · ${clue?'Giliranmu memberi petunjuk':'Giliranmu menebak'}`)}<section class="panel game-panel"><div class="game-status-line"><b data-timer>${remaining} detik</b> · ${state.settings.mode==='forbidden'?'Kata Terlarang':'Petunjuk Bebas'}</div>${active}<div class="skip-line">Kesempatan lewati kata: ${state.skips?.[myUid]||0}</div>${resultBlock}<div class="score-line">${Object.entries(state.scores||{}).map(([uid,n])=>`<span>${esc(playerName(uid))}: <b>${n}</b></span>`).join('')}</div></section>`;
  }
  async function handleSetupChange(element){
    if(!element)return;
    const settingKey=element.dataset.setting;
    const category=element.dataset.category;
    await updateState(s=>{
      if(s.phase!=='setup')return false;
      s.settings=s.settings||structuredClone(DEFAULTS[gameId]||{});
      if(settingKey){
        let value=element.type==='number'?Number(element.value):element.value;
        if(settingKey==='count')value=Math.max(1,Math.min(30,Math.round(value||10)));
        if(settingKey==='rounds')value=Math.max(1,Math.min(20,Math.round(value||1)));
        if(['mode','source','difficulty','deck','intensity'].includes(settingKey))value=String(value);
        s.settings[settingKey]=value;
      }
      if(category){
        const defaults=gameId==='truthordare'?TD_CATEGORIES:CATEGORIES;
        const selected=new Set(s.settings.categories||defaults);
        if(element.checked)selected.add(category);else selected.delete(category);
        s.settings.categories=selected.size?[...selected]:[category];
      }
      s.approvals={host:false,guest:false};
    });
  }
  async function begin(){
    if(role!=='host')return;
    let validationError='';
    const result=await runTransaction(stateRef,current=>{
      if(!current || current.phase!=='setup'){
        validationError='Pengaturan tidak lagi berada pada tahap persiapan. Muat ulang permainan.';
        return;
      }
      if(!current.approvals?.host || !current.approvals?.guest){
        validationError='Kedua pemain harus menyetujui pengaturan.';
        return;
      }
      current.settings=current.settings||structuredClone(DEFAULTS[gameId]||{});
      const custom=gameId==='drawguess'||gameId==='tebakkata'
        ? []
        : [...(current.settings.customItems?.[players.host.uid]||[]),...(current.settings.customItems?.[players.guest.uid]||[])];
      if(gameId==='lovequiz' && quizDeck(current.settings,custom).length < Math.max(1,Number(current.settings.count)||10)){
        validationError='Pertanyaan yang tersedia belum cukup. Tambahkan pertanyaan pribadi atau pilih sumber DiRi/gabungan.';
        return;
      }
      if(gameId==='thisorthat' && thisDeck(current.settings,custom).length < Math.max(1,Number(current.settings.count)||10)){
        validationError='Pertanyaan yang tersedia belum cukup. Tambahkan pertanyaan pribadi atau pilih sumber DiRi/gabungan.';
        return;
      }
      if(gameId==='truthordare' && !truthCards(current.settings,custom).length){
        validationError='Belum ada kartu untuk kategori dan sumber yang dipilih. Pilih kategori lain atau tambahkan kartu pribadi.';
        return;
      }
      if(gameId==='memorycard' && current.settings.deck==='custom'){
        const by=current.settings.imageHashesByUid||{};
        const count={easy:8,medium:12,hard:18}[current.settings.difficulty]||8;
        if(!hasMatchingImageDeck(by[players.host.uid],by[players.guest.uid],count)){
          validationError=`Mode Foto Pribadi memerlukan sedikitnya ${count} gambar yang sama dengan urutan identik pada kedua perangkat.`;
          return;
        }
      }
      const started=createStartedState(current,players,custom);
      Object.keys(current).forEach(key=>delete current[key]);
      Object.assign(current,started);
      return current;
    },{applyLocally:false});
    if(!result.committed)throw new Error(validationError||'Permainan belum dapat dimulai. Periksa persetujuan kedua pemain.');
    lastRoomTouch=Date.now();
    void update(ref(db,`rooms/${code}/lastMeaningfulActivityAt`),serverTimestamp()).catch(()=>{});
    if(gameId==='drawguess'||gameId==='tebakkata') await prepareSecretRound();
  }
  async function shareCustom(){
    const items=await getLocalCollection(`custom-${gameId}`);
    if(gameId==='drawguess'||gameId==='tebakkata'){
      // Word lists are private to their contributor until that player becomes the active clue-giver/drawer.
      await setPrivate('custom-word-bank',items);
      await updateState(s=>{s.settings.customSharedByUid=s.settings.customSharedByUid||{};s.settings.customSharedByUid[myUid]=items.length;s.approvals={host:false,guest:false};});
    }else{
      await updateState(s=>{s.settings.customItems=s.settings.customItems||{};s.settings.customItems[myUid]=items; s.approvals={host:false,guest:false};});
    }
    toast(`${items.length} item koleksi dibagikan ke ruang ini. Daftar kata rahasia tetap privat.`,'success');
  }
  async function saveCustom(form){
    const text=form.elements.customText.value.trim(); if(!text)return;
    const parts=text.split('|').map(x=>x.trim());
    let item;
    if(gameId==='lovequiz'){if(parts.length!==5||parts.some(x=>!x))throw new Error('Format Kuis Cinta: pertanyaan|opsi A|opsi B|opsi C|opsi D. Semua bagian wajib diisi.');if(new Set(parts.slice(1).map(x=>x.toLowerCase())).size!==4)throw new Error('Keempat opsi Kuis Cinta harus berbeda.');item={id:randomId(),kind:gameId,text:parts[0],options:parts.slice(1),category:state?.settings?.categories?.[0]||'Hubungan'};}
    else if(gameId==='thisorthat'){if(parts.length!==3||parts.some(x=>!x))throw new Error('Format Pilih Salah Satu: pertanyaan|opsi A|opsi B. Semua bagian wajib diisi.');if(parts[1].toLowerCase()===parts[2].toLowerCase())throw new Error('Opsi A dan B harus berbeda.');item={id:randomId(),kind:gameId,text:parts[0],a:parts[1],b:parts[2],category:state?.settings?.categories?.[0]||'Acak & Lucu'};}
    else if(gameId==='truthordare'){const type=parts.length>1&&['dare','tantangan'].includes(parts[0].toLowerCase())?'dare':'truth';item={id:randomId(),kind:gameId,text:parts.length>1?parts.slice(1).join('|'):parts[0],type,category:state?.settings?.categories?.[0]||TD_CATEGORIES[0],intensity:'Manis'};}
    else if(gameId==='drawguess'){const difficulty=({'mudah':'easy','sedang':'medium','sulit':'hard','easy':'easy','medium':'medium','hard':'hard'})[parts[1]?.toLowerCase()]||'medium';item={id:randomId(),kind:gameId,text:parts[0],category:'Koleksi Pribadi',difficulty};}
    else if(gameId==='tebakkata'){const difficulty=({'mudah':'easy','sedang':'medium','sulit':'hard','easy':'easy','medium':'medium','hard':'hard'})[parts[1]?.toLowerCase()]||'medium';item={id:randomId(),kind:gameId,text:parts[0],category:'Koleksi Pribadi',difficulty,forbidden:(parts[2]||'').split(',').map(x=>x.trim()).filter(Boolean),alternatives:(parts[3]||'').split(',').map(x=>x.trim()).filter(Boolean)};}
    else item={id:randomId(),kind:gameId,text:parts[0],category:'Koleksi Pribadi',difficulty:'medium'};
    await saveLocalItem(`custom-${gameId}`,item); localItems=await getLocalCollection(`custom-${gameId}`); render(); toast('Tersimpan di koleksi pribadi pada perangkat ini.');
  }
  async function exportCustom(){
    const items=await getLocalCollection(`custom-${gameId}`);
    const blob=new Blob([JSON.stringify({format:'diri-custom-library',version:1,gameId,items},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`diri-${gameId}-custom-library.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importCustom(file){
    if(!file)return;const data=JSON.parse(await file.text());
    if(data?.format!=='diri-custom-library'||!Array.isArray(data.items))throw new Error('File JSON bukan koleksi khusus DiRi yang valid.');
    const valid=data.items.filter(x=>x&&typeof x.text==='string'&&x.text.trim()&&x.kind===gameId).slice(0,300);
    for(const item of valid)await saveLocalItem(`custom-${gameId}`,{...item,id:item.id||randomId()});
    localItems=await getLocalCollection(`custom-${gameId}`);render();toast(`${valid.length} item berhasil diimpor ke koleksi pribadi.`,'success');
  }
  async function rematch(){
    await updateState(s=>{s.rematch=s.rematch||{host:false,guest:false};s.rematch[role]=!s.rematch[role];if(s.rematch.host&&s.rematch.guest){const scores=s.scores||s.score||{};const n=(s.matchNumber||1)+1;let next=gameId==='tictactoe'?makeTttState(sessionId,players):gameId==='connectfour'?makeConnectState(sessionId,players):null;if(next){next.scores=scores;next.matchNumber=n;Object.assign(s,next);}else{s.phase='setup';s.matchNumber=n;s.approvals={host:false,guest:false};s.results=[];s.rematch={host:false,guest:false};}}});
  }
  async function tttMove(index){
    await updateState(s=>{if(s.phase!=='playing'||s.turnUid!==myUid||s.board[index])return false;const mark=s.symbols[myUid];s.board[index]=mark;s.moves.push({uid:myUid,index,at:Date.now()});if(isWinTtt(s.board,mark)){s.phase='result';s.winnerUid=myUid;s.scores[myUid]=(s.scores[myUid]||0)+1;}else if(s.board.every(Boolean)){s.phase='result';s.winnerUid=null;s.scores.draw=(s.scores.draw||0)+1;}else{s.turnUid=players.host.uid===myUid?players.guest.uid:players.host.uid;}});
  }
  async function cfDrop(col){
    await updateState(s=>{if(s.phase!=='playing'||s.turnUid!==myUid)return false;const index=getConnectFourDropIndex(s.board,col);if(index<0)return false;const row=Math.floor(index/7);s.board[index]=myUid;s.moves.push({uid:myUid,col,row,at:Date.now()});const win=cfWinner(s.board);if(win){s.phase='result';s.winnerUid=myUid;s.winningCells=win.cells;s.scores[myUid]=(s.scores[myUid]||0)+1;}else if(s.board.every(Boolean)){s.phase='result';s.winnerUid=null;s.scores.draw=(s.scores.draw||0)+1;}else{s.turnUid=players.host.uid===myUid?players.guest.uid:players.host.uid;}});
  }
  async function quizAnswer(index){
    if(state.submissions?.[role])return;
    const q=state.questions[state.questionIndex]; await setPrivate(`q${state.turnIndex}_${state.questionIndex}`,{answer:index,submittedAt:Date.now()});
    await updateState(s=>{if(s.phase!=='question'||s.submissions?.[role])return false;s.submissions[role]=true;});
  }
  async function resolveLoveQuestion(){
    try{
      const question=state.questions[state.questionIndex], targetUid=state.settings.mode==='know'?(state.turnIndex===0?players.host.uid:players.guest.uid):null;
      const h=await getPrivate(`q${state.turnIndex}_${state.questionIndex}`,players.host.uid),g=await getPrivate(`q${state.turnIndex}_${state.questionIndex}`,players.guest.uid);
      if(!h||!g)return;
      const match=h.answer===g.answer, guesserUid=targetUid?(targetUid===players.host.uid?players.guest.uid:players.host.uid):null;
      await updateState(s=>{if(s.currentResult)return false;const r={question:question.text,hostAnswer:question.options[h.answer],guestAnswer:question.options[g.answer],match,label:match?'Sama':'Berbeda'};s.currentResult=r;s.results.push(r);if(s.settings.mode==='compat'){if(match)s.matchPoints++;}else if(match){s.scores[guesserUid]=(s.scores[guesserUid]||0)+1;s.matchPoints++;}});
    }catch(e){console.warn('Love Quiz reveal will retry',e);}
  }
  async function thisAnswer(index){
    if(state.submissions?.[role])return;
    await setPrivate(`this-${state.questionIndex}`,{answer:index,submittedAt:Date.now()});
    await updateState(s=>{if(s.phase!=='question'||s.submissions[role])return false;s.submissions[role]=true;});
  }
  async function resolveThisQuestion(){
    try{const h=await getPrivate(`this-${state.questionIndex}`,players.host.uid),g=await getPrivate(`this-${state.questionIndex}`,players.guest.uid);if(!h||!g)return;const match=h.answer===g.answer;
      await updateState(s=>{if(s.currentResult)return false;s.streak=match?(s.streak||0)+1:0;s.bestStreak=Math.max(s.bestStreak||0,s.streak);if(match)s.matchPoints++;s.currentResult={match,hostAnswer:String(h.answer),guestAnswer:String(g.answer),streak:s.streak,question:s.questions[s.questionIndex].text};s.results.push(s.currentResult);});
    }catch(e){console.warn(e);}
  }
  async function nextQuestion(){
    await updateState(s=>{if(!s.currentResult)return false;s.nextReady=s.nextReady||{host:false,guest:false};s.nextReady[role]=true;if(s.nextReady.host&&s.nextReady.guest){s.currentResult=null;s.submissions={host:false,guest:false};s.nextReady={host:false,guest:false};s.questionIndex++;if(s.questionIndex>=s.questions.length){if(s.settings.mode==='know'&&s.turnIndex===0){s.turnIndex=1;s.questionIndex=0;}else{s.phase='result';}}}});
    if(gameId==='lovequiz'&&state?.phase==='result') await set(ref(db,`${privatePath(code,gameId,sessionId,myUid)}`),null);
    if(gameId==='thisorthat'&&state?.phase==='result') await set(ref(db,`${privatePath(code,gameId,sessionId,myUid)}`),null);
  }
  async function tdChoose(type){
    await updateState(s=>{if(s.phase!=='choose'||s.initiatorUid!==myUid)return false;const targetUid=s.settings.mode==='self'?myUid:(myUid===players.host.uid?players.guest.uid:players.host.uid);const matching=s.cards.filter(c=>c.type===type);const unused=matching.filter(c=>!s.usedCardIds.includes(c.id));const card=rand(unused.length?unused:matching);if(!card)return false;if(!unused.length)s.usedCardIds=s.usedCardIds.filter(id=>!matching.some(c=>c.id===id));s.usedCardIds.push(card.id);s.currentCard={...card,targetUid,initiatorUid:myUid};s.phase='response';s.lastResponse='';});
  }
  async function tdResolve(response, skipped=false){
    await updateState(s=>{if(s.phase!=='response'||s.currentCard?.targetUid!==myUid)return false;if(skipped){if(!s.skips[myUid])return false;s.skips[myUid]--;s.stats.skips[myUid]++;}else if(s.currentCard.type==='truth'){s.stats.truth[myUid]++;s.lastResponse=String(response||'').slice(0,500);}else{s.stats.dare[myUid]++;s.lastResponse='Tantangan selesai';}s.phase='round-result';s.nextReady={host:false,guest:false};});
  }
  async function tdNext(){
    await updateState(s=>{if(s.phase!=='round-result')return false;s.nextReady[role]=true;if(s.nextReady.host&&s.nextReady.guest){if(s.round>=s.settings.rounds){s.phase='result';}else{s.round++;s.initiatorUid=s.currentCard.initiatorUid===players.host.uid?players.guest.uid:players.host.uid;s.currentCard=null;s.phase='choose';s.nextReady={host:false,guest:false};}}});
  }
  async function hydrateMemoryMedia(){
    const hashes=[...new Set((state.board||[]).map(c=>c.imageHash).filter(Boolean))];let changed=false;
    for(const hash of hashes){if(memoryUrls[hash])continue;try{const blob=await getLocalMedia('memory',hash);if(blob){memoryUrls[hash]=URL.createObjectURL(blob);changed=true;}}catch{}}
    if(changed && gameId==='memorycard') render();
  }
  function scheduleMemoryMismatch(){
    if(memoryMismatchTimer)clearTimeout(memoryMismatchTimer);
    const remaining=Math.max(0,(state?.mismatchAt||Date.now())-(Date.now()+serverOffset));
    memoryMismatchTimer=window.setTimeout(()=>{void updateState(s=>{if(!s.openIds?.length||!s.mismatchAt||Date.now()+serverOffset<s.mismatchAt)return false;s.openIds.forEach(i=>{if(s.board[i]&&!s.board[i].matched)s.board[i].faceUp=false;});s.openIds=[];s.mismatchAt=0;s.turnUid=nextMemoryTurn(s.pendingMismatchUid,oppositeUid(s.pendingMismatchUid),false);s.pendingMismatchUid=null;});},remaining+40);
  }
  async function memoryFlip(index){
    let needHide=false;
    await updateState(s=>{if(s.phase!=='playing'||s.turnUid!==myUid||s.openIds.length>=2)return false;const card=s.board[index];if(!card||card.matched||card.faceUp)return false;card.faceUp=true;s.openIds.push(index);if(s.openIds.length===2){s.attempts++;s.moves++;const [a,b]=s.openIds.map(i=>s.board[i]);if(a.pairId===b.pairId){a.matched=b.matched=true;s.pairsFound++;if(s.settings.mode==='duel')s.scores[myUid]++;s.turnUid=nextMemoryTurn(myUid,oppositeUid(myUid),true);s.openIds=[];if(s.board.every(c=>c.matched))s.phase='result';}else{needHide=true;s.mismatchAt=Date.now()+serverOffset+900;s.pendingMismatchUid=myUid;}}});
    if(needHide)scheduleMemoryMismatch();
  }
  function oppositeUid(uid){return uid===players.host.uid?players.guest.uid:players.host.uid;}
  async function serverNow(){return Date.now()+serverOffset;}
  async function prepareSecretRound(){
    if(preparingSecret)return;
    preparingSecret=true;
    try{
      const snap=await get(stateRef);const fresh=snap.val();if(!fresh)return;
      const drawerUid=gameId==='drawguess'?fresh.drawerUid:fresh.clueUid;
      if(drawerUid!==myUid||fresh.phase!=='waiting-word')return;
      const round=fresh.round;const secretRef=ref(db,`${privatePath(code,gameId,sessionId,myUid)}/word-${round}`);
      let cached=await get(secretRef);let secret=cached.val();
      if(!secret){
        const level=fresh.wordLevels?.[round-1]||'easy';
        const bank=await getPrivate('custom-word-bank')||[];
        const custom=bank.filter(item=>item?.text&&(!item.difficulty||item.difficulty===level));
        const used=(fresh.roundResults||[]).map(item=>item.word);
        const preset=WORD_BANK[level]||WORD_BANK.easy;
        const candidates=[...custom.map(item=>({word:item.text,forbidden:item.forbidden||[],alternatives:item.alternatives||[],category:item.category||'Koleksi Pribadi'})),...preset.map(word=>({word,forbidden:FORBIDDEN_WORDS[word]||[],alternatives:[],category:'Bawaan DiRi'}))].filter(item=>!used.includes(item.word));
        const selected=rand(candidates)||{word:rand(preset)||'bunga',forbidden:[],alternatives:[],category:'Bawaan DiRi'};
        const tx=await runTransaction(secretRef,current=>current||selected,{applyLocally:false});
        secret=tx.snapshot.val();
      }
      localSecret=secret.word;localSecretData=secret;
      const start=await serverNow();
      await updateState(s=>{if(s.phase!=='waiting-word'||s.round!==round)return false;s.phase='playing';s.startedAt=start;s.deadline=start+(s.seconds||90)*1000;s.category=secret.category||'Koleksi Pribadi';s.strokes=[];s.clues=[];s.guesses=[];s.hintUsed=false;s.hintRequests={};s.hintDelivered={};s.hintTextByUid={};s.nextReady={host:false,guest:false};});
    } finally { preparingSecret=false; }
  }
  async function onSecretGameUpdate(){
    if(!state)return;
    await prepareSecretRound();
    const snap=await get(stateRef);const live=snap.val();if(!live)return;state=live;
    const isDrawer=gameId==='drawguess'?state.drawerUid===myUid:state.clueUid===myUid;
    if(!isDrawer||state.phase!=='playing')return;
    const secret=await getPrivate(`word-${state.round}`);if(!secret)return;localSecret=secret.word;localSecretData=secret;
    for(const reqUid of Object.keys(state.hintRequests||{})){
      if(state.hintRequests[reqUid]&&!state.hintDelivered?.[reqUid]){
        const level=state.wordLevels?.[state.round-1]||'easy';
        const pieces=secret.word.split(/\s+/);
        const text=level==='medium' ? `${pieces.length} kata · kata pertama diawali huruf “${pieces[0][0].toUpperCase()}”` : level==='hard' ? `Pikirkan sesuatu dari kategori ${secret.category||'misteri'} dengan ${pieces.length} kata.` : `Diawali huruf “${secret.word[0].toUpperCase()}” · ${secret.word.replace(/\s/g,'').length} huruf`;
        await updateState(s=>{if(s.phase!=='playing'||s.round!==state.round)return false;s.hintTextByUid=s.hintTextByUid||{};s.hintTextByUid[reqUid]=text;s.hintDelivered=s.hintDelivered||{};s.hintDelivered[reqUid]=true;s.hintUsed=true;});
      }
    }
    if(state.phase!=='playing')return;
    const last=state.guesses?.find(guess=>!guess.checked);
    if(last&&!last.checked){
      const accepted=gameId==='drawguess'?[secret.word]:[secret.word,...(secret.alternatives||[])];
      const good=isExactAnswerGuess(last.text,accepted);
      if(good)await finishSecretRound(true,'Jawaban benar!');
      else await updateState(s=>{if(s.phase!=='playing')return false;const pending=s.guesses?.find(guess=>guess.id===last.id);if(pending)pending.checked=true;});
    }
  }
    async function finishSecretRound(correct,message){
    const secret=await getPrivate(`word-${state.round}`);
    if(!secret)return;
    const round=state.round;
    const now=await serverNow();
    await updateState(s=>{
      if(s.phase!=='playing'||s.round!==round)return false;
      s.phase='round-result';s.result={word:secret.word,message,correct};
      if(correct){s.scores[myUid]=(s.scores[myUid]||0)+1;const fast=now-s.startedAt<=30000&&!s.hintUsed;s.scores[s.guesserUid]=(s.scores[s.guesserUid]||0)+(fast?2:1);}
      s.roundResults=s.roundResults||[];s.roundResults.push({round:s.round,word:secret.word,correct,drawerUid:gameId==='drawguess'?s.drawerUid:s.clueUid});
      s.nextReady={host:false,guest:false};
    });
  }
  function startClock(){
    if(timer)return;
    timer=setInterval(()=>{
      const el=root.querySelector('[data-timer]');
      if(!el || state?.phase!=='playing') { clearInterval(timer); timer=0; return; }
      const remaining=Math.max(0,Math.ceil(((state?.deadline||Date.now()+serverOffset)-(Date.now()+serverOffset))/1000));
      el.textContent=`${remaining} detik`;
      if(remaining===0){const drawer=gameId==='drawguess'?state.drawerUid===myUid:state.clueUid===myUid;if(drawer)void finishSecretRound(false,'Waktu habis.');}
    },250);
  }
  function attachDrawCanvas(){
    const canvas=$('#draw-canvas',root);if(!canvas)return;
    const ctx=canvas.getContext('2d');const drawAll=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);(state.strokes||[]).forEach(st=>{ctx.strokeStyle=st.color;ctx.lineWidth=st.width;ctx.lineCap='round';ctx.beginPath();st.points.forEach((p,i)=>{const x=p.x*canvas.width,y=p.y*canvas.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});};drawAll();
    if(state.drawerUid!==myUid||state.phase!=='playing')return;
    let active=null;const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};
    const down=e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);active={color:drawColor,width:5,points:[point(e)]};};
    const move=e=>{if(!active)return;active.points.push(point(e));drawAll();ctx.strokeStyle=active.color;ctx.lineWidth=active.width;ctx.lineCap='round';ctx.beginPath();active.points.forEach((p,i)=>{const x=p.x*canvas.width,y=p.y*canvas.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();};
    const up=async()=>{if(!active)return;const st=active;active=null;if(st.points.length>80)st.points=st.points.filter((_,i)=>i%2===0);await updateState(s=>{if(s.phase!=='playing'||s.drawerUid!==myUid)return false;s.strokes=(s.strokes||[]).slice(-119);s.strokes.push(st);});};
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    drawCanvasCleanup=()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);};
  }
  async function nextSecretRound(){
    await updateState(s=>{
      if(s.phase!=='round-result')return false;
      s.nextReady=s.nextReady||{host:false,guest:false};s.nextReady[role]=true;
      if(!s.nextReady.host||!s.nextReady.guest)return;
      if(s.round>=6){s.phase='result-game';return;}
      s.round++;const old=gameId==='drawguess'?s.drawerUid:s.clueUid;const next=oppositeUid(old);
      if(gameId==='drawguess'){s.drawerUid=next;s.guesserUid=old;}else{s.clueUid=next;s.guesserUid=old;}
      s.phase='waiting-word';s.deadline=null;s.startedAt=null;s.result=null;s.hintUsed=false;s.hintRequests={};s.hintDelivered={};s.hintTextByUid={};s.nextReady={host:false,guest:false};s.strokes=[];s.clues=[];s.guesses=[];
    });
  }
  async function loadLocalHint(){const hint=state?.hintTextByUid?.[myUid]||'';if(hint&&hint!==localHint){localHint=hint;render();}}
  async function requestHint(){
    await updateState(s=>{if(s.phase!=='playing'||s.hintUsed)return false;s.hintRequests=s.hintRequests||{};s.hintRequests[myUid]=true;s.hintUsed=true;});
    if(gameId==='drawguess'||gameId==='tebakkata')loadLocalHint();
  }
  async function submitClue(value){
    const secret=await getPrivate(`word-${state.round}`); if(!secret)throw new Error('Kata rahasia belum tersedia.');
    const clue=String(value||'').trim(); if(!clue) return;
    if(state.settings.mode==='forbidden'){
      const blocked=findForbiddenWord(clue,[secret.word,...(secret.forbidden||[])]);
      if(blocked)throw new Error(`Petunjuk ditolak karena memuat kata terlarang: ${blocked}`);
    }
    await updateState(s=>{if(s.phase!=='playing'||s.clueUid!==myUid)return false;s.clues.push({text:clue.slice(0,120),by:myUid,at:Date.now()});});
  }
  async function submitGuess(value){
    const text=String(value||'').trim();if(!text)return;
    await updateState(s=>{if(s.phase!=='playing'||s.guesserUid!==myUid)return false;s.guesses=s.guesses||[];s.guesses.push({id:randomId(),text:text.slice(0,100),uid:myUid,at:Date.now(),checked:false});});
  }
  async function handleAction(action,el){
    if(busy)return; busy=true;
    try{
      if(action==='back-room'){if(role==='host'){await onBack();}else toast('Pembuat ruang akan mengembalikan sesi ke lobi.');return;}
      if(action==='approve-setup'){await updateState(s=>{s.approvals[role]=!s.approvals[role];});return;}
      if(action==='start-session'){await begin();return;}
      if(action==='share-custom'){await shareCustom();return;}
      if(action==='export-custom'){await exportCustom();return;}
      if(action==='ttt-move')return await tttMove(Number(el.dataset.index));
      if(action==='cf-drop')return await cfDrop(Number(el.dataset.col));
      if(action==='toggle-cf-theme'){await updateState(s=>{s.theme=s.theme==='heart'?'pastel':'heart';});return;}
      if(action==='request-rematch')return await rematch();
      if(action==='quiz-answer')return await quizAnswer(Number(el.dataset.answer));
      if(action==='this-answer')return await thisAnswer(Number(el.dataset.answer));
      if(action==='next-question')return await nextQuestion();
      if(action==='td-type')return await tdChoose(el.dataset.type);
      if(action==='td-done')return await tdResolve('done',false);
      if(action==='td-skip')return await tdResolve('',true);
      if(action==='td-next')return await tdNext();
      if(action==='memory-flip')return await memoryFlip(Number(el.dataset.index));
      if(action==='draw-undo'){await updateState(s=>{if(s.drawerUid!==myUid)return false;s.strokes=(s.strokes||[]).slice(0,-1);});return;}
      if(action==='draw-clear'){await updateState(s=>{if(s.drawerUid!==myUid)return false;s.strokes=[];});return;}
      if(action==='draw-hint')return await requestHint();
      if(action==='round-next')return await nextSecretRound();
      if(action==='tebak-hint')return await requestHint();
      if(action==='tebak-skip'){
        if(!state.skips?.[myUid]||state.phase!=='playing'||state.clueUid!==myUid)return;const oldSecret=await getPrivate(`word-${state.round}`);const used=(state.roundResults||[]).map(x=>x.word);const level=state.wordLevels?.[state.round-1]||'easy';const bank=await getPrivate('custom-word-bank')||[];const custom=bank.filter(item=>item?.text&&(!item.difficulty||item.difficulty===level)).map(item=>({word:item.text,forbidden:item.forbidden||[],alternatives:item.alternatives||[],category:item.category||'Koleksi Pribadi'}));const candidates=[...custom,...(WORD_BANK[level]||WORD_BANK.easy).map(word=>({word,forbidden:FORBIDDEN_WORDS[word]||[],alternatives:[],category:'Bawaan DiRi'}))].filter(item=>item.word!==oldSecret?.word&&!used.includes(item.word));const picked=rand(candidates)||{word:rand(WORD_BANK.easy)||'bunga',forbidden:[],alternatives:[],category:'Bawaan DiRi'};await setPrivate(`word-${state.round}`,picked);localSecret=picked.word;localSecretData=picked;await updateState(s=>{if(s.phase!=='playing'||s.clueUid!==myUid||!s.skips[myUid])return false;s.skips[myUid]--;s.clues=[];s.guesses=[];s.hintUsed=false;s.hintRequests={};s.hintDelivered={};s.hintTextByUid={};s.category=picked.category;});return;
      }
      if(action==='tebak-giveup'){
        if(!state.skips?.[myUid])return;await updateState(s=>{if(s.phase!=='playing'||s.guesserUid!==myUid||!s.skips[myUid])return false;s.skips[myUid]--;s.phase='round-result';s.result={word:'Jawaban dibuka',message:'Kamu menyerah. Tidak ada poin.'};});try{const secret=await getPrivate(`word-${state.round}`,state.clueUid);if(secret?.word)await updateState(s=>{if(s.phase==='round-result'&&s.result)s.result.word=secret.word;});}catch{}return;
      }
    }catch(e){toast(e.message,'error');}finally{busy=false;}
  }
  async function clickHandler(event){const colorEl=event.target.closest('[data-color]');if(colorEl){drawColor=colorEl.dataset.color;root.querySelectorAll('[data-color]').forEach(b=>b.classList.toggle('active',b===colorEl));return;}const el=event.target.closest('[data-action]');if(!el||el.disabled)return;event.preventDefault();await handleAction(el.dataset.action,el);}
  async function changeHandler(event){
    const el=event.target;
    if(el.matches('[data-setting],[data-category]')){try{await handleSetupChange(el);}catch(e){toast(e.message,'error');}}
    if(el.matches('[data-import-custom]')){try{await importCustom(el.files?.[0]);}catch(e){toast(e.message,'error');}}
    if(el.matches('[data-memory-files]')){
      try{const files=[...el.files].slice(0,18);const hashes=[];for(const file of files){const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');await putLocalMedia('memory',hash,file);hashes.push(hash);}await updateState(s=>{s.settings.imageHashesByUid=s.settings.imageHashesByUid||{};s.settings.imageHashesByUid[myUid]=hashes;s.approvals={host:false,guest:false};});toast(`${files.length} foto tersimpan lokal. Pasangan harus mengimpor urutan file yang sama.`,'success');}catch(e){toast(e.message,'error');}}
  }
  async function submitHandler(event){
    const form=event.target.closest('form[data-form]');if(!form)return;event.preventDefault();
    try{
      const kind=form.dataset.form;
      if(kind==='custom-item')await saveCustom(form);
      if(kind==='td-response')await tdResolve(form.elements.response.value,false);
      if(kind==='draw-guess'){const input=form.elements.guess;await submitGuess(input.value);input.value='';}
      if(kind==='tebak-clue'){const input=form.elements.clue;await submitClue(input.value);input.value='';}
      if(kind==='tebak-guess'){const input=form.elements.guess;await submitGuess(input.value);input.value='';}
    }catch(e){toast(e.message,'error');}
  }
  function renderMissing(){root.innerHTML=missingHtml();}
  void init();
  return {destroy:cleanup};
}
