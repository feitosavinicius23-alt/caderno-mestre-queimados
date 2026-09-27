/**
 * MOTOR DE SINCRONIZAÇÃO INCREMENTAL.
 * Reconstrói manifesto/índices a partir das aulas em disco e detecta
 * o que mudou desde a última execução, comparando hashes (requisito 11).
 */
import {
  MANIFEST_PATH, METADATA_PATH, SEARCH_INDEX_PATH, SUBJECTS_PATH, SYNC_HISTORY_PATH,
} from './paths.mjs';
import { loadLessons, readJson, writeJsonIfChanged } from './io.mjs';
import { buildManifest, buildMetadata, buildSearchIndex, buildSubjects } from './manifest.mjs';
import { validateCollection, validateLesson } from './validate.mjs';
import { compareLessons, computeContentHash, nowIso, today } from './utils.mjs';
import path from 'node:path';
import { LESSONS_DIR } from './paths.mjs';

/**
 * Executa a sincronização.
 * @param {{dryRun?: boolean, strict?: boolean}} options
 */
export function runSync(options = {}) {
  const { dryRun = false } = options;

  const previousManifest = readJson(MANIFEST_PATH, null);
  const previousEntries = new Map((previousManifest?.aulas || []).map((a) => [a.id, a]));

  const { lessons, errors: loadErrors } = loadLessons();

  const errors = loadErrors.map((e) => ({ file: e.file, message: e.message }));
  const warnings = [];

  // 1. Recalcula hashes e valida cada aula individualmente.
  const validLessons = [];
  for (const lesson of lessons) {
    const hash = computeContentHash(lesson);
    const result = validateLesson(lesson, { expectedHash: hash });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    if (result.errors.length === 0) validLessons.push({ ...lesson, contentHash: hash });
  }

  // 2. Duplicidades no conjunto.
  const collection = validateCollection(validLessons);
  errors.push(...collection.errors);
  warnings.push(...collection.warnings);

  // 3. Diff contra o manifesto anterior.
  const novasAulas = [];
  const aulasModificadas = [];
  const aulasRemovidas = [];
  let questoesAntes = 0;

  for (const lesson of validLessons) {
    const previous = previousEntries.get(lesson.id);
    if (!previous) {
      novasAulas.push({ id: lesson.id, titulo: lesson.titulo, disciplina: lesson.disciplina });
    } else {
      questoesAntes += previous.totalQuestoes || 0;
      if (previous.hash !== lesson.contentHash) {
        aulasModificadas.push({
          id: lesson.id,
          titulo: lesson.titulo,
          hashAnterior: previous.hash,
          hashAtual: lesson.contentHash,
        });
      }
    }
  }
  const currentIds = new Set(validLessons.map((l) => l.id));
  for (const [id, entry] of previousEntries) {
    if (!currentIds.has(id)) aulasRemovidas.push({ id, titulo: entry.titulo });
  }

  const questoesAgora = validLessons.reduce((sum, l) => sum + (l.questoes || []).length, 0);

  // 4. Se houver erros, aborta ANTES de escrever qualquer coisa.
  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      warnings,
      totalAulas: validLessons.length,
      novasAulas,
      aulasModificadas,
      aulasRemovidas,
      arquivosAlterados: [],
      questoesAdicionadas: 0,
    };
  }

  // 5. Persiste hash/ultimaAtualizacao nos arquivos que realmente mudaram.
  const arquivosAlterados = [];
  const modifiedIds = new Set([...novasAulas, ...aulasModificadas].map((a) => a.id));

  for (const lesson of validLessons) {
    const { _file, ...clean } = lesson;
    if (modifiedIds.has(lesson.id)) clean.ultimaAtualizacao = today();
    const filePath = path.join(LESSONS_DIR, _file || `${lesson.id}.json`);
    if (!dryRun && writeJsonIfChanged(filePath, clean)) {
      arquivosAlterados.push(`content/aulas/${path.basename(filePath)}`);
    }
    lesson.ultimaAtualizacao = clean.ultimaAtualizacao;
  }

  // 6. Reconstrói os índices derivados.
  const sorted = [...validLessons].sort(compareLessons);
  const manifest = buildManifest(sorted, previousManifest);
  const subjects = buildSubjects(sorted);
  const metadata = buildMetadata(sorted, manifest);
  const searchIndex = buildSearchIndex(sorted, manifest);

  if (!dryRun) {
    if (writeJsonIfChanged(MANIFEST_PATH, manifest)) arquivosAlterados.push('content/manifest.json');
    if (writeJsonIfChanged(SUBJECTS_PATH, subjects)) arquivosAlterados.push('content/disciplinas.json');
    if (writeJsonIfChanged(METADATA_PATH, metadata)) arquivosAlterados.push('content/metadata.json');
    if (writeJsonIfChanged(SEARCH_INDEX_PATH, searchIndex)) arquivosAlterados.push('content/search-index.json');

    // 7. Histórico (requisito 42) — só registra quando algo mudou de fato.
    if (novasAulas.length || aulasModificadas.length || aulasRemovidas.length) {
      const history = readJson(SYNC_HISTORY_PATH, { registros: [] });
      history.registros = history.registros || [];
      history.registros.unshift({
        data: nowIso(),
        contentVersion: manifest.contentVersion,
        novasAulas: novasAulas.map((a) => a.id),
        aulasModificadas: aulasModificadas.map((a) => a.id),
        aulasRemovidas: aulasRemovidas.map((a) => a.id),
        questoesAdicionadas: Math.max(0, questoesAgora - questoesAntes),
        arquivosAlterados: arquivosAlterados.length,
        status: 'success',
      });
      history.registros = history.registros.slice(0, 200);
      if (writeJsonIfChanged(SYNC_HISTORY_PATH, history)) arquivosAlterados.push('content/sync-history.json');
    }
  }

  return {
    ok: true,
    errors: [],
    warnings,
    manifest,
    totalAulas: manifest.totalAulas,
    totalQuestoes: manifest.totalQuestoes,
    aulasAnteriores: previousManifest?.totalAulas ?? 0,
    novasAulas,
    aulasModificadas,
    aulasRemovidas,
    questoesAdicionadas: Math.max(0, questoesAgora - questoesAntes),
    arquivosAlterados,
    contentVersion: manifest.contentVersion,
  };
}

/** Relatório legível (requisito 17). */
export function formatReport(result) {
  const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const lines = [
    '',
    'SINCRONIZAÇÃO DO CADERNO MESTRE',
    '─'.repeat(46),
    `Data:                  ${date}`,
    'Documento:             Caderno Mestre — Agente Fiscal Queimados 2026',
    `Aulas anteriores:      ${result.aulasAnteriores ?? 0}`,
    `Aulas atuais:          ${result.totalAulas}`,
    `Aulas novas:           ${result.novasAulas.length}`,
    `Aulas modificadas:     ${result.aulasModificadas.length}`,
    `Aulas removidas:       ${result.aulasRemovidas.length}`,
    `Questões adicionadas:  ${result.questoesAdicionadas}`,
    `Arquivos alterados:    ${result.arquivosAlterados.length}`,
    `Validação:             ${result.ok ? 'OK' : 'FALHOU'}`,
    `Manifest:              ${result.ok ? 'ATUALIZADO' : 'NÃO ATUALIZADO'}`,
    `Search Index:          ${result.ok ? 'ATUALIZADO' : 'NÃO ATUALIZADO'}`,
    `Content Version:       ${result.contentVersion ?? '-'}`,
    `Pronto para deploy:    ${result.ok ? 'SIM' : 'NÃO'}`,
  ];

  if (result.novasAulas.length) {
    lines.push('', 'NOVAS AULAS:');
    for (const a of result.novasAulas) lines.push(`  + ${a.id} — ${a.titulo}`);
  }
  if (result.aulasModificadas.length) {
    lines.push('', 'AULAS MODIFICADAS:');
    for (const a of result.aulasModificadas) lines.push(`  ~ ${a.id} (${a.hashAnterior} → ${a.hashAtual})`);
  }
  if (result.aulasRemovidas.length) {
    lines.push('', 'AULAS REMOVIDAS:');
    for (const a of result.aulasRemovidas) lines.push(`  - ${a.id} — ${a.titulo}`);
  }
  if (result.warnings.length) {
    lines.push('', `AVISOS (${result.warnings.length}):`);
    for (const w of result.warnings.slice(0, 30)) lines.push(`  ! [${w.file}] ${w.message}`);
    if (result.warnings.length > 30) lines.push(`  ... +${result.warnings.length - 30} avisos`);
  }
  if (result.errors.length) {
    lines.push('', `ERROS (${result.errors.length}):`);
    for (const e of result.errors) lines.push(`  ✕ [${e.file}] ${e.message}`);
  }
  lines.push('');
  return lines.join('\n');
}
