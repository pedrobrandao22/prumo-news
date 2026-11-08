// Colunas, fase 4 (136 + sql v14 + tools/colunas_publicas.py + função enviar-newsletter): tornar pública; quem não entrou lê
// SÓ colunas públicas publicadas e SÓ os campos expostos (no banco PGlite, como anon); privada/agendada/arquivada/apagada/de
// conta suspensa invisível; página estática com Open Graph e HTML sem script; link no Exportar e no "Copiar link"; assinar
// (pedido → confirmação → confirmado), limite de pedidos, cancelar; a autora vê a contagem e baixa só os confirmados;
// fila de envio ao publicar pública (e não privada, e agendada só quando sai); lógica da função com o Resend falso (lotes,
// List-Unsubscribe, erro registrado); 360/390 px, escuro, sem erros; app sem a v14. Portas 8782–8783. Capturas em qa/colunas-publicas/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const PORTA = 8782, PORTA2 = 8783, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'colunas-publicas'); fs.mkdirSync(QA, { recursive: true });
const RAIZ = path.join(__dirname, '..', '..');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const semLateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#layer2 .sheet *, #layer .cs123-ler *, #layer .ed132-pp *, #layer .ed132-hubr *, #layer .pfv *')].every(e => { const r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1 || e.closest('.cs123-hts,.gn-svg,.pfv-grid,.vn-pf-hl') }));
const CORPO = '<p>Primeiro parágrafo da coluna aberta, com <strong>negrito</strong> e um <a href="https://www.camara.leg.br/">link</a> para a Câmara, o bastante para ler.</p><h2>Intertítulo</h2><blockquote><p>Uma citação forte</p></blockquote><ul><li>um</li><li>dois</li></ul><hr><p>Fim do texto aberto.</p>';
const col = (tit, o = {}) => ({ v: 2, coluna: { v: 1, f: 'h', tit, linha: 'O que se ouve no Congresso', min: 3, ...o } });
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}, EM = { a: 'pedro@exemplo.com', b: 'bia@exemplo.com', c: 'carla@exemplo.com', d: 'dani@exemplo.com', e: 'eva@exemplo.com' };
  for (const k of Object.keys(EM)) ids[k] = await H.criarConta(EM[k], '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro'),($5,'Eva Lima','membro')`, [ids.a, ids.b, ids.c, ids.d, ids.e]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  await H.sql(`update public.membros set perfil_aberto = true, foto = $2 where uid = $1`, [ids.b, ids.b + '/perfil.jpg']);
  await H.sql(`insert into public.seguidores(seguidor, seguido) values ($1,$2)`, [ids.e, ids.b]);
  const como = (k, q, p) => H.comoUsuario(k ? ids[k] : null, () => H.db.query(q, p || [])).then(r => r.rows);
  const erro = async (k, q, p) => { try { await como(k, q, p); return null } catch (e) { return (e.code || '') + ' ' + e.message } };
  const pub = async (tit, publico = 'amigos', extra = {}) => (await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo${extra.quando ? ',publicar_em' : ''}) values ($1,'post',$2,$3,$4,$5,$6${extra.quando ? ',$7' : ''}) returning id`,
    [ids.b, tit + '\n\nO que se ouve no Congresso\n\n#Economia #Congresso', JSON.stringify(extra.fotos || []), col(tit, extra.c), publico, CORPO, ...(extra.quando ? [extra.quando] : [])]))[0].id;
  const fila = (extra = '', p = []) => H.sql(`select f.tipo, f.estado, f.pub, s.email, f.liberar_em > now() as espera from public.newsletter_fila f join public.newsletter_assinantes s on s.id = f.assinante ${extra} order by f.id`, p);

  /* ================= 1. banco: coluna pública e o que sai para fora ================= */
  const pA = await pub('O orçamento no corredor', 'publico', { fotos: [ids.b + '/capa.jpg', ids.b + '/foto1.jpg'], c: { serie: 'Bastidores', n: 1, capa: true } });
  const pP = await pub('Coluna só para amigos', 'amigos', { fotos: [ids.b + '/priv.jpg'] });
  const pAg = await pub('Coluna aberta agendada', 'publico', { quando: new Date(Date.now() + 3 * 864e5).toISOString() });
  const pAr = await pub('Coluna aberta arquivada', 'publico');
  await como('b', `select public.pub_arquivar($1, true)`, [pAr]);
  const pDel = await pub('Coluna aberta apagada', 'publico'); await como('b', `delete from public.publicacoes where id=$1`, [pDel]);
  ok(/so coluna pode ser publica/.test(await erro('b', `insert into public.publicacoes(autor,tipo,texto,fotos,publico) values ($1,'post','post comum','[]','publico')`, [ids.b]) || ''), 'banco: post comum não pode ser público (só coluna)');
  const L = (await como(null, `select public.colunas_publicas() j`))[0].j;
  ok(Array.isArray(L) && L.length === 1 && L[0].id === pA, 'anon lê só a coluna pública publicada (privada, agendada, arquivada e apagada ficam de fora)', L.map(x => x.tit));
  const c0 = L[0];
  ok(JSON.stringify(Object.keys(c0).sort()) === JSON.stringify(['at', 'autora', 'capa', 'cham', 'corpo', 'editado', 'formato', 'fotos', 'id', 'linha', 'min', 'n', 'serie', 'tags', 'tit']) && JSON.stringify(Object.keys(c0.autora).sort()) === '["foto","k","nome"]',
    'anon: só os campos da página (sem autor, e-mail, curtidas, comentários)', Object.keys(c0));
  const semCaminhos = JSON.stringify({ ...c0, fotos: [], capa: null, autora: { ...c0.autora, foto: null } });
  ok(semCaminhos.indexOf(ids.b) < 0 && semCaminhos.indexOf('@') < 0 && c0.tags === '#Economia #Congresso' && c0.serie === 'Bastidores' && c0.autora.nome === 'Bia Souza' && c0.capa === ids.b + '/capa.jpg' && c0.autora.foto === ids.b + '/perfil.jpg',
    'anon: nenhum uid nem e-mail nos campos (o id da autora só aparece dentro do caminho das fotos, que o robô troca)', semCaminhos.slice(0, 200));
  ok((await como(null, `select public.coluna_publica($1) j`, [pP]))[0].j === null && (await como(null, `select public.coluna_publica($1) j`, [pAg]))[0].j === null && (await como(null, `select public.coluna_publica($1) j`, [pAr]))[0].j === null && (await como(null, `select public.coluna_publica($1) j`, [pA]))[0].j.id === pA,
    'anon: coluna_publica(id) só devolve a pública publicada');
  ok(!!(await erro(null, `select id from public.publicacoes`)) && !!(await erro(null, `select nome from public.membros`)) && !!(await erro(null, `select * from public.newsletter_assinantes`)) && !!(await erro(null, `select * from public.newsletter_fila`)),
    'anon: publicações, membros, assinantes e fila continuam fechados');
  ok((await como(null, `select public.foto_de_coluna_publica($1) a, public.foto_de_coluna_publica($2) b, public.foto_de_coluna_publica($3) c, public.foto_de_coluna_publica($4) d`, [ids.b + '/foto1.jpg', ids.b + '/priv.jpg', ids.b + '/perfil.jpg', ids.c + '/x.jpg']))
    .every(r => r.a === true && r.b === false && r.c === true && r.d === false), 'fotos sem login: só as da coluna pública (e a foto do perfil aberto da autora)');
  // dentro do app: amigos e seguidores leem; desconhecido não
  ok((await como('c', `select id from public.publicacoes where id=$1`, [pA])).length === 1 && (await como('e', `select id from public.publicacoes where id=$1`, [pA])).length === 1 && (await como('d', `select id from public.publicacoes where id=$1`, [pA])).length === 0,
    'no app: a pública aparece para amiga e seguidora (não para desconhecido, que lê pelo link)');
  ok((await como('e', `select id from public.publicacoes where id=$1`, [pAg])).length === 0, 'no app: agendada pública continua escondida até a hora');
  await H.sql(`update public.membros set suspenso_em = now() where uid=$1`, [ids.b]);
  ok((await como(null, `select public.colunas_publicas() j`))[0].j.length === 0, 'autora suspensa: sai do link'); await H.sql(`update public.membros set suspenso_em = null where uid=$1`, [ids.b]);
  // mudar o público de uma coluna já publicada
  ok(/42501/.test(await erro('c', `select public.coluna_mudar_publico($1,'publico')`, [pP]) || ''), 'só a autora muda o "quem pode ler"');

  /* ================= 2. newsletter no banco: pedir, confirmar, limite, cancelar ================= */
  ok(/email invalido/.test(await erro(null, `select public.newsletter_assinar('nao-e-email', $1)`, [pA]) || '') && /email invalido/.test(await erro(null, `select public.newsletter_assinar('a@b', $1)`, [pA]) || ''), 'assinar: formato do e-mail conferido');
  ok(/indisponivel/.test(await erro(null, `select public.newsletter_assinar('leitor@exemplo.com', $1)`, [pP]) || '') && /indisponivel/.test(await erro(null, `select public.newsletter_assinar('leitor@exemplo.com', null, $1)`, [ids.b]) || ''),
    'assinar: só pela coluna pública (sem login não escolhe a autora pelo id)');
  ok((await como(null, `select public.newsletter_assinar(' Leitor@Exemplo.com ', $1) r`, [pA]))[0].r === 'ok', 'assinar sem conta: pedido aceito');
  let s = await H.sql(`select id, email, confirmado, token from public.newsletter_assinantes where email='leitor@exemplo.com'`);
  let f = await fila(`where s.email='leitor@exemplo.com'`);
  ok(s.length === 1 && !s[0].confirmado && /^[0-9a-f]{64}$/.test(s[0].token) && f.length === 1 && f[0].tipo === 'confirmacao' && f[0].estado === 'pendente', 'pedido: assinante NÃO confirmado e e-mail de confirmação na fila', [s, f]);
  ok((await H.sql(`select count(*)::int n from public.newsletter_disparo where motivo='confirmacao'`))[0].n === 1, 'pedido: uma linha no "sino" do webhook (newsletter_disparo)');
  for (let i = 0; i < 2; i++) await como(null, `select public.newsletter_assinar('leitor@exemplo.com', $1)`, [pA]);
  ok((await como(null, `select public.newsletter_assinar('leitor@exemplo.com', $1) r`, [pA]))[0].r === 'limite', 'limite: o 4º pedido do mesmo e-mail na mesma hora é recusado');
  f = await fila(`where s.email='leitor@exemplo.com' and f.estado='pendente'`);
  ok(f.length === 1, 'pedidos repetidos: fica só 1 confirmação pendente (as antigas saem)', f);
  const tok = (await H.sql(`select token from public.newsletter_assinantes where email='leitor@exemplo.com'`))[0].token;
  ok((await como(null, `select public.newsletter_confirmar('x') j`))[0].j.ok === false, 'confirmar: link inválido');
  let j = (await como(null, `select public.newsletter_confirmar($1) j`, [tok]))[0].j;
  ok(j.ok === true && j.nome === 'Bia Souza' && (await H.sql(`select confirmado from public.newsletter_assinantes where token=$1`, [tok]))[0].confirmado === true, 'confirmar: o link do e-mail confirma (dois passos)', j);
  for (const e of ['b1@exemplo.com', 'b2@exemplo.com']) { await como(null, `select public.newsletter_assinar($1, $2)`, [e, pA]); const t = (await H.sql(`select token from public.newsletter_assinantes where email=$1`, [e]))[0].token; await como(null, `select public.newsletter_confirmar($1)`, [t]) }
  await como(null, `select public.newsletter_assinar('pendente@exemplo.com', $1)`, [pA]);
  // a autora: contagem e lista (só confirmados, só os dela)
  let inf = (await como('b', `select public.newsletter_info($1) j`, [ids.b]))[0].j;
  ok(inf.aberta === true && inf.confirmados === 3 && inf.pendentes === 1, 'autora: vê só a contagem (3 confirmados, 1 esperando)', inf);
  const exp = await como('b', `select * from public.newsletter_exportar()`);
  ok(exp.length === 3 && exp.every(r => r.email !== 'pendente@exemplo.com'), 'autora: exporta só os confirmados', exp.map(r => r.email));
  ok((await como('c', `select * from public.newsletter_exportar()`)).length === 0 && (await como('c', `select public.newsletter_info($1) j`, [ids.b]))[0].j.confirmados === null, 'outra pessoa não vê a lista nem a contagem da autora');
  ok(!!(await erro(null, `select * from public.newsletter_exportar()`)) && !!(await erro(null, `select public.newsletter_info($1)`, [ids.b])), 'anon: não lista nem conta assinantes');
  // cancelar
  j = (await como(null, `select public.newsletter_cancelar($1) j`, [tok]))[0].j;
  s = await H.sql(`select confirmado, cancelado from public.newsletter_assinantes where token=$1`, [tok]);
  ok(j.ok && !s[0].confirmado && !!s[0].cancelado && (await como('b', `select public.newsletter_info($1) j`, [ids.b]))[0].j.confirmados === 2, 'cancelar: o link de todo e-mail cancela na hora', s);
  // membro: só com consentimento
  ok(/consentimento/.test(await erro('c', `select public.newsletter_membro($1, true, false)`, [ids.b]) || ''), 'membro: sem marcar que concorda, não assina');
  ok((await como('c', `select public.newsletter_membro($1, true, true) r`, [ids.b]))[0].r === 'ok' && (await H.sql(`select confirmado, origem from public.newsletter_assinantes where email=$1`, [EM.c]))[0].confirmado === true, 'membro: com consentimento, assina com 1 toque (e-mail da conta)');
  ok(/nao assina a si mesma/.test(await erro('b', `select public.newsletter_membro($1, true, true)`, [ids.b]) || ''), 'a autora não assina a si mesma');

  /* ================= 3. fila de envio ao publicar ================= */
  await H.sql(`delete from public.newsletter_fila`);
  const pN = await pub('Coluna aberta nova', 'publico');
  f = await fila(`where f.tipo='coluna'`);
  ok(f.length === 3 && f.every(x => x.pub === pN && x.estado === 'pendente' && x.espera === true) && !f.some(x => x.email === 'leitor@exemplo.com' || x.email === 'pendente@exemplo.com'),
    'publicar pública: fila com 1 e-mail por assinante confirmado (cancelado e pendente fora), esperando 10 min a página', f);
  ok((await H.sql(`select count(*)::int n from public.newsletter_disparo where motivo='coluna'`))[0].n === 1, 'publicar pública: UMA chamada do webhook por coluna (não uma por assinante)');
  await pub('Coluna nova só para amigos', 'amigos');
  ok((await fila(`where f.tipo='coluna'`)).length === 3, 'publicar privada: nada na fila');
  await H.sql(`update public.publicacoes set publico='publico' where id=$1`, [pN]); await como('b', `select public.coluna_mudar_publico($1,'publico')`, [pN]);
  ok((await fila(`where f.tipo='coluna'`)).length === 3, 'a mesma coluna nunca vai duas vezes');
  ok((await fila(`where f.pub=$1`, [pAg])).length === 0, 'agendada pública: nada antes da hora');
  await como('b', `update public.publicacoes set publicar_em = null where id=$1`, [pAg]);
  ok((await fila(`where f.pub=$1`, [pAg])).length === 3, 'agendada pública: "publicar agora" põe na fila');
  const pAg2 = await pub('Outra agendada aberta', 'publico', { quando: new Date(Date.now() + 864e5).toISOString() });
  await H.sql(`update public.publicacoes set publicar_em = now() - interval '1 minute' where id=$1`, [pAg2]); await H.sql(`select public.colunas_agendadas_avisar()`);
  ok((await fila(`where f.pub=$1`, [pAg2])).length === 3, 'agendada pública: quando chega a hora (aviso das agendadas da v12), vai para a fila');
  const pOld = await pub('Coluna antiga que vira pública', 'amigos'); await H.sql(`update public.publicacoes set at = at - 3*86400000 where id=$1`, [pOld]);
  await como('b', `select public.coluna_mudar_publico($1,'publico')`, [pOld]);
  ok((await fila(`where f.pub=$1`, [pOld])).length === 0 && (await como(null, `select public.coluna_publica($1) j`, [pOld]))[0].j?.id === pOld, 'coluna antiga que vira pública: ganha o link, mas não dispara e-mail velho');
  await como('b', `select public.coluna_mudar_publico($1,'amigos')`, [pOld]);
  ok((await como(null, `select public.coluna_publica($1) j`, [pOld]))[0].j === null, 'voltar para "Amigos": some do link');
  const nVar = (await H.sql(`select public.newsletter_varrer() n`))[0].n;
  ok(nVar === 0, 'a varredura não duplica o que já foi para a fila', nVar);

  /* ================= 4. página estática (o robô, sem rede) ================= */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pb136-')); const fx = path.join(tmp, 'colunas.json'), saida = path.join(tmp, 'c');
  fs.writeFileSync(fx, JSON.stringify((await como(null, `select public.colunas_publicas() j`))[0].j));
  const py = spawnSync('python3', ['-I', path.join(RAIZ, 'tools', 'colunas_publicas.py'), '--fixture', fx, '--saida', saida], { encoding: 'utf8' });
  const LG = await import(path.join(__dirname, '..', 'supabase', 'functions', 'enviar-newsletter', 'logica.mjs'));
  const arqA = LG.arquivoDe({ tit: 'O orçamento no corredor', id: pA });
  const pg = fs.existsSync(path.join(saida, arqA)) ? fs.readFileSync(path.join(saida, arqA), 'utf8') : '';
  const art = (pg.split('<article class="cp-art">')[1] || '').split('</article>')[0];
  ok(py.status === 0 && !!pg && /property="og:title" content="O orçamento no corredor · Bia Souza · Prumo News"/.test(pg) && /property="og:description" content="O que se ouve no Congresso"/.test(pg) && /name="twitter:card" content="summary_large_image"/.test(pg)
    && pg.indexOf(`rel="canonical" href="https://prumonews.com.br/c/${arqA}"`) > 0, 'página estática: Open Graph, Twitter e canonical (o nome bate com o do e-mail)', py.stderr || py.stdout);
  ok(!!art && !/<script|\son\w+=|javascript:/i.test(art) && /<h2>Intertítulo<\/h2>/.test(art) && /<blockquote><p>Uma citação forte<\/p><\/blockquote>/.test(art) && pg.indexOf(ids.b) < 0 && /Assinar por e-mail/.test(pg) && /Ler no Prumo/.test(pg),
    'página estática: HTML limpo, sem script, sem o caminho do Storage, com "Assinar por e-mail" e "Ler no Prumo"');
  ok(fs.existsSync(path.join(saida, 'index.html')) && /O orçamento no corredor/.test(fs.readFileSync(path.join(saida, 'index.html'), 'utf8')) && fs.readFileSync(path.join(saida, 'sitemap.xml'), 'utf8').indexOf(LG.arquivoDe({ tit: 'Coluna aberta nova', id: pN })) > 0 && !/só para amigos/.test(fs.readFileSync(path.join(saida, 'index.html'), 'utf8')),
    'c/index.html e c/sitemap.xml com as públicas (sem as privadas)');
  fs.rmSync(tmp, { recursive: true, force: true });

  /* ================= 5. a função enviar-newsletter com o Resend falso ================= */
  const chamadas = []; const resendOk = async (url, o) => { const b = JSON.parse(o.body); chamadas.push({ url, auth: o.headers.Authorization, n: b.length, b }); return { status: 200, json: async () => ({ data: b.map((_, i) => ({ id: 're_' + chamadas.length + '_' + i })) }) } };
  const cP = (await como(null, `select public.coluna_publica($1) j`, [pA]))[0].j;
  const msgs = Array.from({ length: 250 }, (_, i) => ({ to: `l${i}@exemplo.com`, ...LG.emailColuna(cP, { token: 'f'.repeat(64), site: 'https://prumonews.com.br' }) }));
  const res = []; for (const l of LG.lotes(msgs)) res.push(await LG.enviarLote(resendOk, 're_TESTE', 'Prumo <colunas@prumonews.com.br>', l));
  ok(chamadas.length === 3 && chamadas.map(c => c.n).join(',') === '100,100,50' && chamadas.every(c => c.url === 'https://api.resend.com/emails/batch' && c.auth === 'Bearer re_TESTE') && res.every(r => r.ok && r.ids.length) , 'Resend falso: 250 e-mails em 3 lotes (100, 100, 50) pelo /emails/batch', chamadas.map(c => c.n));
  const m0 = chamadas[0].b[0];
  ok(m0.from === 'Prumo <colunas@prumonews.com.br>' && m0.to[0] === 'l0@exemplo.com' && /^<https:\/\/prumonews\.com\.br\/c\/assinatura\.html\?cancelar=f{64}>$/.test(m0.headers['List-Unsubscribe']) && /Cancelar a assinatura/.test(m0.html) && m0.html.indexOf(`https://prumonews.com.br/c/${arqA}`) > 0 && /Leia a coluna completa/.test(m0.text),
    'e-mail da coluna: List-Unsubscribe, link de cancelar e "Leia a coluna completa: <link>"', m0.headers);
  ok(!/<script|\son\w+=|<img|<figure/i.test(m0.html), 'e-mail da coluna: sem script, sem foto do Storage');
  const conf = LG.emailConfirmacao({ nome: 'Bia Souza', token: 'a'.repeat(64), site: 'https://prumonews.com.br' });
  ok(/confirmar=a{64}/.test(conf.html) && /cancelar=a{64}/.test(conf.html) && !!conf.headers['List-Unsubscribe'] && /Bia Souza/.test(conf.subject), 'e-mail de confirmação: confirmar e cancelar');
  const r500 = await LG.enviarLote(async () => ({ status: 500, json: async () => ({ message: 'fora do ar' }) }), 'k', 'a@b.com', msgs.slice(0, 2));
  const r422 = await LG.enviarLote(async () => ({ status: 422, json: async () => ({ message: 'domain not verified' }) }), 'k', 'a@b.com', msgs.slice(0, 2));
  const rRede = await LG.enviarLote(async () => { throw new Error('sem rede') }, 'k', 'a@b.com', msgs.slice(0, 1));
  const d500 = LG.depoisDoErro(0, r500.status), d422 = LG.depoisDoErro(0, r422.status), d3 = LG.depoisDoErro(2, 500);
  ok(!r500.ok && /Resend 500: fora do ar/.test(r500.erro) && d500.estado === 'pendente' && d500.tentativas === 1 && /domain not verified/.test(r422.erro) && d422.estado === 'falhou' && rRede.status === 0 && d3.estado === 'falhou',
    'erro: registrado; passageiro (500, rede) tenta de novo até 3 vezes; erro do pedido (422) desiste', [r500.erro, d500, d422, d3]);
  ok(LG.esperaPagina(false, Date.now() - 60e3) === true && LG.esperaPagina(false, Date.now() - 4 * 3600e3) === false && LG.esperaPagina(true, Date.now()) === false, 'espera a página pública existir (até 3 h) antes de mandar a coluna');
  ok(LG.remetenteOk('Prumo <colunas@prumonews.com.br>') && !LG.remetenteOk('x <y>') && LG.limparHtml('<p onclick="x">a<script>b</script><img src=x onerror=y></p><a href="javascript:z">c</a>') === '<p>a</p>c', 'função: remetente conferido e HTML do banco limpo de novo');
  const fonteFn = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'enviar-newsletter', 'index.ts'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', 'supabase', 'functions', 'enviar-newsletter', 'logica.mjs'), 'utf8');
  ok(/Deno\.env\.get\("RESEND_API_KEY"\)/.test(fonteFn) && /NEWSLETTER_REMETENTE/.test(fonteFn) && !/re_[A-Za-z0-9]{20,}/.test(fonteFn) && !/\(\?<[=!]/.test(fonteFn), 'função: chave só pelo segredo (nenhuma chave no código)');

  /* v14 pode rodar de novo (banco de antes + v14 duas vezes) */
  const tmpq = path.join(__dirname, '..', 'review3', 'var', 'sqlv14.sql'); fs.mkdirSync(path.dirname(tmpq), { recursive: true });
  fs.writeFileSync(tmpq, [fs.readFileSync(path.join(__dirname, '..', 'sql', 'prumo-supabase.antes-v14.sql'), 'utf8'), fs.readFileSync(path.join(__dirname, '..', 'sql', 'publicacoes-v14.sql'), 'utf8'), fs.readFileSync(path.join(__dirname, '..', 'sql', 'publicacoes-v14.sql'), 'utf8')].join('\n'));
  let idem = true; try { const H3 = await require('../harness').criar({ sql: tmpq }); await H3.sql('select public.colunas_publicas()') } catch (e) { idem = String(e.message || e) }
  ok(idem === true, 'sql v14: roda depois da v13 e pode rodar de novo', idem);

  /* ================= 6. o app ================= */
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await (o.H || H).pagina(br, { sessao: { user: { id: (o.ids || ids)[k], email: EM[k] } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && LT134.v13 !== null && PB136.v14 !== null, null, 20000); await sleep(400); await fecha(p);
    await ev(p, () => { window.__cb = []; window.__baixa = []; Object.defineProperty(navigator, 'clipboard', { value: { write: async () => { }, writeText: async t => { window.__cb.push(t) } }, configurable: true }); ex133Baixa = (b, n) => { b.text().then(t => window.__baixa.push([n, t])); return true } });
    return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const novaColuna = async P => { await fecha(P); await ev(P, () => { go('feed'); criarAbrir('post') }); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(400);
    if (!(await ev(P, () => !!document.querySelector('#layer > .ed132 #ed132-tit')))) { await fecha(P); await ev(P, () => ed132Abre(ed132Novo())); await sleep(400) } };
  const corpo = async P => { await P.click('#ed132-corpo'); await ev(P, () => { const cp = $('#ed132-corpo'); const r = document.createRange(); r.selectNodeContents(cp); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }) };

  const B = await abrir('b'), A = await abrir('a');
  ok(await ev(B, () => PB136.v14 === true), 'v14 detectada');
  /* membro assina pelo perfil da autora */
  await ev(A, u => abrirPerfil(u), ids.b);
  ok(await esperar(A, () => !!document.querySelector('#layer .pfv [data-pb136nl]'), null, 8000), 'perfil da autora: "Colunas por e-mail"');
  await shot(A, '01-perfil-botao'); ok(await semLateral(A), '390 px: perfil com o botão sem rolagem lateral');
  await ev(A, () => document.querySelector('#layer .pfv [data-pb136nl]').click());
  ok(await esperar(A, () => !!document.querySelector('#layer2 .sheet [data-pb136nla]'), null, 4000) && await ev(A, () => document.querySelector('[data-pb136nla]').disabled && /pedro@exemplo\.com/.test($('#layer2 .sheet').textContent) && /só a autora vê a lista/.test($('#layer2 .sheet').textContent)),
    'folha: "Assinar" travado até marcar que concorda, com o e-mail da conta e o texto de privacidade');
  await sleep(700); await shot(A, '02-folha-assinar');
  await ev(A, () => document.querySelector('[data-pb136nla]').click()); await sleep(300);
  ok((await H.sql(`select count(*)::int n from public.newsletter_assinantes where email=$1`, [EM.a]))[0].n === 0, 'sem marcar: nada gravado');
  await ev(A, () => { const c = $('#pb136-cons'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })) }); await ev(A, () => document.querySelector('[data-pb136nla]').click()); await sleep(900);
  ok((await H.sql(`select confirmado, origem from public.newsletter_assinantes where email=$1`, [EM.a]))[0]?.confirmado === true && await esperar(A, () => /✓ Por e-mail/.test(document.querySelector('#layer .pfv [data-pb136nl]')?.textContent || ''), null, 4000),
    'marcou e assinou: confirmado com 1 toque e o botão vira "✓ Por e-mail"');
  await fecha(A);

  /* a autora escreve e publica com "Todos (link público)" */
  await H.sql(`delete from public.newsletter_fila`);
  await novaColuna(B);
  await B.fill('#ed132-tit', 'Orçamento: o fim do corredor'); await B.fill('#ed132-lin', 'Aberta para todos');
  await corpo(B); await B.keyboard.type('Primeiro parágrafo da coluna que vai ficar aberta para qualquer pessoa ler pelo link, mesmo sem conta.');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(500);
  const op = await ev(B, () => ({ bts: [...document.querySelectorAll('#layer .ed132-pp [data-ed132pubv]')].map(b => b.textContent) }));
  ok(op.bts.join('|') === 'Amigos|Seguidores e amigos|Todos (link público)', '"Quem pode ler": Amigos, Seguidores e amigos e "Todos (link público)"', op);
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pubv="publico"]').click()); await sleep(200);
  ok(await ev(B, () => document.querySelector('[data-ed132pubv="publico"]').getAttribute('aria-checked') === 'true' && /mesmo sem conta/.test($('[data-ed132pubh]').textContent) && ED132.E.pb136 === true), 'escolher "Todos": marcado, com a explicação curta');
  await ev(B, () => document.querySelector('[data-ed132pubv="publico"]').scrollIntoView({ block: 'center' })); await shot(B, '03-quem-pode-ler');
  ok(await semLateral(B), '390 px: "Antes de publicar" sem rolagem lateral');
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1600);
  const [nova] = await H.sql(`select id, publico from public.publicacoes where autor=$1 and estilo->'coluna'->>'tit' = 'Orçamento: o fim do corredor'`, [ids.b]);
  ok(nova && nova.publico === 'publico', 'publicada como pública (publico = publico)', nova);
  f = await fila(`where f.pub=$1`, [nova.id]);
  ok(f.length === 4 && f.some(x => x.email === EM.a) && f.every(x => x.tipo === 'coluna'), 'publicar pela tela: fila para os 4 confirmados (Pedro incluído)', f.map(x => x.email));
  /* rascunho lembra a escolha */
  await novaColuna(B); await B.fill('#ed132-tit', 'Rascunho aberto'); await ev(B, () => { ED132.E.pb136 = true; ed132Guarda() });
  ok(await ev(B, () => ed132RascLe().find(r => r.tit === 'Rascunho aberto')?.pb136 === true && ed132DoRasc(ed132RascLe().find(r => r.tit === 'Rascunho aberto')).pb136 === true), 'o rascunho guarda "Todos (link público)"');
  await ev(B, () => { const r = ed132RascLe().find(r => r.tit === 'Rascunho aberto'); if (r) ed132RascTira(r.rid) });
  await fecha(B);
  /* publicar privada pela tela: nada na fila */
  const n0 = (await fila()).length; await novaColuna(B);
  await B.fill('#ed132-tit', 'Coluna fechada pela tela'); await corpo(B); await B.keyboard.type('Texto da coluna que fica só para os amigos da autora dentro do Prumo, sem link aberto.');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400); await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1400);
  ok((await H.sql(`select publico from public.publicacoes where estilo->'coluna'->>'tit' = 'Coluna fechada pela tela'`))[0]?.publico === 'amigos' && (await fila()).length === n0, 'publicar privada pela tela: amigos e nada na fila');

  /* selo, copiar link, exportar */
  await recarrega(B); await ev(B, id => cs123Abrir(id), nova.id); await sleep(700);
  const link = 'https://prumonews.com.br/c/' + LG.arquivoDe({ tit: 'Orçamento: o fim do corredor', id: nova.id });
  ok(await ev(B, () => /Pública/.test(document.querySelector('#layer .cs123-top .pb136-selo')?.textContent || '')), 'selo "Pública" na coluna (para a autora)');
  await shot(B, '04-selo-publica'); ok(await semLateral(B), '390 px: barra da coluna com o selo sem rolagem lateral');
  await ev(B, () => document.querySelector('#layer .pb136-selo').click()); await sleep(300);
  ok(await ev(B, l => window.__cb.includes(l), link), 'selo: copia o link aberto', await ev(B, () => window.__cb));
  const X = await ev(B, id => { const F = ex133DaPub(id); return { li: ex133Inteiro(F, 'li'), fio: ex133Fio(F), wa: ex133Trecho(F, 'wa', 3, 1200), fb: ex133Trecho(F, 'tx', 3, 1500), mail: ex133Email(F, false), md: ex133Md(F), ig: ex133Legenda(F), link: F.link } }, nova.id);
  const tem = t => String(t).indexOf('Leia a coluna completa: ' + link) >= 0;
  ok(X.link === link && tem(X.li) && tem(X.fio[X.fio.length - 1]) && /^\d+\/\d+ /.test(X.fio[X.fio.length - 1]) && X.fio.every(p => p.length <= 280) && tem(X.wa) && tem(X.fb) && tem(X.ig) && X.md.indexOf(`(${link})`) > 0 && X.mail.indexOf(`href="${link}"`) > 0,
    'Exportar: LinkedIn, X (último post), WhatsApp, Facebook, Instagram, e-mail e Markdown com "Leia a coluna completa: <link>"', X.fio.slice(-1));
  const Xp = await ev(B, id => { const x = PUB.itens.find(y => y.estilo?.coluna?.tit === 'Coluna fechada pela tela'); const F = ex133DaPub(x.id); return { l: F.link || '', t: ex133Inteiro(F, 'li') } });
  ok(!Xp.l && !/Leia a coluna completa/.test(Xp.t), 'coluna privada: Exportar sem link');
  // o e-mail da newsletter é o mesmo HTML do "Exportar › E-mail"
  const cN = (await como(null, `select public.coluna_publica($1) j`, [nova.id]))[0].j;
  const eN = LG.emailColuna(cN, { token: 'c'.repeat(64), site: 'https://prumonews.com.br' }).html;
  const artN = eN.split('<body style="margin:0;padding:24px 16px;background:#ffffff">')[1].split('</body>')[0].replace(/<p style="margin:28px 0 0;font:13px[\s\S]*?<\/p>(?=<\/div>$)/, '');
  const norma = h => h.replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
  ok(norma(artN) === norma(X.mail), 'e-mail da newsletter = HTML do "Exportar › E-mail" (mais o rodapé de cancelar)', [artN.slice(0, 160), X.mail.slice(0, 160)]);
  /* "Copiar link" da folha Enviar (leitor amigo) */
  await recarrega(A); await ev(A, id => pubEnviar(pubDe(id)), nova.id); await sleep(400);
  ok(await esperar(A, () => !!document.querySelector('[data-vp99link]'), null, 3000), 'Enviar: "Copiar link"');
  await ev(A, () => document.querySelector('[data-vp99link]').click()); await sleep(300);
  ok(await ev(A, l => window.__cb.includes(l) && /qualquer pessoa abre/.test([...document.querySelectorAll('.toast')].map(t => t.textContent).join(' ')), link), '"Copiar link" da coluna pública copia o link aberto', await ev(A, () => window.__cb));
  await fecha(A);
  /* leitora na página da coluna: "Receber as colunas por e-mail" */
  await ev(A, id => cs123Abrir(id), nova.id);
  ok(await esperar(A, () => /Recebendo por e-mail/.test(document.querySelector('#layer .pb136-nlb')?.textContent || ''), null, 5000), 'leitor na coluna pública: "✓ Recebendo por e-mail" (já assina)');
  await ev(A, () => document.querySelector('#layer .pb136-nlb').click()); await esperar(A, () => !!document.querySelector('[data-pb136nlx]'), null, 3000);
  await ev(A, () => document.querySelector('[data-pb136nlx]').click()); await sleep(900);
  ok(!!(await H.sql(`select cancelado from public.newsletter_assinantes where email=$1`, [EM.a]))[0].cancelado, 'membro cancela pela coluna');
  await fecha(A);
  /* menu "…" › Quem pode ler (coluna já publicada) */
  await ev(B, id => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false; pb136Quem(id) }, nova.id); await sleep(300);
  ok(await ev(B, () => document.querySelectorAll('[data-pb136qv]').length === 3 && document.querySelector('[data-pb136qv="publico"]').getAttribute('aria-checked') === 'true'), '"Quem pode ler" da coluna publicada: 3 opções, "Todos" marcado');
  await ev(B, () => document.querySelector('[data-pb136qv="amigos"]').click()); await sleep(800);
  ok((await H.sql(`select publico from public.publicacoes where id=$1`, [nova.id]))[0].publico === 'amigos' && (await como(null, `select public.coluna_publica($1) j`, [nova.id]))[0].j === null, 'fechar o link pela tela: volta a "Amigos" e some para quem não entrou');
  await ev(B, id => pb136Quem(id), nova.id); await sleep(300); await ev(B, () => document.querySelector('[data-pb136qv="publico"]').click()); await sleep(800);
  ok((await H.sql(`select publico from public.publicacoes where id=$1`, [nova.id]))[0].publico === 'publico' && (await fila(`where f.pub=$1`, [nova.id])).length === 4, 'abrir de novo: volta a ser pública, sem mandar e-mail de novo');
  /* Minhas colunas: contagem e CSV só dos confirmados */
  await fecha(B); await ev(B, () => ed132Hub());
  ok(await esperar(B, () => /assinantes confirmados/.test(document.querySelector('#layer .pb136-hub')?.textContent || ''), null, 5000), '"Minhas colunas": newsletter com a contagem');
  const nc = await ev(B, () => document.querySelector('#layer .pb136-hub .pb136-n b').textContent);
  ok(nc === '3', 'contagem: 3 confirmados (os que cancelaram não contam)', nc);
  await shot(B, '05-minhas-colunas'); ok(await semLateral(B), '390 px: "Minhas colunas" sem rolagem lateral');
  await ev(B, () => document.querySelector('[data-pb136csv]').click()); await sleep(900);
  const csv = await ev(B, () => window.__baixa);
  ok(csv.length === 1 && csv[0][0] === 'assinantes-prumo.csv' && /^﻿?email,desde,origem\n/.test(csv[0][1]) && csv[0][1].trim().split('\n').length === 4 && !/pendente@|leitor@|pedro@/.test(csv[0][1]), 'CSV: só os confirmados (sem pendente nem cancelados)', csv[0] && csv[0][1]);
  await fecha(B);

  /* 360 px e escuro */
  const B3 = await abrir('b', { vp: { width: 360, height: 740 }, n: '3', base: BASE2 });
  await recarrega(B3); await ev(B3, id => cs123Abrir(id), nova.id); await sleep(600);
  ok(await semLateral(B3), '360 px: coluna pública da autora (selo, Exportar, Leitores) sem rolagem lateral'); await shot(B3, '06-selo-360');
  await fecha(B3); await novaColuna(B3); await B3.fill('#ed132-tit', 'Teste 360'); await corpo(B3); await B3.keyboard.type('Texto curto mas com mais de quarenta letras para abrir o painel.');
  await ev(B3, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400); await ev(B3, () => document.querySelector('[data-ed132pubv="publico"]').scrollIntoView({ block: 'center' }));
  ok(await semLateral(B3), '360 px: "Quem pode ler" com as 3 opções sem rolagem lateral'); await shot(B3, '07-quem-360'); await fecha(B3);
  const AD = await abrir('a', { dark: true, n: 'd', base: BASE2 });
  await ev(AD, u => abrirPerfil(u), ids.b); await esperar(AD, () => !!document.querySelector('#layer .pfv [data-pb136nl]'), null, 8000);
  await ev(AD, () => document.querySelector('#layer .pfv [data-pb136nl]').click()); await esperar(AD, () => !!document.querySelector('#layer2 .sheet .pb136-ok'), null, 4000);
  const cor = await ev(AD, () => { const n = cor => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = '#808080'; k.fillStyle = cor; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return { fundo: n(getComputedStyle($('#layer2 .sheet')).backgroundColor), texto: n(getComputedStyle($('.pb136-ok')).color) } });
  await sleep(700); ok(cor.fundo < 200 && cor.texto > 450, 'modo escuro: folha de assinatura escura com texto claro', cor); await shot(AD, '08-assinar-escuro'); await fecha(AD);

  /* ================= 7. app SEM a v14 ================= */
  const H2 = await require('../harness').criar({ sql: __dirname + '/../sql/prumo-supabase.antes-v14.sql' });
  const i2 = {}; for (const k of ['a', 'b']) i2[k] = await H2.criarConta(EM[k], '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [i2.a, i2.b]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i2.a, i2.b]);
  const [s1] = await H2.comoUsuario(i2.b, () => H2.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post','Sem v14','[]',$2,'amigos',$3) returning id`, [i2.b, col('Sem a v14'), CORPO])).then(r => r.rows);
  const SB2 = await abrir('b', { H: H2, ids: i2, base: BASE2, n: 'sem' });
  ok(await ev(SB2, () => PB136.v14 === false), 'sem a v14: o app detecta');
  await novaColuna(SB2); await SB2.fill('#ed132-tit', 'Sem v14'); await corpo(SB2); await SB2.keyboard.type('Texto de uma coluna escrita com o banco ainda sem a versão catorze.');
  await ev(SB2, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400);
  ok(await ev(SB2, () => !!$('#layer .ed132-pp') && !document.querySelector('[data-ed132pubv="publico"]')), 'sem a v14: sem "Todos (link público)"');
  await ev(SB2, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1300);
  ok((await H2.sql(`select publico from public.publicacoes where texto like 'Sem v14%' order by at desc limit 1`))[0]?.publico === 'amigos', 'sem a v14: publica normalmente (amigos)');
  await recarrega(SB2); await ev(SB2, id => cs123Abrir(id), s1.id); await sleep(500);
  ok(await ev(SB2, () => !document.querySelector('#layer .pb136-selo') && !!document.querySelector('#layer [data-ex133exp]')), 'sem a v14: sem selo (o resto da página igual)');
  ok(await ev(SB2, id => { const F = ex133DaPub(id); return !F.link && !/Leia a coluna completa/.test(ex133Inteiro(F, 'li')) }, s1.id), 'sem a v14: Exportar sem link');
  await fecha(SB2); await ev(SB2, () => ed132Hub()); await sleep(400);
  ok(await ev(SB2, () => !document.querySelector('#layer .pb136-hub')), 'sem a v14: "Minhas colunas" sem a newsletter'); await fecha(SB2);

  for (const Pg of [A, B, B3, AD, SB2]) ok(!(Pg._erros || []).length, 'sem erros no console', Pg._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_colunas_publicas: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
