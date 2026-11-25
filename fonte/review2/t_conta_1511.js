// Conta, convite, entrar e conversas (160, 15/11 noite). Portas 8660–8661.
// Visitante: Conversas/Guardadas/Perfil com convite e "curtir"; entrar diz o motivo (repostar, curtir); esqueci a senha
// manda o e-mail de redefinição e a volta do link abre "Criar uma senha nova"; link de convite com boas-vindas e, com a
// proposta de SQL, convite conferido antes de criar a conta; link de post com prévia. Membro: campo de mensagem que
// cresce; opções da conversa; Nova conversa com caminhos; perfil do amigo; botões do perfil; Melhores amigos; nome vazio;
// folhas sólidas sem a barra de baixo; guia da primeira visita antes das notícias e deitado sem cortar.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const fs = require('fs'), path = require('path');
const PORTA = 8660, BASE = `http://localhost:${PORTA}/index.html`;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const txLayer = p => ev(p, () => (document.querySelector('#layer') || {}).innerText || '');
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
async function visitante(H, b, o = {}) { const p = U.erros(await H.pagina(b, o), 'V'); return p }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();

  // ===== visitante, banco sem a proposta =====
  const V = await visitante(H, b);
  await V.goto(BASE); await esperar(V, () => document.querySelectorAll('.post').length > 0 && INIT_FIM); await sleep(400);
  await ev(V, () => go('msgs')); await sleep(300);
  ok(await ev(V, () => !!document.querySelector('#v-msgs [data-entrar="criar"]') && /convite/.test(document.querySelector('#v-msgs').innerText)), 'Conversas sem conta: "Criar conta com convite" e como conseguir convite');
  await U.foto(V, 'conta-conversas-visitante');
  await ev(V, () => go('me')); await sleep(300);
  ok(await ev(V, () => { const t = document.querySelector('#v-me').innerText; return /curtir/.test(t) && !/gostar/.test(t) }), 'Perfil sem conta diz "curtir", não "gostar"');
  await ev(V, () => go('saved')); await sleep(300);
  ok(await ev(V, () => { const t = document.querySelector('#v-saved').innerText; return /precisa de conta/.test(t) && !/alfinete/.test(t) && !!document.querySelector('#v-saved [data-entrar="criar"]') }), 'Guardadas sem conta: diz que guardar precisa de conta');
  await ev(V, () => go('feed')); await sleep(500);
  await clk(V, '#v-feed [data-vnrp]'); await sleep(400);
  ok(/Para repostar, entre/.test(await txLayer(V)), 'Repostar sem conta: o entrar diz por quê', (await txLayer(V)).slice(0, 120));
  await ev(V, () => closeLayer()); await sleep(250);
  await clk(V, '#v-feed [data-a="like"]'); await sleep(400);
  ok(/Para curtir, entre/.test(await txLayer(V)), 'Curtir sem conta: o entrar diz por quê');
  await ev(V, () => closeLayer()); await sleep(250);
  // esqueci a senha
  await ev(V, () => { window.__co160rs = null; const a = window.__sbClient.auth; a.resetPasswordForEmail = async (em, o) => { window.__co160rs = { em, o }; return { data: {}, error: null } } });
  await clk(V, '#v-feed [data-a="like"]'); await sleep(300); await V.fill('#lemail', 'bia@x.com'); await V.fill('#lsenha', 'errada'); await clk(V, '#lform [type=submit]'); await sleep(400);
  await V.fill('#lemail', ''); await clk(V, '[data-esqueci]'); await sleep(200);
  ok(await ev(V, () => { const e = document.querySelector('#lerro'), p = document.querySelector('#lesq'); return e.hidden && !p.hidden && /Escreva o seu e-mail/.test(p.textContent) && !/Pedro/.test(p.textContent) && !window.__co160rs }), 'Esqueci a senha sem e-mail: pede o e-mail e limpa o erro anterior');
  await V.fill('#lemail', 'bia@x.com'); await clk(V, '[data-esqueci]'); await sleep(300);
  ok(await ev(V, () => window.__co160rs && window.__co160rs.em === 'bia@x.com' && /^http:\/\/localhost:\d+\/index\.html$/.test(window.__co160rs.o.redirectTo) && /bia@x\.com/.test(document.querySelector('#lesq').textContent)), 'Esqueci a senha: manda o e-mail de redefinição com a volta para o site', await ev(V, () => window.__co160rs));
  await U.foto(V, 'conta-esqueci');
  await ev(V, () => closeLayer());

  // ===== Pedro (fundador) e convite =====
  const A = U.erros(await H.pagina(b), 'A'); await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  const link = await convite(A);
  await ev(A, () => go('me')); await sleep(200); await clk(A, '[data-convidar]'); await sleep(200);
  ok(/ela cria a conta por ali/.test(await txLayer(A)), 'Convidar alguém: texto sem o "por ele"'); await ev(A, () => closeLayer());
  // sem a função no banco: boas-vindas, sem aviso de convite
  const V0 = await visitante(H, b); await V0.goto(BASE.replace('index.html', 'index.html?convite=ZZZZ9999')); await esperar(V0, () => !!document.querySelector('#lcod'), null, 8000); await sleep(500);
  ok(await ev(V0, () => /Você recebeu um convite/.test(document.querySelector('#layer .co160-bv')?.textContent || '') && document.querySelector('#co160cvst').hidden), 'link de convite (sem a função): boas-vindas e nenhum aviso falso');
  await V0.close();

  // ===== com a proposta de SQL =====
  await H.db.exec(fs.readFileSync(path.join(__dirname, '..', 'sql', 'proposta-2026-11-15-convite.sql'), 'utf8'));
  const n0 = (await H.sql('select count(*)::int n from auth.users'))[0].n;
  const V1 = await visitante(H, b); await V1.goto(BASE.replace('index.html', 'index.html?convite=ZZZZ9999')); await esperar(V1, () => !!document.querySelector('#lcod'), null, 8000);
  ok(await esperar(V1, () => /Não achamos este convite/.test(document.querySelector('#co160cvst')?.textContent || '') && !document.querySelector('#co160cvst').hidden, null, 4000), 'convite que não existe: avisa logo ao abrir o link');
  await V1.fill('#lnome', 'Zé'); await V1.fill('#lemail', 'z@x.com'); await V1.fill('#lsenha', '123456'); await clk(V1, '#lform [type=submit]'); await sleep(700);
  ok((await H.sql('select count(*)::int n from auth.users'))[0].n === n0 && await ev(V1, () => /não foi criada/.test(document.querySelector('#lerro').textContent) && !S.uid), 'convite inválido: a conta NÃO é criada', await ev(V1, () => document.querySelector('#lerro').textContent));
  await U.foto(V1, 'conta-convite-invalido'); await V1.close();
  const B = U.erros(await H.pagina(b, { dark: true }), 'B');
  await B.goto(link); await esperar(B, () => !!document.querySelector('#lcod'), null, 8000);
  ok(await esperar(B, () => /Pedro te convidou/.test(document.querySelector('#layer .co160-bv b')?.textContent || '') && /Convite de Pedro/.test(document.querySelector('#co160cvst')?.textContent || ''), null, 4000), 'convite válido: "Pedro te convidou para o Prumo"');
  await U.foto(B, 'conta-convite-valido');
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  ok(await esperar(B, u => S.membro && S.amigos.has(u), uidA, 6000), 'com o convite válido a conta é criada e já são amigos');

  // ===== link de post sem conta =====
  const pid0 = await ev(A, () => FEED.pautas[0].id);
  const pubId = (await H.sql(`insert into public.publicacoes(autor,tipo,texto,pid) values ($1,'post','meu comentário secreto',$2) returning id`, [uidA, pid0]))[0].id;
  const V2 = await visitante(H, b); await V2.goto(BASE + '#p=' + pubId);
  ok(await esperar(V2, () => /(Post|Publicação) de Pedro/.test(document.querySelector('#layer .co160-pp')?.textContent || '') && !!document.querySelector('#layer [data-co160lern]'), null, 9000), 'link de post sem conta: prévia com quem postou e a notícia', await txLayer(V2));
  ok(!/secreto/.test(await txLayer(V2)) && /peça um convite/.test(await txLayer(V2)), 'a prévia não mostra o texto do post e diz como conseguir convite');
  await U.foto(V2, 'conta-post-previa');
  await clk(V2, '[data-co160lern]');
  ok(await esperar(V2, t => (document.querySelector('#layer')?.innerText || '').includes(t) && !document.querySelector('#layer .sheet #lform'), await ev(V2, p => versao(pautaById(p), lente()).titulo, pid0), 5000), 'tocar na notícia da prévia abre a matéria');
  await V2.close();
  const V3 = await visitante(H, b); await V3.goto(BASE + '#p=00000000-0000-0000-0000-000000000000');
  ok(await esperar(V3, () => /não está mais disponível/.test(document.querySelector('#layer .co160-pp')?.textContent || '') || (/não está mais disponível/.test(document.querySelector('#layer')?.innerText || '') && !document.querySelector('#layer #lform')), null, 9000), 'post que não existe: diz que não está mais disponível (19/11: sem o formulário de entrar)'); await V3.close();

  // ===== volta do link de senha nova =====
  const V4 = await visitante(H, b);
  await V4.context().addInitScript(() => { const a = window.__sbClient && window.__sbClient.auth; if (!a) return; a.setSession = async () => a.signInWithPassword({ email: 'b@x.com', password: '123456' }); a.updateUser = async o => { window.__co160pw = o.password; return { data: {}, error: null } } });
  await V4.goto(BASE + '#access_token=abc&refresh_token=def&expires_in=3600&token_type=bearer&type=recovery');
  ok(await esperar(V4, () => /Criar uma senha nova/.test(document.querySelector('#layer')?.innerText || '') && !/access_token/.test(location.href), null, 10000), 'volta do link: abre "Criar uma senha nova" e limpa o endereço', await txLayer(V4));
  await V4.fill('#co160s1', 'novasenha'); await V4.fill('#co160s2', 'outra'); await clk(V4, '#co160sf [type=submit]'); await sleep(200);
  ok(/não são iguais/.test(await ev(V4, () => document.querySelector('#co160serr').textContent)), 'senhas diferentes: avisa');
  await V4.fill('#co160s2', 'novasenha'); await clk(V4, '#co160sf [type=submit]'); await sleep(400);
  ok(await ev(V4, () => window.__co160pw === 'novasenha' && !document.querySelector('#layer').innerHTML && S.uid), 'senha nova salva e a pessoa fica dentro'); await V4.close();
  const V5 = await visitante(H, b); await V5.goto(BASE + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
  ok(await esperar(V5, () => /não vale mais/.test(document.querySelector('#layer')?.innerText || ''), null, 9000), 'link vencido: explica e oferece entrar de novo'); await V5.close();

  // ===== conversas =====
  await ev(B, u => { go('msgs'); abrirConversa(u) }, uidA); await sleep(600);
  ok(await ev(B, () => document.querySelector('#mtext').tagName === 'TEXTAREA'), 'campo de mensagem é uma caixa de várias linhas');
  const longo = 'Oi Pedro, li a matéria sobre o ajuste fiscal e achei que o resumo neutro ficou muito bom, mas queria entender melhor o que muda para quem é servidor e se vale a pena revisar o que escreveu antes de mandar.';
  await B.click('#mtext'); await B.keyboard.type(longo, { delay: 0 }); await sleep(200);
  const alt = await ev(B, () => { const t = document.querySelector('#mtext'); const r = t.getBoundingClientRect(); return { h: r.height, sh: t.scrollHeight } });
  ok(alt.h > 60 && alt.h <= 134, 'mensagem longa: a caixa cresce (até 5 linhas)', alt);
  await U.foto(B, 'conta-mensagem-longa');
  await B.keyboard.press('Enter'); await sleep(800);
  ok(await ev(B, t => allMsgs().some(m => m.texto === t) && document.querySelector('#mtext').value === '' && document.querySelector('#mtext').getBoundingClientRect().height < 50, longo), 'Enter manda e a caixa volta a uma linha');
  await ev(B, u => abrirThMenu(u), uidA); await sleep(300);
  ok(await ev(B, () => { const L = document.querySelector('#layer'); return /Conversa com Pedro$/m.test(L.querySelector('.sh-h').innerText.trim().split('\n')[0]) && !!L.querySelector('[data-co160pf]') && !L.querySelector('[data-denp]') && !/recebe e analisa/.test(L.innerText) && !/Bloquear Pedro/.test(L.innerText) }), 'opções da conversa: Ver perfil, título curto, sem "Denunciar" o administrador', await txLayer(B));
  ok(await ev(B, () => { const s = getComputedStyle(document.querySelector('#layer .sheet')).backgroundColor; const m = s.match(/rgba?\(([^)]+)\)/); const a = m && m[1].split(',').map(Number); return (!a || a.length < 4 || a[3] === 1) && document.body.classList.contains('co160-folha') && getComputedStyle(document.querySelector('.nav')).visibility === 'hidden' }), 'folha com fundo sólido e a barra de baixo escondida');
  await U.foto(B, 'conta-opcoes-conversa');
  await clk(B, '[data-co160pf]'); await sleep(900);
  ok(await ev(B, () => !!document.querySelector('#layer .pfv') && !!document.querySelector('#layer .pfv .co160-am')), 'Ver perfil abre o perfil, que mostra "Amigos ✓"');
  ok(await ev(B, () => { const c = document.querySelector('#layer .pfv .cs123-num'); return !c || c.hidden }), 'perfil do amigo: sem "0 seguidores · 0 seguindo"');
  await U.foto(B, 'conta-perfil-amigo');
  await ev(B, () => closeLayer()); await sleep(300);
  ok(await ev(B, () => !document.body.classList.contains('co160-folha') && getComputedStyle(document.querySelector('.nav')).visibility !== 'hidden'), 'sem folha: a barra de baixo volta');
  await ev(A, u => abrirThMenu(u), uidB); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#layer [data-denp]') && !/Denunciar Bia/.test(document.querySelector('#layer').innerText) && /lista da Administração/.test(document.querySelector('#layer [data-denp]').textContent)), 'para os outros, "Denunciar" continua (rótulo curto; o admin lê que fica na lista dele)');
  await ev(A, () => closeLayer());
  await ev(B, () => { THREAD = null; go('msgs'); renderMsgs(); abrirNovaConversa() }); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('#layer .co160-novos [data-addamigos]') && !!document.querySelector('#layer .co160-novos [data-convidar]')), 'Nova conversa: "Adicionar amigos" e "Convidar alguém"');
  await U.foto(B, 'conta-nova-conversa'); await ev(B, () => closeLayer()); await sleep(200);
  await B.fill('#dmq', 'zzqq'); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('#v-msgs .co160-novos [data-convidar]')), 'busca sem resultado: oferece adicionar e convidar');
  await B.fill('#dmq', ''); await sleep(200);
  ok(await ev(B, p => { const h = dmCard({ pid: p, snap: { secao: 'economia', titulo: 'x' } }); return h.includes('>' + esc(capaChapeu(pautaById(p))) + '</small>') }, pid0), 'cartão de notícia na conversa: a editoria da Capa');

  // ===== perfil próprio, melhores amigos, nome, salvos =====
  await B.setViewportSize({ width: 320, height: 568 }); await ev(B, () => { go('me'); renderMe() }); await sleep(500);
  ok(await ev(B, () => { return !document.querySelector('#v-me .pf-bts [data-criarde="post"]') && document.querySelectorAll('#v-me [data-criarde="post"]').length === 1 && !!document.querySelector('#v-me .pf-vz [data-criarde="post"]') }), 'perfil sem posts: um "Nova publicação" só');
  ok(await ev(B, () => [...document.querySelectorAll('#v-me .co160-bts .btn')].filter(x => !x.hidden).every(x => { const r = x.getBoundingClientRect(); return r.left >= 8 && r.right <= innerWidth - 8 && x.scrollWidth <= x.clientWidth + 1 })), 'botões do perfil cabem no iPhone SE com respiro');
  await U.foto(B, 'conta-perfil-se');
  await B.setViewportSize({ width: 390, height: 844 });
  await ev(B, () => ra114MaAbrir()); await sleep(600);
  ok(await ev(B, () => /Toque em quem você quer pôr na lista/.test(document.querySelector('#layer').innerText) || /não está disponível/.test(document.querySelector('#layer').innerText)), 'Melhores amigos explica que é para tocar');
  await ev(B, () => closeLayer()); await sleep(200);
  await ev(B, () => abrirNome()); await sleep(300); await B.fill('#ntext', '   '); await sleep(100);
  ok(await ev(B, () => document.querySelector('#nform [type=submit]').disabled), 'nome vazio: Salvar desligado');
  await ev(B, () => { const f = document.querySelector('#nform'); f.querySelector('[type=submit]').disabled = false; f.requestSubmit() }); await sleep(200);
  ok(await ev(B, () => /Escreva seu nome/.test(document.querySelector('#co160nerr').textContent) && !document.querySelector('#co160nerr').hidden && !!document.querySelector('#nform')), 'nome vazio: avisa "Escreva seu nome" e a folha fica aberta');
  await ev(B, () => closeLayer());
  ok(await ev(B, () => { const h = pfTiles([], 'salvos', S.uid); return /data-gd161="noticias"/.test(h) && /data-gd161="posts"/.test(h) && /Guardar/.test(h) }), 'Guardados: uma lista só, com filtro Notícias e Posts');

  // ===== guia da primeira visita =====
  const ctx = await b.newContext({ viewport: { width: 844, height: 340 }, hasTouch: true, colorScheme: 'dark' });
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-tourvis', '1'));
  await ctx.route('**/feed-leve.json*', async r => { await sleep(2500); r.continue() }); await ctx.route('**/feed.json*', async r => { await sleep(2500); r.continue() });
  const G = await ctx.newPage(); G.on('pageerror', e => console.log('PAGEERROR[G]', e.message)); await G.goto(BASE);
  ok(await esperar(G, () => !!document.querySelector('.tour') && !document.querySelector('.post'), null, 2400), 'rede lenta: o guia aparece antes das notícias, não por cima delas');
  await sleep(300);
  const g = await ev(G, () => { const t = document.querySelector('.tr-t'), p = t.querySelector('p').getBoundingClientRect(), d = t.querySelector('.tr-demo').getBoundingClientRect(), pe = document.querySelector('.tr-pe').getBoundingClientRect(); return { pb: p.bottom, pe: pe.top, dt: d.top, dr: d.right, pl: p.left, tt: t.getBoundingClientRect().top } });
  ok(g.pb <= g.pe + 1 && g.dt >= g.tt && g.dr <= g.pl, 'celular deitado: desenho e texto lado a lado, a frase inteira à vista', g);
  await G.screenshot({ path: path.join(U.SHOTS, 'conta-guia-deitado.png') });
  await ctx.close();

  for (const [p, n] of [[V, 'V'], [A, 'A'], [B, 'B']]) ok(!p._erros.length, 'sem erros ' + n + ' ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_conta_1511: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
