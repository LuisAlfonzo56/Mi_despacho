// Ilustraciones en línea (estilo grabado) para el arte de espalda.
// Todas usan `c` (color de tinta) y `a` (color de acento). viewBox 400 x 500.

const hatch = (id, c, gap = 4, angle = 0, w = 1) =>
  `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${c}" stroke-width="${w}"/></pattern>`;

const cross = (x, y, c) =>
  `<path d="M${x},${y - 18} V${y + 4} M${x - 7},${y - 10} H${x + 7}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

const ogive = (x, y, w, h) => // ventana ojival (arco apuntado)
  `M${x},${y + h} V${y + w * 0.6} Q${x},${y} ${x + w / 2},${y - w * 0.25} Q${x + w},${y} ${x + w},${y + w * 0.6} V${y + h} Z`;

function tower(cx, c, uid) {
  const x = cx - 38, w = 76;
  let s = '';
  // aguja
  s += `<path d="M${cx},22 L${x + 4},178 H${x + w - 4} Z" fill="url(#h1${uid})" stroke="${c}" stroke-width="2"/>`;
  s += `<path d="M${cx},22 L${cx},178" stroke="${c}" stroke-width="1.2"/>`;
  for (let i = 0; i < 5; i++) { const y = 60 + i * 24, d = (y - 22) * 0.217; s += `<path d="M${cx - d},${y} H${cx + d}" stroke="${c}" stroke-width="1.2"/>`; }
  s += cross(cx, 22, c);
  // pináculos de esquina
  for (const px of [x, x + w]) s += `<path d="M${px - 7},190 L${px},146 L${px + 7},190 Z" fill="${c}" opacity=".85"/>`;
  // cuerpo de la torre
  s += `<rect x="${x}" y="178" width="${w}" height="300" fill="none" stroke="${c}" stroke-width="2.2"/>`;
  s += `<rect x="${x}" y="178" width="${w / 2}" height="300" fill="url(#h2${uid})"/>`;
  for (const y of [190, 270, 352]) s += `<path d="${ogive(x + 18, y + 14, w - 36, 54)}" fill="${c}" opacity=".9"/>`;
  for (const y of [256, 338, 420]) s += `<path d="M${x},${y} H${x + w}" stroke="${c}" stroke-width="1.6"/>`;
  return s;
}

function basilica(c, a, uid = 'b') {
  let s = `<defs>${hatch('h1' + uid, c, 3.2, 0, 0.9)}${hatch('h2' + uid, c, 4, 0, 0.8)}${hatch('h3' + uid, c, 3, 90, 0.7)}</defs>`;
  s += tower(108, c, uid) + tower(292, c, uid);
  // nave central y frontón
  s += `<path d="M146,250 L200,150 L254,250 Z" fill="none" stroke="${c}" stroke-width="2.2"/>`;
  s += `<path d="M160,250 L200,176 L240,250" fill="none" stroke="${c}" stroke-width="1.2"/>`;
  s += cross(200, 150, c);
  s += `<rect x="146" y="250" width="108" height="228" fill="none" stroke="${c}" stroke-width="2.2"/>`;
  // rosetón
  s += `<circle cx="200" cy="292" r="30" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="200" cy="292" r="9" fill="${c}"/>`;
  for (let i = 0; i < 12; i++) { const t = i * Math.PI / 6; s += `<path d="M${200 + 9 * Math.cos(t)},${292 + 9 * Math.sin(t)} L${200 + 30 * Math.cos(t)},${292 + 30 * Math.sin(t)}" stroke="${c}" stroke-width="1.3"/>`; }
  // portal
  s += `<path d="${ogive(168, 380, 64, 98)}" fill="url(#h3${uid})" stroke="${c}" stroke-width="2.2"/>`;
  s += `<path d="${ogive(178, 396, 44, 82)}" fill="${c}" opacity=".85"/>`;
  s += `<path d="M146,346 H254" stroke="${c}" stroke-width="1.4"/><path d="M146,354 H254" stroke="${c}" stroke-width="0.8"/>`;
  // escalinata
  for (let i = 0; i < 3; i++) s += `<path d="M${50 - i * 14},${478 + i * 7} H${350 + i * 14}" stroke="${c}" stroke-width="1.8"/>`;
  return s;
}

function palm(x, y, k, c, lean = 0, flip = false) {
  const f = flip ? -1 : 1;
  const tx = x + f * 30 * k, ty = y - 230 * k;
  let s = `<g stroke="${c}" fill="none" stroke-linecap="round">`;
  s += `<path d="M${x},${y} Q${x + f * 6 * k},${y - 120 * k} ${tx},${ty}" stroke-width="${9 * k}"/>`;
  for (let i = 1; i < 9; i++) { const yy = y - i * 25 * k, xx = x + f * (i * 3.4 * k); s += `<path d="M${xx - 5 * k},${yy} h${10 * k}" stroke-width="${1.6 * k + 0.6}"/>`; }
  const fr = [[-95, 30], [-60, -25], [-15, -48], [30, -40], [85, -5], [100, 40], [-110, 70]];
  for (const [dx, dy] of fr) {
    const ex = tx + f * dx * k, ey = ty + dy * k + 40 * k;
    s += `<path d="M${tx},${ty} Q${tx + f * dx * 0.5 * k},${ty + dy * k - 25 * k} ${ex},${ey}" stroke-width="${3.4 * k + 1}"/>`;
    for (let j = 1; j < 6; j++) { const t = j / 6, qx = tx + f * dx * k * t, qy = ty + (dy * k - 10 * k) * t + 30 * k * t * t; s += `<path d="M${qx},${qy} l${f * 4 * k},${12 * k}" stroke-width="${1.4 * k + 0.5}"/>`; }
  }
  return s + `<circle cx="${tx}" cy="${ty + 6 * k}" r="${5 * k}" fill="${c}"/></g>`;
}

const waves = (y0, n, c, w = 1.6, amp = 5, x0 = 0, x1 = 400) => {
  n = Math.min(n, 10);
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + i * 14, ph = (i % 2) * 20;
    let d = `M${x0},${y}`;
    for (let x = x0; x < x1; x += 40) d += ` q10,${-amp} 20,0 t20,0`;
    s += `<path d="${d}" transform="translate(${-ph},0)" stroke="${c}" stroke-width="${w}" fill="none" opacity="${1 - i * 0.07}"/>`;
  }
  return s;
};

const sunStriped = (cx, cy, r, c, uid, stripes = 9) => {
  let s = `<clipPath id="sun${uid}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#sun${uid})">`;
  for (let i = 0; i < stripes; i++) { const y = cy - r + i * (2 * r / stripes), h = (2 * r / stripes) * (1 - i * 0.06); s += `<rect x="${cx - r}" y="${y}" width="${2 * r}" height="${h * 0.75}" fill="${c}"/>`; }
  return s + '</g>';
};

const gull = (x, y, k, c) => `<path d="M${x - 12 * k},${y} q${6 * k},${-8 * k} ${12 * k},0 q${6 * k},${-8 * k} ${12 * k},0" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

function elAgua(c, a, uid = 'ea') {
  let s = sunStriped(250, 170, 92, a, uid, 10);
  s += gull(90, 120, 1.2, c) + gull(130, 96, 0.9, c) + gull(330, 70, 1, c);
  s += `<path d="M0,268 H400" stroke="${c}" stroke-width="2"/>`;
  s += waves(282, 9, c, 1.7, 5);
  s += `<path d="M0,420 Q120,392 250,410 T400,400 V500 H0 Z" fill="none" stroke="${c}" stroke-width="2"/>`;
  for (let i = 0; i < 26; i++) s += `<circle cx="${(i * 53) % 390 + 6}" cy="${440 + (i * 29) % 52}" r="1.6" fill="${c}"/>`;
  s += palm(70, 470, 1.1, c, 0) + palm(118, 486, 0.82, c, 0) + palm(352, 478, 0.95, c, 0, true);
  return s;
}

function sail(x, y, k, c, a) {
  return `<g><path d="M${x},${y} L${x + 4 * k},${y - 150 * k} Q${x + 70 * k},${y - 60 * k} ${x + 58 * k},${y - 6 * k} Z" fill="${a}" stroke="${c}" stroke-width="2.2"/>` +
    [0.25, 0.5, 0.75].map(t => `<path d="M${x + 4 * k * (1 - t)},${y - 150 * k * (1 - t)} L${x + 62 * k * Math.sin(Math.PI * (1 - t) * 0.9) + 2},${y - 150 * k * (1 - t) + 10 * k}" stroke="${c}" stroke-width="1.4"/>`).join('') +
    `<path d="M${x + 4 * k},${y - 70 * k} L${x + 46 * k},${y - 40 * k}" stroke="${c}" stroke-width="2.4"/>` +
    `<path d="M${x - 14 * k},${y + 4 * k} Q${x + 30 * k},${y + 12 * k} ${x + 74 * k},${y + 2 * k}" stroke="${c}" stroke-width="${4 * k}" fill="none" stroke-linecap="round"/></g>`;
}

function elYaque(c, a, uid = 'ey') {
  let s = `<circle cx="300" cy="110" r="46" fill="none" stroke="${c}" stroke-width="2"/>`;
  for (let i = 0; i < 16; i++) { const t = i * Math.PI / 8; s += `<path d="M${300 + 56 * Math.cos(t)},${110 + 56 * Math.sin(t)} L${300 + 70 * Math.cos(t)},${110 + 70 * Math.sin(t)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`; }
  // cometa de kitesurf
  s += `<path d="M40,96 Q110,40 180,92 Q170,104 160,102 Q110,66 60,106 Q48,104 40,96 Z" fill="${a}" stroke="${c}" stroke-width="2"/>`;
  s += `<path d="M48,102 L212,284 M172,98 L212,284" stroke="${c}" stroke-width="1" opacity=".8"/><circle cx="214" cy="278" r="4.5" fill="${c}"/><path d="M214,283 L212,296 L206,302 M212,296 L220,301 M200,304 Q214,308 228,302" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  // líneas de viento
  for (const [x, y, w] of [[210, 190, 120], [240, 206, 90], [30, 200, 80]]) s += `<path d="M${x},${y} h${w} q14,0 14,-10 q0,-10 -10,-8" stroke="${c}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M0,262 H400" stroke="${c}" stroke-width="2"/><path d="M0,256 Q60,236 110,250 T220,248 L230,262 H0 Z" fill="url(#hy${uid})" stroke="${c}" stroke-width="1.4"/>`;
  s = `<defs>${hatch('hy' + uid, c, 3, 0, 0.8)}</defs>` + s;
  s += waves(276, 13, c, 1.6, 6);
  s += sail(150, 330, 1.05, c, a) + sail(280, 300, 0.75, c, a) + sail(60, 300, 0.6, c, a);
  s += gull(250, 60, 1, c) + gull(212, 44, 0.8, c);
  return s;
}

function juanGriego(c, a, uid = 'jg') {
  let s = `<defs>${hatch('hj' + uid, c, 3.4, 0, 1)}</defs>`;
  s += sunStriped(200, 250, 128, a, uid, 11);
  for (let i = 0; i < 12; i++) { const t = Math.PI + i * Math.PI / 11; s += `<path d="M${200 + 142 * Math.cos(t)},${250 + 142 * Math.sin(t)} L${200 + 168 * Math.cos(t)},${250 + 168 * Math.sin(t)}" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`; }
  // cerro con el fortín
  s += `<path d="M0,330 Q40,300 90,268 Q140,240 190,262 Q230,282 270,330 Z" fill="url(#hj${uid})" stroke="${c}" stroke-width="2.2"/>`;
  s += `<path d="M78,262 V226 H96 V218 H108 V226 H122 V218 H134 V226 H150 V218 H162 V226 H176 V258" fill="${c}" stroke="${c}" stroke-width="2"/>`;
  s += `<path d="M108,262 V244 Q118,234 128,244 V262" fill="${a}"/>`;
  s += `<path d="M0,330 H400" stroke="${c}" stroke-width="2.2"/>`;
  // reflejo del sol en el agua
  for (let i = 0; i < 8; i++) { const w = 200 - i * 22; s += `<path d="M${200 - w / 2},${344 + i * 13} h${w}" stroke="${a}" stroke-width="3" stroke-linecap="round" opacity="${1 - i * 0.09}"/>`; }
  s += waves(344, 11, c, 1.3, 4);
  // peñero
  s += `<path d="M262,392 Q300,404 352,392 L342,410 Q300,416 270,408 Z" fill="${c}"/><path d="M300,392 V352 L326,388" stroke="${c}" stroke-width="2" fill="none"/>`;
  s += gull(300, 150, 1.1, c) + gull(334, 130, 0.8, c) + gull(80, 120, 0.9, c);
  s += palm(372, 330, 0.62, c, 0, true);
  return s;
}

module.exports = { basilica, elAgua, elYaque, juanGriego };
