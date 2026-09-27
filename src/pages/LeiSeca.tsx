/** Lei Seca: todos os dispositivos legais transcritos nas aulas. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryById, lessonHref, loadLessons, manifest, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Skeleton, Vazio } from '@/components/ui';

export default function LeiSeca() {
  const { state, dispatch } = useStore();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [disciplina, setDisciplina] = useState('todas');

  useEffect(() => {
    loadLessons(manifest.aulas.map((a) => a.id)).then(setLessons);
  }, []);

  const itens = useMemo(() => {
    if (!lessons) return [];
    return lessons
      .filter((lesson) => disciplina === 'todas' || lesson.disciplina === disciplina)
      .flatMap((lesson) => lesson.leiSeca.map((item) => ({ item, lesson })));
  }, [lessons, disciplina]);

  if (!lessons) return <Skeleton linhas={3} />;

  return (
    <>
      <h1>Lei Seca</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Dispositivos legais transcritos no Caderno Mestre.
      </p>

      <label className="rotulo-secao" htmlFor="lei-disciplina">Disciplina</label>
      <select id="lei-disciplina" className="campo" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
        <option value="todas">Todas</option>
        {subjects.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
      </select>

      <div className="rotulo-secao">{itens.length} dispositivo(s)</div>

      {itens.length === 0 ? (
        <Vazio icone="§" titulo="Nenhum bloco de lei seca encontrado" />
      ) : (
        <div className="empilha">
          {itens.map(({ item, lesson }) => {
            const entry = findEntryById(lesson.id);
            const favId = `lei:${item.id}`;
            const favoritado = Boolean(state.favoritos[favId]);
            return (
              <article key={item.id} className="lei-seca">
                <div className="linha linha--entre">
                  <span className="lei-seca__rotulo">§ {lesson.disciplina}</span>
                  <button
                    type="button"
                    className="icone-btn"
                    style={{ width: 32, height: 32 }}
                    aria-pressed={favoritado}
                    aria-label={favoritado ? 'Remover dos favoritos' : 'Favoritar dispositivo'}
                    onClick={() =>
                      dispatch({
                        type: 'toggleFavorite',
                        item: {
                          id: favId,
                          tipo: 'lei',
                          lessonId: lesson.id,
                          titulo: item.texto.slice(0, 80),
                          criadoEm: new Date().toISOString(),
                        },
                      })
                    }
                  >
                    {favoritado ? '★' : '☆'}
                  </button>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 10px' }}>{item.texto}</p>
                {entry ? (
                  <p className="fraco" style={{ margin: 0, fontFamily: 'var(--fonte)' }}>
                    <Link to={`${lessonHref(entry)}#${item.id}`}>
                      Aula {entry.numero} — {entry.titulo}
                    </Link>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
