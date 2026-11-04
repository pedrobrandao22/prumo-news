/* ---------- 120 (testes A, TA01): a casca da abertura já é a da Capa ----------
   O index.html tem ~430 KB (gzip); numa rede lenta a página aparece bem antes de o código rodar. Antes, nesse intervalo, a casca
   era a do Feed (cabeçalho do Feed, aba "Feed" marcada, esqueleto de post) e, quando o código rodava, tudo pulava para a Capa.
   Este trecho roda logo depois da barra de baixo existir e já mostra o que o app vai mostrar: o esqueleto da Capa (o mesmo de
   renderCapa sem edição) e a aba "Capa" marcada. Só quando o app abre na Capa (produção, ou testes com "prumo-teste-capa").
   Sem nomes globais (tudo dentro da função). */
(function(){try{if(navigator.webdriver&&localStorage.getItem("prumo-teste-capa")!=="1")return;
  var c=document.getElementById("v-capa"),f=document.getElementById("v-feed"),t=document.querySelector("header.top");if(!c||!f||c.innerHTML)return;
  f.hidden=true;if(t)t.hidden=true;c.hidden=false;
  c.innerHTML='<div class="gut cp"><div class="cp-top"><span class="word">prumo<small>NEWS</small></span></div><div class="cp-sk"><i style="height:220px"></i><i style="height:22px;width:80%"></i><i style="height:16px;width:60%"></i></div></div>';
  var a=document.getElementById("t-feed"),b=document.getElementById("t-capa");if(a)a.removeAttribute("aria-current");if(b)b.setAttribute("aria-current","page")}catch(e){}})();
