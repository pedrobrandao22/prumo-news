/* 162 (corretor 16/11, testador): o post com notícia ("comentar notícia") se juntava ao cartão da notícia lá embaixo
   no Feed (~10 telas), como "Seu comentário"; a pessoa achava que não tinha publicado. Agora, nos 15 minutos depois de
   publicar, a notícia com o comentário da própria pessoa sobe para o topo do Feed (o 152 rola até ele e destaca);
   depois disso volta para o lugar de sempre. */
const PC162_JANELA=15*60e3;
{const _fm162=fc107Mistura;fc107Mistura=function(out,lista){const r=_fm162.apply(this,arguments);
  try{if(!Array.isArray(r)||!S||!S.uid)return r;const ag=Date.now();let meu=null;
    r.forEach(p=>{const x=p&&p.__fc107&&p.__pub;if(x&&x.autor===S.uid&&ag-(x.at||0)<PC162_JANELA&&(!meu||x.at>meu.at))meu=x});
    if(!meu)return r;const j=r.findIndex(p=>p&&!p.__pub&&p.id===meu.pid);if(j<=0)return r;
    let k=j+1;while(k<r.length&&r[k]&&r[k].__fc107&&r[k].__pub&&r[k].__pub.pid===meu.pid)k++;
    const bloco=r.splice(j,k-j);r.unshift(...bloco);return r}catch(e){return r}}}
