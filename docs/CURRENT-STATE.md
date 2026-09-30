# PyCat — Estat actual del projecte

> **Font única de veritat.** Aquest document descriu l'estat real del projecte.
> Qualsevol canvi que modifiqui l'arquitectura, el comportament, el contingut
> del curs o les tasques pendents ha d'actualitzar aquest document en el mateix
> commit.
>
> **Regla d'or:** un document d'estat obsolet és més perillós que no tenir-ne.

---

## 1. Visió general

**PyCat** és un curs interactiu per aprendre **Python real** al navegador, en
català, adreçat a alumnes d'ESO (≈15 anys). És la continuació de
[KarelCat](https://karelcat.step-quiz.net): mateixa filosofia (tot al navegador,
sense instal·lació, interfície minimalista), però executa **CPython 3.12 via
Pyodide 0.27.7 (WebAssembly)** dins d'un Web Worker.

- **Sense pas de compilació**: HTML, CSS i JavaScript «vanilla». N'hi ha prou
  amb `python3 -m http.server` per provar-lo.
- **Interfície i contingut en català.** Les paraules clau de Python, en anglès.
- **Publicat** a Cloudflare Pages: <https://pycat.step-quiz.net>.

---

## 2. Contingut del curs

Els títols coincideixen amb `CAPITOLS_DATA` i `REPTES_DATA` (`curs/capitols.js`).

### 2.1 Capítols (13)

| # | Títol | Exercici validat (`data-goal-id`) | `data-requires` |
|---|-------|-----------------------------------|-----------------|
| 1 | Hola, Python! | `cap-1-ex` | — |
| 2 | Variables | `cap-2-ex` | `variables,fstring` |
| 3 | Operacions i input | `cap-3-ex` | `input` |
| 4 | Decisions: if, elif, else | `cap-4-ex`, `cap-4-bug` | — |
| 5 | Repetir amb while (+ `try`/`except`) | `cap-5-ex`, `cap-5-try` | `while` · `try,while` |
| 6 | Repetir amb for i range | `cap-6-ex`, `cap-6-bug` | `for` · `for` |
| 7 | Treballant amb text | `cap-7-ex` | — |
| 8 | Llistes | `cap-8-ex`, `cap-8-bug` | `list` · `for` |
| 9 | Funcions | `cap-9-ex` (amb `data-testcode`) | `def,return` |
| 10 | Diccionaris | `cap-10-ex` | `dict,for` |
| 11 | Posant-ho tot junt (projecte: quiz) | — | — |
| 12 | 4 en ratlla (capítol extra) | — | — |
| 13 | Dibuixa amb la tortuga (capítol extra) | — (Parsons `cap-13-parsons`) | — |

La barra lateral marca amb ✓ un capítol quan se supera el `goalId` de
`CAPITOLS_DATA` (els altres exercicis d'un capítol no hi compten).

A més dels exercicis amb simulador, els capítols tenen **activitats** (§5.3):

- «🐞 Troba l'error» (exercicis validats amb un programa que té errors): capítols 4, 6 i 8.
- «🧩 Ordena el programa» (problemes de Parsons, `cap-N-parsons`): capítols 4, 6, 9 i 13.
- «Comprova què has après» (qüestionari de 3 preguntes, `cap-N-quiz`): capítols 1–10 i 13.

### 2.2 Reptes (15)

| # | Títol | Dificultat | `data-requires` |
|---|-------|-----------|-----------------|
| 1 | El primer programa | Fàcil | — |
| 2 | Presenta't | Fàcil | — |
| 3 | La calculadora | Fàcil | — |
| 4 | Anys, mesos, dies | Fàcil | — |
| 5 | Canvi de moneda | Fàcil | — |
| 6 | Parell o senar | Intermedi | — |
| 7 | El més gran de tres | Intermedi | — |
| 8 | Compte enrere | Intermedi | — |
| 9 | Taula multiplicar | Intermedi | — |
| 10 | Comptar paraules | Intermedi | — |
| 11 | La funció saluda | Intermedi | `def,return` |
| 12 | Paraula al revés | Difícil | — |
| 13 | La mitjana | Difícil | — |
| 14 | És palíndrom? | Difícil | `def,return` |
| 15 | FizzBuzz | Difícil | — |

Un repte no introdueix conceptes nous: només combina els dels capítols.

---

## 3. Fitxers

```
index.html            Simulador lliure (i simulador incrustat als iframes del curs)
style.css             Estils del simulador
footer.js             Peu de pàgina (llicència). No es mostra dins dels iframes
sw.js                 Kill-switch del Service Worker antic (vegeu §10)
_headers              Capçaleres COOP/COEP per a Cloudflare Pages (SharedArrayBuffer)
img/logo.svg          Logo (simulador i curs)

js/constants.js       Namespace global P, claus de localStorage, CDN de Pyodide
js/i18n.js            Textos de la interfície (P.t(clau)). Només català
js/state.js           Estat centralitzat (P.state)
js/console.js         Consola de sortida, input interactiu, panell stdin
js/errors.js          Explicació en català dels errors de Python (P.explainError)
js/editor.js          Editor: ressaltat, números de línia, autocompletat,
                      indentació automàtica, Ctrl+Z (P.editText), desar codi
js/pyrunner.js        Gestió del Worker: càrrega, execució, timeout, cua whenReady
js/pyworker.js        Web Worker: executa Python amb Pyodide
js/pycat_requires.py  Comprovació de data-requires (Pyodide i test automàtic)
js/pycat_trace.py     Enregistrament del «pas a pas» (sys.settrace)
js/pycat_turtle.py    Mòdul turtle propi (enregistra les ordres de dibuix)
js/stepper.js         Interfície del «👣 Pas a pas»
js/turtle-view.js     Dibuix animat de la tortuga en un <canvas>
js/ui.js              Botons, validació per casos de prova, tema, glossari, fitxers
js/kbd-accessory.js   Barra de tecles per a pantalles tàctils
js/main.js            Inicialització: llegeix els paràmetres d'URL
js/sw-register.js     Kill-switch del Service Worker (vegeu §10)

curs/index.html       Índex del curs
curs/capitol-N.html   Capítols (només el contingut; vegeu §5)
curs/repte-N.html     Reptes (només el contingut)
curs/capitols.js      Dades del curs + esquelet de pàgina + simuladors + progrés
curs/activitats.js    Problemes de Parsons i qüestionaris (es carrega si cal)
curs/glossari-data.js Contingut del glossari (GLOSSARI_HTML)
curs/curs.css         Estils del curs

tests/comprova-curs.py     Test automàtic (vegeu §9)
tests/solutions.js         Solucions de referència per goalId
tests/test-exercises.html  Versió de navegador del test (amb Pyodide)
.github/workflows/comprova-curs.yml   Executa el test a cada push i PR
```

**Ordre de càrrega a `index.html`** (depenen del namespace global `P`):
`constants → i18n → state → console → errors → editor → pyrunner → ui →
stepper → turtle-view → kbd-accessory → main → sw-register → glossari-data → footer`.

El worker carrega també `pycat_requires.py`, `pycat_trace.py` i
`pycat_turtle.py` (aquest com a `/pycat/turtle.py`).

---

## 4. Com funciona l'execució

### 4.1 Protocol amb el Worker (`pyrunner.js` ↔ `pyworker.js`)

```
Main → Worker:  {type:'init', cdnUrl}
Main → Worker:  {type:'run', code, stdin, interactive, inputBuffer}
Main → Worker:  {type:'check', code, requires}
Main → Worker:  {type:'trace', code, stdin, userLines}
Worker → Main:  {type:'ready'} | {type:'load_error', cdnUrl}
Worker → Main:  {type:'stdout', text} | {type:'stdout_partial', text} | {type:'stderr', text}
Worker → Main:  {type:'done', elapsed, output, turtle} | {type:'error', msg, line, elapsed, turtle}
Worker → Main:  {type:'input_request'} | {type:'check_result', missing} | {type:'trace_result', data}
```

Decisions importants de `pyworker.js`:

- **Variables noves a cada execució**: el codi s'executa amb un diccionari de
  globals nou. Res no sobreviu d'una execució (o d'un cas de prova) a l'altra.
- **stdin**: en mode batch sempre és un `StringIO` nou; `input()` no imprimeix
  la pregunta. Per això les sortides esperades no inclouen les preguntes.
- **Errors**: amb `sys.stderr` redirigit, Pyodide deixa `e.message` buit i
  escriu el traceback a stderr; el worker el llegeix d'allà. La línia de
  l'error és l'**últim** `File "<exec>", line N`. Les funcions internes es
  compilen amb el nom `<pycat>` perquè no es confonguin amb el codi de l'alumne.
  El traceback intern no s'envia a la consola.
- **Input interactiu**: `SharedArrayBuffer` + `Atomics.wait()` (cal COOP/COEP).
  Sense això, hi ha un panell de text per escriure les entrades abans d'executar.
- **Timeout** de 10 s (`P.EXEC_TIMEOUT`): es mata el worker i se'n crea un de nou.

### 4.2 Càrrega sota demanda

El simulador lliure precarrega Python. Els simuladors incrustats al curs
(`?embed=1`) el carreguen en el **primer clic** a ▶ Executa (`P.pyRun` ho fa sol
i posa l'execució a la cua `P.whenReady`). Una pàgina amb 20 simuladors no
carrega 20 intèrprets.

### 4.3 Validació (`ui.js`)

1. Codi final = codi de l'alumne + `testCode` (si n'hi ha).
2. S'executa un cop per cada cas de prova amb el seu stdin i es compara la
   sortida amb `expected` (`.trim()` de tota la sortida, `\r\n` → `\n`).
3. Si tots passen i hi ha `requires`, es comprova el codi amb `P.pyCheck`.
4. Es notifica la pàgina del curs amb `postMessage` (§6).

Amb `?interactive=1` i `SharedArrayBuffer`, el primer clic executa en mode
interactiu i el botó passa a «▶ Valida».

### 4.4 Pas a pas (`pycat_trace.py` + `stepper.js`)

El botó «👣 Pas a pas» envia el codi (amb el `testCode`) al worker, que
l'executa amb `sys.settrace` i desa, abans de cada línia de l'alumne, la línia
i les variables de cada nivell de crida (màxim 1000 passos). L'alumne recorre
els passos endavant i enrere: la línia es marca a l'editor i les variables
que canvien es destaquen. Amb `input()` fa servir les entrades de l'exemple,
del primer test o del panell d'entrades.

### 4.5 Tortuga (`pycat_turtle.py` + `turtle-view.js`)

Mòdul amb la mateixa API que el `turtle` de Python (`forward`, `left`,
`circle`, `color`, `begin_fill`, `goto`, `speed`, `Turtle()`, `Screen()`…),
que accepta també noms de colors en català. No dibuixa: enregistra les ordres
(màxim 50.000) i, en acabar el programa, el simulador les anima en un panell
«🐢 Dibuix» a sobre de la consola (⏩ acaba de cop, 💾 desa PNG). El worker
l'esborra de `sys.modules` abans de cada execució.

### 4.6 Errors en català (`errors.js`)

`P.explainError(msg)` recorre `ERROR_RULES` (patró → explicació + pista). La
consola mostra: «❌ Error a la línia N: explicació», «💡 pista» i, a sota, el
missatge original. Si l'error és dins del `testCode`, no es marca cap línia.

---

## 5. Les pàgines del curs

### 5.1 Esquelet

Cada pàgina només conté el seu contingut:

```html
<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capítol 4 — Decisions: if, elif, else | PyCat</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="curs.css">
</head>
<body data-pagina="capitol" data-num="4">

<main class="curs-content">
  <div class="chapter-content-inner">      <!-- només als capítols -->
    <header class="chapter-header">…</header>
    <section class="chapter-section">…</section>
  </div>
</main>

<script src="glossari-data.js"></script>
<script src="capitols.js"></script>
<script src="../footer.js"></script>
</body>
</html>
```

`initCursPage()` (a `capitols.js`, s'executa sol) hi afegeix la capçalera, la
barra lateral, la navegació «anterior / següent» (calculada a partir de
`CAPITOLS_DATA` / `REPTES_DATA`), el glossari i els simuladors.
`data-pagina` pot ser `capitol`, `repte` o `index` (només capçalera).

**Afegir un capítol o repte:** crear el fitxer amb aquest esquelet i afegir-lo a
`CAPITOLS_DATA` o `REPTES_DATA`. Si té exercici validat, afegir-ne la solució a
`tests/solutions.js` i executar el test.

Classes útils: `.chapter-badge.badge--facil|badge--intermedi|badge--dificil`,
`details.pista`, `.exercise-enunciat`, `pre.code-example`, `.seccio-destacada`.

### 5.2 Atributs del simulador (`<div class="simulador">`)

| Atribut | Efecte |
|---------|--------|
| `data-code` | Codi inicial. **Compte a tancar la cometa** (el test ho vigila) |
| `data-readonly="true"` | Exemple no editable (no es desa el codi) |
| `data-height` | Alçada de l'iframe en px (per defecte 320) |
| `data-stdin` | Entrades per a `input()` d'un exemple sense validació |
| `data-expected` | Sortida esperada (un sol cas) |
| `data-tests` | JSON `[{"stdin": "...", "expected": "..."}, …]` |
| `data-testcode` | Codi Python afegit darrere del de l'alumne (p. ex. crides a la seva funció) |
| `data-goal-id` | Identificador únic; activa el ✓/✗ i el progrés |
| `data-requires` | Construccions obligatòries: `variables, fstring, input, if, while, for, list, dict, def, return, try, split` |
| `data-interactive="true"` | Executa primer en mode interactiu i després valida |

Cada simulador editable desa el codi de l'alumne (vegeu §7) i té els botons
«⟲ Codi inicial» i «⛶ Pantalla completa» (el mateix iframe; «✕ Surt» per tornar).
Tots tenen «👣 Pas a pas».

### 5.3 Activitats sense simulador (`curs/activitats.js`)

`initCursPage()` carrega `activitats.js` si la pàgina té `.parsons` o `.quiz`.

```html
<!-- Problema de Parsons: el <pre> és la solució (4 espais per nivell) -->
<div class="parsons" data-goal-id="cap-6-parsons" data-stdin="…" data-expected="…">
<pre class="parsons-codi">for i in range(3):
    print(i)</pre>
</div>

<!-- Qüestionari: data-correcta = posició de l'opció bona (1, 2, …) -->
<div class="quiz" data-goal-id="cap-1-quiz">
  <div class="quiz-q" data-correcta="2" data-comprova>
    <p>Què imprimeix aquest programa?</p>
    <pre class="code-example">print("3 + 4")</pre>
    <ol class="quiz-opcions"><li>7</li><li>3 + 4</li><li>Error</li></ol>
    <p class="quiz-explica">Entre cometes és un text.</p>
  </div>
</div>
```

`data-comprova` fa que el test executi el codi i comprovi que la sortida és el
text de l'opció correcta (`data-stdin` opcional). `data-stdin`/`data-expected`
del Parsons també són opcionals. Els `goalId` d'aquestes activitats es desen
al progrés com els dels exercicis.

---

## 6. Contracte `postMessage` (iframe ↔ pàgina del curs)

Tots dos són del mateix origen; `capitols.js` rebutja altres orígens.

| Missatge | Direcció | Significat |
|----------|----------|------------|
| `{type:'pycat-clear', goalId}` | iframe → pàgina | Nova execució: esborra el feedback |
| `{type:'pycat-result', goalId, success, total, missing, results}` | iframe → pàgina | Resultat de la validació |
| `{type:'pycat-exit-fs'}` | iframe → pàgina | L'alumne ha premut «✕ Surt» |
| `{type:'pycat-fs', on}` | pàgina → iframe | Mostra/amaga «✕ Surt» |

`results` és una llista de `{testIdx, stdin, expected, actual, passed}`
(`actual === null` vol dir error d'execució). La pàgina mostra la taula de
diferències línia per línia del primer cas fallit.

---

## 7. Dades desades (`localStorage`)

| Clau | Contingut |
|------|-----------|
| `pycat_code` | Codi del simulador lliure |
| `pycat-code:<pàgina>:<núm.>` | Codi de cada simulador editable del curs |
| `pycat_progress` | `{ goalId: true, … }` exercicis superats |
| `pycat-theme` | `light` / `dark` (simulador lliure) |

---

## 8. Paràmetres d'URL de `index.html`

Documentats a la capçalera de `js/main.js`: `embed`, `code`, `readonly`,
`stdin`, `expected`, `tests`, `testcode`, `goalId`, `requires`, `save`,
`interactive`, `theme`. Els textos van en base64 (UTF-8).

---

## 9. Tests

```bash
python3 tests/comprova-curs.py
```

Per a cada exercici amb `data-goal-id` comprova que la solució de
`tests/solutions.js` supera tots els casos, que compleix `data-requires`, que el
codi inicial **no** els supera, que els `goalId` són únics i coherents amb
`capitols.js`, que cap `data-code` conté HTML (cometa oblidada) i que el
«pas a pas» de cada solució dona la mateixa sortida. Per a les activitats:
executa les solucions dels Parsons i comprova les respostes marcades com a
correctes de les preguntes amb `data-comprova`. Imita el simulador (sense
pregunta a `input()`, variables noves a cada execució, mòdul `turtle` propi).

La GitHub Action `comprova-curs.yml` l'executa a cada push i PR, juntament amb
`node --check` de tots els fitxers JS.

---

## 10. Decisions preses (no desfer sense motiu)

- **Service Worker desactivat.** Un SW antic provocava `ERR_FAILED` a producció.
  `sw.js` i `js/sw-register.js` són *kill-switches* que el desregistren i
  esborren les caches `pycat-*`. Es poden deixar indefinidament. Si mai es vol
  mode fora de línia, cal reescriure'l de zero i provar-lo molt a producció.
- **COOP/COEP** (`_headers`) són necessaris per a `SharedArrayBuffer`
  (input interactiu). Sense ells, hi ha el panell d'entrades com a alternativa.
- **Iframes amb `sandbox="allow-scripts allow-same-origin allow-modals"`**:
  `allow-modals` cal per al `confirm()` de «⟲ Codi inicial».
- **Una sola clau de progrés** (`pycat_progress`), definida a `curs/capitols.js`.

---

## 11. Tasques pendents

Fases 1–5 del pla de millores fetes.

- Diversos exercicis graduats (★ ★★ ★★★) per capítol; més «troba l'error» i Parsons.
- Pistes graduals (1 → 2 → 3) que es desbloquegin després d'intents fallits.
- Avisar quan la resposta és «gairebé correcta» (majúscules, espais, accents) i
  ignorar els espais del final de cada línia en comparar.
- Taula resum dels casos de prova dins la consola, en lloc del text repetit.
- Progrés visible a l'índex (✓, «7/27») i «Continua on ho vas deixar».
- Botó «🗑 Esborra el meu progrés». Portada amb targetes.
- Lletra sense serifa per a la prosa; mides de lletra més grans; peu no fix;
  favicon; servir la font localment (privadesa).
- Barra tàctil amb ⇥ ⇤ i paraules clau; autocompletat amb `()` i variables.
- Aturar bucles infinits amb `pyodide.setInterruptBuffer()` sense recarregar.
- Tortuga: validar dibuixos (p. ex. comprovar la posició final o les línies).
- Pas a pas: mode interactiu amb `input()` (ara necessita les entrades abans).
- Continguts: capítol de `import` (`random`, `math`), tuples, `round()`,
  depuració amb `print()`; capítol 0 de pont des de KarelCat.
- Guia del professorat i «📋 Copia el meu progrés».
- Progrés del capítol 11 (no té exercici validat).
- Unificar l'estil JS (`var`/`const`, funcions/fletxes) quan es toqui cada fitxer.
- (Baixa prioritat) Passar a mòduls ES si el codi creix molt.
