/* vaso.ar
   Una obra por pantalla, corte seco entre obras.
   Carga: primero el póster de la obra que se ve, después los pósters vecinos,
   después el clip de la obra que se ve y recién entonces, de a uno y en orden de
   cercanía, los clips de las demás. Con conexión lenta se queda en imágenes fijas. */
(function () {
  'use strict';

  var D = window.VASO, M = window.MEDIOS || {};
  var raiz = document.documentElement;
  var portadaEl = document.getElementById('portada');
  var capaObras = document.getElementById('capaObras');
  var capaFicha = document.getElementById('capaFicha');
  var capaVideo = document.getElementById('capaVideo');

  var lang = leer('vaso-lang') === 'en' ? 'en' : 'es';
  var obras = D.obras.filter(function (o) { return !o.oculta; });   // «oculta: true» en contenido.js la saca
  var enPortada = obras;   // todas las obras, en el orden de contenido.js
  var porId = {};
  obras.forEach(function (o) { porId[o.id] = o; });

  var mqH = matchMedia('(min-aspect-ratio: 11/10)');
  var mqBaja = matchMedia('(min-aspect-ratio: 11/10) and (max-height: 520px)');
  var calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var embebe = /(^|\.)vaso\.ar$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
  // vaso.ar/?diag muestra qué decide el sitio en este equipo (ver «diagnóstico»).
  var diagActivo = /[?&]diag\b/.test(location.search), diagEventos = [];
  function diag(m) {
    if (!diagActivo) return;
    diagEventos.push((performance.now() / 1000).toFixed(1) + ' s  ' + m);
    if (diagEventos.length > 12) diagEventos.shift();
  }

  /* ------------------------------------------------------------ direcciones
     En vaso.ar cada obra tiene su dirección: vaso.ar/qomi/, la ficha en
     vaso.ar/qomi/ficha/ y el inglés debajo de vaso.ar/en/. Esas páginas las
     escribe herramientas/paginas.mjs (cambia solo la tarjeta que se ve al
     compartir el link); acá se lee la dirección y se la mantiene al día.
     En la vista previa y con el archivo abierto suelto, todo va después del #
     (#qomi, #ficha-qomi), como antes. */
  var carpetas = embebe && /^https?:$/.test(location.protocol);
  var RAIZ = new URL('./', document.baseURI).href;
  if (carpetas && !document.querySelector('base')) {
    // Fija la raíz: cuando cambia la dirección, media/… sigue apuntando a la raíz.
    var baseEl = document.createElement('base');
    baseEl.href = RAIZ;
    document.head.insertBefore(baseEl, document.head.firstChild);
  }
  function dec(x) { try { return decodeURIComponent(x); } catch (e) { return x; } }
  function sinAcentos(x) { return x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x; }
  // Lo que pide la dirección: { en, id, ficha, capa }. en es null si no lo dice.
  function leerDireccion() {
    var r = { en: null, id: null, ficha: false, capa: null };
    if (carpetas) {
      var raizRuta = new URL(RAIZ).pathname;
      var p = location.pathname.indexOf(raizRuta) === 0 ? location.pathname.slice(raizRuta.length) : '';
      var partes = sinAcentos(dec(p)).toLowerCase().split('/').filter(function (x) { return x && x !== 'index.html'; });
      r.en = partes[0] === 'en';
      if (r.en) partes.shift();
      if (porId[partes[0]]) { r.id = partes[0]; r.ficha = partes[1] === 'ficha'; }
    }
    // Lo que va después del #: la vista previa, los links viejos y las capas.
    var h = dec(location.hash.replace(/^#/, ''));
    var m = h.match(/^ficha-(.+)$/);
    if (m && porId[m[1]]) { r.id = m[1]; r.ficha = true; }
    else if (porId[h]) { r.id = h; r.ficha = false; }
    else if (h === 'obras' || h === 'contacto') r.capa = h;
    return r;
  }
  function direccion(id, ficha, capa) {
    if (!carpetas) return capa ? '#' + capa : id ? '#' + (ficha ? 'ficha-' + id : id) : location.href.split('#')[0];
    return RAIZ + (lang === 'en' ? 'en/' : '') + (id ? id + '/' + (ficha ? 'ficha/' : '') : '') + (capa ? '#' + capa : '');
  }
  function igual(url) { return new URL(url, location.href).href === location.href; }
  function ponerTitulo(id) { document.title = id && porId[id] ? porId[id].titulo + ' · ' + D.nombre : D.nombre + ' · ' + D.firma; }
  // Cambia la dirección. Sin push, no suma pasos al «Atrás» (pasar de obra en obra
  // no los suma; abrir una ficha, sí). El título va antes: Analytics lo toma con ella.
  function marcar(url, id, push, estado) {
    ponerTitulo(id);
    if (push) history.pushState(estado || null, '', url);
    else if (estado !== undefined || !igual(url)) history.replaceState(estado === undefined ? null : estado, '', url);
  }
  // La dirección /en/… pide inglés; si no lo dice, queda el idioma elegido antes.
  if (carpetas && leerDireccion().en) lang = 'en';
  // AV1 pesa menos, pero solo se usa si el equipo lo decodifica bien. En un
  // celular, además, tiene que ser por hardware: si no, H.264, que todos los
  // celulares decodifican por hardware. Si un clip AV1 falla, el equipo deja de
  // usarlo (queda anotado para las próximas visitas) y se pide el H.264.
  var tactil = matchMedia('(pointer: coarse)').matches;
  var fallidos = {};      // url del clip -> falló en este equipo: no se vuelve a pedir
  var av1 = leer('vaso-av1') !== 'no' && (function () {
    var v = document.createElement('video');
    return !!(v.canPlayType && v.canPlayType('video/mp4; codecs="av01.0.04M.08"'));
  })();
  var av1Info = leer('vaso-av1') === 'no' ? 'falló antes en este equipo' : av1 ? 'el navegador dice que sí' : 'el navegador no lo tiene';
  if (av1 && navigator.mediaCapabilities && navigator.mediaCapabilities.decodingInfo) {
    try {
      navigator.mediaCapabilities.decodingInfo({ type: 'file', video: { contentType: 'video/mp4; codecs="av01.0.04M.08"', width: 1280, height: 544, bitrate: 1000000, framerate: 24 } })
        .then(function (r) {
          av1Info = (r.supported ? 'decodifica' : 'no decodifica') + ' · fluido ' + (r.smooth ? 'sí' : 'no') + ' · por hardware ' + (r.powerEfficient ? 'sí' : 'no');
          if (!r.supported || !r.smooth || (tactil && !r.powerEfficient)) dejarAV1(false);
        }, function () {});
    } catch (e) { /* sin MediaCapabilities */ }
  }

  var orient = mqH.matches ? 'h' : 'v';
  var modo = null;        // 'normal' | 'liviano'
  var velocidad = 0;      // KB/s estimados
  var actual = 0;
  var slides = [];
  var blobs = {};         // url del clip -> objectURL ya descargado en segundo plano
  var listos = {};        // url del clip -> ya está entero en el buffer de su <video>
  var descarga = null;    // { url, ctrl, i, recibido, total } descarga en segundo plano en curso
  var ocupado = false;
  var modoDeclarado = false;   // el navegador pidió ahorrar datos: no se cambia solo

  /* ------------------------------------------------------------ utilidades */
  function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin storage */ } }
  function t(x) { return (x && typeof x === 'object') ? x[lang] : (x || ''); }
  function ui(k) { return D.ui[lang][k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function yt(id) { return 'https://www.youtube.com/watch?v=' + id; }
  function mb(bytes) { var n = bytes / 1048576; return (n < 1 ? n.toFixed(1) : n.toFixed(1)).replace('.', lang === 'es' ? ',' : '.') + ' MB'; }

  /* ---------------------------------------------------------------- medios */
  // Los videos de una obra. «medios» en contenido.js elige otro juego (Vialidad
  // puede usar «vialidad-2» o el anterior); si no está, es el de su id.
  function med(o) { return M[o.medios || o.id] || {}; }
  // Devuelve el juego de medios para la orientación actual, o el que haya.
  function grupo(o) {
    var m = med(o);
    return m[orient] || m.h || m.v || null;
  }
  // Una obra sin versión horizontal (Fiat) se muestra entera dentro del cuadro.
  function contener(o) { var m = med(o); return orient === 'h' && !m.h && !!m.v && !mosaico(o); }
  // Fiat: en horizontal, los cinco reels en fila en lugar del clip vertical chiquito.
  function mosaico(o) { return orient === 'h' && o.mosaicoHorizontal && o.ficha && o.ficha.reels; }
  function tieneVideo(o) { if (mosaico(o)) return false; var g = grupo(o); return !!(g && g.video && g.video.length); }

  function anchoCuadro() { var c = slides[actual] && slides[actual].cuadro; return c ? c.clientWidth : innerWidth; }
  // Elige el archivo de video: AV1 si el navegador lo decodifica, 1920 solo en
  // pantallas grandes con buena conexión.
  function fuente(o) {
    if (mosaico(o)) return null;
    var g = grupo(o);
    if (!g || !g.video || !g.video.length) return null;
    var lista = g.video.filter(function (v) { return !fallidos[v.src] && (av1 || v.codec !== 'av1'); });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var grandes = lista.filter(function (v) { return v.w >= 1900; });
    var ancho = anchoCuadro();
    if (!contener(o) && ancho >= 1100 && ancho * dpr > 1500) {
      var ga = av1 && grandes.filter(function (v) { return v.codec === 'av1'; })[0];
      if (ga && velocidad > 600) return ga;
      var gh = grandes.filter(function (v) { return v.codec === 'h264'; })[0];
      if (gh && velocidad > 2000) return gh;
    }
    var base = lista.filter(function (v) { return v.w < 1900; });
    return (av1 && base.filter(function (v) { return v.codec === 'av1'; })[0]) ||
      base.filter(function (v) { return v.codec === 'h264'; })[0] || base[0];
  }

  function htmlPicture(o, prioridad) {
    var m = med(o);
    var mH = '(min-aspect-ratio: 11/10)';
    function lista(g, ext) { return g.poster.map(function (p) { return 'media/' + p.archivo + '.' + ext + ' ' + p.w + 'w'; }).join(', '); }
    var s = '';
    var tamH = '(min-aspect-ratio: 11/10) 100vw, 100vw';
    var tamV = m.h ? '100vw' : '(min-aspect-ratio: 11/10) 40vw, 100vw';
    var base = m.v || m.h;
    if (m.h && m.v) {
      s += '<source media="' + mH + '" type="image/webp" srcset="' + lista(m.h, 'webp') + '" sizes="' + tamH + '">';
      s += '<source media="' + mH + '" srcset="' + lista(m.h, 'jpg') + '" sizes="' + tamH + '">';
    }
    s += '<source type="image/webp" srcset="' + lista(base, 'webp') + '" sizes="' + (m.h && !m.v ? tamH : tamV) + '">';
    var p0 = base.poster[0];
    return '<picture>' + s + '<img src="media/' + p0.archivo + '.jpg" srcset="' + lista(base, 'jpg') + '" sizes="' + (m.h && !m.v ? tamH : tamV) +
      '" alt="" decoding="async"' + (prioridad ? ' fetchpriority="high"' : '') + '></picture>';
  }

  /* --------------------------------------------------------------- portada */
  // Botones entre corchetes, como escritos a máquina. Los corchetes no se leen en voz alta.
  function corchetes(txt) { return '<span aria-hidden="true">[ </span>' + esc(txt) + '<span aria-hidden="true"> ]</span>'; }
  // En la portada no va «Ver película / sesión / videoclip…»: ese botón vive en la
  // carátula de la ficha, para no invitar a irse del sitio de entrada. Ahí la
  // ficha pasa a ser la acción principal.
  function htmlAcciones(o, conFicha, sinVer) {
    var h = '';
    var v = sinVer ? null : o.ver;
    if (sinVer && conFicha) h += '<button type="button" class="accion prima" data-ficha="' + o.id + '">' + corchetes(ui('ficha')) + '</button>';
    if (v) {
      if (v.ficha) h += '<button type="button" class="accion prima" data-ficha="' + o.id + '" data-seccion="' + (v.seccion || 'reels') + '">' + corchetes(t(v.texto)) + '</button>';
      else h += '<a class="accion prima" href="' + yt(v.yt) + '" target="_blank" rel="noopener" data-yt="' + v.yt + '">' + corchetes(t(v.texto)) + '</a>';
    }
    if (o.trailer && !sinVer) h += '<a class="accion" href="' + yt(o.trailer) + '" target="_blank" rel="noopener" data-yt="' + o.trailer + '">' + corchetes(ui('trailer')) + '</a>';   // el tráiler, también solo en la carátula
    if (conFicha && !sinVer) h += '<button type="button" class="accion" data-ficha="' + o.id + '">' + corchetes(ui('ficha')) + '</button>';
    return h;
  }
  // La línea de datos solo se corta en los «·»: «en desarrollo» no queda partido.
  function datosSinCortes(x) { return esc(x).split(' · ').map(function (p) { return p.replace(/ /g, '\u00a0'); }).join(' · '); }
  function htmlBanda(s) {
    var o = s.o;
    // El estado («en desarrollo») va en la línea de datos, a la derecha; la acotación queda para la ficha.
    // El título es un link a la ficha (como el botón [ FICHA ]).
    return '<div class="ident"><h2 class="titulo"><a href="' + esc(direccion(o.id, true)) + '" data-ficha="' + o.id + '">' + esc(o.titulo) + '</a></h2></div>' +
      '<div class="lado"><p class="datos">' + datosSinCortes(t(o.datos)) + '</p>' +
      '<div class="acciones">' + htmlAcciones(o, true, true) + '</div></div>';
  }

  function armarPortada() {
    portadaEl.innerHTML = '';
    slides = enPortada.map(function (o, i) {
      var el = document.createElement('section');
      el.className = 'obra';
      el.id = 'obra-' + o.id;
      el.setAttribute('aria-roledescription', 'obra');
      el.setAttribute('aria-label', o.titulo);
      el.hidden = true;
      // La imagen va dentro de «pelicula»: las transiciones pueden moverla por
      // dentro del cuadro, que queda quieto (los botones no se mueven).
      el.innerHTML = '<div class="cuadro"><div class="pelicula"><div class="lqip"></div><video muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video></div>' +
        '<button type="button" class="sonido" aria-pressed="false"></button>' +
        '<button type="button" class="volver" aria-label="' + esc(ui('anterior')) + '"><svg width="16" height="28" viewBox="0 0 16 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 1L2 14l13 13"/></svg></button>' +
        '<button type="button" class="seguir" aria-label="' + esc(ui('siguiente')) + '"><svg width="16" height="28" viewBox="0 0 16 28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l13 13L1 27"/></svg></button></div><div class="banda"></div>';
      portadaEl.appendChild(el);
      var s = { o: o, i: i, el: el, cuadro: el.querySelector('.cuadro'), video: el.querySelector('video'), banda: el.querySelector('.banda'),
        posterPedido: false, posterOk: false, fuente: null, completo: false };
      s.video.addEventListener('playing', function () { s.cuadro.classList.add('mueve'); });
      // El clip actual cuenta como cargado recién cuando está entero en el buffer:
      // así ningún clip vecino le compite el ancho de banda.
      var revisar = function () {
        if (!bufferCompleto(s.video)) return;
        if (s.fuente) listos[s.fuente] = true;
        if (s.i === actual && !s.completo) { s.completo = true; bombear(); }
      };
      s.video.addEventListener('progress', revisar);
      s.video.addEventListener('suspend', revisar);
      s.video.addEventListener('canplaythrough', revisar);
      // Si un clip falla, no se vuelve a pedir (antes se reintentaba sin fin y el
      // video no aparecía nunca). Si era AV1, el equipo pasa a H.264.
      s.video.addEventListener('error', function () {
        var src = s.fuente, err = s.video.error;
        if (!src) return;
        diag('ERROR ' + (err ? err.code : '?') + ' en ' + src.split('/').pop());
        fallidos[src] = true;
        s.completo = true; s.fuente = null;
        if (/\.av1\./.test(src) && av1) dejarAV1(true);
        else bombear();
      });
      return s;
    });
    slides.forEach(pintarSlide);
  }
  function pintarSlide(s) {
    var g = grupo(s.o);
    s.cuadro.classList.toggle('contener', contener(s.o));
    s.cuadro.classList.toggle('con-video', tieneVideo(s.o) && modo === 'normal' && !calma);
    s.cuadro.querySelector('.lqip').style.backgroundImage = g && g.lqip ? 'url("' + g.lqip + '")' : 'none';
    s.banda.innerHTML = htmlBanda(s);
  }
  function bufferCompleto(v) {
    try { return v.duration > 0 && v.buffered.length && v.buffered.end(v.buffered.length - 1) >= v.duration - 0.25; } catch (e) { return false; }
  }

  // Pide el póster de una obra (una sola vez). Llama a listo() al cargar o fallar.
  function asegurarPoster(s, prioridad, listo) {
    if (s.posterPedido) { if (listo) { if (s.posterOk) listo(s.img); else (s.esperanPoster = s.esperanPoster || []).push(listo); } return; }
    s.posterPedido = true;
    var tmp = document.createElement('div');
    tmp.innerHTML = mosaico(s.o)
      ? '<div class="mosaico">' + s.o.ficha.reels.map(function (r) { return '<img src="' + r.img + '" alt="" decoding="async">'; }).join('') + '</div>'
      : htmlPicture(s.o, prioridad);
    var pic = tmp.firstChild;
    s.img = pic.querySelector('img');
    var fin = function () {
      s.posterOk = true;
      [].forEach.call(pic.querySelectorAll('img'), function (im) { im.classList.add('ok'); });
      revaluar(s.img);
      var cbs = (s.esperanPoster || []).concat(listo ? [listo] : []);
      s.esperanPoster = null;
      cbs.forEach(function (cb) { cb(s.img); });
    };
    s.img.addEventListener('load', fin, { once: true });
    s.img.addEventListener('error', fin, { once: true });
    s.video.parentNode.insertBefore(pic, s.video);
    if (s.img.complete && s.img.naturalWidth) fin();
  }

  /* ------------------------------------------------------------- conexión */
  function conexionDeclarada() {
    var c = navigator.connection;
    // Ahorro de datos: lo pidió quien visita, no se cambia nunca.
    // 2G o 3G: es una estimación del navegador; si después mejora, se pasa a clips.
    if (c) {
      if (c.saveData) { modoDeclarado = true; return 'liviano'; }
      if (/(^|-)(2g|3g)$/.test(c.effectiveType || '')) return 'liviano';
      if (c.downlink) velocidad = Math.max(velocidad, c.downlink * 125);
    }
    if (matchMedia('(prefers-reduced-data: reduce)').matches) { modoDeclarado = true; return 'liviano'; }
    return null;
  }
  // Mide cuánto tardó en bajar el primer póster y decide el modo.
  // Lo que bajó un archivo. Chrome informa transferSize; Safari puede dar solo
  // encodedBodySize (o nada): se toma el primero que haya.
  function bytesDe(e) { return e ? (e.transferSize || e.encodedBodySize || e.decodedBodySize || 0) : 0; }
  function decidirModo(img) {
    if (modo) return;
    var declarado = conexionDeclarada();
    if (declarado) { modo = declarado; diag('modo ' + modo + (modoDeclarado ? ' (ahorro de datos del equipo)' : ' (el navegador estima 2G/3G)')); return; }
    // Se decide por la velocidad a la que bajó el póster, no por cuánto tardó la
    // página entera: en un celular, conectarse de cero ya lleva un par de segundos
    // y con una buena conexión 4G quedaba en fotos fijas. Además el póster es chico
    // (20 a 200 KB) y en él pesa más la demora de cada pedido que la velocidad, así
    // que la medición da de menos: solo fotos si da realmente lenta (~400 kbps).
    var url = img && (img.currentSrc || img.src);
    var e = url && performance.getEntriesByName(url)[0];
    var b = bytesDe(e);
    if (b > 6000 && e.responseEnd > e.responseStart) velocidad = Math.max(velocidad, b / (e.responseEnd - e.responseStart));
    modo = (velocidad && velocidad < 50) ? 'liviano' : 'normal';
    diag('modo ' + modo + ' (' + Math.round(velocidad) + ' KB/s)');
  }

  /* ---------------------------------------------------------------- carga */
  // Deja de usar AV1: lo que ya estaba en AV1 se vuelve a pedir en H.264.
  function dejarAV1(anotar) {
    if (!av1) return;
    av1 = false;
    if (anotar) guardar('vaso-av1', 'no');
    diag('AV1 desactivado' + (anotar ? ' (falló un clip)' : ''));
    Object.keys(blobs).forEach(function (u) { if (/\.av1\./.test(u)) { try { URL.revokeObjectURL(blobs[u]); } catch (e) {} delete blobs[u]; } });
    if (descarga && /\.av1\./.test(descarga.url)) { descarga.ctrl.abort(); descarga = null; ocupado = false; }
    slides.forEach(function (s) {
      if (s.fuente && /\.av1\./.test(s.fuente)) { s.fuente = null; s.completo = false; s.video.removeAttribute('src'); s.video.load(); s.cuadro.classList.remove('mueve'); }
      else if (!s.fuente) s.completo = false;
    });
    if (modo === 'normal' && !calma && slides.length) cargarActual();
  }
  function ponerVideo(s, src) {
    var v = s.video;
    if (v.getAttribute('src') !== src) { s.cuadro.classList.remove('mueve'); v.src = src; }
    v.preload = 'auto';
    reproducir(s);
  }
  // Reproduce con o sin sonido. Si el navegador no deja sonar, sigue mudo.
  function reproducir(s) {
    if (capaTapa()) return;   // detrás de la ficha o del video grande, el clip espera
    var v = s.video;
    v.muted = !(sonido && s.i === actual);
    var p = v.play();
    if (p && p.catch) p.catch(function (e) {
      diag('play() no arrancó: ' + (e && e.name));
      if (!v.muted) { v.muted = true; sonido = false; pintarSonido(); var q = v.play(); if (q && q.catch) q.catch(function () {}); }
    });
  }

  /* ---------------------------------------------------------------- sonido */
  var sonido = false;
  var ICONO_SI = '<svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 5.5h3.5L9 1.5v13l-4.5-4H1z" fill="currentColor"/><path d="M12.5 5a4 4 0 0 1 0 6M15 2.5a7.5 7.5 0 0 1 0 11"/></svg>';
  var ICONO_NO = '<svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 5.5h3.5L9 1.5v13l-4.5-4H1z" fill="currentColor"/><path d="M12.5 5.5l5 5M17.5 5.5l-5 5"/></svg>';
  // El parlante va en la esquina de cada cuadro. Con sonido queda casi transparente.
  function pintarSonido() {
    var html = (sonido ? ICONO_SI : ICONO_NO) + '<span class="vh">' + esc(ui(sonido ? 'silenciar' : 'escuchar')) + '</span>';
    [].forEach.call(document.querySelectorAll('.cuadro .sonido'), function (b) {
      b.innerHTML = html;
      b.setAttribute('aria-pressed', String(sonido));
      b.title = ui(sonido ? 'silenciar' : 'escuchar');
    });
  }
  function alternarSonido() {
    sonido = !sonido;
    pintarSonido();
    var s = slides[actual];
    if (s.video.getAttribute('src')) reproducir(s);
  }
  function cargarActual() {
    var s = slides[actual];
    var f = fuente(s.o);
    if (!f) { s.completo = true; bombear(); return; }
    s.fuente = f.src;
    if (blobs[f.src]) { s.completo = true; ponerVideo(s, blobs[f.src]); bombear(); return; }
    if (listos[f.src] && s.video.getAttribute('src') === f.src) { s.completo = true; ponerVideo(s, f.src); bombear(); return; }
    if (descarga) {
      // Si el clip que hace falta ya viene en camino y le falta poco, se espera.
      // Si no, se corta la descarga en segundo plano y se pide este primero.
      var avance = descarga.total ? descarga.recibido / descarga.total : 0;
      if (descarga.url === f.src && avance >= 0.5) return;
      descarga.ctrl.abort(); descarga = null; ocupado = false;
    }
    s.completo = false;
    diag('pide ' + f.src.split('/').pop());
    ponerVideo(s, f.src);
    // Si el navegador nunca confirma que terminó, la cola sigue a los 20 s.
    clearTimeout(s.reloj);
    s.reloj = setTimeout(function () { if (s.i === actual && !s.completo) { s.completo = true; bombear(); } }, 20000);
  }

  function cercanas() {
    var n = slides.length, r = [];
    for (var d = 1; d < n; d++) {
      [actual + d, actual - d].forEach(function (i) { i = (i % n + n) % n; if (i !== actual && r.indexOf(i) < 0) r.push(i); });
    }
    return r;
  }
  function distancia(i) { var n = slides.length, d = Math.abs(i - actual); return Math.min(d, n - d); }

  // La cola: de a una tarea, siempre empezando por lo más cercano a lo que se ve.
  function bombear() {
    if (ocupado || document.hidden || !modo) return;
    var s = slides[actual];
    if (!s.posterOk) return;
    var cola = cercanas();
    var conClips = modo === 'normal' && !calma;

    // 1) pósters de las obras vecinas
    for (var a = 0; a < cola.length; a++) {
      var i = cola[a];
      if (distancia(i) === 1 && !slides[i].posterPedido) { tarea(function (cb) { asegurarPoster(slides[i], false, cb); }); return; }
    }
    // 2) el clip de la obra que se ve
    if (conClips && !s.fuente && !s.completo && tieneVideo(s.o)) { cargarActual(); return; }
    if (conClips && s.fuente && !s.completo) return;
    // 3) los demás pósters, por cercanía
    for (var b = 0; b < cola.length; b++) {
      var j = cola[b];
      if (!slides[j].posterPedido && (conClips || distancia(j) <= 1)) { tarea(function (cb) { asegurarPoster(slides[j], false, cb); }); return; }
    }
    if (!conClips) return;
    // 4) los clips de las demás obras, por cercanía, en segundo plano
    for (var c = 0; c < cola.length; c++) {
      var k = cola[c];
      var f = fuente(slides[k].o);
      if (f && !blobs[f.src] && !listos[f.src]) { tarea(function (cb) { precargar(f.src, k, cb); }); return; }
    }
  }
  function tarea(fn) {
    ocupado = true;
    var hecho = false;
    var fin = function () { if (hecho) return; hecho = true; ocupado = false; setTimeout(bombear, 0); };
    fn(fin);
  }
  function precargar(url, i, fin) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var d = descarga = { url: url, ctrl: ctrl || { abort: function () {} }, i: i, recibido: 0, total: 0 };
    fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        d.total = +r.headers.get('content-length') || 0;
        if (!r.body || !r.body.getReader) return r.blob();
        // Se lee por partes para saber cuánto falta.
        var lector = r.body.getReader(), partes = [];
        var parte = function () {
          return lector.read().then(function (x) {
            if (x.done) return new Blob(partes, { type: 'video/mp4' });
            partes.push(x.value); d.recibido += x.value.length;
            return parte();
          });
        };
        return parte();
      })
      .then(function (b) {
        blobs[url] = URL.createObjectURL(b);
        if (descarga && descarga.url === url) descarga = null;
        var s = slides[actual];
        if (s.fuente === url) { s.completo = true; ponerVideo(s, blobs[url]); }
        fin();
      })
      .catch(function () { if (descarga && descarga.url === url) descarga = null; fin(); });
  }

  /* ------------------------------------------------------------ navegación */
  // Estadísticas (estadisticas.js): una obra cuenta como vista si queda 2 s en pantalla.
  function evento(nombre, datos) { if (window.vasoEvento) window.vasoEvento(nombre, datos); }
  var relojObra = null;
  function contarObra() {
    clearTimeout(relojObra);
    var id = slides[actual].o.id;
    relojObra = setTimeout(function () { if (slides[actual].o.id === id && !capaAbierta()) evento('ver_obra', { obra: id }); }, 2000);
  }

  // Transición entre obras: la que se va queda encima con la clase «sale» y la
  // nueva recibe «entra»; cómo se ven las define estilo.css (bloque «TRANSICIÓN
  // ENTRE OBRAS»). La salida termina sola cuando acaba su animación, dure lo que
  // dure. Si se pasa rápido de obra en obra, la salida anterior se corta en el acto.
  var saliente = null, relojSale = null, relojPasando = null, relojEntra = null;
  // Capa de vidrio para las transiciones que desenfocan toda la pantalla. Mientras
  // dura un cambio de obra, la raíz lleva la clase «pasando».
  var vidrio = document.createElement('div');
  vidrio.className = 'vidrio';
  vidrio.setAttribute('aria-hidden', 'true');
  document.body.appendChild(vidrio);
  function terminarSalida() {
    clearTimeout(relojSale);
    if (saliente) { saliente.el.removeEventListener('animationend', alTerminarAnimacion); saliente.el.classList.remove.apply(saliente.el.classList, ['sale'].concat(DIRECCIONES)); if (saliente.i !== actual) saliente.el.hidden = true; saliente = null; }
  }
  // Solo cuenta la animación de la obra misma, no la de algo de adentro (imagen,
  // datos) que termine antes.
  function alTerminarAnimacion(e) { if (e.target === e.currentTarget) terminarSalida(); }

  /* Cartel de aeropuerto: el título y el número de obra cambian letra por letra,
     como las paletas de los carteles de llegadas. Cada letra está partida al
     medio: la mitad de arriba cae y la de abajo de la letra siguiente baja a su
     lugar. Antes de la letra final pasan dos o tres al azar, y cada letra arranca
     un poco después que la anterior. Solo corre si la transición de estilo.css lo
     pide dentro del bloque «TRANSICIÓN ENTRE OBRAS»: --cartel: 1 para el título y
     el número, --cartel-numero: 1 para el número solo. */
  var carteles = [], relojCartel = 0;
  var LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', DIGITOS = '0123456789';
  function quiereCartel(nombre) { return getComputedStyle(raiz).getPropertyValue(nombre).trim() === '1' && !document.hidden; }
  // Ancho de cada letra tal como queda en el texto real (con su interletra y
  // sus ajustes entre pares), para que al terminar no se mueva nada.
  function anchosDe(el, texto) {
    el.textContent = texto;
    var nodo = el.firstChild, r = document.createRange(), pos = 0;
    return Array.from(texto).map(function (c) {
      if (!nodo) return 0;
      r.setStart(nodo, pos); r.setEnd(nodo, pos + c.length); pos += c.length;
      return r.getBoundingClientRect().width;
    });
  }
  // Ancho de cada letra posible, para elegir las que pasan al azar: tienen que
  // caber en su lugar, si no se pisan con las de al lado.
  function anchosLetras(el, letras) {
    var m = document.createElement('span'), r = {};
    m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    el.appendChild(m);
    Array.from(letras).forEach(function (c) { m.textContent = c; r[c] = m.getBoundingClientRect().width; });
    // Dónde está la línea de base dentro del renglón: el corte de las paletas va
    // a media altura de las minúsculas, no a media altura del renglón.
    m.innerHTML = 'x<span style="display:inline-block;width:0;height:0"></span>';
    var caja = m.getBoundingClientRect(), base = m.lastChild.getBoundingClientRect().bottom - caja.top;
    var cuerpo = parseFloat(getComputedStyle(el).fontSize);
    el.removeChild(m);
    return { ancho: r, corte: Math.max(0, Math.min(caja.height, base - cuerpo * 0.27)) };
  }
  function letraParaAncho(medidas, letras, w) {
    var buenas = Array.from(letras).filter(function (c) { var x = medidas.ancho[c]; return x <= w * 1.12 + 1 && x >= w * 0.6 - 1; });
    if (!buenas.length) buenas = Array.from(letras).sort(function (x, y) { return Math.abs(medidas.ancho[x] - w) - Math.abs(medidas.ancho[y] - w); }).slice(0, 4);
    return buenas[Math.floor(Math.random() * buenas.length)];
  }
  function cartel(el, viejo, nuevo, op) {
    var a = Array.from(viejo), b = Array.from(nuevo), n = Math.max(a.length, b.length);
    var wa = anchosDe(el, viejo), wb = anchosDe(el, nuevo);
    var medidas = anchosLetras(el, op.letras);
    var vista = document.createElement('span'), lector = document.createElement('span');
    vista.className = 'cartel'; vista.setAttribute('aria-hidden', 'true');
    vista.style.setProperty('--corte', medidas.corte.toFixed(1) + 'px');
    lector.className = 'solo-lector'; lector.textContent = nuevo;
    var palabra = null, paletas = [];
    for (var i = 0; i < n; i++) {
      var de = a[i] || '', va = b[i] || '', seq = [de], w0 = wa[i] || 0, w1 = wb[i] || 0;
      if (de !== va) {
        // Las del medio, cada una del ancho que tiene el lugar en ese momento
        // (el lugar va pasando del ancho de la letra vieja al de la nueva).
        var vueltas = op.vueltas[0] + Math.floor(Math.random() * (op.vueltas[1] - op.vueltas[0] + 1));
        for (var k = 1; k <= vueltas; k++) seq.push(letraParaAncho(medidas, op.letras, w0 + (w1 - w0) * suave(k / (vueltas + 1))));
        seq.push(va);
      }
      var el2 = document.createElement('span');
      el2.className = 'paleta';
      el2.innerHTML = '<span class="mitad arriba"></span><span class="mitad abajo"></span>\u00a0';
      // El título solo se puede cortar en renglones donde el nuevo tiene espacio.
      if (!palabra) { palabra = document.createElement('span'); palabra.className = 'palabra'; vista.appendChild(palabra); }
      palabra.appendChild(el2);
      if (va === ' ') { palabra = null; vista.appendChild(document.createElement('wbr')); }
      var p = { el: el2, arriba: el2.firstChild, abajo: el2.childNodes[1], seq: seq, w0: w0, w1: w1,
        inicio: op.demora + i * op.paso, giro: op.giro, txtA: null, txtB: null, rotA: null, rotB: null, ancho: null };
      pintarPaleta(p, -1);
      paletas.push(p);
    }
    el.textContent = '';
    el.appendChild(vista); el.appendChild(lector);
    var c = { paletas: paletas, t0: performance.now(), terminar: function () { el.textContent = nuevo; } };
    carteles.push(c);
    if (!relojCartel) relojCartel = requestAnimationFrame(moverCarteles);
  }
  function suave(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
  function ponerMitad(p, cual, texto, grados) {
    var m = p[cual], kt = cual === 'arriba' ? 'txtA' : 'txtB', kr = cual === 'arriba' ? 'rotA' : 'rotB';
    if (p[kt] !== texto) { m.textContent = texto; p[kt] = texto; }
    if (p[kr] !== grados) {
      p[kr] = grados;
      m.style.transform = grados ? 'rotateX(' + grados.toFixed(1) + 'deg)' : '';
      // La paleta que gira se oscurece al ponerse de canto, como con luz de arriba.
      m.style.opacity = grados ? (0.3 + 0.7 * Math.cos(grados * Math.PI / 180)).toFixed(3) : '';
    }
  }
  // Dibuja una paleta en el momento t (ms desde que arrancó el cartel). Devuelve
  // true cuando ya llegó a su letra final.
  function pintarPaleta(p, t) {
    var vueltas = p.seq.length - 1, tt = t - p.inicio, total = vueltas * p.giro;
    var listo = tt >= total, x = vueltas ? tt / p.giro : 0;
    var ancho = p.w0 + (p.w1 - p.w0) * (total ? suave(tt / total) : 1);
    if (p.ancho !== ancho) { p.ancho = ancho; p.el.style.width = ancho.toFixed(2) + 'px'; }
    if (listo || tt < 0) {
      var letra = p.seq[listo ? vueltas : 0];
      ponerMitad(p, 'arriba', letra, 0); ponerMitad(p, 'abajo', letra, 0);
      return listo;
    }
    var k = Math.floor(x), f = x - k;
    if (f < 0.5) {   // cae la mitad de arriba de la letra que estaba
      var g = f * 2;
      ponerMitad(p, 'arriba', p.seq[k], -90 * g * g);
      ponerMitad(p, 'abajo', p.seq[k], 0);
    } else {         // baja la mitad de abajo de la letra que sigue
      var h = 1 - (f - 0.5) * 2;
      ponerMitad(p, 'arriba', p.seq[k + 1], 0);
      ponerMitad(p, 'abajo', p.seq[k + 1], 90 * h * h);
    }
    return false;
  }
  function moverCarteles(ahora) {
    carteles = carteles.filter(function (c) {
      var t = Math.max(ahora, performance.now()) - c.t0, listo = true;
      c.paletas.forEach(function (p) { if (!pintarPaleta(p, t)) listo = false; });
      if (listo) c.terminar();
      return !listo;
    });
    relojCartel = carteles.length ? requestAnimationFrame(moverCarteles) : 0;
  }
  // Si se pasa de obra antes de que termine, el cartel anterior queda en su texto final.
  function cortarCarteles() {
    carteles.forEach(function (c) { c.terminar(); });
    carteles = [];
    if (relojCartel) { cancelAnimationFrame(relojCartel); relojCartel = 0; }
  }
  // eje: 'v' si el paso vino de un gesto vertical (trackpad o rueda hacia arriba o
  // abajo, deslizar el dedo hacia arriba o abajo, ↑ ↓); si no, de costado.
  var DIRECCIONES = ['adelante', 'atras', 'adelante-v', 'atras-v'];
  // seco: sin transición (lo usa el panel de Obras al pasar el mouse).
  function ir(i, sinHistoria, eje, seco) {
    var corte = calma || !!seco;
    var n = slides.length;
    // Hacia dónde va el paso (antes de dar la vuelta): lo usan las transiciones
    // que se mueven. A la siguiente: «adelante»; a la anterior: «atras»; con «-v»
    // si el gesto fue vertical.
    var dir = (i < actual ? 'atras' : 'adelante') + (eje === 'v' ? '-v' : '');
    i = (i % n + n) % n;
    var antes = slides[actual];
    var cambia = !!antes && i !== actual;
    if (cambia) {
      antes.video.pause();
      raiz.classList.add('ya-paso');
      terminarSalida();
      if (corte) antes.el.hidden = true;   // «reducir movimiento»: corte seco
      // Se le saca «entra» (si no, su animación de entrada pisa la de salida).
      else {
        saliente = antes; antes.el.classList.remove.apply(antes.el.classList, ['entra'].concat(DIRECCIONES)); antes.el.classList.add('sale', dir);
        antes.el.addEventListener('animationend', alTerminarAnimacion);
        relojSale = setTimeout(terminarSalida, 1000);   // por si una animación no avisa
      }
    }
    actual = i;
    var s = slides[i];
    s.el.hidden = false;
    if (cambia && !corte) {
      raiz.classList.remove('pasando'); void raiz.offsetWidth; raiz.classList.add('pasando');
      clearTimeout(relojPasando); relojPasando = setTimeout(function () { raiz.classList.remove('pasando'); }, 900);
    }
    if (cambia && !corte) {
      s.el.classList.remove.apply(s.el.classList, ['entra'].concat(DIRECCIONES)); void s.el.offsetWidth; s.el.classList.add('entra', dir);
      // Pasada la entrada se le saca la clase, así nada de lo que se redibuje
      // después (otro idioma, otra calidad) vuelve a animarse.
      clearTimeout(relojEntra);
      relojEntra = setTimeout(function () { s.el.classList.remove.apply(s.el.classList, ['entra'].concat(DIRECCIONES)); }, 1000);
    }
    var numEl = document.getElementById('numPagina');
    if (cambia) cortarCarteles();
    var tSale = cambia && antes.el.querySelector('.titulo'), tEntra = s.el.querySelector('.titulo');
    if (cambia && !calma && tSale && tEntra) {
      // Para las transiciones que mueven el título: --prof es la mitad de su alto
      // (la profundidad del prisma) y --cuerpo, en la caja que lo contiene, el
      // tamaño de su letra (la ranura del rodillo se mide con eso).
      [tSale, tEntra].forEach(function (t) {
        t.style.setProperty('--prof', (t.offsetHeight / 2).toFixed(1) + 'px');
        t.parentNode.style.setProperty('--cuerpo', getComputedStyle(t).fontSize);
      });
    }
    var conCartel = cambia && !corte && quiereCartel('--cartel');
    if (conCartel && tSale && tEntra) cartel(tEntra.querySelector('a') || tEntra, tSale.textContent, tEntra.textContent, { demora: 70, paso: 32, giro: 80, vueltas: [2, 3], letras: LETRAS });
    if (conCartel || (cambia && !corte && quiereCartel('--cartel-numero'))) cartel(numEl, numEl.textContent, (i + 1) + '.', { demora: 70, paso: 40, giro: 80, vueltas: [2, 3], letras: DIGITOS });
    else numEl.textContent = (i + 1) + '.';
    if (!sinHistoria) marcar(direccion(s.o.id), s.o.id);
    contarObra();
    asegurarPoster(s, true, null);
    if (modo === 'normal' && !calma) {
      if (s.fuente && (blobs[s.fuente] || s.video.getAttribute('src'))) {
        if (blobs[s.fuente] && s.video.getAttribute('src') !== blobs[s.fuente]) ponerVideo(s, blobs[s.fuente]);
        else reproducir(s);
      } else if (s.posterOk) cargarActual();
      else asegurarPoster(s, true, function () { if (s.i === actual) cargarActual(); });
    } else if (s.fuente) {
      reproducir(s);
    }
    bombear();
  }

  // Rueda o trackpad: un gesto = una obra.
  // El trackpad sigue mandando movimiento por inercia después de soltar los dedos.
  // Esa inercia siempre se va frenando; un gesto nuevo, en cambio, acelera. Por eso,
  // después de cambiar de obra se ignora lo que viene frenando y se acepta un gesto
  // nuevo apenas acelera (o después de una pausa), aunque la inercia no haya terminado.
  var ruedaBloqueada = false, ultimaRueda = 0, ultimoCambio = 0, ultimaFuerza = 0, acumulado = 0;
  addEventListener('wheel', function (e) {
    var escala = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    // En la ficha, la rueda baja la página como siempre; solo el gesto lateral
    // del trackpad pasa de una ficha a otra.
    if (!capaFicha.hidden && capaVideo.hidden) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.5) { acumulado = 0; return; }
      e.preventDefault();
      var pf = gesto(e.deltaX * escala);
      if (pf) pasarFicha(pf);
      return;
    }
    if (capaAbierta() || mqBaja.matches) return;
    e.preventDefault();
    var vertical = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
    var pp = gesto((vertical ? e.deltaY : e.deltaX) * escala);
    if (pp) ir(actual + pp, false, vertical ? 'v' : 'h');
  }, { passive: false });
  // Devuelve 1 o -1 cuando un gesto completa un paso; 0 mientras tanto.
  function gesto(d) {
    var fuerza = Math.abs(d);
    var ahora = performance.now();
    var pausa = ahora - ultimaRueda > 180;
    var acelera = fuerza > ultimaFuerza * 1.5 + 4;
    ultimaRueda = ahora; ultimaFuerza = fuerza;
    if (ruedaBloqueada) {
      if ((pausa || acelera) && ahora - ultimoCambio > 350) { ruedaBloqueada = false; acumulado = 0; }
      else return 0;
    }
    if (pausa) acumulado = 0;
    acumulado += d;
    if (Math.abs(acumulado) >= 40) {
      var paso = acumulado > 0 ? 1 : -1;
      ruedaBloqueada = true; ultimoCambio = ahora; acumulado = 0;
      return paso;
    }
    return 0;
  }

  var toque = null;
  portadaEl.addEventListener('touchstart', function (e) { var p = e.changedTouches[0]; toque = { x: p.clientX, y: p.clientY }; }, { passive: true });
  portadaEl.addEventListener('touchend', function (e) {
    if (!toque) return;
    var p = e.changedTouches[0], dx = p.clientX - toque.x, dy = p.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) ir(actual + (dx < 0 ? 1 : -1), false, 'h');
    else if (!mqBaja.matches && Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) ir(actual + (dy < 0 ? 1 : -1), false, 'v');
  }, { passive: true });

  // En la ficha, deslizar el dedo hacia un costado pasa a la ficha vecina.
  // Se ignoran los toques pegados al borde: ahí el celular usa su propio "atrás".
  var toqueF = null;
  capaFicha.addEventListener('touchstart', function (e) {
    var p = e.changedTouches[0];
    toqueF = (e.touches.length === 1 && p.clientX > 24 && p.clientX < innerWidth - 24) ? { x: p.clientX, y: p.clientY } : null;
  }, { passive: true });
  capaFicha.addEventListener('touchend', function (e) {
    if (!toqueF) return;
    var p = e.changedTouches[0], dx = p.clientX - toqueF.x, dy = p.clientY - toqueF.y;
    toqueF = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) pasarFicha(dx < 0 ? 1 : -1);
  }, { passive: true });
  capaFicha.addEventListener('touchcancel', function () { toqueF = null; }, { passive: true });

  addEventListener('keydown', function (e) {
    if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 'Escape') { if (!capaVideo.hidden) cerrarVideo(); else if (capaAbierta()) cerrarCapa(); return; }
    if (!capaFicha.hidden && capaVideo.hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); pasarFicha(e.key === 'ArrowRight' ? 1 : -1); return; }
    if (capaAbierta()) return;
    if (e.key === 'm' || e.key === 'M') { alternarSonido(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1, false, 'h'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1, false, 'h'); }
    else if (['ArrowDown', 'PageDown'].indexOf(e.key) >= 0 || (e.key === ' ' && e.target === document.body)) { e.preventDefault(); ir(actual + 1, false, 'v'); }
    else if (['ArrowUp', 'PageUp'].indexOf(e.key) >= 0) { e.preventDefault(); ir(actual - 1, false, 'v'); }
  });

  /* ---------------------------------------------------------------- capas */
  var abridor = null;
  var btnObras = document.getElementById('btnObras');
  function capaAbierta() { return !capaObras.hidden || !capaFicha.hidden || !capaVideo.hidden; }
  // Lo que tapa el video (la ficha, el video grande). El panel de Obras no: deja
  // la mitad izquierda a la vista y el clip sigue andando.
  function capaTapa() { return !capaFicha.hidden || !capaVideo.hidden; }
  // Detrás del panel, una capa transparente: tocar afuera lo cierra.
  var velo = document.createElement('div');
  velo.className = 'velo';
  velo.addEventListener('click', function () { cerrarCapa(); });
  capaObras.insertAdjacentElement('afterend', velo);
  function mostrarPanel() { capaObras.hidden = false; btnObras.setAttribute('aria-expanded', 'true'); }
  // El panel sube de vuelta al encabezado. Para eso se anima una copia: el panel
  // de verdad se oculta en el acto (el resto del sitio lo da por cerrado).
  function cerrarPanel() {
    if (capaObras.hidden) return;
    if (!calma) {
      var copia = capaObras.cloneNode(true);
      copia.removeAttribute('id');
      [].forEach.call(copia.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); });
      copia.setAttribute('aria-hidden', 'true');
      copia.classList.add('cierra');
      document.body.appendChild(copia);
      copia.scrollTop = capaObras.scrollTop;
      var fuera = function () { if (copia.parentNode) copia.parentNode.removeChild(copia); };
      copia.addEventListener('animationend', fuera);
      setTimeout(fuera, 500);
    }
    capaObras.hidden = true;
    btnObras.setAttribute('aria-expanded', 'false');
  }
  // Con el panel abierto, pasar el mouse por una obra de la lista salta a esa
  // obra en el acto, sin transición: se ve su video y su título. Un clic cierra
  // el panel y deja esa obra. Solo con mouse (en el celular, el toque elige).
  var conMouse = matchMedia('(hover: hover)'), relojHover = null;
  capaObras.addEventListener('mouseover', function (e) {
    if (!conMouse.matches) return;
    var f = e.target.closest('.fila');
    clearTimeout(relojHover);
    if (!f) return;
    var i = +f.getAttribute('data-ir');
    // Una pausa mínima: cruzar la lista en diagonal no salta por cada renglón.
    relojHover = setTimeout(function () { if (!capaObras.hidden && i !== actual) ir(i, false, 'h', true); }, 70);
  });
  function abrirCapa(capa, url, id) {
    abridor = document.activeElement;
    if (capa !== capaObras) cerrarPanel();
    if (capa !== capaFicha) capaFicha.hidden = true;
    if (capa === capaObras) mostrarPanel(); else capa.hidden = false;
    capa.scrollTop = 0;
    if (capaTapa()) slides[actual].video.pause();
    if (!igual(url)) marcar(url, id, true, { capa: 1 });
    var f = capa.querySelector('[data-cerrar]');
    if (f) f.focus({ preventScroll: true });
  }
  function cerrarCapa() {
    if (history.state && history.state.capa) { history.back(); return; }
    marcar(direccion(slides[actual].o.id), slides[actual].o.id, false, null);
    ocultarCapas();
  }
  function ocultarCapas() {
    var habia = capaAbierta();
    cerrarPanel(); capaFicha.hidden = true;
    if (habia) {
      var s = slides[actual];
      if (s.video.getAttribute('src')) reproducir(s);
      if (abridor && document.contains(abridor)) abridor.focus({ preventScroll: true });
    }
  }

  // Índice como guion de rodaje: cada obra es una escena numerada en los dos
  // márgenes, el título es el encabezado y los datos, la línea de acción.
  function accion(x) {
    // Cada dato queda entero en su renglón: solo se corta después de un punto.
    return x.split(' · ').map(function (p) { return (p.charAt(0).toUpperCase() + p.slice(1)).replace(/ /g, '\u00a0'); }).join('. ') + '.';
  }
  function htmlObras() {
    var fila = function (o) {
      var i = enPortada.indexOf(o);
      return '<a class="fila" href="' + esc(direccion(o.id)) + '" data-ir="' + i + '">' +
        '<span class="num" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="escena"><span class="t">' + esc(o.titulo) + '</span><span class="d">' + esc(accion(t(o.datos))) + '</span></span>' +
        '<span class="num" aria-hidden="true">' + (i + 1) + '</span><span class="rev" aria-hidden="true">*</span></a>';
    };
    // Solo las obras: el contacto está en la carátula de cada ficha.
    return '<div class="panel-barra"><button type="button" class="cerrar-x" data-cerrar aria-label="' + esc(ui('cerrar')) + '"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l10 10M11 1L1 11"/></svg></button></div>' +
      '<div class="capa-cuerpo">' +
      '<nav class="indice" aria-labelledby="tituloObras"><h2 class="solo-lector" id="tituloObras">' + esc(ui('principales')) + '</h2>' +
      obras.map(fila).join('') + '</nav></div>';
  }
  function abrirObras(contacto) {
    capaObras.innerHTML = htmlObras();
    // Encima de la obra que está en la dirección: vaso.ar/carrero/#obras
    abrirCapa(capaObras, location.href.split('#')[0] + '#' + (contacto ? 'contacto' : 'obras'), leerDireccion().id);
    if (contacto) { var k = document.getElementById('contacto'); if (k) k.scrollIntoView({ block: 'start' }); }
  }

  function agruparPremios(lista) {
    var r = [];
    lista.forEach(function (p) { var u = r[r.length - 1]; if (u && u.f === p[0]) u.l.push(p[1]); else r.push({ f: p[0], l: [p[1]] }); });
    return r;
  }
  function htmlFicha(o) {
    var f = o.ficha || {};
    var i = enPortada.indexOf(o);
    var c = D.contacto;
    var dl = (f.creditos || []).map(function (x) { return '<div><dt>' + esc(t(x[0])) + '</dt><dd>' + esc(t(x[1])) + '</dd></div>'; }).join('');
    var h = '<div class="capa-barra"><button type="button" data-cerrar>← ' + esc(ui('volver')) + '</button>' +
      '<span class="pagina"><button type="button" class="flecha" data-paso="-1" aria-label="' + esc(ui('fichaAnterior')) + '">‹</button>' +
      '<span>' + (i >= 0 ? (i + 1) + '.' : '') + '</span>' +
      '<button type="button" class="flecha" data-paso="1" aria-label="' + esc(ui('fichaSiguiente')) + '">›</button></span></div>' +
      '<div class="capa-cuerpo"><section class="caratula"><div class="caratula-centro">' +
      '<h1 id="tituloFicha">' + esc(o.titulo) + '</h1>' +
      (o.acotacion ? '<p>' + esc(t(o.acotacion)) + '</p>' : '') +
      (f.frase ? '<p class="frase">' + esc(t(f.frase)) + '</p>' : '<p>' + esc(t(f.linea)) + '</p>') +
      (f.credito ? '<p class="credito">' + esc(t(f.credito)) + '</p>' : '') +
      '<div class="acciones">' + (o.ver && !o.ver.ficha ? htmlAcciones(o, false) : '') + '</div></div>' +
      // Pie de la carátula: el contacto (con el mail y «Copiar», que copia el mail)
      // a un lado y el Instagram al otro.
      '<div class="caratula-pie"><p>' + esc(ui('contacto')) + '<br><a href="mailto:' + c.email + '">' + esc(c.email) + '</a>' +
      '<button type="button" class="accion copiar" data-copiar>' + corchetes(ui('copiar')) + '</button></p>' +
      '<button type="button" class="bajar" data-bajar aria-label="' + esc(ui('mas')) + '"><svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l13 13L27 1"/></svg></button>' +
      '<p class="nota"><a href="' + c.instagram.url + '" target="_blank" rel="noopener">Instagram ' + esc(c.instagram.usuario) + '</a></p></div></section>' +
      '<div class="detalle"><div class="dos"><div><h2 class="et">' + esc(ui('sinopsis')) + '</h2><p class="sinopsis">' + esc(t(f.sinopsis)) + '</p></div>' +
      (dl ? '<div><h2 class="et">' + esc(ui('creditos')) + '</h2><dl class="dl">' + dl + '</dl></div>' : '') + '</div>';
    if (f.premios) h += '<section><h2 class="et">' + esc(ui('premios')) + '</h2><div class="premios">' + agruparPremios(f.premios).map(function (g) {
      return '<div><b>' + esc(g.f) + '</b><ul>' + g.l.map(function (x) { return '<li>' + esc(t(x)) + '</li>'; }).join('') + '</ul></div>';
    }).join('') + '</div></section>';
    if (f.criticas) h += '<section><h2 class="et">' + esc(ui('criticas')) + '</h2><div class="criticas">' + f.criticas.map(function (x) {
      // Como diálogo de guion: quien escribe es el personaje, el medio la acotación.
      return '<blockquote class="critica"><cite class="quien">' + esc(x.autor) + '</cite><span class="medio">(' + esc(x.medio) + ')</span><p><q>' + esc(x.cita) + '</q></p></blockquote>';
    }).join('') + '</div></section>';
    if (f.piezas) h += '<section id="piezas"><h2 class="et">' + esc(ui('piezas')) + '</h2><div class="piezas">' + f.piezas.map(function (p) {
      return '<a class="pieza" href="' + yt(p.yt) + '" target="_blank" rel="noopener" data-yt="' + p.yt + '"><img src="media/yt-' + p.yt + '.jpg" alt="" loading="lazy" decoding="async"><span>' + esc(t(p.t)) + '</span></a>';
    }).join('') + '</div></section>';
    if (f.reels) h += '<section id="reels"><h2 class="et">' + esc(ui('reels')) + '</h2><div class="reels">' + f.reels.map(function (r, n) {
      return '<a href="' + r.url + '" target="_blank" rel="noopener" aria-label="Reel ' + (n + 1) + '"><img src="' + r.img + '" alt="" loading="lazy" decoding="async"></a>';
    }).join('') + '</div></section>';
    return h + '</div></div>';
  }
  function abrirFicha(id, seccion) {
    var o = porId[id];
    if (!o) return;
    var i = enPortada.indexOf(o);
    if (i >= 0 && i !== actual) ir(i, true);
    pintarFicha(o);
    abrirCapa(capaFicha, direccion(id, true), id);
    evento('abrir_ficha', { obra: id });
    if (seccion) { var sec = document.getElementById(seccion); if (sec) sec.scrollIntoView({ block: 'start' }); }
  }
  function pintarFicha(o) {
    capaFicha.innerHTML = htmlFicha(o);
    capaFicha.setAttribute('data-id', o.id);
    capaFicha.classList.remove('bajando');
  }
  // De una ficha a la otra, en el orden de la portada (corte seco, como allá).
  // La portada de abajo acompaña, así al volver quedás en la obra de la última ficha.
  function pasarFicha(paso, foco) {
    var o = porId[capaFicha.getAttribute('data-id')];
    var n = enPortada.length;
    var i = (enPortada.indexOf(o) + paso + n) % n;
    var nueva = enPortada[i];
    ir(i, true);
    slides[actual].video.pause();
    pintarFicha(nueva);
    capaFicha.scrollTop = 0;
    evento('abrir_ficha', { obra: nueva.id });
    marcar(direccion(nueva.id, true), nueva.id, false, history.state);
    if (foco) { var b = capaFicha.querySelector('[data-paso="' + paso + '"]'); if (b) b.focus({ preventScroll: true }); }
    else { var c = capaFicha.querySelector('[data-cerrar]'); if (c && capaFicha.contains(document.activeElement) === false) c.focus({ preventScroll: true }); }
  }

  // Video completo: en vaso.ar se abre dentro del sitio; en la vista previa, en YouTube.
  function abrirVideo(id) {
    capaVideo.innerHTML = '<div class="capa-barra"><button type="button" data-cerrar-video>' + esc(ui('cerrar')) + '</button><span></span></div>' +
      '<div class="marco-video"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe></div>';
    capaVideo.hidden = false;
    slides[actual].video.pause();
    capaVideo.querySelector('[data-cerrar-video]').focus();
  }
  function cerrarVideo() {
    capaVideo.hidden = true; capaVideo.innerHTML = '';
    if (!capaTapa()) { var s = slides[actual]; if (s.video.getAttribute('src')) reproducir(s); }
  }

  /* ------------------------------------------------------------------ clics */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a, button') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    if (el.hasAttribute('data-yt')) evento('ver_video', { obra: capaFicha.hidden ? slides[actual].o.id : capaFicha.getAttribute('data-id'), video: el.getAttribute('data-yt') });
    else if (/^mailto:/.test(href)) evento('contacto', { medio: 'mail' });
    else if (/instagram\.com/.test(href)) evento('contacto', { medio: 'instagram' });
    else if (el.hasAttribute('data-copiar')) evento('contacto', { medio: 'copiar_mail' });
    if (el.hasAttribute('data-cerrar')) { cerrarCapa(); return; }
    if (el.hasAttribute('data-cerrar-video')) { cerrarVideo(); return; }
    if (el.hasAttribute('data-lang')) { cambiarIdioma(); return; }
    if (el.hasAttribute('data-copiar')) { copiar(el); return; }
    if (el.hasAttribute('data-paso')) { pasarFicha(+el.getAttribute('data-paso'), true); return; }
    if (el.hasAttribute('data-bajar')) { var dt = capaFicha.querySelector('.detalle'); if (dt) dt.scrollIntoView({ behavior: calma ? 'auto' : 'smooth', block: 'start' }); return; }
    if (el.hasAttribute('data-ficha')) { e.preventDefault(); abrirFicha(el.getAttribute('data-ficha'), el.getAttribute('data-seccion')); return; }
    if (el.hasAttribute('data-ir')) { e.preventDefault(); var oi = enPortada[+el.getAttribute('data-ir')]; marcar(direccion(oi.id), oi.id, false, null); ocultarCapas(); ir(+el.getAttribute('data-ir')); return; }
    if (el.hasAttribute('data-yt') && embebe) { e.preventDefault(); abrirVideo(el.getAttribute('data-yt')); }
  });
  // Como en el sitio anterior: un clic en la imagen activa o silencia el sonido.
  portadaEl.addEventListener('click', function (e) {
    if (e.target.closest('.seguir')) { ir(actual + 1); return; }   // las flechas del celular
    if (e.target.closest('.volver')) { ir(actual - 1); return; }
    if (e.target.closest('.cuadro')) alternarSonido();
  });
  // Con el modo de bajo consumo del iPhone los clips no arrancan solos: el primer
  // toque en la pantalla (cualquiera) los pone en marcha.
  // Sigue escuchando hasta que algún clip arranque: si el primer toque llega
  // antes que el clip, el siguiente lo pone en marcha.
  function primerToque() {
    var s = slides[actual];
    if (!s || !s.video.getAttribute('src') || capaTapa()) return;
    if (!s.video.paused) { document.removeEventListener('touchend', primerToque, true); document.removeEventListener('click', primerToque, true); return; }
    reproducir(s);
  }
  document.addEventListener('touchend', primerToque, true);
  document.addEventListener('click', primerToque, true);
  // «vaso» lleva al comienzo: la primera obra, con la dirección de la portada (vaso.ar/).
  document.getElementById('firma').addEventListener('click', function () {
    ocultarCapas();
    ir(0, carpetas);
    if (carpetas) marcar(direccion(null), null, false, null);
  });
  // «Obras» abre el panel; si ya está abierto, lo cierra. (El contacto está al
  // final del panel y en la carátula de cada ficha: no va en el encabezado.)
  btnObras.setAttribute('aria-expanded', 'false');
  btnObras.addEventListener('click', function () { if (!capaObras.hidden) cerrarCapa(); else abrirObras(false); });
  document.getElementById('btnLang').addEventListener('click', cambiarIdioma);
  document.getElementById('btnAnt').addEventListener('click', function () { ir(actual - 1); });
  document.getElementById('btnSig').addEventListener('click', function () { ir(actual + 1); });

  function copiar(b) {
    var ok = function () { b.innerHTML = corchetes(ui('copiado')); };
    try { navigator.clipboard.writeText(D.contacto.email).then(ok, function () {}); } catch (x) { /* sin portapapeles */ }
  }

  function textosBarra() {
    raiz.lang = lang;
    document.getElementById('btnObras').textContent = ui('obras');
    var bl = document.getElementById('btnLang');
    pintarSonido();
    bl.textContent = ui('lang'); bl.setAttribute('aria-label', ui('langNombre')); bl.setAttribute('lang', lang === 'es' ? 'en' : 'es');
    document.getElementById('btnAnt').setAttribute('aria-label', ui('anterior'));
    document.getElementById('btnSig').setAttribute('aria-label', ui('siguiente'));
  }
  function cambiarIdioma() {
    lang = lang === 'es' ? 'en' : 'es';
    guardar('vaso-lang', lang);
    textosBarra();
    slides.forEach(function (s) { s.banda.innerHTML = htmlBanda(s); });
    if (!capaObras.hidden) capaObras.innerHTML = htmlObras();
    if (!capaFicha.hidden) { var fo = porId[capaFicha.getAttribute('data-id')]; if (fo) { var y = capaFicha.scrollTop; pintarFicha(fo); capaFicha.scrollTop = y; } }
    if (carpetas) { var r = leerDireccion(); marcar(direccion(r.id, r.ficha, r.capa), r.id, false, history.state); }
  }

  // Con conexión lenta, cada póster que llega es una nueva medición. Si la
  // conexión mejora, el sitio pasa solo a cargar los clips.
  function pasarAClips() {
    if (modo !== 'liviano' || modoDeclarado || calma) return;
    modo = 'normal';
    slides.forEach(pintarSlide);
    cargarActual();
  }
  if (navigator.connection && navigator.connection.addEventListener) {
    navigator.connection.addEventListener('change', function () {
      var c = navigator.connection;
      if (/4g/.test(c.effectiveType || '') && !c.saveData) pasarAClips();
    });
  }
  function revaluar(img) {
    if (modo !== 'liviano' || modoDeclarado || calma) return;
    var url = img && (img.currentSrc || img.src);
    var e = url && performance.getEntriesByName(url).pop();
    var b = bytesDe(e);
    if (!e || b < 6000 || e.responseEnd <= e.responseStart) return;
    var v = b / (e.responseEnd - e.responseStart);
    if (v >= 120) { velocidad = Math.max(velocidad, v); pasarAClips(); }
  }

  /* ------------------------------------------------------------------ rutas */
  function ruta() {
    var r = leerDireccion();
    // Pone en limpio la dirección: links viejos con #, mayúsculas, acentos y el
    // idioma elegido (un paso anterior del «Atrás» puede estar en el otro).
    if (carpetas) { var bien = direccion(r.id, r.ficha, r.capa); if (!igual(bien)) history.replaceState(history.state, '', bien); }
    ponerTitulo(r.id);
    if (r.ficha) {
      if (capaFicha.hidden || capaFicha.getAttribute('data-id') !== r.id) { pintarFicha(porId[r.id]); capaFicha.scrollTop = 0; cerrarPanel(); capaFicha.hidden = false; slides[actual].video.pause(); evento('abrir_ficha', { obra: r.id }); }
      var i0 = enPortada.indexOf(porId[r.id]);
      if (i0 >= 0 && i0 !== actual) ir(i0, true);
      return;
    }
    if (r.capa) {
      if (capaObras.hidden) {
        capaObras.innerHTML = htmlObras(); capaFicha.hidden = true; mostrarPanel();
      }
      return;
    }
    // Al volver de la ficha, la portada queda en la obra de la última ficha vista
    // (aunque hayas entrado por otra y pasado de ficha en ficha).
    var deFicha = !capaFicha.hidden;
    var i = r.id ? enPortada.indexOf(porId[r.id]) : (carpetas ? 0 : -1);   // vaso.ar/ es la primera obra
    if (deFicha && i >= 0 && i !== actual) { marcar(direccion(slides[actual].o.id), slides[actual].o.id); i = actual; }
    ocultarCapas();
    if (i >= 0 && i !== actual) ir(i, true);
  }
  addEventListener('popstate', ruta);
  // La flecha de la ficha se va apenas empezás a bajar.
  capaFicha.addEventListener('scroll', function () { capaFicha.classList.toggle('bajando', capaFicha.scrollTop > 40); }, { passive: true });

  /* ------------------------------------------------------------- orientación */
  function alCambiarOrientacion() {
    orient = mqH.matches ? 'h' : 'v';
    slides.forEach(function (s) {
      pintarSlide(s);
      // Fiat cambia de mosaico a clip (o al revés): se vuelve a pedir su imagen.
      if (s.o.mosaicoHorizontal && s.posterPedido) {
        var viejo = s.cuadro.querySelector('.mosaico, picture');
        if (viejo) viejo.remove();
        s.posterPedido = false; s.posterOk = false;
        if (s.i === actual) asegurarPoster(s, true, null);
      }
      if (s.fuente) {
        var f = fuente(s.o);
        if (f && f.src !== s.fuente) { s.fuente = null; s.completo = false; s.video.removeAttribute('src'); s.video.load(); s.cuadro.classList.remove('mueve'); }
      }
    });
    if (modo === 'normal' && !calma) cargarActual();
  }
  if (mqH.addEventListener) mqH.addEventListener('change', alCambiarOrientacion); else mqH.addListener(alCambiarOrientacion);

  document.addEventListener('visibilitychange', function () {
    var s = slides[actual];
    if (document.hidden) {
      s.video.pause();
      if (descarga) { descarga.ctrl.abort(); descarga = null; ocupado = false; }
    } else {
      if (s.video.getAttribute('src') && !capaTapa()) reproducir(s);
      bombear();
    }
  });

  /* ----------------------------------------------------------- diagnóstico
     vaso.ar/?diag muestra arriba qué decidió el sitio en este equipo (fotos o
     clips, AV1 o H.264) y qué pasa con el video de la obra que se ve. Sirve para
     revisar un celular sin cables: se abre así y se manda una captura. */
  function iniciarDiag() {
    var caja = document.createElement('pre');
    caja.style.cssText = 'position:fixed;left:6px;right:6px;top:48px;z-index:99;margin:0;padding:8px 10px;background:rgba(0,0,0,.85);color:#d8f0e0;font:11px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all;pointer-events:none';
    document.body.appendChild(caja);
    slides.forEach(function (s) {
      ['loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled'].forEach(function (ev) {
        s.video.addEventListener(ev, function () { if (s.i === actual) diag(ev); });
      });
    });
    setInterval(function () {
      var c = navigator.connection || {}, s = slides[actual], v = s.video;
      var q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null, src = v.getAttribute('src') || '';
      caja.textContent = [
        'modo: ' + (modo || 'decidiendo…') + (modoDeclarado ? ' (ahorro de datos del equipo)' : '') + ' · velocidad ' + Math.round(velocidad) + ' KB/s',
        'conexión: ' + (c.effectiveType || '?') + ' · ' + (c.downlink != null ? c.downlink + ' Mb/s' : '?') + ' · ahorro de datos: ' + (c.saveData ? 'SÍ' : 'no'),
        'AV1: ' + (av1 ? 'se usa' : 'no se usa') + ' (' + av1Info + ')',
        'clip: ' + (s.fuente ? s.fuente.split('/').pop() : '—') + (/^blob:/.test(src) ? ' (precargado)' : ''),
        'video: ' + (v.paused ? 'PAUSADO' : 'andando') + ' · listo ' + v.readyState + '/4 · red ' + v.networkState + ' · ' + v.currentTime.toFixed(1) + ' s' + (q ? ' · ' + q.totalVideoFrames + ' cuadros' : '') + (v.error ? ' · ERROR ' + v.error.code : ''),
        'pantalla: ' + innerWidth + '×' + innerHeight + ' ×' + (window.devicePixelRatio || 1) + ' · ' + (orient === 'h' ? 'horizontal' : 'vertical') + (tactil ? ' · táctil' : ''),
        navigator.userAgent.replace(/^Mozilla\/5\.0 /, ''),
        '—'
      ].concat(diagEventos).join('\n');
    }, 500);
  }

  /* ---------------------------------------------------------------- arranque */
  textosBarra();
  armarPortada();
  pintarSonido();
  if (diagActivo) iniciarDiag();
  (function inicio() {
    var r0 = leerDireccion();
    var i = r0.id ? enPortada.indexOf(porId[r0.id]) : -1;
    actual = i >= 0 ? i : 0;
    var s = slides[actual];
    s.el.hidden = false;
    document.getElementById('numPagina').textContent = (actual + 1) + '.';
    var decidido = false;
    var seguir = function (img) {
      if (decidido) return; decidido = true;
      decidirModo(img);
      slides.forEach(pintarSlide);
      bombear();
    };
    asegurarPoster(s, true, seguir);
    contarObra();
    // Si el póster no llegó en 8 s, la conexión es realmente lenta: fotos fijas.
    setTimeout(function () { if (!decidido) { modo = 'liviano'; seguir(null); } }, 8000);
    ruta();
  })();
})();
