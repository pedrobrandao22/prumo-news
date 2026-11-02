/* ---------- 101: só duas bolinhas de abertura no topo do Feed ("Em 5 min" e "Últimas"), depois os temas ---------- */
/* "Sua semana" sai da fileira (continua em Perfil › Conta). A Agenda deixa de ter bolinha própria
   e vira as últimas telas do "Em 5 min" (hoje e o próximo dia com compromissos: no máximo 2 telas). */
{const _agp101=agPaginas;agPaginas=function(){const l=_agp101.apply(this,arguments);return l.slice(0,2)}}
{const _rs101=renderSecs;renderSecs=function(){const r=_rs101.apply(this,arguments);
  try{const box=$("#secs");if(box)box.querySelectorAll("[data-igagenda],[data-semana]").forEach(b=>{const sb=b.closest(".sb")||b;sb.remove()})}catch(e){}return r}}
function bt101Cinco(){try{return cincoLista().length>0}catch(e){return false}}
function bt101N5(){try{return igLista("_5min").ps.length}catch(e){return 0}}
/* "Em 5 min": a barra de progresso já mostra as telas da Agenda que vêm em seguida */
{const _ds101=drawStory;drawStory=function(){const r=_ds101.apply(this,arguments);
  try{if(ST&&ST.sec==="_5min"){const n=agPaginas().length,b=$("#layer .story .bars");if(n&&b&&!b.querySelector(".bt101"))b.insertAdjacentHTML("beforeend",Array.from({length:n},()=>`<i class="bt101"></i>`).join(""))}
    else if(ST&&ST.sec==="_ag"&&bt101Cinco()){/* Agenda dentro do "Em 5 min": mesmo nome, mesmas barras */
      const st=$("#layer .story.sg-ag");if(st){const n5=bt101N5(),b=st.querySelector(".bars");if(b&&n5)b.insertAdjacentHTML("afterbegin",Array.from({length:n5},()=>`<i class="on bt101"></i>`).join(""));
        const w=st.querySelector(".sg-who b");if(w)w.textContent="Em 5 min";const s=st.querySelector(".sg-who span");if(s)s.textContent="Agenda · "+s.textContent;
        const av=st.querySelector(".sg-avag");if(av){av.className="ph-av sg-av sg-av5";av.innerHTML="<i>5</i>"}
        const nn=st.querySelector(".sga-n");if(nn)nn.textContent="";}}}catch(e){}return r}}
