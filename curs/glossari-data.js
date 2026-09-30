// ════════════════════════════════════════════════════════
// glossari-data.js — Contingut HTML del glossari (separat
// de capitols.js per mantenibilitat).
//
// ESCALAR: afegeix seccions aquí quan es cobreixin nous
// conceptes als capítols.
// ════════════════════════════════════════════════════════

var GLOSSARI_HTML = `
    <div class="glossari-modal" id="glossari-modal">
      <div class="glossari-header">
        <span class="glossari-title">📖 Glossari</span>
        <button class="glossari-close" id="glossari-close" aria-label="Tanca" type="button">✕</button>
      </div>
      <div class="glossari-body">

        <div class="glossari-section">
          <h3>Funcions bàsiques</h3>
          <p class="glossari-hint">Sempre amb parèntesis <code>()</code></p>
          <div class="glossari-grid">
            <code>print(x)</code><span>Mostra <code>x</code> a la consola</span>
            <code>input()</code><span>Llegeix una línia de l'usuari (retorna <code>str</code>)</span>
            <code>input("?")</code><span>Mostra un missatge i llegeix la resposta</span>
            <code>int(x)</code><span>Converteix <code>x</code> a nombre enter</span>
            <code>float(x)</code><span>Converteix <code>x</code> a nombre amb decimals</span>
            <code>str(x)</code><span>Converteix <code>x</code> a text</span>
            <code>len(x)</code><span>Longitud d'un text o llista</span>
            <code>range(n)</code><span>Seqüència de nombres enters de <code>0</code> a <code>n-1</code></span>
            <code>range(i,f)</code><span>Seqüència de <code>i</code> fins a <code>f-1</code> (la fi no s'inclou)</span>
            <code>range(i,f,p)</code><span>Seqüència amb pas <code>p</code>; pot ser negatiu per comptar enrere</span>
            <code>random.shuffle(l)</code><span>Barreja la llista <code>l</code> al seu lloc (cal <code>import random</code> primer)</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Mètodes de text (<code>str</code>)</h3>
          <p class="glossari-hint">Es criden amb un punt: <code>text.metode()</code>. Cap modifica el text original; tots retornen un text nou.</p>
          <div class="glossari-grid">
            <code>text[i]</code><span>Caràcter a la posició <code>i</code> (0 = primer, -1 = últim)</span>
            <code>text[i:f]</code><span>Fragment des de <code>i</code> fins a <code>f-1</code> (la fi no s'inclou)</span>
            <code>text[::-1]</code><span>Text al revés</span>
            <code>.upper()</code><span>Converteix a majúscules</span>
            <code>.lower()</code><span>Converteix a minúscules</span>
            <code>.strip()</code><span>Elimina espais en blanc dels dos extrems</span>
            <code>.replace(v,n)</code><span>Substitueix totes les aparicions de <code>v</code> per <code>n</code></span>
            <code>.split()</code><span>Divideix per espais i retorna una llista de paraules</span>
            <code>.startswith(s)</code><span>Retorna <code>True</code> si el text comença amb <code>s</code></span>
            <code>.endswith(s)</code><span>Retorna <code>True</code> si el text acaba amb <code>s</code></span>
            <code>x in text</code><span>Retorna <code>True</code> si la subcadena <code>x</code> és dins del text</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Llistes (<code>list</code>)</h3>
          <p class="glossari-hint">Es creen amb claudàtors <code>[ ]</code>. Els elements s'indexen igual que els caràcters dels textos.</p>
          <div class="glossari-grid">
            <code>[1, 2, 3]</code><span>Crea una llista amb tres elements</span>
            <code>[]</code><span>Llista buida</span>
            <code>llista[i]</code><span>Element a la posició <code>i</code> (0 = primer, -1 = últim)</span>
            <code>len(llista)</code><span>Nombre d'elements de la llista</span>
            <code>.append(x)</code><span>Afegeix <code>x</code> al final de la llista</span>
            <code>.pop()</code><span>Treu i retorna l'últim element (o el de la posició indicada)</span>
            <code>del llista[i]</code><span>Esborra l'element de la posició <code>i</code></span>
            <code>sum(llista)</code><span>Suma de tots els elements (numèrics)</span>
            <code>min(llista)</code><span>Element mínim de la llista</span>
            <code>max(llista)</code><span>Element màxim de la llista</span>
            <code>sorted(llista)</code><span>Retorna una còpia ordenada de la llista (no modifica l'original)</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Funcions pròpies (<code>def</code>)</h3>
          <p class="glossari-hint">Es defineixen amb <code>def</code> i es criden amb els parèntesis <code>()</code>. Sense <code>return</code>, retornen <code>None</code> automàticament.</p>
          <div class="glossari-grid">
            <code>def nom():</code><span>Defineix una funció sense paràmetres</span>
            <code>def nom(p):</code><span>Defineix una funció amb un paràmetre <code>p</code></span>
            <code>def nom(p1, p2):</code><span>Defineix una funció amb dos paràmetres</span>
            <code>return valor</code><span>Retorna <code>valor</code> i acaba la funció immediatament</span>
            <code>return</code><span>Acaba la funció sense retornar res (retorna <code>None</code>)</span>
            <code>None</code><span>Valor "res": és el que retorna una funció sense <code>return</code></span>
            <code>True</code><span>Valor booleà cert — es pot retornar des d'una funció</span>
            <code>False</code><span>Valor booleà fals — es pot retornar des d'una funció</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Tipus de dades</h3>
          <div class="glossari-grid">
            <code>int</code><span>Nombre enter: <code>3</code>, <code>-7</code>, <code>0</code></span>
            <code>float</code><span>Nombre amb decimals: <code>3.14</code>, <code>-0.5</code></span>
            <code>str</code><span>Text entre cometes: <code>"hola"</code>, <code>'món'</code></span>
            <code>bool</code><span>Cert o fals: <code>True</code>, <code>False</code></span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Operadors aritmètics</h3>
          <div class="glossari-grid">
            <code>+</code><span>Suma (o concatena textos)</span>
            <code>-</code><span>Resta</span>
            <code>*</code><span>Multiplicació</span>
            <code>/</code><span>Divisió (sempre retorna <code>float</code>)</span>
            <code>//</code><span>Divisió entera (descarta els decimals)</span>
            <code>%</code><span>Mòdul (residu de la divisió)</span>
            <code>**</code><span>Potència (<code>2**3</code> = 8)</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Comparacions</h3>
          <p class="glossari-hint">S'usen dins de <code>if</code> i <code>while</code> — retornen <code>True</code> o <code>False</code></p>
          <div class="glossari-grid">
            <code>==</code><span>Igual a</span>
            <code>!=</code><span>Diferent de</span>
            <code>&lt;</code><span>Menor que</span>
            <code>&gt;</code><span>Major que</span>
            <code>&lt;=</code><span>Menor o igual</span>
            <code>&gt;=</code><span>Major o igual</span>
            <code>and</code><span>I (les dues han de ser certes)</span>
            <code>or</code><span>O (almenys una ha de ser certa)</span>
            <code>not</code><span>Negació</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Control de bucles</h3>
          <p class="glossari-hint">S'usen dins de <code>while</code> i <code>for</code></p>
          <div class="glossari-grid">
            <code>break</code><span>Surt del bucle immediatament</span>
            <code>continue</code><span>Salta la resta de la iteració i torna al principi del bucle</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Estructures</h3>
          <p class="glossari-hint">Acaben amb dos punts <code>:</code> i el bloc interior va <strong>indentat</strong> (4 espais)</p>
          <pre class="glossari-example">edat = int(input("Edat: "))
if edat &gt;= 18:
    print("Adult")
elif edat &gt;= 13:
    print("Adolescent")
else:
    print("Infant")</pre>
          <pre class="glossari-example">while resposta != "sí":
    resposta = input("Continuem? ")</pre>
          <pre class="glossari-example">for i in range(5):
    print(i)</pre>
          <pre class="glossari-example">def saluda(nom):
    print("Hola, " + nom)</pre>
        </div>

        <div class="glossari-section glossari-rules">
          <h3>Recorda</h3>
          <div class="glossari-rule">① Les funcions sempre porten <code>()</code> al final</div>
          <div class="glossari-rule">② Després de <code>if</code>, <code>while</code>, <code>for</code>, <code>def</code> cal posar <code>:</code></div>
          <div class="glossari-rule">③ El codi dins d'un bloc s'ha d'indentar (4 espais)</div>
          <div class="glossari-rule">④ <code>input()</code> sempre retorna <code>str</code> — usa <code>int()</code> o <code>float()</code> per convertir</div>
          <div class="glossari-rule">⑤ Els textos van entre cometes: <code>"hola"</code> o <code>'hola'</code></div>
        </div>

      </div>
    </div>`;
