# PyCat — Canvis de la part A (correcció de bugs)

Aquest paquet conté **només els arxius modificats**. Cal descomprimir-lo sobre la còpia existent del projecte, respectant la jerarquia de directoris.

## Acció manual addicional

**Elimina `simulador.html` del directori arrel** abans o després de descomprimir. Ja no s'usa: la pàgina principal del simulador és ara `index.html`. Ho fa la tasca A6.

## Arxius inclosos i raó

### Nucli JS (A1, A2, A5, A8)

- **`js/constants.js`** — netejats `SPEED_DELAYS` i `stepDelay` no usats. `LS_KEY_PROGRESS` es manté com a reserva per a B1.
- **`js/state.js`** — estat normalitzat: `testCases` és sempre un array de `{stdin, expected}` o `null`, i `freeStdin` és el stdin dels simuladors sense validació.
- **`js/main.js`** — parsing coherent dels paràmetres URL. `data-tests` i `data-expected` es tradueixen al mateix format de `testCases`. Accepta tant `{stdin, expected}` com el llegat `{input, expected}`.
- **`js/pyrunner.js`** — afegit `P.pyRunAsync(code, stdin)` que retorna una Promise. Corregit el cas en què es criden execucions mentre Pyodide encara carrega (ara encuen correctament). Al timeout, el worker es re-spawna automàticament.
- **`js/ui.js`** — `runProgram` ara és `async` i itera pels `testCases`, executant el codi de l'alumne (més el `testCode` si n'hi ha) una vegada per cada test case. Agrega resultats i envia un sol `postMessage` al final amb detall per a cada test. Eliminada la branca buggy de `testCode`.
- **`js/editor.js`** — el token `#` ara es gestiona dins del tokenitzador, no abans. `print("# no és comentari")` es pinta correctament.

### Motor del curs (A6)

- **`curs/capitols.js`** — `iframe.src` apunta a `../index.html`. El handler de `pycat-result` mostra ara, quan hi ha un test fallit, quin test és i amb quin input, i diferencia errors d'execució de sortides incorrectes.

### HTML dels capítols (A6 + A7)

- **`curs/capitol-1.html` a `capitol-10.html`**, **`curs/index.html`**, **`curs/repte-1.html`** — enllaços `../simulador.html` substituïts per `../index.html`.
- **`curs/capitol-1.html`**, **`curs/capitol-3.html`** a **`capitol-9.html`** — `data-goal-id` unificat al format `cap-{N}-ex`.

### Correccions de contingut (A3, A4)

- **`curs/capitol-7.html`** — exercici de vocals canviat. L'exemple "Programació" (5 vocals amb accent) s'ha substituït per "Universitat" i "hola". S'afegeix una nota a la pista dient que no es compten vocals accentuades.
- **`curs/capitol-10.html`** — afegit `random.seed(42)` i `data-stdin` amb les 5 respostes correctes a l'ordre que produeix `shuffle` amb aquesta llavor: `8, 366, or, jupiter, paris`. Aplica tant al "programa complet" com al "repte obert". Afegida una nota tècnica que ho explica.

### Documentació

- **`README.md`** — actualitzada referència a `simulador.html` → `index.html`, arbre d'estructura corregit, format de `data-tests` documentat amb la clau correcta (`stdin`, no `input`), documentat el comportament de `data-testcode`.

## Notes importants que NO he fet (i per què)

- **Capítol 2 no té `data-goal-id`.** L'exercici demana "posa el teu nom" i és obert per disseny. Validar-lo automàticament obligaria a inventar un nom concret, cosa que empitjora l'exercici. He decidit no tocar-ho — això pot moure's a la part B si vols una validació alternativa.
- **Tests automàtics dels simuladors (A de part B, no A).** Això seria la tasca B6.
- **`REPTES_DATA` amb més reptes.** És la tasca B5.

## Verificació

Tots els fitxers JS passen `node --check`. No s'ha introduït cap dependència nova. El producte continua sent vanilla HTML/CSS/JS sense build step.

Per validar manualment:

1. Arrenca un servidor HTTP al directori del projecte: `python3 -m http.server 8000`
2. Obre `http://localhost:8000/curs/capitol-4.html`, resol l'exercici correctament, verifica que mostra "✓ Correcte! Has passat els 4 tests."
3. Introdueix una solució incompleta (per exemple només gestionar "Suspens") i verifica que el feedback diu quin test ha fallat i amb quin input.
4. Obre `capitol-9.html`, introdueix una implementació correcta d'`es_primer`, verifica ✓.
5. Deixa l'editor amb només `def es_primer(n): pass`, verifica ✗ (abans donava fals positiu).
6. Obre `capitol-10.html`, clica ▶ al "programa complet", verifica que s'executa i surt "5 de 5 preguntes" i "Excel·lent!".
