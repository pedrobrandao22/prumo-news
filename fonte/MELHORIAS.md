# Melhoria contínua do Prumo

Arquivo lido pela tarefa agendada "Prumo: melhoria contínua". Cada noite ela escolhe **um** item pequeno (ou um bug que achar testando), corrige com teste, roda a bateria completa e só publica se tudo passar. Ao terminar, anota no fim deste arquivo o que fez.

## Regras do produto (decididas pelo Pedro; não mudar sem ele)
- O Prumo é sobretudo informação (Política e Economia), neutra, curta, sempre atualizada. Amigos e posts complementam.
- Visual novo ligado (cartão A "Jornal", Giro em quadros, Coleções, perfil estilo X, fase 2: fio, capítulos, prateleiras, Contexto do Prumo). Nome da pessoa sempre primeiro nos posts. "Relato" chama-se "De perto".
- Sem Reels. Stories ("Giro") focados em notícia: nada de Boomerang, Layout, emojis bobos.
- Notificações: dentro do app ligadas; push sempre opcional, desligado por padrão, cada tipo com liga/desliga.
- Colunas: post normal com teaser + "Ler a coluna"; qualquer membro pode escrever; só dentro do Prumo.
- Seguir: só perfis abertos; amizade continua mútua e é o padrão.
- Lista de seguidores visível para os membros; fechar o perfil não apaga seguidores.
- Fotos só de fontes livres com crédito; nunca imagem de IA de pessoa real; nunca reproduzir texto completo de veículos.
- Fonte e quantidade de veículos: bem discretas.

## Regras técnicas
- Nunca mexer no banco real nem pedir chaves; mudança de SQL vira proposta em `fonte/sql/proposta-*.sql` para o Pedro rodar.
- Nada de segredo no repositório (é público). Só a chave publicável do Supabase vai no build.
- Nunca usar lookbehind em regex (`(?<=`, `(?<!`): quebra iPhone antigo.
- Nomes globais novos únicos (grep em `app/src/js`).
- Testes conhecidos que dependem do relógio: `t_etapa28` ("corrigida") e `t_ig_figurinhas` ("contagem") à noite.
- Nunca force push. Publicar = `python3 build.py https://kkzcljusiotoklldaupg.supabase.co sb_publishable_s1mSA4gcb2qs6kVRZYQZ-g_BsvwvdIA --saida site-real` e copiar `index.html`, `versao.json`, `sw.js` para a raiz.

## Lista de pendências pequenas (pegar de cima para baixo; riscar ao fazer)
- [x] ~~Coluna: permitir editar a coluna (hoje é apagar e publicar de novo).~~ (04/11; o texto longo depende de `sql/proposta-2026-11-04.sql`)
- [ ] Coluna: Feed não deve baixar o corpo inteiro das colunas (buscar ao abrir).
- [x] ~~Repost sem comentário de notícia: juntar à notícia como nos posts ("Bia repostou").~~ (04/11, 129)
- [ ] Atividade: repost e citação da mesma pessoa viram um item só; texto "repostou seu post De perto “…”".
- [ ] Matéria com 2 visuais: capítulos mostrar os dois.
- [ ] Gráfico de linha: rótulo do último valor encosta na linha em 360 px.
- [ ] Capítulo "Linha do tempo" × seção "Como a história andou": alinhar o nome.
- [ ] Giro de amigo com cartão de texto: texto da miniatura embaralha com o título.
- [ ] Sugestões de @ cobrem a linha "Marcar pessoas" no criador de post.
- [ ] Desempenho: desenhar o Feed (~35 cartões) em pedaços menores com CPU 4×.
- [x] Primeira visita em 3G: fonte Newsreader disputa banda com o feed-leve (QA C tirou o preload das fontes, 04/11).
- [ ] Atividade: ao começar a seguir alguém, posts antigos dele contam como novos (NB19).
- [ ] Ícone: menção conta duas vezes (Conversas e Atividade) (NB20).
- [ ] Feed: montar o cartão uma vez só (112/113/117 viram DOM e texto várias vezes) ou lotes de 3 posts (NC05).
- [ ] Tamanho: carregar Administração (031) e criação de giro/câmera/figurinhas só quando usados (NC06).
- [ ] Quem fecha o app antes do detalhe chegar não fica com a edição para ler offline.

## Diário
- 2026-11-04: Agora dá para editar uma coluna já publicada: no menu "…" da sua coluna, "Editar a coluna" abre o editor preenchido e "Salvar" atualiza título, linha fina, hashtags e texto, sem perder curtidas e comentários (capa e público ficam como estão). Para mudar o texto longo das colunas novas, o Pedro precisa rodar `sql/proposta-2026-11-04.sql` no Supabase (libera a edição do texto só para o autor); até lá, o app salva o resto e avisa. Teste: review2/t_melhoria_20261104. Observações: (1) na Capa, a ilustração do Plenário (feita em 5:4) é cortada no cartão 4:5 e perde o rótulo "SENADO FEDERAL" à esquerda — vale olhar; (2) falhas que já existiam sem esta mudança: as fotos review2/ig3/*.jpg não estão no repositório (sem elas t_ig_fotos, t_criacao2, t_criacao_noticia, t_foco_noticia e t_qa_producao param; com fotos de teste geradas aqui passam, menos o "fundo sem faixa" do t_criacao2, que depende da foto) e t_ver_stories acusa um aviso de toque do Chromium; (3) robôs: validar.py aponta Internacional x Coritiba de data passada ainda agendado.
- 2026-11-04 (129, decisões do Pedro): (1) fechar o perfil não apaga seguidores (confirmado, nada muda); (2) a lista de seguidores e de quem a pessoa segue fica visível para qualquer membro no perfil aberto e para os amigos no perfil fechado, sem quem bloqueou/foi bloqueado e sem contas suspensas ou excluídas (números aparecem também no perfil fechado de um amigo); (3) repost de notícia sem comentário se junta como nos posts: a notícia uma vez, com "Bia e Carla repostaram"; citação à parte; (4) a Atividade mostra repost e citação feitos por quem só segue você. (2) e (4) dependem de `sql/publicacoes-v11.sql` (rodar depois da v9 e da v10); sem ela o app fica como antes. Teste: review2/t_decisoes_0411.
