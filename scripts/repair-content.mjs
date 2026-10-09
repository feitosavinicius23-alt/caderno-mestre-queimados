#!/usr/bin/env node
/**
 * Correções editoriais comprovadas que precisam sobreviver à reimportação do Drive.
 * O script é intencionalmente idempotente e só altera questões identificadas por ID.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('content/aulas');
const updates = new Map([
  ['direito-tributario-aula-040-q-001', {
    numero: 1,
    question: 'O art. 134 do CTN relaciona a responsabilidade de terceiros, entre outros requisitos, à:',
    correctAnswer: 'B',
    explanation: 'A alternativa B é a resposta correta: impossibilidade de exigir o cumprimento da obrigação principal pelo contribuinte e atos ou omissões previstos em lei.',
    topic: 'RESPONSABILIDADE TRIBUTÁRIA DE TERCEIROS (CTN, ART. 134)',
    legalBasis: 'CTN, art. 134: nos casos de impossibilidade de exigir o cumprimento da obrigação principal pelo contribuinte, respondem solidariamente com ele as pessoas indicadas no dispositivo, nos atos em que intervierem ou pelas omissões de que forem responsáveis.',
  }],
  ['direito-tributario-aula-041-q-005', {
    legalBasis: 'CTN, arts. 186 e 187: o crédito tributário possui preferência, ressalvados os créditos decorrentes da legislação do trabalho ou de acidente de trabalho; a cobrança judicial segue as regras próprias do Código, inclusive quanto à falência.',
  }],
  ['direito-tributario-aula-077-q-017', {
    legalBasis: 'CTM de Queimados, art. 332, § 2º: nos bens indivisos, o lançamento pode ser feito em nome de qualquer um dos titulares, que poderá exigir dos demais as parcelas que lhes couberem.',
  }],
  ['lingua-portuguesa-aula-035-q-007', {
    legalBasis: 'CTN, art. 173: o direito de a Fazenda Pública constituir o crédito tributário extingue-se após cinco anos, nos termos das hipóteses previstas no dispositivo.',
  }],
  ['lingua-portuguesa-aula-035-q-008', {
    correctAnswer: 'B',
    explanation: 'A alternativa B é a resposta correta: o lançamento constitui o crédito tributário.',
    legalBasis: 'CTN, art. 142: compete privativamente à autoridade administrativa constituir o crédito tributário pelo lançamento.',
  }],
]);

function readLesson(lessonId) {
  const file = path.join(dir, `${lessonId}.json`);
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

const lessonCache = new Map();
let changed = 0;
for (const [questionId, patch] of updates) {
  const lessonId = questionId.replace(/-q-\d+$/, '');
  if (!lessonCache.has(lessonId)) lessonCache.set(lessonId, readLesson(lessonId));
  const entry = lessonCache.get(lessonId);
  const question = entry.data.questoes.find((item) => item.id === questionId);
  if (!question) throw new Error(`Questão não encontrada: ${questionId}`);
  for (const [key, value] of Object.entries(patch)) {
    if (question[key] !== value) {
      question[key] = value;
      changed++;
    }
  }
}

// A importação do documento pode juntar o início da questão seguinte na alternativa D.
for (const lessonNumber of [75, 76, 77, 78, 79]) {
  const lessonId = `direito-tributario-aula-${String(lessonNumber).padStart(3, '0')}`;
  if (!lessonCache.has(lessonId)) lessonCache.set(lessonId, readLesson(lessonId));
  const entry = lessonCache.get(lessonId);
  for (const question of entry.data.questoes) {
    for (const option of question.options ?? []) {
      const match = option.text.match(/^(.*?\.)(?:\s+\d+\)\s+)/s);
      if (match && option.text !== match[1]) {
        option.text = match[1];
        changed++;
      }
    }
  }
}

// A Aula 1 recebeu questões numeradas novamente a partir de 1 na última importação.
{
  const { file, data } = lessonCache.has('direito-tributario-aula-001')
    ? lessonCache.get('direito-tributario-aula-001')
    : readLesson('direito-tributario-aula-001');
  lessonCache.set('direito-tributario-aula-001', { file, data });
  const byId = new Map(data.questoes.map((item) => [item.id, item]));
  for (let number = 6; number <= 11; number++) {
    const question = byId.get(`direito-tributario-aula-001-q-${String(number).padStart(3, '0')}`);
    if (question && question.numero !== number) {
      question.numero = number;
      changed++;
    }
  }
}

for (const { file, data } of lessonCache.values()) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

console.log(`Correções editoriais reaplicadas: ${changed}`);
