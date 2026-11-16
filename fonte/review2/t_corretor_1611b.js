// Corretor 16/11 tarde (163): (1) notas da redação ("atualização duplicada … removida", "Tema passa a …",
// "nesta rodada") saem dos textos de leitor ao carregar a edição; (2) no Feed, a linha da cobertura diz o nome da
// cobertura (o mesmo título da folha); (3) tocar na manchete da Capa mostra o "Em 30 segundos" na tela e um toque
// repetido logo em seguida não fecha. Porta 8623.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const { montarPasta, PROD } = require('./_qc_comum');
const fs = require('fs'), path = require('path');
let srv = null;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  const { DIR, F } = montarPasta('xc1611b');
  // garante os casos do testador na edição de teste, venha o feed.json que vier
  F.mudancas = F.mudancas && typeof F.mudancas === 'object' ? F.mudancas : { itens: [] }; F.mudancas.itens = Array.isArray(F.mudancas.itens) ? F.mudancas.itens : [];
  const P0 = F.pautas[0], P1 = F.pautas[1] || F.pautas[0];
  F.mudancas.itens.unshift({ pid: P0.id, tipo: 'atualizada', texto: 'Dúvida sobre anulação da questão 159 de matemática; atualização duplicada de 14/11 removida' },
    { pid: P1.id, tipo: 'atualizada', texto: 'Tema passa a Dólar e Bolsa; fechamento de sexta (13) corrigido para R$ 5,65.' },
    { pid: P1.id, tipo: 'atualizada', texto: 'Atualização duplicada de 14/11 removida' });
  F.dormentes = Array.isArray(F.dormentes) ? F.dormentes : [];
  F.dormentes.push({ id: 'zz-dorm-163', titulo: 'Cobertura antiga de teste', tema: 'Teste 163', secao: 'politica', resumo: 'Levantamento divulgado na segunda (2). Quem fez o levantamento não foi apurado nesta rodada.' });
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F));
  try { fs.rmSync(path.join(DIR, 'feed-leve.json'), { force: true }) } catch (e) { }
  srv = U.servir('xc1611b', 8623); await sleep(800);
  const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const A = U.erros(await ctx.newPage(), 'leitor');
  await A.addInitScript(PROD); await A.goto('http://localhost:8623/index.html');
  await esperar(A, () => typeof FEED !== 'undefined' && FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cpi'), null, 20000); await sleep(800);

  // ===== 1. bastidor fora do texto do leitor =====
  const L = (s) => ev(A, s => cr163Limpa(s), s);
  ok(await L('Dúvida sobre anulação da questão 159 de matemática; atualização duplicada de 14/11 removida') === 'Dúvida sobre anulação da questão 159 de matemática', 'tira "atualização duplicada … removida" e fica o fato');
  ok(await L('Tema passa a Dólar e Bolsa; fechamento de sexta (13) corrigido para R$ 5,65.') === 'Fechamento de sexta (13) corrigido para R$ 5,65.', 'tira "Tema passa a …"');
  ok(await L('Quem fez o levantamento não foi apurado nesta rodada.') === 'Quem fez o levantamento não foi apurado até agora.', '"nesta rodada" vira "até agora"');
  ok(await L('Senado aprova a PEC por 60 a 10; texto volta à Câmara') === 'Senado aprova a PEC por 60 a 10; texto volta à Câmara', 'texto normal não muda');
  ok(await L('Polícia diz que documentos foram removidos do gabinete') === 'Polícia diz que documentos foram removidos do gabinete', '"removidos" em notícia de verdade não some');
  const mud = await ev(A, () => FEED.mudancas.itens.map(i => i.texto));
  ok(!mud.some(t => /duplicad|removid|tema passa/i.test(t)), 'mudanças da edição sem nota interna', mud.slice(0, 4));
  ok(mud.includes('Dúvida sobre anulação da questão 159 de matemática'), 'o fato do Enem continua nas mudanças');
  ok(await ev(A, () => !/duplicad|removid|nesta rodada/i.test(document.body.innerText)), 'a Capa não mostra nota interna');
  ok(await ev(A, () => /até agora/.test((FEED.dormentes.find(d => d.id === 'zz-dorm-163') || {}).resumo || '')), 'cobertura anterior: resumo sem "nesta rodada"');

  // ===== 3. manchete da Capa =====
  await ev(A, () => window.scrollTo(0, 0)); await sleep(300);
  const pid = await ev(A, () => { const b = document.querySelector('#v-capa .cpi-man .cpi-b[data-cpx]') || document.querySelector('#v-capa .cpi-b[data-cpx]'); return b && b.dataset.cpx });
  ok(!!pid, 'há manchete na Capa');
  await A.tap(`#cpi-${pid} .cpi-b .cp-t`); await sleep(1100);
  const vis = await ev(A, pid => { const x = document.querySelector('#cpi-' + CSS.escape(pid) + ' > .cpx'); if (!x) return { x: false }; const r = x.getBoundingClientRect(), nav = document.querySelector('.nav'); const baixo = innerHeight - ((nav && nav.offsetHeight) || 0);
    return { x: true, top: Math.round(r.top), baixo, ab: CP_AB === pid, cabe: r.top >= 40 && r.top + Math.min(r.height, 120) <= baixo } }, pid);
  ok(vis.x && vis.ab, 'tocar na manchete abre o Em 30 segundos', vis);
  ok(vis.cabe, 'o texto aberto aparece na tela, acima da barra de baixo', vis);
  await U.foto(A, 'corretor-1611b-manchete');
  // toque repetido logo depois: não fecha
  await ev(A, pid => { CR163_ABRIU = { pid, t: Date.now() } }, pid);
  await A.tap(`#cpi-${pid} .cpi-b .cp-t`); await sleep(300);
  ok(await ev(A, pid => CP_AB === pid && !!document.querySelector('#cpi-' + CSS.escape(pid) + ' > .cpx'), pid), 'segundo toque logo em seguida não fecha');
  await sleep(900);
  await A.tap(`#cpi-${pid} .cpi-b .cp-t`); await sleep(500);
  ok(await ev(A, pid => CP_AB !== pid, pid), 'tocar de novo depois de um tempo fecha (como antes)');

  // ===== 2. Feed: linha da cobertura com nome =====
  await ev(A, () => go('feed')); await esperar(A, () => !!document.querySelector('#v-feed .cobbar[data-cobpag]'), null, 10000); await sleep(600);
  const cb = await ev(A, () => [...document.querySelectorAll('#v-feed .cobbar[data-cobpag]')].slice(0, 6).map(b => { const p = pautaById(b.dataset.cobpag); return { t: b.querySelector('.cb-t').textContent.trim(), nome: p && cr163NomeCob(p) } }));
  ok(cb.length > 0 && cb.every(c => c.nome && c.t.indexOf(c.nome + ' · ') === 0 && c.t.length > c.nome.length + 3), 'cada linha da cobertura diz o nome da cobertura', cb);
  ok(cb.every(c => c.t !== 'Cobertura completa'), 'nenhuma linha só com "Cobertura completa"');
  // o nome é o mesmo título da folha que abre
  const pc = await ev(A, () => document.querySelector('#v-feed .cobbar[data-cobpag]').dataset.cobpag);
  const nomeLinha = cb[0] && cb[0].nome;
  await ev(A, pc => { const b = document.querySelector('#v-feed .cobbar[data-cobpag="' + CSS.escape(pc) + '"]'); b.scrollIntoView({ block: 'center' }); b.click() }, pc);
  await esperar(A, () => !!document.querySelector('.sheet .pc[data-pc]'), null, 6000); await sleep(400);
  const tit = await ev(A, () => { const s = document.querySelector('.sheet'); const h = s && (s.querySelector('h2,h3,.sheet-t,.sh-t,header b')); return (h && h.textContent || '').trim() });
  ok(!!tit && tit.indexOf(nomeLinha) >= 0, 'a folha que abre tem o mesmo nome da linha', { tit, nomeLinha });
  await U.foto(A, 'corretor-1611b-cobertura');
  ok(A._erros.length === 0, 'sem erro de JavaScript', A._erros);
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro: ' + e.message); try { srv && srv.kill() } catch (x) { } process.exit(1) });
