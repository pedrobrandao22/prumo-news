#!/usr/bin/env bash
# Roda todos os testes automáticos do app (uns 25 minutos). Uso: bash testar.sh [nome-do-teste ...]
# Precisa: Python 3, Node 18+, `npm install` nesta pasta e o Chromium do Playwright.
cd "$(dirname "$0")"
# 26/11: EDIÇÃO FIXA. Até 25/11 os testes liam o feed.json, o indicadores.json e o fotos-arquivo.json do dia (raiz do
# repositório) e a bateria ficava vermelha quase toda noite por causa do CONTEÚDO (o título do dólar mudou, a edição
# veio sem quiz...), sem nada errado no app. Agora os dados vêm de fonte/edicao-teste/ (uma edição guardada): monta-se
# uma "raiz de teste" (.repo-teste) igual à do repositório, por links, com os arquivos da edição fixa por cima, e os
# testes usam essa raiz (U.REPO). PRUMO_EDICAO_DO_DIA=1 volta a usar a edição de hoje; PRUMO_REPO=<pasta> usa outra raiz.
if [ -z "$PRUMO_REPO" ] && [ -z "$PRUMO_EDICAO_DO_DIA" ] && [ -d edicao-teste ]; then
  SOMBRA="$(pwd)/.repo-teste"; rm -rf "$SOMBRA"; mkdir -p "$SOMBRA"
  for f in ../*; do ln -s "$(cd "$(dirname "$f")" && pwd)/$(basename "$f")" "$SOMBRA/$(basename "$f")"; done
  for f in edicao-teste/*; do n="$(basename "$f")"; [ "$n" = LEIA.md ] && continue; rm -rf "$SOMBRA/$n"; cp -r "$f" "$SOMBRA/$n"; done
  export PRUMO_REPO="$SOMBRA"
fi
REPO="${PRUMO_REPO:-$(cd .. && pwd)}"
python3 build.py https://teste.supabase.co sb_publishable_teste123 >/dev/null || exit 1
rm -f site/indicadores.json site/novidades.json site/fotos-arquivo.json
# cópias (não links): alguns testes gravam dados de teste em site/acervo e site/series, que não podem cair no repositório
dados_repo(){  # fotos do acervo (fotos-arquivo.json aponta para elas) e séries dos gráficos; recopiados antes de cada teste
  [ -d "$REPO/acervo" ] && { rm -rf site/acervo; cp -rL "$REPO/acervo" site/acervo; }
  [ -d "$REPO/series" ] && { rm -rf site/series; cp -rL "$REPO/series" site/series; }; true; }
dados_repo
python3 build.py --saida site-semconfig >/dev/null  # versão sem login (t_leitura)
LISTA="${*:-t_social t_leitura t_leva1 t_leva2 t_leva3 review2/t_etapa1 review2/t_etapa2 review2/t_etapa3 review2/t_etapa4 review2/t_etapa5 review2/t_cache review2/t_etapa6 review2/t_etapa7 review2/t_etapa8 review2/t_etapa9 review2/t_etapa10 review2/t_etapa12 review2/t_etapa13 review2/t_etapa14 review2/t_etapa15 review2/t_etapa16 review2/t_etapa17 review2/t_etapa18 review2/t_etapa19 review2/t_etapa20 review2/t_etapa22 review2/t_etapa23 review2/t_etapa26 review2/t_etapa27 review2/t_etapa28 review2/t_etapa29 review2/t_etapa31 review2/t_etapa32 review2/t_etapa33 review2/t_etapa36 review2/t_etapa38 review2/t_etapa39 review2/t_etapa40 review2/t_etapa41 review2/t_etapa42 review2/t_etapa43 review2/t_etapa44 review2/t_etapa45 review2/t_etapa46 review2/t_etapa47 review2/t_etapa48 review2/t_etapa52 review2/t_etapa53 review2/t_etapa54 review2/t_etapa60 review2/t_etapa61 review2/t_etapa62 review2/t_etapa63 review2/t_etapa65 review2/t_etapa67 review2/t_etapa68 review2/t_etapa70 review2/t_etapa71 review2/t_etapa72 review2/t_etapa73 review2/t_etapa75 review2/t_etapa76 review2/t_revisao_0211 review2/t_etapa77 review2/t_ig_publicar review2/t_ig_figurinhas review2/t_ig_fotos review2/t_camera_story review2/t_semreels review2/t_ver_stories review2/t_ver_posts review2/t_criacao2 review2/t_criacao_noticia review2/t_desempenho review2/t_qa_conversas review2/t_qa_feed review2/t_qa_stories review2/t_qa_leitura review2/t_foco_noticia review2/t_pendencias review2/t_qa_producao review2/t_foco_noticia2 review2/t_qa_producao2 review2/t_sqlv8 review2/t_v8_app review2/t_v8_semv8 review2/t_sqlv9 review2/t_v9_app review2/t_v9_semv9 review2/t_hashtags review2/t_acervo review2/t_visual_novo review2/t_fase2 review2/t_revisao_a review2/t_revisao_b review2/t_revisao_c review2/t_ajustes_117 review2/t_placar_oficial review2/t_feed_leve review2/t_testes_a review2/t_testes_b review2/t_decisoes_122 review2/t_qa_noite_c review2/t_notificacoes review2/t_sqlv10 review2/t_push_logica review2/t_v10_semv10 review2/t_qa_noite_b review2/t_qa_noite_a review2/t_melhoria_20261104 review2/t_decisoes_0411 review2/t_atividade_junta review2/t_editor_coluna review2/t_colunas_exportar review2/t_colunas_leitores review2/t_qa_colunas review2/t_colunas_publicas review2/t_criacao_coluna review2/t_editor_celular review2/t_teclado_app review2/t_seguranca_banco review2/t_telemetria review2/t_abertura_estavel review2/t_safari_geral review2/t_giro_cartao review2/t_arroba_criador review2/t_colunas_leves review2/t_offline_primeira review2/t_melhoria_20261106 review2/t_melhoria_20261109 review2/t_melhoria_20261111 review2/t_melhoria_20261120 review2/t_site_real_150 review2/t_criar_caixa review2/t_busca_1511 review2/t_feed_1511 review2/t_capa_1511 review2/t_conta_1511 review2/t_fotos_1511 review2/t_criar_1511 review2/t_materia_1511 review2/t_corretor_1611 review2/t_silenciar_1611 review2/t_foto_caixa_1611 review2/t_conversas_1611 review2/t_corretor_1611b review2/t_corretor_1611c review2/t_corretor_1711 review2/t_corretor_1711b review2/t_perfil_r2 review2/t_criar_r2 review2/t_feed_r2 review2/t_fotos_r2 review2/t_desempenho_r2 review2/t_pre_capa review2/t_colunas_f6 review2/t_ponta_a_ponta review2/t_madrugada_1911 review2/t_madrugada_1911b review2/t_tarde_1911 review2/t_tarde_1911b review2/t_capa_r2 review2/t_formatos_f1 review2/t_coberturas_f1 review2/t_uso_f1 review2/t_seguir_f1 review2/t_datas_f2 review2/t_numeros_f2 review2/t_rapidas_f2 review2/t_fotos_f2 review2/t_corretor_1811 review2/t_corretor_1811b review2/t_corretor_1811c review2/t_corretor_1811d review2/t_corretor_1911 review2/t_corretor_1911b review2/t_corretor_1911c review2/t_corretor_2011 review2/t_corretor_2011b review2/t_corretor_2011c review2/t_corretor_2111 review2/t_corretor_2111b review2/t_corretor_2111c review2/t_corretor_2111d review2/t_corretor_2211 review2/t_corretor_2211b review2/t_corretor_2211c review2/t_travamento_perfil review2/t_sqlv6 review2/t_sqlv5 review2/t_semv5 review2/t_sqlvelho review2/t_sw review2/t_sw2 review2/t_revisao_2011 review2/t_madrugada_2111 review2/t_zerar_2511 review2/t_zerar_2511b}"
for t in $LISTA; do
  # 21/11: um teste deixava site/feed-leve.json (e feed-det/, m/) e os seguintes liam a edição dele em vez do feed.json
  rm -rf site/feed-leve.json site/feed-det site/m site/parte2-mapa.json site/indicadores.json site/novidades.json site/fotos-arquivo.json
  python3 build.py https://teste.supabase.co sb_publishable_teste123 >/dev/null
  dados_repo
  out=$(timeout 400 node $t.js 2>&1); n=$(echo "$out" | grep -c "^ok "); fl=$(echo "$out" | grep "^FAIL\|Error" | head -3 | tr '\n' ' ')
  echo "$t: $n ok $fl"
  [ -n "$DETALHE" ] && [ -n "$fl" ] && echo "$out" | grep -v "^ok " | tail -25 | sed "s/^/    | /"
done
echo FIM
