// Service Worker：三上數學 自學冒險
// 自己網站的檔案：先用快取（可離線），同時在背景抓新版，下次打開就是新版。
// Google 字型：第一次連網時存起來，之後離線也能用。
const VERSION = 'math-adventure-v1';
const CORE = [
  './', './index.html', './manifest.json',
  './icon/icon-192x192.png', './icon/icon-512x512.png', './icon/icon-maskable-512x512.png',
  './icon/apple-touch-icon.png', './icon/favicon-32x32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    })
  );
});
