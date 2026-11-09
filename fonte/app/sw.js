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

/* Avisos no celular (Web Push; ver supabase/LEIA-ME-push.md). O servidor manda {title, body, tag, url, badge, at}.
   A mesma etiqueta (tag) substitui o aviso anterior da mesma conversa/post em vez de empilhar.
   Tocar no aviso: se o app já está aberto, ele vem para a frente e abre a tela certa; senão abre em ./?nt=<ação>. */
function avisoDe(dados) {
  let d = {};
  try { d = dados ? dados.json() : {} } catch (e) { try { d = { body: dados.text() } } catch (e2) { d = {} } }
  if (!d || typeof d !== "object") d = {};
  const url = typeof d.url === "string" && /^(\?nt=[\w:.\-]{1,120}|\.\/)$/.test(d.url) ? d.url : "./";
  const op = { body: Array.from(String(d.body || "")).slice(0, 300).join(""), icon: "icon-192.png", data: { url }, timestamp: +d.at || Date.now() };
  if (d.tag) { op.tag = String(d.tag).slice(0, 64); op.renotify = true }
  return { titulo: Array.from(String(d.title || "Prumo News")).slice(0, 100).join(""), op, badge: typeof d.badge === "number" ? d.badge : null, tipo: typeof d.tipo === "string" ? d.tipo : "" };
}
/* número no ícone que chega com o aviso: o app guarda em "./__nt-badge" o que ele mostra (e se o número no ícone está ligado
   e quais tipos estão desligados "No app"); com o app fechado, cada aviso soma 1. Sem isso (app antigo), vale o número do servidor. */
async function numeroIcone(a) {
  let c = null, cfg = null;
  try { c = await caches.open(CACHE); const r = await c.match("./__nt-badge"); if (r) cfg = await r.json() } catch (e) { cfg = null }
  if (!cfg || typeof cfg !== "object") return a.badge;
  if (cfg.on === false) return null;
  const off = Array.isArray(cfg.off) ? cfg.off : [];
  if (a.tipo && off.includes(a.tipo)) return null;
  let n = Math.min(99, Math.max(0, +cfg.n || 0) + 1);
  if (a.tipo === "mensagens" && typeof a.badge === "number" && !off.includes("mensagens")) n = Math.min(99, Math.max(n, a.badge));
  try { await c.put("./__nt-badge", new Response(JSON.stringify({ ...cfg, n, t: Date.now() }), { headers: { "Content-Type": "application/json" } })) } catch (e) { }
  return n;
}
self.addEventListener("push", e => {
  const a = avisoDe(e.data);
  const tarefas = [self.registration.showNotification(a.titulo, a.op)];
  if (self.navigator && typeof self.navigator.setAppBadge === "function")
    tarefas.push(numeroIcone(a).catch(() => a.badge).then(n => { if (n === null || n === undefined) return; return n ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge() }).catch(() => { }));
  // app aberto: ele refaz o número com o que sabe (o certo)
  try { tarefas.push(self.clients.matchAll({ type: "window" }).then(cs => cs.forEach(cl => { try { cl.postMessage({ prumo: "nt-push", tipo: a.tipo }) } catch (err) { } })).catch(() => { })) } catch (e) { }
  e.waitUntil(Promise.all(tarefas));
});
/* a janela do app (a página principal, não as páginas de notícia em m/…), de preferência a que está na frente */
function janelaDoApp(abertas) {
  const base = self.registration.scope, raiz = new URL(base).pathname;
  const doApp = (abertas || []).filter(c => { try { const u = new URL(c.url); return u.href.indexOf(base) === 0 && /^(index\.html)?$/.test(u.pathname.slice(raiz.length)) } catch (e) { return false } });
  const peso = c => (c.focused ? 2 : 0) + (c.visibilityState === "visible" ? 1 : 0);
  return doApp.sort((x, y) => peso(y) - peso(x))[0] || null;
}
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const rel = (e.notification.data && e.notification.data.url) || "./";
  const url = new URL(rel, self.registration.scope).href;
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const app = janelaDoApp(abertas);
    if (app) { app.postMessage({ prumo: "nt-abrir", url }); try { return await app.focus() } catch (err) { return } }
    return self.clients.openWindow(url);
  })());
});
/* 142: erro do próprio service worker vai para o app, que registra no registro anônimo de erros (se ligado e com a v15) */
function tl142Avisa(m, l) {
  try { self.clients.matchAll({ type: "window" }).then(cs => cs.forEach(c => { try { c.postMessage({ prumo: "tl142-erro", m: String(m || "erro").slice(0, 300), l: String(l || "sw.js").slice(0, 60) }) } catch (e) { } })).catch(() => { }) } catch (e) { }
}
self.addEventListener("error", e => tl142Avisa(e && e.message, "sw.js:" + ((e && e.lineno) || 0)));
self.addEventListener("unhandledrejection", e => { const r = e && e.reason; tl142Avisa(r && (r.message || String(r)), "sw.js") });
