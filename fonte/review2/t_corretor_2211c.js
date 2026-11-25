// Corretor 22/11 (noite). Porta 9172.
// (1) achado "agora-da-capa-abre-com-horoscopo-e-onde-assistir": a faixa AGORA da Capa abria com horóscopo, "onde
//     assistir", página de jogo ("Palmeiras x Flamengo - Campeonato Brasileiro 2026") e Mega-Sena. O robô já marcava
//     "lixo" (Mega-Sena), mas agoraItens só olhava "relevante OU 2+ fontes" e o filtro AG_LIXO não tinha serviço nem
//     loteria; a cópia do filtro na pré-capa (121) era mais curta. Gera a CLASSE: todos os casos vistos (sáb e dom) com 2
//     fontes, em agoraItens e em ac208Itens; a cópia do 121 é igual ao AG_LIXO e também olha "lixo". Controles: notícia
//     de verdade com 2 fontes (inclusive "Lula x Tarcísio: …" e "Flamengo vence o Palmeiras") continua.
// (2) achados "foto-temporais-no-rs-enchente-no-maranhao", "foto-tremores-interior-sp-enchente-no-maranhao",
//     "foto-alerta-de-chuva-na-grande-sp-enchente-no-maranhao" e "foto-chitaozinho-e-xororo-avenida-paulista-ao-anoitecer":
//     no tema e no padrão da editoria, foto de um fato (enchente) ou cartão-postal (Paulista, Copacabana) só entra se o
//     título ou o subtítulo diz o fato ou o lugar (ft187EventoAlheio em faListas). Controles: título com enchente / Paulista.
const fs = require('fs'), path = require('path');
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9172, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (P, f, a) => P.evaluate(f, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await A.goto(BASE); await esperar(A, () => window.FEED && FEED.pautas && FEED.pautas.length, null, 15000); await sleep(500);

  // ---------- (1) faixa AGORA ----------
  const lixos = ['Horóscopo do dia: previsão para os 12 signos em 21/11/2026', 'Central x Íbis: onde assistir, horário e prováveis escalações',
    'Palmeiras x Flamengo - Campeonato Brasileiro 2026', 'Chapecoense x Cruzeiro - Campeonato Brasileiro 2026', 'Bragantino x Vasco: onde assistir ao jogo de hoje',
    'Mega-Sena: quanto rendem R$ 45 milhões na poupança, Tesouro Direto ou CDB'];
  // 25/11: notícia que já está na edição (atualizada depois) sai do AGORA de propósito (212); o controle usa assuntos fora da edição
  const boas = ['Lula x Tarcísio: pesquisa mostra empate técnico na disputa por São Paulo', 'Chuva forte alaga ruas do centro de Manaus nesta tarde',
    'Denúncia do ex-procurador do Paraguai chega à ONU nesta sexta'];
  const r = await ev(A, ([lixos, boas]) => {
    const hSP = ms => { const p = new Date(ms).toLocaleString('en-GB', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).match(/(\d{2})\/(\d{2}),? (\d{2}):(\d{2})/); return `${p[1]}/${p[2]} ${p[3]}h${p[4]}` };
    const h = hSP(Date.now() - 10 * 60e3);
    const mk = (t, extra) => Object.assign({ assunto: t, relevante: false, n_fontes: 2, secao: 'brasil', manchetes: [{ titulo: t, veiculo: 'G1', hora: h }, { titulo: t, veiculo: 'O Globo', hora: h }] }, extra || {});
    const ant = NOVID_AG;
    // a Mega-Sena "pode pagar" com o título limpo mas marcada lixo pelo robô (caso de dom 00h53)
    const megaLixo = mk('Sorteio especial do domingo pode pagar R$ 45 milhões a quem acertar', { lixo: true });
    NOVID_AG = { gerado: new Date().toISOString(), novos: lixos.map(t => mk(t)).concat([megaLixo], boas.map(t => mk(t))), em_pautas: {} };
    const ag = agoraItens().map(x => x.t);
    NOVID_AG.novos.forEach(n => n.relevante = true);
    const ac = ac208Itens().map(x => x.t);
    NOVID_AG = ant;
    return { ag, ac, re: AG_LIXO.source }
  }, [lixos, boas]);
  const corta = s => s.replace(/[;,.:–-]?\s*\b(veja|entenda|saiba|confira|assista|ao vivo)\b.*$/i, '').trim();
  for (const t of lixos) ok(!r.ag.some(x => x.startsWith(t.slice(0, 20))), `AGORA sem "${t.slice(0, 40)}"`, r.ag);
  ok(!r.ag.some(x => /Sorteio especial/.test(x)), 'AGORA sem item marcado "lixo" pelo robô', r.ag);
  ok(!r.ac.some(x => /Sorteio especial/.test(x)) && !r.ac.some(x => lixos.some(t => x.startsWith(t.slice(0, 20)))), 'Acabou de sair também sem lixo', r.ac);
  const boasAg = boas.filter(t => r.ag.some(x => x.startsWith(corta(t).slice(0, 20))));
  ok(boasAg.length === Math.min(boas.length, 4), 'controle: notícias de verdade com 2 fontes continuam no AGORA', r.ag);
  // pré-capa (121): mesma regra
  const src = fs.readFileSync(path.join(__dirname, '../app/src/js/121-pre-capa.js'), 'utf8');
  const m = src.match(/var LIXO=\/(.*?)\/i;/);
  ok(m && m[1] === r.re, 'pré-capa (121): o filtro é igual ao AG_LIXO', m && m[1].slice(0, 80));
  ok(/forEach\(function\(n\)\{if\(!n\|\|!n\.assunto\|\|n\.lixo\)return;/.test(src), 'pré-capa (121): item "lixo" não entra');

  // ---------- (2) fotos de fato / cartão-postal no tema e no padrão ----------
  const f = await ev(A, () => {
    const foto = n => ({ url: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/' + n, credito: 'Foto de arquivo', w: 640, h: 427 });
    const ant = FOTOS_ARQ;
    const T = { padrao: { brasil: 'brasil/Sociedade' }, pessoas: {}, assuntos: {}, gerado: 'teste2211c', temas: {
      'brasil/Meio ambiente e clima': [foto('Enchente_em_Itapecuru_Mirim.jpg'), foto('Enchente_em_Trizidela_do_Vale_%28MA%29.jpg'), foto('Enchente_Itaoca_2014.jpg')],
      'brasil/Sociedade': [foto('Paulista_Avenue%2C_S%C3%A3o_Paulo%2C_Brazil_-Twilight.jpg'), foto('Copacabana_Beach_Mosaic_and_Palm_Trees.jpg')] } };
    FOTOS_ARQ = T; try { ft157Prep() } catch (e) {}
    const nomes = (tit, sub, subt) => faListas({ id: 'x' + tit.length, secao: 'brasil', subtema: sub, subtitulo: subt || '', neutro: { titulo: tit } }, T).flat().map(x => decodeURIComponent(x.url.split('/').pop()));
    const out = {
      ruins: [['Temporais no Rio Grande do Sul deixam 3 mortos desde segunda (16)', 'Meio ambiente e clima'], ['Sobe para 4 o número de mortos no temporal em Tupanciretã (RS)', 'Meio ambiente e clima'],
        ['Estrondos e tremores assustam moradores no interior de SP', 'Meio ambiente e clima'], ['Defesa Civil emite alerta severo de chuva para a Grande SP', 'Meio ambiente e clima'],
        ['Chitãozinho e Xororó anunciam aposentadoria após 56 anos', 'Música'], ['Onda de calor deve durar até quinta no Centro-Oeste', 'Meio ambiente e clima']].map(([t, s]) => [t, nomes(t, s)]),
      enchente: nomes('Enchente deixa 2 mil desalojados no Maranhão', 'Meio ambiente e clima'),
      alagado: nomes('Chuva forte em Recife', 'Meio ambiente e clima', 'Ruas alagadas na zona norte'),
      paulista: nomes('Avenida Paulista fecha para a parada neste domingo', 'Sociedade') };
    FOTOS_ARQ = ant; FA_CACHE = {}; try { ft157Prep() } catch (e) {}
    return out });
  for (const [t, l] of f.ruins) ok(!l.some(n => /enchente|paulista|copacabana/i.test(n)), `foto: "${t.slice(0, 45)}" sem enchente nem cartão-postal`, l);
  ok(f.enchente.some(n => /Enchente/.test(n)), 'controle: título com enchente usa a foto de enchente', f.enchente);
  ok(f.alagado.some(n => /Enchente/.test(n)), 'controle: subtítulo com "alagadas" usa a foto de enchente', f.alagado);
  ok(f.paulista.some(n => /Paulista/.test(n)), 'controle: título com a Paulista usa a foto da Paulista', f.paulista);
  await b.close(); process.exit(0)
})().catch(e => { console.error('FAIL', e); process.exit(1) });
