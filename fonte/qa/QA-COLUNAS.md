# QA das colunas — editor, importar/exportar, leitores e números (08/11)

Cenário (teste `review2/t_qa_colunas.js`, estado de produção: foco, visual novo, sem reels, fase 2):
Bia (autora, perfil aberto) escreve no celular a 360 px com CPU 4×: todos os blocos, "/" menu, colar do Word (HTML real
com estilos `mso-*`, listas `mso-list` e imagem local), foto com legenda, gráfico do acervo, emoji, link enorme e palavra
sem espaços; autosave, fechar e reabrir o app, dois rascunhos, sem internet no meio, duas abas no mesmo rascunho, a sessão
caindo com o editor aberto, Voltar do Android (com e sem folha aberta), teclado cobrindo a barra, prévia, publicar para
amigos (série, hashtags, assunto do dia), editar ("editado"), histórico e restaurar, agendar (Carla não vê antes, vê
depois), série de 3 com anterior/próxima; importar .docx (gerado no teste), .md e .html; exportar (e-mail sem script,
fio do X ≤ 280, LinkedIn ≤ 3.000, carrossel). Carla (amiga, 430 px) lê pelo Feed, curte, comenta, cita trecho e segue a
série; Dani (só segue, desktop 1280 escuro) não vê a coluna para amigos e lê a para seguidores pelo perfil e comenta.
Bia vê os números (sem nomes de quem só leu), fixa 3 comentários e responde com o selo "Autora". Bordas: coluna vazia,
só título, 40 mil caracteres, acessibilidade (rótulos, foco visível), sem rolagem lateral, tempo de abrir o editor e de
publicar, console sem erros. E o banco **só até a v12** (produção hoje).
Capturas: `qa/qa-colunas/`.

Resumo: **7 problemas** (2 altos, 2 médios, 3 baixos), **todos corrigidos** em `js/135-qa-colunas.js`,
`css/48-qa-colunas.css` e dois ajustes pequenos direto em `js/132` e `js/133`. **Nenhuma mudança de SQL** (a v13 fica
como estava).

| id | sev. | o quê | status |
| --- | --- | --- | --- |
| QC01 | Alta | Duas abas no mesmo rascunho: a aba parada regravava o texto velho por cima do novo ao fechar ou ficar escondida | corrigido (135) |
| QC02 | Alta | Sessão que cai com o editor aberto: o texto ia para a gaveta "…:null" e sumia depois de entrar de novo | corrigido (135) |
| QC03 | Média | Colar do Word perdia todo negrito e itálico | corrigido (132) |
| QC04 | Baixa | Publicar com a sessão expirada: "Não deu para publicar agora", sem dizer o motivo | corrigido (135) |
| QC05 | Média | Lista pelo "/" ou pela barra ficava dentro do parágrafo; na linha seguinte o "/" não abria o menu | corrigido (135) |
| QC06 | Baixa | Exportar para o X: intertítulo mais longo que um post saía com mais de 280 caracteres | corrigido (133) |
| QC07 | Baixa | Contagem de palavras não avisava que o texto passou do limite (só ao tocar em Publicar) | corrigido (135 + css 48) |

## Detalhes

### QC01 — duas abas no mesmo rascunho (Alta)
- Passos: abrir o mesmo rascunho em duas abas; escrever na aba 1 (salva sozinho); ir para a aba 2 (parada) e fechá-la.
- Esperado: o texto novo da aba 1 continua no rascunho.
- Obtido: a aba 2 salvava ao ficar escondida/fechar (com data nova) e apagava o que foi escrito na aba 1, no aparelho e no banco.
- Correção: o rascunho só é regravado quando muda naquela aba (abrir e fechar sem mexer também não muda mais a data);
  se outra aba salvar o mesmo rascunho e esta não tiver mudança, esta passa a mostrar o texto novo ("Rascunho atualizado
  com o que você escreveu na outra aba."); se as duas mudaram, avisa que o que for salvo ali fica valendo.

### QC02 — a sessão cai com o editor aberto (Alta)
- Passos: escrever; a sessão termina (token vencido, saída em outro aparelho); continuar escrevendo; entrar de novo.
- Esperado: o texto continua no rascunho da pessoa.
- Obtido: o autosave passava a gravar em `prumo-ed132-rasc:null`; depois de entrar, Minhas colunas mostrava a versão de
  antes da queda (o resto ficava numa gaveta que nenhuma conta abre).
- Correção: a gaveta é a de quem estava escrevendo; aviso "Sua sessão terminou. O texto continua guardado neste
  aparelho; entre de novo para publicar."

### QC03 — colar do Word perdia negrito e itálico (Média)
- Passos: copiar do Word um parágrafo com negrito e itálico e colar no editor.
- Esperado: `<strong>` e `<em>`.
- Obtido: texto sem formatação. O Word manda `<b style='mso-bidi-font-weight:normal'>`; a regra que desliga o negrito
  do invólucro do Google Docs (`font-weight:normal`) achava "font-weight:normal" dentro de "mso-bidi-font-weight".
- Correção (132): a regra só vale para a propriedade CSS de verdade (começo, `;` ou espaço antes). Sem lookbehind.

### QC04 — sessão expirada ao publicar (Baixa)
- Obtido: "Não deu para publicar agora. O texto continua aqui." Agora: "Sua sessão expirou. Entre de novo para publicar;
  o texto continua guardado neste aparelho." (também ao Salvar uma coluna publicada).

### QC05 — lista dentro do parágrafo; "/" falhava depois da lista (Média)
- Passos: "/lista" › Enter, escrever itens, Enter duas vezes para sair, digitar "/cit".
- Esperado: abre o menu e vira citação.
- Obtido: o Chrome criava `<p><ul>…</ul><p>/cit</p></p>`; o "/cit" ficava como texto e a barra não marcava "Lista". (O
  HTML salvo saía certo, porque a lista branca refaz a estrutura; o problema era só dentro do editor.)
- Correção: o parágrafo que fica com blocos dentro é desfeito na hora (e a linha que o Chrome cria como `<div>` vira `<p>`).

### QC06 — fio do X com post acima de 280 (Baixa)
- Intertítulo (H2/H3) maior que um post entrava inteiro num post só. Agora é quebrado como os parágrafos (133).

### QC07 — contagem sem aviso de limite (Baixa)
- Com mais de 40.000 caracteres (6.000 sem a v9) a contagem passa a dizer "passou do limite de 40.000 caracteres", em vermelho.

## Conferido e sem problema
- Abrir o editor (≈0,5 s) e publicar (≈0,1–0,3 s) com CPU 4×; colar 40 mil caracteres ≈0,3 s dentro da página.
- Sem rolagem lateral a 360/390/430/1280 px no editor, na prévia, na página da coluna, no painel de números e nas folhas,
  mesmo com palavra sem espaços e link de 260 caracteres. Modo escuro no editor e na leitura.
- Botões com rótulo (editor, Minhas colunas, exportar, números) e foco visível na barra.
- Voltar do Android: com a folha do link aberta fecha só a folha; no editor fecha sem sair do app e guarda o texto.
- Teclado: a barra de formatação acompanha a área visível (`visualViewport`).
- Sem internet: "Salvo neste aparelho"; quando volta, o rascunho sobe para o banco no próximo salvamento.
- Agendada: Carla não vê (banco e app) até a hora; depois vê, e a série mostra anterior/próxima. O Feed de quem lê
  recarrega a cada 3 min e ao voltar para o app, então a coluna agendada aparece sozinha.
- Banco só até a v12: rascunhos no banco e publicar funcionam; nada chama as funções da v13; "Leitores", "mais lidas"
  e o resto da v13 somem sem erro.

## Ficou aberto (não é bug; para decidir depois)
- Foto enorme (6000×4000) é reduzida para 1.600 px antes de subir (~100 KB) — ok; não há aviso de progresso além do
  "Enviando a foto…".
- Restaurar uma versão do histórico não traz de volta as hashtags daquela versão (o histórico não guarda o texto do post).
