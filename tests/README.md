# PyCat — Test Runner

Eina de desenvolupament per verificar que cada exercici del curs té una solució correcta i que els test cases són consistents. **No s'enllaça des de la UI del curs.**

## Fitxers

- **`test-exercises.html`** — Pàgina web que carrega Pyodide, extreu tots els exercicis de les pàgines del curs (`../curs/*.html`) i executa les solucions contra cada test case.
- **`solutions.js`** — Solucions de referència per a cada `goalId`. Clau: `goalId` (p.ex. `cap-4-ex`, `repte-15`). Valor: codi Python.

## Com usar-la

Des de l'arrel del projecte:

```bash
python3 -m http.server 8000
```

Obre al navegador:

```
http://localhost:8000/tests/test-exercises.html
```

Prem **«Executa tots els tests»**. L'eina:

1. Descarrega els HTML del curs via `fetch()`.
2. Parseja els `<div class="simulador" data-*>` per extreure `data-code`, `data-stdin`, `data-expected`, `data-tests`, `data-testcode`.
3. Per a cada exercici amb `data-goal-id`, busca la solució a `solutions.js` i l'executa amb Pyodide contra cada test case.
4. Mostra **PASS/FAIL** per exercici i per test, amb diff de la sortida.

## Afegir un exercici nou

1. Afegir el `<div class="simulador" data-goal-id="...">` a la pàgina del curs corresponent.
2. Afegir la pàgina a `COURSE_PAGES` dins de `test-exercises.html` si encara no hi és.
3. Afegir la solució a `solutions.js` amb la mateixa clau `goalId`.
4. Executar la pàgina i verificar que tots els tests passen.

## Per què

Prevé regressions quan s'editen els test cases o el codi d'un exercici. Detecta:
- Errors tipogràfics a la sortida esperada (`data-expected` / `data-tests`).
- Test cases on la solució correcta no hi encaixa.
- Exercicis sense solució de referència.

## Verificació local (sense navegador) i CI

```bash
python3 tests/comprova-curs.py
```

Fa la mateixa comprovació amb el Python de l'ordinador (imitant el simulador: `input()` no imprimeix la pregunta i cada execució comença amb variables noves). A més, comprova que el codi inicial de cada exercici **no** superi els tests, que no hi hagi `goalId` repetits i que els `goalId` de `curs/capitols.js` existeixin. Surt amb error si alguna cosa falla.

S'executa automàticament a GitHub a cada push i pull request (`.github/workflows/comprova-curs.yml`).
