// Melhoria contínua 06/11/2026 (131): notícia com infográfico ("dinheiro") e foto; se a foto não carrega, o cartão do Feed
// vira o cartão de infográfico normal (ilustração inteira, 5:3) em vez da ilustração recortada em 4:5 que cortava os números
// da direita; o crédito da foto que não apareceu fica escondido. Foto que carrega e ilustração comum sem foto ficam como antes.
// Visitante (site sem configuração), flags de produção. Portas 8708. Capturas (390×844) em qa/melhoria-20261106/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8708, S0 = path.join(__dirname, '..', 'site-semconfig') + '/';
const QA = path.join(__dirname, '..', 'qa', 'melhoria-20261106'); fs.mkdirSync(QA, { recursive: true });
const spISO = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + '-03:00';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const FOTO_OK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Teste_ok.jpg/960px-Teste_ok.jpg';
const FOTO_RUIM = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Teste_ruim.jpg/960px-Teste_ruim.jpg';
let srv = null;
(async () => {
  const real = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const base = real.pautas.find(p => p.imagem && p.imagem.modelo === 'dinheiro') || real.pautas[0];
  const din = { modelo: 'dinheiro', etiqueta: 'Infográfico', alt: 'Cédulas com a Selic', dados: { valor: '13,75%', legenda: 'Selic em vigor desde 16/9; decisão do Copom em 4/11', itens: [['Chance de manter', '80%'], ['Chance de corte', '20%'], ['Decisão', '4/11']] } };
  const mk = (id, min, imagem, foto) => { const p = JSON.parse(JSON.stringify(base)); p.id = id; p.hora = spISO(Date.now() - min * 60e3); p.prioridade = 99; p.imagem = imagem; if (foto) p.foto = { url: foto, credito: 'Foto: Teste/Wikimedia Commons (CC0)', alt: 'foto' }; else delete p.foto; return p };
  const f = JSON.parse(JSON.stringify(real));
  const novas = [mk('mc1106-ruim', 2, din, FOTO_RUIM), mk('mc1106-ok', 3, din, FOTO_OK), mk('mc1106-gen', 4, { modelo: 'generica', alt: 'x', dados: { rotulo: 'TESTE' } }, FOTO_RUIM)];
  f.pautas = novas.concat(f.pautas.filter(p => !/^mc1106/.test(p.id))); f.atualizado_em = spISO(Date.now() - 5 * 60e3);
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  for (const x of ['fotos-arquivo.json', 'indicadores.json', 'novidades.json', 'feed-leve.json']) try { fs.unlinkSync(S0 + x) } catch (e) { }

  srv = U.servir('site-semconfig', PORTA); await sleep(800); const br = await U.navegador();
  const abre = async (o = {}) => { const ctx = await br.newContext({ viewport: { width: o.w || 390, height: 844 }, hasTouch: true, colorScheme: o.escuro ? 'dark' : 'light' });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => /Teste_ok/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : r.abort());
    await ctx.addInitScript(() => { try { for (const k of ['foco', 'visual', 'semreels', 'capa', 'tour']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    const p = U.erros(await ctx.newPage(), o.nome || 'a'); await p.goto(`http://localhost:${PORTA}/index.html`);
    await esperar(p, () => typeof FEED !== 'undefined' && FEED && FEED.pautas && FEED.pautas.some(x => x.id === 'mc1106-ruim'), null, 15000);
    if (typeof o.antes === 'function') await o.antes(p);
    await p.evaluate(() => { try { if (typeof go === 'function') go('feed') } catch (e) { } });
    await esperar(p, () => !!document.querySelector('#p-mc1106-gen .cover'), null, 10000);
    await p.evaluate(() => document.querySelectorAll('#p-mc1106-ruim,#p-mc1106-ok,#p-mc1106-gen').forEach(a => a.querySelectorAll('img').forEach(i => { i.loading = 'eager' })));
    await esperar(p, () => { const r = document.querySelector('#p-mc1106-ruim .cover'), o = document.querySelector('#p-mc1106-ok .cover img'); return r && !r.querySelector('img') && o && o.complete }, null, 10000);
    await sleep(600); return { ctx, p } };
  const estado = (p, id) => p.evaluate(id => { const c = document.querySelector(`#p-${id} .cover`); if (!c) return null; const cr = c.getBoundingClientRect(), sv = c.querySelector(':scope > svg');
    const fora = sv ? [...sv.querySelectorAll('text')].filter(t => { const b = t.getBoundingClientRect(); return b.width && (b.left < cr.left - 1 || b.right > cr.right + 1 || b.top < cr.top - 1 || b.bottom > cr.bottom + 1) }).map(t => t.textContent) : null;
    const h2 = c.querySelector('.cv h2'), hb = h2 && h2.getBoundingClientRect(), sb = sv && sv.getBoundingClientRect();
    return { cls: c.className, vb: sv && sv.getAttribute('viewBox'), img: !!c.querySelector(':scope > img'), cred: !!c.querySelector('.fcv-c') && getComputedStyle(c.querySelector('.fcv-c')).display !== 'none', fora, sobrepoe: !!(hb && sb && hb.height > 0 && getComputedStyle(h2).visibility !== 'hidden' && hb.top < sb.bottom - 2 && hb.bottom > sb.top),
      lat: document.documentElement.scrollWidth <= innerWidth, h2: !!(h2 && h2.textContent.length > 0), h2vis: !!(hb && hb.height > 0) } }, id);

  for (const escuro of [false, true]) {
    const { ctx, p } = await abre({ escuro, nome: escuro ? 'E' : 'C' }); const n = escuro ? 'escuro' : 'claro';
    const r = await estado(p, 'mc1106-ruim'), o = await estado(p, 'mc1106-ok'), g = await estado(p, 'mc1106-gen');
    ok(r && /\binfo\b/.test(r.cls) && !/\bfcv\b/.test(r.cls) && r.vb === '0 0 400 240' && !r.img, `${n}: foto que não carrega → cartão de infográfico inteiro (5:3)`, r);
    ok(r && r.fora && r.fora.length === 0 && !r.sobrepoe && r.h2, `${n}: os números do infográfico ficam dentro do cartão, título abaixo sem sobrepor`, r);
    ok(r && !r.cred, `${n}: crédito da foto que não apareceu não aparece`, r);
    ok(o && /\bfcv\b/.test(o.cls) && o.img && o.cred && !/\binfo\b/.test(o.cls), `${n}: foto que carrega continua como antes (foto, crédito)`, o);
    ok(g && !/\binfo\b/.test(g.cls) && !/\bfcv\b/.test(g.cls) && g.vb === '0 0 400 320', `${n}: ilustração comum com foto que falha continua como antes`, g);
    ok(r && r.lat, `${n}: sem rolagem lateral`);
    await p.evaluate(() => document.querySelector('#p-mc1106-ruim').scrollIntoView({ block: 'start' })); await sleep(400);
    await p.screenshot({ path: path.join(QA, `01-feed-${n}.png`) });
    ok(p._erros.length === 0, `${n}: sem erro de JavaScript`, p._erros);
    await ctx.close();
  }
  /* unidade: a função não mexe em cartão que não é de infográfico nem em cartão que ainda tem foto */
  const { ctx, p } = await abre({ nome: 'U' });
  const u = await p.evaluate(() => { const d = document.createElement('div'); d.innerHTML = '<article data-pid="mc1106-ok"><div class="cover paper fcv"><svg></svg><img></div></article>'; document.body.appendChild(d);
    const c = d.querySelector('.cover'); const a = mc1106Conserta(c); c.classList.remove('fcv'); const b = mc1106Conserta(c); c.querySelector('img').remove(); const e = mc1106Conserta(c); const e2 = mc1106Conserta(c); d.remove();
    return [a, b, e, e2, mc1106Conserta(null), mc1106Info({ imagem: { modelo: 'generica' } }), mc1106Info({ imagem: { etiqueta: 'Infográfico' } })] });
  ok(JSON.stringify(u) === JSON.stringify([false, false, true, false, false, false, true]), 'unidade: só conserta cartão de infográfico sem foto, uma vez', u);
  await ctx.close();
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro: ' + e.message); try { srv && srv.kill() } catch (x) { } process.exit(1) });
