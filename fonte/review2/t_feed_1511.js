// Feed enxuto (156, 15/11): cartão de notícia só com editoria, título, foto/carrossel, ações e uma linha da cobertura;
// cobertura nunca "Anúncio"; fonte do gráfico sem tela própria; círculos sem repetir; "1 notícia"; Mais recentes na ordem
// da hora; esqueleto no fim do lote; Em 5 min sem repetir o título; comentários (foco, altura, ajuda curta, respostas);
// sem conexão. Portas 8620 e 8623.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8620, BASE = 'http://localhost:' + PORTA + '/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 }, ctx: { deviceScaleFactor: 2, isMobile: true } }), 'A'); const ctx = A.context();
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => document.querySelectorAll('#posts .post.vn-cn').length > 2, null, 8000); await sleep(1200);

  // 1. cartão de notícia enxuto
  const c1 = await ev(A, () => { const p = document.querySelector('#posts .post.vn-cn'); const vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0;
    return { kick: [...p.querySelectorAll('.cover .kickrow')].some(vis), ssi: [...p.querySelectorAll('.ss-i')].some(e => getComputedStyle(e).display !== 'none'),
      fim: [...p.querySelectorAll('.ss-fim .ss-t')].some(e => getComputedStyle(e).display !== 'none'), cta: !!p.querySelector('.ss-fim .ss-cta'),
      pontos: [...p.querySelectorAll('.acts .act')].map(a => getComputedStyle(a, '::after').content).filter(c => c && c !== 'none' && c !== 'normal').length,
      addc: vis(p.querySelector('.addc')), tags: vis(p.querySelector('.ht-nl')), otr: vis(p.querySelector('[data-otr]')),
      save: (p.querySelector('.acts [data-a="save"] svg path') || {}).getAttribute?.('d') || '', tit: !!p.querySelector('.vn-tit'), sec: !!p.querySelector('.ph-sec b') } });
  ok(c1.tit && c1.sec, 'cartão: editoria no topo e título');
  ok(!c1.kick, 'cartão: sem o rótulo de assunto em cima da foto', c1);
  ok(!c1.ssi, 'carrossel: sem o contador "1/5" dentro das telas');
  ok(!c1.fim && c1.cta, 'última tela: sem o resumo repetido, com "Ler a matéria completa"');
  ok(c1.pontos === 0, 'barra de ações sem "·" soltos', c1.pontos);
  ok(!c1.addc && !c1.tags && !c1.otr, 'sem campo vazio de comentário, hashtags e chip de amigo no cartão');
  ok(/^M6\.5 3\.5h11/.test(c1.save), 'Guardar da notícia usa o marcador (o mesmo dos posts)', c1.save);

  // 2. cobertura: nunca "Anúncio"; a etapa normal continua
  const cob = await ev(A, () => { const p = (FEED.pautas || []).find(x => document.getElementById('p-' + x.id)); const q = Object.assign({}, p, { tipo: 'cobertura', status: 'ao_vivo', subtema: 'Cúpula da Apec', etapa: { passos: ['Anúncio', 'Encontro'], atual: 0 } });
    const a = cobBarra(q); const b2 = cobBarra(Object.assign({}, q, { etapa: { passos: ['Patrocinado'], atual: 0 }, subtema: 'Outros', tag: 'Diplomacia' })); const c = cobBarra(Object.assign({}, q, { etapa: { passos: ['Senado: destaques'], atual: 0 } }));
    const t = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.trim() }; return [t(a), t(b2), t(c)] });
  ok(!/an[uú]ncio|patrocinad|publicidade/i.test(cob.join('|')) && /· cobertura completa/.test(cob[0]) && /· cobertura completa/.test(cob[1]), 'cobertura com etapa de nome de propaganda não mostra a etapa (163: nome + cobertura completa)', cob);
  ok(/· Senado: destaques/.test(cob[2]), 'cobertura com etapa normal mostra a etapa', cob[2]);

  // 3. tela só com a fonte vira o pé do gráfico anterior; pontinhos do total
  const fonte = await ev(A, () => { const p = document.querySelector('#posts .post.vn-cn'); const t = p.querySelector('.track'); const n0 = t.children.length;
    const a = document.createElement('div'); a.className = 'sl txs ss-vis pag'; a.innerHTML = '<div class="gn acv"><span class="lbl">Placar</span><ul><li>Sim 45</li></ul></div>';
    const f = document.createElement('div'); f.className = 'sl txs ss-vis pag'; f.innerHTML = '<div class="gn acv"><p class="hint">Fonte: Agência Senado</p></div>';
    t.appendChild(a); t.appendChild(f); fd156Track(t); const r = { antes: n0 + 2, depois: t.children.length, foi: !!a.querySelector('.fd156-fonte'), pg: (p.querySelector('.pdots .pg') || {}).textContent || '' };
    a.remove(); fd156Pontos(t); return r });
  ok(fonte.depois === fonte.antes - 1 && fonte.foi, 'tela só com "Fonte:" sai e a fonte vai para o pé do gráfico', fonte);
  ok(!fonte.pg || fonte.pg.endsWith('/' + fonte.depois), 'contador dos pontinhos com o total real', fonte);

  // 4. topo do cartão em 320 px: "•••" não cobre a hora
  await A.setViewportSize({ width: 320, height: 568 }); await sleep(500);
  const so = await ev(A, () => { const p = document.querySelector('#posts .post.vn-cn'); const st = p.querySelector('.fd156-st'); if (st) st.textContent = 'Contas públicas e orçamento federal · seguindo'; const hr = p.querySelector('.ph-sub .vn-hr'), mb = p.querySelector('.ph .more-btn');
    if (!hr || !mb) return { sem: true }; const a = hr.getBoundingClientRect(), m = mb.getBoundingClientRect(); return { hrDir: Math.round(a.right), mbEsq: Math.round(m.left), hrLarg: Math.round(a.width) } });
  ok(so.sem || (so.hrDir <= so.mbEsq && so.hrLarg > 10), 'iPhone SE: a hora fica inteira e à esquerda do "•••"', so);
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(400);

  // 5. círculos do topo: a editoria não repete o 1º cartão nem Últimas; singular
  const top = await ev(A, () => { const first = document.querySelector('#posts .post.vn-cn .vn-tit')?.textContent.trim();
    const ult = document.querySelector('#secs [data-ultimas] .vn-tl-tx b')?.textContent.trim();
    const tiles = [...document.querySelectorAll('#secs [data-sec-story]')].map(b => ({ s: b.dataset.secStory, t: (b.querySelector('.vn-tl-tx b') || {}).textContent || '', n: pautasDa(b.dataset.secStory).length, al: b.getAttribute('aria-label') }));
    const curto = (x) => fd156Norm(x).slice(0, 40);
    return { rep: tiles.filter(x => x.n > 1 && x.t && first && curto(x.t) === curto(first)).map(x => x.s), plural: tiles.filter(x => /\b1 notícias|\b1 não vistas/.test(x.al)).map(x => x.al), ult, first } });
  ok(!top.rep.length, 'círculo da editoria não repete a notícia do 1º cartão', top);
  ok(!top.plural.length, 'círculo diz "1 notícia, 1 não vista" (sem plural com 1)', top.plural);
  ok(await ev(A, () => { const b = document.createElement('div'); b.innerHTML = '<button data-sec-story="x" aria-label="Educação: 1 notícias, 1 não vistas"></button>'; document.getElementById('secs').appendChild(b.firstChild); fd156Rotulos(); const l = document.querySelector('#secs [data-sec-story="x"]'); const r = l.getAttribute('aria-label'); l.remove(); return r === 'Educação: 1 notícia, 1 não vista' }), 'rótulo do círculo no singular');

  // 6. Mais recentes: ordem da hora mostrada; a folha fecha ao escolher
  await ev(A, () => abrirFiltro()); await sleep(400); await clk(A, '#layer [data-fmodo="recentes"]'); await sleep(900);
  ok(await ev(A, () => !document.querySelector('#layer .sheet')), 'escolher "Mais recentes" fecha a folha');
  const ord = await ev(A, () => [...document.querySelectorAll('#posts .post.vn-cn .pt-hora')].map(t => tms(t.dataset.when) || 0));
  ok(ord.length > 2 && ord.every((h, i) => !i || h <= ord[i - 1]), 'Mais recentes: hora do cartão sempre para trás', ord.slice(0, 8));
  await ev(A, () => { PREF.feedModo = 'voce'; salvarPrefs(); renderPosts(); scrollTo(0, 0) }); await sleep(500);

  // 7. fim do lote: esqueleto e rodapé só no fim
  const mais = await ev(A, () => { const m = document.getElementById('mais'), ex = document.getElementById('extra'); return { m: !!m, sk: !!(m && m.querySelector('.fd156-sk')), exOculto: !!ex && getComputedStyle(ex).display === 'none', txt: m ? m.getAttribute('aria-label') : '' } });
  ok(!mais.m || (mais.sk && mais.exOculto && /Carregando mais notícias/.test(mais.txt)), 'enquanto carrega: esqueleto de cartão, sem rodapé', mais);
  await ev(A, async () => { for (let i = 0; i < 40 && document.getElementById('mais'); i++) { carregarMais(true); await new Promise(r => setTimeout(r, 30)) } });
  ok(await ev(A, () => !document.getElementById('mais') && getComputedStyle(document.getElementById('extra')).display !== 'none'), 'tudo carregado: Outras notícias e rodapé aparecem');
  await ev(A, () => scrollTo(0, 0)); await sleep(300);

  // 8. Em 5 min: ponto igual ao título sai
  ok(await ev(A, () => fd156IgualTitulo('A PGR prepara as primeiras denúncias do caso Master.', 'PGR prepara as primeiras denúncias do caso Master') && !fd156IgualTitulo('Fachin deu mais 60 dias à PF.', 'PGR prepara denúncias')), 'frase igual ao título é reconhecida');
  ok(await ev(A, () => (FEED.pautas || []).slice(0, 15).every(p => { const L = lente(), t = versao(p, L).titulo; return igLinhas(p, L).every(x => !fd156IgualTitulo(x, t)) && ssFrasesSociais(p, L).filter(x => fd156IgualTitulo(x, t)).length === 0 || ssFrasesSociais(p, L).length < 2 })), 'Em 5 min e carrossel sem ponto que repete o título');

  // 9. comentários: Comentar põe o cursor no campo
  const pid = await ev(A, () => document.querySelector('#posts .post.vn-cn').dataset.pid);
  await clk(A, `[id="p-${pid}"] .acts [data-a="cmt"]`); await sleep(600);
  ok(await ev(A, () => document.activeElement && document.activeElement.id === 'ctext'), 'tocar em Comentar põe o cursor no campo');
  await A.fill('#ctext', 'Primeiro comentário'); await clk(A, '#cform .sendc'); await sleep(900);
  await A.fill('#ctext', '@Pedro concordo com você'); await clk(A, '#cform .sendc'); await sleep(900);
  await A.fill('#ctext', 'Outro assunto'); await clk(A, '#cform .sendc'); await sleep(1200);
  const gr = await ev(A, () => [...document.querySelectorAll('#cbox .clist > li')].map(li => (li.classList.contains('fd156-resp') ? '>' : '') + li.querySelector('span').textContent.replace(/^Pedro\s*/, '').trim()));
  ok(gr.length === 3 && gr[1].startsWith('>') && /respondendo a Pedro/.test(await ev(A, () => document.querySelector('#cbox .fd156-resp').textContent)), 'resposta fica logo abaixo, com recuo e "respondendo a"', gr);
  await U.foto(A, 'feed-1511-comentarios');

  // 10. sem conexão: comentário volta com a altura certa e o aviso fala da conexão
  await ctx.setOffline(true);
  await ev(A, () => { window.__gm156 = gravarMapa; gravarMapa = () => Promise.reject(new Error('Failed to fetch')) });
  const longo = 'Esse texto é bem comprido para ocupar várias linhas no campo de comentário e conferir que, quando o envio falha, a caixa volta com a altura do texto inteiro e não com uma linha só cortada.';
  await A.fill('#ctext', longo); await sleep(200); await clk(A, '#cform .sendc'); await sleep(900);
  const falha = await ev(A, () => ({ v: document.getElementById('ctext').value, t: (document.querySelector('.toast') || {}).textContent || '', q: JSON.parse(localStorage.getItem('fd156cq') || '[]').length }));
  ok(falha.v === '' && falha.q === 1, 'sem internet: o comentário sai da caixa e fica guardado para enviar depois', falha);
  ok(/Sem conexão.*quando a internet voltar/.test(falha.t) && /Cancelar/.test(falha.t), 'aviso diz que vai ser enviado quando a conexão voltar, com Cancelar', falha.t);
  await ev(A, () => closeLayer()); await sleep(400);
  await ev(A, p => toggleLike(p), pid); await sleep(800);
  ok(/Sem conexão/.test(await ev(A, () => (document.querySelector('.toast') || {}).textContent || '')), 'Gostei sem internet: aviso diz que é a conexão');
  ok(await ev(A, p => !socialOf(p).likes.includes(S.uid), pid), 'Gostei não ficou marcado sem internet');
  await ev(A, () => { gravarMapa = window.__gm156 }); await ctx.setOffline(false);
  ok(await esperar(A, p => socialOf(p).likes.includes(S.uid), pid, 6000), 'internet volta: o Gostei é enviado sozinho');
  ok(await esperar(A, a => JSON.parse(localStorage.getItem('fd156cq') || '[]').length === 0 && socialOf(a[0]).cm.some(c => c.texto === a[1]), [pid, longo], 8000), 'internet volta: o comentário guardado é enviado sozinho');

  // 11. curtida de um jeito só: com a linha "Você gostou", o número some
  await sleep(500);
  const lk = await ev(A, p => { const el = document.getElementById('p-' + p); const n = el.querySelector('.acts [data-n="like"]'); return { linha: el.querySelector('[data-likes]').textContent.trim(), num: n && getComputedStyle(n).display !== 'none' && n.textContent.trim() } }, pid);
  ok(lk.num === '1' && !(await ev(A, p => { const l = document.querySelector('#p-' + p + ' [data-likes]'); return l && getComputedStyle(l).display !== 'none' && l.textContent.trim() }, pid)), 'só você gostou: só o número, sem a linha "Você gostou"', lk);
  const amg = await ev(A, p => { const el = document.getElementById('p-' + p); el.querySelector('[data-likes]').innerHTML = '<b>Ana</b> gostou'; el.classList.remove('fd156-eu'); el.classList.add('fd156-lk'); const n = el.querySelector('.acts [data-n="like"]'); return getComputedStyle(n).display === 'none' && getComputedStyle(el.querySelector('[data-likes]')).display !== 'none' }, pid);
  ok(amg, 'amigo gostou: só a linha com o nome, sem o número');

  // 12. post de membro também sem o campo vazio; cabeçalho opaco ao rolar
  await ev(A, () => criarMenu()); await sleep(400); await A.fill('#cp152-tx', 'Vai dar ruim'); await clk(A, '[data-cp152pub]'); await sleep(1500);
  await esperar(A, () => !!document.querySelector('#posts .post.upost'), null, 6000);
  ok(await ev(A, () => { const u = document.querySelector('#posts .post.upost'); if (!u) return false; const a = u.querySelector('.addc'); return !a || getComputedStyle(a).display === 'none' }), 'post de membro no Feed sem "Adicione um comentário…"', await ev(A, () => [document.querySelectorAll('#posts .post.upost').length, (document.querySelector('#layer') || {}).innerText?.slice(0, 120)]));
  ok(await ev(A, () => { const t = document.querySelector('.top'); t.classList.add('rolou'); const bg = getComputedStyle(t).backgroundColor; t.classList.remove('rolou'); const m = /rgba?\([^)]*?([\d.]+)\)$/.exec(bg.replace(/ \/ /, ', ')); const a = /rgba/.test(bg) || / \/ /.test(bg) ? parseFloat(bg.split(/[,/]/).pop()) : 1; return a >= .9 }), 'cabeçalho rolado com fundo quase opaco');

  // 13. foto do cartão (iPhone 13)
  await ev(A, () => { const p = document.querySelector('#posts .post.vn-cn'); p.scrollIntoView({ block: 'start' }); scrollBy(0, -60) }); await sleep(600); await U.foto(A, 'feed-1511-cartao');

  // 14. iPhone SE: texto de ajuda curto no campo de comentário
  await A.setViewportSize({ width: 320, height: 568 }); await ev(A, () => scrollTo(0, 0)); await sleep(500);
  await clk(A, '#posts .post.vn-cn .acts [data-a="cmt"]'); await sleep(600);
  const ph = await ev(A, () => { const i = document.getElementById('ctext'); if (!i) return {}; return { ph: i.getAttribute('placeholder'), foco: document.activeElement === i } });
  ok(ph.ph === 'Comentar…' && ph.foco, 'iPhone SE: "Comentar…" no campo e cursor nele', ph);
  await U.foto(A, 'feed-1511-comentar-se');

  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_feed_1511: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
