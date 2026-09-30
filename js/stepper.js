// ════════════════════════════════════════════════════════
// stepper.js — «👣 Pas a pas»: executa el programa línia a línia
//
// El worker executa el codi amb sys.settrace (js/pycat_trace.py) i
// retorna tots els passos d'un cop. Aquí es mostren com una pel·lícula
// que l'alumne pot avançar i retrocedir:
//   · la línia que està a punt d'executar-se es marca a l'editor;
//   · la consola mostra les variables (programa principal i funcions),
//     amb les que acaben de canviar destacades, i la sortida fins aleshores.
//
// Mentre dura, l'editor no es pot modificar. «✕ Surt», ▶ Executa o
// ↺ Neteja en surten.
//
// API: P.initStepper(), P.startTrace(), P.exitTrace(), P.isTracing()
// ════════════════════════════════════════════════════════

var _trace = null;   // { passos, sortida, error, tallat, idx, wasReadonly }

function isTracing() { return !!_trace; }

// ── Botó a la barra d'eines ──────────────────────────────
function initStepper() {
  var reset = document.getElementById('btn-reset');
  if (!reset) return;
  var b = document.createElement('button');
  b.className = 'btn';
  b.id = 'btn-step';
  b.type = 'button';
  b.textContent = P.t('ui.step');
  b.title = P.t('ui.step_title');
  b.addEventListener('click', function() {
    if (_trace) exitTrace(); else startTrace();
  });
  reset.parentNode.insertBefore(b, reset.nextSibling);

  // Fletxes del teclat mentre es mira el pas a pas
  document.addEventListener('keydown', function(e) {
    if (!_trace) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' && document.activeElement.type !== 'range') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); _goTo(_trace.idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); _goTo(_trace.idx - 1); }
    else if (e.key === 'Escape') { e.preventDefault(); exitTrace(); }
  });
}

// ── Comença: enregistra l'execució ───────────────────────
async function startTrace() {
  var S  = P.state;
  var ta = document.getElementById('code-editor');
  var userCode = ta ? ta.value : '';
  if (!userCode.trim()) { P.consolePush(P.t('log.empty_code'), 'dim'); return; }
  if (S.currentState === 'running' || S.currentState === 'validating' || S.currentState === 'loading') return;

  // Entrades per a input(): les de l'exemple, les del primer test o les del panell
  var stdin = S.freeStdin ||
              (S.testCases && S.testCases.length ? (S.testCases[0].stdin || '') : '') ||
              P.consoleGetStdin() || '';
  if (!stdin && P.usesInput(userCode)) {
    P.consoleClear();
    P.consolePush(P.t('log.step_needs_input'), 'dim');
    P.consoleShowStdinPanel();
    return;
  }

  P.consoleClear();
  P.clearLineMarks();
  P.consolePush(P.t('log.step_recording'), 'dim');
  var finalCode = P.buildFinalCode(userCode);
  var data = await P.pyTrace(finalCode, stdin, S.userLineCount);
  P.consoleClear();
  if (!data || !data.passos) {
    P.consolePush(P.t('log.step_failed'), 'err');
    return;
  }
  _enter(data);
}

// ── Mode pas a pas ───────────────────────────────────────
function _enter(data) {
  var ta = document.getElementById('code-editor');
  _trace = data;
  _trace.idx = 0;
  _trace.wasReadonly = ta ? ta.readOnly : false;
  if (ta) ta.readOnly = true;
  document.body.classList.add('tracing');
  P.consoleHideStdinPanel();

  var btn = document.getElementById('btn-step');
  if (btn) btn.textContent = P.t('ui.step_exit');

  var area = document.querySelector('.console-area');
  var panel = document.createElement('div');
  panel.id = 'trace-panel';
  panel.className = 'trace-panel';
  panel.innerHTML =
    '<div class="trace-controls">' +
      '<button type="button" class="btn" data-go="first" title="' + P.t('ui.step_first') + '">⏮</button>' +
      '<button type="button" class="btn" data-go="prev" title="' + P.t('ui.step_prev') + '">◀</button>' +
      '<span class="trace-count"></span>' +
      '<button type="button" class="btn p" data-go="next" title="' + P.t('ui.step_next') + '">▶</button>' +
      '<button type="button" class="btn" data-go="last" title="' + P.t('ui.step_last') + '">⏭</button>' +
    '</div>' +
    '<input type="range" class="trace-range" min="0" value="0" aria-label="' + P.t('ui.step_title') + '">' +
    '<div class="trace-line"></div>' +
    '<div class="trace-vars"></div>' +
    '<div class="trace-out-title">' + P.t('ui.step_output') + '</div>' +
    '<pre class="trace-out"></pre>';
  area.appendChild(panel);

  panel.querySelector('.trace-range').max = String(data.passos.length - 1);
  panel.querySelector('.trace-range').addEventListener('input', function(e) {
    _goTo(parseInt(e.target.value, 10));
  });
  panel.querySelectorAll('[data-go]').forEach(function(b) {
    b.addEventListener('click', function() {
      var g = b.getAttribute('data-go');
      if (g === 'first') _goTo(0);
      else if (g === 'prev') _goTo(_trace.idx - 1);
      else if (g === 'next') _goTo(_trace.idx + 1);
      else _goTo(_trace.passos.length - 1);
    });
  });
  _goTo(0);
}

function exitTrace() {
  if (!_trace) return;
  var ta = document.getElementById('code-editor');
  if (ta) ta.readOnly = _trace.wasReadonly;
  _trace = null;
  document.body.classList.remove('tracing');
  var panel = document.getElementById('trace-panel');
  if (panel) panel.remove();
  document.querySelectorAll('.lbg-row.step').forEach(function(el) { el.classList.remove('step'); });
  P.clearLineMarks();
  var btn = document.getElementById('btn-step');
  if (btn) btn.textContent = P.t('ui.step');
}

// ── Mostra el pas número i ───────────────────────────────
function _goTo(i) {
  if (!_trace) return;
  var n = _trace.passos.length;
  i = Math.max(0, Math.min(n - 1, i));
  _trace.idx = i;
  var pas  = _trace.passos[i];
  var prev = i > 0 ? _trace.passos[i - 1] : null;
  var last = (i === n - 1);
  var panel = document.getElementById('trace-panel');
  if (!panel) return;

  panel.querySelector('.trace-count').textContent =
    P.t('ui.step_count').replace('{i}', i + 1).replace('{n}', n);
  panel.querySelector('.trace-range').value = String(i);
  panel.querySelector('[data-go="prev"]').disabled  = (i === 0);
  panel.querySelector('[data-go="first"]').disabled = (i === 0);
  panel.querySelector('[data-go="next"]').disabled  = last;
  panel.querySelector('[data-go="last"]').disabled  = last;

  // Línia a punt d'executar-se (o final / error)
  var lineEl = panel.querySelector('.trace-line');
  lineEl.className = 'trace-line';
  P.clearLineMarks();
  document.querySelectorAll('.lbg-row.step').forEach(function(el) { el.classList.remove('step'); });
  if (last && _trace.error) {
    lineEl.classList.add('err');
    var errLine = _trace.error.linia;
    var info = P.explainError ? P.explainError(_trace.error.missatge) : null;
    lineEl.textContent = (errLine ? P.t('log.error_line').replace('{n}', errLine) : P.t('log.error')) +
      ': ' + (info ? info.text : _trace.error.missatge);
    if (errLine) P.markErrorLine(errLine);
  } else if (last && _trace.tallat) {
    lineEl.classList.add('err');
    lineEl.textContent = P.t('log.step_cut');
  } else if (pas.linia) {
    lineEl.textContent = P.t('log.step_line').replace('{n}', pas.linia);
    _markStepLine(pas.linia);
  } else {
    lineEl.classList.add('ok');
    lineEl.textContent = P.t('log.step_end');
  }

  // Variables per nivell de crida
  var vars = panel.querySelector('.trace-vars');
  vars.textContent = '';
  pas.nivells.forEach(function(nivell, k) {
    var nom = nivell[0], llista = nivell[1];
    var anterior = _levelVars(prev, k, nom);
    var box = document.createElement('div');
    box.className = 'trace-level';
    var h = document.createElement('div');
    h.className = 'trace-level-name';
    h.textContent = nom === 'programa' ? P.t('ui.step_main') : P.t('ui.step_func').replace('{f}', nom);
    box.appendChild(h);
    if (!llista.length) {
      var buit = document.createElement('div');
      buit.className = 'trace-empty';
      buit.textContent = P.t('ui.step_novars');
      box.appendChild(buit);
    } else {
      var table = document.createElement('table');
      llista.forEach(function(v) {
        var tr = table.insertRow();
        if (prev && anterior[v[0]] !== v[1]) tr.className = 'changed';
        var c1 = tr.insertCell(); c1.textContent = v[0]; c1.className = 'trace-name';
        var c2 = tr.insertCell(); c2.textContent = v[1]; c2.className = 'trace-value';
        var c3 = tr.insertCell(); c3.textContent = v[2]; c3.className = 'trace-type';
      });
      box.appendChild(table);
    }
    vars.appendChild(box);
  });

  // Sortida fins aquest pas
  panel.querySelector('.trace-out').textContent = _trace.sortida.slice(0, pas.sortida) || ' ';
}

function _levelVars(pas, k, nom) {
  var map = {};
  if (pas && pas.nivells[k] && pas.nivells[k][0] === nom) {
    pas.nivells[k][1].forEach(function(v) { map[v[0]] = v[1]; });
  }
  return map;
}

// Marca la línia a l'editor i hi fa scroll si cal
function _markStepLine(n) {
  var row = document.getElementById('lbg-' + n);
  if (row) row.classList.add('step');
  var ta = document.getElementById('code-editor');
  if (!ta) return;
  var style = window.getComputedStyle(ta);
  var lineH = parseFloat(style.lineHeight) || 20;
  var top = (n - 1) * lineH;
  if (top < ta.scrollTop || top + lineH > ta.scrollTop + ta.clientHeight) {
    ta.scrollTop = Math.max(0, top - ta.clientHeight / 2);
    ta.dispatchEvent(new Event('scroll'));
  }
}


// ── Exporta ──────────────────────────────────────────────
P.initStepper = initStepper;
P.startTrace  = startTrace;
P.exitTrace   = exitTrace;
P.isTracing   = isTracing;
