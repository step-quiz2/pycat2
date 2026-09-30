// ════════════════════════════════════════════════════════
// curs/capitols.js — Dades dels capítols i helpers de UI
//
// Funcions exportades al window global (idèntic a KarelCat):
//   initCursPage()             — esquelet comú (capçalera, barra lateral,
//                                navegació); s'executa sol en carregar-se
//   injectCursLogo()           — pobla .logo-icon
//   renderSidebar(currentNum)  — omple #sidebar-nav (amb ✓ de progrés)
//   renderReptesSidebar(num)   — sidebar pels reptes (amb ✓ de progrés)
//   renderSimuladors()         — converteix .simulador → iframes
//   initSidebarToggle()        — hamburger mòbil
//   initGlossariCurs()         — glossari modal
//
// Dependència: glossari-data.js (ha de carregar-se ABANS)
// ════════════════════════════════════════════════════════


// ── Logo ─────────────────────────────────────────────────
function injectCursLogo() {
  document.querySelectorAll('.logo-icon').forEach(function(el) {
    if (!el.innerHTML.trim()) el.innerHTML = '<img class="logo-img" src="../img/logo.svg" alt="" width="22" height="22">';
  });
}


// ── Dades dels capítols ──────────────────────────────────
// ESCALAR: afegir capítols aquí i crear el fitxer HTML corresponent.
// goalId: identificador del repte d'exercici del capítol (null si no en té).

var CAPITOLS_DATA = [
  { num: 1,  titol: 'Hola, Python!',              arxiu: 'capitol-1.html',  goalId: 'cap-1-ex' },
  { num: 2,  titol: 'Variables',                   arxiu: 'capitol-2.html',  goalId: 'cap-2-ex' },
  { num: 3,  titol: 'Operacions i input',          arxiu: 'capitol-3.html',  goalId: 'cap-3-ex' },
  { num: 4,  titol: 'Decisions: if, elif, else',   arxiu: 'capitol-4.html',  goalId: 'cap-4-ex' },
  { num: 5,  titol: 'Repetir amb while',           arxiu: 'capitol-5.html',  goalId: 'cap-5-ex' },
  { num: 6,  titol: 'Repetir amb for i range',     arxiu: 'capitol-6.html',  goalId: 'cap-6-ex' },
  { num: 7,  titol: 'Treballant amb text',         arxiu: 'capitol-7.html',  goalId: 'cap-7-ex' },
  { num: 8,  titol: 'Llistes',                     arxiu: 'capitol-8.html',  goalId: 'cap-8-ex' },
  { num: 9,  titol: 'Funcions',                    arxiu: 'capitol-9.html',  goalId: 'cap-9-ex' },
  { num: 10, titol: 'Diccionaris',                 arxiu: 'capitol-10.html', goalId: 'cap-10-ex' },
  { num: 11, titol: 'Posant-ho tot junt',          arxiu: 'capitol-11.html', goalId: null },
  { num: 12, titol: '4 en ratlla',                  arxiu: 'capitol-12.html', goalId: null },
  { num: 13, titol: 'Dibuixa amb la tortuga',      arxiu: 'capitol-13.html', goalId: 'cap-13-parsons' },
  // ...afegir capítols aquí
];

var REPTES_DATA = [
  { num: 1,  titol: 'El primer programa',       arxiu: 'repte-1.html',  goalId: 'repte-1' },
  { num: 2,  titol: 'Presenta\'t',              arxiu: 'repte-2.html',  goalId: 'repte-2' },
  { num: 3,  titol: 'La calculadora',     arxiu: 'repte-3.html',  goalId: 'repte-3' },
  { num: 4,  titol: 'Anys, mesos, dies',         arxiu: 'repte-4.html',  goalId: 'repte-4' },
  { num: 5,  titol: 'Canvi de moneda',           arxiu: 'repte-5.html',  goalId: 'repte-5' },
  { num: 6,  titol: 'Parell o senar',            arxiu: 'repte-6.html',  goalId: 'repte-6' },
  { num: 7,  titol: 'El més gran de tres',       arxiu: 'repte-7.html',  goalId: 'repte-7' },
  { num: 8,  titol: 'Compte enrere',             arxiu: 'repte-8.html',  goalId: 'repte-8' },
  { num: 9,  titol: 'Taula multiplicar',   arxiu: 'repte-9.html',  goalId: 'repte-9' },
  { num: 10, titol: 'Comptar paraules',          arxiu: 'repte-10.html', goalId: 'repte-10' },
  { num: 11, titol: 'La funció saluda',           arxiu: 'repte-11.html', goalId: 'repte-11' },
  { num: 12, titol: 'Paraula al revés',          arxiu: 'repte-12.html', goalId: 'repte-12' },
  { num: 13, titol: 'La mitjana',                arxiu: 'repte-13.html', goalId: 'repte-13' },
  { num: 14, titol: 'És palíndrom?',             arxiu: 'repte-14.html', goalId: 'repte-14' },
  { num: 15, titol: 'FizzBuzz',                  arxiu: 'repte-15.html', goalId: 'repte-15' },
];


// ── Sistema de progrés ───────────────────────────────────
// Guarda a localStorage un objecte { goalId: true, ... }

var _LS_KEY = 'pycat_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(_LS_KEY) || '{}');
  } catch(_) { return {}; }
}

function saveGoalCompleted(goalId) {
  if (!goalId) return;
  var p = getProgress();
  if (p[goalId]) return;  // ja guardat
  p[goalId] = true;
  try { localStorage.setItem(_LS_KEY, JSON.stringify(p)); } catch(_) {}
}

function isGoalCompleted(goalId) {
  if (!goalId) return false;
  return !!getProgress()[goalId];
}


// ── Sidebar: capítols ────────────────────────────────────

function renderSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Capítols</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < CAPITOLS_DATA.length; i++) {
    var c = CAPITOLS_DATA[i];
    var isActive = c.num === currentNum;
    var check = (c.goalId && progress[c.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + c.arxiu + '">' +
        check + c.num + '. ' + c.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}

// ── Sidebar: reptes ──────────────────────────────────────

function renderReptesSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Reptes</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < REPTES_DATA.length; i++) {
    var r = REPTES_DATA[i];
    var isActive = r.num === currentNum;
    var check = (r.goalId && progress[r.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + r.arxiu + '">' +
        check + 'Repte ' + r.num + ': ' + r.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}


// ── Renderitzador de simuladors incrustats ────────────────

// Clau de localStorage per al codi del simulador núm. `idx` d'aquesta pàgina
function _saveKey(idx) {
  var page = location.pathname.split('/').pop() || 'index.html';
  return 'pycat-code:' + page + ':' + idx;
}

function renderSimuladors() {
  document.querySelectorAll('.simulador').forEach(function(div, idx) {
    var hasCode  = div.hasAttribute('data-code');
    var code     = div.getAttribute('data-code') || '';
    var readonly = div.getAttribute('data-readonly') === 'true';
    var height   = div.getAttribute('data-height') || '320';
    var stdin    = div.getAttribute('data-stdin') || '';
    var expected = div.getAttribute('data-expected') || '';
    var tests    = div.getAttribute('data-tests') || '';
    var testcode = div.getAttribute('data-testcode') || '';
    var goalId   = div.getAttribute('data-goal-id') || '';
    var requires = div.getAttribute('data-requires') || '';
    var interactive = div.getAttribute('data-interactive') === 'true';

    var params = new URLSearchParams();
    params.set('embed', '1');
    params.set('theme', 'light');

    // El codi es passa sempre que hi hagi l'atribut (encara que sigui buit):
    // si no, el simulador hi posaria el codi per defecte «Hola, món!».
    if (hasCode)  params.set('code', btoa(unescape(encodeURIComponent(code))));
    if (readonly) params.set('readonly', '1');
    else          params.set('save', _saveKey(idx));   // desa el codi de l'alumne
    if (stdin)    params.set('stdin', btoa(unescape(encodeURIComponent(stdin))));
    if (expected) params.set('expected', btoa(unescape(encodeURIComponent(expected))));
    if (tests)    params.set('tests', btoa(unescape(encodeURIComponent(tests))));
    if (testcode) params.set('testcode', btoa(unescape(encodeURIComponent(testcode))));
    if (goalId)   params.set('goalId', goalId);
    if (requires) params.set('requires', requires);
    if (interactive) params.set('interactive', '1');

    var iframe = document.createElement('iframe');
    iframe.src = '../index.html?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = '1px solid #d0d0d0';
    iframe.style.borderRadius = '8px';
    // allow-modals: el botó «⟲ Codi inicial» demana confirmació amb confirm()
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals');
    iframe.setAttribute('loading', 'lazy');

    div.innerHTML = '';
    div.appendChild(iframe);

    // Botó de pantalla completa: el MATEIX iframe ocupa tota la pantalla,
    // així el progrés i el codi es mantenen (abans s'obria una pestanya nova
    // on el resultat no arribava a la pàgina del curs).
    var fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'simulador-fullscreen-btn';
    fsBtn.textContent = '⛶ Pantalla completa';
    fsBtn.title = 'Obre el simulador a pantalla completa (Esc per sortir)';
    fsBtn.addEventListener('click', function() { _enterFullscreen(div, iframe); });
    div.appendChild(fsBtn);

    if (goalId) {
      var fb = document.createElement('div');
      fb.className = 'simulador-feedback';
      fb.setAttribute('data-goal-id', goalId);
      // Si ja s'ha completat, mostra el feedback positiu
      if (isGoalCompleted(goalId)) {
        fb.className = 'simulador-feedback fb-ok';
        fb.textContent = '✓ Completat anteriorment.';
      }
      div.appendChild(fb);
    }
  });
}


// ── Pantalla completa d'un simulador ─────────────────────
// Fa servir la Fullscreen API sobre l'iframe quan el navegador la permet.
// Si no (p. ex. Safari de l'iPhone), l'iframe es fixa a tota la finestra
// amb CSS (.simulador.sim-fs). En tots dos casos l'iframe rep un missatge
// 'pycat-fs' per mostrar o amagar el seu botó «✕ Surt».

var _fsSim = null;   // { div, iframe } del simulador en pantalla completa (mode CSS)

function _notifyFs(iframe, on) {
  try { iframe.contentWindow.postMessage({ type: 'pycat-fs', on: on }, window.location.origin); } catch(_) {}
}

function _enterFullscreen(div, iframe) {
  var req = iframe.requestFullscreen || iframe.webkitRequestFullscreen;
  var enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  if (req && enabled) {
    Promise.resolve(req.call(iframe)).catch(function() { _enterCssFullscreen(div, iframe); });
  } else {
    _enterCssFullscreen(div, iframe);
  }
}

function _enterCssFullscreen(div, iframe) {
  _exitFullscreen();
  div.classList.add('sim-fs');
  document.body.classList.add('sim-fs-open');
  _fsSim = { div: div, iframe: iframe };
  _notifyFs(iframe, true);
}

function _exitFullscreen() {
  var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  if (fsEl) {
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) Promise.resolve(exit.call(document)).catch(function() {});
  }
  if (_fsSim) {
    _fsSim.div.classList.remove('sim-fs');
    document.body.classList.remove('sim-fs-open');
    _notifyFs(_fsSim.iframe, false);
    _fsSim = null;
  }
}

function _onFullscreenChange() {
  var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  document.querySelectorAll('.simulador iframe').forEach(function(ifr) {
    _notifyFs(ifr, ifr === fsEl);
  });
}
document.addEventListener('fullscreenchange', _onFullscreenChange);
document.addEventListener('webkitfullscreenchange', _onFullscreenChange);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && _fsSim) _exitFullscreen();
});


// ── Sidebar toggle (hamburger mòbil) ─────────────────────

function initSidebarToggle() {
  var toggle  = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  var open = function() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  };
  var close = function() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', function() {
    sidebar.classList.contains('open') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);
}


// ── Listener de feedback des dels iframes ────────────────

window.addEventListener('message', function(e) {
  // Només acceptem missatges del mateix origen (els iframes de index.html
  // hi viuen). Així evitem que extensions o altres frames puguin injectar
  // falsos resultats de progrés via postMessage.
  if (e.origin !== window.location.origin) return;
  if (!e.data) return;
  var type   = e.data.type;
  var goalId = e.data.goalId;

  if (type === 'pycat-exit-fs') { _exitFullscreen(); return; }

  if (type === 'pycat-clear') {
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (fb) { fb.className = 'simulador-feedback'; fb.textContent = ''; }
    return;
  }

  if (type === 'pycat-result') {
    var success = e.data.success;
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (!fb) return;

    if (success) {
      fb.className = 'simulador-feedback fb-ok';
      var n = (e.data.results && e.data.results.length) || 0;
      fb.textContent = n > 1
        ? '✓ Correcte! Has passat els ' + n + ' tests.'
        : '✓ Correcte! El programa funciona bé.';

      // ── PROGRÉS: marca com a completat ──
      saveGoalCompleted(goalId);
      // Actualitza la sidebar per mostrar el ✓
      _refreshSidebar();

    } else {
      fb.className = 'simulador-feedback fb-ko';
      var results = e.data.results || [];
      var failed = null;
      for (var i = 0; i < results.length; i++) {
        if (!results[i].passed) { failed = results[i]; break; }
      }
      var missing = e.data.missing || [];
      if (!failed && missing.length) {
        fb.textContent = '✗ La sortida és correcta, però l\'enunciat demana fer servir: ' +
          missing.join(', ') + '.';
      } else if (failed && failed.actual === null) {
        fb.textContent = '✗ El programa ha donat error. Revisa la consola.';
      } else if (failed) {
        _renderDiff(fb, failed, e.data.total || results.length);
      } else {
        fb.textContent = '✗ La sortida no coincideix amb l\'esperada. Revisa el codi.';
      }
    }
  }
});

// ── Diferències entre la sortida esperada i la de l'alumne ──
// Taula de dues columnes, línia per línia; les línies diferents en vermell.
// Tot el text entra amb textContent (mai innerHTML): ve del codi de l'alumne.
var DIFF_MAX_LINES = 40;

function _renderDiff(fb, failed, nTests) {
  fb.textContent = '';
  var head = document.createElement('div');
  head.textContent = '✗ ' + (nTests > 1 ? 'Test ' + (failed.testIdx + 1) + ' de ' + nTests + ' fallit.' : 'La sortida no és l\'esperada.') +
    ' Les línies diferents estan marcades en vermell.';
  fb.appendChild(head);

  if (failed.stdin) {
    var inp = document.createElement('div');
    inp.className = 'diff-stdin';
    inp.textContent = 'Entrades del test: ' + failed.stdin.replace(/\n+$/, '').split('\n').join('  ⏎  ');
    fb.appendChild(inp);
  }

  var exp = String(failed.expected || '').replace(/\r\n/g, '\n').trim().split('\n');
  var act = String(failed.actual || '').replace(/\r\n/g, '\n').trim().split('\n');
  if (exp.length === 1 && exp[0] === '') exp = [];
  if (act.length === 1 && act[0] === '') act = [];

  var table = document.createElement('table');
  table.className = 'diff-table';
  var thead = table.createTHead().insertRow();
  ['', 'Esperat', 'Has tret'].forEach(function(t) {
    var th = document.createElement('th');
    th.textContent = t;
    thead.appendChild(th);
  });
  var tbody = table.createTBody();
  var n = Math.max(exp.length, act.length);
  for (var i = 0; i < Math.min(n, DIFF_MAX_LINES); i++) {
    var e = exp[i], a = act[i];
    var row = tbody.insertRow();
    if (e !== a) row.className = 'diff-bad';
    var num = row.insertCell();
    num.className = 'diff-num';
    num.textContent = i + 1;
    // Si només canvien els espais, es fan visibles amb «·»
    var onlySpaces = e !== undefined && a !== undefined && e !== a && e.replace(/ /g, '') === a.replace(/ /g, '');
    _diffCell(row.insertCell(), e, onlySpaces);
    _diffCell(row.insertCell(), a, onlySpaces);
  }
  fb.appendChild(table);

  if (n > DIFF_MAX_LINES) {
    var more = document.createElement('div');
    more.className = 'diff-stdin';
    more.textContent = '… (' + (n - DIFF_MAX_LINES) + ' línies més)';
    fb.appendChild(more);
  }
}

function _diffCell(td, text, showSpaces) {
  if (text === undefined) {
    td.className = 'diff-missing';
    td.textContent = '(no hi és)';
  } else if (text === '') {
    td.className = 'diff-missing';
    td.textContent = '(línia buida)';
  } else {
    td.textContent = showSpaces ? text.replace(/ /g, '·') : text;
  }
}

// Refresca la sidebar actual (detecta si estem en un capítol o repte)
function _refreshSidebar() {
  var tipus = document.body.getAttribute('data-pagina');
  var num   = parseInt(document.body.getAttribute('data-num'), 10);
  if (tipus === 'capitol') renderSidebar(num);
  else if (tipus === 'repte') renderReptesSidebar(num);
}


// ── Glossari — injectat dinàmicament a capítols i reptes ──────────

var BOOK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';

function initGlossariCurs() {
  var header = document.querySelector('.topbar');
  if (!header) return;

  var actions = header.querySelector('.topbar-actions');
  if (!actions) return;

  // Botó icona de llibre
  var btn = document.createElement('button');
  btn.className = 'btn-glossari';
  btn.id = 'btn-glossari';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Glossari');
  btn.innerHTML = BOOK_SVG;
  actions.appendChild(btn);

  // Modal — contingut ve de glossari-data.js (variable GLOSSARI_HTML)
  var overlay = document.createElement('div');
  overlay.className = 'glossari-overlay';
  overlay.id = 'glossari-overlay';
  overlay.innerHTML = (typeof GLOSSARI_HTML !== 'undefined')
    ? GLOSSARI_HTML
    : '<div class="glossari-modal"><p>Glossari no disponible.</p></div>';
  document.body.appendChild(overlay);

  // Events
  btn.addEventListener('click', function() { overlay.classList.toggle('is-open'); });
  var closeBtn = overlay.querySelector('#glossari-close');
  if (closeBtn) closeBtn.addEventListener('click', function() { overlay.classList.remove('is-open'); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('is-open'); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') overlay.classList.remove('is-open'); });
}


// ── Esquelet comú de les pàgines del curs ─────────────────
// Cada pàgina només conté el seu <main class="curs-content"> i declara
// qui és al <body>:
//
//   <body data-pagina="capitol" data-num="4">   → capítol 4
//   <body data-pagina="repte"   data-num="7">   → repte 7
//   <body data-pagina="index">                   → índex del curs (sense barra lateral)
//
// initCursPage() hi afegeix la capçalera, la barra lateral, la navegació
// anterior/següent (calculada a partir de CAPITOLS_DATA / REPTES_DATA),
// el glossari i els simuladors. Així l'esquelet es canvia en un sol lloc.

function _topbarHtml(seccio, ambToggle, toggleLabel) {
  function link(href, text, actiu) {
    return '<a href="' + href + '" class="topbar-nav-link' + (actiu ? ' active' : '') + '">' + text + '</a>';
  }
  return (ambToggle
      ? '<button id="sidebar-toggle" aria-label="' + toggleLabel + '" aria-expanded="false">☰</button>'
      : '') +
    '<div class="logo"><span class="logo-icon"></span><span>PyCat</span></div>' +
    '<nav class="topbar-nav">' +
      link('capitol-1.html', 'Capítols', seccio === 'capitol') +
      link('repte-1.html', 'Reptes', seccio === 'repte') +
      link('../index.html', 'Simulador', false) +
    '</nav>' +
    '<div class="topbar-actions"></div>';
}

// Enllaços «anterior / següent» d'una pàgina
function _chapterNavLinks(tipus, num) {
  var llista = tipus === 'repte' ? REPTES_DATA : CAPITOLS_DATA;
  var idx = -1;
  for (var i = 0; i < llista.length; i++) if (llista[i].num === num) idx = i;
  var prev, next;
  if (tipus === 'repte') {
    prev = idx > 0 ? { href: llista[idx - 1].arxiu, text: '← Repte anterior' }
                   : { href: 'capitol-1.html', text: '← Capítols' };
    next = idx >= 0 && idx < llista.length - 1 ? { href: llista[idx + 1].arxiu, text: 'Repte següent →' }
                   : { href: 'index.html', text: 'Torna a l\'índex →' };
  } else {
    prev = idx > 0 ? { href: llista[idx - 1].arxiu, text: '← Capítol anterior' }
                   : { href: 'index.html', text: '← Índex' };
    next = idx >= 0 && idx < llista.length - 1 ? { href: llista[idx + 1].arxiu, text: 'Capítol següent →' }
                   : { href: 'index.html', text: 'Torna a l\'índex →' };
  }
  return { prev: prev, next: next };
}

function initCursPage() {
  var body   = document.body;
  var tipus  = body.getAttribute('data-pagina');     // capitol | repte | index
  var num    = parseInt(body.getAttribute('data-num'), 10);
  var main   = document.querySelector('main.curs-content');
  var esCurs = (tipus === 'capitol' || tipus === 'repte') && main;

  // 1) Capçalera (si la pàgina no en té)
  if (tipus && !document.querySelector('.topbar')) {
    var header = document.createElement('header');
    header.className = 'topbar';
    header.innerHTML = _topbarHtml(tipus === 'index' ? 'capitol' : tipus, esCurs,
      tipus === 'repte' ? 'Mostra/amaga els reptes' : 'Mostra/amaga els capítols');
    body.insertBefore(header, body.firstChild);
  }

  if (esCurs) {
    // 2) Distribució: barra lateral + contingut
    var layout = document.createElement('div');
    layout.className = 'curs-layout';
    layout.innerHTML =
      '<div id="sidebar-overlay" aria-hidden="true"></div>' +
      '<nav id="sidebar" class="curs-sidebar" aria-label="' +
        (tipus === 'repte' ? 'Reptes del curs' : 'Capítols del curs') + '">' +
        '<div id="sidebar-nav"></div>' +
      '</nav>';
    main.parentNode.insertBefore(layout, main);
    layout.appendChild(main);

    // 3) Navegació anterior / següent (al final del contingut)
    if (!main.querySelector('.chapter-nav')) {
      var links = _chapterNavLinks(tipus, num);
      var nav = document.createElement('nav');
      nav.className = 'chapter-nav';
      nav.setAttribute('aria-label', tipus === 'repte' ? 'Navegació entre reptes' : 'Navegació entre capítols');
      nav.innerHTML =
        '<a href="' + links.prev.href + '" class="btn-nav btn-nav--prev">' + links.prev.text + '</a>' +
        '<a href="' + links.next.href + '" class="btn-nav btn-nav--next">' + links.next.text + '</a>';
      (main.querySelector('.chapter-content-inner') || main).appendChild(nav);
    }
  }

  injectCursLogo();
  initGlossariCurs();

  if (esCurs) {
    if (tipus === 'repte') renderReptesSidebar(num); else renderSidebar(num);
    renderSimuladors();
    initSidebarToggle();
    // Problemes de Parsons i qüestionaris (curs/activitats.js), si n'hi ha
    if (document.querySelector('.parsons, .quiz')) {
      var sc = document.createElement('script');
      sc.src = 'activitats.js';
      document.body.appendChild(sc);
    }
  }
}

// Auto-init (capitols.js es carrega al final del <body>, amb el DOM ja llegit)
initCursPage();


// ── Exporta ──────────────────────────────────────────────
window.injectCursLogo      = injectCursLogo;
window.renderSidebar       = renderSidebar;
window.renderReptesSidebar = renderReptesSidebar;
window.renderSimuladors    = renderSimuladors;
window.initSidebarToggle   = initSidebarToggle;
window.initGlossariCurs    = initGlossariCurs;
window.initCursPage        = initCursPage;
window.getProgress         = getProgress;
window.saveGoalCompleted   = saveGoalCompleted;
window.isGoalCompleted     = isGoalCompleted;
