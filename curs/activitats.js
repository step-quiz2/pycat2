// ════════════════════════════════════════════════════════
// curs/activitats.js — Activitats sense simulador
//
// El carrega initCursPage() (capitols.js) només a les pàgines que en
// tenen. Dos tipus:
//
// 1) PROBLEMA DE PARSONS — ordenar i indentar línies de codi
//
//    <div class="parsons" data-goal-id="cap-6-parsons">
//      <p class="parsons-enunciat">Què ha de fer el programa…</p>
//      <pre class="parsons-codi">for i in range(3):
//          print(i)</pre>
//    </div>
//
//    El <pre> conté la solució (ordre i indentació correctes, 4 espais
//    per nivell). Les línies es mostren barrejades i sense indentar;
//    l'alumne les mou (arrossegant o amb ↑ ↓) i les indenta (⇤ ⇥).
//    Opcional: data-expected / data-stdin (el test executa la solució).
//
// 2) QÜESTIONARI — preguntes d'opció múltiple
//
//    <div class="quiz" data-goal-id="cap-1-quiz">
//      <div class="quiz-q" data-correcta="2" data-comprova>
//        <p>Què imprimeix aquest programa?</p>
//        <pre class="code-example">print("2" + "3")</pre>
//        <ol class="quiz-opcions"><li>5</li><li>23</li><li>Error</li></ol>
//        <p class="quiz-explica">Amb textos, + els enganxa.</p>
//      </div>
//    </div>
//
//    data-correcta és la posició (1, 2, …) de la resposta correcta.
//    data-comprova: el test executa el <pre> i comprova que la sortida
//    sigui el text de l'opció correcta.
//
// Quan s'acaba bé una activitat, es desa el progrés (saveGoalCompleted).
// ════════════════════════════════════════════════════════

(function() {

  // ── Nombres pseudoaleatoris repetibles (la mateixa barreja cada cop) ──
  function _rng(llavor) {
    var h = 2166136261;
    for (var i = 0; i < llavor.length; i++) { h ^= llavor.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function() {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 100000) / 100000;
    };
  }

  function _feedback(div, goalId) {
    var fb = document.createElement('div');
    fb.className = 'simulador-feedback';
    if (goalId && typeof isGoalCompleted === 'function' && isGoalCompleted(goalId)) {
      fb.className = 'simulador-feedback fb-ok';
      fb.textContent = '✓ Completat anteriorment.';
    }
    div.appendChild(fb);
    return fb;
  }

  function _completat(goalId) {
    if (!goalId || typeof saveGoalCompleted !== 'function') return;
    saveGoalCompleted(goalId);
    if (typeof _refreshSidebar === 'function') _refreshSidebar();
  }


  // ════════════════════════════════════════════════════════
  // PARSONS
  // ════════════════════════════════════════════════════════

  function initParsons(div) {
    var pre = div.querySelector('.parsons-codi');
    if (!pre) return;
    var goalId = div.getAttribute('data-goal-id') || '';
    var solucio = pre.textContent.replace(/\s+$/, '').split('\n')
      .filter(function(l) { return l.trim(); })
      .map(function(l) {
        var espais = l.match(/^ */)[0].length;
        return { text: l.trim(), nivell: Math.floor(espais / 4) };
      });
    pre.remove();
    var maxNivell = Math.max.apply(null, solucio.map(function(l) { return l.nivell; })) + 1;

    // Barreja (repetible) i assegura que no surti ja ordenat
    var rnd = _rng(goalId || 'parsons');
    var inicial = solucio.map(function(l, i) { return i; });
    for (var intent = 0; intent < 10; intent++) {
      for (var i = inicial.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = inicial[i]; inicial[i] = inicial[j]; inicial[j] = t;
      }
      if (inicial.some(function(v, k) { return solucio[v].text !== solucio[k].text; })) break;
    }

    var estat;   // [{ text, nivell }] en l'ordre que veu l'alumne
    function reinicia() {
      estat = inicial.map(function(k) { return { text: solucio[k].text, nivell: 0 }; });
      pinta();
    }

    var llista = document.createElement('ol');
    llista.className = 'parsons-llista';
    llista.setAttribute('aria-label', 'Línies del programa (ordena-les i indenta-les)');
    div.appendChild(llista);

    var accions = document.createElement('div');
    accions.className = 'parsons-accions';
    accions.innerHTML =
      '<button type="button" class="btn-activitat btn-activitat--p" data-a="comprova">✓ Comprova</button>' +
      '<button type="button" class="btn-activitat" data-a="reinicia">⟲ Torna a començar</button>';
    div.appendChild(accions);
    var fb = _feedback(div, goalId);

    var arrossegat = null;

    function pinta(errades) {
      llista.textContent = '';
      estat.forEach(function(l, i) {
        var li = document.createElement('li');
        li.className = 'parsons-linia' + (errades && errades[i] ? ' malament' : '');
        li.draggable = true;
        li.style.marginLeft = (l.nivell * 2) + 'em';

        var codi = document.createElement('code');
        codi.textContent = l.text;
        li.appendChild(codi);

        var botons = document.createElement('span');
        botons.className = 'parsons-botons';
        [['⇤', 'Menys indentació', function() { l.nivell = Math.max(0, l.nivell - 1); }],
         ['⇥', 'Més indentació',   function() { l.nivell = Math.min(maxNivell, l.nivell + 1); }],
         ['↑', 'Puja',             function() { mou(i, i - 1); }],
         ['↓', 'Baixa',            function() { mou(i, i + 1); }]].forEach(function(b) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = b[0];
          btn.title = b[1];
          btn.setAttribute('aria-label', b[1] + ': ' + l.text);
          btn.addEventListener('click', function() { b[2](); netejaFeedback(); pinta(); });
          botons.appendChild(btn);
        });
        li.appendChild(botons);

        // Arrossegar (ratolí)
        li.addEventListener('dragstart', function(e) {
          arrossegat = i;
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) {}
        });
        li.addEventListener('dragover', function(e) { e.preventDefault(); li.classList.add('sobre'); });
        li.addEventListener('dragleave', function() { li.classList.remove('sobre'); });
        li.addEventListener('drop', function(e) {
          e.preventDefault();
          if (arrossegat !== null && arrossegat !== i) { mou(arrossegat, i); netejaFeedback(); pinta(); }
          arrossegat = null;
        });
        li.addEventListener('dragend', function() { arrossegat = null; });

        llista.appendChild(li);
      });
    }

    function mou(de, a) {
      if (a < 0 || a >= estat.length) return;
      var l = estat.splice(de, 1)[0];
      estat.splice(a, 0, l);
    }

    function netejaFeedback() {
      if (fb.classList.contains('fb-ko')) { fb.className = 'simulador-feedback'; fb.textContent = ''; }
    }

    accions.addEventListener('click', function(e) {
      var a = e.target.getAttribute('data-a');
      if (a === 'reinicia') { netejaFeedback(); reinicia(); return; }
      if (a !== 'comprova') return;
      var errades = estat.map(function(l, k) {
        return l.text !== solucio[k].text || l.nivell !== solucio[k].nivell;
      });
      var n = errades.filter(Boolean).length;
      pinta(errades);
      if (n === 0) {
        fb.className = 'simulador-feedback fb-ok';
        fb.textContent = '✓ Correcte! El programa està ben ordenat i ben indentat.';
        _completat(goalId);
      } else {
        var ordreOk = estat.every(function(l, k) { return l.text === solucio[k].text; });
        fb.className = 'simulador-feedback fb-ko';
        fb.textContent = '✗ Hi ha ' + n + (n === 1 ? ' línia' : ' línies') + ' marcades en vermell. ' +
          (ordreOk ? 'L\'ordre és bo: revisa la indentació (⇤ ⇥).'
                   : 'Revisa l\'ordre (i després la indentació).');
      }
    });

    reinicia();
  }


  // ════════════════════════════════════════════════════════
  // QÜESTIONARI
  // ════════════════════════════════════════════════════════

  function initQuiz(div) {
    var goalId = div.getAttribute('data-goal-id') || '';
    var preguntes = div.querySelectorAll('.quiz-q');
    var fb = _feedback(div, goalId);
    var resultat = [];   // per pregunta: null (sense respondre), true (bé a la primera), false (bé després d'errar)

    preguntes.forEach(function(q, qi) {
      resultat.push(null);
      var correcta = parseInt(q.getAttribute('data-correcta'), 10) - 1;
      var explica = q.querySelector('.quiz-explica');
      if (explica) explica.hidden = true;
      var errada = false;

      var num = document.createElement('span');
      num.className = 'quiz-num';
      num.textContent = (qi + 1) + '/' + preguntes.length;
      q.insertBefore(num, q.firstChild);

      var opcions = q.querySelectorAll('.quiz-opcions li');
      opcions.forEach(function(li, oi) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-opcio';
        while (li.firstChild) btn.appendChild(li.firstChild);
        li.appendChild(btn);
        btn.addEventListener('click', function() {
          if (resultat[qi] !== null) return;          // ja resolta
          if (oi === correcta) {
            btn.classList.add('bona');
            resultat[qi] = !errada;
            opcions.forEach(function(l) { l.querySelector('button').disabled = true; });
            if (explica) explica.hidden = false;
            comprovaFinal();
          } else {
            errada = true;
            btn.classList.add('dolenta');
            btn.disabled = true;
          }
        });
      });
    });

    function comprovaFinal() {
      if (resultat.some(function(r) { return r === null; })) return;
      var bePrimera = resultat.filter(Boolean).length;
      fb.className = 'simulador-feedback fb-ok';
      fb.textContent = '✓ Qüestionari acabat! Has encertat ' + bePrimera + ' de ' + resultat.length +
        ' preguntes a la primera.';
      _completat(goalId);
    }
  }


  document.querySelectorAll('.parsons').forEach(initParsons);
  document.querySelectorAll('.quiz').forEach(initQuiz);

})();
