// Notificações (js/124 + sql v10 + sw.js): bolinhas no app para cada tipo de novidade (duas pessoas pelo harness),
// faixa "Desde a sua última visita" com filtro, número no ícone (Badging API simulada), escolhas guardadas,
// ativar/desativar os avisos no celular (PushManager simulado) com a fila do banco, abrir a tela certa pelo aviso,
// e o push/notificationclick do service worker testados à parte. Escuro em 360 px. Capturas 390×844 em qa/notificacoes/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const PORTA = 8748, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'notificacoes'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const foto = (p, n) => p.screenshot({ path: path.join(QA, n + '.png') });

/* aparelho simulado: app instalado, Badging API, Notification e PushManager (nada sai do navegador) */
const APARELHO = () => {
  window.__nt = { badges: [], perm: 0, subs: [], unsub: 0, shown: [], ativo: null };
  const mm = window.matchMedia.bind(window);
  window.matchMedia = q => /display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } } : mm(q);
  navigator.setAppBadge = n => { window.__nt.badges.push(n); return Promise.resolve() };
  navigator.clearAppBadge = () => { window.__nt.badges.push(0); return Promise.resolve() };
  class N { static async requestPermission() { window.__nt.perm++; N.permission = 'granted'; try { localStorage.setItem('__ntperm', 'granted') } catch (e) { } return 'granted' } }
  N.permission = (() => { try { return localStorage.getItem('__ntperm') || 'default' } catch (e) { return 'default' } })(); window.Notification = N; window.PushManager = function () { };
  const b64 = n => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const pm = {
    async getSubscription() { return window.__nt.ativo },
    async subscribe(o) { const k = new Uint8Array(o.applicationServerKey); window.__nt.subs.push({ uv: o.userVisibleOnly, n: k.length, k0: k[0] });
      const ep = 'https://push.exemplo.test/send/' + b64(12), keys = { p256dh: b64(65), auth: b64(16) };
      const s = { endpoint: ep, options: { applicationServerKey: k.buffer }, toJSON: () => ({ endpoint: ep, expirationTime: null, keys }), async unsubscribe() { window.__nt.unsub++; window.__nt.ativo = null; return true } };
      window.__nt.ativo = s; return s }
  };
  const reg = { pushManager: pm, scope: location.origin + '/', async showNotification(t, o) { window.__nt.shown.push([t, o]) } };
  const sw = new EventTarget(); sw.getRegistration = async () => reg; sw.register = async () => reg; sw.ready = Promise.resolve(reg); sw.controller = null;
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, get: () => sw });
};

(async () => {
  /* ===================== 0. service worker: push e notificationclick (fora do navegador) ===================== */
  {
    const L = {}, shown = [], badges = [], abertas = [], posts = [];
    let wins = [], focos = 0;
    const self = { addEventListener: (t, f) => { L[t] = f }, skipWaiting() { }, registration: { scope: 'https://prumonews.com.br/', showNotification: async (t, o) => shown.push([t, o]) },
      clients: { matchAll: async () => wins, openWindow: async u => abertas.push(u), claim: async () => { }, get: async () => null }, navigator: { setAppBadge: async n => badges.push(n), clearAppBadge: async () => badges.push(0) } };
    const ctx = vm.createContext({ self, caches: {}, fetch: async () => { }, location: new URL('https://prumonews.com.br/sw.js'), URL, crypto, TextEncoder, setTimeout, console, Promise, Response: function () { } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app', 'sw.js'), 'utf8'), ctx);
    ok(['install', 'activate', 'fetch', 'push', 'notificationclick'].every(k => typeof L[k] === 'function'), 'sw: os ouvintes de sempre (install, activate, fetch) e os novos (push, notificationclick)');
    const espera = [];
    const evPush = d => ({ data: d === undefined ? null : { json: () => { if (typeof d === 'string') throw new Error('x'); return d }, text: () => String(d) }, waitUntil: p => espera.push(p) });
    L.push(evPush({ title: 'Bia', body: '3 mensagens novas: oi', tag: 'mensagens:conv:B', url: '?nt=conversa:B', badge: 4, at: 1700000000000 }));
    await Promise.all(espera.splice(0));
    const [t1, o1] = shown[0] || [];
    ok(t1 === 'Bia' && o1.body === '3 mensagens novas: oi' && o1.tag === 'mensagens:conv:B' && o1.renotify === true && o1.icon === 'icon-192.png' && o1.data.url === '?nt=conversa:B' && o1.timestamp === 1700000000000, 'sw push: mostra título, texto, ícone, etiqueta (agrupa) e o endereço', o1);
    ok(badges[0] === 4, 'sw push: põe o número no ícone');
    L.push(evPush('texto solto')); L.push(evPush(undefined)); L.push(evPush({ title: 'X', url: 'https://mal.example/' }));
    await Promise.all(espera.splice(0));
    ok(shown[1][0] === 'Prumo News' && shown[1][1].body === 'texto solto' && shown[2][0] === 'Prumo News' && shown[3][1].data.url === './' && !('tag' in shown[2][1]), 'sw push: sem dados, texto solto ou endereço de fora viram um aviso seguro', shown.slice(1));
    let fechou = 0; const evClk = u => ({ notification: { data: { url: u }, close: () => fechou++ }, waitUntil: p => espera.push(p) });
    L.notificationclick(evClk('?nt=conversa:B')); await Promise.all(espera.splice(0));
    ok(fechou === 1 && abertas[0] === 'https://prumonews.com.br/?nt=conversa:B', 'sw clique: sem app aberto, abre ./?nt=… dentro do site', abertas);
    wins = [{ url: 'https://outro.example/', postMessage: m => posts.push(['outro', m]), focus: async () => focos++ }, { url: 'https://prumonews.com.br/#feed', postMessage: m => posts.push(['app', m]), focus: async () => focos++ }];
    L.notificationclick(evClk('?nt=atividade')); await Promise.all(espera.splice(0));
    ok(posts.length === 1 && posts[0][0] === 'app' && posts[0][1].prumo === 'nt-abrir' && posts[0][1].url === 'https://prumonews.com.br/?nt=atividade' && focos === 1 && abertas.length === 1, 'sw clique: com o app aberto, traz para a frente e manda a ação', posts);
  }

  /* ===================== banco e pessoas ===================== */
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  // "Seguir" (v9) simulado como o n2 deve fazer; a v10 rodada de novo liga o gatilho de novo seguidor
  if (!(await H.sql("select to_regclass('public.seguidores') r"))[0].r) await H.db.exec(`create table public.seguidores(seguidor uuid not null references public.membros(uid) on delete cascade, seguido uuid not null references public.membros(uid) on delete cascade,
      criado_em timestamptz not null default now(), primary key(seguidor, seguido));
    alter table public.seguidores enable row level security;
    create policy seg_ler on public.seguidores for select to authenticated using (seguidor = auth.uid() or seguido = auth.uid());
    revoke all on public.seguidores from anon, authenticated; grant select on public.seguidores to authenticated;`);
  await H.db.exec(fs.readFileSync(path.join(__dirname, '..', 'sql', 'publicacoes-v10.sql'), 'utf8'));
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), c = await H.criarConta('c@x', '123456'), d = await H.criarConta('d@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Caio Lima','membro'),($4,'Dani Reis','membro')`, [a, b, c, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita')`, [a, b, d]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome, o = {}) => {
    const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } }, ...o }), nome);
    if (o.aparelho) await p.addInitScript(APARELHO);
    if (o.init) await p.addInitScript(o.init);
    await p.goto(o.url || BASE); await esperar(p, () => S.membro && S.amigosOk && typeof NT124 !== 'undefined' && NT124.v10 !== null, null, 20000); return p };
  const A = await abrir(a, 'a@x', 'A', { aparelho: true }), B = await abrir(b, 'b@x', 'B');
  ok(await ev(A, () => NT124.v10 === true && NT124.chave === null), 'app: detecta a v10 (sem a chave pública ainda)');
  ok(await esperar(A, () => NT124.v9 === true, null, 8000), 'app: detecta o "Seguir" (v9)');
  // Pedro olha a Atividade (marca a visita) antes das novidades
  await ev(A, () => { abrirAtividade() }); await sleep(500); await ev(A, () => closeLayer()); await sleep(200);
  const visto0 = await ev(A, () => atVisto());
  ok(visto0 > Date.now() - 60e3, 'Atividade aberta marca a visita');
  await sleep(1700);
  ok(+((await H.sql(`select data->'notif'->>'visto' v from docs where path=$1`, ['data/users/' + a + '/prefs']))[0] || {}).v >= visto0 - 5, 'a visita vai junto das preferências (outros aparelhos sabem)');
  await sleep(300);

  /* ===================== 1. as novidades (Bia, Caio e Dani) ===================== */
  // post e comentário de notícia do Pedro
  const pid = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Votação da escala 6x1 fica para a semana que vem', fotos: [], estilo: { v: 2 } }).select('id'); await pubCarregar(); return r.data[0].id });
  const pauta = await ev(A, () => FEED.pautas[0].id);
  const cidA = await ev(A, async p => { const cid = 'k' + Date.now().toString(36); await gravarMapa('comentarios/' + S.uid, 'itens', cid, { pid: p, texto: 'Acho que passa', at: Date.now(), snap: { id: p, titulo: 'Escala 6x1' } }); return cid }, pauta);
  await sleep(400);
  await ev(B, () => { PUB.sig = ''; return pubCarregar() }); await sleep(300);
  await ev(B, async ([u, id]) => {
    await dmEnviar(u, { texto: 'Oi, Pedro! Viu a votação?' }, true);
    await dmEnviar(u, { texto: 'Olha o que o relator disse', tipo: 'mencao', pid: FEED.pautas[0].id, snap: { titulo: 'Escala 6x1' } }, true);
    await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'comentario', chave: 'cb1', valor: { texto: 'Relator já tinha avisado' } });
    await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'curtida', chave: '', valor: {} });
    await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Concordo com o Pedro', fotos: [], estilo: { v: 2, rp: { k: 'pub', id } } });
  }, [a, pid]);
  await ev(B, async ([u, cid]) => SB.from('com_curtidas').insert({ autor: u, cid, pub: null, uid: S.uid }), [a, cidA]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'pendente')`, [c, a]);
  await H.sql(`insert into public.seguidores(seguidor,seguido) values ($1,$2),($3,$4)`, [d, a, a, b]);  // Dani segue o Pedro; o Pedro segue a Bia
  await ev(B, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Fim de tarde no Congresso', fotos: [], estilo: { v: 2 } }) });
  await ev(B, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'O que muda na jornada de trabalho', fotos: [], estilo: { v: 2, coluna: true, titulo: 'O que muda na jornada' } }) });
  await sleep(900);
  // cobertura seguida com atualização nova
  await ev(A, () => { const p = FEED.pautas[0]; p.atualizacoes = [{ hora: new Date().toISOString(), texto: 'Votação marcada para terça' }]; cobSegue(temaDe(p), true) });
  await ev(A, async () => { PUB.sig = ''; await pubCarregar(); AT.t = 0; await atCarregar(); if (typeof at8Carregar === 'function') await at8Carregar(); await nt124CarregaSeg() });
  ok(await esperar(A, () => S.pedidosIn.length === 1 && (S.msgsIn || []).filter(m => !m.lida).length >= 2, null, 12000), 'Pedro recebe o pedido do Caio e as mensagens da Bia');
  await sleep(600); await ev(A, () => { updateBadge(); nt124PintaJa() });
  const cont = await ev(A, () => nt124Contagem());
  const tem = ['comentarios', 'mencoes', 'curtidas', 'reposts', 'amizades', 'seguidores', 'seguindo', 'colunas', 'coberturas'];
  ok(tem.every(k => cont.por[k] > 0), 'contagem: um tipo para cada novidade', cont);
  ok(cont.por.curtidas === 2, 'contagem: curtidas do post e do comentário', cont.por);
  const nmsg = await ev(A, () => nt124MsgsN());
  ok(nmsg >= 1 && cont.msgs === nmsg && cont.total === cont.ativ + nmsg, 'contagem: mensagens não lidas somadas', [cont, nmsg]);

  /* ---------- bolinhas ---------- */
  await ev(A, () => { closeLayer(); go('feed') }); await sleep(400);
  ok(await ev(A, n => !$('#badge').hidden && $('#badge').textContent === String(n), nmsg), 'barra: Conversas com o número de mensagens');
  ok(await ev(A, () => !$('#mbadge').hidden && /novidades no Perfil/.test($('#mbadge').getAttribute('aria-label'))), 'barra: bolinha no Perfil (com o número para o leitor de tela)', await ev(A, () => $('#mbadge').getAttribute('aria-label')));
  ok(await ev(A, () => [...document.querySelectorAll('.at-dot')].some(x => !x.hidden)), 'topo: bolinha no ♥ da Atividade');
  await foto(A, '1-barra-com-bolinhas');
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#v-me [data-pfaba="conta"] .nt124-dot')), 'Perfil: bolinha na aba Conta');
  ok(await ev(A, n => { const e = document.querySelector('#v-me [data-nt124ativ] em'); return e && e.classList.contains('nt124-n') && +e.textContent === n }, cont.ativ), 'Perfil › Conta: "Atividade" com o número');
  ok(await ev(A, () => { const b = document.querySelector('#v-me [data-nt124abrir]'); return b && !!b.closest('.card.menu').querySelector('.cm-h') }), 'Perfil › Conta: "Notificações" no cartão Conta');

  /* ---------- número no ícone ---------- */
  ok(await ev(A, n => window.__nt.badges[window.__nt.badges.length - 1] === n, cont.total), 'ícone: número com o total (Badging API)', await ev(A, () => window.__nt.badges));

  /* ---------- Atividade: "Desde a sua última visita" ---------- */
  await clk(A, '#v-me [data-nt124ativ]'); await sleep(700);
  const chips = await ev(A, () => [...document.querySelectorAll('#layer .nt124-desde .nt124-chip')].map(x => x.textContent.trim()));
  ok(await ev(A, () => /Desde a sua última visita/.test(document.querySelector('#layer .pfv-at .pfv-sc > .nt124-desde')?.textContent || '')), 'Atividade: faixa no alto');
  ok(chips.some(t => /\d+ mensage(m|ns) não lidas?/.test(t)) && chips.some(t => /2 curtidas/.test(t)) && chips.some(t => /1 menção/.test(t)) && chips.some(t => /1 repost/.test(t))
    && chips.some(t => /1 pedido de amizade/.test(t)) && chips.some(t => /seguidor novo/.test(t)) && chips.some(t => /coluna nova/.test(t)) && chips.some(t => /cobertura atualizada/.test(t)) && chips.some(t => /comentário/.test(t)), 'Atividade: um resumo por tipo', chips);
  const atx = await ev(A, () => document.querySelector('#layer .pfv-at').textContent);
  ok(/Dani Reis começou a seguir você/.test(atx) && /Bia Souza publicou uma coluna: “O que muda na jornada”/.test(atx) && !/Bia Souza publicou: “Concordo com o Pedro”/.test(atx), 'Atividade: novo seguidor e coluna de quem você segue', atx.slice(0, 600));
  await foto(A, '2-atividade-desde-a-ultima-visita');
  await clk(A, '#layer [data-nt124f="curtidas"]'); await sleep(200);
  const vis = await ev(A, () => [...document.querySelectorAll('#layer .at-l li')].filter(li => !li.hidden).map(li => li.textContent));
  ok(vis.length === 2 && vis.every(t => /curtiu/.test(t)) && await ev(A, () => document.querySelector('[data-nt124f="curtidas"]').getAttribute('aria-pressed') === 'true'), 'Atividade: tocar no resumo filtra só as curtidas', vis);
  await clk(A, '#layer [data-nt124f="curtidas"]'); await sleep(200);
  ok(await ev(A, () => [...document.querySelectorAll('#layer .at-l li')].every(li => !li.hidden)), 'Atividade: tocar de novo mostra tudo');
  await ev(A, () => closeLayer()); await sleep(300);
  ok(await ev(A, () => { const c = nt124Contagem(); return c.ativ === 1 && c.por.amizades === 1 && document.querySelectorAll('#v-me [data-pfaba="conta"] .nt124-dot').length === 1 }), 'depois de ver: só o pedido ainda sem resposta continua contando', await ev(A, () => nt124Contagem()));

  /* ===================== 2. a página Notificações ===================== */
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300);
  await clk(A, '#v-me [data-nt124abrir]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv-nt124 [data-nt124estado="admin"]') && /Ainda não ativado pelo administrador/.test(document.querySelector('#layer .pfv-nt124').textContent) && !document.querySelector('[data-nt124push]')), 'sem a chave pública: "Ainda não ativado pelo administrador" e sem a coluna Celular');
  const nomes = await ev(A, () => [...document.querySelectorAll('#layer .nt124-li[data-nt124tipo]')].map(x => x.dataset.nt124tipo));
  ok(nomes.length === 10, 'página: os 10 tipos (com o Seguir)', nomes);
  ok(await ev(A, () => [...document.querySelectorAll('[data-nt124app]')].every(x => x.getAttribute('aria-checked') === 'true')), 'no app: tudo ligado por padrão');
  // número no ícone desligado
  const nb = await ev(A, () => window.__nt.badges.length);
  await clk(A, '[data-nt124badge]'); await sleep(200);
  ok(await ev(A, k => PREF.notif.badge === false && window.__nt.badges.length > k && window.__nt.badges[window.__nt.badges.length - 1] === 0, nb), 'ícone: desligar limpa o número');
  await clk(A, '[data-nt124badge]'); await sleep(200);
  // desligar curtidas e mensagens no app
  await clk(A, '[data-nt124app="curtidas"]'); await clk(A, '[data-nt124app="mensagens"]'); await sleep(300);
  ok(await ev(A, () => PREF.notif.app.curtidas === false && PREF.notif.app.mensagens === false && document.querySelector('[data-nt124app="curtidas"]').getAttribute('aria-checked') === 'false'), 'no app: desligar curtidas e mensagens');
  ok(await ev(A, () => $('#badge').hidden), 'mensagens desligadas: some o número das Conversas');
  await sleep(1800);
  const pr = (await H.sql(`select data->'notif' n from docs where path=$1`, ['data/users/' + a + '/prefs']))[0].n;
  ok(pr && pr.app && pr.app.curtidas === false && pr.app.mensagens === false, 'escolhas guardadas no banco (vão para os outros aparelhos)', pr);
  // a chave pública gravada pelo administrador
  const ec = crypto.createECDH('prime256v1'); ec.generateKeys(); const PUBK = ec.getPublicKey().toString('base64url');
  await H.sql(`insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', $1::text))`, [PUBK]);
  await ev(A, async () => { NT124.v10 = null; await nt124Testa() }); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('[data-nt124estado="inativo"]') && !!document.querySelector('[data-nt124ativar]') && document.querySelectorAll('[data-nt124push]').length === 10
    && [...document.querySelectorAll('[data-nt124push]')].every(x => x.getAttribute('aria-checked') === 'false')), 'com a chave: botão "Ativar" e a coluna Celular toda desligada');
  ok(await ev(A, () => window.__nt.perm === 0), 'não pede permissão antes do toque');
  await foto(A, '3-notificacoes-antes-de-ativar');
  await clk(A, '[data-nt124ativar]');
  ok(await esperar(A, () => !!document.querySelector('[data-nt124estado="ativo"]'), null, 6000), 'ativar: fica "Ativados neste aparelho"');
  const s0 = await ev(A, () => window.__nt.subs[0]);
  ok(await ev(A, () => window.__nt.perm === 1) && s0 && s0.uv === true && s0.n === 65 && s0.k0 === 4, 'ativar: pede a permissão uma vez e inscreve com a chave pública (65 bytes)', s0);
  let ins = await H.sql(`select uid, endpoint, prefs from push_inscricoes`);
  ok(ins.length === 1 && ins[0].uid === a && /^https:\/\/push\.exemplo\.test\//.test(ins[0].endpoint) && Object.values(ins[0].prefs).every(v => v === false), 'ativar: aparelho guardado no banco, com tudo desligado', ins);
  await clk(A, '[data-nt124push="mensagens"]'); await sleep(500); await clk(A, '[data-nt124push="comentarios"]'); await sleep(500);
  ins = await H.sql(`select prefs from push_inscricoes`);
  ok(ins[0].prefs.mensagens === true && ins[0].prefs.comentarios === true && ins[0].prefs.curtidas === false, 'celular: ligar mensagens e comentários grava no banco', ins[0].prefs);
  await ev(A, () => { document.querySelectorAll('.toast').forEach(x => x.remove()); document.querySelector('#layer .pfv-nt124 .pfv-sc').scrollTop = 0 }); await sleep(150);
  await foto(A, '3b-notificacoes-ativadas');
  // a fila: a Bia manda mensagem e curte de novo (curtidas desligadas no celular)
  await ev(B, async u => { await dmEnviar(u, { texto: 'Liga quando puder' }, true) }, a);
  await ev(B, async id => { await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'comentario', chave: 'cb2', valor: { texto: 'E agora?' } }) }, pid);
  await sleep(500);
  const fila = await H.sql(`select tipo, titulo, corpo, url from push_fila where para=$1 order by id`, [a]);
  ok(fila.length === 2 && fila[0].tipo === 'mensagens' && fila[0].titulo === 'Bia Souza' && fila[0].corpo === 'Liga quando puder' && fila[0].url === '?nt=conversa:' + b
    && fila[1].tipo === 'comentarios' && /Bia Souza comentou no seu post/.test(fila[1].titulo), 'fila: mensagem e comentário viram aviso (o que está desligado, não)', fila);
  await clk(A, '[data-nt124teste]'); await sleep(400);
  ok(await ev(A, () => window.__nt.shown.length === 1 && window.__nt.shown[0][0] === 'Prumo News'), 'aviso de teste aparece');
  // desativar e ligar de novo tocando direto num tipo
  await clk(A, '[data-nt124desativar]');
  ok(await esperar(A, () => !!document.querySelector('[data-nt124estado="inativo"]'), null, 5000) && (await H.sql(`select count(*) n from push_inscricoes`))[0].n == 0 && await ev(A, () => window.__nt.unsub === 1), 'desativar: sai do banco e cancela a inscrição do aparelho');
  await clk(A, '[data-nt124push="mencoes"]');
  ok(await esperar(A, () => !!document.querySelector('[data-nt124estado="ativo"]'), null, 6000), 'tocar num tipo com o aparelho desativado já ativa');
  ins = await H.sql(`select prefs from push_inscricoes`);
  ok(ins.length === 1 && ins[0].prefs.mencoes === true && ins[0].prefs.mensagens === true && await ev(A, () => window.__nt.perm === 1), 'reativar: mantém as escolhas, liga menções e não pergunta de novo', ins[0] && ins[0].prefs);
  await ev(A, () => closeLayer()); await sleep(300);

  /* ---------- recarregar: as escolhas continuam ---------- */
  await A.reload(); await esperar(A, () => S.membro && S.amigosOk && NT124.v10 === true, null, 15000); await sleep(800);
  await ev(A, () => nt124Abrir()); await sleep(500);
  ok(await ev(A, () => document.querySelector('[data-nt124app="curtidas"]').getAttribute('aria-checked') === 'false' && document.querySelector('[data-nt124push="mencoes"]').getAttribute('aria-checked') === 'true' && !!document.querySelector('[data-nt124estado="ativo"]')), 'recarregar: escolhas do app e do celular continuam');
  await ev(A, () => closeLayer()); await sleep(300);

  /* ===================== 3. abrir a tela certa pelo aviso ===================== */
  const D = await abrir(a, 'a@x', 'A2', { aparelho: true, url: BASE + '?nt=conversa:' + b });
  ok(await esperar(D, u => VIEW === 'msgs' && THREAD === u, b, 12000), 'aviso tocado: ./?nt=conversa:… abre a conversa');
  ok(await ev(D, () => !/nt=/.test(location.search)), 'aviso tocado: o endereço volta a ficar limpo');
  await ev(D, () => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { prumo: 'nt-abrir', url: location.origin + '/?nt=atividade' } })));
  ok(await esperar(D, () => !!document.querySelector('#layer .pfv-at'), null, 6000), 'app aberto: o service worker manda "atividade" e ela abre');
  await ev(D, () => closeLayer()); await sleep(300);
  await ev(D, id => nt124Rota('comentarios:' + id), pid);
  ok(await esperar(D, () => !!document.querySelector('#cbox'), null, 8000), 'aviso de comentário abre os comentários do post');
  await D.close();

  /* ===================== 4. escuro, 360 px, iPhone sem a Tela de Início ===================== */
  const E = await abrir(d, 'd@x', 'D', { dark: true, viewport: { width: 360, height: 780 }, init: () => { Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1' }); delete window.PushManager } });
  await ev(E, () => nt124Abrir()); await sleep(600);
  const esc = await ev(E, () => { const el = document.querySelector('#layer .pfv-nt124'), sc = el.querySelector('.pfv-sc'); const bg = getComputedStyle(document.querySelector('.nt124-tab')).backgroundColor;
    return { sw: document.documentElement.scrollWidth, scw: sc.scrollWidth, cw: sc.clientWidth, bg, txt: el.textContent } });
  ok(esc.sw <= 360 && esc.scw <= esc.cw + 1, '360 px: nada passa da largura', esc);
  ok(/rgb\((\d+), (\d+), (\d+)\)/.test(esc.bg) && +RegExp.$1 < 60, 'escuro: cartões escuros', esc.bg);
  ok(/Tela de Início/.test(esc.txt) && /16\.4/.test(esc.txt), 'iPhone fora da Tela de Início: explica como ativar', esc.txt.slice(0, 300));
  await foto(E, '5-notificacoes-escuro-360');
  await ev(E, () => closeLayer()); await ev(E, () => abrirAtividade()); await sleep(600);
  ok(await ev(E, () => document.documentElement.scrollWidth <= 360), '360 px: Atividade sem rolar para o lado');
  await E.close();

  /* ===================== 5. o aviso como aparece no celular (simulado) ===================== */
  const Lg = await import(path.join(__dirname, '..', 'supabase', 'functions', 'enviar-push', 'logica.mjs'));
  const g = Lg.agrupar([{ id: 1, para: a, tipo: 'mensagens', chave: 'conv:' + b, de: b, titulo: 'Bia Souza', corpo: 'Oi, Pedro! Viu a votação?', url: '?nt=conversa:' + b, criado_em: new Date(Date.now() - 50e3).toISOString() },
    { id: 2, para: a, tipo: 'mensagens', chave: 'conv:' + b, de: b, titulo: 'Bia Souza', corpo: 'Liga quando puder', url: '?nt=conversa:' + b, criado_em: new Date().toISOString() }], []).grupos;
  const p1 = Lg.montarPayload(g[0], 2), p2 = Lg.montarPayload({ tipo: 'comentarios', chave: 'cmt:x', linhas: [{ titulo: 'Bia Souza comentou no seu post', corpo: 'Relator já tinha avisado', de: b, url: '?nt=comentarios:x' }] });
  const icon = fs.readFileSync(path.join(__dirname, '..', 'app', 'icon-192.png')).toString('base64');
  const M = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
  const card = (p, h) => `<div class="n"><div class="h"><img src="data:image/png;base64,${icon}"><span>Prumo News · ${h}</span></div><b>${p.title}</b><p>${p.body}</p></div>`;
  await M.setContent(`<html><body style="margin:0;height:844px;background:linear-gradient(160deg,#1d3a63,#0f1522);font-family:system-ui,sans-serif;color:#fff">
    <div style="text-align:center;padding-top:70px"><div style="font-size:76px;font-weight:300;letter-spacing:-2px">21:47</div><div style="opacity:.8">quarta-feira, 4 de novembro</div></div>
    <style>.n{margin:14px 14px 0;padding:12px 14px;border-radius:18px;background:rgb(255 255 255 / .82);color:#111;backdrop-filter:blur(8px)}.h{display:flex;align-items:center;gap:8px;font-size:12px;color:#555;margin-bottom:4px}
    .h img{width:20px;height:20px;border-radius:5px}.n b{font-size:15px}.n p{margin:2px 0 0;font-size:14px;line-height:1.3}</style>
    <div style="margin-top:60px">${card(p1, 'agora')}${card(p2, 'há 2 min')}</div>
    <p style="position:absolute;bottom:20px;width:100%;text-align:center;font-size:12px;opacity:.7">Simulação a partir do aviso montado pela função enviar-push</p></body></html>`);
  await M.screenshot({ path: path.join(QA, '4-aviso-no-celular-simulado.png') });
  ok(p1.title === 'Bia Souza' && /2 mensagens novas/.test(p1.body), 'aviso simulado: duas mensagens em um aviso');

  ok(!A._erros.length && !B._erros.length && !E._erros.length && !D._erros.length, 'sem erros na página', A._erros.concat(B._erros, E._erros, D._erros).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_notificacoes: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
