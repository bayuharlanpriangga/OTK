// ── OTK Service Worker ──
// Strategi: NETWORK-FIRST. Tidak ada versioning manual (v1/v2/...) yang
// harus dinaikkan tiap deploy — cache cuma fallback offline dan otomatis
// diperbarui setiap kali fetch ke network berhasil. Jadi setiap kali user
// online, mereka selalu dapat versi terbaru dari server, bukan versi lama
// dari cache.

const CACHE_NAME = 'otk-cache';

const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  // langsung aktif tanpa menunggu tab lama ditutup
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // abaikan kalau ada aset yang gagal di-precache (mis. offline saat install)
      })
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // network sukses -> selalu pakai ini, dan timpa cache dengan versi terbaru
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        // network gagal (offline) -> fallback ke cache terakhir yang tersimpan
        caches.match(event.request)
      )
  );
});
