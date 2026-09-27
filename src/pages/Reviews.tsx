/** Revisões: hoje, atrasadas e próximas (requisito 31). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { findEntryById, lessonHref, loadLessons } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { bucketReviews } from '@/services/spaced-repetition';
import { Vazio, formatarData } from '@/components/ui';
import type { Lesson, ReviewItem } from '@/types';

function CartaoRevisao({ review, lessons }: { review: ReviewItem; lessons: Map<string, Lesson> }) {
  const { state, dispatch } = useStore();
  const entry = findEntryById(review.lessonId);
  const lesson = lessons.get(review.lessonId);
  const [aberto, setAberto] = useState(false);

  if (!entry) return null;

  const errosDaAula = Object.values(state.erros).filter((e) => e.lessonId === review.lessonId);

  return (
    <div className="cartao">
      <div className="linha linha--entre" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div className="fraco">{entry.disciplina} · Aula {entry.numero} · etapa {review.etapa}/4</div>
          <strong>{entry.titulo}</strong>
        </div>
        <span className="selo nowrap">{formatarData(review.agendadaPara)}</span>
      </div>

      <div className="linha mt">
        <button type="button" className="botao botao--secundario" onClick={() => setAberto((v) => !v)}>
          {aberto ? 'Ocultar' : 'Revisar agora'}
        </button>
        <Link className="botao botao--fantasma" to={lessonHref(entry)}>Abrir aula</Link>
        {!review.concluidaEm ? (
          <button
            type="button"
            className="botao"
            onClick={() => dispatch({ type: 'completeReview', reviewId: review.id })}
          >
            ✓ Concluir revisão
          </button>
        ) : (
          <span className="selo selo--concluida">Concluída</span>
        )}
      </div>

      {aberto && lesson ? (
        <div className="mt">
          {lesson.resumo ? (
            <>
              <div className="rotulo-secao">Resumo</div>
              <p className="suave" style={{ whiteSpace: 'pre-wrap' }}>{lesson.resumo}</p>
            </>
          ) : null}

          {lesson.revisao.length > 0 ? (
            <>
              <div className="rotulo-secao">Pontos de revisão</div>
              {lesson.revisao.map((item) => (
                <p key={item.id} className="suave" style={{ whiteSpace: 'pre-wrap' }}>{item.texto}</p>
              ))}
            </>
          ) : null}

          {lesson.mapasMentais.length > 0 ? (
            <>
              <div className="rotulo-secao">Mapa mental</div>
              <p className="suave">{lesson.mapasMentais[0].nos.join(' → ')}</p>
            </>
          ) : null}

          {lesson.leiSeca.length > 0 ? (
            <>
              <div className="rotulo-secao">Lei seca relacionada</div>
              <div className="lei-seca">{lesson.leiSeca[0].texto}</div>
            </>
          ) : null}

          {errosDaAula.length > 0 ? (
            <>
              <div className="rotulo-secao">Questões que você errou</div>
              <p className="suave">
                {errosDaAula.length} questão(ões) desta aula no caderno de erros.{' '}
                <Link to="/erros">Revisar erros</Link>
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function Reviews() {
  const { state } = useStore();
  const buckets = bucketReviews(state.revisoes);
  const [lessons, setLessons] = useState<Map<string, Lesson>>(new Map());

  useEffect(() => {
    const ids = [...new Set(state.revisoes.map((r) => r.lessonId))];
    if (ids.length === 0) return;
    loadLessons(ids).then((loaded) => {
      setLessons(new Map(loaded.map((lesson) => [lesson.id, lesson])));
    });
  }, [state.revisoes]);

  const vazio =
    buckets.atrasadas.length === 0 && buckets.hoje.length === 0 && buckets.proximas.length === 0;

  return (
    <>
      <h1>Revisões</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Revisão espaçada: 24 horas · 7 dias · 21 dias · 30 dias
      </p>

      {vazio ? (
        <Vazio
          icone="🔁"
          titulo="Nenhuma revisão agendada"
          texto="Conclua uma aula para que o sistema agende automaticamente as revisões."
        />
      ) : null}

      {buckets.atrasadas.length > 0 ? (
        <>
          <div className="rotulo-secao">Revisões atrasadas ({buckets.atrasadas.length})</div>
          <div className="empilha">
            {buckets.atrasadas.map((review) => (
              <CartaoRevisao key={review.id} review={review} lessons={lessons} />
            ))}
          </div>
        </>
      ) : null}

      {buckets.hoje.length > 0 ? (
        <>
          <div className="rotulo-secao">Revisões de hoje ({buckets.hoje.length})</div>
          <div className="empilha">
            {buckets.hoje.map((review) => (
              <CartaoRevisao key={review.id} review={review} lessons={lessons} />
            ))}
          </div>
        </>
      ) : null}

      {buckets.proximas.length > 0 ? (
        <>
          <div className="rotulo-secao">Próximas revisões ({buckets.proximas.length})</div>
          <div className="empilha">
            {buckets.proximas.slice(0, 20).map((review) => (
              <CartaoRevisao key={review.id} review={review} lessons={lessons} />
            ))}
          </div>
        </>
      ) : null}

      {buckets.concluidas.length > 0 ? (
        <p className="fraco mt centro">{buckets.concluidas.length} revisão(ões) já concluída(s).</p>
      ) : null}
    </>
  );
}
