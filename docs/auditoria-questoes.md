# Auditoria gradual das questões

Última atualização: 09/10/2026

## Estado atual

- Conteúdo analisado: 82 aulas e 527 questões.
- Auditoria estrutural: 0 erros; sem IDs duplicados, numeração duplicada ou fragmentos de questão seguinte.
- Auditoria de contradições evidentes: 0 alertas.
- Validação: 0 erros.
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

## Pendência deliberada

A Aula 80 contém 20 questões de recuperação sem gabarito e sem comentário porque o documento-fonte as marcou expressamente como recuperação ativa. Elas permanecem sinalizadas para não criar respostas sem evidência legal.

## Critérios aplicados

Cada lote é comparado entre enunciado, alternativas, gabarito, explicação, base legal e aula de origem. Alterações só são feitas quando há contradição textual clara ou fundamento oficial verificável; depois são executados `audit-content`, `validate-content`, build e publicação.
