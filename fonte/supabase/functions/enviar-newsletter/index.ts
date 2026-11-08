// Prumo News · função "enviar-newsletter" (Supabase Edge Function, Deno).
// Lê a fila public.newsletter_fila (preenchida pelo sql/publicacoes-v14.sql) e manda os e-mails pelo Resend, em lotes:
//   - confirmação (o primeiro dos dois passos de quem assina);
//   - coluna pública nova, para cada assinante confirmado da autora (o mesmo HTML do "Exportar › E-mail" do app,
//     com o link da página pública, o link de cancelar e o cabeçalho List-Unsubscribe).
// Cada linha da fila fica com o resultado: enviado (com o id do Resend), falhou (com o erro) ou cancelado.
//
// Segredos (só no painel do Supabase › Edge Functions › Secrets, NUNCA no repositório):
//   RESEND_API_KEY        a chave do Resend (começa com re_)
//   NEWSLETTER_REMETENTE  quem manda, ex.: Prumo <colunas@prumonews.com.br> (domínio verificado no Resend)
// Opcionais: NEWSLETTER_SITE (padrão https://prumonews.com.br) e NEWSLETTER_RESPONDER (um e-mail para o
//   List-Unsubscribe por e-mail, além do link). O Supabase já entrega SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
//
// Chamada: POST {} (é o que o Database Webhook da tabela newsletter_disparo e o agendamento de 5 em 5 minutos fazem).
// A função não confia em nada que vem no pedido: só manda o que já está na fila.

import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { depoisDoErro, emailColuna, emailConfirmacao, enviarLote, esperaPagina, lotes, remetenteOk, urlPagina } from "./logica.mjs";

const SB = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
const CHAVE = Deno.env.get("RESEND_API_KEY") ?? "";
const REMETENTE = (Deno.env.get("NEWSLETTER_REMETENTE") ?? "").trim();
const SITE = Deno.env.get("NEWSLETTER_SITE") ?? "https://prumonews.com.br";
const RESPONDER = Deno.env.get("NEWSLETTER_RESPONDER") ?? "";

type Linha = { id: number; tipo: "confirmacao" | "coluna"; assinante: number; pub: string | null; tentativas: number; criado: string };
type Assinante = { id: number; autora: string; email: string; token: string; confirmado: boolean; cancelado: string | null };
type Resumo = { varridas: number; pegos: number; enviados: number; falhas: number; adiados: number; cancelados: number; erro?: string };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true, uso: "POST {} manda o que está na fila da newsletter" });
  if (!CHAVE || !REMETENTE) return json({ erro: "faltam os segredos RESEND_API_KEY e NEWSLETTER_REMETENTE" }, 500);
  if (!remetenteOk(REMETENTE)) return json({ erro: "NEWSLETTER_REMETENTE inválido: use Nome <email@seu-dominio>" }, 500);
  const r: Resumo = { varridas: 0, pegos: 0, enviados: 0, falhas: 0, adiados: 0, cancelados: 0 };
  try { await processar(r) } catch (e) { r.erro = String((e as Error)?.message ?? e); console.error("enviar-newsletter:", r.erro) }
  return json(r, r.erro ? 500 : 200);
});

async function processar(r: Resumo) {
  // agendadas que chegaram à hora (sem o pg_cron) e limpeza
  const v = await SB.rpc("newsletter_varrer"); if (!v.error) r.varridas = Number(v.data) || 0;
  // o que ficou "processando" há mais de 10 minutos (a função caiu no meio) volta para a fila
  await SB.from("newsletter_fila").update({ estado: "pendente", pego_em: null }).eq("estado", "processando").lt("pego_em", new Date(Date.now() - 10 * 60e3).toISOString());
  // pega de uma vez o que já pode sair (outra chamada ao mesmo tempo não pega os mesmos)
  const { data, error } = await SB.from("newsletter_fila").update({ estado: "processando", pego_em: new Date().toISOString() })
    .eq("estado", "pendente").lte("liberar_em", new Date().toISOString()).select("id,tipo,assinante,pub,tentativas,criado");
  if (error) throw error;
  const linhas = (data ?? []) as Linha[]; r.pegos = linhas.length; if (!linhas.length) return;
  const ids = [...new Set(linhas.map((l) => l.assinante))], ass = new Map<number, Assinante>();
  for (let i = 0; i < ids.length; i += 500) {
    const q = await SB.from("newsletter_assinantes").select("id,autora,email,token,confirmado,cancelado").in("id", ids.slice(i, i + 500));
    if (q.error) throw q.error; (q.data ?? []).forEach((a: Assinante) => ass.set(a.id, a));
  }
  const nomes = new Map<string, string>();
  const nomeDe = async (u: string) => { if (!nomes.has(u)) { const q = await SB.from("membros").select("nome").eq("uid", u).maybeSingle(); nomes.set(u, String(q.data?.nome ?? "a autora")) } return nomes.get(u)! };

  // 1. confirmações
  const conf: { l: Linha; m: { to: string; subject: string; html: string; text: string; headers: Record<string, string> } }[] = [];
  for (const l of linhas.filter((x) => x.tipo === "confirmacao")) {
    const a = ass.get(l.assinante);
    if (!a || a.cancelado || a.confirmado) { await marcar([l.id], { estado: "cancelado" }); r.cancelados++; continue }
    conf.push({ l, m: { to: a.email, ...emailConfirmacao({ nome: await nomeDe(a.autora), token: a.token, site: SITE }) } });
  }
  await mandar(conf, r);

  // 2. colunas (por coluna: confere que continua pública e que a página já está no ar)
  const porPub = new Map<string, Linha[]>();
  linhas.filter((x) => x.tipo === "coluna" && x.pub).forEach((l) => { const k = l.pub as string; porPub.set(k, [...(porPub.get(k) ?? []), l]) });
  for (const [pub, ls] of porPub) {
    const q = await SB.rpc("coluna_publica", { p_id: pub });
    const c = q.data as { id: string; tit: string; at: number; autora: { nome: string } } | null;
    if (q.error || !c) { await marcar(ls.map((l) => l.id), { estado: "cancelado", erro: "a coluna deixou de ser pública" }); r.cancelados += ls.length; continue }
    let noAr = false;
    try { const h = await fetch(urlPagina(SITE, c), { method: "HEAD", redirect: "follow" }); noAr = h.ok } catch { noAr = false }
    if (esperaPagina(noAr, c.at)) {
      await marcar(ls.map((l) => l.id), { estado: "pendente", pego_em: null, liberar_em: new Date(Date.now() + 5 * 60e3).toISOString() }); r.adiados += ls.length; continue;
    }
    const itens = [];
    for (const l of ls) {
      const a = ass.get(l.assinante);
      if (!a || !a.confirmado || a.cancelado) { await marcar([l.id], { estado: "cancelado" }); r.cancelados++; continue }
      const e = emailColuna(c, { token: a.token, site: SITE, mailto: RESPONDER });
      itens.push({ l, m: { to: a.email, subject: e.subject, html: e.html, text: e.text, headers: e.headers } });
    }
    await mandar(itens, r);
  }
}

async function mandar(itens: { l: Linha; m: { to: string; subject: string; html: string; text: string; headers: Record<string, string> } }[], r: Resumo) {
  for (const lote of lotes(itens)) {
    const res = await enviarLote(fetch, CHAVE, REMETENTE, lote.map((i) => i.m));
    if (res.ok) {
      for (let k = 0; k < lote.length; k++) await marcar([lote[k].l.id], { estado: "enviado", enviado_em: new Date().toISOString(), resend_id: res.ids[k] || null, erro: null });
      r.enviados += lote.length;
    } else {
      console.error("newsletter: lote recusado", res.erro);
      for (const i of lote) { const d = depoisDoErro(i.l.tentativas, res.status); await marcar([i.l.id], { ...d, pego_em: null, erro: res.erro }) }
      r.falhas += lote.length;
    }
  }
}

async function marcar(ids: number[], campos: Record<string, unknown>) {
  const c = { ...campos }; if (c.liberar_em === null) delete c.liberar_em;
  for (let i = 0; i < ids.length; i += 200) await SB.from("newsletter_fila").update(c).in("id", ids.slice(i, i + 200));
}
