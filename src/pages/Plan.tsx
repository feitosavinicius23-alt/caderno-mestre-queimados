/** Plano de estudos: hoje, semana, próximas aulas e revisões (requisito 34). */
import { Link } from 'react-router-dom';
import { lessonHref, manifest } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { addDays, bucketReviews, todayIso } from '@/services/spaced-repetition';
import { Vazio, formatarData } from '@/components/ui';

export default function Plan() {
  const { state } = useStore();
  const hoje = todayIso();
  const fimSemana = addDays(hoje, 7);
  const buckets = bucketReviews(state.revisoes, hoje);

  const proximas = manifest.aulas
    .filter((aula) => {
      const status = state.progresso[aula.id]?.status;
      return status !== 'concluida' && status !== 'revisada';
    })
    .slice(0, 6);

  const revisoesSemana = buckets.proximas.filter((r) => r.agendadaPara <= fimSemana);
  const hojeTotal = buckets.atrasadas.length + buckets.hoje.length;

  return (
    <>
      <h1>Plano de Estudos</h1>

      <div className="rotulo-secao">Hoje — {formatarData(hoje)}</div>
      <div className="cartao">
        {hojeTotal > 0 ? (
          <p style={{ margin: 0 }}>
            🔁 <strong>{hojeTotal}</strong> revisão(ões) para hoje
            {buckets.atrasadas.length ? ` (${buckets.atrasadas.length} atrasada(s))` : ''} ·{' '}
            <Link to="/revisoes">abrir</Link>
          </p>
        ) : (
          <p style={{ margin: 0 }} className="suave">Nenhuma revisão agendada para hoje.</p>
        )}
        {proximas[0] ? (
          <p style={{ margin: '10px 0 0' }}>
            📚 Próxima aula: <Link to={lessonHref(proximas[0])}>Aula {proximas[0].numero} — {proximas[0].titulo}</Link>
          </p>
        ) : null}
      </div>

      <div className="rotulo-secao">Próximos 7 dias</div>
      {revisoesSemana.length === 0 ? (
        <Vazio icone="📅" titulo="Sem revisões nesta semana" />
      ) : (
        <div className="empilha">
          {revisoesSemana.map((review) => {
            const entry = manifest.aulas.find((a) => a.id === review.lessonId);
            if (!entry) return null;
            return (
              <Link key={review.id} className="cartao cartao--clique" to={lessonHref(entry)}>
                <div className="linha linha--entre">
                  <span>
                    <span className="fraco">{entry.disciplina}</span>
                    <br />
                    <strong>Aula {entry.numero} — {entry.titulo}</strong>
                  </span>
                  <span className="selo nowrap">{formatarData(review.agendadaPara)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rotulo-secao">Próximas aulas</div>
      {proximas.length === 0 ? (
        <Vazio icone="🏆" titulo="Todas as aulas concluídas" texto="Foque nas revisões e simulados." />
      ) : (
        <div className="empilha">
          {proximas.map((aula) => (
            <Link key={aula.id} className="cartao cartao--clique" to={lessonHref(aula)}>
              <span className="fraco">{aula.disciplina} · Aula {aula.numero}</span>
              <br />
              <strong>{aula.titulo}</strong>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
