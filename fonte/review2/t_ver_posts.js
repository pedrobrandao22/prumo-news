// Ver posts dos membros no jeito do Instagram (099): salvar, marcações com um toque, coração grande, comentários,
// curtidas, "Na conversa", aviso de menção, enviar (story/link/outros apps), grade do perfil, contador e local, legenda do criador.
// Portas 8960–8969. Capturas 390x844 com toque em shots-ig6/.
const C = require('./_vp_comum'); const { ev, sleep, rect, swipe, tapSel, esperar, U } = C; const { ok } = U;
const PORT = 8960;
const SH = __dirname + '/../shots-ig6/'; require('fs').mkdirSync(SH, { recursive: true });
const shot = async (p, nome, o) => { await p.screenshot({ path: SH + nome + '.png', ...(o || {}) }) };
const tap = (p, x, y) => p.touchscreen.tap(x, y);
(async () => {
  const X = await C.cenario(PORT); const { A, B, P3, P1, uidA, BASE } = X; const s3 = `[id="${P3}"]`;
  ok(!!P3 && !!P1, 'B vê no Feed o post de 3 fotos e o de 1 foto do Pedro', [P3, P1]);
  await ev(B, () => localStorage.setItem('prumo-teste-anim', '1'));
  const topo = async (sel) => { await ev(B, s => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 54) }, sel); await sleep(500) };
  await topo(s3);

  // ---- cartão: salvar visível, local encolhe antes da hora, "Na conversa" sem a legenda ----
  const card = await ev(B, s => { const p = document.querySelector(s), sv = p.querySelector('.acts [data-a="save"]'), q = p.querySelector('.dc122-qd, .vp99-qd'), nm = p.querySelector('.ph-nm');
    return { sv: !!sv && !sv.hidden && sv.getBoundingClientRect().width > 30, svLbl: sv && sv.getAttribute('aria-label'), qd: q && q.textContent, qdOk: q && q.scrollWidth <= q.clientWidth + 1 && q.getBoundingClientRect().width > 20 && q.getBoundingClientRect().right <= p.getBoundingClientRect().right,
      loc: (l => !!l && l.getBoundingClientRect().right <= p.getBoundingClientRect().right + 1 && l.scrollWidth <= l.clientWidth + 1)(p.querySelector('.dc122-loc > span, .vp99-loc')), nchat: p.querySelector('[data-nchat]').textContent.trim(), pg: !!p.querySelector('.car > .vp99-pg'),
      dots: (() => { const d = p.querySelector('.pdots').getBoundingClientRect(), c = p.querySelector('.car').getBoundingClientRect(); return Math.abs((d.left + d.width / 2) - (c.left + c.width / 2)) })() } }, s3);
  ok(card.sv && card.svLbl === 'Salvar', 'marcador de salvar aparece no post do amigo', card);
  ok(card.qdOk && /agora/.test(card.qd), 'a hora aparece inteira (o local é que encolhe)', card);
  ok(card.loc, 'local longo cabe no cartão (quebra a linha, 122)');
  ok(card.nchat === '', '"Na conversa" não repete a legenda (menção não conta)', card.nchat);
  ok(card.dots < 3, 'bolinhas do carrossel centradas debaixo da foto', card.dots);
  await shot(B, '01-post-feed');

  // ---- carrossel: contador 1/3 na foto enquanto desliza ----
  let r = await rect(B, s3 + ' .car');
  await swipe(B, r.x + r.w * .85, r.cy, r.x + r.w * .15, r.cy + 3, 8, 20); await sleep(450);
  ok(await ev(B, s => { const g = document.querySelector(s + ' .vp99-pg'); return g.classList.contains('on') && g.textContent === '2/3' }, s3), 'contador "2/3" aparece em cima da foto ao deslizar');
  await shot(B, '02-carrossel-contador');
  await sleep(1700); ok(await ev(B, s => !document.querySelector(s + ' .vp99-pg').classList.contains('on'), s3), 'contador some sozinho depois');
  await swipe(B, r.x + r.w * .15, r.cy, r.x + r.w * .85, r.cy + 3, 8, 20); await sleep(700);

  // ---- um toque mostra as marcações; dois toques curtem sem mexer nelas ----
  r = await rect(B, s3 + ' .car');
  await tap(B, r.x + r.w * .7, r.y + r.h * .3); await sleep(120);
  ok(await ev(B, s => !document.querySelector(s).classList.contains('tags-on'), s3), 'marcações esperam passar a janela do duplo toque');
  await sleep(350);
  ok(await ev(B, s => document.querySelector(s).classList.contains('tags-on'), s3), 'um toque na foto mostra quem está marcado');
  await shot(B, '03-toque-marcacoes');
  await tap(B, r.x + r.w * .7, r.y + r.h * .3); await sleep(500);
  ok(await ev(B, s => !document.querySelector(s).classList.contains('tags-on'), s3), 'outro toque esconde as marcações');
  await tap(B, r.cx, r.cy); await sleep(90); await tap(B, r.cx, r.cy); await sleep(160);
  const h = await ev(B, s => { const e = document.querySelector(s + ' .up-heart'); return e && { vp: e.classList.contains('vp99-h'), svg: !!e.querySelector('svg'), w: e.getBoundingClientRect().width } }, s3);
  ok(h && h.vp && h.svg, 'duplo toque: coração grande em SVG', h);
  await shot(B, '04-duplo-toque-coracao');
  await sleep(500);
  ok(await ev(B, s => { const p = document.querySelector(s); return p.querySelector('[data-a="like"]').classList.contains('on') && !p.classList.contains('tags-on') }, s3), 'duplo toque curte e não liga as marcações');
  ok(await ev(B, s => /Curtido por você/.test(document.querySelector(s + ' [data-likes]').textContent), s3), 'só você curtiu: "Curtido por você"');
  await sleep(500); await shot(B, '05-curtido-por-voce');

  // ---- comentários: folha alta, sem "Fechar" à vista, emojis rápidos, pílula de menção ----
  await tapSel(B, s3 + ' .acts [data-a=cmt]'); await sleep(700);
  const fl = await ev(B, () => { const sh = document.querySelector('.sheet.vp99-cm'), fx = sh && sh.querySelector('.sh-h [data-close]'); return sh && { h: sh.getBoundingClientRect().height, fx: fx && fx.getBoundingClientRect().width, emo: sh.querySelectorAll('[data-vp99emo]').length, grab: !!sh.querySelector('.grab') } });
  ok(fl && fl.h > 844 * .6 && fl.h < 844 * .8, 'folha de comentários abre em ~70% da tela', fl);
  ok(fl && fl.fx <= 1 && fl.grab, 'sem botão "Fechar" à vista (fica para leitor de tela/teclado), com alça', fl);
  ok(fl && fl.emo === 6, 'barra de emojis rápidos em cima do campo (6 com o foco, 105)');
  await ev(B, () => document.querySelector('#ctext').blur());
  await tapSel(B, '[data-vp99emo="👏"]'); await sleep(200);
  ok(await ev(B, () => document.querySelector('#ctext').value === '👏' && !document.querySelector('#cform .sendc').disabled), 'tocar no emoji põe no campo e libera o enviar');
  await shot(B, '06-comentarios-folha');
  await ev(B, () => { const i = document.querySelector('#ctext'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })) });
  await B.fill('#ctext', 'Que dia lindo! @Pedro'); await B.keyboard.press('Enter'); await sleep(1200);
  const pil = await ev(B, () => ({ p: document.querySelector('.vp99-pill')?.textContent || '', t: [...document.querySelectorAll('.toast')].map(x => x.textContent).join('|') }));
  ok(/Pedro Brandão foi avisado/.test(pil.p) && !/avisado/.test(pil.t), 'aviso de menção vira pílula pequena no topo (não cobre o comentário)', pil);
  await shot(B, '07-comentario-enviado-pilula');
  await sleep(2000); ok(await ev(B, () => !document.querySelector('.vp99-pill')), 'pílula some rápido');
  for (const t of ['Saudade desse lugar', 'Vamos de novo!']) { await B.fill('#ctext', t); await B.keyboard.press('Enter'); await sleep(700) }
  const g = await rect(B, '.sheet .grab'); await swipe(B, g.cx, g.cy, g.cx, g.cy + 300, 8, 16); await sleep(700);
  ok(await ev(B, () => !document.querySelector('.sheet')), 'arrastar a alça para baixo fecha os comentários');
  const vt = await ev(B, s => ({ l: document.querySelector(s + ' [data-cmts] > .link')?.textContent || '', nc: document.querySelector(s + ' [data-nchat]').textContent.trim() }), s3);
  ok(/Ver todos os 3 comentários/.test(vt.l), 'no Feed: "Ver todos os 3 comentários"', vt);
  ok(vt.nc === '', '"Na conversa" não repete o comentário com menção', vt);
  await ev(B, s => document.querySelector(s + ' .acts').scrollIntoView({ block: 'center' }), s3); await sleep(300); await shot(B, '08-feed-ver-todos');
  // o Pedro recebeu a menção na conversa normalmente
  ok(await esperar(A, () => (S.msgsIn || []).some(m => m.tipo === 'mencao' && /Que dia lindo/.test(m.texto)), null, 6000), 'Pedro recebe a menção por mensagem');

  // ---- salvar ----
  await tapSel(B, s3 + ' .acts [data-a="save"]'); await sleep(500);
  const sv = await ev(B, s => { const b = document.querySelector(s + ' .acts [data-a="save"]'); return { on: b.classList.contains('saved') && b.getAttribute('aria-pressed') === 'true', lbl: b.getAttribute('aria-label'), k: Object.keys(S.salvos).filter(k => k.startsWith('u:')), toast: document.querySelector('.toast')?.textContent || '' } }, s3);
  ok(sv.on && sv.k.length === 1 && 'p-' + sv.k[0] === P3 && /Salvo/.test(sv.toast), 'tocar no marcador salva o post (S.salvos com "u:")', sv);
  await shot(B, '09-salvo');
  await ev(B, () => go('me')); await sleep(400); await ev(B, () => vn112PfAba('salvos')); await sleep(600);
  const pf = await ev(B, () => ({ aba: !!document.querySelector('#v-me [data-vnpfaba="salvos"][aria-selected="true"], #v-me [data-pfaba="salvos"][aria-selected="true"]'), tiles: document.querySelectorAll('#v-me .pf-grade .pf-t').length, gd: document.querySelector('#v-me .vp99-gd')?.textContent || '' }));
  ok(pf.aba && pf.tiles === 1 && /Notícias guardadas/.test(pf.gd), 'aba Salvos no seu perfil: o post salvo e o atalho para as notícias guardadas', pf);
  await shot(B, '10-perfil-salvos');
  await tapSel(B, '#v-me .pf-grade .pf-t'); await sleep(900);
  ok(await ev(B, () => /Salvos/.test(document.querySelector('#layer .pfv-h b')?.textContent || '') && document.querySelectorAll('#layer .pfv-posts .upost').length === 1), 'tocar no salvo abre o post (título "Salvos")');
  await ev(B, () => history.back()); await sleep(600);
  await ev(B, () => go('saved')); await sleep(400);
  ok(await ev(B, () => !document.querySelector('#v-saved [data-open^="u:"]')), 'Guardadas (notícias) não mostra o post salvo');
  // depois de recarregar continua salvo; e o link #p= abre o post
  await B.goto('about:blank'); await B.goto(BASE + '#p=' + P3.slice(4)); await esperar(B, () => S.membro && PUB.carregou, null, 12000); await sleep(3500);
  const dl = await ev(B, s => { const e = document.querySelector(s); const b = e && e.getBoundingClientRect(); return { salvo: !!S.salvos[s.slice(7, -2)], top: b && Math.round(b.top), hash: location.hash } }, s3);
  ok(dl.salvo, 'post continua salvo depois de recarregar', dl);
  ok(dl.top != null && dl.top > -10 && dl.top < 200 && !dl.hash, 'link #p=… abre direto no post', dl);
  await ev(B, () => go('feed')); await sleep(300);
  await topo(s3);

  // ---- enviar: amigos + Story / Copiar link / Outros apps ----
  await tapSel(B, s3 + ' [data-usend]'); await sleep(600);
  const en = await ev(B, () => { const sh = document.querySelector('.sheet.vp99-env'); return sh && { bts: [...sh.querySelectorAll('.vp99-shr button')].map(b => b.textContent.trim()), form: getComputedStyle(sh.querySelector('#sform')).display } });
  ok(en && /^Adicionar ao (story|giro)\|Copiar link\|Outros apps$/.test(en.bts.join('|')) && en.form === 'none', 'enviar: linha Story / Copiar link / Outros apps; campo só depois de escolher', en);
  await shot(B, '11-enviar-folha');
  await tapSel(B, '#pick [data-pick]'); await sleep(250);
  ok(await ev(B, () => getComputedStyle(document.querySelector('#sform')).display !== 'none' && getComputedStyle(document.querySelector('.vp99-shr')).display === 'none'), 'ao escolher um amigo aparece a mensagem e o Enviar');
  await shot(B, '12-enviar-escolhido');
  await tapSel(B, '#pick [data-pick]'); await sleep(250);
  await tapSel(B, '[data-vp99link]'); await sleep(500);
  const lk = await ev(B, () => ({ t: document.querySelector('.toast')?.textContent || '', i: document.querySelector('.vp99-lk')?.value || '' }));
  ok(/Link copiado/.test(lk.t) || /#p=[0-9a-f-]{36}$/.test(lk.i), 'Copiar link copia (ou mostra) o link do post', lk);
  if (await ev(B, () => !!document.querySelector('.sheet'))) await ev(B, () => closeLayer()); await sleep(300);
  await tapSel(B, s3 + ' [data-usend]'); await sleep(500);
  await tapSel(B, '[data-vp99fora]'); await sleep(700);
  ok(await ev(B, () => /Post de Pedro Brandão no Prumo News/.test(document.querySelector('.sheet .env-bolha')?.textContent || '') && /#p=/.test(document.querySelector('.sheet .env-bolha').textContent)), 'Outros apps: sem compartilhar do sistema, abre o painel de WhatsApp/copiar com o link');
  await shot(B, '13-outros-apps');
  await ev(B, () => closeLayer()); await sleep(300);
  await tapSel(B, s3 + ' [data-usend]'); await sleep(500); await tapSel(B, '.vp99-shr [data-upstory]');
  ok(await esperar(B, () => typeof ED !== 'undefined' && ED && ED.modo === 'story' && (ED.st.els || []).some(e => e.t === 'pub'), null, 5000), 'Adicionar ao story abre o story com o post');
  await ev(B, () => { ED = null; closeLayer._ok = true; closeLayer() }); await sleep(500);

  // ---- perfil do amigo (em lista, 112); deslizar da borda fecha ----
  await ev(B, () => go('feed')); await topo(s3);
  await tapSel(B, s3 + ' .up-au .ph-nm b'); await sleep(1300);
  ok(await ev(B, () => !!document.querySelector('#layer .pfv .vn-pf') && !!document.querySelector('#layer .pfv .vn-pl > .post') && !document.querySelector('#layer [data-vnpfaba="salvos"], #layer [data-pfaba="salvos"]')), 'perfil do amigo abre em lista (sem a aba Salvos)');
  await shot(B, '14-perfil-amigo');
  await swipe(B, 6, 500, 300, 505, 10, 16); await sleep(700);
  ok(await ev(B, () => !document.querySelector('#layer .pfv') && VIEW === 'feed'), 'deslizar da borda fecha o perfil');
  await swipe(B, 6, 500, 300, 505, 10, 16); await sleep(300);
  ok(await ev(B, () => VIEW === 'feed'), 'deslizar no Feed (sem perfil aberto) não faz nada');

  // ---- notícia: só você gostou; comentários também na folha nova ----
  const np = await ev(B, () => document.querySelector('#posts .post:not(.upost)')?.dataset.pid);
  await ev(B, p => { document.getElementById('p-' + p).scrollIntoView({ block: 'center' }); document.querySelector(`[id="p-${p}"] .acts [data-a="like"]`).click() }, np); await sleep(700);
  ok(await ev(B, p => /Você gostou/.test(document.querySelector(`[id="p-${p}"] [data-likes]`).textContent), np), 'notícia que só você gostou: "Você gostou"');
  await ev(B, p => document.querySelector(`[id="p-${p}"] .acts [data-a="cmt"]`).click(), np); await sleep(600);
  ok(await ev(B, () => !!document.querySelector('.sheet.vp99-cm .vp99-emo')), 'comentários da notícia usam a mesma folha');
  await ev(B, () => closeLayer()); await sleep(300);
  await ev(B, p => document.querySelector(`[id="p-${p}"] .acts [data-a="save"]`).click(), np); await sleep(400);
  ok(await ev(B, p => !!S.salvos[p] && /Guardada/.test(document.querySelector('.toast')?.textContent || ''), np), 'guardar notícia continua igual');

  // ---- modo escuro (capturas) ----
  await B.emulateMedia({ colorScheme: 'dark' }); await sleep(300); await ev(B, () => go('feed')); await topo(s3); await shot(B, '17-escuro-post');
  await tapSel(B, s3 + ' .acts [data-a=cmt]'); await sleep(700); await ev(B, () => document.querySelector('#ctext').blur()); await sleep(200); await shot(B, '18-escuro-comentarios');
  await ev(B, () => closeLayer()); await sleep(300); await tapSel(B, s3 + ' [data-usend]'); await sleep(600); await shot(B, '19-escuro-enviar'); await ev(B, () => closeLayer()); await sleep(300);
  await B.emulateMedia({ colorScheme: 'light' });

  // ---- criador: legenda sem meia linha ----
  await ev(A, () => criarAbrir('post')); await sleep(400); await C.clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', [__dirname + '/../qa2/f2.jpg']); await esperar(A, () => ED.po.fotos.length === 1, null, 6000); await sleep(300);
  await C.clk(A, '[data-edav]'); await sleep(400); await C.clk(A, '[data-edav]'); await sleep(500);
  await A.fill('#ce-leg', 'Domingo de sol no Rio com a família toda reunida depois de muito tempo. Fomos ao Arpoador ver o pôr do sol, depois comemos pastel na feira e terminamos o dia conversando na varanda até tarde.'); await sleep(200);
  const lg = await ev(A, () => { const t = document.querySelector('#ce-leg'), cs = getComputedStyle(t), lh = parseFloat(cs.lineHeight), hh = parseFloat(cs.height); return { lh, hh, r: hh / lh, sh: t.scrollHeight, ch: t.clientHeight } });
  ok(lg.sh <= lg.ch + 1 && lg.hh >= 3 * lg.lh, 'legenda do post: caixa com linhas inteiras e cresce com o texto', lg);
  await shot(A, '16-criador-legenda');
  await A.fill('#ce-leg', 'Curta'); await sleep(150);
  ok(await ev(A, () => { const t = document.querySelector('#ce-leg'); return t.scrollHeight <= t.clientHeight + 1 }), 'legenda curta cabe inteira');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer() }); await sleep(300);

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_ver_posts: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await X.b.close(); X.srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
