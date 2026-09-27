#!/usr/bin/env node
/**
 * npm run sync-content
 * Reconstrói manifest, disciplinas, metadados, índice de busca e histórico.
 * Idempotente: rodar duas vezes seguidas não altera nada na segunda vez.
 *
 * Flags: --dry-run (não escreve nada)
 */
import { formatReport, runSync } from '../lib/content-sync/sync.mjs';

const dryRun = process.argv.includes('--dry-run');
const result = runSync({ dryRun });

process.stdout.write(formatReport(result));

if (dryRun) process.stdout.write('(dry-run: nenhum arquivo foi escrito)\n\n');

if (!result.ok) {
  process.stdout.write('Sincronização abortada — corrija os erros acima.\n\n');
  process.exit(1);
}
