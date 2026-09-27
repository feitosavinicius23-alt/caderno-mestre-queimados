/**
 * PERSISTÊNCIA LOCAL (requisito 47) — IndexedDB com fallback em localStorage.
 * Sem login, sem servidor, sem custo.
 *
 * Requisito 50: toda leitura/escrita passa por este módulo, de modo que trocar
 * por Supabase no futuro signifique reimplementar apenas load()/save().
 */
import type { UserState } from '@/types';

const DB_NAME = 'caderno-mestre';
const DB_VERSION = 1;
const STORE = 'estado';
const KEY = 'usuario';
const LS_KEY = 'caderno-mestre:estado';

export const STATE_VERSION = 1;

export function createEmptyState(): UserState {
  return {
    versao: STATE_VERSION,
    progresso: {},
    respostas: {},
    erros: {},
    revisoes: [],
    favoritos: {},
    notas: {},
    missoes: {},
    settings: { tema: 'auto', fontSize: 17, lineHeight: 1.75, larguraLeitura: 'media' },
    ultimaAula: null,
    sequencia: { dias: 0, ultimoDia: null },
    diasEstudados: [],
    contentVersionVista: 0,
  };
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      // Se o navegador bloquear (modo privado antigo), não trava a aplicação.
      setTimeout(() => resolve(request.readyState === 'done' ? request.result : null), 2500);
    } catch {
      resolve(null);
    }
  });
}

function fromLocalStorage(): UserState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UserState) : null;
  } catch {
    return null;
  }
}

function toLocalStorage(state: UserState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* cota cheia: ignora silenciosamente, o app segue funcionando em memória */
  }
}

/** Migração defensiva: campos novos nunca quebram um estado antigo. */
export function migrate(state: Partial<UserState> | null): UserState {
  const base = createEmptyState();
  if (!state || typeof state !== 'object') return base;
  return {
    ...base,
    ...state,
    versao: STATE_VERSION,
    settings: { ...base.settings, ...(state.settings ?? {}) },
    sequencia: { ...base.sequencia, ...(state.sequencia ?? {}) },
    progresso: state.progresso ?? {},
    respostas: state.respostas ?? {},
    erros: state.erros ?? {},
    favoritos: state.favoritos ?? {},
    notas: state.notas ?? {},
    missoes: state.missoes ?? {},
    revisoes: Array.isArray(state.revisoes) ? state.revisoes : [],
    diasEstudados: Array.isArray(state.diasEstudados) ? state.diasEstudados : [],
  };
}

export async function loadState(): Promise<UserState> {
  const db = await openDb();
  if (!db) return migrate(fromLocalStorage());

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(migrate((request.result as UserState) ?? fromLocalStorage()));
      request.onerror = () => resolve(migrate(fromLocalStorage()));
    } catch {
      resolve(migrate(fromLocalStorage()));
    }
  });
}

export async function saveState(state: UserState): Promise<void> {
  toLocalStorage(state); // espelho síncrono, resiste a fechamento abrupto
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(state, KEY);
  } catch {
    /* já persistido em localStorage */
  }
}

/** Requisito 48: exportar progresso. */
export function exportState(state: UserState): string {
  return JSON.stringify(
    { app: 'caderno-mestre-queimados', exportadoEm: new Date().toISOString(), estado: state },
    null,
    2,
  );
}

/** Requisito 49: importar progresso, com validação. */
export function parseImportedState(raw: string): UserState {
  const parsed = JSON.parse(raw) as { app?: string; estado?: UserState } | UserState;
  const candidate =
    parsed && typeof parsed === 'object' && 'estado' in parsed && parsed.estado
      ? parsed.estado
      : (parsed as UserState);
  if (!candidate || typeof candidate !== 'object') throw new Error('Arquivo inválido.');
  return migrate(candidate);
}
