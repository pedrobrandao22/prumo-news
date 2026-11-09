/* ---------- 120 (testes A, TA01): a casca da abertura já é a da Capa ----------
   O index.html tem ~430 KB (gzip); numa rede lenta a página aparece bem antes de o código rodar. Antes, nesse intervalo, a casca
   era a do Feed (cabeçalho do Feed, aba "Feed" marcada, esqueleto de post) e, quando o código rodava, tudo pulava para a Capa.
   Este trecho roda logo depois da barra de baixo existir e já mostra o que o app vai mostrar: o esqueleto da Capa (o mesmo de
   renderCapa sem edição) e a aba "Capa" marcada. Só quando o app abre na Capa (produção, ou testes com "prumo-teste-capa").
   Sem nomes globais (tudo dentro da função). 141: o esqueleto tem o formato da Capa pronta (linha da edição, foto da manchete,
   chapéu, título em 3 linhas e linha fina), para a troca esqueleto → Capa não mexer em nada de lugar. */
(function(){try{if(navigator.webdriver&&localStorage.getItem("prumo-teste-capa")!=="1")return;
  var c=document.getElementById("v-capa"),f=document.getElementById("v-feed"),t=document.querySelector("header.top");if(!c||!f||c.innerHTML)return;
  f.hidden=true;if(t)t.hidden=true;c.hidden=false;
  c.innerHTML='<div class="gut cp"><div class="cp-top"><span class="word">prumo<small>NEWS</small></span><span class="cp-ed ab141-sk-ed" aria-hidden="true">Edição da noite · dom, 00 de nov</span></div><div class="cp-sk ab141-sk" role="status" aria-label="Carregando a Capa"><i class="ab141-sk-art"></i><i style="height:11px;width:34%"></i><i style="height:26px;width:94%"></i><i style="height:26px;width:88%"></i><i style="height:26px;width:52%"></i><i style="height:14px;width:97%"></i><i style="height:14px;width:91%"></i><i style="height:14px;width:62%"></i></div></div>';
  var a=document.getElementById("t-feed"),b=document.getElementById("t-capa");if(a)a.removeAttribute("aria-current");if(b)b.setAttribute("aria-current","page")}catch(e){}})();
