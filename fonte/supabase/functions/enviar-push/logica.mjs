// Prumo News · enviar-push — a parte "pura" da função (sem rede, sem banco): agrupar avisos, montar o que aparece
// no celular, converter as chaves VAPID e achar atualizações de coberturas. Testada no Node (review2/t_push_logica.js).
// JavaScript simples de propósito: o Deno (Supabase) e o Node importam o mesmo arquivo.

export const TIPOS = ["mensagens", "amizades", "comentarios", "mencoes", "curtidas", "reposts", "seguidores", "seguindo", "coberturas", "colunas"];
export const AGRUPA_MS = 2 * 60 * 1000;   // no máximo 1 aviso por tipo e por conversa/post a cada 2 minutos

/** o aparelho quer este tipo? (tudo desligado até a pessoa ligar) */
export function querTipo(prefs, tipo) {
  return !!prefs && typeof prefs === "object" && prefs[tipo] === true;
}

const chaveDe = l => `${l.para}|${l.tipo}|${l.chave || ""}`;
const ms = t => { const n = typeof t === "number" ? t : Date.parse(t || ""); return isNaN(n) ? 0 : n };

/**
 * Junta os avisos pendentes por (pessoa, tipo, conversa/post).
 * Se já saiu um aviso do mesmo grupo há menos de 2 minutos, os novos ficam "agrupados" (não toca de novo:
 * a notificação que já está na tela tem a mesma etiqueta e a pessoa vê tudo ao abrir o app).
 * @param {Array<{id:number,para:string,tipo:string,chave:string,titulo:string,corpo:string,url:string,de?:string|null,criado_em:string}>} linhas
 * @param {Array<{para:string,tipo:string,chave:string,enviado_em:string}>} recentes avisos já enviados nos últimos minutos
 * @returns {{grupos:Array<{para:string,tipo:string,chave:string,linhas:Array,ids:number[]}>,agrupados:number[]}}
 */
export function agrupar(linhas, recentes, agora = Date.now()) {
  const ult = new Map();
  (recentes || []).forEach(r => { const t = ms(r.enviado_em); if (t && agora - t < AGRUPA_MS) ult.set(chaveDe(r), Math.max(ult.get(chaveDe(r)) || 0, t)) });
  const grupos = new Map(), agrupados = [];
  [...(linhas || [])].sort((a, b) => ms(a.criado_em) - ms(b.criado_em) || a.id - b.id).forEach(l => {
    const k = chaveDe(l);
    if (ult.has(k)) { agrupados.push(l.id); return }
    if (!grupos.has(k)) grupos.set(k, { para: l.para, tipo: l.tipo, chave: l.chave || "", linhas: [], ids: [] });
    const g = grupos.get(k); g.linhas.push(l); g.ids.push(l.id);
  });
  return { grupos: [...grupos.values()], agrupados };
}

/** corta em n caracteres de verdade (por ponto de código: nunca parte um emoji ou acento ao meio) */
export function corta(t, n) {
  const cs = Array.from(String(t || "").trim());
  if (cs.length <= n) return cs.join("");
  let s = cs.slice(0, Math.max(0, n - 1)).join("");
  // não deixa sobrar um modificador solto (variação de emoji, junção ZWJ, tom de pele) no fim
  s = s.replace(/[\u200d\ufe0f\u{1f3fb}-\u{1f3ff}]+$/u, "");
  return s.trimEnd() + "…";
}
const bytes = s => new TextEncoder().encode(s).length;
/** o aviso todo cabe com folga no limite do Web Push (4 KB depois de cifrado): texto em no máximo 3.000 bytes */
export const PAYLOAD_MAX = 3000;

/**
 * O que aparece no celular para um grupo. A etiqueta (tag) é a mesma para o mesmo grupo:
 * um aviso novo substitui o anterior em vez de empilhar.
 * @param {{tipo:string,chave:string,linhas:Array}} g
 * @param {number|null} badge número para o ícone do app (mensagens não lidas), ou null
 */
export function montarPayload(g, badge = null) {
  const ls = g.linhas || [], ult = ls[ls.length - 1] || {}, n = ls.length;
  const pessoas = new Set(ls.map(l => l.de).filter(Boolean)).size;
  const title = ult.titulo || "Prumo News";
  let body = ult.corpo || "";
  if (n > 1) {
    if (g.tipo === "mensagens") body = `${n} mensagens novas: ${body || "…"}`;
    else if (pessoas > 1) body = (body ? body + " · " : "") + `e mais ${pessoas - 1} ${pessoas - 1 === 1 ? "pessoa" : "pessoas"}`;
    else body = (body ? body + " · " : "") + `${n} avisos`;
  }
  const p = {
    title: corta(title, 80),
    body: corta(body, 180),
    tag: corta(`${g.tipo}:${g.chave || ""}`, 64),
    url: typeof ult.url === "string" && /^(\?nt=[\w:.\-]{1,120}|\.\/)$/.test(ult.url) ? ult.url : "./",
    tipo: g.tipo,
    icon: "icon-192.png",
    at: ms(ult.criado_em) || Date.now(),
  };
  if (typeof badge === "number" && badge >= 0) p.badge = Math.min(99, Math.floor(badge));
  // muito emoji ou letra de 4 bytes: encurta o texto (e, se preciso, o título) até caber
  for (let n = 170; bytes(JSON.stringify(p)) > PAYLOAD_MAX && n > 0; n -= 20) p.body = corta(body, n);
  for (let n = 70; bytes(JSON.stringify(p)) > PAYLOAD_MAX && n > 0; n -= 10) p.title = corta(title, n);
  return p;
}

// ---------- chaves VAPID: as do "npx web-push generate-vapid-keys", em base64url "cru" (o mesmo formato que a biblioteca usa)
function b64uLen(s) {
  s = String(s || "").trim();
  if (!/^[A-Za-z0-9_-]+$/.test(s)) return -1;
  return Math.floor(s.length * 3 / 4);
}
/** confere o formato das chaves antes de tentar enviar (mensagem clara no log em vez de erro de criptografia) */
export function validarVapid(publica, privada, contato) {
  if (b64uLen(publica) !== 65) return "VAPID_PUBLIC inválida: use a 'Public Key' do web-push (87 caracteres)";
  if (b64uLen(privada) !== 32) return "VAPID_PRIVATE inválida: use a 'Private Key' do web-push (43 caracteres)";
  if (!/^(mailto:|https:\/\/)/.test(String(contato || ""))) return "VAPID_SUBJECT inválido: use mailto:seu-email@exemplo.com";
  return "";
}

/**
 * O endereço do aparelho é de um serviço de push conhecido? (Chrome/Android/Edge/Samsung/Opera: Google; Firefox: Mozilla;
 * Safari e iPhone: Apple; Windows: WNS). Outro endereço não recebe nada: a função não faz pedido para servidor qualquer.
 */
export const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^(updates|[\w-]+)\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/, /^[\w-]+\.push\.apple\.com$/, /^[\w-]+\.notify\.windows\.com$/];
export function endpointOk(ep) {
  try { const u = new URL(String(ep || "")); return u.protocol === "https:" && !u.port && PUSH_HOSTS.some(r => r.test(u.hostname)) } catch (e) { return false }
}

/**
 * Envia um aviso para um aparelho. A biblioteca (buildPushPayload) e o fetch vêm de fora, para dar para testar sem rede.
 * @returns {Promise<{ok:boolean,status:number,sumiu:boolean}>} sumiu = o aparelho não existe mais (404/410): apagar a inscrição
 */
export async function enviarUm(buildPushPayload, fetchFn, insc, texto, vapid, ttl = 24 * 3600) {
  const sub = { endpoint: insc.endpoint, expirationTime: null, keys: { p256dh: insc.p256dh, auth: insc.auth } };
  const req = await buildPushPayload({ data: texto, options: { ttl } }, sub, vapid);
  const res = await fetchFn(insc.endpoint, req);
  const status = res && typeof res.status === "number" ? res.status : 0;
  return { ok: status >= 200 && status < 300, status, sumiu: status === 404 || status === 410 };
}

// ---------- coberturas seguidas (o app guarda em prefs.seguindo, com a chave = tema sem acento e minúsculo)
export const normTema = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Atualizações de coberturas mais novas que a marca (a última vez que a função olhou), no máximo 3 dias.
 * @returns {Array<{pid:string,tema:string,chave:string,texto:string,at:number}>}
 */
export function coberturasNovas(feed, marca, agora = Date.now()) {
  const out = [];
  ((feed && feed.pautas) || []).forEach(p => {
    const tema = p && (p.tema || p.tag); if (!tema || !p.id) return;
    const ups = (p.atualizacoes || []).filter(u => u && u.texto && ms(u.hora) > marca && ms(u.hora) > agora - 3 * 864e5 && ms(u.hora) <= agora + 600e3)
      .sort((a, b) => ms(b.hora) - ms(a.hora));
    if (!ups.length) return;
    out.push({ pid: String(p.id), tema: String(tema), chave: normTema(tema), texto: String(ups[0].texto), at: ms(ups[0].hora), n: ups.length });
  });
  return out;
}
/** quem segue a cobertura: docs "data/users/<uid>/prefs" com data.seguindo[chave] */
export function quemSegue(docsPrefs, chave) {
  const us = [];
  (docsPrefs || []).forEach(d => { const s = d && d.data && d.data.seguindo; if (d && d.owner && s && typeof s === "object" && s[chave]) us.push(d.owner) });
  return us;
}
/** o aviso de cobertura, no formato da fila */
export function avisoCobertura(c) {
  return {
    p_tipo: "coberturas", p_chave: "cob:" + c.pid,
    p_titulo: `${c.tema}: ${c.n > 1 ? c.n + " atualizações" : "nova atualização"}`,
    p_corpo: c.texto, p_url: "?nt=cobertura:" + c.pid,
  };
}
