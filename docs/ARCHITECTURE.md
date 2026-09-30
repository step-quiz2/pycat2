# PyCat — Arquitectura del projecte

**Seqüela independent de KarelCat per practicar Python real al navegador**

---

> ⚠️ **DOCUMENT DE DISSENY ORIGINAL — pot no reflectir l'estat actual del codi**
>
> Aquest document va ser escrit com a pla inicial del projecte i no s'ha actualitzat sistemàticament. Conté informació desactualitzada: fitxers que no existeixen, noms d'atributs incorrectes i un pla de fases que ja s'ha completat.
>
> Per a l'estat real del projecte, consulteu:
> - **`README.md`** — estructura de fitxers actual i com servir el projecte
> - **`TODO.md`** — tasques completades i pendents
> - **El codi font** — és la font de veritat
>
> Les seccions d'aquest document que segueixen sent útils: visió general (§1), arquitectura del Web Worker (§2.2), disseny de la consola (§2.3), i consideracions tècniques (§4).

---

## 1. Visió general

PyCat és un curs interactiu per aprendre Python real, adreçat a alumnes que ja han completat KarelCat (o equivalent). Manté la mateixa filosofia: tot al navegador, sense instal·lació, sense servidor, interfície minimalista. La diferència fonamental és que el motor d'execució passa de ser un intèrpret propi (tokenizer → parser → AST → generadors JS) a executar **CPython real via Pyodide (WebAssembly)**.

### Principis heretats de KarelCat

- **Zero instal·lació**: tot funciona obrint un HTML al navegador
- **Editor esquerra, resultat dreta**: la disposició bàsica es manté
- **Capítols + Reptes**: mateixa estructura pedagògica
- **Validació automàtica**: feedback immediat de si el repte és correcte
- **Progrés local**: `localStorage` per guardar l'avanç de l'alumne
- **Codi és contingut**: el codi de l'alumne és el producte principal
- **Interfície en català** (amb possibilitat d'afegir castellà/anglès)

### Diferències clau respecte KarelCat

| Aspecte | KarelCat | PyCat |
|---------|----------|-------|
| Motor | Intèrpret JS propi (tokenizer+parser+interpreter) | Pyodide (CPython 3.12+ via WebAssembly) |
| Panell dret | Graella visual (món de Karel) | Consola de sortida (stdout/stderr) |
| Validació | Comparació d'estat de la graella (CSV vs CSV) | Comparació de stdout, o tests unitaris |
| Pes inicial | ~200KB (tot inclòs) | ~12MB (Pyodide runtime, es cacheja) |
| Cobertura | Subconjunt de Python (for, while, if, def sense params) | Python complet (variables, tipus, llistes, diccionaris, classes) |
| Interactivitat | Visual (veus la medusa moure's) | Textual (veus la sortida del programa) |

---

## 2. Arquitectura tècnica

### 2.1 Estructura de fitxers

```
pycat/
├── index.html                  ← Pàgina principal (simulador lliure Python)
├── simulador.html              ← Simulador embeddable (per iframes del curs)
├── style.css                   ← Estils del simulador (derivat de KarelCat)
├── nav.css                     ← Navegació (reutilitzat íntegrament)
├── footer.js                   ← Footer (reutilitzat)
│
├── js/
│   ├── constants.js            ← Configuració, missatges i18n, claus LS
│   ├── i18n.js                 ← Sistema de traducció (reutilitzat)
│   ├── state.js                ← Estat centralitzat
│   ├── pyrunner.js             ← NOU: wrapper Pyodide (load, exec, capture I/O)
│   ├── validator.js            ← NOU: comparació output vs expected
│   ├── editor.js               ← Editor de codi (adaptat, sense keywords Karel)
│   ├── console.js              ← NOU: renderitzat de la consola de sortida
│   ├── ui.js                   ← Botons, slider, log, theme toggle (adaptat)
│   ├── main.js                 ← Inicialització (adaptat)
│   └── kbd-accessory.js        ← Teclat virtual mòbil (adaptat)
│
├── curs/
│   ├── index.html              ← Índex del curs (10-12 capítols)
│   ├── capitol.html            ← Plantilla reutilitzable per capítols
│   ├── capitol-1.html          ← Capítol 1: Variables i print()
│   ├── capitol-2.html          ← Capítol 2: Tipus de dades
│   ├── ...                     ← (fins a capitol-10 o 12)
│   ├── repte-1.html            ← Repte 1
│   ├── ...                     ← (fins a repte-15 o 20)
│   ├── capitols.js             ← Dades dels capítols + renderSidebar/renderSimuladors
│   ├── progress.js             ← Sistema de progrés (reutilitzat)
│   └── curs.css                ← Estils del curs (reutilitzat)
│
├── docs/
│   ├── CURRENT-STATE.md        ← Estat actual del projecte
│   └── ARCHITECTURE.md         ← (aquest document)
│
└── img/
    └── ...                     ← Assets visuals
```

### 2.2 El motor: Pyodide

La peça central és `pyrunner.js`, un mòdul que encapsula tota la interacció amb Pyodide.

#### Disseny del pyrunner.js

```javascript
// ════════════════════════════════════════════════════════
// pyrunner.js — Wrapper de Pyodide per a PyCat
//
// Responsabilitats:
//   1. Carregar Pyodide (una sola vegada, amb loading indicator)
//   2. Executar codi Python captant stdout/stderr
//   3. Gestionar timeouts (bucles infinits)
//   4. Opcionalment, capturar input() de l'alumne
//   5. Exposar resultats per a la validació
// ════════════════════════════════════════════════════════

// OPCIÓ A: Execució al main thread (simple, bloqueja UI breument)
// OPCIÓ B: Execució en Web Worker (no bloqueja UI, permet kill de bucles infinits)
//
// RECOMANACIÓ: Web Worker. Permet interrompre bucles infinits amb worker.terminate()
// i mantenir la UI responsiva durant l'execució.
```

**Arquitectura recomanada: Web Worker**

```
┌─────────────────────┐         postMessage          ┌──────────────────────┐
│   MAIN THREAD       │ ◄──────────────────────────► │   WEB WORKER         │
│                     │                               │                      │
│  - UI (editor,      │   {type:'run', code:'...'}   │  - Pyodide runtime   │
│    consola, botons)  │   ────────────────────────►  │  - Executa Python    │
│  - Captura input()  │                               │  - Captura stdout    │
│  - Mostra resultats │   {type:'stdout', text:'...'}│                      │
│                     │   ◄────────────────────────   │                      │
│                     │   {type:'done', output:'...'} │                      │
│                     │   ◄────────────────────────   │                      │
│                     │   {type:'error', msg:'...'}   │                      │
│                     │   ◄────────────────────────   │                      │
└─────────────────────┘                               └──────────────────────┘
```

**Avantatges del Web Worker:**
- L'alumne pot prémer "Atura" i es fa `worker.terminate()` → mata bucles infinits
- La UI mai es congela, ni amb programes pesants
- Aïllament de seguretat (el codi de l'alumne no pot tocar el DOM)

**Protocol de missatges Worker ↔ Main:**

| Direcció | Tipus | Contingut |
|----------|-------|-----------|
| Main → Worker | `init` | Inicialitza Pyodide (un sol cop) |
| Main → Worker | `run` | `{code: string, testCode?: string}` |
| Main → Worker | `kill` | Atura l'execució (el main fa terminate + re-spawn) |
| Worker → Main | `ready` | Pyodide carregat i llest |
| Worker → Main | `stdout` | Línia de sortida estàndard |
| Worker → Main | `stderr` | Línia d'error |
| Worker → Main | `done` | `{output: string, success: bool}` |
| Worker → Main | `error` | `{msg: string, line?: number}` |
| Worker → Main | `input_request` | L'alumne ha cridat `input()` |
| Main → Worker | `input_response` | `{text: string}` |

#### Gestió d'input()

Un dels reptes tècnics és `input()`: en Python és bloquejant, però al navegador no podem bloquejar. Solucions:

**Opció 1 (simple, recomanada per a PyCat):** Pre-definir les entrades al repte. L'enunciat diu "El programa rebrà els inputs 5 i 3" i el sistema els injecta automàticament.

```javascript
// Al worker, abans d'executar:
pyodide.runPython(`
import sys
from io import StringIO
sys.stdin = StringIO("5\\n3\\n")
`);
```

**Opció 2 (avançada):** Usar `SharedArrayBuffer` + `Atomics.wait()` al worker per bloquejar fins que el main thread proporcioni l'input via un prompt visual. Requereix headers COOP/COEP al servidor.

**Opció 3 (intermèdia):** Fer servir la JSPI de Pyodide 0.28+ que permet `await` dins de Python síncron. Encara experimental.

**RECOMANACIÓ:** Opció 1 per als reptes (inputs predefinits), amb un camp de text a la UI del simulador lliure per a inputs manuals.

### 2.3 El panell dret: Consola

En lloc de la graella de Karel, el panell dret mostra una **consola** amb:

```
┌─────────────────────────────────────────┐
│ 🟢 Llest                    ⚡ Velocitat │
├─────────────────────────────────────────┤
│                                         │
│  >>> Executant...                        │
│  Hola, món!                             │
│  La suma de 5 i 3 és 8                  │
│  ✅ Programa completat (0.02s)          │
│                                         │
│                                         │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  📎 Motxilla: —    Passos: —            │
│  (substituït per: Temps: 0.02s)         │
└─────────────────────────────────────────┘
```

**Diferències amb el panell de Karel:**
- No hi ha grid, hi ha un `<pre>` o `<div>` amb sortida de text
- Les línies de stdout es mostren en blanc/verd
- Les línies de stderr es mostren en vermell
- Els errors de sintaxi marquen la línia al editor (com Karel)
- La barra d'estat mostra temps d'execució en lloc de "motxilla"

### 2.4 Validació dels reptes

La validació substitueix la comparació de CSVs per **comparació de sortida** (i opcionalment, tests unitaris).

#### Tipus de validació

**Tipus 1 — Comparació de stdout (simple)**

```html
<div class="simulador"
     data-code="# Escriu el teu codi aquí"
     data-expected="Hola, món!"
     data-height="300">
</div>
```

El sistema executa el codi de l'alumne i compara stdout amb `data-expected`.

**Tipus 2 — Comparació amb múltiples inputs (robust)**

```html
<div class="simulador"
     data-code="n = int(input())\nprint(n * 2)"
     data-tests='[
       {"input": "5", "expected": "10"},
       {"input": "0", "expected": "0"},
       {"input": "-3", "expected": "-6"}
     ]'
     data-height="300">
</div>
```

El sistema executa el codi amb cada input i verifica totes les sortides.

**Tipus 3 — Tests unitaris (avançat, per a reptes de funcions)**

```html
<div class="simulador"
     data-code="def suma(a, b):\n    pass"
     data-testcode="
assert suma(2, 3) == 5, 'suma(2,3) hauria de ser 5'
assert suma(0, 0) == 0, 'suma(0,0) hauria de ser 0'
assert suma(-1, 1) == 0, 'suma(-1,1) hauria de ser 0'
print('Tots els tests passen ✓')
"
     data-height="300">
</div>
```

El sistema executa el codi de l'alumne + el codi de test. Si no hi ha AssertionError, el repte està resolt.

#### Comunicació amb el pare (iframes)

Idèntic a KarelCat:
```javascript
// Emet resultat al pare
window.parent.postMessage({
  type: 'pycat-result',
  goalId: goalId,
  success: true/false
}, parentOrigin);
```

### 2.5 Mòduls reutilitzats íntegrament de KarelCat

| Fitxer | Canvis necessaris |
|--------|-------------------|
| `nav.css` | Cap (canviar "Karel" per "PyCat" als links) |
| `curs/curs.css` | Cap (mateixa estètica) |
| `curs/progress.js` | Canviar claus LS (`pycat-progress` en lloc de `karel-progress`) |
| `curs/capitols.js` (estructura) | Canviar dades de capítols, mantenir funcions `renderSidebar`, `renderSimuladors`, `injectCursLogo` |
| `footer.js` | Cap |
| `js/i18n.js` | Cap (canviar missatges) |
| `js/kbd-accessory.js` | Adaptar tecles (treure comandes Karel, afegir `=`, `[`, `]`, `"`, etc.) |

### 2.6 Mòduls eliminats (específics de Karel)

| Fitxer | Motiu |
|--------|-------|
| `js/tokenizer.js` | Substituït per Pyodide |
| `js/parser.js` | Substituït per Pyodide |
| `js/interpreter.js` | Substituït per Pyodide |
| `js/world.js` | No hi ha graella |
| `js/renderer.js` | Substituït per `console.js` |
| `js/reptes.js` | Substituït per `validator.js` amb test cases |
| `edit-mapa.html` | No aplica |

---

## 3. Contingut pedagògic

### 3.1 Mapa de capítols proposat

El curs assumeix que l'alumne ja entén: seqüència, repetició (`for`), condicionals (`if/elif/else`), `while`, i funcions sense paràmetres. Això és exactament el que KarelCat ensenya.

| # | Títol | Conceptes nous |
|---|-------|----------------|
| 1 | **Hola, Python!** | `print()`, strings, el teu primer programa real |
| 2 | **Variables** | Assignació, noms, tipus bàsics (`int`, `float`, `str`) |
| 3 | **Operacions** | Aritmètica, concatenació, f-strings |
| 4 | **Input** | `input()`, conversió de tipus (`int()`, `float()`) |
| 5 | **Decisions** | `if/elif/else` amb expressions (no només condicions Karel) |
| 6 | **Bucles amb dades** | `for` amb `range()` avançat, `while` amb comptadors |
| 7 | **Llistes** | Crear, accedir, modificar, recórrer |
| 8 | **Funcions de veritat** | Paràmetres, `return`, composició |
| 9 | **Cadenes** | Mètodes de string, slicing, cerca |
| 10 | **Diccionaris** | Clau-valor, recórrer, comptar |
| 11 | **Fitxers** (simulat) | Llegir i escriure dades (amb strings simulant fitxers) |
| 12 | **Projecte final** | Combinar-ho tot en un mini-projecte |

### 3.2 Connexió amb KarelCat

El capítol 1 de PyCat comença amb un pont explícit:

> *"A KarelCat vas aprendre a pensar com un programador: descomposar problemes, repetir accions, prendre decisions i crear procediments. Ara faràs exactament el mateix — però amb Python real, sense meduses ni graelles. El teu programa ja no mourà en Karel: **parlarà amb text**."*

I mostra la transició:

```python
# KarelCat                    # PyCat
# ─────────────               # ─────────────
# move()                      print("Hola!")
# for _ in range(3):          for i in range(3):
#     move()                      print(i)
# def saluda():               def saluda(nom):
#     move()                      print(f"Hola, {nom}!")
#     turn_left()
```

### 3.3 Estructura d'un repte

Cada repte de PyCat segueix la mateixa estructura que KarelCat:

1. **Enunciat clar** amb exemples d'input/output
2. **Simulador incrustat** amb codi esquelet
3. **Múltiples test cases** (equivalent als "múltiples mons" de Karel)
4. **Feedback immediat**: ✓ Correcte / ✗ No coincideix
5. **Pista pedagògica** col·lapsable

Exemple de repte:

> **Repte 3 — La taula de multiplicar**
>
> Escriu un programa que llegeixi un número `n` i imprimeixi la seva taula de multiplicar de l'1 al 10.
>
> **Exemple:**
> - Input: `5`
> - Output:
>   ```
>   5 x 1 = 5
>   5 x 2 = 10
>   ...
>   5 x 10 = 50
>   ```

```html
<div class="simulador"
     data-code="n = int(input())\n# Escriu la taula de multiplicar de n"
     data-tests='[
       {"input": "5", "expected": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50"},
       {"input": "3", "expected": "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30"},
       {"input": "1", "expected": "1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5\n1 x 6 = 6\n1 x 7 = 7\n1 x 8 = 8\n1 x 9 = 9\n1 x 10 = 10"}
     ]'
     data-height="350">
</div>
```

---

## 4. Consideracions tècniques

### 4.1 Càrrega de Pyodide

Pyodide pesa ~12MB la primera càrrega. Estratègies:

1. **Loading screen amigable**: "Preparant Python... 🐍" amb barra de progrés
2. **Cache del navegador**: Pyodide es serveix des de CDN amb cache headers agressius; la segona càrrega és quasi instantània
3. **Lazy loading**: no carregar Pyodide fins que l'alumne no prem "Executa" per primer cop (o quan entra a un capítol amb simulador)
4. **Preload hint**: `<link rel="preload">` al `<head>` per començar la descàrrega abans

```html
<!-- Al <head> de les pàgines amb simulador -->
<link rel="preload" href="https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js" as="script">
```

### 4.2 Seguretat

- **El codi s'executa al Web Worker**: no pot accedir al DOM ni a `localStorage`
- **Timeout**: si l'execució supera 10 segons, el worker es mata automàticament i es mostra un error de "possible bucle infinit"
- **Sense xarxa**: Pyodide no pot fer `fetch()` des del worker (per disseny)
- **Sense filesystem real**: tot és en memòria virtual

### 4.3 Rendiment

- **Pyodide és ~3-10x més lent que CPython natiu**, però per a exercicis d'alumnes de secundària és més que suficient
- **Els exercicis són petits**: rarament superen 50 línies
- **L'execució típica és < 100ms**, imperceptible per a l'alumne

### 4.4 Compatibilitat

- **Chrome/Edge 89+**: suport complet de WebAssembly + Web Workers
- **Firefox 89+**: funciona, pot ser lleugerament més lent
- **Safari 15.2+**: funciona
- **Mòbil**: funciona en iOS Safari i Chrome Android (teclat virtual adaptat)

---

## 5. Pla de desenvolupament

> ✅ **Totes les fases estan implementades.** El que segueix era el pla original; consulta `TODO.md` per a les tasques actuals i l'historial de tasques completades.

### Fase 1 — Esquelet ✅
- Estructura de fitxers base
- CSS, nav adaptat
- `pyrunner.js` + `pyworker.js` (Web Worker + Pyodide)
- `console.js` (panell de sortida)
- `index.html` funcional amb editor + consola
- Loading screen per a Pyodide

### Fase 2 — Validació ✅
- Validació de stdout (`data-expected`), test cases múltiples (`data-tests`), i tests unitaris (`data-testcode`)
- Comunicació iframe ↔ pare (postMessage)
- Feedback visual (✓ / ✗)

### Fase 3 — Curs ✅
- 11 capítols escrits
- 15 reptes amb test cases
- Simuladors incrustats als capítols
- Sistema de progrés amb checkmarks a la barra lateral

### Fase 4 — Polish ✅
- Teclat virtual mòbil adaptat (`kbd-accessory.js`)
- Tema clar/fosc
- `input()` interactiu via SharedArrayBuffer + fallback stdin
- Sistema i18n (ca/es/en) amb selector de llengua

---

## 6. Riscos i mitigacions

| Risc | Impacte | Mitigació |
|------|---------|-----------|
| Pyodide triga a carregar en connexions lentes | Alt | Cache agressiva + loading screen + preload |
| `input()` bloquejant al Worker | Mitjà | Inputs predefinits per a reptes; camp de text al simulador lliure |
| Bucles infinits congelen | Mitjà | Web Worker amb terminate() + timeout de 10s |
| Alumnes escriuen `import` de paquets no disponibles | Baix | Missatge d'error clar: "Aquest paquet no està disponible" |
| Mòbils antics no suporten Wasm | Baix | Missatge de compatibilitat; 97%+ dels navegadors actuals suporten Wasm |

---

## 7. Conclusió

PyCat és un projecte **perfectament viable** que aprofita el 40-50% del codi de KarelCat sense modificacions, adapta un 25%, i afegeix un 25-30% de codi nou (principalment `pyrunner.js` i contingut pedagògic). La decisió arquitectònica clau és usar Pyodide dins d'un Web Worker, que garanteix Python real al navegador amb seguretat i sense bloquejos de la UI.

El resultat serà una continuació natural de KarelCat: el mateix alumne, la mateixa estètica, la mateixa mecànica — però ara amb Python de veritat.
