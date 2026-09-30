# PyCat

Curs interactiu per aprendre Python real al navegador, en català. Seqüela de [KarelCat](https://karelcat.step-quiz.net).

**→ [pycat.step-quiz.net](https://pycat.step-quiz.net)**

---

## Què és

PyCat és un curs de Python per a alumnes d'ESO que ja han fet KarelCat (o equivalent). Manté la mateixa filosofia: tot al navegador, sense instal·lació, interfície minimalista. La diferència és que executa **CPython real via Pyodide (WebAssembly)**.

El curs té **12 capítols** (l'últim, un capítol extra: el joc del 4 en ratlla) i **15 reptes** amb validació automàtica. Els errors de Python s'expliquen en català, el codi de l'alumne es desa sol i, quan un exercici falla, es mostren les diferències línia per línia.

| Capítol | Títol |
|---|---|
| 1 | Hola, Python! |
| 2 | Variables |
| 3 | Operacions i input |
| 4 | Decisions: if, elif, else |
| 5 | Repetir amb while (i `try` / `except`) |
| 6 | Repetir amb for i range |
| 7 | Treballant amb text |
| 8 | Llistes |
| 9 | Funcions |
| 10 | Diccionaris |
| 11 | Posant-ho tot junt |
| 12 | 4 en ratlla |

## Estructura

```
index.html        Simulador lliure (també és el simulador incrustat als capítols)
style.css         Estils del simulador
js/               Motor: Pyodide en un Web Worker, editor, consola, validació
curs/             Capítols, reptes, índex, capitols.js (dades i esquelet), curs.css
tests/            Test automàtic del curs i solucions de referència
docs/             CURRENT-STATE.md: estat complet del projecte
```

## Servir en local

```bash
python3 -m http.server 8000
```

Obre <http://localhost:8000> per al simulador lliure, o <http://localhost:8000/curs/> per al curs.

> Cal un servidor HTTP (no obrir els `.html` com a fitxers): Pyodide i els Web Workers necessiten un origen HTTP.

## Com continuar el desenvolupament

Llegeix [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md) abans de fer cap canvi. Conté l'arquitectura, el format de les pàgines i dels simuladors, els contractes entre mòduls, les decisions preses i les tasques pendents.

Després de qualsevol canvi en un exercici, executa el test automàtic (només cal Python 3):

```bash
python3 tests/comprova-curs.py
```

A GitHub s'executa sol a cada push i a cada pull request (pestanya «Actions»). Més detalls a [`tests/README.md`](tests/README.md).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
