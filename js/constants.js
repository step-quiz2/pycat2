// ════════════════════════════════════════════════════════
// constants.js — Configuració central de PyCat
//
// Namespace global: P (com K per a KarelCat)
// Cada mòdul afegeix les seves funcions a P.*
// ════════════════════════════════════════════════════════

const P = {};

// ── Claus de localStorage ────────────────────────────────
P.LS_KEY_CODE     = 'pycat_code';
P.LS_KEY_THEME    = 'pycat-theme';
P.LS_KEY_PROGRESS = 'pycat_progress';   // reservat per al sistema de progrés (B1)

// ── Codi per defecte al simulador lliure ─────────────────
P.DEFAULT_CODE = `# El teu primer programa Python
print("Hola, món!")
`;

// ── Timeout d'execució (ms) ──────────────────────────────
P.EXEC_TIMEOUT = 10000;   // 10 segons

// ── CDN de Pyodide ───────────────────────────────────────
P.PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
P.PYODIDE_CDN_FALLBACK = 'https://pyodide-cdn2.iodide.io/v0.27.7/full/';

// ── Helpers HTML ─────────────────────────────────────────
P.escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
