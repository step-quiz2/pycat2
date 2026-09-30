# ════════════════════════════════════════════════════════
# pycat_requires.py — Comprova COM està fet un exercici
#
# Un exercici pot demanar, a més d'una sortida concreta, que el codi
# faci servir certes construccions (atribut data-requires del simulador):
#
#     <div class="simulador" data-requires="fstring,for" ...>
#
# Així no es pot «aprovar» un exercici imprimint directament el text
# final amb print("...").
#
# El fa servir:
#   · js/pyworker.js (dins de Pyodide) quan la sortida ja és correcta;
#   · tests/comprova-curs.py per comprovar que les solucions de
#     referència compleixen els requisits.
#
# ESCALAR: afegir una entrada a REQUISITS amb la funció que ho
# comprova sobre l'arbre sintàctic (ast) i la descripció en català.
# ════════════════════════════════════════════════════════

import ast


def _crida_a(nom):
    """Hi ha alguna crida nom(...)?"""
    return lambda arbre: any(isinstance(n, ast.Call) and isinstance(n.func, ast.Name)
                             and n.func.id == nom for n in ast.walk(arbre))


def _metode(nom):
    """Hi ha alguna crida x.nom(...)?"""
    return lambda arbre: any(isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                             and n.func.attr == nom for n in ast.walk(arbre))


def _node(*tipus):
    return lambda arbre: any(isinstance(n, tipus) for n in ast.walk(arbre))


def _variables(arbre):
    """Hi ha alguna assignació a una variable (x = ...)?"""
    return any(isinstance(n, (ast.Assign, ast.AnnAssign, ast.AugAssign)) for n in ast.walk(arbre))


# clau → (funció de comprovació, descripció en català)
REQUISITS = {
    'variables': (_variables,                          'desar valors en variables'),
    'fstring':   (_node(ast.JoinedStr),                'una f-string (f"...{variable}...")'),
    'input':     (_crida_a('input'),                   'llegir les dades amb input()'),
    'if':        (_node(ast.If, ast.IfExp),            'una decisió amb if'),
    'while':     (_node(ast.While),                    'un bucle while'),
    'for':       (_node(ast.For, ast.comprehension),   'un bucle for'),
    'list':      (lambda a: _node(ast.List, ast.ListComp)(a) or _crida_a('list')(a),
                  'una llista'),
    'dict':      (lambda a: _node(ast.Dict, ast.DictComp)(a) or _crida_a('dict')(a),
                  'un diccionari'),
    'def':       (_node(ast.FunctionDef),              'definir una funció amb def'),
    'return':    (_node(ast.Return),                   'retornar el resultat amb return'),
    'try':       (_node(ast.Try),                      'gestionar l\'error amb try / except'),
    'split':     (_metode('split'),                    'el mètode .split()'),
}


def pycat_requisits_que_falten(codi, claus):
    """Retorna la llista de descripcions dels requisits que el codi NO compleix.

    `claus` és una cadena separada per comes (p. ex. "fstring,for").
    Si el codi té errors de sintaxi, retorna una llista buida: l'error
    ja el mostra l'execució.
    """
    try:
        arbre = ast.parse(codi)
    except SyntaxError:
        return []
    falten = []
    for clau in [c.strip() for c in (claus or '').split(',') if c.strip()]:
        if clau not in REQUISITS:
            raise ValueError("requisit desconegut a data-requires: '%s'" % clau)
        comprova, descripcio = REQUISITS[clau]
        if not comprova(arbre):
            falten.append(descripcio)
    return falten
