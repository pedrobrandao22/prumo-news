// Prumo News · função "enviar-push" (Supabase Edge Function, Deno).
// Lê a fila public.push_fila (preenchida pelos gatilhos do sql/publicacoes-v10.sql), agrupa e envia as notificações
// para os aparelhos inscritos (public.push_inscricoes), respeitando o que cada aparelho escolheu receber.
// Aparelho que o serviço de push diz que não existe mais (404/410) é apagado.
//
// Segredos (só no painel do Supabase › Edge Functions › Secrets, NUNCA no repositório):
//   VAPID_PUBLIC   a "Public Key" do `npx web-push generate-vapid-keys`
//   VAPID_PRIVATE  a "Private Key" do mesmo comando
//   VAPID_SUBJECT  um contato, ex.: mailto:seu-email@exemplo.com
// O Supabase já entrega SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY a toda função (não precisa criar).
// Opcional: FEED_URL (padrão https://prumonews.com.br/feed.json), usado no modo "coberturas".
//
// Chamadas:
//   POST {}                      -> processa a fila (é o que o Database Webhook ou o pg_net fazem a cada aviso novo)
//   POST {"modo":"coberturas"}   -> antes, confere no feed.json se as coberturas seguidas tiveram atualização (agendar a cada 15 min)
// A função não confia em nada que vem no pedido: só envia o que já está na fila. Por isso pode ser chamada sem chave.

import { createClient } from "npm:@supabase/supabase-js@2.117.2";
// Biblioteca de Web Push só com WebCrypto (aes128gcm + VAPID, RFC 8291/8292; aceita por Google, Mozilla e Apple), versão fixa
import { buildPushPayload } from "npm:@block65/webcrypto-web-push@2.0.0";
import { agrupar, avisoCobertura, coberturasNovas, endpointOk, enviarUm, montarPayload, querTipo, quemSegue, validarVapid } from "./logica.mjs";

const SB = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC") ?? "";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "";
const FEED_URL = Deno.env.get("FEED_URL") ?? "https://prumonews.com.br/feed.json";

type Linha = { id: number; para: string; tipo: string; de: string | null; chave: string; titulo: string; corpo: string; url: string; criado_em: string };
type Inscricao = { id: string; uid: string; endpoint: string; p256dh: string; auth: string; prefs: Record<string, boolean> };
type Resumo = { coberturas: number; grupos: number; enviados: number; agrupados: number; sem_destino: number; falhas: number; removidas: number; erro?: string };

const VAPID = { subject: VAPID_SUBJECT, publicKey: VAPID_PUBLIC, privateKey: VAPID_PRIVATE };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: true, uso: "POST {} processa a fila; POST {\"modo\":\"coberturas\"} confere as coberturas" });
  let corpo: Record<string, unknown> = {};
  try { corpo = await req.json() } catch { /* pedido sem corpo: só processa a fila */ }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !VAPID_SUBJECT) return json({ erro: "faltam os segredos VAPID_PUBLIC, VAPID_PRIVATE e VAPID_SUBJECT" }, 500);
  const ruim = validarVapid(VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT);
  if (ruim) return json({ erro: ruim }, 500);
  const r: Resumo = { coberturas: 0, grupos: 0, enviados: 0, agrupados: 0, sem_destino: 0, falhas: 0, removidas: 0 };
  try {
    if (corpo && corpo.modo === "coberturas") r.coberturas = await enfileirarCoberturas();
    await processarFila(r);
  } catch (e) {
    r.erro = String((e as Error)?.message ?? e);
    console.error("enviar-push:", r.erro);
  }
  return json(r, r.erro ? 500 : 200);
});

async function processarFila(r: Resumo) {
  // o que foi pego há mais de 5 minutos e ficou "processando" (a função caiu no meio) volta para a fila.
  // Conta a hora em que foi PEGO (guardada em enviado_em enquanto processa), não a hora em que entrou na fila:
  // assim uma chamada não devolve à fila o que outra chamada, ao mesmo tempo, acabou de pegar (aviso em dobro).
  const cinco = new Date(Date.now() - 5 * 60e3).toISOString();
  await SB.from("push_fila").update({ estado: "pendente", enviado_em: null }).eq("estado", "processando")
    .or(`enviado_em.lt.${cinco},and(enviado_em.is.null,criado_em.lt.${cinco})`);
  // pega os pendentes de uma vez (outra chamada ao mesmo tempo não pega os mesmos)
  const { data: linhas, error } = await SB.from("push_fila").update({ estado: "processando", enviado_em: new Date().toISOString() })
    .eq("estado", "pendente").gt("criado_em", new Date(Date.now() - 24 * 3600e3).toISOString()).select("*");
  if (error) throw error;
  if (!linhas || !linhas.length) return;
  const pessoas = [...new Set((linhas as Linha[]).map((l) => l.para))];
  const { data: recentes } = await SB.from("push_fila").select("para,tipo,chave,enviado_em")
    .eq("estado", "enviado").in("para", pessoas).gt("enviado_em", new Date(Date.now() - 3 * 60e3).toISOString());
  const { grupos, agrupados } = agrupar(linhas as Linha[], recentes ?? []);
  if (agrupados.length) { await marcar(agrupados, "agrupado"); r.agrupados += agrupados.length }
  const { data: insc } = await SB.from("push_inscricoes").select("id,uid,endpoint,p256dh,auth,prefs").in("uid", pessoas);
  const porPessoa = new Map<string, Inscricao[]>();
  ((insc ?? []) as Inscricao[]).forEach((i) => { const l = porPessoa.get(i.uid) ?? []; l.push(i); porPessoa.set(i.uid, l) });
  for (const g of grupos) {
    r.grupos++;
    // só aparelhos que querem este tipo e com endereço de um serviço de push conhecido (nada de pedido para servidor qualquer)
    const alvos = (porPessoa.get(g.para) ?? []).filter((i) => querTipo(i.prefs, g.tipo) && endpointOk(i.endpoint));
    if (!alvos.length) { await marcar(g.ids, "sem_destino"); r.sem_destino += g.ids.length; continue }
    const { count } = await SB.from("mensagens").select("id", { count: "exact", head: true }).eq("para", g.para).eq("lida", false);
    const payload = JSON.stringify(montarPayload(g, typeof count === "number" ? count : null));
    let algum = false;
    for (const i of alvos) {
      try {
        const res = await enviarUm(buildPushPayload, fetch, i, payload, VAPID);
        if (res.ok) { algum = true; r.enviados++ }
        else if (res.sumiu) { await SB.from("push_inscricoes").delete().eq("id", i.id); r.removidas++ }
        else { r.falhas++; console.error("push recusado", res.status, new URL(i.endpoint).host) }
      } catch (e) {
        r.falhas++; console.error("push falhou", String((e as Error)?.message ?? e).slice(0, 200));
      }
    }
    // o primeiro do grupo fica como "enviado" (é por ele que contam os 2 minutos); os outros, "agrupado"
    if (algum) {
      await SB.from("push_fila").update({ estado: "enviado", enviado_em: new Date().toISOString() }).eq("id", g.ids[g.ids.length - 1]);
      if (g.ids.length > 1) await marcar(g.ids.slice(0, -1), "agrupado");
    } else await marcar(g.ids, "falhou");
  }
  // limpeza: o que tem mais de 3 dias sai da fila
  await SB.from("push_fila").delete().lt("criado_em", new Date(Date.now() - 3 * 864e5).toISOString());
}

async function marcar(ids: number[], estado: string) {
  for (let i = 0; i < ids.length; i += 200) await SB.from("push_fila").update({ estado, enviado_em: null }).in("id", ids.slice(i, i + 200));
}

// modo "coberturas": olha o feed.json do site e avisa quem segue as coberturas que mudaram desde a última olhada
async function enfileirarCoberturas(): Promise<number> {
  const { data: cfg } = await SB.from("config_app").select("valor").eq("chave", "push_cob_marca").maybeSingle();
  const agora = Date.now();
  const marca = Number((cfg?.valor as { ts?: number } | null)?.ts) || agora - 3600e3;   // primeira vez: só a última hora
  const resp = await fetch(FEED_URL, { headers: { "Cache-Control": "no-cache" } });
  if (!resp.ok) throw new Error("feed.json respondeu " + resp.status);
  const novas = coberturasNovas(await resp.json(), marca, agora);
  let n = 0;
  if (novas.length) {
    const { data: docs } = await SB.from("docs").select("owner,data").eq("col", "data").like("path", "data/users/%/prefs");
    for (const c of novas) {
      for (const uid of quemSegue(docs ?? [], c.chave)) {
        const { data: ok } = await SB.rpc("push_enfileirar", { p_para: uid, p_de: null, ...avisoCobertura(c) });
        if (ok) n++;
      }
    }
  }
  const nova = Math.max(marca, ...novas.map((c) => c.at));
  await SB.from("config_app").upsert({ chave: "push_cob_marca", valor: { ts: nova }, atualizado_em: new Date().toISOString() });
  return n;
}
