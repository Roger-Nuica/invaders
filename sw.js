// Hand-written service worker: the game is a static folder, so precaching the
// list below makes it play offline once it has loaded once. Pages and scripts
// are fetched fresh when there is a network (a new deploy shows up on the next
// visit); the cache is the fallback offline. Bump CACHE when the file list changes.
const CACHE = 'porcii-cosmici-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-32.png',
  './icons/icon-64.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './src/main.js',
  './src/game.js',
  './src/math.js',
  './src/weapons.js',
  './src/waves.js',
  './src/boss.js',
  './src/drops.js',
  './src/input.js',
  './src/audio.js',
  './src/render/renderer.js',
  './src/render/sprites.js',
  './src/render/pig.js',
  './src/render/background.js',
  './src/render/fx.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
