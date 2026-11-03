// Revisão C da leitura (116): C01 aviso falso de rodada na Capa, C03 Busca com siglas, C04 "antes e depois" em 360 px,
// C05 linha do tempo com datas "Dom (8/11)" / "01/10/2026". Visitante (site sem configuração), feed real do repositório.
// Portas 8726–8727. Capturas em qa/revisao-c/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const PORTA = 8726, BASE = `http://localhost:${PORTA}/index.html`, S0 = path.join(__dirname, '..', 'site-semconfig') + '/';
const QA = path.join(__dirname, '..', 'qa', 'revisao-c'); fs.mkdirSync(QA, { recursive: true });
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
const hhmmSP = ms => { const d = new Date(ms - 3 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + 'h' + String(d.getUTCMinutes()).padStart(2, '0') };
const hojeSP = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), horaSP = new Date(Date.now() - 3 * 3600e3).getUTCHours();
let srv = null;
function feed(f, atrasoMin) { f.atualizado_em = spISO(Date.now() - atrasoMin * 60e3); fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f)) }
function rodadas(minAtras) { const it = {}; it[hhmmSP(Date.now() - minAtras * 60e3)] = { tipo: 'rapida', status: 'sem_mudancas', publicou: false, nota: 'Nada novo' };
  fs.writeFileSync(S0 + 'rodadas.json', JSON.stringify({ dia: hojeSP, itens: it })) }
(async () => {
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }
  srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  const abre = async (o = {}) => { const ctx = await br.newContext({ viewport: { width: o.w || 390, height: 844 }, hasTouch: true });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.addInitScript(() => { try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    const p = U.erros(await ctx.newPage(), o.nome || 'a'); await p.goto(BASE); await esperar(p, () => typeof FEED !== 'undefined' && FEED && document.querySelector('#v-capa .cpi'), null, 12000); return { ctx, p } };

  // ===== C01: Capa sem o aviso "Uma rodada pode ter falhado" quando o rodadas.json mostra rodada recente (sem novidade)
  const ativo = horaSP >= 8 && horaSP <= 23;
  feed(real, 200); rodadas(15);
  let { ctx, p } = await abre({ nome: 'c01' }); await sleep(2500);
  const c1 = await p.evaluate(() => ({ late: !!document.querySelector('#v-capa .late:not(.offl)'), rec: rodadaRecenteMin(), est: estadoRadar().ok }));
  ok(c1.rec < 60 && !c1.late, 'C01: rodada recente sem novidade → a Capa não mostra "Uma rodada pode ter falhado"', c1);
  await p.evaluate(() => { renderCapa(); scrollTo(0, 0) }); await sleep(200);
  ok(!(await p.evaluate(() => !!document.querySelector('#v-capa .late:not(.offl)'))), 'C01: nem depois de redesenhar a Capa');
  await p.screenshot({ path: path.join(QA, 't-C01-capa-sem-aviso.png') }); await ctx.close();
  rodadas(400); ({ ctx, p } = await abre({ nome: 'c01b' })); await sleep(2500);
  const c1b = await p.evaluate(() => ({ late: !!document.querySelector('#v-capa .late:not(.offl)'), est: estadoRadar().ok }));
  ok(ativo ? (c1b.late && !c1b.est) : !c1b.late, 'C01: sem rodada há 6 h (no horário ativo) o aviso continua aparecendo', { ativo, ...c1b });
  await ctx.close();

  // ===== C03 e C05 (funções, com dados de teste)
  feed(real, 12); rodadas(10); ({ ctx, p } = await abre({ nome: 'c03' })); await sleep(800);
  const c3 = await p.evaluate(() => { const orig = FEED.pautas, ob = FEED.breves, od = FEED.dormentes;
    const P = (id, titulo, texto) => ({ id, secao: 'politica', tag: 'Teste', neutro: { titulo, texto } });
    FEED.pautas = [P('a', 'PL reconhece a derrota', 'Valdemar fala.'), P('b', 'Oncoclínicas aprova plano', 'O plano tem adesão no aplicativo.'),
      P('c', 'Senado vota a PEC', 'Votação hoje.'), P('d', 'Bolsas sobem', 'Resultados superam as expectativas.'), P('e', 'Copom decide a Selic', 'Selic a 13,75%.')];
    FEED.breves = []; FEED.dormentes = [];
    const ids = q => { const d = document.createElement('div'); d.innerHTML = buscaRes(q); return [...d.querySelectorAll('[data-busca]')].map(b => b.dataset.busca).join(',') };
    const r = { PL: ids('PL'), pl: ids('pl'), PEC: ids('PEC'), pec: ids('pec'), sel: ids('sel'), selic: ids('Selic'), pct: ids('13,75%'), dois: ids('copom selic'), plano: ids('plano') };
    FEED.pautas = orig; FEED.breves = ob; FEED.dormentes = od; return r });
  ok(c3.PL === 'a' && c3.PEC === 'c', 'C03: sigla em maiúsculas (PL, PEC) só casa a palavra inteira (não "plano", "aplicativo", "expectativas")', c3);
  ok(c3.pl === 'a,b' && c3.pec === 'c', 'C03: termo curto em minúsculas casa o começo da palavra ("pl" → PL e plano; "pec" não acha "expectativas")', c3);
  ok(c3.sel === 'e' && c3.selic === 'e' && c3.pct === 'e' && c3.dois === 'e' && c3.plano === 'b', 'C03: busca por prefixo, por número com % e por várias palavras continua igual', c3);
  await p.evaluate(() => go('busca')); await sleep(300); await p.fill('#bvq', 'PL'); await sleep(500); await p.screenshot({ path: path.join(QA, 't-C03-busca-PL.png') });
  const c5 = await p.evaluate(() => { const hj = hojeSP(), dd = n => { const x = new Date(hj + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x };
      const W = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], fmt = (x, o) => (o === 'dia' ? `${W[x.getUTCDay()]} (${x.getUTCDate()}/${x.getUTCMonth() + 1})` : o === 'ano' ? `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}` : `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}`);
      const li = its => { const t = document.createElement('div'); t.innerHTML = matTempo({ visuais: [{ tipo: 'linha_do_tempo', itens: its.map(q => ({ quando: q, texto: 'x' })) }] }); return [...t.querySelectorAll('li')].map(l => l.className + '|' + l.querySelector('time').textContent + '|' + (l.querySelector('time').getAttribute('datetime') || '')) };
      return { dia: li([fmt(dd(-2), 'dia'), fmt(dd(3), 'dia'), fmt(dd(10), 'dia')]), ano: li([fmt(dd(-9), 'ano'), fmt(dd(-1), 'ano')]), dm: li([fmt(dd(-3)), fmt(dd(-1)), fmt(dd(1))]), livre: li(['Março', 'Hoje']), dc: dataCurta(dd(-9).toISOString().slice(0, 10)) } });
  ok(/^ult\|/.test(c5.dia[0]) && /^fut\|/.test(c5.dia[1]) && /^fut\|/.test(c5.dia[2]), 'C05: "Dom (8/11)" no futuro fica tracejado e o ponto atual é o último que já aconteceu', c5.dia);
  ok(c5.ano[0].split('|')[1] === c5.dc && /^ult\|/.test(c5.ano[1]) && /\|\d{4}-\d{2}-\d{2}$/.test(c5.ano[1]), 'C05: "01/10/2026" vira "1 de out" (com datetime)', c5.ano);
  ok(/^\|/.test(c5.dm[0]) && /^ult\|/.test(c5.dm[1]) && /^fut\|/.test(c5.dm[2]) && !/\d\/\d/.test(c5.dm.join()), 'C05: "dd/mm" no mesmo formato das outras linhas do tempo, futuro marcado como antes', c5.dm);
  ok(c5.livre.length === 2 && /Março/.test(c5.livre[0]) && /^ult\|Hoje/.test(c5.livre[1]), 'C05: rótulo livre (sem data) fica como estava', c5.livre);
  // matérias reais: sem NaN/undefined, linha do tempo em ordem, nenhum ponto atual depois de um futuro
  const reais = await p.evaluate(async () => { const out = []; for (const x of FEED.pautas) { abrirMateria(x.id); await new Promise(r => setTimeout(r, 40)); const m = document.querySelector('#layer .mat'); if (!m) continue;
      const lis = [...m.querySelectorAll('.mat-tl li')].map(l => l.className); const iu = lis.findIndex(c => /ult/.test(c)), fa = lis.findIndex(c => /fut/.test(c));
      if (/NaN|undefined|\[object/.test(m.innerText) || (iu >= 0 && fa >= 0 && fa < iu) || m.scrollWidth > m.clientWidth + 1) out.push(x.id); closeLayer() } return out });
  ok(!reais.length, 'matérias do feed real: sem texto quebrado, sem rolagem lateral, linha do tempo coerente', reais);
  ok(!p._erros.length, 'sem erros na página ' + p._erros.join(' | ')); await ctx.close();

  // ===== C04: "antes e depois" em 360 px: o "%" não cai sozinho na linha de baixo
  const AQ = U.REPO + '/tools/fixtures/catalogo/'; const fc = JSON.parse(fs.readFileSync(AQ + 'feed-catalogo.json', 'utf8')); feed(fc, 5);
  ({ ctx, p } = await abre({ w: 360, nome: 'c04' })); await sleep(600);
  const id = await p.evaluate(() => (FEED.pautas.find(x => (x.visuais || []).some(v => v.forma === 'antes_depois')) || {}).id);
  await p.evaluate(i => abrirMateria(i), id); await esperar(p, () => document.querySelector('#layer .acv-ad'), null, 5000);
  const c4 = await p.evaluate(() => [...document.querySelectorAll('#layer .acv-ad-c b')].map(b => { const r = b.getRange ? 0 : b.getBoundingClientRect(); return { t: b.textContent, linhas: Math.round(r.height / parseFloat(getComputedStyle(b).lineHeight)), fz: parseFloat(getComputedStyle(b).fontSize) } }));
  ok(c4.length === 2 && c4.every(x => x.linhas === 1 && x.fz >= 19), 'C04: "15,00%" e "13,75%" numa linha só em 360 px', c4);
  await p.evaluate(() => document.querySelector('#layer .mat-vis').scrollIntoView({ block: 'center' })); await sleep(300); await (await p.$('#layer .mat-vis')).screenshot({ path: path.join(QA, 't-C04-antes-depois-360.png') });
  await ctx.close();

  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(real));
  const r = U.resumo(); console.log(`\nRESUMO t_revisao_c: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); if (srv) srv.kill(); process.exit(1) });
