/* Prumo News — service worker: abre o app sem internet (com a última edição guardada no aparelho).
   Com internet, a página vem sempre da rede (a versão mais nova do app já na primeira abertura) e a cópia guardada é renovada;
   se a rede não responder em 4 segundos, ou sem internet, abre a cópia guardada.
   As notícias (feed.json) vêm sempre da rede, pelo próprio app. Feed, banco e fontes não passam por aqui. */
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
  // a página (só a raiz do app): rede primeiro (versão mais nova); cópia guardada só se a rede falhar ou demorar
  if (r.mode === "navigate" && u.origin === location.origin && /^\/(index\.html)?$/.test(u.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const rede = fetch(r.url, { cache: "no-cache", credentials: "same-origin" }).then(async resp => {
        if (resp && resp.ok && resp.type === "basic" && !resp.redirected) await c.put("./", resp.clone());
        return resp;
      });
      try {
        const resp = await comPrazo(rede, (await c.match("./")) ? 4000 : 12000);
        if (resp && resp.ok) return resp;
        return (await c.match("./")) || resp;
      } catch (err) {
        e.waitUntil(rede.catch(() => { }));
        return (await c.match("./")) || Response.error();
      }
    })());
    return;
  }
  // biblioteca do Supabase (endereço com versão fixa) e ícones: cópia primeiro
  const fixo = r.url.startsWith(SBJS) || (u.origin === location.origin && /\/(manifest\.json|icon-[\w-]+\.png|fontes\/[\w-]+\.woff2)$/.test(u.pathname));
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
