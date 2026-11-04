// Função enviar-push, sem Deno e sem rede: agrupar (1 por tipo/conversa a cada 2 min), montar o aviso, preferências,
// coberturas seguidas e — com a biblioteca de verdade — o pedido cifrado (aes128gcm) aberto aqui como o celular abriria,
// a assinatura VAPID conferida e o aparelho "sumido" (404/410) reconhecido.
const U = require('../t_util'); const { ok } = U; const path = require('path'); const crypto = require('crypto');
(async () => {
  const L = await import(path.join(__dirname, '..', 'supabase', 'functions', 'enviar-push', 'logica.mjs'));
  const agora = Date.parse('2026-11-04T12:00:00Z'), t = s => new Date(agora - s * 1000).toISOString();
  const lin = (id, o) => ({ id, para: 'A', tipo: 'mensagens', chave: 'conv:B', de: 'B', titulo: 'Bia', corpo: 'oi ' + id, url: '?nt=conversa:B', criado_em: t(60 - id), ...o });

  /* preferências: tudo desligado até ligar */
  ok(!L.querTipo({}, 'mensagens') && !L.querTipo(null, 'mensagens') && !L.querTipo({ mensagens: 'true' }, 'mensagens') && L.querTipo({ mensagens: true }, 'mensagens'), 'prefs: só true liga (padrão desligado)');
  ok(L.TIPOS.length === 10 && L.TIPOS.includes('colunas') && L.TIPOS.includes('coberturas'), 'os 10 tipos');

  /* agrupar */
  let g = L.agrupar([lin(1), lin(2), lin(3), lin(4, { tipo: 'curtidas', chave: 'curt:P', de: 'C', titulo: 'Caio curtiu seu post', corpo: '' }),
    lin(5, { tipo: 'curtidas', chave: 'curt:P', de: 'D', titulo: 'Dani curtiu seu post', corpo: '' }), lin(6, { para: 'X' })], [], agora);
  ok(g.grupos.length === 3 && !g.agrupados.length, 'agrupar: 3 grupos (conversa da Bia, curtidas do post, outra pessoa)', g.grupos.map(x => x.ids));
  const gm = g.grupos.find(x => x.para === 'A' && x.tipo === 'mensagens');
  ok(JSON.stringify(gm.ids) === '[1,2,3]', 'agrupar: ordem de chegada', gm.ids);
  const pm = L.montarPayload(gm, 4);
  ok(pm.title === 'Bia' && pm.body === '3 mensagens novas: oi 3' && pm.tag === 'mensagens:conv:B' && pm.url === '?nt=conversa:B' && pm.badge === 4 && pm.icon === 'icon-192.png', 'aviso: 3 mensagens viram 1 (com o número no ícone)', pm);
  const pc = L.montarPayload(g.grupos.find(x => x.tipo === 'curtidas'));
  ok(pc.title === 'Dani curtiu seu post' && pc.body === 'e mais 1 pessoa' && !('badge' in pc), 'aviso: curtidas de 2 pessoas', pc);
  ok(L.montarPayload({ tipo: 'mencoes', chave: 'm', linhas: [lin(1, { url: 'https://mal.example/x' })] }).url === './', 'aviso: endereço estranho vira a página inicial');
  ok(L.montarPayload({ tipo: 'mensagens', chave: 'm', linhas: [lin(1, { corpo: 'x'.repeat(500) })] }).body.length <= 180, 'aviso: corpo cortado');
  // 2 minutos
  g = L.agrupar([lin(7), lin(8, { tipo: 'mencoes', chave: 'men:B' })], [{ para: 'A', tipo: 'mensagens', chave: 'conv:B', enviado_em: t(60) }], agora);
  ok(JSON.stringify(g.agrupados) === '[7]' && g.grupos.length === 1 && g.grupos[0].tipo === 'mencoes', 'agrupar: mesma conversa < 2 min fica agrupada; outro tipo sai', g);
  g = L.agrupar([lin(9)], [{ para: 'A', tipo: 'mensagens', chave: 'conv:B', enviado_em: t(150) }], agora);
  ok(g.grupos.length === 1 && !g.agrupados.length, 'agrupar: depois de 2 min toca de novo');

  /* coberturas */
  const feed = { pautas: [
    { id: 'pec', tema: 'PEC da Segurança', atualizacoes: [{ hora: '2026-11-04T08:30:00-03:00', texto: 'Votação adiada' }, { hora: '2026-11-04T06:00:00-03:00', texto: 'antiga' }] },
    { id: 'copom', tema: 'Copom de novembro', atualizacoes: [{ hora: '2026-11-01T06:52:00-03:00', texto: 'velha' }] },
    { id: 'semtema', atualizacoes: [{ hora: '2026-11-04T08:30:00-03:00', texto: 'x' }] }] };
  const nov = L.coberturasNovas(feed, Date.parse('2026-11-04T07:00:00-03:00'), agora);
  ok(nov.length === 1 && nov[0].pid === 'pec' && nov[0].chave === 'pec da seguranca' && nov[0].texto === 'Votação adiada' && nov[0].n === 1, 'coberturas: só a que mudou depois da marca (tema sem acento)', nov);
  const docs = [{ owner: 'A', data: { seguindo: { 'pec da seguranca': 'PEC da Segurança' } } }, { owner: 'B', data: { seguindo: {} } }, { owner: 'C', data: {} }];
  ok(JSON.stringify(L.quemSegue(docs, 'pec da seguranca')) === '["A"]', 'coberturas: quem segue');
  const av = L.avisoCobertura(nov[0]);
  ok(av.p_tipo === 'coberturas' && av.p_url === '?nt=cobertura:pec' && /PEC da Segurança: nova atualização/.test(av.p_titulo), 'coberturas: aviso', av);

  /* VAPID e envio de verdade (biblioteca fixa na versão da função) */
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const b64u = b => Buffer.from(b).toString('base64url');
  const vapid = { subject: 'mailto:teste@exemplo.com', publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
  ok(L.validarVapid(vapid.publicKey, vapid.privateKey, vapid.subject) === '', 'VAPID: chaves do formato do web-push aceitas');
  ok(/PUBLIC/.test(L.validarVapid('abc', vapid.privateKey, vapid.subject)) && /PRIVATE/.test(L.validarVapid(vapid.publicKey, 'x', vapid.subject)) && /SUBJECT/.test(L.validarVapid(vapid.publicKey, vapid.privateKey, 'eu')), 'VAPID: avisa chave trocada ou contato sem mailto');
  let lib = null; try { lib = await import('@block65/webcrypto-web-push') } catch (e) { }
  ok(!!lib, 'biblioteca @block65/webcrypto-web-push instalada (npm install)');
  if (lib) {
    // o "celular": chave e segredo da inscrição
    const ua = crypto.createECDH('prime256v1'); ua.generateKeys(); const authS = crypto.randomBytes(16);
    const insc = { id: 'i1', endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', p256dh: b64u(ua.getPublicKey()), auth: b64u(authS) };
    let pedido = null;
    const fetch201 = async (u, r) => { pedido = { u, ...r }; return { status: 201 } };
    const texto = JSON.stringify(pm);
    const r1 = await L.enviarUm(lib.buildPushPayload, fetch201, insc, texto, vapid);
    ok(r1.ok && !r1.sumiu && pedido.u === insc.endpoint && pedido.method === 'post' && pedido.headers['content-encoding'] === 'aes128gcm' && pedido.headers.ttl === '86400', 'envio: POST cifrado aes128gcm para o endereço do aparelho, validade 24 h', pedido && pedido.headers);
    // abre como o navegador abriria (RFC 8291)
    const body = Buffer.from(pedido.body); const salt = body.subarray(0, 16), rs = body.readUInt32BE(16), idlen = body[20], keyid = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
    const shared = ua.computeSecret(keyid);
    const hk = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
    const ikm = hk(authS, shared, Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), keyid]), 32);
    const cek = hk(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hk(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
    const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
    let pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]); let k = pt.length - 1; while (k > 0 && pt[k] === 0) k--; pt = pt.subarray(0, k);
    let lido = null; try { lido = JSON.parse(pt.toString('utf8')) } catch (e) { }
    ok(rs >= 18 && lido && lido.title === 'Bia' && lido.url === '?nt=conversa:B', 'envio: o celular decifra e lê o aviso', lido);
    // VAPID: JWT assinado com a chave privada, para o endereço do serviço de push
    const m = /^vapid t=([^,]+), k=(.+)$/.exec(pedido.headers.authorization || '');
    const [h, p, s] = (m ? m[1] : '..').split('.');
    const pubKey = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(ecdh.getPublicKey().subarray(1, 33)), y: b64u(ecdh.getPublicKey().subarray(33)) }, format: 'jwk' });
    const valido = m && crypto.verify('sha256', Buffer.from(h + '.' + p), { key: pubKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
    const claims = m ? JSON.parse(Buffer.from(p, 'base64url').toString()) : {};
    ok(valido && m[2] === vapid.publicKey && claims.aud === 'https://fcm.googleapis.com' && claims.sub === vapid.subject && claims.exp > Date.now() / 1000, 'VAPID: assinatura confere, com a chave pública e o contato', claims);
    const r404 = await L.enviarUm(lib.buildPushPayload, async () => ({ status: 410 }), insc, texto, vapid);
    const r500 = await L.enviarUm(lib.buildPushPayload, async () => ({ status: 500 }), insc, texto, vapid);
    ok(!r404.ok && r404.sumiu && !r500.ok && !r500.sumiu, 'envio: 410 = aparelho sumiu (apagar); 500 = falha (tenta outra vez)');
  }
  const R = U.resumo(); console.log(`\nRESUMO t_push_logica: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
