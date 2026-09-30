// ════════════════════════════════════════════════════════
// sw-register.js — DESACTIVAT
//
// Aquest script ja NO registra cap Service Worker. El seu
// únic propòsit és desregistrar qualsevol SW que l'usuari
// tingui instal·lat d'una versió anterior i esborrar-ne
// el cache, perquè el lloc torni a funcionar amb normalitat.
//
// Es pot deixar carregat indefinidament sense cap efecte
// secundari per als usuaris que no hagin instal·lat mai el SW.
// ════════════════════════════════════════════════════════

(function() {
  if (!('serviceWorker' in navigator)) return;

  // Desregistra qualsevol SW actiu
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(reg) {
      reg.unregister().catch(function() {});
    });
  }).catch(function() {});

  // Esborra totes les caches que haguem creat en versions anteriors
  if (typeof caches !== 'undefined' && caches.keys) {
    caches.keys().then(function(keys) {
      keys.forEach(function(key) {
        if (key.indexOf('pycat-') === 0) {
          caches.delete(key).catch(function() {});
        }
      });
    }).catch(function() {});
  }
})();
