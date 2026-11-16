// 부스페이 서비스 워커
// - 화면 파일(같은 주소의 html, 아이콘 등)만 다룸
// - 잔액·결제 데이터(Firebase)는 절대 저장하지 않음 → 항상 최신
// - 화면 파일은 "인터넷 먼저": 새 버전을 올리면 다음에 열 때 바로 적용
const CACHE = "boothpay-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return; // Firebase·외부 요청은 건드리지 않음
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: "no-store" });
      if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch {
      const hit = await caches.match(req) || (req.mode === "navigate" ? await caches.match("./index.html") : null);
      return hit || new Response("인터넷 연결이 필요해요", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
