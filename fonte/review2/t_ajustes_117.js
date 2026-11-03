// Ajustes 117 (03/11): 1. o aviso de atraso da Capa não pisca na abertura; 2. Relato no cartão A com quem postou primeiro.
// Parte 1 (visitante, site sem configuração, porta 8730): grava o DOM dos 2 primeiros segundos (MutationObserver posto antes da página)
//   em CPU normal e 4x mais lenta: edição velha + rodada recente → nenhum aviso; edição velha + rodada velha → o aviso entra uma vez e fica;
//   cópia velha + edição nova da rede → nenhum aviso; sem rede → "Sem conexão" (e nunca "Sem atualização"). Filme quadro a quadro.
// Parte 2 (dois membros, porta 8731): relato com 1 foto, 3 fotos (carrossel), sem foto, local longo, o próprio e o de amigo, Contexto do Prumo,
//   hashtag e menção, 360/390/430 px, claro/escuro, publicação aberta numa camada. Capturas 390x844 em qa/ajustes117/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const P1 = 8730, P2 = 8731, S0 = path.join(__dirname, '..', 'site-semconfig') + '/';
const QA = path.join(__dirname, '..', 'qa', 'ajustes117'); fs.mkdirSync(QA, { recursive: true });
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
const hhmmSP = ms => { const d = new Date(ms - 3 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + 'h' + String(d.getUTCMinutes()).padStart(2, '0') };
const hojeSP = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), horaSP = new Date(Date.now() - 3 * 3600e3).getUTCHours();
const ativo = horaSP >= 8 && horaSP <= 23;
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
let srv1 = null, srv2 = null;

async function parte1(br) {
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }
  srv1 = U.servir('site-semconfig', P1); await sleep(800);
  const feedRede = min => { const f = JSON.parse(JSON.stringify(real)); f.atualizado_em = spISO(Date.now() - min * 60e3); fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)); return f };
  const rodadas = min => { const it = {}; it[hhmmSP(Date.now() - min * 60e3)] = { tipo: 'rapida', status: 'sem_mudancas', publicou: false }; fs.writeFileSync(S0 + 'rodadas.json', JSON.stringify({ dia: hojeSP, itens: it })) };
  // abre a página com a cópia guardada (cache) e grava os estados do aviso (Capa e Feed) nos primeiros ms
  async function abre({ cache, cpu = 1, offline = false, quadros = null, ms = 2000 }) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    if (offline) await ctx.route(/feed\.json|rodadas\.json/, r => r.abort());
    await ctx.addInitScript(st => {
      try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1'); if (st) localStorage.setItem('radar-feed', st) } catch (e) { }
      window.__av = []; const t0 = performance.now(); let ult = '\u0000';
      const ve = () => { const c = document.querySelector('#v-capa .late'), f = document.querySelector('#posts .late');
        const s = (c ? 'C:' + (c.classList.contains('offl') ? 'OFF:' : '') + c.textContent.trim().slice(0, 30) : '') + '|' + (f ? 'F:' + f.textContent.trim().slice(0, 30) : '');
        if (s !== ult) { ult = s; window.__av.push([Math.round(performance.now() - t0), s]) } };
      new MutationObserver(ve).observe(document, { childList: true, subtree: true, characterData: true });
    }, cache ? JSON.stringify(cache) : null);
    const p = U.erros(await ctx.newPage(), 'p1'); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const fr = [];
    if (quadros) { let t0 = 0;  // quadros pintados de verdade (screencast do Chromium), com a hora de cada um
      cdp.on('Page.screencastFrame', f => { const t = f.metadata.timestamp * 1000; if (!t0) t0 = t; fr.push([Math.round(t - t0), f.data]); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => { }) });
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, everyNthFrame: 1 });
      await p.goto(`http://localhost:${P1}/index.html`); await sleep(quadros); await cdp.send('Page.stopScreencast').catch(() => { }) }
    else await p.goto(`http://localhost:${P1}/index.html`);
    await sleep(ms);
    const r = await ev(p, () => ({ ev: window.__av, capa: !!document.querySelector('#v-capa .cpi'), fim: (document.querySelector('#v-capa .late') || {}).textContent || '' }));
    return { ctx, p, cdp, fr, ...r } }
  // o aviso "de verdade" (atraso), em qualquer momento
  const atrasos = e => e.filter(([, s]) => /Sem atualiza/.test(s));
  const resumo = e => JSON.stringify(e).slice(0, 260);

  for (const cpu of [1, 4]) {
    // edição velha (3h20) na cópia e na rede, rodada há 15 min: nunca aparece
    const fv = feedRede(200); rodadas(15);
    let r = await abre({ cache: fv, cpu });
    ok(r.capa && atrasos(r.ev).length === 0, `CPU ${cpu}x: edição velha + rodada recente → o aviso nunca aparece nos 2 s (nem por um instante)`, resumo(r.ev));
    await r.ctx.close();
    // rodada velha (6h40): o aviso entra uma vez e fica
    rodadas(400); r = await abre({ cache: fv, cpu });
    const est = r.ev.map(([, s]) => /C:Sem atualiza/.test(s.split('|')[0]));
    const entradas = est.filter((v, i) => v && !est[i - 1]).length, saidas = est.filter((v, i) => !v && est[i - 1]).length;
    ok(ativo ? (entradas === 1 && saidas === 0 && /Sem atualiza/.test(r.fim)) : atrasos(r.ev).length === 0,
      `CPU ${cpu}x: edição velha + rodada velha → o aviso aparece uma vez e fica (horário ativo: ${ativo})`, resumo(r.ev));
    if (ativo) {
      await ev(r.p, () => { go('feed'); renderPosts() }); await sleep(300);
      ok(await ev(r.p, () => document.querySelectorAll('#posts .late:not(.offl)').length === 1), `CPU ${cpu}x: no Feed o aviso aparece uma vez`);
    }
    await r.ctx.close();
  }
  // cópia velha no aparelho, edição nova na rede (e rodada velha): nada de aviso
  { const fv = feedRede(300); const fn = feedRede(8); rodadas(400);
    const r = await abre({ cache: fv, cpu: 4 });
    ok(atrasos(r.ev).length === 0, 'cópia de 5 h no aparelho + edição nova na rede → o aviso não aparece (nem antes de a rede responder)', resumo(r.ev)); await r.ctx.close() }
  // primeira abertura (sem cópia) com rodada recente
  { feedRede(200); rodadas(15); const r = await abre({ cache: null, cpu: 4 });
    ok(r.capa && atrasos(r.ev).length === 0, 'primeira abertura sem cópia (edição velha, rodada recente) → sem aviso', resumo(r.ev)); await r.ctx.close() }
  // sem rede: "Sem conexão" aparece (e o aviso de atraso nunca)
  { const fv = feedRede(200); rodadas(400);
    const r = await abre({ cache: fv, cpu: 1, offline: true });
    ok(/OFF:Sem conex/.test(r.ev.map(x => x[1]).join(' ')) && atrasos(r.ev).length === 0 && /Sem conex/.test(r.fim), 'sem rede → "Sem conexão" na Capa (e nada de "Sem atualização")', resumo(r.ev));
    await r.ctx.close() }
  // filme: os primeiros 1,6 s em CPU 4x (rodada recente: nenhum quadro com o aviso; rodada velha: o aviso entra e fica)
  const filme = async (nome, rodMin) => { const fv = feedRede(200); rodadas(rodMin);
    const r = await abre({ cache: fv, cpu: 4, quadros: 1700, ms: 600 }); await r.cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const fr = r.fr.filter((x, i) => i % Math.max(1, Math.ceil(r.fr.length / 8)) === 0).slice(0, 8);
    console.log('  filme ' + nome + ': ' + r.fr.length + ' quadros pintados');
    const pg = await r.ctx.newPage(); await pg.setViewportSize({ width: 8 * 200 + 20, height: 470 });
    await pg.setContent(`<body style="margin:0;padding:10px;background:#222;font:600 13px sans-serif;color:#fff;display:flex;gap:4px">${fr.map(([t, b]) => `<figure style="margin:0;width:196px"><img src="data:image/jpeg;base64,${b}" style="width:196px;height:424px;object-fit:cover;object-position:top;display:block"><figcaption style="padding-top:4px">${t} ms</figcaption></figure>`).join('')}</body>`);
    await sleep(300); await pg.screenshot({ path: path.join(QA, nome + '.png') }); await r.ctx.close(); return r };
  const fa = await filme('filme-aviso-rodada-recente-cpu4', 15);
  ok(atrasos(fa.ev).length === 0, 'filme (CPU 4x, rodada recente): nenhum quadro com o aviso', resumo(fa.ev));
  const fb = await filme('filme-aviso-rodada-velha-cpu4', 400);
  ok(!ativo || /Sem atualiza/.test(fb.fim), 'filme (CPU 4x, rodada velha): o aviso termina na tela', resumo(fb.ev));
  srv1.kill(); srv1 = null;
}

// ===== Parte 2: Relato
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim', 'visual']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || `http://localhost:${P2}/index.html`); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
// fotos de mentira (data:) no lugar das assinadas do Storage, e a foto do perfil da Bia
const pinta = (P, uidB) => ev(P, async uidB => { await pubCarregar(); const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const g = cv.getContext('2d');
  const um = (cor, tx) => { g.fillStyle = cor; g.fillRect(0, 0, 800, 600); g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 64px sans-serif'; g.textAlign = 'center'; g.fillText(tx, 400, 320); return cv.toDataURL('image/jpeg', .7) };
  const cores = ['#2f7d5b', '#36589a', '#a3562a'];
  PUB.itens.forEach(x => x.fotos.forEach((f, i) => { PUB.urls[f] = { u: um(cores[i % 3], 'Foto ' + (i + 1) + (x.fotos.length > 1 ? ' de ' + x.fotos.length : '')), exp: Date.now() + 9e9 } }));
  const pf = uidB + '/perfil.jpg'; cv.width = cv.height = 120; g.fillStyle = '#c47a3d'; g.fillRect(0, 0, 120, 120); g.fillStyle = '#fde7d2'; g.beginPath(); g.arc(60, 48, 24, 0, 7); g.fill(); g.beginPath(); g.arc(60, 120, 44, 0, 7); g.fill();
  PUB.urls[pf] = { u: cv.toDataURL('image/jpeg', .8), exp: Date.now() + 9e9 }; if (S.membros[uidB]) S.membros[uidB].foto = pf }, uidB);
const feedA = (P) => ev(P, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 8; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
// estrutura de um post: a ordem dos filhos e o que há em cada parte
const estr = (P, sel) => ev(P, sel => { const a = document.querySelector(sel); if (!a) return null; const kids = [...a.children];
  const ix = s => kids.findIndex(k => k.matches(s)); const ph = a.querySelector(':scope>.ph'), tx = a.querySelector(':scope>.ac117-tx'), car = a.querySelector(':scope>.car'), meta = ph && ph.querySelector('.ac117-meta');
  const r = el => el ? el.getBoundingClientRect() : null, ar = r(a);
  return { rel: a.classList.contains('ac117-rel'), ph: ix('.ph'), tx: ix('.ac117-tx'), car: ix('.car'), ctx: ix('.fs2-ctx'), gut: ix('.gut:not(.ph)'),
    av: !!(ph && ph.querySelector('.up-au .av')), avImg: !!(ph && ph.querySelector('.up-au .av img')), avW: ph && ph.querySelector('.up-au .av') ? Math.round(r(ph.querySelector('.up-au .av')).width) : 0,
    nome: ph && (ph.querySelector('.ph-nm>b') || {}).textContent, meta: meta && meta.textContent.replace(/\s+/g, ' ').trim(), metaAbaixo: meta && ph.querySelector('.ph-nm>b') ? r(meta).top >= r(ph.querySelector('.ph-nm>b')).bottom - 1 : null,
    metaDentro: meta ? r(meta).right <= ar.right + 1 && r(meta).left >= ar.left - 1 : null,
    lb: !!(tx && tx.querySelector('.cn102-lb-rel')), tit: tx && (tx.querySelector('.ac117-tit') || {}).textContent, corpo: tx && (tx.querySelector('.ac117-corpo') || {}).textContent, nchk: !!(tx && tx.querySelector('.ac117-nchk')),
    ht: !!(tx && tx.querySelector('.ac117-corpo .ht-a')), men: !!(tx && tx.querySelector('.ac117-corpo .dm-at')),
    dup: a.querySelectorAll('.cn102-lt,.cn102-lm,.cn102-cd').length, sl: car ? car.querySelectorAll('.track>.sl').length : 0, dots: car ? car.querySelectorAll('.vn-dots i').length : 0,
    raio: car ? getComputedStyle(car).borderTopLeftRadius : '', fio: car ? getComputedStyle(car).borderTopWidth : '', acts: !!a.querySelector('.acts [data-a="like"]') && !!a.querySelector('.acts [data-vnrp]'),
    vaza: document.scrollingElement.scrollWidth - innerWidth, larg: ar.width } }, sel);
const ordemOk = e => e && e.rel && e.ph >= 0 && e.tx === e.ph + 1 && (e.car < 0 || e.car === e.tx + 1) && e.gut > Math.max(e.tx, e.car) && (e.ctx < 0 || (e.ctx > Math.max(e.tx, e.car) && e.ctx < e.gut));
async function mostra(P, id, nome, opt = {}) { for (let i = 0; i < 2; i++) { await ev(P, id => { const e = document.getElementById('p-u:' + id); const y = e.getBoundingClientRect().top + scrollY - 70; scrollTo({ top: y, behavior: 'instant' }) }, id); await sleep(opt.espera || 350) } await P.screenshot({ path: path.join(QA, nome + '.png') }) }

async function parte2(br) {
  { const f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')); const sp = spISO(Date.now() - 12 * 60e3); f.atualizado_em = sp; if (f.edicao) f.edicao = f.edicao.replace(/\d{2}h\d{2}/, sp.slice(11, 13) + 'h' + sp.slice(14, 16));
    fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f)) }
  srv2 = U.servir('site', P2); await sleep(800);
  const H = await require('../harness').criar();
  const A = U.erros(await H.pagina(br), 'A'), B = U.erros(await H.pagina(br), 'B');
  for (const P of [A, B]) await flags(P);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  for (const P of [A, B]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  const uidA = await ev(A, () => S.uid), uidB = await ev(B, () => S.uid); const now = Date.now();
  const tag = await ev(A, () => { const p = FEED.pautas.find(p => htDaPauta(p).length && (p.neutro.pontos || []).length); return p ? htDaPauta(p)[0] : '' });
  const fp = (u, n, k) => Array.from({ length: n }, (_, i) => `${u}/${k}-${i}.jpg`);
  const rel = (tit, corpo, local, q) => ({ v: 2, local, cn: { v: 1, k: 'rel', tit, q } });
  const [r1, r3, r0, rL, rC, plain] = await ins(B, [
    { tipo: 'post', at: now - 30 * 60e3, texto: 'Alagamento na Conde de Bonfim\n\nA rua encheu em 10 minutos depois da chuva forte. @Pedro Brandão, evita a Tijuca hoje. #Chuva', fotos: fp(uidB, 1, 'a'), estilo: rel('Alagamento na Conde de Bonfim', '', 'Tijuca, Rio de Janeiro', hojeSP + 'T14:30') },
    { tipo: 'post', at: now - 29 * 60e3, texto: 'Fila no posto\n\nTrês fotos da fila que dobrava o quarteirão desde as 7h.', fotos: fp(uidB, 3, 'b'), estilo: rel('Fila no posto', '', 'Tijuca, Rio de Janeiro', hojeSP + 'T09:10') },
    { tipo: 'post', at: now - 28 * 60e3, texto: 'Ônibus parado\n\nO 433 está parado há 20 minutos sem explicação. #Transporte', fotos: [], estilo: rel('Ônibus parado', '', 'Copacabana', hojeSP + 'T08:00') },
    { tipo: 'post', at: now - 27 * 60e3, texto: 'Obra na pista\n\nUma faixa fechada sem aviso.', fotos: fp(uidB, 1, 'c'), estilo: rel('Obra na pista', '', 'Estrada dos Bandeirantes, Vargem Grande, Rio de Janeiro', hojeSP + 'T07:45') },
    { tipo: 'post', at: now - 26 * 60e3, texto: `Movimento na praça\n\nMuita gente comentando ${tag}.`, fotos: fp(uidB, 1, 'd'), estilo: rel('Movimento na praça', '', 'Centro, Niterói', '') },
    { tipo: 'post', at: now - 25 * 60e3, texto: 'Pôr do sol no Arpoador hoje. Valeu a caminhada.', fotos: fp(uidB, 1, 'e'), estilo: { v: 2, local: 'Arpoador, Rio de Janeiro' } }]);
  const [rA] = await ins(A, [{ tipo: 'post', at: now - 20 * 60e3, texto: 'Fila no banco\n\nCaixa eletrônico sem dinheiro desde cedo.', fotos: fp(uidA, 1, 'f'), estilo: rel('Fila no banco', '', 'Botafogo', hojeSP + 'T11:05') }]);
  await pinta(A, uidB); await feedA(A); await sleep(900);

  // ===== estrutura
  const casos = [['1 foto (amiga)', r1, 1], ['3 fotos (amiga)', r3, 3], ['sem foto (amiga)', r0, 0], ['local longo', rL, 1], ['com Contexto do Prumo', rC, 1], ['o próprio', rA, 1]];
  for (const [n, id, nf] of casos) {
    const e = await estr(A, `#posts [id="p-u:${id}"]`);
    ok(ordemOk(e), `relato ${n}: cabeçalho → texto → ${nf ? 'mídia → ' : ''}${e && e.ctx >= 0 ? 'Contexto → ' : ''}ações`, JSON.stringify(e));
    ok(e && e.av && e.avW >= 34 && e.nome && e.lb && e.tit && e.nchk && e.dup === 0 && e.acts, `relato ${n}: bolinha (${e && e.avW}px) e nome em cima, selo Relato, título, aviso de relato pessoal, ações; sem a linha repetida embaixo`, JSON.stringify(e));
    if (nf) ok(e.sl === nf && e.raio === '12px' && e.fio === '0px', `relato ${n}: ${nf} foto(s), cantos de 12 px, sem fio de jornal`, JSON.stringify(e));
    else ok(e.sl === 0, `relato ${n}: sem o cartão colorido (o texto já está em cima)`, JSON.stringify(e));
  }
  const e1 = await estr(A, `#posts [id="p-u:${r1}"]`);
  ok(e1.avImg, 'relato da amiga: a bolinha mostra a foto do perfil (v8)', JSON.stringify(e1));
  ok(/hoje, 14h30/.test(e1.meta) && /Tijuca, Rio de Janeiro/.test(e1.meta) && e1.metaAbaixo && e1.metaDentro, 'cabeçalho: quando e onde embaixo do nome, dentro do cartão', e1.meta);
  ok(/A rua encheu/.test(e1.corpo) && !/Alagamento/.test(e1.corpo || '') && e1.tit === 'Alagamento na Conde de Bonfim', 'texto: título e o que a pessoa contou (sem repetir o título)', JSON.stringify(e1));
  ok(e1.ht && e1.men, 'texto: hashtag vira toque e a menção (@Pedro Brandão) fica marcada', JSON.stringify(e1));
  const e3 = await estr(A, `#posts [id="p-u:${r3}"]`);
  ok(e3.dots === 3, 'relato com 3 fotos: carrossel com 3 pontinhos', JSON.stringify(e3));
  const pas = await ev(A, id => { const t = document.querySelector(`[id="p-u:${id}"] .car .track`); const w = t.clientWidth; t.scrollTo({ left: w, behavior: 'instant' }); t.dispatchEvent(new Event('scroll')); return new Promise(r => setTimeout(() => r({ sl: Math.round(t.scrollLeft / w), on: [...t.closest('.car').querySelectorAll('.vn-dots i')].map(i => i.classList.contains('on') ? 1 : 0).join('') }), 500)) }, r3);
  ok(pas.sl === 1 && pas.on === '110', 'carrossel: deslizar para a 2ª foto acende o 2º pontinho', JSON.stringify(pas));
  await ev(A, id => { const t = document.querySelector(`[id="p-u:${id}"] .car .track`); t.scrollTo({ left: 0, behavior: 'instant' }) }, r3);
  const e0 = await estr(A, `#posts [id="p-u:${r0}"]`); ok(e0.ht && /20 minutos/.test(e0.corpo), 'sem foto: o texto inteiro com a hashtag', JSON.stringify(e0));
  const eC = await estr(A, `#posts [id="p-u:${rC}"]`);
  ok(!!tag && eC.ctx > eC.car && eC.ctx < eC.gut, 'Contexto do Prumo (' + tag + '): depois da foto e antes das ações', JSON.stringify(eC));
  const eL = await estr(A, `#posts [id="p-u:${rL}"]`); ok(/Vargem Grande/.test(eL.meta) && eL.metaDentro && eL.vaza <= 0, 'local longo: quebra a linha sem passar da borda', JSON.stringify(eL));
  const eP = await estr(A, `#posts [id="p-u:${plain}"]`);
  ok(eP && !eP.rel && eP.ph > 0, 'post comum de foto da amiga: continua como nota assinada (texto antes da assinatura)', JSON.stringify(eP));
  ok(await ev(A, () => !document.querySelector('#posts .vn-txt.ac117-corpo') && document.querySelectorAll('#posts .ac117-rel').length === 6), 'só os 6 relatos mudaram');

  // ===== larguras e tema
  for (const w of [360, 390, 430]) {
    await A.setViewportSize({ width: w, height: 844 }); await sleep(400);
    const l = await ev(A, () => [...document.querySelectorAll('#posts .ac117-rel')].map(a => { const ar = a.getBoundingClientRect(); const fora = [...a.querySelectorAll('.ph .ph-nm>*,.ac117-tx>*,.car')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > ar.right + 1 || r.left < ar.left - 1) }).length;
      const b = a.querySelector('.ph-nm>b'); return fora + (b && b.scrollWidth > b.clientWidth + 1 ? 1 : 0) }));
    const vz = await ev(A, () => document.scrollingElement.scrollWidth - innerWidth);
    ok(vz <= 0 && l.every(n => n === 0), `${w}px: nada passa da borda nos relatos e o nome não corta`, JSON.stringify({ vz, l }));
    if (w !== 390) await mostra(A, rL, `relato-local-longo-${w}`);
  }
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(300);
  // ===== camada (publicação aberta)
  await ev(A, id => vn112AbrePub(id), r3); await sleep(700);
  const eD = await estr(A, `#layer .pfv [id="p-u:${r3}"]`);
  ok(ordemOk(eD) && eD.dots === 3, 'publicação aberta numa camada: o mesmo cabeçalho primeiro, texto e carrossel', JSON.stringify(eD));
  await A.screenshot({ path: path.join(QA, 'depois-relato-aberto-camada.png') }); await ev(A, () => closeLayer()); await sleep(300);
  // perfil da amiga (lista de posts)
  // ===== capturas depois / antes
  await feedA(A); await sleep(600);
  await mostra(A, r1, 'depois-relato-1-foto'); await mostra(A, r3, 'depois-relato-3-fotos'); await mostra(A, r0, 'depois-relato-sem-foto'); await mostra(A, rA, 'depois-relato-proprio'); await mostra(A, rC, 'depois-relato-contexto');
  await ev(A, () => document.documentElement.setAttribute('data-aparencia', 'escuro')); await sleep(200);
  ok(await ev(A, id => { const a = document.querySelector(`[id="p-u:${id}"]`); const c = getComputedStyle(a.querySelector('.ac117-tit')).color, m = getComputedStyle(a.querySelector('.ac117-meta')).color, bg = getComputedStyle(document.body).backgroundColor;
    const lum = s => { const v = s.match(/[\d.]+/g).slice(0, 3).map(Number); return (v[0] * 299 + v[1] * 587 + v[2] * 114) / 1000 }; return lum(c) > 150 && lum(m) > 80 && lum(bg) < 80 }, r1), 'escuro: título claro, linha de quando/onde legível, fundo escuro');
  await mostra(A, r1, 'depois-relato-1-foto-escuro'); await mostra(A, r3, 'depois-relato-3-fotos-escuro');
  await ev(A, () => document.documentElement.removeAttribute('data-aparencia')); await sleep(200);
  await ev(A, () => { AC117_REL = false; renderPosts(true) }); await sleep(600); await pinta(A, uidB);
  await mostra(A, r1, 'antes-relato-1-foto'); await mostra(A, r3, 'antes-relato-3-fotos'); await mostra(A, r0, 'antes-relato-sem-foto');
  await ev(A, () => document.documentElement.setAttribute('data-aparencia', 'escuro')); await mostra(A, r1, 'antes-relato-1-foto-escuro');
  await ev(A, () => { document.documentElement.removeAttribute('data-aparencia'); AC117_REL = true; renderPosts(true) }); await sleep(600);
  // ===== comparação (não vai para o app): post comum de foto com o mesmo cabeçalho primeiro, montado só nesta página
  await mostra(A, plain, 'comparar-post-foto-hoje');
  await ev(A, id => { const a = document.querySelector(`[id="p-u:${id}"]`); const ph = a.querySelector(':scope>.ph'), tx = a.querySelector(':scope>.vn-txt'), car = a.querySelector(':scope>.car');
    a.classList.add('cmp117'); a.prepend(ph); if (tx) ph.after(tx); if (car && tx) tx.after(car);
    const st = document.createElement('style'); st.textContent = `html.vn-ca .post.cmp117>.ph{padding-block:12px 6px}html.vn-ca .post.cmp117>.ph .up-au .av{width:36px;height:36px;font-size:15px}html.vn-ca .post.cmp117>.ph .ph-nm{flex-direction:column;align-items:flex-start;gap:2px}html.vn-ca .post.cmp117>.ph .ph-nm>b{font:700 15px/1.25 var(--f-ui)}html.vn-ca .post.vn-cp.cmp117>.ph .ph-nm>.ph-sub::before{content:none}html.vn-ca .post.cmp117>.vn-txt{margin:2px var(--gut,16px) 12px;font:400 16px/1.5 var(--f-body)}html.vn-ca .post.cmp117>.vn-txt::before{display:none}`; document.head.appendChild(st) }, plain);
  await mostra(A, plain, 'comparar-post-foto-cabecalho-primeiro-NAO-APLICADO');
  ok(A._erros.length === 0 && B._erros.length === 0, 'sem erros de JavaScript', JSON.stringify(A._erros.concat(B._erros)).slice(0, 300));
  srv2.kill(); srv2 = null;
}

(async () => {
  const br = await U.navegador();
  try { await parte1(br); await parte2(br) } catch (e) { console.log('FAIL exceção', e && e.stack) }
  try { await br.close() } catch (e) { }
  if (srv1) srv1.kill(); if (srv2) srv2.kill();
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0)
})();
