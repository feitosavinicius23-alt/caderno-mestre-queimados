import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Raiz do repositório. */
export const ROOT = path.resolve(here, '..', '..');

export const CONTENT_DIR = path.join(ROOT, 'content');
export const LESSONS_DIR = path.join(CONTENT_DIR, 'aulas');
export const QUESTIONS_DIR = path.join(CONTENT_DIR, 'questoes');
export const REVIEWS_DIR = path.join(CONTENT_DIR, 'revisoes');
export const SOURCE_DIR = path.join(CONTENT_DIR, 'source');

export const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
export const METADATA_PATH = path.join(CONTENT_DIR, 'metadata.json');
export const SUBJECTS_PATH = path.join(CONTENT_DIR, 'disciplinas.json');
export const SEARCH_INDEX_PATH = path.join(CONTENT_DIR, 'search-index.json');
export const SYNC_HISTORY_PATH = path.join(CONTENT_DIR, 'sync-history.json');

export const PUBLIC_DIR = path.join(ROOT, 'public');
export const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG_CONTENT.md');

export const SITE_URL = process.env.SITE_URL || 'https://caderno-mestre-queimados.pages.dev';

/* ---------------- Documento fonte (Caderno Mestre) ---------------- */

/** ID do Google Doc. Pode ser sobrescrito por variável de ambiente. */
export const DOC_ID =
  process.env.CADERNO_DOC_ID || '17hPAJuQovOshYQGlzFF9-dzUl8kcbqvSD82L-KJPDRY';

/** URL de exportação em texto puro (requer documento público). */
export const docExportUrl = (formato = 'txt') =>
  `https://docs.google.com/document/d/${DOC_ID}/export?format=${formato}`;

/** URL de leitura do documento. */
export const docViewUrl = () => `https://docs.google.com/document/d/${DOC_ID}/edit`;

/** Cópia local da última exportação — é a entrada do parser. */
export const RAW_DOC_PATH = path.join(SOURCE_DIR, '_raw', 'caderno-mestre.txt');

/** Configuração editável de disciplinas (nunca reescrita pelos scripts). */
export const DISCIPLINAS_CONFIG_PATH = path.join(SOURCE_DIR, '_config', 'disciplinas.json');
