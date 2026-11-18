/* 189 · corretor 18/11 (exceção da Fase 3: o app perdia o que a pessoa escreveu).
   Na tela "Notícia" (e nos outros formulários abertos pela caixa), o voltar do celular caía no passo "fotos" do editor
   antigo ("Novo post", Escolher fotos · Notícia · …) e o comentário sumia; um segundo voltar não saía dali. Agora o voltar
   do celular faz o mesmo que o "<" da tela: volta para a caixa "Nova publicação" com o texto e a notícia (152/155). */
{const _cl189=closeLayer;closeLayer=function(fromPop){try{
    if(fromPop===true&&typeof ED!=="undefined"&&ED&&ED.po&&(ED.po.cn||ED.po.passo==="detalhes")&&!ED.env&&CP152.veio&&$("#layer > .ce")&&!($("#layer2")?.innerHTML)
      &&!$("#layer .ce-sel,#layer .ce-fig,#layer .ce-tx,#layer .ce-cn,#layer .ce-selfie,#layer .ce-tagov,#layer .ce-fe,#layer .ca100-men")){
      const b=$("#layer > .ce .ce-ph [data-edvolta]");
      if(b){if(pushH())HST++;b.click();if(!$("#layer > .cp152")&&ED){CP152.txt=cp152TextoDe(ED);CP152.veio=false;ED=null;cp152Abre({manter:true,aba:"post"})}return}}
  }catch(e){}return _cl189.apply(this,arguments)}}
