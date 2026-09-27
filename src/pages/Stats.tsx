/** Estatísticas (requisito 38). */
import { useMemo } from 'react';
import { manifest, subjects } from '@/services/content';
import { useProgressStats, useStore } from '@/hooks/useStore';
import { Barra, Stat, Vazio, formatarTempo } from '@/components/ui';

export default function Stats() {
  const { state } = useStore();
  const stats = useProgressStats();

  const porDisciplina = useMemo(() => {
    return subjects.map((subject) => {
      const entries = manifest.aulas.filter((a) => a.disciplina === subject.nome);
      const concluidas = entries.filter((a) => {
        const status = state.progresso[a.id]?.status;
        return status === 'concluida' || status === 'revisada';
      }).length;
      const respostas = Object.values(state.respostas).filter((r) => r.subject === subject.nome);
      const acertos = respostas.filter((r) => r.acertou).length;
      const tempo = entries.reduce((sum, a) => sum + (state.progresso[a.id]?.tempoEstudoSeg ?? 0), 0);
      return {
        nome: subject.nome,
        total: entries.length,
        concluidas,
        pct: entries.length ? (concluidas / entries.length) * 100 : 0,
        respostas: respostas.length,
        taxa: respostas.length ? Math.round((acertos / respostas.length) * 100) : null,
        tempo,
      };
    });
  }, [state.progresso, state.respostas]);

  const assuntosComErro = useMemo(() => {
    const map = new Map<string, number>();
    for (const erro of Object.values(state.erros)) {
      const chave = erro.assunto || erro.disciplina;
      map.set(chave, (map.get(chave) ?? 0) + erro.numeroErros);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [state.erros]);

  const revisoesFeitas = state.revisoes.filter((r) => r.concluidaEm).length;

  return (
    <>
      <h1>Estatísticas</h1>

      <div className="grade grade--2 grade--4">
        <div className="cartao"><Stat valor={stats.concluidas} rotulo="Aulas concluídas" /></div>
        <div className="cartao"><Stat valor={stats.questoesResolvidas} rotulo="Questões resolvidas" /></div>
        <div className="cartao"><Stat valor={stats.acertos} rotulo="Acertos" /></div>
        <div className="cartao"><Stat valor={stats.erros} rotulo="Erros" /></div>
        <div className="cartao"><Stat valor={`${stats.taxaAcerto}%`} rotulo="Taxa de acerto" /></div>
        <div className="cartao"><Stat valor={revisoesFeitas} rotulo="Revisões realizadas" /></div>
        <div className="cartao"><Stat valor={formatarTempo(stats.tempoSeg)} rotulo="Tempo estudado" /></div>
        <div className="cartao"><Stat valor={`${stats.sequencia}`} rotulo="Dias em sequência" /></div>
      </div>

      <div className="rotulo-secao">Progresso por disciplina</div>
      <div className="empilha">
        {porDisciplina.map((item) => (
          <div key={item.nome} className="cartao">
            <div className="linha linha--entre" style={{ marginBottom: 8 }}>
              <strong>{item.nome}</strong>
              <span className="selo">{Math.round(item.pct)}%</span>
            </div>
            <Barra valor={item.pct} verde={item.pct === 100} rotulo={`Progresso em ${item.nome}`} />
            <div className="linha fraco" style={{ marginTop: 8, gap: 14 }}>
              <span>{item.concluidas}/{item.total} aulas</span>
              <span>{item.respostas} questões</span>
              {item.taxa !== null ? <span>{item.taxa}% de acerto</span> : null}
              {item.tempo > 0 ? <span>{formatarTempo(item.tempo)}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="rotulo-secao">Assuntos com mais erros</div>
      {assuntosComErro.length === 0 ? (
        <Vazio icone="📊" titulo="Sem erros registrados" texto="Responda questões para gerar este relatório." />
      ) : (
        <div className="cartao">
          {assuntosComErro.map(([assunto, total]) => (
            <div key={assunto} className="linha linha--entre" style={{ marginBottom: 8 }}>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{assunto}</span>
              <span className="selo selo--atrasada nowrap">{total}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
