// Corretor 18/11 noite (causa "datas"): a troca de datas por hoje/ontem/amanhã (js/185) só conhecia "terça (17)".
// Agora vale também o dia com mês sem a semana ("em 18/11", "até 20/11", "Em 15/11, Kassio sinalizou"), com as mesmas
// regras de "ontem" (só com verbo no passado). E a bolha de "Mandar notícia" fica com a data absoluta, igual ao texto que
// vai para o WhatsApp. Teste da CLASSE: os casos antigos da causa (terça na terça, "vota ontem", Mercados de madrugada,
// Fies) continuam certos. Porta 9142.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9142, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const js = fs.readFileSync(path.join(__dirname, '..', 'app/src/js/185-datas.js'), 'utf8');
  ok(!/\(\?<[=!]/.test(js), '185: sem lookbehind');
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const P = U.erros(await ctx.newPage(), 'P');
  await P.goto(BASE); await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 10000);
  const L = await ev(P, () => { const S = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], h = hojeSP();
    const r = k => { const d = somaDias(h, k), x = new Date(d + 'T12:00:00Z'); return { n: S[x.getUTCDay()], dm: x.getUTCDate() + '/' + (x.getUTCMonth() + 1), dia: x.getUTCDate(), art: x.getUTCDay() % 6 === 0 ? 'no' : 'na' } };
    return { on: r(-1), hj: r(0), am: r(1), d2: r(-2), d5: r(5) } });
  const lab = x => `${x.n} (${x.dia})`;
  const casos = [
    // novos: dia/mês sem a semana
    [`PL das big techs fica fora da pauta da Câmara em ${L.hj.dm}`, 'PL das big techs fica fora da pauta da Câmara hoje'],
    [`Em ${L.on.dm}, Kassio sinalizou levar ao plenário a revisão`, 'Ontem, Kassio sinalizou levar ao plenário a revisão'],
    [`O Senado aprovou o texto em ${L.on.dm}`, 'O Senado aprovou o texto ontem'],
    [`O Senado vota os destaques em ${L.on.dm}`, null],       // verbo no presente: "vota ontem" não
    [`Copom decide em ${L.am.dm}`, 'Copom decide amanhã'],
    [`inscrições até ${L.am.dm}`, 'inscrições até amanhã'],
    [`sem acordo desde ${L.on.dm}`, 'sem acordo desde ontem'],
    [`Em ${L.d2.dm}, Lula disse que buscou parceiros`, null],  // anteontem: fica a data
    [`prazo em ${L.d5.dm}`, null],
    [`cobertura de ${L.on.dm} a ${L.hj.dm}`, null],            // faixa de datas: não mexe
    [`em ${L.hj.dm}/2025`, null],                               // com ano: não mexe
    [`em ${L.hj.dm} a ${L.am.dm}`, null],
    [`placar de ${L.hj.dm}`, null],                             // sem em/até/desde
    // antigos da causa (não podem voltar)
    [`Senado vota os quatro destaques do ajuste fiscal ${L.hj.art} ${lab(L.hj)}`, 'Senado vota os quatro destaques do ajuste fiscal hoje'],
    [`O Senado vota ${L.on.art} ${lab(L.on)} os quatro destaques`, null],
    [`o Focus reduziu o IPCA de 2026 a 5,11% e o Senado vota os destaques do ajuste fiscal ${L.on.art} ${lab(L.on)}`, null],
    [`Quem foi pré-selecionado valida a inscrição ${L.on.art} ${lab(L.on)}`, null],
    [`Aneel retoma ${L.hj.art} ${lab(L.hj)} a análise`, 'Aneel retoma hoje a análise'],
    [`prevista para ${L.on.art === 'no' ? 'o' : 'a'} ${lab(L.on)}`, null],
  ];
  const res = await ev(P, c => c.map(([a]) => dt185Rel(a)), casos);
  casos.forEach(([a, e], i) => ok(res[i] === (e === null ? a : e), `"${a}" → "${e === null ? '(igual)' : e}"`, res[i]));

  // na tela: título da manchete com "em dd/mm"
  const pid = await ev(P, L => { const r = capaEscolha(), p = r.man || FEED.pautas[0];
    p.neutro.titulo = `PL das big techs fica fora da pauta da Câmara em ${L.hj.dm}`;
    p.subtitulo = `O projeto não está na pauta; a votação fica para ${L.am.art} ${L.am.n} (${L.am.dia}).`; renderCapa(); return p.id }, L);
  await sleep(400);
  const capa = await ev(P, () => document.getElementById('v-capa').innerText);
  ok(/fica fora da pauta da Câmara hoje/.test(capa), 'Capa: "em dd/mm" de hoje vira "hoje"', capa.slice(0, 300));
  ok(await ev(P, ([pid, L]) => FEED.pautas.find(p => p.id === pid).neutro.titulo.endsWith(L.hj.dm), [pid, L]), 'o feed guarda a data absoluta');

  // Mandar notícia: a bolha mostra o que vai para o WhatsApp (data absoluta), sem "hoje"/"amanhã"
  await ev(P, pid => compartilhar(pid), pid); await sleep(600);
  const env = await ev(P, () => ({ b: document.querySelector('.sheet .env-bolha')?.innerText || '', t: ENV_ATUAL && ENV_ATUAL.texto || '',
    wa: decodeURIComponent((document.querySelector('.sheet [data-envwa]')?.getAttribute('href') || '').split('text=')[1] || '') }));
  ok(env.b.includes(L.hj.dm) && !/\bhoje\b/.test(env.b), 'bolha de Mandar notícia com a data absoluta', env.b);
  ok(env.wa.includes(L.hj.dm) && env.t.includes(`(${L.am.dia})`), 'texto do WhatsApp com a data absoluta', env.wa);
  ok(env.b.replace(/\s+/g, ' ').trim().slice(0, 60) === env.t.replace(/\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 60), 'bolha igual ao texto enviado');
  await U.foto(P, 'corretor-1811c-mandar');
  await ev(P, () => closeLayer()); await sleep(300);

  ok(!P._erros.length, 'sem erros ' + P._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1811c: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
