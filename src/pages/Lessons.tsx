/** Lista de aulas com filtros (requisito 37). */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { manifest, lessonHref, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { SeloStatus, Vazio } from '@/components/ui';
import type { LessonStatus } from '@/types';

type Filtro = 'todas' | 'concluidas' | 'nao-concluidas' | 'com-questoes' | 'revisao-pendente' | 'favoritos';

const FILTROS: Array<{ id: Filtro; rotulo: string }> = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'nao-concluidas', rotulo: 'Não concluídas' },
  { id: 'concluidas', rotulo: 'Concluídas' },
  { id: 'com-questoes', rotulo: 'Com questões' },
  { id: 'revisao-pendente', rotulo: 'Revisão pendente' },
  { id: 'favoritos', rotulo: 'Favoritos' },
];

export default function Lessons() {
  const { state } = useStore();
  const [disciplina, setDisciplina] = useState('todas');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const hoje = new Date().toISOString().slice(0, 10);

  const revisaoPendentePorAula = useMemo(() => {
    const set = new Set<string>();
    for (const review of state.revisoes) {
      if (!review.concluidaEm && review.agendadaPara <= hoje) set.add(review.lessonId);
    }
    return set;
  }, [state.revisoes, hoje]);

  const lista = useMemo(() => {
    return manifest.aulas.filter((aula) => {
      if (disciplina !== 'todas' && aula.disciplina !== disciplina) return false;
      const status: LessonStatus = state.progresso[aula.id]?.status ?? 'nao-iniciada';
      switch (filtro) {
        case 'concluidas': return status === 'concluida' || status === 'revisada';
        case 'nao-concluidas': return status !== 'concluida' && status !== 'revisada';
        case 'com-questoes': return aula.totalQuestoes > 0;
        case 'revisao-pendente': return revisaoPendentePorAula.has(aula.id);
        case 'favoritos': return Boolean(state.favoritos[`aula:${aula.id}`]);
        default: return true;
      }
    });
  }, [disciplina, filtro, state.progresso, state.favoritos, revisaoPendentePorAula]);

  return (
    <>
      <h1>Aulas</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        {manifest.totalAulas} aulas · {manifest.totalQuestoes} questões
      </p>
      <div className="linha mt">
        <Link className="botao" to="/curso/imprimir">
          🖨️ Imprimir curso em PDF
        </Link>
      </div>

      <label className="rotulo-secao" htmlFor="filtro-disciplina">Disciplina</label>
      <select
        id="filtro-disciplina"
        className="campo"
        value={disciplina}
        onChange={(event) => setDisciplina(event.target.value)}
      >
        <option value="todas">Todas as disciplinas</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.nome}>
            {subject.nome} ({subject.totalAulas})
          </option>
        ))}
      </select>

      <div className="rotulo-secao">Filtros</div>
      <div className="chips">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip${filtro === item.id ? ' chip--ativo' : ''}`}
            aria-pressed={filtro === item.id}
            onClick={() => setFiltro(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      <div className="rotulo-secao">{lista.length} aula{lista.length === 1 ? '' : 's'}</div>

      {lista.length === 0 ? (
        <Vazio icone="🔎" titulo="Nenhuma aula encontrada" texto="Ajuste os filtros acima." />
      ) : (
        <div className="empilha">
          {lista.map((aula) => {
            const status: LessonStatus = state.progresso[aula.id]?.status ?? 'nao-iniciada';
            return (
              <Link key={aula.id} className="cartao cartao--clique" to={lessonHref(aula)}>
                <div className="linha linha--entre" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="fraco">{aula.disciplina} · Aula {aula.numero}</div>
                    <strong>{aula.titulo}</strong>
                    {aula.assunto ? <div className="fraco">{aula.assunto}</div> : null}
                  </div>
                  <SeloStatus status={status} />
                </div>
                <div className="linha" style={{ marginTop: 10 }}>
                  {aula.totalQuestoes > 0 ? <span className="selo">{aula.totalQuestoes} questões</span> : null}
                  {revisaoPendentePorAula.has(aula.id) ? <span className="selo selo--atrasada">revisão pendente</span> : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
