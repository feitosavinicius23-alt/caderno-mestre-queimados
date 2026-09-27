/** Missão do Dia: reúne as missões definidas no Caderno Mestre (requisito 33). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryById, lessonHref, loadLessons, manifest } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { MissionPanel } from '@/components/MissionPanel';
import { Skeleton, Vazio } from '@/components/ui';

export default function Mission() {
  const { state } = useStore();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);

  useEffect(() => {
    loadLessons(manifest.aulas.map((a) => a.id)).then(setLessons);
  }, []);

  if (!lessons) return <Skeleton linhas={3} />;

  const comMissao = lessons.filter((lesson) => lesson.missao);

  // Prioriza a missão da aula em andamento / última acessada.
  const destaque =
    comMissao.find((lesson) => lesson.id === state.ultimaAula) ??
    comMissao.find((lesson) => {
      const status = state.progresso[lesson.id]?.status;
      return status !== 'concluida' && status !== 'revisada';
    }) ??
    comMissao[0];

  if (!destaque) {
    return (
      <>
        <h1>Missão do Dia</h1>
        <Vazio
          icone="🎯"
          titulo="Nenhuma missão no conteúdo atual"
          texto="Quando o Caderno Mestre trouxer MISSÃO DIÁRIA ou MISSÃO DO DIA, ela aparecerá aqui como painel interativo."
        />
      </>
    );
  }

  const outras = comMissao.filter((lesson) => lesson.id !== destaque.id);
  const entryDestaque = findEntryById(destaque.id);

  return (
    <>
      <h1>Missão do Dia</h1>
      {entryDestaque ? (
        <p className="suave" style={{ marginTop: -6 }}>
          Da aula {entryDestaque.numero} — <Link to={lessonHref(entryDestaque)}>{entryDestaque.titulo}</Link>
        </p>
      ) : null}

      {destaque.missao ? <MissionPanel missao={destaque.missao} /> : null}

      {outras.length > 0 ? (
        <>
          <div className="rotulo-secao">Outras missões do Caderno Mestre</div>
          <div className="empilha">
            {outras.map((lesson) => (
              <div key={lesson.id}>
                {lesson.missao ? <MissionPanel missao={lesson.missao} /> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
