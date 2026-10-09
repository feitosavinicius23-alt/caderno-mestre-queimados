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

  for (const question of lesson.questoes ?? []) {
    questions += 1;
    const label = `${file}: questão ${question.numero}`;
    const options = question.options ?? [];
    const answer = options.find((option) => option.id === question.correctAnswer);

    if (!question.correctAnswer) issues.push(`${label}: sem gabarito`);
    if (question.correctAnswer && !answer) issues.push(`${label}: gabarito ${question.correctAnswer} não existe nas alternativas`);
    if (question.correctAnswer && !question.explanation) issues.push(`${label}: sem comentário do gabarito`);
    if (question.correctAnswer && !question.legalBasis) issues.push(`${label}: sem base legal`);
    if (/consulte a legislação indicada/i.test(question.legalBasis ?? '')) {
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

  for (const [basis, numbers] of seenBases) {
    if (numbers.length >= 4 && !/arts?\.\s*\d+.*(?:,| e ).*arts?\./i.test(basis)) {
      issues.push(`${file}: mesma base legal usada nas questões ${numbers.join(', ')} — revisar se cada uma exige dispositivo próprio`);
    }
  }
}

console.log(`AUDITORIA DE CONSISTÊNCIA — ${lessons} aulas / ${questions} questões`);
console.log('──────────────────────────────────────────────');
console.log(`Alertas encontrados: ${issues.length}`);
for (const issue of issues) console.log(`  ! ${issue}`);

if (process.argv.includes('--strict') && issues.length) process.exitCode = 1;
