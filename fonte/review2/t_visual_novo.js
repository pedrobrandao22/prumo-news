// Visual novo (112), o único desde 13/11 (a chave e os cartões B/C saíram).
// Cartões verticais no topo (com respiro entre eles), sem barra de chips, notícia e post iguais aos de hoje com o botão Repostar,
// Repostar / Repostar com comentário (com a regra de privacidade), perfil no estilo do X, nomes "Giro" e "Coleções".
// A: ações em texto com ícone pequeno e número, toque ≥ 40px, manchete do Feed menor que a da matéria, foto de amigo arredondada e sem fios.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8948, BASE = `http://localhost:${PORTA}/index.html`;
const SH = __dirname + '/../qa/s2/vn-'; require('fs').mkdirSync(__dirname + '/../qa/s2', { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim', 'visual']) localStorage.setItem('prumo-teste-' + k, '1'); } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
const feed = P => ev(P, async () => { if (document.querySelector('#layer').innerHTML) closeLayer(); await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
const recarrega = async P => { await P.reload(); await esperar(P, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200); await ev(P, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  for (const P of [A, B, C]) await flags(P);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  for (const P of [A, B]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  const uidA = await ev(A, () => S.uid), uidB = await ev(B, () => S.uid);
  const now = Date.now();
  const [pPedro] = await ins(A, [{ tipo: 'post', at: now - 30 * 60e3, texto: 'Fila no posto desde cedo. Organização boa, mas faltam senhas.', fotos: [], estilo: { v: 2 } }]);
  const [pBia] = await ins(B, [{ tipo: 'post', at: now - 25 * 60e3, texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro.', fotos: [], estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo' } } },
    { tipo: 'story', at: now - 10 * 60e3, expira: now + 20 * 3600e3, texto: 'Fila enorme', fotos: [], estilo: { v: 2, fundo: 3, itens: [{ t: 'texto', tx: 'Fila enorme', x: .5, y: .5, s: 1, r: 0, f: 'forte', cor: '#ffffff' }] } }]);

  // ===== 1. visual novo é o único: cartão A (Jornal) no Feed
  await feed(A); await sleep(600);
  ok(await ev(A, () => VISUAL_NOVO && VN112_CT === 'a' && document.documentElement.classList.contains('vn') && document.documentElement.classList.contains('vn-ca') && !document.querySelector('[data-vntroca]')), 'visual novo ligado sempre, cartão A, sem a chave de troca');

  // ===== 4. topo: cartões verticais
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); PF_ABA = 'posts' }); await feed(A); await sleep(700);
  const tl = await ev(A, () => { const bs = [...document.querySelectorAll('#secs > .sb.ig-s')].filter(b => b.getClientRects().length); const r = bs.map(b => { const t = b.querySelector('.vn-tl'), q = t && t.getBoundingClientRect(); return { t: !!t, k: b.dataset.secStory ? 'sec' : b.dataset.ustory ? 'u' : b.hasAttribute('data-5min') ? '5' : b.hasAttribute('data-ultimas') ? 'ult' : b.hasAttribute('data-meustory') ? 'eu' : '?', ar: q ? q.height / q.width : 0, tx: t ? t.querySelector('.vn-tl-tx').textContent : '', av: !!(t && t.querySelector('.vn-tl-av .av')), lbl: b.getAttribute('aria-label') } }); return r });
  ok(tl.length >= 4 && tl.every(x => x.t && Math.abs(x.ar - 4 / 3) < .06), 'topo: cada bolinha virou um cartão vertical 3:4', JSON.stringify(tl.map(x => x.k + ':' + x.ar.toFixed(2))));
  ok(tl.find(x => x.k === 'sec' && x.tx.length > 20) && tl.find(x => x.k === 'u' && x.av) && tl.find(x => x.k === '5' && /5 minutos/.test(x.tx)), 'cartões com manchete sobre a arte; o do amigo tem o avatar no canto', JSON.stringify(tl.slice(0, 5)));
  ok(tl.find(x => x.k === 'eu' && /Seu giro/.test(x.tx) && x.lbl === 'Criar giro') && tl.find(x => x.k === 'u' && /^Giro de Bia/.test(x.lbl)), 'nomes: "Seu giro", "Criar giro", "Giro de Bia…" (stories viram Giro)', JSON.stringify(tl.filter(x => x.k === 'eu' || x.k === 'u')));
  const esp = await ev(A, () => { const r = [...document.querySelectorAll('#secs > .sb.ig-s .vn-tl')].map(t => t.getBoundingClientRect()); const box = document.querySelector('#secs'); return { gaps: r.slice(1, 4).map((q, i) => Math.round(q.left - r[i].right)), x0: Math.round(r[0].left - box.getBoundingClientRect().left + box.scrollLeft), snap: getComputedStyle(box).scrollSnapType, gut: getComputedStyle(document.querySelector('#posts .ph')).paddingLeft } });
  ok(esp.gaps.length >= 3 && esp.gaps.every(g => g >= 8) && esp.x0 === parseInt(esp.gut) && /x/.test(esp.snap), 'Giro: respiro entre os cartões (≥ 8px), o primeiro alinhado ao recuo de 16px do Feed, rolagem com encaixe', JSON.stringify(esp));
  const visto = await ev(A, () => { const s = [...document.querySelectorAll('#secs [data-sec-story]')]; return s.map(b => b.classList.contains('vn-visto')) });
  ok(visto.some(v => !v), 'cartões não vistos têm a borda de destaque', JSON.stringify(visto));
  await clk(A, '#secs [data-sec-story]'); ok(await esperar(A, () => !!document.querySelector('#layer .story'), null, 4000), 'tocar no cartão abre o mesmo visualizador de stories');
  await ev(A, () => closeLayer()); await sleep(400);

  // ===== 5. sem barra de chips: o filtro de cima do Feed continua como hoje (com o aviso "Política · Ver tudo")
  ok(await ev(A, () => !document.querySelector('#vn-chips, .vn-chip')), 'não há barra de chips (Tudo · Amigos · Política…)');
  await ev(A, () => { FILTRO = 'politica'; renderPosts() }); await sleep(400);
  const fl = await ev(A, () => { const h = document.querySelector('#posts .sech'); return h && { d: getComputedStyle(h).display, t: h.textContent.replace(/\s+/g, ' ').trim() } });
  ok(fl && fl.d !== 'none' && /Política/.test(fl.t), 'filtrar por Política mostra o aviso do filtro como antes', JSON.stringify(fl));
  await ev(A, () => { FILTRO = 'tudo'; renderPosts() }); await sleep(300);
  await A.screenshot({ path: SH + 'feed-topo.png' });


  // ===== 7. Repostar e Repostar com comentário (Bia → post do Pedro)
  await feed(B); await sleep(600);
  await clk(B, `[id="p-u:${pPedro}"] [data-vnrp]`); await esperar(B, () => !!document.querySelector('#layer [data-vnrpja]'), null, 3000);
  ok(await ev(B, () => document.querySelector('#layer .sheet .sh-h')?.firstChild?.textContent === 'Repostar' && !!document.querySelector('#layer [data-vnrpcom]')), 'tocar em Repostar abre "Repostar" e "Repostar com comentário"');
  await clk(B, '#layer [data-vnrpja]'); await esperar(B, id => pubVisiveis().some(x => x.autor === S.uid && x.estilo.rp && x.estilo.rp.id === id), pPedro, 8000); await sleep(800);
  const rp1 = await ev(B, id => { const x = pubVisiveis().find(x => x.autor === S.uid && x.estilo.rp && x.estilo.rp.id === id); return x && { tx: x.texto, rp: x.estilo.rp, snap: x.snap, fotos: x.fotos.length, pid: x.pid } }, pPedro);
  ok(rp1 && rp1.tx === '' && rp1.rp.k === 'pub' && !rp1.snap && !rp1.pid && !rp1.fotos, 'repost é um post comum com estilo.rp={k:"pub",id}, sem copiar o conteúdo do original', JSON.stringify(rp1));
  await feed(B); await sleep(500);
  await clk(B, `[id="p-u:${pPedro}"] [data-vnrp]`); await esperar(B, () => !!document.querySelector('#layer [data-vnrpcom]'), null, 3000);
  ok(await ev(B, () => !!document.querySelector('#layer [data-vnrpdes]') && !document.querySelector('#layer [data-vnrpja]')), 'quem já repostou vê "Desfazer repost"');
  await clk(B, '#layer [data-vnrpcom]'); await esperar(B, () => !!document.querySelector('#layer #vn-rpt'), null, 3000); await sleep(300);
  ok(await ev(B, () => /Fila no posto/.test(document.querySelector('#layer .vn-rpprev .vn-q').textContent) && document.activeElement && document.activeElement.id === 'vn-rpt'), 'com comentário: o composer mostra a publicação citada e já foca o campo');
  await B.fill('#vn-rpt', 'Aqui no meu bairro também: fila desde as 6h.'); await clk(B, '#layer [data-vnrppub]');
  await esperar(B, () => pubVisiveis().some(x => x.autor === S.uid && x.estilo.rp && x.texto), null, 8000); await sleep(800);
  // Pedro vê os dois e é avisado
  await feed(A); await sleep(800);
  const va = await ev(A, () => { const l = [...document.querySelectorAll('#posts .upost.vn-rp')]; return l.map(e => ({ so: e.classList.contains('vn-rp-so'), q: e.querySelector('.vn-q')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 90), tx: e.querySelector('.vn-rptx')?.textContent || '', sub: e.querySelector('.ph-sub')?.textContent || '' })) });
  ok(va.length === 1 && /Fila no posto/.test(va[0].q) && !va[0].so && /bairro/.test(va[0].tx), 'Pedro vê no Feed a citação com o comentário da Bia, com o post dele dentro (o repost sem comentário não vira item à parte: 122)', JSON.stringify(va));
  const cnt = await ev(A, id => { const l = document.querySelectorAll(`#posts [id="p-u:${id}"]`), e = l[0]; return { n: l.length, l: e.querySelector(':scope>.dc122-rpl')?.textContent.trim() || '', q: e.querySelector('[data-vnrpq]')?.textContent || '', ab: e.querySelector('[data-vnrpq]')?.previousElementSibling?.hasAttribute('data-likes') } }, pPedro);
  ok(cnt.n === 1 && cnt.l === 'Bia repostou' && /^Bia Souza repostou$/.test(cnt.q) && cnt.ab, 'o post do Pedro aparece uma vez, com "Bia repostou" em cima (122); a linha de baixo continua no lugar (escondida no Feed)', JSON.stringify(cnt));
  const at = await ev(A, () => atItens().filter(x => x.acao === 'vnrp').map(x => x.txt.replace(/<[^>]+>/g, '')));
  ok(at.length === 1 && /^Bia Souza repostou e comentou seu post: “Aqui no meu bairro/.test(at[0]), 'Atividade do Pedro: um item só, "Bia Souza repostou e comentou seu post: “…”" (130)', JSON.stringify(at));
  await ev(A, () => abrirAtividade()); await sleep(600);
  ok(await ev(A, () => [...document.querySelectorAll('#layer .pfv-at .at-tx')].filter(e => /Bia Souza repostou e comentou seu post/.test(e.textContent)).length === 1), 'o aviso aparece (uma vez) na tela de Atividade');
  await A.screenshot({ path: SH + 'atividade.png' }); await ev(A, () => closeLayer()); await sleep(300);
  await ev(A, () => { const e = document.querySelector('#posts .upost.vn-rp:not(.vn-rp-so)'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120) }); await sleep(300); await A.screenshot({ path: SH + 'citacao.png' });
  // tocar no cartão citado abre a publicação
  await clk(A, '#posts .upost.vn-rp .vn-q[data-vnqpub]'); ok(await esperar(A, id => !!document.querySelector(`#layer .pfv [id="p-u:${id}"]`), pPedro, 4000), 'tocar no cartão citado abre a publicação original');
  await ev(A, () => closeLayer()); await sleep(300);
  // Pedro reposta uma notícia
  const pid = await ev(A, () => document.querySelector('#posts > .post:not(.upost) [data-vnrp^="pauta:"]').closest('.post').dataset.pid);
  await clk(A, `#posts > .post[data-pid="${pid}"] [data-vnrp]`); await esperar(A, () => !!document.querySelector('#layer [data-vnrpja]'), null, 3000); await clk(A, '#layer [data-vnrpja]');
  ok(await esperar(A, p => pubVisiveis().some(x => x.autor === S.uid && x.estilo.rp && x.estilo.rp.k === 'pauta' && x.estilo.rp.id === p && x.snap && x.snap.titulo), pid, 8000), 'repostar notícia: estilo.rp={k:"pauta"} com o título guardado (snap)');

  // ===== 8. privacidade: Carla é amiga só da Bia
  await criar(C, { url: await convite(B), nome: 'Carla Mendes', email: 'c@x.com' });
  await ev(C, () => { localStorage.setItem('prumo-visual', 'novo') }); await recarrega(C);
  const amC = await ev(C, ([a, b]) => ({ a: S.amigos.has(a), b: S.amigos.has(b) }), [uidA, uidB]);
  ok(!amC.a && amC.b, 'Carla é amiga da Bia e não do Pedro', JSON.stringify(amC));
  await feed(C); await sleep(1500);
  const vc = await ev(C, () => { const l = [...document.querySelectorAll('#posts .upost.vn-rp')]; return { n: l.length, stub: l.map(e => e.querySelector('.vn-q0 b')?.textContent || ''), vaza: /Fila no posto/.test(document.body.innerText) || /Fila no posto/.test(document.querySelector('#posts').innerHTML) } });
  ok(vc.n === 1 && vc.stub.every(s => s === 'Publicação indisponível') && !vc.vaza, 'Carla vê a citação da Bia com "Publicação indisponível" no lugar do post do Pedro (nada do texto dele vaza); o repost sem comentário não aparece para ela (122)', JSON.stringify(vc));
  ok(await ev(C, () => /bairro/.test(document.querySelector('#posts').textContent)), 'o comentário da própria Bia continua visível para a Carla');
  await ev(C, () => { const e = document.querySelector('#posts .upost.vn-rp .vn-q0'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160) }); await sleep(300); await C.screenshot({ path: SH + 'indisponivel.png' });
  const bloq = await ev(C, id => { vn112Menu('pub', id); return new Promise(r => setTimeout(() => r({ sh: !!document.querySelector('#layer [data-vnrpja]'), t: document.querySelector('.toast')?.textContent || '' }), 400)) }, pPedro);
  ok(!bloq.sh && /não está disponível/.test(bloq.t), 'Carla não consegue repostar o que não pode ver', JSON.stringify(bloq));

  // ===== 9. perfil no estilo do X
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(800);
  const pf = await ev(A, () => { const h = document.querySelector('#v-me .vn-pf'); return h && { band: !!h.querySelector('.vn-pf-band'), av: !!h.querySelector('.vn-pf-row .pf-av'), nome: h.querySelector('.vn-pf-nome')?.textContent, desde: h.querySelector('.vn-pf-desde')?.textContent, num: h.querySelector('.vn-pf-num')?.textContent.replace(/\s+/g, ' ').trim(), abas: [...document.querySelectorAll('#v-me .vn-abas [role=tab]')].map(b => b.textContent || b.getAttribute('aria-label')), lista: document.querySelectorAll('#v-me .vn-pl > .post').length, grade: !!document.querySelector('#v-me .pf-grade'), rot: [...document.querySelectorAll('#v-me .vn-pl .ph-nm b')].length } });
  ok(pf && pf.band && pf.av && pf.nome === 'Pedro Brandão' && /^No Prumo desde \S+ de \d{4}$/.test(pf.desde) && /1 amigo/.test(pf.num) && /publicaç/.test(pf.num), 'perfil: faixa, avatar sobreposto, nome, "No Prumo desde <mês> de <ano>", amigos e publicações', JSON.stringify(pf));
  ok(pf && pf.abas.slice(0, 3).join() === 'Posts,Respostas,Mídia' && pf.abas.includes('Conta e ajustes') && pf.lista >= 2 && !pf.grade, 'abas Posts · Respostas · Mídia (e Conta); Posts em lista, não em grade', JSON.stringify(pf && pf.abas));
  await A.screenshot({ path: SH + 'perfil.png' });
  await clk(A, '#v-me [data-vnpfaba="resp"]'); await sleep(400);
  ok(await ev(A, () => document.querySelector('#v-me .vn-abas [aria-selected=true]')?.textContent === 'Respostas' && !!document.querySelector('#v-me .vn-resp, #v-me .pf-vz')), 'aba Respostas');
  await clk(A, '#v-me [data-vnpfaba="conta"]'); await sleep(400);
  ok(await ev(A, () => PF_ABA === 'conta' && [...document.querySelectorAll('#v-me .pf-conta button')].some(b => /Arquivo de giros/.test(b.textContent))), 'aba Conta com "Arquivo de giros"');
  await ev(A, u => abrirPerfil(u), uidB); await sleep(1000);
  const pb = await ev(A, () => { const s = document.querySelector('#layer .pfv-sc'); return s && { cab: !!s.querySelector('.vn-pf .vn-pf-band'), msg: !!s.querySelector('.vn-pf [data-pfmsg]'), ring: !!s.querySelector('.vn-pf .pf-av.ring'), chips: !!s.querySelector('.fc107-pk'), lista: s.querySelectorAll('.vn-pl > .post').length, abas: [...s.querySelectorAll('.vn-abas [role=tab]')].map(b => b.textContent) } });
  ok(pb && pb.cab && pb.msg && pb.ring && pb.chips && pb.lista >= 3 && pb.abas.join() === 'Posts,Respostas,Mídia', 'perfil de amiga: mesmo cabeçalho (Mensagem, anel do giro), chips de contribuição do Foco e lista', JSON.stringify(pb));
  await A.screenshot({ path: SH + 'perfil-amiga.png' });
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 9b. larguras de celular (360 e 430): nada passa da tela
  const larg = [];
  for (const w of [360, 430]) {
    await A.setViewportSize({ width: w, height: 800 }); await sleep(300);
    await feed(A); await sleep(500); const f = await ev(A, () => document.documentElement.scrollWidth);
    await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(500); const p = await ev(A, () => document.documentElement.scrollWidth);
    larg.push([w, f, p]) }
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(200);
  ok(larg.every(([w, f, p]) => f <= w && p <= w), 'em 360 e 430 px de largura, Feed e Perfil sem rolagem para o lado', JSON.stringify(larg));
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => [...document.querySelectorAll('#layer [data-edmodo]')].map(e => e.textContent.trim().toUpperCase()).includes('GIRO')), 'na criação, o modo "Story" aparece como "Giro"');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; go('feed') }); await sleep(300);

  // ===== 9d. A como padrão: ações com ícone e número, toque ≥ 40px, gostei/comentar/repostar/guardar, foto de amiga, manchete
  await ev(B, async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i); const p = await pubSobe(new Blob([u], { type: 'image/jpeg' }));
    await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', at: Date.now() - 2 * 60e3, texto: 'Fila para votar na escola do bairro às 8h.', fotos: [p], estilo: { v: 2 } }); await pubCarregar() }, require('fs').readFileSync(__dirname + '/etapa13/foto.jpg').toString('base64'));
  await recarrega(A); await feed(A); await sleep(900);
  ok(await ev(A, () => !!document.querySelector('#posts > .post.vn-ca.vn-cn')), 'o Feed abre no cartão A');
  const NT = '#posts > .post.vn-cn:not(.fc107-junto)';
  const acA = await ev(A, sel => { const e = document.querySelector(sel); const vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
    const bt = { like: e.querySelector('.acts [data-a="like"]'), cmt: e.querySelector('.acts [data-a="cmt"]'), rp: e.querySelector('.acts [data-vnrp]'), send: e.querySelector('.acts [data-a="send"]'), save: e.querySelector('.acts [data-a="save"]') };
    const o = {}; for (const [k, b] of Object.entries(bt)) { const r = b.getBoundingClientRect(), ic = b.querySelector('.ico'); o[k] = { h: Math.round(r.height), w: Math.round(r.width), ic: vis(ic) ? Math.round(ic.getBoundingClientRect().width) : 0, tx: vis(b.querySelector(':scope>span')) ? b.querySelector(':scope>span').textContent : '', dentro: r.left >= 0 && r.right <= innerWidth } } return o }, NT);
  ok(['like', 'cmt', 'rp'].every(k => acA[k].ic >= 16 && acA[k].ic <= 20) && acA.cmt.tx === 'Comentar' && acA.rp.tx === 'Repostar' && acA.send.ic >= 20 && acA.save.ic >= 20 && !acA.send.tx && !acA.save.tx, 'A: ícone pequeno ao lado de Gostei, Comentar e Repostar (em texto); Enviar e Guardar em ícone', JSON.stringify(acA));
  ok(Object.values(acA).every(x => x.h >= 40 && x.w >= 36 && x.dentro), 'A: toda ação com área de toque ≥ 40px de altura e dentro da tela', JSON.stringify(acA));
  // gostei: fica marcado e mostra o número
  const pidNt = await ev(A, sel => document.querySelector(sel).dataset.pid, NT);
  await clk(A, `#posts > .post[data-pid="${pidNt}"] .acts [data-a="like"]`);
  ok(await esperar(A, p => { const b = document.querySelector(`#posts > .post[data-pid="${p}"] .acts [data-a="like"]`); return b && b.classList.contains('on') && b.getAttribute('aria-pressed') === 'true' && b.querySelector('.cnt').textContent === '1' && getComputedStyle(b.querySelector('.cnt')).display !== 'none' }, pidNt, 5000), 'A: tocar em Gostei marca (aceso) e mostra "1" ao lado do ícone');
  // comentar: abre a folha; o número aparece depois de comentar
  await clk(A, `#posts > .post[data-pid="${pidNt}"] .acts [data-a="cmt"]`); ok(await esperar(A, () => !!document.querySelector('#ctext'), null, 4000), 'A: Comentar abre os comentários');
  await A.fill('#ctext', 'Comentário pelo cartão A'); await A.keyboard.press('Enter'); await sleep(1200); await ev(A, () => closeLayer()); await sleep(400);
  ok(await esperar(A, p => document.querySelector(`#posts > .post[data-pid="${p}"] .acts [data-a="cmt"] .cnt`)?.textContent === '1', pidNt, 6000), 'A: depois de comentar, "Comentar 1"');
  // repostar: o número de reposts do post do Pedro (a Bia repostou duas vezes) e a folha
  ok(await ev(A, id => document.querySelector(`[id="p-u:${id}"] .acts [data-vnrp] .cnt`)?.textContent === '2', pPedro), 'A: "Repostar 2" no post do Pedro');
  await clk(A, `#posts > .post[data-pid="${pidNt}"] .acts [data-vnrp]`); ok(await esperar(A, () => !!document.querySelector('#layer [data-vnrpcom]'), null, 3000), 'A: Repostar abre a folha'); await ev(A, () => closeLayer()); await sleep(300);
  // guardar
  await clk(A, `#posts > .post[data-pid="${pidNt}"] .acts [data-a="save"]`);
  ok(await esperar(A, p => !!S.salvos[p] && document.querySelector(`#posts > .post[data-pid="${p}"] .acts [data-a="save"]`).getAttribute('aria-pressed') === 'true', pidNt, 4000), 'A: Guardar guarda a notícia');
  await clk(A, `#posts > .post[data-pid="${pidNt}"] .acts [data-a="save"]`); await sleep(400); await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });
  // foto de amiga: cantos arredondados, sem fios; a arte da notícia continua entre fios
  const fo = await ev(A, sel => { const f = [...document.querySelectorAll('#posts .upost.vn-cp')].find(e => e.querySelector(':scope>.car .up-img')); const n = document.querySelector(sel + ' > .car'); if (!f) return null; const c = getComputedStyle(f.querySelector(':scope>.car')), cn = getComputedStyle(n);
    return { r: parseFloat(c.borderTopLeftRadius), br: parseFloat(c.borderBottomRightRadius), b: [c.borderTopWidth, c.borderBottomWidth, c.borderLeftWidth, c.borderRightWidth].map(parseFloat), nota: getComputedStyle(f.querySelector('.vn-txt'), '::before').content, nt: [parseFloat(cn.borderTopWidth), parseFloat(cn.borderBottomWidth)] } }, NT);
  ok(fo && fo.r >= 10 && fo.r <= 14 && fo.br >= 10 && fo.b.every(x => x === 0) && fo.nota === 'none' && fo.nt[0] >= 2 && fo.nt[1] >= 1, 'A: foto da amiga com cantos arredondados e sem fios (nome primeiro e o texto corrido, sem a aspa: 122); a arte da notícia segue entre fios', JSON.stringify(fo));
  // manchete do Feed menor que a da matéria; linha fina em até 2 linhas
  const ma = await ev(A, sel => { const e = document.querySelector(sel), b = e.querySelector('.vn-tit button'), c = e.querySelector('.pt-cap-t'), lh = parseFloat(getComputedStyle(c).lineHeight); return { fs: parseFloat(getComputedStyle(b).fontSize), cap: c.getBoundingClientRect().height <= lh * 2 + 2, h: Math.round(e.getBoundingClientRect().height) } }, NT);
  await clk(A, NT + ' .vn-tit button'); await esperar(A, () => !!document.querySelector('.mat-tx h1'), null, 5000); await sleep(400);
  ma.mat = await ev(A, () => parseFloat(getComputedStyle(document.querySelector('.mat-tx h1')).fontSize)); await ev(A, () => closeLayer()); await sleep(400);
  ok(ma.fs > 0 && ma.mat > 0 && ma.fs < ma.mat && ma.fs <= 22 && ma.cap, 'A: manchete do Feed menor que a da matéria; linha fina em até duas linhas', JSON.stringify(ma));
  for (const w of [360, 390, 430]) { await A.setViewportSize({ width: w, height: 800 }); await feed(A); await sleep(400);
    const r = await ev(A, sel => ({ sw: document.documentElement.scrollWidth, d: [...document.querySelectorAll('#posts .post.vn-c .acts > .act')].filter(b => getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height).every(b => b.getBoundingClientRect().right <= innerWidth + .5), x: [...document.querySelectorAll('#posts .post.vn-c .acts')].filter(a => [...a.children].some(b => b.getBoundingClientRect().right > innerWidth + .5)).slice(0, 3).map(a => [a.closest('.post').className, Math.round(a.getBoundingClientRect().left), Math.round(a.getBoundingClientRect().width), [...a.children].filter(b => getComputedStyle(b).display !== 'none').map(b => (b.dataset.a || b.className) + ':' + Math.round(b.getBoundingClientRect().width) + ':' + b.textContent.trim())]) }), NT);
    ok(r.sw <= w && r.d, `A em ${w}px: sem rolagem para o lado e as ações cabem na linha`, JSON.stringify(r));
    const r2 = await ev(A, () => { const l = [...document.querySelectorAll('#posts .post.vn-c .acts')]; l.forEach(a => { a.querySelectorAll('.act .cnt').forEach(c => { c.textContent = '88' }); vn112Aperta(a.closest('.post')) });
      const corta = l.filter(a => [...a.querySelectorAll(':scope>.act>span')].some(s => s.offsetWidth && s.scrollWidth > s.clientWidth + 1)).length;
      const ruim = l.filter(a => ![...a.children].filter(b => getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height).every(b => b.getBoundingClientRect().right <= innerWidth + .5));
      return { n: ruim.length, corta, x: ruim.slice(0, 2).map(a => [a.closest('.post').className, Math.round(a.getBoundingClientRect().left), Math.round(a.getBoundingClientRect().width), [...a.children].filter(b => getComputedStyle(b).display !== 'none').map(b => (b.dataset.a || b.className) + ':' + Math.round(b.getBoundingClientRect().width))]) } });
    ok(!r2.n && (w < 390 || !r2.corta), `A em ${w}px: as ações cabem mesmo com números de dois dígitos${w < 390 ? '' : ' (sem cortar os rótulos)'}`, JSON.stringify(r2)) }
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(200);
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });

  // ===== 10. modo escuro
  const D = U.erros(await H.pagina(b, { dark: true }), 'D'); await flags(D);
  await D.goto(BASE); await sleep(1500);
  await ev(D, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); go('feed') }); await sleep(800);
  const dk = await ev(D, () => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const t = document.querySelector('#secs .vn-tl-tx b');
    return { vn: VISUAL_NOVO, bg: lum(getComputedStyle(document.body).backgroundColor), tile: t ? lum(getComputedStyle(t).color) : -1, chips: !!document.querySelector('.vn-chip') } });
  ok(dk.vn && dk.bg < .2 && dk.tile > .9 && !dk.chips, 'modo escuro: fundo escuro e texto dos cartões do Giro branco', JSON.stringify(dk));
  const dka = await ev(D, () => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const n = document.querySelector('#posts .vn-cn'); const c = n && n.querySelector('.acts [data-a="cmt"]');
    return { ct: VN112_CT, tit: n ? lum(getComputedStyle(n.querySelector('.vn-tit button')).color) : -1, cmt: c ? lum(getComputedStyle(c).color) : -1, ico: c ? getComputedStyle(c.querySelector('.ico')).display : '' } });
  ok(dka.ct === 'a' && dka.tit > .7 && dka.cmt > .6 && dka.ico !== 'none', 'modo escuro, cartão A padrão: manchete e ações claras, com ícone', JSON.stringify(dka));
  await D.screenshot({ path: SH + 'escuro.png' });


  const errs = [A, B, C, D].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
