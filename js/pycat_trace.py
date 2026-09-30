# ════════════════════════════════════════════════════════
# pycat_trace.py — Enregistra una execució pas a pas
#
# pycat_traca(codi, stdin, linies_alumne) executa el codi amb
# sys.settrace i, just ABANS d'executar cada línia de l'alumne, desa:
#   · el número de línia;
#   · les variables de cada nivell de crida (programa principal i
#     funcions), amb el valor escrit com a text (repr, escurçat);
#   · quanta sortida s'ha imprès fins aleshores.
# Retorna un JSON: { passos: [...], sortida: "...", error: {...} | null,
#                    tallat: bool }
#
# El simulador (js/pyworker.js) el fa servir per al botó «👣 Pas a pas»:
# l'alumne pot anar endavant i enrere i veure com canvien les variables.
# L'executa també tests/comprova-curs.py amb CPython.
# ════════════════════════════════════════════════════════

import builtins
import io
import json
import sys
import types

PASSOS_MAXIMS = 1000
LLARGADA_VALOR = 60


def _valor(v):
    if isinstance(v, types.FunctionType):
        return 'funció ' + v.__name__ + '()'
    try:
        r = repr(v)
    except Exception:
        r = '?'
    return r if len(r) <= LLARGADA_VALOR else r[:LLARGADA_VALOR - 1] + '…'


def _tipus(v):
    if isinstance(v, types.FunctionType):
        return 'funció'
    return type(v).__name__


def _variables(d):
    """Variables d'un diccionari de noms, sense les internes ni els mòduls."""
    res = []
    for nom, v in d.items():
        if nom.startswith('__') or isinstance(v, types.ModuleType) or isinstance(v, type):
            continue
        res.append([nom, _valor(v), _tipus(v)])
    return res


class _Prou(Exception):
    """S'ha arribat al màxim de passos (probablement un bucle infinit)."""


def pycat_traca(codi, stdin='', linies_alumne=None):
    passos = []
    sortida = io.StringIO()
    entrada = io.StringIO(stdin or '')
    globals_ = {'__name__': '__main__'}
    tallat = False
    error = None

    def _input(prompt=''):
        linia = entrada.readline()
        if not linia:
            raise EOFError
        return linia.rstrip('\n')

    def _desa(frame):
        # Nivells de crida de l'alumne, del més extern al més intern
        nivells = []
        f = frame
        while f is not None and f.f_code.co_filename == '<exec>':
            if f.f_code.co_name == '<module>':
                nivells.append(['programa', _variables(globals_)])
            else:
                nivells.append([f.f_code.co_name + '()', _variables(f.f_locals)])
            f = f.f_back
        nivells.reverse()
        passos.append({'linia': frame.f_lineno, 'nivells': nivells,
                       'sortida': len(sortida.getvalue())})

    def _traca(frame, event, arg):
        if frame.f_code.co_filename != '<exec>':
            return None
        if event == 'line' and (linies_alumne is None or frame.f_lineno <= linies_alumne):
            if len(passos) >= PASSOS_MAXIMS:
                raise _Prou()
            _desa(frame)
        return _traca

    antic = (sys.stdout, sys.stdin, builtins.input)
    sys.stdout, sys.stdin, builtins.input = sortida, entrada, _input
    try:
        codi_compilat = compile(codi, '<exec>', 'exec')
        sys.settrace(_traca)
        try:
            exec(codi_compilat, globals_)
        finally:
            sys.settrace(None)
    except _Prou:
        tallat = True
    except SyntaxError as e:
        error = {'linia': e.lineno, 'missatge': 'SyntaxError: ' + str(e.msg)}
    except BaseException as e:  # noqa: BLE001 — qualsevol error de l'alumne
        tb = e.__traceback__
        linia = None
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == '<exec>':
                linia = tb.tb_lineno
            tb = tb.tb_next
        missatge = type(e).__name__ + (': ' + str(e) if str(e) else '')
        error = {'linia': linia, 'missatge': missatge}
    finally:
        sys.stdout, sys.stdin, builtins.input = antic

    # Pas final: estat en acabar (sense línia pendent)
    if not tallat:
        passos.append({'linia': None, 'nivells': [['programa', _variables(globals_)]],
                       'sortida': len(sortida.getvalue())})

    return json.dumps({'passos': passos, 'sortida': sortida.getvalue(),
                       'error': error, 'tallat': tallat}, ensure_ascii=False)
