# Melhoria contínua do Prumo

Arquivo lido pela tarefa agendada "Prumo: melhoria contínua". Cada noite ela escolhe **um** item pequeno (ou um bug que achar testando), corrige com teste, roda a bateria completa e só publica se tudo passar. Ao terminar, anota no fim deste arquivo o que fez.

## Regras do produto (decididas pelo Pedro; não mudar sem ele)
- O Prumo é sobretudo informação (Política e Economia), neutra, curta, sempre atualizada. Amigos e posts complementam.
- Visual novo ligado (cartão A "Jornal", Giro em quadros, Coleções, perfil estilo X, fase 2: fio, capítulos, prateleiras, Contexto do Prumo). Nome da pessoa sempre primeiro nos posts. "Relato" chama-se "De perto".
- Sem Reels. Stories ("Giro") focados em notícia: nada de Boomerang, Layout, emojis bobos.
- Notificações: dentro do app ligadas; push sempre opcional, desligado por padrão, cada tipo com liga/desliga.
- Colunas: post normal com teaser + "Ler a coluna"; qualquer membro pode escrever; só dentro do Prumo.
- Seguir: só perfis abertos; amizade continua mútua e é o padrão.
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
- [ ] Coluna: permitir editar a coluna (hoje é apagar e publicar de novo).
- [ ] Coluna: Feed não deve baixar o corpo inteiro das colunas (buscar ao abrir).
- [ ] Repost sem comentário de notícia: juntar à notícia como nos posts ("Bia repostou").
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
