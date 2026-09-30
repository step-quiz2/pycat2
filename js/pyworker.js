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
//   Worker → Main:  {type:'ready'}
//   Worker → Main:  {type:'stdout', text}
//   Worker → Main:  {type:'stdout_partial', text}  (mode interactiu: prompt sense \n)
//   Worker → Main:  {type:'stderr', text}
//   Worker → Main:  {type:'done', elapsed, output}
//   Worker → Main:  {type:'error', msg, line, elapsed}
//   Worker → Main:  {type:'input_request'}
// ════════════════════════════════════════════════════════

let pyodide = null;

// ── Estat per input interactiu ───────────────────────────
let _inputBuffer  = null;   // SharedArrayBuffer
let _inputControl = null;   // Int32Array vista sobre _inputBuffer

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
_orig_input  = builtins.input

def _batch_input(prompt=''):
    line = sys.stdin.readline()
    if not line:
        raise EOFError
    return line.rstrip('\\n')
`);

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
    def write(self, text):
        if text and text.strip():
            _jsSendStderr(text.rstrip('\\n'))
        return len(text) if text else 0
    def flush(self):
        pass

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
  if (stdin !== undefined && stdin !== null && stdin !== '') {
    pyodide.runPython('sys.stdin = StringIO(' + JSON.stringify(stdin) + ')');
  }
}


// ── Execució de codi ─────────────────────────────────────
async function runCode(code, stdin, interactive, sharedBuffer) {
  if (!pyodide) {
    postMessage({ type: 'error', msg: 'Python encara no està carregat.' });
    return;
  }

  var t0 = performance.now();

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

    // Executa el codi de l'alumne
    await pyodide.runPythonAsync(code);

    var elapsed = Math.round(performance.now() - t0);

    if (interactive && sharedBuffer) {
      // Mode interactiu: flush qualsevol sortida pendent
      try { pyodide.runPython('sys.stdout.flush()'); } catch(_) {}
      var stdout = pyodide.runPython('sys.stdout.getvalue()');
      // Restaura
      pyodide.runPython('sys.stdout = _orig_stdout; sys.stderr = _orig_stderr; builtins.input = _orig_input');
      postMessage({ type: 'done', elapsed: elapsed, output: stdout || '' });
    } else {
      // Mode batch: llegeix la sortida capturada
      var stdout = pyodide.runPython('_cap_out.getvalue()');
      var stderr = pyodide.runPython('_cap_err.getvalue()');
      pyodide.runPython('sys.stdout = _orig_stdout; sys.stderr = _orig_stderr; builtins.input = _orig_input');

      if (stdout) {
        var lines = stdout.split('\n');
        for (var i = 0; i < lines.length; i++) {
          if (i === lines.length - 1 && lines[i] === '') continue;
          postMessage({ type: 'stdout', text: lines[i] });
        }
      }
      if (stderr) {
        var lines = stderr.split('\n').filter(function(l) { return l; });
        for (var j = 0; j < lines.length; j++) {
          postMessage({ type: 'stderr', text: lines[j] });
        }
      }
      postMessage({ type: 'done', elapsed: elapsed, output: stdout || '' });
    }

  } catch (e) {
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

    // Restaura stdout/stderr/input
    try {
      pyodide.runPython('sys.stdout = _orig_stdout; sys.stderr = _orig_stderr; builtins.input = _orig_input');
    } catch(_) {}

    var elapsed2 = Math.round(performance.now() - t0);
    var msg = e.message || String(e);
    var line = null;

    var lineMatch = msg.match(/line (\d+)/);
    if (lineMatch) line = parseInt(lineMatch[1], 10);

    var msgLines = msg.split('\n').filter(function(l) { return l.trim(); });
    var lastLine = msgLines[msgLines.length - 1] || msg;

    postMessage({ type: 'error', msg: lastLine, line: line, elapsed: elapsed2 });
  }
}

// ── Dispatcher de missatges ──────────────────────────────
self.onmessage = function(e) {
  var type = e.data.type;
  if (type === 'init') {
    initPyodide(e.data.cdnUrl);
  } else if (type === 'run') {
    runCode(e.data.code, e.data.stdin, e.data.interactive, e.data.inputBuffer);
  }
};
