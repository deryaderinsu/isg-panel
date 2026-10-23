/* Uygulama kabuğunu önbelleğe alır, çevrimdışı açılmasını sağlar.
   Dosyaları değiştirince V sürüm numarasını artırın (isg-v2 gibi). */
const V = "isg-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const own = u.origin === location.origin;
  const font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  /* Sunucu/API istekleri (başka adresler) önbelleğe alınmaz, canlı veri hep ağdan gelir */
  if (!own && !font) return;
  e.respondWith(
    caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const cp = res.clone();
          caches.open(V).then(c => c.put(r, cp));
        }
        return res;
      }).catch(() => hit || (r.mode === "navigate" ? caches.match("index.html") : undefined));
      return hit || net;
    })
  );
});
