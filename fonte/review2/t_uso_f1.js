// Fase 1 · uso (184, 17/11): Indicadores num card só na Capa (dólar, Selic, IPCA 12 meses, Ibovespa; variação do dia só no
// dólar e no Ibovespa; "Atualizado em … às …" com a hora das cotações), sem gráfico, sem "outros indicadores", sem painel
// da Economia e sem atalho na Busca; tocar explica. Contagens de uso: indicadores, card visto, Capa ao abrir (uma vez),
// notícia comentada separada de post. Painel de Uso: bloco "Por recurso" com os 23 recursos e os menos usados destacados;
// cada recurso tem pelo menos uma contagem no código. iPhone 13 e iPhone SE. Porta 9040.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9040, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const IND = { atualizado: '2026-11-17T18:30-03:00', dados_em: '2026-11-17T18:07-03:00', itens: [
  { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,81', variacao: '+0,42%', dir: 'sobe', data: '2026-11-17', hora: '2026-11-17T18:07-03:00', fechamento: true, serie: [5.7, 5.79, 5.81], rotulos: ['2026-11-13', '2026-11-16', '2026-11-17'], fonte: 'cotação comercial' },
  { id: 'ibovespa', nome: 'Ibovespa', valor: '171.000', variacao: '-0,85%', dir: 'desce', data: '2026-11-17', hora: '2026-11-17T18:05-03:00', fechamento: true, serie: [170000, 172000, 171000], rotulos: ['2026-11-13', '2026-11-16', '2026-11-17'], fonte: 'B3' },
  { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'desce', data: '2026-09-17', serie: [15, 14.25, 13.75], rotulos: ['2026-08', '2026-09', '2026-10'], fonte: 'Copom/Banco Central' },
  { id: 'ipca12m', nome: 'IPCA 12m', valor: '4,63%', dir: 'sobe', ref: '2026-10', serie: [4.5, 4.58, 4.63], rotulos: ['2026-08', '2026-09', '2026-10'], fonte: 'IBGE', data: '2026-11-12' },
  { id: 'desemprego', nome: 'Desemprego', valor: '5,2%', dir: 'desce', ref: '2026-09', serie: [5.6, 5.4, 5.2], rotulos: ['2026-07', '2026-08', '2026-09'], fonte: 'IBGE/PNAD', data: '2026-10-30' }] };
(async () => {
  U.feedFresco('site'); U.servir('site', PORTA); await sleep(800);
  const raiz = path.join(__dirname, '..'), js = fs.readFileSync(path.join(raiz, 'app/src/js/184-indicadores-uso.js'), 'utf8');
  ok(!/\(\?<[=!]/.test(js), '184: sem lookbehind');

  // cada recurso tem pelo menos uma contagem que sai do código (uso("x"), tl142Conta("x") ou os nomes montados)
  const tpl = fs.readFileSync(path.join(raiz, 'app/prumo-template.html'), 'utf8');
  const evs = new Set();
  for (const m of tpl.matchAll(/\b(?:uso|tl142Conta)\("([a-z][a-z0-9_]{1,39})"/g)) evs.add(m[1]);
  ['capa', 'feed', 'msgs', 'me', 'busca', 'saved', 'play'].forEach(v => evs.add('tela_' + v));
  ['esquerda', 'direita', 'neutro'].forEach(k => evs.add('lente_' + k));
  ['post', 'coluna', 'story'].forEach(k => evs.add('publicar_' + k));
  ['nt', 'rel', 'ana', 'enq', 'post'].forEach(k => evs.add('criar_' + k)); evs.add('publicar_cn_nt');
  if (/uso\(texto\?"vn_citar":"vn_repostar"\)/.test(tpl)) { evs.add('vn_repostar'); evs.add('vn_citar') }

  const b = await U.navegador();
  for (const dev of [{ nome: 'iPhone 13', w: 390, h: 844 }, { nome: 'iPhone SE', w: 375, h: 667 }]) {
    const se = dev.nome === 'iPhone SE', tag = se ? ' [SE]' : '';
    const ctx = await b.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route('**/indicadores.json*', rt => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(IND) }));
    await ctx.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
    const P = U.erros(await ctx.newPage(), 'P' + tag);
    await P.goto(BASE); await esperar(P, () => !!FEED && document.querySelector('#v-capa .cpi') && IND_AUTO && IND_AUTO.dados_em, null, 12000);
    await ev(P, () => renderCapa()); await sleep(300);

    // contagem da Capa ao abrir: uma vez só
    if (!se) {
      const k = await ev(P, () => tl142Dia() + '|capa');
      ok(await ev(P, k => TL142.uso[k] === 1, k), 'abrir o app na Capa conta "capa" uma vez', await ev(P, () => JSON.stringify(TL142.uso)));
      const evsRede = await ev(P, () => Object.keys(TL142.uso).map(k => k.split('|')[1]));
      evsRede.forEach(e => evs.add(e));
    }

    // 1. card único
    const c = await ev(P, () => { const v = document.querySelector('#v-capa'); const cs = v.querySelectorAll('.ui184');
      return { n: cs.length, nomes: [...v.querySelectorAll('.ui184 .ui184-n')].map(e => e.textContent), vals: [...v.querySelectorAll('.ui184 .ui184-c b')].map(e => e.textContent),
        em: [...v.querySelectorAll('.ui184 .ui184-c')].map(e => !!e.querySelector('em')), at: (v.querySelector('.ui184-at') || {}).textContent,
        velho: v.querySelectorAll('.cp-ind,.ind-t,[data-indg]').length, des: /Desemprego/.test(v.querySelector('.ui184').textContent) } });
    ok(c.n === 1 && c.nomes.join('|') === 'Dólar|Selic|IPCA 12 meses|Ibovespa', 'Capa: um card só com dólar, Selic, IPCA 12 meses e Ibovespa' + tag, JSON.stringify(c));
    ok(c.vals.join('|') === 'R$ 5,81|13,75%|4,63%|171.000' && !c.des, 'card: os quatro números e nada de desemprego' + tag, c.vals);
    ok(c.em.join() === 'true,false,false,true', 'variação do dia só no dólar e no Ibovespa' + tag, c.em);
    ok(c.at === 'Atualizado em 17/11 às 18h07', 'legenda com a hora das cotações' + tag, c.at);
    ok(c.velho === 0, 'Capa sem os blocos antigos de indicador (que abriam o gráfico)' + tag);
    // sem dados_em: usa a hora das cotações; sem nada: o dia
    ok(await ev(P, () => { const a = IND_AUTO; IND_AUTO = { ...a, dados_em: undefined }; const r1 = ui184Legenda(ui184Itens()); IND_AUTO = { itens: a.itens.map(x => ({ ...x, hora: undefined })) }; const r2 = ui184Legenda(ui184Itens()); IND_AUTO = a; return r1 === 'Atualizado em 17/11 às 18h07' && r2 === 'Atualizado em 17/11' }), 'legenda sem dados_em: hora da cotação; sem hora: o dia' + tag);

    await ev(P, () => { const e = document.querySelector('#v-capa .ui184'); window.scrollTo(0, scrollY + e.getBoundingClientRect().top - 120) }); await sleep(500);
    if (!se) ok(await esperar(P, () => TL142.uso[tl142Dia() + '|indicadores_visto'] === 1, null, 3000), 'card visto na tela conta "indicadores_visto"');
    await U.foto(P, 'uso-f1-card' + (se ? '-se' : ''));
    ok(await ev(P, () => document.documentElement.scrollWidth <= innerWidth), 'sem rolagem lateral' + tag);
    const caixa = await ev(P, () => { const r = document.querySelector('#v-capa .ui184').getBoundingClientRect(); return r.height });
    ok(caixa < 200, 'card compacto (menos de 200 px de altura)' + tag, caixa);

    // 2. tocar: explicação curta, sem gráfico
    await P.tap('#v-capa .ui184-b'); await sleep(500);
    const sh = await ev(P, () => ({ t: document.querySelector('#layer').innerText, gr: !!document.querySelector('.gr'), ex: !!document.querySelector('#layer .ui184-ex') }));
    ok(sh.ex && !sh.gr && /Selic/.test(sh.t) && /fechamento dos mercados/.test(sh.t), 'tocar no card abre só uma explicação curta' + tag, sh.t.slice(0, 120));
    if (!se) ok(await ev(P, () => TL142.uso[tl142Dia() + '|indicadores'] === 1), 'tocar no card conta "indicadores"');
    await U.foto(P, 'uso-f1-explica' + (se ? '-se' : ''));
    await ev(P, () => closeLayer()); await sleep(300);

    // 3. nenhum outro atalho: Economia, Busca e botões antigos
    ok(await ev(P, () => indPainel() === ''), 'Economia: sem painel de indicadores' + tag);
    ok(await ev(P, () => !/cm168-ind|Ver gráfico/.test(buscaRes('dólar')) && !/cm168-ind/.test(buscaRes('selic'))), 'Busca "dólar"/"selic": sem atalho de indicador' + tag);
    await ev(P, () => { document.body.insertAdjacentHTML('beforeend', '<button type="button" id="velho184" class="ind-t" data-indg="dolar">x</button>'); document.getElementById('velho184').click(); document.getElementById('velho184').remove() }); await sleep(400);
    ok(await ev(P, () => !document.querySelector('.gr') && !!document.querySelector('#layer .ui184-ex')), 'toque num indicador antigo (cache) não abre gráfico' + tag);
    await ev(P, () => closeLayer()); await sleep(200);

    if (!se) {
      // 4. notícia comentada separada de post; repost não conta como post
      const r = await ev(P, () => { const d = tl142Dia(), g = k => TL142.uso[d + '|' + k] || 0; const a = g('publicar_post');
        tl142ContaIns('publicacoes', { tipo: 'post', estilo: { cn: { v: 1, k: 'nt' } } }); tl142ContaIns('publicacoes', { tipo: 'post', estilo: { rp: { k: 'pauta', id: 'x' } } });
        tl142ContaIns('publicacoes', { tipo: 'post', estilo: {} }); tl142ContaIns('pub_reacoes', { tipo: 'comentario' });
        return { nt: g('publicar_cn_nt'), post: g('publicar_post') - a, com: g('comentar') } });
      ok(r.nt === 1 && r.post === 1 && r.com === 1, 'publicar: notícia comentada vira "publicar_cn_nt"; post comum e comentário continuam', JSON.stringify(r));

      // 5. painel Uso: "Por recurso"
      const html = await ev(P, () => { const d = tl142Dia(); TL142.adm.dias = 7;
        TL142.adm.uso = [['materia', 40], ['capa', 30], ['tela_capa', 30], ['lente_direita', 3], ['lente_menu', 2], ['publicar_cn_nt', 4], ['criar_nt', 1], ['story', 9], ['cobertura', 6], ['pag_cobertura', 2], ['indicadores_visto', 12], ['aparelho_ativo', 99], ['outra_coisa', 50]]
          .map(([evento, n]) => ({ dia: d, evento, plataforma: 'ios', n }));
        return tl142UsoHTML() });
      const res = await ev(P, h => { const d = document.createElement('div'); d.innerHTML = h; const lis = [...d.querySelectorAll('.ui184-rec li')];
        const m = {}; lis.forEach(li => { m[li.querySelector('span').textContent] = +li.querySelector('b').textContent.replace(/\./g, '') });
        return { n: lis.length, m, prim: lis[0] && lis[0].querySelector('span').textContent, pouco: lis.filter(li => li.classList.contains('ui184-pouco')).length, ultPouco: lis[lis.length - 1].classList.contains('ui184-pouco'),
          ordem: d.innerHTML.indexOf('Por recurso') < d.innerHTML.indexOf('Telas e ações'), hint: (d.querySelector('.ui184-ph') || {}).textContent } }, html);
      ok(res.n === 23 && res.ordem, 'painel Uso: bloco "Por recurso" com os 23 recursos, antes de "Telas e ações"', JSON.stringify(res));
      ok(res.prim === 'Matéria' && res.m['Matéria'] === 40 && res.m['Capa'] === 30 && res.m['Balança'] === 5 && res.m['Notícia comentada'] === 5 && res.m['Quem noticiou'] === 6 && res.m['Coberturas'] === 2 && res.m['Indicadores'] === 12 && res.m['Giros de notícia'] === 9 && res.m['Feed'] === 0,
        'painel: agrupa as contagens nos recursos (Capa sem contar duas vezes; estado do aparelho fora)', JSON.stringify(res.m));
      ok(res.pouco >= 5 && res.ultPouco && /^Últimos 7 dias\. Sem uso: .*Feed.*\. Menos usados: Coberturas, Notícia comentada, Balança, Quem noticiou, Giros de notícia\.$/.test(res.hint), 'painel: menos usados destacados', res.hint);
      const nomes = await ev(P, () => UI184_REC.map(x => x[0]));
      const pedidos = ['Capa', 'Matéria', 'Agenda', 'Balança', 'Busca', 'Guardar', 'Histórico', 'Feed', 'Post', 'Notícia comentada', 'Colunas', 'Conversas', 'Repostar', 'Curtir/comentar', 'Seguir pessoas', 'Atividade', 'Avisos', 'Hashtags', 'Em 1 min', 'Quem noticiou', 'Coberturas', 'Indicadores', 'Giros de notícia'];
      ok(nomes.join('|') === pedidos.join('|'), 'os 23 recursos do Pedro, com os nomes dele');
      const sem = await ev(P, l => UI184_REC.filter(([n, re]) => !l.some(e => re.test(e) && ui184Recurso(e) === n)).map(x => x[0]), [...evs]);
      ok(sem.length === 0, 'cada recurso tem pelo menos uma contagem identificável no código', sem);
      // painel desenhado na tela (como o admin vê)
      await ev(P, h => { const d = document.createElement('div'); d.id = 'teste184'; d.className = 'gut'; d.innerHTML = h; document.querySelector('#v-capa').prepend(d); window.scrollTo(0, 0) }, html); await sleep(300);
      await ev(P, () => { const e = document.querySelector('#teste184 .ui184-rec'); window.scrollTo(0, scrollY + e.getBoundingClientRect().top - 80) }); await sleep(200);
      await U.foto(P, 'uso-f1-painel');
      ok(await ev(P, () => document.documentElement.scrollWidth <= innerWidth), 'painel sem rolagem lateral');
      await ev(P, () => document.getElementById('teste184').remove());
    }
    ok(!P._erros.length, 'sem erro de JavaScript' + tag, P._erros.slice(0, 3));
    await ctx.close();
  }
  await b.close();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error('Error', e); process.exit(1) });
