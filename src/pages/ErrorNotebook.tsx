/** Caderno de Erros (requisito 27). */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { findEntryById, lessonHref } from '@/services/content';
import { useErrorEntries, useStore } from '@/hooks/useStore';
import { Stat, Vazio, formatarData } from '@/components/ui';

export default function ErrorNotebook() {
  const entradas = useErrorEntries();
  const { dispatch } = useStore();
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);

  const visiveis = useMemo(
    () => entradas.filter((entrada) => mostrarResolvidos || !entrada.resolvido),
    [entradas, mostrarResolvidos],
  );

  const porDisciplina = useMemo(() => {
    const map = new Map<string, number>();
    for (const entrada of entradas) {
      map.set(entrada.disciplina, (map.get(entrada.disciplina) ?? 0) + entrada.numeroErros);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [entradas]);

  return (
    <>
      <h1>Caderno de Erros</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Toda questão errada entra aqui automaticamente.
      </p>

      <div className="grade grade--3">
        <div className="cartao"><Stat valor={entradas.length} rotulo="Questões" /></div>
        <div className="cartao">
          <Stat valor={entradas.reduce((s, e) => s + e.numeroErros, 0)} rotulo="Erros totais" />
        </div>
        <div className="cartao">
          <Stat valor={entradas.filter((e) => e.resolvido).length} rotulo="Resolvidas" />
        </div>
      </div>

      {porDisciplina.length > 0 ? (
        <>
          <div className="rotulo-secao">Erros por disciplina</div>
          <div className="cartao">
            {porDisciplina.map(([disciplina, total]) => (
              <div key={disciplina} className="linha linha--entre" style={{ marginBottom: 6 }}>
                <span>{disciplina}</span>
                <span className="selo">{total}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="rotulo-secao">
        <label className="linha" style={{ textTransform: 'none', letterSpacing: 0 }}>
          <input
            type="checkbox"
            checked={mostrarResolvidos}
            onChange={(e) => setMostrarResolvidos(e.target.checked)}
          />
          Mostrar também as já resolvidas
        </label>
      </div>

      {visiveis.length === 0 ? (
        <Vazio
          icone="🎉"
          titulo={entradas.length ? 'Nenhum erro pendente' : 'Nenhum erro registrado'}
          texto={entradas.length ? 'Você já revisou todos.' : 'Responda questões para começar a alimentar o caderno.'}
        />
      ) : (
        <div className="empilha">
          {visiveis.map((entrada) => {
            const entry = findEntryById(entrada.lessonId);
            return (
              <article key={entrada.questionId} className="cartao">
                <div className="linha linha--entre" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="fraco">{entrada.disciplina} · {entrada.assunto}</div>
                    {entry ? <strong>{entry.titulo}</strong> : <strong>{entrada.lessonId}</strong>}
                  </div>
                  <span className="selo selo--atrasada nowrap">
                    {entrada.numeroErros} erro{entrada.numeroErros === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="linha mt" style={{ gap: 16 }}>
                  <span className="fraco">Você marcou: <strong style={{ color: 'var(--vermelho-600)' }}>{entrada.respostaEscolhida}</strong></span>
                  <span className="fraco">Correta: <strong style={{ color: 'var(--verde-600)' }}>{entrada.respostaCorreta}</strong></span>
                </div>

                {entrada.explicacao ? (
                  <div className="gabarito mt">
                    <div className="gabarito__rotulo">Explicação</div>
                    <p style={{ margin: 0 }}>{entrada.explicacao}</p>
                  </div>
                ) : null}

                <div className="linha mt">
                  <span className="fraco">Último erro: {formatarData(entrada.data)}</span>
                  {entrada.revisoesFeitas > 0 ? (
                    <span className="selo">{entrada.revisoesFeitas} revisão(ões)</span>
                  ) : null}
                </div>

                <div className="linha mt">
                  {entry ? (
                    <Link className="botao botao--secundario" to={`${lessonHref(entry)}#${entrada.questionId}`}>
                      Ver na aula
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="botao botao--fantasma"
                    onClick={() =>
                      dispatch({ type: 'resolveError', questionId: entrada.questionId, resolvido: !entrada.resolvido })
                    }
                  >
                    {entrada.resolvido ? 'Reabrir' : '✓ Marcar como resolvida'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
