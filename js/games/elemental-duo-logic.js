export const ELEMENTAL_WORLD_WIDTH = 1440;
export const ELEMENTAL_WORLD_HEIGHT = 960;
export const ELEMENTAL_FLOOR_Y = 900;
export const ELEMENTAL_MAP_VERSION = 9;
export const ELEMENTAL_PLAYER_RADIUS = 15;
export const ELEMENTAL_GRAVITY = 1100;
export const ELEMENTAL_MOVE_SPEED = 270;
export const ELEMENTAL_JUMP_SPEED = 690;

/** Calculate a closer, aspect-aware world window so the camera always has room to follow. */
export function getElementalViewport(width, height, worldWidth = ELEMENTAL_WORLD_WIDTH, worldHeight = ELEMENTAL_WORLD_HEIGHT) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const aspect = safeWidth / safeHeight;
  // Never expose the entire 960-unit stage on ordinary screens. Portrait stays
  // tall and narrow; landscape reveals more horizontal space without disabling follow.
  let viewWidth = Math.min(worldWidth, Math.max(520, Math.min(680, 520 + Math.max(0, aspect - 1) * 130)));
  let viewHeight = viewWidth / aspect;
  if (viewHeight > worldHeight) {
    viewHeight = worldHeight;
    viewWidth = viewHeight * aspect;
  }
  return { aspect, viewWidth, viewHeight, zoom: worldWidth / viewWidth };
}

/** Follow the locally controlled spirit while gently keeping its partner in frame. */
export function getElementalCameraTarget(localPlayer, remotePlayer, viewWidth, viewHeight, worldWidth = ELEMENTAL_WORLD_WIDTH, worldHeight = ELEMENTAL_WORLD_HEIGHT) {
  const localX = Number.isFinite(localPlayer?.x) ? localPlayer.x : 480;
  const localY = Number.isFinite(localPlayer?.y) ? localPlayer.y : worldHeight - 80;
  const remoteX = Number.isFinite(remotePlayer?.x) ? remotePlayer.x : localX;
  const remoteY = Number.isFinite(remotePlayer?.y) ? remotePlayer.y : localY;
  const partnerOffsetX = Math.max(-viewWidth * 0.22, Math.min(viewWidth * 0.22, remoteX - localX));
  const partnerOffsetY = Math.max(-viewHeight * 0.16, Math.min(viewHeight * 0.16, remoteY - localY));
  const focusX = localX + partnerOffsetX * 0.32;
  const focusY = localY + partnerOffsetY * 0.24;
  return {
    x: Math.max(0, Math.min(worldWidth - viewWidth, focusX - viewWidth * 0.46)),
    y: Math.max(0, Math.min(Math.max(0, worldHeight - viewHeight), focusY - viewHeight * 0.62))
  };
}

const WORLD_DIFFICULTY_CURVE = [
  // World 1 is a real tutorial: seven gentle stages before normal timing begins.
  [1,1,1,1,1,1,1,1,2,2],
  [1,1,1,1,1,2,2,2,2,3],
  [2,2,2,2,2,2,3,3,3,3],
  [2,2,2,2,3,3,3,3,3,4],
  [3,3,3,3,3,3,3,4,4,4]
];

const WORLD_CONFIG = [
  {
    id: 'whispering-grove', name: 'Hutan Berbisik', shortName: 'Hutan',
    names: ['Jejak Cahaya','Batu Bertunas','Akar Berliku','Jembatan Pucuk','Dua Lentera','Lompatan Lumut','Gerbang Embun','Akar Berayun','Ruang Kunang-kunang','Jantung Hutan'],
    tagline: 'Ikuti cahaya kecil di antara akar yang hidup.',
    mechanic: 'Tanaman lentur', modifier: 'normal',
    colors: { sky:'#d8f0de', sky2:'#a9d9c0', far:'#81b79b', near:'#4d8d75', ground:'#426c5b', accent:'#f6d98b', glow:'#ffe5a4' }
  },
  {
    id: 'crystal-depths', name: 'Kedalaman Kristal', shortName: 'Kristal',
    names: ['Retakan Pertama','Gema Biru','Lorong Pecahan','Cermin Es','Jembatan Prismatik','Arus Terbalik','Menara Kristal','Ruang Resonansi','Badai Serpihan','Penjaga Geode'],
    tagline: 'Pantulkan cahaya dan temukan jalan di gua kristal.',
    mechanic: 'Es dan arus air', modifier: 'normal',
    colors: { sky:'#d9eff4', sky2:'#a8d7e3', far:'#7bb6c6', near:'#4b849f', ground:'#35596f', accent:'#f0e6ff', glow:'#c6fbff' }
  },
  {
    id: 'ember-kingdom', name: 'Kerajaan Bara', shortName: 'Bara',
    names: ['Napas Lava','Uap Panas','Gerbang Panas','Jembatan Bara','Sungai Pendingin','Sakelar Berantai','Lorong Uap','Lava Meninggi','Dua Katup','Jantung Tungku'],
    tagline: 'Jaga keseimbangan di negeri yang terus berdenyut.',
    mechanic: 'Panas berdenyut', modifier: 'pulse',
    colors: { sky:'#f5d8c7', sky2:'#e7a58b', far:'#be766d', near:'#874b54', ground:'#503b4a', accent:'#ffe2a0', glow:'#ffba79' }
  },
  {
    id: 'skybound-ruins', name: 'Reruntuhan Langit', shortName: 'Langit',
    names: ['Tangga Awan','Pulau Melayang','Lorong Angin','Menara Terbalik','Kunci Badai','Jembatan Awan','Kubah Senyap','Portal Kembar','Labirin Langit','Penjaga Angin'],
    tagline: 'Bekerja sama melintasi pulau yang melayang.',
    mechanic: 'Arus angin', modifier: 'wind',
    colors: { sky:'#dce5ff', sky2:'#b8c7f2', far:'#9ca9d8', near:'#727db1', ground:'#4f527e', accent:'#fff0b5', glow:'#d9eaff' }
  },
  {
    id: 'ancient-heart', name: 'Jantung Kuno', shortName: 'Kuno',
    names: ['Simpul Pertama','Gerbang Lima','Kristal Kembar','Ruang Sinkron','Jalur Terpilih','Pilar Harmoni','Ujian Bara','Ujian Arus','Pintu Purba','Penyatuan Elemen'],
    tagline: 'Satukan semua kemampuan untuk membangunkan sumber energi.',
    mechanic: 'Ujian gabungan', modifier: 'mixed',
    colors: { sky:'#e5def5', sky2:'#b8a9db', far:'#887cae', near:'#62567f', ground:'#40364f', accent:'#ffe5a8', glow:'#fff0c9' }
  }
];

const PLATFORM_LAYOUTS = [
  [[190,420,125],[430,365,125],[680,410,125]],
  [[150,395,105],[330,335,120],[555,395,110],[755,335,95]],
  [[245,430,155],[505,370,150],[760,420,95]],
  [[125,420,95],[295,360,105],[485,305,115],[690,375,125]],
  [[185,385,125],[390,435,110],[600,350,135],[805,415,90]],
  [[135,375,125],[350,425,115],[565,345,120],[780,395,110]],
  [[205,430,90],[390,355,95],[575,280,100],[765,365,110]],
  [[105,410,105],[290,335,110],[490,410,115],[695,320,120],[855,410,75]],
  [[165,365,115],[370,425,100],[565,350,120],[760,425,95]],
  [[180,405,105],[355,315,100],[525,405,105],[700,315,105],[855,405,75]]
];

const HAZARD_LAYOUTS = [
  [[280,76],[535,66],[820,56]],
  [[245,72],[470,65],[690,74]],
  [[180,66],[420,78],[700,74]],
  [[230,74],[410,70],[635,68],[815,50]],
  [[295,68],[515,75],[755,75]],
  [[215,72],[445,70],[665,78]],
  [[300,70],[520,70],[770,65]],
  [[205,66],[390,74],[610,72],[805,58]],
  [[250,78],[475,75],[710,76]],
  [[280,74],[475,70],[670,72],[845,42]]
];

const CHALLENGE_NOTES = [
  'Temukan dua sakelar elemen untuk membuka gerbang.',
  'Lompati zona berbahaya dengan memperhatikan elemenmu.',
  'Berbagi jalan: satu pemain membuka jalur untuk yang lain.',
  'Ambil serpihan energi bila memungkinkan, lalu capai gerbang bersama.',
  'Jangan terburu-buru. Kalian harus tiba di gerbang berdua.'
];


// Hand-authored first-world layouts. Unlike the legacy generated layouts, every
// stage here has a specific learning goal and a mechanic that is used by the engine.
const WORLD_ONE_BLUEPRINTS = [
  {
    difficulty:1, mechanic:'Belajar bergerak dan melompat',
    note:'Kenali gerakan Bara dan Nira. Lompati genangan air dan bara kecil untuk mencapai pijakan masing-masing.',
    features:['tutorial-move','element-hazards'],
    platforms:[
      {id:'grove-1-a',x:205,y:430,w:135,kind:'stone'},
      {id:'grove-1-b',x:430,y:410,w:130,kind:'crystal'},
      {id:'grove-1-c',x:665,y:430,w:135,kind:'stone'}
    ],
    hazards:[
      {id:'grove-1-water',x:350,y:493,w:48,h:35,type:'water'},
      {id:'grove-1-fire',x:575,y:493,w:48,h:35,type:'fire'}
    ],
    switches:[{id:'fire',element:'fire',x:245,y:510,w:52,h:10},{id:'water',element:'water',x:745,y:510,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:495,y:380},{id:'water',element:'water',x:730,y:400}],
    checkpoint:{x:480,y:482}
  },
  {
    difficulty:1, mechanic:'Jalur aman sesuai elemen',
    note:'Air aman bagi Nira dan berbahaya bagi Bara. Lava aman bagi Bara dan berbahaya bagi Nira. Pilih waktu lompatan.',
    features:['element-hazards','split-route'],
    platforms:[
      {id:'grove-2-a',x:165,y:430,w:120,kind:'stone'},
      {id:'grove-2-b',x:350,y:390,w:125,kind:'crystal'},
      {id:'grove-2-c',x:550,y:390,w:125,kind:'crystal'},
      {id:'grove-2-d',x:745,y:430,w:125,kind:'stone'}
    ],
    hazards:[
      {id:'grove-2-water',x:285,y:493,w:78,h:35,type:'water'},
      {id:'grove-2-fire',x:610,y:493,w:78,h:35,type:'fire'}
    ],
    switches:[{id:'fire',element:'fire',x:420,y:385,w:52,h:10},{id:'water',element:'water',x:800,y:423,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:410,y:360},{id:'water',element:'water',x:800,y:400}],
    checkpoint:{x:480,y:482}
  },
  {
    difficulty:1, mechanic:'Mengumpulkan permata',
    note:'Permata berada di atas platform. Bara hanya dapat mengambil permata Bara, Nira mengambil permata Air.',
    features:['element-gems','stepping-platforms'],
    platforms:[
      {id:'grove-3-a',x:150,y:435,w:125,kind:'stone'},
      {id:'grove-3-b',x:330,y:395,w:125,kind:'crystal'},
      {id:'grove-3-c',x:515,y:435,w:125,kind:'stone'},
      {id:'grove-3-d',x:700,y:395,w:125,kind:'crystal'},
      {id:'grove-3-e',x:845,y:435,w:85,kind:'stone'}
    ],
    hazards:[
      {id:'grove-3-water',x:250,y:493,w:50,h:35,type:'water'},
      {id:'grove-3-fire',x:620,y:493,w:50,h:35,type:'fire'}
    ],
    switches:[{id:'fire',element:'fire',x:390,y:390,w:52,h:10},{id:'water',element:'water',x:760,y:390,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:390,y:365},{id:'water',element:'water',x:760,y:365}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:2, mechanic:'Dua jalur yang saling bertemu',
    note:'Jalur Bara dan Air memiliki pijakan berbeda. Kalian dapat memilih rute masing-masing, lalu bertemu di gerbang.',
    features:['split-route','element-hazards'],
    platforms:[
      {id:'grove-4-a',x:170,y:435,w:120,kind:'stone'},
      {id:'grove-4-b',x:300,y:390,w:120,kind:'crystal'},
      {id:'grove-4-c',x:450,y:435,w:120,kind:'stone'},
      {id:'grove-4-d',x:590,y:390,w:120,kind:'crystal'},
      {id:'grove-4-e',x:745,y:435,w:120,kind:'stone'}
    ],
    hazards:[
      {id:'grove-4-water',x:285,y:493,w:58,h:35,type:'water'},
      {id:'grove-4-fire',x:620,y:493,w:58,h:35,type:'fire'}
    ],
    switches:[{id:'fire',element:'fire',x:500,y:430,w:52,h:10},{id:'water',element:'water',x:760,y:430,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:405},{id:'water',element:'water',x:760,y:405}],
    checkpoint:{x:500,y:482}
  },
  {
    difficulty:2, mechanic:'Pijakan elemen di tempat tinggi',
    note:'Lompat ke pijakan masing-masing untuk mengaktifkannya. Kedua pijakan harus aktif agar penghalang terbuka.',
    features:['elevated-switches','co-op-gate'],
    platforms:[
      {id:'grove-5-fire-ledge',x:170,y:430,w:155,kind:'crystal'},
      {id:'grove-5-mid-ledge',x:400,y:405,w:150,kind:'stone'},
      {id:'grove-5-water-ledge',x:650,y:430,w:155,kind:'crystal'}
    ],
    hazards:[{id:'grove-5-water',x:350,y:493,w:55,h:35,type:'water'},{id:'grove-5-fire',x:590,y:493,w:55,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:245,y:423,w:58,h:10},{id:'water',element:'water',x:725,y:423,w:58,h:10}],
    gems:[{id:'fire',element:'fire',x:465,y:380},{id:'water',element:'water',x:700,y:400}],
    checkpoint:{x:490,y:482}
  },
  {
    difficulty:2, mechanic:'Jamur pijakan yang memantulkan',
    note:'Pijak jamur bercahaya untuk terpental lebih tinggi. Atur arah saat berada di udara.',
    features:['bounce-platforms','element-hazards'],
    platforms:[
      {id:'grove-6-bounce-a',x:190,y:450,w:125,kind:'bounce'},
      {id:'grove-6-crystal',x:410,y:405,w:125,kind:'crystal'},
      {id:'grove-6-bounce-b',x:630,y:450,w:125,kind:'bounce'},
      {id:'grove-6-stone',x:790,y:415,w:105,kind:'stone'}
    ],
    hazards:[{id:'grove-6-water',x:330,y:493,w:62,h:35,type:'water'},{id:'grove-6-fire',x:555,y:493,w:62,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:470,y:398,w:52,h:10},{id:'water',element:'water',x:800,y:408,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:465,y:380},{id:'water',element:'water',x:840,y:390}],
    checkpoint:{x:470,y:482}
  },
  {
    difficulty:3, mechanic:'Menara akar bertingkat',
    note:'Naik bertahap melalui menara akar. Setiap lompatan membawa kalian ke pijakan yang lebih tinggi.',
    features:['vertical-climb','elevated-switches'],
    platforms:[
      {id:'grove-7-a',x:160,y:440,w:125,kind:'stone'},
      {id:'grove-7-b',x:310,y:395,w:115,kind:'crystal'},
      {id:'grove-7-c',x:455,y:350,w:115,kind:'stone'},
      {id:'grove-7-d',x:600,y:395,w:115,kind:'crystal'},
      {id:'grove-7-e',x:745,y:350,w:130,kind:'stone'}
    ],
    hazards:[{id:'grove-7-water',x:285,y:493,w:55,h:35,type:'water'},{id:'grove-7-fire',x:575,y:493,w:55,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:510,y:343,w:52,h:10},{id:'water',element:'water',x:810,y:343,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:510,y:325},{id:'water',element:'water',x:810,y:315}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Batu pijakan yang muncul berkala',
    note:'Sebagian batu muncul dan menghilang secara berkala. Amati ritmenya, lalu seberangi saat batu aktif.',
    features:['timed-platforms','moving-platforms'],
    platforms:[
      {id:'grove-8-a',x:160,y:440,w:125,kind:'stone'},
      {id:'grove-8-b',x:335,y:405,w:112,kind:'crystal',motion:{axis:'x',amplitude:26,periodMs:5600,phaseMs:0}},
      {id:'grove-8-c',x:505,y:380,w:112,kind:'stone',cycle:{periodMs:6200,activeMs:5000,phaseMs:900}},
      {id:'grove-8-d',x:685,y:405,w:112,kind:'crystal'},
      {id:'grove-8-e',x:830,y:440,w:95,kind:'stone'}
    ],
    hazards:[{id:'grove-8-water',x:285,y:493,w:48,h:35,type:'water'},{id:'grove-8-fire',x:610,y:493,w:48,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:220,y:435,w:52,h:10},{id:'water',element:'water',x:740,y:398,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:390,y:380},{id:'water',element:'water',x:740,y:380}],
    checkpoint:{x:490,y:482}
  },
  {
    difficulty:3, mechanic:'Jembatan bergerak untuk pasangan',
    note:'Jembatan akar bergeser perlahan. Tunggu posisinya mendekat sebelum melompat dan bantu pasangan melewati celah.',
    features:['moving-bridge','co-op-gate'],
    platforms:[
      {id:'grove-9-a',x:150,y:435,w:125,kind:'stone'},
      {id:'grove-9-b',x:340,y:405,w:120,kind:'crystal',motion:{axis:'x',amplitude:42,periodMs:7200,phaseMs:600}},
      {id:'grove-9-c',x:545,y:405,w:120,kind:'stone',motion:{axis:'x',amplitude:34,periodMs:6400,phaseMs:2600}},
      {id:'grove-9-d',x:760,y:435,w:125,kind:'stone'}
    ],
    hazards:[{id:'grove-9-water',x:275,y:493,w:55,h:35,type:'water'},{id:'grove-9-fire',x:650,y:493,w:55,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:215,y:430,w:52,h:10},{id:'water',element:'water',x:800,y:430,w:52,h:10}],
    gems:[{id:'fire',element:'fire',x:400,y:380},{id:'water',element:'water',x:600,y:380}],
    checkpoint:{x:480,y:482}
  },
  {
    difficulty:3, mechanic:'Ujian gabungan Hutan Berbisik',
    note:'Gabungkan semua yang dipelajari: jalur elemen, jamur pantul, platform bergerak, pijakan tinggi, dan kerja sama.',
    features:['element-hazards','bounce-platforms','moving-platforms','timed-platforms','co-op-gate'],
    platforms:[
      {id:'grove-10-a',x:155,y:445,w:125,kind:'stone'},
      {id:'grove-10-b',x:320,y:420,w:115,kind:'bounce'},
      {id:'grove-10-c',x:485,y:375,w:115,kind:'crystal',motion:{axis:'x',amplitude:24,periodMs:6000,phaseMs:400}},
      {id:'grove-10-d',x:650,y:405,w:115,kind:'crystal',cycle:{periodMs:6800,activeMs:5500,phaseMs:1700}},
      {id:'grove-10-e',x:790,y:440,w:130,kind:'stone'}
    ],
    hazards:[
      {id:'grove-10-water',x:275,y:493,w:60,h:35,type:'water',motion:{axis:'x',amplitude:18,periodMs:6200,phaseMs:0}},
      {id:'grove-10-fire',x:585,y:493,w:60,h:35,type:'fire',motion:{axis:'x',amplitude:20,periodMs:7000,phaseMs:2300}}
    ],
    switches:[{id:'fire',element:'fire',x:215,y:438,w:54,h:10},{id:'water',element:'water',x:715,y:398,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:375,y:395},{id:'water',element:'water',x:715,y:370}],
    checkpoint:{x:500,y:482}
  }
];


// Hand-authored second-world layouts. Each level introduces or combines a
// crystal-cavern mechanic that is simulated locally from the shared level clock.
const WORLD_TWO_BLUEPRINTS = [
  {
    difficulty:1, mechanic:'Mengenali permukaan es', modifier:'normal',
    note:'Permukaan es membuat langkah sulit dihentikan. Lepaskan tombol arah lebih awal sebelum mendarat di pijakan.',
    features:['ice-platforms','ice-zones','element-hazards'],
    platforms:[
      {id:'crystal-11-ice-a',x:185,y:455,w:145,kind:'ice'},
      {id:'crystal-11-stone',x:405,y:420,w:135,kind:'stone'},
      {id:'crystal-11-ice-b',x:655,y:455,w:145,kind:'ice'}
    ],
    iceZones:[{id:'crystal-11-floor-ice',x:160,y:502,w:175,h:18}],
    hazards:[
      {id:'crystal-11-water',x:345,y:493,w:42,h:35,type:'water'},
      {id:'crystal-11-fire',x:565,y:493,w:42,h:35,type:'fire'}
    ],
    switches:[{id:'fire',element:'fire',x:225,y:450,w:54,h:10},{id:'water',element:'water',x:725,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:465,y:390},{id:'water',element:'water',x:725,y:425}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:1, mechanic:'Arus yang mendorong', modifier:'normal',
    note:'Arus biru mendorong karakter ke samping. Gunakan arah gerak untuk melawan atau manfaatkan dorongannya.',
    features:['water-currents','ice-platforms'],
    platforms:[
      {id:'crystal-12-a',x:155,y:455,w:135,kind:'ice'},
      {id:'crystal-12-b',x:355,y:415,w:130,kind:'crystal'},
      {id:'crystal-12-c',x:555,y:455,w:135,kind:'ice'},
      {id:'crystal-12-d',x:755,y:415,w:120,kind:'stone'}
    ],
    currents:[
      {id:'crystal-12-flow-a',x:275,y:430,w:145,h:88,forceX:155,forceY:0,phaseMs:0,pulsePeriodMs:5200},
      {id:'crystal-12-flow-b',x:505,y:430,w:145,h:88,forceX:-125,forceY:0,phaseMs:1300,pulsePeriodMs:6100}
    ],
    hazards:[{id:'crystal-12-water',x:300,y:493,w:45,h:35,type:'water'},{id:'crystal-12-fire',x:690,y:493,w:45,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:805,y:410,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:420,y:390},{id:'water',element:'water',x:805,y:385}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:2, mechanic:'Lorong pecahan es', modifier:'normal',
    note:'Pijakan kristal menyempit dan sebagian bergeser. Jaga momentum ketika melompat dari satu pecahan ke pecahan berikutnya.',
    features:['narrow-ice-platforms','moving-platforms','water-currents'],
    platforms:[
      {id:'crystal-13-a',x:145,y:455,w:130,kind:'ice'},
      {id:'crystal-13-b',x:330,y:420,w:100,kind:'ice',motion:{axis:'x',amplitude:18,periodMs:5600,phaseMs:200}},
      {id:'crystal-13-c',x:520,y:390,w:105,kind:'crystal'},
      {id:'crystal-13-d',x:710,y:420,w:100,kind:'ice',motion:{axis:'x',amplitude:16,periodMs:6200,phaseMs:2700}},
      {id:'crystal-13-e',x:850,y:455,w:90,kind:'stone'}
    ],
    currents:[{id:'crystal-13-flow',x:270,y:438,w:470,h:76,forceX:95,forceY:0,phaseMs:700,pulsePeriodMs:6800}],
    hazards:[{id:'crystal-13-water',x:275,y:493,w:45,h:35,type:'water'},{id:'crystal-13-fire',x:650,y:493,w:45,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:780,y:415,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:380,y:395},{id:'water',element:'water',x:760,y:395}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:2, mechanic:'Cermin es', modifier:'slippery',
    note:'Lantai dan pijakan es membuat karakter terus meluncur. Atur jarak berhenti dan jangan menekan arah sampai tepi.',
    features:['wide-ice-zones','slippery-floor','split-route'],
    platforms:[
      {id:'crystal-14-a',x:165,y:450,w:150,kind:'ice'},
      {id:'crystal-14-b',x:385,y:410,w:125,kind:'stone'},
      {id:'crystal-14-c',x:590,y:410,w:135,kind:'ice'},
      {id:'crystal-14-d',x:790,y:450,w:115,kind:'crystal'}
    ],
    iceZones:[
      {id:'crystal-14-ice-left',x:120,y:502,w:245,h:18},
      {id:'crystal-14-ice-right',x:545,y:502,w:230,h:18}
    ],
    currents:[{id:'crystal-14-cross-flow',x:390,y:445,w:185,h:70,forceX:0,forceY:-95,phaseMs:800,pulsePeriodMs:7400}],
    hazards:[{id:'crystal-14-water',x:350,y:493,w:45,h:35,type:'water'},{id:'crystal-14-fire',x:690,y:493,w:45,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:220,y:445,w:56,h:10},{id:'water',element:'water',x:805,y:445,w:56,h:10}],
    gems:[{id:'fire',element:'fire',x:445,y:385},{id:'water',element:'water',x:650,y:385}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:2, mechanic:'Jembatan kristal berkala', modifier:'normal',
    note:'Jembatan es muncul dan menghilang mengikuti ritme. Tunggu sampai pijakan benar-benar terbentuk sebelum melompat.',
    features:['timed-crystal-bridge','timed-platforms','ice-platforms'],
    platforms:[
      {id:'crystal-15-a',x:145,y:455,w:130,kind:'ice'},
      {id:'crystal-15-b',x:325,y:425,w:112,kind:'ice',cycle:{periodMs:5600,activeMs:3900,phaseMs:0}},
      {id:'crystal-15-c',x:505,y:395,w:112,kind:'crystal',cycle:{periodMs:5600,activeMs:3900,phaseMs:1850}},
      {id:'crystal-15-d',x:685,y:425,w:112,kind:'ice'},
      {id:'crystal-15-e',x:835,y:455,w:100,kind:'stone'}
    ],
    currents:[{id:'crystal-15-low-flow',x:270,y:470,w:470,h:45,forceX:65,forceY:0,phaseMs:0,pulsePeriodMs:6200}],
    hazards:[{id:'crystal-15-water',x:275,y:493,w:42,h:35,type:'water'},{id:'crystal-15-fire',x:790,y:493,w:42,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:750,y:420,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:380,y:400},{id:'water',element:'water',x:740,y:400}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Arus terbalik', modifier:'normal',
    note:'Arus berganti arah secara perlahan. Amati partikel arus dan pilih momen untuk menyeberang.',
    features:['reversing-currents','ice-platforms','timed-hazards'],
    platforms:[
      {id:'crystal-16-a',x:150,y:455,w:130,kind:'ice'},
      {id:'crystal-16-b',x:355,y:410,w:120,kind:'crystal'},
      {id:'crystal-16-c',x:555,y:375,w:120,kind:'ice'},
      {id:'crystal-16-d',x:765,y:430,w:125,kind:'stone'}
    ],
    currents:[
      {id:'crystal-16-reverse-a',x:270,y:390,w:250,h:125,forceX:175,forceY:0,reversePeriodMs:6200,phaseMs:0},
      {id:'crystal-16-reverse-b',x:520,y:385,w:245,h:125,forceX:-145,forceY:0,reversePeriodMs:7200,phaseMs:1800}
    ],
    hazards:[{id:'crystal-16-water',x:290,y:493,w:50,h:35,type:'water',cycle:{periodMs:5200,activeMs:3900,phaseMs:0}},{id:'crystal-16-fire',x:670,y:493,w:50,h:35,type:'fire',cycle:{periodMs:6000,activeMs:4400,phaseMs:1900}}],
    switches:[{id:'fire',element:'fire',x:210,y:450,w:54,h:10},{id:'water',element:'water',x:800,y:425,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:410,y:385},{id:'water',element:'water',x:610,y:350}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Menara lift kristal', modifier:'normal',
    note:'Lift kristal bergerak naik turun. Naiki lift saat berada di posisi rendah, lalu lanjutkan ke pijakan berikutnya.',
    features:['vertical-lifts','moving-platforms','elevated-switches'],
    platforms:[
      {id:'crystal-17-base-a',x:155,y:455,w:130,kind:'stone'},
      {id:'crystal-17-lift-a',x:315,y:415,w:112,kind:'ice',motion:{axis:'y',amplitude:34,periodMs:6200,phaseMs:800}},
      {id:'crystal-17-mid',x:485,y:375,w:112,kind:'crystal'},
      {id:'crystal-17-lift-b',x:650,y:415,w:112,kind:'ice',motion:{axis:'y',amplitude:34,periodMs:6800,phaseMs:2800}},
      {id:'crystal-17-base-b',x:815,y:455,w:110,kind:'stone'}
    ],
    currents:[{id:'crystal-17-updraft',x:430,y:410,w:225,h:105,forceX:0,forceY:-125,phaseMs:500,pulsePeriodMs:5800}],
    hazards:[{id:'crystal-17-water',x:295,y:493,w:45,h:35,type:'water'},{id:'crystal-17-fire',x:615,y:493,w:45,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:210,y:450,w:54,h:10},{id:'water',element:'water',x:560,y:370,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:370,y:390},{id:'water',element:'water',x:700,y:390}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Ruang resonansi', modifier:'normal',
    note:'Dua arus vertikal bertemu di tengah ruangan. Gunakan dorongan ke atas untuk mencapai kristal, lalu turun ke pijakan pasangan.',
    features:['opposing-currents','vertical-platforms','co-op-route'],
    platforms:[
      {id:'crystal-18-a',x:145,y:455,w:130,kind:'ice'},
      {id:'crystal-18-b',x:340,y:400,w:110,kind:'crystal',motion:{axis:'y',amplitude:22,periodMs:5900,phaseMs:0}},
      {id:'crystal-18-c',x:530,y:360,w:110,kind:'ice',motion:{axis:'y',amplitude:22,periodMs:5900,phaseMs:2950}},
      {id:'crystal-18-d',x:735,y:430,w:125,kind:'stone'}
    ],
    currents:[
      {id:'crystal-18-updraft',x:280,y:400,w:190,h:115,forceX:0,forceY:-190,phaseMs:0,pulsePeriodMs:6500},
      {id:'crystal-18-downdraft',x:500,y:395,w:190,h:120,forceX:0,forceY:125,phaseMs:1200,pulsePeriodMs:7000}
    ],
    hazards:[{id:'crystal-18-water',x:280,y:493,w:48,h:35,type:'water'},{id:'crystal-18-fire',x:690,y:493,w:48,h:35,type:'fire'}],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:795,y:425,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:395,y:375},{id:'water',element:'water',x:585,y:335}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Badai serpihan', modifier:'slippery',
    note:'Arus kuat, pijakan yang menghilang, dan bahaya elemen bergerak membuat jalur berubah. Perhatikan ritme sebelum melompat.',
    features:['strong-currents','timed-platforms','moving-hazards','ice-zones'],
    platforms:[
      {id:'crystal-19-a',x:145,y:455,w:125,kind:'ice'},
      {id:'crystal-19-b',x:330,y:410,w:108,kind:'ice',cycle:{periodMs:5200,activeMs:3600,phaseMs:0}},
      {id:'crystal-19-c',x:515,y:380,w:108,kind:'crystal',motion:{axis:'x',amplitude:22,periodMs:5400,phaseMs:1300}},
      {id:'crystal-19-d',x:700,y:410,w:108,kind:'ice'},
      {id:'crystal-19-e',x:840,y:455,w:100,kind:'stone'}
    ],
    iceZones:[{id:'crystal-19-floor-ice',x:350,y:502,w:310,h:18}],
    currents:[
      {id:'crystal-19-surge-a',x:245,y:420,w:250,h:100,forceX:205,forceY:-35,reversePeriodMs:5400,phaseMs:0},
      {id:'crystal-19-surge-b',x:495,y:420,w:260,h:100,forceX:-185,forceY:0,reversePeriodMs:6200,phaseMs:1800}
    ],
    hazards:[
      {id:'crystal-19-water',x:280,y:493,w:55,h:35,type:'water',motion:{axis:'x',amplitude:18,periodMs:5200,phaseMs:0}},
      {id:'crystal-19-fire',x:655,y:493,w:55,h:35,type:'fire',motion:{axis:'x',amplitude:20,periodMs:5700,phaseMs:2100}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:405,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:385,y:385},{id:'water',element:'water',x:750,y:385}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Penjaga Geode', modifier:'normal',
    note:'Ujian Kedalaman Kristal: atur pijakan di atas es, lawan arus, naiki lift, dan seberangi jembatan yang muncul bergantian.',
    features:['ice-zones','reversing-currents','vertical-lifts','timed-platforms','moving-hazards','co-op-gate'],
    platforms:[
      {id:'crystal-20-a',x:145,y:455,w:125,kind:'ice'},
      {id:'crystal-20-b',x:320,y:415,w:108,kind:'ice',motion:{axis:'y',amplitude:22,periodMs:5600,phaseMs:0}},
      {id:'crystal-20-c',x:500,y:385,w:108,kind:'crystal',cycle:{periodMs:5900,activeMs:4100,phaseMs:1200}},
      {id:'crystal-20-d',x:680,y:415,w:108,kind:'ice'},
      {id:'crystal-20-e',x:840,y:455,w:100,kind:'stone'}
    ],
    iceZones:[{id:'crystal-20-floor-ice',x:275,y:502,w:410,h:18}],
    currents:[
      {id:'crystal-20-flow-a',x:255,y:415,w:230,h:105,forceX:160,forceY:-65,reversePeriodMs:6000,phaseMs:0},
      {id:'crystal-20-flow-b',x:495,y:415,w:250,h:105,forceX:-150,forceY:-45,reversePeriodMs:6800,phaseMs:1700}
    ],
    hazards:[
      {id:'crystal-20-water',x:275,y:493,w:50,h:35,type:'water',motion:{axis:'x',amplitude:14,periodMs:6100,phaseMs:500}},
      {id:'crystal-20-fire',x:655,y:493,w:50,h:35,type:'fire',motion:{axis:'x',amplitude:16,periodMs:6500,phaseMs:2500}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:740,y:410,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:375,y:390},{id:'water',element:'water',x:730,y:390}],
    checkpoint:{x:485,y:482}
  }
];


// Hand-authored third-world layouts. Lava, timed steam vents, interactable valves,
// and ordered pressure plates are evaluated from the shared Firebase level clock/state.
const WORLD_THREE_BLUEPRINTS = [
  {
    difficulty:3, mechanic:'Lava berdenyut',
    note:'Lava menyala dan mereda secara berkala. Amati permukaannya sebelum menyeberang; Bara aman di lava, Nira harus menghindarinya.',
    features:['pulsing-lava','timed-hazards','element-routes'],
    platforms:[
      {id:'ember-21-a',x:160,y:455,w:150,kind:'stone'},
      {id:'ember-21-b',x:390,y:420,w:135,kind:'crystal'},
      {id:'ember-21-c',x:650,y:455,w:155,kind:'stone'}
    ],
    hazards:[
      {id:'ember-21-lava-a',x:310,y:486,w:70,h:34,type:'fire',visual:'lava',cycle:{periodMs:5600,activeMs:3600,phaseMs:0}},
      {id:'ember-21-lava-b',x:540,y:486,w:72,h:34,type:'fire',visual:'lava',cycle:{periodMs:6200,activeMs:3900,phaseMs:2300}}
    ],
    switches:[{id:'fire',element:'fire',x:220,y:450,w:56,h:10},{id:'water',element:'water',x:725,y:450,w:56,h:10}],
    gems:[{id:'fire',element:'fire',x:450,y:390},{id:'water',element:'water',x:725,y:425}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Semburan uap',
    note:'Ventilasi mengeluarkan uap panas dalam jeda tertentu. Uap berbahaya bagi Bara maupun Nira; tunggu hingga semburan padam.',
    features:['steam-vents','timed-hazards','split-route'],
    platforms:[
      {id:'ember-22-a',x:150,y:455,w:145,kind:'stone'},
      {id:'ember-22-b',x:345,y:420,w:120,kind:'crystal'},
      {id:'ember-22-c',x:555,y:420,w:120,kind:'stone'},
      {id:'ember-22-d',x:755,y:455,w:145,kind:'stone'}
    ],
    hazards:[
      {id:'ember-22-steam-a',x:290,y:430,w:42,h:70,type:'steam',visual:'steam',cycle:{periodMs:5200,activeMs:2300,phaseMs:0}},
      {id:'ember-22-steam-b',x:485,y:410,w:46,h:90,type:'steam',visual:'steam',cycle:{periodMs:6100,activeMs:2500,phaseMs:2100}},
      {id:'ember-22-steam-c',x:685,y:430,w:42,h:70,type:'steam',visual:'steam',cycle:{periodMs:5600,activeMs:2200,phaseMs:3500}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:790,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:405,y:390},{id:'water',element:'water',x:610,y:390}],
    checkpoint:{x:570,y:482}
  },
  {
    difficulty:3, mechanic:'Katup pengendali magma',
    note:'Dekati katup Bara dan tekan INTERAKSI untuk menutup aliran magma. Setelah jalur aman, aktifkan kedua pijakan elemen.',
    features:['valve-interaction','valve-controlled-lava','co-op-gate'],
    platforms:[
      {id:'ember-23-a',x:155,y:455,w:150,kind:'stone'},
      {id:'ember-23-valve',x:360,y:420,w:150,kind:'crystal'},
      {id:'ember-23-mid',x:565,y:455,w:135,kind:'stone'},
      {id:'ember-23-d',x:755,y:455,w:145,kind:'stone'}
    ],
    hazards:[
      {id:'ember-23-lava-channel',x:305,y:486,w:220,h:34,type:'fire',visual:'lava',valveId:'north-valve'},
      {id:'ember-23-steam',x:610,y:425,w:42,h:75,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2600,phaseMs:1500}}
    ],
    valves:[{id:'north-valve',x:430,y:392,element:'fire',label:'Katup Bara'}],
    requiredValves:['north-valve'],
    switches:[{id:'fire',element:'fire',x:220,y:450,w:54,h:10},{id:'water',element:'water',x:785,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:430,y:390},{id:'water',element:'water',x:680,y:425}],
    checkpoint:{x:560,y:482}
  },
  {
    difficulty:3, mechanic:'Jembatan platform di atas lava',
    note:'Gunakan platform yang bergerak untuk menyeberangi aliran lava. Tunggu platform mendekat sebelum melompat.',
    features:['moving-platforms','lava-below','platform-riding'],
    platforms:[
      {id:'ember-24-a',x:145,y:455,w:135,kind:'stone'},
      {id:'ember-24-move-a',x:320,y:420,w:110,kind:'crystal',motion:{axis:'x',amplitude:42,periodMs:5600,phaseMs:0}},
      {id:'ember-24-mid',x:500,y:390,w:115,kind:'stone'},
      {id:'ember-24-move-b',x:600,y:420,w:100,kind:'crystal',motion:{axis:'x',amplitude:24,periodMs:6300,phaseMs:2700}},
      {id:'ember-24-e',x:745,y:455,w:125,kind:'stone'}
    ],
    hazards:[
      {id:'ember-24-lava-a',x:275,y:487,w:65,h:33,type:'fire',visual:'lava',cycle:{periodMs:6400,activeMs:4700,phaseMs:0}},
      {id:'ember-24-lava-b',x:600,y:487,w:70,h:33,type:'fire',visual:'lava',cycle:{periodMs:5900,activeMs:4300,phaseMs:1900}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:780,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:360},{id:'water',element:'water',x:735,y:390}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:3, mechanic:'Sungai pendingin',
    note:'Jalur air memadamkan panas di beberapa bagian, tetapi genangan tetap berbahaya bagi Bara. Pilih jalur elemen dan atur lompatan.',
    features:['water-and-lava-routes','steam-current','split-route'],
    platforms:[
      {id:'ember-25-a',x:150,y:455,w:145,kind:'stone'},
      {id:'ember-25-b',x:350,y:420,w:125,kind:'crystal'},
      {id:'ember-25-c',x:555,y:420,w:125,kind:'stone'},
      {id:'ember-25-d',x:755,y:455,w:145,kind:'stone'}
    ],
    currents:[{id:'ember-25-cooling-flow',x:300,y:430,w:390,h:80,forceX:35,forceY:-62,phaseMs:500,pulsePeriodMs:6800}],
    hazards:[
      {id:'ember-25-water',x:285,y:486,w:80,h:34,type:'water',cycle:{periodMs:7000,activeMs:5600,phaseMs:0}},
      {id:'ember-25-lava',x:590,y:486,w:82,h:34,type:'fire',visual:'lava',cycle:{periodMs:6500,activeMs:4500,phaseMs:1700}},
      {id:'ember-25-steam',x:465,y:410,w:40,h:90,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2100,phaseMs:3300}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:790,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:410,y:390},{id:'water',element:'water',x:610,y:390}],
    checkpoint:{x:560,y:482}
  },
  {
    difficulty:4, mechanic:'Sakelar berurutan',
    note:'Urutannya adalah Nira terlebih dahulu, lalu Bara. Pijakan yang salah urutan belum bisa diaktifkan.',
    features:['ordered-switches','timed-steam','co-op-puzzle'],
    switchSequence:['water','fire'],
    platforms:[
      {id:'ember-26-a',x:155,y:455,w:145,kind:'stone'},
      {id:'ember-26-b',x:360,y:420,w:125,kind:'crystal'},
      {id:'ember-26-c',x:565,y:420,w:125,kind:'stone'},
      {id:'ember-26-d',x:760,y:455,w:145,kind:'stone'}
    ],
    hazards:[
      {id:'ember-26-steam-a',x:305,y:425,w:42,h:75,type:'steam',visual:'steam',cycle:{periodMs:5200,activeMs:2400,phaseMs:800}},
      {id:'ember-26-lava',x:500,y:486,w:75,h:34,type:'fire',visual:'lava',cycle:{periodMs:6300,activeMs:4300,phaseMs:1900}},
      {id:'ember-26-steam-b',x:700,y:425,w:42,h:75,type:'steam',visual:'steam',cycle:{periodMs:5800,activeMs:2200,phaseMs:2700}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:790,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:410,y:390},{id:'water',element:'water',x:610,y:390}],
    checkpoint:{x:620,y:482}
  },
  {
    difficulty:4, mechanic:'Lorong semburan uap',
    note:'Semburan uap muncul bergantian di lorong. Perhatikan fase setiap ventilasi dan bergerak saat jalur aman.',
    features:['steam-corridor','alternating-hazards','moving-platforms'],
    platforms:[
      {id:'ember-27-a',x:145,y:455,w:135,kind:'stone'},
      {id:'ember-27-b',x:315,y:420,w:105,kind:'crystal',motion:{axis:'x',amplitude:18,periodMs:5100,phaseMs:300}},
      {id:'ember-27-c',x:500,y:390,w:110,kind:'stone'},
      {id:'ember-27-d',x:620,y:420,w:105,kind:'crystal',motion:{axis:'x',amplitude:18,periodMs:5700,phaseMs:2400}},
      {id:'ember-27-e',x:745,y:455,w:125,kind:'stone'}
    ],
    hazards:[
      {id:'ember-27-steam-a',x:255,y:420,w:42,h:80,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2200,phaseMs:0}},
      {id:'ember-27-steam-b',x:440,y:400,w:44,h:100,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2200,phaseMs:2050}},
      {id:'ember-27-steam-c',x:625,y:420,w:42,h:80,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2200,phaseMs:4100}},
      {id:'ember-27-steam-d',x:790,y:420,w:42,h:80,type:'steam',visual:'steam',cycle:{periodMs:7000,activeMs:2100,phaseMs:5200}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:790,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:360},{id:'water',element:'water',x:700,y:390}],
    checkpoint:{x:560,y:482}
  },
  {
    difficulty:4, mechanic:'Lava meninggi',
    note:'Permukaan magma bergerak naik dan turun. Jangan menunggu terlalu lama di pijakan rendah; terus bergerak ke jalur yang lebih tinggi.',
    features:['rising-lava','moving-hazard','timed-route'],
    platforms:[
      {id:'ember-28-a',x:145,y:455,w:135,kind:'stone'},
      {id:'ember-28-b',x:330,y:420,w:115,kind:'crystal'},
      {id:'ember-28-c',x:515,y:385,w:115,kind:'stone'},
      {id:'ember-28-d',x:700,y:420,w:115,kind:'crystal'}
    ],
    hazards:[
      {id:'ember-28-rising-magma',x:290,y:470,w:390,h:50,type:'fire',visual:'lava',motion:{axis:'y',amplitude:34,periodMs:9000,phaseMs:0}},
      {id:'ember-28-steam',x:630,y:405,w:42,h:95,type:'steam',visual:'steam',cycle:{periodMs:5700,activeMs:2300,phaseMs:1900}}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:785,y:415,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:370,y:390},{id:'water',element:'water',x:735,y:390}],
    checkpoint:{x:760,y:482}
  },
  {
    difficulty:4, mechanic:'Dua katup elemen',
    note:'Bara dan Nira harus mengaktifkan katup masing-masing. Kedua katup mengendalikan ventilasi yang menghalangi jalur.',
    features:['dual-valves','element-assigned-interaction','co-op-gate'],
    platforms:[
      {id:'ember-29-a',x:155,y:455,w:150,kind:'stone'},
      {id:'ember-29-fire-valve',x:350,y:420,w:145,kind:'crystal'},
      {id:'ember-29-mid',x:555,y:420,w:135,kind:'stone'},
      {id:'ember-29-water-valve',x:745,y:455,w:155,kind:'crystal'}
    ],
    hazards:[
      {id:'ember-29-steam-fire',x:305,y:420,w:45,h:80,type:'steam',visual:'steam',valveId:'bara-valve'},
      {id:'ember-29-steam-water',x:665,y:420,w:45,h:80,type:'steam',visual:'steam',valveId:'nira-valve'},
      {id:'ember-29-lava',x:500,y:486,w:70,h:34,type:'fire',visual:'lava',cycle:{periodMs:6200,activeMs:4100,phaseMs:1700}}
    ],
    valves:[
      {id:'bara-valve',x:415,y:392,element:'fire',label:'Katup Bara'},
      {id:'nira-valve',x:815,y:427,element:'water',label:'Katup Air'}
    ],
    requiredValves:['bara-valve','nira-valve'],
    switches:[{id:'fire',element:'fire',x:220,y:450,w:54,h:10},{id:'water',element:'water',x:785,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:415,y:390},{id:'water',element:'water',x:610,y:390}],
    checkpoint:{x:600,y:482}
  },
  {
    difficulty:5, mechanic:'Jantung tungku',
    note:'Ujian terakhir Kerajaan Bara: masing-masing pemain aktifkan katup elemennya. Setelah itu nyalakan pijakan Nira lalu Bara sesuai urutan. Hindari magma bergerak dan semburan uap sebelum menuju pintu.',
    features:['final-furnace','ordered-switches','dual-valves','pulsing-lava','steam-vents','moving-platforms'],
    switchSequence:['water','fire'],
    platforms:[
      {id:'ember-30-a',x:145,y:455,w:135,kind:'stone'},
      {id:'ember-30-b',x:320,y:420,w:110,kind:'crystal',motion:{axis:'x',amplitude:22,periodMs:5600,phaseMs:0}},
      {id:'ember-30-c',x:500,y:385,w:115,kind:'stone'},
      {id:'ember-30-d',x:680,y:420,w:135,kind:'crystal',motion:{axis:'x',amplitude:12,periodMs:6100,phaseMs:2400}}
    ],
    hazards:[
      {id:'ember-30-lava-a',x:260,y:486,w:90,h:34,type:'fire',visual:'lava',cycle:{periodMs:5900,activeMs:4100,phaseMs:0}},
      {id:'ember-30-steam-a',x:420,y:405,w:44,h:95,type:'steam',visual:'steam',valveId:'final-bara-valve',cycle:{periodMs:6100,activeMs:2300,phaseMs:1800}},
      {id:'ember-30-rising-lava',x:560,y:466,w:125,h:54,type:'fire',visual:'lava',motion:{axis:'y',amplitude:28,periodMs:8200,phaseMs:900}},
      {id:'ember-30-steam-b',x:735,y:405,w:44,h:95,type:'steam',visual:'steam',valveId:'final-nira-valve',cycle:{periodMs:6500,activeMs:2400,phaseMs:3700}}
    ],
    valves:[
      {id:'final-bara-valve',x:205,y:427,element:'fire',label:'Katup Bara'},
      {id:'final-nira-valve',x:735,y:392,element:'water',label:'Katup Air'}
    ],
    requiredValves:['final-nira-valve','final-bara-valve'],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:785,y:415,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:355},{id:'water',element:'water',x:840,y:420}],
    checkpoint:{x:520,y:482}
  }
];


// Hand-authored fourth-world layouts. Wind fields and interactive direction levers
// use the shared Firebase level clock/state so both players see the same gust phases.
const WORLD_FOUR_BLUEPRINTS = [
  {
    difficulty:4, mechanic:'Tangga awan dan arus naik',
    note:'Gunakan hembusan ke atas untuk mencapai pijakan tinggi. Tekanan angin berubah secara berkala, jadi atur waktu lompatan.',
    features:['updrafts','vertical-route','wind-pulse'],
    platforms:[
      {id:'sky-31-a',x:140,y:455,w:145,kind:'cloud'},
      {id:'sky-31-b',x:320,y:415,w:125,kind:'cloud'},
      {id:'sky-31-c',x:500,y:375,w:125,kind:'crystal'},
      {id:'sky-31-d',x:680,y:415,w:145,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-31-water',x:390,y:493,w:52,h:35,type:'water'},
      {id:'sky-31-fire',x:575,y:493,w:52,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-31-updraft-a',x:265,y:330,w:190,h:175,forceX:0,forceY:-175,pulsePeriodMs:7200,phaseMs:0},
      {id:'sky-31-crosswind',x:475,y:350,w:190,h:135,forceX:92,forceY:-24,pulsePeriodMs:6400,phaseMs:1100}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:410,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:380,y:385},{id:'water',element:'water',x:575,y:345}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Pulau melayang',
    note:'Pulau kecil bergerak mengikuti angin. Tunggu posisinya mendekat, lalu lompat ke pulau berikutnya.',
    features:['floating-islands','moving-platforms','gust-pulse'],
    platforms:[
      {id:'sky-32-a',x:140,y:455,w:140,kind:'cloud'},
      {id:'sky-32-b',x:310,y:420,w:115,kind:'cloud',motion:{axis:'x',amplitude:28,periodMs:5700,phaseMs:0}},
      {id:'sky-32-c',x:490,y:385,w:120,kind:'crystal',motion:{axis:'y',amplitude:16,periodMs:6200,phaseMs:2300}},
      {id:'sky-32-d',x:680,y:420,w:145,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-32-water',x:420,y:493,w:50,h:35,type:'water',motion:{axis:'x',amplitude:12,periodMs:6200,phaseMs:0}},
      {id:'sky-32-fire',x:585,y:493,w:50,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-32-gust-a',x:260,y:350,w:225,h:135,forceX:118,forceY:-58,pulsePeriodMs:5900,phaseMs:300},
      {id:'sky-32-updraft',x:475,y:320,w:180,h:170,forceX:0,forceY:-145,pulsePeriodMs:6800,phaseMs:1800}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:415,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:365,y:390},{id:'water',element:'water',x:550,y:350}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:4, mechanic:'Lorong angin berlawanan',
    note:'Dua lorong angin mendorong ke arah berbeda. Manfaatkan hembusan pertama, lalu lawan dorongan berikutnya.',
    features:['opposing-gusts','wind-corridor','timed-wind'],
    platforms:[
      {id:'sky-33-a',x:140,y:455,w:145,kind:'cloud'},
      {id:'sky-33-b',x:320,y:420,w:125,kind:'cloud'},
      {id:'sky-33-c',x:500,y:420,w:125,kind:'crystal'},
      {id:'sky-33-d',x:680,y:455,w:145,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-33-water',x:385,y:493,w:55,h:35,type:'water'},
      {id:'sky-33-fire',x:565,y:493,w:55,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-33-east-wind',x:250,y:350,w:235,h:145,forceX:175,forceY:0,pulsePeriodMs:6500,phaseMs:0},
      {id:'sky-33-west-wind',x:480,y:350,w:230,h:145,forceX:-165,forceY:0,pulsePeriodMs:6500,phaseMs:2600}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:380,y:395},{id:'water',element:'water',x:575,y:395}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Menara terbalik',
    note:'Naiki menara melalui lift awan dan arus vertikal. Perhatikan bahwa beberapa pijakan bergerak naik-turun.',
    features:['vertical-lifts','stacked-platforms','strong-updrafts'],
    platforms:[
      {id:'sky-34-a',x:140,y:455,w:140,kind:'cloud'},
      {id:'sky-34-b',x:300,y:390,w:120,kind:'cloud'},
      {id:'sky-34-c',x:460,y:325,w:120,kind:'crystal',motion:{axis:'y',amplitude:15,periodMs:6200,phaseMs:0}},
      {id:'sky-34-d',x:620,y:260,w:120,kind:'cloud',motion:{axis:'y',amplitude:12,periodMs:6900,phaseMs:2600}},
      {id:'sky-34-e',x:760,y:325,w:65,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-34-fire',x:395,y:493,w:50,h:35,type:'fire'},
      {id:'sky-34-water',x:575,y:493,w:50,h:35,type:'water'}
    ],
    windZones:[
      {id:'sky-34-tower-updraft-a',x:245,y:300,w:210,h:205,forceX:8,forceY:-190,pulsePeriodMs:7200,phaseMs:500},
      {id:'sky-34-tower-updraft-b',x:485,y:205,w:220,h:220,forceX:-12,forceY:-165,pulsePeriodMs:7600,phaseMs:2300}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:790,y:320,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:350,y:355},{id:'water',element:'water',x:675,y:225}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Kunci badai',
    note:'Cari tuas angin di pulau tengah. Pemain yang mengaktifkannya akan membalik arah hembusan dan membuka jalur ke gerbang.',
    features:['wind-direction-switch','interactive-wind-lever','co-op-gate'],
    platforms:[
      {id:'sky-35-a',x:140,y:455,w:145,kind:'cloud'},
      {id:'sky-35-b',x:320,y:415,w:130,kind:'cloud'},
      {id:'sky-35-c',x:500,y:415,w:130,kind:'crystal'},
      {id:'sky-35-d',x:680,y:455,w:145,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-35-water',x:390,y:493,w:52,h:35,type:'water'},
      {id:'sky-35-fire',x:575,y:493,w:52,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-35-valley-wind',x:250,y:340,w:430,h:150,forceX:155,forceY:-20,pulsePeriodMs:6200,phaseMs:400,leverId:'storm-turn'},
      {id:'sky-35-updraft',x:520,y:300,w:170,h:145,forceX:0,forceY:-125,pulsePeriodMs:7000,phaseMs:2100}
    ],
    windLevers:[{id:'storm-turn',x:385,y:387,element:null,label:'Tuas Badai',radius:64}],
    requiredWindLevers:['storm-turn'],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:385,y:390},{id:'water',element:'water',x:575,y:390}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:4, mechanic:'Jembatan awan bergerak',
    note:'Dua pulau bergerak saling mendekat dan menjauh. Tunggu ritme yang tepat dan gunakan angin untuk menjaga momentum.',
    features:['moving-cloud-platforms','platform-riding','crosswind'],
    platforms:[
      {id:'sky-36-a',x:130,y:455,w:140,kind:'cloud'},
      {id:'sky-36-b',x:300,y:420,w:115,kind:'cloud',motion:{axis:'x',amplitude:30,periodMs:5900,phaseMs:0}},
      {id:'sky-36-c',x:465,y:385,w:120,kind:'crystal'},
      {id:'sky-36-d',x:620,y:420,w:115,kind:'cloud',motion:{axis:'x',amplitude:28,periodMs:6300,phaseMs:2800}},
      {id:'sky-36-e',x:775,y:455,w:55,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-36-water',x:410,y:493,w:50,h:35,type:'water',cycle:{periodMs:6200,activeMs:4500,phaseMs:0}},
      {id:'sky-36-fire',x:570,y:493,w:50,h:35,type:'fire',cycle:{periodMs:6500,activeMs:4700,phaseMs:1700}}
    ],
    windZones:[
      {id:'sky-36-cross-a',x:245,y:350,w:210,h:145,forceX:125,forceY:-35,pulsePeriodMs:6100,phaseMs:0},
      {id:'sky-36-cross-b',x:510,y:350,w:220,h:145,forceX:-112,forceY:-20,pulsePeriodMs:6700,phaseMs:2300}
    ],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:800,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:355,y:390},{id:'water',element:'water',x:675,y:390}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:5, mechanic:'Kubah senyap',
    note:'Di tengah kubah terdapat zona tenang. Gunakan ruang tanpa angin untuk mengatur lompatan sebelum melewati dua dinding hembusan.',
    features:['wind-tunnel','calm-pocket','precision-jumps'],
    platforms:[
      {id:'sky-37-a',x:140,y:455,w:145,kind:'cloud'},
      {id:'sky-37-b',x:330,y:405,w:125,kind:'cloud'},
      {id:'sky-37-c',x:505,y:405,w:130,kind:'crystal'},
      {id:'sky-37-d',x:690,y:455,w:140,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-37-water',x:390,y:493,w:52,h:35,type:'water'},
      {id:'sky-37-fire',x:575,y:493,w:52,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-37-entry-gust',x:245,y:330,w:205,h:145,forceX:185,forceY:0,pulsePeriodMs:5700,phaseMs:0},
      {id:'sky-37-exit-gust',x:520,y:330,w:190,h:145,forceX:-178,forceY:0,pulsePeriodMs:6100,phaseMs:2200},
      {id:'sky-37-lift',x:445,y:345,w:105,h:120,forceX:0,forceY:-95,pulsePeriodMs:6800,phaseMs:0}
    ],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:390,y:375},{id:'water',element:'water',x:575,y:375}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:5, mechanic:'Portal kembar',
    note:'Bara dan Nira harus mengaktifkan tuas angin milik masing-masing. Kedua arah hembusan harus benar agar gerbang kembar terbuka.',
    features:['dual-wind-levers','element-assigned-interaction','co-op-gate'],
    platforms:[
      {id:'sky-38-a',x:140,y:455,w:145,kind:'cloud'},
      {id:'sky-38-b',x:320,y:415,w:130,kind:'cloud'},
      {id:'sky-38-c',x:500,y:380,w:130,kind:'crystal'},
      {id:'sky-38-d',x:680,y:415,w:145,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-38-water',x:390,y:493,w:52,h:35,type:'water'},
      {id:'sky-38-fire',x:575,y:493,w:52,h:35,type:'fire'}
    ],
    windZones:[
      {id:'sky-38-fire-gust',x:245,y:335,w:250,h:145,forceX:145,forceY:-30,pulsePeriodMs:6300,phaseMs:0,leverId:'fire-gust-key'},
      {id:'sky-38-water-gust',x:480,y:335,w:245,h:145,forceX:-140,forceY:-25,pulsePeriodMs:6500,phaseMs:1800,leverId:'water-gust-key'}
    ],
    windLevers:[
      {id:'fire-gust-key',x:385,y:387,element:'fire',label:'Tuas Bara',radius:62},
      {id:'water-gust-key',x:565,y:352,element:'water',label:'Tuas Air',radius:62}
    ],
    requiredWindLevers:['fire-gust-key','water-gust-key'],
    switches:[{id:'fire',element:'fire',x:205,y:450,w:54,h:10},{id:'water',element:'water',x:755,y:410,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:385,y:390},{id:'water',element:'water',x:565,y:355}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:5, mechanic:'Labirin langit',
    note:'Lorong angin berbalik arah pada waktu berbeda. Baca panah hembusan dan pilih saat yang tepat untuk berpindah pulau.',
    features:['reversing-wind-corridors','moving-hazards','wind-timing'],
    platforms:[
      {id:'sky-39-a',x:130,y:455,w:145,kind:'cloud'},
      {id:'sky-39-b',x:300,y:400,w:130,kind:'cloud'},
      {id:'sky-39-c',x:465,y:345,w:125,kind:'crystal'},
      {id:'sky-39-d',x:625,y:400,w:125,kind:'cloud'},
      {id:'sky-39-e',x:770,y:455,w:60,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-39-water',x:390,y:493,w:54,h:35,type:'water',motion:{axis:'x',amplitude:16,periodMs:5900,phaseMs:0}},
      {id:'sky-39-fire',x:575,y:493,w:54,h:35,type:'fire',motion:{axis:'x',amplitude:18,periodMs:6300,phaseMs:2300}}
    ],
    windZones:[
      {id:'sky-39-east-corridor',x:245,y:320,w:230,h:155,forceX:175,forceY:-28,reversePeriodMs:6500,phaseMs:0},
      {id:'sky-39-west-corridor',x:470,y:320,w:230,h:155,forceX:-165,forceY:-20,reversePeriodMs:7100,phaseMs:1900},
      {id:'sky-39-updraft',x:590,y:250,w:120,h:125,forceX:0,forceY:-135,pulsePeriodMs:5700,phaseMs:1000}
    ],
    switches:[{id:'fire',element:'fire',x:195,y:450,w:54,h:10},{id:'water',element:'water',x:800,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:365,y:370},{id:'water',element:'water',x:680,y:370}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:5, mechanic:'Penjaga Angin',
    note:'Ujian terakhir dunia langit: aktifkan kedua tuas elemen, manfaatkan lift awan, dan seberangi badai yang terus berubah arah.',
    features:['dual-wind-levers','vertical-lift','reversing-gusts','expert-co-op-gate'],
    platforms:[
      {id:'sky-40-a',x:130,y:455,w:145,kind:'cloud'},
      {id:'sky-40-b',x:300,y:410,w:130,kind:'cloud',motion:{axis:'y',amplitude:12,periodMs:5900,phaseMs:0}},
      {id:'sky-40-c',x:465,y:365,w:130,kind:'crystal'},
      {id:'sky-40-d',x:620,y:410,w:130,kind:'cloud',motion:{axis:'y',amplitude:12,periodMs:6300,phaseMs:2600}},
      {id:'sky-40-e',x:770,y:455,w:60,kind:'cloud'}
    ],
    hazards:[
      {id:'sky-40-water',x:390,y:493,w:52,h:35,type:'water',cycle:{periodMs:5900,activeMs:4300,phaseMs:0}},
      {id:'sky-40-fire',x:575,y:493,w:52,h:35,type:'fire',cycle:{periodMs:6200,activeMs:4600,phaseMs:1900}}
    ],
    windZones:[
      {id:'sky-40-bara-storm',x:245,y:320,w:245,h:155,forceX:180,forceY:-45,reversePeriodMs:7200,phaseMs:0,leverId:'final-fire-key'},
      {id:'sky-40-nira-storm',x:485,y:320,w:245,h:155,forceX:-175,forceY:-45,reversePeriodMs:7600,phaseMs:2100,leverId:'final-water-key'},
      {id:'sky-40-updraft',x:440,y:245,w:170,h:145,forceX:0,forceY:-155,pulsePeriodMs:6500,phaseMs:800}
    ],
    windLevers:[
      {id:'final-fire-key',x:520,y:337,element:'fire',label:'Kunci Bara',radius:62},
      {id:'final-water-key',x:800,y:427,element:'water',label:'Kunci Air',radius:62}
    ],
    requiredWindLevers:['final-fire-key','final-water-key'],
    switches:[{id:'fire',element:'fire',x:195,y:450,w:54,h:10},{id:'water',element:'water',x:800,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:365,y:350},{id:'water',element:'water',x:680,y:350}],
    checkpoint:{x:485,y:482}
  }
];


// Hand-authored finale-world layouts. The Ancient Heart combines the systems
// introduced in the previous worlds: elemental hazards, ice/current physics,
// timed steam/lava, cooperative valves, and wind-direction levers.
const WORLD_FIVE_BLUEPRINTS = [
  {
    difficulty:4, mechanic:'Simpul empat elemen',
    note:'Kenali kembali empat kekuatan dunia: es, arus, angin, dan panas. Baca jalur sebelum melompat menuju dua pijakan.',
    features:['mixed-element-intro','ice-zones','currents','wind-fields','timed-hazards'],
    platforms:[
      {id:'ancient-41-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-41-b',x:310,y:420,w:130,kind:'ice'},
      {id:'ancient-41-c',x:485,y:385,w:135,kind:'crystal'},
      {id:'ancient-41-d',x:665,y:420,w:130,kind:'stone'},
      {id:'ancient-41-e',x:790,y:455,w:45,kind:'crystal'}
    ],
    iceZones:[{id:'ancient-41-frozen-bridge',x:310,y:403,w:130,h:14}],
    currents:[{id:'ancient-41-cross-current',x:270,y:345,w:420,h:130,forceX:48,forceY:-34,pulsePeriodMs:7200,phaseMs:350}],
    windZones:[{id:'ancient-41-spiral-wind',x:435,y:275,w:190,h:155,forceX:24,forceY:-78,pulsePeriodMs:7600,phaseMs:1700}],
    hazards:[
      {id:'ancient-41-water',x:280,y:486,w:68,h:34,type:'water'},
      {id:'ancient-41-lava',x:455,y:486,w:70,h:34,type:'fire',visual:'lava',cycle:{periodMs:6400,activeMs:4300,phaseMs:400}},
      {id:'ancient-41-steam',x:610,y:410,w:42,h:85,type:'steam',visual:'steam',cycle:{periodMs:6100,activeMs:2100,phaseMs:2700}}
    ],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:520,y:350},{id:'water',element:'water',x:705,y:390}],
    checkpoint:{x:550,y:482}
  },
  {
    difficulty:4, mechanic:'Gerbang lima kunci',
    note:'Bara dan Nira harus membuka katup masing-masing. Katup memadamkan penghalang berbeda sebelum kedua pijakan dapat membuka gerbang.',
    features:['dual-valves','element-assigned-valves','valve-controlled-hazards','co-op-gate'],
    platforms:[
      {id:'ancient-42-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-42-b',x:300,y:420,w:135,kind:'crystal'},
      {id:'ancient-42-c',x:470,y:385,w:140,kind:'stone'},
      {id:'ancient-42-d',x:645,y:420,w:135,kind:'crystal'},
      {id:'ancient-42-e',x:790,y:455,w:45,kind:'stone'}
    ],
    hazards:[
      {id:'ancient-42-fire-seal',x:260,y:486,w:90,h:34,type:'fire',visual:'lava',valveId:'heart-fire-seal'},
      {id:'ancient-42-water-seal',x:610,y:405,w:46,h:90,type:'steam',visual:'steam',valveId:'heart-water-seal',cycle:{periodMs:6000,activeMs:2600,phaseMs:0}},
      {id:'ancient-42-water-pool',x:445,y:486,w:55,h:34,type:'water'}
    ],
    valves:[
      {id:'heart-fire-seal',x:360,y:392,element:'fire',label:'Segel Bara'},
      {id:'heart-water-seal',x:710,y:392,element:'water',label:'Segel Air'}
    ],
    requiredValves:['heart-fire-seal','heart-water-seal'],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:520,y:350},{id:'water',element:'water',x:710,y:390}],
    currents:[{id:'ancient-42-lift-current',x:420,y:320,w:250,h:135,forceX:0,forceY:-85,pulsePeriodMs:6800,phaseMs:800}],
    checkpoint:{x:550,y:482}
  },
  {
    difficulty:5, mechanic:'Kristal kembar',
    note:'Dua tuas mengubah arah arus angin di sisi yang berbeda. Bara dan Nira harus mengaktifkan tuas sesuai elemen mereka.',
    features:['dual-wind-levers','element-assigned-levers','ice-platforms','reversing-gusts','co-op-gate'],
    platforms:[
      {id:'ancient-43-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-43-b',x:300,y:420,w:135,kind:'ice'},
      {id:'ancient-43-c',x:470,y:385,w:140,kind:'crystal'},
      {id:'ancient-43-d',x:645,y:420,w:135,kind:'ice'},
      {id:'ancient-43-e',x:790,y:455,w:45,kind:'stone'}
    ],
    iceZones:[{id:'ancient-43-ice-a',x:300,y:403,w:135,h:14},{id:'ancient-43-ice-b',x:645,y:403,w:135,h:14}],
    hazards:[
      {id:'ancient-43-water',x:275,y:486,w:68,h:34,type:'water'},
      {id:'ancient-43-fire',x:590,y:486,w:72,h:34,type:'fire',visual:'lava',cycle:{periodMs:6200,activeMs:4200,phaseMs:1800}}
    ],
    windZones:[
      {id:'ancient-43-fire-current',x:245,y:330,w:255,h:145,forceX:145,forceY:-28,reversePeriodMs:6900,phaseMs:0,leverId:'twin-fire-prism'},
      {id:'ancient-43-water-current',x:485,y:330,w:250,h:145,forceX:-138,forceY:-38,reversePeriodMs:7200,phaseMs:2300,leverId:'twin-water-prism'}
    ],
    windLevers:[
      {id:'twin-fire-prism',x:360,y:392,element:'fire',label:'Kristal Bara',radius:62},
      {id:'twin-water-prism',x:710,y:392,element:'water',label:'Kristal Air',radius:62}
    ],
    requiredWindLevers:['twin-fire-prism','twin-water-prism'],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:520,y:350},{id:'water',element:'water',x:700,y:390}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:5, mechanic:'Ruang sinkron',
    note:'Urutan pijakan adalah Nira lalu Bara. Arus berdenyut dan lantai berganti bahaya; koordinasikan waktu kedatangan.',
    features:['ordered-switches','shared-timing','pulsing-current','alternating-hazards','co-op-puzzle'],
    switchSequence:['water','fire'],
    platforms:[
      {id:'ancient-44-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-44-b',x:300,y:420,w:130,kind:'crystal'},
      {id:'ancient-44-c',x:470,y:385,w:140,kind:'stone'},
      {id:'ancient-44-d',x:645,y:420,w:135,kind:'crystal'},
      {id:'ancient-44-e',x:790,y:455,w:45,kind:'stone'}
    ],
    currents:[
      {id:'ancient-44-east-flow',x:245,y:350,w:255,h:125,forceX:105,forceY:-20,pulsePeriodMs:5900,phaseMs:0},
      {id:'ancient-44-west-flow',x:480,y:350,w:245,h:125,forceX:-92,forceY:-18,pulsePeriodMs:6300,phaseMs:2100}
    ],
    hazards:[
      {id:'ancient-44-lava',x:270,y:486,w:70,h:34,type:'fire',visual:'lava',cycle:{periodMs:5700,activeMs:3700,phaseMs:0}},
      {id:'ancient-44-steam-a',x:445,y:405,w:42,h:90,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2200,phaseMs:1700}},
      {id:'ancient-44-steam-b',x:670,y:405,w:42,h:90,type:'steam',visual:'steam',cycle:{periodMs:6400,activeMs:2300,phaseMs:3900}}
    ],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:520,y:350},{id:'water',element:'water',x:700,y:390}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:5, mechanic:'Jalur terpilih',
    note:'Pilih cabang yang sesuai elemen. Arus mendorong dari satu jalur ke jalur lain, sementara pulau bergerak menghubungkan keduanya.',
    features:['split-element-routes','moving-bridges','ice-and-wind','mixed-hazards','cooperative-route'],
    platforms:[
      {id:'ancient-45-a',x:125,y:455,w:150,kind:'stone'},
      {id:'ancient-45-b',x:285,y:415,w:125,kind:'ice'},
      {id:'ancient-45-stable-spine',x:425,y:415,w:120,kind:'stone'},
      {id:'ancient-45-fire-branch',x:425,y:350,w:120,kind:'crystal',motion:{axis:'x',amplitude:22,periodMs:6100,phaseMs:0}},
      {id:'ancient-45-water-branch',x:590,y:350,w:120,kind:'ice',motion:{axis:'x',amplitude:20,periodMs:6500,phaseMs:2600}},
      {id:'ancient-45-d',x:705,y:415,w:115,kind:'stone'},
      {id:'ancient-45-e',x:790,y:455,w:45,kind:'crystal'}
    ],
    iceZones:[{id:'ancient-45-frozen-route',x:285,y:398,w:125,h:14}],
    currents:[{id:'ancient-45-cross-current',x:350,y:300,w:350,h:145,forceX:65,forceY:-75,reversePeriodMs:7600,phaseMs:900}],
    windZones:[{id:'ancient-45-crosswind',x:430,y:285,w:250,h:150,forceX:110,forceY:-25,pulsePeriodMs:6800,phaseMs:1300}],
    hazards:[
      {id:'ancient-45-water',x:270,y:486,w:64,h:34,type:'water'},
      {id:'ancient-45-lava',x:535,y:486,w:75,h:34,type:'fire',visual:'lava',cycle:{periodMs:6600,activeMs:4500,phaseMs:1200}}
    ],
    switches:[{id:'fire',element:'fire',x:195,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:485,y:315},{id:'water',element:'water',x:650,y:315}],
    checkpoint:{x:485,y:482}
  },
  {
    difficulty:5, mechanic:'Pilar harmoni',
    note:'Buka dua katup pada pilar berbeda, lalu gunakan lift samping untuk mengatur posisi sebelum mencapai pijakan bersama.',
    features:['dual-valves','vertical-lifts','moving-platforms','timed-steam','co-op-gate'],
    platforms:[
      {id:'ancient-46-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-46-b',x:300,y:420,w:135,kind:'crystal'},
      {id:'ancient-46-stable-spine',x:470,y:420,w:130,kind:'stone'},
      {id:'ancient-46-lift-a',x:450,y:390,w:110,kind:'crystal',motion:{axis:'y',amplitude:18,periodMs:6300,phaseMs:0}},
      {id:'ancient-46-d',x:645,y:420,w:135,kind:'stone'},
      {id:'ancient-46-e',x:790,y:455,w:45,kind:'crystal'},
      {id:'ancient-46-lift-b',x:545,y:335,w:95,kind:'crystal',motion:{axis:'y',amplitude:14,periodMs:6900,phaseMs:2800}}
    ],
    hazards:[
      {id:'ancient-46-fire-seal',x:260,y:486,w:82,h:34,type:'fire',visual:'lava',valveId:'harmony-fire-valve'},
      {id:'ancient-46-water-seal',x:600,y:405,w:44,h:90,type:'steam',visual:'steam',valveId:'harmony-water-valve',cycle:{periodMs:6100,activeMs:2400,phaseMs:1400}},
      {id:'ancient-46-water',x:450,y:486,w:58,h:34,type:'water'}
    ],
    valves:[
      {id:'harmony-fire-valve',x:365,y:392,element:'fire',label:'Pilar Bara'},
      {id:'harmony-water-valve',x:710,y:392,element:'water',label:'Pilar Air'}
    ],
    requiredValves:['harmony-fire-valve','harmony-water-valve'],
    currents:[{id:'ancient-46-central-lift',x:435,y:280,w:190,h:175,forceX:0,forceY:-105,pulsePeriodMs:7000,phaseMs:900}],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:350},{id:'water',element:'water',x:710,y:390}],
    checkpoint:{x:550,y:482}
  },
  {
    difficulty:5, mechanic:'Ujian Bara',
    note:'Lava, uap, dan hembusan panas memenuhi ruang. Aktifkan katup Bara untuk menghentikan aliran utama, lalu pilih jeda aman untuk menyeberang.',
    features:['rising-lava','steam-vents','fire-valve','crosswind','mixed-hazards'],
    platforms:[
      {id:'ancient-47-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-47-b',x:300,y:420,w:130,kind:'crystal'},
      {id:'ancient-47-c',x:470,y:385,w:140,kind:'stone'},
      {id:'ancient-47-d',x:645,y:420,w:135,kind:'crystal'},
      {id:'ancient-47-e',x:790,y:455,w:45,kind:'stone'}
    ],
    hazards:[
      {id:'ancient-47-main-lava',x:250,y:468,w:230,h:52,type:'fire',visual:'lava',valveId:'final-furnace-valve',motion:{axis:'y',amplitude:16,periodMs:8800,phaseMs:0}},
      {id:'ancient-47-steam-a',x:455,y:405,w:42,h:90,type:'steam',visual:'steam',cycle:{periodMs:5600,activeMs:2500,phaseMs:0}},
      {id:'ancient-47-steam-b',x:675,y:405,w:42,h:90,type:'steam',visual:'steam',cycle:{periodMs:6200,activeMs:2300,phaseMs:2900}},
      {id:'ancient-47-water',x:575,y:486,w:55,h:34,type:'water'}
    ],
    valves:[{id:'final-furnace-valve',x:360,y:392,element:'fire',label:'Katup Tungku'}],
    requiredValves:['final-furnace-valve'],
    windZones:[{id:'ancient-47-hot-gust',x:400,y:305,w:320,h:165,forceX:95,forceY:-52,pulsePeriodMs:6500,phaseMs:1700}],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:520,y:350},{id:'water',element:'water',x:700,y:390}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:5, mechanic:'Ujian Arus',
    note:'Arus berbalik arah di atas lantai es. Aktifkan kedua kristal pengarah agar hembusan membantu kalian menuju pijakan terakhir.',
    features:['ice-floor','reversing-currents','dual-wind-levers','moving-platforms','precision-route'],
    platforms:[
      {id:'ancient-48-a',x:130,y:455,w:150,kind:'stone'},
      {id:'ancient-48-b',x:300,y:420,w:130,kind:'ice'},
      {id:'ancient-48-stable-spine',x:465,y:420,w:130,kind:'stone'},
      {id:'ancient-48-c',x:470,y:385,w:140,kind:'crystal',motion:{axis:'x',amplitude:18,periodMs:6200,phaseMs:0}},
      {id:'ancient-48-d',x:645,y:420,w:135,kind:'ice'},
      {id:'ancient-48-e',x:790,y:455,w:45,kind:'stone'}
    ],
    iceZones:[{id:'ancient-48-ice-a',x:300,y:403,w:130,h:14},{id:'ancient-48-ice-b',x:645,y:403,w:135,h:14}],
    currents:[
      {id:'ancient-48-east-flow',x:230,y:330,w:260,h:145,forceX:155,forceY:-28,reversePeriodMs:6700,phaseMs:0},
      {id:'ancient-48-west-flow',x:485,y:330,w:260,h:145,forceX:-150,forceY:-32,reversePeriodMs:7100,phaseMs:2400}
    ],
    windZones:[
      {id:'ancient-48-fire-crosswind',x:245,y:330,w:250,h:145,forceX:135,forceY:-28,reversePeriodMs:6700,phaseMs:0,leverId:'ancient-fire-core'},
      {id:'ancient-48-final-updraft',x:430,y:260,w:190,h:175,forceX:0,forceY:-120,pulsePeriodMs:6600,phaseMs:1100,leverId:'ancient-air-core'}
    ],
    windLevers:[
      {id:'ancient-fire-core',x:360,y:392,element:'fire',label:'Kristal Bara'},
      {id:'ancient-air-core',x:710,y:392,element:'water',label:'Kristal Air'}
    ],
    requiredWindLevers:['ancient-fire-core','ancient-air-core'],
    hazards:[
      {id:'ancient-48-water',x:270,y:486,w:70,h:34,type:'water'},
      {id:'ancient-48-lava',x:600,y:486,w:72,h:34,type:'fire',visual:'lava',cycle:{periodMs:6200,activeMs:4200,phaseMs:1200}}
    ],
    switches:[{id:'fire',element:'fire',x:200,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:500,y:350},{id:'water',element:'water',x:710,y:390}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:5, mechanic:'Pintu purba',
    note:'Empat segel harus dibuka oleh elemen pemiliknya. Setelah itu Nira mengaktifkan pijakan lebih dahulu, lalu Bara menyelesaikan urutan.',
    features:['dual-valves','dual-wind-levers','ordered-switches','four-seals','expert-co-op-gate'],
    switchSequence:['water','fire'],
    platforms:[
      {id:'ancient-49-a',x:115,y:455,w:150,kind:'stone'},
      {id:'ancient-49-b',x:270,y:420,w:125,kind:'crystal'},
      {id:'ancient-49-c',x:415,y:385,w:125,kind:'stone'},
      {id:'ancient-49-d',x:555,y:420,w:125,kind:'crystal'},
      {id:'ancient-49-e',x:690,y:385,w:125,kind:'stone'},
      {id:'ancient-49-f',x:790,y:455,w:45,kind:'crystal'}
    ],
    valves:[
      {id:'ancient-gate-fire',x:330,y:392,element:'fire',label:'Segel Bara'},
      {id:'ancient-gate-water',x:620,y:392,element:'water',label:'Segel Air'}
    ],
    requiredValves:['ancient-gate-fire','ancient-gate-water'],
    windLevers:[
      {id:'ancient-gate-fire-wind',x:475,y:357,element:'fire',label:'Kunci Bara'},
      {id:'ancient-gate-water-wind',x:750,y:357,element:'water',label:'Kunci Air'}
    ],
    requiredWindLevers:['ancient-gate-fire-wind','ancient-gate-water-wind'],
    windZones:[
      {id:'ancient-49-east-seal',x:350,y:285,w:250,h:160,forceX:135,forceY:-35,reversePeriodMs:7200,phaseMs:0,leverId:'ancient-gate-fire-wind'},
      {id:'ancient-49-west-seal',x:560,y:285,w:250,h:160,forceX:-130,forceY:-38,reversePeriodMs:7600,phaseMs:2200,leverId:'ancient-gate-water-wind'}
    ],
    hazards:[
      {id:'ancient-49-fire-seal',x:245,y:486,w:75,h:34,type:'fire',visual:'lava',valveId:'ancient-gate-fire'},
      {id:'ancient-49-water-seal',x:650,y:405,w:44,h:90,type:'steam',visual:'steam',valveId:'ancient-gate-water',cycle:{periodMs:6100,activeMs:2400,phaseMs:1700}},
      {id:'ancient-49-water',x:400,y:486,w:65,h:34,type:'water'}
    ],
    iceZones:[{id:'ancient-49-ice-bridge',x:555,y:403,w:125,h:14}],
    currents:[{id:'ancient-49-pulse-current',x:390,y:330,w:300,h:135,forceX:28,forceY:-78,pulsePeriodMs:6800,phaseMs:1200}],
    switches:[{id:'fire',element:'fire',x:185,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:475,y:355},{id:'water',element:'water',x:750,y:355}],
    checkpoint:{x:520,y:482}
  },
  {
    difficulty:5, mechanic:'Penyatuan elemen',
    note:'Ujian terakhir: tutup dua aliran, balikkan dua medan angin, seberangi es, lava dan uap, lalu aktifkan pijakan Nira sebelum Bara. Kalian harus menyelesaikan semuanya sebagai satu tim.',
    features:['finale-all-elements','dual-valves','dual-wind-levers','ordered-switches','ice-and-currents','lava-steam-water','moving-platforms','ultimate-co-op-gate'],
    switchSequence:['water','fire'],
    platforms:[
      {id:'ancient-50-a',x:110,y:455,w:150,kind:'stone'},
      {id:'ancient-50-b',x:270,y:420,w:125,kind:'ice'},
      {id:'ancient-50-c',x:415,y:385,w:125,kind:'crystal'},
      {id:'ancient-50-d',x:555,y:420,w:125,kind:'stone'},
      {id:'ancient-50-e',x:690,y:385,w:125,kind:'ice'},
      {id:'ancient-50-f',x:790,y:455,w:45,kind:'crystal'},
      {id:'ancient-50-moving-a',x:350,y:330,w:86,kind:'crystal',motion:{axis:'x',amplitude:22,periodMs:6200,phaseMs:0}},
      {id:'ancient-50-moving-b',x:590,y:325,w:86,kind:'crystal',motion:{axis:'y',amplitude:14,periodMs:6800,phaseMs:2600}}
    ],
    iceZones:[{id:'ancient-50-ice-a',x:270,y:403,w:125,h:14},{id:'ancient-50-ice-b',x:690,y:368,w:125,h:14}],
    currents:[
      {id:'ancient-50-river-a',x:250,y:300,w:270,h:155,forceX:125,forceY:-42,reversePeriodMs:6900,phaseMs:0},
      {id:'ancient-50-river-b',x:480,y:300,w:280,h:155,forceX:-118,forceY:-48,reversePeriodMs:7300,phaseMs:2100}
    ],
    windZones:[
      {id:'ancient-50-fire-storm',x:270,y:250,w:250,h:190,forceX:140,forceY:-52,reversePeriodMs:7600,phaseMs:0,leverId:'final-ancient-fire-wind'},
      {id:'ancient-50-water-storm',x:500,y:250,w:270,h:190,forceX:-135,forceY:-58,reversePeriodMs:7900,phaseMs:2600,leverId:'final-ancient-water-wind'},
      {id:'ancient-50-heart-updraft',x:430,y:220,w:170,h:190,forceX:0,forceY:-130,pulsePeriodMs:6500,phaseMs:900}
    ],
    hazards:[
      {id:'ancient-50-fire-seal',x:245,y:486,w:80,h:34,type:'fire',visual:'lava',valveId:'final-ancient-fire-valve',cycle:{periodMs:6200,activeMs:4300,phaseMs:0}},
      {id:'ancient-50-water-seal',x:600,y:405,w:44,h:90,type:'steam',visual:'steam',valveId:'final-ancient-water-valve',cycle:{periodMs:6400,activeMs:2500,phaseMs:1800}},
      {id:'ancient-50-rising-lava',x:430,y:468,w:150,h:52,type:'fire',visual:'lava',motion:{axis:'y',amplitude:18,periodMs:8500,phaseMs:1200}},
      {id:'ancient-50-water-pool',x:500,y:486,w:65,h:34,type:'water'},
      {id:'ancient-50-final-steam',x:710,y:405,w:42,h:90,type:'steam',visual:'steam',cycle:{periodMs:6800,activeMs:2200,phaseMs:3900}}
    ],
    valves:[
      {id:'final-ancient-fire-valve',x:332,y:392,element:'fire',label:'Segel Api Purba'},
      {id:'final-ancient-water-valve',x:625,y:392,element:'water',label:'Segel Air Purba'}
    ],
    requiredValves:['final-ancient-fire-valve','final-ancient-water-valve'],
    windLevers:[
      {id:'final-ancient-fire-wind',x:475,y:357,element:'fire',label:'Kristal Bara Purba'},
      {id:'final-ancient-water-wind',x:750,y:357,element:'water',label:'Kristal Air Purba'}
    ],
    requiredWindLevers:['final-ancient-fire-wind','final-ancient-water-wind'],
    switches:[{id:'fire',element:'fire',x:185,y:450,w:54,h:10},{id:'water',element:'water',x:812,y:450,w:54,h:10}],
    gems:[{id:'fire',element:'fire',x:475,y:330},{id:'water',element:'water',x:750,y:330}],
    checkpoint:{x:360,y:482}
  }
];

export function getElementalPlatformState(platform, elapsedMs = 0) {
  const state = { ...platform, active:true, opacity:1 };
  if (platform.motion) {
    const motion = platform.motion;
    const period = Math.max(1000, Number(motion.periodMs) || 6000);
    const phase = ((Number(elapsedMs) || 0) + (Number(motion.phaseMs) || 0)) / period * Math.PI * 2;
    const delta = Math.sin(phase) * Math.max(0, Number(motion.amplitude) || 0);
    if (motion.axis === 'y') state.y += delta; else state.x += delta;
  }
  if (platform.cycle) {
    const cycle = platform.cycle;
    const period = Math.max(1000, Number(cycle.periodMs) || 6000);
    const activeMs = Math.max(0, Math.min(period, Number(cycle.activeMs) || period));
    const phaseMs = ((Number(elapsedMs) || 0) + (Number(cycle.phaseMs) || 0)) % period;
    state.active = phaseMs < activeMs;
    state.opacity = state.active ? (phaseMs > activeMs - 450 ? Math.max(.35, (activeMs-phaseMs)/450) : 1) : 0;
  }
  return state;
}

export function getElementalHazardState(hazard, elapsedMs = 0) {
  const state = { ...hazard, active:true, opacity:1 };
  if (hazard.motion) {
    const motion = hazard.motion;
    const period = Math.max(1000, Number(motion.periodMs) || 6000);
    const phase = ((Number(elapsedMs) || 0) + (Number(motion.phaseMs) || 0)) / period * Math.PI * 2;
    const delta = Math.sin(phase) * Math.max(0, Number(motion.amplitude) || 0);
    if (motion.axis === 'y') state.y += delta; else state.x += delta;
  }
  if (hazard.cycle) {
    const cycle = hazard.cycle;
    const period = Math.max(1000, Number(cycle.periodMs) || 6000);
    const activeMs = Math.max(0, Math.min(period, Number(cycle.activeMs) || period));
    const phaseMs = ((Number(elapsedMs) || 0) + (Number(cycle.phaseMs) || 0)) % period;
    state.active = phaseMs < activeMs;
    state.opacity = state.active ? (phaseMs > activeMs - 450 ? Math.max(.35, (activeMs-phaseMs)/450) : 1) : 0;
  }
  return state;
}


/** Deterministic current force; reverse/pulse timing uses the shared level clock. */
export function getElementalCurrentState(current, elapsedMs = 0) {
  const state = { ...current };
  const elapsed = Math.max(0, Number(elapsedMs) || 0) + (Number(current.phaseMs) || 0);
  if (current.reversePeriodMs) {
    const period = Math.max(1000, Number(current.reversePeriodMs) || 6000);
    state.direction = Math.sin((elapsed / period) * Math.PI * 2);
    state.forceX = (Number(current.forceX) || 0) * state.direction;
    state.forceY = (Number(current.forceY) || 0) * state.direction;
  } else {
    let strength = 1;
    if (current.pulsePeriodMs) {
      const period = Math.max(1000, Number(current.pulsePeriodMs) || 6000);
      strength = .22 + .78 * ((Math.sin((elapsed / period) * Math.PI * 2) + 1) / 2);
    }
    state.forceX = (Number(current.forceX) || 0) * strength;
    state.forceY = (Number(current.forceY) || 0) * strength;
  }
  return state;
}

/** Deterministic wind force. A synchronized lever can permanently reverse its field. */
export function getElementalWindState(windZone, elapsedMs = 0, leverReversed = false) {
  const state = { ...windZone };
  const elapsed = Math.max(0, Number(elapsedMs) || 0) + (Number(windZone.phaseMs) || 0);
  let direction = 1;
  if (windZone.reversePeriodMs) {
    const period = Math.max(1000, Number(windZone.reversePeriodMs) || 6000);
    const phase = ((elapsed % period) + period) % period;
    direction = phase < period / 2 ? 1 : -1;
  }
  if (leverReversed) direction *= -1;
  let strength = 1;
  if (windZone.pulsePeriodMs) {
    const period = Math.max(1000, Number(windZone.pulsePeriodMs) || 6000);
    strength = .24 + .76 * ((Math.sin((elapsed / period) * Math.PI * 2) + 1) / 2);
  }
  state.direction = direction;
  state.forceX = (Number(windZone.forceX) || 0) * direction * strength;
  state.forceY = (Number(windZone.forceY) || 0) * direction * strength;
  state.strength = strength;
  return state;
}

/** Returns true when the player's support surface or feet overlap an ice patch. */
export function isElementalPlayerOnIce(player, level) {
  const support = level.platforms?.find(platform => platform.id === player.supportPlatformId);
  if (support?.kind === 'ice') return true;
  const feet = { x:player.x-14, y:player.y+13, w:28, h:8 };
  return (level.iceZones || []).some(zone => rectsOverlap(feet, zone));
}

/** Higher retention means more sliding after the player releases a direction. */
export function getElementalSurfaceFriction(player, level) {
  if (level.modifier === 'slippery' || isElementalPlayerOnIce(player, level)) return .955;
  return .78;
}

export function getElementalDifficultyLabel(difficulty) {
  const value = Math.max(1, Math.min(5, Number(difficulty) || 1));
  return ['Mudah','Normal','Menengah','Sulit','Expert'][value - 1];
}

function findSafeFloorPoint(preferred, hazards, element = null, min = 70, max = 900, margin = 30) {
  const candidates = Array.from({ length: 84 }, (_, index) => min + index * 10);
  candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
  return candidates.find(x => hazards.every(hazard => {
    if (element && hazard.type === element) return true;
    return x < hazard.x - margin || x > hazard.x + hazard.w + margin;
  })) ?? preferred;
}


const ADVENTURE_ROUTE_XS = [
  [150,350,550,750,950,1150,1300,1000,950,750,550,350,170],
  [150,370,590,810,1030,1250,1320,1210,850,690,440,180,160],
  [150,380,610,840,1070,1300,1240,1020,800,580,360,300,470],
  [170,390,610,830,1050,1270,1200,980,760,540,260,150,420],
  [150,370,590,810,1030,1250,1320,1100,880,660,440,220,160]
];
const ADVENTURE_MAPS = [
  { name:'Jalur Zigzag', y:[790,690,590,490,390,290,190,300,470,560,660,760,650], switches:[2,9], doors:[6,9], gems:[4,10], gate:{orientation:'vertical'}, links:[[1,3,65],[3,5,65],[7,9,28],[9,11,28]] },
  { name:'Menara Kembar', y:[790,690,590,490,390,290,190,350,410,640,600,730,620], switches:[1,10], doors:[5,10], gems:[6,9], gate:{orientation:'vertical'}, links:[[0,2],[2,4],[6,8],[8,10]] },
  { name:'Jalur Berbalik', y:[790,750,650,550,450,350,250,360,470,580,620,810,700], switches:[3,9], doors:[4,0], gems:[5,11], gate:{orientation:'vertical'}, links:[[1,3],[3,5],[7,9],[9,11]] },
  { name:'Persimpangan Awan', y:[790,690,590,490,390,290,190,290,390,490,590,690,590], switches:[1,10], doors:[11,6], gems:[4,8], gate:{orientation:'vertical'}, links:[[0,2],[2,4],[6,8],[8,10]] },
  { name:'Lingkaran Kuno', y:[790,700,610,520,430,340,250,350,450,550,600,680,580], switches:[2,10], doors:[7,10], gems:[5,9], gate:{orientation:'vertical'}, links:[[1,3],[3,5],[7,9],[9,11]] }
];

// Branches are optional routes. Their final positions are nudged away from
// the main platforms and shortcuts so platforms remain visually distinct.
const ADVENTURE_BRANCHES = [
  [{from:1,side:-1,rise:92},{from:3,side:1,rise:96},{from:5,side:-1,rise:100},{from:8,side:1,rise:94},{from:10,side:-1,rise:92}],
  [{from:0,side:1,rise:92},{from:2,side:-1,rise:96},{from:4,side:1,rise:100},{from:7,side:-1,rise:94},{from:10,side:1,rise:92}],
  [{from:1,side:1,rise:94},{from:4,side:-1,rise:98},{from:6,side:1,rise:102},{from:9,side:-1,rise:94},{from:11,side:1,rise:96}],
  [{from:1,side:-1,rise:94},{from:3,side:1,rise:98},{from:6,side:-1,rise:102},{from:8,side:1,rise:96},{from:11,side:-1,rise:94}],
  [{from:0,side:1,rise:92},{from:3,side:-1,rise:98},{from:5,side:1,rise:104},{from:8,side:-1,rise:98},{from:11,side:1,rise:94}]
];

function routePlatform(node, id, kind = 'stone') {
  return { id, x:node.x-64, y:node.y, w:128, h:20, kind };
}

function mapRectAroundNode(source, node, index, kind = 'zone') {
  // Keep environmental overlays compact so they read as wind/current/ice fields,
  // not as extra platform bars that visually compete with the level geometry.
  const width = kind === 'wind' || kind === 'current' ? 142 : 118;
  const height = kind === 'wind' || kind === 'current' ? 78 : 58;
  const x = Math.max(0, Math.min(ELEMENTAL_WORLD_WIDTH-width, node.x-width/2));
  const y = Math.max(70, Math.min(ELEMENTAL_FLOOR_Y-90-height, node.y-height-32));
  return { ...source, id:source.id || `${kind}-${index+1}`, x, y, w:width, h:height };
}

/**
 * Turn each authored stage into a two-dimensional exploration room. The old
 * stage objects still provide the world-specific mechanics; their interactables
 * are re-seated on a connected, multi-tier route with backtracking and varied exits.
 */
function createExplorationMap(level, index) {
  const map = ADVENTURE_MAPS[index % ADVENTURE_MAPS.length];
  const routeX = ADVENTURE_ROUTE_XS[index % ADVENTURE_ROUTE_XS.length];
  const difficulty = Math.max(1, Math.min(5, Number(level.difficulty) || 1));
  const heightScale = [0.84,0.88,0.91,0.94,0.97][difficulty-1];
  // The first route platform sits just above the spawn floor. Each authored
  // 100-unit step becomes an 84–97-unit rise, leaving generous jump margin.
  // Later nodes reach the upper third of the room without extreme vertical gaps.
  const nodes = routeX.map((x, nodeIndex) => ({
    x,
    y:Math.round(820 - (790 - map.y[nodeIndex]) * heightScale)
  }));
  const reserved = new Set([...map.switches, ...map.doors, ...map.gems]);
  const stablePlatforms = nodes.map((node, nodeIndex) => routePlatform(
    node,
    `map-${level.id}-platform-${nodeIndex+1}`,
    nodeIndex % 4 === 1 ? (level.worldIndex === 2 ? 'ice' : 'crystal') : nodeIndex % 4 === 3 ? 'cloud' : 'stone'
  ));

  const specialSources = level.platforms.filter(platform => platform.motion || platform.cycle || platform.kind === 'bounce');
  const sideSpecs = ADVENTURE_BRANCHES[index % ADVENTURE_BRANCHES.length] || [];
  const sidePlatforms = [];
  sideSpecs.forEach((branch, branchIndex) => {
    const node = nodes[branch.from];
    const source = specialSources[branchIndex];
    const width = 100;
    const preferredSide = branch.side || (branchIndex % 2 ? -1 : 1);
    const branchRise = Math.min(58, Math.max(34, branch.rise * (0.34 + (difficulty-1)*0.018)));
    const desiredCenterX = Math.max(width/2+18, Math.min(ELEMENTAL_WORLD_WIDTH-width/2-18, node.x + preferredSide*160));
    const desiredY = Math.max(130, Math.min(ELEMENTAL_FLOOR_Y-110, node.y-branchRise));
    const candidates = [];
    for (const dx of [0,preferredSide*44,-preferredSide*44,preferredSide*88,-preferredSide*88]) {
      for (const dy of [0,-34,34,-58,58,-82,82,-108,108,-132,132]) candidates.push({dx,dy});
    }
    let best = null;
    let bestScore = Infinity;
    for (const offset of candidates) {
      const centerX = Math.max(width/2+18, Math.min(ELEMENTAL_WORLD_WIDTH-width/2-18, desiredCenterX+offset.dx));
      const candidate = {
        x:Math.round(centerX-width/2),
        y:Math.round(Math.max(130,Math.min(ELEMENTAL_FLOOR_Y-110,desiredY+offset.dy))),
        w:width,h:16
      };
      let nearestGap = Infinity;
      for (const other of [...stablePlatforms,...sidePlatforms]) {
        const gapX = Math.max(0,candidate.x-(other.x+other.w),other.x-(candidate.x+candidate.w));
        const gapY = Math.max(0,candidate.y-(other.y+other.h),other.y-(candidate.y+candidate.h));
        nearestGap = Math.min(nearestGap,Math.hypot(gapX,gapY));
      }
      const score = Math.abs(offset.dx)*0.018 + Math.abs(offset.dy)*0.035 + Math.max(0,30-nearestGap)*5000;
      if (score < bestScore) { bestScore=score; best=candidate; }
    }
    const motion = source?.motion ? { ...source.motion, amplitude:Math.min(12,Number(source.motion.amplitude)||0) } : undefined;
    sidePlatforms.push({
      id:`map-${level.id}-side-${branchIndex+1}`,
      ...best,
      kind:source?.kind === 'bounce' ? 'bounce' : branchIndex%2 ? 'crystal' : 'stone',
      branchOf:branch.from,
      routeLabel:`Cabang ${branchIndex+1}`,
      ...(motion ? {motion} : {}),
      ...(source?.cycle ? {cycle:{...source.cycle}} : {})
    });
  });

  const shortcutPlatforms = [];
  (map.links || []).forEach(([from,to,preferredOffset = 28], linkIndex) => {
    const a = nodes[from], b = nodes[to];
    const width = 96;
    const centerX = (a.x+b.x)/2;
    const preferredY = Math.max(-18, Math.min(18, Number(preferredOffset)*0.22));
    const xOffsets = [0,-16,16,-32,32,-48,48];
    const yOffsets = [preferredY,-30,30,-48,48,-68,68,-86,86,-108,108,-132,132];
    const existing = [...stablePlatforms,...sidePlatforms,...shortcutPlatforms];
    let best = null;
    let bestScore = Infinity;
    for (const xOffset of xOffsets) for (const yOffset of yOffsets) {
      const candidate = {
        x:Math.max(8,Math.min(ELEMENTAL_WORLD_WIDTH-width-8,Math.round(centerX-width/2+xOffset))),
        y:Math.max(130,Math.min(ELEMENTAL_FLOOR_Y-110,Math.round((a.y+b.y)/2+yOffset))),
        w:width,h:14
      };
      let score = Math.abs(xOffset)*0.10 + Math.abs(yOffset-preferredY)*0.24;
      for (const other of existing) {
        const gapX = Math.max(0,candidate.x-(other.x+other.w),other.x-(candidate.x+candidate.w));
        const gapY = Math.max(0,candidate.y-(other.y+other.h),other.y-(candidate.y+candidate.h));
        const separation = Math.hypot(gapX,gapY);
        if (separation < 26) score += (26-separation)*2800;
      }
      if (score < bestScore) { bestScore=score; best=candidate; }
    }
    shortcutPlatforms.push({
      id:`map-${level.id}-shortcut-${linkIndex+1}`,
      ...best,
      kind:linkIndex%2 ? 'cloud' : 'crystal',
      connects:[from,to],
      routeLabel:`Pintas ${linkIndex+1}`
    });
  });

  // Nudge each optional bridge vertically to keep a visible gap from every
  // neighboring ledge. The search is bounded so a shortcut stays within a
  // reasonable jump of its connected route while no longer appearing fused.
  for (const shortcut of shortcutPlatforms) {
    const others = [...stablePlatforms,...sidePlatforms,...shortcutPlatforms.filter(item => item !== shortcut)];
    let bestY = shortcut.y;
    let bestScore = -Infinity;
    for (let y = Math.max(130,shortcut.y-100); y <= Math.min(ELEMENTAL_FLOOR_Y-110,shortcut.y+100); y += 2) {
      let nearestGap = Infinity;
      for (const other of others) {
        const gapX = Math.max(0,shortcut.x-(other.x+other.w),other.x-(shortcut.x+shortcut.w));
        const gapY = Math.max(0,y-(other.y+other.h),other.y-(y+shortcut.h));
        nearestGap = Math.min(nearestGap,Math.hypot(gapX,gapY));
      }
      const score = nearestGap*1000 - Math.abs(y-shortcut.y)*0.55;
      if (score > bestScore) { bestScore=score; bestY=y; }
    }
    shortcut.y = bestY;
  }

  level.platforms = [...stablePlatforms,...sidePlatforms,...shortcutPlatforms];
  level.floorY = ELEMENTAL_FLOOR_Y;
  level.floorSegments = [
    { id:'floor-west', x:0, y:ELEMENTAL_FLOOR_Y, w:230, h:60 },
    { id:'floor-west-mid', x:395, y:ELEMENTAL_FLOOR_Y, w:210, h:60 },
    { id:'floor-east-mid', x:835, y:ELEMENTAL_FLOOR_Y, w:210, h:60 },
    { id:'floor-east', x:1210, y:ELEMENTAL_FLOOR_Y, w:230, h:60 }
  ];
  level.spawn = { host:{x:65,y:ELEMENTAL_FLOOR_Y-17}, guest:{x:112,y:ELEMENTAL_FLOOR_Y-17} };

  const switchElements = ['fire','water'];
  level.switches = switchElements.map((element, elementIndex) => {
    const node = nodes[map.switches[elementIndex]];
    return { id:element, element, x:node.x, y:node.y-7, w:54, h:10 };
  });
  level.gems = switchElements.map((element, elementIndex) => {
    const node = nodes[map.gems[elementIndex]];
    const branch = sidePlatforms[(elementIndex===0?1:3)%sidePlatforms.length];
    const useBranch = Boolean(branch) && (level.id+elementIndex)%3===0;
    return useBranch
      ? { id:element, element, x:branch.x+branch.w/2, y:branch.y-25, platformId:branch.id }
      : { id:element, element, x:node.x, y:node.y-30, platformId:`map-${level.id}-platform-${map.gems[elementIndex]+1}` };
  });

  const controlSlots = [0,3,6,8,10,12,5,7,9,11,1,2].filter(slot =>
    !map.switches.includes(slot) && !map.doors.includes(slot) && !map.gems.includes(slot)
  );
  const placeControl = (source, controlIndex) => {
    const slot = controlSlots[controlIndex % Math.max(1,controlSlots.length)];
    const node = nodes[slot];
    return { ...source, x:node.x, y:node.y-27, radius:source.radius || 58, platformId:`map-${level.id}-platform-${slot+1}` };
  };
  level.valves = (level.valves || []).map((item,i) => placeControl(item,i));
  level.windLevers = (level.windLevers || []).map((item,i) => placeControl(item,i+level.valves.length));

  const zoneSlots = [2,5,8,11,4,9];
  level.iceZones = (level.iceZones || []).map((zone,i) => mapRectAroundNode(zone,nodes[zoneSlots[i%zoneSlots.length]],i,'ice'));
  level.currents = (level.currents || []).map((zone,i) => mapRectAroundNode(zone,nodes[zoneSlots[(i+1)%zoneSlots.length]],i,'current'));
  level.windZones = (level.windZones || []).map((zone,i) => mapRectAroundNode(zone,nodes[zoneSlots[(i+2)%zoneSlots.length]],i,'wind'));

  const reservedNodes = new Set([...map.switches,...map.doors,...map.gems]);
  const preferredHazardSlots = [0,2,4,6,8,10,11];
  const safeHazardSlots = preferredHazardSlots.filter(slot => !reservedNodes.has(slot) && !reservedNodes.has(slot+1));
  const hazardSlots = safeHazardSlots.length ? safeHazardSlots : preferredHazardSlots;
  level.hazards = level.hazards.map((source,i) => {
    const slot = hazardSlots[i % hazardSlots.length];
    const a = nodes[slot], b = nodes[slot+1];
    const centerX = (a.x+b.x)/2;
    const steam = source.type === 'steam';
    return {
      ...source,
      x:centerX-(steam?18:30),
      y:Math.min(a.y,b.y)+(steam?28:42),
      w:steam?36:60,
      h:steam?52:20,
      ...(source.motion ? {motion:{...source.motion,amplitude:Math.min(10,Number(source.motion.amplitude)||0)}} : {})
    };
  });

  const checkpointNode = nodes[8];
  level.checkpoint = { x:checkpointNode.x, y:checkpointNode.y-23, radius:48 };
  const makeDoor = (nodeIndex, element) => {
    const node = nodes[nodeIndex];
    return { x:node.x-21, y:node.y-76, w:42, h:72, element, platformId:`map-${level.id}-platform-${nodeIndex+1}` };
  };
  level.doors = {
    fire:makeDoor(map.doors[0],'fire'),
    water:makeDoor(map.doors[1],'water')
  };
  level.exit = { x:Math.min(level.doors.fire.x,level.doors.water.x), y:Math.min(level.doors.fire.y,level.doors.water.y), w:Math.abs(level.doors.fire.x-level.doors.water.x)+42, h:72 };

  const gateNodeA = nodes[5], gateNodeB = nodes[6];
  const gateX = (gateNodeA.x+gateNodeB.x)/2;
  const gateY = Math.max(165,Math.min(gateNodeA.y,gateNodeB.y)-38);
  level.gate = { x:gateX-9, y:gateY, w:18, h:178, orientation:'vertical', id:`map-${level.id}-seal` };
  level.mapVersion = ELEMENTAL_MAP_VERSION;
  level.mapName = map.name;
  level.mapTopology = { route:'multi-branch-loop', sideRoutes:sidePlatforms.length, shortcuts:shortcutPlatforms.length, platformSpacing:'collision-checked-grid' };
  level.worldWidth = ELEMENTAL_WORLD_WIDTH;
  level.worldHeight = ELEMENTAL_WORLD_HEIGHT;
  return level;
}

function makeLevel(index) {
  const worldIndex = Math.floor(index / 10);
  const localIndex = index % 10;
  const world = WORLD_CONFIG[worldIndex];
  const blueprint = worldIndex === 0 ? WORLD_ONE_BLUEPRINTS[localIndex] : worldIndex === 1 ? WORLD_TWO_BLUEPRINTS[localIndex] : worldIndex === 2 ? WORLD_THREE_BLUEPRINTS[localIndex] : worldIndex === 3 ? WORLD_FOUR_BLUEPRINTS[localIndex] : worldIndex === 4 ? WORLD_FIVE_BLUEPRINTS[localIndex] : null;
  const platforms = blueprint
    ? blueprint.platforms.map((platform, platformIndex) => ({ id:platform.id || `p${platformIndex+1}`, h:16, kind:'stone', ...platform }))
    : PLATFORM_LAYOUTS[localIndex].map(([x,y,w], i) => ({
        id: `p${i + 1}`, x, y, w, h: 16,
        kind: (i + localIndex + worldIndex) % 3 === 0 ? 'crystal' : 'stone'
      }));
  const hazardCount = Math.min(4, 1 + Math.floor(localIndex / 3) + (worldIndex > 1 ? 1 : 0));
  const hazards = blueprint
    ? blueprint.hazards.map((hazard, hazardIndex) => ({ id:hazard.id || `h${hazardIndex+1}`, y:493, h:35, ...hazard }))
    : HAZARD_LAYOUTS[localIndex].slice(0, hazardCount).map(([x,w], i) => ({
        id: `h${i + 1}`, x, y: 493, w, h: 35,
        type: (i + localIndex + worldIndex) % 2 === 0 ? 'water' : 'fire'
      }));
  const switchShift = (localIndex % 3) * 18;
  const fireSwitchX = findSafeFloorPoint(255 + switchShift, hazards, null);
  let waterSwitchX = findSafeFloorPoint(690 - switchShift, hazards, null);
  if (Math.abs(waterSwitchX - fireSwitchX) < 300) {
    waterSwitchX = findSafeFloorPoint(fireSwitchX < 480 ? 820 : 140, hazards, null);
  }
  const switches = blueprint?.switches
    ? blueprint.switches.map(item => ({ w:52, h:10, ...item }))
    : [
        { id:'fire', element:'fire', x: fireSwitchX, y: 510, w:52, h:10 },
        { id:'water', element:'water', x: waterSwitchX, y: 510, w:52, h:10 }
      ];
  const firePlatform = PLATFORM_LAYOUTS[localIndex][Math.min(1, PLATFORM_LAYOUTS[localIndex].length - 1)];
  const waterPlatform = PLATFORM_LAYOUTS[localIndex][Math.max(0, PLATFORM_LAYOUTS[localIndex].length - 2)];
  const gems = blueprint?.gems
    ? blueprint.gems.map(item => ({ ...item }))
    : [
        { id:'fire', element:'fire', x: firePlatform[0] + firePlatform[2] * .52, y: firePlatform[1] - 30 },
        { id:'water', element:'water', x: waterPlatform[0] + waterPlatform[2] * .48, y: waterPlatform[1] - 30 }
      ];
  const checkpointX = findSafeFloorPoint(480, hazards, null, 340, 620, 22);
  const modifier = blueprint?.modifier || world.modifier;
  const note = blueprint?.note || (localIndex === 9
    ? `Penutup dunia ${world.name}. Gabungkan seluruh kemampuan.`
    : CHALLENGE_NOTES[(localIndex + worldIndex) % CHALLENGE_NOTES.length]);
  const difficulty = WORLD_DIFFICULTY_CURVE[worldIndex][localIndex];
  const level = {
    id: index + 1,
    worldId: world.id,
    worldIndex: worldIndex + 1,
    worldName: world.name,
    worldShortName: world.shortName,
    name: world.names[localIndex],
    tagline: world.tagline,
    mechanic: blueprint?.mechanic || world.mechanic,
    modifier,
    note,
    difficulty,
    difficultyLabel: getElementalDifficultyLabel(difficulty),
    features: blueprint?.features || [],
    iceZones: blueprint?.iceZones || [],
    currents: blueprint?.currents || [],
    windZones: blueprint?.windZones || [],
    windLevers: blueprint?.windLevers || [],
    requiredWindLevers: blueprint?.requiredWindLevers || [],
    valves: blueprint?.valves || [],
    requiredValves: blueprint?.requiredValves || [],
    switchSequence: blueprint?.switchSequence || null,
    colors: world.colors,
    platforms,
    hazards,
    switches,
    gems,
    checkpoint: blueprint?.checkpoint || { x: checkpointX, y: 482 },
    spawn: { host: { x: 58, y: 468 }, guest: { x: 112, y: 468 } },
    gate: { x: 838, y: 360, w: 20, h: 160 },
    doors: {
      fire: { x: 870, y: 418, w: 36, h: 102, element:'fire' },
      water: { x: 916, y: 418, w: 36, h: 102, element:'water' }
    },
    exit: { x: 870, y: 418, w: 82, h: 102 }
  };
  return createExplorationMap(level, index);
}

export const ELEMENTAL_LEVELS = Object.freeze(Array.from({ length: 50 }, (_, index) => Object.freeze(makeLevel(index))));
export const ELEMENTAL_WORLDS = Object.freeze(WORLD_CONFIG.map((world, index) => Object.freeze({
  id: world.id, name: world.name, shortName: world.shortName, firstLevel: index * 10 + 1, lastLevel: index * 10 + 10, tagline: world.tagline
})));

export function getElementalLevel(levelNumber) {
  const index = Math.max(1, Math.min(50, Number(levelNumber) || 1)) - 1;
  return ELEMENTAL_LEVELS[index];
}

export function createElementalPlayer(role, saved = null, levelNumber = 1) {
  const level = getElementalLevel(levelNumber);
  const spawn = level.spawn[role === 'guest' ? 'guest' : 'host'];
  // Older builds used a short corridor or the previous single-route map. Respawn
  // those stale positions into the current branched map, while retaining progress.
  const compatibleMap = Number(saved?.mapVersion) === ELEMENTAL_MAP_VERSION;
  return {
    x: compatibleMap && Number.isFinite(saved?.x) ? saved.x : spawn.x,
    y: compatibleMap && Number.isFinite(saved?.y) ? saved.y : spawn.y,
    vx: 0, vy: 0, dir: role === 'guest' ? -1 : 1,
    grounded: false,
    ready: Boolean(saved?.ready),
    complete: compatibleMap && Boolean(saved?.complete),
    deaths: Math.max(0, Number(saved?.deaths) || 0),
    levelDeaths: Math.max(0, Number(saved?.levelDeaths) || 0),
    shards: Math.max(0, Number(saved?.shards) || 0),
    updatedAt: Number(saved?.updatedAt) || Date.now(),
    supportPlatformId: compatibleMap ? (saved?.supportPlatformId || null) : null,
    mapVersion:ELEMENTAL_MAP_VERSION
  };
}

export function clampElementalPlayer(player, width = ELEMENTAL_WORLD_WIDTH, height = ELEMENTAL_WORLD_HEIGHT) {
  return { ...player, x: Math.max(18, Math.min(width - 18, player.x)), y: Math.min(height - 18, Math.max(-50, player.y)) };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function getElementalStars({ deaths = 0, shards = 0 } = {}) {
  if (Number(shards) >= 2 && Number(deaths) === 0) return 3;
  if (Number(deaths) <= 2) return 2;
  return 1;
}
