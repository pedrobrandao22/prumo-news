// Corretor 20/11 (b). (1) Causa notas-internas: recados do robô nas Últimas da Capa ("proximo e faq trazem a Câmara",
// "contagem vencida trocada por linha do tempo", "etapa avança para Câmara") e a nota de bastidor das rodadas em
// "Atualizações de hoje". Agora js/163 (cr163Limpa) tira os recados dos textos de leitor (mesma lista do validar.py) e
// rodadaDetalhe (029) não mostra mais a nota: usa o campo "leitor" do registro, o motivo ou a contagem.
// (2) Feed com o dólar de outubro (reserva do feed.json, R$ 5,02) quando se vai direto ao Feed: o indicadores.json que
// chega depois troca os números do Feed já na tela (carregarIndAuto, 031). Porta 9421.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9421, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  // feed real do repositório (reserva de indicadores de 22/10: R$ 5,02) com hora fresca + recados de robô nas mudanças
  const f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const sp = new Date(Date.now() - 12 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00'; f.atualizado_em = sp;
  const ids = f.pautas.map(p => p.id);
  const RECADOS = [
    ['B3 fecha amanhã', '; proximo e faq trazem a Câmara na segunda (23).'],
    ['Trump, Xi e Putin começam a reunião trilateral em Shenzhen', '; contagem vencida trocada por linha do tempo.'],
    ['Ajuste fiscal passa no Senado e entra na pauta da Câmara na segunda (23)', '; etapa avança para Câmara.'],
    ['Enem: professores pedem anular a questão 159', '; Caso Master e Enem ficam para a próxima por falta de página que confirmasse.'],
  ];
  f.mudancas = { titulo: f.mudancas.titulo, itens: RECADOS.map(([a, b], i) => ({ pid: ids[i], tipo: 'atualizada', texto: a + b })) };
  f.mudancas.itens.push({ pid: ids[4], tipo: 'atualizada', texto: 'O julgamento fica para a próxima semana, segundo o STF' });
  // cartão do dólar com título fixo: o título do dia muda (24/11: "Dólar cai a {dolar}…") e o histórico de títulos traz
  // "…fecha a R$ 5,93" escrito à mão, que não vem do indicadores.json; o teste confere só o número que vem dele
  { const pd = f.pautas.find(p => JSON.stringify(p.neutro || {}).includes('{dolar}')) || f.pautas.find(p => JSON.stringify(p).includes('{dolar}')) || f.pautas[f.pautas.length - 1];
    if (pd) { pd.neutro = Object.assign(pd.neutro || {}, { titulo: 'Dólar fecha a {dolar} na {dolar.dia}' }); delete pd.titulos } }
  fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f));
  for (const x of ['feed-leve.json']) try { fs.unlinkSync(path.join(__dirname, '..', 'site', x)) } catch (e) {}
  const IND = fs.readFileSync(path.join(U.REPO, 'indicadores.json'), 'utf8'); const dolar = JSON.parse(IND).itens.find(x => x.id === 'dolar').valor;
  U.servir('site', PORTA); await sleep(800); const b = await U.navegador();

  // ---- (1) Últimas da Capa e Atualizações de hoje ----
  {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
    await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 12000);
    const r = await P.evaluate(() => ({ mud: FEED.mudancas.itens.map(i => i.texto), ult: tickerItens(10).map(i => i.txt),
      capa: [...document.querySelectorAll('#v-capa .cp-l b')].map(x => x.textContent).join(' | ') }));
    const ruim = /proximo|faq|contagem vencida|linha do tempo|etapa avança|ficam para a próxima|página que confirm/i;
    ok(!r.mud.some(t => ruim.test(t)), 'mudanças sem recado do robô', r.mud);
    ok(r.mud.includes('B3 fecha amanhã') && r.mud.some(t => /^Trump, Xi e Putin começam a reunião trilateral em Shenzhen$/.test(t)) && r.mud.some(t => /^Ajuste fiscal passa no Senado/.test(t)), 'o fato antes do recado continua', r.mud);
    ok(r.mud.some(t => /fica para a próxima semana/.test(t)), 'texto de leitor com "fica para a próxima semana" fica', r.mud);
    ok(!r.ult.some(t => ruim.test(t)) && !ruim.test(r.capa), 'Últimas da Capa sem recado do robô', r.capa.slice(0, 400));
    // Atualizações de hoje
    const abre = it => P.evaluate(([it]) => { S.rodadas = { dia: hojeSP(), itens: it }; closeLayer && closeLayer(); abrirRodadas(true);
      return [...document.querySelectorAll('#rodbox .sres li')].map(li => li.innerText.replace(/\s+/g, ' ').trim()) }, [it]);
    const l = await abre({
      '19h48': { tipo: 'rapida', status: 'ok', publicou: true, pautas: 2, mudancas: 2, nota: 'Fechamento do dia (dólar R$ 5,85) registrado em Dólar e Bolsa e Goldman; Caso Master fica para a próxima por falta de página que confirmasse.' },
      '17h48': { tipo: 'rapida', status: 'sem_mudancas', publicou: false, motivo: 'sem_confirmacao', nota: 'Acionou Moraes marcar a Lei da Dosimetria, mas nenhuma página lida confirma a data. A próxima rápida tenta de novo.' },
      '13h48': { tipo: 'rapida', status: 'ok', publicou: true, pautas: 1, mudancas: 1, leitor: 'Fachin tira o sigilo do relatório da PF sobre Mendonça', nota: 'Acionaram Caso Master; Gazeta do Povo e Migalhas.' },
      '11h48': { tipo: 'rapida', status: 'ok', publicou: true, pautas: 1, mudancas: 1, leitor: 'Dólar sobe; contagem vencida trocada por linha do tempo', nota: 'x' } });
    const bast = /Goldman|registrad|confirmasse|Acion|página lida|tenta de novo|contagem vencida|Gazeta do Povo/;
    ok(l.length === 4 && !l.some(t => bast.test(t)), 'Atualizações de hoje: nada da nota de bastidor para o leitor', l);
    ok(/2 notícias atualizadas\./.test(l[0]), '19h48 sem "leitor": só a contagem', l[0]);
    ok(/volta a conferir na próxima atualização/.test(l[1]), '17h48: o motivo em palavras', l[1]);
    ok(/Fachin tira o sigilo do relatório da PF sobre Mendonça\./.test(l[2]), '13h48: a frase "leitor"', l[2]);
    ok(/Dólar sobe\./.test(l[3]), '11h48: leitor com recado perde o recado', l[3]);
    await P.evaluate(() => { S.membro = { id: 'adm' }; S.uid = 'adm'; S.membros = { adm: { papel: 'admin' } } });
    const la = await abre({ '13h48': { tipo: 'rapida', status: 'ok', publicou: true, pautas: 1, mudancas: 1, leitor: 'Fachin tira o sigilo', nota: 'Acionaram Caso Master.' } });
    ok(/Fachin tira o sigilo/.test(la[0]) && /Acionaram Caso Master/.test(la[0]), 'administrador vê leitor e nota', la);
    ok(!P._erros.length, 'sem erros na página (1) ' + P._erros.join('|'));
    await ctx.close();
  }

  // ---- (2) direto ao Feed com indicadores.json chegando depois ----
  for (const [nome, atraso, espera] of [['indicadores chega em 2,5 s', 2500, 0], ['indicadores chega antes, Feed 4 s depois', 200, 4000]]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.route(/indicadores\.json/, async r => { await sleep(atraso); r.fulfill({ status: 200, contentType: 'application/json', body: IND }) });
    const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
    await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#t-feed'), null, 12000);
    if (espera) await sleep(espera);
    await P.evaluate(() => { try { localStorage.removeItem('prumo-guia') } catch (e) {} document.querySelector('#t-feed').click() });
    await sleep(atraso + 3000);
    const r = await P.evaluate(() => { const t = document.querySelector('#v-feed') || document.body; return { txt: t.innerText, ind: !!IND_AUTO } });
    // procura o cartão do dólar no feed renderizado (rola até aparecer)
    let txt = r.txt;
    for (let i = 0; i < 25 && !/Dólar fecha a R\$ [\d,]+ na /.test(txt); i++) { await P.evaluate(() => window.scrollBy(0, 700)); await sleep(250); txt = await P.evaluate(() => (document.querySelector('#v-feed') || document.body).innerText) }
    const m = /Dólar fecha a (R\$ [\d,]+) na /.exec(txt);
    ok(r.ind && m && m[1] === dolar, `${nome}: cartão do Feed com o dólar de indicadores.json (${dolar}), não o de outubro`, m && m[0]);
    ok(!/R\$ 5,02/.test(txt), `${nome}: nada de R$ 5,02 no Feed`);
    ok(!P._erros.length, 'sem erros na página (2) ' + P._erros.join('|'));
    await ctx.close();
  }
  await b.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
