// ════════════════════════════════════════════════════════
// editor.js — Ressaltat sintàctic Python, numeració de línies
//
// El tokenitzador gestiona:
//   - Strings d'una línia ('...' i "...")
//   - Strings multilínia ('''...''' i """...""")
//   - Comentaris (#) que no es confonen amb # dins de strings
// ════════════════════════════════════════════════════════

// ── Vocabulari Python per al ressaltat ───────────────────
const PY_KEYWORDS = new Set([
  'if','elif','else','for','while','def','return','class',
  'import','from','as','try','except','finally','raise',
  'with','pass','break','continue','and','or','not','in',
  'is','None','True','False','lambda','yield','global',
  'nonlocal','del','assert',
]);

const PY_BUILTINS = new Set([
  'print','input','range','len','int','float','str','bool',
  'list','dict','set','tuple','type','abs','max','min',
  'sum','sorted','reversed','enumerate','zip','map','filter',
  'open','round','format','isinstance','hasattr','getattr',
  'append','extend','pop','insert','remove','index','count',
  'join','split','strip','replace','find','upper','lower',
  'startswith','endswith','keys','values','items',
]);

// ── Tokenitza una línia per al ressaltat ─────────────────
// Retorna { html: string, tripleState: null | '"' | "'" }
// tripleState indica si la línia acaba dins d'una triple-quoted string.
function tokenizeLine(line, tripleState) {
  let out = '', i = 0;

  // ── Continuació d'una triple-quoted string de línies anteriors ──
  if (tripleState) {
    let s = '';
    while (i < line.length) {
      if (line[i] === tripleState &&
          i + 1 < line.length && line[i + 1] === tripleState &&
          i + 2 < line.length && line[i + 2] === tripleState) {
        s += tripleState + tripleState + tripleState;
        i += 3;
        out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
        tripleState = null;
        break;
      }
      if (line[i] === '\\' && i + 1 < line.length) {
        s += line[i++];
      }
      s += line[i++];
    }
    if (tripleState) {
      // Encara dins la string, consumeix tota la línia
      out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
      return { html: out, tripleState: tripleState };
    }
  }

  // ── Tokenització normal ────────────────────────────────
  while (i < line.length) {
    var c = line[i];

    // Comentari (fins a final de línia)
    if (c === '#') {
      out += '<span class="hl-cm">' + P.escHtml(line.slice(i)) + '</span>';
      break;
    }

    // Espai en blanc
    if (/\s/.test(c)) {
      var ws = '';
      while (i < line.length && /\s/.test(line[i])) ws += line[i++];
      out += P.escHtml(ws);
      continue;
    }

    // String (cometes simples o dobles)
    if (c === '"' || c === "'") {
      var q = c;
      var s = c; i++;

      // Detecta triple-quote
      if (i < line.length && line[i] === q &&
          i + 1 < line.length && line[i + 1] === q) {
        s += q + q; i += 2;

        // Busca el tancament de la triple-quote a la mateixa línia
        var closed = false;
        while (i < line.length) {
          if (line[i] === '\\' && i + 1 < line.length) {
            s += line[i++];
            s += line[i++];
            continue;
          }
          if (line[i] === q &&
              i + 1 < line.length && line[i + 1] === q &&
              i + 2 < line.length && line[i + 2] === q) {
            s += q + q + q; i += 3;
            closed = true;
            break;
          }
          s += line[i++];
        }

        out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
        if (!closed) {
          // La triple-quote continua a la línia següent
          tripleState = q;
          return { html: out, tripleState: tripleState };
        }
        continue;
      }

      // String normal (una sola línia)
      while (i < line.length && line[i] !== q) {
        if (line[i] === '\\' && i + 1 < line.length) { s += line[i++]; }
        s += line[i++];
      }
      if (i < line.length) s += line[i++]; // tancament
      out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
      continue;
    }

    // Puntuació
    if ('()[]{}:,.=+-*/<>!%@&|^~'.includes(c)) {
      out += '<span class="hl-br">' + P.escHtml(c) + '</span>';
      i++;
      continue;
    }

    // Número
    if (/[0-9]/.test(c)) {
      var n = '';
      var hasDot = false;
      while (i < line.length && /[0-9.]/.test(line[i])) {
        if (line[i] === '.') {
          if (hasDot) break;  // Segon punt: atura (no és part del número)
          hasDot = true;
        }
        n += line[i++];
      }
      out += '<span class="hl-num">' + P.escHtml(n) + '</span>';
      continue;
    }

    // Paraula (identificador)
    if (/[a-zA-Z_]/.test(c)) {
      var w = '';
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) w += line[i++];
      if (PY_KEYWORDS.has(w))      out += '<span class="hl-kw">' + P.escHtml(w) + '</span>';
      else if (PY_BUILTINS.has(w)) out += '<span class="hl-cmd">' + P.escHtml(w) + '</span>';
      else                         out += '<span class="hl-user">' + P.escHtml(w) + '</span>';
      continue;
    }

    // Caràcter no reconegut
    out += P.escHtml(line[i++]);
  }

  return { html: out, tripleState: tripleState || null };
}

// ── Ressaltat complet del codi ───────────────────────────
function highlightCode(code) {
  var tripleState = null;
  return code.split('\n').map(function(line, i) {
    var ln = i + 1;
    var result = tokenizeLine(line, tripleState);
    tripleState = result.tripleState;
    return '<span class="code-line" id="cln-' + ln + '">' + result.html + '</span>';
  }).join('\n');
}

// ── Fons de línies (per marcar activa/error) ─────────────
function updateLineBg(numLines) {
  var bg = document.getElementById('line-bg');
  if (!bg) return;
  bg.innerHTML = Array.from({ length: numLines }, function(_, i) {
    return '<div class="lbg-row" id="lbg-' + (i + 1) + '"></div>';
  }).join('');
}

// ── Marcatge de línies ───────────────────────────────────
function markErrorLine(n) {
  if (n) {
    var el = document.getElementById('lbg-' + n);
    if (el) el.classList.add('error');
  }
}

function clearLineMarks() {
  document.querySelectorAll('.lbg-row.active, .lbg-row.error')
    .forEach(function(el) { el.classList.remove('active', 'error'); });
}

// ── Actualitza editor (sync textarea → pre + line numbers) ──
function updateEditor() {
  var ta = document.getElementById('code-editor');
  var hl = document.getElementById('code-highlight');
  var ln = document.getElementById('line-numbers');
  if (!ta) return;

  var code  = ta.value;
  var lines = code.split('\n');

  if (hl) hl.innerHTML = highlightCode(code);
  if (ln) ln.innerHTML = lines.map(function(_, i) {
    return '<div class="ln">' + (i + 1) + '</div>';
  }).join('');

  updateLineBg(lines.length);

  saveCode(code);
}

// ── Desa el codi de l'alumne ─────────────────────────────
// P.codeStorageKey el decideix main.js: la clau del simulador lliure,
// la d'un exercici del curs (?save=...) o null (exemples: no es desa res).
function saveCode(code) {
  if (!P.codeStorageKey) return;
  try { localStorage.setItem(P.codeStorageKey, code); } catch(_) {}
}


// ── Edició de text amb suport de «desfer» (Ctrl+Z) ───────
// Substitueix el text entre `from` i `to` per `text`. Fa servir
// execCommand perquè el navegador ho afegeixi a l'historial de desfer
// (assignar ta.value l'esborraria). Si no està disponible, modifica el
// valor directament i dispara 'input' igualment.
var INDENT = '    ';   // 4 espais per nivell

function editText(ta, text, from, to) {
  if (from === undefined) from = ta.selectionStart;
  if (to === undefined)   to   = ta.selectionEnd;
  ta.focus();
  ta.setSelectionRange(from, to);
  var ok = false;
  try { ok = document.execCommand(text === '' ? 'delete' : 'insertText', false, text); } catch (e) { ok = false; }
  if (!ok) {
    var v = ta.value;
    ta.value = v.slice(0, from) + text + v.slice(to);
    ta.selectionStart = ta.selectionEnd = from + text.length;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function _lineStart(v, pos) { return v.lastIndexOf('\n', pos - 1) + 1; }

// Enter: la línia nova manté la indentació i n'afegeix un nivell després de ':'
function newlineWithIndent(ta) {
  var v = ta.value, s = ta.selectionStart;
  var line   = v.slice(_lineStart(v, s), s);
  var indent = (line.match(/^[ \t]*/) || [''])[0];
  var code   = line.replace(/#.*$/, '').replace(/\s+$/, '');
  editText(ta, '\n' + indent + (code.slice(-1) === ':' ? INDENT : ''));
}

// Tab: sense selecció, espais fins al següent múltiple de 4; amb una
// selecció de diverses línies, indenta totes les línies
function indentSelection(ta) {
  var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  if (v.slice(s, e).indexOf('\n') === -1) {
    var col = s - _lineStart(v, s);
    editText(ta, ' '.repeat(4 - (col % 4)));
    return;
  }
  if (v[e - 1] === '\n') e--;
  var ls = _lineStart(v, s);
  var block = v.slice(ls, e).split('\n').map(function(l) { return l.trim() ? INDENT + l : l; }).join('\n');
  editText(ta, block, ls, e);
  ta.setSelectionRange(ls, ls + block.length);
}

// Maj+Tab: treu un nivell d'indentació de la línia (o de les línies seleccionades)
function dedentSelection(ta) {
  var v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  if (e > s && v[e - 1] === '\n') e--;
  var ls = _lineStart(v, s);
  var le = v.indexOf('\n', e);
  if (le === -1) le = v.length;
  var lines    = v.slice(ls, le).split('\n');
  var newLines = lines.map(function(l) { return l.replace(/^( {1,4}|\t)/, ''); });
  var block    = newLines.join('\n');
  if (block === lines.join('\n')) return;
  var removedFirst = lines[0].length - newLines[0].length;
  var collapsed = (s === e);
  editText(ta, block, ls, le);
  if (collapsed) {
    var p = Math.max(ls, s - removedFirst);
    ta.setSelectionRange(p, p);
  } else {
    ta.setSelectionRange(ls, ls + block.length);
  }
}

// Retrocés just després d'espais d'indentació: esborra fins al múltiple de 4 anterior
function backspaceIndent(ta) {
  var v = ta.value, s = ta.selectionStart;
  if (s !== ta.selectionEnd) return false;
  var before = v.slice(_lineStart(v, s), s);
  if (!before.length || /[^ ]/.test(before)) return false;
  var n = before.length % 4 || 4;
  if (n === 1) return false;                 // un sol espai: que ho faci el navegador
  editText(ta, '', s - n, s);
  return true;
}

function _autocompleteVisible() {
  var ac = document.getElementById('autocomplete');
  return !!(ac && ac.classList.contains('visible'));
}

// ── Inicialitza l'editor ─────────────────────────────────
function initEditor() {
  var ta = document.getElementById('code-editor');
  if (!ta) return;

  // Sync scroll entre textarea, highlight i line-numbers
  ta.addEventListener('scroll', function() {
    var hl = document.getElementById('code-highlight');
    var bg = document.getElementById('line-bg');
    var ln = document.getElementById('line-numbers');
    if (hl) hl.scrollTop = ta.scrollTop;
    if (bg) bg.scrollTop = ta.scrollTop;
    if (ln) ln.scrollTop = ta.scrollTop;
    if (hl) hl.scrollLeft = ta.scrollLeft;
  });

  // Actualitza el ressaltat a cada input
  ta.addEventListener('input', updateEditor);

  ta.addEventListener('keydown', function(e) {
    // Ctrl+Enter (o Cmd+Enter): equivalent a clicar el botó Executa/Atura
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (P.handleRunClick) P.handleRunClick();
      return;
    }
    if (ta.readOnly) return;
    // Si l'autocompletat és obert, Tab i Enter són seus (vegeu initAutocomplete)
    if (e.key === 'Tab' && !_autocompleteVisible()) {
      e.preventDefault();
      if (e.shiftKey) dedentSelection(ta); else indentSelection(ta);
    }
  });

  // Enter i retrocés es tracten a 'beforeinput' (i no a 'keydown') perquè
  // així també funcionen amb els teclats virtuals de mòbils i tauletes.
  ta.addEventListener('beforeinput', function(e) {
    if (ta.readOnly || !e.cancelable || e.isComposing) return;
    if ((e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') && !_autocompleteVisible()) {
      e.preventDefault();
      newlineWithIndent(ta);
    } else if (e.inputType === 'deleteContentBackward') {
      if (backspaceIndent(ta)) e.preventDefault();
    }
  });

  initAutocomplete(ta);
}


// ── Autocompletat ───────────────────────────────────────

function initAutocomplete(ta) {
  var ac = document.getElementById('autocomplete');
  if (!ac) return;

  var acItems = [];
  var acIndex = -1;

  function getVocab() {
    var vocab = [];
    PY_KEYWORDS.forEach(function(w) { vocab.push({ text: w, kind: 'kw' }); });
    PY_BUILTINS.forEach(function(w) { vocab.push({ text: w, kind: 'builtin' }); });
    return vocab;
  }

  function currentWord() {
    var before = ta.value.slice(0, ta.selectionStart);
    return (before.match(/[a-zA-Z_]\w*$/) || [''])[0];
  }

  var _acCanvas = null;
  function caretScreenPos() {
    var rect  = ta.getBoundingClientRect();
    var style = window.getComputedStyle(ta);
    var lineH = parseFloat(style.lineHeight);
    var padT  = parseFloat(style.paddingTop);
    var padL  = parseFloat(style.paddingLeft);
    _acCanvas = _acCanvas || document.createElement('canvas');
    var ctx = _acCanvas.getContext('2d');
    ctx.font  = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
    var charW = ctx.measureText('m').width;
    var text  = ta.value.slice(0, ta.selectionStart);
    var lines = text.split('\n');
    var row   = lines.length - 1;
    var col   = lines[row].length;
    return {
      top:  rect.top  + padT + row * lineH - ta.scrollTop  + lineH + 2,
      left: rect.left + padL + col * charW - ta.scrollLeft,
    };
  }

  function renderAC() {
    ac.innerHTML = acItems.map(function(it, i) {
      return '<div class="ac-item' + (i === acIndex ? ' selected' : '') + '"'
        + ' data-idx="' + i + '" data-kind="' + it.kind + '"'
        + ' role="option" aria-selected="' + (i === acIndex) + '">' + it.text + '</div>';
    }).join('');
  }

  function showAC(items) {
    acItems = items;
    acIndex = 0;
    var pos = caretScreenPos();
    var dropH = Math.min(items.length * 27 + 4, 200);
    var top = (pos.top + dropH > window.innerHeight - 8)
      ? pos.top - dropH - parseFloat(window.getComputedStyle(ta).lineHeight) - 4
      : pos.top;
    ac.style.top  = top + 'px';
    ac.style.left = Math.max(4, pos.left) + 'px';
    renderAC();
    ac.classList.add('visible');
  }

  function hideAC() {
    ac.classList.remove('visible');
    acItems = [];
    acIndex = -1;
  }

  function acceptAC(idx) {
    var item = acItems[idx !== undefined ? idx : acIndex];
    if (!item) return;
    var word = currentWord();
    var pos  = ta.selectionStart;
    hideAC();
    _accepting = true;          // l'input que dispara editText no ha de reobrir la llista
    editText(ta, item.text, pos - word.length, pos);
    _accepting = false;
  }

  var _accepting = false;

  ta.addEventListener('input', function() {
    if (_accepting) return;
    var word = currentWord();
    if (word.length < 2) { hideAC(); return; }
    var wordLower = word.toLowerCase();
    var matches = getVocab().filter(function(it) {
      return it.text.toLowerCase().startsWith(wordLower) && it.text.toLowerCase() !== wordLower;
    });
    if (matches.length) showAC(matches); else hideAC();
  });

  ta.addEventListener('keydown', function(e) {
    if (!ac.classList.contains('visible')) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        acIndex = Math.min(acIndex + 1, acItems.length - 1);
        renderAC();
        var sel = ac.querySelector('.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
        break;
      case 'ArrowUp':
        e.preventDefault();
        acIndex = Math.max(acIndex - 1, 0);
        renderAC();
        var sel2 = ac.querySelector('.selected');
        if (sel2) sel2.scrollIntoView({ block: 'nearest' });
        break;
      case 'Enter':
      case 'Tab':
        if (acItems.length) { e.preventDefault(); acceptAC(); }
        break;
      case 'Escape':
        e.preventDefault();
        hideAC();
        break;
    }
  });

  ac.addEventListener('mousedown', function(e) {
    var item = e.target.closest('.ac-item');
    if (!item) return;
    e.preventDefault();
    acceptAC(+item.dataset.idx);
  });

  ta.addEventListener('blur', function() { setTimeout(hideAC, 150); });
  ta.addEventListener('click', hideAC);
  window.addEventListener('resize', hideAC);
}


// ── Exporta ──────────────────────────────────────────────
P.initEditor     = initEditor;
P.updateEditor   = updateEditor;
P.markErrorLine  = markErrorLine;
P.clearLineMarks = clearLineMarks;
P.editText       = editText;       // l'usen la barra tàctil i el botó «Codi inicial»
P.saveCode       = saveCode;
