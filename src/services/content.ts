/**
 * CAMADA DE ACESSO AO CONTEÚDO.
 *
 * REQUISITO 65/66: as aulas são descobertas automaticamente via import.meta.glob.
 * Basta adicionar /content/aulas/<arquivo>.json e rodar sync-content — nenhuma
 * rota, menu, componente ou card precisa ser editado.
 */
import type {
  ContentMetadata, Lesson, SearchIndex, Subject, SyncLogEntry, SyncManifest,
} from '@/types';

import manifestJson from '../../content/manifest.json';
import metadataJson from '../../content/metadata.json';
import subjectsJson from '../../content/disciplinas.json';

export const manifest = manifestJson as SyncManifest;
export const metadata = metadataJson as ContentMetadata;
export const subjects = subjectsJson as Subject[];

/** Mapa "caminho do arquivo" -> loader dinâmico (code splitting por aula). */
const lessonLoaders = import.meta.glob<{ default: Lesson }>('../../content/aulas/*.json');

/** Índice auxiliar: id da aula -> loader. */
const loaderById = new Map<string, () => Promise<{ default: Lesson }>>();
for (const [path, loader] of Object.entries(lessonLoaders)) {
  const fileName = path.split('/').pop() ?? '';
  const id = fileName.replace(/\.json$/, '');
  loaderById.set(id, loader);
}

const cache = new Map<string, Lesson>();

export function lessonEntries() {
  return manifest.aulas;
}

export function subjectSlugOf(disciplina: string): string {
  const found = subjects.find((s) => s.nome === disciplina);
  if (found) return found.slug;
  return disciplina
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function lessonHref(entry: { disciplina: string; slug: string }): string {
  return `/aulas/${subjectSlugOf(entry.disciplina)}/${entry.slug}`;
}

export function findEntryBySlug(subjectSlug: string, slug: string) {
  return manifest.aulas.find((a) => subjectSlugOf(a.disciplina) === subjectSlug && a.slug === slug);
}

export function findEntryById(id: string) {
  return manifest.aulas.find((a) => a.id === id);
}

/**
 * Carrega uma aula sob demanda.
 * Requisito 79: conteúdo inválido não derruba o site — devolve null e loga.
 */
export async function loadLesson(id: string): Promise<Lesson | null> {
  const cached = cache.get(id);
  if (cached) return cached;

  const loader = loaderById.get(id);
  if (!loader) {
    console.warn(`[conteudo] Aula não encontrada: ${id}`);
    return null;
  }
  try {
    const mod = await loader();
    const lesson = mod.default;
    if (!lesson || !Array.isArray(lesson.conteudo)) {
      console.error(`[conteudo] Estrutura inválida na aula ${id}`);
      return null;
    }
    cache.set(id, lesson);
    return lesson;
  } catch (error) {
    console.error(`[conteudo] Falha ao carregar a aula ${id}`, error);
    return null;
  }
}

/** Carrega várias aulas em paralelo (usado por simulados e estatísticas). */
export async function loadLessons(ids: string[]): Promise<Lesson[]> {
  const results = await Promise.all(ids.map(loadLesson));
  return results.filter((lesson): lesson is Lesson => lesson !== null);
}

let searchIndexPromise: Promise<SearchIndex> | null = null;
/** Índice de busca carregado sob demanda (não entra no bundle inicial). */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (!searchIndexPromise) {
    searchIndexPromise = import('../../content/search-index.json').then(
      (mod) => mod.default as SearchIndex,
    );
  }
  return searchIndexPromise;
}

let historyPromise: Promise<SyncLogEntry[]> | null = null;
export function loadSyncHistory(): Promise<SyncLogEntry[]> {
  if (!historyPromise) {
    historyPromise = import('../../content/sync-history.json')
      .then((mod) => ((mod.default as { registros?: SyncLogEntry[] }).registros ?? []))
      .catch(() => []);
  }
  return historyPromise;
}

/** Todas as questões de todas as aulas (carregamento progressivo). */
export async function loadAllQuestions() {
  const lessons = await loadLessons(manifest.aulas.map((a) => a.id));
  return lessons.flatMap((lesson) => lesson.questoes);
}
