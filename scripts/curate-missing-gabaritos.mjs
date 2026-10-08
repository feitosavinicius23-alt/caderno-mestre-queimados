import fs from 'node:fs';
import path from 'node:path';

const answers = {
  'direito-tributario-aula-013': ['B','C','C','B','B','B'],
  'direito-tributario-aula-014': ['B','C','B','C','B','B'],
  'direito-tributario-aula-015': ['B','C','B','B','B','B'],
  'direito-tributario-aula-016': ['B','D','A','B','B','A'],
  'direito-tributario-aula-017': ['B','C','B','B','B','B'],
  'direito-tributario-aula-018': ['B','B','B','C','B','B'],
  'direito-tributario-aula-034': ['A','C','B','B','A','B','B','A','B','A'],
  'direito-tributario-aula-036': {9:'B'},
  'direito-tributario-aula-037': ['A','C','A','D','C','B','A','C','D','D'],
  'direito-tributario-aula-038': ['B','C','C','B','C','C','A','A','B','D'],
  'direito-tributario-aula-039': ['B','A','B','A','B','A','C','B','C','D'],
  'direito-tributario-aula-040': {2:'A',3:'C',4:'C',5:'A',6:'B',7:'A',8:'C',9:'B',10:'D'},
  'direito-tributario-aula-041': {1:'B',2:'C',3:'B',4:'B',5:'C',6:'A',7:'B',8:'A',9:'C',10:'D'},
  'direito-tributario-aula-042': {1:'B',2:'B',3:'C',4:'B',5:'A',6:'B',7:'C',8:'B',9:'C',10:'D'},
  'direito-tributario-aula-044': {1:'B',2:'A',3:'B',4:'B',5:'C',6:'B',7:'C',8:'B',9:'B',10:'D'},
  'direito-tributario-aula-045': {1:'B',2:'B',3:'B',4:'C',5:'A',6:'C',7:'C',8:'C',9:'D',10:'D'},
  'direito-tributario-aula-046': {1:'C',2:'B',3:'B',4:'C',5:'C',6:'C',7:'C',8:'B',9:'C',10:'D',11:'B',12:'C'},
  'direito-tributario-aula-047': {1:'B',2:'B',3:'B',4:'B',5:'B',6:'B',7:'B',8:'B',9:'D',10:'B',11:'D',12:'C'},
  'direito-tributario-aula-063': ['B','B','A','A','A','C','B','C','B','C','B','C'],
  'direito-tributario-aula-064': ['B','C','A','C','A','C','A','C','A','C','D','D'],
  'direito-tributario-aula-065': {1:'B',2:'A',3:'C',4:'B',5:'B',6:'B',7:'B',8:'B',9:'C',10:'D',11:'B',12:'C'},
  'direito-tributario-aula-066': {1:'A',2:'B',3:'B',4:'B',5:'B',6:'B',7:'B',8:'B',9:'A',10:'B',11:'B',12:'C'},
  'direito-tributario-aula-067': {1:'B',2:'A',3:'B',4:'D',5:'C',6:'B',7:'D',8:'B',9:'B',10:'A',11:'D',12:'B',13:'B',14:'B',15:'C'},
  'direito-tributario-aula-068': {1:'B',2:'A',3:'C',4:'B',5:'B',6:'B',7:'C',8:'B',9:'B',10:'C',11:'B',12:'C'},
  'direito-tributario-aula-069': {1:'D',2:'B',3:'B',4:'B',5:'B',6:'B',7:'B',8:'B',9:'C',10:'D',11:'D',12:'A'},
  'direito-tributario-aula-070': {1:'B',2:'B',3:'C',4:'B',5:'B',6:'B',7:'C',8:'A',9:'B',10:'B',11:'B',12:'C'},
  'direito-tributario-aula-071': {1:'B',2:'B',3:'B',4:'A',5:'D',6:'A',7:'B',8:'A',9:'B',10:'D',11:'B',12:'C'},
  'direito-tributario-aula-072': {1:'B',2:'B',3:'B',4:'A',5:'B',6:'B',7:'B',8:'B',9:'A',10:'A',11:'B',12:'B',13:'B',14:'D',15:'B'},
  'direito-tributario-aula-073': {1:'B',2:'B',3:'B',4:'B',5:'C',6:'B',7:'B',8:'B',9:'A',10:'B',11:'A',12:'B',13:'D',14:'A',15:'D'},
  'direito-tributario-aula-074': {1:'B',2:'A',3:'A',4:'B',5:'B',6:'C',7:'A',8:'A',9:'B',10:'B',11:'B',12:'B',13:'B',14:'D',15:'B',16:'B'},
  'direito-tributario-aula-075': {1:'B',2:'D',3:'C',4:'B',5:'A',6:'B',7:'B',8:'B',9:'B',10:'B',11:'A',12:'B',13:'B',14:'C',15:'B',16:'B',17:'B',18:'C'},
  'legislacao-tributaria-de-queimados-aula-029': {1:'B',2:'B',3:'B',4:'B',5:'B',6:'B',7:'C',8:'C'},
  'legislacao-tributaria-de-queimados-aula-043': {1:'B',2:'C',3:'B',4:'B',5:'C',6:'A',7:'B',8:'B',9:'C',10:'D'},
  'lingua-portuguesa-aula-035': {1:'B',2:'A',3:'C',4:'C',5:'C',6:'A',7:'A',8:'A'},
};

const dir = path.resolve('content/aulas');
let updated = 0;
for (const [lessonId, mapping] of Object.entries(answers)) {
  const file = path.join(dir, `${lessonId}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const byNumber = Array.isArray(mapping)
    ? Object.fromEntries(mapping.map((value, index) => [index + 1, value]))
    : mapping;
  for (const question of data.questoes ?? []) {
    if (question.correctAnswer || !byNumber[question.numero]) continue;
    const option = question.options.find((item) => item.id === byNumber[question.numero]);
    if (!option) throw new Error(`Alternativa ${byNumber[question.numero]} não encontrada em ${question.id}`);
    const negative = /\b(EXCETO|INCORRETO|INCORRETA|extrapola)\b/i.test(question.question);
    question.correctAnswer = option.id;
    question.explanation = negative
      ? `A alternativa ${option.id} é a resposta porque a questão pede a exceção ou a afirmação incorreta: ${option.text}`
      : `A alternativa ${option.id} é a resposta correta: ${option.text}`;
    question.gabaritoOculto = false;
    updated++;
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
console.log(`Gabaritos preenchidos: ${updated}`);
