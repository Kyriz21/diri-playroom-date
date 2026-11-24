export const ELEMENTAL_WORLD_WIDTH = 960;
export const ELEMENTAL_WORLD_HEIGHT = 560;
export const ELEMENTAL_PLAYER_RADIUS = 15;
export const ELEMENTAL_GRAVITY = 1480;
export const ELEMENTAL_MOVE_SPEED = 250;
export const ELEMENTAL_JUMP_SPEED = 590;

const WORLD_CONFIG = [
  {
    id: 'whispering-grove', name: 'Hutan Berbisik', shortName: 'Hutan',
    names: ['Jejak Cahaya','Batu Bertunas','Akar Berliku','Jembatan Pucuk','Dua Lentera','Lompatan Lumut','Gerbang Embun','Akar Berayun','Ruang Kunang-kunang','Jantung Hutan'],
    tagline: 'Ikuti cahaya kecil di antara akar yang hidup.',
    mechanic: 'Tanaman lentur', modifier: 'bouncy',
    colors: { sky:'#d8f0de', sky2:'#a9d9c0', far:'#81b79b', near:'#4d8d75', ground:'#426c5b', accent:'#f6d98b', glow:'#ffe5a4' }
  },
  {
    id: 'crystal-depths', name: 'Kedalaman Kristal', shortName: 'Kristal',
    names: ['Retakan Pertama','Gema Biru','Lorong Pecahan','Cermin Es','Jembatan Prismatik','Arus Terbalik','Menara Kristal','Ruang Resonansi','Badai Serpihan','Penjaga Geode'],
    tagline: 'Pantulkan cahaya dan temukan jalan di gua kristal.',
    mechanic: 'Lantai licin', modifier: 'slippery',
    colors: { sky:'#d9eff4', sky2:'#a8d7e3', far:'#7bb6c6', near:'#4b849f', ground:'#35596f', accent:'#f0e6ff', glow:'#c6fbff' }
  },
  {
    id: 'ember-kingdom', name: 'Kerajaan Bara', shortName: 'Bara',
    names: ['Jejak Arang','Tungku Kecil','Sungai Magma','Pabrik Bara','Roda Panas','Ruang Pendingin','Taman Obsidian','Pilar Membara','Inti Vulkanik','Raja Tungku'],
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

function findSafeFloorPoint(preferred, hazards, element = null, min = 70, max = 900, margin = 30) {
  const candidates = Array.from({ length: 84 }, (_, index) => min + index * 10);
  candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
  return candidates.find(x => hazards.every(hazard => {
    if (element && hazard.type === element) return true;
    return x < hazard.x - margin || x > hazard.x + hazard.w + margin;
  })) ?? preferred;
}

function makeLevel(index) {
  const worldIndex = Math.floor(index / 10);
  const localIndex = index % 10;
  const world = WORLD_CONFIG[worldIndex];
  const platforms = PLATFORM_LAYOUTS[localIndex].map(([x,y,w], i) => ({
    id: `p${i + 1}`, x, y, w, h: 16,
    kind: (i + localIndex + worldIndex) % 3 === 0 ? 'crystal' : 'stone'
  }));
  const hazardCount = Math.min(4, 1 + Math.floor(localIndex / 3) + (worldIndex > 1 ? 1 : 0));
  const hazards = HAZARD_LAYOUTS[localIndex].slice(0, hazardCount).map(([x,w], i) => ({
    id: `h${i + 1}`, x, y: 493, w, h: 35,
    type: (i + localIndex + worldIndex) % 2 === 0 ? 'water' : 'fire'
  }));
  const switchShift = (localIndex % 3) * 18;
  const fireSwitchX = findSafeFloorPoint(255 + switchShift, hazards, 'fire');
  let waterSwitchX = findSafeFloorPoint(690 - switchShift, hazards, 'water');
  if (Math.abs(waterSwitchX - fireSwitchX) < 300) {
    waterSwitchX = findSafeFloorPoint(fireSwitchX < 480 ? 820 : 140, hazards, 'water');
  }
  const switches = [
    { id:'fire', element:'fire', x: fireSwitchX, y: 474 },
    { id:'water', element:'water', x: waterSwitchX, y: 474 }
  ];
  const firePlatform = PLATFORM_LAYOUTS[localIndex][Math.min(1, PLATFORM_LAYOUTS[localIndex].length - 1)];
  const waterPlatform = PLATFORM_LAYOUTS[localIndex][Math.max(0, PLATFORM_LAYOUTS[localIndex].length - 2)];
  const gems = [
    { id:'fire', element:'fire', x: firePlatform[0] + firePlatform[2] * .52, y: firePlatform[1] - 30 },
    { id:'water', element:'water', x: waterPlatform[0] + waterPlatform[2] * .48, y: waterPlatform[1] - 30 }
  ];
  const checkpointX = findSafeFloorPoint(480, hazards, null, 340, 620, 22);
  const modifier = world.modifier;
  const note = localIndex === 9
    ? `Penutup dunia ${world.name}. Gabungkan seluruh kemampuan.`
    : CHALLENGE_NOTES[(localIndex + worldIndex) % CHALLENGE_NOTES.length];
  return {
    id: index + 1,
    worldId: world.id,
    worldIndex: worldIndex + 1,
    worldName: world.name,
    worldShortName: world.shortName,
    name: world.names[localIndex],
    tagline: world.tagline,
    mechanic: world.mechanic,
    modifier,
    note,
    difficulty: Math.min(5, 1 + worldIndex + Math.floor(localIndex / 4)),
    colors: world.colors,
    platforms,
    hazards,
    switches,
    gems,
    checkpoint: { x: checkpointX, y: 482 },
    spawn: { host: { x: 58, y: 468 }, guest: { x: 112, y: 468 } },
    exit: { x: 900, y: 440, w: 42, h: 82 }
  };
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
  return {
    x: Number.isFinite(saved?.x) ? saved.x : spawn.x,
    y: Number.isFinite(saved?.y) ? saved.y : spawn.y,
    vx: 0, vy: 0, dir: role === 'guest' ? -1 : 1,
    grounded: false,
    ready: Boolean(saved?.ready),
    complete: Boolean(saved?.complete),
    deaths: Math.max(0, Number(saved?.deaths) || 0),
    levelDeaths: Math.max(0, Number(saved?.levelDeaths) || 0),
    shards: Math.max(0, Number(saved?.shards) || 0),
    updatedAt: Number(saved?.updatedAt) || Date.now()
  };
}

export function clampElementalPlayer(player, width = ELEMENTAL_WORLD_WIDTH) {
  return { ...player, x: Math.max(18, Math.min(width - 18, player.x)), y: Math.min(520, Math.max(-50, player.y)) };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function getElementalStars({ deaths = 0, shards = 0 } = {}) {
  if (Number(shards) >= 2 && Number(deaths) === 0) return 3;
  if (Number(deaths) <= 2) return 2;
  return 1;
}
