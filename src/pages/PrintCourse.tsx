/** Versão completa do curso preparada para impressão e exportação em PDF. */
import { useEffect, useState } from 'react';
import type { Lesson } from '@/types';
import { loadLessons, manifest, metadata } from '@/services/content';
import { ContentBlockView } from '@/components/ContentBlock';
import { Skeleton } from '@/components/ui';

export default function PrintCourse() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);

  useEffect(() => {
    let ativo = true;
    loadLessons(manifest.aulas.map((aula) => aula.id)).then((items) => {
      if (ativo) setLessons(items);
    });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!lessons || lessons.length !== manifest.totalAulas) return;
    const anterior = document.title;
    document.title = `${metadata.titulo} — Curso completo`;
    const abrirImpressao = window.setTimeout(() => window.print(), 450);
    return () => {
      window.clearTimeout(abrirImpressao);
      document.title = anterior;
    };
  }, [lessons]);

  if (!lessons) return <Skeleton linhas={8} />;

  return (
    <main className="print-course">
      <header className="print-course__capa">
        <div className="print-course__marca">CADERNO MESTRE</div>
        <h1>{metadata.titulo}</h1>
        <p>{metadata.subtitulo}</p>
        <div className="print-course__resumo">
          {lessons.length} aulas · {manifest.totalQuestoes} questões · {metadata.totalDisciplinas} disciplinas
        </div>
        <p className="print-course__ajuda">Na janela de impressão, escolha “Salvar como PDF”. As cores de destaque devem permanecer ativadas.</p>
      </header>

      {lessons.map((lesson, index) => (
        <article className="aula-impressao" key={lesson.id}>
          <header className="aula-impressao__cabecalho">
            <div className="fraco">{lesson.disciplina} · Aula {lesson.numero}</div>
            <h1>{lesson.titulo}</h1>
            {lesson.assunto ? <p className="suave">{lesson.assunto}</p> : null}
            <div className="fraco">{lesson.tempoEstimadoMin} min · {lesson.questoes.length} questões · {lesson.data}</div>
          </header>

          {lesson.missao ? (
            <section className="missao bloco" aria-label={lesson.missao.titulo}>
              <h3 className="bloco__titulo">🎯 {lesson.missao.titulo}</h3>
              {lesson.missao.descricao ? <p className="suave">{lesson.missao.descricao}</p> : null}
              <ul className="missao__lista">
                {lesson.missao.tarefas.map((tarefa) => (
                  <li key={tarefa.id} className="missao__item missao__item--impressao">
                    <span className="missao__caixa" aria-hidden="true" />
                    <span>{tarefa.texto}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {lesson.conteudo.map((bloco) => (
            <ContentBlockView
              key={bloco.id}
              bloco={bloco}
              mapas={lesson.mapasMentais}
              questoes={lesson.questoes}
              lessonId={lesson.id}
              disciplina={lesson.disciplina}
              assunto={lesson.assunto}
              modoImpressao
            />
          ))}

          {lesson.anotacoes.length > 0 ? (
            <section className="cartao mt">
              <div className="rotulo-secao" style={{ marginTop: 0 }}>Anotações do conteúdo</div>
              {lesson.anotacoes.map((nota) => <p key={nota.id} className="suave">{nota.texto}</p>)}
            </section>
          ) : null}

          <footer className="aula-impressao__rodape">Aula {index + 1} de {lessons.length} · Caderno Mestre</footer>
        </article>
      ))}
    </main>
  );
}
