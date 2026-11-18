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
  // feed, criar, perfil: acrescentar aqui (cada tela abre a partir da Capa, num contexto novo)
};
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
  for (const f of fs.readdirSync(PASTA)) if (f.startsWith(area + '-') && f.endsWith('.png')) fs.rmSync(path.join(PASTA, f));
  const b = await U.navegador(); let n = 0; const erros = [];
  for (const ap of APARELHOS) for (const tema of TEMAS) for (const [tela, fn] of Object.entries(telas)) {
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
    const foto = async nome => { await assenta(); await P.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
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
