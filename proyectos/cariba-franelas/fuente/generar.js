// Genera los PDF de las franelas deportivas Cariba (Modelo 1 y Modelo 2, 3 opciones c/u).
// Uso: node generar.js <carpeta_salida> [carpeta_previews_png]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ilu = require('./ilustraciones');

const OUT = path.resolve(process.argv[2] || '..');
const PREV = process.argv[3] ? path.resolve(process.argv[3]) : null;
const FONTS = path.join(__dirname, 'fonts');
const FECHA = '18/11/2026';

// ---------- Paleta (manual Cariba 2025) ----------
const P = {
  blanco: { n: 'Blanco Cariba', hex: '#F5F6F7', pms: '663 C' },
  azul: { n: 'Azul Cariba', hex: '#10069F', pms: 'Blue 072 C' },
  amarillo: { n: 'Amarillo', hex: '#FFD300', pms: 'Cyber Yellow 12-0647 TCX' },
  cian: { n: 'Cian', hex: '#00A9E0', pms: '2995 C' },
};

// Tres combinaciones (fondo de tela → tinta), todas autorizadas por el manual
const COLORWAYS = [
  { id: 'A', nombre: 'Blanco Cariba', tela: P.blanco, tinta: P.azul, acento: P.cian, rib: P.azul, fondo: P.azul.hex,
    tecnica: 'Sublimación total sobre poliéster blanco: la tinta penetra la fibra, no cierra los poros del tejido y no se agrieta.',
    nota: 'La versión más fiel a la inspiración: limpia, fresca y con el azul como protagonista.' },
  { id: 'B', nombre: 'Azul Cariba', tela: P.azul, tinta: P.blanco, acento: P.amarillo, rib: P.amarillo, fondo: P.amarillo.hex, scriptAcento: true,
    tecnica: 'Tela teñida en azul + DTF (o serigrafía con tinta para poliéster de baja migración). La sublimación no imprime blanco ni sobre tela oscura.',
    nota: 'Versión de color principal de la marca: logo en blanco (versión oficial) y letras caligráficas en amarillo.' },
  { id: 'C', nombre: 'Cian', tela: P.cian, tinta: P.azul, acento: P.blanco, rib: P.azul, fondo: P.azul.hex,
    tecnica: 'Tela teñida en cian + DTF o serigrafía en un solo color (azul). También posible sublimar el azul sobre cian claro: pedir prueba.',
    nota: 'Versión más playera y deportiva: azul sobre cian, combinación autorizada por el manual.' },
];

// ---------- Logo (representación para boceto; reemplazar por archivo oficial) ----------
const logoTpl = fs.readFileSync(path.join(__dirname, 'logo-cariba-representacion.svg'), 'utf8');
const logo = (color, w) => logoTpl.replace('<svg ', `<svg style="width:${w}px;height:auto;display:block;color:${color}" `);
const isotipo = (color, w) =>
  `<svg viewBox="314 -56 112 150" style="width:${w}px;height:auto;display:block;color:${color}"><g fill="none" stroke="currentColor" stroke-width="27"><path d="M345,22 V50" stroke-linecap="round"/><circle cx="382" cy="50" r="37"/></g><path fill="currentColor" d="M347,-38 a17,17 0 1 1 -14,24 q-3,-6 -2,-12 q4,-10 16,-12z"/></svg>`;

// ---------- Silueta de franela deportiva (viewBox 500 x 560) ----------
const BODY = (back) => `M196,34 Q250,${back ? 50 : 74} 304,34 L392,56 Q440,70 462,130 L494,214 L420,246 L398,196 Q402,370 404,538 Q250,552 96,538 Q98,370 102,196 L80,246 L6,214 L38,130 Q60,70 108,56 Z`;

function shirtBase(cw, back, uid) {
  const f = cw.tela.hex, r = cw.rib.hex;
  return `<svg viewBox="0 0 500 560" class="layer">
  <defs>
    <pattern id="mp${uid}" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".55" fill="#000" opacity=".09"/></pattern>
    <pattern id="mesh${uid}" width="6" height="5.2" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.3" r="1.25" fill="#000" opacity=".22"/><circle cx="4.5" cy="3.9" r="1.25" fill="#000" opacity=".22"/></pattern>
  </defs>
  <path d="${BODY(back)}" fill="${f}"/>
  ${back ? '' : `<path d="M196,34 Q250,74 304,34 Q250,16 196,34 Z" fill="${f}"/><path d="M196,34 Q250,74 304,34 Q250,16 196,34 Z" fill="#000" opacity=".16"/>`}
  <path d="${BODY(back)}" fill="url(#mp${uid})"/>
  <path d="M102,196 L132,206 Q130,370 128,540 L96,538 Q98,370 102,196 Z" fill="url(#mesh${uid})"/>
  <path d="M398,196 L368,206 Q370,370 372,540 L404,538 Q402,370 398,196 Z" fill="url(#mesh${uid})"/>
  <path d="M132,206 Q130,370 128,540 M368,206 Q370,370 372,540" stroke="#000" stroke-opacity=".18" stroke-width="1" fill="none" stroke-dasharray="3 2"/>
  <path d="M200,37 Q150,110 104,198 M300,37 Q350,110 396,198" stroke="#000" stroke-opacity=".2" stroke-width="1.2" fill="none"/>
  <path d="M206,40 Q157,112 112,200 M294,40 Q343,112 388,200" stroke="#000" stroke-opacity=".18" stroke-width=".9" fill="none" stroke-dasharray="3 2"/>
  <path d="M6,214 L80,246 L84.8,235 L10.8,203 Z M494,214 L420,246 L415.2,235 L489.2,203 Z" fill="${r}"/>
  <path d="M98,526 Q250,540 402,526" stroke="#000" stroke-opacity=".2" stroke-width=".9" fill="none" stroke-dasharray="3 2"/>
  ${back
    ? `<path d="M196,34 Q250,24 304,34" stroke="${r}" stroke-width="9" fill="none" opacity=".9"/><path d="M196,34 Q250,50 304,34" stroke="${r}" stroke-width="10" fill="none" stroke-linecap="round"/>`
    : `<path d="M196,34 Q250,74 304,34" stroke="${r}" stroke-width="10" fill="none" stroke-linecap="round"/>`}
</svg>`;
}

function shirtShade(back, uid) {
  return `<svg viewBox="0 0 500 560" class="layer" style="mix-blend-mode:multiply">
  <defs>
    <clipPath id="cl${uid}"><path d="${BODY(back)}"/></clipPath>
    <linearGradient id="lg${uid}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".22" stop-color="#000" stop-opacity=".03"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="vg${uid}" y1="0" y2="1" x1="0" x2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    <filter id="bl${uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="bs${uid}"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <g clip-path="url(#cl${uid})">
    <rect width="500" height="560" fill="url(#lg${uid})"/><rect width="500" height="560" fill="url(#vg${uid})"/>
    <g filter="url(#bl${uid})" stroke="#000" fill="none" stroke-linecap="round">
      <path d="M108,214 Q160,270 182,350" stroke-width="16" stroke-opacity=".1"/>
      <path d="M392,214 Q340,270 318,350" stroke-width="16" stroke-opacity=".1"/>
      <path d="M190,420 Q200,480 186,540" stroke-width="18" stroke-opacity=".07"/>
      <path d="M318,430 Q300,490 316,540" stroke-width="16" stroke-opacity=".06"/>
      <path d="M40,150 Q70,190 90,236" stroke-width="20" stroke-opacity=".1"/>
      <path d="M460,150 Q430,190 410,236" stroke-width="20" stroke-opacity=".1"/>
      <path d="M130,64 Q170,62 196,40 M370,64 Q330,62 304,40" stroke-width="14" stroke-opacity=".08"/>
    </g>
    <g filter="url(#bs${uid})" stroke="#000" fill="none"><path d="M150,536 Q170,500 162,470 M340,536 Q330,505 344,480" stroke-width="3" stroke-opacity=".08"/></g>
  </g>
</svg>`;
}

const shirtLight = (back, uid) => `<svg viewBox="0 0 500 560" class="layer" style="mix-blend-mode:screen">
  <defs><radialGradient id="rg${uid}" cx=".42" cy=".3" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><clipPath id="cll${uid}"><path d="${BODY(back)}"/></clipPath></defs>
  <rect width="500" height="560" fill="url(#rg${uid})" clip-path="url(#cll${uid})"/></svg>`;

const ART = { x: 105, y: 86, w: 290 };
let UID = 0;
function mockup(cw, back, artHTML, W) {
  const s = W / 500, uid = 'u' + (UID++);
  let print = '';
  if (back) {
    print += `<div class="abs" style="left:${238 * s}px;top:${44 * s}px">${isotipo(cw.tinta.hex, 24 * s)}</div>`;
    print += `<div class="abs" style="left:${ART.x * s}px;top:${ART.y * s}px;width:600px;transform:scale(${(ART.w * s) / 600});transform-origin:0 0">${artHTML}</div>`;
  } else {
    print += `<div class="abs" style="left:${(250 - 37) * s}px;top:${116 * s}px">${logo(cw.tinta.hex, 74 * s)}</div>`;
    print += `<div class="abs" style="left:${44 * s}px;top:${150 * s}px;transform:rotate(-22deg)">${isotipo(cw.tinta.hex, 16 * s)}</div>`;
  }
  return `<div class="mock" style="width:${W}px;height:${W * 1.12}px">
    <div class="shadow" style="width:${W * 0.7}px;left:${W * 0.15}px;top:${W * 1.07}px"></div>
    ${shirtBase(cw, back, uid)}${print}${shirtShade(back, uid)}${shirtLight(back, uid)}</div>`;
}

// ---------- Artes de espalda (lienzo 600 x 760) ----------
const sc = (ch, cw, size, style = '') => `<span class="sc" style="font-size:${size}px;${cw.scriptAcento ? `color:${cw.acento.hex};` : ''}${style}">${ch}</span>`;
const bd = (t, size = 104, style = '') => `<span class="bd" style="font-size:${size}px;${style}">${t}</span>`;

function artTemplate(cw, illSVG, illOpacity, lines, serif, small, illBox = 'left:80px;top:62px;width:440px;height:550px', o = {}) {
  const H = o.h || 760, tt = o.titles || 150, sy = o.serif || 580;
  return `<div class="art" style="color:${cw.tinta.hex};height:${H}px">
    <div class="club">CARIBA SOCIAL CLUB</div>
    <svg viewBox="0 0 400 500" class="abs" style="${illBox};opacity:${illOpacity}">${illSVG}</svg>
    <div class="titles" style="top:${tt}px">${lines.map(l => `<div class="ln" style="${l.style || ''}">${l.html}</div>`).join('')}</div>
    <div class="srf" style="top:${sy}px">${serif}</div>
    <div class="small" style="top:${sy + 68}px">${small}</div>
  </div>`;
}

const artVirgen = (cw) => artTemplate(cw, ilu.basilica(cw.tinta.hex, cw.acento.hex, 'b' + cw.id), 0.34, [
  { html: sc('V', cw, 250, 'margin-right:-30px;margin-top:-40px') + bd('ALLE DEL', 104) },
  { html: bd('ESPÍRI', 104) + sc('T', cw, 250, 'margin:0 -14px 0 -10px') + bd('U', 104) },
  { html: sc('S', cw, 250, 'margin-right:-22px') + bd('ANTO', 138), style: 'margin-top:-6px' },
], 'VIRGEN DEL VALLE', '8 DE SEPTIEMBRE DE 1911', 'left:80px;top:34px;width:440px;height:550px', { h: 780, serif: 604 });

const PLAYAS = {
  A: { titulo: 'Playa El Agua', ilu: ilu.elAgua,
    lines: (cw) => [
      { html: sc('P', cw, 250, 'margin-right:-18px;margin-top:-40px') + bd('LAYA', 128) },
      { html: bd('EL', 128, 'margin-right:18px') + sc('A', cw, 250, 'margin-right:-26px') + bd('GUA', 128) },
    ] },
  C: { titulo: 'El Yaque', ilu: ilu.elYaque,
    lines: (cw) => [
      { html: sc('P', cw, 250, 'margin-right:-18px;margin-top:-40px') + bd('LAYA', 128) },
      { html: bd('EL', 128, 'margin-right:16px') + sc('Y', cw, 250, 'margin-right:-30px') + bd('AQUE', 128) },
    ] },
  B: { titulo: 'Juan Griego', ilu: ilu.juanGriego,
    lines: (cw) => [
      { html: sc('J', cw, 250, 'margin-right:-12px;margin-top:-40px') + bd('UAN', 128) },
      { html: sc('G', cw, 250, 'margin-right:-22px') + bd('RIEGO', 128) },
    ] },
};
const artPlaya = (cw) => {
  const p = PLAYAS[cw.id];
  return artTemplate(cw, p.ilu(cw.tinta.hex, cw.acento.hex, 'p' + cw.id), 1, p.lines(cw),
    'ISLA DE MARGARITA', 'NUEVA ESPARTA · VENEZUELA', 'left:100px;top:268px;width:400px;height:500px', { h: 880, titles: 104, serif: 748 });
};

// ---------- Páginas ----------
const swatch = (c, rol) => `<div class="sw"><div class="chip" style="background:${c.hex}"></div><div><b>${rol}</b><br>${c.n}<br><span>${c.hex} · ${c.pms}</span></div></div>`;

function pageOption(model, cw, idx) {
  const art = model.art(cw);
  const sub = model.id === 2 ? ` — ${PLAYAS[cw.id].titulo}` : '';
  return `<section class="page" style="background:${cw.fondo}">
    <div class="tag" style="color:${cw.fondo === P.amarillo.hex ? P.azul.hex : P.blanco.hex}">MODELO ${model.id} · OPCIÓN ${idx + 1} (${cw.id})${sub.toUpperCase()}</div>
    <div class="stage">
      <div class="col">${mockup(cw, false, '', 440)}<div class="lbl" style="color:${cw.fondo === P.amarillo.hex ? P.azul.hex : P.blanco.hex}">FRENTE</div></div>
      <div class="col">${mockup(cw, true, art, 440)}<div class="lbl" style="color:${cw.fondo === P.amarillo.hex ? P.azul.hex : P.blanco.hex}">ESPALDA</div></div>
    </div>
    <div class="band">
      <div class="b1"><div class="h">Opción ${idx + 1} · ${cw.nombre}${sub}</div><p>${model.desc(cw)}</p><p class="muted">${model.nota ? model.nota(cw) : cw.nota}</p></div>
      <div class="b2">${swatch(cw.tela, 'Tela')}${swatch(cw.tinta, 'Tinta')}${swatch(cw.rib, 'Cuello y puños')}${swatch(cw.acento, 'Acento')}</div>
      <div class="b3"><b>Producción</b><p>${cw.tecnica}</p><div class="draft">Borrador para revisión del equipo · ${FECHA}</div></div>
    </div>
  </section>`;
}

function pageCover(model) {
  return `<section class="page cover">
    <div class="cv-top">${logo(P.blanco.hex, 120)}<div class="cv-meta">Borrador para revisión del equipo<br>${FECHA} · Revisa: [REVISOR — DATO A CONFIRMAR]</div></div>
    <div class="cv-k">CARIBA SOCIAL CLUB · FRANELA DEPORTIVA</div>
    <div class="cv-t">Modelo ${model.id}<br><span>${model.titulo}</span></div>
    <div class="cv-s">${model.sub}</div>
    <div class="cv-row">${COLORWAYS.map((cw, i) => `<div class="cv-it">${mockup(cw, true, model.art(cw), 315)}<div>Opción ${i + 1} · ${cw.nombre}${model.id === 2 ? ' — ' + PLAYAS[cw.id].titulo : ''}</div></div>`).join('')}</div>
  </section>`;
}

function pageSpecs(model) {
  const cw = COLORWAYS[0];
  return `<section class="page specs">
    <div class="sp-h">Ficha técnica · Modelo ${model.id} (${model.titulo})</div>
    <div class="sp-grid">
      <div class="sp-draw">
        <div class="dim">${mockup(cw, true, model.art(cw), 330)}
          <div class="ann" style="left:${ART.x * .66}px;top:${ART.y * .66}px;width:${ART.w * .66}px;height:${model.artH * ART.w / 600 * .66}px"></div>
          <div class="annt" style="left:262px;top:150px">Arte espalda<br><b>30 × 38 cm</b><br>a 7 cm del cuello</div>
          <div class="annt" style="left:150px;top:6px">Isotipo nuca · 2,5 cm</div>
        </div>
        <div class="dim">${mockup(cw, false, '', 330)}
          <div class="ann" style="left:136px;top:72px;width:56px;height:24px"></div>
          <div class="annt" style="left:206px;top:70px">Logo frente<br><b>9 cm de ancho</b><br>a 8 cm del cuello</div>
          <div class="annt" style="left:-6px;top:150px">Isotipo manga<br><b>3 cm</b></div>
        </div>
      </div>
      <div class="sp-txt">
        <table>
          <tr><th>Tela (recomendada)</th><td>Poliéster 100 % tipo <i>dry-fit</i> microperforado, 140–160 g/m², con paneles laterales en malla transpirable. Secado rápido. [Confirmar con proveedor]</td></tr>
          <tr><th>Corte</th><td>Deportivo regular, mangas raglán, cuello redondo en rib de contraste y puños de manga en color de contraste. Costuras planas (flatlock) para evitar roce.</td></tr>
          <tr><th>Frente</th><td>Logotipo <i>cariba</i> centrado en el pecho, 9 cm (mínimo del manual: 5 cm impreso) + isotipo de 3 cm en la manga (mínimo: 1 cm).</td></tr>
          <tr><th>Espalda</th><td>${model.espalda}</td></tr>
          <tr><th>Tipografía</th><td>Titulares: <b>Satoshi</b> (manual). En este boceto se usó <b>DM Sans ExtraBold</b> porque Satoshi no estaba disponible: sustituir en el arte final. Apoyo: DM Sans / Inter.<br>Acentos tomados de la inspiración (no están en el manual): <b>Pinyon Script</b> (caligráfica) y <b>Cormorant Garamond Italic</b> (serif) → requieren aprobación del equipo.</td></tr>
          <tr><th>Tallas</th><td>XS – XXL [DATO A CONFIRMAR: curva de tallas y cantidades]</td></tr>
        </table>
        <div class="pend"><b>Pendientes de validación</b><ul>
          <li>El logo de este boceto es una <b>representación</b> redibujada: usar el archivo oficial del logo para producción.</li>
          ${model.pend.map(p => `<li>${p}</li>`).join('')}
          <li>Pedir muestra física (prueba de color) al proveedor antes de producir: los colores en pantalla no son exactos; usar los códigos Pantone.</li>
          <li>Pantone y HEX del verde, rojo y lima tienen diferencias en el manual (no se usan en esta colección).</li>
        </ul></div>
        <div class="draft2">Borrador para revisión del equipo · ${FECHA} · Revisa: [REVISOR — DATO A CONFIRMAR]</div>
      </div>
    </div>
  </section>`;
}

const MODELS = [
  { id: 1, file: 'Cariba_Franela-Deportiva_Modelo-1_Valle-del-Espiritu-Santo.pdf', titulo: 'Valle del Espíritu Santo',
    sub: 'Tela deportiva · arte de espalda inspirado en la Basílica de la Virgen del Valle · 3 opciones de color',
    art: artVirgen, artH: 780,
    desc: () => 'Franela deportiva con el arte de la inspiración: logotipo en el pecho y, en la espalda, “Valle del Espíritu Santo” con la basílica en grabado de fondo.',
    espalda: '“CARIBA SOCIAL CLUB” + “Valle del Espíritu Santo” en mayúsculas bold con iniciales caligráficas, ilustración de la basílica en línea (≈35 % de opacidad), “Virgen del Valle” y la fecha.',
    pend: ['La fecha “8 de septiembre de 1911” se tomó de la imagen de inspiración: verificarla antes de imprimir.', 'Ilustración de la basílica: es un dibujo de línea simplificado para el boceto; para producción se recomienda una ilustración vectorial detallada.'] },
  { id: 2, file: 'Cariba_Franela-Deportiva_Modelo-2_Playas-de-Margarita.pdf', titulo: 'Playas de Margarita',
    sub: 'La misma franela deportiva del Modelo 1 con otro arte de espalda: playas de Margarita · 3 opciones',
    art: artPlaya, artH: 880,
    desc: (cw) => `Misma franela del Modelo 1 (tela, corte y frente idénticos). Cambia solo el arte de espalda: ${PLAYAS[cw.id].titulo}, ilustrada en línea al estilo grabado.`,
    espalda: 'Misma composición del Modelo 1: “CARIBA SOCIAL CLUB”, nombre de la playa en bold con iniciales caligráficas, ilustración (sol a rayas, mar, palmeras, velas o el fortín), “Isla de Margarita” y “Nueva Esparta · Venezuela”.',
    nota: (cw) => ({ A: 'Playa El Agua: palmeras, sol a rayas y oleaje. Azul sobre blanco con el sol en cian.', B: 'Juan Griego: el atardecer en amarillo detrás del Fortín de La Galera, sobre la tela azul.', C: 'El Yaque: velas de windsurf y una cometa de kitesurf. Azul sobre cian, con velas en blanco.' })[cw.id],
    pend: ['Elegir una sola playa o producir las tres como serie (Playa El Agua · Juan Griego · El Yaque).', 'Las ilustraciones son simplificadas para el boceto; validar con el ilustrador antes de producción.'] },
];

// ---------- HTML ----------
const CSS = `
@font-face{font-family:DMS;src:url('file://${FONTS}/DMSans[opsz,wght].ttf');font-weight:100 1000}
@font-face{font-family:Pinyon;src:url('file://${FONTS}/PinyonScript-Regular.ttf')}
@font-face{font-family:Corm;src:url('file://${FONTS}/CormorantGaramond-Italic[wght].ttf');font-weight:300 700;font-style:italic}
@page{size:297mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,sans-serif;color:#10069F}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;break-after:page}
.abs,.layer{position:absolute}
.layer{left:0;top:0;width:100%;height:auto}
.mock{position:relative}
.shadow{position:absolute;height:18px;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(10px)}
.art{position:relative;width:600px;height:760px}
.club{position:absolute;top:0;left:0;right:0;text-align:center;font:800 33px DMS;letter-spacing:-.5px}
.titles{position:absolute;left:0;right:0;top:150px}
.ln{display:flex;justify-content:center;align-items:baseline;line-height:.9;height:116px}
.bd{font-family:DMS;font-weight:800;letter-spacing:-3px;position:relative;z-index:2}
.sc{font-family:Pinyon;line-height:0;position:relative;z-index:1;font-weight:400}
.srf{position:absolute;left:0;right:0;top:580px;text-align:center;font:600 italic 44px Corm;letter-spacing:.5px}
.small{position:absolute;left:0;right:0;top:648px;text-align:center;font:700 19px DMS;letter-spacing:9px}
.tag{position:absolute;left:40px;top:26px;font:800 15px DMS;letter-spacing:2.5px}
.stage{position:absolute;left:0;right:0;top:62px;display:flex;justify-content:center;gap:90px}
.col{display:flex;flex-direction:column;align-items:center}
.lbl{margin-top:4px;font:700 12px DMS;letter-spacing:4px;opacity:.85}
.band{position:absolute;left:0;right:0;bottom:0;height:178px;background:#F5F6F7;display:flex;gap:28px;padding:20px 40px;font-size:11px;line-height:1.45;color:#1b1b2f}
.band .h{font:800 19px DMS;color:#10069F;margin-bottom:6px}
.band p{margin-bottom:6px}.muted{color:#55566a}
.b1{flex:1.25}.b2{flex:1.35;display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;align-content:start;padding-top:4px}.b3{flex:1.1}
.b3 b{font:800 13px DMS;color:#10069F;display:block;margin:2px 0 4px}
.sw{display:flex;gap:9px;align-items:center;font-size:10.5px;line-height:1.3}.sw b{font-family:DMS;color:#10069F}.sw span{color:#55566a}
.chip{width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,0,0,.18);flex:none}
.draft{margin-top:8px;display:inline-block;background:#10069F;color:#fff;font:700 9.5px Inter;padding:5px 9px;border-radius:20px;letter-spacing:.3px}
.cover{background:#10069F;color:#F5F6F7}
.cv-top{position:absolute;left:48px;right:48px;top:40px;display:flex;justify-content:space-between;align-items:flex-start}
.cv-meta{text-align:right;font-size:11px;line-height:1.5;opacity:.9}
.cv-k{position:absolute;left:48px;top:130px;font:800 14px DMS;letter-spacing:3px;color:#FFD300}
.cv-t{position:absolute;left:48px;top:156px;font:800 50px/1 DMS;letter-spacing:-1.5px}
.cv-t span{font:400 64px/1.15 Pinyon;letter-spacing:0;color:#00A9E0}
.cv-s{position:absolute;right:48px;top:200px;width:380px;text-align:right;font-size:14px;line-height:1.5;opacity:.92}
.cv-row{position:absolute;left:0;right:0;top:318px;display:flex;justify-content:center;gap:40px}
.cv-it{display:flex;flex-direction:column;align-items:center;font:700 11px DMS;letter-spacing:.5px;text-align:center;width:315px;gap:8px}
.specs{background:#F5F6F7;color:#1b1b2f}
.sp-h{position:absolute;left:40px;top:28px;font:800 24px DMS;color:#10069F}
.sp-grid{position:absolute;left:40px;right:40px;top:76px;bottom:28px;display:flex;gap:30px}
.sp-draw{flex:0 0 360px;display:flex;flex-direction:column;gap:6px;background:#10069F;border-radius:18px;padding:12px 15px;align-items:center}
.dim{position:relative;transform:scale(.88);transform-origin:top center;height:325px}
.ann{position:absolute;border:1.5px dashed #FFD300}
.annt{position:absolute;font:600 10px/1.3 Inter;color:#10069F;background:#FFD300;padding:3px 6px;border-radius:6px}
.sp-txt{flex:1;font-size:10.8px;line-height:1.45}
table{border-collapse:collapse;width:100%}
th{width:120px;text-align:left;vertical-align:top;font:800 11.5px DMS;color:#10069F;padding:6px 10px 6px 0;border-bottom:1px solid #dfe0ea}
td{padding:6px 0;border-bottom:1px solid #dfe0ea}
.pend{margin-top:12px;background:#fff;border-left:4px solid #FFD300;padding:9px 14px;border-radius:6px}
.pend b{font-family:DMS;color:#10069F}.pend ul{margin:4px 0 0 16px}
.draft2{margin-top:10px;font-weight:700;color:#10069F;font-size:10px}
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  if (PREV) fs.mkdirSync(PREV, { recursive: true });
  const browser = await chromium.launch();
  for (const m of MODELS) {
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
      ${pageCover(m)}${COLORWAYS.map((cw, i) => pageOption(m, cw, i)).join('')}${pageSpecs(m)}</body></html>`;
    const tmp = path.join(PREV || OUT, `modelo${m.id}.html`);
    fs.writeFileSync(tmp, html);
    const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
    await page.goto('file://' + tmp);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(OUT, m.file), width: '297mm', height: '210mm', printBackground: true });
    if (PREV) {
      const n = await page.$$eval('.page', p => p.length);
      const pages = await page.$$('.page');
      for (let i = 0; i < n; i++) await pages[i].screenshot({ path: path.join(PREV, `m${m.id}_p${i + 1}.png`) });
    } else fs.unlinkSync(tmp);
    await page.close();
    console.log('OK', m.file);
  }
  await browser.close();
})();
