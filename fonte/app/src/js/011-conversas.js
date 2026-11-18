/* ---------- conversas ---------- */
const REAC=[["concordo","👍","Concordo"],["surpreso","😮","Surpreso"],["discordo","👎","Discordo"]];
async function reagir(mid,k){const m=allMsgs().find(x=>x.id===mid),r=REAC.find(x=>x[0]===k);if(!m||!r||!S.db)return;if(!S.amigos.has(m.de)){toast("Só dá para reagir com amigos.");return}vibrar(8);
  const at=Date.now(),texto=r[1]+" "+r[2];const ext={pid:m.pid,snap:{id:m.pid,titulo:m.snap?.titulo||"",secao:m.snap?.secao||""},resp:true,tipo:"reacao"};
  S.msgsOut.push({id:"tmp"+at,de:S.uid,para:m.de,at,texto,lida:false,...ext});renderMsgs();
  try{await S.db.collection("mensagens").add({de:S.uid,para:m.de,at,texto,lida:false,...ext})}catch(e){S.msgsOut=S.msgsOut.filter(x=>x.id!=="tmp"+at);renderMsgs();toast("Não deu para reagir agora.")}}

