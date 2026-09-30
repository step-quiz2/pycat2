// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls
//
// Paràmetres d'URL suportats:
//   ?embed=1         → amaga topbar (mode iframe)
//   ?code=BASE64     → codi inicial
//   ?readonly=1      → editor no editable
//   ?stdin=BASE64    → input predefinit per a input()
//                       · Si hi ha ?tests o ?expected, el stdin d'aquell param mana.
//                       · Si no, és un input lliure (simulador sense validació).
//   ?expected=BASE64 → output esperat (validació simple d'un sol cas)
//   ?tests=BASE64    → JSON de test cases: [{stdin, expected}, ...]
//   ?testcode=BASE64 → codi Python afegit al final del codi de l'alumne abans d'executar
//   ?goalId=ID       → identificador del repte (per postMessage)
//   ?requires=a,b    → construccions que el codi ha de fer servir (js/pycat_requires.py)
//   ?theme=light     → força mode clar
// ════════════════════════════════════════════════════════

(function init() {
  const S      = P.state;
  const params = new URLSearchParams(location.search);

  // ── Decode base64 → UTF-8 ──
  function dec(b64) {
    try { return decodeURIComponent(escape(atob(b64))); } catch { return null; }
  }

  // ── Origen segur per a postMessage ──
  P.parentOrigin = (() => {
    try {
      return document.referrer
        ? new URL(document.referrer).origin
        : window.location.origin;
    } catch { return window.location.origin; }
  })();

  // 0) Tema
  P.initTheme();

  // 0b) Glossari
  P.initGlossari();

  // 0c) Obrir / Desar fitxers
  P.initFileActions();

  // 1) Editor
  P.initEditor();
  const ta       = document.getElementById('code-editor');
  const embed    = params.get('embed') === '1';
  const readonly = params.get('readonly') === '1';
  const urlCode  = params.has('code') ? dec(params.get('code')) : null;

  // ── On es desa el codi de l'alumne ──
  //   · simulador lliure (sense codi a la URL): la clau de sempre
  //   · exercici del curs (?save=CLAU): una clau pròpia per a cada exercici
  //   · exemples no editables o enllaços amb codi: no es desa
  const saveKey = params.get('save');
  if (!embed && urlCode === null)  P.codeStorageKey = P.LS_KEY_CODE;
  else if (saveKey && !readonly)   P.codeStorageKey = saveKey;
  else                             P.codeStorageKey = null;
  P.initialCode = urlCode !== null ? urlCode : P.DEFAULT_CODE;

  if (ta) {
    let saved = null;
    if (P.codeStorageKey) {
      try { saved = localStorage.getItem(P.codeStorageKey); } catch(_) {}
    }
    ta.value = saved !== null ? saved : P.initialCode;

    if (readonly) {
      ta.setAttribute('readonly', 'readonly');
      ta.style.cursor = 'default';
      document.body.classList.add('is-readonly');

      // Toast "No editable" en clicar l'editor readonly
      var toast = document.createElement('div');
      toast.className = 'readonly-toast';
      toast.textContent = P.t('ui.readonly');
      document.querySelector('.editor-inner').appendChild(toast);

      var hideTimer = null;
      ta.addEventListener('pointerdown', function() {
        clearTimeout(hideTimer);
        toast.classList.add('visible');
        hideTimer = setTimeout(function() { toast.classList.remove('visible'); }, 1400);
      });
    }

    P.updateEditor();
    setTimeout(() => P.updateEditor(), 50);
  }

  // 1b) Botons extra de la barra d'eines (només als exercicis del curs)
  const spacer = document.querySelector('.toolbar .toolbar-spacer');
  function addToolbarButton(id, text, title, onClick) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.id = id;
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.addEventListener('click', onClick);
    if (spacer) spacer.parentNode.insertBefore(b, spacer);
    return b;
  }

  // «⟲ Codi inicial»: torna a l'esquelet original de l'exercici
  if (ta && P.codeStorageKey && P.codeStorageKey !== P.LS_KEY_CODE) {
    addToolbarButton('btn-restore-code', P.t('ui.restore'), P.t('ui.restore_title'), function() {
      if (ta.value === P.initialCode) return;
      if (!confirm(P.t('ui.restore_confirm'))) return;
      P.editText(ta, P.initialCode, 0, ta.value.length);   // Ctrl+Z ho desfà
      ta.setSelectionRange(0, 0);
      ta.scrollTop = 0;
      P.consolePush(P.t('log.code_restored'), 'dim');
    });
  }

  // «✕ Surt»: visible quan la pàgina del curs posa aquest simulador a
  // pantalla completa (ho avisa amb un missatge 'pycat-fs').
  if (embed && window.parent !== window) {
    const exitBtn = addToolbarButton('btn-exit-fs', P.t('ui.exit_fs'), P.t('ui.exit_fs_title'), function() {
      try { window.parent.postMessage({ type: 'pycat-exit-fs' }, P.parentOrigin); } catch(_) {}
    });
    exitBtn.hidden = true;
    window.addEventListener('message', function(e) {
      if (e.source !== window.parent || !e.data || e.data.type !== 'pycat-fs') return;
      exitBtn.hidden = !e.data.on;
    });
  }

  // 2) Paràmetres de validació — estat normalitzat
  S.goalId    = params.get('goalId') || '';
  S.requires  = params.get('requires') || '';
  S.testCode  = params.get('testcode') ? (dec(params.get('testcode')) || '') : '';

  const urlStdin = params.get('stdin') ? dec(params.get('stdin')) : null;

  if (params.get('tests')) {
    // Múltiples test cases
    try {
      const parsed = JSON.parse(dec(params.get('tests')));
      // Normalitza: accepta tant {stdin, expected} com {input, expected} (legacy)
      S.testCases = parsed.map(tc => ({
        stdin:    tc.stdin !== undefined ? tc.stdin : (tc.input !== undefined ? tc.input : null),
        expected: tc.expected !== undefined ? tc.expected : ''
      }));
    } catch(_) {
      S.testCases = null;
    }
    S.freeStdin = null;
  } else if (params.get('expected')) {
    // Un sol test case amb expected (i possiblement un stdin associat)
    S.testCases = [{
      stdin:    urlStdin,
      expected: dec(params.get('expected')) || ''
    }];
    S.freeStdin = null;
  } else {
    // Sense validació — simulador lliure, potser amb stdin predefinit
    S.testCases = null;
    S.freeStdin = urlStdin;
  }

  // 3) Python (Pyodide)
  //    · Simulador lliure: es pre-carrega de seguida (només n'hi ha un).
  //    · Simuladors incrustats al curs: es carrega en el PRIMER clic a
  //      ▶ Executa (P.pyRun ho fa sol). Una pàgina amb 20 simuladors ja no
  //      carrega 20 intèrprets de Python quan l'alumne fa scroll.
  S.wantsInteractive = params.get('interactive') === '1';

  if (embed) {
    P.setStateUI('idle');
    P.consolePush(P.t('log.lazy'), 'dim');
  } else {
    P.pyInit();
    P.setStateUI('loading');
  }

  // 5) Mostra el panell stdin si estem en mode lliure sense SAB
  //    i el codi per defecte (o el carregat) conté input()
  if (!S.testCases && !S.freeStdin && !P.canInteractive()) {
    var code = ta ? ta.value : '';
    if (/\binput\s*\(/.test(code)) {
      // Mostra el panell un cop Pyodide estigui llest (per no tapar el loading)
      var checkReady = setInterval(function() {
        if (P.state.pyodideReady || P.state.currentState === 'idle') {
          clearInterval(checkReady);
          P.consoleShowStdinPanel();
        }
      }, 500);
    }
  }

})();
