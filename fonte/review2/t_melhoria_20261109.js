// Melhoria contínua 09/11/2026 (143): no índice "Nesta matéria" (fase 2), o capítulo da linha do tempo leva o nome da
// própria seção ("Como a história andou", ou o título próprio da linha do tempo); título longo demais (> 32) fica "Linha do tempo".
// Visitante (site sem configuração), flags de produção. Porta 8710. Capturas (390×844) em qa/melhoria-20261109/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8710, S0 = path.join(__dirname, '..', 'site-semconfig') + '/';
const QA = path.join(__dirname, '..', 'qa', 'melhoria-20261109'); fs.mkdirSync(QA, { recursive: true });
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + '-03:00';
let srv = null;
(async () => {
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const base = real.pautas[0];
  const itens = [{ quando: '1/11', texto: 'Primeiro passo da história' }, { quando: '5/11', texto: 'Segundo passo da história' }, { quando: '8/11', texto: 'Terceiro passo' }];
  const LONGO = 'Um título de linha do tempo comprido demais para caber';
  const mk = (id, min, tit) => { const p = JSON.parse(JSON.stringify(base)); p.id = id; p.hora = spISO(Date.now() - min * 60e3); p.prioridade = 99; delete p.foto;
    const vt = { tipo: 'linha_do_tempo', itens }; if (tit) vt.titulo = tit; p.visuais = [vt]; return p };
  const f = JSON.parse(JSON.stringify(real));
  f.pautas = [mk('mc1109-pad', 2), mk('mc1109-prop', 3, 'Como a reforma andou'), mk('mc1109-longo', 4, LONGO)].concat(f.pautas.filter(p => !/^mc1109/.test(p.id)));
  f.atualizado_em = spISO(Date.now() - 5 * 60e3);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json', 'feed-leve.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }

  srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  for (const escuro of [false, true]) {
    const n = escuro ? 'escuro' : 'claro';
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: escuro ? 'dark' : 'light' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.addInitScript(() => { try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    const p = U.erros(await ctx.newPage(), n); await p.goto(`http://localhost:${PORTA}/index.html`);
    await esperar(p, () => typeof FEED !== 'undefined' && FEED && FEED.pautas && FEED.pautas.some(x => x.id === 'mc1109-pad'), null, 15000);
    const ler = id => p.evaluate(async id => { abrirMateria(id); await new Promise(r => setTimeout(r, 700)); const m = document.querySelector('#layer .mat'), tl = m && m.querySelector('.mat-tl');
      const bt = tl && tl.id && m.querySelector(`.fs2-cap-b[aria-controls="${tl.id}"]`); const nav = m && m.querySelector('.fs2-cap');
      const r = { secao: tl && (tl.querySelector(':scope > b') || {}).textContent, cap: bt && bt.textContent.replace(/^\d+/, ''), num: bt && (bt.querySelector('i') || {}).textContent, caps: nav ? nav.querySelectorAll('[data-f113cap]').length : 0, lat: document.documentElement.scrollWidth <= innerWidth };
      return r }, id);
    const fecha = () => p.evaluate(() => { try { history.back() } catch (e) { } }).then(() => sleep(500));
    const a = await ler('mc1109-pad');
    ok(a.secao === 'Como a história andou' && a.cap === 'Como a história andou' && /^\d$/.test(a.num || '') && a.caps >= 2, `${n}: capítulo com o mesmo nome da seção padrão`, a);
    ok(a.lat, `${n}: sem rolagem lateral`, a);
    await p.screenshot({ path: path.join(QA, `01-capitulos-${n}.png`) });
    await fecha();
    const b = await ler('mc1109-prop');
    ok(b.secao === 'Como a reforma andou' && b.cap === 'Como a reforma andou', `${n}: título próprio da linha do tempo vira o nome do capítulo`, b);
    await fecha();
    const c = await ler('mc1109-longo');
    ok(c.secao === LONGO && c.cap === 'Linha do tempo', `${n}: título longo demais fica "Linha do tempo" no índice`, c);
    ok(p._erros.length === 0, `${n}: sem erro de JavaScript`, p._erros);
    await ctx.close();
  }
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro: ' + e.message); try { srv && srv.kill() } catch (x) { } process.exit(1) });
