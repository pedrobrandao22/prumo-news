// Revisão A (03/11): social e conversas usando o app como Pedro (admin), Bia, Carla e Dani, no estado de produção
// (foco, visual novo com o cartão A, sem reels e fase 2 ligados). Correções em js/114 + css/30; detalhes em qa/REVISAO-A.md.
// Portas 8722–8723. Capturas em qa/revisao-a/depois/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8722, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'revisao-a', 'depois'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const foto = async (p, n) => { await sleep(300); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [ids.a, ids.b, ids.c, ids.d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita'),($4,$1,'aceita')`, [ids.a, ids.b, ids.c, ids.d]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase());
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V8 !== 'undefined' && V8.on === true, null, 15000); await sleep(600); await fecha(p); return p };
  const A = await abrir('a'), B = await abrir('b'), C = await abrir('c', { dark: true }), D = await abrir('d', { vp: { width: 360, height: 760 } });
  ok(await ev(A, () => document.documentElement.classList.contains('vn') && typeof ra114MenCmt === 'function'), 'estado de produção: visual novo ligado e o 114 carregado');
  const ins = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], ...r }).select('id'); await pubCarregar(); return q.data[0].id }, r);
  const pAna = await ins(B, { texto: 'Juros devem cair só em 2027\n\nO Copom sinalizou cautela. #Copom', estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros devem cair só em 2027' } } });
  const pPed = await ins(A, { texto: 'Minha opinião: o Senado aprova com folga. #Senado', estilo: { v: 2 } });
  const feed = P => ev(P, async () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts() });

  /* ---------- A01: repostar com comentário avisa a menção ---------- */
  await feed(C); await sleep(400);
  await ev(C, id => { garantirPost('u:' + id); document.getElementById('p-u:' + id).querySelector('[data-vnrp]').click() }, pAna); await sleep(400);
  await ev(C, () => document.querySelector('[data-vnrpcom]').click()); await sleep(500);
  await C.fill('#vn-rpt', 'Leitura obrigatória, @Pedro Brandão #Copom');
  await ev(C, () => document.querySelector('[data-vnrppub]').click()); await sleep(1500);
  const rp = (await H.sql(`select id from publicacoes where autor=$1 and estilo ? 'rp'`, [ids.c]))[0];
  ok(!!rp, 'A01: repost com comentário publicado');
  const men = await H.sql(`select de, para, pid from mensagens where tipo='mencao' and para=$1`, [ids.a]);
  ok(men.length === 1 && men[0].de === ids.c && men[0].pid === 'u:' + rp.id, 'A01: Pedro recebe o aviso da menção (mensagem de menção apontando para o repost)', JSON.stringify(men));
  await sleep(600); await ev(A, () => { AT.t = 0; return atCarregar() }); await ev(A, () => abrirAtividade()); await sleep(800);
  const at1 = await ev(A, () => document.querySelector('#layer .pfv-at')?.textContent || document.querySelector('#layer')?.textContent || '');
  ok(/Carla Mendes marcou você num post: “Leitura obrigatória/.test(at1), 'A01: Atividade do Pedro: "Carla marcou você num post"', at1.slice(0, 200));
  await fecha(A);

  /* ---------- A03: menção num comentário não vira "marcou num post" ---------- */
  await feed(B); await ev(B, id => openComments('u:' + id), pAna); await sleep(400);
  await B.fill('#ctext', '@Pedro Brandão valeu pela leitura'); await ev(B, () => document.querySelector('#cform .sendc').click()); await sleep(1200); await fecha(B);
  ok(+(await H.sql(`select count(*) n from mensagens where tipo='mencao' and de=$1 and para=$2`, [ids.b, ids.a]))[0].n === 1, 'A03: o comentário com @ manda o aviso ao Pedro');
  await sleep(500); await ev(A, () => { AT.t = 0; return atCarregar() }); await ev(A, () => abrirAtividade()); await sleep(800);
  const at3 = await ev(A, () => document.querySelector('#layer')?.textContent || '');
  ok(/Bia Souza mencionou você num comentário: “@Pedro Brandão valeu/.test(at3) && !/Bia Souza marcou você num post/.test(at3), 'A03: Atividade: "Bia mencionou você num comentário" (não "marcou você num post")', at3.slice(0, 300));
  ok(/Carla Mendes marcou você num post/.test(at3), 'A03: a menção no post (repost da Carla) continua "marcou você num post"');
  await foto(A, 'a03-atividade-pedro');
  await fecha(A); await ev(A, () => { THREAD = null; go('msgs') }); await sleep(700);
  const pv = await ev(A, () => [...document.querySelectorAll('.dm-lista .dm-row')].map(r => r.textContent));
  ok(pv.some(t => /Bia Souza/.test(t) && /Mencionou você num comentário/.test(t)), 'A03: lista de Conversas: "Mencionou você num comentário"', JSON.stringify(pv));
  await ev(A, u => abrirConversa(u), ids.b); await sleep(800);
  const lb = await ev(A, () => [...document.querySelectorAll('#v-msgs .dm-lb')].map(e => e.textContent));
  ok(lb.some(t => /Mencionou você num comentário/.test(t)) && !lb.some(t => /num post/.test(t)), 'A03: na conversa, o rótulo diz "num comentário"', JSON.stringify(lb));
  await foto(A, 'a03-conversa-pedro-bia');
  await ev(A, u => abrirConversa(u), ids.c); await sleep(700);
  const lbc = await ev(A, () => [...document.querySelectorAll('#v-msgs .dm-lb')].map(e => e.textContent));
  ok(lbc.some(t => /num post/.test(t)), 'A03: menção no post da Carla segue "num post" na conversa', JSON.stringify(lbc));
  await ev(A, () => { THREAD = null; go('feed') });

  /* ---------- A04: perfil de quem não é amigo ---------- */
  await ev(D, u => abrirPerfil(u), ids.c); await sleep(900);
  const pfD = await ev(D, () => document.querySelector('#layer .pfv')?.textContent || '');
  ok(!/\d\s*publicaç/.test(pfD) && /Perfil só para amigos/.test(pfD) && /Pedir amizade/.test(pfD), 'A04: perfil da Carla para a Dani: sem "0 publicações", com "Perfil só para amigos"', pfD.slice(0, 200));
  await foto(D, 'a04-perfil-nao-amiga');
  for (const k of ['resp', 'midia']) { await ev(D, k => document.querySelector(`#layer [data-vnpfaba="${k}"]`).click(), k); await sleep(300);
    ok(await ev(D, () => /Perfil só para amigos/.test(document.querySelector('#layer .pfv')?.textContent || '')), `A04: aba ${k === 'resp' ? 'Respostas' : 'Mídia'} também diz "Perfil só para amigos"`) }
  await fecha(D);
  await ev(A, u => abrirPerfil(u), ids.b); await sleep(900);
  ok(await ev(A, () => /1 publicação/.test(document.querySelector('#layer .pfv')?.textContent || '')), 'A04: perfil de amigo continua com o número de publicações');
  await ev(A, () => document.querySelector('#layer [data-vnpfaba="resp"]').click()); await sleep(300);
  ok(await ev(A, () => !/Perfil só para amigos/.test(document.querySelector('#layer .pfv')?.textContent || '')), 'A04: amigo: Respostas normal');
  await fecha(A);

  /* ---------- A02: Melhores amigos no Perfil › Conta ---------- */
  await ev(C, () => { go('me'); PF_ABA = 'conta'; try { VN112_PF.me = 'conta' } catch (e) { } renderMe() }); await sleep(600);
  ok(!!(await C.$('#v-me [data-ra114maa]')), 'A02: Conta tem "Melhores amigos"');
  await ev(C, () => document.querySelector('#v-me [data-ra114maa]').click()); await sleep(800);
  ok(await ev(C, () => document.querySelectorAll('.sheet [data-ra114ma]').length === 2 && /Ninguém na lista/.test(document.querySelector('#ra114man').textContent)), 'A02: lista com os 2 amigos, ninguém marcado');
  await ev(C, u => document.querySelector(`.sheet [data-ra114ma="${u}"]`).click(), ids.b); await sleep(900);
  ok(+(await H.sql(`select count(*) n from melhores_amigos where dono=$1 and amigo=$2`, [ids.c, ids.b]))[0].n === 1 && await ev(C, u => document.querySelector(`.sheet [data-ra114ma="${u}"]`).getAttribute('aria-pressed') === 'true' && /1 pessoa/.test(document.querySelector('#ra114man').textContent), ids.b), 'A02: marcar Bia grava no banco e mostra "1 pessoa na lista"');
  await foto(C, 'a02-melhores-amigos-escuro');
  const pMA = await ins(C, { texto: 'Só para os melhores amigos', publico: 'proximos', estilo: { v: 2 } });
  await ev(B, () => pubCarregar()); await ev(A, () => pubCarregar()); await sleep(300);
  ok(await ev(B, id => !!pubDe(id), pMA) && await ev(A, id => !pubDe(id), pMA), 'A02: Bia (na lista) vê o post para Melhores amigos, Pedro não');
  await ev(C, u => document.querySelector(`.sheet [data-ra114ma="${u}"]`).click(), ids.b); await sleep(900);
  ok(+(await H.sql(`select count(*) n from melhores_amigos where dono=$1`, [ids.c]))[0].n === 0, 'A02: desmarcar tira do banco');
  await fecha(C);

  /* ---------- A05: 360 px, os botões do próprio perfil cabem ---------- */
  await ev(D, () => { go('me'); PF_ABA = 'posts'; try { VN112_PF.me = 'posts' } catch (e) { } renderMe(); scrollTo(0, 0) }); await sleep(600);
  const bts = await ev(D, () => [...document.querySelectorAll('#v-me .vn-pf>.pf-bts .btn')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), r: Math.round(r.right), cabe: b.scrollWidth <= b.clientWidth + 1 } }));
  ok(bts.length === 3 && bts.every(b => b.r <= 360 - 8 && b.cabe), 'A05: 360 px: "Nova publicação", "Convidar amigo" e "Editar foto" inteiros na tela', JSON.stringify(bts));
  await foto(D, 'a05-perfil-360');

  /* ---------- A06: foto do perfil, botões alinhados ---------- */
  const png = await ev(B, () => { const c = document.createElement('canvas'); c.width = 600; c.height = 600; const g = c.getContext('2d'); g.fillStyle = '#5f7a8c'; g.fillRect(0, 0, 600, 600); return c.toDataURL('image/png').split(',')[1] });
  await ev(B, () => { go('me'); renderMe(); document.querySelector('#v-me [data-fp8]').click() }); await sleep(300);
  await B.setInputFiles('#fp8-file', { name: 'eu.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await esperar(B, () => !!document.querySelector('[data-fp8ok]')); await ev(B, () => document.querySelector('[data-fp8ok]').click());
  await esperar(B, () => !!(S.membros[S.uid] || {}).foto && !$('#layer').innerHTML, null, 8000); await sleep(300);
  await ev(B, () => document.querySelector('#v-me [data-fp8]').click()); await sleep(400);
  const fb = await ev(B, () => [...document.querySelectorAll('.sh-f .btn')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.width)] }));
  ok(fb.length === 2 && fb[0][0] === fb[1][0] && Math.abs(fb[0][1] - fb[1][1]) <= 2, 'A06: "Trocar foto" e "Remover foto" lado a lado, mesma largura', JSON.stringify(fb));
  await ev(B, () => document.querySelector('[data-fp8tira]').click()); await sleep(200);
  const fb2 = await ev(B, () => [...document.querySelectorAll('.sh-f .btn')].map(b => Math.round(b.getBoundingClientRect().top)));
  ok(fb2[0] === fb2[1], 'A06: com "Toque de novo para remover" continuam alinhados', JSON.stringify(fb2));
  await foto(B, 'a06-foto-do-perfil');
  await fecha(B);

  /* ---------- A07: repost de publicação arquivada ---------- */
  await feed(C); await ev(C, id => { garantirPost('u:' + id); document.getElementById('p-u:' + id).querySelector('[data-vnrp]').click() }, pPed); await sleep(400);
  await ev(C, () => document.querySelector('[data-vnrpja]').click()); await sleep(1200);
  await feed(A); await ev(A, id => { garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, pPed); await sleep(400);
  await ev(A, () => document.querySelector('.sheet [data-u8arq]').click()); await sleep(1000);
  await ev(C, () => { PUB.sig = ''; VN112_Q.clear(); }); await feed(C); await sleep(900);
  const rp2 = (await H.sql(`select id from publicacoes where autor=$1 and texto='' and estilo ? 'rp'`, [ids.c]))[0].id;
  const q7 = await ev(C, id => { garantirPost('u:' + id); const e = document.getElementById('p-u:' + id); e && e.scrollIntoView({ block: 'center' }); return e ? e.textContent : '' }, rp2);
  ok(/Publicação indisponível/.test(q7) && /apagada, arquivada ou/.test(q7), 'A07: repost de post arquivado: "apagada, arquivada ou…"', q7.slice(0, 200));
  await foto(C, 'a07-repost-arquivado');
  await feed(B); ok(await ev(B, id => !garantirPost('u:' + id) && !document.getElementById('p-u:' + id), rp2), 'A07 (122): a Bia, amiga da Carla, não vê o repost sem comentário do post arquivado (só quem repostou vê)');

  /* ---------- A09: sugestão de @ pelo teclado ---------- */
  await feed(D); await ev(D, id => openComments('u:' + id), pPed).catch(() => { });
  await ev(D, () => { if (!document.querySelector('#ctext')) openComments(FEED.pautas[0].id) }); await sleep(400);
  await D.click('#ctext'); await D.keyboard.type('Boa @Ped', { delay: 25 }); await sleep(400);
  ok(await ev(D, () => !!document.querySelector('.men-box [data-men]')), 'A09: sugestão de @ aparece');
  await D.focus('.men-box [data-men]'); await D.keyboard.press('Enter'); await sleep(300);
  const v9 = await ev(D, () => document.querySelector('#ctext').value);
  ok(/^Boa @Pedro Brandão\s?$/.test(v9), 'A09: Enter na sugestão completa o nome', v9);
  await fecha(D);

  const er = [A, B, C, D].flatMap(p => p._erros);
  ok(!er.length, 'sem erros na página', er.join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_revisao_a: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
