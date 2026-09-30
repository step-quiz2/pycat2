# PyCat — Curriculum Plan (11 Chapters)

> **Audience:** This document is written for an AI assistant that will author the remaining chapters of the PyCat course. Read it in full before producing any HTML.

---

## 1. Project context

PyCat is a browser-based interactive Python course written in **vanilla HTML / CSS / JavaScript** (no build step, no framework, no bundler). It is the spiritual successor of **KarelCat**, a Catalan-language course that teaches programming with a Karel-the-Robot-style virtual creature. KarelCat uses a custom JS interpreter; PyCat uses **Pyodide** (CPython 3.12 compiled to WebAssembly) so that learners write and run **real Python** in the browser, with no installation.

Key product facts you must respect:

- **Language of the content:** Catalan. UI, prose, code comments, variable names in the examples — everything customer-facing is in Catalan.
- **Audience:** absolute beginners, typically 12–16 years old. Many will have just finished KarelCat. They know what a variable, a loop and a conditional are *conceptually*, but they have never written real Python.
- **Tone:** warm, concise, second-person singular ("Escriu un programa...", "Fixa't que..."). Never condescending. Never English jargon when a Catalan word exists.
- **Pedagogy:** every concept is introduced with a tiny runnable example *first*, then explained. The learner clicks ▶ Executa and sees the output before reading the rationale.
- **No external assets** beyond Google Fonts (`Space Mono`). No images, no videos.
- **Pages are static HTML files** that share `curs/curs.css` and `curs/capitols.js`. Each chapter is one self-contained `.html` file.

---

## 2. Existing architecture (must be respected)

### 2.1 File layout for the course
```
curs/
├── index.html          ← Course landing (auto-generated cards from CAPITOLS_DATA + REPTES_DATA)
├── curs.css            ← All styling for chapter and repte pages
├── capitols.js         ← Data + sidebar/glossari/simulator renderers (single source of truth)
├── capitol-1.html      ← Hola, Python!                    (DONE)
├── capitol-2.html      ← Variables                        (DONE)
├── capitol-3.html      ← Operacions i input               (DONE)
├── capitol-4.html      ← Decisions: if, elif, else        (DONE)
├── capitol-5.html      ← Repetir amb while                (DONE)
├── capitol-6.html      ← Repetir amb for i range          (DONE)
├── capitol-7.html      ← Treballant amb text               (DONE)
├── capitol-8.html      ← Llistes                          (DONE)
├── capitol-9.html      ← Funcions                            (DONE)
├── capitol-10.html     ← Diccionaris                         (DONE)
├── capitol-11.html     ← Posant-ho tot junt                  (DONE)
└── repte-1.html        ← El primer programa    (DONE — only existing repte)
```

### 2.2 How a chapter page is wired

Every chapter HTML has the same skeleton. Copy this exactly, only changing the title, the active-link of the top nav, the chapter number, and the content:

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capítol N — TÍTOL | PyCat</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="curs.css">
</head>
<body>

<header class="curs-header">
  <button id="sidebar-toggle" aria-label="Mostra/amaga els capítols" aria-expanded="false">☰</button>
  <span class="curs-header-logo">
    <span class="logo-icon"></span>
    PyCat
  </span>
  <nav class="curs-nav">
    <a href="capitol-1.html" class="active">Capítols</a>
    <a href="repte-1.html">Reptes</a>
    <a href="../index.html">Simulador</a>
  <div class="curs-header-actions"></div>   <!-- glossari injects itself here -->
</header>

<div class="curs-layout">
  <div id="sidebar-overlay" aria-hidden="true"></div>
  <nav id="sidebar" class="curs-sidebar" aria-label="Capítols del curs">
    <div id="sidebar-nav"></div>
  </nav>

  <main class="curs-content">
    <div class="chapter-content-inner">

      <header class="chapter-header">
        <span class="chapter-badge">Capítol N</span>
        <h1>TÍTOL</h1>
        <p class="chapter-lead">One sentence describing what the learner will be able to do after this chapter.</p>
      </header>

      <!-- Sections go here. Each <section class="chapter-section"> has one <h2> and 1–4 simuladors. -->

      <nav class="chapter-nav" aria-label="Navegació entre capítols">
        <a href="capitol-{N-1}.html" class="btn-nav btn-nav--prev">← Capítol anterior</a>
        <a href="capitol-{N+1}.html" class="btn-nav btn-nav--next">Capítol següent →</a>
      </nav>

    </div>
  </main>
</div>

<script src="capitols.js"></script>
<script>
  injectCursLogo();
  renderSidebar(N);          /* number of THIS chapter — highlights it in the sidebar */
  renderSimuladors();
  initSidebarToggle();
</script>

</body>
</html>
```

### 2.3 The `<div class="simulador">` runnable widget

This is the heart of every page. It becomes an `<iframe>` to `index.html` that runs Python in Pyodide. **Available data attributes** (all optional except `data-code`):

| Attribute       | Purpose                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `data-code`     | Initial Python code shown in the editor (multi-line, raw text)          |
| `data-readonly` | `"true"` → editor is locked (use for "look but don't touch" examples)    |
| `data-height`   | iframe height in px (default ≈ 320; use 360–420 for longer code)        |
| `data-stdin`    | Pre-filled input fed line-by-line to `input()` calls                    |
| `data-expected` | Exact expected stdout. Triggers ✓/✗ feedback below the iframe           |
| `data-tests`    | JSON list of `{stdin, expected}` cases for input-driven exercises       |
| `data-testcode` | Hidden Python code appended after the user's code (for unit tests)      |
| `data-goal-id`  | Unique id for validated exercises (required for ✓/✗ feedback)           |

**Two flavours of simulador** to use throughout the course:

1. **Demo** (most common):
   ```html
   <div class="simulador" data-code='print("Hola!")'></div>
   ```
   Just runnable; no validation.

2. **Exercise** (one per chapter, near the end, in a `<h2>Exercici</h2>` section):
   ```html
   <div class="simulador"
        data-code="# Escriu el teu codi aquí"
        data-expected="resultat exacte línia per línia"
        data-goal-id="cap-N-ex">
   </div>
   ```
   Validation runs automatically. The `data-goal-id` must be globally unique — convention: `cap-{N}-ex` for chapter exercises, `repte-{N}` for reptes.

### 2.4 Sidebar + Glossari behaviour (already implemented, do not touch)

- `renderSidebar(n)` shows **only chapters** (highlights chapter `n`). Call this on every `capitol-*.html`.
- `renderReptesSidebar(n)` shows **only reptes** (highlights repte `n`). Call this on every `repte-*.html`.
- The sidebar is `position: sticky` — it stays in place while the learner scrolls the chapter prose.
- The Glossari button (📖 top-right of the header) is auto-injected by `capitols.js`. The glossari content lives inside `initGlossariCurs()` in `capitols.js`. **If a new chapter introduces new built-in functions, operators, or keywords, you must extend the glossari grid in that function** — the glossari is a single global reference, not per-chapter.

### 2.5 Registering a new chapter

After creating `capitol-N.html`, add a row to the `CAPITOLS_DATA` array at the top of `curs/capitols.js`:
```js
{ num: N,  titol: 'Title here',  arxiu: 'capitol-N.html' },
```
The course index page and both sidebars will pick it up automatically.

---

## 3. The 10-chapter curriculum

Three chapters already exist; you must write the remaining seven. The progression is designed so that each chapter introduces **one** new core idea and reuses everything from previous chapters.

| #  | Title (Catalan)                       | Status   | New concept                                                |
|----|---------------------------------------|----------|------------------------------------------------------------|
| 1  | Hola, Python!                         | **DONE** | `print()`, comments, strings                                |
| 2  | Variables                             | **DONE** | Assignment, types (`int`, `float`, `str`, `bool`), f-strings |
| 3  | Operacions i input                    | **DONE** | Arithmetic, `input()`, `int()`/`float()` casting            |
| 4  | Decisions: `if`, `elif`, `else`       | **DONE**   | Conditionals, comparison operators, indentation             |
| 5  | Repetir amb `while`                   | **DONE**   | `while` loop, accumulators, sentinel-controlled loops       |
| 6  | Repetir amb `for` i `range`           | **DONE** | `for` over `range`, counters, nested loops                  |
| 7  | Treballant amb text                   | **DONE** | String indexing, slicing, methods, `len()`                  |
| 8  | Llistes                               | **DONE** | Lists, indexing, `append`, iteration with `for x in lst`    |
| 9  | Funcions                              | **DONE** | `def`, parameters, `return`, scope                          |
| 10 | Diccionaris                           | **DONE** | Key-value pairs, `.keys()`, `.values()`, `.items()`, iteration |
| 11 | Posant-ho tot junt                    | **DONE** | Mini-project that combines chapters 1–10                    |

### 3.1 Chapter-by-chapter detail

Each chapter must contain, in order:

- A `<header class="chapter-header">` with badge, `<h1>`, and a one-sentence `chapter-lead`.
- 4–7 `<section class="chapter-section">` blocks, each with one `<h2>` and at least one `<div class="simulador">`.
- An `<h2>Errors típics</h2>` section showing the 2–3 most common mistakes (use a read-only simulador with broken code so the learner sees the actual `Traceback`).
- An `<h2>Exercici</h2>` section with one validated exercise (`data-goal-id="cap-N-ex"`).
- An `<h2>Resum</h2>` section with a `<ul>` of 4–6 bullet takeaways.
- The `<nav class="chapter-nav">` with prev/next links.

#### Capítol 4 — Decisions: `if`, `elif`, `else`
- **Lead:** "Els programes interessants prenen decisions: fan una cosa o una altra segons les dades."
- **Sections:** Comparacions (`==`, `!=`, `<`, `>`, `<=`, `>=`) → `if` simple → `if/else` → `if/elif/else` → indentació (errors típics: oblidar els `:` o barrejar tabs i espais) → operadors `and`/`or`/`not` (light intro, full coverage in cap. 9 if needed) → exercici: classificar una nota numèrica (0–10) en suspens/aprovat/notable/excel·lent.
- **Update glossari with:** `==`, `!=`, `<`, `>`, `<=`, `>=`, `and`, `or`, `not` (already present from current Python glossari — verify and keep).

#### Capítol 5 — Repetir amb `while`
- **Lead:** "Quan no saps quantes vegades has de repetir una cosa, fas servir `while`."
- **Sections:** Què és un bucle → `while` amb comptador (`i = 0; while i < 5:`) → `while` amb una condició de l'usuari (`while resposta != "sí":`) → bucles infinits i com sortir (`break`) → bucles que no s'executen mai → exercici: endevinar un número (l'ordinador té un número, l'usuari intenta endevinar-lo amb `input()`, el programa diu "més gran" o "més petit" fins que encerta).
- **Update glossari with:** `break`, `continue`.

#### Capítol 6 — Repetir amb `for` i `range`
- **Lead:** "Si saps quantes vegades has de repetir una cosa, `for` és més curt i clar que `while`."
- **Sections:** `for i in range(n)` → `range(start, stop)` i `range(start, stop, step)` → bucles imbricats (taula de multiplicar) → quan triar `for` vs `while` → errors típics (off-by-one, modificar `i` dins del bucle) → exercici: imprimir un triangle de `*` d'alçada N.
- **Update glossari with:** `range()`.

#### Capítol 7 — Treballant amb text
- **Lead:** "Els textos no són una caixa tancada: pots mirar-ne caràcters, tallar-los i transformar-los."
- **Sections:** Indexació (`text[0]`, `text[-1]`) → llargada amb `len()` → slicing (`text[1:4]`, `text[::-1]`) → mètodes habituals (`.upper()`, `.lower()`, `.strip()`, `.replace()`, `.split()`) → comprovacions (`in`, `startswith`, `endswith`) → recórrer un text amb `for c in text:` → exercici: comptar quantes vocals té una paraula que entra l'usuari.
- **Update glossari with:** `len()`, `.upper()`, `.lower()`, `.strip()`, `.replace()`, `.split()`, `in`.

#### Capítol 8 — Llistes
- **Lead:** "Una llista guarda diversos valors en una sola variable, en ordre."
- **Sections:** Crear una llista (`numeros = [1, 2, 3]`) → indexació i `len()` → afegir i treure (`.append()`, `.pop()`, `del`) → recórrer amb `for x in llista:` → recórrer amb índex (`for i in range(len(llista)):`) → llistes de strings + `.split()` → exercici: demanar 5 números i mostrar la mitjana.
- **Update glossari with:** `[]`, `.append()`, `.pop()`, `sum()`, `min()`, `max()`, `sorted()`.

#### Capítol 9 — Funcions
- **Lead:** "Les funcions són trossos de codi amb nom: les escrius una vegada i les fas servir tantes vegades com vulguis."
- **Sections:** Per què funcions (DRY) → `def` sense paràmetres → `def` amb paràmetres → `return` vs `print` (importantíssim, posa exemples contrastats) → diversos paràmetres → variables locals vs globals (light intro: una funció no veu les variables de fora si no se li passen) → exercici: una funció `es_primer(n)` que retorna `True`/`False`.
- **Update glossari with:** `def`, `return`, `True`, `False`, `None`.

#### Capítol 10 — Diccionaris
- **Lead:** "Les llistes guarden valors ordenats per posició. Els diccionaris guarden valors per clau — com un diccionari real, on busques una paraula i trobes la definició."
- **Sections:** Crear un diccionari i accedir-hi (`d = {"clau": valor}`, `d["clau"]`) → afegir, modificar i eliminar entrades (`d["nova"] = x`, `del d["clau"]`) → mètodes útils (`.keys()`, `.values()`, `.items()`) → recórrer un diccionari amb `for` → comprovar si una clau existeix (`"clau" in d`) → errors típics (`KeyError` en accedir a una clau inexistent) → exercici: comptar la freqüència de cada lletra d'una paraula.
- **Update glossari with:** `{}`, `.keys()`, `.values()`, `.items()`, `KeyError`.

#### Capítol 11 — Posant-ho tot junt
- **Lead:** "Hora de combinar tot el que has après en un programa de veritat."
- **Format:** Aquest capítol és diferent: en lloc d'introduir conceptes nous, guia el lector a través de la construcció d'un mini-programa pas a pas. Suggested project: **"Quiz de cultura general"** — el programa té una llista de preguntes-respostes, les fa en ordre aleatori, compta encerts i mostra una nota final. Cada secció afegeix una peça (les dades, el bucle principal, la funció `pregunta()`, la puntuació, el missatge final segons la nota) i conté un simulador amb la versió incremental del codi.
- **Closing:** Una secció final "I ara què?" que apunta cap a temes que el curs no cobreix (fitxers, llibreries, classes) i recomana on continuar.
- **No `Exercici` formal**, però sí un repte obert: "Modifica el quiz perquè...".

---

## 4. Style and quality rules

These rules are non-negotiable. They are what makes PyCat consistent.

1. **Show, then tell.** Every new concept appears first as a runnable simulador the learner can click. The explanation comes after the example, not before.
2. **Examples must run as-is.** Every `data-code` block must produce the documented output without modification. Test mentally (or actually) before committing.
3. **Variable names in Catalan.** `nom`, `edat`, `numeros`, `resposta` — never `name`, `age`, `numbers`. Python keywords stay in English (`if`, `while`, `def`).
4. **Comments in code use `#` and are in Catalan.** Sparingly — code that needs many comments is usually badly written.
5. **Avoid English jargon.** "Bucle" not "loop", "llista" not "list" *in prose*. Use the English term once in parentheses the first time it appears.
6. **One concept per simulador.** If you find yourself wanting to explain two things about a single example, split it into two.
7. **Errors are content.** A read-only simulador showing a buggy program and its `Traceback` is one of the most pedagogically valuable elements. Use them.
8. **No screenshots, no images.** PyCat is text-only by design.
9. **Length target per chapter:** ~250–400 lines of HTML (look at `capitol-3.html` as the reference).
10. **Each chapter must end navigable.** Both prev and next `chapter-nav` links must point to existing files. Update them when you add the next chapter.

---

## 5. Step-by-step workflow for each new chapter

For chapter `N`:

1. Read `capitol-3.html` end-to-end as the structural template.
2. Read the section "Chapter-by-chapter detail" above for chapter `N`.
3. Create `curs/capitol-N.html` from the skeleton in §2.2.
4. Write the sections in order. After each section, mentally run the simulador's `data-code` and confirm the expected output.
5. Add the `Exercici` simulador with `data-goal-id="cap-N-ex"` and a precise `data-expected` (or `data-tests` if input-driven).
6. Open `curs/capitols.js` and:
   - Add `{ num: N, titol: '…', arxiu: 'capitol-N.html' }` to `CAPITOLS_DATA`.
   - If new built-ins / operators / keywords appeared in the chapter, add them to the relevant `<div class="glossari-grid">` block inside `initGlossariCurs()`.
7. Update the `chapter-nav` of `capitol-{N-1}.html` so its "següent" link is no longer disabled.
8. Verify by opening `curs/index.html` in a browser: the new card must appear, clicking it must load the new chapter, the sidebar must highlight chapter `N`, and the exercise must show ✓ when the correct code is entered.

---

## 6. Out of scope (do not write)

- New reptes (the reptes track is a separate workstream).
- Changes to `index.html`, `js/pyrunner.js`, `js/editor.js`, or anything outside `curs/`.
- New CSS rules in `curs/curs.css` unless absolutely required for a new content type — and even then, prefer reusing existing classes.
- A dark theme for the course (the course is light-only by design).
- Translation to other languages.

---

**Tots els capítols han estat escrits. El curs és complet.**

---

## 7. Historial de canvis

| Data       | Capítols escrits | Arxius modificats |
|------------|-----------------|-------------------|
| 2026-04-14 | 4, 5            | `capitol-4.html` (nou), `capitol-5.html` (nou), `capitol-3.html` (nav arreglat), `capitols.js` (CAPITOLS_DATA + glossari `break`/`continue`) |
| 2026-04-14 | 6               | `capitol-6.html` (nou), `capitols.js` (CAPITOLS_DATA + glossari `range()`), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat) |
| 2026-04-14 | 7               | `capitol-7.html` (nou), `capitols.js` (CAPITOLS_DATA + glossari mètodes de text), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat) |
| 2026-04-14 | 8               | `capitol-8.html` (nou), `capitols.js` (CAPITOLS_DATA + glossari secció Llistes amb `[]`, `.append()`, `.pop()`, `sum()`, `min()`, `max()`, `sorted()`), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat) |
| 2026-04-14 | 9               | `capitol-9.html` (nou), `capitols.js` (CAPITOLS_DATA + glossari secció Funcions amb `def`, `return`, `None`, `True`, `False`), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat) |
| 2026-04-14 | 10              | `capitol-10.html` (nou — Diccionaris), `capitols.js` (CAPITOLS_DATA + glossari `{}`, `.keys()`, `.values()`, `.items()`, `KeyError`), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat) |
| 2026-04-14 | 11              | `capitol-11.html` (nou — Posant-ho tot junt), `capitols.js` (CAPITOLS_DATA + glossari `random.shuffle()`), `PYCAT-CURRICULUM-PLAN.md` (estat actualitzat — curs complet) |
