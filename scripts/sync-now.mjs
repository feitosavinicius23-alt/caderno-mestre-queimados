#!/usr/bin/env node
/**
 * npm run sync:now
 *
 * O "botão de sincronizar agora" para rodar da sua máquina, sem esperar o
 * agendamento do GitHub.
 *
 * Faz, em sequência:
 *   1. baixa o Caderno Mestre do Google Docs
 *   2. converte e sincroniza o conteúdo
 *   3. valida
 *   4. se houver mudança em content/, faz commit e push (pode ser desligado)
 *
 * Flags:
 *   --no-push    faz o commit mas não envia para o GitHub
 *   --no-commit  só atualiza os arquivos locais, sem mexer no git
 */
import { execFileSync, execSync } from 'node:child_process';
import process from 'node:process';

const semPush = process.argv.includes('--no-push');
const semCommit = process.argv.includes('--no-commit');

const linha = (c = '─') => console.log(c.repeat(60));

function passo(titulo, comando, args) {
  console.log('');
  linha();
  console.log(`▶ ${titulo}`);
  linha();
  execFileSync(comando, args, { stdio: 'inherit' });
}

function git(args, { silencioso = false } = {}) {
  return execSync(`git ${args}`, { encoding: 'utf8', stdio: silencioso ? 'pipe' : 'inherit' });
}

function dentroDeRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  passo('1/3 Baixando o Caderno Mestre', npm, ['run', 'fetch-caderno']);
  passo('2/3 Importando e sincronizando', npm, ['run', 'import-caderno']);
  passo('3/3 Validando', npm, ['run', 'validate-content']);
} catch {
  console.error('\n✕ A sincronização falhou. Nada foi commitado.');
  console.error('  Veja a mensagem acima — o conteúdo em content/ não foi publicado.\n');
  process.exit(1);
}

console.log('');
linha();

if (semCommit) {
  console.log('✓ Conteúdo atualizado localmente (--no-commit).');
  process.exit(0);
}

if (!dentroDeRepo()) {
  console.log('✓ Conteúdo atualizado. (Pasta não é um repositório git — nada a commitar.)');
  process.exit(0);
}

const alteracoes = git('status --porcelain content/', { silencioso: true }).trim();

if (!alteracoes) {
  console.log('✓ O documento não mudou desde a última sincronização. Nada a publicar.');
  process.exit(0);
}

console.log('Alterações detectadas em content/:');
console.log(alteracoes);
console.log('');

const { default: manifest } = await import('../content/manifest.json', { with: { type: 'json' } });
const mensagem = `chore(content): sync do Caderno Mestre — ${manifest.totalAulas} aulas, ${manifest.totalQuestoes} questões (v${manifest.contentVersion})`;

git('add content/');
git(`commit -m ${JSON.stringify(mensagem)}`);

if (semPush) {
  console.log('\n✓ Commit criado. Envie quando quiser com: git push');
  process.exit(0);
}

try {
  git('push');
  console.log('');
  linha();
  console.log('✓ PUBLICADO. O Cloudflare Pages vai detectar o commit e fazer o deploy.');
  console.log('  Acompanhe em: Cloudflare → seu projeto → Deployments');
  linha();
} catch {
  console.error('\n! Commit feito, mas o push falhou (sem rede ou sem permissão).');
  console.error('  Tente novamente com: git push\n');
  process.exit(1);
}
