// Prumo News · enviar-newsletter — a parte "pura" da função (sem rede, sem banco): limpar o HTML da coluna, montar os
// e-mails (confirmação e coluna, no mesmo formato do "Exportar › E-mail" do app, js/133), dividir em lotes, falar com
// o Resend e decidir o que fazer com cada resultado. Testada no Node (review2/t_colunas_publicas.js, com o Resend falso).
// JavaScript simples de propósito: o Deno (Supabase) e o Node importam o mesmo arquivo. Nada de lookbehind.

export const SITE_PADRAO = "https://prumonews.com.br";
export const LOTE = 100;                 // o Resend aceita até 100 e-mails por chamada em /emails/batch
export const MAX_TENTATIVAS = 3;
export const ESPERA_PAGINA_MS = 3 * 3600e3;   // até 3 h esperando o robô publicar a página; depois manda mesmo assim
export const RESEND_URL = "https://api.resend.com/emails/batch";

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’" };
export function desfaz(s) {
  return String(s == null ? "" : s).replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z]{2,8});/gi, (m, k) => {
    if (k[0] === "#") { const n = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
      return n > 0 && n < 0x110000 && !(n >= 0xd800 && n < 0xe000) ? String.fromCodePoint(n) : "" }
    const v = ENT[k.toLowerCase()]; return v === undefined ? m : v;
  });
}
export const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** endereço de link aceito: só https (como o edUrlOk do app) */
export function urlOk(u) {
  try { const x = new URL(String(u || "").trim()); return x.protocol === "https:" ? x.href : "" } catch (e) { return "" }
}

// ---------- HTML da coluna: a mesma lista branca do app (js/132) ----------
const FORA = "script|style|iframe|object|embed|template|noscript|svg|math|textarea|select|title|head|button|form|canvas|video|audio|picture|figure|dialog|xml";
const RE_FORA = new RegExp(`<(${FORA})\\b[\\s\\S]*?<\\/\\1\\s*>`, "gi");
const BLOCOS = new Set(["p", "h2", "h3", "blockquote", "ul", "ol", "li", "hr"]);
const INLINE = new Set(["strong", "em", "a", "br"]);
const TROCA = { b: "strong", i: "em", h1: "h2", h4: "h3", h5: "h3", h6: "h3" };

/**
 * Limpa o HTML guardado (nunca confia no banco): só p, h2, h3, citação, listas, separador, negrito, itálico, link https
 * e quebra de linha. Fotos e gráficos (figure) saem, como no e-mail do app. Atributos: só o href do link.
 * @returns {string}
 */
export function limparHtml(html) {
  let s = String(html || "").slice(0, 60000).replace(/<!--[\s\S]*?-->/g, "").replace(RE_FORA, "");
  s = s.replace(new RegExp(`<\\/?(?:${FORA})\\b[^>]*>`, "gi"), "");
  const out = [], pilha = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|</g; let m;
  const fecha = t => { const i = pilha.lastIndexOf(t); if (i < 0) return; while (pilha.length > i) out.push(`</${pilha.pop()}>`) };
  while ((m = re.exec(s))) {
    if (m[4] !== undefined || m[0] === "<") { const t = m[4] !== undefined ? m[4] : "<"; out.push(esc(desfaz(t).replace(/[\s ]+/g, " "))); continue }
    let t = m[2].toLowerCase(); t = TROCA[t] || t; const fim = m[1] === "/";
    if (!BLOCOS.has(t) && !INLINE.has(t)) continue;
    if (t === "br") { if (!fim) out.push("<br>"); continue }
    if (t === "hr") { if (!fim) { while (pilha.length) out.push(`</${pilha.pop()}>`); out.push("<hr>") } continue }
    if (fim) { fecha(t); continue }
    if (BLOCOS.has(t) && t !== "li" && t !== "p") { while (pilha.length && pilha[pilha.length - 1] !== "blockquote") out.push(`</${pilha.pop()}>`) }
    if (t === "p" || t === "li") { if (pilha.length && pilha[pilha.length - 1] === t) out.push(`</${pilha.pop()}>`) }
    if (t === "a") {
      const h = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[3] || ""); const u = h ? urlOk(desfaz(h[1] || h[2] || h[3] || "")) : "";
      if (!u) continue; out.push(`<a href="${esc(u)}">`); pilha.push("a"); continue;
    }
    out.push(`<${t}>`); pilha.push(t);
  }
  while (pilha.length) out.push(`</${pilha.pop()}>`);
  // blocos vazios saem
  return out.join("").replace(/<(p|h2|h3|li|strong|em)>(?:\s|<br>)*<\/\1>/g, "").replace(/<(ul|ol|blockquote)>\s*<\/\1>/g, "").trim();
}

/** texto puro (para a parte "text" do e-mail) */
export function textoDe(html) {
  return desfaz(String(html || "").replace(/<li>/g, "• ").replace(/<br>/g, "\n").replace(/<hr>/g, "\n———\n")
    .replace(/<\/(p|h2|h3|li|blockquote|ul|ol)>/g, "\n\n").replace(/<[^>]*>/g, ""))
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// o estilo de cada parte, igual ao ex133Email (js/133)
const ESTILO = {
  p: "margin:0 0 16px;font-size:17px;line-height:1.6;color:#1f2937",
  h2: "margin:28px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.25;color:#14213a",
  h3: "margin:22px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:1.3;color:#14213a",
  blockquote: "margin:20px 0;padding:4px 0 4px 16px;border-left:3px solid #c9822b;font-style:italic;color:#374151",
  bqp: "margin:0 0 8px;font-size:19px;line-height:1.5;color:#374151",
  ul: "margin:0 0 16px;padding-left:24px;font-size:17px;line-height:1.6;color:#1f2937",
  li: "margin:0 0 6px",
  a: "color:#24406b;text-decoration:underline",
  hr: "border:0;border-top:1px solid #d1d5db;margin:28px auto;width:40%",
};
ESTILO.ol = ESTILO.ul;
/** põe o estilo inline em cada parte do HTML já limpo */
export function comEstilo(limpo) {
  let dentro = 0;
  return String(limpo).replace(/<(\/?)(p|h2|h3|blockquote|ul|ol|li|a|hr)\b([^>]*)>/g, (m, f, t, resto) => {
    if (t === "blockquote") { dentro += f ? -1 : 1; if (f) return m }
    if (f) return m;
    const st = t === "p" && dentro > 0 ? ESTILO.bqp : ESTILO[t];
    return `<${t}${resto} style="${st}">`;
  });
}

// ---------- endereços ----------
export function slug(s) {
  const t = String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, 60).replace(/-+$/g, "") || "coluna";
}
/** o nome da página pública (o robô tools/colunas_publicas.py usa a mesma regra) */
export const arquivoDe = c => `${slug(c && c.tit)}-${String(c && c.id || "").replace(/[^0-9a-f]/gi, "").slice(0, 8).toLowerCase()}.html`;
export const siteDe = s => (urlOk(s) || SITE_PADRAO).replace(/\/+$/, "");
export const urlPagina = (site, c) => `${siteDe(site)}/c/${arquivoDe(c)}`;
export const urlConfirmar = (site, token) => `${siteDe(site)}/c/assinatura.html?confirmar=${encodeURIComponent(token)}`;
export const urlCancelar = (site, token) => `${siteDe(site)}/c/assinatura.html?cancelar=${encodeURIComponent(token)}`;

/** remetente: "Nome <email@dominio>" ou só o e-mail */
export function remetenteOk(r) {
  return /^(?:[^<>\r\n"]{1,80} <[^<>\s@]+@[^<>\s@]+\.[a-z]{2,24}>|[^<>\s@]+@[^<>\s@]+\.[a-z]{2,24})$/i.test(String(r || "").trim());
}
/** os cabeçalhos de todo e-mail: List-Unsubscribe aponta para o link de cancelar (e para um e-mail, se houver) */
export function cabecalhos(cancelar, mailto) {
  const l = [`<${cancelar}>`]; if (mailto && /^[^@\s<>]+@[^@\s<>]+$/.test(mailto)) l.push(`<mailto:${mailto}?subject=cancelar>`);
  return { "List-Unsubscribe": l.join(", ") };
}

const RODAPE = (cancelar, nome) => `<p style="margin:28px 0 0;font:13px/1.5 Arial,Helvetica,sans-serif;color:#6b7280">Você recebe este e-mail porque assinou as colunas de ${esc(nome)} no Prumo. Seu e-mail serve só para isso.<br><a href="${esc(cancelar)}" style="color:#6b7280;text-decoration:underline">Cancelar a assinatura</a> (um toque, sem senha).</p>`;
const DOC = (tit, corpo) => `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(tit)}</title></head><body style="margin:0;padding:24px 16px;background:#ffffff">${corpo}</body></html>\n`;

/** e-mail de confirmação (o primeiro dos dois passos) */
export function emailConfirmacao({ nome, token, site }) {
  const ok = urlConfirmar(site, token), cx = urlCancelar(site, token), n = String(nome || "a autora");
  const subject = `Confirme: colunas de ${n} no Prumo`;
  const corpo = `<div style="max-width:560px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#1f2937"><p style="margin:0 0 6px;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a5a17">Prumo</p><h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:#14213a">Falta só confirmar</h1><p style="margin:0 0 18px;font-size:17px;line-height:1.6">Recebemos um pedido para mandar a este e-mail as colunas de ${esc(n)} no Prumo, quando saírem.</p><p style="margin:0 0 22px"><a href="${esc(ok)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#14213a;color:#ffffff;font:700 16px Arial,Helvetica,sans-serif;text-decoration:none">Confirmar a assinatura</a></p><p style="margin:0 0 8px;font:14px/1.5 Arial,Helvetica,sans-serif;color:#4b5563">Se não foi você, ignore este e-mail: sem confirmar, você não recebe nada. O link vale por 7 dias.</p>${RODAPE(cx, n)}</div>`;
  const text = `Falta só confirmar\n\nRecebemos um pedido para mandar a este e-mail as colunas de ${n} no Prumo.\n\nConfirmar: ${ok}\n\nSe não foi você, ignore este e-mail: sem confirmar, você não recebe nada.\n\nCancelar: ${cx}`;
  return { subject, html: DOC(subject, corpo), text, headers: cabecalhos(cx) };
}

/**
 * E-mail da coluna: o mesmo HTML do "Exportar › E-mail" (título, linha fina, "Por Nome", texto com estilo inline,
 * assinatura), mais "Leia a coluna completa: <link>" e o rodapé com o cancelar.
 * @param {{id:string,tit:string,linha?:string,corpo:string,formato?:string,autora:{nome:string}}} c  (de coluna_publica())
 */
export function emailColuna(c, { token, site, mailto } = {}) {
  const nome = String(c && c.autora && c.autora.nome || "Autora").trim() || "Autora", tit = String(c.tit || "Coluna"), linha = String(c.linha || "");
  const url = urlPagina(site, c), cx = urlCancelar(site, token);
  const limpo = c.formato === "h" ? limparHtml(c.corpo) : limparHtml(String(c.corpo || "").split(/\n+/).map(s => s.trim()).filter(Boolean)
    .map(s => /^## /.test(s) ? `<h2>${esc(s.slice(3))}</h2>` : /^> /.test(s) ? `<blockquote><p>${esc(s.slice(2))}</p></blockquote>` : `<p>${esc(s)}</p>`).join(""));
  const ass = `— ${nome}, publicado originalmente no Prumo`;
  const art = `<div style="max-width:640px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#1f2937"><p style="margin:0 0 6px;font:700 12px Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a5a17">Coluna</p><h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;color:#14213a">${esc(tit)}</h1>${linha ? `<p style="margin:0 0 14px;font-size:19px;line-height:1.45;color:#4b5563">${esc(linha)}</p>` : ""}<p style="margin:0 0 24px;font:600 14px Arial,Helvetica,sans-serif;color:#6b7280">Por ${esc(nome)}</p>${comEstilo(limpo)}<p style="margin:24px 0 0;font-size:17px;line-height:1.6;color:#1f2937">Leia a coluna completa: <a href="${esc(url)}" style="color:#24406b;text-decoration:underline">${esc(url)}</a></p><p style="margin:28px 0 0;padding-top:14px;border-top:1px solid #e5e7eb;font-style:italic;font-size:16px;color:#4b5563">${esc(ass)}</p>${RODAPE(cx, nome)}</div>`;
  const text = [tit, linha, `Por ${nome}`, textoDe(limpo), `Leia a coluna completa: ${url}`, ass, `Cancelar a assinatura: ${cx}`].filter(Boolean).join("\n\n");
  return { subject: tit, html: DOC(tit, art), text, headers: cabecalhos(cx, mailto), url };
}

/** divide em lotes de até n */
export function lotes(l, n = LOTE) { const out = []; for (let i = 0; i < (l || []).length; i += n) out.push(l.slice(i, i + n)); return out }

/**
 * Manda um lote pelo Resend (POST /emails/batch). fetch vem de fora (teste sem rede).
 * @param {Array<{to:string,subject:string,html:string,text:string,headers:object}>} msgs
 * @returns {Promise<{ok:boolean,status:number,ids:string[],erro:string}>}
 */
export async function enviarLote(fetchFn, chave, remetente, msgs) {
  const corpo = msgs.map(m => ({ from: remetente, to: [m.to], subject: m.subject, html: m.html, text: m.text, headers: m.headers }));
  let res, j = null;
  try { res = await fetchFn(RESEND_URL, { method: "POST", headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" }, body: JSON.stringify(corpo) }) }
  catch (e) { return { ok: false, status: 0, ids: [], erro: ("rede: " + String(e && e.message || e)).slice(0, 300) } }
  const status = res && typeof res.status === "number" ? res.status : 0;
  try { j = await res.json() } catch (e) { j = null }
  if (status >= 200 && status < 300) {
    const ids = (j && Array.isArray(j.data) ? j.data : []).map(d => String(d && d.id || ""));
    return { ok: true, status, ids, erro: "" };
  }
  const msg = j && (j.message || j.error || j.name) ? String(j.message || j.error || j.name) : "resposta " + status;
  return { ok: false, status, ids: [], erro: `Resend ${status}: ${msg}`.slice(0, 300) };
}

/**
 * O que fazer com uma linha que não saiu: tentar de novo mais tarde (erro passageiro: rede, 429 ou 5xx, até 3 vezes)
 * ou desistir (erro do pedido: 4xx, chave errada, domínio não verificado).
 */
export function depoisDoErro(tentativas, status, agora = Date.now()) {
  const t = (tentativas || 0) + 1, passageiro = status === 0 || status === 429 || status >= 500;
  if (passageiro && t < MAX_TENTATIVAS) return { estado: "pendente", tentativas: t, liberar_em: new Date(agora + t * 15 * 60e3).toISOString() };
  return { estado: "falhou", tentativas: t, liberar_em: null };
}

/** a página já está no ar? se não está e a coluna é recente, espera mais; depois de 3 h, manda mesmo assim */
export function esperaPagina(paginaNoAr, publicadaEm, agora = Date.now()) {
  if (paginaNoAr) return false;
  return agora - (+publicadaEm || 0) < ESPERA_PAGINA_MS;
}
