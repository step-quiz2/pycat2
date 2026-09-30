// ════════════════════════════════════════════════════════
// state.js — Estat centralitzat de PyCat
//
// Substitueix les globals disperses per un únic objecte.
// Patró idèntic a KarelCat (K.state → P.state).
// ════════════════════════════════════════════════════════

P.state = {
  // Estat de la UI
  currentState: 'idle',   // idle | loading | running | done | error

  // Pyodide
  pyodideReady: false,
  worker:       null,

  // Execució
  running:      false,
  startTime:    null,

  // Exercici (quan s'usa dins d'un iframe del curs)
  // ── Format normalitzat per a la validació ──
  //   goalId:    identificador del repte
  //   testCases: array de {stdin, expected}  — null si no hi ha validació
  //   testCode:  codi Python que s'appendeja al codi de l'alumne abans d'executar
  //   freeStdin: stdin d'un simulador no validat (p.ex. exemples amb input())
  goalId:       '',
  testCases:    null,
  testCode:     '',
  freeStdin:    null,

  // Input interactiu (simulador lliure)
  interactive:    false,   // true si SharedArrayBuffer disponible i mode lliure
  inputCallback:  null,    // callback per resoldre l'input pendent

  // Dual-mode: interactive run + batch validation
  wantsInteractive: false, // true si el simulador té data-interactive="true"
  ranInteractive:   false, // true després d'una execució interactiva (pendent de validació)
};
