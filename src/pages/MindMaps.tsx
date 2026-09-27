/** Mapas mentais de todas as aulas (requisito 69). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryById, lessonHref, loadLessons, manifest } from '@/services/content';
import { MapaMental } from '@/components/ContentBlock';
import { Skeleton, Vazio } from '@/components/ui';

export default function MindMaps() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);

  useEffect(() => {
    loadLessons(manifest.aulas.map((a) => a.id)).then(setLessons);
  }, []);

  if (!lessons) return <Skeleton linhas={3} />;

  const itens = lessons.flatMap((lesson) => lesson.mapasMentais.map((mapa) => ({ mapa, lesson })));

  return (
    <>
      <h1>Mapas Mentais</h1>
      <p className="suave" style={{ marginTop: -6 }}>{itens.length} mapa(s) extraído(s) das aulas.</p>

      {itens.length === 0 ? (
        <Vazio icone="🗺️" titulo="Nenhum mapa mental ainda" texto="Blocos MAPA MENTAL do Caderno Mestre aparecem aqui." />
      ) : (
        <div className="grade grade--auto">
          {itens.map(({ mapa, lesson }) => {
            const entry = findEntryById(lesson.id);
            return (
              <div key={mapa.id} className="cartao">
                <div className="fraco">{lesson.disciplina}</div>
                <MapaMental mapa={mapa} />
                {entry ? (
                  <Link className="botao botao--fantasma" to={`${lessonHref(entry)}#${mapa.id}`}>
                    Ver na aula {entry.numero} →
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
