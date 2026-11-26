# Edição fixa dos testes

Cópia dos dados do site (feed.json, indicadores.json, fotos-arquivo.json, novidades.json, oficiais.json, placares.json
e series/) tirada em 25/11/2026 às 23h. A bateria (`fonte/testar.sh`) usa estes arquivos no lugar dos do dia, para que
um teste só fique vermelho quando o APP quebrar, nunca porque a notícia do dia mudou.

- Não atualize esta pasta a cada rodada. Só troque a edição quando o FORMATO do feed mudar (campo novo que o app passa
  a usar) e, nesse caso, rode a bateria inteira antes de publicar.
- `PRUMO_EDICAO_DO_DIA=1 bash testar.sh <teste>` roda um teste com a edição de hoje (útil para investigar).
