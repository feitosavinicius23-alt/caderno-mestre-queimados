#!/usr/bin/env node
/**
 * npm run import-caderno
 *
 * Converte content/source/_raw/caderno-mestre.txt nas aulas JSON da plataforma
 * e roda a sincronização (manifest, disciplinas, metadados, índice de busca).
 *
 * IDEMPOTENTE: rodar duas vezes seguidas não altera nenhum arquivo.
 * INCREMENTAL: só grava as aulas cujo hash de conteúdo mudou (requisitos 11, 63, 64).
 *
 * Flags:
 *   --dry-run   relata sem escrever
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  DISCIPLINAS_CONFIG_PATH, LESSONS_DIR, RAW_DOC_PATH, docViewUrl,
} from '../lib/content-sync/paths.mjs';
import { readJson, writeJsonIfChanged } from '../lib/content-sync/io.mjs';
import { converterDocumento } from '../lib/content-sync/caderno-parser.mjs';
import { validateLesson } from '../lib/content-sync/validate.mjs';
import { computeContentHash, lessonFileName } from '../lib/content-sync/utils.mjs';
import { formatReport, runSync } from '../lib/content-sync/sync.mjs';

const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(RAW_DOC_PATH)) {
  console.error(`\n✕ Documento não encontrado em ${path.relative(process.cwd(), RAW_DOC_PATH)}`);
  console.error('  Rode primeiro: npm run fetch-caderno\n');
  process.exit(1);
}

const raw = fs.readFileSync(RAW_DOC_PATH, 'utf8');
const config = readJson(DISCIPLINAS_CONFIG_PATH, { padrao: 'Direito Tributário', regras: [], porNumero: {} });

console.log('');
console.log('IMPORTAÇÃO DO CADERNO MESTRE');
console.log('─'.repeat(52));

const { lessons, warnings } = converterDocumento(raw, config, { fonteUrl: docViewUrl() });

console.log(`Aulas detectadas no documento: ${lessons.length}`);

if (lessons.length === 0) {
  console.error('\n✕ Nenhuma aula detectada. O formato dos cabeçalhos ("AULA N — TÍTULO") mudou?\n');
  process.exit(1);
}

/* ---------- Grava apenas o que mudou ---------- */

const criadas = [];
const atualizadas = [];
let inalteradas = 0;
let invalidas = 0;
const problemas = [...warnings];
const arquivosEsperados = new Set();

for (const lesson of lessons) {
  const validacao = validateLesson(lesson);
  if (validacao.errors.length) {
    invalidas += 1;
    for (const e of validacao.errors) problemas.push(`✕ Aula ${lesson.numero}: ${e.message}`);
    continue; // nunca grava uma aula inválida
  }
  for (const w of validacao.warnings) problemas.push(`! Aula ${lesson.numero}: ${w.message}`);

  const fileName = lessonFileName(lesson.disciplina, lesson.numero);
  arquivosEsperados.add(fileName);
  const destino = path.join(LESSONS_DIR, fileName);
  const existente = readJson(destino, null);

  lesson.contentHash = computeContentHash(lesson);

  if (existente) {
    // Requisito 10: o ID já atribuído é permanente.
    lesson.id = existente.id;
    lesson.contentHash = computeContentHash(lesson);
    // Requisito 84: conteúdo idêntico => nenhuma alteração.
    if (existente.contentHash === lesson.contentHash) {
      inalteradas += 1;
      continue;
    }
    atualizadas.push(lesson);
  } else {
    criadas.push(lesson);
  }

  if (!dryRun) writeJsonIfChanged(destino, lesson);
}

/* ---------- Remove aulas que sumiram do documento ---------- */

const orfas = fs.existsSync(LESSONS_DIR)
  ? fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.json') && !arquivosEsperados.has(f))
  : [];

for (const orfa of orfas) {
  console.log(`  - ${orfa} (não existe mais no documento — removida)`);
  if (!dryRun) fs.unlinkSync(path.join(LESSONS_DIR, orfa));
}

/* ---------- Relatório ---------- */

for (const lesson of criadas) {
  console.log(`  + ${lesson.id} — ${lesson.titulo.slice(0, 58)} (${lesson.questoes.length}q)`);
}
for (const lesson of atualizadas) {
  console.log(`  ~ ${lesson.id} — ${lesson.titulo.slice(0, 58)} (${lesson.questoes.length}q)`);
}

const totalQuestoes = lessons.reduce((s, l) => s + l.questoes.length, 0);
const comGabarito = lessons.reduce((s, l) => s + l.questoes.filter((q) => q.correctAnswer).length, 0);

console.log('');
console.log(`Criadas:      ${criadas.length}`);
console.log(`Atualizadas:  ${atualizadas.length}`);
console.log(`Inalteradas:  ${inalteradas}`);
console.log(`Removidas:    ${orfas.length}`);
console.log(`Inválidas:    ${invalidas}`);
console.log(`Questões:     ${totalQuestoes} (${comGabarito} com gabarito no documento)`);

if (problemas.length) {
  console.log('');
  console.log(`OCORRÊNCIAS (${problemas.length}):`);
  for (const p of problemas.slice(0, 50)) console.log(`  ${p}`);
  if (problemas.length > 50) console.log(`  … +${problemas.length - 50}`);
}

if (dryRun) {
  console.log('\n(dry-run: nenhum arquivo foi escrito)\n');
  process.exit(invalidas > 0 ? 1 : 0);
}

const resultado = runSync();
process.stdout.write(formatReport(resultado));
process.exit(resultado.ok && invalidas === 0 ? 0 : 1);
