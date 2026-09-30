# ════════════════════════════════════════════════════════
# pycat_turtle.py — Mòdul «turtle» de PyCat
#
# Pyodide no té el mòdul turtle de Python (fa servir Tkinter). Aquest
# en fa una versió amb la MATEIXA API (forward, left, circle, color,
# begin_fill…), perquè el que s'aprèn aquí funcioni igual a Thonny/IDLE.
#
# No dibuixa res: enregistra les ordres de dibuix a _ops. Quan acaba el
# programa, js/pyworker.js crida _pycat_json() i el simulador les anima
# en un <canvas> (js/turtle-view.js).
#
# El worker el desa com a /pycat/turtle.py (davant de la biblioteca
# estàndard) i l'esborra de sys.modules abans de cada execució, perquè
# cada programa comenci amb un full en blanc.
#
# Coordenades com a Python: (0, 0) al centre, y cap amunt, angles en
# graus i en sentit antihorari (0 = cap a la dreta).
# ════════════════════════════════════════════════════════

import json as _json
import math as _math

_MAX_OPS = 50000
_ops = []
_tortugues = []
_modecolor = [1.0]

# Noms de colors en català (a més dels de CSS en anglès)
_COLORS_CA = {
    'vermell': 'red', 'blau': 'blue', 'verd': 'green', 'groc': 'yellow',
    'negre': 'black', 'blanc': 'white', 'taronja': 'orange', 'lila': 'purple',
    'morat': 'purple', 'rosa': 'pink', 'gris': 'gray', 'marró': 'brown',
    'cian': 'cyan', 'granat': 'maroon', 'daurat': 'gold',
}

_VELOCITATS = {'fastest': 0, 'fast': 10, 'normal': 6, 'slow': 3, 'slowest': 1}


class Terminator(Exception):
    pass


class TurtleGraphicsError(Exception):
    pass


def _afegeix(op):
    if len(_ops) >= _MAX_OPS:
        raise TurtleGraphicsError("Massa ordres de dibuix (més de %d). Potser hi ha un bucle infinit?" % _MAX_OPS)
    _ops.append(op)


def _color(args):
    """Converteix els arguments d'un color a un text CSS."""
    if len(args) == 1:
        c = args[0]
    elif len(args) == 3:
        c = tuple(args)
    else:
        raise TurtleGraphicsError("Color no vàlid: %r" % (args,))
    if isinstance(c, str):
        return _COLORS_CA.get(c.lower(), c)
    if isinstance(c, (tuple, list)) and len(c) == 3:
        m = _modecolor[0]
        try:
            r, g, b = [float(v) for v in c]
        except (TypeError, ValueError):
            raise TurtleGraphicsError("Color no vàlid: %r" % (c,))
        if m == 1.0:
            r, g, b = r * 255, g * 255, b * 255
        if not all(0 <= v <= 255 for v in (r, g, b)):
            raise TurtleGraphicsError("Color fora de rang: %r" % (c,))
        return 'rgb(%d,%d,%d)' % (round(r), round(g), round(b))
    raise TurtleGraphicsError("Color no vàlid: %r" % (c,))


class Turtle:
    def __init__(self, shape='classic', undobuffersize=1000, visible=True):
        self._id = len(_tortugues)
        _tortugues.append(self)
        self._x = 0.0
        self._y = 0.0
        self._h = 0.0
        self._baixat = True
        self._llapis = 'black'
        self._farciment = 'black'
        self._gruix = 1
        self._visible = visible
        self._velocitat = 6
        self._poligon = None
        _afegeix({'t': 'new', 'id': self._id, 'v': visible})

    # ── Moviment ────────────────────────────────────────
    def _ves(self, x, y):
        x, y = float(x), float(y)
        if self._baixat:
            _afegeix({'t': 'l', 'id': self._id, 'x1': self._x, 'y1': self._y, 'x2': x, 'y2': y,
                      'c': self._llapis, 'w': self._gruix, 's': self._velocitat})
        else:
            _afegeix({'t': 'm', 'id': self._id, 'x': x, 'y': y, 's': self._velocitat})
        self._x, self._y = x, y
        if self._poligon is not None:
            self._poligon.append([x, y])

    def forward(self, distance):
        a = _math.radians(self._h)
        self._ves(self._x + distance * _math.cos(a), self._y + distance * _math.sin(a))

    def backward(self, distance):
        self.forward(-distance)

    def left(self, angle):
        self.setheading(self._h + angle)

    def right(self, angle):
        self.setheading(self._h - angle)

    def setheading(self, to_angle):
        self._h = float(to_angle) % 360
        _afegeix({'t': 'h', 'id': self._id, 'h': self._h, 's': self._velocitat})

    def goto(self, x, y=None):
        if y is None:
            x, y = x
        self._ves(x, y)

    def setx(self, x):
        self._ves(x, self._y)

    def sety(self, y):
        self._ves(self._x, y)

    def home(self):
        self.goto(0, 0)
        self.setheading(0)

    def circle(self, radius, extent=None, steps=None):
        # Mateix algorisme que el turtle de Python
        if extent is None:
            extent = 360
        if steps is None:
            frac = abs(extent) / 360
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * _math.sin(_math.radians(w2))
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        self.left(w2)
        for _ in range(steps):
            self.forward(l)
            self.left(w)
        self.left(-w2)

    # ── Llapis ──────────────────────────────────────────
    def penup(self):
        self._baixat = False

    def pendown(self):
        self._baixat = True

    def isdown(self):
        return self._baixat

    def pensize(self, width=None):
        if width is None:
            return self._gruix
        self._gruix = width

    def speed(self, speed=None):
        if speed is None:
            return self._velocitat
        if isinstance(speed, str):
            speed = _VELOCITATS.get(speed, 6)
        speed = int(round(speed))
        self._velocitat = speed if 0 <= speed <= 10 else 0
        return None

    def pencolor(self, *args):
        if not args:
            return self._llapis
        self._llapis = _color(args)

    def fillcolor(self, *args):
        if not args:
            return self._farciment
        self._farciment = _color(args)

    def color(self, *args):
        if not args:
            return self._llapis, self._farciment
        if len(args) == 2:
            self._llapis = _color((args[0],))
            self._farciment = _color((args[1],))
        else:
            c = _color(args)
            self._llapis = self._farciment = c

    def begin_fill(self):
        self._poligon = [[self._x, self._y]]

    def end_fill(self):
        if self._poligon is not None and len(self._poligon) > 2:
            _afegeix({'t': 'f', 'id': self._id, 'p': self._poligon, 'c': self._farciment,
                      'lc': self._llapis if self._baixat else None, 'w': self._gruix})
        self._poligon = None

    def filling(self):
        return self._poligon is not None

    def dot(self, size=None, *color):
        mida = size if size is not None else max(self._gruix + 4, 2 * self._gruix)
        c = _color(color) if color else self._llapis
        _afegeix({'t': 'd', 'id': self._id, 'x': self._x, 'y': self._y, 'r': mida / 2.0, 'c': c})

    def write(self, arg, move=False, align='left', font=('Arial', 8, 'normal')):
        mida = font[1] if isinstance(font, (tuple, list)) and len(font) > 1 else 8
        _afegeix({'t': 'w', 'id': self._id, 'x': self._x, 'y': self._y, 'txt': str(arg),
                  'a': align, 'f': mida, 'c': self._llapis})

    # ── Visibilitat i estat ─────────────────────────────
    def hideturtle(self):
        self._visible = False
        _afegeix({'t': 'v', 'id': self._id, 'v': False})

    def showturtle(self):
        self._visible = True
        _afegeix({'t': 'v', 'id': self._id, 'v': True})

    def isvisible(self):
        return self._visible

    def position(self):
        return (round(self._x, 2) + 0.0, round(self._y, 2) + 0.0)

    def xcor(self):
        return round(self._x, 2) + 0.0

    def ycor(self):
        return round(self._y, 2) + 0.0

    def heading(self):
        return round(self._h, 2)

    def distance(self, x, y=None):
        if y is None:
            x, y = x
        return _math.hypot(x - self._x, y - self._y)

    def towards(self, x, y=None):
        if y is None:
            x, y = x
        return _math.degrees(_math.atan2(y - self._y, x - self._x)) % 360

    def clear(self):
        _afegeix({'t': 'clear'})

    def reset(self):
        self.clear()
        self._baixat = True
        self._llapis = self._farciment = 'black'
        self._gruix = 1
        self.penup()
        self.home()
        self.pendown()

    # Ordres que al Python d'escriptori canvien l'aspecte: aquí no fan res
    def shape(self, name=None):
        return 'classic'

    def shapesize(self, *args, **kwargs):
        return None

    def stamp(self):
        return 0

    def getscreen(self):
        return _pantalla

    # Noms alternatius (com al turtle de Python)
    fd = forward
    bk = back = backward
    lt = left
    rt = right
    seth = setheading
    setpos = setposition = goto
    pu = up = penup
    pd = down = pendown
    width = pensize
    ht = hideturtle
    st = showturtle
    pos = position


Pen = RawTurtle = Turtle


class _Screen:
    def bgcolor(self, *args):
        if args:
            _afegeix({'t': 'bg', 'c': _color(args)})

    def colormode(self, cmode=None):
        if cmode is None:
            return _modecolor[0]
        _modecolor[0] = 255 if cmode == 255 else 1.0

    def _res(self, *args, **kwargs):
        return None

    setup = title = tracer = update = mainloop = exitonclick = bye = done = _res
    screensize = delay = listen = onclick = onkey = onscreenclick = _res


_pantalla = _Screen()


def Screen():
    return _pantalla


_principal = []


def _t():
    if not _principal:
        _principal.append(Turtle())
    return _principal[0]


def getturtle():
    return _t()


getpen = getturtle


def _delegada(nom):
    def f(*args, **kwargs):
        return getattr(_t(), nom)(*args, **kwargs)
    f.__name__ = nom
    return f


for _nom in ['forward', 'fd', 'backward', 'bk', 'back', 'left', 'lt', 'right', 'rt',
             'setheading', 'seth', 'goto', 'setpos', 'setposition', 'setx', 'sety', 'home',
             'circle', 'penup', 'pu', 'up', 'pendown', 'pd', 'down', 'isdown', 'pensize',
             'width', 'speed', 'pencolor', 'fillcolor', 'color', 'begin_fill', 'end_fill',
             'filling', 'dot', 'write', 'hideturtle', 'ht', 'showturtle', 'st', 'isvisible',
             'position', 'pos', 'xcor', 'ycor', 'heading', 'distance', 'towards', 'clear',
             'reset', 'shape', 'shapesize', 'stamp']:
    globals()[_nom] = _delegada(_nom)

for _nom in ['bgcolor', 'colormode', 'setup', 'title', 'tracer', 'update', 'mainloop',
             'exitonclick', 'bye', 'done', 'screensize', 'delay', 'listen', 'onclick',
             'onkey', 'onscreenclick']:
    globals()[_nom] = getattr(_pantalla, _nom)


def _pycat_json():
    """Ordres de dibuix enregistrades (les llegeix js/pyworker.js)."""
    if not _ops:
        return None
    return _json.dumps(_ops)
