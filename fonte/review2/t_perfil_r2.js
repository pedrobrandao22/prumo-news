// Revisão do Perfil (165, 16/11 noite): fileira de botões igual em todas as abas, engrenagem alinhada com a linha da aba,
// abas que cabem no iPhone SE, "Nova publicação" acima da barra, Conta e ajustes sem repetição, Guardados com a foto da Capa
// e abrindo a matéria, Atividade › cobertura › voltar, Adicionar amigos com quem já é amigo, Conversas sem círculo repetido,
// opções da conversa sem linha vazia, letra grande no Perfil/Conversas/Busca, modo escuro sem botão branco e avisos de entrar.
// Portas 8700–8701.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8700, BASE = `http://localhost:${PORTA}/index.html`;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const aba = async (p, k) => { await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); go('me'); scrollTo(0, 0) }); await sleep(250); await ev(p, k => document.querySelector(`#v-me [data-vnpfaba="${k}"]`).click(), k); await sleep(400) };
const fileira = p => ev(p, () => [...document.querySelectorAll('#v-me .vn-pf .pf-bts .btn')].filter(b => b.offsetParent).map(b => b.textContent.trim()).join('|'));
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 664 } }), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await esperar(A, u => S.amigos.has(u), uidB, 8000);

  // 1. fileira igual em todas as abas, sem "Nova publicação"
  const fs = []; for (const k of ['posts', 'resp', 'midia', 'salvos', 'conta']) { await aba(A, k); fs.push(await fileira(A)) }
  ok(fs.every(f => f === 'Convidar amigo|Editar foto'), 'fileira igual em todas as abas: Convidar amigo e Editar foto', fs);
  // 2. Posts vazio: "Nova publicação" inteiro acima da barra de baixo, sem rolar
  await aba(A, 'posts'); await ev(A, () => scrollTo(0, 0)); await sleep(200);
  const np = await ev(A, () => { const b = document.querySelector('#v-me .pf-vz [data-criarde="post"]').getBoundingClientRect(), n = document.querySelector('.nav').getBoundingClientRect(); return { b: Math.round(b.bottom), nav: Math.round(n.top) } });
  ok(np.b <= np.nav - 4, '"Nova publicação" do Posts vazio fica acima da barra (iPhone 13)', np);
  await U.foto(A, 'perfil-r2-vazio');
  // 3. engrenagem centrada sobre a linha da aba
  await aba(A, 'conta');
  const eng = await ev(A, () => { const b = document.querySelector('#v-me .vn-aba-ct'), i = b.querySelector('svg').getBoundingClientRect(), r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after');
    return { ic: i.left + i.width / 2, bt: r.left + r.width / 2, after: a.left, sel: b.getAttribute('aria-selected') } });
  ok(eng.sel === 'true' && Math.abs(eng.ic - eng.bt) <= 1.5, 'engrenagem no meio da aba, em cima da linha da aba marcada', eng);
  // 4. Conta e ajustes
  const ct = await ev(A, () => { const c = document.querySelector('#v-me .pf-conta'), ab = document.querySelector('#v-me .vn-abas').getBoundingClientRect();
    const cards = [...c.querySelectorAll('.card')].filter(x => x.offsetParent);
    return { h: (c.querySelector('.pf165-h') || {}).textContent, prim: cards[0] && !!cards[0].querySelector('.cm-h'), guard: !!c.querySelector('[data-vgo="saved"]'), sete: /Seu Prumo nos últimos 7 dias/.test(c.textContent),
      curt: [...c.querySelectorAll('[data-minha="gostei"] span')].map(s => s.textContent).join(), topo: Math.round(ab.top), sair: !!c.querySelector('[data-sair]'), ativ: !!c.querySelector('[data-nt124ativ]') } });
  ok(ct.h === 'Conta e ajustes' && ct.prim && ct.sair, 'engrenagem: título "Conta e ajustes" e a parte Conta primeiro', ct);
  ok(!ct.guard && !ct.sete && ct.curt === 'curtidas', 'sem Guardados repetido, sem o quadro dos 7 dias; "curtidas" no lugar de "gostei"', ct);
  ok(ct.topo >= 0 && ct.topo <= 20, 'tocar na engrenagem leva a tela até as abas', ct);
  await U.foto(A, 'perfil-r2-conta');
  // 5. iPhone SE: as cinco abas cabem e a fileira tem respiro
  await A.setViewportSize({ width: 320, height: 568 }); await aba(A, 'conta');
  const se = await ev(A, () => { const ab = document.querySelector('#v-me .vn-abas'); const bs = [...document.querySelectorAll('#v-me .vn-pf .pf-bts .btn')].map(x => { const r = x.getBoundingClientRect(); return r.left >= 12 && r.right <= innerWidth - 12 && x.scrollWidth <= x.clientWidth + 1 });
    return { cabe: ab.scrollWidth <= ab.clientWidth + 1, bts: bs } });
  ok(se.cabe && se.bts.length === 2 && se.bts.every(Boolean), 'iPhone SE: as cinco abas cabem e os botões têm respiro', se);
  await U.foto(A, 'perfil-r2-se');
  await A.setViewportSize({ width: 390, height: 664 });
  // 6. letra grande vale no Perfil, nas Conversas e na Busca
  const tam = async () => ev(A, async () => { const fz = s => { const e = document.querySelector(s); return e ? parseFloat(getComputedStyle(e).fontSize) : 0 };
    go('me'); renderMe(); await new Promise(r => setTimeout(r, 200)); const o = { nome: fz('#v-me .vn-pf-nome'), num: fz('#v-me .vn-pf-num span') };
    go('msgs'); THREAD = null; renderMsgs(); await new Promise(r => setTimeout(r, 200)); o.dm = fz('#v-msgs .dm-h h1');
    go('busca'); await new Promise(r => setTimeout(r, 300)); o.bu = fz('#v-busca .bu154-it span, #v-busca .bv-g b'); return o });
  const t1 = await tam(); await ev(A, () => { PREF.fonte = 1.4; aplicarFonte() }); const t2 = await tam(); await ev(A, () => { PREF.fonte = 1; aplicarFonte() });
  ok(t2.nome > t1.nome && t2.num > t1.num && t2.dm > t1.dm && t2.bu > t1.bu && t1.bu > 0, 'letra grande aumenta Perfil, Conversas e Busca', { t1, t2 });
  // 7. modo escuro: "Nova publicação" sem fundo quase branco
  await A.emulateMedia({ colorScheme: 'dark' }); await ev(A, () => aplicarTema()); await aba(A, 'posts');
  const lum = await ev(A, () => { const c = getComputedStyle(document.querySelector('#v-me .pf-vz .btn')).backgroundColor.match(/\d+/g).map(Number); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 });
  ok(lum < 0.35, 'modo escuro: "Nova publicação" sem o bloco branco', lum);
  await U.foto(A, 'perfil-r2-escuro');
  await A.emulateMedia({ colorScheme: 'light' }); await ev(A, () => aplicarTema());
  // 8. Guardados: foto e editoria da Capa; abre a matéria por cima do Perfil
  const pid = await ev(A, async () => { const p = FEED.pautas[1]; p.foto = { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Teste_prumo.jpg', credito: 'Teste' }; await toggleSave(p.id); return p.id });
  await sleep(600); await aba(A, 'salvos');
  const gd = await ev(A, p => { const b = document.querySelector(`#v-me .gd161-nl [data-open="${p}"]`); return { foto: !!(b && b.querySelector('.svt.foto img, .svt > .ill')), ed: b && b.querySelector('.svx>span').textContent.split(' · ')[0], cap: capaChapeu(pautaById(p)) } }, pid);
  ok(gd.foto && gd.ed === gd.cap, 'Guardados: a mesma foto da Capa (sem rede aqui, a foto cai na ilustração da Capa) e a mesma editoria', gd);
  await ev(A, p => document.querySelector(`#v-me .gd161-nl [data-open="${p}"]`).click(), pid); await sleep(700);
  ok(await ev(A, () => VIEW === 'me' && !!document.querySelector('#layer .mat') && /Guardados/.test(document.querySelector('#layer .mat-v').textContent)), 'notícia guardada abre a matéria por cima do Perfil, com ‹ Guardados');
  await ev(A, () => document.querySelector('#layer .mat-v').click()); await sleep(500);
  ok(await ev(A, () => VIEW === 'me' && !document.querySelector('#layer').innerHTML && !!document.querySelector('#v-me .gd161-nl')), 'voltar da matéria cai nos Guardados');
  // 9. Atividade: a cobertura abre por cima e voltar volta para a Atividade
  const cob = await ev(A, () => FEED.pautas[0].id);
  await ev(A, () => abrirAtividade()); await sleep(500); await ev(A, c => atAcao({ acao: 'cob', pid: c }), cob); await sleep(700);
  ok(await ev(A, () => !!document.querySelector('#layer2 .sheet .pc') && !!document.querySelector('#layer .pfv-at')), 'Atividade: a cobertura abre por cima da Atividade');
  await A.goBack(); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv-at') && !document.querySelector('#layer2').innerHTML), 'voltar do celular volta para a Atividade');
  await ev(A, c => atAcao({ acao: 'cob', pid: c }), cob); await sleep(600); await ev(A, () => document.querySelector('#layer2 [data-close]').click()); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv-at')), 'Fechar a cobertura volta para a Atividade');
  await ev(A, c => atAcao({ acao: 'cob', pid: c }), cob); await sleep(600); await ev(A, () => document.querySelector('#layer2 [data-cobler]').click()); await sleep(800);
  ok(await ev(A, () => !!document.querySelector('#layer .mat') && !document.querySelector('#layer .pfv-at')), '"Ler a notícia" da cobertura abre a matéria (sem a Atividade por baixo)');
  await ev(A, () => closeLayer()); await sleep(400);
  // 10. Adicionar amigos: quem já é amigo
  await ev(A, () => abrirAddAmigos()); await sleep(500); await A.fill('#pq', 'Bia Souza'); await sleep(300); await clk(A, '#pbusca'); await sleep(1200);
  const am = await ev(A, () => { const bx = document.querySelector('#pbox'); return { ja: !!bx.querySelector('.pf165-ja [data-pf165conv]'), t: bx.innerText } });
  ok(am.ja && /Vocês já são amigos/.test(am.t) && !/Nenhuma sugestão|Ninguém no Prumo/.test(am.t), 'Adicionar amigos: o nome de um amigo mostra "Vocês já são amigos · Conversar"', am);
  await U.foto(A, 'perfil-r2-amigos');
  await A.fill('#pq', 'Fulano Inexistente'); await sleep(200); await clk(A, '#pbusca'); await sleep(1200);
  const nd = await ev(A, () => document.querySelector('#pbox').innerText);
  ok(/Confira a grafia/.test(nd) && !/digite o nome completo dela/.test(nd), 'sem resultado: não repete a instrução do topo', nd);
  await clk(A, '#pbox [data-convidar]').catch(() => {}); await ev(A, () => { while (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300);
  await ev(A, () => abrirAddAmigos()); await sleep(400); await A.fill('#pq', 'Bia'); await sleep(300); await clk(A, '[data-pf165conv]'); await sleep(600);
  ok(await ev(A, u => VIEW === 'msgs' && THREAD === u, uidB), '"Conversar" abre a conversa com o amigo');
  // 11. Conversas: o círculo não repete quem já está na lista
  await A.fill('#mtext', 'Oi Bia'); await clk(A, '#mform .send'); await sleep(900);
  await ev(A, () => { THREAD = null; go('msgs'); renderMsgs() }); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#v-msgs .dm-amg') && document.querySelectorAll('#v-msgs .dm-lista [data-thread]').length === 1), 'Conversas: sem o círculo que repetia a conversa da lista');
  // 12. opções da conversa: só um espaço entre os blocos
  await ev(A, u => abrirThMenu(u), uidB); await sleep(400);
  ok(await ev(A, () => { const p = document.querySelector('#layer .co160-pesado'); return !!p && getComputedStyle(p).borderTopWidth === '0px' }), 'opções da conversa: sem a linha a mais que parecia um item vazio');
  await U.foto(A, 'perfil-r2-opcoes'); await ev(A, () => closeLayer()); await sleep(300);
  // 13. entrar e criar conta
  await ev(B, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); abrirLogin('entrar') }); await sleep(300);
  await B.fill('#lemail', 'emailsemarroba'); await B.fill('#lsenha', '123456'); await ev(B, () => entrarConta()); await sleep(200);
  ok(await ev(B, () => document.querySelector('#lerro').textContent) === 'Falta o @ no e-mail.', 'e-mail sem @: "Falta o @ no e-mail."');
  await B.fill('#lemail', 'ze@'); await ev(B, () => entrarConta()); await sleep(200);
  ok(/falta algo depois do @/.test(await ev(B, () => document.querySelector('#lerro').textContent)), 'e-mail com @ e nada depois: aviso de antes');
  await ev(B, () => { closeLayer(); abrirLogin('criar') }); await sleep(300); await B.fill('#lcod', ''); await B.fill('#lnome', 'Zé'); await ev(B, () => criarConta()); await sleep(200);
  ok(/^Falta o código do convite/.test(await ev(B, () => document.querySelector('#lerro').textContent)), 'criar conta sem código: fala do código do convite');
  await ev(B, () => closeLayer());

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_perfil_r2: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
