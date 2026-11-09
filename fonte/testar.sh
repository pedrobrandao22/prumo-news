#!/usr/bin/env bash
# Roda todos os testes automáticos do app (uns 25 minutos). Uso: bash testar.sh [nome-do-teste ...]
# Precisa: Python 3, Node 18+, `npm install` nesta pasta e o Chromium do Playwright.
cd "$(dirname "$0")"
REPO="${PRUMO_REPO:-$(cd .. && pwd)}"
python3 build.py https://teste.supabase.co sb_publishable_teste123 >/dev/null || exit 1
rm -f site/indicadores.json site/novidades.json site/fotos-arquivo.json
# cópias (não links): alguns testes gravam dados de teste em site/acervo e site/series, que não podem cair no repositório
dados_repo(){  # fotos do acervo (fotos-arquivo.json aponta para elas) e séries dos gráficos; recopiados antes de cada teste
  [ -d "$REPO/acervo" ] && { rm -rf site/acervo; cp -r "$REPO/acervo" site/acervo; }
  [ -d "$REPO/series" ] && { rm -rf site/series; cp -r "$REPO/series" site/series; }; true; }
dados_repo
python3 build.py --saida site-semconfig >/dev/null  # versão sem login (t_leitura)
LISTA="${*:-t_social t_leitura t_leva1 t_leva2 t_leva3 review2/t_etapa1 review2/t_etapa2 review2/t_etapa3 review2/t_etapa4 review2/t_etapa5 review2/t_cache review2/t_etapa6 review2/t_etapa7 review2/t_etapa8 review2/t_etapa9 review2/t_etapa10 review2/t_etapa12 review2/t_etapa13 review2/t_etapa14 review2/t_etapa15 review2/t_etapa16 review2/t_etapa17 review2/t_etapa18 review2/t_etapa19 review2/t_etapa20 review2/t_etapa22 review2/t_etapa23 review2/t_etapa26 review2/t_etapa27 review2/t_etapa28 review2/t_etapa29 review2/t_etapa31 review2/t_etapa32 review2/t_etapa33 review2/t_etapa36 review2/t_etapa38 review2/t_etapa39 review2/t_etapa40 review2/t_etapa41 review2/t_etapa42 review2/t_etapa43 review2/t_etapa44 review2/t_etapa45 review2/t_etapa46 review2/t_etapa47 review2/t_etapa48 review2/t_etapa52 review2/t_etapa53 review2/t_etapa54 review2/t_etapa60 review2/t_etapa61 review2/t_etapa62 review2/t_etapa63 review2/t_etapa65 review2/t_etapa67 review2/t_etapa68 review2/t_etapa69 review2/t_etapa70 review2/t_etapa71 review2/t_etapa72 review2/t_etapa73 review2/t_etapa75 review2/t_etapa76 review2/t_revisao_0211 review2/t_etapa77 review2/t_ig_publicar review2/t_ig_figurinhas review2/t_ig_fotos review2/t_ig_reels review2/t_semreels review2/t_ver_stories review2/t_ver_posts review2/t_criacao2 review2/t_criacao_noticia review2/t_desempenho review2/t_qa_conversas review2/t_qa_feed review2/t_qa_stories review2/t_qa_leitura review2/t_foco_noticia review2/t_pendencias review2/t_qa_producao review2/t_foco_noticia2 review2/t_qa_producao2 review2/t_sqlv8 review2/t_v8_app review2/t_v8_semv8 review2/t_sqlv9 review2/t_v9_app review2/t_v9_semv9 review2/t_hashtags review2/t_acervo review2/t_visual_novo review2/t_fase2 review2/t_revisao_a review2/t_revisao_b review2/t_revisao_c review2/t_ajustes_117 review2/t_placar_oficial review2/t_feed_leve review2/t_testes_a review2/t_testes_b review2/t_decisoes_122 review2/t_qa_noite_c review2/t_notificacoes review2/t_sqlv10 review2/t_push_logica review2/t_v10_semv10 review2/t_qa_noite_b review2/t_qa_noite_a review2/t_melhoria_20261104 review2/t_decisoes_0411 review2/t_atividade_junta review2/t_editor_coluna review2/t_colunas_exportar review2/t_colunas_leitores review2/t_qa_colunas review2/t_colunas_publicas review2/t_criacao_coluna review2/t_editor_celular review2/t_teclado_app review2/t_seguranca_banco review2/t_telemetria review2/t_abertura_estavel review2/t_safari_geral review2/t_melhoria_20261106 review2/t_sqlv6 review2/t_sqlv5 review2/t_semv5 review2/t_sqlvelho review2/t_sw review2/t_sw2}"
for t in $LISTA; do
  python3 build.py https://teste.supabase.co sb_publishable_teste123 >/dev/null
  dados_repo
  out=$(timeout 400 node $t.js 2>&1); n=$(echo "$out" | grep -c "^ok "); fl=$(echo "$out" | grep "^FAIL\|Error" | head -3 | tr '\n' ' ')
  echo "$t: $n ok $fl"
  [ -n "$DETALHE" ] && [ -n "$fl" ] && echo "$out" | grep -v "^ok " | tail -25 | sed "s/^/    | /"
done
echo FIM
