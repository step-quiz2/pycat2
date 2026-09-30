// ════════════════════════════════════════════════════════
// i18n.js — Textos de la interfície PyCat (català)
//
// Conté:
//   P.UI       — Diccionari de textos
//   P.t(key)   — Retorna el text de la clau
// ════════════════════════════════════════════════════════

P.UI = {
  'ui.run':               '▶ Executa',
  'ui.stop':              '■ Atura',
  'ui.reset':             '↺ Neteja',
  'state.idle':           'llest',
  'state.loading':        'carregant Python…',
  'state.running':        'executant…',
  'state.done':           'finalitzat',
  'state.error':          'error',
  'log.running':          '⚡ Executant…',
  'log.done':             '✅ Programa completat',
  'log.error':            '❌ Error',
  'log.timeout':          '⏱ Temps excedit (possible bucle infinit)',
  'log.loading':          'Preparant Python…',
  'log.ready':            '🟢 Python llest',
  'log.reset':            '↺ Consola netejada',
  'log.stdin':            '📥 Entrades del programa',
  'log.stdin.hint':       '(una per línia — es passen a input())',
  'log.input.placeholder':'Escriu aquí i prem Enter…',
  'log.waiting':          '⏳ Esperant entrada…',
  'log.load_error':       '❌ No s\'ha pogut carregar Python. Comprova la connexió a internet i recarrega la pàgina.',
  'log.load_retry':       '🔄 Tornant a provar amb un servidor alternatiu…',
  'ui.retry':             '🔄 Torna a provar',
  'ui.validate':          '▶ Valida',
  'ui.readonly':          'No editable',
  'log.ran_interactive':  '✔ Programa executat. Prem ▶ Valida per comprovar.',
  'log.validating':       '── Validació ──',
};

// ── Funció de traducció ──────────────────────────────────
P.t = function(key) {
  return P.UI[key] !== undefined ? P.UI[key] : key;
};
