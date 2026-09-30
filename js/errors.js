// ════════════════════════════════════════════════════════
// errors.js — Explicació en català dels errors de Python
//
// P.explainError(msg) rep l'última línia del traceback
// (p. ex. "NameError: name 'x' is not defined") i retorna
//   { text: 'explicació curta', hint: 'pista (o null)' }
// o null si no el sabem explicar (llavors només es mostra
// el missatge original).
//
// L'original es continua mostrant a la consola: l'alumne ha
// d'aprendre a llegir els errors reals de Python.
//
// ESCALAR: afegir entrades a ERROR_RULES. Cada regla té un
// patró (RegExp sobre el missatge sencer) i una funció que
// rep el resultat del match i retorna { text, hint }.
// ════════════════════════════════════════════════════════

var ERROR_RULES = [

  // ── Errors de sintaxi ─────────────────────────────────
  { re: /^SyntaxError: unterminated string literal/,
    fn: () => ({ text: 'Hi ha un text (string) que no es tanca.',
                 hint: 'Comprova que cada text tingui cometes al principi i al final: "així".' }) },
  { re: /^SyntaxError: unterminated triple-quoted string/,
    fn: () => ({ text: 'Un text amb triples cometes (""" o \'\'\') no es tanca mai.',
                 hint: 'Afegeix les tres cometes de tancament.' }) },
  { re: /^SyntaxError: '(.)' was never closed/,
    fn: m => ({ text: 'Has obert un «' + m[1] + '» que no es tanca mai.',
                hint: 'Compta els parèntesis/claudàtors: n\'hi ha d\'haver tants d\'oberts com de tancats. L\'error pot ser en una línia anterior.' }) },
  { re: /^SyntaxError: unmatched '(.)'/,
    fn: m => ({ text: 'Sobra un «' + m[1] + '»: es tanca alguna cosa que no s\'havia obert.',
                hint: 'Revisa els parèntesis i claudàtors d\'aquesta línia.' }) },
  { re: /^SyntaxError: closing parenthesis '(.)' does not match opening parenthesis '(.)'/,
    fn: m => ({ text: 'S\'ha obert amb «' + m[2] + '» però es tanca amb «' + m[1] + '».',
                hint: '( es tanca amb ), [ amb ] i { amb }.' }) },
  { re: /^SyntaxError: expected ':'/,
    fn: () => ({ text: 'Falten els dos punts «:» al final de la línia.',
                 hint: 'Les línies que comencen amb if, elif, else, for, while i def acaben amb «:».' }) },
  { re: /^SyntaxError: invalid syntax\. Maybe you meant '==' or ':=' instead of '='\?/,
    fn: () => ({ text: 'Has fet servir «=» on calia «==».',
                 hint: '«=» desa un valor en una variable; «==» compara si dos valors són iguals.' }) },
  { re: /^SyntaxError: invalid syntax\. Perhaps you forgot a comma\?/,
    fn: () => ({ text: 'Sembla que falta una coma.',
                 hint: 'Dins de print(...) o d\'una llista, els elements se separen amb comes: print("Tinc", edat, "anys").' }) },
  { re: /^SyntaxError: cannot assign to (literal|expression|function call)/,
    fn: () => ({ text: 'A l\'esquerra del «=» hi ha d\'haver el nom d\'una variable.',
                 hint: 'Escriu-ho així: variable = valor (per exemple: x = 5, no 5 = x).' }) },
  { re: /^SyntaxError: invalid character '(.)'/,
    fn: m => ({ text: 'Hi ha un caràcter que Python no entén: «' + m[1] + '».',
                hint: 'Sovint passa amb cometes tipogràfiques (“ ” ‘ ’) copiades d\'un document. Fes servir " o \'.' }) },
  { re: /^SyntaxError: invalid decimal literal/,
    fn: () => ({ text: 'Hi ha un número enganxat a lletres (o un nom de variable que comença amb un número).',
                 hint: 'Els noms de variable no poden començar amb un número. Els decimals s\'escriuen amb punt: 3.14.' }) },
  { re: /^SyntaxError: 'return' outside function/,
    fn: () => ({ text: 'Hi ha un return fora d\'una funció.',
                 hint: 'return només es pot fer servir dins d\'un def. Revisa la indentació.' }) },
  { re: /^SyntaxError: 'break' outside loop/,
    fn: () => ({ text: 'Hi ha un break fora d\'un bucle.',
                 hint: 'break només es pot fer servir dins d\'un for o d\'un while. Revisa la indentació.' }) },
  { re: /^SyntaxError: Missing parentheses in call to 'print'/,
    fn: () => ({ text: 'A Python 3, print necessita parèntesis.',
                 hint: 'Escriu print("Hola") en lloc de print "Hola".' }) },
  { re: /^SyntaxError:/,
    fn: () => ({ text: 'Python no entén com està escrita aquesta línia (error de sintaxi).',
                 hint: 'Revisa cometes, parèntesis, comes i els dos punts «:». De vegades l\'error és a la línia anterior.' }) },

  // ── Errors d'indentació ───────────────────────────────
  { re: /^IndentationError: expected an indented block/,
    fn: () => ({ text: 'Després dels «:» calia una línia indentada (amb espais al davant).',
                 hint: 'Les instruccions de dins d\'un if, for, while o def van 4 espais més a la dreta.' }) },
  { re: /^IndentationError: unexpected indent/,
    fn: () => ({ text: 'Aquesta línia té espais al davant que no toquen.',
                 hint: 'Només s\'indenta després d\'una línia acabada en «:». Treu els espais de davant.' }) },
  { re: /^IndentationError: unindent does not match any outer indentation level/,
    fn: () => ({ text: 'La indentació d\'aquesta línia no coincideix amb cap de les anteriors.',
                 hint: 'Totes les línies d\'un mateix bloc han de tenir exactament els mateixos espais al davant.' }) },
  { re: /^TabError:/,
    fn: () => ({ text: 'Es barregen tabuladors i espais per indentar.',
                 hint: 'Fes servir sempre 4 espais (la tecla Tab de l\'editor ja ho fa).' }) },

  // ── Noms ──────────────────────────────────────────────
  { re: /^UnboundLocalError: cannot access local variable '(\w+)'/,
    fn: m => ({ text: 'Dins de la funció es fa servir «' + m[1] + '» abans de donar-li valor.',
                hint: 'Si la variable és de fora de la funció, passa-la com a paràmetre.' }) },
  { re: /^NameError: name '(\w+)' is not defined\. Did you mean: '(\w+)'\?/,
    fn: m => ({ text: 'Python no coneix el nom «' + m[1] + '». Volies dir «' + m[2] + '»?',
                hint: 'Revisa com l\'has escrit: Python distingeix majúscules i minúscules.' }) },
  { re: /^NameError: name '(\w+)' is not defined/,
    fn: m => ({ text: 'Python no coneix el nom «' + m[1] + '».',
                hint: 'L\'has escrit bé? Li has donat valor abans d\'usar-lo? Si és un text, li falten les cometes: "' + m[1] + '".' }) },

  // ── Tipus ─────────────────────────────────────────────
  { re: /^TypeError: can only concatenate str \(not "(\w+)"\) to str/,
    fn: m => ({ text: 'No es pot sumar un text amb un ' + _tipus(m[1]) + '.',
                hint: 'Converteix el número a text amb str(...), fes servir comes a print(...) o una f-string: f"Tinc {edat} anys".' }) },
  { re: /^TypeError: unsupported operand type\(s\) for ([^:]+): '(\w+)' and '(\w+)'/,
    fn: m => ({ text: 'No es pot fer «' + m[1].trim() + '» entre un ' + _tipus(m[2]) + ' i un ' + _tipus(m[3]) + '.',
                hint: (m[2] === 'str' || m[3] === 'str')
                  ? 'input() sempre retorna text: si necessites un número, fes int(input()) o float(input()).'
                  : 'Comprova el tipus de cada valor (pots fer print(type(x))).' }) },
  { re: /^TypeError: '(.+)' not supported between instances of '(\w+)' and '(\w+)'/,
    fn: m => ({ text: 'No es pot comparar amb «' + m[1] + '» un ' + _tipus(m[2]) + ' i un ' + _tipus(m[3]) + '.',
                hint: 'input() sempre retorna text: per comparar números, converteix-lo amb int(...) o float(...).' }) },
  { re: /^TypeError: can't multiply sequence by non-int of type '(\w+)'/,
    fn: m => ({ text: 'Un text només es pot multiplicar per un nombre enter, no per un ' + _tipus(m[1]) + '.',
                hint: 'Potser volies convertir el text a número amb int(...) o float(...).' }) },
  { re: /^TypeError: '(\w+)' object is not callable/,
    fn: m => ({ text: 'S\'intenta cridar amb parèntesis una cosa que no és una funció (és un ' + _tipus(m[1]) + ').',
                hint: 'Potser has fet servir el nom d\'una funció (com print, input, len...) per a una variable.' }) },
  { re: /^TypeError: (\w+)\(\) missing (\d+) required positional arguments?/,
    fn: m => ({ text: 'La funció ' + m[1] + '() necessita més valors dels que li has passat (en falten ' + m[2] + ').',
                hint: 'Compara la crida amb el def: hi ha d\'haver tants valors com paràmetres.' }) },
  { re: /^TypeError: (\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/,
    fn: m => ({ text: 'La funció ' + m[1] + '() espera ' + m[2] + ' valor(s) però n\'hi has passat ' + m[3] + '.',
                hint: 'Compara la crida amb el def: hi ha d\'haver tants valors com paràmetres.' }) },
  { re: /^TypeError: object of type '(\w+)' has no len\(\)/,
    fn: m => ({ text: 'len() no funciona amb un ' + _tipus(m[1]) + '.',
                hint: 'len() serveix per a textos, llistes i diccionaris.' }) },
  { re: /^TypeError: '(\w+)' object is not subscriptable/,
    fn: m => ({ text: 'No es pot fer servir [...] amb un ' + _tipus(m[1]) + '.',
                hint: 'Els claudàtors serveixen per a textos, llistes i diccionaris.' }) },
  { re: /^TypeError: '(\w+)' object is not iterable/,
    fn: m => ({ text: 'No es pot recórrer amb for un ' + _tipus(m[1]) + '.',
                hint: 'Per repetir n vegades, fes servir for i in range(n).' }) },
  { re: /^TypeError: 'str' object does not support item assignment/,
    fn: () => ({ text: 'Un text no es pot modificar lletra a lletra.',
                 hint: 'Crea un text nou (per exemple, sumant trossos) en lloc de canviar-ne una lletra.' }) },

  // ── Valors ────────────────────────────────────────────
  { re: /^ValueError: invalid literal for int\(\) with base 10: (.*)$/,
    fn: m => ({ text: 'No es pot convertir ' + m[1] + ' en un nombre enter.',
                hint: 'int(...) només funciona amb textos que són nombres enters, com "42". Perquè el programa no s\'aturi si l\'usuari s\'equivoca, fes servir try / except ValueError (capítol 5).' }) },
  { re: /^ValueError: could not convert string to float: (.*)$/,
    fn: m => ({ text: 'No es pot convertir ' + m[1] + ' en un nombre decimal.',
                hint: 'Els decimals s\'escriuen amb punt, no amb coma: 3.5 (no 3,5).' }) },
  { re: /^ValueError: (.+) is not in list/,
    fn: m => ({ text: m[1] + ' no és a la llista.',
                hint: 'Abans de fer .index() o .remove(), comprova-ho amb: if valor in llista:' }) },
  { re: /^ValueError: list\.remove\(x\): x not in list/,
    fn: () => ({ text: 'L\'element que vols treure no és a la llista.',
                 hint: 'Comprova-ho abans amb: if valor in llista:' }) },

  // ── Posicions i claus ─────────────────────────────────
  { re: /^IndexError: (list|string|str|tuple) index out of range/,
    fn: m => ({ text: 'Has demanat una posició que no existeix ' + (m[1] === 'list' ? 'a la llista' : 'al text') + '.',
                hint: 'Les posicions van de 0 a len(...) - 1. Amb 3 elements, les posicions són 0, 1 i 2.' }) },
  { re: /^IndexError: pop from empty list/,
    fn: () => ({ text: 'No es pot fer .pop() d\'una llista buida.',
                 hint: 'Comprova abans que la llista tingui elements: if llista:' }) },
  { re: /^KeyError: (.*)$/,
    fn: m => ({ text: 'La clau ' + m[1] + ' no existeix al diccionari.',
                hint: 'Comprova-ho abans amb: if clau in diccionari:  o fes servir diccionari.get(clau).' }) },
  { re: /^AttributeError: '(\w+)' object has no attribute '(\w+)'\. Did you mean: '(\w+)'\?/,
    fn: m => ({ text: 'Un ' + _tipus(m[1]) + ' no té cap mètode anomenat «' + m[2] + '». Volies dir «' + m[3] + '»?',
                hint: 'Revisa com s\'escriu el mètode.' }) },
  { re: /^AttributeError: '(\w+)' object has no attribute '(\w+)'/,
    fn: m => ({ text: 'Un ' + _tipus(m[1]) + ' no té cap mètode o atribut anomenat «' + m[2] + '».',
                hint: 'Revisa com s\'escriu el mètode (majúscules, punt...) i de quin tipus és la variable.' }) },

  // ── Altres ────────────────────────────────────────────
  { re: /^ZeroDivisionError:/,
    fn: () => ({ text: 'S\'ha intentat dividir per zero.',
                 hint: 'Comprova que el divisor no sigui 0 abans de dividir: if b != 0:' }) },
  { re: /^EOFError/,
    fn: () => ({ text: 'El programa demana més dades amb input() de les que s\'han escrit.',
                 hint: 'Compta quants input() s\'executen i quantes entrades hi ha.' }) },
  { re: /^RecursionError:/,
    fn: () => ({ text: 'Una funció s\'ha cridat a si mateixa massa vegades.',
                 hint: 'Comprova que la funció tingui un cas en què s\'acaba sense tornar-se a cridar.' }) },
  { re: /^(ModuleNotFoundError|ImportError): No module named '(\w+)'/,
    fn: m => ({ text: 'No existeix cap mòdul anomenat «' + m[2] + '».',
                hint: 'Revisa com l\'has escrit (per exemple: import random).' }) },
  { re: /^AssertionError/,
    fn: () => ({ text: 'Una comprovació (assert) no s\'ha complert.',
                 hint: null }) },
];

// Nom en català d'un tipus de Python
function _tipus(t) {
  return ({ str: 'text (str)', int: 'nombre enter (int)', float: 'nombre decimal (float)',
            bool: 'booleà (bool)', list: 'llista (list)', dict: 'diccionari (dict)',
            tuple: 'tupla (tuple)', NoneType: 'valor None', function: 'funció' })[t] || t;
}

function explainError(msg) {
  if (!msg) return null;
  for (var i = 0; i < ERROR_RULES.length; i++) {
    var m = msg.match(ERROR_RULES[i].re);
    if (m) return ERROR_RULES[i].fn(m);
  }
  return null;
}


// ── Exporta ──────────────────────────────────────────────
P.explainError = explainError;
