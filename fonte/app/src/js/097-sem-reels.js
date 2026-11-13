/* ---------- 097: Reels desligados por enquanto ---------- */
/* Criar reel some (seletor POST/STORY/REELS e aba Reels do perfil). Reels já publicados continuam no Feed e no perfil.
   Para religar: REELS_LIGADO=true. Nos testes automáticos os Reels seguem ligados (o código continua testado),
   a não ser com localStorage "prumo-teste-semreels"="1". */
const REELS_LIGADO=false;
if(!REELS_LIGADO){
  {const i=PF_ABAS.findIndex(a=>a[0]==="reels");if(i>=0)PF_ABAS.splice(i,1)}
  if(PF_ABA==="reels")PF_ABA="posts";
  {const _md97=edModos;edModos=function(){return _md97.apply(this,arguments).replace(/<button[^>]*data-edmodo="reel"[^>]*>[\s\S]*?<\/button>/g,"")}}
  {const _dd97=edDesenha;edDesenha=function(){if(ED&&ED.modo==="reel")ED.modo="post";return _dd97.apply(this,arguments)}}
}
