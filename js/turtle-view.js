// ════════════════════════════════════════════════════════
// turtle-view.js — Dibuix de la tortuga en un <canvas>
//
// Quan un programa fa servir «import turtle», el worker retorna les
// ordres de dibuix enregistrades per js/pycat_turtle.py. Aquí es
// reprodueixen, animades, en un panell «🐢 Dibuix» a sobre de la consola.
//
// Tipus d'ordre (camp t):
//   new  tortuga nova          l   línia (x1,y1 → x2,y2)   m  moviment sense dibuixar
//   h    canvi de direcció     f   polígon farcit          d  punt
//   w    text                  v   mostra/amaga tortuga    bg color de fons
//   clear esborra el dibuix
//
// La velocitat (camp s, 0–10) és la de turtle.speed(): 0 = instantani.
//
// API: P.turtleShow(json), P.turtleClear()
// ════════════════════════════════════════════════════════

var _tv = null;   // { ops, idx, raf, tortugues, bg, escala, ... }

// ── Panell (es crea el primer cop) ───────────────────────
function _turtlePanel() {
  var panel = document.getElementById('turtle-panel');
  if (panel) return panel;
  var col = document.querySelector('.console-col');
  if (!col) return null;
  panel = document.createElement('div');
  panel.id = 'turtle-panel';
  panel.className = 'turtle-panel';
  panel.innerHTML =
    '<div class="turtle-header">' +
      '<span>🐢 ' + P.t('ui.turtle_title') + '</span>' +
      '<span class="turtle-actions">' +
        '<button type="button" class="btn" data-tv="skip" title="' + P.t('ui.turtle_skip_title') + '">⏩</button>' +
        '<button type="button" class="btn" data-tv="save" title="' + P.t('ui.turtle_save_title') + '">💾</button>' +
        '<button type="button" class="btn" data-tv="close" title="' + P.t('ui.turtle_close_title') + '">✕</button>' +
      '</span>' +
    '</div>' +
    '<div class="turtle-stage">' +
      '<canvas class="turtle-drawing"></canvas>' +
      '<canvas class="turtle-sprites"></canvas>' +
    '</div>';
  col.insertBefore(panel, col.querySelector('.console-header'));
  panel.addEventListener('click', function(e) {
    var a = e.target.getAttribute('data-tv');
    if (a === 'skip' && _tv) _finish();
    else if (a === 'save') _save();
    else if (a === 'close') turtleClear();
  });
  window.addEventListener('resize', function() { if (_tv) _redrawAll(); });
  return panel;
}

// ── Mostra (anima) un dibuix ─────────────────────────────
function turtleShow(json) {
  var ops;
  try { ops = JSON.parse(json); } catch (_) { return; }
  if (!ops || !ops.length) return;
  _stop();
  var panel = _turtlePanel();
  if (!panel) return;
  panel.hidden = false;
  document.body.classList.add('has-turtle');

  _tv = { ops: ops, idx: 0, raf: null, tortugues: {}, bg: '#ffffff' };
  _setup();
  _clearDrawing();
  _tick();
}

function turtleClear() {
  _stop();
  _tv = null;
  var panel = document.getElementById('turtle-panel');
  if (panel) panel.hidden = true;
  document.body.classList.remove('has-turtle');
}

function _stop() {
  if (_tv && _tv.raf) cancelAnimationFrame(_tv.raf);
  if (_tv) _tv.raf = null;
}

// ── Mida del canvas i escala ─────────────────────────────
// Si el dibuix no hi cap, s'escala perquè hi càpiga sencer.
function _setup() {
  var panel = document.getElementById('turtle-panel');
  var stage = panel.querySelector('.turtle-stage');
  var dpr = window.devicePixelRatio || 1;
  var w = stage.clientWidth || 300, h = stage.clientHeight || 300;
  panel.querySelectorAll('canvas').forEach(function(c) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
  });
  // Extensió del dibuix
  var m = 50;
  _tv.ops.forEach(function(o) {
    var xs = [], ys = [];
    if (o.t === 'l') { xs = [o.x1, o.x2]; ys = [o.y1, o.y2]; }
    else if (o.t === 'm' || o.t === 'd' || o.t === 'w') { xs = [o.x]; ys = [o.y]; }
    else if (o.t === 'f') { o.p.forEach(function(p) { xs.push(p[0]); ys.push(p[1]); }); }
    xs.forEach(function(x) { m = Math.max(m, Math.abs(x)); });
    ys.forEach(function(y) { m = Math.max(m, Math.abs(y)); });
  });
  var costat = Math.min(w, h) / 2 - 12;
  _tv.escala = Math.min(1, costat / (m + 10)) * dpr;
  _tv.cx = (w * dpr) / 2;
  _tv.cy = (h * dpr) / 2;
  _tv.dpr = dpr;
}

function _px(x) { return _tv.cx + x * _tv.escala; }
function _py(y) { return _tv.cy - y * _tv.escala; }

function _ctx(sel) {
  return document.querySelector('#turtle-panel .' + sel).getContext('2d');
}

// El dibuix és transparent; el color de fons (bgcolor) és el de l'escenari
function _clearDrawing() {
  var c = _ctx('turtle-drawing');
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.restore();
  _setBg(_tv.bg);
}

function _setBg(color) {
  var stage = document.querySelector('#turtle-panel .turtle-stage');
  if (stage) stage.style.background = color;
}

// ── Animació ─────────────────────────────────────────────
function _tick() {
  if (!_tv) return;
  // Cada fotograma avança unes quantes ordres segons la velocitat
  var pressupost = 0;
  while (_tv.idx < _tv.ops.length) {
    var o = _tv.ops[_tv.idx];
    var s = (o.s === undefined) ? 6 : o.s;
    var cost = (o.t === 'l' || o.t === 'm' || o.t === 'h') ? (s === 0 ? 0 : 1 / s) : 0;
    if (pressupost + cost > 1 && pressupost > 0) break;
    pressupost += cost;
    _apply(o);
    _tv.idx++;
  }
  _drawSprites();
  if (_tv.idx < _tv.ops.length) _tv.raf = requestAnimationFrame(_tick);
  else _tv.raf = null;
}

function _finish() {
  _stop();
  while (_tv.idx < _tv.ops.length) _apply(_tv.ops[_tv.idx++]);
  _drawSprites();
}

// Torna a dibuixar tot fins al punt actual (p. ex. si canvia la mida)
function _redrawAll() {
  var fins = _tv.idx;
  _tv.tortugues = {};
  _tv.bg = '#ffffff';
  _setup();
  _clearDrawing();
  for (var i = 0; i < fins; i++) _apply(_tv.ops[i]);
  _drawSprites();
}

function _apply(o) {
  var c = _ctx('turtle-drawing');
  var T = _tv.tortugues;
  var e = _tv.escala;
  if (o.t === 'new') {
    T[o.id] = { x: 0, y: 0, h: 0, v: o.v !== false, c: 'black' };
  } else if (o.t === 'l') {
    c.strokeStyle = o.c;
    c.lineWidth = Math.max(1, o.w) * e;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(_px(o.x1), _py(o.y1));
    c.lineTo(_px(o.x2), _py(o.y2));
    c.stroke();
    if (T[o.id]) { T[o.id].x = o.x2; T[o.id].y = o.y2; T[o.id].c = o.c; }
  } else if (o.t === 'm') {
    if (T[o.id]) { T[o.id].x = o.x; T[o.id].y = o.y; }
  } else if (o.t === 'h') {
    if (T[o.id]) T[o.id].h = o.h;
  } else if (o.t === 'f') {
    c.fillStyle = o.c;
    c.beginPath();
    o.p.forEach(function(p, i) {
      if (i === 0) c.moveTo(_px(p[0]), _py(p[1])); else c.lineTo(_px(p[0]), _py(p[1]));
    });
    c.closePath();
    c.fill();
    if (o.lc) {
      c.strokeStyle = o.lc;
      c.lineWidth = Math.max(1, o.w) * e;
      c.stroke();
    }
  } else if (o.t === 'd') {
    c.fillStyle = o.c;
    c.beginPath();
    c.arc(_px(o.x), _py(o.y), Math.max(0.5, o.r * e), 0, 2 * Math.PI);
    c.fill();
  } else if (o.t === 'w') {
    c.fillStyle = o.c;
    c.font = Math.round(Math.max(6, o.f) * 1.3 * e) + 'px sans-serif';
    c.textAlign = (o.a === 'center' || o.a === 'right') ? o.a : 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(o.txt, _px(o.x), _py(o.y));
  } else if (o.t === 'v') {
    if (T[o.id]) T[o.id].v = o.v;
  } else if (o.t === 'bg') {
    _tv.bg = o.c;
    _setBg(o.c);
  } else if (o.t === 'clear') {
    _clearDrawing();
  }
}

// Les tortugues (fletxes) es dibuixen en una capa a part
function _drawSprites() {
  var c = _ctx('turtle-sprites');
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  var T = _tv.tortugues;
  Object.keys(T).forEach(function(id) {
    var t = T[id];
    if (!t.v) return;
    var mida = 9 * _tv.dpr;
    c.save();
    c.translate(_px(t.x), _py(t.y));
    c.rotate(-t.h * Math.PI / 180);
    c.beginPath();
    c.moveTo(mida, 0);
    c.lineTo(-mida * 0.7, mida * 0.6);
    c.lineTo(-mida * 0.4, 0);
    c.lineTo(-mida * 0.7, -mida * 0.6);
    c.closePath();
    c.fillStyle = '#16a34a';
    c.strokeStyle = '#14532d';
    c.lineWidth = 1 * _tv.dpr;
    c.fill();
    c.stroke();
    c.restore();
  });
}

// ── Desa el dibuix com a imatge PNG ──────────────────────
function _save() {
  var panel = document.getElementById('turtle-panel');
  if (!panel || !_tv) return;
  if (_tv.raf) _finish();
  // Imatge = fons + dibuix
  var dib = panel.querySelector('.turtle-drawing');
  var tmp = document.createElement('canvas');
  tmp.width = dib.width;
  tmp.height = dib.height;
  var c = tmp.getContext('2d');
  c.fillStyle = _tv.bg;
  c.fillRect(0, 0, tmp.width, tmp.height);
  c.drawImage(dib, 0, 0);
  var a = document.createElement('a');
  a.download = 'dibuix-tortuga.png';
  a.href = tmp.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  a.remove();
}


// ── Exporta ──────────────────────────────────────────────
P.turtleShow  = turtleShow;
P.turtleClear = turtleClear;
