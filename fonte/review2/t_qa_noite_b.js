// QA noite B (notificações, js/126 + sql v10 §8 + sw.js): um item por novo seguidor, coluna da v9 de quem você segue,
// bloqueio tirando os itens, dois aparelhos da mesma pessoa coerentes (o "visto" e as escolhas chegam sem recarregar e um
// aparelho desatualizado não apaga o que o outro mudou), abrir o destino apaga a bolinha daquele item, item com hora no
// futuro não prende a bolinha, "Desde a sua última visita" depois de dias fora, número no ícone = o que se vê, ligar um tipo
// quando o servidor esqueceu o aparelho, sair da conta tira o aparelho, e o service worker (número no ícone que chega com
// o aviso, janela certa ao tocar).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const PORTA = 8762, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);

/* aparelho simulado (como no t_notificacoes): instalado, Badging API, Notification e PushManager — nada sai do navegador */
const APARELHO = () => {
  window.__nt = { badges: [], perm: 0, subs: [], unsub: 0, shown: [], ativo: null };
  const mm = window.matchMedia.bind(window);
  window.matchMedia = q => /display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } } : mm(q);
  navigator.setAppBadge = n => { window.__nt.badges.push(n); return Promise.resolve() };
  navigator.clearAppBadge = () => { window.__nt.badges.push(0); return Promise.resolve() };
  class N { static async requestPermission() { window.__nt.perm++; N.permission = 'granted'; return 'granted' } }
  N.permission = 'default'; window.Notification = N; window.PushManager = function () { };
  const b64 = n => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const pm = {
    async getSubscription() { return window.__nt.ativo },
    async subscribe(o) { const k = new Uint8Array(o.applicationServerKey); window.__nt.subs.push(k.length);
      const ep = 'https://fcm.googleapis.com/fcm/send/' + b64(12), keys = { p256dh: b64(65), auth: b64(16) };
      const s = { endpoint: ep, options: { applicationServerKey: k.buffer }, toJSON: () => ({ endpoint: ep, expirationTime: null, keys }), async unsubscribe() { window.__nt.unsub++; window.__nt.ativo = null; return true } };
      window.__nt.ativo = s; return s }
  };
  const reg = { pushManager: pm, scope: location.origin + '/', async showNotification(t, o) { window.__nt.shown.push([t, o]) } };
  const sw = new EventTarget(); sw.getRegistration = async () => reg; sw.register = async () => reg; sw.ready = Promise.resolve(reg); sw.controller = null;
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, get: () => sw });
};

(async () => {
  /* ===================== 0. service worker (fora do navegador) ===================== */
  {
    const L = {}, shown = [], badges = [], abertas = [], posts = [], store = new Map();
    let wins = [], focos = [];
    const resp = t => ({ json: async () => JSON.parse(t), text: async () => t });
    const cache = { match: async k => store.has(k) ? resp(store.get(k)) : undefined, put: async (k, r) => { store.set(k, await r.text()) } };
    const self = { addEventListener: (t, f) => { L[t] = f }, skipWaiting() { }, registration: { scope: 'https://prumonews.com.br/', showNotification: async (t, o) => shown.push([t, o]) },
      clients: { matchAll: async () => wins, openWindow: async u => abertas.push(u), claim: async () => { }, get: async () => null }, navigator: { setAppBadge: async n => badges.push(n), clearAppBadge: async () => badges.push(0) } };
    function Response(t) { this._t = String(t); this.text = async () => this._t }
    const ctx = vm.createContext({ self, caches: { open: async () => cache, keys: async () => [], delete: async () => true }, fetch: async () => { }, location: new URL('https://prumonews.com.br/sw.js'), URL, crypto, TextEncoder, setTimeout, console, Promise, Response, Array, JSON, Math });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app', 'sw.js'), 'utf8'), ctx);
    const espera = []; const evPush = d => ({ data: { json: () => d, text: () => JSON.stringify(d) }, waitUntil: p => espera.push(p) });
    const push = async d => { L.push(evPush(d)); await Promise.all(espera.splice(0)) };
    await push({ title: 'Bia', body: 'oi', tag: 'mensagens:conv:B', url: '?nt=conversa:B', badge: 2, tipo: 'mensagens' });
    ok(badges[0] === 2, 'sw: sem o app ter dito nada, o número no ícone é o do servidor', badges);
    store.set('./__nt-badge', JSON.stringify({ on: true, n: 5, off: ['curtidas'] }));
    await push({ title: 'Caio comentou', body: 'x', tag: 'comentarios:cmt:1', url: '?nt=comentarios:1', tipo: 'comentarios' });
    ok(badges[1] === 6 && JSON.parse(store.get('./__nt-badge')).n === 6, 'NB07 sw: com o app fechado, cada aviso soma 1 ao que o app mostrava', [badges, store.get('./__nt-badge')]);
    await push({ title: 'Bia', body: 'oi', tag: 'mensagens:conv:B', url: '?nt=conversa:B', badge: 9, tipo: 'mensagens' });
    ok(badges[2] === 9, 'sw: mensagens não lidas do servidor maiores que a conta: vale o maior', badges);
    await push({ title: 'Dani curtiu', tag: 'curtidas:c', url: '?nt=atividade', tipo: 'curtidas' });
    ok(badges.length === 3, 'NB07 sw: tipo desligado "No app" não mexe no número', badges);
    store.set('./__nt-badge', JSON.stringify({ on: false, n: 0, off: [] }));
    await push({ title: 'X', body: 'y', tipo: 'mencoes', url: '?nt=atividade' });
    ok(badges.length === 3 && shown.length === 5, 'NB07 sw: "Número no ícone" desligado: o aviso aparece, o número não', badges);
    const appAberto = { url: 'https://prumonews.com.br/?x=1', focused: false, visibilityState: 'hidden', postMessage: m => posts.push(['app', m]), focus: async () => focos.push('app') };
    wins = [appAberto];
    await push({ title: 'Z', tipo: 'mensagens', url: '?nt=conversa:B' });
    ok(posts.some(p => p[1].prumo === 'nt-push'), 'sw: com o app aberto, avisa a página (ela refaz o número com o que sabe)', posts);
    posts.length = 0;
    let fechou = 0; const evClk = u => ({ notification: { data: { url: u }, close: () => fechou++ }, waitUntil: p => espera.push(p) });
    wins = [{ url: 'https://prumonews.com.br/m/pec-seguranca.html', focused: true, visibilityState: 'visible', postMessage: m => posts.push(['noticia', m]), focus: async () => focos.push('noticia') }];
    L.notificationclick(evClk('?nt=conversa:B')); await Promise.all(espera.splice(0));
    ok(abertas[0] === 'https://prumonews.com.br/?nt=conversa:B' && !posts.length && !focos.length, 'NB15 sw clique: página de notícia (m/…) aberta não é o app: abre o app na tela certa', [abertas, posts]);
    wins = [{ ...appAberto }, { url: 'https://prumonews.com.br/index.html#feed', focused: true, visibilityState: 'visible', postMessage: m => posts.push(['app2', m]), focus: async () => focos.push('app2') }];
    L.notificationclick(evClk('?nt=atividade')); await Promise.all(espera.splice(0));
    ok(posts.length === 1 && posts[0][0] === 'app2' && posts[0][1].url === 'https://prumonews.com.br/?nt=atividade' && focos.join() === 'app2' && abertas.length === 1, 'sw clique: com duas janelas do app, usa a que está na frente', [posts, focos]);
    L.push({ data: { json: () => ({ title: '😀'.repeat(200), body: '👍🏽'.repeat(400) }), text: () => '' }, waitUntil: p => espera.push(p) }); await Promise.all(espera.splice(0));
    const [tl, ol] = shown[shown.length - 1];
    ok(!/[\ud800-\udbff](?![\udc00-\udfff])/.test(tl + ol.body) && Array.from(tl).length === 100, 'sw: título e texto cortados sem partir emoji');
  }

  /* ===================== banco e pessoas ===================== */
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), c = await H.criarConta('c@x', '123456'), d = await H.criarConta('d@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel,perfil_aberto) values ($1,'Pedro Brandão','admin',true),($2,'Bia Souza','membro',false),($3,'Caio Lima','membro',true),($4,'Dani Reis','membro',false)`, [a, b, c, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys();
  await H.sql(`insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', $1::text))`, [ec.getPublicKey().toString('base64url')]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome, o = {}) => {
    const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } }, ...o }), nome);
    if (o.aparelho) await p.addInitScript(APARELHO);
    await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk && typeof NT124 !== 'undefined' && NT124.v10 !== null && V9.on === true, null, 20000); return p };
  const A1 = await abrir(a, 'a@x', 'A1', { aparelho: true }), A2 = await abrir(a, 'a@x', 'A2', { aparelho: true }), B = await abrir(b, 'b@x', 'B');
  const bia = (fn, arg) => ev(B, fn, arg);
  const prefsBanco = async () => ((await H.sql(`select data from docs where path=$1`, ['data/users/' + a + '/prefs']))[0] || {}).data || {};
  // os dois aparelhos já viram tudo (visita marcada)
  await ev(A1, () => { abrirAtividade() }); await sleep(400); await ev(A1, () => closeLayer()); await sleep(2500);

  /* ---------- novo seguidor: um item só ---------- */
  await H.comoUsuario(d, () => H.db.query(`select public.seguir($1)`, [a]));
  await H.comoUsuario(a, () => H.db.query(`select public.seguir($1)`, [c]));
  const tit = 'O que muda com a nova escala';
  const pc = (await H.comoUsuario(c, () => H.db.query(`insert into publicacoes(autor,tipo,texto,publico,estilo,corpo) values ($1,'post','Uma análise','seguidores',$2::jsonb,'Texto longo da coluna') returning id`, [c, JSON.stringify({ v: 2, coluna: { v: 1, tit, linha: 'Uma análise', min: 3 } })]))).rows[0].id;
  const recarrega = p => ev(p, async () => { await cs123Carregar(); PUB.sig = ''; await pubCarregar(); NT124.segT = 0; await nt124CarregaSeg(); AT.t = 0; await atCarregar() });
  await recarrega(A1); await sleep(600);
  let it = await ev(A1, () => atItens().map(x => ({ k: x.k, c: nt124Cat(x), t: x.txt.replace(/<[^>]+>/g, '') })));
  const seg = it.filter(x => /começou a seguir você/.test(x.t));
  ok(seg.length === 1 && seg[0].c === 'seguidores', 'NB01: novo seguidor aparece uma vez só, como "Novos seguidores"', it);
  let cont = await ev(A1, () => nt124Contagem());
  ok(cont.por.seguidores === 1 && !cont.por.outros, 'NB01: conta 1 seguidor novo (nada em "outros")', cont);
  const col = it.find(x => x.k === 'nt124c:' + pc);
  ok(col && col.c === 'colunas' && col.t.indexOf(`Caio Lima publicou uma coluna: “${tit}”`) === 0, 'NB09: coluna da v9 de quem você segue: "publicou uma coluna" com o título', it);
  await ev(A1, () => nt124PrefMuda(n => { n.app = { ...(n.app || {}), colunas: false } })); await sleep(100);
  ok(await ev(A1, () => !nt124Contagem().por.colunas), 'NB09: "Colunas" desligado no app tira a coluna da conta');
  await ev(A1, () => nt124PrefMuda(n => { n.app = { ...(n.app || {}), colunas: true } })); await sleep(2500);

  /* ---------- bloqueio tira os itens ---------- */
  await ev(A1, async u => { await bloquear(u) }, d); await sleep(1500);
  it = await ev(A1, () => atItens().map(x => x.k + ' ' + x.txt.replace(/<[^>]+>/g, '')));
  ok(!it.some(x => /Dani Reis/.test(x)), 'bloqueou a Dani: o "começou a seguir" dela sai', it);

  /* ---------- dois aparelhos ---------- */
  await bia(u => dmEnviar(u, { texto: 'Olha isso', tipo: 'mencao', pid: FEED.pautas[0].id, snap: { titulo: 'x' } }, true), a);
  await recarrega(A2); await sleep(1500); await ev(A2, () => { updateBadge(); nt124PintaJa() });
  const antes2 = await ev(A2, () => nt124Contagem());
  ok(antes2.por.mencoes === 1 && antes2.por.colunas === 1, 'aparelho 2: menção e coluna contam', antes2);
  await ev(A1, () => { abrirAtividade() }); await sleep(400); await ev(A1, () => closeLayer());
  ok(await esperar(A2, () => nt124Contagem().ativ === 0, null, 8000), 'NB02: viu no aparelho 1, a bolinha some no aparelho 2 sem recarregar', await ev(A2, () => [nt124Contagem(), atVisto(), PREF.notif]));
  ok(await esperar(A2, () => document.querySelectorAll('.at-dot:not([hidden])').length === 0, null, 3000), 'NB02: o ♥ do aparelho 2 também apaga');
  // o aparelho 2 muda uma escolha; o aparelho 1 (que não recarregou) abre a Atividade de novo
  await ev(A2, () => nt124PrefMuda(n => { n.app = { ...(n.app || {}), curtidas: false } })); await sleep(2500);
  await ev(A1, async () => { PREF.seguindo = PREF.seguindo || {} }); // nada muda no 1
  await ev(A1, () => { abrirAtividade() }); await sleep(400); await ev(A1, () => closeLayer()); await sleep(2800);
  let pb = await prefsBanco();
  ok(pb.notif && pb.notif.app && pb.notif.app.curtidas === false && pb.notif.app.colunas === true, 'NB03: aparelho desatualizado não apaga a escolha feita no outro', pb.notif);
  ok(await ev(A1, () => PREF.notif.app.curtidas === false), 'NB03: e o aparelho 1 passa a mostrar a escolha do 2');
  // as coberturas seguidas no aparelho 2 também não se perdem
  await ev(A2, () => { const p = FEED.pautas[1]; cobSegue(temaDe(p), true) }); await sleep(2500);
  await ev(A1, () => nt124PrefMuda(n => { n.app = { ...(n.app || {}), reposts: false } })); await sleep(2800);
  pb = await prefsBanco();
  ok(Object.keys(pb.seguindo || {}).length >= 1 && pb.notif.app.reposts === false && pb.notif.app.curtidas === false, 'NB03: cobertura seguida no aparelho 2 + escolha no 1: as duas ficam', [pb.seguindo, pb.notif]);

  /* ---------- abrir o destino apaga a bolinha daquele item ---------- */
  const pid = await ev(A1, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Post do Pedro', fotos: [], estilo: { v: 2 } }).select('id'); await pubCarregar(); return r.data[0].id });
  await H.comoUsuario(b, () => H.db.query(`insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','cb1','{"texto":"Bom post"}')`, [pid, b]));
  await bia(u => dmEnviar(u, { texto: 'Outra menção', tipo: 'mencao', pid: FEED.pautas[1].id, snap: { titulo: 'y' } }, true), a); await sleep(1200);
  await ev(A1, async () => { AT.t = 0; await atCarregar() }); await sleep(800);
  cont = await ev(A1, () => nt124Contagem());
  ok(cont.por.comentarios === 1 && cont.por.mencoes === 1, 'comentário e menção novos contam', cont);
  await ev(A1, id => openComments('u:' + id), pid); await sleep(600); await ev(A1, () => closeLayer()); await sleep(300);
  cont = await ev(A1, () => nt124Contagem());
  ok(!cont.por.comentarios && cont.por.mencoes === 1, 'NB05: abrir os comentários do post apaga só o comentário (a menção continua)', cont);
  ok(await ev(A1, () => atItens().some(x => x.acao === 'cmt')), 'NB05: o comentário continua na Atividade');
  await sleep(2500);
  ok(await esperar(A2, () => !nt124Contagem().por.comentarios, null, 6000), 'NB05: e apaga também no aparelho 2', await ev(A2, () => nt124Contagem()));

  /* ---------- hora no futuro não prende a bolinha ---------- */
  await ev(A1, () => { const p = FEED.pautas[2]; p.atualizacoes = [{ hora: new Date(Date.now() + 3 * 3600e3).toISOString(), texto: 'Fuso errado' }]; cobSegue(temaDe(p), true) }); await sleep(300);
  cont = await ev(A1, () => nt124Contagem());
  ok(cont.por.coberturas === 1, 'cobertura com atualização "no futuro" conta uma vez', cont);
  await ev(A1, () => { abrirAtividade() }); await sleep(400); await ev(A1, () => closeLayer()); await sleep(200);
  ok(await ev(A1, () => nt124Contagem().ativ === 0), 'NB08: depois de ver, a bolinha não fica presa', await ev(A1, () => nt124Contagem()));

  /* ---------- "Desde a sua última visita" depois de dias fora ---------- */
  await sleep(2500);
  const cinco = Date.now() - 5 * 864e5;
  await ev(A2, t => { localStorage.setItem(AT_VISTO + ':' + S.uid, String(t)); PREF.notif = { ...PREF.notif, visto: t, vk: {} } }, cinco);
  await H.sql(`update pub_reacoes set at = $2 where pub = $1`, [pid, Date.now() - 2 * 864e5]);
  await H.sql(`update docs set data = jsonb_set(data, '{notif,visto}', to_jsonb($2::bigint)) || '{"mod":1}'::jsonb where path = $1`, ['data/users/' + a + '/prefs', cinco]);
  await ev(A2, async () => { PREF.mod = 1; AT.t = 0; await atCarregar() }); await sleep(500);
  await ev(A2, () => { abrirAtividade() }); await sleep(700);
  const fx = await ev(A2, () => ({ h: document.querySelector('#layer .nt124-desde .nt124-dh')?.textContent || '', chips: [...document.querySelectorAll('#layer .nt124-chip')].map(x => x.textContent) }));
  ok(/Desde a sua última visita/.test(fx.h) && /há 5 d/.test(fx.h) && fx.chips.some(t => /1 comentário/.test(t)) && fx.chips.some(t => /2 menções/.test(t)), 'depois de 5 dias fora: a faixa diz desde quando e resume o que chegou', fx);
  await ev(A2, () => closeLayer()); await sleep(300);

  /* ---------- número no ícone = o que se vê ---------- */
  await bia(u => dmEnviar(u, { texto: 'Oi, Pedro' }, true), a);
  await sleep(1500); await ev(A2, () => { go('feed'); updateBadge(); nt124PintaJa() }); await sleep(300);
  const vis = await ev(A2, () => { const c = nt124Contagem(); return { c, badge: window.__nt.badges[window.__nt.badges.length - 1], conv: +($('#badge').hidden ? 0 : $('#badge').textContent), msgs: (S.msgsIn || []).filter(m => !m.lida).length } });
  ok(vis.badge === vis.c.total && vis.c.total === vis.c.ativ + vis.conv && vis.conv === vis.msgs, 'número no ícone = novidades + mensagens não lidas que aparecem no app', vis);
  const cfg = await ev(A2, async () => { const c = await caches.open('prumo-v1'); const r = await c.match('./__nt-badge'); return r ? r.json() : null });
  ok(cfg && cfg.on === true && cfg.n === vis.c.total && cfg.off.includes('curtidas'), 'NB07: o app deixa para o service worker o número e os tipos desligados', cfg);
  await ev(A2, () => nt124PrefMuda(n => { n.badge = false })); await ev(A2, () => nt124PintaJa()); await sleep(300);
  ok(await ev(A2, async () => { const c = await caches.open('prumo-v1'); const r = await c.match('./__nt-badge'); return r && (await r.json()).on === false }), 'NB07: número no ícone desligado chega ao service worker');
  await ev(A2, () => nt124PrefMuda(n => { n.badge = true })); await sleep(2500);

  /* ---------- avisos no celular: servidor esqueceu o aparelho; sair da conta ---------- */
  await ev(A1, () => nt124Abrir()); await sleep(500);
  await ev(A1, () => document.querySelector('[data-nt124ativar]').click());
  ok(await esperar(A1, () => !!document.querySelector('[data-nt124estado="ativo"]'), null, 6000), 'ativar no aparelho 1');
  ok(await ev(A1, () => /Ao sair da conta, este aparelho deixa de receber os avisos/.test(document.querySelector('.nt124-cel').textContent)), 'página: diz que sair da conta desliga os avisos deste aparelho');
  await H.sql(`delete from push_inscricoes`);   // o servidor apagou (410) ou outra conta pegou
  await ev(A1, () => document.querySelector('[data-nt124push="mensagens"]').click());
  ok(await esperar(A1, () => true, null, 100) && await (async () => { for (let i = 0; i < 40; i++) { const r = await H.sql(`select prefs from push_inscricoes`); if (r.length && r[0].prefs.mensagens === true) return true; await sleep(150) } return false })(), 'NB06: ligar um tipo com o aparelho esquecido pelo servidor inscreve de novo (com a escolha)', await H.sql(`select prefs from push_inscricoes`));
  ok(await ev(A1, () => document.querySelector('[data-nt124push="mensagens"]').getAttribute('aria-checked') === 'true' && !!document.querySelector('[data-nt124estado="ativo"]')), 'NB06: e a página mostra ligado');
  await ev(A1, () => closeLayer()); await sleep(200);
  await ev(A1, () => sair()); await sleep(800);
  ok(+(await H.sql(`select count(*) n from push_inscricoes`))[0].n === 0 && await ev(A1, () => window.__nt.unsub >= 1 && !S.uid), 'NB04: sair da conta tira o aparelho do banco e cancela a inscrição', await H.sql(`select uid from push_inscricoes`));

  ok(!A1._erros.length && !A2._erros.length && !B._erros.length, 'sem erros na página', A1._erros.concat(A2._erros, B._erros).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_qa_noite_b: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
