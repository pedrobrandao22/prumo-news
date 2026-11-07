// Placar oficial automático (118): o robô de dados públicos (tools/oficiais.py, com as respostas gravadas em
// tools/fixtures/oficiais/) grava oficiais.json com o placar pronto; o app mostra o bloco "Placar oficial" na matéria e a
// linha curta no cartão A do Feed, sem rodada e sem IA. Visitante (site sem configuração), flags de produção
// (visual novo, cartão A, fase 2, foco). Portas 8732–8733. Capturas (390×844) em qa/placar/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process'); const os = require('os');
const PORTA = 8732, PORTA2 = 8733, S0 = path.join(__dirname, '..', 'site-semconfig') + '/', S1 = path.join(__dirname, '..', 'site') + '/';
const QA = path.join(__dirname, '..', 'qa', 'placar'); fs.mkdirSync(QA, { recursive: true });
const PID = 'pec-seguranca-ccj';
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + '-03:00';
const hhmm = ms => { const d = new Date(ms - 3 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + 'h' + String(d.getUTCMinutes()).padStart(2, '0') };
let srv = null, srv2 = null;
(async () => {
  // 1) o robô, offline: feed de teste + respostas gravadas das APIs da Câmara e do Senado
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'po118-'));
  const mini = JSON.parse(fs.readFileSync(U.REPO + '/tools/fixtures/feed_mini.json', 'utf8'));
  fs.writeFileSync(tmp + '/feed.json', JSON.stringify(mini));
  cp.execFileSync('python3', ['-I', U.REPO + '/tools/oficiais.py', tmp + '/feed.json', tmp + '/oficiais.json', '--fixtures', U.REPO + '/tools/fixtures/oficiais', '--agora', '2026-11-04T19:40-03:00']);
  const ROBO = JSON.parse(fs.readFileSync(tmp + '/oficiais.json', 'utf8'));
  const ev = id => JSON.parse(JSON.stringify(ROBO.eventos.find(e => e.id === id)));
  const e1 = ev('senado-vot-7001'), e2 = ev('senado-vot-7002'), es = ev('camara-vot-2407777-2');
  ok(e1 && e1.placar && e1.placar.sim === 62 && e1.placar.nao === 9 && e1.placar.turno === '1º' && e1.pid === PID && e1.confianca === 'palavras', 'robô: votação do Senado (PEC 18/2025, 1º turno, 62 a 9) com o placar pronto e ligada à pauta', e1 && e1.placar);
  // horários de agora (o fixture é de 03/11): 1º turno há 50 min, 2º turno há 8 min, com a hora da própria votação
  const T1 = Date.now() - 50 * 60e3, T2 = Date.now() - 8 * 60e3;
  const quando = (e, t) => { e.quando = spISO(t); e.placar.quando = spISO(t); e.placar.hora_exata = true; return e };
  quando(e1, T1); quando(e2, T2);
  const ofic = eventos => JSON.stringify({ ...ROBO, gerado: spISO(Date.now()), eventos });
  // 2) o feed do app: o real do repositório, com a pauta da PEC (do feed de teste) no alto
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const pauta = (extra = {}) => ({ ...JSON.parse(JSON.stringify(mini.pautas.find(p => p.id === PID))), hora: spISO(Date.now() - 30 * 60e3), prioridade: 99, ...extra });
  const feed = pt => { const f = JSON.parse(JSON.stringify(real)); f.pautas = [pt].concat(f.pautas.filter(p => p.id !== PID)); f.atualizado_em = spISO(Date.now() - 5 * 60e3);
    fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)) };
  const put = txt => { if (txt == null) { try { fs.unlinkSync(S0 + 'oficiais.json') } catch (e) { } } else fs.writeFileSync(S0 + 'oficiais.json', txt) };
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }

  srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  const abre = async (o = {}) => { const ctx = await br.newContext({ viewport: { width: o.w || 390, height: 844 }, hasTouch: true, colorScheme: o.escuro ? 'dark' : 'light' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.addInitScript(o2 => { try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', o2.f2 === false ? '0' : '1') } catch (e) { } }, o);
    const p = U.erros(await ctx.newPage(), o.nome || 'a'); await p.goto(`http://localhost:${o.porta || PORTA}/index.html`);
    await esperar(p, () => typeof FEED !== 'undefined' && FEED && document.querySelector('#v-capa .cpi'), null, 12000); await sleep(1500); return { ctx, p } };
  const mat = p => p.evaluate(pid => { abrirMateria(pid); const m = document.querySelector('#layer .mat'), b = m && m.querySelector('.po118');
    return { tem: !!b, txt: b ? b.innerText : '', leg: b ? [...b.querySelectorAll('.acv-leg li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()) : [], svg: !!(b && b.querySelector('svg.acv-pl')),
      min: !!(b && b.querySelector('.acv-min')), res: b ? (b.querySelector('.acv-res') || {}).textContent || '' : '', sw: b ? [...b.querySelectorAll('[data-po118t]')].map(x => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')) : [],
      placares: m ? m.querySelectorAll('.acv-placar_votacao').length : 0, cap: [...document.querySelectorAll('#layer .fs2-cap-b')].map(x => x.textContent.replace(/^\d+/, '')),
      larg: m ? m.scrollWidth - m.clientWidth : -1, link: b ? (b.querySelector('.po118-pe a') || {}).href || '' : '' } }, PID);
  const feedLinha = p => p.evaluate(async pid => { if (document.querySelector('#layer').innerHTML) closeLayer(); try { LIDAS.delete(pid) } catch (e) { } /* a matéria acabou de ser lida no teste; lida desce no Feed (-70) e, num feed real cheio, sai do 1º lote */ FILTRO = 'tudo'; go('feed'); renderPosts(); scrollTo(0, 0); await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 12 && !document.getElementById('p-' + pid); i++) { try { carregarMais(true) } catch (e) { } await new Promise(r => setTimeout(r, 60)) }
    const a = document.getElementById('p-' + pid), l = a && a.querySelector('.po118-ln');
    return { card: !!a, ca: !!(a && a.classList.contains('vn-ca')), tem: !!l, txt: l ? l.textContent.replace(/\s+/g, ' ').trim() : '', depoisTit: !!(l && l.previousElementSibling && l.previousElementSibling.classList.contains('vn-tit')),
      larg: l ? l.scrollWidth <= l.clientWidth + 1 : null, cabe: l ? l.getBoundingClientRect().right <= innerWidth : null, outros: document.querySelectorAll('#posts .po118-ln').length } }, PID);
  const credito = `Fonte: Senado Federal, ${hhmm(T1)}`;
  const rolaAte = async p => { await p.evaluate(() => { const b = document.querySelector('#layer .po118'), mm = document.querySelector('#layer .mat'); mm.scrollTop += b.getBoundingClientRect().top - mm.getBoundingClientRect().top - 112 }); await sleep(350) };

  // ===== A: 1º turno 62 a 9, ligado por "palavras" e com a hashtag #PEC18 na pauta
  feed(pauta({ hashtags: ['PEC18', 'Segurança'] })); put(ofic([e1]));
  let { ctx, p } = await abre({ nome: 'A' });
  let m = await mat(p);
  ok(m.tem && m.svg && m.leg.some(x => /^Sim 62$/.test(x)) && m.leg.some(x => /^Não 9$/.test(x)) && m.leg.some(x => /^Abstenção 1$/.test(x)), 'A: a matéria mostra o Placar oficial com os números (Sim 62, Não 9, Abstenção 1)', m);
  ok(m.res === 'Aprovado' && m.min && /49 votos necessários/.test(m.txt), 'A: resultado da fonte (Aprovado) e a linha dos 49 votos da PEC', { res: m.res, txt: m.txt });
  ok(m.txt.indexOf(credito) >= 0 && /PEC 18\/2025 no Senado · 1º turno/.test(m.txt), `A: crédito "${credito}" e título com a proposição e o turno`, m.txt);
  ok(/senado\.leg\.br/.test(m.link) && !m.sw.length && m.placares === 1, 'A: link para a página oficial, sem troca de turno (um só) e um placar só', m);
  ok(m.cap.includes('Placar oficial'), 'A: o capítulo da matéria (fase 2) se chama "Placar oficial"', m.cap);
  ok(m.larg <= 0, 'A: sem rolagem lateral na matéria', m.larg);
  await rolaAte(p);
  await p.screenshot({ path: path.join(QA, 'materia-placar-claro.png') });
  let f = await feedLinha(p);
  ok(f.card && f.ca && f.tem && f.txt === 'Senado aprovou · 62 a 9 · 1º turno ›' && f.depoisTit, 'A: Feed, cartão A: linha "Senado aprovou · 62 a 9 · 1º turno" logo abaixo da manchete', f);
  ok(f.larg && f.cabe && f.outros === 1, 'A: a linha cabe no cartão e só a notícia da PEC tem a linha', f);
  await p.evaluate(pid => { const a = document.getElementById('p-' + pid); scrollTo(0, a.getBoundingClientRect().top + scrollY - 64) }, PID); await sleep(400);
  await p.screenshot({ path: path.join(QA, 'feed-linha-cartao-a.png') });
  await p.click('#p-' + PID + ' .po118-ln'); await sleep(500);
  ok(await p.evaluate(pid => typeof MAT_PID !== 'undefined' && MAT_PID === pid && !!document.querySelector('#layer .mat .po118'), PID), 'A: tocar na linha abre a matéria, com o placar');
  ok(!p._erros.length, 'A: sem erros no console ' + p._erros.join(' | ')); await ctx.close();

  // escuro e 360 px
  ({ ctx, p } = await abre({ nome: 'A-escuro', escuro: true, w: 360 }));
  m = await mat(p);
  const cor = await p.evaluate(() => { const b = document.querySelector('#layer .po118'), s = b && b.querySelector('circle.acv-v-sim'); return { fundo: getComputedStyle(b).backgroundColor, sim: s ? getComputedStyle(s).fill : '', tx: getComputedStyle(document.querySelector('#layer .po118-k')).color } });
  ok(m.tem && m.larg <= 0 && /rgb\((\d{1,2}), (\d{1,2}), (\d{1,2})\)/.test(cor.fundo) && cor.sim, 'escuro, 360 px: bloco com fundo escuro, sem rolagem lateral', { cor, larg: m.larg });
  await p.setViewportSize({ width: 390, height: 844 }); await sleep(200);
  await rolaAte(p);
  await p.screenshot({ path: path.join(QA, 'materia-placar-escuro.png') });
  await p.setViewportSize({ width: 360, height: 800 }); f = await feedLinha(p);
  ok(f.tem && f.larg && f.cabe, 'escuro, 360 px: linha do Feed inteira, sem cortar', f);
  ok(!p._erros.length, 'escuro: sem erros no console ' + p._erros.join(' | ')); await ctx.close();

  // ===== B: "palavras" sem o número da proposição na pauta → nada; "numero" (o robô achou o número) → aparece
  feed(pauta()); put(ofic([e1]));
  ({ ctx, p } = await abre({ nome: 'B' })); m = await mat(p); f = await feedLinha(p);
  ok(!m.tem && !f.tem, 'B: ligação só por palavras, sem "PEC 18/2025" na pauta: nem bloco nem linha', { m: m.tem, f: f.tem });
  await ctx.close();
  feed(pauta({ contexto: mini.pautas.find(x => x.id === PID).contexto + ' A proposta é a PEC nº 18, de 2025.' })); put(ofic([e1]));
  ({ ctx, p } = await abre({ nome: 'B2' })); m = await mat(p);
  ok(m.tem, 'B: com "PEC nº 18, de 2025" no contexto, o bloco aparece', m.tem); await ctx.close();
  feed(pauta()); put(ofic([{ ...e1, confianca: 'numero' }]));
  ({ ctx, p } = await abre({ nome: 'B3' })); m = await mat(p);
  ok(m.tem, 'B: confiança "numero" do robô basta', m.tem); ok(!p._erros.length, 'B: sem erros ' + p._erros.join(' | ')); await ctx.close();

  // ===== C: a rodada já escreveu o placar desta votação: vale o da rodada, sem repetir
  const vr = { tipo: 'grafico', forma: 'placar_votacao', titulo: 'PEC na CCJ… no plenário: 1º turno', casa: 'senado', minimo: 49, resultado: 'aprovado', fonte: 'Senado Federal', itens: [{ rotulo: 'Sim', valor: 62 }, { rotulo: 'Não', valor: 9 }, { rotulo: 'Abstenção', valor: 1 }] };
  feed(pauta({ hashtags: ['PEC18'], visuais: [vr] })); put(ofic([e1]));
  ({ ctx, p } = await abre({ nome: 'C' })); m = await mat(p);
  ok(!m.tem && m.placares === 1, 'C: com o placar_votacao da rodada para a mesma votação, a matéria mostra um placar só (o da rodada)', m);
  ok(!p._erros.length, 'C: sem erros ' + p._erros.join(' | ')); await ctx.close();

  // ===== D: dois turnos: abre no último (2º, 60 a 10) e troca para o 1º
  feed(pauta({ hashtags: ['PEC18'], visuais: [vr] })); put(ofic([e1, e2]));
  ({ ctx, p } = await abre({ nome: 'D' })); m = await mat(p);
  ok(m.tem && JSON.stringify(m.sw) === JSON.stringify(['1º turno', '2º turno*']) && m.leg.some(x => x === 'Sim 60') && m.leg.some(x => x === 'Não 10'), 'D: 2º turno (60 a 10) aberto, troca "1º turno · 2º turno" (o placar da rodada era do 1º: o oficial aparece)', m);
  ok(m.txt.indexOf(`Fonte: Senado Federal, ${hhmm(T2)}`) >= 0, 'D: crédito com a hora do 2º turno', m.txt);
  await rolaAte(p);
  await p.screenshot({ path: path.join(QA, 'materia-dois-turnos.png') });
  await p.click('#layer .po118 [data-po118t="0"]'); await sleep(250);
  const d1 = await p.evaluate(() => { const b = document.querySelector('#layer .po118'); return { leg: [...b.querySelectorAll('.acv-leg li')].map(l => l.innerText.replace(/\s+/g, ' ').trim()), sw: [...b.querySelectorAll('[data-po118t]')].map(x => x.getAttribute('aria-pressed')), mat: !!document.querySelector('#layer .mat') } });
  ok(d1.mat && d1.leg.includes('Sim 62') && d1.leg.includes('Não 9') && d1.sw.join() === 'true,false', 'D: tocar em "1º turno" mostra 62 a 9 (sem fechar a matéria)', d1);
  await p.screenshot({ path: path.join(QA, 'materia-dois-turnos-1o.png') });
  f = await feedLinha(p); ok(f.txt === 'Senado aprovou · 60 a 10 · 2º turno ›', 'D: a linha do Feed fala da última votação', f);
  ok(!p._erros.length, 'D: sem erros ' + p._erros.join(' | ')); await ctx.close();

  // ===== E: votação simbólica (sem placar nominal): só o resultado
  const sb = { ...es, pid: PID, confianca: 'numero', quando: spISO(T2) }; sb.placar = { ...sb.placar, quando: spISO(T2) };
  feed(pauta()); put(ofic([sb]));
  ({ ctx, p } = await abre({ nome: 'E' })); m = await mat(p);
  ok(m.tem && !m.svg && m.res === 'Aprovado' && /Votação simbólica/.test(m.txt) && /Fonte: Câmara dos Deputados, \d\dh\d\d/.test(m.txt), 'E: simbólica: "Aprovado", explicação e crédito, sem hemiciclo', m.txt);
  f = await feedLinha(p); ok(f.txt === 'Câmara aprovou · votação simbólica ›', 'E: Feed: "Câmara aprovou · votação simbólica"', f);
  ok(!p._erros.length, 'E: sem erros ' + p._erros.join(' | ')); await ctx.close();

  // ===== F: oficiais.json ausente, inválido ou com dados impossíveis: nada aparece e nada quebra
  const ruins = [[null, 'ausente (404)'], ['{oops', 'JSON quebrado'], ['{"eventos":"x"}', 'estrutura errada'],
    [ofic([{ ...e1, placar: { ...e1.placar, sim: 70, nao: 20 } }]), 'placar impossível (90 de 81)'], [ofic([{ ...e1, placar: { ...e1.placar, casa: 'xx' } }]), 'Casa desconhecida'],
    [ofic([{ ...e1, placar: { ...e1.placar, modo: 'sem_placar', resultado: null, sim: null, nao: null } }]), 'sem votos e sem resultado'], [ofic([{ ...e1, pid: null }]), 'sem pauta']];
  for (const [txt, nome] of ruins) {
    feed(pauta({ hashtags: ['PEC18'] })); put(txt);
    ({ ctx, p } = await abre({ nome: 'F' })); m = await mat(p); f = await feedLinha(p);
    ok(!m.tem && !f.tem && m.larg <= 0 && !p._erros.length, `F: oficiais.json ${nome}: sem bloco, sem linha, sem erro`, { m: m.tem, f: f.tem, e: p._erros });
    await ctx.close() }

  // ===== G: os dados chegam com a matéria já aberta (e o cartão de hoje, sem o visual novo)
  feed(pauta({ hashtags: ['PEC18'] })); put(null);
  ({ ctx, p } = await abre({ nome: 'G' }));
  await p.evaluate(pid => abrirMateria(pid), PID); await sleep(200);
  ok(!(await p.evaluate(() => !!document.querySelector('#layer .po118'))), 'G: sem oficiais.json, a matéria abre sem o bloco');
  put(ofic([e1])); await p.evaluate(() => po118Carrega(true));
  ok(await esperar(p, () => !!document.querySelector('#layer .mat .po118 svg.acv-pl'), null, 4000), 'G: o arquivo chega e o bloco entra na matéria aberta, sem recarregar');
  ok(await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('prumo-placar')).v.length === 1 } catch (e) { return false } }), 'G: a cópia guardada no aparelho tem só as votações');
  ok(!p._erros.length, 'G: sem erros ' + p._erros.join(' | ')); await ctx.close();

  // ===== H: cartão de hoje (sem o visual novo) e site com Supabase: a linha também entra, sem erro
  fs.writeFileSync(S1 + 'oficiais.json', ofic([e1])); const f0 = JSON.parse(fs.readFileSync(S0 + 'feed.json', 'utf8')); fs.writeFileSync(S1 + 'feed.json.po118', fs.existsSync(S1 + 'feed.json') ? fs.readFileSync(S1 + 'feed.json') : '');
  fs.writeFileSync(S1 + 'feed.json', JSON.stringify(f0));
  srv2 = U.servir('site', PORTA2); await sleep(800);
  { const ctx2 = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); await ctx2.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const p2 = U.erros(await ctx2.newPage(), 'H'); await p2.goto(`http://localhost:${PORTA2}/index.html`); await esperar(p2, () => typeof FEED !== 'undefined' && FEED, null, 12000); await sleep(1500);
    const h = await feedLinha(p2); ok(h.tem && !h.ca && h.txt === 'Senado aprovou · 62 a 9 · 1º turno ›', 'H: cartão de hoje (sem o visual novo): a linha aparece', h);
    ok(!p2._erros.filter(x => !/supabase|teste\.supabase|Failed to fetch|NetworkError|ERR_FAILED/i.test(x)).length, 'H: sem erros ' + p2._erros.join(' | ')); await ctx2.close() }
  const antes = fs.readFileSync(S1 + 'feed.json.po118'); if (antes.length) fs.writeFileSync(S1 + 'feed.json', antes); fs.unlinkSync(S1 + 'feed.json.po118'); fs.unlinkSync(S1 + 'oficiais.json');

  put(null); fs.writeFileSync(S0 + 'feed.json', JSON.stringify(real)); fs.rmSync(tmp, { recursive: true, force: true });
  const r = U.resumo(); console.log(`\nRESUMO t_placar_oficial: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); srv2.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); if (srv) srv.kill(); if (srv2) srv2.kill(); process.exit(1) });
