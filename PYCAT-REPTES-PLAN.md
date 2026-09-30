# PyCat — Reptes Plan (15 Challenges, Increasing Difficulty)

> **Audience:** This document is written for an AI assistant that will author the 15 reptes (challenges) of the PyCat course. Read it in full before producing any HTML.

---

## 1. Project context

PyCat is a browser-based interactive Python course written in **vanilla HTML / CSS / JavaScript** — no build step, no framework, no bundler. Every page is a self-contained `.html` file that loads the same `curs/curs.css` and `curs/capitols.js`. Real Python runs in the browser via **Pyodide** (CPython 3.12 compiled to WebAssembly), so the learner writes genuine Python and sees genuine `Traceback`s.

PyCat is the spiritual successor of **KarelCat**, a Catalan course that teaches programming with a Karel-the-Robot-style virtual creature. KarelCat's challenge track has 13 reptes; PyCat's mirrors that idea but adapts it to a text-only Python world: instead of "did Karel reach the goal cell?", the validator asks "did the program produce the expected stdout?".

Key product facts you must respect:

- **Language of all content:** Catalan. Statements, hints, code comments, variable names — everything is in Catalan. Python keywords (`if`, `while`, `def`, ...) stay in English.
- **Audience:** absolute beginners, typically 12–16 years old, often coming straight from KarelCat. They have just learned variables, conditionals, loops and functions, but they have written very little real Python.
- **Tone:** warm, concise, second-person singular ("Escriu un programa que...", "Fixa't que...").
- **Static, static, static.** No external assets beyond Google Fonts. No images, no videos, no server.
- **Reptes are the *applied* track.** Capítols teach concepts; reptes ask the learner to combine them. A repte never introduces a new concept — it can only assume what previous capítols have covered.

---

## 2. Existing architecture (must be respected)

### 2.1 File layout
```
curs/
├── index.html                 ← Course landing
├── curs.css                   ← All styling
├── capitols.js                ← Data + sidebar/glossari/simulador renderers
├── capitol-1.html ... capitol-10.html
├── repte-1.html               ← El primer programa  (DONE — only existing repte)
├── repte-2.html               ← TO WRITE
├── ...
└── repte-15.html              ← TO WRITE
```

### 2.2 How a repte page is wired

Every repte HTML follows the same skeleton. Use `repte-1.html` as the canonical reference and copy this structure exactly, only changing the title, badge color, statement, and simulador attributes:

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repte N — TÍTOL | PyCat</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="curs.css">
</head>
<body>

<header class="curs-header">
  <button id="sidebar-toggle" aria-label="Mostra/amaga els reptes" aria-expanded="false">☰</button>
  <span class="curs-header-logo">
    <span class="logo-icon"></span>
    PyCat
  </span>
  <nav class="curs-nav">
    <a href="capitol-1.html">Capítols</a>
    <a href="repte-1.html" class="active">Reptes</a>
    <a href="../index.html">Simulador</a>
  <div class="curs-header-actions"></div>
</header>

<div class="curs-layout">
  <div id="sidebar-overlay" aria-hidden="true"></div>
  <nav id="sidebar" class="curs-sidebar" aria-label="Reptes del curs">
    <div id="sidebar-nav"></div>
  </nav>

  <main class="curs-content">

    <header class="chapter-header">
      <span class="chapter-badge" style="background: {COLOR_BG}; color: {COLOR_FG};">
        ⚡ Repte N — {DIFFICULTY_LABEL}
      </span>
      <h1>TÍTOL</h1>
    </header>

    <section class="chapter-section">
      <h2>Objectiu</h2>
      <!-- Clear, short statement of the problem, with examples of expected behaviour. -->

      <h2>Simulador</h2>
      <p>Escriu el teu codi i prem <strong>▶ Executa</strong>. El sistema verificarà automàticament si la sortida és correcta.</p>

      <div class="simulador"
           data-code="# Repte N: TÍTOL
# Comentaris-guia que orienten sense donar la solució

"
           data-expected="línia 1
línia 2
línia 3"
           data-goal-id="repte-N"
           data-height="340">
      </div>
    </section>

    <details style="margin-top: 1.5rem;">
      <summary style="cursor:pointer; font-size:0.82rem; color:var(--muted);">💡 Pista</summary>
      <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--muted);">
        Hint text — never the full solution, just the technique that unlocks it.
      </p>
    </details>

    <nav class="chapter-nav">
      <a href="repte-{N-1}.html">← Repte anterior</a>
      <a href="repte-{N+1}.html">Repte següent →</a>
    </nav>

  </main>
</div>

<script src="capitols.js"></script>
<script>
  injectCursLogo();
  renderReptesSidebar(N);
  renderSimuladors();
  initSidebarToggle();
</script>

</body>
</html>
```

### 2.3 Difficulty badge colors

Use the `style` attribute on `chapter-badge` to color-code the difficulty. Stick to these exact values for visual consistency:

| Difficulty   | Label         | Background | Foreground |
|--------------|---------------|------------|------------|
| Easy         | `Fàcil`       | `#d1fae5`  | `#065f46`  |
| Intermediate | `Intermedi`   | `#fef3c7`  | `#92400e`  |
| Hard         | `Difícil`     | `#fee2e2`  | `#991b1b`  |

Example: `<span class="chapter-badge" style="background: #fef3c7; color: #92400e;">⚡ Repte 7 — Intermedi</span>`

### 2.4 The validation contract

A repte is **only** validated through the `<div class="simulador">` widget. There are three validation modes — pick the one that fits the problem:

**Mode A — Single fixed expected output** (no input, deterministic program)
```html
<div class="simulador"
     data-code="..."
     data-expected="exact stdout, line by line"
     data-goal-id="repte-N">
</div>
```

**Mode B — Single fixed input + single expected output** (one `input()` scenario)
```html
<div class="simulador"
     data-code="..."
     data-stdin="42"
     data-expected="El doble és 84"
     data-goal-id="repte-N">
</div>
```

**Mode C — Multiple test cases** (the program must work for several inputs)
```html
<div class="simulador"
     data-code="..."
     data-tests='[
       {"input":"5","expected":"Parell? False"},
       {"input":"8","expected":"Parell? True"},
       {"input":"0","expected":"Parell? True"}
     ]'
     data-goal-id="repte-N">
</div>
```
For Mode C: `data-tests` is a JSON array of `{input, expected}` objects. Each `input` is a single string (newline-separated if the program calls `input()` multiple times). **Always use Mode C when the program reads input and the answer depends on the input** — otherwise the learner can hardcode the answer.

### 2.5 Rules for `data-expected`

- It must be the **exact** stdout of a correct solution, character for character.
- No trailing newline (the validator strips trailing whitespace, but be conservative).
- Match Python's default `print()` behaviour: each `print(x)` adds a newline; `print(x, y)` joins with a single space; numbers print without quotes; strings print without quotes.
- If the expected output contains an apostrophe like `M'encanta`, the HTML attribute must use double quotes around the value: `data-expected="M'encanta"`.

### 2.6 Registering a new repte

After creating `repte-N.html`, add a row to `REPTES_DATA` in `curs/capitols.js`:
```js
{ num: N, titol: 'Title here', arxiu: 'repte-N.html' },
```
The course index page (`curs/index.html`) and the reptes sidebar pick it up automatically.

### 2.7 Sidebar + Glossari (already implemented)

- `renderReptesSidebar(n)` shows **only reptes** and highlights repte `n`.
- The sidebar is `position: sticky` — it stays in view while the learner scrolls.
- The 📖 Glossari button (top-right) is auto-injected and contains a global Python reference. **Reptes never modify the glossari** — they can only use what is already documented there.

---

## 3. The 15 reptes

Three difficulty buckets, five reptes each. The progression assumes the corresponding capítol has been studied; do **not** require concepts from a chapter the learner cannot have read yet.

| #  | Title                          | Difficulty   | Requires up to capítol |
|----|--------------------------------|--------------|-----------------------|
| 1  | El primer programa             | Fàcil        | 1 (`print`)           |
| 2  | Presenta't                     | Fàcil        | 3 (`input`, f-strings)|
| 3  | La calculadora ràpida          | Fàcil        | 3 (arithmetic + cast) |
| 4  | Anys, mesos, dies              | Fàcil        | 3                     |
| 5  | Canvi de moneda                | Fàcil        | 3                     |
| 6  | Parell o senar                 | Intermedi    | 4 (`if`, `%`)         |
| 7  | El més gran de tres            | Intermedi    | 4                     |
| 8  | Compte enrere                  | Intermedi    | 5 (`while`)           |
| 9  | La taula de multiplicar        | Intermedi    | 6 (`for`, `range`)    |
| 10 | Comptar paraules               | Intermedi    | 7 (strings, `.split()`)        |
| 11 | La funció saluda               | Difícil      | 9 (functions, `return`)        |
| 12 | Paraula al revés               | Difícil      | 7                     |
| 13 | La mitjana                     | Difícil      | 8 (lists)             |
| 14 | És palíndrom?                  | Difícil      | 9 (functions)         |
| 15 | FizzBuzz                       | Difícil      | 9 (combine everything)|

### Repte 1 — El primer programa  *(EXISTS, do not rewrite)*
- **Statement:** print three exact lines.
- **Validation:** Mode A.
- **Goal-id:** `repte-1`.

### Repte 2 — Presenta't
- **Statement:** Demana el nom a l'usuari amb `input("Com et dius? ")` i mostra `Hola, NOM!` (substituint NOM pel nom escrit).
- **Validation:** Mode C with at least 3 cases (`Anna` → `Hola, Anna!`, `Pere` → `Hola, Pere!`, `Júlia` → `Hola, Júlia!`).
- **Hint:** "Fes servir una f-string: `print(f\"Hola, {nom}!\")`."
- **Goal-id:** `repte-2`.

### Repte 3 — La calculadora ràpida
- **Statement:** Llegeix dos nombres enters i mostra'n la suma, la resta, el producte i la divisió, un per línia, en aquest format:
  ```
  Suma: 12
  Resta: 8
  Producte: 20
  Divisió: 5.0
  ```
- **Validation:** Mode C with at least 3 cases. Each `input` has two newline-separated numbers. Example: `"10\n2"` → `"Suma: 12\nResta: 8\nProducte: 20\nDivisió: 5.0"`.
- **Hint:** "Recorda que `input()` retorna text. Has de convertir-lo amb `int()` abans d'operar."
- **Goal-id:** `repte-3`.

### Repte 4 — Anys, mesos, dies
- **Statement:** Llegeix una edat en anys i mostra-la convertida a mesos i dies (assumeix 1 any = 12 mesos = 365 dies). Format:
  ```
  Mesos: 144
  Dies: 4380
  ```
- **Validation:** Mode C with ≥ 3 cases (`12`, `7`, `25`).
- **Hint:** "Multiplica per 12 i per 365. Fes servir `print()` dues vegades."
- **Goal-id:** `repte-4`.

### Repte 5 — Canvi de moneda
- **Statement:** Llegeix una quantitat en euros (pot tenir decimals) i mostra l'equivalent en dòlars amb un canvi fix d'1.08. La sortida ha de tenir 2 decimals.
  ```
  Entrada: 50
  Sortida: 50.0 € = 54.00 $
  ```
- **Validation:** Mode C with ≥ 3 cases (`50`, `100`, `7.5`).
- **Hint:** "Fes servir `float(input())` per llegir, i una f-string amb format: `f\"{euros} € = {dolars:.2f} $\"`."
- **Goal-id:** `repte-5`.

### Repte 6 — Parell o senar
- **Statement:** Llegeix un nombre enter i mostra `Parell` si és parell o `Senar` si no ho és.
- **Validation:** Mode C with ≥ 4 cases (`4`, `7`, `0`, `-3`).
- **Hint:** "L'operador `%` retorna el residu d'una divisió. Si `n % 2 == 0`, és parell."
- **Goal-id:** `repte-6`.

### Repte 7 — El més gran de tres
- **Statement:** Llegeix tres nombres enters (un per línia) i mostra el més gran.
- **Validation:** Mode C with ≥ 4 cases including ties (`3\n7\n5` → `7`, `10\n10\n2` → `10`, `-5\n-1\n-9` → `-1`).
- **Hint:** "Fes servir `if`/`elif`/`else` o, més curt, `max(a, b, c)`."
- **Goal-id:** `repte-7`.

### Repte 8 — Compte enrere
- **Statement:** Llegeix un nombre enter `n` i mostra el compte enrere de `n` fins a `0`, un nombre per línia. Després escriu `Boom!`.
- **Validation:** Mode C with ≥ 3 cases (`3` → `3\n2\n1\n0\nBoom!`, `5` → `5\n4\n3\n2\n1\n0\nBoom!`, `0` → `0\nBoom!`).
- **Hint:** "Comença amb `i = n` i fes un `while i >= 0:` que mostri `i` i el redueixi en 1."
- **Goal-id:** `repte-8`.

### Repte 9 — La taula de multiplicar
- **Statement:** Llegeix un nombre enter `n` i mostra la seva taula de multiplicar de l'1 al 10, en aquest format:
  ```
  3 x 1 = 3
  3 x 2 = 6
  ...
  3 x 10 = 30
  ```
- **Validation:** Mode C with ≥ 3 cases (`3`, `7`, `1`).
- **Hint:** "Fes un `for i in range(1, 11):` i dins fes un `print(f\"{n} x {i} = {n*i}\")`."
- **Goal-id:** `repte-9`.

### Repte 10 — Comptar paraules
- **Statement:** Llegeix una frase i mostra quantes paraules conté (les paraules estan separades per espais). Format: `Paraules: N`.
  ```
  Entrada: Hola món           →  Paraules: 2
  Entrada: Python és divertit →  Paraules: 3
  Entrada: hola               →  Paraules: 1
  ```
- **Validation:** Mode C with ≥ 5 cases (`Hola món` → `Paraules: 2`, `Python és divertit` → `Paraules: 3`, `hola` → `Paraules: 1`, `el cel és blau avui` → `Paraules: 5`, `un dos tres quatre` → `Paraules: 4`).
- **Hint:** "`paraules = frase.split()` retorna una llista de paraules. Després `len(paraules)` et dona el nombre."
- **Goal-id:** `repte-10`.

### Repte 11 — La funció saluda
- **Statement:** Defineix una funció `saluda(nom)` que rebi un nom com a paràmetre i **retorni** (no imprimeixi) el string `"Hola, [nom]! Benvingut/da a Python."`. Després el programa ha de llegir un nom per teclat, cridar la funció i imprimir el resultat.
  ```
  Entrada: Ada    →  Hola, Ada! Benvingut/da a Python.
  Entrada: PyCat  →  Hola, PyCat! Benvingut/da a Python.
  ```
- **Validation:** Mode C with ≥ 4 cases (`Ada` → `Hola, Ada! Benvingut/da a Python.`, `PyCat` → `Hola, PyCat! Benvingut/da a Python.`, `Món` → `Hola, Món! Benvingut/da a Python.`, `Python` → `Hola, Python! Benvingut/da a Python.`).
- **Hint:** "Dins de `saluda`, usa `return f\"Hola, {nom}! Benvingut/da a Python.\"`. Recorda que `return` envia el valor de tornada; `print(saluda(nom))` al final l'imprimeix."
- **Goal-id:** `repte-11`.

### Repte 12 — Paraula al revés
- **Statement:** Llegeix una paraula i mostra-la del revés. Mostra-la primer normal i després invertida, en dues línies:
  ```
  Entrada: hola
  Sortida:
  Original: hola
  Invertida: aloh
  ```
- **Validation:** Mode C with ≥ 4 cases (`hola`, `Python`, `a`, `radar`).
- **Hint:** "Slicing té un truc: `text[::-1]` retorna el text del revés. També es pot fer amb un `for` i acumulant en una variable."
- **Goal-id:** `repte-12`.

### Repte 13 — La mitjana
- **Statement:** Llegeix nombres un per línia fins que l'usuari escrigui `fi`. Mostra la mitjana dels nombres llegits amb 2 decimals. Si no s'ha introduït cap nombre, mostra `Cap nombre`.
  ```
  Entrada: 4 \n 6 \n 10 \n fi
  Sortida: Mitjana: 6.67
  ```
- **Validation:** Mode C with ≥ 4 cases including the empty case (`fi` → `Cap nombre`, `5\nfi` → `Mitjana: 5.00`, `2\n4\n6\nfi` → `Mitjana: 4.00`, `1\n2\nfi` → `Mitjana: 1.50`).
- **Hint:** "Fes una llista buida, fes un `while True:` que llegeixi i `break` quan vegi `fi`. Després `sum(llista) / len(llista)` és la mitjana."
- **Goal-id:** `repte-13`.

### Repte 14 — És palíndrom?
- **Statement:** Defineix una funció `es_palindrom(text)` que retorni `True` si el text és un palíndrom (es llegeix igual del dret i del revés, ignorant majúscules) i `False` si no. Després llegeix una paraula amb `input()` i mostra `Sí` o `No` segons el resultat.
  ```
  Entrada: radar  → Sí
  Entrada: hola   → No
  Entrada: Anna   → Sí
  ```
- **Validation:** Mode C with ≥ 5 cases including mixed case (`radar` → `Sí`, `Anna` → `Sí`, `hola` → `No`, `a` → `Sí`, `Python` → `No`).
- **Hint:** "Compara `text.lower()` amb `text.lower()[::-1]`."
- **Goal-id:** `repte-14`.

### Repte 15 — FizzBuzz
- **Statement:** Llegeix un nombre enter `n` i mostra els nombres de l'1 al `n`, un per línia, però:
  - Si el nombre és múltiple de 3 → escriu `Fizz` en lloc del nombre.
  - Si és múltiple de 5 → escriu `Buzz`.
  - Si és múltiple de 3 i de 5 alhora → escriu `FizzBuzz`.

  Exemple per a `n = 15`:
  ```
  1
  2
  Fizz
  4
  Buzz
  Fizz
  7
  8
  Fizz
  Buzz
  11
  Fizz
  13
  14
  FizzBuzz
  ```
- **Validation:** Mode C with ≥ 3 cases (`5`, `15`, `30`).
- **Hint:** "Comença per la condició més restrictiva: si és múltiple de 15, és FizzBuzz. Després les altres dues."
- **Goal-id:** `repte-15`.

---

## 4. Style and quality rules

These rules are non-negotiable. They are what makes the reptes track consistent.

1. **One concept per repte.** A repte tests one combination of techniques, never a grab bag.
2. **The statement must be unambiguous.** Show at least one input → output example for any non-trivial case. The learner should never have to guess the output format.
3. **Test cases are the contract.** If `data-tests` doesn't include a case, the learner is allowed to fail on it. Cover edge cases (zero, negative, single element, empty).
4. **The starter `data-code` is helpful, not solved.** Include the comment header and one or two lines that frame the problem (e.g., `n = int(input())`), but never write the logic.
5. **Hints unlock, don't solve.** A hint names the technique (slicing, modulo, accumulator) but does not write the line. The learner must do the typing.
6. **Variable names in Catalan.** `nom`, `edat`, `numeros`, `text` — never `name`, `age`, `numbers`. Python keywords stay in English.
7. **Match the curriculum strictly.** Repte `K` must be solvable with only what capítols `1..M(K)` cover (see the table in §3). Never require a built-in not in the glossari.
8. **Format strings count.** If the expected output is `Mitjana: 6.67`, that exact spacing and capitalization is the contract. Be deliberate.
9. **No trailing newline in `data-expected`.**
10. **Failure messages are pedagogical.** The validator already prints `✗ La sortida no coincideix amb l'esperada`. Don't override it.

---

## 5. Step-by-step workflow for each new repte

For repte `N`:

1. Read `repte-1.html` end-to-end as the structural template.
2. Read the §3 entry for repte `N`.
3. Create `curs/repte-N.html` from the skeleton in §2.2.
4. Pick the right validation mode (A/B/C from §2.4). For input-driven reptes, **always use Mode C** with at least 3 cases — more for tricky problems.
5. Write a known-good Python solution mentally (or in a scratch file) and run it against each `data-tests` case to derive the `expected` strings character by character. A single wrong character breaks the validator.
6. Add the `<details>` hint block. Keep it to 1–2 sentences.
7. Open `curs/capitols.js` and add `{ num: N, titol: '…', arxiu: 'repte-N.html' }` to `REPTES_DATA`.
8. Update the `chapter-nav` of `repte-{N-1}.html` so its "següent" link is no longer a placeholder.
9. Verify in a browser: the new card appears on `curs/index.html`, the reptes sidebar highlights repte `N`, the simulador runs, and submitting a known-good solution shows `✓ Correcte!`.

---

## 6. Out of scope (do not write)

- New capítols (the curriculum track is a separate workstream — see `PYCAT-CURRICULUM-PLAN.md`).
- Changes to `index.html`, `js/pyrunner.js`, `js/main.js`, or anything outside `curs/`.
- New CSS rules. Reuse the existing classes.
- A reptes sub-track for "very easy" or "expert" — the 5+5+5 split is the product spec.
- Per-repte glossari or hints beyond the single `<details>` block.
- Translations.

---

**End of plan. Begin with `repte-2.html`.**
