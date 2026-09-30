#!/usr/bin/env node
// ════════════════════════════════════════════════════════
// tools/generate-pages.js — Generador de pàgines del curs
//
// Llegeix descripcions de pàgines en JSON (tools/pages/*.json)
// i genera els fitxers HTML corresponents a curs/*.html.
//
// Ús:
//   node tools/generate-pages.js                    # genera tot a curs/
//   node tools/generate-pages.js --only repte-6     # només una pàgina
//   node tools/generate-pages.js --dry-run          # no escriu, només mostra
//   node tools/generate-pages.js --out /tmp/        # canvia el directori de sortida
//   node tools/generate-pages.js --input other/     # canvia el directori d'entrada
//
// Format d'entrada (tools/pages/*.json):
// {
//   "type":  "capitol" | "repte",
//   "num":   6,
//   "titol": "Parell o senar",
//   "difficulty": "facil" | "intermedi" | "dificil",   (només reptes)
//   "lead":  "<p>Introducció opcional...</p>",          (només capítols)
//   "prev":  { "url": "...", "label": "← ..." },
//   "next":  { "url": "...", "label": "... →" },
//   "hint":  "<p>Pista HTML opcional...</p>",           (només reptes)
//   "sections": [
//     { "h2": "Títol", "body": "<p>HTML...</p>" },
//     { "h2": "Simulador", "body": "<p>...</p>", "simulador": {
//         "goalId":"repte-6", "code":"...", "tests":[{"stdin":"","expected":""}],
//         "expected":"...", "stdin":"...", "testcode":"...",
//         "readonly":false, "height":320
//     } },
//     ...
//   ]
// }
//
// ════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ── Parser d'arguments CLI ───────────────────────────────
function parseArgs(argv) {
  const args = { dryRun: false, only: null, input: null, output: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run')      args.dryRun = true;
    else if (a === '--only')    args.only   = argv[++i];
    else if (a === '--input')   args.input  = argv[++i];
    else if (a === '--out')     args.output = argv[++i];
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else { console.error('Arg desconegut:', a); printHelp(); process.exit(1); }
  }
  return args;
}

function printHelp() {
  console.log('Ús: node tools/generate-pages.js [opcions]');
  console.log('  --only NAME    Genera només aquesta pàgina (p.ex. repte-6)');
  console.log('  --dry-run      No escriu, mostra el contingut que generaria');
  console.log('  --input DIR    Directori d\'entrada (defecte: tools/pages)');
  console.log('  --out DIR      Directori de sortida (defecte: curs)');
  console.log('  --help         Mostra aquesta ajuda');
}

// ── Helpers ─────────────────────────────────────────────
function escAttr(s) {
  // Escapa per atribut amb cometes dobles. Preserva salts de línia.
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escAttrSingle(s) {
  // Escapa per atribut amb cometes simples (utilitzat per data-tests JSON).
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

// ── Badges per reptes segons dificultat ─────────────────
const DIFFICULTY_BADGE = {
  facil:     { color: '#d1fae5', fg: '#065f46', label: 'Fàcil' },
  intermedi: { color: '#fef3c7', fg: '#92400e', label: 'Intermedi' },
  dificil:   { color: '#fee2e2', fg: '#991b1b', label: 'Difícil' },
};

// ── Genera un bloc .simulador des d'un objecte config ────
function renderSimulador(sim) {
  if (!sim) return '';
  const parts = ['      <div class="simulador"'];

  if (sim.code != null) {
    parts.push('           data-code="' + escAttr(sim.code) + '"');
  }
  if (sim.stdin != null) {
    parts.push('           data-stdin="' + escAttr(sim.stdin) + '"');
  }
  if (sim.expected != null) {
    parts.push('           data-expected="' + escAttr(sim.expected) + '"');
  }
  if (sim.tests) {
    // data-tests és JSON; anem amb cometes simples externes com les pàgines existents
    const json = typeof sim.tests === 'string' ? sim.tests : JSON.stringify(sim.tests);
    parts.push("           data-tests='" + escAttrSingle(json) + "'");
  }
  if (sim.testcode != null) {
    parts.push('           data-testcode="' + escAttr(sim.testcode) + '"');
  }
  if (sim.readonly) {
    parts.push('           data-readonly="true"');
  }
  if (sim.goalId) {
    parts.push('           data-goal-id="' + escAttr(sim.goalId) + '"');
  }
  const height = sim.height != null ? sim.height : 320;
  parts.push('           data-height="' + height + '">');
  parts.push('      </div>');
  return parts.join('\n');
}

// ── Genera una <section> ─────────────────────────────────
// Cada entrada de "sections" pot ser:
//   A) Simple:  { h2, body, simulador }           → una secció amb un h2
//   B) Agrupada: { parts: [ {h2, body, simulador}, ... ] }  → una secció amb múltiples h2s
//
// NOTA: No re-indentem el contingut de `body` perquè pot contenir blocs
// <pre> que preserven l'espai literal. El HTML generat pot tenir una
// indentació irregular però és semànticament idèntic.
function renderSection(section) {
  const lines = ['    <section class="chapter-section">'];

  const parts = Array.isArray(section.parts) ? section.parts : [section];
  parts.forEach((p, idx) => {
    if (idx > 0) lines.push('');                                 // separació visual al HTML
    if (p.h2)   lines.push('      <h2>' + p.h2 + '</h2>');
    if (p.body) lines.push(p.body.trim());                       // tal qual: no re-indentem
    if (p.simulador) {
      lines.push('');
      lines.push(renderSimulador(p.simulador));
    }
  });

  lines.push('    </section>');
  return lines.join('\n');
}

// ── Genera <nav class="chapter-nav"> ─────────────────────
function renderNav(prev, next) {
  if (!prev && !next) return '';
  const lines = ['    <nav class="chapter-nav" aria-label="Navegació entre pàgines">'];
  if (prev) {
    lines.push('      <a href="' + prev.url + '" class="btn-nav btn-nav--prev">' + prev.label + '</a>');
  }
  if (next) {
    lines.push('      <a href="' + next.url + '" class="btn-nav btn-nav--next">' + next.label + '</a>');
  }
  lines.push('    </nav>');
  return lines.join('\n');
}

// ── Genera el badge de capçalera ─────────────────────────
function renderBadge(page) {
  if (page.type === 'capitol') {
    return '      <span class="chapter-badge">Capítol ' + page.num + '</span>';
  }
  // repte
  const diff = page.difficulty && DIFFICULTY_BADGE[page.difficulty]
    ? DIFFICULTY_BADGE[page.difficulty]
    : null;
  if (diff) {
    return '      <span class="chapter-badge" style="background: ' + diff.color +
           '; color: ' + diff.fg + ';">⚡ Repte ' + page.num + ' — ' + diff.label + '</span>';
  }
  return '      <span class="chapter-badge">⚡ Repte ' + page.num + '</span>';
}

// ── Genera <details> de pista (només reptes) ────────────
function renderHint(hint) {
  if (!hint) return '';
  return `    <details style="margin-top: 1.5rem;">
      <summary style="cursor:pointer; font-size:0.82rem; color:var(--muted);">💡 Pista</summary>
      <div style="margin-top:0.5rem; font-size:0.85rem; color:var(--muted);">
        ${hint.trim().replace(/\n/g, '\n        ')}
      </div>
    </details>`;
}

// ── Genera el bloc d'scripts finals ──────────────────────
function renderScripts(page) {
  const isCapitol = page.type === 'capitol';
  const renderFn = isCapitol ? 'renderSidebar' : 'renderReptesSidebar';
  return `<script src="glossari-data.js"></script>
<script src="capitols.js"></script>
<script src="../js/sw-register.js"></script>
<script>
  injectCursLogo();
  ${renderFn}(${page.num});
  renderSimuladors();
  initSidebarToggle();
</script>`;
}

// ── Genera la pàgina HTML completa ───────────────────────
function renderPage(page) {
  const isCapitol = page.type === 'capitol';
  const label     = isCapitol ? 'Capítol ' + page.num : 'Repte ' + page.num;
  const title     = label + ' — ' + page.titol + ' | PyCat';
  const headerTitle = label + ' — ' + page.titol;
  const navCapitolsClass = isCapitol ? ' class="active"' : '';
  const navReptesClass   = isCapitol ? '' : ' class="active"';
  const sidebarLabel = isCapitol ? 'Capítols del curs' : 'Reptes del curs';
  const togglelabel  = isCapitol ? 'Mostra/amaga els capítols' : 'Mostra/amaga els reptes';

  const sections = (page.sections || []).map(renderSection).join('\n\n');
  const nav      = renderNav(page.prev, page.next);
  const hint     = renderHint(page.hint);
  const lead     = page.lead ? '\n      <p class="chapter-lead">' + page.lead + '</p>' : '';

  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="curs.css">
</head>
<body>

<header class="curs-header">
  <button id="sidebar-toggle" aria-label="${togglelabel}" aria-expanded="false">☰</button>
  <span class="curs-header-logo">
    <span class="logo-icon"></span>
    PyCat
  </span>
  <nav class="curs-nav">
    <a href="capitol-1.html"${navCapitolsClass}>Capítols</a>
    <a href="repte-1.html"${navReptesClass}>Reptes</a>
    <a href="../index.html">Simulador</a>
  </nav>
  <span class="curs-header-title">${headerTitle}</span>
  <div class="curs-header-actions"></div>
</header>

<div class="curs-layout">
  <div id="sidebar-overlay" aria-hidden="true"></div>
  <nav id="sidebar" class="curs-sidebar" aria-label="${sidebarLabel}">
    <div id="sidebar-nav"></div>
  </nav>

  <main class="curs-content">

    <header class="chapter-header">
${renderBadge(page)}
      <h1>${page.titol}</h1>${lead}
    </header>

${sections}

${hint ? hint + '\n\n' : ''}${nav}

  </main>
</div>

${renderScripts(page)}

</body>
</html>
`;
}

// ── Determina el nom del fitxer de sortida ──────────────
function outputFilename(page) {
  return (page.type === 'capitol' ? 'capitol-' : 'repte-') + page.num + '.html';
}

// ── Valida una pàgina abans de generar-la ──────────────
function validatePage(page, sourceFile) {
  const errs = [];
  if (!page.type || (page.type !== 'capitol' && page.type !== 'repte'))
    errs.push('type ha de ser "capitol" o "repte"');
  if (typeof page.num !== 'number') errs.push('num ha de ser un número');
  if (!page.titol) errs.push('titol és obligatori');
  if (!Array.isArray(page.sections)) errs.push('sections ha de ser un array');
  if (errs.length) {
    console.error('❌ ' + sourceFile + ':');
    errs.forEach(e => console.error('    ' + e));
    return false;
  }
  return true;
}

// ── Main ────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv);
  const root = path.resolve(__dirname, '..');
  const inputDir  = args.input  ? path.resolve(args.input)  : path.join(root, 'tools', 'pages');
  const outputDir = args.output ? path.resolve(args.output) : path.join(root, 'curs');

  if (!fs.existsSync(inputDir)) {
    console.error('❌ No existeix el directori d\'entrada:', inputDir);
    process.exit(1);
  }

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
  if (!files.length) {
    console.error('❌ No s\'han trobat fitxers JSON a', inputDir);
    process.exit(1);
  }

  let generated = 0, skipped = 0, failed = 0;

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(inputDir, file), 'utf8'));
    } catch (e) {
      console.error('❌ JSON invàlid a', file, '—', e.message);
      failed++;
      continue;
    }

    if (!validatePage(data, file)) { failed++; continue; }

    const outName = outputFilename(data);
    if (args.only && outName !== args.only + '.html' && data.num + '' !== args.only) {
      skipped++;
      continue;
    }

    const html = renderPage(data);
    const outPath = path.join(outputDir, outName);

    if (args.dryRun) {
      console.log('── DRY-RUN: ' + outPath + ' (' + html.length + ' bytes) ──');
      console.log(html.substring(0, 200) + '…');
    } else {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log('✅ ' + outPath);
    }
    generated++;
  }

  console.log('\n' + generated + ' generades' +
    (skipped ? ', ' + skipped + ' omeses' : '') +
    (failed ? ', ' + failed + ' fallades' : '') + '.');
  if (failed) process.exit(1);
}

main();
