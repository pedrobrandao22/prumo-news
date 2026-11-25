/* Vigia do Prumo (25/11): a parte MECÂNICA do testador, sem IA, rodando de graça no GitHub (workflow "Vigia do app",
   a cada 3 h). Abre o site real em três celulares simulados e confere o que não precisa de olho humano. Grava
   vigia.json na raiz do repositório; o Testador (tarefa do Claude, 1x por dia) lê esse arquivo e transforma cada
   problema novo em achado, sem gastar tempo procurando o que o robô já achou.
   Uso: node fonte/testador/vigia.js [saida.json]   (PRUMO_URL muda o endereço; padrão https://prumonews.com.br/) */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.PRUMO_URL || 'https://prumonews.com.br/';
const SAIDA = process.argv[2] || path.join(__dirname, '..', '..', 'vigia.json');
const DISP = [
  { nome: 'iPhone 13 claro', dev: 'iPhone 13' },
  { nome: 'iPhone SE escuro, letra grande', dev: 'iPhone SE', escuro: true, letra: 1.4 },
  { nome: 'Pixel 7 deitado', dev: 'Pixel 7', deitado: true },
];
const BUSCAS = ['dolar', 'esportes', 'politica', 'economia', 'lula'];  // assuntos que toda edição tem
const probs = [], checks = [];
const prob = (id, titulo, detalhe, tela, disp) => { if (!probs.some(p => p.id === id && p.disp === disp)) probs.push({ id, titulo, detalhe: String(detalhe).slice(0, 600), tela, disp }) };
const check = (id, ok, detalhe) => checks.push({ id, ok: !!ok, detalhe: detalhe ? String(detalhe).slice(0, 300) : '' });

async function abrir(b, d) {
  const base = devices[d.dev];
  const vp = d.deitado ? { width: base.viewport.height, height: base.viewport.width } : base.viewport;
  const ctx = await b.newContext({ ...base, viewport: vp, colorScheme: d.escuro ? 'dark' : 'light' });
  const p = await ctx.newPage(); p._erros = [];
  await p.addInitScript(o => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });
    try { localStorage.setItem('prumo-tour-visto', '1'); if (o.letra) localStorage.setItem('radar-prefs', JSON.stringify({ fonte: o.letra })) } catch (e) {} }, { letra: d.letra || 0 });
  p.on('pageerror', e => p._erros.push('erro JS: ' + e.message.slice(0, 200)));
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && u.startsWith(URL)) p._erros.push('HTTP ' + r.status() + ' ' + u.slice(0, 140)) });
  const t0 = Date.now(); await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForFunction(() => typeof FEED !== 'undefined' && FEED && FEED.pautas && FEED.pautas.length, null, { timeout: 45000 });
  const ms = Date.now() - t0; await p.waitForTimeout(3000);
  return { ctx, p, ms };
}
/* o que dá para medir em qualquer tela: rolagem para o lado e texto cortado em títulos e botões */
async function medir(p, tela, disp) {
  const r = await p.evaluate(() => {
    const lado = document.documentElement.scrollWidth > innerWidth + 2;
    const cortes = [];
    /* só a tela que está na frente (a folha ou a matéria por cima, senão a aba atual) */
    const L2 = document.getElementById('layer2'), L1 = document.getElementById('layer');
    const raiz = (L2 && L2.innerHTML.trim()) ? L2 : (L1 && L1.innerHTML.trim()) ? L1 : document.getElementById('v-' + (typeof VIEW !== 'undefined' ? VIEW : 'capa')) || document.body;
    /* carrosséis e faixas que rolam de lado têm itens fora da tela de propósito */
    const rolaDeLado = e => { for (let a = e.parentElement; a && a !== raiz.parentElement; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || (o === 'hidden' && a.scrollWidth > a.clientWidth + 3)) return true } return false };
    raiz.querySelectorAll('h1,h2,h3,button,.chip,[role=tab],.ph-sub,.cp-k').forEach(e => {
      const s = getComputedStyle(e); if (!e.offsetParent || s.visibility === 'hidden' || rolaDeLado(e)) return;
      const r = e.getBoundingClientRect(); if (r.width < 8 || r.right < 0 || r.left > innerWidth) return;
      if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && s.textOverflow !== 'ellipsis' && e.scrollWidth > e.clientWidth + 3 && (e.textContent || '').trim().length > 3) cortes.push((e.textContent || '').trim().slice(0, 50));
      if (r.right > innerWidth + 2 && r.left >= 0 && (e.textContent || '').trim()) cortes.push('fora da tela: ' + (e.textContent || '').trim().slice(0, 50));
    });
    return { lado, cortes: [...new Set(cortes)].slice(0, 6) };
  });
  if (r.lado) prob(`rolagem-lateral-${tela}`, `${tela}: a página rola para o lado`, 'documento mais largo que a tela', tela, disp);
  if (r.cortes.length) prob(`texto-cortado-${tela}`, `${tela}: texto cortado ou fora da tela`, r.cortes.join(' | '), tela, disp);
  const er = p._erros.splice(0); if (er.length) prob(`erro-${tela}`, `${tela}: erro no app`, [...new Set(er)].slice(0, 4).join(' | '), tela, disp);
}

(async () => {
  const b = await chromium.launch();
  let versao = '';
  for (const d of DISP) {
    let A;
    try { A = await abrir(b, d) } catch (e) { prob('nao-abre', 'O site não abriu', e.message, 'Capa', d.nome); continue }
    const { p, ms } = A;
    if (!versao) try { versao = await p.evaluate(async () => (await (await fetch('versao.json?t=' + Date.now())).json()).v) } catch (e) {}
    check(`abre-${d.dev}`, ms < 8000, `${ms} ms até a edição`);
    if (ms > 8000) prob('abertura-lenta', 'Abertura lenta', `${ms} ms até a edição chegar`, 'Capa', d.nome);
    await medir(p, 'Capa', d.nome);
    await p.evaluate(() => scrollTo(0, 2500)); await p.waitForTimeout(800); await medir(p, 'Capa rolada', d.nome); await p.evaluate(() => scrollTo(0, 0));
    // matéria da manchete
    try { await p.evaluate(() => { const id = (FEED.capa && FEED.capa.manchete) || FEED.pautas[0].id; abrirMateria(id) }); await p.waitForTimeout(1500); await medir(p, 'Matéria', d.nome);
      await p.evaluate(() => { const m = document.querySelector('#layer .mat'); if (m) m.scrollTop = m.scrollHeight }); await p.waitForTimeout(800); await medir(p, 'Matéria (fim)', d.nome);
      await p.evaluate(() => { try { closeLayer() } catch (e) {} }) } catch (e) { prob('materia-nao-abre', 'A matéria da manchete não abre', e.message, 'Matéria', d.nome) }
    // Feed
    try { await p.evaluate(() => go('feed')); await p.waitForTimeout(1500); await medir(p, 'Feed', d.nome);
      await p.evaluate(() => scrollTo(0, 4000)); await p.waitForTimeout(1200); await medir(p, 'Feed rolado', d.nome); await p.evaluate(() => scrollTo(0, 0)) } catch (e) {}
    // Busca (só no primeiro aparelho: o resultado não depende da tela)
    if (d === DISP[0]) for (const q of BUSCAS) {
      try { const n = await p.evaluate(q => { const R = bu154Coleta(q); return R ? R.n : -1 }, q); check(`busca-${q}`, n > 0, `${n} resultados`);
        if (n === 0) prob(`busca-vazia-${q.replace(/\W+/g, '-')}`, `Busca "${q}" não acha nada`, 'nenhum resultado na edição de agora', 'Buscar', d.nome) } catch (e) {}
    }
    if (d === DISP[0]) {
      // conteúdo: notícia com a hora vencida (o app já avisa; o robô registra para a rodada), foto contra a regra única,
      // foto repetida, descrição em inglês, Acabou de sair com o mesmo fato duas vezes
      const c = await p.evaluate(() => {
        const out = { vencidas: [], novid: [], regra: [], repet: [], ingles: [], dup: [] }, vistas = {};
        (FEED.pautas || []).forEach(p => {
          const tit = (p.neutro || {}).titulo || '';
          if (p._av212 && p._av212.tipo === 'novid') out.novid.push(`${tit.slice(0, 70)} — ${p._av212.nota.slice(0, 90)}`);
          else if (p._av212) out.vencidas.push(`${tit.slice(0, 70)} — ${p._av212.nota.slice(0, 80)}`);
          let f = null; try { f = fotoDe(p) } catch (e) {}
          if (f && f.url) {
            try { const txt = ft213N(tit + ' ' + (p.subtitulo || '')); if (!ft213Ok(f, txt)) out.regra.push(`${tit.slice(0, 60)} → ${ft213Nome(f).slice(0, 60)}`) } catch (e) {}
            const k = String(f.url).split('?')[0]; (vistas[k] = vistas[k] || []).push(tit.slice(0, 50));
            if (f.alt && /^foto de arquivo: /i.test(f.alt) && typeof FT213_EN !== 'undefined' && FT213_EN.test(f.alt) && !/\b(de|da|do|em|na|no)\b/i.test(f.alt.slice(17))) out.ingles.push(`${tit.slice(0, 50)} → ${f.alt.slice(0, 60)}`);
          }
        });
        Object.values(vistas).forEach(l => { if (l.length > 1) out.repet.push(l.join(' / ')) });
        try { const it = (typeof ac208Itens === 'function' ? ac208Itens() : []).map(x => x.t); for (let i = 0; i < it.length; i++) for (let j = i + 1; j < it.length; j++) if (av212Parecido(av212Tk(it[i]), av212Tk(it[j]))) out.dup.push(`${it[i].slice(0, 50)} / ${it[j].slice(0, 50)}`) } catch (e) {}
        return out });
      check('conteudo-hora-vencida', !c.vencidas.length, c.vencidas.join(' | '));
      if (c.vencidas.length) prob('noticia-com-hora-vencida', `${c.vencidas.length} notícia(s) com a hora do evento vencida sem atualização`, c.vencidas.join(' | '), 'Capa/Feed', d.nome);
      if (c.novid.length) prob('noticia-com-fato-novo-nao-escrito', `${c.novid.length} notícia(s) com fato novo de 3+ veículos ainda não escrito (o app mostra 'Agora: …')`, c.novid.join(' | '), 'Capa/Feed', d.nome);
      if (c.regra.length) prob('foto-contra-a-regra', 'Foto contra a regra única de fotos', c.regra.join(' | '), 'Capa/Feed', d.nome);
      if (c.repet.length) prob('foto-repetida', 'A mesma foto em mais de uma notícia', c.repet.join(' | '), 'Capa/Feed', d.nome);
      if (c.ingles.length) prob('descricao-em-ingles', 'Descrição de foto em inglês', c.ingles.join(' | '), 'Capa/Feed', d.nome);
      if (c.dup.length) prob('acabou-de-sair-repetido', 'Acabou de sair com o mesmo fato duas vezes', c.dup.join(' | '), 'Feed', d.nome);
      // prévias do link (m/): a página da manchete responde e tem imagem
      try { const r = await p.evaluate(async () => { const id = (FEED.capa && FEED.capa.manchete) || FEED.pautas[0].id; const ind = await (await fetch('m/indice.json?t=' + Date.now())).json(); const sl = ind[id] || id;
          const h = await (await fetch('m/' + sl + '.html')).text(); return { ok: /og:image/.test(h) && /og:title/.test(h), sl } });
        check('previa-do-link', r.ok, r.sl); if (!r.ok) prob('previa-do-link-sem-imagem', 'Prévia do link da manchete sem título ou imagem', r.sl, 'Link (m/)', d.nome) } catch (e) { prob('previa-do-link-erro', 'Prévia do link da manchete não abre', e.message, 'Link (m/)', d.nome) }
    }
    // Perfil e Conversas sem conta
    for (const v of ['me', 'msgs', 'busca']) { try { await p.evaluate(v => go(v), v); await p.waitForTimeout(900); await medir(p, { me: 'Perfil', msgs: 'Conversas', busca: 'Buscar' }[v], d.nome) } catch (e) {} }
    await A.ctx.close();
  }
  await b.close();
  const out = { gerado: new Date().toISOString(), versao, url: URL, problemas: probs, checagens: checks };
  fs.writeFileSync(SAIDA, JSON.stringify(out, null, 1));
  console.log(`vigia: versão ${versao}, ${probs.length} problema(s), ${checks.filter(c => !c.ok).length} checagem(ns) vermelha(s) de ${checks.length}`);
})().catch(e => { console.error(e); process.exit(1) });
