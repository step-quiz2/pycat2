# PyCat — Eines de desenvolupament (`tools/`)

## `generate-pages.js` — Generador de pàgines del curs

Eina per generar HTML de capítols i reptes a partir de descripcions JSON a `tools/pages/*.json`. Permet editar en un sol lloc l'esquelet comú (head, header, sidebar, scripts…) i canviar-lo per totes les pàgines alhora.

### Ús

```bash
# Genera totes les pàgines a curs/
node tools/generate-pages.js

# Genera només una (per nom del fitxer de sortida sense extensió)
node tools/generate-pages.js --only repte-6

# Dry run: mostra què generaria sense escriure cap fitxer
node tools/generate-pages.js --dry-run

# Canvia els directoris d'entrada/sortida
node tools/generate-pages.js --input tools/pages --out curs
```

### Format del fitxer JSON

Cada pàgina és un `tools/pages/{nom}.json` amb aquesta estructura:

```jsonc
{
  "type":  "capitol" | "repte",       // obligatori
  "num":   6,                          // número del capítol/repte
  "titol": "Parell o senar",           // títol visible
  "difficulty": "facil" | "intermedi" | "dificil",   // només reptes
  "lead":  "<p>Text d'introducció…</p>",              // només capítols (opcional)
  "prev":  { "url": "repte-5.html", "label": "← Repte anterior" },
  "next":  { "url": "repte-7.html", "label": "Repte següent →" },
  "hint":  "<p>Pista HTML opcional…</p>",             // només reptes (opcional)
  "sections": [
    // Forma simple: una secció amb un h2 i body
    { "h2": "Títol", "body": "<p>HTML…</p>" },

    // Forma agrupada: una <section> amb múltiples h2s
    {
      "parts": [
        { "h2": "Objectiu",  "body": "<p>…</p>" },
        { "h2": "Simulador", "body": "<p>…</p>", "simulador": { /* veure sota */ } }
      ]
    }
  ]
}
```

### Atributs del simulador

Dins d'una `part` o `section`, el camp `simulador` genera el `<div class="simulador" data-*>` que `curs/capitols.js` converteix en iframe:

```jsonc
"simulador": {
  "goalId":  "repte-6",                      // per al sistema de progrés
  "code":    "# codi inicial\n",              // codi precarregat a l'editor
  "stdin":   "5\n",                           // per a exercicis amb un sol cas
  "expected": "sortida",                      //    "    "    "
  "tests":    [                               // per a Mode C (múltiples casos)
    { "stdin": "4", "expected": "Parell" },
    { "stdin": "7", "expected": "Senar" }
  ],
  "testcode": "print(funcio(2))\n",           // codi Python afegit després del codi de l'alumne
  "readonly": false,                          // true = no editable (exemples)
  "height":   320
}
```

`stdin`/`expected` i `tests` són mútuament exclusius: fes servir `tests` si hi ha més d'un cas.

### Pàgines d'exemple

- `tools/pages/repte-1.json` — repte fàcil amb `expected` simple.
- `tools/pages/repte-6.json` — repte intermedi amb `tests` múltiples.

### Verificació

Després de generar, pots:

1. Obrir `tests/test-exercises.html` (Task 4 Test Runner) per executar les solucions de `tests/solutions.js` contra les pàgines generades.
2. Servir el projecte amb `python3 -m http.server` i obrir `curs/repte-6.html` al navegador.

### Migrar pàgines existents

Aquesta eina **no migra automàticament** les pàgines actuals. Per migrar un repte existent a JSON: obre el seu HTML, identifica-hi el títol, les seccions (`<h2>` + contingut), el simulador (`<div class="simulador" data-*>`), la pista (`<details>`) i la navegació. Tradueix-ho a l'estructura JSON descrita a dalt. L'HTML generat serà semànticament equivalent encara que pugui diferir lleugerament en espais, indentació interna i atributs `aria-*` (que el generador afegeix).
