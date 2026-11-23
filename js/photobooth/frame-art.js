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
  ['doodle','Buku Doodle','#fff9e9','#4c5261','doodle','#78a9a0'],
  ['toybox','Dunia Mainan','#ffd83d','#183b86','toybox','#e43d35'],
  ['social','Polaroid Sosial','#ffc928','#292323','social','#f05b48']
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

function burst(ctx, x, y, outer, inner, fill, stroke = '#231d20', points = 12) {
  ctx.save(); ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / points;
    const radius = i % 2 ? inner : outer;
    const px = x + Math.cos(angle) * radius, py = y + Math.sin(angle) * radius;
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(2, outer * .055); ctx.stroke(); }
  ctx.restore();
}

function drawBear(ctx, x, y, size, fur, cheek = '#ef9db4') {
  ctx.save();
  circle(ctx, x - size * .34, y - size * .34, size * .23, fur, '#654f50', Math.max(2, size * .035));
  circle(ctx, x + size * .34, y - size * .34, size * .23, fur, '#654f50', Math.max(2, size * .035));
  circle(ctx, x, y, size * .48, fur, '#654f50', Math.max(2, size * .035));
  circle(ctx, x - size * .17, y - size * .02, size * .045, '#382e35');
  circle(ctx, x + size * .17, y - size * .02, size * .045, '#382e35');
  circle(ctx, x - size * .27, y + size * .16, size * .09, cheek);
  circle(ctx, x + size * .27, y + size * .16, size * .09, cheek);
  ctx.strokeStyle = '#654f50'; ctx.lineWidth = Math.max(2, size * .025); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - size * .09, y + size * .18); ctx.quadraticCurveTo(x, y + size * .29, x + size * .09, y + size * .18); ctx.stroke();
  ctx.restore();
}

function drawComicBubble(ctx, x, y, width, height, text, fill, ink, rotate = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotate);
  ctx.fillStyle = fill; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(4, width * .025);
  ctx.beginPath(); ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-width * .16, height * .34); ctx.lineTo(-width * .27, height * .54); ctx.lineTo(-width * .02, height * .37); ctx.closePath(); ctx.fill(); ctx.stroke();
  label(ctx, text, 0, 0, height * .34, ink, 'Arial', 'center', '900');
  ctx.restore();
}

function drawLeaf(ctx, x, y, size, angle, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(size * .55, -size * .65, size * 1.1, -size * .5, size, 0); ctx.bezierCurveTo(size * .65, size * .55, size * .2, size * .42, 0, 0); ctx.fill();
  ctx.strokeStyle = '#647b60'; ctx.lineWidth = Math.max(1, size * .045); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * .88, 0); ctx.stroke(); ctx.restore();
}

function drawCloud(ctx, x, y, scale, fill = '#fff', stroke = '#e7a84b') {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.beginPath(); ctx.moveTo(-58, 18); ctx.bezierCurveTo(-82, 15, -82, -18, -55, -24);
  ctx.bezierCurveTo(-48, -58, -4, -62, 10, -35); ctx.bezierCurveTo(38, -55, 72, -35, 66, -7);
  ctx.bezierCurveTo(91, 4, 76, 31, 50, 31); ctx.lineTo(-48, 31); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
}
function drawFriendlyAlien(ctx, x, y, scale, color = '#73c96c') {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  // Original toy-like alien mascot; deliberately not based on any existing character.
  rounded(ctx, -27, -8, 54, 55, 18, color, '#214f73', 4);
  circle(ctx, -12, 12, 8, '#fff'); circle(ctx, 12, 12, 8, '#fff');
  circle(ctx, -11, 13, 3.5, '#24354c'); circle(ctx, 13, 13, 3.5, '#24354c');
  ctx.strokeStyle = '#214f73'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 24, 9, .15, Math.PI - .15); ctx.stroke();
  line(ctx, -14, -8, -24, -27, '#214f73', 3); line(ctx, 14, -8, 24, -27, '#214f73', 3);
  circle(ctx, -25, -29, 5, '#f15b66'); circle(ctx, 25, -29, 5, '#f15b66');
  ctx.restore();
}
function drawPolaroidGlyphs(ctx, width, height) {
  heart(ctx, width * .14, height * .52, width * .075, '#f05b48');
  line(ctx, width * .25, height * .54, width * .33, height * .58, '#292323', 7);
  line(ctx, width * .33, height * .58, width * .29, height * .48, '#292323', 7);
  line(ctx, width * .29, height * .48, width * .25, height * .54, '#292323', 7);
  ctx.save(); ctx.strokeStyle = '#292323'; ctx.lineWidth = 7; ctx.beginPath();
  ctx.moveTo(width * .84, height * .48); ctx.lineTo(width * .84, height * .59); ctx.lineTo(width * .91, height * .55); ctx.lineTo(width * .98, height * .59); ctx.lineTo(width * .98, height * .48); ctx.stroke(); ctx.restore();
}

function drawJaggedFrame(ctx, x, y, width, height, color, lineWidth = 12, seed = 0) {
  const step = Math.max(18, Math.min(width, height) * .06);
  const points = [];
  for (let px = 0; px <= width; px += step) points.push([x + px, y + ((Math.floor(px / step) + seed) % 2 ? -lineWidth * .22 : lineWidth * .22)]);
  for (let py = 0; py <= height; py += step) points.push([x + width + ((Math.floor(py / step) + seed) % 2 ? -lineWidth * .22 : lineWidth * .22), y + py]);
  for (let px = width; px >= 0; px -= step) points.push([x + px, y + height + ((Math.floor(px / step) + seed) % 2 ? -lineWidth * .22 : lineWidth * .22)]);
  for (let py = height; py >= 0; py -= step) points.push([x + ((Math.floor(py / step) + seed) % 2 ? -lineWidth * .22 : lineWidth * .22), y + py]);
  ctx.save(); ctx.beginPath(); points.forEach(([px, py], index) => index ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath();
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}

export function drawFrameBackground(ctx, frame, width, height, couple = false) {
  const [id, name, bg, ink, theme, accent] = frame;
  ctx.save(); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  const edge = Math.round(width * 0.045);
  switch (theme) {
    case 'newspaper': {
      drawPaperNoise(ctx, width, height, ink);
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.strokeRect(edge, edge, width - edge * 2, height - edge * 2);
      ctx.lineWidth = 2; ctx.strokeRect(edge + 14, edge + 14, width - (edge + 14) * 2, height - (edge + 14) * 2);
      label(ctx, 'THE DAILY D I R I', width / 2, 66, width * 0.027, ink, 'Georgia', 'center', 'bold');
      line(ctx, edge + 28, 94, width - edge - 28, 94, ink, 2);
      label(ctx, 'THE LOVE TIMES', width / 2, 145, width * 0.085, ink, 'Georgia', 'center', 'bold');
      line(ctx, edge + 28, 190, width - edge - 28, 190, ink, 5);
      label(ctx, 'EDISI SPESIAL  •  KISAH DUA HATI  •  VOL. 01', width / 2, 220, width * 0.023, ink, 'Georgia', 'center', 'bold');
      line(ctx, edge + 28, 246, width - edge - 28, 246, ink, 2);
      label(ctx, 'EXTRA! EXTRA!', width * .19, height - 104, width * .032, accent, 'Georgia', 'center', 'bold');
      label(ctx, 'KABAR BAIK: KITA BERTEMU DI SINI', width / 2, height - 70, width * 0.029, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'BERITA UTAMA SEPANJANG MASA  •  CETAKAN KENANGAN', width / 2, height - 39, width * 0.017, ink);
      // Newspaper column rules and tiny classified-style sidebars.
      line(ctx, edge + 28, 270, edge + 28, height - 285, ink, 1);
      line(ctx, width - edge - 28, 270, width - edge - 28, height - 285, ink, 1);
      label(ctx, '♡', edge + 42, height * .53, width * .05, accent, 'Georgia', 'center', 'bold');
      label(ctx, '♥', width - edge - 42, height * .68, width * .05, accent, 'Georgia', 'center', 'bold');
      break;
    }
    case 'wanted': {
      drawPaperNoise(ctx, width, height, '#76502f');
      // A printed wanted poster with an inked red seal and paper fibres.
      ctx.strokeStyle = '#71492e'; ctx.lineWidth = 20; ctx.strokeRect(24, 24, width - 48, height - 48);
      ctx.strokeStyle = '#9c7046'; ctx.lineWidth = 4; ctx.strokeRect(52, 52, width - 104, height - 104);
      label(ctx, 'WANTED', width / 2, 73, width * .035, '#873c30', 'Georgia', 'center', 'bold');
      line(ctx, width * .19, 101, width * .81, 101, '#71492e', 3);
      label(ctx, 'DICARI', width / 2, 150, width * 0.105, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'HILANG KARENA MENCURI HATI', width / 2, 200, width * 0.027, ink, 'Georgia', 'center', 'bold');
      burst(ctx, width * .12, 151, width * .047, width * .025, '#cda85f', '#71492e', 8);
      burst(ctx, width * .88, 151, width * .047, width * .025, '#cda85f', '#71492e', 8);
      ctx.save(); ctx.translate(width * .82, 214); ctx.rotate(-.13);
      ctx.strokeStyle = '#a43f32'; ctx.lineWidth = 6; ctx.strokeRect(-width * .12, -22, width * .24, 44);
      label(ctx, 'REWARD', 0, -2, width * .026, '#a43f32', 'Georgia', 'center', 'bold');
      label(ctx, '♡', 0, 17, width * .018, '#a43f32', 'Georgia', 'center', 'bold');
      ctx.restore();
      line(ctx, width * .2, height - 154, width * .8, height - 154, '#71492e', 3);
      label(ctx, 'HADIAH BAGI YANG MENEMUKAN:', width / 2, height - 119, width * 0.024, ink, 'Georgia', 'center', 'bold');
      label(ctx, 'SATU PELUKAN TANPA BATAS', width / 2, height - 72, width * 0.039, '#9b493a', 'Georgia', 'center', 'bold');
      label(ctx, 'KASUS #D-014  •  TERAKHIR TERLIHAT DI HATI', width / 2, height - 40, width * 0.018, ink);
      break;
    }
    case 'comic': {
      ctx.fillStyle = '#fff4bf'; ctx.fillRect(20, 20, width - 40, height - 40);
      for (let r = 0; r < 18; r++) for (let c = 0; c < 11; c++) circle(ctx, 30 + c * (width / 11), 30 + r * (height / 18), 3 + (c % 3), '#e8bf33');
      burst(ctx, width * .16, 111, 82, 48, '#38a9d6', '#171717', 13);
      label(ctx, 'WOW!', width * .16, 111, width * .034, '#171717', 'Arial', 'center', '900');
      rounded(ctx, width * .27, 39, width * .46, 115, 22, '#e53935', '#171717', 10);
      label(ctx, 'OUR STORY!', width / 2, 95, width * .062, '#fff', 'Impact, sans-serif', 'center', 'bold');
      drawComicBubble(ctx, width * .82, 114, width * .24, 88, 'LOVE!', '#fff', '#171717', .12);
      line(ctx, 45, 180, width - 45, 180, '#171717', 7);
      label(ctx, 'DUA TOKOH  •  SATU CERITA  •  BANYAK TAWA', width / 2, height - 70, width * .025, ink, 'Arial', 'center', 'bold');
      burst(ctx, width * .13, height - 92, 54, 28, '#f6b51b', '#171717', 10);
      burst(ctx, width * .87, height - 92, 54, 28, '#38a9d6', '#171717', 10);
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
      label(ctx, 'A LITTLE BIT OF CUTE', width / 2, 62, width * .025, accent, 'Arial', 'center', 'bold');
      label(ctx, 'CUTE LITTLE US', width / 2, 122, width * .061, ink, 'Arial', 'center', 'bold');
      drawBear(ctx, width * .13, 117, 62, '#d9b99f'); drawBear(ctx, width * .87, 117, 62, '#c8b6e6', '#efb1c8');
      heart(ctx, width * .5, 72, 28, '#f2a4c0');
      star(ctx, width * .27, 157, 17, '#f2c85f'); star(ctx, width * .73, 157, 17, '#91c9bd');
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
    case 'toybox': {
      // Bright original toy-room scene: sky, checkerboard, colour bands and friendly mascot.
      const sky = ctx.createLinearGradient(0, 0, 0, height * .48);
      sky.addColorStop(0, '#77d8f5'); sky.addColorStop(1, '#e4f8ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f7cb35'; ctx.fillRect(0, height * .30, width, height * .25);
      const tile = Math.max(38, width * .075);
      for (let y = height * .30, row = 0; y < height * .56; y += tile, row++) {
        for (let x = (row % 2) * tile / 2, col = 0; x < width; x += tile, col++) {
          ctx.fillStyle = (row + col) % 2 ? '#fff0a0' : '#f4b91f';
          ctx.fillRect(x, y, tile, tile);
        }
      }
      ctx.fillStyle = '#173b91'; ctx.fillRect(0, height * .56, width, height * .25);
      ctx.fillStyle = '#e94436'; ctx.fillRect(0, height * .81, width, height * .19);
      drawCloud(ctx, width * .18, height * .18, width * .00105, '#fff', '#64b9df');
      drawCloud(ctx, width * .81, height * .22, width * .00075, '#fff', '#64b9df');
      star(ctx, width * .87, height * .10, width * .055, '#ffdf45', 5, width * .025);
      label(ctx, 'PETUALANGAN KECIL KITA', width / 2, height * .075, width * .043, '#173b91', 'Arial', 'center', '900');
      drawFriendlyAlien(ctx, width * .84, height * .91, width * .00145, '#78d46c');
      circle(ctx, width * .13, height * .90, width * .045, '#f4a34b', '#fff1c7', 5);
      label(ctx, 'PLAY · SMILE · REPEAT', width / 2, height * .965, width * .027, '#fff8d8', 'Arial', 'center', '900');
      break;
    }
    case 'social': {
      const yellow = ctx.createLinearGradient(0, 0, width, height);
      yellow.addColorStop(0, '#ffdf55'); yellow.addColorStop(.55, '#ffc629'); yellow.addColorStop(1, '#f5a91c');
      ctx.fillStyle = yellow; ctx.fillRect(0, 0, width, height);
      circle(ctx, width * .12, height * .16, width * .10, 'rgba(255,255,255,.18)');
      circle(ctx, width * .88, height * .78, width * .15, 'rgba(255,255,255,.14)');
      label(ctx, 'YOUR LITTLE MOMENTS', width / 2, height * .075, width * .044, '#3b2b28', 'Arial', 'center', '900');
      label(ctx, '♡  LIKE · SAVE · REMEMBER  ♡', width / 2, height * .96, width * .026, '#3b2b28', 'Arial', 'center', 'bold');
      drawPolaroidGlyphs(ctx, width, height);
      break;
    }
  }
  ctx.restore();
}

export function drawPhotoSlotBorder(ctx, frame, x, y, width, height, index) {
  const [, , , ink, theme, accent] = frame;
  ctx.save();
  switch (theme) {
    case 'newspaper': {
      ctx.fillStyle = '#f8f3e6'; ctx.fillRect(x - 8, y - 8, width + 16, height + 16);
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.strokeRect(x - 6, y - 6, width + 12, height + 12);
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
      line(ctx, x + 12, y + height - 19, x + width - 12, y + height - 19, ink, 1);
      label(ctx, `FOTO UTAMA  •  ${String(index + 1).padStart(2, '0')}`, x + width / 2, y + height + 21, Math.max(13, width * .025), ink, 'Georgia', 'center', 'bold');
      break;
    }
    case 'wanted': {
      ctx.fillStyle = '#f0dfb8'; ctx.fillRect(x - 12, y - 12, width + 24, height + 24);
      drawJaggedFrame(ctx, x - 7, y - 7, width + 14, height + 14, '#68452d', 16, index);
      ctx.strokeStyle = '#c59a63'; ctx.lineWidth = 4; ctx.strokeRect(x + 7, y + 7, width - 14, height - 14);
      ctx.save(); ctx.translate(x + width - 26, y + 26); ctx.rotate(.17); ctx.fillStyle = '#a43f32';
      ctx.beginPath(); ctx.arc(0, 0, Math.min(23, width * .07), 0, Math.PI * 2); ctx.fill();
      label(ctx, '★', 0, 1, Math.min(29, width * .09), '#f7e8c9', 'Georgia', 'center', 'bold'); ctx.restore();
      label(ctx, `TERSANGKA #${String(index + 1).padStart(2, '0')}`, x + width / 2, y + height + 25, Math.max(14, width * .026), '#8f3e32', 'Georgia', 'center', 'bold');
      break;
    }
    case 'comic': {
      ctx.save(); ctx.fillStyle = '#20202a'; ctx.fillRect(x - 15, y - 10, width + 23, height + 23); ctx.restore();
      ctx.fillStyle = accent; ctx.fillRect(x - 9, y - 9, width + 18, height + 18);
      ctx.strokeStyle = '#141414'; ctx.lineWidth = 13; ctx.strokeRect(x - 7, y - 7, width + 14, height + 14);
      burst(ctx, x + 22, y + 22, Math.min(29, width * .08), Math.min(16, width * .045), '#fff', '#141414', 8);
      burst(ctx, x + width - 22, y + height - 22, Math.min(29, width * .08), Math.min(16, width * .045), '#fff', '#141414', 8);
      label(ctx, ['POW!','WOW!','LOVE!','YAY!'][index % 4], x + width / 2, y + height + 25, Math.max(14, width * .04), '#171717', 'Arial', 'center', '900');
      break;
    }
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
      ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - 13, y - 13, width + 26, height + 26, 25); ctx.fill();
      ctx.strokeStyle = accent; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
      drawBear(ctx, x + 25, y + 22, Math.min(38, width * .11), '#d9b99f');
      heart(ctx, x + width - 22, y + height - 18, Math.min(24, width * .07), '#ed9fbd');
      break;
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
    case 'toybox': {
      ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(20,45,90,.28)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
      rounded(ctx, x - 15, y - 15, width + 30, height + 30, 34, '#fff', '#e84b39', 9); ctx.restore();
      ctx.strokeStyle = '#f8c832'; ctx.lineWidth = 9; ctx.strokeRect(x - 5, y - 5, width + 10, height + 10);
      drawCloud(ctx, x + width * .10, y + height * .03, Math.min(.42, width * .00055), '#fff', '#e84b39');
      star(ctx, x + width - 20, y + 20, Math.min(24, width * .06), '#f4c52e');
      label(ctx, ['PLAY!', 'SMILE!', 'WOW!', 'YAY!'][index % 4], x + width / 2, y + height + 27, Math.max(16, width * .035), '#173b91', 'Arial', 'center', '900');
      break;
    }
    case 'social': {
      ctx.save(); ctx.shadowColor = 'rgba(70,45,20,.22)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 13, y - 13, width + 26, height + 48); ctx.restore();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 12; ctx.strokeRect(x - 7, y - 7, width + 14, height + 14);
      heart(ctx, x + 20, y + height + 25, Math.min(22, width * .06), '#f05b48');
      label(ctx, '♡', x + width - 18, y + height + 24, Math.max(16, width * .05), '#292323', 'Arial', 'center', 'bold');
      label(ctx, `MOMENT ${String(index + 1).padStart(2,'0')}`, x + width / 2, y + height + 28, Math.max(12, width * .023), '#4b403b', 'Arial', 'center', 'bold');
      break;
    }
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
  if (!['newspaper', 'wanted', 'comic', 'magazine'].includes(theme)) {
    const n = String(index + 1).padStart(2, '0');
    const caption = theme === 'kawaii' ? ['CUTIE 01','HAPPY FACE','SWEET MOMENT','BESTIES'][index % 4]
      : theme === 'film' ? `FRAME ${n} · 36 EXP`
      : theme === 'postcard' ? `POSTMARK ${n}`
      : theme === 'doodle' ? `DOODLE SHOT ${n}`
      : `SHOT ${n}`;
    const captionColor = theme === 'film' || theme === 'arcade' ? '#f1dfbd' : ink;
    label(ctx, caption, x + width / 2, y + height + 25, Math.max(12, width * .022), captionColor, theme === 'arcade' || theme === 'film' ? 'Courier New' : 'Arial', 'center', 'bold');
  }
  ctx.restore();
}

export function drawFrameOverlay(ctx, frame, width, height, couple = false) {
  const [id, , , ink, theme, accent] = frame;
  const leftX = width * .045, rightX = width * .955;
  // Keep canvas ornaments aligned with the CSS preview positions per theme.
  const ornamentPositions = {
    wanted: [.43, .64], comic: [.28, .77], kawaii: [.34, .75]
  };
  const [upperRatio, lowerRatio] = ornamentPositions[theme] || [.21, .86];
  const upperY = height * upperRatio, lowerY = height * lowerRatio;
  ctx.save();
  if (theme === 'wanted') {
    star(ctx, leftX, upperY, width * .035, '#a43f32', 8, width * .019);
    label(ctx, 'REWARD', rightX, lowerY, width * .024, '#a43f32', 'Georgia', 'center', 'bold');
  } else if (theme === 'comic') {
    burst(ctx, leftX, upperY, width * .043, width * .024, '#55c4e4', '#171717', 9);
    label(ctx, 'POW!', leftX, upperY, width * .027, '#171717', 'Arial', 'center', '900');
    burst(ctx, rightX, lowerY, width * .04, width * .022, '#f45e55', '#171717', 9);
    label(ctx, 'WOW!', rightX, lowerY, width * .025, '#fff', 'Arial', 'center', '900');
  } else if (theme === 'kawaii') {
    heart(ctx, leftX, upperY, width * .05, '#eea8c5');
    star(ctx, rightX, lowerY, width * .035, '#d5a4df');
  } else if (theme === 'toybox') {
    star(ctx, leftX, upperY, width * .05, '#f4c52e', 5);
    drawFriendlyAlien(ctx, rightX, lowerY, width * .00075, '#78d46c');
  } else if (theme === 'social') {
    heart(ctx, leftX, upperY, width * .06, '#f05b48');
    star(ctx, rightX, lowerY, width * .035, '#fff7d1');
  } else if (theme === 'newspaper') {
    label(ctx, '✦', leftX, upperY, width * .04, accent, 'Georgia', 'center', 'bold');
    label(ctx, '♡', rightX, lowerY, width * .04, accent, 'Georgia', 'center', 'bold');
  } else {
    label(ctx, theme === 'botanical' ? '❀' : theme === 'birthday' ? '✷' : '✦', leftX, upperY, width * .043, accent, 'Georgia', 'center', 'bold');
    label(ctx, theme === 'loveletter' ? '♡' : theme === 'postcard' ? '✉' : '♡', rightX, lowerY, width * .04, accent, 'Georgia', 'center', 'bold');
  }
  ctx.restore();
}
