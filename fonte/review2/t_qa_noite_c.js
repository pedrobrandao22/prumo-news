// QA da noite C (127, 04/11): regressão de tudo depois do dia cheio (100–124), no estado de produção (foco, visual novo com o
// cartão A, fase 2, sem reels, abre na Capa) e com a edição real do repositório servida como o GitHub Pages (feed-leve +
// feed-det, oficiais.json, séries, acervo). Leitor (visitante) e membros (Pedro admin, Bia amiga), 360/390/430, claro/escuro,
// letra maior; sem a internet; iPhone antigo (iOS 15: sem lookbehind, sem color-mix, sem dvh, sem :has()).
// Correções em js/127 + css/42; detalhes em qa/QA-NOITE-C.md. Portas 8764–8765. Capturas em qa/noite-c/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { montarPasta, PROD, VAZA } = require('./_qc_comum');
const PORTA = 8764, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'noite-c'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while ((document.querySelector('#layer2')?.innerHTML || document.querySelector('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
const clk = (p, sel) => ev(p, s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); e.click(); return true }, sel);
const foto = (p, n) => p.screenshot({ path: path.join(QA, n + '.png') });
let srv = null;
(async () => {
  const { DIR, F } = montarPasta('qc127t'); srv = U.servir('qc127t', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => {
    const p = U.erros(await H.pagina(br, { sessao: k ? { user: { id: ids[k], email: k + '@x' } } : undefined, dark: o.dark, viewport: o.vp }), (k || 'V') + (o.n || ''));
    await p.addInitScript(PROD);
    if (o.fonte) await p.addInitScript(f => { try { const x = JSON.parse(localStorage.getItem('radar-prefs') || '{}'); x.fonte = f; localStorage.setItem('radar-prefs', JSON.stringify(x)) } catch (e) { } }, o.fonte);
    if (o.antes) await o.antes(p);
    await p.goto(BASE);
    await esperar(p, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 15000);
    if (k) await esperar(p, () => S.membro && S.amigosOk && PUB.on === true, null, 15000);
    await esperar(p, () => typeof FL119 !== 'undefined' && !FL119.parcial, null, 10000);
    await sleep(600); await fecha(p); return p };

  // ===== 1. iPhone antigo: o que o Safari do iOS 15 não tem =====
  const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n'), css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  ok(!/\(\?<[=!]/.test(js), 'iOS: nenhuma regex com lookbehind');
  const semGuarda = ['structuredClone', 'requestIdleCallback', 'randomUUID'].filter(n => { const re = new RegExp(n + '\\(', 'g'); let m, ruins = 0; while ((m = re.exec(js))) { const antes = js.slice(Math.max(0, m.index - 140), m.index); if (!/try\{|\?|&&/.test(antes)) ruins++ } return ruins > 0 });
  ok(!semGuarda.length, 'iOS: structuredClone, requestIdleCallback e randomUUID só com reserva', semGuarda);
  const novos = ['.at(', 'Object.hasOwn(', '.findLast(', '.findLastIndex(', '.toSorted(', '.toReversed(', 'Object.groupBy(', 'Promise.withResolvers(', 'AbortSignal.timeout(', '.checkVisibility('].filter(x => js.indexOf(x) >= 0);
  ok(!novos.length, 'iOS: sem Array.at, Object.hasOwn, findLast, toSorted, groupBy… (iOS 15.4+)', novos);
  ok(!/(^|[^-])\bawait\b[^;]{0,40};/.test(js.split('\n').filter(l => /^await /.test(l)).join('\n')), 'iOS: sem await no nível de cima');
  ok(/@supports not \(color:color-mix\(in srgb,red 50%,blue\)\)/.test(css) && /@supports not \(height:1dvh\)/.test(css), 'iOS < 16.2: reserva para color-mix e dvh no CSS');
  const ultimoCM = css.lastIndexOf('color-mix('), reserva = css.indexOf('@supports not (color:color-mix');
  ok(reserva > 0, 'a reserva do color-mix está no CSS', { ultimoCM, reserva });

  // ===== 2. Leitor (visitante), 360 px: Capa, matéria, Feed, Busca, hashtags, 5 min, Quiz, indicadores =====
  const V = await abrir(null, { vp: { width: 360, height: 740 } });
  const capa = await ev(V, () => ({ itens: document.querySelectorAll('#v-capa .cpi').length, lp: !!document.getElementById('lp') && !document.getElementById('lp').hidden, ind: document.querySelectorAll('#v-capa [data-indg], #v-capa [data-grper]').length }));
  ok(capa.itens >= 5 && capa.lp, 'Capa com a edição real e o botão de leitura (Neutra)', capa);
  // leitura Direita pela Capa, depois volta a Neutra
  await clk(V, '#lp'); await sleep(250);
  ok(await ev(V, () => document.querySelectorAll('#lpm [data-lente]').length === 3), 'menu "Como ler as notícias" com Neutra, Direita e Esquerda');
  await clk(V, '#lpm [data-lente="direita"]'); await sleep(500);
  ok(await ev(V, () => lente() === 'direita' && /Direita/.test(document.getElementById('lp').textContent)), 'trocar para Direita na Capa');
  const alvo = [...F.pautas].filter(x => x.direita && x.direita.titulo).sort((a, c) => String(c.neutro?.texto || '').length - String(a.neutro?.texto || '').length)[0] || F.pautas[0];
  await ev(V, id => abrirMateria(id), alvo.id); await sleep(900);
  const md = await ev(V, () => ({ h1: (document.querySelector('#layer .mat h1, #layer .mat-tx h1') || {}).textContent || '', cap: document.querySelectorAll('#layer .fs2-cap button, #layer .fs2-cap a').length, cred: (document.querySelector('#layer .mat') || {}).textContent.match(/Arquivo · [^\n]{2,40}|Foto: [^\n]{2,40}/) }));
  ok(md.h1.length > 10, 'matéria abre lida pela Direita', md);
  await foto(V, 'nc-materia-direita-360'); await fecha(V);
  await clk(V, '#lp'); await sleep(250); await clk(V, '#lpm [data-lente="neutro"]'); await sleep(400);
  ok(await ev(V, () => lente() === 'neutro'), 'volta a Neutra');
  // matéria: capítulos, placar oficial, gráficos
  await ev(V, id => abrirMateria(id), alvo.id); await sleep(900);
  const cap = await ev(V, () => [...document.querySelectorAll('#layer .fs2-cap button')].map(b => b.textContent.trim()));
  ok(cap.length >= 2, 'capítulos na matéria', cap);
  if (cap.length >= 2) { await ev(V, () => document.querySelectorAll('#layer .fs2-cap button')[1].click()); await sleep(900);
    ok(await ev(V, () => document.querySelector('#layer .mat').scrollTop > 100), 'tocar no 2º capítulo rola a matéria') }
  ok(V._erros.length === 0, 'sem erros na matéria', V._erros); await fecha(V);
  // prefere uma votação nominal (tem gráfico); simbólica ou sem placar mostra só o texto, por desenho
  const comPlacar = await ev(V, () => { if (typeof po118Da !== 'function') return null; const l = (FEED && FEED.pautas || []).map(p => ({ p, v: po118Da(p) })).filter(x => x.v && x.v.length); const x = l.find(y => y.v[y.v.length - 1].modo === 'nominal') || l[0]; return x ? { pid: x.p.id, nominal: x.v[x.v.length - 1].modo === 'nominal' } : null });
  if (comPlacar) { await ev(V, id => abrirMateria(id), comPlacar.pid); await sleep(900);
    const pl = await ev(V, () => { const m = document.querySelector('#layer .mat'); return { svg: !!m.querySelector('.po118 svg, [class*="po118"] svg'), txt: (m.querySelector('[class*="po118"]') || {}).textContent || '' } });
    ok(comPlacar.nominal ? (pl.svg && /Sim|votos|a \d/.test(pl.txt)) : /simbólica|registrou o resultado/.test(pl.txt), 'matéria com placar oficial desenha o placar', pl.txt.slice(0, 120));
    await foto(V, 'nc-placar-360'); await fecha(V) }
  else ok(true, 'sem placar oficial na edição de hoje (nada a conferir)');
  // Feed: rola tudo, prateleiras, nada vaza
  await ev(V, () => go('feed')); await sleep(600);
  for (let i = 0; i < 12; i++) { await ev(V, () => scrollBy(0, 1400)); await sleep(160) }
  await ev(V, () => { for (let i = 0; i < 20; i++) try { carregarMais(true) } catch (e) { } }); await sleep(500);
  const fd = await ev(V, () => ({ posts: document.querySelectorAll('#posts .post').length, prat: document.querySelectorAll('#posts .fs2-sh').length }));
  ok(fd.posts >= 20 && fd.prat >= 1, 'Feed rola até o fim com prateleiras', fd);
  const vz = await ev(V, VAZA); ok(vz.sw <= vz.W && !vz.out.length, 'Feed sem nada saindo da tela (360)', vz);
  ok(V._erros.length === 0, 'sem erros no Feed', V._erros);
  // Busca e hashtag
  await ev(V, () => { scrollTo(0, 0); go('busca') }); await sleep(400);
  await ev(V, () => { const i = document.querySelector('#v-busca input'); i.value = 'senado'; i.dispatchEvent(new Event('input', { bubbles: true })) }); await sleep(700);
  ok(await ev(V, () => document.querySelectorAll('#v-busca [data-pid], #v-busca button, #v-busca a').length > 3), 'Busca acha "senado"');
  const tag = await ev(V, () => { const a = document.querySelector('#v-busca .ht-a, #v-busca [data-ht], #v-busca [data-hashtag]'); return a ? a.textContent : null });
  await ev(V, () => abrirHashtag('Senado')); await sleep(600);
  ok(await ev(V, () => /#Senado/i.test(document.querySelector('#layer').textContent)), 'página da hashtag abre', tag); await fecha(V);
  // 5 min (com Agenda) e Quiz
  await ev(V, () => abrir5min()); await sleep(800);
  ok(await ev(V, () => !!document.querySelector('#layer .story, #layer2 .story')), 'Em 5 min abre'); await fecha(V);
  await ev(V, () => abrirQuiz()); await sleep(700);
  const qz = await ev(V, () => { const b = document.querySelector('.sheet [data-qr]'); if (b) b.click(); return !!b }); await sleep(500);
  ok(qz && await ev(V, () => !!document.querySelector('.sheet .ok, .sheet .no, .sheet [data-qr].ok, .sheet [data-qr][disabled], .sheet .qz-exp, .sheet [aria-pressed="true"]') || /Próxima|Ver resultado|Acertou|Errou|resposta/i.test(document.querySelector('.sheet').textContent)), 'Quiz abre e aceita resposta'); await fecha(V);
  // indicador (gráfico)
  await ev(V, () => go('capa')); await sleep(400);
  const gr = await ev(V, () => { const b = document.querySelector('#v-capa [data-indg]'); if (!b) return null; b.click(); return b.dataset.indg }); await sleep(900);
  if (gr) { ok(await ev(V, () => !!document.querySelector('#layer svg, .sheet svg')), 'indicador da Capa abre o gráfico', gr); await foto(V, 'nc-indicador-360'); await fecha(V) }
  ok(V._erros.length === 0, 'sem erros (visitante)', V._erros);
  await V.context().close();

  // ===== 3. Membros: posts de cada tipo, Giro, Conversas, Perfil, Conta/admin =====
  const B = await abrir('b');
  const ins = r => ev(B, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], ...r }).select('id'); return q.data && q.data[0] && q.data[0].id }, r);
  const pk = await ev(B, () => ordenadas(visiveis()).map(p => p.id)); const now = Date.now();
  const P = {};
  P.txt = await ins({ texto: 'Alguém mais achou o debate de ontem morno? #Debate', estilo: { v: 2 } });
  P.fio = await ins({ texto: 'Três pontos sobre a reforma.', estilo: { v: 2, fio: ['Segundo: quem paga muda.', 'Terceiro: a transição é longa.'] } });
  P.nt = await ins({ texto: 'Acho que essa medida ajuda quem está começando.', pid: pk[2], estilo: { v: 2, cn: { v: 1, k: 'nt' } } });
  P.ana = await ins({ texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro. #Copom', estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } });
  P.enq = await ins({ texto: 'Vocês acham que passa ainda este ano?', pid: pk[3], estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'A PEC passa no Senado?', o: ['Sim', 'Não'] } } });
  P.st = await ins({ tipo: 'story', expira: now + 20 * 3600e3, texto: 'Texto do giro', estilo: { v: 2, fundo: 3, itens: [{ t: 'enq', q: 'Vai passar?', o: ['Sim', 'Não'], x: .5, y: .7, s: 1, r: 0 }] } });
  await ev(B, u => dmEnviar(u, { texto: 'Oi Pedro, viu a matéria da PEC?' }), ids.a);
  for (const [vp, dark, fonte, n] of [[{ width: 360, height: 740 }, false, 1.4, '360-letra-maior'], [{ width: 390, height: 844 }, true, 1, '390-escuro'], [{ width: 430, height: 932 }, false, 1, '430']]) {
    const A = await abrir('a', { vp, dark, fonte, n });
    await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(800);
    await ev(A, () => { for (let i = 0; i < 20; i++) try { carregarMais(true) } catch (e) { } }); await sleep(600);
    const tem = await ev(A, P => Object.fromEntries(Object.entries(P).filter(([k]) => k !== 'st').map(([k, id]) => [k, !!document.getElementById('p-u:' + id)])), P);
    ok(Object.values(tem).every(Boolean), `${n}: posts da Bia de cada tipo no Feed (texto, fio, notícia comentada, análise, pergunta)`, tem);
    const vz2 = await ev(A, VAZA); ok(vz2.sw <= vz2.W && !vz2.out.length, `${n}: Feed sem nada saindo da tela`, vz2);
    await ev(A, id => { const e = document.getElementById('p-u:' + id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70) }, P.fio); await sleep(400); await foto(A, 'nc-feed-' + n);
    // Giro da Bia pela bandeja
    await ev(A, () => scrollTo(0, 0)); await sleep(300);
    const g = await ev(A, u => { const t = [...document.querySelectorAll('#secs [data-us], #secs [data-uid], #secs .sb')].find(x => /Bia/.test(x.textContent)); if (!t) return false; (t.querySelector('button') || t).click(); return true }, ids.b); await sleep(1000);
    ok(g && await ev(A, () => !!document.querySelector('#layer .story, #layer2 .story')), `${n}: o giro da Bia abre pela bandeja`);
    await foto(A, 'nc-giro-' + n); await fecha(A);
    // Conversas
    await ev(A, () => go('msgs')); await sleep(500);
    await ev(A, u => abrirConversa(u), ids.b); await sleep(700);
    await A.fill('#mform input, #mform textarea', 'Vi sim, já li.'); await ev(A, () => { const f = document.querySelector('#mform'); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })) }); await sleep(900);
    ok(await ev(A, () => /Vi sim, já li\./.test(document.querySelector('#layer').textContent) || /Vi sim, já li\./.test(document.body.textContent)), `${n}: mandar mensagem na conversa`);
    const vz3 = await ev(A, VAZA); ok(vz3.sw <= vz3.W && !vz3.out.length, `${n}: conversa sem nada saindo da tela`, vz3);
    await foto(A, 'nc-conversa-' + n); await fecha(A);
    // Perfil da Bia, o próprio (Coleções/Salvos), Arquivados, Ajustes, Admin (todas as abas)
    await ev(A, u => abrirPerfil(u), ids.b); await sleep(800);
    ok(await ev(A, () => /Bia Souza/.test(document.querySelector('#layer').textContent)), `${n}: perfil da Bia`); await foto(A, 'nc-perfil-bia-' + n); await fecha(A);
    await ev(A, () => go('me')); await sleep(500);
    const abas = await ev(A, () => [...document.querySelectorAll('#v-me [role=tab], #v-me .pf-tabs button, #v-me [data-pfaba]')].map(b => b.textContent.trim()).filter(Boolean));
    for (let i = 0; i < abas.length; i++) { await ev(A, i => { const b = [...document.querySelectorAll('#v-me [role=tab], #v-me .pf-tabs button, #v-me [data-pfaba]')][i]; if (b) b.click() }, i); await sleep(300) }
    ok(A._erros.length === 0, `${n}: abas do perfil (${abas.join(', ')}) sem erros`, A._erros);
    await ev(A, () => abrirArquivo()); await sleep(600); ok(!!(await ev(A, () => document.querySelector('#layer').textContent.length > 10)), `${n}: Arquivados abre`); await fecha(A);
    await ev(A, () => abrirAdmin()); await sleep(800);
    const abasAdm = await ev(A, () => [...document.querySelectorAll('.sheet [data-adaba], .sheet [role=tab], .sheet .adm-tabs button')].length);
    for (let i = 0; i < abasAdm; i++) { await ev(A, i => { const b = [...document.querySelectorAll('.sheet [data-adaba], .sheet [role=tab], .sheet .adm-tabs button')][i]; if (b) b.click() }, i); await sleep(500) }
    ok(abasAdm >= 3 && A._erros.length === 0, `${n}: Administração, ${abasAdm} abas sem erros`, A._erros); await fecha(A);
    ok(A._erros.length === 0, `${n}: sem erros (Pedro)`, A._erros);
    await A.context().close();
  }

  // ===== 3c. iPhone antigo no navegador: Safari sem :has() (classes do 127) e as regras de reserva lidas pelo CSSOM =====
  {
    const A = await abrir('a', { n: 'ios', antes: async p => p.addInitScript(() => { const s = CSS.supports.bind(CSS); CSS.supports = function (a, b) { if (/:has\(/.test(String(a))) return false; return b === undefined ? s(a) : s(a, b) } }) });
    const rg = await ev(A, () => { const out = {}; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules } catch (e) { continue } for (const r of rs) if (r.type === CSSRule.SUPPORTS_RULE) out[r.conditionText] = (out[r.conditionText] || 0) + r.cssRules.length } return out });
    const cm = Object.entries(rg).find(([k]) => /not.*color-mix/.test(k)), dv = Object.entries(rg).find(([k]) => /not.*dvh/.test(k));
    ok(cm && cm[1] >= 20 && dv && dv[1] >= 5, 'iOS: blocos de reserva (sem color-mix, sem dvh) lidos pelo navegador', rg);
    ok(await ev(A, () => QC127_HAS === false), 'iOS sem :has(): o 127 percebe');
    await ev(A, () => criarAbrir('post')); await sleep(500);
    ok(await ev(A, () => document.body.classList.contains('qc127-ce')), 'iOS sem :has(): criação aberta marca o body (aviso no topo)');
    await fecha(A); await sleep(200);
    ok(await ev(A, () => !document.body.classList.contains('qc127-ce')), 'iOS sem :has(): a marca sai ao fechar');
    await ev(A, u => { go('msgs'); abrirConversa(u) }, ids.b); await sleep(700);
    await ev(A, () => { const m = allMsgs().slice(-1)[0]; if (m) dmResponder(m.id) }); await sleep(400);
    const rb = await ev(A, () => ({ bar: !!document.getElementById('respbar'), cls: document.body.classList.contains('qc127-respbar'), pad: parseFloat(getComputedStyle(document.querySelector('.app')).paddingBottom) }));
    ok(rb.bar && rb.cls && rb.pad >= 136, 'iOS sem :has(): barra de resposta da conversa empurra as mensagens (padding do .app)', rb);
    await fecha(A); await A.context().close();
  }

  // ===== 3b. Criação no estado de produção (Pedro): cada tipo de post e um giro =====
  {
    const A = await abrir('a', { n: 'cria' }); const PAIS = path.join(__dirname, 'ig3', 'paisagem.jpg');
    await ev(A, () => go('feed')); await sleep(500);
    const nPosts = () => ev(A, () => PUB.itens.filter(x => x.tipo === 'post' && x.autor === S.uid).length);
    const publica = async (nome, antes) => { const n0 = await nPosts(); if (antes) await antes(); await clk(A, '[data-edpubpo]');
      const foi = await esperar(A, n => !ED && !PQ.atual && PUB.itens.filter(x => x.tipo === 'post' && x.autor === S.uid).length === n + 1, n0, 20000); await sleep(400);
      const x = await ev(A, () => PUB.itens.filter(x => x.tipo === 'post' && x.autor === S.uid).sort((a, b) => b.at - a.at)[0]);
      await ev(A, () => scrollTo(0, 0)); const noFeed = await esperar(A, id => !!document.getElementById('p-u:' + id), x && x.id, 4000);
      if (!foi || !noFeed) { await foto(A, 'nc-falha-' + nome.replace(/\W+/g, '-')); console.log('DBG', foi, noFeed, x && x.id, JSON.stringify(await ev(A, id => ({ el: !!document.querySelector('[id="p-u:' + id + '"]'), any: [...document.querySelectorAll('[id^="p-u:"]')].length, vis: typeof visiveis === 'function' && ordenadas(visiveis()).some(p => p.id === 'u:' + id), ed: !!ED, po: ED && ED.po && { cn: ED.po.cn, pid: ED.po.pid, leg: ED.po.leg }, pq: !!PQ.atual, ae: document.activeElement && document.activeElement.id, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent) }), x && x.id))) }
      ok(foi && noFeed && A._erros.length === 0, `criar (produção): ${nome} publicado e no Feed`, A._erros); return x };
    const abre = async ini => { await ev(A, () => { let i = 0; while (document.querySelector('#layer').innerHTML && i++ < 4) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } criarAbrir('post') }); await sleep(350); if (ini) { await clk(A, `[data-cn102ini="${ini}"]`); await sleep(350) } };
    await abre(); ok(await ev(A, () => document.querySelectorAll('#layer [data-cn102ini]').length >= 4), 'criar (produção): "O que você quer publicar?" com os começos');
    await foto(A, 'nc-criar-inicio');
    await clk(A, '#layer [data-edsotexto]'); await sleep(300); await A.fill('#ce-leg', 'Só um texto, sem foto. #Teste');
    await publica('só texto');
    await abre('ana'); await A.keyboard.type('Juros altos por mais tempo'); await A.fill('#ce-leg', 'Com a Selic alta, o crédito fica caro e o consumo esfria.'); await A.fill('#cn102-fu', 'bcb.gov.br');
    const pa = await publica('análise'); ok(pa && pa.estilo && pa.estilo.cn && pa.estilo.cn.k === 'ana', 'criar (produção): análise com estilo.cn.k = ana');
    await abre('enq'); await A.keyboard.type('A PEC passa no Senado?'); await A.fill('[data-cn102o="0"]', 'Sim'); await A.fill('[data-cn102o="1"]', 'Não');
    const pq = await publica('pergunta'); ok(pq && pq.estilo && pq.estilo.cn && pq.estilo.cn.k === 'enq', 'criar (produção): pergunta com opções');
    await ev(A, () => { let i = 0; while (document.querySelector('#layer').innerHTML && i++ < 4) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } criarAbrir('post') }); await sleep(350);
    const [fc] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '[data-cn102ini="rel"]')]);
    if (fc) { await fc.setFiles([PAIS]); await esperar(A, () => ED && ED.po.fotos.length === 1, null, 6000); await sleep(400);
      await A.keyboard.type('Fila no posto'); await A.fill('#ce-leg', 'A fila dobrava o quarteirão desde as 7h.'); await A.fill('#ce-local', 'Tijuca, Rio');
      const pr = await publica('"Aconteceu perto de mim" com foto'); ok(pr && pr.fotos && pr.fotos.length === 1 && pr.estilo.cn.k === 'rel', 'criar (produção): relato com a foto');
      await ev(A, id => { const e = document.getElementById('p-u:' + id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70) }, pr.id); await sleep(500); await foto(A, 'nc-criar-relato-feed') }
    else ok(false, 'criar (produção): "Aconteceu perto de mim" abre a galeria');
    await abre(); await clk(A, '[data-edsont]'); await sleep(350); await clk(A, '[data-edpnt]'); await sleep(350); await A.fill('#ce-leg', 'Vale ler.');
    const pn = await publica('notícia comentada'); ok(pn && pn.pid, 'criar (produção): notícia comentada leva a notícia');
    // giro (story) livre
    const nSt = await ev(A, () => PUB.itens.filter(x => x.tipo === 'story' && x.autor === S.uid).length);
    await ev(A, () => { let i = 0; while (document.querySelector('#layer').innerHTML && i++ < 4) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } criarAbrir('story') }); await sleep(400);
    await foto(A, 'nc-criar-giro');
    await clk(A, '[data-edcriar]'); await sleep(250); await A.fill('#ce-txa', 'Giro de teste'); await clk(A, '[data-edtxok]'); await sleep(200);
    await clk(A, "[data-edpubst='amigos']");
    ok(await esperar(A, n => PUB.itens.filter(x => x.tipo === 'story' && x.autor === S.uid).length === n + 1, nSt, 20000) && A._erros.length === 0, 'criar (produção): giro publicado', A._erros);
    await A.context().close();
  }

  // ===== 4. Sem internet: volta ao app guardado =====
  {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' }); await ctx.addInitScript(PROD);
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.supabase=null' }));
    const p = U.erros(await ctx.newPage(), 'OFF'); await p.goto(BASE);
    await esperar(p, () => typeof VIEW !== 'undefined' && !!document.querySelector('#v-capa .cpi'), null, 15000);
    await ev(p, async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready }); await p.reload(); await sleep(2500);
    await ctx.setOffline(true); await p.reload().catch(() => { }); await sleep(2500);
    const off = await ev(p, () => ({ capa: document.querySelectorAll('#v-capa .cpi').length })).catch(e => ({ err: String(e) }));
    ok(off.capa >= 5, 'sem internet: o app abre na Capa com a edição guardada', off);
    await ev(p, id => abrirMateria(id), alvo.id).catch(() => { }); await sleep(900);
    const offm = await ev(p, () => ({ txt: (document.querySelector('#layer .mat-p') || {}).textContent || '', aviso: !!document.querySelector('#layer .ta120-det') })).catch(e => ({ err: String(e) }));
    ok(offm.txt.length > 80 || offm.aviso, 'sem internet: a matéria abre com o texto guardado (ou o aviso "Tentar de novo")', { n: offm.txt.length, aviso: offm.aviso });
    await foto(p, 'nc-offline-materia');
    await ctx.close();
  }

  const R = U.resumo(); console.log(`RESUMO t_qa_noite_c: ${R.OKS} ok, ${R.FALHAS} falhas`);
  srv.kill(); fs.rmSync(DIR, { recursive: true, force: true }); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
