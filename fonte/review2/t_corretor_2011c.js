// Corretor 20/11 (c). Causa horario-da-edicao: cada lugar tirava o "de quando é isto" de uma fonte (topo da Capa somava as
// novidades; rodapé da Capa, Perfil, folha "Atualizações de hoje", faixa "Sem conexão", "Últimas … às" e a Capa pré-desenhada
// liam só o atualizado_em do feed). Agora todos usam horaEdicaoMs/horaEdicaoIso (200). O teste gera a CLASSE: para vários
// cenários (sem novidade; novidade de "Acabou de sair" 2 h depois; novidade da faixa "Agora"; novidade depois da meia-noite com
// feed de ontem; novidade "do futuro" que não vale) confere que todos os lugares mostram a MESMA hora. Porta 9422.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9422, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  const f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  f.atualizado_em = new Date(Date.now() - 20 * 60000).toISOString();
  fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f));
  for (const x of ['feed-leve.json', 'novidades.json']) try { fs.unlinkSync(path.join(__dirname, '..', 'site', x)) } catch (e) {}
  U.servir('site', PORTA); await sleep(800); const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 15000);
  await sleep(1500);

  // cenário: feed às `feedMin` minutos atrás; novidade (manchete de 2 veículos, relevante) a `novMin` minutos atrás (null = nenhuma)
  const cenario = (nome, feedMin, novMin, tipo) => P.evaluate(async ([feedMin, novMin, tipo]) => {
    const hSP = ms => { const d = new Date(ms), p = d.toLocaleString('en-GB', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
      const m = p.match(/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/); return `${m[1]}/${m[2]} ${m[3]}h${m[4]}` };
    const fm = Date.now() - feedMin * 60e3; FEED.atualizado_em = new Date(fm).toISOString();
    const novos = [];
    if (novMin != null) { const h = hSP(Date.now() - novMin * 60e3);
      const man = [{ titulo: 'Câmara aprova em primeira votação o projeto do teste do corretor', veiculo: 'G1', hora: h }, { titulo: 'Câmara aprova o projeto do teste do corretor em primeiro turno', veiculo: 'Folha', hora: h }];
      novos.push(tipo === 'agora' ? { assunto: 'Câmara aprova o projeto do teste do corretor em primeira votação', relevante: false, n_fontes: 2, ja_e_breve: true, secao: 'politica', manchetes: man }
        : { assunto: 'Câmara aprova o projeto do teste do corretor em primeira votação', relevante: true, n_fontes: 2, secao: 'politica', manchetes: man }) }
    NOVID_AG = { gerado: new Date().toISOString(), novos, em_pautas: {} };
    OFFLINE = true; go('capa'); renderCapa(); try { ac208Atualiza() } catch (e) {} await new Promise(r => setTimeout(r, 300));
    const txt = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : '' };
    const out = { esperado: horaEdicaoIso(), topo: txt('#v-capa .cp-ed'), rodape: txt('#v-capa .cp-fim-at'), offl: txt('#v-capa .offl span') || (avisoAtraso().match(/Mostrando a edição ([^.<]*)/) || [])[1] || '',
      saude: estadoRadar().txt, tk: txt('#tkhora') };
    go('feed'); await new Promise(r => setTimeout(r, 400)); try { fd167Rodape() } catch (e) {} out.feed = txt('#extra .foot p b');
    try { go('me'); await new Promise(r => setTimeout(r, 300)); renderMeMiolo(); out.perfil = txt('#v-me [data-rodadas] em') } catch (e) { out.perfil = 'erro ' + e.message }
    OFFLINE = false; go('capa'); return out }, [feedMin, novMin, tipo]);

  const hhmm = iso => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' });
  const casos = [['sem novidade', 30, null], ['Acabou de sair 2 h depois do feed', 150, 25], ['faixa Agora depois do feed', 100, 10, 'agora'], ['novidade "do futuro" não conta', 40, -30]];
  for (const [nome, fm, nm, tp] of casos) {
    const r = await cenario(nome, fm, nm, tp); const h = hhmm(r.esperado), hc = (+h.slice(0, 2)) + 'h' + h.slice(3), hz = h.slice(0, 2) + 'h' + h.slice(3);
    const quer = nm != null && nm >= 0 ? Date.now() - nm * 60e3 : Date.now() - fm * 60e3;
    ok(Math.abs(Date.parse(r.esperado) - quer) < 90e3, `${nome}: a hora da edição é a da última coisa que mudou`, r.esperado);
    ok(r.topo.includes('Atualizada às ' + hc), `${nome}: topo da Capa`, r.topo);
    ok(r.rodape.includes(hz), `${nome}: rodapé da Capa com a mesma hora`, [r.rodape, hz]);
    ok(r.feed.includes(hz), `${nome}: rodapé do Feed com a mesma hora`, [r.feed, hz]);
    ok(r.perfil === 'edição das ' + hz, `${nome}: Perfil > Atualizações do Prumo`, [r.perfil, hz]);
    ok(r.offl.includes(hz), `${nome}: faixa "Sem conexão" com a mesma hora`, [r.offl, hz]);
    ok(!r.tk || r.tk.includes(hz), `${nome}: "Últimas … às" com a mesma hora`, [r.tk, hz]);
    const minutos = Math.round((Date.now() - Date.parse(r.esperado)) / 6e4);
    ok(minutos < 60 ? /min|agora/.test(r.saude) : /\bh\b|hora/.test(r.saude), `${nome}: folha Atualizações ("Atualizado há …") conta da mesma hora`, [r.saude, minutos]);
  }
  // depois da meia-noite: feed de ontem às 23h, novidade de hoje (só se for madrugada no fuso; senão simula com o relógio do teste)
  {
    const r = await P.evaluate(() => { const ag = Date.now(); const ontem = ag - 26 * 3600e3; FEED.atualizado_em = new Date(ontem).toISOString();
      const h = new Date(ag - 10 * 60e3), p = h.toLocaleString('en-GB', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).match(/(\d{2})\/(\d{2}),? (\d{2}):(\d{2})/);
      const hh = `${p[1]}/${p[2]} ${p[3]}h${p[4]}`, man = [{ titulo: 'Senado aprova o projeto do teste do corretor na madrugada', veiculo: 'G1', hora: hh }, { titulo: 'Senado aprova projeto do teste do corretor de madrugada', veiculo: 'UOL', hora: hh }];
      NOVID_AG = { gerado: new Date().toISOString(), novos: [{ assunto: 'Senado aprova o projeto do teste do corretor na madrugada', relevante: true, n_fontes: 2, secao: 'politica', manchetes: man }], em_pautas: {} };
      renderCapa(); const iso = horaEdicaoIso(); return { iso, hoje: dataSP(iso) === hojeSP(), txt: horaEdicaoTxt(), topo: capaEdicao() } });
    ok(r.hoje && /^das \d{2}h\d{2}$/.test(r.txt), 'feed de ontem + novidade de hoje: "edição das …" de hoje (não de ontem)', r);
  }
  ok(!P._erros.length, 'sem erros na página ' + P._erros.join('|'));
  await ctx.close(); await b.close(); const s = U.resumo(); console.log(`FIM ${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})().catch(e => { console.error('Error', e); process.exit(1) });
