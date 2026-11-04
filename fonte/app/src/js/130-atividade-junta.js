/* ---------- 130: Atividade — repost e citação da mesma pessoa viram um item só (decisão do Pedro, 04/11) ----------
   Quando a MESMA pessoa repostou e também citou (repost com comentário) o MESMO post seu, a Atividade mostra um item só:
   "Bia repostou e comentou seu post De perto “…”: “comentário”" (o tipo vem de atPubNome: seu post, sua coluna, seu post De perto…).
   Tocar abre a citação (se você a vê; senão o seu post), como antes. A contagem e a bolinha contam 1.
   Os itens vêm do 112 (reposts que o app já vê) e do 129 (função reposts_dos_meus_posts da v11); funciona com e sem a v11.
   Nomes globais com o prefixo aj130. */
/* "cit" (com comentário), "rp" (sem) ou "" (não dá para saber: fica como está) */
function aj130Tipo(x){if(!x||x.acao!=="vnrp"||typeof x.k!=="string"||x.k.indexOf("vn112:")!==0)return "";const id=x.k.slice(6);
  try{if(x.dz129&&typeof DZ129!=="undefined"){const r=(DZ129.rps||[]).find(y=>String(y.id)===id);if(r)return r.citacao?"cit":"rp"}}catch(e){}
  try{const p=pubVisiveis().find(y=>y.id===id)||(typeof vn112Pub==="function"?vn112Pub(id):null);if(p)return String(p.texto||"").trim()?"cit":"rp"}catch(e){}
  return ""}
/* "seu post", "sua coluna “…”", "seu post De perto “…”" */
function aj130Nome(pub){let o=null;try{o=pubDe(pub)||(AT.pubs&&AT.pubs[pub])||(typeof vn112Pub==="function"?vn112Pub(pub):null)}catch(e){}
  try{const n=atPubNome(o);if(typeof n==="string"&&n)return n}catch(e){}return "sua publicação"}
/* o trecho do comentário, como já aparece no item da citação (": “…”"), ou "" */
function aj130Trecho(txt){const t=String(txt||""),m="sua publicação",i=t.indexOf(m);if(i<0)return "";const r=t.slice(i+m.length);return /^: “/.test(r)?r:""}
function aj130Junta(it){if(!Array.isArray(it)||it.length<2)return it;const gr=new Map();
  it.forEach((x,i)=>{const tp=aj130Tipo(x);if(!tp||!x.pub||!Array.isArray(x.us)||x.us.length!==1)return;const ch=x.us[0]+"|"+x.pub;
    if(!gr.has(ch))gr.set(ch,{cit:[],rp:[]});gr.get(ch)[tp].push(i)});
  const tira=new Set(),troca=new Map();
  gr.forEach(g=>{if(!g.cit.length||!g.rp.length)return;
    const ic=g.cit.slice().sort((a,b)=>(+it[b].at||0)-(+it[a].at||0))[0],c=it[ic];
    const at=Math.max(+c.at||0,...g.rp.map(i=>+it[i].at||0));
    const fim=String(c.txt).indexOf("</b>"),quem=fim>=0?String(c.txt).slice(0,fim+4):`<b>${esc(nomeDe(c.us[0]))}</b>`;
    troca.set(ic,{...c,at,aj130:1,txt:`${quem} repostou e comentou ${aj130Nome(c.pub)}${aj130Trecho(c.txt)}`});
    g.rp.forEach(i=>tira.add(i))});
  if(!tira.size)return it;const out=[];it.forEach((x,i)=>{if(tira.has(i))return;out.push(troca.has(i)?troca.get(i):x)});
  return out.sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at)}
{const _ai130=atItens;atItens=function(){const it=_ai130.apply(this,arguments);try{return aj130Junta(it)}catch(e){return it}}}
