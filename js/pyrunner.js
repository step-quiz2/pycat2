// ════════════════════════════════════════════════════════
// pyrunner.js — Gestió del Web Worker de Pyodide
//
// Responsabilitats:
//   1. Crear i gestionar el Worker (spawn, kill, re-spawn)
//   2. Carregar Pyodide (una sola vegada, amb callback de progrés)
//   3. Executar codi i recopilar stdout/stderr
//   4. Gestionar timeout (bucles infinits → terminate)
//   5. Exposar l'output per a la validació
//   6. Mode interactiu: gestionar input() via SharedArrayBuffer
//
// API pública:
//   P.pyInit()                          — carrega Pyodide al worker
//   P.pyRun(code, stdin, onDone)        — executa i crida callback(output|null)
//   P.pyRunAsync(code, stdin)           — executa i retorna Promise<output|null>
//   P.pyKill()                          — mata el worker
//   P.pyStop()                          — mata i re-spawna
//   P.canInteractive()                  — true si SharedArrayBuffer disponible
// ════════════════════════════════════════════════════════

// ── Capacitat interactiva ────────────────────────────────
var _canInteractive = (typeof SharedArrayBuffer !== 'undefined');

function canInteractive() {
  return _canInteractive;
}

// ── SharedArrayBuffer per input interactiu ───────────────
// Layout: Int32[0]=estat, Int32[1]=longitud, bytes 8..4104=dades UTF-8
var _inputSAB     = null;
var _inputControl = null;
var INPUT_BUF_SIZE = 4104;  // 8 bytes control + 4096 bytes dades

function _ensureInputBuffer() {
  if (!_inputSAB && _canInteractive) {
    try {
      _inputSAB = new SharedArrayBuffer(INPUT_BUF_SIZE);
      _inputControl = new Int32Array(_inputSAB);
    } catch (e) {
      _canInteractive = false;
      _inputSAB = null;
      _inputControl = null;
    }
  }
}

// ── Spawna el worker ─────────────────────────────────────
function _spawnWorker() {
  var S = P.state;
  if (S.worker) return;

  S.worker = new Worker('js/pyworker.js');
  S.pyodideReady = false;

  S.worker.onmessage = function(e) {
    var type = e.data.type;
    if (_handlers[type]) _handlers[type](e.data);
  };

  S.worker.onerror = function(e) {
    P.consolePush('Error intern del worker: ' + e.message, 'err');
    P.setStateUI('error');
  };
}

// ── Estat de fallback CDN ──────────────────────────────
var _triedFallback = false;

// ── Handlers de missatges del worker ─────────────────────
var _handlers = {
  ready: function() {
    P.state.pyodideReady = true;
    _triedFallback = false;   // Reset per a futures recàrregues
    P.consoleClear();
    P.setStateUI('idle');
  },
  load_error: function(d) {
    // Si encara no hem provat el CDN alternatiu, torna a provar automàticament
    if (!_triedFallback && P.PYODIDE_CDN_FALLBACK && d.cdnUrl !== P.PYODIDE_CDN_FALLBACK) {
      _triedFallback = true;
      P.consolePush(P.t('log.load_retry'), 'dim');
      // Mata el worker actual i spawna un de nou amb el CDN alternatiu
      if (P.state.worker) {
        P.state.worker.terminate();
        P.state.worker = null;
      }
      _spawnWorker();
      P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN_FALLBACK });
      return;
    }
    // Tots els CDN han fallat — mostra l'error i el botó de reintentar
    P.consoleClear();
    P.consolePush(P.t('log.load_error'), 'err');
    P.setStateUI('error');
    _showRetryButton();
  },
  stdout: function(d) {
    P.consolePush(d.text, 'out');
    _currentOutput.push(d.text);
  },
  stdout_partial: function(d) {
    // Prompt d'input() — mostra com a línia parcial
    P.consolePushPartial(d.text);
  },
  stderr: function(d) {
    P.consolePush(d.text, 'err');
  },
  done: function(d) {
    _clearTimeout();
    P.state.running = false;
    P.consolePush(P.t('log.done') + ' (' + d.elapsed + 'ms)', 'ok');
    P.setStateUI('done');
    var cb = _onDone;
    _onDone = null;   // ← FIX: nul·lifica ABANS de cridar per evitar doble invocació
    if (cb) cb(d.output != null ? d.output : _currentOutput.join('\n'));
  },
  error: function(d) {
    _clearTimeout();
    P.state.running = false;
    P.consolePush(P.t('log.error') + ': ' + d.msg, 'err');
    if (d.line) P.markErrorLine(d.line);
    P.setStateUI('error');
    var cb = _onDone;
    _onDone = null;   // ← FIX: nul·lifica ABANS de cridar per evitar doble invocació
    if (cb) cb(null);
  },
  input_request: function() {
    // El worker necessita input de l'alumne
    _clearTimeout();  // Pausa el timeout mentre espera input

    P.consoleShowInput(function(text) {
      // L'alumne ha escrit i premut Enter
      _sendInputToWorker(text);
      // Reinicia el timeout
      _restartTimeout();
    });
  }
};

// ── Envia l'input al worker via SharedArrayBuffer ────────
function _sendInputToWorker(text) {
  if (!_inputControl || !_inputSAB) return;
  var encoded = new TextEncoder().encode(text);
  var maxLen = INPUT_BUF_SIZE - 8;
  if (encoded.length > maxLen) encoded = encoded.slice(0, maxLen);
  var bytes = new Uint8Array(_inputSAB, 8);
  bytes.set(encoded);
  Atomics.store(_inputControl, 1, encoded.length);
  Atomics.store(_inputControl, 0, 2);   // input ready
  Atomics.notify(_inputControl, 0, 1);
}

// ── Estat d'una execució en curs ─────────────────────────
var _currentOutput = [];
var _timeoutId     = null;
var _onDone        = null;
var _currentCode   = null;   // per reiniciar el timeout

function _clearTimeout() {
  if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null; }
}

function _restartTimeout() {
  _clearTimeout();
  _timeoutId = setTimeout(_onTimeout, P.EXEC_TIMEOUT);
}

function _onTimeout() {
  pyKill();
  P.consolePush(P.t('log.timeout'), 'err');
  P.setStateUI('error');
  // _onDone ja s'ha nul·lificat dins pyKill()
  // Re-spawna per a la propera execució
  _spawnWorker();
  P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
}

// ── Botó "Torna a provar" per errors de càrrega ────────
function _showRetryButton() {
  var consol = document.getElementById('console-output');
  if (!consol) return;
  var btn = document.createElement('button');
  btn.textContent = P.t('ui.retry');
  btn.className = 'retry-btn';
  btn.style.cssText = 'margin:8px 0;padding:6px 16px;border:none;border-radius:4px;background:#e67e22;color:#fff;cursor:pointer;font-size:14px;';
  btn.onclick = function() {
    btn.remove();
    _triedFallback = false;
    pyInit();
  };
  consol.appendChild(btn);
}

// ── API pública ──────────────────────────────────────────

// Inicialitza Pyodide (carrega el runtime al worker)
function pyInit() {
  _triedFallback = false;
  _spawnWorker();
  P.setStateUI('loading');
  P.consolePush(P.t('log.loading'), 'dim');
  P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
}

// Executa codi Python.
// stdin: string o null
// onDone(output): callback amb el text complet de stdout (o null si error)
// interactive: boolean (forçar mode interactiu)
function pyRun(code, stdin, onDone, interactive) {
  var S = P.state;

  // Inicialitza Pyodide si encara no s'ha fet
  if (!S.worker) {
    _spawnWorker();
    var origReady = _handlers.ready;
    _handlers.ready = function() {
      origReady();
      _handlers.ready = origReady;
      pyRun(code, stdin, onDone, interactive);
    };
    P.setStateUI('loading');
    P.consolePush(P.t('log.loading'), 'dim');
    S.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
    return;
  }

  if (!S.pyodideReady) {
    var origReady2 = _handlers.ready;
    _handlers.ready = function() {
      origReady2();
      _handlers.ready = origReady2;
      pyRun(code, stdin, onDone, interactive);
    };
    return;
  }

  // Reset
  _currentOutput = [];
  _onDone = onDone || null;
  _currentCode = code;
  S.running = true;
  S.startTime = Date.now();

  P.clearLineMarks();
  P.setStateUI('running');
  P.consolePush(P.t('log.running'), 'dim');

  // Timeout de seguretat
  _timeoutId = setTimeout(_onTimeout, P.EXEC_TIMEOUT);

  // Determina si usar mode interactiu
  var useInteractive = interactive && _canInteractive;
  if (useInteractive) _ensureInputBuffer();

  // Envia al worker
  S.worker.postMessage({
    type:         'run',
    code:         code,
    stdin:        stdin,
    interactive:  useInteractive,
    inputBuffer:  useInteractive ? _inputSAB : null
  });
}

// Versió Promise (més còmoda per a iteracions)
function pyRunAsync(code, stdin, interactive) {
  return new Promise(function(resolve) {
    pyRun(code, stdin, function(output) { resolve(output); }, interactive);
  });
}

// Mata el worker (atura qualsevol execució)
function pyKill() {
  var S = P.state;
  _clearTimeout();
  if (S.worker) {
    S.worker.terminate();
    S.worker = null;
  }
  S.running = false;
  S.pyodideReady = false;
  P.consoleHideInput();
  var cb = _onDone;
  _onDone = null;
  if (cb) cb(null);
}

// Atura i re-spawna (per a poder executar de nou)
function pyStop() {
  pyKill();
  _spawnWorker();
  P.setStateUI('loading');
  P.consolePush('🔄 Re-inicialitzant Python…', 'dim');
  P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
}


// ── Exporta al namespace P ───────────────────────────────
P.pyInit         = pyInit;
P.pyRun          = pyRun;
P.pyRunAsync     = pyRunAsync;
P.pyKill         = pyKill;
P.pyStop         = pyStop;
P.canInteractive = canInteractive;
