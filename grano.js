/* Grano de cine para vaso.ar — capa sutil sobre el sitio, con panel de ajustes.
   - La textura (256 × 256 px) se genera en el navegador: no se descarga nada.
   - El movimiento es un desplazamiento de esa textura a saltos, hecho por la
     placa de video (transform). No hay código corriendo en cada cuadro.
   - Con "reducir movimiento" activado en el sistema, el grano queda quieto.
   El panel es provisorio: cuando elijas los valores, se fijan acá y se saca el panel. */
(function () {
  'use strict';

  var CLAVE = 'vaso-grano';
  // Valores elegidos por Germán (8/11/2026).
  var BASE = { activo: true, opacidad: 0.18, tamano: 0.5, contraste: 0.9, velocidad: 12, mezcla: 'overlay', color: false, alcance: 'todo' };
  var calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var p = Object.assign({}, BASE, leer());

  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) { /* sin storage */ } }

  /* --------------------------------------------------------------- estilos */
  var css = document.createElement('style');
  css.textContent =
    '#grano{position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden;opacity:var(--grano-op);mix-blend-mode:var(--grano-mezcla)}' +
    '#grano[hidden]{display:none}' +
    '#grano .tela,.grano-imagen .cuadro::after{position:absolute;inset:-128px;background-image:var(--grano-img);background-size:var(--grano-tam) var(--grano-tam);' +
    'background-repeat:repeat;animation:var(--grano-anim);will-change:transform}' +
    '.grano-imagen #grano{display:none}' +
    '.grano-imagen .cuadro::after{content:"";pointer-events:none;z-index:1;opacity:var(--grano-op);mix-blend-mode:var(--grano-mezcla)}' +
    '@keyframes vasoGrano{0%{transform:translate(0,0)}10%{transform:translate(-61px,37px)}20%{transform:translate(43px,-89px)}' +
    '30%{transform:translate(-97px,-23px)}40%{transform:translate(71px,83px)}50%{transform:translate(-29px,101px)}' +
    '60%{transform:translate(113px,-41px)}70%{transform:translate(-79px,-107px)}80%{transform:translate(17px,59px)}90%{transform:translate(91px,13px)}}' +
    '.btn-grano{margin-left:18px;margin-right:auto;color:#efe6d6;font-size:13px;opacity:.1;transition:opacity .3s}.btn-grano:hover,.btn-grano:focus-visible,.btn-grano[aria-expanded=true]{opacity:1}' +
    '.panel-grano{position:fixed;z-index:60;top:calc(var(--barra) + 8px);left:var(--g);width:min(340px,calc(100vw - 32px));max-height:calc(100svh - var(--barra) - 24px);overflow:auto;' +
    'background:#171310;border:1px solid rgba(239,230,214,.18);padding:16px;display:grid;gap:12px;font:400 13px/1.4 var(--mono);color:#efe6d6}' +
    '.panel-grano[hidden]{display:none}' +
    '.panel-grano label{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}' +
    '.panel-grano label.fila-check{grid-template-columns:auto 1fr}' +
    '.panel-grano input[type=range]{grid-column:1/-1;width:100%;accent-color:#f2de7b}' +
    '.panel-grano select{grid-column:1/-1;background:#0c0a08;color:#efe6d6;border:1px solid rgba(239,230,214,.25);padding:6px;font:inherit}' +
    '.panel-grano output{color:#a2967f;font-variant-numeric:tabular-nums}' +
    '.panel-grano pre{margin:0;white-space:pre-wrap;word-break:break-all;background:#0c0a08;padding:8px;color:#b5a991;font:inherit;font-size:12px}' +
    '.panel-grano .botones{display:flex;gap:16px;flex-wrap:wrap}' +
    '.panel-grano .botones button{text-decoration:underline;text-underline-offset:4px}' +
    '.panel-grano h2{margin:0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}';
  document.head.appendChild(css);

  /* ---------------------------------------------------------------- capa */
  var capa = document.createElement('div');
  capa.id = 'grano';
  capa.setAttribute('aria-hidden', 'true');
  capa.innerHTML = '<div class="tela"></div>';
  document.body.appendChild(capa);

  // Ruido de 256 × 256. El tamaño se maneja escalando la textura (queda suave, como grano).
  var cache = {};
  function textura() {
    var k = p.contraste + '|' + p.color;
    if (cache[k]) return cache[k];
    var n = 256, c = document.createElement('canvas');
    c.width = c.height = n;
    var x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
    // Suma de dos aleatorios: un ruido más parecido al grano que el blanco puro.
    var r = function () { return (Math.random() + Math.random()) - 1; };
    for (var i = 0; i < d.length; i += 4) {
      var g = 128 + r() * 127 * p.contraste;
      d[i] = p.color ? 128 + r() * 127 * p.contraste : g;
      d[i + 1] = p.color ? 128 + r() * 127 * p.contraste : g;
      d[i + 2] = p.color ? 128 + r() * 127 * p.contraste : g;
      d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return (cache[k] = 'url("' + c.toDataURL('image/png') + '")');
  }

  function aplicar() {
    var raiz = document.documentElement.style;
    raiz.setProperty('--grano-img', textura());
    raiz.setProperty('--grano-tam', Math.round(256 * p.tamano) + 'px');
    raiz.setProperty('--grano-op', p.activo ? p.opacidad : 0);
    raiz.setProperty('--grano-mezcla', p.mezcla);
    raiz.setProperty('--grano-anim', (p.velocidad > 0 && !calma) ? 'vasoGrano ' + (10 / p.velocidad).toFixed(3) + 's steps(1, end) infinite' : 'none');
    capa.hidden = !p.activo;
    document.documentElement.classList.toggle('grano-imagen', p.activo && p.alcance === 'imagen');
    var v = document.getElementById('granoValores');
    if (v) v.textContent = JSON.stringify(valores());
    guardar();
  }
  function valores() {
    return { activo: p.activo, opacidad: +p.opacidad, tamano: +p.tamano, contraste: +p.contraste, velocidad: +p.velocidad, mezcla: p.mezcla, color: p.color, alcance: p.alcance };
  }

  /* ---------------------------------------------------------------- panel */
  var firma = document.getElementById('firma');
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'btn-grano'; btn.id = 'btnGrano';
  btn.textContent = 'grano'; btn.setAttribute('aria-expanded', 'false');
  firma.insertAdjacentElement('afterend', btn);

  var panel = document.createElement('div');
  panel.className = 'panel-grano'; panel.id = 'panelGrano'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ajustes del grano');
  var opc = function (lista, val) { return lista.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join(''); };
  panel.innerHTML =
    '<h2>Grano de cine</h2>' +
    '<label class="fila-check"><input type="checkbox" id="gActivo"' + (p.activo ? ' checked' : '') + '> Activado</label>' +
    '<label for="gOpacidad">Opacidad <output id="oOpacidad"></output><input type="range" id="gOpacidad" min="0" max="0.4" step="0.005" value="' + p.opacidad + '"></label>' +
    '<label for="gTamano">Tamaño del grano <output id="oTamano"></output><input type="range" id="gTamano" min="0.5" max="4" step="0.1" value="' + p.tamano + '"></label>' +
    '<label for="gContraste">Contraste <output id="oContraste"></output><input type="range" id="gContraste" min="0.1" max="1" step="0.05" value="' + p.contraste + '"></label>' +
    '<label for="gVelocidad">Movimiento<select id="gVelocidad">' + opc([[0, 'Quieto'], [6, '6 cuadros por segundo'], [8, '8 cuadros por segundo'], [12, '12 cuadros por segundo'], [18, '18 cuadros por segundo'], [24, '24 cuadros por segundo']], p.velocidad) + '</select></label>' +
    '<label for="gMezcla">Mezcla<select id="gMezcla">' + opc([['overlay', 'Superponer (overlay)'], ['soft-light', 'Luz suave (soft-light)'], ['hard-light', 'Luz fuerte (hard-light)'], ['screen', 'Aclarar (screen)'], ['multiply', 'Oscurecer (multiply)'], ['normal', 'Normal']], p.mezcla) + '</select></label>' +
    '<label for="gAlcance">Dónde<select id="gAlcance">' + opc([['todo', 'Todo el sitio'], ['imagen', 'Solo sobre los videos']], p.alcance) + '</select></label>' +
    '<label class="fila-check"><input type="checkbox" id="gColor"' + (p.color ? ' checked' : '') + '> Grano de color (si no, blanco y negro)</label>' +
    '<div><p style="margin:0 0 6px;color:#a2967f">Valores para pasarme:</p><pre id="granoValores"></pre></div>' +
    '<div class="botones"><button type="button" id="gCopiar">Copiar valores</button><button type="button" id="gBase">Volver a los de base</button><button type="button" id="gCerrar">Cerrar</button></div>';
  document.body.appendChild(panel);
  // Que la rueda y las flechas dentro del panel no cambien de obra.
  panel.addEventListener('wheel', function (e) { e.stopPropagation(); }, { passive: true });
  panel.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Escape') cerrar(); });

  function q(id) { return document.getElementById(id); }
  function salidas() {
    q('oOpacidad').textContent = (+p.opacidad).toFixed(3);
    q('oTamano').textContent = (+p.tamano).toFixed(1) + '×';
    q('oContraste').textContent = (+p.contraste).toFixed(2);
  }
  function abrir() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); q('gActivo').focus(); }
  function cerrar() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
  btn.addEventListener('click', function () { if (panel.hidden) abrir(); else cerrar(); });
  q('gCerrar').addEventListener('click', cerrar);
  q('gActivo').addEventListener('change', function (e) { p.activo = e.target.checked; aplicar(); });
  q('gColor').addEventListener('change', function (e) { p.color = e.target.checked; aplicar(); });
  [['gOpacidad', 'opacidad'], ['gTamano', 'tamano'], ['gContraste', 'contraste']].forEach(function (par) {
    q(par[0]).addEventListener('input', function (e) { p[par[1]] = +e.target.value; salidas(); aplicar(); });
  });
  q('gVelocidad').addEventListener('change', function (e) { p.velocidad = +e.target.value; aplicar(); });
  q('gMezcla').addEventListener('change', function (e) { p.mezcla = e.target.value; aplicar(); });
  q('gAlcance').addEventListener('change', function (e) { p.alcance = e.target.value; aplicar(); });
  q('gBase').addEventListener('click', function () {
    p = Object.assign({}, BASE);
    q('gActivo').checked = p.activo; q('gColor').checked = p.color;
    q('gOpacidad').value = p.opacidad; q('gTamano').value = p.tamano; q('gContraste').value = p.contraste;
    q('gVelocidad').value = p.velocidad; q('gMezcla').value = p.mezcla; q('gAlcance').value = p.alcance;
    salidas(); aplicar();
  });
  q('gCopiar').addEventListener('click', function (e) {
    var b = e.currentTarget, txt = JSON.stringify(valores());
    var ok = function () { b.textContent = 'Copiados'; setTimeout(function () { b.textContent = 'Copiar valores'; }, 1500); };
    var sel = function () { var r = document.createRange(); r.selectNodeContents(q('granoValores')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(txt).then(ok, sel); } catch (x) { sel(); }
  });

  salidas();
  aplicar();
})();
