# Prumo News

App de notícias do Prumo. Site: https://prumonews.com.br

- `index.html` — o app (login e dados no Supabase; só a chave publicável fica aqui).
- `feed.json` — a edição atual, gravada pelas rodadas automáticas.
- `rodadas.json` — registro das rodadas do dia.
- `erros-abertos.json` — avisos de "Achei um erro" (sem nome), copiados a cada 30 min.
- `erros-respostas.json` — o que as rodadas responderam a cada aviso.
- `indicadores.json` — dólar, Ibovespa, Selic, IPCA e desemprego, gravados de hora em hora (dias úteis) pelo GitHub.
- `novidades.json` — manchetes novas dos veículos (título e link), gravadas de hora em hora pelo GitHub; a rodada rápida do Claude só trabalha se houver novidade.
- `tools/` — ferramentas das rodadas: `manual.md` (regras), `aplicar.py`, `validar.py`, `resumo.py`, e os scripts sem IA `virada_auto.py`, `indicadores.py` e `manchetes.py`.

Tarefas automáticas (`.github/workflows/`): virada da meia-noite, indicadores, manchetes e avisos de erro. A apuração e a escrita das notícias ficam com as rodadas do Claude (completa às 6h52 e rápidas ao longo do dia), que publicam aqui.
