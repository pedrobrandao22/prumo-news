// Visual novo (112), atrás da chave: liga por ?visual=novo, por localStorage e pela linha em Perfil › Conta; com a chave desligada nada aparece.
// Ligado: cartões verticais no topo (com respiro entre eles), sem barra de chips, notícia e post iguais aos de hoje com o botão Repostar,
// Repostar / Repostar com comentário (com a regra de privacidade), perfil no estilo do X, nomes "Giro" e "Coleções".
// Em teste: as três direções do cartão (?cartao=a|b|c, localStorage "prumo-cartao"). Roda com as flags de produção (foco, sem Reels, Capa, animações) e "prumo-teste-visual".
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8948, BASE = `http://localhost:${PORTA}/index.html`;
const SH = __dirname + '/../qa/s2/vn-'; require('fs').mkdirSync(__dirname + '/../qa/s2', { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim', 'visual']) localStorage.setItem('prumo-teste-' + k, '1'); if (localStorage.getItem('prumo-visual') === null) localStorage.setItem('prumo-visual', 'atual') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
const feed = P => ev(P, async () => { if (document.querySelector('#layer').innerHTML) closeLayer(); await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
const recarrega = async P => { await P.reload(); await esperar(P, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200); await ev(P, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }) };
// o que só existe com o visual novo
const marcas = P => ev(P, () => ({ vn: document.documentElement.classList.contains('vn'), chips: !!document.querySelector('#vn-chips, .vn-chip'), tiles: document.querySelectorAll('#secs .vn-tl').length, rp: document.querySelectorAll('#posts [data-vnrp]').length, x: document.querySelectorAll('#posts .vn-c, #posts .vn-x').length, tit: document.querySelectorAll('#posts .vn-tit').length }));
// "assinatura" de um cartão: as tags e classes em ordem, sem o que é do repost (para comparar o cartão de hoje com e sem a chave)
const assina = (P, id) => ev(P, id => { const e = document.getElementById(id); if (!e) return null; const c = e.cloneNode(true); c.querySelectorAll('[data-vnrp],[data-vnrpq]').forEach(x => x.remove());
  return [c, ...c.querySelectorAll('*')].map(x => x.tagName + '.' + [...x.classList].filter(k => !/^(on|saved|visto|vn-cap-.*)$/.test(k)).sort().join('.')).join(' ') }, id);
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

  // ===== 1. chave desligada por padrão: nada do visual novo
  await feed(A); await sleep(600);
  let m = await marcas(A);
  ok(!(await ev(A, () => VISUAL_NOVO)) && !m.vn && !m.chips && !m.tiles && !m.rp && !m.x && !m.tit, 'escolhido "atual": sem cartões, chips, repost nem layout do X', JSON.stringify(m));
  ok(await ev(A, () => VISUAL_PADRAO === 'novo' && localStorage.getItem('prumo-visual') === 'atual'), 'padrão agora é o visual novo; quem escolheu "atual" fica no atual');
  const idNt = await ev(A, () => document.querySelector('#posts > .post:not(.upost)').id), idPp = 'p-u:' + pPedro;
  const sigOff = { nt: await assina(A, idNt), pp: await assina(A, idPp), bia: await assina(A, 'p-u:' + pBia) };
  await ev(A, () => { go('me'); renderMe() }); await sleep(500);
  ok(await ev(A, () => !document.querySelector('.vn-pf') && !!document.querySelector('#v-me .pf-grade, #v-me .pf-vz')), 'desligado: perfil continua em grade (sem o cabeçalho do X)');
  await ev(A, () => { PF_ABA = 'conta'; renderMe() }); await sleep(300);
  const rowA = await ev(A, () => { const b = document.querySelector('[data-vntroca]'); return b && { t: b.textContent.trim(), ch: b.getAttribute('aria-checked'), role: b.getAttribute('role') } });
  ok(rowA && rowA.t === 'Visual novo (teste)' && rowA.ch === 'false' && rowA.role === 'switch', 'Perfil › Conta: o administrador vê "Visual novo (teste)" desligado (role=switch)', JSON.stringify(rowA));
  await ev(B, () => { localStorage.removeItem('prumo-visual'); go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300);
  ok(await ev(B, () => !document.querySelector('[data-vntroca]')), 'quem não é administrador e nunca ligou não vê a linha');

  // ===== 2. ligar pela URL (?visual=novo): guarda a escolha e limpa o endereço
  await B.goto(BASE + '?visual=novo'); await esperar(B, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200);
  const u = await ev(B, () => ({ on: VISUAL_NOVO, ls: localStorage.getItem('prumo-visual'), q: location.search, vn: document.documentElement.classList.contains('vn') }));
  ok(u.on && u.ls === 'novo' && u.q === '' && u.vn, '?visual=novo liga, guarda "novo" no aparelho e tira o parâmetro do endereço', JSON.stringify(u));
  await ev(B, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(400);
  ok(await ev(B, () => document.querySelector('[data-vntroca]')?.getAttribute('aria-checked') === 'true'), 'depois de ligar uma vez, a linha aparece também para quem não é administrador (ligada)');
  await recarrega(B); ok(await ev(B, () => VISUAL_NOVO), 'a escolha continua ligada depois de recarregar (localStorage "prumo-visual")');

  // ===== 3. ligar pela linha em Perfil › Conta (Pedro)
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300);
  await Promise.all([A.waitForNavigation({ timeout: 10000 }).catch(() => { }), clk(A, '[data-vntroca]')]);
  await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500);
  ok(await ev(A, () => VISUAL_NOVO && localStorage.getItem('prumo-visual') === 'novo'), 'tocar na linha liga o visual novo (a página recarrega)');

  // ===== 4. topo: cartões verticais
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); PF_ABA = 'posts' }); await feed(A); await sleep(700);
  const tl = await ev(A, () => { const bs = [...document.querySelectorAll('#secs > .sb.ig-s')]; const r = bs.map(b => { const t = b.querySelector('.vn-tl'), q = t && t.getBoundingClientRect(); return { t: !!t, k: b.dataset.secStory ? 'sec' : b.dataset.ustory ? 'u' : b.hasAttribute('data-5min') ? '5' : b.hasAttribute('data-ultimas') ? 'ult' : b.hasAttribute('data-meustory') ? 'eu' : '?', ar: q ? q.height / q.width : 0, tx: t ? t.querySelector('.vn-tl-tx').textContent : '', av: !!(t && t.querySelector('.vn-tl-av .av')), lbl: b.getAttribute('aria-label') } }); return r });
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

  // ===== 6. notícia e post iguais aos de hoje, só com o Repostar
  await feed(A); await sleep(500);
  const sigOn = { nt: await assina(A, idNt), pp: await assina(A, idPp), bia: await assina(A, 'p-u:' + pBia) };
  ok(sigOn.nt && sigOn.nt === sigOff.nt && sigOn.pp && sigOn.pp === sigOff.pp && sigOn.bia && sigOn.bia === sigOff.bia, 'com a chave ligada (sem cartão em teste), notícia, post próprio e post da amiga têm a mesma marcação de hoje (fora o Repostar)', JSON.stringify([sigOn.nt === sigOff.nt, sigOn.pp === sigOff.pp, (sigOn.pp || '').slice(0, 200), (sigOff.pp || '').slice(0, 200)]));
  const ord = id => ev(A, id => { const e = document.getElementById(id); return [...e.querySelectorAll('.acts > .act')].filter(b => getComputedStyle(b).display !== 'none').sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(b => b.dataset.a || (b.dataset.vnrp ? 'rp' : b.dataset.usend ? 'send' : '?')).join() }, id);
  const o1 = await ord(idPp), o2 = await ord(idNt);
  ok(o1 === 'like,cmt,send,rp,save' && o2 === 'like,cmt,send,rp,save', 'Repostar fica à direita, ao lado de Guardar (gostei · comentar · enviar … repostar · guardar), no post e na notícia', o1 + ' | ' + o2);
  const sobre = await ev(A, id => { const e = document.getElementById(id), d = e.querySelector('.pdots'), r = e.querySelector('[data-vnrp]'); if (!d) return 'sem pontinhos'; const a = d.getBoundingClientRect(), b = r.getBoundingClientRect(); return a.right <= b.left ? 'ok' : JSON.stringify([a.right, b.left]) }, idNt);
  ok(sobre === 'ok' || sobre === 'sem pontinhos', 'o botão não encosta nos pontinhos do carrossel', sobre);
  await ev(A, id => { const e = document.getElementById(id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120) }, idPp); await sleep(300); await A.screenshot({ path: SH + 'post-hoje.png' });

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
  ok(va.length === 2 && va.every(x => /Fila no posto/.test(x.q)) && va.some(x => x.so && /repostou/.test(x.sub)) && va.some(x => /bairro/.test(x.tx)), 'Pedro vê no Feed o repost ("repostou") e a citação com o comentário da Bia, os dois com o post dele dentro', JSON.stringify(va));
  const cnt = await ev(A, id => { const e = document.querySelector(`[id="p-u:${id}"]`); return { q: e.querySelector('[data-vnrpq]')?.textContent || '', ab: e.querySelector('[data-vnrpq]')?.previousElementSibling?.hasAttribute('data-likes') } }, pPedro);
  ok(/^Bia Souza repostou$/.test(cnt.q) && cnt.ab, 'o post do Pedro mostra "Bia Souza repostou" logo abaixo da linha de quem gostou', JSON.stringify(cnt));
  const at = await ev(A, () => atItens().filter(x => x.acao === 'vnrp').map(x => x.txt.replace(/<[^>]+>/g, '')));
  ok(at.length === 2 && at.every(t => /^Bia Souza repostou sua publicação/.test(t)), 'Atividade do Pedro: "Bia Souza repostou sua publicação" (as duas)', JSON.stringify(at));
  await ev(A, () => abrirAtividade()); await sleep(600);
  ok(await ev(A, () => [...document.querySelectorAll('#layer .pfv-at .at-tx')].some(e => /Bia Souza repostou sua publicação/.test(e.textContent))), 'o aviso aparece na tela de Atividade');
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
  ok(vc.n === 2 && vc.stub.every(s => s === 'Publicação indisponível') && !vc.vaza, 'Carla vê os posts da Bia, mas o post do Pedro aparece como "Publicação indisponível" (nada do texto dele vaza)', JSON.stringify(vc));
  ok(await ev(C, () => /bairro/.test(document.querySelector('#posts').textContent)), 'o comentário da própria Bia continua visível para a Carla');
  await ev(C, () => { const e = document.querySelector('#posts .upost.vn-rp .vn-q0'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 160) }); await sleep(300); await C.screenshot({ path: SH + 'indisponivel.png' });
  const bloq = await ev(C, () => { const b = document.querySelector('#posts .upost.vn-rp-so [data-vnrp]'); b.click(); return new Promise(r => setTimeout(() => r({ sh: !!document.querySelector('#layer [data-vnrpja]'), t: document.querySelector('.toast')?.textContent || '' }), 400)) });
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
  ok(await ev(A, () => PF_ABA === 'conta' && !!document.querySelector('#v-me .pf-conta [data-vntroca]') && [...document.querySelectorAll('#v-me .pf-conta button')].some(b => /Arquivo de giros/.test(b.textContent))), 'aba Conta: a chave e "Arquivo de giros"');
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

  // ===== 9c. as três direções do cartão (em teste), pela URL e pelo aparelho
  await A.goto(BASE + '?cartao=b'); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200);
  const cu = await ev(A, () => ({ ct: VN112_CT, ls: localStorage.getItem('prumo-cartao'), q: location.search, h: document.documentElement.classList.contains('vn-cb') }));
  ok(cu.ct === 'b' && cu.ls === 'b' && cu.q === '' && cu.h, '?cartao=b liga a direção B, guarda no aparelho e some do endereço', JSON.stringify(cu));
  for (const ct of ['a', 'b', 'c']) {
    await ev(A, c => localStorage.setItem('prumo-cartao', c), ct); await recarrega(A); await feed(A); await sleep(900);
    const r = await ev(A, () => { const nt = document.querySelector('#posts > .post.vn-cn'), q = document.querySelector('#posts .upost.vn-rp:not(.vn-rp-so)'), j = document.querySelector('#posts .fc107-junto');
      return { html: [...document.documentElement.classList].filter(k => /^vn-c/.test(k)), nt: !!(nt && nt.querySelector('.vn-tit button[data-capmat]') && nt.querySelector('.acts [data-vnrp^="pauta:"]') && nt.querySelector('[data-a="like"]') && nt.querySelector('[data-cmts]')), pp: document.querySelectorAll('#posts .upost.vn-cp').length, q: !!(q && q.classList.contains('vn-cp') && q.querySelector('.vn-q[data-vnqpub]') && /bairro/.test(q.textContent)), j: !j || j.classList.contains('vn-cp'), w: document.documentElement.scrollWidth } });
    ok(r.html.join() === 'vn-c' + ct && r.nt && r.pp >= 3 && r.q && r.j && r.w <= 390, `cartão ${ct.toUpperCase()}: notícia (manchete, Repostar), posts, citação com o original e o que os amigos acham, sem passar da tela`, JSON.stringify(r));
    await clk(A, '#posts .upost.vn-rp .vn-q[data-vnqpub]'); ok(await esperar(A, id => !!document.querySelector(`#layer .pfv [id="p-u:${id}"]`), pPedro, 4000), `cartão ${ct.toUpperCase()}: tocar na citação abre o original`); await ev(A, () => closeLayer()); await sleep(300);
    await clk(A, `[id="p-u:${pPedro}"] [data-vnrp]`); ok(await esperar(A, () => !!document.querySelector('#layer [data-vnrpcom]'), null, 3000), `cartão ${ct.toUpperCase()}: o botão Repostar abre a folha`); await ev(A, () => closeLayer()); await sleep(300);
    for (const w of [360, 430]) { await A.setViewportSize({ width: w, height: 800 }); await sleep(250); ok(await ev(A, w => document.documentElement.scrollWidth <= w, w), `cartão ${ct.toUpperCase()} em ${w}px sem rolagem para o lado`) }
    await A.setViewportSize({ width: 390, height: 844 }); await sleep(200);
    await ev(A, () => { const e = document.querySelector('#posts .upost.vn-rp:not(.vn-rp-so)'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 120) }); await sleep(300); await A.screenshot({ path: SH + 'cartao-' + ct + '.png' });
  }
  await A.goto(BASE + '?cartao=atual'); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200);
  ok(await ev(A, () => VN112_CT === '' && localStorage.getItem('prumo-cartao') === null && !document.querySelector('#posts .vn-c') && ![...document.documentElement.classList].some(k => /^vn-c/.test(k))), '?cartao=atual volta ao cartão de hoje');
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });

  // ===== 10. modo escuro
  const D = U.erros(await H.pagina(b, { dark: true }), 'D'); await flags(D);
  await D.addInitScript(() => { try { localStorage.setItem('prumo-visual', 'novo') } catch (e) { } });
  await D.goto(BASE); await sleep(1500);
  await ev(D, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); go('feed') }); await sleep(800);
  const dk = await ev(D, () => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const t = document.querySelector('#secs .vn-tl-tx b');
    return { vn: VISUAL_NOVO, bg: lum(getComputedStyle(document.body).backgroundColor), tile: t ? lum(getComputedStyle(t).color) : -1, chips: !!document.querySelector('.vn-chip') } });
  ok(dk.vn && dk.bg < .2 && dk.tile > .9 && !dk.chips, 'modo escuro: fundo escuro e texto dos cartões do Giro branco', JSON.stringify(dk));
  for (const ct of ['a', 'b', 'c']) { await ev(D, c => localStorage.setItem('prumo-cartao', c), ct); await D.reload(); await sleep(1500); await ev(D, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); go('feed') }); await sleep(600);
    const k = await ev(D, () => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const b = document.querySelector('#posts .vn-cn .vn-tit button'); return b ? lum(getComputedStyle(b).color) : -1 });
    ok(k > .7, `modo escuro, cartão ${ct.toUpperCase()}: manchete clara no fundo escuro`, String(k)) }
  await ev(D, () => localStorage.removeItem('prumo-cartao'));
  await D.screenshot({ path: SH + 'escuro.png' });

  // ===== 11. desligar pela Conta: tudo volta (o repost segue legível no visual atual)
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300);
  await Promise.all([A.waitForNavigation({ timeout: 10000 }).catch(() => { }), clk(A, '[data-vntroca]')]);
  await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500);
  await feed(A); await sleep(800); m = await marcas(A);
  ok(!(await ev(A, () => VISUAL_NOVO)) && await ev(A, () => localStorage.getItem('prumo-visual') === 'atual') && !m.vn && !m.chips && !m.tiles && !m.rp && !m.x && !m.tit, 'desligar pela Conta volta ao visual atual por completo', JSON.stringify(m));
  const old = await ev(A, () => [...document.querySelectorAll('#posts .upost.vn-rp')].map(e => ({ q: !!e.querySelector('.vn-q'), car: !!e.querySelector(':scope>.car') })));
  ok(old.length >= 2 && old.every(x => x.q && !x.car), 'no visual atual, quem recebe um repost vê o cartão citado (e não um post vazio)', JSON.stringify(old));
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300);
  ok(await ev(A, () => document.querySelector('[data-vntroca]')?.getAttribute('aria-checked') === 'false'), 'a linha continua lá, agora desligada (dá para religar)');

  // ===== 12. sem a flag de teste, o webdriver ignora ?visual=novo (os outros testes ficam como antes)
  const E = U.erros(await H.pagina(b), 'E'); await E.addInitScript(() => { try { localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
  await E.goto(BASE + '?visual=novo'); await sleep(1500);
  ok(await ev(E, () => !VISUAL_NOVO && !VN112_ATIVO && localStorage.getItem('prumo-visual') === null && /visual=novo/.test(location.search) && !document.documentElement.classList.contains('vn')), 'testes automáticos sem "prumo-teste-visual": a chave nem é lida');

  const errs = [A, B, C, D, E].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
