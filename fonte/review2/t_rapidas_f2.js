// Fase 2 · rodadas rápidas (188, 18/11): "Atualizações de hoje" mostra por que uma rápida passou sem novidade
// (campo "motivo" do rodadas.json, conferido pelo tools/aplicar.py --rodada). Registro antigo, sem motivo, fica como era.
// Visitante (site sem configuração), feed do repositório. Porta 9140.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9140, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const p = U.erros(await ctx.newPage(), 'rapidas'); await p.goto(BASE);
  await esperar(p, () => typeof FEED !== 'undefined' && FEED && typeof abrirRodadas === 'function', null, 12000);
  const hoje = await p.evaluate(() => hojeSP());
  const abre = it => p.evaluate(([d, it]) => { S.rodadas = { dia: d, itens: it }; closeLayer && closeLayer(); abrirRodadas(true);
    return [...document.querySelectorAll('#rodbox .sres li')].map(li => li.innerText.replace(/\s+/g, ' ').trim()) }, [hoje, it]);

  // 1. visitante: motivo vira frase; sem motivo, o texto antigo
  let l = await abre({ '13h48': { tipo: 'rapida', status: 'sem_mudancas', publicou: false, motivo: 'sem_confirmacao', nota: 'Acionar por ajuste-fiscal-lula-4, mas as buscas não trouxeram o desfecho.' },
    '11h48': { tipo: 'rapida', status: 'sem_mudancas', publicou: false, nota: 'Nada novo: nada que acione.' },
    '09h48': { tipo: 'rapida', status: 'sem_mudancas', publicou: false, motivo: 'nada_novo', nota: 'Nada que acione (17 assuntos fora do feed).' },
    '06h52': { tipo: 'completa', status: 'ok', publicou: true, pautas: 27, mudancas: 8, motivo: 'nada_novo', nota: 'Edição completa com 27 notícias.' } });
  ok(l.length === 4, '4 rodadas na lista', l);
  ok(/sem novidade/.test(l[0]) && /ainda sem confirmação; o Prumo volta a conferir na próxima atualização/.test(l[0]), '13h48: motivo sem_confirmacao em palavras', l[0]);
  ok(!/ajuste-fiscal|buscas|acionar/i.test(l[0]), '13h48: sem bastidor para o visitante', l[0]);
  ok(/Nada mudou desde a anterior\./.test(l[1]) && !/acione|Nenhum fato|confirmação|já estavam|menores/.test(l[1]), '11h48 (registro antigo, sem motivo): linha simples, sem a nota (20/11)', l[1]);
  ok(/Nenhum fato novo relevante desde a anterior\./.test(l[2]) && !/Nada mudou/.test(l[2]), '09h48: motivo nada_novo em palavras', l[2]);
  ok(/8 notícias atualizadas/.test(l[3]) && !/Nenhum fato novo|Edição completa com/.test(l[3]), 'rodada publicada ignora o motivo e a nota (20/11)', l[3]);
  await U.foto(p, 'rapidas-f2-visitante');

  // 2. administrador: frase + código + nota completa
  await p.evaluate(() => { S.membro = { id: 'adm' }; S.uid = 'adm'; S.membros = { adm: { papel: 'admin' } } });
  l = await abre({ '13h48': { tipo: 'rapida', status: 'sem_mudancas', publicou: false, motivo: 'ja_no_feed', nota: 'Acionar por ajuste-fiscal-lula-4, já aplicado às 11h49.' } });
  ok(/Os fatos novos já estavam na edição\. \(ja_no_feed\)/.test(l[0]) && /já aplicado às 11h49/.test(l[0]), 'admin vê frase, código e nota', l[0]);
  await p.evaluate(() => { S.membro = null; S.uid = null; S.membros = {} });

  ok(!p._erros.length, 'sem erros na página ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_rapidas_f2: ${r.OKS} ok, ${r.FALHAS} falhas`);
  await br.close(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
