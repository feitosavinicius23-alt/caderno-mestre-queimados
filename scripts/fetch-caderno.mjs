#!/usr/bin/env node
/**
 * npm run fetch-caderno
 *
 * Baixa a versão atual do Caderno Mestre (Google Docs) em texto puro e salva em
 * content/source/_raw/caderno-mestre.txt.
 *
 * O documento precisa estar compartilhado como "qualquer pessoa com o link".
 * Nenhum token, chave ou credencial é usado — por isso nada precisa ir para o
 * frontend nem para variáveis de ambiente (requisitos 59 e 60).
 */
import fs from 'node:fs';
import path from 'node:path';
import { RAW_DOC_PATH, DOC_ID, docExportUrl } from '../lib/content-sync/paths.mjs';
import { hashString } from '../lib/content-sync/utils.mjs';

const url = docExportUrl('txt');

console.log('');
console.log('DOWNLOAD DO CADERNO MESTRE');
console.log('─'.repeat(46));
console.log(`Documento: ${DOC_ID}`);
console.log(`Origem:    ${url}`);

let resposta;
try {
  resposta = await fetch(url, { redirect: 'follow' });
} catch (error) {
  console.error(`\n✕ Falha de rede: ${error.message}`);
  process.exit(1);
}

if (!resposta.ok) {
  console.error(`\n✕ HTTP ${resposta.status}. Verifique se o documento está público (qualquer pessoa com o link).`);
  process.exit(1);
}

const texto = await resposta.text();

if (texto.trimStart().startsWith('<')) {
  console.error('\n✕ O Google devolveu uma página HTML (provavelmente tela de login).');
  console.error('  Compartilhe o documento como "qualquer pessoa com o link pode ver" e tente de novo.');
  process.exit(1);
}

const anterior = fs.existsSync(RAW_DOC_PATH) ? fs.readFileSync(RAW_DOC_PATH, 'utf8') : '';
const mudou = anterior !== texto;

fs.mkdirSync(path.dirname(RAW_DOC_PATH), { recursive: true });
fs.writeFileSync(RAW_DOC_PATH, texto, 'utf8');

console.log(`Tamanho:   ${(texto.length / 1024).toFixed(1)} KB`);
console.log(`Hash:      ${hashString(texto)}`);
console.log(`Documento: ${mudou ? 'ALTERADO desde a última verificação' : 'sem alterações'}`);
console.log(`Salvo em:  ${path.relative(process.cwd(), RAW_DOC_PATH)}`);
console.log('');

// Código 0 = ok. O import roda em seguida de qualquer forma (é idempotente).
