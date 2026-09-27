/**
 * Store global do usuário (progresso, respostas, favoritos, revisões...).
 * Context + useReducer, persistido em IndexedDB com debounce.
 */
import {
  createContext, useContext, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode,
} from 'react';
import type {
  AnswerRecord, ErrorEntry, FavoriteItem, Lesson, LessonStatus, Question, Settings, UserNote,
  UserState,
} from '@/types';
import { createEmptyState, loadState, saveState } from '@/services/storage';
import { computeStreak, scheduleReviews, todayIso } from '@/services/spaced-repetition';
import { manifest } from '@/services/content';

type Action =
  | { type: 'hydrate'; state: UserState }
  | { type: 'replace'; state: UserState }
  | { type: 'openLesson'; lessonId: string }
  | { type: 'readProgress'; lessonId: string; ratio: number; blocoId: string | null }
  | { type: 'addStudyTime'; lessonId: string; segundos: number }
  | { type: 'completeLesson'; lessonId: string }
  | { type: 'reopenLesson'; lessonId: string }
  | { type: 'answer'; question: Question; escolhida: string; lesson: Lesson }
  | { type: 'resetAnswer'; questionId: string }
  | { type: 'completeReview'; reviewId: string }
  | { type: 'toggleFavorite'; item: FavoriteItem }
  | { type: 'saveNote'; note: UserNote }
  | { type: 'deleteNote'; noteId: string }
  | { type: 'toggleMissionTask'; missionId: string; lessonId: string; taskId: string }
  | { type: 'resolveError'; questionId: string; resolvido: boolean }
  | { type: 'settings'; settings: Partial<Settings> }
  | { type: 'markNewsSeen' }
  | { type: 'reset' };

function touchDay(state: UserState): UserState {
  const day = todayIso();
  const dias = state.diasEstudados.includes(day)
    ? state.diasEstudados
    : [...state.diasEstudados, day].sort();
  return { ...state, diasEstudados: dias, sequencia: { dias: computeStreak(dias), ultimoDia: day } };
}

function ensureProgress(state: UserState, lessonId: string) {
  return (
    state.progresso[lessonId] ?? {
      lessonId,
      status: 'nao-iniciada' as LessonStatus,
      scrollRatio: 0,
      blocoAtual: null,
      iniciadaEm: null,
      concluidaEm: null,
      tempoEstudoSeg: 0,
    }
  );
}

function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case 'hydrate':
    case 'replace':
      return action.state;

    case 'openLesson': {
      const current = ensureProgress(state, action.lessonId);
      const next = {
        ...current,
        status: current.status === 'nao-iniciada' ? ('em-andamento' as LessonStatus) : current.status,
        iniciadaEm: current.iniciadaEm ?? new Date().toISOString(),
      };
      return touchDay({
        ...state,
        ultimaAula: action.lessonId,
        progresso: { ...state.progresso, [action.lessonId]: next },
      });
    }

    case 'readProgress': {
      const current = ensureProgress(state, action.lessonId);
      if (Math.abs(current.scrollRatio - action.ratio) < 0.02 && current.blocoAtual === action.blocoId) {
        return state;
      }
      return {
        ...state,
        progresso: {
          ...state.progresso,
          [action.lessonId]: {
            ...current,
            scrollRatio: Math.max(current.scrollRatio, action.ratio),
            blocoAtual: action.blocoId,
          },
        },
      };
    }

    case 'addStudyTime': {
      const current = ensureProgress(state, action.lessonId);
      return {
        ...state,
        progresso: {
          ...state.progresso,
          [action.lessonId]: { ...current, tempoEstudoSeg: current.tempoEstudoSeg + action.segundos },
        },
      };
    }

    case 'completeLesson': {
      const current = ensureProgress(state, action.lessonId);
      const already = state.revisoes.some((r) => r.lessonId === action.lessonId);
      return touchDay({
        ...state,
        progresso: {
          ...state.progresso,
          [action.lessonId]: {
            ...current,
            status: 'concluida',
            scrollRatio: 1,
            concluidaEm: new Date().toISOString(),
          },
        },
        // Requisito 30: concluir gera o calendário de revisões.
        revisoes: already ? state.revisoes : [...state.revisoes, ...scheduleReviews(action.lessonId)],
      });
    }

    case 'reopenLesson': {
      const current = ensureProgress(state, action.lessonId);
      return {
        ...state,
        progresso: {
          ...state.progresso,
          [action.lessonId]: { ...current, status: 'em-andamento', concluidaEm: null },
        },
      };
    }

    case 'answer': {
      const { question, escolhida, lesson } = action;
      const acertou = escolhida === question.correctAnswer;
      const previous = state.respostas[question.id];
      const record: AnswerRecord = {
        questionId: question.id,
        lessonId: question.lessonId,
        subject: question.subject || lesson.disciplina,
        escolhida,
        correta: question.correctAnswer,
        acertou,
        respondidaEm: new Date().toISOString(),
        tentativas: (previous?.tentativas ?? 0) + 1,
      };

      const erros = { ...state.erros };
      if (!acertou) {
        // Requisito 27: erro alimenta o caderno de erros automaticamente.
        const existing = erros[question.id];
        erros[question.id] = {
          questionId: question.id,
          lessonId: question.lessonId,
          disciplina: lesson.disciplina,
          assunto: question.topic || lesson.assunto,
          respostaEscolhida: escolhida,
          respostaCorreta: question.correctAnswer,
          explicacao: question.explanation,
          data: new Date().toISOString(),
          numeroErros: (existing?.numeroErros ?? 0) + 1,
          revisoesFeitas: existing?.revisoesFeitas ?? 0,
          resolvido: false,
        };
      } else if (erros[question.id]) {
        erros[question.id] = {
          ...erros[question.id],
          revisoesFeitas: erros[question.id].revisoesFeitas + 1,
        };
      }

      return touchDay({
        ...state,
        respostas: { ...state.respostas, [question.id]: record },
        erros,
      });
    }

    case 'resetAnswer': {
      const respostas = { ...state.respostas };
      delete respostas[action.questionId];
      return { ...state, respostas };
    }

    case 'completeReview': {
      const revisoes = state.revisoes.map((r) =>
        r.id === action.reviewId ? { ...r, concluidaEm: new Date().toISOString() } : r,
      );
      const review = state.revisoes.find((r) => r.id === action.reviewId);
      const progresso = { ...state.progresso };
      if (review) {
        const current = ensureProgress(state, review.lessonId);
        progresso[review.lessonId] = { ...current, status: 'revisada' };
      }
      return touchDay({ ...state, revisoes, progresso });
    }

    case 'toggleFavorite': {
      const favoritos = { ...state.favoritos };
      if (favoritos[action.item.id]) delete favoritos[action.item.id];
      else favoritos[action.item.id] = action.item;
      return { ...state, favoritos };
    }

    case 'saveNote':
      return { ...state, notas: { ...state.notas, [action.note.id]: action.note } };

    case 'deleteNote': {
      const notas = { ...state.notas };
      delete notas[action.noteId];
      return { ...state, notas };
    }

    case 'toggleMissionTask': {
      const key = action.missionId;
      const current = state.missoes[key] ?? {
        missionId: key,
        lessonId: action.lessonId,
        data: todayIso(),
        tarefasConcluidas: [],
      };
      const done = current.tarefasConcluidas.includes(action.taskId)
        ? current.tarefasConcluidas.filter((t) => t !== action.taskId)
        : [...current.tarefasConcluidas, action.taskId];
      return touchDay({ ...state, missoes: { ...state.missoes, [key]: { ...current, tarefasConcluidas: done } } });
    }

    case 'resolveError': {
      const entry = state.erros[action.questionId];
      if (!entry) return state;
      return {
        ...state,
        erros: { ...state.erros, [action.questionId]: { ...entry, resolvido: action.resolvido } },
      };
    }

    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'markNewsSeen':
      return { ...state, contentVersionVista: manifest.contentVersion };

    case 'reset':
      return createEmptyState();

    default:
      return state;
  }
}

interface StoreValue {
  state: UserState;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, createEmptyState);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;
    loadState().then((loaded) => {
      if (!active) return;
      dispatch({ type: 'hydrate', state: loaded });
      hydrated.current = true;
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persistência com debounce — evita escrever a cada scroll.
  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => void saveState(state), 400);
    return () => clearTimeout(timer);
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore deve ser usado dentro de <StoreProvider>.');
  return context;
}

/** Atalhos de leitura mais usados. */
export function useProgressStats() {
  const { state } = useStore();
  return useMemo(() => {
    const total = manifest.totalAulas;
    const values = Object.values(state.progresso);
    const concluidas = values.filter((p) => p.status === 'concluida' || p.status === 'revisada').length;
    const emAndamento = values.filter((p) => p.status === 'em-andamento').length;
    const respostas = Object.values(state.respostas);
    const acertos = respostas.filter((r) => r.acertou).length;
    const tempoSeg = values.reduce((sum, p) => sum + p.tempoEstudoSeg, 0);
    return {
      total,
      concluidas,
      emAndamento,
      percentual: total ? Math.round((concluidas / total) * 100) : 0,
      questoesResolvidas: respostas.length,
      acertos,
      erros: respostas.length - acertos,
      taxaAcerto: respostas.length ? Math.round((acertos / respostas.length) * 100) : 0,
      tempoSeg,
      sequencia: state.sequencia.dias,
    };
  }, [state]);
}

export type { Action };

export function useErrorEntries(): ErrorEntry[] {
  const { state } = useStore();
  return useMemo(
    () => Object.values(state.erros).sort((a, b) => b.data.localeCompare(a.data)),
    [state.erros],
  );
}
