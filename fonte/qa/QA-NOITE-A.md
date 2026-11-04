# QA da noite (A) — colunas, seguir, reposts e "De perto" usados por 5 pessoas

Cenário (teste `review2/t_qa_noite_a.js`, estado de produção: foco, visual novo/cartão A, sem reels, fase 2):
Pedro, Bia e Carla são amigos; Dani e Edu são amigos entre si e não conhecem os outros. Bia abre o perfil e escreve
(coluna longa com intertítulos, citação, links, negrito/itálico, capa e hashtags; rascunho; prévia; De perto com fotos,
Pergunta, Análise e fio para seguidores; um post para amigos e um para Melhores amigos). Dani acha a Bia na Busca, segue,
lê, curte, comenta, guarda, vota, reposta e cita. Bia responde; Pedro comenta; Carla e Pedro repostam; Edu só vê a Dani.
Depois: hashtag, conversa, perfil fechado/reaberto, remover seguidor, seguir de novo, bloqueio. Larguras 360/390/430,
escuro, 4× CPU. E a segunda parte com o banco **antes da v9** (como produção hoje).
Privacidade conferida também direto no banco, como cada pessoa (`H.comoUsuario`).
Capturas: `qa/noite-a/`.

Resumo: **13 problemas** (2 altos, 4 médios, 7 baixos), **todos corrigidos**. 5 pontos para decisão no fim.

| id | sev. | o quê | status |
| --- | --- | --- | --- |
| NA01 | Alta | Autora não via curtidas, comentários e votos de quem a segue; quem segue não via a resposta da autora; nada disso na Atividade | corrigido (125) |
| NA02 | Alta (privacidade) | Push "X também comentou" (v10) mandava nome e texto de quem a pessoa não conhece, e para quem não vê mais o post | corrigido (SQL v10) |
| NA03 | Média | "Perfis abertos" não aparecia na aba Buscar de verdade (lupa e menu de baixo) | corrigido (125) |
| NA04 | Média | Repost/citação de post de quem você segue: "Publicação indisponível" para a própria pessoa; Feed com original + repost | corrigido (125) |
| NA05 | Média | Hashtag › Ler a coluna › Voltar fechava tudo (perdia a página da hashtag) | corrigido (125) |
| NA06 | Média | Busca › perfil aberto › Voltar fechava a busca (na busca antiga, em folha) | corrigido junto com NA03 |
| NA07 | Baixa | Listas de seguidores / Perfis abertos com a letra serifada da linha fina da coluna | corrigido (css 40) |
| NA08 | Baixa | De perto para seguidores sem a marca "seguidores" no cabeçalho | corrigido (125) |
| NA09 | Baixa | Coluna citada mostrava o texto cru (título, linha fina e #hashtags); tocar não abria a leitura | corrigido (125 + css 40) |
| NA10 | Baixa | Conversa: coluna enviada aparecia como "Post", com as hashtags | corrigido (125) |
| NA11 | Baixa | Repostar/Enviar post para seguidores: textos falavam só de amigos ("Seus amigos veem…", "Só quem é amigo…") | corrigido (125) |
| NA12 | Baixa | Formulário (Notícia · De perto · Análise · Pergunta · Coluna): "Coluna" caía sozinha numa 2ª linha | corrigido (css 40) |
| NA13 | Baixa | Atividade: "curtiu seu post" numa coluna; resumo contava "começou a seguir você" como "1 novidade" | corrigido (125) |

---

### NA01 — Alta — reações entre quem escreve e quem segue sumiam
Passos: Bia (perfil aberto) publica coluna para "Seguidores e amigos". Dani (segue, não é amiga) curte, comenta e vota na
Pergunta. Bia abre a coluna e a Atividade. Bia responde. Dani abre a coluna.
Esperado: Bia vê "Gostei · 1", o comentário da Dani (o nome ela já vê na lista de seguidores) e o voto; Atividade com
"Dani comentou / curtiu sua coluna / votou"; Dani vê a resposta da Bia. (E o push da v10 já avisava a Bia com o nome da Dani.)
Atual (antes): Bia via "Gostei" sem número, só o comentário do Pedro; Atividade só com "começou a seguir você"; Dani não
via a resposta da Bia. Causa: `socialOf`/`votosDe`/`atItens` só aceitam amigos (`ehVisivel`).
Correção: reação aparece se for de amigo, do autor do post, ou de quem segue você / quem você segue (`qa125VeReac`).
Amigos da autora continuam fora para a Dani, e a Dani fora para eles (teste confere os dois lados).
Capturas: `08-bia-fim-coluna.png`, `09-bia-atividade.png`, `10-dani-resposta-da-bia.png`.

### NA02 — Alta (privacidade) — push "também comentou" (SQL v10)
Passos: Dani (só segue a Bia) comenta na coluna; Bia responde; Pedro (amigo da Bia, não conhece a Dani) comenta.
Esperado: a Dani não recebe "Pedro Brandão também comentou…" com o texto do Pedro (o app nem mostra esse comentário a ela),
e vice-versa; quem deixou de seguir/de ser amigo não recebe mais.
Atual (antes): `push_t_reacoes` mandava para todo mundo que já tinha comentado, com nome e texto.
Correção (`sql/publicacoes-v10.sql` e `prumo-supabase.sql`, iguais): só manda se quem recebe conhece quem comentou (amigos,
ou um segue o outro, ou quem comentou é o autor) **e** ainda vê o post (amigo do autor, ou segue o perfil aberto num post
para seguidores). O teste confere a fila `push_fila`.

### NA03 — Média — "Perfis abertos" fora da aba Buscar
Passos: Dani toca na lupa (ou em Buscar no menu de baixo) e digita "Bia".
Esperado: "Perfis abertos" com a Bia e "Seguir", antes das notícias.
Atual (antes): só notícias. O 123 só ligava na busca antiga (`#btext`, folha), que o app de hoje quase não usa.
Correção: o mesmo bloco na aba Buscar (`#bvq`/`#bvres`); abrir o perfil e voltar devolve à busca com o texto.
Captura: `03-busca-perfis-abertos.png`.

### NA04 — Média — repost/citação de quem você segue
Passos: Dani reposta (sem comentário) e cita a coluna da Bia. Abre o Feed.
Esperado: a coluna uma vez, com "Você repostou"; a citação mostra a coluna citada.
Atual (antes): coluna + repost separado ("Publicação indisponível") e a citação dela com "Publicação indisponível"
(`vn112Pub` só aceitava amigos). Para o Edu (amigo da Dani, não segue) continua como decidido: repost simples some,
citação com "Publicação indisponível" e sem título/nome da Bia.
Capturas: `07-dani-citacao.png`, `12-edu-citacao-indisponivel.png`.

### NA05 — Média — hashtag › coluna › Voltar
Passos: Pedro abre #Inflação, toca em "Ler a coluna", toca em Voltar (ou o voltar do celular).
Esperado: volta à página da #Inflação. Atual (antes): fechava tudo, ia para o Feed.

### NA06 — Média — Busca › perfil › Voltar
Na busca antiga (folha) o Voltar do perfil fechava a busca. Com NA03 a busca de perfis está na aba Buscar, que fica atrás
do perfil: Voltar devolve à busca com "Bia" e a lista (teste confere).

### NA07 — Baixa — letra das listas
`.cs123-l` é a classe da linha fina da coluna e também a das listas (seguidores, Perfis abertos): nomes e "Remover" em
serifa 16,5px. Correção em `css/40`: `ul.amgl.cs123-l` volta à letra normal. Captura: `14-bia-seguidores.png`.

### NA08 — Baixa — De perto sem "seguidores"
O cabeçalho próprio do De perto (117) trocava o `ph-sub` e perdia a marca. Agora "agora · Tijuca… · seguidores".
Captura: `05-dani-de-perto.png`.

### NA09 — Baixa — coluna citada
Antes: "O preço do tomate…\n\nNa feira…\n\n#Inflação #economia" cru. Agora: COLUNA, título em serifa, linha fina, capa;
tocar abre a leitura. Captura: `07-dani-citacao.png`.

### NA10 — Baixa — coluna na conversa
Cartão diz "Coluna" e mostra o título. Conversa › post › Ler a coluna › Voltar › Voltar volta à conversa (conferido).
Captura: `13-pedro-conversa-coluna.png`.

### NA11 — Baixa — textos de Repostar/Enviar para seguidores
Repostar (Dani, post para seguidores da Bia): "Só aparece para quem também pode ver o post de Bia (amigos ou seguidores)".
Enviar (Bia): "Seus amigos e quem segue você conseguem abrir o post."; (outra pessoa): "Só quem é amigo de Bia ou segue Bia…".

### NA12 — Baixa — abas do formulário
Com a 5ª aba (Coluna), a grade de 4 colunas jogava "Coluna" para baixo. Agora uma linha (rola para o lado se não couber).
Usa `:has` (iOS 15.4+); em aparelho mais antigo fica como antes. Captura: `02b-analise-publico.png`.

### NA13 — Baixa — Atividade
"Dani Rocha curtiu sua coluna “O preço do tomate virou política”"; o resumo conta "1 seguidor novo".

---

## Conferido e sem problema
- Coluna: rascunho guardado ao fechar (com hashtags), "1 rascunho guardado", reabrir, prévia (intertítulos, citação, links
  com domínio, negrito/itálico, hashtags), publicar da prévia; capa; barra de progresso; Voltar do Feed, do perfil, da
  hashtag (NA05), da conversa; Guardar; 360/390/430 sem rolagem para o lado; escuro; 4× CPU abre em < 1,5 s.
- Público "Seguidores e amigos" no editor da coluna e no formulário da Análise (linha "Público" mostra o nome certo).
- Seguir/Seguindo, números, "Perfil aberto · segue você", Atividade "começou a seguir você", remover seguidor, bloqueio
  (desfaz o seguir dos dois lados, some da Busca, seguir de novo é recusado), perfil fechado (some do Feed e das
  Guardadas; reabrir devolve a quem já seguia).
- Banco, como cada pessoa: Dani só lê os posts "seguidores" da Bia (nada de amigos, Melhores amigos ou story); não lê
  a linha de membros da Bia nem a do Pedro; Edu não lê nada da Bia nem as reações; perfil fechado/bloqueio = zero linhas.
- "Bia e Carla repostaram"/"Você e Carla repostaram"; citações à parte; nome primeiro em coluna, De perto com fotos,
  Pergunta, Análise e fio (também para quem só segue); nenhum "Relato"/"não checado" no Feed.
- Antes da v9: sem Seguir/números/Perfil aberto; contador "de 6.000 (por enquanto…)"; acima de 6.000 avisa e não publica;
  publica para amigos com o texto no estilo; a amiga lê e curte; sem erros.

## Para decidir (não mexi)
1. **Repost de quem só segue não chega à Atividade da autora**: o repost da Dani é "para amigos" da Dani e a Bia não lê
   (regra do banco). Precisaria de uma função no SQL (ex.: listar os reposts dos meus posts, só com nome e hora).
2. **Reações no banco**: quem vê o post lê todas as reações (uid e texto), também as de quem não conhece (sem o nome).
   O app esconde; fechar no banco mudaria `pub_reacoes` (RLS) e os números. Para a Dani isso inclui o texto do comentário
   do Pedro no post da Bia "para seguidores".
3. **Story "seguidores"**: o banco aceita gravar (só amigos leem; o app nunca grava assim). Inofensivo; dá para recusar no check.
4. **Fechar o perfil não apaga seguidores**: ao reabrir, quem seguia volta a ver. É o comportamento do Instagram; confirmar.
5. **Atraso no app de quem segue**: depois de bloquear/remover/fechar, o banco já corta na hora; o app do seguidor tira os
   posts na próxima recarga (até ~90 s ou ao voltar ao app).

Não reproduzido: uma vez (dois runs seguidos), "Adicione um comentário…" logo depois de "Gostei" não abriu os comentários
na coluna; isolado, com 0–900 ms entre os toques, abriu sempre.
