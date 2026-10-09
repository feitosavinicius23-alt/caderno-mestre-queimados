#!/usr/bin/env node
/**
 * Correções editoriais comprovadas que precisam sobreviver à reimportação do Drive.
 * O script é intencionalmente idempotente e só altera questões identificadas por ID.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('content/aulas');
const updates = new Map([
  ['direito-tributario-aula-001-q-004', {
    legalBasis: 'Constituição Federal, art. 156: compete aos Municípios instituir impostos sobre a propriedade predial e territorial urbana, serviços de qualquer natureza e transmissão onerosa inter vivos de bens imóveis; a atividade fiscalizatória, por si só, não cria automaticamente taxa.',
  }],
  ['direito-tributario-aula-001-q-007', {
    legalBasis: 'CTN, art. 113, § 2º: a obrigação acessória decorre da legislação tributária e tem por objeto prestações positivas ou negativas no interesse da arrecadação ou da fiscalização dos tributos.',
  }],
  ['direito-tributario-aula-001-q-009', {
    legalBasis: 'CTN, art. 121: sujeito passivo da obrigação principal é a pessoa obrigada ao pagamento de tributo ou penalidade pecuniária, podendo ser contribuinte ou responsável.',
  }],
  ['direito-tributario-aula-001-q-010', {
    legalBasis: 'CTN, art. 113, §§ 1º e 2º: a obrigação principal tem por objeto o pagamento de tributo ou penalidade pecuniária; a obrigação acessória tem por objeto prestações positivas ou negativas no interesse da fiscalização ou arrecadação.',
  }],
  ['direito-tributario-aula-002-q-003', {
    legalBasis: 'CTN, art. 147: o lançamento é efetuado com base na declaração do sujeito passivo ou de terceiro, quando prestada na forma e nas condições da legislação tributária.',
  }],
  ['direito-tributario-aula-002-q-004', {
    legalBasis: 'CTN, art. 150: o lançamento por homologação ocorre quando a legislação atribui ao sujeito passivo o dever de antecipar o pagamento sem prévio exame da autoridade administrativa, sujeito à posterior homologação.',
  }],
  ['direito-tributario-aula-002-q-005', {
    legalBasis: 'CTN, arts. 113, § 1º, e 142: a obrigação nasce com o fato gerador e o lançamento constitui o crédito tributário; a declaração prévia não é exigida em todo lançamento.',
  }],
  ['direito-tributario-aula-002-q-006', {
    legalBasis: 'CTN, art. 149: o lançamento é efetuado ou revisto de ofício pela autoridade administrativa nas hipóteses legais, sem depender necessariamente de declaração prévia do sujeito passivo.',
  }],
  ['direito-tributario-aula-003-q-002', {
    legalBasis: 'CTN, art. 151, II: suspende a exigibilidade do crédito tributário o depósito do seu montante integral.',
  }],
  ['direito-tributario-aula-004-q-002', {
    legalBasis: 'CTN, arts. 151, VI, e 156: o parcelamento suspende a exigibilidade do crédito, enquanto o pagamento, a remissão, a prescrição e a decadência são hipóteses de extinção.',
  }],
  ['direito-tributario-aula-004-q-005', {
    legalBasis: 'CTN, arts. 151, VI, 156 e 175: parcelamento suspende a exigibilidade; pagamento e remissão extinguem o crédito; isenção e anistia integram a exclusão do crédito tributário.',
  }],
  ['direito-tributario-aula-005-q-004', {
    legalBasis: 'CTN, arts. 151, VI, 156 e 175: parcelamento suspende a exigibilidade; remissão extingue o crédito; isenção e anistia são hipóteses de exclusão.',
  }],
  ['direito-tributario-aula-005-q-005', {
    legalBasis: 'CTN, arts. 151, II, e 156, VI: o depósito do montante integral suspende a exigibilidade; sua conversão em renda extingue o crédito tributário.',
  }],
  ['direito-tributario-aula-005-q-006', {
    legalBasis: 'CTN, art. 175, parágrafo único: a exclusão do crédito tributário não dispensa o cumprimento das obrigações acessórias dependentes da obrigação principal ou dela consequentes.',
  }],
  ['direito-tributario-aula-006-q-001', {
    legalBasis: 'CTN, art. 183: a enumeração das garantias atribuídas ao crédito tributário não exclui outras expressamente previstas em lei, em função da natureza ou das características do tributo.',
  }],
  ['direito-tributario-aula-006-q-002', {
    legalBasis: 'CTN, art. 185: presume-se fraudulenta a alienação ou oneração de bens ou rendas por sujeito passivo em débito por crédito tributário regularmente inscrito em dívida ativa.',
  }],
  ['direito-tributario-aula-006-q-003', {
    legalBasis: 'CTN, art. 185, parágrafo único: a presunção de fraude não se aplica quando o devedor reservou bens ou rendas suficientes ao total pagamento da dívida inscrita.',
  }],
  ['direito-tributario-aula-006-q-006', {
    legalBasis: 'CTN, art. 187: no concurso de preferência entre pessoas jurídicas de direito público, a União prefere aos Estados e ao Distrito Federal, que preferem aos Municípios, observadas as regras do dispositivo.',
  }],
  ['direito-tributario-aula-007-q-003', {
    legalBasis: 'CTN, art. 138: a denúncia espontânea, acompanhada das condições legais, pode excluir a responsabilidade pela infração quando apresentada antes do início de procedimento administrativo ou medida de fiscalização relacionados com a infração.',
  }],
  ['direito-tributario-aula-007-q-006', {
    legalBasis: 'CTN, art. 113, § 3º: a obrigação acessória, pelo simples fato da sua inobservância, converte-se em obrigação principal relativamente à penalidade pecuniária.',
  }],
  ['direito-tributario-aula-008-q-001', {
    legalBasis: 'CTN, art. 121: contribuinte é quem tem relação pessoal e direta com a situação que constitua o respectivo fato gerador; responsável é quem, sem ser contribuinte, tem obrigação decorrente de disposição expressa de lei.',
  }],
  ['direito-tributario-aula-008-q-004', {
    legalBasis: 'CTN, art. 133: quem adquire fundo de comércio ou estabelecimento e continua a respectiva exploração responde pelos tributos devidos até a data do ato, conforme as condições e os limites previstos no dispositivo.',
  }],
  ['direito-tributario-aula-009-q-001', {
    legalBasis: 'CTN, arts. 173 e 174: a decadência se relaciona ao prazo para constituir o crédito tributário; a prescrição se relaciona à ação de cobrança após a constituição definitiva.',
  }],
  ['direito-tributario-aula-010-q-001', {
    legalBasis: 'Constituição Federal, art. 150, I: é vedado exigir ou aumentar tributo sem lei que o estabeleça, expressão do princípio da legalidade tributária.',
  }],
  ['direito-tributario-aula-010-q-002', {
    legalBasis: 'Constituição Federal, art. 150, III, a: é vedado cobrar tributos em relação a fatos geradores ocorridos antes do início da vigência da lei que os instituiu ou aumentou.',
  }],
  ['direito-tributario-aula-010-q-005', {
    legalBasis: 'Constituição Federal, art. 150, II, III e IV: a Constituição prevê isonomia, anterioridade e vedação ao confisco; imunidade tem fundamento constitucional e isenção decorre de lei.',
  }],
  ['direito-tributario-aula-010-q-006', {
    legalBasis: 'Constituição Federal, art. 150, III: a anterioridade anual e a noventena são regras constitucionais, ressalvadas as exceções previstas na própria Constituição.',
  }],
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

function applyUpdate(question, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'options') continue;
    if (question[key] !== value) {
      question[key] = value;
      changed++;
    }
  }
}

const lessonCache = new Map();
let changed = 0;
for (const [questionId, patch] of updates) {
  const lessonId = questionId.replace(/-q-\d+$/, '');
  if (!lessonCache.has(lessonId)) lessonCache.set(lessonId, readLesson(lessonId));
  const entry = lessonCache.get(lessonId);
  const question = entry.data.questoes.find((item) => item.id === questionId);
  if (!question) throw new Error(`Questão não encontrada: ${questionId}`);
  applyUpdate(question, patch);
}

// Limpa duas corrupções editoriais da importação do documento.
{
  const entry = lessonCache.get('direito-tributario-aula-001') ?? readLesson('direito-tributario-aula-001');
  lessonCache.set('direito-tributario-aula-001', entry);
  const { data } = entry;
  const q = data.questoes.find((item) => item.id === 'direito-tributario-aula-001-q-011');
  const option = q?.options.find((item) => item.id === 'D');
  if (option && option.text.endsWith(' Pare antes do')) {
    option.text = option.text.slice(0, -' Pare antes do'.length);
    changed++;
  }
}
{
  const entry = lessonCache.get('direito-tributario-aula-002') ?? readLesson('direito-tributario-aula-002');
  lessonCache.set('direito-tributario-aula-002', entry);
  const { data } = entry;
  const q = data.questoes.find((item) => item.id === 'direito-tributario-aula-002-q-002');
  const option = q?.options.find((item) => item.id === 'D');
  if (option && option.text.includes('autoridad8e')) {
    option.text = option.text.replace('autoridad8e', 'autoridade');
    changed++;
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
