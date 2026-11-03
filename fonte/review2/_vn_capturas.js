// Capturas antes/depois do visual novo (112) para aprovação: node review2/_vn_capturas.js  (grava qa/visual/antes-*.png e depois-*.png)
// Mesmo cenário nas duas passadas: primeiro com a chave desligada ("antes"), depois ligada ("depois"). 390×844, claro; 2 telas também no escuro.
const { cenario, ev, sleep, esperar, ins, FOTO } = require('./_vn_cena');
const fs = require('fs'); const OUT = __dirname + '/../qa/visual/'; fs.mkdirSync(OUT, { recursive: true });
const PORTA = +process.env.VN_PORTA || 13949;
const limpa = P => ev(P, () => { document.querySelectorAll('.toast').forEach(t => t.remove()); document.querySelectorAll('.fd104-dica,.tour').forEach(t => t.remove()) });
async function rola(P, sel, dy = 70) { return ev(P, ([sel, dy]) => { const e = document.querySelector(sel); if (!e) return false; const sc = e.closest('.pfv-sc'); const r = e.getBoundingClientRect(); const ch = document.querySelector('#vn-chips'); const extra = ch && VIEW === 'feed' && dy < 100 ? ch.offsetHeight : 0; if (sc) sc.scrollTop += r.top - dy; else scrollTo(0, r.top + scrollY - dy - extra); return true }, [sel, dy]) }
async function foto(P, nome, clip) { await sleep(450); await limpa(P); await P.screenshot({ path: OUT + nome + '.png', clip }); console.log('foto', nome) }
const feed = P => ev(P, async () => { if (document.querySelector('#layer').innerHTML) closeLayer(); await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 6; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
(async () => {
  const c = await cenario(PORTA, { vn: true }); const { A, B } = c;
  // marca o post com foto para achar nas duas passadas
  // dados para as telas: foto da Bia (com legenda), citação da Bia do post do Pedro, repost simples
  const b64 = fs.readFileSync(FOTO).toString('base64');
  await ev(B, async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)u[i] = bin.charCodeAt(i); const p = await pubSobe(new Blob([u], { type: 'image/jpeg' }));
    await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', at: Date.now() - 15 * 60e3, texto: 'Fila para votar na escola do bairro às 8h. Andou rápido, uns 20 minutos.', fotos: [p], estilo: { v: 2, local: 'Tijuca, Rio de Janeiro' } }); await pubCarregar() }, b64);
  const pPedro = await ev(A, () => pubVisiveis().find(x => x.autor === S.uid && /Fila no posto/.test(x.texto)).id);
  await ins(B, [{ tipo: 'post', at: Date.now() - 5 * 60e3, texto: 'Aqui no meu bairro também: fila desde as 6h, e faltou senha para metade das pessoas.', fotos: [], estilo: { v: 2, rp: { k: 'pub', id: pPedro } } }]);
  await ev(A, async () => { await pubCarregar() });
  const marcaFoto = () => ev(A, () => { const e = [...document.querySelectorAll('#posts .upost')].find(e => e.querySelector('.up-img')); if (e) e.classList.add('vn-cap-foto') });
  // ANTES
  await ev(A, () => localStorage.setItem('prumo-visual', 'atual')); await A.reload(); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500);
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });
  await passada(c, 'antes', marcaFoto);
  // DEPOIS
  await ev(A, () => localStorage.setItem('prumo-visual', 'novo')); await A.reload(); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500);
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });
  await passada(c, 'depois', marcaFoto);
  // ESCURO (2 telas)
  await A.emulateMedia({ colorScheme: 'dark' }); await sleep(300);
  for (const [pre, vis] of [['antes', 'atual'], ['depois', 'novo']]) {
    await ev(A, v => localStorage.setItem('prumo-visual', v), vis); await A.reload(); await esperar(A, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1500);
    await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer() });
    await feed(A); await sleep(900); await foto(A, pre + '-escuro-feed');
    await marcaFoto(); await rola(A, '#posts .upost.vn-rp:not(.vn-rp-so)', 64); await foto(A, pre + '-escuro-repost');
  }
  await ev(A, () => localStorage.setItem('prumo-visual', 'atual'));
  console.log('erros', JSON.stringify(A._erros), JSON.stringify(B._erros));
  await c.b.close(); c.srv.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1) });
async function passada(c, pre, marcaFoto) {
  const { A } = c;
  await feed(A); await sleep(500); await marcaFoto(); await ev(A, () => scrollTo(0, 0)); await sleep(900);
  await foto(A, pre + '-feed-topo');
  const r = await ev(A, () => { const s = document.querySelector('#secs').getBoundingClientRect(), ch = document.querySelector('#vn-chips'), e = (ch && ch.getBoundingClientRect()) || s; return { y: Math.max(0, s.top - 4), h: Math.min(320, e.bottom - s.top + 10) } });
  await foto(A, pre + '-topo-giros', { x: 0, y: r.y, width: 390, height: r.h });
  await rola(A, '#posts > .post:not(.upost)', 64); await foto(A, pre + '-noticia');
  await rola(A, '#posts .upost.vn-cap-foto', 64); await foto(A, pre + '-post-amiga');
  await rola(A, '#posts .upost.vn-rp:not(.vn-rp-so)', 64); await foto(A, pre + '-repost');
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe(); scrollTo(0, 0) }); await sleep(900); await foto(A, pre + '-perfil');
  await ev(A, u => abrirPerfil(u), c.uidB); await sleep(1200); await foto(A, pre + '-perfil-amiga'); await ev(A, () => closeLayer()); await sleep(300);
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(500); await rola(A, '[data-vntroca]', 260); await foto(A, pre + '-conta');
  await ev(A, () => { PF_ABA = 'posts'; renderMe(); go('feed') });
}
