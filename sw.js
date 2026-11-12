/* Lumina Slides — Service worker: funciona sin conexión tras la primera visita */
const VERSION = 'lumina-2026.11.12-6';
const CORE = [
  './', 'index.html',

  'vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js', 'manifest.webmanifest', 'assets/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  const heavy = /\/(fonts|vendor)\//.test(url.pathname);
  if (heavy) {
    // Recursos que no cambian: primero caché
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    })));
  } else {
    // Código de la app: primero red para recibir siempre la última versión
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))));
  }
});
