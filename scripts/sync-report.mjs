#!/usr/bin/env node
/**
 * npm run content:report
 * Mostra o estado atual do conteúdo sem alterar nada (dry-run do sync).
 * Útil para o agente de IA verificar "qual é a última aula?" antes de inserir.
 */
import { readJson } from '../lib/content-sync/io.mjs';
import { MANIFEST_PATH, SYNC_HISTORY_PATH } from '../lib/content-sync/paths.mjs';
import { formatReport, runSync } from '../lib/content-sync/sync.mjs';

const manifest = readJson(MANIFEST_PATH, null);

if (!manifest) {
  console.log('Nenhum manifesto encontrado. Rode: npm run sync-content');
  process.exit(0);
}

console.log('');
console.log('ESTADO ATUAL DO CONTEÚDO');
console.log('─'.repeat(46));
console.log(`Content version:       ${manifest.contentVersion}`);
console.log(`Última sincronização:  ${manifest.ultimaSincronizacao}`);
console.log(`Hash global:           ${manifest.contentHashGlobal}`);
console.log(`Total de aulas:        ${manifest.totalAulas}`);
console.log(`Total de questões:     ${manifest.totalQuestoes}`);
console.log(`Total de disciplinas:  ${manifest.totalDisciplinas}`);

const porDisciplina = new Map();
for (const aula of manifest.aulas) {
  const list = porDisciplina.get(aula.disciplina) || [];
  list.push(aula);
  porDisciplina.set(aula.disciplina, list);
}

console.log('');
console.log('ÚLTIMA AULA POR DISCIPLINA (use para numerar a próxima):');
for (const [disciplina, aulas] of porDisciplina) {
  const last = aulas.reduce((max, a) => (a.numero > max.numero ? a : max), aulas[0]);
  console.log(`  ${disciplina}: aula ${last.numero} — ${last.titulo}`);
  console.log(`    → próxima deve ser a aula ${last.numero + 1}`);
}

const history = readJson(SYNC_HISTORY_PATH, { registros: [] });
if (history.registros?.length) {
  console.log('');
  console.log('ÚLTIMAS SINCRONIZAÇÕES:');
  for (const reg of history.registros.slice(0, 5)) {
    console.log(`  ${reg.data} — v${reg.contentVersion} — +${reg.novasAulas.length} nova(s), ~${reg.aulasModificadas.length} alterada(s)`);
  }
}

console.log('');
console.log('VERIFICAÇÃO (dry-run):');
const result = runSync({ dryRun: true });
process.stdout.write(formatReport(result));
process.exit(result.ok ? 0 : 1);
