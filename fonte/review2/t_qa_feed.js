// Revisão de uso real do Feed, posts e perfil (104-correcoes-feed): curtidas "Curtido por", chip só nas notícias,
// legenda editada chega aos amigos, nome novo nos posts, dono apaga comentário, lista de amigos pelo número, menu do perfil do amigo.
// Portas 8915–8919. Capturas em qa/s/t-*.png
const C = require('./_vp_comum'); const { ev, sleep, rect, swipe, tapSel, esperar, U, clk } = C; const { ok } = U;
const PORT = 8915; const SH = __dirname + '/../qa/s/'; require('fs').mkdirSync(SH, { recursive: true });
const shot = async (p, nome) => { await sleep(300); await p.screenshot({ path: SH + 't-' + nome + '.png' }) };
const topo = async (p, sel) => { await ev(p, s => { const m = s.match(/p-(.*?)"/); if (m) garantirPost(m[1]); const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 60) }, sel); await sleep(400) };
(async () => {
  const X = await C.cenario(PORT); const { A, B, P3, P1 } = X; const s1 = `[id="${P1}"]`, s3 = `[id="${P3}"]`;
  const uidA = await ev(A, () => S.uid), uidB = await ev(B, () => S.uid);
  // ---- curtidas: "Curtido por …" nos posts, "gostou" nas notícias ----
  await topo(B, s1); await tapSel(B, s1 + ' .acts [data-a="like"]'); await sleep(800);
  ok(await ev(B, s => document.querySelector(s + ' [data-likes]').textContent === 'Curtido por você', s1), 'B curtiu: "Curtido por você"');
  await esperar(A, s => { try { pubCarregar() } catch (e) { } return /Bia/.test(document.querySelector(s + ' [data-likes]')?.textContent || '') }, s1, 8000);
  ok(await ev(A, s => document.querySelector(s + ' [data-likes]').textContent === 'Curtido por Bia Souza', s1), 'Pedro vê "Curtido por Bia Souza"', await ev(A, s => document.querySelector(s + ' [data-likes]').textContent, s1));
  await topo(A, s1); await tapSel(A, s1 + ' .acts [data-a="like"]'); await sleep(800);
  ok(await ev(A, s => document.querySelector(s + ' [data-likes]').textContent === 'Curtido por você e Bia Souza', s1), 'os dois: "Curtido por você e Bia Souza"');
  ok(await ev(A, s => { const o = document.querySelector(s + ' [data-otr]'); return !o || getComputedStyle(o).display === 'none' }, s1), 'post de membro: sem o chip "gostou" no cabeçalho');
  await shot(A, 'curtido-por');
  ok(await ev(A, () => { const n = document.querySelector('#posts .post:not(.upost)'); n.querySelector('.acts [data-a="like"]').click(); return /Você gostou/.test(n.querySelector('[data-likes]').textContent) }), 'notícia continua com "Você gostou"');
  // ---- comentários: o dono do post apaga o comentário da Bia; folha opaca ----
  await topo(B, s3); await tapSel(B, s3 + ' .acts [data-a="cmt"]'); await sleep(600);
  await B.fill('#ctext', 'Comentário que o Pedro vai apagar'); await B.keyboard.press('Enter'); await sleep(1200); await ev(B, () => closeLayer()); await sleep(300);
  await esperar(A, s => { try { psCarregar() } catch (e) { } return socialOf(s.slice(7, -2)).cm.length === 1 }, s3, 8000);
  await topo(A, s3); await tapSel(A, s3 + ' .acts [data-a="cmt"]'); await sleep(700); await ev(A, () => document.querySelector('#ctext').blur());
  const fl = await ev(A, () => ({ ap: document.querySelectorAll('.sheet [data-apagar]').length, den: document.querySelectorAll('.sheet [data-denc]').length, bg: getComputedStyle(document.querySelector('.sheet.vp99-cm')).backgroundColor }));
  ok(fl.ap === 1 && fl.den === 1, 'no próprio post, o comentário da amiga tem "Apagar" e "Denunciar"', fl);
  ok(/^rgb\(/.test(fl.bg) && !/rgba/.test(fl.bg), 'folha de comentários opaca', fl.bg);
  await shot(A, 'dono-apaga-cmt');
  await ev(A, () => document.querySelector('.sheet [data-apagar]').click()); await sleep(200); await ev(A, () => document.querySelector('.sheet [data-apagar]').click()); await sleep(1500);
  ok(await ev(A, s => !document.querySelector('.sheet .clist li') && socialOf(s.slice(7, -2)).cm.length === 0, s3), 'comentário some para o Pedro');
  await ev(A, () => closeLayer()); await sleep(300);
  ok(await esperar(B, s => { try { psCarregar() } catch (e) { } return !(PS.cm[s.slice(9, -2)] || []).length }, s3, 8000), 'e some do banco', await ev(B, s => JSON.stringify({ps: PS.cm[s.slice(9, -2)], so: socialOf(s.slice(7, -2)).cm}), s3));
  ok(await esperar(B, s => { try { psCarregar() } catch (e) { } return socialOf(s.slice(7, -2)).cm.length === 0 && !/Pedro vai apagar/.test(document.querySelector(s + ' [data-cmts]').textContent) }, s3, 9000), 'e some para a Bia (Feed e contagem)');
  // ---- legenda editada chega à Bia ----
  await topo(A, s1); await ev(A, s => document.querySelector(s + ' [data-umenu]').click(), s1); await sleep(400); await ev(A, () => document.querySelector('[data-ueditar]').click()); await sleep(600);
  await A.fill('#ed-leg', 'Café da manhã com pão de queijo'); await ev(A, () => document.querySelector('[data-uedok]').click()); await sleep(1200);
  await ev(B, () => scrollTo(0, 2000)); await sleep(200);
  ok(await esperar(B, s => { try { pubCarregar() } catch (e) { } return /pão de queijo/.test(document.querySelector(s + ' .up-leg')?.textContent || '') }, s1, 9000), 'Bia vê a legenda editada sem recarregar (mesmo rolada no meio do Feed)');
  await topo(B, s1); await shot(B, 'legenda-editada');
  // ---- nome novo aparece nos posts já na tela ----
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300); await ev(A, () => document.querySelector('#v-me [data-a="nome"]').click()); await sleep(400);
  await A.fill('.sheet input', 'Pedro B. Brandão'); await A.keyboard.press('Enter'); await sleep(1200);
  ok(await esperar(B, s => /Pedro B\. Brandão/.test(document.querySelector(s + ' .up-au')?.textContent || '') && /Pedro B\. Brandão/.test(document.querySelector(s + ' .up-leg')?.textContent || ''), s1, 9000), 'Bia vê o nome novo do Pedro no post (cabeçalho e legenda)');
  // ---- perfil: "N amigos" abre a lista ----
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(500);
  await tapSel(A, '#v-me [data-fd104am]'); await sleep(600);
  ok(await ev(A, () => /Seus amigos \(1\)/.test(document.querySelector('.sheet .sh-h')?.textContent || '') && /Bia Souza/.test(document.querySelector('.sheet').textContent)), 'tocar em "1 amigo" abre a lista de amigos');
  await shot(A, 'lista-amigos'); await ev(A, () => closeLayer()); await sleep(300);
  // ---- perfil da amiga: menu … com desfazer/bloquear/denunciar ----
  await ev(B, u => abrirPerfil(u), uidA); await sleep(1200);
  ok(await ev(B, () => !!document.querySelector('#layer .pfv-h [data-fd104pm]')), 'perfil do amigo tem o menu "…"');
  await tapSel(B, '#layer .pfv-h [data-fd104pm]'); await sleep(500);
  ok(await ev(B, () => { const t = [...document.querySelectorAll('.sheet .opt button')].map(b => b.dataset); return t.some(d => 'desfazer' in d) && t.some(d => 'bloquear' in d) && t.some(d => 'denp' in d) }), 'menu do perfil: Desfazer amizade, Bloquear, Denunciar');
  await shot(B, 'menu-perfil-amigo'); await ev(B, () => closeLayer()); await sleep(300);
  // ---- folha com título longo não encosta no Fechar ----
  await ev(B, () => sheet('Bem-vindo ao Prumo, Maria Aparecida Souza', '<p>x</p>')); await sleep(400);
  ok(await ev(B, () => { const h = document.querySelector('.sheet .sh-h'), f = h.querySelector('button'), r = document.createRange(); r.selectNodeContents(h.firstChild); const t = r.getBoundingClientRect(); return t.right <= f.getBoundingClientRect().left + 1 }), 'título longo da folha não passa por baixo do "Fechar"');
  await shot(B, 'titulo-longo'); await ev(B, () => closeLayer());
  // ---- menção na legenda: na conversa só o cartão (sem repetir a legenda num balão) ----
  await ev(B, () => { while (document.querySelector('#layer').innerHTML) closeLayer() }).catch(() => { }); await sleep(400);
  await ev(B, u => abrirConversa(u), uidA); await sleep(1200);
  ok(await ev(B, () => { const t = document.body.innerHTML; return /dm-ucard|dm-card/.test(t) && ![...document.querySelectorAll('.bub')].some(b => /Arpoador ver o pôr do sol/.test(b.textContent)) }), 'conversa: menção na legenda mostra o cartão do post sem balão repetido', await ev(B, () => ([...document.querySelectorAll('.bub,.dm-lb')].map(b=>b.textContent).join('|') + VIEW).replace(/<svg.*?<\/svg>/g,'').slice(0, 1500)));
  await ev(B, () => { while (document.querySelector('#layer').innerHTML) closeLayer() }).catch(() => { }); await sleep(400);
  // ---- publicar e apagar com o Perfil aberto: número e grade acompanham ----
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(500);
  const n0 = await ev(A, () => +document.querySelector('#v-me .pf-num b').textContent);
  await ev(A, () => criarAbrir('post')); await sleep(400); await clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', [__dirname + '/../qa2/f3.jpg']); await esperar(A, () => ED.po.fotos.length === 1, null, 6000); await sleep(300);
  await clk(A, '[data-edav]'); await sleep(400); await clk(A, '[data-edav]'); await sleep(400); await A.fill('#ce-leg', 'Só para os melhores amigos');
  await clk(A, '[data-cfppub]'); await sleep(400); await ev(A, () => document.querySelector('[data-cfppubv="proximos"]').click()); await sleep(500);
  if (await ev(A, () => !!document.querySelector('[data-edma]'))) { await ev(A, u => document.querySelector(`[data-edma="${u}"]`).click(), uidB); await sleep(600); await ev(A, () => document.querySelector('[data-edmaok]').click()); await sleep(400) }
  await ev(A, () => [...document.querySelectorAll('.ce-sel button')].find(b => /Concluir/.test(b.textContent))?.click()); await sleep(300);
  await clk(A, '[data-edpubpo]'); await esperar(A, () => !ED && !PQ.atual, null, 20000); await sleep(1200);
  ok(await ev(A, n => VIEW === 'me' && +document.querySelector('#v-me .pf-num b').textContent === n + 1 && document.querySelectorAll('#v-me .pf-grade .pf-t').length === n + 1, n0), 'publicou com o Perfil aberto: número e grade já com o post novo');
  const pMA = await ev(A, () => PUB.itens.filter(x => x.tipo === 'post')[0].id);
  await ev(B, () => { while (document.querySelector('#layer').innerHTML) closeLayer(); go('feed') }).catch(() => { }); await sleep(400);
  ok(await esperar(B, id => { try { pubCarregar() } catch (e) { } if (pubDe(id)) garantirPost('u:' + id); return !!document.querySelector(`[id="p-u:${id}"] .fd104-ma`) }, pMA, 9000), 'post só para Melhores amigos: selo ★ no cabeçalho para a amiga', JSON.stringify({ a: await ev(A, id => [pubDe(id).publico, [...MA.set]], pMA), b: await ev(B, id => [!!pubDe(id), !!document.querySelector(`[id="p-u:${id}"]`), VIEW], pMA) }));
  await tapSel(A, '#v-me [data-pfi="0"]'); await sleep(1300);
  await ev(A, id => document.querySelector(`#layer [id="p-u:${id}"] [data-umenu]`).click(), pMA); await sleep(400);
  await ev(A, () => document.querySelector('[data-uapagar]').click()); await sleep(200); await ev(A, () => document.querySelector('[data-uapagar]').click()); await sleep(1500);
  await ev(A, () => { while (document.querySelector('#layer').innerHTML) closeLayer() }).catch(() => { }); await sleep(600);
  ok(await ev(A, n => +document.querySelector('#v-me .pf-num b').textContent === n && document.querySelectorAll('#v-me .pf-grade .pf-t').length === n, n0), 'apagou pela grade: ao voltar, o perfil já não tem o post');
  // ---- desfazer amizade pelo perfil: perfil aberto passa a "só para amigos" com Pedir amizade ----
  await ev(B, u => abrirPerfil(u), uidA); await sleep(1200); await tapSel(B, '#layer [data-fd104pm]'); await sleep(400);
  await ev(B, () => document.querySelector('.sheet [data-desfazer]').click()); await sleep(500);
  await ev(B, () => document.querySelector('.sheet [data-desfazerok], .sheet .btn.perigo').click()); await sleep(2000);
  ok(await ev(B, () => !!document.querySelector('#layer .pfv [data-pedir]') && !document.querySelector('#layer .pfv .pf-grade') && /só para amigos/.test(document.querySelector('#layer .pfv').textContent) && !document.querySelector('#layer [data-fd104pm]')), 'depois de desfazer a amizade o perfil aberto mostra "Pedir amizade" e esconde as publicações');
  await shot(B, 'perfil-depois-desfazer');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_qa_feed: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await X.b.close(); X.srv.kill(); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(2) });
