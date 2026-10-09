# Auditoria gradual das questões

Última atualização: 09/10/2026

## Estado atual

- Conteúdo analisado: 82 aulas e 527 questões.
- Auditoria estrutural: 0 erros; sem IDs duplicados, numeração duplicada ou fragmentos de questão seguinte.
- Auditoria de contradições evidentes: 0 alertas.
- Validação: 0 erros e 0 avisos.
- Publicação verificada no Cloudflare Pages: `https://caderno-mestre-queimados.pages.dev/`.

## Lotes concluídos

- Aula 1: corrigida a numeração duplicada das questões 6 a 11.
- Aula 7: completada a base legal da questão sobre responsabilidade por infrações e denúncia espontânea (CTN, arts. 136 e 138).
- Aula 35 de Língua Portuguesa: corrigidas as bases legais das questões de recuperação sobre decadência e lançamento (CTN, arts. 173 e 142).
- Aula 40: corrigida a questão 1, que estava com texto deslocado, numeração incorreta e gabarito incompatível com o art. 134 do CTN.
- Aula 41: corrigida a base legal da questão sobre preferência do crédito tributário (CTN, arts. 186 e 187); o gabarito foi mantido.
- Aula 43: corrigido o gabarito da questão sobre faculdades fiscalizatórias; exigir livros e documentos é a alternativa compatível com o CTM, art. 122, § 1º, I.
- Aulas 75 a 79: removidos fragmentos de questões seguintes anexados indevidamente às alternativas.
- Aula 77: corrigida a base legal da questão sobre bens indivisos para o CTM, art. 332, § 2º; o gabarito foi mantido.
- Pós-sincronização: criada a etapa idempotente `repair-content`, executada pelo build e pelo GitHub Actions, para preservar essas correções auditadas quando o documento do Drive for reimportado.
- Lote Aulas 1–10: corrigidas 34 referências legais deslocadas ou genéricas, incluindo CTN arts. 113, 121, 133, 138, 147, 149, 150, 151, 156, 175, 183, 185, 186 e 187 e Constituição Federal, art. 150; também corrigidos um trecho truncado de alternativa e o erro de digitação “autoridad8e”.
- Lote Aulas 11–18: corrigidas bases legais de competência, IPTU, ITBI, ISS, taxas, contribuição de melhoria, dívida ativa, certidões e processo administrativo; removidos cinco trechos de instrução anexados às alternativas finais. Os gabaritos do lote foram mantidos após a conferência.
- Lote Aulas 19–36: corrigido o gabarito da questão 8 da Aula 29 (parcelamento, remissão e anistia); corrigidas as bases legais das questões 7 a 10 da Aula 34; corrigida a base legal da questão cumulativa da Aula 36. Também removidos dois fragmentos de recuperação anexados a alternativas. As Aulas 19–28 não possuem questões estruturadas no JSON atual.
- Lote Aulas 37–47: corrigido o gabarito da questão 1 da Aula 46, de 5 para 3 testemunhas, conforme o art. 154 do CTM e o texto da própria aula; corrigidas bases legais específicas de suspensão, extinção, responsabilidade, dívida ativa, processo administrativo e IPTU; removidos fragmentos de instruções das Aulas 39 e 40. A Aula 43 foi conferida e manteve seus gabaritos.
- Lote Aulas 63–69: corrigidos gabaritos nas Aulas 65, 66, 67 e 68 — utilização efetiva ou potencial da TSU, preço público da remoção especial, valor da iluminação, redução ambiental, faixas de atraso do ISS, cálculo por testada e relação do alvará com a licença. As bases legais do bloco foram especificadas pelos arts. 280 a 299 do CTM. As Aulas 63, 64 e 69 foram conferidas sem contradição de gabarito.
- Lote Aulas 70–79: corrigido o gabarito da Aula 75, questão 2, de 474,20 para 7,8093 UFIR (a multa de 474,20 é específica por veículo não licenciado); especificadas as bases legais das Aulas 70–76; reconstruído o enunciado truncado da Aula 76, questão 14, com base no art. 327, § 3º, IV; e removidos fragmentos de questões seguintes das explicações. As Aulas 77–79 foram conferidas quanto às relações entre obra, valorização, edital, impugnação e limites da contribuição de melhoria.
- Aula 80: preenchidos os 20 gabaritos comentados que estavam deliberadamente sem resposta no documento-fonte, usando a redação dos arts. 343 a 346, os cálculos apresentados e as regras de recuperação das Aulas 77–79. A distinção entre teto anual de 3%, limite total/individual, multa de 30% e juros de 1% foi registrada em cada questão.

## Critérios aplicados

Cada lote é comparado entre enunciado, alternativas, gabarito, explicação, base legal e aula de origem. Alterações só são feitas quando há contradição textual clara ou fundamento oficial verificável; depois são executados `audit-content`, `validate-content`, build e publicação.
