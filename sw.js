// Órbita Júpiter · service worker (juego sin internet) · @cybercadtm
// Cambia VERSION cada vez que subas una versión nueva del juego.
const VERSION = 'orbita-v96';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Las imágenes del juego tienen nombre único por contenido: se guardan una sola vez y no se borran al actualizar
const IMG_CACHE = 'orbita-img-1';

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Primero intenta la red (para recibir actualizaciones); si no hay internet, usa la copia guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // Firebase (configuración, inicio de sesión y base de datos) siempre va directo a internet
  if (u.pathname.startsWith('/__/') || u.origin !== location.origin) return;
  // Imágenes: primero la copia guardada (no cambian nunca), si no hay, de internet
  if (u.pathname.includes('/img/')) {
    e.respondWith(caches.open(IMG_CACHE).then(c => c.match(e.request).then(m => m || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
