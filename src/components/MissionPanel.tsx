/** Painel interativo da Missão do Dia (requisito 33). */
import type { StudyMission } from '@/types';
import { useStore } from '@/hooks/useStore';
import { Barra } from './ui';

export function MissionPanel({ missao }: { missao: StudyMission }) {
  const { state, dispatch } = useStore();
  const estado = state.missoes[missao.id];
  const feitas = new Set(estado?.tarefasConcluidas ?? []);
  const total = missao.tarefas.length;
  const concluidas = missao.tarefas.filter((t) => feitas.has(t.id)).length;
  const pct = total ? (concluidas / total) * 100 : 0;

  return (
    <section className="missao bloco" aria-label={missao.titulo}>
      <div className="linha linha--entre">
        <h3 className="bloco__titulo" style={{ margin: 0 }}>
          <span aria-hidden="true">🎯</span> {missao.titulo}
        </h3>
        <span className="selo">{concluidas}/{total}</span>
      </div>

      {missao.descricao ? <p className="suave" style={{ marginTop: 8 }}>{missao.descricao}</p> : null}

      {total > 0 ? (
        <>
          <div style={{ marginTop: 12 }}>
            <Barra valor={pct} verde={concluidas === total} rotulo={`Missão: ${concluidas} de ${total}`} />
          </div>
          <ul className="missao__lista">
            {missao.tarefas.map((tarefa) => {
              const feito = feitas.has(tarefa.id);
              return (
                <li key={tarefa.id}>
                  <button
                    type="button"
                    className={`missao__item${feito ? ' missao__item--feito' : ''}`}
                    aria-pressed={feito}
                    onClick={() =>
                      dispatch({
                        type: 'toggleMissionTask',
                        missionId: missao.id,
                        lessonId: missao.lessonId,
                        taskId: tarefa.id,
                      })
                    }
                  >
                    <span className="missao__caixa" aria-hidden="true">{feito ? '✓' : ''}</span>
                    <span className="missao__texto">{tarefa.texto}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
