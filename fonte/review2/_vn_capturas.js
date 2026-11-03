// Capturas para aprovação do visual novo (112): node review2/_vn_capturas.js [passadas...]  (grava qa/visual/<passada>-<cena>.png)
// Passadas: antes (chave desligada), hoje (chave ligada, cartão de hoje), a, b, c (as três direções do cartão). Padrão: todas.
// Mesmo cenário em todas: 390×844, claro; uma cena por passada também no escuro.
const { cenario, ev, sleep, esperar, ins, FOTO } = require('./_vn_cena');
const fs = require('fs'); const OUT = __dirname + '/../qa/visual/'; fs.mkdirSync(OUT, { recursive: true });
const PORTA = +process.env.VN_PORTA || 13949;
const PASSADAS = process.argv.slice(2).length ? process.argv.slice(2) : ['antes', 'hoje', 'a', 'b', 'c'];
const limpa = P => ev(P, () => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelectorAll('.fd104-dica,.tour').forEach(t => t.remove()) });
async function rola(P, sel, dy = 70) { return ev(P, ([sel, dy]) => { const e = document.querySelector(sel); if (!e) return false; const sc = e.closest('.pfv-sc'); const r = e.getBoundingClientRect(); if (sc) sc.scrollTop += r.top - dy; else scrollTo(0, r.top + scrollY - dy); return true }, [sel, dy]) }
async function foto(P, nome, clip) { await sleep(500); await limpa(P); await P.screenshot({ path: OUT + nome + '.png', clip }); console.log('foto', nome) }
const feed = P => ev(P, async () => { if (document.querySelector('#layer').innerHTML) closeLayer(); await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
const liga = async (A, vis, ct) => { await ev(A, ([v, c]) => { localStorage.setItem('prumo-visual', v); if (c) localStorage.setItem('prumo-cartao', c); else localStorage.removeItem('prumo-cartao') }, [vis, ct]);
  await A.reload(); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500); await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }) };
// marca os cartões das cenas (para achar nas várias passadas)
const marca = A => ev(A, () => { const ps = [...document.querySelectorAll('#posts > .post')];
  const j = ps.find(e => e.classList.contains('fc107-j1')); let n = j && j.previousElementSibling; while (n && n.classList.contains('upost')) n = n.previousElementSibling; if (n) n.classList.add('vn-cap-ntam');
  const nt = ps.find(e => !e.classList.contains('upost') && e !== n && !(e.nextElementSibling && e.nextElementSibling.classList.contains('fc107-junto'))); if (nt) nt.classList.add('vn-cap-nt');
  const f = ps.find(e => e.querySelector('.up-img')); if (f) f.classList.add('vn-cap-foto');
  const t = ps.find(e => e.classList.contains('upost') && !e.classList.contains('fc107-junto') && !e.classList.contains('vn-rp') && /Alguém aqui/.test(e.textContent)); if (t) t.classList.add('vn-cap-tx');
  const r = ps.find(e => e.classList.contains('vn-rp') && !e.classList.contains('vn-rp-so')); if (r) r.classList.add('vn-cap-rp') });
(async () => {
  const c = await cenario(PORTA, { vn: true }); const { A, B } = c;
  const b64 = fs.readFileSync(FOTO).toString('base64');
  await ev(B, async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i); const p = await pubSobe(new Blob([u], { type: 'image/jpeg' }));
    await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', at: Date.now() - 15 * 60e3, texto: 'Fila para votar na escola do bairro às 8h. Andou rápido, uns 20 minutos.', fotos: [p], estilo: { v: 2, local: 'Tijuca, Rio de Janeiro' } }); await pubCarregar() }, b64);
  await ins(B, [{ tipo: 'post', at: Date.now() - 8 * 60e3, texto: 'Alguém aqui já conseguiu simular quanto muda no salário com o fim da escala 6x1? Fiz a conta para a minha prima e não fecha.', fotos: [], estilo: { v: 2 } }]);
  const pPedro = await ev(A, () => pubVisiveis().find(x => x.autor === S.uid && /Fila no posto/.test(x.texto)).id);
  await ins(B, [{ tipo: 'post', at: Date.now() - 5 * 60e3, texto: 'Aqui no meu bairro também: fila desde as 6h, e faltou senha para metade das pessoas.', fotos: [], estilo: { v: 2, rp: { k: 'pub', id: pPedro } } }]);
  await ev(A, async () => { await pubCarregar() });
  for (const ps of PASSADAS) {
    const vis = ps === 'antes' ? 'atual' : 'novo', ct = ['a', 'b', 'c'].includes(ps) ? ps : '';
    await A.emulateMedia({ colorScheme: 'light' }); await liga(A, vis, ct);
    await feed(A); await sleep(700); await marca(A); await ev(A, () => scrollTo(0, 0)); await sleep(900);
    if (ps === 'antes' || ps === 'hoje') {
      await foto(A, ps + '-feed-topo');
      const r = await ev(A, () => { const s = document.querySelector('#secs').getBoundingClientRect(); return { y: Math.max(0, s.top - 4), h: Math.min(320, s.height + 8) } });
      await foto(A, ps + '-topo-giros', { x: 0, y: r.y, width: 390, height: r.h });
    }
    await rola(A, '#posts .vn-cap-nt', 64); await foto(A, ps + '-noticia');
    await rola(A, '#posts .vn-cap-ntam', 64); await ev(A, () => { const e = document.querySelector('#posts .vn-cap-ntam'), j = document.querySelector('#posts .fc107-j1'); if (e && j) { const d = j.getBoundingClientRect().bottom - innerHeight + 140; if (d > 0) scrollBy(0, d) } }); await foto(A, ps + '-noticia-amigos');
    await rola(A, '#posts .vn-cap-tx', 64); await foto(A, ps + '-post-texto');
    await rola(A, '#posts .vn-cap-foto', 64); await foto(A, ps + '-post-foto');
    await rola(A, '#posts .vn-cap-rp', 64); await foto(A, ps + '-repost');
    if (ps === 'antes' || ps === 'hoje') {
      await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(900); await foto(A, ps + '-perfil');
      await ev(A, u => abrirPerfil(u), c.uidB); await sleep(1200); await foto(A, ps + '-perfil-amiga'); await ev(A, () => closeLayer()); await sleep(300);
      await ev(A, () => { PF_ABA = 'posts'; go('feed') });
    }
    // escuro: a notícia com o que os amigos acham
    await A.emulateMedia({ colorScheme: 'dark' }); await sleep(300); await liga(A, vis, ct); await feed(A); await sleep(700); await marca(A);
    await rola(A, '#posts .vn-cap-ntam', 64); await ev(A, () => { const j = document.querySelector('#posts .fc107-j1'); if (j) { const d = j.getBoundingClientRect().bottom - innerHeight + 140; if (d > 0) scrollBy(0, d) } }); await foto(A, ps + '-escuro');
  }
  await A.emulateMedia({ colorScheme: 'light' }); await ev(A, () => { localStorage.setItem('prumo-visual', 'atual'); localStorage.removeItem('prumo-cartao') });
  console.log('erros', JSON.stringify(A._erros), JSON.stringify(B._erros));
  await c.b.close(); c.srv.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1) });
