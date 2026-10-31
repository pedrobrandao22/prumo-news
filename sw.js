/* Prumo News — service worker: abre o app sem internet (com a última edição guardada no aparelho).
   A página abre com a cópia guardada (na hora) e a cópia é atualizada por trás: a versão nova do app vale
   a partir da abertura seguinte. As notícias (feed.json) vêm sempre da rede, pelo próprio app.
   Feed, banco e fontes não passam por aqui. */
const CACHE = "prumo-v1";
const BASE = ["./", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const SBJS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => { }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function comPrazo(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("prazo")), ms))]) }

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // a página (só a raiz do app): abre na hora com a cópia guardada e atualiza a cópia por trás;
  // a versão nova do app vale a partir da próxima abertura. Sem cópia, vem da rede.
  if (r.mode === "navigate" && u.origin === location.origin && /^\/(index\.html)?$/.test(u.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match("./");
      const rede = fetch(r).then(async resp => {
        if (resp && resp.ok && resp.type === "basic" && !resp.redirected) await c.put("./", resp.clone());
        return resp;
      });
      if (hit) { e.waitUntil(rede.catch(() => { })); return hit; }
      try { return await comPrazo(rede, 8000); }
      catch (err) { return (await c.match("./")) || Response.error(); }
    })());
    return;
  }
  // biblioteca do Supabase (endereço com versão fixa) e ícones: cópia primeiro
  const fixo = r.url.startsWith(SBJS) || (u.origin === location.origin && /\/(manifest\.json|icon-[\w-]+\.png)$/.test(u.pathname));
  if (fixo) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(r);
      if (hit) return hit;
      const resp = await fetch(r);
      if (resp && (resp.ok || resp.type === "opaque")) c.put(r, resp.clone());
      return resp;
    })());
  }
});
