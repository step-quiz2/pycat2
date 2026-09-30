(function () {
  // Mode embed (iframes del curs): no mostrem el footer per no saturar l'UI.
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') return;
  } catch (e) { /* ignore */ }

  // Detecta si estem dins de la carpeta curs/ o a l'arrel
  var isCurs = window.location.pathname.includes('/curs/');
  var imgPath = isCurs ? '../img/cc-by-nc-nd.png' : 'img/cc-by-nc-nd.png';

  // Estils del footer
  var style = document.createElement('style');
  style.textContent = [
    // Footer floating: sempre visible a la part inferior
    '.karel-footer {',
    '  position: fixed;',
    '  bottom: 0;',
    '  left: 0;',
    '  right: 0;',
    '  z-index: 200;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 8px;',
    '  padding: 6px 16px;',
    '  border-top: 1px solid #ddd;',
    '  font-family: system-ui, sans-serif;',
    '  font-size: 0.78rem;',
    '  color: #555;',
    '  text-align: center;',
    '  flex-wrap: wrap;',
    '  line-height: 1.4;',
    '  background: var(--bg, #fff);',
    '}',
    '.karel-footer img {',
    '  height: 22px;',
    '  width: auto;',
    '  flex-shrink: 0;',
    '}',
    '.karel-footer a {',
    '  color: inherit;',
    '}',
    // Afegim padding-bottom al layout perquè el footer floating no tapi contingut
    '.main {',
    '  padding-bottom: 44px;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // HTML del footer — modifica aquí per canviar el text
  var footer = document.createElement('footer');
  footer.className = 'karel-footer';
  footer.innerHTML =
    '<img src="' + imgPath + '" alt="CC BY-NC-ND 4.0">' +
    '<span>' +
    '© 2026 <strong>[DAVID ARSO CIVIL]</strong>. ' +
    'Ús educatiu lliure. Prohibida la comercialització i la modificació ' +
    '(<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/" target="_blank">CC BY-NC-ND 4.0</a>).' +
    '</span>';

  document.body.appendChild(footer);
})();
