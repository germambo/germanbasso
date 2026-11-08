/* Estadísticas de visitas: la misma propiedad de Google Analytics que usaba el
   sitio anterior (G-WHHCW3M805), así el historial sigue en el mismo lugar.

   - Solo cuenta en vaso.ar: las pruebas en la compu y las vistas previas no suman.
   - La librería de Google se pide recién cuando la página terminó de cargar,
     para no competir con el póster de la primera obra.
   - Además de las visitas, app.js avisa cuatro cosas (vasoEvento):
       ver_obra     una obra quedó en pantalla 2 s o más   { obra }
       abrir_ficha  se abrió una ficha                     { obra }
       ver_video    clic en Ver película, Tráiler o pieza  { obra, video }
       contacto     clic en el mail, Instagram o copiar    { medio }
*/
(function () {
  var ID = 'G-WHHCW3M805';
  window.vasoEvento = function () {};
  if (!/(^|\.)vaso\.ar$/.test(location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID);
  window.vasoEvento = function (nombre, datos) { gtag('event', nombre, datos || {}); };

  function cargar() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') cargar();
  else addEventListener('load', cargar);
})();
