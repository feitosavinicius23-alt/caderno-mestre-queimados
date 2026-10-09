import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('content/aulas');
const rules = [
  { basis: /sigilo/i, forbidden: [/\blivremente\b/i, /sem sigilo/i, /dispensa o sigilo/i, /impede toda/i] },
  { basis: /morat/i, forbidden: [/\banistia\b/i, /\bremissão\b/i, /\bextingue\b/i] },
  { basis: /anistia/i, forbidden: [/\bmoratória\b/i, /constitui tributo/i, /cria tributo/i] },
  { basis: /suspens/i, forbidden: [/\bextingue\b/i, /\bexclui\b/i] },
  { basis: /extinç/i, forbidden: [/\bsuspende\b/i] },
];
const issues = [];
const isUnnegated = (text, pattern) => {
  const match = text.match(pattern);
  if (!match || match.index === undefined) return false;
  return !/[nãa]o\s+[^.!?]{0,35}$/i.test(text.slice(0, match.index));
};

for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
  const lesson = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const question of lesson.questoes ?? []) {
    if (!question.correctAnswer) continue;
    const option = (question.options ?? []).find((item) => item.id === question.correctAnswer);
    const basis = question.legalBasis ?? '';
    const answer = option?.text ?? '';
    for (const rule of rules) {
      if (rule.basis.test(basis) && rule.forbidden.some((pattern) => isUnnegated(answer, pattern))) {
        issues.push(`${file}: questão ${question.numero}: a resposta marcada contradiz a base legal (${answer})`);
      }
    }
  }
}

console.log(`AUDITORIA DE CONTRADIÇÕES EVIDENTES — alertas: ${issues.length}`);
for (const issue of issues) console.log(`  ! ${issue}`);
if (process.argv.includes('--strict') && issues.length) process.exitCode = 1;
