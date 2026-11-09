// Banco de teste: Postgres de verdade (PGlite) com o SQL real e as regras de acesso,
// e um "supabase" falso dentro da página que manda cada consulta para cá.
// Uso:
//   const H = await require('./harness').criar();
//   const page = await H.pagina(browser, {email:'pedro@x', senha:'123456', viewport...});
//   await H.criarConta('pedro@x','123456') // opcional: já cria o login (sem ser membro)
const fs = require('fs');
const path = require('path');

const FAKE_PAGE = `
(function(){
  const LSK='sb-fake-session';
  const rt=[];let authCbs=[];
  const sess=()=>{try{return JSON.parse(localStorage.getItem(LSK)||'null')}catch(e){return null}};
  const call=(op)=>window.__sb(JSON.stringify({uid:(sess()||{}).user?.id||null,op})).then(r=>JSON.parse(r));
  function builder(table){
    const st={table,action:'select',cols:'*',filters:[],row:null,ret:false};
    const b={
      select(c){ if(st.action==='select'){st.cols=c||'*'} else {st.ret=true;st.retCols=c||'*'} return b},
      eq(f,v){st.filters.push([f,v]);return b},
      gt(f,v){(st.ops=st.ops||[]).push(['gt',f,v]);return b},
      lt(f,v){(st.ops=st.ops||[]).push(['lt',f,v]);return b},
      in(f,v){(st.ops=st.ops||[]).push(['in',f,v]);return b},
      order(f,o){st.order=[f,!(o&&o.ascending===false)];return b},
      limit(n){st.limit=n;return b},
      insert(row){st.action='insert';st.row=row;return b},
      update(row){st.action='update';st.row=row;return b},
      delete(){st.action='delete';return b},
      then(res,rej){return call({kind:'from',...st}).then(res,rej)}
    };return b}
  const blob2url=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(b)});
  const storage={from(bk){return {
    async upload(p,file,o){const d=await blob2url(file);const r=await call({kind:'st_up',path:bk+'/'+p,data:d});return r.error?{data:null,error:r.error}:{data:{path:p},error:null}},
    async createSignedUrls(ps,ttl){const r=await call({kind:'st_urls',paths:ps.map(p=>bk+'/'+p)});return {data:ps.map((p,i)=>({path:p,signedUrl:r.data[i],error:r.data[i]?null:'nao'})),error:null}},
    async remove(ps){await call({kind:'st_rm',paths:ps.map(p=>bk+'/'+p)});return {data:ps.map(p=>({name:p})),error:null}}}}};
  const client={
    storage,
    from:builder,
    rpc(name,args){return call({kind:'rpc',name,args})},
    channel(){const ch={hs:[],on(ev,f,h){ch.hs.push(h);return ch},subscribe(cb){rt.push(ch);setTimeout(()=>cb&&cb('SUBSCRIBED'),0);return ch}};return ch},
    removeChannel(ch){const i=rt.indexOf(ch);if(i>=0)rt.splice(i,1)},
    auth:{
      async getSession(){return {data:{session:sess()},error:null}},
      onAuthStateChange(cb){authCbs.push(cb);return {data:{subscription:{unsubscribe(){authCbs=authCbs.filter(x=>x!==cb)}}}}},
      async signInWithPassword({email,password}){const r=await call({kind:'login',email,password});if(r.error)return {data:{},error:r.error};const s={user:{id:r.data.id,email}};localStorage.setItem(LSK,JSON.stringify(s));authCbs.forEach(f=>f('SIGNED_IN',s));return {data:{session:s,user:s.user},error:null}},
      async signUp({email,password}){const r=await call({kind:'signup',email,password});if(r.error)return {data:{},error:r.error};const s={user:{id:r.data.id,email}};localStorage.setItem(LSK,JSON.stringify(s));authCbs.forEach(f=>f('SIGNED_IN',s));return {data:{session:s,user:s.user},error:null}},
      async signOut(){localStorage.removeItem(LSK);authCbs.forEach(f=>f('SIGNED_OUT',null));return {error:null}},
      async resetPasswordForEmail(){return {data:{},error:null}}
    }
  };
  window.__sbRT=(table,payload)=>{rt.forEach(ch=>ch.hs.forEach(h=>{try{h({table,...payload})}catch(e){}}))};
  window.__sbClient=client;
  window.supabase={createClient(){return client}};
})();`;

async function criar(opts = {}) {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users(id uuid primary key, email text unique, senha text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create role anon; create role authenticated;
    grant usage on schema public, auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create publication supabase_realtime;
    -- privilégios padrão do Supabase (tudo em public ganha GRANT ALL para anon e authenticated)
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on functions to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;`);
  await db.exec(fs.readFileSync(opts.sql || path.join(__dirname, 'prumo-supabase.sql'), 'utf8'));
  const pages = new Set();
  let fila = Promise.resolve();
  const log = [];
  const ident = s => { if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new Error('ident ' + s); return '"' + s + '"' };

  async function comoUsuario(uid, fn) {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
    try { return await fn() } finally { await db.exec('reset role') }
  }
  async function exec(uid, op) {
    if (op.kind === 'signup') {
      const r = await db.query(`select id from auth.users where email=$1`, [op.email]);
      if (r.rows.length) return { error: { message: 'User already registered', code: 'user_already_exists' } };
      const id = (await db.query(`insert into auth.users(id,email,senha) values (gen_random_uuid(),$1,$2) returning id`, [op.email, op.password])).rows[0].id;
      return { data: { id } };
    }
    if (op.kind === 'login') {
      const r = await db.query(`select id from auth.users where email=$1 and senha=$2`, [op.email, op.password]);
      if (!r.rows.length) return { error: { message: 'Invalid login credentials', code: 'invalid_credentials' } };
      return { data: { id: r.rows[0].id } };
    }
    if (op.kind === 'rpc') {
      op._t0 = (await db.query(`select clock_timestamp() t`)).rows[0].t;
      const args = op.args || {}; const ks = Object.keys(args);
      const rs = (await db.query(`select proretset from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname=$1`, [op.name])).rows[0];
      const call = `${ident(op.name)}(${ks.map((k, i) => `${ident(k)} => $${i + 1}`).join(',')})`;
      if (rs && rs.proretset) { const r = await comoUsuario(uid, () => db.query(`select * from ${call}`, ks.map(k => args[k]))); return { data: JSON.parse(JSON.stringify(r.rows)), write: true } }
      const r = await comoUsuario(uid, () => db.query(`select ${call} as r`, ks.map(k => args[k])));
      return { data: r.rows[0] ? r.rows[0].r : null, write: true };
    }
    const t = ident(op.table);
    const conds = op.filters.map(([f], i) => `${ident(f)} = $${i + 1}`);
    const vals = op.filters.map(([, v]) => v);
    (op.ops || []).forEach(([k, f, v]) => { vals.push(v); conds.push(k === 'gt' ? `${ident(f)} > $${vals.length}` : k === 'lt' ? `${ident(f)} < $${vals.length}` : `${ident(f)} = any($${vals.length})`) });
    const where = conds.join(' and ');
    const tail = (op.order ? ` order by ${ident(op.order[0])} ${op.order[1] ? 'asc' : 'desc'}` : '') + (op.limit ? ` limit ${+op.limit}` : '');
    const cols = c => (c === '*' ? '*' : c.split(',').map(x => ident(x.trim())).join(','));
    if (op.action === 'select') {
      const r = await comoUsuario(uid, () => db.query(`select ${cols(op.cols)} from public.${t}${where ? ' where ' + where : ''}${tail}`, vals));
      return { data: r.rows };
    }
    if (op.action === 'insert') {
      const rows = Array.isArray(op.row) ? op.row : [op.row]; const out = [];
      for (const row of rows) {
        const ks = Object.keys(row);
        const r = await comoUsuario(uid, () => db.query(`insert into public.${t}(${ks.map(ident).join(',')}) values (${ks.map((_, i) => '$' + (i + 1)).join(',')}) returning ${op.ret ? cols(op.retCols) : '*'}`, ks.map(k => row[k])));
        out.push(...r.rows);
        const k = await comoUsuario(uid, () => db.query(`select * from public.${t} where ${t === '"membros"' ? 'uid' : 'id'} = $1`, [r.rows[0] && (r.rows[0].id || r.rows[0].uid)]).catch(() => ({ rows: [] })));
        (op._linhas = op._linhas || []).push(...k.rows);
      }
      return { data: op.ret ? out : null, write: true, linhas: op._linhas || [] };
    }
    if (op.action === 'update') {
      const ks = Object.keys(op.row); const n = ks.length;
      const w = op.filters.map(([f], i) => `${ident(f)} = $${n + i + 1}`).join(' and ');
      const r = await comoUsuario(uid, () => db.query(`update public.${t} set ${ks.map((k, i) => `${ident(k)} = $${i + 1}`).join(',')}${w ? ' where ' + w : ''} returning *`, [...ks.map(k => op.row[k]), ...vals]));
      return { data: op.ret ? r.rows : null, write: true, linhas: r.rows };
    }
    if (op.action === 'delete') {
      await comoUsuario(uid, () => db.query(`delete from public.${t}${where ? ' where ' + where : ''}`, vals));
      return { data: null, write: true };
    }
    return { error: { message: 'op desconhecida' } };
  }
  const ST = new Map();
  async function tratar(json) {
    const { uid, op } = JSON.parse(json);
    if (op.kind === 'st_up') { if (!uid) return JSON.stringify({ data: null, error: { message: 'sem login' } }); if (op.path.split('/')[1] !== uid) return JSON.stringify({ data: null, error: { message: 'pasta de outro', code: '42501' } }); ST.set(op.path, op.data); return JSON.stringify({ data: { path: op.path }, error: null }) }
    if (op.kind === 'st_urls') return JSON.stringify({ data: op.paths.map(p => ST.get(p) || null), error: null });
    if (op.kind === 'st_rm') { op.paths.forEach(p => { if (p.split('/')[1] === uid) ST.delete(p) }); return JSON.stringify({ data: [], error: null }) }
    const res = await (fila = fila.then(() => exec(uid, op).catch(e => ({ error: { message: e.message, code: e.code } }))));
    if (opts.contar) opts.contar(op, res, uid);
    log.push({ uid, op: op.kind + ':' + (op.table || op.name || '') + ':' + (op.action || ''), err: res.error && res.error.message });
    if (res.write && !res.error && !(op.kind === 'from' && op.action === 'delete' && op.table !== 'pub_reacoes') && !opts.semRT) {
      const tabela = op.kind === 'rpc' ? (/^doc_/.test(op.name) ? 'docs' : /amizade|entrar|excluir/.test(op.name) ? 'amizades' : 'docs') : op.table;
      let chaves = [];
      if (tabela === 'docs' && op.kind === 'rpc' && op.args && op.args.p_path) chaves = [['path', op.args.p_path]];
      else if (op.kind === 'rpc' && op._t0) chaves = (await db.query(`select path from public.docs where atualizado_em >= $1`, [op._t0])).rows.map(r => ['path', r.path]);
      else if (tabela === 'mensagens' || tabela === 'membros' || tabela === 'publicacoes') chaves = (res.linhas || []).map(r => tabela === 'membros' ? ['uid', r.uid] : ['id', r.id]);
      if (op.kind === 'rpc' && /^admin_|^doc_/.test(op.name) && tabela === 'amizades') { }
      setTimeout(() => pages.forEach(async pg => {
        try {
          const quem = await pg.evaluate(() => { try { return (JSON.parse(localStorage.getItem('sb-fake-session') || 'null') || {}).user?.id || null } catch (e) { return null } });
          if (!quem) return;
          if (tabela === 'amizades') return pg.evaluate(([a]) => window.__sbRT && window.__sbRT(a, {}), [tabela]);
          if (tabela === 'pub_reacoes') return pg.evaluate(([a]) => window.__sbRT && window.__sbRT(a, { new: {} }), [tabela]);
          for (const [k, v] of chaves) {
            const rr = await (fila = fila.then(() => comoUsuario(quem, () => db.query(`select * from public.${ident(tabela)} where ${ident(k)} = $1`, [v])).catch(() => ({ rows: [] }))));
            if (rr.rows[0]) await pg.evaluate(([a, b]) => window.__sbRT && window.__sbRT(a, b), [tabela, { new: JSON.parse(JSON.stringify(rr.rows[0])) }]);
          }
        } catch (e) { }
      }), opts.atraso || 30);
    }
    return JSON.stringify({ data: res.data === undefined ? null : res.data, error: res.error || null });
  }

  async function pagina(browser, o = {}) {
    const ctx = await browser.newContext({ viewport: o.viewport || { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 1, colorScheme: o.dark ? 'dark' : 'light', ...(o.ctx || {}) });  // o.ctx: opções extras do contexto (ex.: aparelho do Playwright)
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* fake */' }));
    await ctx.exposeFunction('__sb', tratar);
    await ctx.addInitScript(FAKE_PAGE);
    if (o.sessao) await ctx.addInitScript(s => { localStorage.setItem('sb-fake-session', s) }, JSON.stringify(o.sessao));
    const page = await ctx.newPage();
    pages.add(page); page.on('close', () => pages.delete(page));
    return page;
  }
  // a mesma fila das chamadas da página (para o teste mandar uma chamada "de fora", ex.: um fetch interceptado)
  function naFila(uid, op) { return (fila = fila.then(() => exec(uid, op).catch(e => ({ error: { message: e.message, code: e.code } })))) }
  async function criarConta(email, senha) { const r = await exec(null, { kind: 'signup', email, password: senha }); return r.data.id }
  async function sql(q, p) { return (await db.query(q, p)).rows }
  return { db, pagina, criarConta, sql, log, comoUsuario, exec, naFila, ST };
}
module.exports = { criar };
