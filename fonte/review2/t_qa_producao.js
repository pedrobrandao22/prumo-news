// QA do app como chega ao usuário (03/11): flags de produção ligadas (foco, sem Reels, Capa, guia, animações).
// Guia sem "Bem-vindo"/"curtir", ♥ da Capa logo após entrar, "Fonte" aceita domínio, eixo mensal "dez/24", figurinhas sem rosa/roxo
// (também as "assadas" na foto), nome comprido no cartão, matéria em 360px e volta para a matéria, botões do story em 360px, fundos sóbrios.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8960, BASE = `http://localhost:${PORTA}/index.html`; const PAIS = __dirname + '/ig3/paisagem.jpg';
const SH = __dirname + '/../qa/s/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'tour', 'anim']) localStorage.setItem('prumo-teste-' + k, '1') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1200) }
async function convite(A) { await ev(A, () => go('me')); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b, { viewport: { width: 360, height: 740 } }), 'B');
  await flags(A); await flags(B); await B.addInitScript(() => { try { if (!localStorage.getItem('radar-prefs')) localStorage.setItem('radar-prefs', JSON.stringify({ fonte: 1.3 })) } catch (e) { } });
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' }); await esperar(A, () => !!document.querySelector('#layer .tour'), null, 3000); await ev(A, () => closeLayer()); await sleep(400);
  ok(await ev(A, () => FOCO_LIGADO && !REELS_LIGADO && VIEW === 'capa'), 'estado de produção: foco ligado, sem Reels, abre na Capa');
  ok(await ev(A, () => !!document.querySelector('#v-capa .cp-top .at-b')), '♥ da Atividade aparece na Capa logo depois de criar a conta');

  // ===== 1. guia
  const nome = 'Maria Bernadete de Albuquerque Cavalcanti Figueiredo';
  await criar(B, { url: await convite(A), nome, email: 'b@x.com' }); await esperar(B, () => !!document.querySelector('#layer .tour'), null, 4000); await sleep(400);
  const tour = await ev(B, () => [...document.querySelectorAll('#layer .tr-t')].map(s => s.querySelector('h2').textContent + ' :: ' + s.querySelector(':scope>p').textContent));
  ok(/^Boas-vindas, Maria/.test(tour[0]) && /^Notícias para conversar :: .*relatos do que viram e análises/.test(tour[1]) && !/curtir|Curta/.test(tour.join()), 'guia: "Boas-vindas" e a tela do Feed fala de comentar, relatar e analisar', tour.join(' || '));
  await ev(B, () => closeLayer()); await sleep(500);

  // ===== 2. funções puras
  ok(await ev(B, () => edUrlOk('g1.globo.com') === 'https://g1.globo.com/' && edUrlOk('www12.senado.leg.br/noticias').startsWith('https://www12.senado') && edUrlOk('http://x.com') === '' && edUrlOk('Agência Senado') === '' && edUrlOk('javascript:alert(1)') === ''), 'link aceita domínio sem https:// (e continua recusando http, nomes e javascript:)');
  ok(await ev(B, () => cn102DiaCurto('2024-12') === 'dez/24' && cn102DiaCurto('2026-11-02') === '2/11' && cn102DiaCurto('SP') === 'SP'), 'eixo do indicador: "2024-12" vira "dez/24"; "2026-11-02" segue "2/11"');
  ok(await ev(B, () => { const f = cn102Fonte('g1.globo.com/economia'); return f && /^https:\/\/g1\.globo\.com\/economia/.test(f.u) && !cn102Fonte('Defesa Civil do Rio').u }), 'fonte "g1.globo.com/economia" vira link no post');
  ok(await ev(B, () => /^Opinião de Maria Albuquerque$/.test(fc105Kicker({ k: 'opi' })) && fc105Kicker({ k: 'opi' }, 'Ana Lima') === 'Opinião de Ana Lima'), 'cartão: nome comprido vira primeiro e último nome (sem a palavra cortada)', await ev(B, () => fc105Kicker({ k: 'opi' })));
  ok(await ev(B, () => { const sob = new Set(FC105_FUNDOS.map(f => f[1])); const g = s => /#[0-9a-f]{6}/i.exec(s)[0]; return sob.has(g(pubFundo('a'.charCodeAt(0)))) && sob.has(g(pubFundo('7'.charCodeAt(0)))) && sob.has(g(pubFundo(undefined))) && g(pubFundo(1)) === PUB_FUNDOS[1][0] && g(pubFundo(FC105_F0 + 2)) === PUB_FUNDOS[FC105_F0 + 2][0] }), 'fundos sorteados pelo id ficam sóbrios; fundos escolhidos não mudam');
  ok(await ev(B, () => { const cv = document.createElement('canvas'); cv.width = cv.height = 400; const g = cv.getContext('2d'); let roxo = 0, azul = 0;
    for (const t of ['local', 'men']) { g.clearRect(0, 0, 400, 400); edPintaEl(g, { t, tx: 'Tijuca', uid: S.uid, x: .5, y: .5, s: 1, r: 0 }, 400, 400); const d = g.getImageData(0, 0, 400, 400).data;
      for (let i = 0; i < d.length; i += 4) { const [r, gg, bb] = [d[i], d[i + 1], d[i + 2]]; if (Math.abs(r - 0x83) < 14 && Math.abs(gg - 0x38) < 14 && bb > 200 || r > 180 && gg < 50 && bb > 70 && bb < 120) roxo++; if (Math.abs(r - 0x1d) < 10 && Math.abs(gg - 0x3a) < 10 && Math.abs(bb - 0x63) < 10 || Math.abs(r - 0x6e) < 10 && Math.abs(gg - 0x26) < 10 && Math.abs(bb - 0x33) < 10) azul++ } }
    return roxo === 0 && azul > 50 }), 'Local e Menção "assados" na foto saem nos tons de jornal (sem roxo nem rosa)');

  // Atividade: mesma pessoa duas vezes no mesmo story
  const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB, 8000);
  ok(await ev(A, u => { const r0 = AT.rows, p0 = AT.pubs; try { AT.rows = [{ tipo: 'voto', pub: 'zz1', uid: u, at: Date.now() - 1000, chave: 'k1' }, { tipo: 'voto', pub: 'zz1', uid: u, at: Date.now(), chave: 'k2' }]; AT.pubs = { zz1: { id: 'zz1', tipo: 'story', autor: S.uid, estilo: {}, fotos: [] } };
    const it = atItens().find(x => x.pub === 'zz1'); return it && it.us.length === 1 && /<\/b> respondeu ao seu story/.test(it.txt) } finally { AT.rows = r0; AT.pubs = p0 } }, uidB), 'Atividade: quem votou e respondeu o mesmo story conta uma vez ("respondeu", um avatar)');

  ok(await ev(A, () => { const p0 = AT.pubs; try { AT.pubs = { zz2: { id: 'a1b2', tipo: 'post', autor: S.uid, estilo: { fundo: 0 }, fotos: [], texto: 'Selic parada' } }; const h = atThumb({ pub: 'zz2' }), sob = FC105_FUNDOS.map(f => f[1]); return sob.some(c => h.includes(c)) && !h.includes(PUB_FUNDOS[0][0]) } finally { AT.pubs = p0 } }), 'Atividade: miniatura de post sem foto com o fundo sóbrio (igual ao perfil)');

  // ===== 3. figurinhas na tela
  await ev(A, () => go('feed')); await sleep(500);
  await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#layer [data-edcriar]'), null, 6000); await sleep(400); await clk(A, '[data-edcriar]'); await sleep(400); await A.keyboard.type('Oi'); await ev(A, () => edTextoOk());
  await ev(A, () => { edAdd({ t: 'perg', q: 'Qual notícia?' }); edAdd({ t: 'local', tx: 'Tijuca' }); edAdd({ t: 'cont', q: 'Copom', d: Date.now() + 864e5 }) }); await sleep(400);
  const cores = await ev(A, () => { const c = s => { const e = document.querySelector('#ce-els ' + s); return e ? getComputedStyle(e).color + '|' + getComputedStyle(e).backgroundImage : 'sem ' + s }; return [c('.fg-perg>b'), c('.fg-local'), c('.fg-cont')].join(' ; ') });
  ok(!/255, 95, 109|194, 24, 91|131, 56, 236/.test(cores) && /29, 58, 99/.test(cores), 'Perguntas, Local e Contagem sem rosa e roxo', cores);
  await A.screenshot({ path: SH + 'qa-producao-figurinhas.png' });
  await fecha(A); await sleep(400);

  // ===== 4. Fonte pela foto aceita domínio
  await ev(A, () => criarAbrir('story')); await esperar(A, () => !!document.querySelector('#ce-file'), null, 6000); await sleep(400); await A.setInputFiles('#ce-file', [PAIS]); await esperar(A, () => ED && ED.tela === 'edit' && !!document.querySelector('.fc105-ctx'), null, 6000); await sleep(400);
  await clk(A, '[data-fc105ctx="link"]'); await sleep(500);
  ok(await ev(A, () => document.querySelector('#layer .ce-sel .ce-selp>b')?.textContent === 'Fonte' && /g1\.globo\.com/.test(document.querySelector('#layer .ce-sel #fu')?.placeholder || '')), 'atalho Fonte abre a folha "Fonte" com exemplo de endereço');
  await A.fill('#layer .ce-sel #fu', 'g1.globo.com'); await clk(A, '#layer [data-edfok]'); await sleep(500);
  ok(await ev(A, () => ED.st.els.some(e => e.t === 'link' && e.url === 'https://g1.globo.com/')), 'digitando só "g1.globo.com" o link entra no story');
  await fecha(A); await sleep(400);

  // ===== 5. 360px + texto grande: matéria, voltar para a matéria, botões do story
  const pid = await ev(B, () => FEED.pautas[0].id);
  await ev(B, p => abrirMateria(p), pid); await esperar(B, () => !!document.querySelector('#layer .fc105-mc'), null, 5000); await ev(B, () => document.querySelector('#layer .fc105-mc').scrollIntoView({ block: 'center' })); await sleep(500);
  ok(await ev(B, () => [...document.querySelectorAll('#layer .fc105-mc .btn')].every(x => { const r = x.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && x.scrollWidth <= x.clientWidth + 1 })), 'matéria em 360px com texto grande: "Publicar comentário" e "No story" cabem na tela');
  ok(await ev(B, () => !!document.querySelector('#layer .fc105-mc [data-cn102envp] path[d^="M4 5.5"]')), '"Publicar comentário" com ícone de comentário');
  await B.screenshot({ path: SH + 'qa-producao-materia-360.png' });
  await ev(B, () => document.querySelector('#layer .fc105-mc [data-cn102envs]').click()); await esperar(B, () => ED && ED.modo === 'story' && ED.st.els.some(e => e.t === 'nt'), null, 6000); await sleep(700);
  ok(await ev(B, () => [...document.querySelectorAll('#layer .ce-bot .ce-pub span')].every(s => s.scrollWidth <= s.clientWidth + 1) && [...document.querySelectorAll('#layer .ce-bot .ce-pub')].every(x => x.getBoundingClientRect().right <= innerWidth)), 'story em 360px: "Melhores amigos" e "Seu story" inteiros');
  await B.screenshot({ path: SH + 'qa-producao-story-360.png' });
  await B.goBack(); await sleep(700); await B.goBack(); await sleep(1200);
  ok(await ev(B, p => !ED && !!document.querySelector('#layer .mat') && !!document.querySelector('#layer .fc105-mc [data-cn102envs="' + p + '"]'), pid), 'desistir do story aberto pela matéria volta para a matéria (não para a Capa)');
  await ev(B, () => closeLayer()); await sleep(600);
  // publicar a partir da matéria não reabre a matéria
  await ev(B, p => abrirMateria(p), pid); await esperar(B, () => !!document.querySelector('#layer .fc105-mc'), null, 5000);
  await ev(B, () => document.querySelector('#layer .fc105-mc [data-cn102envp]').click()); await esperar(B, () => ED && ED.po && ED.po.cn && ED.po.cn.k === 'nt', null, 6000); await sleep(500);
  await B.fill('#ce-leg', 'Vai ser apertado.'); const n0 = await ev(B, () => PUB.itens.length); await ev(B, () => document.querySelector('[data-edpubpo]').click());
  await esperar(B, n => !ED && !PQ.atual && PUB.itens.length > n, n0, 15000); await sleep(900);
  ok(await ev(B, () => !document.querySelector('#layer .mat')), 'depois de publicar o comentário a matéria não reabre por cima');
  // análise: placeholder da fonte cabe
  await ev(B, () => criarAbrir('post')); await sleep(600); await clk(B, '[data-cn102ini="ana"]'); await sleep(500);
  ok(await ev(B, () => { const i = document.querySelector('#cn102-fu'); return i.placeholder === 'Link ou nome (recomendado)' }), 'análise: texto do campo de fonte curto (cabe em 360px)');
  await fecha(B); await sleep(300);

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  await b.close(); srv.kill(); const R = U.resumo(); console.log(`\nRESUMO t_qa_producao: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
