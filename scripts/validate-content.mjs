#!/usr/bin/env node
/**
 * npm run validate-content
 * Somente leitura: não escreve nenhum arquivo.
 * Sai com código 1 se houver qualquer erro.
 */
import { loadLessons, readJson } from '../lib/content-sync/io.mjs';
import { MANIFEST_PATH } from '../lib/content-sync/paths.mjs';
import { validateCollection, validateLesson, validateManifest } from '../lib/content-sync/validate.mjs';
import { computeContentHash } from '../lib/content-sync/utils.mjs';

const { lessons, errors: loadErrors } = loadLessons();

const errors = loadErrors.map((e) => ({ file: e.file, message: `JSON inválido: ${e.message}` }));
const warnings = [];

for (const lesson of lessons) {
  const result = validateLesson(lesson, { expectedHash: computeContentHash(lesson) });
  errors.push(...result.errors);
  warnings.push(...result.warnings);
}

const collection = validateCollection(lessons);
errors.push(...collection.errors);
warnings.push(...collection.warnings);

const manifest = readJson(MANIFEST_PATH, null);
const manifestCheck = validateManifest(manifest, lessons);
errors.push(...manifestCheck.errors);

console.log('');
console.log('VALIDAÇÃO DE CONTEÚDO — CADERNO MESTRE');
console.log('─'.repeat(46));
console.log(`Aulas analisadas:  ${lessons.length}`);
console.log(`Questões:          ${lessons.reduce((s, l) => s + (l.questoes || []).length, 0)}`);
console.log(`Erros:             ${errors.length}`);
console.log(`Avisos:            ${warnings.length}`);

if (warnings.length) {
  console.log('');
  console.log('AVISOS:');
  for (const w of warnings.slice(0, 40)) console.log(`  ! [${w.file}] ${w.message}`);
  if (warnings.length > 40) console.log(`  ... +${warnings.length - 40}`);
}

if (errors.length) {
  console.log('');
  console.log('ERROS:');
  for (const e of errors) console.log(`  ✕ [${e.file}] ${e.message}`);
  console.log('');
  console.log('Resultado: FALHOU');
  console.log('');
  process.exit(1);
}

console.log('');
console.log('Resultado: OK');
console.log('');
