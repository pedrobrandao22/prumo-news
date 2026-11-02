// Etapa 29: assunto do título (lugar, clube, objeto) escolhe a foto; foto própria quebrada cai para a de arquivo; Agora com o fato
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const cp = require('child_process');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  const ach = re => f.pautas.find(p => re.test(p.neutro.titulo));
  const pTrem = ach(/trens/), pCatar = ach(/^Catar/), pCor = ach(/Corinthians/);
  const pQ = f.pautas.find(p => p.id === (f.capa && f.capa.manchete)) || f.pautas[0]; pQ.foto = { ...(pQ.foto || {}), url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Quebrada.jpg', credito: 'Foto: Fulano/Agência Senado' };
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const A = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/fotos-arquivo.json', 'utf8'));
  const fx = n => [1, 2].map(i => ({ url: `https://upload.wikimedia.org/wikipedia/commons/0/0${i}/${n}_${i}.jpg`, credito: `Foto de arquivo: Autor ${n}/Wikimedia Commons (CC BY-SA 4.0)`, alt: 'Foto de arquivo: ' + n }));
  A.assuntos = { 'trens': { chaves: ['trem', 'trens', 'Trem', 'Trens'], fotos: fx('Trem') }, 'Catar': { chaves: ['Catar', 'Doha'], fotos: fx('Doha') }, 'Corinthians': { chaves: ['Corinthians'], fotos: fx('NeoQuimica'), secoes: ['esportes'] }, 'Internacional': { chaves: ['Internacional'], fotos: fx('BeiraRio'), secoes: ['esportes'] } };
  fs.writeFileSync(S0 + 'fotos-arquivo.json', JSON.stringify(A));
  const pe = f.pautas[0];
  const hh = ms => { const d = new Date(ms - 3 * 3600e3); const p = n => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}` };
  fs.writeFileSync(S0 + 'novidades.json', JSON.stringify({ gerado: new Date().toISOString(), novos: [], em_pautas: { [pe.id]: { n_fontes: 4, manchetes: [{ titulo: 'Manchete antiga sobre o assunto de ontem à noite', hora: hh(Date.now() - 90 * 6e4) }, { titulo: 'Rubio nega que os EUA tenham facilitado a entrada de Flávio no país', hora: hh(Date.now() - 10 * 6e4) }] } } }));
  const jpg = fs.readFileSync(__dirname + '/etapa13/foto.jpg');
  const srv = U.servir('site', 8829); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('https://upload.wikimedia.org/**', r => /Quebrada/.test(r.request().url()) ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ body: jpg, contentType: 'image/jpeg' }));
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8829/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi') && FOTOS_ARQ && FOTOS_ARQ.assuntos, null, 10000); await sleep(800);
  await p.evaluate(() => renderCapa()); await sleep(1500);
  const r = await p.evaluate(ids => ids.map(id => { const q = pautaById(id); const f = q && fotoDe(q); return f ? f.url : null }), [pTrem && pTrem.id, pCatar && pCatar.id, pCor && pCor.id]);
  ok((!pTrem || /Trem_/.test(r[0])) && (!pCatar || /Doha_/.test(r[1])) && (!pCor || /NeoQuimica_/.test(r[2])), 'assunto do título escolhe a foto (trem, Catar, Corinthians) ' + JSON.stringify(r.map(x => x && x.split('/').pop())));
  ok(await p.evaluate(() => { const q = { id: 'zz', secao: 'mundo', subtema: 'Europa', neutro: { titulo: 'Anistia Internacional critica governo' } }; FEED.pautas.push(q); FA_MAP = null; const f = fotoDe(q); FEED.pautas.pop(); FA_MAP = null; return !f || !/BeiraRio/.test(f.url) }), 'clube só vale em Esportes ("Anistia Internacional" não vira Beira-Rio)');
  const py = JSON.parse(cp.execFileSync('python3', ['-c', `import json,sys;sys.path.insert(0,'${require('../t_util').REPO}/tools');import paginas as P;F=json.load(open('${S0}feed.json'));A=json.load(open('${S0}fotos-arquivo.json'));print(json.dumps({k:v['url'] for k,v in P.mapa_fotos(F['pautas'],A).items()}))`]).toString());
  const js = await p.evaluate(() => Object.fromEntries(Object.entries(faMapa()).map(([k, v]) => [k, v.url])));
  ok(JSON.stringify(Object.keys(js).sort().map(k => [k, js[k]])) === JSON.stringify(Object.keys(py).sort().map(k => [k, py[k]])), 'prévia do WhatsApp continua com a mesma foto do app');
  // foto própria quebrada
  await p.evaluate(id => { const el = document.getElementById('cpi-' + id); if (el) el.scrollIntoView() }, pQ.id); await sleep(1500);
  const q = await p.evaluate(id => { const el = document.querySelector('#cpi-' + id); const img = el && el.querySelector('img'); const c = el && el.querySelector('[data-credfull]'); return { img: img && img.getAttribute('src'), ok: img && img.naturalWidth > 0, cred: c && c.textContent, ill: el && !!el.querySelector('.foto') } }, pQ.id);
  ok(q.img && !/Quebrada/.test(q.img) && q.ok && q.ill, 'foto própria que não carrega vira foto de arquivo (não ilustração) ' + JSON.stringify(q));
  // Agora: fato novo, não o nome do tema
  const ag = await p.evaluate(id => (agoraItens().find(a => a.pid === id) || {}).t, pe.id);
  ok(/Rubio nega/.test(ag || ''), 'Agora mostra a manchete mais nova da pauta, não o tema: ' + ag);
  ok(!p._erros.filter(e => !/ERR_|404|net::|Failed to load/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const R2 = U.resumo(); console.log(`\nRESUMO t_etapa29: ${R2.OKS} ok, ${R2.FALHAS} falhas`); await br.close(); srv.kill(); for (const x of ['fotos-arquivo.json', 'novidades.json']) try { fs.unlinkSync(S0 + x) } catch (e) { } process.exit(R2.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
