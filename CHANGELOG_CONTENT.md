# CHANGELOG_CONTENT.md

Registro das alterações de **conteúdo** (aulas, questões, disciplinas).
Mudanças de código ficam no histórico do git — este arquivo é só sobre o material de estudo.

Formato de cada entrada:

```
## AAAA-MM-DD — content vN
### Adicionado / Alterado / Removido / Observações
```

---

## 2026-09-27 — content v2

### Alterado

- Reprocessamento de 4 aulas após correção do parser: linhas de mapa mental em CAIXA ALTA
  contendo setas (`FATO GERADOR → OBRIGAÇÃO → LANÇAMENTO`) estavam sendo interpretadas como
  título de seção e perdiam a estrutura de diagrama. Agora viram nós de mapa mental.
- Nenhum texto foi alterado: apenas a classificação dos blocos.

### Observações

- Sincronização incremental funcionando: 4 aulas reescritas, **30 inalteradas**.

---

## 2026-09-27 — content v1

### Adicionado

Importação inicial completa do **Caderno Mestre — Agente Fiscal Queimados 2026**
(Google Doc `17hPAJuQovOshYQGlzFF9-dzUl8kcbqvSD82L-KJPDRY`).

- **34 aulas** (numeradas 1 a 34)
- **129 questões** objetivas (A–D)
- **3 disciplinas**
- **388 blocos** de conteúdo classificados
- 18 mapas mentais · 10 blocos de lei seca · 19 blocos de revisão · 2 missões do dia

| Disciplina | Aulas | Questões |
|---|---|---|
| Direito Tributário | 23 | 121 |
| Legislação Tributária de Queimados | 6 | 8 |
| Receitas Públicas | 5 | 0 |

Aulas importadas:

| # | Título | Disciplina |
|---|---|---|
| 1 | Direito Tributário (conceito de tributo, espécies, obrigação e fato gerador) | Direito Tributário |
| 2 | Crédito Tributário e Lançamento | Direito Tributário |
| 3 | Suspensão da Exigibilidade do Crédito Tributário | Direito Tributário |
| 4 | Extinção do Crédito Tributário | Direito Tributário |
| 5 | Exclusão do Crédito Tributário | Direito Tributário |
| 6 | Garantias e privilégios do crédito tributário | Direito Tributário |
| 7 | Infrações, denúncia espontânea e sanções | Direito Tributário |
| 8 | Responsabilidade tributária: contribuinte, responsável, sucessores e terceiros | Direito Tributário |
| 9 | Prescrição e decadência em profundidade | Direito Tributário |
| 10 | Sistema tributário na Constituição: princípios e limitações ao poder de tributar | Direito Tributário |
| 11 | Competência tributária municipal e repartição de receitas | Direito Tributário |
| 12 | IPTU: incidência, contribuinte, base de cálculo e progressividade | Direito Tributário |
| 13 | ITBI: fato gerador, onerosidade, competência territorial e imunidade | Direito Tributário |
| 14 | ISS: incidência, lista de serviços, local da incidência, base de cálculo e alíquotas | Direito Tributário |
| 15 | Taxas municipais: poder de polícia e serviços públicos | Direito Tributário |
| 16 | Contribuição de melhoria: obra pública, valorização e limites | Direito Tributário |
| 17 | Administração tributária: fiscalização, sigilo fiscal, dívida ativa e certidões | Direito Tributário |
| 18 | Processo administrativo tributário: defesa, impugnação, recursos e julgamento | Direito Tributário |
| 19 | Revisão cumulativa de Direito Tributário municipal | Direito Tributário |
| 20 | Receitas públicas: conceito, classificação e receitas tributárias municipais | Receitas Públicas |
| 21 | Receitas públicas II: correntes, de capital e transferências | Receitas Públicas |
| 22 | Receitas públicas III: estágios da receita | Receitas Públicas |
| 23 | Receitas públicas IV: renúncia de receita e responsabilidade fiscal | Receitas Públicas |
| 24 | Responsabilidade fiscal na receita: instituição, previsão, arrecadação e combate à evasão | Receitas Públicas |
| 25 | Código Tributário de Queimados: estrutura local, legalidade e conexão com a fiscalização | Legislação Tributária de Queimados |
| 26 | Código Tributário de Queimados: IPTU local | Legislação Tributária de Queimados |
| 27 | Código Tributário de Queimados: ITBI local | Legislação Tributária de Queimados |
| 28 | Código Tributário de Queimados: ISS local | Legislação Tributária de Queimados |
| 29 | ISS em Queimados: recolhimento, retenção, NFS-e e arbitramento fiscal | Legislação Tributária de Queimados |
| 30 | Código Tributário de Queimados: taxas municipais | Legislação Tributária de Queimados |
| 31 | Contribuição de melhoria: obra pública, valorização e limites | Direito Tributário |
| 32 | Obrigação tributária: principal, acessória, fato gerador e sujeito passivo | Direito Tributário |
| 33 | Lançamento tributário na fiscalização: constituição, revisão e modalidades | Direito Tributário |
| 34 | Decadência e prescrição tributárias: os dois relógios de 5 anos | Direito Tributário |

### Observações

- **Fidelidade:** 99% dos caracteres do documento preservados (199.367 de 201.803, sem espaços).
  A diferença corresponde aos próprios cabeçalhos de aula, que viram o campo `titulo`.

- **Gabaritos:** das 129 questões, **54 têm gabarito publicado no documento** e
  **75 não têm** — o Caderno Mestre os omite deliberadamente ("SEM GABARITO NESTA ETAPA",
  "NÃO HÁ GABARITO ANTECIPADO") para forçar recuperação ativa. Essas questões foram importadas
  com `gabaritoOculto: true` e `correctAnswer: ""`. **Nenhuma resposta foi inventada.**
  Quando o gabarito for publicado no documento, o próximo sync o preenche automaticamente.

- **Aula 1:** o documento traz um cabeçalho `AULA — OBRIGAÇÃO TRIBUTÁRIA, FATO GERADOR E SUJEITOS`
  sem número, precedido de "Continuação da Aula 1". Foi anexado à Aula 1, como manda o documento,
  em vez de virar uma aula separada.

- **Aulas 16 e 31** têm títulos idênticos no documento (contribuição de melhoria). Ambas foram
  preservadas; a aula 31 recebeu o slug `…-aula-31` para não colidir na URL. Os IDs são distintos.

- **Disciplinas:** o documento declara a disciplina explicitamente só na Aula 1. As demais foram
  inferidas a partir das palavras do próprio título, conforme
  `content/source/_config/disciplinas.json`. Para corrigir alguma, use `porNumero` nesse arquivo
  e rode `npm run import-caderno` — nenhum código precisa mudar.

- **Receitas Públicas** ainda não tem questões com alternativas no documento (as aulas 20–24 usam
  teste cumulativo sem gabarito antecipado em formato aberto).
