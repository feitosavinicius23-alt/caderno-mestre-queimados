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
  'direito-tributario-aula-072': 'arts. 311 a 316',
  'direito-tributario-aula-073': 'arts. 317 a 322',
  'direito-tributario-aula-074': 'arts. 323 a 326',
  'direito-tributario-aula-075': 'art. 327 e regras correlatas indicadas na aula',
  'direito-tributario-aula-076': 'art. 327, § 3º',
  'direito-tributario-aula-077': 'arts. 328 a 333 e CTN, art. 81',
  'direito-tributario-aula-078': 'arts. 334 a 337 e CTN, art. 81',
  'direito-tributario-aula-079': 'arts. 338 a 342',
};

manualBasis['legislacao-tributaria-de-queimados-aula-043'] = {
  3: 'CTM de Queimados, art. 122, § 1º, I: a autoridade fiscal pode exigir, a qualquer tempo, a exibição de livros comerciais e fiscais e documentos em geral.',
};

function chooseBasis(question, lesson) {
  const manual = manualBasis[lesson.id]?.[question.numero];
  if (manual) return manual;
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
    if (lessonArticleRanges[lesson.id]) return `CTM de Queimados, ${lessonArticleRanges[lesson.id]} — conferir o inciso ou parágrafo correspondente no texto da aula.`;
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
