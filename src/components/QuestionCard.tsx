/**
 * Questão interativa (requisitos 25, 26, 27).
 * O gabarito permanece oculto até o usuário responder ou pedir "Ver gabarito".
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson, Question } from '@/types';
import { useStore } from '@/hooks/useStore';
import { findEntryById, lessonHref } from '@/services/content';

interface Props {
  question: Question;
  lessonId: string;
  disciplina: string;
  assunto: string;
  mostrarOrigem?: boolean;
}

export function QuestionCard({ question, lessonId, disciplina, assunto, mostrarOrigem = false }: Props) {
  const { state, dispatch } = useStore();
  const registro = state.respostas[question.id];
  const [escolhida, setEscolhida] = useState<string | null>(registro?.escolhida ?? null);
  const [revelado, setRevelado] = useState(false);

  const respondida = Boolean(registro);
  const mostrarGabarito = respondida || revelado;
  const acertou = registro?.acertou ?? null;
  const favoritoId = `questao:${question.id}`;
  const favoritado = Boolean(state.favoritos[favoritoId]);
  const entry = mostrarOrigem ? findEntryById(lessonId) : undefined;

  function responder() {
    if (!escolhida || respondida) return;
    // O reducer registra a resposta e, em caso de erro, alimenta o caderno de erros.
    dispatch({
      type: 'answer',
      question,
      escolhida,
      lesson: { id: lessonId, disciplina, assunto } as Lesson,
    });
  }

  function refazer() {
    dispatch({ type: 'resetAnswer', questionId: question.id });
    setEscolhida(null);
    setRevelado(false);
  }

  function classeAlternativa(optionId: string) {
    if (!mostrarGabarito) return escolhida === optionId ? 'alternativa alternativa--selecionada' : 'alternativa';
    if (!question.correctAnswer) return escolhida === optionId ? 'alternativa alternativa--selecionada' : 'alternativa';
    if (optionId === question.correctAnswer) return 'alternativa alternativa--correta';
    if (respondida && acertou === false && optionId === registro?.escolhida) return 'alternativa alternativa--errada';
    return 'alternativa';
  }

  return (
    <article className="questao" id={question.id}>
      <header className="questao__cabecalho">
        <span className="questao__numero">Questão {question.numero}</span>
        <button
          type="button"
          className="icone-btn"
          style={{ width: 34, height: 34 }}
          aria-pressed={favoritado}
          aria-label={favoritado ? 'Remover questão dos favoritos' : 'Favoritar questão'}
          onClick={() =>
            dispatch({
              type: 'toggleFavorite',
              item: {
                id: favoritoId,
                tipo: 'questao',
                lessonId,
                titulo: question.question.slice(0, 90),
                criadoEm: new Date().toISOString(),
              },
            })
          }
        >
          {favoritado ? '★' : '☆'}
        </button>
      </header>

      <p className="questao__enunciado">{question.question}</p>

      <fieldset className="alternativas">
        <legend className="sr-only" style={{ position: 'absolute', left: -9999 }}>
          Alternativas da questão {question.numero}
        </legend>
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={classeAlternativa(option.id)}
            disabled={mostrarGabarito}
            aria-pressed={escolhida === option.id}
            onClick={() => setEscolhida(option.id)}
          >
            <span className="alternativa__letra" aria-hidden="true">{option.id}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </fieldset>

      {!mostrarGabarito ? (
        <div className="linha">
          <button type="button" className="botao" disabled={!escolhida} onClick={responder}>
            Responder
          </button>
          <button type="button" className="botao botao--fantasma" onClick={() => setRevelado(true)}>
            Ver gabarito
          </button>
        </div>
      ) : (
        <>
          {respondida ? (
            <p className={`resultado ${acertou === true ? 'resultado--ok' : acertou === false ? 'resultado--erro' : ''}`}>
              <span aria-hidden="true">{acertou === true ? '✓' : acertou === false ? '✕' : '•'}</span>
              {acertou === true ? 'CORRETO' : acertou === false ? 'INCORRETO' : 'RESPOSTA REGISTRADA'}
            </p>
          ) : null}

          <div className="gabarito">
            <div className="gabarito__rotulo">Gabarito</div>
            <p style={{ marginBottom: question.explanation ? '0.7em' : 0 }}>
              <strong>{question.correctAnswer ? `Alternativa correta: ${question.correctAnswer}` : 'Gabarito ainda não disponível'}</strong>
              {respondida && acertou === false ? ` — sua resposta: ${registro?.escolhida}` : ''}
            </p>
            {question.explanation ? <p style={{ margin: 0 }}>{question.explanation}</p> : (
              !question.correctAnswer ? <p style={{ margin: 0 }}>Esta questão foi registrada, mas o documento ainda não fornece o gabarito comentado.</p> : null
            )}
            {question.legalBasis ? (
              <p className="fraco" style={{ margin: '0.7em 0 0' }}>
                <strong>Base legal (texto estudado):</strong> {question.legalBasis}
              </p>
            ) : null}
            {question.topic ? (
              <p className="fraco" style={{ margin: '0.7em 0 0' }}>
                Assunto: {question.topic}
              </p>
            ) : null}
            {entry ? (
              <p className="fraco" style={{ margin: '0.4em 0 0' }}>
                Aula relacionada: <Link to={lessonHref(entry)}>{entry.titulo}</Link>
              </p>
            ) : null}
          </div>

          {respondida && acertou === false ? (
            <p className="fraco mt" style={{ marginBottom: 0 }}>
              📕 Adicionada ao <Link to="/erros">Caderno de Erros</Link>.
            </p>
          ) : null}

          <div className="linha mt">
            <button type="button" className="botao botao--secundario" onClick={refazer}>
              Refazer questão
            </button>
          </div>
        </>
      )}
    </article>
  );
}
