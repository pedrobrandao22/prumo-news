// Fase 2 · datas (185, 18/11): a rodada grava o dia com o número ("na terça (17)") e o app mostra "hoje", "ontem" ou
// "amanhã" pela data de hoje do leitor; fora disso o texto fica como está. Não mexe no que o leitor escreveu, nem em
// "antes de"/"depois de", nem quando o "na" fica num pedaço separado do dia. Na virada do dia refaz do texto original.
// O dado do feed não muda (a página de compartilhamento continua com a data absoluta). Porta 9110.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9110, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); U.servir('site', PORTA); await sleep(800);
  const js = fs.readFileSync(path.join(__dirname, '..', 'app/src/js/185-datas.js'), 'utf8');
  ok(!/\(\?<[=!]/.test(js), '185: sem lookbehind');
  const b = await U.navegador();
  for (const [nome, vp] of [['iPhone 13', { width: 390, height: 844 }], ['iPhone SE', { width: 375, height: 667 }]]) {
    const tag = ' (' + nome + ')';
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const P = U.erros(await ctx.newPage(), nome);
    await P.goto(BASE); await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 10000);
    // rótulos de ontem, hoje e amanhã como a rodada escreve
    const L = await ev(P, () => { const S = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'], h = hojeSP();
      const r = k => { const d = somaDias(h, k), x = new Date(d + 'T12:00:00Z'); return { d, n: S[x.getUTCDay()], dia: x.getUTCDate(), mes: x.getUTCMonth() + 1, art: x.getUTCDay() % 6 === 0 ? 'no' : 'na' } };
      return { h, on: r(-1), hj: r(0), am: r(1), d3: r(3), d30: r(28) } });
    const lab = x => `${x.n} (${x.dia})`;

    // 1. a função pura
    const casos = [
      [`Senado vota ${L.hj.art} ${lab(L.hj)}`, 'Senado vota hoje'],
      [`${L.hj.art === 'no' ? 'No' : 'Na'} ${lab(L.hj)}, o Senado aprovou`, 'Hoje, o Senado aprovou'],
      [`Copom decide ${L.am.art} ${lab(L.am)}`, 'Copom decide amanhã'],
      [`O STF julgou ${L.on.art} ${L.on.n}-feira (${L.on.dia})`, 'O STF julgou ontem'],
      [`até ${L.am.art === 'no' ? 'o' : 'a'} ${lab(L.am)}`, 'até amanhã'],
      [`desde ${L.on.art === 'no' ? 'o' : 'a'} ${lab(L.on)}`, 'desde ontem'],
      [`a sessão ${L.on.art === 'no' ? 'do' : 'da'} ${lab(L.on)}`, 'a sessão de ontem'],
      [`Na noite de ${lab(L.on)}`, `Na noite de ${lab(L.on)}`], // 18/11: sem verbo no passado, a data fica
      [`O Senado votou na noite de ${lab(L.on)}`, 'O Senado votou ontem à noite'],
      [`${lab(L.hj)[0].toUpperCase() + lab(L.hj).slice(1)}: Senado vota`, 'Hoje: Senado vota'],
      [`${L.hj.art} ${L.hj.n} (${L.hj.dia}/${L.hj.mes})`, 'hoje'],
      [`${L.hj.art} ${L.hj.n} (${L.hj.dia}/${L.hj.mes % 12 + 1})`, null],
      [`${L.d3.art} ${lab(L.d3)}`, null],
      [`${L.d30.art} ${lab(L.d30)}`, null],
      [`antes ${L.on.art === 'no' ? 'do' : 'da'} ${lab(L.on)}`, null],
      [`depois de ${lab(L.am)}`, null],
      [`${L.hj.art} ${L.am.n} (${L.hj.dia})`, null],  // dia da semana não bate: não mexe
    ];
    const res = await ev(P, c => c.map(([a]) => dt185Rel(a)), casos);
    casos.forEach(([a, e], i) => ok(res[i] === (e === null ? a : e), `"${a}" → "${e === null ? '(igual)' : e}"` + tag, res[i]));

    // 2. na tela: título e linha fina da manchete e da matéria; o feed continua com a data absoluta
    const pid = await ev(P, L => { const r = capaEscolha(), p = r.man || FEED.pautas[0];
      p.neutro.titulo = `Senado vota ${L.hj.art} ${L.hj.n} (${L.hj.dia}) a escala 6x1`;
      p.subtitulo = `A comissão aprovou o texto ${L.on.art} ${L.on.n} (${L.on.dia}); o plenário decide ${L.am.art} ${L.am.n} (${L.am.dia}).`;
      renderCapa(); return p.id }, L);
    await sleep(300);
    const capa = await ev(P, () => document.getElementById('v-capa').innerText);
    ok(/Senado vota hoje a escala 6x1/.test(capa), 'Capa: título com "hoje"' + tag, capa.slice(0, 300));
    ok(/aprovou o texto ontem; o plenário decide amanhã/.test(capa), 'Capa: linha fina com "ontem" e "amanhã"' + tag);
    ok(await ev(P, ([pid, L]) => FEED.pautas.find(p => p.id === pid).neutro.titulo.indexOf(`(${L.hj.dia})`) > 0, [pid, L]), 'o feed guarda a data absoluta' + tag);
    await ev(P, () => go('capa')); await sleep(400); await U.foto(P, 'datas-capa-' + nome.replace(/ /g, ''));
    await ev(P, pid => abrirMateria(pid), pid); await sleep(700);
    ok(await ev(P, () => /Senado vota hoje a escala 6x1/.test(document.querySelector('#layer').innerText)), 'Matéria: título com "hoje"' + tag);
    await U.foto(P, 'datas-materia-' + nome.replace(/ /g, ''));
    await ev(P, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

    // 3. o que o leitor escreveu fica como está; "na" num pedaço e o dia noutro também
    await ev(P, L => { const d = document.createElement('div'); d.id = 'teste185';
      d.innerHTML = `<p class="up-tx">Vamos ${L.hj.art} ${L.hj.n} (${L.hj.dia})</p><p class="pt">Vota ${L.hj.art} <b>${L.hj.n} (${L.hj.dia})</b></p><p class="pq">${L.am.n} (${L.am.dia})</p><textarea>${L.hj.n} (${L.hj.dia})</textarea>`;
      document.body.appendChild(d) }, L);
    await sleep(100);
    const t = await ev(P, () => { const d = document.getElementById('teste185'); return [d.querySelector('.up-tx').textContent, d.querySelector('.pt').textContent, d.querySelector('.pq').textContent, d.querySelector('textarea').value] });
    ok(t[0] === `Vamos ${L.hj.art} ${lab(L.hj)}`, 'post do leitor não muda' + tag, t[0]);
    ok(t[1] === `Vota ${L.hj.art} ${lab(L.hj)}`, '"na" separado do dia: não vira "na hoje"' + tag, t[1]);
    ok(t[2] === 'amanhã', 'dia sozinho num pedaço: vira "amanhã"' + tag, t[2]);
    ok(t[3] === lab(L.hj), 'campo de texto não muda' + tag, t[3]);

    // 4. virada do dia com o app aberto: refaz a partir do original
    const v = await ev(P, L => { const q = document.querySelector('#teste185 .pq'), out = [];
      DT185.dia = L.am.d; DT185.nos.forEach(t => dt185No(t)); out.push(q.textContent);   // leitor "no dia seguinte"
      dt185Dia(); out.push(q.textContent); return out }, L);
    ok(v[0] === 'hoje', 'no dia seguinte, o "amanhã" vira "hoje"' + tag, v[0]);
    ok(v[1] === 'amanhã', 'de volta a hoje, refaz do original' + tag, v[1]);
    await ev(P, () => document.getElementById('teste185').remove());
    ok(!P._erros.length, 'sem erro de JavaScript' + tag, P._erros.slice(0, 3));
    await ctx.close();
  }
  await b.close();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error('Error', e); process.exit(1) });
