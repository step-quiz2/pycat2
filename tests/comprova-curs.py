#!/usr/bin/env python3
# ════════════════════════════════════════════════════════
# tests/comprova-curs.py — Test automàtic del curs PyCat
#
# Ús (des de l'arrel del projecte, només cal Python 3):
#     python3 tests/comprova-curs.py
#
# Per a cada exercici validat (<div class="simulador" data-goal-id="...">)
# de curs/*.html comprova que:
#   1. té solució de referència a tests/solutions.js;
#   2. la solució supera TOTS els casos de prova de la pàgina;
#   3. el codi inicial de l'exercici NO els supera (si no, l'exercici
#      es resol sense fer res);
#   4. cada goalId és únic i els de curs/capitols.js existeixen a les pàgines;
#   5. la solució compleix els requisits de data-requires (js/pycat_requires.py);
#   6. cap data-code conté HTML (senyal d'una cometa de tancament oblidada);
#   7. el «pas a pas» (js/pycat_trace.py) de la solució acaba sense errors
#      i dona la mateixa sortida que el primer cas de prova;
#   8. problemes de Parsons (.parsons): la solució té indentació de 4 espais,
#      s'executa sense errors i, si hi ha data-expected, dona aquesta sortida;
#   9. qüestionaris (.quiz): data-correcta és vàlida i, a les preguntes amb
#      data-comprova, el codi dona exactament el text de l'opció correcta.
#
# Imita el simulador (js/pyworker.js, mode batch): input() llegeix de
# l'stdin del cas de prova sense imprimir la pregunta, cada execució té
# variables noves, i la sortida es compara amb .strip() (js/ui.js).
#
# A GitHub s'executa sol a cada push (.github/workflows/comprova-curs.yml).
# Surt amb codi 1 si hi ha algun error.
# ════════════════════════════════════════════════════════

import glob
import html
import json
import os
import re
import subprocess
import sys
from html.parser import HTMLParser

sys.dont_write_bytecode = True   # no deixis js/__pycache__
sys.path.insert(0,os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'js'))
from pycat_requires import pycat_requisits_que_falten  # noqa: E402  (mateix codi que el simulador)
from pycat_trace import pycat_traca  # noqa: E402

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPS_MAXIM = 10  # segons per execució (com P.EXEC_TIMEOUT)

# Programa que executa el codi de l'alumne com ho fa el simulador
EXECUTOR = r'''
import builtins, sys
def _input(prompt=''):
    line = sys.stdin.readline()
    if not line:
        raise EOFError
    return line.rstrip('\n')
builtins.input = _input
codi = open(sys.argv[1], encoding='utf-8').read()
exec(compile(codi, '<exec>', 'exec'), {'__name__': '__main__'})
'''


class Simuladors(HTMLParser):
    """Recull els atributs de cada <div class="simulador">."""

    def __init__(self):
        super().__init__()
        self.sims = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'div' and 'simulador' in (d.get('class') or '').split():
            self.sims.append(d)


def llegeix_solucions():
    text = open(os.path.join(ARREL, 'tests', 'solutions.js'), encoding='utf-8').read()
    sols = {}
    for clau, codi in re.findall(r"^\s*'([\w-]+)':\s*`(.*?)`", text, re.M | re.S):
        # Els template literals de JS amb \ o ${ canviarien el text: no se n'usen
        if '\\' in codi or '${' in codi:
            raise SystemExit(f"solutions.js: la solució '{clau}' conté \\ o ${{ (no suportat)")
        sols[clau] = codi
    return sols


def casos_de_prova(sim):
    if sim.get('data-tests'):
        return [{'stdin': t.get('stdin', t.get('input')), 'expected': t.get('expected', '')}
                for t in json.loads(sim['data-tests'])]
    return [{'stdin': sim.get('data-stdin'), 'expected': sim.get('data-expected', '')}]


def executa(codi, stdin, tmp):
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(codi)
    try:
        r = subprocess.run([sys.executable, '-c', EXECUTOR, tmp], input=stdin or '',
                           capture_output=True, text=True, timeout=TEMPS_MAXIM)
    except subprocess.TimeoutExpired:
        return None, 'temps excedit'
    if r.returncode != 0:
        return None, (r.stderr.strip().splitlines() or ['error'])[-1]
    return r.stdout, None


def supera(codi, casos, tmp):
    """Retorna (tots_superats, primer_cas_fallit_o_None)."""
    for i, cas in enumerate(casos):
        sortida, error = executa(codi, cas['stdin'], tmp)
        if sortida is None or sortida.strip() != (cas['expected'] or '').strip():
            return False, (i, cas, sortida, error)
    return True, None


def _attr(tag, nom):
    m = re.search(nom + r'="([^"]*)"', tag)
    return html.unescape(m.group(1)) if m else None


def comprova_parsons(nom, text, tmp):
    errors = []
    for m in re.finditer(r'(<div class="parsons"[^>]*>)\s*<pre class="parsons-codi">(.*?)</pre>', text, re.S):
        tag, codi = m.group(1), html.unescape(m.group(2))
        goal = _attr(tag, 'data-goal-id')
        for linia in codi.split('\n'):
            espais = len(linia) - len(linia.lstrip(' '))
            if linia.strip() and espais % 4:
                errors.append(f"{nom} [{goal}]: Parsons amb indentació que no és múltiple de 4")
        sortida, error = executa(codi, _attr(tag, 'data-stdin'), tmp)
        esperat = _attr(tag, 'data-expected')
        if error:
            errors.append(f"{nom} [{goal}]: la solució del Parsons dona error: {error}")
        elif esperat is not None and sortida.strip() != esperat.strip():
            errors.append(f"{nom} [{goal}]: el Parsons treu {sortida.strip()!r}, esperava {esperat!r}")
    return errors


def comprova_quiz(nom, text, tmp):
    errors = []
    for q in re.finditer(r'(<div class="quiz-q"[^>]*>)(.*?)</div>', text, re.S):
        tag, cos = q.group(1), q.group(2)
        opcions = [html.unescape(re.sub(r'<[^>]+>', '', o)) for o in re.findall(r'<li>(.*?)</li>', cos, re.S)]
        try:
            correcta = int(_attr(tag, 'data-correcta')) - 1
        except (TypeError, ValueError):
            correcta = -1
        if not 0 <= correcta < len(opcions):
            errors.append(f"{nom}: pregunta amb data-correcta no vàlida ({cos[:60].strip()!r}…)")
            continue
        if 'data-comprova' in tag:
            m = re.search(r'<pre class="code-example">(.*?)</pre>', cos, re.S)
            if not m:
                errors.append(f"{nom}: pregunta amb data-comprova sense codi")
                continue
            sortida, error = executa(html.unescape(m.group(1)), _attr(tag, 'data-stdin'), tmp)
            obtingut = (sortida or '').strip() if not error else 'Error'
            if obtingut != opcions[correcta].strip():
                errors.append(f"{nom}: pregunta «{m.group(1).splitlines()[0]}…»: el codi dona "
                              f"{obtingut!r} però la resposta marcada és {opcions[correcta]!r}")
    return errors


def main():
    errors = []
    sols = llegeix_solucions()
    tmp = os.path.join(ARREL, 'tests', '.tmp-comprova.py')
    goals_vistos = {}
    total_casos = 0

    try:
        for pagina in sorted(glob.glob(os.path.join(ARREL, 'curs', '*.html'))):
            nom = os.path.basename(pagina)
            p = Simuladors()
            p.feed(open(pagina, encoding='utf-8').read())
            for sim in p.sims:
                # Una cometa de tancament oblidada fa que l'atribut s'empassi
                # l'HTML de la pàgina (va passar al capítol 12)
                if re.search(r'</?(p|div|section|h2|li|ul)\b', sim.get('data-code', '')):
                    errors.append(f"{nom}: un data-code conté HTML (falta la cometa de tancament?)")
                goal = sim.get('data-goal-id')
                if not goal:
                    continue
                if goal in goals_vistos:
                    errors.append(f"{nom}: goalId '{goal}' repetit (també a {goals_vistos[goal]})")
                goals_vistos[goal] = nom

                try:
                    casos = casos_de_prova(sim)
                except json.JSONDecodeError as e:
                    errors.append(f"{nom} [{goal}]: data-tests no és JSON vàlid ({e})")
                    continue
                testcode = sim.get('data-testcode', '')
                afegeix = (lambda c: c + '\n\n# ── Tests ──\n' + testcode) if testcode else (lambda c: c)

                sol = sols.get(goal)
                if sol is None:
                    errors.append(f"{nom} [{goal}]: no té solució a tests/solutions.js")
                else:
                    total_casos += len(casos)
                    ok, fallit = supera(afegeix(sol), casos, tmp)
                    if not ok:
                        i, cas, sortida, error = fallit
                        detall = f"error: {error}" if error else f"ha tret {sortida.strip()!r}"
                        errors.append(f"{nom} [{goal}]: la solució falla el cas {i + 1} "
                                      f"(stdin {cas['stdin']!r}): esperava {cas['expected'].strip()!r}, {detall}")

                if sol is not None and sim.get('data-requires'):
                    try:
                        falten = pycat_requisits_que_falten(sol, sim['data-requires'])
                    except ValueError as e:
                        errors.append(f"{nom} [{goal}]: {e}")
                    else:
                        if falten:
                            errors.append(f"{nom} [{goal}]: la solució no fa servir: {', '.join(falten)}")

                if sol is not None and casos:
                    codi_sol = afegeix(sol)
                    traca = json.loads(pycat_traca(codi_sol, casos[0]['stdin'] or '',
                                                   len(sol.split('\n'))))
                    if traca['error'] or traca['tallat']:
                        errors.append(f"{nom} [{goal}]: el pas a pas de la solució falla: "
                                      f"{traca['error'] or 'massa passos'}")
                    elif traca['sortida'].strip() != (casos[0]['expected'] or '').strip():
                        errors.append(f"{nom} [{goal}]: el pas a pas no dona la sortida esperada")

                inicial = sim.get('data-code', '')
                if supera(afegeix(inicial), casos, tmp)[0]:
                    errors.append(f"{nom} [{goal}]: el codi inicial ja supera tots els casos")
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)

    # Activitats sense simulador (curs/activitats.js)
    for pagina in sorted(glob.glob(os.path.join(ARREL, 'curs', '*.html'))):
        nom = os.path.basename(pagina)
        text = open(pagina, encoding='utf-8').read()
        for goal in re.findall(r'class="(?:parsons|quiz)"[^>]*data-goal-id="([^"]+)"', text):
            if goal in goals_vistos:
                errors.append(f"{nom}: goalId '{goal}' repetit (també a {goals_vistos[goal]})")
            goals_vistos[goal] = nom
        errors += comprova_parsons(nom, text, tmp)
        errors += comprova_quiz(nom, text, tmp)
    if os.path.exists(tmp):
        os.remove(tmp)

    # goalIds declarats a capitols.js
    capitols = open(os.path.join(ARREL, 'curs', 'capitols.js'), encoding='utf-8').read()
    for goal in re.findall(r"goalId:\s*'([\w-]+)'", capitols):
        if goal not in goals_vistos:
            errors.append(f"curs/capitols.js: goalId '{goal}' no existeix a cap pàgina")

    for goal in sorted(set(sols) - set(goals_vistos)):
        errors.append(f"tests/solutions.js: solució '{goal}' sense cap exercici")

    print(f"Exercicis: {len(goals_vistos)} · casos de prova de les solucions: {total_casos}")
    if errors:
        print(f"\n❌ {len(errors)} error(s):")
        for e in errors:
            print('  - ' + e)
        sys.exit(1)
    print('✅ Tot correcte')


if __name__ == '__main__':
    main()
