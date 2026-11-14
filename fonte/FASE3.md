# Fase 3 — abertura mais rápida (plano medido em 14/11, madrugada)

## Onde vai o tempo da abertura (celular médio simulado, CPU 4×, site montado local)
- Trava total na abertura (TBT): ~500 ms; maior tarefa ~290 ms.
- Rastro do Chrome (thread principal): ParseHTML ~500 ms (inclui rodar os scripts),
  compilar o script de cima (V8.CompileScript) ~170 ms, compilar funções na hora (V8.CompileCode) ~240–300 ms,
  estilo e layout ~260 ms. O CSS (417 KB) pesa pouco: tirar o CSS das telas de criar não mudou a trava.
- Teste de corte: o mesmo app SEM os 15 arquivos de criação (071, 074–077, 093–096, 100, 102, 132, 133, 137, 138;
  ~440 KB do index) trava ~390 ms em vez de ~500 ms (−22%). É o ganho máximo de carregar a criação depois.

## Por que não dá para só "carregar depois" os arquivos de criação
Os arquivos se remendam em ordem (`const _x=f; f=function(){...}`). Mapa de dependências (fonte/mapa-dependencias.js):
- (a) arquivos que ficam no núcleo usam nomes da criação JÁ NO CARREGAMENTO (remendos):
  105, 106, 107, 113, 122, 123 (cn102*, ed* do editor de giros/posts), 079, 080, 081, 086, 108, 115,
  134, 135, 136, 146 (ed132*, ex133* do editor de colunas).
- (b) o núcleo chama ~80 funções da criação em tempo de uso (cn102De, cn102Comeca, edPublicaPost, ED…).
- (c) os arquivos de criação remendam funções de EXIBIÇÃO do núcleo: pubPostHTML, renderSecs, updateSocial,
  cs123CardHTML, cs123LerHTML, closeLayer, sheet… Carregados depois, o Feed e a leitura de colunas mudariam de cara
  no meio do uso.
- 102-criacao-noticia.js também desenha os cartões de análise/relato/pergunta no Feed (cn102De, cn102EnqHTML).

## Como fazer (sessão de dia, com testes)
1. Separar cada arquivo de criação em duas partes: `NNN-...-ver.js` (o que o Feed e a leitura usam: cn102De,
   cn102EnqHTML, os remendos de pubPostHTML/cs123CardHTML/renderSecs) e `NNN-...-editor.js` (telas de criar).
2. Mover os remendos de (a) que só servem ao editor para dentro do pacote do editor (ficam depois dele).
3. Pacote do editor no index como `<script type="text/x-prumo-editor">` (não é lido na abertura); o minificar.js
   também compacta esse bloco.
4. `edCarregar()` roda o pacote (script criado com o texto do bloco, síncrono) — chamado:
   no ociosidade 3 s depois da primeira tela; e, antes disso, por "portas" (Nova publicação, +, editar post/coluna,
   câmera, rascunhos). Funções do editor chamadas pelo núcleo ganham um "porteiro" que carrega e repassa.
5. Medir de novo (tbt.js) e rodar a bateria inteira; publicar só com as duas coisas boas.
Ganho esperado: ~100 ms a menos de trava no celular médio simulado; mais em celular fraco.
