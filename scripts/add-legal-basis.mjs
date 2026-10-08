import fs from 'node:fs';
import path from 'node:path';

const stop = new Set('a ao aos as com como da das de do dos e em entre essa esse esta este foi foram há na nas no nos o os para pela pelas pelo pelos por que se sem sobre sua suas um uma umas uns ou'.split(' '));
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9%]+/g, ' ');
const words = (value) => new Set(normalize(value).split(/\s+/).filter((word) => word.length > 2 && !stop.has(word)));

function candidateSentences(blocks) {
  return blocks
    // Quebrar apenas por linha preserva abreviações como “art. 266”.
    .flatMap((block) => String(block.texto ?? '').split(/\n+/))
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text.length >= 45 && /art\.?\s*\d+/i.test(text));
}

function chooseBasis(question, lesson) {
  const option = lesson.questoes.find((item) => item.id === question.id)?.options.find((item) => item.id === question.correctAnswer);
  const target = words(`${question.question} ${option?.text ?? ''}`);
  const candidates = candidateSentences(lesson.conteudo ?? []);
  let best = null;
  for (const sentence of candidates) {
    const sentenceWords = words(sentence);
    let overlap = 0;
    for (const word of target) if (sentenceWords.has(word)) overlap += 1;
    const articleBonus = /art\.?\s*\d+/i.test(sentence) ? 2 : 0;
    const score = overlap + articleBonus;
    if (!best || score > best.score) best = { score, sentence };
  }
  if (!best) return `Consulte a legislação indicada no texto da aula “${lesson.titulo}”.`;
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
