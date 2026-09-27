#!/usr/bin/env node
/**
 * npm run import-content
 *
 * Lê os arquivos Markdown do Caderno Mestre em /content/source/**.md,
 * converte cada um em uma aula JSON estruturada em /content/aulas/,
 * e em seguida roda a sincronização.
 *
 * REGRAS DE SEGURANÇA:
 *  - nunca duplica: a identidade é o ID (disciplina + número), não o título;
 *  - se o hash não mudou, o arquivo NÃO é reescrito;
 *  - aulas existentes não listadas no source são preservadas.
 *
 * Flags:
 *   --file <caminho>   importa um único arquivo
 *   --dry-run          apenas relata o que faria
 */
import fs from 'node:fs';
import path from 'node:path';
import { LESSONS_DIR, SOURCE_DIR } from '../lib/content-sync/paths.mjs';
import { readJson, writeJsonIfChanged } from '../lib/content-sync/io.mjs';
import { parseLesson } from '../lib/content-sync/parser.mjs';
import { validateLesson } from '../lib/content-sync/validate.mjs';
import { computeContentHash, lessonFileName } from '../lib/content-sync/utils.mjs';
import { formatReport, runSync } from '../lib/content-sync/sync.mjs';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const fileFlag = argv.indexOf('--file');
const singleFile = fileFlag >= 0 ? argv[fileFlag + 1] : null;

/** Coleta os .md de source, recursivamente. A pasta vira a disciplina padrão. */
function collectSources(dir, inherited = null) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full, entry.name.replace(/-/g, ' ')));
    } else if (/\.mde?$|\.md$|\.markdown$|\.txt$/i.test(entry.name)) {
      out.push({ file: full, disciplinaPasta: inherited });
    }
  }
  return out;
}

const sources = singleFile
  ? [{ file: path.resolve(singleFile), disciplinaPasta: null }]
  : collectSources(SOURCE_DIR);

console.log('');
console.log('IMPORTAÇÃO DO CADERNO MESTRE');
console.log('─'.repeat(46));
console.log(`Arquivos fonte encontrados: ${sources.length}`);

if (sources.length === 0) {
  console.log('');
  console.log(`Nenhum arquivo .md em ${path.relative(process.cwd(), SOURCE_DIR)}/`);
  console.log('Coloque as aulas do Caderno Mestre lá (veja content/source/_templates/aula-exemplo.md)');
  console.log('ou adicione JSONs diretamente em content/aulas/ e rode: npm run sync-content');
  console.log('');
}

let criadas = 0;
let atualizadas = 0;
let inalteradas = 0;
let falhas = 0;
const problemas = [];

for (const source of sources) {
  const rel = path.relative(process.cwd(), source.file);
  let parsed;
  try {
    const raw = fs.readFileSync(source.file, 'utf8');
    parsed = parseLesson(raw, { disciplina: source.disciplinaPasta });
  } catch (error) {
    falhas += 1;
    problemas.push(`✕ ${rel}: ${error.message}`);
    continue;
  }

  const { lesson, warnings } = parsed;
  for (const warning of warnings) problemas.push(`! ${rel}: ${warning}`);

  const validation = validateLesson(lesson);
  if (validation.errors.length) {
    falhas += 1;
    for (const e of validation.errors) problemas.push(`✕ ${rel}: ${e.message}`);
    continue;
  }
  for (const w of validation.warnings) problemas.push(`! ${rel}: ${w.message}`);

  lesson.contentHash = computeContentHash(lesson);

  const fileName = lessonFileName(lesson.disciplina, lesson.numero);
  const target = path.join(LESSONS_DIR, fileName);
  const existing = readJson(target, null);

  if (existing) {
    // Detecção de duplicidade por hash (requisito 84): idêntico => nada a fazer.
    if (existing.contentHash === lesson.contentHash) {
      inalteradas += 1;
      continue;
    }
    // Preserva o ID permanente já atribuído (requisito 10).
    lesson.id = existing.id;
    lesson.contentHash = computeContentHash(lesson);
    if (existing.contentHash === lesson.contentHash) {
      inalteradas += 1;
      continue;
    }
  }

  if (!dryRun) writeJsonIfChanged(target, lesson);
  if (existing) atualizadas += 1;
  else criadas += 1;
  console.log(`  ${existing ? '~' : '+'} ${fileName}  (${lesson.questoes.length} questões, hash ${lesson.contentHash})`);
}

console.log('');
console.log(`Criadas:     ${criadas}`);
console.log(`Atualizadas: ${atualizadas}`);
console.log(`Inalteradas: ${inalteradas}`);
console.log(`Falhas:      ${falhas}`);

if (problemas.length) {
  console.log('');
  console.log('OCORRÊNCIAS:');
  for (const p of problemas.slice(0, 40)) console.log(`  ${p}`);
  if (problemas.length > 40) console.log(`  ... +${problemas.length - 40}`);
}

if (falhas > 0) {
  console.log('');
  console.log('Importação concluída com falhas — nenhuma aula inválida foi gravada.');
}

if (dryRun) {
  console.log('');
  console.log('(dry-run: nenhum arquivo foi escrito)');
  console.log('');
  process.exit(falhas > 0 ? 1 : 0);
}

const result = runSync();
process.stdout.write(formatReport(result));
process.exit(result.ok && falhas === 0 ? 0 : 1);
