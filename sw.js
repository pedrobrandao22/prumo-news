/* Prumo News — service worker: abre o app na hora (com a última cópia guardada no aparelho) e funciona sem internet.
   A página: se já há cópia guardada, ela abre logo (sem esperar a rede); ao mesmo tempo o service worker confere na rede
   se saiu versão nova. Se a rede responder bem rápido (wi-fi), já abre a nova; senão guarda a nova e avisa o app,
   que recarrega sozinho se a pessoa ainda não mexeu (ou na volta ao app). Sem cópia guardada: rede (até 12 s).
   As notícias (feed.json) vêm sempre da rede, pelo próprio app. Feed, banco e fontes não passam por aqui.
   Fotos do acervo (acervo/…, nome de arquivo nunca muda de conteúdo): cópia primeiro, num cache à parte de até 200 fotos. */
const CACHE = "prumo-v1";
const BASE = ["./", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const SBJS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@";
const ACERVO = "prumo-acervo", ACERVO_MAX = 200;
const FOLGA = 100;  // ms que a abertura espera pela rede antes de abrir a cópia guardada

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => { }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== ACERVO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function comPrazo(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("prazo")), ms))]) }
const espera = ms => new Promise(r => setTimeout(r, ms));
async function resumo(txt) { try { const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(txt)); return [...new Uint8Array(h)].slice(0, 6).map(b => b.toString(16).padStart(2, "0")).join("") } catch (e) { return String(txt.length) } }
// avisa a aba que acabou de abrir (ela pode ainda estar nascendo: tenta por alguns segundos)
async function avisar(id, v) {
  for (let i = 0; i < 40; i++) { const cl = id ? await self.clients.get(id) : null; if (cl) { cl.postMessage({ prumo: "pagina-nova", v }); return } if (!id) break; await espera(250) }
  (await self.clients.matchAll({ type: "window" })).forEach(cl => cl.postMessage({ prumo: "pagina-nova", v }));
}
// confere na rede; se a página mudou, guarda a nova. Devolve {resp, nova}
async function conferir(c, url, guardada) {
  const resp = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
  if (!(resp && resp.ok && resp.type === "basic" && !resp.redirected)) return { resp, nova: false };
  if (!guardada) { await c.put("./", resp.clone()); return { resp, nova: true } }
  const e1 = guardada.headers.get("etag"), e2 = resp.headers.get("etag");
  if (e1 && e2 && e1 === e2) return { resp, nova: false };
  const [t1, t2] = await Promise.all([guardada.text(), resp.clone().text()]);
  if (t1 === t2) return { resp, nova: false };
  await c.put("./", resp.clone());
  return { resp, nova: true, v: await resumo(t2) };
}

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  // a página (só a raiz do app)
  if (r.mode === "navigate" && u.origin === location.origin && /^\/(index\.html)?$/.test(u.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const guardada = await c.match("./");
      if (guardada) {
        const conf = conferir(c, r.url, guardada.clone());  // cópia: a original vai para a página
        let decide; const serviuGuardada = new Promise(ok => decide = ok);
        e.waitUntil(conf.then(async x => { if (x.nova && await serviuGuardada) return avisar(e.resultingClientId || e.clientId, x.v) }).catch(() => { }));
        try {  // rede bem rápida: já abre a versão da rede (a nova, se saiu)
          const x = await comPrazo(conf, FOLGA);
          if (x.resp && x.resp.ok && x.resp.type === "basic" && !x.resp.redirected) { decide(false); return x.resp }
        } catch (err) { }
        decide(true);
        return guardada;
      }
      // primeira vez: rede (até 12 s); sem rede, erro
      const rede = fetch(r.url, { cache: "no-cache", credentials: "same-origin" }).then(async resp => {
        if (resp && resp.ok && resp.type === "basic" && !resp.redirected) await c.put("./", resp.clone());
        return resp;
      });
      try {
        const resp = await comPrazo(rede, 12000);
        if (resp && resp.ok) return resp;
        return (await c.match("./")) || resp;
      } catch (err) {
        e.waitUntil(rede.catch(() => { }));
        return (await c.match("./")) || Response.error();
      }
    })());
    return;
  }
  // fotos do acervo: cópia primeiro (o nome do arquivo muda quando a foto muda)
  if (u.origin === location.origin && /\/acervo\/[\w\/.-]+\.(?:webp|jpe?g)$/i.test(u.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(ACERVO);
      const hit = await c.match(r);
      if (hit) return hit;
      const resp = await fetch(r);
      if (resp && resp.ok && resp.type === "basic") {
        await c.put(r, resp.clone());
        await c.keys().then(ks => Promise.all(ks.slice(0, Math.max(0, ks.length - ACERVO_MAX)).map(k => c.delete(k)))).catch(() => { });
      }
      return resp;
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
