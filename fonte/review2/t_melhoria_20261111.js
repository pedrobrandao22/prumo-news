// Melhoria contínua 11/11/2026 (144): gráfico de linha — o rótulo do último valor não pode ficar em cima da linha
// (antes, quando a linha descia até o último ponto, ela atravessava o número). Confere com a geometria real (getBBox)
// nas duas versões do gráfico (graficoNoticia da etapa 14 e acvLinha do acervo: linha e área), em 360 e 390 px,
// e numa matéria de verdade (claro e escuro). Visitante (site sem configuração). Porta 8712. Capturas em qa/melhoria-20261111/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8712, S0 = path.join(__dirname, '..', 'site-semconfig') + '/';
const QA = path.join(__dirname, '..', 'qa', 'melhoria-20261111'); fs.mkdirSync(QA, { recursive: true });
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + '-03:00';
let srv = null;
const serie = (vs, u) => vs.map((v, k) => ({ rotulo: 'Mês ' + (k + 1), valor: v }));
const DESCE = [10, 12, 11, 14, 13, 9.5, 6], SOBE = [3, 4, 5, 4, 6, 8, 12], QUEDA = [40, 41, 39, 42, 41, 30, 18], PLANO = [100, 101, 99, 100.5, 100, 100.2, 100.1];
// mede, no DOM, se a linha passa pela caixa do rótulo do último valor (e se esse rótulo encosta em outro número)
const MEDIR = `window.__mc1111Medir=function(raiz){return [...raiz.querySelectorAll('svg')].filter(s=>s.querySelector('polyline.gr-ln')).map(svg=>{
  const pts=svg.querySelector('polyline.gr-ln').getAttribute('points').trim().split(/\\s+/).map(s=>s.split(',').map(Number));const [xn,yn]=pts[pts.length-1];
  const tx=[...svg.querySelectorAll('text.gn-v')];const t=tx.find(e=>e.getAttribute('text-anchor')==='end'&&Math.abs(+e.getAttribute('x')-xn)<.6);if(!t)return {semRotulo:true};
  const b=t.getBBox();let toca=0;for(let i=0;i<pts.length-1;i++){const [x1,y1]=pts[i],[x2,y2]=pts[i+1];for(let s=0;s<=40;s++){const x=x1+(x2-x1)*s/40,y=y1+(y2-y1)*s/40;
    if(x>=b.x&&x<=b.x+b.width&&y>=b.y+1.5&&y<=b.y+b.height-1.5)toca++}}
  const enc=tx.filter(e=>e!==t).some(e=>{const c=e.getBBox();return c.x<b.x+b.width&&c.x+c.width>b.x&&c.y<b.y+b.height-2&&c.y+c.height-2>b.y});
  const vb=svg.viewBox.baseVal,dentro=b.y>=0&&b.y+b.height<=vb.height&&b.x>=0&&b.x+b.width<=vb.width+1;
  const dist=Math.hypot((b.x+b.width)-xn,Math.max(0,b.y-yn,yn-(b.y+b.height)));
  return {toca,enc,dentro,dist:+dist.toFixed(1),pos:t.getAttribute('data-mc1111')||'cima',y:+t.getAttribute('y'),yn}})}`;
(async () => {
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const base = real.pautas[0];
  const mk = (id, min, vis) => { const p = JSON.parse(JSON.stringify(base)); p.id = id; p.hora = spISO(Date.now() - min * 60e3); p.prioridade = 99; delete p.foto; p.visuais = [vis]; return p };
  const f = JSON.parse(JSON.stringify(real));
  f.pautas = [mk('mc1111-desce', 2, { tipo: 'grafico', forma: 'linha', titulo: 'Inflação em queda', unidade: '%', fonte: 'Teste', itens: serie(DESCE) }),
    mk('mc1111-area', 3, { tipo: 'grafico', forma: 'area', titulo: 'Queda forte', unidade: '%', fonte: 'Teste', itens: serie(QUEDA) })].concat(f.pautas.filter(p => !/^mc1111/.test(p.id)));
  f.atualizado_em = spISO(Date.now() - 5 * 60e3);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json', 'feed-leve.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }

  srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  // 1) as funções, em 360 e 390 px
  for (const L of [360, 390]) {
    const ctx = await br.newContext({ viewport: { width: L, height: 800 } }); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const p = U.erros(await ctx.newPage(), 'f' + L); await p.goto(`http://localhost:${PORTA}/index.html`);
    await esperar(p, () => typeof graficoNoticia === 'function' && typeof acvLinha === 'function' && typeof FEED !== 'undefined' && FEED && FEED.pautas, null, 15000);
    await p.evaluate(MEDIR);
    const r = await p.evaluate(({ L, cs }) => { const out = {};
      for (const [k, h] of Object.entries({
        desce: graficoNoticia({ tipo: 'grafico', forma: 'linha', unidade: '%', itens: cs.DESCE }),
        desce_min: graficoNoticia({ tipo: 'grafico', forma: 'linha', unidade: 'R$ bi', itens: cs.QUEDA }),
        sobe: graficoNoticia({ tipo: 'grafico', forma: 'linha', itens: cs.SOBE }),
        plano: graficoNoticia({ tipo: 'grafico', forma: 'linha', unidade: 'R$ bi', itens: cs.PLANO }),
        acv_area: graficoNoticia({ tipo: 'grafico', forma: 'area', unidade: '%', itens: cs.QUEDA }),
        acv_linha: acvLinha({ forma: 'linha', unidade: '%', itens: cs.DESCE }, false),
        acv_meta: acvLinha({ forma: 'faixa_meta', unidade: '%', itens: cs.DESCE }, false, { centro: 9, min: 7.5, max: 10.5 }),
        acv_sobe: acvLinha({ forma: 'linha', itens: cs.SOBE }, false) })) {
        const d = document.createElement('div'); d.style.width = (L - 32) + 'px'; d.innerHTML = h; document.body.appendChild(d); out[k] = window.__mc1111Medir(d)[0] || null; d.remove() }
      return out }, { L, cs: { DESCE: serie(DESCE), SOBE: serie(SOBE), QUEDA: serie(QUEDA), PLANO: serie(PLANO) } });
    for (const [k, m] of Object.entries(r)) {
      ok(m && !m.semRotulo, `${L}px ${k}: gráfico com rótulo do último valor`, m);
      if (!m || m.semRotulo) continue;
      ok(m.toca === 0, `${L}px ${k}: a linha não passa pelo rótulo do último valor`, m);
      ok(!m.enc && m.dentro, `${L}px ${k}: rótulo dentro do gráfico e sem encostar em outro número`, m);
      ok(m.dist <= 34, `${L}px ${k}: rótulo perto do ponto final`, m);
    }
    // o que já estava bom não muda de lugar
    ok(r.sobe.pos === 'cima' && Math.abs(r.sobe.y - (r.sobe.yn - 9)) < .2 && r.acv_sobe.pos === 'cima' && r.plano.pos === 'cima', `${L}px: linha subindo ou plana mantém o rótulo acima do ponto`, [r.sobe, r.acv_sobe, r.plano]);
    ok(r.desce.pos !== 'cima' && r.acv_linha.pos !== 'cima', `${L}px: linha descendo tira o rótulo de cima da linha`, [r.desce, r.acv_linha]);
    await ctx.close();
  }
  // 2) numa matéria de verdade, claro e escuro
  for (const escuro of [false, true]) {
    const n = escuro ? 'escuro' : 'claro';
    const ctx = await br.newContext({ viewport: { width: 360, height: 780 }, hasTouch: true, colorScheme: escuro ? 'dark' : 'light' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.addInitScript(() => { try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    const p = U.erros(await ctx.newPage(), n); await p.goto(`http://localhost:${PORTA}/index.html`);
    await esperar(p, () => typeof FEED !== 'undefined' && FEED && FEED.pautas && FEED.pautas.some(x => x.id === 'mc1111-desce'), null, 15000);
    await p.evaluate(MEDIR);
    for (const id of ['mc1111-desce', 'mc1111-area']) {
      const r = await p.evaluate(async id => { abrirMateria(id); await new Promise(r => setTimeout(r, 800)); const m = document.querySelector('#layer .mat');
        const g = m && m.querySelector('polyline.gr-ln'); if (g) g.closest('svg').scrollIntoView({ block: 'center' });
        return { med: m ? window.__mc1111Medir(m) : [], lat: document.documentElement.scrollWidth <= innerWidth } }, id);
      ok(r.med.length >= 1 && r.med.every(x => !x.semRotulo && x.toca === 0 && !x.enc && x.dentro), `${n}: matéria ${id} com o rótulo final fora da linha`, r.med);
      ok(r.lat, `${n}: matéria ${id} sem rolagem lateral`);
      ok(!p._erros.length, `${n}: sem erro de JavaScript`, p._erros);
      await sleep(250); await p.screenshot({ path: path.join(QA, `${id.slice(7)}-${n}.png`) });
      await p.evaluate(() => { try { history.back() } catch (e) { } }); await sleep(500);
    }
    await ctx.close();
  }
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro: ' + e.message); try { srv && srv.kill() } catch (x) { } process.exit(1) });
