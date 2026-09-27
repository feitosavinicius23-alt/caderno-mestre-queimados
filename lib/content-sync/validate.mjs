/**
 * VALIDAÇÃO DE CONTEÚDO (requisito 16).
 * Retorna erros (bloqueiam o deploy) e avisos (não bloqueiam).
 */
import { BLOCK_TYPES } from './block-types.mjs';
import { computeContentHash, lessonId, slugify } from './utils.mjs';

const REQUIRED_FIELDS = ['id', 'numero', 'titulo', 'slug', 'disciplina', 'conteudo'];
const VALID_TYPES = new Set(BLOCK_TYPES);

export function validateLesson(lesson, context = {}) {
  const errors = [];
  const warnings = [];
  const where = lesson._file || lesson.id || '(desconhecido)';
  const fail = (message) => errors.push({ file: where, message });
  const warn = (message) => warnings.push({ file: where, message });

  for (const field of REQUIRED_FIELDS) {
    const value = lesson[field];
    const empty = value === undefined || value === null || value === '' ||
      (Array.isArray(value) && value.length === 0);
    if (empty) fail(`Campo obrigatório ausente ou vazio: "${field}".`);
  }

  if (!Number.isInteger(lesson.numero) || lesson.numero <= 0) {
    fail(`"numero" deve ser inteiro positivo (recebido: ${JSON.stringify(lesson.numero)}).`);
  }

  if (lesson.disciplina && Number.isInteger(lesson.numero)) {
    const expected = lessonId(lesson.disciplina, lesson.numero);
    if (lesson.id !== expected) {
      warn(`ID "${lesson.id}" difere do padrão esperado "${expected}". Mantido (IDs são permanentes).`);
    }
  }

  if (lesson.slug && slugify(lesson.slug) !== lesson.slug) {
    fail(`Slug "${lesson.slug}" não está normalizado (esperado "${slugify(lesson.slug)}").`);
  }

  if (Array.isArray(lesson.conteudo)) {
    lesson.conteudo.forEach((bloco, index) => {
      if (!bloco || typeof bloco !== 'object') {
        fail(`Bloco ${index} inválido.`);
        return;
      }
      if (!VALID_TYPES.has(bloco.tipo)) {
        warn(`Bloco ${index} com tipo desconhecido "${bloco.tipo}" — será exibido como texto.`);
      }
    });
  }

  const questionIds = new Set();
  for (const question of lesson.questoes || []) {
    const tag = question.id || '(sem id)';
    if (!question.id) fail('Questão sem id.');
    if (questionIds.has(question.id)) fail(`Questão duplicada dentro da aula: ${question.id}.`);
    questionIds.add(question.id);

    if (!question.question || !String(question.question).trim()) fail(`Questão ${tag} sem enunciado.`);
    if (!Array.isArray(question.options) || question.options.length < 2) {
      fail(`Questão ${tag} sem alternativas suficientes (mínimo 2).`);
      continue;
    }
    const optionIds = question.options.map((o) => o && o.id);
    if (new Set(optionIds).size !== optionIds.length) fail(`Questão ${tag} com alternativas de id repetido.`);
    for (const option of question.options) {
      if (!option || !option.id || !String(option.text || '').trim()) {
        fail(`Questão ${tag} com alternativa vazia.`);
      }
    }
    if (!question.correctAnswer) {
      // O Caderno Mestre omite deliberadamente alguns gabaritos ("SEM GABARITO
      // NESTA ETAPA", para forçar recuperação ativa). Nesses casos a questão é
      // válida e a plataforma exibe o aviso — jamais uma resposta inventada.
      if (question.gabaritoOculto) {
        warn(`Questão ${tag} sem gabarito por opção do documento (recuperação ativa).`);
      } else {
        fail(`Questão ${tag} sem resposta correta (gabarito).`);
      }
    } else if (!optionIds.includes(question.correctAnswer)) {
      fail(`Questão ${tag}: gabarito "${question.correctAnswer}" não corresponde a nenhuma alternativa.`);
    }
    if (!String(question.explanation || '').trim()) {
      warn(`Questão ${tag} sem comentário/explicação.`);
    }
  }

  for (const gabarito of lesson.gabaritos || []) {
    if (!gabarito.questionId || !questionIds.has(gabarito.questionId)) {
      fail(`Gabarito referencia questão inexistente: ${gabarito.questionId}.`);
    }
    if (!gabarito.resposta) fail(`Gabarito incompleto para ${gabarito.questionId}.`);
  }

  for (const mapa of lesson.mapasMentais || []) {
    if (!Array.isArray(mapa.nos) || mapa.nos.length === 0) {
      warn(`Mapa mental "${mapa.titulo || mapa.id}" sem nós.`);
    }
  }

  if (context.expectedHash && lesson.contentHash && context.expectedHash !== lesson.contentHash) {
    warn('contentHash gravado difere do recalculado — será corrigido na sincronização.');
  }

  return { errors, warnings };
}

/**
 * Validação do conjunto: duplicidades entre aulas (requisito 13).
 */
export function validateCollection(lessons) {
  const errors = [];
  const warnings = [];
  const byId = new Map();
  const bySlug = new Map();
  const byNumber = new Map();
  const byHash = new Map();

  for (const lesson of lessons) {
    const where = lesson._file || lesson.id;

    if (byId.has(lesson.id)) {
      errors.push({ file: where, message: `ID duplicado "${lesson.id}" (também em ${byId.get(lesson.id)}).` });
    } else byId.set(lesson.id, where);

    const slugKey = `${lesson.disciplina}::${lesson.slug}`;
    if (bySlug.has(slugKey)) {
      errors.push({ file: where, message: `Slug duplicado "${lesson.slug}" na disciplina "${lesson.disciplina}" (também em ${bySlug.get(slugKey)}).` });
    } else bySlug.set(slugKey, where);

    const numberKey = `${lesson.disciplina}::${lesson.numero}`;
    if (byNumber.has(numberKey)) {
      errors.push({ file: where, message: `Número de aula duplicado (${lesson.numero}) em "${lesson.disciplina}" (também em ${byNumber.get(numberKey)}).` });
    } else byNumber.set(numberKey, where);

    const hash = computeContentHash(lesson);
    if (byHash.has(hash)) {
      warnings.push({ file: where, message: `Conteúdo idêntico ao de ${byHash.get(hash)} (hash ${hash}) — possível duplicata.` });
    } else byHash.set(hash, where);
  }

  const globalQuestionIds = new Map();
  for (const lesson of lessons) {
    for (const question of lesson.questoes || []) {
      if (globalQuestionIds.has(question.id)) {
        errors.push({
          file: lesson._file || lesson.id,
          message: `ID de questão duplicado globalmente: ${question.id} (também em ${globalQuestionIds.get(question.id)}).`,
        });
      } else globalQuestionIds.set(question.id, lesson._file || lesson.id);
    }
  }

  return { errors, warnings };
}

/** Confere se o manifesto bate com as aulas em disco (requisito 16). */
export function validateManifest(manifest, lessons) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    return { errors: [{ file: 'manifest.json', message: 'Manifesto ausente ou inválido.' }], warnings: [] };
  }
  const manifestIds = new Set((manifest.aulas || []).map((a) => a.id));
  const diskIds = new Set(lessons.map((l) => l.id));

  for (const id of diskIds) {
    if (!manifestIds.has(id)) {
      errors.push({ file: 'manifest.json', message: `Aula "${id}" existe em disco mas não no manifesto. Rode: npm run sync-content` });
    }
  }
  for (const id of manifestIds) {
    if (!diskIds.has(id)) {
      errors.push({ file: 'manifest.json', message: `Manifesto lista "${id}" mas o arquivo não existe. Rode: npm run sync-content` });
    }
  }
  if ((manifest.totalAulas ?? -1) !== lessons.length) {
    errors.push({ file: 'manifest.json', message: `totalAulas (${manifest.totalAulas}) difere do real (${lessons.length}). Rode: npm run sync-content` });
  }
  return { errors, warnings: [] };
}
