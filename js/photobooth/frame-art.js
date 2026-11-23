/* Original, locally rendered DiRi photobooth frame artwork. No third-party frame assets. */
export const FRAMES = [
  ['newspaper','Edisi Koran','#eee9d9','#201f1c','newspaper','#8b1e25'],
  ['wanted','Poster Buronan','#ddc79f','#4a2d1c','wanted','#a33e2f'],
  ['comic','Komik Pop Art','#ffe85b','#171717','comic','#e53935'],
  ['cinema','Malam Sinema','#171923','#f7e5b8','cinema','#d94b55'],
  ['korean','Korean Four-Cut','#fff7f7','#735968','korean','#e8a8c4'],
  ['film','Film Analog 1990-an','#29251f','#f4e5c5','film','#d6a44d'],
  ['polaroid','Polaroid Kenangan','#f5f0e8','#4b4540','polaroid','#d8cfc1'],
  ['postcard','Kartu Pos','#f7efe0','#315c72','postcard','#c44a42'],
  ['botanical','Taman Botani','#edf0e4','#405c46','botanical','#bb8b9d'],
  ['kawaii','Dunia Kawaii','#fff0f4','#79576d','kawaii','#f4b7c8'],
  ['magazine','Sampul Majalah','#f5eee8','#221e29','magazine','#d54b74'],
  ['y2k','Kilau Y2K','#e7e2ff','#34305e','y2k','#8b78e6'],
  ['arcade','Arked 8-Bit','#17152b','#f7f3ff','arcade','#39e6d2'],
  ['loveletter','Surat Cinta','#f9e8e9','#7e4856','loveletter','#bf7187'],
  ['birthday','Pesta Ulang Tahun','#fff0dc','#7c4b73','birthday','#ef8c45'],
  ['doodle','Buku Doodle','#fff9e9','#4c5261','doodle','#78a9a0']
];

export function clampPosition(value, min = 0.04, max = 0.96) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0.5));
}

export function frameById(id) {
  return FRAMES.find(frame => frame[0] === id) || FRAMES[0];
}

function line(ctx, x1, y1, x2, y2, color, width = 3, dash = []) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function label(ctx, value, x, y, size, color, font = 'Georgia', align = 'center', weight = 'normal') {
  ctx.save(); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillText(value, x, y); ctx.restore();
}
function star(ctx, x, y, outer, color, points = 5, inner = outer * 0.45) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 ? inner : outer; const angle = -Math.PI / 2 + i * Math.PI / points;
    const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function heart(ctx, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 32, size / 32); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 28); ctx.bezierCurveTo(-36, 5, -22, -18, -4, -8); ctx.bezierCurveTo(2, -4, 5, -4, 10, -9); ctx.bezierCurveTo(28, -21, 42, 4, 0, 28); ctx.fill(); ctx.restore();
}
function circle(ctx, x, y, radius, fill, stroke = null, width = 2) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } ctx.restore();
}
function rounded(ctx, x, y, w, h, radius, fill, stroke = null, width = 2) {
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } ctx.restore();
}
function drawFilmPerforations(ctx, width, height, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let y = 30; y < height - 20; y += 62) {
    rounded(ctx, 18, y, 26, 38, 6, color);
    rounded(ctx, width - 44, y, 26, 38, 6, color);
  }
  ctx.restore();
}
function drawPaperNoise(ctx, width, height, color = '#745d43') {
  ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = color;
  for (let i = 0; i < 170; i++) {
    const x = (i * 127.7) % width, y = (i * 83.3) % height;
    ctx.fillRect(x, y, 2 + (i % 3), 1 + (i % 2));
  }
  ctx.restore();
}

export function drawFrameBackground(ctx, frame, width, height, couple = false) {
  const [id, name, bg, ink, theme, accent] = frame;
  ctx.save(); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  const edge = Math.round(width * 0.045);
  switch (theme) {
    case 'newspaper': {
      drawPaperNoise(ctx, width, height, ink);
      ctx.strokeStyle = ink; ctx.lineWidth = 8; ctx.strokeRect(edge, edge, width - edge * 2, height - edge * 2);
      ctx.lineWidth = 2; ctx.strokeRect(edge + 14, edge + 14, width - (edge + 14) * 2, height - (edge + 14) * 2);
      label(ctx, 'KABAR KITA', width / 2, 92, width * 0.085, ink, 'Georgia', 'center', 'bold');
      line(ctx, edge + 28, 148, width - edge - 28, 148, ink, 5);
      label(ctx, 'EDISI KHUSUS  •  KISAH DUA HATI', width / 2, 180, width * 0.025, ink, 'Georgia', 'center', 'bold');
      line(ctx, edge + 28, 207, width - edge - 28, 207, ink, 2);
      label(ctx, 'KABAR BAIK: KITA BERTEMU DI SINI', width / 2, height - 92, width * 0.031, accent, 'Georgia', 'center', 'bold');
      label(ctx, 'BERITA UTAMA SEPANJANG MASA', width / 2, height - 48, width * 0.019, ink);
      break;
    }
    case 'wanted': {
      drawPaperNoise(ctx, width, height, '#76502f');
      ctx.strokeStyle = '#71492e'; ctx.lineWidth = 18; ctx.strokeRect(24, 24, width - 48, height - 48);
      ctx.strokeStyle = '#9c7046'; ctx.lineWidth = 4; ctx.strokeRect(48, 48, width - 96, height - 96);
      label(ctx, 'DICARI', width / 2, 88, width * 0.095, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'HILANG KARENA MENCURI HATI', width / 2, 152, width * 0.028, ink, 'Georgia', 'center', 'bold');
      star(ctx, width * .16, 90, 20, accent); star(ctx, width * .84, 90, 20, accent);
      label(ctx, 'HADIAH:', width / 2, height - 116, width * 0.035, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'SATU PELUKAN TANPA BATAS', width / 2, height - 67, width * 0.04, accent, 'Georgia', 'center', 'bold');
      break;
    }
    case 'comic': {
      ctx.fillStyle = '#fff4bf'; ctx.fillRect(20, 20, width - 40, height - 40);
      for (let r = 0; r < 14; r++) for (let c = 0; c < 8; c++) circle(ctx, 30 + c * (width / 8), 30 + r * (height / 14), 4, '#e8bf33');
      rounded(ctx, width * .18, 38, width * .64, 112, 18, accent, '#171717', 9);
      label(ctx, 'KISAH KITA!', width / 2, 94, width * .064, '#fff', 'Impact, sans-serif', 'center', 'bold');
      label(ctx, 'DUA TOKOH  •  SATU CERITA  •  BANYAK TAWA', width / 2, height - 70, width * .025, ink, 'Arial', 'center', 'bold');
      star(ctx, width * .12, height - 95, 30, '#f6b51b'); star(ctx, width * .88, height - 95, 30, '#38a9d6');
      break;
    }
    case 'cinema': {
      ctx.fillStyle = '#282938'; ctx.fillRect(18, 18, width - 36, height - 36);
      line(ctx, 54, 24, width - 54, 24, '#e2bd70', 5); line(ctx, 54, height - 24, width - 54, height - 24, '#e2bd70', 5);
      for (let x = 76; x < width - 60; x += 72) { circle(ctx, x, 24, 8, bg); circle(ctx, x, height - 24, 8, bg); }
      label(ctx, 'OUR MOVIE NIGHT', width / 2, 90, width * .065, '#f6e6c4', 'Georgia', 'center', 'bold');
      label(ctx, 'STARRING: KAMU & AKU', width / 2, 148, width * .027, '#e7ba68', 'Arial', 'center', 'bold');
      label(ctx, 'FILM FAVORIT KITA  •  TAKE 01', width / 2, height - 72, width * .025, '#f6e6c4', 'Georgia', 'center', 'bold');
      break;
    }
    case 'korean': {
      ctx.strokeStyle = '#e5b3c9'; ctx.lineWidth = 12; ctx.strokeRect(24, 24, width - 48, height - 48);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(44, 44, width - 88, height - 88);
      label(ctx, 'FOUR CUTS', width / 2, 83, width * .065, ink, 'Arial', 'center', 'bold');
      label(ctx, '오늘도, 우리 둘  ♡', width / 2, height - 72, width * .034, '#b96e91', 'Georgia', 'center', 'bold');
      heart(ctx, width * .14, 82, 27, accent); heart(ctx, width * .86, 82, 27, accent);
      break;
    }
    case 'film': {
      ctx.fillStyle = '#3b3025'; ctx.fillRect(20, 20, width - 40, height - 40);
      drawFilmPerforations(ctx, width, height, '#e8d7b4', 1);
      label(ctx, 'Diri. · ANALOG MOMENTS', width / 2, 88, width * .043, '#f4e5c5', 'Courier New', 'center', 'bold');
      label(ctx, '36 EXP  •  ISO 400  •  NO FILTER NEEDED', width / 2, height - 70, width * .022, '#f4e5c5', 'Courier New', 'center', 'bold');
      break;
    }
    case 'polaroid': {
      ctx.fillStyle = '#e8e0d4'; ctx.fillRect(18, 18, width - 36, height - 36);
      label(ctx, 'little moments', width / 2, 76, width * .055, ink, 'Brush Script MT, cursive');
      label(ctx, 'yang ingin diulang lagi', width / 2, height - 70, width * .03, '#766b64', 'Georgia');
      heart(ctx, width * .13, 76, 24, accent); heart(ctx, width * .87, 76, 24, accent);
      break;
    }
    case 'postcard': {
      ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.setLineDash([18, 12]); ctx.strokeRect(26, 26, width - 52, height - 52); ctx.setLineDash([]);
      label(ctx, 'SALAM DARI KITA', width / 2, 86, width * .06, ink, 'Georgia', 'center', 'bold');
      rounded(ctx, width - 165, 36, 112, 92, 8, '#fff8e9', accent, 4);
      label(ctx, 'Diri.', width - 109, 72, 30, accent, 'Georgia', 'center', 'bold');
      label(ctx, 'WISH YOU WERE HERE', width / 2, height - 74, width * .03, ink, 'Georgia', 'center', 'bold');
      break;
    }
    case 'botanical': {
      ctx.strokeStyle = '#a9b99e'; ctx.lineWidth = 9; ctx.strokeRect(25, 25, width - 50, height - 50);
      label(ctx, 'BLOOMING TOGETHER', width / 2, 82, width * .045, ink, 'Georgia', 'center', 'bold');
      for (let i = 0; i < 8; i++) {
        const x = 65 + i * ((width - 130) / 7); const y = i % 2 ? height - 70 : 130;
        circle(ctx, x, y, 8, accent); circle(ctx, x - 9, y, 6, '#e9c9a1'); circle(ctx, x + 9, y, 6, '#e9c9a1');
      }
      label(ctx, 'tumbuh bersama, pelan-pelan', width / 2, height - 64, width * .027, ink, 'Georgia');
      break;
    }
    case 'kawaii': {
      rounded(ctx, 18, 18, width - 36, height - 36, 34, '#fff8fa', '#f0b7ca', 12);
      label(ctx, 'CUTE LITTLE US', width / 2, 86, width * .057, ink, 'Arial', 'center', 'bold');
      // Original bear-face doodles, not characters from an existing franchise.
      for (const x of [width * .16, width * .84]) {
        circle(ctx, x, 84, 24, '#d6b69e'); circle(ctx, x - 16, 66, 10, '#d6b69e'); circle(ctx, x + 16, 66, 10, '#d6b69e');
        circle(ctx, x - 7, 84, 3, '#493d42'); circle(ctx, x + 7, 84, 3, '#493d42');
      }
      label(ctx, '♡  peluk jauh, dekat di hati  ♡', width / 2, height - 68, width * .028, accent, 'Georgia');
      break;
    }
    case 'magazine': {
      ctx.fillStyle = '#fffaf6'; ctx.fillRect(20, 20, width - 40, height - 40);
      label(ctx, 'TOGETHER', width / 2, 88, width * .105, ink, 'Arial', 'center', '900');
      line(ctx, 54, 140, width - 54, 140, accent, 6);
      label(ctx, 'THE COUPLE ISSUE  •  NO. 01', width / 2, 169, width * .025, accent, 'Arial', 'center', 'bold');
      label(ctx, 'COVER STORY: OUR FAVORITE PERSON', width / 2, height - 70, width * .025, ink, 'Arial', 'center', 'bold');
      star(ctx, width * .13, 190, 20, accent); star(ctx, width * .87, 190, 20, accent);
      break;
    }
    case 'y2k': {
      const gradient = ctx.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, '#ebe3ff'); gradient.addColorStop(.5, '#f5dff2'); gradient.addColorStop(1, '#d8edff');
      ctx.fillStyle = gradient; ctx.fillRect(18, 18, width - 36, height - 36);
      ctx.strokeStyle = '#8c7de1'; ctx.lineWidth = 8; ctx.strokeRect(30, 30, width - 60, height - 60);
      label(ctx, '★ US 4EVER ★', width / 2, 82, width * .07, '#514b8c', 'Arial', 'center', 'bold');
      for (let i = 0; i < 12; i++) star(ctx, 55 + (i * 113) % (width - 110), 190 + (i * 181) % (height - 380), 14, i % 2 ? '#c47fc5' : '#7e9de3');
      label(ctx, 'DIGITAL LOVE · 2000s ENERGY', width / 2, height - 70, width * .024, '#514b8c', 'Arial', 'center', 'bold');
      break;
    }
    case 'arcade': {
      ctx.fillStyle = '#17152b'; ctx.fillRect(18, 18, width - 36, height - 36);
      ctx.strokeStyle = accent; ctx.lineWidth = 10; ctx.setLineDash([16, 12]); ctx.strokeRect(36, 36, width - 72, height - 72); ctx.setLineDash([]);
      label(ctx, 'PLAYER 1  +  PLAYER 2', width / 2, 82, width * .047, '#fff', 'Courier New', 'center', 'bold');
      label(ctx, 'LOVE LEVEL: MAX', width / 2, height - 68, width * .04, accent, 'Courier New', 'center', 'bold');
      break;
    }
    case 'loveletter': {
      ctx.fillStyle = '#fff3f0'; ctx.fillRect(18, 18, width - 36, height - 36);
      ctx.strokeStyle = '#c98596'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.strokeRect(42, 42, width - 84, height - 84); ctx.setLineDash([]);
      label(ctx, 'Untuk orang favoritku,', width / 2, 82, width * .045, ink, 'Brush Script MT, cursive');
      heart(ctx, width * .13, 84, 25, accent); heart(ctx, width * .87, 84, 25, accent);
      label(ctx, 'dengan sayang, aku ♡', width / 2, height - 70, width * .04, accent, 'Brush Script MT, cursive');
      break;
    }
    case 'birthday': {
      ctx.fillStyle = '#fff8ed'; ctx.fillRect(18, 18, width - 36, height - 36);
      for (let i = 0; i < 34; i++) {
        const x = 35 + (i * 79) % (width - 70), y = 35 + (i * 137) % (height - 70);
        circle(ctx, x, y, 5 + (i % 4), ['#f18c8c', '#e8bd55', '#8cb5a0', '#a897d2'][i % 4]);
      }
      label(ctx, 'HARI SPESIAL KITA!', width / 2, 88, width * .058, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'make a wish together', width / 2, height - 70, width * .035, accent, 'Georgia');
      break;
    }
    case 'doodle': {
      ctx.fillStyle = '#fffdf4'; ctx.fillRect(18, 18, width - 36, height - 36);
      ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.setLineDash([4, 9]); ctx.strokeRect(34, 34, width - 68, height - 68); ctx.setLineDash([]);
      label(ctx, 'OUR HAPPY SCRIBBLES', width / 2, 82, width * .045, ink, 'Comic Sans MS, cursive', 'center', 'bold');
      star(ctx, 82, 160, 22, accent); heart(ctx, width - 95, 160, 28, '#e89ab4');
      label(ctx, 'coretan kecil, kenangan besar', width / 2, height - 70, width * .026, ink, 'Comic Sans MS, cursive');
      break;
    }
  }
  ctx.restore();
}

export function drawPhotoSlotBorder(ctx, frame, x, y, width, height, index) {
  const [, , , ink, theme, accent] = frame;
  ctx.save();
  switch (theme) {
    case 'newspaper':
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.strokeRect(x - 6, y - 6, width + 12, height + 12);
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(x + 5, y + 5, width - 10, height - 10); break;
    case 'wanted':
      ctx.strokeStyle = '#68452d'; ctx.lineWidth = 16; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16);
      ctx.strokeStyle = '#c59a63'; ctx.lineWidth = 4; ctx.strokeRect(x + 6, y + 6, width - 12, height - 12); break;
    case 'comic':
      ctx.fillStyle = accent; ctx.fillRect(x - 12, y - 12, width + 24, height + 24);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 13; ctx.strokeRect(x - 7, y - 7, width + 14, height + 14); break;
    case 'cinema':
      ctx.strokeStyle = '#d7b46e'; ctx.lineWidth = 13; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16);
      ctx.strokeStyle = '#fff0ce'; ctx.lineWidth = 3; ctx.strokeRect(x + 5, y + 5, width - 10, height - 10); break;
    case 'film':
      ctx.fillStyle = '#171513'; ctx.fillRect(x - 12, y - 12, width + 24, height + 24);
      ctx.strokeStyle = '#e8d7b4'; ctx.lineWidth = 4; ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
      for (let n = 0; n < Math.max(2, Math.floor(width / 85)); n++) { const px = x + n * width / Math.max(1, Math.floor(width / 85)); rounded(ctx, px, y - 11, 20, 10, 3, '#e8d7b4'); rounded(ctx, px, y + height + 1, 20, 10, 3, '#e8d7b4'); }
      break;
    case 'postcard':
      ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.setLineDash([18, 10]); ctx.strokeRect(x - 8, y - 8, width + 16, height + 16); ctx.setLineDash([]); break;
    case 'botanical':
      ctx.fillStyle = '#fffdf7'; ctx.fillRect(x - 9, y - 9, width + 18, height + 18);
      ctx.strokeStyle = '#9aae8b'; ctx.lineWidth = 6; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16); break;
    case 'kawaii':
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 24; ctx.strokeRect(x - 12, y - 12, width + 24, height + 24);
      ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.strokeRect(x - 5, y - 5, width + 10, height + 10); break;
    case 'magazine':
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 26; ctx.strokeRect(x - 13, y - 13, width + 26, height + 26);
      ctx.strokeStyle = accent; ctx.lineWidth = 5; ctx.strokeRect(x - 5, y - 5, width + 10, height + 10); break;
    case 'y2k':
      ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(x + 5, y + 5, width - 10, height - 10); break;
    case 'arcade':
      ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.setLineDash([18, 12]); ctx.strokeRect(x - 8, y - 8, width + 16, height + 16); ctx.setLineDash([]); break;
    case 'loveletter':
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 22; ctx.strokeRect(x - 12, y - 12, width + 24, height + 24);
      ctx.strokeStyle = '#c98596'; ctx.lineWidth = 4; ctx.setLineDash([8, 7]); ctx.strokeRect(x - 4, y - 4, width + 8, height + 8); ctx.setLineDash([]); break;
    case 'birthday':
      ctx.strokeStyle = accent; ctx.lineWidth = 12; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16); break;
    case 'doodle':
      ctx.strokeStyle = ink; ctx.lineWidth = 6; ctx.setLineDash([8, 8]); ctx.strokeRect(x - 7, y - 7, width + 14, height + 14); ctx.setLineDash([]); break;
    default:
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 15; ctx.strokeRect(x - 8, y - 8, width + 16, height + 16);
      ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
  }
  if (theme === 'korean' || theme === 'kawaii' || theme === 'doodle') {
    heart(ctx, x + 18, y + 18, 20, accent); heart(ctx, x + width - 18, y + height - 18, 20, accent);
  }
  if (theme === 'comic') {
    star(ctx, x + 22, y + 22, 18, '#fff', 5); star(ctx, x + width - 22, y + height - 22, 18, '#fff', 5);
  }
  if (theme === 'magazine') label(ctx, `SHOT ${String(index + 1).padStart(2, '0')}`, x + width - 10, y + height + 37, 22, accent, 'Arial', 'right', 'bold');
  ctx.restore();
}
