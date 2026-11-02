/* ---------- camada de dados: Supabase com a mesma forma do banco antigo ----------
   db.doc(path)            -> get(), set(data), update(patch), delete(), onSnapshot(next, err)
   db.collection(nome)     -> get(), add(data), where(campo,"==",valor), onSnapshot(next, err)
   db.rpc(nome, args)      -> chama uma função do banco (entrar, criar_convite, pedir_amizade…)
   db.marcarLidas(de)      -> marca como lidas, de uma vez, as mensagens recebidas de alguém
   Coleções especiais: "pessoas" (tabela membros), "mensagens", "erros", "amizades".
   As demais são documentos JSON em public.docs (caminho "colecao/id"). update() mescla no
   servidor (null apaga a chave) e cria o documento se ele não existir.

   Economia (v2, pensando em ~100 pessoas):
   - Cada escuta guarda a sua cópia. Um evento do tempo real já traz a linha (e o Supabase só
     entrega a quem pode ler), então a escuta aplica a linha sem consultar o banco de novo.
   - Gravação própria não recarrega nada: o eco do tempo real atualiza; se o eco não vier em
     alguns segundos, relê só aquele documento.
   - Releitura periódica é incremental (só o que mudou desde a última marca de tempo).
   - Releitura completa só ao abrir, quando muda uma amizade, ao voltar depois de muito tempo
     fora e de hora em hora com o app aberto (pega o que foi apagado, que o tempo real não manda).
*/
function criarDB(sb, uid, opts) {
  opts = opts || {};
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  const LIS = new Set();
  const TAB = { pessoas: "membros", mensagens: "mensagens", erros: "erros", amizades: "amizades" };
  const MSG_CAMPOS = ["de", "para", "at", "texto", "pid", "snap", "resp", "tipo", "lida"];
  const ERRO_CAMPOS = ["pid", "titulo", "texto", "edicao", "at"];
  const MSG_MAX = opts.msgMax || 300;                     // mensagens mais recentes por escuta
  const POLL = opts.poll || 5 * 60000;                    // releitura incremental com o app aberto
  const CHEIO_MAX = opts.cheio || 60 * 60000;             // releitura completa com o app aberto
  const FORA_LONGO = opts.foraLongo || 15 * 60000;        // fora do app por mais que isso: releitura completa
  const ECO = opts.eco || 4000;                           // espera pelo eco da própria gravação
  const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o && o[k] !== undefined) r[k] = o[k] }); return r };
  const erro = (e) => { const x = new Error((e && e.message) || "erro"); x.code = (e && (e.code === "42501" || /row-level security|permission/i.test(e.message || ""))) ? "permission_denied" : (e && e.code) || "unavailable"; return x };
  const chk = r => { if (r && r.error) throw erro(r.error); return r ? r.data : null };
  const snapDoc = (id, data) => ({ id, exists: data != null, data: () => data == null ? undefined : clone(data) });
  const snapCol = docs => ({ docs: docs.map(([id, d]) => snapDoc(id, d)), size: docs.length, empty: !docs.length, metadata: { fromCache: false } });

  const linhaMsg = r => [r.id, pick(r, MSG_CAMPOS)];
  let COLS_M = "uid,nome,criado_em,convidado_por,papel,suspenso_em,excluido_em";
  // banco ainda sem as colunas novas (SQL da leva 3 não rodado): volta às colunas antigas
  const membrosSel = async (q) => { const r = await q(COLS_M); if (r && r.error && /column|does not exist|42703/i.test((r.error.message || "") + r.error.code) && COLS_M.includes("papel")) { COLS_M = "uid,nome,criado_em,convidado_por"; return q(COLS_M) } return r };
  const linhaPessoa = r => [r.uid, { nome: r.nome, at: Date.parse(r.criado_em) || 0, convidado_por: r.convidado_por || null, papel: r.papel || "membro", suspenso: !!r.suspenso_em, excluido: !!r.excluido_em }];
  const linhaAmizade = r => [r.de + "_" + r.para, { de: r.de, para: r.para, status: r.status, criado_em: r.criado_em }];

  /* marca de tempo do servidor: o que já vimos de public.docs */
  let marca = 0;
  const viu = r => { const t = r && Date.parse(r.atualizado_em); if (t && t > marca) marca = t };

  async function lerDoc(path) {
    const i = path.indexOf("/"), c = path.slice(0, i), id = path.slice(i + 1);
    if (c === "pessoas") { const rows = chk(await membrosSel(cs => sb.from("membros").select(cs).eq("uid", id))); return rows && rows[0] ? linhaPessoa(rows[0])[1] : null }
    if (c === "mensagens") { const rows = chk(await sb.from("mensagens").select("*").eq("id", id)); return rows && rows[0] ? linhaMsg(rows[0])[1] : null }
    if (c === "erros") { const rows = chk(await sb.from("erros").select("*").eq("id", id)); return rows && rows[0] ? rows[0] : null }
    const rows = chk(await sb.from("docs").select("path,col,data,atualizado_em").eq("path", path));
    if (rows && rows[0]) viu(rows[0]);
    return rows && rows[0] ? rows[0].data : null;
  }
  async function lerCol(c, filtros) {
    let q;
    if (c === "pessoas") { let rows = chk(await membrosSel(cs => { let qq = sb.from("membros").select(cs); (filtros || []).forEach(([f, v]) => { qq = qq.eq(f, v) }); return qq })) || []; return rows.map(linhaPessoa).sort((x, y) => x[0] < y[0] ? -1 : 1) }
    if (c === "pessoas") q = null;
    else if (c === "mensagens") q = sb.from("mensagens").select("*");
    else if (c === "erros") q = sb.from("erros").select("*");
    else if (c === "amizades") q = sb.from("amizades").select("*");
    else q = sb.from("docs").select("path,data,atualizado_em").eq("col", c);
    (filtros || []).forEach(([f, v]) => { q = q.eq(f, v) });
    if (c === "mensagens") q = q.order("at", { ascending: false }).limit(MSG_MAX);
    if (c === "erros") q = q.order("at", { ascending: false }).limit(50);
    const rows = chk(await q) || [];
    const ord = a => a.sort((x, y) => x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0);
    if (c === "pessoas") return ord(rows.map(linhaPessoa));
    if (c === "mensagens") return rows.map(linhaMsg);
    if (c === "erros") return rows.map(r => [r.id, r]);
    if (c === "amizades") return ord(rows.map(linhaAmizade));
    rows.forEach(viu);
    return ord(rows.map(r => [r.path.slice(c.length + 1), r.data]));
  }

  /* ---------- escutas ----------
     Cada escuta tem: cheio() (lê tudo de novo), aplica(tabela, linha) -> true se resolveu sozinha. */
  const filtroOk = (filtros, row) => (filtros || []).every(([f, v]) => row && row[f] === v);
  function aplicarLinha(l, tabela, row) {
    if (l.tipo === "doc") {
      if (tabela !== "docs" || !row || row.path !== l.path) return true;
      if (!("data" in row)) return false;                       // linha grande demais veio sem os dados
      viu(row); l.poe(row.apagado ? null : row.data); return true;
    }
    const c = l.c;
    if (tabela === "amizades") return c === "amizades" ? false : true;   // tratado em mudouAmizade
    if (c === "pessoas") { if (tabela !== "membros") return true; if (!row || !row.uid) return false; const [id, d] = linhaPessoa(row); l.poeItem(id, row.apagado ? null : d); return true }
    if (c === "mensagens") {
      if (tabela !== "mensagens") return true; if (!row || !row.id) return false;
      if (!filtroOk(l.filtros, row)) return true;
      const [id, d] = linhaMsg(row); l.poeItem(id, row.apagado ? null : d); return true;
    }
    if (TAB[c]) return true;
    if (tabela !== "docs") return true;
    if (!row || !row.path) return false;
    if (row.col !== c && !row.path.startsWith(c + "/")) return true;
    if (!("data" in row)) return false;
    viu(row); l.poeItem(row.path.slice(c.length + 1), row.apagado ? null : row.data); return true;
  }
  function avisaLinha(tabela, row) {
    LIS.forEach(l => { if (!aplicarLinha(l, tabela, row)) l.agenda() });
  }

  function escuta(l, ler, monta, next, err) {
    let parado = false, t = 0, rodando = false, denovo = false, primeira = true, ultLeitura = null, ultDoc = null, sujo = false;
    l.estado = l.tipo === "doc" ? undefined : new Map();
    const entrega = () => {
      if (parado) return;
      const v = l.tipo === "doc" ? l.estado : [...l.estado.entries()];
      try { next(monta(v)) } catch (e) { console.error(e) }
    };
    let entT = 0; const entregaLogo = () => { clearTimeout(entT); entT = setTimeout(entrega, 40) };
    l.poe = (d) => { const k = JSON.stringify(d == null ? null : d); if (k === ultDoc) return; ultDoc = k; l.estado = d == null ? null : d; entregaLogo() };
    l.poeItem = (id, d) => {
      const ant = l.estado.get(id);
      if (d == null) { if (!l.estado.has(id)) return; l.estado.delete(id) }
      else { if (ant !== undefined && JSON.stringify(ant) === JSON.stringify(d)) return; l.estado.set(id, d) }
      if (l.c === "mensagens" && l.estado.size > MSG_MAX + 50) {   // mantém só as mais recentes
        const ord = [...l.estado.entries()].sort((a, b) => (b[1].at || 0) - (a[1].at || 0)); l.estado = new Map(ord.slice(0, MSG_MAX));
      }
      sujo = true; entregaLogo();
    };
    const roda = async () => {
      if (parado) return; if (rodando) { denovo = true; return } rodando = true;
      try {
        const v = await ler();
        if (!parado) {
          const k = JSON.stringify(v == null ? null : v);
          if (l.tipo === "doc") { if (k !== ultDoc || primeira) { ultDoc = k; l.estado = v == null ? null : v; entrega() } }
          else {
            const mudou = k !== ultLeitura;
            if (mudou || sujo || primeira) { l.estado = new Map(v); sujo = false; entrega(); if (mudou && !primeira && l.c === "amizades") mudouAmizade() }
            ultLeitura = k;
          }
          primeira = false;
        }
      }
      catch (e) { if (!parado && err) try { err(erro(e)) } catch (_) { } }
      rodando = false; if (denovo) { denovo = false; roda() }
    };
    l.agenda = () => { clearTimeout(t); t = setTimeout(roda, 150) };
    l.parar = () => { parado = true; clearTimeout(t); clearTimeout(entT) };
    LIS.add(l); roda();
    return () => { l.parar(); LIS.delete(l) };
  }

  /* ---------- releituras ---------- */
  let ultCheio = Date.now(), ultDelta = 0, deltaRodando = false;
  function cheioTodos() { ultCheio = Date.now(); LIS.forEach(l => l.agenda()) }
  let amzT = 0;
  function mudouAmizade() { clearTimeout(amzT); amzT = setTimeout(() => LIS.forEach(l => { if (!(l.tipo === "col" && l.c === "amizades")) l.agenda() }), 300) }
  function checaAmizade() { const a = [...LIS].filter(l => l.tipo === "col" && l.c === "amizades"); if (a.length) a.forEach(l => l.agenda()); else mudouAmizade() }
  async function delta() {
    if (deltaRodando || fechado) return; deltaRodando = true; ultDelta = Date.now();
    try {
      const temDocs = [...LIS].some(l => l.tipo === "doc" || !TAB[l.c]);
      if (temDocs) {
        const desde = new Date((marca || Date.now() - 10 * 60000) - 5000).toISOString();
        const cols = [...new Set([...LIS].map(l => l.tipo === "doc" ? l.c : l.c).filter(c => !TAB[c]))];
        const rows = chk(await sb.from("docs").select("path,col,data,atualizado_em").in("col", cols).gt("atualizado_em", desde).limit(500)) || [];
        if (rows.length >= 500) cheioTodos(); else rows.forEach(r => avisaLinha("docs", r));
      }
      // amizades: tabela pequena; se mudou, a escuta dela dispara a releitura do resto
      checaAmizade();
      // mensagens novas (só as recentes; as marcações de lida chegam pelo tempo real)
      if ([...LIS].some(l => l.c === "mensagens")) {
        const t0 = Date.now();
        const rows = chk(await sb.from("mensagens").select("*").gt("at", Date.now() - 6 * 3600000).order("at", { ascending: false }).limit(100)) || [];
        rows.forEach(r => avisaLinha("mensagens", r));
        // apagadas (mensagem ou reação trocada): o tempo real não manda exclusões; se alguma recente sumiu do servidor, relê a lista
        const ids = new Set(rows.map(r => String(r.id))), desde = rows.length >= 100 ? Math.min(...rows.map(r => +r.at || 0)) : Date.now() - 6 * 3600000, ate = t0 - 3000;
        [...LIS].filter(l => l.c === "mensagens" && l.estado instanceof Map).forEach(l => {
          for (const [id, d] of l.estado) { const at = +(d && d.at) || 0; if (at >= desde && at < ate && !ids.has(String(id))) { l.agenda(); break } }
        });
      }
    } catch (e) { }
    deltaRodando = false;
  }
  function atualizar(motivo) {
    if (fechado) return;
    if (Date.now() - ultCheio > CHEIO_MAX) return cheioTodos();
    if (Date.now() - ultDelta < 15000 && motivo !== "forcar") return;
    delta();
  }

  /* ---------- tempo real ---------- */
  let canal = null, tent = 0, reT = 0, caiu = false, fechado = false, ligado = false;
  const ecos = {};   // caminho -> hora do último evento recebido
  function liga() {
    if (!sb.channel || fechado) return;
    try { if (canal) sb.removeChannel(canal) } catch (e) { }
    const ch = sb.channel("prumo-" + Math.random().toString(36).slice(2, 8));
    ["docs", "mensagens", "membros", "amizades"].forEach(t => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, p => {
      if (fechado) return;
      if (t === "amizades") return checaAmizade();
      const row = p && (p.new && Object.keys(p.new).length ? p.new : null);
      if (row) { const k = row.path || row.id || row.uid; if (k) ecos[k] = Date.now() }
      avisaLinha(t, row);
    }));
    canal = ch;
    ch.subscribe(st => {
      if (ch !== canal) return;
      if (st === "SUBSCRIBED") { ligado = true; tent = 0; if (caiu) { caiu = false; atualizar("religou") } }
      else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT" || st === "CLOSED") {
        ligado = false; caiu = true; clearTimeout(reT); reT = setTimeout(liga, Math.min(60000, 2000 * 2 ** Math.min(tent++, 5)));
      }
    });
  }
  liga();
  let saiuEm = 0;
  const aoVoltar = () => {
    if (document.hidden) { saiuEm = Date.now(); return }
    const fora = saiuEm ? Date.now() - saiuEm : 0; saiuEm = 0;
    if (fora > FORA_LONGO) cheioTodos(); else if (fora > 20000) atualizar();
  };
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", aoVoltar);
  const poll = setInterval(() => { if (typeof document === "undefined" || !document.hidden) atualizar() }, POLL);

  /* depois de gravar: espera o eco; se não vier, relê só aquilo */
  function esperaEco(chave, reler) {
    const t0 = Date.now();
    setTimeout(async () => {
      if (fechado || (ecos[chave] || 0) >= t0) return;
      try { await reler() } catch (e) { }
    }, ligado ? ECO : 300);
  }
  const relerDoc = path => async () => {
    const rows = chk(await sb.from("docs").select("path,col,data,atualizado_em").eq("path", path)) || [];
    if (rows[0]) avisaLinha("docs", rows[0]); else avisaLinha("docs", { path, col: path.split("/")[0], data: null, apagado: true });
  };
  const relerMsg = id => async () => { const rows = chk(await sb.from("mensagens").select("*").eq("id", id)) || []; if (rows[0]) avisaLinha("mensagens", rows[0]) };

  /* ---------- referências ---------- */
  function doc(path) {
    const i = path.indexOf("/"), c = path.slice(0, i), id = path.slice(i + 1);
    return {
      id, path,
      async get() { return snapDoc(id, await lerDoc(path)) },
      async set(data) {
        if (c === "pessoas") {
          if (id !== uid) throw erro({ code: "42501" });
          const nome = String(data && data.nome || "").slice(0, 40);
          chk(await sb.from("membros").update({ nome }).eq("uid", uid));
          esperaEco(uid, async () => { const rows = chk(await sb.from("membros").select(COLS_M).eq("uid", uid)) || []; if (rows[0]) avisaLinha("membros", rows[0]) });
          return;
        }
        if (TAB[c]) throw erro({ message: "set não suportado em " + c });
        const corpo = clone(data) || {};
        chk(await sb.rpc("doc_gravar", { p_path: path, p_data: corpo }));
        avisaLinha("docs", { path, col: c, data: corpo });   // já sabemos como ficou
      },
      async update(patch) {
        if (c === "mensagens") { const p = pick(patch, ["lida"]); chk(await sb.from("mensagens").update(p).eq("id", id)); LIS.forEach(l => { if (l.c === "mensagens" && l.estado && l.estado.has(id)) l.poeItem(id, { ...l.estado.get(id), ...p }) }); return }
        if (c === "pessoas") return this.set(patch);
        if (TAB[c]) throw erro({ message: "update não suportado em " + c });
        chk(await sb.rpc("doc_mesclar", { p_path: path, p_patch: clone(patch) || {} }));
        esperaEco(path, relerDoc(path));
      },
      async delete() {
        if (c === "mensagens") { chk(await sb.from("mensagens").delete().eq("id", id)); avisaLinha("mensagens", { id, de: uid, apagado: true }); return }
        if (TAB[c]) throw erro({ message: "delete não suportado em " + c });
        chk(await sb.from("docs").delete().eq("path", path)); avisaLinha("docs", { path, col: c, data: null, apagado: true });
      },
      onSnapshot(next, err) { const l = { tipo: "doc", c, path }; return escuta(l, () => lerDoc(path), d => snapDoc(id, d), next, err) }
    };
  }
  function col(c, filtros) {
    return {
      id: c, path: c,
      where(f, op, v) { if (op !== "==") throw erro({ message: "só ==" }); return col(c, [...(filtros || []), [f, v]]) },
      doc(id) { return doc(c + "/" + id) },
      async get() { return snapCol(await lerCol(c, filtros)) },
      async add(data) {
        if (c === "mensagens") {
          const corpo = pick(data, MSG_CAMPOS);
          const r = chk(await sb.from("mensagens").insert(corpo).select("id")); const nid = r && r[0] && r[0].id;
          if (nid) { avisaLinha("mensagens", { id: nid, ...corpo }); esperaEco(nid, relerMsg(nid)) }
          return { id: nid };
        }
        if (c === "erros") {
          const r = chk(await sb.from("erros").insert(pick(data, ERRO_CAMPOS)).select("id"));
          LIS.forEach(l => { if (l.c === "erros") l.agenda() });
          return { id: r && r[0] && r[0].id };
        }
        throw erro({ message: "add não suportado em " + c });
      },
      onSnapshot(next, err) { const l = { tipo: "col", c, filtros }; return escuta(l, () => lerCol(c, filtros), snapCol, next, err) }
    };
  }
  async function rpc(nome, args) { const r = chk(await sb.rpc(nome, args || {})); if (/amizade|entrar/.test(nome)) checaAmizade(); return r }
  async function marcarLidas(de) {
    chk(await sb.from("mensagens").update({ lida: true }).eq("para", uid).eq("de", de).eq("lida", false));
    LIS.forEach(l => { if (l.c === "mensagens" && l.estado) [...l.estado.entries()].forEach(([id, m]) => { if (m.para === uid && m.de === de && !m.lida) l.poeItem(id, { ...m, lida: true }) }) });
  }
  function fechar() {
    fechado = true; clearInterval(poll); clearTimeout(reT); clearTimeout(amzT); LIS.forEach(l => l.parar && l.parar()); LIS.clear();
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", aoVoltar);
    const c = canal; canal = null; try { if (c) sb.removeChannel(c) } catch (e) { }
  }
  return { doc, collection: col, rpc, marcarLidas, fechar, recarregar: () => cheioTodos(), atualizar: () => atualizar("forcar") };
}
