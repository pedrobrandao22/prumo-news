/* ---------- 148: o Feed entra em lotes de 3 ao rolar (13/11) ----------
   Ao rolar, cada carregarMais punha 6 posts de uma vez: com CPU 4× e amigos no Feed, tarefas de 200–300 ms (o celular
   "engasga" no meio da rolagem). Agora entram 3 por vez; se o fim da lista ainda está perto da tela depois que o lote foi
   pintado, o próximo lote vem na tarefa seguinte (o toque e a rolagem passam no meio). carregarMais(true), usado para
   abrir um post específico, continua de 6 em 6 e na hora. Nomes com o prefixo lt148. */
LOTE_PASSO=3;
function lt148Emenda(){if(lt148Emenda.t)return;lt148Emenda.t=1;
  requestAnimationFrame(()=>setTimeout(()=>{lt148Emenda.t=0;const m=document.getElementById("mais");if(!m)return;const v=document.getElementById("v-feed");if(v&&v.hidden)return;
    try{if(m.getBoundingClientRect().top<innerHeight+600)carregarMais()}catch(e){}},0))}
{const _cm148=carregarMais;carregarMais=function(sync){const r=_cm148.apply(this,arguments);if(!sync)try{lt148Emenda()}catch(e){}return r}}
