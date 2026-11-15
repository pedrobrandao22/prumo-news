/* ---------- 153: notícias do Feed mais limpas (14/11, pedido do Pedro) ----------
   O cartão de notícia no Feed tinha 4 faixas depois das ações: barra da cobertura com "desde 08/11 · etapa: … · 6
   manchetes", hashtags e o campo "Adicione um comentário…". Agora: a barra diz só "Cobertura completa" (e a etapa, se
   houver); hashtags e o campo vazio de comentário saem do Feed (continuam na matéria e nos comentários). Prefixo fl153. */
{const _cb153=cobBarra;cobBarra=function(p){const h=_cb153.apply(this,arguments);if(!h)return h;try{const et=cobEtapaAtual(p);
  return h.replace(/<span class="cb-t">[\s\S]*?<\/span>/,`<span class="cb-t"><b>Cobertura completa</b>${et?" · "+esc(et):""}</span>`)}catch(e){return h}}}
