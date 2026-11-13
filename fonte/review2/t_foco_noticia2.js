// Foco em notícia, 2º passe (107): o Feed lê como "a notícia + o que meus amigos acham", barra de publicar com a manchete,
// linha discreta na Capa e nos filtros, análise/relato do tamanho do texto, "Análise de", Perfil com contribuições por tipo,
// Atividade agrupada por notícia, stories com notícias primeiro, prévia do cartão de texto visível, arte da notícia sem corte.
// Roda com as flags de produção (foco, sem Reels, Capa, animações).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8977, BASE = `http://localhost:${PORTA}/index.html`;
const SH = __dirname + '/../qa/s2/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim']) localStorage.setItem('prumo-teste-' + k, '1') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => go('me')); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  for (const P of [A, B, C]) await flags(P);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  await criar(C, { url: await convite(A), nome: 'Carla Mendes', email: 'c@x.com' });
  for (const P of [A, B, C]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  ok(await ev(A, () => FOCO_LIGADO && document.documentElement.classList.contains('foco2')), 'estado de produção: foco ligado (2º passe)');
  const ids = await ev(A, () => { const { man, dest } = capaEscolha(); const l = ordenadas(visiveis()).map(p => p.id); return { m: man.id, d: (dest || []).map(p => p.id), outra: l.find(x => x !== man.id && !(dest || []).some(p => p.id === x)) } });

  // ===== 1. barra de publicar: sugere a manchete
  const bar = await ev(A, () => { const b = document.querySelector('#cn102-bar .fc107-barb'); return b && { pid: b.dataset.fc107sug, t: b.textContent, mais: !!document.querySelector('#cn102-bar .fc107-bmais[data-cn102bar]') } });
  ok(bar && bar.pid === ids.m && /^O que você acha\?/.test(bar.t) && bar.mais, 'barra de publicar sugere a manchete ("O que você acha?") e tem o + para os outros tipos', JSON.stringify(bar));
  await clk(A, '#cn102-bar .fc107-barb'); await esperar(A, () => ED && ED.po && ED.po.cn && ED.po.cn.k === 'nt', null, 6000); await sleep(400);
  ok(await ev(A, m => ED.po.pid === m && !!document.querySelector('#layer .cn102'), ids.m), 'tocar na sugestão abre "Comentar notícia" já com a manchete');
  await A.fill('#ce-leg', 'Sem acordo, a PEC fica para depois da eleição.'); await ev(A, () => document.querySelector('[data-edpubpo]').click());
  await esperar(A, () => !ED && !PQ.atual && PUB.itens.some(x => x.autor === S.uid), null, 15000); await sleep(1200);
  ok(await ev(A, d => document.querySelector('#cn102-bar .fc107-barb')?.dataset.fc107sug === d, ids.d[0]), 'depois de comentar a manchete, a barra sugere o próximo destaque');

  // ===== 2. comentários dos amigos logo abaixo da notícia
  const now = Date.now();
  await ins(B, [{ tipo: 'post', at: now - 20 * 60e3, texto: 'Acho que vai ser decidido no detalhe.', fotos: [], pid: ids.m, estilo: { v: 2, cn: { v: 1, k: 'nt' } } },
    { tipo: 'post', at: now - 15 * 60e3, texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro.', fotos: [], estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } },
    { tipo: 'post', at: now - 12 * 60e3, texto: 'Fila no posto\n\nDesde as 6h há fila para a vacina.', fotos: [], estilo: { v: 2, local: 'Tijuca', cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } },
    { tipo: 'story', at: now - 10 * 60e3, expira: now + 20 * 3600e3, texto: 'Notícia', fotos: [], pid: ids.m, estilo: { v: 2, fundo: 13, itens: [{ t: 'nt', pid: ids.m, x: .5, y: .5, s: 1, r: 0 }] } }]);
  await ins(C, [{ tipo: 'post', at: now - 8 * 60e3, texto: 'Ninguém sabe ainda.', fotos: [], pid: ids.m, estilo: { v: 2, cn: { v: 1, k: 'nt' } } },
    { tipo: 'story', at: now - 5 * 60e3, expira: now + 20 * 3600e3, texto: 'Fila enorme', fotos: [], estilo: { v: 2, fundo: 3, itens: [{ t: 'texto', tx: 'Fila enorme', x: .5, y: .5, s: 1, r: 0, f: 'forte', cor: '#ffffff' }] } }]);
  await ev(A, async () => { await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); scrollTo(0, 0) }); await sleep(1200);
  const ordem = await ev(A, m => pubVisiveis().filter(x => x.pid === m && x.tipo === 'post').sort((a, b) => b.at - a.at).map(x => nomeDe(x.autor)).join(), ids.m);
  const g = await ev(A, m => { const n = document.getElementById('p-' + m); const out = []; let e = n && n.nextElementSibling; while (e && e.classList.contains('fc107-junto')) { out.push({ j1: e.classList.contains('fc107-j1'), gh: e.querySelector('.fc107-gh')?.textContent || '', car: getComputedStyle(e.querySelector('.car')).display, nome: e.querySelector('.ph-nm b').textContent, legAntes: !!e.querySelector('.up-leg + .acts'), leg: e.querySelector('.up-leg')?.textContent || '' }); e = e.nextElementSibling } return out }, ids.m);
  ok(g.length === 3 && g[0].j1 && g[0].gh === 'O que seus amigos acham' && g.map(x => x.nome).join() === ordem, 'Feed: os comentários sobre a manchete vêm logo abaixo dela, do mais novo para o mais antigo, com "O que seus amigos acham"', JSON.stringify(g));
  ok(g.every(x => x.car === 'none' && !/^\s*(Bia|Carla|Pedro)/.test(x.leg)), 'comentário junto da notícia é compacto: sem repetir a arte e sem o nome de novo no texto', JSON.stringify(g));
  ok(await ev(A, m => !document.querySelector(`#p-${CSS.escape(m)} .fc107-amg`), ids.m), 'com os comentários logo abaixo, a notícia não ganha a linha "comentaram" (não repete)');
  await A.screenshot({ path: SH + 't-feed-junto.png' });
  ok(await ev(A, () => { for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } return [...document.querySelectorAll('#posts .upost.fc107-junto')].length === 3 && !!document.querySelector('#posts .upost.cn102-ana:not(.fc107-junto)') && !!document.querySelector('#posts .upost.cn102-rel:not(.fc107-junto)') }), 'os outros posts (análise, relato) seguem no Feed normalmente');

  // ===== 3. filtro da seção: linha discreta e folha "O que seus amigos acham"
  await ev(A, m => { const p = pautaById(m); FILTRO = secOf(p); renderPosts() }, ids.m); await sleep(500);
  const ln = await ev(A, m => { const b = document.querySelector(`#p-${CSS.escape(m)} .fc107-amg .fc107-amt`); return b && b.textContent.trim() }, ids.m);
  ok(ln === 'Carla e Bia comentaram', 'no filtro da seção, a notícia mostra "Carla e Bia comentaram" (só amigos, sem a própria pessoa)', ln);
  await clk(A, `#p-${ids.m} .fc107-amg`); await esperar(A, () => !!document.querySelector('#layer .sheet .fc107-tl'), null, 3000); await sleep(400);
  const sh = await ev(A, () => ({ t: document.querySelector('#layer .sh-h').firstChild.textContent, n: document.querySelectorAll('#layer .fc107-tl li').length, voce: [...document.querySelectorAll('#layer .fc107-tq b')].map(b => b.textContent), com: !!document.querySelector('#layer [data-fc107com]') }));
  ok(sh.t === 'O que seus amigos acham' && sh.n === 3 && sh.voce.includes('Você') && sh.com, 'a linha abre "O que seus amigos acham": os 3 comentários (o seu como "Você") e "Comentar esta notícia"', JSON.stringify(sh));
  await A.screenshot({ path: SH + 't-folha-amigos.png' });
  await clk(A, '#layer [data-fc107ir]'); await sleep(900);
  ok(await ev(A, () => FILTRO === 'tudo' && VIEW === 'feed' && !document.querySelector('#layer .sheet')), '"Ver no Feed" leva ao post no Feed');

  // ===== 4. Capa: linha discreta na manchete
  await ev(A, () => { go('capa'); renderCapa(); scrollTo(0, 0) }); await sleep(700);
  const cp = await ev(A, m => ({ man: document.querySelector(`#cpi-${CSS.escape(m)} > .fc107-cpa .fc107-amt`)?.textContent.trim(), outras: document.querySelectorAll('#v-capa .fc107-cpa').length }), ids.m);
  ok(cp.man === 'Carla e Bia comentaram' && cp.outras === 1, 'Capa: "Carla e Bia comentaram" só na manchete (onde há comentários de amigos)', JSON.stringify(cp));
  await A.screenshot({ path: SH + 't-capa.png' });
  await clk(A, `#cpi-${ids.m} > .fc107-cpa`); ok(await esperar(A, () => !!document.querySelector('#layer .fc107-tl'), null, 3000), 'tocar na linha da Capa abre o que os amigos escreveram');
  await clk(A, '#layer [data-fc107com]'); ok(await esperar(A, m => ED && ED.po && ED.po.cn && ED.po.cn.k === 'nt' && ED.po.pid === m, ids.m, 5000), '"Comentar esta notícia" abre o formulário já com a notícia');
  await fecha(A); await sleep(300);

  // ===== 5. análise e relato: "Análise de", do tamanho do texto
  await ev(A, () => { go('feed'); FILTRO = 'tudo'; renderPosts(); for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } }); await sleep(500);
  // fora da tela o cartão fica com a altura reservada (content-visibility); mede cada um depois de trazê-lo para a tela
  for (const k of ['ana', 'rel']) { await ev(A, k => document.querySelector('#posts .upost.cn102-' + k).scrollIntoView({ block: 'center' }), k); await sleep(400) }
  const an = await ev(A, () => { const a = document.querySelector('#posts .upost.cn102-ana'), r = document.querySelector('#posts .upost.cn102-rel'); return a && r && { aCar: !!a.querySelector(':scope > .car'), aTit: /Juros altos por mais tempo/.test(a.textContent), rTit: /Fila no posto/.test(r.textContent), h: (a.scrollIntoView({ block: 'center' }), Math.round(a.getBoundingClientRect().height)), hr: (r.scrollIntoView({ block: 'center' }), Math.round(r.getBoundingClientRect().height)) } });
  ok(an && !an.aCar && an.aTit && an.rTit && an.h < 420 && an.hr < 460, 'análise e relato sem foto: sem o cartão colorido (122), título e texto do tamanho do conteúdo', JSON.stringify(an));

  // ===== 6. arte da notícia sem corte
  const art = await ev(A, () => { for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } const cs = [...document.querySelectorAll('#posts .post .sl>.cover.paper:not(.info):not(.fcv)')]; return { n: cs.length, ok: cs.every(c => { const s = c.querySelector(':scope>svg'), r = s.getBoundingClientRect(), cv = c.querySelector('.cv').getBoundingClientRect(); return Math.abs(r.width - c.getBoundingClientRect().width) < 2 && Math.abs(r.height - r.width * 264 / 400) < 3 && cv.top >= r.bottom - 1 }) } });
  ok(art.n > 0 && art.ok, 'arte das notícias no Feed: largura inteira (sem cortar as laterais) e o título abaixo da arte', JSON.stringify(art));

  // ===== 7. Perfil: contribuições por tipo
  const uidB = await ev(B, () => S.uid);
  await ev(A, u => abrirPerfil(u), uidB); await esperar(A, () => !!document.querySelector('#layer .pfv .fc107-pk'), null, 5000); await sleep(400);
  const pk = await ev(A, () => [...document.querySelectorAll('#layer .fc107-pk button')].map(b => b.textContent.replace(/\s+/g, ' ').trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')));
  ok(pk.join('|') === 'Tudo 3*|Notícias comentadas 1|De perto 1|Análises 1', 'perfil: contribuições por tipo (Tudo, Notícias comentadas, De perto, Análises)', pk.join('|'));
  ok(await ev(A, () => !!document.querySelector('#layer .vn-pl > .post.cn102-ana') && !!document.querySelector('#layer .vn-pl > .post.cn102-rel')), 'perfil em lista (112) com a análise e o De perto');
  await clk(A, '#layer [data-fc107pk="ana"]'); await sleep(400);
  ok(await ev(A, () => { const l = [...document.querySelectorAll('#layer .vn-pl > .post')]; return l.length === 1 && l[0].classList.contains('cn102-ana') && /Juros altos/.test(l[0].textContent) && document.querySelector('#layer [data-fc107pk="ana"]').getAttribute('aria-pressed') === 'true' }), 'tocar em "Análises" deixa só as análises na lista');
  await A.screenshot({ path: SH + 't-perfil.png' });
  await ev(A, () => closeLayer()); await sleep(400);
  await ev(A, u => abrirPerfil(u), uidB); await sleep(500);
  ok(await ev(A, () => document.querySelector('#layer [data-fc107pk=""]')?.getAttribute('aria-pressed') === 'true'), 'ao abrir o perfil de novo, volta para "Tudo"');
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 8. Atividade: o que é da mesma notícia fica junto
  const meu = await ev(A, () => PUB.itens.find(x => x.autor === S.uid && x.tipo === 'post').id);
  await ev(B, async id => { await pubCarregar(); await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'curtida', chave: '', valor: {} }) }, meu);
  await ev(A, () => abrirAtividade()); await esperar(A, () => !!document.querySelector('#layer .pfv-at .fc107-ath'), null, 6000); await sleep(500);
  const at = await ev(A, () => ({ h: document.querySelector('#layer .fc107-ath b')?.textContent, g: [...document.querySelectorAll('#layer li.fc107-atg .at-tx')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), vz: document.querySelector('#layer .pf-vz')?.textContent || '' }));
  const tm = await ev(A, m => versao(pautaById(m), lente()).titulo, ids.m);
  ok(at.h === tm && at.g.length === 2 && at.g.some(t => /^Bia Souza curtiu seu comentário sobre esta notícia/.test(t)) && at.g.some(t => /^Carla Mendes e Bia Souza comentaram a notícia/.test(t)), 'Atividade: curtida no seu comentário e comentários dos amigos sobre a mesma notícia ficam juntos, sob o título dela', JSON.stringify(at));
  await A.screenshot({ path: SH + 't-atividade.png' });
  await clk(A, '#layer li.fc107-atgl .at-it'); ok(await esperar(A, () => !!document.querySelector('#layer .fc107-tl'), null, 3000), 'tocar em "comentaram a notícia" abre o que os amigos escreveram');
  await ev(A, () => closeLayer()); await sleep(400);
  ok(await ev(A, () => { const x = { tipo: 'post', id: 'zz', estilo: { cn: { v: 1, k: 'ana', tit: 'Dólar <b>sobe</b>' } }, fotos: [] }; return atPubNome(x) === 'sua análise “Dólar &lt;b&gt;sobe&lt;/b&gt;”' }), 'Atividade: "sua análise “…”" no lugar de "seu post" (com o título escapado)');

  // ===== 9. stories: notícias primeiro, depois os amigos; selo em quem publicou notícia
  await ev(A, async () => { await pubCarregar(); go('feed'); renderSecs() }); await sleep(600);
  const tr = await ev(A, () => { const k = [...document.querySelectorAll('#secs > *')].map(e => e.matches('[data-meustory]') ? 'eu' : e.matches('[data-5min]') ? '5' : e.matches('[data-ultimas]') ? 'ult' : e.matches('[data-ustory]') ? 'u:' + nomeDe(e.dataset.ustory).split(' ')[0] + (e.querySelector('.fc107-stn') ? '+' : '') : e.matches('[data-sec-story]') ? 'sec' : 'x'); return k.slice(0, 6).join(',') });
  ok(/^eu,5,ult,u:(Carla,u:Bia\+|Bia\+,u:Carla),sec/.test(tr), 'stories: seu story, Em 5 min, Últimas, depois os amigos; selo de notícia só em quem publicou notícia', tr);
  await A.screenshot({ path: SH + 't-stories.png', clip: { x: 0, y: 0, width: 390, height: 240 } });

  // ===== 10. cartão de texto: prévia inteira acima da folha
  await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer .ce-rail'), null, 6000); await sleep(600);
  await clk(A, '[data-fc105txt]'); await sleep(300); await A.keyboard.type('Reforma tributária: o que muda'); await sleep(900);
  const pv = await ev(A, () => { const cv = document.querySelector('#ce-cv').getBoundingClientRect(), p = document.querySelector('#layer .fc105-cs .ce-selp').getBoundingClientRect(); return { k: document.querySelector('#ce-cv').classList.contains('fc107-mini'), fundo: cv.bottom <= p.top + 1, topo: cv.top >= 0, w: Math.round(cv.width) } });
  ok(pv.k && pv.fundo && pv.topo && pv.w > 80, 'cartão de texto: a prévia encolhe e aparece inteira acima da folha', JSON.stringify(pv));
  await A.screenshot({ path: SH + 't-cartao.png' });
  await clk(A, '[data-fc105csx]'); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#ce-cv')?.classList.contains('fc107-mini') && !document.querySelector('#ce-cv')?.style.transform), 'cancelar o cartão devolve o story ao tamanho normal');
  await fecha(A); await sleep(300);

  ok(![A, B, C].some(P => P._erros.length), 'sem erros ' + [A, B, C].map(P => P._erros.join('|')).join(' / '));
  await b.close(); srv.kill(); const R = U.resumo(); console.log(`\nRESUMO t_foco_noticia2: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
