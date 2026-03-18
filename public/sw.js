self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal fetch listener to satisfy PWA installability checks in Chromium.
self.addEventListener("fetch", () => {});
