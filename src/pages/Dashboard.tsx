/** Dashboard (requisitos 18, 19, 40). */
import { Link } from 'react-router-dom';
import { manifest, metadata, lessonHref, subjects } from '@/services/content';
import { useProgressStats, useStore } from '@/hooks/useStore';
import { bucketReviews } from '@/services/spaced-repetition';
import { Barra, Stat, formatarDataHora, formatarTempo } from '@/components/ui';

export default function Dashboard() {
  const { state } = useStore();
  const stats = useProgressStats();
  const revisoes = bucketReviews(state.revisoes);
  const pendentes = revisoes.atrasadas.length + revisoes.hoje.length;

  const ultimaEntry = state.ultimaAula ? manifest.aulas.find((a) => a.id === state.ultimaAula) : undefined;
  const proxima =
    manifest.aulas.find((a) => {
      const p = state.progresso[a.id];
      return !p || p.status === 'nao-iniciada' || p.status === 'em-andamento';
    }) ?? manifest.aulas[0];

  const alvo = ultimaEntry ?? proxima;
  const progressoAlvo = alvo ? state.progresso[alvo.id] : undefined;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        {metadata.subtitulo}
      </p>

      {alvo ? (
        <Link className="continuar" to={lessonHref(alvo)}>
          <span className="continuar__icone" aria-hidden="true">▶</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="continuar__titulo">
              {progressoAlvo && progressoAlvo.status !== 'nao-iniciada' ? 'Continuar estudando' : 'Começar a estudar'}
            </span>
            <span className="continuar__aula" style={{ display: 'block' }}>
              Aula {alvo.numero} — {alvo.titulo}
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              {alvo.disciplina}
              {progressoAlvo?.scrollRatio ? ` · ${Math.round(progressoAlvo.scrollRatio * 100)}% lido` : ''}
            </span>
          </span>
        </Link>
      ) : null}

      <div className="rotulo-secao">Progresso geral</div>
      <div className="cartao">
        <div className="linha linha--entre" style={{ marginBottom: 10 }}>
          <strong>{stats.concluidas} de {stats.total} aulas concluídas</strong>
          <span className="selo">{stats.percentual}%</span>
        </div>
        <Barra valor={stats.percentual} verde={stats.percentual === 100} rotulo="Progresso geral do curso" />
      </div>

      <div className="rotulo-secao">Seus números</div>
      <div className="grade grade--2 grade--4">
        <div className="cartao"><Stat valor={stats.concluidas} rotulo="Aulas concluídas" /></div>
        <div className="cartao"><Stat valor={manifest.totalAulas} rotulo="Aulas disponíveis" /></div>
        <div className="cartao"><Stat valor={subjects.length} rotulo="Disciplinas" /></div>
        <div className="cartao"><Stat valor={stats.questoesResolvidas} rotulo="Questões resolvidas" /></div>
        <div className="cartao"><Stat valor={`${stats.taxaAcerto}%`} rotulo="Percentual de acertos" /></div>
        <div className="cartao"><Stat valor={formatarTempo(stats.tempoSeg)} rotulo="Tempo estudado" /></div>
        <div className="cartao"><Stat valor={pendentes} rotulo="Revisões pendentes" /></div>
        <div className="cartao"><Stat valor={`${stats.sequencia} dia${stats.sequencia === 1 ? '' : 's'}`} rotulo="Sequência de estudo" /></div>
      </div>

      {pendentes > 0 ? (
        <>
          <div className="rotulo-secao">Atenção</div>
          <Link className="cartao cartao--clique" to="/revisoes">
            <div className="linha linha--entre">
              <span>
                <strong>🔁 {pendentes} revisão{pendentes === 1 ? '' : 'ões'} para hoje</strong>
                {revisoes.atrasadas.length ? (
                  <span className="selo selo--atrasada" style={{ marginLeft: 8 }}>
                    {revisoes.atrasadas.length} atrasada{revisoes.atrasadas.length === 1 ? '' : 's'}
                  </span>
                ) : null}
              </span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        </>
      ) : null}

      <div className="rotulo-secao">Últimos conteúdos adicionados</div>
      <div className="empilha">
        {metadata.recentes.slice(0, 5).map((item) => {
          const entry = manifest.aulas.find((a) => a.id === item.id);
          if (!entry) return null;
          return (
            <Link key={item.id} className="cartao cartao--clique" to={lessonHref(entry)}>
              <div className="linha linha--entre">
                <div style={{ minWidth: 0 }}>
                  <div className="fraco">{item.disciplina}</div>
                  <strong>Aula {entry.numero} — {item.titulo}</strong>
                </div>
                <span className="selo nowrap">{item.ultimaAtualizacao}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="fraco mt centro">
        Conteúdo atualizado em {formatarDataHora(metadata.atualizadoEm)} · versão{' '}
        <span className="mono">v{metadata.contentVersion}</span>
      </p>
    </>
  );
}
