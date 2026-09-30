// ════════════════════════════════════════════════════════
// sw.js — KILL SWITCH (auto-destrucció)
//
// Els navegadors que ja tenien registrat el nostre Service
// Worker anterior tornen a aquí automàticament per buscar
// actualitzacions. Aquest SW s'auto-desregistra i esborra
// totes les caches immediatament.
//
// No intercepta cap petició: les deixa passar TOTES a la
// xarxa sense modificar-les. Un cop desregistrat, el
// navegador torna a comportar-se com si mai hagués tingut
// un SW.
// ════════════════════════════════════════════════════════

self.addEventListener('install', function(event) {
  // Activa immediatament sense esperar tancar pestanyes
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil((async function() {
    // Esborra totes les caches
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k) { return caches.delete(k); }));
    } catch(_) {}

    // Pren control de les pestanyes
    try { await self.clients.claim(); } catch(_) {}

    // Desregistra aquest SW
    try { await self.registration.unregister(); } catch(_) {}

    // Recarrega els clients perquè obtinguin els fitxers frescos sense SW
    try {
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function(client) {
        try { client.navigate(client.url); } catch(_) {}
      });
    } catch(_) {}
  })());
});

// No interceptem cap fetch: el navegador anirà directament a la xarxa
