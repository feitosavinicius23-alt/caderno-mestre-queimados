import fs from 'node:fs';
import path from 'node:path';
import { LESSONS_DIR } from './paths.mjs';

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(filePath, fallback = undefined) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`JSON inválido em ${filePath}: ${error.message}`);
  }
}

/**
 * Escreve JSON somente se o conteúdo mudou.
 * Evita commits ruidosos (requisito 63: não reescrever arquivos sem motivo).
 * @returns {boolean} true se o arquivo foi alterado
 */
export function writeJsonIfChanged(filePath, data) {
  ensureDir(path.dirname(filePath));
  const next = `${JSON.stringify(data, null, 2)}\n`;
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === next) return false;
  }
  fs.writeFileSync(filePath, next, 'utf8');
  return true;
}

export function writeTextIfChanged(filePath, text) {
  ensureDir(path.dirname(filePath));
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === text) return false;
  fs.writeFileSync(filePath, text, 'utf8');
  return true;
}

/** Lista os caminhos de todos os arquivos de aula. */
export function listLessonFiles() {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR)
    .filter((file) => file.endsWith('.json') && !file.startsWith('_'))
    .sort()
    .map((file) => path.join(LESSONS_DIR, file));
}

/**
 * Carrega todas as aulas do disco.
 * Aulas com JSON inválido são reportadas, não derrubam o processo (requisito 79).
 */
export function loadLessons() {
  const lessons = [];
  const errors = [];
  for (const filePath of listLessonFiles()) {
    try {
      const data = readJson(filePath);
      lessons.push({ ...data, _file: path.basename(filePath) });
    } catch (error) {
      errors.push({ file: path.basename(filePath), message: error.message });
    }
  }
  return { lessons, errors };
}
