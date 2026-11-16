
const CACHE_NAME = "hifdhi-app-v1";

const APP_FILES = [
  "/",
  "/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("hifdhi-app-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ملفات التطبيق المحلية: استعمل النسخة المخزنة أولًا.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;

        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }

          return response;
        } catch {
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }

          throw new Error("Resource unavailable offline");
        }
      })
    );

    return;
  }

  // بيانات القرآن من الخادم: الشبكة أولًا، ثم النسخة المخزنة.
  if (url.hostname === "ummahapi.com") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open("hifdhi-quran-data-v1");
            cache.put(request, response.clone());
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          return new Response(
            JSON.stringify({
              success: false,
              message: "هذه البيانات غير متاحة دون اتصال. حمّلي السورة مسبقًا.",
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        })
    );
  }
});
