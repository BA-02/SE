/* Service Worker — المستودع
   مسؤول عن: (1) استقبال إشعارات Push حتى لو المتصفح مقفول تماماً،
             (2) فتح/تفعيل نافذة الموقع عند الضغط على الإشعار،
             (3) تفعيل تثبيت الموقع كتطبيق (PWA) عبر شرط وجود Service Worker. */

const CACHE_NAME = "warehouse-shell-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// شبكة أولاً مع سقوط احتياطي على الكاش (لا نريد تجميد نسخة قديمة من التطبيق)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// -------- Push --------
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "المستودع", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "المستودع";
  const options = {
    body: payload.body || "",
    tag: payload.tag || "warehouse-notif",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { url: payload.url || "/" },
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// -------- الضغط على الإشعار --------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
