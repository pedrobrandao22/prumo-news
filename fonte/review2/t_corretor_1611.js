// Corretor 16/11 (161, 162, fotos): (1) a ilustração "genérica" segue o assunto (China/voos/florestas/Nvidia não
// mostram o Congresso; Esplanada continua com ele; sem pista, desenho neutro); (2) a foto antiga em P&B do pregão
// (Bolsa de Valores, Núcleo Editorial) fica bloqueada; (3) post com notícia: nos primeiros minutos, a notícia com o
// comentário sobe para o topo do Feed e aparece na tela depois de publicar. Porta 8622.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  montarPasta('xc1611'); srv = U.servir('xc1611', 8622); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const br = await U.navegador();
  const A = U.erros(await H.pagina(br, { sessao: { user: { id: ids.a, email: 'a@x' } }, viewport: { width: 390, height: 844 }, ctx: { deviceScaleFactor: 1, isMobile: true, hasTouch: true } }), 'Pedro');
  await A.addInitScript(PROD); await A.goto('http://localhost:8622/index.html');
  await esperar(A, () => typeof VIEW !== 'undefined' && S.membro && S.amigosOk && PUB.on === true, null, 20000); await sleep(600);

  // ===== 1. ilustração genérica =====
  const CONGRESSO = 'x="186" y="40" width="12" height="150"';
  const cena = (alt, rotulo) => ev(A, ([alt, rotulo]) => svgOf({ modelo: 'generica', alt, dados: { rotulo } }), [alt, rotulo]);
  const casos = [
    ['Ilustração genérica de três bandeiras diante de uma mesa de cúpula', 'CÚPULA NA CHINA'],
    ['Ilustração de avião em solo', 'Voos suspensos nos EUA'],
    ['Ilustração genérica de floresta com moedas', 'FUNDO DE FLORESTAS'],
    ['Ilustração de empresa de tecnologia', 'Nvidia: troca no comando'],
    ['Ilustração de bola de futebol em gramado', 'Série B · playoffs'],
    ['Ilustração genérica de um decreto adiado', 'Decreto da 6×1 adiado'],
  ];
  const svgs = [];
  for (const [alt, rot] of casos) { const s = await cena(alt, rot); svgs.push(s); ok(s.indexOf(CONGRESSO) < 0 && s.indexOf('<svg') === 0, `"${rot}": sem o desenho do Congresso`) }
  ok(new Set(svgs.map(s => s.replace(/<text[\s\S]*?<\/text>/g, '').replace(/aria-label="[^"]*"/, ''))).size === svgs.length, 'cada assunto tem um desenho diferente');
  const esp = await cena('Ilustração genérica de uma Esplanada com ministérios', 'MINISTÉRIOS DO 4º MANDATO');
  ok(esp.indexOf(CONGRESSO) >= 0, 'Esplanada/ministérios continua com o Congresso');
  ok(svgs.every(s => /CÚPULA|Voos|FLORESTAS|Nvidia|Série B|Decreto/.test(s)), 'a etiqueta continua no desenho');
  ok(await ev(A, () => { const s = sceneOf({ modelo: 'generica', dados: {} }); return typeof s === 'string' && s.length > 50 }), 'genérica sem alt nem rótulo desenha algo (neutro)');
  ok(await ev(A, () => sceneOf({ modelo: 'plenario', alt: 'floresta', dados: { total: 81, destaque: 41 } }).indexOf('de 81 votos') >= 0), 'outros modelos não mudam');

  // ===== 2. foto antiga do pregão bloqueada =====
  ok(await ev(A, () => ft157Bloq({ url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Bolsa_de_Valores_%2817205467578%29.jpg', credito: 'Foto de arquivo: Núcleo Editorial/Wikimedia Commons (CC BY 2.0)' })), 'foto P&B do pregão de viva-voz bloqueada no app');
  ok(await ev(A, () => !ft157Bloq({ url: 'https://upload.wikimedia.org/wikipedia/commons/x/xx/Predio_B3_Sao_Paulo.jpg', credito: 'Foto de arquivo: Fulano/Wikimedia Commons (CC BY 2.0)' })), 'outra foto da Bolsa continua valendo');

  // ===== 3. post com notícia aparece no topo =====
  await ev(A, () => go('feed')); await esperar(A, () => !!document.querySelector('#cn102-bar [data-cn102bar]'), null, 8000);
  await ev(A, () => document.querySelector('#cn102-bar [data-cn102bar]').click()); await sleep(400);
  await A.fill('#cp152-tx', 'Comentário do corretor sobre a notícia'); await sleep(150);
  await ev(A, () => document.querySelector('[data-cp152ax="nt"]').click()); await sleep(600);
  // escolhe uma notícia do fim da lista (longe do topo do Feed)
  const pid = await ev(A, () => { const l = [...document.querySelectorAll('#layer .cn102-ntl [data-fc164nt]')]; const b = l[l.length - 1]; b && b.click(); return b && b.dataset.fc164nt }); await sleep(500);
  await ev(A, () => document.querySelector('[data-cp152pub]').click());
  ok(await esperar(A, p => PUB.itens.some(x => x.autor === S.uid && x.pid === p && x.texto === 'Comentário do corretor sobre a notícia'), pid, 8000), 'publica como notícia comentada');
  const visto = await esperar(A, () => { const x = PUB.itens.find(x => x.texto === 'Comentário do corretor sobre a notícia'); const el = x && document.getElementById('p-u:' + x.id); if (!el) return false; const r = el.getBoundingClientRect(); return VIEW === 'feed' && r.top >= 0 && r.top < innerHeight * .9 }, null, 8000);
  ok(visto, 'depois de publicar, o comentário com a notícia aparece na tela', await ev(A, () => { const x = PUB.itens.find(x => x.texto === 'Comentário do corretor sobre a notícia'); const el = x && document.getElementById('p-u:' + x.id); return { el: !!el, top: el && Math.round(el.getBoundingClientRect().top + scrollY), y: scrollY } }));
  ok(await ev(A, () => { const x = PUB.itens.find(x => x.texto === 'Comentário do corretor sobre a notícia'); const el = x && document.getElementById('p-u:' + x.id); return !!el && el.getBoundingClientRect().top + scrollY < 3 * innerHeight }), 'o comentário fica no começo do Feed (não 10 telas abaixo)');
  await U.foto(A, 'corretor-1611-post-noticia');
  // passada a janela, volta ao lugar de sempre
  ok(await ev(A, () => { const meu = PUB.itens.find(x => x.texto === 'Comentário do corretor sobre a notícia'); const at = meu.at; meu.at = Date.now() - 20 * 60e3;
    const l = fc107Mistura([{ id: 'zz' }, { id: meu.pid }, { id: meu.id, __pub: meu, __fc107: { k: 0, n: 1 } }], []); meu.at = at; return l[0].id === 'zz' }), 'depois de 15 min, a notícia volta ao lugar de sempre');
  ok(await ev(A, () => { const meu = PUB.itens.find(x => x.texto === 'Comentário do corretor sobre a notícia');
    const l = fc107Mistura([{ id: 'zz' }, { id: meu.pid }, { id: meu.id, __pub: meu, __fc107: { k: 0, n: 1 } }], []); return l[0].id === meu.pid && l[1].id === meu.id && l[2].id === 'zz' }), 'nos primeiros minutos, notícia + comentário no topo, juntos');
  ok(A._erros.length === 0, 'sem erro de JavaScript', A._erros);
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro: ' + e.message); try { srv && srv.kill() } catch (x) { } process.exit(1) });
