#!/bin/bash
# Bateria completa para o GitHub Actions (.github/workflows/testes.yml). Roda o testar.sh; o que falhar roda de novo
# uma vez (alguns testes oscilam); só reprova se falhar duas vezes. Os que dependem do relógio não reprovam.
cd "$(dirname "$0")"
RELOGIO="review2/t_etapa28 review2/t_ig_figurinhas"
bash testar.sh 2>&1 | tee ci-1.txt
st=${PIPESTATUS[0]}
n=$(grep -cE '^[a-z0-9_/]+: [0-9]+ ok' ci-1.txt)
# 20/11: se a montagem do site falhar (ex.: faltou a biblioteca acorn do peso/dividir.js), o testar.sh sai antes de
# rodar qualquer teste; antes disso o resultado era "Testes: 0 / Tudo certo". Agora reprova.
if [ "$n" -lt 50 ]; then
  { echo "Testes: $n"; echo "FALHOU: a bateria não rodou (testar.sh saiu com $st antes dos testes; veja o começo do log)"; } | tee ci-resultado.txt
  exit 1
fi
falhas=$(grep -E "FAIL|Error" ci-1.txt | grep -E "^[a-z0-9_/]+: " | cut -d: -f1)
reprova=""; avisos=""
for t in $falhas; do
  if echo " $RELOGIO " | grep -q " $t "; then avisos="$avisos $t"; continue; fi
  echo "== de novo: $t"
  full=$(DETALHE=1 bash testar.sh "$t" 2>&1); out=$(echo "$full" | grep -E "^$t: "); echo "$full" | grep "^    | "
  echo "$out"
  if echo "$out" | grep -qE "FAIL|Error"; then reprova="$reprova $t"; fi
done
{
  echo "Testes: $(grep -cE '^[a-z0-9_/]+: [0-9]+ ok' ci-1.txt)"
  [ -n "$avisos" ] && echo "Dependem do relógio (não reprovam):$avisos"
  [ -n "$reprova" ] && { echo "FALHARAM duas vezes:$reprova"; grep -E "FAIL|Error" ci-1.txt | grep -E "^($(echo $reprova | tr ' ' '|')): " | cut -c1-400; }
  [ -z "$reprova" ] && echo "Tudo certo."
} | tee ci-resultado.txt
[ -z "$reprova" ]
