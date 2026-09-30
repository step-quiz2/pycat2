// ════════════════════════════════════════════════════════
// pyworker.js — Web Worker que executa Python via Pyodide
//
// Viu en un fil separat. Comunicació via postMessage.
// El main thread pot fer worker.terminate() per matar
// bucles infinits sense bloquejar la UI.
//
// Dos modes d'execució:
//   1. Batch (per defecte): stdout/stderr capturats a StringIO,
//      retornats al final. stdin és un StringIO prepoblat.
//   2. Interactiu (quan SharedArrayBuffer disponible):
//      stdout enviat línia per línia en temps real.
//      stdin bloqueja amb Atomics.wait() esperant input del main.
//
// Protocol:
//   Main → Worker:  {type:'init', cdnUrl}
//   Main → Worker:  {type:'run', code, stdin, interactive, inputBuffer}
//   Main → Worker:  {type:'check', code, requires}   → {type:'check_result', missing}
//   Main → Worker:  {type:'trace', code, stdin, userLines} → {type:'trace_result', data (JSON)}
//   Worker → Main:  {type:'ready'}
//   Worker → Main:  {type:'stdout', text}
//   Worker → Main:  {type:'stdout_partial', text}  (mode interactiu: prompt sense \n)
//   Worker → Main:  {type:'stderr', text}
//   Worker → Main:  {type:'done', elapsed, output, turtle}   (turtle: JSON del dibuix o null)
//   Worker → Main:  {type:'error', msg, line, elapsed}
//   Worker → Main:  {type:'input_request'}
// ════════════════════════════════════════════════════════

let pyodide = null;

// ── Estat per input interactiu ───────────────────────────
let _inputBuffer  = null;   // SharedArrayBuffer
let _inputControl = null;   // Int32Array vista sobre _inputBuffer

// ── Restauració de l'I/O original després de cada execució ──
const RESTORE_IO = 'sys.stdout = _orig_stdout; sys.stderr = _orig_stderr; ' +
                   'sys.stdin = _orig_stdin; builtins.input = _orig_input';

// ── Inicialització ───────────────────────────────────────
async function initPyodide(cdnUrl) {
  try {
    importScripts(cdnUrl + 'pyodide.js');
    pyodide = await loadPyodide({ indexURL: cdnUrl });

    // Guardem stdout/stderr/input originals (una sola vegada)
    pyodide.runPython(`
import sys
import builtins
from io import StringIO
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
_orig_stdin  = sys.stdin
_orig_input  = builtins.input

def _batch_input(prompt=''):
    line = sys.stdin.readline()
    if not line:
        raise EOFError
    return line.rstrip('\\n')
`, { filename: '<pycat>' });   // nom propi: no es confon amb el codi de l'alumne (<exec>)

    // Comprovació de requisits (data-requires): mòdul compartit amb el
    // test automàtic. Si no es pot carregar, simplement no es comprova.
    // També el mòdul del «pas a pas» (pycat_trace.py).
    for (const fitxer of ['pycat_requires.py', 'pycat_trace.py']) {
      try {
        var resp = await fetch(fitxer);
        if (resp.ok) pyodide.runPython(await resp.text(), { filename: '<pycat>' });
      } catch (_) {}
    }

    // Mòdul «turtle» propi (pycat_turtle.py): es desa com a /pycat/turtle.py,
    // davant de la biblioteca estàndard.
    try {
      var respT = await fetch('pycat_turtle.py');
      if (respT.ok) {
        pyodide.FS.mkdirTree('/pycat');
        pyodide.FS.writeFile('/pycat/turtle.py', await respT.text());
        pyodide.runPython("import sys\nif '/pycat' not in sys.path: sys.path.insert(0, '/pycat')");
      }
    } catch (_) {}

    postMessage({ type: 'ready' });
  } catch (e) {
    postMessage({ type: 'load_error', msg: 'Error carregant Pyodide: ' + e.message, cdnUrl: cdnUrl });
  }
}


// ── Funció JS per bloquejar fins rebre input (mode interactiu) ──
function _jsWaitForInput() {
  if (!_inputControl) return '';
  // Notifica al main que necessitem input
  postMessage({ type: 'input_request' });
  // Espera: bloqueja el worker fins que el main escrigui l'input
  // inputControl[0]: 0=idle, 1=waiting, 2=input_ready
  Atomics.store(_inputControl, 0, 1);
  Atomics.wait(_inputControl, 0, 1);  // espera mentre sigui 1
  // Llegeix l'input
  var len = Atomics.load(_inputControl, 1);
  var bytes = new Uint8Array(_inputBuffer, 8, len);
  var text = new TextDecoder().decode(bytes.slice());
  // Reset
  Atomics.store(_inputControl, 0, 0);
  return text;
}

// ── Funcions JS per a stdout en temps real (mode interactiu) ──
function _jsSendLine(text) {
  postMessage({ type: 'stdout', text: text });
}
function _jsSendPartial(text) {
  postMessage({ type: 'stdout_partial', text: text });
}
function _jsSendStderr(text) {
  postMessage({ type: 'stderr', text: text });
}


// ── Setup Python interactiu ──────────────────────────────
function _setupInteractiveIO() {
  // Registra les funcions JS perquè Python les pugui cridar
  self._jsWaitForInput = _jsWaitForInput;
  self._jsSendLine     = _jsSendLine;
  self._jsSendPartial  = _jsSendPartial;
  self._jsSendStderr   = _jsSendStderr;

  pyodide.runPython(`
import sys
from js import _jsWaitForInput, _jsSendLine, _jsSendPartial, _jsSendStderr

class _LiveStdout:
    def __init__(self):
        self._all = []
        self._pending = []

    def write(self, text):
        if not text:
            return 0
        self._all.append(text)
        parts = text.split('\\n')
        self._pending.append(parts[0])
        for k in range(1, len(parts)):
            line = ''.join(self._pending)
            _jsSendLine(line)
            self._pending = [parts[k]]
        return len(text)

    def flush(self):
        if self._pending:
            partial = ''.join(self._pending)
            if partial:
                _jsSendPartial(partial)
            self._pending = []

    def getvalue(self):
        return ''.join(self._all)

class _LiveStderr:
    def __init__(self):
        self._all = []
    # No s'envia en temps real: si hi ha un error, Pyodide hi escriu el
    # traceback (amb fitxers interns) i la consola ja en mostra una
    # explicació. Es buida al final (vegeu _emitStderr a runCode).
    def write(self, text):
        if text:
            self._all.append(text)
        return len(text) if text else 0
    def flush(self):
        pass
    def getvalue(self):
        return ''.join(self._all)

class _InteractiveStdin:
    def readline(self):
        result = str(_jsWaitForInput())
        return result + "\\n"
    def read(self, n=-1):
        return self.readline()
    def readlines(self):
        return [self.readline()]

_live_out = _LiveStdout()
_live_err = _LiveStderr()
_live_in  = _InteractiveStdin()
sys.stdout = _live_out
sys.stderr = _live_err
sys.stdin  = _live_in
builtins.input = _orig_input
`);
}


// ── Setup Python batch (mode original) ───────────────────
function _setupBatchIO(stdin) {
  pyodide.runPython(`
import sys
from io import StringIO
_cap_out = StringIO()
_cap_err = StringIO()
sys.stdout = _cap_out
sys.stderr = _cap_err
builtins.input = _batch_input
`);
  // Sempre un stdin nou: així una execució no hereta l'stdin d'una altra
  pyodide.runPython('sys.stdin = StringIO(' + JSON.stringify(stdin || '') + ')');
}


// ── Dibuix de la tortuga (si el programa l'ha fet servir) ─
// Retorna el JSON de les ordres de dibuix o null.
function _turtleData() {
  try {
    return pyodide.runPython(
      "import sys\n" +
      "_m = sys.modules.get('turtle')\n" +
      "_m._pycat_json() if _m is not None and hasattr(_m, '_pycat_json') else None") || null;
  } catch (_) { return null; }
}

// ── Envia el text d'stderr al main, línia a línia ────────
function _emitStderr(text) {
  if (!text) return;
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  for (var j = 0; j < lines.length; j++) {
    postMessage({ type: 'stderr', text: lines[j] });
  }
}

// ── Execució de codi ─────────────────────────────────────
async function runCode(code, stdin, interactive, sharedBuffer) {
  if (!pyodide) {
    postMessage({ type: 'error', msg: 'Python encara no està carregat.' });
    return;
  }

  var t0 = performance.now();
  var userGlobals = null;

  try {
    // Configura I/O segons el mode
    if (interactive && sharedBuffer) {
      _inputBuffer  = sharedBuffer;
      _inputControl = new Int32Array(sharedBuffer);
      Atomics.store(_inputControl, 0, 0);
      _setupInteractiveIO();
    } else {
      _inputBuffer  = null;
      _inputControl = null;
      _setupBatchIO(stdin);
    }

    // Cada programa comença amb un full de dibuix en blanc
    pyodide.runPython("import sys\nsys.modules.pop('turtle', None)");

    // Executa el codi de l'alumne en un espai de variables NOU a cada
    // execució: les variables d'una execució (o d'un cas de prova) anterior
    // no sobreviuen, i l'alumne no veu les variables internes del worker.
    userGlobals = pyodide.globals.get('dict')();
    userGlobals.set('__name__', '__main__');
    await pyodide.runPythonAsync(code, { globals: userGlobals });

    var elapsed = Math.round(performance.now() - t0);

    if (interactive && sharedBuffer) {
      // Mode interactiu: flush qualsevol sortida pendent
      try { pyodide.runPython('sys.stdout.flush()'); } catch(_) {}
      var stdout = pyodide.runPython('sys.stdout.getvalue()');
      _emitStderr(pyodide.runPython('sys.stderr.getvalue()'));
      // Restaura
      pyodide.runPython(RESTORE_IO);
      postMessage({ type: 'done', elapsed: elapsed, output: stdout || '', turtle: _turtleData() });
    } else {
      // Mode batch: llegeix la sortida capturada
      var stdout = pyodide.runPython('_cap_out.getvalue()');
      var stderr = pyodide.runPython('_cap_err.getvalue()');
      pyodide.runPython(RESTORE_IO);

      if (stdout) {
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
          if (i === lines.length - 1 && lines[i] === '') continue;
          postMessage({ type: 'stdout', text: lines[i] });
        }
      }
      _emitStderr(stderr);
      postMessage({ type: 'done', elapsed: elapsed, output: stdout || '', turtle: _turtleData() });
    }

  } catch (e) {
    // Text d'error escrit a stderr. Quan sys.stderr està redirigit, Pyodide
    // hi escriu el traceback i deixa e.message BUIT: cal llegir-lo d'aquí.
    var errText = '';
    try {
      errText = pyodide.runPython(interactive && sharedBuffer
        ? 'sys.stderr.getvalue()' : '_cap_err.getvalue()') || '';
    } catch(_) {}

    // Intenta llegir qualsevol output parcial
    var partialOut = '';
    try {
      if (interactive && sharedBuffer) {
        partialOut = pyodide.runPython('sys.stdout.getvalue()') || '';
      } else {
        partialOut = pyodide.runPython('_cap_out.getvalue()') || '';
      }
      if (partialOut && !(interactive && sharedBuffer)) {
        var pLines = partialOut.split('\n');
        for (var k = 0; k < pLines.length; k++) {
          if (k === pLines.length - 1 && pLines[k] === '') continue;
          postMessage({ type: 'stdout', text: pLines[k] });
        }
      }
    } catch(_) {}

    // El que l'alumne hagi escrit a stderr ABANS del traceback
    var tbIdx = errText.indexOf('Traceback (most recent call last)');
    _emitStderr(tbIdx >= 0 ? errText.slice(0, tbIdx) : '');

    // Restaura stdout/stderr/input
    try {
      pyodide.runPython(RESTORE_IO);
    } catch(_) {}

    var elapsed2 = Math.round(performance.now() - t0);
    var msg = e.message || errText || String(e);
    var line = null;

    // La línia de l'error és l'ÚLTIMA referència a <exec> (el codi de
    // l'alumne). Les primeres línies del traceback són fitxers interns de
    // Pyodide (p. ex. _base.py, line 597) i no s'han de fer servir.
    var execRe = /File "<exec>", line (\d+)/g;
    var m;
    while ((m = execRe.exec(msg)) !== null) line = parseInt(m[1], 10);

    var msgLines = msg.split('\n').filter(function(l) { return l.trim(); });
    var lastLine = msgLines[msgLines.length - 1] || msg;

    postMessage({ type: 'error', msg: lastLine, line: line, elapsed: elapsed2, turtle: _turtleData() });
  } finally {
    // Allibera el diccionari de variables de l'alumne (proxy JS → Python)
    if (userGlobals) { try { userGlobals.destroy(); } catch(_) {} }
  }
}

// ── Comprova els requisits d'un exercici (data-requires) ─
function checkRequires(code, requires) {
  var missing = [];
  try {
    var fn = pyodide.globals.get('pycat_requisits_que_falten');
    if (fn) {
      var res = fn(code, requires);
      missing = res.toJs();
      res.destroy();
      fn.destroy();
    }
  } catch (_) { missing = []; }
  postMessage({ type: 'check_result', missing: missing });
}

// ── Execució pas a pas (pycat_trace.py) ──────────────────
function traceCode(code, stdin, userLines) {
  var data = null;
  try {
    var fn = pyodide.globals.get('pycat_traca');
    if (fn) {
      data = fn(code, stdin || '', userLines || null);
      fn.destroy();
    }
  } catch (e) { data = null; }
  postMessage({ type: 'trace_result', data: data });
}

// ── Dispatcher de missatges ──────────────────────────────
self.onmessage = function(e) {
  var type = e.data.type;
  if (type === 'init') {
    initPyodide(e.data.cdnUrl);
  } else if (type === 'trace') {
    traceCode(e.data.code, e.data.stdin, e.data.userLines);
  } else if (type === 'check') {
    checkRequires(e.data.code, e.data.requires);
  } else if (type === 'run') {
    runCode(e.data.code, e.data.stdin, e.data.interactive, e.data.inputBuffer);
  }
};
