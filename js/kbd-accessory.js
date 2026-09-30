// ════════════════════════════════════════════════════════
// kbd-accessory.js — Teclat virtual per a mòbils
//
// Mostra una barra fixa amb tecles Python comuns quan
// l'editor té el focus en un dispositiu tàctil.
// S'amaga en mode embed (iframes petits del curs).
//
// Depèn de: P.updateEditor()
// ════════════════════════════════════════════════════════

(function() {

  // ── Detecció de dispositiu tàctil ──────────────────────
  // Creem l'accessori si hi ha capacitat tàctil.
  // Usem matchMedia com a detecció primària (més fiable que ontouchstart).
  var isTouch = ('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (!isTouch) return;

  // ── No mostrar en mode embed ───────────────────────────
  if (document.body.classList.contains('embed')) return;

  // ── Tecles disponibles ─────────────────────────────────
  // Agrupades visualment amb separadors (null = separador)
  var KEYS = [
    '(', ')',  '[', ']',  '{', '}',
    null,
    '"', "'",  ':',  '#',  '_',
    null,
    '=', '+', '-', '*', '/', '%',
    null,
    '<', '>',  '!',
  ];

  // ── Crea el DOM ────────────────────────────────────────
  var bar = document.createElement('div');
  bar.className = 'kbd-bar';
  bar.id = 'kbd-bar';
  bar.setAttribute('aria-label', 'Tecles ràpides');

  var scroll = document.createElement('div');
  scroll.className = 'kbd-scroll';

  for (var i = 0; i < KEYS.length; i++) {
    var k = KEYS[i];
    if (k === null) {
      var sep = document.createElement('span');
      sep.className = 'kbd-sep';
      scroll.appendChild(sep);
      continue;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kbd-key';
    btn.textContent = k;
    btn.setAttribute('data-char', k);
    btn.setAttribute('aria-label', 'Insereix ' + k);
    // Prevé que el botó prengui el focus (cosa que tancaria el teclat del sistema)
    btn.addEventListener('mousedown', _preventDefault);
    btn.addEventListener('touchstart', _preventDefault);
    btn.addEventListener('pointerdown', _preventDefault);
    btn.addEventListener('click', _onKeyClick);
    scroll.appendChild(btn);
  }

  bar.appendChild(scroll);
  document.body.appendChild(bar);

  // ── Mostra/amaga quan l'editor té/perd el focus ────────
  var ta = document.getElementById('code-editor');
  if (!ta) return;

  ta.addEventListener('focus', function() {
    bar.classList.add('visible');
    // Afegeix padding inferior al body perquè res no quedi tapat
    document.body.classList.add('kbd-active');
  });

  ta.addEventListener('blur', function() {
    // Petit delay: si el blur ve d'un clic a la barra,
    // el click handler necessita executar-se primer.
    setTimeout(function() {
      if (document.activeElement !== ta) {
        bar.classList.remove('visible');
        document.body.classList.remove('kbd-active');
      }
    }, 150);
  });

  // ── Handlers ───────────────────────────────────────────

  function _preventDefault(e) {
    e.preventDefault();  // Evita que el botó prengui el focus
  }

  function _onKeyClick(e) {
    var ch = e.currentTarget.getAttribute('data-char');
    if (!ch || !ta) return;

    var start = ta.selectionStart;
    var end   = ta.selectionEnd;

    // Insereix el caràcter a la posició del cursor
    ta.value = ta.value.substring(0, start) + ch + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + ch.length;

    // Actualitza el ressaltat i guarda a localStorage
    P.updateEditor();

    // Retorna el focus a l'editor
    ta.focus();
  }

})();
