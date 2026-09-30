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
  'log.error_line':       '❌ Error a la línia {n}',
  'log.error_testcode':   '❌ Error en comprovar el teu codi',
  'log.timeout':          '⏱ Temps excedit (possible bucle infinit)',
  'log.loading':          'Preparant Python…',
  'log.lazy':             'Prem ▶ Executa. (El primer cop, Python triga uns segons a carregar-se.)',
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
  'ui.restore':           '⟲ Codi inicial',
  'ui.restore_title':     'Torna al codi amb què començava l\'exercici',
  'ui.restore_confirm':   'Vols tornar al codi inicial de l\'exercici? Perdràs el que has escrit (ho pots recuperar amb Ctrl+Z).',
  'log.code_restored':    '⟲ S\'ha recuperat el codi inicial',
  'log.requires_missing': '⚠ La sortida és correcta, però l\'enunciat demana fer servir:',
  'log.worker_error':     'Error intern del worker:',
  'log.restarting':       '🔄 Re-inicialitzant Python…',
  'log.empty_code':       '⚠ Escriu codi abans d\'executar.',
  'log.test_n':           '── Test {i}/{n} ──',
  'ui.theme_dark':        'Mode fosc',
  'ui.theme_light':       'Mode clar',
  'ui.step':              '👣 Pas a pas',
  'ui.step_exit':         '✕ Surt del pas a pas',
  'ui.step_title':        'Executa el programa línia a línia i mira com canvien les variables',
  'ui.step_first':        'Primer pas',
  'ui.step_prev':         'Pas anterior (←)',
  'ui.step_next':         'Pas següent (→)',
  'ui.step_last':         'Últim pas',
  'ui.step_count':        'Pas {i} de {n}',
  'ui.step_output':       'Sortida',
  'ui.step_main':         'Programa principal',
  'ui.step_func':         'Dins de {f}',
  'ui.step_novars':       '(encara no hi ha variables)',
  'log.step_line':        '➜ Ara s\'executarà la línia {n}',
  'log.step_end':         '✅ El programa ha acabat',
  'log.step_cut':         '⏱ Massa passos: el programa no s\'acaba (bucle infinit?). Es mostren els 1000 primers.',
  'log.step_recording':   '👣 Preparant el pas a pas…',
  'log.step_failed':      '❌ No s\'ha pogut executar el pas a pas.',
  'log.step_needs_input': '👣 Aquest programa fa servir input(). Escriu les entrades a sota (una per línia) i torna a prémer «👣 Pas a pas».',
  'ui.exit_fs':           '✕ Surt',
  'ui.exit_fs_title':     'Surt de la pantalla completa',
};

// ── Funció de traducció ──────────────────────────────────
P.t = function(key) {
  return P.UI[key] !== undefined ? P.UI[key] : key;
};
