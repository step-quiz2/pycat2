(function () {
  // Mode embed (iframes del curs): no mostrem el footer per no saturar l'UI.
  try {
    if (new URLSearchParams(window.location.search).get('embed') === '1') return;
  } catch (e) { /* ignore */ }

  // Detecta si estem dins de la carpeta curs/ o a l'arrel
  var isCurs = window.location.pathname.includes('/curs/');
  var root = isCurs ? '../' : '';

  // Estils del footer
  var style = document.createElement('style');
  style.textContent = [
    // Footer floating: sempre visible a la part inferior
    '.pycat-footer {',
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
    '.pycat-footer a {',
    '  color: inherit;',
    '}',
    // Afegim padding-bottom al layout perquè el footer floating no tapi contingut
    '.main {',
    '  padding-bottom: 44px;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // HTML del footer — modifica aquí per canviar el text.
  // Llicència: vegeu LICENSE i LLICENCIA.md (contingut CC BY-NC-SA 4.0, codi MIT).
  var footer = document.createElement('footer');
  footer.className = 'pycat-footer';
  footer.innerHTML =
    '<span>© 2026 <strong>David Arso Civil</strong> · INS Miquel Tarradell.</span>' +
    '<span>Contingut: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ca" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>' +
    ' · Codi: <a href="' + root + 'LICENSE" target="_blank" rel="noopener">llicència MIT</a></span>';

  document.body.appendChild(footer);
})();
