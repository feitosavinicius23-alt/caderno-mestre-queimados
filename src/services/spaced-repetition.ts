/**
 * REVISÃO ESPAÇADA (requisito 30): 24 horas, 7 dias, 21 dias, 30 dias.
 */
import type { ReviewItem } from '@/types';

export const INTERVALOS_DIAS = [1, 7, 21, 30];

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Gera o calendário de revisões de uma aula concluída. */
export function scheduleReviews(lessonId: string, baseDate = todayIso()): ReviewItem[] {
  return INTERVALOS_DIAS.map((dias, index) => ({
    id: `${lessonId}-rev-${index + 1}`,
    lessonId,
    etapa: index + 1,
    agendadaPara: addDays(baseDate, dias),
    concluidaEm: null,
  }));
}

export interface ReviewBuckets {
  atrasadas: ReviewItem[];
  hoje: ReviewItem[];
  proximas: ReviewItem[];
  concluidas: ReviewItem[];
}

export function bucketReviews(reviews: ReviewItem[], reference = todayIso()): ReviewBuckets {
  const buckets: ReviewBuckets = { atrasadas: [], hoje: [], proximas: [], concluidas: [] };
  for (const review of reviews) {
    if (review.concluidaEm) buckets.concluidas.push(review);
    else if (review.agendadaPara < reference) buckets.atrasadas.push(review);
    else if (review.agendadaPara === reference) buckets.hoje.push(review);
    else buckets.proximas.push(review);
  }
  const byDate = (a: ReviewItem, b: ReviewItem) => a.agendadaPara.localeCompare(b.agendadaPara);
  buckets.atrasadas.sort(byDate);
  buckets.hoje.sort(byDate);
  buckets.proximas.sort(byDate);
  return buckets;
}

/** Sequência de dias estudados consecutivos (requisito 18). */
export function computeStreak(diasEstudados: string[], reference = todayIso()): number {
  const days = new Set(diasEstudados);
  let streak = 0;
  let cursor = reference;
  // Se ainda não estudou hoje, a sequência pode continuar válida até ontem.
  if (!days.has(cursor)) cursor = addDays(cursor, -1);
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
