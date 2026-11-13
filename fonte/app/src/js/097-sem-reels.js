/* ---------- 097: Reels ---------- */
/* A criação de Reels saiu em 13/11 (o editor tem só POST e STORY). Os Reels já publicados continuam no Feed e no perfil
   (aba Posts); a aba Reels do perfil não aparece. */
{const i=PF_ABAS.findIndex(a=>a[0]==="reels");if(i>=0)PF_ABAS.splice(i,1)}
if(PF_ABA==="reels")PF_ABA="posts";
