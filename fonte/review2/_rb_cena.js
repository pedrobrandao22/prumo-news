// Cenário da revisão B (Feed, Giro e criação) no estado de produção: visual novo (cartão A) + fase 2 + foco + sem reels.
// Pedro (A) e Bia (B), amigos; Bia publica de tudo (notícia, análise, relato, pergunta, fio, fotos, repost, citação, hashtags) e stories.
const U = require('../t_util'); const { sleep, esperar } = U;
const { cenario, clk, ev, ins, FOTO } = require('./_vn_cena');
async function cena(PORTA, o = {}) {
  const extra = [['prumo-fase2', '1'], ['prumo-teste-visual', '1'], ['prumo-teste-foco', '1'], ['prumo-teste-semreels', '1']].concat(o.extra || []);
  const c = await cenario(PORTA, { vn: true, extra, viewport: o.viewport, escuro: o.escuro });
  const { A, B, ids, now } = c;
  const pk = await ev(A, () => { const ps = ordenadas(visiveis()); const comHt = ps.filter(p => typeof htDaPauta === 'function' && htDaPauta(p).length); return { l: ps.map(p => p.id), ht: comHt[0] ? htDaPauta(comHt[0])[0] : '#Copom', htp: comHt[0] && comHt[0].id } });
  const foto = await ev(B, async () => { try { const r = await fetch('/icon-512.png'); return null } catch (e) { return null } });
  const m = Date.now();
  const rows = [
    { tipo: 'post', at: m - 50 * 60e3, texto: 'Opinião: o texto da reforma ainda tem pontos frágeis e precisa de ajustes antes da votação final.', fotos: [], pid: pk.l[3], estilo: { v: 2, cn: { v: 1, k: 'opi' } } },
    { tipo: 'post', at: m - 45 * 60e3, texto: 'O que eu vi no posto\n\nFila grande, mas atendimento rápido. Muita gente sem saber onde votar.', fotos: [], estilo: { v: 2, cn: { v: 1, k: 'rel', tit: 'O que eu vi no posto' } } },
    { tipo: 'post', at: m - 35 * 60e3, texto: 'Vocês acham que passa?', fotos: [], pid: pk.l[4], estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'Passa no Senado?', o: ['Sim', 'Não', 'Talvez'] } } },
    { tipo: 'post', at: m - 25 * 60e3, texto: 'Três pontos sobre o assunto do dia, em sequência, para quem não acompanhou desde o começo da semana.', fotos: [], estilo: { v: 2, fio: ['Segundo: o crédito encarece e o consumo desacelera.', `Terceiro: ${pk.ht} decide amanhã.`] } },
    { tipo: 'post', at: m - 22 * 60e3, texto: `Vale acompanhar ${pk.ht} esta semana, @Pedro Brandão.`, fotos: [], estilo: { v: 2 } },
    { tipo: 'post', at: m - 15 * 60e3, texto: '', fotos: [], estilo: { v: 2, rp: { k: 'pauta', id: pk.l[5] } }, snap: null },
    { tipo: 'post', at: m - 12 * 60e3, texto: 'Isso aqui resume bem o dia.', fotos: [], estilo: { v: 2, rp: { k: 'pauta', id: pk.l[6] } } },
    { tipo: 'post', at: m - 8 * 60e3, texto: 'Um texto bem longo para ver o corte do cartão. '.repeat(12).trim(), fotos: [], estilo: { v: 2 } },
    { tipo: 'story', at: m - 9 * 60e3, expira: m + 20 * 3600e3, texto: 'Texto do giro', fotos: [], estilo: { v: 2, fundo: 3, itens: [{ t: 'tx', tx: 'Olha isso', x: .5, y: .4, s: 1, r: 0 }, { t: 'enq', q: 'Vai passar?', o: ['Sim', 'Não'], x: .5, y: .7, s: 1, r: 0 }] } },
  ];
  const novos = await ins(B, rows);
  // repost com comentário de um post do Pedro
  const [pA] = await ev(A, () => pubVisiveis().filter(x => x.autor === S.uid && x.tipo === 'post').map(x => x.id));
  const [rpPub] = await ins(B, [{ tipo: 'post', at: m - 5 * 60e3, texto: 'Concordo com o Pedro aqui.', fotos: [], estilo: { v: 2, rp: { k: 'pub', id: pA } } }]);
  for (const P of [A, B]) await ev(P, async () => { await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); scrollTo(0, 0) });
  await sleep(700);
  return { ...c, pk, novos, rpPub, pA };
}
module.exports = { cena, clk, ev, ins, sleep, esperar, U, FOTO };
