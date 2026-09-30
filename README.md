# PyCat

Curs interactiu per aprendre Python real al navegador, en català. Seqüela de [KarelCat](https://karelcat.step-quiz.net).

**→ [pycat.step-quiz.net](https://pycat.step-quiz.net)**

---

## Què és

PyCat és un curs de Python per a alumnes que ja han completat KarelCat (o equivalent). Manté la mateixa filosofia: tot al navegador, sense instal·lació, interfície minimalista. La diferència fonamental és que executa **CPython real via Pyodide (WebAssembly)**.

El curs consta d'**11 capítols** progressius i **15 reptes** amb validació automàtica.

## Estructura de fitxers

```
pycat/
├── index.html              ← Simulador lliure de Python (també serveix com a iframe per als capítols)
├── style.css               ← Estils del simulador
├── sw.js                   ← Kill-switch del Service Worker (veure TODO.md Task 5)
│
├── js/
│   ├── constants.js        ← Configuració global i claus localStorage
│   ├── i18n.js             ← Sistema de traduccions (ca/es/en)
│   ├── state.js            ← Estat centralitzat
│   ├── pyrunner.js         ← Wrapper Pyodide: càrrega, execució, fallback CDN
│   ├── pyworker.js         ← Web Worker: executa Python, captura stdout/stderr
│   ├── editor.js           ← Editor de codi (textarea + highlight overlay)
│   ├── console.js          ← Renderitzat del panell de sortida
│   ├── ui.js               ← Botons, validació, feedback visual
│   ├── main.js             ← Inicialització
│   ├── kbd-accessory.js    ← Teclat virtual mòbil (Python keys)
│   └── sw-register.js      ← Kill-switch del SW (desregistra i neteja caches)
│
├── curs/
│   ├── index.html          ← Índex del curs
│   ├── capitol-1.html      ← Hola, Python!
│   ├── capitol-2.html      ← Variables
│   ├── capitol-3.html      ← Operacions i input
│   ├── capitol-4.html      ← Input
│   ├── capitol-5.html      ← Decisions
│   ├── capitol-6.html      ← Bucles amb dades
│   ├── capitol-7.html      ← Llistes
│   ├── capitol-8.html      ← Funcions
│   ├── capitol-9.html      ← Cadenes
│   ├── capitol-10.html     ← Diccionaris
│   ├── capitol-11.html     ← Posant-ho tot junt
│   ├── repte-1.html        ← Repte 1 (fàcil)
│   ├── ...                 ← repte-2 a repte-15
│   ├── capitols.js         ← Dades dels capítols/reptes + renderSidebar/renderSimuladors
│   ├── glossari-data.js    ← Dades del glossari
│   └── curs.css            ← Estils del curs
│
├── tests/
│   ├── test-exercises.html ← Test runner (eina de desenvolupament, veure tests/README.md)
│   └── solutions.js        ← Solucions de referència per a cada goalId
│
├── tools/
│   ├── generate-pages.js   ← Generador de capítols/reptes des de JSON
│   └── pages/              ← Fitxers JSON d'exemple
│
├── docs/
│   └── ARCHITECTURE.md     ← Document de disseny original (veure avís al fitxer)
│
└── _headers                ← Headers COOP/COEP per a SharedArrayBuffer (Cloudflare Pages)
```

## Servir en local

```bash
python3 -m http.server 8000
```

Obre [http://localhost:8000](http://localhost:8000) per al simulador lliure, o [http://localhost:8000/curs/](http://localhost:8000/curs/) per al curs.

> **Nota:** Cal servir-ho amb un servidor HTTP (no obrir els `.html` directament com a fitxers) perquè Pyodide i els Web Workers requereixen un origen HTTP.

## Arquitectura breu

- El simulador carrega **Pyodide** (CPython via WebAssembly, ~12MB, es cacheja) dins d'un **Web Worker**.
- El worker rep missatges `{type:'run', code:'...'}` i emet `stdout`, `stderr`, `done` o `error` de tornada.
- L'`input()` interactiu usa **SharedArrayBuffer + Atomics.wait()** per bloquejar el worker mentre l'alumne escriu. Requereix els headers COOP/COEP de `_headers`. En entorns sense aquests headers, hi ha un panell de stdin previ a l'execució com a fallback.
- La validació dels reptes compara stdout contra `data-expected` (Mode A), executa múltiples casos de prova via `data-tests` (Mode B), o afegeix codi de test via `data-testcode` (Mode C).
- El sistema de progrés usa `localStorage` i es renderitza com a checkmarks a la barra lateral.

Per als detalls d'implementació, llegiu directament el codi (ben comentat) i `TODO.md`.

## Tests

Veure [`tests/README.md`](tests/README.md).

## Tasques pendents

Veure [`TODO.md`](TODO.md).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
