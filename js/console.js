// ════════════════════════════════════════════════════════
// console.js — Panell de sortida + input interactiu
//
// Classes de línia:
//   out  — stdout (blanc/verd)
//   err  — stderr/errors (vermell)
//   ok   — missatge d'èxit (verd)
//   dim  — info del sistema (gris)
//   in   — input de l'alumne (groc/accent)
//
// Input interactiu (quan SharedArrayBuffer disponible):
//   consoleShowInput(onSubmit) → mostra un camp d'entrada
//   consoleHideInput()         → amaga el camp
//
// Panell stdin (fallback, sempre disponible al simulador lliure):
//   consoleShowStdinPanel()  → mostra el textarea d'entrades
//   consoleHideStdinPanel()  → amaga'l
//   consoleGetStdin()        → retorna el contingut del textarea
// ════════════════════════════════════════════════════════

function consolePush(text, type) {
  const el = document.getElementById('console-output');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'con-line ' + (type || 'out');
  line.textContent = text || '\u00a0'; // línia en blanc: &nbsp; per tenir alçada visible
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

// Afegeix text a la línia parcial actual (per a prompts d'input() sense \n)
function consolePushPartial(text) {
  const el = document.getElementById('console-output');
  if (!el) return;
  let partial = el.querySelector('.con-line.partial:last-child');
  if (!partial) {
    partial = document.createElement('div');
    partial.className = 'con-line out partial';
    el.appendChild(partial);
  }
  partial.textContent += text;
  el.scrollTop = el.scrollHeight;
}

// Tanca la línia parcial actual
function consoleClosePartial() {
  const el = document.getElementById('console-output');
  if (!el) return;
  const partial = el.querySelector('.con-line.partial:last-child');
  if (partial) partial.classList.remove('partial');
}

function consoleClear() {
  const el = document.getElementById('console-output');
  if (el) el.innerHTML = '';
  consoleHideInput();
}


// ── Input interactiu (mode SAB) ──────────────────────────

function consoleShowInput(onSubmit) {
  const area = document.querySelector('.console-area');
  if (!area) return;
  consoleHideInput();

  const wrap = document.createElement('div');
  wrap.className = 'console-input-wrap';
  wrap.id = 'console-input-wrap';

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'console-input';
  inp.id = 'console-input';
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocorrect', 'off');
  inp.setAttribute('spellcheck', 'false');
  inp.placeholder = P.t('log.input.placeholder');

  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inp.value;
      consolePush(val, 'in');
      consoleHideInput();
      if (onSubmit) onSubmit(val);
    }
  });

  wrap.appendChild(inp);
  area.appendChild(wrap);

  const output = document.getElementById('console-output');
  if (output) output.scrollTop = output.scrollHeight;
  setTimeout(function() { inp.focus(); }, 30);
}

function consoleHideInput() {
  const wrap = document.getElementById('console-input-wrap');
  if (wrap) wrap.remove();
}


// ── Panell stdin (fallback / mode no-interactiu) ─────────

function consoleShowStdinPanel() {
  const area = document.querySelector('.console-area');
  if (!area || document.getElementById('stdin-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'stdin-panel';
  panel.className = 'stdin-panel';

  const label = document.createElement('div');
  label.className = 'stdin-label';
  label.innerHTML = '<span>' + P.t('log.stdin') + '</span>' +
                    '<span class="stdin-hint">' + P.t('log.stdin.hint') + '</span>';

  const ta = document.createElement('textarea');
  ta.id = 'stdin-textarea';
  ta.className = 'stdin-textarea';
  ta.rows = 3;
  ta.spellcheck = false;
  ta.setAttribute('autocomplete', 'off');

  panel.appendChild(label);
  panel.appendChild(ta);
  area.appendChild(panel);
}

function consoleHideStdinPanel() {
  const panel = document.getElementById('stdin-panel');
  if (panel) panel.remove();
}

function consoleGetStdin() {
  const ta = document.getElementById('stdin-textarea');
  return ta ? ta.value : '';
}


// ── Exporta ──────────────────────────────────────────────
P.consolePush         = consolePush;
P.consolePushPartial  = consolePushPartial;
P.consoleClosePartial = consoleClosePartial;
P.consoleClear        = consoleClear;
P.consoleShowInput    = consoleShowInput;
P.consoleHideInput    = consoleHideInput;
P.consoleShowStdinPanel  = consoleShowStdinPanel;
P.consoleHideStdinPanel  = consoleHideStdinPanel;
P.consoleGetStdin        = consoleGetStdin;
