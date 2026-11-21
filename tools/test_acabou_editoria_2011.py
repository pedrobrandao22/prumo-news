#!/usr/bin/env python3
"""Causa acabou-de-sair-editoria (20/11 noite): a editoria do "Acabou de sair" (novidades.json > novos > secao) vem do
ASSUNTO, não do veículo. Antes, um item do ge ou do InfoMoney num grupo de veículos gerais bastava para pôr crime em
Esportes, Zumbi/COP31 em Economia e decisão do STF em Economia.
  python3 -I tools/test_acabou_editoria_2011.py
"""
import importlib.util, os

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("manchetes", os.path.join(AQUI, "manchetes.py"))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)


def sec(*itens):
    return M.secao_de([{"tk": M.tokens(t), "secao": s} for t, s in itens])


CASOS = [
    # (manchetes do grupo com a seção do feed de origem, editoria certa)
    ([("Caso Clarice: suspeito de matar jovem encontrada em mata é preso pela Polícia Civil em RO", None),
      ("Caso Clarice: suspeito de matar jovem é preso em Rondônia", "esportes")], "brasil"),
    ([("Homem é preso 11 anos após matar vítima a facadas durante o Carnaval no MA", None),
      ("Homem é preso 11 anos depois de crime no Carnaval do Maranhão", "esportes")], "brasil"),
    ([("Agressão, tentativa de estupro e aborto forçado: vítimas denunciam médico preso em Fortaleza", "esportes")], "brasil"),
    ([("O que se sabe (e o muito que não se sabe) sobre a história de Zumbi, que inspirou o Dia da Consciência Negra", None),
      ("Zumbi dos Palmares: o que a história conta sobre o líder", None),
      ("Dia da Consciência Negra: quem foi Zumbi", "economia")], None),
    ([("COP31 é prorrogada após impasse sobre combustíveis fósseis", None),
      ("COP31 é prorrogada após impasse sobre combustíveis fósseis", None),
      ("COP31 termina sem acordo e é prorrogada", "economia")], "mundo"),
    ([("Fachin nega soltura de primo de Vorcaro", None),
      ("Fachin nega pedido de liberdade a primo de Vorcaro no caso Master", "economia")], "politica"),
]

# o palpite do veículo continua valendo quando o assunto é mesmo daquela área (sem regressão)
CERTOS = [
    ([("Flamengo vence o Palmeiras e assume a liderança", "esportes"), ("Flamengo bate Palmeiras no Maracanã", None)], "esportes"),
    ([("Final da Sul-Americana: torcida do Boca invade o Caribe colombiano", "esportes"),
      ("Torcida do Boca faz festa antes da final", "esportes"), ("Boca chega a Barranquilla", None)], "esportes"),
    ([("Ibovespa fecha em alta com exterior", "economia"), ("Bolsa sobe e dólar cai", None)], "economia"),
    ([("Motta adia votação na Câmara", "politica"), ("Câmara adia votação", None)], "politica"),
    # só o veículo temático, sem palavra de outra área e maioria do grupo: o palpite vale
    ([("Superliga: Goiás e Montes Claros abrem a rodada", "esportes")], "esportes"),
]


def main():
    erros = []
    for itens, esperado in CASOS + CERTOS:
        got = sec(*itens)
        if got != esperado:
            erros.append(f"{itens[0][0][:60]!r}: {got} (esperado {esperado})")
    # o mecanismo, em geral: com um só item de feed temático no meio de veículos gerais, e o título com palavra de
    # OUTRA área, a editoria nunca é a do feed temático
    for tema, kw in (("esportes", "policia"), ("economia", "trump"), ("esportes", "senado"), ("economia", "enem")):
        got = sec((f"Notícia qualquer sobre {kw} hoje no país", None), (f"Outra manchete com {kw} e detalhes", tema),
                  (f"Mais um veículo geral fala de {kw}", None))
        if got == tema:
            erros.append(f"palpite {tema} venceu a palavra '{kw}'")
    for e in erros: print("FALHOU:", e)
    print(f"{len(CASOS) + len(CERTOS) + 4 - len(erros)}/{len(CASOS) + len(CERTOS) + 4} ok")
    raise SystemExit(1 if erros else 0)


if __name__ == "__main__":
    main()
