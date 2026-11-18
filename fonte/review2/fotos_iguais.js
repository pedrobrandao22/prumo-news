// Fotos iguais (Fase 3): fotografa as telas de uma área num estado fixo e compara duas pastas pixel a pixel.
//   node review2/fotos_iguais.js tirar <pasta> <area> [porta]   → grava <pasta>/<area>-<tela>-<aparelho>-<tema>.png
//   node review2/fotos_iguais.js comparar <pastaA> <pastaB>      → N iguais / M diferentes; diferenças em <pastaB>/_dif/
// Estado fixo: site montado em fonte/site-fotos (build.py com a chave de teste), feed fixo review2/feed-fotos.json
// (o feed de app/feed.json com as datas trazidas para 17/11/2026), relógio parado em 17/11/2026 12h42 de Brasília
// (anda só o que a página leva para abrir), indicadores fixos, internet de fora cortada (fotos externas caem no
// desenho de reserva, sem Supabase), sem animações nem transições, fontes e imagens esperadas.
// Aparelhos: iPhone 13 (390×844) e iPhone SE (375×667), claro e escuro. Áreas: objeto AREAS (acrescente telas lá).
// Sem dependência nova: o PNG é lido e escrito com o zlib do próprio Node.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const AQUI = __dirname, FONTE = path.resolve(AQUI, '..');

// ---------- PNG (só o que o Chromium grava: 8 bits, RGB ou RGBA, sem entrelaçamento) ----------
function lerPNG(arq) {
  const b = fs.readFileSync(arq); let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < b.length) { const n = b.readUInt32BE(o), tp = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + n);
    if (tp === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12]) throw new Error('PNG não suportado: ' + arq) }
    else if (tp === 'IDAT') idat.push(d); else if (tp === 'IEND') break; o += 12 + n }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : ct === 4 ? 2 : 0; if (!bpp) throw new Error('tipo de cor não suportado: ' + arq);
  const raw = zlib.inflateSync(Buffer.concat(idat)), L = w * bpp, px = Buffer.alloc(L * h);
  for (let y = 0; y < h; y++) { const f = raw[y * (L + 1)], lin = raw.subarray(y * (L + 1) + 1, (y + 1) * (L + 1)), at = px.subarray(y * L, (y + 1) * L), ant = y ? px.subarray((y - 1) * L, y * L) : null;
    for (let x = 0; x < L; x++) { const a = x >= bpp ? at[x - bpp] : 0, c = ant ? ant[x] : 0, cc = ant && x >= bpp ? ant[x - bpp] : 0; let v = lin[x];
      if (f === 1) v += a; else if (f === 2) v += c; else if (f === 3) v += (a + c) >> 1;
      else if (f === 4) { const p = a + c - cc, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - cc); v += pa <= pb && pa <= pc ? a : pb <= pc ? c : cc }
      at[x] = v & 255 } }
  const rgba = Buffer.alloc(w * h * 4);  // tudo em RGBA
  for (let i = 0; i < w * h; i++) { if (bpp === 4) px.copy(rgba, i * 4, i * 4, i * 4 + 4); else if (bpp === 3) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; rgba[i * 4 + 3] = 255 }
    else { const g = px[i * bpp]; rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = g; rgba[i * 4 + 3] = bpp === 2 ? px[i * 2 + 1] : 255 } }
  return { w, h, rgba };
}
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c } return t })();
function crc32(buf) { let c = -1; for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
function chunk(tp, d) { const n = Buffer.alloc(4); n.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(tp, 'ascii'), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([n, td, c]) }
function gravarPNG(arq, w, h, rgba) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  fs.writeFileSync(arq, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// ---------- comparar ----------
function comparar(A, B) {
  const nomes = [...new Set([...fs.readdirSync(A), ...fs.readdirSync(B)])].filter(n => n.endsWith('.png')).sort();
  const DIF = path.join(B, '_dif'); fs.rmSync(DIF, { recursive: true, force: true });
  let iguais = 0; const dif = [];
  for (const n of nomes) {
    const a = path.join(A, n), b = path.join(B, n);
    if (!fs.existsSync(a) || !fs.existsSync(b)) { dif.push(n + ': só em ' + (fs.existsSync(a) ? A : B)); continue }
    const pa = lerPNG(a), pb = lerPNG(b);
    if (pa.w !== pb.w || pa.h !== pb.h) { dif.push(`${n}: tamanho ${pa.w}×${pa.h} ≠ ${pb.w}×${pb.h}`); continue }
    if (pa.rgba.equals(pb.rgba)) { iguais++; continue }
    // imagem de diferença: a foto B apagada em cinza, os pixels diferentes em vermelho
    const out = Buffer.alloc(pa.rgba.length); let k = 0, y0 = 1e9, y1 = -1;
    for (let i = 0; i < pa.w * pa.h; i++) { const j = i * 4, d = pa.rgba[j] !== pb.rgba[j] || pa.rgba[j + 1] !== pb.rgba[j + 1] || pa.rgba[j + 2] !== pb.rgba[j + 2] || pa.rgba[j + 3] !== pb.rgba[j + 3];
      if (d) { k++; out[j] = 255; out[j + 1] = 0; out[j + 2] = 0; const y = Math.floor(i / pa.w); if (y < y0) y0 = y; if (y > y1) y1 = y }
      else { const g = (pb.rgba[j] * .3 + pb.rgba[j + 1] * .59 + pb.rgba[j + 2] * .11) * .35 + 160; out[j] = out[j + 1] = out[j + 2] = g } out[j + 3] = 255 }
    fs.mkdirSync(DIF, { recursive: true }); gravarPNG(path.join(DIF, n), pa.w, pa.h, out);
    dif.push(`${n}: ${k} pixels diferentes (linhas ${y0}–${y1})`);
  }
  for (const d of dif) console.log('DIFERENTE ' + d);
  console.log(`${iguais} iguais / ${dif.length} diferentes` + (dif.length ? ` (imagens em ${DIF})` : ''));
  return dif.length;
}

// ---------- tirar ----------
const AGORA = '2026-11-17T12:42:00-03:00';  // o feed fixo é das 12h30 deste dia
const APARELHOS = [{ nome: 'i13', w: 390, h: 844 }, { nome: 'se', w: 375, h: 667 }];
const TEMAS = ['claro', 'escuro'];
const IND = { atualizado: '2026-11-17T12:05-03:00', itens: [
  { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,69', variacao: '+0,42%', dir: 'sobe', data: '2026-11-17', fonte: 'cotação comercial', fonte_serie: 'PTAX/Banco Central', serie: [5.61, 5.6, 5.63, 5.62, 5.65, 5.66, 5.69], rotulos: ['2026-11-07', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-17'] },
  { id: 'ibovespa', nome: 'Ibovespa', valor: '131.240', variacao: '-0,85%', dir: 'desce', data: '2026-11-17', fonte: 'B3', serie: [129800, 130500, 131900, 132400, 132100, 132360, 131240], rotulos: ['2026-11-07', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-17'] },
  { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'estavel', data: '2026-11-05', fonte: 'Copom/Banco Central', serie: [14.25, 14, 13.75, 13.75], rotulos: ['2026-08', '2026-09', '2026-10', '2026-11'] },
  { id: 'ipca12m', nome: 'IPCA 12 meses', valor: '4,62%', variacao: '-0,08 p.p.', dir: 'desce', data: '2026-11-10', fonte: 'IBGE', serie: [4.9, 4.81, 4.7, 4.62], rotulos: ['2026-07', '2026-08', '2026-09', '2026-10'] }] };

// cada tela: async (P, foto) — P é a página já aberta na Capa; foto(nome) grava a tela inteira visível
const sel = (P, s) => P.evaluate(s => !!document.querySelector(s), s);
async function rolarAte(P, s, dy = 60) { return P.evaluate(([s, dy]) => { const e = document.querySelector(s); if (!e) return false; const sc = e.closest('#layer .mat, #layer .sheet, #layer [class*="pg"]');
  const r = e.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r.top + window.scrollY - dy)); return true }, [s, dy]) }
async function rolarPartes(P, foto, prefixo, max = 12) {  // a página inteira, uma tela por vez
  const tot = await P.evaluate(() => { window.scrollTo(0, 0); return document.documentElement.scrollHeight - innerHeight });
  const passo = await P.evaluate(() => innerHeight - 80);
  for (let i = 0, y = 0; i < max; i++, y += passo) { await P.evaluate(y => window.scrollTo(0, y), Math.min(y, tot)); await foto(prefixo + '-' + String(i + 1).padStart(2, '0')); if (y >= tot) break }
  await P.evaluate(() => window.scrollTo(0, 0));
}
async function rolarCamada(P, foto, prefixo, seletor, max = 10) {  // um elemento que rola por dentro (matéria, página de cobertura)
  const r = await P.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollTop = 0; return { tot: e.scrollHeight - e.clientHeight, passo: e.clientHeight - 80 } }, seletor);
  if (!r) { await foto(prefixo + '-01'); return }
  for (let i = 0, y = 0; i < max; i++, y += r.passo) { await P.evaluate(([s, y]) => { const e = document.querySelector(s); e.scrollTop = y; e.dispatchEvent(new Event('scroll')) }, [seletor, Math.min(y, r.tot)]); await foto(prefixo + '-' + String(i + 1).padStart(2, '0')); if (y >= r.tot) break }
}
const fechar = P => P.evaluate(() => { try { if (document.querySelector('#layer').innerHTML) closeLayer() } catch (e) { } });
const manchete = P => P.evaluate(() => (document.querySelector('#v-capa .cpi-man [data-cpx]') || document.querySelector('#v-capa [data-cpx]')).dataset.cpx);

const AREAS = {
  capa: {
    'inteira': async (P, foto) => rolarPartes(P, foto, 'inteira'),
    'manchete-aberta': async (P, foto) => { await P.evaluate(() => { const b = document.querySelector('#v-capa .cpi-man .cpi-b'); if (b) b.click() }); await foto('manchete-aberta');
      await P.evaluate(() => { const b = document.querySelector('#v-capa .cpi-man .cpi-b'); if (b && b.getAttribute('aria-expanded') === 'true') b.click() }) },
    'em-1-min': async (P, foto) => { if (await rolarAte(P, '#v-capa .cp-1m')) await foto('em-1-min') },
    'indicadores': async (P, foto) => { if (await rolarAte(P, '#v-capa .ui184, #v-capa .cp-ind')) await foto('indicadores');
      const b = await P.evaluate(() => { const b = document.querySelector('#v-capa [data-ui184], #v-capa [data-indg]'); if (b) b.click(); return !!b }); if (b) { await foto('indicadores-explica'); await fechar(P) } },
    'para-acompanhar': async (P, foto) => { const ok = await P.evaluate(() => { const h = [...document.querySelectorAll('#v-capa .cp-h h3')].find(x => /Para acompanhar/.test(x.textContent)); if (!h) return false; window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 60); return true });
      if (ok) await foto('para-acompanhar');
      if (await sel(P, '#v-capa [data-cobpag]')) { await P.evaluate(() => document.querySelector('#v-capa .cp-l [data-cobpag], #v-capa [data-cobpag]').click()); await foto('cobertura-aberta'); await fechar(P) } },
    'agenda': async (P, foto) => { const ok = await P.evaluate(() => { const h = [...document.querySelectorAll('#v-capa .cp-h h3')].find(x => /Agenda/.test(x.textContent)); if (!h) return false; window.scrollTo(0, h.getBoundingClientRect().top + scrollY - 60); return true });
      if (ok) await foto('agenda') },
    'fim': async (P, foto) => { if (await rolarAte(P, '#v-capa .cp-fim', 300)) await foto('fim') },
  },
  materia: {
    'manchete': async (P, foto) => { const id = await manchete(P); await P.evaluate(id => abrirMateria(id), id); await rolarCamada(P, foto, 'manchete', '#layer .mat'); await fechar(P) },
    'destaque': async (P, foto) => { const id = await P.evaluate(() => { const b = document.querySelector('#v-capa .cp-dest [data-cpx]'); return b && b.dataset.cpx }); if (!id) return;
      await P.evaluate(id => abrirMateria(id), id); await rolarCamada(P, foto, 'destaque', '#layer .mat', 4); await fechar(P) },
    // quadro de números, pesquisas e linha do tempo (cada uma com o seu capítulo)
    'numeros': async (P, foto) => { await P.evaluate(() => abrirMateria('pacote-meis-perdao-pix')); await rolarCamada(P, foto, 'numeros', '#layer .mat', 5); await fechar(P) },
    'pesquisas': async (P, foto) => { await P.evaluate(() => abrirMateria('pesquisas')); await rolarCamada(P, foto, 'pesquisas', '#layer .mat', 5); await fechar(P) },
    'tempo': async (P, foto) => { await P.evaluate(() => abrirMateria('papa-leao-cancer-pulmao')); await rolarCamada(P, foto, 'tempo', '#layer .mat', 5); await fechar(P) },
    // Atualizações, O essencial e Perguntas (o feed fixo não tem: entram na pauta antes de abrir)
    'extras': async (P, foto) => { await P.evaluate(() => { const p = pautaById('caso-master');
        p.atualizacoes = [{ hora: '2026-11-17T09:05:00-03:00', texto: 'Defesa pede mais prazo ao relator.' }, { hora: '2026-11-17T11:20:00-03:00', texto: 'Relator nega o pedido e mantém a data.' }, { hora: '2026-11-16T18:40:00-03:00', texto: 'Caso volta à pauta.' }];
        p.faq = [{ p: 'O que está em jogo?', r: 'A decisão define quem responde pelo caso.' }, { p: 'Quando sai a decisão?', r: 'A previsão é para a próxima semana.' }];
        p.essencial = ['Primeiro ponto essencial.', 'Segundo ponto essencial.']; abrirMateria('caso-master') });
      await rolarCamada(P, foto, 'extras', '#layer .mat', 8);
      if (await P.evaluate(() => { const s = document.querySelector('#layer .mat .fs2-faq summary'); if (!s) return false; s.click(); s.scrollIntoView({ block: 'center' }); return true })) await foto('extras-pergunta-aberta');
      await fechar(P) },
    // índice de capítulos: tocar no segundo capítulo
    'indice': async (P, foto) => { await P.evaluate(() => abrirMateria('pacote-meis-perdao-pix'));
      if (await P.evaluate(() => { const b = document.querySelectorAll('#layer .mat [data-f113cap]')[1]; if (!b) return false; b.click(); return true })) await foto('indice-capitulo');
      await fechar(P) },
    // "Noticiado por" aberto (quem noticiou)
    'quem-noticiou': async (P, foto) => { const id = await manchete(P); await P.evaluate(id => abrirMateria(id), id);
      if (await P.evaluate(() => { const b = document.querySelector('#layer .mat .ft182-qn, #layer .mat [data-cpfontes]'); if (!b) return false; b.click(); return true })) { await foto('quem-noticiou');
        await P.evaluate(() => { const s = document.querySelector('.sheet'); if (s) { s.scrollTop = s.scrollHeight; s.dispatchEvent(new Event('scroll')) } }); await foto('quem-noticiou-fim') }
      await fechar(P); await fechar(P) },
    // página da cobertura aberta pela matéria
    'cobertura': async (P, foto) => { await P.evaluate(() => abrirMateria('pec-6x1-senado'));
      if (await P.evaluate(() => { const b = document.querySelector('#layer .mat [data-cobpag]'); if (!b) return false; b.click(); return true })) { await foto('cobertura-01');
        await P.evaluate(() => { const ss = document.querySelectorAll('.sheet'), s = ss[ss.length - 1]; if (s) { s.scrollTop = 600; s.dispatchEvent(new Event('scroll')) } }); await foto('cobertura-02') }
      await fechar(P); await fechar(P) },
    // Próxima (matIr) e a volta para a primeira
    'proxima': async (P, foto) => { const id = await manchete(P); await P.evaluate(id => abrirMateria(id), id);
      if (await P.evaluate(() => { const b = document.querySelector('#layer .mat [data-matprox]'); if (!b) return false; b.click(); return true })) { await foto('proxima');
        await P.evaluate(() => { try { closeLayer(true) } catch (e) { } }); await foto('proxima-volta') }
      await fechar(P) },
    // aberta a partir do Feed: o botão diz "‹ Feed"
    'do-feed': async (P, foto) => { await P.evaluate(() => go('feed')); const id = await P.evaluate(() => (FEED.pautas[3] || FEED.pautas[0]).id);
      await P.evaluate(id => abrirMateria(id), id); await foto('do-feed'); await fechar(P) },
  },
  conversas: {
    'sem-conta': async (P, foto) => { await P.evaluate(() => go('msgs')); await foto('sem-conta') },
    'lista': async (P, foto) => { await dmEstado(P); await P.evaluate(() => go('msgs')); await rolarPartes(P, foto, 'lista', 3) },
    'lista-busca': async (P, foto) => { await dmEstado(P); await P.evaluate(() => go('msgs'));
      for (const q of ['bi', 'zz']) { await P.evaluate(q => { const i = document.querySelector('#dmq'); i.focus(); i.value = q; i.dispatchEvent(new Event('input', { bubbles: true })) }, q); await P.evaluate(() => document.activeElement.blur()); await foto('lista-busca-' + q) } },
    'conversa': async (P, foto) => { await dmEstado(P); await P.evaluate(() => { go('msgs'); abrirConversa('u-bia') }); await foto('conversa-fim'); await rolarPartes(P, foto, 'conversa', 6) },
    'link': async (P, foto) => { await dmEstado(P); await P.evaluate(() => { go('msgs'); abrirConversa('u-bia') }); if (await rolarAte(P, '#v-msgs .bub a', 200)) await foto('link') },
    'acoes': async (P, foto) => { await dmEstado(P); await P.evaluate(() => { go('msgs'); abrirConversa('u-bia') });
      await P.evaluate(() => dmAcoes('m-b6')); await foto('acoes-recebida'); await fechar(P);
      await P.evaluate(() => dmAcoes('m-b3')); await foto('acoes-enviada'); await fechar(P);
      await P.evaluate(() => { const b = document.querySelector('#v-msgs .dm-rx'); if (b) b.click() }); await foto('reacoes'); await fechar(P);
      await P.evaluate(() => abrirThMenu('u-bia')); await foto('menu'); await fechar(P);
      await P.evaluate(() => dmResponder('m-b6')); await foto('respondendo') },
    'outras': async (P, foto) => { await dmEstado(P);
      for (const u of ['u-caio', 'u-dora', 'u-edu', 'u-exc']) { await P.evaluate(u => { go('msgs'); abrirConversa(u) }, u); await fimDaConversa(P); await foto('conversa-' + u.slice(2)); await P.evaluate(() => { THREAD = null; go('msgs') }) } },
    'so-seguir': async (P, foto) => { await dmEstado(P, true); await P.evaluate(() => go('msgs')); await foto('so-seguir-lista');
      for (const u of ['u-edu', 'u-dora']) { await P.evaluate(u => abrirConversa(u), u); await fimDaConversa(P); await foto('so-seguir-' + u.slice(2)); await P.evaluate(() => { THREAD = null; go('msgs') }) } },
    'enviar': async (P, foto) => { await dmEstado(P); const pid = await P.evaluate(() => FEED.pautas[0].id);
      await P.evaluate(pid => openSend(pid), pid); await foto('enviar-noticia'); await fechar(P);
      await P.evaluate(pid => openSend(pid, 'u-caio'), pid); await foto('enviar-para-caio'); await fechar(P);
      await P.evaluate(() => abrirNovaConversa()); await foto('nova-conversa'); await fechar(P) },
  },
  // núcleo (Fase 3): funções compartilhadas — closeLayer, go, sheet, toast, pubPostHTML, atividade, renderMe
  nucleo: {
    'materia-fecha': async (P, foto) => { const id = await manchete(P); await P.evaluate(id => abrirMateria(id), id); await foto('materia-aberta');
      await P.evaluate(() => closeLayer()); await foto('materia-fechada') },
    'destaque-fecha': async (P, foto) => { const id = await P.evaluate(() => { const b = document.querySelector('#v-capa .cp-dest [data-cpx]'); return b && b.dataset.cpx }); if (!id) return;
      await P.evaluate(() => window.scrollTo(0, 400)); await P.evaluate(id => abrirMateria(id), id);
      await P.evaluate(() => { const m = document.querySelector('#layer .mat'); if (m) { m.scrollTop = 500; m.dispatchEvent(new Event('scroll')) } });
      await P.evaluate(() => closeLayer()); await foto('destaque-fechado') },
    'sheet': async (P, foto) => { await P.evaluate(() => sheet('Folha de teste', '<p>Corpo da folha com <b>texto</b>.</p><input placeholder="campo">', '<button type="button" class="btn">Pronto</button>'));
      await foto('sheet-aberta'); await P.evaluate(() => closeLayer()); await foto('sheet-fechada') },
    'toast': async (P, foto) => { await P.evaluate(() => toast('Aviso de teste do núcleo', 'Desfazer', () => { })); await foto('toast', { toast: true }) },
    'feed': async (P, foto) => { await P.evaluate(() => go('feed')); await rolarPartes(P, foto, 'feed', 4) },
    'feed-capa': async (P, foto) => { await P.evaluate(() => { go('feed'); window.scrollTo(0, 900) }); await P.evaluate(() => go('capa')); await foto('feed-volta-capa');
      await P.evaluate(() => go('feed')); await foto('capa-volta-feed') },
    'story-fecha': async (P, foto) => { await P.evaluate(() => go('feed')); const ok = await P.evaluate(() => { const b = document.querySelector('#secs [data-sec-story]'); if (b) b.click(); return !!b });
      if (!ok) return; await foto('story-aberto'); await P.evaluate(() => closeLayer()); await foto('story-fechado') },
    'posts': async (P, foto) => { await P.evaluate(() => { go('feed'); const pid = (FEED.pautas || [])[0]?.id; const at = Date.now() - 3600e3, A = '11111111-aaaa-4aaa-8aaa-111111111111';
      const xs = [{ id: 'a1111111-1111-4111-8111-111111111111', autor: A, tipo: 'post', at, texto: 'Só texto, com #hashtag e @alguem.', fotos: [] },
        { id: 'b2222222-2222-4222-8222-222222222222', autor: A, tipo: 'post', at: at - 7200e3, texto: 'Comentando a notícia.', fotos: [], pid, estilo: { v: 2 } },
        { id: 'c3333333-3333-4333-8333-333333333333', autor: A, tipo: 'post', at: at - 86400e3, texto: 'Dólar volta a subir\n\nA alta pressiona a inflação.', fotos: [], estilo: { v: 2, cn: { k: 'ana', tit: 'Dólar volta a subir', d: { tipo: 'bar', s: [12.5, 8.1, 7.3], r: ['SP', 'RJ', 'MG'] }, fu: 'Banco Central' } } },
        { id: 'd4444444-4444-4444-8444-444444444444', autor: A, tipo: 'post', at: at - 2 * 86400e3, texto: 'Vale a pena?', fotos: [], pid, estilo: { v: 2, cn: { k: 'enq', o: ['Sim', 'Não', 'Talvez'] } } },
        { id: 'e5555555-5555-4555-8555-555555555555', autor: A, tipo: 'post', at: at - 3 * 86400e3, texto: 'Importante acompanhar.', fotos: [], pid, snap: { titulo: 'Título guardado', secao: 'economia' }, estilo: { v: 2, cn: { k: 'nt' } } }];
      const d = document.createElement('div'); d.id = 'nucleo-posts'; d.innerHTML = xs.map(x => { try { return pubPostHTML(x) } catch (e) { return '<p>erro ' + e.message + '</p>' } }).join('');
      const alvo = document.querySelector('#posts') || document.querySelector('#v-feed'); alvo.prepend(d); window.scrollTo(0, d.getBoundingClientRect().top + scrollY - 60) });
      await foto('posts-01'); await P.evaluate(() => window.scrollBy(0, innerHeight - 80)); await foto('posts-02'); await P.evaluate(() => window.scrollBy(0, innerHeight - 80)); await foto('posts-03') },
    'perfil': async (P, foto) => { await P.evaluate(() => go('me')); await rolarPartes(P, foto, 'perfil', 3); await P.evaluate(() => go('capa')); await foto('perfil-volta-capa') },
  },
  // Feed (Fase 3): do topo ao fim com prateleiras, círculos das seções, cartão de notícia em páginas, filtro de seção,
  // posts de amigos no meio, comentários (no cartão e abertos), carregar mais até o fim
  feed: {
    'inteira': async (P, foto) => { await P.evaluate(() => go('feed')); await rolarPartes(P, foto, 'inteira', 12) },
    'circulos': async (P, foto) => { await P.evaluate(() => { go('feed'); const s = document.querySelector('#secs'); if (s) s.scrollLeft = 200 }); await foto('circulos') },
    'paginas': async (P, foto) => { await P.evaluate(() => go('feed'));
      for (const k of [1, 2, 3]) { const ok = await P.evaluate(k => { const t = document.querySelector('#posts .post .track'); if (!t || !t.children[k]) return false;
          t.closest('.post').scrollIntoView(); t.scrollLeft = t.clientWidth * k; t.dispatchEvent(new Event('scroll')); return true }, k);
        if (!ok) break; await U_sleep(500); await foto('paginas-' + (k + 1)) } },
    'secao': async (P, foto) => { await P.evaluate(() => { go('feed'); const b = document.querySelector('#filters [data-filtro]:not([data-filtro="tudo"])'); if (b) b.click() }); await rolarPartes(P, foto, 'secao', 3);
      await P.evaluate(() => { const b = document.querySelector('[data-filtro="tudo"]'); if (b) b.click() }); await foto('secao-volta') },
    'social': async (P, foto) => { await feedSocial(P); await P.evaluate(() => go('feed')); await rolarPartes(P, foto, 'social', 5) },
    'comentarios': async (P, foto) => { await feedSocial(P); await P.evaluate(() => { go('feed'); openComments(FEED.pautas[0].id) }); await foto('comentarios-abertos'); await fechar(P);
      // o cartão muda de altura enquanto as páginas se ajustam: volta ao topo, espera assentar e desce de uma vez só
      // (o cabeçalho e a barra de baixo mudam conforme a última rolagem foi para cima ou para baixo)
      await P.evaluate(() => window.scrollTo(0, 0)); await U_sleep(1200);
      await P.evaluate(() => { const el = document.getElementById('p-' + FEED.pautas[0].id); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60) });
      await foto('comentarios-no-cartao') },
    // stories do topo: cada tipo de círculo, a página seguinte e a passagem para o círculo seguinte (sem passar sozinho)
    'stories': async (P, foto) => { await P.evaluate(() => { PREF.storyAuto = false; go('feed') });
      for (const [nome, s] of [['5min', '[data-5min]'], ['ultimas', '[data-ultimas]'], ['secao', '[data-sec-story]'], ['destaque', '[data-dest]']]) {
        const ok = await P.evaluate(s => { const b = document.querySelector('#secs ' + s); if (b) b.click(); return !!b }, s); if (!ok) continue;
        await U_sleep(400); await foto('story-' + nome + '-1');
        for (const k of [2, 3]) { await P.evaluate(() => { const b = document.querySelector('#layer [data-sgo="1"]'); if (b) b.click() }); await U_sleep(400); await foto('story-' + nome + '-' + k) }
        await P.evaluate(() => { try { closeLayer() } catch (e) { } }); await U_sleep(300) }
      await foto('story-volta-feed') },
    'fim': async (P, foto) => { await P.evaluate(() => go('feed'));
      for (let i = 0; i < 30; i++) { const tem = await P.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); return !!document.querySelector('#mais') }); if (!tem) break; await U_sleep(300) }
      await P.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await foto('fim');
      await P.evaluate(() => window.scrollBy(0, -(innerHeight - 80))); await foto('fim-antes') },
  },
  // criar, perfil: acrescentar aqui (cada tela abre a partir da Capa, num contexto novo)
};
// Feed com gente: conta de teste com amigos, curtidas, comentários e dois posts de amigos (entram no meio do Feed)
async function feedSocial(P) {
  await P.evaluate(() => {
    const T = Date.now(), M = 6e4, H = 36e5, p0 = FEED.pautas[0], p1 = FEED.pautas[1];
    S.uid = 'u-pedro'; S.user = { id: 'u-pedro', email: 'pedro@x.com' }; S.email = 'pedro@x.com'; S.membro = true; S.amigosOk = true;
    S.membros = { 'u-pedro': { nome: 'Pedro' }, 'u-bia': { nome: 'Bia Souza' }, 'u-caio': { nome: 'Caio Lima' } };
    S.amigos = new Set(['u-bia', 'u-caio']);
    const nada = () => new Promise(() => { });
    S.db = { marcarLidas: () => Promise.resolve(), collection: () => ({ add: nada }), doc: () => ({ delete: nada, set: nada }), rpc: nada, recarregar: () => { } };
    S.soc = S.soc || {}; S.soc.curtidas = { 'u-bia': { [p0.id]: { at: T - H } }, 'u-caio': { [p0.id]: { at: T - 2 * H }, [p1.id]: { at: T - H } }, 'u-pedro': { [p1.id]: { at: T - M } } };
    S.cmts = { [p0.id]: [{ id: 'c1', uid: 'u-bia', pid: p0.id, texto: 'Que notícia importante.', at: T - 50 * M }, { id: 'c2', uid: 'u-caio', pid: p0.id, texto: 'Concordo, Bia.', at: T - 40 * M },
      { id: 'c3', uid: 'u-pedro', pid: p0.id, texto: 'Vou acompanhar.', at: T - 30 * M }], [p1.id]: [{ id: 'c4', uid: 'u-caio', pid: p1.id, texto: 'Alguém viu isso?', at: T - 20 * M }] };
    PUB.on = true; PUB.carregou = true; PUB.uid = 'u-pedro';
    PUB.itens = [{ id: 'a1111111-1111-4111-8111-111111111111', autor: 'u-bia', tipo: 'post', at: T - 3 * H, texto: 'Só texto, com #hashtag.', fotos: [] },
      { id: 'b2222222-2222-4222-8222-222222222222', autor: 'u-caio', tipo: 'post', at: T - 4 * 864e5, texto: 'Comentando a notícia.', fotos: [], pid: p1.id, estilo: { v: 2 } }];
    try { renderSecs(); renderPosts() } catch (e) { }
  });
}
// Conversas: conta de teste montada direto no estado (Pedro, amigos Bia e Caio; Dora e Edu não são amigos; uma conta excluída),
// mensagens com horários fixos em relação ao relógio parado e um banco de mentira que aceita tudo e não responde nada.
// a conversa rola sozinha até o fim, às vezes em dois tempos (o aviso de amizade entra depois): espera e fixa no fim
async function fimDaConversa(P) { await U_sleep(400); await P.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)) }
const U_sleep = ms => new Promise(r => setTimeout(r, ms));
async function dmEstado(P, soSeguir) {
  await P.evaluate(soSeguir => {
    const T = Date.now(), M = 6e4, H = 36e5, D = 864e5, p0 = FEED.pautas[0], p1 = FEED.pautas[1], p2 = FEED.pautas[2];
    S.uid = 'u-pedro'; S.user = { id: 'u-pedro', email: 'pedro@x.com' }; S.email = 'pedro@x.com'; S.membro = true; S.amigosOk = true;
    S.membros = { 'u-pedro': { nome: 'Pedro' }, 'u-bia': { nome: 'Bia Souza' }, 'u-caio': { nome: 'Caio Lima' }, 'u-dora': { nome: 'Dora Reis' }, 'u-edu': { nome: 'Edu Prado' }, 'u-exc': { nome: 'Rui', excluido: true } };
    S.amigos = new Set(['u-bia', 'u-caio']); S.pedidosIn = []; S.pedidosOut = [];
    const nada = () => new Promise(() => { });
    S.db = { marcarLidas: () => Promise.resolve(), collection: () => ({ add: nada }), doc: () => ({ delete: nada }), rpc: nada, recarregar: () => { } };
    const eu = 'u-pedro', mk = (id, de, para, at, x) => ({ id, de, para, at: T - at, texto: '', lida: true, ...x });
    S.msgsOut = [
      mk('m-b1', eu, 'u-bia', 3 * D + 2 * H, { texto: 'Oi Bia, tudo bem?' }),
      mk('m-b3', eu, 'u-bia', 2 * H, { pid: p0.id, snap: snapById(p0.id) }),
      mk('m-b4', eu, 'u-bia', 2 * H - M, { texto: 'Viu essa? Saiu agora há pouco no Prumo e já tem bastante gente comentando.' }),
      mk('m-b8', eu, 'u-bia', 20 * M, { texto: '😂' }),
      mk('m-b10', eu, 'u-bia', 5 * M, { texto: 'Vou ler agora' }),
      mk('m-c2', eu, 'u-caio', 2 * D, { pid: p1.id, snap: snapById(p1.id), texto: 'Para você' }),
      mk('m-d2', eu, 'u-dora', 5 * D - 3 * M, { texto: 'Oi Dora' }),
      mk('m-e1', eu, 'u-edu', 6 * D, { texto: 'Oi Edu, viu o jogo?' }),
    ];
    S.msgsIn = [
      mk('m-b2', 'u-bia', eu, 3 * D + 2 * H - 2 * M, { texto: 'Tudo! E você?' }),
      mk('m-b5', 'u-bia', eu, 110 * M, { texto: 'Que notícia!', tipo: 'resposta', snap: { q: { id: 'm-b4', de: eu, t: 'Viu essa? Saiu agora há pouco no Prumo' } } }),
      mk('m-b6', 'u-bia', eu, 100 * M, { texto: 'Olha isso: https://prumonews.com.br/m/teste-123 e www.exemplo.com.br.' }),
      mk('m-b7', 'u-bia', eu, 99 * M, { texto: '❤️', tipo: 'reacao_msg', snap: { ref: 'm-b4' } }),
      mk('m-b9', 'u-bia', eu, 10 * M, { texto: '@Pedro olha o que escrevi aqui', tipo: 'mencao', pid: p2.id, resp: true, snap: { titulo: snapById(p2.id).titulo, secao: snapById(p2.id).secao } }),
      mk('m-c1', 'u-caio', eu, 50 * M, { texto: 'Bom dia! Viu a agenda de hoje?', lida: false }),
      mk('m-c3', 'u-caio', eu, 2 * D - H, { texto: '👍 Concordo', tipo: 'reacao', pid: p1.id, resp: true, snap: { id: p1.id, titulo: snapById(p1.id).titulo, secao: snapById(p1.id).secao } }),
      mk('m-d1', 'u-dora', eu, 5 * D, { texto: 'Oi Pedro' }),
      mk('m-x1', 'u-exc', eu, 8 * D, { texto: 'Até mais' }),
    ];
    PREF.conv = { 'u-caio': { sil: true } };
    if (soSeguir) { SG181.uid = S.uid; SG181.on = true; CS123.sigo = new Set(['u-bia', 'u-caio']); SG181.fech = new Set(['u-dora', 'u-edu']); document.body.classList.add('sg181-on') }
    updateBadge();
  }, !!soSeguir);
}

async function tirar(PASTA, area, porta) {
  const telas = AREAS[area]; if (!telas) { console.log('área desconhecida: ' + area + ' (há: ' + Object.keys(AREAS).join(', ') + ')'); process.exit(2) }
  const { execFileSync } = require('child_process');
  const SITE = 'site-fotos';
  execFileSync('python3', ['build.py', 'https://teste.supabase.co', 'sb_publishable_teste123', '--saida', SITE], { cwd: FONTE, stdio: 'ignore' });
  for (const f of ['indicadores.json', 'novidades.json', 'fotos-arquivo.json']) fs.rmSync(path.join(FONTE, SITE, f), { force: true });
  fs.copyFileSync(path.join(AQUI, 'feed-fotos.json'), path.join(FONTE, SITE, 'feed.json'));
  fs.rmSync(path.join(FONTE, SITE, 'feed-leve.json'), { force: true });
  const U = require('../t_util');
  U.servir(SITE, porta); await U.sleep(800);
  fs.mkdirSync(PASTA, { recursive: true });
  if (!process.env.TELAS) for (const f of fs.readdirSync(PASTA)) if (f.startsWith(area + '-') && f.endsWith('.png')) fs.rmSync(path.join(PASTA, f));
  const b = await U.navegador(); let n = 0; const erros = [];
  for (const ap of APARELHOS) for (const tema of TEMAS) for (const [tela, fn] of Object.entries(telas)) { if (process.env.TELAS && !process.env.TELAS.split(',').includes(tela)) continue;
    const ctx = await b.newContext({ viewport: { width: ap.w, height: ap.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: tema === 'escuro' ? 'dark' : 'light', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    await ctx.route(u => !/^https?:\/\/localhost[:/]/.test(u.toString()), r => r.abort());
    await ctx.addInitScript(([agora, ind]) => {
      const T0 = new Date(agora).getTime(), p0 = performance.now(), D = Date;
      const agoraMs = () => T0 + Math.floor(performance.now() - p0);
      function F(...a) { if (!new.target) return new D(agoraMs()).toString(); return a.length ? new D(...a) : new D(agoraMs()) }
      F.prototype = D.prototype; F.now = agoraMs; F.parse = D.parse; F.UTC = D.UTC; Object.setPrototypeOf(F, D); window.Date = F;
      Math.random = (() => { let s = 12345; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000 } })();
      try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1'); localStorage.setItem('prumo-ind', JSON.stringify(ind)) } catch (e) { }
      const css = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}';
      const poe = () => { const s = document.createElement('style'); s.textContent = css; (document.head || document.documentElement).appendChild(s) };
      if (document.head) poe(); else document.addEventListener('DOMContentLoaded', poe);
    }, [AGORA, IND]);
    const P = await ctx.newPage(); P.on('pageerror', e => erros.push(`${ap.nome}/${tema}/${tela}: ${e.message}`));
    await P.goto(`http://localhost:${porta}/index.html`);
    await U.esperar(P, () => typeof FEED !== 'undefined' && !!FEED && !!document.querySelector('#v-capa .cpi'), null, 15000);
    await U.sleep(2500);  // complementos adiados (idle), carga das fontes
    const assenta = async () => {
      // rolagem que o app faz sozinho (abrir um cartão leva-o para a tela): espera a posição parar por meio segundo
      await P.evaluate(async () => { const pos = () => [scrollY, ...[...document.querySelectorAll('#layer .mat, #layer .sheet')].map(e => e.scrollTop)].join();
        let ult = pos(), igual = 0; for (let i = 0; i < 60 && igual < 5; i++) { await new Promise(r => setTimeout(r, 100)); const p = pos(); if (p === ult) igual++; else { igual = 0; ult = p } } });
      await P.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 3000) }))) });
      await P.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await U.sleep(250) };
    const foto = async (nome, o = {}) => { await assenta(); if (!o.toast) await P.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
      await P.screenshot({ path: path.join(PASTA, `${area}-${nome}-${ap.nome}-${tema}.png`), animations: 'disabled', caret: 'hide' }); n++ };
    await P.evaluate(() => window.scrollTo(0, 0));
    try { await fn(P, foto) } catch (e) { erros.push(`${ap.nome}/${tema}/${tela}: ${e.message.split('\n')[0]}`) }
    await ctx.close();
  }
  await b.close();
  for (const e of erros) console.log('ERRO ' + e);
  console.log(`${n} fotos em ${PASTA}`);
}

const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'tirar' && a1 && a2) tirar(path.resolve(a1), a2, +a3 || 9200).then(() => process.exit(0), e => { console.error(e); process.exit(1) });
else if (cmd === 'comparar' && a1 && a2) process.exit(comparar(path.resolve(a1), path.resolve(a2)) ? 1 : 0);
else { console.log('uso: node review2/fotos_iguais.js tirar <pasta> <area> [porta]  |  comparar <pastaA> <pastaB>\náreas: ' + Object.keys(AREAS).join(', ')); process.exit(2) }
module.exports = { AREAS, lerPNG, comparar };
