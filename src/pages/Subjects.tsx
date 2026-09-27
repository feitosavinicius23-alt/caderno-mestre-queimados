/** Disciplinas — extraídas automaticamente do conteúdo (requisito 21). */
import { Link, useParams } from 'react-router-dom';
import { lessonHref, manifest, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Barra, SeloStatus, Stat, Vazio } from '@/components/ui';
import type { LessonStatus } from '@/types';

export function SubjectsList() {
  const { state } = useStore();

  return (
    <>
      <h1>Disciplinas</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Extraídas automaticamente do Caderno Mestre.
      </p>

      <div className="grade grade--auto">
        {subjects.map((subject) => {
          const concluidas = subject.aulas.filter((aula) => {
            const status = state.progresso[aula.id]?.status;
            return status === 'concluida' || status === 'revisada';
          }).length;
          const pct = subject.totalAulas ? (concluidas / subject.totalAulas) * 100 : 0;
          return (
            <Link key={subject.id} className="cartao cartao--clique" to={`/disciplinas/${subject.slug}`}>
              <strong>{subject.nome}</strong>
              <div className="fraco" style={{ margin: '4px 0 10px' }}>
                {subject.totalAulas} aulas · {subject.totalQuestoes} questões
              </div>
              <Barra valor={pct} verde={pct === 100} rotulo={`Progresso em ${subject.nome}`} />
              <div className="fraco" style={{ marginTop: 6 }}>{concluidas}/{subject.totalAulas} concluídas</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function SubjectPage() {
  const { slug = '' } = useParams();
  const { state } = useStore();
  const subject = subjects.find((s) => s.slug === slug);

  if (!subject) {
    return <Vazio icone="🗂️" titulo="Disciplina não encontrada" texto="Veja a lista completa em Disciplinas." />;
  }

  const entries = manifest.aulas.filter((a) => a.disciplina === subject.nome);
  const concluidas = entries.filter((a) => {
    const status = state.progresso[a.id]?.status;
    return status === 'concluida' || status === 'revisada';
  }).length;
  const pct = entries.length ? (concluidas / entries.length) * 100 : 0;

  const respostas = Object.values(state.respostas).filter((r) => r.subject === subject.nome);
  const acertos = respostas.filter((r) => r.acertou).length;
  const revisoesPendentes = state.revisoes.filter(
    (r) => !r.concluidaEm && entries.some((e) => e.id === r.lessonId),
  ).length;

  return (
    <>
      <nav aria-label="Trilha" className="fraco" style={{ marginBottom: 8 }}>
        <Link to="/disciplinas">Disciplinas</Link> › {subject.nome}
      </nav>
      <h1>{subject.nome}</h1>

      <div className="cartao">
        <div className="linha linha--entre" style={{ marginBottom: 10 }}>
          <strong>{concluidas} de {entries.length} aulas concluídas</strong>
          <span className="selo">{Math.round(pct)}%</span>
        </div>
        <Barra valor={pct} verde={pct === 100} rotulo={`Progresso em ${subject.nome}`} />
      </div>

      <div className="rotulo-secao">Estatísticas</div>
      <div className="grade grade--2 grade--4">
        <div className="cartao"><Stat valor={subject.totalAulas} rotulo="Aulas" /></div>
        <div className="cartao"><Stat valor={subject.totalQuestoes} rotulo="Questões" /></div>
        <div className="cartao">
          <Stat valor={respostas.length ? `${Math.round((acertos / respostas.length) * 100)}%` : '—'} rotulo="Acertos" />
        </div>
        <div className="cartao"><Stat valor={revisoesPendentes} rotulo="Revisões" /></div>
      </div>

      {subject.assuntos.length > 0 ? (
        <>
          <div className="rotulo-secao">Assuntos</div>
          <div className="chips">
            {subject.assuntos.map((assunto) => (
              <span key={assunto} className="chip">{assunto}</span>
            ))}
          </div>
        </>
      ) : null}

      <div className="rotulo-secao">Aulas</div>
      <div className="empilha">
        {entries.map((aula) => {
          const status: LessonStatus = state.progresso[aula.id]?.status ?? 'nao-iniciada';
          return (
            <Link key={aula.id} className="cartao cartao--clique" to={lessonHref(aula)}>
              <div className="linha linha--entre" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="fraco">Aula {aula.numero}</div>
                  <strong>{aula.titulo}</strong>
                </div>
                <SeloStatus status={status} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default SubjectsList;
