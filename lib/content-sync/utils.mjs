import crypto from 'node:crypto';

/**
 * Remove acentos e normaliza para comparação/slug.
 */
export function deaccent(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera slug estável (kebab-case, sem acentos).
 * REGRA: o slug NUNCA deve ser usado como identidade primária — ver ids.
 */
export function slugify(value) {
  return deaccent(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
    // O corte acima pode deixar um hífen solto no fim — remova DEPOIS de cortar.
    .replace(/-+$/, '');
}

/**
 * Chave canônica de disciplina (usada para compor IDs).
 * "Direito Tributário" -> "direito-tributario"
 */
export function subjectKey(subject) {
  return slugify(subject);
}

/**
 * ID permanente de aula: <disciplina>-aula-<numero em 3 dígitos>.
 * Estável mesmo que o título mude.
 */
export function lessonId(subject, numero) {
  return `${subjectKey(subject)}-aula-${String(numero).padStart(3, '0')}`;
}

/** ID permanente de questão, derivado do ID da aula. */
export function questionId(lessonIdValue, index) {
  return `${lessonIdValue}-q-${String(index).padStart(3, '0')}`;
}

/** Nome de arquivo da aula. */
export function lessonFileName(subject, numero) {
  return `${subjectKey(subject)}-aula-${String(numero).padStart(3, '0')}.json`;
}

/**
 * Normaliza texto para hashing: ignora diferenças irrelevantes
 * (espaços múltiplos, CRLF, espaços à direita) mas preserva o conteúdo.
 */
function normalizeForHash(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

/**
 * Serialização determinística: chaves ordenadas, strings normalizadas.
 */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(normalizeForHash(value));
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

/**
 * Campos voláteis que NÃO entram no hash — senão toda sincronização
 * pareceria uma alteração de conteúdo.
 */
export const HASH_EXCLUDED_FIELDS = new Set([
  '_file',
  'contentHash',
  'ultimaAtualizacao',
  'importadoEm',
  'contentVersion',
  '_meta',
]);

/**
 * Calcula o hash de conteúdo de uma aula (sha256, 16 hex chars).
 * Determinístico: mesma aula => mesmo hash, sempre.
 */
export function computeContentHash(lesson) {
  const payload = {};
  for (const key of Object.keys(lesson)) {
    if (HASH_EXCLUDED_FIELDS.has(key)) continue;
    payload[key] = lesson[key];
  }
  return crypto.createHash('sha256').update(stableStringify(payload), 'utf8').digest('hex').slice(0, 16);
}

/** Hash de uma string qualquer (usado para o hash global do conteúdo). */
export function hashString(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex').slice(0, 16);
}

/** Data ISO curta (YYYY-MM-DD). */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Timestamp ISO completo. */
export function nowIso() {
  return new Date().toISOString();
}

/** Estimativa de tempo de leitura em minutos (~200 palavras/min). */
export function estimateMinutes(text) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Ordenação estável de aulas: disciplina, depois número. */
export function compareLessons(a, b) {
  const sa = deaccent(a.disciplina || '').toLowerCase();
  const sb = deaccent(b.disciplina || '').toLowerCase();
  if (sa !== sb) return sa < sb ? -1 : 1;
  return (a.numero || 0) - (b.numero || 0);
}
