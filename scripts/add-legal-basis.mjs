import fs from 'node:fs';
import path from 'node:path';

const stop = new Set('a ao aos as com como da das de do dos e em entre essa esse esta este foi foram há na nas no nos o os para pela pelas pelo pelos por que se sem sobre sua suas um uma umas uns ou'.split(' '));
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9%]+/g, ' ');
const words = (value) => new Set(normalize(value).split(/\s+/).filter((word) => word.length > 2 && !stop.has(word)));
const sequence = (value, size) => normalize(value).split(/\s+/).filter(Boolean).reduce((all, _, index, items) => {
  if (index + size <= items.length) all.push(items.slice(index, index + size).join(' '));
  return all;
}, []);

function candidateSentences(blocks) {
  return blocks
    // Quebrar apenas por linha preserva abreviações como “art. 266”.
    .flatMap((block) => String(block.texto ?? '').split(/\n+/))
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length >= 45 && /art\.?\s*\d+/i.test(text));
}

const manualBasis = {
  'direito-tributario-aula-040': {
    4: 'CTN, arts. 135 a 138: o art. 136 estabelece como regra a responsabilidade por infrações independentemente da intenção, ressalvada disposição legal em contrário; os arts. 135, 137 e 138 tratam de hipóteses específicas.',
    5: 'CTN, art. 138: a denúncia espontânea, acompanhada dos requisitos legais, exclui a responsabilidade pela infração antes do início de procedimento administrativo ou medida de fiscalização relacionada.',
    6: 'CTN, art. 138: não se considera espontânea a denúncia apresentada depois do início de procedimento administrativo ou medida de fiscalização relacionados com a infração.',
    7: 'CTN, arts. 133, 135, 136 e 138: o art. 133 trata da aquisição de estabelecimento; o art. 135, do excesso de poderes ou infração; o art. 136, da regra geral sobre infrações; e o art. 138, da denúncia espontânea.',
    10: 'CTN, arts. 130, 133, 135 e 138: a associação incorreta é a que atribui o parcelamento ao art. 138, que trata de denúncia espontânea.',
  },
  'legislacao-tributaria-de-queimados-aula-029': {
    1: 'CTM de Queimados, art. 266, com redação dada pela LC municipal nº 093/2021: o ISS variável é recolhido mensalmente, até o dia 15 do mês subsequente ao faturamento.',
    2: 'CTM de Queimados, arts. 231, parágrafo único, e 232: a NFS-e é instrumento fiscal; a incidência depende da prestação tributável e o contribuinte é o prestador do serviço.',
    3: 'CTM de Queimados, arts. 232 e 233: “Contribuinte é o prestador de serviços” e o tomador pode ser responsável pelo recolhimento do imposto nas hipóteses legais.',
    4: 'CTM de Queimados, arts. 237, § 2º, 250 e 251: o arbitramento da base exige hipótese legal, critérios técnicos e procedimento fiscal motivado; não é escolha livre do agente.',
    5: 'CTM de Queimados, art. 49, e Decreto Municipal nº 3.403/2026, arts. 1º a 3º: a prorrogação excepcional apenas alterou o vencimento das competências de maio e junho de 2026; o próprio decreto afirma que a medida não implica moratória e não concede anistia ou remissão do tributo.',
    6: 'CTM de Queimados, art. 237: “A base de cálculo do imposto é o preço do serviço.”',
    7: 'Constituição Federal, art. 156, § 2º, II: o ITBI compete ao Município da situação do bem, ressalvadas as hipóteses constitucionais.',
    8: 'CTN, art. 151, VI (parcelamento); art. 156, IV (remissão); e art. 175, II (anistia): os institutos produzem, respectivamente, suspensão, extinção e exclusão do crédito tributário.',
  },
};

const lessonArticleRanges = {
  'direito-tributario-aula-001': 'CTN, arts. 3º, 5º, 16, 77, 81 e 113 a 128',
  'direito-tributario-aula-002': 'CTN, arts. 139 a 150, especialmente arts. 142, 147, 148, 149 e 150',
  'direito-tributario-aula-003': 'CTN, art. 151',
  'direito-tributario-aula-004': 'CTN, arts. 156 a 174',
  'direito-tributario-aula-005': 'CTN, arts. 175 a 182',
  'direito-tributario-aula-010': 'Constituição Federal, arts. 150 a 152',
  'direito-tributario-aula-011': 'Constituição Federal, arts. 145, 153 a 156 e 158',
  'direito-tributario-aula-012': 'CTN, arts. 32 a 34',
  'direito-tributario-aula-013': 'CTN, arts. 35 a 42 e Constituição Federal, art. 156, II',
  'direito-tributario-aula-014': 'Lei Complementar nº 116/2003, arts. 1º a 8º',
  'direito-tributario-aula-015': 'CTN, arts. 77 a 80 e Constituição Federal, art. 145, II',
  'direito-tributario-aula-016': 'CTN, arts. 81 e 82',
  'direito-tributario-aula-017': 'CTN, arts. 194 a 208',
  'direito-tributario-aula-018': 'CTN, arts. 151, 156 e 175 e CTM de Queimados, arts. 154 a 165',
  'direito-tributario-aula-037': 'CTN, arts. 151, 156 e 175',
  'direito-tributario-aula-038': 'CTN, arts. 121 a 135',
  'direito-tributario-aula-039': 'CTN, arts. 129 a 133',
  'direito-tributario-aula-044': 'CTM de Queimados, arts. 130 a 137',
  'direito-tributario-aula-067': 'CTM de Queimados, arts. 280 a 292',
  'direito-tributario-aula-072': 'arts. 311 a 316',
  'direito-tributario-aula-073': 'arts. 317 a 322',
  'direito-tributario-aula-074': 'arts. 323 a 326',
  'direito-tributario-aula-075': 'art. 327 e regras correlatas indicadas na aula',
  'direito-tributario-aula-076': 'art. 327, § 3º',
  'direito-tributario-aula-077': 'arts. 328 a 333 e CTN, art. 81',
  'direito-tributario-aula-078': 'arts. 334 a 337 e CTN, art. 81',
  'direito-tributario-aula-079': 'arts. 338 a 342',
};

manualBasis['direito-tributario-aula-008'] = {
  5: 'CTN, arts. 134 e 135: a responsabilidade de terceiros depende das condições legais; a responsabilidade pessoal do art. 135 exige excesso de poderes ou infração de lei, contrato social ou estatutos.',
};
manualBasis['direito-tributario-aula-039'] = {
  3: 'CTN, art. 131, II: o espólio responde pelos tributos devidos pelo de cujus até a data da abertura da sucessão.',
  5: 'CTN, art. 133, I: o adquirente que continuar a exploração responde integralmente pelos tributos relativos ao estabelecimento, quando o alienante cessar a exploração da atividade.',
};
manualBasis['direito-tributario-aula-045'] = {
  2: 'CTM de Queimados, art. 143: qualquer pessoa pode representar o sujeito passivo nas condições legais do processo tributário.',
  8: 'CTM de Queimados, art. 152: a defesa contra auto de infração ou auto de apreensão deve ser apresentada no prazo de 15 dias.',
};
manualBasis['direito-tributario-aula-063'] = {
  11: 'CTM de Queimados, art. 265: o prazo revisado para a comunicação indicada na questão é de 20 dias.',
};
manualBasis['direito-tributario-aula-066'] = {
  10: 'CTM de Queimados, art. 291: a taxa referente aos bens apreendidos é paga de uma só vez, antes da liberação.',
};
manualBasis['direito-tributario-aula-069'] = {
  1: 'CTM de Queimados, art. 294: a licença alcança as atividades previstas no dispositivo; transmissão onerosa de imóvel não integra esse rol.',
  6: 'CTM de Queimados, arts. 294 e 297, com a redação alterada pela LC nº 026/2005: as licenças dos demais incisos do art. 294 seguem o prazo do alvará, não superior a um ano.',
};
manualBasis['direito-tributario-aula-071'] = {
  4: 'CTM de Queimados, art. 308: anúncios referentes a fumo em geral recebem o tratamento previsto no dispositivo.',
  11: 'CTM de Queimados, art. 310: a execução de obra sujeita à regra do dispositivo exige prévio pedido de licença e pagamento da taxa devida.',
  12: 'CTM de Queimados, art. 280, VII: atraso de 61 a 90 dias no ISS corresponde à multa de 40%, conforme a escala estudada.',
};
manualBasis['direito-tributario-aula-074'] = {
  15: 'CTM de Queimados, arts. 318 e 322: a isenção da taxa do comércio informal não dispensa a inscrição do contribuinte.',
};
manualBasis['direito-tributario-aula-075'] = {
  17: 'CTM de Queimados, art. 322: a isenção da Taxa de Licença do comércio informal não exime o contribuinte da inscrição junto ao Fisco.',
};
manualBasis['direito-tributario-aula-077'] = {
  1: 'CTM de Queimados, art. 328: a contribuição de melhoria tem como hipótese a realização de obra pública, observados os requisitos legais e a valorização imobiliária exigida pelo CTN, art. 81.',
  3: 'CTM de Queimados, art. 328, parágrafo único, e CTN, art. 81: pavimentação de vias públicas integra o rol de obras previsto, desde que presente a valorização imobiliária e os demais requisitos legais.',
  7: 'CTM de Queimados, art. 329, e CTN, art. 81: o limite total da contribuição de melhoria é a despesa realizada com a obra, sem prejuízo do limite individual da valorização de cada imóvel.',
  18: 'CTM de Queimados, art. 333, e CTN, art. 81: a contribuição de melhoria constitui ônus real que acompanha o imóvel após a transmissão, conforme a disciplina legal.',
};
manualBasis['direito-tributario-aula-078'] = {
  4: 'CTM de Queimados, art. 335, e CTN, art. 81: a proposta técnica das zonas de influência e dos índices é elaborada pela comissão designada e submetida à aprovação prevista no Código.',
  8: 'CTM de Queimados, arts. 336 e 337: a base de cálculo considera o custo da obra nos termos do Código, e a variável C representa o custo da obra a ser ressarcido.',
};
manualBasis['direito-tributario-aula-040'] = {
  3: 'CTN, art. 136: a responsabilidade por infrações independe da intenção do agente ou responsável, salvo disposição legal em contrário.',
  4: 'CTN, arts. 135 a 138: o art. 136 estabelece como regra a responsabilidade por infrações independentemente da intenção, ressalvada disposição legal em contrário; os arts. 135, 137 e 138 tratam de hipóteses específicas.',
  5: 'CTN, art. 138: a denúncia espontânea, acompanhada dos requisitos legais, exclui a responsabilidade pela infração antes do início de procedimento administrativo ou medida de fiscalização relacionada.',
  6: 'CTN, art. 138: não se considera espontânea a denúncia apresentada depois do início de procedimento administrativo ou medida de fiscalização relacionados com a infração.',
  7: 'CTN, arts. 133, 135, 136 e 138: o art. 133 trata da aquisição de estabelecimento; o art. 135, do excesso de poderes ou infração; o art. 136, da regra geral sobre infrações; e o art. 138, da denúncia espontânea.',
  10: 'CTN, arts. 130, 133, 135 e 138: a associação incorreta é a que atribui o parcelamento ao art. 138, que trata de denúncia espontânea.',
};

manualBasis['legislacao-tributaria-de-queimados-aula-043'] = {
  2: 'CTM de Queimados, art. 122: a fiscalização alcança todas as pessoas sujeitas ao cumprimento de obrigações tributárias, inclusive imunes e isentas.',
  3: 'CTM de Queimados, art. 122, § 1º, I: a autoridade fiscal pode exigir, a qualquer tempo, a exibição de livros comerciais e fiscais e documentos em geral.',
  4: 'CTM de Queimados, art. 123: mediante intimação escrita, terceiros devem prestar as informações de que disponham sobre bens, negócios ou atividades de outros, ressalvados os segredos legalmente protegidos.',
  5: 'CTM de Queimados, art. 123: a obrigação de informar não alcança fatos sobre os quais o informante esteja legalmente obrigado a guardar segredo.',
  6: 'CTM de Queimados, art. 124: informações obtidas pela fiscalização em razão do ofício estão protegidas por sigilo, nas hipóteses e exceções previstas no Código.',
  7: 'CTM de Queimados, art. 126: a autoridade fiscal que proceder ou presidir exames e diligências deve lavrar os termos necessários para documentar o procedimento.',
  10: 'CTM de Queimados, arts. 121, 122, 124 e 126: a alternativa incorreta é a que atribui ao art. 126 uma isenção tributária, assunto que não pertence ao dispositivo.',
};

manualBasis['direito-tributario-aula-044'] = {
  1: 'CTM de Queimados, art. 128: a omissão não dolosa que possa resultar em evasão de receita enseja notificação preliminar para regularização em 30 dias.',
  2: 'CTM de Queimados, art. 131: nas hipóteses legais, não cabe notificação preliminar e o contribuinte é imediatamente autuado.',
  3: 'CTM de Queimados, art. 131, I: o exercício de atividade tributável sem prévia inscrição é hipótese de autuação imediata.',
  4: 'CTM de Queimados, art. 137, V: o auto de infração deve intimar o autuado para, em 10 dias, pagar tributos e multas ou apresentar defesa e provas.',
  5: 'CTM de Queimados, arts. 137 e 142: requisitos do auto de infração e redução da multa quando o autuado se conforma e paga no prazo de defesa.',
  6: 'CTM de Queimados, art. 137: a assinatura do autuado não implica confissão; a recusa deve ser registrada com duas testemunhas quando cabível.',
  7: 'CTM de Queimados, art. 137: a recusa ou impossibilidade de assinatura deve ser registrada no auto com a identificação de duas testemunhas.',
  8: 'CTM de Queimados, arts. 137 e 138: requisitos do auto de infração e formas de intimação do autuado.',
  9: 'CTM de Queimados, art. 122: a fiscalização alcança todas as pessoas sujeitas a obrigações tributárias, inclusive imunes e isentas.',
  10: 'CTM de Queimados, arts. 121, 122, 124 e 126: a associação incorreta é a que atribui ao art. 126 uma isenção tributária.',
};

manualBasis['direito-tributario-aula-011'] = {
  1: 'Constituição Federal, art. 156: compete aos Municípios instituir IPTU, ITBI e ISS, observadas as regras constitucionais.',
  3: 'Constituição Federal, arts. 145 e 156 a 158: competência tributária municipal e repartição constitucional de receitas.',
  4: 'Constituição Federal, art. 153, VI, e art. 158, II: o ITR é imposto da União, com repartição constitucional de sua arrecadação aos Municípios nas hipóteses previstas.',
  6: 'Constituição Federal, art. 158, IV: pertence aos Municípios parcela do produto da arrecadação do ICMS, nos termos constitucionais.',
};

function chooseBasis(question, lesson) {
  const manual = manualBasis[lesson.id]?.[question.numero];
  if (manual) return manual;
  const questionText = normalize(question.question);
  const precise = [
    [/obrigacao tributaria principal/, 'CTN, art. 113, § 1º'],
    [/transmitir declaracao/, 'CTN, art. 113, § 2º'],
    [/deixa de cumprir obrigacao acessoria/, 'CTN, art. 113, § 3º'],
    [/lancamento faz nascer a obrigacao|lancamento tributario/, 'CTN, art. 142'],
    [/somente hipoteses de suspensao|suspensao da exigibilidade/, 'CTN, art. 151'],
    [/hipoteses de exclusao/, 'CTN, art. 175'],
    [/responsavel tributario/, 'CTN, arts. 121, II, e 128'],
    [/e contribuinte a pessoa/, 'CTN, art. 121, I'],
    [/art\.?\s*134/, 'CTN, art. 134'],
    [/art\.?\s*135/, 'CTN, art. 135'],
    [/art\.?\s*136/, 'CTN, art. 136'],
    [/auto de infracao/, 'CTM de Queimados, art. 137'],
    [/prescricao tributaria/, 'CTN, art. 174'],
    [/decadencia tributaria/, 'CTN, art. 173'],
    [/parcelamento/, 'CTN, art. 151, VI'],
    [/deposito integral/, 'CTN, art. 151, II'],
    [/remissao/, 'CTN, art. 156, IV'],
    [/anistia/, 'CTN, art. 175, II'],
    [/convencoes particulares/, 'CTN, art. 123'],
    [/denuncia espontanea/, 'CTN, art. 138'],
    [/sigilo fiscal/, 'CTN, art. 198'],
    [/divida ativa/, 'CTN, arts. 201 a 204'],
    [/certidao positiva com efeitos de negativa|cpen/, 'CTN, art. 206'],
    [/ipva/, 'Constituição Federal, art. 158, III'],
  ].find(([pattern]) => pattern.test(questionText));
  if (precise) return `${precise[1]} — conferir o comando e a hipótese descrita no texto da aula.`;
  const option = lesson.questoes.find((item) => item.id === question.id)?.options.find((item) => item.id === question.correctAnswer);
  const target = words(`${question.question} ${option?.text ?? ''}`);
  const blocks = lesson.conteudo ?? [];
  const blockScores = blocks.map((block) => {
    const blockText = normalize(`${block.titulo ?? ''} ${block.texto ?? ''}`);
    const blockWords = words(blockText);
    let score = 0;
    for (const word of target) if (blockWords.has(word)) score += 1;
    const titleWords = words(block.titulo ?? '');
    for (const word of target) if (titleWords.has(word)) score += 2;
    for (const phrase of sequence(`${question.question} ${option?.text ?? ''}`, 2)) if (blockText.includes(phrase)) score += 3;
    for (const phrase of sequence(`${question.question} ${option?.text ?? ''}`, 3)) if (blockText.includes(phrase)) score += 5;
    return { block, score };
  }).sort((a, b) => b.score - a.score);
  const selectedBlocks = blockScores.slice(0, 2).map((item) => item.block);
  const candidates = candidateSentences(selectedBlocks);
  let best = null;
  for (const sentence of candidates) {
    const sentenceWords = words(sentence);
    let overlap = 0;
    for (const word of target) if (sentenceWords.has(word)) overlap += 1;
    const articleBonus = /art\.?\s*\d+/i.test(sentence) ? 2 : 0;
    const score = overlap + articleBonus;
    if (!best || score > best.score) best = { score, sentence };
  }
  if (!best) {
    const explicit = String(question.question ?? '').match(/\b(CTN\s*,?\s*)?art(?:igo)?s?\.?\s*([0-9]+(?:\s*[,º§IVXLC0-9-]*)?)/i);
    if (explicit) return `${explicit[1] ? 'CTN' : 'CTM de Queimados'}, art. ${explicit[2]} — conferir o trecho correspondente no texto da aula.`;
    const keywordBasis = [
      [/obrigacao principal|obrigacao acessoria|fato gerador|sujeito ativo|sujeito passivo/, 'CTN, arts. 113 a 128'],
      [/lancamento|homologacao|credito tributario/, 'CTN, arts. 139 a 150'],
      [/suspensao da exigibilidade|parcelamento/, 'CTN, art. 151'],
      [/extincao do credito|remissao|pagamento/, 'CTN, art. 156'],
      [/exclusao do credito|anistia/, 'CTN, art. 175'],
      [/iptu/, 'CTN, arts. 32 a 34'],
      [/proprietario de imovel|imovel urbano/, 'CTN, arts. 32 a 34'],
      [/itbi/, 'CTN, arts. 35 a 42 e Constituição Federal, art. 156, II'],
      [/iss/, 'Lei Complementar nº 116/2003, arts. 1º a 8º'],
      [/taxa/, 'CTN, arts. 77 a 80'],
      [/contribuicao de melhoria/, 'CTN, arts. 81 e 82'],
      [/obra publica.*valorizacao|valorizacao.*obra publica/, 'CTN, arts. 81 e 82'],
      [/punicao pela pratica|sancao de ato ilicito/, 'CTN, art. 3º'],
      [/tributo|multa/, 'CTN, arts. 3º, 5º e 113'],
    ].find(([pattern]) => pattern.test(questionText));
    if (keywordBasis) return `${keywordBasis[1]} — conferir o dispositivo aplicado à alternativa no texto da aula.`;
    if (lessonArticleRanges[lesson.id]) return `${lessonArticleRanges[lesson.id]} — conferir o inciso ou parágrafo correspondente no texto da aula.`;
    const topic = lesson.topic ?? lesson.titulo ?? '';
    if (/\barts?\.\s*\d+/i.test(topic)) return `Base legal da aula: ${topic}. O dispositivo específico deve ser conferido no trecho legal correspondente da aula.`;
    return `Consulte a legislação indicada no texto da aula “${lesson.titulo}”.`;
  }
  return best.sentence.length > 420 ? `${best.sentence.slice(0, 417).trim()}…` : best.sentence;
}

const dir = path.resolve('content/aulas');
let updated = 0;
for (const fileName of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
  const file = path.join(dir, fileName);
  const lesson = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const question of lesson.questoes ?? []) {
    if (!question.correctAnswer) continue;
    const basis = chooseBasis(question, lesson);
    if (question.legalBasis !== basis) {
      question.legalBasis = basis;
      updated += 1;
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
}
console.log(`Fundamentações legais atualizadas: ${updated}`);
