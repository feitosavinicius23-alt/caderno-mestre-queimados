/**
 * Tipos semânticos reconhecidos no Caderno Mestre (requisito 23).
 * Cada tipo vira um componente visual próprio na aplicação (requisito 24).
 *
 * NÃO remova tipos: a aplicação faz fallback para "texto" em tipos desconhecidos,
 * mas remover um tipo daqui faz o parser deixar de detectá-lo.
 */
export const BLOCK_TYPES = [
  'teoria',
  'definicao',
  'atencao',
  'cuidado',
  'pegadinha',
  'regra-de-prova',
  'memorize',
  'exemplo',
  'questao',
  'gabarito',
  'gabarito-comentado',
  'revisao',
  'mapa-mental',
  'resumo',
  'lei-seca',
  'caderno-de-erros',
  'fechamento',
  'dica',
  'comparacao',
  'erro-comum',
  'missao-do-dia',
  'tabela',
  'texto',
];

/**
 * Marcadores textuais -> tipo semântico.
 * A detecção é feita sobre o rótulo em MAIÚSCULAS no início de uma linha/heading,
 * sem acento e sem pontuação final.
 */
export const BLOCK_MARKERS = [
  ['MISSAO DIARIA', 'missao-do-dia'],
  ['MISSAO DO DIA', 'missao-do-dia'],
  ['GABARITO COMENTADO', 'gabarito-comentado'],
  ['GABARITO', 'gabarito'],
  ['REGRA DE PROVA', 'regra-de-prova'],
  ['ERRO COMUM', 'erro-comum'],
  ['ERROS COMUNS', 'erro-comum'],
  ['CADERNO DE ERROS', 'caderno-de-erros'],
  ['MAPA MENTAL', 'mapa-mental'],
  ['LEI SECA', 'lei-seca'],
  ['PEGADINHA', 'pegadinha'],
  ['PEGADINHAS', 'pegadinha'],
  ['MEMORIZE', 'memorize'],
  ['DEFINICAO', 'definicao'],
  ['ATENCAO', 'atencao'],
  ['CUIDADO', 'cuidado'],
  ['COMPARACAO', 'comparacao'],
  ['FECHAMENTO', 'fechamento'],
  ['REVISAO', 'revisao'],
  ['RESUMO', 'resumo'],
  ['EXEMPLO', 'exemplo'],
  ['QUESTAO', 'questao'],
  ['QUESTOES', 'questao'],
  ['TEORIA', 'teoria'],
  ['DICA', 'dica'],
  ['ANOTACAO', 'anotacao'],
  ['ANOTACOES', 'anotacao'],
  ['NOTA DO ALUNO', 'anotacao'],
];

/** Blocos que a aplicação deve esconder até o usuário pedir (requisito 26). */
export const HIDDEN_BY_DEFAULT = new Set(['gabarito', 'gabarito-comentado']);
