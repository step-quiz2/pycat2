// ════════════════════════════════════════════════════════
// ui.js — Interfície: badge d'estat, botons, tema, validació
//
// Flux de validació:
//   1. runProgram() construeix finalCode = userCode + testCode
//   2. Si hi ha testCases, executa el finalCode un cop per cada test case
//      (seqüencialment) amb el seu stdin, i compara amb expected.
//   3. Si no, fa una execució lliure (amb freeStdin si n'hi ha,
//      o amb mode interactiu / stdin panel).
//   4. Un cop acaba tot, notifica el pare amb {success, results}.
// ════════════════════════════════════════════════════════

// ── Badge d'estat + mutació del botó ─────────────────────

function setStateUI(state) {
  P.state.currentState = state;

  var btn = document.getElementById('btn-run');
  if (btn) {
    var running    = (state === 'running' || state === 'validating');
    var loading    = (state === 'loading');
    var wantValid  = (state === 'ran-interactive');

    if (wantValid) {
      btn.textContent = P.t('ui.validate');
    } else {
      btn.textContent = P.t(running ? 'ui.stop' : 'ui.run');
    }
    btn.classList.toggle('p', !running);
    btn.classList.toggle('r', running);
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.45' : '';
    btn.style.cursor  = loading ? 'not-allowed' : '';
  }
}

// ── Handler del botó principal ───────────────────────────
function handleRunClick() {
  var s = P.state.currentState;
  if (s === 'running' || s === 'validating') {
    stopProgram();
  } else if (s === 'ran-interactive') {
    _runValidation();
  } else {
    runProgram();
  }
}

// ── Construeix el codi final (codi de l'alumne + testCode) ──
function _buildFinalCode(userCode) {
  var tc = P.state.testCode || '';
  if (!tc) return userCode;
  return userCode + '\n\n# ── Tests ──\n' + tc;
}

// ── Detecta si el codi conté input() ─────────────────────
function _usesInput(code) {
  // Busca input( ignorant dins de comentaris i strings (simplificat)
  var lines = code.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // Ignora la part de comentari
    var hashIdx = -1;
    var inStr = false, strChar = '';
    for (var j = 0; j < line.length; j++) {
      var c = line[j];
      if (inStr) {
        if (c === '\\') { j++; continue; }
        if (c === strChar) inStr = false;
      } else {
        if (c === '"' || c === "'") { inStr = true; strChar = c; }
        else if (c === '#') { hashIdx = j; break; }
      }
    }
    var effective = hashIdx >= 0 ? line.substring(0, hashIdx) : line;
    if (/\binput\s*\(/.test(effective)) return true;
  }
  return false;
}

// ── Gestió del panell stdin (fallback) ───────────────────
function _ensureStdinPanel(code) {
  // Mostra el panell stdin si el codi usa input() i estem en mode lliure
  // sense stdin predefinit, sense SAB, i sense tests
  var S = P.state;
  if (!S.testCases && !S.freeStdin && !P.canInteractive() && _usesInput(code)) {
    P.consoleShowStdinPanel();
  }
}

// ── Executa el programa ──────────────────────────────────
async function runProgram() {
  P.consoleClear();
  P.clearLineMarks();

  var userCode = (document.getElementById('code-editor') || {}).value || '';
  if (!userCode.trim()) {
    P.consolePush('⚠ Escriu codi abans d\'executar.', 'dim');
    return;
  }

  _notifyClear();
  P.state.ranInteractive = false;

  var S = P.state;
  var finalCode = _buildFinalCode(userCode);

  // ── Cas 1: sense validació (simulador lliure) ──
  if (!S.testCases) {
    var stdin = S.freeStdin || null;

    // Mode interactiu: si SAB disponible i el codi usa input()
    if (!stdin && P.canInteractive() && _usesInput(userCode)) {
      P.consoleHideStdinPanel();
      await P.pyRunAsync(finalCode, null, true);  // interactive=true
      return;
    }

    // Fallback: recull stdin del panell textarea si n'hi ha
    if (!stdin) {
      var panelStdin = P.consoleGetStdin();
      if (panelStdin) {
        stdin = panelStdin;
      }
    }

    P.consoleHideStdinPanel();
    await P.pyRunAsync(finalCode, stdin);
    // Mostra el panell per la propera execució si cal
    _ensureStdinPanel(userCode);
    return;
  }

  // ── Cas 2: amb validació ──

  // Dual-mode: si wantsInteractive i SAB disponible i el codi usa input(),
  // primer executa interactivament, després l'alumne fa clic a Valida.
  if (S.wantsInteractive && P.canInteractive() && _usesInput(userCode)) {
    P.consoleHideStdinPanel();
    await P.pyRunAsync(finalCode, null, true);  // interactive=true
    // Si el programa ha acabat bé (no error/timeout), entrem en mode validació
    if (P.state.currentState === 'done') {
      P.state.ranInteractive = true;
      P.consolePush(P.t('log.ran_interactive'), 'dim');
      setStateUI('ran-interactive');
    }
    return;
  }

  // Fallback: batch directe (sense SAB o sense wantsInteractive)
  await _runBatchValidation(finalCode);
}

// ── Executa la validació batch (des del botó Valida o directament) ──
async function _runValidation() {
  var userCode = (document.getElementById('code-editor') || {}).value || '';
  var finalCode = _buildFinalCode(userCode);

  P.consoleClear();
  P.clearLineMarks();
  P.consolePush(P.t('log.validating'), 'dim');
  setStateUI('validating');

  P.state.ranInteractive = false;
  await _runBatchValidation(finalCode);
}

// ── Itera pels test cases en batch ──────────────────────
async function _runBatchValidation(finalCode) {
  var S = P.state;
  var results = [];
  for (var i = 0; i < S.testCases.length; i++) {
    var tc = S.testCases[i];

    if (S.testCases.length > 1) {
      P.consolePush('── Test ' + (i + 1) + '/' + S.testCases.length + ' ──', 'dim');
    }

    var output = await P.pyRunAsync(finalCode, tc.stdin || null);

    var passed = output !== null &&
                 _normalizeOutput(output) === _normalizeOutput(tc.expected || '');

    results.push({
      testIdx:  i,
      stdin:    tc.stdin || '',
      expected: tc.expected || '',
      actual:   output,
      passed:   passed
    });

    if (output === null) break;
  }

  _notifyResults(results);
}

// ── Atura el programa ────────────────────────────────────
function stopProgram() {
  P.pyStop();
}

// ── Neteja la consola ────────────────────────────────────
function resetConsole() {
  P.consoleClear();
  P.clearLineMarks();
  P.state.ranInteractive = false;
  P.setStateUI('idle');
  P.consolePush(P.t('log.reset'), 'dim');
  _notifyClear();
  // Mostra el panell stdin si cal
  var code = (document.getElementById('code-editor') || {}).value || '';
  _ensureStdinPanel(code);
}

// ── Normalització d'output per a comparació ──────────────
function _normalizeOutput(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
}

// ── Notificacions al pare (iframe) ───────────────────────
function _notifyClear() {
  if (!P.state.goalId) return;
  try {
    window.parent.postMessage({
      type: 'pycat-clear', goalId: P.state.goalId
    }, P.parentOrigin);
  } catch(_) {}
}

function _notifyResults(results) {
  if (!P.state.goalId) return;
  var allPassed = results.length > 0 && results.every(function(r) { return r.passed; });
  try {
    window.parent.postMessage({
      type:    'pycat-result',
      goalId:  P.state.goalId,
      success: allPassed,
      results: results
    }, P.parentOrigin);
  } catch(_) {}
}

// ── Tema clar/fosc ───────────────────────────────────────
var ICON_SUN  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
var ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function updateThemeBtn() {
  var btn = document.getElementById('btn-theme');
  if (!btn) return;
  var isLight = document.body.classList.contains('light');
  btn.innerHTML = isLight ? ICON_MOON : ICON_SUN;
  btn.title     = isLight ? 'Mode fosc' : 'Mode clar';
}

function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem(P.LS_KEY_THEME, isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function initTheme() {
  var saved = localStorage.getItem(P.LS_KEY_THEME);
  if (saved !== 'dark') document.body.classList.add('light');
  updateThemeBtn();
}


// ── Glossari ────────────────────────────────────────────

function initGlossari() {
  var btn = document.getElementById('btn-glossari');
  var overlay = document.getElementById('glossari-overlay');
  if (!btn || !overlay) return;

  // Injecta el contingut de glossari-data.js (carregat després)
  function inject() {
    if (overlay.children.length) return; // ja injectat
    overlay.innerHTML = (typeof GLOSSARI_HTML !== 'undefined')
      ? GLOSSARI_HTML
      : '<div class="glossari-modal"><p>Glossari no disponible.</p></div>';

    var closeBtn = overlay.querySelector('#glossari-close');
    if (closeBtn) closeBtn.addEventListener('click', function() { overlay.classList.remove('is-open'); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('is-open'); });
  }

  btn.addEventListener('click', function() {
    inject();
    overlay.classList.toggle('is-open');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') overlay.classList.remove('is-open');
  });
}


// ── Obrir / Desar fitxers .py ───────────────────────────

var _currentFileName = 'programa.py';

function initFileActions() {
  var btnOpen  = document.getElementById('btn-open');
  var btnSave  = document.getElementById('btn-save');
  var fileInput = document.getElementById('file-open-input');
  if (!btnOpen || !btnSave || !fileInput) return;

  // Obre: delega al input[type=file] ocult
  btnOpen.addEventListener('click', function() {
    fileInput.value = '';  // permet reobrir el mateix fitxer
    fileInput.click();
  });

  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    if (!file) return;

    _currentFileName = file.name;

    var reader = new FileReader();
    reader.onload = function(e) {
      var ta = document.getElementById('code-editor');
      if (!ta) return;
      ta.value = e.target.result;
      P.updateEditor();
      if (!document.body.classList.contains('embed')) {
        try { localStorage.setItem(P.LS_KEY_CODE, ta.value); } catch(_) {}
      }
      ta.focus();
    };
    reader.readAsText(file);
  });

  // Desa: descarrega el contingut com a .py
  btnSave.addEventListener('click', function() {
    var ta = document.getElementById('code-editor');
    if (!ta) return;
    var blob = new Blob([ta.value], { type: 'text/x-python;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = _currentFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}


// ── Exporta ──────────────────────────────────────────────
P.setStateUI     = setStateUI;
P.handleRunClick = handleRunClick;
P.initTheme      = initTheme;
P.initGlossari   = initGlossari;
P.initFileActions = initFileActions;
P.toggleTheme    = toggleTheme;
P.updateThemeBtn = updateThemeBtn;

window.handleRunClick = handleRunClick;
window.runProgram     = runProgram;
window.stopProgram    = stopProgram;
window.resetConsole   = resetConsole;
window.toggleTheme    = toggleTheme;
