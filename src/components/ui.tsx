/** Primitivos de interface reutilizados por toda a aplicação. */
import type { ReactNode } from 'react';
import type { LessonStatus } from '@/types';

export function Barra({ valor, verde = false, rotulo }: { valor: number; verde?: boolean; rotulo?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div
      className={`barra${verde ? ' barra--verde' : ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo ?? `Progresso: ${pct}%`}
    >
      <div className="barra__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

const ROTULO_STATUS: Record<LessonStatus, string> = {
  'nao-iniciada': 'Não iniciada',
  'em-andamento': 'Em andamento',
  concluida: 'Concluída',
  revisada: 'Revisada',
};

const CLASSE_STATUS: Record<LessonStatus, string> = {
  'nao-iniciada': '',
  'em-andamento': ' selo--andamento',
  concluida: ' selo--concluida',
  revisada: ' selo--revisada',
};

export function SeloStatus({ status }: { status: LessonStatus }) {
  return <span className={`selo${CLASSE_STATUS[status]}`}>{ROTULO_STATUS[status]}</span>;
}

export function Stat({ valor, rotulo }: { valor: ReactNode; rotulo: string }) {
  return (
    <div className="stat">
      <span className="stat__valor">{valor}</span>
      <span className="stat__rotulo">{rotulo}</span>
    </div>
  );
}

export function Vazio({ icone = '📭', titulo, texto }: { icone?: string; titulo: string; texto?: string }) {
  return (
    <div className="vazio">
      <span className="vazio__icone" aria-hidden="true">{icone}</span>
      <strong>{titulo}</strong>
      {texto ? <p className="fraco" style={{ marginTop: 6 }}>{texto}</p> : null}
    </div>
  );
}

export function Skeleton({ linhas = 3 }: { linhas?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only" style={{ position: 'absolute', left: -9999 }}>Carregando…</span>
      <div className="skeleton skeleton--titulo" />
      {Array.from({ length: linhas }).map((_, index) => (
        <div key={index} className="skeleton skeleton--bloco" />
      ))}
    </div>
  );
}

export function formatarTempo(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas > 0) return `${horas}h ${minutos}min`;
  if (minutos > 0) return `${minutos}min`;
  return `${Math.max(0, Math.floor(segundos))}s`;
}

export function formatarData(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR');
}

export function formatarDataHora(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
