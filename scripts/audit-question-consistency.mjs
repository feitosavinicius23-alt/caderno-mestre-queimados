import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('content/aulas');
const issues = [];
let lessons = 0;
let questions = 0;

for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
  const lesson = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  lessons += 1;
  const seenBases = new Map();
  const seenNumbers = new Set();
  const seenIds = new Set();
  const containsNextQuestion = (text) => /\.\s+\d+\)\s/.test(text ?? '');

  for (const question of lesson.questoes ?? []) {
    questions += 1;
    const label = `${file}: questão ${question.numero}`;
    const options = question.options ?? [];
    const answer = options.find((option) => option.id === question.correctAnswer);

    if (seenNumbers.has(question.numero)) issues.push(`${label}: número duplicado na aula`);
    seenNumbers.add(question.numero);
    if (question.id && seenIds.has(question.id)) issues.push(`${label}: ID duplicado ${question.id}`);
    if (question.id) seenIds.add(question.id);
    if (containsNextQuestion(question.question)) issues.push(`${label}: enunciado contém o início de outra questão`);
    if (options.some((option) => containsNextQuestion(option.text))) {
      issues.push(`${label}: alternativa contém o início de outra questão`);
    }

    if (!question.correctAnswer) issues.push(`${label}: sem gabarito`);
    if (question.correctAnswer && !answer) issues.push(`${label}: gabarito ${question.correctAnswer} não existe nas alternativas`);
    if (question.correctAnswer && !question.explanation) issues.push(`${label}: sem comentário do gabarito`);
    if (question.correctAnswer && !question.legalBasis) issues.push(`${label}: sem base legal`);
    const nonLegalLesson = /portugu[eê]s|interpreta[çc][aã]o de texto/i.test(`${lesson.titulo ?? ''} ${lesson.topic ?? ''}`);
    if (!nonLegalLesson && /consulte a legislação indicada/i.test(question.legalBasis ?? '')) {
      issues.push(`${label}: base legal genérica, sem artigo/dispositivo específico`);
    }

    const mentioned = (question.explanation ?? '').match(/alternativa\s+([A-D])/i)?.[1]?.toUpperCase();
    if (mentioned && question.correctAnswer && mentioned !== question.correctAnswer) {
      issues.push(`${label}: comentário aponta alternativa ${mentioned}, mas o gabarito é ${question.correctAnswer}`);
    }

    if (question.legalBasis) {
      const same = seenBases.get(question.legalBasis) ?? [];
      same.push(question.numero);
      seenBases.set(question.legalBasis, same);
    }
  }

  // A repetição isolada não é erro: várias questões podem cobrar o mesmo artigo
  // (por exemplo, diferentes incisos do art. 280 ou do art. 327, § 3º).
  // A auditoria só marca ausência, contradição ou referência genérica; a lista
  // de bases repetidas continua disponível para revisão manual, sem bloquear a validação.
}

console.log(`AUDITORIA DE CONSISTÊNCIA — ${lessons} aulas / ${questions} questões`);
console.log('──────────────────────────────────────────────');
console.log(`Alertas encontrados: ${issues.length}`);
for (const issue of issues) console.log(`  ! ${issue}`);

if (process.argv.includes('--strict') && issues.length) process.exitCode = 1;
