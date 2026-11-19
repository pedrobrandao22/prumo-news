// Corretor 19/11 (3ª rodada): causa "hoje depois da meia-noite" — textos com dia relativo errados depois da virada.
// A rodada grava a data absoluta ("às 20h30 de quarta (18)") e o app troca por hoje/ontem (js/185). O "de"/"até" pulavam a
// regra do verbo: "jogam às 20h30 de quarta (18)" lido na quinta virava "jogam às 20h30 de ontem" (e "vai até ontem",
// "não está na pauta de ontem"). Agora, com verbo no presente na oração, fica a data. E a contagem (js/110) não escreve
// mais "Hoje para a cúpula" nem "foi em 18 de nov: para a cúpula": no dia, "É hoje: cúpula…"; depois, conta para o
// próximo marco. Mais o achado da conversa: o degradê do rodapé (css/88) não cobre a caixa de mensagem. Porta 9146.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9146, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const js = fs.readFileSync(path.join(__dirname, '..', 'app/src/js/185-datas.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', 'app/src/js/110-acervo.js'), 'utf8');
  ok(!/\(\?<[=!]/.test(js), '185/110: sem lookbehind');
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const P = U.erros(await ctx.newPage(), 'P');
  await P.goto(BASE); await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 10000);
  const L = await ev(P, () => { const S = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], h = hojeSP();
    const r = k => { const d = somaDias(h, k), x = new Date(d + 'T12:00:00Z'); return { d, n: S[x.getUTCDay()], dm: x.getUTCDate() + '/' + (x.getUTCMonth() + 1), dia: x.getUTCDate(), art: x.getUTCDay() % 6 === 0 ? 'no' : 'na', o: x.getUTCDay() % 6 === 0 ? 'o' : 'a' } };
    return { on: r(-1), hj: r(0), am: r(1), d2: r(-2) } });
  const lab = x => `${x.n} (${x.dia})`;
  const casos = [
    // os do testador (19/11 01h52 e o arquivado de 18/11)
    [`Flamengo (76) e Palmeiras (73) jogam às 20h30 de ${lab(L.on)}`, null],
    [`Cruzeiro x Palmeiras e Flamengo x Athletico-PR, às 20h30 de ${lab(L.on)}.`, `Cruzeiro x Palmeiras e Flamengo x Athletico-PR, às 20h30 de ontem.`],
    [`a validação na faculdade vai até ${L.on.o} ${lab(L.on)}`, null],
    [`o projeto não está na pauta de ${lab(L.on)}`, null],
    [`fica fora da pauta da Câmara até ${L.on.dm}`, null],
    [`Corinthians e Grêmio, no Z-4, jogam ${L.on.art} ${lab(L.on)}.`, null],
    // passado e sem verbo continuam virando "ontem"
    [`Flamengo e Palmeiras venceram às 20h30 de ${lab(L.on)}`, `Flamengo e Palmeiras venceram às 20h30 de ontem`],
    [`a sessão ${L.on.art === 'no' ? 'do' : 'da'} ${lab(L.on)}`, 'a sessão de ontem'],
    [`desde ${L.on.o} ${lab(L.on)}`, 'desde ontem'],
    [`a CBF confirmou até ${L.on.dm}`, 'a CBF confirmou até ontem'],
    [`O Senado aprovou o texto em ${L.on.dm}`, 'O Senado aprovou o texto ontem'],
    // hoje/amanhã não mudam
    [`Os três se reúnem em Shenzhen ${L.hj.art} ${lab(L.hj)}`, 'Os três se reúnem em Shenzhen hoje'],
    [`jogam às 20h30 de ${lab(L.hj)}`, 'jogam às 20h30 de hoje'],
    [`inscrições até ${L.am.dm}`, 'inscrições até amanhã'],
    // antigos da causa "datas" (não podem voltar)
    [`O Senado vota ${L.on.art} ${lab(L.on)} os quatro destaques`, null],
    [`Quem foi pré-selecionado valida a inscrição ${L.on.art} ${lab(L.on)}`, null],
    [`prevista para ${L.on.o} ${lab(L.on)}`, null],
  ];
  const res = await ev(P, c => c.map(([a]) => dt185Rel(a)), casos);
  casos.forEach(([a, e], i) => ok(res[i] === (e === null ? a : e), `"${a}" → "${e === null ? '(igual)' : e}"`, res[i]));

  // contagem: no dia, depois do dia com e sem marco seguinte, antes do dia
  const ct = await ev(P, L => { const f = (v) => { const d = document.createElement('div'); d.innerHTML = visualHTML(Object.assign({ tipo: 'grafico', forma: 'contagem', titulo: 'Contagem para a cúpula da Apec', fonte: 'AFP' }, v));
      return { t: d.querySelector('.acv-ct-u')?.textContent || '', n: d.querySelector('.acv-ct-n')?.textContent || '', al: d.querySelector('.acv-ct')?.getAttribute('aria-label') || '' } };
    return { hoje: f({ data: L.hj.d, rotulo: 'para a cúpula da Apec, em Shenzhen' }),
      passou_marco: f({ data: L.on.d, rotulo: 'para a cúpula da Apec, em Shenzhen', itens: [{ data: L.am.d, texto: 'Encontro de Xi, Trump e Putin' }] }),
      passou_marco_hoje: f({ data: L.on.d, rotulo: 'para a cúpula da Apec, em Shenzhen', itens: [{ data: L.hj.d, texto: 'Encontro de Xi, Trump e Putin' }] }),
      passou: f({ data: L.d2.d, rotulo: 'para a cúpula da Apec, em Shenzhen', itens: [{ data: L.on.d, texto: 'Fim' }] }),
      falta: f({ data: L.am.d, rotulo: 'para a cúpula da Apec' }) } }, L);
  ok(ct.hoje.t === 'É hoje: a cúpula da Apec, em Shenzhen' || ct.hoje.t === 'É hoje: cúpula da Apec, em Shenzhen', 'contagem no dia: "É hoje: cúpula…" (sem "Hoje para")', ct.hoje);
  ok(!/hoje para|: para/i.test(JSON.stringify(ct)), 'nenhuma contagem escreve "Hoje para" nem ": para"', ct);
  ok(ct.passou_marco.n === '1' && /dia para: encontro de Xi/.test(ct.passou_marco.t), 'data passada com marco amanhã: conta 1 dia para o encontro', ct.passou_marco);
  ok(ct.passou_marco_hoje.n === 'Hoje' && /É hoje: encontro de Xi/.test(ct.passou_marco_hoje.t), 'data passada com marco hoje: "É hoje: encontro…"', ct.passou_marco_hoje);
  ok(/^Foi em .+: cúpula da Apec/.test(ct.passou.t), 'tudo passado: "Foi em …: cúpula…"', ct.passou);
  ok(ct.falta.n === '1' && /dia para a cúpula/.test(ct.falta.t), 'antes do dia continua "1 dia para a cúpula"', ct.falta);

  // conversa: o degradê do rodapé não fica por cima da caixa de mensagem
  const dg = await ev(P, () => { const c = () => getComputedStyle(document.body, '::after').content; const a = c();
    document.body.classList.add('dm-conv'); const b = c(); document.body.classList.remove('dm-conv');
    document.body.classList.add('co160-folha'); const d = c(); document.body.classList.remove('co160-folha'); return { a, b, d } });
  ok(dg.a !== 'none' && dg.b === 'none' && dg.d === 'none', 'degradê do rodapé: na Capa sim; na conversa aberta e na folha da conta, não', dg);
  ok(!P._erros.length, 'sem erros na página', P._erros.slice(0, 3));
  await b.close(); srv.kill();
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1911c: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); process.exit(1) });
